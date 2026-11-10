import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier

# Ensure ml directory is in python path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from data_loader import create_or_load_dataset
from preprocess import (
    build_preprocessing_pipeline,
    prepare_data,
    get_feature_names,
    NUMERICAL_FEATURES,
    CATEGORICAL_FEATURES
)
from evaluate import evaluate_model

def train_and_evaluate_all():
    print("=" * 70)
    print(" LOANGUARD ML TRAINING PIPELINE (REAL EVALUATION)")
    print("=" * 70)
    
    # Paths setup
    data_dir = os.path.join(current_dir, "data")
    saved_models_dir = os.path.join(current_dir, "saved_models")
    os.makedirs(data_dir, exist_ok=True)
    os.makedirs(saved_models_dir, exist_ok=True)
    
    dataset_path = os.path.join(data_dir, "lending_club_granting.csv")
    
    # 1. Dataset loading & validation
    print("[1/6] Loading & Validating Lending Dataset...")
    df = create_or_load_dataset(dataset_path, n_samples=20000, random_state=42)
    print(f"      Total records: {len(df):,}")
    print(f"      Default rate in dataset: {df['is_default'].mean():.2%}")
    
    # 2. Data Preprocessing & Feature Engineering
    print("[2/6] Engineering Features & Preprocessing Pipeline...")
    X_raw, y = prepare_data(df)
    
    # Stratified Train/Test Split (80/20)
    print("[3/6] Performing Stratified Train/Test Split (80/20, seed=42)...")
    X_train_raw, X_test_raw, y_train, y_test = train_test_split(
        X_raw, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"      Train samples: {len(X_train_raw):,} | Test samples: {len(X_test_raw):,}")
    
    # Fit ColumnTransformer on train data only (no data leakage)
    preprocessor = build_preprocessing_pipeline()
    X_train = preprocessor.fit_transform(X_train_raw)
    X_test = preprocessor.transform(X_test_raw)
    feature_names = get_feature_names(preprocessor)
    print(f"      Transformed feature dimensions: {X_train.shape[1]}")
    
    # Save preprocessor
    joblib.dump(preprocessor, os.path.join(saved_models_dir, "preprocessor.joblib"))
    print("      Preprocessor pipeline saved to preprocessor.joblib")
    
    # 3. Model Training & Evaluation
    print("[4/6] Training & Evaluating Multi-Algorithm ML Suite (LR, XGBoost, Random Forest)...")
    
    models = {
        "logistic_regression": {
            "name": "Logistic Regression",
            "desc": "L2 Regularized linear classifier with balanced class weights for optimal default recall and regulatory transparency",
            "estimator": LogisticRegression(
                C=1.0,
                max_iter=1000,
                class_weight="balanced",
                random_state=42
            )
        },
        "xgboost": {
            "name": "XGBoost",
            "desc": "Gradient boosted decision trees optimized for high-efficiency tabular default risk",
            "estimator": XGBClassifier(
                n_estimators=160,
                max_depth=5,
                learning_rate=0.07,
                subsample=0.85,
                colsample_bytree=0.85,
                eval_metric="logloss",
                random_state=42
            )
        },
        "random_forest": {
            "name": "Random Forest",
            "desc": "Bagged ensemble of decision trees with balanced subsampling",
            "estimator": RandomForestClassifier(
                n_estimators=100,
                max_depth=8,
                class_weight="balanced",
                random_state=42,
                n_jobs=-1
            )
        }
    }
    
    all_metrics = {}
    best_model_key = None
    best_roc_auc = -1.0
    
    for key, info in models.items():
        print(f"      -> Training {info['name']}...")
        clf = info["estimator"]
        clf.fit(X_train, y_train)
        
        # Save model artifact
        model_filename = f"{key}.joblib"
        joblib.dump(clf, os.path.join(saved_models_dir, model_filename))
        
        # Evaluate on test set
        metrics = evaluate_model(
            model=clf,
            X_test=X_test,
            y_test=y_test,
            model_name=info["name"],
            feature_names=feature_names
        )
        metrics["description"] = info["desc"]
        metrics["saved_file"] = model_filename
        metrics["trained_at"] = datetime.utcnow().isoformat()
        
        all_metrics[key] = metrics
        
        print(f"         Accuracy:  {metrics['accuracy']:.4f} | Precision: {metrics['precision']:.4f}")
        print(f"         Recall:    {metrics['recall']:.4f} | F1-Score:  {metrics['f1_score']:.4f}")
        print(f"         ROC-AUC:   {metrics['roc_auc']:.4f}")
        
        if metrics['roc_auc'] > best_roc_auc:
            best_roc_auc = metrics['roc_auc']
            best_model_key = key
            
    print(f"\n[5/6] Model Comparison Summary - Best Model: {models[best_model_key]['name']} (ROC-AUC: {best_roc_auc:.4f})")
    
    # 4. Save metadata and metrics
    metadata = {
        "dataset_name": "Lending Club Loan Granting Benchmark",
        "total_records": len(df),
        "train_records": len(X_train_raw),
        "test_records": len(X_test_raw),
        "default_rate": round(float(df['is_default'].mean()), 4),
        "training_timestamp": datetime.utcnow().isoformat(),
        "best_model": best_model_key,
        "feature_names": feature_names,
        "numerical_features": NUMERICAL_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "models": all_metrics
    }
    
    metrics_path = os.path.join(saved_models_dir, "metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"      Saved all metrics to {metrics_path}")
    
    # 5. Attempt MongoDB sync if reachable
    print("[6/6] Syncing metrics to MongoDB...")
    try:
        from pymongo import MongoClient
        mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=2500)
        db = client["loanguard_db"]
        
        # Save or update model metrics collection
        db.model_metrics.delete_many({})
        for key, m in all_metrics.items():
            db.model_metrics.insert_one({
                "model_key": key,
                "model_name": m["model_name"],
                "accuracy": m["accuracy"],
                "precision": m["precision"],
                "recall": m["recall"],
                "f1_score": m["f1_score"],
                "roc_auc": m["roc_auc"],
                "confusion_matrix": m["confusion_matrix"],
                "feature_importance": m["feature_importance"],
                "trained_at": m["trained_at"]
            })
        print("      Successfully synced metrics to MongoDB collection 'model_metrics'.")
    except Exception as e:
        print(f"      MongoDB sync note: {e} (Metrics stored in JSON artifact and will be served reliably).")
        
    print("=" * 70)
    print(" ML TRAINING PIPELINE COMPLETE SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    train_and_evaluate_all()
