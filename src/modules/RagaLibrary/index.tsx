import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { MELAKARTAS, CHAKRA_NAMES } from '../../data/ragas'
import { useAppStore } from '../../store/useAppStore'
import { getAudioContext, stopSequence } from '../../audio/engine'
import type { Melakarta } from '../../types/index'
import { tokeniseNotation } from '../../audio/engine';
import {
  saraliVarisaiMmg,
  jantaVarisaiMmg,
  dhatuVarisaiMmg,
  melsthayiVarisaiMmg,
  mandrasthayiVarisaiMmg,
  alankaramMmg,
} from '../../data/mmg';
import type { VarisaiExercise } from '../../data/mmg/types';

import {
  getMelakartaCurriculum,
  getPlayerExercises,
} from '../../data/curriculum/service'
import type {
  CurriculumTab,
  PlayerExercise,
} from '../../data/curriculum/service'
import {
  getMelakartaVariantMap,
} from '../../music/svaraMapping'
import { groupNotationTokens } from '../../music/notationLayout'


// ─────────────────────────────────────────────────────────────────────────────
// NOTATION SYSTEM
// s r g m p d n  → middle octave (Madhya Stāyi)
// S R G M P D N  → upper octave (Tāra Stāyi)
// s, r, g, m, p, d, n,  → lower octave (Mandra / Kīḷ Stāyi)
// ,  → extend previous note by 1 mātrā (Dīrgha)
// -  → phrase gap (half-mātrā rest)
// |  → tāla akṣara separator (display only)
// || → tāla āvarta end (display only)
// ─────────────────────────────────────────────────────────────────────────────

// Just-intonation ratios used by the player.
// Keep svaras that occupy the same curriculum pitch position at the same ratio:
// R2 = G1, R3 = G2, D2 = N1, and D3 = N2.
// These are a consistent chosen JI mapping, not equal-tempered frequencies.
const JI: Record<string, number> = {
  'S': 1,
  'R1': 256/243, 'R2': 9/8,    'R3': 32/27,
  'G1': 9/8,     'G2': 32/27,  'G3': 81/64,
  'M1': 4/3,     'M2': 729/512,
  'P': 3/2,
  'D1': 128/81,  'D2': 5/3,    'D3': 16/9,
  'N1': 5/3,     'N2': 16/9,   'N3': 15/8,
}


const SVARA_INFO: Record<string, { name: string; meaning: string; colour: string }> = {
  'S' : { name: 'Sa — Ṣaḍja',     meaning: 'Tonic — the anchor of all music',          colour: '#facc15' },
  'R1': { name: 'Ri1 — Ṛṣabha',   meaning: 'Minor 2nd · Śuddha (pure)',                colour: '#f87171' },
  'R2': { name: 'Ri2 — Ṛṣabha',   meaning: 'Major 2nd · Catusruti',                    colour: '#fb923c' },
  'R3': { name: 'Ri3 — Ṛṣabha',   meaning: 'Augmented 2nd · Ṣaṭśruti',               colour: '#fbbf24' },
  'G1': { name: 'Ga1 — Gāndhāra', meaning: 'Shares pitch position with R2',         colour: '#a3e635' },
  'G2': { name: 'Ga2 — Gāndhāra', meaning: 'Shares pitch position with R3',             colour: '#4ade80' },
  'G3': { name: 'Ga3 — Gāndhāra', meaning: 'Pythagorean major 3rd · Antara',           colour: '#34d399' },
  'M1': { name: 'Ma1 — Madhyama', meaning: 'Perfect fourth · Śuddha',                  colour: '#22d3ee' },
  'M2': { name: 'Ma2 — Madhyama', meaning: 'Augmented fourth · Prati/Tīvra',           colour: '#38bdf8' },
  'P' : { name: 'Pa — Pañcama',   meaning: 'Perfect fifth — immovable svara',          colour: '#818cf8' },
  'D1': { name: 'Da1 — Daivata',  meaning: 'Minor 6th · Śuddha',                       colour: '#a78bfa' },
  'D2': { name: 'Da2 — Daivata',  meaning: 'Pure major 6th · Catusruti',               colour: '#c084fc' },
  'D3': { name: 'Da3 — Daivata',  meaning: 'Shares pitch position with N2',        colour: '#e879f9' },
  'N1': { name: 'Ni1 — Niṣāda',  meaning: 'Minor 7th · Kaiśiki',                      colour: '#f472b6' },
  'N2': { name: 'Ni2 — Niṣāda',  meaning: 'Shares pitch position with D3',               colour: '#fb7185' },
  'N3': { name: 'Ni3 — Niṣāda',  meaning: 'Pure major 7th · Kākali',                  colour: '#fda4af' },
}

interface NoteInfo {
  ratio: number
  svaraKey: string
  octave: 'kil' | 'mid' | 'tar'
  token: string
}

function buildNoteInfoMap(raga: Melakarta): Record<string, NoteInfo> {
  const variants = getMelakartaVariantMap(raga.number)
const rKey = variants.R
const gKeyFinal = variants.G
const mKey = variants.M
const dKey = variants.D
const nKey = variants.N

  const mk = (ratio: number, svaraKey: string, octave: NoteInfo['octave'], token: string): NoteInfo =>
    ({ ratio, svaraKey, octave, token })

  return {
    's':  mk(JI['S'],          'S',         'mid', 's'),
    'r':  mk(JI[rKey],         rKey,        'mid', 'r'),
    'g':  mk(JI[gKeyFinal],    gKeyFinal,   'mid', 'g'),
    'm':  mk(JI[mKey],         mKey,        'mid', 'm'),
    'p':  mk(JI['P'],          'P',         'mid', 'p'),
    'd':  mk(JI[dKey],         dKey,        'mid', 'd'),
    'n':  mk(JI[nKey],         nKey,        'mid', 'n'),
    'S':  mk(JI['S']  * 2,     'S',         'tar', 'S'),
    'R':  mk(JI[rKey] * 2,     rKey,        'tar', 'R'),
    'G':  mk(JI[gKeyFinal]*2,  gKeyFinal,   'tar', 'G'),
    'M':  mk(JI[mKey] * 2,     mKey,        'tar', 'M'),
    'P':  mk(JI['P']  * 2,     'P',         'tar', 'P'),
    'D':  mk(JI[dKey] * 2,     dKey,        'tar', 'D'),
    'N':  mk(JI[nKey] * 2,     nKey,        'tar', 'N'),
    's,': mk(JI['S']  / 2,     'S',         'kil', 's,'),
    'r,': mk(JI[rKey] / 2,     rKey,        'kil', 'r,'),
    'g,': mk(JI[gKeyFinal]/2,  gKeyFinal,   'kil', 'g,'),
    'm,': mk(JI[mKey] / 2,     mKey,        'kil', 'm,'),
    'p,': mk(JI['P']  / 2,     'P',         'kil', 'p,'),
    'd,': mk(JI[dKey] / 2,     dKey,        'kil', 'd,'),
    'n,': mk(JI[nKey] / 2,     nKey,        'kil', 'n,'),
    'Ṡ': mk(JI['S']  * 2,     'S',         'tar', 'Ṡ'),
    'Ṙ': mk(JI[rKey] * 2,     rKey,        'tar', 'Ṙ'),
    // Curriculum aliases used in Mel Sthāyi and Janta exercises.
    // P_high is upper-octave Pa; ṇ is lower-octave Ni.
    'P_high': mk(JI['P'] * 2, 'P', 'tar', 'P_high'),
    'ṇ': mk(JI[nKey] / 2, nKey, 'kil', 'ṇ'),
    'Ġ': mk(JI[gKeyFinal]*2,  gKeyFinal,   'tar', 'Ġ'),
    'Ṁ': mk(JI[mKey] * 2,     mKey,        'tar', 'Ṁ'),
    'Ṗ': mk(JI['P']  * 2,     'P',         'tar', 'Ṗ'),
    'Ṅ': mk(JI[nKey] * 2,     nKey,        'tar', 'Ṅ'),
    'Ṣ': mk(JI['S']  / 2,     'S',         'kil', 'Ṣ'),
    'Ṛ': mk(JI[rKey] / 2,     rKey,        'kil', 'Ṛ'),
    'Ṃ': mk(JI[mKey] / 2,     mKey,        'kil', 'Ṃ'),
    'Ḍ': mk(JI[dKey] / 2,     dKey,        'kil', 'Ḍ'),
    'Ṇ': mk(JI[nKey] / 2,     nKey,        'kil', 'Ṇ'),
    'P̣': mk(JI['P'] / 2, 'P', 'kil', 'P̣'),
    'Ṗ2': mk(JI['P'] / 2, 'P', 'kil', 'Ṗ'),
  }
}

interface NoteEvent {
  noteInfo: NoteInfo | null
  durationMult: number
  token: string
  isRest: boolean
  displayIdx: number
}

function parseToEvents(noteStr: string, noteInfoMap: Record<string, NoteInfo>): NoteEvent[] {
  const rawTokens = noteStr.trim().split(/\s+/).filter(Boolean)
  const events: NoteEvent[] = []
  let lastNoteIdx = -1

  for (let i = 0; i < rawTokens.length; i++) {
    const tok = rawTokens[i]
    if (tok === '|' || tok === '||') continue
    if (tok === ',') {
      if (lastNoteIdx >= 0 && !events[lastNoteIdx].isRest) {
        events[lastNoteIdx].durationMult += 1
      }
      continue
    }
    if (tok === '-') {
      events.push({ noteInfo: null, durationMult: 0.5, token: '-', isRest: true, displayIdx: i })
      lastNoteIdx = events.length - 1
      continue
    }
    let durationMult = 1
    let j = i + 1
    while (j < rawTokens.length && rawTokens[j] === ',') { durationMult += 1; j++ }
    const normTok = tok.normalize('NFC')
    // Curriculum JSON marks the lower octave with an underscore (e.g. n_),
    // while the legacy player uses a trailing comma (n,). Support both.
    const legacyLowerOctaveToken =
      /^[srgmpdn][._]$/.test(tok)
        ? `${tok.slice(0, -1)},`
        : ''
    const info =
      noteInfoMap[normTok] ??
      noteInfoMap[tok] ??
      (legacyLowerOctaveToken ? noteInfoMap[legacyLowerOctaveToken] : null) ??
      null
    events.push({ noteInfo: info, durationMult, token: tok, isRest: !info, displayIdx: i })
    lastNoteIdx = events.length - 1
    if (j > i + 1) i = j - 1
  }
  return events
}

export function synthNoteJI(
  tonicHz: number, ratio: number, prevRatio: number | null,
  durationMult: number, beatSec: number, instrument: string,
  volume: number, startTime: number
): () => void {
  const ctx = getAudioContext()
  const sources = new Set<AudioScheduledSourceNode>()
  const trackSource = <T extends AudioScheduledSourceNode>(source: T): T => {
    sources.add(source)
    source.addEventListener('ended', () => sources.delete(source), { once: true })
    return source
  }
  const hz = tonicHz * ratio
  const dur = beatSec * durationMult
  const isHeld = durationMult >= 2
  const hasGlide = prevRatio !== null && Math.abs(prevRatio - ratio) > 0.001

  const masterGain = ctx.createGain()
  masterGain.connect(ctx.destination)
  masterGain.gain.setValueAtTime(0, startTime)

  let attack = 0.05, decay = 0.04, sustain = 0.85, release = 0.08
  switch (instrument) {
    case 'voice':     attack = 0.10; decay = 0.06; sustain = 0.82; release = 0.18; break
    case 'veena':     attack = 0.008; decay = 0.12; sustain = 0.55; release = 0.20; break
    case 'violin':    attack = 0.09; decay = 0.08; sustain = 0.90; release = 0.20; break
    case 'flute':     attack = 0.11; decay = 0.03; sustain = 0.94; release = 0.13; break
    case 'sitar':     attack = 0.004; decay = 0.10; sustain = 0.40; release = 0.15; break
    case 'harmonium': attack = 0.015; decay = 0.03; sustain = 0.96; release = 0.04; break
    case 'nadaswaram':attack = 0.025; decay = 0.06; sustain = 0.86; release = 0.12; break
  }

  const peak = volume * (instrument === 'veena' || instrument === 'sitar' ? 1.4 : 1.0)
  masterGain.gain.linearRampToValueAtTime(peak, startTime + attack)
  masterGain.gain.linearRampToValueAtTime(peak * sustain, startTime + attack + decay)
  const holdEnd = startTime + Math.max(attack + decay, dur - release)
  masterGain.gain.setValueAtTime(peak * sustain, holdEnd)
  masterGain.gain.linearRampToValueAtTime(0, startTime + dur + 0.02)

  type HarmonicDef = [number, number, OscillatorType]
  const harmonics: HarmonicDef[] = getHarmonics(instrument)

  harmonics.forEach(([partialRatio, amp, wavetype]) => {
    const osc = trackSource(ctx.createOscillator())
    osc.type = wavetype
    const partialHz = hz * partialRatio
    if (hasGlide && partialRatio === 1) {
      const fromHz = tonicHz * prevRatio! * partialRatio
      const glideTime = Math.min(beatSec * 0.12, 0.07)
      osc.frequency.setValueAtTime(fromHz, startTime)
      osc.frequency.linearRampToValueAtTime(partialHz, startTime + glideTime)
    } else {
      osc.frequency.setValueAtTime(partialHz, startTime)
    }
    const hGain = ctx.createGain()
    hGain.gain.value = amp
    osc.connect(hGain); hGain.connect(masterGain)
    osc.start(startTime); osc.stop(startTime + dur + 0.1)
    if (isHeld && partialRatio <= 2) {
      const lfo = trackSource(ctx.createOscillator())
      const lfoGain = ctx.createGain()
      lfo.type = 'sine'
      const kampitaRate = instrument === 'voice' ? 5.5 : instrument === 'violin' ? 6.5 : 5.8
      const kampitaDepth = partialHz * (instrument === 'voice' ? 0.012 : 0.009)
      lfo.frequency.value = kampitaRate
      const kampitaDelay = Math.min(dur * 0.15, 0.12)
      lfoGain.gain.setValueAtTime(0, startTime)
      lfoGain.gain.linearRampToValueAtTime(kampitaDepth, startTime + kampitaDelay + 0.05)
      lfoGain.gain.setValueAtTime(kampitaDepth, startTime + dur - 0.06)
      lfoGain.gain.linearRampToValueAtTime(0, startTime + dur)
      lfo.connect(lfoGain); lfoGain.connect(osc.frequency)
      lfo.start(startTime); lfo.stop(startTime + dur + 0.1)
    }
  })

  if (instrument === 'flute') {
    const noiseDur = 0.08
    const noiseLen = Math.ceil(ctx.sampleRate * noiseDur)
    const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate)
    const d = noiseBuf.getChannelData(0)
    for (let j = 0; j < noiseLen; j++) d[j] = (Math.random() * 2 - 1)
    const ns = trackSource(ctx.createBufferSource()); ns.buffer = noiseBuf
    const nf = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = hz * 1.4; nf.Q.value = 4
    const ng = ctx.createGain()
    ng.gain.setValueAtTime(volume * 0.12, startTime)
    ng.gain.exponentialRampToValueAtTime(0.0001, startTime + noiseDur)
    ns.connect(nf); nf.connect(ng); ng.connect(ctx.destination)
    ns.start(startTime); ns.stop(startTime + noiseDur + 0.01)
  }

  if (instrument === 'veena') {
    const buzz = trackSource(ctx.createOscillator()); buzz.type = 'triangle'
    buzz.frequency.value = hz * 6.97
    const bg = ctx.createGain()
    bg.gain.setValueAtTime(volume * 0.035, startTime)
    bg.gain.exponentialRampToValueAtTime(0.0001, startTime + Math.min(dur * 0.6, 0.35))
    buzz.connect(bg); bg.connect(ctx.destination)
    buzz.start(startTime); buzz.stop(startTime + 0.4)
  }

  return () => {
    for (const source of sources) source.stop(ctx.currentTime)
    sources.clear()
  }
}

function getHarmonics(instrument: string): [number, number, OscillatorType][] {
  switch (instrument) {
    case 'voice':      return [[1,1,'sine'],[2,0.30,'sine'],[3,0.12,'sine'],[4,0.05,'sine']]
    case 'veena':      return [[1,1,'sawtooth'],[2,0.55,'sine'],[3,0.30,'sine'],[4,0.15,'sine'],[5,0.07,'sine'],[6,0.03,'sine']]
    case 'violin':     return [[1,1,'sawtooth'],[2,0.60,'sawtooth'],[3,0.40,'sine'],[4,0.20,'sine'],[5,0.10,'sine']]
    case 'flute':      return [[1,1,'sine'],[2,0.20,'sine'],[3,0.05,'sine']]
    case 'sitar':      return [[1,1,'sawtooth'],[2,0.70,'sine'],[3,0.50,'sine'],[4,0.32,'sine'],[5,0.18,'sine'],[6,0.09,'sine'],[7,0.04,'sine']]
    case 'harmonium':  return [[1,1,'square'],[2,0.48,'square'],[3,0.25,'sawtooth'],[4,0.13,'square'],[5,0.06,'sine']]
    case 'piano':      return [[1,1,'triangle'],[2,0.52,'sine'],[3,0.24,'triangle'],[4,0.12,'sine'],[5,0.045,'sine']]
    case 'nadaswaram': return [[1,1,'sawtooth'],[2,0.72,'sine'],[3,0.50,'sine'],[4,0.28,'sine'],[5,0.14,'sine'],[6,0.06,'sine']]
    case 'sarangi':    return [[1,1,'sawtooth'],[2,0.62,'sawtooth'],[3,0.42,'triangle'],[4,0.22,'sine'],[5,0.12,'sine'],[6,0.05,'sine']]
    default:           return [[1,1,'sine'],[2,0.25,'sine']]
  }
}

function scheduleSequence(
  events: NoteEvent[], tonicHz: number, beatSec: number,
  instrument: string, volume: number,
  onNote: (idx: number) => void, onDone: () => void
): () => void {
  const ctx = getAudioContext()
  let cancelled = false
  const startAt = ctx.currentTime + 0.06
  let cursor = startAt
  let prevRatio: number | null = null
  const noteStarts: Array<{ idx: number; at: number }> = []
  const cancelNotes: (() => void)[] = []

  events.forEach((ev, i) => {
    if (!ev.isRest && ev.noteInfo) {
      noteStarts.push({ idx: i, at: cursor })
      cancelNotes.push(synthNoteJI(tonicHz, ev.noteInfo.ratio, prevRatio, ev.durationMult, beatSec, instrument, volume, cursor))
      prevRatio = ev.noteInfo.ratio
    }
    cursor += beatSec * ev.durationMult
  })

  let raf = 0
  let next = 0
  let lastIdx = -1
  const tick = () => {
    if (cancelled) return
    const now = ctx.currentTime
    while (next < noteStarts.length && noteStarts[next].at <= now + 0.012) {
      if (noteStarts[next].idx !== lastIdx) {
        lastIdx = noteStarts[next].idx
        onNote(lastIdx)
      }
      next++
    }
    if (now >= cursor + 0.12) {
      onDone()
      return
    }
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
  return () => {
    cancelled = true
    if (raf) cancelAnimationFrame(raf)
    cancelNotes.forEach(cancel => cancel())
  }
}

const SPEEDS = [
  { label: '1×', mult: 1, desc: '1 note per beat' },
  { label: '2×', mult: 2, desc: '2 notes per beat' },
  { label: '3×', mult: 3, desc: '3 notes per beat' },
]

type TabKey = 'sarali' | 'janta' | 'dhaatu' | 'mel' | 'kil' | 'alankara'

const TABS: { id: TabKey; label: string }[] = [
  { id: 'sarali',   label: 'Sarali' },
  { id: 'janta',    label: 'Janta' },
  { id: 'dhaatu',   label: 'Dhaatu' },
  { id: 'mel',      label: 'Mel Stāyi' },
  { id: 'kil',      label: 'Kīḷ Stāyi' },
  { id: 'alankara', label: 'Alankāram' },
]

function mmgToEx(ex: VarisaiExercise): { label: string; aro: string; avro: string } {
  const half = Math.max(1, Math.floor(ex.lines.length / 2))
  const aroLines = ex.lines.slice(0, half)
  const avroLines = ex.lines.slice(half)
  const aro = aroLines.map((l) => l.tokens).join(' ')
  const avro = avroLines.length > 0 ? avroLines.map((l) => l.tokens).join(' ') : aro
  return { label: ex.name, aro, avro }
}

const EXERCISES: Record<TabKey, { label: string; aro: string; avro: string; aroSwarasthana?: string; avroSwarasthana?: string }[]> = {
  sarali:   saraliVarisaiMmg.map(mmgToEx),
  janta:    jantaVarisaiMmg.map(mmgToEx),
  dhaatu:   dhatuVarisaiMmg.map(mmgToEx),
  mel:      melsthayiVarisaiMmg.map(mmgToEx),
  kil:      mandrasthayiVarisaiMmg.map(mmgToEx),
  alankara: alankaramMmg.map(mmgToEx),
}

type PlayMode = 'aro' | 'avro' | 'both'

function tokenColour(tok: string): string {
  if (tok === '|' || tok === '||') return 'rgba(255,255,255,0.18)'
  if (tok === '-') return '#475569'
  if (tok === ',') return '#f59e0b'
  if (tok.endsWith(',')) return '#7dd3fc'
  const t = tok.normalize('NFC')
  if (/^[ṢṚṂḌṆ]/.test(t) || (t[0] === 'P' && t.length > 1) || t[0] === 'Ṗ') return '#7dd3fc'
  if (/^[SRGMPDNṠṘĠṀṖṄ]/.test(t)) return '#c4b5fd'
  return '#e2e8f0'
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function RagaLibrary({ settingsContainer }: { settingsContainer?: HTMLDivElement | null }) {
  const { settings } = useAppStore()
  const [search, setSearch] = useState('')
  const [chakraFilter, setChakraFilter] = useState<number | null>(null)
  const [selectedRaga, setSelectedRaga] = useState<Melakarta>(MELAKARTAS[14])
  const [curriculumExercises, setCurriculumExercises] =
  useState<Partial<Record<TabKey, PlayerExercise[]>>>({})
  
useEffect(() => {
  let cancelled = false

  async function loadSelectedCurriculum() {
    try {
      const mela = await getMelakartaCurriculum(selectedRaga.number)

      const tabMap: Record<TabKey, CurriculumTab> = {
        sarali: 'sarali',
        janta: 'janta',
        dhaatu: 'dhaatu',
        mel: 'mel',
        kil: 'kil',
        alankara: 'alankara',
      }

      const loaded: Partial<Record<TabKey, PlayerExercise[]>> = {}

      for (const [uiTab, curriculumTab] of Object.entries(tabMap) as [
        TabKey,
        CurriculumTab,
      ][]) {
        loaded[uiTab] = getPlayerExercises(mela, curriculumTab)
      }

      if (!cancelled) {
        setCurriculumExercises(loaded)
      }
    } catch (error) {
      console.error('Failed to load raga curriculum:', error)

      if (!cancelled) {
        setCurriculumExercises({})
      }
    }
  }

  void loadSelectedCurriculum()

  return () => {
    cancelled = true
  }
}, [selectedRaga.number])

  const [tab, setTab] = useState<TabKey>('sarali')
  const [speedIdx, setSpeedIdx] = useState(0)
  const [playMode, setPlayMode] = useState<PlayMode>('both')
  const [loopMode, setLoopMode] = useState(false)
  const [playingIdx, setPlayingIdx] = useState(-1)
  const [activeEvIdx, setActiveEvIdx] = useState<{ phase: 'aro' | 'avro'; evIdx: number } | null>(null)
  const [playPhase, setPlayPhase] = useState<'aro' | 'avro' | null>(null)
  const [selectedExercise, setSelectedExercise] = useState<{ tab: TabKey; idx: number } | null>(null)
  // ── Mobile master-detail: showList=true → show rāga list, false → show detail
  const [showList, setShowList] = useState(true)

  // ── Reactive isMobile — updates on window resize (breakpoint 900px covers phones + tablets)
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 600 : false
  )
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 600)
    window.addEventListener('resize', check)
    check() // run once on mount to ensure correct value
    return () => window.removeEventListener('resize', check)
  }, [])

  const stopRef = useRef<(() => void) | null>(null)
  const loopRef = useRef(false)
  type QueueItem = { tab: TabKey; idx: number }
  const queueRef = useRef<QueueItem[]>([])
  const queueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const playbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const playbackVersionRef = useRef(0)
  const handlePlayRef = useRef<(idx: number, preserveQueue?: boolean) => void>(() => {})

  const filtered = MELAKARTAS.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = !q || r.name.toLowerCase().includes(q)
      || (r.nameTelugu || '').includes(q) || String(r.number).includes(q)
    const matchChakra = chakraFilter === null || r.chakra === chakraFilter
    return matchSearch && matchChakra
  })

  const exercises = curriculumExercises[tab] ?? EXERCISES[tab]
  const noteInfoMap = buildNoteInfoMap(selectedRaga)

  // Identify the exact swarasthāna for the currently sounding exercise event.
  const getActiveNoteInfo = (): { info: NoteInfo; svaraInfo: typeof SVARA_INFO[string] } | null => {
    if (!activeEvIdx || playingIdx < 0) return null
    const ex = exercises[playingIdx] as { aro: string; avro: string } | undefined
    if (!ex) return null
    const noteStr = activeEvIdx.phase === 'aro' ? ex.aro : ex.avro
    const events = parseToEvents(noteStr, noteInfoMap)
    const ev = events[activeEvIdx.evIdx]
    if (!ev?.noteInfo) return null
    const si = SVARA_INFO[ev.noteInfo.svaraKey]
    return si ? { info: ev.noteInfo, svaraInfo: si } : null
  }

  const activeNoteDisplay = getActiveNoteInfo()


  const stopCurrent = useCallback(() => {
    playbackVersionRef.current++
    loopRef.current = false
    queueRef.current = []
    if (queueTimerRef.current) { clearTimeout(queueTimerRef.current); queueTimerRef.current = null }
    if (playbackTimerRef.current) { clearTimeout(playbackTimerRef.current); playbackTimerRef.current = null }
    stopRef.current?.()
    stopSequence()
    stopRef.current = null
    setPlayingIdx(-1)
    setActiveEvIdx(null)
    setPlayPhase(null)
  }, [])

  useEffect(() => stopCurrent, [stopCurrent])

  const handleRagaSelect = useCallback((raga: Melakarta) => {
    stopCurrent()
    setSelectedRaga(raga)
    // On mobile/tablet: switch to detail view after selecting
    if (isMobile) {
      setShowList(false)
    }
  }, [stopCurrent, isMobile])

  const handlePlay = useCallback(
    async (idx: number, preserveQueue = false) => {
      if (!preserveQueue && playingIdx === idx) { stopCurrent(); return }
      if (preserveQueue) {
        stopRef.current?.()
        stopSequence()
        stopRef.current = null
        setActiveEvIdx(null)
        setPlayPhase(null)
      } else {
        stopCurrent()
      }
      const playbackVersion = ++playbackVersionRef.current
      const ctx = getAudioContext()
      if (ctx.state === 'suspended') await ctx.resume()
      if (playbackVersion !== playbackVersionRef.current) return
      const ex = exercises[idx] as { label: string; aro: string; avro: string }
      const nim = buildNoteInfoMap(selectedRaga)
      const speed = SPEEDS[speedIdx].mult
      const beatSec = (60 / settings.bpm) / speed
      const tonicHz = settings.tonicHz
      const aroEvents = parseToEvents(ex.aro, nim)
      const avroEvents = parseToEvents(ex.avro, nim)
      loopRef.current = loopMode
      setPlayingIdx(idx)
      const runPhase = (phase: 'aro' | 'avro', onDone: () => void) => {
        const events = phase === 'aro' ? aroEvents : avroEvents
        setPlayPhase(phase)
        const cancel = scheduleSequence(
          events, tonicHz, beatSec, settings.instrument, settings.volume,
          (evIdx) => setActiveEvIdx({ phase, evIdx }), onDone
        )
        stopRef.current = cancel
      }
      const runExercise = () => {
        const cleanup = () => {
          if (loopRef.current) { playbackTimerRef.current = setTimeout(runExercise, beatSec * 400) }
          else {
            setPlayingIdx(-1); setActiveEvIdx(null); setPlayPhase(null)
            const next = queueRef.current.shift()
            if (next) {
              queueTimerRef.current = setTimeout(() => {
                setTab(next.tab)
                queueTimerRef.current = setTimeout(() => {
                  handlePlayRef.current(next.idx, true)
                }, 80)
              }, 250)
            }
          }
        }
        if (playMode === 'aro') { runPhase('aro', cleanup) }
        else if (playMode === 'avro') { runPhase('avro', cleanup) }
        else { runPhase('aro', () => { playbackTimerRef.current = setTimeout(() => runPhase('avro', cleanup), beatSec * 500) }) }
      }
      runExercise()
    },
    [playingIdx, selectedRaga, settings, speedIdx, playMode, loopMode, exercises, stopCurrent]
  )

  // Keep a current callable for queue transitions across tab changes.
  handlePlayRef.current = (idx: number, preserveQueue = false) => { void handlePlay(idx, preserveQueue) }

  const startPlaybackQueue = useCallback((items: QueueItem[]) => {
    if (!items.length) return
    stopCurrent()
    loopRef.current = false
    setLoopMode(false)
    queueRef.current = items.slice(1)
    const first = items[0]
    setTab(first.tab)
    queueTimerRef.current = setTimeout(() => {
      handlePlayRef.current(first.idx, true)
    }, 80)
  }, [stopCurrent])

  const playAllCurrentCategory = useCallback(() => {
    const list = curriculumExercises[tab] ?? EXERCISES[tab]
    startPlaybackQueue(list.map((_, idx) => ({ tab, idx })))
  }, [curriculumExercises, tab, startPlaybackQueue])

  const playAllSelectedRaga = useCallback(() => {
    const items = TABS.flatMap(t =>
      (curriculumExercises[t.id] ?? EXERCISES[t.id]).map((_, idx) => ({ tab: t.id, idx }))
    )
    startPlaybackQueue(items)
  }, [curriculumExercises, startPlaybackQueue])

  const handleTabChange = useCallback((t: TabKey) => {
    stopCurrent(); setTab(t)
  }, [stopCurrent])

  const playSingleNote = useCallback((info: NoteInfo) => {
    stopCurrent()
    const ctx = getAudioContext()
    stopRef.current = synthNoteJI(settings.tonicHz, info.ratio, null, 1.5, 0.6, settings.instrument, settings.volume, ctx.currentTime + 0.02)
  }, [settings, stopCurrent])

  
function buildDisplayMap(
  noteStr: string,
  nim: Record<string, NoteInfo>
): (number | null)[] {
  const rawTokens = noteStr.trim().split(/\s+/).filter(Boolean)
  const events = parseToEvents(noteStr, nim)
  const evMap: (number | null)[] = Array(rawTokens.length).fill(null)

  // Map each actual note/rest event to its original token position.
  events.forEach((ev, idx) => {
    if (ev.displayIdx >= 0 && ev.displayIdx < rawTokens.length) {
      evMap[ev.displayIdx] = idx
    }
  })

  // Hold markers belong to the preceding note, even when a tala
  // separator occurs between that note and its continuation marker.
  let previousEvent: number | null = null

  for (let i = 0; i < rawTokens.length; i++) {
    const tok = rawTokens[i]

    if (tok === '|' || tok === '||') {
      continue
    }

    if (tok === ',') {
      evMap[i] = previousEvent
      continue
    }

    if (evMap[i] !== null) {
      previousEvent = evMap[i]
    }
  }

  return evMap
}

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="raga-library-root" style={{ display: 'flex', height: '100%', width: '100%', minWidth: 0, overflow: 'hidden' }}>

      {/* ── Left panel: Rāga Picker ──
          Desktop: always visible (256px)
          Mobile: full screen when showList=true, hidden when showList=false */}
      <div style={{
        width: isMobile ? '100%' : 256,
        flexShrink: 0,
        minWidth: 0,
        borderRight: isMobile ? 'none' : '1px solid var(--border)',
        display: isMobile && !showList ? 'none' : 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={{ padding: 'var(--space-3)', borderBottom: '1px solid var(--border)' }}>
          <input
            placeholder="Search rāga or number"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '6px 10px', fontSize: '0.8rem', color: 'var(--text)' }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 'var(--space-2)' }}>
            <button onClick={() => setChakraFilter(null)}
              style={{ fontSize: '0.6rem', padding: '2px 7px', borderRadius: 99, border: '1px solid', cursor: 'pointer', background: chakraFilter === null ? 'var(--accent)' : 'transparent', borderColor: chakraFilter === null ? 'var(--accent)' : 'var(--border)', color: chakraFilter === null ? '#000' : 'var(--text-muted)' }}>All</button>
            {CHAKRA_NAMES.map((cn, i) => (
              <button key={i} onClick={() => setChakraFilter(chakraFilter === i + 1 ? null : i + 1)}
                style={{ fontSize: '0.58rem', padding: '2px 5px', borderRadius: 99, border: '1px solid', cursor: 'pointer', background: chakraFilter === i + 1 ? 'var(--accent)' : 'transparent', borderColor: chakraFilter === i + 1 ? 'var(--accent)' : 'var(--border)', color: chakraFilter === i + 1 ? '#000' : 'var(--text-faint)' }}>{cn}</button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-2)' }}>
          {filtered.map(raga => (
            <button key={raga.number} onClick={() => handleRagaSelect(raga)}
              style={{ width: '100%', textAlign: 'left', padding: isMobile ? '10px var(--space-3)' : '5px var(--space-3)', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', background: selectedRaga.number === raga.number ? 'var(--accent-dim)' : 'transparent', color: selectedRaga.number === raga.number ? 'var(--accent)' : 'var(--text)', marginBottom: 1, display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-faint)', fontFamily: 'monospace', minWidth: 22 }}>{raga.number}</span>
              <div>
                <div style={{ fontSize: isMobile ? '1rem' : '0.78rem', fontWeight: 600 }}>{raga.name}</div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{raga.nameTelugu} · {raga.chakraName}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Right panel: Detail view ──
          Desktop: always visible
          Mobile: full screen when showList=false, hidden when showList=true */}
      <div style={{
        flex: 1,
        minWidth: 0,
        display: isMobile && showList ? 'none' : 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        width: isMobile ? '100%' : undefined,
      }}>

        {/* Rāga header */}
        <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
              {/* Back to list button — mobile only */}
              {isMobile && (
                <button
                  onClick={() => { stopCurrent(); setShowList(true) }}
                  style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--accent)', fontSize: '0.8rem', cursor: 'pointer', flexShrink: 0, marginTop: 2 }}
                >← Rāgas</button>
              )}
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--accent)', margin: 0 }}>{selectedRaga.name}</h2>
              </div>
            </div>

          </div>

        </div>

        {settingsContainer && createPortal(
          <div className="raga-practice-settings" style={{ padding: '0 16px 16px', minWidth: 0 }}>
          <h3 style={{ fontSize: '1rem', marginTop: 12 }}>{selectedRaga.name}</h3>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedRaga.nameDevanagari} · {selectedRaga.nameTelugu}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)', marginTop: 2 }}>
            #{selectedRaga.number} · Chakra {selectedRaga.chakra}: {selectedRaga.chakraName} · {selectedRaga.notes.M === 5 ? 'Śuddha Madhyama' : 'Prati Madhyama'}
          </div>
          <h3 style={{ fontSize: '1rem', marginTop: 12 }}>Swarasthānas</h3>
          <div aria-live="polite" style={{ marginTop: 8, minHeight: 54, padding: '7px 11px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: 10, background: activeNoteDisplay ? `${activeNoteDisplay.svaraInfo.colour}18` : '#F3F0E8', border: `1px solid ${activeNoteDisplay ? `${activeNoteDisplay.svaraInfo.colour}70` : '#D9D2C5'}`, color: '#203633' }}>
            {activeNoteDisplay ? (
              <>
                <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: activeNoteDisplay.svaraInfo.colour, color: '#172421', fontSize: '1rem', fontWeight: 800, fontFamily: 'monospace' }}>{activeNoteDisplay.info.token}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.9rem', lineHeight: 1.35, fontWeight: 800, color: '#173E42' }}>{activeNoteDisplay.svaraInfo.name} <span style={{ fontFamily: 'monospace' }}>({activeNoteDisplay.info.svaraKey})</span></div>
                  <div style={{ fontSize: '0.76rem', lineHeight: 1.4, color: '#394D49' }}>{activeNoteDisplay.svaraInfo.meaning}</div>
                  <div style={{ fontSize: '0.72rem', color: '#52615D', fontFamily: 'monospace' }}>{activeNoteDisplay.info.octave === 'kil' ? '↓ Mandra sthāyi' : activeNoteDisplay.info.octave === 'tar' ? '↑ Tāra sthāyi' : '· Madhya sthāyi'}</div>
                </div>
              </>
            ) : (
              <div style={{ fontSize: '0.8rem', color: '#52615D' }}>Live swarasthāna appears here during playback · Select a note to hear its pitch</div>
            )}
          </div>

          {/* Scale display */}
          <div style={{ marginTop: 'var(--space-2)', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-faint)', marginRight: 2, minWidth: 40 }}>↑ Āro</span>
              {Object.entries(noteInfoMap).filter(([k]) => k.length === 1 && k === k.toLowerCase()).map(([k, info]) => (
                <button key={'asc-' + k} onClick={() => playSingleNote(info)}
                  title={`${SVARA_INFO[info.svaraKey]?.name} — play swara`}
                  style={{ padding: '3px 10px', borderRadius: 'var(--radius-sm)', border: `1px solid ${SVARA_INFO[info.svaraKey]?.colour ?? 'var(--border)'}44`, background: 'var(--surface2)', color: SVARA_INFO[info.svaraKey]?.colour ?? 'var(--text)', fontSize: '0.75rem', fontFamily: 'monospace', cursor: 'pointer', fontWeight: 600 }}>
                  <span>{k}</span><span style={{ display: 'block', marginTop: 1, fontSize: '0.62rem', color: '#243B38', fontWeight: 800 }}>{SVARA_INFO[info.svaraKey]?.name}</span>
                </button>
              ))}
              {(() => { const info = noteInfoMap['S']; return info ? (
                <button key="upper-S" onClick={() => playSingleNote(info)}
                  title={`${SVARA_INFO['S']?.name} — play swara`}
                  style={{ padding: '3px 10px', borderRadius: 'var(--radius-sm)', border: `1px solid ${SVARA_INFO['S']?.colour ?? 'var(--border)'}44`, background: 'var(--surface2)', color: '#c4b5fd', fontSize: '0.75rem', fontFamily: 'monospace', cursor: 'pointer', fontWeight: 600 }}>
                  <span>S</span><span style={{ display: 'block', marginTop: 1, fontSize: '0.62rem', color: '#243B38', fontWeight: 800 }}>{SVARA_INFO.S.name}</span>
                </button>
              ) : null })()}
            </div>
          </div>

          {/* Notation legend */}
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginTop: 2 }}>
              {[
                { sample: 's r g m p d n', desc: 'middle octave', col: 'var(--text)' },
                { sample: 'S R G M P D N', desc: 'upper (Tāra)',  col: 'var(--accent)' },
                { sample: 's, r, g,',      desc: 'lower (Kīḷ)',   col: 'var(--accent2)' },
                { sample: ',',             desc: 'hold (Dīrgha)', col: '#f59e0b' },
                { sample: '| ||',          desc: 'tāla markers',  col: 'var(--text-muted)' },
              ].map(({ sample, desc, col }) => (
                <span key={desc} style={{ fontSize: '0.6rem', fontFamily: 'monospace' }}>
                  <span style={{ color: col }}>{sample}</span>
                  <span style={{ color: 'var(--text-faint)' }}> = {desc}</span>
                </span>
              ))}
            </div>

          <h3 style={{ fontSize: '1rem', marginTop: 16 }}>Playback</h3>
          <div style={{ marginTop: 'var(--space-2)', display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-faint)' }}>Speed</span>
              {SPEEDS.map((sp, i) => (
                <button key={i} onClick={() => { stopCurrent(); setSpeedIdx(i) }} title={sp.desc} aria-pressed={speedIdx === i}
                  style={{ padding: '2px 9px', borderRadius: 99, fontSize: '0.7rem', fontWeight: 600, border: '1px solid', cursor: 'pointer', background: speedIdx === i ? 'var(--accent)' : 'var(--surface2)', borderColor: speedIdx === i ? 'var(--accent)' : 'var(--border)', color: speedIdx === i ? '#000' : 'var(--text-muted)' }}>
                  {sp.label}
                </button>
              ))}
            </div>
            <div style={{ width: 1, height: 18, background: 'var(--border)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-faint)' }}>Play</span>
              {(['aro', 'both', 'avro'] as PlayMode[]).map(pm => (
                <button key={pm} onClick={() => { stopCurrent(); setPlayMode(pm) }} aria-pressed={playMode === pm}
                  style={{ padding: '2px 9px', borderRadius: 99, fontSize: '0.7rem', fontWeight: 600, border: '1px solid', cursor: 'pointer', background: playMode === pm ? 'var(--accent)' : 'var(--surface2)', borderColor: playMode === pm ? 'var(--accent)' : 'var(--border)', color: playMode === pm ? '#000' : 'var(--text-muted)' }}>
                  {pm === 'aro' ? '↑ Āro' : pm === 'avro' ? '↓ Avro' : '↑↓ Both'}
                </button>
              ))}
            </div>
            <div style={{ width: 1, height: 18, background: 'var(--border)' }} />
            <button aria-pressed={loopMode} onClick={() => { const n = !loopMode; setLoopMode(n); loopRef.current = n }}
              style={{ padding: '2px 11px', borderRadius: 99, fontSize: '0.7rem', fontWeight: 600, border: '1px solid', cursor: 'pointer', background: loopMode ? 'var(--accent)' : 'var(--surface2)', borderColor: loopMode ? 'var(--accent)' : 'var(--border)', color: loopMode ? '#000' : 'var(--text-muted)' }}>
              🔁 Loop
            </button>
          </div>

          {/* Playing status bar */}
          {playingIdx !== -1 && (
            <div style={{ marginTop: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', gap: 3 }}>
                {[0, 1, 2].map(d => <div key={d} style={{ width: 3, height: 11, borderRadius: 2, background: 'var(--accent)', opacity: 0.7, animation: `bounce 0.7s ${d * 0.15}s ease-in-out infinite alternate` }} />)}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>{exercises[playingIdx].label}</span>
              {playPhase && (
                <span style={{ fontSize: '0.68rem', padding: '1px 7px', borderRadius: 99, background: playPhase === 'aro' ? 'rgba(100,200,100,0.12)' : 'rgba(200,150,255,0.12)', color: playPhase === 'aro' ? '#86efac' : '#c4b5fd', border: `1px solid ${playPhase === 'aro' ? 'rgba(100,200,100,0.3)' : 'rgba(200,150,255,0.3)'}` }}>
                  {playPhase === 'aro' ? '↑ Ārohaṇa' : '↓ Avarohaṇa'}
                </span>
              )}
              <button onClick={stopCurrent} style={{ fontSize: '0.7rem', padding: '2px 9px', borderRadius: 99, border: '1px solid var(--red)', color: 'var(--red)', cursor: 'pointer', background: 'rgba(248,113,113,0.1)' }}>⏹ Stop</button>
            </div>
          )}

        {/* ── Tab bar ── */}
        <h3 style={{ fontSize: '1rem', marginTop: 16 }}>Exercises</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => handleTabChange(t.id)} aria-pressed={tab === t.id}
              style={{ padding: 'var(--space-2) var(--space-3)', fontSize: '0.78rem', fontWeight: tab === t.id ? 600 : 400, color: tab === t.id ? 'var(--accent)' : 'var(--text-muted)', borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
              {t.label}
              <span style={{ fontSize: '0.58rem', background: 'var(--surface2)', padding: '0px 4px', borderRadius: 99, color: 'var(--text-faint)' }}>{(curriculumExercises[t.id] ?? EXERCISES[t.id]).length}</span>
            </button>
          ))}
        </div>

        {/* ── Sequential playback controls ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '8px var(--space-3)', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', flexShrink: 0 }}>
          <button onClick={playAllCurrentCategory}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 99, border: '1px solid var(--accent)', color: 'var(--accent)', background: 'transparent', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600 }}>
            ▶ Play All {TABS.find(t => t.id === tab)?.label} ({exercises.length})
          </button>
          <button onClick={playAllSelectedRaga}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 99, border: '1px solid var(--accent)', color: 'var(--accent)', background: 'transparent', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600 }}>
            ▶ Play Rāga — all categories
          </button>
          {queueRef.current.length > 0 && (
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Queue: {queueRef.current.length} exercises remaining</span>
          )}
          {(playingIdx !== -1 || queueRef.current.length > 0) && (
            <button onClick={stopCurrent} style={{ padding: '5px 11px', borderRadius: 99, border: '1px solid var(--red)', color: 'var(--red)', background: 'transparent', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600 }}>⏹ Stop queue</button>
          )}
        </div>
          </div>,
          settingsContainer
        )}

        {/* ── Exercise grid ── */}
        <div className={`raga-exercise-grid raga-tab-${tab}`} style={{ flex: 1, minWidth: 0, minHeight: 0, overflowY: 'auto', padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'stretch' }}>
          {exercises.map((ex, idx) => {
            const isPlaying = playingIdx === idx
            const nim = buildNoteInfoMap(selectedRaga)
            const aroTokens = ex.aro.trim().split(/\s+/).filter(Boolean)
            const avroTokens = ex.avro.trim().split(/\s+/).filter(Boolean)
            const aroGroups = groupNotationTokens(aroTokens)
            const avroGroups = groupNotationTokens(avroTokens)
            const aroEvMap = buildDisplayMap(ex.aro, nim)
            const avroEvMap = buildDisplayMap(ex.avro, nim)
            const showAro = playMode === 'both' || playMode === 'aro'
            const showAvro = playMode === 'both' || playMode === 'avro'
            const aroEvents = parseToEvents(ex.aro, nim)
            const avroEvents = parseToEvents(ex.avro, nim)
            const noteCount = aroEvents.filter(e => !e.isRest).length

            return (
              <div key={idx} className="raga-exercise-card" style={{ display: 'block', flex: '0 0 auto', width: '100%', height: 'auto', minHeight: 0, minWidth: 0, background: 'var(--surface)', borderRadius: 'var(--radius)', padding: '14px', border: isPlaying ? '1px solid var(--accent)' : '1px solid var(--border)', transition: 'border-color 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-faint)', fontFamily: 'monospace', background: 'var(--surface2)', padding: '1px 5px', borderRadius: 3 }}>{idx + 1}</span>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: isPlaying ? 'var(--accent)' : 'var(--text)', margin: 0 }}>{ex.label}</h4>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-faint)' }}>{noteCount} notes</span>
                  </div>
                  <button onClick={() => handlePlay(idx)}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 14px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600, border: `1px solid ${isPlaying ? 'var(--red)' : 'var(--accent)'}`, color: isPlaying ? 'var(--red)' : 'var(--accent)', background: isPlaying ? 'rgba(248,113,113,0.08)' : 'transparent', cursor: 'pointer' }}>
                    {isPlaying ? '⏹ Stop' : '▶ Play'}
                  </button>
                </div>

                {showAro && (
                  <div className="raga-note-line" style={{ marginBottom: showAvro ? 'var(--space-1)' : 0, lineHeight: 2.0, minWidth: 0 }}>
                    <span style={{ fontSize: '0.58rem', color: '#86efac', opacity: 0.8, marginRight: 6, fontWeight: 700 }}>↑</span>
                    {aroGroups.map((group, gi) => (
                      <span className="raga-phrase-group" key={`aro-group-${gi}`}>
                        {group.map(({ tok, ti }) => {
                      const evIdx = aroEvMap[ti]
                      const isTala = tok === '|' || tok === '||'
                      const isHold = tok === ','
                      const isActive = isPlaying && playPhase === 'aro' && activeEvIdx?.phase === 'aro'
                        && evIdx !== null && activeEvIdx.evIdx === evIdx && !aroEvents[evIdx]?.isRest
                      const col = isActive ? '#172421' : (isTala ? '#8A8175' : '#263D3A')
                      const activeInfo = isActive && evIdx !== null ? aroEvents[evIdx]?.noteInfo : null
                      const activeBg = activeInfo ? (SVARA_INFO[activeInfo.svaraKey]?.colour ?? 'var(--accent)') : 'var(--accent)'
                      return (
                        <span key={ti} style={{ display: 'inline-block', fontFamily: 'monospace', fontSize: '0.98rem', padding: isTala ? '0 3px' : '3px 6px', marginRight: 2, borderRadius: 4, background: isActive ? activeBg : 'transparent', color: col, fontWeight: isActive ? 800 : isTala ? 300 : 400, opacity: isTala ? 0.35 : 1, transition: 'background 0.05s' }}>
                          {isHold ? '—' : (isActive && activeInfo ? activeInfo.svaraKey : tok)}
                        </span>
                      )
                        })}
                      </span>
                    ))}
                  </div>
                )}

                {showAvro && (
                  <div className="raga-note-line" style={{ lineHeight: 2.0, minWidth: 0 }}>
                    <span style={{ fontSize: '0.58rem', color: '#c4b5fd', opacity: 0.8, marginRight: 6, fontWeight: 700 }}>↓</span>
                    {avroGroups.map((group, gi) => (
                      <span className="raga-phrase-group" key={`avro-group-${gi}`}>
                        {group.map(({ tok, ti }) => {
                      const evIdx = avroEvMap[ti]
                      const isTala = tok === '|' || tok === '||'
                      const isHold = tok === ','
                      const isActive = isPlaying && playPhase === 'avro' && activeEvIdx?.phase === 'avro'
                        && evIdx !== null && activeEvIdx.evIdx === evIdx && !avroEvents[evIdx]?.isRest
                      const col = isActive ? '#172421' : (isTala ? '#8A8175' : '#263D3A')
                      const activeInfo = isActive && evIdx !== null ? avroEvents[evIdx]?.noteInfo : null
                      const activeBg = activeInfo ? (SVARA_INFO[activeInfo.svaraKey]?.colour ?? '#c4b5fd') : '#c4b5fd'
                      return (
                        <span key={ti} style={{ display: 'inline-block', fontFamily: 'monospace', fontSize: '0.98rem', padding: isTala ? '0 3px' : '3px 6px', marginRight: 2, borderRadius: 4, background: isActive ? activeBg : 'transparent', color: col, fontWeight: isActive ? 800 : isTala ? 300 : 400, opacity: isTala ? 0.35 : 1, transition: 'background 0.05s' }}>
                          {isHold ? '—' : (isActive && activeInfo ? activeInfo.svaraKey : tok)}
                        </span>
                      )
                        })}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
