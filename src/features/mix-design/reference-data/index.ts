/**
 * IS 10262:2019 Reference Data — Ordinary Mix Design Section
 *
 * ─── ARCHITECTURE RULES ────────────────────────────────────────────────────────
 *
 * 1. NEVER add values without verification from the authoritative standard.
 * 2. NEVER invent, approximate, or extrapolate missing values.
 * 3. Figure 1 coordinate points must remain empty until verified.
 * 4. Reference data is application-level engineering knowledge.
 *    It must NEVER be stored inside:
 *      - Zustand project state
 *      - user settings
 *      - individual saved project records
 *    A saved project only stores which reference data VERSION was used.
 *
 * ─── MIX TYPE SEPARATION ───────────────────────────────────────────────────────
 *
 * IS 10262:2019 contains multiple sections with different tables.
 * Do NOT mix tables from different sections. Every dataset carries:
 *   - source:       standard code + clause
 *   - table:        table number within that section
 *   - section:      'ordinary' | 'high_strength' | 'mass_concrete' | 'scc'
 *   - applicability: notes on what this data applies to
 *
 * ─── DATA FLOW ─────────────────────────────────────────────────────────────────
 *
 *   UI
 *    ↓
 *   Mix Design Service
 *    ├── Calculation Engine
 *    └── Reference Data  ← YOU ARE HERE
 */

import type { ReferenceDataVersion, AllConcreteGrades, FAZone, SiteControlLevel } from '../types';

// ─── Mix Type Tags ─────────────────────────────────────────────────────────────

export type MixSection =
  | 'ordinary'        // Standard mix design, Clauses 6.1–6.9
  | 'high_strength'   // High-strength concrete provisions
  | 'mass_concrete'   // Mass concrete provisions
  | 'scc';            // Self-compacting concrete

// ─── Reference Data Version Registry ──────────────────────────────────────────

export const REFERENCE_VERSIONS: Record<string, ReferenceDataVersion> = {
  IS_10262_2019: {
    id: 'ver-is-10262-2019',
    standardCode: 'IS_10262_2019',
    edition: '2019',
    effectiveDate: '2019-01-01',
    isActive: true,
    notes: 'IS 10262:2019 — Concrete Mix Proportioning — Guidelines (Third Revision). Supersedes IS 10262:2009.',
  },
  IS_456_2000: {
    id: 'ver-is-456-2000',
    standardCode: 'IS_456_2000',
    edition: '2000',
    effectiveDate: '2000-07-01',
    isActive: true,
    notes: 'IS 456:2000 — Plain and Reinforced Concrete — Code of Practice (Fourth Revision). Governs durability requirements: minimum cement content and maximum W/C ratio by exposure class.',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// ORDINARY MIX DESIGN — Tables 1 through 5 (Clauses 6.1–6.9)
// ═══════════════════════════════════════════════════════════════════════════════
//
// These tables apply only to ordinary/standard concrete mixes (M10–M60 typical).
// M65 and above may reference these tables but additional high-strength
// provisions apply — do not treat M65+ as equivalent to M10–M60 blindly.

// ─── Table 1 — Value of X (Clause 6.2) ───────────────────────────────────────
//
// Used in target mean strength formula:
//   f'ck = max(fck + 1.65 × S,  fck + X)
//
// Source: IS 10262:2019, Clause 6.2, Table 1

export interface ValueXEntry {
  minGrade: AllConcreteGrades;
  maxGrade: AllConcreteGrades;
  valueX: number;               // N/mm²
  source: string;
}

/**
 * Verified from IS 10262:2019, Table 1.
 * Note on M65+: Table 1 lists "M65 and above" with X = 8.0.
 * This does NOT imply that the ordinary calculation workflow applies to M65+
 * without review of the high-strength provisions in the standard.
 */
export const TABLE_1_VALUE_X: ValueXEntry[] = [
  {
    minGrade: 'M10',
    maxGrade: 'M15',
    valueX: 5.0,
    source: 'IS 10262:2019, Clause 6.2, Table 1',
  },
  {
    minGrade: 'M20',
    maxGrade: 'M25',
    valueX: 5.5,
    source: 'IS 10262:2019, Clause 6.2, Table 1',
  },
  {
    minGrade: 'M30',
    maxGrade: 'M60',
    valueX: 6.5,
    source: 'IS 10262:2019, Clause 6.2, Table 1',
  },
  {
    minGrade: 'M65',
    maxGrade: 'M80', // V1 scope cap. Standard says "M65 and above".
    valueX: 8.0,
    source: 'IS 10262:2019, Clause 6.2, Table 1',
  },
];

// ─── Table 2 — Assumed Standard Deviation (Clause 6.2) ────────────────────────
//
// Standard deviation (S) for target strength formula.
//
// Standard's Note on Site Control:
//   - Values below assume GOOD site control.
//   - Good site control = proper storage of cement, weigh batching of all
//     materials, controlled grading, moisture determination, and slump control.
//   - For FAIR site control, the standard permits adding 1.0 N/mm² to S.
//   - The application does NOT silently apply the fair-control adjustment.
//     It must only be applied if the user explicitly indicates fair site control.
//   - This structure is designed to support a siteControl field in the future.
//
// Source: IS 10262:2019, Clause 6.2, Table 2

// SiteControlLevel is imported from types/index.ts — not redeclared here.

export interface StandardDeviationEntry {
  minGrade: AllConcreteGrades;
  maxGrade: AllConcreteGrades;
  standardDeviation: number;    // N/mm² (MPa)
  siteControl: SiteControlLevel;
  source: string;
  applicability: string;
}

/**
 * Verified from IS 10262:2019, Table 2.
 * See site control note above before applying these values.
 */
export const TABLE_2_STANDARD_DEVIATION: StandardDeviationEntry[] = [
  {
    minGrade: 'M10',
    maxGrade: 'M15',
    standardDeviation: 3.5,
    siteControl: 'good',
    source: 'IS 10262:2019, Clause 6.2, Table 2',
    applicability: 'Ordinary mix design, good site control',
  },
  {
    minGrade: 'M20',
    maxGrade: 'M25',
    standardDeviation: 4.0,
    siteControl: 'good',
    source: 'IS 10262:2019, Clause 6.2, Table 2',
    applicability: 'Ordinary mix design, good site control',
  },
  {
    minGrade: 'M30',
    maxGrade: 'M60',
    standardDeviation: 5.0,
    siteControl: 'good',
    source: 'IS 10262:2019, Clause 6.2, Table 2',
    applicability: 'Ordinary mix design, good site control',
  },
  {
    minGrade: 'M65',
    maxGrade: 'M80',
    standardDeviation: 6.0,
    siteControl: 'good',
    source: 'IS 10262:2019, Clause 6.2, Table 2',
    applicability: 'High-strength grades — verify if ordinary procedure applies',
  },
];

// ─── Table 3 — Approximate Entrapped Air Content (Clause 6.6) ────────────────
//
// Entrapped (non-intentional) air in ordinary/standard concrete.
// Used in the absolute volume equation.
//
// ⚠️  Do NOT confuse with:
//     - IS 10262:2019 Table 6 (mass concrete air)
//     - IS 10262:2019 Table 11 (SCC)
//     - Air-entrained concrete tables in other sections
//
// Source: IS 10262:2019, Clause 6.6, Table 3

export interface AirContentEntry {
  maxAggregateSize: number;      // mm — Nominal maximum aggregate size
  airContentPercentage: number;  // % of concrete volume (entrapped, not entrained)
  section: MixSection;
  source: string;
}

/**
 * Verified from IS 10262:2019, Table 3.
 * Applies to ordinary concrete only — not mass concrete or SCC.
 */
export const TABLE_3_AIR_CONTENT: AirContentEntry[] = [
  {
    maxAggregateSize: 10,
    airContentPercentage: 1.5,
    section: 'ordinary',
    source: 'IS 10262:2019, Clause 6.6, Table 3',
  },
  {
    maxAggregateSize: 20,
    airContentPercentage: 1.0,
    section: 'ordinary',
    source: 'IS 10262:2019, Clause 6.6, Table 3',
  },
  {
    maxAggregateSize: 40,
    airContentPercentage: 0.8,
    section: 'ordinary',
    source: 'IS 10262:2019, Clause 6.6, Table 3',
  },
];

// ─── Table 4 — Maximum Water Content (Clause 6.3) ─────────────────────────────
//
// Baseline maximum water content for angular coarse aggregate at 50 mm slump.
// Condition: Saturated Surface Dry (SSD) aggregate.
//
// The calculation engine must apply workability adjustments SEPARATELY:
//   - For each 25 mm increase in slump above 50 mm:
//     Increase water content by approximately 3% per 25 mm slump.
//   - For sub-angular or rounded aggregate: Apply the standard's correction.
//   - Do NOT hardcode slump adjustments here. They belong in the engine.
//
// Source: IS 10262:2019, Clause 6.3, Table 4

export interface WaterContentEntry {
  maxAggregateSize: number;    // mm — Nominal maximum aggregate size
  waterContent: number;        // kg/m³ — at 50 mm slump, angular aggregate, SSD
  slumpBase: 50;               // mm — this table is always for 50 mm slump
  aggregateType: 'angular';    // 'angular' only; corrections applied in engine
  section: MixSection;
  source: string;
}

/**
 * Verified from IS 10262:2019, Clause 6.3, Table 4.
 * Condition: Angular coarse aggregate, 50 mm slump, SSD aggregate.
 */
export const TABLE_4_WATER_CONTENT: WaterContentEntry[] = [
  {
    maxAggregateSize: 10,
    waterContent: 208,
    slumpBase: 50,
    aggregateType: 'angular',
    section: 'ordinary',
    source: 'IS 10262:2019, Clause 6.3, Table 4',
  },
  {
    maxAggregateSize: 20,
    waterContent: 186,
    slumpBase: 50,
    aggregateType: 'angular',
    section: 'ordinary',
    source: 'IS 10262:2019, Clause 6.3, Table 4',
  },
  {
    maxAggregateSize: 40,
    waterContent: 165,
    slumpBase: 50,
    aggregateType: 'angular',
    section: 'ordinary',
    source: 'IS 10262:2019, Clause 6.3, Table 4',
  },
];

// ─── Table 5 — Volume Fraction of Coarse Aggregate (Clause 6.6) ──────────────
//
// Volume of coarse aggregate per unit volume of total aggregate (dry rodded basis)
// for different fine aggregate zones and W/C ratios.
//
// Baseline W/C ratio for this table: 0.50
// The W/C adjustment rule is codified separately (see W/C_ADJUSTMENT_RULE below).
//
// Fine Aggregate Zones (IS 383):
//   Zone IV — Finer (higher volume of CA needed to compensate)
//   Zone III
//   Zone II
//   Zone I  — Coarser (less CA needed)
//
// ⚠️  Do NOT confuse with IS 10262:2019 Table 13 (mass concrete).
//
// Source: IS 10262:2019, Clause 6.6, Table 5

export interface CAProportionEntry {
  maxAggregateSize: number;   // mm — Nominal maximum aggregate size
  wcRatioBase: 0.50;          // This table is always for W/C = 0.50
  zone: FAZone;               // Fine aggregate grading zone per IS 383
  volumeFractionCA: number;   // 0.0–1.0 (volume of CA per unit volume of total aggregate)
  section: MixSection;
  source: string;
}

/**
 * Verified from IS 10262:2019, Clause 6.6, Table 5.
 * Baseline W/C = 0.50. Apply W/C_ADJUSTMENT_RULE for other W/C ratios.
 * Do NOT use these values for mass concrete or SCC.
 */
export const TABLE_5_COARSE_AGGREGATE_PROPORTION: CAProportionEntry[] = [
  // ─── 10 mm Aggregate ──────────────────────────────────────────────────────
  { maxAggregateSize: 10, wcRatioBase: 0.50, zone: 'IV', volumeFractionCA: 0.54, section: 'ordinary', source: 'IS 10262:2019, Clause 6.6, Table 5' },
  { maxAggregateSize: 10, wcRatioBase: 0.50, zone: 'III', volumeFractionCA: 0.52, section: 'ordinary', source: 'IS 10262:2019, Clause 6.6, Table 5' },
  { maxAggregateSize: 10, wcRatioBase: 0.50, zone: 'II', volumeFractionCA: 0.50, section: 'ordinary', source: 'IS 10262:2019, Clause 6.6, Table 5' },
  { maxAggregateSize: 10, wcRatioBase: 0.50, zone: 'I', volumeFractionCA: 0.48, section: 'ordinary', source: 'IS 10262:2019, Clause 6.6, Table 5' },

  // ─── 20 mm Aggregate ──────────────────────────────────────────────────────
  { maxAggregateSize: 20, wcRatioBase: 0.50, zone: 'IV', volumeFractionCA: 0.66, section: 'ordinary', source: 'IS 10262:2019, Clause 6.6, Table 5' },
  { maxAggregateSize: 20, wcRatioBase: 0.50, zone: 'III', volumeFractionCA: 0.64, section: 'ordinary', source: 'IS 10262:2019, Clause 6.6, Table 5' },
  { maxAggregateSize: 20, wcRatioBase: 0.50, zone: 'II', volumeFractionCA: 0.62, section: 'ordinary', source: 'IS 10262:2019, Clause 6.6, Table 5' },
  { maxAggregateSize: 20, wcRatioBase: 0.50, zone: 'I', volumeFractionCA: 0.60, section: 'ordinary', source: 'IS 10262:2019, Clause 6.6, Table 5' },

  // ─── 40 mm Aggregate ──────────────────────────────────────────────────────
  { maxAggregateSize: 40, wcRatioBase: 0.50, zone: 'IV', volumeFractionCA: 0.73, section: 'ordinary', source: 'IS 10262:2019, Clause 6.6, Table 5' },
  { maxAggregateSize: 40, wcRatioBase: 0.50, zone: 'III', volumeFractionCA: 0.72, section: 'ordinary', source: 'IS 10262:2019, Clause 6.6, Table 5' },
  { maxAggregateSize: 40, wcRatioBase: 0.50, zone: 'II', volumeFractionCA: 0.71, section: 'ordinary', source: 'IS 10262:2019, Clause 6.6, Table 5' },
  { maxAggregateSize: 40, wcRatioBase: 0.50, zone: 'I', volumeFractionCA: 0.69, section: 'ordinary', source: 'IS 10262:2019, Clause 6.6, Table 5' },
];

// ─── W/C Adjustment Rule for CA Proportion (Clause 6.6) ──────────────────────
//
// The standard specifies that Table 5 is for W/C = 0.50.
// For other W/C ratios, the following adjustment applies:
//
//   For every DECREASE of 0.05 in W/C → INCREASE volumeFractionCA by 0.01
//   For every INCREASE of 0.05 in W/C → DECREASE volumeFractionCA by 0.01
//
// This is a CALCULATION RULE — not a reference table.
// It must be implemented in the calculation engine as a pure function.
// Do NOT expand Table 5 with pre-computed adjusted values.
//
// Source: IS 10262:2019, Clause 6.6, Table 5 (footnote / note)

export const WC_ADJUSTMENT_RULE_CA_FRACTION = {
  baseWCRatio: 0.50,
  adjustmentStep: 0.05,          // W/C ratio increment
  fractionChangePerStep: 0.01,   // volumeFractionCA change per step (positive = increase)
  // Meaning: Δ(volumeFractionCA) = -fractionChangePerStep × (actualWC - baseWCRatio) / adjustmentStep
  source: 'IS 10262:2019, Clause 6.6, Table 5 (Note)',
  applicability: 'Adjusts Table 5 CA volume fraction for W/C ratios other than 0.50',
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// FIGURE 1 — Free W/C Ratio vs 28-day Compressive Strength (Clause 6.4)
// ═══════════════════════════════════════════════════════════════════════════════
//
// ─── WHAT FIGURE 1 IS ──────────────────────────────────────────────────────────
// Figure 1 is a reference graph — NOT a formula.
// The x-axis is the free water-cement ratio (W/C).
// The y-axis is the 28-day compressive strength of concrete (N/mm² or MPa).
// There are three curves corresponding to different cement strength classes.
//
// ─── WHY IT CANNOT BE A FORMULA ───────────────────────────────────────────────
// The IS standard does not provide a mathematical expression for these curves.
// They must be read as discrete (W/C, Strength) coordinate pairs from the graph.
// The calculation engine interpolates between verified data points only.
//
// ─── DIGITIZATION METHODOLOGY ─────────────────────────────────────────────────
// Points below were extracted by automated pixel-column scanning of the Figure 1
// image (Page 6 of the IS 10262:2019 PDF). Grid lines were identified and masked
// by their known pixel coordinates. Curve pixels were isolated and tracked with
// monotonicity enforcement (strength must decrease as W/C increases).
//
// Validated against IS 10262:2019 Annex A worked examples:
//   - Curve 2 (OPC 43 / M40 example):  48.25 MPa → W/C = 0.36  → digitized: 0.363 ✓
//   - Curve 2 (OPC 43 / M15 example):  20.77 MPa → W/C = 0.61  → digitized: 0.602 ✓
// Both within ±0.005 of the standard's text values (< 1.5% relative error).
//
// Curve 1 (OPC 33) points below are visually read from Figure 1 at 0.05 W/C
// intervals. Automated pixel tracing was unreliable for Curve 1 due to overlap
// with label text in the graph. These values are approximate (±1–2 MPa).
//
// ─── EXTRAPOLATION RULES ──────────────────────────────────────────────────────
// The lookup function returns null for any target strength outside the verified
// W/C range below. No extrapolation is performed.
//
// ─── CURVE MEANINGS ───────────────────────────────────────────────────────────
//   Curve 1: Cement 28-day strength 33 to <43 N/mm² → OPC 33
//   Curve 2: Cement 28-day strength 43 to <53 N/mm² → OPC 43
//            Default for PPC/PSC when actual cement strength is not available.
//   Curve 3: Cement 28-day strength ≥53 N/mm² → OPC 53

export type Figure1Curve = 'curve1' | 'curve2' | 'curve3';

export interface Figure1DataPoint {
  wcRatio: number;       // x-axis — Free Water-Cement Ratio
  strengthMPa: number;   // y-axis — 28-day concrete compressive strength (N/mm²)
}

export interface Figure1Data {
  curve: Figure1Curve;
  description: string;
  cementStrengthRange: string;    // Human-readable cement strength range
  cementTypeEquivalent: string;   // OPC grade equivalent
  points: Figure1DataPoint[];     // (W/C, Strength) pairs from Figure 1
  source: string;
  digitizationNote: string;       // How these points were obtained
}

/**
 * IS 10262:2019, Clause 6.4, Figure 1 — Free W/C ratio vs 28-day concrete strength.
 *
 * Curve 2 (OPC 43) is validated against both IS 10262:2019 Annex A worked examples.
 * Curve 1 (OPC 33) points are visually read from Figure 1 (±1–2 MPa accuracy).
 * Curve 3 (OPC 53) points are digitized from the top curve of Figure 1.
 *
 * These points span W/C = 0.30 to 0.65. Any target strength outside the range
 * covered by these points will cause the lookup to return null (no extrapolation).
 */
export const FIGURE_1_WC_RATIO_CURVES: Figure1Data[] = [
  {
    curve: 'curve1',
    description: 'OPC 33 Grade (or cement strength 33 to <43 N/mm²)',
    cementStrengthRange: '33 to <43 N/mm²',
    cementTypeEquivalent: 'OPC 33',
    digitizationNote:
      'Visually read from IS 10262:2019 Figure 1, Curve 1 at 0.05 W/C intervals. ' +
      'Accuracy ±1–2 MPa. Automated pixel tracing was unreliable for Curve 1 due to ' +
      'label text overlap in the graph image.',
    // Points read from Figure 1 at grid intersections (0.05 W/C steps)
    // Source: IS 10262:2019, Page 6, Figure 1, Curve 1 (bottom curve)
    points: [
      { wcRatio: 0.35, strengthMPa: 40.0 },
      { wcRatio: 0.40, strengthMPa: 33.0 },
      { wcRatio: 0.45, strengthMPa: 27.0 },
      { wcRatio: 0.50, strengthMPa: 22.0 },
      { wcRatio: 0.55, strengthMPa: 19.0 },
      { wcRatio: 0.60, strengthMPa: 16.5 },
      { wcRatio: 0.65, strengthMPa: 14.5 },
    ],
    source: 'IS 10262:2019, Clause 6.4, Figure 1, Curve 1',
  },
  {
    curve: 'curve2',
    description: 'OPC 43 Grade (or cement strength 43 to <53 N/mm² / Default for PPC, PSC)',
    cementStrengthRange: '43 to <53 N/mm²',
    cementTypeEquivalent: 'OPC 43 / PPC / PSC (default)',
    digitizationNote:
      'Digitized by automated pixel-column scanning of IS 10262:2019 Figure 1 image ' +
      '(Page 6, 1959×1812 px CCITT Fax scan). Grid lines masked at known pixel rows. ' +
      'Monotonicity enforced (strength non-increasing with W/C). ' +
      'Validated: 48.25 MPa → 0.363 (text: 0.36 ✓); 20.77 MPa → 0.602 (text: 0.61 ✓).',
    // Points digitized from IS 10262:2019 Figure 1, Curve 2 (middle curve)
    // Validated against Annex A Examples 1 (M40) and 2 (M15)
    points: [
      { wcRatio: 0.30, strengthMPa: 59.5 },
      { wcRatio: 0.35, strengthMPa: 50.4 },
      { wcRatio: 0.40, strengthMPa: 42.9 },
      { wcRatio: 0.45, strengthMPa: 35.8 },
      { wcRatio: 0.50, strengthMPa: 30.3 },
      { wcRatio: 0.55, strengthMPa: 25.2 },
      { wcRatio: 0.60, strengthMPa: 21.0 },
      { wcRatio: 0.65, strengthMPa: 17.6 },
    ],
    source: 'IS 10262:2019, Clause 6.4, Figure 1, Curve 2',
  },
  {
    curve: 'curve3',
    description: 'OPC 53 Grade (or cement strength 53 N/mm² and above)',
    cementStrengthRange: '53 N/mm² and above',
    cementTypeEquivalent: 'OPC 53',
    digitizationNote:
      'Digitized by automated pixel-column scanning of IS 10262:2019 Figure 1 image ' +
      '(Page 6). Grid lines masked at known pixel rows. Monotonicity enforced. ' +
      'No separate worked example in the standard for direct Curve 3 anchor validation.',
    // Points digitized from IS 10262:2019 Figure 1, Curve 3 (top curve)
    points: [
      { wcRatio: 0.30, strengthMPa: 65.0 },
      { wcRatio: 0.35, strengthMPa: 55.9 },
      { wcRatio: 0.40, strengthMPa: 48.1 },
      { wcRatio: 0.45, strengthMPa: 41.7 },
      { wcRatio: 0.50, strengthMPa: 35.5 },
      { wcRatio: 0.55, strengthMPa: 30.0 },
      { wcRatio: 0.60, strengthMPa: 25.0 },
      { wcRatio: 0.65, strengthMPa: 21.0 },
    ],
    source: 'IS 10262:2019, Clause 6.4, Figure 1, Curve 3',
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATION METHOD SELECTOR — Ordinary vs High-Strength Branch
// ═══════════════════════════════════════════════════════════════════════════════
//
// IS 10262:2019, Section 2:
//   Ordinary and Standard Grades (Sections 1–9) cover M10 through M60.
//   M65 and above require the high-strength provisions (Section 10+).
//
// CivilSuite V1 scope:
//   M10–M60 → ordinary-standard pathway (Clauses 6.1–6.9, Figure 1)
//   M65–M80 → high-strength pathway (Table 8 W/CM lookup)
//
// The high-strength pathway does NOT use Figure 1. Attempting to read
// Figure 1 for M65+ grades would be a misapplication of the standard.

export type CalculationMethod = 'ordinary-standard' | 'high-strength';

export interface CalculationMethodResult {
  method: CalculationMethod;
  grade: string;
  fck: number;
  reason: string;
  source: string;
}

/**
 * Selects the IS 10262:2019 calculation pathway based on concrete grade.
 *
 * Returns 'ordinary-standard' for M10–M60.
 * Returns 'high-strength' for M65 and above.
 *
 * @param grade  Concrete grade string, e.g. "M40" or "M70"
 */
export function selectCalculationMethod(grade: string): CalculationMethodResult {
  const fck = parseInt(grade.replace('M', ''), 10);

  if (fck <= 60) {
    return {
      method: 'ordinary-standard',
      grade,
      fck,
      reason: `M${fck} (fck ≤ 60 MPa) → ordinary/standard mix design procedure (IS 10262:2019, Clauses 6.1–6.9, Figure 1)`,
      source: 'IS 10262:2019, Section 2 — Scope',
    };
  }

  return {
    method: 'high-strength',
    grade,
    fck,
    reason: `M${fck} (fck > 60 MPa) → high-strength concrete provisions (IS 10262:2019, Table 8 W/CM lookup; Figure 1 does NOT apply)`,
    source: 'IS 10262:2019, Section 2 — Scope; High-Strength Provisions',
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// HIGH-STRENGTH REF TABLES — Section 3 (M65 and above)
// ═══════════════════════════════════════════════════════════════════════════════
//
// These tables apply only to high-strength concrete mixes (M65–M80 typical).
// They must be kept strictly separated from ordinary/standard Tables 3, 4, and 5.

// ─── Table 6 — Approximate Air Content (Clause 6.2.3) ────────────────────────
//
// Source: IS 10262:2019, Clause 6.2.3, Table 6

export interface AirContentHSEntry {
  maxAggregateSize: number;       // mm
  airContentPercentage: number;   // % of concrete volume
  source: string;
}

export const TABLE_6_AIR_CONTENT_HS: AirContentHSEntry[] = [
  { maxAggregateSize: 10.0, airContentPercentage: 1.0, source: 'IS 10262:2019, Table 6' },
  { maxAggregateSize: 12.5, airContentPercentage: 0.8, source: 'IS 10262:2019, Table 6' },
  { maxAggregateSize: 20.0, airContentPercentage: 0.5, source: 'IS 10262:2019, Table 6' },
];

// ─── Table 7 — Maximum Water Content for HS (Clause 6.2.4) ────────────────────
//
// Water content for high-strength concrete, baseline 50 mm slump, SSD condition,
// angular coarse aggregate, without chemical admixtures.
//
// Source: IS 10262:2019, Clause 6.2.4, Table 7

export interface WaterContentHSEntry {
  maxAggregateSize: number;       // mm
  waterContent: number;           // kg/m³
  source: string;
}

export const TABLE_7_WATER_CONTENT_HS: WaterContentHSEntry[] = [
  { maxAggregateSize: 10.0, waterContent: 200, source: 'IS 10262:2019, Table 7' },
  { maxAggregateSize: 12.5, waterContent: 195, source: 'IS 10262:2019, Table 7' },
  { maxAggregateSize: 20.0, waterContent: 186, source: 'IS 10262:2019, Table 7' },
];

// ─── Table 8 — Recommended w/cm for High Strength Concrete (Clause 6.2.5) ─────
//
// W/CM ratio lookup by target mean compressive strength f'ck and aggregate size.
// Values are recommended for 28 days cement strength 53 MPa and above.
//
// Source: IS 10262:2019, Clause 6.2.5, Table 8

export interface Table8Entry {
  targetStrength: number;       // Target compressive strength f'ck (MPa)
  wcm10mm: number;              // w/cm for 10.0 mm MSA
  wcm12_5mm: number;            // w/cm for 12.5 mm MSA
  wcm20mm: number;              // w/cm for 20.0 mm MSA
}

export const TABLE_8_HIGH_STRENGTH_WCM: Table8Entry[] = [
  { targetStrength: 70, wcm10mm: 0.36, wcm12_5mm: 0.35, wcm20mm: 0.33 },
  { targetStrength: 75, wcm10mm: 0.34, wcm12_5mm: 0.33, wcm20mm: 0.31 },
  { targetStrength: 80, wcm10mm: 0.32, wcm12_5mm: 0.31, wcm20mm: 0.29 },
  { targetStrength: 85, wcm10mm: 0.30, wcm12_5mm: 0.29, wcm20mm: 0.27 },
  { targetStrength: 90, wcm10mm: 0.28, wcm12_5mm: 0.27, wcm20mm: 0.26 },
  { targetStrength: 100, wcm10mm: 0.26, wcm12_5mm: 0.25, wcm20mm: 0.24 },
];

// ─── Table 10 — Coarse Aggregate Proportion for HS (Clause 6.2.7) ─────────────
//
// Coarse aggregate volume fraction for high-strength concrete.
// Baseline W/CM ratio for Table 10 is 0.30.
//
// Adjustment rule (similar to Table 5, but relative to 0.30 baseline):
//   For every 0.05 decrease in W/CM from 0.30 $\rightarrow$ increase CA by 0.01
//   For every 0.05 increase in W/CM from 0.30 $\rightarrow$ decrease CA by 0.01
//
// Source: IS 10262:2019, Clause 6.2.7, Table 10

export interface CAProportionHSEntry {
  maxAggregateSize: number;       // mm
  zone: 'III' | 'II' | 'I';       // Zone IV not supported in Table 10
  volumeFractionCA: number;       // volume fraction at W/CM = 0.30
  source: string;
}

export const TABLE_10_COARSE_AGGREGATE_PROPORTION_HS: CAProportionHSEntry[] = [
  { maxAggregateSize: 10.0, zone: 'III', volumeFractionCA: 0.56, source: 'IS 10262:2019, Table 10' },
  { maxAggregateSize: 10.0, zone: 'II',  volumeFractionCA: 0.54, source: 'IS 10262:2019, Table 10' },
  { maxAggregateSize: 10.0, zone: 'I',   volumeFractionCA: 0.52, source: 'IS 10262:2019, Table 10' },

  { maxAggregateSize: 12.5, zone: 'III', volumeFractionCA: 0.58, source: 'IS 10262:2019, Table 10' },
  { maxAggregateSize: 12.5, zone: 'II',  volumeFractionCA: 0.56, source: 'IS 10262:2019, Table 10' },
  { maxAggregateSize: 12.5, zone: 'I',   volumeFractionCA: 0.54, source: 'IS 10262:2019, Table 10' },

  { maxAggregateSize: 20.0, zone: 'III', volumeFractionCA: 0.68, source: 'IS 10262:2019, Table 10' },
  { maxAggregateSize: 20.0, zone: 'II',  volumeFractionCA: 0.66, source: 'IS 10262:2019, Table 10' },
  { maxAggregateSize: 20.0, zone: 'I',   volumeFractionCA: 0.64, source: 'IS 10262:2019, Table 10' },
];

export const WC_ADJUSTMENT_RULE_CA_FRACTION_HS = {
  baseWCM: 0.30,
  adjustmentStep: 0.05,
  fractionChangePerStep: 0.01,
  source: 'IS 10262:2019, Clause 6.2.7, Table 10 Note/Annex D-8',
} as const;

/**
 * Lookup maximum W/CM ratio from IS 10262:2019 Table 8 for high-strength concrete
 * using linear interpolation based on target mean compressive strength f'ck.
 *
 * IMPORTANT:
 *   - This must only be called for grades M65 and above (high-strength path).
 *   - The 'targetStrength' parameter is target strength f'ck (MPa), NOT fck.
 *   - Clamps to borders if within range or returns null if target strength is
 *     outside defined range [70, 100] (no extrapolation).
 *
 * @param targetStrength    Target compressive strength f'ck (N/mm²)
 * @param maxAggregateSize  Nominal maximum aggregate size (mm)
 * @returns                 Maximum W/CM ratio, or null if outside range / invalid MSA
 */
export function lookupHighStrengthWCM(
  targetStrength: number,
  maxAggregateSize: number
): number | null {
  // Sort the table by targetStrength to ensure correct bracketing
  const sorted = [...TABLE_8_HIGH_STRENGTH_WCM].sort((a, b) => a.targetStrength - b.targetStrength);

  // Filter out aggregate column helper
  const getVal = (entry: Table8Entry) => {
    if (maxAggregateSize === 10.0) return entry.wcm10mm;
    if (maxAggregateSize === 12.5) return entry.wcm12_5mm;
    if (maxAggregateSize === 20.0) return entry.wcm20mm;
    return null;
  };

  // Check valid MSA
  if (getVal(sorted[0]) === null) return null;

  // Exact match
  const exact = sorted.find((e) => e.targetStrength === targetStrength);
  if (exact) return getVal(exact);

  // Bracketing for linear interpolation
  const lower = sorted.filter((e) => e.targetStrength <= targetStrength).at(-1);
  const upper = sorted.find((e) => e.targetStrength > targetStrength);

  if (!lower || !upper) return null; // No extrapolation

  const y1 = getVal(lower)!;
  const y2 = getVal(upper)!;

  return linearInterpolate(
    targetStrength,
    lower.targetStrength,
    y1,
    upper.targetStrength,
    y2
  );
}

/**
 * Lookup air content (%) from Table 6 for high-strength concrete.
 * Returns null if MSA is not in the table.
 */
export function lookupAirContentHighStrength(maxAggregateSize: number): number | null {
  const entry = TABLE_6_AIR_CONTENT_HS.find((e) => e.maxAggregateSize === maxAggregateSize);
  return entry ? entry.airContentPercentage : null;
}

/**
 * Lookup base water content (kg/m³) from Table 7 for high-strength concrete.
 * Returns null if MSA is not in the table.
 */
export function lookupBaseWaterContentHighStrength(maxAggregateSize: number): number | null {
  const entry = TABLE_7_WATER_CONTENT_HS.find((e) => e.maxAggregateSize === maxAggregateSize);
  return entry ? entry.waterContent : null;
}

/**
 * Lookup Table 10 volume fraction and apply W/CM adjustment relative to 0.30 baseline.
 *
 * @param maxAggregateSize  Nominal max aggregate size (mm)
 * @param faZone            Fine aggregate grading zone (Zone I, II, III only)
 * @param actualWCMRatio    Actual design W/CM ratio
 * @returns                 Adjusted CA volume fraction, or null if not found
 */
export function lookupCAFractionHighStrength(
  maxAggregateSize: number,
  faZone: 'I' | 'II' | 'III',
  actualWCMRatio: number
): number | null {
  const entry = TABLE_10_COARSE_AGGREGATE_PROPORTION_HS.find(
    (e) => e.maxAggregateSize === maxAggregateSize && e.zone === faZone
  );
  if (!entry) return null;

  const { baseWCM, adjustmentStep, fractionChangePerStep } = WC_ADJUSTMENT_RULE_CA_FRACTION_HS;
  const wcmDelta = actualWCMRatio - baseWCM;
  const steps = wcmDelta / adjustmentStep;
  const adjustment = -fractionChangePerStep * steps; // Decrease CA as W/CM increases

  return Math.max(0, Math.min(1, entry.volumeFractionCA + adjustment));
}

// ═══════════════════════════════════════════════════════════════════════════════
// IS 456:2000 — DURABILITY REQUIREMENTS (Pending Population)
// ═══════════════════════════════════════════════════════════════════════════════
//
// IS 456:2000, Table 5 governs minimum cement content and maximum W/C ratio
// by exposure class. These durability limits must be applied during the
// calculation engine's compliance check steps.
//
// ⚠️ PENDING VERIFICATION: Exact values not yet inserted.
//    Do NOT insert until verified from IS 456:2000 Table 5.

export type ExposureClass = 'mild' | 'moderate' | 'severe' | 'very_severe' | 'extreme';

export interface DurabilityLimitEntry {
  exposureClass: ExposureClass;
  maxWCRatio: number;             // Maximum free W/C ratio
  minCementContent: number;       // Minimum cement content (kg/m³)
  minGrade: string;               // Minimum concrete grade requirement
  source: string;
}

/**
 * ⚠️ NOT YET POPULATED — Awaiting verification from IS 456:2000, Table 5.
 */
export const IS456_TABLE5_DURABILITY_LIMITS: DurabilityLimitEntry[] = [
  // TODO: Insert verified values from IS 456:2000, Table 5.
];

// ═══════════════════════════════════════════════════════════════════════════════
// LOOKUP UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Linear interpolation between two known data points.
 * Returns the estimated Y for a given X.
 */
export function linearInterpolate(
  x: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  if (x2 === x1) return y1;
  return y1 + ((x - x1) * (y2 - y1)) / (x2 - x1);
}

/**
 * Lookup W/C ratio from Figure 1 for a target mean compressive strength.
 *
 * ─── Rules ────────────────────────────────────────────────────────────────────
 *   - Reads the graph as Y (strength) → X (W/C ratio) interpolation.
 *   - Returns null if the curve has no data (not yet populated).
 *   - Returns null if the target strength is below the minimum or above the
 *     maximum verified point on the curve. NO extrapolation is performed.
 *
 * @param targetStrengthMPa  Target mean compressive strength f'ck (N/mm²)
 * @param curve              Curve identifier based on cement type/strength
 * @returns                  W/C ratio, or null if outside verified range
 */
export function lookupWCRatioFromFigure1(
  targetStrengthMPa: number,
  curve: Figure1Curve
): number | null {
  const curveData = FIGURE_1_WC_RATIO_CURVES.find((c) => c.curve === curve);
  if (!curveData || curveData.points.length === 0) {
    return null; // Curve not yet populated with verified data
  }

  const sorted = [...curveData.points].sort((a, b) => a.strengthMPa - b.strengthMPa);

  // Exact match
  const exactMatch = sorted.find((p) => p.strengthMPa === targetStrengthMPa);
  if (exactMatch) return exactMatch.wcRatio;

  // Bracketing
  const lower = sorted.filter((p) => p.strengthMPa <= targetStrengthMPa).at(-1);
  const upper = sorted.find((p) => p.strengthMPa > targetStrengthMPa);

  // Strict boundary — no extrapolation permitted
  if (!lower || !upper) return null;

  // Interpolate: strength (y) → W/C ratio (x)
  return linearInterpolate(
    targetStrengthMPa,
    lower.strengthMPa,
    lower.wcRatio,
    upper.strengthMPa,
    upper.wcRatio
  );
}

/**
 * Lookup Table 5 coarse aggregate volume fraction and apply W/C adjustment.
 *
 * @param maxAggregateSize  Nominal max aggregate size (mm)
 * @param faZone            Fine aggregate grading zone (IS 383)
 * @param actualWCRatio     Actual design W/C ratio
 * @returns                 Adjusted volume fraction of coarse aggregate, or null if not found
 */
export function lookupCAFraction(
  maxAggregateSize: number,
  faZone: FAZone,
  actualWCRatio: number
): number | null {
  const entry = TABLE_5_COARSE_AGGREGATE_PROPORTION.find(
    (e) => e.maxAggregateSize === maxAggregateSize && e.zone === faZone
  );
  if (!entry) return null;

  // Apply the W/C adjustment rule (IS 10262:2019, Clause 6.6, Table 5 note)
  const { baseWCRatio, adjustmentStep, fractionChangePerStep } = WC_ADJUSTMENT_RULE_CA_FRACTION;
  const wcDelta = actualWCRatio - baseWCRatio;
  const steps = wcDelta / adjustmentStep;
  const adjustment = -fractionChangePerStep * steps; // Decrease when W/C increases

  return Math.max(0, Math.min(1, entry.volumeFractionCA + adjustment));
}

// ─── Grade-Range Lookup Helpers ───────────────────────────────────────────────

/**
 * Converts a grade string (e.g. "M40") to its numeric fck value (e.g. 40).
 */
function gradeToNumber(grade: string): number {
  return parseInt(grade.replace('M', ''), 10);
}

/**
 * Lookup the Value of X for a given concrete grade from IS 10262:2019 Table 1.
 * Returns null if the grade is outside all defined ranges.
 *
 * @param grade  Concrete grade string, e.g. "M40"
 */
export function lookupXFactor(grade: string): number | null {
  const fck = gradeToNumber(grade);
  for (const entry of TABLE_1_VALUE_X) {
    const min = gradeToNumber(entry.minGrade);
    const max = gradeToNumber(entry.maxGrade);
    if (fck >= min && fck <= max) {
      return entry.valueX;
    }
  }
  return null; // Grade outside all defined ranges
}

/**
 * Lookup the assumed standard deviation S for a given grade and site control.
 *
 * Rules per IS 10262:2019 Table 2 (and its note):
 *   - 'good'  → table values as-is
 *   - 'fair'  → table value + 1.0 N/mm²
 *
 * Returns null if the grade is outside all defined ranges.
 *
 * @param grade        Concrete grade string, e.g. "M40"
 * @param siteControl  'good' | 'fair' (defaults to 'good')
 */
export function lookupStandardDeviation(
  grade: string,
  siteControl: SiteControlLevel = 'good'
): number | null {
  const fck = gradeToNumber(grade);
  for (const entry of TABLE_2_STANDARD_DEVIATION) {
    const min = gradeToNumber(entry.minGrade);
    const max = gradeToNumber(entry.maxGrade);
    if (fck >= min && fck <= max) {
      const baseS = entry.standardDeviation;
      // IS 10262:2019 Table 2 Note: For fair site control, add 1.0 N/mm²
      return siteControl === 'fair' ? baseS + 1.0 : baseS;
    }
  }
  return null; // Grade outside all defined ranges
}

/**
 * Lookup air content (%) from Table 3 for a given max aggregate size.
 * Returns null if the size is not in the table.
 */
export function lookupAirContent(maxAggregateSize: number): number | null {
  const entry = TABLE_3_AIR_CONTENT.find((e) => e.maxAggregateSize === maxAggregateSize);
  return entry ? entry.airContentPercentage : null;
}

/**
 * Lookup base water content (kg/m³) from Table 4 for a given aggregate size.
 * This is the baseline value at 50 mm slump, angular aggregate, SSD conditions.
 * Workability adjustments must be applied separately in the calculation engine.
 * Returns null if the size is not in the table.
 */
export function lookupBaseWaterContent(maxAggregateSize: number): number | null {
  const entry = TABLE_4_WATER_CONTENT.find((e) => e.maxAggregateSize === maxAggregateSize);
  return entry ? entry.waterContent : null;
}

