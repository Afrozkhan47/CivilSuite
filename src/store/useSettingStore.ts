/**
 * Zustand store for application settings
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';
type UnitSystem = 'SI' | 'MKS';

interface SettingsStore {
  theme: Theme;
  unitSystem: UnitSystem;
  defaultEngineerName: string;
  defaultCompanyName: string;
  setTheme: (theme: Theme) => void;
  setUnitSystem: (system: UnitSystem) => void;
  setDefaultEngineerName: (name: string) => void;
  setDefaultCompanyName: (name: string) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: 'light',
      unitSystem: 'SI',
      defaultEngineerName: '',
      defaultCompanyName: '',
      setTheme: (theme) => set({ theme }),
      setUnitSystem: (system) => set({ unitSystem: system }),
      setDefaultEngineerName: (name) => set({ defaultEngineerName: name }),
      setDefaultCompanyName: (name) => set({ defaultCompanyName: name }),
    }),
    { name: 'civilsuite-settings' }
  )
);