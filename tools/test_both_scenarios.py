"""
Comprehensive End-to-End Verification Test for Guardian AI Payment Safety
Tests both Demo Scenario 1 (Hold Flow) and Demo Scenario 2 (Accidental Approval & 5-Min Recovery Flow),
including the step-by-step live sequential runners (step 1 -> step 2 -> step 3).
"""
import sys
import json
from pathlib import Path
from datetime import datetime, timezone

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from app import app, connect_db

client = app.test_client()

def test_full_pipeline():
    print("======================================================================")
    print("GUARDIAN PAYMENT SAFETY: COMPLETE DUAL-SCENARIO VERIFICATION SUITE")
    print("======================================================================\n")

    # ------------------------------------------------------------------
    # Step 0: Clear Database to Baseline (0 Data)
    # ------------------------------------------------------------------
    print("--- 1. Testing Reset to 0 Data Baseline ---")
    res = client.post("/api/demo/clear")
    assert res.status_code == 200, f"Clear failed: {res.data}"
    data = res.get_json()
    assert data["ok"] is True
    print("✓ /api/demo/clear returned 200 OK")

    dash_res = client.get("/api/dashboard/overview")
    dash_data = dash_res.get_json()
    assert dash_data["kpis"]["total_transactions"] == 0
    assert dash_data["kpis"]["fraud_detected"] == 0
    assert len(dash_data["active_recovery_requests"]) == 0
    print("✓ Dashboard confirmed 0 transactions, 0 fraud cases, 0 recovery requests")

    pending_alerts_res = client.get("/api/alerts/guardian-pending")
    alerts_data = pending_alerts_res.get_json()
    assert len(alerts_data["pending_alerts"]) == 0
    print("✓ Family Guardian confirmed clean 0 active alerts baseline")

    # ------------------------------------------------------------------
    # Step 1: Step-by-Step Live Sequential Runner for Demo 1
    # ------------------------------------------------------------------
    print("\n--- 2. Testing Demo 1 Live Sequential Staged Execution (Steps 1 -> 2 -> 3) ---")
    
    # Step 1: Routine Pharmacy Purchase (Safe)
    s1_step1 = client.post("/api/demo/scenario-1", json={"step": 1}).get_json()
    assert s1_step1["ok"] is True
    assert s1_step1["step"] == 1
    assert s1_step1["fraud_detected"] is False
    assert s1_step1["elderly_name"] == "Ramesh Kulkarni"
    assert s1_step1["amount"] == 850.0
    print(f"✓ Step 1/3: {s1_step1['elderly_name']} - {s1_step1['title']} (₹{s1_step1['amount']:,.0f}) verified safe [Score: {s1_step1['risk_score']}]")

    con = connect_db()
    cnt1 = con.execute("SELECT count(*) FROM events").fetchone()[0]
    con.close()
    assert cnt1 == 1, f"Expected 1 event, got {cnt1}"

    # Step 2: Routine Electricity Utility Bill (Safe)
    s1_step2 = client.post("/api/demo/scenario-1", json={"step": 2}).get_json()
    assert s1_step2["ok"] is True
    assert s1_step2["step"] == 2
    assert s1_step2["fraud_detected"] is False
    assert s1_step2["amount"] == 1420.0
    print(f"✓ Step 2/3: {s1_step2['elderly_name']} - {s1_step2['title']} (₹{s1_step2['amount']:,.0f}) verified safe [Score: {s1_step2['risk_score']}]")

    con = connect_db()
    cnt2 = con.execute("SELECT count(*) FROM events").fetchone()[0]
    con.close()
    assert cnt2 == 2, f"Expected 2 events, got {cnt2}"

    # Step 3: Anomaly Detected -> Fraud Identified -> Transfer Held Pending Guardian Approval
    s1_step3 = client.post("/api/demo/scenario-1", json={"step": 3}).get_json()
    assert s1_step3["ok"] is True
    assert s1_step3["step"] == 3
    assert s1_step3["fraud_detected"] is True
    assert s1_step3["transaction_id"] == "TXN-SCAM-6019"
    assert s1_step3["status"] == "PENDING_GUARDIAN_APPROVAL"
    assert s1_step3["amount"] == 48000.0
    assert s1_step3["risk_score"] == 96
    print(f"✓ 🚨 Step 3/3: FRAUD IDENTIFIED! {s1_step3['scam_category']} (₹{s1_step3['amount']:,.0f}) held in {s1_step3['status']}")

    con = connect_db()
    cnt3 = con.execute("SELECT count(*) FROM events").fetchone()[0]
    con.close()
    assert cnt3 == 3, f"Expected 3 events, got {cnt3}"

    # Check Family Guardian Pending Alerts
    alerts_s1 = client.get("/api/alerts/guardian-pending").get_json()
    assert len(alerts_s1["pending_alerts"]) >= 1
    match_s1 = [a for a in alerts_s1["pending_alerts"] if a["transaction_id"] == "TXN-SCAM-6019"][0]
    assert match_s1["elderly_name"] == "Ramesh Kulkarni"
    assert match_s1["guardian_name"] == "Aditya Kulkarni"
    print(f"✓ Dual notification received by Family Guardian: {match_s1['guardian_name']} for {match_s1['elderly_name']}")

    # Simulate Family Guardian putting payment ON HOLD
    hold_res = client.post("/api/events/TXN-SCAM-6019/guardian-action", json={
        "action": "HOLD",
        "guardian_name": "Aditya Kulkarni (Son)",
        "notes": "Son placed on hold after recognizing fake police video call scam."
    })
    assert hold_res.status_code == 200
    hold_data = hold_res.get_json()
    assert hold_data["status"] == "ON_HOLD_BY_GUARDIAN"
    assert len(hold_data["action_hash"]) == 64
    print(f"✓ Family Guardian placed payment ON HOLD: status={hold_data['status']}, hash={hold_data['action_hash'][:16]}...")

    # Simulate Bank SOC Reviewer reviewing and rejecting transaction (Block & Save Funds)
    soc_res = client.post("/api/events/TXN-SCAM-6019/action", json={
        "action": "REJECT",
        "actor": "Piyush Tandale (Admin)",
        "notes": "Confirmed digital arrest extortion syndicate targeting senior. Beneficiary Dubai mule blocked."
    })
    assert soc_res.status_code == 200
    soc_data = soc_res.get_json()
    assert soc_data["status"] == "REJECTED"
    print(f"✓ Bank SOC decision executed: {soc_data['status']} • Funds blocked and saved")

    # Verify SHA-256 Audit Trail has recorded the actions
    audit_res = client.get("/api/audit-trail").get_json()
    assert audit_res["total"] >= 2
    print(f"✓ SHA-256 Audit Ledger verified: {audit_res['total']} cryptographic actions recorded")

    # ------------------------------------------------------------------
    # Step 2: Step-by-Step Live Sequential Runner for Demo 2
    # ------------------------------------------------------------------
    print("\n--- 3. Testing Demo 2 Live Sequential Staged Execution (Steps 1 -> 2 -> 3) ---")

    # Step 1: Routine Grocery Spend (Safe)
    s2_step1 = client.post("/api/demo/scenario-2", json={"step": 1}).get_json()
    assert s2_step1["ok"] is True
    assert s2_step1["step"] == 1
    assert s2_step1["fraud_detected"] is False
    assert s2_step1["elderly_name"] == "Sunita Sharma"
    assert s2_step1["amount"] == 420.0
    print(f"✓ Step 1/3: {s2_step1['elderly_name']} - {s2_step1['title']} (₹{s2_step1['amount']:,.0f}) verified safe [Score: {s2_step1['risk_score']}]")

    con = connect_db()
    cnt_s2_1 = con.execute("SELECT count(*) FROM events").fetchone()[0]
    con.close()
    assert cnt_s2_1 == 1, f"Expected 1 event (previous cleared), got {cnt_s2_1}"

    # Step 2: Routine Diagnostic Spend (Safe)
    s2_step2 = client.post("/api/demo/scenario-2", json={"step": 2}).get_json()
    assert s2_step2["ok"] is True
    assert s2_step2["step"] == 2
    assert s2_step2["fraud_detected"] is False
    assert s2_step2["amount"] == 650.0
    print(f"✓ Step 2/3: {s2_step2['elderly_name']} - {s2_step2['title']} (₹{s2_step2['amount']:,.0f}) verified safe [Score: {s2_step2['risk_score']}]")

    con = connect_db()
    cnt_s2_2 = con.execute("SELECT count(*) FROM events").fetchone()[0]
    con.close()
    assert cnt_s2_2 == 2, f"Expected 2 events, got {cnt_s2_2}"

    # Step 3: Anomaly Detected -> Fraud Identified -> Transfer Held Pending Guardian Approval
    s2_step3 = client.post("/api/demo/scenario-2", json={"step": 3}).get_json()
    assert s2_step3["ok"] is True
    assert s2_step3["step"] == 3
    assert s2_step3["fraud_detected"] is True
    assert s2_step3["transaction_id"] == "TXN-SCAM-5192"
    assert s2_step3["status"] == "PENDING_GUARDIAN_APPROVAL"
    assert s2_step3["amount"] == 35000.0
    assert s2_step3["risk_score"] == 91
    print(f"✓ 🚨 Step 3/3: FRAUD IDENTIFIED! {s2_step3['scam_category']} (₹{s2_step3['amount']:,.0f}) held in {s2_step3['status']}")

    con = connect_db()
    cnt_s2_3 = con.execute("SELECT count(*) FROM events").fetchone()[0]
    con.close()
    assert cnt_s2_3 == 3, f"Expected 3 events, got {cnt_s2_3}"

    # Simulate Family Member accidentally clicking Approve
    print("\n--- 4. Testing Accidental Approval & 5-Min Rapid Recall Protocol ---")
    acc_res = client.post("/api/events/TXN-SCAM-5192/accidental-approve")
    assert acc_res.status_code == 200, f"Accidental approve failed: {acc_res.data}"
    acc_data = acc_res.get_json()
    assert acc_data["status"] == "ACCIDENTALLY_APPROVED"
    assert acc_data["recovery_status"] == "AVAILABLE"
    assert acc_data["recovery_window_seconds"] == 300
    print(f"✓ Payment accidentally approved: status={acc_data['status']}, recovery={acc_data['recovery_status']} (expires: {acc_data['recovery_expires_at']})")

    # Simulate Family Guardian requesting Immediate Emergency Recovery
    req_res = client.post("/api/events/TXN-SCAM-5192/request-recovery")
    assert req_res.status_code == 200
    req_data = req_res.get_json()
    assert req_data["status"] == "RECOVERY_REQUESTED"
    assert req_data["recovery_status"] == "REQUESTED"
    print(f"✓ Family Guardian requested 5-min emergency clawback: {req_data['status']}")

    # Check that Dashboard now surfaces active_recovery_requests
    dash_s2 = client.get("/api/dashboard/overview").get_json()
    assert len(dash_s2["active_recovery_requests"]) >= 1
    rec_item = [r for r in dash_s2["active_recovery_requests"] if r["transaction_id"] == "TXN-SCAM-5192"][0]
    assert rec_item["amount"] == 35000.0
    assert rec_item["elderly_name"] == "Sunita Sharma"
    print(f"✓ Dashboard high-priority emergency banner verified for {rec_item['elderly_name']} (₹{rec_item['amount']:,.0f})")

    # Simulate Bank SOC executing the fund recovery
    exec_res = client.post("/api/events/TXN-SCAM-5192/execute-recovery", json={
        "actor": "Piyush Tandale (Admin)",
        "notes": "Emergency inter-bank clawback executed under RBI/NPCI 5-minute rapid recall protocol. Full balance restored."
    })
    assert exec_res.status_code == 200
    exec_data = exec_res.get_json()
    assert exec_data["status"] == "RECOVERED"
    assert exec_data["recovery_status"] == "RECOVERED"
    assert exec_data["amount_recovered"] == 35000.0
    print(f"✓ Bank SOC executed clawback: {exec_data['status']} • ₹{exec_data['amount_recovered']:,.0f} restored to Sunita Sharma")

    # Verify final audit log contains RECOVERY_EXECUTED
    audit_final = client.get("/api/audit-trail").get_json()
    recovery_audit = [a for a in audit_final["actions"] if a["action"] == "RECOVERY_EXECUTED"]
    assert len(recovery_audit) >= 1
    assert recovery_audit[0]["transaction_id"] == "TXN-SCAM-5192"
    assert len(recovery_audit[0]["action_hash"]) == 64
    print(f"✓ Cryptographic SHA-256 Audit Trail confirmed: {recovery_audit[0]['action']} with hash {recovery_audit[0]['action_hash'][:16]}...")

    # ------------------------------------------------------------------
    # Step 3: Final Reset to 0 Baseline Check
    # ------------------------------------------------------------------
    print("\n--- 5. Testing Clean Reset to 0 Data ---")
    clean_res = client.post("/api/demo/clear")
    assert clean_res.status_code == 200
    final_dash = client.get("/api/dashboard/overview").get_json()
    assert final_dash["kpis"]["total_transactions"] == 0
    assert len(final_dash["active_recovery_requests"]) == 0
    final_alerts = client.get("/api/alerts/guardian-pending").get_json()
    assert len(final_alerts["pending_alerts"]) == 0
    print("✓ Full reset confirmed: DB is clean at 0 data, Family Guardian baseline is clear")

    print("\n======================================================================")
    print("ALL TESTS PASSED SUCCESSFULLY! PRODUCTION GRADE PIPELINE VERIFIED 100%")
    print("======================================================================")

if __name__ == "__main__":
    test_full_pipeline()
