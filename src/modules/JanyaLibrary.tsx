// @ts-nocheck
import { useState, useRef, useCallback, useEffect } from 'react'
import { JANYA_RAGAS, type JanyaRaga, type JanyaCurriculumDatabase, type JanyaCurriculumExercise, loadJanyaMasterCurriculum, normalizeRagaName, mergeJanyaRagasWithCurriculum } from '../data/janyas'
import { MELAKARTAS } from '../data/ragas'
import { useAppStore } from '../store/useAppStore'
import { getAudioContext } from '../audio/engine'
import { synthNoteJI } from './RagaLibrary/index'
import {
  getMelakartaVariantMap,
  getRVariantKey,
  getGVariantKey,
  getDVariantKey,
  getNVariantKey,
} from '../music/melakartaMapping'

// ─────────────────────────────────────────────────────────────────────────────
// Janya rāgas have their own Aro/Avro notation using the SAME
// token system as melakartas. The parent mel's note-variant keys
// are inherited automatically — Abheri gets R1,G1 from Kharaharapriya(22)
// because getRVariantKey(22) = R1, getGVariantKey(22) = G2 etc.
// ─────────────────────────────────────────────────────────────────────────────

type NoteInfo = {
  ratio: number
  svaraKey: string
  octave: 'kil' | 'mid' | 'tar'
  token: string
}

const JI: Record<string, number> = {
  S: 1,
  R1: 256 / 243, R2: 9 / 8, R3: 32 / 27,
  G1: 9 / 8, G2: 32 / 27, G3: 81 / 64,
  M1: 4 / 3, M2: 729 / 512,
  P: 3 / 2,
  D1: 128 / 81, D2: 5 / 3, D3: 16 / 9,
  N1: 5 / 3, N2: 16 / 9, N3: 15 / 8,
}

const SVARA_INFO: Record<
  string,
  { name: string; meaning: string; colour: string }
> = {
  S:  { name: 'Sa — Ṣaḍja', meaning: 'Tonic', colour: '#facc15' },
  R1: { name: 'Ri1 — Ṛṣabha', meaning: 'Śuddha Ṛṣabha', colour: '#f87171' },
  R2: { name: 'Ri2 — Ṛṣabha', meaning: 'Catusruti Ṛṣabha', colour: '#fb923c' },
  R3: { name: 'Ri3 — Ṛṣabha', meaning: 'Ṣaṭśruti Ṛṣabha', colour: '#fbbf24' },
  G1: { name: 'Ga1 — Gāndhāra', meaning: 'Svara position G1', colour: '#a3e635' },
  G2: { name: 'Ga2 — Gāndhāra', meaning: 'Svara position G2', colour: '#4ade80' },
  G3: { name: 'Ga3 — Gāndhāra', meaning: 'Antara Gāndhāra', colour: '#34d399' },
  M1: { name: 'Ma1 — Madhyama', meaning: 'Śuddha Madhyama', colour: '#22d3ee' },
  M2: { name: 'Ma2 — Madhyama', meaning: 'Prati Madhyama', colour: '#38bdf8' },
  P:  { name: 'Pa — Pañcama', meaning: 'Pañcama', colour: '#818cf8' },
  D1: { name: 'Da1 — Daivata', meaning: 'Śuddha Daivata', colour: '#a78bfa' },
  D2: { name: 'Da2 — Daivata', meaning: 'Catusruti Daivata', colour: '#c084fc' },
  D3: { name: 'Da3 — Daivata', meaning: 'Ṣaṭśruti Daivata', colour: '#e879f9' },
  N1: { name: 'Ni1 — Niṣāda', meaning: 'Kaiśiki Niṣāda', colour: '#f472b6' },
  N2: { name: 'Ni2 — Niṣāda', meaning: 'Svara position N2', colour: '#fb7185' },
  N3: { name: 'Ni3 — Niṣāda', meaning: 'Kākali Niṣāda', colour: '#fda4af' },
}

function buildMelNoteInfoMap(
  raga: { number: number }
): Record<string, NoteInfo> {
  const variants = getMelakartaVariantMap(raga.number)

  const mk = (
    ratio: number,
    svaraKey: string,
    octave: NoteInfo['octave'],
    token: string
  ): NoteInfo => ({ ratio, svaraKey, octave, token })

  const { R, G, M, D, N } = variants
  const map: Record<string, NoteInfo> = {}

  const svaras = [
    ['s', 'S', 'mid', 1],
    ['r', R, 'mid', 1],
    ['g', G, 'mid', 1],
    ['m', M, 'mid', 1],
    ['p', 'P', 'mid', 1],
    ['d', D, 'mid', 1],
    ['n', N, 'mid', 1],
    ['S', 'S', 'tar', 2],
    ['R', R, 'tar', 2],
    ['G', G, 'tar', 2],
    ['M', M, 'tar', 2],
    ['P', 'P', 'tar', 2],
    ['D', D, 'tar', 2],
    ['N', N, 'tar', 2],
    ['s,', 'S', 'kil', 0.5],
    ['r,', R, 'kil', 0.5],
    ['g,', G, 'kil', 0.5],
    ['m,', M, 'kil', 0.5],
    ['p,', 'P', 'kil', 0.5],
    ['d,', D, 'kil', 0.5],
    ['n,', N, 'kil', 0.5],
  ] as const

  for (const [token, svaraKey, octave, multiplier] of svaras) {
    map[token] = mk(
      JI[svaraKey] * multiplier,
      svaraKey,
      octave,
      token
    )
  }

  return map
}

type PlayMode = 'aro' | 'avro' | 'both'

interface NoteEvent {
  noteInfo: NoteInfo | null
  durationMult: number
  token: string
  isRest: boolean
}

function parseJanyaEvents(noteStr: string, nim: Record<string, NoteInfo>): NoteEvent[] {
  const tokens = noteStr.trim().split(/\s+/).filter(Boolean)
  const events: NoteEvent[] = []
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i]
    if (tok === '|' || tok === '||') continue
    if (tok === ',') {
      if (events.length > 0 && !events[events.length - 1].isRest)
        events[events.length - 1].durationMult += 1
      continue
    }
    if (tok === '-') { events.push({ noteInfo: null, durationMult: 0.5, token: '-', isRest: true }); continue }
    let dur = 1
    while (i + 1 < tokens.length && tokens[i + 1] === ',') { dur++; i++ }
    const info = nim[tok] ?? null
    events.push({ noteInfo: info, durationMult: dur, token: tok, isRest: !info })
  }
  return events
}

function buildJanyaDisplayMap(noteStr: string, nim: Record<string, NoteInfo>): number[] {
  const tokens = noteStr.trim().split(/\s+/).filter(Boolean)
  const map: number[] = []
  let ei = 0
  for (let ti = 0; ti < tokens.length; ti++) {
    const tok = tokens[ti]
    if (tok === '|' || tok === '||' || tok === ',') { map.push(-1); continue }
    if (tok === '-') { map.push(ei++); continue }
    map.push(ei++)
    while (ti + 1 < tokens.length && tokens[ti + 1] === ',') ti++
  }
  return map
}

function scheduleJanya(
  events: NoteEvent[],
  tonicHz: number,
  beatSec: number,
  instrument: string,
  volume: number,
  onNote: (i: number) => void,
  onDone: () => void
): () => void {
  const ctx = getAudioContext()
  let cancelled = false
  let t = ctx.currentTime + 0.06
  let prevRatio: number | null = null
  const tids: ReturnType<typeof setTimeout>[] = []

  events.forEach((ev, i) => {
    if (ev.isRest || !ev.noteInfo) {
      t += beatSec * ev.durationMult
      return
    }

    const fireAt = t

    synthNoteJI(
      tonicHz,
      ev.noteInfo.ratio,
      prevRatio,
      ev.durationMult,
      beatSec,
      instrument,
      volume,
      fireAt
    )

    const delay = Math.max(0, (fireAt - ctx.currentTime) * 1000)
    const tid = setTimeout(() => {
      if (!cancelled) onNote(i)
    }, delay)

    tids.push(tid)
    prevRatio = ev.noteInfo.ratio
    t += beatSec * ev.durationMult
  })

  const doneTid = setTimeout(() => {
    if (!cancelled) onDone()
  }, Math.max(0, (t - ctx.currentTime + 0.15) * 1000))

  tids.push(doneTid)

  return () => {
    cancelled = true
    tids.forEach(clearTimeout)
  }
}

function tokenColour(tok: string): string {
  if (tok === '|' || tok === '||') return 'rgba(255,255,255,0.18)'
  if (tok === '-') return '#475569'
  if (tok === ',') return '#f59e0b'
  if (tok.endsWith(',')) return '#7dd3fc'
  if (/^[SRGMPDNṠ]/.test(tok)) return '#c4b5fd'
  return '#e2e8f0'
}

// Group janyas by parent mel for the sidebar
const groupByParent = (ragaList: JanyaRaga[] = JANYA_RAGAS) => {
  const map: Record<number, JanyaRaga[]> = {}
  ragaList.forEach(j => {
    if (!map[j.parentMel]) map[j.parentMel] = []
    map[j.parentMel].push(j)
  })
  return Object.entries(map)
    .map(([mel, janyas]) => ({ mel: Number(mel), janyas }))
    .sort((a, b) => a.mel - b.mel)
}

export default function JanyaLibrary() {
  const { settings } = useAppStore()
  const [search, setSearch]             = useState('')
  const [ragaList, setRagaList] = useState<JanyaRaga[]>(JANYA_RAGAS)
  const [selected, setSelected]         = useState<JanyaRaga>(JANYA_RAGAS[0])
  const [janyaCurriculum, setJanyaCurriculum] = useState<JanyaCurriculumDatabase | null>(null)
  const [curriculumLoading, setCurriculumLoading] = useState(true)
  const [curriculumError, setCurriculumError] = useState('')
  const [selectedExerciseCategory, setSelectedExerciseCategory] = useState('sarali_varisai')
  const [selectedExerciseId, setSelectedExerciseId] = useState('')
  const [playMode, setPlayMode]         = useState<PlayMode>('both')
  const [playing, setPlaying]           = useState(false)
  const [activeEvIdx, setActiveEvIdx]   = useState<{phase:'aro'|'avro'; i:number} | null>(null)
  const [playPhase, setPlayPhase]       = useState<'aro'|'avro'|null>(null)
  const stopRef = useRef<(()=>void)|null>(null)

  // Load the master exercise curriculum independently of the existing scale list.
  useEffect(() => {
    let cancelled = false
    loadJanyaMasterCurriculum()
      .then(data => {
        if (cancelled) return
        setJanyaCurriculum(data)
        setRagaList(mergeJanyaRagasWithCurriculum(data))
        setCurriculumError('')
      })
      .catch(error => {
        if (!cancelled) setCurriculumError(error instanceof Error ? error.message : String(error))
      })
      .finally(() => { if (!cancelled) setCurriculumLoading(false) })
    return () => { cancelled = true }
  }, [])

  const groups = groupByParent(ragaList)
  const selectedCurriculumRaga = janyaCurriculum?.janya_ragas?.find(r =>
    normalizeRagaName(r.raga_name) === normalizeRagaName(selected.name)
      && r.parent_mela_number === selected.parentMel
  )
  const exerciseCategories = selectedCurriculumRaga?.exercises
    ? Object.keys(selectedCurriculumRaga.exercises).filter(key => Array.isArray(selectedCurriculumRaga.exercises[key]) && selectedCurriculumRaga.exercises[key].length > 0)
    : []
  const effectiveExerciseCategory = exerciseCategories.includes(selectedExerciseCategory)
    ? selectedExerciseCategory : (exerciseCategories[0] ?? '')
  const availableExercises: JanyaCurriculumExercise[] = effectiveExerciseCategory
    ? (selectedCurriculumRaga?.exercises?.[effectiveExerciseCategory] ?? []) : []
  const selectedExercise = availableExercises.find(ex => String(ex.exerciseId) === selectedExerciseId) ?? availableExercises[0]

  const parentMel = MELAKARTAS.find(m => m.number === selected.parentMel)

  const nim = parentMel ? buildMelNoteInfoMap(parentMel) : {}
  const aroEvents  = parseJanyaEvents(selected.aro,  nim)
  const avroEvents = parseJanyaEvents(selected.avro, nim)
  const aroDispMap  = buildJanyaDisplayMap(selected.aro,  nim)
  const avroDispMap = buildJanyaDisplayMap(selected.avro, nim)
  const aroTokens  = selected.aro.trim().split(/\s+/).filter(Boolean)
  const avroTokens = selected.avro.trim().split(/\s+/).filter(Boolean)

  const filteredGroups = groups.map(g => ({
    ...g,
    janyas: g.janyas.filter(j =>
      !search || j.name.toLowerCase().includes(search.toLowerCase())
        || (j.nameTelugu ?? '').includes(search)
        || j.parentName.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(g => g.janyas.length > 0)

  const stopCurrent = useCallback(() => {
    stopRef.current?.(); stopRef.current = null
    setPlaying(false); setActiveEvIdx(null); setPlayPhase(null)
  }, [])

  const handlePlay = useCallback(() => {
    if (playing) { stopCurrent(); return }
    const pm = MELAKARTAS.find(m => m.number === selected.parentMel)
    if (!pm) return
    const localNim  = buildMelNoteInfoMap(pm)
    const aEvents   = parseJanyaEvents(selected.aro,  localNim)
    const avEvents  = parseJanyaEvents(selected.avro, localNim)
    const beatSec   = 60 / settings.bpm
    const tHz       = settings.tonicHz
    setPlaying(true)

    const runPhase = (phase: 'aro'|'avro', done: () => void) => {
      const evs = phase === 'aro' ? aEvents : avEvents
      setPlayPhase(phase)
      const cancel = scheduleJanya(
  evs,
  tHz,
  beatSec,
  settings.instrument,
  settings.volume,
  i => setActiveEvIdx({ phase, i }),
  done
)
      stopRef.current = cancel
    }

    if (playMode === 'aro') runPhase('aro', stopCurrent)
    else if (playMode === 'avro') runPhase('avro', stopCurrent)
    else runPhase('aro', () => setTimeout(() => runPhase('avro', stopCurrent), 300))
  }, [playing, stopCurrent, selected, settings, playMode])

  const playSingleNote = useCallback((info: NoteInfo) => {
    const ctx = getAudioContext()
    synthNoteJI(settings.tonicHz, info.ratio, null, 1.5, 0.6, settings.instrument, settings.volume, ctx.currentTime + 0.02)
  }, [settings])

  // Active note info for panel
  const activeNoteDisplay = (() => {
    if (!activeEvIdx) return null
    const evs = activeEvIdx.phase === 'aro' ? aroEvents : avroEvents
    const ev = evs[activeEvIdx.i]
    if (!ev?.noteInfo) return null
    const si = SVARA_INFO[ev.noteInfo.svaraKey]
    return si ? { info: ev.noteInfo, svaraInfo: si } : null
  })()

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* Sidebar */}
      <div style={{ width: 220, flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-2) var(--space-3)', borderBottom: '1px solid var(--border)' }}>
          <input placeholder="Search janya or parent…" value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '5px 9px', fontSize: '0.75rem', color: 'var(--text)' }} />
          <div style={{ fontSize: '0.6rem', color: 'var(--text-faint)', marginTop: 4 }}>{JANYA_RAGAS.length} janya rāgas</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-1) var(--space-2)' }}>
          {filteredGroups.map(({ mel, janyas }) => (
            <div key={mel}>
              <div style={{ fontSize: '0.58rem', color: 'var(--text-faint)', padding: '4px 6px 2px', fontWeight: 700, letterSpacing: '0.05em', borderTop: '1px solid var(--border)', marginTop: 4 }}>
                Mel {mel} · {MELAKARTAS.find(m => m.number === mel)?.name}
              </div>
              {janyas.map(j => (
                <button key={j.id} onClick={() => { stopCurrent(); setSelected(j) }}
                  style={{ width: '100%', textAlign: 'left', padding: '4px 6px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', background: selected.id === j.id ? 'var(--accent-dim)' : 'transparent', color: selected.id === j.id ? 'var(--accent)' : 'var(--text)', marginBottom: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{j.name}</span>
                  {j.nameTelugu && <span style={{ fontSize: '0.6rem', color: 'var(--text-faint)' }}>{j.nameTelugu}</span>}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Main panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--accent)', margin: 0 }}>{selected.name}</h2>
              {selected.nameTelugu && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selected.nameTelugu}</div>}
              <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)', marginTop: 2 }}>
                Janya of Mel {selected.parentMel} — {selected.parentName}
                &nbsp;·&nbsp;<span style={{ color: 'var(--accent)' }}>{selected.type}</span>
                {selected.rasa && <>&nbsp;·&nbsp;Rasa: {selected.rasa}</>}
              </div>
              {selected.description && (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, maxWidth: 480 }}>{selected.description}</div>
              )}
              {selected.famousKritis && (
                <div style={{ fontSize: '0.65rem', color: 'var(--text-faint)', marginTop: 3 }}>
                  ♬ {selected.famousKritis.join('  ·  ')}
                </div>
              )}
            </div>

            {/* Active note panel */}
            {activeNoteDisplay ? (
              <div style={{ padding: '8px 14px', borderRadius: 'var(--radius)', background: `${activeNoteDisplay.svaraInfo.colour}18`, border: `1px solid ${activeNoteDisplay.svaraInfo.colour}55`, display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 210 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: activeNoteDisplay.svaraInfo.colour, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#000', fontFamily: 'monospace' }}>{activeNoteDisplay.info.token}</span>
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: activeNoteDisplay.svaraInfo.colour }}>{activeNoteDisplay.svaraInfo.name}</div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{activeNoteDisplay.svaraInfo.meaning}</div>
                  <div style={{ fontSize: '0.58rem', color: 'var(--text-faint)', fontFamily: 'monospace' }}>
                    {activeNoteDisplay.info.octave === 'kil' ? '↓ Mandra sthāyi' : activeNoteDisplay.info.octave === 'tar' ? '↑ Tāra sthāyi' : '· Madhya sthāyi'}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '8px 14px', borderRadius: 'var(--radius)', background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: '0.65rem', color: 'var(--text-faint)', minWidth: 210, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Note panel — active during playback
              </div>
            )}
          </div>

          {/* Scale / note palette */}
          <div style={{ marginTop: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-faint)', minWidth: 32 }}>Scale</span>
            {Object.entries(nim).filter(([k]) => k.length === 1 && k === k.toLowerCase()).map(([k, info]) => (
              <button key={k} onClick={() => playSingleNote(info)}
                title={`${SVARA_INFO[info.svaraKey]?.name} — play swara`}
                style={{ padding: '2px 9px', borderRadius: 'var(--radius-sm)', border: `1px solid ${SVARA_INFO[info.svaraKey]?.colour ?? 'var(--border)'}44`, background: 'var(--surface2)', color: SVARA_INFO[info.svaraKey]?.colour ?? 'var(--text)', fontSize: '0.72rem', fontFamily: 'monospace', cursor: 'pointer', fontWeight: 600 }}>
                {k}
              </button>
            ))}
          </div>

          {/* Controls */}
          <div style={{ marginTop: 'var(--space-2)', display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
            {(['aro','both','avro'] as PlayMode[]).map(pm => (
              <button key={pm} onClick={() => setPlayMode(pm)}
                style={{ padding: '2px 9px', borderRadius: 99, fontSize: '0.7rem', fontWeight: 600, border: '1px solid', cursor: 'pointer', background: playMode === pm ? 'var(--accent)' : 'var(--surface2)', borderColor: playMode === pm ? 'var(--accent)' : 'var(--border)', color: playMode === pm ? '#000' : 'var(--text-muted)' }}>
                {pm === 'aro' ? '↑ Āro' : pm === 'avro' ? '↓ Avro' : '↑↓ Both'}
              </button>
            ))}
          </div>

          {/* Playing status */}
          {playing && (
            <div style={{ marginTop: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', gap: 3 }}>
                {[0,1,2].map(d => <div key={d} style={{ width: 3, height: 10, borderRadius: 2, background: 'var(--accent)', opacity: 0.7, animation: `bounce 0.7s ${d*0.15}s ease-in-out infinite alternate` }} />)}
              </div>
              {playPhase && (
                <span style={{ fontSize: '0.68rem', padding: '1px 7px', borderRadius: 99, background: playPhase === 'aro' ? 'rgba(100,200,100,0.12)' : 'rgba(200,150,255,0.12)', color: playPhase === 'aro' ? '#86efac' : '#c4b5fd', border: `1px solid ${playPhase === 'aro' ? 'rgba(100,200,100,0.3)' : 'rgba(200,150,255,0.3)'}` }}>
                  {playPhase === 'aro' ? '↑ Ārohaṇa' : '↓ Avarohaṇa'}
                </span>
              )}
              <button onClick={stopCurrent} style={{ fontSize: '0.68rem', padding: '2px 9px', borderRadius: 99, border: '1px solid var(--red)', color: 'var(--red)', cursor: 'pointer', background: 'rgba(248,113,113,0.08)' }}>⏹ Stop</button>
            </div>
          )}
        </div>

        {/* Master Janya exercise curriculum */}
        <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text)' }}>Abhyāsa Gāṇa Curriculum</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 3 }}>
                {selectedCurriculumRaga ? `${selectedCurriculumRaga.curriculum_exercise_count ?? availableExercises.length} exercises planned for ${selectedCurriculumRaga.raga_name}` : 'Structured exercises from the separate master JSON'}
              </div>
            </div>
            {janyaCurriculum?.version && <span style={{ fontSize: '0.62rem', color: 'var(--text-faint)' }}>Curriculum v{janyaCurriculum.version}</span>}
          </div>

          {curriculumLoading && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Loading janya curriculum…</div>}
          {!curriculumLoading && curriculumError && <div role="alert" style={{ fontSize: '0.72rem', color: 'var(--red)' }}>Could not load master janya curriculum: {curriculumError}</div>}
          {!curriculumLoading && !curriculumError && !selectedCurriculumRaga && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>No matching curriculum record found for this rāga. The existing scale library remains available.</div>}

          {selectedCurriculumRaga && (
            <>
              {janyaCurriculum?.quality_status?.status === 'NOT_VERIFIED_FOR_RELEASE' && (
                <div style={{ margin: '8px 0', padding: '8px 10px', border: '1px solid rgba(245,158,11,0.45)', borderRadius: 'var(--radius-sm)', background: 'rgba(245,158,11,0.08)', color: 'var(--text-muted)', fontSize: '0.68rem' }}>
                  Audit draft: exercise notation is displayed for review only. Musical sequences have not been verified for release; playback is intentionally not connected to these exercises yet.
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                  Exercise group
                  <select value={effectiveExerciseCategory} onChange={e => { setSelectedExerciseCategory(e.target.value); setSelectedExerciseId('') }} style={{ minWidth: 180, padding: '6px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.72rem' }}>
                    {exerciseCategories.map(key => <option key={key} value={key}>{key.replace(/_/g, ' ')}</option>)}
                  </select>
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                  Exercise
                  <select value={selectedExercise ? String(selectedExercise.exerciseId) : ''} onChange={e => setSelectedExerciseId(e.target.value)} style={{ minWidth: 260, maxWidth: '100%', padding: '6px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.72rem' }}>
                    {availableExercises.map(ex => <option key={ex.exerciseId} value={String(ex.exerciseId)}>{ex.exerciseId}. {ex.exerciseName}</option>)}
                  </select>
                </label>
              </div>

              {/* Exercise playback controls are intentionally disabled until the
                  curriculum notation, octave mapping, duration, and tāla are validated. */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '2px 0 12px' }}>
                <button
                  type="button"
                  disabled
                  title="Exercise playback will be enabled after the musical sequence is validated."
                  aria-describedby="janya-exercise-playback-status"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 13px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--primary)', color: '#fff', fontSize: '0.72rem', fontWeight: 700, opacity: 0.58, cursor: 'not-allowed' }}
                >
                  <span aria-hidden="true">▶</span> Play Exercise
                </button>
                <button
                  type="button"
                  disabled
                  title="No exercise playback is active."
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 13px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', fontSize: '0.72rem', opacity: 0.58, cursor: 'not-allowed' }}
                >
                  <span aria-hidden="true">■</span> Stop
                </button>
                <span id="janya-exercise-playback-status" role="status" style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                  Playback pending musical validation
                </span>
              </div>

              {selectedExercise && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
                  {(['arohana', 'avarohana'] as const).map(direction => {
                    const note = selectedExercise[direction]
                    if (!note) return null
                    return <div key={direction} style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)' }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 800, color: direction === 'arohana' ? '#86efac' : '#c4b5fd', marginBottom: 6 }}>{direction === 'arohana' ? '↑ Ārohaṇa' : '↓ Avarohaṇa'}</div>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', lineHeight: 1.9, overflowWrap: 'anywhere' }}>{note.solfa ?? '—'}</div>
                      {note.swarasthana && <div style={{ marginTop: 5, fontSize: '0.66rem', color: 'var(--text-muted)', overflowWrap: 'anywhere' }}>Swarasthāna: {note.swarasthana}</div>}
                      {(note.vowelSyllables || note.vowel_syllables) && <div style={{ marginTop: 4, fontSize: '0.66rem', color: 'var(--text-faint)', overflowWrap: 'anywhere' }}>Vocal syllables: {note.vowelSyllables ?? note.vowel_syllables}</div>}
                    </div>
                  })}
                  <div style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    <div><strong>Exercise:</strong> {selectedExercise.exerciseName}</div>
                    {selectedExercise.tala && <div style={{ marginTop: 4 }}><strong>Tāla:</strong> {selectedExercise.tala}</div>}
                    {selectedExercise.webNotation?.arohana && <div style={{ marginTop: 6 }}><strong>Web notation ↑</strong><div style={{ fontFamily: 'monospace', marginTop: 3 }}>{selectedExercise.webNotation.arohana}</div></div>}
                    {selectedExercise.webNotation?.avarohana && <div style={{ marginTop: 6 }}><strong>Web notation ↓</strong><div style={{ fontFamily: 'monospace', marginTop: 3 }}>{selectedExercise.webNotation.avarohana}</div></div>}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Existing scale notation display */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-3)' }}>

            {/* Ārohaṇa card */}
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', padding: 'var(--space-4)', border: playing && playPhase === 'aro' ? '1px solid var(--accent)' : '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.7rem', color: '#86efac', fontWeight: 700, marginBottom: 'var(--space-2)' }}>↑ Ārohaṇa</div>
              <div style={{ lineHeight: 2.2 }}>
                {aroTokens.map((tok, ti) => {
                  const ei = aroDispMap[ti]
                  const isActive = playing && playPhase === 'aro' && activeEvIdx?.phase === 'aro' && activeEvIdx.i === ei && ei >= 0 && !aroEvents[ei]?.isRest
                  const isTala = tok === '|' || tok === '||'
                  const activeInfo = isActive && ei >= 0 ? aroEvents[ei]?.noteInfo : null
                  const activeBg = activeInfo ? (SVARA_INFO[activeInfo.svaraKey]?.colour ?? 'var(--accent)') : 'var(--accent)'
                  return (
                    <span key={ti} style={{ display: 'inline-block', fontFamily: 'monospace', fontSize: '0.88rem', padding: isTala ? '0 3px' : '2px 6px', marginRight: 2, borderRadius: 4, background: isActive ? activeBg : 'transparent', color: isActive ? '#000' : tokenColour(tok), fontWeight: isActive ? 800 : 400, opacity: isTala ? 0.35 : 1, transition: 'background 0.05s' }}>
                      {tok}
                    </span>
                  )
                })}
              </div>
            </div>

            {/* Avarohaṇa card */}
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', padding: 'var(--space-4)', border: playing && playPhase === 'avro' ? '1px solid #c4b5fd' : '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.7rem', color: '#c4b5fd', fontWeight: 700, marginBottom: 'var(--space-2)' }}>↓ Avarohaṇa</div>
              <div style={{ lineHeight: 2.2 }}>
                {avroTokens.map((tok, ti) => {
                  const ei = avroDispMap[ti]
                  const isActive = playing && playPhase === 'avro' && activeEvIdx?.phase === 'avro' && activeEvIdx.i === ei && ei >= 0 && !avroEvents[ei]?.isRest
                  const isTala = tok === '|' || tok === '||'
                  const activeInfo = isActive && ei >= 0 ? avroEvents[ei]?.noteInfo : null
                  const activeBg = activeInfo ? (SVARA_INFO[activeInfo.svaraKey]?.colour ?? '#c4b5fd') : '#c4b5fd'
                  return (
                    <span key={ti} style={{ display: 'inline-block', fontFamily: 'monospace', fontSize: '0.88rem', padding: isTala ? '0 3px' : '2px 6px', marginRight: 2, borderRadius: 4, background: isActive ? activeBg : 'transparent', color: isActive ? '#000' : tokenColour(tok), fontWeight: isActive ? 800 : 400, opacity: isTala ? 0.35 : 1, transition: 'background 0.05s' }}>
                      {tok}
                    </span>
                  )
                })}
              </div>
            </div>

            {/* Omitted svaras + type info card */}
            {(selected.omittedSvaras || selected.type !== 'sampurna') && (
              <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', padding: 'var(--space-4)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>Scale structure</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <div><span style={{ color: 'var(--accent)' }}>Type:</span> {selected.type}</div>
                  {selected.omittedSvaras && (
                    <div>
                      <span style={{ color: 'var(--accent)' }}>Omitted: </span>
                      {selected.omittedSvaras.join(', ')}
                    </div>
                  )}
                  <div style={{ marginTop: 4, fontSize: '0.68rem', color: 'var(--text-faint)' }}>
                    Audava = 5 notes · Shadava = 6 notes · Sampurna = 7 notes
                  </div>
                </div>
              </div>
            )}

            {/* Famous kritis */}
            {selected.famousKritis && selected.famousKritis.length > 0 && (
              <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', padding: 'var(--space-4)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>Famous Kṛtis in this rāga</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  {selected.famousKritis.map((k, i) => (
                    <div key={i} style={{ fontSize: '0.78rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: 'var(--accent)', fontSize: '0.6rem' }}>♬</span> {k}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}