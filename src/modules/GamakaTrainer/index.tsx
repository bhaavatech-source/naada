import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import curriculum from '../../data/gamaka-vocal-trainer-and-notation-v2.json'
import { playGamakaGlide } from '../../audio/engine'
import { useAppStore } from '../../store/useAppStore'

type TrajectoryPoint = { t_ms: number; cents: number }
type GamakaExercise = {
  id: string
  title: string
  ornament_type: string
  raga: string
  description: string
  pronunciation_cue?: string
  visual_stencil: { type: string; duration_ms: number; trajectory_points: TrajectoryPoint[] }
  game_meta?: { star_waypoints?: Array<{ t_ms: number; cents: number; tolerance_cents: number; star_value: number; swarasthana_target: string }> }
}
type LivePoint = { t_ms: number; cents: number }

const exercise = curriculum.curriculum_levels.level_1_beginner.exercises.find(
  item => item.id === 'gamaka_L1_01'
) as GamakaExercise | undefined

const W = 900
const H = 350
const PAD = { left: 62, right: 24, top: 28, bottom: 48 }
const DURATION = exercise?.visual_stencil.duration_ms ?? 1200

function detectPitch(buffer: Float32Array, sampleRate: number): number | null {
  let rms = 0
  for (let i = 0; i < buffer.length; i++) rms += buffer[i] * buffer[i]
  rms = Math.sqrt(rms / buffer.length)
  if (rms < 0.012) return null

  // Autocorrelation-based pitch estimate for a voiced signal.
  let bestOffset = -1
  let bestCorrelation = 0
  const minOffset = Math.max(2, Math.floor(sampleRate / 1000))
  const maxOffset = Math.min(buffer.length - 1, Math.floor(sampleRate / 75))

  for (let offset = minOffset; offset <= maxOffset; offset++) {
    let correlation = 0
    for (let i = 0; i < buffer.length - offset; i += 2) {
      correlation += buffer[i] * buffer[i + offset]
    }
    correlation /= Math.max(1, (buffer.length - offset) / 2)
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation
      bestOffset = offset
    }
  }

  if (bestOffset < 1 || bestCorrelation < 0.01) return null
  const frequency = sampleRate / bestOffset
  return frequency >= 75 && frequency <= 1000 ? frequency : null
}

function centsForFrequency(frequency: number, tonicHz: number) {
  return 1200 * Math.log2(frequency / tonicHz)
}

function interpolate(points: TrajectoryPoint[], time: number): number {
  if (!points.length) return 0
  if (time <= points[0].t_ms) return points[0].cents
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]
    const b = points[i]
    if (time <= b.t_ms) {
      const ratio = (time - a.t_ms) / Math.max(1, b.t_ms - a.t_ms)
      return a.cents + (b.cents - a.cents) * ratio
    }
  }
  return points[points.length - 1].cents
}

export default function GamakaTrainer() {
  const [tonicHz, setTonicHz] = useState(261.63)
  const [isListening, setIsListening] = useState(false)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [livePoints, setLivePoints] = useState<LivePoint[]>([])
  const [currentPitch, setCurrentPitch] = useState<number | null>(null)
  const [micError, setMicError] = useState('')
  const [finished, setFinished] = useState(false)
  const audioRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const bufferRef = useRef<Float32Array | null>(null)
  const startRef = useRef<number | null>(null)
  const frameRef = useRef<number | null>(null)
  const lastSampleRef = useRef(0)
  const liveRef = useRef<LivePoint[]>([])
  const { settings } = useAppStore()

  const points = exercise?.visual_stencil.trajectory_points ?? []
  const duration = exercise?.visual_stencil.duration_ms ?? DURATION

  const stopListening = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    frameRef.current = null
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
    if (audioRef.current) void audioRef.current.close()
    audioRef.current = null
    analyserRef.current = null
    bufferRef.current = null
    setIsListening(false)
  }, [])

  useEffect(() => () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    streamRef.current?.getTracks().forEach(track => track.stop())
    if (audioRef.current) void audioRef.current.close()
  }, [])



const listenToGamaka = () => {
  if (!points.length || !duration) return

  playGamakaGlide(
    settings.tonicHz,
    points,
    duration,
    settings.volume,
    settings.instrument,
  )
}


  const startListening = async () => {
    setMicError('')
    setLivePoints([])
    liveRef.current = []
    setCurrentPitch(null)
    setElapsedMs(0)
    setFinished(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      })
      const context = new AudioContext()
      await context.resume()
      const source = context.createMediaStreamSource(stream)
      const analyser = context.createAnalyser()
      analyser.fftSize = 4096
      analyser.smoothingTimeConstant = 0
      source.connect(analyser)
      streamRef.current = stream
      audioRef.current = context
      analyserRef.current = analyser
      bufferRef.current = new Float32Array(new ArrayBuffer(analyser.fftSize))
      startRef.current = null
      lastSampleRef.current = 0
      setIsListening(true)

      const tick = (now: number) => {
        if (startRef.current === null) startRef.current = now
        const elapsed = now - startRef.current
        setElapsedMs(Math.min(elapsed, duration))
        const analyserNow = analyserRef.current
        const bufferRef = useRef<Float32Array<ArrayBuffer> | null>(null)
        if (analyserNow && bufferRef.current && now - lastSampleRef.current >= 55) {
          analyserNow.getFloatTimeDomainData(bufferRef.current)
          const frequency = detectPitch(bufferRef.current, context.sampleRate)
          if (frequency !== null) {
            const cents = centsForFrequency(frequency, tonicHz)
            setCurrentPitch(cents)
            const next = [...liveRef.current, { t_ms: elapsed, cents }].filter(p => p.t_ms <= duration)
            liveRef.current = next
            setLivePoints(next)
          } else {
            setCurrentPitch(null)
          }
          lastSampleRef.current = now
        }
        if (elapsed < duration && analyserRef.current) {
          frameRef.current = requestAnimationFrame(tick)
        } else {
          setFinished(true)
          stopListening()
        }
      }
      frameRef.current = requestAnimationFrame(tick)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Microphone access failed.'
      setMicError(message.includes('Permission') || message.includes('denied')
        ? 'Microphone permission was denied. Allow microphone access in your browser settings and try again.'
        : 'Could not start the microphone. Check that a microphone is connected and the page is using localhost or HTTPS.')
      stopListening()
    }
  }

  const chart = useMemo(() => {
    if (!points.length) return null
    const plotW = W - PAD.left - PAD.right
    const plotH = H - PAD.top - PAD.bottom
    const minCents = -80
    const maxCents = 780
    const x = (time: number) => PAD.left + (Math.max(0, Math.min(duration, time)) / duration) * plotW
    const y = (cents: number) => PAD.top + ((maxCents - cents) / (maxCents - minCents)) * plotH
    const targetPath = points.map((p, i) => `${i ? 'L' : 'M'} ${x(p.t_ms)} ${y(p.cents)}`).join(' ')
    const livePath = livePoints.map((p, i) => `${i ? 'L' : 'M'} ${x(p.t_ms)} ${y(p.cents)}`).join(' ')
    return { x, y, targetPath, livePath, plotW, plotH, minCents, maxCents }
  }, [points, livePoints, duration])

  const accuracy = useMemo(() => {
    if (!livePoints.length) return null
    const errors = livePoints.map(p => Math.abs(p.cents - interpolate(points, p.t_ms)))
    const average = errors.reduce((sum, value) => sum + value, 0) / errors.length
    return Math.max(0, Math.round(100 * (1 - average / 350)))
  }, [livePoints, points])

  if (!exercise) {
    return <div style={{ padding: 24, color: 'var(--text)' }}>Exercise gamaka_L1_01 was not found in the curriculum JSON.</div>
  }

  return (
    <div style={{ padding: 22, height: '100%', overflowY: 'auto', background: 'var(--bg)', color: 'var(--text)' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 18 }}>
        <div>
          <div style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 700, letterSpacing: 1.4 }}>NĀDA VĀHANA · LEVEL 1</div>
          <h2 style={{ fontSize: 27, margin: '5px 0' }}>Gamaka Trainer</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>Sing the glide. Watch your voice trace the curve.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: 10, border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface)' }}>
          <label htmlFor="gamaka-tonic" style={{ fontSize: 13, color: 'var(--text-muted)' }}>Sa tonic</label>
          <select id="gamaka-tonic" aria-label="Choose Sa tonic" value={tonicHz}
            onChange={e => setTonicHz(Number(e.target.value))}
            style={{ maxWidth: 140, padding: '7px 8px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}>
            {[['C4 (1 Kattai)', 261.63], ['C♯4 (1.5 Kattai)', 277.18], ['D4 (2 Kattai)', 293.66], ['D♯4 (2.5 Kattai)', 311.13], ['E4 (3 Kattai)', 329.63], ['F4 (4 Kattai)', 349.23], ['F♯4 (4.5 Kattai)', 369.99], ['G4 (5 Kattai)', 392.00], ['G♯4 (5.5 Kattai)', 415.30], ['A4 (6 Kattai)', 440.00]].map(([label, value]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 14 }}>
        <StatCard label="GAMAKA" value="Ullāsa Jāru" detail="Ascending glide" />
        <StatCard label="RĀGA" value="Māyāmāḷavagauḷa" detail="Melakarta 15" />
        <StatCard label="DURATION" value="1.2 sec" detail="Sa → Pa" />
        <StatCard label="LIVE PITCH" value={currentPitch === null ? '—' : `${Math.round(currentPitch)}¢`} detail={isListening ? 'Listening to your voice' : 'Waiting for voice'} />
      </section>

      <section style={{ border: '1px solid var(--border)', borderRadius: 16, padding: 16, background: 'var(--surface)', boxShadow: '0 10px 28px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: 18 }}>{exercise.title}</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>Target curve and your live voice trace</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}><i style={{ width: 18, height: 4, borderRadius: 4, background: 'var(--accent)', display: 'inline-block' }} /> Target</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}><i style={{ width: 18, height: 4, borderRadius: 4, background: '#e08b38', display: 'inline-block' }} /> Your voice</span>
          </div>
        </div>

        {chart && <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Target and live voice pitch curves" style={{ width: '100%', display: 'block', marginTop: 12 }}>
          <defs>
            <linearGradient id="gamakaTargetGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.01" />
            </linearGradient>
          </defs>
          {[0, 200, 400, 600, 700].map(cents => <g key={cents}>
            <line x1={PAD.left} x2={W - PAD.right} y1={chart.y(cents)} y2={chart.y(cents)} stroke="var(--border)" strokeDasharray="4 6" />
            <text x={PAD.left - 10} y={chart.y(cents) + 4} textAnchor="end" fontSize="11" fill="var(--text-muted)">{cents}¢</text>
          </g>)}
          {[0, 300, 600, 900, 1200].map(time => <g key={time}>
            <line x1={chart.x(time)} x2={chart.x(time)} y1={PAD.top} y2={H - PAD.bottom} stroke="var(--border)" strokeDasharray="3 7" />
            <text x={chart.x(time)} y={H - 19} textAnchor="middle" fontSize="11" fill="var(--text-muted)">{time}</text>
          </g>)}
          <path d={`${chart.targetPath} L ${chart.x(duration)} ${H - PAD.bottom} L ${chart.x(0)} ${H - PAD.bottom} Z`} fill="url(#gamakaTargetGlow)" />
          <path d={chart.targetPath} fill="none" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          {points.map(p => <circle key={p.t_ms} cx={chart.x(p.t_ms)} cy={chart.y(p.cents)} r="4" fill="var(--surface)" stroke="var(--accent)" strokeWidth="2" />)}
          {livePoints.length > 1 && <path d={chart.livePath} fill="none" stroke="#e08b38" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />}
          {isListening && <line x1={chart.x(elapsedMs)} x2={chart.x(elapsedMs)} y1={PAD.top} y2={H - PAD.bottom} stroke="var(--text)" strokeOpacity=".35" strokeDasharray="5 5" />}
          {currentPitch !== null && isListening && <circle cx={chart.x(elapsedMs)} cy={chart.y(Math.max(-80, Math.min(780, currentPitch)))} r="7" fill="#e08b38" stroke="var(--surface)" strokeWidth="3">
            <animate attributeName="r" values="6;9;6" dur="1s" repeatCount="indefinite" />
          </circle>}
          <text x={W / 2} y={H - 2} textAnchor="middle" fontSize="11" fill="var(--text-muted)">Time (milliseconds)</text>
        </svg>}

        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
          <span>Practice progress: {Math.round(Math.min(elapsedMs, duration))} / {duration} ms</span>
          <span>Target now: {Math.round(interpolate(points, elapsedMs))} cents above Sa</span>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginTop: 16 }}>
		
<button
  type="button"
  onClick={listenToGamaka}
  style={primaryButton}
>
  ▶ Listen
</button>

          <button type="button" onClick={isListening ? stopListening : startListening} style={primaryButton}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 99, background: isListening ? '#f87171' : 'currentColor', marginRight: 8 }} />
            {isListening ? 'Stop practice' : finished ? 'Practise again' : 'Start singing'}
          </button>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{isListening ? 'Sing a smooth “Aa” glide from Sa to Pa.' : 'Allow microphone access when your browser asks.'}</span>
          {accuracy !== null && finished && <span style={scorePill}>Contour match · {accuracy}%*</span>}
        </div>
        {micError && <div role="alert" style={{ marginTop: 12, padding: 12, borderRadius: 10, border: '1px solid #e59a8a', color: 'var(--text)', background: 'rgba(229,154,138,0.12)' }}>{micError}</div>}
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 14 }}>
        <div style={tipCard}>
          <div style={{ fontSize: 20, marginBottom: 5 }}>🌬️</div>
          <strong>Relaxed breath</strong>
          <p style={smallText}>Begin gently on “Aa”. Keep the jaw relaxed while the pitch rises continuously.</p>
        </div>
        <div style={tipCard}>
          <div style={{ fontSize: 20, marginBottom: 5 }}>〰️</div>
          <strong>One smooth glide</strong>
          <p style={smallText}>Avoid separate steps. Follow the target line as one connected movement.</p>
        </div>
        <div style={tipCard}>
          <div style={{ fontSize: 20, marginBottom: 5 }}>🎯</div>
          <strong>Compare, don’t strain</strong>
          <p style={smallText}>Use the orange trace as a practice aid. The first version measures pitch contour only, not complete musical correctness.</p>
        </div>
      </section>
      <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 12 }}>*Contour match is a rough practice indicator, not a formal assessment. Use headphones only if they do not prevent the microphone from hearing your voice clearly.</p>
    </div>
  )
}

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '13px 14px', background: 'var(--surface)', minWidth: 0 }}>
    <div style={{ fontSize: 10, letterSpacing: 1.1, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 7 }}>{label}</div>
    <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3, overflowWrap: 'anywhere' }}>{value}</div>
    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{detail}</div>
  </div>
}

const primaryButton: CSSProperties = {
  border: '1px solid var(--accent)',
  borderRadius: 10,
  padding: '11px 16px',
  background: 'var(--accent-dim)',
  color: 'var(--accent)',
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow: '0 5px 16px rgba(0,0,0,0.06)',
}
const scorePill: CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 999,
  padding: '7px 10px',
  color: 'var(--accent)',
  fontSize: 12,
  fontWeight: 700,
}
const tipCard: CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: 15,
  background: 'var(--surface)',
}
const smallText: CSSProperties = { color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.55, margin: '6px 0 0' }
