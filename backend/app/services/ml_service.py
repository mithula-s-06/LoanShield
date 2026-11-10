import os
import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple, List
import logging
from ..config import settings
from ..schemas.loan import LoanApplicationInput, PredictionResponse, ModelPredictionDetail, RiskFactor
import sys

# Import ml module helpers
ml_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "ml")
if ml_dir not in sys.path:
    sys.path.insert(0, ml_dir)

from preprocess import prepare_data, get_feature_names
from explain import explain_prediction

logger = logging.getLogger("loanguard.ml_service")

class MLService:
    def __init__(self):
        self.models: Dict[str, Any] = {}
        self.preprocessor: Any = None
        self.feature_names: List[str] = []
        self.metrics_metadata: Dict[str, Any] = {}
        self.is_loaded: bool = False
        
    def load_artifacts(self):
        """Loads preprocessor, XGBoost ML model, and evaluation metrics from disk once at startup"""
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
            
            # Load candidate models (prioritizing Logistic Regression champion model)
            for model_key in ["logistic_regression", "xgboost", "random_forest"]:
                path = os.path.join(model_dir, f"{model_key}.joblib")
                if os.path.exists(path):
                    self.models[model_key] = joblib.load(path)
                    logger.info(f"Loaded ML model: {model_key}")
                    
            with open(metrics_path, "r") as f:
                self.metrics_metadata = json.load(f)
                
            self.is_loaded = True
            logger.info("Successfully initialized ML Service with Logistic Regression champion model.")
        except Exception as e:
            logger.error(f"Error loading ML artifacts: {e}", exc_info=True)
            self.is_loaded = False
            
    def classify_risk(self, probability: float) -> Tuple[str, str]:
        """
        Maps default probability to Risk Level (LOW, MEDIUM, HIGH)
        using configurable thresholds and generates banker recommendation.
        """
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
        """
        Runs real ML inference on all 4 models, generates explainable risk factors,
        and computes consensus risk assessment.
        """
        if not self.is_loaded:
            self.load_artifacts()
            
        # Convert input to DataFrame
        raw_dict = input_data.model_dump()
        df_input = pd.DataFrame([raw_dict])
        
        # Prepare and transform features
        X_df, _ = prepare_data(df_input)
        X_transformed = self.preprocessor.transform(X_df)
        
        # Predictions across all 4 models
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
            
        # Select primary model prediction (Logistic Regression champion model)
        primary_key = settings.PRIMARY_MODEL if settings.PRIMARY_MODEL in self.models else "logistic_regression"
        if primary_key not in self.models and len(self.models) > 0:
            primary_key = list(self.models.keys())[0]
            
        final_prob = probabilities.get(primary_key, 0.20)
        risk_lvl, recommendation = self.classify_risk(final_prob)
        
        # Calculate Explainability using primary model / XGBoost / Random Forest
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

ml_service = MLService()
