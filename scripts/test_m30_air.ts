import { runMixDesignCalculation } from '../src/features/mix-design/calculations';
import type { MixDesignInput } from '../src/features/mix-design/types';

const testInput: MixDesignInput = {
  projectDetails: {
    projectName: 'Test',
    clientName: 'Test',
    engineerName: 'Test',
    date: '2026-08-12',
    location: 'Test'
  },
  designParameters: {
    concreteGrade: 'M30',
    exposureCondition: 'moderate',
    slump: 100,
    maxAggregateSize: 20,
    isPumpedConcrete: true,
    isAirEntrained: true,
    targetAirContent: 4.0,
    siteControl: 'good',
    faZone: 'II',
  },
  materialProperties: {
    cement: { type: 'OPC_43', grade: 43, specificGravity: 3.15 },
    fineAggregate: { specificGravity: 2.65, waterAbsorption: 1.0, surfaceMoisture: 0 },
    coarseAggregate: { specificGravity: 2.70, waterAbsorption: 0.5, surfaceMoisture: 0 },
    water: { source: 'potable' },
    admixture: {
      dosage: 0.5,
      dosageBasis: 'percentage',
      specificGravity: 1.20,
      waterReduction: 0,
    },
  },
};

const result = runMixDesignCalculation(testInput);

console.log("M30 Air-entrained Test Result:");
console.log(`- Target strength ≈ ${result.calculationSteps[0].result} MPa`);
console.log(`- Water ≈ ${result.designWater} kg/m³`);
console.log(`- W/C ≈ ${result.wcRatio}`);
console.log(`- Cement ≈ ${result.cement} kg/m³`);
console.log(`- Cement compliance = ${result.cementContentCheck}`);
console.log(`- Air Content step input = ${result.calculationSteps[4].inputs['Air Content']}`);

const ssdFA = result.mixRatioFineAggregate * result.cement;
const ssdCA = result.mixRatioCoarseAggregate * result.cement;

console.log("\nAggregate Verification:");
console.log(`1. SSD/design FA: ${ssdFA.toFixed(1)} kg/m³ (Source: aggSteps.fineAggregate.value)`);
console.log(`2. SSD/design CA: ${ssdCA.toFixed(1)} kg/m³ (Source: aggSteps.coarseAggregate.value)`);
console.log(`3. Batch/field FA after moisture correction: ${result.fineAggregate} kg/m³ (Source: moistSteps.correctedFA.value)`);
console.log(`4. Batch/field CA after moisture correction: ${result.coarseAggregate} kg/m³ (Source: moistSteps.correctedCA.value)`);

console.log("\nStep Labels Verification:");
console.log(`- Step 6 Title (Aggregates): ${result.calculationSteps[5].title}`);
console.log(`- Step 7 Title (Moisture): ${result.calculationSteps[6].title}`);
console.log(`- Step 6 Result: ${result.calculationSteps[5].result}`);
