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
  isOverlayOpen: boolean;
  language: SupportedLocale;
  currentPath: string;
  settings: MuseumSettings;
  mobileMove: { x: number; y: number };
  mobileLook: { x: number; y: number };
  pointerLock: {
    lock: (() => void) | null;
    unlock: (() => void) | null;
  };
  setEnteredMuseum: (entered: boolean) => void;
  setSelectedPortraitId: (id: string | null) => void;
  setFocusCandidateId: (id: string | null) => void;
  openInfoPanel: (id: string) => void;
  closeInfoPanel: () => void;
  toggleOverlay: (value?: boolean) => void;
  setLanguage: (locale: SupportedLocale) => void;
  setCurrentPath: (path: string) => void;
  updateSettings: (patch: Partial<MuseumSettings>) => void;
  setMobileMove: (vector: { x: number; y: number }) => void;
  setMobileLook: (vector: { x: number; y: number }) => void;
  setPointerLockHandlers: (handlers: Partial<{ lock: (() => void) | null; unlock: (() => void) | null }>) => void;
}

export const useMuseumStore = create<MuseumState>((set) => ({
  enteredMuseum: false,
  isInfoPanelOpen: false,
  selectedPortraitId: null,
  focusCandidateId: null,
  isOverlayOpen: true,
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
  pointerLock: {
    lock: null,
    unlock: null,
  },
  setEnteredMuseum: (entered) => set({ enteredMuseum: entered }),
  setSelectedPortraitId: (id) =>
    set({ selectedPortraitId: id, isInfoPanelOpen: !!id }),
  setFocusCandidateId: (id) => set({ focusCandidateId: id }),
  openInfoPanel: (id) =>
    set({ selectedPortraitId: id, isInfoPanelOpen: true }),
  closeInfoPanel: () =>
    set({ isInfoPanelOpen: false, selectedPortraitId: null }),
  toggleOverlay: (value) =>
    set((state) => {
      const isOverlayOpen = value ?? !state.isOverlayOpen;
      if (isOverlayOpen) {
        state.pointerLock.unlock?.();
      } else {
        state.pointerLock.lock?.();
      }
      return { isOverlayOpen };
    }),
  setLanguage: (locale) => set({ language: locale }),
  setCurrentPath: (path) => set({ currentPath: path }),
  updateSettings: (patch) =>
    set((state) => ({ settings: { ...state.settings, ...patch } })),
  setMobileMove: (vector) => set({ mobileMove: vector }),
  setMobileLook: (vector) => set({ mobileLook: vector }),
  setPointerLockHandlers: (handlers) =>
    set((state) => ({
      pointerLock: { ...state.pointerLock, ...handlers },
    })),
}));
