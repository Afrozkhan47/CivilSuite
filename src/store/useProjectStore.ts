/**
 * Zustand store for saved projects
 * Backend integration point: Replace localStorage operations with API calls
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SavedProject, MixDesignInput, MixDesignResult } from '@/features/mix-design/types';

interface ProjectStore {
  projects: SavedProject[];
  activeProjectId: string | null;
  setActiveProject: (id: string | null) => void;
  saveProject: (input: MixDesignInput, result?: MixDesignResult) => SavedProject;
  updateProject: (id: string, updates: Partial<SavedProject>) => void;
  deleteProject: (id: string) => void;
  duplicateProject: (id: string) => SavedProject | null;
  getProjectById: (id: string) => SavedProject | undefined;
}

export const migrateProject = (project: SavedProject): SavedProject => {
  if (!project.schemaVersion || project.schemaVersion < 2) {
    const isLegacyRounded = project.input?.materialProperties?.coarseAggregate?.angularity === 'rounded';
    return {
      ...project,
      schemaVersion: 2,
      input: {
        ...project.input,
        materialProperties: {
          ...project.input?.materialProperties,
          coarseAggregate: {
            ...project.input?.materialProperties?.coarseAggregate,
            angularity: isLegacyRounded ? 'partially_rounded' : (project.input?.materialProperties?.coarseAggregate?.angularity ?? 'angular'),
          },
        },
      },
    };
  }
  return project;
};

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProjectId: null,

      setActiveProject: (id) => set({ activeProjectId: id }),

      saveProject: (input, result) => {
        const now = new Date().toISOString();
        const project: SavedProject = {
          id: `proj-${Date.now()}`,
          schemaVersion: 2,
          status: result ? 'calculated' : 'draft',
          input,
          result,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ projects: [project, ...state.projects] }));
        return project;
      },

      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id
              ? { ...p, ...updates, updatedAt: new Date().toISOString() }
              : p
          ),
        }));
      },

      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
        }));
      },

      duplicateProject: (id) => {
        const original = get().projects.find((p) => p.id === id);
        if (!original) return null;
        const now = new Date().toISOString();
        const copy: SavedProject = {
          ...original,
          id: `proj-${Date.now()}`,
          schemaVersion: 2,
          input: {
            ...original.input,
            projectDetails: {
              ...original.input.projectDetails,
              projectName: `${original.input.projectDetails.projectName} (Copy)`,
            },
          },
          status: 'draft',
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ projects: [copy, ...state.projects] }));
        return copy;
      },

      getProjectById: (id) => get().projects.find((p) => p.id === id),
    }),
    {
      name: 'civilsuite-projects',
      version: 2,
      migrate: (persistedState: any) => {
        const state = persistedState as { projects: SavedProject[]; activeProjectId: string | null };
        if (state && Array.isArray(state.projects)) {
          return {
            ...state,
            projects: state.projects.map(migrateProject),
          };
        }
        return state;
      },
    }
  )
);