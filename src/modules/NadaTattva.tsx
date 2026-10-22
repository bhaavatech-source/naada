import React, { useMemo, useState } from 'react'
import library from '../data/nada-philosophy-and-sound-metaphysics.json'

type Props = { onClose: () => void }
type NadaFramework = typeof library.nada_tattva_framework

const framework = library.nada_tattva_framework as NadaFramework
const divisions = framework.two_primary_divisions
const stages = framework.sarirotpatti_five_stages_of_nada
const sources = divisions.ahata_nada.five_sources_classification
const sthayis = framework.three_sthayis_and_body_registers

export default function NadaTattva({ onClose }: Props) {
  const [tab, setTab] = useState<'journey' | 'sound' | 'registers' | 'quiz'>('journey')
  const [stageIndex, setStageIndex] = useState(0)
  const [soundType, setSoundType] = useState<'ahata_nada' | 'anahata_nada'>('ahata_nada')
  const [sourceIndex, setSourceIndex] = useState(0)
  const [answer, setAnswer] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)

  const question = useMemo(() => ({
    prompt: 'Which classification describes audible sound produced by vibration or impact?',
    options: ['Anāhata Nāda', 'Āhata Nāda', 'Madhyama Sthāyī'],
    correct: 1,
    explanation: divisions.ahata_nada.description,
  }), [])

  return <section className="nw-panel" aria-labelledby="nw-tattva-title">
    <style>{`
      .nw-panel{--nw-ink:#21332f;--nw-muted:#66746e;--nw-gold:#b47b2a;color:var(--nw-ink);background:linear-gradient(145deg,#fbf5e9,#f0e5d1);border:1px solid #d7c6a7;border-radius:24px;overflow:hidden;box-shadow:0 18px 44px #203d3018}
      .nw-panel *{box-sizing:border-box}
      .nw-hero{padding:clamp(20px,4vw,36px);background:radial-gradient(circle at 82% 20%,#b6a16a33,transparent 35%),linear-gradient(120deg,#123f38,#1a6154);color:#fff4dd}
      .nw-kicker{font-size:.7rem;letter-spacing:.17em;text-transform:uppercase;color:#986b29;font-weight:800}
      .nw-hero .nw-kicker{color:#e0c58b}
      .nw-hero h2{font:700 clamp(1.8rem,4vw,2.7rem)/1.12 Georgia,serif;margin:9px 0}
      .nw-hero p{margin:0;max-width:650px;line-height:1.6;color:#e5eee7}
      .nw-close{display:block;margin-bottom:14px;border:1px solid #ffffff55;background:#ffffff12;color:#fff;padding:9px 13px;border-radius:999px;cursor:pointer;font:inherit}
      .nw-tabs{display:flex;gap:8px;overflow-x:auto;padding:14px 16px;background:#e8dcc7;border-bottom:1px solid #d5c3a2}
      .nw-tabs button,.nw-choice,.nw-answer,.nw-action{font:inherit;cursor:pointer;border-radius:999px;border:1px solid #cbb996;background:#fffaf0;color:#28423b;padding:10px 14px;white-space:nowrap}
      .nw-tabs button[aria-selected=true],.nw-choice[aria-pressed=true]{background:#17675a;color:#fff;border-color:#17675a}
      .nw-content{padding:clamp(16px,3vw,28px)}
      .nw-content h3{font:700 clamp(1.25rem,2.5vw,1.7rem)/1.2 Georgia,serif;margin:0 0 8px}
      .nw-content p{line-height:1.65;color:var(--nw-muted);margin:8px 0}
      .nw-chip-row{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}
      .nw-stage-track{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin:18px 0}
      .nw-stage{padding:12px 8px;min-height:76px;text-align:center;border:1px solid #d6c5a5;border-radius:14px;background:#fffaf0;color:#39524b;cursor:pointer;font:inherit}
      .nw-stage span{display:block;font-size:.72rem;color:#8b744b;margin-bottom:5px}
      .nw-stage[aria-current=step]{background:#17675a;color:white;border-color:#17675a}
      .nw-stage[aria-current=step] span{color:#e9d39d}
      .nw-feature-card{background:#fffaf0;border:1px solid #dfd0b3;border-radius:18px;padding:18px}
      .nw-source-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-top:16px}
      .nw-source{padding:14px 10px;border:1px solid #ddcba9;border-radius:15px;background:#fffaf0;cursor:pointer;text-align:left;min-width:0;font:inherit}
      .nw-source strong{display:block;color:#17675a;margin-bottom:5px}
      .nw-source small{color:#69776f;line-height:1.4;display:block}
      .nw-source[aria-pressed=true]{border-color:#17675a;box-shadow:0 0 0 2px #17675a22}
      .nw-quiz-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:16px 0}
      .nw-answer{white-space:normal;border-radius:14px;text-align:left;min-height:56px}
      .nw-answer[aria-pressed=true]{border-color:#17675a;box-shadow:0 0 0 2px #17675a22}
      .nw-feedback{border-radius:14px;padding:13px 15px;background:#e5f0e6;color:#24543c;line-height:1.5}
      .nw-feedback.bad{background:#f8e8da;color:#834b22}
      .nw-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}
      .nw-action{background:#b47b2a;border-color:#b47b2a;color:white}
      .nw-action.secondary{background:transparent;color:#28423b;border-color:#cbb996}
      .nw-action:disabled{opacity:.5;cursor:not-allowed}
      .nw-panel{width:100%;min-width:0}.nw-tabs button{flex:0 0 auto;min-height:42px}.nw-stage,.nw-source,.nw-feature-card{min-width:0;overflow-wrap:anywhere}
      @media(max-width:680px){.nw-hero{padding:18px 16px}.nw-close{position:static;float:none;margin:0 0 14px}.nw-tabs{gap:7px;padding:10px;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch}.nw-tabs button{scroll-snap-align:start;padding:9px 12px;font-size:.88rem}.nw-content{padding:16px 12px}.nw-stage-track{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.nw-stage{min-height:82px;padding:10px 7px}.nw-stage:last-child{grid-column:auto}.nw-source-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px}.nw-quiz-options{grid-template-columns:1fr}.nw-source{min-height:76px;padding:12px 10px}.nw-feature-card{padding:15px}.nw-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}.nw-action{white-space:normal}}
      @media(prefers-reduced-motion:reduce){.nw-panel *{scroll-behavior:auto!important;transition:none!important;animation:none!important}}
    `}</style>
    <header className="nw-hero"><button type="button" className="nw-close" onClick={onClose}>← Back to Nāda Wisdom</button><div className="nw-kicker">Nāda Wisdom · Interactive journey</div><h2 id="nw-tattva-title">The philosophy of sound</h2><p>Explore traditional ideas about sound through short guided discoveries and a quick knowledge check.</p></header>
    <div className="nw-tabs" role="tablist" aria-label="Nāda Tattva activities">
      {([['journey','Sound journey'],['sound','Two kinds of Nāda'],['registers','Sound & registers'],['quiz','Quick challenge']] as const).map(([id,label])=><button key={id} role="tab" aria-selected={tab===id} onClick={()=>setTab(id)}>{label}</button>)}
    </div>
    <div className="nw-content">
      {tab==='journey' && <>
        <h3>Follow the stages of sound</h3><p>Choose a stage to learn more about the journey of sound.</p>
        <div className="nw-stage-track">{stages.map((stage,i)=><button type="button" className="nw-stage" key={stage.stage} aria-current={stageIndex===i?'step':undefined} onClick={()=>setStageIndex(i)}><span>STAGE {stage.stage}</span><strong>{stage.name}</strong></button>)}</div>
        <article className="nw-feature-card"><div className="nw-kicker">Stage {stages[stageIndex].stage} · {stages[stageIndex].chakra}</div><h3>{stages[stageIndex].name}</h3><p>{stages[stageIndex].description}</p><p><strong>Element / principle:</strong> {stages[stageIndex].element}</p><div className="nw-actions"><button className="nw-action secondary" disabled={stageIndex===0} onClick={()=>setStageIndex(i=>Math.max(0,i-1))}>Previous</button><button className="nw-action" onClick={()=>setStageIndex(i=>(i+1)%stages.length)}>{stageIndex===stages.length-1?'Start again':'Next stage'} →</button></div></article>
      </>}
      {tab==='sound' && <>
        <h3>Explore two primary divisions</h3><p>Select a concept to learn about its meaning.</p>
        <div className="nw-chip-row"><button className="nw-choice" aria-pressed={soundType==='ahata_nada'} onClick={()=>setSoundType('ahata_nada')}>Āhata Nāda</button><button className="nw-choice" aria-pressed={soundType==='anahata_nada'} onClick={()=>setSoundType('anahata_nada')}>Anāhata Nāda</button></div>
        <article className="nw-feature-card">
  <div className="nw-kicker">{divisions[soundType].type}</div>
  <h3>{divisions[soundType].title}</h3>
  <p>{divisions[soundType].description}</p>
  <p>
    <strong>Audibility:</strong> {divisions[soundType].audibility}
  </p>
  {"metaphysical_significance" in divisions[soundType] && (
    <p>
      <strong>Significance:</strong>{" "}
      {String(divisions[soundType].metaphysical_significance)}
    </p>
  )}
</article>
        {soundType==='ahata_nada' && <><h3 style={{marginTop:22}}>Five sources of audible sound</h3><div className="nw-source-grid">{sources.map((source,i)=><button type="button" className="nw-source" key={source.category} aria-pressed={sourceIndex===i} onClick={()=>setSourceIndex(i)}><strong>{source.category}</strong><small>{source.meaning}</small></button>)}</div><article className="nw-feature-card" style={{marginTop:10}}><h3>{sources[sourceIndex].meaning}</h3><p>{sources[sourceIndex].description}</p></article></>}
      </>}
      {tab==='registers' && <><h3>Three sthāyis and body registers</h3><p>Select a register to explore its traditional description in the supplied data.</p><div className="nw-source-grid" style={{gridTemplateColumns:'repeat(3,minmax(0,1fr))'}}>{sthayis.map((item,i)=><button className="nw-source" key={item.sthayi} onClick={()=>setSourceIndex(i)} aria-pressed={sourceIndex===i}><strong>{item.sthayi}</strong><small>{item.octave}</small></button>)}</div><article className="nw-feature-card" style={{marginTop:12}}><h3>{sthayis[Math.min(sourceIndex,2)].sthayi}</h3><p><strong>Register:</strong> {sthayis[Math.min(sourceIndex,2)].body_register}</p><p><strong>Associated chakra:</strong> {sthayis[Math.min(sourceIndex,2)].associated_chakra}</p><p>{sthayis[Math.min(sourceIndex,2)].acoustic_quality}</p></article></>}
      {tab==='quiz' && <><h3>Quick knowledge challenge</h3><p>{question.prompt}</p><div className="nw-quiz-options">{question.options.map((option,i)=><button className="nw-answer" key={option} aria-pressed={answer===i} onClick={()=>{setAnswer(i);setChecked(false)}}>{option}</button>)}</div>{checked && <div className={`nw-feedback ${answer===question.correct?'':'bad'}`} role="status"><strong>{answer===question.correct?'Correct!':'Not quite.'}</strong> {question.explanation}</div>}<div className="nw-actions"><button className="nw-action" disabled={answer===null} onClick={()=>setChecked(true)}>Check answer</button><button className="nw-action secondary" onClick={()=>{setAnswer(null);setChecked(false)}}>Try again</button></div></>}
    </div>
  </section>
}
