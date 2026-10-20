# Nāda Vidyā — Rāga Library Audit (Pass 1)

## Scope
This pass is restricted to the Rāga Library curriculum data and its loading path. No other module UI or audio engine was redesigned.

## Change made
- Added `public/data/naadopaasana-master-curriculum-v2.json` because `src/data/curriculum/service.ts` requests that exact public URL, while the supplied archive previously held the JSON only at the project root.
- Added `npm run audit:raga`, a dependency-free static audit script at `scripts/audit-raga-library.mjs`.

## Static audit results
- 72/72 Melakarta entries present.
- Expected category counts present for all 72 entries: 14 Sarali, 12 Janta, 3 Dhātu, 5 Mēl Sthāyi, 5 Kīḷ Sthāyi, 9 Alankāras, and 9 Sulādi Sapta Tāla Alankāras.
- 4,104 exercises checked.
- 9,648 notation strings checked for solfa/swarasthāna alignment.
- 256,608 note-token pairs checked for swara family, variant, and octave-marker consistency.
- All 17 distinct solfa token forms used by the curriculum have a corresponding Rāga Library playback key or alias.
- The first Sarali exercise in every Melakarta has the expected complete scale pattern in ascent and reverse pattern in descent.
- Result: PASS.

## Important limitation found for the next pass
The Rāga Library still contains its own local `JI` pitch-ratio table in `src/modules/RagaLibrary/index.tsx`. That table differs from the canonical `SVARA_REGISTRY` ratios in `src/music/tuning.ts` for several swarasthānas (including R1, R3, G2, G3, M2, D1, D3 and N2). These differences can change playback pitch by roughly 20–41 cents depending on the swara. This pass deliberately does not alter those ratios; the next isolated pass should make the Rāga Library resolve pitches through the canonical registry and add targeted pitch tests.

## Not yet verified
- Production build and full TypeScript test run: not run in this environment because project dependencies (including TypeScript) are not installed in the extracted archive.
- Browser playback, audio frequency measurements, active-note synchronization, and human Carnatic listening review: not verified by this static audit.
- Janya rāgas are not part of the current Rāga Library picker, which is built from the 72 Melakarta entries.

## Run the audit
```powershell
npm run audit:raga
```
