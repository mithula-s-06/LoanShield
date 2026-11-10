import os
import sys
import logging
import httpx
from typing import Dict, Any, Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

current_dir = os.path.dirname(os.path.abspath(__file__))
microservices_dir = os.path.dirname(current_dir)
backend_dir = os.path.dirname(microservices_dir)

for path in [current_dir, microservices_dir, backend_dir]:
    if path not in sys.path:
        sys.path.insert(0, path)

from shared.config import get_service_settings

settings = get_service_settings()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [API-GATEWAY] [%(levelname)s]: %(message)s"
)
logger = logging.getLogger("loanshield.api_gateway")

# Global HTTP client with connection pooling
http_client: Optional[httpx.AsyncClient] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global http_client
    logger.info("Initializing LoanShield API Gateway on port 8000...")
    logger.info(f"Target Service URLs:")
    logger.info(f"  - ML Service:          {settings.ML_SERVICE_URL}")
    logger.info(f"  - Application Service: {settings.APPLICATION_SERVICE_URL}")
    logger.info(f"  - Pricing Service:     {settings.PRICING_SERVICE_URL}")
    http_client = httpx.AsyncClient(timeout=30.0)
    yield
    if http_client:
        await http_client.aclose()
    logger.info("LoanShield API Gateway shutdown complete.")

app = FastAPI(
    title="LoanShield Intelligent API Gateway",
    description="Unified API Gateway routing requests to autonomous microservices (ML Risk, Application Underwriting, and Loan Pricing).",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def forward_request(
    target_base_url: str,
    path: str,
    request: Request
) -> Response:
    """Forwards incoming client request to target microservice with streaming/JSON responses"""
    global http_client
    if http_client is None:
        http_client = httpx.AsyncClient(timeout=30.0)
        
    url = f"{target_base_url}{path}"
    headers = dict(request.headers)
    headers.pop("host", None)
    headers.pop("content-length", None)
    
    body = await request.body()
    query_params = dict(request.query_params)
    
    try:
        upstream_resp = await http_client.request(
            method=request.method,
            url=url,
            headers=headers,
            params=query_params,
            content=body
        )
        
        # Filter response headers
        resp_headers = dict(upstream_resp.headers)
        resp_headers.pop("content-encoding", None)
        resp_headers.pop("transfer-encoding", None)
        resp_headers.pop("content-length", None)
        
        return Response(
            content=upstream_resp.content,
            status_code=upstream_resp.status_code,
            headers=resp_headers,
            media_type=upstream_resp.headers.get("content-type")
        )
    except httpx.ConnectError:
        logger.error(f"Failed to connect to microservice at {url}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "detail": f"Upstream service at '{target_base_url}' is currently unavailable. Please verify the service is running."
            }
        )
    except Exception as e:
        logger.error(f"Gateway forwarding error to {url}: {e}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_502_BAD_GATEWAY,
            content={"detail": f"Gateway proxy error: {str(e)}"}
        )

# ==============================================================
# COMPOSITE HEALTH CHECK
# ==============================================================
@app.get("/api/health", tags=["Gateway Health"])
async def aggregate_health():
    """Aggregates health status across all active microservices in the cluster"""
    global http_client
    if http_client is None:
        http_client = httpx.AsyncClient(timeout=5.0)
        
    health_report = {
        "status": "online",
        "service": "LoanShield Microservices Gateway",
        "gateway_port": settings.GATEWAY_PORT,
        "ml_engine_loaded": False,
        "active_models": [],
        "database_connected": False,
        "services": {
            "ml_service": {"status": "unreachable", "url": settings.ML_SERVICE_URL},
            "application_service": {"status": "unreachable", "url": settings.APPLICATION_SERVICE_URL},
            "pricing_service": {"status": "unreachable", "url": settings.PRICING_SERVICE_URL}
        }
    }
    
    # 1. Check ML Service
    try:
        ml_resp = await http_client.get(f"{settings.ML_SERVICE_URL}/health", timeout=3.0)
        if ml_resp.status_code == 200:
            data = ml_resp.json()
            health_report["services"]["ml_service"] = {"status": "healthy", **data}
            health_report["ml_engine_loaded"] = data.get("is_loaded", False)
            health_report["active_models"] = data.get("active_models", [])
    except Exception as e:
        health_report["services"]["ml_service"]["error"] = str(e)
        
    # 2. Check Application Service
    try:
        app_resp = await http_client.get(f"{settings.APPLICATION_SERVICE_URL}/health", timeout=3.0)
        if app_resp.status_code == 200:
            data = app_resp.json()
            health_report["services"]["application_service"] = {"status": "healthy", **data}
            health_report["database_connected"] = data.get("database_connected", False)
    except Exception as e:
        health_report["services"]["application_service"]["error"] = str(e)
        
    # 3. Check Pricing Service
    try:
        price_resp = await http_client.get(f"{settings.PRICING_SERVICE_URL}/health", timeout=3.0)
        if price_resp.status_code == 200:
            data = price_resp.json()
            health_report["services"]["pricing_service"] = {"status": "healthy", **data}
    except Exception as e:
        health_report["services"]["pricing_service"]["error"] = str(e)
        
    return health_report

# ==============================================================
# ROUTING TO ML RISK MICROSERVICE (Port 8001)
# ==============================================================
@app.api_route("/api/predict", methods=["POST"], tags=["ML Risk & Underwriting"])
async def route_predict(request: Request):
    # Route through Application Service so assessment is automatically recorded to underwriting registry
    return await forward_request(settings.APPLICATION_SERVICE_URL, "/predict", request)

@app.api_route("/api/models/metrics", methods=["GET"], tags=["ML Risk Service"])
async def route_model_metrics(request: Request):
    return await forward_request(settings.ML_SERVICE_URL, "/models/metrics", request)

@app.api_route("/api/models/comparison", methods=["GET"], tags=["ML Risk Service"])
async def route_model_comparison(request: Request):
    return await forward_request(settings.ML_SERVICE_URL, "/models/comparison", request)

# ==============================================================
# ROUTING TO APPLICATION & UNDERWRITING SERVICE (Port 8002)
# ==============================================================
@app.api_route("/api/dashboard/stats", methods=["GET"], tags=["Application Service"])
async def route_dashboard_stats(request: Request):
    return await forward_request(settings.APPLICATION_SERVICE_URL, "/dashboard/stats", request)

@app.api_route("/api/applications", methods=["GET", "POST"], tags=["Application Service"])
async def route_applications(request: Request):
    return await forward_request(settings.APPLICATION_SERVICE_URL, "/applications", request)

@app.api_route("/api/applications/{applicant_id}", methods=["GET"], tags=["Application Service"])
async def route_application_detail(applicant_id: str, request: Request):
    return await forward_request(settings.APPLICATION_SERVICE_URL, f"/applications/{applicant_id}", request)

@app.api_route("/api/applications/{applicant_id}/predictions", methods=["GET"], tags=["Application Service"])
async def route_application_predictions(applicant_id: str, request: Request):
    return await forward_request(settings.APPLICATION_SERVICE_URL, f"/applications/{applicant_id}/predictions", request)

# ==============================================================
# ROUTING TO LOAN PRODUCTS & PRICING SERVICE (Port 8003)
# ==============================================================
@app.api_route("/api/loan-products/categories", methods=["GET"], tags=["Pricing Service"])
async def route_pricing_categories(request: Request):
    return await forward_request(settings.PRICING_SERVICE_URL, "/loan-products/categories", request)

@app.api_route("/api/loan-products/calculate-interest", methods=["POST"], tags=["Pricing Service"])
async def route_calculate_interest(request: Request):
    return await forward_request(settings.PRICING_SERVICE_URL, "/loan-products/calculate-interest", request)

# Root service directory
@app.get("/", tags=["Root"])
def root():
    return {
        "service": "LoanShield API Gateway",
        "architecture": "Microservices",
        "docs": "/docs",
        "health": "/api/health",
        "services": {
            "ml_risk_service": f"{settings.ML_SERVICE_URL}/docs",
            "application_service": f"{settings.APPLICATION_SERVICE_URL}/docs",
            "pricing_service": f"{settings.PRICING_SERVICE_URL}/docs"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.GATEWAY_PORT, reload=True)
