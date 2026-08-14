'use client';

import React from 'react';
import { FileText, Download, FlaskConical, FolderOpen, Clock } from 'lucide-react';
import { useProjectStore } from '@/store/useProjectStore';
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
  const calculatedProjects = projects.filter((p) => p.status === 'calculated' || p.status === 'saved' || p.status === 'exported');

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileText size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reports</h1>
            <p className="text-sm text-muted-foreground">
              View and export mix design reports
            </p>
          </div>
        </div>
      </div>

      {/* Notice */}
      <div className="card p-4 mb-6 border-l-4 border-warning bg-warning/5">
        <p className="text-sm text-warning font-medium">Report PDF export is planned for a future release.</p>
        <p className="text-xs text-muted-foreground mt-1">
          You can currently view the calculated data for each saved project. Full formatted PDF reports will be available soon.
        </p>
      </div>

      {/* Calculated Projects */}
      {calculatedProjects.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <FlaskConical size={28} className="text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">No reports available</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Complete a concrete mix design calculation to generate a report.
          </p>
          <Link
            href="/concrete-mix-design"
            className="btn-primary inline-flex items-center gap-2 px-4 py-2"
          >
            <FlaskConical size={16} />
            New Mix Design
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {calculatedProjects.map((project) => (
            <div key={project.id} className="card p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FlaskConical size={18} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">
                    {project.input.projectDetails.projectName}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {formatDate(project.createdAt)}
                    </span>
                    <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                      {project.input.designParameters.concreteGrade}
                    </span>
                    <span>{project.input.projectDetails.engineerName}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href={`/mix-design-results?projectId=${project.id}`}
                  className="btn-ghost px-3 py-1.5 text-sm flex items-center gap-1.5"
                >
                  <FolderOpen size={14} />
                  View
                </Link>
                <button
                  className="btn-ghost px-3 py-1.5 text-sm flex items-center gap-1.5 opacity-50 cursor-not-allowed"
                  disabled
                  title="PDF export coming soon"
                >
                  <Download size={14} />
                  Export PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
