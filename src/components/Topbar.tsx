'use client';

import React from 'react';
import { Menu, Search, BookOpen, Bell } from 'lucide-react';

interface TopbarProps {
  onMobileMenuOpen: () => void;
}

export default function Topbar({ onMobileMenuOpen }: TopbarProps) {
  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6 flex-shrink-0 z-20">
      {/* Mobile menu toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuOpen}
          className="p-1.5 rounded text-muted-foreground hover:bg-muted lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>

        {/* Technical Standard Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-muted/60 border border-border text-xs">
          <BookOpen size={13} className="text-primary" />
          <span className="font-mono-tech font-semibold text-foreground">IS 10262:2019</span>
          <span className="text-border">|</span>
          <span className="text-muted-foreground font-mono-tech">IS 456:2000</span>
        </div>
      </div>

      {/* Quick Search Input */}
      <div className="hidden md:flex items-center gap-2 w-72 px-3 py-1.5 rounded bg-muted/50 border border-border text-xs text-muted-foreground">
        <Search size={14} className="flex-shrink-0 text-muted-foreground" />
        <span className="flex-1">Search mix designs, projects...</span>
        <kbd className="text-[10px] bg-card border border-border px-1.5 py-0.5 rounded font-mono text-muted-foreground">
          ⌘K
        </kbd>
      </div>

      {/* Right User Status */}
      <div className="flex items-center gap-3">
        <button className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted relative">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-secondary rounded-full" />
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-border">
          <div className="w-7 h-7 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
            SS
          </div>
          <div className="hidden sm:block text-left leading-tight">
            <p className="text-xs font-semibold text-foreground">Sudies Shaikh</p>
            <p className="text-[10px] text-muted-foreground font-mono-tech">Consulting Engineer</p>
          </div>
        </div>
      </div>
    </header>
  );
}