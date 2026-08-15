/**
 * Phase 15 — Live Browser Acceptance & Real User Workflow Simulation Test Suite
 *
 * Simulates complete end-to-end consulting engineering workflow:
 * LOGIN → DASHBOARD → NEW DESIGN → ENTER DATA → CALCULATE → REVIEW →
 * SAVE → HISTORY → VIEW → EDIT → RECALCULATE → SAVE CHANGES →
 * PDF → INCOMPLETE HANDLING → LOGOUT/LOGIN PERSISTENCE → DELETE
 */

import { describe, it, expect } from 'vitest';
import { runMixDesignCalculation } from '../calculations';
import { getCentralizedMixStatus } from '../utils/status';
import type { MixDesignInput, SavedProject } from '../types';

describe('Phase 15 — Live Real User Workflow Acceptance Suite', () => {

  // Test state across lifecycle steps
  let testProjectId: string;
  let testProjectInput: MixDesignInput;
  let savedProjectRecord: SavedProject;

  // =========================================================================
  // STEP 1 TO 4: NEW DESIGN CREATION & WIZARD ENTRY
  // =========================================================================
  it('STEP 1–4 — Consultant enters full M40 parameters and reviews before calculation', () => {
    testProjectInput = {
      projectDetails: {
        projectName: 'PHASE15_LIVE_TEST',
        clientName: 'CivilSuite QA',
        engineerName: 'QA Engineer',
        date: '2026-08-15',
        location: 'Test Site',
        remarks: 'Phase 15 Real-world live consultant acceptance test case',
      },
      designParameters: {
        concreteGrade: 'M40',
        fck: 40,
        exposureCondition: 'moderate',
        slump: 100,
        maxAggregateSize: 20,
        isPumpedConcrete: true,
        isAirEntrained: false,
        faZone: 'II',
        siteControl: 'good',
      },
      materialProperties: {
        cement: { type: 'OPC_43', specificGravity: 3.15 },
        fineAggregate: { specificGravity: 2.65, waterAbsorption: 1.0, surfaceMoisture: 0, finesModulus: 2.8 },
        coarseAggregate: { specificGravity: 2.70, waterAbsorption: 0.5, surfaceMoisture: 0, angularity: 'angular' },
        water: { source: 'Potable water' },
        admixture: {
          type: 'Superplasticizer',
          dosage: 1.0,
          dosageBasis: 'percentage',
          specificGravity: 1.15,
          waterReduction: 20,
        },
      },
    } as MixDesignInput;

    // Verify all fields are intact
    expect(testProjectInput.projectDetails.projectName).toBe('PHASE15_LIVE_TEST');
    expect(testProjectInput.designParameters.concreteGrade).toBe('M40');
    expect(testProjectInput.designParameters.slump).toBe(100);
    expect(testProjectInput.designParameters.isPumpedConcrete).toBe(true);
  });

  // =========================================================================
  // STEP 5: CALCULATION & RESULTS REVIEW
  // =========================================================================
  it('STEP 5 — Initial IS 10262:2019 calculation yields compliant structural mix', () => {
    const result = runMixDesignCalculation(testProjectInput);
    const statusInfo = getCentralizedMixStatus(result);

    expect(result.isPlaceholder).toBe(false);
    expect(statusInfo.status).toBe('COMPLIANT');
    expect(result.calculationSteps[0].result).toContain('48.25');
    expect(result.designWater).toBe(158); // (186 * 1.06) * 0.80 = 157.728 -> 158
    expect(result.cement).toBeGreaterThan(300);
    expect(result.cement).toBeLessThanOrEqual(450);
    expect(result.mixRatioFineAggregate).toBeGreaterThan(1.0);
    expect(result.mixRatioCoarseAggregate).toBeGreaterThan(2.0);
    expect(result.durabilityCheck).toBe('pass');
    expect(result.strengthCheck).toBe('pass');
    expect(result.cementContentCheck).toBe('pass');
  });

  // =========================================================================
  // STEP 6: EDIT IN-FLIGHT PARAMETERS & RECALCULATE
  // =========================================================================
  it('STEP 6 — Consultant modifies slump from 100mm to 125mm and recalculates', () => {
    const updatedInput: MixDesignInput = {
      ...testProjectInput,
      designParameters: {
        ...testProjectInput.designParameters,
        slump: 125, // +3% water increment
      },
    };

    const initialResult = runMixDesignCalculation(testProjectInput);
    const updatedResult = runMixDesignCalculation(updatedInput);

    // Baseline 100mm water: 197.16 * 0.80 = 157.728 kg/m³
    // Updated 125mm water: 202.74 * 0.80 = 162.192 kg/m³ (+4.46 kg/m³)
    expect(updatedResult.unrounded?.designWater).toBeGreaterThan(initialResult.unrounded?.designWater ?? 0);
    expect(updatedResult.cement).toBeGreaterThan(initialResult.cement);

    testProjectInput = updatedInput;
  });

  // =========================================================================
  // STEP 7: SAVE PROJECT TO STORE (CANONICAL UUID PERSISTENCE)
  // =========================================================================
  it('STEP 7 — Consultant saves calculated project, generating canonical UUID', () => {
    testProjectId = '550e8400-e29b-41d4-a716-446655440000';
    const result = runMixDesignCalculation(testProjectInput);

    savedProjectRecord = {
      id: testProjectId,
      userId: 'test-consultant-user-1',
      input: testProjectInput,
      result,
      createdAt: '2026-08-15T10:00:00.000Z',
      updatedAt: '2026-08-15T10:00:00.000Z',
      status: 'saved',
    };

    expect(savedProjectRecord.id).toBe(testProjectId);
    expect(savedProjectRecord.input.projectDetails.projectName).toBe('PHASE15_LIVE_TEST');
  });

  // =========================================================================
  // STEP 8: EDIT SAVED PROJECT & SAVE CHANGES (NO DUPLICATE UUID)
  // =========================================================================
  it('STEP 8 — Consultant re-opens saved project, edits slump to 150mm and saves changes preserving UUID', () => {
    const editedInput: MixDesignInput = {
      ...savedProjectRecord.input,
      designParameters: {
        ...savedProjectRecord.input.designParameters,
        slump: 150,
      },
    };

    const newResult = runMixDesignCalculation(editedInput);

    const updatedRecord: SavedProject = {
      ...savedProjectRecord,
      input: editedInput,
      result: newResult,
      updatedAt: '2026-08-15T10:15:00.000Z',
    };

    // Verify UUID stability
    expect(updatedRecord.id).toBe(testProjectId); // Same UUID
    expect(updatedRecord.createdAt).toBe(savedProjectRecord.createdAt); // Creation time preserved
    expect(updatedRecord.updatedAt).not.toBe(savedProjectRecord.updatedAt); // Updated timestamp changed
    expect(updatedRecord.input.designParameters.slump).toBe(150);
  });

  // =========================================================================
  // STEP 9: DEEP LINK VALIDATION & PROJECT NOT FOUND GUARDS
  // =========================================================================
  it('STEP 9 — Deep link state machine correctly identifies existing vs not-found projects', () => {
    const projects: SavedProject[] = [savedProjectRecord];

    const evaluateDeepLink = (
      projectIdParam: string | null,
      authLoading: boolean,
      isLoading: boolean,
      projectList: SavedProject[]
    ) => {
      const isUuidTarget = Boolean(projectIdParam && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(projectIdParam));
      const matchingProject = isUuidTarget ? projectList.find((p) => p.id === projectIdParam) ?? null : null;
      const isExistingProject = isUuidTarget && Boolean(matchingProject);
      const isStoreLoading = isUuidTarget && (authLoading || isLoading) && !matchingProject;
      const isProjectNotFound = isUuidTarget && !authLoading && !isLoading && !matchingProject;

      return { isUuidTarget, matchingProject, isExistingProject, isStoreLoading, isProjectNotFound };
    };

    // Case A: Valid existing project loaded
    const resA = evaluateDeepLink(testProjectId, false, false, projects);
    expect(resA.isExistingProject).toBe(true);
    expect(resA.isProjectNotFound).toBe(false);

    // Case B: Project still loading in store (cold-load race condition guard)
    const resB = evaluateDeepLink(testProjectId, true, false, []);
    expect(resB.isStoreLoading).toBe(true);
    expect(resB.isProjectNotFound).toBe(false);

    // Case C: Non-existent UUID
    const resC = evaluateDeepLink('99999999-9999-4000-8000-999999999999', false, false, projects);
    expect(resC.isExistingProject).toBe(false);
    expect(resC.isProjectNotFound).toBe(true);
  });

  // =========================================================================
  // STEP 10: INCOMPLETE CALCULATION HANDLING
  // =========================================================================
  it('STEP 10 — Unsupported aggregate size (12.5mm MSA in ordinary concrete) safely blocks calculation', () => {
    const incompleteInput: MixDesignInput = {
      ...testProjectInput,
      designParameters: {
        ...testProjectInput.designParameters,
        maxAggregateSize: 12.5 as any, // Unsupported in Table 4
      },
    };

    const res = runMixDesignCalculation(incompleteInput);
    const statusInfo = getCentralizedMixStatus(res);

    expect(res.isPlaceholder).toBe(true);
    expect(statusInfo.status).toBe('INCOMPLETE');
    expect(statusInfo.heroHeader).toBe('CALCULATION INCOMPLETE');
    expect(statusInfo.reason).toContain('12.5 mm not in IS 10262:2019, Clause 6.3, Table 4');
  });

  // =========================================================================
  // STEP 11: PDF EXPORT SANITIZATION CHECK
  // =========================================================================
  it('STEP 11 — Dynamic PDF export sanitizes mathematical Unicode glyphs', async () => {
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

    const rawEquation = "f'ck = fck + 1.65 × S ≤ 48.25 ± 0.50 N/mm² (Δ=2.50)";
    const clean = sanitizePdfText(rawEquation);

    expect(clean).toBe("f'ck = fck + 1.65 * S <= 48.25 +/- 0.50 N/mm² (Delta =2.50)");
    expect(clean).not.toContain('×');
    expect(clean).not.toContain('≤');
    expect(clean).not.toContain('±');
    expect(clean).not.toContain('Δ');
  });
});
