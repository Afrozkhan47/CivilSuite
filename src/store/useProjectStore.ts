/**
 * Zustand store for saved projects
 * Multi-tenant architecture: Supabase PostgreSQL is the single source of truth for authenticated users.
 * Uses canonical UUID identities for all project records.
 */
import { create } from 'zustand';
import type { SavedProject, MixDesignInput, MixDesignResult } from '@/features/mix-design/types';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export const isValidUUID = (id: string | null | undefined): boolean => {
  if (!id || typeof id !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback RFC4122 v4 UUID generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

interface ProjectStore {
  projects: SavedProject[];
  activeProjectId: string | null;
  currentUserId: string | null;
  isLoading: boolean;
  error: string | null;
  resetStore: () => void;
  setActiveProject: (id: string | null) => void;
  fetchProjects: () => Promise<void>;
  saveProject: (input: MixDesignInput, result?: MixDesignResult) => SavedProject;
  updateProject: (id: string, updates: Partial<SavedProject>) => void;
  deleteProject: (id: string) => Promise<void>;
  duplicateProject: (id: string) => SavedProject | null;
  toggleFavorite: (id: string) => Promise<void>;
  getProjectById: (id: string) => SavedProject | undefined;
}

export const mapRowToSavedProject = (row: any): SavedProject => {
  return {
    id: row.id,
    schemaVersion: 2,
    status: row.status || 'calculated',
    isFavorite: row.is_favorite ?? false,
    input: row.input_data,
    result: row.result_data ?? undefined,
    redesignMetadata: row.redesign_metadata ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const migrateProject = (project: SavedProject): SavedProject => {
  const isFavorite = project.isFavorite ?? false;
  if (!project.schemaVersion || project.schemaVersion < 2) {
    const isLegacyRounded = project.input?.materialProperties?.coarseAggregate?.angularity === 'rounded';
    return {
      ...project,
      schemaVersion: 2,
      isFavorite,
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
  return {
    ...project,
    isFavorite,
  };
};

export const useProjectStore = create<ProjectStore>()((set, get) => ({
  projects: [],
  activeProjectId: null,
  currentUserId: null,
  isLoading: false,
  error: null,

  resetStore: () => {
    set({
      projects: [],
      activeProjectId: null,
      currentUserId: null,
      isLoading: false,
      error: null,
    });
  },

  setActiveProject: (id) => set({ activeProjectId: id }),

  fetchProjects: async () => {
    if (!isSupabaseConfigured()) return;

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const authUserId = session?.user?.id ?? null;

    if (get().currentUserId !== authUserId) {
      set({ projects: [], currentUserId: authUserId, isLoading: true, error: null });
    } else {
      set({ isLoading: true, error: null });
    }

    if (!authUserId) {
      set({ projects: [], isLoading: false });
      return;
    }

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects from Supabase:', error.message);
      set({ error: 'Unable to load your project history. Please try again.', isLoading: false, projects: [] });
      return;
    }

    if (data) {
      const mapped = data.map(mapRowToSavedProject);
      set({ projects: mapped, isLoading: false, currentUserId: authUserId });
    }
  },

  saveProject: (input, result) => {
    const now = new Date().toISOString();
    // Canonical UUID identity
    const newId = generateUUID();

    const project: SavedProject = {
      id: newId,
      schemaVersion: 2,
      status: result ? 'calculated' : 'draft',
      isFavorite: false,
      input,
      result,
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({ projects: [project, ...state.projects] }));

    // Async sync to Supabase if authenticated - using canonical newId
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          supabase.from('projects').insert({
            id: newId,
            user_id: session.user.id,
            project_name: input.projectDetails.projectName,
            client: input.projectDetails.clientName,
            engineer: input.projectDetails.engineerName,
            concrete_grade: input.designParameters.concreteGrade,
            status: project.status,
            is_favorite: false,
            created_at: now,
            updated_at: now,
            input_data: input,
            result_data: result ?? null,
            redesign_metadata: result?.redesignMetadata ?? null,
          }).then(({ error }) => {
            if (error) {
              console.error('Error saving project to Supabase:', error.message);
            }
          });
        }
      });
    }

    return project;
  },

  updateProject: (id, updates) => {
    const now = new Date().toISOString();
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id
          ? { ...p, ...updates, updatedAt: now }
          : p
      ),
    }));

    if (isSupabaseConfigured() && isValidUUID(id)) {
      const updatedProj = get().getProjectById(id);
      if (!updatedProj) return;

      const supabase = createClient();
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          supabase.from('projects').update({
            project_name: updatedProj.input.projectDetails.projectName,
            client: updatedProj.input.projectDetails.clientName,
            engineer: updatedProj.input.projectDetails.engineerName,
            concrete_grade: updatedProj.input.designParameters.concreteGrade,
            status: updatedProj.status,
            is_favorite: updatedProj.isFavorite ?? false,
            updated_at: now,
            input_data: updatedProj.input,
            result_data: updatedProj.result ?? null,
            redesign_metadata: updatedProj.result?.redesignMetadata ?? null,
          }).eq('id', id).eq('user_id', session.user.id).then(({ error }) => {
            if (error) {
              console.error('Error updating project in Supabase:', error.message);
            }
          });
        }
      });
    }
  },

  toggleFavorite: async (id) => {
    const current = get().getProjectById(id);
    if (!current) return;
    const newFav = !current.isFavorite;

    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, isFavorite: newFav } : p
      ),
    }));

    if (isSupabaseConfigured() && isValidUUID(id)) {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase
          .from('projects')
          .update({ is_favorite: newFav })
          .eq('id', id)
          .eq('user_id', session.user.id);
      }
    }
  },

  deleteProject: async (id) => {
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
    }));

    if (isSupabaseConfigured() && isValidUUID(id)) {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase
          .from('projects')
          .delete()
          .eq('id', id)
          .eq('user_id', session.user.id);
      }
    }
  },

  duplicateProject: (id) => {
    const original = get().projects.find((p) => p.id === id);
    if (!original) return null;
    const now = new Date().toISOString();
    const copy: SavedProject = {
      ...original,
      id: generateUUID(),
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

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          supabase.from('projects').insert({
            id: copy.id,
            user_id: session.user.id,
            project_name: copy.input.projectDetails.projectName,
            client: copy.input.projectDetails.clientName,
            engineer: copy.input.projectDetails.engineerName,
            concrete_grade: copy.input.designParameters.concreteGrade,
            status: copy.status,
            is_favorite: false,
            created_at: now,
            updated_at: now,
            input_data: copy.input,
            result_data: copy.result ?? null,
            redesign_metadata: copy.result?.redesignMetadata ?? null,
          }).then(({ error }) => {
            if (error) console.error('Error duplicating project in Supabase:', error.message);
          });
        }
      });
    }

    return copy;
  },

  getProjectById: (id) => get().projects.find((p) => p.id === id),
}));