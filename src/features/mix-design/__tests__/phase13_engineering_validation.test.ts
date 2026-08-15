/**
 * Phase 13 — Comprehensive Independent Engineering Validation Test Suite
 *
 * Validates CivilSuite calculation correctness against independent IS 10262:2019
 * and IS 456:2000 theoretical formulas and reference standards.
 */

import { describe, it, expect } from 'vitest';
import { runMixDesignCalculation } from '../calculations';
import { calculateTargetStrength } from '../calculations/targetStrength';
import { calculateWaterContent } from '../calculations/waterContent';
import { calculateStrengthBasedWCRatio } from '../calculations/wcRatio';
import { calculateCementContent } from '../calculations/cementContent';
import { calculateAggregateVolumes } from '../calculations/aggregateVolume';
import { calculateMoistureCorrection } from '../calculations/moistureCorrection';
import { applyDurabilityLimit } from '../calculations/durabilityLimit';
import {
  lookupBaseWaterContent,
  lookupBaseWaterContentHighStrength,
  lookupAirContent,
  lookupAirContentHighStrength,
  lookupDurabilityLimits,
  lookupCAFraction,
} from '../reference-data';
import type { MixDesignInput, ConcreteGrade, ExposureCondition } from '../types';
import { getCentralizedMixStatus } from '../utils/status';

function createEngineContext(overrides: Record<string, any>): any {
  return {
    grade: overrides.grade ?? 'M30',
    fck: overrides.fck ?? (overrides.grade ? parseInt(overrides.grade.replace('M', ''), 10) : 30),
    exposureCondition: overrides.exposure ?? 'moderate',
    slump: overrides.slump ?? 100,
    maxAggregateSize: overrides.maxAggregateSize ?? 20,
    isPumped: overrides.isPumped ?? false,
    isAirEntrained: overrides.isAirEntrained ?? false,
    targetAirContent: overrides.targetAirContent,
    cementType: overrides.cementType ?? 'OPC_43',
    cementGrade: overrides.cementGrade,
    cementSG: overrides.cementSG ?? 3.15,
    faSG: overrides.faSG ?? 2.65,
    caSG: overrides.caSG ?? 2.70,
    caAngularity: overrides.caAngularity ?? 'angular',
    faZone: overrides.faZone ?? 'II',
    siteControl: overrides.siteControl ?? 'good',
    waterAbsorptionFA: overrides.faWA ?? 1.0,
    waterAbsorptionCA: overrides.caWA ?? 0.5,
    admixtureWaterReduction: overrides.admixtureWaterReduction,
    adoptedWcOverride: overrides.adoptedWcOverride,
    admixtureDosageBasis: overrides.admixtureDosageBasis ?? 'percentage',
    surfaceMoistureFA: overrides.surfaceMoistureFA ?? 0,
    surfaceMoistureCA: overrides.surfaceMoistureCA ?? 0,
  };
}

function createTestInput(overrides: {
  grade?: ConcreteGrade;
  exposure?: ExposureCondition;
  slump?: number;
  msa?: number;
  isPumped?: boolean;
  isAirEntrained?: boolean;
  targetAirContent?: number;
  faZone?: 'I' | 'II' | 'III' | 'IV';
  siteControl?: 'good' | 'fair';
  cementType?: string;
  cementSG?: number;
  faSG?: number;
  caSG?: number;
  faWA?: number;
  caWA?: number;
  faSM?: number;
  caSM?: number;
  caAngularity?: 'angular' | 'sub-angular' | 'partially_rounded' | 'rounded';
  admixDosage?: number;
  admixBasis?: 'percentage' | 'liters_per_m3' | 'percent_cement';
  admixSG?: number;
  admixWR?: number;
  adoptedWcOverride?: number;
}): MixDesignInput {
  const grade = overrides.grade ?? 'M30';
  const fck = parseInt(grade.replace('M', ''), 10);

  return {
    projectDetails: {
      projectName: `Validation ${grade}`,
      clientName: 'Engineering Authority',
      engineerName: 'Lead Structural Consultant',
      date: '2026-08-15',
      location: 'Regional Testing Lab',
      remarks: 'Phase 13 Independent Engineering Validation Case',
    },
    designParameters: {
      concreteGrade: grade,
      fck,
      exposureCondition: overrides.exposure ?? 'moderate',
      slump: overrides.slump ?? 100,
      maxAggregateSize: overrides.msa ?? 20,
      isPumpedConcrete: overrides.isPumped ?? false,
      isAirEntrained: overrides.isAirEntrained ?? false,
      targetAirContent: overrides.targetAirContent,
      faZone: overrides.faZone ?? 'II',
      siteControl: overrides.siteControl ?? 'good',
      adoptedWcOverride: overrides.adoptedWcOverride,
    },
    materialProperties: {
      cement: {
        type: overrides.cementType ?? 'OPC_43',
        specificGravity: overrides.cementSG ?? 3.15,
      },
      fineAggregate: {
        specificGravity: overrides.faSG ?? 2.65,
        waterAbsorption: overrides.faWA ?? 1.0,
        surfaceMoisture: overrides.faSM ?? 0,
        finesModulus: 2.8,
      },
      coarseAggregate: {
        specificGravity: overrides.caSG ?? 2.70,
        waterAbsorption: overrides.caWA ?? 0.5,
        surfaceMoisture: overrides.caSM ?? 0,
        angularity: overrides.caAngularity ?? 'angular',
      },
      water: { source: 'Potable' },
      admixture: {
        type: (overrides.admixDosage ?? 0) > 0 ? 'Superplasticizer' : 'None',
        dosage: overrides.admixDosage ?? 0,
        dosageBasis: (overrides.admixBasis as any) ?? 'percentage',
        specificGravity: overrides.admixSG,
        waterReduction: overrides.admixWR ?? 0,
      },
    },
  } as MixDesignInput;
}

describe('Phase 13 — Comprehensive Independent Engineering Validation Matrix', () => {

  // =========================================================================
  // SECTION 4: TARGET MEAN STRENGTH VALIDATION (IS 10262:2019 Clause 4.2)
  // =========================================================================
  describe('4. Target Mean Strength: f\'ck = fck + 1.65 × S', () => {
    it('TEST 29.1 — Grade M20 (Table 1: S = 4.0 N/mm²)', () => {
      // Theoretical: 20 + 1.65 * 4.0 = 26.60 MPa
      const res = calculateTargetStrength(createEngineContext({ grade: 'M20', fck: 20, siteControl: 'good' }));
      expect(res.value).toBe(26.60);
      expect(res.detail.standardDeviation).toBe(4.0);
    });

    it('TEST 29.2 — Grade M25 (Table 1: S = 4.0 N/mm²)', () => {
      // Theoretical: 25 + 1.65 * 4.0 = 31.60 MPa
      const res = calculateTargetStrength(createEngineContext({ grade: 'M25', fck: 25, siteControl: 'good' }));
      expect(res.value).toBe(31.60);
      expect(res.detail.standardDeviation).toBe(4.0);
    });

    it('TEST 29.3 — Grade M30 (Table 1: S = 5.0 N/mm²)', () => {
      // Theoretical: 30 + 1.65 * 5.0 = 38.25 MPa
      const res = calculateTargetStrength(createEngineContext({ grade: 'M30', fck: 30, siteControl: 'good' }));
      expect(res.value).toBe(38.25);
      expect(res.detail.standardDeviation).toBe(5.0);
    });

    it('TEST 29.4 — Grade M40 (Table 1: S = 5.0 N/mm²)', () => {
      // Theoretical: 40 + 1.65 * 5.0 = 48.25 MPa
      const res = calculateTargetStrength(createEngineContext({ grade: 'M40', fck: 40, siteControl: 'good' }));
      expect(res.value).toBe(48.25);
      expect(res.detail.standardDeviation).toBe(5.0);
    });

    it('TEST 29.5 — Grade M60 (Table 1: S = 5.0 N/mm²)', () => {
      // Theoretical: 60 + 1.65 * 5.0 = 68.25 MPa
      const res = calculateTargetStrength(createEngineContext({ grade: 'M60', fck: 60, siteControl: 'good' }));
      expect(res.value).toBe(68.25);
      expect(res.detail.standardDeviation).toBe(5.0);
    });

    it('TEST 29.6 — Grade M65 High Strength (Table 1: S = 6.0 N/mm²)', () => {
      // Theoretical: 65 + 1.65 * 6.0 = 74.90 MPa
      const res = calculateTargetStrength(createEngineContext({ grade: 'M65', fck: 65, siteControl: 'good' }));
      expect(res.value).toBe(74.90);
      expect(res.detail.standardDeviation).toBe(6.0);
    });

    it('TEST 29.7 — Grade M70 High Strength (Table 1: S = 6.0 N/mm²)', () => {
      // Theoretical: 70 + 1.65 * 6.0 = 79.90 MPa
      const res = calculateTargetStrength(createEngineContext({ grade: 'M70', fck: 70, siteControl: 'good' }));
      expect(res.value).toBe(79.90);
      expect(res.detail.standardDeviation).toBe(6.0);
    });

    it('TEST 29.8 — Site Control "fair" increases standard deviation by +1.0 N/mm²', () => {
      // Table 2 footnote / Clause 4.2: S increases by 1 N/mm² for fair control
      // M30 Fair control: S = 6.0 -> 30 + 1.65 * 6.0 = 39.90 MPa
      const res = calculateTargetStrength(createEngineContext({ grade: 'M30', fck: 30, siteControl: 'fair' }));
      expect(res.value).toBe(39.90);
      expect(res.detail.standardDeviation).toBe(6.0);
    });
  });

  // =========================================================================
  // SECTION 5: WATER CONTENT VALIDATION (IS 10262:2019 Clause 5.3 & 6.3)
  // =========================================================================
  describe('5. Water Content Lookup & Adjustments', () => {
    it('TEST 30.1 — Base Water Table 4 for 50 mm slump (MSA 10, 20, 40 mm)', () => {
      expect(lookupBaseWaterContent(10)).toBe(208);
      expect(lookupBaseWaterContent(20)).toBe(186);
      expect(lookupBaseWaterContent(40)).toBe(165);
    });

    it('TEST 30.2 — Slump adjustment: +3% per 25 mm above 50 mm baseline', () => {
      // Baseline 50 mm for 20 mm MSA = 186 kg/m³
      // For 100 mm slump: +2 intervals of 25 mm -> +6% -> 186 * 1.06 = 197.16 kg/m³ -> rounded to 197
      const res = calculateWaterContent(createEngineContext({
        grade: 'M30',
        fck: 30,
        maxAggregateSize: 20,
        slump: 100,
        caAngularity: 'angular',
      }));
      expect(res.value).toBe(197);
      expect(res.unroundedValue).toBeCloseTo(197.16, 2);
    });

    it('TEST 30.3 — Aggregate Angularity adjustment (Table 4 Note)', () => {
      // Sub-angular (-10 kg/m³), Partially rounded (-15 kg/m³), Rounded (-20 kg/m³)
      const resSub = calculateWaterContent(createEngineContext({ grade: 'M30', fck: 30, maxAggregateSize: 20, slump: 50, caAngularity: 'sub-angular' }));
      const resPart = calculateWaterContent(createEngineContext({ grade: 'M30', fck: 30, maxAggregateSize: 20, slump: 50, caAngularity: 'partially_rounded' }));
      const resRound = calculateWaterContent(createEngineContext({ grade: 'M30', fck: 30, maxAggregateSize: 20, slump: 50, caAngularity: 'rounded' }));

      expect(resSub.value).toBe(176); // 186 - 10
      expect(resPart.value).toBe(171); // 186 - 15
      expect(resRound.value).toBe(166); // 186 - 20
    });

    it('TEST 30.4 — Chemical Superplasticizer Water Reduction (Clause 6.3.1)', () => {
      // Base at 100mm slump = 197.16 kg/m³. Admixture water reduction 20% -> 197.16 * 0.80 = 157.728 kg/m³ -> 158
      const res = calculateWaterContent(createEngineContext({
        grade: 'M30',
        fck: 30,
        maxAggregateSize: 20,
        slump: 100,
        caAngularity: 'angular',
        admixtureWaterReduction: 20,
      }));
      expect(res.value).toBe(158);
      expect(res.unroundedValue).toBeCloseTo(157.728, 3);
    });
  });

  // =========================================================================
  // SECTION 6 & 7: W/C RATIO & DURABILITY CEILINGS (IS 456:2000 Table 5)
  // =========================================================================
  describe('6. W/C Ratio & Durability Ceilings', () => {
    it('TEST 32.1 — IS 456 Table 5 Durability Maximum W/C Ratios', () => {
      expect(lookupDurabilityLimits('mild')?.maxWCRatio).toBe(0.55);
      expect(lookupDurabilityLimits('moderate')?.maxWCRatio).toBe(0.50);
      expect(lookupDurabilityLimits('severe')?.maxWCRatio).toBe(0.45);
      expect(lookupDurabilityLimits('very_severe')?.maxWCRatio).toBe(0.45);
      expect(lookupDurabilityLimits('extreme')?.maxWCRatio).toBe(0.40);
    });

    it('TEST 32.2 — IS 456 Table 5 Minimum Cement Contents', () => {
      expect(lookupDurabilityLimits('mild')?.minCementContent).toBe(300);
      expect(lookupDurabilityLimits('moderate')?.minCementContent).toBe(300);
      expect(lookupDurabilityLimits('severe')?.minCementContent).toBe(320);
      expect(lookupDurabilityLimits('very_severe')?.minCementContent).toBe(340);
      expect(lookupDurabilityLimits('extreme')?.minCementContent).toBe(360);
    });

    it('TEST 32.3 — Strength W/C > Durability Ceiling -> Durability Ceiling Controls', () => {
      // If strength curve gives W/C = 0.52 for Severe exposure (max 0.45), adopted must be 0.45
      const check = applyDurabilityLimit(0.52, 0.45);
      expect(check.finalWC).toBe(0.45);
      expect(check.controllingLimit).toBe('durability');
    });

    it('TEST 32.4 — Strength W/C < Durability Ceiling -> Strength W/C Controls', () => {
      // If strength curve gives W/C = 0.38 for Mild exposure (max 0.55), adopted must be 0.38
      const check = applyDurabilityLimit(0.38, 0.55);
      expect(check.finalWC).toBe(0.38);
      expect(check.controllingLimit).toBe('strength');
    });

    it('TEST 33.1 — User W/C Override exceeding durability ceiling is BLOCKED', () => {
      const input = createTestInput({
        grade: 'M25',
        exposure: 'severe', // Durability max W/C = 0.45
        adoptedWcOverride: 0.50, // Violates 0.45
      });
      const res = runMixDesignCalculation(input);
      // Engine must reject 0.50 and enforce durability ceiling 0.45
      expect(res.wcRatio).toBe(0.45);
      expect(res.durabilityCheck).toBe('pass');
    });
  });

  // =========================================================================
  // SECTION 8: ABSOLUTE VOLUME & AGGREGATE PROPORTIONING
  // =========================================================================
  describe('8. Absolute Volume & Aggregate Proportions (IS 10262 Clause 5.5 & 6.6)', () => {
    it('TEST 35.1 — Aggregate Absolute Volume = 1.0 - (Vw + Vc + Vadmix + Vair)', () => {
      const input = createTestInput({ grade: 'M30', exposure: 'moderate' });
      const res = runMixDesignCalculation(input);

      // Volume derivations:
      const vWater = res.designWater / 1000;
      const vCement = res.cement / (3.15 * 1000);
      const vAir = 0.01; // 1.0% entrapped air for 20mm MSA
      const vAdmix = 0;
      const expectedAggVol = 1.0 - (vWater + vCement + vAir + vAdmix);

      expect(res.unrounded?.aggVolume).toBeCloseTo(expectedAggVol, 3);
    });

    it('TEST 36.1 — Pumped Concrete reduces CA proportion by 10%', () => {
      const nonPumped = runMixDesignCalculation(createTestInput({ isPumped: false }));
      const pumped = runMixDesignCalculation(createTestInput({ isPumped: true }));

      // CA proportion is multiplied by 0.90 for pumped concrete
      expect(pumped.unrounded?.caFraction).toBeCloseTo((nonPumped.unrounded?.caFraction ?? 0) * 0.90, 3);
      // Fine aggregate ratio is (1 - CA ratio), so FA increases
      expect(pumped.unrounded?.faFraction).toBeGreaterThan(nonPumped.unrounded?.faFraction ?? 0);
    });
  });

  // =========================================================================
  // SECTION 9: MOISTURE CORRECTION AUDIT (IS 10262 Clause 7)
  // =========================================================================
  describe('9. Moisture & Absorption Field Batch Corrections', () => {
    it('TEST 41.1 — Oven-Dry Aggregate (0.0% surface moisture, 1.0% absorption) increases batch water', () => {
      const input = createTestInput({
        faWA: 1.0,
        faSM: 0.0,
        caWA: 0.5,
        caSM: 0.0,
      });
      const res = runMixDesignCalculation(input);

      // Aggregate absorbs water from mix -> batch water must be HIGHER than design water
      expect(res.water).toBeGreaterThan(res.designWater);
    });

    it('TEST 42.1 — Wet Aggregate (3.0% surface moisture, 1.0% absorption) decreases batch water', () => {
      const input = createTestInput({
        faWA: 1.0,
        faSM: 3.0, // 2.0% free moisture
        caWA: 0.5,
        caSM: 2.5, // 2.0% free moisture
      });
      const res = runMixDesignCalculation(input);

      // Free moisture contributes to mix water -> batch water must be LOWER than design water
      expect(res.water).toBeLessThan(res.designWater);
      // Wet aggregate batch mass increases by moisture percentage
      expect(res.fineAggregate).toBeGreaterThan(res.ssdFineAggregate!);
      expect(res.coarseAggregate).toBeGreaterThan(res.ssdCoarseAggregate!);
    });
  });

  // =========================================================================
  // SECTION 10: ADMIXTURE DOSAGE VALIDATION
  // =========================================================================
  describe('10. Chemical Admixture Dosage Mechanics', () => {
    it('TEST 38.1 — Percentage dosage basis: mass = cement × (dosage / 100)', () => {
      const input = createTestInput({
        admixDosage: 1.5,
        admixBasis: 'percentage',
        admixSG: 1.15,
        admixWR: 15,
      });
      const res = runMixDesignCalculation(input);

      const expectedAdmixMass = res.cement * 0.015;
      expect(res.admixture).toBeCloseTo(expectedAdmixMass, 1);
    });

    it('TEST 39.1 — Liters/m³ dosage basis: mass = dosage (L) × SG', () => {
      const input = createTestInput({
        admixDosage: 4.8,
        admixBasis: 'liters_per_m3',
        admixSG: 1.121,
        admixWR: 20,
      });
      const res = runMixDesignCalculation(input);

      // 4.8 L/m³ * 1.121 = 5.3808 kg/m³
      expect(res.admixture).toBeCloseTo(5.38, 2);
    });

    it('TEST 40.1 — Liters/m³ without specific gravity returns yield error and null yield', () => {
      const input = createTestInput({
        admixDosage: 4.8,
        admixBasis: 'liters_per_m3',
        admixSG: undefined, // Missing required SG
      });
      const res = runMixDesignCalculation(input);

      expect(res.yield).toBeNull();
      expect(res.yieldError).toBeDefined();
    });
  });

  // =========================================================================
  // SECTION 12: HIGH-STRENGTH CONCRETE PATH (IS 10262:2019 Table 6, 7, 8, 10)
  // =========================================================================
  describe('12. High-Strength Concrete Path (M65 – M80)', () => {
    it('TEST 31.1 — High Strength Base Water Table 7', () => {
      expect(lookupBaseWaterContentHighStrength(10)).toBe(200);
      expect(lookupBaseWaterContentHighStrength(12.5)).toBe(195);
      expect(lookupBaseWaterContentHighStrength(20)).toBe(186);
    });

    it('TEST 31.2 — High Strength Air Content Table 6 (0.5% for 20mm MSA)', () => {
      expect(lookupAirContentHighStrength(20)).toBe(0.5);
    });

    it('TEST 31.3 — M65 calculation uses High-Strength tables and achieves valid yield', () => {
      const input = createTestInput({
        grade: 'M65',
        msa: 20,
        slump: 120,
        admixDosage: 1.0,
        admixSG: 1.15,
        admixWR: 25,
      });
      const res = runMixDesignCalculation(input);

      expect(res.isPlaceholder).toBe(false);
      expect(res.calculationSteps[0].result).toContain('74.90');
      expect(res.cement).toBeGreaterThan(350);
      expect(res.yield).toBeCloseTo(1.0, 2);
    });
  });

  // =========================================================================
  // SECTION 13: UNSUPPORTED REFERENCE DATA & DIAGNOSTIC REASONS
  // =========================================================================
  describe('13. Unsupported Input Diagnostics', () => {
    it('TEST 43.1 — MSA 12.5mm in Ordinary concrete is blocked with Table 4 diagnostic', () => {
      const input = createTestInput({
        grade: 'M30',
        msa: 12.5, // 12.5mm not in Table 4 for ordinary concrete
      });
      const res = runMixDesignCalculation(input);
      const statusInfo = getCentralizedMixStatus(res);

      expect(res.isPlaceholder).toBe(true);
      expect(statusInfo.status).toBe('INCOMPLETE');
      expect(statusInfo.reason).toContain('12.5 mm not in IS 10262:2019, Clause 6.3, Table 4');
    });
  });

  // =========================================================================
  // SECTION 11 & 14: COMPLIANCE STATES & ROUNDING AUDIT
  // =========================================================================
  describe('11 & 14. Compliance States & Rounding Audit', () => {
    it('TEST 44.1 — COMPLIANT result status for normal valid mix', () => {
      const input = createTestInput({ grade: 'M30', exposure: 'moderate', admixDosage: 1.0, admixSG: 1.15, admixWR: 15 });
      const res = runMixDesignCalculation(input);
      const statusInfo = getCentralizedMixStatus(res);

      expect(statusInfo.status).toBe('COMPLIANT');
      expect(res.durabilityCheck).toBe('pass');
      expect(res.cementContentCheck).toBe('pass');
    });

    it('TEST 45.1 — NON_COMPLIANT result status when cement exceeds 450 kg/m³', () => {
      // Very low W/C ratio forced without mineral admixtures -> high cement content
      const input = createTestInput({
        grade: 'M40',
        exposure: 'extreme',
        adoptedWcOverride: 0.25, // Forces cement = ~186 / 0.25 > 700 kg/m³
      });
      const res = runMixDesignCalculation(input);
      const statusInfo = getCentralizedMixStatus(res);

      expect(statusInfo.status).toBe('NON_COMPLIANT');
      expect(res.cementContentCheck).toBe('fail');
      expect(res.cement).toBeGreaterThan(450);
    });

    it('TEST 46.1 — Zero fabricated final mix ratios on incomplete calculation', () => {
      const input = createTestInput({
        grade: 'M30',
        msa: 12.5, // Blocked in ordinary concrete
      });
      const res = runMixDesignCalculation(input);

      expect(res.isPlaceholder).toBe(true);
      expect(res.mixRatioFineAggregate).toBe(0);
      expect(res.mixRatioCoarseAggregate).toBe(0);
    });

    it('TEST 47.1 — Rounding Audit: Unrounded precision is preserved internally', () => {
      const input = createTestInput({
        grade: 'M30',
        exposure: 'moderate',
        slump: 100,
        admixWR: 21.5,
      });
      const res = runMixDesignCalculation(input);

      // Display cement is rounded integer, but unrounded double precision exists
      expect(Number.isInteger(res.cement)).toBe(true);
      expect(res.unrounded?.cement).toBeDefined();
      expect(res.unrounded?.cement).not.toBe(res.cement); // float vs integer
      expect(res.unrounded?.aggVolume).toBeDefined();
      expect(res.unrounded?.caFraction).toBeDefined();
    });
  });

  // =========================================================================
  // SECTION 15: AGGREGATE ZONE & EXPOSURE SWEEPS
  // =========================================================================
  describe('15. Aggregate Zone & Exposure Comprehensive Sweeps', () => {
    it('TEST 49.1 — 5-Exposure Durability Table 5 Full Sweep', () => {
      const exposures: ExposureCondition[] = ['mild', 'moderate', 'severe', 'very_severe', 'extreme'];
      const expectedMinCement = [300, 300, 320, 340, 360];
      const expectedMaxWC = [0.55, 0.50, 0.45, 0.45, 0.40];

      exposures.forEach((exp, idx) => {
        const limits = lookupDurabilityLimits(exp);
        expect(limits?.minCementContent).toBe(expectedMinCement[idx]);
        expect(limits?.maxWCRatio).toBe(expectedMaxWC[idx]);
      });
    });

    it('TEST 50.1 — IS 10262 Table 5 Coarse Aggregate Fractions for 20mm MSA (W/C = 0.50)', () => {
      // Table 5: 20mm MSA at W/C 0.50: Zone I = 0.60, Zone II = 0.62, Zone III = 0.64, Zone IV = 0.66
      expect(lookupCAFraction(20, 'I', 0.50)).toBe(0.60);
      expect(lookupCAFraction(20, 'II', 0.50)).toBe(0.62);
      expect(lookupCAFraction(20, 'III', 0.50)).toBe(0.64);
      expect(lookupCAFraction(20, 'IV', 0.50)).toBe(0.66);
    });

    it('TEST 51.1 — Cement type selection propagates to calculation steps', () => {
      const ppcInput = createTestInput({ grade: 'M30', cementType: 'PPC', cementSG: 2.90 });
      const pscInput = createTestInput({ grade: 'M30', cementType: 'PSC', cementSG: 3.00 });

      const resPPC = runMixDesignCalculation(ppcInput);
      const resPSC = runMixDesignCalculation(pscInput);

      expect(resPPC.isPlaceholder).toBe(false);
      expect(resPSC.isPlaceholder).toBe(false);
      expect(resPPC.yield).toBeCloseTo(1.0, 2);
      expect(resPSC.yield).toBeCloseTo(1.0, 2);
    });
  });

  // =========================================================================
  // SECTION 16: FULL GOLDEN ENGINEERING RECONCILIATION
  // =========================================================================
  describe('16. Full Golden Engineering Reconciliations', () => {
    it('TEST 48.1 — Authoritative M40 Annex A / p6 Reference Benchmark', () => {
      // Golden Case: M40, OPC 43 (SG 3.15), 115mm slump, 20mm MSA, rounded gravel, 21.8826% WR, pumped
      const input = createTestInput({
        grade: 'M40',
        exposure: 'moderate',
        slump: 115,
        msa: 20,
        caAngularity: 'rounded',
        isPumped: true,
        admixDosage: 5.0,
        admixBasis: 'percentage',
        admixSG: 1.15,
        admixWR: 21.8826,
        faZone: 'II',
      });
      const res = runMixDesignCalculation(input);

      expect(res.calculationSteps[0].result).toContain('48.25');
      expect(res.designWater).toBe(140);
      expect(res.cement).toBe(384);
      expect(res.wcRatio).toBeCloseTo(0.3643, 4);
      expect(res.ssdFineAggregate).toBe(788);
      expect(res.ssdCoarseAggregate).toBe(1119);
      expect(res.mixRatioFineAggregate).toBeCloseTo(2.05, 2);
      expect(res.mixRatioCoarseAggregate).toBeCloseTo(2.92, 2);
      expect(res.water).toBe(153.2);
    });
  });
});
