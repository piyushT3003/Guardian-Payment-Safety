import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  ShieldAlert,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Clock,
  Eye,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Zap,
  Play,
  Sparkles,
} from 'lucide-react';
import { Header } from '../components/Header';
import {
  PageView,
  Transaction,
  DashboardKPIs,
  TrendPoint,
  RiskDistribution,
  ActiveRecoveryRequest,
} from '../types';
import { fetchDashboardOverview, executeEmergencyRecovery, denyEmergencyRecovery } from '../api';
import { TiltCard } from '../components/animations/TiltCard';
import { ScrollReveal } from '../components/animations/ScrollReveal';
import { AnimatedCounter } from '../components/animations/AnimatedCounter';
import { CountdownRing } from '../components/animations/CountdownRing';
import { motion, AnimatePresence } from 'framer-motion';
import { SystemObservabilityCard } from '../components/SystemObservabilityCard';
import { MLPerformanceCard } from '../components/MLPerformanceCard';

interface DashboardViewProps {
  onNavigate: (view: PageView) => void;
  onSelectTransaction: (tx: Transaction) => void;
  onOpenNotifications: () => void;
  unreadCount?: number;
  dataVersion?: number;
  onRunScenario?: (scenario: 1 | 2) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onSelectTransaction,
  onOpenNotifications,
  unreadCount = 0,
  dataVersion,
  onRunScenario,
}) => {
  const [period, setPeriod] = useState('Last 30 Days');
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredTrend, setHoveredTrend] = useState<TrendPoint | null>(null);
  const [executingTxId, setExecutingTxId] = useState<string | null>(null);
  const [recoveryNotice, setRecoveryNotice] = useState<string | null>(null);

  const [data, setData] = useState<{
    kpis: DashboardKPIs;
    transaction_trend: TrendPoint[];
    risk_distribution: RiskDistribution;
    recent_transactions: Transaction[];
    active_recovery_requests?: ActiveRecoveryRequest[];
  }>({
    kpis: {
      total_transactions: 0,
      total_change: 'Ready for live simulation',
      fraud_detected: 0,
      fraud_change: '0.0%',
      high_risk: 0,
      high_risk_change: '0.0%',
      protected_amount: '₹0',
      protected_change: '0.0%',
    },
    transaction_trend: [],
    risk_distribution: {
      total_fraud_cases: 0,
      high_risk_pct: 0,
      medium_risk_pct: 0,
      low_risk_pct: 0,
      high_risk_count: 0,
      medium_risk_count: 0,
      low_risk_count: 0,
    },
    recent_transactions: [],
    active_recovery_requests: [],
  });

  const loadOverview = (silent = false) => {
    if (!silent) setIsLoading(true);
    fetchDashboardOverview(period)
      .then((res) => {
        setData(res);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadOverview(false);
  }, [period]);

  // Smooth live telemetry refresh without unmounting or flashing
  useEffect(() => {
    if (dataVersion !== undefined) {
      loadOverview(true);
    }
  }, [dataVersion]);

  // Live second-by-second SLA recovery countdown
  useEffect(() => {
    if (!data.active_recovery_requests || data.active_recovery_requests.length === 0) return;
    const interval = setInterval(() => {
      setData((prev) => {
        if (!prev.active_recovery_requests || prev.active_recovery_requests.length === 0) return prev;
        let anyExpired = false;
        const updated = prev.active_recovery_requests.map((req) => {
          const nextSec = Math.max(0, (req.remaining_seconds ?? 300) - 1);
          if (nextSec === 0 && (req.remaining_seconds ?? 0) > 0) {
            anyExpired = true;
          }
          return { ...req, remaining_seconds: nextSec };
        });
        if (anyExpired) {
          loadOverview();
        }
        return { ...prev, active_recovery_requests: updated };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [data.active_recovery_requests?.length]);

  const handleExecuteRecovery = async (txId: string) => {
    setExecutingTxId(txId);
    try {
      const res = await executeEmergencyRecovery(txId, 'Piyush Tandale (Admin)');
      setRecoveryNotice(`✅ Successfully recalled ₹${res.amount_recovered.toLocaleString('en-IN')}. Funds restored to senior account.`);
      loadOverview();
      setTimeout(() => setRecoveryNotice(null), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setExecutingTxId(null);
    }
  };

  const handleDeclineRecovery = async (txId: string) => {
    setExecutingTxId(txId);
    try {
      await denyEmergencyRecovery(txId, 'Piyush Tandale (Admin)', 'Recovery request declined upon secondary bank audit.');
      setRecoveryNotice(`⚠️ Recovery request for ${txId} was declined. Payment status preserved.`);
      loadOverview();
      setTimeout(() => setRecoveryNotice(null), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setExecutingTxId(null);
    }
  };

  // Donut SVG circumference math
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const highOffset = 0;
  const highDash = (data.risk_distribution.high_risk_pct / 100) * circumference;

  const medOffset = -highDash;
  const medDash = (data.risk_distribution.medium_risk_pct / 100) * circumference;

  const lowOffset = -(highDash + medDash);
  const lowDash = (data.risk_distribution.low_risk_pct / 100) * circumference;

  return (
    <div className="flex-1 flex flex-col p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <Header
        title="Dashboard Overview"
        subtitle="Real-time insights into payment safety and fraud risks"
        period={period}
        onPeriodChange={setPeriod}
        unreadCount={unreadCount}
        onOpenNotifications={onOpenNotifications}
      />

      {/* Recovery Success Toast with premium slide-in */}
      <AnimatePresence>
        {recoveryNotice && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-xl shadow-emerald-500/25 flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 20 }}>
                <CheckCircle2 className="w-5 h-5 text-white" />
              </motion.div>
              <span>{recoveryNotice}</span>
            </div>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setRecoveryNotice(null)} className="p-1 hover:bg-emerald-700/50 rounded-lg transition-colors">
              <XCircle className="w-4 h-4" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* High-Priority Emergency Recovery Requests Banner */}
      <AnimatePresence>
        {data.active_recovery_requests && data.active_recovery_requests.length > 0 && (
          <motion.div
            key="rec-banner"
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6 space-y-3"
          >
          {data.active_recovery_requests.map((req) => (
            <div
              key={req.transaction_id}
              className="p-4 sm:p-5 rounded-2xl border-2 border-rose-500/80 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              style={{
                background: 'linear-gradient(135deg, #4c0519 0%, #1e1b4b 50%, #431407 100%)',
                boxShadow: '0 20px 60px rgba(239,68,68,0.25), 0 4px 20px rgba(0,0,0,0.3)'
              }}
            >
              <div className="flex items-start sm:items-center gap-4 flex-1">
                <CountdownRing
                  totalSeconds={300}
                  remainingSeconds={req.remaining_seconds ?? 0}
                  size={64}
                  strokeWidth={5}
                />
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <motion.span
                      animate={{ opacity: [1, 0.6, 1] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white"
                    >
                      🚨 Emergency Fraud Recall Active • 5-Min SLA
                    </motion.span>
                    <span className="font-mono text-xs text-rose-300 font-bold">
                      {req.transaction_id}
                    </span>
                  </div>
                  <div className="text-sm font-black text-white">
                    Customer {req.elderly_name || 'Senior Customer'} requesting immediate clawback of ₹{req.amount.toLocaleString('en-IN')}
                  </div>
                  <p className="text-xs text-slate-300 max-w-2xl">
                    Transcontinental transfer to {req.dest_city || 'Overseas Proxy'} ({req.distance_km || 7200} km). Family Guardian requested emergency recall. Bank SOC execution required to reverse funds.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
                <motion.button
                  whileHover={{ scale: 1.03, translateY: -1 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleExecuteRecovery(req.transaction_id)}
                  disabled={executingTxId === req.transaction_id || req.remaining_seconds === 0}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap className="w-4 h-4 fill-slate-950 text-amber-300" />
                  <span>
                    {req.remaining_seconds === 0
                      ? 'Window Expired'
                      : executingTxId === req.transaction_id
                      ? 'Executing...'
                      : '⚡ Execute Recovery'}
                  </span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleDeclineRecovery(req.transaction_id)}
                  disabled={executingTxId === req.transaction_id}
                  className="px-3 py-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-200 text-xs font-bold border border-rose-800 transition-colors cursor-pointer"
                >
                  Decline
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onNavigate('monitoring')}
                  className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
                >
                  Review
                </motion.button>
              </div>
            </div>
          ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4 Top KPI Cards (Authoritative Panel 2) with 3D Tilt */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Transactions */}
        <ScrollReveal staggerIndex={0} direction="up" className="h-full">
          <TiltCard
            maxTilt={8}
            onClick={() => onNavigate('monitoring')}
            className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group h-full flex flex-col justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
                <CreditCard className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                <AnimatedCounter value={data.kpis.total_transactions} />
              </span>
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-2">
              Total Transactions
            </div>
            <div className="mt-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <TrendingUp className="w-3 h-3 stroke-[2.5]" />
                {data.kpis.total_transactions > 0 ? data.kpis.total_change : '+12.5%'}
              </span>
            </div>
          </TiltCard>
        </ScrollReveal>

        {/* Fraud Detected */}
        <ScrollReveal staggerIndex={1} direction="up" className="h-full">
          <TiltCard
            maxTilt={8}
            onClick={() => onNavigate('monitoring')}
            className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group h-full flex flex-col justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                <AnimatedCounter value={data.kpis.fraud_detected} />
              </span>
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-2">
              Fraud Detected
            </div>
            <div className="mt-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                <TrendingUp className="w-3 h-3 stroke-[2.5]" />
                {data.kpis.total_transactions > 0 ? data.kpis.fraud_change : '+8.4%'}
              </span>
            </div>
          </TiltCard>
        </ScrollReveal>

        {/* High Risk */}
        <ScrollReveal staggerIndex={2} direction="up" className="h-full">
          <TiltCard
            maxTilt={8}
            onClick={() => onNavigate('monitoring')}
            className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group h-full flex flex-col justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                <AnimatedCounter value={data.kpis.high_risk} />
              </span>
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-2">
              High Risk
            </div>
            <div className="mt-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                <TrendingDown className="w-3 h-3 stroke-[2.5]" />
                {data.kpis.total_transactions > 0 ? data.kpis.high_risk_change : '-21.7%'}
              </span>
            </div>
          </TiltCard>
        </ScrollReveal>

        {/* Protected Amount */}
        <ScrollReveal staggerIndex={3} direction="up" className="h-full">
          <TiltCard
            maxTilt={8}
            onClick={() => onNavigate('analytics')}
            className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group h-full flex flex-col justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                <AnimatedCounter value={data.kpis.protected_amount} />
              </span>
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-2">
              Protected Amount
            </div>
            <div className="mt-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <TrendingUp className="w-3 h-3 stroke-[2.5]" />
                {data.kpis.total_transactions > 0 ? data.kpis.protected_change : '+26.5%'}
              </span>
            </div>
          </TiltCard>
        </ScrollReveal>
      </div>

      {/* Main Charts Row (Authoritative Panel 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Left Chart: Transaction Trend */}
        <ScrollReveal direction="left" className="lg:col-span-8 flex flex-col">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight">
                  Transaction Trend
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Daily volume comparison of normal vs flagged transactions
                </p>
              </div>
              {/* Chart Legend */}
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  Normal
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-600" />
                  Fraud
                </div>
              </div>
            </div>

            {/* SVG Line / Area Graph */}
            {data.kpis.total_transactions === 0 ? (
              <div className="h-60 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2.5">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No Payment Stream Active</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1 mb-3">
                  Zero transactions recorded. Launch a live scenario below to stream elderly payments.
                </p>
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <button
                    onClick={() => onRunScenario?.(1)}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Demo 1: Hold Flow</span>
                  </button>
                  <button
                    onClick={() => onRunScenario?.(2)}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Run Demo 2: 5-Min Recovery</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative h-60 w-full pt-4">
                {/* Y-Axis Labels */}
                <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[10px] font-semibold text-slate-400 select-none">
                  <span>15K</span>
                  <span>12K</span>
                  <span>9K</span>
                  <span>6K</span>
                  <span>3K</span>
                  <span>0</span>
                </div>

                {/* SVG Canvas */}
                <div className="ml-8 h-full relative">
                  <svg className="w-full h-48 overflow-visible" viewBox="0 0 700 200" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="normalGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="fraudGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Grid Lines */}
                    <line x1="0" y1="40" x2="700" y2="40" stroke="#f1f5f9" strokeDasharray="3 3" />
                    <line x1="0" y1="80" x2="700" y2="80" stroke="#f1f5f9" strokeDasharray="3 3" />
                    <line x1="0" y1="120" x2="700" y2="120" stroke="#f1f5f9" strokeDasharray="3 3" />
                    <line x1="0" y1="160" x2="700" y2="160" stroke="#f1f5f9" strokeDasharray="3 3" />

                    {/* Normal Area & Curve with Draw Animation */}
                    <path
                      d="M 0 160 Q 116 120 233 75 T 466 50 T 700 30 L 700 200 L 0 200 Z"
                      fill="url(#normalGrad)"
                      className="transition-all duration-1000 ease-out"
                    />
                    <path
                      d="M 0 160 Q 116 120 233 75 T 466 50 T 700 30"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="3"
                      strokeLinecap="round"
                      style={{
                        strokeDasharray: '1000',
                        animation: 'drawPath 1.6s ease-out forwards',
                      }}
                    />

                    {/* Fraud Curve with Draw Animation */}
                    <path
                      d="M 0 190 Q 116 175 233 155 T 466 140 T 700 115"
                      fill="none"
                      stroke="#7c3aed"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      style={{
                        strokeDasharray: '1000',
                        animation: 'drawPath 2s ease-out forwards',
                      }}
                    />

                    {/* Data Points */}
                    {data.transaction_trend.map((d, i) => {
                      const x = data.transaction_trend.length > 1 ? (i / (data.transaction_trend.length - 1)) * 700 : 350;
                      const y = Math.max(20, Math.min(180, 180 - (d.total * 20)));
                      return (
                        <g
                          key={i}
                          className="cursor-pointer transition-transform duration-200 hover:scale-125"
                          onMouseEnter={() => setHoveredTrend(d)}
                          onMouseLeave={() => setHoveredTrend(null)}
                        >
                          <circle cx={x} cy={y} r="5" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
                        </g>
                      );
                    })}
                  </svg>

                  {/* X-Axis Labels */}
                  <div className="flex justify-between text-[11px] font-bold text-slate-400 mt-2">
                    {data.transaction_trend.map((t, idx) => (
                      <span key={idx}>{t.date}</span>
                    ))}
                  </div>

                  {/* Hover Tooltip */}
                  {hoveredTrend && (
                    <div className="absolute top-2 right-4 p-2.5 rounded-xl bg-slate-900 text-white text-xs shadow-xl animate-in fade-in-50 transition-all duration-200">
                      <div className="font-bold text-slate-200">{hoveredTrend.date}</div>
                      <div className="text-blue-300">Normal: {hoveredTrend.normal.toLocaleString()} txns</div>
                      <div className="text-purple-300">Fraud: {hoveredTrend.fraud} cases</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* Right Chart: Risk Distribution (Authoritative Panel 2 Donut) */}
        <ScrollReveal direction="right" className="lg:col-span-4 flex flex-col">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between h-full">
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Risk Distribution
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Breakdown of risk severity across transactions
              </p>
            </div>

            {/* Donut Chart with Centered Number and Smooth Eased Segments */}
            <div className="relative flex items-center justify-center py-4">
              <svg className="w-48 h-48 -rotate-90" viewBox="0 0 160 160">
                {/* Background track */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke="#f1f5f9"
                  strokeWidth="16"
                />
                {/* Low Risk Segment (Green) */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="16"
                  strokeDasharray={`${lowDash} ${circumference}`}
                  strokeDashoffset={lowOffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.16, 1, 0.3, 1), stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
                />
                {/* Medium Risk Segment (Amber) */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="16"
                  strokeDasharray={`${medDash} ${circumference}`}
                  strokeDashoffset={medOffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.16, 1, 0.3, 1), stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
                />
                {/* High Risk Segment (Red) */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="16"
                  strokeDasharray={`${highDash} ${circumference}`}
                  strokeDashoffset={highOffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.16, 1, 0.3, 1), stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
                />
              </svg>

              {/* Center Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-900 leading-none">
                  <AnimatedCounter value={data.risk_distribution.total_fraud_cases} />
                </span>
                <span className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                  Fraud Cases
                </span>
              </div>
            </div>

            {/* Legend with exact percentages */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div
                onClick={() => onNavigate('monitoring')}
                className="flex items-center justify-between text-xs font-semibold cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-slate-700">High Risk</span>
                </div>
                <span className="font-bold text-slate-900">
                  {data.risk_distribution.high_risk_pct}%
                </span>
              </div>

              <div
                onClick={() => onNavigate('monitoring')}
                className="flex items-center justify-between text-xs font-semibold cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-slate-700">Medium Risk</span>
                </div>
                <span className="font-bold text-slate-900">
                  {data.risk_distribution.medium_risk_pct}%
                </span>
              </div>

              <div
                onClick={() => onNavigate('monitoring')}
                className="flex items-center justify-between text-xs font-semibold cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-slate-700">Low Risk</span>
                </div>
                <span className="font-bold text-slate-900">
                  {data.risk_distribution.low_risk_pct}%
                </span>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* System Observability & ML Empirical Performance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ScrollReveal direction="left" className="h-full">
          <SystemObservabilityCard />
        </ScrollReveal>
        <ScrollReveal direction="right" className="h-full">
          <MLPerformanceCard />
        </ScrollReveal>
      </div>

      {/* Recent Flagged Transactions Section */}
      <ScrollReveal direction="up">
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Recently Analysed Transactions
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Quick review of incoming payment stream
              </p>
            </div>
            <button
              onClick={() => onNavigate('monitoring')}
              className="text-xs font-bold text-violet-600 hover:text-violet-700 inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              Open Monitoring Table
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {data.recent_transactions.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 space-y-3">
              <p>No transactions found. Upload a dataset or launch a live demo scenario below.</p>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <button
                  onClick={() => onRunScenario?.(1)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Demo 1 (Ramesh Kulkarni)</span>
                </button>
                <button
                  onClick={() => onRunScenario?.(2)}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>Demo 2 (Sunita Sharma)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.recent_transactions.slice(0, 5).map((tx, idx) => (
                <ScrollReveal key={tx.transaction_id} staggerIndex={idx} direction="up">
                  <div
                    onClick={() => onSelectTransaction(tx)}
                    className="py-3 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-xl transition-all hover:translate-x-1 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                          tx.risk_level === 'HIGH'
                            ? 'bg-rose-50 text-rose-600 animate-pulse'
                            : tx.risk_level === 'MEDIUM'
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-emerald-50 text-emerald-600'
                        }`}
                      >
                        {tx.risk_level === 'HIGH' ? '!' : '✓'}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <span>{tx.transaction_id}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            ({tx.customer_name})
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-xs sm:max-w-md md:max-w-lg" title={tx.reason}>
                          {tx.reason}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <div className="text-xs font-black text-slate-900">
                          ₹{tx.amount.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] font-semibold text-slate-400">
                          Risk: {tx.risk_score.toFixed(2)}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          tx.risk_level === 'HIGH'
                            ? 'bg-rose-100 text-rose-700 animate-pulse-danger'
                            : tx.risk_level === 'MEDIUM'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {tx.risk_level}
                      </span>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </ScrollReveal>
    </div>
  );
};
