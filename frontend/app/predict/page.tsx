'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TopBar } from '@/components/TopBar';
import { LoanAssessmentForm } from '@/components/LoanAssessmentForm';
import { RiskGauge } from '@/components/RiskGauge';
import { RiskBadge } from '@/components/RiskBadge';
import { RiskFactors } from '@/components/RiskFactors';
import { ModelComparisonCard } from '@/components/ModelComparisonCard';
import { api } from '@/lib/api';
import { LoanApplicationInput, PredictionResponse } from '@/lib/types';
import {
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Save,
  ArrowRight,
  RotateCcw,
  AlertTriangle,
  Info,
} from 'lucide-react';
import clsx from 'clsx';

export default function PredictPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [lastInputData, setLastInputData] = useState<LoanApplicationInput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (formData: LoanApplicationInput) => {
    setIsLoading(true);
    setError(null);
    setSavedSuccess(false);
    setLastInputData(formData);
    try {
      const res = await api.predictRisk(formData);
      setPrediction(res);
      setSavedSuccess(true);
      // Smooth scroll to prediction output
      setTimeout(() => {
        const el = document.getElementById('prediction-results-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (err: any) {
      setError(err.message || 'Error executing ML prediction pipeline.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToRegistry = async () => {
    if (!lastInputData) return;
    setIsSaving(true);
    try {
      const savedDoc = await api.submitApplication(lastInputData);
      setSavedSuccess(true);
      setTimeout(() => {
        router.push(`/applications/${savedDoc.applicant_id}`);
      }, 600);
    } catch (err: any) {
      setError(err.message || 'Failed to persist application into underwriting database.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <TopBar
        title="New Loan Risk Assessment"
        subtitle="Real-Time Multi-Model Underwriting Evaluation & SHAP Analysis"
      />

      <main className="p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Intro Guidance */}
        <div className="bg-indigo-900 text-white rounded-3xl p-6 shadow-md border border-indigo-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-500/30 text-indigo-200 rounded-full border border-indigo-400/30 uppercase tracking-wider">
                Bank Analyst Workbench
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              Pre-Loan Decision Support Evaluation
            </h2>
            <p className="text-xs text-indigo-200 leading-relaxed">
              Enter applicant details and credit bureau variables to evaluate default probability
              across Logistic Regression, Decision Tree, Random Forest, and XGBoost models.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-indigo-300 font-medium bg-indigo-950/60 px-3.5 py-2 rounded-xl border border-indigo-800">
            <Info className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Advisory assistance only. No automatic lending decisions are enforced.</span>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Assessment Form */}
        <LoanAssessmentForm onSubmit={handleAnalyze} isLoading={isLoading} />

        {/* Prediction Results Display */}
        {prediction && (
          <div id="prediction-results-section" className="space-y-6 pt-6 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  Evaluation Results
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">
                  Default Risk Assessment Report
                </h2>
                <p className="text-xs text-slate-500">
                  File generated for: <strong className="text-slate-800">{prediction.input_data.applicant_name || prediction.applicant_id}</strong>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPrediction(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Assessment
                </button>

                <button
                  type="button"
                  onClick={() => router.push(`/applications/${prediction.applicant_id}`)}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Recorded in Registry ({prediction.applicant_id})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Risk Gauge & Recommendation Hero Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 pb-6 md:pb-0 md:pr-6">
                <RiskGauge
                  probability={prediction.final_probability}
                  riskLevel={prediction.risk_level}
                  size={240}
                />
              </div>

              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center gap-3">
                  <RiskBadge level={prediction.risk_level} size="lg" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Primary Engine: {prediction.selected_model.toUpperCase()}
                  </span>
                </div>

                <div
                  className={clsx(
                    'p-5 rounded-2xl border text-sm leading-relaxed',
                    prediction.risk_level === 'LOW'
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                      : prediction.risk_level === 'MEDIUM'
                      ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                      : 'bg-rose-50/70 border-rose-200 text-rose-950'
                  )}
                >
                  <div className="font-bold flex items-center gap-2 mb-1.5 text-xs uppercase tracking-wider">
                    {prediction.risk_level === 'HIGH' ? (
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                    Underwriting Decision Support Advisory
                  </div>
                  <p className="text-xs font-medium text-slate-700">
                    {prediction.recommendation}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Low Threshold
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      {(prediction.thresholds.low * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      High Threshold
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      {(prediction.thresholds.high * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Predicted Probability
                    </span>
                    <span className="font-mono font-bold text-indigo-700">
                      {(prediction.final_probability * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Explainability Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900">
                Explainable AI Factor Analysis (SHAP Weights)
              </h3>
              <RiskFactors
                positiveFactors={prediction.positive_risk_factors}
                reducingFactors={prediction.risk_reducing_factors}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
