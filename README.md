# 🛡️ Guardian — Payment Safety Layer

**AI-assisted payment safety for elderly and vulnerable customers.**

Guardian is a payment-behavior safety prototype designed to identify suspicious transaction patterns that may indicate scams targeting elderly and vulnerable customers.

It combines behavioral analysis, anomaly detection, explainable risk scoring, scam-sequence analysis, simulated alerts, and human-in-the-loop review in a single dashboard.

**Project:** Razorpay AI Buildathon — Open Track  
**Repository:** [Guardian-Payment-Safety](https://github.com/piyushT3003/Guardian-Payment-Safety)  
**Deployment:** Vercel setup in progress

> **Note:** A verified public demo URL will be added after deployment and testing. Guardian is a prototype using synthetic/demo data, not a production payment-security service.

---

## 📌 Table of Contents

- [Problem Statement](#-problem-statement)
- [Solution](#-solution)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Scam Sequence Detection](#-scam-sequence-detection)
- [Risk Detection Engine](#-risk-detection-engine)
- [AI Review Assistant](#-ai-review-assistant)
- [Human-in-the-Loop Review](#-human-in-the-loop-review)
- [Alerts and Audit Trail](#-alerts-and-audit-trail)
- [Evaluation Results](#-evaluation-results)
- [Technology Stack](#-technology-stack)
- [Webhook Simulation](#-webhook-simulation)
- [Run Locally](#-run-locally)
- [CSV Dataset Analysis](#-csv-dataset-analysis)
- [Vercel Deployment](#-vercel-deployment)
- [Project Structure](#-project-structure)
- [Security and Responsible AI](#-security-and-responsible-ai)
- [Limitations and Future Considerations](#-limitations-and-future-considerations)
- [Buildathon Context](#-buildathon-context)
- [Author](#-author)

---

## 🎯 Problem Statement

Payment scams can develop gradually instead of appearing as one obviously suspicious transaction.

For example, a scammer might receive a small test payment, request repeated transfers, and eventually convince the customer to send a much larger amount.

When each transaction is reviewed independently, the overall pattern may be difficult to identify.

Guardian explores how transaction history and behavioral signals can help identify suspicious payment sequences, particularly for elderly and vulnerable customers.

### Example scam pattern

**New recipient → Small test payment → Rapid repeated payments → Large transfer**

The objective is to identify warning signals early enough to support additional verification and human review.

---

## 💡 Solution

Guardian acts as a behavioral safety layer around payment-event data.

It analyzes transaction details and historical behavior to generate an explainable risk assessment.

The application includes:

- New-recipient detection
- Rapid payment and burst detection
- Personalized transaction-amount analysis
- Isolation Forest anomaly detection
- Scam-sequence analysis
- Explainable risk scoring from 0–100
- LOW, MEDIUM, and HIGH risk classification
- Simulated company security alerts
- Simulated trusted-family alerts
- A deterministic AI Review Assistant
- Human review with Approve and Reject actions
- A SQLite-based event and action history
- CSV dataset upload and analysis
- A simulated RazorpayX-style payout webhook

Guardian supports human decision-making. It does not execute, freeze, reverse, or modify real payments.

---

## ✨ Key Features

### 1. Payment Behavior Monitoring

Evaluates payment events using recipient history, transaction amounts, payment frequency, and other behavioral signals.

### 2. Explainable Risk Scoring

Produces a risk score and supporting reasons so reviewers can understand why a transaction was flagged.

### 3. Scam Sequence Investigation

Demonstrates how several transactions can form a suspicious pattern, rather than treating every payment as an isolated event.

### 4. AI Review Assistant

Generates a structured summary of a case, including its assessment, reasons, recommendation, and confidence label.

### 5. Human-in-the-Loop Review

Allows a reviewer to approve or reject a demonstration case.

### 6. Alert Simulation

Creates local alert records for company security and trusted-family contacts when a transaction is classified as HIGH risk.

### 7. CSV Dataset Analysis

Accepts transaction datasets, identifies supported column names, and analyzes records chronologically.

### 8. Webhook Signature Verification

Demonstrates HMAC-SHA256 verification for a simulated RazorpayX-style payout webhook.

---

## 🏗️ System Architecture

```text
Transaction Event
       |
       v
Demo Data / CSV / Simulated Webhook
       |
       v
Guardian Risk Engine
       |
       +-----------------------+
       |           |           |
       v           v           v
  New Payee    Burst /      Amount
  Detection    Velocity     Anomaly
               Detection   Detection
       |           |           |
       +-----------+-----------+
                   |
                   v
          Behavioral Analysis
                   |
                   v
        Explainable Risk Score
               (0–100)
                   |
                   v
          LOW / MEDIUM / HIGH
                   |
          +--------+--------+
          |                 |
          v                 v
      Monitoring        HIGH Risk
                            |
                            v
                   Investigation Panel
                            |
               +------------+------------+
               |            |            |
               v            v            v
           Company       Trusted       AI Review
           Alert         Family Alert  Assistant
               |            |            |
               +------------+------------+
                            |
                            v
                    Human Review
                     Approve/Reject
                            |
                            v
                       Audit Trail
```

### Processing flow

1. A transaction enters the application through demo input, CSV analysis, or the simulated webhook.
2. The risk engine evaluates available transaction history and behavioral signals.
3. The system calculates a risk score and assigns a risk category.
4. HIGH-risk events can create local company and trusted-family alert records.
5. The investigation interface presents the risk information and detected signals.
6. The Review Assistant generates a structured explanation.
7. A reviewer can approve or reject the demonstration case.
8. The event and reviewer action are recorded in SQLite.

---

## 🚨 Scam Sequence Detection

Guardian demonstrates a transaction sequence that resembles a potential scam:

```text
₹200
  |
  v
Payment to a new recipient
  |
  v
₹500
  |
  v
Repeated payment activity
  |
  v
₹45,000
  |
  v
Risk assessment and investigation
```

The built-in scenario creates three synthetic payment events associated with a new recipient. The risk engine evaluates them using the available behavioral context.

The investigation dashboard is designed to display:

- Risk score and classification
- Detected behavioral signals
- Risk score breakdown
- Pattern timeline
- Scam sequence playback
- Recipient information
- Customer safety information
- AI Review Assistant
- Company security alert preview
- Trusted-family alert preview
- Approve and Reject controls

The displayed sequence is a demonstration scenario, not evidence of a real scam.

---

## 🔍 Risk Detection Engine

Guardian combines behavioral rules with machine-learning anomaly detection.

### New-Recipient Detection

Identifies payments to a recipient that has not previously appeared in the available customer history.

### Burst and Velocity Detection

Checks for repeated payments to the same recipient within a defined time window.

### Personalized Amount Analysis

Compares a payment with historical transaction amounts to identify potentially unusual activity.

### Isolation Forest

Uses the Isolation Forest algorithm from scikit-learn to identify transaction amounts that differ from the learned baseline.

### Explainable Risk Score

The risk engine combines its configured signals into a score from 0 to 100.

| Risk category | Meaning |
|---|---|
| LOW | No strong risk signal was identified by the configured checks |
| MEDIUM | Additional attention or verification may be appropriate |
| HIGH | Escalation to the human-review workflow is recommended |

The exact scoring behavior depends on the configured thresholds and available historical data. A risk score is an indicator for review, not proof of fraud.

---

## 🤖 AI Review Assistant

Guardian includes a deterministic, locally implemented review assistant.

It summarizes the available risk assessment into a structured response containing:

- **Assessment:** LOW, MEDIUM, or HIGH risk
- **Summary:** Explanation of the detected behavioral pattern
- **Reasons:** Risk signals associated with the transaction
- **Recommendation:** Suggested next step
- **Confidence:** A qualitative label based on the application's configured logic

The current assistant uses predefined logic and detected signals. It does **not** call a paid LLM API and should not be represented as a generative AI model.

Its purpose is to demonstrate how risk information can be presented in a format that helps a human reviewer understand a case.

---

## 👤 Human-in-the-Loop Review

Guardian keeps the final demonstration decision with a human reviewer.

```text
HIGH-RISK EVENT
       |
       v
 INVESTIGATION
       |
       v
 HUMAN REVIEW
       |
       +----------------+
       |                |
       v                v
    APPROVE           REJECT
       |                |
       +----------------+
                |
                v
           Audit Record
```

The Approve and Reject actions update the stored status of a demonstration event and record the reviewer action.

These actions do not control real financial transactions or communicate with a live payment provider.

---

## 🔔 Alerts and Audit Trail

### Company Security Alert

Creates a local alert record containing information about a HIGH-risk event, its risk score, and the detected reasons.

### Trusted-Family Alert

Creates a simulated alert record representing a notification intended for a trusted family contact.

### Audit Trail

Stores demonstration events and reviewer actions in SQLite.

The current prototype uses local database tables for:

- Events
- Reviewer actions
- CSV upload summaries
- Alert records

**Important:** Alert records are not real emails, SMS messages, or push notifications. The audit trail is not a tamper-proof or compliance-grade financial audit system.

---

## 📊 Evaluation Results

Guardian was evaluated against a synthetic transaction dataset with the following characteristics:

| Dataset characteristic | Value |
|---|---:|
| Synthetic users | 50 |
| Age range | 60–85 |
| History period | 90 days |
| Total transactions | 1,381 |
| Synthetic scam rate | 20% |
| Scam transactions | 35 |

### Detection results

| Metric | Result |
|---|---:|
| Flagged transactions | 25 |
| True positives | 25 |
| False positives | 0 |
| False negatives | 10 |
| Precision | 100% |
| Recall | 71.4% |
| False positive rate | 0% |
| Scam sequences caught | 10/10 |
| Average first detection | Transaction #2 |
| Sequences detected before final drain | 10/10 |

### Robustness testing

The prototype also recorded **90/90 synthetic scam sequences caught** across six tested sequence variants.

A limitation appeared in single-test and direct-drain scenarios: when no preceding behavioral signal is available, detection may occur only when the large drain transaction appears.

### Interpretation

These figures describe the project's synthetic evaluation. They do not establish real-world fraud detection accuracy, production readiness, or effectiveness against actual financial scams.

The results depend on the dataset, scenario construction, and evaluation methodology.

---

## 🧪 Built-in Demo Scenario

The demo workflow creates three synthetic transactions:

1. A small payment to a new recipient.
2. A second payment to the same recipient.
3. A substantially larger payment to that recipient.

The risk engine evaluates each event and returns its own risk classification.

The workflow demonstrates:

**Transaction → Behavioral Analysis → Risk Score → Investigation → Alerts → Review Assistant → Human Decision → Audit Trail**

Use the dashboard's demo scenario control to run the demonstration and the reset control to clear its event, alert, and action records.

---

## 🖥️ Dashboard Features

The dashboard includes the following project capabilities:

- Live Transaction Monitor
- Risk KPI cards
- Investigation panel
- Risk score visualization
- Detected signals
- Risk Score Breakdown
- Pattern Timeline
- Scam Sequence Playback
- Recipient Profile
- Customer Safety Profile
- AI Review Assistant
- Company Security Alert preview
- Trusted Family Alert preview
- Approve / Reject controls
- Risk Trend
- Recent Alerts
- Demo and test scenarios
- CSV Dataset Upload
- Dataset Analysis
- All / High / Medium / Low filters
- Dataset analysis report download
- Demo reset
- Audit Trail

Some dashboard information is simulated or derived from the demo dataset rather than connected to live financial infrastructure.

---

## 🧰 Technology Stack

### Backend

- Python
- Flask
- SQLite
- pandas

### AI and Machine Learning

- scikit-learn
- Isolation Forest
- Behavioral anomaly detection
- Rule-based risk scoring
- Explainable risk signals

### Frontend

- HTML
- CSS
- JavaScript

### Security Demonstration

- HMAC-SHA256 webhook signature verification
- Input validation for CSV uploads
- Recorded reviewer actions
- Human-in-the-loop workflow

### Deployment

- Vercel deployment setup
- Python runtime
- Flask application entry point

---

## 💳 Webhook Simulation

Guardian includes the following simulated payout webhook endpoint:

```text
POST /webhooks/razorpay/payouts
```

The endpoint demonstrates a webhook processing flow:

```text
Payout Event
     |
     v
HMAC-SHA256 Signature Verification
     |
     v
Event Type Validation
     |
     v
Guardian Risk Engine
     |
     v
Risk Classification
     |
     v
Investigation / Alert / Review
```

The implementation verifies the request signature using the configured `RAZORPAY_WEBHOOK_SECRET` and processes the supported simulated payout event.

This is **not a live Razorpay or RazorpayX integration**. The project does not currently establish a production connection to Razorpay, execute payouts, or change payment-provider state.

No live payment credentials are required for the local demonstration.

---

## 💻 Run Locally

### Requirements

- Python 3.10 or a compatible version supported by the installed dependencies
- pip
- Git (optional, for cloning the repository)

### 1. Clone the repository

```bash
git clone https://github.com/piyushT3003/Guardian-Payment-Safety.git
cd Guardian-Payment-Safety
```

### 2. Create a virtual environment

```bash
python -m venv venv
```

### 3. Activate the environment

**Windows:**

```bash
venv\Scripts\activate
```

**macOS / Linux:**

```bash
source venv/bin/activate
```

### 4. Install dependencies

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### 5. Configure environment variables

The application supports the following optional variables:

| Variable | Purpose |
|---|---|
| `GUARDIAN_DB_PATH` | Overrides the SQLite database path |
| `RAZORPAY_WEBHOOK_SECRET` | Secret used to verify simulated webhook signatures |
| `PORT` | Local server port; defaults to `5000` |

For local use, the database defaults to `guardian.db` in the project directory.

For webhook testing, configure a private demo secret through your environment rather than committing secrets to GitHub.

### 6. Start Guardian

```bash
python app.py
```

### 7. Open the dashboard

Visit:

```text
http://127.0.0.1:5000/
```

### 8. Check the health endpoint

Visit:

```text
http://127.0.0.1:5000/api/health
```

A successful response should resemble:

```json
{
  "ok": true,
  "service": "guardian"
}
```

The application also provides `run_demo.bat` and `start_guardian.bat` for Windows, if these scripts are present in your local project.

---

## 📂 CSV Dataset Analysis

Guardian accepts CSV transaction files for behavioral analysis.

### Required fields

The application attempts to identify these fields automatically:

- User or customer identifier
- Recipient or payee
- Transaction amount
- Transaction date or timestamp

A transaction ID is optional.

### Example CSV format

```csv
transaction_id,user_id,payee,amount,date
TXN001,1001,Merchant_A,250,2026-09-01T10:00:00Z
TXN002,1001,Merchant_B,500,2026-09-01T10:15:00Z
TXN003,1001,Merchant_B,45000,2026-09-01T10:30:00Z
```

This is an illustrative example, not an actual customer dataset.

### Analysis workflow

1. Upload a CSV file through the dashboard.
2. Guardian detects supported column names.
3. The application validates the required fields.
4. Transactions are analyzed chronologically.
5. The application returns risk classifications and detected signals.
6. The dashboard presents the results and summary counts.

The current upload endpoint accepts CSV files up to 10 MB.

The analysis uses an initial per-user transaction baseline where available. Datasets with insufficient history may produce less reliable anomaly assessments.

Uploaded analysis results are returned by the API. The database stores upload summaries; this does not mean every uploaded row is permanently saved as an event.

Only use synthetic or appropriately anonymized data when demonstrating this project.

---

## 🚀 Vercel Deployment

Guardian is being configured for Vercel. The previous Railway deployment link is no longer advertised because it is no longer active.

Vercel supports Flask applications that expose a top-level Flask instance named `app` from a recognized entry file such as `app.py`. Refer to the [official Vercel Flask deployment documentation](https://vercel.com/docs/frameworks/backend/flask).

### Deployment checklist

1. Push the latest project files to GitHub.
2. Import the `Guardian-Payment-Safety` repository into Vercel.
3. Allow Vercel to detect the Flask application.
4. Ensure `requirements.txt` contains the packages required by the application.
5. Confirm that `app.py`, `guardian_engine.py`, `data/guardian_transactions.csv`, and `templates/dashboard.html` are included in the deployment.
6. Configure static assets for Vercel.
7. Add the required environment variables in the Vercel project settings.
8. Deploy and inspect the build logs.
9. Test the dashboard and API routes before publishing a live demo link.

### Static assets

Vercel recommends serving static files from a root-level `public/` directory rather than relying on Flask's static-file serving.

If the dashboard references an asset at `/static/guardian-hero.png`, ensure the deployed asset is available at:

```text
public/static/guardian-hero.png
```

Preserve the URL expected by the existing dashboard when arranging the static assets.

See the [official Vercel Flask documentation](https://vercel.com/docs/frameworks/backend/flask) for current deployment guidance.

### Database limitation

The current application uses SQLite. On Vercel, a local SQLite file should not be treated as persistent shared storage. Serverless instances can have separate filesystems, and temporary data may disappear.

The configured `/tmp/guardian.db` path is suitable only for temporary runtime storage; it does not provide reliable persistence across deployments or instances.

Consequently, demo events, alert records, and reviewer decisions may not persist consistently on Vercel.

For a durable hosted demo, the database layer would need a persistent external database. The current SQLite implementation is appropriate for local development and controlled demonstrations, with the hosting limitation understood.

### Live demo

**Status:** Deployment and testing in progress.

A public URL will be added here after the deployment is verified:

```text
Live demo: To be added after successful deployment and testing.
```

---

## 📁 Project Structure

```text
Guardian-Payment-Safety/
│
├── app.py
├── guardian_engine.py
├── requirements.txt
├── README.md
├── Procfile
├── render.yaml
├── .env.example
├── .gitignore
├── run_demo.bat
├── start_guardian.bat
│
├── data/
│   └── guardian_transactions.csv
│
├── static/
│   └── guardian-hero.png
│
├── templates/
│   └── dashboard.html
│
└── tools/
    └── reset_demo.py
```

This is a representative structure. Retain the additional files and subdirectories that exist in the repository.

Do not commit local virtual environments, database files containing local test records, Python cache directories, or secret environment files.

---

## 🔐 Security and Responsible AI

Guardian is a safety-focused prototype.

- Uses synthetic or demonstration transaction data.
- Does not execute real payments.
- Does not freeze, reverse, or modify real funds.
- Uses simulated company and trusted-family alerts.
- Uses a deterministic local Review Assistant.
- Demonstrates webhook signature verification.
- Uses human review for demonstration decisions.
- Reports evaluation results from synthetic data only.

### Important security considerations

- Keep webhook secrets out of source control.
- Use environment variables for secrets.
- Do not upload real customer financial data to a public demonstration.
- Do not expose the prototype as a production payment-processing service.
- Do not interpret a HIGH-risk classification as definitive proof of fraud.
- Review error handling and input validation before exposing endpoints publicly.
- Protect review and reset operations with suitable authentication and authorization before any real-world use.

Guardian is **not a production financial-security system** and has not been validated for real-world fraud prevention.

---

## ⚠️ Limitations and Future Considerations

The current implementation is a buildathon prototype with several limitations:

1. **Synthetic evaluation:** Reported metrics are based on constructed test data.
2. **Behavioral context:** Detection quality depends on the available transaction history.
3. **Model limitations:** Isolation Forest and rule-based checks can produce missed detections or incorrect flags.
4. **Simulated integrations:** Payment-provider connectivity and external notifications are not implemented as live services.
5. **Temporary hosted storage:** SQLite on Vercel does not provide durable shared storage.
6. **Access control:** The demonstration review and reset endpoints should not be treated as production-secure administrative controls.
7. **Operational readiness:** Production deployment would require further security, privacy, reliability, monitoring, and compliance work.

These limitations are important when interpreting the results and evaluating the project.

---

## 🎯 Buildathon Context

Guardian was developed for the **Razorpay AI Buildathon — Open Track**.

The project explores how behavioral analytics, anomaly detection, explainable risk scoring, and human review can work together to support payment safety for elderly and vulnerable customers.

The prototype demonstrates a potential workflow for investigating suspicious payment behavior without claiming that it is connected to or endorsed by Razorpay.

---

## 👨‍💻 Author

**Piyush Tandale**

- **GitHub:** [piyushT3003](https://github.com/piyushT3003)
- **Project repository:** [Guardian-Payment-Safety](https://github.com/piyushT3003/Guardian-Payment-Safety)

---

## 📌 Final Demo Flow

```text
Payment Event
      |
      v
Behavioral Detection
      |
      v
Risk Score and Explanation
      |
      v
Investigation
      |
      v
Simulated Alerts
      |
      v
AI Review Assistant
      |
      v
Human Approve / Reject
      |
      v
Audit Trail
```

**Guardian — exploring AI-assisted payment safety for elderly and vulnerable customers.**
