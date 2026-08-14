/**
 * Engineering Types — Legacy Re-export Shim
 *
 * ⚠️ This file is kept for backward compatibility during migration.
 * The canonical type definitions are now located at:
 *   src/features/mix-design/types/
 *
 * Do NOT add new types here. Add them to the features path instead.
 */
export type {
  ConcreteGrade,
  HighStrengthConcreteGrade,
  AllConcreteGrades,
  ExposureCondition,
  AggregateSize,
  CementType,
  ProjectStatus,
  ReferenceStandardVersion,
  SupabaseEntity,
  ReferenceDataVersion,
  ProjectDetails,
  DesignParameters,
  CementProperties,
  AggregateProperties,
  WaterProperties,
  AdmixtureProperties,
  MaterialProperties,
  MixDesignInput,
  CalculationStep,
  MixDesignResult,
  MixDesignCalculation,
  ValidationSeverity,
  ValidationIssue,
  ValidationResult,
  TrialMix,
  SavedProject,
  CubeStrengthRecord,
  ModuleStatus,
  EngineeringModule,
} from '@/features/mix-design/types';