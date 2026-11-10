'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { RiskDistribution } from '@/lib/types';

interface RiskDistributionChartProps {
  distribution: RiskDistribution;
}

export const RiskDistributionChart: React.FC<RiskDistributionChartProps> = ({ distribution }) => {
  const data = [
    { name: 'Low Risk', value: distribution?.low || 0, color: '#10b981' },
    { name: 'Medium Risk', value: distribution?.medium || 0, color: '#f59e0b' },
    { name: 'High Risk', value: distribution?.high || 0, color: '#f43f5e' },
  ];

  const total = (distribution?.low || 0) + (distribution?.medium || 0) + (distribution?.high || 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
      <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Portfolio Risk Distribution</h3>
          <p className="text-xs text-slate-500">Applicant breakdown across risk bands</p>
        </div>
        <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
          {total} Total
        </span>
      </div>

      <div className="h-64 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any, name: any) => [
                `${value} applicants (${total > 0 ? ((Number(value) / total) * 100).toFixed(1) : 0}%)`,
                name,
              ]}
              contentStyle={{
                backgroundColor: '#0f172a',
                borderRadius: '8px',
                border: 'none',
                color: '#fff',
                fontSize: '12px',
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label in donut */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
          <span className="text-2xl font-black text-slate-900 font-mono">{total}</span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Loans</span>
        </div>
      </div>
    </div>
  );
};
