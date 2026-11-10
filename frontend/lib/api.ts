import {
  ApplicationsListResponse,
  ApplicationDetail,
  DashboardStats,
  LoanApplicationInput,
  PredictionResponse,
  ModelMetricsResponse,
  SingleModelMetrics
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      });

      if (!response.ok) {
        let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.detail) {
            errorMsg = typeof errorData.detail === 'string' 
              ? errorData.detail 
              : JSON.stringify(errorData.detail);
          }
        } catch {
          // Ignore JSON parse error
        }
        throw new Error(errorMsg);
      }

      return await response.json();
    } catch (err: any) {
      console.error(`API Request failed on ${endpoint}:`, err);
      throw err;
    }
  }

  async getHealth() {
    return this.request<{
      status: string;
      service: string;
      ml_engine_loaded: boolean;
      active_models: string[];
      database_connected: boolean;
    }>('/health');
  }

  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/dashboard/stats');
  }

  async getApplications(params: {
    search?: string;
    risk_level?: string;
    loan_purpose?: string;
    min_prob?: number;
    max_prob?: number;
    sort_by?: string;
    sort_order?: string;
    page?: number;
    limit?: number;
  }): Promise<ApplicationsListResponse> {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.risk_level && params.risk_level !== 'ALL') query.set('risk_level', params.risk_level);
    if (params.loan_purpose && params.loan_purpose !== 'ALL') query.set('loan_purpose', params.loan_purpose);
    if (params.min_prob !== undefined && params.min_prob !== null) query.set('min_prob', params.min_prob.toString());
    if (params.max_prob !== undefined && params.max_prob !== null) query.set('max_prob', params.max_prob.toString());
    if (params.sort_by) query.set('sort_by', params.sort_by);
    if (params.sort_order) query.set('sort_order', params.sort_order);
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());

    const queryString = query.toString();
    return this.request<ApplicationsListResponse>(`/applications${queryString ? `?${queryString}` : ''}`);
  }

  async getApplicationById(id: string): Promise<ApplicationDetail> {
    return this.request<ApplicationDetail>(`/applications/${encodeURIComponent(id)}`);
  }

  async predictRisk(data: LoanApplicationInput): Promise<PredictionResponse> {
    return this.request<PredictionResponse>('/predict', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async submitApplication(data: LoanApplicationInput): Promise<ApplicationDetail> {
    return this.request<ApplicationDetail>('/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getModelMetrics(): Promise<ModelMetricsResponse> {
    return this.request<ModelMetricsResponse>('/models/metrics');
  }

  async getModelComparison(): Promise<{
    best_model: string;
    comparison_table: Array<{
      model_key: string;
      model_name: string;
      accuracy: number;
      precision: number;
      recall: number;
      f1_score: number;
      roc_auc: number;
    }>;
    models: Record<string, SingleModelMetrics>;
    feature_names: string[];
  }> {
    return this.request<any>('/models/comparison');
  }

  async getLoanPurchaseCategories(): Promise<{ categories: import('./types').LoanPurchaseCategory[] }> {
    return this.request<{ categories: import('./types').LoanPurchaseCategory[] }>('/loan-products/categories');
  }

  async calculateLoanInterest(params: import('./types').LoanInterestCalculationInput): Promise<import('./types').LoanPricingCalculationResponse> {
    return this.request<import('./types').LoanPricingCalculationResponse>('/loan-products/calculate-interest', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }
}

export const api = new ApiClient();

