/**
 * Calculation Engine — Entry Point
 *
 * Orchestrates all IS 10262:2019 calculation steps in sequence.
 * Each step's output feeds into the next step as input.
 *
 * Architecture:
 *   UI
 *    ↓
 *   Mix Design Service  (src/features/mix-design/services/)
 *    ↓
 *   Calculation Engine  ← YOU ARE HERE
 *    ↓
 *   Reference Data      (src/features/mix-design/reference-data/)
 *
 * Rules:
 *   - All step functions are pure and independently testable.
 *   - Swap in official IS formulas per file without touching this orchestrator.
 *   - The UI layer must NEVER call step functions directly.
 *   - The UI layer only calls runMixDesignCalculation() and reads MixDesignResult.
 *
 * Branch separation:
 *   M10–M60 (ordinary-standard): Table 3, 4, 5; Figure 1
 *   M65+    (high-strength):     Table 6, 7, 8, 10; no Figure 1
 */

import type { MixDesignInput, MixDesignResult, CalculationStep } from '../types';
import { lookupAirContent, lookupAirContentHighStrength } from '../reference-data';
import { calculateTargetStrength } from './targetStrength';
import { calculateStrengthBasedWCRatio } from './wcRatio';
import { calculateWaterContent } from './waterContent';
import { calculateCementContent, IS456_MAX_WC, IS456_MIN_CEMENT } from './cementContent';
import { calculateAggregateVolumes } from './aggregateVolume';
import { calculateMoistureCorrection } from './moistureCorrection';
import { calculateMixRatio } from './mixRatio';
import { applyDurabilityLimit } from './durabilityLimit';

export function runMixDesignCalculation(input: MixDesignInput): MixDesignResult {
  const { designParameters: dp, materialProperties: mp } = input;

  // Extract fck from grade string (e.g. "M25" → 25)
  const fck = parseInt(dp.concreteGrade.replace('M', ''), 10);

  // Build engine context with all required fields
  const ctx = {
    grade: dp.concreteGrade,
    fck,
    exposureCondition: dp.exposureCondition,
    slump: dp.slump,
    maxAggregateSize: dp.maxAggregateSize,
    isPumped: dp.isPumpedConcrete,
    isAirEntrained: dp.isAirEntrained,
    targetAirContent: dp.targetAirContent,
    cementType: (mp.cement as { type?: string }).type ?? 'OPC_43',
    cementGrade: (mp.cement as { grade?: number }).grade,
    cementSG: mp.cement.specificGravity,
    faSG: mp.fineAggregate.specificGravity,
    caSG: mp.coarseAggregate.specificGravity,
    caAngularity: mp.coarseAggregate.angularity,
    faZone: dp.faZone ?? 'II',
    siteControl: dp.siteControl ?? 'good',
    waterAbsorptionFA: mp.fineAggregate.waterAbsorption,
    waterAbsorptionCA: mp.coarseAggregate.waterAbsorption,
    admixtureWaterReduction: mp.admixture?.waterReduction,
    adoptedWcOverride: dp.adoptedWcOverride,
    admixtureDosageBasis: mp.admixture?.dosageBasis ?? 'percentage',
    surfaceMoistureFA: mp.fineAggregate.surfaceMoisture,
    surfaceMoistureCA: mp.coarseAggregate.surfaceMoisture,
  };

  // ─── Step 1: Target Mean Strength ─────────────────────────────────────────
  const step1 = calculateTargetStrength(ctx);
  const targetStrengthValue = step1.value; // null if not calculated

  // ─── Step 2: Water Content ────────────────────────────────────────────────
  // Runs independently of Step 1 (Table 4/7 lookup only needs MSA and slump)
  const step2 = calculateWaterContent(ctx);

  // ─── Step 3: Strength-Based W/C Ratio ────────────────────────────────────
  // Requires Step 1 target strength. Pass 0 if unavailable — function guards.
  const step3strength = calculateStrengthBasedWCRatio(ctx, targetStrengthValue ?? 0);

  // ─── Step 3b: Durability W/C Limit (IS 456:2000 Table 5) ─────────────────
  // Look up max W/C for this exposure class from IS 456 verified data.
  const exposureKey = ctx.exposureCondition?.toLowerCase().replace(' ', '_') ?? 'moderate';
  const durabilityMaxWC = IS456_MAX_WC[exposureKey] ?? null;
  const durabilityCheck = applyDurabilityLimit(step3strength.value, durabilityMaxWC);

  // The recommended W/C ratio is the lower of strength-based and durability limit.
  const recommendedWC = durabilityCheck.finalWC ?? step3strength.value;

  // The adopted W/C ratio can be manually overridden by the engineer.
  const isWcOverridden = ctx.adoptedWcOverride !== undefined && ctx.adoptedWcOverride >= 0.2; // sensible lower bound
  let adoptedWC: number | null = recommendedWC;
  let overrideBlockedMessage: string | null = null;
  
  if (isWcOverridden) {
    if (durabilityMaxWC !== null && ctx.adoptedWcOverride! > durabilityMaxWC) {
      // BLOCK: override violates IS 456 durability limit
      overrideBlockedMessage = `Override W/C (${ctx.adoptedWcOverride}) rejected: exceeds IS 456 durability maximum (${durabilityMaxWC})`;
      adoptedWC = recommendedWC;
    } else {
      adoptedWC = ctx.adoptedWcOverride!;
    }
  }

  const unroundedWater = step2.unroundedValue ?? step2.value;

  // ─── Step 4: Cement Content ───────────────────────────────────────────────
  const step4 = calculateCementContent(ctx, unroundedWater, adoptedWC ?? 0);
  const unroundedCement = step4.unroundedValue ?? step4.value;

  // ─── Admixture Mass & Volume ─────────────────────────────────────────────
  // Computed here so its volume can be subtracted from total aggregate volume
  const admixtureDosage = mp.admixture?.dosage ?? 0;
  const dosageBasis = ctx.admixtureDosageBasis ?? 'percentage';
  
  let admixtureMass: number | null = 0;
  if (admixtureDosage > 0) {
    if (dosageBasis === 'liters_per_m3') {
      const sg = mp.admixture?.specificGravity;
      if (sg !== undefined && sg !== null) {
        admixtureMass = admixtureDosage * sg;
      } else {
        admixtureMass = null; // Explicitly missing due to missing required SG
      }
    } else {
      admixtureMass = unroundedCement * (admixtureDosage / 100);
    }
  }

  // Volume of admixture (m³)
  const admixtureSG = mp.admixture?.specificGravity;
  const volAdmix = ((admixtureMass ?? 0) > 0 && admixtureSG) ? (admixtureMass! / (admixtureSG * 1000)) : 0;

  // ─── Steps 5 & 6: Aggregate Volumes ──────────────────────────────────────
  const aggSteps = calculateAggregateVolumes(ctx, unroundedCement, unroundedWater, adoptedWC ?? 0, volAdmix);
  const unroundedFA = aggSteps.fineAggregate.unroundedValue ?? aggSteps.fineAggregate.value;
  const unroundedCA = aggSteps.coarseAggregate.unroundedValue ?? aggSteps.coarseAggregate.value;

  // ─── Step 7: Moisture Correction ─────────────────────────────────────────
  const moistSteps = calculateMoistureCorrection(
    ctx,
    unroundedFA,
    unroundedCA,
    unroundedWater
  );

  // ─── Step 8: Mix Ratio ────────────────────────────────────────────────────
  const mixRatio = calculateMixRatio(
    unroundedCement,
    unroundedFA,
    unroundedCA
  );

  // ─── Determine overall calculation status ────────────────────────────────
  const isFullyCalculated =
    step1.status === 'calculated' &&
    step3strength.status === 'calculated' &&
    !step2.isPlaceholder &&
    step4.value > 0 &&
    aggSteps.fineAggregate.value > 0;

  // ─── Durability compliance string ────────────────────────────────────────
  let durabilityStatus: 'pass' | 'fail' | 'pending' = 'pending';
  if (durabilityCheck.status === 'calculated' && adoptedWC !== null && durabilityMaxWC !== null) {
    durabilityStatus = adoptedWC <= durabilityMaxWC ? 'pass' : 'fail';
  }

  // ─── Final Output Derivations ─────────────────────────────────────────────
  
  // 2. Fresh Concrete Density (sum of all unrounded batch components)
  const finalWater = moistSteps.correctedWater.value;
  const finalFA = moistSteps.correctedFA.value;
  const finalCA = moistSteps.correctedCA.value;
  const finalCement = step4.value;

  const unroundedBatchWater = moistSteps.correctedWater.unroundedValue ?? finalWater;
  const unroundedBatchFA = moistSteps.correctedFA.unroundedValue ?? finalFA;
  const unroundedBatchCA = moistSteps.correctedCA.unroundedValue ?? finalCA;
  const freshDensity = unroundedCement + unroundedBatchWater + unroundedBatchFA + unroundedBatchCA + (admixtureMass ?? 0);

  // 3. Yield (Absolute Volume Summation)
  let mixYield: number | null = null;
  let yieldError: string | undefined;

  if (isFullyCalculated) {
    const isHS = fck >= 65;
    let airPct = 0;
    if (ctx.isAirEntrained && ctx.targetAirContent !== undefined) {
      airPct = ctx.targetAirContent;
    } else if (isHS) {
      airPct = lookupAirContentHighStrength(ctx.maxAggregateSize) ?? 0;
    } else {
      airPct = lookupAirContent(ctx.maxAggregateSize) ?? 0;
    }
    const admixtureSG = mp.admixture?.specificGravity;

    // If admixture is used, SG must be provided. Do not invent a value.
    if (admixtureDosage > 0 && !admixtureSG) {
      yieldError = 'Admixture specific gravity is required to compute mix properties. Please provide SG for the selected admixture.';
      // mixYield stays null — do not return 0 as a fabricated engineering result
    } else {
      // Yield must be calculated using SSD quantities because the specific gravities provided are SSD.
      // Using batch quantities (e.g. OD mass) with SSD SG + total batch water miscalculates absolute volume.
      const volCement = unroundedCement / (ctx.cementSG * 1000);
      const volWater = unroundedWater / 1000;
      const volFA = unroundedFA / (ctx.faSG * 1000);
      const volCA = unroundedCA / (ctx.caSG * 1000);
      const volAir = airPct / 100;
      mixYield = volCement + volWater + volFA + volCA + volAdmix + volAir;
    }
  }

  // 4. Cement Compliance
  let cementStatus: 'pass' | 'fail' | 'warning' | 'pending' = 'pending';
  if (isFullyCalculated) {
    const exposureKey2 = ctx.exposureCondition?.toLowerCase().replace(' ', '_') ?? 'moderate';
    const minCementLimit = IS456_MIN_CEMENT ? (IS456_MIN_CEMENT[exposureKey2] ?? 300) : 300;
    if (finalCement > 450) {
      cementStatus = 'fail'; // Exceeds IS 10262 max
    } else if (finalCement < minCementLimit) {
      cementStatus = 'fail'; // Below IS 456 min
    } else {
      cementStatus = 'pass';
    }
  }

  // ─── Assemble calculation steps for UI display ─────────────────────────────
  const calculationSteps: CalculationStep[] = [
    {
      stepNumber: 1,
      title: 'Target Mean Strength',
      formula: step1.trace.formula,
      inputs: {
        'fck (N/mm²)': fck,
        'Grade': dp.concreteGrade,
        'Site Control': ctx.siteControl ?? 'good',
      },
      calculation: step1.trace.substitution,
      result: step1.message,
      unit: step1.unit,
      isCodeClause: step1.trace.source,
      isPlaceholder: step1.status !== 'calculated',
    },
    {
      stepNumber: 2,
      title: 'Water Content',
      formula: step2.formula,
      inputs: {
        'Max Aggregate Size (mm)': dp.maxAggregateSize,
        'Slump (mm)': dp.slump,
        'Pumped': dp.isPumpedConcrete ? 'Yes (CA reduction applies — no water addition)' : 'No',
      },
      calculation: step2.substitution,
      result: step2.result,
      unit: step2.unit,
      isCodeClause: step2.isCodeClause,
      isPlaceholder: step2.isPlaceholder,
    },
    {
      stepNumber: 3,
      title: 'Water-Cement Ratio',
      formula: step3strength.trace.formula,
      inputs: {
        "f'ck (N/mm²)": targetStrengthValue ?? 'not calculated',
        'Cement Type': ctx.cementType,
        'Figure 1 Curve': (step3strength.detail?.curveSelection?.curve ?? 'N/A (high-strength path)'),
        'Curve Selection Reason': (step3strength.detail?.curveSelection?.reason ?? 'Table 8 used — Figure 1 does not apply'),
        'Strength-based W/C': step3strength.value?.toFixed(4) ?? 'not calculated',
        'Durability max W/C (IS 456:2000 Table 5)': durabilityMaxWC ?? 'not available',
        'Adopted W/C': adoptedWC?.toFixed(4) ?? 'not calculated',
        'Governed by': isWcOverridden && !overrideBlockedMessage ? 'valid user override' : (overrideBlockedMessage ? 'durability maximum' : (durabilityCheck.controllingLimit ?? 'pending')),
      },
      calculation: isWcOverridden
        ? [
            `Strength-based W/C = ${step3strength.value?.toFixed(4) ?? 'N/A'}`,
            `Durability maximum W/C = ${durabilityMaxWC?.toFixed(2) ?? 'N/A'}`,
            `User override = ${ctx.adoptedWcOverride?.toFixed(4)}`,
            `Override validity = ${overrideBlockedMessage ? 'invalid' : `valid because ${ctx.adoptedWcOverride?.toFixed(4)} <= ${durabilityMaxWC?.toFixed(2) ?? 'limit'}`}`,
            `Final adopted W/C = ${adoptedWC?.toFixed(4)}`,
            `Governed by = ${overrideBlockedMessage ? 'durability maximum' : 'valid user override'}`,
          ].join('\n')
        : (durabilityCheck.status === 'calculated' ? durabilityCheck.message : step3strength.trace.substitution),
      result: isWcOverridden
        ? `Adopted W/C = ${adoptedWC?.toFixed(4)} [${overrideBlockedMessage ? 'durability limit' : 'valid user override'} governs]`
        : (durabilityCheck.status === 'calculated' ? `Adopted W/C = ${adoptedWC?.toFixed(4)} [${durabilityCheck.controllingLimit} governs]` : step3strength.message),
      unit: 'dimensionless',
      isCodeClause: 'IS 10262:2019, Clause 6.4; IS 456:2000, Table 5',
      isPlaceholder: step3strength.status !== 'calculated',
    },
    {
      stepNumber: 4,
      title: 'Cement Content',
      formula: step4.formula,
      inputs: {
        'Water Content (kg/m³)': step2.value,
        'W/C Ratio': adoptedWC?.toFixed(4) ?? 'not calculated',
        'Exposure Condition': dp.exposureCondition,
      },
      calculation: step4.substitution,
      result: step4.result,
      unit: step4.unit,
      isCodeClause: step4.isCodeClause,
      isPlaceholder: step4.isPlaceholder,
    },
    {
      stepNumber: 5,
      title: 'Absolute Volume of Aggregates',
      formula: aggSteps.totalAggregate.formula,
      inputs: {
        'Cement Content (kg/m³)': step4.value,
        'Cement SG': ctx.cementSG,
        'Water Content (kg/m³)': step2.value,
        'Air Content': (ctx.isAirEntrained && ctx.targetAirContent !== undefined)
          ? `Target Entrained Air (${ctx.targetAirContent}%)`
          : `from Table ${ctx.fck >= 65 ? '6 (HS)' : '3 (ordinary)'}`,
      },
      calculation: aggSteps.totalAggregate.substitution,
      result: aggSteps.totalAggregate.result,
      unit: aggSteps.totalAggregate.unit,
      isCodeClause: aggSteps.totalAggregate.isCodeClause,
      isPlaceholder: aggSteps.totalAggregate.isPlaceholder,
    },
    {
      stepNumber: 6,
      title: 'Fine & Coarse Aggregate Proportions — SSD/Design Basis',
      formula: aggSteps.fineAggregate.formula,
      inputs: {
        'W/C Ratio': adoptedWC?.toFixed(4) ?? 'not calculated',
        'FA Zone': ctx.faZone ?? 'II',
        'FA SG': ctx.faSG,
        'CA SG': ctx.caSG,
        'CA Table': ctx.fck >= 65 ? 'Table 10 (HS)' : 'Table 5 (ordinary)',
      },
      calculation: aggSteps.fineAggregate.substitution,
      result: `FA = ${aggSteps.fineAggregate.value} kg/m³ | CA = ${aggSteps.coarseAggregate.value} kg/m³`,
      unit: 'kg/m³',
      isCodeClause: aggSteps.fineAggregate.isCodeClause,
      isPlaceholder: aggSteps.fineAggregate.isPlaceholder,
    },
    {
      stepNumber: 7,
      title: 'Moisture Correction — Field/Batch Basis',
      formula: moistSteps.correctedWater.formula,
      inputs: {
        'Design Water / SSD (kg/m³)': step2.value,
        'WA FA (%)': ctx.waterAbsorptionFA,
        'WA CA (%)': ctx.waterAbsorptionCA,
        'Surface Moisture FA (%)': ctx.surfaceMoistureFA ?? 0,
        'Surface Moisture CA (%)': ctx.surfaceMoistureCA ?? 0,
        'Note': 'Field batch water differs from SSD design water when aggregates are dry',
      },
      calculation: moistSteps.correctedWater.substitution,
      result: [
        moistSteps.correctedWater.result,
        moistSteps.correctedFA.result,
        moistSteps.correctedCA.result,
      ].join(' | '),
      unit: 'kg/m³',
      isCodeClause: moistSteps.correctedWater.isCodeClause,
      isPlaceholder: moistSteps.correctedWater.isPlaceholder,
    },
    {
      stepNumber: 8,
      title: (cementStatus === 'fail' || durabilityStatus === 'fail')
        ? 'Preliminary Raw Mix Proportions — SSD/Design Basis'
        : 'Final Mix Proportions — SSD/Design Basis',
      formula: mixRatio.calculationOutput.formula,
      inputs: {
        'Cement (kg/m³)': step4.value,
        'FA (kg/m³)': aggSteps.fineAggregate.value,
        'CA (kg/m³)': aggSteps.coarseAggregate.value,
        'Water (kg/m³)': moistSteps.correctedWater.value,
      },
      calculation: mixRatio.calculationOutput.substitution,
      result: (cementStatus === 'fail' || durabilityStatus === 'fail')
        ? `Preliminary raw SSD mix ratio = ${mixRatio.formatted}`
        : `Final mix ratio = ${mixRatio.formatted}`,
      unit: mixRatio.calculationOutput.unit,
      isCodeClause: mixRatio.calculationOutput.isCodeClause,
      isPlaceholder: mixRatio.calculationOutput.isPlaceholder,
    },
  ];

  const ssdFAVal = aggSteps.fineAggregate?.value ?? 0;
  const ssdCAVal = aggSteps.coarseAggregate?.value ?? 0;

  return {
    cement: finalCement,
    water: finalWater,
    designWater: step2.value,
    fineAggregate: finalFA,
    coarseAggregate: finalCA,
    ssdFineAggregate: ssdFAVal,
    ssdCoarseAggregate: ssdCAVal,
    unrounded: {
      cement: unroundedCement,
      water: unroundedBatchWater,
      designWater: unroundedWater,
      fineAggregate: unroundedBatchFA,
      coarseAggregate: unroundedBatchCA,
      ssdFineAggregate: unroundedFA,
      ssdCoarseAggregate: unroundedCA,
      admixture: admixtureMass,
      mixRatioFineAggregate: mixRatio.fineAggregate,
      mixRatioCoarseAggregate: mixRatio.coarseAggregate,
      aggVolume: aggSteps.totalAggregate?.value ?? 0,
      caFraction: (aggSteps.coarseAggregate?.unroundedValue ?? 0) / (ctx.caSG * 1000 * (aggSteps.totalAggregate?.value || 1)),
      faFraction: (aggSteps.fineAggregate?.unroundedValue ?? 0) / (ctx.faSG * 1000 * (aggSteps.totalAggregate?.value || 1)),
    },
    admixture: admixtureMass !== null ? Number(admixtureMass.toFixed(2)) : null,
    wcRatio: adoptedWC ?? 0,
    density: Number(freshDensity.toFixed(1)),
    yield: mixYield !== null ? Number(mixYield.toFixed(4)) : null,
    mixRatioFineAggregate: mixRatio.fineAggregate,
    mixRatioCoarseAggregate: mixRatio.coarseAggregate,
    durabilityCheck: durabilityStatus,
    strengthCheck: isFullyCalculated ? 'pass' : 'pending',
    cementContentCheck: cementStatus,
    calculationSteps,
    isPlaceholder: !isFullyCalculated,
    yieldError,
    calculatedAt: new Date().toISOString(),
  };
}
