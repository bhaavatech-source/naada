/**
 * Carnatic Phrase Generator v2 — structured sampling + mathematical scoring
 *
 * Place at: src/modules/Manodharma/phraseGenerator.ts
 *
 * WHY v2
 * ------
 * v1 picked one of 12 fixed contours and padded the rest with a random walk, so
 * most output was shapeless, rhythmically flat and had no sense of arrival.
 * v2 follows the way a short musical idea is actually built:
 *
 *   1. RHYTHM FIRST   – a motif rhythm is composed, then repeated / varied, and a
 *                       long closing note (nyāsa) is reserved. Phrase length is
 *                       exact: sum of note durations == target number of mātrās.
 *   2. MOTIF + DEVELOPMENT – a short motif is generated with a step-biased walk
 *                       (Huron-style interval statistics), then developed by
 *                       sequence (same shape shifted by scale degrees), inversion,
 *                       echo and small variation. Shifts follow an arch whose
 *                       climax sits near the golden section (0.618).
 *   3. SCORING        – thousands of candidates are scored by a weighted objective
 *                       (see `scoreDraft`) and only the best, mutually-different
 *                       ones are kept.
 *   4. RAGA COLOUR    – the "characteristic" svaras of each rāga are found
 *                       mathematically (information content of each svara variant
 *                       across all 72 Melakartas, +Ma2 bonus). Good phrases must
 *                       dwell on them at accented positions and cross the rāga's
 *                       augmented-second step when it has one.
 *   5. CONSONANCE     – stability of each svara is its Tenney height (log2(n·d))
 *                       in the SAME just-intonation table the player uses
 *                       (index.tsx JI table). Phrases start/end on stable svaras
 *                       and put tension at the climax.
 *
 * IMPORTANT
 * ---------
 * The score measures musical shape and rāga-colour heuristics. It does NOT certify
 * a phrase as an authentic prayoga and gamaka is only *hinted*. Everything stays
 * `needs-review` until a teacher / trusted source has listened to it.
 *
 * This file has no runtime imports (only `import type`) so Node >= 22.18 can run
 * it directly from the batch scripts, and the app can bundle it normally.
 * Do not add enums / namespaces / parameter properties (Node type-stripping).
 */

import type { Melakarta } from '../../types/index';

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export type PhraseDuration = 2 | 5 | 10;
export type PhraseLevel = 'saadhaka' | 'nipuṇa' | 'praveena';
export type RagaLike = Pick<Melakarta, 'number' | 'name'>;
export type GamakaHint = 'kampita' | 'jaru';

export interface PhraseEvent {
  index: number;
  /** Project notation token: s r g m p d n (madhya), S R G … (tāra), s, r, … (mandra). */
  swara: string;
  /** Variant key as used by the player, e.g. 'R2', 'G3', 'M2', 'P'. */
  variant: string;
  /** Semitones above the tonic (negative = below Sa). */
  semitone: number;
  /** Just-intonation ratio (same table as the player), octave applied. */
  ratio: number;
  /** Length in mātrā tokens (1 token = 1 beat of `tempoBpm`). */
  durationBeats: number;
  gamakaHint?: GamakaHint;
}

export interface PhraseScore {
  /** Weighted total, 0..1. */
  total: number;
  /** Individual components, each 0..1. */
  parts: Record<string, number>;
}

export interface PhraseCandidate {
  id: string;
  ragaNumber: number;
  ragaName: string;
  durationSeconds: PhraseDuration;
  /** Real length at `tempoBpm` (the target is matched to the nearest whole mātrā). */
  actualSeconds: number;
  level: PhraseLevel;
  swaras: string[];
  semitones: number[];
  /** Mātrā tokens per minute. */
  tempoBpm: number;
  /** Ready for the player: tokens separated by spaces, ',' extends the previous note. */
  notation: string;
  events: PhraseEvent[];
  quality: PhraseScore;
  source: 'rule-based-candidate';
  validation: {
    scaleMembership: 'pass' | 'fail';
    contour: 'pass' | 'fail';
    status: 'needs-review';
    notes: string[];
  };
}

export interface GenerateOptions {
  /** Total phrases to return (default 20). */
  count?: number;
  durations?: PhraseDuration[];
  levels?: PhraseLevel[];
  /** Overrides the per-level default pace (mātrā tokens per minute). */
  tempoBpm?: number;
  seed?: string;
  /** Candidates sampled per phrase kept (default 40). Higher = better but slower. */
  poolFactor?: number;
  /** Drop phrases scoring below this (default 0.60). May return fewer than `count`. */
  minScore?: number;
  /** Max similarity (0..1) allowed between two kept phrases (default 0.72). */
  maxSimilarity?: number;
}

export interface TransitionOptions {
  count?: number;
  /** Target length in seconds (default 8). */
  durationSeconds?: number;
  level?: PhraseLevel;
  tempoBpm?: number;
  seed?: string;
  poolFactor?: number;
  minScore?: number;
}

export interface TransitionCandidate {
  id: string;
  type: 'two-raga-transition';
  from: { number: number; name: string };
  to: { number: number; name: string };
  relation: string[];
  /** Variants that differ between the two rāgas, e.g. ['R1→R2']. */
  changedSvaras: string[];
  /** Index of the first note that belongs to the destination rāga. */
  splitIndex: number;
  durationSeconds: number;
  actualSeconds: number;
  level: PhraseLevel;
  swaras: string[];
  semitones: number[];
  tempoBpm: number;
  notation: string;
  events: Array<PhraseEvent & { section: 'from' | 'to' }>;
  quality: PhraseScore;
  source: 'rule-based-candidate';
  validation: { status: 'needs-review'; notes: string[] };
}

// ─────────────────────────────────────────────────────────────────────────────
// Tuning tables (kept identical to the player's JI table in index.tsx)
// ─────────────────────────────────────────────────────────────────────────────

const FRAC: Record<string, [number, number]> = {
  S: [1, 1],
  R1: [256, 243], R2: [9, 8], R3: [32, 27],
  G1: [9, 8], G2: [32, 27], G3: [81, 64],
  M1: [4, 3], M2: [729, 512],
  P: [3, 2],
  D1: [128, 81], D2: [5, 3], D3: [16, 9],
  N1: [5, 3], N2: [16, 9], N3: [15, 8],
};

const SEMI: Record<string, number> = {
  S: 0, R1: 1, R2: 2, R3: 3, G1: 2, G2: 3, G3: 4, M1: 5, M2: 6, P: 7,
  D1: 8, D2: 9, D3: 10, N1: 9, N2: 10, N3: 11,
};

const R_BY_SEMI: Record<number, string> = { 1: 'R1', 2: 'R2', 3: 'R3' };
const G_BY_SEMI: Record<number, string> = { 2: 'G1', 3: 'G2', 4: 'G3' };
const M_BY_SEMI: Record<number, string> = { 5: 'M1', 6: 'M2' };
const D_BY_SEMI: Record<number, string> = { 8: 'D1', 9: 'D2', 10: 'D3' };
const N_BY_SEMI: Record<number, string> = { 9: 'N1', 10: 'N2', 11: 'N3' };

const LETTERS = ['s', 'r', 'g', 'm', 'p', 'd', 'n'];

function tenneyOf(variant: string): number {
  const [n, d] = FRAC[variant];
  return Math.log2(n * d);
}

export interface Variants { R: string; G: string; M: string; D: string; N: string }

/** Standard Melakarta construction (72 = 12 chakras × 6). */
export function variantsFromNumber(n: number): Variants {
  const idx = (n - 1) % 36;
  const rg = [['R1', 'G1'], ['R1', 'G2'], ['R1', 'G3'], ['R2', 'G2'], ['R2', 'G3'], ['R3', 'G3']][Math.floor(idx / 6)];
  const dn = [['D1', 'N1'], ['D1', 'N2'], ['D1', 'N3'], ['D2', 'N2'], ['D2', 'N3'], ['D3', 'N3']][idx % 6];
  return { R: rg[0], G: rg[1], M: n > 36 ? 'M2' : 'M1', D: dn[0], N: dn[1] };
}

/** How rare each svara variant is among the 72 Melakartas → information content (bits). */
const VARIANT_BITS: Record<string, number> = (() => {
  const counts: Record<string, number> = {};
  for (let n = 1; n <= 72; n++) {
    const v = variantsFromNumber(n);
    for (const k of [v.R, v.G, v.M, v.D, v.N]) counts[k] = (counts[k] ?? 0) + 1;
  }
  const bits: Record<string, number> = { S: 0, P: 0 };
  for (const k of Object.keys(counts)) bits[k] = -Math.log2(counts[k] / 72);
  bits.M2 += 0.6; // Prati Madhyama is a tonal hallmark, not just "1 of 2".
  return bits;
})();

const MELAKARTA_BY_KEY: Record<string, number> = (() => {
  const m: Record<string, number> = {};
  for (let n = 1; n <= 72; n++) {
    const v = variantsFromNumber(n);
    m[[SEMI[v.R], SEMI[v.G], SEMI[v.M], SEMI[v.D], SEMI[v.N]].join(',')] = n;
  }
  return m;
})();

// ─────────────────────────────────────────────────────────────────────────────
// Scale model
// ─────────────────────────────────────────────────────────────────────────────

export interface ScaleNote {
  pos: number;
  variant: string;
  semitone: number;
  ratio: number;
  tenney: number;
  /** 1 = most stable (Sa) … → 0. */
  stability: number;
  /** Information content of the variant among the 72 Melakartas. */
  distinct: number;
}

export interface ScaleModel {
  number: number;
  name: string;
  notes: ScaleNote[];
  /** Positions (0..6) of the 2 most characteristic non-Sa/Pa svaras. */
  characteristic: number[];
  /** Positions i where the step i → i+1 is ≥ 3 semitones (augmented second). */
  augmentedSteps: number[];
  maxTenney: number;
}

export function buildScaleModel(raga: RagaLike): ScaleModel {
  let v = variantsFromNumber(raga.number);
  // Prefer the project's own pitch data when it is present and valid.
  const n = (raga as { notes?: Partial<Record<'R' | 'G' | 'M' | 'D' | 'N', number>> }).notes;
  if (n && typeof n.R === 'number') {
    const R = R_BY_SEMI[n.R], G = G_BY_SEMI[n.G ?? -1], M = M_BY_SEMI[n.M ?? -1],
      D = D_BY_SEMI[n.D ?? -1], N = N_BY_SEMI[n.N ?? -1];
    if (R && G && M && D && N) v = { R, G, M, D, N };
  }
  const keys = ['S', v.R, v.G, v.M, 'P', v.D, v.N];
  const notes: ScaleNote[] = keys.map((variant, pos) => {
    const [nn, dd] = FRAC[variant];
    const tenney = tenneyOf(variant);
    return {
      pos, variant, semitone: SEMI[variant], ratio: nn / dd, tenney,
      stability: 1 / (1 + tenney / 4),
      distinct: VARIANT_BITS[variant] ?? 0,
    };
  });
  const ranked = notes
    .filter(x => x.pos !== 0 && x.pos !== 4)
    .sort((a, b) => b.distinct - a.distinct || b.tenney - a.tenney);
  const characteristic = ranked.slice(0, 2).map(x => x.pos);
  const augmentedSteps: number[] = [];
  for (let i = 0; i < 7; i++) {
    const next = i === 6 ? 12 : notes[i + 1].semitone;
    if (next - notes[i].semitone >= 3) augmentedSteps.push(i);
  }
  return {
    number: raga.number, name: raga.name, notes, characteristic, augmentedSteps,
    maxTenney: Math.max(...notes.map(x => x.tenney)),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Rāga relationships (used for "connected rāga" phrases)
// ─────────────────────────────────────────────────────────────────────────────

/** Number of R/G/M/D/N variants that differ between two Melakartas (0..5). */
export function ragaDistance(a: number, b: number): number {
  const x = variantsFromNumber(a), y = variantsFromNumber(b);
  return (['R', 'G', 'M', 'D', 'N'] as const).filter(k => x[k] !== y[k]).length;
}

/**
 * Graha bhedam: shift Sa onto another svara of the same scale. Returns the
 * Melakartas that the shifted scale happens to equal (needs Pa at +7 from the new Sa).
 */
export function grahaBhedamRelatives(number: number): Array<{ number: number; newSaDegree: number }> {
  const v = variantsFromNumber(number);
  const pitches = [0, SEMI[v.R], SEMI[v.G], SEMI[v.M], 7, SEMI[v.D], SEMI[v.N]];
  const out: Array<{ number: number; newSaDegree: number }> = [];
  for (let k = 1; k < 7; k++) {
    const q = pitches.map(p => (p - pitches[k] + 12) % 12).sort((a, b) => a - b);
    if (q[4] !== 7) continue;
    const hit = MELAKARTA_BY_KEY[[q[1], q[2], q[3], q[5], q[6]].join(',')];
    if (hit && hit !== number) out.push({ number: hit, newSaDegree: k });
  }
  return out;
}

export function ragaRelations(a: number, b: number): string[] {
  const rel: string[] = [];
  const d = ragaDistance(a, b);
  if (d === 1) {
    const x = variantsFromNumber(a), y = variantsFromNumber(b);
    rel.push(x.M !== y.M ? 'prati-madhyama-pair' : 'one-svara-change');
  } else if (d === 2) rel.push('two-svara-change');
  if (grahaBhedamRelatives(a).some(r => r.number === b)) rel.push('graha-bhedam');
  return rel;
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

type Rng = () => number;

function deterministicSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const clamp01 = (x: number) => clamp(x, 0, 1);
const pick = <T>(items: T[], rng: Rng): T => items[Math.floor(rng() * items.length)];

function weightedIndex(weights: number[], rng: Rng): number {
  let total = 0;
  for (const w of weights) total += w;
  let r = rng() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

const degPos = (d: number) => ((d % 7) + 7) % 7;
const degOct = (d: number) => Math.floor(d / 7);

function swaraToken(d: number): string {
  const l = LETTERS[degPos(d)];
  const o = degOct(d);
  return o === 0 ? l : o === 1 ? l.toUpperCase() : `${l},`;
}

/** Asymmetric arch: 0 → 1 (at c) → 0. Slow rise, quicker fall. */
function arch(x: number, c = 0.618): number {
  const t = clamp01(x);
  return t <= c ? Math.pow(t / c, 0.9) : Math.pow((1 - t) / (1 - c), 1.3);
}

function pearson(a: number[], b: number[]): number {
  const n = a.length;
  let ma = 0, mb = 0;
  for (let i = 0; i < n; i++) { ma += a[i]; mb += b[i]; }
  ma /= n; mb /= n;
  let sab = 0, saa = 0, sbb = 0;
  for (let i = 0; i < n; i++) {
    const x = a[i] - ma, y = b[i] - mb;
    sab += x * y; saa += x * x; sbb += y * y;
  }
  return saa === 0 || sbb === 0 ? 0 : sab / Math.sqrt(saa * sbb);
}

// ─────────────────────────────────────────────────────────────────────────────
// Level configuration
// ─────────────────────────────────────────────────────────────────────────────

interface LevelConfig {
  /** Default mātrā tokens per minute. */
  pace: number;
  /** Allowed scale degrees (0 = madhya Sa, 7 = tāra Sa, -7 = mandra Sa). */
  range: [number, number];
  maxLeap: number;
  durWeights: Array<[number, number]>;
  /** Weights for |interval| = 0,1,2,… in scale degrees. */
  stepDist: number[];
  archHeight: [number, number];
  motifLens: number[];
}

const LEVELS: Record<PhraseLevel, LevelConfig> = {
  saadhaka: {
    pace: 100, range: [0, 7], maxLeap: 3,
    durWeights: [[1, 0.42], [2, 0.40], [3, 0.10], [4, 0.08]],
    stepDist: [0.05, 0.62, 0.28, 0.05], archHeight: [1, 2], motifLens: [3, 4],
  },
  'nipuṇa': {
    pace: 120, range: [-2, 9], maxLeap: 4,
    durWeights: [[1, 0.62], [2, 0.33], [3, 0.05]],
    stepDist: [0.06, 0.52, 0.27, 0.10, 0.05], archHeight: [2, 3], motifLens: [3, 4],
  },
  praveena: {
    pace: 140, range: [-4, 11], maxLeap: 5,
    durWeights: [[1, 0.74], [2, 0.23], [3, 0.03]],
    stepDist: [0.04, 0.45, 0.30, 0.12, 0.06, 0.03], archHeight: [2, 4], motifLens: [4, 5, 6],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Sampling (rhythm → motif → development → cadence)
// ─────────────────────────────────────────────────────────────────────────────

interface Draft { deg: number[]; dur: number[] }

function metricWeight(u: number): number {
  return u % 4 === 0 ? 1 : u % 2 === 0 ? 0.55 : 0.25;
}

/** Compose a rhythm of `len` units; of several draws keep the one that puts long notes on strong beats. */
function composeRhythm(len: number, offset: number, cfg: LevelConfig, rng: Rng): number[] {
  let best: number[] = [len];
  let bestFit = -1;
  for (let attempt = 0; attempt < 8; attempt++) {
    const out: number[] = [];
    let left = len;
    while (left > 0) {
      const opts = cfg.durWeights.filter(([d]) => d <= left);
      const d = opts[weightedIndex(opts.map(o => o[1]), rng)][0];
      out.push(d);
      left -= d;
    }
    if (len >= 3 && new Set(out).size < 2) continue;
    let u = offset, fit = 0;
    for (const d of out) { fit += Math.min(d, 3) * metricWeight(u); u += d; }
    fit /= out.length;
    if (fit > bestFit) { bestFit = fit; best = out; }
  }
  return best;
}

function mutateRhythm(r: number[], rng: Rng): number[] {
  const out = r.slice();
  const j = Math.floor(rng() * out.length);
  if (out[j] >= 2) {
    out.splice(j, 1, 1, out[j] - 1);
  } else if (j + 1 < out.length && out[j + 1] === 1) {
    out.splice(j, 2, 2);
  }
  return out;
}

function sampleDraft(startScale: ScaleModel, level: PhraseLevel, T: number, rng: Rng): Draft | null {
  const cfg = LEVELS[level];
  const [lo, hi] = cfg.range;

  // 1. Rhythm skeleton: [segment rhythms…] + closing note.
  const fDur = T >= 12 ? (rng() < 0.5 ? 2 : 3) : T >= 4 ? 2 : 1;
  const B = T - fDur;
  if (B < 2) return null;
  let lengths: number[];
  if (B <= 3) {
    lengths = [B];
  } else {
    const usable = cfg.motifLens.filter(l => l <= B);
    const mLen = usable.length ? pick(usable, rng) : B;
    const n = Math.max(1, Math.round(B / mLen));
    const base = Math.floor(B / n);
    const extra = B - base * n;
    lengths = Array.from({ length: n }, (_, i) => base + (i >= n - extra ? 1 : 0));
  }
  const motifR = composeRhythm(lengths[0], 0, cfg, rng);
  const rhythms: number[][] = [motifR];
  for (let i = 1; i < lengths.length; i++) {
    if (lengths[i] === lengths[0]) rhythms.push(rng() < 0.65 ? motifR : mutateRhythm(motifR, rng));
    else rhythms.push(composeRhythm(lengths[i], lengths.slice(0, i).reduce((a, b) => a + b, 0), cfg, rng));
  }

  // 2. Motif melody: step-biased walk with contour inertia and leap recovery.
  const center = lo + (hi - lo) * 0.35;
  const startW: number[] = [];
  const startDegs: number[] = [];
  for (let d = lo; d <= lo + Math.floor((hi - lo) * 0.65); d++) {
    const stab = startScale.notes[degPos(d)].stability;
    startW.push((0.15 + 0.85 * stab * stab) * Math.exp(-Math.pow((d - center) / ((hi - lo) * 0.4), 2)));
    startDegs.push(d);
  }
  const start = startDegs[weightedIndex(startW, rng)];
  const k0 = motifR.length;
  const motif = [start];
  let dir = rng() < 0.6 ? 1 : -1;
  let prevLeap = false;
  const stepW = cfg.stepDist.slice(0, cfg.maxLeap + 1);
  for (let i = 1; i < k0; i++) {
    let mag: number = prevLeap ? 1 : weightedIndex(stepW, rng);
    if (prevLeap) dir = -dir;
    else if (rng() > 0.62) dir = -dir;
    const prev = motif[i - 1];
    let next = prev + dir * mag;
    if (next > hi || next < lo) {
      dir = -dir;
      next = clamp(prev + dir * mag, lo, hi);
      mag = Math.abs(next - prev);
    }
    prevLeap = mag >= 3;
    motif.push(next);
  }

  // 3. Development of the motif, shifted along an arch (climax near 0.618).
  const H = cfg.archHeight[0] + Math.floor(rng() * (cfg.archHeight[1] - cfg.archHeight[0] + 1));
  const deg: number[] = motif.slice();
  const dur: number[] = motifR.slice();
  let offset = lengths[0];
  const h0 = Math.round(H * arch((lengths[0] / 2) / T));
  for (let s = 1; s < lengths.length; s++) {
    const r = rhythms[s];
    const k = r.length;
    const hs = Math.round(H * arch((offset + lengths[s] / 2) / T));
    let shift = hs - h0 + (rng() < 0.25 ? (rng() < 0.5 ? -1 : 1) : 0);
    const rel = Array.from({ length: k }, (_, j) => {
      const src = k === k0 ? j : k === 1 ? 0 : Math.round((j * (k0 - 1)) / (k - 1));
      return motif[src] - motif[0];
    });
    const op = weightedIndex([0.50, 0.12, 0.16, 0.22], rng); // seq, echo, inversion, variation
    let seg = rel.map(x => (op === 2 ? -x : x));
    if (op === 1) shift = 0;
    if (op === 3 && k >= 3) {
      const j = 1 + Math.floor(rng() * (k - 2));
      seg[j] += rng() < 0.5 ? -1 : 1;
    }
    // keep the joint with the previous segment inside the leap limit
    const joint = motif[0] + seg[0] + shift - deg[deg.length - 1];
    if (Math.abs(joint) > cfg.maxLeap) shift -= Math.sign(joint) * (Math.abs(joint) - cfg.maxLeap);
    seg = seg.map(x => clamp(motif[0] + x + shift, lo, hi));
    deg.push(...seg);
    dur.push(...r);
    offset += lengths[s];
  }

  // 4. Cadence: closing note on Sa or Pa, approached by step where possible.
  const last = deg[deg.length - 1];
  const finals: number[] = [];
  const finalW: number[] = [];
  for (let d = lo; d <= hi; d++) {
    const p = degPos(d);
    if (p !== 0 && p !== 4) continue;
    finals.push(d);
    finalW.push((p === 0 ? 1.7 : 1) * Math.exp(-Math.abs(d - last) / 2.2));
  }
  if (!finals.length) return null;
  const f = finals[weightedIndex(finalW, rng)];
  if (Math.abs(f - last) > 2) {
    const appr = f + (last > f ? 1 : -1) * (rng() < 0.6 ? 1 : 2);
    deg[deg.length - 1] = clamp(appr, lo, hi);
  }
  deg.push(f);
  dur.push(fDur);
  return { deg, dur };
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation (hard rules) and scoring (soft preferences)
// ─────────────────────────────────────────────────────────────────────────────

interface ScoreCtx {
  T: number;
  level: PhraseLevel;
  scaleAt: (i: number) => ScaleModel;
  identityScale: ScaleModel;
}

function isValid(d: Draft, level: PhraseLevel): boolean {
  const cfg = LEVELS[level];
  const [lo, hi] = cfg.range;
  const { deg, dur } = d;
  if (deg.length < 3) return false;
  for (let i = 0; i < deg.length; i++) {
    if (deg[i] < lo || deg[i] > hi) return false;
    if (i >= 1 && Math.abs(deg[i] - deg[i - 1]) > cfg.maxLeap) return false;
    if (i >= 2 && deg[i] === deg[i - 1] && deg[i] === deg[i - 2]) return false;
  }
  const p = degPos(deg[deg.length - 1]);
  if (p !== 0 && p !== 4) return false;
  if (dur[dur.length - 1] < Math.min(2, dur.reduce((a, b) => a + b, 0) - 1)) return false;
  if (new Set(deg.map(degPos)).size < 3) return false;
  return true;
}

const WEIGHTS: Record<string, number> = {
  motion: 0.14, recovery: 0.05, arch: 0.10, climax: 0.07, accent: 0.09, rhythmVariety: 0.05,
  cadence: 0.12, start: 0.05, identity: 0.12, variety: 0.02, tension: 0.06, motif: 0.10, shape: 0.03,
};

const MOTION_P = [0.07, 0.50, 0.26, 0.10, 0.045, 0.02, 0.01];

function scoreDraft(d: Draft, ctx: ScoreCtx): PhraseScore {
  const { deg, dur } = d;
  const k = deg.length;
  const T = ctx.T;
  const cfgLevel = ctx.level;

  const onset: number[] = [];
  let acc = 0;
  for (const x of dur) { onset.push(acc); acc += x; }

  const note = deg.map((dg, i) => ctx.scaleAt(i).notes[degPos(dg)]);
  const semi = deg.map((dg, i) => 12 * degOct(dg) + note[i].semitone);
  const stab = note.map(n => n.stability);

  const parts: Record<string, number> = {};

  // 1. Melodic motion — how plausible are the interval sizes (steps dominate)?
  let lp = 0;
  const logMax = Math.log(MOTION_P[1]), logMin = Math.log(0.01);
  for (let i = 1; i < k; i++) {
    const m = Math.min(6, Math.abs(deg[i] - deg[i - 1]));
    lp += (Math.log(MOTION_P[m]) - logMin) / (logMax - logMin);
  }
  parts.motion = k > 1 ? clamp01(lp / (k - 1)) : 0.5;

  // 2. Leap recovery (gap-fill): after a leap ≥3, step back the other way.
  let leaps = 0, bad = 0;
  for (let i = 1; i < k - 1; i++) {
    const a = deg[i] - deg[i - 1];
    if (Math.abs(a) >= 3) {
      leaps++;
      const b = deg[i + 1] - deg[i];
      if (!(Math.sign(b) === -Math.sign(a) && Math.abs(b) <= 2)) bad++;
    }
  }
  parts.recovery = leaps ? 1 - bad / leaps : 1;

  // 3. Arch — pitch contour (sampled in time) correlates with the golden-section arch.
  const S = 16;
  const curve: number[] = [], target: number[] = [], tension: number[] = [];
  let ptr = 0;
  for (let j = 0; j < S; j++) {
    const t = ((j + 0.5) / S) * T;
    while (ptr < k - 1 && onset[ptr + 1] <= t) ptr++;
    curve.push(semi[ptr]);
    target.push(arch(t / T));
    tension.push(note[ptr].tenney / ctx.identityScale.maxTenney);
  }
  parts.arch = clamp01((pearson(curve, target) + 0.25) / 1.15);

  // 4. Climax — one clear peak, placed around the golden section.
  const maxP = Math.max(...semi);
  let cnt = 0, first = -1;
  for (let i = 0; i < k; i++) if (semi[i] === maxP) { cnt++; if (first < 0) first = i; }
  const fx = onset[first] / T;
  const lowB = T <= 5 ? 0.1 : 0.3, highB = T <= 5 ? 0.9 : 0.85;
  const place = fx >= lowB && fx <= highB ? 1 : fx >= 0.15 && fx <= 0.95 ? 0.6 : 0.25;
  parts.climax = (cnt === 1 ? 1 : cnt === 2 ? 0.6 : 0.2) * place;

  // 5. Metric accent — important notes (stable / long / characteristic) fall on strong units.
  const metric = onset.map(metricWeight);
  const charSet = new Set(ctx.identityScale.characteristic);
  const imp = deg.map((dg, i) =>
    0.45 * stab[i] + 0.35 * Math.min(dur[i], 3) / 3 + 0.2 * (charSet.has(degPos(dg)) ? 1 : 0));
  parts.accent = clamp01((pearson(metric, imp) + 0.2) / 1.2);

  // 6. Rhythmic variety (entropy of durations).
  const counts = new Map<number, number>();
  for (const x of dur) counts.set(x, (counts.get(x) ?? 0) + 1);
  let H = 0;
  counts.forEach(c => { const p = c / k; H -= p * Math.log2(p); });
  parts.rhythmVariety = T >= 8 ? clamp01(1 - Math.abs(H - 1.1) / 1.1) : counts.size >= 2 ? 0.85 : 0.5;

  // 7. Cadence — closes on Sa/Pa, steps in, and holds.
  const lastI = k - 1;
  const wFinal = degPos(deg[lastI]) === 0 ? 1 : 0.75;
  const into = Math.abs(deg[lastI] - deg[lastI - 1]);
  const approach = into === 1 ? 1 : into === 2 ? 0.6 : 0.2;
  parts.cadence = 0.45 * wFinal + 0.35 * approach + 0.2 * (dur[lastI] >= 2 ? 1 : 0.3);

  // 8. Start — begin on a stable svara.
  parts.start = 0.4 + 0.6 * stab[0];

  // 9. Rāga identity — dwell on characteristic svaras (accented) and cross the augmented step.
  const idScale = ctx.identityScale;
  const charPos = T <= 5 ? idScale.characteristic.slice(0, 1) : idScale.characteristic;
  let cov = 0;
  for (const cp of charPos) {
    let best = 0;
    for (let i = 0; i < k; i++) {
      if (degPos(deg[i]) !== cp) continue;
      const accented = onset[i] % 2 === 0 || dur[i] >= 2;
      best = Math.max(best, accented ? 1 : 0.5);
    }
    cov += best;
  }
  cov /= charPos.length;
  let augHit = 0;
  if (idScale.augmentedSteps.length) {
    for (let i = 1; i < k; i++) {
      if (Math.abs(deg[i] - deg[i - 1]) === 1) {
        const lowerPos = degPos(Math.min(deg[i], deg[i - 1]));
        if (idScale.augmentedSteps.includes(lowerPos)) { augHit = 1; break; }
      }
    }
    parts.identity = 0.6 * cov + 0.4 * augHit;
  } else {
    parts.identity = cov;
  }

  // 10. Variety of svaras used.
  const distinctPos = new Set(deg.map(degPos)).size;
  parts.variety = Math.min(1, distinctPos / (T <= 5 ? 3 : T <= 13 ? 5 : 6));

  // 11. Tension profile — relaxed at both ends, most tense near the climax.
  let td = 0;
  for (let j = 0; j < S; j++) td += Math.abs(tension[j] - (0.12 + 0.6 * target[j]));
  parts.tension = clamp01(1 - 1.6 * (td / S));

  // 12. Motif coherence — repeated transposition-invariant interval and rhythm n-grams.
  if (k >= 6) {
    const iv: string[] = [];
    for (let i = 0; i + 2 < k; i++) iv.push(`${deg[i + 1] - deg[i]},${deg[i + 2] - deg[i + 1]}`);
    const rv: string[] = [];
    for (let i = 0; i + 2 < k; i++) rv.push(`${dur[i]},${dur[i + 1]},${dur[i + 2]}`);
    const rep = (arr: string[]) => {
      const seen = new Map<string, number>();
      arr.forEach(x => seen.set(x, (seen.get(x) ?? 0) + 1));
      let r = 0;
      arr.forEach(x => { if ((seen.get(x) ?? 0) > 1) r++; });
      return r / arr.length;
    };
    const tri = (r: number) => clamp01(1 - Math.abs(r - 0.45) / 0.45);
    parts.motif = 0.65 * tri(rep(iv)) + 0.35 * tri(rep(rv));
  } else {
    parts.motif = 0.7;
  }

  // 13. Shape — direction changes in a healthy range, no long monotone runs, few repeats.
  let rev = 0, moves = 0, run = 1, maxRun = 1, zero = 0;
  for (let i = 1; i < k; i++) {
    const a = deg[i] - deg[i - 1];
    if (a === 0) { zero++; continue; }
    if (i >= 2) {
      const b = deg[i - 1] - deg[i - 2];
      if (b !== 0) {
        moves++;
        if (Math.sign(a) !== Math.sign(b)) { rev++; run = 1; } else { run++; maxRun = Math.max(maxRun, run); }
      }
    }
  }
  const fr = moves ? rev / moves : 0.5; // too short to judge → neutral
  const runLimit = cfgLevel === 'praveena' ? 6 : 5;
  parts.shape = clamp01(1 - Math.max(0, 0.2 - fr, fr - 0.8) / 0.3)
    * (maxRun + 1 > runLimit ? 0.6 : 1)
    * (zero / Math.max(1, k - 1) > 0.2 ? 0.7 : 1);

  let total = 0;
  for (const key of Object.keys(WEIGHTS)) total += WEIGHTS[key] * (parts[key] ?? 0);
  for (const key of Object.keys(parts)) parts[key] = Math.round(parts[key] * 1000) / 1000;
  return { total: Math.round(total * 1000) / 1000, parts };
}

// ─────────────────────────────────────────────────────────────────────────────
// Scoring arbitrary notation (for the app, for tests, and for reviewing old phrases)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Score any phrase written in the project notation (space-separated tokens,
 * ',' extends the previous note). Returns null when a token is not a svara.
 * Hard rules (range, leaps, cadence) are NOT applied here — only the soft score.
 */
export function scoreNotation(raga: RagaLike, notation: string, level: PhraseLevel = 'nipuṇa'): PhraseScore | null {
  const deg: number[] = [];
  const dur: number[] = [];
  for (const tok of notation.trim().split(/\s+/).filter(Boolean)) {
    if (tok === ',') {
      if (!dur.length) return null;
      dur[dur.length - 1] += 1;
      continue;
    }
    const m = /^([srgmpdnSRGMPDN])(,?)$/.exec(tok);
    if (!m) return null;
    const pos = LETTERS.indexOf(m[1].toLowerCase());
    const oct = m[2] ? -1 : m[1] === m[1].toUpperCase() ? 1 : 0;
    deg.push(oct * 7 + pos);
    dur.push(1);
  }
  if (deg.length < 2) return null;
  const scale = buildScaleModel(raga);
  const T = dur.reduce((a, b) => a + b, 0);
  return scoreDraft({ deg, dur }, { T, level, scaleAt: () => scale, identityScale: scale });
}

// ─────────────────────────────────────────────────────────────────────────────
// Diversity
// ─────────────────────────────────────────────────────────────────────────────

function tokensOf(d: Draft): string[] {
  const t: string[] = [];
  for (let i = 1; i < d.deg.length; i++) t.push(`${d.deg[i] - d.deg[i - 1]}:${d.dur[i]}`);
  return t;
}

function similarity(a: string[], b: string[]): number {
  const n = a.length, m = b.length;
  if (!n && !m) return 1;
  let prev = Array.from({ length: m + 1 }, (_, j) => j);
  for (let i = 1; i <= n; i++) {
    const cur = [i];
    for (let j = 1; j <= m; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return 1 - prev[m] / Math.max(n, m);
}

// ─────────────────────────────────────────────────────────────────────────────
// Rendering helpers
// ─────────────────────────────────────────────────────────────────────────────

function hintGamakas(deg: number[], dur: number[], scale: (i: number) => ScaleModel): Array<GamakaHint | undefined> {
  // Conservative hints only: sustained interior svaras may take a kampita (oscillation);
  // a descending step of one degree onto a svara may take a jāru (slide).
  return deg.map((d, i) => {
    const pos = degPos(d);
    const interior = i > 0 && i < deg.length - 1;
    if (interior && dur[i] >= 2 && pos !== 0 && pos !== 4) return 'kampita';
    if (i > 0 && deg[i - 1] - d === 1 && dur[i] >= 2 && scale(i).notes[pos].stability < 0.45) return 'jaru';
    return undefined;
  });
}

function toEvents(d: Draft, scaleAt: (i: number) => ScaleModel): PhraseEvent[] {
  const hints = hintGamakas(d.deg, d.dur, scaleAt);
  return d.deg.map((dg, i) => {
    const n = scaleAt(i).notes[degPos(dg)];
    const ev: PhraseEvent = {
      index: i,
      swara: swaraToken(dg),
      variant: n.variant,
      semitone: 12 * degOct(dg) + n.semitone,
      ratio: Math.round(n.ratio * Math.pow(2, degOct(dg)) * 1e6) / 1e6,
      durationBeats: d.dur[i],
    };
    if (hints[i]) ev.gamakaHint = hints[i];
    return ev;
  });
}

function toNotation(events: PhraseEvent[]): string {
  const out: string[] = [];
  for (const e of events) {
    out.push(e.swara);
    for (let x = 1; x < e.durationBeats; x++) out.push(',');
  }
  return out.join(' ');
}

function targetUnits(seconds: number, pace: number): number {
  return Math.max(5, Math.round((seconds * pace) / 60)); // <5 mātrās cannot hold a motif + cadence
}

// ─────────────────────────────────────────────────────────────────────────────
// Single-rāga generation
// ─────────────────────────────────────────────────────────────────────────────

interface Scored { draft: Draft; score: PhraseScore }

function selectBest(
  scale: ScaleModel, level: PhraseLevel, T: number, want: number,
  poolFactor: number, minScore: number, maxSim: number, rng: Rng,
): Scored[] {
  const ctx: ScoreCtx = { T, level, scaleAt: () => scale, identityScale: scale };
  const pool: Scored[] = [];
  const seen = new Set<string>();
  const attempts = Math.max(60, want * poolFactor * 3);
  let valid = 0;
  for (let a = 0; a < attempts && valid < want * poolFactor; a++) {
    const draft = sampleDraft(scale, level, T, rng);
    if (!draft || !isValid(draft, level)) continue;
    const key = draft.deg.join(',') + '|' + draft.dur.join(',');
    if (seen.has(key)) continue;
    seen.add(key);
    valid++;
    pool.push({ draft, score: scoreDraft(draft, ctx) });
  }
  pool.sort((x, y) => y.score.total - x.score.total);
  const chosen: Scored[] = [];
  const toks: string[][] = [];
  for (const cand of pool) {
    if (chosen.length >= want) break;
    if (cand.score.total < minScore) break;
    const t = tokensOf(cand.draft);
    if (toks.some(o => similarity(o, t) > maxSim)) continue;
    chosen.push(cand);
    toks.push(t);
  }
  return chosen;
}

function validateForOutput(
  semitones: number[], scale: ScaleModel, score: PhraseScore,
): PhraseCandidate['validation'] {
  const allowed = new Set<number>();
  for (const n of scale.notes) { for (const o of [-12, 0, 12]) allowed.add(n.semitone + o); }
  allowed.add(12); allowed.add(-12);
  const scaleMembership = semitones.every(s => allowed.has(s)) ? 'pass' : 'fail';
  let maxLeap = 0;
  for (let i = 1; i < semitones.length; i++) maxLeap = Math.max(maxLeap, Math.abs(semitones[i] - semitones[i - 1]));
  const contour = maxLeap <= 9 && score.total >= 0.5 ? 'pass' : 'fail';
  return {
    scaleMembership, contour, status: 'needs-review',
    notes: [
      'Scored on melodic shape, rhythm, cadence and rāga-colour heuristics — not on rāga grammar.',
      'Gamaka is only hinted; phrase grammar and stylistic usage have not been validated by a musician.',
    ],
  };
}

export function generatePhraseCandidates(raga: RagaLike, options: GenerateOptions = {}): PhraseCandidate[] {
  const count = Math.max(1, Math.min(5000, Math.floor(options.count ?? 20)));
  const durations = options.durations ?? [2, 5, 10];
  const levels = options.levels ?? ['saadhaka', 'nipuṇa', 'praveena'];
  const poolFactor = Math.max(5, Math.min(400, Math.floor(options.poolFactor ?? 40)));
  const minScore = options.minScore ?? 0.6;
  const maxSim = options.maxSimilarity ?? 0.72;
  const scale = buildScaleModel(raga);

  // Every duration × level combination (v1 only ever produced 3 of the 9 pairings).
  const combos: Array<{ duration: PhraseDuration; level: PhraseLevel }> = [];
  for (const level of levels) for (const duration of durations) combos.push({ duration, level });

  const perCombo = combos.map((_, i) => Math.floor(count / combos.length) + (i < count % combos.length ? 1 : 0));
  const lists = combos.map((c, i) => {
    const pace = options.tempoBpm ? clampPace(options.tempoBpm) : LEVELS[c.level].pace;
    const T = targetUnits(c.duration, pace);
    const rng = mulberry32(deterministicSeed(`${options.seed ?? 'bhava-phrase-v2'}|${raga.number}|${c.duration}|${c.level}`));
    return { c, pace, T, items: selectBest(scale, c.level, T, perCombo[i], poolFactor, minScore, maxSim, rng) };
  });

  const results: PhraseCandidate[] = [];
  const counters: Record<string, number> = {};
  for (let round = 0; ; round++) {
    let any = false;
    for (const l of lists) {
      const it = l.items[round];
      if (!it) continue;
      any = true;
      const events = toEvents(it.draft, () => scale);
      const key = `${l.c.duration}-${l.c.level}`;
      counters[key] = (counters[key] ?? 0) + 1;
      const swaras = events.map(e => e.swara);
      const semitones = events.map(e => e.semitone);
      results.push({
        id: `mel-${raga.number}-${l.c.duration}s-${l.c.level}-${String(counters[key]).padStart(4, '0')}`,
        ragaNumber: raga.number,
        ragaName: raga.name,
        durationSeconds: l.c.duration,
        actualSeconds: Math.round((l.T / l.pace) * 60 * 100) / 100,
        level: l.c.level,
        swaras,
        semitones,
        tempoBpm: l.pace,
        notation: toNotation(events),
        events,
        quality: it.score,
        source: 'rule-based-candidate',
        validation: validateForOutput(semitones, scale, it.score),
      });
    }
    if (!any) break;
  }
  return results.slice(0, count);
}

function clampPace(x: number): number {
  return Math.max(40, Math.min(220, Math.floor(x)));
}

// ─────────────────────────────────────────────────────────────────────────────
// Connected-rāga (two-rāga transition) generation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A phrase that starts in rāga A, lands on a svara A and B share (the pivot), then
 * continues in rāga B — passing through a svara that actually changed — and closes on
 * Sa/Pa. The melodic skeleton is built and scored exactly like a single-rāga phrase,
 * with each note realised in the scale of the rāga it belongs to.
 */
export function generateTransitionCandidates(
  fromRaga: RagaLike, toRaga: RagaLike, options: TransitionOptions = {},
): TransitionCandidate[] {
  const count = Math.max(1, Math.min(200, Math.floor(options.count ?? 3)));
  const level: PhraseLevel = options.level ?? 'nipuṇa';
  const seconds = options.durationSeconds ?? 8;
  const pace = options.tempoBpm ? clampPace(options.tempoBpm) : LEVELS[level].pace;
  const T = Math.max(8, targetUnits(seconds, pace));
  const poolFactor = Math.max(10, Math.min(400, Math.floor(options.poolFactor ?? 60)));
  const minScore = options.minScore ?? 0.55;
  const A = buildScaleModel(fromRaga), B = buildScaleModel(toRaga);
  const changed = A.notes.filter((n, i) => n.variant !== B.notes[i].variant).map(n => n.pos);
  if (!changed.length) return [];
  const rng = mulberry32(deterministicSeed(`${options.seed ?? 'bhava-transition-v2'}|${fromRaga.number}|${toRaga.number}|${level}`));

  interface TScored { draft: Draft; split: number; score: PhraseScore }
  const pool: TScored[] = [];
  const seen = new Set<string>();
  const attempts = count * poolFactor * 6;
  for (let a = 0; a < attempts && pool.length < count * poolFactor; a++) {
    const draft = sampleDraft(B, level, T, rng);
    if (!draft || !isValid(draft, level)) continue;
    const key = draft.deg.join(',') + '|' + draft.dur.join(',');
    if (seen.has(key)) continue;
    seen.add(key);

    const onset: number[] = [];
    let acc = 0;
    for (const x of draft.dur) { onset.push(acc); acc += x; }
    let bestSplit = -1, bestScore: PhraseScore | null = null;
    for (let s = 2; s < draft.deg.length - 1; s++) {
      const fx = onset[s] / T;
      if (fx < 0.3 || fx > 0.65) continue;
      const pivotPos = degPos(draft.deg[s - 1]);
      if (changed.includes(pivotPos)) continue; // pivot must be a shared svara
      const scaleAt = (i: number) => (i < s ? A : B);
      const base = scoreDraft(draft, { T, level, scaleAt, identityScale: B });
      // transition-specific terms
      let changedAccent = 0;
      for (let i = s; i < draft.deg.length; i++) {
        if (!changed.includes(degPos(draft.deg[i]))) continue;
        const accented = onset[i] % 2 === 0 || draft.dur[i] >= 2;
        changedAccent = Math.max(changedAccent, accented ? 1 : 0.5);
      }
      if (changedAccent === 0) continue;
      const semiA = 12 * degOct(draft.deg[s - 1]) + A.notes[degPos(draft.deg[s - 1])].semitone;
      const semiB = 12 * degOct(draft.deg[s]) + B.notes[degPos(draft.deg[s])].semitone;
      const boundary = Math.abs(semiB - semiA) <= 4 ? 1 : 0.5;
      const pivot = A.notes[pivotPos].stability;
      const firstChange = draft.deg.findIndex((dg, i) => i >= s && changed.includes(degPos(dg)));
      const stepInto = firstChange > 0 && Math.abs(draft.deg[firstChange] - draft.deg[firstChange - 1]) <= 1 ? 1 : 0.6;
      const trans = 0.35 * changedAccent + 0.25 * boundary + 0.2 * pivot + 0.2 * stepInto;
      const total = Math.round((0.7 * base.total + 0.3 * trans) * 1000) / 1000;
      const sc: PhraseScore = { total, parts: { ...base.parts, changedAccent, boundary, pivot, stepInto } };
      if (!bestScore || total > bestScore.total) { bestScore = sc; bestSplit = s; }
    }
    if (bestScore && bestSplit > 0) pool.push({ draft, split: bestSplit, score: bestScore });
  }
  pool.sort((x, y) => y.score.total - x.score.total);

  const chosen: TScored[] = [];
  const toks: string[][] = [];
  for (const cand of pool) {
    if (chosen.length >= count || cand.score.total < minScore) break;
    const t = tokensOf(cand.draft);
    if (toks.some(o => similarity(o, t) > 0.7)) continue;
    chosen.push(cand);
    toks.push(t);
  }

  const relation = ragaRelations(fromRaga.number, toRaga.number);
  const changedLabels = changed.map(p => `${A.notes[p].variant}→${B.notes[p].variant}`);
  return chosen.map((c, idx) => {
    const scaleAt = (i: number) => (i < c.split ? A : B);
    const events = toEvents(c.draft, scaleAt).map((e, i) => ({ ...e, section: (i < c.split ? 'from' : 'to') as 'from' | 'to' }));
    return {
      id: `transition-${String(fromRaga.number).padStart(2, '0')}-${String(toRaga.number).padStart(2, '0')}-${idx + 1}`,
      type: 'two-raga-transition' as const,
      from: { number: fromRaga.number, name: fromRaga.name },
      to: { number: toRaga.number, name: toRaga.name },
      relation,
      changedSvaras: changedLabels,
      splitIndex: c.split,
      durationSeconds: seconds,
      actualSeconds: Math.round((T / pace) * 60 * 100) / 100,
      level,
      swaras: events.map(e => e.swara),
      semitones: events.map(e => e.semitone),
      tempoBpm: pace,
      notation: toNotation(events),
      events,
      quality: c.score,
      source: 'rule-based-candidate' as const,
      validation: {
        status: 'needs-review' as const,
        notes: [
          'The pivot svara is shared by both rāgas; the second half passes through a svara that changes.',
          'Scores measure musical shape, not traditional rāga-bhedam practice. Listen and review before use.',
        ],
      },
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────────────────────────

export function exportPhraseCandidatesJson(candidates: PhraseCandidate[]): string {
  const scores = candidates.map(c => c.quality.total);
  return JSON.stringify({
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    generator: 'Bhava rule-based generator v2 (structured sampling + scoring)',
    disclaimer: 'Candidates are not certified authentic prayogas; review before learner-facing publication.',
    count: candidates.length,
    meanScore: scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 1000) / 1000 : 0,
    phrases: candidates,
  }, null, 2);
}
