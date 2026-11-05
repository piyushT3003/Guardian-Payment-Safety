import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Percent,
  TrendingDown,
  Wallet,
  CreditCard,
  PieChart,
  BarChart3,
  Calendar,
  Layers,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { Header } from '../components/Header';
import { PageView, AnalyticsKPIs, CategoryDistribution } from '../types';
import { fetchAnalytics } from '../api';
import { TiltCard } from '../components/animations/TiltCard';
import { ScrollReveal } from '../components/animations/ScrollReveal';
import { AnimatedCounter } from '../components/animations/AnimatedCounter';

interface RiskAnalyticsViewProps {
  onNavigate: (view: PageView) => void;
  onOpenNotifications: () => void;
  unreadCount?: number;
}

export const RiskAnalyticsView: React.FC<RiskAnalyticsViewProps> = ({
  onNavigate,
  onOpenNotifications,
  unreadCount = 0,
}) => {
  const [period, setPeriod] = useState('Last 30 Days');
  const [isLoading, setIsLoading] = useState(false);

  const [data, setData] = useState<{
    kpis: AnalyticsKPIs;
    fraud_trend: { date: string; cases: number }[];
    fraud_by_category: CategoryDistribution[];
    top_reasons: { reason: string; count: number; percentage: number }[];
  }>({
    kpis: {
      total_fraud_cases: 248,
      fraud_rate: '15.2%',
      compared_to_previous: '-21.7%',
      amount_saved: '₹18.4L',
    },
    fraud_trend: [
      { date: 'Oct 1', cases: 18 },
      { date: 'Oct 5', cases: 32 },
      { date: 'Oct 10', cases: 54 },
      { date: 'Oct 15', cases: 41 },
      { date: 'Oct 20', cases: 62 },
      { date: 'Oct 25', cases: 85 },
      { date: 'Oct 30', cases: 68 },
    ],
    fraud_by_category: [
      { name: 'UPI', percentage: 42, color: '#7c3aed', count: 104 },
      { name: 'Card', percentage: 28, color: '#3b82f6', count: 69 },
      { name: 'Wallet', percentage: 16, color: '#06b6d4', count: 40 },
      { name: 'Net Banking', percentage: 10, color: '#ec4899', count: 25 },
      { name: 'Others', percentage: 4, color: '#f97316', count: 10 },
    ],
    top_reasons: [
      { reason: 'Unusual amount & location', count: 86, percentage: 34.7 },
      { reason: 'New device & High frequency', count: 64, percentage: 25.8 },
      { reason: 'Multiple failed attempts', count: 48, percentage: 19.3 },
      { reason: 'Unusual time of transaction', count: 32, percentage: 12.9 },
      { reason: 'Impersonation scam pattern', count: 18, percentage: 7.3 },
    ],
  });

  useEffect(() => {
    setIsLoading(true);
    fetchAnalytics(period)
      .then((res) => {
        setData(res);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, [period]);

  // Donut geometry for Fraud by Category
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  let accumulatedOffset = 0;

  return (
    <div className="flex-1 flex flex-col p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <Header
        title="Risk Analytics"
        subtitle="Trends, patterns and insights from transaction data"
        period={period}
        onPeriodChange={setPeriod}
        unreadCount={unreadCount}
        onOpenNotifications={onOpenNotifications}
      />

      {/* 4 Top KPI Cards (Authoritative Panel 6) with 3D Tilt */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Fraud Cases */}
        <ScrollReveal staggerIndex={0} direction="up" className="h-full">
          <TiltCard maxTilt={8} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2 h-full flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                <AnimatedCounter value={data.kpis.total_fraud_cases} />
              </span>
            </div>
            <div className="text-xs font-semibold text-slate-500">
              Total Fraud Cases
            </div>
          </TiltCard>
        </ScrollReveal>

        {/* Fraud Rate */}
        <ScrollReveal staggerIndex={1} direction="up" className="h-full">
          <TiltCard maxTilt={8} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2 h-full flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Percent className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                <AnimatedCounter value={data.kpis.fraud_rate} />
              </span>
            </div>
            <div className="text-xs font-semibold text-slate-500">
              Fraud Rate
            </div>
          </TiltCard>
        </ScrollReveal>

        {/* Compared to Previous */}
        <ScrollReveal staggerIndex={2} direction="up" className="h-full">
          <TiltCard maxTilt={8} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2 h-full flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="text-2xl lg:text-3xl font-black text-emerald-600 tracking-tight">
                <AnimatedCounter value={data.kpis.compared_to_previous} />
              </span>
            </div>
            <div className="text-xs font-semibold text-slate-500">
              Compared to Previous
            </div>
          </TiltCard>
        </ScrollReveal>

        {/* Amount Saved */}
        <ScrollReveal staggerIndex={3} direction="up" className="h-full">
          <TiltCard maxTilt={8} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2 h-full flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Wallet className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                <AnimatedCounter value={data.kpis.amount_saved} />
              </span>
            </div>
            <div className="text-xs font-semibold text-slate-500">
              Amount Saved
            </div>
          </TiltCard>
        </ScrollReveal>
      </div>

      {/* Main Charts Row (Authoritative Panel 6) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6 items-stretch">
        {/* Left: Fraud Trend Over Time with Animated Line Drawing */}
        <ScrollReveal direction="left" className="lg:col-span-8 flex flex-col h-full">
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight">
                  Fraud Trend Over Time
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Flagged incident occurrences across the evaluation window
                </p>
              </div>
            </div>

            <div className="relative h-60 w-full pt-4">
              {/* Y-Axis */}
              <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[10px] font-semibold text-slate-400 select-none">
                <span>90</span>
                <span>75</span>
                <span>60</span>
                <span>45</span>
                <span>30</span>
                <span>15</span>
                <span>0</span>
              </div>

              {/* SVG Canvas */}
              <div className="ml-8 h-full relative">
                <svg className="w-full h-48 overflow-visible" viewBox="0 0 700 200" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="purpleTrendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
                  <line x1="0" y1="33" x2="700" y2="33" stroke="#f1f5f9" strokeDasharray="3 3" />
                  <line x1="0" y1="66" x2="700" y2="66" stroke="#f1f5f9" strokeDasharray="3 3" />
                  <line x1="0" y1="100" x2="700" y2="100" stroke="#f1f5f9" strokeDasharray="3 3" />
                  <line x1="0" y1="133" x2="700" y2="133" stroke="#f1f5f9" strokeDasharray="3 3" />
                  <line x1="0" y1="166" x2="700" y2="166" stroke="#f1f5f9" strokeDasharray="3 3" />

                  {/* Purple Area & Smooth Animated Line */}
                  <path
                    d="M 0 160 Q 116 130 233 80 T 466 65 T 583 15 T 700 50 L 700 200 L 0 200 Z"
                    fill="url(#purpleTrendGrad)"
                    className="transition-all duration-1000 ease-out"
                  />
                  <path
                    d="M 0 160 Q 116 130 233 80 T 466 65 T 583 15 T 700 50"
                    fill="none"
                    stroke="#7c3aed"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    style={{
                      strokeDasharray: '1000',
                      animation: 'drawPath 1.8s ease-out forwards',
                    }}
                  />

                  {/* Data Points */}
                  {[
                    { x: 0, y: 160, c: 18 },
                    { x: 116, y: 130, c: 32 },
                    { x: 233, y: 80, c: 54 },
                    { x: 350, y: 110, c: 41 },
                    { x: 466, y: 65, c: 62 },
                    { x: 583, y: 15, c: 85 },
                    { x: 700, y: 50, c: 68 },
                  ].map((pt, idx) => (
                    <circle
                      key={idx}
                      cx={pt.x}
                      cy={pt.y}
                      r="5"
                      fill="#7c3aed"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      className="hover:scale-150 transition-transform cursor-pointer"
                    />
                  ))}
                </svg>

                {/* X-Axis */}
                <div className="flex justify-between text-[11px] font-bold text-slate-400 mt-2">
                  {data.fraud_trend.map((t, idx) => (
                    <span key={idx}>{t.date}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Right: Fraud by Category (Authoritative Panel 6 Donut) */}
        <ScrollReveal direction="right" className="lg:col-span-4 flex flex-col h-full">
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between h-full">
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Fraud by Category
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Incident proportion across payment methods
              </p>
            </div>

            {/* Donut with Credit Card Icon */}
            <div className="relative flex items-center justify-center py-4">
              <svg className="w-48 h-48 -rotate-90" viewBox="0 0 160 160">
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke="#f1f5f9"
                  strokeWidth="16"
                />
                {data.fraud_by_category.map((cat, idx) => {
                  const dashLength = (cat.percentage / 100) * circumference;
                  const offset = -accumulatedOffset;
                  accumulatedOffset += dashLength;

                  return (
                    <circle
                      key={idx}
                      cx="80"
                      cy="80"
                      r={radius}
                      fill="none"
                      stroke={cat.color}
                      strokeWidth="16"
                      strokeDasharray={`${dashLength} ${circumference}`}
                      strokeDashoffset={offset}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.16, 1, 0.3, 1), stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
                    />
                  );
                })}
              </svg>

              {/* Center Credit Card Icon */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-violet-600">
                <CreditCard className="w-8 h-8 stroke-[2.2]" />
              </div>
            </div>

            {/* Category Legend with exact percentages */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              {data.fraud_by_category.map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-slate-700">{cat.name}</span>
                  </div>
                  <span className="font-bold text-slate-900">{cat.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* Top Triggered Reasons Breakdown */}
      <ScrollReveal direction="up">
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm">
          <h2 className="text-base font-black text-slate-900 tracking-tight mb-4">
            Frequently Triggered Detection Signals
          </h2>
          <div className="space-y-3">
            {data.top_reasons.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-800">{item.reason}</span>
                  <span className="text-slate-500 font-mono">
                    {item.count} cases ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
};
