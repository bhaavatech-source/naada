// src/music/svaraValidation.ts

export type SvaraFamily = 'S' | 'R' | 'G' | 'M' | 'P' | 'D' | 'N';

export type SvaraId =
  | 'S'
  | 'R1'
  | 'R2'
  | 'R3'
  | 'G1'
  | 'G2'
  | 'G3'
  | 'M1'
  | 'M2'
  | 'P'
  | 'D1'
  | 'D2'
  | 'D3'
  | 'N1'
  | 'N2'
  | 'N3';

export type Octave = -2 | -1 | 0 | 1 | 2;

export const OCTAVE_ANU_MANDRA: Octave = -2;
export const OCTAVE_MANDRA: Octave = -1;
export const OCTAVE_MADHYA: Octave = 0;
export const OCTAVE_TARA: Octave = 1;
export const OCTAVE_ATI_TARA: Octave = 2;

export const ALL_SVARA_IDS: readonly SvaraId[] = Object.freeze([
  'S', 'R1', 'R2', 'R3', 'G1', 'G2', 'G3', 'M1', 'M2', 'P', 'D1', 'D2', 'D3', 'N1', 'N2', 'N3',
]);

export class SvaraValidationError extends Error {
  constructor(message: string) {
    super(`[Nāda Vidyā SvaraValidationError] ${message}`);
    this.name = 'SvaraValidationError';
  }
}

export function isValidSvaraId(id: unknown): id is SvaraId {
  return typeof id === 'string' && ALL_SVARA_IDS.includes(id as SvaraId);
}

export function assertValidSvaraId(id: unknown): asserts id is SvaraId {
  if (!isValidSvaraId(id)) {
    throw new SvaraValidationError(
      `Invalid SvaraId: "${String(id)}". Expected one of [${ALL_SVARA_IDS.join(', ')}].`
    );
  }
}

export function isValidOctave(octave: unknown): octave is Octave {
  return typeof octave === 'number' && Number.isInteger(octave) && octave >= -2 && octave <= 2;
}

export function assertValidOctave(octave: unknown): asserts octave is Octave {
  if (!isValidOctave(octave)) {
    throw new SvaraValidationError(
      `Invalid Octave: "${String(octave)}". Allowed values are -2 (Anu-Mandra), -1 (Mandra), 0 (Madhya), 1 (Tara), 2 (Ati-Tara).`
    );
  }
}
