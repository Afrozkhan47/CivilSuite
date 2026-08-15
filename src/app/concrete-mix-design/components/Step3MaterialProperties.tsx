'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, ArrowRight, Layers } from 'lucide-react';
import type { MaterialProperties } from '@/features/mix-design/types';

const schema = z.object({
  cement: z.object({
    type: z.string().min(1, 'Cement type required'),
    specificGravity: z.coerce.number().min(2.5, 'Min SG is 2.5').max(3.5, 'Max SG is 3.5'),
    grade: z.coerce.number().optional().transform((val) => (val === 0 ? undefined : val)),
  }),
  fineAggregate: z.object({
    specificGravity: z.coerce.number().min(2.0, 'Min SG is 2.0').max(3.2, 'Max SG is 3.2'),
    waterAbsorption: z.coerce.number().min(0, 'Min 0%').max(10, 'Max 10%'),
    surfaceMoisture: z.coerce.number().min(0, 'Min 0%').max(15, 'Max 15%').optional(),
    finesModulus: z.coerce.number().optional(),
  }),
  coarseAggregate: z.object({
    specificGravity: z.coerce.number().min(2.0, 'Min SG is 2.0').max(3.2, 'Max SG is 3.2'),
    waterAbsorption: z.coerce.number().min(0, 'Min 0%').max(10, 'Max 10%'),
    surfaceMoisture: z.coerce.number().min(0, 'Min 0%').max(15, 'Max 15%').optional(),
    angularity: z.enum(['angular', 'sub-angular', 'partially_rounded', 'rounded']).optional(),
  }),
  water: z.object({
    source: z.string().optional(),
  }),
  admixture: z.object({
    type: z.string().optional(),
    dosage: z.coerce.number().min(0, 'Dosage cannot be negative').optional(),
    dosageBasis: z.enum(['percent_cement', 'liters_per_m3']).optional(),
    waterReduction: z.coerce.number().min(0, 'Water reduction cannot be negative').max(50, 'Max water reduction is 50%').optional(),
    specificGravity: z.coerce.number().min(0.5, 'Min SG is 0.5').max(2.5, 'Max SG is 2.5').optional(),
  }),
});

type FormValues = z.infer<typeof schema>;

const CEMENT_TYPES = [
  { value: 'OPC_43', label: 'OPC 43 Grade', desc: 'IS 8112 Ordinary Portland' },
  { value: 'OPC_53', label: 'OPC 53 Grade', desc: 'IS 12269 High Strength' },
  { value: 'OPC_33', label: 'OPC 33 Grade', desc: 'IS 269 Standard Strength' },
  { value: 'PPC', label: 'PPC (Fly Ash)', desc: 'IS 1489 Pozzolana Portland' },
  { value: 'PSC', label: 'PSC (Slag)', desc: 'IS 455 Slag Cement' },
  { value: 'SRC', label: 'SRC (Sulphate)', desc: 'IS 12330 Resistant Cement' },
];

const ANGULARITY_OPTIONS = [
  { value: 'angular', label: 'ANGULAR', desc: 'Crushed stone baseline (0 kg/m³)' },
  { value: 'sub-angular', label: 'SUB-ANGULAR', desc: 'Sub-angular (-10 kg/m³)' },
  { value: 'partially_rounded', label: 'PARTIALLY ROUNDED', desc: 'Gravel with crushed (-15 kg/m³)' },
  { value: 'rounded', label: 'ROUNDED GRAVEL', desc: 'Uncrushed rounded (-20 kg/m³)' },
];

interface Step3Props {
  data: MaterialProperties;
  onNext: (data: MaterialProperties) => void;
  onPrev: () => void;
}

export default function Step3MaterialProperties({ data, onNext, onPrev }: Step3Props) {
  const isInitiallyHasAdmix = data.admixture?.type !== 'None' && ((data.admixture?.dosage ?? 0) > 0 || (data.admixture?.waterReduction ?? 0) > 0);
  const [hasAdmixture, setHasAdmixture] = React.useState<boolean>(isInitiallyHasAdmix);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      cement: {
        type: data.cement.type || 'OPC_43',
        specificGravity: data.cement.specificGravity || 3.15,
        grade: data.cement.grade,
      },
      fineAggregate: {
        specificGravity: data.fineAggregate.specificGravity || 2.65,
        waterAbsorption: data.fineAggregate.waterAbsorption || 1.0,
        surfaceMoisture: data.fineAggregate.surfaceMoisture || 0,
        finesModulus: data.fineAggregate.finesModulus || 2.8,
      },
      coarseAggregate: {
        specificGravity: data.coarseAggregate.specificGravity || 2.7,
        waterAbsorption: data.coarseAggregate.waterAbsorption || 0.5,
        surfaceMoisture: data.coarseAggregate.surfaceMoisture || 0,
        angularity: data.coarseAggregate.angularity || 'angular',
      },
      water: { source: data.water?.source || 'Potable water' },
      admixture: {
        type: isInitiallyHasAdmix ? (data.admixture?.type || 'Superplasticizer') : 'None',
        dosage: isInitiallyHasAdmix ? (data.admixture?.dosage || 0) : 0,
        dosageBasis: (data.admixture?.dosageBasis === 'liters_per_m3' ? 'liters_per_m3' : 'percent_cement') as FormValues['admixture']['dosageBasis'],
        waterReduction: isInitiallyHasAdmix ? (data.admixture?.waterReduction || 0) : 0,
        specificGravity: data.admixture?.specificGravity || 1.15,
      },
    },
  });

  const selectedCementType = watch('cement.type');
  const selectedAngularity = watch('coarseAggregate.angularity');
  const dosageBasis = watch('admixture.dosageBasis');

  const handleToggleAdmixture = (enabled: boolean) => {
    setHasAdmixture(enabled);
    if (!enabled) {
      setValue('admixture.type', 'None');
      setValue('admixture.dosage', 0);
      setValue('admixture.waterReduction', 0);
    } else {
      setValue('admixture.type', 'Superplasticizer');
      setValue('admixture.dosage', 1.0);
      setValue('admixture.waterReduction', 15);
    }
  };

  const handleDosageBasisChange = (newBasis: 'percent_cement' | 'liters_per_m3') => {
    if (newBasis !== dosageBasis) {
      setValue('admixture.dosageBasis', newBasis);
      setValue('admixture.dosage', 0); // Unit change safety: clear dosage to prevent silent unit misinterpretation
    }
  };

  const onSubmit = (values: FormValues) => {
    if (!hasAdmixture) {
      values.admixture = {
        type: 'None',
        dosage: 0,
        dosageBasis: 'percent_cement',
        waterReduction: 0,
        specificGravity: 1.15,
      };
    }
    onNext(values as MaterialProperties);
  };

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-fade-in">
      <div className="bg-card border border-border rounded-sm shadow-xs overflow-hidden">
        {/* Technical Worksheet Header */}
        <div className="bg-muted/50 px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-sm bg-primary/10 flex items-center justify-center text-primary font-bold">
              <Layers size={15} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground tracking-tight">
                03. MATERIAL PROPERTIES & SPECIFIC GRAVITIES WORKSHEET
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                IS 10262:2019 Clause 4.3 & Clause 6 Material Physical Properties
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block font-mono-tech text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-background px-2.5 py-1 rounded-sm border border-border">
            SECTION 03
          </span>
        </div>

        {/* Input Fields Content */}
        <div className="p-6 space-y-6">
          {/* 01 CEMENT */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-border/80">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider font-mono-tech">
                01 CEMENT — Binder Type & Physical Properties
              </h3>
              <span className="text-[10px] text-muted-foreground">IS 269 / IS 8112 / IS 12269</span>
            </div>

            <div className="space-y-2">
              <label className="label-text">Cement Specification Type <span className="text-error">*</span></label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CEMENT_TYPES.map((c) => {
                  const isSelected = selectedCementType === c.value;
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setValue('cement.type', c.value)}
                      className={`p-2.5 rounded-sm text-left border transition-all ${
                        isSelected
                          ? 'bg-primary/10 border-primary text-primary font-bold'
                          : 'bg-background border-border hover:border-primary/40 text-muted-foreground'
                      }`}
                    >
                      <span className="block text-xs font-bold text-foreground font-mono-tech">{c.label}</span>
                      <span className="block text-[10px] text-muted-foreground mt-0.5 truncate">{c.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1">
                <label className="label-text" htmlFor="cementSg">
                  Cement Specific Gravity (Sc) <span className="text-error">*</span>
                </label>
                <input
                  id="cementSg"
                  type="number"
                  step="0.01"
                  className="input-field font-mono-tech text-xs rounded-sm"
                  placeholder="3.15"
                  {...register('cement.specificGravity')}
                />
                <p className="helper-text">Standard OPC: 3.15, PPC: 2.90, PSC: 3.00</p>
                {errors.cement?.specificGravity && <p className="error-text">{errors.cement.specificGravity.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="label-text" htmlFor="cementGrade">
                  Actual 28-Day Strength (MPa) <span className="text-muted-foreground text-[10px] font-normal">(Optional)</span>
                </label>
                <input
                  id="cementGrade"
                  type="number"
                  step="0.5"
                  className="input-field font-mono-tech text-xs rounded-sm"
                  placeholder="e.g. 42.0"
                  {...register('cement.grade')}
                />
                <p className="helper-text">Lab 28-day cube strength (overrides Figure 1 default)</p>
              </div>
            </div>
          </div>

          {/* 02 FINE AGGREGATE */}
          <div className="space-y-3 pt-2 border-t border-border/60">
            <div className="flex items-center justify-between pb-1.5 border-b border-border/80">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider font-mono-tech">
                02 FINE AGGREGATE — Sand Properties (SSD Basis)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="label-text" htmlFor="faSg">
                  Specific Gravity (S_fa) <span className="text-error">*</span>
                </label>
                <input
                  id="faSg"
                  type="number"
                  step="0.01"
                  className="input-field font-mono-tech text-xs rounded-sm"
                  placeholder="2.65"
                  {...register('fineAggregate.specificGravity')}
                />
                {errors.fineAggregate?.specificGravity && <p className="error-text">{errors.fineAggregate.specificGravity.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="label-text" htmlFor="faAbs">
                  Water Absorption (%) <span className="text-error">*</span>
                </label>
                <input
                  id="faAbs"
                  type="number"
                  step="0.1"
                  className="input-field font-mono-tech text-xs rounded-sm"
                  placeholder="1.0"
                  {...register('fineAggregate.waterAbsorption')}
                />
                <p className="helper-text">IS 2386 Part 3 (Oven-dry to SSD)</p>
                {errors.fineAggregate?.waterAbsorption && <p className="error-text">{errors.fineAggregate.waterAbsorption.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="label-text" htmlFor="faMoist">
                  Free Surface Moisture (%)
                </label>
                <input
                  id="faMoist"
                  type="number"
                  step="0.1"
                  className="input-field font-mono-tech text-xs rounded-sm"
                  placeholder="0.0"
                  {...register('fineAggregate.surfaceMoisture')}
                />
                <p className="helper-text">0.0% assumes oven-dry batch (IS 10262 Cl 7)</p>
              </div>

              <div className="space-y-1">
                <label className="label-text" htmlFor="faFm">
                  Fineness Modulus <span className="text-muted-foreground text-[10px] font-normal">(Informational)</span>
                </label>
                <input
                  id="faFm"
                  type="number"
                  step="0.01"
                  className="input-field font-mono-tech text-xs rounded-sm"
                  placeholder="2.80"
                  {...register('fineAggregate.finesModulus')}
                />
                <p className="helper-text">Table 5 proportion uses FA Zone</p>
              </div>
            </div>
          </div>

          {/* 03 COARSE AGGREGATE */}
          <div className="space-y-3 pt-2 border-t border-border/60">
            <div className="flex items-center justify-between pb-1.5 border-b border-border/80">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider font-mono-tech">
                03 COARSE AGGREGATE — Properties & Particle Shape (IS 10262 Table 4 Note)
              </h3>
            </div>

            <div className="space-y-2">
              <label className="label-text">Coarse Aggregate Particle Shape Adjustment</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {ANGULARITY_OPTIONS.map((ang) => {
                  const isSelected = selectedAngularity === ang.value;
                  return (
                    <button
                      key={ang.value}
                      type="button"
                      onClick={() => setValue('coarseAggregate.angularity', ang.value as FormValues['coarseAggregate']['angularity'])}
                      className={`p-2.5 rounded-sm text-left border transition-all ${
                        isSelected
                          ? 'bg-primary/10 border-primary text-primary font-bold'
                          : 'bg-background border-border hover:border-primary/40 text-muted-foreground'
                      }`}
                    >
                      <span className="block text-xs font-bold font-mono-tech text-foreground">{ang.label}</span>
                      <span className="block text-[10px] text-muted-foreground mt-0.5 truncate">{ang.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div className="space-y-1">
                <label className="label-text" htmlFor="caSg">
                  Specific Gravity (S_ca) <span className="text-error">*</span>
                </label>
                <input
                  id="caSg"
                  type="number"
                  step="0.01"
                  className="input-field font-mono-tech text-xs rounded-sm"
                  placeholder="2.70"
                  {...register('coarseAggregate.specificGravity')}
                />
                {errors.coarseAggregate?.specificGravity && <p className="error-text">{errors.coarseAggregate.specificGravity.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="label-text" htmlFor="caAbs">
                  Water Absorption (%) <span className="text-error">*</span>
                </label>
                <input
                  id="caAbs"
                  type="number"
                  step="0.1"
                  className="input-field font-mono-tech text-xs rounded-sm"
                  placeholder="0.5"
                  {...register('coarseAggregate.waterAbsorption')}
                />
                <p className="helper-text">IS 2386 Part 3 (Oven-dry to SSD)</p>
                {errors.coarseAggregate?.waterAbsorption && <p className="error-text">{errors.coarseAggregate.waterAbsorption.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="label-text" htmlFor="caMoist">
                  Free Surface Moisture (%)
                </label>
                <input
                  id="caMoist"
                  type="number"
                  step="0.1"
                  className="input-field font-mono-tech text-xs rounded-sm"
                  placeholder="0.0"
                  {...register('coarseAggregate.surfaceMoisture')}
                />
                <p className="helper-text">0.0% assumes oven-dry batch (IS 10262 Cl 7)</p>
              </div>
            </div>
          </div>

          {/* 04 CHEMICAL ADMIXTURE */}
          <div className="space-y-4 pt-2 border-t border-border/60">
            <div className="flex items-center justify-between pb-1.5 border-b border-border/80">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider font-mono-tech">
                04 ADMIXTURE — Chemical Plasticizer / Superplasticizer (IS 9103)
              </h3>
              <span className="text-[10px] text-muted-foreground">IS 9103 / IS 10262 Clause 6.3.1</span>
            </div>

            {/* ADMIXTURE SELECTION TOGGLE */}
            <div className="space-y-2">
              <label className="label-text">Admixture Status</label>
              <div className="grid grid-cols-2 gap-3 max-w-md font-mono-tech text-xs">
                <button
                  type="button"
                  onClick={() => handleToggleAdmixture(false)}
                  className={`p-2.5 rounded-sm text-left border transition-all ${
                    !hasAdmixture
                      ? 'bg-primary/10 border-primary text-primary font-bold'
                      : 'bg-background border-border text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  <span className="block text-xs font-bold text-foreground">None (No Admixture)</span>
                  <span className="block text-[10px] text-muted-foreground mt-0.5">Plain Concrete / Baseline</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleAdmixture(true)}
                  className={`p-2.5 rounded-sm text-left border transition-all ${
                    hasAdmixture
                      ? 'bg-primary/10 border-primary text-primary font-bold'
                      : 'bg-background border-border text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  <span className="block text-xs font-bold text-foreground">Plasticizer / Superplasticizer</span>
                  <span className="block text-[10px] text-muted-foreground mt-0.5">Water Reducing Admixture</span>
                </button>
              </div>
            </div>

            {!hasAdmixture ? (
              <div className="p-3 rounded-sm bg-muted/40 border border-border text-xs text-muted-foreground font-sans">
                <p>
                  <strong>Note:</strong> No chemical admixture will be added. Water content and volumetric yield will be calculated directly from IS 10262 Table 4 baseline water requirement.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-sm border border-primary/30 bg-primary/5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* DOSAGE BASIS */}
                  <div className="space-y-1.5">
                    <label className="label-text">Admixture Dosage Basis <span className="text-error">*</span></label>
                    <div className="grid grid-cols-2 gap-2 font-mono-tech text-xs">
                      <button
                        type="button"
                        onClick={() => handleDosageBasisChange('percent_cement')}
                        className={`p-2 rounded-sm text-left border font-bold ${
                          dosageBasis === 'percent_cement'
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-background border-border text-muted-foreground'
                        }`}
                      >
                        <span className="block text-xs font-bold text-foreground">% by Cement Mass</span>
                        <span className="block text-[10px] text-muted-foreground">Mass Basis (% of cement)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDosageBasisChange('liters_per_m3')}
                        className={`p-2 rounded-sm text-left border font-bold ${
                          dosageBasis === 'liters_per_m3'
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-background border-border text-muted-foreground'
                        }`}
                      >
                        <span className="block text-xs font-bold text-foreground">Liters per m³</span>
                        <span className="block text-[10px] text-muted-foreground">Volumetric L/m³</span>
                      </button>
                    </div>
                  </div>

                  {/* DOSAGE RATE */}
                  <div className="space-y-1">
                    <label className="label-text" htmlFor="admixDosage">
                      Dosage Rate {dosageBasis === 'liters_per_m3' ? '(L/m³ of concrete)' : '(% by mass of cement)'} <span className="text-error">*</span>
                    </label>
                    <input
                      id="admixDosage"
                      type="number"
                      step="0.1"
                      className="input-field font-mono-tech text-xs rounded-sm"
                      placeholder={dosageBasis === 'liters_per_m3' ? '1.5' : '1.0'}
                      {...register('admixture.dosage')}
                    />
                    <p className="helper-text">Verify dosage against manufacturer technical data sheet (TDS)</p>
                    {errors.admixture?.dosage && <p className="error-text">{errors.admixture.dosage.message}</p>}
                  </div>

                  {/* WATER REDUCTION */}
                  <div className="space-y-1">
                    <label className="label-text" htmlFor="admixWr">
                      Water Reduction (%) <span className="text-error">*</span>
                    </label>
                    <input
                      id="admixWr"
                      type="number"
                      step="0.5"
                      className="input-field font-mono-tech text-xs rounded-sm"
                      placeholder="15.0"
                      {...register('admixture.waterReduction')}
                    />
                    <p className="helper-text">Water reduction achieved in trials (e.g. 15% for plasticizer, up to 30% for superplasticizer)</p>
                    {errors.admixture?.waterReduction && <p className="error-text">{errors.admixture.waterReduction.message}</p>}
                  </div>

                  {/* SPECIFIC GRAVITY */}
                  <div className="space-y-1">
                    <label className="label-text" htmlFor="admixSg">
                      Admixture Specific Gravity (S_adm) <span className="text-error">*</span>
                    </label>
                    <input
                      id="admixSg"
                      type="number"
                      step="0.01"
                      className="input-field font-mono-tech text-xs rounded-sm"
                      placeholder="1.15"
                      {...register('admixture.specificGravity')}
                    />
                    <p className="helper-text">Required for volumetric yield &amp; dosage mass calculation (standard liquid: ~1.15–1.20)</p>
                    {errors.admixture?.specificGravity && <p className="error-text">{errors.admixture.specificGravity.message}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-2">
        <button type="button" onClick={onPrev} className="btn-secondary flex items-center gap-2">
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>
        <button type="button" onClick={handleSubmit(onSubmit)} className="btn-primary flex items-center gap-2">
          <span>Review & Calculate</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </form>
  );
}