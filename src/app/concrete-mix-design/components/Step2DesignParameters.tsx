'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, ArrowRight, Sliders } from 'lucide-react';
import type { DesignParameters } from '@/features/mix-design/types';
import { lookupAirContent, lookupAirContentHighStrength } from '@/features/mix-design/reference-data';

const schema = z.object({
  concreteGrade: z.enum(['M10', 'M15', 'M20', 'M25', 'M30', 'M35', 'M40', 'M45', 'M50', 'M55', 'M60', 'M65', 'M70', 'M75', 'M80']),
  exposureCondition: z.enum(['mild', 'moderate', 'severe', 'very_severe', 'extreme']),
  slump: z.coerce.number().min(10, 'Minimum slump is 10 mm').max(200, 'Maximum slump is 200 mm'),
  maxAggregateSize: z.coerce.number().refine((v) => [10, 12.5, 20, 40].includes(v), {
    message: 'Select a valid aggregate size',
  }),
  isPumpedConcrete: z.boolean(),
  isAirEntrained: z.boolean(),
  targetAirContent: z.coerce.number().optional(),
  adoptedWcOverride: z.coerce.number().min(0.2).max(0.9).optional(),
  siteControl: z.enum(['good', 'fair']),
  faZone: z.enum(['I', 'II', 'III', 'IV']),
}).superRefine((data, ctx) => {
  if (data.isAirEntrained) {
    if (data.targetAirContent === undefined || isNaN(data.targetAirContent)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Required for air-entrained mixes',
        path: ['targetAirContent'],
      });
      return;
    }
    if (data.maxAggregateSize === 20 && (data.targetAirContent < 4.0 || data.targetAirContent > 6.0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'IS 456:2000 specifies 5 ± 1% for 20 mm aggregate',
        path: ['targetAirContent'],
      });
    } else if (data.targetAirContent < 1.0 || data.targetAirContent > 10.0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Min 1.0%, Max 10.0%',
        path: ['targetAirContent'],
      });
    }
  }
});

type FormValues = z.infer<typeof schema>;

const GRADES = ['M10', 'M15', 'M20', 'M25', 'M30', 'M35', 'M40', 'M45', 'M50', 'M55', 'M60', 'M65', 'M70', 'M75', 'M80'] as const;

const EXPOSURE_CONDITIONS = [
  { value: 'mild', label: 'Mild', desc: 'Protected structures' },
  { value: 'moderate', label: 'Moderate', desc: 'Sheltered from severe rain' },
  { value: 'severe', label: 'Severe', desc: 'Rain & wet-dry cycles' },
  { value: 'very_severe', label: 'Very Severe', desc: 'Seawater spray & deicing' },
  { value: 'extreme', label: 'Extreme', desc: 'Tidal zone & abrasive water' },
];

const AGGREGATE_SIZES = [10, 12.5, 20, 40];
const FA_ZONES = ['I', 'II', 'III', 'IV'] as const;

interface Step2Props {
  data: DesignParameters;
  onNext: (data: DesignParameters) => void;
  onPrev: () => void;
}

export default function Step2DesignParameters({ data, onNext, onPrev }: Step2Props) {
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
      concreteGrade: data.concreteGrade as FormValues['concreteGrade'],
      exposureCondition: data.exposureCondition,
      slump: typeof data.slump === 'string' ? parseFloat(data.slump) : data.slump,
      maxAggregateSize: data.maxAggregateSize,
      isPumpedConcrete: data.isPumpedConcrete,
      isAirEntrained: data.isAirEntrained,
      targetAirContent: data.targetAirContent,
      siteControl: data.siteControl ?? 'good',
      faZone: data.faZone ?? 'II',
    },
  });

  const selectedGrade = watch('concreteGrade') || 'M25';
  const selectedMSA = Number(watch('maxAggregateSize') || 20);
  const selectedExposure = watch('exposureCondition');
  const selectedFAZone = watch('faZone');
  const isAirEntrained = watch('isAirEntrained');

  const fck = parseInt(selectedGrade.replace('M', ''), 10);
  const isHS = fck >= 65;

  const adoptedEntrappedAir = isHS
    ? lookupAirContentHighStrength(selectedMSA) ?? 0.5
    : lookupAirContent(selectedMSA) ?? 1.0;

  const onSubmit = (values: FormValues) => {
    onNext(values as DesignParameters);
  };

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-fade-in">
      <div className="bg-card border border-border rounded-sm shadow-xs overflow-hidden">
        {/* Technical Worksheet Header */}
        <div className="bg-muted/50 px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-sm bg-primary/10 flex items-center justify-center text-primary font-bold">
              <Sliders size={15} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground tracking-tight">
                02. DESIGN PARAMETERS & EXPOSURE WORKSHEET
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                IS 10262:2019 Clause 4 & Clause 5 Structural Criteria
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block font-mono-tech text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-background px-2.5 py-1 rounded-sm border border-border">
            SECTION 02
          </span>
        </div>

        {/* Input Fields Content */}
        <div className="p-6 space-y-6">
          {/* 01 CONCRETE GRADE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-border/80">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider font-mono-tech">
                01 CONCRETE — Grade Selection (fck Target)
              </h3>
              <span className="font-mono-tech font-bold text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-sm border border-primary/20">
                {selectedGrade} ({fck} MPa Target Strength)
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
              {GRADES.map((g) => {
                const isSelected = selectedGrade === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setValue('concreteGrade', g)}
                    className={`px-3 py-1.5 rounded-sm font-mono-tech font-bold text-xs flex-shrink-0 transition-all ${
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border border-border'
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 02 EXPOSURE CONDITION */}
          <div className="space-y-3 pt-2 border-t border-border/60">
            <div className="flex items-center justify-between pb-1.5 border-b border-border/80">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider font-mono-tech">
                02 EXPOSURE — Environmental Exposure (IS 456 Table 5)
              </h3>
              <span className="text-[10px] text-muted-foreground">Durability Class</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {EXPOSURE_CONDITIONS.map((exp) => {
                const isSelected = selectedExposure === exp.value;
                return (
                  <button
                    key={exp.value}
                    type="button"
                    onClick={() => setValue('exposureCondition', exp.value as FormValues['exposureCondition'])}
                    className={`p-2.5 rounded-sm text-left transition-all border ${
                      isSelected
                        ? 'bg-primary/10 border-primary text-primary font-bold'
                        : 'bg-background border-border hover:border-primary/40 text-muted-foreground'
                    }`}
                  >
                    <span className="block font-bold text-xs text-foreground uppercase font-mono-tech">{exp.label}</span>
                    <span className="block text-[10px] text-muted-foreground leading-tight mt-0.5 truncate">
                      {exp.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 03 WORKABILITY & 04 PLACEMENT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-border/60">
            {/* 03 WORKABILITY */}
            <div className="space-y-2">
              <div className="pb-1 border-b border-border/80">
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider font-mono-tech">
                  03 WORKABILITY — Target Slump (mm)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="slump"
                  type="number"
                  step="5"
                  className="input-field font-mono-tech text-xs rounded-sm"
                  placeholder="100"
                  {...register('slump')}
                />
                <span className="text-xs font-mono-tech text-muted-foreground flex-shrink-0">mm</span>
              </div>
              <p className="helper-text">Base 50 mm (+3% water per +25 mm slump above 50 mm)</p>
              {errors.slump && <p className="error-text">{errors.slump.message}</p>}
            </div>

            {/* 04 PLACEMENT */}
            <div className="space-y-2">
              <div className="pb-1 border-b border-border/80">
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider font-mono-tech">
                  04 PLACEMENT — Pumped Concrete Method
                </h3>
              </div>
              <Controller
                name="isPumpedConcrete"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => field.onChange(false)}
                      className={`p-2 rounded-sm text-xs font-bold font-mono-tech transition-all border ${
                        !field.value
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-muted-foreground border-border hover:border-primary/40'
                      }`}
                    >
                      NON-PUMPED
                    </button>
                    <button
                      type="button"
                      onClick={() => field.onChange(true)}
                      className={`p-2 rounded-sm text-xs font-bold font-mono-tech transition-all border ${
                        field.value
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-muted-foreground border-border hover:border-primary/40'
                      }`}
                    >
                      PUMPED CONCRETE (-10% CA)
                    </button>
                  </div>
                )}
              />
              <p className="helper-text">Applies 10% coarse aggregate volume reduction per IS 10262 Cl. 6.5.2.2</p>
            </div>
          </div>

          {/* 05 AIR CONDITION */}
          <div className="space-y-3 pt-2 border-t border-border/60">
            <div className="flex items-center justify-between pb-1.5 border-b border-border/80">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider font-mono-tech">
                05 AIR CONDITION — Air Entrainment Mode
              </h3>
            </div>

            <Controller
              name="isAirEntrained"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-2 max-w-md">
                  <button
                    type="button"
                    onClick={() => field.onChange(false)}
                    className={`p-2 rounded-sm text-xs font-bold font-mono-tech transition-all border ${
                      !field.value
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-muted-foreground border-border hover:border-primary/40'
                    }`}
                  >
                    NON-AIR-ENTRAINED
                  </button>
                  <button
                    type="button"
                    onClick={() => field.onChange(true)}
                    className={`p-2 rounded-sm text-xs font-bold font-mono-tech transition-all border ${
                      field.value
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-muted-foreground border-border hover:border-primary/40'
                    }`}
                  >
                    AIR-ENTRAINED
                  </button>
                </div>
              )}
            />

            {!isAirEntrained ? (
              <div className="p-3 rounded-sm border border-border bg-muted/40 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono-tech font-bold text-xs text-foreground uppercase">
                    ENTRAPPED AIR (AUTOMATIC)
                  </span>
                  <span className="px-2.5 py-0.5 rounded-sm font-mono-tech font-bold text-xs bg-primary/10 text-primary border border-primary/20">
                    Adopted Air: {adoptedEntrappedAir.toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Automatically adopted from IS 10262:2019 Table {isHS ? '6' : '3'} reference data for {selectedMSA} mm aggregate.
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-sm border border-primary/30 bg-primary/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono-tech font-bold text-xs text-primary uppercase">
                    ENTRAINED AIR (USER TARGET SPECIFIED)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="targetAirContent"
                    type="number"
                    step="0.5"
                    className="input-field font-mono-tech text-xs max-w-xs rounded-sm"
                    placeholder="4.0"
                    {...register('targetAirContent')}
                  />
                  <span className="text-xs font-mono-tech text-muted-foreground">%</span>
                </div>
                {errors.targetAirContent && <p className="error-text">{errors.targetAirContent.message}</p>}
              </div>
            )}
          </div>

          {/* 06 AGGREGATE GRADING & 07 SITE CONTROL */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2 border-t border-border/60">
            {/* MSA Rail */}
            <div className="space-y-2">
              <div className="pb-1 border-b border-border/80">
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider font-mono-tech">
                  06 AGGREGATE — Max Size (MSA)
                </h3>
              </div>
              <div className="flex items-center gap-1">
                {AGGREGATE_SIZES.map((size) => {
                  const isSelected = selectedMSA === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setValue('maxAggregateSize', size)}
                      className={`flex-1 py-1.5 rounded-sm font-mono-tech font-bold text-xs transition-all border ${
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-muted-foreground border-border hover:border-primary/40'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* FA Zone Rail */}
            <div className="space-y-2">
              <div className="pb-1 border-b border-border/80">
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider font-mono-tech">
                  FA Zone (IS 383)
                </h3>
              </div>
              <div className="flex items-center gap-1">
                {FA_ZONES.map((zone) => {
                  const isSelected = selectedFAZone === zone;
                  return (
                    <button
                      key={zone}
                      type="button"
                      onClick={() => setValue('faZone', zone)}
                      className={`flex-1 py-1.5 rounded-sm font-mono-tech font-bold text-xs transition-all border ${
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-muted-foreground border-border hover:border-primary/40'
                      }`}
                    >
                      Zone {zone}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 07 Site Control */}
            <div className="space-y-2">
              <div className="pb-1 border-b border-border/80">
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider font-mono-tech">
                  07 SITE CONTROL
                </h3>
              </div>
              <Controller
                name="siteControl"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => field.onChange('good')}
                      className={`py-1.5 px-2 rounded-sm text-xs font-bold font-mono-tech transition-all border ${
                        field.value === 'good'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-muted-foreground border-border hover:border-primary/40'
                      }`}
                    >
                      GOOD CONTROL
                    </button>
                    <button
                      type="button"
                      onClick={() => field.onChange('fair')}
                      className={`py-1.5 px-2 rounded-sm text-xs font-bold font-mono-tech transition-all border ${
                        field.value === 'fair'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-muted-foreground border-border hover:border-primary/40'
                      }`}
                    >
                      FAIR CONTROL
                    </button>
                  </div>
                )}
              />
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
          <span>Next: Material Properties</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </form>
  );
}