'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { TopBar } from '@/components/TopBar';
import { StatCard } from '@/components/StatCard';
import { RiskDistributionChart } from '@/components/RiskDistributionChart';
import { ApplicantTable } from '@/components/ApplicantTable';
import { LoadingSkeleton, ErrorState } from '@/components/LoadingSkeleton';
import { api } from '@/lib/api';
import { DashboardStats } from '@/lib/types';
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  TrendingDown,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Cpu,
  BarChart3,
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch underwriting metrics from FastAPI backend.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <TopBar
        title="Underwriting Risk Intelligence"
        subtitle="Portfolio Default Risk Overview & Multi-Model Analytics"
      />

      <main className="p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Banner with Decision Support Notice */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-lg border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                Decision Support Tool
              </span>
              <span className="text-xs text-slate-400">Lending Club Supervised Benchmark</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              Intelligent Loan Default Risk Assessment
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Provides multi-model probability scoring and SHAP explainability. All risk bands are
              advisory aids for bank analysts—not autonomous approval or rejection decisions.
            </p>
          </div>

          <Link
            href="/predict"
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md transition-all hover:scale-[1.02] shrink-0"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Assess New Applicant</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={fetchDashboardData} />
        ) : isLoading || !stats ? (
          <LoadingSkeleton rows={6} />
        ) : (
          <>
            {/* KPI Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <StatCard
                title="Total Applications"
                value={stats.total_applications.toString()}
                subtitle="Underwriting records logged"
                icon={FileText}
                colorScheme="indigo"
              />

              <StatCard
                title="High-Risk Exposure"
                value={stats.high_risk_count.toString()}
                subtitle={`${((stats.high_risk_count / Math.max(1, stats.total_applications)) * 100).toFixed(0)}% of assessed volume`}
                icon={AlertTriangle}
                colorScheme="rose"
              />

              <StatCard
                title="Medium-Risk Review"
                value={stats.medium_risk_count.toString()}
                subtitle="Requires senior analyst review"
                icon={HelpCircle}
                colorScheme="amber"
              />

              <StatCard
                title="Low-Risk Qualified"
                value={stats.low_risk_count.toString()}
                subtitle="Standard clearance eligible"
                icon={CheckCircle2}
                colorScheme="emerald"
              />
            </div>

            {/* Middle Row: Risk Distribution & Model Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Risk Distribution Chart */}
              <div className="lg:col-span-1">
                <RiskDistributionChart distribution={stats.risk_distribution} />
              </div>

              {/* Portfolio Health & Key Metrics Card */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Portfolio Credit Health Indicators</h3>
                      <p className="text-xs text-slate-500">Aggregated borrower averages across all applicants</p>
                    </div>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                      Portfolio Default Rate: {(stats.overall_default_rate * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                    <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/60">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Average Loan Size
                      </span>
                      <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                        ${Math.round(stats.average_loan_amount).toLocaleString()}
                      </div>
                      <span className="text-xs text-slate-400 font-medium">Standard portfolio ticket size</span>
                    </div>

                    <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/60">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Average FICO Score
                      </span>
                      <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                        {Math.round(stats.average_fico)}
                      </div>
                      <span className="text-xs text-slate-400 font-medium">Prime / Near-Prime threshold</span>
                    </div>
                  </div>
                </div>

                {/* Underwriting Model Consensus Summary */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                    <Cpu className="w-4 h-4 text-indigo-600" />
                    Champion Logistic Regression Engine (AUC 0.796 | 72.5% Default Recall) active across all applications
                  </span>
                  <Link
                    href="/predict"
                    className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group"
                  >
                    Run Risk Assessment
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Bottom Row: Recent High-Risk Applicants Alert List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    High-Risk Applications Requiring Further Review
                  </h3>
                  <p className="text-xs text-slate-500">
                    Highest predicted default probability cases needing credit committee inspection
                  </p>
                </div>
                <Link
                  href="/applications?risk_level=HIGH"
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  View All High-Risk Files ({stats.high_risk_count})
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <ApplicantTable applicants={stats.recent_high_risk} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
