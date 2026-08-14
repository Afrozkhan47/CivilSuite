import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: number; // positive = up, negative = down
  trendLabel?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  className?: string;
  highlight?: 'positive' | 'negative' | 'warning' | 'neutral';
}

export default function MetricCard({
  label,
  value,
  unit,
  trend,
  trendLabel,
  icon,
  iconBg = 'bg-primary/10',
  className = '',
  highlight,
}: MetricCardProps) {
  const highlightStyle =
    highlight === 'positive' ?'border-success/30 bg-success/3'
      : highlight === 'negative' ?'border-error/30 bg-error/3'
      : highlight === 'warning' ?'border-warning/30 bg-warning/3' :'';

  const trendColor =
    trend === undefined || trend === 0
      ? 'text-muted-foreground'
      : trend > 0
      ? 'text-success' :'text-error';

  const TrendIcon =
    trend === undefined || trend === 0 ? Minus : trend > 0 ? TrendingUp : TrendingDown;

  return (
    <div className={`card-base card-hover ${highlightStyle} ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="metric-label mb-2">{label}</p>
          <div className="flex items-baseline gap-1.5">
            <span className="metric-value font-tabular">{value}</span>
            {unit && <span className="text-sm text-muted-foreground font-medium">{unit}</span>}
          </div>
          {(trend !== undefined || trendLabel) && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trendColor}`}>
              <TrendIcon size={13} />
              <span>{trendLabel ?? `${trend && trend > 0 ? '+' : ''}${trend}`}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}