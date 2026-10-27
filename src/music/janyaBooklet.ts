import pdfReview from '../data/janya-pdf-review.json' with { type: 'json' }
import {
  buildJanyaPlaybackPlan, completeJanyaExercises, normalizeJanyaName, parseJanyaNotation, reviewJanyaExerciseMath,
  type JanyaCategory, type JanyaExercise, type JanyaPracticeData, type JanyaPracticeRaga,
} from './janyaCurriculum'
import { SVARA_REGISTRY } from './tuning'

export interface BookletReviewResult {
  accepted: string[]
  excluded: { name: string; reason: string }[]
  melakartaCount: number
  excelCount: number
  exercises: { raga: string; category: JanyaCategory; id: number; passed: boolean; scores: { arohana: number; avarohana: number }; reasons: string[] }[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function record(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) throw new Error('Invalid Janya booklet record.')
  return value
}

function scale(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Missing booklet scale.')
  return value.replace(/\s+-\s+/g, ' ').trim().replace(/S'/g, 'Ṡ')
}

function notation(value: string): string {
  return value.trim().split(/\s+/).flatMap(token => {
    if (['|', '||', ','].includes(token)) return [token]
    const notes = token.match(/(?:S|P|[RGDN][123]|M[12])'?/g)
    // Split explicit packed notes losslessly; retain invalid input for the rejection report.
    return notes?.join('') === token ? notes.map(note => note === "S'" ? 'Ṡ' : note) : [token]
  }).join(' ')
}

export function integrateJanyaBooklet(value: unknown): JanyaPracticeData & { bookletReview: BookletReviewResult } {
  const booklet = record(value)
  if (!Array.isArray(booklet.ragas) || booklet.total_ragas_count !== booklet.ragas.length) {
    throw new Error('Janya booklet count does not match its records.')
  }
  const records = booklet.ragas.map(record)
  const names = records.map(item => {
    if (typeof item.name !== 'string' || !item.name.trim()) throw new Error('Booklet raaga name is missing.')
    return normalizeJanyaName(item.name)
  })
  const duplicates = new Set(names.filter((name, index) => names.indexOf(name) !== index))
  const result: BookletReviewResult = { accepted: [], excluded: [], melakartaCount: 0, excelCount: 0, exercises: [] }
  const ragas: JanyaPracticeRaga[] = []
  for (const [index, item] of records.entries()) {
    const name = String(item.name), key = names[index]
    const review = pdfReview.decisions.find(decision => decision.key === key)
    let reason = ''
    if (duplicates.has(key)) reason = 'Duplicate name requires identity review.'
    else if (!review || !['PDF_SCALE_VERIFIED', 'EXCEL_SCALE_VERIFIED'].includes(review.status)) reason = review?.reason ?? 'No local reference verification recorded.'
    else if (item.mela_number !== review.snapshot.parent || scale(item.arohanam) !== review.snapshot.ascent || scale(item.avarohanam) !== review.snapshot.descent) {
      reason = 'Source scale or parent changed since reference verification.'
    }
    if (reason || !review?.ascent || !review.descent || !review.evidence || !review.parent) {
      result.excluded.push({ name, reason: reason || 'Incomplete reference evidence.' })
      if (review?.status === 'MELAKARTA_ALREADY_AVAILABLE') result.melakartaCount++
      continue
    }
    const phrases = [review.ascent, review.descent]
    const notes = phrases.map(phrase => {
      const items = parseJanyaNotation(phrase, review.parent, 'swarasthana')
      if (items.some(item => item.kind !== 'note') || items.length < 3) throw new Error(`${name}: invalid reviewed reference scale.`)
      return items.flatMap(item => item.kind === 'note' ? [item.token] : [])
    })
    const pitch = (note: typeof notes[number][number]) => SVARA_REGISTRY[note.svaraId].canonicalSemitone + note.octave * 12
    const isVakra = notes[0].some((note, i) => i > 0 && pitch(note) < pitch(notes[0][i - 1])) ||
      notes[1].some((note, i) => i > 0 && pitch(note) > pitch(notes[1][i - 1]))
    for (const speed of [1, 2, 3] as const) buildJanyaPlaybackPlan(phrases, review.parent, 80, speed)
    const raga: JanyaPracticeRaga = {
      id: key, name, parent: review.parent, arohana: review.ascent, avarohana: review.descent, isVakra,
      source: `${review.evidence.document}, ${'cell' in review.evidence ? `${review.evidence.sheet}!${review.evidence.cell}` : `PDF page ${review.evidence.page}`}; entry: ${review.evidence.referenceName}`,
      scaleReviewStatus: review.status,
      scaleReviewNote: `Written swarasthanas checked against local references on ${pdfReview.reviewedAt}. ${review.note} Exercises are assessed separately by mathematical rules, not documentary or performance certification.`,
      scalePlaybackBlocked: false, omitted: { arohana: [], avarohana: [] }, exercises: {},
    }
    const groups = isRecord(item.exercise_notes) ? item.exercise_notes : {}
    const sthayi = isRecord(groups.sthaayi_varisais) ? groups.sthaayi_varisais : {}
    const categories: [JanyaCategory, unknown][] = [
      ['sarali_varisai', groups.sarali_varisais], ['janta_varisai', groups.janta_varisais],
      ['dhaatu_varisai', groups.dhaatu_varisais], ['kil_sthayi_varisai', sthayi.kil_sthaayi_exercises],
      ['mel_sthayi_varisai', sthayi.mel_sthaayi_exercises], ['alankaras', groups.sapta_alankaras],
    ]
    const issues: string[] = []
    for (const [category, entries] of categories) {
      if (!Array.isArray(entries)) {
        issues.push(`${category}: exercise group is missing or malformed; its size cannot be assessed.`)
        continue
      }
      const ids = new Set<number>()
      for (const [exerciseIndex, value] of entries.entries()) {
        const reject = (reason: string) => {
          result.exercises.push({ raga: name, category, id: exerciseIndex + 1, passed: false, scores: { arohana: 0, avarohana: 0 }, reasons: [reason] })
        }
        if (!isRecord(value)) { reject('Malformed exercise record.'); continue }
        const entry = value
        const id = entry.varisai_number ?? entry.exercise_number ?? exerciseIndex + 1
        if (typeof id !== 'number' || !Number.isInteger(id) || id < 1 || ids.has(id)) {
          reject('Invalid or duplicate exercise ID.')
          continue
        }
        ids.add(id)
        const ascent = entry.arohanam_exercise ?? entry.arohanam
        const descent = entry.avarohanam_exercise ?? entry.avarohanam
        if (typeof ascent !== 'string' || !ascent.trim() || typeof descent !== 'string' || !descent.trim()) {
          reject('Missing or malformed directional exercise notation.')
          continue
        }
        const ex: JanyaExercise = {
          id, name: String(entry.title ?? entry.tala ?? `Exercise ${id}`),
          tala: typeof entry.tala === 'string' ? entry.tala : undefined,
          beats: typeof entry.beats === 'number' ? entry.beats : undefined,
          sections: (['arohana', 'avarohana'] as const).map(direction => {
            const phrase = notation(direction === 'arohana' ? ascent : descent)
            return { label: direction === 'arohana' ? 'Arohana' : 'Avarohana', direction, notation: { solfa: phrase, swarasthana: phrase } }
          }),
        }
        const assessment = reviewJanyaExerciseMath(raga, ex, category)
        result.exercises.push({ raga: name, category, id: ex.id, ...assessment })
      }
    }
    // Retain source assessments for audit; the approved completion uses explicit
    // directional templates instead of the source's ambiguous/incorrect notes.
    raga.exercises = completeJanyaExercises(raga)
    const completed = Object.values(raga.exercises).reduce((count, entries) => count + entries.length, 0)
    raga.exerciseReviewSummary = { total: completed, accepted: completed, withheld: 0, issues }
    ragas.push(raga)
    result.accepted.push(name)
    if (review.status === 'EXCEL_SCALE_VERIFIED') result.excelCount++
  }
  // No legacy/web-approved fallback: every displayed scale needs local evidence.
  return {
    ragas, catalogueCount: ragas.length,
    curriculumCount: ragas.filter(raga => Object.values(raga.exercises).some(group => group.length)).length,
    exerciseCount: ragas.reduce((sum, raga) => sum + (raga.exerciseReviewSummary?.accepted ?? 0), 0),
    releaseStatus: 'REFERENCE_SCALES_MATHEMATICAL_EXERCISES', bookletReview: result,
  }
}
