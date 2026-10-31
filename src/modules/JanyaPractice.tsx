import { createPortal } from 'react-dom'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getAudioContext, getAudioOutputTime } from '../audio/engine'
import { MELAKARTAS } from '../data/ragas'
import { useAppStore } from '../store/useAppStore'
import { SVARA_REGISTRY, resolveSvaraPitch } from '../music/tuning'
import { SvaraValidationError } from '../music/svaraValidation'
import {
  JANYA_CATEGORIES, normalizeJanyaName, validateJanyaExercise,
  buildJanyaPlaybackPlan, janyaNotationTokens, janyaEventIndexAtTime,
  type JanyaCategory, type JanyaExercise, type JanyaPracticeData, type JanyaSpeed, type JanyaDirection,
} from '../music/janyaCurriculum'
import { synthNoteJI } from './RagaLibrary'
import './janya-practice.css'
import { RagaHandGuide, type PracticeClock } from '../components/RagaHandGuide'
import { integrateJanyaBooklet } from '../music/janyaBooklet'

type PracticeTab = 'scale' | 'exercises' | JanyaCategory | 'about'
type Segment = { key: string; notation: string; category?: JanyaCategory; displayTokenIndex?: number }
type ActiveNote = { key: string; tokenIndex: number; token: string; svaraId: keyof typeof SVARA_REGISTRY; octave: number }

async function fetchData(name: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/${name}`, { signal })
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`)
  return response.json()
}

function exerciseSegments(exercise: JanyaExercise, category: JanyaCategory, direction: JanyaDirection): Segment[] {
  const hasParts = exercise.sections.some(section => !section.direction)
  return exercise.sections.flatMap((section, index) =>
    (hasParts ? !section.direction : direction === 'both' || section.direction === direction)
      ? [{ key: `${category}:${exercise.id}:${index}`, notation: section.notation.swarasthana, category }]
      : [])
}

function notationError(segments: Segment[], parent: number): string {
  if (!segments.length) return 'No notation is supplied for this direction.'
  try {
    for (const segment of segments) {
      if (!janyaNotationTokens(segment.notation, parent).some(token => token.item?.kind === 'note')) {
        return 'No playable notes are supplied.'
      }
    }
    return ''
  } catch (error) {
    if (!(error instanceof SvaraValidationError)) throw error
    return 'This exercise notation needs correction. Practise the rāga scale above instead.'
  }
}

export default function JanyaPractice({ settingsContainer, initialRagaId }: { settingsContainer?: HTMLDivElement | null; initialRagaId?: string }) {
  const settings = useAppStore(state => state.settings)
  const [data, setData] = useState<(JanyaPracticeData & { bookletReview?: ReturnType<typeof integrateJanyaBooklet>['bookletReview'] }) | null>(null)
  const [loadError, setLoadError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [search, setSearch] = useState('')
  const [kind, setKind] = useState('all')
  const [parent, setParent] = useState('')
  const [page, setPage] = useState(0)
  const [selectedId, setSelectedId] = useState(initialRagaId ?? '')
  const [category, setCategory] = useState<PracticeTab>('exercises')
  const [playingKey, setPlayingKey] = useState('')
  const [speed, setSpeed] = useState<JanyaSpeed>(1)
  const [direction, setDirection] = useState<JanyaDirection>('both')
  const [loop, setLoop] = useState(false)
  const [practiceClock, setPracticeClock] = useState<PracticeClock | null>(null)
  const [handGuideSettingsContainer, setHandGuideSettingsContainer] = useState<HTMLDivElement | null>(null)
  const loopRef = useRef(false)
  const [playStatus, setPlayStatus] = useState('')
  const [playError, setPlayError] = useState('')
  const [activeNote, setActiveNote] = useState<ActiveNote | null>(null)
  const version = useRef(0)
  const animation = useRef(0)
  const stopScheduler = useRef<(() => void) | null>(null)
  const cancelNotes = useRef<{ end: number; cancel: () => void }[]>([])
  const practiceContent = useRef<HTMLDivElement | null>(null)
  const pageSize = 60

  useEffect(() => {
    const controller = new AbortController()
    setData(null)
    setLoadError('')
    fetchData('janya_vakra_ragas_exercises_200.json', controller.signal).then(booklet => {
      if (!controller.signal.aborted) {
        const integrated = integrateJanyaBooklet(booklet)
        if (initialRagaId && !integrated.ragas.some(raga => raga.id === initialRagaId)) {
          throw new Error(`The linked rāga is not available for practice: ${initialRagaId}`)
        }
        if (initialRagaId) setPage(Math.floor(integrated.ragas.findIndex(raga => raga.id === initialRagaId) / pageSize))
        setData(integrated)
      }
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : String(error))
    })
    return () => controller.abort()
  }, [attempt, initialRagaId])

  const matches = useMemo(() => {
    const query = normalizeJanyaName(search)
    return (data?.ragas ?? []).filter(raga =>
      (!query || normalizeJanyaName(raga.name).includes(query) || normalizeJanyaName(raga.id).includes(query) || String(raga.parent) === search.trim()) &&
      (!parent || raga.parent === Number(parent)) &&
      (kind !== 'curriculum' || Object.values(raga.exercises).some(exercises => exercises.length > 0)) &&
      (kind !== 'vakra' || raga.isVakra))
  }, [data, search, parent, kind])
  const selected = matches.find(raga => raga.id === selectedId) ?? matches[0]
  const lastPage = Math.max(0, Math.ceil(matches.length / pageSize) - 1)
  const currentPage = Math.min(page, lastPage)
  const exercisePlans = useMemo(() => selected ? (Object.keys(JANYA_CATEGORIES) as JanyaCategory[]).flatMap(key =>
    (selected.exercises[key] ?? []).map(exercise => {
      const segments = exerciseSegments(exercise, key, direction)
      const issues = validateJanyaExercise(selected, exercise, data?.releaseStatus)
      return { exercise, category: key, segments, error: issues.length ? issues.join(' ') : notationError(segments, selected.parent) }
    })) : [], [selected, direction, data?.releaseStatus])
  const visibleExercisePlans = category === 'exercises' ? exercisePlans : exercisePlans.filter(plan => plan.category === category)
  const selectedExerciseCount = selected?.exerciseReviewSummary?.accepted ?? 0

  useEffect(() => {
    setCategory('exercises')
    if (practiceContent.current) practiceContent.current.scrollTop = 0
  }, [selected?.id])

  const stop = useCallback(() => {
    version.current++
    cancelAnimationFrame(animation.current)
    stopScheduler.current?.()
    stopScheduler.current = null
    cancelNotes.current.forEach(note => note.cancel())
    cancelNotes.current = []
    setPlayingKey('')
    setPlayStatus('')
    setActiveNote(null)
    setPracticeClock(null)
  }, [])

  useEffect(() => {
    stop()
    setPlayError('')
    return stop
  }, [selected?.id, speed, direction, settings.tonicHz, settings.bpm, settings.instrument, settings.volume, stop])

  const play = async (segments: Segment[], label: string, key: string) => {
    stop()
    setPlayError('')
    if (!selected) return
    const playbackVersion = version.current
    try {
      if (selected.scalePlaybackBlocked) throw new Error('Playback is unavailable until this source interpretation or variant has been reviewed.')
      for (const segment of segments) {
        if (!segment.category) continue
        const exercisePlan = exercisePlans.find(plan => plan.category === segment.category && plan.segments.some(item => item.key === segment.key))
        if (!exercisePlan || exercisePlan.error) throw new Error(exercisePlan?.error || 'Exercise has not passed review.')
      }
      const error = notationError(segments, selected.parent)
      if (error) throw new Error(error)
      // The display and audio consume the same explicit notation. Never substitute solfa.
      const plan = buildJanyaPlaybackPlan(segments.map(segment => segment.notation), selected.parent, settings.bpm, speed)
      const ctx = getAudioContext()
      if (ctx.state === 'suspended') await ctx.resume()
      if (playbackVersion !== version.current) return
      if (ctx.state !== 'running') throw new Error('Audio is not running. Check browser audio permissions.')
      setPlayingKey(key)
      setPlayStatus(`Playing ${label} · ${settings.bpm} BPM · ${speed}×`)
      let startAt = ctx.currentTime + 0.08
      setPracticeClock({ startAt, endAt: startAt + plan.durationSeconds })
      let nextToSchedule = 0
      let displayedIndex = -1

      const fail = (error: unknown) => {
        stop()
        setPlayError(error instanceof Error ? error.message : String(error))
      }
      const scheduleAudio = () => {
        if (version.current !== playbackVersion) return
        try {
          if (ctx.state !== 'running') throw new Error('Audio was interrupted. Press Play to resume.')
          const now = ctx.currentTime
          cancelNotes.current = cancelNotes.current.filter(note => note.end > now)
          // Keep audio independent of animation frames; allow for background timer throttling.
          const lookahead = document.hidden ? 2 : 0.25
          while (nextToSchedule < plan.events.length && startAt + plan.events[nextToSchedule].startSeconds < now + lookahead) {
            const event = plan.events[nextToSchedule++]
            if (event.item.kind !== 'note') continue
            const at = startAt + event.startSeconds
            const end = at + event.durationSeconds
            if (end <= now) continue
            const pitch = resolveSvaraPitch({
              svaraId: event.item.token.svaraId, octave: event.item.token.octave,
              tonicHz: settings.tonicHz, tuningPolicy: 'just_intonation',
            })
            cancelNotes.current.push({
              end: end + 0.5,
              cancel: synthNoteJI(settings.tonicHz, pitch.frequencyHz / settings.tonicHz, null,
                event.item.durationBeats, (end - Math.max(at, now)) / event.item.durationBeats,
                settings.instrument, settings.volume, Math.max(at, now)),
            })
          }
          if (getAudioOutputTime(ctx) - startAt >= plan.durationSeconds + 0.3) {
            if (loopRef.current) {
              startAt = ctx.currentTime + 0.08
              setPracticeClock({ startAt, endAt: startAt + plan.durationSeconds })
              nextToSchedule = 0
              displayedIndex = -1
              setActiveNote(null)
            } else {
              stop()
              setPlayStatus(`Finished ${label}.`)
              return
            }
          }
        } catch (error) {
          fail(error)
        }
      }
      const tick = () => {
        if (version.current !== playbackVersion) return
        // Use the speaker/output clock for visuals, not the render-ahead audio clock.
        const activeIndex = janyaEventIndexAtTime(plan.events, getAudioOutputTime(ctx) - startAt)
        const event = plan.events[activeIndex]
        if (activeIndex !== displayedIndex) {
          displayedIndex = activeIndex
          if (activeIndex >= 0 && event.item.kind === 'note') {
            const segment = segments[event.phraseIndex]
            setActiveNote({
              key: segment.key, tokenIndex: segment.displayTokenIndex ?? event.tokenIndex,
              token: event.item.token.raw, svaraId: event.item.token.svaraId, octave: event.item.token.octave,
            })
            if (segment.category) setCategory(current => current === 'exercises' ? current : segment.category ?? current)
          } else setActiveNote(null)
        }
        animation.current = requestAnimationFrame(tick)
      }
      const timer = window.setInterval(scheduleAudio, 50)
      document.addEventListener('visibilitychange', scheduleAudio)
      stopScheduler.current = () => {
        clearInterval(timer)
        document.removeEventListener('visibilitychange', scheduleAudio)
      }
      scheduleAudio()
      tick()
    } catch (error) {
      if (version.current !== playbackVersion) return
      stop()
      setPlayError(error instanceof Error ? error.message : String(error))
    }
  }

  const playScale = (scaleDirection: JanyaDirection = direction) => {
    if (!selected) return
    const directions = scaleDirection === 'both' ? ['arohana', 'avarohana'] as const : [scaleDirection]
    void play(directions.map(value => ({ key: value, notation: selected[value] })), `${selected.name} ${scaleDirection}`, `scale:${scaleDirection}`)
  }
  const selectTab = (tab: PracticeTab) => {
    stop()
    setPlayError('')
    setCategory(tab)
    if (practiceContent.current) practiceContent.current.scrollTop = 0
  }
  const tabs = [
    { id: 'scale' as const, label: 'Scale', count: undefined },
    { id: 'exercises' as const, label: 'Exercises', count: selectedExerciseCount },
    ...Object.entries(JANYA_CATEGORIES).filter(([key]) => (selected?.exercises[key as JanyaCategory]?.length ?? 0) > 0).map(([key, label]) => ({
      id: key as JanyaCategory, label, count: selected?.exercises[key as JanyaCategory]?.length ?? 0,
    })),
    { id: 'about' as const, label: 'About', count: undefined },
  ]

  const renderNotation = (notation: string, key: string, interactive = false) => {
    if (!selected) return null
    try {
      return janyaNotationTokens(notation, selected.parent).map(({ raw, item }, tokenIndex) => {
        const active = activeNote?.key === key && activeNote.tokenIndex === tokenIndex
        const className = active ? 'janya-note-active' : 'janya-note'
        if (interactive && !selected.scalePlaybackBlocked && item?.kind === 'note') {
          const definition = SVARA_REGISTRY[item.token.svaraId]
          return <button key={tokenIndex} className={className} aria-current={active ? 'true' : undefined}
            title={`${definition.traditionalName} · ${item.token.octave === 1 ? 'upper' : item.token.octave < 0 ? 'lower' : 'middle'} octave`}
            onClick={() => void play([{ key, notation: raw, displayTokenIndex: tokenIndex }], `${selected.name} ${raw}`, `note:${key}:${tokenIndex}`)}>
            {raw}
          </button>
        }
        return <span key={tokenIndex} className={className} aria-current={active ? 'true' : undefined}>{raw === ',' ? '—' : raw}{' '}</span>
      })
    } catch (error) {
      if (!(error instanceof SvaraValidationError)) throw error
      return <span>{notation}</span>
    }
  }

  const renderScales = () => selected && <div className="janya-scale-cards">
    {(['arohana', 'avarohana'] as const).map(value => {
      const count = janyaNotationTokens(selected[value], selected.parent).filter(token => token.item?.kind === 'note').length
      return <section className="janya-scale-card" key={value}>
        <div className="janya-exercise-heading">
          <h3>{value === 'arohana' ? '↑ Arohaṇa' : '↓ Avarohaṇa'}</h3>
          <button disabled={selected.scalePlaybackBlocked} onClick={() => playingKey === `scale:${value}` ? stop() : playScale(value)}>{playingKey === `scale:${value}` ? 'Stop' : 'Play'}</button>
        </div>
        <div className="janya-setting-notation" data-scale={value}>{renderNotation(selected[value], value, true)}</div>
        <small>{count} notes in this direction · {selected.scalePlaybackBlocked ? 'Playback awaits source/variant review' : 'Select any note to hear it'}</small>
      </section>
    })}
  </div>

  const filters = <div className="janya-filters">
    <label>Search rāga or parent number<input aria-label="Search rāgas" value={search} placeholder="Name or parent number"
      onChange={event => { stop(); setSearch(event.target.value); setPage(0) }} /></label>
    <label>Show<select aria-label="Show rāgas" value={kind} onChange={event => { stop(); setKind(event.target.value); setPage(0) }}>
      <option value="all">All Janyas & Vakras ({data?.ragas.length ?? 0})</option>
      <option value="vakra">Vakras only</option>
      <option value="curriculum">With exercise notes ({data?.curriculumCount ?? 0})</option>
    </select></label>
    <label>Parent Melakarta<select aria-label="Parent Melakarta" value={parent} onChange={event => { stop(); setParent(event.target.value); setPage(0) }}>
      <option value="">All parents</option>
      {MELAKARTAS.map(mela => <option key={mela.number} value={mela.number}>{mela.number}. {mela.name}</option>)}
    </select></label>
  </div>

  return <div className="janya-practice">
    {!data && !loadError && <p role="status">Loading Janya catalogue and exercise notes…</p>}
    {loadError && <div role="alert"><p>Could not load Janya practice: {loadError}</p><button onClick={() => setAttempt(value => value + 1)}>Retry loading</button></div>}
    {data && <>
      <div className="janya-browser">
        <label>Choose a Janya or Vakra rāga<select aria-label="Choose a Janya or Vakra rāga" value={selected?.id ?? ''}
          onChange={event => { stop(); setSelectedId(event.target.value); setCategory('exercises'); setPage(Math.floor(matches.findIndex(raga => raga.id === event.target.value) / pageSize)) }}>
          {!matches.length && <option value="">No matching rāgas</option>}
          {matches.map(raga => <option key={raga.id} value={raga.id}>{raga.name} · Mel {raga.parent}{raga.isVakra ? ' · Vakra' : ''}</option>)}
        </select></label>
        <p className="janya-match-count" role="status">{matches.length.toLocaleString()} rāgas · Choose above or tap one in the list</p>
      </div>
      <div className="janya-layout">
        <aside className="janya-list-pane" aria-label="Janya and Vakra rāgas">
          <div className="janya-list-heading"><strong>Browse rāgas</strong><span>Scroll the list to see more</span></div>
          <div className="janya-results">
            {matches.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map(raga =>
              <button key={raga.id} aria-pressed={selected?.id === raga.id}
                onClick={() => { stop(); setSelectedId(raga.id); setCategory('exercises') }}>
                <strong>{raga.name}</strong><small>Mel {raga.parent}{raga.isVakra ? ' · Vakra' : ''} · {raga.exerciseReviewSummary?.accepted ?? 0} exercises</small>
              </button>)}
          </div>
          <div className="janya-pages">
            <button disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Previous</button>
            <span>Page {currentPage + 1} of {lastPage + 1}</span>
            <button disabled={currentPage === lastPage} onClick={() => setPage(currentPage + 1)}>Next</button>
          </div>
        </aside>
        <article className="janya-detail-pane">
          <header className="janya-detail-header"><h2>{selected?.name ?? 'No matching rāgas'}</h2>
            {playingKey && <button onClick={stop}>Stop playback</button>}
          </header>
          {selected && <nav className="janya-tabs" aria-label="Practice sections">{tabs.map(tab =>
            <button key={tab.id} aria-pressed={category === tab.id} onClick={() => selectTab(tab.id)}>
              {tab.label}{tab.count !== undefined && <span>{tab.count}</span>}
            </button>)}</nav>}
          {(playStatus || playError) && <p className={playError ? 'janya-play-error' : 'janya-play-status'} role={playError ? 'alert' : 'status'}>{playError || playStatus}</p>}
          <div className="janya-practice-content" ref={practiceContent}>
            {!selected ? <p>No matching rāgas. Change the search or filters in Settings.</p> : <>
              {!!selected.exerciseReviewSummary?.issues?.length && <p className="janya-unplayable" role="alert">
                Some exercise groups could not be assessed: {selected.exerciseReviewSummary.issues.join(' ')} The verified scale is still available.
              </p>}
              {category === 'scale' || category === 'about' ? renderScales() :
                <details className="janya-notice"><summary>Playable scale · Arohaṇa & Avarohaṇa</summary>{renderScales()}</details>}
              <RagaHandGuide clock={practiceClock} bpm={settings.bpm} settingsContainer={handGuideSettingsContainer}/>
              {activeNote && <p className="janya-live-note" aria-live="polite">{activeNote.token} · {SVARA_REGISTRY[activeNote.svaraId].traditionalName} · {activeNote.octave > 0 ? 'Upper' : activeNote.octave < 0 ? 'Lower' : 'Middle'} octave</p>}
              {category === 'about' ? <section className="janya-about">
                <h3>About {selected.name}</h3>
                <dl><dt>Rāga type</dt><dd>{selected.isVakra ? 'Vakra Janya rāga' : 'Janya rāga'}</dd>
                  <dt>Parent Melakarta</dt><dd>{selected.parent}. {MELAKARTAS.find(mela => mela.number === selected.parent)?.name}</dd></dl>
              </section> : category !== 'scale' && <section aria-label="Exercise notes">
                <h3>{category === 'exercises' ? 'Exercise notes' : `${JANYA_CATEGORIES[category]} exercise notes`}</h3>
                {!visibleExercisePlans.length && <div className="janya-notice">
                  <p>No exercise notes available. You can practise the scale in the Scale tab.</p>
                  <button onClick={() => { stop(); setSearch(''); setParent(''); setKind('curriculum'); setSelectedId(''); setPage(0); setCategory('exercises') }}>
                    Show rāgas with exercise notes ({data.curriculumCount})
                  </button>
                </div>}
                {visibleExercisePlans.map(({ exercise, segments, error, category: exerciseCategory }) => {
                  const key = `${exerciseCategory}:${exercise.id}`
                  const isPlaying = playingKey === key || !!activeNote?.key.startsWith(`${key}:`)
                  return <section className={`janya-exercise-card${isPlaying ? ' is-playing' : ''}`} key={key}>
                    <div className="janya-exercise-heading"><h3>{category === 'exercises' ? `${JANYA_CATEGORIES[exerciseCategory]} · ` : ''}{exercise.name}</h3>
                      <button disabled={!!error} onClick={() => isPlaying ? stop() : void play(segments, exercise.name, key)}>{isPlaying ? 'Stop' : 'Play'}</button>
                    </div>
                    {exercise.tala && <p className="janya-tala">Tāla: {exercise.tala}</p>}
                    {error && <p className="janya-unplayable">{error}</p>}
                    {exercise.sections.filter(section => !section.direction || direction === 'both' || section.direction === direction).map(section => {
                      const sectionIndex = exercise.sections.indexOf(section)
                      return <div className="janya-exercise-section" key={sectionIndex}><h4>{section.label}</h4>
                        <div className="janya-notation">{renderNotation(section.notation.swarasthana, `${key}:${sectionIndex}`)}</div>
                      </div>
                    })}
                  </section>
                })}
              </section>}
            </>}
          </div>
        </article>
      </div>
    </>}
    {settingsContainer && createPortal(<div className="janya-settings">
      <div ref={setHandGuideSettingsContainer}/>
      <h3>Choose a rāga</h3>{filters}
      {selected && <>
        <h3>{selected.name} · Swarasthānas</h3>
        <div className="janya-live-note" aria-live="polite">{activeNote
          ? `${activeNote.token} · ${SVARA_REGISTRY[activeNote.svaraId].traditionalName} · ${activeNote.octave > 0 ? 'Upper' : activeNote.octave < 0 ? 'Lower' : 'Middle'} octave`
          : 'Play a scale or select a note to hear its pitch.'}</div>
        {renderScales()}
        <h3>Playback</h3>
        <div className="janya-setting-controls">
          <button className="janya-primary-play" disabled={selected.scalePlaybackBlocked} onClick={() => playingKey ? stop() : playScale()}>{playingKey ? 'Stop' : 'Play scale'}</button>
          <div role="group" aria-label="Practice speed">{([1, 2, 3] as const).map(value =>
            <button key={value} aria-pressed={speed === value} onClick={() => setSpeed(value)}>{value}×</button>)}</div>
          <div role="group" aria-label="Playback direction">{(['arohana', 'both', 'avarohana'] as const).map(value =>
            <button key={value} aria-pressed={direction === value} onClick={() => setDirection(value)}>
              {value === 'arohana' ? '↑ Aro' : value === 'avarohana' ? '↓ Avro' : '↑↓ Both'}</button>)}</div>
        </div>
        <button className="janya-loop-toggle" aria-pressed={loop} onClick={() => { loopRef.current = !loop; setLoop(!loop) }}>{loop ? '✓ Loop enabled' : '↻ Loop'}</button>
        <p>{settings.bpm} BPM · {speed} {speed === 1 ? 'note' : 'notes'} per beat · {settings.instrument}</p>
        <h3>{data?.exerciseCount ? 'Exercises' : 'Practice details'}</h3>
        <nav className="janya-setting-tabs" aria-label="Exercise groups in settings">{tabs.map(tab =>
          <button key={tab.id} aria-pressed={category === tab.id} onClick={() => selectTab(tab.id)}>{tab.label}{tab.count !== undefined && <small>{tab.count}</small>}</button>)}</nav>
        {!!selectedExerciseCount && <div className="janya-setting-controls">
          <button disabled={!visibleExercisePlans.some(plan => !plan.error) || category === 'scale' || category === 'about'}
            onClick={() => void play(visibleExercisePlans.filter(plan => !plan.error).flatMap(plan => plan.segments), `${selected.name} exercise group`, 'queue')}>Play All in group</button>
          <button disabled={!exercisePlans.some(plan => !plan.error)}
            onClick={() => void play(exercisePlans.filter(plan => !plan.error).flatMap(plan => plan.segments), `${selected.name} exercises`, 'queue')}>Play Rāga — all categories</button>
        </div>}
        {playError && <p role="alert" className="janya-play-error">{playError}</p>}
      </>}
    </div>, settingsContainer)}
  </div>
}
