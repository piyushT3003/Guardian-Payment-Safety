import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageView, Transaction, AlertNotification, AnalysisResultData, GuardianPendingAlert } from './types';
import { Sidebar } from './components/Sidebar';
import { NotificationDrawer } from './components/NotificationDrawer';
import { TransactionDetailsModal } from './components/TransactionDetailsModal';
import { ConfirmActionModal } from './components/ConfirmActionModal';
import { LiveSimulationBar } from './components/LiveSimulationBar';
import { FamilyGuardianAlertModal } from './components/FamilyGuardianAlertModal';
import { SmoothScrollProvider } from './components/animations/SmoothScrollProvider';
import { AuthProvider } from './context/AuthContext';

// Views (Panels 1 - 9)
import { LandingPage } from './views/LandingPage';
import { DashboardView } from './views/DashboardView';
import { AnalyzeTransactionsView } from './views/AnalyzeTransactionsView';
import { FraudMonitoringView } from './views/FraudMonitoringView';
import { CustomerSafetyView } from './views/CustomerSafetyView';
import { RiskAnalyticsView } from './views/RiskAnalyticsView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';
import { AnalysisResultView } from './views/AnalysisResultView';
import { AuditTrailView } from './views/AuditTrailView';

import { fetchNotifications, markNotificationsRead, takeTransactionAction } from './api';

export function App() {
  // Navigation State
  const [currentView, setCurrentView] = useState<PageView>('landing');
  const [targetCustomerId, setTargetCustomerId] = useState<string>('CUST-7821');
  const [dataVersion, setDataVersion] = useState(0);

  // Notifications State
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [guardianAlert, setGuardianAlert] = useState<GuardianPendingAlert | null>(null);

  // Transaction Inspection and Action Modals
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    transaction: Transaction | null;
    actionType: 'APPROVE' | 'REJECT';
  }>({
    isOpen: false,
    transaction: null,
    actionType: 'APPROVE',
  });

  // Analysis result state
  const [analysisResult, setAnalysisResult] = useState<AnalysisResultData | null>(null);

  // Sync with browser URL hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as PageView;
      if (
        [
          'landing',
          'dashboard',
          'analyze',
          'monitoring',
          'customer',
          'analytics',
          'reports',
          'settings',
          'results',
          'audit',
        ].includes(hash)
      ) {
        setCurrentView(hash);
      }
    };

    if (window.location.hash) {
      handleHashChange();
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (view: PageView) => {
    setCurrentView(view);
    window.location.hash = view;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Load live notifications
  const loadNotifications = () => {
    fetchNotifications()
      .then((res) => {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unread_count || 0);
      })
      .catch(console.error);
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  // Real-Time Server-Sent Events (SSE) stream listener
  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/stream/events');
      es.addEventListener('transaction.created', () => {
        setDataVersion((v) => v + 1);
        loadNotifications();
      });
      es.addEventListener('fraud.alert', () => {
        setDataVersion((v) => v + 1);
        loadNotifications();
      });
      es.addEventListener('family.action', () => {
        setDataVersion((v) => v + 1);
        loadNotifications();
      });
      es.addEventListener('recovery.executed', () => {
        setDataVersion((v) => v + 1);
        loadNotifications();
      });
      es.addEventListener('recovery.requested', () => {
        setDataVersion((v) => v + 1);
        loadNotifications();
      });
      es.onerror = () => {
        // Automatically reconnects in browser background
      };
    } catch (e) {
      console.warn('SSE initialization notice:', e);
    }

    return () => {
      if (es) es.close();
    };
  }, []);

  const handleMarkAllNotificationsRead = async () => {
    await markNotificationsRead();
    loadNotifications();
  };

  const handleSelectTransaction = (tx: Transaction) => {
    setSelectedTransaction(tx);
  };

  const handleRequestConfirmAction = (tx: Transaction, action: 'APPROVE' | 'REJECT') => {
    setSelectedTransaction(null);
    setConfirmModal({
      isOpen: true,
      transaction: tx,
      actionType: action,
    });
  };

  const handleExecuteAction = async (
    txId: string,
    action: 'APPROVE' | 'REJECT',
    notes: string
  ) => {
    await takeTransactionAction(txId, action, 'Piyush Tandale (Admin)', notes);
    setDataVersion((v) => v + 1);
    loadNotifications();
  };

  const handleViewCustomer = (customerId: string) => {
    setTargetCustomerId(customerId);
    navigateTo('customer');
  };

  const handleAnalysisCompleted = (result: AnalysisResultData) => {
    setAnalysisResult(result);
    navigateTo('results');
  };

  const [triggerScenario, setTriggerScenario] = useState<1 | 2 | null>(null);

  const handleRunDemoScenario = (scenario: 1 | 2) => {
    navigateTo('dashboard');
    setTriggerScenario(scenario);
  };

  return (
    <AuthProvider>
      <SmoothScrollProvider enabled={currentView === 'landing'}>
        <div className="min-h-screen bg-[#f7f9fd] text-[#1e293b] font-sans antialiased flex flex-col">
        {currentView === 'landing' ? (
        /* Panel 1: Full-width Landing Page */
        <LandingPage onNavigate={navigateTo} onRunDemo={handleRunDemoScenario} />
      ) : (
        /* Panels 2 - 9: App Shell with Persistent Sidebar */
        <div className="flex-1 flex flex-row w-full min-h-screen">
          {/* Left Persistent Sidebar */}
          <Sidebar
            currentView={currentView}
            onNavigate={navigateTo}
            unreadCount={unreadCount}
          />

          {/* Right Main Content Area */}
          <main className="flex-1 flex flex-col min-w-0 overflow-y-auto" data-lenis-prevent="true">
            {/* Live Elderly Threat Simulation Header Bar */}
            <LiveSimulationBar
              onDataChanged={() => {
                setDataVersion((v) => v + 1);
                loadNotifications();
              }}
              onOpenGuardianAlert={(alert) => setGuardianAlert(alert)}
              onNavigate={navigateTo}
              externalTriggerScenario={triggerScenario}
              onScenarioHandled={() => setTriggerScenario(null)}
            />

            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -8, filter: 'blur(2px)' }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="flex-1 flex flex-col min-w-0"
              >
                {currentView === 'dashboard' && (
                  <DashboardView
                    key="dashboard"
                    dataVersion={dataVersion}
                    onNavigate={navigateTo}
                    onSelectTransaction={handleSelectTransaction}
                    onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
                    unreadCount={unreadCount}
                    onRunScenario={handleRunDemoScenario}
                  />
                )}

                {currentView === 'analyze' && (
                  <AnalyzeTransactionsView
                    key="analyze"
                    onNavigate={navigateTo}
                    onAnalysisComplete={handleAnalysisCompleted}
                    onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
                    unreadCount={unreadCount}
                  />
                )}

                {currentView === 'monitoring' && (
                  <FraudMonitoringView
                    key="monitoring"
                    dataVersion={dataVersion}
                    onNavigate={navigateTo}
                    onSelectTransaction={handleSelectTransaction}
                    onRequestConfirmAction={handleRequestConfirmAction}
                    onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
                    unreadCount={unreadCount}
                    onRunScenario={handleRunDemoScenario}
                  />
                )}

                {currentView === 'audit' && (
                  <AuditTrailView
                    key="audit"
                    dataVersion={dataVersion}
                    onNavigate={navigateTo}
                    onSelectTransaction={handleSelectTransaction}
                    onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
                    unreadCount={unreadCount}
                  />
                )}

                {currentView === 'customer' && (
                  <CustomerSafetyView
                    key="customer"
                    dataVersion={dataVersion}
                    onNavigate={navigateTo}
                    onSelectTransaction={handleSelectTransaction}
                    onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
                    unreadCount={unreadCount}
                    initialCustomerId={targetCustomerId}
                  />
                )}

                {currentView === 'analytics' && (
                  <RiskAnalyticsView
                    key="analytics"
                    onNavigate={navigateTo}
                    onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
                    unreadCount={unreadCount}
                  />
                )}

                {currentView === 'reports' && (
                  <ReportsView
                    key="reports"
                    onNavigate={navigateTo}
                    onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
                    unreadCount={unreadCount}
                  />
                )}

                {currentView === 'settings' && (
                  <SettingsView
                    key="settings"
                    onNavigate={navigateTo}
                    onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
                    unreadCount={unreadCount}
                  />
                )}

                {currentView === 'results' && (
                  <AnalysisResultView
                    key="results"
                    resultData={analysisResult}
                    onNavigate={navigateTo}
                    onSelectTransaction={handleSelectTransaction}
                    onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
                    unreadCount={unreadCount}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      )}

      {/* Shared Modals and Drawers */}
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        notifications={notifications}
        onMarkAllRead={handleMarkAllNotificationsRead}
        onSelectTransaction={(txId) => {
          navigateTo('monitoring');
        }}
      />

      <TransactionDetailsModal
        transaction={selectedTransaction}
        isOpen={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        onApprove={(tx) => handleRequestConfirmAction(tx, 'APPROVE')}
        onReject={(tx) => handleRequestConfirmAction(tx, 'REJECT')}
        onViewCustomer={handleViewCustomer}
      />

      <ConfirmActionModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        transaction={confirmModal.transaction}
        actionType={confirmModal.actionType}
        onConfirm={handleExecuteAction}
      />

      {/* Simulated Family Guardian Emergency Mobile Push Modal */}
      <FamilyGuardianAlertModal
        alert={guardianAlert}
        isOpen={!!guardianAlert}
        onClose={() => setGuardianAlert(null)}
        onDataRefresh={() => {
          setDataVersion((v) => v + 1);
          loadNotifications();
        }}
        onActionComplete={() => {
          setGuardianAlert(null);
          setDataVersion((v) => v + 1);
          loadNotifications();
        }}
      />
      </div>
      </SmoothScrollProvider>
    </AuthProvider>
  );
}

export default App;
