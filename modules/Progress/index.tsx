const TIPS = [
  "Practice Sarali Varisais daily — they build muscle memory for the full 72-rāga spectrum.",
  "Record yourself and compare: your ear always improves before your voice.",
  "Manodharma begins with deep familiarity. Know a rāga's Ārohaṇam–Avarohaṇam in your sleep.",
  "Tāla is the container; the melody lives inside it. Master Adi before Khanda Capu.",
  "Shruti accuracy below 15 cents is the professional standard. Be patient.",
  "Start each session with 10 minutes of Shruti Trainer to calibrate your ear.",
]
export default function Progress() {
  return (
    <div style={{ padding:'var(--space-6)', overflowY:'auto', height:'100%' }}>
      <div style={{ maxWidth:720, margin:'0 auto' }}>
        <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.6rem', color:'var(--accent)', marginBottom:'var(--space-6)' }}>My Progress</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:'var(--space-3)', marginBottom:'var(--space-6)' }}>
          {[{label:'Sessions Completed',value:'—',icon:'🎯'},{label:'Rāgas Practiced',value:'—',icon:'🎼'},{label:'Avg Shruti Accuracy',value:'—',icon:'🎤'},{label:'Tāla L1 Passes',value:'—',icon:'🥁'},{label:'Kīrtanas Played',value:'—',icon:'📜'},{label:'Practice Streak',value:'—',icon:'🔥'}].map(s=>(
            <div key={s.label} style={{ background:'var(--surface)', borderRadius:'var(--radius)', padding:'var(--space-4)', border:'1px solid var(--border)', textAlign:'center' }}>
              <div style={{ fontSize:'1.5rem', marginBottom:4 }}>{s.icon}</div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:'1.4rem', color:'var(--accent)' }}>{s.value}</div>
              <div style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ background:'var(--surface)', borderRadius:'var(--radius)', padding:'var(--space-4)', border:'1px solid var(--border)', marginBottom:'var(--space-4)' }}>
          <h3 style={{ fontSize:'0.88rem', fontWeight:600, marginBottom:'var(--space-3)', color:'var(--text)' }}>📊 Progress Tracking (Phase 2)</h3>
          <p style={{ fontSize:'0.82rem', color:'var(--text-muted)', lineHeight:1.7 }}>Full session analytics — per-rāga accuracy trends, tāla cycle heat maps, shruti deviation graphs, weekly reports — coming in Phase 2. Data stored locally (IndexedDB) with optional cloud sync.</p>
        </div>
        <div style={{ background:'var(--surface)', borderRadius:'var(--radius)', padding:'var(--space-4)', border:'1px solid var(--border)' }}>
          <h3 style={{ fontSize:'0.88rem', fontWeight:600, marginBottom:'var(--space-3)', color:'var(--accent)' }}>Daily Practice Tips</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-2)' }}>
            {TIPS.map((tip,i)=>(
              <div key={i} style={{ display:'flex', gap:'var(--space-3)', padding:'var(--space-3)', background:'var(--surface2)', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)' }}>
                <span style={{ color:'var(--accent)', fontWeight:700, flexShrink:0 }}>{i+1}.</span>
                <span style={{ fontSize:'0.82rem', color:'var(--text-muted)' }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
