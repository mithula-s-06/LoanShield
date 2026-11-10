export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface RiskFactor {
  feature: string;
  label: string;
  impact_score: number;
  importance_percentage: number;
  description: string;
  value: any;
}

export interface ModelPredictionDetail {
  probability: number;
  predicted_class: number;
  risk_level: RiskLevel;
}

export interface LoanApplicationInput {
  applicant_name?: string;
  annual_inc: number;
  loan_amnt: number;
  fico_score: number;
  dti: number;
  emp_length_years: number;
  home_ownership: 'RENT' | 'MORTGAGE' | 'OWN' | 'OTHER';
  loan_purpose: string;
  term_months: number;
  revol_util: number;
  delinq_2yrs: number;
  inq_last_6mths: number;
  open_acc: number;
  pub_rec: number;
  mort_acc: number;
  loan_title?: string;
}

export interface PredictionResponse {
  applicant_id: string;
  final_probability: number;
  risk_level: RiskLevel;
  thresholds: {
    low: number;
    high: number;
  };
  selected_model: string;
  recommendation: string;
  model_predictions: Record<string, ModelPredictionDetail>;
  positive_risk_factors: RiskFactor[];
  risk_reducing_factors: RiskFactor[];
  input_data: LoanApplicationInput;
  timestamp: string;
}

export interface ApplicantSummary {
  applicant_id: string;
  applicant_name: string;
  loan_amnt: number;
  annual_inc: number;
  fico_score: number;
  loan_purpose: string;
  dti: number;
  default_probability: number;
  risk_level: RiskLevel;
  created_at: string;
}

export interface ApplicationDetail {
  applicant_id: string;
  applicant_name: string;
  input_data: LoanApplicationInput;
  default_probability: number;
  risk_level: RiskLevel;
  recommendation: string;
  model_predictions: Record<string, ModelPredictionDetail>;
  positive_risk_factors: RiskFactor[];
  risk_reducing_factors: RiskFactor[];
  prediction_history: Array<{
    final_probability: number;
    risk_level: RiskLevel;
    timestamp: string;
    model_predictions?: Record<string, ModelPredictionDetail>;
  }>;
  created_at: string;
  updated_at: string;
}

export interface ApplicationsListResponse {
  items: ApplicantSummary[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface RiskDistribution {
  low: number;
  medium: number;
  high: number;
  total: number;
}

export interface DashboardStats {
  total_applications: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  overall_default_rate: number;
  average_loan_amount: number;
  average_fico: number;
  risk_distribution: RiskDistribution;
  recent_high_risk: ApplicantSummary[];
  recent_applications: ApplicantSummary[];
  model_summary: Record<string, any>;
}

export interface SingleModelMetrics {
  model_key: string;
  model_name: string;
  description: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  confusion_matrix: {
    matrix: number[][];
    true_negatives: number;
    false_positives: number;
    false_negatives: number;
    true_positives: number;
  };
  roc_curve: Array<{ fpr: number; tpr: number }>;
  feature_importance: Array<{
    feature: string;
    importance: number;
    raw_coef?: number;
  }>;
  classification_report: Record<string, any>;
  trained_at: string;
}

export interface ModelMetricsResponse {
  dataset_name: string;
  total_records: number;
  train_records: number;
  test_records: number;
  default_rate: number;
  training_timestamp: string;
  best_model: string;
  feature_names: string[];
  numerical_features: string[];
  categorical_features: string[];
  models: Record<string, SingleModelMetrics>;
}

export interface LoanPurchaseCategory {
  id: string;
  title: string;
  category_badge: string;
  base_apr: number;
  min_apr: number;
  max_apr: number;
  default_amount: number;
  min_amount: number;
  max_amount: number;
  default_term_months: number;
  available_terms: number[];
  description: string;
  risk_profile: string;
  recommended_fico: number;
  key_benefits: string[];
  underwriting_guidelines: string[];
}

export interface LoanInterestCalculationInput {
  loan_purpose: string;
  loan_amount: number;
  term_months: number;
  fico_score?: number;
  dti?: number;
  down_payment?: number;
  default_probability?: number;
}

export interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  remaining_balance: number;
  cumulative_interest: number;
}

export interface YearlyAmortization {
  year: number;
  principal_paid: number;
  interest_paid: number;
  total_paid: number;
  ending_balance: number;
}

export interface LoanPricingCalculationResponse {
  category: LoanPurchaseCategory;
  loan_amount: number;
  down_payment: number;
  net_principal: number;
  term_months: number;
  term_years: number;
  calculated_apr: number;
  base_apr: number;
  apr_adjustments: {
    base_rate: number;
    fico_adjustment: number;
    fico_tier: string;
    dti_adjustment: number;
    dti_tier: string;
    term_adjustment: number;
    risk_premium: number;
  };
  monthly_payment: number;
  total_payment: number;
  total_interest: number;
  interest_ratio_pct: number;
  amortization_schedule: AmortizationRow[];
  yearly_schedule: YearlyAmortization[];
  guidelines: string[];
  key_benefits: string[];
}

