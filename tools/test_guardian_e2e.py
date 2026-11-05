"""
Guardian End-to-End Automated Test Suite — Elderly Payment Safety Focus
Verifies:
1. Zero initial data baseline (no transactions until demo scenario starts).
2. Live streaming of elderly payment transactions one by one (Steps 1 through 6).
3. Pattern recognition: safe transactions vs. critical scam categories (Digital Arrest, Phishing, Lottery, Extortion).
4. Dual Alert dispatch: Company Security SOC alert + Family Guardian alert.
5. Family Guardian "Keep Payment on Hold" emergency action.
6. Company Security decision power: Approve or Reject & Block payment with Audit Trail SHA-256 ledger.
7. Satellite route mapping with origin GPS, destination GPS, and geofence status.
"""

import sys
import json
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE))

# UTF-8 stdout configuration for safe Rupee and emoji output
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

from app import app, connect_db


def run_tests():
    print("=" * 70)
    print("GUARDIAN — ELDERLY PAYMENT SAFETY VERIFICATION SUITE")
    print("=" * 70)

    client = app.test_client()
    passed = 0
    total = 0

    def test(name, condition, details=""):
        nonlocal passed, total
        total += 1
        if condition:
            passed += 1
            print(f" [PASS] {name} {details}")
        else:
            print(f"![FAIL] {name} {details}")

    # Step 1: Health & System Status
    r = client.get("/api/health")
    test("Health Check (GET /api/health)", r.status_code == 200 and r.json.get("ok"), f"Version: {r.json.get('version')}")

    # Step 2: Zero initial data baseline
    r_clear = client.post("/api/demo/clear")
    test("Clear Database to 0 (POST /api/demo/clear)", r_clear.status_code == 200 and r_clear.json.get("ok"))

    r_dash_zero = client.get("/api/dashboard/overview")
    kpis_zero = r_dash_zero.json.get("kpis", {})
    test(
        "Zero-Data Dashboard Overview",
        kpis_zero.get("total_transactions") == 0 and kpis_zero.get("fraud_detected") == 0 and len(r_dash_zero.json.get("recent_transactions", [])) == 0,
        f"Total: {kpis_zero.get('total_transactions')}, Fraud: {kpis_zero.get('fraud_detected')}"
    )

    r_mon_zero = client.get("/api/monitoring/transactions")
    test(
        "Zero-Data Fraud Monitoring",
        r_mon_zero.json.get("total") == 0 and len(r_mon_zero.json.get("transactions", [])) == 0,
        f"Queue Count: {r_mon_zero.json.get('total')}"
    )

    r_analytics_zero = client.get("/api/analytics")
    test(
        "Zero-Data Risk Analytics",
        r_analytics_zero.json.get("kpis", {}).get("total_fraud_cases") == 0,
        f"Fraud Cases: {r_analytics_zero.json.get('kpis', {}).get('total_fraud_cases')}"
    )

    # Step 3: Verify Scenario Definitions (GET /api/demo/scenarios)
    r_scenarios = client.get("/api/demo/scenarios")
    scenarios_data = r_scenarios.json
    test(
        "Scenario Definitions (GET /api/demo/scenarios)",
        r_scenarios.status_code == 200 and scenarios_data.get("total_steps") == 6,
        f"Total Steps: {scenarios_data.get('total_steps')}"
    )

    # Step 4: Stream Transaction 1 (Ramesh, 68 - Safe Pharmacy Spend)
    r_step1 = client.post("/api/demo/emit-step", json={"step_index": 1})
    s1 = r_step1.json
    test(
        "Stream Step 1: Safe Medicine Spend (Ramesh, 68)",
        s1.get("ok") and s1.get("risk_level") == "LOW" and s1.get("status") == "CLEAR",
        f"Tx: {s1.get('transaction_id')}, Risk: {s1.get('risk_score')}/100"
    )

    # Step 5: Stream Transaction 2 (Sunita, 64 - Electricity Bill)
    r_step2 = client.post("/api/demo/emit-step", json={"step_index": 2})
    s2 = r_step2.json
    test(
        "Stream Step 2: Utility Bill (Sunita, 64)",
        s2.get("ok") and s2.get("risk_level") == "LOW",
        f"Tx: {s2.get('transaction_id')}, Payee: {s2.get('elderly_name')}"
    )

    # Step 6: Stream Transaction 3 (Vijay, 72 - Power-cut Phishing Scam)
    r_step3 = client.post("/api/demo/emit-step", json={"step_index": 3})
    s3 = r_step3.json
    test(
        "Stream Step 3: Phishing Scam (Vijay, 72)",
        s3.get("ok") and s3.get("risk_level") == "HIGH" and len(s3.get("alerts", [])) == 2,
        f"Dual Alerts: {len(s3.get('alerts', []))}, Score: {s3.get('risk_score')}/100"
    )

    # Step 7: Stream Transaction 4 (Ramesh, 68 - Courier Extortion)
    r_step4 = client.post("/api/demo/emit-step", json={"step_index": 4})
    s4 = r_step4.json
    test(
        "Stream Step 4: Courier Extortion (Ramesh, 68)",
        s4.get("ok") and s4.get("risk_level") == "MEDIUM",
        f"Tx: {s4.get('transaction_id')}, Threat: {s4.get('scam_category')}"
    )

    # Step 8: Stream Transaction 5 (Sunita, 64 - Foreign Lottery Fraud)
    r_step5 = client.post("/api/demo/emit-step", json={"step_index": 5})
    s5 = r_step5.json
    test(
        "Stream Step 5: Lottery Fraud (Sunita, 64)",
        s5.get("ok") and s5.get("risk_level") == "HIGH",
        f"Tx: {s5.get('transaction_id')}, Score: {s5.get('risk_score')}/100"
    )

    # Step 9: Stream Transaction 6 (Ramesh, 68 - Critical Digital Arrest Police Scam)
    r_step6 = client.post("/api/demo/emit-step", json={"step_index": 6})
    s6 = r_step6.json
    critical_tx = s6.get("transaction_id")
    test(
        "Stream Step 6: Digital Arrest Scam (Ramesh, 68)",
        s6.get("ok") and s6.get("risk_score") >= 90 and len(s6.get("alerts", [])) == 2,
        f"Tx: {critical_tx}, Score: {s6.get('risk_score')}/100, AI: {s6.get('scam_category')}"
    )

    # Step 10: Dual Alerts Verification (Company + Family Guardian)
    r_alerts = client.get("/api/alerts/guardian-pending")
    guardian_alerts = r_alerts.json.get("pending_alerts", [])
    test(
        "Dual Alert: Family Guardian Inbox",
        len(guardian_alerts) >= 3 and any(a.get("guardian_name") == "Aditya Kulkarni" for a in guardian_alerts),
        f"Pending Family Alerts: {len(guardian_alerts)}"
    )

    # Step 11: Family Guardian Emergency Hold Action
    r_hold = client.post(
        f"/api/events/{critical_tx}/guardian-action",
        json={
            "action": "HOLD",
            "guardian_name": "Aditya Kulkarni (Son)",
            "notes": "Emergency hold triggered by son Aditya: Father Ramesh in fake police digital arrest call!"
        }
    )
    hold_data = r_hold.json
    test(
        "Family Guardian Hold Action (POST /api/events/<id>/guardian-action)",
        hold_data.get("ok") and hold_data.get("status") == "ON_HOLD_BY_GUARDIAN" and len(hold_data.get("action_hash", "")) == 64,
        f"Status: {hold_data.get('status')}, Hash: {hold_data.get('action_hash')[:16]}..."
    )

    # Step 12: Verify Transaction Detail shows Guardian Hold Banner & Satellite Route
    r_detail = client.get(f"/api/monitoring/transaction/{critical_tx}")
    detail = r_detail.json
    geo_route = detail.get("geo_route", {})
    test(
        "Transaction Detail Telemetry & Guardian Status",
        detail.get("status") == "ON_HOLD_BY_GUARDIAN" and detail.get("elderly_name") == "Ramesh Kulkarni" and geo_route.get("geofence_status") == "CRITICAL",
        f"Origin: {geo_route.get('origin', {}).get('city')} -> Dest: {geo_route.get('destination', {}).get('city')} ({geo_route.get('distance_km')} km)"
    )

    # Step 13: Company / Bank Security Review Decision (Reject & Block to Protect Senior Funds)
    r_company_decision = client.post(
        f"/api/events/{critical_tx}/action",
        json={
            "action": "REJECT",
            "actor": "Piyush Tandale (Bank Reviewer)",
            "notes": "Payment blocked and rejected following family guardian hold. Senior citizen funds secured."
        }
    )
    decision_data = r_company_decision.json
    test(
        "Company Decision: Reject & Block Payment (POST /api/events/<id>/action)",
        decision_data.get("ok") and decision_data.get("status") == "REJECTED" and len(decision_data.get("action_hash", "")) == 64,
        f"New Status: {decision_data.get('status')}, Hash: {decision_data.get('action_hash')[:16]}..."
    )

    # Step 14: Audit Trail Integrity & Verification
    r_audit = client.get("/api/audit-trail")
    audit_data = r_audit.json
    actions_list = audit_data.get("actions", [])
    test(
        "Audit Trail Verification (GET /api/audit-trail)",
        len(actions_list) >= 2 and any("GUARDIAN_HOLD" in a.get("action", "") for a in actions_list) and any(a.get("action") == "REJECT" for a in actions_list),
        f"Logged actions: {len(actions_list)}, Protected amount: ₹{audit_data.get('summary', {}).get('rejected_amount', 0):,.0f}"
    )

    # Step 15: Audit Trail CSV Export
    r_export = client.get("/api/audit-trail/export")
    test(
        "Audit Trail CSV Export (GET /api/audit-trail/export)",
        r_export.status_code == 200 and b"Integrity Hash (SHA-256)" in r_export.data,
        f"Exported: {len(r_export.data)} bytes"
    )

    # Step 16: Updated Dashboard Overview with Streamed Data
    r_dash_updated = client.get("/api/dashboard/overview")
    dash_kpis = r_dash_updated.json.get("kpis", {})
    test(
        "Live Dashboard Metrics Updated",
        dash_kpis.get("total_transactions") == 6 and dash_kpis.get("fraud_detected") == 4 and len(r_dash_updated.json.get("recent_transactions", [])) == 6,
        f"Total: {dash_kpis.get('total_transactions')}, Flagged: {dash_kpis.get('fraud_detected')}, Protected: {dash_kpis.get('protected_amount')}"
    )

    # Step 17: Reports Generation
    r_rep = client.post("/api/reports/generate", json={"report_type": "Elderly Fraud Analysis", "format": "PDF", "date_range": "Live Simulation Session"})
    test("Elderly Fraud Report Generation (POST /api/reports/generate)", r_rep.json.get("ok") and "report_id" in r_rep.json, f"Report ID: {r_rep.json.get('report_id')}")

    print("=" * 70)
    print(f"RESULTS: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    print("=" * 70)

    if passed == total:
        print("ALL TESTS PASSED! ELDERLY PAYMENT SAFETY ARCHITECTURE FULLY OPERATIONAL.")
        return 0
    else:
        print("SOME TESTS FAILED.")
        return 1


if __name__ == "__main__":
    sys.exit(run_tests())
