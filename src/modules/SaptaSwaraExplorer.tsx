import React, { useEffect, useMemo, useRef, useState } from 'react'
import { getAudioContext, stopAllSynthNotes, synthNote } from '../audio/engine'
import { INSTRUMENTS } from '../data/instruments'
import library from '../data/swara-devatas-and-metaphysics-library.json'
import { TONIC_OPTIONS } from '../data/tonics'
import { ALL_SVARA_IDS, SVARA_REGISTRY, resolveSvaraPitch, type SvaraFamily, type SvaraId, type TuningPolicy } from '../music/svaraMapping'
import { useAppStore } from '../store/useAppStore'
import type { InstrumentId } from '../types/index'

type Props = { onClose: () => void }
const swaras = library.sapta_swara_metaphysics
const letters = ['S', 'R', 'G', 'M', 'P', 'D', 'N']
const DEFAULT_VARIANTS: Record<SvaraFamily, SvaraId> = {
  S: 'S', R: 'R2', G: 'G3', M: 'M1', P: 'P', D: 'D2', N: 'N3',
}
const MELODY_INSTRUMENTS = INSTRUMENTS.filter((instrument) => instrument.category === 'melodic')

export default function SaptaSwaraExplorer({ onClose }: Props) {
  const [selectedCode, setSelectedCode] = useState('S')
  const [variants, setVariants] = useState(DEFAULT_VARIANTS)
  const appSettings = useAppStore((state) => state.settings)
  const [tonicHz, setTonicHz] = useState(appSettings.tonicHz)
  const [instrument, setInstrument] = useState<InstrumentId>(appSettings.instrument)
  const [tuning, setTuning] = useState<TuningPolicy>('just_intonation')
  const [octave, setOctave] = useState<-1 | 0 | 1>(0)
  const [volume, setVolume] = useState(Math.min(appSettings.volume, 0.35))
  const [audioStatus, setAudioStatus] = useState('')
  const audioTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [mode, setMode] = useState<'explore' | 'challenge'>('explore')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answer, setAnswer] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)
  const [score, setScore] = useState(0)
  const selected = swaras.find((item) => item.swara_code === selectedCode) ?? swaras[0]
  const selectedFamily = selectedCode as SvaraFamily
  const selectedSvara = variants[selectedFamily]
  const selectedVariants = ALL_SVARA_IDS.filter((id) => SVARA_REGISTRY[id].family === selectedFamily)
  const scaleSwaras = [
    variants.S, variants.R, variants.G, variants.M, variants.P, variants.D, variants.N,
  ]
  const selectedPitch = resolveSvaraPitch({
    svaraId: selectedSvara,
    tonicHz,
    octave,
    tuningPolicy: tuning,
  })
  const questions = useMemo(() => [
    { prompt: 'Which swara is described as the fundamental tonic anchor of all music?', correct: 'S', detail: 'Ṣaḍja (Sa) is described in this library as the fundamental tonic anchor.' },
    { prompt: 'Which swara is associated with the animal analogy of the goat or ram?', correct: 'G', detail: 'The Gandhāra entry records a goat or ram analogy.' },
    { prompt: 'Which swara is described as the fifth note and an invariant consonant to Ṣaḍja?', correct: 'P', detail: 'Pañcama (Pa) is described as the fifth note and a stable consonant to Ṣaḍja.' },
    { prompt: 'Which swara entry mentions the elephant in its animal analogy?', correct: 'N', detail: 'The Niṣāda entry mentions Gaja (elephant).' },
  ], [])
  const question = questions[questionIndex]

  function checkAnswer() {
    if (answer === null || checked) return
    if (answer === question.correct) setScore((value) => value + 1)
    setChecked(true)
  }
  function nextQuestion() {
    setQuestionIndex((value) => (value + 1) % questions.length)
    setAnswer(null)
    setChecked(false)
  }

  function stopAudio() {
    if (audioTimer.current) clearTimeout(audioTimer.current)
    audioTimer.current = null
    stopAllSynthNotes()
    setAudioStatus('Playback stopped.')
  }

  async function playNotes(notes: Array<{ svaraId: SvaraId; octave: -1 | 0 | 1 | 2 }>, label: string) {
    stopAudio()
    try {
      const context = getAudioContext()
      if (context.state === 'suspended') await context.resume()
      if (context.state !== 'running') throw new Error('Audio is not available. Check browser audio permissions.')
      const startAt = context.currentTime + 0.06
      const spacing = 0.72
      const duration = 0.62
      notes.forEach(({ svaraId, octave: noteOctave }, index) => {
        const pitch = resolveSvaraPitch({ svaraId, tonicHz, octave: noteOctave, tuningPolicy: tuning })
        synthNote(pitch.frequencyHz, duration, instrument, volume, startAt + index * spacing)
      })
      setAudioStatus(`Playing ${label} · ${TONIC_OPTIONS.find((option) => option.hz === tonicHz)?.label ?? `${tonicHz.toFixed(1)} Hz`} Sa · ${tuning === 'just_intonation' ? 'just-intonation reference ratios' : '12-tone equal temperament'}. Synthesized guide, not a recording.`)
      audioTimer.current = setTimeout(() => {
        audioTimer.current = null
        setAudioStatus(`Finished ${label}. Synthesized pitch guide; not an authentic performance.`)
      }, notes.length * spacing * 1000)
    } catch (error) {
      setAudioStatus(error instanceof Error ? error.message : String(error))
    }
  }

  useEffect(() => () => {
    if (audioTimer.current) clearTimeout(audioTimer.current)
    stopAllSynthNotes()
  }, [])

  return <section className="swx-panel" aria-labelledby="swx-title">
    <style>{`
      .swx-panel{--swx-ink:#22362f;--swx-muted:#66746d;color:var(--swx-ink);background:linear-gradient(145deg,#fbf5e9,#efe3cf);border:1px solid #d8c7a8;border-radius:24px;overflow:hidden;box-shadow:0 18px 44px #203d3018}.swx-panel *{box-sizing:border-box}.swx-hero{padding:clamp(20px,4vw,36px);background:radial-gradient(circle at 80% 20%,#c2a35b44,transparent 35%),linear-gradient(120deg,#123f38,#1a6154);color:#fff4dd;position:relative}.swx-kicker{font-size:.7rem;letter-spacing:.17em;text-transform:uppercase;color:#e0c58b;font-weight:800}.swx-hero h2{font:700 clamp(1.8rem,4vw,2.7rem)/1.08 Georgia,serif;margin:9px 0}.swx-hero p{margin:0;max-width:650px;line-height:1.6;color:#e5eee7}.swx-close{position:absolute;right:16px;top:16px;border:1px solid #ffffff55;background:#ffffff12;color:#fff;padding:9px 13px;border-radius:999px;cursor:pointer}.swx-tabs{display:flex;gap:8px;overflow-x:auto;padding:14px 16px;background:#e8dcc7;border-bottom:1px solid #d5c3a2}.swx-tabs button,.swx-action,.swx-choice{font:inherit;cursor:pointer;border-radius:999px;border:1px solid #cbb996;background:#fffaf0;color:#28423b;padding:10px 14px;white-space:nowrap}.swx-tabs button[aria-selected=true],.swx-choice[aria-pressed=true]{background:#17675a;color:#fff;border-color:#17675a}.swx-content{padding:clamp(16px,3vw,28px)}.swx-content h3{font:700 clamp(1.25rem,2.5vw,1.7rem)/1.2 Georgia,serif;margin:0 0 8px}.swx-content p{line-height:1.65;color:var(--swx-muted);margin:8px 0}.swx-note-row{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px;margin:16px 0 20px}.swx-note{min-width:0;min-height:78px;border:1px solid #d8c5a2;border-radius:15px;background:#fffaf0;color:#28534a;cursor:pointer;font:700 1.5rem Georgia,serif;transition:transform .18s ease,background .18s ease}.swx-note small{display:block;font:700 .68rem system-ui,sans-serif;margin-top:5px;color:#8d7448}.swx-note[aria-pressed=true]{background:#17675a;color:#fff;border-color:#17675a;box-shadow:0 6px 16px #17675a2b;transform:translateY(-3px)}.swx-note[aria-pressed=true] small{color:#f0dba7}.swx-profile{display:grid;grid-template-columns:minmax(0,.7fr) minmax(0,1.3fr);gap:18px}.swx-profile-lead{padding:20px;border-radius:18px;background:linear-gradient(150deg,#fffaf0,#e8d9bd);border:1px solid #dfceb0}.swx-big-note{font:700 clamp(3rem,8vw,5rem)/1 Georgia,serif;color:#137366}.swx-profile-lead h3{margin-top:12px}.swx-profile-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.swx-fact{padding:13px;border-radius:14px;background:#fffaf0;border:1px solid #e0d0b4;min-width:0}.swx-fact span{display:block;font-size:.68rem;text-transform:uppercase;letter-spacing:.08em;font-weight:800;color:#99763a;margin-bottom:5px}.swx-fact strong{font-size:.92rem;line-height:1.45;overflow-wrap:anywhere}.swx-wide{grid-column:1/-1}.swx-source-note{font-size:.8rem!important;border-top:1px solid #dfd0b3;padding-top:12px;margin-top:20px!important}.swx-quiz{padding:18px;border:1px solid #dfceb0;border-radius:18px;background:#fffaf0}.swx-options{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px;margin:16px 0}.swx-choice{border-radius:14px;min-height:54px}.swx-choice[aria-pressed=true]{box-shadow:0 0 0 2px #17675a22}.swx-feedback{padding:13px 15px;border-radius:14px;background:#e5f0e6;color:#24543c;line-height:1.5}.swx-feedback.bad{background:#f8e8da;color:#834b22}.swx-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}.swx-action.primary{background:#b47b2a;border-color:#b47b2a;color:#fff}.swx-action:disabled{opacity:.5;cursor:not-allowed}.swx-score{font-weight:800;color:#17675a}
      .swx-tabs button{flex:0 0 auto;min-height:42px}
      .swx-audio{padding:16px;margin:0 0 20px;border:1px solid #d8c7a8;border-radius:18px;background:#fffaf0}.swx-audio h3{margin:0 0 6px}.swx-audio-controls{display:flex;gap:10px;flex-wrap:wrap;align-items:end;margin:12px 0}.swx-audio-controls label{display:grid;gap:5px;font-size:.74rem;font-weight:700;color:#66746d}.swx-audio-controls select,.swx-audio-controls input{min-height:38px;max-width:100%;padding:7px 9px;border:1px solid #cbb996;border-radius:9px;background:#fff;color:#28423b;font:inherit}.swx-audio-controls input[type=range]{padding:0;accent-color:#17675a}.swx-variants{display:flex;gap:7px;flex-wrap:wrap;margin:10px 0}.swx-variant{border:1px solid #cbb996;border-radius:999px;background:#fff;color:#28423b;padding:8px 11px;cursor:pointer;font:inherit;font-size:.82rem}.swx-variant[aria-pressed=true]{background:#17675a;color:#fff;border-color:#17675a}.swx-variant-note{font-size:.76rem!important}.swx-audio-buttons{display:flex;gap:8px;flex-wrap:wrap}.swx-audio-status{min-height:1.5em;margin:10px 0 0!important;font-size:.8rem!important}.swx-fact em{display:block;color:#66746d;font-size:.78rem;line-height:1.5;margin-top:5px;font-style:normal}.swx-source-note{grid-column:1/-1}
      @media(max-width:680px){.swx-hero{padding:18px 16px}.swx-close{position:static;float:none;margin:0 0 14px}.swx-tabs{gap:7px;padding:10px;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch}.swx-tabs button{scroll-snap-align:start;padding:9px 12px;font-size:.88rem}.swx-content{padding:16px 12px}.swx-note-row{grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.swx-profile{grid-template-columns:1fr}.swx-profile-grid{grid-template-columns:1fr 1fr;gap:8px}.swx-options{grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.swx-note{min-height:68px}.swx-quiz{padding:14px}.swx-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}.swx-action{white-space:normal}}
      @media(prefers-reduced-motion:reduce){.swx-panel *{transition:none!important;animation:none!important}}
    `}</style>
    <header className="swx-hero"><button type="button" className="swx-close" onClick={onClose}>← Back to Nāda Wisdom</button><div className="swx-kicker">Nāda Wisdom · Interactive explorer</div><h2 id="swx-title">Meet the Sapta Swaras</h2><p>Choose one of the seven notes to explore its traditional meanings and associations.</p></header>
    <div className="swx-tabs" role="tablist" aria-label="Sapta Swara modes"><button role="tab" aria-selected={mode==='explore'} onClick={()=>setMode('explore')}>Explore the notes</button><button role="tab" aria-selected={mode==='challenge'} onClick={()=>setMode('challenge')}>Test yourself</button></div>
    <div className="swx-content">
      {mode==='explore' ? <>
        <h3>Select a swara</h3><p>Tap a note to open its learning profile.</p>
        <div className="swx-note-row">{swaras.map((item,i)=><button className="swx-note" key={item.swara_code} aria-pressed={selectedCode===item.swara_code} onClick={()=>setSelectedCode(item.swara_code)}>{letters[i]}<small>{item.swara_short_name}</small></button>)}</div>
        <section className="swx-audio" aria-label="Swara listening controls">
          <h3>Listen and compare</h3>
          <p>Choose the svarasthāna variant, register, tuning, and synthesized instrument. Frequencies are relative to your selected Sa.</p>
          <div className="swx-audio-controls">
            <label>Sa / tonic<select value={tonicHz} onChange={(event) => setTonicHz(Number(event.target.value))}>{TONIC_OPTIONS.map((option) => <option key={option.hz} value={option.hz}>{option.label}</option>)}</select></label>
            <label>Instrument<select value={instrument} onChange={(event) => setInstrument(event.target.value as InstrumentId)}>{MELODY_INSTRUMENTS.map((option) => <option key={option.id} value={option.id}>{option.icon} {option.label}</option>)}</select></label>
            <label>Tuning<select value={tuning} onChange={(event) => setTuning(event.target.value as TuningPolicy)}><option value="just_intonation">Just-intonation reference ratios</option><option value="equal_temperament">12-tone equal temperament</option></select></label>
            <label>Register<select value={octave} onChange={(event) => setOctave(Number(event.target.value) as -1 | 0 | 1)}><option value={-1}>Mandra (lower)</option><option value={0}>Madhya (middle)</option><option value={1}>Tāra (upper)</option></select></label>
            <label>Volume<input aria-label="Swara playback volume" type="range" min="0" max="0.8" step="0.05" value={volume} onChange={(event) => setVolume(Number(event.target.value))}/></label>
          </div>
          {selectedVariants.length > 1 ? <>
            <strong>Choose {selectedCode} svarasthāna</strong>
            <div className="swx-variants">{selectedVariants.map((id) => <button type="button" className="swx-variant" key={id} aria-pressed={selectedSvara === id} onClick={() => setVariants((current) => ({ ...current, [selectedFamily]: id }))}>{SVARA_REGISTRY[id].displayNotation} · {SVARA_REGISTRY[id].traditionalName}</button>)}</div>
          </> : <p className="swx-variant-note">This swara has one fixed svarasthāna; it does not have alternate variants.</p>}
          <p className="swx-variant-note">Selected pitch: {SVARA_REGISTRY[selectedSvara].traditionalName} · {selectedPitch.frequencyHz.toFixed(2)} Hz · {selectedPitch.ratioMultiplier.toFixed(4)}× Sa · {selectedPitch.cents.toFixed(1)} cents</p>
          <div className="swx-audio-buttons">
            <button type="button" className="swx-action primary" onClick={() => void playNotes([{ svaraId: selectedSvara, octave }], SVARA_REGISTRY[selectedSvara].traditionalName)}>▶ Play selected swara</button>
            <button type="button" className="swx-action" onClick={() => void playNotes(scaleSwaras.map((svaraId) => ({ svaraId, octave })), 'Sapta swara scale')}>▶ Play seven swaras</button>
            <button type="button" className="swx-action" onClick={() => void playNotes([...scaleSwaras.map((svaraId) => ({ svaraId, octave })), { svaraId: 'S', octave: (octave + 1) as 0 | 1 | 2 }], 'ascending scale')}>↑ Ascending</button>
            <button type="button" className="swx-action" onClick={() => void playNotes([{ svaraId: 'S', octave: (octave + 1) as 0 | 1 | 2 }, ...scaleSwaras.slice().reverse().map((svaraId) => ({ svaraId, octave }))], 'descending scale')}>↓ Descending</button>
            <button type="button" className="swx-action" onClick={stopAudio}>■ Stop</button>
          </div>
          <p className="swx-audio-status" aria-live="polite">{audioStatus || 'Audio is synthesized pitch guidance, not a recording or authentic vocal/instrument performance.'}</p>
        </section>
        <div className="swx-profile"><article className="swx-profile-lead"><div className="swx-kicker">Swara {selected.swara_index} of 7 · traditional profile</div><div className="swx-big-note">{selected.swara_code}</div><h3>{selected.swara_short_name}</h3><p>{selected.full_sanskrit_name}</p><p>{selected.meaning_and_etymology}</p><div className="swx-fact"><span>Selected svarasthāna</span><strong>{SVARA_REGISTRY[selectedSvara].displayNotation} · {SVARA_REGISTRY[selectedSvara].traditionalName}</strong></div></article><div className="swx-profile-grid">
          <div className="swx-fact"><span>Animal / bird analogy</span><strong>{selected.animal_bird_analogy.primary_animal}</strong><em>{selected.animal_bird_analogy.sound_description}</em><em>Text reference: {selected.animal_bird_analogy.sanskrit_text_ref}</em></div>
          <div className="swx-fact"><span>Presiding deities</span><strong>{selected.presiding_deity.primary_devata}</strong><em>Also associated with: {selected.presiding_deity.secondary_devata}</em><em>{selected.presiding_deity.iconographic_significance}</em></div>
          <div className="swx-fact"><span>Seer / ṛṣi</span><strong>{selected.seer_rishi}</strong></div>
          <div className="swx-fact"><span>Traditional varṇa</span><strong>{selected.varna_caste}</strong></div>
          <div className="swx-fact"><span>Colour association</span><strong>{selected.color_varna}</strong></div>
          <div className="swx-fact"><span>Chhandas / metre</span><strong>{selected.chhandas_metre}</strong></div>
          <div className="swx-fact"><span>Element association</span><strong>{selected.element_pancha_bhuta}</strong></div>
          <div className="swx-fact"><span>Body resonance / register</span><strong>{selected.body_resonance_register}</strong></div>
          <div className="swx-fact"><span>Rasa associations</span><strong>{selected.aesthetic_rasa.join(' · ')}</strong></div>
          <div className="swx-fact"><span>Gotra / dynasty</span><strong>{selected.gotra_dynasty}</strong></div>
          <div className="swx-fact"><span>Planet associations</span><strong>{selected.governing_planet_graha}</strong></div>
          <div className="swx-fact"><span>Body tissues (dhātu)</span><strong>{selected.body_tissue_dhatu}</strong></div>
          <div className="swx-fact swx-wide"><span>Library citations</span><strong>{selected.scholarly_citations.join(' · ')}</strong></div>
          <p className="swx-source-note">These cultural and metaphysical associations are reproduced from the Nāda source library. Traditions and interpretations may differ; they are presented as attributed beliefs, not scientific claims about sound or the body.</p>
        </div></div>
      </> : <>
        <h3>Swara knowledge challenge</h3><p>Question {questionIndex+1} of {questions.length} · <span className="swx-score">Score: {score}</span></p><article className="swx-quiz"><h3>{question.prompt}</h3><div className="swx-options">{letters.map((letter)=>{const item=swaras.find((s)=>s.swara_code===letter);return <button className="swx-choice" key={letter} aria-pressed={answer===letter} onClick={()=>{setAnswer(letter);setChecked(false)}}>{letter}<small style={{display:'block',fontSize:'.68rem'}}>{item?.swara_short_name}</small></button>})}</div>{checked&&<div className={`swx-feedback ${answer===question.correct?'':'bad'}`} role="status"><strong>{answer===question.correct?'Correct!':'Not quite.'}</strong> {question.detail}</div>}<div className="swx-actions"><button className="swx-action primary" disabled={answer===null||checked} onClick={checkAnswer}>Check answer</button><button className="swx-action" onClick={nextQuestion}>{questionIndex===questions.length-1?'Start again':'Next question'} →</button></div></article>
      </>}
    </div>
  </section>
}
