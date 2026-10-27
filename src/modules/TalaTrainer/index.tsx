import { useState, useRef, useEffect, useCallback } from 'react'
import { TALAS, SAPTA_TALAS, NADAIS } from '../../data/talas'
import { useAppStore } from '../../store/useAppStore'
import { playClick, playKriyaSound, getAudioContext, getAudioOutputTime } from '../../audio/engine'
import { KriyaIllustration } from '../../components/KriyaIllustration'
import { loadTalaSyllables, scheduleTalaSyllable } from '../../audio/talaSyllables'
import { evaluateTalaTaps, kriyaForBeat, KRIYA_LABELS, nadaiPulsePlan, talaSegments, TALA_JATIS, withTalaJati } from '../../music/talaPractice'
import type { Tala, Nadai } from '../../types/index'

type Level = 'l1' | 'l2' | 'l3' | 'learn'
type SyllableDisplayMode = 'math' | 'sollukattu' | 'jathi'

const RHYTHMIC_DICTIONARY: Record<number, { mathLabel: string; sollukattuDefault: string; jathiOptions: string[] }> = {
  1:{mathLabel:'+1',sollukattuDefault:'Ta',jathiOptions:['Tha','Dhim','Nam']},
  2:{mathLabel:'+2',sollukattuDefault:'Ta Ka',jathiOptions:['Ta Ka','Ta Num']},
  3:{mathLabel:'+3',sollukattuDefault:'Ta Ki Ta',jathiOptions:['Ta Ri Ta','Taka Tha','Jham Ki Ta']},
  4:{mathLabel:'+4',sollukattuDefault:'Ta Ka Di Mi',jathiOptions:['Ta Ri Ki Ta','Ta Dhi M Ta','Ku Ku Ta Ka']},
  5:{mathLabel:'+5',sollukattuDefault:'Ta Ka Ta Ki Ta',jathiOptions:['Ta Zham Ta Ki Ta','Jhanu Ta Ki Ta','Ta Ka Dhi M Ta']},
  6:{mathLabel:'+6',sollukattuDefault:'Ta Ka Di Mi Ta Ka',jathiOptions:['Ta Ri Ki Ta Ta Ka','Jhanu Ta Ka Dhi Mi']},
  7:{mathLabel:'+7',sollukattuDefault:'Ta Ka Di Mi Ta Ki Ta',jathiOptions:['Ta Zham Ta Ri Ki Ta Ta','Dhi M Ta Ka Jham Ta Ka']},
  8:{mathLabel:'+8',sollukattuDefault:'Ta Ka Di Mi Ta Ka Di Mi',jathiOptions:['Ta Ri Ki Ta Jin Ka Dhi Mi','Ta Dhi M Ta Ta Zham Ta Ka']},
  9:{mathLabel:'+9',sollukattuDefault:'Ta Ka Di Mi Ta Ka Ta Ki Ta',jathiOptions:['Ta Ka Di Mi Jhanu Ta Ki Ta','Ku Ku Ta Ka Ta Zham Ta Ki Ta']},
  10:{mathLabel:'+10',sollukattuDefault:'10 pulses',jathiOptions:['Ta Ka Di Mi Ta Ka Ta Ki Ta Ta']},
  12:{mathLabel:'+12',sollukattuDefault:'12 pulses',jathiOptions:['Tadhinona Tadhinona Tadhinona']},
  14:{mathLabel:'+14',sollukattuDefault:'14 pulses',jathiOptions:['Ta Ka Di Mi Ta Ki Ta (×2)']},
  16:{mathLabel:'+16',sollukattuDefault:'16 pulses',jathiOptions:['Ta Ri Ki Ta Dhi Mi Ki Ta (×2)']}
}

export default function TalaTrainer() {
  const { settings } = useAppStore()
  const [level, setLevel] = useState<Level>('learn')
  const [tala, setTala] = useState<Tala>(TALAS[0])
  const [nadai, setNadai] = useState<Nadai>(NADAIS[1])
  const [running, setRunning] = useState(false)
  const [beat, setBeat] = useState(0)
  const [innerBeat, setInnerBeat] = useState(0)
  const [accuracyTapCount, setAccuracyTapCount] = useState(0)
  const [loop, setLoop] = useState(false)
  const [accuracy, setAccuracy] = useState<number|null>(null)
  const [l3Phrase, setL3Phrase] = useState<number[]>([])
  const [l3Gap, setL3Gap] = useState(0)
  const [l3Status, setL3Status] = useState<string>('')
  const [syllableMode, setSyllableMode] = useState<SyllableDisplayMode>('math')
  const [phraseVariants, setPhraseVariants] = useState<Record<number, number>>({})
  const [editingVariant, setEditingVariant] = useState<number | null>(null)
  const [sessionBeats, setSessionBeats] = useState(0)
  const [l3StartOffset, setL3StartOffset] = useState('0')
  const [l3Landing, setL3Landing] = useState('samam')
  const [l3CustomLanding, setL3CustomLanding] = useState('1')
  const [speakSyllables, setSpeakSyllables] = useState(false)
  const [showKriyaGuide, setShowKriyaGuide] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [loadingAudio, setLoadingAudio] = useState(false)
  const [audioError, setAudioError] = useState('')
  
  const intervalRef = useRef<number|null>(null)
  const visualFrameRef = useRef<number|null>(null)
  const scheduledBeatsRef = useRef<{ beat: number; at: number; wallAt: number }[]>([])
  const expectedWallTimesRef = useRef<number[]>([])
  const sessionStartWallRef = useRef(0)
  const beatRef = useRef(0)
  const innerRef = useRef(0)
  const tapTimesRef = useRef<number[]>([])
  const audioSourcesRef = useRef(new Set<AudioScheduledSourceNode>())
  const loadRef = useRef<AbortController | null>(null)
  const generationRef = useRef(0)
  const TARGET_CYCLES = 4

  const beatDur = 60 / settings.bpm

  const stopMetronome = useCallback(() => {
    generationRef.current++
    loadRef.current?.abort()
    setLoadingAudio(false)
    if (intervalRef.current !== null) window.clearTimeout(intervalRef.current)
    if (visualFrameRef.current !== null) window.cancelAnimationFrame(visualFrameRef.current)
    intervalRef.current = null
    visualFrameRef.current = null
    scheduledBeatsRef.current = []
    audioSourcesRef.current.forEach(source => source.stop())
    audioSourcesRef.current.clear()
    setRunning(false); setBeat(0); setInnerBeat(0)
  }, [])

  const startMetronome = useCallback(async () => {
    const generation = ++generationRef.current
    const controller = new AbortController()
    loadRef.current?.abort()
    loadRef.current = controller
    setAudioError('')
    setLoadingAudio(true)
    try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') await ctx.resume()
    if (ctx.state !== 'running') throw new Error('Audio could not start. Check browser audio permissions.')
    const pulsePlan = nadaiPulsePlan(nadai, settings.bpm, speed)
    if (level === 'l2' && speakSyllables && pulsePlan[0].durationSeconds < 0.075) {
      throw new Error('Subdivisions are too fast for clear syllables. Lower BPM or speed, or turn off Speak syllables for clicks only.')
    }
    const buffers = level === 'l2' && speakSyllables
      ? await loadTalaSyllables(ctx, import.meta.env.BASE_URL, controller.signal) : null
    if (generation !== generationRef.current) return
    if (intervalRef.current !== null) window.clearInterval(intervalRef.current)
    if (visualFrameRef.current !== null) window.cancelAnimationFrame(visualFrameRef.current)
    const track = (source: AudioScheduledSourceNode) => {
      audioSourcesRef.current.add(source)
      source.addEventListener('ended', () => audioSourcesRef.current.delete(source), { once: true })
    }

    beatRef.current = 0
    innerRef.current = 0
    tapTimesRef.current = []
    scheduledBeatsRef.current = []
    expectedWallTimesRef.current = []
    setBeat(0); setInnerBeat(0); setAccuracyTapCount(0); setAccuracy(null)
    setRunning(true); setSessionBeats(0)

    // Keep audio scheduling on AudioContext.currentTime. The UI follows a queue
    // of those scheduled timestamps instead of deciding when sound should play.
    const totalBeats = tala.beats * TARGET_CYCLES
    const startAt = ctx.currentTime + 0.12
    const startWall = performance.now() + (startAt - getAudioOutputTime(ctx)) * 1000
    sessionStartWallRef.current = startWall
    let nextIndex = 0
    let scoredWindows = 0

    const scheduler = () => {
      if (ctx.state !== 'running' || ctx.currentTime > startAt + nextIndex * beatDur + 0.05) {
        stopMetronome()
        setAudioError('Rhythm audio was interrupted. Press Start to begin a new cycle.')
        return
      }
      const horizon = ctx.currentTime + (document.hidden ? 2 : 0.12)
      while ((loop || nextIndex < totalBeats) && startAt + nextIndex * beatDur < horizon) {
        const at = startAt + nextIndex * beatDur
        const outerBeat = nextIndex % tala.beats
        const wallAt = startWall + nextIndex * beatDur * 1000
        scheduledBeatsRef.current.push({ beat: outerBeat, at, wallAt })
        if (level === 'l1') expectedWallTimesRef.current.push(wallAt)
        const isSam = tala.samBeats.includes(outerBeat)
        track(playKriyaSound(kriyaForBeat(tala, outerBeat), settings.volume, isSam, at))

        if (level === 'l2') {
          for (const pulse of pulsePlan) {
            const subAt = at + pulse.offsetSeconds
            if (buffers) track(scheduleTalaSyllable(ctx, buffers, pulse.syllable, subAt, pulse.durationSeconds, settings.volume))
            else if (pulse.offsetSeconds > 0) track(playClick(300, settings.volume * 0.2, 0.025, subAt))
          }
        }
        nextIndex++
      }
      if (loop || nextIndex < totalBeats) intervalRef.current = window.setTimeout(scheduler, 25)
    }

    const draw = () => {
      if (ctx.state !== 'running') {
        stopMetronome()
        setAudioError('Rhythm audio was interrupted. Press Start to begin a new cycle.')
        return
      }
      const now = getAudioOutputTime(ctx)
      let due: { beat: number; at: number; wallAt: number } | undefined
      let dueCount = 0
      while (scheduledBeatsRef.current.length && scheduledBeatsRef.current[0].at <= now + 0.008) {
        due = scheduledBeatsRef.current.shift()
        dueCount++
      }
      if (due && dueCount > 0) {
        setBeat(due.beat)
        setInnerBeat(0)
        setSessionBeats(prev => prev + dueCount)
        beatRef.current = Math.round((due.wallAt - startWall) / (beatDur * 1000)) + 1
      }
      const elapsedBeats = Math.max(0, (now - startAt) / beatDur)
      const activeSub = Math.floor((elapsedBeats % 1) * nadai.count * speed) % nadai.count
      setInnerBeat(activeSub)

      const completedWindows = Math.floor(Math.max(0, now - startAt) / (totalBeats * beatDur))
      if (level === 'l1' && completedWindows > scoredWindows) {
        const boundary = startWall + completedWindows * totalBeats * beatDur * 1000
        const expected = expectedWallTimesRef.current.filter(time => time < boundary)
        const taps = tapTimesRef.current.filter(time => time < boundary)
        setAccuracy(evaluateTalaTaps(expected, taps, Math.min(120, beatDur * 250)).accuracy)
        setAccuracyTapCount(taps.length)
        expectedWallTimesRef.current = expectedWallTimesRef.current.filter(time => time >= boundary)
        tapTimesRef.current = tapTimesRef.current.filter(time => time >= boundary)
        scoredWindows = completedWindows
      }
      if (!loop && now >= startAt + totalBeats * beatDur) {
        setRunning(false)
        if (intervalRef.current !== null) window.clearTimeout(intervalRef.current)
        intervalRef.current = null
        return
      }
      visualFrameRef.current = window.requestAnimationFrame(draw)
    }

    scheduler()
    visualFrameRef.current = window.requestAnimationFrame(draw)
    } catch (error) {
      if (generation === generationRef.current) {
        stopMetronome()
        setAudioError(error instanceof Error ? error.message : String(error))
      }
    } finally {
      if (generation === generationRef.current) setLoadingAudio(false)
    }
  }, [tala, nadai, settings.bpm, settings.volume, level, beatDur, speakSyllables, speed, loop, stopMetronome])

  useEffect(() => {
    stopMetronome()
    setAudioError('')
    return stopMetronome
  }, [tala, nadai, settings.bpm, settings.volume, level, speed, speakSyllables, loop, stopMetronome])

  const handleTap = useCallback(() => {
    if (!running) return
    const timing = performance.now()
    tapTimesRef.current.push(timing)
  }, [tala.beats, running])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (!e.repeat && e.code === 'Space' && running && level === 'l1' && !['BUTTON','INPUT','TEXTAREA','SELECT'].includes((e.target as HTMLElement)?.tagName)) { e.preventDefault(); handleTap() } }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [running, level, handleTap])

  // L3 Sam-landing calculation
  const l3Pulses = tala.beats * nadai.count
  const phraseTotal = l3Phrase.reduce((a,b)=>a+b,0)
  // A gap is placed only BETWEEN repetitions, so three phrases have two gaps.
  const korvaiTotal = phraseTotal * 3 + l3Gap * 2
  const l3PulseMap = Array.from({ length: Math.min(korvaiTotal, 120) }, (_, i) => {
    const phraseSpan = phraseTotal + l3Gap
    const offset = phraseSpan > 0 ? i % phraseSpan : 0
    const repetition = phraseSpan > 0 ? Math.min(2, Math.floor(i / phraseSpan)) : 0
    const inGap = repetition < 2 && l3Gap > 0 && offset >= phraseTotal
    return { pulse: i + 1, cyclePosition: (i % Math.max(1, l3Pulses)) + 1, repetition: repetition + 1, inGap }
  })
  const samLand = l3Pulses > 0 ? korvaiTotal % l3Pulses === 0 : false
  const angaSegments = talaSegments(tala)
  const talaBoundaries = angaSegments.map(segment => segment.end)
  const activeKriya = kriyaForBeat(tala, beat % tala.beats)
  const isCapuTala = tala.id === 'khanda_capu' || tala.id === 'misra_capu'
  const startOffsetBeats = Number(l3StartOffset)
  const startOffsetPulses = startOffsetBeats * nadai.count
  const landingPulse = l3Landing === 'samam' ? 0 : l3Landing === 'custom' ? Number(l3CustomLanding) - 1 : l3Landing.startsWith('anga:') ? Number(l3Landing.slice(5)) * nadai.count - 1 : Number(l3Landing) - 1
  const landingLabel = l3Landing === 'samam' ? 'Samam' : l3Landing === 'custom' ? `pulse ${l3CustomLanding}` : l3Landing.startsWith('anga:') ? `Aruḍi target at end of anga beat ${l3Landing.slice(5)}` : `pulse ${landingPulse + 1}`
  const landingDelta = ((startOffsetPulses + korvaiTotal - landingPulse) % l3Pulses + l3Pulses) % l3Pulses
  const landsAtTarget = phraseTotal > 0 && Math.abs(landingDelta) < 0.0001
  const suggestedGapNumerator = l3Pulses - phraseTotal * 3
  const suggestedGap = suggestedGapNumerator >= 0 && suggestedGapNumerator % 2 === 0 ? suggestedGapNumerator / 2 : null

  const checkL3 = () => {
    if (phraseTotal <= 0) {
      setL3Status('Add at least one phrase block before checking the landing.')
      return
    }
    const endPosition = ((startOffsetPulses + korvaiTotal) % l3Pulses + l3Pulses) % l3Pulses
    if (Math.abs(endPosition - landingPulse) < 0.0001) {
      setL3Status(`✓ Mathematical landing match: start offset ${startOffsetBeats} beat(s), pattern ${korvaiTotal} pulses, end position ${endPosition.toFixed(2)} pulses, target ${landingLabel}. This checks arithmetic only; confirm the chosen Eduppu/Aruḍi with a knowledgeable teacher.`)
      return
    }
    const distance = ((landingPulse - endPosition) % l3Pulses + l3Pulses) % l3Pulses
    setL3Status(`Not at the selected landing point. The pattern ends at pulse-position ${endPosition.toFixed(2)} of ${l3Pulses}; it is ${distance.toFixed(2)} pulse(s) from the selected target. Check the phrase's actual Eduppu and traditional Aruḍi rules.`)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
      {/* Level tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', background:'var(--surface)', padding:'0 var(--space-4)', gap:0 }}>
        {(['learn','l1','l2','l3'] as Level[]).map(lv => (
          <button key={lv}
            onClick={() => { stopMetronome(); setLevel(lv) }}
            style={{ padding:'var(--space-2) var(--space-4)', fontSize:'0.82rem', fontWeight: level===lv?700:400, color: level===lv?'var(--accent)':'var(--text-muted)', borderBottom: level===lv?'2px solid var(--accent)':'2px solid transparent', cursor:'pointer' }}>
            {lv === 'learn' ? '📚 Theory' : lv === 'l1' ? 'L1 — Beat' : lv === 'l2' ? 'L2 — Nadai' : 'L3 — Korvai'}
          </button>
        ))}
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'var(--space-6)' }}>
        {/* Tala & Nadai selectors */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:'var(--space-4)', marginBottom:'var(--space-6)' }}>
          <div>
            <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginBottom:4 }}>Tāla</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
              {TALAS.map(t => (
                <button key={t.id} onClick={() => setTala(t)}
                  style={{ padding:'4px 12px', borderRadius:99, fontSize:'0.78rem', cursor:'pointer', border:'1px solid', background: tala.id===t.id?'var(--accent)':'transparent', borderColor: tala.id===t.id?'var(--accent)':'var(--border)', color: tala.id===t.id?'#000':'var(--text-muted)' }}>
                  {t.name} ({t.beats})
                </button>
              ))}
            </div>
          </div>
          {tala.family !== 'capu' && <label style={{fontSize:13}}>
            Jāti / laghu count
            <select aria-label="Tala jati" value={tala.angas.find(anga=>anga.kind==='laghu')?.count} onChange={e=>setTala(withTalaJati(tala,Number(e.target.value)))} style={{marginLeft:8,padding:6}}>
              {TALA_JATIS.map(jati=><option key={jati.count} value={jati.count}>{jati.name} ({jati.count})</option>)}
            </select>
            <span style={{display:'block',marginTop:6,color:'var(--text-muted)'}}>{tala.name} · {tala.beats}-count cycle</span>
          </label>}
          {(level==='l2'||level==='l3') && (
            <div>
              <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginBottom:4 }}>Nadai / Gati</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                {NADAIS.map(n => (
                  <button key={n.id} onClick={() => setNadai(n)}
                    style={{ padding:'4px 12px', borderRadius:99, fontSize:'0.78rem', cursor:'pointer', border:'1px solid', background: nadai.id===n.id?'var(--teal)':'transparent', borderColor: nadai.id===n.id?'var(--teal)':'var(--border)', color: nadai.id===n.id?'#000':'var(--text-muted)' }}>
                    {n.name} ({n.count}) <span style={{ fontSize:'0.65rem', opacity:0.7 }}>{n.solkattu}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {level === 'learn' && (
          <>
          <h3>Sulādi Sapta Tālas — the seven basic forms</h3>
          <p style={{color:'var(--text-muted)',fontSize:13,lineHeight:1.6}}>Dhruva, Maṭya, Rūpaka, Jhampa, Tripuṭa, Aṭa and Ēka. The examples below use their stated jātis, not one common laghu count. Jāti determines the laghu count; nadai determines subdivisions within a beat; speed multiplies those subdivisions without changing BPM. Ādi is Chaturasra-jāti Tripuṭa, not an eighth basic form.</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,300px),1fr))', gap:'var(--space-4)' }}>
            {[...SAPTA_TALAS, ...TALAS.filter(t => t.family !== 'sapta')].map(t => (
              <div key={t.id} style={{ background:'var(--surface)', borderRadius:'var(--radius)', padding:'var(--space-4)', border:'1px solid var(--border)' }}>
                <small>{t.family === 'sapta' ? 'Sulādi Sapta Tāla' : t.family === 'adi' ? 'Common Tripuṭa variant' : 'Cāpu · separate family'}</small>
                <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1rem', color:'var(--accent)' }}>{t.name}</h3>
                <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginBottom:'var(--space-2)' }}>{t.nameTelugu} · {t.nameTamil}</div>
                <div style={{ marginBottom:'var(--space-2)' }}>
                  <div style={{ fontSize:'0.75rem', color:'var(--text-faint)', marginBottom:4 }}>Structure: {t.structure}</div>
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                    {Array.from({length:t.beats},(_,i)=>(
                      <div key={i} title={KRIYA_LABELS[kriyaForBeat(t,i)]} style={{ padding:'3px 8px', background: t.samBeats.includes(i)?'var(--accent-dim)':'var(--surface2)', border:`1px solid ${t.samBeats.includes(i)?'var(--accent)':'var(--border)'}`, borderRadius:4, fontSize:'0.72rem', color: t.samBeats.includes(i)?'var(--accent)':'var(--text-muted)', fontFamily:'monospace' }}>{i+1}</div>
                    ))}
                  </div>
                </div>
                <p style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{t.description}</p>
                <div style={{ fontSize:'0.72rem', color:'var(--text-faint)', marginTop:'var(--space-2)' }}>Hindustani: {t.hindustaniEquivalent}</div>
              </div>
            ))}
          </div>
          </>
        )}

        {(level === 'l1' || level === 'l2') && (
          <div style={{ width:'100%', maxWidth:900, minWidth:0, boxSizing:'border-box' }}>
            <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.1rem', marginBottom:'var(--space-4)', color:'var(--text)' }}>
              {level==='l1' ? `L1 — Tap with the ${tala.name} cycle` : `L2 — Feel the ${nadai.name} (${nadai.count}) Nadai inside ${tala.name}`}
            </h3>
            
            {/* Optional kriya guide: hidden by default to keep the beat grid uncluttered on small screens. */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,flexWrap:'wrap',marginBottom:'var(--space-3)'}}>
              <div style={{fontSize:'0.78rem',color:'var(--text-muted)'}}>{isCapuTala ? 'Cāpu pulse grouping · optional hand illustration' : `Kriyā hand guide · ${running && showKriyaGuide ? 'Following the current beat' : 'Optional visual demonstration'}`}</div>
              <button type="button" aria-expanded={showKriyaGuide} onClick={()=>setShowKriyaGuide(v=>!v)} style={{padding:'7px 12px',borderRadius:'var(--radius-sm)',border:'1px solid var(--border)',background:showKriyaGuide?'var(--accent-dim)':'var(--surface)',color:'var(--text)',fontSize:'0.78rem',fontWeight:600,cursor:'pointer'}}>
                {showKriyaGuide ? 'Hide visual guide' : 'Show hand guide'}
              </button>
            </div>
            {showKriyaGuide && (
              <>
                <KriyaIllustration action={activeKriya} beatNo={beat + 1} />
                {isCapuTala && <div role="note" style={{padding:'12px 14px',marginBottom:'var(--space-3)',border:'1px solid var(--border)',borderRadius:'var(--radius-md)',background:'var(--surface2)',color:'var(--text)',fontSize:'0.82rem',lineHeight:1.55}}>
                  <strong>{tala.name}: illustrative guide</strong><br/>
                  The hand picture is a visual aid synchronized to the selected beat, alongside the simplified {tala.id === 'khanda_capu' ? '2 + 3' : '3 + 4'} pulse grouping. It is not a definitive prescription for Cāpu kriyā. Gestures can vary by composition and teaching tradition; for the most accurate practice, please consult a qualified Carnatic music guru.
                </div>}
              </>
            )}

            {/* Beat visualizer */}
            <div style={{ display:'flex', gap:6, marginBottom:'var(--space-4)', flexWrap:'wrap', alignItems:'center', width:'100%', minWidth:0 }}>
              {Array.from({ length: tala.beats }, (_, i) => (
                <div key={`beat-${i}`} style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{
                    width:'clamp(32px, 7vw, 40px)', height:'clamp(32px, 7vw, 40px)', borderRadius:'var(--radius-sm)', display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:'0.72rem', fontFamily:'monospace', fontWeight:600,
                    background: running && beat===i ? (tala.samBeats.includes(i)?'var(--accent)':'var(--teal)') : tala.samBeats.includes(i)?'var(--accent-dim)':'var(--surface2)',
                    border: `1px solid ${tala.samBeats.includes(i)?'var(--accent)':'var(--border)'}`,
                    color: running && beat===i ? '#000' : 'var(--text)', transition:'background 0.1s',
                  }}>{i + 1}</div>
                  {talaBoundaries.includes(i + 1) && <span key={`bar-${i}`} aria-label="Anga boundary" style={{ color:'var(--text-muted)', fontWeight:700, padding:'0 1px' }}>|</span>}
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:'var(--space-3)' }} aria-label="Tala anga and kriya notation">
              {angaSegments.map((segment, i) => (
                <div key={`${segment.start}-${segment.end}`} style={{ flex:`${segment.end-segment.start+1} 1 70px`, minWidth:70, padding:'6px 8px', borderRadius:5, border:'1px solid var(--border)', background:i===0?'var(--accent-dim)':'var(--surface2)', fontSize:'0.68rem', color:i===0?'var(--accent)':'var(--text-muted)' }}>
                  <b>{segment.start}–{segment.end}</b><div>{segment.label}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginBottom:'var(--space-4)', lineHeight:1.55 }}>{isCapuTala ? 'Cāpu tālas are shown here as pulse groupings, not as a definitive hand-gesture prescription.' : 'Kriyā guide: tap the thigh · count fingers · wave the hand. This is a learning aid; gesture details may vary by teaching tradition.'} For the most accurate practice, please consult a qualified Carnatic music guru, especially for composition-specific and less common tāla forms.</div>

            {level === 'l2' && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:'var(--space-4)' }}>
                {Array.from({length:nadai.count}).map((_,i)=>(
                  <div key={i} aria-label={`Subdivision ${i+1}: ${nadai.solkattu.split(' ')[i]}`} style={{ minWidth:34, padding:'4px', borderRadius:4, textAlign:'center', fontSize:'0.7rem', background: running && innerBeat===i?'var(--gold)':'var(--surface2)', border:'1px solid var(--border)', color:running && innerBeat===i?'#182321':'var(--text-muted)', transition:'background 0.1s' }}>{i+1}<br/>{nadai.solkattu.split(' ')[i]}</div>
                ))}
                <span style={{ fontSize:'0.72rem', color:'var(--text-faint)', marginLeft:4, alignSelf:'center' }}>× {nadai.solkattu}</span>
                <span style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginLeft:8, alignSelf:'center' }}>{syllableMode === 'math' ? `${nadai.count} pulses` : syllableMode === 'sollukattu' ? (RHYTHMIC_DICTIONARY[nadai.count]?.sollukattuDefault ?? nadai.solkattu) : (RHYTHMIC_DICTIONARY[nadai.count]?.jathiOptions[0] ?? nadai.solkattu)}</span>
                <label style={{ display:'inline-flex', gap:5, alignItems:'center', fontSize:'0.72rem', color:'var(--text-muted)', marginLeft:8 }}><input type="checkbox" checked={speakSyllables} onChange={e=>setSpeakSyllables(e.target.checked)} /> Speak syllables (synthesized voice)</label>
                <label style={{fontSize:12}}>Speed within each beat <select aria-label="Nadai speed" value={speed} onChange={e=>setSpeed(Number(e.target.value))}>{[1,2,4,8].map(value=><option key={value} value={value}>{value}×</option>)}</select></label>
                <span style={{fontSize:12,color:'var(--text-muted)'}}>{nadai.count * speed} pulses per beat; BPM unchanged. Voice samples are synthetic pronunciation guides, not a traditional konnakol recording. At high subdivision rates, slow the BPM for clarity.</span>
              </div>
            )}

            {/* Controls */}
            <div style={{ display:'flex', gap:'var(--space-3)', alignItems:'center', marginBottom:'var(--space-4)', flexWrap:'wrap' }}>
              <button onClick={() => running || loadingAudio ? stopMetronome() : void startMetronome()}
                style={{ padding:'8px 24px', borderRadius:'var(--radius-sm)', fontWeight:700, fontSize:'0.88rem', background: running?'rgba(248,113,113,0.15)':'var(--accent-dim)', border:`1px solid ${running?'var(--red)':'var(--accent)'}`, color: running?'var(--red)':'var(--accent)', cursor:'pointer' }}>
                {loadingAudio ? 'Cancel loading audio' : running ? '⏹ Stop' : '▶ Start'}
              </button>
              <label style={{display:'inline-flex',alignItems:'center',gap:6,fontSize:'0.82rem'}}>
                <input type="checkbox" checked={loop} disabled={running || loadingAudio} onChange={event=>setLoop(event.target.checked)} />
                Loop until Stop
              </label>
              {running && level==='l1' && (
                <button onClick={handleTap}
                  style={{ padding:'8px 24px', borderRadius:'var(--radius-sm)', fontWeight:700, fontSize:'0.88rem', background:'rgba(34,211,238,0.15)', border:'1px solid var(--teal)', color:'var(--teal)', cursor:'pointer' }}>
                  TAP (Space)
                </button>
              )}
              <span style={{ fontSize:'0.72rem', color:'var(--text-faint)' }}>{loop ? `Continuous practice · ${Math.floor(sessionBeats / tala.beats)} cycles played${level === 'l1' ? ' · scored every 4 cycles' : ''}` : `Target: ${TARGET_CYCLES} cycles (${tala.beats * TARGET_CYCLES * (level === 'l2' ? nadai.count * speed : 1)} ${level === 'l2' ? 'pulses' : 'beats'})`}</span>
            </div>
            {audioError && <div role="alert" style={{color:'var(--red)',marginBottom:12}}>{audioError}</div>}

            {/* Progress bar */}
            {running && (
              <div style={{ height:6, background:'var(--surface2)', borderRadius:99, marginBottom:'var(--space-3)', overflow:'hidden' }}>
                <div style={{ height:'100%', background:'var(--accent)', width:`${(loop ? (sessionBeats === 0 ? 0 : ((sessionBeats - 1) % tala.beats + 1) / tala.beats) : sessionBeats / (tala.beats * TARGET_CYCLES))*100}%`, transition:'width 0.1s', borderRadius:99 }}/>
              </div>
            )}

            {accuracy !== null && (
              <div style={{ padding:'var(--space-3)', borderRadius:'var(--radius)', background: accuracy>=85?'rgba(74,222,128,0.1)':'rgba(248,113,113,0.1)', border:`1px solid ${accuracy>=85?'var(--green)':'var(--red)'}` }}>
                <div style={{ fontSize:'0.88rem', fontWeight:700, color: accuracy>=85?'var(--green)':'var(--red)' }}>
                  {accuracy>=85?'✅':'❌'} Accuracy: {accuracy}% {accuracy>=85?'— L1 Passed!':'— Keep Practicing'}
                </div>
                <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:4 }}>{accuracyTapCount} taps recorded{loop ? ' in the last completed four-cycle block' : ''}</div>
              </div>
            )}
          </div>
        )}

        {level === 'l3' && (
          <div style={{ width:'100%', maxWidth:900, minWidth:0, boxSizing:'border-box' }}>
            <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.1rem', marginBottom:'var(--space-2)', color:'var(--text)' }}>L3 — Mora / Korvai Builder</h3>
            <p style={{ fontSize:'0.82rem', color:'var(--text-muted)', marginBottom:'var(--space-3)' }}>
              Build one rhythmic phrase, repeat it three times, and place a silence gap only between repetitions. The timeline shows how the pattern travels through the tāla cycle.
            </p>
            <div style={{ padding:'var(--space-3)', background:'var(--surface2)', borderRadius:'var(--radius-sm)', marginBottom:'var(--space-4)', fontSize:'0.82rem' }}>
              <b>Current cycle:</b> {tala.name} · {tala.beats} akṣaras × {nadai.count} pulses = <b>{l3Pulses} pulses</b>.<br/>
              <span style={{ color:'var(--text-muted)' }}>For this exercise, the phrase starts on Sam (cycle position 1). This is a pulse-counting aid, not a complete traditional korvai/Eduppu validator.</span>
            </div>
            <div style={{ padding:'var(--space-3)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', marginBottom:'var(--space-4)' }}>
              <b style={{ fontSize:'0.82rem' }}>Eduppu and landing point</b>
              <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginTop:8 }}>
                <label style={{ display:'flex', flexDirection:'column', gap:4, fontSize:'0.74rem', color:'var(--text-muted)' }}>Phrase start relative to Samam
                  <select value={l3StartOffset} onChange={e=>{setL3StartOffset(e.target.value);setL3Status('')}} style={{ padding:6, borderRadius:4, border:'1px solid var(--border)', background:'var(--surface)', color:'var(--text)' }}>
                    <option value="-0.5">Atīta · ½ beat before</option><option value="-0.25">Atīta · ¼ beat before</option><option value="0">Samam</option><option value="0.25">Anāgata · ¼ beat after</option><option value="0.5">Anāgata · ½ beat after</option><option value="0.75">Anāgata · ¾ beat after</option>
                  </select>
                </label>
                <label style={{ display:'flex', flexDirection:'column', gap:4, fontSize:'0.74rem', color:'var(--text-muted)' }}>Landing target
                  <select value={l3Landing} onChange={e=>{setL3Landing(e.target.value);setL3Status('')}} style={{ padding:6, borderRadius:4, border:'1px solid var(--border)', background:'var(--surface)', color:'var(--text)' }}>
                    <option value="samam">Samam / cycle start</option>{talaBoundaries.map(boundary=><option key={boundary} value={`anga:${boundary}`}>Aruḍi target · end of beat {boundary}</option>)}<option value="custom">Custom pulse position</option>
                  </select>
                </label>
                {l3Landing==='custom' && <label style={{ display:'flex', flexDirection:'column', gap:4, fontSize:'0.74rem', color:'var(--text-muted)' }}>Target pulse (1–{l3Pulses})<input type="number" min="1" max={l3Pulses} value={l3CustomLanding} onChange={e=>{setL3CustomLanding(String(Math.min(l3Pulses,Math.max(1,Number(e.target.value)||1))));setL3Status('')}} style={{ width:100, padding:6, borderRadius:4, border:'1px solid var(--border)', background:'var(--surface)', color:'var(--text)' }}/></label>}
              </div>
              <p style={{ fontSize:'0.7rem', color:'var(--text-muted)', marginTop:8 }}>Offsets are measured in akṣara-beat fractions and converted to pulses using the selected nadai. This is a configurable arithmetic model, not a universal rule for Aruḍi.</p>
            </div>

            <div style={{ marginBottom:'var(--space-4)' }}>
              <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginBottom:'var(--space-2)' }}>1. Build the phrase (each block adds pulses):</div>
              <div style={{ display:'flex', gap:4, marginBottom:'var(--space-2)', flexWrap:'wrap' }}>
                {([{id:'math',label:'Math (Numbers)'},{id:'sollukattu',label:'Sollukattu'},{id:'jathi',label:'Jathi (Lyrical)'}] as const).map(mode=><button key={mode.id} onClick={()=>setSyllableMode(mode.id)} style={{ padding:'5px 10px', borderRadius:4, fontSize:'0.75rem', background:syllableMode===mode.id?'var(--accent-dim)':'transparent', border:'1px solid var(--border)', color:syllableMode===mode.id?'var(--accent)':'var(--text-muted)', cursor:'pointer' }}>{mode.label}</button>)}
              </div>
              <div style={{ display:'flex', gap:'var(--space-2)', flexWrap:'wrap', marginBottom:'var(--space-2)' }}>
                {[1,2,3,4,5,6,7,8,9,10,12,14,16].map(v=>{
                  const data=RHYTHMIC_DICTIONARY[v]
                  const label=syllableMode==='math'?data.mathLabel:syllableMode==='sollukattu'?data.sollukattuDefault:data.jathiOptions[0]
                  return <button key={v} title={`${v} pulses`} onClick={()=>{setL3Phrase(prev=>[...prev,v]);setPhraseVariants(prev=>({...prev,[l3Phrase.length]:0}));setL3Status('')}}
                    style={{ padding:'5px 8px', borderRadius:4, fontSize:'0.76rem', background:'var(--surface2)', border:'1px solid var(--border)', color:'var(--text)', cursor:'pointer', maxWidth:190 }}>{syllableMode==='math'?label:<><span style={{display:'block',fontSize:'0.62rem',color:'var(--text-muted)'}}>{data.mathLabel}</span>{label}</>}</button>
                })}
                <button onClick={()=>{setL3Phrase([]);setL3Status('')}} style={{ padding:'4px 10px', borderRadius:4, fontSize:'0.78rem', background:'transparent', border:'1px solid var(--border)', color:'var(--red)', cursor:'pointer' }}>Clear phrase</button>
              </div>
              <div style={{ display:'flex', gap:4, flexWrap:'wrap', minHeight:36, alignItems:'center' }}>
                {l3Phrase.map((v,i)=>{
                  const data=RHYTHMIC_DICTIONARY[v]; const variants=data.jathiOptions; const selected=phraseVariants[i] ?? 0
                  const label=syllableMode==='math'?data.mathLabel:syllableMode==='sollukattu'?data.sollukattuDefault:variants[selected % variants.length]
                  return <div key={i} style={{display:'inline-flex',flexDirection:'column',gap:3,alignItems:'stretch'}}>
                    <button title="Click to remove this phrase block" onClick={()=>{setL3Phrase(prev=>prev.filter((_,j)=>j!==i));setPhraseVariants({});setEditingVariant(null);setL3Status('')}} style={{ padding:'5px 8px', borderRadius:4, background:'var(--accent-dim)', border:'1px solid var(--accent)', color:'var(--accent)', fontSize:'0.75rem', cursor:'pointer', maxWidth:190 }}>{label} ×</button>
                    {syllableMode==='jathi' && variants.length>1 && <button onClick={()=>setEditingVariant(editingVariant===i?null:i)} style={{fontSize:'0.65rem',border:'1px solid var(--border)',borderRadius:4,background:'transparent',color:'var(--text-muted)',cursor:'pointer'}}>Change variation</button>}
                    {editingVariant===i && syllableMode==='jathi' && <div style={{display:'flex',flexDirection:'column',gap:3}}>{variants.map((variant,vi)=><button key={variant} onClick={()=>{setPhraseVariants(prev=>({...prev,[i]:vi}));setEditingVariant(null)}} style={{fontSize:'0.68rem',padding:'4px',border:'1px solid var(--border)',borderRadius:4,background:selected===vi?'var(--accent-dim)':'var(--surface)',color:'var(--text)',cursor:'pointer'}}>{variant}</button>)}</div>}
                  </div>
                })}
                <b style={{ fontSize:'0.78rem', color:'var(--text)' }}>= {phraseTotal} pulses per phrase</b>
              </div>
            </div>

            <div style={{ marginBottom:'var(--space-4)' }}>
              <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginBottom:'var(--space-2)' }}>2. Silence between repetitions: <b>{l3Gap} pulses</b> (there are two gaps)</div>
              <input type="range" min={0} max={16} value={l3Gap} onChange={e=>{setL3Gap(parseInt(e.target.value));setL3Status('')}} style={{ width:220, accentColor:'var(--teal)' }} />
            </div>

            <div style={{ background:'var(--surface)', padding:'var(--space-4)', borderRadius:'var(--radius)', border:'1px solid var(--border)', marginBottom:'var(--space-4)', fontSize:'0.86rem' }}>
              <b style={{ color:'var(--text)' }}>3. Count the full pattern</b>
              <div style={{ marginTop:8, fontFamily:'monospace' }}>3 × {phraseTotal} phrase pulses + 2 × {l3Gap} gap pulses = <b>{korvaiTotal} total pulses</b></div>
              <div style={{ marginTop:6, color:'var(--text-muted)' }}>Cycle length: {l3Pulses} pulses</div>
              {phraseTotal > 0 && <div style={{ marginTop:6, color: landsAtTarget ? 'var(--green)' : 'var(--text)' }}>
                {landsAtTarget ? '✓ Pattern end matches the selected target mathematically.' : `End position: ${(((startOffsetPulses + korvaiTotal) % l3Pulses + l3Pulses) % l3Pulses).toFixed(2)} pulses into the cycle; target: ${landingLabel}.`}
              </div>}
            </div>

            <div style={{ marginBottom:'var(--space-4)' }}>
              <b style={{ fontSize:'0.88rem' }}>4. Follow the cycle timeline</b>
              <p style={{ fontSize:'0.75rem', color:'var(--text-muted)', margin:'4px 0 10px' }}>Each small cell is one pulse. The highlighted first cell of each cycle is Sam; pale cells are the silence gaps. {korvaiTotal > 120 ? 'Timeline preview is limited to the first 120 pulses.' : ''}</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(34px,1fr))', gap:4 }}>
                {l3PulseMap.map((item)=>(
                  <div key={item.pulse} title={`Pattern pulse ${item.pulse}; cycle position ${item.cyclePosition}${item.inGap?' · silence gap':''}${item.cyclePosition===Math.round(landingPulse+1)?' · selected landing target':''}`} style={{ minHeight:34, borderRadius:4, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', border:`1px solid ${item.cyclePosition===Math.round(landingPulse+1)?'var(--gold)':item.cyclePosition===1?'var(--accent)':item.inGap?'var(--border)':'var(--teal)'}`, background:item.cyclePosition===Math.round(landingPulse+1)?'rgba(245,158,11,0.18)':item.cyclePosition===1?'var(--accent-dim)':item.inGap?'rgba(148,163,184,0.22)':item.repetition===2?'rgba(20,150,135,0.18)':item.repetition===3?'rgba(20,150,135,0.28)':'rgba(20,150,135,0.10)', color:item.cyclePosition===1?'var(--accent)':'var(--text)', fontSize:'0.68rem', opacity:item.inGap?0.65:1 }}>
                    <b>{item.pulse}</b><span style={{ fontSize:'0.58rem' }}>{item.cyclePosition===1?'SAM':item.cyclePosition===Math.round(landingPulse+1)?'LAND':item.inGap?'gap':`c${item.cyclePosition}`}</span>
                  </div>
                ))}
              </div>
              {phraseTotal > 0 && <div style={{ display:'flex', gap:12, flexWrap:'wrap', fontSize:'0.72rem', color:'var(--text-muted)', marginTop:8 }}><span>■ SAM / cycle start</span><span>■ Phrase pulse</span><span>■ Silence gap</span></div>}
            </div>

            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:'var(--space-3)' }}>
              <button onClick={checkL3} style={{ padding:'8px 18px', borderRadius:'var(--radius-sm)', fontWeight:700, fontSize:'0.88rem', background:'var(--accent-dim)', border:'1px solid var(--accent)', color:'var(--accent)', cursor:'pointer' }}>Check cycle alignment</button>
              <button disabled={phraseTotal<=0 || suggestedGap===null || suggestedGap>16} onClick={()=>{ if(suggestedGap!==null && suggestedGap<=16){setL3Gap(suggestedGap);setL3Status(`Suggested gap applied: ${suggestedGap} pulse(s) between repetitions. Total = ${phraseTotal*3} + ${suggestedGap} × 2 = ${l3Pulses} pulses, one cycle. This is mathematical alignment; confirm Eduppu and traditional phrase structure.`) } }} style={{ padding:'8px 18px', borderRadius:'var(--radius-sm)', fontWeight:700, fontSize:'0.88rem', background:'var(--surface2)', border:'1px solid var(--border)', color:'var(--text)', cursor:phraseTotal>0 && suggestedGap!==null && suggestedGap<=16?'pointer':'not-allowed', opacity:phraseTotal>0 && suggestedGap!==null && suggestedGap<=16?1:0.5 }}>Suggest Gap{suggestedGap!==null && suggestedGap<=16 && phraseTotal>0 ? ` (${suggestedGap})` : ''}</button>
            </div>
            {l3Status && <div style={{ padding:'var(--space-3)', borderRadius:'var(--radius-sm)', background: korvaiTotal > 0 && korvaiTotal % l3Pulses === 0 ? 'rgba(74,222,128,0.1)':'rgba(248,113,113,0.1)', border:`1px solid ${korvaiTotal > 0 && korvaiTotal % l3Pulses === 0 ? 'var(--green)':'var(--red)'}`, fontSize:'0.85rem', color:'var(--text)' }}>{l3Status}</div>}
            <p style={{ fontSize:'0.75rem', lineHeight:1.5, color:'var(--text-muted)', marginTop:'var(--space-3)' }}><b>Important:</b> Cycle alignment means the total pulse count is a whole number of cycles when starting at Sam. Traditional korvai correctness may also depend on Eduppu, phrase design, and the intended final landing. Jathi spellings are illustrative options and may vary by bani, teacher, and performance tradition. This screen does not yet verify those musical details or play the constructed phrase.</p>
          </div>
        )}
      </div>
    </div>
  )
}
