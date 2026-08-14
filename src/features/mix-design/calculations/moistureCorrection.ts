/**
 * Step 7: Moisture Correction
 * IS 10262:2019 — Clause 7
 *
 * Adjusts the batch quantities from SSD (Saturated Surface Dry) design
 * to actual field conditions using surface moisture and water absorption data.
 *
 * Definitions:
 *   Surface moisture (SM) = free moisture on aggregate surface (user input, %)
 *   Water absorption (WA) = moisture the dry aggregate absorbs to reach SSD (user input, %)
 *
 * Corrections (Wet Aggregates, SM > 0):
 *   Corrected FA  = FA_SSD  × (1 + surfaceMoistureFA / 100)
 *   Corrected CA  = CA_SSD  × (1 + surfaceMoistureCA / 100)
 *   Corrected W   = W_SSD   − (Corrected FA − FA_SSD) − (Corrected CA − CA_SSD)
 *
 * Corrections (Dry Aggregates, SM = 0):
 *   Corrected FA  = FA_SSD  / (1 + waterAbsorptionFA / 100)
 *   Corrected CA  = CA_SSD  / (1 + waterAbsorptionCA / 100)
 *   Corrected W   = W_SSD   − (Corrected FA − FA_SSD) − (Corrected CA − CA_SSD)
 *
 * Note: When no surface moisture data is supplied (default = 0%),
 * this step assumes aggregates are DRY and absorbs water from the mix.
 *
 * Source: IS 10262:2019, Clause 7
 */

import type { CalculationOutput, EngineContext } from './engine/types';

export interface MoistureCorrectionOutput {
  correctedWater: CalculationOutput;
  correctedFA: CalculationOutput;
  correctedCA: CalculationOutput;
}

// Surface moisture is an optional field in EngineContext — default to 0 if absent
function getSurfaceMoisture(ctx: EngineContext): { fa: number; ca: number } {
  const extended = ctx as unknown as Record<string, unknown>;
  return {
    fa: (extended.surfaceMoistureFA as number) ?? 0,
    ca: (extended.surfaceMoistureCA as number) ?? 0,
  };
}

export function calculateMoistureCorrection(
  ctx: EngineContext,
  fineAggregate: number,
  coarseAggregate: number,
  waterContent: number
): MoistureCorrectionOutput {
  const sm = getSurfaceMoisture(ctx);

  // In IS 10262, aggregates can be dry or wet:
  // - If surface moisture is > 0, they are WET and contribute free water.
  // - If no surface moisture is specified (sm = 0), they are assumed DRY (Oven Dry) 
  //   and will absorb water equal to their water absorption capacity.
  const isWetFA = sm.fa > 0;
  const isWetCA = sm.ca > 0;



  // ─── Corrected aggregate quantities ──────────────────────────────────────
  // If dry: batch mass is Oven Dry = SSD / (1 + WA / 100)
  // If wet: batch mass is wet mass = SSD * (1 + sm / 100)
  const corrFA = isWetFA 
    ? fineAggregate * (1 + sm.fa / 100)
    : fineAggregate / (1 + ctx.waterAbsorptionFA / 100);

  const corrCA = isWetCA
    ? coarseAggregate * (1 + sm.ca / 100)
    : coarseAggregate / (1 + ctx.waterAbsorptionCA / 100);

  // ─── Corrected water ─────────────────────────────────────────────────────
  // The water adjustment is exactly the mass difference of the aggregate.
  // If wet: corrMass > SSD -> waterAdj is positive (contributes water, so subtract from batch water)
  // If dry: corrMass < SSD -> waterAdj is negative (absorbs water, so add to batch water)
  const waterAdjFA = corrFA - fineAggregate;
  const waterAdjCA = corrCA - coarseAggregate;
  const corrW = waterContent - waterAdjFA - waterAdjCA;

  const clause = 'IS 10262:2019, Clause 7';

  // ─── Build substitution strings ───────────────────────────────────────────
  const wSubs = [
    `W_SSD = ${waterContent} kg/m³`,
    `ΔW_FA = Batch_FA − SSD_FA = ${corrFA.toFixed(2)} − ${fineAggregate} = ${waterAdjFA.toFixed(2)} kg/m³`,
    `ΔW_CA = Batch_CA − SSD_CA = ${corrCA.toFixed(2)} − ${coarseAggregate} = ${waterAdjCA.toFixed(2)} kg/m³`,
    `Corrected Batch Water = W_SSD − ΔW_FA − ΔW_CA = ${waterContent} − (${waterAdjFA.toFixed(2)}) − (${waterAdjCA.toFixed(2)}) = ${corrW.toFixed(1)} kg/m³`,
  ].join(' | ');

  const faSubs = [
    `FA_SSD = ${fineAggregate} kg/m³`,
    isWetFA ? `Condition = WET (SM=${sm.fa}%)` : `Condition = DRY (WA=${ctx.waterAbsorptionFA}%)`,
    isWetFA
      ? `Batch FA = ${fineAggregate} × (1 + ${sm.fa}/100) = ${corrFA.toFixed(1)} kg/m³`
      : `Batch FA (OD) = ${fineAggregate} / (1 + ${ctx.waterAbsorptionFA}/100) = ${corrFA.toFixed(1)} kg/m³`,
  ].join(' | ');

  const caSubs = [
    `CA_SSD = ${coarseAggregate} kg/m³`,
    isWetCA ? `Condition = WET (SM=${sm.ca}%)` : `Condition = DRY (WA=${ctx.waterAbsorptionCA}%)`,
    isWetCA
      ? `Batch CA = ${coarseAggregate} × (1 + ${sm.ca}/100) = ${corrCA.toFixed(1)} kg/m³`
      : `Batch CA (OD) = ${coarseAggregate} / (1 + ${ctx.waterAbsorptionCA}/100) = ${corrCA.toFixed(1)} kg/m³`,
  ].join(' | ');

  return {
    correctedWater: {
      value: Math.round(corrW * 10) / 10,
      unroundedValue: corrW,
      unit: 'kg/m³',
      formula: 'W_batch = W_SSD − (FA_batch − FA_SSD) − (CA_batch − CA_SSD)',
      substitution: wSubs,
      result: `Corrected batch water = ${corrW.toFixed(1)} kg/m³`,
      isCodeClause: clause,
      isPlaceholder: false,
    },
    correctedFA: {
      value: Math.round(corrFA * 10) / 10,
      unroundedValue: corrFA,
      unit: 'kg/m³',
      formula: isWetFA ? 'FA_batch = FA_SSD × (1 + SM/100)' : 'FA_batch = FA_SSD / (1 + WA/100)',
      substitution: faSubs,
      result: `Batch FA = ${corrFA.toFixed(1)} kg/m³`,
      isCodeClause: clause,
      isPlaceholder: false,
    },
    correctedCA: {
      value: Math.round(corrCA * 10) / 10,
      unroundedValue: corrCA,
      unit: 'kg/m³',
      formula: isWetCA ? 'CA_batch = CA_SSD × (1 + SM/100)' : 'CA_batch = CA_SSD / (1 + WA/100)',
      substitution: caSubs,
      result: `Batch CA = ${corrCA.toFixed(1)} kg/m³`,
      isCodeClause: clause,
      isPlaceholder: false,
    },
  };
}
