# Bhāva Nādopāsanā — Music Education Tool

**Bhāva Tech | Hyderabad, Telangana | 2026**

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Build

```bash
npm run build
# Output in dist/
```

## Gāna Builder

The composition workspace is named **Gāna Builder** throughout navigation,
settings, resource links, and recording-import actions. Its internal `builder`
module ID, `MusicBuilder` source directory, storage keys, and recording-import
events remain unchanged to preserve compatibility.

The rāga selector includes Melakarta rāgas and locally reference-reviewed
Janya/Vakra scales. Scale playback follows the catalogue's svara notation; it
does not model gamakas or establish characteristic prayōga grammar. Phrase
library imports remain Melakarta-only until Janya-specific phrase validation
is available.

Before integrating curriculum updates, run `npm run test:svara` and
`npm run audit:raga`. The curriculum audit checks notation identity and octave
alignment, including combining-dot lower-octave Pa; it does not certify the
musical correctness or completeness of the separate Janya/Vakra curriculum.

## Responsive layout checks

### Resources and reading library

Resources has three sections: Learn & listen, Books & research, and Rāga &
Wellbeing. The reading library integrates metadata and outbound links from
`src/data/master-music-books-library.json`, including both books and research
papers. Counts and subject filters use the actual entries rather than the
file's summary category list. The supplied bibliography is not independently
verified; source availability, full-text access, and reuse rights must be
checked with the original provider. No full books or papers are mirrored.
Reference PDFs are local-only and ignored by Git. App code must not import
them; use bibliographic citations or verified source-site links instead so
clean-checkout deployments do not depend on local documents.

Search supports titles, authors, subjects, publishers, years, and DOIs, ignoring
case and IAST diacritics. Type/subject/notebook filters and year/title sorting
reset pagination (12 entries per page). Research access labels reflect the
supplied catalogue, not a live availability check. Wellbeing research is not
medical advice or evidence that a specific intervention is effective.

Run `npm run test:resources` and `npm run build`. Check all three sections at
290, 320, 390, 768, and 1280px, including long titles/categories, combined filters,
no matches/reset, pagination, keyboard focus, and external source links.

### Shruti live practice and recording

The tuner reserves the same pitch-panel space during notes and silence, including
the target-svara feedback area. Live analysis updates at most ten times per second.
Session/recording controls use a stable grid and remain sticky while scrolling;
the recording timer has reserved space so changing digits do not move Stop.
Check alternating voiced/silent microphone input with a target selected at
320, 390, 768 and 1280px, including recording past 9/10 seconds and scrolling.
Both Stop controls must stay stationary and work independently. Verify on iPhone
Safari and Android as well as desktop; desktop emulation does not certify mobile
browser microphone behavior.

### Tala practice and hand guide

Tala Theory now separates the seven Suladi forms (Dhruva, Matya, Rupaka, Jhampa,
Triputa, Ata and Eka) from Adi and Capu. Each entry states the example jati;
the separate Jati selector provides all five laghu counts (35 Suladi variants).
The illustrated longer laghu repeats little/ring/middle/index finger counting
without the thumb. This is a teaching convention, not a prescription for every
tradition. Anga lengths drive gestures, accents and Korvai boundaries together.

L2 keeps BPM fixed while nadai (3/4/5/7/9) and subdivision speed (1x/2x/4x/8x)
determine internal pulse density. Optional syllables are bundled, locally
generated synthetic voice samples scheduled on the Web Audio clock; they are
not authentic konnakol recordings. No live browser speech queue is used.
For clear speech, pulse slots shorter than 75 ms require lowering BPM/speed or
turning speech off. Missing samples produce an error, not skipped syllables.
To regenerate the five WAV files on Windows, run
`powershell -ExecutionPolicy Bypass -File scripts\generate-tala-syllables.ps1`
(requires the Microsoft Zira Desktop system voice). No network service is used.
Stop, settings changes and navigation cancel scheduled audio. L1 scoring matches
each expected beat at most once, includes missed beats and penalizes extra taps.

L1 and L2 offer **Loop until Stop**, selected before starting. With Loop off,
practice still ends after four cycles; with Loop on, audio continues across cycle
boundaries without a restart gap. L1 reports each completed four-cycle block and
discards that block's timing history so long practice sessions stay bounded.
Main beats use synthesized filtered-noise claps for thigh/clap actions and
distinct pitched cues for finger counts and waves; these are learning cues, not
recordings of traditional kriyas. Check clarity on the target phone speakers.

Both Melakarta and Janya/Vakra Raaga pages have a **Hand guide** section at the
top of their practice Settings panel. Click **Show hand guide** there and select
the guide tala and jati explicitly; close Settings to see the animated hand
on the practice page. The **Hide hand guide** control is in the same Settings
section. The
guide follows the audio output clock at master BPM, independent of note speed,
and restarts with each scheduled playback phrase (the full plan in Janya).
It pauses when playback ends and hides without affecting audio. It does not infer
an exercise's tala, eduppu or traditional gesture variants. Capu pictures remain
illustrative simplified pulse groups. The shared illustration wraps on narrow
screens to keep the instructions visible.

Run `npm run test:trainers` for exact tala pulse counts, gesture sequences,
single-match tap scoring and retained internal audio-helper regressions.
Check phone/desktop layouts, seven audible Misra syllables and stopping during
playback/loading; automated tests cannot certify listening quality.

### Gamaka Trainer removed from the app

The complete user-facing Gamaka Trainer has been removed: no home card,
navigation item, page route, listening library, A/B controls, synthetic drone or
singing/scoring game is exposed. Its earlier source/data and regression helpers
are retained but are not imported by the production app. Basic microphone pitch
feedback remains available in Shruti Trainer. Future gamaka instruction needs
teacher-reviewed material and appropriately licensed recordings.

### Janya and Vakra practice

The separately supplied `public/data/janya_vakra_ragas_exercises_200.json` is a
review input, loaded through a **fail-closed scale release gate**, not approved
as a complete teaching curriculum. Its actual
contents are 233 ragas and 9,786 exercises, rather than 200. Run
`node scripts\audit-janya-booklet.mjs` to reproduce the structural findings.
It contains an unsupported `V1` scale token in Manji and unsupported tokens in
23 exercise sections; 189 first Sarali
sections labelled as linear descents do not start on upper Sa; 5,592 sections
use packed notes such as `R2R2`, unsupported by the current player; and 932
sections use lowercase octave notation without a supplied notation guide.
All 233 records lack source/review metadata. Its `sapta_alankaras` group
contains nine entries per raga, so basic Suladi forms and additional forms need
separate presentation. These are audit findings, not a full musical review.
Do not auto-correct unknown swaras, infer octave meanings, or unlock the
existing reviewed-scale core from this file.

The release gate now uses local workbook and PDF evidence in
`src/data/janya-pdf-review.json`, rather than the earlier five-entry web allowlist.
Each accepted scale records its workbook sheet/cell or one-based PDF page, reference name,
chosen swarasthanas and an exact snapshot of the input scale/parent. The document
SHA-256 hashes bind the review to specific files. `Janya Ragams -.pdf` provides
extractable tables; additional facts are visually transcribed from
`Janya_Raagas.pdf`, not accepted from OCR output. These two PDFs are saved web
pages, not new musician certifications. `raga_pravagam-english-full.pdf` was
also consulted; its unnumbered notation must not be treated as independent
evidence for an unverified anya svara. Unresolved names, variants and source
conflicts remain pending, not proven incorrect. Melakarta entries already have
their own practice family.

`src/data/Janya_list.xlsx` is the preferred scale reference: 142 accepted entries
have workbook citations; Varam retains its PDF citation. Exact names and explicit
spelling aliases are used, never fuzzy approvals. A matching parent and existing
documented scale version are preferred; otherwise the named primary workbook
row is selected. Alternate rows are never combined. Unspecified svara variants
or unmatched requested variants remain pending. Vegavahini, for example, follows
`Sheet1!C263`: its ascent omits Pa and retains the Dha–Ni–Dha turn.
The original workbook is read-only. The legacy manifest filename is retained.

Run `node scripts\review-janya-pdfs.mjs` to verify the manifest against the local
workbook/PDFs (requires Python 3 and `pdftotext`). The workbook extractor uses only
Python's standard library. Run `python scripts\test_read_janya_workbook.py` for
extraction/ambiguity and reference-cell regressions. After inspecting changed references, regenerate with
`--apply`. The scanned document hash is pinned: changing the PDF requires visual
re-review, not simply regenerating its fingerprint. The selected reference version replaces a
conflicting booklet scale; alternate versions are not silently combined.
The references verify swarasthana identity and order. Playback uses explicit scale-practice
register conventions where internal octave marks are absent; those register
interpretations are disclosed separately, not claimed as reference-certified.
Internal upper-tonic returns, limited-register Kurinji and lower-register tails
are retained. Vakra order, repetitions and anya identities
are never sorted or deduplicated.

Exercises have a separate **mathematical**, not documentary, release gate.
Rule v1 compares each directional sequence to a defined scale-position template.
Accuracy is `100 * (maxLength - LevenshteinDistance) / maxLength`, using ordered
svara identity + octave positions and comma holds. Both directions must score
**strictly above 90%**, before rounding. Invalid notes, unsupported/ambiguous
notation, out-of-directional-scale notes or octaves, missing directions, and
incorrect declared alankara beats/anga boundaries block release at any score.
The score measures compliance with these rules, not a probability of musical
authenticity. Vakra templates index the original path, including repeated notes;
they do not establish traditional prayogas.

The original source exercises are still audited using v1 (first linear Sarali,
three Dhaatu patterns, seven Suladi examples and two Sankeerna Eka extensions).
These source assessments are retained internally, not displayed to learners.
Following explicit approval to correct and complete the curriculum, the practice
page uses v2 **generated scale-position studies**, not the incorrect/ambiguous
source strings. The source JSON supplies the six-group, 42-lesson curriculum
layout: 14 Sarali, 12 Janta, 3 Dhaatu, 2 lower-register, 2 upper-register and
9 alankara studies. All 143 verified outlines receive that complete curriculum.

V2 independently indexes each directional path, preserving repeated vakra
positions and directional anya notes. Sarali uses explicit two-, three- and
four-position motifs in successive windows; Janta doubles each indexed pitch;
Dhaatu uses three explicit skip motifs. Sthayi studies transpose the exact path
by one octave down/up with explicit comma/apostrophe notation, never inferring
the source's lowercase convention. They include unshifted positions as pivots.
Alankara studies move the established anga templates along the path, maintaining
cycle boundaries, holds and declared beat totals. The two Eka extensions are
variations, not additional Suladi forms. Displayed exercises are regenerated
deterministically from the approved scales and revalidated before playback.
These are mathematical scale drills, not certified traditional prayogas or
canonical guru-taught varisais. A 100% template match is not independent musical
certification. Source assessment counts and generated exercise counts are separate.

The main practice pane opens on **Exercises**, with all six group tabs available
without Settings. Reference citations, release reports, scores and review notices
are intentionally absent from the learner-facing page and Settings. Evidence and
tests remain internal. Scale playback, individual exercise playback, queues,
direction/speed controls, looping and the optional hand guide remain available.

Original datasets remain unchanged. Changed source scales/parents and duplicate
identities lose approval; a legacy core cannot bypass reference verification.
Missing/malformed root datasets produce a visible load error and Retry.
Malformed individual exercises are rejected without removing the verified scale.
Missing/malformed exercise groups are reported visibly; their unknown sizes are
not invented or included in the assessed-exercise count.
Run `node scripts\run-svara-tests.mjs --janya` for focused evidence, threshold,
source-mutation and display/playback checks; `npm run test:svara` covers the
broader software regressions, not musical certification.

### Rāga & Wellbeing

Open **Nāda Wisdom → Rāga & Wellbeing** for an educational listening catalogue,
not a medical recommendation engine. The catalogue has 102 entries, four
nonmedical listening-character filters (calm, reflective, uplifting, devotional),
and a short cultural-learning/non-treatment notice. Associations are not promised
effects. No listening duration, health-condition selector or doṣa prescription
is presented. Entries without a supported association remain browsable under All.

The two source files, `src/data/raga-healing-therapy-database-v2_2.json` and
`src/data/therapeutic-keerthanas-library-v1_2.json`, retain archival claims and
illustrative notes for traceability. Their integration policies prohibit exposing
those fields as recommendations. The app imports only the generated allowlisted
`src/data/raga-wellbeing-catalogue.json`, never the raw clinical indexes,
deprecated claims, placeholder lyrics or unverified composition notation.
Public cards expose 72 formula-checked Melakarta practice links and 20 exact
local-reference Janya links. Ten metadata-only entries have neither public scale
notation nor a practice link. A link opens the correct family and selected rāga;
it does not overwrite the practice registry. Normal Rāga Practice navigation
continues to open its default family/rāga.

Manji and other linked Janya outlines use the selected workbook/PDF practice
version. Bageshri's five-note ascent/seven-note descent label is corrected.
Bageshri/Darbari Kanada are not asserted to be verified Carnatic adaptations;
cross-tradition names such as Bhoopalam/Bhupali are not treated as equivalents.

The composition catalogue distinguishes two named traditional works from two
project-created studies. All four are **metadata only**: no composition playback,
lyrics display, gamaka demonstration or tāla synchronisation is enabled until
published melody, sāhitya alignment, duration units and eduppu are verified.
The rāga-scale practice link is explicitly separate from composition playback.
Scale membership or mathematical exercises cannot certify a named composition.

Source limits remain internal: the introduction PDF is a two-page book review;
the healing paper's waveform/FFT analysis is not evidence of clinical efficacy
and its scale table contains inconsistencies; the scanned historical book was
not established as per-entry evidence by the unreliable sampled OCR. No claim of
complete PDF verification or clinical validation is made.

After reviewing reference changes, run
`node scripts\review-wellbeing-catalogue.mjs --apply` to update both source
integration records and the public projection; run without `--apply` to check
reproducibility. No fuzzy identity matching or clinical claims inference is used.
Run `node scripts\run-svara-tests.mjs --wellbeing` for allowlist, all-scale,
ID, adaptation-label, composition-gate and practice-target regressions.

Rāga Practice opens with the existing 72-Melakarta lessons. Select **Janya & Vakra**
to browse the Carnatic-only scale study core. The compatibility-named
`public/data/master-1000-ragas-database.json` is now version 4.0.0 and contains
75 entries: 72 formula-checked Melakartas and three individually reference-checked
Janya outlines (Malahari, Mohanam and Abhogi). All Hindustani records have been
removed, not copied into the review archive. Unverified rasa assertions and the
general treatise bibliography have been removed from the teaching source.

The JSON is the app/NotebookLM study source. It includes a notation guide, review
scope and entry-level evidence. Janya notes, octave positions and conventional
parents were compared with the supplied source table and the linked secondary
reference on 2026-10-26. This is written-scale checking, not a claim of an
error-free full musical curriculum, independent primary-text review, or musician
certification. Gamakas and characteristic phrase teaching are outside its scope.

The other 210 Carnatic entries are retained only in
`src/data/carnatic-ragas-pending-review.json`, explicitly marked not for teaching;
the app does not load this file. Do not upload it as part of the study core.
The audit-draft curriculum cannot reintroduce excluded ragas. Its loader retains
96 matching draft exercises internally for validation, but the release gate
removes those unapproved lessons from the user-facing result. The original 624
exercises are preserved, not rewritten or certified.
Catalogue scales and review metadata are retained when attaching curricula.
Run `node scripts/review-raga-catalogue.mjs` to validate the core, archive and
exact reviewed scale outlines. Its `--apply` option reapplies the migration;
it refuses to overwrite an existing archive when unresolved entries are present.
In Settings, search by name or parent number, filter by parent or Vakra classification,
and select Scale or About. Exercise groups appear only when approved lessons exist.
Search and category tabs are not repeated on the
practice page. The Janya/Vakra workspace follows the Melakarta list-and-
practice layout. Its Settings panel contains the selected scale, live swarasthāna
feedback, pitch buttons, playback direction, speed, loop, and the optional hand guide.
Every rāga has visible ascending and descending scales, even without an
exercise curriculum; source/variant-review locks also apply to individual note
audition and settings-panel playback. Each scale preserves its exact note count, octaves and Vakra
repetitions; individual displayed notes can also be played.
The currently sounding scale or exercise note is highlighted using the audio output
clock, including correct positions after bars, rests and held notes.
Exercise cards show svarasthāna notation only. The **About** tab after Alankāram
contains the selected rāga's type, parent, and source.

Playable notation can be auditioned as a computer-generated guide. Audio and display
use the same explicit svarasthāna tokens; there is no hidden solfa fallback.
Unsupported exercise notation is visibly marked as needing correction and cannot
be played; the rāga's scales remain available instead.
The page states: “These computer-generated practice notes should be reviewed and
practised with a traditional Carnatic music guru.”

Scale playback reproduces the supplied explicit pitches, including anya variants,
using the shared music parser, just-intonation registry and Melakarta instrument
renderer, with bounded envelopes and harmonic headroom to avoid clipping. It is a
synthesized pitch guide, not an authentic performance or validation of the scale.
The app's tonic, BPM, instrument and volume apply. Stop, selection/settings changes,
view changes and leaving the module cancel scheduled notes. Scale and exercise playback
share the 1× / 2× / 3× speed, direction and Loop options; looping repeats the current
sequence with a short pause. Exercise queues include only notes supported by the player.

Check Janya browsing at 320, 390, 768 and 1280px, all categories and multi-part notes,
catalogue-only and empty-search states, loading failure/retry, settings-panel scale
and exercise playback and note highlighting, About details, Loop visibility, and switching
back to the Melakarta view. `npm run test:svara` also checks the actual
catalogue/curriculum coverage and notation validation.

The homepage uses one card column on phones, two on tablets, and three on
wide screens. Its hero remains centered and the content scrolls below the header.
Global styles let main-content flex children shrink without resizing notation tracks.

After layout changes, check 320, 360, 390, 430, 768, and 1280px viewport widths:
verify that card text fits without clipping, every module card opens its module,
the gallery is reachable by scrolling, and the phone menu and settings still work.
Also check reduced-motion mode and a short landscape viewport.

The homepage does not show audio settings. In Rāga Library, the header's Settings
button opens a scrollable panel on phones and desktops containing audio settings,
swarasthāna names and pitch previews, speed, playback direction, looping, exercise
categories (Sarali through Alankāram), and sequential playback controls. Close the
panel or press Escape to return to the exercise notes; category and playback
choices remain selected while the panel is closed. Each exercise retains its
Play/Stop button beside its notation.
Stop cancels the currently sounding and already scheduled notes immediately,
including instrument effects, pending playback phases, loops, and queued exercises.

Gamaka Trainer uses the available content height with a single page scroll area.
On small screens, exercise details and level controls wrap into separate rows;
the game scores and microphone controls sit outside the pitch canvas. The canvas
matches its displayed width so labels and waypoints are not squeezed horizontally.
Check both Listen and Sing/Practice modes, all three levels, and library playback
controls at 290, 320, 430, 768, and 1280px widths.

## Project Structure

```
src/
├── main.tsx              # React entry point
├── App.tsx               # Root layout (Sidebar + Header + Module router)
├── types/index.ts        # All TypeScript interfaces
├── store/
│   └── useAppStore.ts    # Global state (Zustand): tonic, BPM, volume, instrument
├── styles/
│   └── globals.css       # CSS variables, base reset, fonts
├── audio/
│   └── engine.ts         # Web Audio: synth, pitch detect, tanpura, sequencer
├── data/
│   ├── ragas.ts          # 72 Melakarta dataset
│   ├── talas.ts          # 6 Tālas + 5 Nadais
│   ├── kirtanas.ts       # 12 Kīrtana compositions
│   └── instruments.ts    # 9 instrument definitions
├── components/
│   └── layout/
│       ├── Sidebar.tsx   # Navigation
│       └── Header.tsx    # Global controls
└── modules/
    ├── RagaLibrary/      # 72 Melakartas + exercises
    ├── TalaTrainer/      # L1/L2/L3 rhythm training
    ├── ShrutiTrainer/    # Microphone pitch detection
    ├── KirtanaLibrary/   # 12 compositions with notation
    ├── MusicBuilder/     # Drag-and-drop composer
    ├── Progress/         # Session stats (Phase 2)
    └── About/            # Vision and roadmap
```

## Electron Integration

```js
mainWindow.loadFile('dist/index.html')
```

## Capacitor (Android/iOS)

The Android app uses Capacitor and bundles the production website from `dist/`;
it does not require a running Vite server. The application ID is
`com.bhaavatech.naada`, with Android 7.0 (API 24) as the minimum version.
Microphone permission is requested when a practice feature needs audio input.

### Build and install a testing APK (Windows)

Use Node.js 22+, Android Studio with JDK 21, and Android SDK Platform 36.
Set `JAVA_HOME` to your JDK and `ANDROID_HOME` to your Android SDK, or configure
the SDK location in the ignored `android/local.properties` file.

```powershell
npm ci
npm run android:build
adb devices -l
adb install -r .\android\app\build\outputs\apk\debug\app-debug.apk
adb shell am start -n com.bhaavatech.naada/.MainActivity
```

The APK for future device testing is
`android/app/build/outputs/apk/debug/app-debug.apk`. Rebuild it after web changes:
`android:build` builds the website, synchronizes Capacitor, and assembles the APK.
Enable USB debugging on the phone and accept its authorization prompt before
installing. When multiple devices are connected, use `adb -s <serial>`.

This debug-signed APK is for testing, not Play Store distribution. Keep the same
debug signing key when installing updates; a different key cannot update an
existing installation. Do not uninstall merely to resolve a signing mismatch
without backing up any practice data first.
