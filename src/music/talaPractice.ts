import type { Nadai, Tala } from '../types'

export type KriyaAction = 'tap' | 'wave' | 'little' | 'ring' | 'middle' | 'index'
export const KRIYA_LABELS: Record<KriyaAction, string> = {
  tap: 'Clap / tap the thigh', wave: 'Wave the hand',
  little: 'Count the little finger', ring: 'Count the ring finger',
  middle: 'Count the middle finger', index: 'Count the index finger',
}
export const TALA_JATIS = [
  { count: 3, name: 'Tisra' }, { count: 4, name: 'Chaturasra' },
  { count: 5, name: 'Khanda' }, { count: 7, name: 'Misra' }, { count: 9, name: 'Sankirna' },
]

export function talaBeatAtTime(elapsedSeconds: number, bpm: number, beats: number): number {
  if (!Number.isFinite(elapsedSeconds) || !Number.isFinite(bpm) || bpm <= 0 || !Number.isInteger(beats) || beats < 1) {
    throw new Error('Invalid tāla playback clock.')
  }
  return Math.floor(Math.max(0, elapsedSeconds) * bpm / 60) % beats
}

export function withTalaJati(base: Tala, count: number): Tala {
  const jati = TALA_JATIS.find(item => item.count === count)
  if (!jati || base.family === 'capu') throw new Error('Jāti applies to the laghu of a Sulādi tāla, not a Cāpu pulse group.')
  const angas = base.angas.map(anga => anga.kind === 'laghu' ? { ...anga, count } : { ...anga })
  let beats = 0
  const accents = angas.map(anga => { const start = beats; beats += anga.count; return start })
  return {
    ...base, angas, beats, samBeats: accents,
    name: `${jati.name}-jāti ${base.id === 'adi' ? 'Tripuṭa' : base.name.replace(/^(Tisra|Chaturasra|Khanda|Misra|Sankirna)-jāti /, '').replace(/^(Miśra|Tiśra) /, '')}`,
    angaLabels: Array.from({ length: beats }, (_, i) => String(i + 1)),
    structure: angas.map(anga => anga.kind === 'laghu' ? `I(${count})` : anga.kind === 'drutam' ? 'O' : 'U').join(' '),
    description: `${jati.name}-jāti: each laghu has ${count} counts. Jāti changes the cycle length; nadai and subdivision speed do not.`,
  }
}

export function talaSegments(tala: Tala) {
  let start = 1
  return tala.angas.map(anga => {
    const segment = { start, end: start + anga.count - 1, label: `${anga.kind === 'group' ? 'Pulse group (teaching aid)' : anga.kind} · ${anga.count}` }
    start += anga.count
    return segment
  })
}

export function kriyaForBeat(tala: Tala, beat: number): KriyaAction {
  if (!Number.isInteger(beat) || beat < 0 || beat >= tala.beats) throw new Error('Invalid tāla beat.')
  let offset = beat
  for (const anga of tala.angas) {
    if (offset < anga.count) {
      if (anga.kind === 'drutam') return offset === 0 ? 'tap' : 'wave'
      if (anga.kind === 'laghu' && offset > 0) return (['little', 'ring', 'middle', 'index'] as const)[(offset - 1) % 4]
      return 'tap'
    }
    offset -= anga.count
  }
  throw new Error('Tāla angas do not cover this beat.')
}

export function nadaiPulsePlan(nadai: Nadai, bpm: number, speed: number) {
  if (!Number.isFinite(bpm) || bpm <= 0 || ![1, 2, 4, 8].includes(speed)) throw new Error('Invalid rhythm tempo or speed.')
  const syllables = nadai.solkattu.toLowerCase().split(/\s+/)
  if (syllables.length !== nadai.count) throw new Error('Nadai syllable count does not match its subdivisions.')
  const duration = 60 / bpm / nadai.count / speed
  return Array.from({ length: nadai.count * speed }, (_, i) => ({
    syllable: syllables[i % syllables.length], offsetSeconds: i * duration, durationSeconds: duration,
  }))
}

export function evaluateTalaTaps(expected: number[], taps: number[], toleranceMs: number) {
  if (!Number.isFinite(toleranceMs) || toleranceMs <= 0) throw new Error('Invalid tap tolerance.')
  const used = new Set<number>()
  let matched = 0
  for (const tap of taps) {
    let nearest = -1
    let distance = toleranceMs + 1
    expected.forEach((target, index) => {
      const delta = Math.abs(target - tap)
      if (!used.has(index) && delta <= toleranceMs && delta < distance) { nearest = index; distance = delta }
    })
    if (nearest >= 0) { used.add(nearest); matched++ }
  }
  return {
    matched, missed: expected.length - matched, extra: taps.length - matched,
    accuracy: expected.length ? Math.round(100 * matched / Math.max(expected.length, taps.length)) : 0,
  }
}
