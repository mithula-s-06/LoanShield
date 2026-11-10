'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface FeatureImportanceChartProps {
  features: Array<{ feature: string; importance: number }>;
  title?: string;
}

const FEATURE_READABLE_NAMES: Record<string, string> = {
  fico_score: 'FICO Score',
  loan_to_income: 'Loan-to-Income',
  delinq_2yrs: 'Past Delinquencies (2y)',
  dti: 'Debt-to-Income (DTI)',
  inq_last_6mths: 'Recent Inquiries (6m)',
  pub_rec: 'Public Records',
  revol_util: 'Revolving Line Utilization',
  home_ownership_RENT: 'Renter Status',
  mort_acc: 'Mortgage Accounts',
  annual_inc: 'Annual Income',
  loan_amnt: 'Loan Amount',
  term_months: 'Term Duration',
  emp_length_years: 'Employment Years',
  open_acc: 'Open Credit Accounts',
};

export const FeatureImportanceChart: React.FC<FeatureImportanceChartProps> = ({
  features = [],
  title = 'Global Feature Importance Weights',
}) => {
  const data = features.slice(0, 10).map((f) => ({
    name: FEATURE_READABLE_NAMES[f.feature] || f.feature.replace(/_/g, ' '),
    importance: Math.round(f.importance * 1000) / 10, // percentage
    raw: f.importance,
  }));

  // Reverse so highest is on top for horizontal layout
  const chartData = [...data].reverse();

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
      <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">Calculated Gini impurity reduction / Gain attribution</p>
        </div>
        <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
          Top 10 Drivers
        </span>
      </div>

      <div className="h-72 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 70, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis
              type="number"
              unit="%"
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={{ stroke: '#cbd5e1' }}
            />
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fontSize: 11, fill: '#334155', fontWeight: 500 }}
              axisLine={{ stroke: '#cbd5e1' }}
              width={120}
            />
            <Tooltip
              formatter={(value: any) => [`${value}% impact`, 'Weight']}
              contentStyle={{
                backgroundColor: '#0f172a',
                borderRadius: '8px',
                border: 'none',
                color: '#fff',
                fontSize: '12px',
              }}
            />
            <Bar dataKey="importance" radius={[0, 4, 4, 0]} barSize={16}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={index >= chartData.length - 3 ? '#6366f1' : '#94a3b8'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
