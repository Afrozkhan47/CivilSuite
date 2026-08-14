'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import type { CalculationStep } from '@/features/mix-design/types';
import { formatStepResult } from '@/features/mix-design/utils/status';

interface CalculationStepAccordionProps {
  steps: CalculationStep[];
}

export default function CalculationStepAccordion({ steps }: CalculationStepAccordionProps) {
  const [openSteps, setOpenSteps] = useState<Set<number>>(new Set());
  const [activeStep, setActiveStep] = useState<number>(1);

  const toggle = (stepNumber: number) => {
    setOpenSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepNumber)) next.delete(stepNumber);
      else next.add(stepNumber);
      return next;
    });
    setActiveStep(stepNumber);
  };

  const jumpToStep = (stepNumber: number) => {
    setOpenSteps((prev) => new Set(prev).add(stepNumber));
    setActiveStep(stepNumber);
    const el = document.getElementById(`calc-step-card-${stepNumber}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const expandAll = () => setOpenSteps(new Set(steps.map((s: CalculationStep) => s.stepNumber)));
  const collapseAll = () => setOpenSteps(new Set());

  // Determine first blocked step number to cleanly mark downstream steps
  let firstBlockedNumber: number | null = null;
  for (const s of steps) {
    if (
      s.isPlaceholder ||
      s.result.includes('reference-data-required') ||
      s.result.includes('outside verified') ||
      s.result.includes('Cannot compute')
    ) {
      firstBlockedNumber = s.stepNumber;
      break;
    }
  }

  return (
    <div className="space-y-4">
      {/* Controls & Section Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border text-xs">
        <div className="flex items-center gap-2">
          <BookOpen size={14} className="text-primary" />
          <span className="font-bold text-primary uppercase tracking-wider">
            IS 10262 Step-by-Step Calculation Trace Notebook
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={expandAll} className="text-primary font-semibold hover:underline">
            Expand All
          </button>
          <span className="text-border">|</span>
          <button onClick={collapseAll} className="text-muted-foreground hover:text-foreground">
            Collapse All
          </button>
        </div>
      </div>

      {/* Two-Column Trace Layout: Left Rail Navigation + Notebook Accordion */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT RAIL: Step Navigation Buttons */}
        <div className="lg:col-span-4 space-y-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block pb-1 border-b border-border font-mono-tech">
            Calculation Steps (01–08)
          </span>
          <div className="space-y-1 pt-1">
            {steps.map((s: CalculationStep) => {
              const isSelected = activeStep === s.stepNumber;
              const isBlocked =
                s.isPlaceholder ||
                s.result.includes('reference-data-required') ||
                s.result.includes('outside verified') ||
                s.result.includes('Cannot compute');

              const isDownstreamBlocked =
                firstBlockedNumber !== null && s.stepNumber > firstBlockedNumber;

              return (
                <button
                  key={`rail-step-${s.stepNumber}`}
                  type="button"
                  onClick={() => jumpToStep(s.stepNumber)}
                  className={`w-full text-left p-2.5 rounded-sm transition-all flex items-start justify-between border text-[11px] font-mono-tech ${
                    isSelected
                      ? 'bg-primary text-primary-foreground font-bold border-primary shadow-xs'
                      : isBlocked || isDownstreamBlocked
                      ? 'bg-warning/5 text-warning border-warning/30 hover:border-warning'
                      : 'bg-card text-foreground border-border hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <span className="font-bold flex-shrink-0 pt-0.5">0{s.stepNumber}</span>
                    <span className="text-[11px] font-medium leading-snug break-words whitespace-normal" title={s.title}>
                      {s.title}
                    </span>
                  </div>
                  {isBlocked || isDownstreamBlocked ? (
                    <span className="text-[9px] px-1 rounded-sm bg-warning/20 text-warning font-bold flex-shrink-0 ml-1.5 self-start mt-0.5">
                      !
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT NOTEBOOK: Structured Calculation Accordion Cards */}
        <div className="lg:col-span-8 space-y-3">
          {steps.map((step: CalculationStep) => {
            const isOpen = openSteps.has(step.stepNumber);
            const isThisBlocked =
              step.isPlaceholder ||
              step.result.includes('reference-data-required') ||
              step.result.includes('outside verified') ||
              step.result.includes('Cannot compute');

            const isDownstreamBlocked =
              firstBlockedNumber !== null && step.stepNumber > firstBlockedNumber;

            const clauseText =
              step.stepNumber === 5 && step.isCodeClause === 'IS 10262:2019, Table 3 & Table 5'
                ? 'IS 10262:2019, Clause 6.6, Table 3 & Table 5'
                : step.isCodeClause;

            let displayResult = formatStepResult(step.result, step.unit);
            if (isThisBlocked) {
              if (step.result.includes('reference-data-required')) {
                displayResult = 'REFERENCE DATA REQUIRED';
              } else if (step.result.includes('outside verified')) {
                displayResult = 'UNVERIFIED — OUTSIDE FIGURE 1 RANGE';
              } else if (step.result.includes('Cannot compute')) {
                displayResult = 'NOT EXECUTED (UPSTREAM DATA MISSING)';
              }
            } else if (isDownstreamBlocked) {
              displayResult = 'NOT EXECUTED';
            }

            return (
              <div
                id={`calc-step-card-${step.stepNumber}`}
                key={`calc-step-${step.stepNumber}`}
                className={`card-base p-0 overflow-hidden border transition-colors ${
                  isOpen
                    ? isThisBlocked || isDownstreamBlocked
                      ? 'border-warning/40 bg-card'
                      : 'border-primary/40 bg-card'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                {/* Header / Summary Bar */}
                <button
                  onClick={() => toggle(step.stepNumber)}
                  className="w-full text-left p-3.5 md:p-4 hover:bg-muted/30 transition-colors space-y-2.5"
                >
                  {/* Top Row: STEP Badge + Title + Reference Clause + Chevron */}
                  <div className="flex items-center justify-between gap-3 min-w-0">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="font-mono-tech font-bold text-xs px-2 py-0.5 rounded bg-muted text-primary border border-border flex-shrink-0">
                        STEP 0{step.stepNumber}
                      </span>
                      <span className="text-xs md:text-sm font-bold text-foreground truncate sm:whitespace-normal">
                        {step.title}
                      </span>
                      <span className="hidden sm:inline-flex items-center text-[10px] font-mono-tech text-muted-foreground px-2 py-0.5 rounded bg-muted/80 border border-border/40 whitespace-nowrap flex-shrink-0 ml-auto sm:ml-0">
                        {clauseText}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="sm:hidden text-[10px] font-mono-tech text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                        {clauseText}
                      </span>
                      {isOpen ? (
                        <ChevronUp size={16} className="text-muted-foreground" />
                      ) : (
                        <ChevronDown size={16} className="text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Bottom Row: Full-Width Evaluated Result Bar */}
                  <div
                    className={`p-2 px-3 rounded text-xs font-mono-tech font-bold whitespace-normal break-words leading-relaxed border ${
                      isThisBlocked || isDownstreamBlocked
                        ? 'bg-warning/10 text-warning border-warning/30'
                        : 'bg-primary/5 text-primary border-primary/20'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex-shrink-0">
                        Evaluated Result:
                      </span>
                      <span className="text-foreground font-bold">{displayResult}</span>
                    </div>
                  </div>
                </button>

                {/* Notebook Content Detail */}
                {isOpen && (
                  <div className="px-4 md:px-5 pb-5 pt-3 border-t border-border/60 bg-muted/20 space-y-4 text-xs">
                    {/* Clause Header & Reference */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] pb-2 border-b border-border/60">
                      <span className="font-bold text-primary uppercase tracking-wider flex-shrink-0">
                        Reference Standard
                      </span>
                      <span className="font-mono-tech font-semibold text-foreground whitespace-normal break-words text-left sm:text-right">
                        {clauseText}
                      </span>
                    </div>

                    {/* Inputs Used Grid */}
                    {step.inputs && Object.keys(step.inputs).length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                          Input & Reference Parameters:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-[11px]">
                          {Object.entries(step.inputs).map(([k, v]) => (
                            <div key={k} className="p-2 rounded bg-card border border-border min-w-0">
                              <span className="text-muted-foreground block text-[10px] truncate" title={k}>{k}</span>
                              <span className="font-mono-tech font-bold text-foreground break-words whitespace-normal">{String(v)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Formula Block */}
                    {step.formula && !isDownstreamBlocked && (
                      <div className="p-3 rounded bg-card border border-border font-mono-tech text-xs text-foreground space-y-1 min-w-0">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest block">
                          Engineering Formula:
                        </span>
                        <p className="font-bold text-primary whitespace-pre-wrap break-words">{step.formula}</p>
                      </div>
                    )}

                    {/* Substitution Trace */}
                    {step.calculation && (
                      <div className="p-3 rounded bg-card border border-border font-mono-tech text-xs text-foreground space-y-1 min-w-0">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest block">
                          Mathematical Substitution & Trace:
                        </span>
                        <p className="whitespace-pre-line leading-relaxed break-words">
                          {isDownstreamBlocked
                            ? `Calculation step skipped because upstream Step 0${firstBlockedNumber} required missing reference data.`
                            : step.calculation}
                        </p>
                      </div>
                    )}

                    {/* Final Step Result */}
                    <div className="p-2.5 rounded bg-primary/5 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono-tech min-w-0">
                      <span className="font-bold text-primary uppercase tracking-wider text-[11px] flex-shrink-0">
                        Step 0{step.stepNumber} Evaluated Result:
                      </span>
                      <span className="font-extrabold text-foreground whitespace-normal break-words text-left sm:text-right">{displayResult}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}