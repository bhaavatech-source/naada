# Nāda Vidyā / Nādopāsanā — Gamaka Trainer integration bundle

This bundle is based on the supplied `Full-src.zip` application snapshot, with the Gamaka Trainer added at the same root-level layout used by the existing app (`modules/`, `audio/`, `store/`, `types/`, `data/`). It is a source integration bundle, not a standalone deployable project: the supplied source snapshot did not include `package.json`, lockfile, or installed dependencies. Keep your existing project manifest and dependencies.

## What was changed

### App integration
- Added `gamaka` to `types/index.ts` `AppModule`.
- Registered `GamakaTrainer` in `App.tsx`.
- Added Gamaka Trainer navigation in `components/layout/Sidebar.tsx`.
- Added the module title in `components/layout/Header.tsx`.

### Gamaka module alignment
- Added `types/gamaka.ts`, `data/gamakaCatalogData.ts`, `store/useGamakaStore.ts`, `audio/GamakaAudioEngine.ts`, and `modules/GamakaTrainer/` from the supplied V2 module.
- Shared tonic is now read from the existing `useAppStore.settings.tonicHz`; the trainer no longer maintains a separate tonic selector/state.
- Shared application volume is applied to the Gamaka audio bus.
- Instrument choice remains module-local because the Gamaka synth currently supports Vīṇā, Vēṇu/flute, and voice formants, while the application-wide instrument list contains additional instruments that this module does not yet synthesize.
- Gamaka audio reuses `getAudioContext()` from the existing `audio/engine.ts`, rather than creating a second playback AudioContext. The microphone analyser retains its own short-lived context so stopping microphone capture does not close the application's shared playback context.

### Reliability fixes
- Fixed A/B sequencing so the plain-note and gamaka tracks are scheduled internally without each public playback method cancelling the comparison.
- Added cancellable waits/generation tracking so Stop cancels a track or comparison and the UI can return to idle.
- Ensured A/B comparison uses the same duration for both tracks, based on the profile contour duration.
- Added flute breath-noise excitation and made the Tambura toggle stop active drone oscillators promptly.
- Prevented invalid/silent microphone frames from contributing to pitch scoring or waypoint collection; no valid pitch samples now produce a score of zero rather than a misleading positive score.
- Added cleanup of Gamaka playback and its Tambura drone when leaving the module.

## Files added
- `types/gamaka.ts`
- `data/gamakaCatalogData.ts`
- `store/useGamakaStore.ts`
- `audio/GamakaAudioEngine.ts`
- `modules/GamakaTrainer/index.ts`
- `modules/GamakaTrainer/GamakaTrainer.tsx`
- `modules/GamakaTrainer/GamakaAuditionCard.tsx`
- `modules/GamakaTrainer/GamakaCanvasGame.tsx`

## Existing files modified
- `App.tsx`
- `types/index.ts`
- `components/layout/Sidebar.tsx`
- `components/layout/Header.tsx`

## Validation status
- TypeScript/TSX syntax transpile check: 12 relevant source files checked, zero syntax diagnostics.
- Relative import paths and integration references reviewed.
- A full `npm run build` was **not run** because the provided application snapshot has no `package.json`, lockfile, or dependencies. Run the build inside the actual project after copying these changes and resolve any environment/project-specific diagnostics before deployment.
- Sound quality has not been measured or claimed as 70% accurate. The engine is still browser synthesis; it needs listening tests against suitable Carnatic reference audio before being considered release-ready.

## Integration notes
1. Back up the current application before replacing any files.
2. Copy the updated root-level source tree into your project, preserving your existing `package.json`, lockfile, public assets, and environment files.
3. Run `npm install` only if the existing project dependencies require it; do not replace the project's dependency manifest with a guessed one.
4. Run `npm run build` in the actual project.
5. Manually test: global tonic changes, Listen plain/gamaka playback, A/B comparison, Stop during both tracks, Tambura on/off and retuning, microphone permission denial, silence scoring, and existing Rāga/Śruti/Tāla/Kīrtana modules.

The current A/B mode is the sequential A-then-B comparison shown in the UI. Additional modes such as crossfade should not be exposed until they are implemented and tested.
