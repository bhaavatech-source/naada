import { type SvaraId, type SvaraFamily, SvaraValidationError } from './svaraValidation';

export const CHAKRA_NAMES: readonly string[] = Object.freeze([
  'Indu',    // 1-6
  'Netra',   // 7-12
  'Agni',    // 13-18
  'Veda',    // 19-24
  'Bana',    // 25-30
  'Rutu',    // 31-36
  'Rishi',   // 37-42
  'Vasu',    // 43-48
  'Brahma',  // 49-54
  'Disi',    // 55-60
  'Rudra',   // 61-66
  'Aditya',  // 67-72
]);

export function getMelakartaSvaraIds(
  melaNumber: number
): readonly [SvaraId, SvaraId, SvaraId, SvaraId, SvaraId, SvaraId, SvaraId] {
  if (!Number.isInteger(melaNumber) || melaNumber < 1 || melaNumber > 72) {
    throw new SvaraValidationError(
      `Invalid Melakarta number: ${melaNumber}. Must be an integer between 1 and 72.`
    );
  }

  const s: SvaraId = 'S';
  const p: SvaraId = 'P';
  const m: SvaraId = melaNumber <= 36 ? 'M1' : 'M2';

  const chakraIndex = Math.floor((melaNumber - 1) / 6);
  const rgIndex = chakraIndex % 6;

  const rgPairs: Array<[SvaraId, SvaraId]> = [
    ['R1', 'G1'], // Chakra 1 & 7  (Indu, Rishi) - Vivadi
    ['R1', 'G2'], // Chakra 2 & 8  (Netra, Vasu)
    ['R1', 'G3'], // Chakra 3 & 9  (Agni, Brahma) - e.g. Mayamalavagowla (#15)
    ['R2', 'G2'], // Chakra 4 & 10 (Veda, Disi)   - e.g. Kharaharapriya (#22)
    ['R2', 'G3'], // Chakra 5 & 11 (Bana, Rudra)  - e.g. Sankarabharanam (#29)
    ['R3', 'G3'], // Chakra 6 & 12 (Rutu, Aditya) - Vivadi
  ];
  const [r, g] = rgPairs[rgIndex];

  const dnIndex = (melaNumber - 1) % 6;

  const dnPairs: Array<[SvaraId, SvaraId]> = [
    ['D1', 'N1'], // 1st raga in chakra - Vivadi
    ['D1', 'N2'], // 2nd raga in chakra
    ['D1', 'N3'], // 3rd raga in chakra - e.g. Mayamalavagowla (#15)
    ['D2', 'N2'], // 4th raga in chakra - e.g. Kharaharapriya (#22)
    ['D2', 'N3'], // 5th raga in chakra - e.g. Sankarabharanam (#29)
    ['D3', 'N3'], // 6th raga in chakra - Vivadi
  ];
  const [d, n] = dnPairs[dnIndex];

  return Object.freeze([s, r, g, m, p, d, n]);
}

export function getMelakartaVariantMap(melaNumber: number): Record<SvaraFamily, SvaraId> {
  const [s, r, g, m, p, d, n] = getMelakartaSvaraIds(melaNumber);
  return {
    S: s,
    R: r,
    G: g,
    M: m,
    P: p,
    D: d,
    N: n,
  };
}

export function getMelakartaChakraName(melaNumber: number): string {
  if (!Number.isInteger(melaNumber) || melaNumber < 1 || melaNumber > 72) {
    throw new SvaraValidationError(`Invalid Melakarta number: ${melaNumber}`);
  }
  const chakraIdx = Math.floor((melaNumber - 1) / 6);
  return CHAKRA_NAMES[chakraIdx];
}

export function getRVariantKey(melaNumber: number): 'R1' | 'R2' | 'R3' {
  return getMelakartaSvaraIds(melaNumber)[1] as 'R1' | 'R2' | 'R3';
}

export function getGVariantKey(melaNumber: number): 'G1' | 'G2' | 'G3' {
  return getMelakartaSvaraIds(melaNumber)[2] as 'G1' | 'G2' | 'G3';
}

export function getMVariantKey(melaNumber: number): 'M1' | 'M2' {
  return getMelakartaSvaraIds(melaNumber)[3] as 'M1' | 'M2';
}

export function getDVariantKey(melaNumber: number): 'D1' | 'D2' | 'D3' {
  return getMelakartaSvaraIds(melaNumber)[5] as 'D1' | 'D2' | 'D3';
}

export function getNVariantKey(melaNumber: number): 'N1' | 'N2' | 'N3' {
  return getMelakartaSvaraIds(melaNumber)[6] as 'N1' | 'N2' | 'N3';
}
