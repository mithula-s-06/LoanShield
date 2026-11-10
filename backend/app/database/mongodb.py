import os
from pymongo import MongoClient, ASCENDING, DESCENDING
from motor.motor_asyncio import AsyncIOMotorClient
import logging
from ..config import settings

logger = logging.getLogger("loanguard.db")

class Database:
    client: AsyncIOMotorClient = None
    sync_client: MongoClient = None
    db = None
    is_connected: bool = False
    
    # In-memory fallback in case Mongo is unreachable
    _memory_store = {
        "applicants": [],
        "predictions": [],
        "model_metrics": []
    }

db = Database()

async def connect_to_mongo():
    """Initializes MongoDB connection and creates appropriate indexes"""
    try:
        db.client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=3000)
        # Verify connection
        await db.client.admin.command('ping')
        db.db = db.client[settings.DATABASE_NAME]
        db.is_connected = True
        logger.info(f"Connected to MongoDB at {settings.MONGODB_URI} -> {settings.DATABASE_NAME}")
        
        # Ensure Indexes
        await db.db.applicants.create_index([("applicant_id", ASCENDING)], unique=True)
        await db.db.applicants.create_index([("risk_level", ASCENDING)])
        await db.db.applicants.create_index([("default_probability", DESCENDING)])
        await db.db.applicants.create_index([("created_at", DESCENDING)])
        
        await db.db.predictions.create_index([("applicant_id", ASCENDING)])
        await db.db.predictions.create_index([("timestamp", DESCENDING)])
        
        await db.db.model_metrics.create_index([("model_key", ASCENDING)])
    except Exception as e:
        logger.warning(f"Could not connect to MongoDB: {e}. Utilizing persistent in-memory fallback engine.")
        db.is_connected = False

async def close_mongo_connection():
    """Closes MongoDB connection"""
    if db.client:
        db.client.close()
        logger.info("Closed MongoDB connection.")

def get_database():
    return db
