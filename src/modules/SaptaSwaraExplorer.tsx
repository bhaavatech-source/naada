import React, { useMemo, useState } from 'react'
import library from '../data/swara-devatas-and-metaphysics-library.json'

type Props = { onClose: () => void }
const swaras = library.sapta_swara_metaphysics
const letters = ['S', 'R', 'G', 'M', 'P', 'D', 'N']

export default function SaptaSwaraExplorer({ onClose }: Props) {
  const [selectedCode, setSelectedCode] = useState('S')
  const [mode, setMode] = useState<'explore' | 'challenge'>('explore')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answer, setAnswer] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)
  const [score, setScore] = useState(0)
  const selected = swaras.find((item) => item.swara_code === selectedCode) ?? swaras[0]
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

  return <section className="swx-panel" aria-labelledby="swx-title">
    <style>{`
      .swx-panel{--swx-ink:#22362f;--swx-muted:#66746d;color:var(--swx-ink);background:linear-gradient(145deg,#fbf5e9,#efe3cf);border:1px solid #d8c7a8;border-radius:24px;overflow:hidden;box-shadow:0 18px 44px #203d3018}.swx-panel *{box-sizing:border-box}.swx-hero{padding:clamp(20px,4vw,36px);background:radial-gradient(circle at 80% 20%,#c2a35b44,transparent 35%),linear-gradient(120deg,#123f38,#1a6154);color:#fff4dd;position:relative}.swx-kicker{font-size:.7rem;letter-spacing:.17em;text-transform:uppercase;color:#e0c58b;font-weight:800}.swx-hero h2{font:700 clamp(1.8rem,4vw,2.7rem)/1.08 Georgia,serif;margin:9px 0}.swx-hero p{margin:0;max-width:650px;line-height:1.6;color:#e5eee7}.swx-close{position:absolute;right:16px;top:16px;border:1px solid #ffffff55;background:#ffffff12;color:#fff;padding:9px 13px;border-radius:999px;cursor:pointer}.swx-tabs{display:flex;gap:8px;overflow-x:auto;padding:14px 16px;background:#e8dcc7;border-bottom:1px solid #d5c3a2}.swx-tabs button,.swx-action,.swx-choice{font:inherit;cursor:pointer;border-radius:999px;border:1px solid #cbb996;background:#fffaf0;color:#28423b;padding:10px 14px;white-space:nowrap}.swx-tabs button[aria-selected=true],.swx-choice[aria-pressed=true]{background:#17675a;color:#fff;border-color:#17675a}.swx-content{padding:clamp(16px,3vw,28px)}.swx-content h3{font:700 clamp(1.25rem,2.5vw,1.7rem)/1.2 Georgia,serif;margin:0 0 8px}.swx-content p{line-height:1.65;color:var(--swx-muted);margin:8px 0}.swx-note-row{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px;margin:16px 0 20px}.swx-note{min-width:0;min-height:78px;border:1px solid #d8c5a2;border-radius:15px;background:#fffaf0;color:#28534a;cursor:pointer;font:700 1.5rem Georgia,serif;transition:transform .18s ease,background .18s ease}.swx-note small{display:block;font:700 .68rem system-ui,sans-serif;margin-top:5px;color:#8d7448}.swx-note[aria-pressed=true]{background:#17675a;color:#fff;border-color:#17675a;box-shadow:0 6px 16px #17675a2b;transform:translateY(-3px)}.swx-note[aria-pressed=true] small{color:#f0dba7}.swx-profile{display:grid;grid-template-columns:minmax(0,.7fr) minmax(0,1.3fr);gap:18px}.swx-profile-lead{padding:20px;border-radius:18px;background:linear-gradient(150deg,#fffaf0,#e8d9bd);border:1px solid #dfceb0}.swx-big-note{font:700 clamp(3rem,8vw,5rem)/1 Georgia,serif;color:#137366}.swx-profile-lead h3{margin-top:12px}.swx-profile-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.swx-fact{padding:13px;border-radius:14px;background:#fffaf0;border:1px solid #e0d0b4;min-width:0}.swx-fact span{display:block;font-size:.68rem;text-transform:uppercase;letter-spacing:.08em;font-weight:800;color:#99763a;margin-bottom:5px}.swx-fact strong{font-size:.92rem;line-height:1.45;overflow-wrap:anywhere}.swx-wide{grid-column:1/-1}.swx-source-note{font-size:.8rem!important;border-top:1px solid #dfd0b3;padding-top:12px;margin-top:20px!important}.swx-quiz{padding:18px;border:1px solid #dfceb0;border-radius:18px;background:#fffaf0}.swx-options{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px;margin:16px 0}.swx-choice{border-radius:14px;min-height:54px}.swx-choice[aria-pressed=true]{box-shadow:0 0 0 2px #17675a22}.swx-feedback{padding:13px 15px;border-radius:14px;background:#e5f0e6;color:#24543c;line-height:1.5}.swx-feedback.bad{background:#f8e8da;color:#834b22}.swx-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}.swx-action.primary{background:#b47b2a;border-color:#b47b2a;color:#fff}.swx-action:disabled{opacity:.5;cursor:not-allowed}.swx-score{font-weight:800;color:#17675a}
      .swx-tabs button{flex:0 0 auto;min-height:42px}
      @media(max-width:680px){.swx-hero{padding:18px 16px}.swx-close{position:static;float:none;margin:0 0 14px}.swx-tabs{gap:7px;padding:10px;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch}.swx-tabs button{scroll-snap-align:start;padding:9px 12px;font-size:.88rem}.swx-content{padding:16px 12px}.swx-note-row{grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.swx-profile{grid-template-columns:1fr}.swx-profile-grid{grid-template-columns:1fr 1fr;gap:8px}.swx-options{grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.swx-note{min-height:68px}.swx-quiz{padding:14px}.swx-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}.swx-action{white-space:normal}}
      @media(prefers-reduced-motion:reduce){.swx-panel *{transition:none!important;animation:none!important}}
    `}</style>
    <header className="swx-hero"><button type="button" className="swx-close" onClick={onClose}>← Back to Nāda Wisdom</button><div className="swx-kicker">Nāda Wisdom · Interactive explorer</div><h2 id="swx-title">Meet the Sapta Swaras</h2><p>Choose one of the seven notes to explore its traditional meanings and associations.</p></header>
    <div className="swx-tabs" role="tablist" aria-label="Sapta Swara modes"><button role="tab" aria-selected={mode==='explore'} onClick={()=>setMode('explore')}>Explore the notes</button><button role="tab" aria-selected={mode==='challenge'} onClick={()=>setMode('challenge')}>Test yourself</button></div>
    <div className="swx-content">
      {mode==='explore' ? <>
        <h3>Select a swara</h3><p>Tap a note to open its learning profile.</p>
        <div className="swx-note-row">{swaras.map((item,i)=><button className="swx-note" key={item.swara_code} aria-pressed={selectedCode===item.swara_code} onClick={()=>setSelectedCode(item.swara_code)}>{letters[i]}<small>{item.swara_short_name}</small></button>)}</div>
        <div className="swx-profile"><article className="swx-profile-lead"><div className="swx-kicker">Swara {selected.swara_index} of 7</div><div className="swx-big-note">{selected.swara_code}</div><h3>{selected.swara_short_name}</h3><p>{selected.full_sanskrit_name}</p><p>{selected.meaning_and_etymology}</p></article><div className="swx-profile-grid"><div className="swx-fact"><span>Animal analogy</span><strong>{selected.animal_bird_analogy.primary_animal}</strong></div><div className="swx-fact"><span>Presiding deity</span><strong>{selected.presiding_deity.primary_devata}</strong></div><div className="swx-fact"><span>Rishi</span><strong>{selected.seer_rishi}</strong></div><div className="swx-fact"><span>Colour</span><strong>{selected.color_varna}</strong></div><div className="swx-fact"><span>Element</span><strong>{selected.element_pancha_bhuta}</strong></div><div className="swx-fact"><span>Rasa</span><strong>{selected.aesthetic_rasa.join(' · ')}</strong></div><div className="swx-fact swx-wide"><span>Traditional sound analogy</span><strong>{selected.animal_bird_analogy.sound_description}</strong></div></div></div>
      </> : <>
        <h3>Swara knowledge challenge</h3><p>Question {questionIndex+1} of {questions.length} · <span className="swx-score">Score: {score}</span></p><article className="swx-quiz"><h3>{question.prompt}</h3><div className="swx-options">{letters.map((letter)=>{const item=swaras.find((s)=>s.swara_code===letter);return <button className="swx-choice" key={letter} aria-pressed={answer===letter} onClick={()=>{setAnswer(letter);setChecked(false)}}>{letter}<small style={{display:'block',fontSize:'.68rem'}}>{item?.swara_short_name}</small></button>})}</div>{checked&&<div className={`swx-feedback ${answer===question.correct?'':'bad'}`} role="status"><strong>{answer===question.correct?'Correct!':'Not quite.'}</strong> {question.detail}</div>}<div className="swx-actions"><button className="swx-action primary" disabled={answer===null||checked} onClick={checkAnswer}>Check answer</button><button className="swx-action" onClick={nextQuestion}>{questionIndex===questions.length-1?'Start again':'Next question'} →</button></div></article>
      </>}
    </div>
  </section>
}
