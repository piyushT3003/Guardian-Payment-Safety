from __future__ import annotations

import hashlib
import hmac
import json
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd
from flask import Flask, jsonify, render_template, request

from guardian_engine import GuardianEngine

BASE = Path(__file__).resolve().parent
DATA = BASE / "data"
DB_PATH = Path(os.environ.get("GUARDIAN_DB_PATH", str(BASE / "guardian.db")))
WEBHOOK_SECRET = os.environ.get("RAZORPAY_WEBHOOK_SECRET", "guardian_demo_secret")
MAX_UPLOAD_MB = 10

app = Flask(__name__, template_folder=str(BASE / "templates"))
app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_MB * 1024 * 1024


def connect_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    return con


def init_db():
    con = connect_db()
    con.executescript(
        """
        CREATE TABLE IF NOT EXISTS events (
            transaction_id TEXT PRIMARY KEY,
            source TEXT NOT NULL,
            user_id TEXT NOT NULL,
            payee TEXT NOT NULL,
            amount REAL NOT NULL,
            created_at TEXT NOT NULL,
            risk_score INTEGER NOT NULL,
            risk_level TEXT NOT NULL,
            reasons_json TEXT NOT NULL,
            status TEXT NOT NULL,
            payload_json TEXT NOT NULL,
            created_server_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS actions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            transaction_id TEXT NOT NULL,
            action TEXT NOT NULL,
            actor TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS uploads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT,
            uploaded_at TEXT,
            rows INTEGER,
            users INTEGER,
            high_risk INTEGER,
            medium_risk INTEGER,
            low_risk INTEGER
        );
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            transaction_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            alert_type TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'SENT',
            created_at TEXT NOT NULL,
            UNIQUE(transaction_id, alert_type)
        );
        """
    )
    con.commit()
    con.close()


def load_base_transactions():
    return pd.read_csv(DATA / "guardian_transactions.csv")


def load_engine():
    """Load the current Guardian engine using its actual one-argument API."""
    txns = load_base_transactions()

    con = connect_db()
    rows = con.execute(
        """SELECT transaction_id,user_id,payee,amount,created_at
           FROM events
           WHERE status != 'REJECTED'
           ORDER BY created_server_at"""
    ).fetchall()
    con.close()

    if rows:
        extra = pd.DataFrame([dict(r) for r in rows])
        extra["date"] = pd.to_datetime(extra["created_at"], errors="coerce", utc=True)
        extra["user_id"] = pd.to_numeric(extra["user_id"], errors="coerce")
        extra["amount"] = pd.to_numeric(extra["amount"], errors="coerce")
        extra = extra.dropna(subset=["user_id", "amount", "date"])
        extra["user_id"] = extra["user_id"].astype(int)
        extra["is_scam"] = False
        extra = extra[["transaction_id", "user_id", "payee", "amount", "date", "is_scam"]]
        txns = pd.concat([txns, extra], ignore_index=True)

    return GuardianEngine(txns)


def _result_signals(result):
    """Return dashboard-safe signals from both current and legacy RiskResult objects."""
    signals = getattr(result, "signals", None)
    if signals is not None:
        return dict(signals)
    return {
        "new_payee": bool(getattr(result, "new_payee", False)),
        "recent_payment_count": int(getattr(result, "burst_count", 0) or 0),
        "burst_detected": bool(getattr(result, "burst_count", 0) or 0),
        "amount_anomaly": bool(getattr(result, "unusual_amount", False)),
        "amount_jump_ratio": None,
        "ai_anomaly": bool(getattr(result, "ai_anomaly", False)),
        "ai_score": getattr(result, "ai_score", None),
        "amount": float(getattr(result, "amount", 0) or 0),
    }


def make_result_dict(result, transaction_id, user_id, payee, amount, created_at, status=None):
    if status is None:
        status = "PENDING_REVIEW" if result.recommended_action == "HOLD_FOR_REVIEW" else "CLEAR"
    signals = _result_signals(result)
    signals["amount"] = float(amount)
    return {
        "transaction_id": str(transaction_id),
        "user_id": str(user_id),
        "payee": str(payee),
        "amount": float(amount),
        "created_at": pd.to_datetime(created_at, utc=True).isoformat(),
        "risk_score": int(result.risk_score),
        "risk_level": result.risk_level,
        "reasons": list(result.reasons),
        "signals": signals,
        "recommended_action": result.recommended_action,
        "status": status,
    }


def record_result(result_data, source, payload):
    con = connect_db()
    server_time = datetime.now(timezone.utc).isoformat()
    con.execute(
        """INSERT OR REPLACE INTO events
        (transaction_id,source,user_id,payee,amount,created_at,risk_score,risk_level,
         reasons_json,status,payload_json,created_server_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
        (
            result_data["transaction_id"],
            source,
            result_data["user_id"],
            result_data["payee"],
            result_data["amount"],
            result_data["created_at"],
            result_data["risk_score"],
            result_data["risk_level"],
            json.dumps(result_data["reasons"]),
            result_data["status"],
            json.dumps(payload or {}),
            server_time,
        ),
    )
    con.commit()
    con.close()
    create_high_risk_alerts(result_data)


def create_high_risk_alerts(result_data):
    """Create local demo alerts for high-risk events. No external notification API is used."""
    if result_data.get("risk_level") != "HIGH":
        return []

    txid = result_data["transaction_id"]
    uid = result_data["user_id"]
    amount = result_data["amount"]
    score = result_data["risk_score"]
    reasons = result_data.get("reasons") or []
    reason_text = " ".join(reasons)
    if not reason_text:
        reason_text = "Guardian detected a high-risk payment pattern."
    message = (
        f"Potentially risky payment of ₹{amount:,.0f} detected for customer {uid}. "
        f"Risk {score}/100. {reason_text}"
    )
    now = datetime.now(timezone.utc).isoformat()
    alert_defs = [
        ("COMPANY_SECURITY", "Company Security Alert", message),
        ("TRUSTED_FAMILY", "Trusted Family Alert", message),
    ]
    con = connect_db()
    created = []
    for alert_type, title, body in alert_defs:
        cur = con.execute(
            "INSERT OR IGNORE INTO alerts(transaction_id,user_id,alert_type,title,message,status,created_at) VALUES(?,?,?,?,?,?,?)",
            (txid, str(uid), alert_type, title, body, "SENT", now),
        )
        if cur.rowcount:
            created.append(alert_type)
    con.commit()
    con.close()
    return created


def alert_rows(limit=100):
    con = connect_db()
    rows = [dict(r) for r in con.execute(
        "SELECT * FROM alerts ORDER BY created_at DESC LIMIT ?", (limit,)
    )]
    con.close()
    return rows


def ai_review(result_data):
    """Deterministic local review assistant; intentionally no paid LLM dependency."""
    score = int(result_data.get("risk_score", 0))
    level = result_data.get("risk_level", "LOW")
    signals = result_data.get("signals") or {}
    reasons = [str(x) for x in (result_data.get("reasons") or [])]
    parts = []
    if signals.get("new_payee"):
        parts.append("a new recipient")
    if signals.get("burst_detected"):
        parts.append("rapid repeated payments")
    if signals.get("amount_anomaly"):
        parts.append("an unusual payment amount")
    if signals.get("ai_anomaly"):
        parts.append("a behavioral anomaly")
    if len(parts) >= 2:
        pattern = "The combination of " + ", ".join(parts[:-1]) + " and " + parts[-1] + " is inconsistent with the customer's established payment behavior."
    elif parts:
        pattern = "Guardian identified " + parts[0] + " that warrants attention."
    else:
        pattern = "No strong behavioral signal was identified."

    if level == "HIGH":
        assessment = "HIGH RISK"
        recommendation = "Keep in review and verify the payment with the customer."
        confidence = "High" if score >= 85 else "Medium-High"
    elif level == "MEDIUM":
        assessment = "MEDIUM RISK"
        recommendation = "Use step-up verification before allowing the payment."
        confidence = "Medium"
    else:
        assessment = "LOW RISK"
        recommendation = "Allow under normal monitoring."
        confidence = "Low-Medium"
    return {
        "assessment": assessment,
        "summary": pattern,
        "recommendation": recommendation,
        "confidence": confidence,
        "reasons": reasons,
    }


def verify_signature(raw_body: bytes, signature: str | None):
    expected = hmac.new(WEBHOOK_SECRET.encode(), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature or "")


def event_rows(limit=100):
    con = connect_db()
    rows = [dict(r) for r in con.execute(
        "SELECT * FROM events ORDER BY created_server_at DESC LIMIT ?", (limit,)
    )]
    con.close()
    for row in rows:
        row["reasons"] = json.loads(row.pop("reasons_json"))
        row.pop("payload_json", None)
    return rows


# -----------------------------
# CSV upload
# -----------------------------

COLUMN_ALIASES = {
    "transaction_id": ["transaction_id", "transactionid", "txn_id", "tx_id", "id", "payment_id"],
    "user_id": ["user_id", "userid", "customer_id", "customerid", "account_id", "accountid", "user", "customer"],
    "payee": ["payee", "recipient", "recipient_id", "recipientid", "beneficiary", "beneficiary_id", "vendor", "merchant", "counterparty"],
    "amount": ["amount", "amount_inr", "amount_rupees", "value", "transaction_amount", "txn_amount"],
    "date": ["date", "timestamp", "created_at", "createdat", "datetime", "transaction_time", "time"],
}


def _norm(name):
    return "".join(ch.lower() for ch in str(name).strip() if ch.isalnum())


def detect_columns(columns):
    normalized = {_norm(c): c for c in columns}
    mapping = {}
    for target, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            key = _norm(alias)
            if key in normalized:
                mapping[target] = normalized[key]
                break
    return mapping


def validate_and_normalize_upload(file, mapping=None):
    if not file or not file.filename:
        raise ValueError("Please choose a CSV file.")
    if not file.filename.lower().endswith(".csv"):
        raise ValueError("Only CSV files are supported.")

    df = pd.read_csv(file)
    if df.empty:
        raise ValueError("The CSV file is empty.")

    detected = detect_columns(df.columns)
    mapping = mapping or {}
    for target in COLUMN_ALIASES:
        if mapping.get(target) in df.columns:
            detected[target] = mapping[target]

    required = ["user_id", "payee", "amount", "date"]
    missing = [x for x in required if x not in detected]
    if missing:
        raise ValueError(
            "Guardian could not identify: " + ", ".join(missing) + ". "
            "Required fields are user/customer, recipient/payee, amount, and timestamp/date."
        )

    out = pd.DataFrame()
    out["user_id"] = df[detected["user_id"]].astype(str).str.strip()
    out["payee"] = df[detected["payee"]].astype(str).str.strip()
    out["amount"] = pd.to_numeric(df[detected["amount"]], errors="coerce")
    out["date"] = pd.to_datetime(df[detected["date"]], errors="coerce", utc=True)

    if "transaction_id" in detected:
        out["transaction_id"] = df[detected["transaction_id"]].astype(str).str.strip()
    else:
        out["transaction_id"] = [f"upload-{i+1}" for i in range(len(out))]

    invalid = (
        out["user_id"].eq("")
        | out["payee"].eq("")
        | out["amount"].isna()
        | out["date"].isna()
    )
    if invalid.any():
        raise ValueError(
            f"{int(invalid.sum())} row(s) contain missing or invalid user, recipient, amount, or timestamp values."
        )

    if (out["amount"] < 0).any():
        raise ValueError("Amounts must be zero or greater.")

    out = out.sort_values("date").reset_index(drop=True)
    return out, detected


def analyze_uploaded_dataset(df):
    """Fast chronological CSV analysis using the same Guardian scoring logic.

    The IsolationForest models are trained once on an initial per-user baseline.
    Transaction history is maintained with lightweight Python structures instead
    of repeatedly concatenating pandas DataFrames for every uploaded row.
    """
    import bisect
    from collections import defaultdict, deque

    work = df.sort_values(["date", "user_id"]).reset_index(drop=True).copy()
    results = []

    # First 10 transactions per user establish the behavioral baseline.
    baseline_idx = []
    seen = defaultdict(int)
    for idx, row in work.iterrows():
        uid = str(row["user_id"])
        if seen[uid] < 10:
            baseline_idx.append(idx)
            seen[uid] += 1

    baseline = work.loc[baseline_idx].copy()
    scored = work.drop(index=baseline_idx).sort_values("date")

    # Train the user's IsolationForest models once, using only baseline history.
    engine = GuardianEngine(baseline[["user_id", "payee", "amount", "date"]].copy())

    # Append-friendly behavioral history.
    payees = defaultdict(set)
    amounts = defaultdict(list)
    recent = defaultdict(lambda: defaultdict(deque))

    for _, row in baseline.sort_values("date").iterrows():
        uid = str(row["user_id"])
        payee = str(row["payee"])
        payees[uid].add(payee.lower())
        amounts[uid].append(float(row["amount"]))
        recent[uid][payee.lower()].append(row["date"])

        results.append(make_result_dict(
            type("BaselineResult", (), {
                "risk_score": 0,
                "risk_level": "LOW",
                "reasons": [],
                "signals": {"baseline": True, "amount": float(row["amount"])},
                "recommended_action": "ALLOW",
            })(),
            row["transaction_id"], row["user_id"], row["payee"],
            row["amount"], row["date"], "CLEAR",
        ))

    for _, row in scored.iterrows():
        uid = str(row["user_id"])
        payee = str(row["payee"])
        payee_key = payee.lower()
        amount = float(row["amount"])
        created_at = pd.to_datetime(row["date"], utc=True)

        new_payee = payee_key not in payees[uid]

        # Keep only prior payments to this payee inside the 60-minute window.
        q = recent[uid][payee_key]
        cutoff = created_at - pd.Timedelta(minutes=GuardianEngine.BURST_WINDOW_MINUTES)
        while q and q[0] < cutoff:
            q.popleft()
        burst_count = sum(1 for t in q if t < created_at)

        # Personalized anomaly model, trained once on baseline history.
        # Preserve string IDs for company datasets such as CUST-001, while
        # remaining compatible with numeric synthetic user IDs.
        user_key = next((k for k in engine.models if str(k) == str(uid)), uid)
        model = engine.models.get(user_key)
        anomalous = False
        if model is not None:
            import numpy as np
            # The engine trains IsolationForest on raw rupee amounts, so score
            # uploads in the same feature space.
            anomalous = bool(model.predict(np.array([[amount]], dtype=float))[0] == -1)

        history_amounts = amounts[uid]
        if history_amounts:
            median_amount = float(pd.Series(history_amounts).median())
            if not anomalous and median_amount > 0:
                anomalous = amount >= median_amount * 5
            jump_ratio = round(amount / median_amount, 2) if median_amount > 0 else 0.0
        else:
            jump_ratio = 0.0

        score = 0
        reasons = []
        if new_payee:
            score += 25
            reasons.append("Payment is going to a new recipient.")
        if burst_count > 0:
            score += 40
            reasons.append(
                f"{burst_count} previous payment(s) to the same recipient occurred within "
                f"{GuardianEngine.BURST_WINDOW_MINUTES} minutes."
            )
        if anomalous:
            score += 40
            reasons.append("The payment is unusually large compared with the user's normal transaction amount.")

        score = min(int(score), 100)
        if burst_count > 0 and anomalous:
            score = max(score, 85)
            reasons.append(
                "The combination of rapid repeated payments and an unusually large amount "
                "matches a high-risk payment sequence."
            )

        if score >= GuardianEngine.HIGH_RISK_THRESHOLD:
            level, action, status = "HIGH", "HOLD_FOR_REVIEW", "PENDING_REVIEW"
        elif score >= GuardianEngine.MEDIUM_RISK_THRESHOLD:
            level, action, status = "MEDIUM", "STEP_UP_REVIEW", "CLEAR"
        else:
            level, action, status = "LOW", "ALLOW", "CLEAR"

        result_obj = type("UploadResult", (), {
            "risk_score": score,
            "risk_level": level,
            "reasons": reasons,
            "signals": {
                "new_payee": bool(new_payee),
                "recent_payment_count": int(burst_count),
                "burst_detected": bool(burst_count > 0),
                "amount_anomaly": bool(anomalous),
                "amount_jump_ratio": float(jump_ratio),
                "amount": amount,
            },
            "recommended_action": action,
        })()

        results.append(make_result_dict(
            result_obj, row["transaction_id"], row["user_id"], row["payee"],
            amount, created_at, status,
        ))

        payees[uid].add(payee_key)
        amounts[uid].append(amount)
        q.append(created_at)

    return sorted(results, key=lambda item: item["created_at"])


@app.get("/")
def home():
    return render_template("dashboard.html")


@app.get("/api/health")
def health():
    return jsonify({"ok": True, "service": "guardian"})


@app.get("/api/events")
def events():
    return jsonify(event_rows())


@app.get("/api/stats")
def stats():
    rows = event_rows(1000)
    alerts = alert_rows(1000)
    return jsonify({
        "total": len(rows),
        "high": sum(r["risk_level"] == "HIGH" for r in rows),
        "pending": sum(r["status"] == "PENDING_REVIEW" for r in rows),
        "approved": sum(r["status"] == "APPROVED" for r in rows),
        "rejected": sum(r["status"] == "REJECTED" for r in rows),
        "clear": sum(r["status"] == "CLEAR" for r in rows),
        "family_alerts": sum(a["alert_type"] == "TRUSTED_FAMILY" for a in alerts),
        "company_alerts": sum(a["alert_type"] == "COMPANY_SECURITY" for a in alerts),
    })


@app.get("/api/alerts")
def alerts():
    return jsonify(alert_rows())


@app.get("/api/review/<transaction_id>")
def review_assistant(transaction_id):
    row = next((r for r in event_rows(1000) if r["transaction_id"] == transaction_id), None)
    if not row:
        return jsonify({"error": "event not found"}), 404
    return jsonify({"transaction_id": transaction_id, "review": ai_review(row)})


@app.get("/api/upload/requirements")
def upload_requirements():
    return jsonify({
        "required": ["user/customer", "recipient/payee", "amount", "timestamp/date"],
        "optional": ["transaction_id"],
        "max_file_mb": MAX_UPLOAD_MB,
        "supported_format": "CSV",
    })


@app.post("/api/upload")
def upload_dataset():
    try:
        file = request.files.get("file")
        raw_mapping = request.form.get("mapping", "")
        mapping = json.loads(raw_mapping) if raw_mapping else None

        df, detected = validate_and_normalize_upload(file, mapping)
        results = analyze_uploaded_dataset(df)

        high = sum(r["risk_level"] == "HIGH" for r in results)
        medium = sum(r["risk_level"] == "MEDIUM" for r in results)
        low = sum(r["risk_level"] == "LOW" for r in results)

        con = connect_db()
        con.execute(
            "INSERT INTO uploads(filename,uploaded_at,rows,users,high_risk,medium_risk,low_risk) VALUES(?,?,?,?,?,?,?)",
            (
                file.filename,
                datetime.now(timezone.utc).isoformat(),
                len(results),
                int(df["user_id"].nunique()),
                high,
                medium,
                low,
            ),
        )
        con.commit()
        con.close()

        return jsonify({
            "ok": True,
            "filename": file.filename,
            "rows": len(results),
            "users": int(df["user_id"].nunique()),
            "mapping": detected,
            "summary": {"high": high, "medium": medium, "low": low},
            "results": results,
        })
    except Exception as exc:
        return jsonify({"ok": False, "error": str(exc)}), 400


@app.post("/api/demo/scenario")
def demo_scenario():
    """Run a self-contained public demo: new recipient -> rapid transfers -> drain."""
    try:
        base_time = pd.Timestamp(datetime.now(timezone.utc)) + pd.Timedelta(seconds=2)
        scenario_id = int(base_time.timestamp() * 1000)
        payee = f"Demo Scammer {scenario_id}"
        sequence = [
            (f"public_demo_{scenario_id}_1", 200, base_time),
            (f"public_demo_{scenario_id}_2", 500, base_time + pd.Timedelta(minutes=7)),
            (f"public_demo_{scenario_id}_drain", 45000, base_time + pd.Timedelta(minutes=15)),
        ]

        # Build the engine once for the whole demo. The previous implementation
        # rebuilt and retrained the IsolationForest three times, which made the
        # button feel slow. The sequence context is passed explicitly so the
        # same Guardian scoring logic still detects the burst pattern.
        engine = load_engine()
        demo_history = []
        outputs = []
        for transaction_id, amount, created_at in sequence:
            history_extra = pd.DataFrame(demo_history, columns=["user_id", "payee", "amount", "date"]) if demo_history else None
            result = engine.score(
                user_id=1,
                payee=payee,
                amount=amount,
                created_at=created_at.isoformat(),
                transaction_id=transaction_id,
                history_extra=history_extra,
            )
            result_data = make_result_dict(
                result, transaction_id, 1, payee, amount, created_at
            )
            record_result(result_data, "public_demo", {
                "scenario": "new_recipient_rapid_transfers_large_drain",
                "demo": True,
            })
            outputs.append(result_data)
            demo_history.append({"user_id": 1, "payee": payee, "amount": amount, "date": created_at})

        return jsonify({
            "ok": True,
            "message": "Demo scenario completed: new recipient → rapid transfers → large drain.",
            "results": outputs,
        })
    except Exception as exc:
        return jsonify({"ok": False, "error": str(exc)}), 500


@app.post("/api/demo/reset")
def demo_reset():
    """Clear demo events, alerts and reviewer actions while preserving the schema."""
    con = connect_db()
    for table in ("actions", "alerts", "events"):
        con.execute(f"DELETE FROM {table}")
    con.commit()
    con.close()
    return jsonify({"ok": True, "message": "Guardian demo data reset."})


@app.post("/api/demo/transaction")
def demo_transaction():
    data = request.get_json(force=True)
    transaction_id = data.get("transaction_id") or f"demo-{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    created_at = data.get("created_at") or datetime.now(timezone.utc).isoformat()

    try:
        engine = load_engine()
        result = engine.analyze(
            user_id=data["user_id"],
            payee=data["payee"],
            amount=float(data["amount"]),
            created_at=created_at,
        )
        result_data = make_result_dict(
            result,
            transaction_id,
            data["user_id"],
            data["payee"],
            float(data["amount"]),
            created_at,
        )
        record_result(result_data, "demo", data)
        return jsonify(result_data)
    except (KeyError, ValueError, TypeError) as exc:
        return jsonify({"error": str(exc)}), 400


@app.post("/api/events/<transaction_id>/action")
def event_action(transaction_id):
    data = request.get_json(force=True)
    action = str(data.get("action", "")).upper()
    if action not in {"APPROVE", "REJECT"}:
        return jsonify({"error": "action must be APPROVE or REJECT"}), 400

    con = connect_db()
    row = con.execute(
        "SELECT transaction_id,status FROM events WHERE transaction_id=?", (transaction_id,)
    ).fetchone()
    if not row:
        con.close()
        return jsonify({"error": "event not found"}), 404

    status = "APPROVED" if action == "APPROVE" else "REJECTED"
    actor = data.get("actor", "family_guardian")
    now = datetime.now(timezone.utc).isoformat()
    con.execute("UPDATE events SET status=? WHERE transaction_id=?", (status, transaction_id))
    con.execute(
        "INSERT INTO actions(transaction_id,action,actor,created_at) VALUES(?,?,?,?)",
        (transaction_id, action, actor, now),
    )
    con.commit()
    con.close()
    return jsonify({"transaction_id": transaction_id, "status": status, "actor": actor})


@app.post("/webhooks/razorpay/payouts")
def razorpay_payout_webhook():
    raw = request.get_data()
    if not verify_signature(raw, request.headers.get("X-Razorpay-Signature")):
        return jsonify({"error": "invalid signature"}), 401

    payload = request.get_json(force=True)
    if payload.get("event") != "payout.processed":
        return jsonify({"status": "ignored", "event": payload.get("event")}), 200

    try:
        payout = payload["payload"]["payout"]["entity"]
        amount_rupees = float(payout["amount"]) / 100.0
        created_at = datetime.fromtimestamp(int(payout["created_at"]), tz=timezone.utc).isoformat()
        fund_account = str(payout["fund_account_id"])
        transaction_id = str(payout["id"])

        # Demo mapping: webhook payouts are associated with synthetic user 1.
        engine = load_engine()
        result = engine.analyze(
            user_id=1,
            payee=fund_account,
            amount=amount_rupees,
            created_at=created_at,
        )
        result_data = make_result_dict(
            result,
            transaction_id,
            1,
            fund_account,
            amount_rupees,
            created_at,
        )
        record_result(result_data, "razorpayx", payload)
        return jsonify({
            "status": "flagged" if result_data["status"] == "PENDING_REVIEW" else "clear",
            "result": result_data,
        })
    except (KeyError, ValueError, TypeError) as exc:
        return jsonify({"error": str(exc)}), 400


init_db()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=False)
