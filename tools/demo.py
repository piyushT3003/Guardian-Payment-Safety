from datetime import datetime, timezone
import requests

BASE = "http://127.0.0.1:5000"
PAYEE = "DemoScammerAccount"

sequence = [
    ("demo_test_1", 200, "2026-06-20T12:00:00+00:00"),
    ("demo_test_2", 500, "2026-06-20T12:07:00+00:00"),
    ("demo_drain", 45000, "2026-06-20T12:15:00+00:00"),
]

print("Guardian demo: new payee -> rapid transfers -> large drain")
for transaction_id, amount, created_at in sequence:
    response = requests.post(
        f"{BASE}/api/demo/transaction",
        json={
            "transaction_id": transaction_id,
            "user_id": 1,
            "payee": PAYEE,
            "amount": amount,
            "created_at": created_at,
        },
        timeout=5,
    )
    print(response.status_code, response.json())
