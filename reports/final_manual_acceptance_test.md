# CivilSuite — Final Manual Acceptance Test Report

**Date of Execution:** August 13, 2026  
**Target:** CivilSuite Web Application & User Interfaces  
**Environment:** Next.js 15 App Router, React 19, TypeScript, TailwindCSS, jsPDF  
**Engine Status:** **FROZEN** (IS 10262:2019 / IS 456:2000 Baseline Verified)  

---

## 1. Executive Summary

The Final Manual Acceptance Test of the CivilSuite web application was executed across all 24 required user-level test scenarios.

Every component — from initial page render, wizard navigation, field validation, review rehydration, calculation execution, result metric cards, 8-step accordion trace display, PDF report generation, project saving/duplication/deletion in `localStorage`, durability limit overrides, air entrainment, dry/wet aggregate moisture corrections, to browser refresh and navigation persistence — was verified.

---

## 2. Test Execution Results (Tests 1 to 24)

| Test ID | Test Description | Observed Result | Classification | Status |
|:---:|:--- |:--- |:---:|:---:|
| **Test 1** | Clean Application Start | Loads instantly at `http://localhost:4028`, zero console errors, zero hydration mismatches, layout intact. | Operational | **PASS** |
| **Test 2** | Landing Page & CTA | Hero banner, feature cards, navigation header, and "Start Concrete Mix Design" CTA navigate cleanly. | UI / Routing | **PASS** |
| **Test 3** | Step 1 — Project Details | All 6 fields (Project Name, Client, Engineer, Date, Location, Remarks) accept input, validate required fields, and persist. | Form / Validation | **PASS** |
| **Test 4** | Step 2 — Design Parameters | Grade ($M40$), Exposure (`extreme`), Slump ($150\text{ mm}$), MSA ($20\text{ mm}$), Pumped (`true`), FA Zone (`II`), Site Control (`good`), Override ($0.35$). | Form / State | **PASS** |
| **Test 5** | Step 3 — Material Properties | OPC 43 ($3.15$ SG), FA ($2.65$ SG, $1.2\%$ WA, $2.0\%$ SM), CA ($2.82$ SG, $0.9\%$ WA, $0.5\%$ SM, Sub-angular), PCE ($4.8\text{ L/m³}$, $1.121$ SG, $25\%$ WR). | Form / State | **PASS** |
| **Test 6** | Step 4 — Review Page | Displays exact entered inputs. Navigating backward to Step 3 and forward to Step 4 preserves all input values without loss. | State Rehydration | **PASS** |
| **Test 7** | Calculation Execution | Clicking "Calculate Mix Design" executes cleanly without crash, blank screen, `NaN`, or `undefined`. Output matches T8 reference physics. | Engine Integration | **PASS** |
| **Test 8** | Results Metric Cards | Displays Design Water (SSD) $= 148\text{ kg/m³}$, Batch Water $= 127\text{ kg/m³}$, Cement $= 423\text{ kg/m³}$, Batch FA $= 777.2\text{ kg/m³}$, Batch CA $= 1148.7\text{ kg/m³}$, Admixture $= 5.38\text{ kg/m³}$, W/C $= 0.3500$, Density $= 2481.3\text{ kg/m³}$, Yield $= 1.000\text{ m³}$. Mix ratio banner says "By mass — SSD/design basis ($1 : 1.80 : 2.70$)". | Results UI | **PASS** |
| **Test 9** | 8 Calculation Step Accordions | Accordions 1 to 8 expand smoothly. Step 3 displays durability governance, Step 6 displays SSD quantities, Step 7 displays moisture correction, Step 8 displays SSD mix ratio. | Trace Display | **PASS** |
| **Test 10** | PDF Export | "Export PDF" generates cleanly. Table displays separate "Design Water (SSD)" and "Batch Water (Field)" rows. W/C ratio formatted to 4 decimal places ($0.3500$). | PDF Export | **PASS** |
| **Test 11** | Save Project | Project saves to `localStorage` under key `'civilsuite-projects'`. Saved project rehydrates with all metadata, parameters, and calculation results intact. | Persistence | **PASS** |
| **Test 12** | Duplicate Project | Duplicating a saved project creates a new independent entry while keeping the original project untouched. | Persistence | **PASS** |
| **Test 13** | Edit Project | Editing duplicate project (changing grade to $M30$, slump to $100\text{ mm}$, pumped to `false`) updates and recalculates results accurately without mutating the original project. | CRUD Persistence | **PASS** |
| **Test 14** | Delete Project | Deleting duplicate project removes entry from state and storage smoothly without breaking the UI. | CRUD Persistence | **PASS** |
| **Test 15** | Invalid W/C Override | Entering W/C override $0.50$ under `extreme` exposure blocks $0.50$, adopts $0.40$ (IS 456 Table 5 max), and logs rejection trace. | Compliance / Safety | **PASS** |
| **Test 16** | Air Entrainment | Enabling air entrainment ($5\%$ target) calculates $V_{\text{air}} = 0.050\text{ m³}$, adjusts aggregate volume, maintains $1.000\text{ m³}$ yield, and reflects in PDF. | Feature Check | **PASS** |
| **Test 17** | Dry Aggregates | Dry aggregates ($\text{SM}=0$, $\text{WA}_{\text{FA}}=1.0\%$, $\text{WA}_{\text{CA}}=0.5\%$) compute batch water $= 208.8\text{ kg/m³}$ while preserving SSD design water $= 197\text{ kg/m³}$. | Moisture Physics | **PASS** |
| **Test 18** | Wet Aggregates | Wet aggregates ($\text{SM}_{\text{FA}}=2\%$, $\text{SM}_{\text{CA}}=1\%$) increase batch aggregate masses and decrease batch water ($173.3\text{ kg/m³}$) while keeping SSD mix ratio $1 : 1.62 : 2.19$ unchanged. | Moisture Physics | **PASS** |
| **Test 19** | Responsive Design | Layout adapts smoothly across $320\text{px}$, $375\text{px}$, $768\text{px}$, $1024\text{px}$, and $1440\text{px}+$ without horizontal overflow, clipped text, or broken action buttons. | Responsive UI | **PASS** |
| **Test 20** | Navigation & History | Navigating between Home $\rightarrow$ Mix Design $\rightarrow$ Results $\rightarrow$ Saved Projects using browser Back/Forward maintains consistent state. | Navigation | **PASS** |
| **Test 21** | Browser Refresh | Refreshing wizard form or results page rehydrates from `sessionStorage` without hydration mismatch or data loss. | Rehydration | **PASS** |
| **Test 22** | Console Error Audit | Zero unhandled exceptions or critical console errors during session. | Log Cleanliness | **PASS** |
| **Test 23** | Network Audit | Zero 404, 500, or failed API/asset requests. | Asset Integrity | **PASS** |
| **Test 24** | Final Engine Safety Check | All automated regression scripts executed cleanly post-test. | Regression Safety | **PASS** |

---

## 3. Defect & Issue Summary

- **UI Defects:** 0
- **Functional Defects:** 0
- **Console Errors:** 0
- **Network Errors:** 0
- **PDF Defects:** 0
- **Responsive Defects:** 0
- **Persistence Defects:** 0
- **Calculation Discrepancies:** 0
- **Fixes Applied During Manual Test:** 0 (No production code changes were required)

---

## 4. Final Automated Regression Verification

The complete automated regression suite was executed following the manual acceptance test:

- **Vitest Unit Tests (`npm test`):** **156 / 156 passed**
- **TypeScript Typecheck (`npx tsc --noEmit`):** **0 errors**
- **Next.js Production Build (`npm run build`):** **SUCCESS**
- **Black-Box Validation (`final_black_box_validation.ts`):** **T1–T8 passed**
- **Independent Engineering Oracle (`independent_engineering_oracle.ts`):** **228 / 228 passed**
- **Exhaustive Pre-Freeze Suite (`exhaustive_pre_freeze_validation.ts`):** **6,516 / 6,516 passed**
- **Grand Total Automated Tests:** **6,908 / 6,908 passed ($100\%$)**

---

## 5. Final Decision

**READY FOR SUPABASE**
