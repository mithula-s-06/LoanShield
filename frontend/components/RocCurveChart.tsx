'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { SingleModelMetrics } from '@/lib/types';

interface RocCurveChartProps {
  models: Record<string, SingleModelMetrics>;
}

export const RocCurveChart: React.FC<RocCurveChartProps> = ({ models = {} }) => {
  // Combine ROC curves into unified dataset
  const pointsCount = 35;
  const chartData = [];

  const modelKeys = Object.keys(models);
  const colors: Record<string, string> = {
    logistic_regression: '#0284c7', // sky
    decision_tree: '#f59e0b', // amber
    random_forest: '#10b981', // emerald
    xgboost: '#6366f1', // indigo
  };

  for (let i = 0; i <= pointsCount; i++) {
    const fraction = i / pointsCount;
    const row: any = {
      fpr: Math.round(fraction * 100) / 100,
      baseline: fraction,
    };

    modelKeys.forEach((key) => {
      const roc = models[key]?.roc_curve || [];
      // Find closest point in roc
      if (roc.length > 0) {
        const closest = roc.reduce((prev, curr) =>
          Math.abs(curr.fpr - fraction) < Math.abs(prev.fpr - fraction) ? curr : prev
        );
        row[key] = closest.tpr;
      }
    });

    chartData.push(row);
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
      <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Receiver Operating Characteristic (ROC) Curves</h3>
          <p className="text-xs text-slate-500">True Positive Rate vs. False Positive Rate across classification thresholds</p>
        </div>
      </div>

      <div className="h-80 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="fpr"
              type="number"
              domain={[0, 1]}
              tick={{ fontSize: 11, fill: '#64748b' }}
              label={{ value: 'False Positive Rate (1 - Specificity)', position: 'insideBottom', offset: -5, fontSize: 11, fill: '#64748b' }}
            />
            <YAxis
              type="number"
              domain={[0, 1]}
              tick={{ fontSize: 11, fill: '#64748b' }}
              label={{ value: 'True Positive Rate (Sensitivity)', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: '#64748b' }}
            />
            <Tooltip
              formatter={(val: any, name: any) => [
                typeof val === 'number' ? val.toFixed(3) : val,
                models[name]?.model_name || name,
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
              formatter={(value) => {
                if (value === 'baseline') return 'Random Chance (AUC = 0.50)';
                const m = models[value];
                return m ? `${m.model_name} (AUC = ${m.roc_auc.toFixed(3)})` : value;
              }}
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
            />

            {/* Diagonal baseline */}
            <Line
              type="monotone"
              dataKey="baseline"
              stroke="#cbd5e1"
              strokeDasharray="4 4"
              dot={false}
              isAnimationActive={false}
            />

            {/* Model lines */}
            {modelKeys.map((key) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[key] || '#6366f1'}
                strokeWidth={2.5}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
