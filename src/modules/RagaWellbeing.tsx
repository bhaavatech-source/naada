import { useMemo, useState } from 'react'
import catalogue from '../data/raga-wellbeing-catalogue.json'
import { readRagaPracticeTarget } from '../music/ragaPracticeTarget'
import { useAppStore } from '../store/useAppStore'
import './raga-wellbeing.css'

const ragas = catalogue.ragas.map(raga => ({
  ...raga, practiceTarget: readRagaPracticeTarget(raga.practiceTarget),
}))
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const moodLabels: Record<string, string> = {
  calm: 'Calm',
  reflective: 'Reflective',
  uplifting: 'Uplifting',
  devotional: 'Devotional',
}
const moods = [...new Set(ragas.flatMap(raga => raga.tags ?? []))]
const healingStudyRagas = new Set([
  'raga_hamsadhwani',
  'raga_shankarabharanam',
  'raga_kalyani',
  'raga_charukesi',
  'raga_bhoopalam',
  'raga_neelambari',
  'raga_bilahari',
])

export default function RagaWellbeing() {
  const openRagaPractice = useAppStore(state => state.openRagaPractice)
  const [query, setQuery] = useState('')
  const [mood, setMood] = useState('')
  const matches = useMemo(() => ragas.filter(raga =>
    (!mood || raga.tags?.includes(mood)) &&
    normalize(`${raga.name} ${raga.id.replace(/_/g, ' ')}`).includes(normalize(query.trim()))), [mood, query])
  return <section className="wellbeing" aria-labelledby="wellbeing-title">
    <header className="wellbeing-hero">
      <h2 id="wellbeing-title">Rāga & Wellbeing</h2>
      <p>Explore rāga character and listening traditions.</p>
    </header>
    <div className="wellbeing-content">
      <div className="wellbeing-filters">
        <label>Search rāgas<input value={query} onChange={event => setQuery(event.target.value)} type="search" /></label>
        <label>Listening character<select aria-label="Listening character" value={mood} onChange={event => setMood(event.target.value)}>
          <option value="">All rāgas</option>
          {moods.map(item => <option key={item} value={item}>{moodLabels[item]}</option>)}
        </select></label>
      </div>
      <p role="status">{matches.length} rāgas</p>
      {!matches.length && <p>No matching rāgas. Try a different search.</p>}
      <div className="wellbeing-grid">
        {matches.map(raga => <article className="wellbeing-card" key={raga.id}>
          <h3>{raga.name}</h3>
          <small>{raga.tradition.split(';')[0]}{raga.practiceTarget ? ` · ${raga.practiceTarget.family === 'melakarta' ? 'Melakarta' : 'Janya'}` : ''}</small>
          {raga.note && <p>{raga.note}</p>}
          {!!raga.tags?.length && <p className="wellbeing-tags">{raga.tags.map(tag => <span key={tag}>{tag[0].toUpperCase() + tag.slice(1)}</span>)}</p>}
          {healingStudyRagas.has(raga.id) && <p className="wellbeing-muted">
            Source: Archana & Prashantha, “Therapeutic Applications of Carnatic Ragas” (IJCRT, 2025).
          </p>}
          {raga.practiceTarget &&
            <button onClick={() => {
              if (!raga.practiceTarget) throw new Error('Missing rāga practice target.')
              openRagaPractice(raga.practiceTarget)
            }} aria-label={`Practise ${raga.name}`}>Open rāga practice</button>
          }
        </article>)}
      </div>
    </div>
  </section>
}
