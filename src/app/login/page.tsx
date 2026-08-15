'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import AppLogo from '@/components/ui/AppLogo';
import { ArrowLeft, ShieldCheck, Database, KeyRound } from 'lucide-react';

export default function LoginPage() {
  const { signInWithGoogle, user, signOut, isConfigured } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 md:p-8">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between max-w-5xl mx-auto w-full">
        <AppLogo />
        <Link href="/" className="btn-secondary text-xs flex items-center gap-1.5 font-mono-tech">
          <ArrowLeft size={14} />
          <span>Back to Application</span>
        </Link>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-auto space-y-6">
        <div className="bg-card border border-border rounded-lg p-8 shadow-lg space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight font-mono-tech">
              CivilSuite Portal
            </h1>
            <p className="text-xs text-muted-foreground">
              IS 10262:2019 & IS 456:2000 Concrete Mix Design Platform
            </p>
          </div>

          {!isConfigured && (
            <div className="p-3.5 rounded bg-warning/10 border border-warning/30 text-left space-y-1 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-warning font-mono-tech">
                <KeyRound size={14} />
                <span>Supabase Configuration Required</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Copy <code className="bg-muted px-1 py-0.5 rounded text-foreground font-mono">.env.example</code> to{' '}
                <code className="bg-muted px-1 py-0.5 rounded text-foreground font-mono">.env.local</code> and provide your Supabase URL & publishable key to complete live authentication.
              </p>
            </div>
          )}

          {user ? (
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded bg-muted/40 border border-border space-y-2 text-left">
                <p className="text-[10px] text-muted-foreground uppercase font-mono-tech tracking-wider">
                  Signed in as
                </p>
                <p className="text-sm font-semibold text-foreground truncate">{user.email}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Link href="/saved-projects" className="btn-primary w-full text-center text-xs py-2 font-bold">
                  Go to Project History
                </Link>
                <button onClick={signOut} className="btn-secondary w-full text-xs py-2">
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <button
                onClick={signInWithGoogle}
                className="w-full flex items-center justify-center gap-3 bg-white text-slate-800 hover:bg-slate-100 border border-slate-300 rounded px-4 py-2.5 text-xs font-bold transition-all shadow-xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="pt-4 border-t border-border/60 text-left space-y-2">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <ShieldCheck size={14} className="text-primary flex-shrink-0" />
                  <span>PostgreSQL Row Level Security (RLS) Enabled</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Database size={14} className="text-primary flex-shrink-0" />
                  <span>Isolated multi-tenant cloud project history</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-muted-foreground font-mono-tech max-w-5xl mx-auto w-full">
        CivilSuite © 2026 — Concrete Engineering Calculation Platform
      </div>
    </div>
  );
}
