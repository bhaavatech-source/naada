# Nāda Vidyā / Nādopāsanā — first verification pass

## Changes made

- Corrected the Melakarta data's G-swara semitone positions to the canonical equal-tempered reference positions: G1 = 2, G2 = 3, G3 = 4 semitones above Sa. R2/G1 and R3/G2 remain distinct identities even where their 12-TET positions coincide.
- Corrected the same G-position lookup in both Melakarta helper definitions in `src/data/ragas.ts`.
- Updated the canonical notation parser so legacy single-letter uppercase swaras denote tāra sthāyi, lowercase denotes madhya sthāyi, a trailing dot denotes the upper octave, and commas/underscores denote lower-octave markers. Added `parseNotationSequence` to preserve bar markers, standalone duration commas, and rests as structured items.
- Improved `ExerciseLineDisplay` to preserve notation spacing and wrap between tokens on narrow layouts.
- Removed visible frequency readouts from the active Śruti/Gamaka trainer screens and removed numeric frequency hints from tonic dropdown labels. Internal frequency values remain in the audio engine.
- Added `npm run test:svara`, with a dependency-light runner for the existing TypeScript test suite.
- Expanded tests to cross-check all 72 Melakarta data entries, ascending/descending note order, semitone maps, parser octave/hold/rest/bar behavior, and all Sarali exercise lines' display/token consistency.

## Verification results

- Svara test suite: **224 tests passed**.
- TypeScript/TSX syntax transpilation: **67 files checked, 0 syntax errors**.
- Full production build: **not verified**. `npm run build` currently stops at missing/incomplete installed type packages (`react`, `react-dom`, and other `@types` entries). The dependency installation in this environment did not complete, so this is an environment/dependency issue rather than a confirmed source build failure.

## Important scope note

This is a first, tested correction pass—not a release sign-off. The new structured notation parser and tests are in place, but the active Rāga Library audio scheduler still has its own legacy event parser; wiring both through one parser is a separate integration step that should be done and re-tested carefully. The app should not be considered release-ready until dependencies install cleanly, the full build passes, and the Sarali hold/highlight behavior is checked in a browser and by listening.
