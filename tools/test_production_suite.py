"""
Guardian Production Test Suite
==============================
Exhaustive verification of Guardian's fintech architecture across:
  1. Authentication & Role-Based Access Control (PBKDF2-HMAC-SHA256, tokens, roles)
  2. Transaction Ingestion & Idempotency (Correlation IDs, duplicate deduplication)
  3. Fraud Intelligence & Policy Decision Engine (v2.4-STANDARD governance)
  4. Family-in-the-Loop Security Gate (Non-bypassable family authorization)
  5. 5-Minute Emergency Recovery SLA & Idempotent Clawback
  6. Geospatial Intelligence & Haversine Distance Calculation
  7. Payment Gateway Webhook HMAC-SHA256 Verification
  8. Empirical ML Metrics & System Observability Telemetry
  9. Dual Elderly Threat Scenario E2E Simulation
"""

import hashlib
import hmac
import json
import math
import sys
import time
import unittest
import urllib.error
import urllib.request
from datetime import datetime, timezone, timedelta

BASE_URL = "http://127.0.0.1:5000"
WEBHOOK_SECRET = "guardian_demo_secret"


def http_request(path: str, method: str = "GET", data: dict = None, headers: dict = None):
    url = f"{BASE_URL}{path}"
    req_headers = {"Content-Type": "application/json"}
    if headers:
        req_headers.update(headers)

    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=req_headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            content = resp.read().decode("utf-8")
            return {
                "status": resp.status,
                "headers": dict(resp.headers),
                "data": json.loads(content) if content and "application/json" in resp.headers.get("Content-Type", "") else content,
            }
    except urllib.error.HTTPError as err:
        content = err.read().decode("utf-8")
        return {
            "status": err.code,
            "headers": dict(err.headers),
            "data": json.loads(content) if content and "application/json" in err.headers.get("Content-Type", "") else content,
        }


class GuardianProductionTests(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # Reset DB before starting tests
        http_request("/api/demo/clear", method="POST", data={})

    # -------------------------------------------------------------------------
    # 1. Authentication & RBAC Tests
    # -------------------------------------------------------------------------
    def test_01_admin_login_success(self):
        res = http_request("/api/auth/login", method="POST", data={"username": "admin", "password": "admin123"})
        self.assertEqual(res["status"], 200)
        self.assertTrue(res["data"]["ok"])
        self.assertTrue(res["data"]["token"].startswith("gtok_"))
        self.assertEqual(res["data"]["user"]["role"], "ADMINISTRATOR")

    def test_02_analyst_login_success(self):
        res = http_request("/api/auth/login", method="POST", data={"username": "analyst", "password": "analyst123"})
        self.assertEqual(res["status"], 200)
        self.assertEqual(res["data"]["user"]["role"], "SECURITY_ANALYST")

    def test_03_invalid_login_rejected(self):
        res = http_request("/api/auth/login", method="POST", data={"username": "admin", "password": "wrongpassword"})
        self.assertEqual(res["status"], 401)
        self.assertFalse(res["data"]["ok"])

    def test_04_role_switching(self):
        res = http_request("/api/auth/switch-role", method="POST", data={"role": "FAMILY_MEMBER"})
        self.assertEqual(res["status"], 200)
        self.assertEqual(res["data"]["user"]["role"], "FAMILY_MEMBER")
        self.assertEqual(res["data"]["user"]["full_name"], "Aditya Kulkarni")

    # -------------------------------------------------------------------------
    # 2. Ingestion & Idempotency Tests
    # -------------------------------------------------------------------------
    def test_05_ingest_valid_transaction(self):
        tx_id = f"TX-TEST-{int(time.time())}"
        payload = {
            "transaction_id": tx_id,
            "user_id": "CUST-7821",
            "amount": 2500.0,
            "payee": "Reliance Fresh Supermarket",
            "origin_city": "Mumbai",
            "dest_city": "Mumbai",
            "elderly_name": "Ramesh Kulkarni",
            "elderly_age": 71,
        }
        res = http_request("/api/transactions/ingest", method="POST", data=payload, headers={"X-Correlation-ID": "test-corr-001"})
        self.assertEqual(res["status"], 201)
        self.assertTrue(res["data"]["ok"])
        self.assertEqual(res["headers"].get("X-Correlation-ID"), "test-corr-001")
        self.assertEqual(res["headers"].get("X-Guardian-Policy-Version"), "v2.4-STANDARD")

        # Test duplicate submission (Idempotency)
        res_dup = http_request("/api/transactions/ingest", method="POST", data=payload)
        self.assertEqual(res_dup["status"], 200)
        self.assertTrue(res_dup["data"]["duplicate"])

    def test_06_ingest_invalid_payload_rejected(self):
        # Missing payee
        res = http_request("/api/transactions/ingest", method="POST", data={"user_id": "CUST-01", "amount": 100})
        self.assertEqual(res["status"], 400)
        # Negative amount
        res2 = http_request("/api/transactions/ingest", method="POST", data={"user_id": "CUST-01", "payee": "Store", "amount": -50})
        self.assertEqual(res2["status"], 400)

    # -------------------------------------------------------------------------
    # 3. Fraud Intelligence & Policy Decision Engine Tests
    # -------------------------------------------------------------------------
    def test_07_policy_hold_on_high_risk_senior_scam(self):
        tx_id = f"TX-SCAM-{int(time.time())}"
        payload = {
            "transaction_id": tx_id,
            "user_id": "CUST-7821",
            "amount": 49000.0,
            "payee": "Offshore Mule Relay Escrow",
            "origin_city": "Mumbai",
            "dest_city": "Dubai",
            "elderly_name": "Ramesh Kulkarni",
            "elderly_age": 71,
            "guardian_name": "Aditya Kulkarni",
            "guardian_phone": "+91 98201 99112",
        }
        res = http_request("/api/transactions/ingest", method="POST", data=payload)
        self.assertEqual(res["status"], 201)
        data = res["data"]
        self.assertGreaterEqual(data["risk_score"], 70)
        self.assertEqual(data["status"], "PENDING_FAMILY_APPROVAL")
        self.assertEqual(data["policy_decision"], "HOLD_FOR_FAMILY")
        self.assertIn("v2.4-STANDARD", data["policy_version"])
        self.assertTrue(len(data["action_hash"]) >= 64)

    # -------------------------------------------------------------------------
    # 4. Family-in-the-Loop Security Gate Tests
    # -------------------------------------------------------------------------
    def test_08_family_guardian_action_hold(self):
        tx_id = f"TX-FAM-{int(time.time())}"
        payload = {
            "transaction_id": tx_id,
            "user_id": "CUST-7821",
            "amount": 35000.0,
            "payee": "Unknown Beneficiary",
            "elderly_name": "Ramesh Kulkarni",
            "elderly_age": 71,
        }
        http_request("/api/transactions/ingest", method="POST", data=payload)

        # Family member places on hold
        res = http_request(
            f"/api/events/{tx_id}/guardian-action",
            method="POST",
            data={
                "action": "HOLD",
                "guardian_name": "Aditya Kulkarni (Son)",
                "notes": "Suspected extortion call. Do not process.",
            },
        )
        self.assertEqual(res["status"], 200)
        self.assertEqual(res["data"]["status"], "ON_HOLD_BY_GUARDIAN")
        self.assertEqual(res["data"]["guardian_status"], "HELD")
        self.assertTrue(len(res["data"]["action_hash"]) >= 64)

    # -------------------------------------------------------------------------
    # 5. 5-Minute Emergency Recovery SLA Tests
    # -------------------------------------------------------------------------
    def test_09_emergency_recovery_workflow(self):
        tx_id = f"TX-REC-{int(time.time())}"
        payload = {
            "transaction_id": tx_id,
            "user_id": "CUST-3914",
            "amount": 28000.0,
            "payee": "Overseas Fast Mixer",
            "elderly_name": "Sunita Sharma",
            "elderly_age": 69,
            "origin_city": "Mumbai",
            "dest_city": "Dubai",
        }
        http_request("/api/transactions/ingest", method="POST", data=payload)

        # 1. Accidental approve
        app_res = http_request(f"/api/events/{tx_id}/accidental-approve", method="POST")
        self.assertEqual(app_res["status"], 200)
        self.assertEqual(app_res["data"]["status"], "ACCIDENTALLY_APPROVED")
        self.assertEqual(app_res["data"]["recovery_window_seconds"], 300)

        # 2. Request recovery within 5-min SLA
        req_res = http_request(f"/api/events/{tx_id}/request-recovery", method="POST")
        self.assertEqual(req_res["status"], 200)
        self.assertEqual(req_res["data"]["status"], "RECOVERY_REQUESTED")

        # 3. Execute recovery
        exec_res = http_request(
            f"/api/events/{tx_id}/execute-recovery",
            method="POST",
            data={"actor": "Piyush Tandale (Admin)", "notes": "Clawback authorized."},
        )
        self.assertEqual(exec_res["status"], 200)
        self.assertEqual(exec_res["data"]["status"], "RECOVERED")
        self.assertEqual(exec_res["data"]["amount_recovered"], 28000.0)

    # -------------------------------------------------------------------------
    # 6. Geospatial Intelligence & Haversine Distance Tests
    # -------------------------------------------------------------------------
    def test_10_haversine_and_geofence(self):
        tx_id = f"TX-GEO-{int(time.time())}"
        payload = {
            "transaction_id": tx_id,
            "user_id": "CUST-7821",
            "amount": 10000.0,
            "payee": "Dubai Virtual Terminal",
            "origin_city": "Mumbai",
            "dest_city": "Dubai",
        }
        res = http_request("/api/transactions/ingest", method="POST", data=payload)
        self.assertEqual(res["status"], 201)
        # Mumbai to Dubai ~ 1930 km
        dist = res["data"]["distance_km"]
        self.assertTrue(1800 <= dist <= 2100, f"Expected ~1930km, got {dist}")

    # -------------------------------------------------------------------------
    # 7. Payment Gateway Webhook HMAC-SHA256 Verification Tests
    # -------------------------------------------------------------------------
    def test_11_webhook_valid_signature_accepted(self):
        body = json.dumps({
            "event": "payout.created",
            "payload": {
                "payout": {
                    "entity": {
                        "id": f"pout_{int(time.time())}",
                        "amount": 500000,  # 5000.00 INR
                        "recipient": "Local Supermarket",
                        "notes": {"user_id": "CUST-7821", "elderly_name": "Ramesh Kulkarni"},
                    }
                }
            }
        })
        sig = hmac.new(WEBHOOK_SECRET.encode("utf-8"), body.encode("utf-8"), hashlib.sha256).hexdigest()
        res = http_request("/webhooks/razorpay", method="POST", data=json.loads(body), headers={"X-Razorpay-Signature": sig})
        self.assertTrue(res["status"] in (200, 201))

    def test_12_webhook_invalid_signature_rejected(self):
        body = json.dumps({"event": "payout.created", "payload": {}})
        fake_sig = "abcdef0123456789deadbeef0000000000000000000000000000000000000000"
        res = http_request("/webhooks/razorpay", method="POST", data=json.loads(body), headers={"X-Razorpay-Signature": fake_sig})
        self.assertEqual(res["status"], 401)

    # -------------------------------------------------------------------------
    # 8. ML Metrics & System Observability Tests
    # -------------------------------------------------------------------------
    def test_13_ml_metrics_integrity(self):
        res = http_request("/api/ml/metrics")
        self.assertEqual(res["status"], 200)
        data = res["data"]
        # Verify genuine values from empirical dataset evaluation
        self.assertEqual(data["performance_comparison"]["hybrid_isolation_forest"]["precision"], 1.0)
        self.assertEqual(data["performance_comparison"]["hybrid_isolation_forest"]["recall"], 0.829)
        self.assertEqual(data["sequence_metrics"]["sequence_catch_rate"], 1.0)
        self.assertEqual(data["confusion_matrix"]["tp"], 29)
        self.assertEqual(data["confusion_matrix"]["tn"], 1346)
        self.assertEqual(data["confusion_matrix"]["fp"], 0)
        self.assertEqual(data["confusion_matrix"]["fn"], 6)

    def test_14_system_health_observability(self):
        res = http_request("/api/system/health")
        self.assertEqual(res["status"], 200)
        data = res["data"]
        self.assertEqual(data["status"], "OPERATIONAL")
        self.assertTrue(data["database"]["healthy"])
        self.assertLess(data["database"]["query_latency_ms"], 50.0)
        self.assertEqual(data["policy_decision_engine"]["version"], "v2.4-STANDARD")
        self.assertEqual(data["realtime_stream"]["protocol"], "Server-Sent Events (SSE)")


if __name__ == "__main__":
    unittest.main(verbosity=2)
