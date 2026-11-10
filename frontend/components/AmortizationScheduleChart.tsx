'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { AmortizationRow } from '@/lib/types';

interface AmortizationScheduleChartProps {
  schedule: AmortizationRow[];
  totalInterest: number;
  principal: number;
}

export const AmortizationScheduleChart: React.FC<AmortizationScheduleChartProps> = ({
  schedule,
  totalInterest,
  principal,
}) => {
  if (!schedule || schedule.length === 0) {
    return null;
  }

  const chartData = schedule.map((row) => ({
    month: `M${row.month}`,
    monthNum: row.month,
    'Remaining Balance': row.remaining_balance,
    'Cumulative Interest': row.cumulative_interest,
    'Principal Paid': Math.max(0, principal - row.remaining_balance),
  }));

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Loan Amortization Payoff Curve</h4>
          <p className="text-xs text-slate-500">
            Principal paydown trajectory versus cumulative interest over time
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
            <span className="text-slate-600">Principal: ${principal.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-600">Total Interest: ${totalInterest.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="h-72 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="interestGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: '#64748b' }}
              interval={Math.max(1, Math.floor(chartData.length / 8))}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(val: any, name: any) => [
                `$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                name,
              ]}
              labelFormatter={(label) => `Loan Term: ${label}`}
              contentStyle={{
                backgroundColor: '#0f172a',
                borderRadius: '10px',
                border: 'none',
                color: '#fff',
                fontSize: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
              }}
            />
            <Area
              type="monotone"
              dataKey="Remaining Balance"
              stroke="#4f46e5"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#balanceGrad)"
            />
            <Area
              type="monotone"
              dataKey="Cumulative Interest"
              stroke="#f59e0b"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#interestGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
