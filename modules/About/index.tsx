export default function About() {
  const sections = [
    { title:'What is Nādavidyā?', body:`"Nādavidyā" means "the knowledge of Nāda" — the primordial sound. This tool is the first module in Bhāva Tech's Fine Arts series, designed to take music lovers and practitioners from foundational practice all the way to Manodharma (improvisation) and original composition.` },
    { title:'Learning Pathway', body:`Stage 1 (This tool): Svara accuracy, Śruti awareness, Tāla internalization, Kīrtana vocabulary.\n\nStage 2: Rāga Alapana, Neraval practice, Kalpana Svaras, advanced Korvai.\n\nStage 3: Manodharma toolkit, composition canvas, recording and sharing.` },
    { title:'Phase 2 Roadmap', body:`• 50+ Kīrtanas with full svara notation (Tyāgarāja Pancharatnam, Dīkṣitar Navagraham, Annamācārya, Purandaradāsa)\n• Mode-aware Śruti Trainer (Carnatic rāga scale matching)\n• Teacher dashboard and student progress tracking\n• MIDI export from Music Builder\n• EEG-based focus analytics (Bhāva Cognitive layer)` },
    { title:'Pedagogy Philosophy', body:`Bhāva Tech applies brain-based learning principles: spaced repetition through daily rāga drills, procedural memory development via tāla training, and auditory discrimination training via Śruti feedback. The progression L1→L2→L3 in the Tāla Trainer mirrors Bloom's Taxonomy: Remember → Apply → Create.` },
    { title:'About Bhāva Tech', body:`Bhāva Tech is an EdTech company based in Hyderabad, Telangana, founded with the mission of making India's fine arts accessible, measurable, and learnable through technology. Nādavidyā (BMT) is part of the Bhāva Fine Arts Platform, which will eventually cover Carnatic music, Bharatanatyam, classical art, and Sanskrit.` },
  ]

  return (
    <div style={{ padding:'var(--space-6)', overflowY:'auto', height:'100%' }}>
      <div style={{ maxWidth:720, margin:'0 auto' }}>
        <div style={{ marginBottom:'var(--space-6)' }}>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:'2rem', color:'var(--accent)', marginBottom:'var(--space-2)' }}>Bhāva Music Tool</h2>
          <div style={{ fontSize:'1rem', color:'var(--text-muted)', fontStyle:'italic' }}>Nādavidyā — The Knowledge of Sound</div>
          <div style={{ display:'flex', gap:'var(--space-2)', marginTop:'var(--space-3)', flexWrap:'wrap' }}>
            {['v1.0','Bhāva Tech','Hyderabad 2026','72 Melakartas','9 Instruments'].map(tag=>(
              <span key={tag} style={{ padding:'3px 10px', borderRadius:99, background:'var(--accent-dim)', border:'1px solid var(--border)', fontSize:'0.72rem', color:'var(--accent)' }}>{tag}</span>
            ))}
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>
          {sections.map(s=>(
            <div key={s.title} style={{ background:'var(--surface)', borderRadius:'var(--radius)', padding:'var(--space-4)', border:'1px solid var(--border)' }}>
              <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1rem', color:'var(--accent)', marginBottom:'var(--space-2)' }}>{s.title}</h3>
              <p style={{ fontSize:'0.85rem', color:'var(--text-muted)', lineHeight:1.8, whiteSpace:'pre-line' }}>{s.body}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop:'var(--space-6)', textAlign:'center', color:'var(--text-faint)', fontSize:'0.75rem' }}>
          © 2026 Bhāva Tech · Hyderabad, Telangana · All rights reserved
        </div>
      </div>
    </div>
  )
}
