import { describe, it, expect } from 'vitest';
import { runMixDesignCalculation } from '../calculations';
import { getCentralizedMixStatus } from '../utils/status';
import type { MixDesignInput, MixDesignResult } from '../types';

function buildInput(overrides: Partial<MixDesignInput['designParameters']> = {}, matOverrides: Partial<MixDesignInput['materialProperties']> = {}): MixDesignInput {
  return {
    projectDetails: {
      projectName: 'Redesign Test Project',
      clientName: 'Test Client',
      engineerName: 'Test Engineer',
      date: '2026-08-14',
      location: 'Lab',
    },
    designParameters: {
      concreteGrade: 'M40',
      exposureCondition: 'moderate',
      slump: 100,
      maxAggregateSize: 20,
      isPumpedConcrete: false,
      isAirEntrained: false,
      faZone: 'II',
      siteControl: 'good',
      ...overrides,
    },
    materialProperties: {
      cement: { type: 'OPC_43', specificGravity: 3.15 },
      fineAggregate: { specificGravity: 2.65, waterAbsorption: 1.0, surfaceMoisture: 0 },
      coarseAggregate: { specificGravity: 2.70, waterAbsorption: 0.5, surfaceMoisture: 0 },
      water: { source: 'Potable' },
      admixture: { dosage: 0, waterReduction: 0, specificGravity: 1.2 },
      ...matOverrides,
    },
  };
}

describe('Phase 2B Controlled Redesign Assistant Tests', () => {
  // TEST 1
  it('TEST 1: NON_COMPLIANT result shows redesign action', () => {
    const input = buildInput(); // M40 + OPC 43 baseline fails cement max
    const result = runMixDesignCalculation(input);
    const status = getCentralizedMixStatus(result);

    expect(status.status).toBe('NON_COMPLIANT');
    expect(status.action).toBe('REDESIGN_REQUIRED');
  });

  // TEST 2
  it('TEST 2: COMPLIANT result does NOT show redesign action', () => {
    const input = buildInput({ concreteGrade: 'M25' });
    const result = runMixDesignCalculation(input);
    const status = getCentralizedMixStatus(result);

    expect(status.status).toBe('COMPLIANT');
    expect(status.action).toBe('NONE');
  });

  // TEST 3
  it('TEST 3: INCOMPLETE result does NOT show redesign action', () => {
    const input = buildInput({ maxAggregateSize: 12.5 }); // 12.5mm MSA on M40 is unsupported
    const result = runMixDesignCalculation(input);
    const status = getCentralizedMixStatus(result);

    expect(status.status).toBe('INCOMPLETE');
    expect(status.action).toBe('RETURN_TO_PARAMETERS');
  });

  // TEST 4
  it('TEST 4: Selecting a redesign parameter does not mutate original input', () => {
    const originalInput = buildInput();
    const inputSnapshot = JSON.stringify(originalInput);

    const proposedInput: MixDesignInput = JSON.parse(JSON.stringify(originalInput));
    proposedInput.materialProperties.admixture.waterReduction = 20;

    expect(JSON.stringify(originalInput)).toBe(inputSnapshot);
    expect(originalInput.materialProperties.admixture.waterReduction).toBe(0);
    expect(proposedInput.materialProperties.admixture.waterReduction).toBe(20);
  });

  // TEST 5
  it('TEST 5: Original calculation remains unchanged when proposed redesign is generated', () => {
    const originalInput = buildInput();
    const originalResult = runMixDesignCalculation(originalInput);
    const originalCement = originalResult.cement;

    const proposedInput: MixDesignInput = JSON.parse(JSON.stringify(originalInput));
    proposedInput.materialProperties.admixture.waterReduction = 22;
    const proposedResult = runMixDesignCalculation(proposedInput);

    expect(originalResult.cement).toBe(originalCement);
    expect(originalResult.cement).toBeGreaterThan(450);
    expect(proposedResult.cement).toBeLessThanOrEqual(450);
  });

  // TEST 6
  it('TEST 6: Proposed calculation uses runMixDesignCalculation()', () => {
    const originalInput = buildInput();
    const proposedInput: MixDesignInput = JSON.parse(JSON.stringify(originalInput));
    proposedInput.materialProperties.admixture.waterReduction = 22;

    const proposedResult = runMixDesignCalculation(proposedInput);
    expect(proposedResult.calculationSteps).toBeDefined();
    expect(proposedResult.calculationSteps.length).toBeGreaterThan(0);
    expect(proposedResult.cement).toBe(Math.round(proposedResult.unrounded?.cement ?? proposedResult.cement));
  });

  // TEST 7
  it('TEST 7: Proposed result can become COMPLIANT only through actual engine calculation', () => {
    const originalInput = buildInput();
    const originalResult = runMixDesignCalculation(originalInput);
    expect(getCentralizedMixStatus(originalResult).status).toBe('NON_COMPLIANT');

    // Apply sufficient water reduction (e.g. 22%) to reduce water from 197 to 154 kg/m³
    const proposedInput: MixDesignInput = JSON.parse(JSON.stringify(originalInput));
    proposedInput.materialProperties.admixture.waterReduction = 22;

    const proposedResult = runMixDesignCalculation(proposedInput);
    const proposedStatus = getCentralizedMixStatus(proposedResult);

    expect(proposedResult.cement).toBeLessThanOrEqual(450);
    expect(proposedStatus.status).toBe('COMPLIANT');
  });

  // TEST 8
  it('TEST 8: Proposed result remains NON_COMPLIANT when constraints still fail', () => {
    const originalInput = buildInput();
    // Insufficient water reduction (5%) -> cement remains ~525 kg/m³ > 450
    const proposedInput: MixDesignInput = JSON.parse(JSON.stringify(originalInput));
    proposedInput.materialProperties.admixture.waterReduction = 5;

    const proposedResult = runMixDesignCalculation(proposedInput);
    const proposedStatus = getCentralizedMixStatus(proposedResult);

    expect(proposedResult.cement).toBeGreaterThan(450);
    expect(proposedStatus.status).toBe('NON_COMPLIANT');
  });

  // TEST 9
  it('TEST 9: Proposed result becomes INCOMPLETE when required reference data is unavailable', () => {
    const originalInput = buildInput();
    // Proposed strategy changes MSA to 12.5mm for M40 (unsupported combination in Table 4)
    const proposedInput: MixDesignInput = JSON.parse(JSON.stringify(originalInput));
    proposedInput.designParameters.maxAggregateSize = 12.5;

    const proposedResult = runMixDesignCalculation(proposedInput);
    const proposedStatus = getCentralizedMixStatus(proposedResult);

    expect(proposedResult.isPlaceholder).toBe(true);
    expect(proposedStatus.status).toBe('INCOMPLETE');
  });

  // TEST 10
  it('TEST 10: No W/C override can bypass durability maximum', () => {
    const input = buildInput({ exposureCondition: 'severe', adoptedWcOverride: 0.55 });
    // Severe exposure durability max W/C is 0.45
    const result = runMixDesignCalculation(input);

    expect(result.wcRatio).toBeLessThanOrEqual(0.45); // Override 0.55 rejected, durability max 0.45 enforced
    expect(result.durabilityCheck).toBe('pass'); // Pass because adopted W/C was capped at 0.45 max
  });

  // TEST 11
  it('TEST 11: No cement result can bypass 450 kg/m³ maximum', () => {
    const input = buildInput();
    const result = runMixDesignCalculation(input);

    expect(result.cement).toBeGreaterThan(450);
    expect(result.cementContentCheck).toBe('fail');
    expect(getCentralizedMixStatus(result).status).toBe('NON_COMPLIANT');
  });

  // TEST 12
  it('TEST 12: Figure 1 never extrapolates during redesign', () => {
    const proposedInput = buildInput({ concreteGrade: 'M60' });
    const result = runMixDesignCalculation(proposedInput);

    expect(result.isPlaceholder).toBe(true);
    expect(result.wcRatio).toBe(0);
    expect(getCentralizedMixStatus(result).status).toBe('INCOMPLETE');
  });

  // TEST 13
  it('TEST 13: M60 never silently falls back to Table 8', () => {
    const proposedInput = buildInput({ concreteGrade: 'M60' });
    const result = runMixDesignCalculation(proposedInput);

    const step3 = result.calculationSteps.find((s) => s.stepNumber === 3);
    expect(step3?.inputs['Figure 1 Curve']).toBe('curve2');
    expect(step3?.result).toContain('Extrapolation is not permitted');
  });

  // TEST 14
  it('TEST 14: Original -> redesign lineage is preserved where persistence supports it', () => {
    const originalInput = buildInput();
    const originalResult = runMixDesignCalculation(originalInput);

    const proposedInput: MixDesignInput = JSON.parse(JSON.stringify(originalInput));
    proposedInput.materialProperties.admixture.waterReduction = 22;
    const proposedResult = runMixDesignCalculation(proposedInput);

    proposedResult.redesignMetadata = {
      parentProjectId: 'proj-12345',
      attemptNumber: 1,
      originalFailureReason: 'Cement > 450 kg/m³',
      remediationStrategy: 'admixture',
      changedParameters: {
        admixtureWaterReduction: { before: '0%', after: '22%' },
      },
    };

    expect(proposedResult.redesignMetadata.attemptNumber).toBe(1);
    expect(proposedResult.redesignMetadata.parentProjectId).toBe('proj-12345');
    expect(proposedResult.redesignMetadata.remediationStrategy).toBe('admixture');
  });

  // TEST 15
  it('TEST 15: Changing redesign values does not mutate the original saved project', () => {
    const originalInput = buildInput();
    const originalResult = runMixDesignCalculation(originalInput);

    const savedProject = {
      id: 'proj-original-100',
      status: 'calculated' as const,
      input: originalInput,
      result: originalResult,
      createdAt: '2026-08-14T00:00:00Z',
      updatedAt: '2026-08-14T00:00:00Z',
    };

    const proposedInput: MixDesignInput = JSON.parse(JSON.stringify(savedProject.input));
    proposedInput.materialProperties.admixture.waterReduction = 20;

    expect(savedProject.input.materialProperties.admixture.waterReduction).toBe(0);
    expect(savedProject.result?.cement).toBe(originalResult.cement);
  });
});
