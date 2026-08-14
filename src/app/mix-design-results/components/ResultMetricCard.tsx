'use client';

import React from 'react';

interface ResultMetricCardProps {
  label: string;
  value: number | string | null;
  unit: string;
  color?: string;
  icon?: React.ReactNode;
  isPlaceholder?: boolean;
  isCodeRef?: string;
}

export default function ResultMetricCard({
  label,
  value,
  unit,
  isPlaceholder = false,
  isCodeRef,
}: ResultMetricCardProps) {
  const displayVal =
    value === null || isPlaceholder
      ? '—'
      : typeof value === 'number'
      ? value.toLocaleString('en-IN', { maximumFractionDigits: 2 })
      : value;

  return (
    <div className="card-base p-4 border-border bg-card flex flex-col justify-between space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
        {isCodeRef && <span className="font-mono-tech text-[10px] text-primary">{isCodeRef}</span>}
      </div>

      <div className="flex items-baseline gap-1.5 pt-1">
        <span className="text-2xl font-bold font-mono-tech text-foreground tracking-tight">
          {displayVal}
        </span>
        {unit && !isPlaceholder && displayVal !== '—' && (
          <span className="text-xs font-mono-tech text-muted-foreground">{unit}</span>
        )}
      </div>
    </div>
  );
}