# Guardian — Payment Safety Layer

Guardian is a buildathon prototype for explainable payment-behavior safety. It detects suspicious payment behavior, identifies high-risk sequences, creates local company/family alerts, provides an AI-style review summary, and keeps a human reviewer in control.

## Final demo flow

`Payment event → Guardian detection → Scam pattern → Risk score → Company + Family alert → AI Review Assistant → Human Approve/Reject → Audit trail`

## Included

- New-recipient detection
- Rapid/burst payment detection
- Personalized amount anomaly detection
- IsolationForest behavioral anomaly detection
- Explainable 0–100 risk score
- LOW / MEDIUM / HIGH classification
- Scam sequence timeline
- Local AI Review Assistant (deterministic, no paid LLM/API)
- Local simulated Company Security and Trusted Family alerts
- Customer safety warning/recommendation in the investigation panel
- Human-in-the-loop Approve / Reject workflow
- SQLite audit trail
- CSV upload and analysis
- Synthetic demo scenario: ₹200 → ₹500 → ₹45,000
- RazorpayX-style payout webhook simulator with HMAC-SHA256 verification
- Responsive fintech dashboard UI

## Run locally (Windows / VS Code)

1. Open this folder in VS Code.
2. Create/activate a virtual environment if needed.
3. Install dependencies:

```powershell
pip install -r requirements.txt
```

4. Start Guardian:

```powershell
python app.py
```

5. Open `http://127.0.0.1:5000/`.

## Clean demo reset

You can reset from the dashboard with **Reset Demo**, or run:

```powershell
python tools\reset_demo.py
```

The reset clears demo events, alerts, and reviewer actions without deleting the database schema.

## Public demo without Render

Keep `python app.py` running on your laptop and expose port 5000 through a secure HTTPS tunnel provider of your choice. The public URL will only work while the local Flask process and tunnel are running.

## Deployment

The project includes `Procfile` and `render.yaml` for hosted deployment. For a hosted demo, configure `GUARDIAN_DB_PATH` to a writable location or managed database appropriate to the hosting platform.

## Responsible-use boundary

This is a synthetic buildathon prototype. No real payments are processed. Approve/Reject changes demo state only; they do not freeze, reverse, or move real money. Company and family notifications are simulated locally and do not send real messages.
