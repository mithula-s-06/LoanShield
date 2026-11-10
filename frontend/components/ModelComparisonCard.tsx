import React from 'react';
import { ModelPredictionDetail, RiskLevel } from '@/lib/types';
import { RiskBadge } from './RiskBadge';
import { Cpu, CheckCircle } from 'lucide-react';
import clsx from 'clsx';

interface ModelComparisonCardProps {
  predictions: Record<string, ModelPredictionDetail>;
  selectedModel?: string;
}

export const ModelComparisonCard: React.FC<ModelComparisonCardProps> = ({
  predictions = {},
  selectedModel = 'logistic_regression',
}) => {
  const modelMeta: Record<string, { name: string; type: string; desc: string }> = {
    logistic_regression: {
      name: 'Logistic Regression',
      type: 'Champion Model (L2 Regularized)',
      desc: 'Top-performing model (AUC 0.796, Recall 72.5%) with full regulatory transparency',
    },
    xgboost: {
      name: 'XGBoost',
      type: 'Gradient Boosted Decision Trees',
      desc: 'Optimized high-efficiency tabular boosting engine',
    },
    random_forest: {
      name: 'Random Forest',
      type: 'Bagged Ensemble',
      desc: 'Parallel decision trees ensemble',
    },
    decision_tree: {
      name: 'Decision Tree',
      type: 'Single Tree',
      desc: 'Transparent rule-based path',
    },
  };

  const activeKeys = Object.keys(predictions).length > 0 ? Object.keys(predictions) : ['logistic_regression', 'xgboost', 'random_forest'];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {activeKeys.length === 1 ? 'Logistic Regression Champion Underwriting Engine' : 'Model Consensus Comparison'}
            </h3>
            <p className="text-xs text-slate-500">
              {activeKeys.length === 1
                ? 'High-performance L2-regularized linear model with maximum regulatory explainability and 72.5% default recall'
                : 'Live predictions across evaluated supervised classifiers'}
            </p>
          </div>
        </div>
      </div>

      <div
        className={clsx(
          'grid gap-4 mt-4',
          activeKeys.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
        )}
      >
        {activeKeys.map((key) => {
          const meta = modelMeta[key] || {
            name: key.toUpperCase(),
            type: 'Machine Learning Model',
            desc: 'Credit risk classifier',
          };
          const detail = predictions[key] || {
            probability: 0.0,
            predicted_class: 0,
            risk_level: 'LOW' as RiskLevel,
          };
          const isSelected = key === selectedModel || activeKeys.length === 1;
          const probPct = (detail.probability * 100).toFixed(1);

          return (
            <div
              key={key}
              className={clsx(
                'rounded-xl p-4 border transition-all relative flex flex-col justify-between',
                isSelected
                  ? 'border-indigo-500 bg-indigo-50/20 shadow-sm ring-1 ring-indigo-500/20'
                  : 'border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300'
              )}
            >
              {isSelected && (
                <span className="absolute -top-2.5 right-3 text-[10px] font-bold px-2 py-0.5 bg-indigo-600 text-white rounded-full flex items-center gap-1 shadow-xs">
                  <CheckCircle className="w-2.5 h-2.5" />
                  {activeKeys.length === 1 ? 'ACTIVE ENGINE' : 'PRIMARY'}
                </span>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{meta.name}</span>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">
                  {meta.type}
                </span>

                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-900 font-mono">
                    {probPct}%
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">probability of default</span>
                </div>
                
                <p className="text-[11px] text-slate-500 mt-1">
                  {meta.desc}
                </p>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                <RiskBadge level={detail.risk_level} size="sm" showPulse={false} />
                <span className="text-[11px] font-semibold text-slate-500">
                  {detail.predicted_class === 1 ? 'Predicted Default' : 'Low Risk / Paid'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
