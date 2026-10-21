Naadopāsanā — Music Builder phrase import update

Files:
- index.tsx
- PhraseLibrary.tsx

Install:
1. Back up:
   src/modules/MusicBuilder/index.tsx
   src/modules/MusicBuilder/PhraseLibrary.tsx
2. Copy both files into:
   E:\nadopaasana-android\src\modules\MusicBuilder\
   Allow overwrite for both.
3. Ensure generated JSON remains in:
   src/data/musical-phrases/candidates/
   src/data/musical-phrases/transitions/
4. Run:
   npm run build

Changes:
- Replaces the Music Builder toolbar button “Import Kīrtana” with “Import Musical Phrases”.
- Removes the row of Kīrtana composition-name chips.
- Opens the experimental phrase library in Music Builder settings.
- Adds “Import into active track” for the selected candidate; imported svaras become note blocks on the currently active track.
- Keeps the Kīrtana Library module itself untouched.
- Keeps generated candidates marked experimental; they are not musician-certified.

Responsive workspace:
- The header Settings button contains composition actions, raga selection, practice
  modes, playback, imports/exports, Sound & Rhythm Studio, and Arrangement Timeline.
- On phones the note palette sits above the tracks in one vertical scroll area.
  Tap notes to compose; drag-and-drop is not required.
- The timeline scrolls horizontally inside settings without widening the workspace.
- Musical Phrase Library is not shown in Manodharma Practice. Phrase import remains
  available in the Music Builder settings only.
- Check 290, 320, 360, 390, 430, 768, and 1280px widths, including settings open/closed,
  adding notes/tracks, undo/redo, playback, imports/exports, and both practice modes.

Note:
The PhraseLibrary component expects the same import.meta.glob paths as the previous integration:
../../data/musical-phrases/candidates/*.json
../../data/musical-phrases/transitions/*.json
