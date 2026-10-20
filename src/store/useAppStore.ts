
import { create } from 'zustand'
import type { AppModule, AppSettings, InstrumentId } from '../types/index'

export type DisplayPreset = 'practice' | 'balanced' | 'learning'

export interface DisplayPreferences {
  preset: DisplayPreset
  showRagaSelector: boolean
  showLiveSwarasthana: boolean
  showScale: boolean
  showNotationLegend: boolean
  showPracticeDetails: boolean
  showSpeedControls: boolean
  showPlaybackMode: boolean
  showLoopControl: boolean
}

const DISPLAY_PRESETS: Record<DisplayPreset, Omit<DisplayPreferences, 'preset'>> = {
  practice: {
    showRagaSelector: false,
    showLiveSwarasthana: false,
    showScale: false,
    showNotationLegend: false,
    showPracticeDetails: false,
    showSpeedControls: true,
    showPlaybackMode: false,
    showLoopControl: true,
  },
  balanced: {
    showRagaSelector: true,
    showLiveSwarasthana: true,
    showScale: true,
    showNotationLegend: false,
    showPracticeDetails: false,
    showSpeedControls: true,
    showPlaybackMode: true,
    showLoopControl: true,
  },
  learning: {
    showRagaSelector: true,
    showLiveSwarasthana: true,
    showScale: true,
    showNotationLegend: true,
    showPracticeDetails: true,
    showSpeedControls: true,
    showPlaybackMode: true,
    showLoopControl: true,
  },
}

const STORAGE_KEY = 'nada-vidya-display-preferences'

function loadDisplayPreferences(): DisplayPreferences {
  const defaults: DisplayPreferences = {
    preset: 'balanced',
    ...DISPLAY_PRESETS.balanced,
  }

  if (typeof window === 'undefined') return defaults

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (!saved) return defaults

    const parsed = JSON.parse(saved) as Partial<DisplayPreferences>
    const preset =
      parsed.preset === 'practice' ||
      parsed.preset === 'balanced' ||
      parsed.preset === 'learning'
        ? parsed.preset
        : defaults.preset

    return {
      ...defaults,
      ...parsed,
      preset,
    }
  } catch {
    return defaults
  }
}

function saveDisplayPreferences(preferences: DisplayPreferences) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
  } catch {
    // The app remains usable if browser storage is unavailable.
  }
}

// Detect mobile on initial load — sidebar closed by default on small screens.
const isMobile = () =>
  typeof window !== 'undefined' && window.innerWidth < 900

interface AppState {
  module: AppModule
  settings: AppSettings
  sidebarOpen: boolean
  displayPreferences: DisplayPreferences
  setModule: (m: AppModule) => void
  updateSettings: (s: Partial<AppSettings>) => void
  setSidebarOpen: (v: boolean) => void
  setDisplayPreset: (preset: DisplayPreset) => void
  updateDisplayPreferences: (
    partial: Partial<Omit<DisplayPreferences, 'preset'>>
  ) => void
}

export const useAppStore = create<AppState>((set) => ({
  module: 'home',
  sidebarOpen: !isMobile(),
  settings: {
    tonicHz: 261.63,
    bpm: 80,
    volume: 0.7,
    instrument: 'veena' as InstrumentId,
    theme: 'dark',
    language: 'english',
  },
  displayPreferences: loadDisplayPreferences(),

  setModule: (module) => set({ module }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  updateSettings: (partial) =>
    set((s) => ({ settings: { ...s.settings, ...partial } })),

  setDisplayPreset: (preset) =>
    set(() => {
      const preferences: DisplayPreferences = {
        preset,
        ...DISPLAY_PRESETS[preset],
      }
      saveDisplayPreferences(preferences)
      return { displayPreferences: preferences }
    }),

  updateDisplayPreferences: (partial) =>
    set((s) => {
      const preferences: DisplayPreferences = {
        ...s.displayPreferences,
        ...partial,
      }
      saveDisplayPreferences(preferences)
      return { displayPreferences: preferences }
    }),
}))
