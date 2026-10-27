import curriculum from '../../data/gamaka-vocal-trainer-and-notation-v2.json' with { type: 'json' }
import { NADAIS, SAPTA_TALAS, TALAS } from '../../data/talas'
import { GAMAKA_EXERCISES, GAMAKA_PROFILES } from '../../data/gamakaCatalogData'
import { buildGamakaPracticePlan, detectGamakaPitch, interpolateGamaka } from '../gamakaPractice'
import { evaluateTalaTaps, kriyaForBeat, nadaiPulsePlan, talaBeatAtTime, talaSegments, TALA_JATIS, withTalaJati } from '../talaPractice'
import { GAMAKA_HARMONICS, gamakaHarmonics } from '../../audio/gamakaTone'

export function runTrainerTests(): number {
  let count = 0
  const check = (condition: boolean, message: string) => {
    if (!condition) throw new Error(`Trainer practice: ${message}`)
    count++
  }
  const rejects = (action: () => unknown, message: string) => {
    let threw = false
    try { action() } catch { threw = true }
    check(threw, message)
  }
  check(GAMAKA_HARMONICS.reference.length === 1 && GAMAKA_HARMONICS.reference[0] === 1, 'reference tone has only the fundamental')
  check(new Set(Object.values(GAMAKA_HARMONICS).map(values => values.join())).size === 4, 'four distinct harmonic spectra')
  for (const values of Object.values(GAMAKA_HARMONICS)) {
    check(values[0] === 1 && values.every(value => value > 0 && value <= 1), 'fundamental is the strongest tone partial')
    check(Math.abs(values.reduce((sum, value) => sum + value / values.reduce((a, b) => a + b, 0), 0) - 1) < 1e-10, 'tone partials have bounded normalized sum')
  }
  check(gamakaHarmonics('tambura') === GAMAKA_HARMONICS.veena, 'drone reuses bounded pluck rather than sawtooth buzz')
  check(talaBeatAtTime(-0.12, 120, 8) === 0, 'guide waits on first beat before playback')
  check(talaBeatAtTime(0.499, 120, 8) === 0, 'guide does not advance early')
  check(talaBeatAtTime(0.5, 120, 8) === 1, 'guide follows master BPM')
  check(talaBeatAtTime(4, 120, 8) === 0, 'guide wraps at cycle boundary')
  check(talaBeatAtTime(401.5, 120, 8) === 3, 'guide remains in time over many cycles')
  rejects(() => talaBeatAtTime(0, 0, 8), 'guide rejects invalid tempo')
  rejects(() => talaBeatAtTime(0, 120, 0), 'guide rejects empty cycles')
  check(SAPTA_TALAS.map(t => t.id).join() === 'dhruva,matya,rupaka,jhampa,tisra_triputa,ata,eka', 'all seven basic forms in pedagogical order')
  check(SAPTA_TALAS.map(t => t.beats).join() === '14,10,6,10,7,14,4', 'selected jati beat totals')
  check(TALAS.length === 10 && new Set(TALAS.map(t => t.id)).size === 10, 'existing choices retained with four missing forms added')
  for (const tala of TALAS) {
    check(tala.angas.reduce((sum, a) => sum + a.count, 0) === tala.beats, `${tala.id}: anga counts`)
    const segments = talaSegments(tala)
    check(segments.map(s => s.start - 1).join() === tala.samBeats.join(), `${tala.id}: accents at anga boundaries`)
    check(segments[segments.length - 1].end === tala.beats, `${tala.id}: complete segments`)
    for (let beat = 0; beat < tala.beats; beat++) check(!!kriyaForBeat(tala, beat), `${tala.id}: gesture for beat ${beat}`)
  }
  const eka = SAPTA_TALAS[6], jhampa = SAPTA_TALAS[3]
  const jatiFormulas = [
    (j: number) => 3 * j + 2, (j: number) => 2 * j + 2, (j: number) => j + 2,
    (j: number) => j + 3, (j: number) => j + 4, (j: number) => 2 * j + 4, (j: number) => j,
  ]
  SAPTA_TALAS.forEach((tala, i) => TALA_JATIS.forEach(jati => {
    const variant = withTalaJati(tala, jati.count)
    check(variant.beats === jatiFormulas[i](jati.count), 'all 35 Suladi jati formulas')
    for (let beat = 0; beat < variant.beats; beat++) check(!!kriyaForBeat(variant, beat), 'each jati variant has complete gestures')
  }))
  check(Array.from({ length: 4 }, (_, i) => kriyaForBeat(eka, i)).join() === 'tap,little,ring,middle', 'four distinct Eka gestures')
  check(Array.from({ length: 10 }, (_, i) => kriyaForBeat(jhampa, i)).join() === 'tap,little,ring,middle,index,little,ring,tap,tap,wave', 'long laghu finger loop and separate anudrutam')
  for (const nadai of NADAIS) for (const bpm of [30, 60, 120, 240]) for (const speed of [1, 2, 4, 8]) {
    const pulses = nadaiPulsePlan(nadai, bpm, speed)
    check(pulses.length === nadai.count * speed, `${nadai.id}: correct pulse count`)
    check(Math.abs(pulses[pulses.length - 1].offsetSeconds + pulses[0].durationSeconds - 60 / bpm) < 1e-10, 'speed and nadai must not alter beat length')
    check(pulses.every(p => ['ta', 'ka', 'di', 'mi', 'ki'].includes(p.syllable)), 'all syllables have bundled samples')
  }
  const misra = nadaiPulsePlan(NADAIS[3], 60, 1)
  check(misra.map(p => p.syllable).join(' ') === 'ta ka di mi ta ki ta', 'all seven Misra syllables preserved')
  check(misra.every((p, i) => Math.abs(p.offsetSeconds - i / 7) < 1e-10), 'seven distinct Misra audio onsets')
  rejects(() => nadaiPulsePlan(NADAIS[0], 0, 1), 'reject invalid BPM')
  rejects(() => nadaiPulsePlan(NADAIS[0], 60, 3), 'reject unsupported speed')
  rejects(() => kriyaForBeat(eka, 4), 'reject out-of-range gesture')
  check(evaluateTalaTaps([1000, 2000], [1000, 2000], 120).accuracy === 100, 'correct taps score fully')
  const duplicates = evaluateTalaTaps([1000, 2000], [1000, 1000], 120)
  check(duplicates.matched === 1 && duplicates.missed === 1 && duplicates.extra === 1 && duplicates.accuracy === 50, 'duplicate taps cannot score the same beat twice')
  check(evaluateTalaTaps([1000, 2000], [], 120).accuracy === 0, 'missing taps count against score')
  check(evaluateTalaTaps([1000], [1121], 120).matched === 0, 'out-of-tolerance taps cannot score')
  check(evaluateTalaTaps([1000], [1120], 120).matched === 1, 'tolerance boundary is inclusive')

  const timing = curriculum.extended_playback_and_clarity
  check(GAMAKA_PROFILES.length === 35 && GAMAKA_EXERCISES.length === 12, 'active Acoustic Studio library and all game exercises retained')
  for (const item of [...GAMAKA_PROFILES, ...GAMAKA_EXERCISES]) {
    for (const multiplier of [1, 1.5, 2]) {
      const duration = item.trajectory[item.trajectory.length - 1].t_ms
      const plan = buildGamakaPracticePlan({ duration_ms: duration, trajectory_points: item.trajectory }, multiplier, timing)
      check(plan.durationMs === 3800 * multiplier, `${item.id}: active studio extended timing`)
      item.trajectory.forEach((point, i) => {
        check(plan.sourceTimeToPracticeMs(point.t_ms) === plan.points[i + 1].t_ms, 'game waypoint and audio contour share one time transform')
      })
    }
  }
  for (const level of Object.values(curriculum.curriculum_levels)) for (const exercise of level.exercises) {
    const original = JSON.stringify(exercise.visual_stencil)
    for (const multiplier of [1, 1.5, 2]) {
      const plan = buildGamakaPracticePlan(exercise.visual_stencil, multiplier, timing)
      check(plan.durationMs === 3800 * multiplier, `${exercise.id}: exact extended duration`)
      check(plan.plainDurationMs === 3000 * multiplier, 'plain comparison duration')
      check(plan.points[0].t_ms === 0 && plan.points[plan.points.length - 1].t_ms === plan.durationMs, 'full padded trajectory')
      check(interpolateGamaka(plan.points, 200 * multiplier) === plan.points[0].cents, 'beginning anchor hold')
      check(interpolateGamaka(plan.points, plan.durationMs - 200 * multiplier) === plan.points[plan.points.length - 1].cents, 'ending anchor hold')
      check(plan.points.every((p, i) => i === 0 || p.t_ms > plan.points[i - 1].t_ms), 'strictly increasing shared timestamps')
      exercise.visual_stencil.trajectory_points.forEach((p, i) => {
        check(plan.points[i + 1].cents === p.cents, 'stretch must not change pitch')
        const expectedTime = multiplier * (400 + p.t_ms / exercise.visual_stencil.duration_ms * 2800)
        check(Math.abs(plan.points[i + 1].t_ms - expectedTime) < 1e-8, 'stretch all source points, not only the final duration')
      })
    }
    check(original === JSON.stringify(exercise.visual_stencil), 'source contours must remain unchanged')
  }
  const stencil = curriculum.curriculum_levels.level_1_beginner.exercises[0].visual_stencil
  const standard = buildGamakaPracticePlan(stencil, 1, timing)
  check(standard.durationMs + standard.plainDurationMs + standard.gapMs === 7100, 'exact 7.1-second normal A/B comparison')
  rejects(() => buildGamakaPracticePlan(stencil, 0, timing), 'reject invalid time multiplier')
  rejects(() => buildGamakaPracticePlan({ duration_ms: 1, trajectory_points: [{ t_ms: 0, cents: 0 }, { t_ms: 0, cents: 100 }] }, 1, timing), 'reject duplicate timestamps')
  for (const sampleRate of [44100, 48000]) for (const hz of [110, 220, 261.63, 440, 800]) {
    const signal = Float32Array.from({ length: 4096 }, (_, i) => 0.04 * Math.sin(2 * Math.PI * hz * i / sampleRate))
    const detected = detectGamakaPitch(signal, sampleRate)
    check(detected !== null && Math.abs(1200 * Math.log2(detected / hz)) < 5, 'quiet voiced tone detected within five cents')
  }
  check(detectGamakaPitch(new Float32Array(4096), 48000) === null, 'silence is not a voiced pitch')
  return count
}
