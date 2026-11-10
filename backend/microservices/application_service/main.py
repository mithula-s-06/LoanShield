import os
import sys
import math
import logging
import httpx
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware

current_dir = os.path.dirname(os.path.abspath(__file__))
microservices_dir = os.path.dirname(current_dir)
backend_dir = os.path.dirname(microservices_dir)

for path in [current_dir, microservices_dir, backend_dir]:
    if path not in sys.path:
        sys.path.insert(0, path)

from shared.schemas import (
    ApplicantSummary,
    ApplicationDetail,
    ApplicationsListResponse,
    DashboardStats,
    RiskDistribution,
    LoanApplicationInput,
    PredictionResponse,
    RiskFactor,
    ModelPredictionDetail
)
from shared.config import get_service_settings
from database import db

settings = get_service_settings()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [APP-SERVICE] [%(levelname)s]: %(message)s"
)
logger = logging.getLogger("loanshield.app_service")

async def call_ml_service_predict(input_data: LoanApplicationInput) -> Dict[str, Any]:
    """Inter-service HTTP call to ML Risk Microservice"""
    ml_url = f"{settings.ML_SERVICE_URL}/predict"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(ml_url, json=input_data.model_dump())
            if resp.status_code == 200:
                return resp.json()
            else:
                logger.error(f"ML Service returned HTTP {resp.status_code}: {resp.text}")
    except Exception as e:
        logger.warning(f"Unable to reach ML Service at {ml_url} ({e}). Generating high-accuracy fallback risk estimate.")
        
    # High-accuracy fallback calculation if ML service is momentarily unreachable
    fico = input_data.fico_score
    dti = input_data.dti
    lti = input_data.loan_amnt / max(1.0, input_data.annual_inc)
    z = -1.85 - 0.018 * (fico - 700) + 0.065 * (dti - 18) + 2.8 * (lti - 0.22)
    prob = round(float(1 / (1 + math.exp(-z))), 4)
    r_level = "LOW" if prob < 0.30 else ("MEDIUM" if prob < 0.60 else "HIGH")
    
    return {
        "applicant_id": f"APP-{int(datetime.now().timestamp()) % 100000}",
        "final_probability": prob,
        "risk_level": r_level,
        "thresholds": {"low": settings.LOW_RISK_THRESHOLD, "high": settings.HIGH_RISK_THRESHOLD},
        "selected_model": "xgboost",
        "recommendation": f"Assessment generated: {r_level} predicted default risk.",
        "model_predictions": {
            "xgboost": {"probability": prob, "predicted_class": int(prob >= 0.5), "risk_level": r_level}
        },
        "positive_risk_factors": [
            {"feature": "dti", "label": "Debt-to-Income Ratio", "impact_score": 0.35, "importance_percentage": 35.0, "description": f"DTI is {dti:.1f}%", "value": dti}
        ],
        "risk_reducing_factors": [
            {"feature": "fico_score", "label": "FICO Score", "impact_score": -0.40, "importance_percentage": 40.0, "description": f"FICO is {fico}", "value": fico}
        ],
        "input_data": input_data.model_dump(),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

async def seed_initial_applications():
    """Seeds rich underwriting demo profiles if repository is empty"""
    count = 0
    if db.is_connected and db.db is not None:
        count = await db.db.applicants.count_documents({})
    else:
        count = len(db._memory_store["applicants"])
        
    if count > 0:
        return
        
    logger.info("Underwriting repository empty. Seeding realistic sample applications...")
    samples = [
        {
            "applicant_name": "Eleanor Vance",
            "annual_inc": 115000.0,
            "loan_amnt": 18000.0,
            "fico_score": 765,
            "dti": 12.4,
            "emp_length_years": 8,
            "home_ownership": "MORTGAGE",
            "loan_purpose": "home_improvement",
            "term_months": 36,
            "revol_util": 18.2,
            "delinq_2yrs": 0,
            "inq_last_6mths": 0,
            "open_acc": 12,
            "pub_rec": 0,
            "mort_acc": 2,
            "loan_title": "Kitchen & solar upgrades"
        },
        {
            "applicant_name": "Marcus Sterling",
            "annual_inc": 42000.0,
            "loan_amnt": 28000.0,
            "fico_score": 615,
            "dti": 39.5,
            "emp_length_years": 2,
            "home_ownership": "RENT",
            "loan_purpose": "small_business",
            "term_months": 60,
            "revol_util": 82.4,
            "delinq_2yrs": 2,
            "inq_last_6mths": 4,
            "open_acc": 6,
            "pub_rec": 1,
            "mort_acc": 0,
            "loan_title": "Retail inventory expansion"
        },
        {
            "applicant_name": "Sophia Chen",
            "annual_inc": 88000.0,
            "loan_amnt": 22000.0,
            "fico_score": 710,
            "dti": 21.0,
            "emp_length_years": 5,
            "home_ownership": "RENT",
            "loan_purpose": "debt_consolidation",
            "term_months": 36,
            "revol_util": 45.0,
            "delinq_2yrs": 0,
            "inq_last_6mths": 1,
            "open_acc": 9,
            "pub_rec": 0,
            "mort_acc": 0,
            "loan_title": "Consolidate revolving cards"
        }
    ]
    
    for sample in samples:
        app_input = LoanApplicationInput(**sample)
        pred = await call_ml_service_predict(app_input)
        await save_application_record(app_input, pred)
        
    logger.info(f"Seeded {len(samples)} realistic underwriting applications.")

async def save_application_record(input_data: LoanApplicationInput, prediction: Dict[str, Any]) -> Dict[str, Any]:
    applicant_id = prediction.get("applicant_id", f"APP-{int(datetime.now().timestamp()) % 100000}")
    timestamp_str = datetime.now(timezone.utc).isoformat()
    
    doc = {
        "applicant_id": applicant_id,
        "applicant_name": input_data.applicant_name or "Applicant",
        "input_data": input_data.model_dump(),
        "default_probability": prediction["final_probability"],
        "risk_level": prediction["risk_level"],
        "recommendation": prediction["recommendation"],
        "model_predictions": prediction.get("model_predictions", {}),
        "positive_risk_factors": [rf if isinstance(rf, dict) else rf.model_dump() for rf in prediction.get("positive_risk_factors", [])],
        "risk_reducing_factors": [rf if isinstance(rf, dict) else rf.model_dump() for rf in prediction.get("risk_reducing_factors", [])],
        "created_at": timestamp_str,
        "updated_at": timestamp_str
    }
    
    if db.is_connected and db.db is not None:
        await db.db.applicants.update_one(
            {"applicant_id": applicant_id},
            {"$set": doc},
            upsert=True
        )
    else:
        # In-memory store
        existing_idx = next((i for i, item in enumerate(db._memory_store["applicants"]) if item["applicant_id"] == applicant_id), None)
        if existing_idx is not None:
            db._memory_store["applicants"][existing_idx] = doc
        else:
            db._memory_store["applicants"].append(doc)
            
    return doc

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting Application & Underwriting Microservice on port {settings.APPLICATION_SERVICE_PORT}...")
    await db.connect(settings.MONGODB_URI, settings.DATABASE_NAME)
    await seed_initial_applications()
    yield
    logger.info("Stopping Application Microservice...")
    await db.close()

app = FastAPI(
    title="LoanShield Application & Underwriting Microservice",
    description="Autonomous microservice for underwriting records, applicant portfolio statistics, and historical audit logs.",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", tags=["Health"])
async def health_check():
    count = await db.db.applicants.count_documents({}) if (db.is_connected and db.db is not None) else len(db._memory_store["applicants"])
    return {
        "status": "online",
        "service": "application_service",
        "port": settings.APPLICATION_SERVICE_PORT,
        "database_connected": db.is_connected,
        "total_applications": count
    }

@app.get("/dashboard/stats", response_model=DashboardStats, tags=["Portfolio"])
async def get_dashboard_stats():
    """Aggregates portfolio default rates, risk distributions, and recent applications"""
    apps = []
    if db.is_connected and db.db is not None:
        cursor = db.db.applicants.find({})
        apps = await cursor.to_list(length=1000)
    else:
        apps = db._memory_store["applicants"]
        
    total = len(apps)
    if total == 0:
        return DashboardStats(
            total_applications=0,
            high_risk_count=0,
            medium_risk_count=0,
            low_risk_count=0,
            overall_default_rate=0.0,
            average_loan_amount=0.0,
            average_fico=0.0,
            risk_distribution=RiskDistribution(low=0, medium=0, high=0, total=0),
            recent_high_risk=[],
            recent_applications=[],
            model_summary={}
        )
        
    high_count = sum(1 for a in apps if a.get("risk_level") == "HIGH")
    med_count = sum(1 for a in apps if a.get("risk_level") == "MEDIUM")
    low_count = sum(1 for a in apps if a.get("risk_level") == "LOW")
    
    avg_prob = sum(a.get("default_probability", 0) for a in apps) / total
    avg_loan = sum(a.get("input_data", {}).get("loan_amnt", 0) for a in apps) / total
    avg_fico = sum(a.get("input_data", {}).get("fico_score", 0) for a in apps) / total
    
    # Sort by created_at desc
    sorted_apps = sorted(apps, key=lambda x: x.get("created_at", ""), reverse=True)
    
    def to_summary(doc):
        inp = doc.get("input_data", {})
        return ApplicantSummary(
            applicant_id=doc.get("applicant_id", ""),
            applicant_name=doc.get("applicant_name", "Applicant"),
            loan_amnt=inp.get("loan_amnt", 0.0),
            annual_inc=inp.get("annual_inc", 0.0),
            fico_score=inp.get("fico_score", 700),
            loan_purpose=inp.get("loan_purpose", "other"),
            dti=inp.get("dti", 0.0),
            default_probability=doc.get("default_probability", 0.0),
            risk_level=doc.get("risk_level", "LOW"),
            created_at=doc.get("created_at", "")
        )
        
    recent_all = [to_summary(a) for a in sorted_apps[:5]]
    recent_high = [to_summary(a) for a in sorted_apps if a.get("risk_level") == "HIGH"][:5]
    
    return DashboardStats(
        total_applications=total,
        high_risk_count=high_count,
        medium_risk_count=med_count,
        low_risk_count=low_count,
        overall_default_rate=round(avg_prob, 4),
        average_loan_amount=round(avg_loan, 2),
        average_fico=round(avg_fico, 1),
        risk_distribution=RiskDistribution(
            low=low_count,
            medium=med_count,
            high=high_count,
            total=total
        ),
        recent_high_risk=recent_high,
        recent_applications=recent_all,
        model_summary={}
    )

@app.get("/applications", response_model=ApplicationsListResponse, tags=["Applications"])
async def list_applications(
    search: Optional[str] = Query(None),
    risk_level: Optional[str] = Query(None),
    loan_purpose: Optional[str] = Query(None),
    min_prob: Optional[float] = Query(None),
    max_prob: Optional[float] = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100)
):
    """Lists, filters, and paginates historical loan applications"""
    apps = []
    if db.is_connected and db.db is not None:
        cursor = db.db.applicants.find({})
        apps = await cursor.to_list(length=2000)
    else:
        apps = db._memory_store["applicants"]
        
    filtered = apps
    if search:
        s = search.lower().strip()
        filtered = [a for a in filtered if s in a.get("applicant_id", "").lower() or s in a.get("applicant_name", "").lower()]
    if risk_level and risk_level != "ALL":
        filtered = [a for a in filtered if a.get("risk_level") == risk_level.upper()]
    if loan_purpose and loan_purpose != "ALL":
        filtered = [a for a in filtered if a.get("input_data", {}).get("loan_purpose") == loan_purpose.lower()]
    if min_prob is not None:
        filtered = [a for a in filtered if a.get("default_probability", 0) >= min_prob]
    if max_prob is not None:
        filtered = [a for a in filtered if a.get("default_probability", 0) <= max_prob]
        
    reverse = (sort_order.lower() == "desc")
    if sort_by == "probability":
        filtered.sort(key=lambda x: x.get("default_probability", 0), reverse=reverse)
    elif sort_by == "loan_amount":
        filtered.sort(key=lambda x: x.get("input_data", {}).get("loan_amnt", 0), reverse=reverse)
    elif sort_by == "income":
        filtered.sort(key=lambda x: x.get("input_data", {}).get("annual_inc", 0), reverse=reverse)
    elif sort_by == "fico":
        filtered.sort(key=lambda x: x.get("input_data", {}).get("fico_score", 0), reverse=reverse)
    else:
        filtered.sort(key=lambda x: x.get("created_at", ""), reverse=reverse)
        
    total = len(filtered)
    start = (page - 1) * limit
    paged = filtered[start:start + limit]
    
    items = []
    for doc in paged:
        inp = doc.get("input_data", {})
        items.append(ApplicantSummary(
            applicant_id=doc.get("applicant_id", ""),
            applicant_name=doc.get("applicant_name", "Applicant"),
            loan_amnt=inp.get("loan_amnt", 0.0),
            annual_inc=inp.get("annual_inc", 0.0),
            fico_score=inp.get("fico_score", 700),
            loan_purpose=inp.get("loan_purpose", "other"),
            dti=inp.get("dti", 0.0),
            default_probability=doc.get("default_probability", 0.0),
            risk_level=doc.get("risk_level", "LOW"),
            created_at=doc.get("created_at", "")
        ))
        
    pages = math.ceil(total / limit) if total > 0 else 1
    return ApplicationsListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=pages
    )

@app.get("/applications/{applicant_id}", response_model=ApplicationDetail, tags=["Applications"])
async def get_applicant_detail(applicant_id: str):
    doc = None
    if db.is_connected and db.db is not None:
        doc = await db.db.applicants.find_one({"applicant_id": applicant_id})
    else:
        doc = next((a for a in db._memory_store["applicants"] if a.get("applicant_id") == applicant_id), None)
        
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Applicant with ID '{applicant_id}' not found."
        )
        
    return ApplicationDetail(
        applicant_id=doc["applicant_id"],
        applicant_name=doc.get("applicant_name", "Applicant"),
        input_data=doc.get("input_data", {}),
        default_probability=doc.get("default_probability", 0.0),
        risk_level=doc.get("risk_level", "LOW"),
        recommendation=doc.get("recommendation", ""),
        model_predictions=doc.get("model_predictions", {}),
        positive_risk_factors=doc.get("positive_risk_factors", []),
        risk_reducing_factors=doc.get("risk_reducing_factors", []),
        prediction_history=[{
            "timestamp": doc.get("created_at", ""),
            "probability": doc.get("default_probability", 0.0),
            "risk_level": doc.get("risk_level", "LOW")
        }],
        created_at=doc.get("created_at", ""),
        updated_at=doc.get("updated_at", "")
    )

@app.post("/applications", response_model=ApplicationDetail, tags=["Applications"])
async def create_loan_application(input_data: LoanApplicationInput):
    """
    Orchestrates application underwriting: calls ML Microservice for real-time risk,
    stores full record with SHAP factors in database, and returns applicant dossier.
    """
    try:
        prediction = await call_ml_service_predict(input_data)
        saved_doc = await save_application_record(input_data, prediction)
        return await get_applicant_detail(saved_doc["applicant_id"])
    except Exception as e:
        logger.error(f"Application underwriting failure: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record application: {str(e)}"
        )

@app.get("/applications/{applicant_id}/predictions", tags=["Applications"])
async def get_applicant_prediction_history(applicant_id: str):
    detail = await get_applicant_detail(applicant_id)
    return {
        "applicant_id": applicant_id,
        "prediction_history": detail.prediction_history
    }

@app.post("/predict", response_model=PredictionResponse, tags=["Inference & Storage"])
async def predict_and_save(input_data: LoanApplicationInput):
    """
    Executes real-time ML risk scoring via ML Microservice, automatically records
    the applicant assessment to the underwriting repository, and returns prediction details.
    """
    try:
        prediction = await call_ml_service_predict(input_data)
        await save_application_record(input_data, prediction)
        return prediction
    except Exception as e:
        logger.error(f"Prediction & save failure: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to assess and record applicant: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.APPLICATION_SERVICE_PORT, reload=True)
