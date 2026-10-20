// src/components/ExerciseCard.tsx

import type { VarisaiExercise } from '../data/mmg/types';
import { ExerciseLineDisplay } from './ExerciseLineDisplay';

interface Props {
  exercise: VarisaiExercise;
  isActive?: boolean;
  onSelect?: (id: string) => void;
}

export function ExerciseCard({ exercise, isActive = false, onSelect }: Props) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(exercise.id)}
      onKeyDown={(e) => e.key === 'Enter' && onSelect?.(exercise.id)}
      style={{
        borderRadius: 'var(--radius-xl)',
        border: `1px solid ${isActive ? 'var(--color-primary)' : 'var(--color-border)'}`,
        backgroundColor: isActive ? 'var(--color-primary-highlight)' : 'var(--color-surface)',
        padding: 'var(--space-4)',
        cursor: 'pointer',
        transition: 'box-shadow var(--transition-interactive), border-color var(--transition-interactive)',
        boxShadow: isActive ? 'var(--shadow-md)' : 'var(--shadow-sm)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
        <h3 style={{ fontWeight: 600, fontSize: 'var(--text-base)' }}>{exercise.name}</h3>
        <span style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-muted)',
          padding: '2px 8px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--color-surface-offset)',
        }}>
          {exercise.kind}
        </span>
      </div>

      {/* Notes */}
      {exercise.notes && (
        <p style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-muted)',
          marginBottom: 'var(--space-3)',
          lineHeight: 1.4,
        }}>
          {exercise.notes}
        </p>
      )}

      {/* Lines */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        {exercise.lines.map((line, i) => (
          <ExerciseLineDisplay key={i} line={line} />
        ))}
      </div>

      {/* Meta */}
      <div style={{
        marginTop: 'var(--space-3)',
        display: 'flex',
        gap: 'var(--space-3)',
        fontSize: 'var(--text-xs)',
        color: 'var(--color-text-muted)',
      }}>
        <span>Rāga: {exercise.raga}</span>
        <span>Tāla: {exercise.tala}</span>
      </div>
    </div>
  );
}