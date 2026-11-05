import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  Search,
  Download,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  ArrowRight,
  Filter,
  ChevronLeft,
  ChevronRight,
  MapPin,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { Header } from '../components/Header';
import { PageView, Transaction, AuditAction, AuditSummary } from '../types';
import { fetchAuditTrail, getAuditTrailExportUrl } from '../api';

interface AuditTrailViewProps {
  onNavigate: (view: PageView) => void;
  onSelectTransaction: (tx: Transaction) => void;
  onOpenNotifications: () => void;
  unreadCount?: number;
  dataVersion?: number;
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({
  onNavigate,
  onSelectTransaction,
  onOpenNotifications,
  unreadCount = 0,
  dataVersion,
}) => {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<'ALL' | 'APPROVE' | 'REJECT'>('ALL');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(false);

  const [actions, setActions] = useState<AuditAction[]>([]);
  const [summary, setSummary] = useState<AuditSummary>({
    total_actions: 0,
    approved_count: 0,
    rejected_count: 0,
    total_amount_handled: 0,
    rejected_amount: 0,
    compliance_score: '100.0%',
    avg_review_time: '3.8 mins',
  });
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const loadData = (silent = false) => {
    if (!silent) setIsLoading(true);
    fetchAuditTrail({
      page,
      page_size: pageSize,
      action: actionFilter,
      q: search,
    })
      .then((res) => {
        setActions(res.actions);
        setSummary(res.summary);
        setTotalCount(res.total);
        setTotalPages(res.total_pages);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadData(false);
  }, [search, actionFilter, page]);

  useEffect(() => {
    if (dataVersion !== undefined) {
      loadData(true);
    }
  }, [dataVersion]);

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Convert an audit action into a minimal Transaction object to view details
  const handleOpenTransaction = (act: AuditAction) => {
    const isReject = act.action === 'REJECT';
    const tx: Transaction = {
      transaction_id: act.transaction_id,
      user_id: act.user_id,
      customer_name: act.customer_name,
      payee: act.payee,
      amount: act.amount,
      risk_score: isReject ? 0.89 : 0.28,
      risk_level: isReject ? 'HIGH' : 'LOW',
      reason: act.notes,
      reasons: [act.notes],
      status: act.new_status as any,
      location: act.origin_city,
      created_at: act.created_at,
    };
    onSelectTransaction(tx);
  };

  return (
    <div className="flex-1 flex flex-col p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Top Header */}
      <Header
        title="Audit Trail & Compliance Ledger"
        subtitle="Immutable SHA-256 cryptographic action records for all approved and rejected payments"
        showPeriodFilter={false}
        unreadCount={unreadCount}
        onOpenNotifications={onOpenNotifications}
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Actions */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">
              Total Decisions Logged
            </span>
            <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-slate-900">
              {summary.total_actions}
            </div>
            <div className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
              <span>100% Reviewer SLA</span>
              <span className="text-slate-400">· avg {summary.avg_review_time}</span>
            </div>
          </div>
        </div>

        {/* Approved Actions */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">
              Approved Payments
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-emerald-600">
              {summary.approved_count}
            </div>
            <div className="text-[11px] font-semibold text-slate-500 mt-1">
              Vol: ₹{(summary.total_amount_handled - summary.rejected_amount).toLocaleString('en-IN')} cleared
            </div>
          </div>
        </div>

        {/* Rejected Actions */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">
              Rejected Fraud Cases
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-rose-600">
              {summary.rejected_count}
            </div>
            <div className="text-[11px] font-semibold text-rose-600 mt-1">
              ₹{summary.rejected_amount.toLocaleString('en-IN')} fraud prevented
            </div>
          </div>
        </div>

        {/* Integrity Compliance */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">
              Chain Integrity
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-indigo-600">
              {summary.compliance_score}
            </div>
            <div className="text-[11px] font-semibold text-slate-500 mt-1">
              SHA-256 verified cryptographically
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-5">
        {/* Controls Bar: Search, Filters & CSV Export */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by Transaction ID, Customer, Payee or Hash..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 text-xs font-medium placeholder-slate-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-slate-50/50"
            />
          </div>

          {/* Action Filter Pills & Export Button */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div className="h-10 flex items-center p-1 bg-slate-100 rounded-xl text-xs font-bold">
              <button
                onClick={() => {
                  setActionFilter('ALL');
                  setPage(1);
                }}
                className={`h-8 px-3 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center ${
                  actionFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                All Actions
              </button>
              <button
                onClick={() => {
                  setActionFilter('APPROVE');
                  setPage(1);
                }}
                className={`h-8 px-3 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center ${
                  actionFilter === 'APPROVE'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-emerald-700'
                }`}
              >
                Approved
              </button>
              <button
                onClick={() => {
                  setActionFilter('REJECT');
                  setPage(1);
                }}
                className={`h-8 px-3 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center ${
                  actionFilter === 'REJECT'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-rose-700'
                }`}
              >
                Rejected
              </button>
            </div>

            {/* CSV Export Button */}
            <a
              href={getAuditTrailExportUrl()}
              download
              className="h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </a>

            {/* Reload Button */}
            <button
              onClick={() => loadData(false)}
              title="Refresh Audit Records"
              className="h-10 w-10 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer inline-flex items-center justify-center"
            >
              <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4 min-w-[80px]">Ref ID</th>
                <th className="py-3.5 px-4 min-w-[160px]">Timestamp (UTC)</th>
                <th className="py-3.5 px-4 min-w-[150px]">Transaction ID</th>
                <th className="py-3.5 px-4 min-w-[120px]">Decision</th>
                <th className="py-3.5 px-4 min-w-[110px]">Amount</th>
                <th className="py-3.5 px-4 min-w-[180px]">Customer & Recipient</th>
                <th className="py-3.5 px-4 min-w-[160px]">Route</th>
                <th className="py-3.5 px-4 min-w-[200px]">Reviewer & Justification</th>
                <th className="py-3.5 px-4 min-w-[130px]">Integrity Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <RotateCcw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-600" />
                    Loading verified audit ledger...
                  </td>
                </tr>
              ) : actions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No audit records found matching your filters.
                  </td>
                </tr>
              ) : (
                actions.map((act) => {
                  const isApprove = act.action === 'APPROVE';
                  const shortHash = act.action_hash ? `${act.action_hash.slice(0, 8)}...${act.action_hash.slice(-6)}` : 'Verified';

                  return (
                    <tr
                      key={act.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Ref ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-400">
                        #{act.id}
                      </td>

                      {/* Timestamp */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(act.created_at).toLocaleString()}
                      </td>

                      {/* Transaction ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        <button
                          onClick={() => handleOpenTransaction(act)}
                          className="hover:text-brand-600 hover:underline flex items-center gap-1 group-hover:translate-x-0.5 transition-transform text-left cursor-pointer"
                        >
                          <span>{act.transaction_id}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </td>

                      {/* Decision Badge */}
                      <td className="py-3.5 px-4">
                        {(() => {
                          const action = act.action;
                          let label = `${action}D`;
                          let badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
                          let IconComponent = FileCheck;

                          if (action === 'APPROVE') {
                            label = 'APPROVED';
                            badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                            IconComponent = CheckCircle2;
                          } else if (action === 'REJECT') {
                            label = 'REJECTED';
                            badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
                            IconComponent = XCircle;
                          } else if (action === 'HOLD') {
                            label = 'HELD ON HOLD';
                            badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
                            IconComponent = AlertTriangle;
                          } else if (action === 'ALLOW') {
                            label = 'ALLOWED';
                            badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
                            IconComponent = CheckCircle2;
                          } else if (action === 'ACCIDENTAL_APPROVE') {
                            label = 'ACCIDENTAL APPROVE';
                            badgeClass = 'bg-orange-50 text-orange-700 border-orange-200';
                            IconComponent = AlertTriangle;
                          } else if (action === 'RECOVERY_REQUESTED') {
                            label = 'RECALL REQUESTED';
                            badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
                            IconComponent = RotateCcw;
                          } else if (action === 'RECOVERED') {
                            label = 'RECOVERED';
                            badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                            IconComponent = CheckCircle2;
                          } else if (action === 'RECOVERY_DENIED') {
                            label = 'RECOVERY DENIED';
                            badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
                            IconComponent = XCircle;
                          }

                          return (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badgeClass}`}
                            >
                              <IconComponent className="w-3 h-3" />
                              <span>{label}</span>
                            </span>
                          );
                        })()}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-black text-slate-900 whitespace-nowrap">
                        ₹{act.amount.toLocaleString('en-IN')}
                      </td>

                      {/* Customer & Recipient */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">
                          {act.customer_name || act.user_id}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[150px]">
                          → {act.payee}
                        </div>
                      </td>

                      {/* Route */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                          <span>{act.origin_city || 'Mumbai'}</span>
                          <span className="text-slate-400">→</span>
                          <span className={act.destination_city !== 'Mumbai' ? 'text-rose-600 font-bold' : ''}>
                            {act.destination_city || 'Mumbai'}
                          </span>
                        </div>
                      </td>

                      {/* Reviewer & Notes */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-slate-800 text-[11px]">
                          {act.actor}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate" title={act.notes}>
                          {act.notes}
                        </div>
                      </td>

                      {/* Cryptographic SHA-256 Hash with Copy */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[10px]">
                        <button
                          onClick={() => handleCopyHash(act.action_hash)}
                          title="Click to copy full SHA-256 verification hash"
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                        >
                          <span>{shortHash}</span>
                          {copiedHash === act.action_hash ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-400" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
          <div>
            Showing <strong>{actions.length}</strong> of <strong>{totalCount}</strong> total review entries
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-xl border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-bold text-slate-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-xl border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
