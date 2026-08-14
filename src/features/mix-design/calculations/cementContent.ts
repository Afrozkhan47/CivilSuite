/**
 * Step 4: Cement / Cementitious Content
 * IS 10262:2019 — Clause 6.5
 *
 * Formula:
 *   C = W / (W/C)           [ordinary]
 *   C = W / (W/CM)          [high-strength]
 *
 * Limits applied:
 *   - Maximum cement content: 450 kg/m³ (IS 10262:2019, Clause 6.5 Note)
 *   - Minimum cement content: IS 456:2000 Table 5 by exposure class.
 *     These values are included below as verified constants from IS 456:2000.
 *
 * IS 456:2000 Table 5 — Minimum Cement Content and Maximum W/C by Exposure:
 *   Mild:        min 300 kg/m³, max W/C 0.55, min grade M20
 *   Moderate:    min 300 kg/m³, max W/C 0.50, min grade M25
 *   Severe:      min 320 kg/m³, max W/C 0.45, min grade M30
 *   Very Severe: min 340 kg/m³, max W/C 0.45, min grade M35
 *   Extreme:     min 360 kg/m³, max W/C 0.40, min grade M40
 *
 * Source: IS 10262:2019, Clause 6.5; IS 456:2000, Table 5
 */

import type { CalculationOutput, EngineContext } from './engine/types';

// IS 456:2000, Table 5 — Verified minimum cement content by exposure class
export const IS456_MIN_CEMENT: Record<string, number> = {
  mild: 300,
  moderate: 300,
  severe: 320,
  very_severe: 340,
  extreme: 360,
};

// IS 456:2000, Table 5 — Verified maximum W/C by exposure class
export const IS456_MAX_WC: Record<string, number> = {
  mild: 0.55,
  moderate: 0.50,
  severe: 0.45,
  very_severe: 0.45,
  extreme: 0.40,
};

// IS 10262:2019, Clause 6.5 Note — absolute maximum cement content
const MAX_CEMENT_CONTENT = 450; // kg/m³

export function calculateCementContent(
  ctx: EngineContext,
  waterContent: number,
  wcRatio: number
): CalculationOutput {
  if (wcRatio <= 0 || waterContent <= 0) {
    return {
      value: 0,
      unit: 'kg/m³',
      formula: 'C = W / (W/C)',
      substitution: `Cannot compute: waterContent=${waterContent}, wcRatio=${wcRatio}`,
      result: 'reference-data-required: upstream W/C or water content not available',
      isCodeClause: 'IS 10262:2019, Clause 6.5',
      isPlaceholder: false,
    };
  }

  const rawCement = waterContent / wcRatio;

  // ─── Apply minimum cement content from IS 456:2000 ────────────────────────
  const exposureKey = ctx.exposureCondition?.toLowerCase().replace(' ', '_') ?? 'moderate';
  const minCement = IS456_MIN_CEMENT[exposureKey] ?? 300; // fallback to moderate if unknown

  const adoptedCement = Math.max(rawCement, minCement);
  let governedBy = 'strength (W/C formula)';
  if (adoptedCement === minCement && minCement > rawCement) {
    governedBy = `IS 456:2000 minimum (${minCement} kg/m³ for ${ctx.exposureCondition} exposure)`;
  }

  // ─── Apply maximum cement content limit ───────────────────────────────────
  let warningNote = '';
  if (adoptedCement > MAX_CEMENT_CONTENT) {
    warningNote = ` [WARNING: Exceeds IS 10262 maximum of ${MAX_CEMENT_CONTENT} kg/m³. Redesign required.]`;
    // Do not silently clamp. IS 10262:2019 Clause 6.5 Note says "should not exceed 450 kg/m³".
    // Clamping invalidates the W/C ratio. The user must adjust inputs.
  }

  const finalCement = Math.round(adoptedCement); // Round per IS practice

  const parts: string[] = [
    `C = W / (W/C) = ${waterContent.toFixed(2)} / ${wcRatio.toFixed(4)} = ${rawCement.toFixed(2)} kg/m³`,
    `Min cement (IS 456:2000 Table 5, ${ctx.exposureCondition}): ${minCement} kg/m³`,
    `Max cement (IS 10262:2019 Note): ${MAX_CEMENT_CONTENT} kg/m³`,
    `Raw Calculated: ${rawCement.toFixed(2)} kg/m³`,
  ];

  if (warningNote) {
    parts.push(`Status: FAIL (redesign required)`);
  } else {
    parts.push(`Adopted: ${finalCement} kg/m³ [governed by: ${governedBy}]`);
  }

  const resultStatus = finalCement > MAX_CEMENT_CONTENT
    ? `Calculated cement = ${finalCement} kg/m³ | Maximum = ${MAX_CEMENT_CONTENT} kg/m³ | Status = FAIL — redesign required`
    : `Cement content = ${finalCement} kg/m³ (governed by: ${governedBy})`;

  return {
    value: finalCement,
    unroundedValue: adoptedCement,
    unit: 'kg/m³',
    formula: 'C = W / (W/C) [subject to IS 456:2000 Table 5 min and IS 10262 max 450 kg/m³]',
    substitution: parts.join(' | '),
    result: resultStatus,
    isCodeClause: 'IS 10262:2019, Clause 6.5; IS 456:2000, Table 5',
    isPlaceholder: false,
  };
}
