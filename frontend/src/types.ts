export type PageView =
  | 'landing'
  | 'dashboard'
  | 'analyze'
  | 'monitoring'
  | 'customer'
  | 'analytics'
  | 'reports'
  | 'settings'
  | 'results'
  | 'audit';

export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type TransactionStatus =
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'CLEAR'
  | 'ON_HOLD_BY_GUARDIAN'
  | 'GUARDIAN_VERIFIED'
  | 'PENDING_GUARDIAN_APPROVAL'
  | 'ACCIDENTALLY_APPROVED'
  | 'RECOVERY_REQUESTED'
  | 'RECOVERED'
  | 'WINDOW_EXPIRED'
  | 'RECOVERY_DENIED';

export interface GeoPoint {
  lat: number;
  lon: number;
  city: string;
  country: string;
  ip?: string;
  isp?: string;
  device?: string;
  entity?: string;
  label?: string;
}

export interface GeoRouteData {
  origin: GeoPoint;
  destination: GeoPoint;
  distance_km: number;
  geofence_status: 'NORMAL' | 'SUSPICIOUS' | 'CRITICAL';
  geofence_details: string;
  latency_ms: number;
}

export interface Transaction {
  transaction_id: string;
  user_id: string;
  customer_name?: string;
  payee: string;
  amount: number;
  risk_score: number;       // 0.00 to 1.00 for display or 0-100
  risk_score_raw?: number;   // 0-100 integer
  risk_level: RiskLevel;
  reason: string;
  reasons?: string[];
  status: TransactionStatus;
  payment_method?: string;
  location?: string;
  device?: string;
  created_at: string;
  geo_route?: GeoRouteData;
  // Elderly Payment Protection fields
  elderly_name?: string;
  elderly_age?: number;
  guardian_name?: string;
  guardian_relation?: string;
  guardian_phone?: string;
  guardian_status?: string;
  guardian_notes?: string;
  scam_category?: string;
  ai_explanation?: string;
  // 5-Minute Emergency Recovery fields
  recovery_status?: 'NONE' | 'AVAILABLE' | 'REQUESTED' | 'RECOVERED' | 'DENIED' | string;
  recovery_requested_at?: string;
  recovery_expires_at?: string;
  recovery_executed_at?: string;
  recovery_notes?: string;
}

export interface ElderlyScenario {
  step: number;
  title: string;
  tx_id: string;
  user_id: string;
  elderly_name: string;
  elderly_age: number;
  guardian_name: string;
  guardian_relation: string;
  guardian_phone: string;
  payee: string;
  amount: number;
  payment_method: string;
  origin_city: string;
  dest_city: string;
  distance_km: number;
  risk_score: number;
  risk_level: RiskLevel;
  status: string;
  scam_category: string;
  ai_explanation: string;
}

export interface GuardianPendingAlert {
  id: number;
  transaction_id: string;
  user_id: string;
  title: string;
  message: string;
  status: string;
  created_at: string;
  recipient_role: string;
  recipient_name: string;
  recipient_phone: string;
  elderly_name: string;
  elderly_age: number;
  amount: number;
  payee: string;
  event_status: string;
  risk_score: number;
  scam_category?: string;
  ai_explanation?: string;
  origin_city?: string;
  dest_city?: string;
  distance_km?: number;
  guardian_name?: string;
  guardian_relation?: string;
  guardian_phone?: string;
  recovery_status?: string;
  recovery_expires_at?: string;
  recovery_requested_at?: string;
  recovery_executed_at?: string;
  action_required?: number;
}

export interface ActiveRecoveryRequest {
  transaction_id: string;
  user_id: string;
  elderly_name: string;
  elderly_age?: number;
  guardian_name?: string;
  guardian_phone?: string;
  amount: number;
  payee: string;
  scam_category?: string;
  recovery_status: string;
  recovery_requested_at?: string;
  recovery_expires_at?: string;
  remaining_seconds?: number;
  origin_city?: string;
  dest_city?: string;
  distance_km?: number;
  created_at?: string;
}

export interface AuditAction {
  id: number;
  transaction_id: string;
  action: 'APPROVE' | 'REJECT';
  actor: string;
  notes: string;
  previous_status: string;
  new_status: string;
  amount: number;
  user_id: string;
  customer_name?: string;
  payee: string;
  origin_city?: string;
  destination_city?: string;
  action_hash: string;
  created_at: string;
}

export interface AuditSummary {
  total_actions: number;
  approved_count: number;
  rejected_count: number;
  total_amount_handled: number;
  rejected_amount: number;
  compliance_score: string;
  avg_review_time: string;
}

export interface DashboardKPIs {
  total_transactions: number;
  total_change: string;
  fraud_detected: number;
  fraud_change: string;
  high_risk: number;
  high_risk_change: string;
  protected_amount: string;
  protected_change: string;
}

export interface TrendPoint {
  date: string;
  normal: number;
  fraud: number;
  total: number;
}

export interface RiskDistribution {
  total_fraud_cases: number;
  high_risk_pct: number;
  medium_risk_pct: number;
  low_risk_pct: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
}

export interface CustomerProfile {
  customer_id: string;
  name: string;
  age_group: string;
  registered_since: string;
  verified: boolean;
  phone: string;
  email: string;
  total_transactions: number;
  total_spent: number;
  safety_score: number;
  safety_level: string;
  safety_summary: string;
  trusted_payees: string[];
}

export interface CategoryDistribution {
  name: string;
  percentage: number;
  color: string;
  count: number;
}

export interface AnalyticsKPIs {
  total_fraud_cases: number;
  fraud_rate: string;
  compared_to_previous: string;
  amount_saved: string;
}

export interface ReportCard {
  id: string;
  title: string;
  description: string;
  type: string;
  icon: string;
}

export interface ReportRecord {
  id: string;
  title: string;
  report_type: string;
  date_range: string;
  format: string;
  record_count: number;
  created_at: string;
}

export interface SystemSettings {
  detection_mode: string;
  risk_threshold: number;
  detect_high_value: boolean;
  detect_location_device: boolean;
  generate_explanations: boolean;
  notifications_enabled: boolean;
  alert_high_risk_only: boolean;
  email_alerts: boolean;
  webhook_alerts: boolean;
}

export interface AlertNotification {
  id: number;
  transaction_id: string;
  user_id: string;
  alert_type: string;
  title: string;
  message: string;
  status: 'UNREAD' | 'READ' | 'RESOLVED';
  created_at: string;
}

export interface AnalysisResultData {
  filename: string;
  processing_time: string;
  kpis: {
    total_records: number;
    fraud_detected: number;
    fraud_rate: string;
    model_accuracy: string;
  };
  sample_flagged: Transaction[];
  risk_insights: string[];
}

export type UserRole = 'ADMINISTRATOR' | 'SECURITY_ANALYST' | 'FAMILY_MEMBER' | 'CUSTOMER';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  full_name: string;
  phone: string;
  assigned_customer_id?: string | null;
  permissions: string[];
  is_active: number;
}

export interface SystemHealthData {
  ok: boolean;
  status: string;
  version: string;
  service: string;
  timestamp: string;
  database: {
    engine: string;
    healthy: boolean;
    query_latency_ms: number;
    total_transactions: number;
    held_transactions: number;
    recovered_transactions: number;
  };
  ml_anomaly_engine: {
    status: string;
    model_architecture: string;
    trained_accuracy: {
      precision: number;
      recall: number;
      f1_score: number;
      sequence_catch_rate: string;
      false_positive_rate: number;
    };
  };
  policy_decision_engine: {
    status: string;
    version: string;
    enforcement_mode: string;
  };
  realtime_stream: {
    protocol: string;
    endpoint: string;
    active_clients: number;
    status: string;
  };
  webhook_gateway: {
    endpoint: string;
    verification: string;
    status: string;
  };
  rbac_security: {
    status: string;
    roles: string[];
    hashing_algorithm: string;
  };
  telemetry: {
    api_latency_ms: number;
    server_timezone: string;
  };
}

export interface MLMetricsData {
  status: string;
  model_architecture: {
    name: string;
    version: string;
    anomaly_detector: string;
    parameters: Record<string, any>;
    signals_evaluated: string[];
  };
  dataset_metadata: {
    dataset_file: string;
    total_transactions: number;
    total_users: number;
    actual_scam_transactions: number;
    normal_transactions: number;
    total_scam_sequences: number;
  };
  performance_comparison: {
    baseline_fixed_rule: {
      name: string;
      precision: number;
      recall: number;
      f1_score: number;
      false_positive_rate: number;
      true_positives: number;
      false_positives: number;
      false_negatives: number;
      true_negatives: number;
      sequences_caught: string;
    };
    hybrid_isolation_forest: {
      name: string;
      precision: number;
      recall: number;
      f1_score: number;
      false_positive_rate: number;
      true_positives: number;
      false_positives: number;
      false_negatives: number;
      true_negatives: number;
      sequences_caught: string;
      recall_delta: string;
    };
  };
  confusion_matrix: {
    matrix: number[][];
    labels: string[];
    tn: number;
    fp: number;
    fn: number;
    tp: number;
  };
  sequence_metrics: {
    scam_sequences_total: number;
    scam_sequences_caught: number;
    sequence_catch_rate: number;
    avg_transaction_position_when_caught: number;
    caught_before_final_drain: string;
  };
  scam_scenarios_tested: Array<{
    category: string;
    risk_profile: string;
    detection_triggers: string[];
    policy_outcome: string;
    catch_rate: string;
  }>;
}

