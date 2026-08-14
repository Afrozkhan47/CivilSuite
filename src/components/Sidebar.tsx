'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import {
  FlaskConical,
  FolderOpen,
  FileText,
  Plus,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Settings,
  HelpCircle,
  Calculator,
  Lock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onCollapse: () => void;
  onMobileClose: () => void;
  activeRoute: string;
}

export default function Sidebar({
  collapsed,
  mobileOpen,
  onCollapse,
  onMobileClose,
  activeRoute,
}: SidebarProps) {
  const [showModules, setShowModules] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return activeRoute === '/';
    return activeRoute.startsWith(href);
  };

  const navClass = (href: string) => `
    flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-all duration-150
    ${isActive(href)
      ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    }
  `;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`
          hidden lg:flex flex-col bg-card border-r border-border sidebar-transition z-30
          ${collapsed ? 'w-16' : 'w-[250px]'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo & Brand Header */}
          <div className="h-14 flex items-center justify-between px-4 border-b border-border">
            <AppLogo collapsed={collapsed} />
            <button
              onClick={onCollapse}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-6">
            {/* WORKSPACE */}
            <div>
              {!collapsed && (
                <p className="px-3 text-[10px] font-bold text-muted-foreground tracking-widest uppercase mb-2">
                  Workspace
                </p>
              )}
              <div className="space-y-1">
                <Link
                  href="/concrete-mix-design"
                  className={navClass('/concrete-mix-design')}
                  title={collapsed ? 'New Mix Design' : undefined}
                >
                  <Plus size={15} className="flex-shrink-0" />
                  {!collapsed && <span>New Mix Design</span>}
                </Link>
                <Link
                  href="/saved-projects"
                  className={navClass('/saved-projects')}
                  title={collapsed ? 'Saved Projects' : undefined}
                >
                  <FolderOpen size={15} className="flex-shrink-0" />
                  {!collapsed && <span>Saved Projects</span>}
                </Link>
                <Link
                  href="/reports"
                  className={navClass('/reports')}
                  title={collapsed ? 'Reports' : undefined}
                >
                  <FileText size={15} className="flex-shrink-0" />
                  {!collapsed && <span>Reports</span>}
                </Link>
              </div>
            </div>

            {/* ENGINEERING */}
            <div>
              {!collapsed && (
                <p className="px-3 text-[10px] font-bold text-muted-foreground tracking-widest uppercase mb-2">
                  Engineering
                </p>
              )}
              <div className="space-y-1">
                <Link
                  href="/mix-design-results"
                  className={navClass('/mix-design-results')}
                  title={collapsed ? 'Mix Design Calculation' : undefined}
                >
                  <FlaskConical size={15} className="flex-shrink-0" />
                  {!collapsed && <span>Mix Design Results</span>}
                </Link>
                <Link
                  href="/"
                  className={navClass('/')}
                  title={collapsed ? 'Standards Compliance' : undefined}
                >
                  <BookOpen size={15} className="flex-shrink-0" />
                  {!collapsed && <span>IS 10262:2019 Standards</span>}
                </Link>
              </div>
            </div>

            {/* SYSTEM */}
            {!collapsed && (
              <div>
                <p className="px-3 text-[10px] font-bold text-muted-foreground tracking-widest uppercase mb-2">
                  System
                </p>
                <div className="space-y-1">
                  <div
                    onClick={() => setShowModules(!showModules)}
                    className="flex items-center justify-between px-3 py-2 rounded text-xs font-medium text-muted-foreground/60 cursor-pointer hover:text-muted-foreground hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Calculator size={15} />
                      <span>Modules</span>
                    </div>
                    {showModules ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </div>

                  {showModules && (
                    <div className="pl-6 space-y-1 text-xs text-muted-foreground/50">
                      <div className="flex items-center justify-between py-1 px-2">
                        <span>Material Calculator</span>
                        <Lock size={10} />
                      </div>
                      <div className="flex items-center justify-between py-1 px-2">
                        <span>Volume Estimator</span>
                        <Lock size={10} />
                      </div>
                    </div>
                  )}

                  <Link
                    href="/coming-soon/settings"
                    className={navClass('/coming-soon/settings')}
                  >
                    <Settings size={15} className="flex-shrink-0" />
                    <span>Settings</span>
                  </Link>
                  <Link
                    href="/coming-soon/help"
                    className={navClass('/coming-soon/help')}
                  >
                    <HelpCircle size={15} className="flex-shrink-0" />
                    <span>Help & Docs</span>
                  </Link>
                </div>
              </div>
            )}
          </nav>

          {/* User profile footer */}
          {!collapsed && (
            <div className="p-3 border-t border-border bg-muted/20">
              <div className="flex items-center gap-2.5 px-2 py-1.5 rounded">
                <div className="w-7 h-7 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                  CE
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">Sudies Shaikh</p>
                  <p className="text-[10px] text-muted-foreground truncate">Civil Engineer</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Drawer */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border
          flex flex-col lg:hidden sidebar-transition
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="h-14 flex items-center justify-between px-4 border-b border-border">
          <AppLogo />
          <button onClick={onMobileClose} className="p-1 rounded text-muted-foreground hover:bg-muted">
            <ChevronLeft size={16} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-4">
          <Link href="/concrete-mix-design" onClick={onMobileClose} className={navClass('/concrete-mix-design')}>
            <Plus size={16} />
            <span>New Mix Design</span>
          </Link>
          <Link href="/saved-projects" onClick={onMobileClose} className={navClass('/saved-projects')}>
            <FolderOpen size={16} />
            <span>Saved Projects</span>
          </Link>
          <Link href="/reports" onClick={onMobileClose} className={navClass('/reports')}>
            <FileText size={16} />
            <span>Reports</span>
          </Link>
          <Link href="/mix-design-results" onClick={onMobileClose} className={navClass('/mix-design-results')}>
            <FlaskConical size={16} />
            <span>Mix Design Results</span>
          </Link>
        </nav>
      </aside>
    </>
  );
}