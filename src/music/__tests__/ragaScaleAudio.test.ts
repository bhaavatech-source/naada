import catalogue from '../../data/raga-bhava-rasa-taxonomy.json' with { type: 'json' }
import { getMelakartaSvaraIds } from '../melakartaMapping'
import { parseRagaScale } from '../ragaScaleAudio'

const SEMITONES: Readonly<Record<string, number>> = {
  S: 0,
  R1: 1,
  R2: 2,
  R3: 3,
  G1: 2,
  G2: 3,
  G3: 4,
  M1: 5,
  M2: 6,
  P: 7,
  D1: 8,
  D2: 9,
  D3: 10,
  N1: 9,
  N2: 10,
  N3: 11,
}

interface CatalogueRaga {
  raga_id: string
  raga_type?: string
  mela_number?: number
  arohana_pattern?: string
  avarohana_pattern?: string
}

export function runRagaScaleAudioTests(): number {
  let count = 0
  const check = (condition: boolean, message: string) => {
    if (!condition) throw new Error(`Rāga scale audio: ${message}`)
    count++
  }

  check(
    JSON.stringify(parseRagaScale('S R G M P D N Ṡ', 15)) ===
      JSON.stringify([0, 1, 4, 5, 7, 8, 11, 12]),
    'bare svara families resolve from their parent Melakarta',
  )
  check(
    JSON.stringify(parseRagaScale('S R2 G2 M1 P D2 N2 Ṡ', 15)) ===
      JSON.stringify([0, 2, 3, 5, 7, 9, 10, 12]),
    'explicit anya-svara variants override the parent scale',
  )
  check(
    JSON.stringify(parseRagaScale('S, R2, S', 15)) === JSON.stringify([-12, -10, 0]),
    'lower-octave comma notation preserves register',
  )
  check(parseRagaScale('S X P', 15).length === 0, 'unknown notation is rejected rather than partially played')
  check(parseRagaScale('S R G M P D N Ṡ').length === 0, 'bare families without a parent scale are rejected')

  const ragas = (catalogue as { ragas: CatalogueRaga[] }).ragas
  const melakartas = ragas.filter(raga => raga.raga_type === 'melakarta')
  check(melakartas.length === 72, 'the Explorer catalogue contains all 72 Melakartas')

  for (const raga of ragas) {
    for (const [direction, pattern] of [
      ['ārohaṇa', raga.arohana_pattern],
      ['avarohaṇa', raga.avarohana_pattern],
    ] as const) {
      const parsed = parseRagaScale(pattern, raga.mela_number)
      check(parsed.length > 0, `${raga.raga_id} ${direction} parses`)
      const noteCount = pattern!.trim().split(/\s+/).filter(token => !['|', ',', '||'].includes(token)).length
      check(parsed.length === noteCount, `${raga.raga_id} ${direction} preserves every note`)
    }
  }

  for (const raga of melakartas) {
    const expected = getMelakartaSvaraIds(raga.mela_number!).map(svara => SEMITONES[svara])
    const ascending = parseRagaScale(raga.arohana_pattern, raga.mela_number)
    const descending = parseRagaScale(raga.avarohana_pattern, raga.mela_number)
    check(
      JSON.stringify(ascending.slice(0, 7)) === JSON.stringify(expected) &&
        ascending[7] === 12 &&
        JSON.stringify(descending) === JSON.stringify([12, ...expected.slice(1).reverse(), 0]),
      `${raga.raga_id} pitch order matches its canonical Melakarta`,
    )
  }

  return count
}
