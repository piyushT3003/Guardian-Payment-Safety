import React, { useState } from 'react';
import { Bell, ChevronDown, Shield, Users, UserCheck, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { AlertNotification, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  title: string;
  subtitle: string;
  period?: string;
  onPeriodChange?: (period: string) => void;
  showPeriodFilter?: boolean;
  unreadCount?: number;
  notifications?: AlertNotification[];
  onOpenNotifications?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  period = 'Last 30 Days',
  onPeriodChange,
  showPeriodFilter = true,
  unreadCount = 0,
  onOpenNotifications,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const { currentUser, activeRole, switchRole, demoUsers, policyVersion } = useAuth();

  const periods = ['Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'Custom Range'];

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMINISTRATOR':
        return {
          icon: <Shield className="w-3.5 h-3.5 text-violet-600" />,
          label: 'Admin',
          color: 'bg-violet-50 text-violet-700 border-violet-200',
        };
      case 'SECURITY_ANALYST':
        return {
          icon: <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />,
          label: 'Bank SOC',
          color: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'FAMILY_MEMBER':
        return {
          icon: <Users className="w-3.5 h-3.5 text-emerald-600" />,
          label: 'Family Guardian',
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'CUSTOMER':
        return {
          icon: <UserCheck className="w-3.5 h-3.5 text-blue-600" />,
          label: 'Customer',
          color: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      default:
        return {
          icon: <Shield className="w-3.5 h-3.5 text-slate-600" />,
          label: role,
          color: 'bg-slate-50 text-slate-700 border-slate-200',
        };
    }
  };

  const roleMeta = getRoleBadge(activeRole);
  const initials = currentUser
    ? currentUser.full_name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'PT';

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/60 mb-6">
      {/* Title & Subtitle */}
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-tight">
            {title}
          </h1>
          {/* Policy Version Badge */}
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Policy {policyVersion}
          </span>
        </div>
        <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
          {subtitle}
        </p>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
        {/* Role Switcher Pill */}
        <div className="relative">
          <button
            onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
            className={`h-9 inline-flex items-center gap-2 px-3.5 rounded-xl border text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${roleMeta.color}`}
            title="Switch Simulated Fintech Role & Permissions"
          >
            {roleMeta.icon}
            <span className="font-bold">{roleMeta.label}</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </button>

          {isRoleMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 py-2 z-40 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Switch Active Persona & RBAC
                </p>
              </div>

              {demoUsers.map((u) => {
                const isSelected = currentUser?.id === u.id || activeRole === u.role;
                const badge = getRoleBadge(u.role);
                return (
                  <button
                    key={u.id}
                    onClick={() => {
                      switchRole(u.role, u.id);
                      setIsRoleMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 transition-colors cursor-pointer ${
                      isSelected ? 'bg-violet-50/60' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        {badge.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {u.full_name}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {badge.label}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-violet-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Date Filter Dropdown */}
        {showPeriodFilter && (
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="h-9 inline-flex items-center gap-2 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-sm transition-colors cursor-pointer"
            >
              <span>{period}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-40 bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/50 py-1 z-30 animate-in fade-in-50 zoom-in-95">
                {periods.map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      if (onPeriodChange) onPeriodChange(p);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                      period === p
                        ? 'bg-violet-50 text-violet-600 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notification Bell with 3D Ring Animation */}
        <button
          onClick={onOpenNotifications}
          className="h-9 w-9 flex items-center justify-center relative rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
          title="Notifications & Alerts"
        >
          <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'animate-bell-ring text-violet-600' : ''}`} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* User Avatar with Initials */}
        <div
          className="h-9 w-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-sm ring-2 ring-violet-100 shrink-0"
          title={currentUser ? `${currentUser.full_name} (${activeRole})` : 'Guardian User'}
        >
          {initials}
        </div>
      </div>
    </header>
  );
};
