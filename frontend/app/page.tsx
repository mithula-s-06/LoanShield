'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  ShieldAlert,
  Cpu,
  Layers,
  BarChart3,
  CheckCircle2,
  Lock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  UserCheck,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

export default function LaunchingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-indigo-600/15 via-emerald-500/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-2/3 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl px-6 md:px-12 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-950/50">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-white tracking-tight">LoanShield</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">PRO</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Risk Intelligence Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition-all shadow-sm"
            >
              Sign In
            </Link>

            <Link
              href="/login"
              className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02] flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24 space-y-20 z-10">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-semibold shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Next-Generation Banking Decision Support Tool</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.15]">
            Intelligent Loan Default <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
              Risk Assessment Platform
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Empower bank underwriters with multi-model predictive default scoring, explainable AI (SHAP),
            and transparent portfolio risk analytics.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white text-sm font-bold rounded-2xl shadow-xl shadow-indigo-600/40 transition-all hover:scale-[1.03] flex items-center justify-center gap-2.5"
            >
              <span>Get Started – Bank Analyst Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/login"
              className="w-full sm:w-auto px-6 py-4 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-sm font-semibold rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4 text-slate-400" />
              <span>Login with Default Credentials</span>
            </Link>
          </div>

          {/* Quick Credential Hint */}
          <div className="pt-2 text-xs text-slate-400 flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Single Role: <strong>Bank Analyst</strong></span>
            <span>&bull;</span>
            <span className="font-mono text-slate-300">analyst@loanshield.bank / LoanShield2026</span>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-3 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Champion ML Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              L2-regularized Logistic Regression champion model achieving 0.796 ROC-AUC and 72.5% default recall, bench-tested against Random Forest and XGBoost.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-3 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Explainable AI (SHAP)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Decompose individual default predictions into positive risk escalators and risk-reducing mitigating factors with mathematical feature weights.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-3 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Portfolio Risk Intelligence</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time underwriting dashboard, applicant search and filtration across configurable Low, Medium, and High risk classification thresholds.
            </p>
          </div>
        </div>

        {/* Live System Preview Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                Production Champion Engine
              </span>
              <h3 className="text-lg font-bold text-white mt-1">Logistic Regression Underwriting Diagnostics</h3>
            </div>
            <Link
              href="/login"
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              Open Live Workbench
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Algorithm</span>
              <div className="text-xl font-bold text-white font-mono mt-1">Logistic Regression</div>
              <span className="text-xs text-indigo-400 font-semibold">Champion Model</span>
            </div>

            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Holdout ROC-AUC</span>
              <div className="text-xl font-bold text-white font-mono mt-1">0.796</div>
              <span className="text-xs text-emerald-400 font-semibold">Highest Discrimination</span>
            </div>

            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Default Recall</span>
              <div className="text-xl font-bold text-white font-mono mt-1">72.5%</div>
              <span className="text-xs text-emerald-400 font-semibold">Catches Risky Loans</span>
            </div>

            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Explainability</span>
              <div className="text-xl font-bold text-white font-mono mt-1">SHAP / Odds-Ratio</div>
              <span className="text-xs text-indigo-400 font-semibold">Full Regulatory Transparency</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 px-6 md:px-12 py-8 mt-12 z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>LoanShield &copy; 2026. Confidential Bank Underwriting & Risk Operations System.</span>
          </div>
          <div>
            <span>Single-Role Application &bull; Bank Analyst Access Only</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
