import { create } from 'zustand';

export type SupportedLocale = 'az' | 'en';

export interface MuseumSettings {
  volume: number;
  lookSensitivity: number;
  reduceEffects: boolean;
  cameraBob: boolean;
  showCrosshair: boolean;
}

interface MuseumState {
  enteredMuseum: boolean;
  isInfoPanelOpen: boolean;
  selectedPortraitId: string | null;
  focusCandidateId: string | null;
  isSettingsOpen: boolean;
  isHelpOpen: boolean;
  language: SupportedLocale;
  currentPath: string;
  settings: MuseumSettings;
  mobileMove: { x: number; y: number };
  mobileLook: { x: number; y: number };
  setEnteredMuseum: (entered: boolean) => void;
  setSelectedPortraitId: (id: string | null) => void;
  setFocusCandidateId: (id: string | null) => void;
  openInfoPanel: (id: string) => void;
  closeInfoPanel: () => void;
  toggleSettings: (value?: boolean) => void;
  toggleHelp: (value?: boolean) => void;
  setLanguage: (locale: SupportedLocale) => void;
  setCurrentPath: (path: string) => void;
  updateSettings: (patch: Partial<MuseumSettings>) => void;
  setMobileMove: (vector: { x: number; y: number }) => void;
  setMobileLook: (vector: { x: number; y: number }) => void;
}

export const useMuseumStore = create<MuseumState>((set) => ({
  enteredMuseum: false,
  isInfoPanelOpen: false,
  selectedPortraitId: null,
  focusCandidateId: null,
  isSettingsOpen: false,
  isHelpOpen: false,
  language: 'az',
  currentPath: '/',
  settings: {
    volume: 0.8,
    lookSensitivity: 0.9,
    reduceEffects: false,
    cameraBob: true,
    showCrosshair: false,
  },
  mobileMove: { x: 0, y: 0 },
  mobileLook: { x: 0, y: 0 },
  setEnteredMuseum: (entered) => set({ enteredMuseum: entered }),
  setSelectedPortraitId: (id) =>
    set({ selectedPortraitId: id, isInfoPanelOpen: !!id }),
  setFocusCandidateId: (id) => set({ focusCandidateId: id }),
  openInfoPanel: (id) =>
    set({ selectedPortraitId: id, isInfoPanelOpen: true }),
  closeInfoPanel: () =>
    set({ isInfoPanelOpen: false, selectedPortraitId: null }),
  toggleSettings: (value) =>
    set((state) => ({
      isSettingsOpen: value ?? !state.isSettingsOpen,
      isHelpOpen: value === true ? false : state.isHelpOpen,
    })),
  toggleHelp: (value) =>
    set((state) => ({
      isHelpOpen: value ?? !state.isHelpOpen,
      isSettingsOpen: value === true ? false : state.isSettingsOpen,
    })),
  setLanguage: (locale) => set({ language: locale }),
  setCurrentPath: (path) => set({ currentPath: path }),
  updateSettings: (patch) =>
    set((state) => ({ settings: { ...state.settings, ...patch } })),
  setMobileMove: (vector) => set({ mobileMove: vector }),
  setMobileLook: (vector) => set({ mobileLook: vector }),
}));
