export type RagaPracticeTarget =
  | { family: 'melakarta'; number: number }
  | { family: 'janya'; id: string }

export function readRagaPracticeTarget(value: unknown): RagaPracticeTarget | null {
  if (value === null) return null
  if (typeof value !== 'object' || !value) throw new Error('Invalid rāga practice link.')
  if ('family' in value && value.family === 'melakarta' && 'number' in value &&
    typeof value.number === 'number' && Number.isInteger(value.number) && value.number >= 1 && value.number <= 72) {
    return { family: 'melakarta', number: value.number }
  }
  if ('family' in value && value.family === 'janya' && 'id' in value &&
    typeof value.id === 'string' && /^[a-z0-9]+$/.test(value.id)) {
    return { family: 'janya', id: value.id }
  }
  throw new Error('Invalid rāga practice link.')
}
