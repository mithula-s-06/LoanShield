'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { TopBar } from '@/components/TopBar';
import { ApplicantTable } from '@/components/ApplicantTable';
import { LoadingSkeleton, EmptyState, ErrorState } from '@/components/LoadingSkeleton';
import { api } from '@/lib/api';
import { ApplicationsListResponse, RiskLevel } from '@/lib/types';
import {
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  RotateCcw,
  X,
} from 'lucide-react';

function ApplicationsContent() {
  const searchParams = useSearchParams();
  const initialRisk = searchParams.get('risk_level') || 'ALL';

  const [data, setData] = useState<ApplicationsListResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRisk, setSelectedRisk] = useState<string>(initialRisk);
  const [selectedPurpose, setSelectedPurpose] = useState<string>('ALL');
  const [minProb, setMinProb] = useState<string>('');
  const [maxProb, setMaxProb] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<string>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  const fetchApplications = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getApplications({
        search: searchTerm || undefined,
        risk_level: selectedRisk !== 'ALL' ? selectedRisk : undefined,
        loan_purpose: selectedPurpose !== 'ALL' ? selectedPurpose : undefined,
        min_prob: minProb ? parseFloat(minProb) / 100 : undefined,
        max_prob: maxProb ? parseFloat(maxProb) / 100 : undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        page: currentPage,
        limit: pageSize,
      });
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve application records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [selectedRisk, selectedPurpose, sortBy, sortOrder, currentPage]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchApplications();
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
    setIsLoading(true);
    setError(null);
    api.getApplications({
      search: undefined,
      risk_level: selectedRisk !== 'ALL' ? selectedRisk : undefined,
      loan_purpose: selectedPurpose !== 'ALL' ? selectedPurpose : undefined,
      min_prob: minProb ? parseFloat(minProb) / 100 : undefined,
      max_prob: maxProb ? parseFloat(maxProb) / 100 : undefined,
      sort_by: sortBy,
      sort_order: sortOrder,
      page: 1,
      limit: pageSize,
    })
      .then((res) => setData(res))
      .catch((err) => setError(err.message || 'Failed to retrieve application records.'))
      .finally(() => setIsLoading(false));
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedRisk('ALL');
    setSelectedPurpose('ALL');
    setMinProb('');
    setMaxProb('');
    setSortBy('created_at');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <TopBar
        title="Loan Applications Registry"
        subtitle="Search, Filter, and Inspect Underwriting Files"
      />

      <main className="p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header with New Assessment Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Applicant Database</h2>
            <p className="text-xs text-slate-500">
              Showing evaluated applications with risk probabilities and model assessments
            </p>
          </div>

          <Link
            href="/predict"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all hover:scale-[1.02] shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Risk Assessment</span>
          </Link>
        </div>

        {/* Filter and Search Bar Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row gap-3">
            {/* Search Input with Clear X Button */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Applicant ID (e.g. APP-10482) or Borrower Name..."
                className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors shadow-2xs"
                  title="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
            >
              Search
            </button>
          </form>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-100 text-xs">
            {/* Risk Level Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Risk Classification
              </label>
              <select
                value={selectedRisk}
                onChange={(e) => {
                  setSelectedRisk(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
              >
                <option value="ALL">All Risk Bands</option>
                <option value="LOW">Low Risk (0-30%)</option>
                <option value="MEDIUM">Medium Risk (30-60%)</option>
                <option value="HIGH">High Risk (60-100%)</option>
              </select>
            </div>

            {/* Loan Purpose Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Loan Purpose
              </label>
              <select
                value={selectedPurpose}
                onChange={(e) => {
                  setSelectedPurpose(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
              >
                <option value="ALL">All Purposes</option>
                <option value="debt_consolidation">Debt Consolidation</option>
                <option value="credit_card">Credit Card</option>
                <option value="home_improvement">Home Improvement</option>
                <option value="small_business">Small Business</option>
                <option value="major_purchase">Major Purchase</option>
                <option value="medical">Medical</option>
              </select>
            </div>

            {/* Sort Field */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Sort Attribute
              </label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
              >
                <option value="created_at">Assessment Date</option>
                <option value="probability">Default Probability</option>
                <option value="loan_amount">Loan Amount</option>
                <option value="income">Annual Income</option>
                <option value="fico">FICO Score</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Sort Direction
              </label>
              <select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
              >
                <option value="desc">Descending (High to Low)</option>
                <option value="asc">Ascending (Low to High)</option>
              </select>
            </div>

            {/* Reset Button */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleResetFilters}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Applications Content Table */}
        {error ? (
          <ErrorState message={error} onRetry={fetchApplications} />
        ) : isLoading || !data ? (
          <LoadingSkeleton rows={8} />
        ) : data.items.length === 0 ? (
          <EmptyState
            title="No matching loan applications found"
            description="Adjust your search query or risk filters, or initiate a new loan assessment."
            actionText="New Risk Assessment"
            onAction={() => (window.location.href = '/predict')}
          />
        ) : (
          <div className="space-y-4">
            <ApplicantTable
              applicants={data.items}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSortChange}
            />

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 text-xs font-medium text-slate-600">
              <span>
                Showing <strong className="text-slate-900">{((currentPage - 1) * pageSize) + 1}</strong> to{' '}
                <strong className="text-slate-900">{Math.min(data.total, currentPage * pageSize)}</strong> of{' '}
                <strong className="text-slate-900">{data.total}</strong> applicants
              </span>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-semibold"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Previous
                </button>

                <span className="px-3 py-1.5 bg-slate-100 rounded-lg font-bold text-slate-900 font-mono">
                  {currentPage} / {data.pages}
                </span>

                <button
                  disabled={currentPage >= data.pages}
                  onClick={() => setCurrentPage((p) => Math.min(data.pages, p + 1))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-semibold"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ApplicationsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton rows={8} />}>
      <ApplicationsContent />
    </Suspense>
  );
}
