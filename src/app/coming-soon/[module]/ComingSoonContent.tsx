'use client';

import React from 'react';
import Link from 'next/link';
import {
  Calculator,
  Box,
  DollarSign,
  ClipboardList,
  ArrowLeftRight,
  FileText,
  Settings,
  ArrowLeft,
  Clock,
  CheckCircle2,
  Circle,
} from 'lucide-react';


interface ModuleInfo {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  color: string;
  iconBg: string;
  features: string[];
  roadmap: { phase: string; items: string[]; status: 'done' | 'active' | 'planned' }[];
  isCodeRef?: string;
}

const MODULE_MAP: Record<string, ModuleInfo> = {
  'material-calculator': {
    title: 'Material Calculator',
    description:
      'Calculate exact material quantities required for any concrete volume using your saved mix design proportions. Supports beams, columns, slabs, footings, and custom volumes.',
    icon: Calculator,
    color: 'text-primary',
    iconBg: 'bg-primary/10',
    isCodeRef: 'IS 10262:2019',
    features: [
      'Input concrete volume (m³) or structural dimensions',
      'Auto-fetch proportions from saved mix designs',
      'Output: Cement bags, sand (m³), aggregate (m³), water (litres)',
      'Wastage factor adjustment (5–15%)',
      'Export material schedule as PDF',
      'Batch size calculator for site use',
    ],
    roadmap: [
      { phase: 'Phase 1 — Core Engine', items: ['Volume input forms', 'Material quantity formulas', 'Unit conversions'], status: 'planned' },
      { phase: 'Phase 2 — Integration', items: ['Link to saved mix designs', 'Wastage factor settings', 'Batch calculator'], status: 'planned' },
      { phase: 'Phase 3 — Export', items: ['PDF material schedule', 'CSV export', 'Print layout'], status: 'planned' },
    ],
  },
  'volume-calculator': {
    title: 'Volume Calculator',
    description:
      'Calculate concrete volumes for standard structural elements. Supports beams, columns, slabs, footings, and custom shapes with automatic unit conversion.',
    icon: Box,
    color: 'text-accent',
    iconBg: 'bg-accent/10',
    features: [
      'Beam volume: L × B × D',
      'Column volume: L × B × H (rectangular) or π r² H (circular)',
      'Slab volume: L × B × t',
      'Footing volume: isolated, combined, raft',
      'Custom shape volume input',
      'Cumulative volume for multiple elements',
    ],
    roadmap: [
      { phase: 'Phase 1 — Shapes', items: ['Beam, column, slab forms', 'Footing types', 'Custom volume'], status: 'planned' },
      { phase: 'Phase 2 — Features', items: ['Multiple element list', 'Unit toggle (m³ / cft)', 'Save calculations'], status: 'planned' },
    ],
  },
  'cost-estimator': {
    title: 'Cost Estimator',
    description:
      'Estimate concrete material costs per cubic metre based on current market rates. Supports custom rate entry, regional presets, and detailed cost breakdown reports.',
    icon: DollarSign,
    color: 'text-warning',
    iconBg: 'bg-warning/10',
    features: [
      'Enter current market rates for cement, sand, aggregate, water',
      'Cost per m³ calculation from mix proportions',
      'Total project cost for given volume',
      'Material-wise cost breakdown chart',
      'Labour and equipment cost add-ons',
      'Export cost report as PDF',
    ],
    roadmap: [
      { phase: 'Phase 1 — Rate Input', items: ['Material rate form', 'Regional presets', 'Rate history'], status: 'planned' },
      { phase: 'Phase 2 — Calculation', items: ['Cost per m³ engine', 'Total cost for volume', 'Breakdown chart'], status: 'planned' },
      { phase: 'Phase 3 — Reports', items: ['Cost report PDF', 'Comparison between mixes', 'Export CSV'], status: 'planned' },
    ],
  },
  'cube-strength': {
    title: 'Cube Strength Record',
    description:
      'Maintain a complete digital record of concrete cube test results. Track casting dates, test ages, compressive strengths, and generate compliance reports per IS 456:2000.',
    icon: ClipboardList,
    color: 'text-info',
    iconBg: 'bg-info/10',
    isCodeRef: 'IS 456:2000 Cl. 15',
    features: [
      'Record cube number, casting date, test date, age, strength',
      'Automatic age calculation (7-day, 28-day)',
      'Average strength and standard deviation',
      'IS 456:2000 acceptance criteria check',
      'Strength vs. age chart (Recharts)',
      'Link records to saved mix design projects',
    ],
    roadmap: [
      { phase: 'Phase 1 — Data Entry', items: ['Cube record form', 'Batch management', 'Local storage persistence'], status: 'planned' },
      { phase: 'Phase 2 — Analysis', items: ['Strength charts', 'IS 456 compliance check', 'Statistical summary'], status: 'planned' },
      { phase: 'Phase 3 — Reports', items: ['Test report PDF', 'Export to CSV', 'Project linkage'], status: 'planned' },
    ],
  },
  'unit-converter': {
    title: 'Unit Converter',
    description:
      'Convert between engineering units used in civil engineering calculations. Covers length, area, volume, mass, pressure, strength, and density with instant results.',
    icon: ArrowLeftRight,
    color: 'text-secondary',
    iconBg: 'bg-muted',
    features: [
      'Length: mm, cm, m, ft, inch',
      'Area: mm², cm², m², ft²',
      'Volume: mm³, cm³, m³, litre, cft',
      'Mass: g, kg, tonne, lb',
      'Pressure / Strength: Pa, kPa, MPa, N/mm², psi, kgf/cm²',
      'Density: kg/m³, g/cm³, lb/ft³',
    ],
    roadmap: [
      { phase: 'Phase 1 — Core', items: ['All unit categories', 'Instant conversion', 'Swap button'], status: 'planned' },
      { phase: 'Phase 2 — UX', items: ['Conversion history', 'Favourite conversions', 'Keyboard shortcuts'], status: 'planned' },
    ],
  },
  reports: {
    title: 'Reports',
    description:
      'Generate, manage, and export professional engineering reports for all your saved mix design projects. Includes IS code references, calculation steps, and engineer sign-off.',
    icon: FileText,
    color: 'text-primary',
    iconBg: 'bg-primary/10',
    features: [
      'List all saved project reports',
      'Bulk PDF export for multiple projects',
      'Report templates (standard, detailed, summary)',
      'IS code clause references in every report',
      'Engineer name, company, date, signature area',
      'Print-friendly multi-page layout',
    ],
    roadmap: [
      { phase: 'Phase 1 — Report List', items: ['Project report index', 'Filter and search', 'Status indicators'], status: 'planned' },
      { phase: 'Phase 2 — Templates', items: ['Standard template', 'Detailed template', 'Summary template'], status: 'planned' },
      { phase: 'Phase 3 — Export', items: ['Bulk PDF export', 'Email sharing', 'Cloud backup'], status: 'planned' },
    ],
  },
  settings: {
    title: 'Settings',
    description:
      'Customise CivilSuite to match your workflow. Configure default engineer details, company information, unit preferences, PDF layout, and application theme.',
    icon: Settings,
    color: 'text-muted-foreground',
    iconBg: 'bg-muted',
    features: [
      'Default engineer name and designation',
      'Company name and logo for PDF reports',
      'Unit system preference (SI / FPS)',
      'PDF page size and margin settings',
      'Light / Dark theme toggle',
      'Data export and import (JSON backup)',
    ],
    roadmap: [
      { phase: 'Phase 1 — Profile', items: ['Engineer details form', 'Company info', 'Logo upload'], status: 'planned' },
      { phase: 'Phase 2 — Preferences', items: ['Unit system', 'Theme toggle', 'PDF settings'], status: 'planned' },
      { phase: 'Phase 3 — Data', items: ['Export all data', 'Import backup', 'Clear data'], status: 'planned' },
    ],
  },
};

const DEFAULT_MODULE: ModuleInfo = {
  title: 'Module Coming Soon',
  description: 'This module is planned for a future release of CivilSuite.',
  icon: Clock,
  color: 'text-muted-foreground',
  iconBg: 'bg-muted',
  features: ['Full feature set to be announced'],
  roadmap: [{ phase: 'Phase 1', items: ['Under planning'], status: 'planned' }],
};

interface ComingSoonContentProps {
  moduleSlug: string;
}

export default function ComingSoonContent({ moduleSlug }: ComingSoonContentProps) {
  const info = MODULE_MAP[moduleSlug] ?? DEFAULT_MODULE;
  const Icon = info.icon;

  const statusIcon = (status: 'done' | 'active' | 'planned') => {
    if (status === 'done') return <CheckCircle2 size={14} className="text-success flex-shrink-0 mt-0.5" />;
    if (status === 'active') return <div className="w-3.5 h-3.5 rounded-full border-2 border-primary bg-primary/20 flex-shrink-0 mt-0.5" />;
    return <Circle size={14} className="text-border flex-shrink-0 mt-0.5" />;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={15} />
        Back to Dashboard
      </Link>

      {/* Hero */}
      <div className="card-base text-center py-12 px-6">
        <div className={`w-16 h-16 rounded-2xl ${info.iconBg} flex items-center justify-center mx-auto mb-5`}>
          <Icon size={32} className={info.color} />
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/10 border border-warning/20 text-warning text-xs font-semibold mb-4">
          <Clock size={12} />
          Planned for Future Release
        </div>
        <h1 className="text-3xl font-extrabold text-foreground mb-3">{info.title}</h1>
        <p className="text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
          {info.description}
        </p>
        {info.isCodeRef && (
          <p className="text-xs text-muted-foreground/70 mt-3 font-mono">
            Reference: {info.isCodeRef}
          </p>
        )}
      </div>

      {/* Expected Features */}
      <div className="card-base">
        <h2 className="section-header mb-4">Expected Functionality</h2>
        <ul className="space-y-2.5">
          {info.features.map((feature, i) => (
            <li key={`feature-${i}`} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary text-xs font-bold">{i + 1}</span>
              </div>
              <span className="text-sm text-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Roadmap */}
      <div className="card-base">
        <h2 className="section-header mb-5">Development Roadmap</h2>
        <div className="space-y-5">
          {info.roadmap.map((phase, pi) => (
            <div key={`phase-${pi}`} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  phase.status === 'done'
                    ? 'bg-success text-white'
                    : phase.status === 'active' ?'bg-primary text-primary-foreground' :'bg-muted text-muted-foreground border border-border'
                }`}>
                  {pi + 1}
                </div>
                {pi < info.roadmap.length - 1 && (
                  <div className="w-px flex-1 bg-border mt-2" />
                )}
              </div>
              <div className="flex-1 pb-5">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-bold text-foreground">{phase.phase}</h3>
                  {phase.status === 'done' && (
                    <span className="text-xs text-success bg-success/10 px-2 py-0.5 rounded-full font-medium">Complete</span>
                  )}
                  {phase.status === 'active' && (
                    <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full font-medium">In Progress</span>
                  )}
                  {phase.status === 'planned' && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">Planned</span>
                  )}
                </div>
                <ul className="space-y-1.5">
                  {phase.items.map((item, ii) => (
                    <li key={`item-${pi}-${ii}`} className="flex items-start gap-2">
                      {statusIcon(phase.status)}
                      <span className="text-xs text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="card-base bg-primary/5 border-primary/20 text-center py-8">
        <p className="text-sm font-semibold text-foreground mb-1">
          Ready to use what&apos;s available now?
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          The Concrete Mix Design module (IS 10262:2019) is fully functional.
        </p>
        <Link href="/concrete-mix-design" className="btn-primary inline-flex items-center gap-2">
          Start New Mix Design
        </Link>
      </div>
    </div>
  );
}
