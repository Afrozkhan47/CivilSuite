/**
 * FINAL BLACK-BOX VALIDATION — CIVILSUITE
 * 
 * This script calls runMixDesignCalculation() with the exact same MixDesignInput
 * that the UI would construct. This is functionally identical to what happens
 * when the user clicks "Calculate" — the UI calls this same function and displays
 * the returned MixDesignResult.
 */
import { runMixDesignCalculation } from '../src/features/mix-design/calculations';
import type { MixDesignInput, MixDesignResult, CalculationStep } from '../src/features/mix-design/types';

// ─── Helper: Print full calculation trace ────────────────────────────────────
function printFullTrace(label: string, input: MixDesignInput, res: MixDesignResult) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`  ${label}`);
  console.log(`${'='.repeat(80)}`);

  // Print inputs
  console.log('\nINPUTS:');
  console.log(`  Grade: ${input.designParameters.concreteGrade}`);
  console.log(`  Exposure: ${input.designParameters.exposureCondition}`);
  console.log(`  Slump: ${input.designParameters.slump} mm`);
  console.log(`  MSA: ${input.designParameters.maxAggregateSize} mm`);
  console.log(`  Pumped: ${input.designParameters.isPumpedConcrete}`);
  console.log(`  Air Entrained: ${input.designParameters.isAirEntrained}`);
  if (input.designParameters.targetAirContent !== undefined)
    console.log(`  Target Air Content: ${input.designParameters.targetAirContent}%`);
  console.log(`  FA Zone: ${input.designParameters.faZone ?? 'II'}`);
  console.log(`  Site Control: ${input.designParameters.siteControl ?? 'good'}`);
  if (input.designParameters.adoptedWcOverride !== undefined)
    console.log(`  W/C Override: ${input.designParameters.adoptedWcOverride}`);
  console.log(`  Cement Type: ${input.materialProperties.cement.type}`);
  console.log(`  Cement SG: ${input.materialProperties.cement.specificGravity}`);
  if ((input.materialProperties.cement as any).grade !== undefined)
    console.log(`  Cement 28-Day Strength: ${(input.materialProperties.cement as any).grade} MPa`);
  console.log(`  FA SG: ${input.materialProperties.fineAggregate.specificGravity}`);
  console.log(`  FA WA: ${input.materialProperties.fineAggregate.waterAbsorption}%`);
  console.log(`  FA SM: ${input.materialProperties.fineAggregate.surfaceMoisture ?? 0}%`);
  console.log(`  CA SG: ${input.materialProperties.coarseAggregate.specificGravity}`);
  console.log(`  CA WA: ${input.materialProperties.coarseAggregate.waterAbsorption}%`);
  console.log(`  CA SM: ${input.materialProperties.coarseAggregate.surfaceMoisture ?? 0}%`);
  console.log(`  CA Angularity: ${input.materialProperties.coarseAggregate.angularity ?? 'angular'}`);
  if (input.materialProperties.admixture?.dosage)
    console.log(`  Admixture: ${input.materialProperties.admixture.type}, Dosage=${input.materialProperties.admixture.dosage}, Basis=${input.materialProperties.admixture.dosageBasis}, SG=${input.materialProperties.admixture.specificGravity}, WR=${input.materialProperties.admixture.waterReduction}%`);
  else
    console.log(`  Admixture: None`);

  // Print every calculation step
  res.calculationSteps.forEach((step: CalculationStep) => {
    console.log(`\n  ── STEP ${step.stepNumber}: ${step.title} ──`);
    console.log(`  Formula: ${step.formula}`);
    console.log(`  Inputs:`);
    Object.entries(step.inputs).forEach(([k, v]) => console.log(`    ${k} = ${v}`));
    console.log(`  Calculation: ${step.calculation}`);
    console.log(`  Result: ${step.result}`);
    console.log(`  IS Clause: ${step.isCodeClause}`);
    console.log(`  Placeholder: ${step.isPlaceholder}`);
  });

  // Print final result
  console.log('\n  ── FINAL RESULT ──');
  console.log(`  Design Water: ${res.designWater} kg/m³`);
  console.log(`  Batch Water: ${res.water} kg/m³`);
  console.log(`  W/C Ratio: ${res.wcRatio}`);
  console.log(`  Cement: ${res.cement} kg/m³`);
  console.log(`  Fine Aggregate: ${res.fineAggregate} kg/m³`);
  console.log(`  Coarse Aggregate: ${res.coarseAggregate} kg/m³`);
  console.log(`  Admixture: ${res.admixture} kg/m³`);
  console.log(`  Mix Ratio: 1 : ${res.mixRatioFineAggregate} : ${res.mixRatioCoarseAggregate}`);
  console.log(`  Fresh Density: ${res.density} kg/m³`);
  console.log(`  Yield: ${res.yield} m³`);
  console.log(`  Cement Compliance: ${res.cementContentCheck}`);
  console.log(`  Durability Check: ${res.durabilityCheck}`);
  console.log(`  Strength Check: ${res.strengthCheck}`);
  console.log(`  Is Placeholder: ${res.isPlaceholder}`);
  if (res.yieldError) console.log(`  Yield Error: ${res.yieldError}`);
}

// ─── CONSOLIDATED TABLE ROW ──────────────────────────────────────────────────
interface Row {
  test: string; targetStrength: string; water: number; wc: number; cement: number;
  fa: number; ca: number; batchWater: number; admixture: number | null;
  air: string; yield: number | null; density: number; compliance: string;
}
const rows: Row[] = [];

function addRow(test: string, input: MixDesignInput, res: MixDesignResult) {
  const step1 = res.calculationSteps.find(s => s.stepNumber === 1);
  const step5 = res.calculationSteps.find(s => s.stepNumber === 5);
  const airLabel = (step5?.inputs as any)?.['Air Content'] ?? '?';
  rows.push({
    test,
    targetStrength: step1?.result?.match(/([\d.]+) N\/mm/)?.[1] ?? '?',
    water: res.designWater,
    wc: res.wcRatio,
    cement: res.cement,
    fa: res.fineAggregate,
    ca: res.coarseAggregate,
    batchWater: res.water,
    admixture: res.admixture,
    air: airLabel,
    yield: res.yield,
    density: res.density,
    compliance: res.cementContentCheck,
  });
}

// ─── TEST 1: BASELINE ────────────────────────────────────────────────────────
function test1(): MixDesignInput {
  return {
    projectDetails: { projectName: 'Final Validation 1', clientName: 'Test Client', engineerName: 'Afroz', date: '2026-08-11', location: 'Pune', remarks: 'Baseline validation' },
    designParameters: { concreteGrade: 'M30', exposureCondition: 'moderate', slump: 100, maxAggregateSize: 20, isPumpedConcrete: false, isAirEntrained: false, faZone: 'II', siteControl: 'good' },
    materialProperties: {
      cement: { type: 'OPC_43', specificGravity: 3.15 },
      fineAggregate: { specificGravity: 2.65, waterAbsorption: 1.0, surfaceMoisture: 0, finesModulus: 2.75 },
      coarseAggregate: { specificGravity: 2.70, waterAbsorption: 0.5, surfaceMoisture: 0, angularity: 'angular' },
      water: { source: 'Potable' },
      admixture: {},
    },
  };
}

{
  const input = test1();
  const res = runMixDesignCalculation(input);
  printFullTrace('TEST 1 — BASELINE', input, res);
  addRow('T1 Baseline', input, res);
}

// ─── TEST 2A/2B/2C: CA ANGULARITY ───────────────────────────────────────────
(['angular', 'sub-angular', 'rounded'] as const).forEach((ang, i) => {
  const input = test1();
  input.materialProperties.coarseAggregate.angularity = ang;
  const res = runMixDesignCalculation(input);
  printFullTrace(`TEST 2${String.fromCharCode(65 + i)} — CA Angularity: ${ang}`, input, res);
  addRow(`T2${String.fromCharCode(65 + i)} ${ang}`, input, res);
});

// ─── TEST 3: ADMIXTURE + MOISTURE ────────────────────────────────────────────
{
  const input: MixDesignInput = {
    projectDetails: { projectName: 'Final Validation 3', clientName: 'Test Client', engineerName: 'Afroz', date: '2026-08-11', location: 'Pune', remarks: 'Admixture + Moisture' },
    designParameters: { concreteGrade: 'M40', exposureCondition: 'moderate', slump: 150, maxAggregateSize: 20, isPumpedConcrete: false, isAirEntrained: false, faZone: 'II', siteControl: 'good', adoptedWcOverride: 0.35 },
    materialProperties: {
      cement: { type: 'OPC_43', specificGravity: 2.93 },
      fineAggregate: { specificGravity: 2.65, waterAbsorption: 1.2, surfaceMoisture: 2.0, finesModulus: 2.75 },
      coarseAggregate: { specificGravity: 2.82, waterAbsorption: 0.9, surfaceMoisture: 0.5, angularity: 'angular' },
      water: { source: 'Potable' },
      admixture: { type: 'PCE / Superplasticizer', dosage: 4.8, dosageBasis: 'liters_per_m3', specificGravity: 1.121, waterReduction: 25 },
    },
  };
  const res = runMixDesignCalculation(input);
  printFullTrace('TEST 3 — ADMIXTURE + MOISTURE', input, res);
  addRow('T3 Admix+Moist', input, res);
}

// ─── TEST 4: PUMPED CONCRETE ─────────────────────────────────────────────────
{
  const input = test1();
  input.designParameters.isPumpedConcrete = true;
  const res = runMixDesignCalculation(input);
  printFullTrace('TEST 4 — PUMPED CONCRETE', input, res);
  addRow('T4 Pumped', input, res);
}

// ─── TEST 5A/5B/5C: AIR ENTRAINED ───────────────────────────────────────────
[5.0, 6.0, 7.0].forEach((air, i) => {
  const input = test1();
  input.designParameters.isAirEntrained = true;
  input.designParameters.targetAirContent = air;
  const res = runMixDesignCalculation(input);
  printFullTrace(`TEST 5${String.fromCharCode(65 + i)} — Air Entrained ${air}%`, input, res);
  addRow(`T5${String.fromCharCode(65 + i)} Air ${air}%`, input, res);
});

// ─── TEST 6A: PPC + ACTUAL STRENGTH ─────────────────────────────────────────
{
  const input = test1();
  input.materialProperties.cement = { type: 'PPC', specificGravity: 2.90, grade: 55 };
  const res = runMixDesignCalculation(input);
  printFullTrace('TEST 6A — PPC + Actual 28-Day = 55 MPa', input, res);
  addRow('T6A PPC 55MPa', input, res);
}

// ─── TEST 6B: PPC WITHOUT ACTUAL STRENGTH ────────────────────────────────────
{
  const input = test1();
  input.materialProperties.cement = { type: 'PPC', specificGravity: 2.90 };
  const res = runMixDesignCalculation(input);
  printFullTrace('TEST 6B — PPC, No Actual Strength', input, res);
  addRow('T6B PPC noStr', input, res);
}

// ─── TEST 7: DURABILITY / W-C OVERRIDE ──────────────────────────────────────
{
  const input: MixDesignInput = {
    projectDetails: { projectName: 'Final Validation 7', clientName: 'Test Client', engineerName: 'Afroz', date: '2026-08-11', location: 'Pune', remarks: 'Durability / W/C Override' },
    designParameters: { concreteGrade: 'M40', exposureCondition: 'extreme', slump: 100, maxAggregateSize: 20, isPumpedConcrete: false, isAirEntrained: false, faZone: 'II', siteControl: 'good', adoptedWcOverride: 0.50 },
    materialProperties: {
      cement: { type: 'OPC_43', specificGravity: 2.90 },
      fineAggregate: { specificGravity: 2.65, waterAbsorption: 1.2, surfaceMoisture: 0, finesModulus: 2.75 },
      coarseAggregate: { specificGravity: 2.70, waterAbsorption: 0.5, surfaceMoisture: 0, angularity: 'angular' },
      water: { source: 'Potable' },
      admixture: {},
    },
  };
  const res = runMixDesignCalculation(input);
  printFullTrace('TEST 7 — DURABILITY / W-C OVERRIDE (M40 Extreme, Override=0.50)', input, res);
  addRow('T7 Durability', input, res);
}

// ─── TEST 8: COMBINED STRESS TEST ───────────────────────────────────────────
{
  const input: MixDesignInput = {
    projectDetails: { projectName: 'Final Validation 8', clientName: 'Test Client', engineerName: 'Afroz', date: '2026-08-11', location: 'Pune', remarks: 'Combined stress test' },
    designParameters: { concreteGrade: 'M40', exposureCondition: 'moderate', slump: 150, maxAggregateSize: 20, isPumpedConcrete: true, isAirEntrained: false, faZone: 'II', siteControl: 'good', adoptedWcOverride: 0.35 },
    materialProperties: {
      cement: { type: 'OPC_43', specificGravity: 2.93 },
      fineAggregate: { specificGravity: 2.65, waterAbsorption: 1.2, surfaceMoisture: 2.0, finesModulus: 2.75 },
      coarseAggregate: { specificGravity: 2.82, waterAbsorption: 0.9, surfaceMoisture: 0.5, angularity: 'sub-angular' },
      water: { source: 'Potable' },
      admixture: { type: 'PCE / Superplasticizer', dosage: 4.8, dosageBasis: 'liters_per_m3', specificGravity: 1.121, waterReduction: 25 },
    },
  };
  const res = runMixDesignCalculation(input);
  printFullTrace('TEST 8 — COMBINED STRESS TEST', input, res);
  addRow('T8 Combined', input, res);
}

// ─── CONSOLIDATED TABLE ─────────────────────────────────────────────────────
console.log(`\n${'='.repeat(80)}`);
console.log('  CONSOLIDATED RESULTS TABLE');
console.log(`${'='.repeat(80)}`);
console.log('Test             | TargStr | Water | W/C    | Cement | FA     | CA     | Batch  | Admix | Air                    | Yield  | Dens   | Comp');
console.log('-'.repeat(180));
rows.forEach(r => {
  console.log(
    `${r.test.padEnd(17)}| ${r.targetStrength.padEnd(8)}| ${String(r.water).padEnd(6)}| ${r.wc.toFixed(4).padEnd(7)}| ${String(r.cement).padEnd(7)}| ${String(r.fa).padEnd(7)}| ${String(r.ca).padEnd(7)}| ${String(r.batchWater).padEnd(7)}| ${String(r.admixture ?? 0).padEnd(6)}| ${r.air.substring(0, 23).padEnd(23)}| ${String(r.yield ?? 'null').padEnd(7)}| ${String(r.density).padEnd(7)}| ${r.compliance}`
  );
});
