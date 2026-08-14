import { runMixDesignCalculation } from '../src/features/mix-design/calculations';
import type { MixDesignInput } from '../src/features/mix-design/types';

function base(): MixDesignInput {
  return {
    projectDetails: { projectName: 'Yield Bug Verification', clientName: '', engineerName: '', date: '2026-08-11', location: '', remarks: '' },
    designParameters: {
      concreteGrade: 'M30', exposureCondition: 'moderate', slump: 100, maxAggregateSize: 20,
      isPumpedConcrete: false, isAirEntrained: false, faZone: 'II', siteControl: 'good',
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

function volCheck(res: any, airPctExpected: number, cementSG: number, faSG: number, caSG: number) {
  const vCement = res.cement / (cementSG * 1000);
  const vWater = res.designWater / 1000;
  const vFA = (res.fineAggregate as number) / (faSG * 1000); // SSD FA from step 5/6 — but res.fineAggregate is batch (moisture-corrected)
  // We need the SSD values. We can recompute them from the calculation steps.
  // Actually, the yield uses SSD FA/CA from aggSteps, and we can derive them:
  // Let's just check that yield ≈ 1.0 and the reported air % matches.
  const vAir = airPctExpected / 100;
  return { vCement, vWater, vAir };
}

function runCase(name: string, airEntrained: boolean, targetAir: number | undefined): void {
  const input = base();
  input.designParameters.isAirEntrained = airEntrained;
  if (targetAir !== undefined) (input.designParameters as any).targetAirContent = targetAir;
  const res = runMixDesignCalculation(input);

  const step5 = res.calculationSteps.find(s => s.stepNumber === 5);
  const step5Calc = step5?.calculation as string;
  // Extract V_air from step5 calculation string
  const airMatch = step5Calc?.match(/V_air = ([\d.]+)% \(([^)]+)\) = ([\d.]+) m/);
  const airPctUsedInAgg = airMatch ? parseFloat(airMatch[1]) : NaN;
  const airSourceInAgg = airMatch ? airMatch[2] : 'PARSE_ERROR';

  // Extract Step 5 inputs Air Content label
  const step5AirLabel = (step5?.inputs as any)?.['Air Content'] ?? 'MISSING';

  console.log(`\n=== ${name} ===`);
  console.log(`Air Entrained: ${airEntrained}, Target Air Content: ${targetAir ?? 'undefined'}`);
  console.log(`Step 5 Air %: ${airPctUsedInAgg}% (source: ${airSourceInAgg})`);
  console.log(`Step 5 Air Label: ${step5AirLabel}`);
  console.log(`Design Water: ${res.designWater}, Cement: ${res.cement}`);
  console.log(`FA (batch): ${res.fineAggregate}, CA (batch): ${res.coarseAggregate}`);
  console.log(`Yield: ${res.yield}`);
  console.log(`Yield ≈ 1.0? ${res.yield !== null && Math.abs(res.yield - 1.0) < 0.01 ? 'PASS' : 'FAIL (yield = ' + res.yield + ')'}`);
}

// TEST 1: Normal non-entrained
runCase('TEST 1 — Normal Non-Entrained (M30, 20mm)', false, undefined);

// TEST 2: Air entrained 5%
runCase('TEST 2 — Air Entrained 5%', true, 5.0);

// TEST 3: Air entrained 6%
runCase('TEST 3 — Air Entrained 6%', true, 6.0);

// TEST 4: Air entrained 7%
runCase('TEST 4 — Air Entrained 7%', true, 7.0);

// TEST 5: High-strength non-entrained
{
  const input = base();
  input.designParameters.concreteGrade = 'M70';
  input.materialProperties.cement = { type: 'OPC_53', specificGravity: 3.15 };
  input.designParameters.isAirEntrained = false;
  const res = runMixDesignCalculation(input);
  const step5 = res.calculationSteps.find(s => s.stepNumber === 5);
  const step5Calc = step5?.calculation as string;
  const airMatch = step5Calc?.match(/V_air = ([\d.]+)% \(([^)]+)\) = ([\d.]+) m/);
  const step5AirLabel = (step5?.inputs as any)?.['Air Content'] ?? 'MISSING';
  console.log(`\n=== TEST 5 — High-Strength Non-Entrained (M70, 20mm) ===`);
  console.log(`Air Entrained: false, Target Air: undefined`);
  console.log(`Step 5 Air %: ${airMatch ? airMatch[1] : 'N/A'}% (source: ${airMatch ? airMatch[2] : 'N/A'})`);
  console.log(`Step 5 Air Label: ${step5AirLabel}`);
  console.log(`Yield: ${res.yield}`);
  console.log(`Yield ≈ 1.0? ${res.yield !== null && Math.abs(res.yield - 1.0) < 0.01 ? 'PASS' : 'FAIL (yield = ' + res.yield + ')'}`);
}

// TEST 6: Target air present but isAirEntrained = false
{
  const input = base();
  input.designParameters.isAirEntrained = false;
  (input.designParameters as any).targetAirContent = 5.0; // Set but should be ignored
  const res = runMixDesignCalculation(input);
  const step5 = res.calculationSteps.find(s => s.stepNumber === 5);
  const step5Calc = step5?.calculation as string;
  const airMatch = step5Calc?.match(/V_air = ([\d.]+)% \(([^)]+)\) = ([\d.]+) m/);
  const step5AirLabel = (step5?.inputs as any)?.['Air Content'] ?? 'MISSING';
  console.log(`\n=== TEST 6 — Target Air Present but isAirEntrained=false ===`);
  console.log(`Air Entrained: false, Target Air: 5.0 (should be IGNORED)`);
  console.log(`Step 5 Air %: ${airMatch ? airMatch[1] : 'N/A'}% (source: ${airMatch ? airMatch[2] : 'N/A'})`);
  console.log(`Step 5 Air Label: ${step5AirLabel}`);
  console.log(`Yield: ${res.yield}`);
  console.log(`Uses Table 3 (1%)? ${airMatch && airMatch[1] === '1' ? 'PASS' : 'FAIL'}`);
}
