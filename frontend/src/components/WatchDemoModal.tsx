import React, { useState } from 'react';
import {
  X,
  Play,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  Lock,
  Smartphone,
  Sparkles,
  Zap,
} from 'lucide-react';
import { runDemoScenario1, runDemoScenario2 } from '../api';
import { motion, AnimatePresence } from 'framer-motion';

interface WatchDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleteDemo?: () => void;
  onRunScenario?: (scenario: 1 | 2) => void;
}

export const WatchDemoModal: React.FC<WatchDemoModalProps> = ({
  isOpen,
  onClose,
  onCompleteDemo,
  onRunScenario,
}) => {
  const [selectedScenario, setSelectedScenario] = useState<1 | 2>(1);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);

  if (!isOpen) return null;

  const scenario1Steps = [
    {
      title: 'Step 1: Routine Pharmacy Spend (Safe)',
      amount: '₹850',
      payee: 'Apollo Pharmacy (Dadar)',
      risk: 'LOW (Score 12/100)',
      riskLevel: 'LOW',
      details: 'Ramesh Kulkarni (68) pays everyday verified medical expenses. Matches historical 90-day baseline telemetry.',
      guardianAction: 'Telemetry logged. Auto-approved without user interruption.',
      badgeColor: 'bg-emerald-100 text-emerald-700',
    },
    {
      title: 'Step 2: Routine Electricity Utility Bill (Safe)',
      amount: '₹1,420',
      payee: 'Tata Power Domestic Utility',
      risk: 'LOW (Score 15/100)',
      riskLevel: 'LOW',
      details: 'Routine monthly domestic recurring utility invoice. Familiar payee, standard time-of-day spend.',
      guardianAction: 'Normal baseline. Auto-approved instantly.',
      badgeColor: 'bg-emerald-100 text-emerald-700',
    },
    {
      title: 'Step 3: Digital Arrest Extortion Scam (FRAUD)',
      amount: '₹48,000',
      payee: 'DCP Cyber Crime Escrow Node (Dubai)',
      risk: 'CRITICAL (Score 96/100)',
      riskLevel: 'HIGH',
      details: 'Coercive police video call extortion scam. 35× baseline jump, transcontinental destination (Dubai, 1,930 km).',
      guardianAction: 'INTERCEPTED! Placed ON HOLD. Urgent push alert dispatched to Aditya Kulkarni (Son).',
      badgeColor: 'bg-rose-100 text-rose-700',
    },
  ];

  const scenario2Steps = [
    {
      title: 'Step 1: Everyday Grocery Spend (Safe)',
      amount: '₹420',
      payee: "Nature's Basket (Bandra)",
      risk: 'LOW (Score 10/100)',
      riskLevel: 'LOW',
      details: 'Sunita Sharma (64) purchases everyday groceries. Normal neighbourhood merchant, familiar payment pattern.',
      guardianAction: 'Telemetry verified. Auto-approved smoothly.',
      badgeColor: 'bg-emerald-100 text-emerald-700',
    },
    {
      title: 'Step 2: Verified Healthcare Clinic (Safe)',
      amount: '₹650',
      payee: 'Dr. Lal PathLabs (Bandra)',
      risk: 'LOW (Score 14/100)',
      riskLevel: 'LOW',
      details: 'Routine pathology lab test. Familiar health provider, standard local transaction.',
      guardianAction: 'Normal spend. Auto-approved.',
      badgeColor: 'bg-emerald-100 text-emerald-700',
    },
    {
      title: 'Step 3: Foreign Lottery Scam (Accidental Approval)',
      amount: '₹35,000',
      payee: 'Global Prize Clearing Hub (Lagos, Nigeria)',
      risk: 'CRITICAL (Score 91/100)',
      riskLevel: 'HIGH',
      details: 'Advance-fee fake lottery fee. 7,200 km transcontinental routing. Accidental approval activates 5-minute NPCI recall window!',
      guardianAction: 'HELD & RECOVERABLE: Rapid recall clawback reverses ₹35,000 back into senior account with SHA-256 ledger.',
      badgeColor: 'bg-rose-100 text-rose-700',
    },
  ];

  const steps = selectedScenario === 1 ? scenario1Steps : scenario2Steps;

  const handleStartSimulation = async () => {
    setIsRunning(true);
    setCurrentStep(0);
    setIsDone(false);

    try {
      if (selectedScenario === 1) {
        await runDemoScenario1();
      } else {
        await runDemoScenario2();
      }

      setTimeout(() => setCurrentStep(1), 1400);
      setTimeout(() => setCurrentStep(2), 2800);
      setTimeout(() => {
        setIsRunning(false);
        setIsDone(true);
      }, 4200);
    } catch (err) {
      console.error(err);
      setIsRunning(false);
    }
  };

  const handleLaunchLiveInteractive = (scenario: 1 | 2) => {
    onClose();
    if (onRunScenario) {
      onRunScenario(scenario);
    } else if (onCompleteDemo) {
      onCompleteDemo();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto"
      data-lenis-prevent="true"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ type: 'spring', stiffness: 360, damping: 28 }}
        data-lenis-prevent="true"
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col my-auto max-h-[92vh]"
      >
        {/* Header */}
        <div className="shrink-0 p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/30 border border-violet-400/40 flex items-center justify-center text-violet-300">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white">
                Guardian Live Interactive Scenarios
              </h2>
              <p className="text-xs text-indigo-200">
                AI-assisted payment safety layer & elderly family intervention
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scenario Switcher Tabs */}
        <div className="shrink-0 p-4 bg-slate-100 border-b border-slate-200 flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedScenario(1);
              setCurrentStep(0);
              setIsDone(false);
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              selectedScenario === 1
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Scenario 1: Hold Flow (Ramesh Kulkarni)</span>
          </button>
          <button
            onClick={() => {
              setSelectedScenario(2);
              setCurrentStep(0);
              setIsDone(false);
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              selectedScenario === 2
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Scenario 2: 5-Min Recovery (Sunita Sharma)</span>
          </button>
        </div>

        {/* Timeline Visualization */}
        <div
          className="p-5 sm:p-6 space-y-5 flex-1 min-h-0 overflow-y-auto overscroll-contain"
          data-lenis-prevent="true"
        >
          <div className="grid grid-cols-3 gap-2">
            {steps.map((s, idx) => {
              const isActive = currentStep === idx;
              const isPast = currentStep > idx || isDone;

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border transition-all text-center cursor-pointer ${
                    isActive
                      ? 'border-brand-500 bg-brand-50/50 shadow-md ring-2 ring-brand-400/20'
                      : isPast
                      ? 'border-slate-200 bg-slate-50'
                      : 'border-slate-100 bg-white opacity-40'
                  }`}
                  onClick={() => setCurrentStep(idx)}
                >
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Step {idx + 1}
                  </div>
                  <div className="text-base font-black text-slate-900">{s.amount}</div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${s.badgeColor}`}>
                    {s.riskLevel}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Active Step Showcase Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">
                {steps[currentStep].title}
              </span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${steps[currentStep].badgeColor}`}>
                {steps[currentStep].risk}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {steps[currentStep].details}
            </p>

            <div className="p-3 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0" />
                <span className="text-xs font-bold text-slate-800">
                  Guardian Action:
                </span>
              </div>
              <span className="text-xs font-semibold text-brand-700">
                {steps[currentStep].guardianAction}
              </span>
            </div>
          </div>

          {/* Interception Alerts Preview (Triggered on step 3) */}
          {(currentStep === 2 || isDone) && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2 animate-in fade-in-50">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-xs">
                <Bell className="w-4 h-4 animate-bounce" />
                <span>Simulated Security Broadcasts Triggered:</span>
              </div>
              <div className="text-xs text-rose-900 space-y-1 pl-6">
                <div>• <strong>Company Security:</strong> Transaction flagged and held in review queue.</div>
                <div>• <strong>Trusted Family Contact:</strong> Automated push notification dispatched to designated family guardian.</div>
                <div>• <strong>Customer Protection:</strong> {selectedScenario === 1 ? '₹48,000' : '₹35,000'} potential financial loss prevented!</div>
              </div>
            </div>
          )}

          {/* Direct Interactive Launch Callout */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <div className="text-xs font-black text-violet-950 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-violet-600" />
                Ready to test with live streaming data?
              </div>
              <div className="text-[11px] text-violet-700 mt-0.5">
                Launch this scenario directly in the live Dashboard with real interactive alerts!
              </div>
            </div>
            <button
              onClick={() => handleLaunchLiveInteractive(selectedScenario)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-black shadow-md shadow-violet-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span>Launch Live {selectedScenario === 1 ? 'Demo 1' : 'Demo 2'} Sequence</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="shrink-0 p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between flex-wrap gap-2">
          <button
            onClick={handleStartSimulation}
            disabled={isRunning}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
          >
            {isRunning ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                Simulating Walkthrough...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                {isDone ? 'Replay Walkthrough' : 'Play Walkthrough Preview'}
              </>
            )}
          </button>

          <button
            onClick={() => {
              if (onCompleteDemo) onCompleteDemo();
              onClose();
            }}
            className="text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors cursor-pointer"
          >
            Go to Dashboard Overview →
          </button>
        </div>
      </motion.div>
    </div>
  );
};
