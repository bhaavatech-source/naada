export default function About() {
  const sections = [
    {
      title: 'What is Nāda?',
      body: `Nāda is Bhāva Tech's Carnatic music learning platform. It brings together foundational practice and tools for exploring svara accuracy, śruti awareness, tāla, rāga, musical notation, and composition.`,
    },
    {
      title: 'Learning Pathway',
      body: `Stage 1: Svara accuracy, Śruti awareness, Tāla internalization, and Kīrtana vocabulary.\n\nStage 2: Rāga Alapana, Neraval practice, Kalpana Svaras, and advanced Korvai.\n\nStage 3: Manodharma tools, composition, recording, and sharing.`,
    },
    {
      title: 'Pedagogy Philosophy',
      body: `Bhāva Tech applies brain-based learning principles: spaced repetition through daily rāga drills, procedural memory development via tāla training, and auditory discrimination training via Śruti feedback. The progression L1→L2→L3 in the Tāla Trainer mirrors Bloom's Taxonomy: Remember → Apply → Create.`,
    },
    {
      title: 'About Bhāva Tech',
      body: `Bhāva Tech is an EdTech company based in Visakhapatnam, Andhra Pradesh, with a mission to make available all knowledge streams of the world with learn with fun concept. This Nāda is part of the Bhāva Fine Arts Platform, which is intended to expand into Carnatic music, Bharatanāṭyam, classical arts, and other Indian art forms. The Nāda platform is designed to be a comprehensive learning tool for students, teachers, and enthusiasts of Carnatic music.`,
    },
  ]

  return (
    <div style={{ padding: 'var(--space-6)', overflowY: 'auto', height: '100%' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2rem',
              color: 'var(--accent)',
              marginBottom: 'var(--space-2)',
            }}
          >
            Nāda
          </h2>
          <div style={{ fontSize: '1rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Enjoy the colors of Sounds
          </div>
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-2)',
              marginTop: 'var(--space-3)',
              flexWrap: 'wrap',
            }}
          >
            {['v1.0', 'Bhāva Tech', 'Carnatic Music', '72 Melakartas', '9 Instruments'].map((tag) => (
              <span
                key={tag}
                style={{
                  padding: '3px 10px',
                  borderRadius: 99,
                  background: 'var(--accent-dim)',
                  border: '1px solid var(--border)',
                  fontSize: '0.72rem',
                  color: 'var(--accent)',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {sections.map((section) => (
            <div
              key={section.title}
              style={{
                background: 'var(--surface)',
                borderRadius: 'var(--radius)',
                padding: 'var(--space-4)',
                border: '1px solid var(--border)',
              }}
            >
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1rem',
                  color: 'var(--accent)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                {section.title}
              </h3>
              <p
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.8,
                  whiteSpace: 'pre-line',
                }}
              >
                {section.body}
              </p>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 'var(--space-6)',
            textAlign: 'center',
            color: 'var(--text-faint)',
            fontSize: '0.75rem',
          }}
        >
          © 2026 Bhāva Tech · All rights reserved
        </div>
      </div>
    </div>
  )
}
