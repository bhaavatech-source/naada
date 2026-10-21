import { useEffect, useState } from 'react'
import type { Ref } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { INSTRUMENTS } from '../../data/instruments'
import type { InstrumentId } from '../../types/index'

const TONIC_OPTIONS = [
  { label: 'C4 (Sa)', hz: 261.63 },
  { label: 'C#4', hz: 277.18 },
  { label: 'D4', hz: 293.66 },
  { label: 'D#4', hz: 311.13 },
  { label: 'E4', hz: 329.63 },
  { label: 'F4', hz: 349.23 },
  { label: 'F#4', hz: 369.99 },
  { label: 'G4', hz: 392.00 },
  { label: 'G#4', hz: 415.30 },
  { label: 'A4', hz: 440.00 },
  { label: 'A#4', hz: 466.16 },
  { label: 'B4', hz: 493.88 },
  { label: 'B3', hz: 246.94 },
  { label: 'A3', hz: 220.00 },
]

const MODULE_LABELS: Record<string, string> = {
  raga:'Rāga Library', janya: 'Janya Rāga Library', tala:'Tāla Trainer', shruti:'Śruti Trainer', gamaka:'Gamaka Trainer',
  resources:'Resources', builder:'Music Builder', progress:'My Progress', about:'About Nāda'
}

export default function Header({ moduleSettingsRef }: { moduleSettingsRef?: Ref<HTMLDivElement> }) {
  const { module, settings, updateSettings, sidebarOpen, setSidebarOpen } = useAppStore()
  const availableInstruments = INSTRUMENTS.filter(i => i.category === 'melodic' || i.category === 'percussion')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  const hasModuleSettings = module === 'raga' || module === 'builder'
  const showSettingsButton = module !== 'home' && (isMobile || hasModuleSettings)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => setSettingsOpen(false), [module])

  useEffect(() => {
    if (!settingsOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSettingsOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [settingsOpen])

  return (
    <>
      <header style={{
        height: 56, background:'var(--surface)', borderBottom:'1px solid var(--border)',
        display:'flex', alignItems:'center', padding:'0 var(--space-3)',
        gap:'var(--space-2)', flexShrink:0,
      }}>

        {/* Hamburger on mobile */}
        {isMobile && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background:'var(--accent-dim)', border:'1px solid var(--border)',
              borderRadius:'var(--radius)', color:'var(--accent)',
              width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', fontSize:'1.1rem', flexShrink:0,
            }}
          >☰</button>
        )}

        {/* Module title */}
        <div style={{ flex:1, minWidth:0 }}>
          <h1 style={{
            fontFamily:'var(--font-display)', fontSize: isMobile ? '0.92rem' : '1.1rem',
            color:'var(--accent)', fontWeight:700,
            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
            margin:0,
          }}>
            {MODULE_LABELS[module] ?? 'Nāda'}
          </h1>
        </div>

        {/* Desktop: inline controls */}
        {!isMobile && module !== 'home' && !hasModuleSettings && (
          <>
            <div style={{ display:'flex', alignItems:'center', gap:'var(--space-2)' }}>
              <label style={{ fontSize:'0.72rem', color:'var(--text-muted)', whiteSpace:'nowrap' }}>Śruti</label>
              <select value={settings.tonicHz} onChange={e => updateSettings({ tonicHz: parseFloat(e.target.value) })}
                style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'2px 6px', fontSize:'0.78rem', color:'var(--text)' }}>
                {TONIC_OPTIONS.map(o => <option key={o.hz} value={o.hz}>{o.label}</option>)}
              </select>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'var(--space-2)' }}>
              <label style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>BPM</label>
              <input type="number" min={30} max={300} step={5} value={settings.bpm}
                onChange={e => updateSettings({ bpm: parseInt(e.target.value) })}
                style={{ width:52, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'2px 6px', fontSize:'0.78rem', color:'var(--text)', textAlign:'center' }} />
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'var(--space-2)' }}>
              <label style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>Instrument</label>
              <select value={settings.instrument} onChange={e => updateSettings({ instrument: e.target.value as InstrumentId })}
                style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'2px 6px', fontSize:'0.78rem', color:'var(--text)' }}>
                {availableInstruments.map(i => <option key={i.id} value={i.id}>{i.icon} {i.label}</option>)}
              </select>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'var(--space-2)' }}>
              <span style={{ fontSize:'0.9rem' }}>🔊</span>
              <input type="range" min={0} max={1} step={0.05} value={settings.volume}
                onChange={e => updateSettings({ volume: parseFloat(e.target.value) })}
                style={{ width:70, accentColor:'var(--accent)' }} />
            </div>
          </>
        )}

        {/* Module settings are available at every viewport width. */}
        {showSettingsButton && (
          <button
            aria-label="Settings"
            aria-expanded={settingsOpen}
            aria-controls="app-settings"
            onClick={() => setSettingsOpen(!settingsOpen)}
            style={{
              background:'var(--surface2)', border:'1px solid var(--border)',
              borderRadius:'var(--radius)', color:'var(--text-muted)',
              width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', fontSize:'1rem', flexShrink:0,
            }}
          >⚙️</button>
        )}
      </header>

      {module !== 'home' && (
        <section id="app-settings" aria-label="Settings" hidden={!showSettingsButton || !settingsOpen}
          style={hasModuleSettings ? {
            position: 'absolute', top: 56, right: 0, zIndex: 30,
            width: module === 'builder' ? 'min(100%, 960px)' : 'min(100%, 480px)', maxHeight: 'calc(100dvh - 64px)',
            overflowY: 'auto', background: 'var(--surface)',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow)',
          } : { flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'var(--surface)', position: hasModuleSettings ? 'sticky' : undefined, top: 0, zIndex: 2 }}>
          <h2 style={{ fontSize: '1.1rem' }}>{module === 'raga' ? 'Rāga practice settings' : module === 'builder' ? 'Music Builder settings' : 'Settings'}</h2>
          <button onClick={() => setSettingsOpen(false)} aria-label="Close settings" style={{ padding: '6px 10px' }}>✕</button>
        </div>
        <div style={{
          background:'var(--surface)', borderBottom:'1px solid var(--border)',
          padding:'12px 16px', display:'flex', flexWrap:'wrap', gap:12, alignItems:'center',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <label style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>Śruti</label>
            <select value={settings.tonicHz} onChange={e => updateSettings({ tonicHz: parseFloat(e.target.value) })}
              style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'4px 6px', fontSize:'0.78rem', color:'var(--text)' }}>
              {TONIC_OPTIONS.map(o => <option key={o.hz} value={o.hz}>{o.label}</option>)}
            </select>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <label style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>BPM</label>
            <input type="number" min={30} max={300} step={5} value={settings.bpm}
              onChange={e => updateSettings({ bpm: parseInt(e.target.value) })}
              style={{ width:56, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'4px 6px', fontSize:'0.78rem', color:'var(--text)', textAlign:'center' }} />
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <label style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>Instrument</label>
            <select value={settings.instrument} onChange={e => updateSettings({ instrument: e.target.value as InstrumentId })}
              style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'4px 6px', fontSize:'0.78rem', color:'var(--text)' }}>
              {availableInstruments.map(i => <option key={i.id} value={i.id}>{i.icon} {i.label}</option>)}
            </select>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:'0.9rem' }}>🔊</span>
            <input type="range" min={0} max={1} step={0.05} value={settings.volume}
              onChange={e => updateSettings({ volume: parseFloat(e.target.value) })}
              style={{ width:100, accentColor:'var(--accent)' }} />
          </div>
        </div>
        <div ref={moduleSettingsRef} />
        </section>
      )}
    </>
  )
}