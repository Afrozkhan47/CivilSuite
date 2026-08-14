/**
 * Figure 1 — Cement Strength Curve Selector
 * IS 10262:2019, Clause 6.4
 *
 * Selects the appropriate Figure 1 curve based on cement type and
 * the expected 28-day compressive strength of cement.
 *
 * Curve Definitions:
 *   Curve 1: Expected 28-day cement strength 33 and < 43 N/mm²  → OPC 33
 *   Curve 2: Expected 28-day cement strength 43 and < 53 N/mm²  → OPC 43
 *   Curve 3: Expected 28-day cement strength 53 N/mm² and above → OPC 53
 *
 * PPC / PSC:
 *   If actual 28-day cement strength is known → select curve by strength.
 *   If unknown → default to Curve 2 (per standard's guidance).
 *
 * Source: IS 10262:2019, Clause 6.4, Figure 1
 */

import type { Figure1Curve } from '../reference-data';

// ─── Curve Selection Result ──────────────────────────────────────────────────

export interface CurveSelectionResult {
  curve: Figure1Curve;
  reason: string;
  cementType: string;
  actualCementStrength: number | null; // N/mm² if provided, null if using default
  isDefault: boolean; // true when using the PPC/PSC fallback, not actual data
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** OPC 33: expected 28-day cement strength 33 to <43 N/mm² */
const CURVE1_MIN = 33;
const CURVE1_MAX = 43; // exclusive

/** OPC 43: expected 28-day cement strength 43 to <53 N/mm² */
const CURVE2_MIN = 43;
const CURVE2_MAX = 53; // exclusive

/** OPC 53: expected 28-day cement strength 53 N/mm² and above */
const CURVE3_MIN = 53;

// ─── Cement Type Defaults ─────────────────────────────────────────────────────

/**
 * Default curve for each cement type when actual 28-day strength is not available.
 * PPC and PSC default to Curve 2 per IS 10262:2019 guidance.
 */
const CEMENT_TYPE_DEFAULT_CURVE: Record<string, Figure1Curve> = {
  OPC_33: 'curve1',
  OPC_43: 'curve2',
  OPC_53: 'curve3',
  PPC: 'curve2',  // Curve 2 used in absence of actual strength data
  PSC: 'curve2',  // Curve 2 used in absence of actual strength data
  SRC: 'curve2',  // Sulphate Resisting Cement — default Curve 2 (verify with professor)
};

// ─── Selector Function ────────────────────────────────────────────────────────

/**
 * Selects the Figure 1 curve for W/C ratio determination.
 *
 * @param cementType          Cement type code e.g. "OPC_43", "PPC", "PSC"
 * @param actualCementStrength  Actual 28-day cement strength in N/mm², or null if unknown
 *
 * Priority:
 *   1. If `actualCementStrength` is provided → select curve by strength range.
 *   2. Otherwise → use cement type default.
 */
export function selectCementStrengthCurve(
  cementType: string,
  actualCementStrength: number | null
): CurveSelectionResult {

  // ─── Priority 1: Actual cement strength available ──────────────────────────
  if (actualCementStrength !== null) {
    let curve: Figure1Curve;

    if (actualCementStrength >= CURVE3_MIN) {
      curve = 'curve3';
    } else if (actualCementStrength >= CURVE2_MIN && actualCementStrength < CURVE2_MAX) {
      curve = 'curve2';
    } else if (actualCementStrength >= CURVE1_MIN && actualCementStrength < CURVE1_MAX) {
      curve = 'curve1';
    } else {
      // Strength below 33 N/mm² — outside defined curve range
      // Default to Curve 1 and flag as out of typical range
      return {
        curve: 'curve1',
        reason: `Cement strength ${actualCementStrength} N/mm² is below Curve 1 range (33 N/mm²). Defaulting to Curve 1. Verify with site data.`,
        cementType,
        actualCementStrength,
        isDefault: true,
      };
    }

    return {
      curve,
      reason: `Actual cement 28-day strength ${actualCementStrength} N/mm² → ${curve} selected per IS 10262:2019 Figure 1 range`,
      cementType,
      actualCementStrength,
      isDefault: false,
    };
  }

  // ─── Priority 2: Use cement type default ──────────────────────────────────
  const defaultCurve = CEMENT_TYPE_DEFAULT_CURVE[cementType];

  if (defaultCurve) {
    const isPpcPscDefault = cementType === 'PPC' || cementType === 'PSC' || cementType === 'SRC';
    return {
      curve: defaultCurve,
      reason: isPpcPscDefault
        ? `${cementType}: actual 28-day cement strength not available → Curve 2 used per IS 10262:2019 Clause 6.4 guidance`
        : `${cementType}: default curve mapping → ${defaultCurve}`,
      cementType,
      actualCementStrength: null,
      isDefault: true,
    };
  }

  // Unknown cement type — cannot select curve
  return {
    curve: 'curve2', // safe fallback, flagged
    reason: `Unknown cement type "${cementType}". Defaulting to Curve 2. Review cement type selection.`,
    cementType,
    actualCementStrength: null,
    isDefault: true,
  };
}
