'use client';

import React from 'react';
import { LoanPurchaseCategory } from '@/lib/types';
import {
  CreditCard,
  Layers,
  Home,
  Briefcase,
  ShoppingBag,
  HeartPulse,
  Car,
  Building,
  Sparkles,
  CheckCircle2,
  Percent,
  ArrowUpRight,
} from 'lucide-react';
import clsx from 'clsx';

interface LoanPurchaseCategoryCardProps {
  category: LoanPurchaseCategory;
  isSelected: boolean;
  onSelect: (category: LoanPurchaseCategory) => void;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  debt_consolidation: Layers,
  credit_card: CreditCard,
  home_improvement: Home,
  small_business: Briefcase,
  major_purchase: ShoppingBag,
  medical: HeartPulse,
  car: Car,
  house: Building,
  other: Sparkles,
};

const CATEGORY_COLORS: Record<string, { iconBg: string; iconColor: string; borderActive: string }> = {
  debt_consolidation: {
    iconBg: 'bg-indigo-50 text-indigo-600',
    iconColor: 'text-indigo-600',
    borderActive: 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/20',
  },
  credit_card: {
    iconBg: 'bg-sky-50 text-sky-600',
    iconColor: 'text-sky-600',
    borderActive: 'border-sky-600 ring-2 ring-sky-500/20 bg-sky-50/20',
  },
  home_improvement: {
    iconBg: 'bg-emerald-50 text-emerald-600',
    iconColor: 'text-emerald-600',
    borderActive: 'border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/20',
  },
  small_business: {
    iconBg: 'bg-amber-50 text-amber-600',
    iconColor: 'text-amber-600',
    borderActive: 'border-amber-600 ring-2 ring-amber-500/20 bg-amber-50/20',
  },
  car: {
    iconBg: 'bg-blue-50 text-blue-600',
    iconColor: 'text-blue-600',
    borderActive: 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/20',
  },
  major_purchase: {
    iconBg: 'bg-violet-50 text-violet-600',
    iconColor: 'text-violet-600',
    borderActive: 'border-violet-600 ring-2 ring-violet-500/20 bg-violet-50/20',
  },
  medical: {
    iconBg: 'bg-rose-50 text-rose-600',
    iconColor: 'text-rose-600',
    borderActive: 'border-rose-600 ring-2 ring-rose-500/20 bg-rose-50/20',
  },
  house: {
    iconBg: 'bg-teal-50 text-teal-600',
    iconColor: 'text-teal-600',
    borderActive: 'border-teal-600 ring-2 ring-teal-500/20 bg-teal-50/20',
  },
  other: {
    iconBg: 'bg-slate-100 text-slate-700',
    iconColor: 'text-slate-700',
    borderActive: 'border-slate-800 ring-2 ring-slate-800/20 bg-slate-50',
  },
};

export const LoanPurchaseCategoryCard: React.FC<LoanPurchaseCategoryCardProps> = ({
  category,
  isSelected,
  onSelect,
}) => {
  const Icon = CATEGORY_ICONS[category.id] || Sparkles;
  const styling = CATEGORY_COLORS[category.id] || CATEGORY_COLORS.other;

  return (
    <button
      onClick={() => onSelect(category)}
      className={clsx(
        'text-left rounded-2xl p-5 border transition-all duration-200 relative flex flex-col justify-between group cursor-pointer shadow-xs hover:shadow-md hover:scale-[1.015]',
        isSelected
          ? styling.borderActive
          : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/60'
      )}
    >
      {/* Top Tag & Selection Badge */}
      <div className="flex items-start justify-between gap-2 w-full">
        <div className="flex items-center gap-2.5">
          <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center font-bold', styling.iconBg)}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block group-hover:text-indigo-600 transition-colors">
              {category.title}
            </span>
            <span className="text-[10px] font-semibold text-slate-400">
              {category.risk_profile}
            </span>
          </div>
        </div>

        {isSelected ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-indigo-600 text-white rounded-full shadow-xs">
            <CheckCircle2 className="w-3 h-3" />
            Active
          </span>
        ) : (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/60">
            {category.category_badge}
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-xs text-slate-500 mt-3 line-clamp-2 leading-relaxed">
        {category.description}
      </p>

      {/* Financial Metrics Summary */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between w-full">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Starting Base APR
          </span>
          <div className="flex items-baseline gap-1 text-slate-900 mt-0.5">
            <span className="text-base font-black font-mono text-indigo-600">
              {category.base_apr.toFixed(2)}%
            </span>
            <span className="text-[10px] text-slate-400 font-medium">APR</span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Max Limit
          </span>
          <span className="text-xs font-bold font-mono text-slate-700">
            ${(category.max_amount / 1000).toFixed(0)}k Max
          </span>
        </div>
      </div>
    </button>
  );
};
