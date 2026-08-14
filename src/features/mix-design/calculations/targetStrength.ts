/**
 * Step 1: Target Mean Compressive Strength (f'ck)
 * IS 10262:2019 — Clause 4.2 (and Clause 6.2)
 *
 * Formula:
 *   f'ck = fck + 1.65 × S    ... (A)
 *   f'ck = fck + X            ... (B)
 *   Governing: whichever is higher
 *
 * Where:
 *   fck = Characteristic compressive strength at 28 days (N/mm²)
 *   S   = Assumed standard deviation from IS 10262:2019 Table 2
 *   X   = Value from IS 10262:2019 Table 1
 *
 * Reference:
 *   IS 10262:2019, Clause 4.2 and Table 1, Table 2
 */

import type { CalculationStepResult, EngineContext } from './engine/types';
import {
  lookupStandardDeviation,
  lookupXFactor,
} from '../reference-data';
import type { SiteControlLevel } from '../types';

// ─── Target Strength Result ──────────────────────────────────────────────────

export interface TargetStrengthResult extends CalculationStepResult {
  /** Extended detail for audit and UI display */
  detail: {
    characteristicStrength: number;            // fck (N/mm²)
    standardDeviation: number | null;          // S (N/mm²)
    xFactor: number | null;                    // X (N/mm²)
    siteControl: SiteControlLevel;
    targetFromStandardDeviation: number | null; // fck + 1.65 × S
    targetFromX: number | null;                 // fck + X
    targetMeanStrength: number | null;          // max of above two
    controllingEquation: 'A' | 'B' | null;     // which formula governed
  };
}

// ─── Implementation ──────────────────────────────────────────────────────────

/**
 * Calculates the target mean compressive strength (f'ck) per IS 10262:2019 Clause 4.2.
 *
 * Returns a `reference-data-required` status if S or X cannot be found for
 * the given grade — the engine must NOT proceed on unavailable lookup values.
 */
export function calculateTargetStrength(ctx: EngineContext): TargetStrengthResult {
  const siteControl: SiteControlLevel =
    ctx.siteControl === 'fair' ? 'fair' : 'good';

  const S = lookupStandardDeviation(ctx.grade, siteControl);
  const X = lookupXFactor(ctx.grade);

  const traceBase = {
    step: 'target-strength',
    title: 'Target Mean Compressive Strength (f\'ck)',
    formula: "f'ck = max(fck + 1.65 × S,  fck + X)",
    inputs: {
      'fck (N/mm²)': ctx.fck,
      'Grade': ctx.grade,
      'Site Control': siteControl,
      'S from Table 2 (N/mm²)': S ?? 'not found',
      'X from Table 1 (N/mm²)': X ?? 'not found',
    },
    source: 'IS 10262:2019, Clause 4.2; Table 1 (X); Table 2 (S)',
  };

  // If S or X cannot be found, the calculation cannot proceed
  if (S === null || X === null) {
    const missing: string[] = [];
    if (S === null) missing.push('S (standard deviation — grade not in Table 2)');
    if (X === null) missing.push('X (value of X — grade not in Table 1)');

    return {
      status: 'reference-data-required',
      value: null,
      unit: 'N/mm²',
      trace: {
        ...traceBase,
        substitution: `Grade ${ctx.grade} not found in reference tables`,
      },
      message: `Cannot calculate target strength: missing reference data — ${missing.join(', ')}`,
      detail: {
        characteristicStrength: ctx.fck,
        standardDeviation: S,
        xFactor: X,
        siteControl,
        targetFromStandardDeviation: null,
        targetFromX: null,
        targetMeanStrength: null,
        controllingEquation: null,
      },
    };
  }

  // ─── Formula A: fck + 1.65 × S ───────────────────────────────────────────
  const targetA = ctx.fck + 1.65 * S;

  // ─── Formula B: fck + X ───────────────────────────────────────────────────
  const targetB = ctx.fck + X;

  const targetMeanStrength = Math.max(targetA, targetB);
  const controllingEquation: 'A' | 'B' = targetA >= targetB ? 'A' : 'B';

  return {
    status: 'calculated',
    value: targetMeanStrength,
    unit: 'N/mm²',
    trace: {
      ...traceBase,
      substitution: [
        `(A) fck + 1.65 × S = ${ctx.fck} + 1.65 × ${S} = ${targetA.toFixed(4)} N/mm²`,
        `(B) fck + X = ${ctx.fck} + ${X} = ${targetB.toFixed(4)} N/mm²`,
        `Governing: Equation ${controllingEquation} → f'ck = ${targetMeanStrength.toFixed(4)} N/mm²`,
      ].join('\n'),
    },
    message: `f'ck = ${targetMeanStrength.toFixed(4)} N/mm²`,
    detail: {
      characteristicStrength: ctx.fck,
      standardDeviation: S,
      xFactor: X,
      siteControl,
      targetFromStandardDeviation: targetA,
      targetFromX: targetB,
      targetMeanStrength,
      controllingEquation,
    },
  };
}
