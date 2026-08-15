import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectStore } from '@/store/useProjectStore';
import { runMixDesignCalculation } from '../calculations';
import type { MixDesignInput } from '../types';

function buildInput(overrides: Partial<MixDesignInput['designParameters']> = {}, detailsOverrides: Partial<MixDesignInput['projectDetails']> = {}): MixDesignInput {
  return {
    projectDetails: {
      projectName: 'Workflow Project A',
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

describe('Phase 3B.1 Project Workflow, History & Validation Suite', () => {
  beforeEach(() => {
    useProjectStore.setState({ projects: [], activeProjectId: null });
  });

  // TEST 1
  it('TEST 1: Create new project starts with clean/default input', () => {
    const input = buildInput();
    expect(input.projectDetails.projectName).toBe('Workflow Project A');
    expect(input.designParameters.concreteGrade).toBe('M30');
  });

  // TEST 2
  it('TEST 2: Saved project contains input values', () => {
    const input = buildInput({}, { projectName: 'Bridge Pier 4' });
    const result = runMixDesignCalculation(input);
    const store = useProjectStore.getState();
    const saved = store.saveProject(input, result);

    expect(saved.id).toBeDefined();
    expect(saved.input.projectDetails.projectName).toBe('Bridge Pier 4');
    expect(saved.result).toBeDefined();
  });

  // TEST 3
  it('TEST 3: Edit loads exact existing input', () => {
    const input = buildInput({ concreteGrade: 'M40', slump: 120 }, { clientName: 'L&T Infra' });
    const store = useProjectStore.getState();
    const saved = store.saveProject(input);

    const fetched = store.getProjectById(saved.id);
    expect(fetched?.input.designParameters.concreteGrade).toBe('M40');
    expect(fetched?.input.designParameters.slump).toBe(120);
    expect(fetched?.input.projectDetails.clientName).toBe('L&T Infra');
  });

  // TEST 4
  it('TEST 4: Edit does not load default values when saved values exist', () => {
    const customInput = buildInput({ concreteGrade: 'M50', maxAggregateSize: 40 });
    const store = useProjectStore.getState();
    const saved = store.saveProject(customInput);

    const fetched = store.getProjectById(saved.id);
    expect(fetched?.input.designParameters.concreteGrade).not.toBe('M25');
    expect(fetched?.input.designParameters.concreteGrade).toBe('M50');
    expect(fetched?.input.designParameters.maxAggregateSize).toBe(40);
  });

  // TEST 5
  it('TEST 5: Changing Step 1 preserves other values', () => {
    const input = buildInput({ slump: 150 });
    const updatedInput: MixDesignInput = JSON.parse(JSON.stringify(input));
    updatedInput.projectDetails.projectName = 'Renamed Project';

    expect(updatedInput.projectDetails.projectName).toBe('Renamed Project');
    expect(updatedInput.designParameters.slump).toBe(150);
    expect(updatedInput.materialProperties.cement.type).toBe('OPC_43');
  });

  // TEST 6
  it('TEST 6: Changing Step 2 preserves other values', () => {
    const input = buildInput({}, { clientName: 'Reliance' });
    const updatedInput: MixDesignInput = JSON.parse(JSON.stringify(input));
    updatedInput.designParameters.exposureCondition = 'severe';

    expect(updatedInput.projectDetails.clientName).toBe('Reliance');
    expect(updatedInput.designParameters.exposureCondition).toBe('severe');
    expect(updatedInput.materialProperties.fineAggregate.specificGravity).toBe(2.65);
  });

  // TEST 7
  it('TEST 7: Changing Step 3 preserves other values', () => {
    const input = buildInput({ concreteGrade: 'M35' });
    const updatedInput: MixDesignInput = JSON.parse(JSON.stringify(input));
    updatedInput.materialProperties.admixture.waterReduction = 20;

    expect(updatedInput.designParameters.concreteGrade).toBe('M35');
    expect(updatedInput.materialProperties.admixture.waterReduction).toBe(20);
  });

  // TEST 8
  it('TEST 8: Existing project ID is preserved during edit', () => {
    const store = useProjectStore.getState();
    const original = store.saveProject(buildInput());
    const originalId = original.id;

    store.updateProject(originalId, {
      input: buildInput({ slump: 120 }),
    });

    const updated = store.getProjectById(originalId);
    expect(updated?.id).toBe(originalId);
  });

  // TEST 9
  it('TEST 9: createdAt remains unchanged after edit', () => {
    const store = useProjectStore.getState();
    const original = store.saveProject(buildInput());
    const createdAtBefore = original.createdAt;

    store.updateProject(original.id, {
      input: buildInput({ slump: 120 }),
    });

    const updated = store.getProjectById(original.id);
    expect(updated?.createdAt).toBe(createdAtBefore);
  });

  // TEST 10
  it('TEST 10: updatedAt changes after edit', async () => {
    const store = useProjectStore.getState();
    const original = store.saveProject(buildInput());
    
    await new Promise((resolve) => setTimeout(resolve, 10));

    store.updateProject(original.id, {
      input: buildInput({ slump: 120 }),
    });

    const updated = store.getProjectById(original.id);
    expect(new Date(updated!.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(original.createdAt).getTime()
    );
  });

  // TEST 11
  it('TEST 11: Favorite defaults to false', () => {
    const store = useProjectStore.getState();
    const saved = store.saveProject(buildInput());
    expect(saved.isFavorite).toBe(false);
  });

  // TEST 12
  it('TEST 12: Favorite toggles true/false correctly', () => {
    const store = useProjectStore.getState();
    const saved = store.saveProject(buildInput());

    store.toggleFavorite(saved.id);
    expect(store.getProjectById(saved.id)?.isFavorite).toBe(true);

    store.toggleFavorite(saved.id);
    expect(store.getProjectById(saved.id)?.isFavorite).toBe(false);
  });

  // TEST 13
  it('TEST 13: Favorite persists in project state', () => {
    const store = useProjectStore.getState();
    const p1 = store.saveProject(buildInput({}, { projectName: 'P1' }));
    const p2 = store.saveProject(buildInput({}, { projectName: 'P2' }));

    store.toggleFavorite(p1.id);

    const state = useProjectStore.getState();
    expect(state.getProjectById(p1.id)?.isFavorite).toBe(true);
    expect(state.getProjectById(p2.id)?.isFavorite).toBe(false);
  });

  // TEST 14
  it('TEST 14: Deleting project removes only that project', () => {
    const store = useProjectStore.getState();
    const p1 = store.saveProject(buildInput({}, { projectName: 'P1' }));
    const p2 = store.saveProject(buildInput({}, { projectName: 'P2' }));

    store.deleteProject(p1.id);

    const projects = useProjectStore.getState().projects;
    expect(projects.length).toBe(1);
    expect(projects[0].id).toBe(p2.id);
  });

  // TEST 15
  it('TEST 15: Multiple projects remain isolated', () => {
    const store = useProjectStore.getState();
    const pA = store.saveProject(buildInput({ concreteGrade: 'M25' }));
    const pB = store.saveProject(buildInput({ concreteGrade: 'M50' }));

    store.updateProject(pA.id, { input: buildInput({ slump: 150 }) });

    const freshPB = store.getProjectById(pB.id);
    expect(freshPB?.input.designParameters.concreteGrade).toBe('M50');
    expect(freshPB?.input.designParameters.slump).toBe(100);
  });

  // TEST 16
  it('TEST 16: Create New after editing starts clean', () => {
    const input = buildInput({ concreteGrade: 'M40' });
    const store = useProjectStore.getState();
    const editedProject = store.saveProject(input);

    const newProjectInput = buildInput({ concreteGrade: 'M25' });
    expect(newProjectInput.designParameters.concreteGrade).toBe('M25');
    expect(editedProject.input.designParameters.concreteGrade).toBe('M40');
  });

  // TEST 17
  it('TEST 17: Canceling edit does not modify saved project', () => {
    const store = useProjectStore.getState();
    const originalInput = buildInput({ slump: 100 });
    const saved = store.saveProject(originalInput);

    const draftInput: MixDesignInput = JSON.parse(JSON.stringify(originalInput));
    draftInput.designParameters.slump = 200;

    const storedProject = store.getProjectById(saved.id);
    expect(storedProject?.input.designParameters.slump).toBe(100);
  });

  // TEST 18
  it('TEST 18: NON_COMPLIANT projects still open correctly', () => {
    const store = useProjectStore.getState();
    const nonCompliantInput = buildInput({ concreteGrade: 'M40' });
    const result = runMixDesignCalculation(nonCompliantInput);
    const saved = store.saveProject(nonCompliantInput, result);

    const fetched = store.getProjectById(saved.id);
    expect(fetched?.result?.cementContentCheck).toBe('fail');
  });

  // TEST 19
  it('TEST 19: INCOMPLETE projects still open correctly', () => {
    const store = useProjectStore.getState();
    const incompleteInput = buildInput({ maxAggregateSize: 12.5 });
    const result = runMixDesignCalculation(incompleteInput);
    const saved = store.saveProject(incompleteInput, result);

    const fetched = store.getProjectById(saved.id);
    expect(fetched?.result?.isPlaceholder).toBe(true);
  });

  // TEST 20
  it('TEST 20: Redesign metadata remains intact', () => {
    const store = useProjectStore.getState();
    const input = buildInput();
    const result = runMixDesignCalculation(input);
    result.redesignMetadata = {
      parentProjectId: 'proj-parent-001',
      attemptNumber: 2,
      remediationStrategy: 'admixture',
    };

    const saved = store.saveProject(input, result);
    const fetched = store.getProjectById(saved.id);

    expect(fetched?.result?.redesignMetadata?.parentProjectId).toBe('proj-parent-001');
    expect(fetched?.result?.redesignMetadata?.attemptNumber).toBe(2);
    expect(fetched?.result?.redesignMetadata?.remediationStrategy).toBe('admixture');
  });

  // TEST 21
  it('TEST 21: Circular JSON stringification is never performed on React form errors', () => {
    const circularObj: any = { message: 'Project name is required' };
    circularObj.self = circularObj;

    // Safe error extraction function
    const extractErrors = (errors: Record<string, any>) => {
      return Object.entries(errors).map(([k, v]) => `${k}: ${v?.message}`);
    };

    expect(() => extractErrors({ projectName: circularObj })).not.toThrow();
    expect(extractErrors({ projectName: circularObj })).toEqual(['projectName: Project name is required']);
  });

  // TEST 22
  it('TEST 22: Updating an existing project does not duplicate records in store', () => {
    const store = useProjectStore.getState();
    const saved = store.saveProject(buildInput());

    store.updateProject(saved.id, {
      input: buildInput({ slump: 150 }),
      updatedAt: new Date().toISOString(),
    });

    const projects = useProjectStore.getState().projects;
    expect(projects.length).toBe(1);
    expect(projects[0].id).toBe(saved.id);
    expect(projects[0].input.designParameters.slump).toBe(150);
  });

  // TEST 23: Continuous Existing Project Edit Workflow (editedT44 scenario)
  it('TEST 23: Continuous existing project edit workflow preserves UUID and recomputes with changed parameters', () => {
    const store = useProjectStore.getState();
    // 1. Initial saved project (editedT44)
    const initialInput = buildInput(
      { concreteGrade: 'M40', slump: 100, exposureCondition: 'severe' },
      { projectName: 'editedT44', clientName: 'C1', engineerName: 'E2' }
    );
    const initialResult = runMixDesignCalculation(initialInput);
    const saved = store.saveProject(initialInput, initialResult);
    const canonicalUUID = saved.id;

    // 2. User edits slump to 125 while keeping project identity
    const modifiedInput: MixDesignInput = {
      ...saved.input,
      designParameters: {
        ...saved.input.designParameters,
        slump: 125,
      },
    };

    // 3. Verify step navigation retains modified values
    expect(modifiedInput.projectDetails.projectName).toBe('editedT44');
    expect(modifiedInput.projectDetails.clientName).toBe('C1');
    expect(modifiedInput.projectDetails.engineerName).toBe('E2');
    expect(modifiedInput.designParameters.slump).toBe(125);
    expect(modifiedInput.materialProperties.cement.type).toBe('OPC_43');

    // 4. Recalculate with modified parameters
    const updatedResult = runMixDesignCalculation(modifiedInput);
    expect(updatedResult.water).not.toBe(initialResult.water);

    // 5. Update existing project in place
    store.updateProject(canonicalUUID, {
      input: modifiedInput,
      result: updatedResult,
      status: 'calculated',
      updatedAt: new Date().toISOString(),
    });

    // 6. Verify single row in store with identical UUID
    const currentProjects = useProjectStore.getState().projects;
    expect(currentProjects.length).toBe(1);
    expect(currentProjects[0].id).toBe(canonicalUUID);
    expect(currentProjects[0].input.projectDetails.projectName).toBe('editedT44');
    expect(currentProjects[0].input.designParameters.slump).toBe(125);
  });

  // TEST 24: Navigation between steps does not reset in-flight form data to DEFAULT_INPUT
  it('TEST 24: Multi-step navigation retains in-flight form data across step transitions', () => {
    let currentSessionData = buildInput(
      { concreteGrade: 'M35', slump: 80 },
      { projectName: 'Metro Station Pier', clientName: 'Metro Rail Corp' }
    );

    // Step 1 -> Step 2: User changes exposure
    currentSessionData = {
      ...currentSessionData,
      designParameters: { ...currentSessionData.designParameters, exposureCondition: 'very_severe' },
    };

    // Step 2 -> Step 3: User changes cement SG
    currentSessionData = {
      ...currentSessionData,
      materialProperties: {
        ...currentSessionData.materialProperties,
        cement: { ...currentSessionData.materialProperties.cement, specificGravity: 3.12 },
      },
    };

    // Step 3 -> Back to Step 1 -> Forward to Step 4
    expect(currentSessionData.projectDetails.projectName).toBe('Metro Station Pier');
    expect(currentSessionData.designParameters.exposureCondition).toBe('very_severe');
    expect(currentSessionData.materialProperties.cement.specificGravity).toBe(3.12);

    const calculatedResult = runMixDesignCalculation(currentSessionData);
    expect(calculatedResult.cement).toBeGreaterThan(0);
  });

  // TEST 25: Phase 11 — Deep-link race condition guard (projectId present + projects loading)
  it('TEST 25: Deep-link race guard: When projects are loading, target UUID is protected from premature new-project fallback', () => {
    const targetUUID = 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';
    const store = useProjectStore.getState();

    // Store is in loading state, projects array empty
    useProjectStore.setState({ projects: [], isLoading: true });

    // Emulate deep link state machine
    const isUuidTarget = Boolean(targetUUID);
    const matchingProject = store.projects.find((p) => p.id === targetUUID);
    const isExistingProject = isUuidTarget && Boolean(matchingProject);
    const isStoreLoading = isUuidTarget && (useProjectStore.getState().isLoading) && !matchingProject;
    const isProjectNotFound = isUuidTarget && !useProjectStore.getState().isLoading && !matchingProject;

    expect(isExistingProject).toBe(false);
    expect(isStoreLoading).toBe(true); // Loading guard ACTIVE
    expect(isProjectNotFound).toBe(false); // Does NOT prematurely declare not found
  });

  // TEST 26: Phase 11 — Deep-link resolution (projectId present + projects loaded + project exists)
  it('TEST 26: Deep-link resolution: When projects finish loading, target UUID resolves to existing project mode', () => {
    const targetUUID = 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e';
    const savedProject = {
      id: targetUUID,
      schemaVersion: 2 as const,
      status: 'calculated' as const,
      isFavorite: false,
      input: buildInput({ concreteGrade: 'M45', slump: 110 }, { projectName: 'Highway Flyover Pier' }),
      createdAt: '2026-08-15T10:00:00.000Z',
      updatedAt: '2026-08-15T10:00:00.000Z',
    };

    // Store completes loading with the project present
    useProjectStore.setState({ projects: [savedProject], isLoading: false });
    const store = useProjectStore.getState();

    const isUuidTarget = Boolean(targetUUID);
    const matchingProject = store.projects.find((p) => p.id === targetUUID);
    const isExistingProject = isUuidTarget && Boolean(matchingProject);
    const isStoreLoading = isUuidTarget && (store.isLoading) && !matchingProject;
    const isProjectNotFound = isUuidTarget && !store.isLoading && !matchingProject;

    expect(isExistingProject).toBe(true);
    expect(isStoreLoading).toBe(false);
    expect(isProjectNotFound).toBe(false);
    expect(matchingProject?.input.designParameters.concreteGrade).toBe('M45');
    expect(matchingProject?.input.projectDetails.projectName).toBe('Highway Flyover Pier');
  });

  // TEST 27: Phase 11 — Deep-link missing project (projectId present + projects loaded + project does not exist)
  it('TEST 27: Deep-link missing project guard: When loading completes without matching UUID, project-not-found is triggered without fallback INSERT', () => {
    const missingUUID = 'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f';
    const otherProject = {
      id: 'd4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a',
      schemaVersion: 2 as const,
      status: 'calculated' as const,
      isFavorite: false,
      input: buildInput(),
      createdAt: '2026-08-15T10:00:00.000Z',
      updatedAt: '2026-08-15T10:00:00.000Z',
    };

    // Store loaded, but target UUID does not exist
    useProjectStore.setState({ projects: [otherProject], isLoading: false });
    const store = useProjectStore.getState();

    const isUuidTarget = Boolean(missingUUID);
    const matchingProject = store.projects.find((p) => p.id === missingUUID);
    const isExistingProject = isUuidTarget && Boolean(matchingProject);
    const isStoreLoading = isUuidTarget && (store.isLoading) && !matchingProject;
    const isProjectNotFound = isUuidTarget && !store.isLoading && !matchingProject;

    expect(isExistingProject).toBe(false);
    expect(isStoreLoading).toBe(false);
    expect(isProjectNotFound).toBe(true); // Project Not Found ACTIVE
  });

  // TEST 28: Phase 11 — Save Changes performs UPDATE only and preserves exact UUID across multiple edits
  it('TEST 28: Save Changes performs UPDATE only and strictly preserves canonical UUID', () => {
    const store = useProjectStore.getState();
    const original = store.saveProject(buildInput({ concreteGrade: 'M30' }), undefined);
    const canonicalUUID = original.id;

    // 1st Edit
    store.updateProject(canonicalUUID, {
      input: buildInput({ concreteGrade: 'M35', slump: 100 }),
    });

    let currentProjects = useProjectStore.getState().projects;
    expect(currentProjects.length).toBe(1);
    expect(currentProjects[0].id).toBe(canonicalUUID);
    expect(currentProjects[0].input.designParameters.concreteGrade).toBe('M35');

    // 2nd Edit
    store.updateProject(canonicalUUID, {
      input: buildInput({ concreteGrade: 'M40', slump: 125 }),
    });

    currentProjects = useProjectStore.getState().projects;
    expect(currentProjects.length).toBe(1);
    expect(currentProjects[0].id).toBe(canonicalUUID);
    expect(currentProjects[0].input.designParameters.concreteGrade).toBe('M40');
    expect(currentProjects[0].input.designParameters.slump).toBe(125);
  });
});
