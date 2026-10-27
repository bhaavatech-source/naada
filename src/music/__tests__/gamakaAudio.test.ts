import { GAMAKA_PROFILES, GAMAKA_EXERCISES } from '../../data/gamakaCatalogData'
import curriculum from '../../data/gamaka-vocal-trainer-and-notation-v2.json'
import { scheduleGamakaTone, GAMAKA_HARMONICS, type GamakaToneInstrument } from '../../audio/gamakaTone'
import { buildGamakaPracticePlan, detectGamakaPitch, interpolateGamaka } from '../gamakaPractice'
import type { TrajectoryPoint } from '../../types/gamaka'

/** Run in a browser: OfflineAudioContext renders the actual production audio graph. */
export async function runGamakaAudioTests(): Promise<{ checks: number; maxPeak: number }> {
  let checks = 0
  let maxPeak = 0
  const check = (condition: boolean, message: string) => {
    if (!condition) throw new Error(`Gamaka audio: ${message}`)
    checks++
  }
  const render = async (instrument: GamakaToneInstrument, tonic: number, sampleRate: number, duration: number, trajectory?: TrajectoryPoint[]) => {
    const ctx = new OfflineAudioContext(1, Math.ceil((duration + 0.15) * sampleRate), sampleRate)
    scheduleGamakaTone(ctx, ctx.destination, instrument, tonic, 0, 0.05, duration, trajectory)
    const data = (await ctx.startRendering()).getChannelData(0)
    let peak = 0
    let finite = true
    for (const value of data) {
      finite = finite && Number.isFinite(value)
      peak = Math.max(peak, Math.abs(value))
    }
    check(finite, 'rendered samples are finite')
    maxPeak = Math.max(maxPeak, peak)
    check(peak > 0.05 && peak <= 0.451, `${instrument}: audible output with headroom (peak ${peak}, tonic ${tonic}, rate ${sampleRate})`)
    check(data.slice(Math.ceil((duration + 0.1) * sampleRate)).every(value => Math.abs(value) < 1e-6), 'silence after release')
    return data
  }
  const pitchAt = (data: Float32Array, seconds: number, rate: number, expectedHz: number, tolerance = 8) => {
    const center = Math.round(seconds * rate)
    const actual = detectGamakaPitch(data.slice(center - 1024, center + 1024), rate)
    check(actual !== null && Math.abs(1200 * Math.log2(actual / expectedHz)) < tolerance, `pitch ${expectedHz.toFixed(2)} Hz within ${tolerance} cents`)
  }
  const signatures: number[][] = []
  for (const instrument of Object.keys(GAMAKA_HARMONICS) as GamakaToneInstrument[]) {
    for (const rate of [44100, 48000]) for (const tonic of [220, 440]) {
      const data = await render(instrument, tonic, rate, 1)
      pitchAt(data, 0.4, rate, tonic)
      check(data.slice(0, Math.floor(0.05 * rate)).every(value => value === 0), 'no sound before scheduled start')
    }
    const data = await render(instrument, 250, 48000, 1)
    const amplitudes = [1, 2, 3].map(harmonic => {
      let sine = 0, cosine = 0
      const length = 9600
      for (let i = 0; i < length; i++) {
        const angle = 2 * Math.PI * 250 * harmonic * i / 48000
        const sample = data[14400 + i]
        sine += sample * Math.sin(angle)
        cosine += sample * Math.cos(angle)
      }
      return Math.hypot(sine, cosine) * 2 / length
    })
    signatures.push(amplitudes.map(value => value / amplitudes[0]))
    if (instrument === 'reference') check(amplitudes[1] / amplitudes[0] < 0.001 && amplitudes[2] / amplitudes[0] < 0.001, 'clean reference has no audible upper partials')
  }
  signatures.forEach((a, i) => signatures.slice(i + 1).forEach(b =>
    check(Math.hypot(a[1] - b[1], a[2] - b[2]) > 0.05, 'rendered tone colours are spectrally distinct')))

  for (const profile of [...GAMAKA_PROFILES, ...GAMAKA_EXERCISES]) {
    const plan = buildGamakaPracticePlan({
      duration_ms: profile.trajectory[profile.trajectory.length - 1].t_ms,
      trajectory_points: profile.trajectory,
    }, 1, curriculum.extended_playback_and_clarity)
    const data = await render('reference', 261.63, 48000, plan.durationMs / 1000, plan.points)
    for (const time of [0.2, 1.2, 2.4, 3.55]) {
      const target = 261.63 * 2 ** (interpolateGamaka(plan.points, time * 1000) / 1200)
      pitchAt(data, 0.05 + time, 48000, target, 30)
    }
  }
  return { checks, maxPeak }
}
