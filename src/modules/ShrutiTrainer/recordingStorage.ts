export interface StoredShrutiRecording {
  id: string
  name: string
  date: string
  durationSec: number
  mimeType: string
  blob: Blob
}

export type ShrutiRecordingMetadata = Omit<StoredShrutiRecording, 'blob'>

const DB_NAME = 'naada-shruti-recordings'
const DB_VERSION = 1
const STORE_NAME = 'recordings'
const LEGACY_KEY = 'shruti_recordings'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this browser.'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Could not open recording storage.'))
    request.onblocked = () => reject(new Error('Recording storage is blocked by another browser tab.'))
  })
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Recording storage request failed.'))
  })
}

export async function listShrutiRecordings(): Promise<ShrutiRecordingMetadata[]> {
  const db = await openDatabase()
  try {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const records = await requestResult(tx.objectStore(STORE_NAME).getAll()) as StoredShrutiRecording[]
    return records
      .map(({ blob: _blob, ...metadata }) => metadata)
      .sort((a, b) => Number(b.id) - Number(a.id))
  } finally {
    db.close()
  }
}

export async function getShrutiRecording(id: string): Promise<StoredShrutiRecording | null> {
  const db = await openDatabase()
  try {
    const tx = db.transaction(STORE_NAME, 'readonly')
    return await requestResult(tx.objectStore(STORE_NAME).get(id)) as StoredShrutiRecording | undefined ?? null
  } finally {
    db.close()
  }
}

export async function saveShrutiRecording(recording: StoredShrutiRecording): Promise<void> {
  const db = await openDatabase()
  try {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(recording)
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error ?? new Error('Could not save recording.'))
      tx.onabort = () => reject(tx.error ?? new Error('Recording save was cancelled.'))
    })
  } finally {
    db.close()
  }
}

export async function deleteShrutiRecording(id: string): Promise<void> {
  const db = await openDatabase()
  try {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(id)
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error ?? new Error('Could not delete recording.'))
      tx.onabort = () => reject(tx.error ?? new Error('Recording deletion was cancelled.'))
    })
  } finally {
    db.close()
  }
}

/**
 * Imports legacy Base64 recordings without deleting the source until every
 * entry has been stored successfully. IDs are retained, making retries safe.
 */
export async function migrateLegacyShrutiRecordings(): Promise<number> {
  const raw = localStorage.getItem(LEGACY_KEY)
  if (!raw) return 0

  let legacy: Array<{
    id?: string
    name?: string
    date?: string
    durationSec?: number
    dataUrl?: string
  }>

  try {
    legacy = JSON.parse(raw)
    if (!Array.isArray(legacy)) throw new Error('Legacy recording data is not a list.')
  } catch {
    throw new Error('Legacy Śruti recordings could not be read. The original data has been preserved.')
  }

  let migrated = 0
  for (const item of legacy) {
    if (!item.dataUrl || typeof item.dataUrl !== 'string') {
      throw new Error('A legacy recording is missing its audio data. Original data has been preserved.')
    }
    const response = await fetch(item.dataUrl)
    const blob = await response.blob()
    if (!blob.size) throw new Error('A legacy recording contains no audio. Original data has been preserved.')

    const mimeType = blob.type || item.dataUrl.match(/^data:([^;,]+)/)?.[1] || 'audio/webm'
    await saveShrutiRecording({
      id: item.id || `legacy-${Date.now()}-${migrated}`,
      name: item.name || 'Imported recording',
      date: item.date || new Date().toLocaleString(),
      durationSec: Number(item.durationSec) || 0,
      mimeType,
      blob,
    })
    migrated++
  }

  // Remove only after all entries have been committed to IndexedDB.
  localStorage.removeItem(LEGACY_KEY)
  return migrated
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => typeof reader.result === 'string'
      ? resolve(reader.result)
      : reject(new Error('Could not prepare the recording for Gāna Builder.'))
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the recording.'))
    reader.readAsDataURL(blob)
  })
}
