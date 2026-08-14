'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StepProgress from '@/components/ui/StepProgress';
import Step1ProjectDetails from './Step1ProjectDetails';
import Step2DesignParameters from './Step2DesignParameters';
import Step3MaterialProperties from './Step3MaterialProperties';
import Step4Review from './Step4Review';
import type { MixDesignInput } from '@/features/mix-design/types';

import { useProjectStore } from '@/store/useProjectStore';

const STEPS = [
  { number: 1, label: 'Project Details' },
  { number: 2, label: 'Design Parameters' },
  { number: 3, label: 'Material Properties' },
  { number: 4, label: 'Review & Calculate' },
];

const DEFAULT_INPUT: MixDesignInput = {
  projectDetails: {
    projectName: '',
    clientName: '',
    engineerName: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    remarks: '',
  },
  designParameters: {
    concreteGrade: 'M25',
    exposureCondition: 'moderate',
    slump: 100,
    maxAggregateSize: 20,
    isPumpedConcrete: false,
    isAirEntrained: false,
    faZone: 'II',
    siteControl: 'good',
  },
  materialProperties: {
    cement: { type: 'OPC_53', specificGravity: 3.15 },
    fineAggregate: { specificGravity: 2.65, waterAbsorption: 1.0, finesModulus: 2.8 },
    coarseAggregate: { specificGravity: 2.70, waterAbsorption: 0.5, angularity: 'angular' },
    water: { source: 'Potable water' },
    admixture: { type: '', dosage: 0, specificGravity: 1.0 },
  },
};

export default function ConcreteMixDesignContent() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<MixDesignInput>(DEFAULT_INPUT);
  const projects = useProjectStore((state) => state.projects);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const projectId = searchParams.get('projectId');
      if (projectId) {
        const saved = projects.find((p) => p.id === projectId);
        if (saved?.input) {
          setFormData(saved.input);
          sessionStorage.setItem('civilsuite-current-input', JSON.stringify(saved.input));
          return;
        }
      }
      const stored = sessionStorage.getItem('civilsuite-current-input');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === 'object' && parsed.projectDetails) {
            setFormData(parsed);
          }
        } catch {
          // fallback
        }
      }
    }
  }, [projects]);

  const handleStepData = (stepData: Partial<MixDesignInput>) => {
    setFormData((prev) => {
      const updated = { ...prev, ...stepData };
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('civilsuite-current-input', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const handleNext = () => setCurrentStep((s) => Math.min(s + 1, 4));
  const handlePrev = () => setCurrentStep((s) => Math.max(s - 1, 1));

  const handleCalculate = async () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('civilsuite-current-input', JSON.stringify(formData));
    }
    router.push('/mix-design-results');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">New Mix Design</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          IS 10262:2019 — Concrete Mix Proportioning Guidelines
        </p>
      </div>

      {/* Step progress */}
      <div className="card-base">
        <StepProgress steps={STEPS} currentStep={currentStep} />
      </div>

      {/* Step content */}
      <div>
        {currentStep === 1 && (
          <Step1ProjectDetails
            key={formData.projectDetails.projectName || 's1'}
            data={formData.projectDetails}
            onNext={(data) => {
              handleStepData({ projectDetails: data });
              handleNext();
            }}
          />
        )}
        {currentStep === 2 && (
          <Step2DesignParameters
            key={formData.designParameters.concreteGrade + formData.designParameters.slump}
            data={formData.designParameters}
            onNext={(data) => {
              handleStepData({ designParameters: data });
              handleNext();
            }}
            onPrev={handlePrev}
          />
        )}
        {currentStep === 3 && (
          <Step3MaterialProperties
            key={formData.materialProperties.cement.type + (formData.materialProperties.admixture?.waterReduction || 0)}
            data={formData.materialProperties}
            onNext={(data) => {
              handleStepData({ materialProperties: data });
              handleNext();
            }}
            onPrev={handlePrev}
          />
        )}
        {currentStep === 4 && (
          <Step4Review
            key="step4"
            input={formData}
            onEditStep={(step) => setCurrentStep(step)}
            onCalculate={handleCalculate}
            onPrev={handlePrev}
          />
        )}
      </div>
    </div>
  );
}