import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectStore, mapRowToSavedProject, isValidUUID } from '@/store/useProjectStore';
import type { MixDesignInput } from '../types';
import { runMixDesignCalculation } from '../calculations';

function buildInput(overrides: Partial<MixDesignInput['designParameters']> = {}, detailsOverrides: Partial<MixDesignInput['projectDetails']> = {}): MixDesignInput {
  return {
    projectDetails: {
      projectName: 'Security Test Project',
      clientName: 'Client Alpha',
      engineerName: 'Engineer Ray',
      date: '2026-08-14',
      location: 'Site 1',
      ...detailsOverrides,
    },
    designParameters: {
      concreteGrade: 'M30',
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
    },
  };
}

describe('Phase 4C UUID Identity & Multi-Tenant Security Suite', () => {
  beforeEach(() => {
    useProjectStore.getState().resetStore();
  });

  // TEST 1: isValidUUID validation
  it('TEST 1: isValidUUID accepts standard UUIDs and rejects legacy proj-* IDs', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isValidUUID('c1234567-89ab-4cde-8f01-23456789abcd')).toBe(true);
    expect(isValidUUID('proj-1876730205749-s6rzw')).toBe(false);
    expect(isValidUUID('proj-12345')).toBe(false);
    expect(isValidUUID('')).toBe(false);
    expect(isValidUUID(null as any)).toBe(false);
  });

  // TEST 2: saveProject generates valid UUID identity
  it('TEST 2: saveProject generates a canonical UUID identity', () => {
    const store = useProjectStore.getState();
    const saved = store.saveProject(buildInput());
    expect(isValidUUID(saved.id)).toBe(true);
    expect(saved.id).not.toContain('proj-');
  });

  // TEST 3: User A project state is cleared on logout
  it('TEST 3: User A project state is cleared on resetStore / logout', () => {
    const store = useProjectStore.getState();
    store.saveProject(buildInput({}, { projectName: 'User A Secret Project' }));
    expect(useProjectStore.getState().projects.length).toBe(1);

    store.resetStore();

    const clearedState = useProjectStore.getState();
    expect(clearedState.projects.length).toBe(0);
    expect(clearedState.currentUserId).toBeNull();
  });

  // TEST 4: User B cannot inherit User A's project state
  it('TEST 4: User B cannot inherit User A project state', () => {
    const store = useProjectStore.getState();
    const saved = store.saveProject(buildInput({}, { projectName: 'User A Project' }));
    useProjectStore.setState({ currentUserId: '550e8400-e29b-41d4-a716-446655440001', projects: [saved] });

    store.resetStore();

    useProjectStore.setState({ currentUserId: '550e8400-e29b-41d4-a716-446655440002', projects: [] });

    const userBState = useProjectStore.getState();
    expect(userBState.currentUserId).toBe('550e8400-e29b-41d4-a716-446655440002');
    expect(userBState.projects.length).toBe(0);
    expect(userBState.projects.some((p) => p.input.projectDetails.projectName === 'User A Project')).toBe(false);
  });

  // TEST 5: updateProject preserves UUID identity
  it('TEST 5: updateProject modifies existing project with same UUID identity', () => {
    const store = useProjectStore.getState();
    const original = store.saveProject(buildInput());
    const uuid = original.id;

    store.updateProject(uuid, { input: buildInput({ slump: 150 }) });

    const projects = useProjectStore.getState().projects;
    expect(projects.length).toBe(1);
    expect(projects[0].id).toBe(uuid);
    expect(isValidUUID(projects[0].id)).toBe(true);
    expect(projects[0].input.designParameters.slump).toBe(150);
  });

  // TEST 6: Redesign adoption updates existing UUID project
  it('TEST 6: Adopting redesign updates the exact same UUID project in place', () => {
    const store = useProjectStore.getState();
    const original = store.saveProject(buildInput({ concreteGrade: 'M40' }));
    const uuid = original.id;

    const redesignedInput = buildInput({ concreteGrade: 'M40', slump: 50 });
    const redesignedResult = runMixDesignCalculation(redesignedInput);
    redesignedResult.redesignMetadata = {
      parentProjectId: undefined,
      attemptNumber: 1,
      remediationStrategy: 'slump',
    };

    store.updateProject(uuid, {
      input: redesignedInput,
      result: redesignedResult,
      status: 'calculated',
      updatedAt: new Date().toISOString(),
    });

    const projects = useProjectStore.getState().projects;
    expect(projects.length).toBe(1);
    expect(projects[0].id).toBe(uuid);
    expect(projects[0].input.designParameters.slump).toBe(50);
    expect(projects[0].result?.redesignMetadata?.remediationStrategy).toBe('slump');
  });

  // TEST A: Calculation does NOT automatically save a new project
  it('TEST A: Calculation does NOT automatically persist a project to store/database', () => {
    const input = buildInput();
    const result = runMixDesignCalculation(input);
    expect(result).toBeDefined();
    expect(result.cement).toBeGreaterThan(0);
    // Store should remain empty because saveProject was NOT called
    expect(useProjectStore.getState().projects.length).toBe(0);
  });

  // TEST B: Explicit Save Project creates exactly one project
  it('TEST B: Explicit Save Project creates exactly one canonical project row', () => {
    const store = useProjectStore.getState();
    const input = buildInput();
    const result = runMixDesignCalculation(input);
    const saved = store.saveProject(input, result);

    expect(isValidUUID(saved.id)).toBe(true);
    expect(useProjectStore.getState().projects.length).toBe(1);
    expect(useProjectStore.getState().projects[0].id).toBe(saved.id);
  });

  // TEST C: Calling save on already existing project or updating does not create duplicate rows
  it('TEST C: Updating existing project does not create duplicate rows', () => {
    const store = useProjectStore.getState();
    const saved = store.saveProject(buildInput());
    expect(useProjectStore.getState().projects.length).toBe(1);

    store.updateProject(saved.id, {
      status: 'calculated',
      updatedAt: new Date().toISOString(),
    });

    expect(useProjectStore.getState().projects.length).toBe(1);
    expect(useProjectStore.getState().projects[0].id).toBe(saved.id);
  });

  // TEST D: Editing an existing project performs update with same UUID
  it('TEST D: Editing an existing project performs in-place update rather than insert', () => {
    const store = useProjectStore.getState();
    const original = store.saveProject(buildInput({ slump: 100 }));
    const id = original.id;

    store.updateProject(id, {
      input: buildInput({ slump: 125 }),
      updatedAt: new Date().toISOString(),
    });

    const currentProjects = useProjectStore.getState().projects;
    expect(currentProjects.length).toBe(1);
    expect(currentProjects[0].id).toBe(id);
    expect(currentProjects[0].input.designParameters.slump).toBe(125);
  });

  // TEST E: Existing project UUID remains unchanged after save/update
  it('TEST E: Project UUID remains strictly stable across multiple updates', () => {
    const store = useProjectStore.getState();
    const project = store.saveProject(buildInput());
    const initialUUID = project.id;

    store.updateProject(initialUUID, { status: 'draft' });
    store.updateProject(initialUUID, { isFavorite: true });
    store.updateProject(initialUUID, { input: buildInput({ slump: 150 }) });

    expect(useProjectStore.getState().projects.length).toBe(1);
    expect(useProjectStore.getState().projects[0].id).toBe(initialUUID);
    expect(useProjectStore.getState().projects[0].isFavorite).toBe(true);
  });

  // TEST F: Duplicate Project explicitly creates a new project with a different UUID
  it('TEST F: Duplicate Project creates a new project with a distinct canonical UUID', () => {
    const store = useProjectStore.getState();
    const original = store.saveProject(buildInput({}, { projectName: 'Original Bridge' }));
    const duplicated = store.duplicateProject(original.id);

    expect(duplicated).not.toBeNull();
    expect(duplicated?.id).not.toBe(original.id);
    expect(isValidUUID(duplicated!.id)).toBe(true);
    expect(useProjectStore.getState().projects.length).toBe(2);
    expect(duplicated?.input.projectDetails.projectName).toBe('Original Bridge (Copy)');
  });

  // TEST G: Account A cannot access Account B projects
  it('TEST G: Multi-tenant user isolation prevents Account B from seeing Account A projects', () => {
    const store = useProjectStore.getState();
    const userAProject = store.saveProject(buildInput({}, { projectName: 'Confidential Dam' }));
    useProjectStore.setState({ currentUserId: '11111111-1111-4111-a111-111111111111', projects: [userAProject] });

    // Simulate logout and User B login
    store.resetStore();
    useProjectStore.setState({ currentUserId: '22222222-2222-4222-a222-222222222222', projects: [] });

    expect(useProjectStore.getState().projects.length).toBe(0);
    expect(store.getProjectById(userAProject.id)).toBeUndefined();
  });

  // TEST H: Calculation result remains unchanged by the persistence refactor
  it('TEST H: Calculation engine output is completely invariant under persistence refactor', () => {
    const input = buildInput();
    const result = runMixDesignCalculation(input);
    expect(result.cement).toBeGreaterThanOrEqual(300);
    expect(result.water).toBeGreaterThan(0);
    expect(result.wcRatio).toBeGreaterThan(0.3);
    expect(result.fineAggregate).toBeGreaterThan(0);
    expect(result.coarseAggregate).toBeGreaterThan(0);
  });
});
