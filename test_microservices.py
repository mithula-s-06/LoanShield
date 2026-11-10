import os
import sys
import unittest
from fastapi.testclient import TestClient

# Ensure backend and microservices paths are configured
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
sys.path.insert(0, backend_dir)
sys.path.insert(0, os.path.join(backend_dir, "microservices"))
sys.path.insert(0, os.path.join(backend_dir, "ml"))

from microservices.ml_service.main import app as ml_app, engine as ml_engine
from microservices.pricing_service.main import app as pricing_app
from microservices.application_service.main import app as app_service_app
from microservices.api_gateway.main import app as gateway_app

class TestLoanShieldMicroservices(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        print("\n" + "=" * 70)
        print(" INITIALIZING LOANSHIELD MICROSERVICES TEST SUITE")
        print("=" * 70)
        # Pre-load ML engine artifacts
        ml_engine.load_artifacts()

    def test_01_ml_service_health(self):
        client = TestClient(ml_app)
        res = client.get("/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["service"], "ml_service")
        self.assertEqual(data["port"], 8001)
        self.assertTrue(data["is_loaded"])
        print(" [PASS] ML Risk Service /health operational.")

    def test_02_ml_service_predict(self):
        client = TestClient(ml_app)
        payload = {
            "applicant_name": "Eleanor Vance",
            "annual_inc": 115000.0,
            "loan_amnt": 15000.0,
            "fico_score": 770,
            "dti": 12.0,
            "emp_length_years": 8,
            "home_ownership": "MORTGAGE",
            "loan_purpose": "credit_card",
            "term_months": 36,
            "revol_util": 15.0,
            "delinq_2yrs": 0,
            "inq_last_6mths": 0,
            "open_acc": 12,
            "pub_rec": 0,
            "mort_acc": 2
        }
        res = client.post("/predict", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("final_probability", data)
        self.assertIn("risk_level", data)
        self.assertIn("positive_risk_factors", data)
        self.assertIn("risk_reducing_factors", data)
        self.assertIn(data["risk_level"], ["LOW", "MEDIUM", "HIGH"])
        print(f" [PASS] ML Risk Prediction: {data['final_probability'] * 100:.2f}% -> {data['risk_level']} Risk.")

    def test_03_pricing_service_categories(self):
        client = TestClient(pricing_app)
        res = client.get("/loan-products/categories")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("categories", data)
        self.assertGreater(len(data["categories"]), 3)
        print(f" [PASS] Pricing Service: {len(data['categories'])} loan purchase categories loaded.")

    def test_04_pricing_service_amortization(self):
        client = TestClient(pricing_app)
        payload = {
            "loan_purpose": "debt_consolidation",
            "loan_amount": 25000.0,
            "term_months": 36,
            "fico_score": 720,
            "dti": 18.0,
            "down_payment": 0.0,
            "default_probability": 0.15
        }
        res = client.post("/loan-products/calculate-interest", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreater(data["calculated_apr"], 0)
        self.assertGreater(data["monthly_payment"], 0)
        self.assertGreaterEqual(len(data["amortization_schedule"]), 24)
        self.assertIn("yearly_schedule", data)
        print(f" [PASS] Pricing Engine: Monthly Payment ${data['monthly_payment']:.2f} at {data['calculated_apr']:.2f}% APR.")

    def test_05_application_service_flow(self):
        client = TestClient(app_service_app)
        # Test listing
        res = client.get("/applications")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("items", data)
        self.assertIn("total", data)
        print(f" [PASS] Application Service: Successfully retrieved application registry (Total: {data['total']}).")

        # Test creating new application
        payload = {
            "applicant_name": "Test Candidate",
            "annual_inc": 95000.0,
            "loan_amnt": 18000.0,
            "fico_score": 740,
            "dti": 15.0,
            "emp_length_years": 6,
            "home_ownership": "MORTGAGE",
            "loan_purpose": "home_improvement",
            "term_months": 36,
            "revol_util": 20.0,
            "delinq_2yrs": 0,
            "inq_last_6mths": 0,
            "open_acc": 8,
            "pub_rec": 0,
            "mort_acc": 1
        }
        create_res = client.post("/applications", json=payload)
        self.assertEqual(create_res.status_code, 200)
        created = create_res.json()
        self.assertEqual(created["applicant_name"], "Test Candidate")
        self.assertIn("applicant_id", created)
        print(f" [PASS] Application Service: Successfully underwrote new applicant '{created['applicant_id']}'.")

    def test_06_gateway_root(self):
        client = TestClient(gateway_app)
        res = client.get("/")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["architecture"], "Microservices")
        print(" [PASS] API Gateway root endpoint functional.")

if __name__ == "__main__":
    unittest.main(verbosity=2)
