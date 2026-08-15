'use client';

import React, { useState, useRef } from 'react';
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  XCircle,
  ArrowDown,
  Sparkles,
  Layers,
  CheckSquare,
  Square,
} from 'lucide-react';
import type {
  MixDesignInput,
  MixDesignResult,
  AggregateSize,
  CementType,
} from '@/features/mix-design/types';
import { runMixDesignCalculation } from '@/features/mix-design/calculations';
import { getCentralizedMixStatus } from '@/features/mix-design/utils/status';

export interface RedesignAssistantProps {
  originalInput: MixDesignInput;
  originalResult: MixDesignResult;
  onAdoptRedesign: (newInput: MixDesignInput, newResult: MixDesignResult) => void;
  onClose: () => void;
}

export type StrategyKey = 'admixture' | 'slump' | 'shape' | 'cement' | 'msa';

export function RedesignAssistant({
  originalInput,
  originalResult,
  onAdoptRedesign,
  onClose,
}: RedesignAssistantProps) {
  const statusInfo = getCentralizedMixStatus(originalResult);
  const redesignedSectionRef = useRef<HTMLDivElement | null>(null);

  // Multi-Strategy Selection State
  const [selectedStrategies, setSelectedStrategies] = useState<StrategyKey[]>(['admixture']);

  const toggleStrategy = (strategy: StrategyKey) => {
    setIsCalculated(false);
    setSelectedStrategies((prev) =>
      prev.includes(strategy) ? prev.filter((s) => s !== strategy) : [...prev, strategy]
    );
  };

  // Strategy A — Admixture Water Reduction %
  const currentWaterRed = originalInput.materialProperties.admixture.waterReduction ?? 0;
  const [proposedWaterRed, setProposedWaterRed] = useState<number>(
    currentWaterRed > 0 ? Math.min(30, currentWaterRed + 5) : 15
  );

  // Strategy B — Slump Target
  const currentSlump = originalInput.designParameters.slump;
  const [proposedSlump, setProposedSlump] = useState<number>(
    currentSlump > 50 ? Math.max(50, currentSlump - 25) : 50
  );

  // Strategy C — Aggregate Shape
  const currentShape = originalInput.materialProperties.coarseAggregate.angularity ?? 'angular';
  const [proposedShape, setProposedShape] = useState<'angular' | 'sub-angular' | 'partially_rounded' | 'rounded'>(
    currentShape === 'angular' ? 'sub-angular' : 'angular'
  );

  // Strategy D — Cement Type
  const currentCementType = originalInput.materialProperties.cement.type;
  const [proposedCementType, setProposedCementType] = useState<CementType>(
    currentCementType === 'OPC_43' ? 'OPC_53' : 'OPC_43'
  );

  // Strategy E — MSA
  const currentMSA = originalInput.designParameters.maxAggregateSize;
  const [proposedMSA, setProposedMSA] = useState<AggregateSize>(
    currentMSA === 20 ? 40 : 20
  );

  // Proposed Recalculation State
  const [proposedResult, setProposedResult] = useState<{
    input: MixDesignInput;
    result: MixDesignResult;
  } | null>(null);

  const [isCalculated, setIsCalculated] = useState(false);

  // Execute multi-strategy calculation for proposed redesign
  const handleCalculateProposed = () => {
    if (selectedStrategies.length === 0) return;

    const clonedInput: MixDesignInput = JSON.parse(JSON.stringify(originalInput));
    const changedParamInfo: Record<string, { before: unknown; after: unknown }> = {};

    if (selectedStrategies.includes('admixture')) {
      clonedInput.materialProperties.admixture.waterReduction = Number(proposedWaterRed);
      if (!clonedInput.materialProperties.admixture.dosageBasis) {
        clonedInput.materialProperties.admixture.dosageBasis = 'percentage';
      }
      changedParamInfo['admixtureWaterReduction'] = { before: `${currentWaterRed}%`, after: `${proposedWaterRed}%` };
    }

    if (selectedStrategies.includes('slump')) {
      clonedInput.designParameters.slump = Number(proposedSlump);
      changedParamInfo['slump'] = { before: `${currentSlump} mm`, after: `${proposedSlump} mm` };
    }

    if (selectedStrategies.includes('shape')) {
      clonedInput.materialProperties.coarseAggregate.angularity = proposedShape;
      changedParamInfo['coarseAggregateAngularity'] = { before: currentShape, after: proposedShape };
    }

    if (selectedStrategies.includes('cement')) {
      clonedInput.materialProperties.cement.type = proposedCementType;
      changedParamInfo['cementType'] = { before: currentCementType, after: proposedCementType };
    }

    if (selectedStrategies.includes('msa')) {
      clonedInput.designParameters.maxAggregateSize = Number(proposedMSA) as AggregateSize;
      changedParamInfo['maxAggregateSize'] = { before: `${currentMSA} mm`, after: `${proposedMSA} mm` };
    }

    const calcResult = runMixDesignCalculation(clonedInput);

    calcResult.redesignMetadata = {
      parentProjectId: undefined,
      attemptNumber: 1,
      originalFailureReason: statusInfo.reason,
      remediationStrategy: selectedStrategies.join(', '),
      remediationLog: [
        `Multi-Strategy Redesign: ${selectedStrategies.map((s) => s.toUpperCase()).join(', ')}`,
        `Changed: ${JSON.stringify(changedParamInfo)}`,
      ],
      changedParameters: changedParamInfo,
    };

    setProposedResult({ input: clonedInput, result: calcResult });
    setIsCalculated(true);
  };

  const proposedStatusInfo = proposedResult ? getCentralizedMixStatus(proposedResult.result) : null;
  const isAdoptable = isCalculated && proposedStatusInfo && proposedStatusInfo.status === 'COMPLIANT';

  // Deviation calculation for cement limit
  const maxCementLimit = 450;
  const cementDeviation = originalResult.cement > maxCementLimit ? originalResult.cement - maxCementLimit : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-background/80 backdrop-blur-xs">
      <div className="bg-card border border-border rounded-sm shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col font-sans overflow-hidden">
        {/* STICKY HEADER */}
        <div className="p-4 border-b border-border bg-muted/40 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-sm bg-warning/15 text-warning border border-warning/30">
              <Wrench size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-foreground font-mono-tech uppercase tracking-wider">
                  Fix &amp; Redesign — Engineering Workspace
                </h2>
                <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold font-mono-tech bg-error/15 text-error border border-error/30">
                  DESIGN COMPLIANCE ISSUE
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground font-mono-tech mt-0.5">
                Project: <strong className="text-foreground">{originalInput.projectDetails.projectName || 'Untitled Mix'}</strong> • IS 10262:2019 Multi-Strategy Remediation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-xs font-mono-tech px-3 py-1.5 border border-border rounded-sm hover:bg-muted transition-colors"
          >
            Close
          </button>
        </div>

        {/* SCROLLABLE BODY REGION */}
        <div className="p-5 space-y-6 overflow-y-auto flex-1 text-xs">
          {/* SECTION 1: DESIGN COMPLIANCE ISSUE */}
          <div className="p-4 rounded-lg bg-error/5 border border-error/30 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-error/20">
              <span className="font-bold text-error uppercase font-mono-tech text-xs flex items-center gap-1.5">
                <AlertTriangle size={16} />
                1. Design Compliance Issue
              </span>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono-tech font-bold bg-error/20 text-error">
                LIMIT EXCEEDED
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono-tech text-xs pt-1">
              <div>
                <span className="text-[10px] text-muted-foreground block font-sans">Governing Parameter</span>
                <span className="font-bold text-foreground">Cement Content</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block font-sans">Calculated Actual</span>
                <span className="font-bold text-error">{originalResult.cement} kg/m³</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block font-sans">Maximum Permitted</span>
                <span className="font-bold text-foreground">450 kg/m³ (IS 456)</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block font-sans">Deviation</span>
                <span className="font-bold text-error">+{cementDeviation} kg/m³ (FAIL)</span>
              </div>
            </div>

            <p className="text-xs text-foreground/90 font-sans leading-relaxed pt-1">
              <strong>Engineering Diagnostic:</strong> The original mix requires <strong>{originalResult.cement} kg/m³</strong> of cement to meet target strength and workability, exceeding the IS 456 maximum limit of 450 kg/m³ by <strong>+{cementDeviation} kg/m³</strong>. Select one or more correction strategies below to reduce water/cement demand while satisfying structural compliance.
            </p>
          </div>

          {/* SECTION 2: MULTI-STRATEGY CORRECTION SELECTION */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-border">
              <h3 className="font-bold text-primary uppercase font-mono-tech text-xs flex items-center gap-2">
                <Layers size={16} />
                2. Select Correction Strategies
              </h3>
              <span className="text-[10px] text-muted-foreground font-mono-tech">
                Selected: <strong className="text-primary">{selectedStrategies.length}</strong> strategy(ies)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {/* Strategy A */}
              <div
                onClick={() => toggleStrategy('admixture')}
                className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                  selectedStrategies.includes('admixture')
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border bg-card hover:border-muted-foreground/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold font-mono-tech text-foreground text-xs flex items-center gap-2">
                    {selectedStrategies.includes('admixture') ? (
                      <CheckSquare size={16} className="text-primary" />
                    ) : (
                      <Square size={16} className="text-muted-foreground" />
                    )}
                    Admixture Water Reduction %
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5 font-sans pl-6">
                  Increase superplasticizer dosage to achieve higher water reduction %, lowering required design water and cement.
                </p>
              </div>

              {/* Strategy B */}
              <div
                onClick={() => toggleStrategy('slump')}
                className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                  selectedStrategies.includes('slump')
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border bg-card hover:border-muted-foreground/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold font-mono-tech text-foreground text-xs flex items-center gap-2">
                    {selectedStrategies.includes('slump') ? (
                      <CheckSquare size={16} className="text-primary" />
                    ) : (
                      <Square size={16} className="text-muted-foreground" />
                    )}
                    Target Slump Adjustment
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5 font-sans pl-6">
                  Reduce target workability slump (e.g. 100 mm → 50 mm) to lower base water requirement by 3% per 25 mm step.
                </p>
              </div>

              {/* Strategy C */}
              <div
                onClick={() => toggleStrategy('shape')}
                className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                  selectedStrategies.includes('shape')
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border bg-card hover:border-muted-foreground/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold font-mono-tech text-foreground text-xs flex items-center gap-2">
                    {selectedStrategies.includes('shape') ? (
                      <CheckSquare size={16} className="text-primary" />
                    ) : (
                      <Square size={16} className="text-muted-foreground" />
                    )}
                    Aggregate Shape Selection
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5 font-sans pl-6">
                  Use sub-angular or rounded coarse aggregates to lower void ratio and reduce water demand by 10 to 20 kg/m³.
                </p>
              </div>

              {/* Strategy D */}
              <div
                onClick={() => toggleStrategy('cement')}
                className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                  selectedStrategies.includes('cement')
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border bg-card hover:border-muted-foreground/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold font-mono-tech text-foreground text-xs flex items-center gap-2">
                    {selectedStrategies.includes('cement') ? (
                      <CheckSquare size={16} className="text-primary" />
                    ) : (
                      <Square size={16} className="text-muted-foreground" />
                    )}
                    Cement Strength Grade
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5 font-sans pl-6">
                  Upgrade cement class (e.g. OPC 43 → OPC 53) to shift strength curves upward and allow higher W/C ratio.
                </p>
              </div>

              {/* Strategy E */}
              <div
                onClick={() => toggleStrategy('msa')}
                className={`p-3.5 rounded-lg border cursor-pointer transition-all md:col-span-2 ${
                  selectedStrategies.includes('msa')
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border bg-card hover:border-muted-foreground/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold font-mono-tech text-foreground text-xs flex items-center gap-2">
                    {selectedStrategies.includes('msa') ? (
                      <CheckSquare size={16} className="text-primary" />
                    ) : (
                      <Square size={16} className="text-muted-foreground" />
                    )}
                    Maximum Nominal Aggregate Size (MSA)
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5 font-sans pl-6">
                  Increase maximum aggregate size (e.g. 20 mm → 40 mm) to reduce base water requirement from 186 to 165 kg/m³.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 3: PROPOSED CHANGES CONFIGURATION */}
          {selectedStrategies.length > 0 && (
            <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-4 font-mono-tech">
              <div className="flex items-center justify-between pb-2 border-b border-primary/20">
                <span className="font-bold text-primary uppercase text-xs">
                  3. Proposed Strategy Parameters
                </span>
                <span className="text-[10px] text-muted-foreground font-sans">
                  Configure proposed values for all selected strategies before calculating
                </span>
              </div>

              <div className="space-y-3">
                {selectedStrategies.includes('admixture') && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded bg-card border border-border">
                    <div>
                      <span className="font-bold text-foreground text-xs block font-mono-tech">Water Reduction %</span>
                      <span className="text-muted-foreground text-[11px] font-sans">Original: {currentWaterRed}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={35}
                        value={proposedWaterRed}
                        onChange={(e) => { setProposedWaterRed(Number(e.target.value)); setIsCalculated(false); }}
                        className="w-20 px-2 py-1 border border-border bg-background text-foreground rounded text-right font-bold text-xs"
                      />
                      <span className="font-bold">%</span>
                    </div>
                  </div>
                )}

                {selectedStrategies.includes('slump') && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded bg-card border border-border">
                    <div>
                      <span className="font-bold text-foreground text-xs block font-mono-tech">Target Slump</span>
                      <span className="text-muted-foreground text-[11px] font-sans">Original: {currentSlump} mm</span>
                    </div>
                    <select
                      value={proposedSlump}
                      onChange={(e) => { setProposedSlump(Number(e.target.value)); setIsCalculated(false); }}
                      className="px-3 py-1 border border-border bg-background text-foreground rounded font-bold text-xs"
                    >
                      <option value={50}>50 mm</option>
                      <option value={75}>75 mm</option>
                      <option value={100}>100 mm</option>
                      <option value={120}>120 mm</option>
                    </select>
                  </div>
                )}

                {selectedStrategies.includes('shape') && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded bg-card border border-border">
                    <div>
                      <span className="font-bold text-foreground text-xs block font-mono-tech">Coarse Aggregate Shape</span>
                      <span className="text-muted-foreground text-[11px] font-sans">Original: {currentShape}</span>
                    </div>
                    <select
                      value={proposedShape}
                      onChange={(e) => { setProposedShape(e.target.value as any); setIsCalculated(false); }}
                      className="px-3 py-1 border border-border bg-background text-foreground rounded font-bold text-xs"
                    >
                      <option value="angular">Angular (0 kg/m³ offset)</option>
                      <option value="sub-angular">Sub-Angular (-10 kg/m³ offset)</option>
                      <option value="partially_rounded">Partially Rounded (-15 kg/m³ offset)</option>
                      <option value="rounded">Rounded (-20 kg/m³ offset)</option>
                    </select>
                  </div>
                )}

                {selectedStrategies.includes('cement') && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded bg-card border border-border">
                    <div>
                      <span className="font-bold text-foreground text-xs block font-mono-tech">Cement Class / Grade</span>
                      <span className="text-muted-foreground text-[11px] font-sans">Original: {currentCementType}</span>
                    </div>
                    <select
                      value={proposedCementType}
                      onChange={(e) => { setProposedCementType(e.target.value as CementType); setIsCalculated(false); }}
                      className="px-3 py-1 border border-border bg-background text-foreground rounded font-bold text-xs"
                    >
                      <option value="OPC_43">OPC 43 (Curve 2)</option>
                      <option value="OPC_53">OPC 53 (Curve 3)</option>
                      <option value="PPC">PPC (Curve 2)</option>
                      <option value="PSC">PSC (Curve 2)</option>
                    </select>
                  </div>
                )}

                {selectedStrategies.includes('msa') && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded bg-card border border-border">
                    <div>
                      <span className="font-bold text-foreground text-xs block font-mono-tech">Maximum Aggregate Size (MSA)</span>
                      <span className="text-muted-foreground text-[11px] font-sans">Original: {currentMSA} mm</span>
                    </div>
                    <select
                      value={proposedMSA}
                      onChange={(e) => { setProposedMSA(Number(e.target.value) as AggregateSize); setIsCalculated(false); }}
                      className="px-3 py-1 border border-border bg-background text-foreground rounded font-bold text-xs"
                    >
                      <option value={10}>10 mm (208 kg/m³ base water)</option>
                      <option value={20}>20 mm (186 kg/m³ base water)</option>
                      <option value={40}>40 mm (165 kg/m³ base water)</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleCalculateProposed}
                  className="btn-primary flex items-center gap-2 text-xs font-bold font-mono-tech py-2.5 px-6 shadow-sm"
                >
                  <RefreshCw size={14} className={isCalculated ? '' : 'animate-spin'} />
                  <span>Calculate Redesigned Mix</span>
                </button>
              </div>
            </div>
          )}

          {/* VISUAL TRANSITION BANNER — REDESIGNED MIX READY */}
          {isCalculated && proposedResult && (
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-between font-mono-tech">
              <div className="flex items-center gap-3">
                <Sparkles className="text-primary animate-pulse flex-shrink-0" size={20} />
                <div>
                  <h4 className="font-extrabold text-foreground text-xs uppercase tracking-wider">
                    Redesigned Mix Recalculated Successfully
                  </h4>
                  <p className="text-[11px] text-muted-foreground font-sans mt-0.5">
                    Proposed mix proportions and compliance checks have been generated below.
                  </p>
                </div>
              </div>
              <button
                onClick={() => redesignedSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="btn-primary text-xs font-bold font-mono-tech py-2 px-4 flex items-center gap-1.5 shadow-sm"
              >
                <span>View Redesigned Mix</span>
                <ArrowDown size={14} />
              </button>
            </div>
          )}

          {/* SECTION 4: REDESIGNED MIX & BEFORE-AFTER COMPARISON */}
          {isCalculated && proposedResult && proposedStatusInfo && (
            <div ref={redesignedSectionRef} className="space-y-5 pt-4 border-t border-border">
              <div className="flex items-center justify-between pb-2 border-b border-border font-mono-tech">
                <div>
                  <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider block">
                    4. Redesigned Mix Result
                  </h3>
                  <span className="text-[10px] text-muted-foreground font-sans">
                    Proposed mix proportions after applying selected correction strategies
                  </span>
                </div>
                <span
                  className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider border flex items-center gap-1.5 ${
                    proposedStatusInfo.status === 'COMPLIANT'
                      ? 'bg-success/15 text-success border-success/30'
                      : 'bg-error/15 text-error border-error/30'
                  }`}
                >
                  {proposedStatusInfo.status === 'COMPLIANT' ? (
                    <>
                      <CheckCircle2 size={14} />
                      <span>REDESIGNED MIX COMPLIANT</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={14} />
                      <span>REDESIGNED MIX NON-COMPLIANT</span>
                    </>
                  )}
                </span>
              </div>

              {/* COMPARSION TABLE */}
              <div className="p-4 rounded-lg border border-border bg-card shadow-sm font-mono-tech overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/60 text-muted-foreground uppercase border-b border-border text-[10px]">
                      <th className="py-2.5 px-3 font-bold">Parameter</th>
                      <th className="py-2.5 px-3 font-bold text-center">Original Value</th>
                      <th className="py-2.5 px-3 font-bold text-center">Proposed Value</th>
                      <th className="py-2.5 px-3 font-bold text-center">Difference</th>
                      <th className="py-2.5 px-3 font-bold text-right">Compliance Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    <tr>
                      <td className="py-2.5 px-3 text-foreground font-sans font-medium">Design Water Content</td>
                      <td className="py-2.5 px-3 text-center text-muted-foreground">{originalResult.water} kg/m³</td>
                      <td className="py-2.5 px-3 text-center font-bold text-foreground">{proposedResult.result.water} kg/m³</td>
                      <td className="py-2.5 px-3 text-center font-bold text-primary font-mono">
                        {proposedResult.result.water - originalResult.water} kg/m³
                      </td>
                      <td className="py-2.5 px-3 text-right text-success font-bold">PASS</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 text-foreground font-sans font-medium">Water-Cement Ratio (W/C)</td>
                      <td className="py-2.5 px-3 text-center text-muted-foreground">{originalResult.wcRatio ? originalResult.wcRatio.toFixed(4) : '—'}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-foreground">{proposedResult.result.wcRatio ? proposedResult.result.wcRatio.toFixed(4) : '—'}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-primary font-mono">
                        {proposedResult.result.wcRatio && originalResult.wcRatio ? (proposedResult.result.wcRatio - originalResult.wcRatio).toFixed(4) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right text-success font-bold">PASS</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 text-foreground font-sans font-medium">Calculated Cement Content</td>
                      <td className="py-2.5 px-3 text-center text-error font-bold">{originalResult.cement} kg/m³</td>
                      <td className={`py-2.5 px-3 text-center font-bold ${proposedResult.result.cement > 450 ? 'text-error' : 'text-success'}`}>
                        {proposedResult.result.cement} kg/m³
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-primary font-mono">
                        {proposedResult.result.cement - originalResult.cement} kg/m³
                      </td>
                      <td className={`py-2.5 px-3 text-right font-bold ${proposedResult.result.cement > 450 ? 'text-error' : 'text-success'}`}>
                        {proposedResult.result.cement > 450 ? 'FAIL (>450 kg/m³)' : 'PASS (≤450 kg/m³)'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 text-foreground font-sans font-medium">Fine Aggregate Mass</td>
                      <td className="py-2.5 px-3 text-center text-muted-foreground">{originalResult.fineAggregate} kg/m³</td>
                      <td className="py-2.5 px-3 text-center font-bold text-foreground">{proposedResult.result.fineAggregate} kg/m³</td>
                      <td className="py-2.5 px-3 text-center font-bold text-primary font-mono">
                        {proposedResult.result.fineAggregate - originalResult.fineAggregate} kg/m³
                      </td>
                      <td className="py-2.5 px-3 text-right text-success font-bold">PASS</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 text-foreground font-sans font-medium">Coarse Aggregate Mass</td>
                      <td className="py-2.5 px-3 text-center text-muted-foreground">{originalResult.coarseAggregate} kg/m³</td>
                      <td className="py-2.5 px-3 text-center font-bold text-foreground">{proposedResult.result.coarseAggregate} kg/m³</td>
                      <td className="py-2.5 px-3 text-center font-bold text-primary font-mono">
                        {proposedResult.result.coarseAggregate - originalResult.coarseAggregate} kg/m³
                      </td>
                      <td className="py-2.5 px-3 text-right text-success font-bold">PASS</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Engineering Remediated Summary Box */}
              <div className="p-3.5 rounded-lg text-xs font-sans bg-muted/40 border border-border space-y-1 font-mono-tech">
                <span className="font-bold text-foreground block">Engineering Redesign Assessment:</span>
                {proposedStatusInfo.status === 'COMPLIANT' ? (
                  <p className="text-foreground/90 font-sans leading-relaxed">
                    Applying selected strategies ({selectedStrategies.map((s) => s.toUpperCase()).join(', ')}) reduces total water/cement demand, bringing cement content from <strong>{originalResult.cement} kg/m³</strong> down to <strong>{proposedResult.result.cement} kg/m³</strong>. The proposed mix satisfies IS 456 Clause 8.2.4.2 maximum cement limit (≤450 kg/m³) and can replace the original mix design.
                  </p>
                ) : (
                  <p className="text-error font-sans font-medium leading-relaxed">
                    The combined adjustments reduced cement demand to <strong>{proposedResult.result.cement} kg/m³</strong>, but still exceed the 450 kg/m³ limit. Select additional strategies or adjust proposed parameters above.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* STICKY FOOTER ACTION BAR */}
        <div className="p-4 border-t border-border bg-muted/40 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => { setSelectedStrategies([]); setIsCalculated(false); setProposedResult(null); }}
            className="btn-secondary text-xs font-mono-tech py-2 px-4"
          >
            Reset Strategies
          </button>

          <div className="flex items-center gap-3">
            {!isAdoptable && isCalculated && (
              <span className="text-[11px] text-error font-mono-tech font-semibold hidden sm:inline-block">
                Proposed mix must be COMPLIANT to adopt
              </span>
            )}
            <button
              onClick={() => {
                if (isAdoptable && proposedResult) {
                  onAdoptRedesign(proposedResult.input, proposedResult.result);
                }
              }}
              disabled={!isAdoptable}
              className={`btn-primary flex items-center gap-2 text-xs font-bold font-mono-tech py-2.5 px-6 shadow-sm ${
                !isAdoptable ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <CheckCircle2 size={16} />
              <span>Adopt Redesigned Mix</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
