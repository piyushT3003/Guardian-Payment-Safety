import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldAlert,
  AlertTriangle,
  Phone,
  PhoneOff,
  PauseCircle,
  CheckCircle2,
  Clock,
  User,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Check,
  RotateCcw,
  Sparkles,
  Zap,
  XCircle,
} from 'lucide-react';
import { GuardianPendingAlert } from '../types';
import {
  takeGuardianAction,
  accidentalApproveTransaction,
  requestEmergencyRecovery,
  executeEmergencyRecovery,
  denyEmergencyRecovery,
} from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { CountdownRing } from './animations/CountdownRing';

interface FamilyGuardianAlertModalProps {
  alert: GuardianPendingAlert | null;
  isOpen: boolean;
  onClose: () => void;
  onActionComplete: () => void;
  onDataRefresh?: () => void;
}

export const FamilyGuardianAlertModal: React.FC<FamilyGuardianAlertModalProps> = ({
  alert,
  isOpen,
  onClose,
  onActionComplete,
  onDataRefresh,
}) => {
  const [isCalling, setIsCalling] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [heldSuccess, setHeldSuccess] = useState(false);
  const [allowedSuccess, setAllowedSuccess] = useState(false);
  const [accidentalApprovedSuccess, setAccidentalApprovedSuccess] = useState(false);
  const [recoveryRequestedSuccess, setRecoveryRequestedSuccess] = useState(false);
  const [recoveredSuccess, setRecoveredSuccess] = useState(false);
  const [recoveryDeniedSuccess, setRecoveryDeniedSuccess] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(300);

  // Reset all transient action states when alert or modal visibility changes
  useEffect(() => {
    setIsCalling(false);
    setCallEnded(false);
    setIsSubmitting(false);
    setHeldSuccess(false);
    setAllowedSuccess(false);
    setAccidentalApprovedSuccess(false);
    setRecoveryRequestedSuccess(false);
    setRecoveredSuccess(false);
    setRecoveryDeniedSuccess(false);

    if (alert?.recovery_expires_at) {
      const diff = Math.floor((new Date(alert.recovery_expires_at).getTime() - Date.now()) / 1000);
      setSecondsLeft(diff > 0 ? diff : 300);
    } else {
      setSecondsLeft(300);
    }
  }, [alert, isOpen]);

  // Active 5-minute countdown timer
  useEffect(() => {
    const isRecallActive =
      accidentalApprovedSuccess ||
      recoveryRequestedSuccess ||
      alert?.event_status === 'ACCIDENTALLY_APPROVED' ||
      alert?.event_status === 'RECOVERY_REQUESTED' ||
      alert?.recovery_status === 'AVAILABLE' ||
      alert?.recovery_status === 'REQUESTED';

    if (!isOpen || !isRecallActive) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, accidentalApprovedSuccess, recoveryRequestedSuccess, alert]);

  if (!isOpen || !alert) return null;

  const isSafeMode = !alert.transaction_id || alert.status === 'SAFE' || alert.risk_score === 0;

  const isRecovered =
    recoveredSuccess ||
    alert.event_status === 'RECOVERED' ||
    alert.recovery_status === 'RECOVERED';

  const isRecoveryRequested =
    !isRecovered &&
    (recoveryRequestedSuccess ||
      alert.event_status === 'RECOVERY_REQUESTED' ||
      alert.recovery_status === 'REQUESTED');

  const isAccidentallyApproved =
    !isRecovered &&
    !isRecoveryRequested &&
    (accidentalApprovedSuccess ||
      alert.event_status === 'ACCIDENTALLY_APPROVED' ||
      alert.recovery_status === 'AVAILABLE');

  const isRecoveryDenied =
    !isRecovered &&
    (recoveryDeniedSuccess ||
      alert.event_status === 'RECOVERY_DENIED' ||
      alert.recovery_status === 'DENIED');

  const isWindowExpired =
    !isRecovered &&
    !isRecoveryDenied &&
    (secondsLeft <= 0 ||
      alert.event_status === 'WINDOW_EXPIRED' ||
      alert.recovery_status === 'EXPIRED');

  const isScenario2 =
    alert.transaction_id === 'TXN-SCAM-5192' ||
    alert.scam_category?.includes('Foreign Lottery') ||
    alert.elderly_name === 'Sunita Sharma';

  // Format seconds to MM:SS
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const handleHold = async () => {
    setIsSubmitting(true);
    try {
      await takeGuardianAction(
        alert.transaction_id,
        'HOLD',
        alert.guardian_name ? `${alert.guardian_name} (${alert.guardian_relation || 'Family'})` : 'Aditya Kulkarni (Son)',
        'Placed ON HOLD by designated family guardian after urgent fraud alert.'
      );
      setHeldSuccess(true);
      setIsSubmitting(false);
      setTimeout(() => {
        onActionComplete();
      }, 1800);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  const handleAllow = async () => {
    setIsSubmitting(true);
    try {
      await takeGuardianAction(
        alert.transaction_id,
        'ALLOW',
        alert.guardian_name ? `${alert.guardian_name} (${alert.guardian_relation || 'Family'})` : 'Aditya Kulkarni (Son)',
        'Verified and authorized by family guardian.'
      );
      setAllowedSuccess(true);
      setIsSubmitting(false);
      setTimeout(() => {
        onActionComplete();
      }, 1800);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  const handleAccidentalApprove = async () => {
    setIsSubmitting(true);
    try {
      await accidentalApproveTransaction(alert.transaction_id);
      setAccidentalApprovedSuccess(true);
      setSecondsLeft(300);
      setIsSubmitting(false);
      onDataRefresh?.();
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  const handleRequestRecovery = async () => {
    setIsSubmitting(true);
    try {
      await requestEmergencyRecovery(alert.transaction_id);
      setRecoveryRequestedSuccess(true);
      setIsSubmitting(false);
      onDataRefresh?.();
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  const handleExecuteRecoveryAsAdmin = async () => {
    setIsSubmitting(true);
    try {
      await executeEmergencyRecovery(
        alert.transaction_id,
        'Piyush Tandale (Admin)',
        'Emergency inter-bank clawback executed under RBI/NPCI 5-minute rapid recall protocol. Full balance restored.'
      );
      setRecoveredSuccess(true);
      setIsSubmitting(false);
      onDataRefresh?.();
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  const handleDeclineRecovery = async () => {
    setIsSubmitting(true);
    try {
      await denyEmergencyRecovery(
        alert.transaction_id,
        'Piyush Tandale (Admin)',
        'Recovery request reviewed and declined by compliance officials.'
      );
      setRecoveryDeniedSuccess(true);
      setIsSubmitting(false);
      onDataRefresh?.();
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  const handleSimulateCall = () => {
    setIsCalling(true);
    setTimeout(() => {
      setIsCalling(false);
      setCallEnded(true);
    }, 3200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto"
      data-lenis-prevent="true"
    >
      {/* Animated Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Simulated Smartphone Card Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 32 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28, mass: 0.9 }}
        data-lenis-prevent="true"
        className={`relative w-full max-w-lg bg-slate-900 text-white rounded-3xl shadow-2xl overflow-hidden z-10 border-2 my-auto max-h-[92vh] flex flex-col ${
          isSafeMode
            ? 'border-emerald-500/80'
            : isRecovered
            ? 'border-emerald-500/90'
            : isAccidentallyApproved || isRecoveryRequested
            ? 'border-amber-500/90'
            : 'border-rose-500/80'
        }`}
        style={{
          boxShadow: isSafeMode || isRecovered
            ? '0 0 0 1px rgba(16,185,129,0.3), 0 25px 80px rgba(16,185,129,0.2), 0 8px 32px rgba(0,0,0,0.5)'
            : isAccidentallyApproved || isRecoveryRequested
            ? '0 0 0 1px rgba(245,158,11,0.3), 0 25px 80px rgba(245,158,11,0.2), 0 8px 32px rgba(0,0,0,0.5)'
            : '0 0 0 1px rgba(239,68,68,0.3), 0 25px 80px rgba(239,68,68,0.2), 0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        {/* Top Emergency / Safe / Recovery Status Bar */}
        <div
          className={`shrink-0 px-5 py-3 flex items-center justify-between text-xs font-black tracking-wider uppercase ${
            isSafeMode
              ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700'
              : isRecovered
              ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700'
              : isAccidentallyApproved || isRecoveryRequested
              ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700'
              : 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full bg-white ${
                isSafeMode || isRecovered ? '' : 'animate-ping'
              }`}
            />
            <span>
              {isSafeMode
                ? 'Guardian Family Shield • All Parents Safe'
                : isRecovered
                ? '✅ Funds Recovered • Protection Complete'
                : isAccidentallyApproved || isRecoveryRequested
                ? '⚡ 5-Minute Rapid Recall Window Active'
                : 'Emergency Guardian Push Notification'}
            </span>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg hover:text-white transition-colors ${
              isSafeMode || isRecovered
                ? 'text-emerald-200 hover:bg-emerald-800'
                : isAccidentallyApproved || isRecoveryRequested
                ? 'text-amber-200 hover:bg-amber-800'
                : 'text-rose-200 hover:bg-rose-800'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Smartphone Screen Header */}
        <div className="shrink-0 p-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center justify-between mb-2">
            <div
              className={`text-xs font-bold tracking-wide flex items-center gap-1.5 ${
                isSafeMode || isRecovered
                  ? 'text-emerald-400'
                  : isAccidentallyApproved || isRecoveryRequested
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {isSafeMode ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Family Protection Active</span>
                </>
              ) : isRecovered ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Account Restored</span>
                </>
              ) : isAccidentallyApproved || isRecoveryRequested ? (
                <>
                  <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                  <span>5-Min Emergency Clawback SLA</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4 text-rose-500 animate-bounce" />
                  <span>Suspicious Payment Detected</span>
                </>
              )}
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {alert.created_at ? new Date(alert.created_at).toLocaleTimeString() : 'Live'}
            </span>
          </div>

          <h2 className="text-xl font-black text-white tracking-tight">
            Protecting {alert.elderly_name || 'Senior Parent'}
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Designated Guardian View for{' '}
            <strong className="text-cyan-300 font-semibold">
              {alert.guardian_name || 'Family Guardian'} ({alert.guardian_relation || 'Family'})
            </strong>
          </p>
        </div>

        {/* Content Body - Smooth native scrolling, guaranteed accessible buttons */}
        <div
          className="p-5 space-y-4 flex-1 min-h-0 overflow-y-auto overscroll-contain"
          data-lenis-prevent="true"
        >
          {isSafeMode ? (
            /* Safe Baseline State (After Reset to 0 Data) */
            <div className="space-y-4 animate-in fade-in-50">
              <div className="p-6 bg-emerald-950/40 border border-emerald-500/50 rounded-2xl text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10">
                  <ShieldCheck className="w-9 h-9 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    All Senior Accounts Safe & Secure
                  </h3>
                  <p className="text-xs text-emerald-300 font-semibold mt-0.5">
                    0 Suspicious Payments • 0 Active Threats • Baseline Clean
                  </p>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                  Guardian AI is actively guarding your parent's accounts. No unauthorized transfers,
                  fake digital arrest interrogation calls, or phishing scams are detected.
                </p>
              </div>

              {/* 3 Family Status Metrics */}
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Active Threats
                  </span>
                  <span className="text-lg font-black text-emerald-400 mt-0.5 block">0</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Held Balance
                  </span>
                  <span className="text-lg font-black text-white mt-0.5 block">₹0</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Protection
                  </span>
                  <span className="text-lg font-black text-cyan-400 mt-0.5 block">100%</span>
                </div>
              </div>

              {/* Information Card */}
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs space-y-1.5 text-slate-300">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Monitored Elderly Citizens</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  • <strong>Ramesh Kulkarni (68)</strong> — Primary Account Safe<br />
                  • <strong>Sunita Sharma (64)</strong> — Safe<br />
                  • <strong>Vijay Deshmukh (72)</strong> — Safe
                </p>
                <div className="text-[11px] text-cyan-300/90 pt-1 border-t border-slate-700/60 font-medium">
                  Run Demo Scenario 1 or Scenario 2 above to simulate live scam intervention and emergency fund recovery.
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer border border-slate-700"
              >
                Close Family Guardian View
              </button>
            </div>
          ) : isRecovered ? (
            /* RECOVERY SUCCESS SCREEN */
            <div className="p-6 bg-emerald-950/70 border border-emerald-500/60 rounded-2xl text-center space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center ring-4 ring-emerald-500/20">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950 px-3 py-1 rounded-full border border-emerald-500/40">
                  RBI/NPCI Rapid Recall Completed
                </span>
                <h3 className="text-xl font-black text-emerald-300 mt-2">
                  ₹{alert.amount.toLocaleString('en-IN')} Successfully Recovered!
                </h3>
                <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                  The full balance of <strong>₹{alert.amount.toLocaleString('en-IN')}</strong> has been
                  clawed back from the fraudulent endpoint and restored to{' '}
                  <strong>{alert.elderly_name || 'Sunita Sharma'}</strong>'s account.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/40 text-left text-xs space-y-1.5 font-mono text-slate-300">
                <div className="text-[11px] text-emerald-400 font-bold">
                  Status: 100% RECOVERED & VERIFIED
                </div>
                <div>Account: State Bank of India ••••4190</div>
                <div>Action: Inter-bank fraud reversal executed by Bank SOC</div>
                <div className="text-[10px] text-slate-400 truncate">
                  SHA-256 Hash: 9e32a48bc901e1882ff0285a81284a199
                </div>
              </div>

              <button
                onClick={() => {
                  onActionComplete();
                  onClose();
                }}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
              >
                Done • Return to Dashboard
              </button>
            </div>
          ) : isRecoveryRequested ? (
            /* RECOVERY REQUESTED SCREEN (WAITING FOR BANK SOC EXECUTION) */
            <div className="p-5 bg-amber-950/70 border border-amber-500/70 rounded-2xl space-y-4 animate-in zoom-in-95">
              {/* Pulsing Timer Banner */}
              <div className="p-4 rounded-xl bg-amber-900/40 border border-amber-500/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CountdownRing
                    totalSeconds={300}
                    remainingSeconds={secondsLeft}
                    size={56}
                    strokeWidth={4}
                    normalColor="#f59e0b"
                    urgentColor="#ef4444"
                  />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-300 block">
                      Rapid Recall Countdown SLA
                    </span>
                    <span className="text-2xl font-mono font-black text-white block">
                      {timeFormatted}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                    Awaiting Bank SOC
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-base font-black text-amber-300 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Recovery Request Dispatched to Bank Officials!
                </h3>
                <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                  Family Guardian <strong>{alert.guardian_name || 'Rohit Sharma'}</strong> submitted an
                  emergency recall request for <strong>₹{alert.amount.toLocaleString('en-IN')}</strong>.
                  Bank SOC has received the alert and is executing the transaction clawback.
                </p>
              </div>

              {/* Transaction Recap */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/60 text-xs space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Transaction ID:</span>
                  <span className="font-mono text-white">{alert.transaction_id}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Target Beneficiary:</span>
                  <span className="text-rose-400 truncate max-w-[200px]">{alert.payee}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Distance:</span>
                  <span className="text-cyan-300">{alert.distance_km || 7200} km away</span>
                </div>
              </div>

              {/* Direct Instant Execution Option for Demo Testing */}
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                <button
                  onClick={handleExecuteRecoveryAsAdmin}
                  disabled={isSubmitting}
                  className="w-full sm:flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>⚡ Simulate Bank SOC Clawback (Recall ₹{alert.amount.toLocaleString('en-IN')})</span>
                </button>
                <button
                  onClick={handleDeclineRecovery}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto py-3.5 px-4 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-200 text-xs font-bold border border-rose-800 transition-colors cursor-pointer"
                >
                  Decline
                </button>
              </div>
            </div>
          ) : isRecoveryDenied ? (
            /* RECOVERY DECLINED SCREEN */
            <div className="p-6 bg-slate-900 border border-slate-700/80 rounded-2xl text-center space-y-3 animate-in zoom-in-95">
              <div className="w-14 h-14 rounded-full bg-slate-800 text-slate-300 mx-auto flex items-center justify-center border border-slate-700">
                <XCircle className="w-8 h-8 text-rose-400" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 bg-rose-950/60 px-3 py-1 rounded-full border border-rose-700/40">
                  Recovery Request Declined
                </span>
                <h3 className="text-lg font-black text-white mt-2">
                  Payment Status Preserved
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  The recovery request was audited and declined by compliance officials. Payment of <strong>₹{alert.amount.toLocaleString('en-IN')}</strong> remains completed and recorded in the audit trail.
                </p>
              </div>
              <button
                onClick={() => {
                  onActionComplete();
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer border border-slate-700"
              >
                Done • Return to Dashboard
              </button>
            </div>
          ) : isAccidentallyApproved ? (
            /* ACCIDENTALLY APPROVED — 5-MINUTE EMERGENCY RECOVERY COUNTDOWN SCREEN */
            <div className="p-5 bg-rose-950/70 border border-rose-500/70 rounded-2xl space-y-4 animate-in zoom-in-95">
              {/* Prominent Live 5-Min SLA Countdown */}
              <div className="p-4 rounded-xl bg-rose-900/50 border border-rose-500/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CountdownRing
                    totalSeconds={300}
                    remainingSeconds={secondsLeft}
                    size={56}
                    strokeWidth={4}
                    normalColor="#f59e0b"
                    urgentColor="#ef4444"
                  />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-rose-300 block">
                      NPCI Rapid Recall Window
                    </span>
                    <span className="text-2xl font-mono font-black text-white block">
                      {isWindowExpired ? '00:00' : timeFormatted}
                    </span>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                  isWindowExpired
                    ? 'bg-slate-800 text-slate-400 border-slate-700'
                    : 'bg-rose-500/30 text-rose-200 border-rose-500/50 animate-pulse'
                }`}>
                  {isWindowExpired ? 'WINDOW EXPIRED' : '5-MIN SLA ACTIVE'}
                </span>
              </div>

              {/* Warning explanation */}
              <div className="space-y-1.5">
                <div className="text-sm font-black text-rose-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Payment Completed By Mistake!</span>
                </div>
                <p className="text-xs text-rose-100/90 leading-relaxed">
                  ₹{alert.amount.toLocaleString('en-IN')} was approved and dispatched towards{' '}
                  <strong>{alert.payee}</strong> ({alert.dest_city || 'Lagos, Nigeria'}, {alert.distance_km || 7200} km).
                  Under RBI and NPCI rapid recall protections, you have <strong>5 minutes</strong> to claw back these funds.
                </p>
              </div>

              {/* Big Emergency Recovery Button or Expiration Warning */}
              {isWindowExpired ? (
                <div className="p-4 rounded-xl bg-slate-900 border border-rose-500/50 text-center space-y-2">
                  <div className="text-xs font-black text-rose-400 flex items-center justify-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <span>⚠️ 5-Minute Recall Window Expired</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    The 5-minute NPCI rapid recall window has elapsed for this transaction. Recovery actions are now disabled. The incident remains documented in the permanent bank audit ledger.
                  </p>
                  <button
                    disabled
                    className="w-full py-3 px-4 rounded-xl bg-slate-800 text-slate-500 text-xs font-bold cursor-not-allowed border border-slate-700"
                  >
                    Window Expired (Recovery Disabled)
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleRequestRecovery}
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-slate-950 text-sm font-black shadow-xl shadow-orange-500/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer animate-pulse"
                >
                  <RotateCcw className="w-5 h-5 stroke-[2.5]" />
                  <span>🚨 Request Immediate Fraud Recall / Recovery (5-Min SLA)</span>
                </button>
              )}
            </div>
          ) : heldSuccess ? (
            /* HELD SUCCESS SCREEN */
            <div className="p-6 bg-emerald-950/70 border border-emerald-500/60 rounded-2xl text-center space-y-3 animate-in zoom-in-95">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <h3 className="text-base font-black text-emerald-300">
                Payment Put On Hold Successfully!
              </h3>
              <p className="text-xs text-slate-200 leading-relaxed">
                The ₹{alert.amount.toLocaleString('en-IN')} transfer has been paused. Guardian bank security SOC has been alerted to freeze fund clearance and block the fraudulent beneficiary.
              </p>
            </div>
          ) : allowedSuccess ? (
            /* ALLOWED CONFIRMATION SCREEN */
            <div className="p-6 bg-blue-950/70 border border-blue-500/60 rounded-2xl text-center space-y-3 animate-in zoom-in-95">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-blue-300">
                Payment Authorization Confirmed
              </h3>
              <p className="text-xs text-slate-200 leading-relaxed">
                You marked this payment as verified. Bank reviewer updated.
              </p>
            </div>
          ) : (
            /* NORMAL THREAT NOTIFICATION VIEW (SCENARIO 1 & SCENARIO 2 PENDING) */
            <>
              {/* Payment Hold Status Pill */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs font-bold text-amber-300">
                <span className="flex items-center gap-1.5">
                  <PauseCircle className="w-4 h-4 text-amber-400" />
                  STATUS: PAYMENT HELD BY GUARDIAN ENGINE
                </span>
                <span className="text-[10px] bg-amber-400/20 px-2 py-0.5 rounded-full font-mono">
                  Awaiting Decision
                </span>
              </div>

              {/* Threat Summary Box with Sequential Detection Reasons */}
              <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-300">
                    Flagged Scam Pattern
                  </span>
                  <motion.span
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30"
                  >
                    Risk: {alert.risk_score}/100
                  </motion.span>
                </div>
                <div className="text-sm font-black text-white">
                  {alert.scam_category || 'Suspected Elderly Coercion / Extortion'}
                </div>
                <p className="text-xs text-rose-200/90 leading-relaxed">
                  {alert.ai_explanation || alert.message}
                </p>

                {/* Sequential Detection Signals */}
                <div className="pt-2 border-t border-rose-500/30 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300/80 block">
                    AI Detection Signals (Verified)
                  </span>
                  {[
                    `Deviation from 90-day baseline spending geometry (${alert.amount > 50000 ? 'Severe' : 'Unusual'} ₹${alert.amount.toLocaleString('en-IN')})`,
                    `Beneficiary familiarity: Unverified payee (${alert.payee})`,
                    `Geographical transit: ${alert.origin_city || 'Origin'} to ${alert.dest_city || 'Overseas Proxy'} (${alert.distance_km || 1930} km)`,
                    'IsolationForest anomaly confidence > 88%'
                  ].map((signal, sIdx) => (
                    <motion.div
                      key={sIdx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + sIdx * 0.1, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="flex items-center gap-2 text-[11px] text-rose-200"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                      <span>{signal}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Transaction Metrics */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                    Elderly Parent
                  </span>
                  <span className="text-sm font-bold text-white mt-1 block">
                    {alert.elderly_name || 'Senior Parent'} ({alert.elderly_age || '68'} yrs)
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Locality: {alert.origin_city || 'Mumbai'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                    Attempted Transfer
                  </span>
                  <span className="text-base font-black text-rose-400 mt-1 block">
                    ₹{alert.amount.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5 block truncate" title={alert.payee}>
                    To: {alert.payee}
                  </span>
                </div>
              </div>

              {/* Geo Transit Telemetry */}
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>
                    <strong>{alert.origin_city || 'Mumbai'}</strong> →{' '}
                    <strong className="text-rose-400">{alert.dest_city || 'Overseas Proxy'}</strong>
                  </span>
                </div>
                <span className="font-mono text-cyan-300 text-[11px]">
                  {alert.distance_km || 1930} km away
                </span>
              </div>

              {/* Simulated Call Box */}
              {isCalling ? (
                <div className="p-4 rounded-2xl bg-amber-950/80 border border-amber-500/70 text-center space-y-2 animate-pulse">
                  <Phone className="w-6 h-6 text-amber-400 mx-auto animate-bounce" />
                  <div className="text-xs font-bold text-amber-300">
                    Calling {alert.elderly_name || 'Parent'} (+91 98201 44821)...
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Simulating emergency guardian voice call to interrupt scammer coercion...
                  </div>
                </div>
              ) : callEnded ? (
                <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Call Connected with {alert.elderly_name || 'Parent'}</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Advised: <em>"Please hang up the call immediately. Never send money to unverified offshore or police escrow accounts. I am putting the payment on hold."</em>
                  </p>
                </div>
              ) : null}

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                {/* Primary: Keep on hold */}
                <motion.button
                  whileHover={{ scale: 1.02, translateY: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleHold}
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 text-sm font-black shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <PauseCircle className="w-5 h-5 fill-slate-950 text-amber-400" />
                  <span>{isSubmitting ? 'Securing Hold...' : '⏸️ Keep Payment on Hold (Prevent Loss)'}</span>
                </motion.button>

                {/* Secondary Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSimulateCall}
                    disabled={isCalling}
                    className="min-h-[38px] py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Call Parent</span>
                  </motion.button>

                  {isScenario2 ? (
                    /* In Scenario 2: Option to test accidental approval */
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleAccidentalApprove}
                      disabled={isSubmitting}
                      className="min-h-[38px] py-2 px-3 rounded-xl bg-rose-900/60 hover:bg-rose-800 text-rose-200 text-xs font-bold border border-rose-700/80 inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>Test Accidental Approval</span>
                    </motion.button>
                  ) : (
                    /* In Scenario 1: Option to allow if verified */
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleAllow}
                      disabled={isSubmitting}
                      className="min-h-[38px] py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Allow (I Verified)</span>
                    </motion.button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="shrink-0 p-3 bg-slate-950 border-t border-slate-800/80 text-center text-[10px] text-slate-400">
          Guardian Family Shield Protection Network • Instant Bank SOC Synchronization
        </div>
      </motion.div>
    </div>
  );
};
