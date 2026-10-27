import catalogue from '../../data/raga-wellbeing-catalogue.json' with { type: 'json' }
import database from '../../data/raga-healing-therapy-database-v2_2.json' with { type: 'json' }
import library from '../../data/therapeutic-keerthanas-library-v1_2.json' with { type: 'json' }
import references from '../../data/janya-pdf-review.json' with { type: 'json' }
import { MELAKARTAS } from '../../data/ragas'
import { readRagaPracticeTarget } from '../ragaPracticeTarget'

export function runWellbeingTests(): number {
  let count = 0
  const check = (condition: boolean, message: string) => {
    if (!condition) throw new Error(`Wellbeing catalogue: ${message}`)
    count++
  }
  const rejects = (value: unknown) => {
    let rejected = false
    try { readRagaPracticeTarget(value) } catch { rejected = true }
    check(rejected, `invalid practice target ${JSON.stringify(value)} rejected`)
  }
  const sameKeys = (value: object, keys: string[]) =>
    Object.keys(value).sort().join() === [...keys].sort().join()
  check(catalogue.ragas.length === 102 && new Set(catalogue.ragas.map(raga => raga.id)).size === 102, '102 unique catalogue entries')
  check(sameKeys(catalogue, ['version', 'ragas', 'compositions']), 'public root uses only reviewed musical and composition fields')
  const linkedMelakartas = new Set<number>()
  let linkedJanyas = 0
  for (const raga of catalogue.ragas) {
    check(Object.keys(raga).every(key =>
      ['id', 'name', 'tradition', 'practiceTarget', 'scale', 'note', 'tags'].includes(key)),
    `${raga.id}: allowlisted public fields`)
    check(!raga.note || !/traditionally associated|often associated|often explored|explore its musical character/i.test(raga.note),
      `${raga.id}: no vague repeated listening description`)
    check((raga.tags ?? []).every(tag => ['calm', 'reflective', 'uplifting', 'devotional'].includes(tag)),
      `${raga.id}: only reviewed listening tags`)
    check(raga.scale === null || sameKeys(raga.scale, ['arohana', 'avarohana']), `${raga.id}: only reviewed scales exposed`)
    const target = readRagaPracticeTarget(raga.practiceTarget)
    const source = database.therapeutic_ragas_catalog.find(row => row.raga_id === raga.id)
    check(!!source, `${raga.id}: source identity exists`)
    if (!source) throw new Error('Missing source identity')
    check(JSON.stringify(source.catalogue_review.practice_target) === JSON.stringify(raga.practiceTarget),
      `${raga.id}: public link equals reviewed source link`)
    check(source.catalogue_review.clinical_recommendations_enabled === false, `${raga.id}: clinical recommendations disabled`)
    if (target?.family === 'melakarta') {
      const mela = MELAKARTAS.find(item => item.number === target.number)
      check(!!mela && raga.scale?.arohana === mela.ascending.join(' ').replace(/S\./g, 'Ṡ') &&
        raga.scale.avarohana === mela.descending.join(' ').replace(/S\./g, 'Ṡ'), `${raga.id}: exact registry formula and target`)
      linkedMelakartas.add(target.number)
    } else if (target?.family === 'janya') {
      const reference = references.decisions.find(row => row.key === target.id)
      check(!!reference && ['EXCEL_SCALE_VERIFIED', 'PDF_SCALE_VERIFIED'].includes(reference.status) &&
        raga.scale?.arohana === reference.ascent && raga.scale?.avarohana === reference.descent,
      `${raga.id}: exact approved directional scale and target`)
      check(source.scale_structure.arohana === raga.scale?.arohana && source.scale_structure.avarohana === raga.scale?.avarohana,
        `${raga.id}: original database updated to selected reference`)
      linkedJanyas++
    } else {
      check(raga.scale === null, `${raga.id}: unverified scale not leaked into public catalogue`)
    }
  }
  const publicListeningNotes = catalogue.ragas.flatMap(raga => raga.note ? [raga.note] : [])
  check(new Set(publicListeningNotes).size === publicListeningNotes.length,
    'listening descriptions are not repeated across rāgas')
  check(catalogue.ragas.find(raga => raga.id === 'raga_hamsadhwani')?.note ===
    'Bright and uplifting, suited to morning meditation and focused listening.',
  'Hamsadhvani has a specific, concise listening description')
  check(catalogue.ragas.find(raga => raga.id === 'raga_hamsadhwani')?.tags?.includes('uplifting') === true,
    'Hamsadhvani listening filter metadata is retained')
  check(linkedMelakartas.size === 72 && linkedJanyas === 20, 'all 72 Melakartas and 20 approved Janyas linked')
  check(catalogue.ragas.find(row => row.id === 'raga_manji')?.scale?.avarohana === 'Ṡ N2 D2 P M1 P M1 P G2 R2 S',
    'Manji follows workbook version rather than old contradictory descent')
  const bageshri = database.therapeutic_ragas_catalog.find(row => row.raga_id === 'raga_bageshri')
  check(bageshri?.scale_structure.notes_count === 5 && bageshri.scale_structure.notes_count_avarohana === 7,
    'Bageshri note-count correction is persistent')
  for (const id of ['raga_bageshri', 'raga_darbari_kanada']) {
    const raga = catalogue.ragas.find(row => row.id === id)
    check(raga?.tradition === 'Hindustani; proposed Carnatic adaptation unverified' && raga.practiceTarget === null,
      `${id}: adaptation not silently treated as Carnatic equivalence`)
  }
  check(catalogue.compositions.length === 4, 'four compositions retained as metadata')
  check(catalogue.compositions.filter(item => item.kind === 'traditional').length === 2 &&
    catalogue.compositions.filter(item => item.kind === 'project-original').length === 2, 'traditional/project works distinguished')
  for (const item of catalogue.compositions) {
    check(sameKeys(item, ['id', 'title', 'composer', 'kind', 'ragaId', 'tala', 'playbackEnabled']), `${item.id}: no unverified melody, lyrics, gamakas or eduppu exposed`)
    check(!item.playbackEnabled && catalogue.ragas.some(row => row.id === item.ragaId), `${item.id}: valid rāga link; playback blocked`)
    const source = library.keerthanas.find(row => row.id === item.id)
    check(source?.catalogue_review.playback_enabled === false &&
      source.catalogue_review.notation_status === 'unverified-illustrative-outline', `${item.id}: persistent source playback gate`)
    const raga = catalogue.ragas.find(row => row.id === item.ragaId)
    const target = readRagaPracticeTarget(raga?.practiceTarget)
    const parent = target?.family === 'melakarta' ? target.number :
      target?.family === 'janya' ? references.decisions.find(row => row.key === target.id)?.parent : undefined
    check(!!parent && source?.mela_number === parent && source.raga_name === raga?.name,
      `${item.id}: source composition identity aligned with the selected scale reference`)
    check(!/cure|rogahara|rōgahara|therapeutic|healing/i.test(item.title), `${item.id}: no treatment-branded public title`)
  }
  check(readRagaPracticeTarget(null) === null, 'metadata-only target supported')
  for (const value of [undefined, {}, { family: 'melakarta', number: 0 }, { family: 'melakarta', number: 73 },
    { family: 'melakarta', number: 1.5 }, { family: 'janya', id: '' }, { family: 'janya', id: '../unknown' }]) rejects(value)
  return count
}
