// src/music/svaraMapping.ts
/**
 * Public facade and barrel export for the Nāda Vidyā Svara & Pitch architecture.
 *
 * Decomposed into:
 * - svaraValidation.ts  -> Types, Octaves, runtime type assertions
 * - tuning.ts           -> Registry, Just Intonation & 12-TET pitch resolution
 * - melakartaMapping.ts -> 72 Melakarta mathematics, Chakras, and legacy adapters
 * - notationParser.ts   -> Token and phrase parsing, diacritics, octave markers
 * - janyaMapping.ts     -> Janya scale resolution, anya svara handling
 */

export * from './svaraValidation';
export * from './tuning';
export * from './melakartaMapping';
export * from './notationParser';
export * from './janyaMapping';
