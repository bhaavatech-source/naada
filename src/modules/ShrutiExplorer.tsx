import React, { useMemo, useState } from 'react'
import library from '../data/shruti-22-frequency-ratio-library.json'
import { TONIC_OPTIONS } from '../data/tonics'

type Shruti = {
  sruti_index: number
  sruti_name: string
  swarasthana_code: string
  swarasthana_name: string
  ratio_fraction: string
  ratio_decimal: number
  cents: number
  traditional_grāma: string
  classical_description: string
  primary_swara_mapping: string
}

type Props = { onClose: () => void }

export default function ShrutiExplorer({ onClose }: Props) {
  const entries = library.shrutis as Shruti[]
  const [selectedIndex, setSelectedIndex] = useState(1)
  const [tonic, setTonic] = useState(261.63)
  const [mode, setMode] = useState<'explore' | 'quiz'>('explore')
  const [choice, setChoice] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)
  const [score, setScore] = useState(0)
  const [questionIndex, setQuestionIndex] = useState(0)
  const selected = entries.find((entry) => entry.sruti_index === selectedIndex) || entries[0]

  const questions = useMemo(() => [
    { prompt: 'Which ratio represents the tonic?', answer: 1, detail: 'The tonic ratio is 1/1.' },
    { prompt: 'How many śrutis are there?', answer: 22, detail: 'There are 22 śrutis.' },
    { prompt: 'Which measure expresses a pitch interval?', answer: 3, detail: 'Cents express the logarithmic size of a pitch interval.' },
  ], [])
  const question = questions[questionIndex]

  function play(frequency: number) {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      const context = new AudioContextClass()
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      gain.gain.setValueAtTime(0.0001, context.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.75)
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start()
      oscillator.stop(context.currentTime + 0.8)
      oscillator.onended = () => context.close()
    } catch (error) {
      console.error('Audio playback unavailable', error)
    }
  }

  return <section className="nada-learning-panel" aria-labelledby="nl-title">
    <style>{`
      .nada-learning-panel{min-width:0;background:#fbf5e9;color:#263b34;border:1px solid #d8c7a8;border-radius:22px;overflow:hidden}
      .nl-hero{background:linear-gradient(120deg,#123f38,#1c6556);color:#fff4dd;padding:clamp(18px,4vw,28px)}
      .nl-hero h2{font:700 clamp(1.7rem,4vw,2.5rem)/1.12 Georgia,serif;margin:8px 0}
      .nl-hero p{line-height:1.6;max-width:720px;margin:8px 0 0}
      .nl-back,.nl-btn,.nl-tab{border:1px solid #cbb996;border-radius:999px;padding:10px 14px;background:#fffaf0;color:#23483f;cursor:pointer;font:inherit}
      .nl-tab[aria-pressed=true],.nl-btn.primary{background:#17675a;color:white;border-color:#17675a}
      .nl-body{padding:clamp(14px,3vw,26px)}
      .nl-controls{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:14px 0}
      .nl-controls button{flex:0 0 auto}
      .nl-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px}
      .nl-tile{min-width:0;border:1px solid #d8c5a2;border-radius:12px;padding:10px 4px;background:#fffaf0;cursor:pointer;color:#28483e;overflow-wrap:anywhere}
      .nl-tile[aria-pressed=true]{background:#17675a;color:white}
      .nl-tile strong,.nl-tile small{display:block}
      .nl-tile small{font-size:.7rem;margin-top:4px}
      .nl-profile{display:grid;grid-template-columns:minmax(0,.7fr) minmax(0,1.3fr);gap:14px;margin-top:16px}
      .nl-card{min-width:0;border:1px solid #e0d0b4;border-radius:16px;background:#fffaf0;padding:16px;overflow-wrap:anywhere}
      .nl-facts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
      .nl-fact small{display:block;text-transform:uppercase;letter-spacing:.07em;color:#99763a;font-weight:800;margin-bottom:5px}
      .nl-fact strong{line-height:1.45}
      .nl-note{color:#66746d;line-height:1.6}
      .nl-feedback{padding:12px;border-radius:12px;background:#e2efe4;margin-top:12px}
      .nl-input{padding:9px;border:1px solid #cbb996;border-radius:10px;background:#fffaf0;color:#23483f}
      @media(max-width:700px){
        .nl-hero{padding:18px 16px}
        .nl-back{margin-bottom:12px}
        .nl-body{padding:14px 12px}
        .nl-controls{align-items:stretch}
        .nl-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
        .nl-tile{min-height:64px}
        .nl-profile{grid-template-columns:1fr;gap:10px}
        .nl-facts{grid-template-columns:repeat(2,minmax(0,1fr))}
        .nl-input{min-width:0;max-width:100%}
      }
      @media(max-width:360px){.nl-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.nl-facts{grid-template-columns:1fr}}
    `}</style>
    <header className="nl-hero">
      <button type="button" className="nl-back" onClick={onClose}>← Back to Nāda Wisdom</button>
      <small>ŚRUTI · LISTEN &amp; DISCOVER</small>
      <h2 id="nl-title">Explore the 22 Śrutis</h2>
      <p>Choose a śruti to explore its name, pitch relationship and swara mapping. Play each pitch at your chosen tonic.</p>
    </header>
    <div className="nl-body">
      <div className="nl-controls" aria-label="Explorer controls">
        <button type="button" className="nl-tab" aria-pressed={mode === 'explore'} onClick={() => setMode('explore')}>Explore</button>
        <button type="button" className="nl-tab" aria-pressed={mode === 'quiz'} onClick={() => setMode('quiz')}>Knowledge check</button>
        <label className="nl-note">Tonic / Sa
          <select className="nl-input" value={tonic} onChange={(event) => setTonic(Number(event.target.value))}>
            {TONIC_OPTIONS.map((option) => <option key={option.hz} value={option.hz}>{option.label}</option>)}
          </select>
        </label>
      </div>
      {mode === 'explore' ? <>
        <div className="nl-grid" aria-label="Select a śruti">
          {entries.map((entry) => <button type="button" className="nl-tile" key={entry.sruti_index} aria-pressed={entry.sruti_index === selectedIndex} onClick={() => setSelectedIndex(entry.sruti_index)}>
            <strong>{String(entry.sruti_index).padStart(2, '0')}</strong><small>{entry.sruti_name}</small>
          </button>)}
        </div>
        <div className="nl-profile">
          <article className="nl-card">
            <small>ŚRUTI {selected.sruti_index} / 22</small>
            <h3>{selected.sruti_name}</h3>
            <p>{selected.swarasthana_name}</p>
            <button type="button" className="nl-btn primary" onClick={() => play(tonic * selected.ratio_decimal)}>▶ Play tone</button>
          </article>
          <div className="nl-card nl-facts">
            <div className="nl-fact"><small>Ratio</small><strong>{selected.ratio_fraction}</strong></div>
            <div className="nl-fact"><small>Cents</small><strong>{selected.cents.toFixed(2)}¢</strong></div>
            <div className="nl-fact"><small>Grāma</small><strong>{selected['traditional_grāma']}</strong></div>
            <div className="nl-fact"><small>Swara mapping</small><strong>{selected.primary_swara_mapping}</strong></div>
          </div>
        </div>
      </> : <article className="nl-card">
        <small>QUESTION {questionIndex + 1} / {questions.length} · SCORE {score}</small>
        <h3>{question.prompt}</h3>
        <div className="nl-controls">
          {(questionIndex === 0
            ? [{ label: '1/1', value: 1 }, { label: '9/8', value: 2 }, { label: '4/3', value: 3 }]
            : questionIndex === 1
              ? [{ label: '7', value: 7 }, { label: '16', value: 16 }, { label: '22', value: 22 }]
              : [{ label: 'Ratio', value: 1 }, { label: 'Cents', value: 3 }, { label: 'Seconds', value: 2 }]
          ).map((option) => <button type="button" key={option.label} className="nl-btn" aria-pressed={choice === option.value} onClick={() => { setChoice(option.value); setChecked(false) }}>{option.label}</button>)}
        </div>
        {checked && <div className="nl-feedback" role="status">{choice === question.answer ? 'Correct!' : 'Not quite.'} {question.detail}</div>}
        <div className="nl-controls">
          <button type="button" className="nl-btn primary" disabled={choice === null || checked} onClick={() => { setChecked(true); if (choice === question.answer) setScore((value) => value + 1) }}>Check answer</button>
          <button type="button" className="nl-btn" onClick={() => { setQuestionIndex((value) => (value + 1) % questions.length); setChoice(null); setChecked(false) }}>Next →</button>
        </div>
      </article>}
    </div>
  </section>
}
