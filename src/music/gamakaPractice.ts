export interface GamakaPoint { t_ms: number; cents: number }
export interface GamakaStencil { duration_ms: number; trajectory_points: GamakaPoint[] }
export interface GamakaTiming {
  default_gamaka_duration_sec: number
  default_plain_duration_sec: number
  comparison_gap_sec: number
  lead_in_anchor_pad_sec: number
  lead_out_anchor_pad_sec: number
}

export function buildGamakaPracticePlan(stencil: GamakaStencil, multiplier: number, timing: GamakaTiming) {
  if (![1, 1.5, 2].includes(multiplier) || !Number.isFinite(stencil.duration_ms) || stencil.duration_ms <= 0) {
    throw new Error('Invalid Gamaka duration or practice speed.')
  }
  const source = stencil.trajectory_points
  if (source.length < 2 || source.some((p, i) => !Number.isFinite(p.cents) || !Number.isFinite(p.t_ms) ||
    p.t_ms < 0 || p.t_ms > stencil.duration_ms || (i > 0 && p.t_ms <= source[i - 1].t_ms)) ||
    source[0].t_ms !== 0 || source[source.length - 1].t_ms !== stencil.duration_ms) {
    throw new Error('Gamaka trajectory must have increasing timestamps spanning its duration.')
  }
  const durationMs = timing.default_gamaka_duration_sec * 1000 * multiplier
  const leadMs = timing.lead_in_anchor_pad_sec * 1000 * multiplier
  const tailMs = timing.lead_out_anchor_pad_sec * 1000 * multiplier
  const contourMs = durationMs - leadMs - tailMs
  if (![durationMs, leadMs, tailMs, contourMs, timing.default_plain_duration_sec, timing.comparison_gap_sec].every(Number.isFinite) ||
    leadMs <= 0 || tailMs <= 0 || contourMs <= 0 || timing.default_plain_duration_sec <= 0 || timing.comparison_gap_sec < 0) {
    throw new Error('Invalid Gamaka playback timing.')
  }
  const points = [
    { t_ms: 0, cents: source[0].cents },
    ...source.map(p => ({ t_ms: leadMs + p.t_ms / stencil.duration_ms * contourMs, cents: p.cents })),
    { t_ms: durationMs, cents: source[source.length - 1].cents },
  ]
  return {
    points, durationMs,
    sourceTimeToPracticeMs: (time: number) => leadMs + time / stencil.duration_ms * contourMs,
    plainDurationMs: timing.default_plain_duration_sec * 1000 * multiplier,
    gapMs: timing.comparison_gap_sec * 1000,
    plainCents: source[0].cents,
  }
}

export function interpolateGamaka(points: GamakaPoint[], time: number): number {
  if (!points.length) throw new Error('Missing Gamaka contour.')
  if (time <= points[0].t_ms) return points[0].cents
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i]
    if (time <= b.t_ms) return a.cents + (b.cents - a.cents) * (time - a.t_ms) / (b.t_ms - a.t_ms)
  }

  return points[points.length - 1].cents
}

export function detectGamakaPitch(buffer: Float32Array, sampleRate: number): number | null {
  let energy = 0
  for (const value of buffer) energy += value * value
  if (Math.sqrt(energy / buffer.length) < 0.012) return null
  const maximum = Math.min(Math.floor(buffer.length / 2) - 1, Math.floor(sampleRate / 75))
  const minimum = Math.max(2, Math.floor(sampleRate / 1000))
  const difference = new Float64Array(maximum + 1)
  difference[0] = 1
  let sum = 0
  for (let offset = 1; offset <= maximum; offset++) {
    let squaredDifference = 0
    for (let i = 0; i < buffer.length - maximum; i++) {
      const delta = buffer[i] - buffer[i + offset]
      squaredDifference += delta * delta
    }
    sum += squaredDifference
    difference[offset] = sum > 0 ? squaredDifference * offset / sum : 1
  }
  for (let offset = minimum; offset < maximum; offset++) {
    if (difference[offset] >= 0.15) continue
    while (offset + 1 < maximum && difference[offset + 1] < difference[offset]) offset++
    const left = difference[offset - 1], center = difference[offset], right = difference[offset + 1]
    const denominator = left - 2 * center + right
    const period = offset + (denominator ? (left - right) / (2 * denominator) : 0)
    const frequency = sampleRate / period
    return frequency >= 75 && frequency <= 1000 ? frequency : null
  }
  return null
}
