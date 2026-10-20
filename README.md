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

Copy `dist/` contents to `www/` folder.
