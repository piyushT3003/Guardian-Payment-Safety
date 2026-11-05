import React, { useState } from 'react';
import { CheckCircle2, ShieldAlert, X, AlertTriangle } from 'lucide-react';
import { Transaction } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  actionType: 'APPROVE' | 'REJECT';
  onConfirm: (txId: string, action: 'APPROVE' | 'REJECT', notes: string) => Promise<void>;
}

export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  isOpen,
  onClose,
  transaction,
  actionType,
  onConfirm,
}) => {
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !transaction) return null;

  const isApprove = actionType === 'APPROVE';

  const handleExecute = async () => {
    setIsLoading(true);
    try {
      await onConfirm(transaction.transaction_id, actionType, notes);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto"
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
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 12 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        data-lenis-prevent="true"
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 p-6 my-auto max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isApprove ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
            {isApprove ? <CheckCircle2 className="w-6 h-6 stroke-[2.2]" /> : <ShieldAlert className="w-6 h-6 stroke-[2.2]" />}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4">
          <h3 className="text-lg font-black text-slate-900 tracking-tight">
            {isApprove ? 'Approve Transaction?' : 'Reject Transaction?'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {isApprove
              ? `You are confirming that transaction ${transaction.transaction_id} for ₹${transaction.amount.toLocaleString('en-IN')} is legitimate. This will clear the alert.`
              : `You are flagging transaction ${transaction.transaction_id} for ₹${transaction.amount.toLocaleString('en-IN')} as fraudulent. This will record a rejected audit decision.`}
          </p>
        </div>

        {/* Input for Notes */}
        <div className="mt-4">
          <label className="text-[11px] font-bold text-slate-700 block mb-1">
            Reviewer Notes / Reason (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={isApprove ? 'e.g. Verified with user via callback...' : 'e.g. Confirmed unverified beneficiary scam...'}
            className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 resize-none h-20 bg-slate-50/50"
          />
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-2.5">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02, translateY: -1 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            disabled={isLoading}
            onClick={handleExecute}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all cursor-pointer ${
              isApprove
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
            }`}
          >
            {isLoading ? 'Saving Decision...' : isApprove ? 'Confirm Approval' : 'Confirm Rejection'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

