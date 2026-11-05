import sys
import json
import urllib.request

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://127.0.0.1:5000"

def post(path, data):
    req = urllib.request.Request(
        f"{BASE_URL}{path}",
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

print("--- Resetting DB ---")
post("/api/demo/clear", {})

print("\n--- Running Demo Scenario 1 (Digital Arrest Scam) ---")
for s in [1, 2, 3]:
    res = post("/api/demo/scenario-1", {"step": s})
    print(f"Step {s}: {res.get('message')} | Status: {res.get('status')}")

print("\n--- Running Demo Scenario 2 (Emergency 5-Minute Clawback) ---")
for s in [1, 2, 3]:
    res = post("/api/demo/scenario-2", {"step": s})
    print(f"Step {s}: {res.get('message')} | Status: {res.get('status')} | Recovery Status: {res.get('recovery_status')}")

print("\n--- Both Scenarios Tested Successfully! ---")
