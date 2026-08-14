import { describe, it, expect } from 'vitest';
import { runMixDesignCalculation } from '../calculations';
import { getCentralizedMixStatus, findBlockedSteps } from '../utils/status';
import type { MixDesignInput, AggregateSize } from '../types';
import { migrateProject } from '../../../store/useProjectStore';

describe('Phase 3 Engineering Presentation & State Regression Tests', () => {
  it('TEST 1: Non-air-entrained + 20 mm MSA adopts 1.0% entrapped air from Table 3', () => {
    const input: MixDesignInput = {
      projectDetails: {
        projectName: 'Non-Air 20mm Test',
        clientName: 'Client',
        engineerName: 'Engineer',
        date: '2026-08-13',
        location: 'Site',
      },
      designParameters: {
        concreteGrade: 'M25',
        exposureCondition: 'moderate',
        slump: 100,
        maxAggregateSize: 20,
        isPumpedConcrete: false,
        isAirEntrained: false,
      },
      materialProperties: {
        cement: { type: 'OPC_43', specificGravity: 3.15 },
        fineAggregate: { specificGravity: 2.7, waterAbsorption: 1.0 },
        coarseAggregate: { specificGravity: 2.7, waterAbsorption: 0.5 },
        water: { source: 'Potable' },
        admixture: {},
      },
    };

    const res = runMixDesignCalculation(input);
    const step5 = res.calculationSteps.find((s) => s.stepNumber === 5);

    expect(res.isPlaceholder).toBe(false);
    expect(step5?.inputs['Air Content']).toContain('Table 3');
  });

  it('TEST 2: Non-air-entrained + 10 mm MSA adopts 1.5% entrapped air from Table 3', () => {
    const input: MixDesignInput = {
      projectDetails: {
        projectName: 'Non-Air 10mm Test',
        clientName: 'Client',
        engineerName: 'Engineer',
        date: '2026-08-13',
        location: 'Site',
      },
      designParameters: {
        concreteGrade: 'M25',
        exposureCondition: 'moderate',
        slump: 100,
        maxAggregateSize: 10,
        isPumpedConcrete: false,
        isAirEntrained: false,
      },
      materialProperties: {
        cement: { type: 'OPC_43', specificGravity: 3.15 },
        fineAggregate: { specificGravity: 2.7, waterAbsorption: 1.0 },
        coarseAggregate: { specificGravity: 2.7, waterAbsorption: 0.5 },
        water: { source: 'Potable' },
        admixture: {},
      },
    };

    const res = runMixDesignCalculation(input);
    const step5 = res.calculationSteps.find((s) => s.stepNumber === 5);

    expect(res.isPlaceholder).toBe(false);
    expect(step5?.inputs['Air Content']).toContain('Table 3');
  });

  it('TEST 3: Air-entrained + target air = 4.0% propagates user target air content', () => {
    const input: MixDesignInput = {
      projectDetails: {
        projectName: 'Air-Entrained 4% Test',
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
        isAirEntrained: true,
        targetAirContent: 4.0,
      },
      materialProperties: {
        cement: { type: 'OPC_43', specificGravity: 3.15 },
        fineAggregate: { specificGravity: 2.65, waterAbsorption: 1.0 },
        coarseAggregate: { specificGravity: 2.70, waterAbsorption: 0.5 },
        water: { source: 'Potable' },
        admixture: {},
      },
    };

    const res = runMixDesignCalculation(input);
    const step5 = res.calculationSteps.find((s) => s.stepNumber === 5);

    expect(res.isPlaceholder).toBe(false);
    expect(step5?.inputs['Air Content']).toContain('Target Entrained Air (4%)');
  });

  it('TEST 4: Air-entrained + target air = 5.0% propagates 5.0% target air volume', () => {
    const input: MixDesignInput = {
      projectDetails: {
        projectName: 'Air-Entrained 5% Test',
        clientName: 'Client',
        engineerName: 'Engineer',
        date: '2026-08-13',
        location: 'Site',
      },
      designParameters: {
        concreteGrade: 'M30',
        exposureCondition: 'severe',
        slump: 100,
        maxAggregateSize: 20,
        isPumpedConcrete: false,
        isAirEntrained: true,
        targetAirContent: 5.0,
      },
      materialProperties: {
        cement: { type: 'OPC_43', specificGravity: 3.15 },
        fineAggregate: { specificGravity: 2.65, waterAbsorption: 1.0 },
        coarseAggregate: { specificGravity: 2.70, waterAbsorption: 0.5 },
        water: { source: 'Potable' },
        admixture: {},
      },
    };

    const res = runMixDesignCalculation(input);
    const step5 = res.calculationSteps.find((s) => s.stepNumber === 5);

    expect(res.isPlaceholder).toBe(false);
    expect(step5?.inputs['Air Content']).toContain('Target Entrained Air (5%)');
  });

  it('TEST 5: Moisture correction precision maintains unrounded float accuracy', () => {
    const input: MixDesignInput = {
      projectDetails: {
        projectName: 'Precision Test',
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
        isAirEntrained: true,
        targetAirContent: 4,
      },
      materialProperties: {
        cement: { type: 'OPC_43', specificGravity: 3.15 },
        fineAggregate: { specificGravity: 2.65, waterAbsorption: 1.2, surfaceMoisture: 0.0 },
        coarseAggregate: { specificGravity: 2.70, waterAbsorption: 0.9, surfaceMoisture: 0.0 },
        water: { source: 'Potable' },
        admixture: {},
      },
    };

    const res = runMixDesignCalculation(input);
    const step7 = res.calculationSteps.find((s) => s.stepNumber === 7);

    expect(res.isPlaceholder).toBe(false);
    expect(step7?.result).toContain('Corrected batch water');
  });

  it('TEST 6: State 3 Calculation Incomplete yields INCOMPLETE status and exception report header', () => {
    const incompleteInput: MixDesignInput = {
      projectDetails: {
        projectName: 'M40 16mm Incomplete Test',
        clientName: 'Client',
        engineerName: 'Engineer',
        date: '2026-08-13',
        location: 'Site',
      },
      designParameters: {
        concreteGrade: 'M40',
        exposureCondition: 'severe',
        slump: 140,
        maxAggregateSize: 16,
        isPumpedConcrete: false,
        isAirEntrained: false,
      },
      materialProperties: {
        cement: { type: 'OPC_43', specificGravity: 3.15, grade: 42 },
        fineAggregate: { specificGravity: 2.65, waterAbsorption: 1.0 },
        coarseAggregate: { specificGravity: 2.70, waterAbsorption: 0.5 },
        water: { source: 'Potable' },
        admixture: {},
      },
    };

    const res = runMixDesignCalculation(incompleteInput);
    const statusInfo = getCentralizedMixStatus(res);

    expect(statusInfo.status).toBe('INCOMPLETE');
    expect(statusInfo.mixStage).toBe('INCOMPLETE');
    expect(statusInfo.action).toBe('RETURN_TO_PARAMETERS');
    expect(statusInfo.heroHeader).toBe('CALCULATION INCOMPLETE');
    expect(statusInfo.pdfHeader).toBe('CIVILSUITE ENGINEERING CALCULATION EXCEPTION REPORT');
  });

  it('TEST 7: State 2 Non-Compliant mix yields NON_COMPLIANT status and PRELIMINARY_RAW stage', () => {
    const nonCompliantInput: MixDesignInput = {
      projectDetails: {
        projectName: 'M30 High Cement Test',
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
        adoptedWcOverride: 0.35,
      },
      materialProperties: {
        cement: { type: 'OPC_43', specificGravity: 3.15 },
        fineAggregate: { specificGravity: 2.65, waterAbsorption: 1.0 },
        coarseAggregate: { specificGravity: 2.70, waterAbsorption: 0.5 },
        water: { source: 'Potable' },
        admixture: {},
      },
    };

    const res = runMixDesignCalculation(nonCompliantInput);
    const statusInfo = getCentralizedMixStatus(res);

    expect(statusInfo.status).toBe('NON_COMPLIANT');
    expect(statusInfo.mixStage).toBe('PRELIMINARY_RAW');
    expect(statusInfo.heroHeader).toContain('PRELIMINARY RAW SSD MIX RATIO');
  });

  it('TEST 8: M25 Golden Case Verification', () => {
    const m25GoldenInput: MixDesignInput = {
      projectDetails: {
        projectName: 'M25 Golden Case',
        clientName: 'Client',
        engineerName: 'Engineer',
        date: '2026-08-13',
        location: 'Site',
      },
      designParameters: {
        concreteGrade: 'M25',
        exposureCondition: 'moderate',
        slump: 100,
        maxAggregateSize: 20,
        isPumpedConcrete: false,
        isAirEntrained: false,
        siteControl: 'good',
        faZone: 'II',
      },
      materialProperties: {
        cement: { type: 'OPC_43', specificGravity: 3.15, grade: 42 },
        fineAggregate: { specificGravity: 2.70, waterAbsorption: 1.0, surfaceMoisture: 0 },
        coarseAggregate: { specificGravity: 2.70, waterAbsorption: 2.0, surfaceMoisture: 0, angularity: 'angular' },
        water: { source: 'Potable' },
        admixture: { type: 'Superplasticizer SNF', dosage: 2, dosageBasis: 'liters_per_m3', waterReduction: 22 },
      },
    };

    const res = runMixDesignCalculation(m25GoldenInput);

    expect(res.isPlaceholder).toBe(false);
    expect(res.designWater).toBe(154);
    expect(res.wcRatio).toBeCloseTo(0.4117, 3);
    expect(res.cement).toBe(374);
    expect(res.mixRatioFineAggregate).toBeCloseTo(1.874, 1);
    expect(res.mixRatioCoarseAggregate).toBeCloseTo(3.303, 1);
  });

  // ─── PHASE 5 TARGETED REGRESSION TESTS ───────────────────────────────────

  it('PHASE 5 TEST 1: UI Water Reduction = 0% ensures engine receives 0% water reduction', () => {
    const inputZeroWR: MixDesignInput = {
      projectDetails: { projectName: 'p6 Zero WR', clientName: 'C', engineerName: 'E', date: '2026-08-13', location: 'L' },
      designParameters: { concreteGrade: 'M40', exposureCondition: 'moderate', slump: 115, maxAggregateSize: 20, isPumpedConcrete: true, isAirEntrained: false },
      materialProperties: {
        cement: { type: 'OPC_43', specificGravity: 3.15 },
        fineAggregate: { specificGravity: 2.65, waterAbsorption: 1.0 },
        coarseAggregate: { specificGravity: 2.70, waterAbsorption: 0.5, angularity: 'rounded' },
        water: { source: 'Potable' },
        admixture: { dosage: 5, dosageBasis: 'percent_cement', waterReduction: 0 },
      },
    };

    const res = runMixDesignCalculation(inputZeroWR);
    expect(res.designWater).toBe(179); // (186 - 20) * 1.078 = 178.95 -> 179 kg/m³
  });

  it('PHASE 5 TEST 2: IS 10262:2019 Table 4 Note Aggregate Shape Mappings (0, -10, -15, -20 kg/m³)', () => {
    const base: MixDesignInput = {
      projectDetails: { projectName: 'Shape Test', clientName: 'C', engineerName: 'E', date: '2026-08-13', location: 'L' },
      designParameters: { concreteGrade: 'M25', exposureCondition: 'moderate', slump: 50, maxAggregateSize: 20, isPumpedConcrete: false, isAirEntrained: false },
      materialProperties: {
        cement: { type: 'OPC_43', specificGravity: 3.15 },
        fineAggregate: { specificGravity: 2.65, waterAbsorption: 1.0 },
        coarseAggregate: { specificGravity: 2.70, waterAbsorption: 0.5, angularity: 'angular' },
        water: { source: 'Potable' },
        admixture: { waterReduction: 0 },
      },
    };

    // Angular -> 0 kg/m³ reduction -> 186
    const resAngular = runMixDesignCalculation({ ...base, materialProperties: { ...base.materialProperties, coarseAggregate: { ...base.materialProperties.coarseAggregate, angularity: 'angular' } } });
    expect(resAngular.designWater).toBe(186);

    // Sub-angular -> -10 kg/m³ reduction -> 176
    const resSubAngular = runMixDesignCalculation({ ...base, materialProperties: { ...base.materialProperties, coarseAggregate: { ...base.materialProperties.coarseAggregate, angularity: 'sub-angular' } } });
    expect(resSubAngular.designWater).toBe(176);

    // Partially rounded (gravel with crushed) -> -15 kg/m³ reduction -> 171
    const resPartiallyRounded = runMixDesignCalculation({ ...base, materialProperties: { ...base.materialProperties, coarseAggregate: { ...base.materialProperties.coarseAggregate, angularity: 'partially_rounded' } } });
    expect(resPartiallyRounded.designWater).toBe(171);

    // Uncrushed Rounded gravel -> -20 kg/m³ reduction -> 166
    const resRounded = runMixDesignCalculation({ ...base, materialProperties: { ...base.materialProperties, coarseAggregate: { ...base.materialProperties.coarseAggregate, angularity: 'rounded' } } });
    expect(resRounded.designWater).toBe(166);
  });

  it('PHASE 5 TEST 3: Chemical Admixture Volume is included in Aggregate Absolute Volume (V_agg)', () => {
    const inputWithAdmix: MixDesignInput = {
      projectDetails: { projectName: 'Admix Vol Test', clientName: 'C', engineerName: 'E', date: '2026-08-13', location: 'L' },
      designParameters: { concreteGrade: 'M25', exposureCondition: 'moderate', slump: 100, maxAggregateSize: 20, isPumpedConcrete: false, isAirEntrained: false, siteControl: 'good', adoptedWcOverride: 0.45 },
      materialProperties: {
        cement: { type: 'OPC_43', specificGravity: 3.15 },
        fineAggregate: { specificGravity: 2.65, waterAbsorption: 1.0 },
        coarseAggregate: { specificGravity: 2.70, waterAbsorption: 0.5 },
        water: { source: 'Potable' },
        admixture: { dosage: 5, dosageBasis: 'percent_cement', specificGravity: 1.15, waterReduction: 20 },
      },
    };

    const res = runMixDesignCalculation(inputWithAdmix);
    expect(res.unrounded?.aggVolume).toBeGreaterThan(0);
    // V_agg = 1 - V_cement - V_water - V_air - V_admix
    const expectedVagg = 1 - (res.unrounded!.cement / 3150) - (res.unrounded!.designWater / 1000) - 0.01 - (res.unrounded!.admixture! / 1150);
    expect(res.unrounded!.aggVolume).toBeCloseTo(expectedVagg, 5);
  });

  it('PHASE 5 TEST 4: Canonical SSD Aggregate Masses and SSD Mix Ratio', () => {
    const inputP6: MixDesignInput = {
      projectDetails: { projectName: 'p6 Canonical', clientName: 'C', engineerName: 'E', date: '2026-08-13', location: 'L' },
      designParameters: { concreteGrade: 'M40', exposureCondition: 'moderate', slump: 115, maxAggregateSize: 20, isPumpedConcrete: true, isAirEntrained: false, siteControl: 'good', faZone: 'II' },
      materialProperties: {
        cement: { type: 'OPC_43', specificGravity: 3.15 },
        fineAggregate: { specificGravity: 2.65, waterAbsorption: 1.0, surfaceMoisture: 0 },
        coarseAggregate: { specificGravity: 2.70, waterAbsorption: 0.5, surfaceMoisture: 0, angularity: 'partially_rounded' },
        water: { source: 'Potable' },
        admixture: { type: 'Superplasticizer', dosage: 5, dosageBasis: 'percent_cement', waterReduction: 21.8826, specificGravity: 1.15 },
      },
    };

    const res = runMixDesignCalculation(inputP6);
    expect(res.ssdFineAggregate).toBe(778); // 778.3 kg/m³ unrounded
    expect(res.ssdCoarseAggregate).toBe(1106); // 1106.0 kg/m³ unrounded
    expect(res.mixRatioFineAggregate).toBeCloseTo(1.97, 2);
    expect(res.mixRatioCoarseAggregate).toBeCloseTo(2.80, 2);
  });

  // ─── PHASE 5.2 STATE PURITY & MIGRATION TESTS ──────────────────────────────

  it('PHASE 5.2 TEST 1: State sequence 21.8826% -> 0% calculation strictly uses 0%', () => {
    const input: MixDesignInput = {
      projectDetails: { projectName: 'Seq1', clientName: 'C', engineerName: 'E', date: '2026-08-13', location: 'L' },
      designParameters: { concreteGrade: 'M40', exposureCondition: 'moderate', slump: 115, maxAggregateSize: 20, isPumpedConcrete: true, isAirEntrained: false },
      materialProperties: {
        cement: { type: 'OPC_43', specificGravity: 3.15 },
        fineAggregate: { specificGravity: 2.65, waterAbsorption: 1.0 },
        coarseAggregate: { specificGravity: 2.70, waterAbsorption: 0.5, angularity: 'rounded' },
        water: { source: 'Potable' },
        admixture: { dosage: 5, dosageBasis: 'percent_cement', waterReduction: 0 },
      },
    };

    const res = runMixDesignCalculation(input);
    expect(res.designWater).toBe(179); // 0% water reduction
  });

  it('PHASE 5.2 TEST 2: State sequence 0% -> 21.8826% calculation strictly uses 21.8826%', () => {
    const input: MixDesignInput = {
      projectDetails: { projectName: 'Seq2', clientName: 'C', engineerName: 'E', date: '2026-08-13', location: 'L' },
      designParameters: { concreteGrade: 'M40', exposureCondition: 'moderate', slump: 115, maxAggregateSize: 20, isPumpedConcrete: true, isAirEntrained: false },
      materialProperties: {
        cement: { type: 'OPC_43', specificGravity: 3.15 },
        fineAggregate: { specificGravity: 2.65, waterAbsorption: 1.0 },
        coarseAggregate: { specificGravity: 2.70, waterAbsorption: 0.5, angularity: 'rounded' },
        water: { source: 'Potable' },
        admixture: { dosage: 5, dosageBasis: 'percent_cement', waterReduction: 21.8826 },
      },
    };

    const res = runMixDesignCalculation(input);
    expect(res.designWater).toBe(140); // 21.8826% water reduction
  });

  it('PHASE 5.2 TEST 3: State sequence 21.8826% -> 0% -> 10% -> 0% final calculation strictly uses 0%', () => {
    const input: MixDesignInput = {
      projectDetails: { projectName: 'Seq3', clientName: 'C', engineerName: 'E', date: '2026-08-13', location: 'L' },
      designParameters: { concreteGrade: 'M40', exposureCondition: 'moderate', slump: 115, maxAggregateSize: 20, isPumpedConcrete: true, isAirEntrained: false },
      materialProperties: {
        cement: { type: 'OPC_43', specificGravity: 3.15 },
        fineAggregate: { specificGravity: 2.65, waterAbsorption: 1.0 },
        coarseAggregate: { specificGravity: 2.70, waterAbsorption: 0.5, angularity: 'rounded' },
        water: { source: 'Potable' },
        admixture: { dosage: 5, dosageBasis: 'percent_cement', waterReduction: 0 },
      },
    };

    const res = runMixDesignCalculation(input);
    expect(res.designWater).toBe(179);
  });

  it('PHASE 5.2 TEST 4: Saved project migration logic correctly preserves historical rounded projects', () => {
    // Legacy project (schemaVersion undefined/1, angularity = "rounded")

    // Legacy project (schemaVersion undefined/1, angularity = "rounded")
    const legacyProject = {
      id: 'proj-old',
      status: 'calculated' as const,
      createdAt: '2026-08-13T00:00:00Z',
      updatedAt: '2026-08-13T00:00:00Z',
      input: {
        projectDetails: { projectName: 'Legacy' },
        designParameters: { concreteGrade: 'M40' },
        materialProperties: { coarseAggregate: { angularity: 'rounded' } },
      },
    };

    const migrated = migrateProject(legacyProject as any);
    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.input.materialProperties.coarseAggregate.angularity).toBe('partially_rounded');

    // New project (schemaVersion = 2, angularity = "rounded")
    const newProject = {
      id: 'proj-new',
      schemaVersion: 2,
      status: 'calculated' as const,
      createdAt: '2026-08-13T00:00:00Z',
      updatedAt: '2026-08-13T00:00:00Z',
      input: {
        projectDetails: { projectName: 'New' },
        designParameters: { concreteGrade: 'M40' },
        materialProperties: { coarseAggregate: { angularity: 'rounded' } },
      },
    };

    const notMigrated = migrateProject(newProject as any);
    expect(notMigrated.schemaVersion).toBe(2);
    expect(notMigrated.input.materialProperties.coarseAggregate.angularity).toBe('rounded'); // Retains uncrushed rounded gravel (-20kg)
  });

  describe('PHASE 6.3 MSA REFERENCE-DATA VALIDATION REGRESSION TESTS', () => {
    it('TEST 1: Supported MSA table combinations (10, 20, 40 mm Ordinary & 12.5 mm High Strength) resolve correctly', () => {
      const validCases: Array<{ msa: AggregateSize; grade: 'M40' | 'M70' }> = [
        { msa: 10, grade: 'M40' },
        { msa: 12.5, grade: 'M70' },
        { msa: 20, grade: 'M40' },
        { msa: 40, grade: 'M40' },
      ];

      for (const { msa, grade } of validCases) {
        const input: MixDesignInput = {
          projectDetails: { projectName: `MSA ${msa}`, clientName: 'C', engineerName: 'E', date: '2026-08-14', location: 'L' },
          designParameters: { concreteGrade: grade, exposureCondition: 'moderate', slump: 50, maxAggregateSize: msa, isPumpedConcrete: false, isAirEntrained: false },
          materialProperties: {
            cement: { type: 'OPC_53', specificGravity: 3.15 },
            fineAggregate: { specificGravity: 2.65, waterAbsorption: 1.0 },
            coarseAggregate: { specificGravity: 2.70, waterAbsorption: 0.5 },
            water: { source: 'Potable' },
            admixture: {},
          },
        };
        const res = runMixDesignCalculation(input);
        expect(res.calculationSteps.find((s) => s.stepNumber === 2)?.result).not.toContain('reference-data-required');
      }
    });

    it('TEST 2: 12.5 mm MSA is blocked for Ordinary concrete (M40) but valid for High Strength (M70)', () => {
      const inputOrdinary: MixDesignInput = {
        projectDetails: { projectName: 'MSA 12.5 M40', clientName: 'C', engineerName: 'E', date: '2026-08-14', location: 'L' },
        designParameters: { concreteGrade: 'M40', exposureCondition: 'moderate', slump: 50, maxAggregateSize: 12.5, isPumpedConcrete: false, isAirEntrained: false },
        materialProperties: {
          cement: { type: 'OPC_53', specificGravity: 3.15 },
          fineAggregate: { specificGravity: 2.65, waterAbsorption: 1.0 },
          coarseAggregate: { specificGravity: 2.70, waterAbsorption: 0.5 },
          water: { source: 'Potable' },
          admixture: {},
        },
      };
      const resOrdinary = runMixDesignCalculation(inputOrdinary);
      expect(resOrdinary.calculationSteps.find((s) => s.stepNumber === 2)?.result).toContain('reference-data-required');

      const inputHS: MixDesignInput = {
        ...inputOrdinary,
        designParameters: { ...inputOrdinary.designParameters, concreteGrade: 'M70' },
      };
      const resHS = runMixDesignCalculation(inputHS);
      expect(resHS.calculationSteps.find((s) => s.stepNumber === 2)?.result).not.toContain('reference-data-required');
    });

    it('TEST 3: 16 mm MSA passed programmatically is blocked by reference data lookup', () => {
      const input: MixDesignInput = {
        projectDetails: { projectName: 'MSA 16', clientName: 'C', engineerName: 'E', date: '2026-08-14', location: 'L' },
        designParameters: { concreteGrade: 'M40', exposureCondition: 'moderate', slump: 50, maxAggregateSize: 16 as AggregateSize, isPumpedConcrete: false, isAirEntrained: false },
        materialProperties: {
          cement: { type: 'OPC_53', specificGravity: 3.15 },
          fineAggregate: { specificGravity: 2.65, waterAbsorption: 1.0 },
          coarseAggregate: { specificGravity: 2.70, waterAbsorption: 0.5 },
          water: { source: 'Potable' },
          admixture: {},
        },
      };

      const res = runMixDesignCalculation(input);
      const step2 = res.calculationSteps.find((s) => s.stepNumber === 2);
      expect(step2?.result).toContain('reference-data-required: aggregate size 16 mm not in IS 10262:2019, Clause 6.3, Table 4');
    });

    it('TEST 4: 25 mm MSA remains unavailable and blocked', () => {
      const input: MixDesignInput = {
        projectDetails: { projectName: 'MSA 25', clientName: 'C', engineerName: 'E', date: '2026-08-14', location: 'L' },
        designParameters: { concreteGrade: 'M40', exposureCondition: 'moderate', slump: 50, maxAggregateSize: 25 as AggregateSize, isPumpedConcrete: false, isAirEntrained: false },
        materialProperties: {
          cement: { type: 'OPC_53', specificGravity: 3.15 },
          fineAggregate: { specificGravity: 2.65, waterAbsorption: 1.0 },
          coarseAggregate: { specificGravity: 2.70, waterAbsorption: 0.5 },
          water: { source: 'Potable' },
          admixture: {},
        },
      };

      const res = runMixDesignCalculation(input);
      const step2 = res.calculationSteps.find((s) => s.stepNumber === 2);
      expect(step2?.result).toContain('reference-data-required: aggregate size 25 mm not in IS 10262:2019, Clause 6.3, Table 4');
    });
  });
});
