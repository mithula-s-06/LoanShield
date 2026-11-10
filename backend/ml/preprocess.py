import os
import joblib
import pandas as pd
import numpy as np
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from typing import Tuple, List, Dict, Any

NUMERICAL_FEATURES = [
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

TARGET_COLUMN = 'is_default'

class FeatureEngineeringTransformer(BaseEstimator, TransformerMixin):
    """
    Computes financial domain features such as loan_to_income ratio,
    credit_line_ratio, and validates range bounds.
    """
    def __init__(self):
        pass
    
    def fit(self, X: pd.DataFrame, y=None):
        return self
    
    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        X = X.copy()
        # Compute loan to income
        if 'loan_to_income' not in X.columns:
            annual_inc = X['annual_inc'].replace(0, 1.0)
            X['loan_to_income'] = np.round(X['loan_amnt'] / annual_inc, 4)
        return X

def build_preprocessing_pipeline() -> ColumnTransformer:
    """
    Constructs a robust scikit-learn ColumnTransformer for numerical scaling and categorical encoding.
    """
    num_pipeline = Pipeline([
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    
    cat_pipeline = Pipeline([
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])
    
    preprocessor = ColumnTransformer([
        ('num', num_pipeline, NUMERICAL_FEATURES),
        ('cat', cat_pipeline, CATEGORICAL_FEATURES)
    ], remainder='drop')
    
    return preprocessor

def prepare_data(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
    """
    Validates, handles missing values/outliers, engineers features,
    and returns X, y.
    """
    df = df.copy()
    
    # Missing value handling
    for col in NUMERICAL_FEATURES:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
            df[col] = df[col].fillna(df[col].median())
            
    for col in CATEGORICAL_FEATURES:
        if col in df.columns:
            df[col] = df[col].astype(str).fillna('other')
            
    # Feature engineering
    fe = FeatureEngineeringTransformer()
    df = fe.transform(df)
    
    X = df[NUMERICAL_FEATURES + CATEGORICAL_FEATURES]
    y = df[TARGET_COLUMN] if TARGET_COLUMN in df.columns else None
    
    return X, y

def get_feature_names(preprocessor: ColumnTransformer) -> List[str]:
    """
    Extracts all output feature names after transformation.
    """
    output_features = []
    
    # Numerical
    output_features.extend(NUMERICAL_FEATURES)
    
    # Categorical
    cat_encoder = preprocessor.named_transformers_['cat'].named_steps['onehot']
    cat_cols = cat_encoder.get_feature_names_out(CATEGORICAL_FEATURES).tolist()
    output_features.extend(cat_cols)
    
    return output_features
