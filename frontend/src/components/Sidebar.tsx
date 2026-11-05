import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  LayoutDashboard,
  ScanLine,
  ShieldAlert,
  UserCheck,
  BarChart2,
  FileSpreadsheet,
  Settings,
  LogOut,
  ClipboardCheck,
} from 'lucide-react';
import { PageView } from '../types';

interface SidebarProps {
  currentView: PageView;
  onNavigate: (view: PageView) => void;
  unreadCount?: number;
}

const navItems: { id: PageView; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'dashboard',  label: 'Dashboard',           icon: LayoutDashboard },
  { id: 'analyze',    label: 'Analyze Transactions', icon: ScanLine },
  { id: 'monitoring', label: 'Fraud Monitoring',     icon: ShieldAlert },
  { id: 'audit',      label: 'Audit Trail',          icon: ClipboardCheck },
  { id: 'customer',   label: 'Customer Safety',      icon: UserCheck },
  { id: 'analytics',  label: 'Risk Analytics',       icon: BarChart2 },
  { id: 'reports',    label: 'Reports',              icon: FileSpreadsheet },
  { id: 'settings',   label: 'Settings',             icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, unreadCount = 0 }) => {
  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-64 min-w-[256px] h-screen sticky top-0 flex flex-col justify-between p-4 z-40 select-none"
      style={{
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(226,232,240,0.8)',
        boxShadow: '4px 0 32px rgba(0,0,0,0.04)',
      }}
    >
      {/* Brand */}
      <div>
        <motion.div
          onClick={() => onNavigate('landing')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-3 px-3 py-3 mb-6 cursor-pointer rounded-xl hover:bg-violet-50/60 transition-colors"
        >
          <motion.div
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/30"
            animate={{ rotate: [0, 3, -3, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Shield className="w-5 h-5 fill-white/20 stroke-white stroke-[2.2]" />
          </motion.div>
          <div>
            <div className="font-extrabold text-slate-900 text-lg tracking-tight leading-tight">
              Guardian
            </div>
            <div className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
              AI Payment Safety
            </div>
          </div>
        </motion.div>

        {/* Nav items */}
        <nav className="space-y-0.5">
          {navItems.map((item, i) => {
            const Icon = item.icon;
            const isActive =
              currentView === item.id ||
              (item.id === 'analyze' && currentView === 'results');

            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer group relative overflow-hidden ${
                  isActive
                    ? 'text-white font-bold shadow-md shadow-violet-500/25'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {/* Active background */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600"
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  />
                )}

                {/* Hover background */}
                {!isActive && (
                  <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-slate-50" />
                )}

                <div className="flex items-center gap-3 relative z-10">
                  <Icon
                    className={`w-4 h-4 stroke-[2.2] transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {/* Unread badge */}
                {item.id === 'monitoring' && unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`relative z-10 text-[11px] px-1.5 py-0.5 rounded-full font-bold min-w-[20px] text-center ${
                      isActive ? 'bg-white/25 text-white' : 'bg-rose-100 text-rose-600'
                    }`}
                  >
                    {unreadCount}
                  </motion.span>
                )}
              </motion.button>
            );
          })}
        </nav>
      </div>

      {/* User Profile Footer */}
      <div className="pt-4 border-t border-slate-100/80">
        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50/80 transition-colors group">
          <div className="flex items-center gap-2.5">
            <motion.div
              whileHover={{ scale: 1.08, rotate: 3 }}
              className="w-9 h-9 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-md shadow-violet-500/30 cursor-default"
            >
              PT
            </motion.div>
            <div className="text-left">
              <div className="text-xs font-bold text-slate-800 leading-tight">Piyush Tandale</div>
              <div className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Admin · Online
              </div>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 12 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onNavigate('landing')}
            title="Return to Landing Page"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.aside>
  );
};
