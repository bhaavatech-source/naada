import catalogue from '../../../public/data/master-1000-ragas-database.json' with { type: 'json' }
import curriculum from '../../../public/data/master-janya-ragas-curriculum-v2.json' with { type: 'json' }
import booklet from '../../../public/data/janya_vakra_ragas_exercises_200.json' with { type: 'json' }
import pdfReview from '../../data/janya-pdf-review.json' with { type: 'json' }
import { integrateJanyaBooklet } from '../janyaBooklet'
import { parseSvaraToken } from '../notationParser'
import { resolveSvaraPitch } from '../tuning'
import { getAudioOutputTime } from '../../audio/engine'
import { buildJanyaPlaybackPlan, janyaScalePhrases, janyaNotationTokens, janyaEventIndexAtTime, parseJanyaNotation, readJanyaPracticeData, validateJanyaExercise, reviewJanyaExerciseMath, isJanyaScaleReferenceVerified, janyaMathAccuracy, JANYA_COMPLETE_GROUP_SIZES, type JanyaExercise, type JanyaPracticeRaga, type JanyaCategory } from '../janyaCurriculum'

export function runJanyaTests(): number {
  let count = 0
  const check = (condition: boolean, message: string) => {
    if (!condition) throw new Error(`Janya curriculum: ${message}`)
    count++
  }
  const rejects = (action: () => unknown, message: string) => {
    let rejected = false
    try { action() } catch { rejected = true }
    check(rejected, message)
  }
  const sourceBefore = JSON.stringify(curriculum)
  check(getAudioOutputTime({ currentTime: 12, getOutputTimestamp: () => ({ contextTime: 11, performanceTime: 1000 }) }, 1050) === 11.05,
    'speaker timestamps, not render-ahead time, drive highlighting')
  check(Math.abs(getAudioOutputTime({ currentTime: 12, baseLatency: .02, outputLatency: .03 }, 1050) - 11.95) < 1e-10,
    'latency compensation when output timestamps are unavailable')
  check(getAudioOutputTime({ currentTime: 12 }, 1050) === 12, 'older browsers fall back to their audio clock')
  check(getAudioOutputTime({ currentTime: 12, getOutputTimestamp: () => ({ contextTime: 12, performanceTime: 1000 }) }, 1050) === 12,
    'timestamp extrapolation must not highlight future, unsounded notes')
  const data = readJanyaPracticeData(catalogue, curriculum)
  const bookletBefore = JSON.stringify(booklet)
  const released = integrateJanyaBooklet(booklet)
  check(JSON.stringify(booklet) === bookletBefore, 'release corrections must preserve the original booklet for audit')
  check(released.bookletReview.accepted.length === 143 && released.bookletReview.excluded.length === 90, 'exact reference verified/not-added counts')
  check(released.bookletReview.excelCount === 142, '142 workbook-backed scales; one explicitly retained PDF scale')
  check(released.ragas.every(raga => pdfReview.decisions.some(review => review.key === raga.id && review.status === raga.scaleReviewStatus)), 'every released identity has matching local reference approval')
  const vegavahini = released.ragas.find(raga => raga.id === 'vegavahini')
  check(vegavahini?.arohana === 'S R1 G3 M1 D2 N2 D2 Ṡ' && vegavahini.avarohana === 'Ṡ N2 D2 P M1 G3 R1 S',
    'Vegavahini workbook correction omits ascent Pa and preserves the vakra Dha return')
  check(vegavahini?.source?.includes('Janya_list.xlsx, Sheet1!C263') === true, 'Vegavahini exposes its exact workbook cell')
  check(released.ragas.find(raga => raga.id === 'hamsanadam')?.source?.includes('Sheet1!C1032') === true, 'Hamsanadam keeps the documented alternate, not a merged scale')
  check(released.ragas.find(raga => raga.id === 'varam')?.scaleReviewStatus === 'PDF_SCALE_VERIFIED', 'missing workbook identity retains explicit PDF evidence')
  check(released.exerciseCount > 0 && released.bookletReview.exercises.some(ex => !ex.passed), 'exercise gate releases qualifying items and withholds failures independently')
  const correctedChayanattai = released.ragas.find(raga => raga.id === 'chayanata')
  check(correctedChayanattai?.arohana === 'S R3 G3 M1 P M1 P Ṡ', 'Chayanattai ascent preserves reference vakra turn')
  check(correctedChayanattai?.avarohana === 'Ṡ N2 D2 N2 P M1 R3 S', 'Chayanattai descent preserves reference vakra turn and omissions')
  check(correctedChayanattai?.isVakra === true, 'corrected Chayanattai is selectable as Vakra')
  const begada = released.ragas.find(raga => raga.id === 'begada')
  check(begada?.isVakra === true && begada.arohana.includes('N2') && begada.avarohana.includes('N3'), 'Begada keeps reference nishadas instead of parent-scale substitution')
  check(released.ragas.find(raga => raga.id === 'sahana')?.avarohana.startsWith('Ṡ N2 Ṡ ') === true, 'internal upper tonic uses the documented playback convention')
  check(released.ragas.find(raga => raga.id === 'kurinji')?.arohana === 'S N3, S R2 G3 M1 P D2', 'Kurinji keeps its limited practice register rather than forcing an octave-wide scale')
  check(released.ragas.find(raga => raga.id === 'durbar')?.avarohana.startsWith("R2' Ṡ N2 Ṡ ") === true, 'Durbar starts its descending practice outline in the upper register')
  check(released.ragas.find(raga => raga.id === 'puriyadhanashree')?.source?.includes('Sheet1!C919') === true, 'Puriya Dhanashree has an exact workbook reference, not guessed PDF approval')
  check(released.bookletReview.excluded.find(item => item.name === 'Navaneetham')?.reason.includes('Melakarta 40') === true, 'Melakarta excluded from Janya list')
  check(released.bookletReview.excluded.some(item => item.name === 'Santvabhashini'), 'uncertain identity not guessed')
  check(released.bookletReview.accepted.length + released.bookletReview.excluded.length === booklet.ragas.length, 'every supplied record receives a release decision')
  check(released.bookletReview.melakartaCount === 65, 'Melakarta entries are accounted separately from pending Janya verification')
  check(pdfReview.documents.every(document => /^[0-9a-f]{64}$/.test(document.sha256)), 'reference evidence records exact document fingerprints')
  for (const raga of released.ragas) {
    check(isJanyaScaleReferenceVerified(raga) && !raga.scalePlaybackBlocked &&
      !!raga.source?.includes(raga.scaleReviewStatus === 'EXCEL_SCALE_VERIFIED' ? 'Sheet1!C' : 'PDF page'), `${raga.name}: reference location and scale approval`)
    for (const speed of [1, 2, 3] as const) {
      const phrases = [raga.arohana, raga.avarohana]
      const plan = buildJanyaPlaybackPlan(phrases, raga.parent, 80, speed)
      check(plan.events.length === phrases.flatMap(phrase => janyaNotationTokens(phrase, raga.parent)).length, `${raga.name}: every scale position audible at ${speed}x`)
      check(plan.events.every(event => {
        const display = janyaNotationTokens(phrases[event.phraseIndex], raga.parent)[event.tokenIndex]
        return display.item?.kind === 'note' && event.item.kind === 'note' &&
          display.item.token.svaraId === event.item.token.svaraId && display.item.token.octave === event.item.token.octave
      }), `${raga.name}: exact display/audio identity at ${speed}x`)
    }
    for (const exercises of Object.values(raga.exercises)) for (const ex of exercises) {
      check(!!ex.mathematicalReview && ex.mathematicalReview.arohana > 90 && ex.mathematicalReview.avarohana > 90,
        `${raga.name}/${ex.name}: strict directional thresholds`)
      check(validateJanyaExercise(raga, ex, released.releaseStatus).length === 0, `${raga.name}/${ex.name}: playback revalidates mathematical rules`)
      for (const speed of [1, 2, 3] as const) {
        const phrases = ex.sections.map(section => section.notation.swarasthana)
        const plan = buildJanyaPlaybackPlan(phrases, raga.parent, 80, speed)
        check(plan.events.every(event => {
          const display = janyaNotationTokens(phrases[event.phraseIndex], raga.parent)[event.tokenIndex].item
          return display?.kind === 'note' && event.item.kind === 'note' &&
            display.token.svaraId === event.item.token.svaraId && display.token.octave === event.item.token.octave &&
            event.durationSeconds === display.durationBeats * 60 / 80 / speed
        }), `${raga.name}/${ex.name}: note, octave and hold identity at ${speed}x`)
      }
    }
    const summary = raga.exerciseReviewSummary
    check(!!summary && summary.total === summary.accepted + summary.withheld, `${raga.name}: independent exercise accounting`)
    for (const category of Object.keys(JANYA_COMPLETE_GROUP_SIZES) as JanyaCategory[]) {
      const exercises = raga.exercises[category] ?? []
      check(exercises.length === JANYA_COMPLETE_GROUP_SIZES[category], `${raga.name}: full ${category} group`)
      check(new Set(exercises.map(ex => ex.id)).size === exercises.length, `${raga.name}/${category}: unique lesson IDs`)
      for (const ex of exercises) {
        check(ex.mathematicalReview?.version === 2, `${raga.name}/${category}/${ex.id}: explicit completion rule`)
        for (const direction of ['arohana', 'avarohana'] as const) {
          const tokens = parseJanyaNotation(ex.sections.find(section => section.direction === direction)?.notation.swarasthana ?? '', raga.parent, 'swarasthana')
            .flatMap(item => item.kind === 'note' ? [item.token] : [])
          const scale = parseJanyaNotation(raga[direction], raga.parent, 'swarasthana')
            .flatMap(item => item.kind === 'note' ? [item.token] : [])
          const offset = category === 'kil_sthayi_varisai' ? -1 : category === 'mel_sthayi_varisai' ? 1 : 0
          check(tokens.every(note => scale.some(base => base.svaraId === note.svaraId &&
            (base.octave === note.octave || (offset !== 0 && base.octave + offset === note.octave)))),
          `${raga.name}/${category}/${ex.id}/${direction}: only directional identities and permitted registers`)
          if (category === 'janta_varisai') check(tokens.length % 2 === 0 && tokens.every((note, index) => {
            const partner = tokens[index % 2 === 0 ? index + 1 : index - 1]
            return note.svaraId === partner.svaraId && note.octave === partner.octave
          }), `${raga.name}/${ex.id}/${direction}: every Janta pair repeats the exact pitch`)
          if (offset !== 0) check(scale.every(base => tokens.some(note => note.svaraId === base.svaraId && note.octave === base.octave + offset)),
            `${raga.name}/${category}/${ex.id}/${direction}: octave study covers the full shifted path`)
          if (category === 'alankaras') {
            const phrase = ex.sections.find(section => section.direction === direction)?.notation.swarasthana ?? ''
            const cycles = phrase.split('||').map(cycle => cycle.trim()).filter(Boolean)
            const angaSizes = [[4, 2, 4, 4], [4, 2, 4], [2, 4], [7, 1, 2], [3, 2, 2], [5, 5, 2, 2], [4], [9], [9]][ex.id - 1]
            check(cycles.length > 0 && cycles.every(cycle => {
              const groups = cycle.split('|').map(group => group.trim().split(/\s+/).length)
              return JSON.stringify(groups) === JSON.stringify(angaSizes) && groups.reduce((sum, length) => sum + length, 0) === ex.beats
            }), `${raga.name}/${ex.id}/${direction}: every complete tala cycle has the declared anga sizes and beat total`)
          }
        }
      }
    }
  }
  check(released.exerciseCount === 143 * 42 && released.curriculumCount === 143, 'all verified ragas have the complete 42-exercise curriculum')
  check(released.bookletReview.exercises.filter(ex => ex.passed).length === 817, 'original source assessments remain available separately from generated completion')
  const mohanam = released.ragas.find(raga => raga.id === 'mohanam')
  if (!mohanam) throw new Error('Missing reference-verified Mohanam')
  const eka = mohanam.exercises.alankaras?.find(ex => ex.id === 7)
  if (!eka) throw new Error('Missing accepted Eka fixture')
  const tampered = structuredClone(eka)
  tampered.sections[0].notation.swarasthana = 'S R1 G3 P ||'
  check(validateJanyaExercise(mohanam, tampered, released.releaseStatus).length > 0, 'stored success metadata cannot approve an invalid note')
  check(validateJanyaExercise(mohanam, eka, 'VERIFIED_FOR_RELEASE').length > 0, 'legacy release status cannot bypass mathematical approval')
  const wrongBeats = { ...eka, beats: 8 }
  check(!reviewJanyaExerciseMath(mohanam, wrongBeats, 'alankaras').passed, 'wrong beat declaration blocks a perfect note sequence')
  const wrongTala = { ...eka, tala: 'Dhruva Tala' }
  check(!reviewJanyaExerciseMath(mohanam, wrongTala, 'alankaras').passed, 'wrong tala label blocks a perfect note sequence')
  const ambiguous = structuredClone(eka)
  ambiguous.sections[0].notation.swarasthana = 's r2 g3 p ||'
  check(!reviewJanyaExerciseMath(mohanam, ambiguous, 'alankaras').passed, 'lowercase octave ambiguity is not guessed')
  const badHold = structuredClone(eka)
  badHold.sections[0].notation.swarasthana = ', S R2 G3 P ||'
  check(!reviewJanyaExerciseMath(mohanam, badHold, 'alankaras').passed, 'leading holds produce a rejection, not a loader crash')
  check(!reviewJanyaExerciseMath(mohanam, { ...eka, id: 2 }, 'janta_varisai').passed, 'another exercise cannot pass on membership alone')
  check(mohanam.exercises.sarali_varisai?.[0].sections[1].notation.swarasthana === "S' D2 P G3 R2 S ||", 'Mohanam descent follows the corrected descending path, not the source rotation')
  check(mohanam.exercises.sarali_varisai?.[1].sections[0].notation.swarasthana === "S R2 G3 | R2 G3 P | G3 P D2 | P D2 S' ||",
    'Sarali 2 uses successive three-position windows including the final tonic')
  check(mohanam.exercises.janta_varisai?.[0].sections[1].notation.swarasthana === "S' S' D2 D2 | D2 D2 P P | P P G3 G3 | G3 G3 R2 R2 | R2 R2 S S ||",
    'Janta descent contains explicit paired descending windows')
  const wrongOctave = structuredClone(mohanam.exercises.kil_sthayi_varisai?.[0])
  if (!wrongOctave) throw new Error('Missing lower octave exercise')
  wrongOctave.sections[0].notation.swarasthana += " R2''"
  check(!reviewJanyaExerciseMath(mohanam, wrongOctave, 'kil_sthayi_varisai').passed, 'lower octave exercise cannot include an upper-register foreign position')
  const wrongCycle = structuredClone(mohanam.exercises.alankaras?.[0])
  if (!wrongCycle) throw new Error('Missing Dhruva exercise')
  wrongCycle.sections[0].notation.swarasthana = wrongCycle.sections[0].notation.swarasthana.replace('||', '|')
  check(!reviewJanyaExerciseMath(mohanam, wrongCycle, 'alankaras').passed, 'perfect notes cannot bypass missing internal tala cycle boundaries')
  const tenNotes = ['S', 'R2', 'G3', 'P', 'D2', 'R2', 'G3', 'P', 'D2', 'Ṡ']
  const wrongTen = [...tenNotes]
  wrongTen[1] = 'G3'
  check(janyaMathAccuracy(wrongTen, tenNotes) === 90, 'exact 90% score is not rounded above threshold')
  check(janyaMathAccuracy([...tenNotes, 'S'], [...tenNotes, 'P']) > 90, 'strictly greater than 90% is measurable')
  check(janyaMathAccuracy(['S', 'R2'], ['R2', 'S']) === 0, 'order, not unordered note membership, determines similarity')
  const thresholdRaga: JanyaPracticeRaga = { ...mohanam, arohana: tenNotes.join(' '), avarohana: [...tenNotes].reverse().join(' ') }
  const thresholdExercise: JanyaExercise = { id: 1, name: 'Threshold', sections: [
    { label: 'Ascent', direction: 'arohana', notation: { solfa: '', swarasthana: wrongTen.join(' ') } },
    { label: 'Descent', direction: 'avarohana', notation: { solfa: '', swarasthana: [...tenNotes].reverse().join(' ') } },
  ] }
  const thresholdReview = reviewJanyaExerciseMath(thresholdRaga, thresholdExercise, 'sarali_varisai')
  check(thresholdReview.scores.arohana === 90 && thresholdReview.scores.avarohana === 100 && !thresholdReview.passed, 'one direction at exactly 90% blocks the whole exercise')
  const changedBooklet = structuredClone(booklet)
  const changedBegada = changedBooklet.ragas.find(raga => raga.name === 'Begada')
  if (!changedBegada) throw new Error('Missing Begada fixture')
  changedBegada.arohanam = 'S - G3 - R2 - G3 - M1 - P - S\''
  const rejectedChange = integrateJanyaBooklet(changedBooklet)
  check(!rejectedChange.ragas.some(raga => raga.id === 'begada'), 'changed source cannot inherit old reference approval')
  check(rejectedChange.bookletReview.excluded.some(item => item.name === 'Begada' && item.reason.includes('changed')), 'changed source exclusion has an explicit reason')
  const changedCore = structuredClone(booklet)
  const changedMohanam = changedCore.ragas.find(raga => raga.name === 'Mohanam')
  if (!changedMohanam) throw new Error('Missing source Mohanam')
  changedMohanam.mela_number = 29
  check(!integrateJanyaBooklet(changedCore).ragas.some(raga => raga.id === 'mohanam'), 'legacy core cannot bypass a failed PDF source snapshot')
  const failedExerciseBooklet = structuredClone(booklet)
  const brokenMohanam = failedExerciseBooklet.ragas.find(raga => raga.name === 'Mohanam')
  if (!brokenMohanam) throw new Error('Missing source Mohanam exercises')
  brokenMohanam.exercise_notes.sapta_alankaras[6].arohanam = 'S R1 G3 P ||'
  const keptScale = integrateJanyaBooklet(failedExerciseBooklet).ragas.find(raga => raga.id === 'mohanam')
  check(keptScale?.arohana === mohanam.arohana && keptScale.exercises.alankaras?.[6].sections[0].notation.swarasthana === eka.sections[0].notation.swarasthana,
    'bad source notes cannot contaminate the explicitly completed exercise or scale')
  brokenMohanam.exercise_notes.sapta_alankaras[6].arohanam = ''
  const missingExercise = integrateJanyaBooklet(failedExerciseBooklet).ragas.find(raga => raga.id === 'mohanam')
  check(missingExercise?.arohana === mohanam.arohana && missingExercise.exercises.alankaras?.length === 9, 'missing source notation cannot hide the completed exercise group')
  brokenMohanam.exercise_notes.dhaatu_varisais[1].varisai_number = 1
  const badExerciseIds = integrateJanyaBooklet(failedExerciseBooklet).ragas.find(raga => raga.id === 'mohanam')
  check(badExerciseIds?.exercises.dhaatu_varisai?.length === 3, 'duplicate source IDs cannot remove completed templates')
  console.log(`[Janya release] ${released.ragas.length} reference-verified scales; ${released.exerciseCount} completed exercises; original source assessments retained separately.`)
  const originalBegada = booklet.ragas.find(raga => raga.name === 'Begada')
  if (!originalBegada) throw new Error('Missing original Begada')
  const duplicateBooklet = { ...booklet, total_ragas_count: booklet.ragas.length + 1, ragas: [...booklet.ragas, originalBegada] }
  check(!integrateJanyaBooklet(duplicateBooklet).ragas.some(raga => raga.id === 'begada'), 'duplicate identity fails closed')
  rejects(() => integrateJanyaBooklet({ ...booklet, total_ragas_count: 1 }), 'incorrect booklet count surfaces load error')
  rejects(() => integrateJanyaBooklet({ total_ragas_count: 1, ragas: [{}] }), 'missing identity surfaces load error')
  check(JSON.stringify(curriculum) === sourceBefore, 'loading must not rewrite the unverified source')
  check(data.catalogueCount === 3, 'only individually reference-checked Janya outlines belong in the core')
  check(data.ragas.length === 3, 'unreviewed curriculum-only scales must not leak into the teaching core')
  check(data.ragas.every(raga => ['malahari', 'mohanam', 'abhogi'].includes(raga.id)), 'exact reviewed core membership')
  check(data.ragas.every(raga => raga.scaleReviewStatus === 'SCALE_REFERENCE_CHECKED'), 'each core scale has explicit review evidence')
  check(catalogue.ragas.length === 75 && catalogue.ragas.every(raga => raga.tradition === 'Carnatic'), 'all records are Carnatic, including 72 Melakartas')
  check(!data.ragas.some(raga => raga.id.startsWith('curriculum:')), 'excluded curricula cannot create practice scales')
  const correctedCatalogue = structuredClone(catalogue)
  const catalogueMalahari = correctedCatalogue.ragas.find(raga => raga.raga_id === 'malahari')
  if (!catalogueMalahari) throw new Error('Missing catalogue Malahari')
  catalogueMalahari.arohana_pattern = 'S R1 M1 P D1'
  const preserved = readJanyaPracticeData(correctedCatalogue, curriculum).ragas.find(raga => raga.id === 'malahari')
  check(preserved?.arohana === 'S R1 M1 P D1', 'unverified curriculum must not overwrite catalogue scales')
  rejects(() => readJanyaPracticeData({ ragas: [{
    raga_id: 'hi-test', raga_type: 'hindustani', pattern_basis: 'swara_set',
    swara_set_hindustani: 'S-R-G', arohana_pattern: 'S R2 G3', avarohana_pattern: null,
  }] }, { janya_ragas: [] }), 'non-Carnatic entries must be rejected')
  rejects(() => readJanyaPracticeData({
    teaching_core_only: true,
    ragas: [{ ...catalogueMalahari, review_status: 'SOURCE_TRANSCRIBED_UNVERIFIED' }],
  }, { janya_ragas: [] }), 'core cannot accept an unreviewed scale')
  check(data.curriculumCount === 2 && data.exerciseCount === 96, 'only two matching draft curricula are attached, still unapproved')
  check(new Set(data.ragas.map(raga => raga.id)).size === data.ragas.length, 'merged IDs must be unique')
  check(data.ragas.filter(raga => Object.keys(raga.exercises).length > 0).length === 2, 'only reviewed-core curricula are reachable')
  const malahari = data.ragas.find(raga => raga.name === 'Malahari')
  if (!malahari) throw new Error('Malahari curriculum is missing')
  const first = malahari.exercises.sarali_varisai?.[0]
  if (!first) throw new Error('Malahari Sarali 1 is missing')
  check(validateJanyaExercise(malahari, first, data.releaseStatus).length > 0, 'invalid supplied Malahari must not be playable')
  check(validateJanyaExercise(malahari, first, data.releaseStatus).some(issue => issue.includes('outside the supplied scale')), 'Malahari omitted notes must be detected, not only the approval flag')
  check(malahari.exercises.mel_sthayi_varisai?.[0].sections.length === 6, 'all four Mel Sthayi parts plus directional summaries must be retained')
  for (const raga of data.ragas) {
    for (const speed of [1, 2, 3] as const) {
      const plan = buildJanyaPlaybackPlan(janyaScalePhrases(raga, 'both'), raga.parent, 80, speed)
      check(plan.durationSeconds > 0 && plan.events.length > 0, `${raga.name}: playable scale at ${speed}x`)
      const displayed = janyaScalePhrases(raga, 'both').map(phrase => janyaNotationTokens(phrase, raga.parent))
      check(plan.events.every(event => {
        const token = displayed[event.phraseIndex][event.tokenIndex]
        return token.item?.kind === 'note' && event.item.kind === 'note' &&
          token.raw === event.item.token.raw && token.item.token.svaraId === event.item.token.svaraId &&
          token.item.token.octave === event.item.token.octave
      }), `${raga.name}: every audible note must match the exact displayed position at ${speed}x`)
    }
    for (const exercises of Object.values(raga.exercises)) {
      check(exercises.length > 0, `${raga.name}: empty supplied category`)
      for (const ex of exercises) {
        check(validateJanyaExercise(raga, ex, data.releaseStatus).length > 0, `${raga.name}/${ex.id}: unreviewed source was unlocked`)
        check(ex.sections.every(section => !!section.notation.solfa && !!section.notation.swarasthana), 'notation must not disappear')
      }
    }
  }
  const scale = parseJanyaNotation('S R1 M1 P D1 Ṡ', 15, 'swarasthana')
  check(scale.length === 6, 'Malahari scale must not introduce omitted notes')
  check(scale[0].kind === 'note' && scale[0].token.octave === 0, 'explicit S must be middle octave')
  check(scale[3].kind === 'note' && scale[3].token.octave === 0, 'explicit P must be middle octave')
  check(scale[5].kind === 'note' && scale[5].token.octave === 1, 'dotted Sa must be upper octave')
  const descent = parseJanyaNotation('Ṡ D1 P M1 G3 R1 S', 15, 'swarasthana')
  check(descent[1].kind === 'note' && descent[1].token.octave === 0, 'interior descending notes must not be raised an octave')
  const bhashanga = parseJanyaNotation('S D2 N2 D1 S', 20, 'swarasthana').filter(item => item.kind === 'note')
  check(bhashanga[1].token.svaraId === 'D2' && bhashanga[3].token.svaraId === 'D1', 'explicit anya variants must coexist')
  const vakra = parseJanyaNotation('S G2 R2 G2 M1 P M1 D2 P Ṡ', 22, 'swarasthana').filter(item => item.kind === 'note')
  check(vakra.map(item => item.token.svaraId).join(' ') === 'S G2 R2 G2 M1 P M1 D2 P S', 'vakra path must not be sorted, deduplicated or truncated')
  for (const token of ['p\u0323', 'P\u0323', 'Ṇ', 'Ṣ']) {
    check(parseSvaraToken(token, { defaultVariants: { N: 'N3' } }).octave === -1, `lower-octave token ${token}`)
  }
  check(parseSvaraToken('P_high').octave === 1, 'legacy high Pa alias')
  rejects(() => parseJanyaNotation('S (G3) P', 15, 'swarasthana'), 'parenthesized omitted notes must not be silently stripped')
  rejects(() => parseJanyaNotation('S junk P', 15, 'swarasthana'), 'unknown notes must not become rests or tonic')
  const verified: JanyaPracticeRaga = {
    id: 'fixture', name: 'Fixture', parent: 15, arohana: 'S R1 M1 P D1 Ṡ', avarohana: 'Ṡ D1 P M1 R1 S',
    isVakra: false, reviewStatus: 'VERIFIED_FOR_RELEASE', omitted: { arohana: ['G', 'N'], avarohana: ['G', 'N'] }, exercises: {},
  }
  const ex: JanyaExercise = {
    id: 1, name: 'Fixture', sections: [{ label: 'Arohana', direction: 'arohana', notation: {
      solfa: 's r , | - m p d S ||', swarasthana: 'S R1 , | - M1 P D1 Ṡ ||', semitones: [0, 1, 5, 7, 8, 12],
    } }],
  }
  check(janyaScalePhrases(verified, 'arohana').join(' ') === verified.arohana, 'arohana selection')
  check(janyaScalePhrases(verified, 'avarohana').join(' ') === verified.avarohana, 'avarohana selection')
  check(janyaScalePhrases(verified, 'both').join(' ') === `${verified.arohana} ${verified.avarohana}`, 'both direction order')
  const phrase = ['S R1 , | - M1 P D1 Ṡ ||']
  const normal = buildJanyaPlaybackPlan(phrase, 15, 60, 1)
  check(normal.events.map(event => event.tokenIndex).join() === '0,1,4,5,6,7,8', 'bars and holds must not shift displayed note positions')
  check(normal.events.map(event => event.noteIndex).join() === '0,1,,2,3,4,5', 'rests must not increment the audible note ordinal')
  const displayed = janyaNotationTokens(phrase[0], 15)
  check(displayed[2].item === undefined && displayed[1].item?.kind === 'note' && displayed[1].item.durationBeats === 2, 'comma holds extend the original displayed note')
  for (let index = 0; index < normal.events.length; index++) {
    const event = normal.events[index]
    check(janyaEventIndexAtTime(normal.events, event.startSeconds) === index, 'highlight changes exactly at audio onset')
    check(janyaEventIndexAtTime(normal.events, event.startSeconds + event.durationSeconds / 2) === index, 'highlight spans entire held note or rest')
  }
  check(janyaEventIndexAtTime(normal.events, -0.01) === -1, 'no highlight before playback')
  check(janyaEventIndexAtTime(normal.events, normal.durationSeconds) === -1, 'no highlight after playback or during loop gap')
  const multi = buildJanyaPlaybackPlan(['S | R1', 'P - Ṡ'], 15, 60, 1)
  check(multi.events[2].phraseIndex === 1 && multi.events[2].tokenIndex === 0, 'each section resets its displayed positions')
  const repeats = buildJanyaPlaybackPlan(['S G2 R2 G2 M1 P M1 D2 P Ṡ'], 22, 60, 1)
  check(repeats.events.length === 10 && repeats.events[3].tokenIndex === 3 && repeats.events[6].tokenIndex === 6, 'Vakra repetitions retain distinct displayed/audio positions')
  rejects(() => buildJanyaPlaybackPlan(['S (G3) P'], 15, 60, 1), 'unsupported displayed notation must never play hidden solfa')
  const sparse = buildJanyaPlaybackPlan(['S R1 M1 P D1 Ṡ'], 15, 60, 1)
  check(sparse.events.length === 6, 'a six-note scale must schedule six notes, not eight parent-scale notes')
  check(normal.durationSeconds === 7.5, 'holds and rests must count towards cycle duration')
  check(normal.events[1].durationSeconds === 2 && normal.events[2].startSeconds === 3, 'hold and rest timeline')
  for (const speed of [1, 2, 3] as const) {
    const plan = buildJanyaPlaybackPlan(phrase, 15, 60, speed)
    check(plan.durationSeconds === normal.durationSeconds / speed, `exact ${speed}x cycle duration`)
    check(plan.events.every((event, index) => Math.abs(event.startSeconds - normal.events[index].startSeconds / speed) < 1e-10), `exact ${speed}x onset times`)
    check(plan.events.every((event, index) => event.durationSeconds === normal.events[index].durationSeconds / speed), `exact ${speed}x note and rest durations`)
  }
  check(buildJanyaPlaybackPlan(phrase, 15, 120, 1).durationSeconds === normal.durationSeconds / 2, 'BPM and speed must be independent')
  rejects(() => buildJanyaPlaybackPlan(phrase, 15, 0, 1), 'zero tempo must be rejected')
  rejects(() => buildJanyaPlaybackPlan(['- |'], 15, 60, 1), 'rest-only practice must be rejected')
  check(validateJanyaExercise(verified, ex, 'VERIFIED_FOR_RELEASE').length === 0, 'matching approved fixture should pass')
  check(validateJanyaExercise(verified, ex).length > 0, 'missing release approval must remain locked')
  check(validateJanyaExercise({ ...verified, reviewStatus: undefined }, ex, 'VERIFIED_FOR_RELEASE').length > 0, 'missing raaga approval must remain locked')
  check(validateJanyaExercise({ ...verified, isVakra: true }, ex, 'VERIFIED_FOR_RELEASE').length > 0, 'vakra grammar must not be certified from membership')
  check(validateJanyaExercise(verified, { ...ex, sections: [] }, 'VERIFIED_FOR_RELEASE').length > 0, 'empty exercise must not unlock')
  for (const change of [
    { solfa: 's g m p d S' },
    { swarasthana: 'S R2 , | - M1 P D1 Ṡ ||' },
    { swarasthana: 'S R1 | - M1 P D1 Ṡ ||' },
    { semitones: [0] },
  ]) {
    const changed: JanyaExercise = { ...ex, sections: [{ ...ex.sections[0], notation: { ...ex.sections[0].notation, ...change } }] }
    check(validateJanyaExercise(verified, changed, 'VERIFIED_FOR_RELEASE').length > 0, 'invalid identity, hold, scale or semitone data must lock playback')
  }
  const pitch = resolveSvaraPitch({ svaraId: 'D2', octave: -1, tonicHz: 220, tuningPolicy: 'just_intonation' })
  check(pitch.frequencyHz > 0 && pitch.frequencyHz < 220, 'pitch resolution must honor tonic and octave')
  rejects(() => readJanyaPracticeData({ ragas: [] }, { janya_ragas: [{}] }), 'malformed curriculum must surface an error')
  rejects(() => readJanyaPracticeData({ ragas: [{ raga_type: 'janya' }] }, { janya_ragas: [] }), 'malformed catalogue must surface an error')
  return count
}
