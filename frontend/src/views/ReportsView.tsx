import React, { useState, useEffect } from 'react';
import {
  FileText,
  Users,
  Shield,
  ClipboardCheck,
  Download,
  Calendar,
  ChevronDown,
  ArrowRight,
  RotateCcw,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';
import { Header } from '../components/Header';
import { PageView, ReportCard, ReportRecord } from '../types';
import { fetchReportCards, generateReport, fetchReportHistory } from '../api';
import { TiltCard } from '../components/animations/TiltCard';
import { ScrollReveal } from '../components/animations/ScrollReveal';
import { MagneticButton } from '../components/animations/MagneticButton';

interface ReportsViewProps {
  onNavigate: (view: PageView) => void;
  onOpenNotifications: () => void;
  unreadCount?: number;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  onNavigate,
  onOpenNotifications,
  unreadCount = 0,
}) => {
  const [reportType, setReportType] = useState('Fraud Analysis');
  const [format, setFormat] = useState('PDF');
  const [dateRange, setDateRange] = useState('Oct 1, 2026 - Oct 30, 2026');
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const [reportCards, setReportCards] = useState<ReportCard[]>([
    {
      id: 'fraud-summary',
      title: 'Fraud Summary',
      description: 'Overall fraud stats and trends',
      type: 'Fraud Analysis',
      icon: 'shield',
    },
    {
      id: 'customer-risk',
      title: 'Customer Risk',
      description: 'High-risk customers and patterns',
      type: 'Customer Risk',
      icon: 'users',
    },
    {
      id: 'transaction-report',
      title: 'Transaction Report',
      description: 'Detailed transaction analysis',
      type: 'Transaction Report',
      icon: 'file-text',
    },
    {
      id: 'action-log',
      title: 'Action Log',
      description: 'Approve / Reject history',
      type: 'Action Log',
      icon: 'clipboard-check',
    },
  ]);

  const [history, setHistory] = useState<ReportRecord[]>([]);

  useEffect(() => {
    fetchReportCards().then(setReportCards).catch(console.error);
    fetchReportHistory().then(setHistory).catch(console.error);
  }, []);

  const handleGenerate = async (selectedType = reportType, selectedFormat = format) => {
    setIsGenerating(true);
    setDownloadSuccess(null);

    try {
      const res = await generateReport({
        report_type: selectedType,
        format: selectedFormat,
        date_range: dateRange,
      });

      setDownloadSuccess(res.message);
      // Automatically trigger browser download
      window.open(res.download_url, '_blank');

      // Refresh history
      fetchReportHistory().then(setHistory);
      setIsGenerating(false);
    } catch (err: any) {
      console.error(err);
      setIsGenerating(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'Customer Risk':
        return <Users className="w-6 h-6 stroke-[2.2]" />;
      case 'Transaction Report':
        return <FileSpreadsheet className="w-6 h-6 stroke-[2.2]" />;
      case 'Action Log':
        return <ClipboardCheck className="w-6 h-6 stroke-[2.2]" />;
      default:
        return <Shield className="w-6 h-6 stroke-[2.2]" />;
    }
  };

  const getCardColor = (idx: number) => {
    switch (idx) {
      case 0:
        return 'bg-purple-50 text-purple-600 border-purple-100 hover:border-purple-300';
      case 1:
        return 'bg-blue-50 text-blue-600 border-blue-100 hover:border-blue-300';
      case 2:
        return 'bg-cyan-50 text-cyan-600 border-cyan-100 hover:border-cyan-300';
      case 3:
      default:
        return 'bg-amber-50 text-amber-600 border-amber-100 hover:border-amber-300';
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <Header
        title="Reports"
        subtitle="Generate and download fraud analysis reports"
        showPeriodFilter={false}
        unreadCount={unreadCount}
        onOpenNotifications={onOpenNotifications}
      />

      {/* 4 Report Type Cards (Authoritative Panel 7) with 3D Tilt */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {reportCards.map((c, i) => (
          <ScrollReveal key={c.id} staggerIndex={i} direction="up" className="h-full">
            <TiltCard
              maxTilt={8}
              onClick={() => {
                if (c.id === 'action-log') {
                  onNavigate('audit');
                } else {
                  setReportType(c.type);
                  handleGenerate(c.type, format);
                }
              }}
              className={`p-6 rounded-3xl border bg-white shadow-sm hover:shadow-md transition-all cursor-pointer group h-full flex flex-col justify-between ${getCardColor(i)}`}
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  {getIcon(c.type)}
                </div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  {c.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {c.description}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-violet-600">
                <span>{c.id === 'action-log' ? 'Open Audit Trail Ledger' : 'Quick Export'}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </TiltCard>
          </ScrollReveal>
        ))}
      </div>

      {/* Generate Custom Report Form (Authoritative Panel 7) with 3D Tilt */}
      <ScrollReveal direction="up">
        <TiltCard maxTilt={4} glare={false} className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm mb-8 space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Generate Custom Report
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure filters and export audit-ready evidence
            </p>
          </div>

          {downloadSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in zoom-in-95">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{downloadSuccess} File download triggered.</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold text-slate-700 items-end">
            {/* Date Range */}
            <div>
              <label className="block mb-1.5 text-slate-600">Date Range</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full h-10 pl-10 pr-3 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 bg-slate-50/50"
                />
              </div>
            </div>

            {/* Report Type Dropdown */}
            <div>
              <label className="block mb-1.5 text-slate-600">Report Type</label>
              <div className="relative">
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full h-10 appearance-none px-3.5 pr-8 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 cursor-pointer shadow-sm"
                >
                  <option value="Fraud Analysis">Fraud Analysis</option>
                  <option value="Customer Risk">Customer Risk</option>
                  <option value="Transaction Report">Transaction Report</option>
                  <option value="Action Log">Action Log</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Format Dropdown */}
            <div>
              <label className="block mb-1.5 text-slate-600">Format</label>
              <div className="relative">
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full h-10 appearance-none px-3.5 pr-8 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 cursor-pointer shadow-sm"
                >
                  <option value="PDF">PDF</option>
                  <option value="CSV">CSV</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Generate Button with Magnetic Hover */}
          <div className="flex justify-end pt-2">
            <MagneticButton
              onClick={() => handleGenerate()}
              disabled={isGenerating}
              className="h-11 px-6 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-violet-500/20 inline-flex items-center justify-center gap-2 transition-all hover:shadow-lg active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  Generating Document...
                </>
              ) : (
                <>
                  Generate Report
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </MagneticButton>
          </div>
        </TiltCard>
      </ScrollReveal>

      {/* Report History with Staggered Entrance */}
      {history.length > 0 && (
        <ScrollReveal direction="up">
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm">
            <h2 className="text-base font-black text-slate-900 tracking-tight mb-4">
              Recent Generated Reports
            </h2>
            <div className="divide-y divide-slate-100">
              {history.map((rep) => (
                <div key={rep.id} className="py-3 flex items-center justify-between text-xs hover:bg-slate-50/60 px-2 rounded-xl transition-colors">
                  <div>
                    <div className="font-bold text-slate-900">{rep.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {rep.record_count} records • Created {new Date(rep.created_at).toLocaleString()}
                    </div>
                  </div>
                  <a
                    href={`/api/reports/download/${rep.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download {rep.format}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      )}
    </div>
  );
};
