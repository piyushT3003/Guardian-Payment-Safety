"""
Guardian Data Seeder
Generates transactions_sample.csv (10,000 records) and seeds guardian.db
with the authentic records and statistics matching the authoritative 9-panel UI/UX reference.
"""

import os
import json
import sqlite3
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path
import pandas as pd

BASE = Path(__file__).resolve().parent.parent
DATA_DIR = BASE / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = BASE / "guardian.db"

PAYMENT_METHODS = ["UPI", "Card", "Wallet", "Net Banking", "Others"]
METHOD_WEIGHTS = [0.42, 0.28, 0.16, 0.10, 0.04]  # Matches panel 6 exact percentages!

LOCATIONS = ["Mumbai", "Pune", "Delhi", "Bengaluru", "Hyderabad", "Chennai", "Kolkata", "Ahmedabad", "Jaipur", "Lucknow"]
ANOMALY_LOCATIONS = ["Dubai, UAE", "London, UK", "Lagos, Nigeria", "Bangkok, Thailand", "Moscow, Russia", "Unknown Proxy/VPN"]

DEVICES = ["Samsung Galaxy A52", "Redmi Note 11", "OnePlus Nord CE", "Vivo Y21", "iPhone 13", "iPhone 14"]
SUSPICIOUS_DEVICES = ["Rooted Android 10", "Linux Tor Browser", "Emulated Android Device", "Unknown Mac/Proxy"]

TRUSTED_PAYEES = [
    "Electricity Board", "Gas Agency", "Milk Vendor", "Local Pharmacy",
    "Grocery Mart", "Water Bill", "Newspaper Vendor", "Cable TV",
    "Temple Donation", "Son (Aditya)", "Daughter (Pooja)"
]

def seed():
    print("Generating sample dataset matching 9-panel UI...")
    random.seed(42)
    start_date = datetime(2026, 10, 1, 0, 0, 0, tzinfo=timezone.utc)
    end_date = datetime(2026, 10, 31, 23, 59, 59, tzinfo=timezone.utc)
    total_seconds = int((end_date - start_date).total_seconds())

    records = []
    
    # Specific showcase transactions from panels 4, 5, and 9:
    showcase_txns = [
        {
            "transaction_id": "TXN-10482",
            "user_id": "CUST-7821",
            "customer_name": "Ramesh Kulkarni",
            "payee": "Global Crypto Exchange / Unverified",
            "amount": 25000.0,
            "created_at": "2026-10-30T14:22:15+00:00",
            "risk_score": 92,
            "risk_level": "HIGH",
            "reason": "Unusual amount & location",
            "reasons": ["Unusual amount & location", "Payment to unverified high-risk beneficiary", "International IP detected"],
            "status": "PENDING_REVIEW",
            "payment_method": "UPI",
            "location": "Dubai, UAE",
            "device": "Unknown Proxy/VPN",
            "is_scam": True
        },
        {
            "transaction_id": "TXN-10479",
            "user_id": "CUST-3914",
            "customer_name": "Sunita Sharma",
            "payee": "QuickTransfer Tech",
            "amount": 8500.0,
            "created_at": "2026-10-30T11:45:00+00:00",
            "risk_score": 67,
            "risk_level": "MEDIUM",
            "reason": "New device & High frequency",
            "reasons": ["New device & High frequency", "First-time transfer from unrecognized device", "3 transfers within 15 minutes"],
            "status": "PENDING_REVIEW",
            "payment_method": "UPI",
            "location": "Pune",
            "device": "Rooted Android 10",
            "is_scam": True
        },
        {
            "transaction_id": "TXN-10475",
            "user_id": "CUST-5520",
            "customer_name": "Vijay Deshmukh",
            "payee": "Prize Claim Official",
            "amount": 42000.0,
            "created_at": "2026-10-29T19:30:22+00:00",
            "risk_score": 89,
            "risk_level": "HIGH",
            "reason": "Multiple failed attempts",
            "reasons": ["Multiple failed attempts", "Rapid burst following failed OTP entries", "Sudden high-value transfer"],
            "status": "PENDING_REVIEW",
            "payment_method": "Net Banking",
            "location": "Mumbai",
            "device": "Linux Tor Browser",
            "is_scam": True
        },
        {
            "transaction_id": "TXN-10470",
            "user_id": "CUST-7821",
            "customer_name": "Ramesh Kulkarni",
            "payee": "Local Pharmacy",
            "amount": 3200.0,
            "created_at": "2026-10-29T16:15:10+00:00",
            "risk_score": 32,
            "risk_level": "LOW",
            "reason": "Normal pattern",
            "reasons": ["Normal pattern", "Recognized recurring merchant", "Amount within 30-day moving average"],
            "status": "APPROVED",
            "payment_method": "Card",
            "location": "Mumbai",
            "device": "Samsung Galaxy A52",
            "is_scam": False
        },
        {
            "transaction_id": "TXN-10466",
            "user_id": "CUST-8831",
            "customer_name": "Anil Patil",
            "payee": "Peer Escrow Ltd",
            "amount": 18500.0,
            "created_at": "2026-10-28T03:12:44+00:00",
            "risk_score": 71,
            "risk_level": "MEDIUM",
            "reason": "Unusual time of transaction",
            "reasons": ["Unusual time of transaction", "Payment initiated outside active user hours (03:12 AM)", "Rapid amount jump"],
            "status": "PENDING_REVIEW",
            "payment_method": "UPI",
            "location": "Pune",
            "device": "OnePlus Nord CE",
            "is_scam": True
        },
        # Ramesh Kulkarni specific panel 5 showcase transactions:
        {
            "transaction_id": "TXN-10492",
            "user_id": "CUST-7821",
            "customer_name": "Ramesh Kulkarni",
            "payee": "Grocery Mart",
            "amount": 4500.0,
            "created_at": "2026-10-29T10:05:00+00:00",
            "risk_score": 25,
            "risk_level": "LOW",
            "reason": "Normal grocery transaction",
            "reasons": ["Verified trusted merchant", "Consistent monthly purchase"],
            "status": "APPROVED",
            "payment_method": "UPI",
            "location": "Mumbai",
            "device": "Samsung Galaxy A52",
            "is_scam": False
        },
        {
            "transaction_id": "TXN-10488",
            "user_id": "CUST-7821",
            "customer_name": "Ramesh Kulkarni",
            "payee": "Apollo Hospital Care",
            "amount": 12000.0,
            "created_at": "2026-10-27T15:20:00+00:00",
            "risk_score": 52,
            "risk_level": "MEDIUM",
            "reason": "Higher amount healthcare payment",
            "reasons": ["Moderate amount elevation", "Healthcare payee category"],
            "status": "APPROVED",
            "payment_method": "Card",
            "location": "Mumbai",
            "device": "Samsung Galaxy A52",
            "is_scam": False
        }
    ]

    records.extend(showcase_txns)
    existing_ids = {t["transaction_id"] for t in showcase_txns}

    # Generate remaining records up to 10,000 with exactly 248 fraud cases
    # We currently have 4 fraud cases in showcase (TXN-10482, TXN-10479, TXN-10475, TXN-10466)
    target_fraud_count = 248
    remaining_fraud = target_fraud_count - 4
    total_needed = 10000 - len(records)
    remaining_normal = total_needed - remaining_fraud

    users_pool = [f"CUST-{random.randint(1000, 9999)}" for _ in range(350)]
    users_pool.append("CUST-7821")  # Ramesh Kulkarni

    print(f"Generating {remaining_fraud} fraud transactions and {remaining_normal} normal transactions...")

    # Fraud generator:
    fraud_reasons = [
        ("Unusual amount & location", ["Amount exceeds standard behavior", "Access from unrecognized geofence"]),
        ("New device & High frequency", ["Unrecognized device fingerprint", "High frequency transaction burst"]),
        ("Multiple failed attempts", ["Prior security pin failures", "Sudden high-velocity payment"]),
        ("Unusual time of transaction", ["Off-hours transaction (midnight to 4 AM)", "New beneficiary"]),
        ("Rapid successive transfers", ["3rd transfer to new recipient within 20 minutes", "Balance drain velocity"]),
        ("Impersonation scam pattern", ["Matches known police/customs threat scam format", "New beneficiary"])
    ]

    for i in range(remaining_fraud):
        tx_id = f"TXN-{10500 + i}"
        uid = random.choice(users_pool)
        method = random.choices(PAYMENT_METHODS, weights=METHOD_WEIGHTS)[0]
        reason_title, reason_details = random.choice(fraud_reasons)
        amount = round(random.choice([
            random.uniform(5000, 15000),
            random.uniform(15000, 35000),
            random.uniform(35000, 75000),
            random.uniform(80000, 150000)
        ]), 2)
        score = random.randint(65, 96)
        level = "HIGH" if score >= 80 else "MEDIUM"
        status = random.choice(["PENDING_REVIEW", "PENDING_REVIEW", "REJECTED", "APPROVED"])
        dt = start_date + timedelta(seconds=random.randint(0, total_seconds))
        loc = random.choice(ANOMALY_LOCATIONS if score >= 80 else LOCATIONS)
        dev = random.choice(SUSPICIOUS_DEVICES if score >= 80 else DEVICES)

        records.append({
            "transaction_id": tx_id,
            "user_id": uid,
            "customer_name": f"User {uid}",
            "payee": f"Unknown_Payee_{random.randint(100, 999)}",
            "amount": amount,
            "created_at": dt.isoformat(),
            "risk_score": score,
            "risk_level": level,
            "reason": reason_title,
            "reasons": reason_details,
            "status": status,
            "payment_method": method,
            "location": loc,
            "device": dev,
            "is_scam": True
        })

    # Normal generator:
    normal_reasons = [
        "Normal pattern",
        "Trusted beneficiary payment",
        "Regular utility bill payment",
        "Routine grocery purchase",
        "Consistent merchant transaction"
    ]

    for i in range(remaining_normal):
        tx_id = f"TXN-{20000 + i}"
        uid = random.choice(users_pool)
        method = random.choices(PAYMENT_METHODS, weights=METHOD_WEIGHTS)[0]
        payee = random.choice(TRUSTED_PAYEES)
        amount = round(random.choice([
            random.uniform(50, 500),
            random.uniform(500, 2500),
            random.uniform(2500, 6000),
            random.uniform(6000, 12000)
        ]), 2)
        score = random.randint(10, 38)
        level = "LOW"
        status = "CLEAR" if random.random() < 0.9 else "APPROVED"
        dt = start_date + timedelta(seconds=random.randint(0, total_seconds))
        loc = random.choice(LOCATIONS)
        dev = random.choice(DEVICES)

        records.append({
            "transaction_id": tx_id,
            "user_id": uid,
            "customer_name": f"User {uid}",
            "payee": payee,
            "amount": amount,
            "created_at": dt.isoformat(),
            "risk_score": score,
            "risk_level": level,
            "reason": random.choice(normal_reasons),
            "reasons": ["Normal transaction within baseline limits", "Familiar merchant"],
            "status": status,
            "payment_method": method,
            "location": loc,
            "device": dev,
            "is_scam": False
        })

    # Sort chronologically
    records.sort(key=lambda x: x["created_at"])

    # Export to CSV for upload testing and downloads: data/transactions_sample.csv
    df = pd.DataFrame([
        {
            "transaction_id": r["transaction_id"],
            "user_id": r["user_id"],
            "date": r["created_at"],
            "payee": r["payee"],
            "amount": r["amount"],
            "payment_method": r["payment_method"],
            "location": r["location"],
            "device": r["device"],
            "is_scam": r["is_scam"]
        } for r in records
    ])
    csv_path = DATA_DIR / "transactions_sample.csv"
    df.to_csv(csv_path, index=False)
    print(f"Saved {len(df)} records to {csv_path} ({os.path.getsize(csv_path) / 1024 / 1024:.2f} MB)")

    # Save customer profiles in data/customers.json
    customers = {
        "CUST-7821": {
            "customer_id": "CUST-7821",
            "name": "Ramesh Kulkarni",
            "age_group": "60+ (Senior User)",
            "registered_since": "Jan 2024",
            "verified": True,
            "phone": "+91 98201 44821",
            "email": "ramesh.kulkarni@example.com",
            "total_transactions": 58,
            "total_spent": 124300.0,
            "safety_score": 82,
            "safety_level": "Safe",
            "safety_summary": "Low risk behaviour. No major fraud patterns detected.",
            "trusted_payees": ["Local Pharmacy", "Grocery Mart", "Apollo Hospital Care", "Electricity Board", "Son (Aditya)"]
        },
        "CUST-3914": {
            "customer_id": "CUST-3914",
            "name": "Sunita Sharma",
            "age_group": "55-60",
            "registered_since": "Mar 2023",
            "verified": True,
            "phone": "+91 98211 55914",
            "email": "sunita.sharma@example.com",
            "total_transactions": 74,
            "total_spent": 215400.0,
            "safety_score": 68,
            "safety_level": "Moderate",
            "safety_summary": "Moderate risk behaviour. Detected frequent new device logins.",
            "trusted_payees": ["Milk Vendor", "Grocery Store", "Gas Agency"]
        },
        "CUST-5520": {
            "customer_id": "CUST-5520",
            "name": "Vijay Deshmukh",
            "age_group": "65+",
            "registered_since": "Nov 2022",
            "verified": True,
            "phone": "+91 98190 77520",
            "email": "vijay.deshmukh@example.com",
            "total_transactions": 42,
            "total_spent": 98700.0,
            "safety_score": 45,
            "safety_level": "Action Required",
            "safety_summary": "High risk pattern detected recently: multiple OTP failures and high-value transfer.",
            "trusted_payees": ["Water Bill", "Temple Donation", "Cable TV"]
        }
    }
    with open(DATA_DIR / "customers.json", "w") as f:
        json.dump(customers, f, indent=2)

    # Initialize SQLite database
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()

    cur.executescript("""
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
            notes TEXT,
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
            status TEXT NOT NULL DEFAULT 'UNREAD',
            created_at TEXT NOT NULL,
            UNIQUE(transaction_id, alert_type)
        );
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value_json TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS reports (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            report_type TEXT NOT NULL,
            date_range TEXT NOT NULL,
            format TEXT NOT NULL,
            record_count INTEGER NOT NULL,
            file_path TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
    """)

    # Populate settings if not present
    default_settings = {
        "detection_mode": "ai_rules",
        "risk_threshold": 0.70,
        "detect_high_value": True,
        "detect_location_device": True,
        "generate_explanations": True,
        "notifications_enabled": True,
        "alert_high_risk_only": False,
        "email_alerts": True,
        "webhook_alerts": True
    }
    cur.execute(
        "INSERT OR REPLACE INTO settings (key, value_json, updated_at) VALUES ('general', ?, ?)",
        (json.dumps(default_settings), datetime.now(timezone.utc).isoformat())
    )

    # Clear and repopulate events
    cur.execute("DELETE FROM events")
    cur.execute("DELETE FROM alerts")
    cur.execute("DELETE FROM uploads")

    server_now = datetime.now(timezone.utc).isoformat()
    rows_to_insert = []
    alerts_to_insert = []

    for r in records:
        payload = {
            "customer_name": r.get("customer_name"),
            "payment_method": r.get("payment_method"),
            "location": r.get("location"),
            "device": r.get("device"),
            "reason": r.get("reason"),
            "is_scam": r.get("is_scam")
        }
        rows_to_insert.append((
            r["transaction_id"],
            "seed_data",
            r["user_id"],
            r["payee"],
            r["amount"],
            r["created_at"],
            r["risk_score"],
            r["risk_level"],
            json.dumps(r.get("reasons", [r.get("reason", "")])),
            r["status"],
            json.dumps(payload),
            server_now
        ))

        # Insert alerts for high risk transactions
        if r["risk_level"] == "HIGH":
            alerts_to_insert.append((
                r["transaction_id"],
                r["user_id"],
                "COMPANY_SECURITY",
                f"High-Risk Transaction Flagged: {r['transaction_id']}",
                f"Payment of ₹{r['amount']:,.0f} flagged for {r['user_id']} ({r.get('customer_name')}). Reason: {r.get('reason')}",
                "UNREAD",
                r["created_at"]
            ))

    cur.executemany(
        """INSERT INTO events (transaction_id, source, user_id, payee, amount, created_at,
                               risk_score, risk_level, reasons_json, status, payload_json, created_server_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        rows_to_insert
    )

    cur.executemany(
        """INSERT OR IGNORE INTO alerts (transaction_id, user_id, alert_type, title, message, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        alerts_to_insert
    )

    # Add default upload record
    high_count = sum(1 for r in records if r["risk_level"] == "HIGH")
    med_count = sum(1 for r in records if r["risk_level"] == "MEDIUM")
    low_count = sum(1 for r in records if r["risk_level"] == "LOW")

    cur.execute(
        """INSERT INTO uploads (filename, uploaded_at, rows, users, high_risk, medium_risk, low_risk)
           VALUES ('transactions_sample.csv', ?, ?, ?, ?, ?, ?)""",
        (server_now, len(records), len(users_pool), high_count, med_count, low_count)
    )

    con.commit()
    con.close()
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed()
