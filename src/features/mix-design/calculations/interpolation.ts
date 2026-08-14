/**
 * Figure 1 — Interpolation Engine
 * IS 10262:2019, Clause 6.4
 *
 * Performs strength-to-W/C ratio interpolation on verified curve data.
 *
 * RULES:
 *   1. Only operates on verified data points — never invents values.
 *   2. Never extrapolates outside the verified range.
 *   3. Returns a fully structured result with interpolation metadata.
 *   4. Returns 'no-data' if the curve has no verified points yet.
 *   5. Returns 'out-of-range' (not null or zero) when target is outside bounds.
 */

import type { InterpolationResult, InterpolationPoint } from './engine/types';
import type { Figure1DataPoint, Figure1Curve } from '../reference-data';
import { FIGURE_1_WC_RATIO_CURVES } from '../reference-data';

// ─── Core Interpolation ───────────────────────────────────────────────────────

/**
 * Linear interpolation: given x between x1 and x2, find y.
 * y = y1 + (x - x1) × (y2 - y1) / (x2 - x1)
 */
function lerp(x: number, x1: number, y1: number, x2: number, y2: number): number {
  if (x2 === x1) return y1;
  return y1 + ((x - x1) * (y2 - y1)) / (x2 - x1);
}

// ─── Figure 1 Interpolation ───────────────────────────────────────────────────

/**
 * Interpolates the W/C ratio from Figure 1 for a given target mean strength.
 *
 * The graph reads: y-axis (concrete strength) → x-axis (W/C ratio).
 * Interpolation is performed in the strength dimension.
 *
 * @param targetStrengthMPa  Target mean compressive strength f'ck (N/mm²)
 * @param curve              Figure 1 curve to use (curve1/curve2/curve3)
 * @returns                  Structured InterpolationResult
 */
export function interpolateWCRatioFromFigure1(
  targetStrengthMPa: number,
  curve: Figure1Curve
): InterpolationResult {

  const curveData = FIGURE_1_WC_RATIO_CURVES.find((c) => c.curve === curve);

  // ─── No data: curve not populated yet ───────────────────────────────────
  if (!curveData || curveData.points.length === 0) {
    return {
      status: 'no-data',
      value: null,
      method: 'none',
      isExtrapolated: false,
      message: `Figure 1 ${curve} has no verified coordinate data. Digitized points from IS 10262:2019 Figure 1 are required before W/C can be determined from this curve.`,
    };
  }

  // Sort points by strength ascending
  const sorted: Figure1DataPoint[] = [...curveData.points].sort(
    (a, b) => a.strengthMPa - b.strengthMPa
  );

  const minStrength = sorted[0].strengthMPa;
  const maxStrength = sorted[sorted.length - 1].strengthMPa;

  // ─── Out of range: below minimum ────────────────────────────────────────
  if (targetStrengthMPa < minStrength) {
    return {
      status: 'out-of-range',
      value: null,
      method: 'none',
      isExtrapolated: false,
      message: `Target strength ${targetStrengthMPa} N/mm² is below the minimum verified point on ${curve} (${minStrength} N/mm²). Extrapolation is not permitted.`,
    };
  }

  // ─── Out of range: above maximum ────────────────────────────────────────
  if (targetStrengthMPa > maxStrength) {
    return {
      status: 'out-of-range',
      value: null,
      method: 'none',
      isExtrapolated: false,
      message: `Target strength ${targetStrengthMPa} N/mm² is above the maximum verified point on ${curve} (${maxStrength} N/mm²). Extrapolation is not permitted.`,
    };
  }

  // ─── Exact match ─────────────────────────────────────────────────────────
  const exactMatch = sorted.find((p) => p.strengthMPa === targetStrengthMPa);
  if (exactMatch) {
    return {
      status: 'exact-match',
      value: exactMatch.wcRatio,
      method: 'exact',
      isExtrapolated: false,
      message: `Exact match found on ${curve}: strength ${targetStrengthMPa} N/mm² → W/C = ${exactMatch.wcRatio}`,
    };
  }

  // ─── Linear interpolation between bracketing points ───────────────────────
  const lower = sorted.filter((p) => p.strengthMPa <= targetStrengthMPa).at(-1)!;
  const upper = sorted.find((p) => p.strengthMPa > targetStrengthMPa)!;

  const interpolatedWC = lerp(
    targetStrengthMPa,
    lower.strengthMPa,
    lower.wcRatio,
    upper.strengthMPa,
    upper.wcRatio
  );

  const fraction =
    (targetStrengthMPa - lower.strengthMPa) /
    (upper.strengthMPa - lower.strengthMPa);

  const lowerPoint: InterpolationPoint = { wcRatio: lower.wcRatio, strengthMPa: lower.strengthMPa };
  const upperPoint: InterpolationPoint = { wcRatio: upper.wcRatio, strengthMPa: upper.strengthMPa };

  return {
    status: 'interpolated',
    value: interpolatedWC,
    method: 'linear-interpolation',
    lowerPoint,
    upperPoint,
    interpolationFraction: fraction,
    isExtrapolated: false,
    message: [
      `Linear interpolation on ${curve}:`,
      `  Lower: strength=${lower.strengthMPa} N/mm² → W/C=${lower.wcRatio}`,
      `  Upper: strength=${upper.strengthMPa} N/mm² → W/C=${upper.wcRatio}`,
      `  Target: ${targetStrengthMPa} N/mm² → W/C = ${interpolatedWC.toFixed(4)}`,
    ].join('\n'),
  };
}
