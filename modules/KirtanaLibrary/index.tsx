import { useState } from 'react'
import { KIRTANAS } from '../../data/kirtanas'
import { useAppStore } from '../../store/useAppStore'
import { semitonesToHz, synthNote, NOTE_SEMITONES } from '../../audio/engine'
import { tokeniseNotation } from '../../audio/engine';  // add at the top


const COMPOSERS = [...new Set(KIRTANAS.map(k=>k.composer))]
const LANGUAGES = [...new Set(KIRTANAS.map(k=>k.language))]

export default function KirtanaLibrary() {
  const { settings } = useAppStore()
  const [search, setSearch] = useState('')
  const [composerFilter, setComposerFilter] = useState('')
  const [langFilter, setLangFilter] = useState('')
  const [selected, setSelected] = useState(KIRTANAS[0])
  const [expandLyrics, setExpandLyrics] = useState(false)

  const filtered = KIRTANAS.filter(k => {
    const q = search.toLowerCase()
    return (!q || k.name.toLowerCase().includes(q) || k.raga.toLowerCase().includes(q) || k.tala.toLowerCase().includes(q))
      && (!composerFilter || k.composer === composerFilter)
      && (!langFilter || k.language === langFilter)
  })

  const playNotation = (notation: string) => {
  const tokens = tokeniseNotation(notation)
    .filter(t => t && t !== '-');  // keep your dash filtering

  let delay = 0;
  tokens.forEach(token => {
    const semi = NOTE_SEMITONES[token.toUpperCase()] ?? 0;
    const hz = semitonesToHz(settings.tonicHz, semi);
    const beatDur = 60 / settings.bpm;
    setTimeout(
      () => synthNote(hz, beatDur * 0.85, settings.instrument, settings.volume),
      delay * 1000,
    );
    delay += beatDur;
  });
};

  return (
    <div style={{ display:'flex', height:'100%', overflow:'hidden' }}>
      {/* Left — list */}
      <div style={{ width:280, flexShrink:0, borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'var(--space-3)', borderBottom:'1px solid var(--border)', display:'flex', flexDirection:'column', gap:'var(--space-2)' }}>
          <input
            placeholder="Search kīrtana, rāga, tāla…"
            value={search} onChange={e=>setSearch(e.target.value)}
            style={{ width:'100%', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'6px 10px', fontSize:'0.8rem', color:'var(--text)' }}
          />
          <div style={{ display:'flex', gap:'var(--space-2)' }}>
            <select value={composerFilter} onChange={e=>setComposerFilter(e.target.value)}
              style={{ flex:1, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'4px 6px', fontSize:'0.72rem', color:'var(--text)' }}>
              <option value="">All Composers</option>
              {COMPOSERS.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
            <select value={langFilter} onChange={e=>setLangFilter(e.target.value)}
              style={{ flex:1, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'4px 6px', fontSize:'0.72rem', color:'var(--text)' }}>
              <option value="">All Languages</option>
              {LANGUAGES.map(l=><option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div style={{ fontSize:'0.65rem', color:'var(--text-faint)' }}>{filtered.length} of {KIRTANAS.length} kīrtanas</div>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'var(--space-2)' }}>
          {filtered.map(k=>(
            <button key={k.id} onClick={()=>setSelected(k)}
              style={{ width:'100%', textAlign:'left', padding:'8px var(--space-3)', borderRadius:'var(--radius-sm)', border:'none', cursor:'pointer', background: selected.id===k.id?'var(--accent-dim)':'transparent', marginBottom:1 }}>
              <div style={{ fontSize:'0.82rem', fontWeight:600, color: selected.id===k.id?'var(--accent)':'var(--text)' }}>{k.name}</div>
              <div style={{ fontSize:'0.65rem', color:'var(--text-muted)' }}>{k.composer} · {k.raga}</div>
              <div style={{ fontSize:'0.62rem', color:'var(--text-faint)' }}>{k.tala} · {k.language}{k.century?` · ${k.century}c`:''}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Right — detail */}
      <div style={{ flex:1, overflowY:'auto', padding:'var(--space-6)' }}>
        <div style={{ maxWidth:700 }}>
          {/* Title */}
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.8rem', color:'var(--accent)' }}>{selected.name}</h2>
          {selected.nameDevanagari && <div style={{ fontSize:'1rem', color:'var(--text-muted)', fontFamily:'var(--font-display)' }}>{selected.nameDevanagari}</div>}
          
          {/* Metadata pills */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:'var(--space-2)', marginTop:'var(--space-3)' }}>
            {[
              { label:'Composer', value: selected.composer },
              { label:'Rāga', value: selected.raga },
              { label:'Tāla', value: selected.tala },
              { label:'Language', value: selected.language },
              ...(selected.century ? [{ label:'Century', value: selected.century }] : []),
            ].map(item => (
              <div key={item.label} style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'4px 10px', fontSize:'0.75rem' }}>
                <span style={{ color:'var(--text-faint)' }}>{item.label}: </span>
                <span style={{ color:'var(--text)', fontWeight:500 }}>{item.value}</span>
              </div>
            ))}
          </div>

          {/* Description */}
          <p style={{ marginTop:'var(--space-4)', fontSize:'0.88rem', color:'var(--text-muted)', lineHeight:1.7 }}>{selected.description}</p>

          {/* Svara notation box */}
          <div style={{ marginTop:'var(--space-4)', background:'var(--surface)', borderRadius:'var(--radius)', border:'1px solid var(--border)', padding:'var(--space-4)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'var(--space-3)' }}>
              <h3 style={{ fontSize:'0.85rem', fontWeight:700, color:'var(--text)' }}>Svara Notation (Sanchāri)</h3>
              <button onClick={() => playNotation(selected.svaraNotation)}
                style={{ padding:'4px 14px', borderRadius:'var(--radius-sm)', fontSize:'0.78rem', fontWeight:600, background:'var(--accent-dim)', border:'1px solid var(--accent)', color:'var(--accent)', cursor:'pointer' }}>
                ▶ Play Notes
              </button>
            </div>
            <div style={{ fontFamily:'monospace', fontSize:'0.9rem', color:'var(--text)', letterSpacing:'0.04em', lineHeight:2, whiteSpace:'pre-wrap' }}>
              {selected.svaraNotation}
            </div>
          </div>

          {/* Lyrics */}
          <div style={{ marginTop:'var(--space-4)', background:'var(--surface)', borderRadius:'var(--radius)', border:'1px solid var(--border)', padding:'var(--space-4)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'var(--space-3)' }}>
              <h3 style={{ fontSize:'0.85rem', fontWeight:700, color:'var(--text)' }}>Lyrics</h3>
              <button onClick={()=>setExpandLyrics(!expandLyrics)} style={{ fontSize:'0.72rem', color:'var(--text-muted)', cursor:'pointer' }}>{expandLyrics?'Show less':'Show all'}</button>
            </div>
            <pre style={{ fontFamily:'var(--font-body)', fontSize:'0.9rem', color:'var(--text)', lineHeight:1.8, whiteSpace:'pre-wrap', maxHeight: expandLyrics?'none':'120px', overflow: expandLyrics?'visible':'hidden' }}>
              {selected.lyrics}
            </pre>
          </div>

          {/* Meaning */}
          {selected.meaningBrief && (
            <div style={{ marginTop:'var(--space-3)', background:'rgba(192,132,252,0.06)', borderRadius:'var(--radius-sm)', padding:'var(--space-3)', border:'1px solid var(--border)' }}>
              <span style={{ fontSize:'0.72rem', color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>Meaning: </span>
              <span style={{ fontSize:'0.85rem', color:'var(--text)', fontStyle:'italic' }}>{selected.meaningBrief}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
