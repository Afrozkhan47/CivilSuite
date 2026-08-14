import { runMixDesignCalculation } from '../src/features/mix-design/calculations';
import type { MixDesignInput } from '../src/features/mix-design/types';

// This is the EXACT T8 input from final_black_box_validation.ts lines 214-228
const t8Input: MixDesignInput = {
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

const res = runMixDesignCalculation(t8Input);

console.log("=== T8 FORENSIC TRACE ===\n");

// Print every step in full
res.calculationSteps.forEach(step => {
  console.log(`\n--- STEP ${step.stepNumber}: ${step.title} ---`);
  console.log(`Formula: ${step.formula}`);
  console.log(`Inputs:`);
  Object.entries(step.inputs).forEach(([k, v]) => console.log(`  ${k} = ${v}`));
  console.log(`Calculation: ${step.calculation}`);
  console.log(`Result: ${step.result}`);
  console.log(`IS Clause: ${step.isCodeClause}`);
  console.log(`Placeholder: ${step.isPlaceholder}`);
});

console.log("\n\n--- FINAL RESULT ---");
console.log(`Design Water: ${res.designWater}`);
console.log(`Batch Water: ${res.water}`);
console.log(`W/C Ratio: ${res.wcRatio}`);
console.log(`Cement: ${res.cement}`);
console.log(`Fine Aggregate (batch): ${res.fineAggregate}`);
console.log(`Coarse Aggregate (batch): ${res.coarseAggregate}`);
console.log(`Admixture: ${res.admixture}`);
console.log(`Mix Ratio: 1 : ${res.mixRatioFineAggregate} : ${res.mixRatioCoarseAggregate}`);
console.log(`Fresh Density: ${res.density}`);
console.log(`Yield: ${res.yield}`);
console.log(`Cement Compliance: ${res.cementContentCheck}`);
console.log(`Durability Check: ${res.durabilityCheck}`);
console.log(`Strength Check: ${res.strengthCheck}`);
console.log(`Is Placeholder: ${res.isPlaceholder}`);
