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

## Responsive layout checks

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
