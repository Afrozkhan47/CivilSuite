'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Home, FlaskConical } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-sm bg-primary/10 flex items-center justify-center border border-primary/20">
            <FlaskConical size={32} className="text-primary" />
          </div>
        </div>

        <h1 className="text-5xl font-extrabold text-primary/30 mb-2 font-mono-tech">404</h1>
        <h2 className="text-xl font-bold text-foreground mb-2">Page Not Found</h2>
        <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
          The requested page or route could not be found in CivilSuite workspace.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center font-mono-tech">
          <Link
            href="/"
            className="btn-primary inline-flex items-center justify-center gap-2 text-xs py-2 px-4"
          >
            <Home size={14} />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/concrete-mix-design"
            className="btn-secondary inline-flex items-center justify-center gap-2 text-xs py-2 px-4"
          >
            <ArrowLeft size={14} />
            <span>New Mix Design</span>
          </Link>
        </div>
      </div>
    </div>
  );
}