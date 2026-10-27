import { useState, useRef, useCallback, useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { tanpura, getAudioContext } from '../../audio/engine'
import { setPendingVocalImport } from '../../store/pendingVocalImport'
import './shruti.css'

// ─── Types ───────────────────────────────────────────────────────────────────
const PRINCIPAL_SWARAS = [
  { name:'Sa', semi:0 }, { name:'Re', semi:2 }, { name:'Ga', semi:4 },
  { name:'Ma', semi:5 }, { name:'Pa', semi:7 }, { name:'Da', semi:9 }, { name:'Ni', semi:11 },
]
interface PitchState { note: string; cents: number; direction: 'sharp'|'flat'|'correct'; hz: number }

interface SavedRecording {
  id: string
  name: string
  date: string
  durationSec: number
  dataUrl: string   // base64 audio/webm
}

// ─── Autocorrelate ────────────────────────────────────────────────────────────
function autocorrelate(buf: Float32Array, sampleRate: number, noiseFloor = 0.012): number {
  const n = buf.length
  let rms = 0
  for (let i = 0; i < n; i++) rms += buf[i] * buf[i]
  rms = Math.sqrt(rms / n)
  if (rms < noiseFloor) return -1

  let r1 = 0, r2 = n - 1
  const threshold = 0.2
  for (let i = 0; i < n / 2; i++) { if (Math.abs(buf[i]) < threshold) { r1 = i; break } }
  for (let i = 1; i < n / 2; i++) { if (Math.abs(buf[n - i]) < threshold) { r2 = n - i; break } }

  const c = buf.slice(r1, r2)
  const len = c.length
  const corr = new Float32Array(len / 2)
  for (let lag = 0; lag < len / 2; lag++) {
    let acc = 0
    for (let i = 0; i < len - lag; i++) acc += c[i] * c[i + lag]
    corr[lag] = acc
  }
  let d = 0
  while (d < corr.length - 1 && corr[d] > corr[d + 1]) d++
  let maxVal = -Infinity, maxLag = d
  for (let i = d; i < corr.length; i++) if (corr[i] > maxVal) { maxVal = corr[i]; maxLag = i }
  if (maxVal < 0.01) return -1

  const x1 = corr[maxLag - 1] ?? 0, x2 = corr[maxLag], x3 = corr[maxLag + 1] ?? 0
  const denom = x1 - 2 * x2 + x3
  const adj = denom !== 0 ? (x1 - x3) / (2 * denom) : 0
  return sampleRate / (maxLag + adj)
}

function hzToNote(hz: number, tonicHz: number): PitchState | null {
  if (hz <= 0) return null
  const centsFromTonic = 1200 * Math.log2(hz / tonicHz)
  const semitones = centsFromTonic / 100
  const octaveOffset = Math.round(semitones / 12) * 12
  const normalSemi = ((semitones - octaveOffset) % 12 + 12) % 12

  let closest = PRINCIPAL_SWARAS[0]
  let minDist = Infinity
  for (const s of PRINCIPAL_SWARAS) {
    const d = Math.abs(normalSemi - s.semi)
    if (d < minDist) { minDist = d; closest = s }
  }
  const centsOff = (normalSemi - closest.semi) * 100
  const direction = Math.abs(centsOff) < 15 ? 'correct' : centsOff > 0 ? 'sharp' : 'flat'
  return { note: closest.name, cents: Math.round(centsOff), direction, hz: Math.round(hz) }
}

// ─── localStorage helpers ─────────────────────────────────────────────────────
const LS_KEY = 'shruti_recordings'

function loadRecordings(): SavedRecording[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveRecordings(recs: SavedRecording[]): boolean {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(recs))
    return true
  } catch (err) {
    console.error('Could not save Śruti recordings:', err)
    return false
  }
}


// ─── Component ────────────────────────────────────────────────────────────────
export default function ShrutiTrainer() {
  const { settings } = useAppStore()
  const [active, setActive]             = useState(false)
  const [droneOn, setDroneOn]           = useState(false)
  const [pitch, setPitch]               = useState<PitchState | null>(null)
  const [, setGoodFrames]     = useState(0)
  const [, setTotalFrames]   = useState(0)
  const [streak, setStreak]             = useState(0)
  const [bestStreak, setBestStreak]     = useState(0)
  const [sessionAcc, setSessionAcc]     = useState<number | null>(null)
  const [error, setError]               = useState('')
  const [gainThreshold, setGainThreshold] = useState(0.012)
  const [practiceLevel, setPracticeLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner')
  const toleranceCents = practiceLevel === 'beginner' ? 40 : practiceLevel === 'intermediate' ? 20 : 10
  const [targetSwara, setTargetSwara]   = useState<string | null>(null)
  const [, setCentsHistory] = useState<number[]>([])

  // ── Recording state ──────────────────────────────────────────────────────
  const [isRecording, setIsRecording]   = useState(false)
  const [recDuration, setRecDuration]   = useState(0)
  const [recordings, setRecordings]     = useState<SavedRecording[]>(loadRecordings)
  const [playingId, setPlayingId]       = useState<string | null>(null)

  const streamRef    = useRef<MediaStream | null>(null)
  const animRef      = useRef<number | null>(null)
  const analyserRef  = useRef<AnalyserNode | null>(null)
  const goodRef      = useRef(0)
  const totalRef     = useRef(0)
  const streakRef    = useRef(0)
  const lastScoredAtRef = useRef(0)
  const toleranceRef = useRef(40)
  toleranceRef.current = toleranceCents
  const pitchRunningRef = useRef(false)

  // Recording refs
  const mediaRecRef  = useRef<MediaRecorder | null>(null)
  const chunksRef    = useRef<Blob[]>([])
  const recTimerRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const recStartRef  = useRef<number>(0)
  const audioElemRef = useRef<HTMLAudioElement | null>(null)

  // ── Pitch session ────────────────────────────────────────────────────────
  const startSession = useCallback(async () => {
    if (pitchRunningRef.current) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const ctx = getAudioContext()
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 2048
      source.connect(analyser)
      analyserRef.current = analyser

      goodRef.current = 0
      totalRef.current = 0
      streakRef.current = 0
      lastScoredAtRef.current = 0

      setGoodFrames(0)
      setTotalFrames(0)
      setStreak(0)
      setSessionAcc(null)

      const buf = new Float32Array(analyser.fftSize)
      pitchRunningRef.current = true
      let lastAnalysedAt = -Infinity

      const tick = () => {
        if (!pitchRunningRef.current) return
        const now = performance.now()
        // Ten updates per second keep the tuner responsive without blocking taps.
        if (now - lastAnalysedAt < 100) {
          animRef.current = requestAnimationFrame(tick)
          return
        }
        lastAnalysedAt = now

        analyser.getFloatTimeDomainData(buf)
        const hz = autocorrelate(buf, ctx.sampleRate, gainThreshold)
        const ps = hz > 60 ? hzToNote(hz, settings.tonicHz) : null

        setPitch(ps)

        if (ps) {
          const now = performance.now()

          if (now - lastScoredAtRef.current >= 100) {
            lastScoredAtRef.current = now
            const isGood = Math.abs(ps.cents) <= toleranceRef.current
            totalRef.current++

            if (isGood) {
              goodRef.current++
              streakRef.current++
              if (streakRef.current > bestStreak) {
                setBestStreak(streakRef.current)
              }
            } else {
              streakRef.current = 0
            }

            setGoodFrames(goodRef.current)
            setTotalFrames(totalRef.current)
            setStreak(streakRef.current)
            setCentsHistory(prev => [...prev.slice(-60), ps.cents])
          }
        }

        if (pitchRunningRef.current) {
          animRef.current = requestAnimationFrame(tick)
        }
      }

      setActive(true)
      setError('')
      animRef.current = requestAnimationFrame(tick)
    } catch {
      pitchRunningRef.current = false
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
      setError('Microphone access denied. Please allow microphone permission and try again.')
    }
  }, [settings.tonicHz, bestStreak, gainThreshold])

  const stopSession = useCallback(() => {
    pitchRunningRef.current = false

    if (animRef.current !== null) {
      cancelAnimationFrame(animRef.current)
      animRef.current = null
    }

    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null

    analyserRef.current?.disconnect()
    analyserRef.current = null

    setActive(false)
    setPitch(null)

    if (totalRef.current > 0) {
      setSessionAcc(Math.round((goodRef.current / totalRef.current) * 100))
    }

    setCentsHistory([])
  }, [])

  // ── Drone ────────────────────────────────────────────────────────────────
  const toggleDrone = useCallback(() => {
    if (droneOn) { tanpura.stop(); setDroneOn(false) }
    else { tanpura.start(settings.tonicHz, settings.volume); setDroneOn(true) }
  }, [droneOn, settings.tonicHz, settings.volume])

  useEffect(() => {
    if (droneOn) { tanpura.stop(); tanpura.start(settings.tonicHz, settings.volume) }
  }, [settings.tonicHz, settings.volume, droneOn])

  useEffect(() => {
    return () => {
      tanpura.stop()
      stopSession()
      if (audioElemRef.current) {
        audioElemRef.current.pause()
        audioElemRef.current = null
      }
    }
  }, [stopSession])

  // ── Recording ─────────────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' })
        const reader = new FileReader()
        reader.onload = () => {
          const durationSec = Math.round((Date.now() - recStartRef.current) / 1000)
          const rec: SavedRecording = {
            id: Date.now().toString(),
            name: `Recording ${new Date().toLocaleTimeString()}`,
            date: new Date().toLocaleString(),
            durationSec,
            dataUrl: reader.result as string,
          }
          
setRecordings(prev => {
  const next = [rec, ...prev]
  saveRecordings(next)
  return next
})

        }
        reader.readAsDataURL(blob)
        stream.getTracks().forEach(t => t.stop())
      }
      mr.start()
      mediaRecRef.current = mr
      recStartRef.current = Date.now()
      setRecDuration(0)
      recTimerRef.current = setInterval(() => setRecDuration(d => d + 1), 1000)
      setIsRecording(true)
    } catch {
      setError('Microphone access denied for recording.')
    }
  }, [])

  const stopRecording = useCallback(() => {
    mediaRecRef.current?.stop()
    if (recTimerRef.current) clearInterval(recTimerRef.current)
    setIsRecording(false)
  }, [])

  const playRecording = useCallback((rec: SavedRecording) => {
    if (audioElemRef.current) {
      audioElemRef.current.pause()
      audioElemRef.current = null
    }
    const audio = new Audio(rec.dataUrl)
    audioElemRef.current = audio
    audio.play().then(() => {
      setPlayingId(rec.id)
    }).catch(() => {
      setPlayingId(null)
      setError('Could not play this recording in the current browser.')
    })
    audio.onended = () => {
      setPlayingId(null)
      audioElemRef.current = null
    }
  }, [])

  const stopPlayback = useCallback(() => {
    if (audioElemRef.current) {
      audioElemRef.current.pause()
      audioElemRef.current = null
    }
    setPlayingId(null)
  }, [])

  const downloadRecording = useCallback((rec: SavedRecording) => {
    const a = document.createElement('a')
    a.href = rec.dataUrl
    a.download = `${rec.name.replace(/\s+/g, '_')}.webm`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }, [])

  const deleteRecording = useCallback((id: string) => {
    setRecordings(prev => {
      const next = prev.filter(r => r.id !== id)
      saveRecordings(next)
      return next
    })
    if (playingId === id) stopPlayback()
  }, [playingId, stopPlayback])

  // ── Share to Music Builder ─────────────────────────────────────────────────
  
const shareToMusicBuilder = useCallback((rec: SavedRecording) => {
  setPendingVocalImport({
    type: 'shruti-recording',
    name: rec.name,
    date: rec.date,
    dataUrl: rec.dataUrl,
  })

  useAppStore.getState().setModule('builder')
}, [])


  // ── Derived ───────────────────────────────────────────────────────────────
  const accuracy = totalRef.current > 0 ? Math.round((goodRef.current / totalRef.current) * 100) : null

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="shruti-trainer" style={{ height: '100%', overflowY: 'auto', padding: 'var(--space-6)' }}>
      <div style={{ width: '100%', maxWidth: '840px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', paddingBottom: 'var(--space-12)' }}>

      {/* ── Pitch Display (Stable Background, No Blinking) ── */}
      <div className="shruti-pitch-panel" style={{ borderRadius: 'var(--radius)', background: 'var(--surface)', border: '1px solid var(--border)', padding: 'var(--space-6)', textAlign: 'center', minHeight: 140, boxShadow: 'var(--shadow)' }}>
          <div className="shruti-pitch-reading" style={{visibility:pitch ? 'visible' : 'hidden'}} aria-hidden={!pitch}>
            <div style={{ fontSize: '3.2rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: pitch?.direction === 'correct' ? 'var(--green)' : pitch?.direction === 'sharp' ? 'var(--red)' : 'var(--orange)' }}>{pitch?.note ?? 'Sa'}</div>
            
            {/* Stable Status Badge instead of flashing screen background */}
            <div className="shruti-pitch-status" style={{ display: 'inline-block', padding: '2px 12px', borderRadius: 99, fontSize: '0.8rem', fontWeight: 600, background: pitch?.direction === 'correct' ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)', color: pitch?.direction === 'correct' ? 'var(--green)' : 'var(--red)', margin: '4px 0 8px' }}>
              {pitch?.direction === 'correct' ? '✓ In Tune' : pitch?.direction === 'sharp' ? `↑ Sharp by ${pitch.cents}¢` : `↓ Flat by ${Math.abs(pitch?.cents ?? 0)}¢`}
            </div>

            
            {/* Cents meter */}
            <div style={{ width: '100%', maxWidth: '400px', height: 8, background: 'var(--surface2)', borderRadius: 4, marginTop: 12, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, height: '100%', width: `${Math.min(Math.abs(pitch?.cents ?? 0) / 50, 1) * 50}%`, left: (pitch?.cents ?? 0) >= 0 ? '50%' : 'auto', right: (pitch?.cents ?? 0) < 0 ? '50%' : 'auto', background: pitch?.direction === 'correct' ? 'var(--green)' : pitch?.direction === 'sharp' ? 'var(--red)' : 'var(--orange)', transition: 'width 0.1s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '400px', fontSize: '0.65rem', color: 'var(--text-faint)', marginTop: 4 }}>
              <span>-50¢ (flat)</span><span>0¢</span><span>+50¢ (sharp)</span>
            </div>
          </div>
          <div className="shruti-pitch-placeholder" style={{ visibility:pitch ? 'hidden' : 'visible', color: 'var(--text-muted)', fontSize: '1.05rem', fontWeight: 500 }} aria-hidden={!!pitch}>
            {active ? 'Sing into your microphone…' : 'Press Start Session to begin analyzing pitch'}
          </div>
      </div>

      {/* ── Session Controls ── */}
      <div className="shruti-session-controls" role="group" aria-label="Session and recording controls">
        <button aria-label={active ? 'Stop pitch detection session' : 'Start pitch detection session'} onClick={() => active ? stopSession() : startSession()}
          style={{ borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: '0.95rem', background: active ? 'rgba(248,113,113,0.15)' : 'var(--accent-dim)', border: `2px solid ${active ? 'var(--red)' : 'var(--accent)'}`, color: active ? 'var(--red)' : 'var(--accent)', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
          {active ? '⏹ Stop Session' : '▶ Start Session'}
        </button>

        <button onClick={toggleDrone}
          style={{ borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '0.9rem', background: droneOn ? 'rgba(99,102,241,0.15)' : 'var(--surface)', border: `1px solid ${droneOn ? 'var(--accent)' : 'var(--border)'}`, color: droneOn ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer' }}>
          {droneOn ? '🔔 Tanpura On' : '🔕 Tanpura Off'}
        </button>

        {/* 🔴 Record button */}
        <button
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          onClick={() => isRecording ? stopRecording() : startRecording()}
          style={{ borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: '0.9rem', background: isRecording ? 'rgba(248,113,113,0.2)' : 'var(--surface)', border: `1px solid ${isRecording ? 'var(--red)' : 'var(--border)'}`, color: isRecording ? 'var(--red)' : 'var(--text-muted)', cursor: 'pointer' }}>
          <span>{isRecording ? '⏹ Stop Rec' : '⏺ Record'}</span>
          <span className="shruti-recording-time" style={{visibility:isRecording ? 'visible' : 'hidden'}} aria-hidden={!isRecording}>{recDuration}s</span>
        </button>
      </div>

      {error && <div style={{ color: 'var(--red)', fontSize: '0.85rem', textAlign: 'center' }}>{error}</div>}

      {/* ── Stats ── */}
      {(active || sessionAcc !== null) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 'var(--space-3)' }}>
          {[
            { label: 'Accuracy', value: accuracy !== null ? `${accuracy}%` : '—', color: 'var(--green)' },
            { label: 'Frames', value: totalRef.current, color: 'var(--text)' },
            { label: 'Streak', value: streak, color: 'var(--teal)' },
            { label: 'Best Streak', value: bestStreak, color: 'var(--accent)' },
          ].map(stat => (
            <div key={stat.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 'var(--space-3)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Practice level ── */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 'var(--space-4)' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>Practice level</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {([
            { value: 'beginner', label: 'Beginner · ±40¢' },
            { value: 'intermediate', label: 'Intermediate · ±20¢' },
            { value: 'advanced', label: 'Advanced · ±10¢' },
          ] as const).map(level => (
            <button key={level.value} onClick={() => setPracticeLevel(level.value)}
              style={{ padding: '6px 14px', borderRadius: 99, fontSize: '0.78rem', cursor: 'pointer', border: '1px solid', borderColor: practiceLevel === level.value ? 'var(--accent)' : 'var(--border)', background: practiceLevel === level.value ? 'var(--accent-dim)' : 'transparent', color: practiceLevel === level.value ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 500 }}>
              {level.label}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 8, fontSize: '0.7rem', color: 'var(--text-faint)' }}>
          Accuracy tolerance changes with the selected level. Use this as practice feedback, not a formal assessment.
        </div>
      </div>

      {/* ── Svara target picker ── */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 'var(--space-4)' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 'var(--space-2)', fontWeight: 600 }}>Practice a specific Svara</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {PRINCIPAL_SWARAS.map(s => (
            <button key={s.name} onClick={() => setTargetSwara(targetSwara === s.name ? null : s.name)}
              style={{ padding: '6px 14px', borderRadius: 99, fontSize: '0.8rem', cursor: 'pointer', border: '1px solid', background: targetSwara === s.name ? 'var(--accent)' : 'transparent', borderColor: targetSwara === s.name ? 'var(--accent)' : 'var(--border)', color: targetSwara === s.name ? '#000' : 'var(--text-muted)', fontWeight: 500 }}>
              {s.name}
            </button>
          ))}
        </div>
        {targetSwara && (
          <div className="shruti-target-feedback" style={{ marginTop: 10, fontSize: '0.85rem', color: pitch?.note === targetSwara && pitch?.direction === 'correct' ? 'var(--green)' : 'var(--orange)', fontWeight: 600 }}>
            {!pitch ? `Sing ${targetSwara} into your microphone…` : pitch.note === targetSwara && pitch.direction === 'correct' ? '✅ Singing target Svara correctly!' : `Singing: ${pitch.note} (Target: ${targetSwara})`}
          </div>
        )}
      </div>

      {/* ── Threshold ── */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 'var(--space-4)' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>
          Microphone noise threshold: {(gainThreshold * 100).toFixed(1)}%
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)', marginBottom: 10 }}>
          This threshold is applied to the incoming audio level. Raise it to ignore room noise; lower it if a quiet voice is not detected.
        </div>
        <input type="range" min="0.005" max="0.05" step="0.001" value={gainThreshold}
          onChange={e => setGainThreshold(parseFloat(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--accent)' }} />
      </div>

      {/* ── Session result ── */}
      {sessionAcc !== null && !active && (
        <div style={{ background: sessionAcc >= 80 ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)', border: `1px solid ${sessionAcc >= 80 ? 'var(--green)' : 'var(--red)'}`, borderRadius: 'var(--radius)', padding: 'var(--space-4)' }}>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: sessionAcc >= 80 ? 'var(--green)' : 'var(--red)' }}>
            {sessionAcc >= 80 ? '🌟' : '💪'} Session Accuracy: {sessionAcc}%
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 6 }}>
            {sessionAcc >= 90 ? 'Excellent! Your shruti is precise.' : sessionAcc >= 75 ? 'Good work. Keep practicing for more consistency.' : 'Keep at it — consistent daily practice builds shruti.'}
          </div>
        </div>
      )}

      {/* ── Recordings Library ── */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 'var(--space-4)', boxShadow: 'var(--shadow)' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)', marginBottom: 'var(--space-3)' }}>
          🎙 My Recordings ({recordings.length})
        </div>

        {recordings.length === 0 && (
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '12px 0' }}>
            No recordings saved yet. Click "Record" above while practicing to save audio clips here.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {recordings.map(rec => (
            <div key={rec.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', flexWrap: 'wrap', border: '1px solid var(--border)' }}>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>{rec.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>{rec.date} · {rec.durationSec}s</div>
              </div>

              {/* Play / Stop */}
              <button
                onClick={() => playingId === rec.id ? stopPlayback() : playRecording(rec)}
                title={playingId === rec.id ? 'Stop' : 'Play'}
                style={{ padding: '6px 14px', borderRadius: 99, fontSize: '0.78rem', cursor: 'pointer', border: '1px solid var(--accent)', background: playingId === rec.id ? 'var(--accent-dim)' : 'transparent', color: 'var(--accent)', fontWeight: 600 }}>
                {playingId === rec.id ? '⏹ Stop' : '▶ Play'}
              </button>

              {/* Download */}
              <button
                onClick={() => downloadRecording(rec)}
                title="Download"
                style={{ padding: '6px 14px', borderRadius: 99, fontSize: '0.78rem', cursor: 'pointer', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 500 }}>
                ⬇ Download
              </button>

              {/* Share to Music Builder */}
              <button
                onClick={() => shareToMusicBuilder(rec)}
                title="Send to Gāna Builder to add instruments"
                style={{ padding: '6px 14px', borderRadius: 99, fontSize: '0.78rem', cursor: 'pointer', border: '1px solid var(--teal, #2dd4bf)', background: 'rgba(45,212,191,0.08)', color: 'var(--teal, #2dd4bf)', fontWeight: 600 }}>
                🎵 Add Instruments
              </button>

              {/* Delete */}
              <button
                onClick={() => deleteRecording(rec.id)}
                title="Delete"
                style={{ padding: '6px 12px', borderRadius: 99, fontSize: '0.78rem', cursor: 'pointer', border: '1px solid var(--red)', background: 'transparent', color: 'var(--red)', fontWeight: 500 }}>
                🗑 Delete
              </button>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  )
}