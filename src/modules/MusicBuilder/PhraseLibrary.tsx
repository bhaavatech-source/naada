import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { semitonesToHz, synthNote } from '../../audio/engine'
import type { InstrumentId } from '../../types/index'

type FeedbackKind = 'pleasant' | 'improve' | 'raga-character'
interface Phrase {
  id: string
  level?: string
  tempoBpm?: number
  targetDurationSeconds?: number
  swaras: string[]
  semitones: number[]
  validation?: { status?: string; notes?: string[]; scaleMembership?: string; contour?: string }
}
interface SingleFile {
  schemaVersion: number
  raga: { number: number; name: string; family?: string }
  candidateCount: number
  phrases: Phrase[]
}
interface PhraseEvent { semitone: number; durationBeats: number; section?: string }
interface TransitionCandidate extends Phrase {
  type?: string
  sourceRagas?: { number: number; name: string }[]
  events?: PhraseEvent[]
}
interface TransitionFile {
  schemaVersion: number
  type: string
  pair: { a: { number: number; name: string }; b: { number: number; name: string }; candidateCount: number }
  candidates: TransitionCandidate[]
}
type FeedbackMap = Record<string, FeedbackKind[]>
const FEEDBACK_KEY = 'naadopasana_phrase_feedback_v1'
const singleLoaders = import.meta.glob('../../data/musical-phrases/candidates/*.json') as Record<string, () => Promise<{ default: SingleFile }>>
const transitionLoaders = import.meta.glob('../../data/musical-phrases/transitions/*.json') as Record<string, () => Promise<{ default: TransitionFile }>>
function filenameNumber(path: string): number | null { const m = path.match(/melakarta-(\d+)\.json$/i); return m ? Number(m[1]) : null }
function pairNumbers(path: string): [number, number] | null { const m = path.match(/transition-(\d+)-(\d+)\.json$/i); return m ? [Number(m[1]), Number(m[2])] : null }
function readFeedback(): FeedbackMap { try { return JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '{}') as FeedbackMap } catch { return {} } }
interface Props {
  currentRagaNumber: number
  tempo: number
  instrument: InstrumentId
  onImportPhrase?: (notes: Array<{ label: string; semitone: number; duration: number }>, phraseName: string, destinationTrackId?: string, placement?: 'append' | 'replace') => void
  trackOptions?: Array<{ id: string; name: string }>
  activeTrackId?: string
}
export function PhraseLibrary({ currentRagaNumber, tempo, instrument, onImportPhrase, trackOptions = [], activeTrackId }: Props) {
  const { settings } = useAppStore()
  const [kind, setKind] = useState<'single' | 'transition'>('single')
  const [showAllPairs, setShowAllPairs] = useState(false)
  const [singlePath, setSinglePath] = useState('')
  const [transitionPath, setTransitionPath] = useState('')
  const [singleData, setSingleData] = useState<SingleFile | null>(null)
  const [transitionData, setTransitionData] = useState<TransitionFile | null>(null)
  const [selectedId, setSelectedId] = useState('')
  const [feedback, setFeedback] = useState<FeedbackMap>(readFeedback)
  const [message, setMessage] = useState('')
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [targetTrackId, setTargetTrackId] = useState(activeTrackId ?? trackOptions[0]?.id ?? '')
  const [importPlacement, setImportPlacement] = useState<'append' | 'replace'>('append')
  const [previewRepeats, setPreviewRepeats] = useState(1)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const singlePaths = useMemo(() => Object.keys(singleLoaders).sort((a,b) => (filenameNumber(a) ?? 0) - (filenameNumber(b) ?? 0)), [])
  const transitionPaths = useMemo(() => Object.keys(transitionLoaders).filter(path => { const pair = pairNumbers(path); return pair && (showAllPairs || pair.includes(currentRagaNumber)) }).sort(), [currentRagaNumber, showAllPairs])
  const phrases: Phrase[] = kind === 'single' ? (singleData?.phrases ?? []) : (transitionData?.candidates ?? [])
  const selected = phrases.find(p => p.id === selectedId) ?? null
  const stop = () => { timers.current.forEach(clearTimeout); timers.current = []; setPlayingId(null) }
  useEffect(() => {
    if (!trackOptions.some(track => track.id === targetTrackId)) {
      const fallback = activeTrackId && trackOptions.some(track => track.id === activeTrackId)
        ? activeTrackId
        : (trackOptions[0]?.id ?? '')
      setTargetTrackId(fallback)
    }
  }, [activeTrackId, trackOptions, targetTrackId])
  useEffect(() => { const path = singlePaths.find(p => filenameNumber(p) === currentRagaNumber) ?? singlePaths[0] ?? ''; setSinglePath(path) }, [currentRagaNumber, singlePaths])
  useEffect(() => {
    if (!singlePath || !singleLoaders[singlePath]) return
    let alive = true
    singleLoaders[singlePath]().then(mod => { if (!alive) return; setSingleData(mod.default); setSelectedId(''); setMessage('') }).catch(() => alive && setMessage('Could not load this phrase file. Check the candidates folder.'))
    return () => { alive = false }
  }, [singlePath])
  useEffect(() => {
    if (!transitionPaths.length) { setTransitionPath(''); setTransitionData(null); return }
    const preferred = transitionPaths.includes(transitionPath) ? transitionPath : transitionPaths[0]
    if (preferred !== transitionPath) setTransitionPath(preferred)
  }, [transitionPaths, transitionPath])
  useEffect(() => {
    if (!transitionPath || !transitionLoaders[transitionPath]) return
    let alive = true
    transitionLoaders[transitionPath]().then(mod => { if (!alive) return; setTransitionData(mod.default); setSelectedId(''); setMessage('') }).catch(() => alive && setMessage('Could not load this transition file. Check the transitions folder.'))
    return () => { alive = false }
  }, [transitionPath])
  useEffect(() => () => { timers.current.forEach(clearTimeout) }, [])
  const getEvents = (phrase: Phrase): { semitone: number; beats: number; label: string }[] => {
    const transition = phrase as TransitionCandidate
    if (kind === 'transition' && Array.isArray(transition.events) && transition.events.length) {
      return transition.events.map((e, i) => ({ semitone: e.semitone, beats: e.durationBeats || 1, label: phrase.swaras?.[i] ?? '' }))
    }
    return (phrase.semitones ?? []).map((semitone, i) => ({ semitone, beats: 1, label: phrase.swaras?.[i] ?? '' }))
  }
  const play = (phrase: Phrase) => {
    stop()
    const events = getEvents(phrase)
    if (!events.length) { setMessage('This candidate does not contain playable note data.'); return }
    const beatMs = 60000 / Math.max(35, Math.min(180, tempo || phrase.tempoBpm || 72))
    let onePassDuration = 0
    events.forEach(event => { onePassDuration += beatMs * event.beats })
    const repetitions = Math.max(1, Math.min(8, previewRepeats))
    for (let repetition = 0; repetition < repetitions; repetition++) {
      let elapsed = repetition * onePassDuration
      events.forEach(event => {
        const delay = elapsed
        timers.current.push(setTimeout(() => {
          synthNote(semitonesToHz(settings.tonicHz, event.semitone), Math.max(0.08, beatMs * event.beats * 0.84 / 1000), instrument, settings.volume)
        }, delay))
        elapsed += beatMs * event.beats
      })
    }
    timers.current.push(setTimeout(() => setPlayingId(null), onePassDuration * repetitions))
    setPlayingId(phrase.id)
  }
  const importPhrase = (phrase: Phrase) => {
    if (!onImportPhrase) return
    const events = getEvents(phrase)
    const notes = events.map((e, i) => ({ label: e.label || `Svara ${i + 1}`, semitone: e.semitone, duration: Math.max(0.25, Math.min(2, e.beats * 0.5)) }))
    if (notes.length) { onImportPhrase(notes, phrase.id, targetTrackId || activeTrackId, importPlacement); const trackName = trackOptions.find(track => track.id === (targetTrackId || activeTrackId))?.name ?? 'selected track'; setMessage(`${importPlacement === 'replace' ? 'Replaced contents of' : 'Added'} ${notes.length} notes from ${phrase.id} ${importPlacement === 'replace' ? 'in' : 'to'} ${trackName}.`) }
    else setMessage('This candidate has no importable notes.')
  }
  const saveFeedback = (id: string, value: FeedbackKind) => {
    setFeedback(previous => {
      const existing = previous[id] ?? []
      const nextValues = existing.includes(value) ? existing.filter(x => x !== value) : [...existing, value]
      const next = { ...previous, [id]: nextValues }
      try { localStorage.setItem(FEEDBACK_KEY, JSON.stringify(next)) } catch { setMessage('Feedback could not be saved; browser storage may be full.') }
      return next
    })
    setMessage('Feedback saved on this device.')
  }
  const btn: React.CSSProperties = { border: '1px solid rgba(192,132,252,.42)', borderRadius: 8, padding: '7px 10px', background: 'rgba(124,58,237,.13)', color: '#f8fafc', cursor: 'pointer', fontWeight: 700, fontSize: 12 }
  const selectStyle: React.CSSProperties = { width: '100%', minWidth: 0, padding: '9px 10px', borderRadius: 8, color: '#f8fafc', background: '#111827', border: '1px solid rgba(192,132,252,.35)' }
  return <section style={{ background: 'rgba(14,20,35,.96)', border: '1px solid rgba(45,212,191,.35)', borderRadius: 16, padding: 'clamp(12px,2vw,20px)', color: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 12 }}>
    <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
      <div><div style={{ color: '#5eead4', fontSize: 10, fontWeight: 800, letterSpacing: '.13em', textTransform: 'uppercase' }}>Explore · Listen · Import</div><h3 style={{ margin: '4px 0', color: '#fff', fontSize: 20 }}>Musical Phrase Library</h3><p style={{ margin: 0, color: '#cbd5e1', fontSize: 12, lineHeight: 1.5 }}>Generated candidates are experimental. Choose a phrase, preview it, then import it directly into the active track.</p></div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}><button style={{ ...btn, background: kind === 'single' ? 'linear-gradient(90deg,#6d28d9,#0369a1)' : 'rgba(255,255,255,.04)' }} onClick={() => { stop(); setKind('single'); setMessage('') }}>Single Rāga</button><button style={{ ...btn, background: kind === 'transition' ? 'linear-gradient(90deg,#6d28d9,#0369a1)' : 'rgba(255,255,255,.04)' }} onClick={() => { stop(); setKind('transition'); setMessage('') }}>Rāga Transitions</button></div>
    </header>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,230px),1fr))', gap: 10, alignItems: 'end' }}>
      {kind === 'single' ? <label style={{ color: '#e2e8f0', fontSize: 11, display: 'grid', gap: 5 }}>Melakarta rāga<select value={singlePath} onChange={e => setSinglePath(e.target.value)} style={selectStyle}>{singlePaths.map(path => <option key={path} value={path}>{`Melakarta ${String(filenameNumber(path) ?? '').padStart(2,'0')}`}</option>)}</select></label> : <><label style={{ display: 'flex', gap: 7, alignItems: 'center', color: '#e2e8f0', fontSize: 11 }}><input type="checkbox" checked={showAllPairs} onChange={e => setShowAllPairs(e.target.checked)} /> Show all rāga pairs</label><label style={{ color: '#e2e8f0', fontSize: 11, display: 'grid', gap: 5 }}>Rāga pair<select value={transitionPath} onChange={e => setTransitionPath(e.target.value)} style={selectStyle}>{transitionPaths.map(path => { const pair = pairNumbers(path)!; return <option key={path} value={path}>{String(pair[0]).padStart(2,'0')} ↔ {String(pair[1]).padStart(2,'0')}</option> })}</select></label></>}
      <div style={{ color: '#cbd5e1', fontSize: 11, paddingBottom: 8 }}>{kind === 'single' ? (singleData ? `${singleData.raga.name} · ${singleData.candidateCount} candidates` : 'Loading phrase data…') : (transitionData ? `${transitionData.pair.a.name} → ${transitionData.pair.b.name} · ${transitionData.pair.candidateCount} experimental candidates` : transitionPaths.length ? 'Loading transition data…' : 'No transition files found.')}</div>
    </div>
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, padding: '10px', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, background: 'rgba(255,255,255,.025)' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#cbd5e1', fontSize: 11 }}>Preview repeats
        <select value={previewRepeats} onChange={e => setPreviewRepeats(Number(e.target.value))} style={{ padding: '5px 7px', borderRadius: 6, color: '#f8fafc', background: '#111827', border: '1px solid rgba(192,132,252,.35)' }}>
          {[1,2,3,4,8].map(count => <option key={count} value={count}>{count}×</option>)}
        </select>
      </label>
      {onImportPhrase && trackOptions.length > 0 && <>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#cbd5e1', fontSize: 11 }}>Destination track
          <select value={targetTrackId} onChange={e => setTargetTrackId(e.target.value)} style={{ maxWidth: 210, padding: '5px 7px', borderRadius: 6, color: '#f8fafc', background: '#111827', border: '1px solid rgba(192,132,252,.35)' }}>
            {trackOptions.map(track => <option key={track.id} value={track.id}>{track.name}</option>)}
          </select>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#cbd5e1', fontSize: 11 }}>Import mode
          <select value={importPlacement} onChange={e => setImportPlacement(e.target.value as 'append' | 'replace')} style={{ padding: '5px 7px', borderRadius: 6, color: '#f8fafc', background: '#111827', border: '1px solid rgba(192,132,252,.35)' }}>
            <option value="append">Append to track</option><option value="replace">Replace track contents</option>
          </select>
        </label>
      </>}
      <span style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: 10 }}>Each card has its own preview and import actions.</span>
    </div>
    {phrases.length > 0 && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,255px),1fr))', gap: 10 }}>
      {phrases.map((phrase, i) => {
        const active = (selected?.id ?? '') === phrase.id
        const votes = feedback[phrase.id] ?? []
        const isPlaying = playingId === phrase.id
        return <article key={phrase.id} style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 9, padding: 11, borderRadius: 11, border: `1px solid ${active ? '#5eead4' : 'rgba(192,132,252,.24)'}`, background: active ? 'rgba(20,184,166,.10)' : 'rgba(255,255,255,.035)', boxShadow: active ? '0 0 0 1px rgba(94,234,212,.12)' : 'none' }}>
          <button onClick={() => setSelectedId(phrase.id)} style={{ textAlign: 'left', border: 0, background: 'transparent', color: 'inherit', cursor: 'pointer', padding: 0 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 11 }}><strong>Phrase {String(i+1).padStart(2,'0')}</strong><span style={{ color: '#fbbf24', fontSize: 10 }}>{phrase.level ?? 'experimental'}</span></div><div style={{ color: '#f1f5f9', fontFamily: 'ui-monospace,monospace', lineHeight: 1.8, marginTop: 7, overflowWrap: 'anywhere', fontSize: 12 }}>{(phrase.swaras ?? []).join(' · ') || 'Swara sequence unavailable'}</div><div style={{ color: '#94a3b8', fontSize: 9, marginTop: 5, overflowWrap: 'anywhere' }}>{phrase.id}</div></button>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 'auto' }}><button style={{ ...btn, padding: '6px 8px', borderColor: isPlaying ? '#f87171' : '#7c3aed' }} onClick={() => isPlaying ? stop() : play(phrase)}>{isPlaying ? '■ Stop' : '▶ Preview'}</button>{onImportPhrase && <button style={{ ...btn, padding: '6px 8px', borderColor: '#2dd4bf', color: '#99f6e4', background: 'rgba(20,184,166,.12)' }} onClick={() => importPhrase(phrase)}>＋ Import</button>}</div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 7, display: 'flex', gap: 5, flexWrap: 'wrap' }}><button title="Mark pleasant" style={{ ...btn, padding: '5px 7px', fontSize: 10, background: votes.includes('pleasant') ? 'rgba(20,184,166,.24)' : 'transparent', borderColor: votes.includes('pleasant') ? '#2dd4bf' : 'rgba(255,255,255,.14)' }} onClick={() => saveFeedback(phrase.id,'pleasant')}>👍 {votes.includes('pleasant') ? 'Pleasant ✓' : 'Pleasant'}</button><button title="Needs improvement" style={{ ...btn, padding: '5px 7px', fontSize: 10, background: votes.includes('improve') ? 'rgba(251,191,36,.12)' : 'transparent', borderColor: votes.includes('improve') ? '#fbbf24' : 'rgba(255,255,255,.14)' }} onClick={() => saveFeedback(phrase.id,'improve')}>↻ Improve</button><button title="Rāga character issue" style={{ ...btn, padding: '5px 7px', fontSize: 10, background: votes.includes('raga-character') ? 'rgba(248,113,113,.12)' : 'transparent', borderColor: votes.includes('raga-character') ? '#f87171' : 'rgba(255,255,255,.14)' }} onClick={() => saveFeedback(phrase.id,'raga-character')}>⚑ Rāga issue</button></div>
        </article>
      })}
    </div>}
    {selected?.validation?.notes?.length ? <div style={{ color: '#94a3b8', fontSize: 11, lineHeight: 1.5 }}>Generator note: {selected.validation.notes[0]}</div> : null}
    <div style={{ color: '#94a3b8', fontSize: 10, lineHeight: 1.5 }}>Feedback is stored locally in this browser and is not automatically sent to Bhāva Tech. Candidate ratings are not yet aggregated across users.</div>
    {message && <div role="status" style={{ color: '#99f6e4', fontSize: 12, padding: 9, background: 'rgba(20,184,166,.08)', borderRadius: 8 }}>{message}</div>}
  </section>
}
