'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, ArrowRight, Layers } from 'lucide-react';
import type { MaterialProperties } from '@/features/mix-design/types';

const schema = z.object({
  cement: z.object({
    type: z.string().min(1, 'Cement type required'),
    specificGravity: z.coerce.number().min(2.5, 'Min SG is 2.5').max(3.5, 'Max SG is 3.5'),
    grade: z.coerce.number().optional(),
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
    dosage: z.coerce.number().min(0).max(10).optional(),
    dosageBasis: z.enum(['percent_cement', 'liters_per_m3']).optional(),
    waterReduction: z.coerce.number().min(0).max(40).optional(),
    specificGravity: z.coerce.number().min(1.0).max(1.5).optional(),
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
  const {
    register,
    handleSubmit,
    watch,
    control,
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
        type: data.admixture?.type || 'Superplasticizer',
        dosage: data.admixture?.dosage || 0,
        dosageBasis: (data.admixture?.dosageBasis === 'liters_per_m3' ? 'liters_per_m3' : 'percent_cement') as FormValues['admixture']['dosageBasis'],
        waterReduction: data.admixture?.waterReduction || 0,
        specificGravity: data.admixture?.specificGravity || 1.15,
      },
    },
  });

  const selectedCementType = watch('cement.type');
  const selectedAngularity = watch('coarseAggregate.angularity');
  const dosageBasis = watch('admixture.dosageBasis');

  const onSubmit = (values: FormValues) => {
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              </div>
            </div>
          </div>

          {/* 04 CHEMICAL ADMIXTURE */}
          <div className="space-y-3 pt-2 border-t border-border/60">
            <div className="flex items-center justify-between pb-1.5 border-b border-border/80">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider font-mono-tech">
                04 ADMIXTURE — Chemical Plasticizer / Superplasticizer (IS 9103)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="label-text">Admixture Dosage Basis</label>
                <Controller
                  name="admixture.dosageBasis"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-2 gap-2 font-mono-tech text-xs">
                      <button
                        type="button"
                        onClick={() => field.onChange('percent_cement')}
                        className={`p-2 rounded-sm text-left border font-bold ${
                          field.value === 'percent_cement'
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-background border-border text-muted-foreground'
                        }`}
                      >
                        <span className="block text-xs font-bold text-foreground">% by Cement Mass</span>
                        <span className="block text-[10px] text-muted-foreground">Standard % dosage</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange('liters_per_m3')}
                        className={`p-2 rounded-sm text-left border font-bold ${
                          field.value === 'liters_per_m3'
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-background border-border text-muted-foreground'
                        }`}
                      >
                        <span className="block text-xs font-bold text-foreground">Liters per m³</span>
                        <span className="block text-[10px] text-muted-foreground">Volumetric L/m³</span>
                      </button>
                    </div>
                  )}
                />
              </div>

              <div className="space-y-1">
                <label className="label-text" htmlFor="admixDosage">
                  Dosage Rate {dosageBasis === 'liters_per_m3' ? '(L/m³)' : '(% by cement mass)'}
                </label>
                <input
                  id="admixDosage"
                  type="number"
                  step="0.1"
                  className="input-field font-mono-tech text-xs rounded-sm"
                  placeholder="1.0"
                  {...register('admixture.dosage')}
                />
                <p className="helper-text">Enter 0 if no admixture is used</p>
              </div>

              <div className="space-y-1">
                <label className="label-text" htmlFor="admixWr">
                  Water Reduction (%)
                </label>
                <input
                  id="admixWr"
                  type="number"
                  step="any"
                  className="input-field font-mono-tech text-xs rounded-sm"
                  placeholder="15"
                  {...register('admixture.waterReduction')}
                />
                <p className="helper-text">Trial water reduction (e.g. 15%–30%)</p>
              </div>

              <div className="space-y-1">
                <label className="label-text" htmlFor="admixSg">
                  Admixture Specific Gravity (S_adm)
                </label>
                <input
                  id="admixSg"
                  type="number"
                  step="0.01"
                  className="input-field font-mono-tech text-xs rounded-sm"
                  placeholder="1.15"
                  {...register('admixture.specificGravity')}
                />
                <p className="helper-text">Required for volumetric yield & dosage calculation</p>
              </div>
            </div>
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