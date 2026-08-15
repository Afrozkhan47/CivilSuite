'use client';

import React from 'react';
import { FileText, Download, FlaskConical, Clock, CheckCircle2 } from 'lucide-react';
import { useProjectStore } from '@/store/useProjectStore';
import { getCentralizedMixStatus } from '@/features/mix-design/utils/status';
import Link from 'next/link';

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function ReportsContent() {
  const { projects } = useProjectStore();
  const calculatedProjects = projects.filter((p) => p.result && !p.result.isPlaceholder);

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold font-mono-tech uppercase tracking-wider mb-2">
            <FileText size={12} />
            <span>Consulting Document Generator</span>
          </div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Engineering Calculation Reports</h1>
          <p className="text-xs text-muted-foreground font-mono-tech mt-0.5">
            IS 10262:2019 certified proportioning reports, mathematical traces, and client deliverables.
          </p>
        </div>
      </div>

      {/* Technical Overview Banner */}
      <div className="bg-card border border-border rounded-sm p-4 space-y-1.5 font-mono-tech">
        <div className="flex items-center gap-2 text-xs font-bold text-primary">
          <CheckCircle2 size={14} className="text-success" />
          <span>IS 10262:2019 & IS 456:2000 Structural Deliverable Suite</span>
        </div>
        <p className="text-xs text-muted-foreground font-sans leading-relaxed">
          Each calculated mix design includes an A4 PDF export report with project metadata, full 8-step mathematical derivations, material specific gravities, moisture absorption corrections, and compliance checks.
        </p>
      </div>

      {/* Calculated Projects Report List */}
      {calculatedProjects.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-sm p-12 text-center space-y-3">
          <FlaskConical size={32} className="mx-auto text-muted-foreground/50" />
          <div>
            <h2 className="text-sm font-bold text-foreground">No Calculated Reports Available</h2>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-md mx-auto">
              Execute a concrete mix design calculation using the 4-step wizard to generate a technical proportioning report.
            </p>
          </div>
          <Link
            href="/concrete-mix-design"
            className="btn-primary inline-flex items-center gap-2 text-xs font-mono-tech font-bold mt-2"
          >
            <FlaskConical size={14} />
            <span>Launch Mix Wizard</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-border/80">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono-tech">
              Available Calculation Reports ({calculatedProjects.length})
            </h2>
            <span className="text-[11px] font-mono-tech text-muted-foreground">PDF Deliverables</span>
          </div>

          <div className="border border-border rounded-sm overflow-hidden bg-card divide-y divide-border">
            {calculatedProjects.map((project) => {
              const pd = project.input.projectDetails;
              const dp = project.input.designParameters;
              const statusInfo = project.result ? getCentralizedMixStatus(project.result) : null;

              return (
                <div key={project.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition-colors">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-foreground truncate">
                        {pd.projectName || 'Untitled Mix Design'}
                      </span>
                      <span className="font-mono-tech font-bold text-[11px] px-2 py-0.5 rounded-sm bg-muted text-primary border border-border">
                        {dp.concreteGrade}
                      </span>
                      {statusInfo && (
                        <span
                          className={`px-2 py-0.5 rounded-sm text-[10px] font-mono-tech font-bold uppercase tracking-wider border ${statusInfo.status === 'COMPLIANT'
                              ? 'bg-success/15 text-success border-success/30'
                              : statusInfo.status === 'NON_COMPLIANT'
                                ? 'bg-error/15 text-error border-error/30'
                                : 'bg-warning/15 text-warning border-warning/30'
                            }`}
                        >
                          {statusInfo.heroBadge}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-[11px] text-muted-foreground font-mono-tech flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {formatDate(project.createdAt)}
                      </span>
                      <span>Client: {pd.clientName || '—'}</span>
                      <span>Engineer: {pd.engineerName || '—'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/mix-design-results?projectId=${project.id}`}
                      className="btn-primary text-xs font-mono-tech font-bold flex items-center gap-1.5 py-1.5 px-3"
                    >
                      <Download size={13} />
                      <span>Open Report & PDF</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

