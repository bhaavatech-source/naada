import React, { useMemo, useState } from 'react'
import archive from '../data/raga-bhava-rasa-taxonomy.json'

type Raga = {
  raga_id: string
  raga_name: string
  primary_rasa?: string
  secondary_rasas?: string[]
  arohana_pattern?: string
  avarohana_pattern?: string
  raga_type?: string
  classification?: string
  bhava_description?: string
  time_of_day?: string
  deity_association?: string
  key_jiva_swaras?: string[]
  swarasthana_codes?: string[]
  source_reference?: string
  scholarly_treatise_citations?: string[]
}

type Stage = 'learn' | 'explore' | 'quiz'
type Question = {
  id: string
  raga: Raga
  prompt: string
  correct: string
  options: string[]
  explanation: string
}

const RASA_GUIDE = [
  { name: 'Śṛṅgāra', plain: 'Love, beauty, tenderness, and grace', nuance: 'Often associated with affection, beauty, longing, or devotional love in artistic expression.' },
  { name: 'Karuṇā', plain: 'Pathos and compassion', nuance: 'May suggest sorrow, empathy, poignancy, or compassionate feeling.' },
  { name: 'Vīra', plain: 'Courage and heroic energy', nuance: 'May evoke dignity, resolve, confidence, or a sense of purposeful energy.' },
  { name: 'Śānta', plain: 'Tranquillity and equilibrium', nuance: 'May suggest stillness, contemplation, inward balance, or peace.' },
  { name: 'Adbhuta', plain: 'Wonder and amazement', nuance: 'May suggest marvel, curiosity, surprise, or a sense of the extraordinary.' },
  { name: 'Raudra', plain: 'Fury and intense force', nuance: 'May be associated with anger, fierce energy, or dramatic intensity.' },
  { name: 'Hāsya', plain: 'Mirth and playfulness', nuance: 'May suggest humour, lightness, delight, or playful expression.' },
  { name: 'Bhayānaka', plain: 'Fear and apprehension', nuance: 'May suggest tension, uncertainty, unease, or a sense of danger.' },
  { name: 'Bībhatsa', plain: 'Aversion or repulsion', nuance: 'May suggest rejection, disgust, or an uncomfortable response.' },
  { name: 'Bhakti', plain: 'Devotion and spiritual surrender', nuance: 'A devotional quality; it is not one of the classical nine rasas in every tradition.' },
]

const STYLE = `
.rb-wrap{color:#273e37;background:#f6eddd;min-width:0}
.rb-hero{background:linear-gradient(120deg,#123f38,#1c6556);color:#fff4dd;padding:clamp(18px,3vw,28px)}
.rb-hero h2{font:700 clamp(1.7rem,4vw,2.45rem) Georgia,serif;margin:8px 0}
.rb-hero p{line-height:1.7;max-width:1000px;margin:8px 0}
.rb-top-actions{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:14px}
.rb-back,.rb-btn,.rb-tab{border:1px solid #cbb996;border-radius:999px;padding:10px 14px;background:#fffaf0;color:#23483f;cursor:pointer;font:inherit}
.rb-btn:disabled{opacity:.45;cursor:not-allowed}
.rb-btn.primary,.rb-tab[aria-pressed=true]{background:#17675a;color:white;border-color:#17675a}
.rb-body{padding:clamp(12px,2.5vw,26px);min-width:0}
.rb-card{border:1px solid #dfceb0;border-radius:18px;background:#fffaf0;padding:clamp(14px,2.5vw,26px);max-width:1100px;margin:0 auto 16px;min-width:0}
.rb-card h3{font:700 clamp(1.25rem,3vw,1.65rem) Georgia,serif;margin:8px 0 12px;color:#253c36}
.rb-card h4{font:700 1.1rem Georgia,serif;margin:0 0 8px;color:#17675a}
.rb-card p,.rb-card li{line-height:1.75}
.rb-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:16px 0}
.rb-concept{background:#fff;border:1px solid #e1d1b7;border-radius:15px;padding:16px;min-width:0}
.rb-concept p{line-height:1.7;margin:8px 0}
.rb-flow{display:grid;grid-template-columns:1fr;gap:8px;margin:16px 0}
.rb-flow-step{border-radius:13px;background:#e6eee5;padding:14px;text-align:center}
.rb-flow-step strong{display:block;margin-bottom:5px}
.rb-arrow{text-align:center;color:#a56a23;font-size:1.5rem;line-height:1}
.rb-note{color:#68766e;line-height:1.65;font-size:.94rem}
.rb-scale{background:#e6eee5;border-radius:12px;padding:14px;line-height:1.8;overflow-wrap:anywhere;margin:12px 0}
.rb-controls{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}
.rb-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:16px 0}
.rb-option{border:1px solid #d8c5a2;border-radius:13px;padding:13px;background:#fff;color:#28483e;text-align:left;cursor:pointer;font:inherit;overflow-wrap:anywhere}
.rb-option[aria-pressed=true]{background:#17675a;color:white}
.rb-feedback{margin-top:12px;padding:12px;border-radius:12px;background:#e0eee5;line-height:1.7;overflow-wrap:anywhere}
.rb-progress{height:7px;border-radius:99px;background:#e8dcc6;overflow:hidden;margin:8px 0 16px}
.rb-progress span{display:block;height:100%;background:#17675a}
.rb-tag{display:inline-block;background:#e6eee5;border-radius:99px;padding:4px 9px;font-size:.85rem}
.rb-table{width:100%;border-collapse:collapse;margin:12px 0}
.rb-table th,.rb-table td{border:1px solid #e1d1b7;padding:10px;text-align:left;vertical-align:top;line-height:1.6}
.rb-table th{background:#e6eee5}
.rb-search{width:100%;min-width:0;box-sizing:border-box;border:1px solid #cbb996;border-radius:12px;padding:12px;background:#fff;color:#273e37;font:inherit}
.rb-count{font-size:.9rem;color:#68766e}
@media(max-width:720px){.rb-grid{grid-template-columns:1fr}.rb-options{grid-template-columns:1fr}.rb-table th,.rb-table td{padding:7px;font-size:.9rem}.rb-body{padding:10px}.rb-card{border-radius:14px}}
`

const clean = (value?: string) => (value || '').trim()
const normalise = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[āáà]/g, 'a').replace(/[īí]/g, 'i').replace(/[ūú]/g, 'u').replace(/ṇ/g, 'n').replace(/ṛ/g, 'r').replace(/ṣ/g, 's').replace(/ś/g, 's')

function rasaLabel(raga: Raga) {
  return clean(raga.primary_rasa) || 'Not specified'
}
function firstRasa(raga: Raga) {
  return rasaLabel(raga).split(/[,&/]/).map(s => s.trim()).filter(Boolean)[0] || 'Śānta'
}
function getRagas(): Raga[] {
  const data = archive as unknown as { ragas?: Raga[]; ragas_catalog?: Raga[] }
  return (data.ragas || data.ragas_catalog || []) as Raga[]
}

export default function RagaBhavaGame({ onClose }: { onClose: () => void }) {
  const ragas = useMemo(() => getRagas(), [])
  const examples = useMemo(() => ragas.filter(r => r.primary_rasa && r.arohana_pattern), [ragas])
  const [stage, setStage] = useState<Stage>('learn')
  const [exampleIndex, setExampleIndex] = useState(0)
  const [search, setSearch] = useState('')
  const [selectedRagaId, setSelectedRagaId] = useState('')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [checked, setChecked] = useState(false)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState<string[]>([])

  const example = examples[exampleIndex % Math.max(1, examples.length)]
  const selectedRaga = ragas.find(r => r.raga_id === selectedRagaId) || example
  const filteredRagas = useMemo(() => {
    const q = normalise(search)
    return ragas.filter(r => !q || normalise(`${r.raga_name} ${r.raga_type || ''} ${r.classification || ''} ${r.primary_rasa || ''} ${r.bhava_description || ''}`).includes(q))
  }, [ragas, search])

  const questions = useMemo<Question[]>(() => {
    const complete = ragas.filter(r => r.primary_rasa && r.arohana_pattern)
    return complete.slice(0, 100).map((r, i) => {
      const correct = firstRasa(r)
      const distractors = RASA_GUIDE.map(x => x.name).filter(name => normalise(name) !== normalise(correct))
      const choices = [correct, ...distractors.slice((i * 3) % Math.max(1, distractors.length), ((i * 3) % Math.max(1, distractors.length)) + 3)]
      while (choices.length < 4) choices.push(RASA_GUIDE[choices.length].name)
      return {
        id: `${r.raga_id}-rasa`,
        raga: r,
        prompt: `Which primary rasa is associated with ${r.raga_name} in this activity?`,
        correct,
        options: Array.from(new Set(choices)).slice(0, 4),
        explanation: r.bhava_description || 'No further bhāva description is available.'
      }
    }).filter(q => q.options.length === 4)
  }, [ragas])

  const question = questions[questionIndex % Math.max(1, questions.length)]

  function beginQuiz() {
    setQuestionIndex(0); setAnswer(''); setChecked(false); setScore(0); setAnswered([]); setStage('quiz')
  }
  function submitAnswer() {
    if (!question || !answer || checked) return
    setChecked(true)
    setAnswered(prev => prev.includes(question.id) ? prev : [...prev, question.id])
    if (normalise(answer) === normalise(question.correct)) setScore(v => v + 1)
  }
  function nextQuestion() {
    setQuestionIndex(v => (v + 1) % questions.length)
    setAnswer(''); setChecked(false)
  }

  return (
    <section className="nada-learning-panel rb-wrap">
      <style>{STYLE}</style>
      <header className="rb-hero">
        <div className="rb-top-actions">
          <button className="rb-back" onClick={onClose}>← Back</button>
          <span className="rb-tag">RĀGA · BHĀVA · RASA</span>
        </div>
        <h2>{stage === 'quiz' ? 'Rāga–Bhāva–Rasa Quiz' : 'Understanding Rāga, Bhāva & Rasa'}</h2>
        <p>Learn about rāga, bhāva and rasa, explore musical expression, and then test your understanding. Each listener may experience the music differently.</p>
      </header>

      <div className="rb-body">
        <div className="rb-controls" role="tablist" aria-label="Learning stages">
          <button className="rb-tab" aria-pressed={stage === 'learn'} onClick={() => setStage('learn')}>1. Learn in detail</button>
          <button className="rb-tab" aria-pressed={stage === 'explore'} onClick={() => setStage('explore')}>2. Explore rāgas</button>
          <button className="rb-tab" aria-pressed={stage === 'quiz'} onClick={() => setStage('quiz')}>3. Take quiz</button>
        </div>

        {stage === 'learn' && <>
          <article className="rb-card">
            <h3>1. What is Bhāva?</h3>
            <p><strong>Bhāva (भाव)</strong> is an expressive state, mood, or feeling conveyed through an artistic presentation. In music, the expression does not come from the swara names alone. It can depend on how the musician shapes a phrase, holds or approaches a note, uses gamaka, manages tempo and pauses, and relates the melody to lyrics and performance context.</p>
            <p>For example, the same swara sequence can be presented in different ways. A musician’s phrasing and emphasis can make it feel gentle, solemn, devotional, urgent, or playful. These are listening interpretations, not automatic effects of an isolated note.</p>

            <h3>2. What is Rāga?</h3>
            <p><strong>Rāga (राग)</strong> is a melodic framework with characteristic swaras and ways of moving between them. Ārohaṇa describes the ascending pattern and avarohaṇa the descending pattern. However, a rāga is not merely a scale: characteristic phrases, gamakas, important notes, melodic emphasis, and the musical tradition help distinguish it from other rāgas.</p>
            <p>When studying a rāga, listen for how the notes are connected and shaped—not only which notes appear in a list. A swara pattern alone cannot convey the full character of a rāga.</p>

            <h3>3. What is Rasa?</h3>
            <p><strong>Rasa (रस)</strong> can be understood as the aesthetic flavour or experience that an audience savours through an artistic presentation. In the classical Indian arts, rasa is discussed in relation to how expressive material is communicated and received. It is related to bhāva, but the terms are not interchangeable: the expressive state presented by the artist and the aesthetic response experienced by the listener are different parts of the process.</p>
            <p>For this learning module, treat rasa labels as a vocabulary for describing possible aesthetic qualities. A listener’s response may differ according to experience, cultural context, lyrics, composition, performer, and the way the rāga is rendered.</p>

            <h3>4. How are Rāga, Bhāva, and Rasa related?</h3>
            <div className="rb-flow">
              <div className="rb-flow-step"><strong>Rāga · the melodic language</strong>Characteristic swaras, phrases, movement, and gamakas provide the musical framework.</div>
              <div className="rb-arrow">↓</div>
              <div className="rb-flow-step"><strong>Bhāva · expressive shaping</strong>The performer brings the musical material to life through phrasing, timing, emphasis, and interpretation.</div>
              <div className="rb-arrow">↓</div>
              <div className="rb-flow-step"><strong>Rasa · aesthetic experience</strong>The listener may savour an emotional or aesthetic quality in the complete presentation.</div>
            </div>
            <p><strong>Important:</strong> this is a useful introductory model, not a rigid one-way law. Lyrics, composition, performance style, and audience experience also influence interpretation. Do not conclude that one rāga always produces one rasa in every person.</p>

            <h3>5. Rasa vocabulary used in this module</h3>
            <p>Explore rasa and devotional qualities through these short descriptions. The meaning of a term in a particular musical tradition may be more nuanced.</p>
            <div className="rb-grid">{RASA_GUIDE.map(item => <div className="rb-concept" key={item.name}><h4>{item.name}</h4><strong>{item.plain}</strong><p>{item.nuance}</p></div>)}</div>

            <h3>6. Exploring a rāga</h3>
            <ul>
              <li><strong>Rāga name and type:</strong> the name and melodic classification.</li>
              <li><strong>Ārohaṇa and avarohaṇa:</strong> the ascending and descending swara patterns.</li>
              <li><strong>Primary and secondary rasa:</strong> possible aesthetic qualities; more than one term may apply.</li>
              <li><strong>Bhāva description:</strong> an interpretation of the rāga’s expressive character.</li>
            </ul>
            <div className="rb-controls">
              <button className="rb-btn primary" onClick={() => setStage('explore')}>Explore rāgas →</button>
              <button className="rb-btn" onClick={beginQuiz}>Go to quiz →</button>
            </div>
          </article>
        </>}

        {stage === 'explore' && <>
          <article className="rb-card">
            <h3>Discover a rāga</h3>
            <p>Search by rāga name, classification, rasa or bhāva. Select a rāga to explore its musical qualities.</p>
            <input className="rb-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search e.g. Mohana, Bhakti, Śānta…" aria-label="Search rāgas" />
            <p className="rb-count">Showing {Math.min(100, filteredRagas.length)} of {filteredRagas.length} matching rāgas.</p>
            <div style={{ maxHeight: 250, overflowY: 'auto', border: '1px solid #e1d1b7', borderRadius: 12, margin: '12px 0' }}>
              {filteredRagas.slice(0, 100).map(r => <button key={r.raga_id} className="rb-option" style={{ display: 'block', width: '100%', borderRadius: 0, border: 0, borderBottom: '1px solid #eadcc6' }} aria-pressed={selectedRaga?.raga_id === r.raga_id} onClick={() => setSelectedRagaId(r.raga_id)}><strong>{r.raga_name}</strong><br/><span className="rb-note">{r.raga_type || r.classification || 'Rāga'} · {r.primary_rasa || 'No rasa label'}</span></button>)}
              {filteredRagas.length === 0 && <p style={{ padding: 14 }}>No matching rāgas found. Try a shorter spelling or a rasa term.</p>}
            </div>
            {selectedRaga && <div className="rb-scale">
              <h3>{selectedRaga.raga_name}</h3>
              {selectedRaga.classification && <p><strong>Classification:</strong> {selectedRaga.classification}</p>}
              {selectedRaga.raga_type && <p><strong>Type:</strong> {selectedRaga.raga_type}</p>}
              <p><strong>Ārohaṇa:</strong><br/>{selectedRaga.arohana_pattern || 'Not available'}</p>
              <p><strong>Avarohaṇa:</strong><br/>{selectedRaga.avarohana_pattern || 'Not available'}</p>
              <p><strong>Primary rasa:</strong> {selectedRaga.primary_rasa || 'Not available'}</p>
              {selectedRaga.secondary_rasas?.length ? <p><strong>Secondary rasa labels:</strong> {selectedRaga.secondary_rasas.join(', ')}</p> : null}
              <p><strong>Bhāva description:</strong> {selectedRaga.bhava_description || 'Not available'}</p>
              {selectedRaga.time_of_day && <p><strong>Time of day:</strong> {selectedRaga.time_of_day}</p>}
              {selectedRaga.deity_association && <p><strong>Deity association:</strong> {selectedRaga.deity_association}</p>}
              {selectedRaga.key_jiva_swaras?.length ? <p><strong>Key jīva swaras:</strong> {selectedRaga.key_jiva_swaras.join(', ')}</p> : null}
              {selectedRaga.swarasthana_codes?.length ? <p><strong>Swara-sthāna codes:</strong> {selectedRaga.swarasthana_codes.join(' · ')}</p> : null}
            </div>}
            <div className="rb-controls"><button className="rb-btn primary" onClick={beginQuiz}>Test your understanding →</button><button className="rb-btn" onClick={() => setStage('learn')}>Back to concepts</button></div>
          </article>
        </>}

        {stage === 'quiz' && question && <>
          <article className="rb-card">
            <small>QUESTION {questionIndex + 1} OF {questions.length} · SCORE {score}</small>
            <div className="rb-progress"><span style={{ width: `${((questionIndex + 1) / Math.max(1, questions.length)) * 100}%` }} /></div>
            <h3>{question.prompt}</h3>
            {question.raga.arohana_pattern && <div className="rb-scale"><strong>Ārohaṇa</strong><br/>{question.raga.arohana_pattern}{question.raga.avarohana_pattern && <><br/><strong>Avarohaṇa</strong><br/>{question.raga.avarohana_pattern}</>}</div>}
            <p className="rb-note">Choose the first primary-rasa term associated with this rāga in the activity. There may be more than one associated rasa.</p>
            <div className="rb-options">{question.options.map(o => <button key={o} className="rb-option" aria-pressed={answer === o} disabled={checked} onClick={() => setAnswer(o)}>{o}</button>)}</div>
            {checked && <div className="rb-feedback"><strong>{normalise(answer) === normalise(question.correct) ? 'Correct!' : 'Not quite.'}</strong><br/><strong>Primary rasa:</strong> {question.raga.primary_rasa}.<br/><strong>Bhāva description:</strong> {question.explanation}<p className="rb-note">Musical expression and a listener’s response can vary with the performance and context.</p></div>}
            <div className="rb-controls">
              <button className="rb-btn primary" disabled={!answer || checked} onClick={submitAnswer}>Check answer</button>
              <button className="rb-btn" disabled={!checked} onClick={nextQuestion}>Next question →</button>
              <button className="rb-btn" onClick={() => setStage('explore')}>Explore rāgas</button>
              <button className="rb-btn" onClick={() => setStage('learn')}>Review concepts</button>
            </div>
          </article>
        </>}
      </div>
    </section>
  )
}
