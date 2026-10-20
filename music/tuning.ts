import {
  type SvaraId,
  type SvaraFamily,
  type Octave,
  assertValidSvaraId,
  assertValidOctave,
  SvaraValidationError,
  ALL_SVARA_IDS,
} from './svaraValidation';

export type TuningPolicy = 'just_intonation' | 'equal_temperament';

export interface SvaraRatio {
  readonly num: number;
  readonly den: number;
  readonly multiplier: number;
}

export interface SvaraDefinition {
  readonly id: SvaraId;
  readonly family: SvaraFamily;
  readonly variantIndex: 1 | 2 | 3;
  readonly shortName: string;
  readonly traditionalName: string;
  readonly mnemonicVowel: string;
  readonly displayNotation: string;
  readonly canonicalSemitone: number;
  readonly isVivadi: boolean;
  readonly defaultJustRatio: SvaraRatio;
  readonly defaultJustCents: number;
  readonly enharmonicPair?: SvaraId;
  readonly description: string;
}

export interface ResolvedPitch {
  readonly svaraId: SvaraId;
  readonly frequencyHz: number;
  readonly cents: number;
  readonly semitoneOffset: number;
  readonly octave: Octave;
  readonly tuningPolicy: TuningPolicy;
  readonly ratioMultiplier: number;
  readonly tonicHz: number;
  readonly formula: string;
}

export function calculateCentsFromRatio(multiplier: number): number {
  if (multiplier <= 0 || !Number.isFinite(multiplier)) {
    throw new SvaraValidationError(`Invalid ratio multiplier: ${multiplier}. Must be a positive finite number.`);
  }
  return Number((1200.0 * Math.log2(multiplier)).toFixed(2));
}

function makeRatio(num: number, den: number): SvaraRatio {
  if (!Number.isFinite(num) || !Number.isFinite(den) || num <= 0 || den <= 0) {
    throw new SvaraValidationError(`Invalid ratio ${num}/${den}; numerator and denominator must be positive finite numbers.`);
  }
  return Object.freeze({ num, den, multiplier: num / den });
}

export const SVARA_REGISTRY: Readonly<Record<SvaraId, SvaraDefinition>> = Object.freeze({
  S: Object.freeze({
    id: 'S',
    family: 'S',
    variantIndex: 1,
    shortName: 'Sa',
    traditionalName: 'Shadjam',
    mnemonicVowel: 'sa',
    displayNotation: 'S',
    canonicalSemitone: 0,
    isVivadi: false,
    defaultJustRatio: makeRatio(1, 1),
    defaultJustCents: 0.0,
    description: 'The fundamental tonic note (Adhāra Shaḍjam).',
  }),

  R1: Object.freeze({
    id: 'R1',
    family: 'R',
    variantIndex: 1,
    shortName: 'Ri',
    traditionalName: 'Suddha Rishabham',
    mnemonicVowel: 'ra',
    displayNotation: 'R₁',
    canonicalSemitone: 1,
    isVivadi: false,
    defaultJustRatio: makeRatio(16, 15),
    defaultJustCents: 111.73,
    description: 'Minor tone Rishabha (Chakra 1, 2, 3 Melakartas).',
  }),

  R2: Object.freeze({
    id: 'R2',
    family: 'R',
    variantIndex: 2,
    shortName: 'Ri',
    traditionalName: 'Chatushruti Rishabham',
    mnemonicVowel: 'ri',
    displayNotation: 'R₂',
    canonicalSemitone: 2,
    isVivadi: false,
    defaultJustRatio: makeRatio(9, 8),
    defaultJustCents: 203.91,
    enharmonicPair: 'G1',
    description: 'Major tone Rishabha (Chakra 4, 5 Melakartas). Shares its 12-TET semitone position with G1; JI intonation may differ.',
  }),

  R3: Object.freeze({
    id: 'R3',
    family: 'R',
    variantIndex: 3,
    shortName: 'Ri',
    traditionalName: 'Shatshruti Rishabham',
    mnemonicVowel: 'ru',
    displayNotation: 'R₃',
    canonicalSemitone: 3,
    isVivadi: true,
    defaultJustRatio: makeRatio(75, 64),
    defaultJustCents: 274.58,
    enharmonicPair: 'G2',
    description: 'Vivadi Rishabha (Chakra 6, 12 Melakartas). Shares its 12-TET semitone position with G2; JI intonation may differ.',
  }),

  G1: Object.freeze({
    id: 'G1',
    family: 'G',
    variantIndex: 1,
    shortName: 'Ga',
    traditionalName: 'Suddha Gandharam',
    mnemonicVowel: 'ga',
    displayNotation: 'G₁',
    canonicalSemitone: 2,
    isVivadi: true,
    defaultJustRatio: makeRatio(9, 8),
    defaultJustCents: 203.91,
    enharmonicPair: 'R2',
    description: 'Vivadi Gandhara (Chakra 1, 7 Melakartas). Shares its 12-TET semitone position with R2; JI intonation may differ.',
  }),

  G2: Object.freeze({
    id: 'G2',
    family: 'G',
    variantIndex: 2,
    shortName: 'Ga',
    traditionalName: 'Sadharana Gandharam',
    mnemonicVowel: 'gi',
    displayNotation: 'G₂',
    canonicalSemitone: 3,
    isVivadi: false,
    defaultJustRatio: makeRatio(6, 5),
    defaultJustCents: 315.64,
    enharmonicPair: 'R3',
    description: 'Minor third Gandhara (Chakra 2, 4, 8, 10 Melakartas). Shares its 12-TET semitone position with R3; JI intonation may differ.',
  }),

  G3: Object.freeze({
    id: 'G3',
    family: 'G',
    variantIndex: 3,
    shortName: 'Ga',
    traditionalName: 'Antara Gandharam',
    mnemonicVowel: 'gu',
    displayNotation: 'G₃',
    canonicalSemitone: 4,
    isVivadi: false,
    defaultJustRatio: makeRatio(5, 4),
    defaultJustCents: 386.31,
    description: 'Major third Gandhara (Chakra 3, 5, 6, 9, 11, 12 Melakartas).',
  }),

  M1: Object.freeze({
    id: 'M1',
    family: 'M',
    variantIndex: 1,
    shortName: 'Ma',
    traditionalName: 'Suddha Madhyamam',
    mnemonicVowel: 'ma',
    displayNotation: 'M₁',
    canonicalSemitone: 5,
    isVivadi: false,
    defaultJustRatio: makeRatio(4, 3),
    defaultJustCents: 498.04,
    description: 'Perfect fourth Madhyama (Melakartas 1 through 36, Purvanga).',
  }),

  M2: Object.freeze({
    id: 'M2',
    family: 'M',
    variantIndex: 2,
    shortName: 'Ma',
    traditionalName: 'Prati Madhyamam',
    mnemonicVowel: 'mi',
    displayNotation: 'M₂',
    canonicalSemitone: 6,
    isVivadi: false,
    defaultJustRatio: makeRatio(45, 32),
    defaultJustCents: 590.22,
    description: 'Sharp / augmented fourth Madhyama (Melakartas 37 through 72, Uttaranga).',
  }),

  P: Object.freeze({
    id: 'P',
    family: 'P',
    variantIndex: 1,
    shortName: 'Pa',
    traditionalName: 'Panchamam',
    mnemonicVowel: 'pa',
    displayNotation: 'P',
    canonicalSemitone: 7,
    isVivadi: false,
    defaultJustRatio: makeRatio(3, 2),
    defaultJustCents: 701.96,
    description: 'Immutable fifth note (Avikrita Panchamam).',
  }),

  D1: Object.freeze({
    id: 'D1',
    family: 'D',
    variantIndex: 1,
    shortName: 'Dha',
    traditionalName: 'Suddha Dhaivatam',
    mnemonicVowel: 'dha',
    displayNotation: 'D₁',
    canonicalSemitone: 8,
    isVivadi: false,
    defaultJustRatio: makeRatio(8, 5),
    defaultJustCents: 813.69,
    description: 'Minor sixth Dhaivata (Melakartas ending in 1, 2, 3 within each Chakra).',
  }),

  D2: Object.freeze({
    id: 'D2',
    family: 'D',
    variantIndex: 2,
    shortName: 'Dha',
    traditionalName: 'Chatushruti Dhaivatam',
    mnemonicVowel: 'dhi',
    displayNotation: 'D₂',
    canonicalSemitone: 9,
    isVivadi: false,
    defaultJustRatio: makeRatio(5, 3),
    defaultJustCents: 884.36,
    enharmonicPair: 'N1',
    description: 'Major sixth Dhaivata (Melakartas ending in 4, 5 within each Chakra). Shares its 12-TET semitone position with N1; JI intonation may differ.',
  }),

  D3: Object.freeze({
    id: 'D3',
    family: 'D',
    variantIndex: 3,
    shortName: 'Dha',
    traditionalName: 'Shatshruti Dhaivatam',
    mnemonicVowel: 'dhu',
    displayNotation: 'D₃',
    canonicalSemitone: 10,
    isVivadi: true,
    defaultJustRatio: makeRatio(125, 72),
    defaultJustCents: 955.03,
    enharmonicPair: 'N2',
    description: 'Vivadi Dhaivata (Melakartas ending in 6 within each Chakra). Shares its 12-TET semitone position with N2; JI intonation may differ.',
  }),

  N1: Object.freeze({
    id: 'N1',
    family: 'N',
    variantIndex: 1,
    shortName: 'Ni',
    traditionalName: 'Suddha Nishadam',
    mnemonicVowel: 'na',
    displayNotation: 'N₁',
    canonicalSemitone: 9,
    isVivadi: true,
    defaultJustRatio: makeRatio(5, 3),
    defaultJustCents: 884.36,
    enharmonicPair: 'D2',
    description: 'Vivadi Nishada (Melakartas ending in 1 within each Chakra). Shares its 12-TET semitone position with D2; JI intonation may differ.',
  }),

  N2: Object.freeze({
    id: 'N2',
    family: 'N',
    variantIndex: 2,
    shortName: 'Ni',
    traditionalName: 'Kaisiki Nishadam',
    mnemonicVowel: 'ni',
    displayNotation: 'N₂',
    canonicalSemitone: 10,
    isVivadi: false,
    defaultJustRatio: makeRatio(9, 5),
    defaultJustCents: 1017.6,
    enharmonicPair: 'D3',
    description: 'Minor seventh Nishada (Melakartas ending in 2, 4 within each Chakra). Shares its 12-TET semitone position with D3; JI intonation may differ.',
  }),

  N3: Object.freeze({
    id: 'N3',
    family: 'N',
    variantIndex: 3,
    shortName: 'Ni',
    traditionalName: 'Kakali Nishadam',
    mnemonicVowel: 'nu',
    displayNotation: 'N₃',
    canonicalSemitone: 11,
    isVivadi: false,
    defaultJustRatio: makeRatio(15, 8),
    defaultJustCents: 1088.27,
    description: 'Major seventh Nishada (Melakartas ending in 3, 5, 6 within each Chakra).',
  }),
});

export function getSvaraDefinition(id: SvaraId): SvaraDefinition {
  assertValidSvaraId(id);
  return SVARA_REGISTRY[id];
}

export function getSvarasBySemitone(semitone: number): readonly SvaraDefinition[] {
  if (!Number.isInteger(semitone) || semitone < 0 || semitone > 11) {
    throw new SvaraValidationError(`Invalid semitone offset: ${semitone}. Must be an integer between 0 and 11.`);
  }
  return ALL_SVARA_IDS.map((id) => SVARA_REGISTRY[id]).filter(
    (def) => def.canonicalSemitone === semitone
  );
}

export interface PitchResolutionParams {
  svaraId: SvaraId;
  tonicHz: number;
  octave?: Octave;
  tuningPolicy?: TuningPolicy;
  customRatio?: number;
}

export function resolveSvaraPitch(params: PitchResolutionParams): ResolvedPitch {
  const { svaraId, tonicHz, octave = 0, tuningPolicy = 'just_intonation', customRatio } = params;

  assertValidSvaraId(svaraId);
  assertValidOctave(octave);

  if (tuningPolicy !== 'equal_temperament' && tuningPolicy !== 'just_intonation') {
    throw new SvaraValidationError(`Unsupported tuning policy: ${String(tuningPolicy)}.`);
  }
  if (customRatio !== undefined && (!Number.isFinite(customRatio) || customRatio <= 0)) {
    throw new SvaraValidationError(`Invalid custom ratio: ${customRatio}. Must be a positive finite number.`);
  }
  if (customRatio !== undefined && tuningPolicy !== 'just_intonation') {
    throw new SvaraValidationError('customRatio is supported only with just_intonation tuning.');
  }

  if (typeof tonicHz !== 'number' || !Number.isFinite(tonicHz) || tonicHz <= 0) {
    throw new SvaraValidationError(
      `Invalid tonic frequency: ${tonicHz} Hz. Must be a positive finite number.`
    );
  }

  const def = SVARA_REGISTRY[svaraId];
  const octaveMultiplier = Math.pow(2, octave);
  const semitoneOffset = octave * 12 + def.canonicalSemitone;

  let frequencyHz: number;
  let cents: number;
  let ratioMultiplier: number;
  let formula: string;

  if (tuningPolicy === 'equal_temperament') {
    ratioMultiplier = Math.pow(2, def.canonicalSemitone / 12);
    frequencyHz = tonicHz * Math.pow(2, semitoneOffset / 12);
    cents = octave * 1200 + def.canonicalSemitone * 100;
    formula = `${tonicHz.toFixed(2)} * 2^(${semitoneOffset}/12)`;
  } else {
    ratioMultiplier = customRatio !== undefined ? customRatio : def.defaultJustRatio.multiplier;
    frequencyHz = tonicHz * octaveMultiplier * ratioMultiplier;
    cents = octave * 1200 + (customRatio !== undefined ? calculateCentsFromRatio(customRatio) : def.defaultJustCents);
    const ratioLabel = customRatio !== undefined
      ? String(customRatio)
      : `${def.defaultJustRatio.num}/${def.defaultJustRatio.den}`;
    formula = `${tonicHz.toFixed(2)} * 2^(${octave}) * (${ratioLabel})`;
  }

  return Object.freeze({
    svaraId,
    frequencyHz: Number(frequencyHz.toFixed(4)),
    cents: Number(cents.toFixed(2)),
    semitoneOffset,
    octave,
    tuningPolicy,
    ratioMultiplier,
    tonicHz,
    formula,
  });
}


/**
 * Checks internal registry invariants without imposing one universal JI
 * interpretation on every rāga. Returns all detected problems for diagnostics.
 */
export function validateSvaraRegistry(): string[] {
  const errors: string[] = [];
  for (const id of ALL_SVARA_IDS) {
    const def = SVARA_REGISTRY[id];
    if (def.id !== id) errors.push(`${id}: registry key and definition id differ`);
    if (def.defaultJustRatio.num / def.defaultJustRatio.den !== def.defaultJustRatio.multiplier) {
      errors.push(`${id}: ratio multiplier does not match numerator/denominator`);
    }
    const expectedCents = calculateCentsFromRatio(def.defaultJustRatio.multiplier);
    if (Math.abs(expectedCents - def.defaultJustCents) > 0.06) {
      errors.push(`${id}: defaultJustCents (${def.defaultJustCents}) differs from ratio (${expectedCents})`);
    }
    if (!Number.isInteger(def.canonicalSemitone) || def.canonicalSemitone < 0 || def.canonicalSemitone > 11) {
      errors.push(`${id}: canonicalSemitone must be an integer from 0 to 11`);
    }
  }
  return errors;
}
