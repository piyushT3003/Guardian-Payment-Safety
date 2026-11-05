import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldAlert,
  User,
  Clock,
  MapPin,
  Smartphone,
  CreditCard,
  Bot,
  AlertTriangle,
  ArrowRight,
  Globe,
  Radio,
  FileCheck,
  RotateCcw,
  PauseCircle,
  ShieldCheck,
} from 'lucide-react';
import { Transaction, GeoRouteData } from '../types';
import { fetchTransactionDetail, executeEmergencyRecovery, denyEmergencyRecovery } from '../api';
import { SatelliteRouteMap } from './SatelliteRouteMap';
import { motion, AnimatePresence } from 'framer-motion';

interface TransactionDetailsModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (tx: Transaction) => void;
  onReject: (tx: Transaction) => void;
  onViewCustomer?: (customerId: string) => void;
}

export const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
  transaction,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onViewCustomer,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'satellite' | 'audit'>('overview');
  const [enrichedData, setEnrichedData] = useState<any>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  useEffect(() => {
    if (isOpen && transaction) {
      setIsLoadingDetail(true);
      fetchTransactionDetail(transaction.transaction_id)
        .then((data) => {
          setEnrichedData(data);
          setIsLoadingDetail(false);
        })
        .catch((err) => {
          console.error(err);
          setIsLoadingDetail(false);
        });
    } else {
      setEnrichedData(null);
      setActiveTab('overview');
    }
  }, [isOpen, transaction]);

  if (!isOpen || !transaction) return null;

  const isHighRisk = transaction.risk_level === 'HIGH';
  const isMedRisk = transaction.risk_level === 'MEDIUM';

  const riskBadgeClass = isHighRisk
    ? 'bg-rose-50 text-rose-600 border-rose-200'
    : isMedRisk
    ? 'bg-amber-50 text-amber-600 border-amber-200'
    : 'bg-emerald-50 text-emerald-600 border-emerald-200';

  // Fallback route coordinates if enrichedData hasn't loaded yet
  const defaultRoute: GeoRouteData = enrichedData?.geo_route || {
    origin: {
      lat: 19.0760,
      lon: 72.8777,
      city: transaction.location || 'Mumbai',
      country: 'India',
      ip: '103.21.244.78',
      isp: 'Airtel Broadband / Jio 5G',
      device: transaction.device || 'Mobile Device',
      label: `Sender Origin: ${transaction.location || 'Mumbai'}, India`,
    },
    destination: {
      lat: isHighRisk ? 25.2048 : 19.0760,
      lon: isHighRisk ? 55.2708 : 72.8777,
      city: isHighRisk ? 'Dubai' : transaction.location || 'Mumbai',
      country: isHighRisk ? 'UAE' : 'India',
      entity: isHighRisk ? 'Al-Wasl Virtual Asset Gateway' : `${transaction.payee} Local Terminal`,
      label: `Beneficiary Endpoint: ${transaction.payee}`,
    },
    distance_km: isHighRisk ? 1935.1 : 4.2,
    geofence_status: isHighRisk ? 'CRITICAL' : 'NORMAL',
    geofence_details: isHighRisk
      ? 'Cross-border capital flight / Offshore mule wallet'
      : 'Domestic transaction within standard locality radius',
    latency_ms: isHighRisk ? 54 : 14,
  };

  const auditHistory = enrichedData?.audit_history || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto"
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
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden z-10 flex flex-col max-h-[92vh] my-auto"
      >
        {/* Header */}
        <div className="shrink-0 p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm ${
                isHighRisk
                  ? 'bg-rose-100 text-rose-600'
                  : 'bg-brand-100 text-brand-600'
              }`}
            >
              <ShieldAlert className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 tracking-tight font-mono">
                  {transaction.transaction_id}
                </h2>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${riskBadgeClass}`}
                >
                  {transaction.risk_level} RISK (
                  {Math.round(transaction.risk_score * 100)}/100)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                AI Fraud Engine Telemetry, Geofence Radar & Review History
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="shrink-0 flex items-center gap-2 px-6 pt-3 border-b border-slate-100 bg-white text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Overview & AI Analysis</span>
          </button>
          <button
            onClick={() => setActiveTab('satellite')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'satellite'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Satellite Location & Radar</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                defaultRoute.geofence_status === 'CRITICAL'
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {defaultRoute.distance_km} km
            </span>
          </button>
          {auditHistory.length > 0 && (
            <button
              onClick={() => setActiveTab('audit')}
              className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'audit'
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Audit History ({auditHistory.length})</span>
            </button>
          )}
        </div>

        {/* Content Body */}
        <div
          className="p-6 flex-1 min-h-0 overflow-y-auto space-y-6 overscroll-contain"
          data-lenis-prevent="true"
        >
          {/* Key Metric Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Amount
              </span>
              <span className="text-lg font-black text-slate-900 mt-0.5 block">
                ₹{transaction.amount.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Payment Channel
              </span>
              <span className="text-sm font-bold text-slate-800 mt-1 block flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                {transaction.payment_method || 'UPI'}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Review Status
              </span>
              <span
                className={`text-xs font-bold mt-1 inline-block px-2.5 py-0.5 rounded-full ${
                  transaction.status === 'APPROVED'
                    ? 'bg-emerald-100 text-emerald-700'
                    : transaction.status === 'REJECTED'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {transaction.status.replace('_', ' ')}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Customer ID
              </span>
              <button
                onClick={() => {
                  if (onViewCustomer) onViewCustomer(transaction.user_id);
                  onClose();
                }}
                className="text-xs font-bold text-brand-600 hover:text-brand-700 mt-1 flex items-center gap-1 group"
              >
                {transaction.user_id}
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5 animate-in fade-in-50 duration-200">
              {/* Emergency Family Guardian Hold Banner */}
              {transaction.status === 'ON_HOLD_BY_GUARDIAN' && (
                <div className="p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-500 text-amber-950 flex items-start gap-3 animate-pulse shadow-sm">
                  <PauseCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="text-sm font-black text-amber-900 flex items-center gap-2">
                      <span>PAUSED BY FAMILY GUARDIAN: {transaction.guardian_name || 'Aditya Kulkarni'} ({transaction.guardian_relation || 'Son'})</span>
                      <span className="text-[10px] uppercase font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">Hold Active</span>
                    </div>
                    <p className="text-xs text-amber-900 font-medium leading-relaxed">
                      {transaction.guardian_notes || 'Designated family guardian triggered emergency hold following suspected scam detection. Payment frozen pending bank security decision.'}
                    </p>
                    <div className="text-[11px] font-bold text-amber-800 pt-1">
                      Company SOC Action: Review telemetry and click "Reject & Block Payment" below to save elderly customer funds.
                    </div>
                  </div>
                </div>
              )}

              {/* Senior Citizen & Family Safety Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-brand-700 font-bold text-xs uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Senior Citizen & Family Protection Profile</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">Account ID: {transaction.user_id}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/70">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Senior Account Holder</span>
                    <span className="text-sm font-black text-slate-900 mt-0.5 block">
                      {transaction.elderly_name || transaction.customer_name || 'Ramesh Kulkarni'} ({transaction.elderly_age || 68} yrs)
                    </span>
                    <span className="text-[11px] text-slate-500">Home locality: {transaction.location || 'Mumbai'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/70">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Designated Family Guardian</span>
                    <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                      {transaction.guardian_name || 'Aditya Kulkarni'} ({transaction.guardian_relation || 'Son'})
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">{transaction.guardian_phone || '+91 98201 99112'}</span>
                  </div>
                </div>
                {transaction.scam_category && (
                  <div className="text-xs pt-1 text-slate-700">
                    <span className="font-bold text-slate-900">Pattern Classification: </span>
                    <span className="text-rose-600 font-bold">{transaction.scam_category}</span>
                  </div>
                )}
              </div>

              {/* Context Details */}
              <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Transaction Context & Beneficiary
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      Recipient:{' '}
                      <strong className="text-slate-800">{transaction.payee}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      Timestamp:{' '}
                      <strong className="text-slate-800">
                        {new Date(transaction.created_at).toLocaleString()}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      Location:{' '}
                      <strong className="text-slate-800">
                        {transaction.location || 'Mumbai, IN'}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      Device Fingerprint:{' '}
                      <strong className="text-slate-800">
                        {transaction.device || 'Samsung Galaxy A52'}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Satellite Routing Preview Mini Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white shadow-md flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <span>Live Satellite Geolocation Radar</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 font-mono">
                        {defaultRoute.distance_km} km
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Origin: <strong>{defaultRoute.origin.city}</strong> → Destination:{' '}
                      <strong>{defaultRoute.destination.city}</strong>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('satellite')}
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  View Satellite Map
                </button>
              </div>

              {/* Detection Explanations */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Triggered Risk Reasons
                </h3>
                <div className="space-y-1.5">
                  {(transaction.reasons && transaction.reasons.length > 0
                    ? transaction.reasons
                    : [transaction.reason]
                  ).map((r, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50/70 border border-rose-100 text-xs text-rose-900 font-medium"
                    >
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Review Assistant */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-50/70 to-indigo-50/70 border border-brand-100">
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="w-4 h-4 text-brand-600" />
                  <h4 className="text-xs font-bold text-brand-900 uppercase tracking-wider">
                    Guardian AI Review Assistant
                  </h4>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {isHighRisk
                    ? "Payment deviates sharply from the customer's historical 30-day baseline. Rapid burst contact pattern combined with unfamiliar payee signature matches common impersonation/digital-arrest drain schemes."
                    : 'Transaction telemetry falls within acceptable boundaries. Beneficiary is recognised or transfer amount conforms to typical frequency.'}
                </p>
                <div className="mt-3 pt-3 border-t border-brand-200/60 flex items-center justify-between text-xs">
                  <span className="text-slate-600">
                    Recommendation:{' '}
                    <strong className="text-slate-900">
                      {isHighRisk
                        ? 'Reject or verify via phone callback'
                        : 'Approve under normal telemetry'}
                    </strong>
                  </span>
                  <span className="font-bold text-brand-700">Confidence: 99.2%</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE SATELLITE RADAR */}
          {activeTab === 'satellite' && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Live Satellite Transfer Path
                </h3>
                <p className="text-xs text-slate-500">
                  High-resolution orbital satellite observation verifying originating user device and recipient endpoint coordinates.
                </p>
              </div>

              {/* Leaflet Satellite Component */}
              <SatelliteRouteMap
                origin={defaultRoute.origin}
                destination={defaultRoute.destination}
                distanceKm={defaultRoute.distance_km}
                geofenceStatus={defaultRoute.geofence_status}
                geofenceDetails={defaultRoute.geofence_details}
                latencyMs={defaultRoute.latency_ms}
                height="320px"
              />

              {/* Telemetry Breakdown Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Origin Card */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-600 font-bold">
                    <MapPin className="w-4 h-4" />
                    <span>Transaction Done From (Origin)</span>
                  </div>
                  <div className="text-sm font-black text-slate-900">
                    {defaultRoute.origin.city}, {defaultRoute.origin.country}
                  </div>
                  <div className="text-[11px] text-slate-600 space-y-1 font-mono">
                    <div>GPS: {defaultRoute.origin.lat.toFixed(4)}° N, {defaultRoute.origin.lon.toFixed(4)}° E</div>
                    <div>IP: {defaultRoute.origin.ip || '103.21.244.78'} ({defaultRoute.origin.isp || 'Airtel Broadband'})</div>
                    <div>Device: {defaultRoute.origin.device || transaction.device || 'Android'}</div>
                  </div>
                </div>

                {/* Destination Card */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center gap-2 text-rose-600 font-bold">
                    <Radio className="w-4 h-4" />
                    <span>Transaction Reached (Destination)</span>
                  </div>
                  <div className="text-sm font-black text-slate-900">
                    {defaultRoute.destination.entity || defaultRoute.destination.city}
                  </div>
                  <div className="text-[11px] text-slate-600 space-y-1 font-mono">
                    <div>Location: {defaultRoute.destination.city}, {defaultRoute.destination.country}</div>
                    <div>GPS: {defaultRoute.destination.lat.toFixed(4)}° N, {defaultRoute.destination.lon.toFixed(4)}° E</div>
                    <div className="font-bold text-rose-600">
                      Geofence: {defaultRoute.geofence_status} ({defaultRoute.distance_km.toLocaleString()} km away)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AUDIT HISTORY */}
          {activeTab === 'audit' && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Action Log & Audit Trail Records
              </h3>
              {auditHistory.length === 0 ? (
                <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                  No previous review decisions recorded for this transaction.
                </div>
              ) : (
                <div className="space-y-3">
                  {auditHistory.map((act: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-bold ${
                              act.action === 'APPROVE'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {act.action}D
                          </span>
                          <span className="font-bold text-slate-800">
                            By {act.actor}
                          </span>
                        </div>
                        <span className="text-slate-400 font-mono text-[11px]">
                          {new Date(act.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-700 font-medium">{act.notes}</p>
                      {act.action_hash && (
                        <div className="pt-2 border-t border-slate-200/60 font-mono text-[10px] text-slate-400 truncate">
                          SHA-256: {act.action_hash}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Review Actions */}
        <div className="shrink-0 p-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Recorded in immutable SHA-256 compliance ledger
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            {transaction.status === 'RECOVERY_REQUESTED' && (
              <>
                <motion.button
                  whileHover={{ scale: 1.02, translateY: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={async () => {
                    await executeEmergencyRecovery(transaction.transaction_id, 'Piyush Tandale (Admin)');
                    onClose();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-emerald-500/25 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>⚡ Execute Emergency Fund Recovery (Clawback Funds)</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={async () => {
                    await denyEmergencyRecovery(transaction.transaction_id, 'Piyush Tandale (Admin)', 'Declined upon secondary compliance review.');
                    onClose();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-200 text-xs font-bold border border-rose-800 transition-all cursor-pointer"
                >
                  <span>Decline Recovery</span>
                </motion.button>
              </>
            )}
            {transaction.status === 'WINDOW_EXPIRED' && (
              <span className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300 flex items-center gap-1.5">
                <span>⏱️ 5-Minute Recovery Window Expired (Closed)</span>
              </span>
            )}
            {transaction.status === 'RECOVERED' && (
              <span className="px-3 py-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-black flex items-center gap-1.5">
                <span>✅ Funds Clawed Back & Restored to Account</span>
              </span>
            )}
            {['PENDING_REVIEW', 'PENDING_FAMILY_APPROVAL', 'PENDING_PAYMENT_EXECUTION', 'ON_HOLD_BY_GUARDIAN', 'HIGH_RISK', 'MEDIUM_RISK', 'RECEIVED'].includes(transaction.status) && (
              <>
                <motion.button
                  whileHover={{ scale: 1.02, translateY: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onReject(transaction)}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>🚫 Reject & Block Payment (Protect Funds)</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02, translateY: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onApprove(transaction)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>✓ Approve Payment</span>
                </motion.button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
