/**
 * Procedural sound and rhythm generator for Nāda Vidyā.
 * These are editable, synthesized sound-design approximations, not recordings
 * of real acoustic instruments or field recordings.
 */
export type SoundCategory = 'Percussion' | 'Nature' | 'Transport' | 'Mechanisms' | 'Objects' | 'Signals';
export type SoundPresetId =
  | 'mridangam' | 'ghatam' | 'kanjira' | 'tabla' | 'dholak' | 'manjira' | 'claps' | 'bell'
  | 'birds' | 'rain' | 'waterfall' | 'ocean' | 'thunder' | 'fire'
  | 'train' | 'motorcycle' | 'car' | 'fan'
  | 'plate' | 'glass' | 'whistle' | 'conch';
export type RhythmStyle = 'carnatic-8' | 'rupaka-6' | 'simple-4' | 'sparse' | 'busy' | 'random';

export interface SoundPresetInfo {
  id: SoundPresetId;
  label: string;
  category: SoundCategory;
  description: string;
  isPercussion: boolean;
}

export const SOUND_PRESETS: SoundPresetInfo[] = [
  { id: 'mridangam', label: 'Mridangam', category: 'Percussion', description: 'Resonant low and sharp strokes', isPercussion: true },
  { id: 'ghatam', label: 'Ghatam', category: 'Percussion', description: 'Bright ceramic, ringing hits', isPercussion: true },
  { id: 'kanjira', label: 'Kanjira', category: 'Percussion', description: 'Compact frame-drum slaps and rattle', isPercussion: true },
  { id: 'tabla', label: 'Tabla', category: 'Percussion', description: 'Pitched drum-like bass and treble strokes', isPercussion: true },
  { id: 'dholak', label: 'Dholak', category: 'Percussion', description: 'Warm folk-drum pattern', isPercussion: true },
  { id: 'manjira', label: 'Manjira / Cymbals', category: 'Percussion', description: 'Bright metallic rhythmic accents', isPercussion: true },
  { id: 'claps', label: 'Hand Claps', category: 'Percussion', description: 'Short broadband claps', isPercussion: true },
  { id: 'bell', label: 'Temple Bell', category: 'Percussion', description: 'Metallic struck bell with a long ring', isPercussion: true },
  { id: 'birds', label: 'Birds', category: 'Nature', description: 'Layered short bird-like chirps', isPercussion: false },
  { id: 'rain', label: 'Rainfall', category: 'Nature', description: 'Steady rain with individual droplets', isPercussion: false },
  { id: 'waterfall', label: 'Waterfall', category: 'Nature', description: 'Wide rushing water noise', isPercussion: false },
  { id: 'ocean', label: 'Ocean Waves', category: 'Nature', description: 'Slow surf-like noise swells', isPercussion: false },
  { id: 'thunder', label: 'Thunder', category: 'Nature', description: 'Low rolling rumble', isPercussion: false },
  { id: 'fire', label: 'Fire Crackle', category: 'Nature', description: 'Soft noise bed with irregular crackles', isPercussion: false },
  { id: 'train', label: 'Train in Motion', category: 'Transport', description: 'Rail clacks, rolling rumble and a tonal horn', isPercussion: false },
  { id: 'motorcycle', label: 'Motorcycle Passing', category: 'Transport', description: 'Revving engine and passing-by level movement', isPercussion: false },
  { id: 'car', label: 'Car Passing', category: 'Transport', description: 'Engine harmonics and road noise', isPercussion: false },
  { id: 'fan', label: 'Rotating Fan', category: 'Mechanisms', description: 'Airflow noise with a steady mechanical pulse', isPercussion: false },
  { id: 'plate', label: 'Plate Clink', category: 'Objects', description: 'Several hard, resonant object taps', isPercussion: false },
  { id: 'glass', label: 'Glass Clink', category: 'Objects', description: 'High, delicate glass-like resonances', isPercussion: false },
  { id: 'whistle', label: 'Whistle', category: 'Signals', description: 'Airy rising/falling high tone', isPercussion: false },
  { id: 'conch', label: 'Conch-like Tone', category: 'Signals', description: 'Breathy, layered ceremonial drone', isPercussion: false },
];

export interface SoundGenerationOptions {
  bpm?: number;
  beats?: number;
  durationSeconds?: number;
  rhythmStyle?: RhythmStyle;
  intensity?: number;
  seed?: number;
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function seededRandom(seed: number): () => number {
  let state = (seed >>> 0) || 0x6d2b79f5;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function addHit(
  left: Float32Array, right: Float32Array, sampleRate: number, atSeconds: number,
  preset: SoundPresetId, stroke: string, velocity: number, random: () => number,
): void {
  const start = Math.max(0, Math.floor(atSeconds * sampleRate));
  const lengthSeconds = preset === 'manjira' || preset === 'bell' ? 1.2 : preset === 'ghatam' ? 0.42 : 0.32;
  const length = Math.min(left.length - start, Math.ceil(lengthSeconds * sampleRate));
  if (length <= 0) return;

  const baseByPreset: Record<string, number> = {
    mridangam: stroke === 'bass' || stroke === 'thom' ? 92 : 185,
    ghatam: stroke === 'bass' ? 230 : 430,
    kanjira: stroke === 'bass' ? 145 : 270,
    tabla: stroke === 'bass' || stroke === 'thom' ? 110 : 245,
    dholak: stroke === 'bass' || stroke === 'thom' ? 98 : 205,
    manjira: 1250,
    claps: 900,
    bell: 660,
  };
  const base = (baseByPreset[preset] ?? 180) * (0.94 + random() * 0.12);
  const decay = preset === 'bell' ? 3.8 : preset === 'manjira' ? 5.2 : preset === 'ghatam' ? 10 : preset === 'claps' ? 20 : 13;
  const noiseAmount = preset === 'claps' || preset === 'kanjira' ? 0.8 : preset === 'ghatam' ? 0.16 : preset === 'manjira' ? 0.22 : 0.34;
  const amplitude = clamp(velocity, 0, 1) * (preset === 'manjira' || preset === 'bell' ? 0.32 : 0.6);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-decay * t) * Math.min(1, i / Math.max(1, sampleRate * 0.002));
    let tonal = 0;
    if (preset === 'mridangam') {
      tonal = Math.sin(2 * Math.PI * base * t) * 0.72 + Math.sin(2 * Math.PI * base * 2.05 * t) * 0.24 + Math.sin(2 * Math.PI * base * 3.9 * t) * 0.1;
      if (stroke === 'chapu' || stroke === 'nam') tonal *= 0.72 + 0.28 * Math.sin(Math.PI * Math.min(1, t * 16));
    } else if (preset === 'ghatam') {
      tonal = Math.sin(2 * Math.PI * base * t) * 0.65 + Math.sin(2 * Math.PI * base * 2.73 * t) * 0.45 + Math.sin(2 * Math.PI * base * 4.16 * t) * 0.2;
    } else if (preset === 'kanjira') {
      tonal = Math.sin(2 * Math.PI * base * t) * 0.7 + Math.sin(2 * Math.PI * base * 1.72 * t) * 0.23;
    } else if (preset === 'tabla') {
      tonal = Math.sin(2 * Math.PI * base * t) * 0.6 + Math.sin(2 * Math.PI * base * 2.01 * t) * 0.31 + Math.sin(2 * Math.PI * base * 3.02 * t) * 0.16;
    } else if (preset === 'dholak') {
      tonal = Math.sin(2 * Math.PI * base * t) * 0.68 + Math.sin(2 * Math.PI * base * 1.9 * t) * 0.26;
    } else if (preset === 'manjira' || preset === 'bell') {
      tonal = Math.sin(2 * Math.PI * base * t) * 0.7 + Math.sin(2 * Math.PI * base * 2.76 * t) * 0.34 + Math.sin(2 * Math.PI * base * 4.21 * t) * 0.2 + Math.sin(2 * Math.PI * base * 5.43 * t) * 0.08;
    } else {
      tonal = Math.sin(2 * Math.PI * base * t) * 0.18;
    }
    const noise = (random() * 2 - 1) * noiseAmount;
    const sample = (tonal + noise) * env * amplitude;
    const pan = Math.sin(i / Math.max(1, length) * Math.PI) * 0.08;
    left[start + i] += sample * (1 - pan);
    right[start + i] += sample * (1 + pan);
  }
}

function rhythmEvents(preset: SoundPresetId, beats: number, style: RhythmStyle, random: () => number): Array<{ beat: number; stroke: string; velocity: number }> {
  const events: Array<{ beat: number; stroke: string; velocity: number }> = [];
  const stride = style === 'busy' ? 0.5 : 1;
  for (let beat = 0; beat < beats; beat += stride) {
    const phase = beat % (style === 'rupaka-6' ? 6 : style === 'simple-4' ? 4 : 8);
    let shouldHit = false;
    let stroke = 'tap';
    let velocity = 0.72;
    switch (style) {
      case 'carnatic-8':
        shouldHit = true;
        stroke = phase === 0 || phase === 4 ? 'bass' : phase === 2 || phase === 6 ? 'dhin' : phase === 7 ? 'chapu' : 'nam';
        velocity = phase === 0 ? 0.98 : phase % 2 === 0 ? 0.74 : 0.48;
        break;
      case 'rupaka-6':
        shouldHit = true;
        stroke = phase === 0 || phase === 3 ? 'bass' : phase === 5 ? 'chapu' : 'nam';
        velocity = phase === 0 ? 0.94 : 0.55;
        break;
      case 'simple-4':
        shouldHit = true;
        stroke = phase % 2 === 0 ? 'bass' : 'tap';
        velocity = phase === 0 ? 0.95 : phase === 2 ? 0.72 : 0.45;
        break;
      case 'sparse':
        shouldHit = Math.round(beat) % 2 === 0;
        stroke = Math.round(beat) % 4 === 0 ? 'bass' : 'tap';
        velocity = 0.65;
        break;
      case 'busy':
        shouldHit = Math.round(beat * 2) % 2 === 0 || random() > 0.22;
        stroke = Math.round(beat * 2) % 4 === 0 ? 'bass' : Math.round(beat * 2) % 2 ? 'chapu' : 'tap';
        velocity = Math.round(beat * 2) % 4 === 0 ? 0.88 : 0.4 + random() * 0.36;
        break;
      case 'random':
        shouldHit = random() > 0.32;
        stroke = random() > 0.68 ? 'bass' : random() > 0.5 ? 'chapu' : 'tap';
        velocity = 0.35 + random() * 0.6;
        break;
    }
    // Cymbals accent all beats; hand claps create a backbeat in common styles.
    if (preset === 'manjira') shouldHit = style === 'sparse' ? Math.round(beat) % 2 === 0 : Math.abs(beat - Math.round(beat)) < 0.001;
    if (preset === 'claps') shouldHit = style === 'carnatic-8' ? [2, 6].includes(Math.round(beat) % 8) : Math.round(beat) % 2 === 1;
    if (shouldHit) events.push({ beat, stroke, velocity });
  }
  return events;
}

function generatePercussion(context: BaseAudioContext, preset: SoundPresetId, options: SoundGenerationOptions): AudioBuffer {
  const sampleRate = context.sampleRate || 44100;
  const bpm = clamp(options.bpm ?? 90, 30, 260);
  const beats = Math.round(clamp(options.beats ?? 8, 1, 64));
  const style = options.rhythmStyle ?? 'carnatic-8';
  const durationSeconds = beats * 60 / bpm;
  const frameCount = Math.max(1, Math.ceil(durationSeconds * sampleRate));
  const buffer = context.createBuffer(2, frameCount, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);
  const random = seededRandom(options.seed ?? (Date.now() ^ preset.length * 7919));
  rhythmEvents(preset, beats, style, random).forEach(event => {
    addHit(left, right, sampleRate, event.beat * 60 / bpm, preset, event.stroke, event.velocity * clamp(options.intensity ?? 1, 0.1, 1.5), random);
    if (style === 'busy' && event.beat + 0.25 < beats && random() > 0.65) {
      addHit(left, right, sampleRate, (event.beat + 0.25) * 60 / bpm, preset, 'tap', event.velocity * 0.33, random);
    }
  });
  normalizeBuffer(buffer, 0.88);
  return buffer;
}

function normalizeBuffer(buffer: AudioBuffer, targetPeak = 0.88): void {
  let peak = 0;
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i]));
  }
  if (peak > targetPeak) {
    const gain = targetPeak / peak;
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < data.length; i++) data[i] *= gain;
    }
  }
}

function generateEnvironment(context: BaseAudioContext, preset: SoundPresetId, options: SoundGenerationOptions): AudioBuffer {
  const sampleRate = context.sampleRate || 44100;
  const duration = clamp(options.durationSeconds ?? 6, 0.5, 20);
  const frameCount = Math.max(1, Math.floor(duration * sampleRate));
  const buffer = context.createBuffer(2, frameCount, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);
  const random = seededRandom(options.seed ?? (Date.now() ^ preset.length * 1237));
  const intensity = clamp(options.intensity ?? 1, 0.1, 1.5);
  const noise = new Float32Array(frameCount);
  for (let i = 0; i < frameCount; i++) noise[i] = random() * 2 - 1;

  if (preset === 'birds') {
    for (let start = 0.12; start < duration - 0.15;) {
      const chirpDur = 0.10 + random() * 0.24;
      const startFrame = Math.floor(start * sampleRate);
      const count = Math.min(Math.floor(chirpDur * sampleRate), frameCount - startFrame);
      const f0 = 1600 + random() * 1600;
      const sweep = (random() - 0.5) * 1700;
      for (let j = 0; j < count; j++) {
        const t = j / sampleRate;
        const u = j / Math.max(1, count);
        const envelope = Math.pow(Math.sin(Math.PI * u), 1.3) * (0.65 + 0.35 * Math.sin(2 * Math.PI * 16 * t));
        const phase = 2 * Math.PI * (f0 * t + 0.5 * sweep / Math.max(0.1, chirpDur) * t * t);
        const sample = Math.sin(phase) * envelope * intensity * 0.28;
        left[startFrame + j] += sample;
        right[startFrame + j] += sample * (0.86 + 0.14 * Math.sin(u * Math.PI));
      }
      start += chirpDur * (1.1 + random() * 2.6);
    }
  } else if (preset === 'rain' || preset === 'waterfall' || preset === 'ocean' || preset === 'fire' || preset === 'thunder') {
    let low = 0;
    let mid = 0;
    const impacts: Array<{ at: number; strength: number; freq: number }> = [];
    const count = preset === 'rain' ? Math.floor(duration * 32) : preset === 'fire' ? Math.floor(duration * 8) : preset === 'ocean' ? 3 : preset === 'thunder' ? 4 : 0;
    for (let k = 0; k < count; k++) impacts.push({ at: random() * Math.max(0, duration - 0.1), strength: 0.2 + random() * 0.8, freq: 400 + random() * 2500 });
    // Pre-render transient events into a separate buffer; avoid an O(samples × drops) loop.
    const transientMix = new Float32Array(frameCount);
    for (const impact of impacts) {
      const start = Math.max(0, Math.floor(impact.at * sampleRate));
      const transientLength = Math.min(frameCount - start, Math.ceil(0.12 * sampleRate));
      for (let j = 0; j < transientLength; j++) {
        const dt = j / sampleRate;
        if (preset === 'rain') transientMix[start + j] += Math.sin(2 * Math.PI * impact.freq * dt) * Math.exp(-dt * 32) * impact.strength * 0.35;
        else if (preset === 'fire') transientMix[start + j] += noise[start + j] * Math.exp(-dt * 35) * impact.strength * 0.22;
        else transientMix[start + j] += Math.sin(2 * Math.PI * impact.freq * dt) * Math.exp(-dt * 12) * impact.strength * 0.2;
      }
    }
    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate;
      const n = noise[i];
      low += 0.012 * (n - low);
      mid += 0.095 * (n - mid);
      let sample = 0;
      if (preset === 'rain') sample = (n - mid) * 0.34 + low * 0.18;
      if (preset === 'waterfall') sample = (n - low) * 0.22 + mid * 0.42;
      if (preset === 'ocean') {
        const swell = 0.15 + 0.85 * Math.pow((1 + Math.sin(2 * Math.PI * (t / Math.max(3, duration * 0.7)))) / 2, 2);
        sample = ((n - low) * 0.26 + mid * 0.36) * swell;
      }
      if (preset === 'fire') sample = (n - mid) * 0.13 + low * 0.08;
      if (preset === 'thunder') {
        const envelope = Math.exp(-t / Math.max(1, duration * 0.52)) * (0.6 + 0.4 * Math.sin(2 * Math.PI * 0.8 * t) ** 2);
        sample = (low * 2.8 + mid * 0.8 + n * 0.05) * envelope;
      }
      sample += transientMix[i];
      if (preset === 'ocean') {
        const fade = Math.min(1, t * 4, (duration - t) * 4);
        sample *= Math.max(0, fade);
      }
      left[i] = sample * intensity;
      right[i] = sample * intensity * (0.94 + 0.06 * Math.sin(t * 0.6));
    }
  } else if (preset === 'fan') {
    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate;
      const pulse = 0.55 + 0.45 * Math.sin(2 * Math.PI * 24 * t);
      const hum = Math.sin(2 * Math.PI * 100 * t) * 0.12 + Math.sin(2 * Math.PI * 200 * t) * 0.05;
      const sample = (noise[i] * 0.16 + hum) * pulse * intensity;
      left[i] = sample; right[i] = sample * 0.98;
    }
  } else if (preset === 'train') {
    const hornStart = Math.floor(duration * 0.72 * sampleRate);
    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate;
      const rumble = noise[i] * 0.10 + Math.sin(2 * Math.PI * 48 * t) * 0.12 + Math.sin(2 * Math.PI * 73 * t) * 0.05;
      const clack = Math.pow(Math.max(0, Math.sin(2 * Math.PI * 3.2 * t)), 12) * 0.25;
      const approach = Math.min(1, t / Math.max(0.5, duration * 0.25));
      let sample = (rumble + clack) * approach;
      if (i > hornStart) {
        const u = (i - hornStart) / Math.max(1, frameCount - hornStart);
        const hornEnv = Math.sin(Math.PI * u) * 0.18;
        sample += (Math.sin(2 * Math.PI * 390 * t) + 0.45 * Math.sin(2 * Math.PI * 585 * t)) * hornEnv;
      }
      const pass = 0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, t / duration));
      left[i] = sample * pass * intensity; right[i] = sample * pass * intensity;
    }
  } else if (preset === 'car' || preset === 'motorcycle') {
    const base = preset === 'motorcycle' ? 58 : 42;
    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate;
      const u = t / duration;
      const rpm = base + 100 * Math.sin(Math.PI * Math.min(1, u * 1.35)) + 28 * Math.sin(2 * Math.PI * 1.7 * t);
      const pass = 0.12 + 0.88 * Math.pow(Math.sin(Math.PI * Math.min(1, u)), 1.4);
      const engine = Math.sin(2 * Math.PI * rpm * t) * 0.24 + Math.sin(2 * Math.PI * rpm * 2.1 * t) * 0.13 + Math.sin(2 * Math.PI * rpm * 3.2 * t) * 0.06;
      const sample = (engine + noise[i] * (preset === 'motorcycle' ? 0.095 : 0.06)) * pass * intensity;
      left[i] = sample * (0.7 + 0.3 * (1 - u)); right[i] = sample * (0.7 + 0.3 * u);
    }
  } else if (preset === 'whistle' || preset === 'conch') {
    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate;
      const u = t / duration;
      const f0 = preset === 'whistle' ? 1450 + 280 * Math.sin(2 * Math.PI * 0.18 * t) : 190 + 18 * Math.sin(2 * Math.PI * 0.1 * t);
      const fadeIn = Math.min(1, t * 5);
      const fadeOut = Math.min(1, (duration - t) * 3);
      const envelope = Math.max(0, Math.min(fadeIn, fadeOut)) * (preset === 'conch' ? 0.32 : 0.28);
      const tone = Math.sin(2 * Math.PI * f0 * t) + (preset === 'conch' ? 0.4 * Math.sin(2 * Math.PI * f0 * 1.5 * t) : 0.04 * noise[i]);
      left[i] = tone * envelope * intensity; right[i] = tone * envelope * intensity;
    }
  } else if (preset === 'plate' || preset === 'glass' || preset === 'bell') {
    const impacts: Array<{ at: number; freq: number; strength: number; decay: number }> = [];
    const hitCount = preset === 'glass' ? 3 : preset === 'plate' ? 4 : 1;
    for (let k = 0; k < hitCount; k++) impacts.push({ at: preset === 'bell' ? 0.08 : 0.12 + random() * Math.max(0.1, duration - 0.5), freq: (preset === 'glass' ? 900 : preset === 'plate' ? 480 : 620) * (0.85 + random() * 0.7), strength: 0.3 + random() * 0.55, decay: preset === 'glass' ? 3.8 : preset === 'plate' ? 6.5 : 2.2 });
    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate;
      let sample = 0;
      for (const hit of impacts) {
        const dt = t - hit.at;
        if (dt >= 0) {
          const ring = Math.sin(2 * Math.PI * hit.freq * dt) + 0.42 * Math.sin(2 * Math.PI * hit.freq * 2.41 * dt) + 0.18 * Math.sin(2 * Math.PI * hit.freq * 3.9 * dt);
          sample += ring * Math.exp(-hit.decay * dt) * hit.strength;
        }
      }
      left[i] = sample * intensity * 0.46; right[i] = sample * intensity * 0.45;
    }
  } else {
    // Short generic ambience fallback with a softly filtered noise bed.
    let low = 0;
    for (let i = 0; i < frameCount; i++) {
      low += 0.04 * (noise[i] - low);
      left[i] = (noise[i] - low) * intensity * 0.18;
      right[i] = left[i];
    }
  }
  normalizeBuffer(buffer, 0.88);
  return buffer;
}

export function createSoundBuffer(
  context: BaseAudioContext,
  preset: SoundPresetId,
  options: SoundGenerationOptions = {},
): AudioBuffer {
  const metadata = SOUND_PRESETS.find(item => item.id === preset);
  if (!metadata) throw new Error(`Unknown sound preset: ${String(preset)}`);
  return metadata.isPercussion
    ? generatePercussion(context, preset, options)
    : generateEnvironment(context, preset, options);
}

export function makeGeneratedSoundName(preset: SoundPresetId, options: SoundGenerationOptions = {}): string {
  const metadata = SOUND_PRESETS.find(item => item.id === preset);
  if (metadata?.isPercussion) {
    const beats = Math.round(clamp(options.beats ?? 8, 1, 64));
    const bpm = Math.round(clamp(options.bpm ?? 90, 30, 260));
    const style = options.rhythmStyle ?? 'carnatic-8';
    const styleNames: Record<RhythmStyle, string> = {
      'carnatic-8': 'Carnatic-inspired 8-beat',
      'rupaka-6': 'Rupaka-inspired 6-beat',
      'simple-4': '4-beat', sparse: 'Sparse', busy: 'Busy', random: 'Random',
    };
    return `${metadata.label} · ${styleNames[style]} · ${beats} beats · ${bpm} BPM`;
  }
  return `${metadata?.label ?? preset} · Generated sound`;
}
