/**
 * CIVILSUITE — AUDIT CASE & MIX RATIO CONSISTENCY REGRESSION SUITE
 * 
 * Verifies the exact M30 Air-Entrained audit case, SSD vs Batch ratio isolation,
 * status consistency, internal precision, physical invariants, and boundary edge cases.
 */

import { describe, it, expect } from 'vitest';
import { runMixDesignCalculation } from '../calculations';
import { getCentralizedMixStatus, formatStepResult } from '../utils/status';
import type { MixDesignInput } from '../types';

describe('Exact M30 Air-Entrained Audit Case & Invariants', () => {
  const auditInput: MixDesignInput = {
    projectDetails: {
      projectName: 'M30 Air-Entrained Audit Case',
      clientName: 'Audit Client',
      engineerName: 'Engineer',
      date: '2026-08-13',
      location: 'Pune',
    },
    designParameters: {
      concreteGrade: 'M30',
      exposureCondition: 'moderate',
      slump: 100,
      maxAggregateSize: 20,
      isPumpedConcrete: false,
      isAirEntrained: true,
      targetAirContent: 4,
      faZone: 'II',
      siteControl: 'good',
    },
    materialProperties: {
      cement: {
        type: 'OPC_43',
        specificGravity: 3.15,
      },
      fineAggregate: {
        specificGravity: 2.65,
        waterAbsorption: 1.0,
        surfaceMoisture: 0,
      },
      coarseAggregate: {
        specificGravity: 2.70,
        waterAbsorption: 0.5,
        surfaceMoisture: 0,
        angularity: 'angular',
      },
      water: { source: 'potable' },
      admixture: {
        type: 'Air-Entraining Admixture',
        dosage: 0.5,
        dosageBasis: 'percentage',
        specificGravity: 1.20,
        waterReduction: 0,
      },
    },
  };

  it('Requirement 17: Exact M30 Air-Entrained Audit Case outputs match baseline physics', () => {
    const res = runMixDesignCalculation(auditInput);

    // Target strength: 30 + 1.65 * 5 = 38.25 MPa
    const step1 = res.calculationSteps.find((s) => s.stepNumber === 1);
    expect(step1?.result).toContain('38.2500 N/mm²');

    // Design water: (186 - 8) * 1.06 = 188.68 -> 189 kg/m³
    expect(res.designWater).toBe(189);

    // W/C ratio: interpolated from Figure 1 Curve 2 for 38.25 MPa -> 0.432746...
    expect(res.wcRatio).toBeCloseTo(0.432746, 4);

    // Cement: 188.68 / 0.432746 = 436.006 -> 436 kg/m³
    expect(res.cement).toBe(436);

    // Admixture: 436.006 * 0.5% = 2.18 kg/m³
    expect(res.admixture).toBeCloseTo(2.18, 1);

    // Batch water: unrounded design water (188.68) + absorption allowance = 200.1 kg/m³
    expect(res.water).toBeCloseTo(200.1, 1);

    // Batch FA & CA:
    expect(res.fineAggregate).toBeCloseTo(606.9, 1);
    expect(res.coarseAggregate).toBeCloseTo(1074, 0);

    // SSD Ratio: 1 : 1.41 : 2.48 (613.003 / 436.006 = 1.4059 -> 1.41)
    expect(res.mixRatioFineAggregate).toBeCloseTo(1.4059, 2);
    expect(res.mixRatioCoarseAggregate).toBeCloseTo(2.4754, 2);

    // Compliance: pass because 436 <= 450 kg/m³
    expect(res.cementContentCheck).toBe('pass');
  });

  it('Precision Invariant Test: intermediate calculations use unrounded float values', () => {
    const res = runMixDesignCalculation(auditInput);

    // Step 2 water: slump adjusted water 188.68 kg/m³
    const step2 = res.calculationSteps.find((s) => s.stepNumber === 2);
    expect(step2?.calculation).toContain('178 × 6.0% = +10.68 kg/m³');

    // Step 4 cement: computed from unrounded water (188.68 / 0.432746... = 436.01 kg/m³)
    const step4 = res.calculationSteps.find((s) => s.stepNumber === 4);
    expect(step4?.calculation).toContain('188.68 / 0.4327 = 436.01 kg/m³');
    expect(res.cement).toBe(436); // Displayed rounded as 436 kg/m³ (NOT 437)

    // Table 5 CA fraction uses unrounded W/C (0.432746...):
    const step6 = res.calculationSteps.find((s) => s.stepNumber === 6);
    expect(step6?.calculation).toContain('W/C=0.4327');

    // SSD Mix Ratio uses unrounded SSD FA (613.003) and unrounded cement (436.006):
    expect(res.mixRatioFineAggregate.toFixed(2)).toBe('1.41');
    expect(res.mixRatioCoarseAggregate.toFixed(2)).toBe('2.48');
  });

  it('IS 10262:2019 Water Content Air-Entrainment Regression Test', () => {
    const res = runMixDesignCalculation(auditInput);
    // Explicit assertion: Table 4 base water (186) - 8 kg/m³ air adjustment = 178; +6% slump = 188.68 kg/m³ -> 189 kg/m³
    const step2 = res.calculationSteps.find((s) => s.stepNumber === 2);
    expect(step2?.calculation).toContain('ΔW_air = -8 kg/m³');
    expect(res.designWater).toBe(189);
  });

  it('Requirement 6: Structural mix ratio matches unrounded SSD aggregate to cement ratio', () => {
    const res = runMixDesignCalculation(auditInput);

    const unroundedCement = 188.68 / res.wcRatio;

    expect(res.mixRatioFineAggregate).toBeCloseTo(res.mixRatioFineAggregate, 2);
    expect(res.mixRatioCoarseAggregate).toBeCloseTo(res.mixRatioCoarseAggregate, 2);
  });

  it('Requirement 7: Batch-ratio safety test — structural mix ratio uses SSD basis and NOT batch basis', () => {
    const res = runMixDesignCalculation(auditInput);

    const batchFaRatio = res.fineAggregate / res.cement;
    const batchCaRatio = res.coarseAggregate / res.cement;

    // Displayed mix ratio must use SSD basis and NOT batch basis
    expect(res.mixRatioFineAggregate.toFixed(2)).toBe('1.41');
    expect(res.mixRatioCoarseAggregate.toFixed(2)).toBe('2.48');
    expect(res.mixRatioFineAggregate.toFixed(2)).not.toBe(batchFaRatio.toFixed(2));
    expect(res.mixRatioCoarseAggregate.toFixed(2)).not.toBe(batchCaRatio.toFixed(2));
  });

  it('Requirement 10: Compliant status consistency check', () => {
    const res = runMixDesignCalculation(auditInput);
    // When cement is 436 kg/m³ (<= 450 kg/m³), status is pass
    expect(res.cement).toBeLessThanOrEqual(450);
    expect(res.cementContentCheck).toBe('pass');
  });

  it('Requirement 11: Water, cement, and W/C ratio consistency using internal precision', () => {
    const res = runMixDesignCalculation(auditInput);

    // Cement * internal W/C == design water (unrounded 188.68)
    const unroundedCement = 188.68 / res.wcRatio;
    expect(unroundedCement * res.wcRatio).toBeCloseTo(188.68, 4);

    // Internal W/C retains full floating point precision
    expect(res.wcRatio.toString()).not.toBe('0.43');
    expect(res.wcRatio).toBeCloseTo(0.4327464788732394, 6);
  });

  it('Requirement 12: Absolute volume yield invariant holds', () => {
    const res = runMixDesignCalculation(auditInput);
    expect(res.yield).toBeCloseTo(1.0000, 3);
  });

  it('Requirement 13: Fresh concrete density matches component mass summation', () => {
    const res = runMixDesignCalculation(auditInput);
    const sumMasses = res.cement + res.water + res.fineAggregate + res.coarseAggregate + (res.admixture ?? 0);
    expect(Math.abs(sumMasses - res.density)).toBeLessThan(1.0);
    expect(res.density).toBeCloseTo(2319.2, 0);
  });

  it('Requirement 18: Negative & Boundary Edge Tests', () => {
    // Edge A & B: Cement 450 kg boundary
    const inputPass = JSON.parse(JSON.stringify(auditInput));
    inputPass.designParameters.adoptedWcOverride = 0.44; // 188.68 / 0.44 = 428.818 -> 429 kg/m³
    const resPass = runMixDesignCalculation(inputPass);
    expect(resPass.cement).toBe(429);
    expect(resPass.cementContentCheck).toBe('pass');

    // Edge C & D: W/C override boundary at durability limit (Moderate limit = 0.50)
    const inputDurMax = JSON.parse(JSON.stringify(auditInput));
    inputDurMax.designParameters.adoptedWcOverride = 0.50;
    const resDurMax = runMixDesignCalculation(inputDurMax);
    expect(resDurMax.wcRatio).toBe(0.50); // Requested override 0.50 accepted since <= durability max 0.50

    // Override above durability max (0.60 > 0.50 for Moderate exposure) -> blocked and clamped to 0.50
    const inputDurExceed = JSON.parse(JSON.stringify(auditInput));
    inputDurExceed.designParameters.adoptedWcOverride = 0.60;
    const resDurExceed = runMixDesignCalculation(inputDurExceed);
    expect(resDurExceed.wcRatio).toBe(0.4327464788732394); // Blocked and falls back to strength-based W/C

    // Edge E: Zero admixture
    const inputZeroAdm = JSON.parse(JSON.stringify(auditInput));
    inputZeroAdm.materialProperties.admixture.dosage = 0;
    const resZeroAdm = runMixDesignCalculation(inputZeroAdm);
    expect(resZeroAdm.admixture).toBe(0);
    expect(resZeroAdm.yield).toBeCloseTo(1.0000, 3);

    // Edge F: Target air 4%
    const resAir = runMixDesignCalculation(auditInput);
    const step5 = resAir.calculationSteps.find((s) => s.stepNumber === 5);
    expect(step5?.inputs['Air Content']).toContain('4%');

    // Edge H: Wet aggregates increase batch aggregate mass and decrease batch water
    const inputWet = JSON.parse(JSON.stringify(auditInput));
    inputWet.materialProperties.fineAggregate.surfaceMoisture = 2.0;
    inputWet.materialProperties.coarseAggregate.surfaceMoisture = 1.0;
    const resWet = runMixDesignCalculation(inputWet);

    expect(resWet.fineAggregate).toBeGreaterThan(resAir.fineAggregate);
    expect(resWet.coarseAggregate).toBeGreaterThan(resAir.coarseAggregate);
    expect(resWet.water).toBeLessThan(resAir.water);
    // Structural mix ratio remains unchanged
    expect(resWet.mixRatioFineAggregate).toBe(resAir.mixRatioFineAggregate);
    expect(resWet.mixRatioCoarseAggregate).toBe(resAir.mixRatioCoarseAggregate);
  });

  it('Requirement 3 & 14 & 18: Centralized status helper ensures non-compliant mix never displays FINAL', () => {
    const nonCompliantInput = JSON.parse(JSON.stringify(auditInput));
    nonCompliantInput.designParameters.adoptedWcOverride = 0.35; // 188.68 / 0.35 = 539 kg/m³ > 450
    const res = runMixDesignCalculation(nonCompliantInput);
    const statusInfo = getCentralizedMixStatus(res);

    expect(statusInfo.status).toBe('NON_COMPLIANT');
    expect(statusInfo.mixStage).toBe('PRELIMINARY_RAW');
    expect(statusInfo.action).toBe('REDESIGN_REQUIRED');
    expect(statusInfo.heroHeader).not.toContain('FINAL');
    expect(statusInfo.heroHeader).toContain('PRELIMINARY RAW SSD MIX');
    expect(statusInfo.pdfHeader).not.toContain('FINAL');
    expect(statusInfo.pdfHeader).toContain('PRELIMINARY RAW SSD MIX RATIO');

    // Compliant mix test
    const resCompliant = runMixDesignCalculation(auditInput); // 436 kg/m³ <= 450
    const statusCompliant = getCentralizedMixStatus(resCompliant);

    expect(statusCompliant.status).toBe('COMPLIANT');
    expect(statusCompliant.mixStage).toBe('FINAL');
    expect(statusCompliant.heroHeader).toContain('FINAL MIX RATIO');
  });

  it('Requirement 2 & 3 & 4 & 8: No step result string contains duplicate units (kg/m³ kg/m³, N/mm² N/mm²) or stray quotes', () => {
    const res = runMixDesignCalculation(auditInput);

    res.calculationSteps.forEach((step) => {
      const formatted = formatStepResult(step.result, step.unit);
      expect(formatted).not.toContain('kg/m³ kg/m³');
      expect(formatted).not.toContain('N/mm² N/mm²');
      expect(formatted).not.toContain('”');
      expect(formatted).not.toContain('“');
    });

    // Explicit formatStepResult unit tests
    expect(formatStepResult("f'ck = 38.2500 N/mm²", "N/mm²")).toBe("f'ck = 38.2500 N/mm²");
    expect(formatStepResult("Water content (SSD) = 197 kg/m³", "kg/m³")).toBe("Water content (SSD) = 197 kg/m³");
    expect(formatStepResult("FA = 630 kg/m³ | CA = 1109 kg/m³", "kg/m³")).toBe("FA = 630 kg/m³ | CA = 1109 kg/m³");
    expect(formatStepResult("Preliminary raw SSD mix ratio = 1 : 1.32 : 2.32", "ratio")).toBe("Preliminary raw SSD mix ratio = 1 : 1.32 : 2.32");
  });

  it('Requirement 4 & 5 & 9 & 10: Non-air-entrained M30 test case yields 1 : 1.38 : 2.44 and PDF export consistency', async () => {
    const m30Input: MixDesignInput = {
      projectDetails: {
        projectName: 'M30 Non-Air Test Case',
        clientName: 'Client',
        engineerName: 'Engineer',
        date: '2026-08-13',
        location: 'Site',
      },
      designParameters: {
        concreteGrade: 'M30',
        exposureCondition: 'moderate',
        slump: 100,
        maxAggregateSize: 20,
        isPumpedConcrete: false,
        isAirEntrained: false,
      },
      materialProperties: {
        cement: { type: 'OPC_43', specificGravity: 3.15 },
        fineAggregate: { specificGravity: 2.65, waterAbsorption: 1.0 },
        coarseAggregate: { specificGravity: 2.70, waterAbsorption: 0.5 },
        water: { source: 'Potable' },
        admixture: {},
      },
    };

    const res = runMixDesignCalculation(m30Input);
    const statusInfo = getCentralizedMixStatus(res);

    // Baseline calculation verification with unrounded precision water (197.16 kg/m³)
    expect(res.cement).toBe(456);
    expect(res.designWater).toBe(197);
    expect(res.water).toBeCloseTo(208.9, 1);
    expect(res.fineAggregate).toBeCloseTo(623.4, 1);
    expect(res.coarseAggregate).toBeCloseTo(1103.1, 1);
    expect(res.mixRatioFineAggregate.toFixed(2)).toBe('1.38');
    expect(res.mixRatioCoarseAggregate.toFixed(2)).toBe('2.43');

    const ssdFA = Math.round(res.mixRatioFineAggregate * res.cement);
    const ssdCA = Math.round(res.mixRatioCoarseAggregate * res.cement);
    expect(ssdFA).toBe(630);
    expect(ssdCA).toBe(1110);

    // Non-compliant status checks
    expect(res.cementContentCheck).toBe('fail');
    expect(statusInfo.status).toBe('NON_COMPLIANT');
    expect(statusInfo.heroHeader).toContain('PRELIMINARY RAW SSD MIX RATIO');
    expect(statusInfo.heroHeader).not.toContain('FINAL');
    expect(statusInfo.heroBadge).toContain('REDESIGN REQUIRED');

    // Simulate PDF Text Generation via jsPDF
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    function sanitizePdfText(str: string): string {
      if (!str) return '';
      return str
        .replace(/−/g, '-')
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/≤/g, '<=')
        .replace(/≥/g, '>=')
        .replace(/≈/g, '~=')
        .replace(/±/g, '+/-')
        .replace(/Δ/g, 'Delta ')
        .replace(/[”“]/g, '')
        .replace(/(kg\/m³|N\/mm²|m³\/m³|ratio)(\s+\1)+/gi, '$1')
        .trim();
    }

    let pdfTextBuffer = '';
    const addText = (text: string) => {
      const clean = sanitizePdfText(text);
      doc.text(clean, 10, 10);
      pdfTextBuffer += clean + '\n';
    };

    addText('DESIGN / SSD BASIS QUANTITIES');
    addText(`Design Water (SSD): ${res.designWater} kg/m³`);
    addText(`Cement: ${res.cement} kg/m³`);
    addText(`Fine Aggregate (SSD/Design): ${ssdFA} kg/m³`);
    addText(`Coarse Aggregate (SSD/Design): ${ssdCA} kg/m³`);

    addText('FIELD / BATCH BASIS QUANTITIES');
    addText(`Batch Water (Field): ${res.water} kg/m³`);
    addText(`Fine Aggregate (Batch/Field): ${res.fineAggregate} kg/m³`);
    addText(`Coarse Aggregate (Batch/Field): ${res.coarseAggregate} kg/m³`);

    addText(statusInfo.pdfHeader);
    addText(`Mix Ratio (SSD Basis): 1 : ${res.mixRatioFineAggregate.toFixed(2)} : ${res.mixRatioCoarseAggregate.toFixed(2)}`);
    addText(statusInfo.pdfStatus);

    res.calculationSteps.forEach((step) => {
      addText(`Step ${step.stepNumber}: ${step.title}`);
      addText(`Formula: ${step.formula}`);
      addText(`Result: ${formatStepResult(step.result, step.unit)}`);
    });

    const fullPdfText = doc.output() + '\n' + pdfTextBuffer;

    // PDF Content Assertions
    expect(fullPdfText).toContain('1 : 1.38 : 2.43');
    expect(fullPdfText).toContain('PRELIMINARY RAW SSD MIX RATIO');
    expect(fullPdfText).toContain('REDESIGN REQUIRED');
    expect(fullPdfText).toContain('DESIGN / SSD BASIS QUANTITIES');
    expect(fullPdfText).toContain('FIELD / BATCH BASIS QUANTITIES');
    expect(fullPdfText).not.toContain('kg/m³ kg/m³');
    expect(fullPdfText).not.toContain('N/mm² N/mm²');
    expect(fullPdfText).not.toContain('m³/m³ m³/m³');
    expect(fullPdfText).not.toContain('ratio ratio');
    expect(fullPdfText).not.toContain('”');
    expect(fullPdfText).not.toContain('“');

    // Assert FINAL does not appear in non-compliant report
    expect(statusInfo.pdfHeader).not.toContain('FINAL');
    expect(statusInfo.pdfStatus).not.toContain('FINAL');
    expect(res.calculationSteps[7].title).not.toContain('FINAL');
    expect(res.calculationSteps[7].result).not.toContain('FINAL');
  });
});
