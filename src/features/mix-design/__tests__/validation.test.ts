/**
 * Validation Tests — Adopted W/C Override & Admixture Dosage Basis
 *
 * Reference case:
 *   M40, OPC 43 (SG 2.93), Moderate, 150 mm slump, 20 mm MSA
 *   FA SG 2.65, FA WA 1.2%, Zone II
 *   CA SG 2.82, CA WA 0.9%, Angular
 *   Admixture SG 1.121, Water reduction 25%
 *
 * Expected auto W/C ≈ 0.364 → C ≈ 428 kg/m³
 * Expected override W/C = 0.35 → C ≈ 446 kg/m³
 * Expected 4.8 L/m³ admixture → mass ≈ 5.38 kg/m³
 */

import { describe, it, expect } from 'vitest';
import { runMixDesignCalculation } from '../calculations';
import type { MixDesignInput } from '../types';

function makeValidationInput(overrides?: {
  adoptedWcOverride?: number;
  admixtureDosage?: number;
  admixtureDosageBasis?: 'percentage' | 'liters_per_m3';
  admixtureSG?: number;
  waterReduction?: number;
}): MixDesignInput {
  return {
    projectDetails: {
      projectName: 'Validation Case',
      clientName: '',
      engineerName: '',
      date: '2026-08-09',
      location: '',
      remarks: '',
    },
    designParameters: {
      concreteGrade: 'M40',
      fck: 40,
      exposureCondition: 'moderate',
      slump: 150,
      maxAggregateSize: 20,
      isPumpedConcrete: false,
      isAirEntrained: false,
      faZone: 'II',
      siteControl: 'good',
      adoptedWcOverride: overrides?.adoptedWcOverride,
    },
    materialProperties: {
      cement: { type: 'OPC_43', specificGravity: 2.93 },
      fineAggregate: { specificGravity: 2.65, waterAbsorption: 1.2, finesModulus: 2.8 },
      coarseAggregate: { specificGravity: 2.82, waterAbsorption: 0.9, angularity: 'angular' },
      water: { source: 'Potable' },
      admixture: {
        type: 'Superplasticizer',
        dosage: overrides?.admixtureDosage ?? 0,
        dosageBasis: overrides?.admixtureDosageBasis ?? 'percentage',
        specificGravity: overrides?.admixtureSG,
        waterReduction: overrides?.waterReduction ?? 25,
      },
    },
  } as MixDesignInput;
}

// ─── Task 1: Automatic W/C ────────────────────────────────────────────────────

describe('Automatic W/C (no override)', () => {
  const result = runMixDesignCalculation(makeValidationInput());

  it('is not a placeholder', () => expect(result.isPlaceholder).toBe(false));

  it('batch water ≈ 175 kg/m³ (design 156 + moisture correction for 1.2%/0.9% dry aggregates)', () => {
    expect(result.water).toBeGreaterThanOrEqual(165);
    expect(result.water).toBeLessThanOrEqual(185);
  });

  it('W/C ≈ 0.364 (Figure 1 interpolation)', () => {
    expect(result.wcRatio).toBeGreaterThanOrEqual(0.35);
    expect(result.wcRatio).toBeLessThanOrEqual(0.39);
  });

  it('cement ≈ 428 kg/m³ (W / W/C)', () => {
    expect(result.cement).toBeGreaterThanOrEqual(410);
    expect(result.cement).toBeLessThanOrEqual(450);
  });
});

// ─── Task 1: W/C Override ────────────────────────────────────────────────────

describe('Adopted W/C override = 0.35 (field trial)', () => {
  const resultOverride = runMixDesignCalculation(makeValidationInput({ adoptedWcOverride: 0.35 }));
  const resultAuto = runMixDesignCalculation(makeValidationInput());

  it('is not a placeholder', () => expect(resultOverride.isPlaceholder).toBe(false));

  it('adopted W/C is exactly 0.35', () => {
    expect(resultOverride.wcRatio).toBeCloseTo(0.35, 2);
  });

  it('cement ≈ 446 kg/m³ (156 / 0.35)', () => {
    expect(resultOverride.cement).toBeGreaterThanOrEqual(440);
    expect(resultOverride.cement).toBeLessThanOrEqual(452);
  });

  it('override produces MORE cement than automatic', () => {
    expect(resultOverride.cement).toBeGreaterThan(resultAuto.cement);
  });

  it('FA and CA remain positive', () => {
    expect(resultOverride.fineAggregate).toBeGreaterThan(0);
    expect(resultOverride.coarseAggregate).toBeGreaterThan(0);
  });

  it('yield ≈ 1.0 m³', () => {
    expect(resultOverride.yield).not.toBeNull();
    expect(resultOverride.yield!).toBeGreaterThan(0.95);
    expect(resultOverride.yield!).toBeLessThan(1.05);
  });
});

// ─── Task 2: Admixture % by cement mass ─────────────────────────────────────

describe('Admixture dosage basis: % by mass of cement', () => {
  const result = runMixDesignCalculation(makeValidationInput({
    admixtureDosage: 0.48,
    admixtureDosageBasis: 'percentage',
    admixtureSG: 1.121,
  }));

  it('mass = cement × 0.0048', () => {
    const expected = result.cement * 0.0048;
    expect(result.admixture!).toBeCloseTo(expected, 1);
  });

  it('mass is approximately 2.05 kg/m³ (not 5.38)', () => {
    expect(result.admixture!).toBeGreaterThan(1.5);
    expect(result.admixture!).toBeLessThan(3.5);
  });
});

// ─── Task 2: Admixture L/m³ ──────────────────────────────────────────────────

describe('Admixture dosage basis: Liters per m³', () => {
  const result = runMixDesignCalculation(makeValidationInput({
    admixtureDosage: 4.8,
    admixtureDosageBasis: 'liters_per_m3',
    admixtureSG: 1.121,
  }));

  it('mass = 4.8 × 1.121 = 5.3808 ≈ 5.38 kg/m³', () => {
    expect(result.admixture!).toBeCloseTo(5.38, 1);
  });

  it('mass is NOT the same as 0.48% of cement', () => {
    const pctResult = runMixDesignCalculation(makeValidationInput({
      admixtureDosage: 0.48,
      admixtureDosageBasis: 'percentage',
      admixtureSG: 1.121,
    }));
    expect(Math.abs(result.admixture! - pctResult.admixture!)).toBeGreaterThan(2.0);
  });

  it('yield ≈ 1.0 m³ with L/m³ dosing', () => {
    expect(result.yield).not.toBeNull();
    expect(result.yield!).toBeGreaterThan(0.95);
    expect(result.yield!).toBeLessThan(1.05);
  });
});

describe('Admixture dosage basis: Liters per m³ (Missing SG)', () => {
  const result = runMixDesignCalculation(makeValidationInput({
    admixtureDosage: 4.8,
    admixtureDosageBasis: 'liters_per_m3',
    // admixtureSG is implicitly undefined here via makeValidationInput defaults or lack thereof
  }));

  it('admixture mass evaluates to null', () => {
    expect(result.admixture).toBeNull();
  });

  it('yieldError is returned and yield is null', () => {
    expect(result.yieldError).toBeDefined();
    expect(result.yield).toBeNull();
  });
});

// ─── Task 2: Zero dosage ─────────────────────────────────────────────────────

describe('Admixture dosage = 0 (no admixture)', () => {
  const result = runMixDesignCalculation(makeValidationInput({ admixtureDosage: 0 }));

  it('admixture mass = 0', () => expect(result.admixture).toBe(0));

  it('calculation is complete and valid', () => {
    expect(result.isPlaceholder).toBe(false);
    expect(result.cement).toBeGreaterThan(0);
    expect(result.fineAggregate).toBeGreaterThan(0);
    expect(result.coarseAggregate).toBeGreaterThan(0);
  });
});

// ─── Task 3: Full handwritten reference case ──────────────────────────────────

describe('Full handwritten reference: override W/C=0.35 + 4.8 L/m³ admixture', () => {
  const result = runMixDesignCalculation(makeValidationInput({
    adoptedWcOverride: 0.35,
    admixtureDosage: 4.8,
    admixtureDosageBasis: 'liters_per_m3',
    admixtureSG: 1.121,
  }));

  it('is not a placeholder', () => expect(result.isPlaceholder).toBe(false));
  it('batch water ≈ 175 kg/m³ (design 156 + moisture correction)', () => {
    expect(result.water).toBeGreaterThanOrEqual(165);
    expect(result.water).toBeLessThanOrEqual(185);
  });
  it('W/C = 0.35', () => expect(result.wcRatio).toBeCloseTo(0.35, 2));
  it('cement ≈ 446 kg/m³', () => {
    expect(result.cement).toBeGreaterThanOrEqual(440);
    expect(result.cement).toBeLessThanOrEqual(452);
  });
  it('admixture ≈ 5.38 kg/m³', () => expect(result.admixture!).toBeCloseTo(5.38, 1));
  it('yield ≈ 1.0 m³', () => {
    expect(result.yield).not.toBeNull();
    expect(result.yield!).toBeGreaterThan(0.95);
    expect(result.yield!).toBeLessThan(1.05);
  });

  it('absolute volume: density sums cement + water + FA + CA + admixture', () => {
    const sum = result.cement + result.water + result.fineAggregate + result.coarseAggregate + result.admixture!;
    expect(Math.abs(result.density - sum)).toBeLessThan(10);
  });
});
