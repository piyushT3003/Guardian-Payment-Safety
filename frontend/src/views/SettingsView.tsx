import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Bell,
  Users,
  Server,
  Check,
  RotateCcw,
  Shield,
  CheckCircle2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { Header } from '../components/Header';
import { PageView, SystemSettings } from '../types';
import { fetchSettings, saveSettings, fetchSystemStatus } from '../api';
import { TiltCard } from '../components/animations/TiltCard';
import { ScrollReveal } from '../components/animations/ScrollReveal';
import { MagneticButton } from '../components/animations/MagneticButton';

interface SettingsViewProps {
  onNavigate: (view: PageView) => void;
  onOpenNotifications: () => void;
  unreadCount?: number;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onNavigate,
  onOpenNotifications,
  unreadCount = 0,
}) => {
  const [activeTab, setActiveTab] = useState<'detection' | 'notifications' | 'users' | 'system'>('detection');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Detection Settings (Panel 8)
  const [detectionMode, setDetectionMode] = useState('AI + Rules (Recommended)');
  const [riskThreshold, setRiskThreshold] = useState(0.70);
  const [detectHighValue, setDetectHighValue] = useState(true);
  const [detectLocationDevice, setDetectLocationDevice] = useState(true);
  const [generateExplanations, setGenerateExplanations] = useState(true);

  // Notification Preferences
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [webhookAlerts, setWebhookAlerts] = useState(true);
  const [highRiskOnly, setHighRiskOnly] = useState(false);

  // System status
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [isRefreshingSystem, setIsRefreshingSystem] = useState(false);

  useEffect(() => {
    fetchSettings()
      .then((s) => {
        if (s.detection_mode) setDetectionMode(s.detection_mode);
        if (s.risk_threshold !== undefined) setRiskThreshold(s.risk_threshold);
        if (s.detect_high_value !== undefined) setDetectHighValue(s.detect_high_value);
        if (s.detect_location_device !== undefined) setDetectLocationDevice(s.detect_location_device);
        if (s.generate_explanations !== undefined) setGenerateExplanations(s.generate_explanations);
        if (s.email_alerts !== undefined) setEmailAlerts(s.email_alerts);
        if (s.webhook_alerts !== undefined) setWebhookAlerts(s.webhook_alerts);
        if (s.alert_high_risk_only !== undefined) setHighRiskOnly(s.alert_high_risk_only);
      })
      .catch(console.error);

    loadSystem();
  }, []);

  const loadSystem = () => {
    setIsRefreshingSystem(true);
    fetchSystemStatus()
      .then((data) => {
        setSystemInfo(data);
        setIsRefreshingSystem(false);
      })
      .catch(() => setIsRefreshingSystem(false));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      await saveSettings({
        detection_mode: detectionMode,
        risk_threshold: riskThreshold,
        detect_high_value: detectHighValue,
        detect_location_device: detectLocationDevice,
        generate_explanations: generateExplanations,
        email_alerts: emailAlerts,
        webhook_alerts: webhookAlerts,
        alert_high_risk_only: highRiskOnly,
      });
      setSaveMessage('Settings updated successfully and persisted to database.');
      setTimeout(() => setSaveMessage(''), 4000);
      setIsSaving(false);
    } catch (err: any) {
      console.error(err);
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <Header
        title="Settings"
        subtitle="Manage detection rules, thresholds and preferences"
        showPeriodFilter={false}
        unreadCount={unreadCount}
        onOpenNotifications={onOpenNotifications}
      />

      {saveMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in-50">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Main Container Split: Left Sub-Nav Pills + Right Config Panel (Authoritative Panel 8) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sub-Nav Column (4 Cols) */}
        <div className="lg:col-span-4 space-y-2">
          <button
            onClick={() => setActiveTab('detection')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
              activeTab === 'detection'
                ? 'bg-violet-50 text-violet-700 border border-violet-200 shadow-sm'
                : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Detection Settings
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
              activeTab === 'notifications'
                ? 'bg-violet-50 text-violet-700 border border-violet-200 shadow-sm'
                : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Bell className="w-4 h-4" />
            Notification Preferences
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
              activeTab === 'users'
                ? 'bg-violet-50 text-violet-700 border border-violet-200 shadow-sm'
                : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4" />
            User Management
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
              activeTab === 'system'
                ? 'bg-violet-50 text-violet-700 border border-violet-200 shadow-sm'
                : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Server className="w-4 h-4" />
            System
          </button>
        </div>

        {/* Right Content Panel (8 Cols) with 3D Tilt */}
        <ScrollReveal direction="up" className="lg:col-span-8">
          <TiltCard maxTilt={3} glare={false} className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-6">
            {activeTab === 'detection' && (
              /* Detection Settings Form (Authoritative Panel 8) */
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    Detection Settings
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure fraud detection parameters
                  </p>
                </div>

                {/* Detection Mode */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Detection Mode
                  </label>
                  <select
                    value={detectionMode}
                    onChange={(e) => setDetectionMode(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 shadow-sm cursor-pointer"
                  >
                    <option value="AI + Rules (Recommended)">AI + Rules (Recommended)</option>
                    <option value="Rules Only">Rules Only</option>
                    <option value="AI Anomaly Only">AI Anomaly Only</option>
                  </select>
                </div>

                {/* Risk Threshold Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700">Risk Threshold</span>
                    <span className="text-violet-600 font-mono text-sm">
                      {riskThreshold.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.30"
                    max="0.95"
                    step="0.05"
                    value={riskThreshold}
                    onChange={(e) => setRiskThreshold(parseFloat(e.target.value))}
                    className="w-full accent-violet-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                  />
                </div>

                {/* Toggles (Exact from Panel 8) */}
                <div className="space-y-4 pt-2">
                  {/* Toggle 1: Detect high-value transactions */}
                  <label className="flex items-center justify-between cursor-pointer py-1">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Detect high-value transactions
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Flag transactions exceeding historical moving averages
                      </span>
                    </div>
                    <div
                      onClick={() => setDetectHighValue(!detectHighValue)}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                        detectHighValue ? 'bg-violet-600' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                          detectHighValue ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </label>

                  {/* Toggle 2: Detect unusual location / device */}
                  <label className="flex items-center justify-between cursor-pointer py-1">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Detect unusual location / device
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Analyze geofence jumps, proxy IP ranges and rooted hardware fingerprints
                      </span>
                    </div>
                    <div
                      onClick={() => setDetectLocationDevice(!detectLocationDevice)}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                        detectLocationDevice ? 'bg-violet-600' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                          detectLocationDevice ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </label>

                  {/* Toggle 3: Generate explanation for flagged transactions */}
                  <label className="flex items-center justify-between cursor-pointer py-1">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Generate explanation for flagged transactions
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Attach human-readable reasons and deterministic signal traces
                      </span>
                    </div>
                    <div
                      onClick={() => setGenerateExplanations(!generateExplanations)}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                        generateExplanations ? 'bg-violet-600' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                          generateExplanations ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </label>
                </div>

                {/* Save Button with Magnetic Hover & Feedback */}
                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <MagneticButton
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-violet-500/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isSaving ? 'Saving Changes...' : 'Save Settings'}
                  </MagneticButton>
                </div>
              </div>
            )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Notification Preferences
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure real-time security alerts and incident channels
                </p>
              </div>

              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer py-1">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Email Alert Dispatch
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Send instant high-risk alert digests to security personnel
                    </span>
                  </div>
                  <div
                    onClick={() => setEmailAlerts(!emailAlerts)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                      emailAlerts ? 'bg-brand-600' : 'bg-slate-300'
                    }`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${emailAlerts ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </label>

                <label className="flex items-center justify-between cursor-pointer py-1">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Webhook Integrations (RazorpayX)
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Relay flagged transactions to downstream banking endpoints
                    </span>
                  </div>
                  <div
                    onClick={() => setWebhookAlerts(!webhookAlerts)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                      webhookAlerts ? 'bg-violet-600' : 'bg-slate-300'
                    }`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${webhookAlerts ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <MagneticButton
                  onClick={handleSave}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-violet-500/20 active:scale-95"
                >
                  Save Notification Preferences
                </MagneticButton>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  User Management
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Authorized security reviewers and administrators
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    PT
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      Piyush Tandale
                    </div>
                    <div className="text-[11px] text-slate-500">
                      piyush@guardian-safety.internal
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700">
                  Super Admin
                </span>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    System Diagnostics
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time operational status of backend services
                  </p>
                </div>
                <button
                  onClick={loadSystem}
                  disabled={isRefreshingSystem}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingSystem ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {systemInfo && (
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 font-semibold block text-[11px]">Backend API</span>
                    <span className="text-sm font-bold text-emerald-600 mt-0.5 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      {systemInfo.backend_status}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 font-semibold block text-[11px]">Database Connection</span>
                    <span className="text-sm font-bold text-emerald-600 mt-0.5 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      {systemInfo.database_status}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 font-semibold block text-[11px]">Total Events Stored</span>
                    <span className="text-sm font-black text-slate-900 mt-0.5 block">
                      {systemInfo.total_events_in_db.toLocaleString()} records
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 font-semibold block text-[11px]">Engine Version</span>
                    <span className="text-sm font-black text-slate-900 mt-0.5 block">
                      {systemInfo.application_version}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
          </TiltCard>
        </ScrollReveal>
      </div>
    </div>
  );
};
