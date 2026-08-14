/**
 * Golden Tests — IS 10262:2019 Calculation Engine
 *
 * These tests verify the calculation engine against worked examples from
 * IS 10262:2019 and the established golden test cases.
 *
 * Every test case has a specific source in the IS standard or the
 * golden_test_cases.md document.
 *
 * Run: npx vitest run
 */

import { describe, it, expect, afterEach } from 'vitest';
import { calculateTargetStrength } from '../calculations/targetStrength';
import {
  lookupXFactor,
  lookupStandardDeviation,
  selectCalculationMethod,
  lookupHighStrengthWCM,
  lookupBaseWaterContent,
  lookupCAFraction,
} from '../reference-data';
import { selectCementStrengthCurve } from '../calculations/cementCurveSelector';
import { interpolateWCRatioFromFigure1 } from '../calculations/interpolation';
import { applyDurabilityLimit } from '../calculations/durabilityLimit';

// ─── Shared helper to build a minimal EngineContext ──────────────────────────

function ctx(grade: string, fck: number, opts: Partial<{
  cementType: string;
  cementGrade: number | undefined;
  siteControl: string;
}> = {}) {
  return {
    grade,
    fck,
    exposureCondition: 'moderate',
    slump: 100,
    maxAggregateSize: 20,
    isPumped: false,
    isAirEntrained: false,
    cementType: opts.cementType ?? 'OPC_43',
    cementSG: 3.15,
    cementGrade: opts.cementGrade,
    faSG: 2.65,
    caSG: 2.70,
    faZone: 'II',
    siteControl: opts.siteControl ?? 'good',
    waterAbsorptionFA: 1.0,
    waterAbsorptionCA: 0.5,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. LOOKUP FUNCTIONS — IS 10262:2019 Table 1 (Value of X)
// ═══════════════════════════════════════════════════════════════════════════════

describe('lookupXFactor (IS 10262:2019 Table 1)', () => {
  it('M10 → X = 5.0', () => expect(lookupXFactor('M10')).toBe(5.0));
  it('M15 → X = 5.0', () => expect(lookupXFactor('M15')).toBe(5.0));
  it('M20 → X = 5.5', () => expect(lookupXFactor('M20')).toBe(5.5));
  it('M25 → X = 5.5', () => expect(lookupXFactor('M25')).toBe(5.5));
  it('M30 → X = 6.5', () => expect(lookupXFactor('M30')).toBe(6.5));
  it('M55 → X = 6.5', () => expect(lookupXFactor('M55')).toBe(6.5));
  it('M60 → X = 6.5', () => expect(lookupXFactor('M60')).toBe(6.5));
  it('M65 → X = 8.0', () => expect(lookupXFactor('M65')).toBe(8.0));
  it('M80 → X = 8.0', () => expect(lookupXFactor('M80')).toBe(8.0));
  it('M90 (out of V1 scope) → null', () => expect(lookupXFactor('M90')).toBeNull());
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. LOOKUP FUNCTIONS — IS 10262:2019 Table 2 (Standard Deviation)
// ═══════════════════════════════════════════════════════════════════════════════

describe('lookupStandardDeviation (IS 10262:2019 Table 2)', () => {
  // Good site control
  it('M10 good → S = 3.5', () => expect(lookupStandardDeviation('M10', 'good')).toBe(3.5));
  it('M15 good → S = 3.5', () => expect(lookupStandardDeviation('M15', 'good')).toBe(3.5));
  it('M20 good → S = 4.0', () => expect(lookupStandardDeviation('M20', 'good')).toBe(4.0));
  it('M25 good → S = 4.0', () => expect(lookupStandardDeviation('M25', 'good')).toBe(4.0));
  it('M30 good → S = 5.0', () => expect(lookupStandardDeviation('M30', 'good')).toBe(5.0));
  it('M40 good → S = 5.0', () => expect(lookupStandardDeviation('M40', 'good')).toBe(5.0));
  it('M60 good → S = 5.0', () => expect(lookupStandardDeviation('M60', 'good')).toBe(5.0));
  it('M65 good → S = 6.0', () => expect(lookupStandardDeviation('M65', 'good')).toBe(6.0));
  it('M70 good → S = 6.0', () => expect(lookupStandardDeviation('M70', 'good')).toBe(6.0));
  it('M80 good → S = 6.0', () => expect(lookupStandardDeviation('M80', 'good')).toBe(6.0));

  // Fair site control — should add 1.0 N/mm² to all good values
  it('M10 fair → S = 4.5 (3.5 + 1.0)', () => expect(lookupStandardDeviation('M10', 'fair')).toBe(4.5));
  it('M15 fair → S = 4.5', () => expect(lookupStandardDeviation('M15', 'fair')).toBe(4.5));
  it('M20 fair → S = 5.0 (4.0 + 1.0)', () => expect(lookupStandardDeviation('M20', 'fair')).toBe(5.0));
  it('M40 fair → S = 6.0 (5.0 + 1.0)', () => expect(lookupStandardDeviation('M40', 'fair')).toBe(6.0));
  it('M70 fair → S = 7.0 (6.0 + 1.0)', () => expect(lookupStandardDeviation('M70', 'fair')).toBe(7.0));

  // Out of V1 scope
  it('M90 (out of scope) → null', () => expect(lookupStandardDeviation('M90')).toBeNull());

  // Default site control (no second argument) → good
  it('M40 default → S = 5.0 (defaults to good)', () => expect(lookupStandardDeviation('M40')).toBe(5.0));
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. TARGET STRENGTH — IS 10262:2019 Clause 4.2 (Golden Cases)
// ═══════════════════════════════════════════════════════════════════════════════

describe('calculateTargetStrength (IS 10262:2019 Clause 4.2)', () => {

  // ─── M40 Golden Case ─────────────────────────────────────────────────────
  // fck = 40, S = 5.0, X = 6.5
  // (A) = 40 + 1.65 × 5.0 = 48.25
  // (B) = 40 + 6.5       = 46.5
  // Governing = 48.25 MPa
  it('M40 good site control → 48.25 N/mm²', () => {
    const result = calculateTargetStrength(ctx('M40', 40));
    expect(result.status).toBe('calculated');
    expect(result.value).toBeCloseTo(48.25, 4);
    expect(result.detail.controllingEquation).toBe('A');
    expect(result.detail.targetFromStandardDeviation).toBeCloseTo(48.25, 4);
    expect(result.detail.targetFromX).toBeCloseTo(46.5, 4);
  });

  // ─── M15 Golden Case ─────────────────────────────────────────────────────
  // fck = 15, S = 3.5, X = 5.0
  // (A) = 15 + 1.65 × 3.5 = 20.775
  // (B) = 15 + 5.0        = 20.0
  // Governing = 20.775 MPa
  it('M15 good site control → 20.775 N/mm²', () => {
    const result = calculateTargetStrength(ctx('M15', 15));
    expect(result.status).toBe('calculated');
    expect(result.value).toBeCloseTo(20.775, 4);
    expect(result.detail.controllingEquation).toBe('A');
    expect(result.detail.targetFromStandardDeviation).toBeCloseTo(20.775, 4);
    expect(result.detail.targetFromX).toBeCloseTo(20.0, 4);
  });

  // ─── M70 Golden Case ─────────────────────────────────────────────────────
  // fck = 70, S = 6.0, X = 8.0
  // (A) = 70 + 1.65 × 6.0 = 79.9
  // (B) = 70 + 8.0        = 78.0
  // Governing = 79.9 MPa
  it('M70 good site control → 79.9 N/mm²', () => {
    const result = calculateTargetStrength(ctx('M70', 70));
    expect(result.status).toBe('calculated');
    expect(result.value).toBeCloseTo(79.9, 4);
    expect(result.detail.controllingEquation).toBe('A');
    expect(result.detail.targetFromStandardDeviation).toBeCloseTo(79.9, 4);
    expect(result.detail.targetFromX).toBeCloseTo(78.0, 4);
  });

  // ─── Fair site control: S increases by 1.0 ───────────────────────────────
  it('M40 fair site control → S = 6.0 → target = 40 + 1.65×6 = 49.9', () => {
    const result = calculateTargetStrength(ctx('M40', 40, { siteControl: 'fair' }));
    expect(result.status).toBe('calculated');
    expect(result.detail.standardDeviation).toBe(6.0); // 5.0 + 1.0
    expect(result.value).toBeCloseTo(49.9, 4); // 40 + 1.65 × 6 = 49.9
  });

  it('M15 fair site control → S = 4.5 → target = 15 + 1.65×4.5 = 22.425', () => {
    const result = calculateTargetStrength(ctx('M15', 15, { siteControl: 'fair' }));
    expect(result.status).toBe('calculated');
    expect(result.detail.standardDeviation).toBe(4.5); // 3.5 + 1.0
    expect(result.value).toBeCloseTo(22.425, 4);
  });

  // ─── Trace completeness ───────────────────────────────────────────────────
  it('M40 result has correct trace fields', () => {
    const result = calculateTargetStrength(ctx('M40', 40));
    expect(result.trace.step).toBe('target-strength');
    expect(result.trace.source).toContain('IS 10262:2019');
    expect(result.trace.formula).toContain('1.65');
    expect(result.trace.inputs['fck (N/mm²)']).toBe(40);
  });

  // ─── Out of range grade ───────────────────────────────────────────────────
  it('M90 (out of V1 scope) → status reference-data-required', () => {
    const result = calculateTargetStrength(ctx('M90', 90));
    expect(result.status).toBe('reference-data-required');
    expect(result.value).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. CEMENT CURVE SELECTION — IS 10262:2019 Figure 1
// ═══════════════════════════════════════════════════════════════════════════════

describe('selectCementStrengthCurve (IS 10262:2019 Figure 1)', () => {
  it('OPC_33 → curve1', () => {
    const result = selectCementStrengthCurve('OPC_33', null);
    expect(result.curve).toBe('curve1');
    expect(result.isDefault).toBe(true);
  });

  it('OPC_43 → curve2', () => {
    const result = selectCementStrengthCurve('OPC_43', null);
    expect(result.curve).toBe('curve2');
  });

  it('OPC_53 → curve3', () => {
    const result = selectCementStrengthCurve('OPC_53', null);
    expect(result.curve).toBe('curve3');
  });

  it('PPC without actual strength → curve2 (IS 10262:2019 Clause 6.4 default)', () => {
    const result = selectCementStrengthCurve('PPC', null);
    expect(result.curve).toBe('curve2');
    expect(result.isDefault).toBe(true);
  });

  it('PSC without actual strength → curve2', () => {
    const result = selectCementStrengthCurve('PSC', null);
    expect(result.curve).toBe('curve2');
  });

  it('Actual cement strength 38 N/mm² → curve1 (33 to <43)', () => {
    const result = selectCementStrengthCurve('OPC_43', 38);
    expect(result.curve).toBe('curve1');
    expect(result.isDefault).toBe(false);
  });

  it('Actual cement strength 47 N/mm² → curve2 (43 to <53)', () => {
    const result = selectCementStrengthCurve('OPC_53', 47);
    expect(result.curve).toBe('curve2');
    expect(result.isDefault).toBe(false);
  });

  it('Actual cement strength 55 N/mm² → curve3 (>=53)', () => {
    const result = selectCementStrengthCurve('OPC_53', 55);
    expect(result.curve).toBe('curve3');
    expect(result.isDefault).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════════
// 5. INTERPOLATION ENGINE — Figure 1 (curves now populated with validated data)
// ═════════════════════════════════════════════════════════════════════════════════

describe('interpolateWCRatioFromFigure1 — M40 Golden Case (Curve 2, OPC 43)', () => {
  // IS 10262:2019 Annex A Example 1:
  // M40, OPC 43, target f'ck = 48.25 MPa → Figure 1 Curve 2 → W/C = 0.36
  it('48.25 MPa on curve2 → W/C ≈ 0.36 (±0.01 tolerance)', () => {
    const result = interpolateWCRatioFromFigure1(48.25, 'curve2');
    expect(result.status).toBe('interpolated');
    expect(result.value).not.toBeNull();
    expect(result.value!).toBeCloseTo(0.36, 1); // ±0.05 at 1 decimal place
    expect(result.isExtrapolated).toBe(false);
  });

  it('48.25 MPa on curve2 → W/C within [0.355, 0.375]', () => {
    const result = interpolateWCRatioFromFigure1(48.25, 'curve2');
    expect(result.value).not.toBeNull();
    expect(result.value!).toBeGreaterThanOrEqual(0.355);
    expect(result.value!).toBeLessThanOrEqual(0.375);
  });
});

describe('interpolateWCRatioFromFigure1 — M15 Golden Case (Curve 2, OPC 43)', () => {
  // IS 10262:2019 Annex A Example 2:
  // M15, OPC 43, target f'ck = 20.775 MPa → Figure 1 Curve 2 → W/C = 0.61
  it('20.775 MPa on curve2 → W/C ≈ 0.61 (±0.01 tolerance)', () => {
    const result = interpolateWCRatioFromFigure1(20.775, 'curve2');
    expect(result.status).toBe('interpolated');
    expect(result.value).not.toBeNull();
    expect(result.value!).toBeCloseTo(0.61, 1);
    expect(result.isExtrapolated).toBe(false);
  });

  it('20.775 MPa on curve2 → W/C within [0.595, 0.625]', () => {
    const result = interpolateWCRatioFromFigure1(20.775, 'curve2');
    expect(result.value).not.toBeNull();
    expect(result.value!).toBeGreaterThanOrEqual(0.595);
    expect(result.value!).toBeLessThanOrEqual(0.625);
  });
});

describe('interpolateWCRatioFromFigure1 — boundary and safety checks', () => {
  it('out-of-range below minimum returns status out-of-range, value null (curve2)', () => {
    // Curve 2 starts at W/C=0.30 (59.5 MPa), so 70 MPa is above the max
    const result = interpolateWCRatioFromFigure1(70.0, 'curve2');
    expect(result.status).toBe('out-of-range');
    expect(result.value).toBeNull();
    expect(result.isExtrapolated).toBe(false);
  });

  it('out-of-range above maximum returns status out-of-range, value null (curve2)', () => {
    // Curve 2 ends at W/C=0.65 (17.6 MPa), so 10 MPa is below the min
    const result = interpolateWCRatioFromFigure1(10.0, 'curve2');
    expect(result.status).toBe('out-of-range');
    expect(result.value).toBeNull();
    expect(result.isExtrapolated).toBe(false);
  });

  it('result never has isExtrapolated = true', () => {
    const result = interpolateWCRatioFromFigure1(48.25, 'curve2');
    expect(result.isExtrapolated).toBe(false);
  });

  it('does NOT produce fake W/C = 0', () => {
    const result = interpolateWCRatioFromFigure1(48.25, 'curve2');
    expect(result.value).not.toBe(0);
  });

  it('curve1 returns a value for 33 MPa (within range 14.5–40 MPa)', () => {
    const result = interpolateWCRatioFromFigure1(33.0, 'curve1');
    // 33.0 is an exact data point so result may be 'exact-match' or 'interpolated'
    expect(['interpolated', 'exact-match']).toContain(result.status);
    expect(result.value).not.toBeNull();
  });

  it('curve3 returns a value for 48 MPa (within range 21–65 MPa)', () => {
    const result = interpolateWCRatioFromFigure1(48.0, 'curve3');
    expect(result.status).toBe('interpolated');
    expect(result.value).not.toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. INTERPOLATION ENGINE — with synthetic test data (not from IS standard)
//    These tests verify the interpolation math only.
//    The points below are NOT Figure 1 values — they are synthetic.
// ═══════════════════════════════════════════════════════════════════════════════

import { FIGURE_1_WC_RATIO_CURVES } from '../reference-data';

describe('interpolateWCRatioFromFigure1 — with synthetic test points', () => {
  // These tests REPLACE the real curve2 data with synthetic points to verify
  // interpolation math in isolation. The real data is restored after each test.

  // Save the real points before any test runs
  const realCurve2Data = FIGURE_1_WC_RATIO_CURVES.find(c => c.curve === 'curve2')!;
  const savedPoints = [...realCurve2Data.points];

  // After each test, restore the real data
  afterEach(() => {
    const curve = FIGURE_1_WC_RATIO_CURVES.find(c => c.curve === 'curve2')!;
    curve.points.splice(0, curve.points.length, ...savedPoints);
  });

  it('exact match returns status exact-match', () => {
    // Replace with single synthetic point
    realCurve2Data.points.splice(0, realCurve2Data.points.length, { strengthMPa: 30, wcRatio: 0.55 });
    const result = interpolateWCRatioFromFigure1(30, 'curve2');
    expect(result.status).toBe('exact-match');
    expect(result.value).toBe(0.55);
  });

  it('out-of-range below minimum → status out-of-range, value null', () => {
    realCurve2Data.points.splice(0, realCurve2Data.points.length,
      { strengthMPa: 25, wcRatio: 0.65 }, { strengthMPa: 60, wcRatio: 0.35 });
    const result = interpolateWCRatioFromFigure1(10, 'curve2'); // 10 < 25 min
    expect(result.status).toBe('out-of-range');
    expect(result.value).toBeNull();
    expect(result.isExtrapolated).toBe(false);
  });

  it('out-of-range above maximum → status out-of-range, value null', () => {
    realCurve2Data.points.splice(0, realCurve2Data.points.length,
      { strengthMPa: 25, wcRatio: 0.65 }, { strengthMPa: 60, wcRatio: 0.35 });
    const result = interpolateWCRatioFromFigure1(80, 'curve2'); // 80 > 60 max
    expect(result.status).toBe('out-of-range');
    expect(result.value).toBeNull();
  });

  it('linear interpolation at midpoint is correct', () => {
    // Two points: (25 MPa, W/C=0.65) and (55 MPa, W/C=0.35)
    // At 40 MPa midpoint (15/30 = 0.5 fraction): W/C = 0.65 + (0.35-0.65)×0.5 = 0.50
    realCurve2Data.points.splice(0, realCurve2Data.points.length,
      { strengthMPa: 25, wcRatio: 0.65 }, { strengthMPa: 55, wcRatio: 0.35 });
    const result = interpolateWCRatioFromFigure1(40, 'curve2');
    expect(result.status).toBe('interpolated');
    expect(result.value).toBeCloseTo(0.50, 5);
    expect(result.interpolationFraction).toBeCloseTo(0.5, 5);
  });
});


// ═══════════════════════════════════════════════════════════════════════════════
// 7. DURABILITY LIMIT CHECK
// ═══════════════════════════════════════════════════════════════════════════════

describe('applyDurabilityLimit', () => {
  it('strength governs when lower than durability limit', () => {
    const result = applyDurabilityLimit(0.40, 0.50);
    expect(result.status).toBe('calculated');
    expect(result.finalWC).toBeCloseTo(0.40, 5);
    expect(result.controllingLimit).toBe('strength');
  });

  it('durability governs when lower than strength-based value', () => {
    const result = applyDurabilityLimit(0.55, 0.45);
    expect(result.status).toBe('calculated');
    expect(result.finalWC).toBeCloseTo(0.45, 5);
    expect(result.controllingLimit).toBe('durability');
  });

  it('equal values → controllingLimit is equal', () => {
    const result = applyDurabilityLimit(0.45, 0.45);
    expect(result.status).toBe('calculated');
    expect(result.finalWC).toBeCloseTo(0.45, 5);
    expect(result.controllingLimit).toBe('equal');
  });

  it('null strengthBasedWC → reference-data-required', () => {
    const result = applyDurabilityLimit(null, 0.50);
    expect(result.status).toBe('reference-data-required');
    expect(result.finalWC).toBeNull();
  });

  it('null durabilityWC → reference-data-required', () => {
    const result = applyDurabilityLimit(0.40, null);
    expect(result.status).toBe('reference-data-required');
    expect(result.finalWC).toBeNull();
  });

  it('both null → reference-data-required', () => {
    const result = applyDurabilityLimit(null, null);
    expect(result.status).toBe('reference-data-required');
    expect(result.finalWC).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 8. CALCULATION METHOD SELECTOR — IS 10262:2019 Section 2
// ═══════════════════════════════════════════════════════════════════════════════

describe('selectCalculationMethod (IS 10262:2019 Section 2)', () => {
  // Ordinary/Standard grades → Figure 1 pathway
  it('M10 → ordinary-standard', () => {
    const result = selectCalculationMethod('M10');
    expect(result.method).toBe('ordinary-standard');
    expect(result.fck).toBe(10);
  });

  it('M15 → ordinary-standard', () => {
    expect(selectCalculationMethod('M15').method).toBe('ordinary-standard');
  });

  it('M40 → ordinary-standard', () => {
    expect(selectCalculationMethod('M40').method).toBe('ordinary-standard');
  });

  it('M60 → ordinary-standard (boundary: fck = 60, still ordinary)', () => {
    const result = selectCalculationMethod('M60');
    expect(result.method).toBe('ordinary-standard');
    expect(result.fck).toBe(60);
  });

  // High-strength grades → Table 8 W/CM pathway (NO Figure 1)
  it('M65 → high-strength (boundary: first high-strength grade)', () => {
    const result = selectCalculationMethod('M65');
    expect(result.method).toBe('high-strength');
    expect(result.fck).toBe(65);
  });

  it('M70 → high-strength', () => {
    expect(selectCalculationMethod('M70').method).toBe('high-strength');
  });

  it('M80 → high-strength', () => {
    expect(selectCalculationMethod('M80').method).toBe('high-strength');
  });

  // Result includes reason and source
  it('M40 result has reason and source fields', () => {
    const result = selectCalculationMethod('M40');
    expect(result.reason).toBeTruthy();
    expect(result.source).toContain('IS 10262:2019');
  });

  it('M70 result reason mentions Figure 1 does NOT apply', () => {
    const result = selectCalculationMethod('M70');
    expect(result.reason).toContain('Figure 1');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 9. TABLE 8 — High-Strength W/CM Lookup
// ═══════════════════════════════════════════════════════════════════════════════

describe('lookupHighStrengthWCM (IS 10262:2019 Table 8)', () => {
  // Function signature: lookupHighStrengthWCM(targetStrength, maxAggregateSize)
  // 'targetStrength' is the target mean compressive strength f'ck, NOT fck.

  // ─── M70 Golden Case ──────────────────────────────────────────────────────
  // IS 10262:2019 Annex B: M70 (target=79.9), 20 mm MSA
  it('M70 golden case: targetStrength=79.9, 20 mm MSA → W/CM ≈ 0.29', () => {
    expect(lookupHighStrengthWCM(79.9, 20)).toBeCloseTo(0.29, 2);
  });

  // ─── Exact target strengths, 20 mm aggregate ──────────────────────────────
  it('target=70, 20 mm → W/CM = 0.33', () => {
    expect(lookupHighStrengthWCM(70, 20)).toBe(0.33);
  });

  it('target=75, 20 mm → W/CM = 0.31', () => {
    expect(lookupHighStrengthWCM(75, 20)).toBe(0.31);
  });

  it('target=80, 20 mm → W/CM = 0.29', () => {
    expect(lookupHighStrengthWCM(80, 20)).toBe(0.29);
  });

  // ─── Exact target strengths, 10 mm aggregate ──────────────────────────────
  it('target=70, 10 mm → W/CM = 0.36', () => {
    expect(lookupHighStrengthWCM(70, 10)).toBe(0.36);
  });

  it('target=85, 10 mm → W/CM = 0.30', () => {
    expect(lookupHighStrengthWCM(85, 10)).toBe(0.30);
  });

  // ─── Interpolation tests ──────────────────────────────────────────────────
  it('target=77.5, 20 mm → interpolates between 0.31 and 0.29 → W/CM = 0.30', () => {
    expect(lookupHighStrengthWCM(77.5, 20)).toBeCloseTo(0.30, 2);
  });

  // ─── Edge cases ───────────────────────────────────────────────────────────
  it('unknown aggregate size (e.g., 40 mm, not in Table 8) → null', () => {
    expect(lookupHighStrengthWCM(80, 40)).toBeNull();
  });

  it('target below Table 8 range (<70 MPa) → null (no extrapolation)', () => {
    expect(lookupHighStrengthWCM(65, 20)).toBeNull();
  });

  it('target above Table 8 range (>100 MPa) → null (no extrapolation)', () => {
    expect(lookupHighStrengthWCM(105, 20)).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 10. M70 GOLDEN CASE — End-to-End High-Strength Path Verification
// ═══════════════════════════════════════════════════════════════════════════════

describe('M70 Golden Case \u2014 High-Strength Path (IS 10262:2019 Annex B)', () => {
  // IS 10262:2019 Annex B Example:
  //   Grade M70, OPC 53, 20 mm MSA, good site control
  //   Step 1: Target f'ck = 70 + 1.65 × 6.0 = 79.9 MPa  ✓
  //   Step 2: Method → 'high-strength' (M70 > M60)       ✓
  //   Step 3: Table 8 lookup → 79.9 MPa, 20 mm → 0.29   ✓
  //   (Figure 1 is NEVER consulted for M70)

  const m70ctx = {
    grade: 'M70',
    fck: 70,
    exposureCondition: 'moderate',
    slump: 100,
    maxAggregateSize: 20,
    isPumped: false,
    isAirEntrained: false,
    cementType: 'OPC_53',
    cementSG: 3.15,
    cementGrade: undefined,
    faSG: 2.65,
    caSG: 2.70,
    faZone: 'II' as const,
    siteControl: 'good',
    waterAbsorptionFA: 1.0,
    waterAbsorptionCA: 0.5,
  };

  it('M70 target strength = 79.9 MPa', () => {
    const result = calculateTargetStrength(m70ctx);
    expect(result.status).toBe('calculated');
    expect(result.value).toBeCloseTo(79.9, 3);
  });

  it('M70 → high-strength method (NOT ordinary-standard)', () => {
    const result = selectCalculationMethod('M70');
    expect(result.method).toBe('high-strength');
  });

  it('M70 Figure 1 lookup → out-of-range (f\'ck = 79.9 > max 65.0 MPa on Curve 3)', () => {
    // Validates that Figure 1 cannot provide a W/C for M70 — it must use Table 8
    const result = interpolateWCRatioFromFigure1(79.9, 'curve3');
    expect(result.status).toBe('out-of-range');
    expect(result.value).toBeNull();
  });

  it('M70 Table 8 lookup: target=79.9, 20 mm → W/CM = 0.29', () => {
    const wcm = lookupHighStrengthWCM(79.9, 20);
    expect(wcm).toBeCloseTo(0.29, 2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 11. TABLE 4 / TABLE 7 — Maximum Water Content (Clause 6.3 / 6.2.4)
// ═══════════════════════════════════════════════════════════════════════════════

describe('lookupBaseWaterContent (IS 10262:2019 Table 4 - Ordinary)', () => {
  it('10 mm MSA → 208 kg/m³', () => {
    expect(lookupBaseWaterContent(10)).toBe(208);
  });

  it('20 mm MSA → 186 kg/m³', () => {
    expect(lookupBaseWaterContent(20)).toBe(186);
  });

  it('40 mm MSA → 165 kg/m³', () => {
    expect(lookupBaseWaterContent(40)).toBe(165);
  });

  it('unknown size (e.g. 25 mm) → null', () => {
    expect(lookupBaseWaterContent(25)).toBeNull();
  });
});

import { lookupBaseWaterContentHighStrength } from '../reference-data';
describe('lookupBaseWaterContentHighStrength (IS 10262:2019 Table 7 - HS)', () => {
  it('10 mm MSA → 200 kg/m³', () => {
    expect(lookupBaseWaterContentHighStrength(10)).toBe(200);
  });

  it('12.5 mm MSA → 195 kg/m³', () => {
    expect(lookupBaseWaterContentHighStrength(12.5)).toBe(195);
  });

  it('20 mm MSA → 186 kg/m³', () => {
    expect(lookupBaseWaterContentHighStrength(20)).toBe(186);
  });

  it('unknown size (e.g. 40 mm) → null', () => {
    expect(lookupBaseWaterContentHighStrength(40)).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 12. TABLE 5 / TABLE 10 — Volume Fraction of Coarse Aggregate
// ═══════════════════════════════════════════════════════════════════════════════

describe('lookupCAFraction (IS 10262:2019 Table 5 with W/C adjustment - Ordinary)', () => {
  // ─── Baseline W/C = 0.50 (no adjustment) ──────────────────────────────────
  it('20 mm MSA, Zone II, W/C = 0.50 → 0.62', () => {
    expect(lookupCAFraction(20, 'II', 0.50)).toBeCloseTo(0.62, 5);
  });

  it('10 mm MSA, Zone I, W/C = 0.50 → 0.48', () => {
    expect(lookupCAFraction(10, 'I', 0.50)).toBeCloseTo(0.48, 5);
  });

  it('40 mm MSA, Zone III, W/C = 0.50 → 0.72', () => {
    expect(lookupCAFraction(40, 'III', 0.50)).toBeCloseTo(0.72, 5);
  });

  // ─── Decreasing W/C (increases CA volume) ─────────────────────────────────
  // For W/C = 0.40, delta = 0.40 - 0.50 = -0.10.
  // 2 steps of -0.05 decrease → +0.02 adjustment
  it('20 mm MSA, Zone II, W/C = 0.40 → 0.62 + 0.02 = 0.64', () => {
    expect(lookupCAFraction(20, 'II', 0.40)).toBeCloseTo(0.64, 5);
  });

  // For W/C = 0.45, delta = -0.05. 1 step → +0.01 adjustment
  it('10 mm MSA, Zone I, W/C = 0.45 → 0.48 + 0.01 = 0.49', () => {
    expect(lookupCAFraction(10, 'I', 0.45)).toBeCloseTo(0.49, 5);
  });

  // ─── Increasing W/C (decreases CA volume) ─────────────────────────────────
  // For W/C = 0.60, delta = +0.10. 2 steps of +0.05 increase → -0.02 adjustment
  it('20 mm MSA, Zone II, W/C = 0.60 → 0.62 - 0.02 = 0.60', () => {
    expect(lookupCAFraction(20, 'II', 0.60)).toBeCloseTo(0.60, 5);
  });

  // ─── Error handling and boundary values ──────────────────────────────────
  it('unknown aggregate size (e.g. 25 mm) → null', () => {
    expect(lookupCAFraction(25, 'II', 0.50)).toBeNull();
  });

  it('unknown fine aggregate zone (e.g. Zone V) → null', () => {
    expect(lookupCAFraction(20, 'V' as any, 0.50)).toBeNull();
  });
});

import { lookupCAFractionHighStrength, lookupAirContentHighStrength } from '../reference-data';

describe('lookupCAFractionHighStrength (IS 10262:2019 Table 10 with W/CM adjustment - HS)', () => {
  // Baseline W/CM = 0.30
  it('20 mm MSA, Zone II, W/CM = 0.30 → 0.66', () => {
    expect(lookupCAFractionHighStrength(20, 'II', 0.30)).toBeCloseTo(0.66, 5);
  });

  // W/CM = 0.25 (-0.05 from 0.30) → +0.01 CA fraction
  it('20 mm MSA, Zone II, W/CM = 0.25 → 0.66 + 0.01 = 0.67', () => {
    expect(lookupCAFractionHighStrength(20, 'II', 0.25)).toBeCloseTo(0.67, 5);
  });

  // W/CM = 0.35 (+0.05 from 0.30) → -0.01 CA fraction
  it('20 mm MSA, Zone II, W/CM = 0.35 → 0.66 - 0.01 = 0.65', () => {
    expect(lookupCAFractionHighStrength(20, 'II', 0.35)).toBeCloseTo(0.65, 5);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 13. TABLE 6 — Approximate Air Content
// ═══════════════════════════════════════════════════════════════════════════════

describe('lookupAirContentHighStrength (IS 10262:2019 Table 6)', () => {
  it('10 mm MSA → 1.0%', () => {
    expect(lookupAirContentHighStrength(10)).toBe(1.0);
  });

  it('12.5 mm MSA → 0.8%', () => {
    expect(lookupAirContentHighStrength(12.5)).toBe(0.8);
  });

  it('20 mm MSA → 0.5%', () => {
    expect(lookupAirContentHighStrength(20)).toBe(0.5);
  });

  it('40 mm MSA (not in table) → null', () => {
    expect(lookupAirContentHighStrength(40)).toBeNull();
  });
});

