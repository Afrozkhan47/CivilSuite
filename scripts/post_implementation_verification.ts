import { runMixDesignCalculation } from '../src/features/mix-design/calculations';
import type { MixDesignInput } from '../src/features/mix-design/types';

const baseInput: MixDesignInput = {
  projectDetails: {
    projectName: 'Verification',
    clientName: '',
    engineerName: '',
    date: '2026-08-11',
    location: '',
    remarks: '',
  },
  designParameters: {
    concreteGrade: 'M30',
    exposureCondition: 'moderate',
    slump: 100,
    maxAggregateSize: 20,
    isPumpedConcrete: false,
    isAirEntrained: false,
    faZone: 'II',
    siteControl: 'good',
  },
  materialProperties: {
    cement: { type: 'OPC_43', specificGravity: 3.15 },
    fineAggregate: { specificGravity: 2.65, waterAbsorption: 1.0, surfaceMoisture: 0 },
    coarseAggregate: { specificGravity: 2.70, waterAbsorption: 0.5, surfaceMoisture: 0, angularity: 'angular' },
    water: { source: 'Potable' },
    admixture: {},
  },
};

console.log("=== CA ANGULARITY NUMERICAL TEST ===");
['angular', 'sub-angular', 'rounded'].forEach(ang => {
  const input = JSON.parse(JSON.stringify(baseInput));
  input.materialProperties.coarseAggregate.angularity = ang;
  const res = runMixDesignCalculation(input);
  
  const step2 = res.calculationSteps.find(s => s.stepNumber === 2);
  console.log(`\nCase: ${ang}`);
  console.log("Step 2 Calculation:", step2?.calculation);
  console.log(`Final Design Water: ${res.designWater} kg/m³`);
  console.log(`Batch Water: ${res.water} kg/m³`);
  console.log(`W/C: ${res.wcRatio}`);
  console.log(`Cement: ${res.cement}`);
  console.log(`FA: ${res.fineAggregate}`);
  console.log(`CA: ${res.coarseAggregate}`);
});

console.log("\n=== AIR ENTRAINMENT NUMERICAL TEST ===");
[
  { name: 'Case A (No)', entrained: false },
  { name: 'Case B (Yes, 5.0%)', entrained: true, target: 5.0 }
].forEach(c => {
  const input = JSON.parse(JSON.stringify(baseInput));
  input.designParameters.isAirEntrained = c.entrained;
  if (c.target) input.designParameters.targetAirContent = c.target;
  const res = runMixDesignCalculation(input);
  
  const step5 = res.calculationSteps.find(s => s.stepNumber === 5);
  console.log(`\n${c.name}`);
  console.log("Step 5 Inputs:", JSON.stringify(step5?.inputs));
  console.log("Step 5 Calculation:", step5?.calculation);
  console.log(`Yield: ${res.yield}`);
  console.log(`Cement Volume (indirectly via yield): ${res.cement / (3.15 * 1000)}`);
  console.log(`Water Volume: ${res.designWater / 1000}`);
  console.log(`FA: ${res.fineAggregate}`);
  console.log(`CA: ${res.coarseAggregate}`);
});

console.log("\n=== ACTUAL CEMENT STRENGTH TEST ===");
[
  { name: 'Case A (Undefined)', grade: undefined },
  { name: 'Case B (55 MPa)', grade: 55 }
].forEach(c => {
  const input = JSON.parse(JSON.stringify(baseInput));
  input.materialProperties.cement.type = 'PPC';
  if (c.grade) input.materialProperties.cement.grade = c.grade;
  const res = runMixDesignCalculation(input);
  
  const step3 = res.calculationSteps.find(s => s.stepNumber === 3);
  console.log(`\n${c.name}`);
  console.log("Cement Type: PPC");
  console.log(`Actual strength input: ${c.grade}`);
  console.log("Step 3 Inputs:", JSON.stringify(step3?.inputs));
  console.log("Step 3 Calculation:", step3?.calculation);
  console.log(`W/C Result: ${res.wcRatio}`);
  console.log(`Cement: ${res.cement}`);
});

console.log("\n=== REGRESSION CHECK (M30) ===");
{
  const input = JSON.parse(JSON.stringify(baseInput));
  const res = runMixDesignCalculation(input);
  const step1 = res.calculationSteps.find(s => s.stepNumber === 1);
  console.log("Target Strength:", step1?.result);
  console.log("Design Water:", res.designWater);
  console.log("W/C:", res.wcRatio);
  console.log("Raw Cement:", res.cement);
  console.log("Status:", res.cementContentCheck);
}
