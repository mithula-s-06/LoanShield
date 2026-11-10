import React from 'react';
import { RiskLevel } from '@/lib/types';
import clsx from 'clsx';

interface RiskGaugeProps {
  probability: number; // 0.0 to 1.0
  riskLevel: RiskLevel | string;
  size?: number; // width/height in px
  showRecommendation?: boolean;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({
  probability,
  riskLevel,
  size = 220,
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round(probability * 1000) / 10));
  
  // Radius and arc math for 180-degree semi-circle gauge
  const strokeWidth = 14;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = Math.PI * radius; // Half-circle circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Determine color based on probability
  const getColor = (prob: number) => {
    if (prob < 0.30) return { stroke: '#10b981', text: 'text-emerald-600', glow: 'rgba(16, 185, 129, 0.2)' }; // Emerald
    if (prob < 0.60) return { stroke: '#f59e0b', text: 'text-amber-600', glow: 'rgba(245, 158, 11, 0.2)' }; // Amber
    return { stroke: '#f43f5e', text: 'text-rose-600', glow: 'rgba(244, 63, 94, 0.2)' }; // Rose
  };

  const theme = getColor(probability);

  return (
    <div className="flex flex-col items-center justify-center relative">
      <div style={{ width: size, height: size / 1.7 }} className="relative flex items-end justify-center overflow-hidden">
        <svg width={size} height={size} className="absolute top-0 transform -rotate-180">
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={0}
            strokeLinecap="round"
          />
          {/* Active progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={theme.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{
              filter: `drop-shadow(0 0 6px ${theme.glow})`,
            }}
          />
        </svg>

        {/* Center Numerical Value */}
        <div className="text-center z-10 mb-1">
          <div className="text-3xl font-black tracking-tight text-slate-900 flex items-baseline justify-center">
            {percentage.toFixed(1)}
            <span className="text-sm font-semibold text-slate-500 ml-0.5">%</span>
          </div>
          <span className={clsx('text-xs font-bold uppercase tracking-wider', theme.text)}>
            {riskLevel} RISK
          </span>
        </div>
      </div>

      {/* Threshold Labels */}
      <div className="w-full flex justify-between text-[11px] font-semibold text-slate-400 px-4 mt-1">
        <span>0% (Low)</span>
        <span className="text-amber-500">30%</span>
        <span className="text-rose-500">60%</span>
        <span>100% (High)</span>
      </div>
    </div>
  );
};
