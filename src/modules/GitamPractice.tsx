import React,{useEffect,useMemo,useState} from 'react'
import curriculum from '../data/giitams-master-curriculum-v1.json'
import { TONIC_OPTIONS } from '../data/tonics'
import { getAudioContext, semitonesToHz, stopAllSynthNotes, synthNote } from '../audio/engine'

type Line={line_number:number;solfa:string;swarasthana:string;vowels:string;semitones:number[];sahitya_syllables:string;sahitya_text:string}
type Section={title:string;lines:Line[]}
type Composition={id:string;title:string;type:string;composer:string;deity:string;language:string;raga:{name:string;parent_mela_name?:string;scale:{arohana:string;avarohana:string}};tala:{name:string;anga_structure:string;beats_per_avartana:number};sections:Record<string,Section>}
function notationTokens(value:string){return value.split(/\s+/).filter(t=>t && t!=='|' && t!=='||')}
export default function GitamPractice({onClose}:{onClose:()=>void}){
 const songs=curriculum.compositions as Composition[]
 const [songId,setSongId]=useState(songs[0]?.id||'')
 const song=songs.find(s=>s.id===songId)||songs[0]
 const sections=Object.entries(song.sections)
 const [sectionKey,setSectionKey]=useState(sections[0]?.[0]||'pallavi')
 const section=song.sections[sectionKey]||sections[0][1]
 const [lineIndex,setLineIndex]=useState(0)
 const line=section.lines[Math.min(lineIndex,section.lines.length-1)]
 const [show,setShow]=useState<'solfa'|'swarasthana'|'vowels'|'sahitya'>('solfa')
 const [completed,setCompleted]=useState<string[]>([])
 const [tempo,setTempo]=useState(80)
 const [tonicHz,setTonicHz]=useState(261.63)
 const [playback,setPlayback]=useState<'idle'|'playing'|'error'>('idle')
 const [message,setMessage]=useState('')
 const activeKey=`${song.id}:${sectionKey}:${lineIndex}`
 const progress=Math.round(completed.filter(x=>x.startsWith(song.id+':')).length/Math.max(1,Object.values(song.sections).reduce((n,s)=>n+s.lines.length,0))*100)
 const validation=useMemo(()=>{
   const tokens=notationTokens(line.swarasthana)
   const valid= line.semitones.length>0 && tokens.length===line.semitones.length && line.semitones.every(Number.isFinite) && line.semitones.every(n=>n>=-24&&n<=36)
   return {valid,tokenCount:tokens.length,noteCount:line.semitones.length}
 },[line])
 useEffect(()=>()=>{stopAllSynthNotes()},[])
 useEffect(()=>{setPlayback('idle');setMessage('');stopAllSynthNotes()},[songId,sectionKey,lineIndex])
 function playPhrase(){
   if(!validation.valid){setPlayback('error');setMessage(`Playback disabled: this phrase has ${validation.tokenCount} notation tokens but ${validation.noteCount} pitch values, or contains an invalid pitch. Please review the notation and pitch values.`);return}
   try{
     stopAllSynthNotes()
     const ctx=getAudioContext()
     if(ctx.state==='suspended') void ctx.resume()
     const beatSeconds=60/tempo
     const noteSeconds=beatSeconds/2
     const start=ctx.currentTime+0.06
     line.semitones.forEach((semi,i)=>{
       const hz=semitonesToHz(tonicHz,semi)
       synthNote(hz,noteSeconds*0.88,'veena',0.22,start+i*noteSeconds,ctx)
     })
     setPlayback('playing');setMessage('Playing a synthesized pitch guide. It does not include rāga-specific gamakas.')
     window.setTimeout(()=>{setPlayback(v=>v==='playing'?'idle':v)},Math.max(500,line.semitones.length*noteSeconds*1000+300))
   }catch(e){console.error('Gītam playback failed',e);setPlayback('error');setMessage('Playback could not start. Check browser audio permission and try clicking Play again.')}
 }
 function stopPhrase(){stopAllSynthNotes();setPlayback('idle');setMessage('Playback stopped.')}
 return <section className="nada-learning-panel"><style>{`.gp-hero{background:linear-gradient(120deg,#123f38,#1c6556);color:#fff4dd;padding:24px}.gp-hero h2{font:700 clamp(1.7rem,4vw,2.5rem) Georgia,serif;margin:8px 0}.gp-hero p{line-height:1.6}.gp-back,.gp-btn,.gp-tab{border:1px solid #cbb996;border-radius:999px;padding:10px 14px;background:#fffaf0;color:#23483f;cursor:pointer;font:inherit}.gp-back{display:inline-flex;margin-bottom:12px}.gp-btn.primary,.gp-tab[aria-pressed=true]{background:#17675a;color:white}.gp-btn:disabled{opacity:.45;cursor:not-allowed}.gp-body{padding:clamp(14px,3vw,26px)}.gp-toolbar{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.gp-select,.gp-range,.gp-number{padding:10px;border:1px solid #cbb996;border-radius:10px;max-width:100%}.gp-layout{display:grid;grid-template-columns:minmax(0,.7fr) minmax(0,1.3fr);gap:14px}.gp-card{background:#fffaf0;border:1px solid #dfceb0;border-radius:16px;padding:16px;min-width:0}.gp-line{font:700 clamp(1.2rem,3vw,1.8rem) Georgia,serif;line-height:1.8;white-space:pre-wrap;overflow-wrap:anywhere}.gp-meta{color:#6d786f;line-height:1.6}.gp-progress{height:8px;border-radius:999px;background:#e7dcc7;overflow:hidden}.gp-progress span{display:block;height:100%;background:#178574}.gp-note{color:#69756c;line-height:1.6}.gp-status{padding:10px 12px;border-radius:10px;background:#e6eee5;color:#23483f;margin:10px 0}.gp-status.error{background:#f8e4dd;color:#7a2e21}@media(max-width:680px){.gp-body{padding:14px 12px}.gp-layout{grid-template-columns:1fr}}`}</style><header className="gp-hero"><button className="gp-back" onClick={onClose}>← Back</button><small>GĪTAM PRACTICE · LEARN PHRASE BY PHRASE</small><h2>Practise a Gītam</h2><p>Choose one of the 22 available compositions. Playback is a synthesized pitch guide and is enabled only when the phrase's notation-token and pitch counts agree.</p></header><div className="gp-body"><div className="gp-toolbar"><select className="gp-select" value={songId} onChange={e=>{setSongId(e.target.value);setSectionKey('pallavi');setLineIndex(0)}} aria-label="Choose gītam">{songs.map(s=><option key={s.id} value={s.id}>{s.title}</option>)}</select><label className="gp-meta">Tempo <input className="gp-range" type="range" min="40" max="160" value={tempo} onChange={e=>setTempo(Number(e.target.value))}/> {tempo} BPM</label><label className="gp-meta">Tonic / Sa <select className="gp-select" value={tonicHz} onChange={e=>setTonicHz(Number(e.target.value))}>{TONIC_OPTIONS.map(option=><option key={option.hz} value={option.hz}>{option.label}</option>)}</select></label></div><div className="gp-layout"><aside className="gp-card"><small>COMPOSITION</small><h3>{song.title}</h3><p className="gp-meta">{song.type} · {song.composer}</p><p><strong>Rāga:</strong> {song.raga.name}</p><p><strong>Tāla:</strong> {song.tala.name}</p><p className="gp-meta">{song.tala.anga_structure}</p><p className="gp-meta">Practice progress</p><div className="gp-progress"><span style={{width:`${Math.min(100,progress)}%`}}/></div><p className="gp-meta">{Math.min(100,progress)}% of phrases marked practised</p></aside><article className="gp-card"><div className="gp-toolbar">{sections.map(([key,s])=><button className="gp-tab" key={key} aria-pressed={sectionKey===key} onClick={()=>{setSectionKey(key);setLineIndex(0)}}>{s.title}</button>)}</div><h3>{section.title} · Phrase {lineIndex+1} of {section.lines.length}</h3><div className="gp-line">{show==='solfa'?line.solfa:show==='swarasthana'?line.swarasthana:show==='vowels'?line.vowels:line.sahitya_syllables}</div><p><strong>{line.sahitya_text}</strong></p><div className="gp-toolbar">{(['solfa','swarasthana','vowels','sahitya'] as const).map(v=><button key={v} className="gp-tab" aria-pressed={show===v} onClick={()=>setShow(v)}>{v==='solfa'?'Solfa':v==='swarasthana'?'Swarasthāna':v==='vowels'?'Vowels':'Sāhitya'}</button>)}</div><p className="gp-note">The pitch guide is synthesized and does not reproduce rāga-specific gamakas.</p>{!validation.valid&&<div className="gp-status error">Playback disabled for this phrase: {validation.tokenCount} notation tokens, {validation.noteCount} pitch values.</div>}{message&&<div className={`gp-status ${playback==='error'?'error':''}`} role="status">{message}</div>}<div className="gp-toolbar"><button className="gp-btn primary" onClick={playPhrase} disabled={!validation.valid||playback==='playing'}>▶ Play phrase</button><button className="gp-btn" onClick={stopPhrase} disabled={playback!=='playing'}>■ Stop</button><button className="gp-btn" onClick={()=>setCompleted(prev=>prev.includes(activeKey)?prev:[...prev,activeKey])}>✓ Mark practised</button><button className="gp-btn" onClick={()=>setLineIndex(v=>Math.max(0,v-1))} disabled={lineIndex===0}>← Previous</button><button className="gp-btn" onClick={()=>setLineIndex(v=>Math.min(section.lines.length-1,v+1))} disabled={lineIndex===section.lines.length-1}>Next →</button></div></article></div></div></section>
}
