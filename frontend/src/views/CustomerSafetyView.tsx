import React, { useState, useEffect } from 'react';
import {
  Search,
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  CreditCard,
  Phone,
  Mail,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { Header } from '../components/Header';
import { PageView, CustomerProfile, Transaction } from '../types';
import { fetchCustomerProfile, searchCustomers } from '../api';
import { TiltCard } from '../components/animations/TiltCard';
import { ScrollReveal } from '../components/animations/ScrollReveal';
import { AnimatedCounter } from '../components/animations/AnimatedCounter';
import { SafetyScoreGauge } from '../components/animations/SafetyScoreGauge';

interface CustomerSafetyViewProps {
  onNavigate: (view: PageView) => void;
  onSelectTransaction: (tx: Transaction) => void;
  onOpenNotifications: () => void;
  unreadCount?: number;
  initialCustomerId?: string;
  dataVersion?: number;
}

export const CustomerSafetyView: React.FC<CustomerSafetyViewProps> = ({
  onNavigate,
  onSelectTransaction,
  onOpenNotifications,
  unreadCount = 0,
  initialCustomerId = 'CUST-7821',
  dataVersion,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustomerId);
  const [isLoading, setIsLoading] = useState(false);

  const [customer, setCustomer] = useState<CustomerProfile>({
    customer_id: 'CUST-7821',
    name: 'Ramesh Kulkarni',
    age_group: '60+ (Senior User)',
    registered_since: 'Jan 2024',
    verified: true,
    phone: '+91 98201 44821',
    email: 'ramesh.kulkarni@example.com',
    total_transactions: 58,
    total_spent: 124300,
    safety_score: 82,
    safety_level: 'Safe',
    safety_summary: 'Low risk behaviour. No major fraud patterns detected.',
    trusted_payees: ['Local Pharmacy', 'Grocery Mart', 'Apollo Hospital Care', 'Electricity Board'],
  });

  const [recentTxns, setRecentTxns] = useState<Transaction[]>([
    {
      transaction_id: 'TXN-10492',
      user_id: 'CUST-7821',
      payee: 'Grocery Mart',
      amount: 4500,
      risk_score: 0.25,
      risk_level: 'LOW',
      reason: 'Normal pattern',
      status: 'APPROVED',
      created_at: '2026-10-29T10:05:00Z',
    },
    {
      transaction_id: 'TXN-10468',
      user_id: 'CUST-7821',
      payee: 'Apollo Hospital Care',
      amount: 12000,
      risk_score: 0.52,
      risk_level: 'MEDIUM',
      reason: 'Higher amount healthcare payment',
      status: 'APPROVED',
      created_at: '2026-10-27T15:20:00Z',
    },
  ]);

  const loadCustomer = (customerId: string, silent = false) => {
    if (!silent) setIsLoading(true);
    fetchCustomerProfile(customerId)
      .then((res) => {
        setCustomer(res.profile);
        if (res.recent_transactions && res.recent_transactions.length > 0) {
          setRecentTxns(res.recent_transactions);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadCustomer(selectedCustomerId, false);
  }, [selectedCustomerId]);

  useEffect(() => {
    if (dataVersion !== undefined) {
      loadCustomer(selectedCustomerId, true);
    }
  }, [dataVersion]);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const results = await searchCustomers(searchQuery.trim());
    if (results.length > 0) {
      setSelectedCustomerId(results[0].customer_id);
    }
  };

  // Circular gauge math for Safety Score (82/100)
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (customer.safety_score / 100) * circumference;

  return (
    <div className="flex-1 flex flex-col p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <Header
        title="Customer Safety Profile"
        subtitle="Transaction history, risk behaviour and safety insights"
        showPeriodFilter={false}
        unreadCount={unreadCount}
        onOpenNotifications={onOpenNotifications}
      />

      {/* Customer Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative w-full max-w-xl mb-6">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Search Customer ID / Name / Phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 pl-10 pr-24 rounded-xl border border-slate-200 text-xs font-medium placeholder-slate-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white shadow-sm"
        />
        <button
          type="submit"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7.5 px-3 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold inline-flex items-center justify-center transition-colors cursor-pointer"
        >
          Search
        </button>
      </form>

      {/* Customer Profile Card (Authoritative Panel 5) with 3D Tilt */}
      <ScrollReveal direction="up">
        <TiltCard maxTilt={6} className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left Column: Avatar & Customer Demographics (8 Cols) */}
            <div className="lg:col-span-8 flex flex-col justify-between space-y-6">
              {/* Header Identity Row */}
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center text-xl font-black shadow-md shadow-violet-500/20 shrink-0">
                  {customer.name.slice(0, 1)}
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Customer ID
                    </span>
                    <span className="text-sm font-black text-slate-900 font-mono">
                      {customer.customer_id}
                    </span>
                    {customer.verified && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                        Verified
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                    {customer.name}
                  </h2>
                </div>
              </div>

              {/* Demographics & Spending Grid (Exact from Panel 5) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-4 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block text-[11px]">Age Group</span>
                  <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                    {customer.age_group}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[11px]">Registered Since</span>
                  <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                    {customer.registered_since}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[11px]">Total Transactions</span>
                  <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                    <AnimatedCounter value={customer.total_transactions} />
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[11px]">Flagged Transactions</span>
                  <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                    0
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 font-semibold block text-[11px]">Total Spent</span>
                  <span className="text-sm font-black text-slate-900 mt-0.5 block">
                    <AnimatedCounter value={customer.total_spent} prefix="₹" />
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Safety Score Circular Ring (Authoritative Panel 5) with Animated Score Gauge */}
            <div className="lg:col-span-4 p-6 rounded-2xl bg-slate-50/70 border border-slate-100 flex flex-col items-center justify-center text-center h-full">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Safety Score
              </span>

              {/* Animated Circular Gauge */}
              <div className="my-2 flex items-center justify-center">
                <SafetyScoreGauge score={customer.safety_score} size={140} />
              </div>

              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mt-1">
                {customer.safety_level}
              </span>

              <p className="text-xs font-medium text-slate-600 mt-2 max-w-xs leading-relaxed">
                {customer.safety_summary}
              </p>
            </div>
          </div>
        </TiltCard>
      </ScrollReveal>

      {/* Recent Transactions Section (Authoritative Panel 5) */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              Recent Transactions
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              History for customer {customer.customer_id}
            </p>
          </div>
          <button
            onClick={() => onNavigate('monitoring')}
            className="text-xs font-bold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 transition-colors"
          >
            View All
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Recent Transactions Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4 min-w-[120px]">Date</th>
                <th className="py-3.5 px-4 min-w-[150px]">Transaction ID</th>
                <th className="py-3.5 px-4 min-w-[110px]">Amount</th>
                <th className="py-3.5 px-4 min-w-[110px]">Status</th>
                <th className="py-3.5 px-4 min-w-[100px]">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {recentTxns.map((tx) => (
                <tr
                  key={tx.transaction_id}
                  onClick={() => onSelectTransaction(tx)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                >
                  <td className="py-3.5 px-4 text-slate-600">
                    {new Date(tx.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {tx.transaction_id}
                  </td>
                  <td className="py-3.5 px-4 font-black text-slate-900">
                    ₹{tx.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      {tx.status === 'CLEAR' ? 'Approved' : tx.status.charAt(0) + tx.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        tx.risk_level === 'HIGH'
                          ? 'bg-rose-100 text-rose-700'
                          : tx.risk_level === 'MEDIUM'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {tx.risk_level}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
