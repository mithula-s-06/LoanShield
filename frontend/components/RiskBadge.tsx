import React from 'react';
import { RiskLevel } from '@/lib/types';
import clsx from 'clsx';

interface RiskBadgeProps {
  level: RiskLevel | string;
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  size = 'md',
  showPulse = true,
  className = '',
}) => {
  const normLevel = (level || 'LOW').toUpperCase() as RiskLevel;

  const colorStyles = {
    LOW: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      dot: 'bg-emerald-500',
      label: 'LOW RISK',
    },
    MEDIUM: {
      bg: 'bg-amber-50 border-amber-200 text-amber-800',
      dot: 'bg-amber-500',
      label: 'MEDIUM RISK',
    },
    HIGH: {
      bg: 'bg-rose-50 border-rose-200 text-rose-800',
      dot: 'bg-rose-500',
      label: 'HIGH RISK',
    },
  }[normLevel] || {
    bg: 'bg-slate-50 border-slate-200 text-slate-800',
    dot: 'bg-slate-500',
    label: normLevel,
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-sm px-3.5 py-1.5 font-bold',
  }[size];

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border transition-all duration-200 tracking-wide',
        colorStyles.bg,
        sizeStyles,
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        {showPulse && normLevel === 'HIGH' && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
        )}
        <span className={clsx('relative inline-flex rounded-full h-2 w-2', colorStyles.dot)} />
      </span>
      {colorStyles.label}
    </span>
  );
};
