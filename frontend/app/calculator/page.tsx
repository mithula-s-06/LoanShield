'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopBar } from '@/components/TopBar';
import { LoanPurchaseCategoryCard } from '@/components/LoanPurchaseCategoryCard';
import { AmortizationScheduleChart } from '@/components/AmortizationScheduleChart';
import { LoadingSkeleton, ErrorState } from '@/components/LoadingSkeleton';
import { api } from '@/lib/api';
import {
  LoanPurchaseCategory,
  LoanPricingCalculationResponse,
} from '@/lib/types';
import {
  Calculator,
  Percent,
  DollarSign,
  Calendar,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Info,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Sliders,
  Award,
  AlertCircle,
  HelpCircle,
  Clock,
  Briefcase,
} from 'lucide-react';
import clsx from 'clsx';

export default function LoanPurchaseCalculatorPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<LoanPurchaseCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<LoanPurchaseCategory | null>(null);
  const [calculationResult, setCalculationResult] = useState<LoanPricingCalculationResponse | null>(null);
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(true);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form Controls State
  const [loanAmount, setLoanAmount] = useState<number>(25000);
  const [downPayment, setDownPayment] = useState<number>(0);
  const [termMonths, setTermMonths] = useState<number>(36);
  const [ficoScore, setFicoScore] = useState<number>(710);
  const [dti, setDti] = useState<number>(22.0);
  const [simulatedRisk, setSimulatedRisk] = useState<number | null>(null);

  // Active Schedule Tab: 'chart' | 'monthly' | 'yearly' | 'guidelines'
  const [activeTab, setActiveTab] = useState<'chart' | 'monthly' | 'yearly' | 'guidelines'>('chart');

  // 1. Fetch Categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoadingCategories(true);
      setError(null);
      try {
        const data = await api.getLoanPurchaseCategories();
        if (data && data.categories && data.categories.length > 0) {
          setCategories(data.categories);
          const defaultCat = data.categories[0];
          setSelectedCategory(defaultCat);
          setLoanAmount(defaultCat.default_amount);
          setTermMonths(defaultCat.default_term_months);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load loan purchase categories.');
      } finally {
        setIsLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // 2. Perform Calculation whenever inputs change
  useEffect(() => {
    if (!selectedCategory) return;

    const performCalculation = async () => {
      setIsCalculating(true);
      try {
        const result = await api.calculateLoanInterest({
          loan_purpose: selectedCategory.id,
          loan_amount: loanAmount,
          term_months: termMonths,
          fico_score: ficoScore,
          dti: dti,
          down_payment: downPayment,
          default_probability: simulatedRisk !== null ? simulatedRisk : undefined,
        });
        setCalculationResult(result);
      } catch (err: any) {
        console.error('Calculation error:', err);
      } finally {
        setIsCalculating(false);
      }
    };

    const debounce = setTimeout(performCalculation, 150);
    return () => clearTimeout(debounce);
  }, [selectedCategory, loanAmount, termMonths, ficoScore, dti, downPayment, simulatedRisk]);

  // Handle Category selection
  const handleSelectCategory = (cat: LoanPurchaseCategory) => {
    setSelectedCategory(cat);
    // Adjust amount & terms if current values are out of bounds
    if (loanAmount > cat.max_amount) {
      setLoanAmount(cat.max_amount);
    } else if (loanAmount < cat.min_amount) {
      setLoanAmount(cat.min_amount);
    }
    if (!cat.available_terms.includes(termMonths)) {
      setTermMonths(cat.default_term_months);
    }
  };

  // Memoized unique presets per category
  const quickPresets = React.useMemo(() => {
    if (!selectedCategory) return [];
    const basePresets = [10000, 25000, 40000, 60000, selectedCategory.max_amount];
    return Array.from(new Set(basePresets))
      .filter((preset) => preset >= selectedCategory.min_amount && preset <= selectedCategory.max_amount)
      .sort((a, b) => a - b);
  }, [selectedCategory]);

  // Quick Amount Presets
  const setAmountPreset = (amt: number) => {
    if (!selectedCategory) return;
    const bounded = Math.min(selectedCategory.max_amount, Math.max(selectedCategory.min_amount, amt));
    setLoanAmount(bounded);
  };

  // Navigate to New Risk Assessment pre-populated
  const handleTransferToUnderwriting = () => {
    if (!selectedCategory) return;
    const query = new URLSearchParams({
      amount: loanAmount.toString(),
      purpose: selectedCategory.id,
      term: termMonths.toString(),
      fico: ficoScore.toString(),
      dti: dti.toString(),
    });
    router.push(`/predict?${query.toString()}`);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <TopBar
        title="Loan Purchase Categories & Interest Calculator"
        subtitle="Dynamic Risk-Adjusted APR, Monthly Installments (EMI), and Amortization Schedules"
      />

      <main className="p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Header Hero Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-lg border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                Interactive Pricing Engine
              </span>
              <span className="text-xs text-slate-400">Multi-Category Risk Adjusted APR</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              Purchase Category Interest & EMI Studio
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Select any loan purchase category module below to inspect baseline interest rates,
              customize principal and term sliders, and compute risk-adjusted borrowing costs.
            </p>
          </div>

          <button
            onClick={handleTransferToUnderwriting}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md transition-all hover:scale-[1.02] shrink-0"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Score with Champion Model</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={() => window.location.reload()} />
        ) : isLoadingCategories ? (
          <LoadingSkeleton rows={6} />
        ) : (
          <>
            {/* Section 1: Loan Purchase Category Modules Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    Available Loan Purchase Modules
                  </h3>
                  <p className="text-xs text-slate-500">
                    Click any purchase module to evaluate customized interest pricing and repayment schedules
                  </p>
                </div>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200/60 px-2.5 py-1 rounded-lg">
                  {categories.length} Purchase Categories Available
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((cat) => (
                  <LoanPurchaseCategoryCard
                    key={`cat-card-${cat.id}`}
                    category={cat}
                    isSelected={selectedCategory?.id === cat.id}
                    onSelect={handleSelectCategory}
                  />
                ))}
              </div>
            </div>

            {/* Section 2: Selected Category Customization & Real-time Calculation Studio */}
            {selectedCategory && (
              <div className="space-y-6 pt-2">
                {/* Active Category Header Bar */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/30">
                      <Calculator className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">
                          {selectedCategory.title}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded">
                          {selectedCategory.category_badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {selectedCategory.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Base APR Range</span>
                      <span className="text-xs font-bold text-slate-800 font-mono">
                        {selectedCategory.min_apr}% – {selectedCategory.max_apr}%
                      </span>
                    </div>
                    <div className="px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Borrowing Limit</span>
                      <span className="text-xs font-bold text-slate-800 font-mono">
                        Up to ${selectedCategory.max_amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2-Column Calculation Studio Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column (7 cols): Parameter Inputs & Interactive Sliders */}
                  <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-indigo-600" />
                        <h4 className="text-sm font-bold text-slate-900">Loan & Borrower Parameters</h4>
                      </div>
                      <span className="text-xs text-slate-400 font-medium">Real-time dynamic recalculation</span>
                    </div>

                    {/* 1. Loan Amount */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                          Requested Loan Principal ($)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                          <input
                            type="number"
                            min={selectedCategory.min_amount}
                            max={selectedCategory.max_amount}
                            step={500}
                            value={loanAmount}
                            onChange={(e) => setLoanAmount(Number(e.target.value) || selectedCategory.min_amount)}
                            className="w-36 pl-6 pr-3 py-1.5 text-right font-mono font-bold text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <input
                        type="range"
                        min={selectedCategory.min_amount}
                        max={selectedCategory.max_amount}
                        step={500}
                        value={loanAmount}
                        onChange={(e) => setLoanAmount(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />

                      {/* Quick Presets */}
                      <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
                        <span className="text-[11px] text-slate-400 font-medium mr-1">Presets:</span>
                        {quickPresets.map((preset) => (
                          <button
                            key={`preset-btn-${selectedCategory.id}-${preset}`}
                            type="button"
                            onClick={() => setAmountPreset(preset)}
                            className={clsx(
                              'text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors',
                              loanAmount === preset
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            )}
                          >
                            ${preset >= 1000 ? `${(preset / 1000).toFixed(0)}k` : preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 2. Down Payment / Equity Pledge */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700">
                          Down Payment / Equity Pledge ($)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={loanAmount * 0.8}
                          step={500}
                          value={downPayment}
                          onChange={(e) => setDownPayment(Math.max(0, Number(e.target.value) || 0))}
                          className="w-32 px-3 py-1.5 text-right font-mono font-bold text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Net financed borrowing principal: <strong>${Math.max(0, loanAmount - downPayment).toLocaleString()}</strong>
                      </p>
                    </div>

                    {/* 3. Repayment Term */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                          Repayment Term (Duration)
                        </label>
                        <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60">
                          {termMonths} Months ({(termMonths / 12).toFixed(1)} Yrs)
                        </span>
                      </div>

                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {selectedCategory.available_terms.map((t) => (
                          <button
                            key={`term-btn-${selectedCategory.id}-${t}`}
                            type="button"
                            onClick={() => setTermMonths(t)}
                            className={clsx(
                              'py-2 text-xs font-bold rounded-xl border transition-all',
                              termMonths === t
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            )}
                          >
                            {t} Mo
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 4. Borrower Credit & Financial Profile */}
                    <div className="pt-2 border-t border-slate-100 space-y-4">
                      {/* FICO Score Slider */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-xs font-bold text-slate-700 block">
                              Borrower FICO Credit Score
                            </label>
                            <span className="text-[10px] text-slate-400">
                              Tier: {calculationResult?.apr_adjustments.fico_tier || 'Good'}
                            </span>
                          </div>
                          <span className={clsx(
                            'text-sm font-mono font-black px-2.5 py-0.5 rounded-lg border',
                            ficoScore >= 740 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            ficoScore >= 680 ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                            ficoScore >= 620 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-rose-50 text-rose-700 border-rose-200'
                          )}>
                            {ficoScore} FICO
                          </span>
                        </div>
                        <input
                          type="range"
                          min={350}
                          max={850}
                          step={5}
                          value={ficoScore}
                          onChange={(e) => setFicoScore(Number(e.target.value))}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                      </div>

                      {/* DTI Slider */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-xs font-bold text-slate-700 block">
                              Debt-to-Income (DTI) Ratio
                            </label>
                            <span className="text-[10px] text-slate-400">
                              Monthly debt burden relative to income
                            </span>
                          </div>
                          <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {dti.toFixed(1)}% DTI
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={65}
                          step={0.5}
                          value={dti}
                          onChange={(e) => setDti(Number(e.target.value))}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                      </div>

                      {/* Champion ML Model Default Risk Simulation */}
                      <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                            Default Probability Pricing Simulation (Logistic Regression Champion)
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500">
                            {simulatedRisk !== null ? `${(simulatedRisk * 100).toFixed(0)}% simulated risk` : 'Market Baseline'}
                          </span>
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { label: 'Baseline (0%)', val: null },
                            { label: 'Low Risk (5%)', val: 0.05 },
                            { label: 'Moderate (25%)', val: 0.25 },
                            { label: 'High Risk (55%)', val: 0.55 },
                          ].map((riskOpt, idx) => (
                            <button
                              key={`risk-sim-opt-${idx}-${riskOpt.label}`}
                              type="button"
                              onClick={() => setSimulatedRisk(riskOpt.val)}
                              className={clsx(
                                'py-1.5 text-[10px] font-bold rounded-lg border transition-all text-center',
                                simulatedRisk === riskOpt.val
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                              )}
                            >
                              {riskOpt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column (5 cols): Dynamic Financial Results & Cost Breakdown */}
                  <div className="lg:col-span-5 space-y-4">
                    {/* Primary Output: APR & Monthly Payment Card */}
                    <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 border border-indigo-800/80 shadow-xl space-y-5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                          Risk-Adjusted Pricing
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {selectedCategory.title}
                        </span>
                      </div>

                      {/* Main Calculated APR */}
                      <div className="space-y-1">
                        <span className="text-xs text-slate-300 font-medium">Calculated Annual Percentage Rate (APR)</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-black font-mono tracking-tight text-emerald-400">
                            {calculationResult ? `${calculationResult.calculated_apr.toFixed(2)}%` : '...'}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">fixed annual rate</span>
                        </div>
                      </div>

                      {/* Monthly Payment (EMI) Hero Box */}
                      <div className="p-4 bg-slate-950/70 rounded-xl border border-indigo-500/30 space-y-1">
                        <span className="text-[11px] text-indigo-300 font-bold uppercase tracking-wider block">
                          Estimated Monthly Installment (EMI)
                        </span>
                        <div className="text-3xl font-black font-mono text-white">
                          ${calculationResult ? calculationResult.monthly_payment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                          <span className="text-xs font-normal text-slate-400 ml-1">/ month</span>
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-1">
                          Calculated for {termMonths} monthly billing cycles
                        </span>
                      </div>

                      {/* Financial Cost Totals */}
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Total Interest Payable
                          </span>
                          <span className="text-base font-black font-mono text-amber-400 mt-0.5 block">
                            ${calculationResult ? calculationResult.total_interest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {calculationResult ? `${calculationResult.interest_ratio_pct}% of principal` : ''}
                          </span>
                        </div>

                        <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Total Lifetime Outflow
                          </span>
                          <span className="text-base font-black font-mono text-white mt-0.5 block">
                            ${calculationResult ? calculationResult.total_payment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                          </span>
                          <span className="text-[10px] text-slate-400">Principal + Total Interest</span>
                        </div>
                      </div>

                      {/* Transfer to Predict Button */}
                      <button
                        onClick={handleTransferToUnderwriting}
                        className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-lg transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                      >
                        <ShieldAlert className="w-4 h-4" />
                        <span>Score Applicant with Champion Model</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* APR Adjustment Factor Breakdown Card */}
                    {calculationResult && (
                      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <h4 className="text-xs font-bold text-slate-900">Interest Rate Breakdown Components</h4>
                          <span className="text-[10px] font-semibold text-slate-500 font-mono">
                            Base: {calculationResult.base_apr.toFixed(2)}%
                          </span>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between text-slate-600">
                            <span>Category Base Rate ({selectedCategory.title}):</span>
                            <span className="font-mono font-bold text-slate-900">{calculationResult.base_apr.toFixed(2)}%</span>
                          </div>

                          <div className="flex items-center justify-between text-slate-600">
                            <span>Credit Tier Adjustment ({calculationResult.apr_adjustments.fico_tier}):</span>
                            <span className={clsx('font-mono font-bold', calculationResult.apr_adjustments.fico_adjustment <= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                              {calculationResult.apr_adjustments.fico_adjustment > 0 ? '+' : ''}{calculationResult.apr_adjustments.fico_adjustment.toFixed(2)}%
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-slate-600">
                            <span>DTI Ratio Spread ({calculationResult.apr_adjustments.dti_tier}):</span>
                            <span className={clsx('font-mono font-bold', calculationResult.apr_adjustments.dti_adjustment <= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                              {calculationResult.apr_adjustments.dti_adjustment > 0 ? '+' : ''}{calculationResult.apr_adjustments.dti_adjustment.toFixed(2)}%
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-slate-600">
                            <span>Term Duration Spread ({termMonths} Months):</span>
                            <span className="font-mono font-bold text-slate-700">
                              {calculationResult.apr_adjustments.term_adjustment > 0 ? '+' : ''}{calculationResult.apr_adjustments.term_adjustment.toFixed(2)}%
                            </span>
                          </div>

                          {calculationResult.apr_adjustments.risk_premium > 0 && (
                            <div className="flex items-center justify-between text-slate-600">
                              <span>Default Risk Premium (Champion Model):</span>
                              <span className="font-mono font-bold text-rose-600">
                                +{calculationResult.apr_adjustments.risk_premium.toFixed(2)}%
                              </span>
                            </div>
                          )}

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between font-bold text-slate-900">
                            <span>Final Effective APR:</span>
                            <span className="font-mono text-sm text-indigo-600">{calculationResult.calculated_apr.toFixed(2)}%</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 3: Amortization Schedule & Product Guidelines Studio */}
                {calculationResult && (
                  <div className="space-y-4 pt-2">
                    {/* Tabs Navigation */}
                    <div className="flex items-center justify-between border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActiveTab('chart')}
                          className={clsx(
                            'px-4 py-2.5 text-xs font-bold border-b-2 transition-all',
                            activeTab === 'chart'
                              ? 'border-indigo-600 text-indigo-600'
                              : 'border-transparent text-slate-500 hover:text-slate-800'
                          )}
                        >
                          Amortization Curve Chart
                        </button>

                        <button
                          onClick={() => setActiveTab('monthly')}
                          className={clsx(
                            'px-4 py-2.5 text-xs font-bold border-b-2 transition-all',
                            activeTab === 'monthly'
                              ? 'border-indigo-600 text-indigo-600'
                              : 'border-transparent text-slate-500 hover:text-slate-800'
                          )}
                        >
                          Monthly Payment Schedule
                        </button>

                        <button
                          onClick={() => setActiveTab('yearly')}
                          className={clsx(
                            'px-4 py-2.5 text-xs font-bold border-b-2 transition-all',
                            activeTab === 'yearly'
                              ? 'border-indigo-600 text-indigo-600'
                              : 'border-transparent text-slate-500 hover:text-slate-800'
                          )}
                        >
                          Yearly Repayment Summary
                        </button>

                        <button
                          onClick={() => setActiveTab('guidelines')}
                          className={clsx(
                            'px-4 py-2.5 text-xs font-bold border-b-2 transition-all',
                            activeTab === 'guidelines'
                              ? 'border-indigo-600 text-indigo-600'
                              : 'border-transparent text-slate-500 hover:text-slate-800'
                          )}
                        >
                          Underwriting Guidelines & Benefits
                        </button>
                      </div>
                    </div>

                    {/* Tab 1: Chart View */}
                    {activeTab === 'chart' && (
                      <AmortizationScheduleChart
                        schedule={calculationResult.amortization_schedule}
                        totalInterest={calculationResult.total_interest}
                        principal={calculationResult.net_principal}
                      />
                    )}

                    {/* Tab 2: Monthly Table View */}
                    {activeTab === 'monthly' && (
                      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                          <h4 className="text-sm font-bold text-slate-900">
                            Detailed Monthly Amortization (First 24 Installments)
                          </h4>
                          <span className="text-xs text-slate-500">
                            Fixed Monthly Installment: ${calculationResult.monthly_payment.toLocaleString()}
                          </span>
                        </div>
                        <div className="overflow-x-auto max-h-96">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200/80 sticky top-0">
                              <tr>
                                <th className="py-3 px-4 font-bold text-slate-600">Month</th>
                                <th className="py-3 px-4 font-bold text-slate-600">Payment</th>
                                <th className="py-3 px-4 font-bold text-slate-600">Principal Paid</th>
                                <th className="py-3 px-4 font-bold text-slate-600">Interest Paid</th>
                                <th className="py-3 px-4 font-bold text-slate-600">Cumulative Interest</th>
                                <th className="py-3 px-4 font-bold text-slate-600">Remaining Balance</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-mono">
                              {calculationResult.amortization_schedule.map((row) => (
                                <tr key={`month-sched-${row.month}`} className="hover:bg-slate-50/70 transition-colors">
                                  <td className="py-2.5 px-4 font-sans font-bold text-slate-800">
                                    Month {row.month}
                                  </td>
                                  <td className="py-2.5 px-4 text-slate-900 font-bold">
                                    ${row.payment.toFixed(2)}
                                  </td>
                                  <td className="py-2.5 px-4 text-indigo-600 font-medium">
                                    ${row.principal.toFixed(2)}
                                  </td>
                                  <td className="py-2.5 px-4 text-amber-600 font-medium">
                                    ${row.interest.toFixed(2)}
                                  </td>
                                  <td className="py-2.5 px-4 text-slate-500">
                                    ${row.cumulative_interest.toFixed(2)}
                                  </td>
                                  <td className="py-2.5 px-4 font-bold text-slate-900">
                                    ${row.remaining_balance.toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Tab 3: Yearly Schedule View */}
                    {activeTab === 'yearly' && (
                      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                          <h4 className="text-sm font-bold text-slate-900">
                            Yearly Principal & Interest Summary
                          </h4>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200/80">
                              <tr>
                                <th className="py-3 px-4 font-bold text-slate-600">Year</th>
                                <th className="py-3 px-4 font-bold text-slate-600">Total Annual Paid</th>
                                <th className="py-3 px-4 font-bold text-slate-600">Principal Paid</th>
                                <th className="py-3 px-4 font-bold text-slate-600">Interest Paid</th>
                                <th className="py-3 px-4 font-bold text-slate-600">End of Year Balance</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-mono">
                              {calculationResult.yearly_schedule.map((yr) => (
                                <tr key={`year-sched-${yr.year}`} className="hover:bg-slate-50/70 transition-colors">
                                  <td className="py-3 px-4 font-sans font-bold text-slate-800">
                                    Year {yr.year}
                                  </td>
                                  <td className="py-3 px-4 font-bold text-slate-900">
                                    ${yr.total_paid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-3 px-4 font-medium text-indigo-600">
                                    ${yr.principal_paid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-3 px-4 font-medium text-amber-600">
                                    ${yr.interest_paid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-3 px-4 font-bold text-slate-900">
                                    ${yr.ending_balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Tab 4: Guidelines & Benefits */}
                    {activeTab === 'guidelines' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Benefits */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
                          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Key Category Financial Benefits
                          </h4>
                          <ul className="space-y-2 text-xs text-slate-600">
                            {selectedCategory.key_benefits.map((benefit, idx) => (
                              <li key={`benefit-item-${selectedCategory.id}-${idx}`} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                <span>{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Underwriting Guidelines */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
                          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-indigo-600" />
                            Bank Underwriting Verification Checklist
                          </h4>
                          <ul className="space-y-2 text-xs text-slate-600">
                            {selectedCategory.underwriting_guidelines.map((guide, idx) => (
                              <li key={`guide-item-${selectedCategory.id}-${idx}`} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                                <span>{guide}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
