# GUARDIAN — AI PAYMENT SAFETY LAYER

Guardian is an end-to-end AI Payment Safety application developed to protect digital payments, with specialized protection for senior citizens and vulnerable users against digital-arrest scams, impersonation fraud, and high-velocity balance drain attacks.

The application reproduces the authoritative 9-panel visual hierarchy, design system, and element functionality from the reference UI/UX specification.

---

## 9-PANEL APPLICATION OVERVIEW

1. **Landing Page (`/` or `#landing`)**
   - Sticky navbar with brand identity, smooth section scrolling, and "Get Started" CTA.
   - Interactive 3D Guardian Hero powered by Three.js (WebGL 3D Shield, floating credit cards, floating security lock, concentric glowing scan rings, and responsive mouse parallax).
   - "Try Guardian" and "Watch Demo" interactive guided walkthrough.
   - 4 bottom feature cards: Real-time Fraud Detection, Risk Scoring (0–100), Customer Safety Profile, and Actionable Alerts & Reports.
   - Real-time statistics counters and deep-dive technical sections.

2. **Dashboard Overview (`/dashboard` or `#dashboard`)**
   - 4 KPI cards: Total Transactions (12,840), Fraud Detected (248), High Risk (36), and Protected Amount (₹18.4L).
   - Transaction Trend Chart with Normal vs Fraud comparison, hover tooltips, and date filtering.
   - Risk Distribution Donut Chart with 248 cases in center (15% High, 27% Medium, 58% Low).
   - Recently Analysed Transactions quick-review table.

3. **Analyze Transactions (`/analyze` or `#analyze`)**
   - Dual-tab interface: **Upload Dataset** (CSV, XLSX) and **Manual Entry**.
   - Drag-and-drop file dropzone with live validation, record count, and sample dataset preview (`transactions_sample.csv`, 2.4 MB, 10,000 records).
   - Analysis Settings panel: Detection Mode dropdown, Risk Threshold slider (0.70), and toggles for suspicious patterns, risk scoring, and explanations.
   - "Analyze Now" button running actual IsolationForest + heuristic evaluation on the backend.

4. **Fraud Monitoring (`/monitoring` or `#monitoring`)**
   - Search bar across Transaction ID, Customer, Payee, and Amount.
   - Multi-parameter filters: Risk level (All, High, Medium, Low), Date period, and Review status.
   - Interactive investigation table with row inspection.
   - Human-in-the-loop **Approve** and **Reject** review decisions with confirmation dialogs, reviewer notes, and SQLite audit logging.

5. **Customer Safety Profile (`/customer` or `#customer`)**
   - Customer search and detailed profile for **Ramesh Kulkarni (CUST-7821)**, age 60+ (Senior User), registered since Jan 2024.
   - Animated circular Safety Score gauge: **82/100 Safe**.
   - Customer statistics and recent verified transaction history.

6. **Risk Analytics (`/analytics` or `#analytics`)**
   - KPI cards: Total Fraud Cases (248), Fraud Rate (15.2%), Compared to Previous (-21.7%), and Amount Saved (₹18.4L).
   - Fraud Trend Over Time area chart.
   - Fraud by Category Donut Chart: UPI (42%), Card (28%), Wallet (16%), Net Banking (10%), Others (4%).
   - Frequency breakdown of triggered detection reasons.

7. **Reports (`/reports` or `#reports`)**
   - 4 quick-export report cards: Fraud Summary, Customer Risk, Transaction Report, Action Log.
   - Custom report generation form with date range, report type, and format (PDF / CSV).
   - Real downloadable file generation and persistent report history.

8. **Settings (`/settings` or `#settings`)**
   - 4 configuration tabs: Detection Settings, Notification Preferences, User Management, and System Diagnostics.
   - Interactive parameters: Detection mode, threshold slider (0.70), and detection toggles.
   - Settings persisted directly to SQLite database.

9. **Analysis Complete – Results (`/results` or `#results`)**
   - Success state banner: "10,000 transactions analyzed in 12.4 seconds" with celebratory confetti feedback.
   - 4 Result KPI cards: Total Records (10,000), Fraud Detected (248), Fraud Rate (2.48%), Model Accuracy (99.2%).
   - Sample flagged transactions table (TXN-10482, TXN-10475, TXN-10479).
   - Risk Insights bullet cards and navigation actions.

---

## RUNNING THE APPLICATION LOCALLY

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 2. Start Guardian
You can double-click `start_guardian.bat`, or run from terminal:

```powershell
# Activate Python environment
call venv\Scripts\activate

# Launch Flask application
python app.py
```

Open `http://127.0.0.1:5000/` in any modern web browser.

### 3. Run Automated E2E Test Suite

```powershell
python tools\test_guardian_e2e.py
```
This tests all 26 endpoints and database workflows.

### 4. Development Frontend (Optional)

```powershell
cd frontend
npm run dev
```
Runs the Vite dev server at `http://localhost:5173` with automatic API proxying to `http://127.0.0.1:5000`.

---

## ARCHITECTURE & TECH STACK

- **Backend**: Python 3.14, Flask, SQLite with WAL mode, Pandas, Scikit-learn (`IsolationForest`), OpenPyXL.
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Three.js 3D Canvas, Canvas-Confetti.
- **Data Persistence**: SQLite database `guardian.db` storing `events`, `actions`, `uploads`, `alerts`, `settings`, and `reports`.
- **Preloaded Dataset**: `data/transactions_sample.csv` (10,000 records, 248 fraud cases, 99.2% accuracy).
