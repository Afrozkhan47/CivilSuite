/**
 * CIVILSUITE — DECOUPLED INDEPENDENT ENGINEERING ORACLE AUDIT HARNESS (PHASE 5)
 *
 * IMPORTANT ARCHITECTURAL REQUIREMENT:
 * This script DOES NOT import or call production calculation functions.
 * It encodes IS 10262:2019 and IS 456:2000 tables and equations independently
 * to audit production output against a structurally decoupled oracle implementation.
 */

import { MixDesignInput } from '../src/features/mix-design/types';
import { runMixDesignCalculation } from '../src/features/mix-design/calculations';

// ─── INDEPENDENT ORACLE STANDARDS REFERENCE DATA ────────────────────────────

// IS 10262:2019 Table 1 & Table 2: Target Mean Strength Factors
const ORACLE_TARGET_STRENGTH: Record<string, { S: number; X: number }> = {
  M10: { S: 3.5, X: 5.0 },
  M15: { S: 3.5, X: 5.0 },
  M20: { S: 4.0, X: 5.5 },
  M25: { S: 4.0, X: 5.5 },
  M30: { S: 5.0, X: 6.5 },
  M35: { S: 5.0, X: 6.5 },
  M40: { S: 5.0, X: 6.5 },
  M45: { S: 5.0, X: 6.5 },
  M50: { S: 5.0, X: 6.5 },
  M55: { S: 5.0, X: 6.5 },
  M60: { S: 5.0, X: 8.0 },
  M65: { S: 6.0, X: 8.0 },
  M70: { S: 6.0, X: 8.0 },
  M75: { S: 6.0, X: 8.0 },
  M80: { S: 6.0, X: 8.0 },
};

// IS 10262:2019 Table 4: Base Water Content for 50 mm Slump (kg/m³)
const ORACLE_BASE_WATER: Record<number, number> = {
  10: 208,
  12.5: 197,
  16: 191,
  20: 186,
  25: 182,
  40: 165,
};

// IS 456:2000 Table 5: Durability Limits for Plain and Reinforced Concrete
const ORACLE_DURABILITY_LIMITS: Record<string, { maxWC: number; minCement: number }> = {
  mild: { maxWC: 0.55, minCement: 300 },
  moderate: { maxWC: 0.50, minCement: 300 },
  severe: { maxWC: 0.45, minCement: 320 },
  very_severe: { maxWC: 0.45, minCement: 340 },
  extreme: { maxWC: 0.40, minCement: 360 },
};

// IS 10262:2019 Table 5: Base Coarse Aggregate Volume Fraction for 20 mm MSA & W/C = 0.50
const ORACLE_TABLE_5_BASE_CA: Record<string, number> = {
  I: 0.60,
  II: 0.62,
  III: 0.64,
  IV: 0.66,
};

// IS 10262:2019 Table 3: Entrapped Air Volume (%)
const ORACLE_ENTRAPPED_AIR: Record<number, number> = {
  10: 1.5,
  20: 1.0,
  40: 0.5,
};

// IS 10262:2019 Figure 1 Digitized Curves
const ORACLE_FIGURE_1_CURVES: Record<string, Array<{ wc: number; strength: number }>> = {
  curve1: [
    { wc: 0.30, strength: 52.8 },
    { wc: 0.35, strength: 44.5 },
    { wc: 0.40, strength: 37.0 },
    { wc: 0.45, strength: 30.5 },
    { wc: 0.50, strength: 25.2 },
    { wc: 0.55, strength: 20.8 },
    { wc: 0.60, strength: 17.0 },
    { wc: 0.65, strength: 14.0 },
  ],
  curve2: [
    { wc: 0.30, strength: 59.5 },
    { wc: 0.35, strength: 50.4 },
    { wc: 0.40, strength: 42.9 },
    { wc: 0.45, strength: 35.8 },
    { wc: 0.50, strength: 30.3 },
    { wc: 0.55, strength: 25.2 },
    { wc: 0.60, strength: 21.0 },
    { wc: 0.65, strength: 17.6 },
  ],
  curve3: [
    { wc: 0.30, strength: 65.0 },
    { wc: 0.35, strength: 55.9 },
    { wc: 0.40, strength: 48.1 },
    { wc: 0.45, strength: 41.7 },
    { wc: 0.50, strength: 35.5 },
    { wc: 0.55, strength: 30.0 },
    { wc: 0.60, strength: 25.0 },
    { wc: 0.65, strength: 21.0 },
  ],
};

function oracleInterpolateWCRatio(targetStrength: number, cementType: string, actualGrade?: number): number {
  let curveName = 'curve2';
  if (cementType === 'OPC_33') curveName = 'curve1';
  else if (cementType === 'OPC_53') curveName = 'curve3';
  else if (cementType === 'PPC' || cementType === 'PSC') {
    if (actualGrade && actualGrade >= 50) curveName = 'curve3';
    else curveName = 'curve2';
  }

  const points = ORACLE_FIGURE_1_CURVES[curveName] ?? ORACLE_FIGURE_1_CURVES['curve2'];
  const sorted = [...points].sort((a, b) => a.strength - b.strength);

  if (targetStrength <= sorted[0].strength) return sorted[0].wc;
  if (targetStrength >= sorted[sorted.length - 1].strength) return sorted[sorted.length - 1].wc;

  for (let i = 0; i < sorted.length - 1; i++) {
    const p1 = sorted[i];
    const p2 = sorted[i + 1];
    if (targetStrength >= p1.strength && targetStrength <= p2.strength) {
      return p1.wc + ((targetStrength - p1.strength) * (p2.wc - p1.wc)) / (p2.strength - p1.strength);
    }
  }

  return 0.45;
}

// ─── DECOUPLED INDEPENDENT ORACLE CALCULATION ENGINE ───────────────────────

export interface IndependentOracleOutput {
  targetStrength: number;
  designWater: number;
  wcRatio: number;
  cement: number;
  coarseAggregateFraction: number;
  fineAggregateFraction: number;
  ssdFA: number;
  ssdCA: number;
  batchWater: number;
  batchFA: number;
  batchCA: number;
  admixtureMass: number;
  mixRatioFA: number;
  mixRatioCA: number;
  freshDensity: number;
  concreteYield: number;
  cementCompliance: 'pass' | 'fail';
}

export function runDecoupledIndependentOracle(input: MixDesignInput): IndependentOracleOutput {
  const grade = input.designParameters.concreteGrade;
  const gradeVal = parseInt(grade.replace('M', ''), 10);
  const targetInfo = ORACLE_TARGET_STRENGTH[grade] ?? { S: 5.0, X: 6.5 };
  
  // Step 1: Target Mean Strength
  const targetStrength = Math.max(gradeVal + 1.65 * targetInfo.S, gradeVal + targetInfo.X);

  // Step 2: Water Content
  const msa = input.designParameters.maxAggregateSize;
  let baseWater = ORACLE_BASE_WATER[msa] ?? 186;
  if (input.designParameters.isAirEntrained) {
    baseWater -= 8; // IS 10262 Table 4 note
  }
  const slump = input.designParameters.slump;
  let slumpWater = baseWater;
  if (slump > 50) {
    const extraSlump = slump - 50;
    slumpWater += baseWater * (0.03 * (extraSlump / 25));
  }
  const ang = input.materialProperties.coarseAggregate.angularity ?? 'angular';
  if (ang === 'sub-angular') slumpWater -= 10;
  else if (ang === 'rounded') slumpWater -= 15;

  const admRed = input.materialProperties.admixture.waterReduction ?? 0;
  const designWater = slumpWater * (1 - admRed / 100);

  // Step 3: W/C Ratio
  const autoWC = oracleInterpolateWCRatio(
    targetStrength,
    input.materialProperties.cement.type,
    input.materialProperties.cement.grade
  );
  const durLimits = ORACLE_DURABILITY_LIMITS[input.designParameters.exposureCondition] ?? { maxWC: 0.50, minCement: 300 };
  let adoptedWC = Math.min(autoWC, durLimits.maxWC);
  if (input.designParameters.adoptedWcOverride !== undefined) {
    adoptedWC = Math.min(input.designParameters.adoptedWcOverride, durLimits.maxWC);
  }

  // Step 4: Cement Content (Full Float Precision)
  const unroundedCement = designWater / adoptedWC;
  const cement = Math.round(unroundedCement);

  // Step 5: Absolute Volume & Aggregate Proportions
  const vCement = unroundedCement / (input.materialProperties.cement.specificGravity * 1000);
  const vWater = designWater / 1000;
  
  let vAir = 0.01;
  if (input.designParameters.isAirEntrained) {
    vAir = (input.designParameters.targetAirContent ?? 4.0) / 100;
  } else {
    vAir = (ORACLE_ENTRAPPED_AIR[msa] ?? 1.0) / 100;
  }

  // Admixture Volume
  let admMass = 0;
  let vAdm = 0;
  const admDosage = input.materialProperties.admixture.dosage ?? 0;
  const admSG = input.materialProperties.admixture.specificGravity ?? 1.12;
  const admBasis = input.materialProperties.admixture.dosageBasis ?? 'percentage';

  if (admDosage > 0) {
    if (admBasis === 'percentage') {
      admMass = unroundedCement * (admDosage / 100);
    } else {
      admMass = admDosage * admSG;
    }
    vAdm = admMass / (admSG * 1000);
  }

  const vAgg = 1.0 - vCement - vWater - vAir - vAdm;

  // Table 5 Coarse Aggregate Fraction
  const zone = input.designParameters.faZone ?? 'II';
  let caFraction = ORACLE_TABLE_5_BASE_CA[zone] ?? 0.62;
  
  // W/C Adjustment: ∓0.01 for every ±0.05 change from 0.50
  const wcDiff = 0.50 - adoptedWC;
  caFraction += (wcDiff / 0.05) * 0.01;

  if (input.designParameters.isPumpedConcrete) {
    caFraction *= 0.90; // -10% for pumped concrete
  }
  const faFraction = 1.0 - caFraction;

  const ssdFA = vAgg * faFraction * input.materialProperties.fineAggregate.specificGravity * 1000;
  const ssdCA = vAgg * caFraction * input.materialProperties.coarseAggregate.specificGravity * 1000;

  // Step 7: Moisture Correction (IS 10262 Clause 7)
  const faAbs = input.materialProperties.fineAggregate.waterAbsorption ?? 0;
  const faSM = input.materialProperties.fineAggregate.surfaceMoisture ?? 0;
  const caAbs = input.materialProperties.coarseAggregate.waterAbsorption ?? 0;
  const caSM = input.materialProperties.coarseAggregate.surfaceMoisture ?? 0;

  const isWetFA = faSM > 0;
  const isWetCA = caSM > 0;

  const batchFA = isWetFA ? ssdFA * (1 + faSM / 100) : ssdFA / (1 + faAbs / 100);
  const batchCA = isWetCA ? ssdCA * (1 + caSM / 100) : ssdCA / (1 + caAbs / 100);

  const waterAdjFA = batchFA - ssdFA;
  const waterAdjCA = batchCA - ssdCA;
  const batchWater = designWater - waterAdjFA - waterAdjCA;

  // Mix Ratios & Density
  const mixRatioFA = ssdFA / unroundedCement;
  const mixRatioCA = ssdCA / unroundedCement;
  const freshDensity = unroundedCement + batchWater + batchFA + batchCA + admMass;
  const concreteYield = vCement + vWater + vAir + vAdm + vAgg;

  const cementCompliance = cement > 450 ? 'fail' : 'pass';

  return {
    targetStrength,
    designWater,
    wcRatio: adoptedWC,
    cement,
    coarseAggregateFraction: caFraction,
    fineAggregateFraction: faFraction,
    ssdFA,
    ssdCA,
    batchWater,
    batchFA,
    batchCA,
    admixtureMass: admMass,
    mixRatioFA,
    mixRatioCA,
    freshDensity,
    concreteYield,
    cementCompliance,
  };
}

// ─── HARNESS RUNNER ─────────────────────────────────────────────────────────

async function executeIndependentOracleHarness() {
  console.log('================================================================================');
  console.log('   CIVILSUITE — DECOUPLED INDEPENDENT ENGINEERING ORACLE AUDIT HARNESS (PHASE 5)');
  console.log('================================================================================');

  const testInput: MixDesignInput = {
    projectDetails: {
      projectName: 'Independent Oracle Verification',
      clientName: 'Audit Team',
      engineerName: 'QA Agent',
      date: '2026-08-13',
      location: 'Pune',
      remarks: 'Independent oracle execution',
    },
    designParameters: {
      concreteGrade: 'M30',
      exposureCondition: 'moderate',
      slump: 100,
      maxAggregateSize: 20,
      isPumpedConcrete: false,
      isAirEntrained: true,
      targetAirContent: 4.0,
      faZone: 'II',
      siteControl: 'good',
    },
    materialProperties: {
      cement: { type: 'OPC_43', specificGravity: 3.15 },
      fineAggregate: { specificGravity: 2.65, waterAbsorption: 1.0, surfaceMoisture: 0.0, finesModulus: 2.8 },
      coarseAggregate: { specificGravity: 2.70, waterAbsorption: 0.5, surfaceMoisture: 0.0, angularity: 'angular' },
      water: { source: 'Potable' },
      admixture: { type: 'Air Entraining Agent', dosage: 0.5, dosageBasis: 'percentage', specificGravity: 1.20, waterReduction: 0 },
    },
  };

  const oracleResult = runDecoupledIndependentOracle(testInput);
  const productionResult = runMixDesignCalculation(testInput);

  console.log('\nAudit Comparison (Air-Entrained M30 Audit Case):');
  console.log(`  Target Strength:       Oracle: ${oracleResult.targetStrength.toFixed(2)} MPa | Production: ${productionResult.calculationSteps[0].result}`);
  console.log(`  Design Water:          Oracle: ${oracleResult.designWater.toFixed(2)} kg/m³ | Production: ${productionResult.designWater} kg/m³`);
  console.log(`  Adopted W/C:           Oracle: ${oracleResult.wcRatio.toFixed(4)} | Production: ${productionResult.wcRatio.toFixed(4)}`);
  console.log(`  Cement Content:        Oracle: ${oracleResult.cement} kg/m³ | Production: ${productionResult.cement} kg/m³`);
  console.log(`  SSD FA:                Oracle: ${oracleResult.ssdFA.toFixed(2)} kg/m³ | Production: ${(productionResult.mixRatioFineAggregate * productionResult.cement).toFixed(2)} kg/m³`);
  console.log(`  SSD CA:                Oracle: ${oracleResult.ssdCA.toFixed(2)} kg/m³ | Production: ${(productionResult.mixRatioCoarseAggregate * productionResult.cement).toFixed(2)} kg/m³`);
  console.log(`  Batch Water:           Oracle: ${oracleResult.batchWater.toFixed(2)} kg/m³ | Production: ${productionResult.water.toFixed(2)} kg/m³`);
  console.log(`  Batch FA:              Oracle: ${oracleResult.batchFA.toFixed(2)} kg/m³ | Production: ${productionResult.fineAggregate.toFixed(2)} kg/m³`);
  console.log(`  Batch CA:              Oracle: ${oracleResult.batchCA.toFixed(2)} kg/m³ | Production: ${productionResult.coarseAggregate.toFixed(2)} kg/m³`);
  console.log(`  SSD Mix Ratio:         Oracle: 1 : ${oracleResult.mixRatioFA.toFixed(2)} : ${oracleResult.mixRatioCA.toFixed(2)} | Production: 1 : ${productionResult.mixRatioFineAggregate.toFixed(2)} : ${productionResult.mixRatioCoarseAggregate.toFixed(2)}`);
  console.log(`  Fresh Density:         Oracle: ${oracleResult.freshDensity.toFixed(1)} kg/m³ | Production: ${productionResult.density.toFixed(1)} kg/m³`);
  console.log(`  Yield:                 Oracle: ${oracleResult.concreteYield.toFixed(4)} m³ | Production: ${productionResult.yield?.toFixed(4)} m³`);

  const waterDiff = Math.abs(oracleResult.batchWater - productionResult.water);
  const cementDiff = Math.abs(oracleResult.cement - productionResult.cement);
  const densityDiff = Math.abs(oracleResult.freshDensity - productionResult.density);

  if (waterDiff < 0.15 && cementDiff === 0 && densityDiff < 0.2) {
    console.log('\n[PASS] DECOUPLED INDEPENDENT ORACLE MATCHES PRODUCTION ENGINE WITHIN 0.1% PRECISION TOLERANCE.');
  } else {
    console.error('\n[FAIL] DIVERGENCE DETECTED BETWEEN DECOUPLED INDEPENDENT ORACLE AND PRODUCTION ENGINE!');
    process.exit(1);
  }
}

executeIndependentOracleHarness().catch((err) => {
  console.error('Oracle Harness Error:', err);
  process.exit(1);
});
