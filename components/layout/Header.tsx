
import { useState } from 'react'
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
  raga: 'Rāga Library',
  janya: 'Janya Rāga Library',
  tala: 'Tāla Trainer',
  shruti: 'Śruti Trainer',
  resources: 'Resources',
  builder: 'Music Builder',
  progress: 'My Progress',
  about: 'About Nāda',
}

export default function Header() {
  const {
    module,
    settings,
    updateSettings,
    sidebarOpen,
    setSidebarOpen,
  } = useAppStore()

  const availableInstruments = INSTRUMENTS.filter(
    (i) => i.category === 'melodic' || i.category === 'percussion',
  )

  const [settingsOpen, setSettingsOpen] = useState(false)
  const isMobile =
    typeof window !== 'undefined' && window.innerWidth < 768

  const controlStyle = {
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '5px 7px',
    fontSize: '0.8rem',
    color: 'var(--text)',
    maxWidth: '100%',
  } as const

  return (
    <>
      <header
        style={{
          minHeight: 56,
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 var(--space-3)',
          gap: 'var(--space-2)',
          flexShrink: 0,
        }}
      >
        {isMobile && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle navigation"
            style={{
              background: 'var(--accent-dim)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              color: 'var(--accent)',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '1.1rem',
              flexShrink: 0,
            }}
          >
            ☰
          </button>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: isMobile ? '0.92rem' : '1.1rem',
              color: 'var(--accent)',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              margin: 0,
            }}
          >
            {MODULE_LABELS[module] ?? 'Nāda'}
          </h1>
        </div>

        <button
          type="button"
          aria-expanded={settingsOpen}
          aria-label={settingsOpen ? 'Close settings' : 'Open settings'}
          onClick={() => setSettingsOpen((open) => !open)}
          style={{
            background: settingsOpen ? 'var(--accent-dim)' : 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            color: 'var(--text)',
            minWidth: 38,
            height: 36,
            padding: '0 10px',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          ⚙️ {isMobile ? '' : 'Settings'}
        </button>
      </header>

      {settingsOpen && (
        <section
          aria-label="Music settings"
          style={{
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
            padding: '12px 16px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 14,
            alignItems: 'center',
          }}
        >
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
            Śruti
            <select
              value={settings.tonicHz}
              onChange={(e) =>
                updateSettings({ tonicHz: parseFloat(e.target.value) })
              }
              style={controlStyle}
            >
              {TONIC_OPTIONS.map((o) => (
                <option key={o.hz} value={o.hz}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
            BPM
            <input
              type="number"
              min={30}
              max={300}
              step={5}
              value={settings.bpm}
              onChange={(e) => {
                const bpm = Number(e.target.value)
                if (Number.isFinite(bpm) && bpm >= 30 && bpm <= 300) {
                  updateSettings({ bpm })
                }
              }}
              style={{ ...controlStyle, width: 68 }}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
            Instrument
            <select
              value={settings.instrument}
              onChange={(e) =>
                updateSettings({
                  instrument: e.target.value as InstrumentId,
                })
              }
              style={controlStyle}
            >
              {availableInstruments.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.icon} {i.label}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem' }}>
            🔊 Volume
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.volume}
              onChange={(e) =>
                updateSettings({ volume: parseFloat(e.target.value) })
              }
              style={{ width: 110, accentColor: 'var(--accent)' }}
            />
          </label>

          <button
            type="button"
            onClick={() => setSettingsOpen(false)}
            style={{
              ...controlStyle,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </section>
      )}
    </>
  )
}
