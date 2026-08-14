import { runMixDesignCalculation } from '../src/features/mix-design/calculations';
import type { MixDesignInput } from '../src/features/mix-design/types';

function createBaseInput(): MixDesignInput {
  return {
    projectDetails: {
      projectName: 'Final Audit',
      clientName: 'Test Client',
      engineerName: 'Test Engineer',
      date: '2026-08-11',
      location: 'Test Location',
      remarks: 'Test Remarks',
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
}

const cases = [
  { name: 'A. Standard M30 angular aggregate mix', modify: (i: MixDesignInput) => {} },
  { name: 'B. Sub-angular aggregate', modify: (i: MixDesignInput) => { i.materialProperties.coarseAggregate.angularity = 'sub-angular'; } },
  { name: 'C. Rounded aggregate', modify: (i: MixDesignInput) => { i.materialProperties.coarseAggregate.angularity = 'rounded'; } },
  { name: 'D. Air entrained = false', modify: (i: MixDesignInput) => { i.designParameters.isAirEntrained = false; } },
  { name: 'E. Air entrained = true with target air content', modify: (i: MixDesignInput) => { i.designParameters.isAirEntrained = true; i.designParameters.targetAirContent = 5.0; } },
  { name: 'F. PPC without actual 28-day strength', modify: (i: MixDesignInput) => { i.materialProperties.cement.type = 'PPC'; } },
  { name: 'G. PPC with actual 28-day strength', modify: (i: MixDesignInput) => { i.materialProperties.cement.type = 'PPC'; i.materialProperties.cement.grade = 55; } },
  { name: 'H. Admixture with explicit water reduction', modify: (i: MixDesignInput) => { i.materialProperties.admixture = { type: 'Superplasticizer', dosage: 1, dosageBasis: 'percentage', waterReduction: 20, specificGravity: 1.05 }; } },
  { name: 'I. Dry aggregates', modify: (i: MixDesignInput) => { i.materialProperties.fineAggregate.waterAbsorption = 2.0; i.materialProperties.fineAggregate.surfaceMoisture = 0; } },
  { name: 'J. Wet aggregates', modify: (i: MixDesignInput) => { i.materialProperties.fineAggregate.waterAbsorption = 1.0; i.materialProperties.fineAggregate.surfaceMoisture = 3.0; } },
  { name: 'K. Pumped concrete', modify: (i: MixDesignInput) => { i.designParameters.isPumpedConcrete = true; } },
  { name: 'L. Non-pumped concrete', modify: (i: MixDesignInput) => { i.designParameters.isPumpedConcrete = false; } },
  { name: 'M. Different FA zones', modify: (i: MixDesignInput) => { i.designParameters.faZone = 'I'; } },
  { name: 'N. Different MSA', modify: (i: MixDesignInput) => { i.designParameters.maxAggregateSize = 40; } },
  { name: 'O. Different exposure conditions', modify: (i: MixDesignInput) => { i.designParameters.exposureCondition = 'severe'; } },
  { name: 'P. W/C override', modify: (i: MixDesignInput) => { i.designParameters.adoptedWcOverride = 0.35; } },
  { name: 'Q. Cement > 450 kg/m³ compliance failure', modify: (i: MixDesignInput) => { i.designParameters.concreteGrade = 'M40'; i.materialProperties.cement.type = 'OPC_33'; } },
];

cases.forEach(c => {
  const input = createBaseInput();
  c.modify(input);
  const res = runMixDesignCalculation(input);
  console.log(`\n=== CASE ${c.name} ===`);
  console.log(`Water: ${res.water} (Design: ${res.designWater}), W/C: ${res.wcRatio}, Cement: ${res.cement}, FA: ${res.fineAggregate}, CA: ${res.coarseAggregate}, Yield: ${res.yield}, Status: ${res.cementContentCheck}`);
});
