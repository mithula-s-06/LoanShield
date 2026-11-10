'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  Award,
  LogOut,
  AlertTriangle,
  X,
  Calculator,
} from 'lucide-react';
import clsx from 'clsx';
import { clearStoredAuth } from '@/lib/auth';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);

  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      desc: 'Portfolio overview & analytics',
    },
    {
      name: 'Applications',
      href: '/applications',
      icon: Users,
      desc: 'Applicant registry & filters',
    },
    {
      name: 'Interest Calculator',
      href: '/calculator',
      icon: Calculator,
      desc: 'Purchase categories & APR EMI',
    },
    {
      name: 'New Risk Assessment',
      href: '/predict',
      icon: ShieldAlert,
      desc: 'Evaluate & score loan applicant',
    },
  ];

  const handleConfirmSignOut = () => {
    clearStoredAuth();
    setShowLogoutModal(false);
    router.push('/login');
  };

  return (
    <>
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 border-r border-slate-800 select-none shadow-xl z-30 shrink-0">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-950/50 group-hover:scale-105 transition-transform duration-200">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-white tracking-tight">LoanShield</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">PRO</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Risk Intelligence Platform</p>
            </div>
          </Link>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Risk Operations
          </div>

          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative',
                  isActive
                    ? 'bg-indigo-600/15 text-white font-semibold border border-indigo-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-500 rounded-r" />
                )}
                <div
                  className={clsx(
                    'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-800 text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-700'
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block truncate">{item.name}</span>
                  <span className="block text-[10px] text-slate-400 truncate group-hover:text-slate-400">
                    {item.desc}
                  </span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-indigo-400" />}
              </Link>
            );
          })}
        </div>

        {/* Analyst User Info & Logout Button */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90">
          <div className="flex items-center justify-between gap-2 px-1 py-1">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-600 border border-slate-600 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                BA
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white truncate">Eleanor Vance</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                </div>
                <div className="text-[10px] text-indigo-300 font-semibold uppercase tracking-wider flex items-center gap-1">
                  <Award className="w-3 h-3 text-indigo-400" />
                  Bank Analyst
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowLogoutModal(true)}
              title="Sign Out"
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-transparent hover:border-rose-500/30 flex items-center justify-center transition-all shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Confirmation Logout Modal Dialog */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="text-slate-500 hover:text-slate-300 p-1 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-white">Confirm Sign Out</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Are you sure you want to end your current Bank Analyst underwriting session?
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSignOut}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-600/30 transition-all"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
