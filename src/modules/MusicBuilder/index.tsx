// src/modules/MusicBuilder/index.tsx

import { useState, useCallback, useRef, useEffect, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import './music-builder.css';
import { MELAKARTAS } from '../../data/ragas';
import { INSTRUMENTS } from '../../data/instruments';
import { useAppStore } from '../../store/useAppStore';
import { getAudioContext, semitonesToHz, synthNote, stopAllSynthNotes, unlockAudio } from '../../audio/engine';
import { integrateJanyaBooklet } from '../../music/janyaBooklet';
import { parseJanyaNotation, type JanyaPracticeRaga } from '../../music/janyaCurriculum';
import { SVARA_REGISTRY } from '../../music/tuning';

import type { InstrumentId } from '../../types/index';
import { ManodharmaIntegrated } from '../manodharma/ManodharmaIntegrated';
import { PhraseLibrary } from './PhraseLibrary';
import { consumePendingVocalImport } from '../../store/pendingVocalImport'
import { audioBufferToWav, downloadBlob } from '../../audio/wavExport'
import { createSoundBuffer, SOUND_PRESETS } from '../../audio/soundDesign'
import type { SoundGenerationOptions } from '../../audio/soundDesign'
import { SoundStudioPanel } from './SoundStudioPanel'
import type { GeneratedSoundRecipe } from './SoundStudioPanel'
import { GanaConstructionLab } from './GanaConstructionLab'
import { extractVideoAudio } from './videoAudio'
import { analyseAudioSwaras, audioClipWindow, MAX_ANALYSIS_SECONDS, type DetectedSvara } from './builderAudio'

interface NoteBlock {
  id: string;
  label: string;
  semitone: number;
  duration: number;
  source: string;
  /** Musical position, measured in beats from the track's start. Older projects may omit it. */
  startBeat?: number;
  /** Silent timeline event used to represent a musical rest. */
  kind?: 'note' | 'rest';
}
interface Track {
  id: string;
  name: string;
  instrument: InstrumentId;
  color: string;
  blocks: NoteBlock[];
  muted?: boolean;
  solo?: boolean;
  delayBeats?: number;
  volume?: number;
}
type RagaSelection = {
  id: string;
  name: string;
  number: number;
  family: 'melakarta' | 'janya';
  janya?: JanyaPracticeRaga;
};
type RagaFilter = 'melakarta' | 'janya' | 'vakra';

// ── Shruti import types ──────────────────────────────────────────────────────
interface ImportedVocalTrack {
  type: 'shruti-recording';
  name: string;
  date: string;
  dataUrl: string;
  // instrument layers chosen by user in Music Builder
  layers: InstrumentId[];
}

interface ImportedAudioClip {
  id: string;
  name: string;
  buffer: AudioBuffer;
  durationSeconds: number;
  /** Playback begins this many seconds into the decoded source. */
  sourceStartSeconds?: number;
  startBeat: number;
  volume: number;
  muted: boolean;
  generatedRecipe?: GeneratedSoundRecipe;
}
interface ScheduledNote {
  trackId: string;
  hz: number;
  dur: number;
  instr: InstrumentId;
  at: number;
  trackVolume: number;
}
interface ScheduledAudioClip {
  clipId: string;
  buffer: AudioBuffer;
  at: number;
  duration: number;
  sourceStartSeconds?: number;
  volume: number;
  name: string;
}
interface TimelineSchedule {
  notes: ScheduledNote[];
  audioClips: ScheduledAudioClip[];
  arrangementDuration: number;
  totalDuration: number;
  beatSeconds: number;
}

/** Assign sequential positions to legacy notes and preserve explicit timeline positions. */
function positionBlocks(blocks: NoteBlock[]): Array<NoteBlock & { startBeat: number }> {
  let cursor = 0;
  return blocks.map(block => {
    const explicit = Number.isFinite(block.startBeat);
    const startBeat = explicit ? Math.max(0, Number(block.startBeat)) : cursor;
    const duration = Math.max(0.05, Number(block.duration) || 0.5);
    cursor = Math.max(cursor, startBeat + duration);
    return { ...block, duration, startBeat };
  });
}
function blocksEndBeat(blocks: NoteBlock[]): number {
  return positionBlocks(blocks).reduce((end, block) => Math.max(end, block.startBeat + block.duration), 0);
}
function waveformPeaks(clip: ImportedAudioClip, bars = 48): number[] {
  const window = audioClipWindow(clip.buffer.duration, clip.sourceStartSeconds, clip.durationSeconds);
  const channel = clip.buffer.getChannelData(0).subarray(Math.floor(window.start * clip.buffer.sampleRate), Math.floor((window.start + window.duration) * clip.buffer.sampleRate));
  const result: number[] = [];
  for (let bar = 0; bar < bars; bar++) {
    const start = Math.floor((bar / bars) * channel.length);
    const end = Math.max(start + 1, Math.floor(((bar + 1) / bars) * channel.length));
    const stride = Math.max(1, Math.floor((end - start) / 32));
    let peak = 0;
    for (let index = start; index < end; index += stride) peak = Math.max(peak, Math.abs(channel[index]));
    result.push(peak);
  }
  return result;
}

function projectEndBeat(tracks: Track[], clips: ImportedAudioClip[], bpm: number): number {
  const audioBeatSeconds = 60 / Math.max(30, bpm);
  const trackEnd = tracks.reduce((end, track) => Math.max(end, (track.delayBeats ?? 0) + blocksEndBeat(track.blocks)), 0);
  const clipEnd = clips.reduce((end, clip) => Math.max(end, clip.startBeat + clip.durationSeconds / audioBeatSeconds), 0);
  return Math.max(0, trackEnd, clipEnd);
}

function buildTimelineSchedule(
  tracks: Track[], clips: ImportedAudioClip[], bpm: number, tonicHz: number,
  playMode: 'together' | 'sequential', repetitions: number, selectedTrackId?: string,
): TimelineSchedule {
  const beatSeconds = 60 / Math.max(30, bpm);
  const anySolo = tracks.some(track => track.solo);
  const eligibleTracks = tracks.filter(track =>
    (!selectedTrackId || track.id === selectedTrackId) &&
    !track.muted && (!anySolo || !!track.solo) && track.blocks.length > 0,
  );
  const baseNotes: ScheduledNote[] = [];
  const baseAudio: ScheduledAudioClip[] = [];
  let arrangementDuration = 0;

  if (playMode === 'sequential') {
    let cursor = 0;
    eligibleTracks.forEach(track => {
      const trackStart = cursor + Math.max(0, track.delayBeats ?? 0) * beatSeconds;
      const blocks = positionBlocks(track.blocks);
      let trackEnd = 0;
      blocks.forEach(block => {
        const at = trackStart + block.startBeat * beatSeconds;
        const dur = Math.max(0.08, block.duration * beatSeconds);
        if (block.kind !== 'rest') baseNotes.push({ trackId: track.id, hz: semitonesToHz(tonicHz, block.semitone), dur, instr: track.instrument, at, trackVolume: track.volume ?? 1 });
        trackEnd = Math.max(trackEnd, block.startBeat * beatSeconds + dur);
      });
      cursor = trackStart + trackEnd + 0.15;
    });
    arrangementDuration = cursor;
  } else {
    eligibleTracks.forEach(track => {
      const trackOffset = Math.max(0, track.delayBeats ?? 0) * beatSeconds;
      positionBlocks(track.blocks).forEach(block => {
        const at = trackOffset + block.startBeat * beatSeconds;
        const dur = Math.max(0.08, block.duration * beatSeconds);
        if (block.kind !== 'rest') baseNotes.push({ trackId: track.id, hz: semitonesToHz(tonicHz, block.semitone), dur, instr: track.instrument, at, trackVolume: track.volume ?? 1 });
        arrangementDuration = Math.max(arrangementDuration, at + dur);
      });
    });
  }

  // Audio clips use absolute musical positions and remain synchronized with the shared timeline.
  // In selected-track or solo playback, audio clips are omitted so they do not defeat isolation.
  if (!selectedTrackId && !anySolo) {
    clips.filter(clip => !clip.muted).forEach(clip => {
      const at = Math.max(0, clip.startBeat) * beatSeconds;
      const window = audioClipWindow(clip.buffer.duration, clip.sourceStartSeconds, clip.durationSeconds);
      baseAudio.push({ clipId: clip.id, buffer: clip.buffer, at, duration: window.duration, sourceStartSeconds: window.start, volume: clip.volume, name: clip.name });
      arrangementDuration = Math.max(arrangementDuration, at + window.duration);
    });
  }

  const repeatTotal = Math.max(1, Math.min(32, repetitions));
  const notes: ScheduledNote[] = [];
  const audioClips: ScheduledAudioClip[] = [];
  for (let repeat = 0; repeat < repeatTotal; repeat++) {
    const offset = repeat * arrangementDuration;
    baseNotes.forEach(event => notes.push({ ...event, at: event.at + offset }));
    baseAudio.forEach(event => audioClips.push({ ...event, at: event.at + offset }));
  }
  notes.sort((a, b) => a.at - b.at);
  audioClips.sort((a, b) => a.at - b.at);
  return { notes, audioClips, arrangementDuration, totalDuration: arrangementDuration * repeatTotal, beatSeconds };
}

const TRACK_COLORS = ['#c084fc', '#22d3ee', '#4ade80', '#f59e0b', '#f87171', '#fb923c'];

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

function makeTrack(name: string, idx: number): Track {
  return {
    id: makeId(),
    name,
    instrument: (idx === 0 ? 'veena' : idx === 1 ? 'flute' : 'harmonium') as InstrumentId,
    color: TRACK_COLORS[idx % TRACK_COLORS.length],
    blocks: [],
    muted: false,
    solo: false,
    delayBeats: 0,
    volume: 1,
  };
}

function cloneTracksSnapshot(source: Track[]): Track[] {
  return source.map(track => ({ ...track, blocks: track.blocks.map(block => ({ ...block })) }));
}

const eventButtonStyle: CSSProperties = { padding: '5px 9px', borderRadius: 5, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontSize: '0.75rem', cursor: 'pointer' };
const eventLabelStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)', fontSize: '0.72rem' };
const eventInputStyle: CSSProperties = { maxWidth: 180, padding: '5px 7px', borderRadius: 5, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.76rem' };

export default function MusicBuilder({ settingsContainer }: { settingsContainer?: HTMLDivElement | null }) {
  const { settings } = useAppStore();
  const [tracks, setTracks] = useState<Track[]>([
    makeTrack('Track 1', 0),
    makeTrack('Track 2', 1),
    makeTrack('Track 3', 2),
  ]);
  // Undo/redo history is scoped to arrangement tracks and note edits.
  const tracksRef = useRef<Track[]>(tracks);
  const undoStackRef = useRef<Track[][]>([]);
  const redoStackRef = useRef<Track[][]>([]);
  const [historyCounts, setHistoryCounts] = useState({ undo: 0, redo: 0 });
  const syncHistoryCounts = useCallback(() => {
    setHistoryCounts({ undo: undoStackRef.current.length, redo: redoStackRef.current.length });
  }, []);
  const updateTracks = useCallback((updater: (current: Track[]) => Track[]) => {
    const current = tracksRef.current;
    const next = updater(current);
    if (next === current) return;
    undoStackRef.current.push(cloneTracksSnapshot(current));
    if (undoStackRef.current.length > 80) undoStackRef.current.shift();
    redoStackRef.current = [];
    tracksRef.current = next;
    setTracks(next);
    syncHistoryCounts();
  }, [syncHistoryCounts]);
  const undoTrackEdit = useCallback(() => {
    const previous = undoStackRef.current.pop();
    if (!previous) return;
    redoStackRef.current.push(cloneTracksSnapshot(tracksRef.current));
    const restored = cloneTracksSnapshot(previous);
    tracksRef.current = restored;
    setTracks(restored);
    setActiveTrack(index => Math.min(index, restored.length - 1));
    syncHistoryCounts();
  }, [syncHistoryCounts]);
  const redoTrackEdit = useCallback(() => {
    const next = redoStackRef.current.pop();
    if (!next) return;
    undoStackRef.current.push(cloneTracksSnapshot(tracksRef.current));
    const restored = cloneTracksSnapshot(next);
    tracksRef.current = restored;
    setTracks(restored);
    setActiveTrack(index => Math.min(index, restored.length - 1));
    syncHistoryCounts();
  }, [syncHistoryCounts]);
  const [activeTrack, setActiveTrack] = useState(0);
  const [ragaFilter, setRagaFilter] = useState<RagaFilter>('melakarta');
  const [selectedRagaId, setSelectedRagaId] = useState('melakarta:29');
  const [janyaRagas, setJanyaRagas] = useState<JanyaPracticeRaga[]>([]);
  const [janyaLoading, setJanyaLoading] = useState(true);
  const [janyaLoadError, setJanyaLoadError] = useState('');
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [playMode, setPlayMode] = useState<'together' | 'sequential'>('together');
  const [repeatCount, setRepeatCount] = useState(1);
  const [loopPlayback, setLoopPlayback] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [localAudioName, setLocalAudioName] = useState<string | null>(null);
  const localAudioRef = useRef<HTMLAudioElement | null>(null);
  const [localAudioUrl, setLocalAudioUrl] = useState<string | null>(null);
  const [audioClips, setAudioClips] = useState<ImportedAudioClip[]>([]);
  const [analysisClipId, setAnalysisClipId] = useState<string | null>(null);
  const [detectedSwaras, setDetectedSwaras] = useState<DetectedSvara[]>([]);
  const [analysisMessage, setAnalysisMessage] = useState('');
  const [convertingVideo, setConvertingVideo] = useState(false);
  const videoConversionRef = useRef<AbortController | null>(null);
  const audioClipSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const audioObjectUrlsRef = useRef<Set<string>>(new Set());
  const [showTimeline, setShowTimeline] = useState(true);
  const [pixelsPerBeat, setPixelsPerBeat] = useState(52);
  const [stemExportChoice, setStemExportChoice] = useState('');
  const [isExportingWav, setIsExportingWav] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const [dragNote, setDragNote] = useState<NoteBlock | null>(null);
  const [showPhraseImport, setShowPhraseImport] = useState(false);
  const [showSoundStudio, setShowSoundStudio] = useState(false);
  const [showEventEditor, setShowEventEditor] = useState(false);
  const [showNotationView, setShowNotationView] = useState(false);
  const [notationTala, setNotationTala] = useState('8');
  const [notationEduppu, setNotationEduppu] = useState(0);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventClipboard, setEventClipboard] = useState<NoteBlock | null>(null);
  const [snapSubdivision, setSnapSubdivision] = useState(0.25);
  const stopRef = useRef<(() => void) | null>(null);
  const transportEventsRef = useRef<ScheduledNote[]>([]);
  const transportAudioEventsRef = useRef<ScheduledAudioClip[]>([]);
  const transportDurationRef = useRef(0);
  const transportCycleDurationRef = useRef(0);
  const transportElapsedRef = useRef(0);
  const transportAnchorRef = useRef(0);
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const schedulerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [mode, setMode] = useState<'builder' | 'manodharma' | 'construction'>('builder');

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${import.meta.env.BASE_URL}data/janya_vakra_ragas_exercises_200.json`, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error(`Janya rāga catalogue could not be loaded (HTTP ${response.status}).`);
        return response.json() as Promise<unknown>;
      })
      .then(catalogue => {
        if (controller.signal.aborted) return;
        const reviewed = integrateJanyaBooklet(catalogue);
        setJanyaRagas(reviewed.ragas);
        setJanyaLoadError('');
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setJanyaLoadError(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        if (!controller.signal.aborted) setJanyaLoading(false);
      });
    return () => controller.abort();
  }, []);

  const availableRagas: RagaSelection[] = ragaFilter === 'melakarta'
    ? MELAKARTAS.map(raga => ({
      id: `melakarta:${raga.number}`, name: raga.name, number: raga.number, family: 'melakarta' as const,
    }))
    : janyaRagas
      .filter(raga => ragaFilter === 'janya' || raga.isVakra)
      .map(raga => ({
        id: `janya:${raga.id}`, name: raga.name, number: raga.parent, family: 'janya' as const, janya: raga,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  const selectedRaga = availableRagas.find(raga => raga.id === selectedRagaId)
    ?? availableRagas[0]
    ?? { id: 'melakarta:29', name: MELAKARTAS[28].name, number: 29, family: 'melakarta' as const };
  const canImportMelakartaPhrases = ragaFilter === 'melakarta' && selectedRaga.family === 'melakarta';

  useEffect(() => {
    if (availableRagas.length && !availableRagas.some(raga => raga.id === selectedRagaId)) {
      setSelectedRagaId(availableRagas[0].id);
    }
  }, [availableRagas, selectedRagaId]);

  // ── Shruti recording import state ─────────────────────────────────────────
  const [importedVocals, setImportedVocals] = useState<ImportedVocalTrack[]>([]);
  const [showImportBanner, setShowImportBanner] = useState(false);
  const [playingVocalId, setPlayingVocalId] = useState<string | null>(null);
  const [expandedVocalIdx, setExpandedVocalIdx] = useState<number | null>(null);
  const vocalAudioRef = useRef<HTMLAudioElement | null>(null);
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Listen for recordings shared from Shruti Trainer

useEffect(() => {
  const importRecording = (
    detail: Omit<ImportedVocalTrack, 'layers'> | null
  ) => {
    if (!detail || !detail.dataUrl) return

    const newTrack: ImportedVocalTrack = {
      ...detail,
      layers: [],
    }

    setImportedVocals(prev => [newTrack, ...prev])
    setShowImportBanner(true)
    setExpandedVocalIdx(0)

    if (bannerTimerRef.current) {
      clearTimeout(bannerTimerRef.current)
    }

    bannerTimerRef.current = setTimeout(() => {
      setShowImportBanner(false)
    }, 5000)
  }

  // Receive a recording saved before Music Builder mounted.
  const pending = consumePendingVocalImport()
  if (pending) {
    importRecording(pending)
  }

  // Continue supporting event-based imports.
  const handler = (e: Event) => {
    const detail = (
      e as CustomEvent<Omit<ImportedVocalTrack, 'layers'>>
    ).detail

    importRecording(detail)
  }

  window.addEventListener('bhava:importToMusicBuilder', handler)

  return () => {
    window.removeEventListener('bhava:importToMusicBuilder', handler)

    if (bannerTimerRef.current) {
      clearTimeout(bannerTimerRef.current)
    }
  }
}, [])


  // ── Add / remove instrument layer on a vocal track ────────────────────────
  const toggleLayer = useCallback((vocalIdx: number, instr: InstrumentId) => {
    setImportedVocals(prev => prev.map((v, i) => {
      if (i !== vocalIdx) return v;
      const has = v.layers.includes(instr);
      return { ...v, layers: has ? v.layers.filter(l => l !== instr) : [...v.layers, instr] };
    }));
  }, []);

  const deleteVocal = useCallback((idx: number) => {
    if (playingVocalId === importedVocals[idx]?.name) {
      vocalAudioRef.current?.pause();
      setPlayingVocalId(null);
    }
    setImportedVocals(prev => prev.filter((_, i) => i !== idx));
    setExpandedVocalIdx(null);
  }, [importedVocals, playingVocalId]);

  const playVocal = useCallback((v: ImportedVocalTrack) => {
    vocalAudioRef.current?.pause();
    const audio = new Audio(v.dataUrl);
    vocalAudioRef.current = audio;
    audio.play();
    setPlayingVocalId(v.name);
    audio.onended = () => setPlayingVocalId(null);
  }, []);

  const stopVocal = useCallback(() => {
    vocalAudioRef.current?.pause();
    setPlayingVocalId(null);
  }, []);

  // ── Rest of existing logic (unchanged) ───────────────────────────────────
  const RAGA_NOTES: NoteBlock[] = (() => {
    const semi = (s: number, label: string): NoteBlock => ({
      id: makeId(), label, semitone: s, duration: 0.5, source: 'raga',
    });
    if (selectedRaga?.janya) {
      return parseJanyaNotation(selectedRaga.janya.arohana, selectedRaga.janya.parent, 'swarasthana')
        .flatMap(item => {
          if (item.kind !== 'note') return [];
          const definition = SVARA_REGISTRY[item.token.svaraId];
          const variant = definition.variantIndex > 1 ? ['₁', '₂', '₃'][definition.variantIndex - 1] : '';
          const octave = item.token.octave > 0 ? '.' : item.token.octave < 0 ? ',' : '';
          return [semi(definition.canonicalSemitone + item.token.octave * 12, `${definition.shortName}${variant}${octave}`)];
        });
    }
    if (!selectedRaga || selectedRaga.family !== 'melakarta') return [];
    const melakarta = MELAKARTAS.find(raga => raga.number === selectedRaga.number) ?? MELAKARTAS[28];
    const r = melakarta.notes;
    return [
      semi(0, 'Sa'), semi(r.R, 'Re'), semi(r.G, 'Ga'), semi(r.M, 'Ma'),
      semi(7, 'Pa'), semi(r.D, 'Da'), semi(r.N, 'Ni'), semi(12, 'Sa.'),
      semi(r.R + 12, 'Re.'), semi(r.G + 12, 'Ga.'),
    ];
  })();

  const analyseImportedClip = useCallback((clip: ImportedAudioClip) => {
    setAnalysisClipId(clip.id);
    const detected = analyseAudioSwaras(clip.buffer, settings.tonicHz, RAGA_NOTES, clip.sourceStartSeconds, clip.durationSeconds);
    setDetectedSwaras(detected);
    setAnalysisMessage(detected.length ? `Detected ${detected.length} pitch segments in the first ${Math.min(MAX_ANALYSIS_SECONDS, clip.durationSeconds).toFixed(1)} seconds of the trimmed clip. These are estimates; gamakas, percussion and polyphonic audio can affect accuracy.` : 'No stable pitched segments detected. Try a clearer solo vocal or instrument recording.');
  }, [settings.tonicHz, RAGA_NOTES]);
  const addDetectedSwarasToTrack = useCallback(() => {
    if (!detectedSwaras.length) return;
    const secondsPerBeat = 60 / Math.max(30, settings.bpm);
    const clip = audioClips.find(item => item.id === analysisClipId);
    if (!clip) {
      setAnalysisMessage('The analysed clip was removed. Analyse another clip first.');
      return;
    }
    const blocks = detectedSwaras.map(note => ({
      id: makeId(), label: note.label, semitone: note.semitone,
      duration: Math.max(0.125, note.durationSeconds / secondsPerBeat),
      startBeat: clip.startBeat + note.timeSeconds / secondsPerBeat, source: 'audio-analysis', kind: 'note' as const,
    }));
    updateTracks(prev => prev.map((track, index) => index === activeTrack ? { ...track, blocks: [...track.blocks, ...blocks] } : track));
    setAnalysisMessage(`Added ${blocks.length} estimated svaras to ${tracks[activeTrack]?.name ?? 'the active track'}. Please review and correct them.`);
  }, [detectedSwaras, settings.bpm, updateTracks, activeTrack, tracks, audioClips, analysisClipId]);

  useEffect(() => {
    setAnalysisClipId(null);
    setDetectedSwaras([]);
    setAnalysisMessage('');
  }, [selectedRaga.id, settings.tonicHz, settings.bpm]);

  const trimAudioClip = useCallback((clipId: string, patch: { start?: number; duration?: number }) => {
    setAudioClips(previous => previous.map(clip => {
      if (clip.id !== clipId) return clip;
      const window = audioClipWindow(clip.buffer.duration, patch.start ?? clip.sourceStartSeconds, patch.duration ?? clip.durationSeconds);
      return { ...clip, sourceStartSeconds: window.start, durationSeconds: window.duration };
    }));
    setAnalysisClipId(null);
    setDetectedSwaras([]);
  }, []);

  const addBlock = useCallback((block: NoteBlock) => {
    updateTracks(prev => prev.map((track, index) => {
      if (index !== activeTrack) return track;
      const positioned = positionBlocks(track.blocks);
      const startBeat = positioned.reduce((end, note) => Math.max(end, note.startBeat + note.duration), 0);
      return { ...track, blocks: [...positioned, { ...block, id: makeId(), startBeat }] };
    }));
  }, [activeTrack, updateTracks]);

  const patchActiveEvent = useCallback((blockId: string, patch: Partial<NoteBlock>) => {
    updateTracks(current => current.map((track, index) => index !== activeTrack ? track : {
      ...track,
      blocks: positionBlocks(track.blocks).map(block => block.id === blockId ? { ...block, ...patch } : block),
    }));
  }, [activeTrack, updateTracks]);

  const addRestEvent = useCallback(() => {
    const track = tracksRef.current[activeTrack];
    if (!track) return;
    const positioned = positionBlocks(track.blocks);
    const startBeat = positioned.reduce((end, block) => Math.max(end, block.startBeat + block.duration), 0);
    const rest: NoteBlock = { id: makeId(), label: 'Rest', semitone: 0, duration: 1, source: 'event-editor', startBeat, kind: 'rest' };
    updateTracks(current => current.map((item, index) => index === activeTrack ? { ...item, blocks: [...positionBlocks(item.blocks), rest] } : item));
    setSelectedEventId(rest.id);
  }, [activeTrack, updateTracks]);

  const pasteEvent = useCallback(() => {
    if (!eventClipboard) return;
    const track = tracksRef.current[activeTrack];
    if (!track) return;
    const positioned = positionBlocks(track.blocks);
    const startBeat = positioned.reduce((end, block) => Math.max(end, block.startBeat + block.duration), 0);
    const copy = { ...eventClipboard, id: makeId(), startBeat };
    updateTracks(current => current.map((item, index) => index === activeTrack ? { ...item, blocks: [...positionBlocks(item.blocks), copy] } : item));
    setSelectedEventId(copy.id);
  }, [activeTrack, eventClipboard, updateTracks]);

  const removeBlock = useCallback((trackIdx: number, blockId: string) => {
    updateTracks(prev =>
      prev.map((t, i) =>
        i === trackIdx ? { ...t, blocks: t.blocks.filter(b => b.id !== blockId) } : t,
      ),
    );
  }, []);

  const clearTrack = useCallback((trackIdx: number) => {
    updateTracks(prev => prev.map((t, i) => (i === trackIdx ? { ...t, blocks: [] } : t)));
  }, []);

  const addTrack = useCallback(() => {
    if (tracksRef.current.length >= 16) return;
    updateTracks(prev => [...prev, makeTrack(`Track ${prev.length + 1}`, prev.length)]);
  }, [tracks.length]);

  const renameTrack = useCallback((trackId: string, name: string) => {
    updateTracks(current => current.map(track => track.id === trackId ? { ...track, name } : track));
  }, [updateTracks]);

  const duplicateTrack = useCallback((trackIndex: number) => {
    const current = tracksRef.current;
    if (current.length >= 16 || !current[trackIndex]) return;
    const original = current[trackIndex];
    const copy: Track = {
      ...original, id: makeId(), name: `${original.name} copy`,
      blocks: original.blocks.map(block => ({ ...block, id: makeId() })),
    };
    const next = [...current];
    next.splice(trackIndex + 1, 0, copy);
    updateTracks(() => next);
    setActiveTrack(trackIndex + 1);
  }, [updateTracks]);

  const moveTrack = useCallback((trackIndex: number, direction: -1 | 1) => {
    const current = tracksRef.current;
    const destination = trackIndex + direction;
    if (destination < 0 || destination >= current.length) return;
    const activeId = current[activeTrack]?.id;
    const next = [...current];
    [next[trackIndex], next[destination]] = [next[destination], next[trackIndex]];
    updateTracks(() => next);
    setActiveTrack(Math.max(0, next.findIndex(track => track.id === activeId)));
  }, [activeTrack, updateTracks]);

  const deleteTrack = useCallback((trackIndex: number) => {
    const current = tracksRef.current;
    if (current.length <= 1 || !current[trackIndex]) return;
    const activeId = current[activeTrack]?.id;
    const next = current.filter((_, index) => index !== trackIndex);
    updateTracks(() => next);
    const keptActiveIndex = next.findIndex(track => track.id === activeId);
    setActiveTrack(keptActiveIndex >= 0 ? keptActiveIndex : Math.min(trackIndex, next.length - 1));
  }, [activeTrack, updateTracks]);

  const clearTransportTimers = useCallback(() => {
    if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    if (schedulerTimerRef.current) clearInterval(schedulerTimerRef.current);
    finishTimerRef.current = null;
    progressTimerRef.current = null;
    schedulerTimerRef.current = null;
  }, []);

  const stopAudioClipSources = useCallback(() => {
    audioClipSourcesRef.current.forEach(source => {
      try { source.stop(); } catch { /* source may already have ended */ }
    });
    audioClipSourcesRef.current.clear();
  }, []);

  const stopPlayback = useCallback(() => {
    clearTransportTimers();
    stopAllSynthNotes();
    stopAudioClipSources();
    stopRef.current = null;
    transportElapsedRef.current = 0;
    setPlaying(false);
    setPaused(false);
    setPlaybackProgress(0);
  }, [clearTransportTimers, stopAudioClipSources]);

  // Schedule note events against the Web Audio clock and schedule decoded audio clips
  // on that same clock, so recordings and synthesized tracks stay aligned.
  const startTransportAt = useCallback((offsetSeconds: number) => {
    const events = transportEventsRef.current;
    const audioEvents = transportAudioEventsRef.current;
    const totalDuration = transportDurationRef.current;
    if ((!events.length && !audioEvents.length) || totalDuration <= 0 || offsetSeconds >= totalDuration) {
      clearTransportTimers();
      stopAllSynthNotes();
      stopAudioClipSources();
      setPlaying(false);
      setPaused(false);
      setPlaybackProgress(100);
      return;
    }

    clearTransportTimers();
    stopAllSynthNotes();
    stopAudioClipSources();
    unlockAudio();
    const ctx = getAudioContext();
    const startAt = ctx.currentTime + 0.08;
    transportAnchorRef.current = startAt;
    transportElapsedRef.current = offsetSeconds;

    let nextEventIndex = events.findIndex(event => event.at + event.dur > offsetSeconds + 0.0001);
    if (nextEventIndex < 0) nextEventIndex = events.length;
    const scheduleLookAhead = () => {
      const elapsed = offsetSeconds + Math.max(0, ctx.currentTime - startAt);
      const horizon = elapsed + 0.18;
      while (nextEventIndex < events.length && events[nextEventIndex].at <= horizon) {
        const event = events[nextEventIndex++];
        if (event.at + event.dur <= elapsed - 0.025) continue;
        const when = startAt + Math.max(0, event.at - offsetSeconds);
        const lateOffset = Math.max(0, elapsed - event.at);
        synthNote(event.hz, Math.max(0.08, event.dur - lateOffset), event.instr, settings.volume * event.trackVolume, when);
      }
    };
    scheduleLookAhead();
    schedulerTimerRef.current = setInterval(scheduleLookAhead, 25);

    // Decoded file clips are few in number, so schedule each directly. Resuming
    // part-way through a clip advances into its AudioBuffer by the elapsed offset.
    audioEvents.forEach(event => {
      if (event.at + event.duration <= offsetSeconds) return;
      const elapsedInClip = Math.max(0, offsetSeconds - event.at);
      const sourceOffset = Math.max(0, event.sourceStartSeconds ?? 0) + elapsedInClip;
      const remaining = event.duration - elapsedInClip;
      if (remaining <= 0.01) return;
      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      source.buffer = event.buffer;
      gain.gain.value = settings.volume * event.volume;
      source.connect(gain);
      gain.connect(ctx.destination);
      audioClipSourcesRef.current.add(source);
      source.addEventListener('ended', () => audioClipSourcesRef.current.delete(source), { once: true });
      const when = startAt + Math.max(0, event.at - offsetSeconds);
      try { source.start(when, sourceOffset, remaining); }
      catch { audioClipSourcesRef.current.delete(source); }
    });

    setPlaybackProgress((offsetSeconds / totalDuration) * 100);
    setPaused(false);
    setPlaying(true);

    progressTimerRef.current = setInterval(() => {
      const elapsed = Math.min(totalDuration, offsetSeconds + Math.max(0, ctx.currentTime - startAt));
      setPlaybackProgress((elapsed / totalDuration) * 100);
    }, 100);

    finishTimerRef.current = setTimeout(() => {
      clearTransportTimers();
      stopAudioClipSources();
      setPlaying(false);
      setPaused(false);
      setPlaybackProgress(100);
      transportElapsedRef.current = 0;
      stopRef.current = null;
    }, Math.max(0, (totalDuration - offsetSeconds) * 1000) + 180);

    stopRef.current = () => {
      clearTransportTimers();
      stopAllSynthNotes();
      stopAudioClipSources();
      setPlaying(false);
    };
  }, [clearTransportTimers, settings.volume, stopAudioClipSources]);

  const playArrangement = useCallback((selectedOnly = false) => {
    stopPlayback();
    const repetitions = Math.max(1, Math.min(32, loopPlayback ? 32 : repeatCount));
    const schedule = buildTimelineSchedule(
      tracks, audioClips, settings.bpm, settings.tonicHz, playMode, repetitions,
      selectedOnly ? tracks[activeTrack]?.id : undefined,
    );
    if (!schedule.notes.length && !schedule.audioClips.length) {
      setPlaying(false);
      setPaused(false);
      setExportMessage('Add notes or import an audio clip before playback.');
      return;
    }
    transportEventsRef.current = schedule.notes;
    transportAudioEventsRef.current = schedule.audioClips;
    transportDurationRef.current = schedule.totalDuration;
    transportCycleDurationRef.current = schedule.arrangementDuration;
    transportElapsedRef.current = 0;
    startTransportAt(0);
  }, [tracks, audioClips, activeTrack, settings.bpm, settings.tonicHz, playMode, repeatCount, loopPlayback, stopPlayback, startTransportAt]);

  const playAll = useCallback(() => {
    if (playing) {
      stopPlayback();
      return;
    }
    if (paused) {
      startTransportAt(transportElapsedRef.current);
      return;
    }
    playArrangement(false);
  }, [playing, paused, playArrangement, startTransportAt, stopPlayback]);

  const playSelectedTrack = useCallback(() => {
    if (playing) {
      stopPlayback();
      return;
    }
    if (paused) {
      startTransportAt(transportElapsedRef.current);
      return;
    }
    playArrangement(true);
  }, [playing, paused, playArrangement, startTransportAt, stopPlayback]);

  const pausePlayback = useCallback(() => {
    if (!playing) return;
    const ctx = getAudioContext();
    const elapsed = Math.min(
      transportDurationRef.current,
      transportElapsedRef.current + Math.max(0, ctx.currentTime - transportAnchorRef.current),
    );
    transportElapsedRef.current = elapsed;
    clearTransportTimers();
    stopAllSynthNotes();
    stopAudioClipSources();
    setPlaying(false);
    setPaused(true);
    setPlaybackProgress(transportDurationRef.current > 0 ? (elapsed / transportDurationRef.current) * 100 : 0);
    stopRef.current = null;
  }, [playing, clearTransportTimers, stopAudioClipSources]);

  const importLocalAudio = useCallback(async (file: File, requestedStartBeat: number): Promise<number | null> => {
    if (file.size > 100 * 1024 * 1024) {
      setExportMessage('This browser build limits each imported audio file to 100 MB to reduce memory pressure.');
      return null;
    }
    const url = URL.createObjectURL(file);
    audioObjectUrlsRef.current.add(url);
    try {
      const ctx = getAudioContext();
      const bytes = await file.arrayBuffer();
      const buffer = await ctx.decodeAudioData(bytes.slice(0));
      const startBeat = requestedStartBeat;
      const clip: ImportedAudioClip = {
        id: makeId(), name: file.name, buffer, durationSeconds: buffer.duration,
        startBeat, volume: 1, muted: false,
      };
      setAudioClips(previous => [...previous, clip]);
      setLocalAudioUrl(url);
      setLocalAudioName(file.name);
      if (localAudioRef.current) {
        localAudioRef.current.pause();
        localAudioRef.current.src = url;
        localAudioRef.current.load();
      } else {
        localAudioRef.current = new Audio(url);
      }
      setExportMessage(`Imported “${file.name}” as a synchronized audio clip. Move it in the timeline to change its start position.`);
      return buffer.duration;
    } catch (error) {
      URL.revokeObjectURL(url);
      audioObjectUrlsRef.current.delete(url);
      setExportMessage(`Could not decode “${file.name}”. Try a WAV, MP3, or OGG file supported by this browser.`);
      console.error('Audio import/decode failed', error);
      return null;
    }
  }, []);

  const importMultipleAudio = useCallback(async (files: FileList | File[]) => {
    const selected = Array.from(files);
    if (!selected.length) return;
    let nextBeat = Math.ceil(projectEndBeat(tracksRef.current, audioClips, settings.bpm) * 4) / 4;
    let imported = 0;
    const failed: string[] = [];
    for (const file of selected) {
      const duration = await importLocalAudio(file, nextBeat);
      if (duration === null) {
        failed.push(file.name);
      } else {
        nextBeat += duration / (60 / Math.max(30, settings.bpm));
        imported += 1;
      }
    }
    setShowTimeline(true);
    setExportMessage(`Imported ${imported} of ${selected.length} audio files in sequence.${failed.length ? ` Failed: ${failed.join(', ')}. Each file must be browser-decodable and at most 100 MB.` : ''}`);
  }, [audioClips, importLocalAudio, settings.bpm]);

  const convertVideoToAudio = useCallback(async (file?: File) => {
    if (!file || videoConversionRef.current) return;
    if (file.size > 500 * 1024 * 1024) {
      setExportMessage('This browser build limits each video to 500 MB. Choose a smaller file.');
      return;
    }
    const controller = new AbortController();
    videoConversionRef.current = controller;
    setConvertingVideo(true);
    setExportMessage(`Extracting audio from “${file.name}”…`);
    try {
      const context = getAudioContext();
      await unlockAudio();
      const blob = await extractVideoAudio(file, context, controller.signal, setExportMessage);
      controller.signal.throwIfAborted();
      const buffer = await context.decodeAudioData(await blob.arrayBuffer());
      controller.signal.throwIfAborted();
      const clip: ImportedAudioClip = {
        id: makeId(), name: `${file.name.replace(/\.[^.]+$/, '')} (audio)`, buffer, durationSeconds: buffer.duration,
        startBeat: 0, volume: 1, muted: false,
      };
      setAudioClips(previous => [...previous, { ...clip, startBeat: Math.ceil(projectEndBeat(tracksRef.current, previous, settings.bpm) * 4) / 4 }]);
      setShowTimeline(true);
      setExportMessage(`Extracted ${buffer.duration.toFixed(1)} seconds from “${file.name}” and added it to the timeline.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown video conversion error.';
      setExportMessage(controller.signal.aborted ? 'Video conversion cancelled.' : `Could not extract audio: ${message}`);
      if (!controller.signal.aborted) console.error('Video-to-audio extraction failed', error);
    } finally {
      videoConversionRef.current = null;
      setConvertingVideo(false);
    }
  }, [settings.bpm]);

  const addGeneratedAudioClip = useCallback((buffer: AudioBuffer, name: string, startBeat: number, recipe: GeneratedSoundRecipe) => {
    const clip: ImportedAudioClip = {
      id: makeId(), name: `✦ ${name}`, buffer, durationSeconds: buffer.duration,
      startBeat: Math.max(0, startBeat), volume: 1, muted: false, generatedRecipe: recipe,
    };
    setAudioClips(previous => [...previous, clip]);
    setShowTimeline(true);
  }, []);

  // Regenerate procedural percussion at the current tempo so its hits remain beat-aligned.
  useEffect(() => {
    setAudioClips(current => {
      let changed = false;
      const ctx = getAudioContext();
      const next = current.map(clip => {
        const recipe = clip.generatedRecipe;
        const metadata = recipe ? SOUND_PRESETS.find(item => item.id === recipe.preset) : undefined;
        if (!recipe || !metadata?.isPercussion || Math.abs(recipe.generatedAtBpm - settings.bpm) < 0.001) return clip;
        const options: SoundGenerationOptions = {
          bpm: settings.bpm, beats: recipe.beats, rhythmStyle: recipe.rhythmStyle,
          durationSeconds: recipe.durationSeconds, intensity: recipe.intensity, seed: recipe.seed,
        };
        const buffer = createSoundBuffer(ctx, recipe.preset, options);
        changed = true;
        const ratio = buffer.duration / clip.buffer.duration;
        const window = audioClipWindow(buffer.duration, (clip.sourceStartSeconds ?? 0) * ratio, clip.durationSeconds * ratio);
        return { ...clip, buffer, sourceStartSeconds: window.start, durationSeconds: window.duration, generatedRecipe: { ...recipe, generatedAtBpm: settings.bpm } };
      });
      return changed ? next : current;
    });
  }, [settings.bpm]);

  useEffect(() => () => {
    videoConversionRef.current?.abort();
    stopRef.current?.();
    clearTransportTimers();
    stopAllSynthNotes();
    audioClipSourcesRef.current.forEach(source => { try { source.stop(); } catch { /* already ended */ } });
    audioClipSourcesRef.current.clear();
    localAudioRef.current?.pause();
    audioObjectUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    audioObjectUrlsRef.current.clear();
  }, [clearTransportTimers]);

  const generatePhrase = useCallback(() => {
    const notes = RAGA_NOTES.slice(0, 8);
    updateTracks(prev => prev.map((track, index) => {
      if (index !== activeTrack) return track;
      const positioned = positionBlocks(track.blocks);
      let beat = positioned.reduce((end, note) => Math.max(end, note.startBeat + note.duration), 0);
      const phrase = Array.from({ length: 8 }, () => {
        const source = notes[Math.floor(Math.random() * notes.length)];
        const next = { ...source, id: makeId(), startBeat: beat };
        beat += source.duration;
        return next;
      });
      return { ...track, blocks: [...positioned, ...phrase] };
    }));
  }, [RAGA_NOTES, activeTrack, updateTracks]);

  const importMusicalPhrase = useCallback((
    phraseNotes: Array<{ label: string; semitone: number; duration: number }>,
    _phraseName: string,
    destinationTrackId?: string,
    placement: 'append' | 'replace' = 'append',
  ) => {
    if (!phraseNotes.length) return;
    const targetTrackId = destinationTrackId ?? tracksRef.current[activeTrack]?.id;
    if (!targetTrackId) return;
    const targetTrack = tracksRef.current.find(track => track.id === targetTrackId);
    if (!targetTrack) return;
    const start = placement === 'replace' ? 0 : blocksEndBeat(targetTrack.blocks);
    let beat = start;
    const blocks: NoteBlock[] = phraseNotes.map(note => {
      const block = { id: makeId(), label: note.label, semitone: note.semitone, duration: note.duration, source: 'experimental-phrase', startBeat: beat };
      beat += note.duration;
      return block;
    });
    const targetIndex = tracksRef.current.findIndex(track => track.id === targetTrackId);
    updateTracks(current => current.map(track => track.id !== targetTrackId ? track : {
      ...track, blocks: placement === 'replace' ? blocks : [...positionBlocks(track.blocks), ...blocks],
    }));
    setActiveTrack(targetIndex);
    setShowPhraseImport(false);
  }, [activeTrack, updateTracks]);

  const moveTimelineNote = useCallback((sourceTrackId: string, blockId: string, targetTrackId: string, targetBeat: number) => {
    const snappedBeat = Math.max(0, Math.round(targetBeat * 4) / 4);
    updateTracks(current => {
      const sourceTrack = current.find(track => track.id === sourceTrackId);
      const sourceNote = sourceTrack && positionBlocks(sourceTrack.blocks).find(block => block.id === blockId);
      if (!sourceTrack || !sourceNote || !current.some(track => track.id === targetTrackId)) return current;
      if (sourceTrackId === targetTrackId) {
        return current.map(track => track.id !== sourceTrackId ? track : {
          ...track,
          blocks: positionBlocks(track.blocks).map(block => block.id === blockId ? { ...block, startBeat: snappedBeat } : block),
        });
      }
      return current.map(track => {
        if (track.id === sourceTrackId) return { ...track, blocks: positionBlocks(track.blocks).filter(block => block.id !== blockId) };
        if (track.id === targetTrackId) return { ...track, blocks: [...positionBlocks(track.blocks), { ...sourceNote, startBeat: snappedBeat }] };
        return track;
      });
    });
  }, [updateTracks]);

  const moveAudioClip = useCallback((clipId: string, targetBeat: number) => {
    const snappedBeat = Math.max(0, Math.round(targetBeat * 4) / 4);
    setAudioClips(previous => previous.map(clip => clip.id === clipId ? { ...clip, startBeat: snappedBeat } : clip));
  }, []);

  const timelineEndBeat = Math.max(16, Math.ceil((projectEndBeat(tracks, audioClips, settings.bpm) + 4) / 4) * 4);
  const timelinePlayheadBeat = playMode === 'together' && (playing || paused) && transportCycleDurationRef.current > 0
    ? ((playbackProgress / 100 * transportDurationRef.current) % transportCycleDurationRef.current) / (60 / Math.max(30, settings.bpm))
    : null;
  const melodicInstruments = INSTRUMENTS.filter(i => i.category === 'melodic');
  const stemChoiceIsValid = tracks.some(track => track.id === stemExportChoice) || audioClips.some(clip => `audio:${clip.id}` === stemExportChoice);
  const stemChoice = stemChoiceIsValid ? stemExportChoice : (tracks[0]?.id || (audioClips[0] ? `audio:${audioClips[0].id}` : ''));

  const exportWav = useCallback(async (kind: 'mix' | 'stem') => {
    if (isExportingWav) return;
    setIsExportingWav(true);
    setExportMessage(kind === 'mix' ? 'Rendering the complete WAV mix…' : 'Rendering the selected WAV stem…');
    try {
      await new Promise(resolve => window.setTimeout(resolve, 0));
      const repetitions = Math.max(1, Math.min(32, loopPlayback ? 32 : repeatCount));
      const schedule = buildTimelineSchedule(tracks, audioClips, settings.bpm, settings.tonicHz, playMode, repetitions);
      if ((!schedule.notes.length && !schedule.audioClips.length) || schedule.totalDuration <= 0) {
        setExportMessage('Nothing to export. Add notes or import an audio clip first.');
        return;
      }
      // A conservative browser-memory guard: current PCM/WAV rendering is capped at 5 minutes.
      if (schedule.totalDuration > 300) {
        setExportMessage('This browser renderer currently supports arrangements up to 5 minutes. Shorten the arrangement or reduce repetitions, then export again.');
        return;
      }
      const isAudioStem = kind === 'stem' && stemChoice.startsWith('audio:');
      const audioStemId = isAudioStem ? stemChoice.slice('audio:'.length) : '';
      const trackStemId = kind === 'stem' && !isAudioStem ? stemChoice : '';
      const noteEvents = kind === 'mix' ? schedule.notes : schedule.notes.filter(event => event.trackId === trackStemId);
      const audioEvents = kind === 'mix' ? schedule.audioClips : schedule.audioClips.filter(event => event.clipId === audioStemId);
      if (kind === 'stem' && !noteEvents.length && !audioEvents.length) {
        setExportMessage('The selected stem is muted, excluded by solo settings, or contains no events. Enable it in the mixer or choose another stem.');
        return;
      }
      if (noteEvents.length > 20000) {
        setExportMessage('This arrangement contains more than 20,000 note events. Reduce repetitions or export a shorter section to avoid exhausting browser memory.');
        return;
      }
      const sampleRate = 44100;
      const frameCount = Math.max(1, Math.ceil(schedule.totalDuration * sampleRate));
      const OfflineContext = window.OfflineAudioContext || (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext }).webkitOfflineAudioContext;
      if (!OfflineContext) {
        setExportMessage('Offline WAV rendering is not supported by this browser. Try the latest Chrome or Edge.');
        return;
      }
      const offline = new OfflineContext(2, frameCount, sampleRate);
      // Shared dynamics compressor reduces overload when many instruments play together.
      const master = offline.createDynamicsCompressor();
      master.threshold.setValueAtTime(-2, 0);
      master.knee.setValueAtTime(0, 0);
      master.ratio.setValueAtTime(20, 0);
      master.attack.setValueAtTime(0.003, 0);
      master.release.setValueAtTime(0.15, 0);
      master.connect(offline.destination);
      for (const event of noteEvents) {
        synthNote(event.hz, event.dur, event.instr, settings.volume * event.trackVolume, event.at, offline, master);
      }
      for (const event of audioEvents) {
        const source = offline.createBufferSource();
        const gain = offline.createGain();
        source.buffer = event.buffer;
        gain.gain.setValueAtTime(Math.max(0, Math.min(1, settings.volume * event.volume)), event.at);
        source.connect(gain);
        gain.connect(master);
        source.start(event.at, event.sourceStartSeconds ?? 0, event.duration);
      }
      const rendered = await offline.startRendering();
      const blob = audioBufferToWav(rendered);
      const safe = (value: string) => value.normalize('NFKD').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64) || 'track';
      const filename = kind === 'mix'
        ? 'naada-vidya-mix.wav'
        : isAudioStem
          ? `naada-vidya-stem-${safe(audioClips.find(clip => clip.id === audioStemId)?.name ?? 'audio')}.wav`
          : `naada-vidya-stem-${safe(tracks.find(track => track.id === trackStemId)?.name ?? 'track')}.wav`;
      downloadBlob(blob, filename);
      setExportMessage(`Finished rendering ${filename} (${Math.round(schedule.totalDuration)} seconds, 44.1 kHz, 16-bit PCM).`);
    } catch (error) {
      console.error('WAV export failed', error);
      setExportMessage('WAV export failed. Try a shorter arrangement or fewer repetitions; long offline renders can exceed browser memory.');
    } finally {
      setIsExportingWav(false);
    }
  }, [isExportingWav, loopPlayback, repeatCount, tracks, audioClips, settings.bpm, settings.tonicHz, settings.volume, playMode, stemChoice]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="music-builder" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {settingsContainer && createPortal(
        <div className="music-builder-settings">
      <h3 className="builder-settings-heading">Composition & practice</h3>

      {/* ── Toolbar ── */}
      <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-2)', maxWidth: '100%' }}>
          <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }} htmlFor="builder-raga-filter">Rāga type:</label>
          <select id="builder-raga-filter" value={ragaFilter} onChange={e => { setRagaFilter(e.target.value as RagaFilter); setShowPhraseImport(false); }}
            style={{ maxWidth: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '4px 8px', fontSize: '0.78rem', color: 'var(--text)' }}>
            <option value="melakarta">Melakarta</option>
            <option value="janya">Janya (reference-reviewed)</option>
            <option value="vakra">Vakra (reference-reviewed)</option>
          </select>
          <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }} htmlFor="builder-raga-select">Rāga:</label>
          <select id="builder-raga-select" value={selectedRaga.id} onChange={e => setSelectedRagaId(e.target.value)}
            style={{ maxWidth: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '4px 8px', fontSize: '0.78rem', color: 'var(--text)' }}>
            {availableRagas.map(raga => <option key={raga.id} value={raga.id}>
              {raga.family === 'melakarta' ? `${raga.number}. ` : `${raga.janya?.isVakra ? 'Vakra · ' : ''}Mēḷa ${raga.number} · `}
              {raga.name}
            </option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <button onClick={playAll} style={{ padding: '6px 18px', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: '0.82rem', background: playing ? 'rgba(248,113,113,0.15)' : 'var(--accent-dim)', border: `1px solid ${playing ? 'var(--red)' : 'var(--accent)'}`, color: playing ? 'var(--red)' : 'var(--accent)', cursor: 'pointer' }}>
            {playing ? '⏹ Stop' : paused ? '▶ Resume' : '▶ Play All'}
          </button>
          <button onClick={generatePhrase} style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer' }}>🎲 Random Phrase</button>
          <button disabled={!canImportMelakartaPhrases} title={!canImportMelakartaPhrases ? 'Phrase candidates are currently indexed for Melakarta rāgas, not Janya scales.' : undefined} onClick={() => setShowPhraseImport(!showPhraseImport)} style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', background: showPhraseImport ? 'rgba(45,212,191,0.12)' : 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)', cursor: canImportMelakartaPhrases ? 'pointer' : 'not-allowed', opacity: canImportMelakartaPhrases ? 1 : 0.55 }}>🎼 {canImportMelakartaPhrases ? 'Import Musical Phrases' : 'Phrase Import (Melakarta only)'}</button>
          <button onClick={() => setShowEventEditor(value => !value)} style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', background: showEventEditor ? 'rgba(192,132,252,0.12)' : 'transparent', border: '1px solid #c084fc', color: '#c084fc', cursor: 'pointer' }}>✎ Advanced Event Editor</button>
          <button onClick={() => setShowNotationView(value => !value)} style={{ ...eventButtonStyle, color: 'var(--accent)' }}>♫ Svara Notation + Tāḷa</button>
          <button onClick={() => setShowSoundStudio(value => !value)} style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', background: showSoundStudio ? 'rgba(45,212,191,0.12)' : 'transparent', border: '1px solid #2dd4bf', color: '#2dd4bf', cursor: 'pointer' }}>🎛 Sound & Rhythm Studio</button>
          <button onClick={addTrack} disabled={tracks.length >= 16} style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', background: 'transparent', border: '1px solid var(--border)', color: tracks.length >= 16 ? 'var(--text-faint)' : 'var(--text-muted)', cursor: tracks.length >= 16 ? 'not-allowed' : 'pointer' }}>+ Add Track</button>
          <button onClick={undoTrackEdit} disabled={historyCounts.undo === 0} title="Undo last track or note edit" style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', background: 'transparent', border: '1px solid var(--border)', color: historyCounts.undo ? 'var(--text)' : 'var(--text-faint)', cursor: historyCounts.undo ? 'pointer' : 'not-allowed' }}>↶ Undo</button>
          <button onClick={redoTrackEdit} disabled={historyCounts.redo === 0} title="Redo last undone edit" style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', background: 'transparent', border: '1px solid var(--border)', color: historyCounts.redo ? 'var(--text)' : 'var(--text-faint)', cursor: historyCounts.redo ? 'pointer' : 'not-allowed' }}>↷ Redo</button>
          <button onClick={() => setMode('construction')} style={{ ...eventButtonStyle, color: 'var(--accent)' }}>Gāna Construction Lab</button>
          <button onClick={() => setMode('manodharma')} style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', background: mode === 'manodharma' ? 'rgba(192,132,252,0.12)' : 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)', cursor: 'pointer' }}>🎼 Manodharma Practice & Learning</button>
        </div>
      </div>
      {ragaFilter !== 'melakarta' && (
        <div role={janyaLoadError ? 'alert' : 'status'} style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', color: janyaLoadError ? 'var(--red)' : 'var(--text-muted)', fontSize: '0.75rem', lineHeight: 1.5 }}>
          {janyaLoading
            ? 'Loading reference-reviewed Janya and Vakra rāgas…'
            : janyaLoadError
              ? `Could not load Janya rāgas: ${janyaLoadError}`
              : availableRagas.length === 0
                ? 'No reference-reviewed rāgas are available in this category.'
                : `${availableRagas.length} locally reference-reviewed ${ragaFilter === 'vakra' ? 'Vakra' : 'Janya'} rāgas. Scale playback follows the listed svaras; gamakas and characteristic prayōgas require separate musical guidance.`}
        </div>
      )}

      {/* ── Arrangement controls ── */}
      <h3 className="builder-settings-heading">Playback & export</h3>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Playback
          <select value={playMode} onChange={e => setPlayMode(e.target.value as 'together' | 'sequential')} style={{ marginLeft: 6, background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 4, padding: 4 }}>
            <option value="together">Tracks together</option>
            <option value="sequential">Tracks sequentially</option>
          </select>
        </label>
        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Repetitions
          <input type="number" min={1} max={32} value={repeatCount} onChange={e => setRepeatCount(Math.max(1, Math.min(32, Number(e.target.value) || 1)))} style={{ width: 54, marginLeft: 6, background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 4, padding: 4 }} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <input type="checkbox" checked={loopPlayback} onChange={e => setLoopPlayback(e.target.checked)} /> Loop (up to 32 cycles)
        </label>
        <button onClick={playSelectedTrack} style={{ padding: '5px 10px', borderRadius: 5, border: '1px solid var(--border)', color: 'var(--text)', background: 'var(--surface)', cursor: 'pointer', fontSize: '0.75rem' }}>▶ Play Active Track</button>
        <button onClick={() => setShowTimeline(value => !value)} style={{ padding: '5px 10px', borderRadius: 5, border: '1px solid var(--accent)', color: 'var(--accent)', background: 'transparent', cursor: 'pointer', fontSize: '0.75rem' }}>{showTimeline ? 'Hide Timeline' : 'Show Timeline'}</button>
        <button onClick={() => void exportWav('mix')} disabled={isExportingWav} style={{ padding: '5px 10px', borderRadius: 5, border: '1px solid var(--accent)', color: isExportingWav ? 'var(--text-faint)' : 'var(--accent)', background: 'var(--accent-dim)', cursor: isExportingWav ? 'wait' : 'pointer', fontSize: '0.75rem' }}>{isExportingWav ? 'Rendering WAV…' : 'Export WAV Mix'}</button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: 'var(--text-muted)' }}>Stem
          <select value={stemChoice} onChange={e => setStemExportChoice(e.target.value)} style={{ maxWidth: 165, minWidth: 100, background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 4, padding: 4 }}>
            {tracks.map(track => <option key={track.id} value={track.id}>{track.name}</option>)}
            {audioClips.map(clip => <option key={`audio:${clip.id}`} value={`audio:${clip.id}`}>Audio: {clip.name}</option>)}
          </select>
        </label>
        <button onClick={() => void exportWav('stem')} disabled={isExportingWav || !stemChoice} style={{ padding: '5px 10px', borderRadius: 5, border: '1px solid var(--border)', color: isExportingWav ? 'var(--text-faint)' : 'var(--text)', background: 'var(--surface)', cursor: isExportingWav ? 'wait' : 'pointer', fontSize: '0.75rem' }}>Export Selected Stem WAV</button>
        <button onClick={pausePlayback} disabled={!playing} style={{ padding: '5px 10px', borderRadius: 5, border: '1px solid var(--border)', color: playing ? 'var(--text)' : 'var(--text-faint)', background: 'var(--surface)', cursor: playing ? 'pointer' : 'not-allowed', fontSize: '0.75rem' }}>⏸ Pause</button>
        {paused && <button onClick={() => startTransportAt(transportElapsedRef.current)} style={{ padding: '5px 10px', borderRadius: 5, border: '1px solid var(--accent)', color: 'var(--accent)', background: 'var(--accent-dim)', cursor: 'pointer', fontSize: '0.75rem' }}>▶ Resume</button>}
        <button onClick={stopPlayback} disabled={!playing && !paused} style={{ padding: '5px 10px', borderRadius: 5, border: '1px solid var(--border)', color: playing || paused ? 'var(--red)' : 'var(--text-faint)', background: 'var(--surface)', cursor: playing || paused ? 'pointer' : 'not-allowed', fontSize: '0.75rem' }}>⏹ Stop</button>
        <div style={{ minWidth: 100, flex: 1, height: 5, background: 'var(--border)', borderRadius: 9, overflow: 'hidden' }} title={`Playback progress ${Math.round(playbackProgress)}%`}>
          <div style={{ width: `${playbackProgress}%`, height: '100%', background: 'var(--accent)', transition: 'width 100ms linear' }} />
        </div>
        <label style={{ padding: '5px 9px', borderRadius: 5, border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.72rem' }}>
          Import Audio Files (multiple)
          <input type="file" multiple accept="audio/*,.wav,.mp3,.m4a,.ogg,.flac,.aac" style={{ display: 'none' }} onChange={e => { if (e.target.files?.length) void importMultipleAudio(e.target.files); e.currentTarget.value = ''; }} />
        </label>
        <label style={{ padding: '5px 9px', border: '1px solid var(--accent)', borderRadius: 5, color: 'var(--accent)', cursor: 'pointer', fontSize: '0.72rem' }}>
          Convert Video to Audio
          <input type="file" disabled={convertingVideo} accept="video/*,.mp4,.webm,.mov,.m4v,.mkv" style={{ display: 'none' }} onChange={e => { const file = e.currentTarget.files?.[0]; if (file) void convertVideoToAudio(file); e.currentTarget.value = ''; }} />
        </label>
        {convertingVideo && <button onClick={() => videoConversionRef.current?.abort()} style={eventButtonStyle}>Cancel Video Conversion</button>}
        {localAudioUrl && <button onClick={() => { if (localAudioRef.current?.paused) void localAudioRef.current.play(); else localAudioRef.current?.pause(); }} style={{ padding: '5px 9px', borderRadius: 5, border: '1px solid var(--accent)', color: 'var(--accent)', background: 'transparent', cursor: 'pointer', fontSize: '0.72rem' }}>▶ / ⏸ {localAudioName}</button>}
      </div>
      {exportMessage && <div role="status" style={{ padding: '6px 16px', fontSize: '0.72rem', color: 'var(--text-muted)', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>{exportMessage}</div>}
        </div>,
        settingsContainer
      )}

      {/* ── Import notification banner ── */}
      {showImportBanner && (
        <div style={{ padding: '10px 20px', background: 'rgba(45,212,191,0.1)', borderBottom: '1px solid rgba(45,212,191,0.35)', display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.82rem', color: '#2dd4bf' }}>
          <span>🎙</span>
          <span>New Shruti recording added to <strong>Vocal Tracks</strong> below. Click <strong>Add Instruments</strong> to layer instruments on it.</span>
          <button onClick={() => setShowImportBanner(false)} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#2dd4bf', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
        </div>
      )}

      {mode === 'construction' ? (
        <GanaConstructionLab
          ragaName={selectedRaga.name}
          bpm={settings.bpm}
          onBack={() => setMode('builder')}
          onApplySequence={events => updateTracks(current => current.map((track, index) => {
            if (index !== activeTrack) return track;
            const existing = positionBlocks(track.blocks);
            const offset = blocksEndBeat(existing);
            return { ...track, blocks: [...existing, ...events.map(event => ({ ...event, id: makeId(), source: 'construction-lab', startBeat: offset + event.startBeat }))] };
          }))}
        />
      ) : mode === 'manodharma' ? (
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          <ManodharmaIntegrated onBack={() => setMode('builder')} />
        </div>
      ) : (
        <>
          {settingsContainer && createPortal(
            <div className="music-builder-settings">
          {showSoundStudio && (
            <SoundStudioPanel
              bpm={settings.bpm}
              suggestedStartBeat={Math.ceil(projectEndBeat(tracks, audioClips, settings.bpm) * 4) / 4}
              onAddClip={addGeneratedAudioClip}
              onMessage={message => setExportMessage(message)}
            />
          )}

          {showEventEditor && (() => {
            const active = tracks[activeTrack];
            const events = active ? positionBlocks(active.blocks) : [];
            const selected = events.find(event => event.id === selectedEventId) ?? events[0];
            return <section aria-label="Advanced event editor" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div><strong style={{ color: 'var(--text)' }}>Advanced Event Editor</strong><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Edit the active track. Every change uses the existing Undo/Redo history.</div></div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button onClick={addRestEvent} style={eventButtonStyle}>＋ Add rest</button>
                  <button disabled={!selected} onClick={() => selected && setEventClipboard({ ...selected })} style={eventButtonStyle}>Copy event</button>
                  <button disabled={!eventClipboard} onClick={pasteEvent} style={eventButtonStyle}>Paste at end</button>
                  <button disabled={!selected} onClick={() => { if (selected) { removeBlock(activeTrack, selected.id); setSelectedEventId(null); } }} style={eventButtonStyle}>Delete</button>
                </div>
              </div>
              {!active || events.length === 0 ? <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Add a svara from the palette or create a rest to begin editing.</div> : <>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  <label style={eventLabelStyle}>Event <select value={selected?.id ?? ''} onChange={e => setSelectedEventId(e.target.value)} style={eventInputStyle}>{events.map(event => <option key={event.id} value={event.id}>{event.kind === 'rest' ? 'Rest' : event.label} · beat {event.startBeat.toFixed(2)}</option>)}</select></label>
                  {selected?.kind !== 'rest' && <label style={eventLabelStyle}>Svara label <input value={selected?.label ?? ''} onChange={e => selected && patchActiveEvent(selected.id, { label: e.target.value })} style={eventInputStyle} /></label>}
                  {selected?.kind !== 'rest' && <label style={eventLabelStyle}>Semitone <input type="number" min={-36} max={48} step={1} value={selected?.semitone ?? 0} onChange={e => selected && patchActiveEvent(selected.id, { semitone: Number(e.target.value) || 0 })} style={{ ...eventInputStyle, width: 84 }} /></label>}
                  <label style={eventLabelStyle}>Duration (beats) <input type="number" min={0.125} max={64} step={0.125} value={selected?.duration ?? 1} onChange={e => selected && patchActiveEvent(selected.id, { duration: Math.max(0.125, Number(e.target.value) || 0.125) })} style={{ ...eventInputStyle, width: 96 }} /></label>
                  <label style={eventLabelStyle}>Start beat <input type="number" min={0} max={10000} step={snapSubdivision} value={selected?.startBeat ?? 0} onChange={e => selected && patchActiveEvent(selected.id, { startBeat: Math.max(0, Math.round((Number(e.target.value) || 0) / snapSubdivision) * snapSubdivision) })} style={{ ...eventInputStyle, width: 96 }} /></label>
                  <label style={eventLabelStyle}>Snap <select value={snapSubdivision} onChange={e => setSnapSubdivision(Number(e.target.value))} style={eventInputStyle}><option value={1}>1 beat</option><option value={0.5}>½ beat</option><option value={0.25}>¼ beat</option><option value={0.125}>⅛ beat</option></select></label>
                  <button disabled={!selected} onClick={() => selected && patchActiveEvent(selected.id, { startBeat: Math.max(0, Math.round(selected.startBeat / snapSubdivision) * snapSubdivision) })} style={eventButtonStyle}>Snap selected</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>{events.map(event => <button key={event.id} onClick={() => setSelectedEventId(event.id)} title={`Beat ${event.startBeat}; duration ${event.duration}`} style={{ ...eventButtonStyle, borderColor: event.id === selected?.id ? '#c084fc' : 'var(--border)', background: event.id === selected?.id ? 'rgba(192,132,252,.14)' : 'transparent', color: event.kind === 'rest' ? 'var(--text-muted)' : 'var(--text)' }}>{event.kind === 'rest' ? '𝄽' : event.label} <small>{event.startBeat.toFixed(2)}</small></button>)}</div>
              </>}
            </section>;
          })()}

          {/* ── Experimental musical phrase import panel ── */}
          {showNotationView && (() => {
            const active = tracks[activeTrack];
            const events = active ? positionBlocks(active.blocks) : [];
            const cycleLength = Number(notationTala);
            const endBeat = Math.max(cycleLength, blocksEndBeat(events));
            const cycles = Math.min(32, Math.ceil(endBeat / cycleLength));
            const beatCells = Array.from({ length: cycles * cycleLength }, (_, i) => i);
            const phase = (beat: number) => ((beat + notationEduppu) % cycleLength + cycleLength) % cycleLength;
            return <section aria-label="Svara notation and tala alignment" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
                <strong>Svara Notation + Tāḷa Alignment</strong>
                <label style={eventLabelStyle}>Tāḷa
                  <select value={notationTala} onChange={e => setNotationTala(e.target.value)} style={eventInputStyle}>
                    <option value="8">Ādi tāḷa (8 beats)</option>
                    <option value="6">Rūpaka tāḷa (6 beats)</option>
                    <option value="7">Miśra Cāpu (7 beats)</option>
                    <option value="5">Khaṇḍa Cāpu (5 beats)</option>
                    <option value="4">Simple cycle (4 beats)</option>
                  </select>
                </label>
                <label style={eventLabelStyle}>Eduppu (beats)
                  <input type="number" min={-4} max={4} step={0.25} value={notationEduppu} onChange={e => setNotationEduppu(Math.max(-4, Math.min(4, Number(e.target.value) || 0)))} style={{ ...eventInputStyle, width: 64 }} />
                </label>
                <button onClick={() => { setShowEventEditor(true); if (events[0]) setSelectedEventId(events[0].id); }} style={eventButtonStyle}>Open Event Editor</button>
              </div>
              {!active || !events.length ? <div>Add svaras to the active track to see notation aligned to tāḷa beats.</div> :
                <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${beatCells.length}, 76px)`, gap: 2, width: 'max-content' }}>
                    {beatCells.map(beat => {
                      const beatPhase = phase(beat);
                      const here = events.filter(event => event.startBeat < beat + 1 && event.startBeat + event.duration > beat);
                      return <div key={beat} style={{ minHeight: 65, padding: 3, border: `1px solid ${beatPhase === 0 ? 'var(--accent)' : 'var(--border)'}`, background: 'var(--surface)', borderRadius: 4 }}>
                        <div style={{ fontSize: '0.7rem', color: beatPhase === 0 ? 'var(--accent)' : 'var(--text-muted)', marginBottom: 6 }}>{beatPhase === 0 ? 'Samam' : `Beat ${beatPhase + 1}`}</div>
                        {here.map(event => <button key={event.id} title={`${event.label}; starts at beat ${event.startBeat}; duration ${event.duration} beats`} onClick={() => { setSelectedEventId(event.id); setShowEventEditor(true); }} style={{ ...eventButtonStyle, display: 'block', width: '100%', marginBottom: 3, borderStyle: event.kind === 'rest' ? 'dashed' : 'solid' }}>
                          {event.kind === 'rest' ? 'Rest' : event.label}
                          {event.startBeat >= beat && <small style={{ display: 'block' }}>{event.duration} beats</small>}
                        </button>)}
                      </div>;
                    })}
                  </div>
                </div>}
              <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Eduppu is the entry offset relative to samam (positive: after, negative: before); only displayed cycle phase changes, not playback. Showing up to 32 cycles. This is a beat-cycle alignment aid, not full anga/kriya notation.</div>
            </section>;
          })()}

          {showPhraseImport && canImportMelakartaPhrases && (
            <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem' }}>Import Musical Phrases</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: 3 }}>Choose a generated phrase and import its svaras into the active track. Generated phrases are experimental and need musical review.</div>
                </div>
                <button onClick={() => setShowPhraseImport(false)} style={{ padding: '5px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>Close ✕</button>
              </div>
              <PhraseLibrary
                currentRagaNumber={selectedRaga.number}
                tempo={settings.bpm}
                instrument={tracks[activeTrack]?.instrument ?? 'veena'}
                onImportPhrase={importMusicalPhrase}
                trackOptions={tracks.map(track => ({ id: track.id, name: track.name }))}
                activeTrackId={tracks[activeTrack]?.id}
              />
            </div>
          )}

          {showTimeline && (
            <section aria-label="Musical arrangement timeline" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)' }}>Arrangement Timeline</div>
                  <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: 2 }}>Drag svara clips between beats or tracks. Imported audio is scheduled against the same timeline in “Tracks together” mode.</div>
                </div>
                <label style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.7rem' }}>Zoom
                  <input type="range" min={28} max={96} step={4} value={pixelsPerBeat} onChange={e => setPixelsPerBeat(Number(e.target.value))} />
                  <span style={{ minWidth: 48 }}>{pixelsPerBeat}px / beat</span>
                </label>
              </div>
              <div style={{ overflow: 'auto', minHeight: 0, border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface2)' }}>
                <div style={{ minWidth: 520, width: 170 + timelineEndBeat * pixelsPerBeat }}>
                  <div style={{ display: 'flex', position: 'sticky', top: 0, zIndex: 2, background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: 170, flex: '0 0 170px', boxSizing: 'border-box', padding: '5px 8px', color: 'var(--text-muted)', fontSize: '0.65rem', borderRight: '1px solid var(--border)' }}>Track / bar</div>
                    <div style={{ width: timelineEndBeat * pixelsPerBeat, height: 25, position: 'relative', backgroundImage: `repeating-linear-gradient(to right, transparent 0, transparent ${pixelsPerBeat - 1}px, rgba(148,163,184,.22) ${pixelsPerBeat - 1}px, rgba(148,163,184,.22) ${pixelsPerBeat}px), repeating-linear-gradient(to right, transparent 0, transparent ${pixelsPerBeat * 4 - 1}px, rgba(148,163,184,.6) ${pixelsPerBeat * 4 - 1}px, rgba(148,163,184,.6) ${pixelsPerBeat * 4}px)` }}>
                      {Array.from({ length: timelineEndBeat / 4 }, (_, bar) => <span key={bar} style={{ position: 'absolute', left: bar * 4 * pixelsPerBeat + 4, top: 4, fontSize: '0.62rem', color: 'var(--text-muted)' }}>{bar + 1}</span>)}
                    </div>
                  </div>
                  {tracks.map((track, trackIndex) => {
                    const positioned = positionBlocks(track.blocks);
                    const laneWidth = timelineEndBeat * pixelsPerBeat;
                    return <div key={`timeline-${track.id}`} style={{ display: 'flex', minHeight: 48, borderBottom: '1px solid var(--border)' }}>
                      <div style={{ width: 170, flex: '0 0 170px', boxSizing: 'border-box', padding: '6px 8px', display: 'flex', alignItems: 'center', gap: 6, borderRight: '1px solid var(--border)', color: track.color, fontSize: '0.68rem', overflow: 'hidden' }}>
                        <span style={{ width: 7, height: 7, borderRadius: 10, background: track.color, flex: '0 0 auto' }} />
                        <span title={track.name} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.name}</span>
                        <span style={{ color: 'var(--text-faint)', marginLeft: 'auto' }}>{trackIndex + 1}</span>
                      </div>
                      <div
                        style={{ width: laneWidth, flex: '0 0 auto', height: 48, position: 'relative', backgroundImage: `repeating-linear-gradient(to right, transparent 0, transparent ${pixelsPerBeat - 1}px, rgba(148,163,184,.20) ${pixelsPerBeat - 1}px, rgba(148,163,184,.20) ${pixelsPerBeat}px), repeating-linear-gradient(to right, transparent 0, transparent ${pixelsPerBeat * 4 - 1}px, rgba(148,163,184,.35) ${pixelsPerBeat * 4 - 1}px, rgba(148,163,184,.35) ${pixelsPerBeat * 4}px)` }}
                        onDragOver={event => event.preventDefault()}
                        onDrop={event => {
                          event.preventDefault();
                          const raw = event.dataTransfer.getData('application/x-naada-timeline');
                          if (!raw) return;
                          try {
                            const payload = JSON.parse(raw) as { kind: string; trackId?: string; blockId?: string; label?: string; semitone?: number; duration?: number; source?: string };
                            const rect = event.currentTarget.getBoundingClientRect();
                            const globalBeat = Math.max(0, (event.clientX - rect.left) / pixelsPerBeat);
                            const targetBeat = Math.max(0, globalBeat - Math.max(0, track.delayBeats ?? 0));
                            if (payload.kind === 'note' && payload.trackId && payload.blockId) {
                              moveTimelineNote(payload.trackId, payload.blockId, track.id, targetBeat);
                            } else if (payload.kind === 'palette-note' && payload.label && Number.isFinite(payload.semitone) && Number.isFinite(payload.duration)) {
                              updateTracks(current => current.map(target => target.id !== track.id ? target : {
                                ...target, blocks: [...positionBlocks(target.blocks), { id: makeId(), label: payload.label!, semitone: Number(payload.semitone), duration: Math.max(0.05, Number(payload.duration)), source: payload.source ?? 'raga', startBeat: Math.round(targetBeat * 4) / 4 }],
                              }));
                              setActiveTrack(trackIndex);
                            }
                          } catch { /* ignore invalid drag payload */ }
                        }}
                      >
                        {positioned.map(block => <div key={block.id} draggable title={`${block.label} · beat ${(block.startBeat + Math.max(0, track.delayBeats ?? 0)).toFixed(2)} · ${block.duration} beats — drag to move; double-click to remove`} onDragStart={event => { event.dataTransfer.setData('application/x-naada-timeline', JSON.stringify({ kind: 'note', trackId: track.id, blockId: block.id })); event.dataTransfer.effectAllowed = 'move'; }} onClick={() => setActiveTrack(trackIndex)} onDoubleClick={() => removeBlock(trackIndex, block.id)} style={{ position: 'absolute', left: (block.startBeat + Math.max(0, track.delayBeats ?? 0)) * pixelsPerBeat + 1, top: 7, height: 33, width: Math.max(22, block.duration * pixelsPerBeat - 3), boxSizing: 'border-box', borderRadius: 4, border: `1px ${block.kind === 'rest' ? 'dashed' : 'solid'} ${block.kind === 'rest' ? 'var(--text-muted)' : `${track.color}90`}`, background: block.kind === 'rest' ? 'rgba(148,163,184,.10)' : `${track.color}40`, color: block.kind === 'rest' ? 'var(--text-muted)' : track.color, fontSize: '0.63rem', fontFamily: 'monospace', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'clip', padding: '8px 3px 2px', cursor: 'grab', zIndex: 1 }} onMouseDown={() => setActiveTrack(trackIndex)}>{block.kind === 'rest' ? '𝄽 Rest' : block.label}</div>)}
                        {timelinePlayheadBeat !== null && <div aria-label="Playback playhead" style={{ position: 'absolute', left: timelinePlayheadBeat * pixelsPerBeat, top: 0, bottom: 0, width: 2, background: '#fbbf24', boxShadow: '0 0 4px rgba(251,191,36,.7)', pointerEvents: 'none', zIndex: 3 }} />}
                      </div>
                    </div>;
                  })}
                  {audioClips.map(clip => <div key={`timeline-audio-${clip.id}`} style={{ display: 'flex', minHeight: 50, borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: 170, flex: '0 0 170px', boxSizing: 'border-box', padding: '5px 8px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2, color: '#2dd4bf', fontSize: '0.65rem', overflow: 'hidden' }}>
                      <span title={clip.name} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>🎧 {clip.name}</span>
                      <span style={{ color: 'var(--text-faint)' }}>Audio · {clip.durationSeconds.toFixed(1)} s</span>
                    </div>
                    <div onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); const raw = event.dataTransfer.getData('application/x-naada-timeline'); if (!raw) return; try { const payload = JSON.parse(raw) as { kind: string; clipId?: string }; if (payload.kind !== 'audio' || !payload.clipId) return; const rect = event.currentTarget.getBoundingClientRect(); moveAudioClip(payload.clipId, Math.max(0, (event.clientX - rect.left) / pixelsPerBeat)); } catch { /* ignore invalid drag payload */ } }} style={{ width: timelineEndBeat * pixelsPerBeat, flex: '0 0 auto', height: 50, position: 'relative', backgroundImage: `repeating-linear-gradient(to right, transparent 0, transparent ${pixelsPerBeat - 1}px, rgba(148,163,184,.20) ${pixelsPerBeat - 1}px, rgba(148,163,184,.20) ${pixelsPerBeat}px), repeating-linear-gradient(to right, transparent 0, transparent ${pixelsPerBeat * 4 - 1}px, rgba(148,163,184,.35) ${pixelsPerBeat * 4 - 1}px, rgba(148,163,184,.35) ${pixelsPerBeat * 4}px)` }}>
                      <div draggable onDragStart={event => { event.dataTransfer.setData('application/x-naada-timeline', JSON.stringify({ kind: 'audio', clipId: clip.id })); event.dataTransfer.effectAllowed = 'move'; }} title={`${clip.name} · start beat ${clip.startBeat.toFixed(2)} · drag to move`} style={{ position: 'absolute', left: clip.startBeat * pixelsPerBeat + 1, top: 7, height: 36, width: Math.max(28, clip.durationSeconds / (60 / Math.max(30, settings.bpm)) * pixelsPerBeat - 3), maxWidth: timelineEndBeat * pixelsPerBeat, boxSizing: 'border-box', borderRadius: 4, border: '1px solid rgba(45,212,191,.85)', background: 'rgba(45,212,191,.16)', color: '#2dd4bf', fontSize: '0.65rem', padding: '10px 5px 2px', overflow: 'hidden', whiteSpace: 'nowrap', cursor: 'grab', zIndex: 1 }}>
                        <span aria-hidden="true" style={{ position: 'absolute', inset: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-around', opacity: 0.45, pointerEvents: 'none' }}>
                          {waveformPeaks(clip).map((peak, index) => <span key={index} style={{ width: 2, minWidth: 1, height: `${Math.max(8, Math.min(100, peak * 100))}%`, borderRadius: 2, background: '#2dd4bf' }} />)}
                        </span>
                        <span style={{ position: 'relative', zIndex: 1, padding: '0 2px', background: 'rgba(12,20,30,.45)' }}>♫ {clip.name}</span>
                      </div>
                      {timelinePlayheadBeat !== null && <div aria-label="Playback playhead" style={{ position: 'absolute', left: timelinePlayheadBeat * pixelsPerBeat, top: 0, bottom: 0, width: 2, background: '#fbbf24', boxShadow: '0 0 4px rgba(251,191,36,.7)', pointerEvents: 'none', zIndex: 3 }} />}
                    </div>
                  </div>)}
                </div>
              </div>
              {audioClips.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                {audioClips.map(clip => <div key={`clip-control-${clip.id}`} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 7, padding: '5px 8px', border: '1px solid rgba(45,212,191,.25)', borderRadius: 6, fontSize: '0.68rem' }}>
                  <strong title={clip.name} style={{ color: '#2dd4bf', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{clip.name}</strong>
                  <label style={{ color: 'var(--text-muted)' }}>Start beat <input type="number" min={0} max={1024} step={0.25} value={clip.startBeat} onChange={event => moveAudioClip(clip.id, Number(event.target.value) || 0)} style={{ width: 58, marginLeft: 3, background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 3, padding: 3 }} /></label>
                  <label style={{ color: 'var(--text-muted)' }}>Trim start (s) <input type="number" min={0} max={Math.max(0, clip.buffer.duration - 0.05)} step={0.1} value={clip.sourceStartSeconds ?? 0} onChange={event => trimAudioClip(clip.id, { start: Number(event.target.value) || 0 })} style={{ width: 62, marginLeft: 3, background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 3, padding: 3 }} /></label>
                  <label style={{ color: 'var(--text-muted)' }}>Length (s) <input type="number" min={Math.min(0.05, clip.buffer.duration)} max={clip.buffer.duration - (clip.sourceStartSeconds ?? 0)} step={0.01} value={clip.durationSeconds} onChange={event => trimAudioClip(clip.id, { duration: Number(event.target.value) || 0.05 })} style={{ width: 62, marginLeft: 3, background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 3, padding: 3 }} /></label>
                  <label style={{ color: 'var(--text-muted)' }}>Vol <input type="range" min={0} max={1} step={0.05} value={clip.volume} onChange={event => setAudioClips(previous => previous.map(item => item.id === clip.id ? { ...item, volume: Number(event.target.value) } : item))} /></label>
                  <label style={{ color: clip.muted ? 'var(--red)' : 'var(--text-muted)' }}><input type="checkbox" checked={clip.muted} onChange={event => setAudioClips(previous => previous.map(item => item.id === clip.id ? { ...item, muted: event.target.checked } : item))} /> Mute</label>
                  <button onClick={() => analyseImportedClip(clip)} style={{ border: '1px solid var(--accent)', color: 'var(--accent)', borderRadius: 4, background: 'transparent', padding: '3px 6px', cursor: 'pointer' }}>Analyse Svaras</button>
                  <button onClick={() => setAudioClips(previous => previous.filter(item => item.id !== clip.id))} style={{ border: '1px solid var(--red)', color: 'var(--red)', borderRadius: 4, background: 'transparent', padding: '3px 6px', cursor: 'pointer' }}>Remove</button>
                </div>)}
              </div>}
              {analysisClipId && <div style={{ marginTop: 12, padding: 12, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface2)' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                  <strong style={{ color: 'var(--accent)' }}>Svara Analysis · {audioClips.find(c => c.id === analysisClipId)?.name ?? 'Imported audio'}</strong>
                  <button onClick={addDetectedSwarasToTrack} disabled={!detectedSwaras.length} style={{ border: '1px solid var(--accent)', color: 'var(--accent)', borderRadius: 4, background: 'transparent', padding: '5px 8px', cursor: detectedSwaras.length ? 'pointer' : 'not-allowed' }}>Add estimated svaras to active track</button>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{analysisMessage || 'Pitch estimates are approximate. Best results come from a single clear melody.'}</p>
                {detectedSwaras.length > 0 && <div style={{ maxHeight: 180, overflow: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(115px,1fr))', gap: 5 }}>
                  {detectedSwaras.slice(0,160).map((note, i) => <div key={`${note.timeSeconds}-${i}`} style={{ fontSize: '0.7rem', padding: '5px 7px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--surface)' }}><strong>{note.label}</strong> · {note.timeSeconds.toFixed(2)}s<br/><span style={{ color: 'var(--text-muted)' }}>{note.frequencyHz.toFixed(1)} Hz · {(note.durationSeconds*1000).toFixed(0)} ms</span></div>)}
                </div>}
              </div>}
            </section>
          )}
            </div>,
            settingsContainer
          )}

          <div className="builder-workspace">

            {/* ── Note palette ── */}
            <div className="builder-palette">
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--space-2)' }}>Rāga Notes</div>
                <div className="builder-palette-notes">
                  {RAGA_NOTES.map(note => (
                    <button key={note.id} draggable onDragStart={() => setDragNote(note)} onDragEnd={() => setDragNote(null)}
                      onClick={() => { addBlock(note); synthNote(semitonesToHz(settings.tonicHz, note.semitone), 0.6, tracks[activeTrack]?.instrument ?? 'veena', settings.volume); }}
                      style={{ textAlign: 'left', padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.82rem', fontFamily: 'monospace', cursor: 'grab', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: 'var(--accent2)' }}>{note.label}</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-faint)' }}>{note.semitone}st</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Tracks area ── */}
            <div className="builder-tracks" aria-label="Composition tracks">
              <div className="builder-workspace-heading">
                <h2>{selectedRaga.name}</h2>
                <p>Tap a svara to add it to the active track. Open Settings for playback, imports, and the timeline.</p>
              </div>

              {/* ════ VOCAL TRACKS FROM SHRUTI TRAINER ════ */}
              {importedVocals.length > 0 && (
                <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid rgba(45,212,191,0.35)', padding: 'var(--space-3)' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#2dd4bf', marginBottom: 8 }}>
                    🎙 Vocal Tracks from Shruti Trainer ({importedVocals.length})
                  </div>

                  {importedVocals.map((v, vi) => (
                    <div key={vi} style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: 8, overflow: 'hidden' }}>

                      {/* Row: info + actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 120 }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)' }}>{v.name}</div>
                          <div style={{ fontSize: '0.62rem', color: 'var(--text-faint)' }}>{v.date}</div>
                          {v.layers.length > 0 && (
                            <div style={{ fontSize: '0.62rem', color: '#2dd4bf', marginTop: 2 }}>
                              Layers: {v.layers.map(l => INSTRUMENTS.find(i => i.id === l)?.label ?? l).join(', ')}
                            </div>
                          )}
                        </div>

                        {/* Play / Stop vocal */}
                        <button onClick={() => playingVocalId === v.name ? stopVocal() : playVocal(v)}
                          style={{ padding: '4px 12px', borderRadius: 99, fontSize: '0.75rem', cursor: 'pointer', border: '1px solid var(--accent)', color: 'var(--accent)', background: 'transparent', fontWeight: 600 }}>
                          {playingVocalId === v.name ? '⏹' : '▶'} {playingVocalId === v.name ? 'Stop' : 'Play'}
                        </button>

                        {/* Add Instruments — toggle panel */}
                        <button onClick={() => setExpandedVocalIdx(expandedVocalIdx === vi ? null : vi)}
                          style={{ padding: '4px 14px', borderRadius: 99, fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700, border: '1px solid #2dd4bf', background: expandedVocalIdx === vi ? 'rgba(45,212,191,0.15)' : 'rgba(45,212,191,0.06)', color: '#2dd4bf' }}>
                          🎸 Add Instruments {expandedVocalIdx === vi ? '▲' : '▼'}
                        </button>

                        {/* Delete */}
                        <button onClick={() => deleteVocal(vi)}
                          style={{ padding: '4px 8px', borderRadius: 99, fontSize: '0.72rem', cursor: 'pointer', border: '1px solid var(--red)', color: 'var(--red)', background: 'transparent' }}>
                          🗑
                        </button>
                      </div>

                      {/* ── Add Instruments panel (expands inline) ── */}
                      {expandedVocalIdx === vi && (
                        <div style={{ borderTop: '1px solid var(--border)', padding: '10px 14px', background: 'rgba(45,212,191,0.04)' }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>
                            Select instruments to layer on this vocal track:
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {melodicInstruments.map(ins => {
                              const active = v.layers.includes(ins.id as InstrumentId);
                              return (
                                <button key={ins.id} onClick={() => toggleLayer(vi, ins.id as InstrumentId)}
                                  style={{ padding: '5px 14px', borderRadius: 99, fontSize: '0.75rem', cursor: 'pointer', fontWeight: active ? 700 : 400, border: `1px solid ${active ? ins.color ?? '#2dd4bf' : 'var(--border)'}`, background: active ? `${ins.color ?? '#2dd4bf'}22` : 'transparent', color: active ? (ins.color ?? '#2dd4bf') : 'var(--text-muted)', transition: 'all 0.15s' }}>
                                  {ins.icon} {ins.label} {active ? '✓' : ''}
                                </button>
                              );
                            })}
                          </div>

                          {v.layers.length > 0 && (
                            <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>Preview with layers:</span>
                              <button
                                onClick={() => {
                                  // Play vocal + preview each layer instrument at Sa
                                  playVocal(v);
                                  v.layers.forEach((instr, idx) => {
                                    setTimeout(() => {
                                      synthNote(semitonesToHz(settings.tonicHz, 0), 1.5, instr, settings.volume);
                                    }, idx * 300);
                                  });
                                }}
                                style={{ padding: '4px 14px', borderRadius: 99, fontSize: '0.75rem', cursor: 'pointer', border: '1px solid var(--accent)', color: 'var(--accent)', background: 'var(--accent-dim)', fontWeight: 600 }}>
                                ▶ Preview Mix
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* ════ REGULAR TRACKS ════ */}
              {tracks.map((track, ti) => (
                <div key={track.id} className="builder-track"
                  style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: ti === activeTrack ? `2px solid ${track.color}` : '1px solid var(--border)', padding: 'var(--space-3)', cursor: 'pointer' }}
                  onClick={() => setActiveTrack(ti)}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); if (dragNote) { const note = { ...dragNote, id: makeId() }; updateTracks(prev => prev.map((target, index) => { if (index !== ti) return target; const positioned = positionBlocks(target.blocks); const startBeat = positioned.reduce((end, block) => Math.max(end, block.startBeat + block.duration), 0); return { ...target, blocks: [...positioned, { ...note, startBeat }] }; })); setActiveTrack(ti); } }}>
                  <div className="builder-track-header" style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: track.color, flexShrink: 0 }} />
                      <input aria-label={`Rename ${track.name}`} value={track.name} onChange={e => renameTrack(track.id, e.target.value)} onClick={e => e.stopPropagation()} onFocus={() => setActiveTrack(ti)} style={{ width: 106, minWidth: 70, fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', background: 'transparent', border: '1px solid transparent', borderBottomColor: 'var(--border)', outline: 'none', padding: '2px 3px' }} />
                      <select value={track.instrument}
                        onChange={e => { const ins = e.target.value as InstrumentId; updateTracks(prev => prev.map((t, i) => i === ti ? { ...t, instrument: ins } : t)); }}
                        onClick={e => e.stopPropagation()}
                        style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px', fontSize: '0.72rem', color: 'var(--text)', marginLeft: 'var(--space-2)' }}>
                        {INSTRUMENTS.filter(i => i.category === 'melodic').map(ins => <option key={ins.id} value={ins.id}>{ins.icon} {ins.label}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-2)' }} onClick={e => e.stopPropagation()}>
                      <label title="Mute this track" style={{ fontSize: '0.65rem', color: track.muted ? 'var(--red)' : 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <input type="checkbox" checked={!!track.muted} onChange={e => updateTracks(prev => prev.map((t, i) => i === ti ? { ...t, muted: e.target.checked } : t))} /> Mute
                      </label>
                      <label title="Solo this track" style={{ fontSize: '0.65rem', color: track.solo ? 'var(--accent)' : 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <input type="checkbox" checked={!!track.solo} onChange={e => updateTracks(prev => prev.map((t, i) => i === ti ? { ...t, solo: e.target.checked } : t))} /> Solo
                      </label>
                      <label style={{ fontSize: '0.65rem', color: 'var(--text-faint)' }}>Delay beats
                        <input type="number" min={0} max={128} value={track.delayBeats ?? 0} onChange={e => updateTracks(prev => prev.map((t, i) => i === ti ? { ...t, delayBeats: Math.max(0, Math.min(128, Number(e.target.value) || 0)) } : t))} style={{ width: 42, marginLeft: 4, background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 3, padding: 2 }} />
                      </label>
                      <label title="Track volume" style={{ fontSize: '0.65rem', color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: 4 }}>Vol {Math.round((track.volume ?? 1) * 100)}% <input type="range" min={0} max={1} step={0.05} value={track.volume ?? 1} onChange={e => updateTracks(prev => prev.map((t, i) => i === ti ? { ...t, volume: Number(e.target.value) } : t))} onClick={e => e.stopPropagation()} style={{ width: 58 }} /></label>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-faint)' }}>{track.blocks.length} notes</span>
                      <button onClick={() => moveTrack(ti, -1)} disabled={ti === 0} title="Move track up" style={{ fontSize: '0.7rem', padding: '2px 5px', borderRadius: 4, border: '1px solid var(--border)', cursor: ti === 0 ? 'not-allowed' : 'pointer', opacity: ti === 0 ? 0.35 : 1 }}>↑</button>
                      <button onClick={() => moveTrack(ti, 1)} disabled={ti === tracks.length - 1} title="Move track down" style={{ fontSize: '0.7rem', padding: '2px 5px', borderRadius: 4, border: '1px solid var(--border)', cursor: ti === tracks.length - 1 ? 'not-allowed' : 'pointer', opacity: ti === tracks.length - 1 ? 0.35 : 1 }}>↓</button>
                      <button onClick={() => duplicateTrack(ti)} disabled={tracks.length >= 16} title="Duplicate track" style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)', cursor: tracks.length >= 16 ? 'not-allowed' : 'pointer' }}>Duplicate</button>
                      <button onClick={() => clearTrack(ti)} style={{ fontSize: '0.65rem', color: 'var(--text-faint)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)', cursor: 'pointer' }}>Clear</button>
                      <button onClick={() => deleteTrack(ti)} disabled={tracks.length <= 1} title={tracks.length <= 1 ? 'At least one track must remain' : 'Delete track'} style={{ fontSize: '0.65rem', color: 'var(--red)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--red)', cursor: tracks.length <= 1 ? 'not-allowed' : 'pointer', opacity: tracks.length <= 1 ? 0.35 : 1 }}>Delete</button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, minHeight: 36, padding: 'var(--space-2)', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                    {track.blocks.length === 0 && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)', alignSelf: 'center', margin: '0 auto' }}>
                        Drag or click notes from palette → {ti === activeTrack ? '← active track' : 'click to activate'}
                      </span>
                    )}
                    {track.blocks.map(block => (
                      <button key={block.id} type="button" title="Click to remove" aria-label={`Remove ${block.label} from ${track.name}`}
                        onClick={e => { e.stopPropagation(); removeBlock(ti, block.id); }}
                        style={{ padding: '3px 8px', borderRadius: 4, background: track.color + '22', border: `1px solid ${track.color}55`, fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text)', cursor: 'pointer', position: 'relative' }}>
                        {block.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

            </div>
          </div>
        </>
      )}
    </div>
  );
}