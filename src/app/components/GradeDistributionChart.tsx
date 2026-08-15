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
import type { SavedProject } from '@/features/mix-design/types';

const BAR_COLORS = ['#94a3b8', '#64748b', '#1e3a5f', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2'];

const ALL_GRADES = ['M10', 'M15', 'M20', 'M25', 'M30', 'M35', 'M40', 'M45', 'M50', 'M55', 'M60', 'M65', 'M70', 'M75', 'M80'];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-sm shadow-card-md px-3 py-2.5 font-mono-tech">
      <p className="text-xs font-bold text-foreground">{label}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">
        {payload[0].value} project{payload[0].value !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

interface GradeDistributionChartProps {
  projects: SavedProject[];
}

export default function GradeDistributionChart({ projects }: GradeDistributionChartProps) {
  const gradeData = ALL_GRADES.map((grade) => ({
    grade,
    count: projects.filter((p) => p.input.designParameters.concreteGrade === grade).length,
  })).filter((d) => d.count > 0);

  if (gradeData.length === 0) {
    return (
      <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground">
        No data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={gradeData} barSize={28} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="grade"
          tick={{ fontSize: 12, fill: 'var(--muted-foreground)', fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--muted)', radius: 4 }} />
        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
          {gradeData.map((entry, index) => (
            <Cell key={`grade-cell-${entry.grade}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}