'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface Step {
  number: number;
  label: string;
}

interface StepProgressProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepNumber: number) => void;
}

export default function StepProgress({ steps, currentStep, onStepClick }: StepProgressProps) {
  return (
    <div className="w-full bg-card border-b border-border pb-4 mb-6">
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => {
          const isCompleted = step.number < currentStep;
          const isActive = step.number === currentStep;
          const isClickable = Boolean(onStepClick);

          return (
            <React.Fragment key={`step-prog-${step.number}`}>
              <button
                type="button"
                onClick={() => onStepClick?.(step.number)}
                disabled={!isClickable}
                className={`flex items-center gap-2 text-left transition-all ${
                  isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded flex items-center justify-center font-mono-tech font-bold text-[11px] border transition-colors ${
                    isCompleted
                      ? 'bg-primary text-primary-foreground border-primary'
                      : isActive
                      ? 'bg-secondary text-secondary-foreground border-secondary'
                      : 'bg-muted text-muted-foreground border-border'
                  }`}
                >
                  {isCompleted ? <Check size={12} /> : `0${step.number}`}
                </div>
                <span
                  className={`text-xs font-bold uppercase tracking-wider ${
                    isActive
                      ? 'text-foreground font-mono-tech inline'
                      : 'text-muted-foreground hidden md:inline'
                  }`}
                >
                  {step.label}
                </span>
              </button>

              {idx < steps.length - 1 && <div className="flex-1 h-px bg-border/80 mx-2 sm:mx-3" />}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}