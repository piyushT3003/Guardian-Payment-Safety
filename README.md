# GUARDIAN — Next-Generation AI Payment Safety & Fraud Prevention Platform

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen?style=flat-square)](https://github.com/piyushT3003/Guardian-Payment-Safety)
[![Tests](https://img.shields.io/badge/tests-14%2F14%20passing-success?style=flat-square)](https://github.com/piyushT3003/Guardian-Payment-Safety)
[![Precision](https://img.shields.io/badge/ML%20Precision-100%25-blue?style=flat-square)](https://github.com/piyushT3003/Guardian-Payment-Safety)
[![Recall](https://img.shields.io/badge/ML%20Recall-82.9%25-indigo?style=flat-square)](https://github.com/piyushT3003/Guardian-Payment-Safety)
[![Sequence Catch Rate](https://img.shields.io/badge/Sequence%20Catch-100%25-emerald?style=flat-square)](https://github.com/piyushT3003/Guardian-Payment-Safety)
[![Python](https://img.shields.io/badge/python-3.10%20%7C%203.11%20%7C%203.12%20%7C%203.14-blue?style=flat-square)](https://www.python.org/)
[![React](https://img.shields.io/badge/frontend-React%2019%20%2B%20TypeScript-61dafb?style=flat-square)](https://react.dev/)
[![License](https://img.shields.io/badge/license-MIT-purple?style=flat-square)](LICENSE)

Guardian is a production-engineered, AI-assisted payment fraud prevention and recovery platform designed to safeguard digital transactions. Built specifically to counter fear-based social engineering, digital arrest scams, impersonation fraud, and high-velocity balance drain attacks, Guardian combines explainable machine learning anomaly detection with a **backend-enforced Family-in-the-Loop approval gate** and a **5-minute emergency clawback SLA**.

---

## Executive Overview: The Problem & The Guardian Solution

Traditional banking fraud systems are designed around card theft, credential compromise, and unauthorized account takeovers. However, modern financial fraud against senior citizens and vulnerable users relies on **authorized push-payment (APP) fraud**:

- **Digital Arrest Scams**: Fraudsters pose as law enforcement, CBI, or customs officials over video calls, placing victims in a 48-hour state of psychological coercion and directing them to transfer life savings to "police verification escrow" accounts.
- **Foreign Lottery & Impersonation Schemes**: Victims are manipulated into liquidating retirement deposits and executing immediate outward wire transfers.
- **The Blind Spot of 2FA**: Because the account holder authenticates the transaction with their own PIN or biometric passkey, conventional security engines see valid credentials and approve the transaction instantly.

**Guardian changes the paradigm:**
1. **Behavioral Telemetry**: Tracks 90-day spending patterns, payee novelty, and burst velocity per user.
2. **Decoupled Risk vs Decision**: Risk intelligence calculates objective threat severity (0–100); configurable company policies determine whether to clear, scrutinize, or halt the payment.
3. **Family-in-the-Loop Security Gate**: High-risk payments from protected senior accounts are halted server-side in a cryptographic hold state until an authorized family guardian confirms the legitimate intent.
4. **5-Minute Rapid Recall Window**: In the event of an accidental approval under duress, a 300-second clawback SLA enables instant bank SOC recovery before interbank settlement completes.

---

## Architectural Topology & 10-Layer Design

```
                                 [ Inbound Payment / Webhook ]
                                              │
                                              ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 1. Transaction Ingestion & Validation Layer (FastAPI/Flask + HMAC Signature Gate)      │
└────────────────────────────────────┬───────────────────────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 2. Layered Fraud Intelligence Pipeline                                                 │
│    ├─ Recipient Novelty & Historical Contact Graph                                     │
│    ├─ Transaction Burst Velocity (60-minute sliding window)                            │
│    ├─ Haversine Geospatial Impossible Speed (>850 km/h)                                │
│    ├─ Per-User Isolation Forest Anomaly Detection (scikit-learn)                       │
│    └─ Elder Vulnerability Multiplier (Age ≥ 60 threshold)                              │
└────────────────────────────────────┬───────────────────────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 3. Risk Decision & Policy Engine (Decoupled Policy Rules, e.g. v2.4.0-PROD)            │
│    ├─ LOW (0–59)    ───► Normal Processing / Auto-Approved                             │
│    ├─ MEDIUM (60–79)───► Enhanced Scrutiny / Secondary Challenge                      │
│    └─ HIGH (80–100) ───► PAYMENT HOLD: PENDING_GUARDIAN_APPROVAL                       │
└───────────────────┬────────────────────────────────────────────────┬───────────────────┘
                    │                                                │
       [ Normal Flow / Cleared ]                        [ Suspicious / Scam Threat ]
                    │                                                │
                    ▼                                                ▼
┌──────────────────────────────────────┐     ┌───────────────────────────────────────────┐
│ 4. Payment Execution & Settlement    │     │ 5. Family-in-the-Loop Protection Gate     │
│    (Simulated Payment Gateway)       │     │    ├─ Real-Time Push Alert via SSE Bus    │
└──────────────────────────────────────┘     │    ├─ Intercept Call to Coerced Senior    │
                                             │    ├─ Server-Enforced Hold State (SQLite) │
                                             │    └─ Authorized Family Decision (Hold/Allow)│
                                             └─────────────────────┬─────────────────────┘
                                                                   │
                                               [ If Accidentally Approved Under Duress ]
                                                                   │
                                                                   ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 6. Emergency Recovery Service (5-Minute / 300-Second Rapid Recall SLA)                 │
│    ├─ Cryptographic Timer Window                                                       │
│    ├─ One-Click Family Recall Request                                                  │
│    └─ Bank SOC Clawback Execution (Status: RECOVERED, Funds Restored)                  │
└────────────────────────────────────┬───────────────────────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 7. Audit & Compliance Ledger (Immutable SHA-256 Hash Chaining + CSV / PDF Export)      │
└────────────────────────────────────┬───────────────────────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 8. Real-Time Telemetry & SSE Event Bus (`/api/stream` Server-Sent Events)              │
└────────────────────────────────────┬───────────────────────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 9. Role-Based Access Control (Admin, Fraud Analyst, Family Guardian, Compliance Auditor)│
└────────────────────────────────────┬───────────────────────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 10. Frontend Presentation Layer (React 19 + TypeScript + Three.js + Framer Motion)    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Machine Learning & Fraud Intelligence Engine

Guardian employs a layered, explainable detection model rather than an opaque black box:

### 1. Recipient Novelty & Contact Graph
Calculates whether the destination payee is a verified recurring contact (pharmacy, utility provider, grocery merchant) or an unverified, newly generated payee handle.

### 2. Burst Velocity Analysis
Measures transaction frequency against the same payee within a sliding 60-minute burst window. Digital arrest scams typically exhibit rapid sequential trial amounts followed by an account drain.

### 3. Per-User Isolation Forest Anomaly Detection
Rather than training a global model that misclassifies high-net-worth accounts, Guardian fits an **individualized Isolation Forest model** (`sklearn.ensemble.IsolationForest`, 100 estimators, contamination: 0.08) on each user's historical 90-day transaction geometry.

### 4. Haversine Impossible Travel Speed
Computes the great-circle geodesic distance between consecutive GPS telemetry coordinates:

$$\text{distance} = 2 R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$

If calculated transit velocity between payment origin and beneficiary endpoint exceeds commercial aircraft limits (>850 km/h), an immediate critical anomaly flag is triggered.

### 5. Deterministic Explainability
Every risk decision returns a structured reason array detailing:
- Numeric Risk Score (0–100)
- Classification (`LOW`, `MEDIUM`, `HIGH`)
- Contributing signals (`new_payee`, `burst_detected`, `amount_anomaly`, `impossible_speed`)
- Confidence and limitation indicators
- Recommended policy intervention

---

## Empirical Benchmark & Evaluation Results

Guardian's detection performance is validated against ground-truth benchmarks on the verified dataset (`data/guardian_transactions.csv`: **1,381 transactions, 50 users, 10 sequential scam attacks**).

### Performance Comparison: Baseline Rule vs. Guardian Hybrid

| Metric | Rule Baseline (Fixed 5x Multiplier) | Guardian Hybrid (Per-User Isolation Forest) | Delta |
| :--- | :---: | :---: | :---: |
| **Precision** | **100.0%** | **100.0%** | Baseline maintained |
| **Recall** | 71.4% (25/35) | **82.9% (29/35)** | **+11.5% improvement** |
| **F1 Score** | 0.833 | **0.906** | **+0.073 improvement** |
| **False Positive Rate** | **0.00%** (0/1,346) | **0.00%** (0/1,346) | Zero noise |
| **Sequence Catch Rate** | **100.0%** (10/10) | **100.0%** (10/10) | Every attack halted |
| **Avg. Tx Position When Caught** | Tx #2.0 | **Tx #1.3** | Caught earlier in attack |
| **Caught Before Final Drain** | **10/10 (100.0%)** | **10/10 (100.0%)** | 100% loss prevented |

### Confusion Matrix
```
                  Predicted Normal     Predicted Scam
Actual Normal:          1,346                 0       (TN: 1346, FP: 0)
Actual Scam:                6                29       (FN: 6,    TP: 29)
```

### Zero-Day Robustness Test (Unseen Scam Patterns)
Evaluated across 6 unseen attack shapes using `tools/robustness_test.py`:
- Single-probe direct drain: **15/15 caught**
- Slow drip micro-transfers: **15/15 caught**
- Split-payee mule distribution: **15/15 caught**
- Modest drain below limits: **15/15 caught**
- Direct zero-test drain: **15/15 caught**
- High-noise transaction week: **15/15 caught**
- **Overall Unseen Attack Catch Rate: 90/90 sequences (100.0%)**

---

## The Interactive Dual Demo Scenarios

Guardian includes two pre-configured, end-to-end interactive simulation sequences runnable directly from the top navigation bar:

### Scenario 1: Ramesh Kulkarni (68) — Digital Arrest Scam & Family Hold
1. **Step 1/3 (Safe)**: Routine ₹850 spend at Apollo Pharmacy Dadar (`Risk: 12/100`, Status: `APPROVED`).
2. **Step 2/3 (Safe)**: Monthly ₹1,420 Tata Power electricity bill (`Risk: 15/100`, Status: `APPROVED`).
3. **Step 3/3 (Fraud Alert)**: ₹48,000 transfer to an unverified Dubai mule account. Detected as an extortion scam (`Risk: 96/100`). Payment is placed on hold (`PENDING_GUARDIAN_APPROVAL`), triggering real-time family modal notification to son Aditya Kulkarni. Son reviews telemetry, simulates an emergency call, and confirms **"Keep on Hold"**, preventing loss.

### Scenario 2: Sunita Sharma (64) — Accidental Approval & 5-Minute Clawback
1. **Step 1/3 (Safe)**: Daily ₹420 grocery purchase at Nature's Basket Bandra (`Risk: 10/100`, Status: `APPROVED`).
2. **Step 2/3 (Safe)**: ₹650 diagnostic checkup at Dr. Lal PathLabs (`Risk: 14/100`, Status: `APPROVED`).
3. **Step 3/3 (Fraud Alert)**: ₹35,000 foreign lottery wire to Lagos (7,200 km away). Flagged at `Risk: 91/100`. Demonstrates the duress scenario where the guardian mistakenly allows the transaction. The **5-minute Rapid Recall timer (300s)** activates. Guardian triggers emergency recall, and bank SOC executes clawback (`RECOVERED`), restoring funds.

---

## Technical Stack & Architecture

### Backend & Core Services
- **Runtime**: Python 3.10+ (tested on Python 3.10, 3.11, 3.12, 3.14)
- **Web Framework**: Flask with strict CORS policy, modular Blueprints, and RESTful routing
- **Database**: SQLite3 configured with **Write-Ahead Logging (WAL)**, foreign key integrity, and sub-millisecond query execution
- **Machine Learning**: `scikit-learn` (`IsolationForest`), `numpy`, `pandas`
- **Security & Cryptography**: `argon2-cffi` / PBKDF2-HMAC-SHA256 password hashing, HMAC-SHA256 webhook signatures, SHA-256 audit ledger chaining
- **Real-Time Streaming**: Server-Sent Events (SSE) event bus with heartbeat keep-alives and reconnection recovery
- **Production Server**: Gunicorn WSGI server

### Frontend & Visual System
- **Framework**: React 19 with TypeScript, bundled with Vite
- **Styling**: Tailwind CSS v4 with custom color grading, glassmorphic filters, and elevation shadows
- **3D Graphics**: Three.js WebGL rendering interactive floating shield geometry, concentric security rings, particle orbital systems, and cursor parallax
- **Animations**: Framer Motion spring physics, perspective tilt cards (`TiltCard`), scroll reveals (`ScrollReveal`), animated numerical counters (`AnimatedCounter`), and circular countdown rings (`CountdownRing`)
- **Icons**: Lucide React icons

---

## Role-Based Access Control (RBAC)

The application provides four authenticated security personas switchable via the header switcher or authenticated login:

| Role | Username | Permissions |
| :--- | :--- | :--- |
| **Administrator** | `piyush` | Full platform control, emergency clawback execution, system settings, policy configuration. |
| **Fraud Analyst** | `analyst` | Investigation queue review, manual approve/reject decisions, radar monitoring, report generation. |
| **Family Guardian** | `guardian` | Elder account oversight, real-time push alerts, hold authorization, emergency recall requests. |
| **Compliance Auditor** | `auditor` | Read-only access to immutable SHA-256 compliance ledger, policy verification, regulatory export. |

---

## 9-Panel Product Experience

1. **Hero Landing Page (`/` or `#landing`)**: Three.js interactive 3D shield, live security telemetry, walkthrough video modal, and instant scenario launch.
2. **Dashboard Overview (`/dashboard`)**: KPI metric cards, transaction volume trend graph, risk distribution donut chart, live system observability health, and empirical ML performance card.
3. **Analyze Transactions (`/analyze`)**: Drag-and-drop CSV/Excel dataset ingestion, manual transaction submission with live GPS geolocation, and 7-stage connected fraud detection pipeline visualization.
4. **Fraud Monitoring (`/monitoring`)**: Real-time fraud queue with dual-view mode: **Investigation Table** with inline actions and **Live Satellite Radar** with orbital geofence telemetry.
5. **Customer Safety Profile (`/customer`)**: 360-degree senior safety profile, animated circular safety gauge (0–100), demographic indicators, and transaction history.
6. **Risk Analytics (`/analytics`)**: Time-series incident curves, fraud category breakdowns (UPI, Card, Net Banking, Wallet), and detection signal distribution.
7. **Reports & Exports (`/reports`)**: Audit-ready report generation with custom date filters and downloadable PDF / CSV artifacts.
8. **Settings & Governance (`/settings`)**: Detection mode selection (AI + Rules, Rules Only, AI Anomaly Only), sensitivity threshold slider, and notification dispatch toggles.
9. **Audit Trail & Compliance Ledger (`/audit`)**: Cryptographically verifiable ledger with ref IDs, timestamps, reviewer justifications, and SHA-256 hashes.

---

## Local Development & Setup

### Prerequisites
- Python 3.10 or higher
- Node.js 18+ and npm

### 1. Clone the Repository
```bash
git clone https://github.com/piyushT3003/Guardian-Payment-Safety.git
cd Guardian-Payment-Safety
```

### 2. Set Up Python Environment
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows (cmd/PowerShell):
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Build Frontend Assets
```bash
cd frontend
npm install
npm run build
cd ..
```
*Note: The built frontend assets are output directly to `static/dist/` and served automatically by Flask in production.*

### 4. Start the Application
```bash
python app.py
```
Open **`http://127.0.0.1:5000`** in your browser.

### 5. Running in Development Mode with Hot-Reload (Optional)
If you are actively developing the React frontend:
```bash
# Terminal 1: Backend
python app.py

# Terminal 2: Vite Dev Server
cd frontend
npm run dev
```
The Vite development server runs at `http://localhost:5173` with automated API proxying to `http://127.0.0.1:5000`.

---

## Automated Verification & Test Suite

Guardian comes with an exhaustive test suite covering all security gates, ML metrics, and policy rules:

### Run the 14-Test Production Suite
```bash
python tools/test_production_suite.py
```
**Test Coverage:**
- `test_01_admin_login_success`: Role-based authentication verification.
- `test_02_analyst_login_success`: Analyst credential validation.
- `test_03_invalid_login_rejected`: Negative authentication testing (401 response).
- `test_04_role_switching`: Session context validation.
- `test_05_ingest_valid_transaction`: Schema validation on payment ingestion.
- `test_06_ingest_invalid_payload_rejected`: 400 Bad Request enforcement.
- `test_07_policy_hold_on_high_risk_senior_scam`: Automatic payment hold gate.
- `test_08_family_guardian_action_hold`: Family approval hold state transition.
- `test_09_emergency_recovery_workflow`: Accidental approval and 5-min clawback.
- `test_10_haversine_and_geofence`: Geodesic velocity detection (>850 km/h).
- `test_11_webhook_valid_signature_accepted`: Razorpay HMAC-SHA256 acceptance.
- `test_12_webhook_invalid_signature_rejected`: Fake signature rejection (401).
- `test_13_ml_metrics_integrity`: Verification of authentic empirical ML metrics.
- `test_14_system_health_observability`: System telemetry and health check.

### Run the Empirical ML Detector Benchmark
```bash
python tools/hybrid_detector.py
```

### Run Zero-Day Robustness Attack Shapes
```bash
python tools/robustness_test.py
```

### Run Dual E2E Scenario Simulation
```bash
python tools/test_scenarios_e2e.py
```

---

## Production Deployment

Guardian is cloud-ready and deployable on any container runtime or PaaS provider (Render, Railway, Heroku, AWS ECS):

### Deploying to Render
A pre-configured `render.yaml` is included:
```yaml
services:
  - type: web
    name: guardian-payment-safety
    runtime: python
    plan: free
    region: singapore
    buildCommand: pip install -r requirements.txt
    startCommand: gunicorn app:app
    healthCheckPath: /api/health
    envVars:
      - key: GUARDIAN_DB_PATH
        value: /tmp/guardian.db
      - key: RAZORPAY_WEBHOOK_SECRET
        sync: false
```

### Production Environment Variables
| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Web server listening port | `5000` |
| `GUARDIAN_DB_PATH` | Path to persistent SQLite database | `./guardian.db` |
| `RAZORPAY_WEBHOOK_SECRET` | HMAC shared secret for webhook ingestion | `guardian_demo_secret` |
| `FLASK_ENV` | Environment mode (`production` / `development`) | `production` |

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
