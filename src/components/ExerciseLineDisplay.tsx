// src/components/ExerciseLineDisplay.tsx

import type { VarisaiLine } from '../data/mmg/types';

interface Props {
  line: VarisaiLine;
}

export function ExerciseLineDisplay({ line }: Props) {
  const parts = line.display.split(/(\|{1,2})/);

  return (
    <p
      style={{
        fontFamily: 'monospace',
        fontSize: 'var(--text-base)',
        lineHeight: 1.8,
        letterSpacing: '0.05em',
        whiteSpace: 'pre-wrap',
        overflowWrap: 'normal',
        wordBreak: 'normal',
        maxWidth: '100%',
        minWidth: 0,
      }}
    >
      {parts.map((part: string, i: number) =>
        /^\|+$/.test(part) ? (
          <span
            key={i}
            style={{ color: 'var(--color-text-muted)', margin: '0 4px' }}
          >
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  );
}