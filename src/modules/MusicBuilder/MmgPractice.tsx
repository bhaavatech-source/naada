// src/modules/MusicBuilder/MmgPractice.tsx

import { useState, useMemo } from 'react';
import {
  saraliVarisaiMmg,
  jantaVarisaiMmg,
  dhatuVarisaiMmg,
  melsthayiVarisaiMmg,
  mandrasthayiVarisaiMmg,
  alankaramMmg,
} from '../../data/mmg';
import type { VarisaiKind } from '../../data/mmg/types';
import { ExerciseCard } from '../../components/ExerciseCard';
const TABS: { label: string; kind: VarisaiKind | 'all' }[] = [
  { label: 'All',          kind: 'all'                  },
  { label: 'Sarali',       kind: 'sarali'               },
  { label: 'Janta',        kind: 'janta'                },
  { label: 'Dhātu',        kind: 'dhatu'                },
  { label: 'Mēlsthāyi',   kind: 'melsthayiVarisai'     },
  { label: 'Mandrasthāyi', kind: 'mandhraSthayiVarisai' },
  { label: 'Alankāram',    kind: 'alankaram'            },
];

const ALL_EXERCISES = [
  ...saraliVarisaiMmg,
  ...jantaVarisaiMmg,
  ...dhatuVarisaiMmg,
  ...melsthayiVarisaiMmg,
  ...mandrasthayiVarisaiMmg,
  ...alankaramMmg,
];

export function MmgPractice() {
  const [activeTab, setActiveTab] = useState<VarisaiKind | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      activeTab === 'all'
        ? ALL_EXERCISES
        : ALL_EXERCISES.filter((ex) => ex.kind === activeTab),
    [activeTab]
  );

  return (
    <div style={{ maxWidth: 768, margin: '0 auto', padding: 'var(--space-8) var(--space-4)' }}>

      <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-1)' }}>
        MMG Varisai Practice
      </h1>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)' }}>
        Māyāmālavagowla · {ALL_EXERCISES.length} exercises
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
        {TABS.map((tab) => (
          <button
            key={tab.kind}
            onClick={() => setActiveTab(tab.kind)}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              background: activeTab === tab.kind ? 'var(--color-primary)' : 'var(--color-surface-offset)',
              color: activeTab === tab.kind ? '#ffffff' : 'var(--color-text-muted)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
        Showing {filtered.length} exercise{filtered.length !== 1 ? 's' : ''}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {filtered.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            isActive={selectedId === exercise.id}
            onSelect={setSelectedId}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--space-16) var(--space-8)', color: 'var(--color-text-muted)' }}>
          <p style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>No exercises found</p>
          <p style={{ fontSize: 'var(--text-sm)' }}>Try selecting a different category above.</p>
        </div>
      )}

    </div>
  );
}