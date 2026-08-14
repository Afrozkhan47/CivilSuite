/**
 * Mix Design — Type Definitions
 *
 * All domain types for the IS 10262:2019 Concrete Mix Design module.
 * Designed to be Supabase-compatible from the start:
 *   - id fields use string (UUID-compatible)
 *   - createdAt / updatedAt present on persisted entities
 *   - userId reserved for future Supabase auth integration
 *
 * Architecture:
 *   UI → Mix Design Service → Calculation Engine → Reference Data
 *   UI → Mix Design Service → Supabase Persistence (future)
 *
 * The Calculation Engine must remain independent of persistence concerns.
 */

// ─── Primitive Domain Types ─────────────────────────────────────────────────

export type ConcreteGrade =
  | 'M10' | 'M15' | 'M20' | 'M25' | 'M30' | 'M35' | 'M40' | 'M45' | 'M50'
  | 'M55' | 'M60' | 'M65' | 'M70' | 'M75' | 'M80';

/**
 * Grades above M80 are reserved for future implementation.
 * The professor has indicated the app may eventually need to support up to M160.
 * Do NOT invent IS 10262 values for these grades — add them only when verified data
 * is available.
 */
export type HighStrengthConcreteGrade =
  | 'M85' | 'M90' | 'M95' | 'M100';

export type AllConcreteGrades = ConcreteGrade | HighStrengthConcreteGrade;

export type ExposureCondition =
  | 'mild' | 'moderate' | 'severe' | 'very_severe' | 'extreme';

export type AggregateSize = 10 | 12.5 | 16 | 20 | 25 | 40;

export type CementType =
  | 'OPC_33' | 'OPC_43' | 'OPC_53' | 'PPC' | 'PSC' | 'SRC';

export type ProjectStatus =
  | 'draft' | 'calculated' | 'validated' | 'saved' | 'exported';

/** Fine aggregate grading zone per IS 383 */
export type FAZone = 'I' | 'II' | 'III' | 'IV';

/** Site control level — governs which standard deviation row is applied */
export type SiteControlLevel = 'good' | 'fair';

/** Version tag for IS standard being applied */
export type ReferenceStandardVersion =
  | 'IS_10262_2019'
  | 'IS_10262_2009'
  | 'IS_456_2000'
  | 'IS_383';

// ─── Supabase-Compatible Base ────────────────────────────────────────────────

/**
 * Base fields that all Supabase-persisted entities should share.
 * userId is optional until Supabase auth is integrated.
 */
export interface SupabaseEntity {
  id: string;
  createdAt: string;  // ISO 8601
  updatedAt: string;  // ISO 8601
  userId?: string;    // Supabase auth.uid() — reserved for future use
}

// ─── Reference Data ──────────────────────────────────────────────────────────

/**
 * Version metadata for a reference data snapshot.
 * Allows the calculation engine to track which IS edition was used.
 */
export interface ReferenceDataVersion {
  id: string;                 // unique identifier e.g. 'ver-is-10262-2019'
  standardCode: ReferenceStandardVersion;
  edition: string;            // e.g. "2019"
  effectiveDate: string;      // ISO date
  isActive: boolean;
  notes?: string;
}

// ─── Project Details ─────────────────────────────────────────────────────────

export interface ProjectDetails {
  projectName: string;
  clientName: string;
  engineerName: string;
  date: string;
  location: string;
  remarks?: string;
}

// ─── Design Parameters (IS 10262:2019 inputs) ────────────────────────────────

export interface DesignParameters {
  concreteGrade: AllConcreteGrades;
  exposureCondition: ExposureCondition;
  slump: number;               // mm
  maxAggregateSize: AggregateSize; // mm
  isPumpedConcrete: boolean;
  isAirEntrained: boolean;
  targetAirContent?: number;     // %, optional override if air entrained
  targetStrengthMargin?: number; // MPa, optional override
  faZone?: FAZone;               // IS 383 fine aggregate zone (default II)
  siteControl?: SiteControlLevel; // Governs standard deviation (default 'good')
  adoptedWcOverride?: number;    // Manual engineer override for final W/C ratio
}

// ─── Material Properties ─────────────────────────────────────────────────────

export interface CementProperties {
  type: CementType;
  specificGravity: number;
  grade?: number;              // MPa — 28-day strength
}

export interface AggregateProperties {
  specificGravity: number;
  waterAbsorption: number;     // %
  surfaceMoisture?: number;    // %
  finesModulus?: number;       // for FA only
  angularity?: 'angular' | 'sub-angular' | 'partially_rounded' | 'rounded'; // for CA
}

export interface WaterProperties {
  source?: string;
}

export interface AdmixtureProperties {
  type?: string;
  dosage?: number;
  dosageBasis?: 'percentage' | 'percent_cement' | 'liters_per_m3'; // 'percentage'/'percent_cement' = % by mass of cement, 'liters_per_m3' = L/m³ of concrete
  waterReduction?: number;     // % reduction in water due to admixture
  specificGravity?: number;
}

export interface MaterialProperties {
  cement: CementProperties;
  fineAggregate: AggregateProperties;
  coarseAggregate: AggregateProperties;
  water: WaterProperties;
  admixture: AdmixtureProperties;
}

// ─── Mix Design Input (combined) ─────────────────────────────────────────────

export interface MixDesignInput {
  projectDetails: ProjectDetails;
  designParameters: DesignParameters;
  materialProperties: MaterialProperties;
}

// ─── Calculation Engine Types ─────────────────────────────────────────────────

export interface CalculationStep {
  stepNumber: number;
  title: string;
  formula: string;
  inputs: Record<string, string | number>;
  calculation: string;
  result: string;
  unit: string;
  isCodeClause: string;
  isPlaceholder: boolean;
}

/**
 * The complete output of the IS 10262:2019 calculation engine.
 * isPlaceholder must be true until all steps are implemented and verified.
 */
export interface MixDesignResult {
  // ─── Proportions (kg/m³) ────────────────────────────────────────────────
  cement: number;
  /** Moisture-corrected field batch water (kg/m³). Use for batching. */
  water: number;
  /** SSD (saturated surface dry) design water used for W/C and volume calculations (kg/m³) */
  designWater: number;
  fineAggregate: number;
  coarseAggregate: number;
  /** Saturated surface dry (SSD) design fine aggregate mass (kg/m³) */
  ssdFineAggregate?: number;
  /** Saturated surface dry (SSD) design coarse aggregate mass (kg/m³) */
  ssdCoarseAggregate?: number;
  admixture: number | null;

  /** Unrounded double-precision floating point calculation results for exact auditability */
  unrounded?: {
    cement: number;
    water: number;
    designWater: number;
    fineAggregate: number;
    coarseAggregate: number;
    ssdFineAggregate: number;
    ssdCoarseAggregate: number;
    admixture: number | null;
    mixRatioFineAggregate: number;
    mixRatioCoarseAggregate: number;
    aggVolume: number;
    caFraction: number;
    faFraction: number;
  };

  // ─── Derived ─────────────────────────────────────────────────────────────
  wcRatio: number;
  density: number;             // kg/m³
  /** null when yield cannot be calculated (see yieldError) */
  yield: number | null;        // m³ per batch

  // ─── Mix Ratio ────────────────────────────────────────────────────────────
  mixRatioFineAggregate: number;
  mixRatioCoarseAggregate: number;

  // ─── Compliance Checks ───────────────────────────────────────────────────
  durabilityCheck: 'pass' | 'fail' | 'warning' | 'pending';
  strengthCheck: 'pass' | 'fail' | 'warning' | 'pending';
  cementContentCheck: 'pass' | 'fail' | 'warning' | 'pending';

  // ─── Calculation Breakdown ───────────────────────────────────────────────
  calculationSteps: CalculationStep[];

  // ─── Metadata ─────────────────────────────────────────────────────────────
  /** Must be true until the calculation engine is fully implemented */
  isPlaceholder: boolean;
  /** Set when yield cannot be calculated due to missing input (e.g. admixture SG not provided) */
  yieldError?: string;
  /** Reference data version used for this calculation */
  referenceDataVersion?: ReferenceDataVersion;
  calculatedAt?: string;
}

/**
 * Intermediate calculation record — useful for debugging and
 * for storing a calculation run in Supabase separate from the final result.
 */
export interface MixDesignCalculation extends SupabaseEntity {
  projectId: string;
  input: MixDesignInput;
  result: MixDesignResult;
  notes?: string;
}

// ─── Validation ───────────────────────────────────────────────────────────────

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  field?: string;
  message: string;
  severity: ValidationSeverity;
  codeReference?: string;      // e.g. "IS 456:2000 Cl. 8.2"
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
}

// ─── Trial Mix ────────────────────────────────────────────────────────────────

export interface TrialMix extends SupabaseEntity {
  projectId: string;
  trialNumber: number;
  adjustments: Partial<MixDesignInput>;
  observedSlump?: number;      // mm
  cubeStrength7Day?: number;   // MPa
  cubeStrength28Day?: number;  // MPa
  notes?: string;
}

// ─── Saved Project ────────────────────────────────────────────────────────────

export interface SavedProject extends SupabaseEntity {
  schemaVersion?: number; // 1 = legacy pre-Phase 5, 2 = Phase 5+
  status: ProjectStatus;
  input: MixDesignInput;
  result?: MixDesignResult;
  tags?: string[];
  trialMixes?: TrialMix[];
}

// ─── Cube Strength Record ─────────────────────────────────────────────────────

export interface CubeStrengthRecord extends SupabaseEntity {
  projectId?: string;
  cubeNumber: string;
  castingDate: string;
  testDate: string;
  age: number;                 // days
  strength: number;            // MPa
  grade: AllConcreteGrades;
  remarks?: string;
}

// ─── Module Descriptor ───────────────────────────────────────────────────────

export type ModuleStatus = 'active' | 'coming_soon' | 'beta';

export interface EngineeringModule {
  id: string;
  name: string;
  description: string;
  route: string;
  icon: string;
  status: ModuleStatus;
  category: string;
}
