import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import clsx from 'clsx';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  colorScheme?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  colorScheme = 'indigo',
}) => {
  const schemeStyles = {
    indigo: {
      bg: 'bg-indigo-50',
      iconText: 'text-indigo-600',
      border: 'border-slate-200/80',
    },
    emerald: {
      bg: 'bg-emerald-50',
      iconText: 'text-emerald-600',
      border: 'border-slate-200/80',
    },
    amber: {
      bg: 'bg-amber-50',
      iconText: 'text-amber-600',
      border: 'border-slate-200/80',
    },
    rose: {
      bg: 'bg-rose-50',
      iconText: 'text-rose-600',
      border: 'border-slate-200/80',
    },
    slate: {
      bg: 'bg-slate-100',
      iconText: 'text-slate-700',
      border: 'border-slate-200/80',
    },
  }[colorScheme];

  return (
    <div className={clsx('bg-white p-5 rounded-2xl border shadow-xs transition-all duration-200 hover:shadow-md', schemeStyles.border)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center', schemeStyles.bg, schemeStyles.iconText)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-black text-slate-900 tracking-tight">{value}</span>
        {trend && (
          <span
            className={clsx(
              'inline-flex items-center text-xs font-semibold px-1.5 py-0.5 rounded',
              trend.isPositive ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
            )}
          >
            {trend.isPositive ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
            {trend.value}
          </span>
        )}
      </div>

      {subtitle && <p className="mt-1 text-xs text-slate-500 font-medium">{subtitle}</p>}
    </div>
  );
};
