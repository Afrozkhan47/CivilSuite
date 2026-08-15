'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import StepProgress from '@/components/ui/StepProgress';
import Step1ProjectDetails from './Step1ProjectDetails';
import Step2DesignParameters from './Step2DesignParameters';
import Step3MaterialProperties from './Step3MaterialProperties';
import Step4Review from './Step4Review';
import type { MixDesignInput } from '@/features/mix-design/types';
import { useProjectStore, isValidUUID } from '@/store/useProjectStore';

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
    concreteGrade: 'M30',
    exposureCondition: 'moderate',
    slump: 100,
    maxAggregateSize: 20,
    isPumpedConcrete: false,
    isAirEntrained: false,
    faZone: 'II',
    siteControl: 'good',
  },
  materialProperties: {
    cement: { type: 'OPC_43', specificGravity: 3.15 },
    fineAggregate: { specificGravity: 2.65, waterAbsorption: 1.0, surfaceMoisture: 0 },
    coarseAggregate: { specificGravity: 2.70, waterAbsorption: 0.5, surfaceMoisture: 0 },
    water: { source: 'Potable' },
    admixture: { dosage: 0, waterReduction: 0, specificGravity: 1.2 },
  },
};

export default function ConcreteMixDesignContent() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const stepParam = searchParams.get('step');
      if (stepParam) {
        const parsed = parseInt(stepParam, 10);
        if (parsed >= 1 && parsed <= 4) return parsed;
      }
    }
    return 1;
  });
  const [formData, setFormData] = useState<MixDesignInput>(DEFAULT_INPUT);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const projects = useProjectStore((state) => state.projects);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const projectId = searchParams.get('projectId');
      const mode = searchParams.get('mode');
      const stepParam = searchParams.get('step');

      if (stepParam) {
        const parsed = parseInt(stepParam, 10);
        if (parsed >= 1 && parsed <= 4) {
          setCurrentStep(parsed);
        }
      }

      // Explicit Create New Mix Design flow -> start 100% clean
      if (mode === 'new') {
        setEditingProjectId(null);
        setFormData(DEFAULT_INPUT);
        sessionStorage.removeItem('civilsuite-current-input');
        sessionStorage.removeItem('civilsuite-editing-project-id');
        return;
      }

      // Explicit Edit flow via URL projectId
      if (projectId && isValidUUID(projectId)) {
        setEditingProjectId(projectId);
        sessionStorage.setItem('civilsuite-editing-project-id', projectId);

        // Check if there is already an in-flight edited session input for this exact project
        const storedInput = sessionStorage.getItem('civilsuite-current-input');
        const storedEditId = sessionStorage.getItem('civilsuite-editing-project-id');
        if (storedInput && storedEditId === projectId) {
          try {
            const parsed = JSON.parse(storedInput);
            if (parsed && typeof parsed === 'object' && parsed.projectDetails) {
              setFormData(parsed);
              return;
            }
          } catch {
            // fallback to store
          }
        }

        const saved = projects.find((p) => p.id === projectId);
        if (saved?.input) {
          setFormData(saved.input);
          sessionStorage.setItem('civilsuite-current-input', JSON.stringify(saved.input));
          return;
        }
      }

      // Recover stored session edit ID or session input
      const storedEditId = sessionStorage.getItem('civilsuite-editing-project-id');
      if (storedEditId && isValidUUID(storedEditId)) {
        setEditingProjectId(storedEditId);
        const storedInput = sessionStorage.getItem('civilsuite-current-input');
        if (storedInput) {
          try {
            const parsed = JSON.parse(storedInput);
            if (parsed && typeof parsed === 'object' && parsed.projectDetails) {
              setFormData(parsed);
              return;
            }
          } catch {
            // fallback
          }
        }
        const saved = projects.find((p) => p.id === storedEditId);
        if (saved?.input) {
          setFormData(saved.input);
          return;
        }
      } else if (storedEditId && !isValidUUID(storedEditId)) {
        sessionStorage.removeItem('civilsuite-editing-project-id');
      }

      const storedInput = sessionStorage.getItem('civilsuite-current-input');
      if (storedInput) {
        try {
          const parsed = JSON.parse(storedInput);
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
        if (editingProjectId) {
          sessionStorage.setItem('civilsuite-editing-project-id', editingProjectId);
        }
      }
      return updated;
    });
  };

  const goToStep = (step: number) => {
    const nextS = Math.max(1, Math.min(step, 4));
    setCurrentStep(nextS);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('step', String(nextS));
      if (editingProjectId && isValidUUID(editingProjectId)) {
        url.searchParams.set('projectId', editingProjectId);
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  const handleNext = () => goToStep(currentStep + 1);
  const handlePrev = () => goToStep(currentStep - 1);

  const handleCancelEdit = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('civilsuite-current-input');
      sessionStorage.removeItem('civilsuite-editing-project-id');
    }
    router.push('/saved-projects');
  };

  const handleCalculate = async () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('civilsuite-current-input', JSON.stringify(formData));
      if (editingProjectId) {
        sessionStorage.setItem('civilsuite-editing-project-id', editingProjectId);
      }
    }
    const query = editingProjectId ? `?projectId=${editingProjectId}` : '';
    router.push(`/mix-design-results${query}`);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border font-mono-tech">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {editingProjectId ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-warning/15 text-warning border border-warning/30 uppercase">
                Editing Existing Project Mode
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase">
                New Mix Design
              </span>
            )}
          </div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            {editingProjectId ? `Edit Project: ${formData.projectDetails.projectName || 'Untitled Mix'}` : 'New Concrete Mix Design Wizard'}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            IS 10262:2019 — Concrete Mix Proportioning Guidelines
          </p>
        </div>

        {editingProjectId && (
          <button
            onClick={handleCancelEdit}
            className="btn-secondary text-xs flex items-center gap-1.5 flex-shrink-0"
          >
            <ArrowLeft size={13} />
            <span>Cancel Edit & Return to History</span>
          </button>
        )}
      </div>

      {/* Wizard Step Progress Indicator */}
      <div className="bg-card border border-border rounded-sm p-4 shadow-xs">
        <StepProgress
          steps={STEPS}
          currentStep={currentStep}
          onStepClick={(step) => goToStep(step)}
        />
      </div>

      {/* Step Components */}
      <div className="bg-card border border-border rounded-sm p-6 shadow-xs">
        {currentStep === 1 && (
          <Step1ProjectDetails
            data={formData.projectDetails}
            onNext={(data) => {
              handleStepData({ projectDetails: data });
              handleNext();
            }}
          />
        )}

        {currentStep === 2 && (
          <Step2DesignParameters
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
            input={formData}
            onPrev={handlePrev}
            onCalculate={handleCalculate}
            onEditStep={(step) => goToStep(step)}
          />
        )}
      </div>
    </div>
  );
}