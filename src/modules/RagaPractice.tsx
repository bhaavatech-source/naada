import { useState } from 'react'
import RagaLibrary from './RagaLibrary'
import JanyaPractice from './JanyaPractice'
import { useAppStore } from '../store/useAppStore'

export default function RagaPractice({ settingsContainer }: { settingsContainer?: HTMLDivElement | null }) {
  const target = useAppStore(state => state.ragaPracticeTarget)
  const [view, setView] = useState<'melakarta' | 'janya'>(target?.family ?? 'melakarta')
  return <section style={{ flex: 1, minHeight: 0, minWidth: 0, display: 'flex', flexDirection: 'column' }} aria-label="Raaga practice">
    <div role="group" aria-label="Raaga family" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
      {(['melakarta', 'janya'] as const).map(family => <button key={family} aria-pressed={view === family}
        onClick={() => setView(family)}
        style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', color: 'var(--text)', background: view === family ? 'var(--accent-dim)' : 'var(--surface)' }}>
        {family === 'melakarta' ? '72 Melakartas' : 'Janya & Vakra'}
      </button>)}
    </div>
    {view === 'melakarta'
      ? <RagaLibrary settingsContainer={settingsContainer} initialMelakarta={target?.family === 'melakarta' ? target.number : undefined} />
      : <JanyaPractice settingsContainer={settingsContainer} initialRagaId={target?.family === 'janya' ? target.id : undefined} />}
  </section>
}
