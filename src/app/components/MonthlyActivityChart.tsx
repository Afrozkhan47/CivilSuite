'use client';

import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { SavedProject } from '@/features/mix-design/types';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl shadow-card-md px-3 py-2.5">
      <p className="text-sm font-bold text-foreground">{label}</p>
      <p className="text-xs text-accent font-medium mt-0.5">{payload[0].value} design{payload[0].value !== 1 ? 's' : ''}</p>
    </div>
  );
}

interface MonthlyActivityChartProps {
  projects: SavedProject[];
}

export default function MonthlyActivityChart({ projects }: MonthlyActivityChartProps) {
  const monthlyData = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach((p) => {
      try {
        const d = new Date(p.createdAt);
        const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        counts[key] = (counts[key] ?? 0) + 1;
      } catch {
        // skip invalid dates
      }
    });
    // Get last 6 months
    const result: { month: string; designs: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const shortKey = d.toLocaleDateString('en-US', { month: 'short' });
      result.push({ month: shortKey, designs: counts[key] ?? 0 });
    }
    return result;
  }, [projects]);

  const hasData = monthlyData.some((d) => d.designs > 0);

  if (!hasData) {
    return (
      <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground">
        No data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.2} />
            <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="month"
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
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="designs"
          stroke="var(--accent)"
          strokeWidth={2.5}
          fill="url(#activityGradient)"
          dot={{ fill: 'var(--accent)', r: 4, strokeWidth: 2, stroke: 'var(--card)' }}
          activeDot={{ r: 6, strokeWidth: 2, stroke: 'var(--card)' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}