'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  Printer,
  AlertTriangle,
  Wrench,
  Save,
  Check,
  Loader2,
} from 'lucide-react';

import CalculationStepAccordion from './CalculationStepAccordion';
import { RedesignAssistant } from './RedesignAssistant';
import type { MixDesignResult, MixDesignInput } from '@/features/mix-design/types';
import { runMixDesignCalculation } from '@/features/mix-design/calculations';
import { getCentralizedMixStatus, formatStepResult } from '@/features/mix-design/utils/status';
import { useProjectStore, isValidUUID } from '@/store/useProjectStore';
import { useAuth } from '@/context/AuthContext';

// PDF Text Sanitizer to prevent font output issues
function sanitizePdfText(str: string): string {
  if (!str) return '';
  return str
    .replace(/−/g, '-')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/≤/g, '<=')
    .replace(/≥/g, '>=')
    .replace(/≈/g, '~=')
    .replace(/±/g, '+/-')
    .replace(/Δ/g, 'Delta ')
    .replace(/[”“]/g, '')
    .replace(/(kg\/m³|N\/mm²|m³\/m³|ratio)(\s+\1)+/gi, '$1')
    .trim();
}

const DEFAULT_INPUT: MixDesignInput = {
  projectDetails: {
    projectName: 'Untitled Project',
    clientName: '—',
    engineerName: 'Consulting Engineer',
    date: new Date().toISOString().split('T')[0],
    location: '—',
    remarks: '',
  },
  designParameters: {
    concreteGrade: 'M25',
    exposureCondition: 'moderate',
    slump: 100,
    maxAggregateSize: 20,
    isPumpedConcrete: false,
    isAirEntrained: false,
  },
  materialProperties: {
    cement: { type: 'OPC_53', specificGravity: 3.15 },
    fineAggregate: { specificGravity: 2.65, waterAbsorption: 1.0, finesModulus: 2.8 },
    coarseAggregate: { specificGravity: 2.70, waterAbsorption: 0.5, angularity: 'angular' },
    water: { source: 'Potable water' },
    admixture: {},
  },
};

export default function MixDesignResultsContent() {
  const [showRedesignAssistant, setShowRedesignAssistant] = useState(false);
  const { loading: authLoading } = useAuth();
  const { projects, isLoading, fetchProjects } = useProjectStore();
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Derive initial editingProjectId synchronously on mount without effect loop
  const [editingProjectId, setEditingProjectId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const pid = searchParams.get('projectId');
      if (pid && isValidUUID(pid)) return pid;
      const stored = sessionStorage.getItem('civilsuite-editing-project-id');
      if (stored && isValidUUID(stored)) return stored;
    }
    return null;
  });

  // Derive initial input synchronously on mount without effect loop
  const [input, setInput] = useState<MixDesignInput>(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('civilsuite-current-input');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === 'object' && parsed.projectDetails) {
            return parsed;
          }
        } catch {
          // fallback
        }
      }
      const searchParams = new URLSearchParams(window.location.search);
      const pid = searchParams.get('projectId');
      if (pid && isValidUUID(pid)) {
        const saved = useProjectStore.getState().projects.find((p) => p.id === pid);
        if (saved?.input) return saved.input;
      }
    }
    return DEFAULT_INPUT;
  });

  // Trigger project fetch on mount if store hasn't loaded projects yet
  React.useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Deep link state machine definitions
  const isUuidTarget = Boolean(editingProjectId && isValidUUID(editingProjectId));
  const matchingProject = isUuidTarget ? projects.find((p) => p.id === editingProjectId) : undefined;
  const isExistingProject = isUuidTarget && Boolean(matchingProject);
  const isStoreLoading = isUuidTarget && (authLoading || isLoading) && !matchingProject;
  const isProjectNotFound = isUuidTarget && !authLoading && !isLoading && !matchingProject;

  // Hydrate input when matching project arrives from backend / store
  React.useEffect(() => {
    if (isUuidTarget && matchingProject) {
      if (typeof window !== 'undefined') {
        const storedInput = sessionStorage.getItem('civilsuite-current-input');
        const storedEditId = sessionStorage.getItem('civilsuite-editing-project-id');
        // If user came directly from in-flight wizard editing this exact project, prioritize in-flight input
        if (storedInput && storedEditId === editingProjectId) {
          try {
            const parsed = JSON.parse(storedInput);
            if (parsed && typeof parsed === 'object' && parsed.projectDetails) {
              setInput(parsed);
              return;
            }
          } catch {
            // fallback
          }
        }

        // Direct deep-link or fresh view: hydrate from saved project
        setInput(matchingProject.input);
        sessionStorage.setItem('civilsuite-current-input', JSON.stringify(matchingProject.input));
        sessionStorage.setItem('civilsuite-editing-project-id', editingProjectId!);
      }
    }
  }, [isUuidTarget, matchingProject, editingProjectId]);

  const result: MixDesignResult = React.useMemo(
    () => runMixDesignCalculation(input),
    [input]
  );

  const statusInfo = React.useMemo(
    () => getCentralizedMixStatus(result),
    [result]
  );

  const pd = input.projectDetails;
  const dp = input.designParameters;

  const isIncomplete = statusInfo.status === 'INCOMPLETE';
  const isPass = statusInfo.status === 'COMPLIANT';

  const wizardBackUrl = isExistingProject
    ? `/concrete-mix-design?projectId=${editingProjectId}&step=2`
    : `/concrete-mix-design?step=4`;

  // Explicit Save Project / Save Changes action handler
  const handleSave = async () => {
    if (isStoreLoading) {
      setSaveError('Please wait for project loading to complete.');
      return;
    }
    if (isProjectNotFound) {
      setSaveError('Cannot save: The target project was not found in your account.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    const store = useProjectStore.getState();

    try {
      if (isExistingProject && editingProjectId) {
        store.updateProject(editingProjectId, {
          input,
          result,
          status: 'calculated',
          updatedAt: new Date().toISOString(),
        });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else if (!isUuidTarget) {
        const savedProj = store.saveProject(input, result);
        setEditingProjectId(savedProj.id);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('civilsuite-editing-project-id', savedProj.id);
          const url = new URL(window.location.href);
          url.searchParams.set('projectId', savedProj.id);
          window.history.replaceState({}, '', url.toString());
        }
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: any) {
      console.error('Failed to save project:', err);
      setSaveError(err?.message || 'Failed to save project. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print();
  };

  const handleExportPDF = async () => {
    if (typeof window === 'undefined') return;
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const pageW = 210;
    const margin = 15;
    let y = margin;

    const addText = (text: string, x: number, yPos: number, opts?: { size?: number; bold?: boolean; color?: [number, number, number] }) => {
      doc.setFontSize(opts?.size ?? 9);
      doc.setFont('helvetica', opts?.bold ? 'bold' : 'normal');
      if (opts?.color) doc.setTextColor(...opts.color);
      else doc.setTextColor(23, 32, 42);
      doc.text(sanitizePdfText(text), x, yPos);
    };

    const addLine = (yPos: number) => {
      doc.setDrawColor(217, 222, 229);
      doc.line(margin, yPos, pageW - margin, yPos);
    };

    const checkPage = (needed: number) => {
      if (y + needed > 280) {
        doc.addPage();
        y = margin;
      }
    };

    // Header Banner
    if (isIncomplete) {
      doc.setFillColor(183, 121, 31); // Amber for exception report
      doc.rect(0, 0, pageW, 26, 'F');
      addText('CIVILSUITE ENGINEERING CALCULATION EXCEPTION REPORT', margin, 11, { size: 13, bold: true, color: [255, 255, 255] });
      addText('Reference Data Required — No Final Mix Proportion Issued', margin, 19, { size: 8, color: [255, 245, 230] });
    } else {
      doc.setFillColor(24, 59, 86); // Navy
      doc.rect(0, 0, pageW, 26, 'F');
      addText('CIVILSUITE ENGINEERING CONSULTING REPORT', margin, 11, { size: 14, bold: true, color: [255, 255, 255] });
      addText('Concrete Mix Proportioning Report — IS 10262:2019 / IS 456:2000', margin, 19, { size: 8, color: [200, 215, 230] });
    }
    addText(`Date: ${pd.date}`, pageW - margin - 25, 11, { size: 9, color: [255, 255, 255] });
    y = 34;

    // Project Info Grid
    addText('PROJECT IDENTIFICATION & SPECIFICATION SHEET', margin, y, { size: 8, bold: true, color: [102, 112, 133] });
    y += 4; addLine(y); y += 5;

    const infoRows = [
      ['Project Name:', pd.projectName || '—', 'Concrete Grade:', dp.concreteGrade],
      ['Client Authority:', pd.clientName || '—', 'Exposure Class:', dp.exposureCondition.toUpperCase()],
      ['Design Engineer:', pd.engineerName || '—', 'Target Slump:', `${dp.slump} mm`],
      ['Site Location:', pd.location || '—', 'Max Agg Size:', `${dp.maxAggregateSize} mm`],
    ];

    infoRows.forEach(([l1, v1, l2, v2]) => {
      addText(l1, margin, y, { bold: true });
      addText(v1, margin + 30, y);
      addText(l2, margin + 100, y, { bold: true });
      addText(v2, margin + 130, y);
      y += 5;
    });
    y += 3;

    // SSD Mix Ratio Summary Box
    checkPage(30);
    doc.setFillColor(245, 246, 248);
    doc.rect(margin, y, pageW - 2 * margin, 22, 'F');
    doc.setDrawColor(217, 222, 229);
    doc.rect(margin, y, pageW - 2 * margin, 22, 'S');

    if (isIncomplete) {
      addText('DESIGN MIX PROPORTIONS (SSD BASIS BY MASS)', margin + 5, y + 6, { size: 8, bold: true, color: [102, 112, 133] });
      addText('NO MIX PROPORTION ISSUED', margin + 5, y + 15, { size: 12, bold: true, color: [183, 121, 31] });
      addText('STATUS: CALCULATION INCOMPLETE', pageW - margin - 60, y + 12, { size: 9, bold: true, color: [183, 121, 31] });
      y += 28;

      // Exception Block in PDF
      checkPage(35);
      doc.setFillColor(254, 249, 235);
      doc.rect(margin, y, pageW - 2 * margin, 24, 'F');
      doc.setDrawColor(245, 215, 150);
      doc.rect(margin, y, pageW - 2 * margin, 24, 'S');

      const first = statusInfo.firstBlockedStep;
      addText(`FIRST BLOCKED STEP: Step ${first?.stepNumber || 2} — ${first?.title || 'Water Content'}`, margin + 5, y + 6, { size: 9, bold: true, color: [183, 121, 31] });
      addText(`REASON: ${first?.reason || statusInfo.reason}`, margin + 5, y + 13, { size: 8, color: [50, 50, 50] });

      if (statusInfo.secondaryBlockedSteps && statusInfo.secondaryBlockedSteps.length > 0) {
        const secText = statusInfo.secondaryBlockedSteps.map((s) => `Step ${s.stepNumber} (${s.title}): ${s.reason}`).join('; ');
        addText(`SECONDARY: ${secText}`, margin + 5, y + 19, { size: 7.5, color: [100, 100, 100] });
      }
      y += 30;
    } else {
      const ratioStr = `1 : ${result.mixRatioFineAggregate.toFixed(2)} : ${result.mixRatioCoarseAggregate.toFixed(2)}`;
      addText('DESIGN MIX PROPORTIONS (SSD BASIS BY MASS)', margin + 5, y + 6, { size: 8, bold: true, color: [102, 112, 133] });
      addText(ratioStr, margin + 5, y + 15, { size: 14, bold: true, color: [24, 59, 86] });
      addText(`Status: ${statusInfo.status}`, pageW - margin - 40, y + 12, { size: 10, bold: true, color: isPass ? [24, 121, 78] : [180, 35, 24] });
      y += 28;
    }

    // Quantities Table
    checkPage(50);
    addText('MIX PROPORTION QUANTITIES (PER m³ CONCRETE)', margin, y, { size: 8, bold: true, color: [102, 112, 133] });
    y += 4; addLine(y); y += 5;

    // Table Headers
    doc.setFillColor(235, 240, 245);
    doc.rect(margin, y, pageW - 2 * margin, 6, 'F');
    addText('Material Component', margin + 3, y + 4.5, { size: 8, bold: true });
    addText('SSD Design Mass', margin + 65, y + 4.5, { size: 8, bold: true });
    addText('Field Batch Mass', margin + 110, y + 4.5, { size: 8, bold: true });
    addText('IS Standard Clause', margin + 150, y + 4.5, { size: 8, bold: true });
    y += 7;

    const ssdFA = result.ssdFineAggregate ?? Math.round(result.unrounded?.ssdFineAggregate ?? (result.mixRatioFineAggregate * result.cement));
    const ssdCA = result.ssdCoarseAggregate ?? Math.round(result.unrounded?.ssdCoarseAggregate ?? (result.mixRatioCoarseAggregate * result.cement));

    const quantRows = isIncomplete
      ? [
          ['Water', 'NOT CALCULATED', 'NOT CALCULATED', 'IS 10262 Cl. 6.3'],
          ['Cement', 'NOT CALCULATED', 'NOT CALCULATED', 'IS 10262 Cl. 6.5'],
          ['Fine Aggregate (Sand)', 'NOT CALCULATED', 'NOT CALCULATED', 'IS 10262 Cl. 6.6'],
          ['Coarse Aggregate', 'NOT CALCULATED', 'NOT CALCULATED', 'IS 10262 Cl. 6.6'],
          ['Admixture', 'NOT CALCULATED', 'NOT CALCULATED', 'IS 9103'],
        ]
      : [
          ['Water', `${result.designWater} kg/m³`, `${result.water} kg/m³`, 'IS 10262 Cl. 6.3 & 7'],
          ['Cement', `${result.cement} kg/m³`, `${result.cement} kg/m³`, 'IS 10262 Cl. 6.5'],
          ['Fine Aggregate (Sand)', `${ssdFA} kg/m³`, `${result.fineAggregate} kg/m³`, 'IS 10262 Cl. 6.6 & 7'],
          ['Coarse Aggregate', `${ssdCA} kg/m³`, `${result.coarseAggregate} kg/m³`, 'IS 10262 Cl. 6.6 & 7'],
          ['Admixture', result.admixture ? `${result.admixture} kg/m³` : '0 kg/m³', result.admixture ? `${result.admixture} kg/m³` : '0 kg/m³', 'IS 9103'],
        ];

    quantRows.forEach(([mat, ssd, batch, ref]) => {
      addText(mat, margin + 3, y + 4);
      addText(ssd, margin + 65, y + 4, { bold: true });
      addText(batch, margin + 110, y + 4, { bold: true });
      addText(ref, margin + 150, y + 4, { size: 8, color: [100, 100, 100] });
      y += 6;
      doc.setDrawColor(240, 240, 240);
      doc.line(margin, y, pageW - margin, y);
      y += 1;
    });
    y += 5;

    // Step Traces Summary
    checkPage(60);
    addText('IS 10262:2019 STEP-BY-STEP CALCULATION TRACE', margin, y, { size: 8, bold: true, color: [102, 112, 133] });
    y += 4; addLine(y); y += 5;

    let isBlocked = false;
    result.calculationSteps.forEach((st) => {
      checkPage(14);
      const isStepBlocked =
        st.isPlaceholder ||
        st.result.includes('reference-data-required') ||
        st.result.includes('outside verified') ||
        st.result.includes('Cannot compute');

      if (isStepBlocked) isBlocked = true;

      const displayRes = isBlocked
        ? 'NOT EXECUTED'
        : formatStepResult(st.result, st.unit);

      addText(`Step ${st.stepNumber}: ${st.title} (${st.isCodeClause})`, margin, y, { size: 8, bold: true, color: [24, 59, 86] });
      addText(displayRes, pageW - margin - 45, y, { size: 8, bold: true, color: isBlocked ? [183, 121, 31] : [23, 32, 42] });
      y += 4;
      if (st.formula && !isBlocked) {
        addText(`Formula: ${st.formula}`, margin + 4, y, { size: 7, color: [90, 100, 110] });
        y += 4;
      }
      y += 2;
    });

    // Page Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generated by CivilSuite Concrete Mix Design Software — IS 10262:2019 / IS 456:2000`, margin, 288);
      doc.text(`Page ${i} of ${totalPages}`, pageW - margin - 15, 288);
    }

    doc.save(`CivilSuite_${dp.concreteGrade}_${pd.projectName.replace(/\s+/g, '_')}.pdf`);
  };

  const ssdFA = result.ssdFineAggregate ?? Math.round(result.unrounded?.ssdFineAggregate ?? (result.mixRatioFineAggregate * result.cement));
  const ssdCA = result.ssdCoarseAggregate ?? Math.round(result.unrounded?.ssdCoarseAggregate ?? (result.mixRatioCoarseAggregate * result.cement));
  const targetStrengthStep = result.calculationSteps.find((s) => s.stepNumber === 1);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href={wizardBackUrl} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 font-semibold">
              <ArrowLeft size={13} />
              <span>{editingProjectId ? 'Return to Design Parameters' : 'Back to Mix Wizard'}</span>
            </Link>
          </div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            Mix Design Calculation Results
          </h1>
          <p className="text-xs text-muted-foreground font-mono-tech mt-0.5">
            IS 10262:2019 Calculation Engine Output • {pd.projectName || 'Untitled Project'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {isStoreLoading ? (
            <button
              disabled
              className="flex items-center gap-1.5 text-xs font-mono-tech font-bold px-3 py-1.5 rounded-sm border border-border bg-muted/50 text-muted-foreground cursor-not-allowed opacity-75"
            >
              <Loader2 size={14} className="animate-spin" />
              <span>Loading Project...</span>
            </button>
          ) : isProjectNotFound ? (
            <button
              disabled
              title="Project not found in your account"
              className="flex items-center gap-1.5 text-xs font-mono-tech font-bold px-3 py-1.5 rounded-sm border border-error/30 bg-error/10 text-error cursor-not-allowed opacity-75"
            >
              <AlertTriangle size={14} />
              <span>Project Not Found</span>
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={isSaving || saveSuccess}
              className={`flex items-center gap-1.5 text-xs font-mono-tech font-bold px-3 py-1.5 rounded-sm transition-all border ${
                saveSuccess
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : isExistingProject
                    ? 'btn-secondary'
                    : 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
              }`}
            >
              {saveSuccess ? (
                <>
                  <Check size={14} className="text-emerald-500" />
                  <span>{isExistingProject ? 'Changes Saved' : 'Project Saved'}</span>
                </>
              ) : isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>{isExistingProject ? 'Save Changes' : 'Save Project'}</span>
                </>
              )}
            </button>
          )}

          {statusInfo.status === 'NON_COMPLIANT' && (
            <button
              onClick={() => setShowRedesignAssistant(true)}
              className="btn-warning flex items-center gap-1.5 text-xs font-mono-tech font-bold"
            >
              <Wrench size={14} />
              <span>Review & Redesign Mix</span>
            </button>
          )}
          <button onClick={handlePrint} className="btn-secondary flex items-center gap-1.5 text-xs">
            <Printer size={14} />
            <span>Print</span>
          </button>
          <button onClick={handleExportPDF} className="btn-primary flex items-center gap-1.5 text-xs">
            <Download size={14} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* ─── LOADING PROJECT DATA BANNER ──────────────────────────────────── */}
      {isStoreLoading && (
        <div className="bg-card border border-primary/30 rounded-sm shadow-xs p-4 flex items-center gap-3 font-mono-tech">
          <Loader2 className="text-primary animate-spin flex-shrink-0" size={18} />
          <div>
            <h3 className="font-bold text-xs text-foreground uppercase tracking-wider">
              Loading Saved Project...
            </h3>
            <p className="text-[11px] text-muted-foreground font-sans mt-0.5">
              Retrieving project calculation data from your workspace.
            </p>
          </div>
        </div>
      )}

      {/* ─── PROJECT NOT FOUND ERROR BANNER ───────────────────────────────── */}
      {isProjectNotFound && (
        <div className="bg-card border border-error/40 rounded-sm shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono-tech">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-error flex-shrink-0 mt-0.5" size={18} />
            <div>
              <h3 className="font-bold text-xs text-foreground uppercase tracking-wider">
                Project Not Found ({editingProjectId})
              </h3>
              <p className="text-[11px] text-muted-foreground font-sans mt-0.5">
                The requested project ID does not exist in your account or may have been deleted. Saving has been disabled to prevent accidental duplication.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 font-sans">
            <Link href="/saved-projects" className="btn-secondary text-xs px-3 py-1.5 font-mono-tech">
              Project History
            </Link>
            <Link href="/concrete-mix-design?mode=new" className="btn-primary text-xs px-3 py-1.5 font-mono-tech font-bold">
              New Mix Design
            </Link>
          </div>
        </div>
      )}

      {saveError && (
        <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-sm text-destructive text-xs flex items-center gap-2">
          <AlertTriangle size={14} className="flex-shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* ─── INCOMPLETE CALCULATION EXCEPTION VIEW ─────────────────────────── */}
      {isIncomplete ? (
        <div className="space-y-6">
          {/* Exception Hero Header */}
          <div className="bg-card border border-warning/40 rounded-sm shadow-xs p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4 border-b border-border">
              <div>
                <span className="text-xs font-bold text-warning uppercase font-mono-tech tracking-widest block mb-1">
                  CALCULATION STATUS — EXCEPTION REPORT
                </span>
                <div className="flex items-baseline gap-2 font-mono-tech font-extrabold text-2xl md:text-3xl text-warning">
                  NO MIX PROPORTION ISSUED
                </div>
                <p className="text-[11px] text-muted-foreground font-mono-tech mt-1">
                  Calculation halted prior to final proportioning due to unconfigured reference data.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-4 py-2 rounded-sm text-xs font-bold font-mono-tech uppercase tracking-wider border bg-warning/15 text-warning border-warning/40">
                  ⚠ CALCULATION INCOMPLETE
                </div>
              </div>
            </div>

            {/* Diagnostic Details Box */}
            {statusInfo.firstBlockedStep && (
              <div className="p-4 rounded-sm border border-warning/40 bg-warning/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-warning uppercase text-xs flex items-center gap-1.5 font-mono-tech">
                    <AlertTriangle size={15} />
                    FIRST BLOCKED STEP: Step 0{statusInfo.firstBlockedStep.stepNumber} — {statusInfo.firstBlockedStep.title}
                  </span>
                  <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono-tech font-bold bg-warning/20 text-warning">
                    REFERENCE DATA REQUIRED
                  </span>
                </div>
                <p className="text-xs text-foreground font-mono-tech font-semibold">
                  REASON: {statusInfo.firstBlockedStep.reason}
                </p>

                {statusInfo.secondaryBlockedSteps && statusInfo.secondaryBlockedSteps.length > 0 && (
                  <div className="pt-2 border-t border-warning/20 space-y-1">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase font-mono-tech">Secondary Blocked Steps:</span>
                    {statusInfo.secondaryBlockedSteps.map((sec) => (
                      <p key={sec.stepNumber} className="text-xs text-muted-foreground font-mono-tech">
                        • Step 0{sec.stepNumber} ({sec.title}): {sec.reason}
                      </p>
                    ))}
                  </div>
                )}

                <div className="pt-2">
                  <Link href={wizardBackUrl} className="btn-primary inline-flex items-center gap-2 text-xs font-mono-tech font-bold">
                    <ArrowLeft size={13} />
                    <span>Return to Design Parameters</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Diagnostic Calculation Step Trace Notebook */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h2 className="text-xs font-bold text-primary uppercase font-mono-tech tracking-wider">
                Diagnostic Step-by-Step Calculation Trace Notebook
              </h2>
              <span className="text-[11px] text-muted-foreground font-mono-tech">
                Inspect execution trace up to halt point
              </span>
            </div>
            <CalculationStepAccordion steps={result.calculationSteps} />
          </div>
        </div>
      ) : (
        /* ─── VALID MIX DESIGN RESULT VIEW ──────────────────────────────────── */
        <div className="space-y-6">
          {/* HERO: Technical Mix Summary Banner */}
          <div className="bg-card border border-border rounded-sm shadow-xs p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4 border-b border-border">
              {/* Mix Ratio Display */}
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase font-mono-tech tracking-widest block mb-1">
                  FINAL SSD MIX PROPORTION (CEMENT : FA : CA BY MASS)
                </span>
                <div className="flex items-baseline gap-2 font-mono-tech font-extrabold text-3xl md:text-4xl text-foreground">
                  <span className="text-primary">1</span>
                  <span className="text-border">:</span>
                  <span className="text-primary">{result.mixRatioFineAggregate.toFixed(2)}</span>
                  <span className="text-border">:</span>
                  <span className="text-foreground">{result.mixRatioCoarseAggregate.toFixed(2)}</span>
                </div>
                <p className="text-[11px] text-muted-foreground font-mono-tech mt-1">
                  Proportions based on SSD aggregate condition per IS 10262:2019 Cl. 6.6
                </p>
              </div>

              {/* Compliance Status */}
              <div className="flex flex-wrap items-center gap-3">
                <div
                  className={`px-4 py-2 rounded-sm text-xs font-bold font-mono-tech uppercase tracking-wider border ${
                    isPass
                      ? 'bg-success/15 text-success border-success/30'
                      : 'bg-error/15 text-error border-error/30'
                  }`}
                >
                  {isPass ? '✓ IS 10262 COMPLIANT (PASS)' : '✕ NON-COMPLIANT (FAIL)'}
                </div>
                {statusInfo.status === 'NON_COMPLIANT' && (
                  <button
                    onClick={() => setShowRedesignAssistant(true)}
                    className="px-3 py-2 rounded-sm text-xs font-bold font-mono-tech uppercase tracking-wider border bg-warning/15 text-warning border-warning/40 hover:bg-warning/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Wrench size={14} />
                    <span>Review & Redesign Mix</span>
                  </button>
                )}
              </div>
            </div>

            {/* Dense Technical Data Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1 font-mono-tech">
              <div className="p-2.5 rounded-sm bg-background border border-border">
                <span className="text-muted-foreground text-[10px] block font-sans uppercase">Target Strength (f&apos;ck)</span>
                <span className="font-bold text-sm text-foreground">
                  {targetStrengthStep ? formatStepResult(targetStrengthStep.result, targetStrengthStep.unit) : '—'}
                </span>
              </div>
              <div className="p-2.5 rounded-sm bg-background border border-border">
                <span className="text-muted-foreground text-[10px] block font-sans uppercase">Adopted W/C Ratio</span>
                <span className="font-bold text-sm text-primary">
                  {result.wcRatio ? result.wcRatio.toFixed(4) : '—'}
                </span>
              </div>
              <div className="p-2.5 rounded-sm bg-background border border-border">
                <span className="text-muted-foreground text-[10px] block font-sans uppercase">Cement Content</span>
                <span className="font-bold text-sm text-foreground">
                  {result.cement ? `${result.cement} kg/m³` : '—'}
                </span>
              </div>
              <div className="p-2.5 rounded-sm bg-background border border-border">
                <span className="text-muted-foreground text-[10px] block font-sans uppercase">Fresh Mix Density</span>
                <span className="font-bold text-sm text-foreground">
                  {result.density ? `${result.density} kg/m³` : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* TWO-COLUMN ENGINEERING LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT RAIL (2 Columns): Step-by-Step Calculation Notebook */}
            <div className="lg:col-span-2 space-y-4">
              <CalculationStepAccordion steps={result.calculationSteps} />
            </div>

            {/* RIGHT RAIL (1 Column): Proportions & Compliance Tables */}
            <div className="space-y-4">
              {/* SSD Design Basis Table */}
              <div className="bg-card border border-border rounded-sm shadow-xs p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <h3 className="text-xs font-bold text-primary uppercase font-mono-tech tracking-wider">
                    SSD Design Mix Proportions
                  </h3>
                  <span className="text-[10px] font-mono-tech text-muted-foreground">per m³</span>
                </div>
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/50 text-muted-foreground font-mono-tech uppercase border-b border-border text-[10px]">
                      <th className="py-1.5 px-2 font-bold">Component</th>
                      <th className="py-1.5 px-2 text-right font-bold">Design Mass</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 font-mono-tech">
                    <tr>
                      <td className="py-2 px-2 text-foreground font-sans font-medium">Design Water</td>
                      <td className="py-2 px-2 text-right font-bold text-primary">{result.designWater} kg/m³</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-2 text-foreground font-sans font-medium">Cement</td>
                      <td className="py-2 px-2 text-right font-bold text-foreground">{result.cement} kg/m³</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-2 text-foreground font-sans font-medium">Fine Aggregate (SSD)</td>
                      <td className="py-2 px-2 text-right font-bold text-foreground">{ssdFA} kg/m³</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-2 text-foreground font-sans font-medium">Coarse Aggregate (SSD)</td>
                      <td className="py-2 px-2 text-right font-bold text-foreground">{ssdCA} kg/m³</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-2 text-foreground font-sans font-medium">Admixture</td>
                      <td className="py-2 px-2 text-right font-bold text-primary">
                        {result.admixture ? `${result.admixture} kg/m³` : '0 kg/m³'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Field Batch Adjusted Table */}
              <div className="bg-card border border-border rounded-sm shadow-xs p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <h3 className="text-xs font-bold text-primary uppercase font-mono-tech tracking-wider">
                    Field Batch Quantities (Moist)
                  </h3>
                  <span className="text-[10px] font-mono-tech text-muted-foreground">Clause 7</span>
                </div>
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/50 text-muted-foreground font-mono-tech uppercase border-b border-border text-[10px]">
                      <th className="py-1.5 px-2 font-bold">Component</th>
                      <th className="py-1.5 px-2 text-right font-bold">Batch Mass</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 font-mono-tech">
                    <tr>
                      <td className="py-2 px-2 text-foreground font-sans font-medium">Corrected Water</td>
                      <td className="py-2 px-2 text-right font-bold text-primary">{result.water} kg/m³</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-2 text-foreground font-sans font-medium">Cement</td>
                      <td className="py-2 px-2 text-right font-bold text-foreground">{result.cement} kg/m³</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-2 text-foreground font-sans font-medium">Wet Fine Aggregate</td>
                      <td className="py-2 px-2 text-right font-bold text-foreground">{result.fineAggregate} kg/m³</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-2 text-foreground font-sans font-medium">Wet Coarse Aggregate</td>
                      <td className="py-2 px-2 text-right font-bold text-foreground">{result.coarseAggregate} kg/m³</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Compliance Checks Sheet */}
              <div className="bg-card border border-border rounded-sm shadow-xs p-4 space-y-3">
                <h3 className="text-xs font-bold text-primary uppercase font-mono-tech tracking-wider pb-2 border-b border-border">
                  IS Code Compliance Verification Sheet
                </h3>
                <div className="space-y-2 text-xs">
                  {/* Cement Content Check */}
                  <div className="p-2.5 rounded-sm border border-border bg-background space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground font-mono-tech text-xs">Cement Content Check</span>
                      <span className={`px-2 py-0.5 rounded-sm font-mono-tech font-bold text-[10px] ${
                        result.cementContentCheck === 'pass'
                          ? 'bg-success/15 text-success'
                          : 'bg-error/15 text-error'
                      }`}>
                        {result.cementContentCheck.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {result.cementContentCheck === 'fail' && result.cement > 450
                        ? 'Calculated cement content exceeds maximum permitted 450 kg/m³.'
                        : 'Satisfies minimum durability cement requirement & ≤ 450 kg/m³ max.'}
                    </p>
                  </div>

                  {/* Water Cement Check */}
                  <div className="p-2.5 rounded-sm border border-border bg-background space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground font-mono-tech text-xs">W/C Ratio Durability Check</span>
                      <span className={`px-2 py-0.5 rounded-sm font-mono-tech font-bold text-[10px] ${
                        result.durabilityCheck === 'pass'
                          ? 'bg-success/15 text-success'
                          : 'bg-error/15 text-error'
                      }`}>
                        {result.durabilityCheck.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Adopted W/C ({result.wcRatio ? result.wcRatio.toFixed(2) : '—'}) ≤ IS 456 Table 5 maximum limit.
                    </p>
                  </div>

                  {/* Target Strength Check */}
                  <div className="p-2.5 rounded-sm border border-border bg-background space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground font-mono-tech text-xs">Target Strength Check</span>
                      <span className={`px-2 py-0.5 rounded-sm font-mono-tech font-bold text-[10px] ${
                        targetStrengthStep?.isPlaceholder
                          ? 'bg-warning/15 text-warning'
                          : result.strengthCheck === 'pass'
                          ? 'bg-success/15 text-success'
                          : 'bg-error/15 text-error'
                      }`}>
                        {targetStrengthStep?.isPlaceholder ? 'INCOMPLETE' : result.strengthCheck.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Target strength f&apos;ck ({targetStrengthStep ? formatStepResult(targetStrengthStep.result, targetStrengthStep.unit) : '—'}) = fck + 1.65 S.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRedesignAssistant && (
        <RedesignAssistant
          originalInput={input}
          originalResult={result}
          onAdoptRedesign={(newInput) => {
            setInput(newInput);
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('civilsuite-current-input', JSON.stringify(newInput));
            }
            setShowRedesignAssistant(false);
          }}
          onClose={() => setShowRedesignAssistant(false)}
        />
      )}
    </div>
  );
}