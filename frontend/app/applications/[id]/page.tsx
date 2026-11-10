'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { TopBar } from '@/components/TopBar';
import { RiskGauge } from '@/components/RiskGauge';
import { RiskBadge } from '@/components/RiskBadge';
import { RiskFactors } from '@/components/RiskFactors';
import { ModelComparisonCard } from '@/components/ModelComparisonCard';
import { LoadingSkeleton, ErrorState } from '@/components/LoadingSkeleton';
import { api } from '@/lib/api';
import { ApplicationDetail } from '@/lib/types';
import {
  ArrowLeft,
  User,
  DollarSign,
  CreditCard,
  History,
  ShieldCheck,
  AlertTriangle,
  Building,
  Briefcase,
  FileText,
  Clock,
} from 'lucide-react';
import clsx from 'clsx';

export default function ApplicantDetailPage() {
  const params = useParams();
  const applicantId = params.id as string;

  const [applicant, setApplicant] = useState<ApplicationDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplicantDetail = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getApplicationById(applicantId);
      setApplicant(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch applicant file.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (applicantId) {
      fetchApplicantDetail();
    }
  }, [applicantId]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <TopBar
        title={`Underwriting File: ${applicantId}`}
        subtitle="Individual Borrower Risk Profile & Multi-Model Breakdown"
      />

      <main className="p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Navigation back */}
        <div className="flex items-center justify-between">
          <Link
            href="/applications"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200/80 px-3 py-1.5 rounded-xl shadow-2xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Applications Registry
          </Link>

          {applicant && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-medium">Assessed on: {formatDate(applicant.created_at)}</span>
              <RiskBadge level={applicant.risk_level} size="md" />
            </div>
          )}
        </div>

        {error ? (
          <ErrorState message={error} onRetry={fetchApplicantDetail} />
        ) : isLoading || !applicant ? (
          <LoadingSkeleton rows={6} />
        ) : (
          <>
            {/* Top Row: Risk Assessment Summary Card + Borrower High-Level Snapshot */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Risk Gauge Card */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col items-center justify-between">
                <div className="w-full pb-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Model Risk Assessment
                  </span>
                  <RiskBadge level={applicant.risk_level} size="sm" />
                </div>

                <div className="my-4">
                  <RiskGauge
                    probability={applicant.default_probability}
                    riskLevel={applicant.risk_level}
                    size={220}
                  />
                </div>

                {/* Underwriter Advisory Box */}
                <div
                  className={clsx(
                    'w-full p-3.5 rounded-xl border text-xs font-medium leading-relaxed',
                    applicant.risk_level === 'LOW'
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                      : applicant.risk_level === 'MEDIUM'
                      ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                      : 'bg-rose-50/80 border-rose-200 text-rose-900'
                  )}
                >
                  <div className="font-bold flex items-center gap-1.5 mb-1 text-[11px] uppercase tracking-wider">
                    {applicant.risk_level === 'HIGH' ? (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    )}
                    Bank Underwriting Guidance
                  </div>
                  {applicant.recommendation}
                </div>
              </div>

              {/* Borrower & Loan Overview Card */}
              <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <User className="w-4 h-4 text-indigo-600" />
                      {applicant.applicant_name}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">ID: {applicant.applicant_id}</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700 capitalize">
                    {applicant.input_data.loan_purpose?.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Requested Loan
                    </span>
                    <span className="text-lg font-black text-slate-900 font-mono">
                      {formatCurrency(applicant.input_data.loan_amnt)}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Annual Income
                    </span>
                    <span className="text-lg font-black text-slate-900 font-mono">
                      {formatCurrency(applicant.input_data.annual_inc)}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      FICO Score
                    </span>
                    <span
                      className={clsx(
                        'text-lg font-black font-mono',
                        applicant.input_data.fico_score >= 720
                          ? 'text-emerald-700'
                          : applicant.input_data.fico_score >= 660
                          ? 'text-amber-700'
                          : 'text-rose-700'
                      )}
                    >
                      {applicant.input_data.fico_score}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Debt-to-Income
                    </span>
                    <span className="text-lg font-black text-slate-900 font-mono">
                      {applicant.input_data.dti?.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Secondary Attributes Table */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-6 text-xs pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-slate-400 font-medium block">Employment Tenure</span>
                    <span className="text-slate-800 font-bold">
                      {applicant.input_data.emp_length_years} Years
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block">Home Ownership</span>
                    <span className="text-slate-800 font-bold">
                      {applicant.input_data.home_ownership}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block">Loan Term</span>
                    <span className="text-slate-800 font-bold">
                      {applicant.input_data.term_months} Months
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block">Revolving Utilization</span>
                    <span className="text-slate-800 font-mono font-bold">
                      {applicant.input_data.revol_util?.toFixed(1)}%
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block">Delinquencies (2 yrs)</span>
                    <span className="text-slate-800 font-bold">
                      {applicant.input_data.delinq_2yrs}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block">Inquiries (6 mos)</span>
                    <span className="text-slate-800 font-bold">
                      {applicant.input_data.inq_last_6mths}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block">Open Accounts</span>
                    <span className="text-slate-800 font-bold">
                      {applicant.input_data.open_acc}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block">Public Records</span>
                    <span className="text-slate-800 font-bold">
                      {applicant.input_data.pub_rec}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block">Mortgage Accounts</span>
                    <span className="text-slate-800 font-bold">
                      {applicant.input_data.mort_acc}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Explainability Section: Positive Risk Drivers vs. Mitigating Strengths */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Explainable AI Risk Attribution (SHAP)</h3>
                  <p className="text-xs text-slate-500">
                    Transparent breakdown of mathematical drivers pushing risk higher or lower
                  </p>
                </div>
              </div>

              <RiskFactors
                positiveFactors={applicant.positive_risk_factors}
                reducingFactors={applicant.risk_reducing_factors}
              />
            </div>



            {/* Prediction History if available */}
            {applicant.prediction_history && applicant.prediction_history.length > 1 && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <History className="w-4 h-4 text-slate-500" />
                  <h3 className="text-sm font-bold text-slate-900">Prediction History</h3>
                </div>

                <div className="divide-y divide-slate-100 text-xs">
                  {applicant.prediction_history.map((hist, i) => (
                    <div key={i} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 font-mono">{formatDate(hist.timestamp)}</span>
                        <RiskBadge level={hist.risk_level} size="sm" showPulse={false} />
                      </div>
                      <span className="font-mono font-bold text-slate-900">
                        {(hist.final_probability * 100).toFixed(1)}% Default Probability
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
