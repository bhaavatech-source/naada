import { getMelakartaVariantMap } from './melakartaMapping'

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

export function parseRagaScale(pattern: string | undefined, melaNumber?: number): number[] {
  if (!pattern) return []

  const variants = Number.isInteger(melaNumber) && melaNumber! >= 1 && melaNumber! <= 72
    ? getMelakartaVariantMap(melaNumber!)
    : null
  const notes: number[] = []

  for (const raw of pattern.normalize('NFC').trim().split(/\s+/).filter(Boolean)) {
    const token = raw.replace(/[|]/g, '').trim()
    if (!token || token === ',') continue

    const low = token.endsWith(',')
    const note = low ? token.slice(0, -1) : token
    const high = note === '\u1e60' || note === 'S\u0307' || note === 'S.'
    const family = (high ? 'S' : note).toUpperCase()
    const svara = variants && family in variants
      ? variants[family as keyof typeof variants]
      : family
    const semitone = SEMITONES[svara]

    if (typeof semitone !== 'number') return []
    notes.push(semitone + (high ? 12 : low ? -12 : 0))
  }

  return notes
}
