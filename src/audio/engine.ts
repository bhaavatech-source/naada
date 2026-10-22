import type { InstrumentId } from '../types/index'


let _ctx: AudioContext | null = null

// Sources created by synthNote are tracked so transport Stop/Pause can release
// scheduled as well as currently sounding synthesized notes.
const activePlaybackSources = new Set<AudioScheduledSourceNode>()

function trackPlaybackSource<T extends AudioScheduledSourceNode>(source: T, shouldTrack = true): T {
  if (shouldTrack) {
    activePlaybackSources.add(source)
    source.addEventListener('ended', () => activePlaybackSources.delete(source), { once: true })
  }
  return source
}

export function stopAllSynthNotes(): void {
  const ctx = _ctx
  if (!ctx) return
  const stopAt = ctx.currentTime + 0.005
  for (const source of Array.from(activePlaybackSources)) {
    try {
      source.stop(stopAt)
    } catch {
      // A source may already have been stopped or may have ended.
      activePlaybackSources.delete(source)
    }
  }
}

export function getAudioContext(): AudioContext {
  if (!_ctx) _ctx = new (window.AudioContext ?? (window as any).webkitAudioContext)()
  if (_ctx.state === 'suspended') _ctx.resume()
  return _ctx
}
export function unlockAudio() {
  const ctx = getAudioContext()
  if (ctx.state === 'suspended') ctx.resume()
}
export function semitonesToHz(tonicHz: number, semitones: number): number {
  return tonicHz * Math.pow(2, semitones / 12)
}

export const NOTE_SEMITONES: Record<string, number> = {
  'S':0,'S.':12,'S,': -12,
  'R':2,'R.':14,'R,': -10,
  'G':4,'G.':16,
  'M':5,'M.':17,
  'P':7,'P.':19,'P,': -5,
  'D':9,'D.':21,'D,': -3,
  'N':11,'N.':23,'N,': -1,
  'R1':1,'R2':2,'R3':3,'G1':3,'G2':4,'G3':4,
  'M1':5,'M2':6,'D1':8,'D2':9,'D3':10,'N1':9,'N2':10,'N3':11,
}

export function tryParseNoteToken(token: string): number | null {
  const normalized = token.trim()
  if (!normalized || normalized === '|' || normalized === '||') return null
  const value = NOTE_SEMITONES[normalized]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

/** Backwards-compatible parser. New playback code should use tryParseNoteToken
 * when it must distinguish an unknown token from the tonic (0 semitones). */
export function parseNoteToken(token: string): number {
  return tryParseNoteToken(token) ?? 0
}

// ─── Shared ADSR helper ────────────────────────────────────────────────────────
function applyEnv(
  gain: GainNode,
  attack: number, decay: number, sustain: number, release: number,
  duration: number, peakVol: number, startAt = gain.context.currentTime
) {
  const ctx = gain.context
  const now = startAt
  gain.gain.cancelScheduledValues(now)
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(peakVol, now + attack)
  gain.gain.linearRampToValueAtTime(peakVol * sustain, now + attack + decay)
  gain.gain.setValueAtTime(peakVol * sustain, now + Math.max(attack + decay, duration - release))
  gain.gain.linearRampToValueAtTime(0, now + duration + 0.01)
}

// ─── Vibrato helper ────────────────────────────────────────────────────────────
function addVibrato(
  ctx: BaseAudioContext, target: AudioParam,
  rate: number, depth: number, delay: number, duration: number, startAt = ctx.currentTime
) {
  const lfo = trackPlaybackSource(ctx.createOscillator(), ctx === _ctx)
  const lfoGain = ctx.createGain()
  lfo.type = 'sine'
  lfo.frequency.value = rate
  lfoGain.gain.setValueAtTime(0, startAt)
  lfoGain.gain.linearRampToValueAtTime(depth, startAt + delay)
  lfo.connect(lfoGain)
  lfoGain.connect(target)
  lfo.start(startAt)
  lfo.stop(startAt + duration + 0.1)
}

// ─── White noise helper ────────────────────────────────────────────────────────
function createNoiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  const length = ctx.sampleRate * 0.2
  const buf = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
  return buf
}

// ─── Main synth ────────────────────────────────────────────────────────────────
export function synthNote(
  hz: number, duration: number, instrument: InstrumentId, volume: number,
  when?: number, targetContext?: BaseAudioContext, targetDestination?: AudioNode,
) {
  const ctx = targetContext ?? getAudioContext()
  const output = targetDestination ?? ctx.destination
  const out = ctx.createGain()
  out.gain.value = volume
  out.connect(output)
  // Live playback gets a tiny scheduling lead; offline renders stay sample-aligned.
  const now = targetContext
    ? Math.max(ctx.currentTime, when ?? ctx.currentTime)
    : Math.max(ctx.currentTime + 0.005, when ?? ctx.currentTime)
  const dur = Math.max(duration, 0.15)

  switch (instrument) {

    // ── HUMAN VOICE ─────────────────────────────────────────────────────────
    // Warm sine with formant bandpass filters (vowel "Aa"), slow onset, deep vibrato
    case 'voice': {
      const src = trackPlaybackSource(ctx.createOscillator(), ctx === _ctx)
      src.type = 'sine'
      src.frequency.value = hz

      // Formant filters for vowel "aaaa" (F1~700Hz, F2~1200Hz)
      const f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 700; f1.Q.value = 8
      const f2 = ctx.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 1200; f2.Q.value = 6

      const gDry = ctx.createGain(); gDry.gain.value = 0.55
      const gF1  = ctx.createGain(); gF1.gain.value  = 0.30
      const gF2  = ctx.createGain(); gF2.gain.value  = 0.15

      const env = ctx.createGain()
      src.connect(gDry); gDry.connect(env)
      src.connect(f1);   f1.connect(gF1); gF1.connect(env)
      src.connect(f2);   f2.connect(gF2); gF2.connect(env)
      env.connect(out)

      applyEnv(env, 0.12, 0.08, 0.80, 0.18, dur, 1, now)
      // Vibrato starts late (like a singer finds the note first)
      addVibrato(ctx, src.frequency, 5.2, 5.5, 0.22, dur, now)
      src.start(now); src.stop(now + dur + 0.2)
      break
    }

    // ── VĪṆĀ ────────────────────────────────────────────────────────────────
    // Sharp pluck, bright onset, long resonant exponential decay (like plucked string)
    case 'veena': {
      // Harmonics: bright, metallic
      const ratios: [number, number][] = [[1,1],[2,0.55],[3,0.32],[4,0.18],[5,0.09],[6,0.05]]
      ratios.forEach(([r, a]) => {
        const osc = trackPlaybackSource(ctx.createOscillator(), ctx === _ctx)
        osc.type = r === 1 ? 'sawtooth' : 'sine'
        osc.frequency.value = hz * r
        const g = ctx.createGain()
        // Exponential decay — characteristic pluck shape
        g.gain.setValueAtTime(a * volume * 1.1, now + 0.008)
        g.gain.exponentialRampToValueAtTime(a * volume * 0.001, now + dur * 1.3)
        osc.connect(g); g.connect(output)
        osc.start(now); osc.stop(now + dur + 0.3)
      })
      // Sympathetic string buzz (quiet high harmonic flutter)
      const buzz = trackPlaybackSource(ctx.createOscillator(), ctx === _ctx)
      buzz.type = 'triangle'; buzz.frequency.value = hz * 7.1 // slightly detuned overtone
      const bg = ctx.createGain()
      bg.gain.setValueAtTime(volume * 0.04, now); bg.gain.exponentialRampToValueAtTime(0.0001, now + 0.4)
      buzz.connect(bg); bg.connect(output)
      buzz.start(now); buzz.stop(now + 0.5)
      return // bypass out node (handled above directly)
    }

    // ── VIOLIN / SĀRAṄGĪ ────────────────────────────────────────────────────
    // Slow bow attack, rich sawtooth, heavy continuous vibrato
    case 'violin': {
      const ratios: [number, number][] = [[1,1],[2,0.65],[3,0.45],[4,0.22],[5,0.12]]
      const env = ctx.createGain()
      env.connect(out)
      applyEnv(env, 0.07, 0.06, 0.85, 0.14, dur, 1, now)
      ratios.forEach(([r, a]) => {
        const osc = trackPlaybackSource(ctx.createOscillator(), ctx === _ctx)
        osc.type = 'sawtooth'; osc.frequency.value = hz * r
        const g = ctx.createGain(); g.gain.value = a
        // Bow pressure flutter — small random detuning on upper harmonics
        if (r > 1) osc.detune.value = (Math.random() - 0.5) * 4
        osc.connect(g); g.connect(env)
        osc.start(now); osc.stop(now + dur + 0.2)
      })
      // Strong continuous vibrato from start
      break
    }

    // ── VĀṂŚĪ FLUTE ─────────────────────────────────────────────────────────
    // Breathy attack (white noise burst), then pure sine, gentle late vibrato
    case 'flute': {
      // Noise burst for breath attack
      const noiseBuf = createNoiseBuffer(ctx)
      const noise = trackPlaybackSource(ctx.createBufferSource(), ctx === _ctx); noise.buffer = noiseBuf
      const nFilter = ctx.createBiquadFilter(); nFilter.type = 'bandpass'
      nFilter.frequency.value = hz * 1.5; nFilter.Q.value = 3
      const nEnv = ctx.createGain()
      nEnv.gain.setValueAtTime(volume * 0.18, now)
      nEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.09)
      noise.connect(nFilter); nFilter.connect(nEnv); nEnv.connect(output)
      noise.start(now); noise.stop(now + 0.1)

      // Pure tone — sine with gentle 2nd harmonic
      const osc1 = trackPlaybackSource(ctx.createOscillator(), ctx === _ctx); osc1.type = 'sine'; osc1.frequency.value = hz
      const osc2 = trackPlaybackSource(ctx.createOscillator(), ctx === _ctx); osc2.type = 'sine'; osc2.frequency.value = hz * 2
      const g1 = ctx.createGain(); g1.gain.value = 0.78
      const g2 = ctx.createGain(); g2.gain.value = 0.22
      const env = ctx.createGain(); env.connect(out)
      applyEnv(env, 0.06, 0.04, 0.88, 0.10, dur, 1, now)
      osc1.connect(g1); g1.connect(env)
      osc2.connect(g2); g2.connect(env)
      // Late vibrato (flute vibrato starts after note is established)
      addVibrato(ctx, osc1.frequency, 5.0, 3.5, dur * 0.35, dur, now)
      osc1.start(now); osc1.stop(now + dur + 0.15)
      osc2.start(now); osc2.stop(now + dur + 0.15)
      break
    }

    // ── SITAR ────────────────────────────────────────────────────────────────
    // Very sharp attack, bright metallic, fast exponential decay, chikari buzz
    case 'sitar': {
      const ratios: [number, number][] = [[1,1],[2,0.72],[3,0.52],[4,0.35],[5,0.22],[6,0.13],[7,0.07]]
      ratios.forEach(([r, a]) => {
        const osc = trackPlaybackSource(ctx.createOscillator(), ctx === _ctx)
        osc.type = 'sawtooth'; osc.frequency.value = hz * r
        const g = ctx.createGain()
        // Very fast pluck decay — sitar is percussive
        g.gain.setValueAtTime(a * volume, now + 0.003)
        g.gain.exponentialRampToValueAtTime(0.0001, now + dur * 0.9)
        osc.connect(g); g.connect(output)
        osc.start(now); osc.stop(now + dur + 0.1)
      })
      // Chikari (sympathetic drone string) — very high, quiet
      const chikari = trackPlaybackSource(ctx.createOscillator(), ctx === _ctx)
      chikari.type = 'triangle'; chikari.frequency.value = hz * 2 + 5 // slightly sharp
      const cg = ctx.createGain()
      cg.gain.setValueAtTime(volume * 0.07, now); cg.gain.exponentialRampToValueAtTime(0.0001, now + 0.25)
      chikari.connect(cg); cg.connect(output)
      chikari.start(now); chikari.stop(now + 0.3)
      return
    }

    // ── HARMONIUM ───────────────────────────────────────────────────────────
    // Reed organ — instant on, flat sustain, instant off, slightly nasal
    case 'harmonium': {
      const ratios: [number, number][] = [[1,1],[2,0.48],[3,0.18],[4,0.08],[5,0.04]]
      const env = ctx.createGain(); env.connect(out)
      // Harmonium is very fast attack (bellows already pumped), flat sustain, quick cutoff
      applyEnv(env, 0.015, 0.04, 0.95, 0.04, dur, 1, now)
      ratios.forEach(([r, a]) => {
        const osc = trackPlaybackSource(ctx.createOscillator(), ctx === _ctx)
        // Square gives nasal reed character
        osc.type = r === 1 ? 'square' : 'sawtooth'
        osc.frequency.value = hz * r
        const g = ctx.createGain(); g.gain.value = a
        osc.connect(g); g.connect(env)
        osc.start(now); osc.stop(now + dur + 0.1)
      })
      break
    }

    // ── PIANO ────────────────────────────────────────────────────────────────
    // Sharp hammer attack, long exponential decay, NO vibrato, percussive
    case 'piano': {
      const ratios: [number, number][] = [[1,1],[2,0.42],[3,0.18],[4,0.09],[5,0.04]]
      ratios.forEach(([r, a]) => {
        const osc = trackPlaybackSource(ctx.createOscillator(), ctx === _ctx)
        osc.type = 'triangle'; osc.frequency.value = hz * r
        const g = ctx.createGain()
        // Piano = very fast attack + natural exponential decay (no sustain pedal)
        g.gain.setValueAtTime(a * volume, now + 0.003)
        g.gain.exponentialRampToValueAtTime(a * volume * 0.3, now + 0.35)
        g.gain.exponentialRampToValueAtTime(0.0001, now + Math.max(dur, 0.8))
        osc.connect(g); g.connect(output)
        osc.start(now); osc.stop(now + Math.max(dur, 0.8) + 0.1)
      })
      return
    }

    // ── NĀDASVARAM ───────────────────────────────────────────────────────────
    // Very loud outdoor reed, rich odd harmonics, wide slow vibrato, nasal
    case 'nadaswaram': {
      const ratios: [number, number][] = [[1,1],[2,0.82],[3,0.65],[4,0.45],[5,0.32],[6,0.22],[7,0.14]]
      const env = ctx.createGain(); env.connect(out)
      applyEnv(env, 0.04, 0.12, 0.80, 0.18, dur, 1, now)
      const primaryOsc = trackPlaybackSource(ctx.createOscillator(), ctx === _ctx)
      primaryOsc.type = 'sawtooth'; primaryOsc.frequency.value = hz
      // Wide, slow vibrato — outdoors ceremonial character
      addVibrato(ctx, primaryOsc.frequency, 4.5, 10, 0.06, dur, now)
      ratios.forEach(([r, a]) => {
        const osc = r === 1 ? primaryOsc : trackPlaybackSource(ctx.createOscillator(), ctx === _ctx)
        if (r !== 1) { osc.type = 'sawtooth'; osc.frequency.value = hz * r }
        const g = ctx.createGain(); g.gain.value = a
        osc.connect(g); g.connect(env)
        osc.start(now); osc.stop(now + dur + 0.2)
      })
      break
    }

    // ── SĀRAṄGĪ ──────────────────────────────────────────────────────────────
    // Bowed gut strings, grittier than violin, slower bow attack, nasal resonance
    case 'sarangi': {
      const ratios: [number, number][] = [[1,1],[2,0.58],[3,0.40],[4,0.25],[5,0.13]]
      const env = ctx.createGain(); env.connect(out)
      // Slower attack than violin — heavier bow pressure needed
      applyEnv(env, 0.10, 0.07, 0.82, 0.20, dur, 1, now)
      ratios.forEach(([r, a]) => {
        const osc = trackPlaybackSource(ctx.createOscillator(), ctx === _ctx)
        osc.type = 'sawtooth'; osc.frequency.value = hz * r
        if (r > 1) osc.detune.value = (Math.random() - 0.5) * 8 // more detuning = grittier
        const g = ctx.createGain(); g.gain.value = a
        osc.connect(g); g.connect(env)
        osc.start(now); osc.stop(now + dur + 0.2)
      })
      // Strong vibrato — sarangi players use heavy finger vibrato
      const lfo = trackPlaybackSource(ctx.createOscillator(), ctx === _ctx); lfo.type = 'sine'; lfo.frequency.value = 5.8
      const lg = ctx.createGain(); lg.gain.setValueAtTime(0, now); lg.gain.linearRampToValueAtTime(8, now + 0.18)
      // Connect to all oscillators is complex here — use env gain modulation instead
      const envLfo = trackPlaybackSource(ctx.createOscillator(), ctx === _ctx); envLfo.type = 'sine'; envLfo.frequency.value = 5.8
      const elg = ctx.createGain(); elg.gain.value = 0.04
      envLfo.connect(elg); elg.connect(env.gain)
      envLfo.start(now); envLfo.stop(now + dur + 0.2)
      break
    }

    // ── VIOLIN (rebuild with proper vibrato) ──────────────────────────────────
    default: {
      const ratios: [number, number][] = [[1,1],[2,0.65],[3,0.45],[4,0.22]]
      const env = ctx.createGain(); env.connect(out)
      applyEnv(env, 0.07, 0.06, 0.85, 0.14, dur, 1, now)
      ratios.forEach(([r, a]) => {
        const osc = trackPlaybackSource(ctx.createOscillator(), ctx === _ctx)
        osc.type = 'sawtooth'; osc.frequency.value = hz * r
        if (r === 1) addVibrato(ctx, osc.frequency, 6.2, 7, 0.12, dur, now)
        const g = ctx.createGain(); g.gain.value = a
        osc.connect(g); g.connect(env)
        osc.start(now); osc.stop(now + dur + 0.2)
      })
      break
    }
  }
}

// ── Fix violin case that fell through ──────────────────────────────────────────
// (violin handled in the default case above with proper vibrato)

export function playClick(freq: number, vol: number, duration: number, when?: number) {
  const ctx = getAudioContext()
  const startAt = Math.max(ctx.currentTime, when ?? ctx.currentTime)
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = 'sine'; osc.frequency.value = freq
  g.gain.setValueAtTime(Math.max(0.0001, vol), startAt)
  g.gain.exponentialRampToValueAtTime(0.001, startAt + duration)
  osc.connect(g); g.connect(ctx.destination)
  osc.start(startAt); osc.stop(startAt + duration + 0.01)
}

interface SequenceNote { hz: number; duration: number }
let _seqStop = false
export function stopSequence() { _seqStop = true }

export function playSequence(
  notes: SequenceNote[],
  instrument: InstrumentId,
  volume: number,
  onNote: (idx: number) => void,
  onDone: () => void
): () => void {
  _seqStop = false
  let i = 0
  const step = () => {
    if (_seqStop || i >= notes.length) { onDone(); return }
    const note = notes[i]
    onNote(i)
    synthNote(note.hz, note.duration * 0.9, instrument, volume)
    i++
    setTimeout(step, note.duration * 1000)
  }
  step()
  return () => { _seqStop = true }
}

// ── Tanpura drone ─────────────────────────────────────────────────────────────
const tanpuraState = { nodes: [] as OscillatorNode[], active: false }
export const tanpura = {
  start(tonicHz: number, volume: number) {
    if (tanpuraState.active) this.stop()
    const ctx = getAudioContext()
    const master = ctx.createGain()
    master.gain.value = volume * 0.18
    master.connect(ctx.destination)
    // Sa Pa Sa (lower) Sa (upper) — standard tanpura tuning
    const drones = [tonicHz, tonicHz * 1.5, tonicHz * 0.5, tonicHz * 2]
    drones.forEach((h, i) => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = 'triangle'; osc.frequency.value = h
      g.gain.setValueAtTime(0, ctx.currentTime)
      g.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.3 + i * 0.2)
      osc.connect(g); g.connect(master)
      osc.start(); tanpuraState.nodes.push(osc)
    })
    tanpuraState.active = true
  },
  stop() {
    const ctx = getAudioContext()
    tanpuraState.nodes.forEach(osc => { try { osc.stop(ctx.currentTime + 0.1) } catch {} })
    tanpuraState.nodes = []; tanpuraState.active = false
  }
}

// src/audio/engine.ts

/**
 * Tokenise a svara notation string into playable tokens.
 * Strips tāla bar markers (| and ||) so they are never mapped to pitches.
 * This is the SINGLE place where notation → tokens conversion happens
 * for the entire app.
 */
export function tokeniseNotation(notation: string): string[] {
  return notation
    .split(/\s+/)
    .filter(Boolean)
    .filter(t => t !== '|' && t !== '||');
}


export interface GamakaPitchPoint {
  t_ms: number
  cents: number
}

/**
 * Plays a continuous Vina-style harmonic glide.
 * cents are measured relative to the tonic (Sa).
 */


export function playGamakaGlide(
  tonicHz: number,
  points: GamakaPitchPoint[],
  durationMs: number,
  volume = 0.18,
  instrument: InstrumentId = 'veena',
): void {
  if (
    !Number.isFinite(tonicHz) ||
    tonicHz <= 0 ||
    !Number.isFinite(durationMs) ||
    durationMs <= 0 ||
    points.length < 2 ||
    !Number.isFinite(volume) ||
    volume <= 0
  ) {
    return
  }

  // Keep only valid points within the glide duration.
  const validPoints = points
    .filter(
      p =>
        Number.isFinite(p.t_ms) &&
        Number.isFinite(p.cents) &&
        p.t_ms >= 0 &&
        p.t_ms <= durationMs,
    )
    .map(p => ({ t_ms: p.t_ms, cents: p.cents }))
    .sort((a, b) => a.t_ms - b.t_ms)

  if (validPoints.length < 2) return

  // Resolve duplicate timestamps deterministically: the last point wins.
  const sortedPoints: GamakaPitchPoint[] = []
  for (const point of validPoints) {
    const last = sortedPoints[sortedPoints.length - 1]
    if (last && last.t_ms === point.t_ms) {
      sortedPoints[sortedPoints.length - 1] = point
    } else {
      sortedPoints.push(point)
    }
  }

  if (sortedPoints.length < 2) return

  // Extend the contour to the start and end if necessary.
  if (sortedPoints[0].t_ms > 0) {
    sortedPoints.unshift({
      t_ms: 0,
      cents: sortedPoints[0].cents,
    })
  }

  if (sortedPoints[sortedPoints.length - 1].t_ms < durationMs) {
    sortedPoints.push({
      t_ms: durationMs,
      cents: sortedPoints[sortedPoints.length - 1].cents,
    })
  }

  const ctx = getAudioContext()

  // Resume a suspended context when the browser permits it.
  if (ctx.state === 'suspended') {
    void ctx.resume().catch(() => {
      // Playback may require a user gesture or browser permission.
    })
  }

  const startAt = ctx.currentTime + 0.02
  const duration = durationMs / 1000
  const endAt = startAt + duration

  // Instrument-specific approximations using the existing InstrumentId.
  // These shape the sound; they do not model the full acoustics of
  // the corresponding physical instruments.
  const profiles: Record<
    InstrumentId,
    {
      harmonics: number[]
      waveform: OscillatorType
      attack: number
      release: number
      sustain: number
    }
  > = {
    veena: {
      harmonics: [1, 0.55, 0.32, 0.18, 0.09],
      waveform: 'sawtooth',
      attack: 0.012,
      release: 0.12,
      sustain: 0.72,
    },
    violin: {
      harmonics: [1, 0.4, 0.24, 0.13, 0.06],
      waveform: 'sawtooth',
      attack: 0.07,
      release: 0.12,
      sustain: 0.9,
    },
    flute: {
      harmonics: [1, 0.12, 0.045, 0.015],
      waveform: 'sine',
      attack: 0.09,
      release: 0.1,
      sustain: 0.92,
    },
    sitar: {
      harmonics: [1, 0.65, 0.4, 0.24, 0.14, 0.07],
      waveform: 'sawtooth',
      attack: 0.008,
      release: 0.14,
      sustain: 0.68,
    },
    harmonium: {
      harmonics: [1, 0.34, 0.16, 0.07],
      waveform: 'square',
      attack: 0.025,
      release: 0.08,
      sustain: 0.9,
    },
    piano: {
      harmonics: [1, 0.45, 0.22, 0.1, 0.04],
      waveform: 'triangle',
      attack: 0.006,
      release: 0.18,
      sustain: 0.58,
    },
    nadaswaram: {
      harmonics: [1, 0.68, 0.44, 0.27, 0.16, 0.08],
      waveform: 'sawtooth',
      attack: 0.025,
      release: 0.1,
      sustain: 0.86,
    },
    sarangi: {
      harmonics: [1, 0.48, 0.3, 0.16, 0.08],
      waveform: 'sawtooth',
      attack: 0.055,
      release: 0.13,
      sustain: 0.88,
    },
    voice: {
      harmonics: [1, 0.3, 0.13, 0.055],
      waveform: 'sine',
      attack: 0.06,
      release: 0.1,
      sustain: 0.88,
    },
  }

  const profile = profiles[instrument] ?? profiles.veena

  // Normalize harmonic energy to avoid excessive volume as harmonics change.
  const totalLevel = profile.harmonics.reduce(
    (sum, level) => sum + level,
    0,
  )
  const normalizedLevels = profile.harmonics.map(
    level => level / Math.max(totalLevel, 0.001),
  )

  const master = ctx.createGain()
  master.gain.setValueAtTime(1, startAt)
  master.connect(ctx.destination)

  const attack = Math.min(profile.attack, duration * 0.25)
  const release = Math.min(profile.release, duration * 0.4)
  const releaseAt = Math.max(startAt + attack, endAt - release)
  const peak = Math.min(volume, 1) * profile.sustain

  master.gain.setValueAtTime(0.0001, startAt)
  master.gain.linearRampToValueAtTime(
    Math.max(peak, 0.0001),
    startAt + attack,
  )
  master.gain.setValueAtTime(
    Math.max(peak, 0.0001),
    releaseAt,
  )
  master.gain.linearRampToValueAtTime(0.0001, endAt)

  const interpolateCents = (timeMs: number): number => {
    if (timeMs <= sortedPoints[0].t_ms) {
      return sortedPoints[0].cents
    }

    for (let i = 0; i < sortedPoints.length - 1; i++) {
      const left = sortedPoints[i]
      const right = sortedPoints[i + 1]

      if (timeMs <= right.t_ms) {
        const span = right.t_ms - left.t_ms
        const fraction =
          span > 0 ? (timeMs - left.t_ms) / span : 1

        return left.cents + (right.cents - left.cents) * fraction
      }
    }

    return sortedPoints[sortedPoints.length - 1].cents
  }

  // Schedule interpolated pitches on the audio clock. Intermediate
  // samples approximate a linear-in-cents trajectory.
  const stepMs = 10

  const harmonics = profile.harmonics.map((_, index) => {
    const oscillator = ctx.createOscillator()
    const harmonicGain = ctx.createGain()

    oscillator.type = profile.waveform

    const initialCents = interpolateCents(0)
    const initialHz =
      tonicHz * 2 ** (initialCents / 1200)

    oscillator.frequency.setValueAtTime(
      initialHz,
      startAt,
    )

    for (
      let timeMs = stepMs;
      timeMs < durationMs;
      timeMs += stepMs
    ) {
      const cents = interpolateCents(timeMs)
      const frequency = tonicHz * 2 ** (cents / 1200)

      oscillator.frequency.linearRampToValueAtTime(
        frequency,
        startAt + timeMs / 1000,
      )
    }

    const finalCents = interpolateCents(durationMs)
    oscillator.frequency.linearRampToValueAtTime(
      tonicHz * 2 ** (finalCents / 1200),
      endAt,
    )

    harmonicGain.gain.setValueAtTime(
      normalizedLevels[index],
      startAt,
    )

    oscillator.connect(harmonicGain)
    harmonicGain.connect(master)

    oscillator.start(startAt)
    oscillator.stop(endAt + 0.02)

    return { oscillator, harmonicGain }
  })

  // Disconnect nodes after their scheduled stop to release resources.
  const cleanup = () => {
    for (const node of harmonics) {
      try {
        node.oscillator.disconnect()
        node.harmonicGain.disconnect()
      } catch {
        // Already disconnected.
      }
    }

    try {
      master.disconnect()
    } catch {
      // Already disconnected.
    }
  }

  // The oscillator end time is scheduled independently of this timer.
  // This timer only performs cleanup; it does not schedule pitch changes.
  const cleanupDelay = Math.max(
    0,
    (endAt - ctx.currentTime + 0.1) * 1000,
  )
  setTimeout(cleanup, cleanupDelay)
}

  