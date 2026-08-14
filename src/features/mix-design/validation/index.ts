/**
 * Mix Design Input Validation
 *
 * Validates MixDesignInput before passing it to the calculation engine.
 * Enforces IS 10262:2019 and IS 456:2000 constraints on inputs.
 *
 * Architecture note:
 *   - Validation is a pure function — no side effects
 *   - Each check produces a ValidationIssue with a code reference
 *   - The calculation engine must NOT run on invalid input
 */

import type {
  MixDesignInput,
  ValidationResult,
  ValidationIssue,
} from '../types';

/**
 * Grades for which calculation rules have been verified and configured.
 * If a user selects a grade outside this set, the engine will refuse to
 * calculate rather than silently extrapolating.
 *
 * TODO: Expand this set as verified reference data is added.
 */
const SUPPORTED_GRADES = new Set([
  'M10', 'M15', 'M20', 'M25', 'M30', 'M35',
  'M40', 'M45', 'M50', 'M55',
]);

/**
 * Validates all inputs for the mix design workflow.
 * Returns a ValidationResult with all issues found.
 */
export function validateMixDesignInput(input: MixDesignInput): ValidationResult {
  const issues: ValidationIssue[] = [];
  const { designParameters: dp, materialProperties: mp } = input;

  // ─── Grade Support Check ─────────────────────────────────────────────────
  if (!SUPPORTED_GRADES.has(dp.concreteGrade)) {
    issues.push({
      field: 'designParameters.concreteGrade',
      message: `Calculation rules for ${dp.concreteGrade} have not yet been configured. Only grades M10–M55 are currently supported.`,
      severity: 'error',
      codeReference: 'IS 10262:2019',
    });
  }

  // ─── Slump Range ─────────────────────────────────────────────────────────
  if (dp.slump < 25 || dp.slump > 225) {
    issues.push({
      field: 'designParameters.slump',
      message: 'Slump must be between 25 mm and 225 mm.',
      severity: 'warning',
      codeReference: 'IS 10262:2019 — Clause 3',
    });
  }

  // ─── Cement Specific Gravity ─────────────────────────────────────────────
  if (mp.cement.specificGravity < 2.8 || mp.cement.specificGravity > 3.2) {
    issues.push({
      field: 'materialProperties.cement.specificGravity',
      message: 'Cement specific gravity is typically between 2.8 and 3.2.',
      severity: 'warning',
    });
  }

  // ─── Fine Aggregate Specific Gravity ─────────────────────────────────────
  if (mp.fineAggregate.specificGravity < 2.4 || mp.fineAggregate.specificGravity > 2.9) {
    issues.push({
      field: 'materialProperties.fineAggregate.specificGravity',
      message: 'Fine aggregate specific gravity is typically between 2.4 and 2.9.',
      severity: 'warning',
    });
  }

  // ─── Coarse Aggregate Specific Gravity ───────────────────────────────────
  if (mp.coarseAggregate.specificGravity < 2.4 || mp.coarseAggregate.specificGravity > 3.0) {
    issues.push({
      field: 'materialProperties.coarseAggregate.specificGravity',
      message: 'Coarse aggregate specific gravity is typically between 2.4 and 3.0.',
      severity: 'warning',
    });
  }

  // ─── Project Name ─────────────────────────────────────────────────────────
  if (!input.projectDetails.projectName?.trim()) {
    issues.push({
      field: 'projectDetails.projectName',
      message: 'Project name is required.',
      severity: 'error',
    });
  }

  const errors = issues.filter((i) => i.severity === 'error');
  return {
    isValid: errors.length === 0,
    issues,
  };
}
