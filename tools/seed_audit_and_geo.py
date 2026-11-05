import sqlite3
import hashlib
import json
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
DB_PATH = BASE / "guardian.db"

CITY_COORDINATES = {
    "mumbai": {"lat": 19.0760, "lon": 72.8777, "city": "Mumbai", "country": "India"},
    "pune": {"lat": 18.5204, "lon": 73.8567, "city": "Pune", "country": "India"},
    "delhi": {"lat": 28.6139, "lon": 77.2090, "city": "New Delhi", "country": "India"},
    "bengaluru": {"lat": 12.9716, "lon": 77.5946, "city": "Bengaluru", "country": "India"},
    "hyderabad": {"lat": 17.3850, "lon": 78.4867, "city": "Hyderabad", "country": "India"},
    "chennai": {"lat": 13.0827, "lon": 80.2707, "city": "Chennai", "country": "India"},
    "kolkata": {"lat": 22.5726, "lon": 88.3639, "city": "Kolkata", "country": "India"},
    "ahmedabad": {"lat": 23.0225, "lon": 72.5714, "city": "Ahmedabad", "country": "India"},
    "dubai": {"lat": 25.2048, "lon": 55.2708, "city": "Dubai", "country": "United Arab Emirates"},
    "lagos": {"lat": 6.5244, "lon": 3.3792, "city": "Lagos", "country": "Nigeria"},
    "phnom penh": {"lat": 11.5564, "lon": 104.9282, "city": "Phnom Penh", "country": "Cambodia"},
    "moscow": {"lat": 55.7558, "lon": 37.6173, "city": "Moscow", "country": "Russia"},
    "jamtara": {"lat": 23.9625, "lon": 86.8014, "city": "Jamtara", "country": "India"}
}

def migrate_and_seed():
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    cur = con.cursor()

    # Ensure actions columns
    action_columns = [
        ("notes", "TEXT"),
        ("previous_status", "TEXT"),
        ("new_status", "TEXT"),
        ("amount", "REAL"),
        ("user_id", "TEXT"),
        ("customer_name", "TEXT"),
        ("payee", "TEXT"),
        ("origin_city", "TEXT"),
        ("destination_city", "TEXT"),
        ("action_hash", "TEXT"),
    ]
    for col_name, col_type in action_columns:
        try:
            cur.execute(f"ALTER TABLE actions ADD COLUMN {col_name} {col_type}")
            con.commit()
        except Exception:
            pass

    # Ensure events columns
    event_columns = [
        ("origin_lat", "REAL"),
        ("origin_lon", "REAL"),
        ("origin_city", "TEXT"),
        ("origin_country", "TEXT"),
        ("dest_lat", "REAL"),
        ("dest_lon", "REAL"),
        ("dest_city", "TEXT"),
        ("dest_country", "TEXT"),
        ("dest_entity", "TEXT"),
        ("distance_km", "REAL"),
        ("geofence_status", "TEXT"),
    ]
    for col_name, col_type in event_columns:
        try:
            cur.execute(f"ALTER TABLE events ADD COLUMN {col_name} {col_type}")
            con.commit()
        except Exception:
            pass

    # Populate coordinates on events where missing
    events = cur.execute("SELECT * FROM events ORDER BY created_at DESC LIMIT 500").fetchall()
    for e in events:
        payload = {}
        try:
            payload = json.loads(e["payload_json"] or "{}")
        except Exception:
            pass
        loc = (payload.get("location") or "Mumbai").strip().lower()
        orig = CITY_COORDINATES.get(loc, CITY_COORDINATES["mumbai"])
        
        level = e["risk_level"]
        payee = (e["payee"] or "").lower()
        
        if "dubai" in payee or "crypto" in payee or (level == "HIGH" and "unknown" in payee):
            dest = CITY_COORDINATES["dubai"]
            dest_entity = "Al-Wasl Virtual Asset Gateway"
            dist = 1930.0
            geo_stat = "CRITICAL"
        elif "prize" in payee or "claim" in payee:
            dest = CITY_COORDINATES["lagos"]
            dest_entity = "Global Prize Settlement Node"
            dist = 7120.0
            geo_stat = "CRITICAL"
        elif level == "HIGH":
            dest = CITY_COORDINATES["jamtara"]
            dest_entity = f"Unregistered Remote Mule Wallet ({e['payee']})"
            dist = 1680.0
            geo_stat = "CRITICAL"
        elif level == "MEDIUM":
            dest = CITY_COORDINATES["delhi"]
            dest_entity = f"{e['payee']} Merchant Node"
            dist = 1150.0
            geo_stat = "SUSPICIOUS"
        else:
            dest = orig
            dest_entity = f"{e['payee']} Local Terminal"
            dist = 4.2
            geo_stat = "NORMAL"

        cur.execute("""
            UPDATE events SET 
                origin_lat = ?, origin_lon = ?, origin_city = ?, origin_country = ?,
                dest_lat = ?, dest_lon = ?, dest_city = ?, dest_country = ?,
                dest_entity = ?, distance_km = ?, geofence_status = ?
            WHERE transaction_id = ?
        """, (
            orig["lat"], orig["lon"], orig["city"], orig["country"],
            dest["lat"], dest["lon"], dest["city"], dest["country"],
            dest_entity, dist, geo_stat,
            e["transaction_id"]
        ))

    # Clear and populate realistic rich Audit Actions
    cur.execute("DELETE FROM actions")

    audit_cases = [
        {
            "tx_id": "TXN-10482",
            "action": "REJECT",
            "actor": "Piyush Tandale (Admin)",
            "prev": "PENDING_REVIEW",
            "new": "REJECTED",
            "notes": "Severe digital-arrest scam signature confirmed. Unrecognized Dubai crypto escrow recipient flagged by live satellite geofence.",
            "minutes_ago": 15
        },
        {
            "tx_id": "TXN-10475",
            "action": "REJECT",
            "actor": "Piyush Tandale (Admin)",
            "prev": "PENDING_REVIEW",
            "new": "REJECTED",
            "notes": "Repeated failed biometric authentication burst followed by lottery fee claim routed to Lagos proxy node.",
            "minutes_ago": 42
        },
        {
            "tx_id": "TXN-10470",
            "action": "APPROVE",
            "actor": "Piyush Tandale (Admin)",
            "prev": "PENDING_REVIEW",
            "new": "APPROVED",
            "notes": "Verified regular recurring customer expenditure for Local Pharmacy. Customer confirmed via step-up push prompt.",
            "minutes_ago": 68
        },
        {
            "tx_id": "TXN-10479",
            "action": "REJECT",
            "actor": "Piyush Tandale (Admin)",
            "prev": "PENDING_REVIEW",
            "new": "REJECTED",
            "notes": "Velocity threshold exceeded: 3 transfers within 15 minutes from rooted emulator device to unverified quick transfer node.",
            "minutes_ago": 120
        },
        {
            "tx_id": "TXN-10466",
            "action": "APPROVE",
            "actor": "Piyush Tandale (Admin)",
            "prev": "PENDING_REVIEW",
            "new": "APPROVED",
            "notes": "Emergency family hospital payment confirmed via dual-channel OTP authorization.",
            "minutes_ago": 180
        },
        {
            "tx_id": "TXN-10492",
            "action": "APPROVE",
            "actor": "System AI Auto-Rule",
            "prev": "PENDING_REVIEW",
            "new": "APPROVED",
            "notes": "Verified merchant white-listed under 30-day baseline spend. Low risk score (25/100).",
            "minutes_ago": 240
        },
        {
            "tx_id": "TXN-10488",
            "action": "APPROVE",
            "actor": "Piyush Tandale (Admin)",
            "prev": "PENDING_REVIEW",
            "new": "APPROVED",
            "notes": "Apollo Hospital Care payment cleared following medical billing reference verification.",
            "minutes_ago": 310
        }
    ]

    now = datetime.now(timezone.utc)
    for c in audit_cases:
        tx = cur.execute("SELECT * FROM events WHERE transaction_id = ?", (c["tx_id"],)).fetchone()
        if not tx:
            continue
        payload = {}
        try:
            payload = json.loads(tx["payload_json"] or "{}")
        except Exception:
            pass

        amt = float(tx["amount"])
        uid = tx["user_id"]
        cname = payload.get("customer_name") or f"Customer {uid}"
        payee = tx["payee"]
        orig_city = tx["origin_city"] or payload.get("location") or "Mumbai"
        dest_city = tx["dest_city"] or ("Dubai" if c["action"] == "REJECT" else orig_city)
        ts = (now - timedelta(minutes=c["minutes_ago"])).isoformat()

        # Update event status
        cur.execute("UPDATE events SET status = ? WHERE transaction_id = ?", (c["new"], c["tx_id"]))

        # SHA-256 integrity token
        hash_str = f"{c['tx_id']}:{c['action']}:{c['actor']}:{ts}:{amt:.2f}:{c['notes']}:{uid}:{c['prev']}:{c['new']}"
        action_hash = hashlib.sha256(hash_str.encode("utf-8")).hexdigest()

        cur.execute("""
            INSERT INTO actions (
                transaction_id, action, actor, notes, previous_status, new_status,
                amount, user_id, customer_name, payee, origin_city, destination_city, action_hash, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            c["tx_id"], c["action"], c["actor"], c["notes"], c["prev"], c["new"],
            amt, uid, cname, payee, orig_city, dest_city, action_hash, ts
        ))

    con.commit()
    con.close()
    print("Database successfully migrated with rich geospatial data and initial audit trail entries!")

if __name__ == "__main__":
    migrate_and_seed()
