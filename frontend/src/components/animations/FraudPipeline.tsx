import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wifi, Brain, MapPin, Cpu, Calculator, ShieldCheck, ShieldAlert, Loader2
} from 'lucide-react';

interface PipelineStage {
  id: string;
  label: string;
  sublabel: string;
  icon: React.FC<{ className?: string }>;
  colorClass: string;
  activeColorClass: string;
}

const STAGES: PipelineStage[] = [
  { id: 'received',   label: 'Transaction',   sublabel: 'Received',    icon: Wifi,        colorClass: 'bg-slate-200 text-slate-500',    activeColorClass: 'bg-cyan-500 text-white shadow-cyan-500/40' },
  { id: 'validation', label: 'Validation',    sublabel: 'Checks',      icon: ShieldCheck, colorClass: 'bg-slate-200 text-slate-500',    activeColorClass: 'bg-blue-500 text-white shadow-blue-500/40' },
  { id: 'behaviour',  label: 'Behavioural',   sublabel: 'Analysis',    icon: Brain,       colorClass: 'bg-slate-200 text-slate-500',    activeColorClass: 'bg-violet-500 text-white shadow-violet-500/40' },
  { id: 'location',   label: 'Location',      sublabel: 'Analysis',    icon: MapPin,      colorClass: 'bg-slate-200 text-slate-500',    activeColorClass: 'bg-indigo-500 text-white shadow-indigo-500/40' },
  { id: 'anomaly',    label: 'AI Anomaly',    sublabel: 'Detection',   icon: Cpu,         colorClass: 'bg-slate-200 text-slate-500',    activeColorClass: 'bg-purple-500 text-white shadow-purple-500/40' },
  { id: 'scoring',    label: 'Risk Score',    sublabel: 'Calculation', icon: Calculator,  colorClass: 'bg-slate-200 text-slate-500',    activeColorClass: 'bg-amber-500 text-white shadow-amber-500/40' },
  { id: 'decision',   label: 'Final',         sublabel: 'Decision',    icon: ShieldAlert, colorClass: 'bg-slate-200 text-slate-500',    activeColorClass: 'bg-rose-500 text-white shadow-rose-500/40' },
];

interface FraudPipelineProps {
  /**
   * 0 = idle, 1–7 = stage index (1-based), 8 = complete
   * Drive this from actual backend transaction state progression.
   */
  activeStage: number;
  /** Final risk level after detection */
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  /** Whether pipeline is currently processing */
  isProcessing?: boolean;
  className?: string;
}

export const FraudPipeline: React.FC<FraudPipelineProps> = ({
  activeStage,
  riskLevel = null,
  isProcessing = false,
  className = '',
}) => {
  const [revealedStages, setRevealedStages] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (activeStage > 0) {
      const s = new Set<number>();
      for (let i = 0; i < Math.min(activeStage, STAGES.length); i++) s.add(i);
      setRevealedStages(s);
    } else {
      setRevealedStages(new Set());
    }
  }, [activeStage]);

  const riskColor =
    riskLevel === 'HIGH'   ? 'text-rose-600 bg-rose-50 border-rose-200' :
    riskLevel === 'MEDIUM' ? 'text-amber-600 bg-amber-50 border-amber-200' :
    riskLevel === 'LOW'    ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : '';

  return (
    <div className={`select-none ${className}`}>
      {/* Stage nodes */}
      <div className="flex items-center gap-0">
        {STAGES.map((stage, idx) => {
          const Icon = stage.icon;
          const isActive = idx === activeStage - 1 && isProcessing;
          const isDone = revealedStages.has(idx) && idx < activeStage - 1;
          const isPending = !revealedStages.has(idx);

          return (
            <React.Fragment key={stage.id}>
              {/* Connector line */}
              {idx > 0 && (
                <div className="flex-1 h-px mx-0.5 relative overflow-hidden">
                  <div className="absolute inset-0 bg-slate-200 rounded-full" />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-violet-400 to-indigo-400 rounded-full origin-left"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: isDone || isActive ? 1 : 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: isDone ? idx * 0.06 : 0 }}
                  />
                  {/* Flowing signal dot */}
                  {(isDone || isActive) && (
                    <motion.div
                      className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-violet-500"
                      animate={{ x: ['0%', '100%'] }}
                      transition={{ duration: 1.2, ease: 'linear', repeat: Infinity, delay: idx * 0.15 }}
                    />
                  )}
                </div>
              )}

              {/* Node */}
              <motion.div
                className="flex flex-col items-center gap-1"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: isPending ? 0.35 : 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: isDone ? idx * 0.06 : 0 }}
              >
                <motion.div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                    isActive
                      ? stage.activeColorClass + ' shadow-lg'
                      : isDone
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                  animate={isActive ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                  transition={{ duration: 0.8, repeat: isActive ? Infinity : 0 }}
                >
                  {isActive && isProcessing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                </motion.div>
                <div className="text-center">
                  <div className={`text-[9px] font-bold leading-tight ${isPending ? 'text-slate-300' : 'text-slate-700'}`}>
                    {stage.label}
                  </div>
                  <div className={`text-[8px] leading-tight ${isPending ? 'text-slate-200' : 'text-slate-400'}`}>
                    {stage.sublabel}
                  </div>
                </div>
              </motion.div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Risk result reveal */}
      <AnimatePresence>
        {riskLevel && activeStage >= STAGES.length && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={`mt-3 px-4 py-2 rounded-xl border text-xs font-bold text-center ${riskColor}`}
          >
            {riskLevel === 'HIGH' && '🚨 HIGH RISK – Payment Held'}
            {riskLevel === 'MEDIUM' && '⚠️ MEDIUM RISK – Under Review'}
            {riskLevel === 'LOW' && '✅ LOW RISK – Approved'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
