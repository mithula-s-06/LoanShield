# LoanGuard – Intelligent Loan Default Risk Assessment (LoanShield)

A machine-learning-powered banking decision-support platform designed for **Bank Underwriters and Credit Analysts**. The application analyzes loan applications, predicts loan default probabilities across four supervised ML classifiers, provides explainable AI (SHAP) risk factor attributions, and stores underwriting files in MongoDB.

---

## 1. System Architecture

```
LoanShield / LoanGuard
├── frontend/                     # Next.js 16 + React 19 + Tailwind CSS + TypeScript
│   ├── app/
│   │   ├── page.tsx              # / -> Executive Risk Analytics Dashboard
│   │   ├── applications/
│   │   │   ├── page.tsx          # /applications -> Searchable & Filterable Registry
│   │   │   └── [id]/page.tsx     # /applications/[id] -> Detailed Borrower Underwriting File
│   │   ├── predict/page.tsx      # /predict -> Real-Time Loan Risk Assessment Workbench
│   │   ├── models/page.tsx       # /models -> ML Performance & ROC Diagnostics
│   │   ├── layout.tsx            # Global Layout with Bank Analyst Sidebar & TopBar
│   │   └── globals.css           # Fintech Visual System Styles
│   ├── components/               # Reusable UI Component Library
│   │   ├── Sidebar.tsx           # Navigation & Bank Analyst Profile
│   │   ├── TopBar.tsx            # Engine Health Status & Header
│   │   ├── StatCard.tsx          # Metric KPI Cards with Sparklines
│   │   ├── RiskBadge.tsx         # Color-coded Risk Badges with Pulsing Dot
│   │   ├── RiskGauge.tsx         # Semi-circular SVG Risk Probability Gauge
│   │   ├── ProbabilityBar.tsx    # Linear Progress Bar with Threshold Markers
│   │   ├── RiskFactors.tsx       # SHAP Positive & Risk-Reducing Factors
│   │   ├── ModelComparisonCard.tsx # Multi-Model Consensus Cards
│   │   ├── FeatureImportanceChart.tsx # Global Feature Attribution Bar Chart
│   │   ├── ConfusionMatrixView.tsx # Test-Set 2x2 Confusion Matrix (TP, FP, TN, FN)
│   │   ├── RocCurveChart.tsx     # Multi-Model ROC Curves with AUC Legends
│   │   ├── RiskDistributionChart.tsx # Donut Portfolio Distribution
│   │   ├── ApplicantTable.tsx    # Sortable & Filterable Table
│   │   └── LoanAssessmentForm.tsx # Banker Entry Form with Presets
│   └── lib/
│       ├── api.ts                # Type-Safe REST Client
│       └── types.ts              # TypeScript Interfaces
│
├── backend/                      # Python FastAPI REST API Backend
│   ├── app/
│   │   ├── main.py               # FastAPI Entrypoint, CORS, Lifespan Startup
│   │   ├── config.py             # Configurable Risk Thresholds & Environment Settings
│   │   ├── database/
│   │   │   └── mongodb.py        # Async Motor / PyMongo Connection & Indexes
│   │   ├── schemas/
│   │   │   └── loan.py           # Pydantic Schemas for Validation & Responses
│   │   ├── services/
│   │   │   ├── ml_service.py     # Pre-trained Model Inference & Risk Classification
│   │   │   └── db_service.py     # CRUD, Search, Filters, Stats Aggregation
│   │   └── routes/
│   │       └── api.py            # REST Endpoints
│   ├── ml/                       # Machine Learning Training & Pipeline
│   │   ├── data_loader.py        # Lending Club Granting Dataset Generator/Loader
│   │   ├── preprocess.py         # ColumnTransformer, Imputation, Scaling, OHE
│   │   ├── train.py              # ML Training Pipeline for all 4 Models
│   │   ├── evaluate.py           # Test Set Metric Computation & ROC Coordinates
│   │   ├── explain.py            # SHAP Tree & Linear Attribution Engine
│   │   ├── data/                 # Raw/Processed CSV Data
│   │   └── saved_models/         # Serialized Joblib Models & metrics.json
│   ├── requirements.txt          # Python Dependencies
│   ├── .env                      # Active Environment Variables
│   └── .env.example              # Template Environment Configuration
│
└── README.md
```

---

## 2. Machine Learning Methodology & Models

The dataset uses pre-loan granting variables available at the time of loan application to avoid data leakage (Lending Club Granting benchmark). The target is binary: `0 = Fully Paid`, `1 = Default / Charged Off`.

### Features Used:
- `annual_inc`: Annual income of applicant ($)
- `loan_amnt`: Requested principal loan amount ($)
- `fico_score`: Credit score (300–850)
- `dti`: Debt-to-Income ratio (%)
- `emp_length_years`: Employment tenure (0–10+ years)
- `home_ownership`: `MORTGAGE`, `RENT`, `OWN`, `OTHER`
- `loan_purpose`: `debt_consolidation`, `credit_card`, `home_improvement`, `small_business`, etc.
- `term_months`: 36 or 60 months
- `revol_util`: Revolving line credit utilization rate (%)
- `delinq_2yrs`: Past-due delinquencies in past 2 years
- `inq_last_6mths`: Credit inquiries in past 6 months
- `open_acc`: Number of open credit lines
- `pub_rec`: Derogatory public records
- `mort_acc`: Mortgage accounts
- `loan_to_income`: Engineered ratio of loan amount to annual earnings

### The Four Models Evaluated:
All four models are trained on a stratified 80% train split and evaluated strictly on the 20% holdout test partition (4,000 out-of-sample loans):

| Model | Purpose & Algorithm | Accuracy | Precision | Recall | F1-Score | ROC-AUC |
|---|---|---|---|---|---|---|
| **Logistic Regression** | Baseline linear model with L2 regularization | 72.28% | 54.29% | 70.94% | 0.6151 | **0.7930** |
| **Decision Tree** | Interpretable tree with cost-complexity pruning | 66.65% | 47.60% | 67.41% | 0.5580 | 0.7302 |
| **Random Forest** | 150 bagged decision trees with balanced class weights | 71.65% | 53.59% | 68.78% | 0.6024 | 0.7748 |
| **XGBoost** | Gradient boosted decision trees optimized for tabular default risk | 75.05% | 65.03% | 43.47% | 0.5211 | 0.7788 |

*Metrics are computed from the real test set and persisted in `backend/ml/saved_models/metrics.json` and MongoDB `model_metrics` collection.*

---

## 3. Risk Classification & Explainability

### Configurable Risk Bands (`backend/app/config.py`):
- `0.00 – 0.30` → **LOW RISK** (*Standard automated underwriting clearance recommended*)
- `0.30 – 0.60` → **MEDIUM RISK** (*Moderate default risk; requires secondary documentation & senior analyst review*)
- `0.60 – 1.00` → **HIGH RISK** (*High predicted default risk; requires further review and credit committee assessment*)

### Explainable AI (SHAP Attributions):
For each individual loan assessment, SHAP values quantify the exact contribution of each financial variable:
- **Positive Risk Contributors (Risk Escalators)**: Features pushing default risk higher (e.g. Low FICO, High DTI, High Loan-to-Income, Recent Inquiries).
- **Risk-Reducing Factors (Mitigating Strengths)**: Features pulling default risk lower (e.g. Disciplined utilization, Long employment tenure, Mortgage equity).

---

## 4. REST API Endpoints (FastAPI)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health, active models, and database status |
| `GET` | `/api/dashboard/stats` | Aggregated portfolio KPIs, default rate, and high risk alerts |
| `GET` | `/api/applications` | List, search, filter (by risk, purpose, prob), sort, and paginate |
| `GET` | `/api/applications/{id}` | Full borrower profile, risk assessment, SHAP breakdown, history |
| `POST` | `/api/predict` | Real-time multi-model ML inference + SHAP explanation |
| `POST` | `/api/applications` | Evaluate and save new loan application to MongoDB |
| `GET` | `/api/models/metrics` | Real test-set evaluation metrics for all 4 models |
| `GET` | `/api/models/comparison` | ROC coordinates, confusion matrices, and feature importances |

---

## 5. Prerequisites & Local Setup

### Prerequisites:
- **Python 3.10+** (Tested on Python 3.14)
- **Node.js 18+** (Tested on Node v25 / v20)
- **MongoDB** (Local instance on `mongodb://localhost:27017` or MongoDB Atlas URI)

---

### Step 1: Clone and Setup Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run ML Training Pipeline (Trains all 4 models and saves artifacts)
python ml/train.py

# Start FastAPI Backend Server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*FastAPI Swagger documentation is accessible at `http://127.0.0.1:8000/docs`.*

---

### Step 2: Setup and Start Frontend

```bash
cd frontend

# Install UI dependencies
npm install

# Start Next.js Development Server
npm run dev
```
*Next.js Web Application is accessible at `http://localhost:3000`.*

---

## 6. Demonstration Flow (Walkthrough)

1. **Dashboard (`/`)**:
   - Inspect portfolio stats: Total Applications, High/Medium/Low risk counts, Portfolio Default Rate, and Risk Distribution Donut Chart.
   - Observe recent High-Risk loans highlighted for credit analyst review.
2. **Loan Applications Registry (`/applications`)**:
   - Filter applicants by `Risk Level: High Risk (60-100%)`.
   - Test instant search by Applicant ID or Name.
   - Click **"View"** on any applicant (e.g. `APP-20839`).
3. **Applicant Details (`/applications/[id]`)**:
   - Review the animated semi-circular **Risk Gauge** displaying default probability.
   - Inspect the **Bank Underwriting Guidance** note.
   - Examine **Positive Risk Contributors** vs **Risk-Reducing Factors** derived from SHAP.
   - View **Multi-Model Consensus** across Logistic Regression, Decision Tree, Random Forest, and XGBoost.
4. **Model Performance Diagnostics (`/models`)**:
   - Compare all 4 models side-by-side with real Accuracy, Precision, Recall, F1, and ROC-AUC.
   - Toggle metrics (`ROC-AUC`, `F1-Score`, `Precision`, `Accuracy`) to highlight the top-performing model.
   - View comparative **ROC Curves** and the out-of-sample **Confusion Matrix** (4,000 holdout loans).
5. **New Risk Assessment Workbench (`/predict`)**:
   - Load one of the Underwriting Benchmarks (`Prime Borrower`, `Near-Prime`, or `Subprime High-DTI`).
   - Click **"ANALYZE LOAN RISK"**.
   - Review live prediction results, SHAP drivers, and model consensus.
   - Click **"Save Assessment to Registry"** to persist to MongoDB and redirect to the applicant record.

---

## 7. Compliance & Underwriting Notice

This application is built as an **internal banking decision-support tool**. It computes predictive probabilities and transparent explainability factors to empower qualified bank underwriters. It does not enforce automated loan rejections or approvals.
