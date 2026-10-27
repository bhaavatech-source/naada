export type InstrumentType = 'reference' | 'veena' | 'flute' | 'voice_formants' | 'tambura';

export type ABMode = 'A_ONLY' | 'B_ONLY' | 'A_B_ALTERNATING' | 'A_B_CROSSFADE';

export interface TrajectoryPoint {
  t_ms: number;
  cents: number;
  min_cents?: number;
  max_cents?: number;
}

export interface GamakaProfile {
  id: string;
  name: string;
  raga: string;
  melaNumber?: number | null;
  family: string;
  classicalType: string;
  notationSymbol: string;
  targetSwara: string;
  vowelVocable?: string;
  baseCents: number;
  plainCents: number;
  listeningCue: string;
  description: string;
  trajectory: TrajectoryPoint[];
}

export interface GameWaypoint {
  t_ms: number;
  cents: number;
  star_index: number;
}

export interface GamakaExercise {
  id: string;
  title: string;
  level: 'beginner' | 'intermediate' | 'expert';
  ornamentType: string;
  notationSymbol: string;
  raga: string;
  pronunciationCue: string;
  avatar: string;
  theme: string;
  toleranceCents: number;
  trajectory: TrajectoryPoint[];
  waypoints: GameWaypoint[];
}

export interface ScoringResult {
  score: number;
  stars: number;
  avgCentsDeviation: number;
  boundaryViolations: number;
  tier: 'GOLD' | 'SILVER' | 'BRONZE';
  badgeLabel: string;
}

export interface KattaiOption {
  name: string;
  label: string;
  f0Hz: number;
  westernNote: string;
}
