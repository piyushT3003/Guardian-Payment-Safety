# 🛡️ Guardian — Payment Safety Layer

Guardian is a payment-behavior safety layer designed to help identify suspicious transaction patterns affecting elderly and vulnerable customers.

The system combines behavioral rules, anomaly detection, sequence analysis, explainable risk scoring, alerts, and human review in a single dashboard.

---

## 🚀 Live Demo

👉 **[Open Guardian Live Demo](https://web-production-d829f.up.railway.app)**

The live demo uses synthetic transaction data. No real payments or customer funds are involved.

---

## 🎯 Problem

Some payment scams do not look suspicious when transactions are viewed individually. A scam can develop over several transactions:

**New recipient → small test payment → repeated payment → large transfer**

This makes sequence and behavioral context important when assessing transaction risk.

Guardian focuses on this pattern by looking at the customer's previous behavior as well as the current transaction.

---

## 💡 Solution

Guardian analyzes payment behavior using multiple signals:

- New-recipient detection
- Rapid payment / burst detection
- Personalized amount anomaly detection
- Isolation Forest behavioral anomaly detection
- Scam sequence analysis
- Explainable 0–100 risk scoring
- LOW / MEDIUM / HIGH risk classification
- Company security alerts
- Trusted family contact alerts
- Local AI Review Assistant
- Human-in-the-loop Approve / Reject workflow
- SQLite audit trail

Guardian is designed to support human decision-making rather than automatically moving, reversing, or freezing real money.

---

## 🏗️ Architecture

```text
Payment Event
      ↓
Demo / Synthetic Data OR RazorpayX-style Webhook
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
Explainable Risk Score (0–100)
      ↓
LOW / MEDIUM / HIGH
      ↓
HIGH RISK
      ↓
Company Security Alert + Trusted Family Alert
      ↓
AI Review Assistant
      ↓
Human Approve / Reject
      ↓
SQLite Audit Trail
```

### Architecture Flow

1. A payment event enters Guardian through synthetic/demo data or the simulated RazorpayX-style webhook.
2. The Guardian Risk Engine evaluates the transaction against the customer's previous activity.
3. Multiple behavioral and anomaly signals are evaluated.
4. The signals are combined into an explainable 0–100 risk score.
5. HIGH-risk transactions are moved to investigation and generate simulated company and trusted-family alerts.
6. The local AI Review Assistant summarizes the case and provides a recommendation.
7. A human reviewer can Approve or Reject the case.
8. The final decision is recorded in the SQLite audit trail.

---

## 🚨 Scam Sequence Detection

Guardian is designed to identify scam sequences rather than looking only at isolated transactions.

Example:

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

The investigation view allows the reviewer to inspect:

- Detected signals
- Risk score
- Risk score breakdown
- Pattern timeline
- Scam sequence playback
- Recipient profile
- Customer safety profile
- AI Review Assistant
- Company security alert
- Trusted family alert
- Human review controls

---

## 🔍 Risk Detection

Guardian combines rule-based behavioral signals with machine-learning anomaly detection.

### New Payee Detection

Identifies payments to recipients that have not previously appeared in the customer's transaction history.

### Burst / Velocity Detection

Looks for multiple payments to the same recipient within a short period.

### Personalized Amount Analysis

Compares the current amount with the customer's previous payment behavior to identify unusually large transactions.

### Isolation Forest

Guardian uses **Isolation Forest** for behavioral anomaly detection.

The model helps identify transaction behavior that differs from the customer's normal activity.

### Explainable Risk Score

The individual signals contribute to a **0–100 risk score**.

Risk levels:

- **LOW** — lower observed risk
- **MEDIUM** — requires additional attention
- **HIGH** — sent to human review

The dashboard displays the detected signals so the reviewer can understand why a transaction was flagged.

---

## 🤖 AI Review Assistant

Guardian includes a local AI-style review assistant that generates a structured review of a flagged transaction.

It provides:

- Assessment
- Summary
- Risk reasons
- Recommended action
- Confidence

The assistant is deterministic and runs locally within the application. No paid LLM API is required for the demo.

---

## 👤 Human-in-the-Loop Review

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

The Approve and Reject actions change the state of the demonstration case only.

No real payment is frozen, reversed, transferred, or modified.

---

## 🔔 Alerts

For high-risk cases, Guardian creates simulated alerts for:

### Company Security Team

Provides the simulated security team with the transaction and risk information needed for investigation.

### Trusted Family Contact

Provides a simulated trusted-family notification preview for a vulnerable customer.

These alerts are local demonstrations and do not send real-world messages.

---

## 📊 Evaluation Results

Guardian was evaluated using a synthetic dataset containing:

- **50 users**
- **Age range:** 60–85
- **90 days of transaction history**
- **1,381 transactions**
- **20% synthetic scam rate**
- **35 scam transactions**

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

### Robustness Test

Guardian caught **90/90 synthetic scam sequences** across six tested sequence variants.

A limitation was observed for single-test and direct-drain scenarios: without a preceding behavioral signal, detection can occur only when the large drain transaction itself appears.

These results are based on synthetic/demo data and should not be interpreted as real-world financial performance.

---

## 🧪 Demo Scenario

The built-in demo creates a simple scam progression:

```text
₹200    → LOW
₹500    → HIGH
₹45,000 → HIGH
```

This demonstrates the complete Guardian workflow:

**Transaction → Detection → Risk Score → Investigation → Alerts → AI Review → Human Decision → Audit Trail**

---

## 🖥️ Dashboard Features

The Guardian dashboard includes:

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
- Company Security Team Alert
- Trusted Family Contact Alert
- Approve / Reject controls
- Risk Trend
- Recent Alerts
- Demo & Test scenarios
- CSV Dataset Upload
- Dataset Analysis
- All / High / Medium / Low filters
- Download Dataset Analysis Report
- Reset Dataset
- Audit Trail

---

## 🧰 Tech Stack

### Backend

- Python
- Flask
- Gunicorn
- SQLite

### AI / ML

- scikit-learn
- Isolation Forest
- Behavioral anomaly detection
- Explainable rule-based risk scoring

### Frontend

- HTML
- CSS
- JavaScript

### Security

- HMAC-SHA256 webhook signature verification
- Audit trail
- Human-in-the-loop review

### Deployment

- Railway

---

## 💳 RazorpayX-style Webhook Simulation

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

This is a simulated integration for the buildathon prototype and is not a live production Razorpay integration.

No live Razorpay payment credentials are required.

---

## 🚀 Deployment

Guardian is deployed as a live demo on Railway.

👉 **[Open Guardian Live Demo](https://web-production-d829f.up.railway.app)**

The application runs using:

```text
Gunicorn
    ↓
Flask Application
    ↓
Guardian Risk Engine
```

The hosted prototype uses SQLite for demo events, alerts, actions, and audit information.

---

## 💻 Run Locally

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

Install dependencies:

```bash
pip install -r requirements.txt
```

Start Guardian:

```bash
python app.py
```

Open the dashboard:

```text
http://127.0.0.1:5000/
```

---

## 📂 CSV Dataset Analysis

Guardian supports CSV upload and automatic column detection for:

- User / Customer
- Recipient / Payee
- Amount
- Timestamp / Date

An optional transaction ID can also be provided.

The uploaded dataset is analyzed using the Guardian risk engine and the results are displayed in the dashboard.

The analysis supports:

- All
- High
- Medium
- Low

An analysis report can also be downloaded from the dashboard.

---

## 🧹 Clean Demo Reset

Guardian provides a reset option from the dashboard.

You can also run:

```bash
python tools/reset_demo.py
```

The reset clears demo events, alerts, and reviewer actions without deleting the database schema.

---

## 🔐 Security & Responsible AI

Guardian is intentionally designed as a safety-focused prototype.

- Uses synthetic/demo transaction data
- Does not process real customer funds
- Does not make real financial decisions
- Does not freeze or reverse real payments
- Approve / Reject changes demo state only
- Company and family notifications are simulated
- RazorpayX integration is simulated
- AI Review Assistant is local and deterministic
- Evaluation results are based on synthetic data
- No real-world financial performance claims are made

Guardian is a **buildathon prototype, not a production financial-security system**.

A production implementation would require additional security controls, privacy safeguards, model monitoring, human-review policies, regulatory considerations, reliability testing, and verified payment-provider integrations.

---

## 🎯 Buildathon Context

Guardian was built for the **Razorpay AI Buildathon — Open Track**.

The project focuses on a real-world payment safety problem and demonstrates how behavioral analytics, machine learning, explainable risk scoring, alerts, and human review can work together as a payment safety layer.

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
├── static/
├── templates/
└── tools/
```

---

## 👨‍💻 Author

**Piyush Tandale**

**GitHub:** [piyushT3003](https://github.com/piyushT3003)

**Repository:** [Guardian-Payment-Safety](https://github.com/piyushT3003/Guardian-Payment-Safety)

**Live Demo:** [Guardian](https://web-production-d829f.up.railway.app)

---

## 📌 Final Demo Flow

```text
Payment Event
      ↓
Guardian Detection
      ↓
Scam Pattern
      ↓
Risk Score
      ↓
Company + Family Alert
      ↓
AI Review Assistant
      ↓
Human Approve / Reject
      ↓
Audit Trail
```

**Guardian — AI-powered payment safety for vulnerable customers.**
