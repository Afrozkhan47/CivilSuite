import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Clock } from 'lucide-react';


type BadgeVariant =
  | 'success' |'error' |'warning' |'pending' |'info' |'draft' |'calculated' |'validated' |'saved' |'exported';

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  success: 'bg-success/10 text-success border border-success/20',
  error: 'bg-error/10 text-error border border-error/20',
  warning: 'bg-warning/10 text-warning border border-warning/20',
  pending: 'bg-muted text-muted-foreground border border-border',
  info: 'bg-info/10 text-info border border-info/20',
  draft: 'bg-muted text-muted-foreground border border-border',
  calculated: 'bg-info/10 text-info border border-info/20',
  validated: 'bg-success/10 text-success border border-success/20',
  saved: 'bg-accent/10 text-accent border border-accent/20',
  exported: 'bg-primary/10 text-primary border border-primary/20',
};

const VARIANT_ICONS: Partial<Record<BadgeVariant, React.ComponentType<{ size?: number }>>> = {
  success: CheckCircle2,
  validated: CheckCircle2,
  saved: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  pending: Clock,
  draft: Clock,
};

interface StatusBadgeProps {
  variant: BadgeVariant;
  label: string;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

export default function StatusBadge({
  variant,
  label,
  showIcon = true,
  size = 'sm',
}: StatusBadgeProps) {
  const Icon = VARIANT_ICONS[variant];
  return (
    <span
      className={`status-badge ${VARIANT_STYLES[variant]} ${
        size === 'md' ? 'px-3 py-1 text-sm' : ''
      }`}
    >
      {showIcon && Icon && <Icon size={size === 'md' ? 14 : 12} />}
      {label}
    </span>
  );
}