Naadopāsanā — Gāna Builder

The active entry point is index.tsx. Earlier proposed/legacy index copies have
been consolidated into this file; do not restore a numbered index over it.

Included features:
- Melakarta and reference-reviewed Janya/Vakra scale selection.
- Multitrack note composition, mute/solo, volume, delay, undo/redo, and timeline.
- Advanced Event Editor: labels, pitch, duration, position, rests, copy/paste,
  delete, and beat snapping.
- Svara Notation + Tāḷa: active-track cycle alignment, five cycle choices,
  and display-only eduppu. This is not a full anga/kriya notation validator.
- Multiple local audio imports placed sequentially using decoded durations.
  Failed files are reported and do not advance the next clip's position.
- Audio source trimming and length controls, respected by playback, waveforms,
  analysis, and WAV mix/stem exports.
- Approximate svara analysis of the first 30 seconds of a trimmed audio clip,
  using the app's shared pitch detector (75–1000 Hz). Detected events can be
  added to the active track at the clip's timeline position for manual review.
- Video-to-audio conversion with bundled, single-thread FFmpeg/WebAssembly.
  No media is uploaded and no converter code is fetched from a third-party CDN.
  Browser-dependent real-time capture is retained as an explicit fallback.
  Conversion can be cancelled; a maximum input size of 500 MB applies.
  @ffmpeg/core is GPL-2.0-or-later; @ffmpeg/ffmpeg is MIT. Review redistribution
  and corresponding-source obligations before publishing web or Android bundles.
  Upstream source/build information: https://github.com/ffmpegwasm/ffmpeg.wasm
- Gāna Construction Lab: sequencer, editable phrase clips, experimental phrase
  library, tāḷa/subdivision grid, local autosave/snapshots, and Lab JSON import/
  export. Lab projects are separate from the main arrangement; applying
  a Lab sequence appends it to the active track.
- Musical phrase import, Sound & Rhythm Studio, Śruti recording imports,
  and integrated Manodharma Practice & Learning.
- MMG Varisai Practice is available from the Home/Nāda Wisdom card, not from
  Gāna Builder. It replaces the removed Gītam Practice page.
- Shared playback, repetitions, pause/resume, and WAV mix/stem exports.
  The main builder toolbar does not offer CSV, TXT, or JSON exports.

Lab browser storage is not a portable backup; export Lab JSON to retain
snapshots elsewhere.

Validation:
  npm run test:builder
  npm run test:trainers
  npm run build

Changes:
- Replaces the earlier toolbar button “Import Kīrtana” with “Import Musical Phrases”.
- Removes the row of Kīrtana composition-name chips.
- Opens the experimental phrase library in Gāna Builder settings.
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
  available in the Gāna Builder settings only.
- Check 290, 320, 360, 390, 430, 768, and 1280px widths, including settings open/closed,
  adding notes/tracks, undo/redo, playback, imports/exports, and both practice modes.

Note:
The PhraseLibrary component expects the same import.meta.glob paths as the previous integration:
../../data/musical-phrases/candidates/*.json
../../data/musical-phrases/transitions/*.json
