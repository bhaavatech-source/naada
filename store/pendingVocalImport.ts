
export interface PendingVocalImport {
  type: 'shruti-recording'
  name: string
  date: string
  dataUrl: string
}

let pendingImport: PendingVocalImport | null = null

export function setPendingVocalImport(
  recording: PendingVocalImport
): void {
  pendingImport = recording
}

export function consumePendingVocalImport():
  PendingVocalImport | null {
  const recording = pendingImport
  pendingImport = null
  return recording
}
