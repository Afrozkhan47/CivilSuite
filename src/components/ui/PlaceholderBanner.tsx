import React from 'react';
import { FlaskConical } from 'lucide-react';

interface PlaceholderBannerProps {
  message?: string;
  compact?: boolean;
}

export default function PlaceholderBanner({
  message = 'Calculation engine pending IS 10262:2019 formula implementation. Results shown are structural placeholders only.',
  compact = false,
}: PlaceholderBannerProps) {
  return (
    <div
      className={`flex items-start gap-3 rounded-sm border border-warning/30 bg-warning/8 ${
        compact ? 'p-3' : 'p-4'
      }`}
    >
      <FlaskConical
        size={compact ? 16 : 18}
        className="text-warning flex-shrink-0 mt-0.5"
      />
      <div>
        <p className={`font-semibold text-warning ${compact ? 'text-xs' : 'text-sm'}`}>
          Calculation Engine — Placeholder Mode
        </p>
        <p className={`text-warning/80 mt-0.5 ${compact ? 'text-xs' : 'text-sm'}`}>
          {message}
        </p>
      </div>
    </div>
  );
}