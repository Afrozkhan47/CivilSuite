/**
 * Calculation Engine — Core Types
 *
 * Every calculation step returns a typed result that includes:
 *   - A discriminated `status` field so the orchestrator and UI know
 *     whether a real value was produced or why it was not.
 *   - A full trace/audit record (formula, inputs, substitution, source clause).
 *
 * IMPORTANT — DO NOT use value: 0 to represent "not implemented".
 * Use the explicit `status` field instead.
 */

// ─── Calculation Status ─────────────────────────────────────────────────────

export type CalculationStatus =
  | 'calculated'             // Real result produced by verified formula + data
  | 'reference-data-required' // Cannot calculate — reference data not yet populated
  | 'invalid-input'          // Input fails pre-condition check
  | 'out-of-range';          // Input is outside the verified data range

// ─── Calculation Trace ──────────────────────────────────────────────────────

/**
 * Full audit record for a single calculation step.
 * Every field must be populated — never leave formula or source blank.
 */
export interface CalculationTrace {
  step: string;                          // e.g. "target-strength"
  title: string;                         // Human-readable title
  formula: string;                        // e.g. "f'ck = fck + 1.65 × S"
  inputs: Record<string, string | number>; // Named inputs with values
  substitution: string;                  // Formula with values substituted
  source: string;                         // IS clause/table reference
}

// ─── Calculation Step Result ────────────────────────────────────────────────

export interface CalculationStepResult {
  status: CalculationStatus;
  value: number | null;                  // null when status ≠ 'calculated'
  unit: string;
  trace: CalculationTrace;
  /** Human-readable explanation of the result or why it is unavailable */
  message: string;
}

// ─── Interpolation Result ───────────────────────────────────────────────────

export interface InterpolationPoint {
  wcRatio: number;
  strengthMPa: number;
}

export interface InterpolationResult {
  status: 'interpolated' | 'exact-match' | 'out-of-range' | 'no-data';
  value: number | null;
  method: 'linear-interpolation' | 'exact' | 'none';
  lowerPoint?: InterpolationPoint;
  upperPoint?: InterpolationPoint;
  interpolationFraction?: number;      // 0.0–1.0 within the bracket
  isExtrapolated: false;               // Always false — extrapolation is prohibited
  message: string;
}

// ─── Engine Context ─────────────────────────────────────────────────────────

export interface EngineContext {
  grade: string;              // e.g. "M40"
  fck: number;                // MPa — characteristic compressive strength
  exposureCondition: string;
  slump: number;              // mm
  maxAggregateSize: number;   // mm
  isPumped: boolean;
  isAirEntrained: boolean;
  targetAirContent?: number;     // % — required if isAirEntrained is true
  cementType: string;         // e.g. "OPC_43"
  cementSG: number;
  cementGrade?: number;       // MPa — actual 28-day cement strength if available
  faSG: number;
  caSG: number;
  caAngularity?: 'angular' | 'sub-angular' | 'partially_rounded' | 'rounded';
  faZone?: string;            // IS 383 zone e.g. "II"
  siteControl?: 'good' | 'fair' | string; // optional, defaults to 'good'
  adoptedWcOverride?: number;
  waterAbsorptionFA: number;  // %
  waterAbsorptionCA: number;  // %
  admixtureWaterReduction?: number;
  admixtureDosageBasis?: 'percentage' | 'percent_cement' | 'liters_per_m3'; // % reduction in water due to admixture
  surfaceMoistureFA?: number;
  surfaceMoistureCA?: number;
}

// ─── Legacy CalculationOutput (kept for backward compat with step stubs) ───
// TODO: Remove once all steps are migrated to CalculationStepResult

export interface CalculationOutput {
  value: number;
  unroundedValue?: number;
  unit: string;
  formula: string;
  substitution: string;
  result: string;
  isCodeClause: string;
  isPlaceholder: boolean;
}
