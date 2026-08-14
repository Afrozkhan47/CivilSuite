'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Home, FlaskConical } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <FlaskConical size={40} className="text-primary" />
          </div>
        </div>

        <h1 className="text-6xl font-extrabold text-primary/20 mb-2">404</h1>
        <h2 className="text-2xl font-bold text-foreground mb-2">Page Not Found</h2>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Let&apos;s get you back to CivilSuite.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors duration-200"
          >
            <Home size={16} />
            Go to Dashboard
          </Link>
          <Link
            href="/concrete-mix-design"
            className="inline-flex items-center justify-center gap-2 border border-border bg-card text-foreground px-6 py-3 rounded-xl font-semibold hover:bg-muted transition-colors duration-200"
          >
            <ArrowLeft size={16} />
            New Mix Design
          </Link>
        </div>
      </div>
    </div>
  );
}