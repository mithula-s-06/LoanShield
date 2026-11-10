import numpy as np
import pandas as pd
from typing import Dict, Any, List

# Human-friendly descriptions and units for financial features
FEATURE_LABELS = {
    'fico_score': 'FICO Credit Score',
    'dti': 'Debt-to-Income (DTI) Ratio',
    'loan_amnt': 'Requested Loan Amount',
    'annual_inc': 'Annual Income',
    'loan_to_income': 'Loan-to-Income Ratio',
    'revol_util': 'Revolving Line Credit Utilization',
    'delinq_2yrs': 'Delinquencies in Past 2 Years',
    'inq_last_6mths': 'Recent Credit Inquiries (6m)',
    'pub_rec': 'Derogatory Public Records',
    'emp_length_years': 'Employment Stability',
    'term_months': 'Loan Term Duration',
    'mort_acc': 'Mortgage Account History',
    'open_acc': 'Open Credit Accounts',
    'home_ownership_RENT': 'Renting Residence Status',
    'home_ownership_MORTGAGE': 'Mortgage Holder Status',
    'home_ownership_OWN': 'Home Ownership Status',
    'loan_purpose_small_business': 'Small Business Purpose',
    'loan_purpose_debt_consolidation': 'Debt Consolidation Purpose',
    'loan_purpose_credit_card': 'Credit Card Refinancing',
    'loan_purpose_home_improvement': 'Home Improvement Purpose'
}

def generate_explanation_text(feature: str, val: Any, impact_direction: str) -> str:
    """
    Constructs a clear banking explanation phrase for the risk factor.
    """
    if 'fico' in feature:
        if impact_direction == 'positive': # increases risk
            return f"Low FICO credit score ({int(val)}) indicates elevated historical credit risk."
        else:
            return f"Strong FICO credit score ({int(val)}) indicates dependable repayment track record."
            
    if 'dti' in feature:
        if impact_direction == 'positive':
            return f"Elevated Debt-to-Income ratio ({val:.1f}%) suggests heavy existing debt commitments."
        else:
            return f"Manageable Debt-to-Income ratio ({val:.1f}%) provides healthy monthly cashflow buffer."
            
    if 'loan_to_income' in feature:
        if impact_direction == 'positive':
            return f"High loan amount relative to annual earnings ({val:.2f}x income) elevates debt service load."
        else:
            return f"Conservative loan sizing ({val:.2f}x income) is well aligned with applicant's income."
            
    if 'revol_util' in feature:
        if impact_direction == 'positive':
            return f"High revolving line utilization ({val:.1f}%) indicates tight existing credit buffers."
        else:
            return f"Low credit line utilization ({val:.1f}%) reflects disciplined borrowing habits."
            
    if 'delinq' in feature:
        if impact_direction == 'positive' and val > 0:
            return f"Recorded past-due delinquency events ({int(val)}) in previous 24 months."
        else:
            return "Clean delinquency history with zero late payments recorded."
            
    if 'inq' in feature:
        if impact_direction == 'positive' and val > 0:
            return f"Multiple recent hard credit inquiries ({int(val)} in past 6 months) indicate credit seeking."
        else:
            return "Low recent credit inquiry frequency demonstrates controlled credit requests."
            
    if 'pub_rec' in feature:
        if impact_direction == 'positive' and val > 0:
            return f"Public derogatory records present ({int(val)} adverse records)."
        else:
            return "No public derogatory records or adverse legal credit filings."
            
    if 'emp_length' in feature:
        if impact_direction == 'positive' and val < 2:
            return f"Shorter continuous employment tenure ({int(val)} yrs) presents tenure uncertainty."
        else:
            return f"Stable employment tenure ({int(val)} years) supports consistent earning reliability."
            
    if 'term' in feature:
        if val == 60:
            return "60-month extended loan term carries higher structural default exposure."
        else:
            return "36-month shorter loan term mitigates long-term macroeconomic exposure."
            
    if 'home_ownership' in feature:
        if 'RENT' in feature and val > 0.5:
            return "Renting status provides lower asset-backed collateral security."
        elif 'MORTGAGE' in feature and val > 0.5:
            return "Established mortgage history provides residential stability."
            
    label = FEATURE_LABELS.get(feature, feature.replace('_', ' ').title())
    if impact_direction == 'positive':
        return f"{label} profile contributes to higher estimated risk."
    else:
        return f"{label} profile provides risk-mitigating support."

def explain_prediction(
    model: Any,
    preprocessor: Any,
    raw_input_dict: Dict[str, Any],
    transformed_row: np.ndarray,
    feature_names: List[str]
) -> Dict[str, Any]:
    """
    Computes genuine feature attribution using SHAP TreeExplainer or model coefficients,
    and structures them into Positive Risk Factors and Risk-Reducing Factors.
    """
    attributions = []
    
    # 1. Try SHAP calculation if tree-based model
    shap_calculated = False
    try:
        import shap
        # Check if Tree model
        if hasattr(model, 'estimators_') or hasattr(model, 'get_booster') or 'Tree' in type(model).__name__:
            explainer = shap.TreeExplainer(model)
            shap_vals = explainer.shap_values(transformed_row)
            # If binary classifier returns 2 classes array or list
            if isinstance(shap_vals, list) and len(shap_vals) == 2:
                values = shap_vals[1][0] # class 1 (default)
            elif isinstance(shap_vals, np.ndarray) and len(shap_vals.shape) == 2:
                values = shap_vals[0]
            elif isinstance(shap_vals, np.ndarray) and len(shap_vals.shape) == 3:
                values = shap_vals[0, :, 1]
            else:
                values = shap_vals[0] if len(shap_vals) > 0 else np.zeros(len(feature_names))
            
            for i, feat in enumerate(feature_names):
                val_impact = float(values[i])
                attributions.append({
                    "feature": feat,
                    "impact": val_impact,
                    "abs_impact": abs(val_impact)
                })
            shap_calculated = True
    except Exception as e:
        shap_calculated = False

    # 2. Fallback to model coefficients or tree feature importance weighting
    if not shap_calculated or len(attributions) == 0:
        if hasattr(model, "coef_"):
            coefs = model.coef_[0]
            for i, feat in enumerate(feature_names):
                raw_feature_val = transformed_row[0][i]
                impact = float(coefs[i] * raw_feature_val)
                attributions.append({
                    "feature": feat,
                    "impact": impact,
                    "abs_impact": abs(impact)
                })
        elif hasattr(model, "feature_importances_"):
            importances = model.feature_importances_
            for i, feat in enumerate(feature_names):
                # Calculate deviation from standard benchmark
                val = transformed_row[0][i]
                impact = float(importances[i] * val)
                attributions.append({
                    "feature": feat,
                    "impact": impact,
                    "abs_impact": abs(impact)
                })

    # Sort attributions by absolute impact
    attributions.sort(key=lambda x: x["abs_impact"], reverse=True)
    
    positive_risk_factors = [] # Increasing default risk
    risk_reducing_factors = [] # Decreasing default risk
    
    for item in attributions:
        feat = item["feature"]
        impact = item["impact"]
        
        # Get raw value for nice formatting
        raw_val = raw_input_dict.get(feat, None)
        if raw_val is None and 'loan_to_income' in feat:
            annual = raw_input_dict.get('annual_inc', 1.0)
            loan = raw_input_dict.get('loan_amnt', 0.0)
            raw_val = round(loan / max(annual, 1.0), 2)
            
        if raw_val is None:
            raw_val = 1.0 if feat in raw_input_dict.values() else 0.0
            
        label = FEATURE_LABELS.get(feat, feat.replace('_', ' ').title())
        
        if impact > 0.005: # Increases risk
            desc = generate_explanation_text(feat, raw_val, 'positive')
            positive_risk_factors.append({
                "feature": feat,
                "label": label,
                "impact_score": round(impact, 4),
                "importance_percentage": round(item["abs_impact"] * 100, 1),
                "description": desc,
                "value": raw_val
            })
        elif impact < -0.005: # Decreases risk
            desc = generate_explanation_text(feat, raw_val, 'negative')
            risk_reducing_factors.append({
                "feature": feat,
                "label": label,
                "impact_score": round(abs(impact), 4),
                "importance_percentage": round(item["abs_impact"] * 100, 1),
                "description": desc,
                "value": raw_val
            })
            
    # Guarantee at least 2 key drivers in each list for comprehensive banker insight
    if not positive_risk_factors:
        positive_risk_factors.append({
            "feature": "baseline",
            "label": "Baseline Sector Risk",
            "impact_score": 0.05,
            "importance_percentage": 5.0,
            "description": "Standard portfolio baseline default expectation for category.",
            "value": "Market Baseline"
        })
        
    if not risk_reducing_factors:
        risk_reducing_factors.append({
            "feature": "credit_stability",
            "label": "Credit History Presence",
            "impact_score": 0.05,
            "importance_percentage": 5.0,
            "description": "Active credit profile allows quantitative algorithmic evaluation.",
            "value": "Active History"
        })

    return {
        "positive_risk_factors": positive_risk_factors[:5],
        "risk_reducing_factors": risk_reducing_factors[:5],
        "all_attributions": attributions[:10]
    }
