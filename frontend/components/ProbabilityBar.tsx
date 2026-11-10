import React from 'react';
import { RiskLevel } from '@/lib/types';
import clsx from 'clsx';

interface ProbabilityBarProps {
  probability: number;
  riskLevel?: RiskLevel | string;
  showLabels?: boolean;
  height?: string;
  className?: string;
}

export const ProbabilityBar: React.FC<ProbabilityBarProps> = ({
  probability,
  riskLevel,
  showLabels = true,
  height = 'h-2.5',
  className = '',
}) => {
  const pct = Math.min(100, Math.max(0, probability * 100));

  const getBarColor = (p: number) => {
    if (p < 0.30) return 'bg-emerald-500 shadow-sm shadow-emerald-500/20';
    if (p < 0.60) return 'bg-amber-500 shadow-sm shadow-amber-500/20';
    return 'bg-rose-500 shadow-sm shadow-rose-500/20';
  };

  return (
    <div className={clsx('w-full', className)}>
      {showLabels && (
        <div className="flex justify-between items-center mb-1.5 text-xs font-semibold">
          <span className="text-slate-600">Default Risk Probability</span>
          <span className="font-mono font-bold text-slate-900">{pct.toFixed(1)}%</span>
        </div>
      )}

      {/* Progress Track */}
      <div className={clsx('w-full bg-slate-100 rounded-full overflow-hidden relative', height)}>
        {/* Risk zone indicators */}
        <div className="absolute left-[30%] top-0 bottom-0 w-px bg-slate-300 z-10" title="Low/Medium threshold (30%)" />
        <div className="absolute left-[60%] top-0 bottom-0 w-px bg-slate-300 z-10" title="Medium/High threshold (60%)" />

        <div
          className={clsx('h-full rounded-full transition-all duration-700 ease-out', getBarColor(probability))}
          style={{ width: `${pct}%` }}
        />
      </div>

      {showLabels && (
        <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-medium">
          <span>0%</span>
          <span className="pl-4">30% (Low Band)</span>
          <span className="pl-4">60% (High Band)</span>
          <span>100%</span>
        </div>
      )}
    </div>
  );
};
