
import { useMemo, useState } from 'react'

const TIPS = [
  'Practise Sarali Varisais daily — they build familiarity with svara patterns across the 72 Melakarta rāgas.',
  'Record yourself and listen back: attentive listening is an important part of musical practice.',
  "Manodharma begins with familiarity. Learn a rāga's Ārohaṇam–Avarohaṇam and characteristic phrases.",
  'Tāla provides rhythmic structure. Build confidence with Ādi tāla before exploring more complex cycles.',
  "When practising śruti, aim for consistent pitch matching and use the trainer's feedback.",
  'Begin with a few minutes of the Śruti Trainer to settle your listening and pitch reference.',
]

const STATS = [
  { label: 'Sessions Completed', detail: 'Practice sessions', icon: '◉', color: 'teal' },
  { label: 'Rāgas Explored', detail: 'Melodic journeys', icon: '♫', color: 'gold' },
  { label: 'Śruti Accuracy', detail: 'Pitch matching', icon: '〰', color: 'mint' },
  { label: 'Tāla Milestones', detail: 'Rhythm practice', icon: '◌', color: 'coral' },
  { label: 'Kīrtanas Played', detail: 'Repertoire', icon: '▤', color: 'gold' },
  { label: 'Practice Streak', detail: 'Consecutive days', icon: '✧', color: 'mint' },
]

const PATHS = [
  {
    id: 'svara',
    title: 'Svara & Śruti',
    subtitle: 'Build a steady pitch foundation',
    icon: '〰',
    color: 'teal',
    idea: 'Begin with a comfortable śruti reference. Repeat a short svara pattern slowly, listening for evenness and pitch stability.',
  },
  {
    id: 'raga',
    title: 'Rāga Exploration',
    subtitle: 'Explore parent and janya rāgas',
    icon: '♫',
    color: 'gold',
    idea: 'Choose one rāga, review its Ārohaṇam and Avarohaṇam, then listen for characteristic phrases that distinguish it.',
  },
  {
    id: 'tala',
    title: 'Tāla & Rhythm',
    subtitle: 'Strengthen rhythmic confidence',
    icon: '◉',
    color: 'coral',
    idea: 'Maintain a steady tāla cycle while reciting the counts before introducing a melody or more complex rhythmic pattern.',
  },
]

export default function Progress() {
  const [tipIndex, setTipIndex] = useState(0)
  const [selectedPath, setSelectedPath] = useState('svara')
  const [showAllTips, setShowAllTips] = useState(false)

  const today = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }).format(new Date()),
    [],
  )

  const selected = PATHS.find((path) => path.id === selectedPath)

  return (
    <div className="nada-progress">
      <style>{`
        .nada-progress {
          --ink: #29243c;
          --muted: #777184;
          --teal: #078b7e;
          --gold: #b98132;
          --line: rgba(72,64,91,.14);
          height: 100%;
          overflow: auto;
          padding: clamp(12px, 2.2vw, 30px);
          color: var(--ink);
          background:
            radial-gradient(ellipse at 8% 4%, rgba(137,202,176,.24), transparent 33%),
            radial-gradient(ellipse at 92% 10%, rgba(237,195,124,.20), transparent 30%),
            linear-gradient(160deg, #faf8f1, #f4eadb);
          isolation: isolate;
        }
        .nada-progress * { box-sizing: border-box; }
        .np-shell { max-width: 1380px; margin: auto; }

        .np-hero {
          position: relative;
          overflow: hidden;
          min-height: 220px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(180px, .7fr);
          align-items: center;
          border-radius: 25px;
          color: #fff9e8;
          background:
            linear-gradient(105deg, rgba(12,65,58,.98), rgba(13,105,91,.91) 60%, rgba(36,103,88,.72)),
            url('/images/nada-hero.webp') center / cover;
          box-shadow: 0 16px 38px rgba(31,72,60,.16);
        }
        .np-hero-copy {
          z-index: 1;
          padding: clamp(22px, 4vw, 42px);
        }
        .np-kicker {
          color: #f3d79d;
          font-size: .68rem;
          font-weight: 800;
          letter-spacing: .15em;
          text-transform: uppercase;
        }
        .np-hero h1 {
          font: 700 clamp(2rem, 4vw, 3.3rem)/1.08 var(--font-display, Georgia, serif);
          letter-spacing: -.035em;
          margin: 13px 0 10px;
        }
        .np-hero p {
          max-width: 560px;
          color: rgba(255,249,232,.86);
          font-size: .9rem;
          line-height: 1.7;
          margin: 0;
        }
        .np-date { margin-top: 17px; color: #f1dfb9; font-size: .76rem; }

        .np-art { position: relative; min-height: 220px; overflow: hidden; }
        .np-art img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: .42;
          mix-blend-mode: screen;
          mask-image: linear-gradient(90deg, transparent, black 35%);
        }
        .np-art svg {
          position: absolute;
          width: min(100%, 310px);
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          opacity: .82;
          animation: np-rotate 90s linear infinite;
        }
        @keyframes np-rotate { to { rotate: 360deg; } }

        .np-heading {
          display: flex;
          justify-content: space-between;
          align-items: end;
          gap: 16px;
          margin: 28px 2px 14px;
        }
        .np-heading h2 {
          margin: 0;
          font: 700 clamp(1.25rem,2vw,1.7rem)/1.2 var(--font-display,Georgia,serif);
        }
        .np-heading p { margin: 6px 0 0; color: var(--muted); font-size: .82rem; }
        .np-note {
          color: var(--teal);
          background: rgba(7,139,126,.08);
          border: 1px solid rgba(7,139,126,.18);
          padding: 7px 11px;
          border-radius: 99px;
          font-size: .7rem;
          font-weight: 750;
          white-space: nowrap;
        }

        .np-stats {
          display: grid;
          grid-template-columns: repeat(3,minmax(0,1fr));
          gap: 13px;
        }
        .np-stat {
          min-width: 0;
          padding: 17px;
          border-radius: 18px;
          border: 1px solid var(--line);
          background: rgba(255,255,255,.88);
          box-shadow: 0 7px 20px rgba(65,48,28,.045);
          transition: transform .2s ease, box-shadow .2s ease;
        }
        .np-stat:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 25px rgba(65,48,28,.10);
        }
        .np-icon {
          display: grid;
          place-items: center;
          width: 40px;
          height: 40px;
          border-radius: 13px;
          font-size: 1.25rem;
          background: rgba(7,139,126,.10);
          color: var(--teal);
        }
        .np-stat.gold .np-icon { background: #b981321e; color: var(--gold); }
        .np-stat.coral .np-icon { background: #cb68431e; color: #bf6542; }
        .np-stat.mint .np-icon { background: #5fac8f20; color: #368c70; }
        .np-value {
          margin: 16px 0 5px;
          font: 700 1.8rem/1 var(--font-display,Georgia,serif);
          color: var(--teal);
        }
        .np-label { font-size: .8rem; font-weight: 750; line-height: 1.4; }
        .np-detail { margin-top: 5px; font-size: .69rem; color: var(--muted); }
        .np-bar {
          margin-top: 15px;
          height: 3px;
          border-radius: 99px;
          background: #e9e5dc;
          overflow: hidden;
        }
        .np-bar span {
          display: block;
          width: 42%;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg,#078b7e,#b7d9b7);
          opacity: .55;
        }

        .np-columns {
          display: grid;
          grid-template-columns: minmax(0,1.05fr) minmax(0,.95fr);
          gap: 16px;
          margin-top: 22px;
        }
        .np-panel {
          min-width: 0;
          border: 1px solid var(--line);
          border-radius: 21px;
          background: rgba(255,255,255,.87);
          padding: clamp(17px,2.2vw,24px);
          box-shadow: 0 8px 24px rgba(65,48,28,.045);
        }
        .np-panel h3 {
          font: 700 1.15rem/1.3 var(--font-display,Georgia,serif);
          margin: 0;
        }
        .np-intro {
          color: var(--muted);
          font-size: .78rem;
          line-height: 1.6;
          margin: 7px 0 18px;
        }
        .np-paths { display: flex; flex-direction: column; gap: 10px; }
        .np-path {
          display: grid;
          grid-template-columns: 42px minmax(0,1fr) auto;
          gap: 12px;
          align-items: center;
          padding: 12px;
          border: 1px solid transparent;
          border-radius: 15px;
          background: #f8f6f0;
          text-align: left;
          color: inherit;
          cursor: pointer;
          transition: border-color .2s, background .2s, transform .2s;
          width: 100%;
        }
        .np-path:hover,.np-path:focus-visible,.np-path.selected {
          border-color: rgba(7,139,126,.3);
          background: #f0f8f3;
          outline: none;
        }
        .np-path:hover { transform: translateX(2px); }
        .np-path-icon {
          display: grid;
          place-items: center;
          width: 42px;
          height: 42px;
          border-radius: 13px;
          background: #e0f1e9;
          color: var(--teal);
          font-size: 1.15rem;
        }
        .np-path.gold .np-path-icon { background: #f6ead4; color: var(--gold); }
        .np-path.coral .np-path-icon { background: #f9e8df; color: #bf6542; }
        .np-path-title { font-weight: 750; font-size: .82rem; }
        .np-path-sub { display: block; color: var(--muted); font-size: .7rem; margin-top: 4px; }
        .np-meter {
          display: block;
          height: 5px;
          background: #e4e4dc;
          border-radius: 99px;
          margin-top: 9px;
          overflow: hidden;
        }
        .np-meter span {
          display: block;
          height: 100%;
          background: linear-gradient(90deg,#078b7e,#8cc5a8);
        }
        .np-path.gold .np-meter span { background: linear-gradient(90deg,#b98132,#e4c783); }
        .np-path.coral .np-meter span { background: linear-gradient(90deg,#bf6542,#e6ad89); }
        .np-status { font-size: .66rem; color: var(--muted); white-space: nowrap; }
        .np-idea {
          margin-top: 14px;
          padding: 13px 14px;
          border-radius: 14px;
          background: linear-gradient(120deg,rgba(7,139,126,.08),rgba(185,129,50,.08));
          font-size: .77rem;
          line-height: 1.7;
          color: #5f5a69;
        }

        .np-tip {
          border-radius: 17px;
          background: linear-gradient(145deg,#fff9ed,#f7f0e4);
          border: 1px solid rgba(185,129,50,.2);
          padding: 18px;
        }
        .np-tip-top { display: flex; justify-content: space-between; gap: 12px; }
        .np-tip-label {
          font-size: .66rem;
          font-weight: 850;
          text-transform: uppercase;
          letter-spacing: .13em;
          color: #a7752b;
        }
        .np-count { font-size: .68rem; color: var(--muted); }
        .np-tip-text {
          font: 600 1rem/1.7 var(--font-display,Georgia,serif);
          margin: 15px 0 18px;
          color: #41394a;
        }
        .np-controls { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .np-btn {
          border: 1px solid var(--line);
          border-radius: 10px;
          background: white;
          color: #4b4657;
          padding: 9px 12px;
          font: inherit;
          font-size: .72rem;
          font-weight: 700;
          cursor: pointer;
          transition: transform .15s,border-color .15s;
        }
        .np-btn:hover,.np-btn:focus-visible { border-color: var(--teal); transform: translateY(-1px); outline: none; }
        .np-btn.primary { color: white; background: var(--teal); border-color: var(--teal); }
        .np-dots { display: flex; gap: 5px; margin-left: auto; }
        .np-dot { width: 6px; height: 6px; border-radius: 99px; background: #d9d0bd; border: 0; padding: 0; cursor: pointer; }
        .np-dot.active { width: 18px; background: var(--teal); }
        .np-tip-list { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
        .np-tip-row {
          display: flex; gap: 10px; padding: 10px; border-radius: 12px;
          background: #faf8f3; border: 1px solid var(--line);
          color: var(--muted); font-size: .76rem; line-height: 1.6;
        }
        .np-tip-row strong { color: var(--gold); }
        .np-foot { margin: 18px 3px 0; color: var(--muted); font-size: .69rem; line-height: 1.6; }

        @media(min-width:1121px) {
          .np-stats { grid-template-columns: repeat(6,minmax(0,1fr)); }
        }
        @media(max-width:900px) {
          .np-columns { grid-template-columns: 1fr; }
        }
        @media(max-width:650px) {
          .nada-progress { padding: 10px; }
          .np-hero { grid-template-columns: 1fr; min-height: 245px; border-radius: 20px; }
          .np-hero-copy { padding: 24px 20px; z-index: 2; }
          .np-art { position: absolute; inset: 0 0 0 35%; opacity: .4; }
          .np-art svg { width: 220px; right: -40px; }
          .np-stats { grid-template-columns: repeat(2,minmax(0,1fr)); gap: 9px; }
          .np-stat { padding: 13px; }
          .np-value { font-size: 1.55rem; }
          .np-heading { align-items: flex-start; flex-direction: column; gap: 8px; margin-top: 22px; }
          .np-columns { gap: 12px; margin-top: 15px; }
          .np-panel { padding: 15px; }
          .np-path { grid-template-columns: 38px minmax(0,1fr); gap: 10px; }
          .np-path-icon { width: 38px; height: 38px; }
          .np-status { grid-column: 2; }
        }
        @media(prefers-reduced-motion:reduce) {
          .nada-progress *, .nada-progress *::before, .nada-progress *::after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>

      <div className="np-shell">
        <section className="np-hero">
          <div className="np-hero-copy">
            <span className="np-kicker">✦ Nāda · Your practice space</span>
            <h1>My Musical Journey</h1>
            <p>
              A thoughtful view of your Carnatic practice — the habits you build,
              the rāgas you explore, and the skills you refine over time.
            </p>
            <div className="np-date">{today}</div>
          </div>

          <div className="np-art" aria-hidden="true">
            <img src="/images/nada-hero.webp" alt="" />
            <svg viewBox="0 0 320 320">
              <defs>
                <radialGradient id="npGoldGlow">
                  <stop stopColor="#f8df9e" stopOpacity=".8" />
                  <stop offset="1" stopColor="#f8df9e" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx="160" cy="160" r="145" fill="url(#npGoldGlow)" />
              {[125, 100, 76, 52, 26].map((r) => (
                <circle key={r} cx="160" cy="160" r={r} fill="none" stroke="#f8e9c4" />
              ))}
              {Array.from({ length: 16 }, (_, i) => (
                <ellipse
                  key={i}
                  cx="160"
                  cy="76"
                  rx="11"
                  ry="31"
                  fill="none"
                  stroke="#f8e9c4"
                  transform={`rotate(${i * 22.5} 160 160)`}
                />
              ))}
            </svg>
          </div>
        </section>

        <div className="np-heading">
          <div>
            <h2>Your progress at a glance</h2>
            <p>Activity summaries will appear here as recorded practice data becomes available.</p>
          </div>
          <span className="np-note">Practice profile</span>
        </div>

        <section className="np-stats" aria-label="Practice statistics">
          {STATS.map((stat) => (
            <article className={`np-stat ${stat.color}`} key={stat.label}>
              <div className="np-icon" aria-hidden="true">{stat.icon}</div>
              <div className="np-value">—</div>
              <div className="np-label">{stat.label}</div>
              <div className="np-detail">{stat.detail}</div>
              <div className="np-bar" aria-hidden="true"><span /></div>
            </article>
          ))}
        </section>

        <div className="np-columns">
          <section className="np-panel">
            <h3>Learning pathways</h3>
            <p className="np-intro">
              Select a focus area for a practical suggestion. The progress bars
              are illustrative placeholders, not measured personal results.
            </p>

            <div className="np-paths">
              {PATHS.map((path, index) => (
                <button
                  key={path.id}
                  type="button"
                  className={`np-path ${path.color} ${selectedPath === path.id ? 'selected' : ''}`}
                  onClick={() => setSelectedPath(path.id)}
                  aria-pressed={selectedPath === path.id}
                >
                  <span className="np-path-icon" aria-hidden="true">{path.icon}</span>
                  <span>
                    <span className="np-path-title">{path.title}</span>
                    <span className="np-path-sub">{path.subtitle}</span>
                    <span className="np-meter" aria-hidden="true">
                      <span style={{ width: `${[35, 52, 24][index]}%` }} />
                    </span>
                  </span>
                  <span className="np-status">
                    {selectedPath === path.id ? 'Selected' : 'Explore'}
                  </span>
                </button>
              ))}
            </div>

            <div className="np-idea" role="status">
              {selected?.idea}
            </div>
          </section>

          <section className="np-panel">
            <h3>Daily practice inspiration</h3>
            <p className="np-intro">A small, focused idea for your next session.</p>

            <div className="np-tip">
              <div className="np-tip-top">
                <span className="np-tip-label">Practice tip</span>
                <span className="np-count">{tipIndex + 1} / {TIPS.length}</span>
              </div>

              <p className="np-tip-text">{TIPS[tipIndex]}</p>

              <div className="np-controls">
                <button
                  type="button"
                  className="np-btn"
                  onClick={() => setTipIndex((tipIndex + TIPS.length - 1) % TIPS.length)}
                >
                  ← Previous
                </button>
                <button
                  type="button"
                  className="np-btn primary"
                  onClick={() => setTipIndex((tipIndex + 1) % TIPS.length)}
                >
                  Next tip →
                </button>

                <div className="np-dots" aria-label="Choose a practice tip">
                  {TIPS.map((tip, i) => (
                    <button
                      type="button"
                      key={tip}
                      className={`np-dot ${tipIndex === i ? 'active' : ''}`}
                      onClick={() => setTipIndex(i)}
                      aria-label={`Show practice tip ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="np-controls" style={{ marginTop: 12 }}>
              <button
                type="button"
                className="np-btn"
                onClick={() => setShowAllTips((value) => !value)}
                aria-expanded={showAllTips}
              >
                {showAllTips ? 'Hide all tips' : 'Browse all tips'}
              </button>
            </div>

            {showAllTips && (
              <div className="np-tip-list">
                {TIPS.map((tip, i) => (
                  <div className="np-tip-row" key={tip}>
                    <strong>{i + 1}.</strong>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <p className="np-foot">
          Progress metrics will show real values when connected to recorded practice
          data. Learning-path percentages are illustrative until linked to measured
          activity; no personal performance is inferred or fabricated.
        </p>
      </div>
    </div>
  )
}
