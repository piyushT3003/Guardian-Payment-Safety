import {
  DashboardKPIs,
  TrendPoint,
  RiskDistribution,
  Transaction,
  CustomerProfile,
  AnalyticsKPIs,
  CategoryDistribution,
  ReportCard,
  ReportRecord,
  SystemSettings,
  AlertNotification,
  AnalysisResultData,
  AuditAction,
  AuditSummary,
  ElderlyScenario,
  GuardianPendingAlert,
  ActiveRecoveryRequest,
  SystemHealthData,
  MLMetricsData,
} from './types';

const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function fetchSystemStatus() {
  const res = await fetch(`${API_BASE}/system/status`);
  return res.json();
}

export async function fetchLandingStats() {
  const res = await fetch(`${API_BASE}/landing/stats`);
  return res.json();
}

export async function fetchDashboardOverview(period = '30d'): Promise<{
  kpis: DashboardKPIs;
  transaction_trend: TrendPoint[];
  risk_distribution: RiskDistribution;
  recent_transactions: Transaction[];
  active_recovery_requests?: ActiveRecoveryRequest[];
}> {
  const res = await fetch(`${API_BASE}/dashboard/overview?period=${period}`);
  if (!res.ok) throw new Error('Failed to fetch dashboard overview');
  return res.json();
}

export async function fetchTransactions(params: {
  search?: string;
  risk?: string;
  status?: string;
  payment_method?: string;
  period?: string;
  page?: number;
  page_size?: number;
}): Promise<{
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  transactions: Transaction[];
}> {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.risk && params.risk !== 'ALL') query.set('risk', params.risk);
  if (params.status && params.status !== 'ALL') query.set('status', params.status);
  if (params.payment_method && params.payment_method !== 'ALL') query.set('payment_method', params.payment_method);
  if (params.period && params.period !== 'ALL') query.set('period', params.period);
  if (params.page) query.set('page', String(params.page));
  if (params.page_size) query.set('page_size', String(params.page_size));

  const res = await fetch(`${API_BASE}/monitoring/transactions?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
}

export async function fetchTransactionDetail(txId: string) {
  const res = await fetch(`${API_BASE}/monitoring/transaction/${txId}`);
  if (!res.ok) throw new Error('Failed to fetch transaction details');
  return res.json();
}

export async function takeTransactionAction(
  txId: string,
  action: 'APPROVE' | 'REJECT',
  actor = 'Piyush Tandale (Admin)',
  notes = ''
) {
  const res = await fetch(`${API_BASE}/events/${txId}/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, actor, notes }),
  });
  if (!res.ok) throw new Error('Failed to record action');
  return res.json();
}

export async function fetchCustomerProfile(customerId: string): Promise<{
  profile: CustomerProfile;
  recent_transactions: Transaction[];
}> {
  const res = await fetch(`${API_BASE}/customers/${customerId}`);
  if (!res.ok) throw new Error('Failed to fetch customer profile');
  return res.json();
}

export async function searchCustomers(q: string): Promise<CustomerProfile[]> {
  const res = await fetch(`${API_BASE}/customers/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error('Failed to search customers');
  return res.json();
}

export async function fetchAnalytics(period = '30d'): Promise<{
  kpis: AnalyticsKPIs;
  fraud_trend: { date: string; cases: number }[];
  fraud_by_category: CategoryDistribution[];
  top_reasons: { reason: string; count: number; percentage: number }[];
}> {
  const res = await fetch(`${API_BASE}/analytics?period=${period}`);
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

export async function fetchReportCards(): Promise<ReportCard[]> {
  const res = await fetch(`${API_BASE}/reports/cards`);
  return res.json();
}

export async function generateReport(params: {
  report_type: string;
  format: string;
  date_range: string;
}): Promise<{
  ok: boolean;
  report_id: string;
  filename: string;
  download_url: string;
  message: string;
}> {
  const res = await fetch(`${API_BASE}/reports/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Failed to generate report');
  return res.json();
}

export async function fetchReportHistory(): Promise<ReportRecord[]> {
  const res = await fetch(`${API_BASE}/reports/history`);
  return res.json();
}

export async function fetchSettings(): Promise<SystemSettings> {
  const res = await fetch(`${API_BASE}/settings`);
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
}

export async function saveSettings(settings: Partial<SystemSettings>): Promise<{
  ok: boolean;
  settings: SystemSettings;
  message: string;
}> {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('Failed to save settings');
  return res.json();
}

export async function uploadDataset(file: File): Promise<AnalysisResultData> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.error || 'Dataset upload failed');
  }
  return data;
}

export async function submitManualTransaction(tx: {
  transaction_id?: string;
  user_id: string;
  amount: number;
  created_at?: string;
  payee: string;
  payment_method?: string;
  location?: string;
  device?: string;
  origin_lat?: number;
  origin_lon?: number;
  dest_city?: string;
  dest_lat?: number;
  dest_lon?: number;
  accuracy_meters?: number;
  elderly_name?: string;
  elderly_age?: number;
  guardian_name?: string;
  guardian_phone?: string;
}) {
  const res = await fetch(`${API_BASE}/transaction/manual`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tx),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.error || 'Failed to submit transaction');
  }
  return data;
}

export async function ingestTransaction(payload: {
  transaction_id?: string;
  user_id: string;
  amount: number;
  payee: string;
  created_at?: string;
  payment_method?: string;
  location?: string;
  origin_city?: string;
  origin_lat?: number;
  origin_lon?: number;
  dest_city?: string;
  dest_lat?: number;
  dest_lon?: number;
  accuracy_meters?: number;
  elderly_name?: string;
  elderly_age?: number;
  guardian_name?: string;
  guardian_phone?: string;
}) {
  const res = await fetch(`${API_BASE}/transactions/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.error || 'Failed to ingest transaction');
  }
  return data;
}

export async function fetchNotifications(): Promise<{
  unread_count: number;
  notifications: AlertNotification[];
}> {
  const res = await fetch(`${API_BASE}/notifications`);
  return res.json();
}

export async function markNotificationsRead() {
  const res = await fetch(`${API_BASE}/notifications/mark-read`, {
    method: 'POST',
  });
  return res.json();
}

export async function runDemoScenario() {
  const res = await fetch(`${API_BASE}/demo/scenario`, {
    method: 'POST',
  });
  return res.json();
}

export async function resetDemoData() {
  const res = await fetch(`${API_BASE}/demo/reset`, {
    method: 'POST',
  });
  return res.json();
}

export async function fetchDemoScenarios(): Promise<{
  ok: boolean;
  total_steps: number;
  scenarios: ElderlyScenario[];
}> {
  const res = await fetch(`${API_BASE}/demo/scenarios`);
  if (!res.ok) throw new Error('Failed to fetch demo scenarios');
  return res.json();
}

export async function emitDemoStep(stepIndex?: number): Promise<{
  ok: boolean;
  step_index: number;
  total_steps: number;
  scenario_title: string;
  transaction_id: string;
  amount: number;
  risk_score: number;
  risk_level: string;
  status: string;
  elderly_name: string;
  elderly_age: number;
  guardian_name: string;
  guardian_relation: string;
  scam_category: string;
  ai_explanation: string;
  alerts: any[];
}> {
  const res = await fetch(`${API_BASE}/demo/emit-step`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(stepIndex !== undefined ? { step_index: stepIndex } : {}),
  });
  if (!res.ok) throw new Error('Failed to emit demo step');
  return res.json();
}

export async function clearDemoData(): Promise<{ ok: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/demo/clear`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to clear demo data');
  return res.json();
}

export async function loadTemplateSampleData(): Promise<{ ok: boolean; message: string; count: number }> {
  const res = await fetch(`${API_BASE}/demo/load-template-sample`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to load template sample data');
  return res.json();
}

export async function takeGuardianAction(
  txId: string,
  action: 'HOLD' | 'ALLOW',
  guardianName = 'Aditya Kulkarni (Son)',
  notes = ''
) {
  const res = await fetch(`${API_BASE}/events/${txId}/guardian-action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, guardian_name: guardianName, notes }),
  });
  if (!res.ok) throw new Error('Failed to record guardian action');
  return res.json();
}

export async function fetchPendingGuardianAlerts(): Promise<{
  ok: boolean;
  pending_alerts: GuardianPendingAlert[];
}> {
  const res = await fetch(`${API_BASE}/alerts/guardian-pending`);
  if (!res.ok) throw new Error('Failed to fetch guardian pending alerts');
  return res.json();
}

export async function fetchAuditTrail(params: {
  page?: number;
  page_size?: number;
  action?: string;
  q?: string;
}): Promise<{
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  actions: AuditAction[];
  summary: AuditSummary;
}> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.page_size) query.set('page_size', String(params.page_size));
  if (params.action && params.action !== 'ALL') query.set('action', params.action);
  if (params.q) query.set('q', params.q);

  const res = await fetch(`${API_BASE}/audit-trail?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch audit trail');
  return res.json();
}

export function getAuditTrailExportUrl(): string {
  return `${API_BASE}/audit-trail/export`;
}

export async function fetchGeoRoutes(params?: {
  type?: string;
  limit?: number;
}): Promise<{
  total: number;
  routes: Transaction[];
}> {
  const query = new URLSearchParams();
  if (params?.type) query.set('type', params.type);
  if (params?.limit) query.set('limit', String(params.limit));

  const res = await fetch(`${API_BASE}/geo/routes?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch geo routes');
  return res.json();
}

// ---------------------------------------------------------------------
// Dedicated Demo Scenario 1 & Scenario 2 Execution
// ---------------------------------------------------------------------

export async function runDemoScenario1(step?: number): Promise<{
  ok: boolean;
  scenario: number;
  step?: number;
  total_steps?: number;
  scenario_name?: string;
  transaction_id: string;
  amount: number;
  status: string;
  risk_score: number;
  risk_level: string;
  elderly_name: string;
  guardian_name?: string;
  scam_category: string;
  ai_explanation: string;
  fraud_detected?: boolean;
  message: string;
}> {
  const res = await fetch(`${API_BASE}/demo/scenario-1`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(step !== undefined ? { step } : {}),
  });
  if (!res.ok) throw new Error('Failed to run Demo Scenario 1');
  return res.json();
}

export async function runDemoScenario2(step?: number): Promise<{
  ok: boolean;
  scenario: number;
  step?: number;
  total_steps?: number;
  scenario_name?: string;
  transaction_id: string;
  amount: number;
  status: string;
  risk_score: number;
  risk_level: string;
  elderly_name: string;
  guardian_name?: string;
  scam_category: string;
  ai_explanation: string;
  fraud_detected?: boolean;
  message: string;
}> {
  const res = await fetch(`${API_BASE}/demo/scenario-2`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(step !== undefined ? { step } : {}),
  });
  if (!res.ok) throw new Error('Failed to run Demo Scenario 2');
  return res.json();
}

// ---------------------------------------------------------------------
// 5-Minute Emergency Rapid Recall / Recovery Endpoints
// ---------------------------------------------------------------------

export async function accidentalApproveTransaction(txId: string): Promise<{
  ok: boolean;
  transaction_id: string;
  status: string;
  recovery_status: string;
  recovery_expires_at: string;
  recovery_window_seconds: number;
  action_hash: string;
  message: string;
}> {
  const res = await fetch(`${API_BASE}/events/${txId}/accidental-approve`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to mark transaction as accidentally approved');
  return res.json();
}

export async function requestEmergencyRecovery(txId: string): Promise<{
  ok: boolean;
  transaction_id: string;
  status: string;
  recovery_status: string;
  action_hash: string;
  message: string;
}> {
  const res = await fetch(`${API_BASE}/events/${txId}/request-recovery`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to request emergency recovery');
  return res.json();
}

export async function executeEmergencyRecovery(
  txId: string,
  actor = 'Piyush Tandale (Admin)',
  notes = 'Emergency inter-bank clawback executed under RBI/NPCI 5-minute rapid recall protocol. Full balance restored.'
): Promise<{
  ok: boolean;
  transaction_id: string;
  status: string;
  recovery_status: string;
  action_hash: string;
  amount_recovered: number;
  message: string;
}> {
  const res = await fetch(`${API_BASE}/events/${txId}/execute-recovery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actor, notes }),
  });
  if (!res.ok) throw new Error('Failed to execute emergency recovery');
  return res.json();
}

export async function denyEmergencyRecovery(
  txId: string,
  actor = 'Piyush Tandale (Admin)',
  notes = 'Recovery request denied following secondary verification.'
): Promise<{
  ok: boolean;
  transaction_id: string;
  action_hash: string;
  message: string;
}> {
  const res = await fetch(`${API_BASE}/events/${txId}/deny-recovery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actor, notes }),
  });
  if (!res.ok) throw new Error('Failed to deny recovery');
  return res.json();
}

// ---------------------------------------------------------------------
// Auth & RBAC Endpoints
// ---------------------------------------------------------------------

export async function fetchAuthMe() {
  const res = await fetch(`${API_BASE}/auth/me`);
  if (!res.ok) throw new Error('Failed to fetch auth me');
  return res.json();
}

export async function switchUserRole(role: string, userId?: string) {
  const res = await fetch(`${API_BASE}/auth/switch-role`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role, user_id: userId }),
  });
  if (!res.ok) throw new Error('Failed to switch role');
  return res.json();
}

// ---------------------------------------------------------------------
// Observability & ML Benchmark Endpoints
// ---------------------------------------------------------------------

export async function fetchSystemHealth(): Promise<SystemHealthData> {
  const res = await fetch(`${API_BASE}/system/health`);
  if (!res.ok) throw new Error('Failed to fetch system health');
  return res.json();
}

export async function fetchMLMetrics(): Promise<MLMetricsData> {
  const res = await fetch(`${API_BASE}/ml/metrics`);
  if (!res.ok) throw new Error('Failed to fetch ML metrics');
  return res.json();
}


