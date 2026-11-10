import os
import sys
import json
import logging
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple, List
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

# Ensure path resolution for shared modules and ml module
current_dir = os.path.dirname(os.path.abspath(__file__))
microservices_dir = os.path.dirname(current_dir)
backend_dir = os.path.dirname(microservices_dir)

for path in [current_dir, microservices_dir, backend_dir, os.path.join(backend_dir, "ml")]:
    if path not in sys.path:
        sys.path.insert(0, path)

from shared.schemas import (
    LoanApplicationInput,
    PredictionResponse,
    ModelPredictionDetail,
    RiskFactor,
    ModelMetricsResponse
)
from shared.config import get_service_settings
from preprocess import prepare_data, get_feature_names
from explain import explain_prediction

settings = get_service_settings()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [ML-SERVICE] [%(levelname)s]: %(message)s"
)
logger = logging.getLogger("loanshield.ml_service")

class MLRiskEngine:
    def __init__(self):
        self.models: Dict[str, Any] = {}
        self.preprocessor: Any = None
        self.feature_names: List[str] = []
        self.metrics_metadata: Dict[str, Any] = {}
        self.is_loaded: bool = False
        
    def load_artifacts(self):
        """Loads preprocessor, ML models, and evaluation metrics from disk once at startup"""
        model_dir = settings.MODEL_DIR
        try:
            preprocessor_path = os.path.join(model_dir, "preprocessor.joblib")
            metrics_path = os.path.join(model_dir, "metrics.json")
            
            if not os.path.exists(preprocessor_path) or not os.path.exists(metrics_path):
                logger.warning("ML artifacts not found on disk. Initiating automated model training...")
                from train import train_and_evaluate_all
                train_and_evaluate_all()
                
            self.preprocessor = joblib.load(preprocessor_path)
            self.feature_names = get_feature_names(self.preprocessor)
            
            # Load all available candidate models
            for model_key in ["xgboost", "random_forest", "logistic_regression"]:
                path = os.path.join(model_dir, f"{model_key}.joblib")
                if os.path.exists(path):
                    self.models[model_key] = joblib.load(path)
                    logger.info(f"Loaded ML model: {model_key}")
                    
            if not self.models and os.path.exists(os.path.join(model_dir, "xgboost.joblib")):
                self.models["xgboost"] = joblib.load(os.path.join(model_dir, "xgboost.joblib"))
                    
            with open(metrics_path, "r") as f:
                self.metrics_metadata = json.load(f)
                
            self.is_loaded = True
            logger.info(f"ML Engine initialized with {len(self.models)} active model(s) and {len(self.feature_names)} features.")
        except Exception as e:
            logger.error(f"Error loading ML artifacts: {e}", exc_info=True)
            self.is_loaded = False
            
    def classify_risk(self, probability: float) -> Tuple[str, str]:
        low_thresh = settings.LOW_RISK_THRESHOLD
        high_thresh = settings.HIGH_RISK_THRESHOLD
        
        if probability < low_thresh:
            level = "LOW"
            rec = "Low predicted default risk. Standard automated underwriting clearance recommended."
        elif probability < high_thresh:
            level = "MEDIUM"
            rec = "Moderate default risk. Requires secondary documentation check and senior credit analyst review."
        else:
            level = "HIGH"
            rec = "High predicted default risk – requires further review, collateral check, or credit committee assessment."
            
        return level, rec

    def predict(self, input_data: LoanApplicationInput, applicant_id: str = None) -> Dict[str, Any]:
        if not self.is_loaded:
            self.load_artifacts()
            
        raw_dict = input_data.model_dump()
        df_input = pd.DataFrame([raw_dict])
        
        X_df, _ = prepare_data(df_input)
        X_transformed = self.preprocessor.transform(X_df)
        
        model_results: Dict[str, ModelPredictionDetail] = {}
        probabilities: Dict[str, float] = {}
        
        for key, model in self.models.items():
            if hasattr(model, "predict_proba"):
                prob = float(model.predict_proba(X_transformed)[0, 1])
            else:
                prob = float(model.predict(X_transformed)[0])
                
            pred_class = int(prob >= 0.5)
            r_level, _ = self.classify_risk(prob)
            
            probabilities[key] = round(prob, 4)
            model_results[key] = ModelPredictionDetail(
                probability=round(prob, 4),
                predicted_class=pred_class,
                risk_level=r_level
            )
            
        primary_key = settings.PRIMARY_MODEL if settings.PRIMARY_MODEL in self.models else "logistic_regression"
        if primary_key not in self.models and len(self.models) > 0:
            primary_key = list(self.models.keys())[0]
            
        final_prob = probabilities.get(primary_key, 0.20)
        risk_lvl, recommendation = self.classify_risk(final_prob)
        
        explainer_model = self.models.get(primary_key, list(self.models.values())[0] if self.models else None)
        explanation = explain_prediction(
            model=explainer_model,
            preprocessor=self.preprocessor,
            raw_input_dict=raw_dict,
            transformed_row=X_transformed,
            feature_names=self.feature_names
        )
        
        return {
            "applicant_id": applicant_id or f"APP-{np.random.randint(10000, 99999)}",
            "final_probability": final_prob,
            "risk_level": risk_lvl,
            "thresholds": {
                "low": settings.LOW_RISK_THRESHOLD,
                "high": settings.HIGH_RISK_THRESHOLD
            },
            "selected_model": primary_key,
            "recommendation": recommendation,
            "model_predictions": model_results,
            "positive_risk_factors": [RiskFactor(**rf) for rf in explanation["positive_risk_factors"]],
            "risk_reducing_factors": [RiskFactor(**rf) for rf in explanation["risk_reducing_factors"]],
            "input_data": raw_dict,
            "timestamp": pd.Timestamp.now().isoformat()
        }

engine = MLRiskEngine()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting ML Risk & Explainability Microservice on port 8001...")
    engine.load_artifacts()
    yield
    logger.info("Stopping ML Risk Microservice...")

app = FastAPI(
    title="LoanShield ML Risk & Explainability Microservice",
    description="Autonomous microservice for real-time credit default risk scoring and SHAP factor attribution.",
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
    return {
        "status": "online",
        "service": "ml_service",
        "port": settings.ML_SERVICE_PORT,
        "is_loaded": engine.is_loaded,
        "active_models": list(engine.models.keys()),
        "feature_count": len(engine.feature_names)
    }

@app.post("/predict", response_model=PredictionResponse, tags=["Inference"])
async def predict_loan_risk(input_data: LoanApplicationInput):
    """Executes multi-model real-time scoring and generates SHAP risk factor attribution"""
    try:
        result = engine.predict(input_data)
        return result
    except Exception as e:
        logger.error(f"Inference failure: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ML risk prediction engine error: {str(e)}"
        )

@app.get("/models/metrics", tags=["Metrics"])
async def get_model_metrics():
    """Returns test-set evaluation metrics for trained models"""
    if not engine.metrics_metadata:
        engine.load_artifacts()
    return engine.metrics_metadata

@app.get("/models/comparison", tags=["Metrics"])
async def get_model_comparison():
    """Returns comparative metrics, ROC curves, and feature importance table"""
    if not engine.metrics_metadata:
        engine.load_artifacts()
        
    models_data = engine.metrics_metadata.get("models", {})
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
        
    comparison_table.sort(key=lambda x: x["roc_auc"], reverse=True)
    
    return {
        "best_model": engine.metrics_metadata.get("best_model", "xgboost"),
        "comparison_table": comparison_table,
        "models": models_data,
        "feature_names": engine.metrics_metadata.get("feature_names", [])
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.ML_SERVICE_PORT, reload=True)
