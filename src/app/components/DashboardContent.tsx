'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  FolderOpen,
  Plus,
  AlertTriangle,
  BookOpen,
  ChevronRight,
  Calculator,
  FileCheck,
} from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import GradeDistributionChart from './GradeDistributionChart';
import { useProjectStore } from '@/store/useProjectStore';
import type { SavedProject } from '@/features/mix-design/types';
import { getCentralizedMixStatus } from '@/features/mix-design/utils/status';

export default function DashboardContent() {
  const { projects } = useProjectStore();

  const stats = useMemo(() => {
    const total = projects.length;
    const calculated = projects.filter((p) => p.result && !p.result.isPlaceholder).length;
    const compliant = projects.filter(
      (p) =>
        p.result &&
        p.result.cementContentCheck !== 'fail' &&
        p.result.durabilityCheck !== 'fail' &&
        p.result.strengthCheck !== 'fail'
    ).length;
    return { total, calculated, compliant };
  }, [projects]);

  const recentProjects = useMemo(() => projects.slice(0, 6), [projects]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─── TECHNICAL HERO BANNER ────────────────────────────────────────── */}
      <div className="p-6 md:p-8 rounded bg-card border border-border space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold font-mono-tech uppercase tracking-wider">
              <BookOpen size={12} />
              <span>IS 10262:2019 / IS 456:2000 Structural Engine</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
              CivilSuite Concrete Mix Design Workspace
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
              Standardized concrete proportioning engine adhering strictly to Indian Standard IS 10262:2019 and IS 456:2000 durability specifications.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
            <Link href="/concrete-mix-design" className="btn-primary flex items-center gap-2">
              <Plus size={14} />
              <span>New Mix Design</span>
            </Link>
            <Link href="/saved-projects" className="btn-secondary flex items-center gap-2">
              <FolderOpen size={14} />
              <span>Project History</span>
            </Link>
          </div>
        </div>

        {/* Technical Data Bar */}
        <div className="grid grid-cols-3 gap-4 pt-3 border-t border-border/60 text-xs font-mono-tech">
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-widest">Total Projects</span>
            <span className="font-extrabold text-lg text-foreground">{stats.total}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-widest">Calculated Mixes</span>
            <span className="font-extrabold text-lg text-primary">{stats.calculated}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-widest">IS Compliant</span>
            <span className="font-extrabold text-lg text-success">{stats.compliant}</span>
          </div>
        </div>
      </div>

      {/* ─── MAIN LEDGER & STANDARDS INDEX GRID ───────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Active Mix Calculations Ledger (2/3 width) */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div>
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Recent Mix Design Project History
              </h2>
              <p className="text-xs text-muted-foreground">
                IS 10262 proportioning traces and field batch specifications
              </p>
            </div>
            {projects.length > 0 && (
              <Link href="/saved-projects" className="text-xs text-primary font-bold flex items-center gap-1 hover:underline font-mono-tech">
                <span>View Full History</span>
                <ChevronRight size={13} />
              </Link>
            )}
          </div>

          {recentProjects.length === 0 ? (
            <div className="p-8 text-center rounded border border-dashed border-border bg-card space-y-3">
              <Calculator size={32} className="mx-auto text-muted-foreground/50" />
              <div>
                <p className="font-bold text-sm text-foreground">No Mix Design Runs Executed Yet</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Launch the 4-step wizard to proportion M10–M80 structural concrete mixes per IS 10262:2019.
                </p>
              </div>
              <Link href="/concrete-mix-design" className="btn-primary inline-flex items-center gap-2 mt-2">
                <Plus size={14} />
                <span>Launch Mix Wizard</span>
              </Link>
            </div>
          ) : (
            <div className="border border-border rounded overflow-hidden bg-card">
              <table className="w-full text-xs text-left border-collapse font-tabular">
                <thead>
                  <tr className="bg-muted/60 border-b border-border text-muted-foreground uppercase font-bold text-[10px] tracking-wider font-mono-tech">
                    <th className="px-4 py-2.5">Project & Client</th>
                    <th className="px-3 py-2.5">Grade</th>
                    <th className="px-3 py-2.5 hidden sm:table-cell">Exposure</th>
                    <th className="px-3 py-2.5 hidden md:table-cell">Cement</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-4 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentProjects.map((project: SavedProject) => {
                    const pd = project.input.projectDetails;
                    const dp = project.input.designParameters;
                    const cement = project.result?.cement ?? 0;
                    const statusInfo = project.result ? getCentralizedMixStatus(project.result) : null;

                    return (
                      <tr key={project.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">
                          <div>
                            <p className="font-bold text-foreground truncate max-w-[200px]">{pd.projectName || 'Untitled Mix'}</p>
                            <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">{pd.clientName || 'General Site'}</p>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className="font-mono-tech font-bold px-2 py-0.5 rounded bg-muted text-primary border border-border">
                            {dp.concreteGrade}
                          </span>
                        </td>
                        <td className="px-3 py-3 hidden sm:table-cell capitalize text-muted-foreground">
                          {dp.exposureCondition.replace('_', ' ')}
                        </td>
                        <td className="px-3 py-3 hidden md:table-cell font-mono-tech">
                          {cement > 0 ? `${cement} kg/m³` : '—'}
                          {cement > 450 && <AlertTriangle size={12} className="inline ml-1 text-error" />}
                        </td>
                        <td className="px-3 py-3">
                          {statusInfo ? (
                            <span
                              className={`px-2 py-0.5 rounded-sm text-[10px] font-mono-tech font-bold uppercase tracking-wider border ${
                                statusInfo.status === 'COMPLIANT'
                                  ? 'bg-success/15 text-success border-success/30'
                                  : statusInfo.status === 'NON_COMPLIANT'
                                  ? 'bg-error/15 text-error border-error/30'
                                  : 'bg-warning/15 text-warning border-warning/30'
                              }`}
                            >
                              {statusInfo.heroBadge}
                            </span>
                          ) : (
                            <StatusBadge variant={project.status} label={project.status} />
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/mix-design-results?projectId=${project.id}`} className="btn-secondary py-1 text-[11px] font-mono-tech">
                            View Trace
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Grade Distribution Matrix */}
          <div className="p-4 rounded border border-border bg-card space-y-3 pt-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Concrete Grade Distribution Analysis
              </h3>
              <span className="text-[11px] font-mono-tech text-muted-foreground">M10 – M80</span>
            </div>
            {projects.length > 0 ? (
              <GradeDistributionChart projects={projects} />
            ) : (
              <div className="h-32 flex items-center justify-center text-muted-foreground text-xs font-mono-tech border border-dashed border-border/80 rounded">
                Grade analysis chart displays automatically as mix designs are saved.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: IS Standards Index & Quick Reference (1/3 width) */}
        <div className="space-y-4">
          <div className="p-4 rounded border border-border bg-card space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider">
                IS 10262:2019 Standard Reference Index
              </h3>
              <FileCheck size={14} className="text-primary" />
            </div>

            <div className="space-y-2.5 text-xs">
              {[
                { table: 'Table 1', title: 'Target Mean Strength', desc: "f'ck = fck + 1.65 S per grade" },
                { table: 'Table 4', title: 'Base Water Content', desc: 'MSA 10/20/40 mm @ 50 mm slump & air reduction' },
                { table: 'Table 5', title: 'Coarse Aggregate Fraction', desc: 'Volume ratio per FA zone (I to IV) & W/C ratio' },
                { table: 'Table 7', title: 'High Strength Base Water', desc: 'M65 to M80 high workability adjustments' },
                { table: 'Table 8', title: 'High Strength W/CM Ratio', desc: 'Target W/CM ratio for silica fume & OPC 53' },
                { table: 'Clause 7', title: 'Field Batch Adjustments', desc: 'Moisture & aggregate absorption corrections' },
              ].map((ref) => (
                <div key={ref.table} className="p-2.5 rounded bg-muted/30 border border-border/70 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono-tech font-bold text-primary text-[11px]">{ref.table}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">IS 10262</span>
                  </div>
                  <p className="font-bold text-foreground text-xs">{ref.title}</p>
                  <p className="text-[11px] text-muted-foreground">{ref.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}