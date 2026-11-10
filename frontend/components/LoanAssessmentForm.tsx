'use client';

import React, { useState } from 'react';
import { LoanApplicationInput } from '@/lib/types';
import { ShieldAlert, Sparkles, User, DollarSign, CreditCard, Layers, Check, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

interface LoanAssessmentFormProps {
  onSubmit: (data: LoanApplicationInput) => Promise<void>;
  isLoading: boolean;
}

export const LoanAssessmentForm: React.FC<LoanAssessmentFormProps> = ({
  onSubmit,
  isLoading,
}) => {
  const [formData, setFormData] = useState<LoanApplicationInput>({
    applicant_name: 'Sophia Vance',
    annual_inc: 85000,
    loan_amnt: 22000,
    fico_score: 710,
    dti: 18.5,
    emp_length_years: 5,
    home_ownership: 'MORTGAGE',
    loan_purpose: 'debt_consolidation',
    term_months: 36,
    revol_util: 32.0,
    delinq_2yrs: 0,
    inq_last_6mths: 1,
    open_acc: 9,
    pub_rec: 0,
    mort_acc: 1,
    loan_title: 'Debt Consolidation Refinance',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.annual_inc || formData.annual_inc <= 0) errs.annual_inc = 'Annual income must be positive.';
    if (!formData.loan_amnt || formData.loan_amnt <= 0) errs.loan_amnt = 'Loan amount must be positive.';
    if (!formData.fico_score || formData.fico_score < 300 || formData.fico_score > 850) {
      errs.fico_score = 'FICO score must be between 300 and 850.';
    }
    if (formData.dti === undefined || formData.dti < 0 || formData.dti > 100) {
      errs.dti = 'DTI ratio must be between 0% and 100%.';
    }
    if (formData.revol_util === undefined || formData.revol_util < 0) {
      errs.revol_util = 'Revolving utilization must be 0% or higher.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (field: keyof LoanApplicationInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleApplyPreset = (presetName: string) => {
    if (presetName === 'prime') {
      setFormData({
        applicant_name: 'Arthur Pendelton',
        annual_inc: 135000,
        loan_amnt: 25000,
        fico_score: 790,
        dti: 11.2,
        emp_length_years: 9,
        home_ownership: 'MORTGAGE',
        loan_purpose: 'home_improvement',
        term_months: 36,
        revol_util: 14.5,
        delinq_2yrs: 0,
        inq_last_6mths: 0,
        open_acc: 14,
        pub_rec: 0,
        mort_acc: 2,
        loan_title: 'Home remodeling & energy upgrades',
      });
    } else if (presetName === 'moderate') {
      setFormData({
        applicant_name: 'Maya Lin',
        annual_inc: 68000,
        loan_amnt: 18000,
        fico_score: 675,
        dti: 26.4,
        emp_length_years: 4,
        home_ownership: 'RENT',
        loan_purpose: 'debt_consolidation',
        term_months: 36,
        revol_util: 52.0,
        delinq_2yrs: 0,
        inq_last_6mths: 1,
        open_acc: 8,
        pub_rec: 0,
        mort_acc: 0,
        loan_title: 'Credit card refinancing',
      });
    } else if (presetName === 'high_risk') {
      setFormData({
        applicant_name: 'Damian Cruz',
        annual_inc: 36000,
        loan_amnt: 26000,
        fico_score: 605,
        dti: 43.5,
        emp_length_years: 1,
        home_ownership: 'RENT',
        loan_purpose: 'small_business',
        term_months: 60,
        revol_util: 89.0,
        delinq_2yrs: 2,
        inq_last_6mths: 4,
        open_acc: 15,
        pub_rec: 1,
        mort_acc: 0,
        loan_title: 'Emergency retail venture capital',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Preset Quick Loader */}
      <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-900">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Load Underwriting Benchmarks:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleApplyPreset('prime')}
            className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold rounded-xl transition-colors shadow-2xs"
          >
            Prime Borrower (Low Risk)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('moderate')}
            className="px-3 py-1.5 bg-white hover:bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold rounded-xl transition-colors shadow-2xs"
          >
            Near-Prime (Medium Risk)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('high_risk')}
            className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold rounded-xl transition-colors shadow-2xs"
          >
            Subprime High-DTI (High Risk)
          </button>
        </div>
      </div>

      {/* Section 1: Applicant Information */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <User className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">1. Applicant Background</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Applicant Name
            </label>
            <input
              type="text"
              value={formData.applicant_name}
              onChange={(e) => handleChange('applicant_name', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              placeholder="Full legal name"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Annual Income ($) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              value={formData.annual_inc}
              onChange={(e) => handleChange('annual_inc', parseFloat(e.target.value) || 0)}
              className={clsx(
                'w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-mono font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all',
                errors.annual_inc ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-indigo-500'
              )}
              placeholder="e.g. 75000"
            />
            {errors.annual_inc && <p className="text-[11px] text-rose-600 mt-1">{errors.annual_inc}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Employment Length (Years)
            </label>
            <select
              value={formData.emp_length_years}
              onChange={(e) => handleChange('emp_length_years', parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            >
              <option value={0}>Less than 1 year</option>
              <option value={1}>1 Year</option>
              <option value={2}>2 Years</option>
              <option value={3}>3 Years</option>
              <option value={5}>5 Years</option>
              <option value={8}>8 Years</option>
              <option value={10}>10+ Years (Tenured)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Home Ownership Status
            </label>
            <select
              value={formData.home_ownership}
              onChange={(e) => handleChange('home_ownership', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            >
              <option value="MORTGAGE">MORTGAGE</option>
              <option value="RENT">RENT</option>
              <option value="OWN">OWN (Full Equity)</option>
              <option value="OTHER">OTHER</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section 2: Loan Information */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <DollarSign className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">2. Loan Request Specifications</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Requested Loan Amount ($) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              value={formData.loan_amnt}
              onChange={(e) => handleChange('loan_amnt', parseFloat(e.target.value) || 0)}
              className={clsx(
                'w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-mono font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all',
                errors.loan_amnt ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-indigo-500'
              )}
              placeholder="e.g. 20000"
            />
            {errors.loan_amnt && <p className="text-[11px] text-rose-600 mt-1">{errors.loan_amnt}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Loan Purpose
            </label>
            <select
              value={formData.loan_purpose}
              onChange={(e) => handleChange('loan_purpose', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            >
              <option value="debt_consolidation">Debt Consolidation</option>
              <option value="credit_card">Credit Card Refinancing</option>
              <option value="home_improvement">Home Improvement</option>
              <option value="small_business">Small Business</option>
              <option value="major_purchase">Major Purchase</option>
              <option value="medical">Medical Expenses</option>
              <option value="car">Car Financing</option>
              <option value="other">Other Personal</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Loan Term
            </label>
            <select
              value={formData.term_months}
              onChange={(e) => handleChange('term_months', parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            >
              <option value={36}>36 Months (3 Years)</option>
              <option value={60}>60 Months (5 Years)</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Loan Title / Underwriting Notes
            </label>
            <input
              type="text"
              value={formData.loan_title}
              onChange={(e) => handleChange('loan_title', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              placeholder="e.g. Consolidate high-interest balances"
            />
          </div>

          {/* Live Loan Purchase Category Interest & Payment Estimate Box */}
          <div className="md:col-span-3 p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                %
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-800 tracking-wider block">
                  Category Interest & Payment Preview ({formData.loan_purpose.replace(/_/g, ' ')})
                </span>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs font-bold text-slate-800">
                    Est. APR: <strong className="text-indigo-700 font-mono">
                      {(() => {
                        const baseRates: Record<string, number> = {
                          debt_consolidation: 8.99,
                          credit_card: 9.49,
                          home_improvement: 6.75,
                          small_business: 11.25,
                          car: 5.99,
                          major_purchase: 8.25,
                          medical: 7.25,
                          house: 6.25,
                          other: 9.99
                        };
                        const base = baseRates[formData.loan_purpose] || 8.99;
                        const ficoAdj = formData.fico_score >= 740 ? -1.0 : formData.fico_score >= 680 ? 0.0 : 2.5;
                        return (base + ficoAdj).toFixed(2);
                      })()}%
                    </strong>
                  </span>
                  <span className="text-slate-300">&bull;</span>
                  <span className="text-xs font-bold text-slate-800">
                    Est. Monthly Payment: <strong className="text-emerald-700 font-mono">
                      {(() => {
                        const p = formData.loan_amnt || 0;
                        const baseRates: Record<string, number> = {
                          debt_consolidation: 8.99,
                          credit_card: 9.49,
                          home_improvement: 6.75,
                          small_business: 11.25,
                          car: 5.99,
                          major_purchase: 8.25,
                          medical: 7.25,
                          house: 6.25,
                          other: 9.99
                        };
                        const base = baseRates[formData.loan_purpose] || 8.99;
                        const ficoAdj = formData.fico_score >= 740 ? -1.0 : formData.fico_score >= 680 ? 0.0 : 2.5;
                        const apr = (base + ficoAdj) / 100 / 12;
                        const n = formData.term_months || 36;
                        if (apr <= 0 || p <= 0) return `$0.00`;
                        const emi = (p * apr * Math.pow(1 + apr, n)) / (Math.pow(1 + apr, n) - 1);
                        return `$${emi.toFixed(2)}`;
                      })()}
                    </strong>/mo
                  </span>
                </div>
              </div>
            </div>

            <a
              href="/calculator"
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-indigo-200/80 shadow-2xs shrink-0"
            >
              Open Full Calculator &rarr;
            </a>
          </div>
        </div>
      </div>

      {/* Section 3: Financial & Credit Bureau Data */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <CreditCard className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">3. Credit Bureau & Financial Health</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              FICO Score (300-850) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min={300}
              max={850}
              value={formData.fico_score}
              onChange={(e) => handleChange('fico_score', parseInt(e.target.value) || 0)}
              className={clsx(
                'w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-mono font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all',
                errors.fico_score ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-indigo-500'
              )}
            />
            {errors.fico_score && <p className="text-[11px] text-rose-600 mt-1">{errors.fico_score}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Debt-to-Income (DTI %) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.dti}
              onChange={(e) => handleChange('dti', parseFloat(e.target.value) || 0)}
              className={clsx(
                'w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-mono font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all',
                errors.dti ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-indigo-500'
              )}
            />
            {errors.dti && <p className="text-[11px] text-rose-600 mt-1">{errors.dti}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Revolving Utilization (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.revol_util}
              onChange={(e) => handleChange('revol_util', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Delinquencies (Past 2 yrs)
            </label>
            <input
              type="number"
              min={0}
              value={formData.delinq_2yrs}
              onChange={(e) => handleChange('delinq_2yrs', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Inquiries (Past 6 mos)
            </label>
            <input
              type="number"
              min={0}
              value={formData.inq_last_6mths}
              onChange={(e) => handleChange('inq_last_6mths', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Open Credit Accounts
            </label>
            <input
              type="number"
              min={1}
              value={formData.open_acc}
              onChange={(e) => handleChange('open_acc', parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Public Derogatory Records
            </label>
            <input
              type="number"
              min={0}
              value={formData.pub_rec}
              onChange={(e) => handleChange('pub_rec', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mortgage Accounts
            </label>
            <input
              type="number"
              min={0}
              value={formData.mort_acc}
              onChange={(e) => handleChange('mort_acc', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Submission Action */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Analyzing loan risk with multi-model engine...</span>
            </>
          ) : (
            <>
              <ShieldAlert className="w-4 h-4" />
              <span>ANALYZE LOAN RISK</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
