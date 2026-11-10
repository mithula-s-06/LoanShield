import numpy as np
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    roc_curve,
    classification_report
)
from typing import Dict, Any, List

def evaluate_model(
    model: Any,
    X_test: np.ndarray,
    y_test: np.ndarray,
    model_name: str,
    feature_names: List[str] = None
) -> Dict[str, Any]:
    """
    Computes comprehensive, real metrics on the test set for a classification model.
    """
    # Predictions & Probabilities
    y_pred = model.predict(X_test)
    
    if hasattr(model, "predict_proba"):
        y_prob = model.predict_proba(X_test)[:, 1]
    else:
        y_prob = y_pred.astype(float)
        
    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, zero_division=0))
    rec = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))
    
    try:
        auc = float(roc_auc_score(y_test, y_prob))
    except Exception:
        auc = 0.5
        
    cm = confusion_matrix(y_test, y_pred).tolist()
    
    # Generate sampled ROC curve coordinates (50 points)
    try:
        fpr, tpr, thresholds = roc_curve(y_test, y_prob)
        # Downsample to ~40-50 points for clean frontend rendering
        indices = np.linspace(0, len(fpr) - 1, min(40, len(fpr))).astype(int)
        roc_data = [{"fpr": round(float(fpr[i]), 4), "tpr": round(float(tpr[i]), 4)} for i in indices]
    except Exception:
        roc_data = [{"fpr": 0.0, "tpr": 0.0}, {"fpr": 1.0, "tpr": 1.0}]
        
    # Feature importance extraction
    feature_importance = []
    if feature_names:
        if hasattr(model, "feature_importances_"):
            importances = model.feature_importances_
            # Aggregate or list top features
            feature_importance = [
                {"feature": feat, "importance": round(float(imp), 4)}
                for feat, imp in zip(feature_names, importances)
            ]
            feature_importance.sort(key=lambda x: x["importance"], reverse=True)
        elif hasattr(model, "coef_"):
            coefficients = model.coef_[0]
            feature_importance = [
                {"feature": feat, "importance": round(float(abs(coef)), 4), "raw_coef": round(float(coef), 4)}
                for feat, coef in zip(feature_names, coefficients)
            ]
            feature_importance.sort(key=lambda x: x["importance"], reverse=True)
            
    clf_report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)
    
    metrics = {
        "model_key": model_name.lower().replace(" ", "_"),
        "model_name": model_name,
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "roc_auc": round(auc, 4),
        "confusion_matrix": {
            "matrix": cm,
            "true_negatives": int(cm[0][0]) if len(cm) > 0 and len(cm[0]) > 0 else 0,
            "false_positives": int(cm[0][1]) if len(cm) > 0 and len(cm[0]) > 1 else 0,
            "false_negatives": int(cm[1][0]) if len(cm) > 1 and len(cm[1]) > 0 else 0,
            "true_positives": int(cm[1][1]) if len(cm) > 1 and len(cm[1]) > 1 else 0
        },
        "roc_curve": roc_data,
        "feature_importance": feature_importance[:12], # top 12 features
        "classification_report": clf_report
    }
    
    return metrics
