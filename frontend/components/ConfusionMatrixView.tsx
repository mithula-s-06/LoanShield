import React from 'react';
import clsx from 'clsx';

interface ConfusionMatrixViewProps {
  matrix: {
    true_negatives: number;
    false_positives: number;
    false_negatives: number;
    true_positives: number;
  };
  modelName: string;
}

export const ConfusionMatrixView: React.FC<ConfusionMatrixViewProps> = ({
  matrix,
  modelName,
}) => {
  const { true_negatives: tn, false_positives: fp, false_negatives: fn, true_positives: tp } = matrix;
  const total = tn + fp + fn + tp;

  const tnPct = total > 0 ? ((tn / total) * 100).toFixed(1) : '0';
  const fpPct = total > 0 ? ((fp / total) * 100).toFixed(1) : '0';
  const fnPct = total > 0 ? ((fn / total) * 100).toFixed(1) : '0';
  const tpPct = total > 0 ? ((tp / total) * 100).toFixed(1) : '0';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
      <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Confusion Matrix (Test Set)</h3>
          <p className="text-xs text-slate-500">Evaluated on {total.toLocaleString()} out-of-sample loans</p>
        </div>
        <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
          {modelName}
        </span>
      </div>

      <div className="mt-5 flex flex-col items-center">
        {/* Matrix Header */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
          {/* True Negative (Paid -> Paid) */}
          <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-center relative">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
              True Negatives (TN)
            </span>
            <div className="text-2xl font-black text-emerald-950 font-mono mt-1">
              {tn.toLocaleString()}
            </div>
            <span className="text-xs text-emerald-700 font-medium">{tnPct}% (Paid Correctly)</span>
          </div>

          {/* False Positive (Paid -> Default) */}
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-center relative">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
              False Positives (FP)
            </span>
            <div className="text-2xl font-black text-amber-950 font-mono mt-1">
              {fp.toLocaleString()}
            </div>
            <span className="text-xs text-amber-700 font-medium">{fpPct}% (Type I Error)</span>
          </div>

          {/* False Negative (Default -> Paid) */}
          <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-200 text-center relative">
            <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
              False Negatives (FN)
            </span>
            <div className="text-2xl font-black text-rose-950 font-mono mt-1">
              {fn.toLocaleString()}
            </div>
            <span className="text-xs text-rose-700 font-medium">{fnPct}% (Missed Default)</span>
          </div>

          {/* True Positive (Default -> Default) */}
          <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-200 text-center relative">
            <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider block">
              True Positives (TP)
            </span>
            <div className="text-2xl font-black text-indigo-950 font-mono mt-1">
              {tp.toLocaleString()}
            </div>
            <span className="text-xs text-indigo-700 font-medium">{tpPct}% (Default Flagged)</span>
          </div>
        </div>

        <div className="mt-4 flex gap-6 text-xs text-slate-500 font-medium">
          <div>
            Predicted Class: <span className="text-slate-800 font-bold">Columns</span>
          </div>
          <div>
            Actual Ground Truth: <span className="text-slate-800 font-bold">Rows</span>
          </div>
        </div>
      </div>
    </div>
  );
};
