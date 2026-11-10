import os
try:
    from pydantic_settings import BaseSettings
except ImportError:
    from pydantic import BaseModel as BaseSettings
from typing import List

class MicroserviceSettings(BaseSettings):
    PROJECT_NAME: str = "LoanShield Microservices Ecosystem"
    
    # Microservice Ports & Networking Endpoints
    GATEWAY_PORT: int = int(os.getenv("GATEWAY_PORT", "8000"))
    ML_SERVICE_PORT: int = int(os.getenv("ML_SERVICE_PORT", "8001"))
    APPLICATION_SERVICE_PORT: int = int(os.getenv("APPLICATION_SERVICE_PORT", "8002"))
    PRICING_SERVICE_PORT: int = int(os.getenv("PRICING_SERVICE_PORT", "8003"))
    
    # Internal Service URLs for inter-service communication
    ML_SERVICE_URL: str = os.getenv("ML_SERVICE_URL", "http://localhost:8001")
    APPLICATION_SERVICE_URL: str = os.getenv("APPLICATION_SERVICE_URL", "http://localhost:8002")
    PRICING_SERVICE_URL: str = os.getenv("PRICING_SERVICE_URL", "http://localhost:8003")
    
    # MongoDB Configuration
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "loanshield_db")
    
    # ML Models Directory (relative to project root)
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    MODEL_DIR: str = os.getenv("MODEL_DIR", os.path.join(BASE_DIR, "ml", "saved_models"))
    DATASET_PATH: str = os.getenv("DATASET_PATH", os.path.join(BASE_DIR, "ml", "data", "lending_club_granting.csv"))
    
    # Risk Classification Thresholds
    LOW_RISK_THRESHOLD: float = float(os.getenv("LOW_RISK_THRESHOLD", "0.30"))
    HIGH_RISK_THRESHOLD: float = float(os.getenv("HIGH_RISK_THRESHOLD", "0.60"))
    
    # Primary Model for Underwriting
    PRIMARY_MODEL: str = os.getenv("PRIMARY_MODEL", "logistic_regression")
    
    # CORS Origins
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]
    
    class Config:
        env_file = ".env"
        extra = "ignore"

def get_service_settings() -> MicroserviceSettings:
    return MicroserviceSettings()
