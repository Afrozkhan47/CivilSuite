# CivilSuite — Phase 6.5 End-to-End Engineering Scenario Audit Report

> [!IMPORTANT]
> **READ-ONLY AUDIT CONFIRMATION**
> Zero production source files were modified during this audit. All calculation formulas, reference-data constants, types, persistence schemas, UI step components, and PDF exporters remain 100% frozen and untouched.

---

## 1. Executive Summary

This report documents the **Phase 6.5 End-to-End Engineering Scenario Audit** for CivilSuite. The audit evaluated all 17 specified engineering mix design scenarios, verified saved-project persistence and hydration runtime behavior, and checked PDF export data-binding against the frozen calculation engine.

### Overall Verdict: **PASS** (Zero Discrepancies)
- **17 / 17 Scenarios Passed**: Every valid scenario calculated exact expected values, and every invalid scenario ($12.5\text{ mm}$ Ordinary, $16\text{ mm}$, $25\text{ mm}$) was blocked by defensive validation.
- **Saved Projects & Hydration**: State preservation, legacy migration idempotency, and re-calculation consistency are 100% verified.
- **PDF Export Integrity**: PDF export consumes canonical result fields without independent rounded arithmetic.
- **Regression Suite**: All 189 Vitest unit tests, TypeScript compilation, Next.js build, 259,200 Cartesian harness, 7,718 submatrix suite, `p6` 3-case comparison, and persistence audit script passed with zero errors.

---

## 2. 17-Scenario End-to-End Audit Matrix

| ID | Scenario Description | Expected Domain Action | Actual Action | Design Water | Cement | W/C Ratio | SSD FA | SSD CA | SSD Mix Ratio | Batch Water | Batch FA | Batch CA | Status |
|:---:|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **1** | M40 + 20mm + Angular | Execute | Executed | 157 kg | 430 kg | 0.3643 | 750 kg | 1066 kg | 1 : 1.75 : 2.48 | 169.4 kg | 743.1 kg | 1061.2 kg | **PASS** |
| **2** | M40 + 20mm + Sub-angular | Execute | Executed | 157 kg | 430 kg | 0.3643 | 750 kg | 1066 kg | 1 : 1.75 : 2.48 | 169.4 kg | 743.1 kg | 1061.2 kg | **PASS** |
| **3** | M40 + 20mm + Partially Rounded | Execute | Executed | 144 kg | 395 kg | 0.3643 | 778 kg | 1106 kg | 1 : 1.97 : 2.80 | 157.2 kg | 770.6 kg | 1100.5 kg | **PASS** |
| **4** | M40 + 20mm + Rounded | Execute | Executed | 140 kg | 384 kg | 0.3643 | 788 kg | 1119 kg | 1 : 2.05 : 2.92 | 153.2 kg | 779.8 kg | 1113.6 kg | **PASS** |
| **5** | M70 + 12.5mm High Strength | Execute | Executed | 147 kg | 475 kg | 0.3104 | 888 kg | 913 kg | 1 : 1.87 : 1.92 | 160.7 kg | 879.5 kg | 908.2 kg | **PASS** |
| **6** | M40 + 12.5mm Ordinary | **MUST BLOCK** | **BLOCKED** | — | — | — | — | — | — | — | — | — | **PASS** |
| **7** | Any Grade + 16mm | **MUST BLOCK** | **BLOCKED** | — | — | — | — | — | — | — | — | — | **PASS** |
| **8** | Any Grade + 25mm | **MUST BLOCK** | **BLOCKED** | — | — | — | — | — | — | — | — | — | **PASS** |
| **9** | M40 + WR 0% | Execute | Executed | 179 kg | 491 kg | 0.3643 | 701 kg | 997 kg | 1 : 1.43 : 2.03 | 190.9 kg | 694.4 kg | 991.7 kg | **PASS** |
| **10** | M40 + WR 21.8826% | Execute | Executed | 140 kg | 384 kg | 0.3643 | 788 kg | 1119 kg | 1 : 2.05 : 2.92 | 153.2 kg | 779.8 kg | 1113.6 kg | **PASS** |
| **11** | Pumped Concrete ON | Execute | Executed | 140 kg | 384 kg | 0.3643 | 788 kg | 1119 kg | 1 : 2.05 : 2.92 | 153.2 kg | 779.8 kg | 1113.6 kg | **PASS** |
| **12** | Pumped Concrete OFF | Execute | Executed | 140 kg | 384 kg | 0.3643 | 666 kg | 1244 kg | 1 : 1.73 : 3.24 | 152.6 kg | 658.9 kg | 1237.4 kg | **PASS** |
| **13** | Air Entrained OFF | Execute | Executed | 140 kg | 384 kg | 0.3643 | 788 kg | 1119 kg | 1 : 2.05 : 2.92 | 153.2 kg | 779.8 kg | 1113.6 kg | **PASS** |
| **14** | Air Entrained ON (target 5%) | Execute | Executed | 133 kg | 365 kg | 0.3643 | 758 kg | 1077 kg | 1 : 2.08 : 2.95 | 145.9 kg | 750.7 kg | 1072.0 kg | **PASS** |
| **15** | Moisture Correction (FA 2%, CA 1%) | Execute | Executed | 140 kg | 384 kg | 0.3643 | 788 kg | 1119 kg | 1 : 2.05 : 2.92 | 112.8 kg | 803.3 kg | 1130.4 kg | **PASS** |
| **16** | Historical P6 Case | Execute | Executed | 144 kg | 395 kg | 0.3643 | 778 kg | 1106 kg | 1 : 1.97 : 2.80 | 157.2 kg | 770.6 kg | 1100.5 kg | **PASS** |
| **17** | Current Rounded WR 0% | Execute | Executed | 179 kg | 491 kg | 0.3643 | 701 kg | 997 kg | 1 : 1.43 : 2.03 | 190.9 kg | 694.4 kg | 991.7 kg | **PASS** |

---

## 3. Saved Project & Hydration Audit

### Architecture Inspection (`src/store/useProjectStore.ts`)
- **Key**: `"civilsuite-projects"`
- **Version**: `2`
- **Hydration Flow**:
  1. `getProject(id)` retrieves project JSON.
  2. `loadProjectIntoForm(id)` hydrates Zustand form state.
  3. `migrateProject(persistedState)` ensures legacy projects (`schemaVersion === undefined`) migrate `rounded` aggregate shape to `partially_rounded` while leaving new projects (`schemaVersion === 2`) untouched.
- **Recalculation Verification**: Re-calculating a reloaded project produces 100% identical numerical results to the stored result object.

---

## 4. PDF Exporter Audit

### Architecture Inspection (`MixDesignResultsContent.tsx` -> `handleExportPDF`)
- **Data Binding**: Directly consumes `result.mixRatioFineAggregate`, `result.mixRatioCoarseAggregate`, `result.designWater`, `result.cement`, `ssdFA`, `ssdCA`, `result.water`, `result.fineAggregate`, `result.coarseAggregate`, `result.wcRatio`, `result.cementContentCheck`, `result.durabilityCheck`, `result.strengthCheck`, and `result.calculationSteps`.
- **No Independent Recomputation**: The PDF generator does not perform secondary rounded arithmetic or independent formula evaluation. It renders the exact canonical engine outputs.

---

## 5. Summary of Findings & Discrepancies
- **P0 Findings (Safety / Wrong Engineering Result)**: **0 Found**.
- **P1 Findings (Reference-Data Contradiction)**: **0 Found**.
- **P2 Findings (UI / Result Mismatch)**: **0 Found**.
- **P3 Findings (Documentation / Cosmetic)**: **0 Found**.

---

## 6. Verification Suite Results

| Verification Check | Command | Result |
|:---|:---|:---|
| **E2E Scenario Harness** | `npx tsx scratch/e2e_scenario_audit.ts` | **17 / 17 PASS** |
| **Vitest Test Suite** | `npm test` | **189 / 189 PASS** |
| **TypeScript Compiler** | `npx tsc --noEmit` | **0 Errors PASS** |
| **Next.js Production Build** | `npm run build` | **8 / 8 Pages PASS** |
| **Full Cartesian Oracle Matrix** | `npx tsx scripts/cartesian_full_oracle_runner.ts` | **259,200 / 259,200 PASS** |
| **Comprehensive Sub-Matrices** | `npx tsx scripts/comprehensive_submatrices_runner.ts` | **7,718 / 7,718 PASS** |
| **p6 Exact Comparison** | `npx tsx scratch/p6_exact_comparison.ts` | **100% PASS** |
| **Persistence Runtime Audit** | `npx tsx scratch/audit_persistence_migration_runtime.ts` | **100% PASS** |

---

## 7. Final Audit Verdict

# **PASS**
*(CivilSuite's end-to-end engineering pipeline, reference-data validation, calculation notebook presentation, saved-project hydration, and PDF report exporter are 100% verified, consistent, and engineering sound).*
