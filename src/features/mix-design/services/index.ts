/**
 * Mix Design Service
 *
 * This service layer sits between the UI and the calculation engine.
 * It is also the future integration point for Supabase persistence.
 *
 * Architecture:
 *   UI
 *    ↓
 *   Mix Design Service  ← YOU ARE HERE
 *    ├── Calculation Engine
 *    └── Supabase Persistence (future — add here without touching the engine)
 *
 * Rules:
 *   - React components must NEVER import from calculations/ directly
 *   - React components must NEVER perform database operations directly
 *   - All calculation and persistence calls go through this service
 */

import type {
  MixDesignInput,
  MixDesignResult,
  ValidationResult,
} from '../types';
import { runMixDesignCalculation } from '../calculations';
import { validateMixDesignInput } from '../validation';

/**
 * Runs the full IS 10262:2019 calculation pipeline for the given input.
 * Returns null and a validation error if the input fails validation.
 */
export function calculateMixDesign(input: MixDesignInput): {
  result: MixDesignResult | null;
  validation: ValidationResult;
} {
  const validation = validateMixDesignInput(input);

  if (!validation.isValid) {
    return { result: null, validation };
  }

  const result = runMixDesignCalculation(input);
  return { result, validation };
}

/**
 * Supabase integration point (future).
 * Once Supabase is configured, replace the localStorage-based
 * useProjectStore calls in the UI with calls to this service.
 *
 * Example future signature:
 *   export async function persistProject(project: SavedProject): Promise<SavedProject>
 *   export async function fetchProjects(userId: string): Promise<SavedProject[]>
 */

// Reserved for future Supabase persistence methods.
// Do not implement until Supabase is configured.
export const MixDesignService = {
  calculate: calculateMixDesign,
  // persist: undefined,   // future: Supabase
  // fetchAll: undefined,  // future: Supabase
  // fetchById: undefined, // future: Supabase
  // delete: undefined,    // future: Supabase
} as const;
