// src/data/mmg/types.ts

export type VarisaiKind =
  | 'sarali'
  | 'janta'
  | 'dhatu'
  | 'melsthayiVarisai'
  | 'mandhraSthayiVarisai'
  | 'alankaram';

export interface VarisaiLine {
  display: string;   // shown to learner
  tokens:  string;   // parsed by audio engine
}

export interface VarisaiExercise {
  id:     string;
  kind:   VarisaiKind;
  name:   string;
  raga:   string;
  tala:   string;
  notes?: string;
  lines:  VarisaiLine[];
}