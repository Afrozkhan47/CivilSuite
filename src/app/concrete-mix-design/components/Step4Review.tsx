'use client';

import React from 'react';
import { AlertTriangle, ArrowLeft, Calculator, CheckCircle2, Edit3, ShieldCheck } from 'lucide-react';
import type { MixDesignInput } from '@/features/mix-design/types';
import {
  lookupBaseWaterContent,
  lookupBaseWaterContentHighStrength,
  selectCalculationMethod,
} from '@/features/mix-design/reference-data';

interface Step4Props {
  input: MixDesignInput;
  onCalculate: () => void;
  onPrev: () => void;
  onEditStep: (step: number) => void;
}

export default function Step4Review({ input, onCalculate, onPrev, onEditStep }: Step4Props) {
  const { projectDetails, designParameters, materialProperties } = input;

  const method = selectCalculationMethod(designParameters.concreteGrade);
  const baseWater = method.method === 'high-strength'
    ? lookupBaseWaterContentHighStrength(designParameters.maxAggregateSize)
    : lookupBaseWaterContent(designParameters.maxAggregateSize);

  const isBlocked = baseWater === null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-card border border-border rounded-sm shadow-xs overflow-hidden">
        {/* Technical Worksheet Header */}
        <div className="bg-muted/50 px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-sm bg-primary/10 flex items-center justify-center text-primary font-bold">
              <CheckCircle2 size={15} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground tracking-tight">
                04. PRE-CALCULATION SPECIFICATION VERIFICATION WORKSHEET
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                IS 10262:2019 & IS 456:2000 Structural Parameters Validation Audit
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block font-mono-tech text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-background px-2.5 py-1 rounded-sm border border-border">
            SECTION 04
          </span>
        </div>

        {/* Technical Verification Tables Grid */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            {/* Sheet 1: Project Metadata */}
            <div className="border border-border rounded-sm bg-background p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="font-mono-tech font-bold text-xs text-primary uppercase">PROJECT METADATA</span>
                <button
                  type="button"
                  onClick={() => onEditStep(1)}
                  className="text-muted-foreground hover:text-primary flex items-center gap-1 text-[10px] font-mono-tech font-bold"
                >
                  <Edit3 size={11} /> EDIT
                </button>
              </div>
              <dl className="space-y-2">
                <div>
                  <dt className="text-muted-foreground text-[10px] uppercase font-mono-tech">Title</dt>
                  <dd className="font-bold text-foreground truncate">{projectDetails.projectName}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-[10px] uppercase font-mono-tech">Client</dt>
                  <dd className="font-medium text-foreground">{projectDetails.clientName}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-[10px] uppercase font-mono-tech">Engineer</dt>
                  <dd className="font-medium text-foreground">{projectDetails.engineerName}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-[10px] uppercase font-mono-tech">Date & Location</dt>
                  <dd className="font-mono-tech text-foreground">{projectDetails.date} ({projectDetails.location})</dd>
                </div>
              </dl>
            </div>

            {/* Sheet 2: Design Basis */}
            <div className="border border-border rounded-sm bg-background p-4 space-y-3 font-mono-tech">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="font-bold text-xs text-primary uppercase">STRUCTURAL DESIGN BASIS</span>
                <button
                  type="button"
                  onClick={() => onEditStep(2)}
                  className="text-muted-foreground hover:text-primary flex items-center gap-1 text-[10px] font-mono-tech font-bold"
                >
                  <Edit3 size={11} /> EDIT
                </button>
              </div>
              <dl className="space-y-2">
                <div>
                  <dt className="text-muted-foreground text-[10px] uppercase font-sans">Concrete Grade</dt>
                  <dd className="font-bold text-primary text-sm">{designParameters.concreteGrade}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-[10px] uppercase font-sans">Exposure & Slump</dt>
                  <dd className="text-foreground capitalize">{designParameters.exposureCondition.replace('_', ' ')} | {designParameters.slump} mm</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-[10px] uppercase font-sans">Max Aggregate Size</dt>
                  <dd className="text-foreground">{designParameters.maxAggregateSize} mm MSA | FA Zone {designParameters.faZone}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-[10px] uppercase font-sans">Placement & Air</dt>
                  <dd className="text-foreground">
                    {designParameters.isPumpedConcrete ? 'PUMPED' : 'NON-PUMPED'} | {designParameters.isAirEntrained ? `AIR (${designParameters.targetAirContent}%)` : 'NON-AIR-ENTRAINED'}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Sheet 3: Material Specifications */}
            <div className="border border-border rounded-sm bg-background p-4 space-y-3 font-mono-tech">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="font-bold text-xs text-primary uppercase">MATERIAL SPECIFICATIONS</span>
                <button
                  type="button"
                  onClick={() => onEditStep(3)}
                  className="text-muted-foreground hover:text-primary flex items-center gap-1 text-[10px] font-mono-tech font-bold"
                >
                  <Edit3 size={11} /> EDIT
                </button>
              </div>
              <dl className="space-y-2">
                <div>
                  <dt className="text-muted-foreground text-[10px] uppercase font-sans">Cement Type & SG</dt>
                  <dd className="text-foreground">
                    {materialProperties.cement.type.replace('_', ' ')} (SG {materialProperties.cement.specificGravity})
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-[10px] uppercase font-sans">Fine Aggregate</dt>
                  <dd className="text-foreground">
                    SG {materialProperties.fineAggregate.specificGravity} | WA {materialProperties.fineAggregate.waterAbsorption}%
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-[10px] uppercase font-sans">Coarse Aggregate</dt>
                  <dd className="text-foreground">
                    SG {materialProperties.coarseAggregate.specificGravity} | WA {materialProperties.coarseAggregate.waterAbsorption}%
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-[10px] uppercase font-sans">Chemical Admixture</dt>
                  <dd className="text-foreground">
                    {materialProperties.admixture?.dosage ? `${materialProperties.admixture.type || 'Admix'} (${materialProperties.admixture.dosage} ${materialProperties.admixture.dosageBasis === 'liters_per_m3' ? 'L/m³' : '%'})` : 'None'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Execution Box */}
          {isBlocked ? (
            <div className="p-4 rounded-sm border border-warning/40 bg-warning/5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle size={22} className="text-warning flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-warning font-mono-tech uppercase tracking-wider">
                    REFERENCE DATA VALIDATION — BLOCKED
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Selected aggregate size is not supported by the configured IS 10262:2019 reference data.
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled
                className="btn-primary py-2.5 px-5 text-xs font-bold font-mono-tech uppercase tracking-wider flex items-center gap-2 flex-shrink-0 shadow-xs opacity-50 cursor-not-allowed"
              >
                <Calculator size={14} />
                <span>EXECUTE IS 10262 PROPORTIONING CALCULATION</span>
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-sm border border-primary/30 bg-primary/5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ShieldCheck size={22} className="text-primary flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-foreground font-mono-tech uppercase tracking-wider">CALCULATION READINESS — VERIFIED</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Parameters validated per IS 10262:2019 standards. Ready for proportioning engine execution.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onCalculate}
                className="btn-primary py-2.5 px-5 text-xs font-bold font-mono-tech uppercase tracking-wider flex items-center gap-2 flex-shrink-0 shadow-xs"
              >
                <Calculator size={14} />
                <span>EXECUTE IS 10262 PROPORTIONING CALCULATION</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-2">
        <button type="button" onClick={onPrev} className="btn-secondary flex items-center gap-2">
          <ArrowLeft size={14} />
          <span>Back to Materials</span>
        </button>
      </div>
    </div>
  );
}