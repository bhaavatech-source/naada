# Nāda Vidyā — Modular Svara Mapping Draft

## Intended placement

Copy these source files into the existing project under `src/music/`:

- `svaraValidation.ts`
- `tuning.ts`
- `notationParser.ts`
- `melakartaMapping.ts`
- `janyaMapping.ts`
- `svaraMapping.ts`
- `__tests__/svaraMapping.test.ts`

These modules are deliberately independent of React components and do not require a paid or hosted API.

## Current responsibilities

- `svaraValidation.ts`: canonical IDs, octave types, runtime guards, validation error.
- `tuning.ts`: svara metadata, default tuning ratios, cents and pitch resolution.
- `notationParser.ts`: legacy token parsing and phrase parsing.
- `melakartaMapping.ts`: algorithmic mapping for 72 Melakarta numbers and compatibility helpers.
- `janyaMapping.ts`: resolves shorthand notes using a parent Melakarta context and optional anya-svara overrides.
- `svaraMapping.ts`: public barrel export; it re-exports the shared APIs.
- `__tests__/svaraMapping.test.ts`: dependency-free callable smoke-test suite.

## Important integration safeguards

1. This package is a proposed module set; it has not been connected to the app's current UI or audio engine.
2. Do not delete, rename, or replace `src/data/ragas.ts`, `src/data/janyas.ts`, `RagaLibrary`, `JanyaLibrary`, `engine.ts`, or `GamakaAudioEngine.ts`.
3. Keep explicit svara IDs in canonical data whenever variants matter. Bare letters such as `r` are only safe when a validated rāga context supplies the variant.
4. The default JI ratios are a project tuning policy, not a claim that every rāga or performance uses one universal intonation. Equal-tempered semitone aliases can differ under JI.
5. Existing notation uses commas in ways that may be ambiguous between octave notation and duration. Review real project strings before switching consumers to this parser.
6. The included test suite can be run only after the files are placed in the project's source tree and a TypeScript execution/test approach is available. The current package manifest shared previously has no dedicated test script or test framework.
7. First run the existing `npm run build`, then run these checks in isolation, then integrate one consumer at a time and rebuild. No existing recording or browser storage should be cleared.

## Public API examples

```ts
import {
  getMelakartaSvaraIds,
  resolveSvaraPitch,
  parseSvaraToken,
  resolveJanyaScale,
} from './svaraMapping';

const mela15 = getMelakartaSvaraIds(15);
const pitch = resolveSvaraPitch({
  svaraId: 'P',
  tonicHz: 261.63,
  tuningPolicy: 'just_intonation',
});
```

## Status

Updated draft for review. This archive does not include the whole application, so project build success and UI/audio compatibility cannot be certified from this archive alone.
