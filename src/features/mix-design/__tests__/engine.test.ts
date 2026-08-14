/**
 * End-to-End Engine Tests
 * Validates that runMixDesignCalculation produces real numerical results
 * for the three golden cases: M15, M40 (ordinary), M70 (high-strength).
 *
 * These are not verification tests against IS 10262:2019 Annex A/B —
 * they verify the engine produces plausible non-zero, non-placeholder results.
 */

import { describe, it, expect } from 'vitest';
import { runMixDesignCalculation } from '../calculations';
import type { MixDesignInput } from '../types';

function makeInput(grade: string, slump = 100, exposure = 'moderate'): MixDesignInput {
  const fck = parseInt(grade.replace('M', ''), 10);
  return {
    designParameters: {
      concreteGrade: grade,
      fck,
      exposureCondition: exposure,
      slump,
      maxAggregateSize: 20,
      isPumpedConcrete: false,
      isAirEntrained: false,
      faZone: 'II',
      siteControl: 'good',
    },
    materialProperties: {
      cement: {
        type: 'OPC_43',
        specificGravity: 3.15,
        grade: undefined,
      } as { type: string; specificGravity: number; grade?: number },
      fineAggregate: {
        specificGravity: 2.65,
        waterAbsorption: 1.0,
      },
      coarseAggregate: {
        specificGravity: 2.70,
        waterAbsorption: 0.5,
      },
    },
  } as unknown as MixDesignInput;
}

// ─── M40 Golden Case ──────────────────────────────────────────────────────────
describe('Engine: M40 end-to-end (ordinary, OPC 43)', () => {
  const m40Input = makeInput('M40');
  m40Input.materialProperties.admixture = {
    type: 'Superplasticizer',
    dosage: 1.0,
    specificGravity: 1.14,
    waterReduction: 23, // From IS 10262 M40 Example
  };
  const result = runMixDesignCalculation(m40Input);

  it('is not a placeholder', () => {
    expect(result.isPlaceholder).toBe(false);
  });

  it('water content is in plausible range [150–220] kg/m³ with admixture reduction', () => {
    expect(result.water).toBeGreaterThanOrEqual(150);
    expect(result.water).toBeLessThanOrEqual(220);
  });

  it('cement content is in plausible range [300–450] kg/m³', () => {
    expect(result.cement).toBeGreaterThanOrEqual(300);
    expect(result.cement).toBeLessThanOrEqual(450);
  });

  it('W/C ratio is in plausible range [0.30–0.55]', () => {
    expect(result.wcRatio).toBeGreaterThanOrEqual(0.30);
    expect(result.wcRatio).toBeLessThanOrEqual(0.55);
  });

  it('fine aggregate > 0 kg/m³', () => {
    expect(result.fineAggregate).toBeGreaterThan(0);
  });

  it('coarse aggregate > 0 kg/m³', () => {
    expect(result.coarseAggregate).toBeGreaterThan(0);
  });

  it('mix ratio FA and CA parts are positive', () => {
    expect(result.mixRatioFineAggregate).toBeGreaterThan(0);
    expect(result.mixRatioCoarseAggregate).toBeGreaterThan(0);
  });

  it('volume conservation: cement + water + FA + CA ≈ 2300–2600 kg/m³', () => {
    const total = result.cement + result.water + result.fineAggregate + result.coarseAggregate;
    expect(total).toBeGreaterThan(2200);
    expect(total).toBeLessThan(2700);
  });

  it('admixture mass is calculated from cement and dosage', () => {
    const expectedAdmix = (result.cement * 1.0) / 100;
    expect(result.admixture!).toBeCloseTo(expectedAdmix, 1);
  });

  it('density is sum of components', () => {
    const expectedDensity = result.cement + result.water + result.fineAggregate + result.coarseAggregate + result.admixture!;
    expect(Math.abs(result.density - expectedDensity)).toBeLessThan(1.0);
  });

  it('yield is approximately 1.0 m³', () => {
    expect(result.yield).toBeGreaterThan(0.95);
    expect(result.yield).toBeLessThan(1.05);
  });

  it('cement compliance is pass for M40', () => {
    expect(result.cementContentCheck).toBe('pass');
  });
});

// ─── M15 Golden Case ──────────────────────────────────────────────────────────
describe('Engine: M15 end-to-end (ordinary, OPC 43)', () => {
  const result = runMixDesignCalculation(makeInput('M15', 50, 'mild'));

  it('is not a placeholder', () => {
    expect(result.isPlaceholder).toBe(false);
  });

  it('water content is in plausible range', () => {
    expect(result.water).toBeGreaterThanOrEqual(165);
    expect(result.water).toBeLessThanOrEqual(210);
  });

  it('W/C ratio is in plausible range [0.50–0.65]', () => {
    expect(result.wcRatio).toBeGreaterThanOrEqual(0.50);
    expect(result.wcRatio).toBeLessThanOrEqual(0.65);
  });

  it('cement content is positive', () => {
    expect(result.cement).toBeGreaterThan(0);
  });

  it('FA and CA are positive', () => {
    expect(result.fineAggregate).toBeGreaterThan(0);
    expect(result.coarseAggregate).toBeGreaterThan(0);
  });
});

// ─── M70 Golden Case — High Strength ─────────────────────────────────────────
describe('Engine: M70 end-to-end (high-strength, OPC 53)', () => {
  const m70Input = makeInput('M70', 100, 'moderate');
  // Override cement type to OPC_53 for M70
  (m70Input.materialProperties.cement as unknown as Record<string, unknown>).type = 'OPC_53';
  const result = runMixDesignCalculation(m70Input);

  it('is not a placeholder', () => {
    expect(result.isPlaceholder).toBe(false);
  });

  it('W/CM ≈ 0.29 (Table 8, target 79.9 MPa, 20 mm MSA)', () => {
    // Durability max for moderate = 0.50, so strength-based 0.29 governs
    expect(result.wcRatio).toBeCloseTo(0.29, 2);
  });

  it('water content (batch water) from Table 7 (HS) + slump + absorption: 20 mm MSA = 186 kg/m³ base', () => {
    // slump 100mm → 50mm above base → 1 step × 3% = +5.58 → 191 or 192 SSD water.
    // However, the aggregate is dry (0% surface moisture) and has 1.0% and 0.5% absorption.
    // The engine correctly increases the batch water to compensate.
    expect(result.water).toBeGreaterThanOrEqual(186);
    expect(result.water).toBeLessThanOrEqual(215);
  });

  it('cement content is calculated correctly (exceeds 450 kg/m³ limit)', () => {
    // Water = 197. W/C = 0.29. C = 197/0.29 ≈ 679.
    // The engine no longer silently clamps to 450 kg/m³ but returns the calculated value
    // alongside a warning state.
    expect(result.cement).toBeGreaterThanOrEqual(670);
    expect(result.cement).toBeLessThanOrEqual(690);
  });

  it('FA and CA are positive', () => {
    expect(result.fineAggregate).toBeGreaterThan(0);
    expect(result.coarseAggregate).toBeGreaterThan(0);
  });
});
