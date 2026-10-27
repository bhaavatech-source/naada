import { getMelakartaVariantMap } from './melakartaMapping'
import { parseNotationSequence, type ParsedNotationItem } from './notationParser'
import { SVARA_REGISTRY } from './tuning'

export const JANYA_CATEGORIES = {
  sarali_varisai: 'Sarali',
  janta_varisai: 'Janta',
  dhaatu_varisai: 'Dhaatu',
  mel_sthayi_varisai: 'Mel Sthayi',
  kil_sthayi_varisai: 'Kil Sthayi',
  alankaras: 'Alankaram',
} as const
export type JanyaCategory = keyof typeof JANYA_CATEGORIES
export interface JanyaNotation {
  solfa: string
  swarasthana: string
  vowelSyllables?: string
  semitones?: number[]
}
export interface JanyaSection {
  label: string
  direction?: 'arohana' | 'avarohana'
  notation: JanyaNotation
}
export interface JanyaExercise {
  id: number
  name: string
  tala?: string
  beats?: number
  mathematicalReview?: { version: 1 | 2; category: JanyaCategory; arohana: number; avarohana: number }
  sections: JanyaSection[]
}
export interface JanyaPracticeRaga {
  id: string
  name: string
  parent: number
  arohana: string
  avarohana: string
  isVakra: boolean
  source?: string
  reviewStatus?: string
  scaleReviewStatus?: string
  scaleReviewNote?: string
  scalePlaybackBlocked?: boolean
  exerciseReviewSummary?: { total: number; accepted: number; withheld: number; issues?: string[] }
  omitted: { arohana: string[]; avarohana: string[] }
  exercises: Partial<Record<JanyaCategory, JanyaExercise[]>>
}
export interface JanyaPracticeData {
  ragas: JanyaPracticeRaga[]
  catalogueCount: number
  curriculumCount: number
  exerciseCount: number
  releaseStatus?: string
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label}: expected an object`)
  return value as Record<string, unknown>
}
function text(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label}: missing text`)
  return value
}
function list(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label}: expected an array`)
  return value
}
function parentNumber(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 72) throw new Error('Invalid parent Melakarta number')
  return value
}
function optionalText(value: unknown): string | undefined {
  if (value === undefined) return undefined
  return text(value, 'Optional text')
}
function notation(value: unknown): JanyaNotation {
  const n = object(value, 'Exercise notation')
  const semitones = n.semitones === undefined ? undefined : list(n.semitones, 'Semitones').map(value => {
    if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Invalid semitone value')
    return value
  })
  return {
    solfa: text(n.solfa, 'Solfa'),
    swarasthana: text(n.swarasthana, 'Swarasthana'),
    vowelSyllables: optionalText(n.vowelSyllables ?? n.vowel_syllables),
    semitones,
  }
}
function exercise(value: unknown): JanyaExercise {
  const e = object(value, 'Exercise')
  if (typeof e.exerciseId !== 'number' || !Number.isInteger(e.exerciseId)) throw new Error('Invalid exercise ID')
  const sections: JanyaSection[] = []
  for (const direction of ['arohana', 'avarohana'] as const) {
    if (e[direction] !== undefined) sections.push({
      label: direction === 'arohana' ? 'Arohana' : 'Avarohana', direction, notation: notation(e[direction]),
    })
  }
  for (const part of e.parts === undefined ? [] : list(e.parts, 'Exercise parts')) {
    const p = object(part, 'Exercise part')
    sections.push({ label: text(p.section, 'Section name'), notation: notation(p.notation) })
  }
  if (!sections.length) throw new Error('Exercise has no notation sections')
  return { id: e.exerciseId, name: text(e.exerciseName, 'Exercise name'), tala: optionalText(e.tala), sections }
}

export function parseJanyaNotation(phrase: string, parent: number, mode: 'solfa' | 'swarasthana'): ParsedNotationItem[] {
  // In explicit svarasthana notation bare S/P are middle octave, unlike legacy solfa.
  const normalized = mode === 'swarasthana'
    ? phrase.split(/\s+/).map(token => token === 'S' ? 's' : token === 'P' ? 'p' : token).join(' ')
    : phrase
  return parseNotationSequence(normalized, { defaultVariants: getMelakartaVariantMap(parent) })
}

export type JanyaSpeed = 1 | 2 | 3
export type JanyaDirection = 'arohana' | 'both' | 'avarohana'

export function janyaScalePhrases(raga: JanyaPracticeRaga, direction: JanyaDirection): string[] {
  return direction === 'both' ? [raga.arohana, raga.avarohana] : [raga[direction]]
}

export function janyaNotationTokens(phrase: string, parent: number) {
  const parsed = parseJanyaNotation(phrase, parent, 'swarasthana')
  let itemIndex = 0
  let noteIndex = -1
  return phrase.trim().split(/\s+/).filter(Boolean).map(raw => {
    if (raw === ',') return { raw, item: undefined, noteIndex }
    const item = parsed[itemIndex++]
    if (item.kind === 'note') {
      noteIndex++
      return { raw, item: { ...item, token: { ...item.token, raw } }, noteIndex }
    }
    return { raw, item, noteIndex: null }
  })
}

export function janyaEventIndexAtTime(events: { startSeconds: number; durationSeconds: number }[], elapsed: number): number {
  let low = 0
  let high = events.length - 1
  while (low <= high) {
    const middle = Math.floor((low + high) / 2)
    if (events[middle].startSeconds <= elapsed) low = middle + 1
    else high = middle - 1
  }
  return high >= 0 && elapsed < events[high].startSeconds + events[high].durationSeconds ? high : -1
}

export function buildJanyaPlaybackPlan(phrases: string[], parent: number, bpm: number, speed: JanyaSpeed) {
  if (!Number.isFinite(bpm) || bpm <= 0) throw new Error('A positive tempo is required.')
  if (![1, 2, 3].includes(speed)) throw new Error('Janya speed must be 1, 2 or 3.')
  let durationSeconds = 0
  const events = phrases.flatMap((phrase, phraseIndex) => janyaNotationTokens(phrase, parent).flatMap(({ item, noteIndex }, tokenIndex) => {
    if (!item || item.kind === 'bar') return []
    const duration = item.durationBeats * 60 / bpm / speed
    const startSeconds = durationSeconds
    durationSeconds += duration
    return [{ item, startSeconds, durationSeconds: duration, phraseIndex, tokenIndex, noteIndex }]
  }))
  if (!events.some(event => event.item.kind === 'note')) throw new Error('No playable notes in the supplied notation.')
  return { events, durationSeconds }
}

function vakra(aro: string, avro: string, parent: number): boolean {
  return ([{ phrase: aro, sign: 1 }, { phrase: avro, sign: -1 }]).some(({ phrase, sign }) => {
    const notes = parseJanyaNotation(phrase, parent, 'swarasthana').flatMap(item => item.kind === 'note'
      ? [SVARA_REGISTRY[item.token.svaraId].canonicalSemitone + item.token.octave * 12] : [])
    return notes.some((pitch, i) => i > 0 && (pitch - notes[i - 1]) * sign < 0)
  })
}
export function normalizeJanyaName(name: string): string {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function readJanyaPracticeData(catalogueValue: unknown, curriculumValue: unknown): JanyaPracticeData {
  const catalogue = object(catalogueValue, 'Raaga catalogue')
  const curriculum = object(curriculumValue, 'Janya curriculum')
  const ids = new Set<string>()
  const coreOnly = catalogue.teaching_core_only === true
  const ragas = list(catalogue.ragas, 'Catalogue ragas').flatMap((value): JanyaPracticeRaga[] => {
    const r = object(value, 'Catalogue raaga')
    const id = text(r.raga_id, 'Raaga ID')
    if (ids.has(id)) throw new Error(`Duplicate catalogue ID: ${id}`)
    ids.add(id)
    if (r.raga_type === 'melakarta') return []
    if (r.raga_type === 'hindustani') throw new Error(`${id}: Hindustani entries are not supported by the Carnatic teaching catalogue`)
    if (r.raga_type !== 'janya') throw new Error('Unknown catalogue raaga type')
    if (coreOnly && (r.tradition !== 'Carnatic' || r.review_status !== 'SCALE_REFERENCE_CHECKED')) {
      throw new Error(`${id}: the teaching core requires a reference-checked Carnatic scale`)
    }
    return [{
      id, name: text(r.raga_name, 'Raaga name'), parent: parentNumber(r.mela_number),
      arohana: text(r.arohana_pattern, 'Arohana'), avarohana: text(r.avarohana_pattern, 'Avarohana'),
      isVakra: r.is_vakra === true, source: optionalText(r.source_reference),
      scaleReviewStatus: optionalText(r.review_status),
      scaleReviewNote: optionalText(r.review_note),
      scalePlaybackBlocked: r.review_status === 'NEEDS_SOURCE_REVIEW' || r.review_status === 'NEEDS_VARIANT_REVIEW',
      omitted: { arohana: [], avarohana: [] }, exercises: {},
    }]
  })
  const catalogueCount = ragas.length
  const entries = list(curriculum.janya_ragas, 'Janya ragas')
  const curriculumIds = new Set<string>()
  let exerciseCount = 0
  let curriculumCount = 0
  for (const value of entries) {
    const r = object(value, 'Curriculum raaga')
    const id = text(r.id, 'Curriculum ID')
    if (curriculumIds.has(id)) throw new Error(`Duplicate curriculum ID: ${id}`)
    curriculumIds.add(id)
    const name = text(r.raga_name, 'Curriculum raaga name')
    const parent = parentNumber(r.parent_mela_number)
    const existing = ragas.findIndex(item => item.parent === parent &&
      (item.id === id || normalizeJanyaName(item.name) === normalizeJanyaName(name)))
    // Audit-draft curricula must never reintroduce excluded scales into the core.
    if (coreOnly && existing < 0) continue
    curriculumCount++
    const arohana = text(r.arohana_pattern, 'Arohana')
    const avarohana = text(r.avarohana_pattern, 'Avarohana')
    const omissions = object(r.varjya_swaras, 'Omitted svaras')
    const exercisesRaw = object(r.exercises, 'Exercise categories')
    const exercises: JanyaPracticeRaga['exercises'] = {}
    for (const [key, values] of Object.entries(exercisesRaw)) {
      if (!Object.prototype.hasOwnProperty.call(JANYA_CATEGORIES, key)) throw new Error(`Unsupported Janya exercise category: ${key}`)
      const category = key as JanyaCategory
      const parsed = list(values, category).map(exercise)
      if (new Set(parsed.map(e => e.id)).size !== parsed.length) throw new Error(`Duplicate exercise ID in ${id}/${category}`)
      exercises[category] = parsed
      exerciseCount += parsed.length
    }
    const merged: JanyaPracticeRaga = {
      id: existing >= 0 ? ragas[existing].id : `curriculum:${id}`,
      name, parent,
      arohana: existing >= 0 ? ragas[existing].arohana : arohana,
      avarohana: existing >= 0 ? ragas[existing].avarohana : avarohana,
      exercises,
      isVakra: existing >= 0 ? ragas[existing].isVakra : vakra(arohana, avarohana, parent),
      source: existing >= 0 ? ragas[existing].source : 'Supplied Janya curriculum',
      scaleReviewStatus: existing >= 0 ? ragas[existing].scaleReviewStatus : 'CURRICULUM_SCALE_UNVERIFIED',
      scaleReviewNote: existing >= 0 ? ragas[existing].scaleReviewNote : 'Scale supplied only by the unverified exercise curriculum.',
      scalePlaybackBlocked: existing >= 0 ? ragas[existing].scalePlaybackBlocked : false,
      reviewStatus: optionalText(r.audit_status),
      omitted: {
        arohana: list(omissions.arohana ?? [], 'Arohana omissions').map(v => text(v, 'Omitted swara')),
        avarohana: list(omissions.avarohana ?? [], 'Avarohana omissions').map(v => text(v, 'Omitted swara')),
      },
    }
    if (existing >= 0) ragas[existing] = merged
    else ragas.push(merged)
  }
  const quality = curriculum.quality_status === undefined ? undefined : object(curriculum.quality_status, 'Quality status')
  return { ragas, catalogueCount, curriculumCount, exerciseCount, releaseStatus: optionalText(quality?.status) }
}

export function validateJanyaExercise(raga: JanyaPracticeRaga, ex: JanyaExercise, releaseStatus?: string): string[] {
  if (ex.mathematicalReview) {
    if (![1, 2].includes(ex.mathematicalReview.version) || releaseStatus !== 'REFERENCE_SCALES_MATHEMATICAL_EXERCISES' || !isJanyaScaleReferenceVerified(raga)) {
      return ['Exercise requires a local-reference-verified scale and the mathematical release gate.']
    }
    const review = reviewJanyaExerciseMath(raga, ex, ex.mathematicalReview.category)
    return review.passed ? [] : review.reasons
  }
  const issues = new Set<string>()
  if (!ex.sections.length) issues.add('Exercise has no notation sections.')
  if (releaseStatus !== 'VERIFIED_FOR_RELEASE' || raga.reviewStatus !== 'VERIFIED_FOR_RELEASE') {
    issues.add('Source curriculum requires musical review; exercise playback is locked.')
  }
  for (const section of ex.sections) {
    try {
      const solfa = parseJanyaNotation(section.notation.solfa, raga.parent, 'solfa')
      const notes = solfa.filter(item => item.kind === 'note')
      if (!notes.length) issues.add(`${section.label}: no playable notes.`)
      const scale = section.direction ? raga[section.direction] : `${raga.arohana} ${raga.avarohana}`
      const allowed = new Set(parseJanyaNotation(scale, raga.parent, 'swarasthana').flatMap(item => item.kind === 'note' ? [item.token.svaraId] : []))
      const forbidden = notes.filter(item => !allowed.has(item.token.svaraId)).map(item => item.token.svaraId)
      if (forbidden.length) issues.add(`${section.label}: notes outside the supplied scale: ${[...new Set(forbidden)].join(', ')}.`)
      if (section.direction) {
        const omitted = new Set(raga.omitted[section.direction])
        if (notes.some(item => omitted.has(SVARA_REGISTRY[item.token.svaraId].family))) {
          issues.add(`${section.label}: contains a svara marked omitted in this direction.`)
        }
      }
      if (section.notation.semitones) {
        const actual = notes.map(item => SVARA_REGISTRY[item.token.svaraId].canonicalSemitone + item.token.octave * 12)
        if (JSON.stringify(actual) !== JSON.stringify(section.notation.semitones)) issues.add(`${section.label}: semitone data does not match notation.`)
      }
      const explicit = parseJanyaNotation(section.notation.swarasthana, raga.parent, 'swarasthana')
      const signature = (items: ParsedNotationItem[]) => items.map(item => item.kind === 'note'
        ? `${item.token.svaraId}:${item.token.octave}:${item.durationBeats}` : item.kind === 'rest' ? `rest:${item.durationBeats}` : item.raw)
      if (JSON.stringify(signature(solfa)) !== JSON.stringify(signature(explicit))) {
        issues.add(`${section.label}: solfa and swarasthana pitch, duration or marker mismatch.`)
      }
    } catch (error) {
      issues.add(`${section.label}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  // Structural checks cannot certify characteristic vakra phrases or gamakas.
  if (raga.isVakra) issues.add('Vakra phrase order requires musician review; scale membership alone is insufficient.')
  return [...issues]
}

type PatternPosition = number | 'last' | ',' | { index: number; octave: number }
interface MathematicalPattern {
  groups: PatternPosition[][]
  beats?: number
}

function mathematicalPattern(category: JanyaCategory, id: number, length: number): MathematicalPattern | undefined {
  if (category === 'sarali_varisai' && id === 1) {
    return { groups: [Array.from({ length }, (_, index) => index)] }
  }
  if (category === 'dhaatu_varisai') {
    const patterns = [
      [[0, 2, 1, 3], [0, 3], [1, 4]],
      [[0, 3, 2, 1], [1, 4], [3, 2]],
      [[0, 4, 1, 3], [2, 4], [1, 2]],
    ]
    const groups = patterns[id - 1]
    if (groups) return { groups }
  }
  if (category === 'alankaras') {
    const patterns: MathematicalPattern[] = [
      { groups: [[0, 1, 2, 3], [2, 1], [0, 1, 2, 1], [0, 1, 2, 3]], beats: 14 },
      { groups: [[0, 1, 2, 1], [0, 1], [0, 1, 2, 3]], beats: 10 },
      { groups: [[0, 1], [0, 1, 2, 3]], beats: 6 },
      { groups: [[0, 1, 2, 0, 1, 2, 3], [0], [1, 2]], beats: 10 },
      { groups: [[0, 1, 2], [0, 1], [2, 3]], beats: 7 },
      { groups: [[0, 1, 2, 2, 1], [0, 1, 2, 3, 3], [2, 3], ['last', 'last']], beats: 14 },
      { groups: [[0, 1, 2, 3]], beats: 4 },
      { groups: [[0, 1, ',', 2, 3, ',', 4, 'last', 'last']], beats: 9 },
      { groups: [[0, ',', 1, ',', 2, ',', 3, ',', 'last']], beats: 9 },
    ]
    return patterns[id - 1]
  }
  return undefined
}

export const JANYA_COMPLETE_GROUP_SIZES: Record<JanyaCategory, number> = {
  sarali_varisai: 14, janta_varisai: 12, dhaatu_varisai: 3,
  kil_sthayi_varisai: 2, mel_sthayi_varisai: 2, alankaras: 9,
}
const ALANKARA_NAMES = ['Dhruva Tala', 'Matya Tala', 'Rupaka Tala', 'Jhampa Tala', 'Triputa Tala', 'Ata Tala', 'Eka Tala', 'Sankeerna Eka Tala (Variation 1)', 'Sankeerna Eka Tala (Variation 2)']

function completePattern(category: JanyaCategory, id: number, length: number): MathematicalPattern | undefined {
  if (!Number.isInteger(id) || id < 1 || id > JANYA_COMPLETE_GROUP_SIZES[category]) return undefined
  const path = Array.from({ length }, (_, index) => index)
  if (category === 'kil_sthayi_varisai' || category === 'mel_sthayi_varisai') {
    const octave = category === 'kil_sthayi_varisai' ? -1 : 1
    const shifted = path.map(index => ({ index, octave }))
    return { groups: id === 1 ? [path, shifted, path] :
      path.map(index => [index, { index, octave }, { index, octave }, index]) }
  }
  if (category === 'alankaras') {
    const pattern = mathematicalPattern(category, id, length)
    if (!pattern) return undefined
    // Each cycle moves one position along the exact directional path.
    const width = id >= 8 ? 5 : 4
    const groups = Array.from({ length: Math.max(1, length - width + 1) }, (_, start) =>
      pattern.groups.map(group => group.map(position =>
        typeof position === 'number' ? Math.min(start + position, length - 1) : position)))
    return { groups: groups.flat(), beats: pattern.beats }
  }
  const motifs = category === 'dhaatu_varisai' ? [
    [0, 2, 1, 3], [0, 3, 2, 1], [0, 4, 1, 3, 2, 4],
  ] : [
    [0, 1], [0, 1, 2], [0, 1, 0, 2], [0, 1, 2, 1],
    [0, 0, 1, 2], [0, 1, 2, 3], [0, 1, 3, 2],
    [0, 2, 1, 3], [0, 3, 1, 2], [0, 1, 1, 2],
    [0, 2, 3, 1], [0, 1, 2, 3, 2, 1],
    [0, 1, 2, 1, 2, 3], [0, 1, 2, 3, 2, 1, 0, 3],
  ]
  if (category === 'sarali_varisai' && id === 1) return { groups: [path] }
  const motif = motifs[id - 1]
  if (!motif) return undefined
  const width = Math.max(...motif) + 1
  const groups = Array.from({ length: Math.max(1, length - width + 1) }, (_, start) =>
    motif.flatMap(index => {
      const position = Math.min(start + index, length - 1)
      return category === 'janta_varisai' ? [position, position] : [position]
    }))
  return { groups }
}

function patternNotes(raga: JanyaPracticeRaga, direction: 'arohana' | 'avarohana', pattern: MathematicalPattern): string[][] {
  const scale = parseJanyaNotation(raga[direction], raga.parent, 'swarasthana').flatMap(item =>
    item.kind === 'note' ? [item.token] : [])
  return pattern.groups.map(group => group.map(position => {
    if (position === ',') return ','
    const index = position === 'last' ? scale.length - 1 : typeof position === 'number' ? position : position.index
    const note = scale[index]
    if (!note) throw new Error(`${raga.name}: mathematical pattern exceeds the directional scale.`)
    const octave = note.octave + (typeof position === 'object' ? position.octave : 0)
    if (octave < -2 || octave > 2) throw new Error(`${raga.name}: exercise octave exceeds the supported range.`)
    return `${note.svaraId}${octave > 0 ? "'".repeat(octave) : ','.repeat(-octave)}`
  }))
}

export function completeJanyaExercises(raga: JanyaPracticeRaga): Partial<Record<JanyaCategory, JanyaExercise[]>> {
  if (!isJanyaScaleReferenceVerified(raga)) throw new Error(`${raga.name}: cannot generate exercises without a verified scale.`)
  const exercises: Partial<Record<JanyaCategory, JanyaExercise[]>> = {}
  for (const category of Object.keys(JANYA_COMPLETE_GROUP_SIZES) as JanyaCategory[]) {
    exercises[category] = Array.from({ length: JANYA_COMPLETE_GROUP_SIZES[category] }, (_, index) => {
      const id = index + 1
      const pattern = completePattern(category, id, parseJanyaNotation(raga.arohana, raga.parent, 'swarasthana').length)
      if (!pattern) throw new Error(`${category}/${id}: missing completion rule.`)
      const exercise: JanyaExercise = {
        id, name: category === 'alankaras' ? ALANKARA_NAMES[index] : `${JANYA_CATEGORIES[category]} ${id}`,
        tala: category === 'alankaras' ? ALANKARA_NAMES[index] : undefined, beats: pattern.beats,
        mathematicalReview: { version: 2, category, arohana: 100, avarohana: 100 },
        sections: (['arohana', 'avarohana'] as const).map(direction => {
          const length = parseJanyaNotation(raga[direction], raga.parent, 'swarasthana').length
          const directionalPattern = completePattern(category, id, length)
          if (!directionalPattern) throw new Error(`${category}/${id}: missing directional rule.`)
          const groups = patternNotes(raga, direction, directionalPattern)
          const cycleGroups = category === 'alankaras' ? mathematicalPattern(category, id, length)?.groups.length : undefined
          const phrase = groups.map((group, groupIndex) =>
            `${group.join(' ')}${cycleGroups && (groupIndex + 1) % cycleGroups === 0 ? ' ||' : groupIndex === groups.length - 1 ? ' ||' : ' |'}`).join(' ')
          return { label: direction === 'arohana' ? 'Arohaṇa' : 'Avarohaṇa', direction, notation: { solfa: phrase, swarasthana: phrase } }
        }),
      }
      const assessment = reviewJanyaExerciseMath(raga, exercise, category)
      if (!assessment.passed) throw new Error(`${raga.name}/${category}/${id}: ${assessment.reasons.join(' ')}`)
      return exercise
    })
  }
  return exercises
}

/** Normalized edit similarity of ordered positions, not a probability of musical correctness. */
export function janyaMathAccuracy(actual: readonly string[], expected: readonly string[]): number {
  const length = Math.max(actual.length, expected.length)
  if (!length) return 0
  if (actual.length === expected.length && actual.every((token, index) => token === expected[index])) return 100
  let previous = Array.from({ length: expected.length + 1 }, (_, i) => i)
  actual.forEach((token, i) => {
    const next = [i + 1]
    expected.forEach((wanted, j) => next.push(Math.min(
      next[j] + 1, previous[j + 1] + 1, previous[j] + (token === wanted ? 0 : 1),
    )))
    previous = next
  })
  return 100 * (length - previous[expected.length]) / length
}

export function isJanyaScaleReferenceVerified(raga: JanyaPracticeRaga): boolean {
  return raga.scaleReviewStatus === 'PDF_SCALE_VERIFIED' || raga.scaleReviewStatus === 'EXCEL_SCALE_VERIFIED'
}

export function reviewJanyaExerciseMath(raga: JanyaPracticeRaga, ex: JanyaExercise, category: JanyaCategory) {
  const reasons: string[] = []
  const scores = { arohana: 0, avarohana: 0 }
  if (!isJanyaScaleReferenceVerified(raga)) reasons.push('Scale has not passed local reference verification.')
  if (ex.sections.length !== 2) reasons.push('Exactly one ascent and one descent are required.')
  for (const direction of ['arohana', 'avarohana'] as const) {
    const sections = ex.sections.filter(section => section.direction === direction)
    if (sections.length !== 1) { reasons.push(`${direction}: missing or duplicate direction.`); continue }
    const raw = sections[0].notation.swarasthana.trim().split(/\s+/)
    // Lowercase in the booklet has no declared octave convention. Do not guess it.
    if (raw.some(token => !/^(?:S|P|[RGDN][123]|M[12]|Ṡ)(?:'{1,2}|,{1,2})?$/.test(token) && !['|', '||', ','].includes(token))) {
      reasons.push(`${direction}: invalid or ambiguous explicit notation.`)
      continue
    }
    if ([',', '|', '||'].includes(raw[0])) {
      reasons.push(`${direction}: notation must start with a note.`)
      continue
    }
    const scale = parseJanyaNotation(raga[direction], raga.parent, 'swarasthana').flatMap(item =>
      item.kind === 'note' ? [item.token] : [])
    const completed = ex.mathematicalReview?.version === 2
    const pattern = completed ? completePattern(category, ex.id, scale.length) : mathematicalPattern(category, ex.id, scale.length)
    if (!pattern) { reasons.push(`${direction}: no formal mathematical pattern is defined for this exercise.`); continue }
    const identity = (phrase: string) => parseJanyaNotation(phrase, raga.parent, 'swarasthana').flatMap(item =>
      item.kind === 'note' ? [`${item.token.svaraId}:${item.token.octave}`, ...Array<string>(item.durationBeats - 1).fill(',')] : [])
    const scaleIdentities = scale.map(note => `${note.svaraId}:${note.octave}`)
    const allowed = new Set(scaleIdentities)
    if (completed && (category === 'kil_sthayi_varisai' || category === 'mel_sthayi_varisai')) {
      const offset = category === 'kil_sthayi_varisai' ? -1 : 1
      scale.forEach(note => allowed.add(`${note.svaraId}:${note.octave + offset}`))
    }
    const actual = identity(raw.join(' '))
    if (!actual.length || actual.some(token => token !== ',' && !allowed.has(token))) {
      reasons.push(`${direction}: note or octave outside the reference-verified directional scale.`)
    }
    const expected = completed ? identity(patternNotes(raga, direction, pattern).flat().join(' ')) :
      pattern.groups.flatMap(group => group.map(position =>
        position === ',' ? ',' : scaleIdentities[position === 'last' ? scale.length - 1 : typeof position === 'number' ? position : position.index]))
    if (expected.some(token => token === undefined)) {
      reasons.push(`${direction}: scale is too short for this mathematical pattern.`)
      continue
    }
    scores[direction] = janyaMathAccuracy(actual, expected)
    if (scores[direction] <= 90) reasons.push(`${direction}: mathematical pattern score must exceed 90%.`)
    if (completed) {
      const cycleGroups = category === 'alankaras' ? mathematicalPattern(category, ex.id, scale.length)?.groups.length : undefined
      const expectedBoundaries = pattern.groups.map((_, index) =>
        cycleGroups && (index + 1) % cycleGroups === 0 || index === pattern.groups.length - 1 ? '||' : '|')
      const actualBoundaries = raw.filter(token => token === '|' || token === '||')
      const actualGroups = raw.join(' ').replace(/\s*\|\|\s*$/, '').split(/\s*\|\|?\s*/)
      if (JSON.stringify(actualBoundaries) !== JSON.stringify(expectedBoundaries) ||
        JSON.stringify(actualGroups.map(group => group.trim().split(/\s+/).length)) !== JSON.stringify(pattern.groups.map(group => group.length))) {
        reasons.push(`${direction}: group or cycle boundaries do not match the completion rule.`)
      }
    }
    if (pattern.beats !== undefined) {
      const groups = raw.join(' ').replace(/\s*\|\|\s*$/, '').split(/\s*\|\|?\s*/)
      const groupLengths = groups.map(group => group.trim().split(/\s+/).length)
      if (ex.beats !== pattern.beats || JSON.stringify(groupLengths) !== JSON.stringify(pattern.groups.map(group => group.length)) ||
        raw.filter(token => token === '||').length !== (completed ? pattern.groups.length / (mathematicalPattern(category, ex.id, scale.length)?.groups.length ?? 1) : 1) ||
        raw[raw.length - 1] !== '||') {
        reasons.push(`${direction}: declared beats, anga grouping or cycle boundary do not match the mathematical rule.`)
      }
      if (ex.tala !== ALANKARA_NAMES[ex.id - 1]) reasons.push(`${direction}: tala label does not match the selected mathematical rule.`)
    }
  }
  return { passed: reasons.length === 0, scores, reasons }
}
