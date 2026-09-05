# Guardian — Payment Safety Layer

Guardian is a payment-behavior safety layer designed to help identify suspicious transaction patterns affecting elderly and vulnerable customers.

The system combines behavioral rules, anomaly detection, sequence analysis, explainable risk scoring, alerts, and human review in a single dashboard.

## Live Demo

**[Open Guardian Live Demo](https://web-production-d829f.up.railway.app)**

The live demo uses synthetic transaction data. No real payments or customer funds are involved.

## Problem

Some payment scams do not look suspicious when transactions are viewed individually. A scam can develop over several transactions:

**New recipient → small test payment → repeated payment → large transfer**

This makes sequence and behavioral context important when assessing transaction risk.

Guardian focuses on this pattern by looking at the customer's previous behavior as well as the current transaction.

## Solution

For each transaction, Guardian evaluates several signals:

- New recipient
- Rapid or repeated payments to the same recipient
- Unusual payment amount compared with the customer's behavior
- Behavioral anomaly detected using Isolation Forest
- Transaction sequence and surrounding activity

These signals are combined into an explainable risk score from **0 to 100** and classified as **LOW, MEDIUM, or HIGH**.

High-risk cases are sent for human review instead of automatically taking action on the payment.

## Architecture

```text
Payment Event
      ↓
Synthetic / Demo Data
        OR
RazorpayX-style Webhook
      ↓
Guardian Risk Engine
      ↓
New Payee Detection
+ Burst / Velocity Detection
+ Personalized Amount Analysis
+ Isolation Forest
      ↓
Sequence Analysis
      ↓
Risk Score (0–100)
      ↓
LOW / MEDIUM / HIGH
      ↓
HIGH RISK
      ↓
Company Security Alert
+ Trusted Family Alert
      ↓
AI Review Assistant
      ↓
Human Review
      ↓
APPROVE / REJECT
      ↓
Audit Trail
```

### How the flow works

1. A transaction enters Guardian through the demo system or the simulated payout webhook.
2. The risk engine checks the transaction against the customer's previous activity.
3. Multiple behavioral and anomaly signals are evaluated.
4. The signals are combined into an explainable risk score.
5. High-risk transactions are moved to investigation.
6. Simulated alerts are created for the company security team and trusted family contact.
7. The local AI Review Assistant summarizes the case and provides a recommendation.
8. A human reviewer can approve or reject the case.
9. The decision is recorded in the audit trail.

## Scam Sequence Detection

The built-in demonstration shows a simple payment escalation:

```text
₹200
  ↓
New Recipient
  ↓
₹500
  ↓
Rapid Repeat Payment
  ↓
₹45,000
  ↓
HIGH RISK
```

The investigation view allows the reviewer to inspect the sequence, contributing signals, risk score, recipient profile, and recommended action.

## Risk Detection

### New Payee

Identifies payments to recipients that have not previously appeared in the customer's transaction history.

### Burst / Velocity

Looks for multiple payments to the same recipient within a short period.

### Personalized Amount Analysis

Compares the current amount with the customer's previous payment behavior to identify unusually large transactions.

### Isolation Forest

Isolation Forest is used to identify transaction behavior that differs from the customer's normal activity.

### Explainable Risk Score

The individual signals contribute to a 0–100 risk score. The dashboard displays the detected signals so the reviewer can understand why a transaction was flagged.

## AI Review Assistant

Guardian includes a local AI-style review assistant that generates a structured review of a flagged transaction.

It provides:

- Assessment
- Summary
- Reasons
- Recommended action
- Confidence

The assistant is deterministic and runs locally within the application. No paid LLM API is required for the demo.

## Human Review

Guardian keeps the final decision with a human reviewer.

```text
HIGH RISK
    ↓
Human Review
    ↓
APPROVE / REJECT
    ↓
Audit Trail
```

The Approve and Reject actions change the state of the demonstration case only. They do not freeze, reverse, transfer, or modify real money.

## Alerts

High-risk cases generate two simulated alerts:

**Company Security Team**

A security alert containing the transaction and risk information needed for investigation.

**Trusted Family Contact**

A preview of the type of notification that could be shown to a trusted contact for a vulnerable customer.

These alerts are simulated and do not send real messages.

## Evaluation

Guardian was tested using a synthetic dataset with:

- 50 users
- Customer ages between 60 and 85
- 90 days of transaction history
- 1,381 transactions
- 35 synthetic scam transactions

### Detection Results

| Metric | Result |
|---|---:|
| Flagged transactions | 25 |
| True positives | 25 |
| False positives | 0 |
| False negatives | 10 |
| Precision | 100% |
| Recall | 71.4% |
| False positive rate | 0% |
| Scam sequences caught | 10 / 10 |
| Average first detection | Transaction #2 |
| Caught before final drain | 10 / 10 |

Guardian also caught **90/90 synthetic scam sequences** across six tested sequence variants.

For single-test and direct-drain scenarios, detection can occur only at the large transaction because there is no earlier behavioral signal to work with.

These results are from synthetic data and are not claims of real-world financial performance.

## Demo Scenario

The built-in demo creates a short payment sequence:

```text
₹200    → LOW
₹500    → HIGH
₹45,000 → HIGH
```

This demonstrates the complete Guardian workflow:

**Transaction → Detection → Risk Score → Investigation → Alerts → AI Review → Human Decision → Audit Trail**

## Dashboard

The dashboard includes:

- Live Transaction Monitor
- Risk summary cards
- Investigation panel
- Risk score visualization
- Detected signals
- Risk Score Breakdown
- Pattern Timeline
- Scam Sequence Playback
- Recipient Profile
- Customer Safety Profile
- AI Review Assistant
- Company Security Alert
- Trusted Family Alert
- Approve / Reject actions
- Risk Trend
- Recent Alerts
- Demo Scenarios
- CSV Dataset Analysis
- Audit Trail

## RazorpayX-style Webhook

Guardian includes a simulated payout webhook endpoint with HMAC-SHA256 signature verification.

```text
Payout Webhook
      ↓
Signature Verification
      ↓
Guardian Risk Engine
      ↓
Risk Classification
      ↓
Investigation / Alert / Review
```

This is a simulated integration for the buildathon and is not a live production Razorpay integration.

## Tech Stack

**Backend**
- Python
- Flask
- Gunicorn
- SQLite

**AI / ML**
- scikit-learn
- Isolation Forest
- Behavioral anomaly detection
- Rule-based risk scoring

**Frontend**
- HTML
- CSS
- JavaScript

**Security**
- HMAC-SHA256
- Audit trail
- Human-in-the-loop review

**Deployment**
- Railway

## Deployment

Guardian is deployed on Railway using Gunicorn and Flask.

**[Open the deployed application](https://web-production-d829f.up.railway.app)**

The prototype uses SQLite for storing demo events, alerts, actions, and audit information.

## Run Locally

### Requirements

- Python 3.x
- pip

### Setup

Create a virtual environment:

```bash
python -m venv venv
```

Activate it on Windows:

```bash
venv\Scripts\activate
```

Install the dependencies:

```bash
pip install -r requirements.txt
```

Start the application:

```bash
python app.py
```

Open:

```text
http://127.0.0.1:5000/
```

## Dataset Analysis

Guardian can analyze transaction datasets uploaded as CSV files.

The upload system can detect the following fields:

- User / Customer
- Recipient / Payee
- Amount
- Timestamp / Date

An optional transaction ID can also be provided.

The dashboard supports filtering results by:

- All
- High
- Medium
- Low

An analysis report can also be downloaded from the dashboard.

## Reset Demo

The dashboard includes a reset option for clearing demonstration data.

The reset utility can also be run with:

```bash
python tools/reset_demo.py
```

This clears demo events, alerts, and reviewer actions while keeping the database structure intact.

## Security and Responsible Use

Guardian is a buildathon prototype and has deliberately limited scope.

- Uses synthetic/demo transaction data
- Does not process real customer funds
- Does not make real financial decisions
- Does not freeze or reverse real payments
- Approve / Reject affects demo state only
- Company and family alerts are simulated
- RazorpayX integration is simulated
- AI Review Assistant runs locally
- Evaluation results use synthetic data

A production system would require additional security controls, privacy protections, model monitoring, reliability testing, regulatory review, and verified payment-provider integrations.

## Buildathon

Built for the **Razorpay AI Buildathon — Open Track**.

Guardian explores how payment behavior, anomaly detection, explainable risk scoring, and human review can work together to provide an additional safety layer for vulnerable customers.

## Project Structure

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
├── static/
├── templates/
└── tools/
```

## Author

**Piyush Tandale**

**GitHub:** [piyushT3003](https://github.com/piyushT3003)

**Repository:** [Guardian-Payment-Safety](https://github.com/piyushT3003/Guardian-Payment-Safety)

**Live Demo:** [Guardian](https://web-production-d829f.up.railway.app)
