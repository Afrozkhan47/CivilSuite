# IS 10262:2019 — Golden Test Cases for Calculation Engine Verification

**Purpose:**
These test cases are extracted directly from IS 10262:2019 worked examples.
They serve as authoritative benchmarks to verify the correctness of the
calculation engine once formulas are implemented.

> ⚠️ STRICT RULE: Do NOT code these into production calculations. Do NOT
> back-calculate formulas from these results. These are verification checkpoints only.

---

## Test Case 1 — M40 Concrete (Pumped, OPC 43, Moderate Exposure)

Source: IS 10262:2019, Illustrative Example

### Design Input Parameters
| Parameter | Value |
|---|---|
| Characteristic Strength (fck) | 40 N/mm² |
| Exposure Condition | Moderate |
| Cement Type | OPC 43 Grade |
| Slump | 100–120 mm (pumped) |
| Nominal Max Aggregate Size | 20 mm |
| Pumped Concrete | Yes |
| Air Entrained | No |

### Step-by-Step Intermediate Values

**Step 1 — Target Mean Compressive Strength (f'ck)**
```
From Table 2: S = 5.0 N/mm² (Grade M30–M60, good site control)
From Table 1: X = 6.5 N/mm² (Grade M30–M60)
Formula A: f'ck = fck + 1.65 × S = 40 + 1.65 × 5.0 = 48.25 N/mm²
Formula B: f'ck = fck + X        = 40 + 6.5 = 46.5 N/mm²
Result: f'ck = max(48.25, 46.5) = 48.25 N/mm²
```

**Step 2 — Water-Cement Ratio**
```
From Figure 1 (Curve 2 — OPC 43): target strength 48.25 N/mm² → w/c ≈ 0.36
IS 456:2000 Table 5 durability limit for moderate exposure: max w/c = 0.50
Governing w/c = min(0.36, 0.50) = 0.36
```

**Step 3 — Water Content**
```
From Table 4 (angular aggregate, 20mm, 50mm slump): base water = [PENDING TABLE 4 VERIFICATION]
Slump adjustment for 100–120 mm (pumped): +additional water
Final water content: [PENDING TABLE 4 VERIFICATION]
```

**Step 4 — Cement Content**
```
C = W / (w/c) = [pending water] / 0.36 = [pending]
IS 456:2000 Table 5 moderate exposure: min cement = 300 kg/m³
Final cement content = max(calculated, 300)
```

**Step 5 — Volume of Aggregate**
```
V_agg = 1 - [C / (SG_c × 1000)] - [W / 1000] - [air%/100]
```

**Step 6 — FA/CA Split**
```
From Figure 2 / Table data: based on W/C and Zone/FM
[Requires verified zone data from IS standard]
```

---

## Test Case 2 — M15 Concrete (Non-Pumped, OPC 33, Mild Exposure)

Source: IS 10262:2019, Illustrative Example

### Design Input Parameters
| Parameter | Value |
|---|---|
| Characteristic Strength (fck) | 15 N/mm² |
| Exposure Condition | Mild |
| Cement Type | OPC 33 Grade |
| Slump | 25–75 mm |
| Nominal Max Aggregate Size | 20 mm |

### Step-by-Step Intermediate Values

**Step 1 — Target Mean Compressive Strength (f'ck)**
```
From Table 2: S = 3.5 N/mm² (Grade M10–M15, good site control)
From Table 1: X = 5.0 N/mm² (Grade M10–M15)
Formula A: f'ck = fck + 1.65 × S = 15 + 1.65 × 3.5 = 20.775 N/mm²
Formula B: f'ck = fck + X        = 15 + 5.0 = 20.0 N/mm²
Result: f'ck = max(20.775, 20.0) = 20.775 N/mm²
```
> Note: Standard rounds this to approximately 20.77 N/mm².

**Step 2 — Water-Cement Ratio**
```
From Figure 1 (Curve 1 — OPC 33): target strength 20.775 N/mm² → w/c [PENDING FIGURE 1 VERIFIED DATA]
IS 456:2000 Table 5 mild exposure: max w/c = 0.55
Governing w/c = min(from Figure 1, 0.55)
```

---

## Test Case 3 — M70 High Strength Concrete

Source: IS 10262:2019, High Strength Example

> ⚠️ NOTE: M70 may fall in the High Strength section of IS 10262:2019.
> The ordinary/standard calculation procedure (Clauses 6.2–6.6) may or may not
> directly apply. Separate high-strength table lookups may be required.

### Design Input Parameters
| Parameter | Value |
|---|---|
| Characteristic Strength (fck) | 70 N/mm² |
| Cement Type | OPC 53 Grade |

### Step-by-Step Intermediate Values

**Step 1 — Target Mean Compressive Strength (f'ck)**
```
From Table 2: S = 6.0 N/mm² (Grade M65–M80, good site control)
From Table 1: X = 8.0 N/mm² (Grade M65 and above)
Formula A: f'ck = fck + 1.65 × S = 70 + 1.65 × 6.0 = 79.9 N/mm²
Formula B: f'ck = fck + X        = 70 + 8.0 = 78.0 N/mm²
Result: f'ck = max(79.9, 78.0) = 79.9 N/mm²
```

**Step 2 — Water-Cement Ratio**
```
From Figure 1 (Curve 3 — OPC 53): target strength 79.9 N/mm² → w/c [PENDING FIGURE 1 VERIFIED DATA]
```
> Note: At M70 levels, the Figure 1 curve may approach its lower bound.
> The application must return null if the target strength falls outside verified curve bounds.

---

## Remaining Verification Required from Professor/PDF

1. **Table 4 exact values**: Angular aggregate, slump = 50 mm, for sizes 10 mm, 20 mm, 40 mm.
2. **Figure 1 coordinate points**: Numerical (W/C, strength) pairs for Curve 1, 2, and 3.
3. **FA/CA split source**: Whether this comes from a figure, a table, or a formula in the version supplied. Table 5 of IS 10262:2009 had this; the 2019 revision may differ.
4. **Durability Table Reference**: Exact source table in IS 456:2000 used for minimum cement content and maximum W/C by exposure class.
5. **M70 procedure**: Confirm if M70 uses the ordinary or high-strength section of IS 10262:2019 in the supplied worked example.
