import { create } from 'zustand';
import { GAMAKA_PROFILES, GAMAKA_EXERCISES } from '../data/gamakaCatalogData';
import type { InstrumentType } from '../types/gamaka';

interface GamakaState {
  // Navigation
  activeTab: 'listen' | 'game';
  setActiveTab: (tab: 'listen' | 'game') => void;

  // Gamaka timbre is module-specific; tonic and volume come from the shared app store.
  selectedInstrument: InstrumentType;
  setSelectedInstrument: (inst: InstrumentType) => void;
  enableTambura: boolean;
  setEnableTambura: (enable: boolean) => void;

  // Listen & Compare
  selectedRagaFilter: string;
  setSelectedRagaFilter: (raga: string) => void;
  activeGamakaId: string;
  setActiveGamakaId: (id: string) => void;
  isPlaying: boolean;
  currentTrack: 'A' | 'B' | null;
  setIsPlaying: (playing: boolean, track?: 'A' | 'B' | null) => void;

  // Voice Flight Game
  gameLevel: 'beginner' | 'intermediate' | 'expert';
  setGameLevel: (lvl: 'beginner' | 'intermediate' | 'expert') => void;
  activeExerciseId: string;
  setActiveExerciseId: (id: string) => void;
  lastScore: number | null;
  lastStars: number;
  setGameResult: (score: number, stars: number) => void;
}

export const useGamakaStore = create<GamakaState>((set) => ({
  activeTab: 'listen',
  setActiveTab: (tab) => set({ activeTab: tab }),

  selectedInstrument: 'veena',
  setSelectedInstrument: (selectedInstrument) => set({ selectedInstrument }),

  enableTambura: false,
  setEnableTambura: (enableTambura) => set({ enableTambura }),

  selectedRagaFilter: 'ALL',
  setSelectedRagaFilter: (selectedRagaFilter) => set({ selectedRagaFilter }),

  activeGamakaId: GAMAKA_PROFILES[0]?.id || '',
  setActiveGamakaId: (activeGamakaId) => set({ activeGamakaId }),

  isPlaying: false,
  currentTrack: null,
  setIsPlaying: (isPlaying, currentTrack = null) => set({ isPlaying, currentTrack }),

  gameLevel: 'beginner',
  setGameLevel: (gameLevel) => {
    const firstEx = GAMAKA_EXERCISES.find(e => e.level === gameLevel);
    set({ gameLevel, activeExerciseId: firstEx ? firstEx.id : '' });
  },

  activeExerciseId: GAMAKA_EXERCISES[0]?.id || '',
  setActiveExerciseId: (activeExerciseId) => set({ activeExerciseId }),

  lastScore: null,
  lastStars: 0,
  setGameResult: (lastScore, lastStars) => set({ lastScore, lastStars })
}));
