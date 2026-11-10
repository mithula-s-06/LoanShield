import json
import os

def create_kaggle_notebook():
    notebook = {
        "nbformat": 4,
        "nbformat_minor": 0,
        "metadata": {
            "kaggle": {
                "accelerator": "gpu",
                "dataSources": [
                    {
                        "datasetId": 24507,
                        "sourceId": 31215,
                        "sourceType": "datasetVersion"
                    }
                ],
                "dockerImageVersionId": 30698,
                "isGpuEnabled": True,
                "isInternetEnabled": True,
                "language": "python",
                "sourceType": "notebook"
            },
            "kernelspec": {
                "name": "python3",
                "display_name": "Python 3"
            },
            "language_info": {
                "name": "python"
            }
        },
        "cells": []
    }

    def add_md(text):
        notebook["cells"].append({
            "cell_type": "markdown",
            "metadata": {},
            "source": [line + "\n" for line in text.strip().split("\n")]
        })

    def add_code(text):
        notebook["cells"].append({
            "cell_type": "code",
            "metadata": {},
            "execution_count": None,
            "outputs": [],
            "source": [line + "\n" for line in text.strip().split("\n")]
        })

    # Cell 1: Kaggle Header
    add_md(r"""# LoanShield: Explainable Loan Default Risk Prediction (Kaggle Edition)
**Author:** LoanShield ML Engineering Team  
**Dataset:** [Lending Club Loan Dataset (wordsforthewise/lending-club)](https://www.kaggle.com/datasets/wordsforthewise/lending-club)  
**Environment:** Kaggle Notebook (CPU or P100/T4 GPU Accelerator)

---

### Project Objectives & Kaggle Workflow
1. **Direct Kaggle Dataset Ingestion**: Automatic detection of `/kaggle/input/lending-club/accepted_2007_to_2018Q4.csv.gz` with low-memory chunked/sampled loading.
2. **Rigorous Data Preprocessing**:
   - Filter strictly for terminal loan outcomes: `Fully Paid` (0) vs `Charged Off` (1).
   - Exclude active unresolved loans (`Current`, `Late`, `In Grace Period`) to prevent target leakage.
   - Drop all post-origination variables (repayments, recoveries, settlement flags, subsequent credit monitoring).
3. **Partitioning**: 3-way stratified partition: **70% Training / 15% Validation / 15% Testing**.
4. **Leakage-Free Feature Pipeline**: Scikit-Learn `ColumnTransformer` fitted strictly on training data.
5. **Model Benchmarking**:
   - **Logistic Regression**: Linear log-odds baseline with balanced class weights.
   - **Random Forest**: Non-linear ensemble capturing complex debt and credit interactions.
   - **XGBoost Classifier**: Gradient boosted trees utilizing GPU acceleration (`device='cuda'`) when available, with validation early stopping.
6. **Evaluation & Explainability**: ROC-AUC, Precision, Recall, F1, Confusion Matrices, and SHAP feature attribution.
7. **Production Export**: Saves `loanshield_model.joblib` directly to `/kaggle/working/`, ready to download and drop into your **LoanShield backend**!""")

    # Cell 2: Imports & Environment
    add_md(r"""## 1. Environment Setup & Dependency Verification
Kaggle environments come pre-installed with `xgboost`, `scikit-learn`, `pandas`, `numpy`, and `matplotlib`. We verify GPU availability and ensure `shap` and `joblib` are ready.""")

    add_code(r"""# Verify and install dependencies if needed
!pip install --quiet shap joblib

import os
import sys
import gc
import json
import warnings
import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Scikit-learn preprocessing and metrics
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    roc_curve,
    precision_recall_curve,
    average_precision_score,
    confusion_matrix,
    classification_report
)

# XGBoost and SHAP
import xgboost as xgb
from xgboost import XGBClassifier
import shap

# Verify GPU availability in Kaggle
has_gpu = False
try:
    import torch
    has_gpu = torch.cuda.is_available()
    device_name = torch.cuda.get_device_name(0) if has_gpu else "CPU only"
except Exception:
    device_name = "CPU"

print("=" * 65)
print(" KAGGLE ENVIRONMENT READY")
print(f"Python Version:   {sys.version.split()[0]}")
print(f"XGBoost Version:  {xgb.__version__}")
print(f"Hardware Device:  {device_name} (GPU Active: {has_gpu})")
print("=" * 65)

# Plotting aesthetics
plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')
sns.set_palette('deep')
plt.rcParams['figure.dpi'] = 110
warnings.filterwarnings('ignore')""")

    # Cell 3: Kaggle Dataset Path Detection & Ingestion
    add_md(r"""## 2. Dataset Ingestion from Kaggle Input
In Kaggle, datasets attached to a notebook reside under `/kaggle/input/`.
We automatically search `/kaggle/input/` for the Lending Club accepted loans file (`accepted_2007_to_2018Q4.csv.gz` or `.csv`).

### Memory Configuration:
- `SAMPLE_SIZE = 100_000`: Fast training (~2–3 minutes), recommended for standard sessions.
- `SAMPLE_SIZE = 300_000` or `500_000`: Deep benchmark for high-accuracy results (takes ~5–7 mins with GPU).
- `SAMPLE_SIZE = None`: Full 2.26 million dataset (Kaggle GPU runtime has 30 GB RAM).""")

    add_code(r"""# ==========================================
# CONFIGURATION
# ==========================================
SAMPLE_SIZE = 150000    # Set to 150,000 for high precision in ~2 mins. Set to None for full dataset.
RANDOM_STATE = 42

# Search /kaggle/input for the dataset
dataset_path = None
for root, dirs, files in os.walk('/kaggle/input'):
    for file in files:
        if 'accepted_2007' in file.lower() and (file.endswith('.csv') or file.endswith('.csv.gz')):
            dataset_path = os.path.join(root, file)
            break
    if dataset_path:
        break

# Local fallback if testing outside Kaggle
if not dataset_path:
    for candidate in [
        "/content/accepted_2007_to_2018Q4.csv",
        "/content/accepted_2007_to_2018Q4.csv.gz",
        "../backend/ml/data/lending_club_granting.csv",
        "accepted_2007_to_2018Q4.csv"
    ]:
        if os.path.exists(candidate):
            dataset_path = candidate
            break

print("=" * 65)
if dataset_path:
    print(f" Found Lending Club dataset at:\n   {dataset_path}")
    print(f" File Size: {os.path.getsize(dataset_path) / (1024 ** 2):.1f} MB")
else:
    print("⚠ Dataset not found in /kaggle/input.")
    print("   Please attach the 'wordsforthewise/lending-club' dataset via '+ Add Input' on the right panel.")
print("=" * 65)

# Load dataset
if dataset_path:
    compression = 'gzip' if dataset_path.endswith('.gz') else None
    print(f"Loading data (sample_size={SAMPLE_SIZE})...")
    if SAMPLE_SIZE is not None:
        # Read a sufficient batch to filter terminal loans
        raw_df = pd.read_csv(dataset_path, nrows=SAMPLE_SIZE * 2, compression=compression, low_memory=False)
    else:
        raw_df = pd.read_csv(dataset_path, compression=compression, low_memory=False)
    print(f" Loaded {raw_df.shape[0]:,} rows and {raw_df.shape[1]} columns.")
else:
    raise FileNotFoundError("Please attach the 'wordsforthewise/lending-club' dataset in Kaggle.")""")

    # Cell 4: Target Variable Formulation
    add_md(r"""## 3. Target Formulation & Exclusion of Active Loans
### Label Definition:
- **`Fully Paid` $\rightarrow$ Class 0 (Non-Default)**
- **`Charged Off` $\rightarrow$ Class 1 (Default)**

### Why We Exclude Active Loans:
Loans marked as `Current`, `In Grace Period`, or `Late` have not reached maturity. We cannot know their final resolution. Labeling them as "non-default" creates false negative label leakage, while labeling them as "default" is factually incorrect. We strictly keep resolved terminal outcomes.""")

    add_code(r"""# Inspect original loan status distribution
print("Top loan_status categories:")
display(raw_df['loan_status'].value_counts(dropna=False).head(10).to_frame())

# Filter strictly for terminal binary outcomes
terminal_statuses = ['Fully Paid', 'Charged Off']
filtered_df = raw_df[raw_df['loan_status'].isin(terminal_statuses)].copy()

# Binary Target: 0 = Fully Paid, 1 = Default (Charged Off)
filtered_df['is_default'] = (filtered_df['loan_status'] == 'Charged Off').astype(int)

# Subsample to exact desired SAMPLE_SIZE
if SAMPLE_SIZE is not None and len(filtered_df) > SAMPLE_SIZE:
    filtered_df = filtered_df.sample(n=SAMPLE_SIZE, random_state=RANDOM_STATE).reset_index(drop=True)

default_rate = filtered_df['is_default'].mean()
counts = filtered_df['is_default'].value_counts()

print("\n" + "=" * 60)
print(f"TARGET SUMMARY (Total: {len(filtered_df):,} records):")
print(f"  Non-Default (0 - Fully Paid): {counts.get(0, 0):,} ({1 - default_rate:.2%})")
print(f"  Default     (1 - Charged Off): {counts.get(1, 0):,} ({default_rate:.2%})")
print(f"  Class Imbalance Ratio:         {counts.get(0, 0) / max(1, counts.get(1, 0)):.2f} : 1")
print("=" * 60)

# Target Distribution Plot
plt.figure(figsize=(6, 3.5))
ax = sns.countplot(x='is_default', data=filtered_df, palette=['#2ecc71', '#e74c3c'])
plt.title("Loan Outcome Distribution (0 = Paid, 1 = Default)", fontsize=12, weight='bold')
plt.xlabel("Target (is_default)")
plt.ylabel("Borrower Count")
plt.xticks([0, 1], ['Fully Paid (0)', 'Charged Off (1)'])
for p in ax.patches:
    h = p.get_height()
    ax.annotate(f"{h:,}\n({h/len(filtered_df):.1%})",
                (p.get_x() + p.get_width() / 2., h / 2),
                ha='center', va='center', color='white', fontweight='bold')
plt.tight_layout()
plt.show()""")

    # Cell 5: Data Cleaning & Feature Selection
    add_md(r"""## 4. Data Cleaning & Target Leakage Prevention
### Dropping Post-Origination Variables
We exclude all features generated after the loan originated:
- **Repayments**: `total_pymnt`, `total_rec_prncp`, `total_rec_int`, `last_pymnt_amnt`, `last_pymnt_d`.
- **Collections & Recoveries**: `recoveries`, `collection_recovery_fee`.
- **Subsequent Credit Pulls**: `last_fico_range_high`, `last_fico_range_low`, `last_credit_pull_d`.
- **Settlement Flags**: `debt_settlement_flag`, `settlement_status`, `hardship_flag`.
- **Identifiers**: `id`, `member_id`, `url`, `emp_title`, `title`, `zip_code`.

### Selected Pre-Origination Underwriting Features:
- **Financial Profile**: `annual_inc`, `loan_amnt`, `dti`, `revol_util`
- **Origination FICO Score**: `(fico_range_low + fico_range_high) / 2`
- **Tenure & Terms**: `term_months` (36 or 60), `emp_length_years` (0 to 10+)
- **Credit Bureau Metrics**: `delinq_2yrs`, `inq_last_6mths`, `open_acc`, `pub_rec`, `mort_acc`
- **Categoricals**: `home_ownership` (MORTGAGE, RENT, OWN, OTHER), `loan_purpose`
- **Engineered Financial Ratio**: `loan_to_income = loan_amnt / annual_inc`""")

    add_code(r"""def clean_and_prepare_lending_features(df):
    # Extracts authentic pre-origination underwriting features, parses numerical strings,
    # and constructs financial risk ratios.
    cleaned = pd.DataFrame()
    
    # 1. Loan Amount & Income
    cleaned['loan_amnt'] = pd.to_numeric(df['loan_amnt'], errors='coerce')
    cleaned['annual_inc'] = pd.to_numeric(df['annual_inc'], errors='coerce')
    
    # 2. FICO Score at Origination
    if 'fico_range_low' in df.columns and 'fico_range_high' in df.columns:
        low = pd.to_numeric(df['fico_range_low'], errors='coerce')
        high = pd.to_numeric(df['fico_range_high'], errors='coerce')
        cleaned['fico_score'] = (low + high) / 2.0
    elif 'fico_score' in df.columns:
        cleaned['fico_score'] = pd.to_numeric(df['fico_score'], errors='coerce')
    else:
        cleaned['fico_score'] = 700.0
        
    # 3. Debt to Income Ratio (%)
    cleaned['dti'] = pd.to_numeric(df['dti'], errors='coerce')
    
    # 4. Term in Months (Extract 36 or 60)
    if 'term' in df.columns:
        cleaned['term_months'] = df['term'].astype(str).str.extract(r'(\d+)').astype(float)
    elif 'term_months' in df.columns:
        cleaned['term_months'] = pd.to_numeric(df['term_months'], errors='coerce')
    else:
        cleaned['term_months'] = 36.0
        
    # 5. Employment Length in Years
    if 'emp_length' in df.columns:
        emp_str = df['emp_length'].astype(str)
        emp_clean = emp_str.str.replace(r'\+.*', '', regex=True).str.replace(r'<\s*1.*', '0', regex=True).str.extract(r'(\d+)')
        cleaned['emp_length_years'] = pd.to_numeric(emp_clean[0], errors='coerce')
    elif 'emp_length_years' in df.columns:
        cleaned['emp_length_years'] = pd.to_numeric(df['emp_length_years'], errors='coerce')
    else:
        cleaned['emp_length_years'] = 5.0
        
    # 6. Revolving Utilization (%)
    if 'revol_util' in df.columns:
        if df['revol_util'].dtype == object:
            cleaned['revol_util'] = pd.to_numeric(df['revol_util'].astype(str).str.replace('%', '', regex=False), errors='coerce')
        else:
            cleaned['revol_util'] = pd.to_numeric(df['revol_util'], errors='coerce')
    else:
        cleaned['revol_util'] = 50.0
        
    # 7. Credit Bureau Bureau Accounts & Delinquencies
    for col in ['delinq_2yrs', 'inq_last_6mths', 'open_acc', 'pub_rec', 'mort_acc']:
        if col in df.columns:
            cleaned[col] = pd.to_numeric(df[col], errors='coerce')
        else:
            cleaned[col] = 0.0
            
    # 8. Categorical Encodings
    if 'home_ownership' in df.columns:
        cleaned['home_ownership'] = df['home_ownership'].astype(str).str.upper().str.strip()
        cleaned['home_ownership'] = cleaned['home_ownership'].replace({'NONE': 'OTHER', 'ANY': 'OTHER'})
    else:
        cleaned['home_ownership'] = 'RENT'
        
    purpose_col = 'loan_purpose' if 'loan_purpose' in df.columns else 'purpose'
    if purpose_col in df.columns:
        cleaned['loan_purpose'] = df[purpose_col].astype(str).str.lower().str.strip()
    else:
        cleaned['loan_purpose'] = 'debt_consolidation'
        
    # 9. Domain Ratio: Loan-to-Income
    cleaned['loan_to_income'] = np.round(cleaned['loan_amnt'] / cleaned['annual_inc'].replace(0, 1.0), 4)
    
    # 10. Target Label
    cleaned['is_default'] = df['is_default'].values
    
    return cleaned

processed_df = clean_and_prepare_lending_features(filtered_df)
print(f" Feature matrix successfully prepared with {processed_df.shape[0]:,} rows and {processed_df.shape[1]} columns.")
display(processed_df.head(3))""")

    # Cell 6: 3-Way Train/Val/Test Split
    add_md(r"""## 5. Dataset Splitting: 70% Train / 15% Validation / 15% Test
We use a **3-way stratified partition**:
1. **70% Training Set**: Fits model parameters and preprocessing statistics.
2. **15% Validation Set**: Monitored by XGBoost for **early stopping** (`early_stopping_rounds=15`) to prevent overfitting.
3. **15% Testing Set**: Held out strictly until the end as a gold standard to compute unbiased final metrics.""")

    add_code(r"""NUMERICAL_FEATURES = [
    'annual_inc',
    'loan_amnt',
    'fico_score',
    'dti',
    'emp_length_years',
    'term_months',
    'revol_util',
    'delinq_2yrs',
    'inq_last_6mths',
    'open_acc',
    'pub_rec',
    'mort_acc',
    'loan_to_income'
]

CATEGORICAL_FEATURES = [
    'home_ownership',
    'loan_purpose'
]

ALL_FEATURES = NUMERICAL_FEATURES + CATEGORICAL_FEATURES
TARGET_COLUMN = 'is_default'

X = processed_df[ALL_FEATURES]
y = processed_df[TARGET_COLUMN]

# Step 1: 70% Train, 30% Temp (Validation + Test)
X_train_raw, X_temp_raw, y_train, y_temp = train_test_split(
    X, y, test_size=0.30, random_state=RANDOM_STATE, stratify=y
)

# Step 2: Split Temp 50/50 -> 15% Validation and 15% Test
X_val_raw, X_test_raw, y_val, y_test = train_test_split(
    X_temp_raw, y_temp, test_size=0.50, random_state=RANDOM_STATE, stratify=y_temp
)

print("=" * 65)
print("DATASET PARTITION SUMMARY (3-WAY STRATIFIED SPLIT):")
print(f"  Training Set:   {len(X_train_raw):,} samples (70.0%) | Default Rate: {y_train.mean():.2%}")
print(f"  Validation Set: {len(X_val_raw):,} samples (15.0%) | Default Rate: {y_val.mean():.2%}")
print(f"  Testing Set:    {len(X_test_raw):,} samples (15.0%) | Default Rate: {y_test.mean():.2%}")
print("=" * 65)""")

    # Cell 7: Preprocessing Pipeline Architecture
    add_md(r"""## 6. Preprocessing Pipeline Architecture
To eliminate data leakage, imputation medians, standard scaling parameters, and one-hot categories are learned **strictly on `X_train_raw`**, then used to transform `X_val_raw` and `X_test_raw`.""")

    add_code(r"""# 1. Numerical Pipeline (Median Imputation + Standard Scaling)
num_pipeline = Pipeline([
    ('imputer', SimpleImputer(strategy='median')),
    ('scaler', StandardScaler())
])

# 2. Categorical Pipeline (Most Frequent Imputation + One-Hot Encoding)
cat_pipeline = Pipeline([
    ('imputer', SimpleImputer(strategy='most_frequent')),
    ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
])

# 3. Composite Preprocessor
preprocessor = ColumnTransformer(transformers=[
    ('num', num_pipeline, NUMERICAL_FEATURES),
    ('cat', cat_pipeline, CATEGORICAL_FEATURES)
], remainder='drop')

# Fit strictly on Training Data
print("Fitting ColumnTransformer on training partition...")
X_train_preprocessed = preprocessor.fit_transform(X_train_raw)
X_val_preprocessed = preprocessor.transform(X_val_raw)
X_test_preprocessed = preprocessor.transform(X_test_raw)

# Extract transformed feature names
cat_encoder = preprocessor.named_transformers_['cat'].named_steps['onehot']
cat_encoded_names = list(cat_encoder.get_feature_names_out(CATEGORICAL_FEATURES))
feature_names = NUMERICAL_FEATURES + cat_encoded_names

print(f" Pipeline successfully fitted.")
print(f"  Raw Features:         {len(ALL_FEATURES)}")
print(f"  Transformed Features: {len(feature_names)} columns after One-Hot Encoding")""")

    # Cell 8: Training the Three Algorithms
    add_md(r"""## 7. Model Training: Comparing Three Algorithms
We train three distinct algorithms with class imbalance weighting:

### 1. Logistic Regression
- Industry baseline with direct log-odds interpretability.
- `class_weight='balanced'`, `solver='lbfgs'`.

### 2. Random Forest Classifier
- Non-linear ensemble of decision trees.
- `n_estimators=100`, `max_depth=12`, `class_weight='balanced'`, `n_jobs=-1`.

### 3. XGBoost Classifier (Extreme Gradient Boosting)
- State-of-the-art gradient boosted trees.
- `scale_pos_weight = count(negative) / count(positive)`
- **GPU Acceleration**: Uses `device='cuda'` if GPU is detected on Kaggle, otherwise CPU.
- **Early Stopping**: Monitored on the validation set (`eval_set=[(X_val, y_val)]`) to halt when log-loss ceases improving.""")

    add_code(r"""# Compute class weight ratio for XGBoost
num_negatives = (y_train == 0).sum()
num_positives = (y_train == 1).sum()
xgb_scale_weight = num_negatives / max(1, num_positives)

print(f"Training Class Ratio: {num_negatives:,} Non-Defaults vs {num_positives:,} Defaults")
print(f"Calculated scale_pos_weight for XGBoost: {xgb_scale_weight:.2f}")

# Hardware acceleration settings
xgb_device = "cuda" if has_gpu else "cpu"
print(f"XGBoost will execute on: {xgb_device.upper()}\n")

models = {
    "Logistic Regression": LogisticRegression(
        max_iter=1000,
        solver='lbfgs',
        class_weight='balanced',
        random_state=RANDOM_STATE
    ),
    "Random Forest": RandomForestClassifier(
        n_estimators=100,
        max_depth=12,
        min_samples_split=10,
        min_samples_leaf=4,
        class_weight='balanced',
        random_state=RANDOM_STATE,
        n_jobs=-1
    ),
    "XGBoost": XGBClassifier(
        n_estimators=300,
        max_depth=5,
        learning_rate=0.06,
        subsample=0.85,
        colsample_bytree=0.85,
        scale_pos_weight=xgb_scale_weight,
        random_state=RANDOM_STATE,
        eval_metric='logloss',
        early_stopping_rounds=15,
        tree_method='hist',
        device=xgb_device,
        n_jobs=-1
    )
}

trained_models = {}

# Fit each model
for name, model in models.items():
    print(f"Training {name} on {X_train_preprocessed.shape[0]:,} samples...")
    if name == "XGBoost":
        model.fit(
            X_train_preprocessed, y_train,
            eval_set=[(X_val_preprocessed, y_val)],
            verbose=False
        )
        print(f"  Best iteration: {model.best_iteration if hasattr(model, 'best_iteration') else 'N/A'}")
    else:
        model.fit(X_train_preprocessed, y_train)
    trained_models[name] = model
    print(f"  {name} training complete.\n")

print("All three machine learning algorithms trained successfully!")""")

    # Cell 9: Model Evaluation & Benchmark Comparison
    add_md(r"""## 8. Model Evaluation & Benchmark Comparison
We evaluate all three algorithms on the **strictly held-out test partition (15%)**:
- **ROC-AUC**: Probability that a defaulting borrower is scored higher than a non-defaulting borrower.
- **Recall**: Percentage of actual defaulting borrowers correctly identified.
- **Precision**: Percentage of predicted defaults that truly default.
- **F1-Score**: Harmonic mean of Precision and Recall.""")

    add_code(r"""evaluation_results = []
test_predictions = {}
test_probabilities = {}

for name, model in trained_models.items():
    y_pred = model.predict(X_test_preprocessed)
    y_prob = model.predict_proba(X_test_preprocessed)[:, 1]
    
    test_predictions[name] = y_pred
    test_probabilities[name] = y_prob
    
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    auc = roc_auc_score(y_test, y_prob)
    pr_auc = average_precision_score(y_test, y_prob)
    
    evaluation_results.append({
        'Model': name,
        'Accuracy': round(acc, 4),
        'Precision': round(prec, 4),
        'Recall': round(rec, 4),
        'F1-Score': round(f1, 4),
        'ROC-AUC': round(auc, 4),
        'PR-AUC': round(pr_auc, 4)
    })

benchmark_df = pd.DataFrame(evaluation_results).sort_values(by='ROC-AUC', ascending=False).reset_index(drop=True)
print("=" * 75)
print("LOANSHIELD MODEL BENCHMARK ON HELD-OUT TEST DATA")
print("=" * 75)
display(benchmark_df)

champion_name = benchmark_df.iloc[0]['Model']
champion_model = trained_models[champion_name]
print(f"\n Champion Model: '{champion_name}' with ROC-AUC of {benchmark_df.iloc[0]['ROC-AUC']:.4f}")""")

    # Cell 10: Multi-Panel Visualizations
    add_md(r"""## 9. Comprehensive Performance Visualizations
We generate comparative charts:
1. Performance Metrics Bar Chart
2. Combined ROC Curves
3. Precision-Recall Curves
4. Confusion Matrix Heatmap for Champion Model""")

    add_code(r"""fig = plt.figure(figsize=(15, 11))

# 1. Bar Chart Comparison
ax1 = plt.subplot(2, 2, 1)
metrics_to_plot = ['Accuracy', 'Precision', 'Recall', 'F1-Score', 'ROC-AUC']
df_melted = benchmark_df.melt(id_vars=['Model'], value_vars=metrics_to_plot, var_name='Metric', value_name='Score')
sns.barplot(x='Metric', y='Score', hue='Model', data=df_melted, palette='viridis', ax=ax1)
ax1.set_title("Algorithm Performance Metrics Comparison", fontsize=12, weight='bold')
ax1.set_ylim(0, 1.05)
for p in ax1.patches:
    h = p.get_height()
    if h > 0:
        ax1.annotate(f"{h:.2f}", (p.get_x() + p.get_width() / 2., h + 0.01),
                     ha='center', va='bottom', fontsize=8)

# 2. Combined ROC Curves
ax2 = plt.subplot(2, 2, 2)
colors = {'Logistic Regression': '#3498db', 'Random Forest': '#2ecc71', 'XGBoost': '#e67e22'}
for name, prob in test_probabilities.items():
    fpr, tpr, _ = roc_curve(y_test, prob)
    auc_val = roc_auc_score(y_test, prob)
    ax2.plot(fpr, tpr, label=f"{name} (AUC = {auc_val:.3f})", color=colors[name], linewidth=2.2)

ax2.plot([0, 1], [0, 1], 'k--', alpha=0.6, label='Random Chance (AUC = 0.50)')
ax2.set_title("Receiver Operating Characteristic (ROC) Curves", fontsize=12, weight='bold')
ax2.set_xlabel("False Positive Rate (1 - Specificity)")
ax2.set_ylabel("True Positive Rate (Recall / Sensitivity)")
ax2.legend(loc='lower right')

# 3. Precision-Recall Curves
ax3 = plt.subplot(2, 2, 3)
for name, prob in test_probabilities.items():
    precision_vals, recall_vals, _ = precision_recall_curve(y_test, prob)
    pr_auc_val = average_precision_score(y_test, prob)
    ax3.plot(recall_vals, precision_vals, label=f"{name} (PR-AUC = {pr_auc_val:.3f})", color=colors[name], linewidth=2.2)

ax3.set_title("Precision-Recall Curves", fontsize=12, weight='bold')
ax3.set_xlabel("Recall")
ax3.set_ylabel("Precision")
ax3.legend(loc='upper right')

# 4. Confusion Matrix Subplot
ax4 = plt.subplot(2, 2, 4)
cm = confusion_matrix(y_test, test_predictions[champion_name])
cm_norm = cm.astype('float') / cm.sum(axis=1)[:, np.newaxis]

sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', cbar=False, ax=ax4,
            xticklabels=['Pred Paid (0)', 'Pred Default (1)'],
            yticklabels=['Actual Paid (0)', 'Actual Default (1)'])
ax4.set_title(f"Confusion Matrix: Champion Model ({champion_name})", fontsize=12, weight='bold')
ax4.set_ylabel("True Outcome")
ax4.set_xlabel("Predicted Outcome")

for i in range(2):
    for j in range(2):
        ax4.text(j + 0.5, i + 0.7, f"({cm_norm[i, j]:.1%})", 
                 ha="center", va="center", color="gray", fontsize=9)

plt.tight_layout()
plt.show()

print("\n" + "=" * 70)
print(f"DETAILED CLASSIFICATION REPORT FOR {champion_name.upper()}")
print("=" * 70)
print(classification_report(y_test, test_predictions[champion_name], target_names=['Fully Paid (0)', 'Default (1)']))""")

    # Cell 11: SHAP Explainability
    add_md(r"""## 10. Explainability & Feature Attribution (SHAP)
We explain predictions globally and locally using **SHAP (SHapley Additive exPlanations)**.""")

    add_code(r"""# Global Feature Importance
if hasattr(champion_model, 'feature_importances_'):
    importances = champion_model.feature_importances_
    feat_imp_df = pd.DataFrame({'Feature': feature_names, 'Importance': importances}).sort_values(by='Importance', ascending=False)
elif hasattr(champion_model, 'coef_'):
    importances = np.abs(champion_model.coef_[0])
    feat_imp_df = pd.DataFrame({'Feature': feature_names, 'Importance': importances}).sort_values(by='Importance', ascending=False)

plt.figure(figsize=(10, 5))
sns.barplot(x='Importance', y='Feature', data=feat_imp_df.head(12), palette='mako')
plt.title(f"Top 12 Global Features Influencing Default Risk ({champion_name})", fontsize=12, weight='bold')
plt.xlabel("Relative Importance Score")
plt.tight_layout()
plt.show()

# SHAP Local & Global Explanations on a Representative Sample
print("Computing SHAP values for 500 test samples...")
shap_sample_size = min(500, len(X_test_preprocessed))
X_shap_sample = X_test_preprocessed[:shap_sample_size]

if champion_name == "XGBoost":
    explainer = shap.TreeExplainer(champion_model)
    shap_values = explainer.shap_values(X_shap_sample)
elif champion_name == "Random Forest":
    explainer = shap.TreeExplainer(champion_model)
    shap_values = explainer.shap_values(X_shap_sample)
    if isinstance(shap_values, list):
        shap_values = shap_values[1]
else:
    explainer = shap.LinearExplainer(champion_model, X_train_preprocessed[:500])
    shap_values = explainer.shap_values(X_shap_sample)

# Beeswarm Summary Plot
plt.figure(figsize=(10, 6))
shap.summary_plot(shap_values, X_shap_sample, feature_names=feature_names, max_display=12, show=False)
plt.title(f"SHAP Summary Plot: Risk Drivers ({champion_name})", fontsize=12, weight='bold')
plt.tight_layout()
plt.show()

# Individual Applicant Waterfall Plot
sample_idx = 0
expected_val = explainer.expected_value
if isinstance(expected_val, (list, np.ndarray)):
    expected_val = expected_val[1] if len(expected_val) > 1 else expected_val[0]

explanation_obj = shap.Explanation(
    values=shap_values[sample_idx],
    base_values=expected_val,
    data=X_shap_sample[sample_idx],
    feature_names=feature_names
)

plt.figure(figsize=(10, 5))
shap.plots.waterfall(explanation_obj, max_display=10, show=False)
plt.title("Individual Applicant SHAP Risk Waterfall Plot", fontsize=12, weight='bold')
plt.tight_layout()
plt.show()""")

    # Cell 12: Saving Artifacts to /kaggle/working/
    add_md(r"""## 11. Exporting Production Artifacts to `/kaggle/working/`
We package the trained preprocessing pipeline and champion estimator into a single, unified scikit-learn `Pipeline`.

Kaggle automatically saves everything written to `/kaggle/working/` as downloadable artifacts under the **Output** tab!""")

    add_code(r"""# Output directory in Kaggle
output_dir = "/kaggle/working" if os.path.exists("/kaggle/working") else "."

# 1. Build cohesive end-to-end Pipeline
loanshield_pipeline = Pipeline([
    ('preprocessor', preprocessor),
    ('classifier', champion_model)
])

# 2. Serialize Pipeline
model_filepath = os.path.join(output_dir, "loanshield_model.joblib")
joblib.dump(loanshield_pipeline, model_filepath)
print(f" Saved unified pipeline to: {model_filepath} ({os.path.getsize(model_filepath) / 1024:.1f} KB)")

# Also save standalone files for flexibility
joblib.dump(preprocessor, os.path.join(output_dir, "preprocessor.joblib"))
joblib.dump(champion_model, os.path.join(output_dir, "xgboost.joblib"))

# 3. Export Metadata JSON
metadata = {
    "project_name": "LoanShield",
    "project_title": "Explainable Loan Default Risk Prediction",
    "dataset_source": "Lending Club (Kaggle)",
    "champion_model": champion_name,
    "evaluation_metrics": benchmark_df.to_dict(orient='records'),
    "risk_thresholds": {
        "low_risk_threshold": 0.30,
        "high_risk_threshold": 0.60
    },
    "features": {
        "numerical_features": NUMERICAL_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "all_input_features": ALL_FEATURES,
        "transformed_feature_names": feature_names
    }
}

metadata_filepath = os.path.join(output_dir, "loanshield_metadata.json")
with open(metadata_filepath, "w") as f:
    json.dump(metadata, f, indent=2)
print(f" Saved metadata to: {metadata_filepath}")

print("\n" + "=" * 70)
print(" TRAINING & ARTIFACT GENERATION COMPLETE!")
print(f"Files available in Kaggle Output ({output_dir}):")
for fname in os.listdir(output_dir):
    if fname.endswith(('.joblib', '.json')):
        print(f"   • {fname} ({os.path.getsize(os.path.join(output_dir, fname)) / 1024:.1f} KB)")
print("=" * 70)
print("\nTo use this model in your LoanShield app:")
print("1. Click the 'Output' tab on the right panel in Kaggle.")
print("2. Download 'loanshield_model.joblib' and 'loanshield_metadata.json'.")
print("3. Copy them into your 'backend/ml/saved_models/' folder!")""")

    return notebook

if __name__ == '__main__':
    nb = create_kaggle_notebook()
    output_path = r"c:\Users\mithu\OneDrive\Documents\PROJECT\LoanShield\notebooks\LoanShield_Kaggle_Training.ipynb"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(nb, f, indent=2)
    print(f"Successfully generated Kaggle Notebook at: {output_path}")
