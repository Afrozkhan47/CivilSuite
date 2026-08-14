/**
 * Step 2: Water Content
 * IS 10262:2019 — Clause 6.3, Table 4 (ordinary M10–M60)
 * IS 10262:2019 — Clause 6.2.4, Table 7 (high-strength M65+)
 *
 * Procedure (ordinary):
 *   1. Base water content from Table 4 at 50 mm slump, angular aggregate, SSD.
 *   2. Slump adjustment: +3% per 25 mm increase above 50 mm slump.
 *   3. Admixture reduction: configurable %, applied to slump-adjusted water.
 *
 * Note on pumped concrete:
 *   IS 10262:2019 does not specify a flat water addition for pumping.
 *   Pumpability is achieved by reducing coarse aggregate content by up to 10%
 *   (Table 5 / Table 10 adjustment). No water correction is applied here.
 *   The isPumped flag currently reduces CA content — see aggregateVolume.ts.
 *
 * Procedure (high-strength):
 *   1. Base water content from Table 7 at 50 mm slump.
 *   2. Same slump and admixture adjustments apply.
 *
 * Source: IS 10262:2019, Clause 6.3, Table 4 / Clause 6.2.4, Table 7
 */

import type { CalculationOutput, EngineContext } from './engine/types';
import {
  lookupBaseWaterContent,
  lookupBaseWaterContentHighStrength,
  selectCalculationMethod,
} from '../reference-data';

// IS 10262:2019 Clause 6.3 Note: slump adjustment rate
const SLUMP_BASE_MM = 50;
const SLUMP_ADJUSTMENT_PERCENT_PER_25MM = 3.0; // %
// NOTE: No flat pumping water addition — IS 10262 handles pumpability via CA reduction only.

export function calculateWaterContent(ctx: EngineContext): CalculationOutput {
  const method = selectCalculationMethod(ctx.grade);

  // ─── Lookup base water content from appropriate table ─────────────────────
  let baseWater: number | null;
  let tableRef: string;

  if (method.method === 'high-strength') {
    baseWater = lookupBaseWaterContentHighStrength(ctx.maxAggregateSize);
    tableRef = 'IS 10262:2019, Clause 6.2.4, Table 7';
  } else {
    baseWater = lookupBaseWaterContent(ctx.maxAggregateSize);
    tableRef = 'IS 10262:2019, Clause 6.3, Table 4';
  }

  if (baseWater === null) {
    return {
      value: 0,
      unit: 'kg/m³',
      formula: 'W = W_table + ΔW_slump + ΔW_pumping',
      substitution: `No table entry for ${ctx.maxAggregateSize} mm aggregate in ${tableRef}`,
      result: `reference-data-required: aggregate size ${ctx.maxAggregateSize} mm not in ${tableRef}`,
      isCodeClause: tableRef,
      isPlaceholder: false,
    };
  }

  // ─── Air Entrained water adjustment (IS 10262:2019 Table 4 Note / Clause 6.3) ─
  let airAdjKg = 0;
  if (ctx.isAirEntrained) {
    airAdjKg = -8;
  }

  // ─── CA Angularity adjustment (IS 10262:2019 Table 4 Note) ────────────────
  let shapeAdjKg = 0;
  if (ctx.caAngularity === 'sub-angular') {
    shapeAdjKg = -10;
  } else if (ctx.caAngularity === 'partially_rounded') {
    shapeAdjKg = -15; // Gravel with some crushed particles
  } else if (ctx.caAngularity === 'rounded') {
    shapeAdjKg = -20; // Uncrushed rounded gravel
  }
  const baseWaterAdjusted = baseWater + airAdjKg + shapeAdjKg;

  // ─── Slump adjustment (IS 10262:2019 Clause 6.3 Note) ────────────────────
  // For every 25 mm increase in slump above 50 mm, water content increases by ~3%
  const slumpAboveBase = Math.max(0, ctx.slump - SLUMP_BASE_MM);
  const slumpSteps = slumpAboveBase / 25;
  const slumpAdjFraction = (SLUMP_ADJUSTMENT_PERCENT_PER_25MM / 100) * slumpSteps;
  const slumpAdjKg = baseWaterAdjusted * slumpAdjFraction;

  // ─── Pumping adjustment ───────────────────────────────────────────────────
  // IS 10262 does not specify a flat +10 kg/m³ water increase for pumping.
  // Pumping corrections are generally applied to the coarse aggregate fraction (Table 5).

  // ─── Admixture water reduction ─────────────────────────────────────────────
  // Standard examples use trial-based reductions (e.g. 23% in M40 example).
  // High-strength guidance suggests PCE can reduce water by 30% or more.
  const admixtureReductionPct = ctx.admixtureWaterReduction ?? 0;
  const slumpAdjustedWater = baseWaterAdjusted + slumpAdjKg;
  const admixtureReductionKg = slumpAdjustedWater * (admixtureReductionPct / 100);
  const unroundedWater = slumpAdjustedWater - admixtureReductionKg;
  const finalWater = Math.round(unroundedWater);

  const substitutionParts: string[] = [
    `W_base = ${baseWater} kg/m³ (${tableRef}, ${ctx.maxAggregateSize} mm MSA, 50 mm slump)`,
  ];
  if (airAdjKg !== 0) {
    substitutionParts.push(`ΔW_air = ${airAdjKg} kg/m³ (air entrained)`);
  }
  if (shapeAdjKg !== 0) {
    substitutionParts.push(`ΔW_shape = ${shapeAdjKg} kg/m³ (${ctx.caAngularity})`);
  }
  if (slumpAdjKg > 0) {
    substitutionParts.push(
      `ΔW_slump = ${baseWaterAdjusted} × ${(slumpAdjFraction * 100).toFixed(1)}% = +${slumpAdjKg.toFixed(2)} kg/m³ (slump ${ctx.slump} mm)`
    );
  }
  if (admixtureReductionKg > 0) {
    substitutionParts.push(`ΔW_admixture = -${admixtureReductionPct}% = -${admixtureReductionKg.toFixed(1)} kg/m³`);
  }
  substitutionParts.push(`W = ${finalWater} kg/m³`);

  return {
    value: finalWater,
    unroundedValue: unroundedWater,
    unit: 'kg/m³',
    formula: 'W = W_table [− 8 kg/m³ if air entrained] + ΔW_slump (3% per 25mm above 50mm) [− ΔW_admixture if applicable]',
    substitution: substitutionParts.join(' | '),
    result: `Water content (SSD) = ${finalWater} kg/m³`,
    isCodeClause: tableRef,
    isPlaceholder: false,
  };
}
