import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  FileText,
  ShieldAlert,
  Percent,
  ShieldCheck,
  ArrowRight,
  Download,
  BarChart2,
  LayoutDashboard,
  Check,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Header } from '../components/Header';
import { PageView, AnalysisResultData, Transaction } from '../types';
import { TiltCard } from '../components/animations/TiltCard';
import { ScrollReveal } from '../components/animations/ScrollReveal';
import { AnimatedCounter } from '../components/animations/AnimatedCounter';
import { MagneticButton } from '../components/animations/MagneticButton';
import { ThreeScanningShield } from '../components/animations/ThreeScanningShield';
import { FraudPipeline } from '../components/animations/FraudPipeline';

interface AnalysisResultViewProps {
  resultData?: AnalysisResultData | null;
  onNavigate: (view: PageView) => void;
  onSelectTransaction: (tx: Transaction) => void;
  onOpenNotifications: () => void;
  unreadCount?: number;
}

export const AnalysisResultView: React.FC<AnalysisResultViewProps> = ({
  resultData,
  onNavigate,
  onSelectTransaction,
  onOpenNotifications,
  unreadCount = 0,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleDownloadReport = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3500);
    }, 1200);
  };

  useEffect(() => {
    // Launch celebratory confetti when viewing analysis results
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#7c3aed', '#3b82f6', '#10b981'],
    });
  }, []);

  // Default values matching Panel 9 from screenshot
  const kpis = resultData?.kpis || {
    total_records: 10000,
    fraud_detected: 248,
    fraud_rate: '2.48%',
    model_accuracy: '99.2%',
  };

  const sampleFlagged: Transaction[] = resultData?.sample_flagged || [
    {
      transaction_id: 'TXN-10482',
      user_id: 'CUST-7821',
      payee: 'Global Crypto Exchange / Unverified',
      amount: 25000,
      risk_score: 0.92,
      risk_level: 'HIGH',
      reason: 'Unusual amount & location',
      status: 'PENDING_REVIEW',
      created_at: '2026-10-30T14:22:15Z',
    },
    {
      transaction_id: 'TXN-10475',
      user_id: 'CUST-5520',
      payee: 'Prize Claim Official',
      amount: 42000,
      risk_score: 0.89,
      risk_level: 'HIGH',
      reason: 'Multiple failed attempts',
      status: 'PENDING_REVIEW',
      created_at: '2026-10-29T19:30:22Z',
    },
    {
      transaction_id: 'TXN-10479',
      user_id: 'CUST-3914',
      payee: 'QuickTransfer Tech',
      amount: 8500,
      risk_score: 0.67,
      risk_level: 'MEDIUM',
      reason: 'New device & High frequency',
      status: 'PENDING_REVIEW',
      created_at: '2026-10-30T11:45:00Z',
    },
  ];

  const insights = resultData?.risk_insights || [
    '248 suspicious transactions found',
    'Majority from UPI (42%)',
    'High-risk cases reduced by 21.7%',
    '₹18.4L potential fraud prevented',
  ];

  return (
    <div className="flex-1 flex flex-col p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <Header
        title="Analysis Complete"
        subtitle="10,000 transactions analyzed in 12.4 seconds"
        showPeriodFilter={false}
        unreadCount={unreadCount}
        onOpenNotifications={onOpenNotifications}
      />

      {/* 3D Completion Rotating Shield with holographic glow and checkmark (Req 85, 86, 87) */}
      <ScrollReveal direction="zoom">
        <div className="relative mb-6 p-6 rounded-3xl bg-gradient-to-r from-emerald-900/90 via-slate-900 to-indigo-950 text-white overflow-hidden shadow-xl border border-emerald-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-6 z-10">
            <div className="w-36 h-36 flex items-center justify-center shrink-0">
              <ThreeScanningShield isCompleted={true} className="w-36 h-36" />
            </div>
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold mb-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>3D Verification Complete</span>
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight">
                Batch Analysis Evaluated Successfully
              </h3>
              <p className="text-sm text-slate-300 mt-1 max-w-xl">
                {kpis.total_records.toLocaleString()} transactions processed and behavioral models updated in {resultData?.processing_time || '12.4 seconds'}. All elderly-protection risk markers refreshed.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap md:flex-col items-center gap-2.5 z-10 shrink-0">
            <MagneticButton
              onClick={() => onNavigate('monitoring')}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-1.5"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Review Queue</span>
            </MagneticButton>

            <MagneticButton
              onClick={handleDownloadReport}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 flex items-center gap-1.5"
            >
              {downloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : downloaded ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Report Downloaded</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Report</span>
                </>
              )}
            </MagneticButton>
          </div>
        </div>
      </ScrollReveal>

      {/* 7-Stage Intelligence Pipeline Status */}
      <ScrollReveal direction="up" delay={0.1}>
        <div className="mb-8 p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">Guardian 7-Stage Risk Engine</span>
              <h4 className="text-sm font-bold text-slate-800">Verified Pipeline Execution Flow</h4>
            </div>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              ✓ All 7 Modules Completed
            </span>
          </div>
          <FraudPipeline
            activeStage={8}
            riskLevel="HIGH"
            isProcessing={false}
            className="w-full pt-1"
          />
        </div>
      </ScrollReveal>

      {/* 4 KPI Cards (Authoritative Panel 9 with 3D Tilt and Animated Counters - Req 88, 89) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <ScrollReveal staggerIndex={0} direction="up">
          <TiltCard maxTilt={8} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                <AnimatedCounter value={kpis.total_records} />
              </span>
            </div>
            <div className="text-xs font-semibold text-slate-500">
              Total Records
            </div>
          </TiltCard>
        </ScrollReveal>

        <ScrollReveal staggerIndex={1} direction="up">
          <TiltCard maxTilt={8} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                <AnimatedCounter value={kpis.fraud_detected} />
              </span>
            </div>
            <div className="text-xs font-semibold text-slate-500">
              Fraud Detected
            </div>
          </TiltCard>
        </ScrollReveal>

        <ScrollReveal staggerIndex={2} direction="up">
          <TiltCard maxTilt={8} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Percent className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                <AnimatedCounter value={kpis.fraud_rate} decimals={2} />
              </span>
            </div>
            <div className="text-xs font-semibold text-slate-500">
              Fraud Rate
            </div>
          </TiltCard>
        </ScrollReveal>

        <ScrollReveal staggerIndex={3} direction="up">
          <TiltCard maxTilt={8} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="text-2xl lg:text-3xl font-black text-emerald-600 tracking-tight">
                <AnimatedCounter value={kpis.model_accuracy} decimals={1} />
              </span>
            </div>
            <div className="text-xs font-semibold text-slate-500">
              Model Accuracy
            </div>
          </TiltCard>
        </ScrollReveal>
      </div>
      {/* Split Content: Sample Flagged Transactions (Left 8 Cols) & Risk Insights (Right 4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        {/* Sample Flagged Transactions */}
        <ScrollReveal direction="left" className="lg:col-span-8">
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight">
                  Sample Flagged Transactions
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Highest risk outliers identified by the engine
                </p>
              </div>
              <button
                onClick={() => onNavigate('monitoring')}
                className="text-xs font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1 transition-colors"
              >
                <span>View All Flags</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Smooth Risk Distribution Bar (Req 90, 91) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Risk Profile Distribution</span>
                <span className="text-[11px] font-semibold text-slate-500">10,000 Total Evaluated</span>
              </div>
              <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
                <div
                  className="bg-emerald-500 h-full transition-all duration-1000 ease-out"
                  style={{ width: '97.52%' }}
                  title="Low Risk: 97.52% (9,752)"
                />
                <div
                  className="bg-amber-400 h-full transition-all duration-1000 ease-out"
                  style={{ width: '1.80%' }}
                  title="Medium Risk: 1.80% (180)"
                />
                <div
                  className="bg-rose-500 h-full transition-all duration-1000 ease-out animate-pulse"
                  style={{ width: '0.68%' }}
                  title="High Risk: 0.68% (68)"
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 pt-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Safe / Verified (97.5%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>Medium Risk (1.8%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-rose-600">High Risk Scam (0.7%)</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100 pb-2">
                    <th className="py-2.5 px-3">Transaction ID</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Risk Score</th>
                    <th className="py-2.5 px-3">Risk Level</th>
                    <th className="py-2.5 px-3">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {sampleFlagged.map((tx, idx) => (
                    <tr
                      key={tx.transaction_id}
                      onClick={() => onSelectTransaction(tx)}
                      className="hover:bg-slate-50 cursor-pointer transition-all duration-200 hover:translate-x-1 hover:shadow-sm"
                    >
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {tx.transaction_id}
                      </td>
                      <td className="py-3 px-3 font-black text-slate-900">
                        ₹{tx.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-700">
                        {tx.risk_score.toFixed(2)}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            tx.risk_level === 'HIGH'
                              ? 'bg-rose-100 text-rose-700 animate-pulse-danger'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {tx.risk_level === 'HIGH' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                          )}
                          {tx.risk_level}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 truncate max-w-xs">
                        {tx.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </ScrollReveal>

        {/* Risk Insights Card (Exact from Panel 9 Right Column) */}
        <ScrollReveal direction="right" className="lg:col-span-4">
          <TiltCard maxTilt={5} glare={false} className="h-full p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight mb-1">
                Risk Insights
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                Core findings from this analysis run
              </p>

              <div className="space-y-4">
                {insights.map((insight, idx) => (
                  <ScrollReveal key={idx} staggerIndex={idx} direction="left">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 leading-snug">
                        {insight}
                      </span>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 space-y-2 mt-6">
              <MagneticButton
                onClick={() => onNavigate('analytics')}
                className="w-full py-2.5 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <BarChart2 className="w-4 h-4" />
                <span>View Full Analytics</span>
              </MagneticButton>
              <MagneticButton
                onClick={() => onNavigate('dashboard')}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Return to Dashboard</span>
              </MagneticButton>
            </div>
          </TiltCard>
        </ScrollReveal>
      </div>
    </div>
  );
};
