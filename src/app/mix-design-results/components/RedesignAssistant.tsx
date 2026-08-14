'use client';

import React, { useState } from 'react';
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
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

  const [selectedStrategy, setSelectedStrategy] = useState<StrategyKey | null>(null);

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

  // Calculate proposed input using existing engine
  const handleCalculateProposed = () => {
    if (!selectedStrategy) return;

    // Deep clone input to avoid mutating original
    const clonedInput: MixDesignInput = JSON.parse(JSON.stringify(originalInput));

    if (selectedStrategy === 'admixture') {
      clonedInput.materialProperties.admixture.waterReduction = Number(proposedWaterRed);
      // Ensure dosage basis is percentage if not specified
      if (!clonedInput.materialProperties.admixture.dosageBasis) {
        clonedInput.materialProperties.admixture.dosageBasis = 'percentage';
      }
    } else if (selectedStrategy === 'slump') {
      clonedInput.designParameters.slump = Number(proposedSlump);
    } else if (selectedStrategy === 'shape') {
      clonedInput.materialProperties.coarseAggregate.angularity = proposedShape;
    } else if (selectedStrategy === 'cement') {
      clonedInput.materialProperties.cement.type = proposedCementType;
    } else if (selectedStrategy === 'msa') {
      clonedInput.designParameters.maxAggregateSize = Number(proposedMSA) as AggregateSize;
    }

    // Execute EXISTING calculation engine — DO NOT estimate in UI
    const calcResult = runMixDesignCalculation(clonedInput);

    // Attach redesign metadata
    const changedParamInfo: Record<string, { before: unknown; after: unknown }> = {};
    if (selectedStrategy === 'admixture') {
      changedParamInfo['admixtureWaterReduction'] = {
        before: `${currentWaterRed}%`,
        after: `${proposedWaterRed}%`,
      };
    } else if (selectedStrategy === 'slump') {
      changedParamInfo['slump'] = { before: `${currentSlump} mm`, after: `${proposedSlump} mm` };
    } else if (selectedStrategy === 'shape') {
      changedParamInfo['coarseAggregateAngularity'] = { before: currentShape, after: proposedShape };
    } else if (selectedStrategy === 'cement') {
      changedParamInfo['cementType'] = { before: currentCementType, after: proposedCementType };
    } else if (selectedStrategy === 'msa') {
      changedParamInfo['maxAggregateSize'] = { before: `${currentMSA} mm`, after: `${proposedMSA} mm` };
    }

    calcResult.redesignMetadata = {
      parentProjectId: undefined,
      attemptNumber: 1,
      originalFailureReason: statusInfo.reason,
      remediationStrategy: selectedStrategy,
      remediationLog: [
        `Redesign Strategy: ${selectedStrategy.toUpperCase()}`,
        `Changed: ${JSON.stringify(changedParamInfo)}`,
      ],
      changedParameters: changedParamInfo,
    };

    setProposedResult({
      input: clonedInput,
      result: calcResult,
    });
    setIsCalculated(true);
  };

  const proposedStatusInfo = proposedResult ? getCentralizedMixStatus(proposedResult.result) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-card border border-border rounded-sm shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col font-sans">
        {/* Header */}
        <div className="p-4 border-b border-border bg-card flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="text-warning h-5 w-5" />
            <div>
              <h2 className="text-sm font-extrabold text-foreground uppercase font-mono-tech tracking-wider">
                Controlled Non-Compliant Mix Redesign Assistant
              </h2>
              <p className="text-[11px] text-muted-foreground font-mono-tech">
                IS 10262:2019 Engineering Remediation Strategy Selection
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-xs font-mono-tech px-2 py-1 border border-border rounded-sm"
          >
            Close
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* SECTION 1 & 2: CURRENT MIX & GOVERNING FAILURE */}
          <div className="p-4 rounded-sm border border-error/40 bg-error/5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-error/20">
              <span className="text-xs font-bold text-error uppercase font-mono-tech tracking-wider flex items-center gap-1.5">
                <AlertTriangle size={14} />
                Governing Failure Constraint
              </span>
              <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono-tech font-bold bg-error/20 text-error self-start sm:self-auto">
                {statusInfo.heroBadge}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono-tech pt-1">
              <div>
                <span className="text-[10px] text-muted-foreground block font-sans">Grade / Exposure</span>
                <span className="font-bold text-foreground">{originalInput.designParameters.concreteGrade} • {originalInput.designParameters.exposureCondition}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block font-sans">Water / W/C</span>
                <span className="font-bold text-foreground">{originalResult.water} kg/m³ • {originalResult.wcRatio ? originalResult.wcRatio.toFixed(4) : '—'}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block font-sans">Calculated Cement</span>
                <span className="font-bold text-error">{originalResult.cement} kg/m³</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block font-sans">Max Permitted Limit</span>
                <span className="font-bold text-foreground">450 kg/m³</span>
              </div>
            </div>

            <p className="text-xs text-foreground font-mono-tech font-semibold pt-1">
              REASON: {statusInfo.reason}
            </p>
          </div>

          {/* SECTION 3: SELECT REMEDIATION STRATEGY */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-primary uppercase font-mono-tech tracking-wider border-b border-border pb-2">
              Select Engineering Remediation Strategy
            </h3>
            <p className="text-xs text-muted-foreground">
              Select one approved parameter adjustment strategy below. The engineer must explicitly approve the proposed values before recalculation.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {/* STRATEGY A: Admixture Water Reduction */}
              <div
                onClick={() => { setSelectedStrategy('admixture'); setIsCalculated(false); }}
                className={`p-3.5 rounded-sm border cursor-pointer transition-all space-y-2 ${
                  selectedStrategy === 'admixture'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border bg-background hover:border-muted-foreground/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs font-mono-tech text-foreground">Strategy A: Increase Admixture Water Reduction</span>
                  <input
                    type="radio"
                    checked={selectedStrategy === 'admixture'}
                    onChange={() => {}}
                    className="accent-primary"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Increases plasticizer/superplasticizer water reduction %, reducing required design water and cement demand.
                </p>
                {selectedStrategy === 'admixture' && (
                  <div className="pt-2 border-t border-border space-y-2 text-xs font-mono-tech" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Current: {currentWaterRed}%</span>
                      <div className="flex items-center gap-1.5">
                        <label className="font-bold text-foreground">Proposed Water Reduction:</label>
                        <input
                          type="number"
                          min={0}
                          max={35}
                          step={1}
                          value={proposedWaterRed}
                          onChange={(e) => { setProposedWaterRed(Number(e.target.value)); setIsCalculated(false); }}
                          className="w-16 px-2 py-0.5 border border-border bg-background text-foreground rounded-sm text-right font-mono font-bold"
                        />
                        <span className="font-bold">%</span>
                      </div>
                    </div>
                    <div className="p-2 rounded-sm bg-warning/10 border border-warning/30 text-[10px] text-warning font-sans">
                      ⚠️ <strong>Caution:</strong> Achievable water reduction must be verified against the selected admixture manufacturer datasheet.
                    </div>
                  </div>
                )}
              </div>

              {/* STRATEGY B: Slump Target */}
              <div
                onClick={() => { setSelectedStrategy('slump'); setIsCalculated(false); }}
                className={`p-3.5 rounded-sm border cursor-pointer transition-all space-y-2 ${
                  selectedStrategy === 'slump'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border bg-background hover:border-muted-foreground/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs font-mono-tech text-foreground">Strategy B: Reduce Target Slump</span>
                  <input
                    type="radio"
                    checked={selectedStrategy === 'slump'}
                    onChange={() => {}}
                    className="accent-primary"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Reduces specified workability slump, reducing base water content by 3% per 25 mm reduction step.
                </p>
                {selectedStrategy === 'slump' && (
                  <div className="pt-2 border-t border-border space-y-2 text-xs font-mono-tech" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Current: {currentSlump} mm</span>
                      <div className="flex items-center gap-1.5">
                        <label className="font-bold text-foreground">Proposed Slump:</label>
                        <select
                          value={proposedSlump}
                          onChange={(e) => { setProposedSlump(Number(e.target.value)); setIsCalculated(false); }}
                          className="px-2 py-0.5 border border-border bg-background text-foreground rounded-sm font-mono font-bold"
                        >
                          <option value={50}>50 mm</option>
                          <option value={75}>75 mm</option>
                          <option value={100}>100 mm</option>
                          <option value={120}>120 mm</option>
                        </select>
                      </div>
                    </div>
                    <div className="p-2 rounded-sm bg-warning/10 border border-warning/30 text-[10px] text-warning font-sans">
                      ⚠️ <strong>Caution:</strong> Reduced slump must remain adequate for compaction equipment and structural placement conditions.
                    </div>
                  </div>
                )}
              </div>

              {/* STRATEGY C: Aggregate Shape */}
              <div
                onClick={() => { setSelectedStrategy('shape'); setIsCalculated(false); }}
                className={`p-3.5 rounded-sm border cursor-pointer transition-all space-y-2 ${
                  selectedStrategy === 'shape'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border bg-background hover:border-muted-foreground/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs font-mono-tech text-foreground">Strategy C: Aggregate Shape Selection</span>
                  <input
                    type="radio"
                    checked={selectedStrategy === 'shape'}
                    onChange={() => {}}
                    className="accent-primary"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Changes aggregate angularity classification (e.g. sub-angular or rounded), reducing water demand by 10 to 20 kg/m³.
                </p>
                {selectedStrategy === 'shape' && (
                  <div className="pt-2 border-t border-border space-y-2 text-xs font-mono-tech" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Current: {currentShape}</span>
                      <div className="flex items-center gap-1.5">
                        <label className="font-bold text-foreground">Proposed Shape:</label>
                        <select
                          value={proposedShape}
                          onChange={(e) => { setProposedShape(e.target.value as any); setIsCalculated(false); }}
                          className="px-2 py-0.5 border border-border bg-background text-foreground rounded-sm font-mono font-bold text-xs"
                        >
                          <option value="angular">Angular (0 kg/m³)</option>
                          <option value="sub-angular">Sub-Angular (-10 kg/m³)</option>
                          <option value="partially_rounded">Partially Rounded (-15 kg/m³)</option>
                          <option value="rounded">Rounded (-20 kg/m³)</option>
                        </select>
                      </div>
                    </div>
                    <div className="p-2 rounded-sm bg-warning/10 border border-warning/30 text-[10px] text-warning font-sans">
                      ⚠️ <strong>Caution:</strong> Aggregate shape classification depends on physical quarry source and crushing process.
                    </div>
                  </div>
                )}
              </div>

              {/* STRATEGY D: Cement Type / Strength */}
              <div
                onClick={() => { setSelectedStrategy('cement'); setIsCalculated(false); }}
                className={`p-3.5 rounded-sm border cursor-pointer transition-all space-y-2 ${
                  selectedStrategy === 'cement'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border bg-background hover:border-muted-foreground/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs font-mono-tech text-foreground">Strategy D: Change Cement Type / Grade</span>
                  <input
                    type="radio"
                    checked={selectedStrategy === 'cement'}
                    onChange={() => {}}
                    className="accent-primary"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Selects a higher strength cement class (e.g. OPC 53), shifting Figure 1 strength curves upward and permitting a higher W/C ratio.
                </p>
                {selectedStrategy === 'cement' && (
                  <div className="pt-2 border-t border-border space-y-2 text-xs font-mono-tech" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Current: {currentCementType}</span>
                      <div className="flex items-center gap-1.5">
                        <label className="font-bold text-foreground">Proposed Cement:</label>
                        <select
                          value={proposedCementType}
                          onChange={(e) => { setProposedCementType(e.target.value as CementType); setIsCalculated(false); }}
                          className="px-2 py-0.5 border border-border bg-background text-foreground rounded-sm font-mono font-bold text-xs"
                        >
                          <option value="OPC_43">OPC 43 (Curve 2)</option>
                          <option value="OPC_53">OPC 53 (Curve 3)</option>
                          <option value="PPC">PPC (Default Curve 2)</option>
                          <option value="PSC">PSC (Default Curve 2)</option>
                        </select>
                      </div>
                    </div>
                    <div className="p-2 rounded-sm bg-warning/10 border border-warning/30 text-[10px] text-warning font-sans">
                      ⚠️ <strong>Caution:</strong> Cement type must comply with structural contract specifications and site availability.
                    </div>
                  </div>
                )}
              </div>

              {/* STRATEGY E: Maximum Aggregate Size */}
              <div
                onClick={() => { setSelectedStrategy('msa'); setIsCalculated(false); }}
                className={`p-3.5 rounded-sm border cursor-pointer transition-all space-y-2 ${
                  selectedStrategy === 'msa'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border bg-background hover:border-muted-foreground/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs font-mono-tech text-foreground">Strategy E: Change Maximum Aggregate Size (MSA)</span>
                  <input
                    type="radio"
                    checked={selectedStrategy === 'msa'}
                    onChange={() => {}}
                    className="accent-primary"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Increases MSA (e.g. 20 mm to 40 mm), reducing base water requirements from 186 to 165 kg/m³.
                </p>
                {selectedStrategy === 'msa' && (
                  <div className="pt-2 border-t border-border space-y-2 text-xs font-mono-tech" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Current: {currentMSA} mm</span>
                      <div className="flex items-center gap-1.5">
                        <label className="font-bold text-foreground">Proposed MSA:</label>
                        <select
                          value={proposedMSA}
                          onChange={(e) => { setProposedMSA(Number(e.target.value) as AggregateSize); setIsCalculated(false); }}
                          className="px-2 py-0.5 border border-border bg-background text-foreground rounded-sm font-mono font-bold text-xs"
                        >
                          <option value={10}>10 mm (208 kg/m³)</option>
                          <option value={20}>20 mm (186 kg/m³)</option>
                          <option value={40}>40 mm (165 kg/m³)</option>
                        </select>
                      </div>
                    </div>
                    <div className="p-2 rounded-sm bg-warning/10 border border-warning/30 text-[10px] text-warning font-sans">
                      ⚠️ <strong>Caution:</strong> Maximum aggregate size must satisfy structural rebar spacing and cover requirements per IS 456.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 4: PREVIEW & RECALCULATION ACTION */}
          {selectedStrategy && (
            <div className="p-4 rounded-sm border border-border bg-muted/20 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <h4 className="text-xs font-bold text-primary uppercase font-mono-tech tracking-wider">
                  Proposed Input Parameter Preview
                </h4>
                <button
                  onClick={handleCalculateProposed}
                  className="btn-primary flex items-center gap-1.5 text-xs font-mono-tech font-bold py-2 px-4 shadow-sm"
                >
                  <RefreshCw size={13} className={isCalculated ? '' : 'animate-spin'} />
                  <span>Calculate Proposed Mix</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse font-mono-tech">
                  <thead>
                    <tr className="bg-muted/60 text-muted-foreground uppercase border-b border-border text-[10px]">
                      <th className="py-2 px-3 font-bold">Parameter</th>
                      <th className="py-2 px-3 font-bold text-center">Original Value</th>
                      <th className="py-2 px-3 font-bold text-center">Proposed Value</th>
                      <th className="py-2 px-3 font-bold text-right">Engine Calculation Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    <tr>
                      <td className="py-2 px-3 text-foreground font-sans font-medium">Selected Strategy</td>
                      <td className="py-2 px-3 text-center text-muted-foreground">—</td>
                      <td className="py-2 px-3 text-center font-bold text-primary uppercase">{selectedStrategy}</td>
                      <td className="py-2 px-3 text-right font-bold text-foreground font-mono">
                        {isCalculated ? 'Calculated via Engine' : 'Pending Calculation'}
                      </td>
                    </tr>
                    {selectedStrategy === 'admixture' && (
                      <tr>
                        <td className="py-2 px-3 text-foreground font-sans font-medium">Water Reduction (%)</td>
                        <td className="py-2 px-3 text-center text-muted-foreground">{currentWaterRed}%</td>
                        <td className="py-2 px-3 text-center font-bold text-primary">{proposedWaterRed}%</td>
                        <td className="py-2 px-3 text-right text-muted-foreground font-sans">Reduces design water</td>
                      </tr>
                    )}
                    {selectedStrategy === 'slump' && (
                      <tr>
                        <td className="py-2 px-3 text-foreground font-sans font-medium">Slump (mm)</td>
                        <td className="py-2 px-3 text-center text-muted-foreground">{currentSlump} mm</td>
                        <td className="py-2 px-3 text-center font-bold text-primary">{proposedSlump} mm</td>
                        <td className="py-2 px-3 text-right text-muted-foreground font-sans">Adjusts base water</td>
                      </tr>
                    )}
                    {selectedStrategy === 'shape' && (
                      <tr>
                        <td className="py-2 px-3 text-foreground font-sans font-medium">Coarse Aggregate Shape</td>
                        <td className="py-2 px-3 text-center text-muted-foreground">{currentShape}</td>
                        <td className="py-2 px-3 text-center font-bold text-primary">{proposedShape}</td>
                        <td className="py-2 px-3 text-right text-muted-foreground font-sans">Shape water offset</td>
                      </tr>
                    )}
                    {selectedStrategy === 'cement' && (
                      <tr>
                        <td className="py-2 px-3 text-foreground font-sans font-medium">Cement Type</td>
                        <td className="py-2 px-3 text-center text-muted-foreground">{currentCementType}</td>
                        <td className="py-2 px-3 text-center font-bold text-primary">{proposedCementType}</td>
                        <td className="py-2 px-3 text-right text-muted-foreground font-sans">Figure 1 Curve selection</td>
                      </tr>
                    )}
                    {selectedStrategy === 'msa' && (
                      <tr>
                        <td className="py-2 px-3 text-foreground font-sans font-medium">Max Aggregate Size</td>
                        <td className="py-2 px-3 text-center text-muted-foreground">{currentMSA} mm</td>
                        <td className="py-2 px-3 text-center font-bold text-primary">{proposedMSA} mm</td>
                        <td className="py-2 px-3 text-right text-muted-foreground font-sans">Table 4 base water</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 5: PROPOSED RESULT COMPARISON AUDIT TRAIL */}
          {isCalculated && proposedResult && proposedStatusInfo && (
            <div className="p-5 rounded-sm border border-border bg-card space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase font-mono-tech tracking-wider block mb-0.5">
                    Calculated Proposed Redesign Output
                  </span>
                  <h4 className="text-sm font-extrabold text-foreground font-mono-tech">
                    Proposed redesign calculated
                  </h4>
                </div>
                <div
                  className={`px-3 py-1 rounded-sm text-xs font-bold font-mono-tech uppercase tracking-wider border ${
                    proposedStatusInfo.status === 'COMPLIANT'
                      ? 'bg-success/15 text-success border-success/30'
                      : proposedStatusInfo.status === 'NON_COMPLIANT'
                      ? 'bg-error/15 text-error border-error/30'
                      : 'bg-warning/15 text-warning border-warning/30'
                  }`}
                >
                  {proposedStatusInfo.status === 'COMPLIANT'
                    ? '✓ COMPLIANT (PASS)'
                    : proposedStatusInfo.status === 'NON_COMPLIANT'
                    ? '✕ NON-COMPLIANT'
                    : '⚠ CALCULATION INCOMPLETE'}
                </div>
              </div>

              {/* Status Explanation Message */}
              <div className="p-3 rounded-sm text-xs font-mono-tech bg-muted/40 border border-border">
                {proposedStatusInfo.status === 'COMPLIANT' ? (
                  <p className="text-success font-semibold flex items-center gap-1.5">
                    <CheckCircle2 size={15} />
                    Calculated result satisfies the implemented reference checks.
                  </p>
                ) : proposedStatusInfo.status === 'NON_COMPLIANT' ? (
                  <p className="text-error font-semibold flex items-center gap-1.5">
                    <XCircle size={15} />
                    Proposed mix remains non-compliant. Reason: {proposedStatusInfo.reason}
                  </p>
                ) : (
                  <p className="text-warning font-semibold flex items-center gap-1.5">
                    <AlertTriangle size={15} />
                    Calculation cannot be completed with the currently available verified reference data.
                  </p>
                )}
              </div>

              {/* Side-by-Side Audit Trail Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse font-mono-tech">
                  <thead>
                    <tr className="bg-muted/60 text-muted-foreground uppercase border-b border-border text-[10px]">
                      <th className="py-2 px-3 font-bold">Metric / Output</th>
                      <th className="py-2 px-3 font-bold text-center">Original Mix (Failed)</th>
                      <th className="py-2 px-3 font-bold text-center">Proposed Redesign</th>
                      <th className="py-2 px-3 font-bold text-right">Delta / Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    <tr>
                      <td className="py-2 px-3 text-foreground font-sans font-medium">Design Water Content</td>
                      <td className="py-2 px-3 text-center text-muted-foreground">{originalResult.water} kg/m³</td>
                      <td className="py-2 px-3 text-center font-bold text-foreground">{proposedResult.result.water} kg/m³</td>
                      <td className="py-2 px-3 text-right font-bold text-primary font-mono">
                        {proposedResult.result.water - originalResult.water} kg/m³
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-foreground font-sans font-medium">W/C Ratio</td>
                      <td className="py-2 px-3 text-center text-muted-foreground">{originalResult.wcRatio ? originalResult.wcRatio.toFixed(4) : '—'}</td>
                      <td className="py-2 px-3 text-center font-bold text-foreground">{proposedResult.result.wcRatio ? proposedResult.result.wcRatio.toFixed(4) : '—'}</td>
                      <td className="py-2 px-3 text-right font-bold text-primary font-mono">
                        {proposedResult.result.wcRatio && originalResult.wcRatio ? (proposedResult.result.wcRatio - originalResult.wcRatio).toFixed(4) : '—'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-foreground font-sans font-medium">Calculated Cement Content</td>
                      <td className="py-2 px-3 text-center text-error font-bold">{originalResult.cement} kg/m³</td>
                      <td className={`py-2 px-3 text-center font-bold ${proposedResult.result.cement > 450 ? 'text-error' : 'text-success'}`}>
                        {proposedResult.result.cement} kg/m³
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-primary font-mono">
                        {proposedResult.result.cement - originalResult.cement} kg/m³
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-foreground font-sans font-medium">Cement Max Limit Check</td>
                      <td className="py-2 px-3 text-center text-error font-bold">FAIL (&gt; 450 kg/m³)</td>
                      <td className="py-2 px-3 text-center font-bold uppercase">
                        {proposedResult.result.cementContentCheck.toUpperCase()}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-muted-foreground font-sans">
                        Max 450 kg/m³
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-foreground font-sans font-medium">SSD Structural Mix Ratio</td>
                      <td className="py-2 px-3 text-center text-muted-foreground">
                        1 : {originalResult.mixRatioFineAggregate.toFixed(2)} : {originalResult.mixRatioCoarseAggregate.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-foreground">
                        1 : {proposedResult.result.mixRatioFineAggregate.toFixed(2)} : {proposedResult.result.mixRatioCoarseAggregate.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right text-muted-foreground font-sans">SSD Mass Ratio</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Action Confirmation Buttons */}
              <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
                <button
                  onClick={() => setIsCalculated(false)}
                  className="btn-secondary text-xs font-mono-tech py-2 px-3"
                >
                  Try Another Strategy
                </button>
                <button
                  onClick={() => onAdoptRedesign(proposedResult.input, proposedResult.result)}
                  className="btn-primary flex items-center gap-1.5 text-xs font-mono-tech font-bold py-2 px-4 shadow-sm"
                >
                  <CheckCircle2 size={14} />
                  <span>Adopt Proposed Redesign Result</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
