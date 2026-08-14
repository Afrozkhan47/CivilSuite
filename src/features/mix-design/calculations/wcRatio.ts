/**
 * Step 3a: Strength-Based W/C Ratio Determination
 * IS 10262:2019 — Clause 6.4, Figure 1
 *
 * Determines the water-cement ratio based on the target mean strength (f'ck)
 * and the 28-day compressive strength curve of the cement being used.
 *
 * IMPORTANT:
 *   - The actual W/C values come from Figure 1 coordinate data.
 *   - If Figure 1 data is not yet populated, this step returns status
 *     'reference-data-required'. The engine must NOT proceed past this point.
 *   - This function never returns W/C = 0 as a fake value.
 *
 * Step 3b: Durability W/C Limit
 *   See durabilityLimit.ts — the final adopted W/C is the LOWER of
 *   the strength-based and durability-based values.
 *
 * Source: IS 10262:2019, Clause 6.4
 */

import type { CalculationStepResult, EngineContext } from './engine/types';
import { selectCementStrengthCurve } from './cementCurveSelector';
import { interpolateWCRatioFromFigure1 } from './interpolation';
import type { CurveSelectionResult } from './cementCurveSelector';
import { selectCalculationMethod, lookupHighStrengthWCM } from '../reference-data';

// ─── W/C Ratio Step Result ───────────────────────────────────────────────────

export interface WCRatioStepResult extends CalculationStepResult {
  detail: {
    targetStrength: number;
    curveSelection?: CurveSelectionResult;
    interpolationMessage?: string;
    method: 'ordinary-standard' | 'high-strength';
    table8LookupMessage?: string;
  };
}

// ─── Implementation ──────────────────────────────────────────────────────────

/**
 * Calculates the strength-based free W/C or W/CM ratio.
 *
 * For M10–M60, interpolates from Figure 1 curves based on cement strength.
 * For M65 and above, performs Table 8 W/CM lookup.
 *
 * @param ctx             Engine context
 * @param targetStrength  f'ck — target mean compressive strength (N/mm²)
 */
export function calculateStrengthBasedWCRatio(
  ctx: EngineContext,
  targetStrength: number
): WCRatioStepResult {
  // ─── Step 1: Select Calculation Method ─────────────────────────────────
  const methodSelection = selectCalculationMethod(ctx.grade);

  if (methodSelection.method === 'high-strength') {
    // Table 8 is keyed by target mean compressive strength f'ck (not fck grade).
    // M70 golden case: target = 79.9 MPa → Table 8 lookup → W/CM = 0.29
    const wcm = lookupHighStrengthWCM(targetStrength, ctx.maxAggregateSize);

    const traceBase = {
      step: 'strength-based-wc-ratio',
      title: 'Water-Cementitious Material Ratio (IS 10262:2019 Table 8)',
      formula: "W/CM = Table 8 lookup by target mean strength f'ck and MSA",
      inputs: {
        'Concrete Grade': ctx.grade,
        'fck (N/mm²)': ctx.fck,
        "Target Mean Strength f'ck (N/mm²)": targetStrength,
        'Max Aggregate Size (mm)': ctx.maxAggregateSize,
      },
      source: 'IS 10262:2019, Clause 6.2.5, Table 8',
    };

    if (wcm === null) {
      return {
        status: 'out-of-range',
        value: null,
        unit: 'dimensionless',
        trace: {
          ...traceBase,
          substitution: `No Table 8 entry for target strength = ${targetStrength.toFixed(1)} MPa and MSA = ${ctx.maxAggregateSize} mm.`,
        },
        message: `Cannot determine W/CM ratio: target strength ${targetStrength.toFixed(1)} MPa is outside Table 8 range [70–100 MPa] for MSA ${ctx.maxAggregateSize} mm.`,
        detail: {
          targetStrength,
          method: 'high-strength',
          table8LookupMessage: `Lookup failed for target=${targetStrength.toFixed(1)}, MSA=${ctx.maxAggregateSize}`,
        },
      };
    }

    return {
      status: 'calculated',
      value: wcm,
      unit: 'dimensionless',
      trace: {
        ...traceBase,
        substitution: `W/CM = ${wcm} (Table 8 for target f'ck = ${targetStrength.toFixed(1)} MPa, MSA = ${ctx.maxAggregateSize} mm)`,
      },
      message: `High-strength W/CM = ${wcm.toFixed(4)} (Table 8, target f'ck ${targetStrength.toFixed(1)} MPa, MSA ${ctx.maxAggregateSize} mm)`,
      detail: {
        targetStrength,
        method: 'high-strength',
        table8LookupMessage: `Lookup succeeded: W/CM = ${wcm}`,
      },
    };
  }

  // ─── Step 2: Ordinary/Standard Path (Figure 1) ────────────────────────
  const curveSelection = selectCementStrengthCurve(
    ctx.cementType,
    ctx.cementGrade ?? null
  );

  const traceBase = {
    step: 'strength-based-wc-ratio',
    title: 'Strength-Based Water-Cement Ratio (IS 10262:2019 Figure 1)',
    formula: "W/C = f(f'ck, cement strength curve) — read from Figure 1",
    inputs: {
      "f'ck (N/mm²)": targetStrength,
      'Cement Type': ctx.cementType,
      'Cement Grade (if known)': ctx.cementGrade ?? 'Not provided',
      'Figure 1 Curve Selected': curveSelection.curve,
      'Curve Selection Reason': curveSelection.reason,
    },
    source: 'IS 10262:2019, Clause 6.4, Figure 1',
  };

  const interpolation = interpolateWCRatioFromFigure1(targetStrength, curveSelection.curve);

  if (interpolation.status === 'no-data') {
    return {
      status: 'reference-data-required',
      value: null,
      unit: 'dimensionless',
      trace: {
        ...traceBase,
        substitution: `Figure 1 ${curveSelection.curve}: no verified data points available.`,
      },
      message: `Cannot determine W/C ratio: ${interpolation.message}`,
      detail: {
        targetStrength,
        curveSelection,
        interpolationMessage: interpolation.message,
        method: 'ordinary-standard',
      },
    };
  }

  if (interpolation.status === 'out-of-range') {
    return {
      status: 'out-of-range',
      value: null,
      unit: 'dimensionless',
      trace: {
        ...traceBase,
        substitution: `Target strength ${targetStrength} N/mm² is outside verified Figure 1 range.`,
      },
      message: `Cannot determine W/C ratio: ${interpolation.message}`,
      detail: {
        targetStrength,
        curveSelection,
        interpolationMessage: interpolation.message,
        method: 'ordinary-standard',
      },
    };
  }

  const wcRatio = interpolation.value!;

  return {
    status: 'calculated',
    value: wcRatio,
    unit: 'dimensionless',
    trace: {
      ...traceBase,
      substitution: interpolation.message,
    },
    message: `Strength-based W/C ratio = ${wcRatio.toFixed(4)} (${curveSelection.curve}, target ${targetStrength} N/mm²)`,
    detail: {
      targetStrength,
      curveSelection,
      interpolationMessage: interpolation.message,
      method: 'ordinary-standard',
    },
  };
}
