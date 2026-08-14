/**
 * Step 3b: Durability W/C Limit Check
 * IS 456:2000 — Table 5 (Durability Limits by Exposure Class)
 * IS 10262:2019 — Clause 6.4
 *
 * The final (adopted) W/C ratio is the LOWER of:
 *   - The strength-based W/C (from Figure 1)
 *   - The maximum W/C permitted by durability (from IS 456:2000 Table 5)
 *
 * This function does NOT hardcode IS 456:2000 exposure values.
 * The durability limit must be passed in from the reference-data layer
 * once IS 456:2000 Table 5 is verified and populated.
 *
 * Source: IS 10262:2019, Clause 6.4; IS 456:2000, Table 5
 */

// ─── Durability Limit Result ─────────────────────────────────────────────────

export type DurabilityControllingLimit =
  | 'strength'     // Strength-based W/C governs (lower)
  | 'durability'   // Durability limit governs (lower)
  | 'equal';       // Both happen to be the same

export interface DurabilityLimitResult {
  status: 'calculated' | 'reference-data-required';
  strengthBasedWC: number | null;
  durabilityMaximumWC: number | null;
  finalWC: number | null;
  controllingLimit: DurabilityControllingLimit | null;
  message: string;
  source: string;
}

// ─── Implementation ──────────────────────────────────────────────────────────

/**
 * Compares the strength-based W/C ratio against the durability maximum W/C
 * and returns the governing (lower) value.
 *
 * @param strengthBasedWC      W/C from Figure 1 interpolation (null if not available)
 * @param durabilityMaximumWC  Max W/C from IS 456:2000 Table 5 (null if not loaded)
 */
export function applyDurabilityLimit(
  strengthBasedWC: number | null,
  durabilityMaximumWC: number | null
): DurabilityLimitResult {

  // ─── Both values required ─────────────────────────────────────────────
  if (strengthBasedWC === null && durabilityMaximumWC === null) {
    return {
      status: 'reference-data-required',
      strengthBasedWC: null,
      durabilityMaximumWC: null,
      finalWC: null,
      controllingLimit: null,
      message: 'Cannot apply durability check: both strength-based W/C and durability W/C are unavailable.',
      source: 'IS 10262:2019, Clause 6.4; IS 456:2000, Table 5',
    };
  }

  if (strengthBasedWC === null) {
    return {
      status: 'reference-data-required',
      strengthBasedWC: null,
      durabilityMaximumWC,
      finalWC: null,
      controllingLimit: null,
      message: 'Cannot apply durability check: strength-based W/C is not yet available (Figure 1 data required).',
      source: 'IS 10262:2019, Clause 6.4; IS 456:2000, Table 5',
    };
  }

  if (durabilityMaximumWC === null) {
    return {
      status: 'reference-data-required',
      strengthBasedWC,
      durabilityMaximumWC: null,
      finalWC: null,
      controllingLimit: null,
      message: 'Cannot apply durability check: IS 456:2000 Table 5 durability limits are not yet populated.',
      source: 'IS 10262:2019, Clause 6.4; IS 456:2000, Table 5',
    };
  }

  // ─── Both values available: compare ──────────────────────────────────
  const finalWC = Math.min(strengthBasedWC, durabilityMaximumWC);
  let controllingLimit: DurabilityControllingLimit;

  if (finalWC === durabilityMaximumWC && finalWC === strengthBasedWC) {
    controllingLimit = 'equal';
  } else if (finalWC === durabilityMaximumWC) {
    controllingLimit = 'durability';
  } else {
    controllingLimit = 'strength';
  }

  const controlledBy =
    controllingLimit === 'durability'
      ? `IS 456:2000 durability limit (${durabilityMaximumWC})`
      : controllingLimit === 'equal'
      ? 'both limits are equal'
      : `Figure 1 strength-based value (${strengthBasedWC.toFixed(4)})`;

  return {
    status: 'calculated',
    strengthBasedWC,
    durabilityMaximumWC,
    finalWC,
    controllingLimit,
    message: [
      `Strength-based W/C = ${strengthBasedWC.toFixed(4)}`,
      `Durability max W/C  = ${durabilityMaximumWC}  (IS 456:2000 Table 5)`,
      `Final adopted W/C   = min(${strengthBasedWC.toFixed(4)}, ${durabilityMaximumWC}) = ${finalWC.toFixed(4)}`,
      `Controlled by: ${controlledBy}`,
    ].join('\n'),
    source: 'IS 10262:2019, Clause 6.4; IS 456:2000, Table 5',
  };
}
