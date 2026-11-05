import React, { useState, useEffect } from 'react';
import {
  Play,
  RotateCcw,
  ShieldCheck,
  Radio,
  BellRing,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import {
  clearDemoData,
  fetchPendingGuardianAlerts,
  runDemoScenario1,
  runDemoScenario2,
} from '../api';
import { GuardianPendingAlert, PageView } from '../types';
import { motion } from 'framer-motion';

interface LiveSimulationBarProps {
  onDataChanged: () => void;
  onOpenGuardianAlert: (alert: GuardianPendingAlert) => void;
  onNavigate?: (view: PageView) => void;
  externalTriggerScenario?: 1 | 2 | null;
  onScenarioHandled?: () => void;
}

export const LiveSimulationBar: React.FC<LiveSimulationBarProps> = ({
  onDataChanged,
  onOpenGuardianAlert,
  onNavigate,
  externalTriggerScenario,
  onScenarioHandled,
}) => {
  const [runningScenario, setRunningScenario] = useState<1 | 2 | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [, setActiveScenarioName] = useState<string | null>(null);
  const [latestTitle, setLatestTitle] = useState<string>(
    'Database Clean (0 records) • Click Demo 1 or Demo 2 to start live sequence'
  );
  const [pendingAlerts, setPendingAlerts] = useState<GuardianPendingAlert[]>([]);

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const refreshPendingAlerts = async () => {
    try {
      const res = await fetchPendingGuardianAlerts();
      setPendingAlerts(res.pending_alerts || []);
      return res.pending_alerts || [];
    } catch (e) {
      console.error('Failed to fetch pending guardian alerts:', e);
      return [];
    }
  };

  useEffect(() => {
    refreshPendingAlerts();
  }, []);

  // Handle external launch triggers (from Landing Page, Dashboard, or Monitoring cards)
  useEffect(() => {
    if (externalTriggerScenario === 1 && !runningScenario) {
      handleRunScenario1();
      onScenarioHandled?.();
    } else if (externalTriggerScenario === 2 && !runningScenario) {
      handleRunScenario2();
      onScenarioHandled?.();
    }
  }, [externalTriggerScenario, runningScenario]);

  // -------------------------------------------------------------
  // DEMO 1: Ramesh Kulkarni (68) — Digital Arrest Scam & Hold Flow
  // -------------------------------------------------------------
  const handleRunScenario1 = async () => {
    if (runningScenario) return;
    if (onNavigate) onNavigate('dashboard');
    setRunningScenario(1);
    setActiveScenarioName('Demo 1: Elderly Protection & Hold Flow');

    try {
      // Step 1: Routine Pharmacy Purchase (Safe)
      setCurrentStep(1);
      setLatestTitle(
        'Step 1/3: Ramesh Kulkarni (68) pays ₹850 to Apollo Pharmacy (Dadar) • Normal Safe Healthcare Spend (Risk: 12/100)'
      );
      await runDemoScenario1(1);
      onDataChanged();
      await refreshPendingAlerts();
      await delay(1200);

      // Step 2: Routine Monthly Electricity Bill (Safe)
      setCurrentStep(2);
      setLatestTitle(
        'Step 2/3: Ramesh Kulkarni (68) pays ₹1,420 for Tata Power Bill • Routine Monthly Utility (Risk: 15/100)'
      );
      await runDemoScenario1(2);
      onDataChanged();
      await refreshPendingAlerts();
      await delay(1300);

      // Step 3: Anomaly Detected -> Fraud Identified -> Transfer Held Pending Guardian Approval
      setCurrentStep(3);
      setLatestTitle(
        '🚨 Step 3/3: FRAUD IDENTIFIED (96/100)! Digital Arrest Police Extortion • Transfer Held Pending Family Approval'
      );
      const res = await runDemoScenario1(3);
      onDataChanged();
      const alerts = await refreshPendingAlerts();

      // Automatically open Family Guardian modal for Ramesh Kulkarni
      const match =
        alerts.find((a) => a.transaction_id === res.transaction_id) || alerts[0];
      if (match) {
        onOpenGuardianAlert(match);
      }
    } catch (err) {
      console.error('Demo 1 sequence failed:', err);
    } finally {
      setRunningScenario(null);
    }
  };

  // -------------------------------------------------------------
  // DEMO 2: Sunita Sharma (64) — Accidental Approval & 5-Min Recovery
  // -------------------------------------------------------------
  const handleRunScenario2 = async () => {
    if (runningScenario) return;
    if (onNavigate) onNavigate('dashboard');
    setRunningScenario(2);
    setActiveScenarioName('Demo 2: Accidental Approval & 5-Min Recovery');

    try {
      // Step 1: Routine Grocery Spend (Safe)
      setCurrentStep(1);
      setLatestTitle(
        "Step 1/3: Sunita Sharma (64) pays ₹420 at Nature's Basket (Bandra) • Everyday Grocery Spend (Risk: 10/100)"
      );
      await runDemoScenario2(1);
      onDataChanged();
      await refreshPendingAlerts();
      await delay(1200);

      // Step 2: Routine Diagnostic Clinic (Safe)
      setCurrentStep(2);
      setLatestTitle(
        'Step 2/3: Sunita Sharma (64) pays ₹650 at Dr. Lal PathLabs (Bandra) • Verified Healthcare Clinic (Risk: 14/100)'
      );
      await runDemoScenario2(2);
      onDataChanged();
      await refreshPendingAlerts();
      await delay(1300);

      // Step 3: Anomaly Detected -> Fraud Identified -> Ready for Accidental Approval & 5-Min SLA Recall Test
      setCurrentStep(3);
      setLatestTitle(
        '🚨 Step 3/3: FRAUD IDENTIFIED (91/100)! Foreign Lottery Scam (Lagos, 7,200 km) • Ready for Accidental Approval & 5-Min SLA Test'
      );
      const res = await runDemoScenario2(3);
      onDataChanged();
      const alerts = await refreshPendingAlerts();

      // Automatically open Family Guardian modal for Sunita Sharma
      const match =
        alerts.find((a) => a.transaction_id === res.transaction_id) || alerts[0];
      if (match) {
        onOpenGuardianAlert(match);
      }
    } catch (err) {
      console.error('Demo 2 sequence failed:', err);
    } finally {
      setRunningScenario(null);
    }
  };

  // -------------------------------------------------------------
  // RESET TO 0 DATA
  // -------------------------------------------------------------
  const handleResetZero = async () => {
    if (runningScenario) return;
    try {
      await clearDemoData();
      setCurrentStep(0);
      setRunningScenario(null);
      setActiveScenarioName(null);
      setLatestTitle('Database Baseline Clean (0 Transactions) • Select Demo 1 or Demo 2');
      setPendingAlerts([]);
      onOpenGuardianAlert(null as any); // Instantly dismiss/reset open family alert modal
      onDataChanged();
    } catch (err) {
      console.error('Reset to 0 failed:', err);
    }
  };

  const handleTriggerGuardianModal = () => {
    if (pendingAlerts.length > 0) {
      onOpenGuardianAlert(pendingAlerts[0]);
    } else {
      // 0 data / No active threats: Open the All-Clear Safe Family Guardian Dashboard
      const safeAlert: GuardianPendingAlert = {
        id: 0,
        transaction_id: '',
        user_id: 'CUST-7821',
        title: '🛡️ Family Guardian Shield Active',
        message:
          'No active threats or suspicious transactions detected. All monitored senior accounts are currently safe and protected.',
        status: 'SAFE',
        created_at: new Date().toISOString(),
        recipient_role: 'FAMILY_GUARDIAN',
        recipient_name: 'Aditya Kulkarni',
        recipient_phone: '+91 98201 99112',
        elderly_name: 'Ramesh Kulkarni',
        elderly_age: 68,
        amount: 0,
        payee: '',
        event_status: 'SAFE',
        risk_score: 0,
        scam_category: 'No Threats Detected',
        ai_explanation:
          'All monitored senior accounts are operating within normal baseline telemetry. No psychological coercion, digital arrest threats, or unusual payment velocity detected.',
        origin_city: 'Mumbai',
        dest_city: 'Mumbai',
        distance_km: 0,
        guardian_name: 'Aditya Kulkarni',
        guardian_relation: 'Son',
        guardian_phone: '+91 98201 99112',
      };
      onOpenGuardianAlert(safeAlert);
    }
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-white px-4 sm:px-6 py-2 shadow-md flex items-center justify-between gap-3 sticky top-0 z-40">
      {/* Left: Indicator & 3-Step Sequence Progress */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex items-center gap-2 shrink-0">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              runningScenario
                ? 'bg-amber-400 animate-ping'
                : currentStep === 3
                ? 'bg-rose-400 animate-pulse'
                : 'bg-emerald-400'
            }`}
          />
          <span className="text-xs font-black tracking-wide text-slate-100 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="hidden sm:inline">
              {runningScenario
                ? 'Live Sequence Active'
                : currentStep === 3
                ? 'Threat Frozen'
                : 'Elderly Guardian'}
            </span>
          </span>
        </div>

        {/* 3-Step Live Sequence Progress Indicators */}
        <div className="hidden xl:flex items-center gap-1.5 pl-3 border-l border-slate-700 shrink-0">
          {[
            { step: 1, label: 'Safe Spend' },
            { step: 2, label: 'Utility Bill' },
            { step: 3, label: 'AI Fraud Detection' },
          ].map((item) => {
            const isCompleted = currentStep > item.step || (currentStep === 3 && item.step < 3);
            const isCurrent = currentStep === item.step;
            const isFraudStep = item.step === 3;

            return (
              <div
                key={item.step}
                title={`Step ${item.step}: ${item.label}`}
                className={`h-6 px-2.5 rounded-md text-[11px] font-mono font-semibold flex items-center gap-1 transition-all ${
                  isCurrent && isFraudStep
                    ? 'bg-rose-950 text-rose-300 border border-rose-500 ring-2 ring-rose-500/40 animate-pulse font-bold'
                    : isCurrent
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-400 ring-2 ring-cyan-400/40 font-bold'
                    : isCompleted
                    ? 'bg-slate-800 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-900/60 text-slate-500 border border-slate-800'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                ) : isCurrent && isFraudStep ? (
                  <AlertTriangle className="w-3 h-3 text-rose-400 animate-bounce shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="w-3 h-3 animate-spin text-cyan-400 shrink-0" />
                ) : (
                  <span className="w-3 text-center text-[10px]">{item.step}</span>
                )}
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>

        {/* Live Narrative Status Banner */}
        <div className="text-xs text-slate-300 font-medium truncate flex-1 min-w-0">
          {currentStep === 0 ? (
            <span className="text-slate-400">⚪ DB Clean (0 records) — Select Demo 1 or Demo 2</span>
          ) : (
            <span title={latestTitle} className="truncate">
              {latestTitle}
            </span>
          )}
        </div>
      </div>

      {/* Right: The 2 Independent Live Demo Buttons + Reset + Family Alert */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Demo Scenario 1 Button */}
        <motion.button
          whileHover={{ scale: runningScenario !== null ? 1 : 1.03, translateY: -1 }}
          whileTap={{ scale: runningScenario !== null ? 1 : 0.96 }}
          onClick={handleRunScenario1}
          disabled={runningScenario !== null}
          title="Demo 1: Elderly Protection & Hold Flow. Ramesh Kulkarni (68) pays pharmacy, utility bill, then Digital Arrest scam (₹48,000 to Dubai). Held for Family Approval."
          className={`h-[34px] px-3.5 rounded-xl text-xs font-black inline-flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer ${
            runningScenario === 1
              ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 animate-pulse'
              : runningScenario !== null
              ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-400'
              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
          }`}
        >
          {runningScenario === 1 ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current shrink-0" />
          )}
          <span>Demo 1: Hold Flow</span>
        </motion.button>

        {/* Demo Scenario 2 Button */}
        <motion.button
          whileHover={{ scale: runningScenario !== null ? 1 : 1.03, translateY: -1 }}
          whileTap={{ scale: runningScenario !== null ? 1 : 0.96 }}
          onClick={handleRunScenario2}
          disabled={runningScenario !== null}
          title="Demo 2: Accidental Approval & 5-Min Recovery. Sunita Sharma (64) pays grocery, clinic, then Foreign Lottery scam (₹35,000 to Lagos). Test Accidental Approval and 5-min SLA Recall."
          className={`h-[34px] px-3.5 rounded-xl text-xs font-black inline-flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer ${
            runningScenario === 2
              ? 'bg-rose-500 text-white ring-2 ring-rose-400 animate-pulse'
              : runningScenario !== null
              ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-400'
              : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
          }`}
        >
          {runningScenario === 2 ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          )}
          <span>Demo 2: 5-Min Recovery</span>
        </motion.button>

        {/* Reset to 0 Data Button */}
        <motion.button
          whileHover={{ scale: runningScenario !== null ? 1 : 1.03 }}
          whileTap={{ scale: runningScenario !== null ? 1 : 0.96 }}
          onClick={handleResetZero}
          disabled={runningScenario !== null}
          title="Clear all transactions, resets all views and family guardian modal to 0 records"
          className="h-[34px] px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 hover:text-rose-200 text-xs font-bold border border-slate-700 inline-flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-40"
        >
          <RotateCcw className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Reset to 0</span>
        </motion.button>

        {/* Family Guardian Alert Preview Button */}
        <motion.button
          whileHover={{ scale: 1.03, translateY: -1 }}
          whileTap={{ scale: 0.96 }}
          onClick={handleTriggerGuardianModal}
          className={`h-[34px] px-3.5 rounded-xl text-xs font-black inline-flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer ${
            pendingAlerts.length > 0
              ? 'bg-rose-700 hover:bg-rose-600 text-white ring-2 ring-rose-500/50'
              : 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30'
          }`}
        >
          {pendingAlerts.length > 0 ? (
            <BellRing className="w-3.5 h-3.5 animate-bounce shrink-0" />
          ) : (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          )}
          <span>
            {pendingAlerts.length > 0
              ? `🚨 Family Alert (${pendingAlerts.length})`
              : '🛡️ Family View'}
          </span>
        </motion.button>
      </div>
    </div>
  );
};
