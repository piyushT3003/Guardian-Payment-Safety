import urllib.request
import json
import sys

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

def post(url, body=None):
    if body is None:
        body = {}
    data = json.dumps(body).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='POST')
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def get(url):
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def main():
    print("--- 1. Clear database to 0 records ---")
    res1 = post('http://127.0.0.1:5000/api/demo/clear')
    print("Clear response:", res1)

    print("\n--- 2. Emit Step 6 (Digital Arrest Police Scam) ---")
    step6 = post('http://127.0.0.1:5000/api/demo/emit-step', {'step_index': 6})
    tx_id = step6['transaction_id']
    print(f"Emitted {tx_id}: {step6['elderly_name']}, Scam: {step6['scam_category']}, Score: {step6['risk_score']}")

    print("\n--- 3. Check Fraud Monitoring Queue ---")
    q1 = get('http://127.0.0.1:5000/api/monitoring/transactions')
    print(f"Queue count: {q1['total']}, First item status: {q1['transactions'][0]['status']}")

    print("\n--- 4. Family Guardian Puts Payment On Hold ---")
    hold = post(f'http://127.0.0.1:5000/api/events/{tx_id}/guardian-action', {
        'action': 'HOLD',
        'guardian_name': 'Aditya Kulkarni (Son)',
        'notes': 'Paused by son Aditya: suspected digital arrest scam video call'
    })
    print(f"Guardian Action: {hold['status']}, Hash: {hold['action_hash'][:16]}...")

    print("\n--- 5. Verify Fraud Monitoring Queue Status is Updated ---")
    q2 = get('http://127.0.0.1:5000/api/monitoring/transactions')
    print(f"Queue item new status: {q2['transactions'][0]['status']}")
    assert q2['transactions'][0]['status'] == 'ON_HOLD_BY_GUARDIAN'

    print("\n--- 6. Company Reviewer Rejects & Blocks Payment ---")
    act = post(f'http://127.0.0.1:5000/api/events/{tx_id}/action', {
        'action': 'REJECT',
        'actor': 'Piyush Tandale (Admin)',
        'notes': 'Payment rejected and fraudulent mule account frozen.'
    })
    print(f"Company Decision: {act['status']}, Hash: {act['action_hash'][:16]}...")
    assert act['status'] == 'REJECTED'

    print("\n--- 7. Verify Audit Trail ---")
    audit = get('http://127.0.0.1:5000/api/audit-trail')
    print(f"Audit Trail decisions: {len(audit['actions'])}, Rejected Amount: ₹{audit['summary']['rejected_amount']}")
    assert len(audit['actions']) == 2
    assert audit['summary']['rejected_amount'] == 48000

    print("\n--- 8. Reset to 0 Baseline ---")
    res_clear = post('http://127.0.0.1:5000/api/demo/clear')
    print("Baseline reset:", res_clear)

    print("\nALL VERIFICATIONS PASSED WITH ZERO ERRORS!")

if __name__ == '__main__':
    main()
