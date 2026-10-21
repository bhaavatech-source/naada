import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MELAKARTAS } from '../../data/ragas'
import { useAppStore } from '../../store/useAppStore'
import { semitonesToHz, synthNote } from '../../audio/engine'
import type { InstrumentId } from '../../types/index'

type Level = 'saadhaka' | 'nipuṇa' | 'praveena'
type Direction = 'ascending' | 'descending'

interface PracticeRecording {
  id: string
  name: string
  date: string
  durationSec: number
  dataUrl: string
  ragaName: string
  level: Level
}

interface Props {
  onBack: () => void
}

const STORAGE_KEY = 'bhava_manodharma_recordings_v1'
const LEVELS: { id: Level; title: string; subtitle: string; description: string }[] = [
  { id: 'saadhaka', title: 'Sādhaka', subtitle: 'Build your foundation', description: 'Recognise the rāga, internalise its scale, and shape short, stable phrases.' },
  { id: 'nipuṇa', title: 'Nipuṇa', subtitle: 'Develop fluency', description: 'Explore phrase variation, pauses, register changes, and deliberate phrase endings.' },
  { id: 'praveena', title: 'Pravīṇa', subtitle: 'Refine improvisation', description: 'Build longer coherent ideas, maintain rāga identity, and review your own musical choices.' },
]

const TIPS: Record<Level, { heading: string; items: string[]; prompt: string }> = {
  saadhaka: {
    heading: 'Start with rāga identity',
    items: [
      'Sing Sa–Pa–Sa slowly with the tanpura or a steady tonic.',
      'Practise the selected rāga’s ārohaṇa and avarohaṇa without rushing.',
      'Repeat a short phrase, then sing it again from memory.',
      'End each attempt clearly on Sa; listen for steadiness and continuity.',
    ],
    prompt: 'Try: begin on Sa, move through two or three scale notes, pause, and return gently to Sa.',
  },
  nipuṇa: {
    heading: 'Shape and connect phrases',
    items: [
      'Create two different phrases using the same small group of svaras.',
      'Use pauses intentionally; avoid making every phrase the same length.',
      'Practise ascending and descending movement separately before connecting them.',
      'Record two attempts and compare clarity, continuity, and rāga character.',
    ],
    prompt: 'Try: sing a short phrase, answer it with a contrasting phrase, then resolve to Sa or Pa.',
  },
  praveena: {
    heading: 'Develop a coherent musical idea',
    items: [
      'Build a longer ālāpana from a clear opening idea toward a gradual expansion.',
      'Vary phrase length and register while preserving the rāga’s identity.',
      'For kalpanā svaras, keep tāḷa structure explicit and verify the eduppu with a teacher or trusted tāḷa reference.',
      'Review your recording for phrase logic, intonation, rhythmic placement, and a convincing resolution.',
    ],
    prompt: 'Try: choose a phrase as your central idea, develop it in three variations, and return to the opening idea.',
  },
}

function loadRecordings(): PracticeRecording[] {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value ? JSON.parse(value) as PracticeRecording[] : []
  } catch {
    return []
  }
}

function persistRecordings(records: PracticeRecording[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
    return true
  } catch (error) {
    console.error('Could not persist Manodharma recordings. Browser storage may be full.', error)
    return false
  }
}

function levelLabel(level: Level): string {
  return LEVELS.find(item => item.id === level)?.title ?? level
}

export function ManodharmaPractice({ onBack }: Props) {
  const { settings } = useAppStore()
  const [level, setLevel] = useState<Level>('saadhaka')
  const [ragaNumber, setRagaNumber] = useState(29)
  const [direction, setDirection] = useState<Direction>('ascending')
  const [tempo, setTempo] = useState(72)
  const [instrument, setInstrument] = useState<InstrumentId>('veena')
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordings, setRecordings] = useState<PracticeRecording[]>(loadRecordings)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [playingRecordingId, setPlayingRecordingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [ragaKind, setRagaKind] = useState<'melakarta' | 'janya'>('melakarta')
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const recordingStartRef = useRef(0)
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const raga = useMemo(
    () => MELAKARTAS.find(item => item.number === ragaNumber) ?? MELAKARTAS[28],
    [ragaNumber],
  )
  const currentLevel = LEVELS.find(item => item.id === level) ?? LEVELS[0]
  const currentTips = TIPS[level]

  const sequence = useMemo(() => {
    const n = raga.notes
    const ascending = [0, n.R, n.G, n.M, 7, n.D, n.N, 12]
    const descending = [12, n.N, n.D, 7, n.M, n.G, n.R, 0]
    return direction === 'ascending' ? ascending : descending
  }, [raga, direction])

  const stopSequence = useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    setIsPlaying(false)
  }, [])

  const playScale = useCallback(() => {
    if (ragaKind === 'janya') {
      setMessage('Select Melakarta to play a scale. Janya playback will be enabled when a validated Janya rāga catalogue is added.')
      return
    }
    stopSequence()
    const beatMs = 60000 / Math.max(30, Math.min(tempo, 180))
    const noteDuration = beatMs * 0.82
    sequence.forEach((semitone, index) => {
      timersRef.current.push(setTimeout(() => {
        synthNote(semitonesToHz(settings.tonicHz, semitone), noteDuration / 1000, instrument, settings.volume)
      }, index * beatMs))
    })
    timersRef.current.push(setTimeout(() => setIsPlaying(false), sequence.length * beatMs + 100))
    setIsPlaying(true)
  }, [instrument, ragaKind, sequence, settings.tonicHz, settings.volume, stopSequence, tempo])

  const startRecording = useCallback(async () => {
    setMessage('')
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setMessage('Audio recording is not supported by this browser. Try a current browser over HTTPS.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
        .find(type => MediaRecorder.isTypeSupported(type))
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = event => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onerror = () => setMessage('The browser reported an audio recording error.')
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        const reader = new FileReader()
        reader.onload = () => {
          const item: PracticeRecording = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: `Manodharma ${new Date().toLocaleTimeString()}`,
            date: new Date().toLocaleString(),
            durationSec: Math.max(1, Math.round((Date.now() - recordingStartRef.current) / 1000)),
            dataUrl: reader.result as string,
            ragaName: raga.name,
            level,
          }
          setRecordings(previous => {
            const next = [item, ...previous]
            if (!persistRecordings(next)) {
              setMessage('Recording was captured, but browser storage is full. Download it before leaving this page.')
            }
            return next
          })
          setMessage(`Saved practice recording for ${raga.name}. Download it if you need a permanent copy.`)
        }
        reader.onerror = () => setMessage('The recording was made, but could not be prepared for saving.')
        reader.readAsDataURL(blob)
        stream.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      recorder.start()
      mediaRecorderRef.current = recorder
      recordingStartRef.current = Date.now()
      setRecordingSeconds(0)
      recordingTimerRef.current = setInterval(() => setRecordingSeconds(seconds => seconds + 1), 1000)
      setIsRecording(true)
    } catch {
      streamRef.current?.getTracks().forEach(track => track.stop())
      streamRef.current = null
      setMessage('Microphone access was denied or unavailable. Allow microphone permission and try again.')
    }
  }, [level, raga.name])

  const stopRecording = useCallback(() => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
    recordingTimerRef.current = null
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
  }, [])

  const stopRecordingPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setPlayingRecordingId(null)
  }, [])

  const playRecording = useCallback((record: PracticeRecording) => {
    stopRecordingPlayback()
    const audio = new Audio(record.dataUrl)
    audioRef.current = audio
    audio.onended = () => {
      audioRef.current = null
      setPlayingRecordingId(null)
    }
    audio.play().then(() => setPlayingRecordingId(record.id)).catch(() => {
      setPlayingRecordingId(null)
      setMessage('Could not play this recording in the current browser.')
    })
  }, [stopRecordingPlayback])

  const downloadRecording = useCallback((record: PracticeRecording) => {
    const anchor = document.createElement('a')
    anchor.href = record.dataUrl
    anchor.download = `${record.name.replace(/[^a-z0-9_-]+/gi, '_')}.${record.dataUrl.startsWith('data:audio/mp4') ? 'm4a' : 'webm'}`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  }, [])

  const deleteRecording = useCallback((id: string) => {
    setRecordings(previous => {
      const next = previous.filter(record => record.id !== id)
      persistRecordings(next)
      return next
    })
    if (playingRecordingId === id) stopRecordingPlayback()
    setMessage('Recording deleted from this browser’s Manodharma library.')
  }, [playingRecordingId, stopRecordingPlayback])

  useEffect(() => () => {
    stopSequence()
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
    streamRef.current?.getTracks().forEach(track => track.stop())
    audioRef.current?.pause()
  }, [stopSequence])

  const panel: React.CSSProperties = {
    background: 'rgba(14, 20, 35, 0.94)',
    border: '1px solid rgba(167, 139, 250, 0.34)',
    borderRadius: 18,
    boxShadow: '0 18px 55px rgba(0,0,0,0.20)',
    backdropFilter: 'blur(12px)',
  }
  const button: React.CSSProperties = {
    borderRadius: 10,
    padding: '9px 13px',
    border: '1px solid rgba(192,132,252,0.42)',
    background: 'rgba(192,132,252,0.10)',
    color: '#f8fafc',
    cursor: 'pointer',
    fontWeight: 700,
  }

  return (
    <section className="manodharma-practice" style={{
      minHeight: '100%',
      padding: 'clamp(14px, 3vw, 28px)',
      color: '#f8fafc',
      background: 'radial-gradient(ellipse at 10% 0%, rgba(124,58,237,0.24), transparent 42%), radial-gradient(ellipse at 92% 20%, rgba(14,165,233,0.18), transparent 38%), linear-gradient(145deg, #090d18, #111827 58%, #0b1020)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes mdh-wave { 0%,100% { transform: translateX(-2%) scaleX(.94); opacity:.18 } 50% { transform: translateX(2%) scaleX(1.04); opacity:.34 } }
        .mdh-wave { position:absolute; pointer-events:none; inset:auto -10% 10% -10%; height:120px; border-top:1px solid rgba(192,132,252,.26); border-radius:50%; animation:mdh-wave 12s ease-in-out infinite; }
        .mdh-wave.two { bottom:5%; animation-delay:-5s; height:155px; }
        .mdh-card { transition: border-color .2s ease, transform .2s ease, background .2s ease; }
        .mdh-card:hover { border-color: rgba(192,132,252,.55) !important; transform: translateY(-1px); }
        @media (prefers-reduced-motion: reduce) { .mdh-wave { animation:none } .mdh-card { transition:none } }
      `}</style>
      <div className="mdh-wave" />
      <div className="mdh-wave two" />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1240, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <header style={{ ...panel, padding: 'clamp(18px, 3vw, 28px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ color: '#c4b5fd', fontSize: 12, letterSpacing: '.18em', textTransform: 'uppercase', fontWeight: 800 }}>Bhāva Music Studio</div>
            <h2 style={{ margin: '7px 0', color: '#ffffff', fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', lineHeight: 1.15, textShadow: '0 2px 18px rgba(167,139,250,.18)' }}>Manodharma Practice</h2>
            <p style={{ margin: 0, color: '#e2e8f0', maxWidth: 700, lineHeight: 1.7 }}>Learn the rāga, develop a musical idea, improvise with intention, and keep a personal practice journal.</p>
          </div>
          <button onClick={onBack} style={{ ...button, background: 'linear-gradient(135deg, #7c3aed, #0369a1)', border: '1px solid #c4b5fd', color: '#ffffff', boxShadow: '0 6px 22px rgba(124,58,237,.22)' }}>← Back to Music Builder</button>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: 12 }}>
          {LEVELS.map(item => {
            const active = level === item.id
            return <button key={item.id} className="mdh-card" onClick={() => setLevel(item.id)} style={{
              ...panel, textAlign: 'left', padding: 18, cursor: 'pointer',
              border: active ? '1px solid #c4b5fd' : '1px solid rgba(192,132,252,0.22)',
              background: active ? 'linear-gradient(135deg, rgba(124,58,237,.28), rgba(14,165,233,.10))' : 'rgba(14,20,35,.78)',
            }}>
              <div style={{ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: active ? '#ede9fe' : '#cbd5e1', fontWeight: 800 }}>{item.subtitle}</div>
              <div style={{ fontSize: 21, fontWeight: 800, margin: '7px 0', color: active ? '#ffffff' : '#f1f5f9' }}>{item.title}</div>
              <div style={{ fontSize: 13, lineHeight: 1.65, color: '#e2e8f0' }}>{item.description}</div>
            </button>
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 16 }}>
          <div style={{ ...panel, padding: 20 }}>
            <h3 style={{ marginTop: 0, marginBottom: 14, color: '#ffffff', fontSize: 20 }}>Rāga practice</h3>
            <label style={{ display: 'block', fontSize: 12, color: '#e2e8f0', marginBottom: 6 }}>Rāga family</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              <button style={{ ...button, borderColor: ragaKind === 'melakarta' ? '#c4b5fd' : 'rgba(255,255,255,.12)' }} onClick={() => setRagaKind('melakarta')}>Melakarta</button>
              <button style={{ ...button, opacity: .6 }} onClick={() => { setRagaKind('janya'); setMessage('The supplied ragas.ts contains the 72 Melakarta rāgas only; no validated Janya rāga catalogue is present yet. Janya playback is intentionally not guessed.'); }}>Janya rāgas</button>
            </div>
            <label style={{ display: 'block', fontSize: 12, color: '#e2e8f0', marginBottom: 6 }}>Melakarta (72 rāgas)</label>
            <select value={ragaNumber} onChange={event => { setRagaNumber(Number(event.target.value)); setRagaKind('melakarta'); setMessage(''); }} style={{ width: '100%', padding: 11, borderRadius: 10, color: '#f8fafc', background: '#111827', border: '1px solid rgba(192,132,252,.35)' }}>
              {MELAKARTAS.map(item => <option key={item.number} value={item.number}>{item.number}. {item.name}</option>)}
            </select>
            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#e2e8f0', marginBottom: 6 }}>Scale direction</label>
                <select value={direction} onChange={event => setDirection(event.target.value as Direction)} style={{ width: '100%', padding: 10, borderRadius: 9, color: '#f8fafc', background: '#111827', border: '1px solid rgba(192,132,252,.35)' }}>
                  <option value="ascending">Ārohaṇa</option><option value="descending">Avarohaṇa</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#e2e8f0', marginBottom: 6 }}>Tempo: {tempo} BPM</label>
                <input type="range" min="40" max="140" step="2" value={tempo} onChange={event => setTempo(Number(event.target.value))} style={{ width: '100%', accentColor: '#c4b5fd', marginTop: 10 }} />
              </div>
            </div>
            <label style={{ display: 'block', fontSize: 12, color: '#e2e8f0', margin: '12px 0 6px' }}>Instrument timbre</label>
            <select value={instrument} onChange={event => setInstrument(event.target.value as InstrumentId)} style={{ width: '100%', padding: 10, borderRadius: 9, color: '#f8fafc', background: '#111827', border: '1px solid rgba(192,132,252,.35)' }}>
              <option value="veena">Veena</option><option value="flute">Flute</option><option value="harmonium">Harmonium</option>
            </select>
            <div style={{ margin: '16px 0', padding: 12, borderRadius: 10, background: 'rgba(255,255,255,.04)', lineHeight: 1.9, fontFamily: 'monospace', wordBreak: 'break-word' }}>
              {direction === 'ascending' ? raga.ascending.join(' · ') : raga.descending.join(' · ')}
            </div>
            <button disabled={ragaKind === 'janya'} onClick={isPlaying ? stopSequence : playScale} style={{ ...button, width: '100%', padding: 12, opacity: ragaKind === 'janya' ? 0.45 : 1, cursor: ragaKind === 'janya' ? 'not-allowed' : 'pointer', background: isPlaying ? 'rgba(248,113,113,.14)' : 'linear-gradient(90deg, rgba(124,58,237,.38), rgba(14,165,233,.24))' }}>
              {ragaKind === 'janya' ? 'Janya scale data required' : isPlaying ? '■ Stop scale' : `▶ Play ${direction === 'ascending' ? 'Ārohaṇa' : 'Avarohaṇa'}`}
            </button>
            {ragaKind === 'janya' && <p style={{ color: '#fbbf24', fontSize: 12, lineHeight: 1.5 }}>Janya rāga playback is waiting for a verified catalogue with each rāga’s actual scale and any vakra/omitted svaras.</p>}
          </div>

          <div style={{ ...panel, padding: 20 }}>
            <h3 style={{ marginTop: 0, color: '#ffffff', fontSize: 20 }}>{currentTips.heading}</h3>
            <div style={{ fontSize: 12, color: '#c4b5fd', fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase' }}>{currentLevel.title} learning path</div>
            <ol style={{ paddingLeft: 21, margin: '14px 0', display: 'flex', flexDirection: 'column', gap: 12, lineHeight: 1.6, color: '#e2e8f0' }}>
              {currentTips.items.map(item => <li key={item}>{item}</li>)}
            </ol>
            <div style={{ borderLeft: '3px solid #a78bfa', padding: '10px 12px', background: 'rgba(167,139,250,.10)', borderRadius: '0 10px 10px 0', lineHeight: 1.6 }}>
              <strong style={{ color: '#ddd6fe' }}>Practice prompt</strong><br />{currentTips.prompt}
            </div>
            <p style={{ color: '#cbd5e1', fontSize: 12, lineHeight: 1.5, marginBottom: 0 }}>These are practice prompts, not a substitute for rāga-specific guidance from a qualified Carnatic music teacher. Gamaka and phrase grammar are not fully represented by equal-tempered scale playback.</p>
          </div>
        </div>

        <div style={{ ...panel, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, color: '#ffffff', fontSize: 20 }}>Practice recording</h3>
              <p style={{ margin: '6px 0 0', color: '#e2e8f0', fontSize: 13 }}>Record your voice or instrument with microphone permission enabled.</p>
            </div>
            <button onClick={isRecording ? stopRecording : startRecording} style={{ ...button, borderColor: isRecording ? '#fb7185' : '#c4b5fd', color: isRecording ? '#fecdd3' : '#f8fafc', background: isRecording ? 'rgba(244,63,94,.16)' : 'rgba(192,132,252,.13)' }}>
              {isRecording ? `⏹ Stop recording · ${recordingSeconds}s` : '⏺ Record practice'}
            </button>
          </div>
          {message && <div role="status" style={{ marginTop: 12, padding: 10, borderRadius: 8, background: 'rgba(255,255,255,.06)', color: '#e2e8f0', fontSize: 13 }}>{message}</div>}
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 9 }}>
            {recordings.length === 0 && <div style={{ color: '#cbd5e1', fontSize: 13, padding: '12px 0' }}>No Manodharma recordings yet. Your saved recordings will appear here.</div>}
            {recordings.map(record => (
              <div key={record.id} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', borderRadius: 10, padding: 12, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)' }}>
                <div style={{ flex: 1, minWidth: 170 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{record.name}</div>
                  <div style={{ color: '#cbd5e1', fontSize: 11, marginTop: 4 }}>{record.ragaName} · {levelLabel(record.level)} · {record.durationSec}s</div>
                  <div style={{ color: '#94a3b8', fontSize: 11, marginTop: 2 }}>{record.date}</div>
                </div>
                <button onClick={() => playingRecordingId === record.id ? stopRecordingPlayback() : playRecording(record)} style={button}>{playingRecordingId === record.id ? '■ Stop' : '▶ Play'}</button>
                <button onClick={() => downloadRecording(record)} style={button}>↓ Download</button>
                <button onClick={() => deleteRecording(record.id)} style={{ ...button, borderColor: 'rgba(248,113,113,.55)', color: '#fda4af' }}>Delete</button>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>Recordings are stored in this browser’s local storage. Download important recordings; clearing site data or browser storage limits can remove them.</div>
        </div>
      </div>
    </section>
  )
}
