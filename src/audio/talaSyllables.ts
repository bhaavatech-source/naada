const SYLLABLES = ['ta', 'ka', 'di', 'mi', 'ki'] as const
export type TalaSyllableBuffers = Map<string, AudioBuffer>

export async function loadTalaSyllables(ctx: AudioContext, baseUrl: string, signal: AbortSignal): Promise<TalaSyllableBuffers> {
  const entries = await Promise.all(SYLLABLES.map(async syllable => {
    const response = await fetch(`${baseUrl}audio/tala/${syllable}.wav`, { signal })
    if (!response.ok) throw new Error(`Could not load rhythm syllable ${syllable}: HTTP ${response.status}`)
    const buffer = await ctx.decodeAudioData(await response.arrayBuffer())
    return [syllable, buffer] as const
  }))
  return new Map(entries)
}

export function scheduleTalaSyllable(ctx: AudioContext, buffers: TalaSyllableBuffers, syllable: string, at: number, slotSeconds: number, volume: number): AudioBufferSourceNode {
  const buffer = buffers.get(syllable)
  if (!buffer) throw new Error(`Missing rhythm syllable: ${syllable}`)
  const source = ctx.createBufferSource()
  const gain = ctx.createGain()
  source.buffer = buffer
  const rate = Math.max(1, buffer.duration / (slotSeconds * 0.9))
  source.playbackRate.value = rate
  const end = at + buffer.duration / rate
  gain.gain.setValueAtTime(volume * 0.65, at)
  gain.gain.setValueAtTime(volume * 0.65, Math.max(at, end - 0.008))
  gain.gain.linearRampToValueAtTime(0, end)
  source.connect(gain)
  gain.connect(ctx.destination)
  source.addEventListener('ended', () => { source.disconnect(); gain.disconnect() }, { once: true })
  source.start(at)
  return source
}
