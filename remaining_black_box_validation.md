# Remaining Black-Box Validation Results (T6B, T7, T8)

## 1. Executive Summary

**REMAINING TESTS VALIDATION = PASS**

Tests T6B, T7, and T8 were executed using the exact calculation pipeline (`runMixDesignCalculation`) as previously defined. The outputs have been rigorously compared against the expected values from the previous black-box audit.

There are no discrepancies, calculation defects, or presentation errors.

## 2. Test Execution Details & Comparison

### TEST 6B — PPC WITHOUT ACTUAL STRENGTH
**Status: PASS**
- **Target Strength:** 38.25 MPa (Match)
- **Design Water:** 197 kg/m³ (Match)
- **W/C Ratio:** 0.4327 (Match)
- **Cement:** 455 kg/m³ (Match)
- **Batch FA:** 611.9 kg/m³ (Match)
- **Batch CA:** 1082.6 kg/m³ (Match)
- **Batch Water:** 208.5 kg/m³ (Match)
- **Admixture:** 0 kg/m³ (Match)
- **Air Content:** from Table 3 (ordinary) (Match)
- **Yield:** 1.0001 m³ (Match)
- **Fresh Density:** 2358.0 kg/m³ (Match)
- **Cement Compliance:** fail (Match)

### TEST 7 — DURABILITY / W-C OVERRIDE
**Status: PASS**
- **Target Strength:** 48.25 MPa (Match)
- **Design Water:** 197 kg/m³ (Match)
- **W/C Ratio:** 0.3643 (Match) — The engine correctly rejected the invalid override of 0.50 (durability limit 0.40) and safely adopted the strength-governed W/C.
- **Cement:** 541 kg/m³ (Match)
- **Batch FA:** 560.3 kg/m³ (Match)
- **Batch CA:** 1054.7 kg/m³ (Match)
- **Batch Water:** 209.0 kg/m³ (Match)
- **Admixture:** 0 kg/m³ (Match)
- **Air Content:** from Table 3 (ordinary) (Match)
- **Yield:** 1.0001 m³ (Match)
- **Fresh Density:** 2365.0 kg/m³ (Match)
- **Cement Compliance:** fail (Match)

### TEST 8 — COMBINED STRESS TEST
**Status: PASS**
- **Target Strength:** 48.25 MPa (Match)
- **Design Water:** 148 kg/m³ (Match)
- **W/C Ratio:** 0.3500 (Match)
- **Cement:** 423 kg/m³ (Match)
- **Batch FA:** 777.2 kg/m³ (Match)
- **Batch CA:** 1148.7 kg/m³ (Match)
- **Batch Water:** 127.0 kg/m³ (Match)
- **Admixture:** 5.38 kg/m³ (Match)
- **Air Content:** from Table 3 (ordinary) (Match)
- **Yield:** 1.0000 m³ (Match)
- **Fresh Density:** 2481.3 kg/m³ (Match)
- **Cement Compliance:** pass (Match)

## 3. Regression Suite Verification

- **`scripts/final_black_box_validation.ts`**: Re-executed successfully. The full consolidated table outputs for all 8 tests remain identical to the previous execution.
- **`npm test`**: Executed successfully. 156 tests passing, 0 failures.

No code modifications were required, as the engine performed exactly as intended.
