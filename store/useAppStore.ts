import { create } from 'zustand'
import type { AppModule, AppSettings, InstrumentId } from '../types/index'

interface AppState {
  module: AppModule
  settings: AppSettings
  sidebarOpen: boolean
  setModule: (m: AppModule) => void
  updateSettings: (s: Partial<AppSettings>) => void
  setSidebarOpen: (v: boolean) => void
}

// Detect mobile on initial load — sidebar closed by default on small screens
const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 900

export const useAppStore = create<AppState>((set) => ({
  module: 'home',
  sidebarOpen: !isMobile(),   // ← closed on mobile, open on desktop
  settings: {
    tonicHz: 261.63,
    bpm: 80,
    volume: 0.7,
    instrument: 'veena' as InstrumentId,
    theme: 'dark',
    language: 'english',
  },
  setModule: (module) => set({ module }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  updateSettings: (partial) => set(s => ({ settings: { ...s.settings, ...partial } })),
}))

