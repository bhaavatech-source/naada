import type { InstrumentType, TrajectoryPoint } from '../types/gamaka'

// Sum-normalized, in-phase partials bound the waveform before the output envelope.
export const GAMAKA_HARMONICS = {
  reference: [1],
  veena: [1, 0.55, 0.3, 0.16, 0.08, 0.04],
  flute: [1, 0.12, 0.025, 0.008],
  voice_formants: [1, 0.28, 0.38, 0.2, 0.07, 0.03],
} as const

export type GamakaToneInstrument = keyof typeof GAMAKA_HARMONICS

export function gamakaHarmonics(instrument: InstrumentType): readonly number[] {
  if (instrument === 'tambura') return GAMAKA_HARMONICS.veena
  return GAMAKA_HARMONICS[instrument]
}

/** Shared by realtime playback and offline acoustic regression checks. */
export function scheduleGamakaTone(
  ctx: BaseAudioContext, output: AudioNode, instrument: InstrumentType,
  tonicHz: number, cents: number, startAt: number, duration: number,
  trajectory?: TrajectoryPoint[],
): { source: OscillatorNode; nodes: AudioNode[] } {
  const endAt = startAt + duration
  if (![tonicHz, cents, startAt, duration, endAt].every(Number.isFinite) || tonicHz <= 0 || duration < 0.2 || startAt < 0) {
    throw new Error('Invalid Gamaka tone timing or pitch.')
  }
  if (trajectory && (trajectory.length < 2 || trajectory[0].t_ms !== 0 ||
      Math.abs(trajectory[trajectory.length - 1].t_ms - duration * 1000) > 0.001 ||
      trajectory.some((point, i) => !Number.isFinite(point.cents) || !Number.isFinite(point.t_ms) ||
        point.t_ms < 0 || (i > 0 && point.t_ms <= trajectory[i - 1].t_ms)))) {
    throw new Error('Invalid Gamaka tone contour.')
  }
  const partials = gamakaHarmonics(instrument)
  const sum = partials.reduce((total, amplitude) => total + amplitude, 0)
  const real = new Float32Array(partials.length + 1)
  const imaginary = new Float32Array(partials.length + 1)
  partials.forEach((amplitude, i) => { imaginary[i + 1] = amplitude / sum })
  const source = ctx.createOscillator()
  source.setPeriodicWave(ctx.createPeriodicWave(real, imaginary, { disableNormalization: true }))
  const hz = (offset: number) => tonicHz * 2 ** (offset / 1200)
  const pitches = trajectory ?? [{ t_ms: 0, cents }, { t_ms: duration * 1000, cents }]
  if (pitches.some(point => !Number.isFinite(hz(point.cents)) || hz(point.cents) < 20 || hz(point.cents) >= ctx.sampleRate / 2)) {
    throw new Error('Gamaka pitch is outside the supported audio range.')
  }
  source.frequency.setValueAtTime(hz(pitches[0].cents), startAt)
  for (const point of pitches.slice(1)) {
    // Exponential Hz ramps are linear in cents, matching the scoring/chart clock.
    source.frequency.exponentialRampToValueAtTime(hz(point.cents), startAt + point.t_ms / 1000)
  }

  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  // Lowpass Q is specified in dB: -6 dB avoids resonant gain at the cutoff.
  filter.Q.value = -6
  filter.frequency.setValueAtTime(Math.min(ctx.sampleRate * 0.4, instrument === 'veena' || instrument === 'tambura' ? 5000 : 6000), startAt)
  if (instrument === 'veena' || instrument === 'tambura') {
    filter.frequency.exponentialRampToValueAtTime(1600, startAt + Math.min(0.6, duration * 0.5))
  }
  const envelope = ctx.createGain()
  const plucked = instrument === 'veena' || instrument === 'tambura'
  const attack = plucked ? 0.018 : 0.07
  const release = Math.min(0.16, duration * 0.25)
  envelope.gain.setValueAtTime(0, startAt)
  envelope.gain.linearRampToValueAtTime(0.45, startAt + attack)
  if (plucked) envelope.gain.exponentialRampToValueAtTime(0.24, startAt + Math.min(0.5, duration * 0.5))
  envelope.gain.setValueAtTime(plucked ? 0.24 : 0.45, endAt - release)
  envelope.gain.linearRampToValueAtTime(0, endAt)
  source.connect(filter)
  filter.connect(envelope)
  envelope.connect(output)
  source.start(startAt)
  source.stop(endAt)
  return { source, nodes: [filter, envelope] }
}
