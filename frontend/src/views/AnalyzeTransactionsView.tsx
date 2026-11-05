import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  X,
  ArrowRight,
  Sliders,
  Check,
  AlertCircle,
  RotateCcw,
  PlusCircle,
  FileCheck,
  MapPin,
  Navigation,
} from 'lucide-react';
import { Header } from '../components/Header';
import { PageView, AnalysisResultData, SystemSettings } from '../types';
import { uploadDataset, submitManualTransaction, fetchSettings, saveSettings } from '../api';
import { ThreeUploadCloud } from '../components/animations/ThreeUploadCloud';
import { ThreeScanningShield } from '../components/animations/ThreeScanningShield';
import { MagneticButton } from '../components/animations/MagneticButton';
import { TiltCard } from '../components/animations/TiltCard';
import { ScrollReveal } from '../components/animations/ScrollReveal';
import { FraudPipeline } from '../components/animations/FraudPipeline';

interface AnalyzeTransactionsViewProps {
  onNavigate: (view: PageView) => void;
  onAnalysisComplete: (result: AnalysisResultData) => void;
  onOpenNotifications: () => void;
  unreadCount?: number;
}

export const AnalyzeTransactionsView: React.FC<AnalyzeTransactionsViewProps> = ({
  onNavigate,
  onAnalysisComplete,
  onOpenNotifications,
  unreadCount = 0,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'manual'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sampleLoaded, setSampleLoaded] = useState(true); // Default shows sample as in screenshot
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState('Extracting payment records...');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Analysis settings (Panel 3 right side)
  const [detectionMode, setDetectionMode] = useState('AI + Rules (Recommended)');
  const [riskThreshold, setRiskThreshold] = useState(0.70);
  const [detectPatterns, setDetectPatterns] = useState(true);
  const [generateRiskScore, setGenerateRiskScore] = useState(true);
  const [addExplanation, setAddExplanation] = useState(true);

  // Manual entry fields
  const [manualTx, setManualTx] = useState({
    transaction_id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
    user_id: 'CUST-7821',
    amount: '25000',
    created_at: new Date().toISOString().slice(0, 16),
    payee: 'Global Crypto Exchange / Unverified',
    payment_method: 'UPI',
    location: 'Dubai, UAE',
    device: 'Unknown Proxy/VPN',
  });
  const [manualSuccess, setManualSuccess] = useState('');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileSelected(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext || '')) {
      setErrorMsg('Please upload a valid CSV or Excel (.xlsx) file.');
      return;
    }
    setErrorMsg('');
    setSelectedFile(file);
    setSampleLoaded(false);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setSampleLoaded(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalyzeNow = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(12);
    setAnalysisStage('Parsing CSV & verifying HMAC signatures...');
    setErrorMsg('');

    const timer = setInterval(() => {
      setAnalysisProgress((p) => {
        if (p < 38) {
          setAnalysisStage('Evaluating 90-day baseline spending geometry...');
          return p + 14;
        } else if (p < 70) {
          setAnalysisStage('Running IsolationForest anomaly detection & burst analysis...');
          return p + 11;
        } else if (p < 92) {
          setAnalysisStage('Generating human-readable deterministic explanations...');
          return p + 6;
        }
        return p;
      });
    }, 280);

    try {
      let result: AnalysisResultData;

      if (selectedFile) {
        // Upload user's chosen file
        result = await uploadDataset(selectedFile);
      } else {
        // Fetch pre-loaded transactions_sample.csv and analyze it
        const res = await fetch('/api/dataset/sample');
        const blob = await res.blob();
        const file = new File([blob], 'transactions_sample.csv', { type: 'text/csv' });
        result = await uploadDataset(file);
      }

      setAnalysisProgress(100);
      setAnalysisStage('Analysis complete! Building report...');
      setTimeout(() => {
        clearInterval(timer);
        onAnalysisComplete(result);
      }, 500);
    } catch (err: any) {
      clearInterval(timer);
      console.error(err);
      setErrorMsg(err.message || 'Analysis failed. Please verify file format.');
      setIsAnalyzing(false);
    }
  };

  // Geolocation state
  const [isLocating, setIsLocating] = useState(false);
  const [geoCoords, setGeoCoords] = useState<{
    lat: number;
    lon: number;
    accuracy: number;
  } | null>(null);
  const [geoStatus, setGeoStatus] = useState<string>('');

  const handleRequestLiveLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('Browser geolocation not supported');
      return;
    }
    setIsLocating(true);
    setGeoStatus('Connecting to GPS satellite positioning...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setGeoCoords({ lat: latitude, lon: longitude, accuracy });
        setGeoStatus(`Live GPS verified (±${Math.round(accuracy)}m precision)`);
        setManualTx((prev) => ({
          ...prev,
          location: `Device GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
        }));
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGeoStatus('Location permission denied — defaulting to standard corridor');
        } else {
          setGeoStatus('GPS signal unavailable — defaulting to standard corridor');
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);
    setManualSuccess('');
    setErrorMsg('');

    try {
      const res = await submitManualTransaction({
        transaction_id: manualTx.transaction_id,
        user_id: manualTx.user_id,
        amount: parseFloat(manualTx.amount),
        created_at: new Date(manualTx.created_at).toISOString(),
        payee: manualTx.payee,
        payment_method: manualTx.payment_method,
        location: manualTx.location,
        device: manualTx.device,
        origin_lat: geoCoords?.lat,
        origin_lon: geoCoords?.lon,
        accuracy_meters: geoCoords?.accuracy,
      });

      setManualSuccess(res.message);
      setIsAnalyzing(false);
      // Reset transaction id for next entry
      setManualTx((prev) => ({
        ...prev,
        transaction_id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
      }));
    } catch (err: any) {
      setErrorMsg(err.message || 'Submission failed');
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <Header
        title="Analyze Transactions"
        subtitle="Upload a dataset or add transactions to detect fraud"
        showPeriodFilter={false}
        unreadCount={unreadCount}
        onOpenNotifications={onOpenNotifications}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Section: Tabs and Upload/Manual Card (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Tabs: Upload Dataset | Manual Entry */}
          <div className="flex items-center gap-8 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('upload')}
              className={`pb-3 text-sm font-bold transition-all relative ${
                activeTab === 'upload'
                  ? 'text-brand-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Upload Dataset
              {activeTab === 'upload' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`pb-3 text-sm font-bold transition-all relative ${
                activeTab === 'manual'
                  ? 'text-brand-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Manual Entry
              {activeTab === 'manual' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 rounded-full" />
              )}
            </button>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {manualSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{manualSuccess}</span>
            </div>
          )}

          {activeTab === 'upload' ? (
            /* Upload Dataset Tab (Authoritative Panel 3) */
            <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-6">
              {/* Drag and Drop Zone with 3D Cloud and Glowing Border */}
              <TiltCard maxTilt={4} scale={1.01}>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all relative overflow-hidden ${
                    isDragging
                      ? 'border-violet-500 bg-violet-50/50 scale-[0.99] animate-border-glow'
                      : 'border-slate-200/90 hover:border-violet-400 hover:bg-slate-50/60'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {/* Interactive 3D Upload Cloud */}
                  <ThreeUploadCloud isScanning={isAnalyzing} className="w-56 h-32 mx-auto mb-1 pointer-events-none" />
                  <div className="text-base font-black text-slate-800">
                    Drag & drop your file here
                  </div>
                  <div className="text-xs text-violet-600 font-bold mt-1">
                    or click to browse
                  </div>
                  <div className="text-[11px] text-slate-400 mt-2 font-medium">
                    Supports CSV, Excel (.xlsx) • Behavioral Risk Engine ready
                  </div>
                </div>
              </TiltCard>

              {/* Uploaded File Card with 3D Entrance */}
              {(selectedFile || sampleLoaded) && (
                <ScrollReveal direction="zoom">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <FileSpreadsheet className="w-5 h-5 stroke-[2.2]" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {selectedFile ? selectedFile.name : 'transactions_sample.csv'}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {selectedFile
                            ? `${(selectedFile.size / 1024 / 1024).toFixed(1)} MB`
                            : '2.4 MB • 10,000 records'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveFile}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </ScrollReveal>
              )}

              {/* Analyze Now Button with Magnetic Hover & Ripple */}
              <MagneticButton
                onClick={handleAnalyzeNow}
                disabled={isAnalyzing}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2 transition-all hover:shadow-xl hover:shadow-violet-500/35 active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    Executing Behavioral Risk Engine...
                  </>
                ) : (
                  <>
                    Analyze Now
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </MagneticButton>
            </div>
          ) : (
            /* Manual Entry Tab */
            <form onSubmit={handleManualSubmit} className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Transaction ID</label>
                  <input
                    type="text"
                    value={manualTx.transaction_id}
                    onChange={(e) => setManualTx({ ...manualTx, transaction_id: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Customer ID</label>
                  <input
                    type="text"
                    value={manualTx.user_id}
                    onChange={(e) => setManualTx({ ...manualTx, user_id: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Transaction Amount (₹)</label>
                  <input
                    type="number"
                    value={manualTx.amount}
                    onChange={(e) => setManualTx({ ...manualTx, amount: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
                  <select
                    value={manualTx.payment_method}
                    onChange={(e) => setManualTx({ ...manualTx, payment_method: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none bg-white"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Wallet">Wallet</option>
                    <option value="Net Banking">Net Banking</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Merchant / Payee Name</label>
                  <input
                    type="text"
                    value={manualTx.payee}
                    onChange={(e) => setManualTx({ ...manualTx, payee: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 block">Location</label>
                    <button
                      type="button"
                      onClick={handleRequestLiveLocation}
                      disabled={isLocating}
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100/70 border border-brand-200/60 px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer active:scale-95"
                      title="Request live device geolocation coordinates"
                    >
                      <Navigation className={`w-3 h-3 ${isLocating ? 'animate-spin text-brand-500' : 'text-brand-600'}`} />
                      <span>{isLocating ? 'Locating...' : 'Use Live GPS'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={manualTx.location}
                    onChange={(e) => setManualTx({ ...manualTx, location: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                    placeholder="e.g. Mumbai or click 'Use Live GPS'"
                  />
                  {geoStatus && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-slate-600 font-medium bg-slate-50 border border-slate-200/60 px-2 py-1 rounded-md">
                      <MapPin className="w-3 h-3 text-brand-600 shrink-0" />
                      <span>{geoStatus}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setManualTx({
                    transaction_id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
                    user_id: 'CUST-7821',
                    amount: '1000',
                    created_at: new Date().toISOString().slice(0, 16),
                    payee: 'Grocery Mart',
                    payment_method: 'UPI',
                    location: 'Mumbai',
                    device: 'Samsung Galaxy A52',
                  })}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Clear Form
                </button>
                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all active:scale-95"
                >
                  {isAnalyzing ? 'Submitting...' : 'Submit Transaction'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right Section: Analysis Settings Panel (Authoritative Panel 3 Right Column) */}
        <ScrollReveal direction="right" className="lg:col-span-4 h-fit">
          <TiltCard maxTilt={4} glare={false} className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Analysis Settings
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Tune detection sensitivity and explanation logic
              </p>
            </div>

            {/* Detection Mode Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Detection Mode
              </label>
              <select
                value={detectionMode}
                onChange={(e) => setDetectionMode(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 shadow-sm cursor-pointer"
              >
                <option value="AI + Rules (Recommended)">AI + Rules (Recommended)</option>
                <option value="Rules Only">Rules Only</option>
                <option value="AI Anomaly Only">AI Anomaly Only</option>
              </select>
            </div>

            {/* Risk Threshold Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700">Risk Threshold</span>
                <span className="text-violet-600 font-mono text-sm">
                  {riskThreshold.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0.30"
                max="0.95"
                step="0.05"
                value={riskThreshold}
                onChange={(e) => setRiskThreshold(parseFloat(e.target.value))}
                className="w-full accent-violet-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                <span>More Sensitive (0.30)</span>
                <span>Balanced (0.70)</span>
                <span>Strict (0.95)</span>
              </div>
            </div>

            {/* Toggles (Exact from Panel 3) */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              {/* Toggle 1: Detect suspicious patterns */}
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-semibold text-slate-700">
                  Detect suspicious patterns
                </span>
                <div
                  onClick={() => setDetectPatterns(!detectPatterns)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    detectPatterns ? 'bg-violet-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      detectPatterns ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </label>

              {/* Toggle 2: Generate risk score */}
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-semibold text-slate-700">
                  Generate risk score
                </span>
                <div
                  onClick={() => setGenerateRiskScore(!generateRiskScore)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    generateRiskScore ? 'bg-violet-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      generateRiskScore ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </label>

              {/* Toggle 3: Add explanation (Reason) */}
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-semibold text-slate-700">
                  Add explanation (Reason)
                </span>
                <div
                  onClick={() => setAddExplanation(!addExplanation)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    addExplanation ? 'bg-violet-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      addExplanation ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </label>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  saveSettings({
                    detection_mode: detectionMode,
                    risk_threshold: riskThreshold,
                    generate_explanations: addExplanation,
                  });
                  alert('Analysis settings saved and applied.');
                }}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Save Parameters
              </button>
            </div>
          </TiltCard>
        </ScrollReveal>
      </div>

      {/* 3D Scanning Shield Modal Overlay with Progress Beam & Rings */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in-50">
          <div className="bg-slate-900 border border-violet-500/40 rounded-3xl p-8 max-w-md w-full shadow-2xl shadow-violet-950/50 flex flex-col items-center text-center space-y-4 animate-in zoom-in-95">
            <ThreeScanningShield isCompleted={false} className="w-64 h-56 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-lg font-black text-white tracking-tight">
                3D Behavioral Risk Scanning
              </h3>
              <p className="text-xs text-slate-400 font-medium h-8 flex items-center justify-center">
                {analysisStage}
              </p>
            </div>

            {/* 7-Stage Connected Fraud Detection Visualisation Pipeline */}
            <FraudPipeline
              activeStage={
                analysisProgress < 15 ? 1 :
                analysisProgress < 30 ? 2 :
                analysisProgress < 45 ? 3 :
                analysisProgress < 60 ? 4 :
                analysisProgress < 75 ? 5 :
                analysisProgress < 90 ? 6 : 7
              }
              isProcessing={true}
              className="w-full my-2 px-2 py-3 bg-slate-950/70 rounded-2xl border border-slate-800"
            />

            {/* Real Processing Progress Indicator with Sweeping Laser Glow */}
            <div className="w-full space-y-2 pt-2">
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700 relative">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 via-indigo-400 to-cyan-400 rounded-full transition-all duration-300 relative shadow-[0_0_12px_rgba(139,92,246,0.8)]"
                  style={{ width: `${analysisProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>Multimodal Risk Engine</span>
                <span className="font-bold text-violet-400">{analysisProgress}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
