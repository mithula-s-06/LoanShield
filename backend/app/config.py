import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "LoanShield – Intelligent Loan Default Risk Assessment"
    API_V1_STR: str = "/api"
    
    # MongoDB Configuration
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "loanshield_db")
    
    # ML Models Directory
    MODEL_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "ml", "saved_models")
    DATASET_PATH: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "ml", "data", "lending_club_granting.csv")
    
    # Risk Classification Thresholds (Project defined, configurable)
    LOW_RISK_THRESHOLD: float = float(os.getenv("LOW_RISK_THRESHOLD", "0.30"))
    HIGH_RISK_THRESHOLD: float = float(os.getenv("HIGH_RISK_THRESHOLD", "0.60"))
    
    # Primary Model for Default Decision Support
    PRIMARY_MODEL: str = os.getenv("PRIMARY_MODEL", "logistic_regression")
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
