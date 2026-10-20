/** Pure rhythm arithmetic for the Tāla Trainer. Durations are integer pulse units. */
export type PhraseValidationStatus = 'EMPTY' | 'UNDERFILLED' | 'EXACT_AVARTANA' | 'OVERFLOW'
export interface PhraseValidation { status: PhraseValidationStatus; totalPulses: number; cyclePulses: number; completedCycles: number; remainder: number; pulsesToNextBoundary: number; landingPulse: number; alignedToTarget: boolean }

export function validatePhrase(totalPulses: number, cyclePulses: number, targetOffset = 0): PhraseValidation {
  if (!Number.isFinite(cyclePulses) || cyclePulses <= 0) throw new Error('cyclePulses must be a positive number')
  if (!Number.isFinite(totalPulses) || totalPulses < 0) throw new Error('totalPulses must be non-negative')
  const completedCycles = Math.floor(totalPulses / cyclePulses)
  const remainder = totalPulses % cyclePulses
  const status: PhraseValidationStatus = totalPulses === 0 ? 'EMPTY' : remainder === 0 ? 'EXACT_AVARTANA' : totalPulses < cyclePulses ? 'UNDERFILLED' : 'OVERFLOW'
  const landingPulse = ((remainder + targetOffset) % cyclePulses + cyclePulses) % cyclePulses
  return { status, totalPulses, cyclePulses, completedCycles, remainder, pulsesToNextBoundary: remainder === 0 ? 0 : cyclePulses - remainder, landingPulse, alignedToTarget: landingPulse === 0 }
}

/** Absolute tap timing errors against expected beat timestamps (milliseconds). */
export function scoreTapTiming(tapsMs: number[], expectedMs: number[], beatDurationMs: number): { score: number | null; meanAbsoluteErrorMs: number | null; matched: number } {
  if (tapsMs.length < 2 || expectedMs.length === 0 || beatDurationMs <= 0) return { score: null, meanAbsoluteErrorMs: null, matched: tapsMs.length }
  const errors = tapsMs.map(tap => Math.min(...expectedMs.map(expected => Math.abs(tap - expected))))
  const meanAbsoluteErrorMs = errors.reduce((sum, error) => sum + error, 0) / errors.length
  return { score: Math.round(Math.max(0, Math.min(100, 100 * (1 - meanAbsoluteErrorMs / (beatDurationMs / 2))))), meanAbsoluteErrorMs: Math.round(meanAbsoluteErrorMs), matched: tapsMs.length }
}
