'use client';

import React, { memo } from 'react';

interface AppLogoProps {
  collapsed?: boolean;
  className?: string;
  onClick?: () => void;
}

const AppLogo = memo(function AppLogo({
  collapsed = false,
  className = '',
  onClick,
}: AppLogoProps) {
  return (
    <div
      className={`flex items-center gap-2.5 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {/* Structural Engineering Grid Mark */}
      <div className="w-7 h-7 rounded bg-primary flex items-center justify-center flex-shrink-0 shadow-sm">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-primary-foreground">
          <rect x="3" y="3" width="18" height="18" rx="1" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="3" y1="15" x2="21" y2="15" />
          <line x1="9" y1="3" x2="9" y2="21" />
          <line x1="15" y1="3" x2="15" y2="21" />
        </svg>
      </div>

      {!collapsed && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1">
            <span className="font-extrabold text-sm tracking-tight text-foreground">CIVIL</span>
            <span className="text-border font-light text-sm">|</span>
            <span className="font-medium text-sm tracking-tight text-primary">SUITE</span>
          </div>
          <span className="text-[9px] font-semibold tracking-widest text-muted-foreground uppercase mt-0.5">
            CONCRETE ENGINE
          </span>
        </div>
      )}
    </div>
  );
});

export default AppLogo;
