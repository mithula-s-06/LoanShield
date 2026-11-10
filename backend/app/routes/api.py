import os
import json
from fastapi import APIRouter, HTTPException, Query, status
from typing import Optional, Dict, Any, List
import logging
from ..schemas.loan import (
    LoanApplicationInput,
    PredictionResponse,
    ApplicationDetail,
    ApplicationsListResponse,
    DashboardStats,
    ModelMetricsResponse,
    LoanInterestCalculationInput,
    LoanPricingCalculationResponse
)
from ..services.ml_service import ml_service
from ..services.db_service import db_service
from ..config import settings

logger = logging.getLogger("loanshield.api")
router = APIRouter(prefix="/api", tags=["LoanShield Core API"])

@router.get("/health", summary="Service Health and ML Engine Status")
async def health_check():
    return {
        "status": "online",
        "service": "LoanShield Risk Assessment Engine",
        "ml_engine_loaded": ml_service.is_loaded,
        "active_models": list(ml_service.models.keys()),
        "thresholds": {
            "low_risk": settings.LOW_RISK_THRESHOLD,
            "high_risk": settings.HIGH_RISK_THRESHOLD
        },
        "database_connected": db_service.db.is_connected if hasattr(db_service, 'db') else False
    }

@router.get("/dashboard/stats", response_model=DashboardStats, summary="Banking Portfolio Risk Overview")
async def get_dashboard_stats():
    """Returns aggregated risk distribution, recent high-risk applications, and model metrics overview"""
    model_summary = ml_service.metrics_metadata.get("models", {})
    stats = await db_service.get_dashboard_stats(model_summary=model_summary)
    return stats

@router.get("/applications", response_model=ApplicationsListResponse, summary="List and Filter Loan Applications")
async def list_applications(
    search: Optional[str] = Query(None, description="Search applicant ID or name"),
    risk_level: Optional[str] = Query(None, description="Risk band: LOW, MEDIUM, HIGH"),
    loan_purpose: Optional[str] = Query(None, description="Filter by loan purpose"),
    min_prob: Optional[float] = Query(None, description="Minimum default probability"),
    max_prob: Optional[float] = Query(None, description="Maximum default probability"),
    sort_by: str = Query("created_at", description="Sort field: created_at, probability, loan_amount, income, fico"),
    sort_order: str = Query("desc", description="Sort direction: asc or desc"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page")
):
    return await db_service.get_applications(
        search=search,
        risk_level=risk_level,
        loan_purpose=loan_purpose,
        min_prob=min_prob,
        max_prob=max_prob,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        limit=limit
    )

@router.get("/applications/{applicant_id}", response_model=ApplicationDetail, summary="Get Applicant Detail & Risk Report")
async def get_applicant_detail(applicant_id: str):
    applicant = await db_service.get_applicant_by_id(applicant_id)
    if not applicant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Applicant with ID '{applicant_id}' not found in underwriting registry."
        )
    return applicant

@router.post("/predict", response_model=PredictionResponse, summary="Run Real-Time ML Default Risk Prediction")
async def predict_loan_risk(input_data: LoanApplicationInput):
    """
    Executes real-time default risk prediction across Logistic Regression,
    Decision Tree, Random Forest, and XGBoost models. Generates SHAP explainability.
    Automatically persists assessment to underwriting registry so it is immediately visible in dashboard.
    """
    try:
        prediction = ml_service.predict(input_data)
        # Automatically record to underwriting repository so it is immediately visible in Dashboard & Applications
        await db_service.save_application_and_prediction(input_data, prediction)
        return prediction
    except Exception as e:
        logger.error(f"Prediction engine failure: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Risk assessment engine encountered an unexpected processing error."
        )

@router.post("/applications", response_model=ApplicationDetail, summary="Submit New Loan Assessment & Save to Record")
async def create_loan_application(input_data: LoanApplicationInput):
    """
    Evaluates new applicant, calculates SHAP risk drivers, and records
    to MongoDB underwriting database.
    """
    try:
        prediction = ml_service.predict(input_data)
        saved_doc = await db_service.save_application_and_prediction(input_data, prediction)
        detail = await db_service.get_applicant_by_id(saved_doc["applicant_id"])
        return detail
    except Exception as e:
        logger.error(f"Application save failure: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to record application to underwriting repository."
        )

@router.get("/applications/{applicant_id}/predictions", summary="Get Historical Prediction Log for Applicant")
async def get_applicant_prediction_history(applicant_id: str):
    applicant = await db_service.get_applicant_by_id(applicant_id)
    if not applicant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Applicant with ID '{applicant_id}' not found."
        )
    return {
        "applicant_id": applicant_id,
        "prediction_history": applicant.prediction_history
    }

@router.get("/models/metrics", summary="Dynamic Model Performance Metrics")
async def get_model_metrics():
    """Returns real test-set evaluation metrics for all 4 trained classification models"""
    if not ml_service.metrics_metadata:
        ml_service.load_artifacts()
    return ml_service.metrics_metadata

@router.get("/models/comparison", summary="Multi-Model Comparison Analytics")
async def get_model_comparison():
    """Returns comparative metrics, ROC curves, and feature importance tables"""
    if not ml_service.metrics_metadata:
        ml_service.load_artifacts()
        
    models_data = ml_service.metrics_metadata.get("models", {})
    comparison_table = []
    
    for key, info in models_data.items():
        comparison_table.append({
            "model_key": key,
            "model_name": info.get("model_name"),
            "accuracy": info.get("accuracy"),
            "precision": info.get("precision"),
            "recall": info.get("recall"),
            "f1_score": info.get("f1_score"),
            "roc_auc": info.get("roc_auc")
        })
        
    # Sort by ROC-AUC descending
    comparison_table.sort(key=lambda x: x["roc_auc"], reverse=True)
    
    return {
        "best_model": ml_service.metrics_metadata.get("best_model", "xgboost"),
        "comparison_table": comparison_table,
        "models": models_data,
        "feature_names": ml_service.metrics_metadata.get("feature_names", [])
    }

@router.get("/loan-products/categories", summary="Get All Loan Purchase Categories & Standard Rates")
async def get_loan_purchase_categories():
    """Returns metadata, baseline APRs, allowable terms, limits, and guidelines for each loan purchase module"""
    from ..services.loan_pricing_service import LoanPricingCalculation
    return {
        "categories": LoanPricingCalculation.get_all_categories()
    }

@router.post("/loan-products/calculate-interest", response_model=LoanPricingCalculationResponse, summary="Calculate Dynamic Interest & Amortization for Purchase Category")
async def calculate_loan_interest(calc_input: LoanInterestCalculationInput):
    """
    Calculates dynamic risk-adjusted APR, monthly installment (EMI), total interest,
    and amortization schedule for the specified loan purchase category.
    """
    from ..services.loan_pricing_service import LoanPricingCalculation
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
        logger.error(f"Error calculating loan interest: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to compute interest for loan purchase: {str(e)}"
        )

