'use client';

import React from 'react';
import Link from 'next/link';
import { ApplicantSummary } from '@/lib/types';
import { RiskBadge } from './RiskBadge';
import { ChevronRight, ArrowUpDown, Eye, DollarSign, Calendar } from 'lucide-react';
import clsx from 'clsx';

interface ApplicantTableProps {
  applicants: ApplicantSummary[];
  sortBy?: string;
  sortOrder?: string;
  onSort?: (field: string) => void;
  isLoading?: boolean;
}

export const ApplicantTable: React.FC<ApplicantTableProps> = ({
  applicants = [],
  sortBy,
  sortOrder,
  onSort,
  isLoading = false,
}) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const renderSortIcon = (field: string) => {
    if (!onSort) return null;
    return (
      <button
        onClick={() => onSort(field)}
        className="inline-flex items-center text-slate-400 hover:text-slate-700 ml-1 p-0.5 rounded transition-colors"
      >
        <ArrowUpDown className="w-3 h-3" />
      </button>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4">Applicant ID</th>
              <th className="py-3.5 px-4">Borrower</th>
              <th className="py-3.5 px-4">
                <span className="flex items-center">
                  Loan Amount {renderSortIcon('loan_amount')}
                </span>
              </th>
              <th className="py-3.5 px-4">
                <span className="flex items-center">
                  Income {renderSortIcon('income')}
                </span>
              </th>
              <th className="py-3.5 px-4">
                <span className="flex items-center">
                  FICO {renderSortIcon('fico')}
                </span>
              </th>
              <th className="py-3.5 px-4">Purpose</th>
              <th className="py-3.5 px-4">
                <span className="flex items-center">
                  Default Prob {renderSortIcon('probability')}
                </span>
              </th>
              <th className="py-3.5 px-4">Risk Classification</th>
              <th className="py-3.5 px-4">Assessed Date</th>
              <th className="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {applicants.map((app) => {
              const probPct = (app.default_probability * 100).toFixed(1);

              return (
                <tr
                  key={app.applicant_id}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                    <Link
                      href={`/applications/${app.applicant_id}`}
                      className="hover:underline flex items-center gap-1"
                    >
                      {app.applicant_id}
                    </Link>
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    {app.applicant_name}
                  </td>

                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                    {formatCurrency(app.loan_amnt)}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-600">
                    {formatCurrency(app.annual_inc)}
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold">
                    <span
                      className={clsx(
                        app.fico_score >= 720
                          ? 'text-emerald-700'
                          : app.fico_score >= 660
                          ? 'text-amber-700'
                          : 'text-rose-700'
                      )}
                    >
                      {app.fico_score}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 capitalize text-slate-600">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-medium text-slate-700">
                      {app.loan_purpose.replace(/_/g, ' ')}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{probPct}%</span>
                      <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={clsx(
                            'h-full rounded-full',
                            app.default_probability < 0.30
                              ? 'bg-emerald-500'
                              : app.default_probability < 0.60
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          )}
                          style={{ width: `${Math.min(100, app.default_probability * 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <RiskBadge level={app.risk_level} size="sm" />
                  </td>

                  <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                    {formatDate(app.created_at)}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/applications/${app.applicant_id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
