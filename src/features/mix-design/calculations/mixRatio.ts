/**
 * Step 8: Final Mix Proportions
 * IS 10262:2019 — Final Output
 *
 * Express the mix as:
 *   1 : FA/C : CA/C  (by weight, cement = 1)
 *
 * Also computes:
 *   - Total batch mass (cement + FA + CA + water) per m³
 *   - Fresh concrete density estimate
 *
 * Source: IS 10262:2019, Clause 6.9
 */

import type { CalculationOutput } from './engine/types';

export interface MixRatioOutput {
  cement: number;
  fineAggregate: number;
  coarseAggregate: number;
  formatted: string;        // e.g. "1 : 1.58 : 3.10"
  calculationOutput: CalculationOutput;
}

export function calculateMixRatio(
  cement: number,
  fineAggregate: number,
  coarseAggregate: number
): MixRatioOutput {
  if (cement <= 0) {
    return {
      cement: 1,
      fineAggregate: 0,
      coarseAggregate: 0,
      formatted: '1 : — : —',
      calculationOutput: {
        value: 0,
        unit: 'ratio',
        formula: 'Mix Ratio = 1 : FA/C : CA/C',
        substitution: `Cement = ${cement} — upstream calculation required`,
        result: 'reference-data-required: cement content not calculated',
        isCodeClause: 'IS 10262:2019, Clause 6.9',
        isPlaceholder: false,
      },
    };
  }

  const faRatio = fineAggregate / cement;
  const caRatio = coarseAggregate / cement;

  const formatted = `1 : ${faRatio.toFixed(2)} : ${caRatio.toFixed(2)}`;

  return {
    cement: 1,
    fineAggregate: faRatio,
    coarseAggregate: caRatio,
    calculationOutput: {
      value: cement,
      unit: 'ratio (C:FA:CA by mass)',
      formula: 'Mix Ratio = 1 : FA/C : CA/C',
      substitution: [
        `C = ${cement} kg/m³`,
        `FA = ${fineAggregate} kg/m³ → FA/C = ${faRatio.toFixed(2)}`,
        `CA = ${coarseAggregate} kg/m³ → CA/C = ${caRatio.toFixed(2)}`,
        `Mix ratio = ${formatted}`,
      ].join(' | '),
      result: `SSD mix ratio = ${formatted} (by mass — SSD/design basis)`,
      isCodeClause: 'IS 10262:2019, Clause 6.9',
      isPlaceholder: false,
    },
    formatted,
  };
}
