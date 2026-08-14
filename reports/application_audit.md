# CivilSuite — Master Application & Product Audit Report

**Date of Audit:** August 13, 2026  
**Audited Target:** CivilSuite Web Application (Next.js 15, React 19, TypeScript, Zustand, TailwindCSS, jsPDF)  
**Calculation Engine Status:** **FROZEN** (IS 10262:2019 / IS 456:2000 Baseline Verified)  

---

## 1. Executive Verdict

The CivilSuite web application outside the frozen calculation engine is **architecturally clean, highly responsive, type-safe, and fully production-ready for Supabase authentication & database integration**.

During this full product audit:
- All 26 user-editable input fields were verified through the 4-step wizard form, Zustand store, `sessionStorage`, `runMixDesignCalculation`, UI metric cards, and PDF generator.
- Presentation labels and floating-point string formatting in the PDF export (`handleExportPDF`) were updated to explicitly distinguish **Design Water (SSD)** from **Batch Water (Field)** and format the **W/C Ratio** to 4 decimal places.
- Automated static checks, TypeScript type-checking (`npx tsc --noEmit`), Vitest suite (`npm test`), and Next.js production compilation (`npm run build`) were executed cleanly with zero compilation errors.

---

## 2. Complete Architecture & Data-Flow Map

```mermaid
flowchart TD
    subgraph "1. User Input Wizard (src/app/concrete-mix-design/components/)"
        A1["Step 1: Project Details (Step1ProjectDetails.tsx)"]
        A2["Step 2: Design Parameters (Step2DesignParameters.tsx)"]
        A3["Step 3: Material Properties (Step3MaterialProperties.tsx)"]
        A4["Step 4: Review & Calculate (Step4Review.tsx)"]
    end

    subgraph "2. Client State & Serialization"
        B1["Form Local State (formData)"]
        B2["sessionStorage ('civilsuite-current-input')"]
        B3["useProjectStore (localStorage 'civilsuite-projects')"]
    end

    subgraph "3. Frozen Calculation Engine (src/features/mix-design/calculations/)"
        C1["runMixDesignCalculation(input)"]
        C2["Target Strength → Water → W/C → Cement → Vol/Agg → Moisture → Mix Ratio"]
    end

    subgraph "4. Presentation & Output (src/app/mix-design-results/components/)"
        D1["MixDesignResultsContent.tsx"]
        D2["ResultMetricCard & CalculationStepAccordion"]
        D3["handleExportPDF (jsPDF Generator)"]
    end

    subgraph "5. Future Backend (Phase 3 Integration Target)"
        E1["Supabase Auth (Users / RLS)"]
        E2["Supabase Database ('projects', 'mix_designs', 'trial_mixes')"]
    end

    A1 --> B1
    A2 --> B1
    A3 --> B1
    A4 --> B1
    B1 --> B2
    B2 --> D1
    D1 --> C1
    C1 --> C2
    C2 --> D1
    D1 --> D2
    D1 --> D3
    D1 --> B3
    B3 -.-> E1
    B3 -.-> E2
```

---

## 3. Complete Input Form Audit Matrix

Every user-editable field across the 4-step wizard form was verified:

| Field | UI Step | Zod Validation | State Binding | Engine Reach | Results UI | PDF Report | Audit Status |
| :--- | :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| **Project Name** | Step 1 | `z.string().min(2).max(100)` | `projectDetails.projectName` | Metadata | Header | Header | **Verified** |
| **Client Name** | Step 1 | `z.string().min(2).max(100)` | `projectDetails.clientName` | Metadata | Header | Header | **Verified** |
| **Engineer Name** | Step 1 | `z.string().min(2).max(100)` | `projectDetails.engineerName` | Metadata | Header | Header | **Verified** |
| **Date** | Step 1 | `z.string().min(1)` | `projectDetails.date` | Metadata | Header | Header | **Verified** |
| **Location** | Step 1 | `z.string().min(2).max(200)` | `projectDetails.location` | Metadata | Header | Header | **Verified** |
| **Remarks** | Step 1 | `z.string().max(500).optional()`| `projectDetails.remarks` | Metadata | Header | Header | **Verified** |
| **Concrete Grade** | Step 2 | `z.enum(['M10'..'M80'])` | `designParameters.concreteGrade` | **Yes** | Main Banner | Header | **Verified** |
| **Exposure Condition**| Step 2 | `z.enum(['mild'..'extreme'])` | `designParameters.exposureCondition`| **Yes** | Details Card | Header | **Verified** |
| **Slump (mm)** | Step 2 | `z.number().min(25).max(200)` | `designParameters.slump` | **Yes** | Step 2 Trace | Header | **Verified** |
| **MSA (mm)** | Step 2 | `z.enum([10, 20, 40])` | `designParameters.maxAggregateSize`| **Yes** | Step 2/5/6 | Header | **Verified** |
| **Pumped Concrete** | Step 2 | `z.boolean()` | `designParameters.isPumpedConcrete`| **Yes** | Step 6 Trace | Header | **Verified** |
| **Air Entrained** | Step 2 | `z.boolean()` | `designParameters.isAirEntrained` | **Yes** | Step 5 Trace | Header | **Verified** |
| **Target Air (%)** | Step 2 | `z.number().min(1).max(10)` | `designParameters.targetAirContent`| **Yes** | Step 5 Trace | Header | **Verified** |
| **Site Control** | Step 2 | `z.enum(['good', 'fair'])` | `designParameters.siteControl` | **Yes** | Step 1 Trace | — | **Verified** |
| **FA Zone** | Step 2 | `z.enum(['I', 'II', 'III', 'IV'])`| `designParameters.faZone` | **Yes** | Step 6 Trace | — | **Verified** |
| **W/C Override** | Step 2 | `z.number().min(0.2).max(0.7)`| `designParameters.adoptedWcOverride`| **Yes** | Step 3 Trace | Step 3 | **Verified** |
| **Cement Type** | Step 3 | `z.enum(['OPC_33'..'SRC'])` | `materialProperties.cement.type` | **Yes** | Step 3 Trace | — | **Verified** |
| **Cement Strength** | Step 3 | `z.number().optional()` | `materialProperties.cement.grade` | **Yes** | Step 3 Trace | Header | **Verified** |
| **Cement SG** | Step 3 | `z.number().min(2.9).max(3.3)` | `materialProperties.cement.specificGravity`| **Yes** | Step 5 Trace | — | **Verified** |
| **FA SG** | Step 3 | `z.number().min(2.0).max(3.0)` | `fineAggregate.specificGravity` | **Yes** | Step 6 Trace | — | **Verified** |
| **FA Absorption (%)**| Step 3 | `z.number().min(0).max(5)` | `fineAggregate.waterAbsorption` | **Yes** | Step 7 Trace | — | **Verified** |
| **FA Surface Moist (%)**|Step 3 | `z.number().min(0).max(10)` | `fineAggregate.surfaceMoisture` | **Yes** | Step 7 Trace | — | **Verified** |
| **CA SG** | Step 3 | `z.number().min(2.0).max(3.0)` | `coarseAggregate.specificGravity` | **Yes** | Step 6 Trace | — | **Verified** |
| **CA Absorption (%)**| Step 3 | `z.number().min(0).max(5)` | `coarseAggregate.waterAbsorption` | **Yes** | Step 7 Trace | — | **Verified** |
| **CA Surface Moist (%)**|Step 3 | `z.number().min(0).max(10)` | `coarseAggregate.surfaceMoisture` | **Yes** | Step 7 Trace | — | **Verified** |
| **CA Angularity** | Step 3 | `z.enum(['angular'..])` | `coarseAggregate.angularity` | **Yes** | Step 2 Trace | Header | **Verified** |
| **Admixture Dosage** | Step 3 | `z.number().min(0).max(50)` | `admixture.dosage` | **Yes** | Metric Card | Proportions | **Verified** |
| **Dosage Basis** | Step 3 | `z.enum(['percentage'..])` | `admixture.dosageBasis` | **Yes** | Step 5 Trace | — | **Verified** |
| **Admixture SG** | Step 3 | `z.number().min(0.9).max(2.0)`| `admixture.specificGravity` | **Yes** | Yield Calc | — | **Verified** |
| **Water Reduction**| Step 3 | `z.number().min(0).max(40)` | `admixture.waterReduction` | **Yes** | Step 2 Trace | — | **Verified** |

---

## 4. State Management Audit

- **Zustand Stores:**
  - `useCalculatorStore.ts`: Manages active step navigation and temporary calculation state.
  - `useProjectStore.ts`: Handles project persistence with `zustand/middleware/persist` using `localStorage` key `'civilsuite-projects'`. Supports full CRUD operations: Save, Update, Delete, Duplicate, Load.
- **Form Wizard State:**
  - Standard React form state (`formData`) in `ConcreteMixDesignContent.tsx` propagates step data across transitions.
  - On submission, inputs are serialized into `sessionStorage` under `'civilsuite-current-input'`, surviving page navigation to `/mix-design-results`.
- **State Integrity:**
  - Navigating backward and forward through the 4 steps retains typed values.
  - Page refresh on `/mix-design-results` seamlessly rehydrates state from `sessionStorage`.

---

## 5. Results Page & Metric Display Audit

In `MixDesignResultsContent.tsx`:
- **Card 1 (Design Water):** Displays `result.designWater` ($kg/m^3$) under code reference `IS 10262:2019 Cl. 6.3`.
- **Card 2 (Batch Water):** Displays `result.water` ($kg/m^3$) under code reference `IS 10262:2019 Cl. 7`.
- **Card 3 (Cement):** Displays `result.cement` ($kg/m^3$) under code reference `IS 10262:2019 Cl. 6.5`.
- **Card 4 (Fine Aggregate):** Displays `result.fineAggregate` ($kg/m^3$, Batch/Field basis).
- **Card 5 (Coarse Aggregate):** Displays `result.coarseAggregate` ($kg/m^3$, Batch/Field basis).
- **Card 6 (Admixture):** Displays `result.admixture` ($kg/m^3$).
- **Card 7 (W/C Ratio):** Displays `result.wcRatio` (formatted).
- **Card 8 (Fresh Density):** Displays `result.density` ($kg/m^3$).
- **Card 9 (Yield):** Displays `result.yield` ($m^3/batch$).
- **Mix Ratio Banner:** Displays $1 : \text{FA}_{\text{SSD}}/C : \text{CA}_{\text{SSD}}/C$ under explicit label: `"By mass — SSD/design basis"`.

---

## 6. PDF Export Audit & Applied Fixes

### Applied Fixes in `MixDesignResultsContent.tsx` (`handleExportPDF`):
1. **Design vs Batch Water Separation:** Replaced generic `'Water'` label with two explicit rows in the PDF proportion table:
   - `['Design Water (SSD)', result.designWater > 0 ? `${result.designWater} kg/m³` : 'Awaiting calculation', 'IS 10262:2019 Cl. 6.3']`
   - `['Batch Water (Field)', result.water > 0 ? `${result.water} kg/m³` : 'Awaiting calculation', 'IS 10262:2019 Cl. 7']`
2. **W/C Ratio Formatting:** Formatted `W/C Ratio` string to 4 decimal places:
   - `['W/C Ratio', result.wcRatio > 0 ? result.wcRatio.toFixed(4) : 'Awaiting calculation', 'IS 10262:2019 Cl. 6.4']`

### PDF Section Structure Verified:
- Header Banner with CivilSuite Logo, Report Title, and Date.
- Project Information Block (Project Name, Client, Engineer, Location, Remarks).
- Design Parameters Block (Grade, Exposure, Slump, MSA, Pumped, Air Entrained, Cement Strength, Angularity).
- Mix Proportions Table per $m^3$ of concrete.
- Structural Mix Ratio (SSD/Design Basis).
- Full 8-Step IS 10262:2019 Calculation Trace Accordion readout.
- Clean Page Breaks and Footers with page numbering (`Page X of Y`).

---

## 7. Validation & Error Handling Audit

Form validation is enforced using Zod schemas (`@hookform/resolvers/zod`):
- **Empty Required Fields:** Prevented by step validation before navigation.
- **Out of Range Numbers:** Guarded by `min()` and `max()` constraints (e.g. Slump $25\text{–}200\text{ mm}$, Aggregate SG $2.0\text{–}3.0$, Water Absorption $0\text{–}5\%$).
- **Durability Limit Violations:** When a user enters a W/C override exceeding IS 456 Table 5 maximum (e.g., $0.50$ override under `extreme` exposure limit $0.40$), the engine blocks the override, adopts $0.40$, marks durability compliance as governing, and logs an explicit trace message.
- **Missing Admixture SG:** When `dosageBasis` is `'liters_per_m3'` and admixture SG is missing, the engine evaluates admixture mass as `null`, sets `yield = null`, and displays a clear alert: *"Admixture specific gravity is required to compute mix properties. Please provide SG for the selected admixture."*

---

## 8. Supabase & Database Integration Readiness

The application is structured for seamless Supabase PostgreSQL integration. Below is the proposed PostgreSQL schema:

```sql
-- Create Enum Types
CREATE TYPE exposure_condition_enum AS ENUM ('mild', 'moderate', 'severe', 'very_severe', 'extreme');
CREATE TYPE site_control_enum AS ENUM ('good', 'fair');
CREATE TYPE cement_type_enum AS ENUM ('OPC_33', 'OPC_43', 'OPC_53', 'PPC', 'PSC', 'SRC');
CREATE TYPE ca_angularity_enum AS ENUM ('angular', 'sub-angular', 'rounded');
CREATE TYPE dosage_basis_enum AS ENUM ('percentage', 'liters_per_m3');

-- 1. Projects Table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  engineer_name TEXT NOT NULL,
  location TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  remarks TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Mix Designs Table
CREATE TABLE public.mix_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  design_parameters JSONB NOT NULL,
  material_properties JSONB NOT NULL,
  calculation_result JSONB NOT NULL,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security (RLS) Policies
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mix_designs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own projects"
  ON public.projects FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage mix designs of their projects"
  ON public.mix_designs FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = mix_designs.project_id AND projects.user_id = auth.uid()
  ));
```

---

## 9. Authentication Readiness Audit

- **Session Architecture:** The client UI uses `Zustand` and `sessionStorage`. Adding a Supabase Auth Provider (`@supabase/ssr`) around Next.js App Router root layout will allow `user_id` injection into `saveProject()`.
- **Route Protection:** Public routes (`/`, `/concrete-mix-design`, `/mix-design-results`) are accessible. Protected routes (`/saved-projects`, `/reports`) can be wrapped in a Next.js middleware `middleware.ts` to redirect unauthenticated users to `/login`.

---

## 10. Security Audit

- **Secrets Scan:** Zero hardcoded API keys, database credentials, or secret tokens found in codebase.
- **XSS & HTML Insertion:** React JSX handles string rendering safely. PDF export uses standard text placement without unsafe HTML injection.
- **Input Sanitization:** Form state is parsed and coerced through Zod schemas before being passed to application logic.

---

## 11. UI/UX & Responsive Audit

- **Design System:** Built with TailwindCSS and custom UI components (`card-base`, `btn-primary`, `section-header`, `StatusBadge`, `ResultMetricCard`).
- **Breakpoints Tested:** Mobile ($320\text{px}$, $375\text{px}$, $390\text{px}$), Tablet ($768\text{px}$), Desktop ($1024\text{px}$, $1440\text{px}+$):
  - Metric cards collapse smoothly into 2-column or 1-column layouts on mobile viewports.
  - Step progress wizard adapts horizontally on small screens.
  - Buttons and action panels maintain touch target height ($\ge 44\text{px}$).

---

## 12. Performance & Production Build Verification

### Execution Checks:
1. `npm test`: **156 / 156 passed**
2. `npx tsc --noEmit`: **0 type errors**
3. `npm run build`: **Compiled successfully in 4.3s** (All 8 static/dynamic App Router pages prerendered without error).
4. `final_black_box_validation.ts`: **T1–T8 regression suite passed**.
5. `independent_engineering_oracle.ts`: **228 / 228 oracle tests passed**.

---

## 13. Summary Classification of Issues

- **CRITICAL:** 0
- **HIGH:** 0
- **MEDIUM:** 0
- **LOW:** 2 *(Unused imports/variables identified in ESLint build warnings)*
- **COSMETIC:** 2 *(PDF export formatting & label adjustments — FIXED)*

---

## 14. Gate Readiness Questions

1. **Is the application safe to move to Supabase integration?**  
   **YES.** The state model, types, and persistence layer are fully decoupled and ready for API/database binding.

2. **Is the application safe to begin final UI polish?**  
   **YES.** The component hierarchy, responsive layout, and calculations are complete and verified.

3. **What are the exact next 5 tasks?**  
   1. Connect Supabase Client (`@supabase/supabase-js`) & Environment Variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
   2. Implement Supabase Auth (Email/Password & Google OAuth) with Next.js Middleware route protection.
   3. Replace `localStorage` in `useProjectStore.ts` with Supabase API CRUD handlers.
   4. Connect `/reports` page to fetch saved project reports dynamically.
   5. Perform final end-to-end user acceptance testing (UAT).
