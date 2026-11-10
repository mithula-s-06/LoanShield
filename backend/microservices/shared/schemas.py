from pydantic import BaseModel, Field, field_validator
from typing import List, Dict, Optional, Any
from datetime import datetime

class RiskFactor(BaseModel):
    feature: str
    label: str
    impact_score: float
    importance_percentage: float
    description: str
    value: Any

class LoanApplicationInput(BaseModel):
    applicant_name: Optional[str] = Field(default="Applicant", description="Borrower Name")
    annual_inc: float = Field(..., gt=0, description="Annual Income ($)")
    loan_amnt: float = Field(..., gt=0, description="Requested Loan Amount ($)")
    fico_score: int = Field(..., ge=300, le=850, description="FICO Credit Score (300-850)")
    dti: float = Field(..., ge=0, le=100, description="Debt to Income Ratio (%)")
    emp_length_years: int = Field(default=5, ge=0, le=50, description="Years in Current Employment")
    home_ownership: str = Field(default="RENT", description="Home Ownership (RENT, MORTGAGE, OWN, OTHER)")
    loan_purpose: str = Field(default="debt_consolidation", description="Loan Purpose")
    term_months: int = Field(default=36, description="Loan Term (36 or 60 months)")
    revol_util: float = Field(default=35.0, ge=0, le=150, description="Revolving Credit Utilization (%)")
    delinq_2yrs: int = Field(default=0, ge=0, description="Delinquencies in Past 2 Years")
    inq_last_6mths: int = Field(default=0, ge=0, description="Inquiries in Past 6 Months")
    open_acc: int = Field(default=8, ge=1, description="Open Credit Accounts")
    pub_rec: int = Field(default=0, ge=0, description="Derogatory Public Records")
    mort_acc: int = Field(default=0, ge=0, description="Mortgage Accounts")
    loan_title: Optional[str] = Field(default="", description="Loan Description / Title")

    @field_validator('home_ownership')
    def validate_home_ownership(cls, v):
        allowed = ['RENT', 'MORTGAGE', 'OWN', 'OTHER', 'NONE', 'ANY']
        if v.upper() not in allowed:
            return 'RENT'
        return v.upper()

    @field_validator('term_months')
    def validate_term(cls, v):
        if v not in [36, 60]:
            return 36
        return v

class ModelPredictionDetail(BaseModel):
    probability: float
    predicted_class: int
    risk_level: str

class PredictionResponse(BaseModel):
    applicant_id: str
    final_probability: float
    risk_level: str # 'LOW', 'MEDIUM', 'HIGH'
    thresholds: Dict[str, float]
    selected_model: str
    recommendation: str
    model_predictions: Dict[str, ModelPredictionDetail]
    positive_risk_factors: List[RiskFactor]
    risk_reducing_factors: List[RiskFactor]
    input_data: Dict[str, Any]
    timestamp: str

class ApplicantSummary(BaseModel):
    applicant_id: str
    applicant_name: str
    loan_amnt: float
    annual_inc: float
    fico_score: int
    loan_purpose: str
    dti: float
    default_probability: float
    risk_level: str
    created_at: str

class ApplicationDetail(BaseModel):
    applicant_id: str
    applicant_name: str
    input_data: Dict[str, Any]
    default_probability: float
    risk_level: str
    recommendation: str
    model_predictions: Dict[str, ModelPredictionDetail]
    positive_risk_factors: List[RiskFactor]
    risk_reducing_factors: List[RiskFactor]
    prediction_history: List[Dict[str, Any]]
    created_at: str
    updated_at: str

class ApplicationsListResponse(BaseModel):
    items: List[ApplicantSummary]
    total: int
    page: int
    limit: int
    pages: int

class RiskDistribution(BaseModel):
    low: int
    medium: int
    high: int
    total: int

class DashboardStats(BaseModel):
    total_applications: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    overall_default_rate: float
    average_loan_amount: float
    average_fico: float
    risk_distribution: RiskDistribution
    recent_high_risk: List[ApplicantSummary]
    recent_applications: List[ApplicantSummary]
    model_summary: Dict[str, Any]

class ModelMetricsResponse(BaseModel):
    dataset_info: Dict[str, Any]
    best_model: str
    models: Dict[str, Any]

class LoanInterestCalculationInput(BaseModel):
    loan_purpose: str = Field(default="debt_consolidation", description="Purchase Category Key")
    loan_amount: float = Field(..., gt=0, description="Requested Borrowing Amount ($)")
    term_months: int = Field(default=36, description="Loan Repayment Term (months)")
    fico_score: int = Field(default=700, ge=300, le=850, description="Borrower FICO Credit Score")
    dti: float = Field(default=20.0, ge=0, le=100, description="Debt to Income Ratio (%)")
    down_payment: float = Field(default=0.0, ge=0, description="Down Payment or Equity Pledge ($)")
    default_probability: Optional[float] = Field(default=None, description="Optional ML Model Default Probability (0.0 to 1.0)")

class LoanPricingCalculationResponse(BaseModel):
    category: Dict[str, Any]
    loan_amount: float
    down_payment: float
    net_principal: float
    term_months: int
    term_years: float
    calculated_apr: float
    base_apr: float
    apr_adjustments: Dict[str, Any]
    monthly_payment: float
    total_payment: float
    total_interest: float
    interest_ratio_pct: float
    amortization_schedule: List[Dict[str, Any]]
    yearly_schedule: List[Dict[str, Any]]
    guidelines: List[str]
    key_benefits: List[str]
