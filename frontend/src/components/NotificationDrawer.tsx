import React from 'react';
import { X, Bell, ShieldAlert, CheckCircle, Clock } from 'lucide-react';
import { AlertNotification } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AlertNotification[];
  onMarkAllRead: () => void;
  onSelectTransaction?: (txId: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onSelectTransaction,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden" data-lenis-prevent="true">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 350, damping: 32 }}
        data-lenis-prevent="true"
        className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10"
      >
        {/* Header */}
        <div className="shrink-0 p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Notifications</h2>
              <p className="text-xs text-slate-500">Live fraud alerts and security updates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="shrink-0 px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>{notifications.length} Total Alerts</span>
          <button
            onClick={onMarkAllRead}
            className="text-brand-600 hover:text-brand-700 font-bold transition-colors"
          >
            Mark all as read
          </button>
        </div>

        {/* Notification List */}
        <div
          className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 overscroll-contain"
          data-lenis-prevent="true"
        >
          {notifications.length === 0 ? (
            <div className="text-center py-16 px-4">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3 stroke-[1.5]" />
              <div className="text-sm font-bold text-slate-700">All caught up!</div>
              <div className="text-xs text-slate-400 mt-1">No unread security alerts at this time.</div>
            </div>
          ) : (
            notifications.map((alert) => (
              <div
                key={alert.id}
                onClick={() => {
                  if (onSelectTransaction) onSelectTransaction(alert.transaction_id);
                  onClose();
                }}
                className={`p-3.5 rounded-xl cursor-pointer transition-all hover:bg-slate-50 ${
                  alert.status === 'UNREAD' ? 'bg-brand-50/40 border-l-4 border-brand-500' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {alert.title}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                      {alert.message}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
                        {alert.transaction_id}
                      </span>
                      <span className="text-[10px] text-brand-600 font-semibold hover:underline">
                        Review case →
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
};

