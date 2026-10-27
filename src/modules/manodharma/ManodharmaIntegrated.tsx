import React, { useState } from 'react'
import { ManodharmaPractice } from './ManodharmaPractice'
import { ManodharmaKorvaiUI } from './ManodharmaKorvaiUI'

type Section = 'practice' | 'learning'

interface Props {
  onBack: () => void
}

/**
 * Integration shell for the existing swara/raga practice page and the
 * book-aligned Manodharma + Korvai learning suite. Each module stays separate
 * so their content and existing functionality are not overwritten.
 */
export function ManodharmaIntegrated({ onBack }: Props) {
  const [section, setSection] = useState<Section>('practice')

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: '1 1 220px',
    borderRadius: 12,
    padding: '12px 16px',
    border: active ? '2px solid #c4b5fd' : '1px solid #475569',
    background: active ? 'linear-gradient(135deg, rgba(124,58,237,.32), rgba(14,165,233,.18))' : '#0f172a',
    color: active ? '#fff' : '#cbd5e1',
    cursor: 'pointer',
    fontWeight: 750,
    textAlign: 'center',
  })

  return (
    <main style={{ minHeight: '100%', background: '#090d18', color: '#f8fafc' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '14px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: '#c4b5fd', fontWeight: 800 }}>Bhāva Music Studio</div>
            <h1 style={{ margin: '5px 0', fontSize: 'clamp(1.25rem, 3vw, 1.8rem)' }}>Manodharma Learning & Practice</h1>
            <p style={{ margin: 0, color: '#cbd5e1', lineHeight: 1.5 }}>Practise rāga swaras, learn Manodharma concepts, and explore Kōrvai construction.</p>
          </div>
          <button type="button" onClick={onBack} style={{ borderRadius: 10, padding: '9px 13px', border: '1px solid #a78bfa', background: '#312e81', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>← Back to Music Builder</button>
        </div>
        <nav aria-label="Manodharma sections" style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
          <button type="button" aria-pressed={section === 'practice'} onClick={() => setSection('practice')} style={tabStyle(section === 'practice')}>🎼 Rāga Practice & Recordings</button>
          <button type="button" aria-pressed={section === 'learning'} onClick={() => setSection('learning')} style={tabStyle(section === 'learning')}>📚 Manodharma Guide & Kōrvai Lab</button>
        </nav>
      </div>
      <div style={{ display: section === 'practice' ? 'block' : 'none' }} aria-hidden={section !== 'practice'}>
        <ManodharmaPractice onBack={onBack} />
      </div>
      <div style={{ display: section === 'learning' ? 'block' : 'none' }} aria-hidden={section !== 'learning'}>
        <ManodharmaKorvaiUI />
      </div>
    </main>
  )
}

export default ManodharmaIntegrated
