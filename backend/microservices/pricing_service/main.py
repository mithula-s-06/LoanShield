import os
import sys
import logging
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

current_dir = os.path.dirname(os.path.abspath(__file__))
microservices_dir = os.path.dirname(current_dir)
backend_dir = os.path.dirname(microservices_dir)

for path in [current_dir, microservices_dir, backend_dir]:
    if path not in sys.path:
        sys.path.insert(0, path)

from shared.schemas import (
    LoanInterestCalculationInput,
    LoanPricingCalculationResponse
)
from shared.config import get_service_settings
from app.services.loan_pricing_service import LoanPricingCalculation

settings = get_service_settings()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [PRICING-SERVICE] [%(levelname)s]: %(message)s"
)
logger = logging.getLogger("loanshield.pricing_service")

app = FastAPI(
    title="LoanShield Loan Products & Pricing Microservice",
    description="Autonomous microservice for product catalog metadata, risk-adjusted APR calculations, and amortization schedules.",
    version="1.0.0"
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
    return {
        "status": "online",
        "service": "pricing_service",
        "port": settings.PRICING_SERVICE_PORT,
        "categories_count": len(LoanPricingCalculation.get_all_categories())
    }

@app.get("/loan-products/categories", tags=["Products"])
async def get_loan_purchase_categories():
    """Returns baseline APRs, terms, limits, guidelines, and benefits for each loan purchase category"""
    return {
        "categories": LoanPricingCalculation.get_all_categories()
    }

@app.post("/loan-products/calculate-interest", response_model=LoanPricingCalculationResponse, tags=["Calculations"])
async def calculate_loan_interest(calc_input: LoanInterestCalculationInput):
    """
    Calculates dynamic risk-adjusted APR, monthly installment (EMI), total interest,
    and amortization schedule for the specified purchase category.
    """
    try:
        result = LoanPricingCalculation.calculate(
            loan_purpose=calc_input.loan_purpose,
            loan_amount=calc_input.loan_amount,
            term_months=calc_input.term_months,
            fico_score=calc_input.fico_score,
            dti=calc_input.dti,
            down_payment=calc_input.down_payment,
            default_probability=calc_input.default_probability
        )
        return result
    except Exception as e:
        logger.error(f"Pricing calculation failure: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to compute pricing for loan purchase: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PRICING_SERVICE_PORT, reload=True)
