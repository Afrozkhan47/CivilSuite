# CivilSuite — Phase 7.1 Bug Fix & Regression Hardening Report

> [!IMPORTANT]
> **STRICT CHANGE CONTROL ENFORCED**
> **MODIFIED FILES (Presentation & Integration Layer Only):**
> 1. [`src/app/concrete-mix-design/components/Step3MaterialProperties.tsx`](file:///Users/afrozkhan47/civilsuite/src/app/concrete-mix-design/components/Step3MaterialProperties.tsx)
> 2. [`src/app/concrete-mix-design/components/Step1ProjectDetails.tsx`](file:///Users/afrozkhan47/civilsuite/src/app/concrete-mix-design/components/Step1ProjectDetails.tsx)
> 3. [`src/app/concrete-mix-design/components/Step2DesignParameters.tsx`](file:///Users/afrozkhan47/civilsuite/src/app/concrete-mix-design/components/Step2DesignParameters.tsx)
> 4. [`src/app/concrete-mix-design/components/ConcreteMixDesignContent.tsx`](file:///Users/afrozkhan47/civilsuite/src/app/concrete-mix-design/components/ConcreteMixDesignContent.tsx)
> 5. [`src/app/mix-design-results/components/MixDesignResultsContent.tsx`](file:///Users/afrozkhan47/civilsuite/src/app/mix-design-results/components/MixDesignResultsContent.tsx)
> 6. [`scripts/run_real_browser_qa.ts`](file:///Users/afrozkhan47/civilsuite/scripts/run_real_browser_qa.ts)
>
> **FROZEN FILES (UNTOUCHED):**
> - `src/features/mix-design/calculations/*` (**UNTOUCHED - FROZEN**)
> - `src/features/mix-design/reference-data/*` (**UNTOUCHED - FROZEN**)
> - `src/features/mix-design/types/index.ts` (**UNTOUCHED - FROZEN**)
> - `src/store/useProjectStore.ts` (**UNTOUCHED - FROZEN**)

---

## 1. Root Cause Analysis

### BUG 1 — Stale Results / Wrong Result State
- **Root Cause**:
  1. `SavedProjectsContent.tsx` and `ReportsContent.tsx` generated links with `?projectId=${project.id}` to `/concrete-mix-design` and `/mix-design-results`. However, neither `ConcreteMixDesignContent.tsx` nor `MixDesignResultsContent.tsx` inspected `projectId` query parameters or hydrated state from `useProjectStore`.
  2. On initial mount, `ConcreteMixDesignContent.tsx` initialized state with `DEFAULT_INPUT` (M25) and eagerly overwrote `sessionStorage.getItem('civilsuite-current-input')`.
  3. When starting a new design or navigating to `/mix-design-results`, `MixDesignResultsContent.tsx` read `DEFAULT_INPUT` (M25) from `sessionStorage`, evaluating a valid M25 calculation ($f'_{ck} = 31.6\text{ N/mm²}$, Water $197\text{ kg}$, Cement $394\text{ kg}$, W/C $0.50$, Mix Ratio $1 : 1.71 : 2.83$) instead of isolating the current incomplete M40 calculation state or hydrating the selected saved project.
- **Fix Applied**:
  - Updated `ConcreteMixDesignContent.tsx` and `MixDesignResultsContent.tsx` to read `projectId` from URL search parameters and subscribe to `projects` from `useProjectStore`. When `projectId` is present, state hydrates directly from the saved project.
  - Added reactive `reset(data)` in React Hook Form step components (`Step1ProjectDetails.tsx`, `Step2DesignParameters.tsx`, `Step3MaterialProperties.tsx`).
  - Ensured that when a calculation is incomplete (such as M40 with target strength $48.25\text{ N/mm²}$ exceeding Curve 1 maximum verified point $40\text{ N/mm²}$), `MixDesignResultsContent.tsx` strictly renders the **CALCULATION INCOMPLETE / NO MIX PROPORTION ISSUED** exception view and **NEVER** leaks or displays stale numerical outputs from previous designs.

### BUG 2 — Water Reduction Input Rejects Decimal Values
- **Root Cause**:
  - In `Step3MaterialProperties.tsx` line 404, the Water Reduction (%) `<input>` element was configured with `step="1"`. HTML5 browser native constraint validation enforced integer-only inputs, rejecting decimal percentages like `21.8826` with *"Please enter a valid value. The two nearest valid values are 21 and 22."*
- **Fix Applied**:
  - Changed `step="1"` to `step="any"` on the `admixWr` input element in `Step3MaterialProperties.tsx`. High-precision chemical admixture water reduction values (e.g. `21.8826%`, `22.5%`, `15%`) are now accepted by browser native input validation without error.

---

## 2. Real Playwright Chromium Browser Regression Suite Results

| Test Scenario | Description | Expected Result | Actual Chromium Result | Status | Screenshot Evidence |
|:---|:---|:---|:---|:---:|:---:|
| **Standard Workflow** | Steps 1–4 → Calculate | Complete valid M25 calculation | Displays complete ratio $1 : 1.71 : 2.83$ | **PASS** | [`09_results_dashboard.png`](file:///Users/afrozkhan47/.gemini/antigravity-ide/brain/04ea1a07-4a18-42cf-a603-72f63e50afa1/scratch/screenshots/09_results_dashboard.png) |
| **TEST B. Decimal Water Reduction** | Enter `21.8826` in Water Reduction (%) field | Input retains `21.8826` without browser error | Value retained (`"21.8826"`); user proceeds | **PASS** | [`07_step3_filled.png`](file:///Users/afrozkhan47/.gemini/antigravity-ide/brain/04ea1a07-4a18-42cf-a603-72f63e50afa1/scratch/screenshots/07_step3_filled.png) |
| **TEST A. Complete $\rightarrow$ Incomplete Transition** | Complete M25 design $\rightarrow$ New M40 + 20mm + Pumped design | Target $48.25\text{ N/mm²}$ blocks Step 3; renders `NO MIX PROPORTION ISSUED` and `CALCULATION INCOMPLETE`; zero stale numbers | NO MIX ISSUED: `true`, INCOMPLETE badge: `true`, Step 3 Blocked: `true`, Stale numbers: `false` | **PASS** | [`13_m40_incomplete_results.png`](file:///Users/afrozkhan47/.gemini/antigravity-ide/brain/04ea1a07-4a18-42cf-a603-72f63e50afa1/scratch/screenshots/13_m40_incomplete_results.png) |
| **TEST C. Incomplete Page Reload** | Reload `/mix-design-results` after incomplete M40 calculation | Maintains `CALCULATION INCOMPLETE` state; does not resurrect previous calculations | Incomplete state maintained: `true`, Stale numbers resurrected: `false` | **PASS** | [`14_reloaded_incomplete_results.png`](file:///Users/afrozkhan47/.gemini/antigravity-ide/brain/04ea1a07-4a18-42cf-a603-72f63e50afa1/scratch/screenshots/14_reloaded_incomplete_results.png) |
| **TEST D. Saved Projects Integrity & Hydration** | Save valid project $\rightarrow$ create incomplete design $\rightarrow$ open saved project | Saved project remains intact; opening it hydrates its own project title and parameters cleanly | Ledger project present: `true`, Hydrated project title verified: `true` | **PASS** | [`16_hydrated_saved_project.png`](file:///Users/afrozkhan47/.gemini/antigravity-ide/brain/04ea1a07-4a18-42cf-a603-72f63e50afa1/scratch/screenshots/16_hydrated_saved_project.png) |

---

## 3. Full Verification Suite Summary

| Verification Tool / Test Suite | Command | Total Executed | Result | Status |
|:---|:---|:---:|:---:|:---:|
| **Real Playwright Chromium UAT** | `npx tsx scripts/run_real_browser_qa.ts` | 11 / 11 Steps | **11 / 11 PASS** | **PASS** |
| **Vitest Unit & Presentation Tests** | `npm test` | 197 / 197 Tests | **197 / 197 PASS** | **PASS** |
| **TypeScript Compiler** | `npx tsc --noEmit` | 0 Errors | **0 Errors** | **PASS** |
| **Next.js Production Build** | `npm run build` | 8 / 8 Pages | **8 / 8 Pages Generated** | **PASS** |
| **Full Cartesian Oracle Matrix** | `npx tsx scripts/cartesian_full_oracle_runner.ts` | 259,200 Cases | **259,200 / 259,200 PASS** | **PASS** |
| **Comprehensive Sub-Matrices** | `npx tsx scripts/comprehensive_submatrices_runner.ts` | 7,718 Cases | **7,718 / 7,718 PASS** | **PASS** |
| **`p6` 3-Case Comparison** | `npx tsx scratch/p6_exact_comparison.ts` | 3 Cases | **3 / 3 PASS** | **PASS** |
| **Persistence Runtime Audit** | `npx tsx scratch/audit_persistence_migration_runtime.ts` | 6 Tests | **6 / 6 PASS** | **PASS** |

---

## 4. Final Verdict

# **PASS**
*(All reported browser state isolation, query parameter hydration, and decimal input defects are 100% resolved and verified in real Chromium automation. All calculation, reference-data, and persistence engines remain 100% frozen and verified).*
