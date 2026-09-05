"""
Guardian - Webhook Simulator
==============================
Posts correctly-signed payout.processed events (same field names/shape as
Razorpay's real RazorpayX Payouts payloads) to the local listener. This is
what proves the integration actually works end-to-end - signature
verification included - without needing a live Razorpay account or a
public ngrok tunnel.

Run razorpay_payout_listener.py in one terminal, then this script in another.
"""

import hashlib
import hmac
import json
import time
import requests

WEBHOOK_SECRET = "demo_webhook_secret_change_me"  # must match the listener's WEBHOOK_SECRET
URL = "http://localhost:5000/webhooks/razorpay/payouts"


def sign(body_bytes: bytes) -> str:
    return hmac.new(WEBHOOK_SECRET.encode("utf-8"), body_bytes, hashlib.sha256).hexdigest()


def make_payout_event(account_id, fund_account_id, payout_id, amount_paise, created_at):
    """Same field names as Razorpay's documented RazorpayX Payout payload."""
    return {
        "account_id": account_id,
        "entity": "event",
        "event": "payout.processed",
        "contains": ["payout"],
        "created_at": created_at,
        "payload": {
            "payout": {
                "entity": {
                    "id": payout_id,
                    "entity": "payout",
                    "fund_account_id": fund_account_id,
                    "amount": amount_paise,
                    "currency": "INR",
                    "status": "processed",
                    "purpose": "vendor bill",
                    "mode": "UPI",
                    "created_at": created_at,
                }
            }
        },
    }


def send(event):
    body = json.dumps(event).encode("utf-8")
    headers = {"Content-Type": "application/json", "X-Razorpay-Signature": sign(body)}
    resp = requests.post(URL, data=body, headers=headers)
    print(f"  -> payout {event['payload']['payout']['entity']['id']} "
          f"(\u20b9{event['payload']['payout']['entity']['amount']/100:,.0f}): "
          f"HTTP {resp.status_code} {resp.json()}")


def main():
    account_id = "acc_demo_business_1"
    t = int(time.time()) - 3600

    print("Sending normal payout history (establishing trusted fund accounts)...")
    for i, fa in enumerate(["fa_regular_supplier_1", "fa_regular_supplier_2", "fa_payroll"]):
        send(make_payout_event(account_id, fa, f"pout_normal_{i}", amount_paise=50000, created_at=t))
        t += 600

    print("\nSending a vendor-impersonation fraud sequence (new fund account, burst, then a large drain)...")
    fraud_fa = "fa_fraudulent_new_vendor"
    send(make_payout_event(account_id, fraud_fa, "pout_test_1", amount_paise=10000, created_at=t))
    t += 300
    send(make_payout_event(account_id, fraud_fa, "pout_test_2", amount_paise=15000, created_at=t))
    t += 300
    send(make_payout_event(account_id, fraud_fa, "pout_drain", amount_paise=4500000, created_at=t))  # ₹45,000


if __name__ == "__main__":
    main()
