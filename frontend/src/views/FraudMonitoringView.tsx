import React, { useState, useEffect } from 'react';
import {
  Search,
  ChevronDown,
  Filter,
  CheckCircle,
  XCircle,
  ArrowUpDown,
  RotateCcw,
  Eye,
  X,
  Globe,
  LayoutList,
  Radio,
  Play,
  Sparkles,
} from 'lucide-react';
import { Header } from '../components/Header';
import { PageView, Transaction, RiskLevel } from '../types';
import { fetchTransactions, takeTransactionAction, loadTemplateSampleData, executeEmergencyRecovery } from '../api';
import { GlobalSatelliteRadar } from '../components/GlobalSatelliteRadar';
import { ScrollReveal } from '../components/animations/ScrollReveal';
import { TiltCard } from '../components/animations/TiltCard';
import { motion, AnimatePresence } from 'framer-motion';

interface FraudMonitoringViewProps {
  onNavigate: (view: PageView) => void;
  onSelectTransaction: (tx: Transaction) => void;
  onRequestConfirmAction: (tx: Transaction, action: 'APPROVE' | 'REJECT') => void;
  onOpenNotifications: () => void;
  unreadCount?: number;
  dataVersion?: number;
  onRunScenario?: (scenario: 1 | 2) => void;
}

export const FraudMonitoringView: React.FC<FraudMonitoringViewProps> = ({
  onNavigate,
  onSelectTransaction,
  onRequestConfirmAction,
  onOpenNotifications,
  unreadCount = 0,
  dataVersion,
  onRunScenario,
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'radar'>('table');
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('7D');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(false);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const loadData = (silent = false) => {
    if (!silent) setIsLoading(true);
    fetchTransactions({
      search,
      risk: riskFilter,
      status: statusFilter,
      period: dateFilter,
      page,
      page_size: pageSize,
    })
      .then((res) => {
        setTransactions(res.transactions);
        setTotalPages(res.total_pages);
        setTotalCount(res.total);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  };

  const handleLoadTemplateSample = async () => {
    setIsLoading(true);
    try {
      await loadTemplateSampleData();
      loadData(true);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(false);
  }, [search, riskFilter, dateFilter, statusFilter, page]);

  useEffect(() => {
    if (dataVersion !== undefined) {
      loadData(true);
    }
  }, [dataVersion]);

  return (
    <div className="flex-1 flex flex-col p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <Header
        title="Fraud Monitoring"
        subtitle="Review and take action on suspicious transactions"
        showPeriodFilter={false}
        unreadCount={unreadCount}
        onOpenNotifications={onOpenNotifications}
      />

      {/* Mode Switcher Tabs */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center p-1 bg-slate-200/70 rounded-2xl text-xs font-bold shadow-inner">
          <button
            onClick={() => setViewMode('table')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white text-slate-900 shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutList className="w-3.5 h-3.5" />
            <span>Table View</span>
          </button>
          <button
            onClick={() => setViewMode('radar')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              viewMode === 'radar'
                ? 'bg-slate-900 text-cyan-300 shadow-md font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            <span>Live Satellite Radar</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          {viewMode === 'table' ? (
            <span>Showing verified fraud queue</span>
          ) : (
            <span className="flex items-center gap-1.5 text-cyan-600 font-bold">
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
              Orbital Satellite Link Active
            </span>
          )}
        </div>
      </div>

      {viewMode === 'radar' ? (
        <GlobalSatelliteRadar onSelectTransaction={onSelectTransaction} />
      ) : (
        /* Main Table Card (Authoritative Panel 4) */
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-5">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full sm:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by Transaction ID, User or Amount..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full h-10 pl-10 pr-9 rounded-xl border border-slate-200 text-xs font-medium placeholder-slate-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-slate-50/50"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {/* Risk Filter */}
              <div className="relative">
                <select
                  value={riskFilter}
                  onChange={(e) => {
                    setRiskFilter(e.target.value);
                    setPage(1);
                  }}
                  className="h-10 appearance-none bg-white border border-slate-200 text-xs font-bold text-slate-700 pl-3.5 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer shadow-sm"
                >
                  <option value="ALL">All Risk</option>
                  <option value="HIGH">High Risk</option>
                  <option value="MEDIUM">Medium Risk</option>
                  <option value="LOW">Low Risk</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Date Filter */}
              <div className="relative">
                <select
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value);
                    setPage(1);
                  }}
                  className="h-10 appearance-none bg-white border border-slate-200 text-xs font-bold text-slate-700 pl-3.5 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer shadow-sm"
                >
                  <option value="7D">Last 7 Days</option>
                  <option value="30D">Last 30 Days</option>
                  <option value="ALL">All Time</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Transaction Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4 min-w-[210px]">Transaction ID</th>
                  <th className="py-3.5 px-4 min-w-[110px]">Amount</th>
                  <th className="py-3.5 px-4 min-w-[130px]">Risk Score</th>
                  <th className="py-3.5 px-4 min-w-[100px]">Risk Level</th>
                  <th className="py-3.5 px-4 min-w-[220px]">Reason</th>
                  <th className="py-3.5 px-4 text-center min-w-[170px]">Action</th>
                </tr>
              </thead>
            <tbody className="divide-y divide-slate-100/80 text-xs font-medium text-slate-700">
              <AnimatePresence mode="wait">
              {isLoading ? (
                <tr key="loading">
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full mx-auto mb-3"
                    />
                    <p className="text-xs font-semibold text-slate-500">Fetching latest transactions...</p>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr key="empty">
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-bold text-slate-700 mb-1">Zero Transactions in Database</p>
                    <p className="text-xs text-slate-500 mb-4 max-w-md mx-auto">
                      Click below to stream live elderly payments with staged scam scenarios, or load baseline template records.
                    </p>
                    <div className="flex items-center justify-center gap-2.5 flex-wrap">
                      <button
                        onClick={() => onRunScenario?.(1)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all shadow-sm cursor-pointer active:scale-95"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>▶ Run Demo 1: Hold Flow</span>
                      </button>
                      <button
                        onClick={() => onRunScenario?.(2)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition-all shadow-sm cursor-pointer active:scale-95"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>⚡ Run Demo 2: 5-Min Recovery</span>
                      </button>
                      <button
                        onClick={handleLoadTemplateSample}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-50 text-brand-700 border border-brand-200 text-xs font-bold hover:bg-brand-600 hover:text-white transition-all shadow-sm cursor-pointer active:scale-95"
                      >
                        <span>📋 Load Template 5 Sample Rows (Panel 4)</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((tx, rowIdx) => {
                  const isHigh = tx.risk_level === 'HIGH';
                  const isMed = tx.risk_level === 'MEDIUM';

                  return (
                    <motion.tr
                      key={tx.transaction_id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12 }}
                      transition={{ delay: rowIdx * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      whileHover={{ backgroundColor: 'rgba(248,250,252,0.9)', x: 2 }}
                      className="group cursor-pointer"
                      style={{ borderLeft: isHigh ? '3px solid #ef4444' : isMed ? '3px solid #f59e0b' : '3px solid transparent' }}
                    >
                      {/* Transaction ID & Elderly Account Holder */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => onSelectTransaction(tx)}
                          className="hover:text-violet-600 inline-flex flex-col text-left group-hover:underline cursor-pointer"
                        >
                          <span className="font-mono font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                            {tx.transaction_id}
                            {tx.status === 'ON_HOLD_BY_GUARDIAN' && (
                              <motion.span
                                animate={{ opacity: [1, 0.5, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-800 border border-amber-300"
                              >
                                ⏸️ On Hold by Family
                              </motion.span>
                            )}
                            {tx.status === 'PENDING_GUARDIAN_APPROVAL' && (
                              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                                ⏳ Awaiting Family
                              </span>
                            )}
                            {tx.status === 'ACCIDENTALLY_APPROVED' && (
                              <motion.span
                                animate={{ opacity: [1, 0.5, 1] }}
                                transition={{ duration: 1.2, repeat: Infinity }}
                                className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-rose-100 text-rose-700 border border-rose-300"
                              >
                                ⚠️ Accidental Approval (5m SLA)
                              </motion.span>
                            )}
                            {tx.status === 'RECOVERY_REQUESTED' && (
                              <motion.span
                                animate={{ opacity: [1, 0.5, 1] }}
                                transition={{ duration: 0.9, repeat: Infinity }}
                                className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-rose-600 text-white"
                              >
                                🚨 Recovery Requested
                              </motion.span>
                            )}
                            {tx.status === 'RECOVERED' && (
                              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                ✅ Funds Recovered
                              </span>
                            )}
                          </span>
                          <span className="text-[11px] text-slate-500 font-semibold mt-0.5">
                            {tx.elderly_name || tx.customer_name || 'Senior Customer'}
                            {tx.elderly_age ? ` (${tx.elderly_age} yrs)` : ''}
                          </span>
                        </button>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-black text-slate-900">
                        ₹{tx.amount.toLocaleString('en-IN')}
                      </td>

                      {/* Risk Score */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${isHigh ? 'bg-rose-500' : isMed ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, tx.risk_score)}%` }}
                              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: rowIdx * 0.04 }}
                            />
                          </div>
                          <span className="font-mono font-bold text-slate-700">{tx.risk_score.toFixed(0)}</span>
                        </div>
                      </td>

                      {/* Risk Level Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            isHigh
                              ? 'bg-rose-100 text-rose-700 animate-pulse-danger'
                              : isMed
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {tx.risk_level}
                        </span>
                      </td>

                      {/* Reason & Scam Category */}
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate" title={tx.reason}>
                        {tx.scam_category && (
                          <span className="font-bold text-slate-900 block truncate text-[11px]">
                            {tx.scam_category}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-500 block truncate">{tx.reason}</span>
                      </td>

                      {/* Action Column */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-2">
                          {tx.status === 'RECOVERY_REQUESTED' ? (
                            <motion.button
                              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                              onClick={async () => { await executeEmergencyRecovery(tx.transaction_id, 'Piyush Tandale (Admin)'); loadData(); }}
                              className="h-7.5 px-3 rounded-lg text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-sm inline-flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <span>⚡ Execute Recovery</span>
                            </motion.button>
                          ) : tx.status === 'RECOVERED' ? (
                            <span className="h-7.5 px-2.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center justify-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>Recovered</span>
                            </span>
                          ) : tx.status === 'PENDING_GUARDIAN_APPROVAL' ? (
                            <div className="flex items-center gap-1.5">
                              <span className="h-7.5 px-2 rounded-lg text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center justify-center">
                                ⏳ Pending Family
                              </span>
                              <motion.button
                                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                onClick={() => onRequestConfirmAction(tx, 'REJECT')}
                                className="h-7.5 px-2.5 rounded-lg text-xs font-bold bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 transition-colors shadow-sm inline-flex items-center justify-center cursor-pointer"
                              >
                                Reject
                              </motion.button>
                            </div>
                          ) : (
                            <>
                              <motion.button
                                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                onClick={() => onRequestConfirmAction(tx, 'APPROVE')}
                                disabled={tx.status === 'APPROVED'}
                                className={`h-7.5 px-3 rounded-lg text-xs font-bold transition-all border inline-flex items-center justify-center cursor-pointer ${
                                  tx.status === 'APPROVED'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default opacity-80'
                                    : 'bg-emerald-50/50 hover:bg-emerald-600 text-emerald-700 hover:text-white border-emerald-200 hover:border-emerald-600 shadow-sm'
                                }`}
                              >
                                {tx.status === 'APPROVED' ? 'Approved' : 'Approve'}
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                onClick={() => onRequestConfirmAction(tx, 'REJECT')}
                                disabled={tx.status === 'REJECTED'}
                                className={`h-7.5 px-3 rounded-lg text-xs font-bold transition-all border inline-flex items-center justify-center cursor-pointer ${
                                  tx.status === 'REJECTED'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200 cursor-default opacity-80'
                                    : tx.status === 'ON_HOLD_BY_GUARDIAN'
                                    ? 'bg-rose-600 text-white border-rose-600 shadow-md hover:bg-rose-700'
                                    : 'bg-rose-50/50 hover:bg-rose-600 text-rose-700 hover:text-white border-rose-200 hover:border-rose-600 shadow-sm'
                                }`}
                              >
                                {tx.status === 'REJECTED' ? 'Blocked' : tx.status === 'ON_HOLD_BY_GUARDIAN' ? 'Block & Save' : 'Reject'}
                              </motion.button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
          <div>
            Showing <strong>{transactions.length}</strong> of <strong>{totalCount}</strong> transactions
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white font-bold"
            >
              Previous
            </button>
            <span className="font-bold text-slate-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white font-bold"
            >
              Next
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
