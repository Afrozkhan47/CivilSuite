/**
 * Comprehensive Calculation Engine Validation Matrix
 * IS 10262:2019 & IS 456:2000 Durability Rules
 *
 * Systematically tests the public calculation engine API (runMixDesignCalculation)
 * across grades, cement types, exposure conditions, slump values, aggregate sizes,
 * FA zones, placement methods, air entrainment, site control levels, moisture/absorption,
 * admixtures, and edge cases.
 */

import { describe, it, expect } from 'vitest';
import { runMixDesignCalculation } from '../calculations';
import { selectCementStrengthCurve } from '../calculations/cementCurveSelector';
import { lookupDurabilityLimits } from '../reference-data';
import { getCentralizedMixStatus } from '../utils/status';
import type { MixDesignInput, AllConcreteGrades, ExposureCondition } from '../types';

function buildInput(
  overrides: Partial<MixDesignInput['designParameters']> & { fck?: number } = {},
  matOverrides: any = {}
): MixDesignInput {
  const grade = overrides.concreteGrade ?? 'M30';
  const fck = overrides.fck ?? parseInt(grade.replace('M', ''), 10);
  return {
    projectDetails: {
      projectName: 'Validation Test Project',
      clientName: 'Test Client',
      engineerName: 'Test Engineer',
      date: '2026-08-14',
      location: 'Test Site',
    },
    designParameters: {
      concreteGrade: grade,
      fck,
      exposureCondition: overrides.exposureCondition ?? 'moderate',
      slump: overrides.slump ?? 100,
      maxAggregateSize: overrides.maxAggregateSize ?? 20,
      isPumpedConcrete: overrides.isPumpedConcrete ?? false,
      isAirEntrained: overrides.isAirEntrained ?? false,
      targetAirContent: overrides.targetAirContent,
      faZone: overrides.faZone ?? 'II',
      siteControl: overrides.siteControl ?? 'good',
      adoptedWcOverride: overrides.adoptedWcOverride,
    },
    materialProperties: {
      cement: {
        type: matOverrides.cementType ?? 'OPC_43',
        specificGravity: matOverrides.cementSG ?? 3.15,
        grade: matOverrides.cementGrade,
      },
      fineAggregate: {
        specificGravity: matOverrides.faSG ?? 2.65,
        waterAbsorption: matOverrides.faAbsorption ?? 1.0,
        surfaceMoisture: matOverrides.faMoisture ?? 0,
        finesModulus: matOverrides.finesModulus ?? 2.8,
      },
      coarseAggregate: {
        specificGravity: matOverrides.caSG ?? 2.70,
        waterAbsorption: matOverrides.caAbsorption ?? 0.5,
        surfaceMoisture: matOverrides.caMoisture ?? 0,
        angularity: matOverrides.caAngularity ?? 'angular',
      },
      water: {
        source: 'Potable Water',
      },
      admixture: matOverrides.admixture ?? {},
    },
  } as MixDesignInput;
}

// ─── A. CONCRETE GRADES MATRIX ───────────────────────────────────────────────
describe('A. Concrete Grades Matrix (M20 – M50)', () => {
  const grades: AllConcreteGrades[] = ['M20', 'M25', 'M30', 'M35', 'M40', 'M45', 'M50'];

  grades.forEach((grade) => {
    it(`evaluates grade ${grade} cleanly without crashing`, () => {
      const input = buildInput({ concreteGrade: grade });
      const res = runMixDesignCalculation(input);

      expect(res.calculationSteps.length).toBeGreaterThanOrEqual(8);
      const step1 = res.calculationSteps.find((s) => s.stepNumber === 1);
      expect(step1).toBeDefined();
      expect(step1!.result).toContain("f'ck =");

      const fck = parseInt(grade.replace('M', ''), 10);
      const targetVal = parseFloat(step1!.result.match(/[\d.]+/)?.[0] ?? '0');
      expect(targetVal).toBeGreaterThan(fck);
    });
  });
});

// ─── B. CEMENT TYPES MATRIX ──────────────────────────────────────────────────
describe('B. Cement Types Matrix (OPC 33, 43, 53, PPC, PSC, SRC)', () => {
  const typeCurveMap: Record<string, string> = {
    OPC_33: 'curve1',
    OPC_43: 'curve2',
    OPC_53: 'curve3',
    PPC: 'curve2',
    PSC: 'curve2',
    SRC: 'curve2',
  };

  Object.entries(typeCurveMap).forEach(([type, expectedCurve]) => {
    it(`selects correct default curve (${expectedCurve}) for cement type ${type}`, () => {
      const selNull = selectCementStrengthCurve(type, null);
      expect(selNull.curve).toBe(expectedCurve);
      expect(selNull.isDefault).toBe(true);

      const selZero = selectCementStrengthCurve(type, 0);
      expect(selZero.curve).toBe(expectedCurve);

      const selUndefined = selectCementStrengthCurve(type, undefined);
      expect(selUndefined.curve).toBe(expectedCurve);
    });
  });
});

// ─── C. EXPOSURE CONDITIONS MATRIX ───────────────────────────────────────────
describe('C. Exposure Conditions Matrix (Mild, Moderate, Severe, Very Severe, Extreme)', () => {
  const expLimits: { exp: ExposureCondition; maxWc: number; minC: number; minGrade: string }[] = [
    { exp: 'mild', maxWc: 0.55, minC: 300, minGrade: 'M20' },
    { exp: 'moderate', maxWc: 0.50, minC: 300, minGrade: 'M25' },
    { exp: 'severe', maxWc: 0.45, minC: 320, minGrade: 'M30' },
    { exp: 'very_severe', maxWc: 0.45, minC: 340, minGrade: 'M35' },
    { exp: 'extreme', maxWc: 0.40, minC: 360, minGrade: 'M40' },
  ];

  expLimits.forEach(({ exp, maxWc, minC, minGrade }) => {
    it(`correctly applies Table 5 limits for exposure '${exp}'`, () => {
      const entry = lookupDurabilityLimits(exp);
      expect(entry).not.toBeNull();
      expect(entry!.maxWCRatio).toBe(maxWc);
      expect(entry!.minCementContent).toBe(minC);
      expect(entry!.minGrade).toBe(minGrade);

      const input = buildInput({ exposureCondition: exp });
      const res = runMixDesignCalculation(input);
      const step3 = res.calculationSteps.find((s) => s.stepNumber === 3);
      expect(step3!.inputs['Durability max W/C (IS 456:2000 Table 5)']).toBe(maxWc);
    });
  });
});

// ─── D. SLUMP VALUES MATRIX ──────────────────────────────────────────────────
describe('D. Slump Values Matrix (50 mm baseline & +25 mm increments)', () => {
  it('uses base water for 50 mm slump baseline', () => {
    const input50 = buildInput({ slump: 50 });
    const res50 = runMixDesignCalculation(input50);
    const step2 = res50.calculationSteps.find((s) => s.stepNumber === 2);
    expect(step2!.calculation).toContain('186');
  });

  it('applies +3% water per 25 mm slump increment above 50 mm', () => {
    const input75 = buildInput({ slump: 75 });
    const res75 = runMixDesignCalculation(input75);
    const step2_75 = res75.calculationSteps.find((s) => s.stepNumber === 2);
    expect(step2_75!.calculation).toContain('+5.58 kg/m³');

    const input100 = buildInput({ slump: 100 });
    const res100 = runMixDesignCalculation(input100);
    const step2_100 = res100.calculationSteps.find((s) => s.stepNumber === 2);
    expect(step2_100!.calculation).toContain('+11.16 kg/m³');
  });
});

// ─── E. AGGREGATE SIZE MATRIX ────────────────────────────────────────────────
describe('E. Aggregate Size Matrix (10, 12.5, 20, 40 mm)', () => {
  it('retrieves correct base water and entrapped air for 10 mm, 20 mm, and 40 mm MSA', () => {
    const res10 = runMixDesignCalculation(buildInput({ maxAggregateSize: 10 }));
    expect(res10.calculationSteps.find((s) => s.stepNumber === 2)!.calculation).toContain('208');

    const res20 = runMixDesignCalculation(buildInput({ maxAggregateSize: 20 }));
    expect(res20.calculationSteps.find((s) => s.stepNumber === 2)!.calculation).toContain('186');

    const res40 = runMixDesignCalculation(buildInput({ maxAggregateSize: 40 }));
    expect(res40.calculationSteps.find((s) => s.stepNumber === 2)!.calculation).toContain('165');
  });

  it('blocks 12.5 mm MSA for ordinary concrete (M30) with clear error', () => {
    const res12 = runMixDesignCalculation(buildInput({ maxAggregateSize: 12.5 }));
    expect(res12.calculationSteps.find((s) => s.stepNumber === 2)!.result).toContain('reference-data-required');
    expect(res12.isPlaceholder).toBe(true);
  });
});

// ─── F. FA ZONE MATRIX ───────────────────────────────────────────────────────
describe('F. Fine Aggregate Zone Matrix (Zone I, II, III, IV)', () => {
  const zones = ['I', 'II', 'III', 'IV'];

  zones.forEach((zone) => {
    it(`accepts Zone ${zone} and passes to Step 6 inputs`, () => {
      const input = buildInput({ faZone: zone as any });
      const res = runMixDesignCalculation(input);
      const step6 = res.calculationSteps.find((s) => s.stepNumber === 6);
      expect(step6).toBeDefined();
      expect(step6!.inputs['FA Zone']).toBe(zone);
    });
  });
});

// ─── G. PLACEMENT METHOD MATRIX ──────────────────────────────────────────────
describe('G. Placement Method Matrix (Non-pumped vs Pumped)', () => {
  it('applies CA fraction reduction for pumped concrete exactly once', () => {
    const nonPumped = runMixDesignCalculation(buildInput({ isPumpedConcrete: false }));
    const pumped = runMixDesignCalculation(buildInput({ isPumpedConcrete: true }));

    const s2NonPumped = nonPumped.calculationSteps.find((s) => s.stepNumber === 2)!;
    const s2Pumped = pumped.calculationSteps.find((s) => s.stepNumber === 2)!;

    expect(s2NonPumped.inputs['Pumped']).toContain('No');
    expect(s2Pumped.inputs['Pumped']).toContain('Yes');

    expect(pumped.coarseAggregate).toBeLessThan(nonPumped.coarseAggregate);
    expect(pumped.fineAggregate).toBeGreaterThan(nonPumped.fineAggregate);
  });
});

// ─── H. AIR CONDITION MATRIX ─────────────────────────────────────────────────
describe('H. Air Condition Matrix (Non-air-entrained vs Air-entrained)', () => {
  it('uses Table 3 entrapped air for non-air-entrained concrete', () => {
    const res = runMixDesignCalculation(buildInput({ isAirEntrained: false }));
    const step5 = res.calculationSteps.find((s) => s.stepNumber === 5)!;
    expect(step5.inputs['Air Content']).toContain('Table 3');
  });

  it('uses user target air content for air-entrained concrete', () => {
    const res = runMixDesignCalculation(buildInput({ isAirEntrained: true, targetAirContent: 4.5 }));
    const step5 = res.calculationSteps.find((s) => s.stepNumber === 5)!;
    expect(step5.inputs['Air Content']).toContain('Target Entrained Air (4.5%)');
  });
});

// ─── I. SITE CONTROL MATRIX ──────────────────────────────────────────────────
describe('I. Site Control Matrix (Good vs Fair)', () => {
  it('uses S=5.0 MPa for M30 with Good site control', () => {
    const resGood = runMixDesignCalculation(buildInput({ concreteGrade: 'M30', siteControl: 'good' }));
    const step1Good = resGood.calculationSteps.find((s) => s.stepNumber === 1)!;
    expect(step1Good.inputs['Site Control']).toBe('good');
    expect(step1Good.result).toContain('38.25');
  });

  it('uses S=6.0 MPa for M30 with Fair site control', () => {
    const resFair = runMixDesignCalculation(buildInput({ concreteGrade: 'M30', siteControl: 'fair' }));
    const step1Fair = resFair.calculationSteps.find((s) => s.stepNumber === 1)!;
    expect(step1Fair.inputs['Site Control']).toBe('fair');
    expect(step1Fair.result).toContain('39.90');
  });
});

// ─── J. MOISTURE & ABSORPTION MATRIX ─────────────────────────────────────────
describe('J. Moisture & Absorption Matrix', () => {
  it('preserves SSD design quantities while adjusting field batch water and aggregate masses', () => {
    const resSSD = runMixDesignCalculation(buildInput({}, { faMoisture: 0, caMoisture: 0, faAbsorption: 1.0, caAbsorption: 0.5 }));
    const resWet = runMixDesignCalculation(buildInput({}, { faMoisture: 2.0, caMoisture: 1.0, faAbsorption: 1.0, caAbsorption: 0.5 }));

    // Design SSD water and SSD aggregates should be identical
    expect(resWet.designWater).toBeCloseTo(resSSD.designWater, 2);
    expect(resWet.ssdFineAggregate).toBeCloseTo(resSSD.ssdFineAggregate!, 2);
    expect(resWet.ssdCoarseAggregate).toBeCloseTo(resSSD.ssdCoarseAggregate!, 2);

    // Batch water decreases due to free moisture on aggregates
    expect(resWet.water).toBeLessThan(resSSD.water);

    // Batch aggregate masses increase due to surface moisture
    expect(resWet.fineAggregate).toBeGreaterThan(resSSD.fineAggregate);
    expect(resWet.coarseAggregate).toBeGreaterThan(resSSD.coarseAggregate);
  });
});

// ─── K. ADMIXTURE MATRIX ─────────────────────────────────────────────────────
describe('K. Admixture Matrix', () => {
  it('applies chemical admixture water reduction and calculates admixture volume', () => {
    const inputNoAdmix = buildInput({ slump: 50 }, { faAbsorption: 0, caAbsorption: 0 });
    const inputAdmix = buildInput({ slump: 50 }, {
      faAbsorption: 0,
      caAbsorption: 0,
      admixture: {
        type: 'Superplasticizer',
        dosage: 1.0,
        dosageBasis: 'percent_cement',
        waterReduction: 20,
        specificGravity: 1.15,
      },
    });

    const resNoAdmix = runMixDesignCalculation(inputNoAdmix);
    const resAdmix = runMixDesignCalculation(inputAdmix);

    // Water content is reduced by 20%
    expect(resAdmix.designWater).toBeLessThan(resNoAdmix.designWater);
    expect(resAdmix.designWater).toBeCloseTo(149, 1);

    // Admixture mass = 1% of cement content
    const expectedAdmixMass = (resAdmix.cement * 1.0) / 100;
    expect(resAdmix.admixture).toBeCloseTo(expectedAdmixMass, 1);
  });
});

// ─── L. EDGE CASES & BOUNDARY CONDITIONS ─────────────────────────────────────
describe('L. Edge Cases & Boundary Conditions', () => {
  it('treats blank, 0, null, or undefined actual cement strength as missing and uses default curve', () => {
    const sel0 = selectCementStrengthCurve('OPC_43', 0);
    expect(sel0.curve).toBe('curve2');
    expect(sel0.isDefault).toBe(true);

    const selNull = selectCementStrengthCurve('OPC_43', null);
    expect(selNull.curve).toBe('curve2');
    expect(selNull.isDefault).toBe(true);

    const selNeg = selectCementStrengthCurve('OPC_43', -5);
    expect(selNeg.curve).toBe('curve2');
    expect(selNeg.isDefault).toBe(true);
  });

  it('uses Priority 1 when actual cement strength is a positive measured number', () => {
    const selMeasured = selectCementStrengthCurve('OPC_43', 48.5);
    expect(selMeasured.curve).toBe('curve2');
    expect(selMeasured.isDefault).toBe(false);

    const selHigh = selectCementStrengthCurve('OPC_43', 55.0);
    expect(selHigh.curve).toBe('curve3');
    expect(selHigh.isDefault).toBe(false);
  });
});

// ─── M. M40 CONFIRMED GOLDEN CASE & CEMENT COMPLIANCE ────────────────────────
describe('M. M40 Confirmed Golden Case & Non-Compliance Handling', () => {
  it('correctly calculates M40 case and reports FAIL compliance without silent cement clamping', () => {
    const input = buildInput(
      {
        concreteGrade: 'M40',
        exposureCondition: 'moderate',
        slump: 120,
        maxAggregateSize: 20,
        isPumpedConcrete: false,
        isAirEntrained: false,
        faZone: 'II',
        siteControl: 'good',
      },
      {
        cementType: 'OPC_43',
        cementSG: 3.15,
        faSG: 2.65,
        faAbsorption: 1.0,
        faMoisture: 0,
        caSG: 2.70,
        caAbsorption: 0.5,
        caMoisture: 0,
      }
    );

    const res = runMixDesignCalculation(input);

    // 1. Target Strength = 48.25 MPa
    const step1 = res.calculationSteps.find((s) => s.stepNumber === 1)!;
    expect(step1.result).toContain('48.25');

    // 2. Water Content = 197.16 kg/m³
    expect(res.water).toBeGreaterThanOrEqual(197);

    // 3. W/C ~ 0.3643
    expect(res.wcRatio).toBeCloseTo(0.3643, 2);

    // 4. Cement content exceeds 450 kg/m³ limit (approx 550–556 kg/m³)
    expect(res.cement).toBeGreaterThan(450);

    // 5. Cement Compliance MUST be 'fail' and status NON_COMPLIANT
    expect(res.cementContentCheck).toBe('fail');
    const status = getCentralizedMixStatus(res);
    expect(status.status).toBe('NON_COMPLIANT');

    // 6. Verify unrounded ratio computation
    expect(res.mixRatioFineAggregate).toBeGreaterThan(1.0);
    expect(res.mixRatioCoarseAggregate).toBeGreaterThan(1.8);
  });
});

// ─── N. M60 HIGH-STRENGTH BOUNDARY SAFETY TESTS ─────────────────────────────
describe('N. M60 High-Strength Boundary Safety Tests', () => {
  it('A: M55 remains ordinary-standard calculation method', () => {
    const input = buildInput({ concreteGrade: 'M55' });
    const res = runMixDesignCalculation(input);
    const step3 = res.calculationSteps.find((s) => s.stepNumber === 3)!;
    expect(step3.inputs['Figure 1 Curve']).toBe('curve2');
  });

  it('B: M60 remains ordinary-standard calculation method', () => {
    const input = buildInput({ concreteGrade: 'M60' });
    const res = runMixDesignCalculation(input);
    const step3 = res.calculationSteps.find((s) => s.stepNumber === 3)!;
    expect(step3.inputs['Figure 1 Curve']).toBe('curve2');
  });

  it('C: M65 switches to high-strength calculation method', () => {
    const input = buildInput({ concreteGrade: 'M65' });
    const res = runMixDesignCalculation(input);
    const step3 = res.calculationSteps.find((s) => s.stepNumber === 3)!;
    expect(step3.inputs['Figure 1 Curve']).toBe('N/A (high-strength path)');
    expect(step3.inputs['Curve Selection Reason']).toContain('Table 8');
  });

  it('D & E & F: M60 with OPC 43 or OPC 53 exceeds Figure 1 curve max and SAFELY BLOCKS without extrapolation or Table 8 fallback', () => {
    const resOPC43 = runMixDesignCalculation(buildInput({ concreteGrade: 'M60' }, { cementType: 'OPC_43' }));
    expect(resOPC43.isPlaceholder).toBe(true);
    const step3OPC43 = resOPC43.calculationSteps.find((s) => s.stepNumber === 3)!;
    expect(step3OPC43.result).toContain('Extrapolation is not permitted');
    expect(resOPC43.wcRatio).toBe(0);

    const resOPC53 = runMixDesignCalculation(buildInput({ concreteGrade: 'M60' }, { cementType: 'OPC_53' }));
    expect(resOPC53.isPlaceholder).toBe(true);
    const step3OPC53 = resOPC53.calculationSteps.find((s) => s.stepNumber === 3)!;
    expect(step3OPC53.result).toContain('Extrapolation is not permitted');
    expect(resOPC53.wcRatio).toBe(0);
  });
});

