'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, FileText } from 'lucide-react';
import type { ProjectDetails } from '@/features/mix-design/types';

const schema = z.object({
  projectName: z.string().min(2, 'Project name must be at least 2 characters').max(100),
  clientName: z.string().min(2, 'Client name is required').max(100),
  engineerName: z.string().min(2, 'Engineer name is required').max(100),
  date: z.string().min(1, 'Date is required'),
  location: z.string().min(2, 'Location is required').max(200),
  remarks: z.string().max(500).optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

interface Step1Props {
  data: ProjectDetails;
  onNext: (data: ProjectDetails) => void;
}

export default function Step1ProjectDetails({ data, onNext }: Step1Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: data,
  });

  const onSubmit = (values: FormValues) => {
    onNext(values as ProjectDetails);
  };

  const onError = (formErrors: typeof errors) => {
    const errorList = Object.entries(formErrors).map(([key, val]) => `${key}: ${val?.message}`);
    console.log('STEP 1 FORM VALIDATION ERRORS:', errorList);
  };

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6 animate-fade-in">
      <div className="bg-card border border-border rounded-sm shadow-xs overflow-hidden">
        {/* Technical Worksheet Header */}
        <div className="bg-muted/50 px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-sm bg-primary/10 flex items-center justify-center text-primary font-bold">
              <FileText size={15} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground tracking-tight">
                01. PROJECT IDENTIFICATION WORKSHEET
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                IS 10262:2019 Consulting Metadata & Project Record Information
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block font-mono-tech text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-background px-2.5 py-1 rounded-sm border border-border">
            SECTION 01
          </span>
        </div>

        {/* Input Fields Content */}
        <div className="p-6 space-y-6">
          {/* SECTION A */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1.5 border-b border-border/80">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider font-mono-tech">
                SECTION A — Project Specification & Ownership
              </h3>
              <span className="text-[10px] text-muted-foreground">Mandatory Record Metadata</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Project Name */}
              <div className="md:col-span-2 space-y-1">
                <label className="label-text" htmlFor="projectName">
                  Structural Project Title <span className="text-error">*</span>
                </label>
                <input
                  id="projectName"
                  type="text"
                  className="input-field font-semibold text-xs rounded-sm"
                  placeholder="e.g. Metro Line 4 — Pier Foundation RCC Concrete"
                  {...register('projectName')}
                />
                <p className="helper-text">Official title printed on consulting PDF export report</p>
                {errors.projectName && <p className="error-text">{errors.projectName.message}</p>}
              </div>

              {/* Client Name */}
              <div className="space-y-1">
                <label className="label-text" htmlFor="clientName">
                  Client / Authority <span className="text-error">*</span>
                </label>
                <input
                  id="clientName"
                  type="text"
                  className="input-field text-xs rounded-sm"
                  placeholder="e.g. National Highways Authority of India"
                  {...register('clientName')}
                />
                {errors.clientName && <p className="error-text">{errors.clientName.message}</p>}
              </div>

              {/* Engineer Name */}
              <div className="space-y-1">
                <label className="label-text" htmlFor="engineerName">
                  Mix Design Engineer <span className="text-error">*</span>
                </label>
                <input
                  id="engineerName"
                  type="text"
                  className="input-field text-xs rounded-sm"
                  placeholder="e.g. Er. Rajesh Kumar, M.Tech (Structural)"
                  {...register('engineerName')}
                />
                {errors.engineerName && <p className="error-text">{errors.engineerName.message}</p>}
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="label-text" htmlFor="date">
                  Calculation Date <span className="text-error">*</span>
                </label>
                <input
                  id="date"
                  type="date"
                  className="input-field text-xs font-mono-tech rounded-sm"
                  {...register('date')}
                />
                {errors.date && <p className="error-text">{errors.date.message}</p>}
              </div>

              {/* Location */}
              <div className="space-y-1">
                <label className="label-text" htmlFor="location">
                  Site Location / Region <span className="text-error">*</span>
                </label>
                <input
                  id="location"
                  type="text"
                  className="input-field text-xs rounded-sm"
                  placeholder="e.g. Pune, Maharashtra"
                  {...register('location')}
                />
                {errors.location && <p className="error-text">{errors.location.message}</p>}
              </div>
            </div>
          </div>

          {/* SECTION B */}
          <div className="space-y-4 pt-2 border-t border-border/60">
            <div className="flex items-center justify-between pb-1.5 border-b border-border/80">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider font-mono-tech">
                SECTION B — Technical Notes & Field Remarks
              </h3>
              <span className="text-[10px] text-muted-foreground font-mono-tech">Optional Notes</span>
            </div>

            <div className="space-y-1">
              <label className="label-text" htmlFor="remarks">
                Engineering Field Remarks
              </label>
              <textarea
                id="remarks"
                rows={2}
                className="input-field text-xs resize-none rounded-sm"
                placeholder="e.g. Retaining wall pours. Pumping distance 120m. Accelerated curing trial."
                {...register('remarks')}
              />
              {errors.remarks && <p className="error-text">{errors.remarks.message}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Action */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-muted-foreground">
          <span className="text-error">*</span> Mandatory consulting metadata fields
        </span>
        <button type="button" onClick={handleSubmit(onSubmit, onError)} className="btn-primary flex items-center gap-2">
          <span>Next: Design Parameters</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </form>
  );
}