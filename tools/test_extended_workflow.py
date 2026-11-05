"""
Comprehensive Extended Workflow Verification Test for Guardian AI Payment Safety:
1. Ingestion API (/api/transactions/ingest) with Idempotency & State Machine
2. Webhook HMAC-SHA256 signature verification (Valid vs Invalid signature)
3. 5-Minute SLA Expiration enforcement (Expired recovery fails with WINDOW_EXPIRED)
4. Geospatial & Impossible Velocity analysis in GuardianEngine
"""
import sys
import json
import hmac
import hashlib
from pathlib import Path
from datetime import datetime, timedelta, timezone

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from app import app, connect_db, WEBHOOK_SECRET
from guardian_engine import GuardianEngine, RiskResult

client = app.test_client()

def run_extended_tests():
    print("======================================================================")
    print("GUARDIAN EXTENDED PIPELINE: INGESTION, WEBHOOK, EXPIRY & VELOCITY")
    print("======================================================================\n")

    # Clean DB
    client.post("/api/demo/clear")

    # ------------------------------------------------------------------
    # 1. Test Ingestion API (/api/transactions/ingest)
    # ------------------------------------------------------------------
    print("--- 1. Testing Ingestion API (/api/transactions/ingest) ---")
    
    # 1A: Routine legitimate transaction
    ingest_payload_1 = {
        "transaction_id": "TXN-ING-001",
        "user_id": "CUST-SENIOR-1",
        "amount": 750.0,
        "payee": "Apollo Pharmacy Dadar",
        "payment_method": "UPI",
        "origin_city": "Dadar, Mumbai",
        "dest_city": "Dadar, Mumbai",
        "elderly_name": "Ramesh Kulkarni",
        "elderly_age": 72,
        "guardian_name": "Aditya Kulkarni",
        "guardian_phone": "+91 98201 11223"
    }
    res1 = client.post("/api/transactions/ingest", json=ingest_payload_1)
    assert res1.status_code == 201, f"Failed: {res1.data}"
    d1 = res1.get_json()
    assert d1["ok"] is True
    assert d1["transaction_id"] == "TXN-ING-001"
    assert d1["status"] == "COMPLETED"
    assert d1["risk_level"] == "LOW"
    print(f"✓ Routine transaction ingested: {d1['transaction_id']} -> {d1['risk_level']} [Score: {d1['risk_score']}] Status: {d1['status']}")

    # 1B: Idempotency check with identical transaction_id
    res1_dup = client.post("/api/transactions/ingest", json=ingest_payload_1)
    assert res1_dup.status_code == 200, f"Duplicate check failed: {res1_dup.data}"
    d1_dup = res1_dup.get_json()
    assert d1_dup["ok"] is True
    assert d1_dup["duplicate"] is True
    assert d1_dup["transaction_id"] == "TXN-ING-001"
    print("✓ Idempotency verified: duplicate ingestion returned 200 OK without re-inserting")

    # 1C: High-risk fraudulent transaction (Held for family approval)
    ingest_payload_scam = {
        "transaction_id": "TXN-ING-SCAM-99",
        "user_id": "CUST-SENIOR-1",
        "amount": 55000.0,
        "payee": "Offshore Crypto Escrow Phnom Penh",
        "payment_method": "IMPS",
        "origin_city": "Mumbai",
        "dest_city": "Phnom Penh",
        "dest_lat": 11.5564,
        "dest_lon": 104.9282,
        "elderly_name": "Ramesh Kulkarni",
        "elderly_age": 72,
        "guardian_name": "Aditya Kulkarni",
        "guardian_phone": "+91 98201 11223"
    }
    res_scam = client.post("/api/transactions/ingest", json=ingest_payload_scam)
    assert res_scam.status_code == 201, f"Failed scam ingestion: {res_scam.data}"
    d_scam = res_scam.get_json()
    assert d_scam["ok"] is True
    assert d_scam["risk_level"] == "HIGH"
    assert d_scam["status"] == "PENDING_FAMILY_APPROVAL"
    assert d_scam["guardian_status"] == "PENDING"
    assert d_scam["geofence_status"] == "CROSS_BORDER_ANOMALY"
    print(f"✓ High-risk scam identified: {d_scam['transaction_id']} -> {d_scam['risk_level']} [Score: {d_scam['risk_score']}], Geofence: {d_scam['geofence_status']} ({int(d_scam['distance_km']):,} km). Status: {d_scam['status']}")

    # ------------------------------------------------------------------
    # 2. Test Razorpay Webhook & HMAC Signature Validation
    # ------------------------------------------------------------------
    print("\n--- 2. Testing Webhook & HMAC-SHA256 Signature Validation ---")
    
    webhook_body = json.dumps({
        "event": "payout.created",
        "payload": {
            "payout": {
                "entity": {
                    "id": "pout_webhook_test_1",
                    "amount": 1850000, # in paise = ₹18,500
                    "method": "UPI",
                    "notes": {
                        "user_id": "CUST-WH-1",
                        "elderly_name": "Kamala Devi",
                        "elderly_age": 74,
                        "payee": "Suspected KYC Refresh Phishing",
                        "location": "Mumbai",
                        "dest_city": "Lagos"
                    }
                }
            }
        }
    }).encode("utf-8")

    # 2A: Invalid HMAC signature -> 401 Unauthorized
    invalid_sig = "abcdef1234567890abcdef1234567890"
    res_invalid = client.post(
        "/webhooks/razorpay",
        data=webhook_body,
        headers={"Content-Type": "application/json", "X-Razorpay-Signature": invalid_sig}
    )
    assert res_invalid.status_code == 401, f"Expected 401 for bad signature, got {res_invalid.status_code}"
    print("✓ Invalid HMAC signature rejected with 401 Unauthorized")

    # 2B: Valid HMAC signature -> Processed successfully
    valid_sig = hmac.new(WEBHOOK_SECRET.encode("utf-8"), webhook_body, hashlib.sha256).hexdigest()
    res_valid = client.post(
        "/webhooks/razorpay",
        data=webhook_body,
        headers={"Content-Type": "application/json", "X-Razorpay-Signature": valid_sig}
    )
    assert res_valid.status_code == 201, f"Expected 201, got {res_valid.status_code}: {res_valid.data}"
    wh_data = res_valid.get_json()
    assert wh_data["ok"] is True
    print(f"✓ Valid HMAC signature accepted: {wh_data['transaction_id']} scored {wh_data['risk_level']} -> {wh_data['status']}")

    # 2C: Reversal event -> marks RECOVERED
    reversal_body = json.dumps({
        "event": "payout.reversed",
        "payload": {
            "payout": {
                "entity": {
                    "id": wh_data["transaction_id"],
                    "amount": 1850000
                }
            }
        }
    }).encode("utf-8")
    rev_sig = hmac.new(WEBHOOK_SECRET.encode("utf-8"), reversal_body, hashlib.sha256).hexdigest()
    res_rev = client.post(
        "/webhooks/razorpay",
        data=reversal_body,
        headers={"Content-Type": "application/json", "X-Razorpay-Signature": rev_sig}
    )
    assert res_rev.status_code == 200
    rev_data = res_rev.get_json()
    assert rev_data["status"] == "RECOVERED"
    print(f"✓ Webhook payout.reversed event processed: {rev_data['transaction_id']} updated to RECOVERED")

    # ------------------------------------------------------------------
    # 3. Test 5-Minute Recovery SLA Expiration Enforcement
    # ------------------------------------------------------------------
    print("\n--- 3. Testing 5-Minute Recovery SLA Expiration Enforcement ---")
    
    con = connect_db()
    expired_tx_id = "TXN-EXPIRED-TEST"
    now_utc = datetime.now(timezone.utc)
    expired_timestamp = (now_utc - timedelta(minutes=10)).isoformat() # Expired 10 mins ago

    con.execute(
        """INSERT OR REPLACE INTO events (
            transaction_id, source, user_id, payee, amount, created_at,
            risk_score, risk_level, reasons_json, status, payload_json, created_server_at,
            recovery_status, recovery_expires_at, elderly_name
        ) VALUES (?, 'test', 'CUST-EXP', 'Scam Payee', 20000.0, ?, 90, 'HIGH', '[]', 'ACCIDENTALLY_APPROVED', '{}', ?, 'AVAILABLE', ?, 'Senior Test')""",
        (expired_tx_id, expired_timestamp, expired_timestamp, expired_timestamp)
    )
    con.commit()
    con.close()

    # Attempting to request recovery after 5-minute window must fail with 400 & WINDOW_EXPIRED
    req_exp = client.post(f"/api/events/{expired_tx_id}/request-recovery")
    assert req_exp.status_code == 400, f"Expected 400 Bad Request, got {req_exp.status_code}: {req_exp.data}"
    req_exp_data = req_exp.get_json()
    assert req_exp_data["status"] == "WINDOW_EXPIRED"
    assert "expired" in req_exp_data["error"].lower()
    print("✓ Request recovery after SLA expired rejected with HTTP 400 and marked WINDOW_EXPIRED")

    # Attempting to execute recovery on expired transaction must also fail
    exec_exp = client.post(f"/api/events/{expired_tx_id}/execute-recovery")
    assert exec_exp.status_code == 400
    exec_exp_data = exec_exp.get_json()
    assert exec_exp_data["status"] == "WINDOW_EXPIRED"
    print("✓ Execute recovery after SLA expired rejected with HTTP 400 and marked WINDOW_EXPIRED")

    # ------------------------------------------------------------------
    # 4. Test Geospatial & Impossible Velocity Anomaly in GuardianEngine
    # ------------------------------------------------------------------
    print("\n--- 4. Testing Geospatial & Impossible Velocity Intelligence ---")
    
    import pandas as pd
    history_df = pd.DataFrame([
        {
            "user_id": "CUST-VEL-1",
            "payee": "Local Bandra Store",
            "amount": 500.0,
            "date": pd.Timestamp("2026-11-01 10:00:00+00:00"),
            "origin_lat": 19.0596, # Bandra, Mumbai
            "origin_lon": 72.8295,
        }
    ])
    engine = GuardianEngine(history_df)

    # 15 minutes later, payment initiated from Delhi (1,150 km away) -> velocity ~ 4,600 km/h
    res_vel = engine.score(
        user_id="CUST-VEL-1",
        payee="Unknown Delhi Merchant",
        amount=15000.0,
        created_at="2026-11-01 10:15:00+00:00",
        history_extra=history_df,
        origin_lat=28.6139, # New Delhi
        origin_lon=77.2090,
        origin_city="New Delhi",
        dest_lat=28.6139,
        dest_lon=77.2090,
        dest_city="New Delhi",
        elderly_age=70
    )
    assert res_vel.velocity_kmh is not None
    assert res_vel.velocity_kmh > 850
    assert any("impossible velocity" in r.lower() for r in res_vel.reasons)
    print(f"✓ Impossible Velocity Anomaly detected: {int(res_vel.velocity_kmh):,} km/h speed across 1,150 km in 15 mins")
    print(f"  Flagged Reason: '{[r for r in res_vel.reasons if 'velocity' in r.lower()][0]}'")

    # Clean DB after tests
    client.post("/api/demo/clear")
    print("\n======================================================================")
    print("ALL EXTENDED WORKFLOW TESTS PASSED 100%! ZERO DEFECTS DETECTED")
    print("======================================================================")

if __name__ == "__main__":
    run_extended_tests()
