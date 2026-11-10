import os
import logging
from pymongo import ASCENDING, DESCENDING
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger("loanshield.app_service.db")

class ApplicationDatabase:
    def __init__(self):
        self.client: AsyncIOMotorClient = None
        self.db = None
        self.is_connected: bool = False
        self._memory_store = {
            "applicants": [],
            "predictions": []
        }

    async def connect(self, mongodb_uri: str, database_name: str):
        try:
            self.client = AsyncIOMotorClient(mongodb_uri, serverSelectionTimeoutMS=2500)
            await self.client.admin.command('ping')
            self.db = self.client[database_name]
            self.is_connected = True
            logger.info(f"Connected to MongoDB at {mongodb_uri} -> {database_name}")
            
            # Ensure proper underwriting query indexes
            await self.db.applicants.create_index([("applicant_id", ASCENDING)], unique=True)
            await self.db.applicants.create_index([("risk_level", ASCENDING)])
            await self.db.applicants.create_index([("default_probability", DESCENDING)])
            await self.db.applicants.create_index([("created_at", DESCENDING)])
            await self.db.predictions.create_index([("applicant_id", ASCENDING)])
        except Exception as e:
            logger.warning(f"MongoDB offline ({e}). Using persistent in-memory underwriting repository.")
            self.is_connected = False

    async def close(self):
        if self.client:
            self.client.close()
            logger.info("Closed MongoDB connection.")

db = ApplicationDatabase()
