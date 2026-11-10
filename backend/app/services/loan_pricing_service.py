import math
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

LOAN_PURCHASE_CATEGORIES: Dict[str, Dict[str, Any]] = {
    "debt_consolidation": {
        "id": "debt_consolidation",
        "title": "Debt Consolidation",
        "category_badge": "High Demand",
        "base_apr": 8.99,
        "min_apr": 6.49,
        "max_apr": 19.99,
        "default_amount": 25000.0,
        "min_amount": 2000.0,
        "max_amount": 60000.0,
        "default_term_months": 36,
        "available_terms": [12, 24, 36, 48, 60],
        "description": "Combine multiple high-interest debts into one predictable monthly installment with structured payoff.",
        "risk_profile": "Moderate Risk",
        "recommended_fico": 680,
        "key_benefits": [
            "Fixed monthly payment simplifies budgeting",
            "Potential interest savings versus revolving credit cards",
            "Structured 3-5 year payoff timeline"
        ],
        "underwriting_guidelines": [
            "Requires direct payoff verification for revolving accounts",
            "Maximum post-consolidation DTI benchmark of 45%",
            "Minimum 24 months of established credit payment history"
        ]
    },
    "credit_card": {
        "id": "credit_card",
        "title": "Credit Card Refinancing",
        "category_badge": "Cashflow Relief",
        "base_apr": 9.49,
        "min_apr": 6.99,
        "max_apr": 21.99,
        "default_amount": 15000.0,
        "min_amount": 1500.0,
        "max_amount": 45000.0,
        "default_term_months": 36,
        "available_terms": [12, 24, 36, 48],
        "description": "Refinance expensive variable-rate credit card balances with a fixed lower APR term loan.",
        "risk_profile": "Moderate Risk",
        "recommended_fico": 670,
        "key_benefits": [
            "Significantly lower APR compared to average credit card 24%+ rates",
            "Protects against central bank benchmark interest rate hikes",
            "Boosts credit score by reducing revolving credit line utilization"
        ],
        "underwriting_guidelines": [
            "Revolving utilization ratio analysis prior to disbursement",
            "Verification of steady employment income",
            "Direct creditor disbursement available to optimize underwriting"
        ]
    },
    "home_improvement": {
        "id": "home_improvement",
        "title": "Home Improvement & Renovation",
        "category_badge": "Equity Enhancer",
        "base_apr": 6.75,
        "min_apr": 5.25,
        "max_apr": 14.49,
        "default_amount": 35000.0,
        "min_amount": 5000.0,
        "max_amount": 120000.0,
        "default_term_months": 60,
        "available_terms": [24, 36, 48, 60, 84, 120],
        "description": "Fund kitchen remodels, solar installation, roofing, extensions, or structural renovations.",
        "risk_profile": "Low to Moderate Risk",
        "recommended_fico": 700,
        "key_benefits": [
            "Substantially increases residential property valuation",
            "Longer repayment terms available up to 120 months",
            "Lower APR due to homeowner collateral stability"
        ],
        "underwriting_guidelines": [
            "Verification of home ownership (Mortgage or Deed)",
            "Contractor estimate or architectural scope verification for amounts > $50k",
            "DTI ceiling up to 50% for high-equity homeowners"
        ]
    },
    "small_business": {
        "id": "small_business",
        "title": "Small Business & Commercial Capital",
        "category_badge": "Commercial Growth",
        "base_apr": 11.25,
        "min_apr": 8.49,
        "max_apr": 24.99,
        "default_amount": 50000.0,
        "min_amount": 5000.0,
        "max_amount": 200000.0,
        "default_term_months": 36,
        "available_terms": [12, 24, 36, 48, 60],
        "description": "Fuel working capital, purchase commercial equipment, fund seasonal inventory, or expand operations.",
        "risk_profile": "Elevated Yield & Risk",
        "recommended_fico": 690,
        "key_benefits": [
            "Preserves business equity without venture dilution",
            "Interest payments may qualify for commercial tax deductions",
            "Flexible working capital deployment"
        ],
        "underwriting_guidelines": [
            "Minimum 1-2 years continuous business operational track record",
            "Bank statements review for last 6 months cashflow validation",
            "Personal guarantee from majority equity partners"
        ]
    },
    "car": {
        "id": "car",
        "title": "Vehicle & Automobile Purchase",
        "category_badge": "Secured Asset",
        "base_apr": 5.99,
        "min_apr": 4.49,
        "max_apr": 13.99,
        "default_amount": 28000.0,
        "min_amount": 3000.0,
        "max_amount": 85000.0,
        "default_term_months": 60,
        "available_terms": [24, 36, 48, 60, 72, 84],
        "description": "Finance new or pre-owned passenger vehicles, EV purchases, commercial vans, or transport fleet.",
        "risk_profile": "Low Risk (Asset-Backed)",
        "recommended_fico": 660,
        "key_benefits": [
            "Competitive low interest rates due to vehicle lien backing",
            "Extended amortization terms up to 84 months",
            "Dealer direct or private party financing flexibility"
        ],
        "underwriting_guidelines": [
            "Vehicle title lien recording required",
            "Maximum Loan-to-Value (LTV) benchmark of 115% based on Kelley Blue Book",
            "Comprehensive collision insurance coverage prerequisite"
        ]
    },
    "major_purchase": {
        "id": "major_purchase",
        "title": "Major Purchase & Consumer Durables",
        "category_badge": "Fixed Term",
        "base_apr": 8.25,
        "min_apr": 6.49,
        "max_apr": 17.99,
        "default_amount": 12000.0,
        "min_amount": 1000.0,
        "max_amount": 35000.0,
        "default_term_months": 36,
        "available_terms": [12, 24, 36, 48, 60],
        "description": "Cover significant planned expenditures including household appliances, electronics, and furnishings.",
        "risk_profile": "Moderate Risk",
        "recommended_fico": 670,
        "key_benefits": [
            "Predictable fixed payment schedule without compounding merchant penalties",
            "Same-day or next-day underwriting clearance",
            "Transparent total borrowing cost transparency"
        ],
        "underwriting_guidelines": [
            "Proof of purchase invoice or planned quote",
            "Standard DTI benchmark <= 40%",
            "Stable continuous employment history >= 1 year"
        ]
    },
    "medical": {
        "id": "medical",
        "title": "Medical & Healthcare Expenses",
        "category_badge": "Healthcare Relief",
        "base_apr": 7.25,
        "min_apr": 5.49,
        "max_apr": 15.49,
        "default_amount": 18000.0,
        "min_amount": 1000.0,
        "max_amount": 50000.0,
        "default_term_months": 36,
        "available_terms": [12, 24, 36, 48, 60],
        "description": "Finance unexpected healthcare emergencies, elective procedures, dental treatments, or veterinary care.",
        "risk_profile": "Moderate Risk",
        "recommended_fico": 660,
        "key_benefits": [
            "Expedited emergency underwriting clearance",
            "Compassionate hardship rescheduling options available",
            "No prepayment penalties"
        ],
        "underwriting_guidelines": [
            "Medical provider billing estimate or treatment schedule",
            "Expedited underwriting review queue within 2 hours",
            "Flexible debt-to-income tolerance for healthcare emergencies"
        ]
    },
    "house": {
        "id": "house",
        "title": "Real Estate & Property Downpayment",
        "category_badge": "Property Milestone",
        "base_apr": 6.25,
        "min_apr": 4.99,
        "max_apr": 12.99,
        "default_amount": 60000.0,
        "min_amount": 10000.0,
        "max_amount": 250000.0,
        "default_term_months": 60,
        "available_terms": [36, 60, 84, 120, 180, 240, 360],
        "description": "Bridge financing for residential property acquisition, closing costs, or down payment funding.",
        "risk_profile": "Low to Moderate Risk",
        "recommended_fico": 720,
        "key_benefits": [
            "Substantial borrowing limits for major property transactions",
            "Long-tenor amortization options",
            "High collateral security backing"
        ],
        "underwriting_guidelines": [
            "Property appraisal and title verification",
            "Strict DTI requirement of <= 43%",
            "Proof of liquid reserve assets (2-6 months PITI)"
        ]
    },
    "other": {
        "id": "other",
        "title": "Personal & Milestone Expenses",
        "category_badge": "Flexible Personal",
        "base_apr": 9.99,
        "min_apr": 7.49,
        "max_apr": 22.99,
        "default_amount": 10000.0,
        "min_amount": 1000.0,
        "max_amount": 35000.0,
        "default_term_months": 36,
        "available_terms": [12, 24, 36, 48, 60],
        "description": "Versatile personal loan for relocation, life events, tuition, weddings, or emergency personal funding.",
        "risk_profile": "Moderate Risk",
        "recommended_fico": 670,
        "key_benefits": [
            "Unrestricted personal fund utilization",
            "No collateral pledge requirement",
            "Fixed terms and predictable monthly budgeting"
        ],
        "underwriting_guidelines": [
            "Standard verifiable income and debt obligations check",
            "Zero recent bankruptcy or delinquency filings in past 24m",
            "DTI benchmark <= 40%"
        ]
    }
}

class LoanPricingCalculation:
    @staticmethod
    def get_all_categories() -> List[Dict[str, Any]]:
        return list(LOAN_PURCHASE_CATEGORIES.values())

    @staticmethod
    def calculate(
        loan_purpose: str,
        loan_amount: float,
        term_months: int,
        fico_score: int = 700,
        dti: float = 20.0,
        down_payment: float = 0.0,
        default_probability: Optional[float] = None
    ) -> Dict[str, Any]:
        purpose_key = loan_purpose.lower() if loan_purpose else "debt_consolidation"
        category = LOAN_PURCHASE_CATEGORIES.get(purpose_key, LOAN_PURCHASE_CATEGORIES["other"])
        
        base_apr = category["base_apr"]
        
        # 1. FICO score adjustment
        if fico_score >= 780:
            fico_adj = -1.75
            fico_tier = "Exceptional (780-850)"
        elif fico_score >= 740:
            fico_adj = -1.00
            fico_tier = "Very Good (740-779)"
        elif fico_score >= 680:
            fico_adj = 0.00
            fico_tier = "Good (680-739)"
        elif fico_score >= 620:
            fico_adj = 2.25
            fico_tier = "Fair (620-679)"
        else:
            fico_adj = 5.50
            fico_tier = "Subprime (<620)"
            
        # 2. DTI adjustment
        if dti <= 15.0:
            dti_adj = -0.35
            dti_tier = "Low DTI (<=15%)"
        elif dti <= 30.0:
            dti_adj = 0.00
            dti_tier = "Moderate DTI (16-30%)"
        elif dti <= 42.0:
            dti_adj = 1.00
            dti_tier = "Elevated DTI (31-42%)"
        else:
            dti_adj = 2.75
            dti_tier = "High DTI (>42%)"
            
        # 3. Term adjustment
        if term_months <= 24:
            term_adj = -0.50
        elif term_months <= 36:
            term_adj = 0.00
        elif term_months <= 60:
            term_adj = 0.75
        elif term_months <= 84:
            term_adj = 1.35
        else:
            term_adj = 2.00
            
        # 4. XGBoost Default Risk adjustment
        risk_adj = 0.0
        if default_probability is not None:
            # Scale default probability into risk premium
            risk_adj = round(default_probability * 7.5, 2)
            
        # Net APR calculation bounded within category limits
        calculated_apr = base_apr + fico_adj + dti_adj + term_adj + risk_adj
        min_limit = category["min_apr"]
        max_limit = category["max_apr"]
        final_apr = max(min_limit, min(max_limit, round(calculated_apr, 2)))
        
        # Effective Principal
        principal = max(500.0, loan_amount - max(0.0, down_payment))
        months = max(6, int(term_months))
        
        # Monthly Interest Rate
        monthly_rate = (final_apr / 100.0) / 12.0
        
        if monthly_rate > 0:
            monthly_payment = principal * (monthly_rate * math.pow(1 + monthly_rate, months)) / (math.pow(1 + monthly_rate, months) - 1)
        else:
            monthly_payment = principal / months
            
        monthly_payment = round(monthly_payment, 2)
        total_payment = round(monthly_payment * months, 2)
        total_interest = round(total_payment - principal, 2)
        interest_ratio_pct = round((total_interest / principal) * 100.0, 1)
        
        # Build Amortization Schedule (Summary by Year and first 24 months)
        schedule: List[Dict[str, Any]] = []
        balance = principal
        cumulative_interest = 0.0
        cumulative_principal = 0.0
        
        yearly_summary: Dict[int, Dict[str, Any]] = {}
        
        for m in range(1, months + 1):
            interest_for_month = round(balance * monthly_rate, 2)
            principal_for_month = round(monthly_payment - interest_for_month, 2)
            
            if m == months:
                principal_for_month = balance
                monthly_payment_actual = principal_for_month + interest_for_month
            else:
                monthly_payment_actual = monthly_payment
                
            balance = max(0.0, round(balance - principal_for_month, 2))
            cumulative_interest = round(cumulative_interest + interest_for_month, 2)
            cumulative_principal = round(cumulative_principal + principal_for_month, 2)
            
            year_num = (m - 1) // 12 + 1
            if year_num not in yearly_summary:
                yearly_summary[year_num] = {
                    "year": year_num,
                    "principal_paid": 0.0,
                    "interest_paid": 0.0,
                    "total_paid": 0.0,
                    "ending_balance": balance
                }
            yearly_summary[year_num]["principal_paid"] = round(yearly_summary[year_num]["principal_paid"] + principal_for_month, 2)
            yearly_summary[year_num]["interest_paid"] = round(yearly_summary[year_num]["interest_paid"] + interest_for_month, 2)
            yearly_summary[year_num]["total_paid"] = round(yearly_summary[year_num]["total_paid"] + monthly_payment_actual, 2)
            yearly_summary[year_num]["ending_balance"] = balance
            
            # Keep monthly records for first 24 months or last
            if m <= 24 or m == months:
                schedule.append({
                    "month": m,
                    "payment": monthly_payment_actual,
                    "principal": principal_for_month,
                    "interest": interest_for_month,
                    "remaining_balance": balance,
                    "cumulative_interest": cumulative_interest
                })
                
        return {
            "category": category,
            "loan_amount": loan_amount,
            "down_payment": down_payment,
            "net_principal": principal,
            "term_months": months,
            "term_years": round(months / 12.0, 1),
            "calculated_apr": final_apr,
            "base_apr": base_apr,
            "apr_adjustments": {
                "base_rate": base_apr,
                "fico_adjustment": fico_adj,
                "fico_tier": fico_tier,
                "dti_adjustment": dti_adj,
                "dti_tier": dti_tier,
                "term_adjustment": term_adj,
                "risk_premium": risk_adj
            },
            "monthly_payment": monthly_payment,
            "total_payment": total_payment,
            "total_interest": total_interest,
            "interest_ratio_pct": interest_ratio_pct,
            "amortization_schedule": schedule,
            "yearly_schedule": list(yearly_summary.values()),
            "guidelines": category["underwriting_guidelines"],
            "key_benefits": category["key_benefits"]
        }
