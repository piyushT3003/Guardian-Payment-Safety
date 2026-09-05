# Guardian — Payment Safety Layer

Guardian is a buildathon prototype for explainable payment-behavior safety. It detects suspicious payment behavior, identifies high-risk payment sequences, creates simulated company and trusted-family alerts, provides a local AI-style review summary, and keeps a human reviewer in control.

## 🚀 Live Demo

👉 **[Open Guardian Live Demo](https://web-production-d829f.up.railway.app)**

The live application is deployed on Railway and uses synthetic/demo payment data.

---

## 🎯 Problem

Elderly and vulnerable customers can be targeted by scams that begin with small "test" payments and quickly escalate into large transfers.

Traditional transaction checks may look at individual transactions, while scam behavior can emerge as a sequence:

**New recipient → small test payment → repeated payment → large drain**

Guardian is designed as a safety layer that combines multiple behavioral signals and makes the reason for a high-risk decision visible to a human reviewer.

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
+ Rapid Payment / Burst Detection
+ Personalized Amount Anomaly Detection
+ Isolation Forest Anomaly Detection
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

1. A payment event enters Guardian through synthetic/demo data or the simulated RazorpayX-style payout webhook.
2. The Guardian Risk Engine evaluates the transaction.
3. Multiple behavioral signals are checked, including new recipients, payment bursts, personalized amount anomalies, and Isolation Forest anomalies.
4. The signals are combined into an explainable risk score from 0–100.
5. The transaction is classified as LOW, MEDIUM, or HIGH risk.
6. HIGH-risk transactions are sent for human review and generate simulated company and trusted-family alerts.
7. The local AI Review Assistant summarizes the case and recommends an action.
8. A human reviewer can Approve or Reject the case.
9. The final decision is recorded in the SQLite audit trail.

---

## 🔍 Risk Detection

Guardian combines rule-based behavioral signals with machine-learning anomaly detection.

### New Payee Detection

Detects when a customer makes a payment to a recipient that has not previously appeared in their transaction history.

### Burst / Velocity Detection

Detects rapid or repeated payments to the same recipient within a short period.

### Personalized Amount Anomaly

Compares a transaction amount with the customer's previous payment behavior to identify unusually large or personalized amounts.

### Isolation Forest

Guardian uses **Isolation Forest** for behavioral anomaly detection.

The model is trained using a customer's historical transaction behavior and helps identify transactions that are unusual relative to that customer's normal pattern.

### Explainable Risk Score

Signals are combined into a **0–100 risk score**.

Risk levels:

- **LOW** — lower observed risk
- **MEDIUM** — requires additional attention
- **HIGH** — sent to human review

The dashboard also shows the signals contributing to the risk score so that the decision is explainable.

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

The investigation panel provides:

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

## 🤖 AI Review Assistant

Guardian includes a local deterministic AI-style review assistant.

It provides:

- Assessment
- Case summary
- Risk reasons
- Recommended action
- Confidence

The review assistant does **not** require a paid LLM API or external AI service.

This keeps the buildathon prototype self-contained and reproducible.

---

## 👤 Human-in-the-Loop Review

Guardian does not automatically take financial action.

When a transaction is classified as HIGH risk:

```text
HIGH RISK
    ↓
Human Review
    ↓
┌───────────────┐
│   APPROVE     │
│      OR       │
│    REJECT     │
└───────────────┘
    ↓
Audit Trail
```

Approve / Reject changes the state of the demonstration case only.

No real payment is frozen, reversed, transferred, or modified.

---

## 🔔 Alerts

For high-risk cases, Guardian creates simulated:

### Company Security Alert

Notifies the simulated company security team that a potentially suspicious transaction requires investigation.

### Trusted Family Alert

Provides a simulated trusted-family notification preview for vulnerable customers.

These are local demonstration alerts and do not send real-world messages.

---

## 🧪 Evaluation Results

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
- Responsive fintech-style dashboard

### Security

- HMAC-SHA256 webhook signature verification
- Local simulated alerts
- Audit trail
- Human-in-the-loop review

### Deployment

- Railway
- Gunicorn

---

## 💳 RazorpayX-Style Webhook Simulation

Guardian includes a simulated RazorpayX-style payout webhook endpoint.

The webhook flow demonstrates:

```text
Payout Webhook
      ↓
HMAC-SHA256 Verification
      ↓
Guardian Risk Engine
      ↓
Risk Classification
      ↓
Investigation / Alert / Review
```

This is a **local simulation for the buildathon prototype** and is not a live production Razorpay integration.

No live Razorpay payment credentials are required.

---

## 📊 Dashboard Features

The Guardian dashboard includes:

- Live Transaction Monitor
- Risk KPI cards
- Investigation panel
- Risk score ring
- Detected signals
- Risk Score Breakdown
- Scam Pattern Timeline
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
- Security and Responsible AI information

---

## 🧪 Synthetic Demo Scenario

The built-in demo scenario uses a simple scam progression:

```text
₹200  → LOW
₹500  → HIGH
₹45,000 → HIGH
```

The sequence demonstrates how Guardian can combine:

- New recipient behavior
- Rapid payment behavior
- Unusual payment amount
- Behavioral anomaly detection
- Risk scoring
- Investigation
- Alerts
- Human review
- Audit logging

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

---

## 💻 Run Locally — Windows / VS Code

### 1. Clone or download the repository

Open the project folder in VS Code.

### 2. Create a virtual environment

```bash
python -m venv venv
```

### 3. Activate the virtual environment

```bash
venv\Scripts\activate
```

### 4. Install dependencies

```bash
pip install -r requirements.txt
```

### 5. Start Guardian

```bash
python app.py
```

### 6. Open the dashboard

```text
http://127.0.0.1:5000/
```

---

## 🧹 Clean Demo Reset

Guardian provides a reset option from the dashboard.

You can also run:

```bash
python tools/reset_demo.py
```

The reset clears demo events, alerts, and reviewer actions without deleting the database schema.

---

## 📂 CSV Dataset Analysis

Guardian supports CSV upload and automatic column detection for:

- User / Customer
- Recipient / Payee
- Amount
- Timestamp / Date

An optional transaction ID can also be supplied.

The uploaded dataset is analyzed using the Guardian risk engine and the results are displayed in the dashboard.

The analysis supports:

- All
- High
- Medium
- Low

The dashboard can also generate a downloadable CSV analysis report.

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

The hosted deployment uses SQLite for the prototype database.

For hosted environments, the SQLite database path can be configured using:

```text
GUARDIAN_DB_PATH
```

---

## 🔐 Security & Responsible AI

Guardian is intentionally designed as a safety-focused prototype.

### Current boundaries

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

## 👨‍💻 Author

**Piyush Tandale**

GitHub:  
👉 **[piyushT3003](https://github.com/piyushT3003)**

Project Repository:  
👉 **[Guardian-Payment-Safety](https://github.com/piyushT3003/Guardian-Payment-Safety)**

Live Demo:  
👉 **[Guardian Live Demo](https://web-production-d829f.up.railway.app)**

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
