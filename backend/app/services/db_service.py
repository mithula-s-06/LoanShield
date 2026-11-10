import os
import math
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import logging
from ..database.mongodb import db
from ..schemas.loan import (
    ApplicantSummary,
    ApplicationDetail,
    ApplicationsListResponse,
    DashboardStats,
    RiskDistribution,
    LoanApplicationInput,
    PredictionResponse
)

logger = logging.getLogger("loanguard.db_service")

class DBService:
    async def seed_initial_applications(self, ml_service):
        """Pre-populates sample bank applications if database is empty for rich demo flow"""
        try:
            count = 0
            if db.is_connected and db.db is not None:
                count = await db.db.applicants.count_documents({})
            else:
                count = len(db._memory_store["applicants"])
                
            if count > 0:
                return
                
            logger.info("Database is empty. Generating seed loan applications with real ML predictions...")
            
            sample_profiles = [
                {
                    "applicant_id": "APP-10482",
                    "applicant_name": "Eleanor Vance",
                    "annual_inc": 115000.0,
                    "loan_amnt": 18000.0,
                    "fico_score": 765,
                    "dti": 12.4,
                    "emp_length_years": 8,
                    "home_ownership": "MORTGAGE",
                    "loan_purpose": "home_improvement",
                    "term_months": 36,
                    "revol_util": 18.2,
                    "delinq_2yrs": 0,
                    "inq_last_6mths": 0,
                    "open_acc": 12,
                    "pub_rec": 0,
                    "mort_acc": 2,
                    "loan_title": "Kitchen & solar upgrades"
                },
                {
                    "applicant_id": "APP-20839",
                    "applicant_name": "Marcus Sterling",
                    "annual_inc": 42000.0,
                    "loan_amnt": 28000.0,
                    "fico_score": 615,
                    "dti": 39.5,
                    "emp_length_years": 1,
                    "home_ownership": "RENT",
                    "loan_purpose": "small_business",
                    "term_months": 60,
                    "revol_util": 86.4,
                    "delinq_2yrs": 2,
                    "inq_last_6mths": 3,
                    "open_acc": 14,
                    "pub_rec": 1,
                    "mort_acc": 0,
                    "loan_title": "Inventory expansion loan"
                },
                {
                    "applicant_id": "APP-30911",
                    "applicant_name": "Sophia Rodriguez",
                    "annual_inc": 78000.0,
                    "loan_amnt": 20000.0,
                    "fico_score": 690,
                    "dti": 24.8,
                    "emp_length_years": 4,
                    "home_ownership": "RENT",
                    "loan_purpose": "debt_consolidation",
                    "term_months": 36,
                    "revol_util": 54.0,
                    "delinq_2yrs": 0,
                    "inq_last_6mths": 1,
                    "open_acc": 9,
                    "pub_rec": 0,
                    "mort_acc": 0,
                    "loan_title": "Consolidate 3 credit cards"
                },
                {
                    "applicant_id": "APP-41052",
                    "applicant_name": "David Chen",
                    "annual_inc": 145000.0,
                    "loan_amnt": 35000.0,
                    "fico_score": 810,
                    "dti": 15.2,
                    "emp_length_years": 10,
                    "home_ownership": "OWN",
                    "loan_purpose": "major_purchase",
                    "term_months": 36,
                    "revol_util": 11.5,
                    "delinq_2yrs": 0,
                    "inq_last_6mths": 0,
                    "open_acc": 16,
                    "pub_rec": 0,
                    "mort_acc": 1,
                    "loan_title": "Electric vehicle and charging equipment"
                },
                {
                    "applicant_id": "APP-52914",
                    "applicant_name": "Julian Hayes",
                    "annual_inc": 35000.0,
                    "loan_amnt": 22000.0,
                    "fico_score": 595,
                    "dti": 44.0,
                    "emp_length_years": 0,
                    "home_ownership": "RENT",
                    "loan_purpose": "debt_consolidation",
                    "term_months": 60,
                    "revol_util": 92.0,
                    "delinq_2yrs": 3,
                    "inq_last_6mths": 4,
                    "open_acc": 8,
                    "pub_rec": 1,
                    "mort_acc": 0,
                    "loan_title": "Refinance unsecured debts"
                },
                {
                    "applicant_id": "APP-63820",
                    "applicant_name": "Clara Higgins",
                    "annual_inc": 88000.0,
                    "loan_amnt": 15000.0,
                    "fico_score": 735,
                    "dti": 19.5,
                    "emp_length_years": 6,
                    "home_ownership": "MORTGAGE",
                    "loan_purpose": "medical",
                    "term_months": 36,
                    "revol_util": 28.0,
                    "delinq_2yrs": 0,
                    "inq_last_6mths": 0,
                    "open_acc": 10,
                    "pub_rec": 0,
                    "mort_acc": 1,
                    "loan_title": "Dental surgery procedure"
                },
                {
                    "applicant_id": "APP-74910",
                    "applicant_name": "Brandon Walsh",
                    "annual_inc": 54000.0,
                    "loan_amnt": 16000.0,
                    "fico_score": 655,
                    "dti": 29.0,
                    "emp_length_years": 3,
                    "home_ownership": "RENT",
                    "loan_purpose": "credit_card",
                    "term_months": 36,
                    "revol_util": 68.0,
                    "delinq_2yrs": 1,
                    "inq_last_6mths": 2,
                    "open_acc": 7,
                    "pub_rec": 0,
                    "mort_acc": 0,
                    "loan_title": "Balance transfer"
                },
                {
                    "applicant_id": "APP-85194",
                    "applicant_name": "Tanya Mercer",
                    "annual_inc": 62000.0,
                    "loan_amnt": 25000.0,
                    "fico_score": 630,
                    "dti": 37.0,
                    "emp_length_years": 2,
                    "home_ownership": "RENT",
                    "loan_purpose": "small_business",
                    "term_months": 60,
                    "revol_util": 79.5,
                    "delinq_2yrs": 1,
                    "inq_last_6mths": 3,
                    "open_acc": 11,
                    "pub_rec": 0,
                    "mort_acc": 0,
                    "loan_title": "Boutique café startup equipment"
                }
            ]
            
            for prof in sample_profiles:
                app_id = prof["applicant_id"]
                inp = LoanApplicationInput(**prof)
                pred = ml_service.predict(inp, applicant_id=app_id)
                await self.save_application_and_prediction(inp, pred)
                
            logger.info("Successfully seeded initial bank applications.")
        except Exception as e:
            logger.error(f"Error seeding sample applications: {e}", exc_info=True)

    async def save_application_and_prediction(self, input_data: LoanApplicationInput, prediction: Dict[str, Any]) -> Dict[str, Any]:
        """Saves or updates an applicant record and records prediction event"""
        app_id = prediction["applicant_id"]
        now = datetime.now(timezone.utc).isoformat()
        
        doc = {
            "applicant_id": app_id,
            "applicant_name": input_data.applicant_name or f"Applicant {app_id[-5:]}",
            "loan_amnt": float(input_data.loan_amnt),
            "annual_inc": float(input_data.annual_inc),
            "fico_score": int(input_data.fico_score),
            "loan_purpose": str(input_data.loan_purpose),
            "dti": float(input_data.dti),
            "default_probability": float(prediction["final_probability"]),
            "risk_level": str(prediction["risk_level"]),
            "recommendation": str(prediction["recommendation"]),
            "input_data": input_data.model_dump(),
            "model_predictions": {k: v.model_dump() if hasattr(v, 'model_dump') else v for k, v in prediction["model_predictions"].items()},
            "positive_risk_factors": [rf.model_dump() if hasattr(rf, 'model_dump') else rf for rf in prediction["positive_risk_factors"]],
            "risk_reducing_factors": [rf.model_dump() if hasattr(rf, 'model_dump') else rf for rf in prediction["risk_reducing_factors"]],
            "created_at": now,
            "updated_at": now
        }
        
        pred_record = {
            "applicant_id": app_id,
            "input_features": input_data.model_dump(),
            "final_probability": float(prediction["final_probability"]),
            "risk_level": str(prediction["risk_level"]),
            "model_predictions": doc["model_predictions"],
            "positive_risk_factors": doc["positive_risk_factors"],
            "risk_reducing_factors": doc["risk_reducing_factors"],
            "timestamp": now
        }
        
        if db.is_connected and db.db is not None:
            await db.db.applicants.update_one(
                {"applicant_id": app_id},
                {"$set": doc},
                upsert=True
            )
            await db.db.predictions.insert_one(pred_record)
        else:
            # Memory store fallback
            existing = next((i for i, a in enumerate(db._memory_store["applicants"]) if a["applicant_id"] == app_id), None)
            if existing is not None:
                doc["created_at"] = db._memory_store["applicants"][existing]["created_at"]
                db._memory_store["applicants"][existing] = doc
            else:
                db._memory_store["applicants"].insert(0, doc)
            db._memory_store["predictions"].insert(0, pred_record)
            
        return doc

    async def get_applications(
        self,
        search: Optional[str] = None,
        risk_level: Optional[str] = None,
        loan_purpose: Optional[str] = None,
        min_prob: Optional[float] = None,
        max_prob: Optional[float] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        page: int = 1,
        limit: int = 10
    ) -> ApplicationsListResponse:
        """Query and paginate applicant records with full search and filtering"""
        query = {}
        
        if search:
            query["$or"] = [
                {"applicant_id": {"$regex": search, "$options": "i"}},
                {"applicant_name": {"$regex": search, "$options": "i"}},
                {"loan_purpose": {"$regex": search, "$options": "i"}}
            ]
            
        if risk_level and risk_level.upper() in ["LOW", "MEDIUM", "HIGH"]:
            query["risk_level"] = risk_level.upper()
            
        if loan_purpose and loan_purpose != "ALL":
            query["loan_purpose"] = loan_purpose
            
        prob_query = {}
        if min_prob is not None:
            prob_query["$gte"] = float(min_prob)
        if max_prob is not None:
            prob_query["$lte"] = float(max_prob)
        if prob_query:
            query["default_probability"] = prob_query
            
        # MongoDB Execution
        if db.is_connected and db.db is not None:
            direction = -1 if sort_order == "desc" else 1
            sort_field = sort_by
            if sort_by == "probability":
                sort_field = "default_probability"
            elif sort_by == "loan_amount":
                sort_field = "loan_amnt"
            elif sort_by == "income":
                sort_field = "annual_inc"
                
            total = await db.db.applicants.count_documents(query)
            cursor = db.db.applicants.find(query).sort(sort_field, direction).skip((page - 1) * limit).limit(limit)
            items_raw = await cursor.to_list(length=limit)
        else:
            # Memory store execution
            items_raw = list(db._memory_store["applicants"])
            # Filter
            if search:
                s = search.lower()
                items_raw = [a for a in items_raw if s in a["applicant_id"].lower() or s in a.get("applicant_name", "").lower() or s in a.get("loan_purpose", "").lower()]
            if risk_level and risk_level.upper() in ["LOW", "MEDIUM", "HIGH"]:
                items_raw = [a for a in items_raw if a.get("risk_level") == risk_level.upper()]
            if loan_purpose and loan_purpose != "ALL":
                items_raw = [a for a in items_raw if a.get("loan_purpose") == loan_purpose]
            if min_prob is not None:
                items_raw = [a for a in items_raw if a.get("default_probability", 0) >= float(min_prob)]
            if max_prob is not None:
                items_raw = [a for a in items_raw if a.get("default_probability", 0) <= float(max_prob)]
                
            total = len(items_raw)
            # Sort
            rev = (sort_order == "desc")
            if sort_by == "probability":
                items_raw.sort(key=lambda x: x.get("default_probability", 0), reverse=rev)
            elif sort_by == "loan_amount":
                items_raw.sort(key=lambda x: x.get("loan_amnt", 0), reverse=rev)
            elif sort_by == "income":
                items_raw.sort(key=lambda x: x.get("annual_inc", 0), reverse=rev)
            elif sort_by == "fico":
                items_raw.sort(key=lambda x: x.get("fico_score", 0), reverse=rev)
            else:
                items_raw.sort(key=lambda x: x.get("created_at", ""), reverse=rev)
                
            items_raw = items_raw[(page - 1) * limit : page * limit]

        items = [
            ApplicantSummary(
                applicant_id=doc["applicant_id"],
                applicant_name=doc.get("applicant_name", f"Applicant {doc['applicant_id']}"),
                loan_amnt=float(doc["loan_amnt"]),
                annual_inc=float(doc["annual_inc"]),
                fico_score=int(doc["fico_score"]),
                loan_purpose=str(doc["loan_purpose"]),
                dti=float(doc["dti"]),
                default_probability=float(doc["default_probability"]),
                risk_level=str(doc["risk_level"]),
                created_at=str(doc.get("created_at", ""))
            )
            for doc in items_raw
        ]
        
        pages = max(1, math.ceil(total / limit)) if limit > 0 else 1
        return ApplicationsListResponse(
            items=items,
            total=total,
            page=page,
            limit=limit,
            pages=pages
        )

    async def get_applicant_by_id(self, applicant_id: str) -> Optional[ApplicationDetail]:
        """Fetches full applicant details, current prediction, and history"""
        doc = None
        history = []
        
        if db.is_connected and db.db is not None:
            doc = await db.db.applicants.find_one({"applicant_id": applicant_id})
            if doc:
                hist_cursor = db.db.predictions.find({"applicant_id": applicant_id}).sort("timestamp", -1)
                hist_docs = await hist_cursor.to_list(length=20)
                history = [{
                    "final_probability": h.get("final_probability"),
                    "risk_level": h.get("risk_level"),
                    "timestamp": h.get("timestamp"),
                    "model_predictions": h.get("model_predictions")
                } for h in hist_docs]
        else:
            doc = next((a for a in db._memory_store["applicants"] if a["applicant_id"] == applicant_id), None)
            history = [h for h in db._memory_store["predictions"] if h["applicant_id"] == applicant_id]
            
        if not doc:
            return None
            
        return ApplicationDetail(
            applicant_id=doc["applicant_id"],
            applicant_name=doc.get("applicant_name", f"Applicant {doc['applicant_id']}"),
            input_data=doc.get("input_data", {}),
            default_probability=float(doc.get("default_probability", 0.0)),
            risk_level=str(doc.get("risk_level", "LOW")),
            recommendation=str(doc.get("recommendation", "")),
            model_predictions=doc.get("model_predictions", {}),
            positive_risk_factors=doc.get("positive_risk_factors", []),
            risk_reducing_factors=doc.get("risk_reducing_factors", []),
            prediction_history=history,
            created_at=str(doc.get("created_at", "")),
            updated_at=str(doc.get("updated_at", ""))
        )

    async def get_dashboard_stats(self, model_summary: Dict[str, Any] = None) -> DashboardStats:
        """Aggregates portfolio risk metrics, counts, and recent high risk loans"""
        if db.is_connected and db.db is not None:
            total = await db.db.applicants.count_documents({})
            high = await db.db.applicants.count_documents({"risk_level": "HIGH"})
            med = await db.db.applicants.count_documents({"risk_level": "MEDIUM"})
            low = await db.db.applicants.count_documents({"risk_level": "LOW"})
            
            # Recent high risk
            high_cursor = db.db.applicants.find({"risk_level": "HIGH"}).sort("default_probability", -1).limit(5)
            high_docs = await high_cursor.to_list(length=5)
            
            # Recent all
            recent_cursor = db.db.applicants.find({}).sort("created_at", -1).limit(5)
            recent_docs = await recent_cursor.to_list(length=5)
            
            # Averages
            pipeline = [
                {"$group": {
                    "_id": None,
                    "avg_prob": {"$avg": "$default_probability"},
                    "avg_loan": {"$avg": "$loan_amnt"},
                    "avg_fico": {"$avg": "$fico_score"}
                }}
            ]
            agg = await db.db.applicants.aggregate(pipeline).to_list(1)
            avg_prob = agg[0]["avg_prob"] if agg else 0.0
            avg_loan = agg[0]["avg_loan"] if agg else 0.0
            avg_fico = agg[0]["avg_fico"] if agg else 0.0
        else:
            apps = db._memory_store["applicants"]
            total = len(apps)
            high = sum(1 for a in apps if a.get("risk_level") == "HIGH")
            med = sum(1 for a in apps if a.get("risk_level") == "MEDIUM")
            low = sum(1 for a in apps if a.get("risk_level") == "LOW")
            
            high_sorted = sorted([a for a in apps if a.get("risk_level") == "HIGH"], key=lambda x: x.get("default_probability", 0), reverse=True)
            high_docs = high_sorted[:5]
            
            recent_sorted = sorted(apps, key=lambda x: x.get("created_at", ""), reverse=True)
            recent_docs = recent_sorted[:5]
            
            avg_prob = sum(a.get("default_probability", 0) for a in apps) / total if total > 0 else 0.0
            avg_loan = sum(a.get("loan_amnt", 0) for a in apps) / total if total > 0 else 0.0
            avg_fico = sum(a.get("fico_score", 0) for a in apps) / total if total > 0 else 0.0

        def to_summary(d):
            return ApplicantSummary(
                applicant_id=d["applicant_id"],
                applicant_name=d.get("applicant_name", f"Applicant {d['applicant_id']}"),
                loan_amnt=float(d.get("loan_amnt", 0)),
                annual_inc=float(d.get("annual_inc", 0)),
                fico_score=int(d.get("fico_score", 0)),
                loan_purpose=str(d.get("loan_purpose", "")),
                dti=float(d.get("dti", 0)),
                default_probability=float(d.get("default_probability", 0)),
                risk_level=str(d.get("risk_level", "LOW")),
                created_at=str(d.get("created_at", ""))
            )

        return DashboardStats(
            total_applications=total,
            high_risk_count=high,
            medium_risk_count=med,
            low_risk_count=low,
            overall_default_rate=round(float(avg_prob), 4),
            average_loan_amount=round(float(avg_loan), 2),
            average_fico=round(float(avg_fico), 1),
            risk_distribution=RiskDistribution(
                low=low,
                medium=med,
                high=high,
                total=total
            ),
            recent_high_risk=[to_summary(d) for d in high_docs],
            recent_applications=[to_summary(d) for d in recent_docs],
            model_summary=model_summary or {}
        )

db_service = DBService()
