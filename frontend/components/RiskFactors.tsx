import React from 'react';
import { RiskFactor } from '@/lib/types';
import { AlertTriangle, CheckCircle2, TrendingUp, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';

interface RiskFactorsProps {
  positiveFactors: RiskFactor[];
  reducingFactors: RiskFactor[];
}

export const RiskFactors: React.FC<RiskFactorsProps> = ({
  positiveFactors = [],
  reducingFactors = [],
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Positive Risk Contributors */}
      <div className="bg-white rounded-2xl border border-rose-200/70 p-5 shadow-xs">
        <div className="flex items-center gap-2.5 pb-3.5 border-b border-rose-100">
          <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              Positive Risk Contributors
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded-md">
                Risk Escalators
              </span>
            </h3>
            <p className="text-xs text-slate-500">Factors increasing predicted default probability</p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {positiveFactors.length === 0 ? (
            <div className="text-xs text-slate-400 py-3 text-center italic">
              No significant adverse risk factors identified.
            </div>
          ) : (
            positiveFactors.map((rf, idx) => (
              <div
                key={idx}
                className="p-3 bg-rose-50/40 rounded-xl border border-rose-100/80 transition-all hover:bg-rose-50/80"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-0.5 shrink-0" />
                    <span>{rf.label}</span>
                  </div>
                  {rf.impact_score > 0 && (
                    <span className="text-[11px] font-mono font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                      +{rf.impact_score.toFixed(3)} SHAP
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-600 pl-3 leading-relaxed">
                  {rf.description}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Risk-Reducing Factors */}
      <div className="bg-white rounded-2xl border border-emerald-200/70 p-5 shadow-xs">
        <div className="flex items-center gap-2.5 pb-3.5 border-b border-emerald-100">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              Risk-Reducing Factors
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-md">
                Mitigating Strengths
              </span>
            </h3>
            <p className="text-xs text-slate-500">Positive attributes dampening default exposure</p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {reducingFactors.length === 0 ? (
            <div className="text-xs text-slate-400 py-3 text-center italic">
              No strong positive risk mitigators identified.
            </div>
          ) : (
            reducingFactors.map((rf, idx) => (
              <div
                key={idx}
                className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-100/80 transition-all hover:bg-emerald-50/80"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-0.5 shrink-0" />
                    <span>{rf.label}</span>
                  </div>
                  {rf.impact_score > 0 && (
                    <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                      -{rf.impact_score.toFixed(3)} SHAP
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-600 pl-3 leading-relaxed">
                  {rf.description}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
