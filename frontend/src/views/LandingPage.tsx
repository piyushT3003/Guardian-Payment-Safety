import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldAlert,
  ArrowRight,
  Play,
  Zap,
  Target,
  UserCheck,
  BellRing,
  CheckCircle2,
  Lock,
  Smartphone,
  Eye,
  TrendingDown,
  Layers,
  FileCheck,
  Sparkles,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { ThreeShield } from '../components/ThreeShield';
import { WatchDemoModal } from '../components/WatchDemoModal';
import { PageView } from '../types';
import { fetchLandingStats } from '../api';
import { ScrollProgressBar } from '../components/animations/ScrollProgressBar';
import { ScrollReveal } from '../components/animations/ScrollReveal';
import { MagneticButton } from '../components/animations/MagneticButton';
import { TiltCard } from '../components/animations/TiltCard';
import { AnimatedCounter } from '../components/animations/AnimatedCounter';
import { CursorSpotlight } from '../components/animations/CursorSpotlight';

interface LandingPageProps {
  onNavigate: (view: PageView) => void;
  onRunDemo?: (scenario: 1 | 2) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onRunDemo }) => {
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [stats, setStats] = useState({
    transactions_analyzed: '12,840',
    detection_performance: '99.2%',
    monitoring_status: 'Live & Guarding',
    protected_amount: '₹18.4L',
  });

  useEffect(() => {
    fetchLandingStats()
      .then((data) => setStats(data))
      .catch((err) => console.error(err));
  }, []);

  const featureCards = [
    {
      title: 'Real-time',
      subtitle: 'Fraud Detection',
      icon: Zap,
      action: () => onNavigate('monitoring'),
    },
    {
      title: 'Risk Scoring',
      subtitle: '(0–100)',
      icon: Target,
      action: () => onNavigate('analyze'),
    },
    {
      title: 'Customer',
      subtitle: 'Safety Profile',
      icon: UserCheck,
      action: () => onNavigate('customer'),
    },
    {
      title: 'Actionable',
      subtitle: 'Alerts & Reports',
      icon: BellRing,
      action: () => onNavigate('reports'),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-[#f5f3ff]/40 to-slate-50 flex flex-col font-sans relative overflow-x-hidden">
      <ScrollProgressBar />
      <CursorSpotlight />
      <Navbar currentView="landing" onNavigate={onNavigate} />

      {/* Hero Section (Authoritative Panel 1) */}
      <section className="relative px-6 lg:px-12 pt-8 pb-16 lg:py-20 max-w-7xl mx-auto w-full flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6">
            <ScrollReveal direction="up" delay={0.05}>
              {/* Pill Tag */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-violet-200/90 shadow-sm text-xs font-bold text-violet-700">
                <span className="w-2 h-2 rounded-full bg-violet-600 animate-pulse" />
                AI-Powered • Real-time • Secure
              </div>
            </ScrollReveal>

            {/* Main Headline */}
            <ScrollReveal direction="up" delay={0.12}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.08]">
                Safer Digital <br />
                Payments for <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-700 font-black">
                  Everyone
                </span>
              </h1>
            </ScrollReveal>

            {/* Description */}
            <ScrollReveal direction="up" delay={0.18}>
              <p className="text-base sm:text-lg text-slate-600 max-w-xl font-normal leading-relaxed">
                Detects suspicious transactions, prevents fraud and adds an extra layer of protection,
                especially for senior and vulnerable users.
              </p>
            </ScrollReveal>

            {/* Action Buttons */}
            <ScrollReveal direction="up" delay={0.24}>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <MagneticButton
                  onClick={() => onNavigate('dashboard')}
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-sm font-bold shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:shadow-violet-500/35 active:scale-95 cursor-pointer"
                >
                  Try Guardian
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </MagneticButton>

                <MagneticButton
                  onClick={() => setIsDemoOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-900 text-sm font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center">
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </div>
                  Watch Demo
                </MagneticButton>
              </div>

              {/* Quick Direct Launch Demo Scenarios */}
              <div className="flex items-center gap-2 pt-3 flex-wrap text-xs">
                <span className="text-slate-600 font-semibold flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  Live Scenarios:
                </span>
                <button
                  onClick={() => onRunDemo?.(1)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-300/60 font-black transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
                >
                  <Play className="w-3 h-3 fill-current text-amber-600" />
                  <span>Demo 1: Hold Flow</span>
                </button>
                <button
                  onClick={() => onRunDemo?.(2)}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-900 border border-rose-300/60 font-black transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
                >
                  <Sparkles className="w-3 h-3 text-rose-600" />
                  <span>Demo 2: 5-Min Recovery</span>
                </button>
              </div>
            </ScrollReveal>

            {/* Live Stats Row with Animated Numerical Counters */}
            <ScrollReveal direction="up" delay={0.3}>
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-200/80 max-w-lg">
                <div>
                  <div className="text-2xl font-black text-slate-900">
                    <AnimatedCounter value={stats.transactions_analyzed} />
                  </div>
                  <div className="text-xs text-slate-500 font-semibold mt-0.5">
                    Transactions Analysed
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black text-emerald-600">
                    <AnimatedCounter value={stats.detection_performance} />
                  </div>
                  <div className="text-xs text-slate-500 font-semibold mt-0.5">
                    Detection Accuracy
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black text-violet-600">
                    <AnimatedCounter value={stats.protected_amount} />
                  </div>
                  <div className="text-xs text-slate-500 font-semibold mt-0.5">
                    Protected Amount
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Right 3D Visual Column */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            {/* Soft background glow */}
            <div className="absolute w-72 h-72 bg-violet-400/20 rounded-full blur-3xl pointer-events-none -z-0" />
            <div className="absolute w-60 h-60 bg-cyan-400/15 rounded-full blur-2xl pointer-events-none -z-0 translate-x-20 translate-y-10" />

            {/* Three.js Interactive Canvas with Mouse Parallax & Orbit */}
            <div className="w-full relative z-10 flex items-center justify-center">
              <ThreeShield />
            </div>
          </div>
        </div>

        {/* 4 Bottom Feature Cards (Authoritative Panel 1 Bottom Row) with 3D Tilt */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12 pt-6">
          {featureCards.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <ScrollReveal key={i} staggerIndex={i} direction="up">
                <TiltCard
                  maxTilt={10}
                  onClick={feat.action}
                  className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-violet-300 transition-all cursor-pointer group flex items-center gap-3.5 h-full"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-violet-600 flex items-center justify-center shrink-0 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-violet-600 transition-colors leading-snug">
                      {feat.title}
                    </div>
                    <div className="text-xs font-semibold text-slate-500">
                      {feat.subtitle}
                    </div>
                  </div>
                </TiltCard>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      {/* Deep-Dive Sections */}
      <section id="features" className="py-20 px-6 lg:px-12 bg-white border-t border-slate-200/60">
        <div className="max-w-7xl mx-auto space-y-12">
          <ScrollReveal direction="up">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                Designed to Stop Scam Patterns Before Balance Loss
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                Unlike generic card fraud tools, Guardian specializes in authorized push payment fraud,
                digital arrest sequence interception, and elder payment safety.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ScrollReveal staggerIndex={0} direction="up">
              <TiltCard maxTilt={8} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-3 h-full">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Personalized Baselines</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Learns per-user spending geometry using unsupervised IsolationForest anomaly detection.
                  Adapts to each individual without false positives on ordinary transactions.
                </p>
              </TiltCard>
            </ScrollReveal>

            <ScrollReveal staggerIndex={1} direction="up">
              <TiltCard maxTilt={8} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-3 h-full">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Deterministic Explanations</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Every flag produces explicit, human-readable reasons (e.g. "Unusual amount & location",
                  "New device & high frequency") with zero hallucination.
                </p>
              </TiltCard>
            </ScrollReveal>

            <ScrollReveal staggerIndex={2} direction="up">
              <TiltCard maxTilt={8} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-3 h-full">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Human-In-The-Loop Control</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  No autonomous money freezing without review. Security teams and trusted family members
                  retain full audit control with Approve and Reject actions.
                </p>
              </TiltCard>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-6 lg:px-12 bg-slate-50 border-t border-slate-200/60">
        <div className="max-w-5xl mx-auto space-y-12">
          <ScrollReveal direction="up">
            <div className="text-center max-w-xl mx-auto">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                How Guardian Works
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                Three-phase pipeline from raw payment event to human verification.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ScrollReveal staggerIndex={0} direction="up">
              <TiltCard maxTilt={8} className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3 h-full">
                <div className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-black">
                  1
                </div>
                <h3 className="text-sm font-bold text-slate-900">Event Ingestion</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Transactions arrive via RazorpayX payout webhooks or batch CSV dataset uploads with HMAC verification.
                </p>
              </TiltCard>
            </ScrollReveal>

            <ScrollReveal staggerIndex={1} direction="up">
              <TiltCard maxTilt={8} className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3 h-full">
                <div className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-black">
                  2
                </div>
                <h3 className="text-sm font-bold text-slate-900">AI Risk Scoring</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Guardian evaluates recipient familiarity, burst contact intervals, and amount deviation against 90-day history.
                </p>
              </TiltCard>
            </ScrollReveal>

            <ScrollReveal staggerIndex={2} direction="up">
              <TiltCard maxTilt={8} className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3 h-full">
                <div className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-black">
                  3
                </div>
                <h3 className="text-sm font-bold text-slate-900">Review & Resolution</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  High-risk sequences dispatch alerts to company security and trusted family. Reviewer confirms decision in audit trail.
                </p>
              </TiltCard>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="about" className="py-10 px-6 lg:px-12 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-brand-600 fill-brand-600/20" />
            <span className="font-bold text-slate-800">Guardian AI Payment Safety</span>
            <span>• Behavioral Risk Layer</span>
          </div>
          <div>
            Built with deterministic explainable AI & human-in-the-loop review.
          </div>
        </div>
      </footer>

      {/* Watch Demo Modal */}
      <WatchDemoModal
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
        onCompleteDemo={() => onNavigate('dashboard')}
        onRunScenario={(scenario) => {
          setIsDemoOpen(false);
          onRunDemo?.(scenario);
        }}
      />
    </div>
  );
};
