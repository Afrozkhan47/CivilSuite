/**
 * Zustand store for active calculator state
 */
import { create } from 'zustand';
import type { MixDesignInput, MixDesignResult } from '@/features/mix-design/types';

interface CalculatorStore {
  currentStep: number;
  totalSteps: number;
  currentInput: Partial<MixDesignInput>;
  currentResult: MixDesignResult | null;
  isCalculating: boolean;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateInput: (partial: Partial<MixDesignInput>) => void;
  setResult: (result: MixDesignResult) => void;
  setCalculating: (val: boolean) => void;
  reset: () => void;
}

const initialInput: Partial<MixDesignInput> = {};

export const useCalculatorStore = create<CalculatorStore>((set) => ({
  currentStep: 1,
  totalSteps: 4,
  currentInput: initialInput,
  currentResult: null,
  isCalculating: false,

  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, s.totalSteps) })),
  prevStep: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 1) })),
  updateInput: (partial) =>
    set((s) => ({ currentInput: { ...s.currentInput, ...partial } })),
  setResult: (result) => set({ currentResult: result }),
  setCalculating: (val) => set({ isCalculating: val }),
  reset: () =>
    set({ currentStep: 1, currentInput: initialInput, currentResult: null, isCalculating: false }),
}));