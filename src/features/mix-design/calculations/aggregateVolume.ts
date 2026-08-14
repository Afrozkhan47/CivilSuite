/**
 * Steps 5 & 6: Absolute Volume of Aggregates
 * IS 10262:2019 — Clause 6.6
 *
 * Absolute volume method (IS 10262:2019, Clause 6.6 & Annex A):
 *   V_total = 1 m³ = V_cement + V_water + V_air + V_admixture + V_CA + V_FA
 *
 *   V_cement    = C / (SG_c × 1000)
 *   V_water     = W / 1000
 *   V_air       = airContent% / 100
 *   V_admixture = admixtureMass / (SG_admixture × 1000)  [0 when no admixture]
 *   V_agg       = 1 - V_cement - V_water - V_air - V_admixture
 *
 *   V_CA = V_agg × p_CA                    (volume fraction from Table 5 or Table 10)
 *   V_FA = V_agg × (1 - p_CA)
 *
 *   CA (kg/m³) = V_CA × SG_ca × 1000
 *   FA (kg/m³) = V_FA × SG_fa × 1000
 *
 * Table used:
 *   Ordinary (M10–M60): Table 3 air, Table 5 CA proportion
 *   High-strength (M65+): Table 6 air, Table 10 CA proportion
 *
 * Source: IS 10262:2019, Clause 6.6
 */

import type { CalculationOutput, EngineContext } from './engine/types';
import {
  lookupAirContent,
  lookupCAFraction,
  lookupAirContentHighStrength,
  lookupCAFractionHighStrength,
  selectCalculationMethod,
} from '../reference-data';
import type { FAZone } from '../types';

export interface AggregateVolumeOutput {
  totalAggregate: CalculationOutput;
  fineAggregate: CalculationOutput;
  coarseAggregate: CalculationOutput;
}

export function calculateAggregateVolumes(
  ctx: EngineContext,
  cementContent: number,
  waterContent: number,
  wcRatio: number,
  admixtureVolume: number = 0
): AggregateVolumeOutput {
  const method = selectCalculationMethod(ctx.grade);
  const isHS = method.method === 'high-strength';

  // ─── Guard: upstream values must be real ──────────────────────────────────
  if (cementContent <= 0 || waterContent <= 0 || wcRatio <= 0) {
    const stub: CalculationOutput = {
      value: 0,
      unit: 'kg/m³',
      formula: 'Awaiting upstream W/C, cement, and water content calculations',
      substitution: `C=${cementContent}, W=${waterContent}, W/C=${wcRatio}`,
      result: 'reference-data-required: upstream values not calculated',
      isCodeClause: 'IS 10262:2019, Clause 6.6',
      isPlaceholder: false,
    };
    return { totalAggregate: stub, fineAggregate: stub, coarseAggregate: stub };
  }

  // ─── Air content ──────────────────────────────────────────────────────────
  let airPct: number | null;
  let airSource: string;
  if (ctx.isAirEntrained && ctx.targetAirContent !== undefined) {
    airPct = ctx.targetAirContent;
    airSource = 'Target Entrained Air';
  } else {
    airPct = isHS
      ? lookupAirContentHighStrength(ctx.maxAggregateSize)
      : lookupAirContent(ctx.maxAggregateSize);
    airSource = isHS ? 'Table 6' : 'Table 3';
  }

  if (airPct === null) {
    const stub: CalculationOutput = {
      value: 0,
      unit: 'kg/m³',
      formula: 'V_agg = 1 - V_cement - V_water - V_air',
      substitution: `Air content not found for ${ctx.maxAggregateSize} mm in ${isHS ? 'Table 6' : 'Table 3'}`,
      result: `reference-data-required: ${ctx.maxAggregateSize} mm not in ${isHS ? 'Table 6' : 'Table 3'}`,
      isCodeClause: 'IS 10262:2019, Clause 6.6',
      isPlaceholder: false,
    };
    return { totalAggregate: stub, fineAggregate: stub, coarseAggregate: stub };
  }

  // ─── Absolute volumes ─────────────────────────────────────────────────────
  const vCement = cementContent / (ctx.cementSG * 1000);
  const vWater  = waterContent / 1000;
  const vAir    = airPct / 100;
  const vAgg    = 1 - vCement - vWater - vAir - admixtureVolume;

  // ─── CA volume fraction ───────────────────────────────────────────────────
  const faZone = (ctx.faZone ?? 'II') as FAZone;

  const pCA_base = isHS
    ? lookupCAFractionHighStrength(ctx.maxAggregateSize, faZone as 'I' | 'II' | 'III', wcRatio)
    : lookupCAFraction(ctx.maxAggregateSize, faZone, wcRatio);

  if (pCA_base === null) {
    const stub: CalculationOutput = {
      value: 0,
      unit: 'kg/m³',
      formula: 'CA fraction not found',
      substitution: `MSA=${ctx.maxAggregateSize}, Zone=${faZone}, W/C=${wcRatio.toFixed(4)} not in ${isHS ? 'Table 10' : 'Table 5'}`,
      result: `reference-data-required: CA fraction lookup failed for ${ctx.maxAggregateSize} mm, Zone ${faZone}`,
      isCodeClause: 'IS 10262:2019, Clause 6.6',
      isPlaceholder: false,
    };
    return { totalAggregate: stub, fineAggregate: stub, coarseAggregate: stub };
  }

  // Pumpability reduction (IS 10262 Table 5 / Table 10)
  const pumpReductionFactor = ctx.isPumped ? 0.90 : 1.0;
  const pCA = pCA_base * pumpReductionFactor;
  const pFA = 1 - pCA;

  const vCA = vAgg * pCA;
  const vFA = vAgg * pFA;

  const caKg = Math.round(vCA * ctx.caSG * 1000);
  const faKg = Math.round(vFA * ctx.faSG * 1000);

  const tableRef = isHS ? 'IS 10262:2019, Table 6 & Table 10' : 'IS 10262:2019, Table 3 & Table 5';
  const caTable  = isHS ? 'Table 10' : 'Table 5';

  const nonAggSum = vCement + vWater + vAir + admixtureVolume;
  const totalSubs = [
    `V_cement = ${cementContent}/(${ctx.cementSG}×1000) = ${vCement.toFixed(4)} m³`,
    `V_water = ${waterContent}/1000 = ${vWater.toFixed(4)} m³`,
    `V_air = ${airPct}% (${airSource}) = ${vAir.toFixed(4)} m³`,
    admixtureVolume > 0 ? `V_admixture = ${admixtureVolume.toFixed(4)} m³` : null,
    `V_agg = 1 − ${nonAggSum.toFixed(4)} = ${vAgg.toFixed(4)} m³`,
  ].filter(Boolean).join(' | ');

  const totalAgg: CalculationOutput = {
    value: vAgg,
    unit: 'm³/m³',
    formula: admixtureVolume > 0
      ? 'V_agg = 1 − V_cement − V_water − V_air − V_admixture'
      : 'V_agg = 1 − V_cement − V_water − V_air',
    substitution: totalSubs,
    result: `Total aggregate volume = ${vAgg.toFixed(4)} m³/m³ of concrete`,
    isCodeClause: tableRef,
    isPlaceholder: false,
  };

  const pumpNote = ctx.isPumped ? ` (10% pumpability reduction)` : '';
  const faSubs = [
    `p_CA_base = ${pCA_base.toFixed(4)} (${caTable}, ${ctx.maxAggregateSize} mm, Zone ${faZone}, W/C=${wcRatio.toFixed(4)})`,
    ctx.isPumped ? `p_CA (pumped) = ${pCA_base.toFixed(4)} × 0.90 = ${pCA.toFixed(4)}` : null,
    `p_FA = 1 − ${pCA.toFixed(4)} = ${pFA.toFixed(4)}`,
    `V_FA = ${vAgg.toFixed(4)} × ${pFA.toFixed(4)} = ${vFA.toFixed(4)} m³`,
    `FA = ${vFA.toFixed(4)} × ${ctx.faSG} × 1000 = ${faKg} kg/m³`,
  ].filter(Boolean).join(' | ');

  const caSubs = [
    `p_CA = ${pCA.toFixed(4)}${pumpNote}`,
    `V_CA = ${vAgg.toFixed(4)} × ${pCA.toFixed(4)} = ${vCA.toFixed(4)} m³`,
    `CA = ${vCA.toFixed(4)} × ${ctx.caSG} × 1000 = ${caKg} kg/m³`,
  ].join(' | ');

  const unroundedFA = vFA * ctx.faSG * 1000;
  const unroundedCA = vCA * ctx.caSG * 1000;

  return {
    totalAggregate: totalAgg,
    fineAggregate: {
      value: faKg,
      unroundedValue: unroundedFA,
      unit: 'kg/m³',
      formula: 'FA = V_agg × (1 − p_CA) × SG_fa × 1000',
      substitution: faSubs,
      result: `Fine aggregate = ${faKg} kg/m³`,
      isCodeClause: tableRef,
      isPlaceholder: false,
    },
    coarseAggregate: {
      value: caKg,
      unroundedValue: unroundedCA,
      unit: 'kg/m³',
      formula: 'CA = V_agg × p_CA × SG_ca × 1000',
      substitution: caSubs,
      result: `Coarse aggregate = ${caKg} kg/m³`,
      isCodeClause: tableRef,
      isPlaceholder: false,
    },
  };
}
