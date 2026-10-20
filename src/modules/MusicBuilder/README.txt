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
- Opens the experimental phrase library in a collapsible panel above the tracks.
- Adds “Import into active track” for the selected candidate; imported svaras become note blocks on the currently active track.
- Keeps the Kīrtana Library module itself untouched.
- Keeps generated candidates marked experimental; they are not musician-certified.

Note:
The PhraseLibrary component expects the same import.meta.glob paths as the previous integration:
../../data/musical-phrases/candidates/*.json
../../data/musical-phrases/transitions/*.json
