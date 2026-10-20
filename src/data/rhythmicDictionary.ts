/**
 * Starter phrase vocabulary for Nāda Vidyā.
 * These are illustrative syllabic options, not an authoritative catalogue of
 * bani-specific nattuvangam compositions. A teacher should review variants.
 */
export type SyllableDisplayMode = 'math' | 'sollukattu' | 'jathi'
export interface SyllablePackage {
  mathLabel: string
  sollukattuDefault: string
  jathiOptions: string[]
}
export const RHYTHMIC_DICTIONARY: Record<number, SyllablePackage> = {
  1: { mathLabel: '+1', sollukattuDefault: 'Ta', jathiOptions: ['Tha', 'Dhim', 'Nam'] },
  2: { mathLabel: '+2', sollukattuDefault: 'Ta Ka', jathiOptions: ['Ta Ka', 'Ta Num'] },
  3: { mathLabel: '+3', sollukattuDefault: 'Ta Ki Ta', jathiOptions: ['Ta Ri Ta', 'Taka Tha', 'Jham Ki Ta'] },
  4: { mathLabel: '+4', sollukattuDefault: 'Ta Ka Di Mi', jathiOptions: ['Ta Ri Ki Ta', 'Ta Dhi M Ta', 'Ku Ku Ta Ka'] },
  5: { mathLabel: '+5', sollukattuDefault: 'Ta Ka Ta Ki Ta', jathiOptions: ['Ta Zham Ta Ki Ta', 'Jhanu Ta Ki Ta', 'Ta Ka Dhi M Ta'] },
  6: { mathLabel: '+6', sollukattuDefault: 'Ta Ka Di Mi Ta Ka', jathiOptions: ['Ta Ri Ki Ta Ta Ka', 'Jhanu Ta Ka Dhi Mi'] },
  7: { mathLabel: '+7', sollukattuDefault: 'Ta Ka Di Mi Ta Ki Ta', jathiOptions: ['Ta Zham Ta Ri Ki Ta Ta', 'Dhi M Ta Ka Jham Ta Ka'] },
  8: { mathLabel: '+8', sollukattuDefault: 'Ta Ka Di Mi Ta Ka Di Mi', jathiOptions: ['Ta Ri Ki Ta Jin Ka Dhi Mi', 'Ta Dhi M Ta Ta Zham Ta Ka'] },
  9: { mathLabel: '+9', sollukattuDefault: 'Ta Ka Di Mi Ta Ka Ta Ki Ta', jathiOptions: ['Ta Ka Di Mi Jhanu Ta Ki Ta', 'Ku Ku Ta Ka Ta Zham Ta Ki Ta'] },
  10: { mathLabel: '+10', sollukattuDefault: '10 pulses', jathiOptions: ['Ta Ka Di Mi Ta Ka Ta Ki Ta Ka'] },
  12: { mathLabel: '+12', sollukattuDefault: '12 pulses', jathiOptions: ['Tadhinona Tadhinona Tadhinona'] },
  14: { mathLabel: '+14', sollukattuDefault: '14 pulses', jathiOptions: ['Ta Ka Di Mi Ta Ki Ta (×2)'] },
  16: { mathLabel: '+16', sollukattuDefault: '16 pulses', jathiOptions: ['Ta Ri Ki Ta Dhi Mi Ki Ta (×2)'] },
}
