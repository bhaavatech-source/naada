import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { getAudioContext, getAudioOutputTime } from '../audio/engine'
import { TALAS } from '../data/talas'
import { kriyaForBeat, talaBeatAtTime, TALA_JATIS, withTalaJati } from '../music/talaPractice'
import { KriyaIllustration } from './KriyaIllustration'

export interface PracticeClock {
  startAt: number
  endAt: number
}

export function RagaHandGuide({ clock, bpm, settingsContainer }: {
  clock: PracticeClock | null
  bpm: number
  settingsContainer?: HTMLDivElement | null
}) {
  const [visible, setVisible] = useState(false)
  const [base, setBase] = useState(TALAS[0])
  const [jati, setJati] = useState(4)
  const [beat, setBeat] = useState(0)
  const id = useId()
  const tala = base.family === 'capu' ? base : withTalaJati(base, jati)

  useEffect(() => {
    setBeat(0)
    if (!visible || !clock) return
    let frame = 0
    const tick = () => {
      const now = getAudioOutputTime(getAudioContext())
      setBeat(talaBeatAtTime(Math.min(now, clock.endAt - 0.000001) - clock.startAt, bpm, tala.beats))
      if (now < clock.endAt) frame = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(frame)
  }, [visible, clock, bpm, tala.beats])

  const controls = <section aria-label="Hand guide settings" style={{minWidth:0,marginBottom:16}}>
    <h3 style={{fontSize:'1rem',marginTop:12}}>Hand guide</h3>
    <button type="button" aria-expanded={visible} aria-controls={id} onClick={() => setVisible(value => !value)}
      style={{padding:'8px 12px',border:'1px solid var(--border)',borderRadius:8,background:visible?'var(--accent-dim)':'var(--surface)',color:'var(--text)',cursor:'pointer'}}>
      {visible ? 'Hide hand guide' : 'Show hand guide'}
    </button>
    {visible && <div style={{marginTop:10}}>
      <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center',marginBottom:10}}>
        <label>Guide tāla <select value={base.id} onChange={event => {
          const selected = TALAS.find(item => item.id === event.target.value)
          if (!selected) throw new Error('Unknown guide tāla.')
          setBase(selected)
        }}>
          {TALAS.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select></label>
        {base.family !== 'capu' && <label>Jāti <select value={jati} onChange={event => setJati(Number(event.target.value))}>
          {TALA_JATIS.map(item => <option key={item.count} value={item.count}>{item.name} ({item.count})</option>)}
        </select></label>}
        <span style={{fontSize:12}}>{tala.beats} beats · {bpm} BPM</span>
      </div>
      <p style={{fontSize:12,color:'var(--text-muted)'}}>The animated hand appears on the practice page. Close Settings to follow it while playing.</p>
    </div>}
  </section>

  return <>
    {settingsContainer ? createPortal(controls, settingsContainer) : controls}
    {visible && <section id={id} aria-label="Raaga hand guide" style={{minWidth:0,marginTop:10}}>
      <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:8}}>{tala.name} · {tala.beats} beats · {bpm} BPM</div>
      <KriyaIllustration action={kriyaForBeat(tala, beat)} beatNo={beat + 1}/>
      <p style={{fontSize:12,color:'var(--text-muted)',lineHeight:1.5}}>
        Select the practice cycle with your teacher. This guide follows playback at the master BPM, independent of note speed, and restarts for each playback phrase. It does not infer the exercise's tāla or eduppu.
        {base.family === 'capu' && ' Cāpu gestures illustrate simplified pulse groups only; traditions vary.'}
      </p>
    </section>}
  </>
}
