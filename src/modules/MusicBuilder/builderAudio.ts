export function audioClipWindow(bufferDuration: number, sourceStartSeconds = 0, durationSeconds = bufferDuration) {
  if (!Number.isFinite(bufferDuration) || bufferDuration <= 0 || !Number.isFinite(sourceStartSeconds) || !Number.isFinite(durationSeconds)) {
    throw new Error('Audio clip timing must be finite and its buffer duration positive.');
  }
  const minimum = Math.min(0.05, bufferDuration);
  const start = Math.max(0, Math.min(bufferDuration - minimum, sourceStartSeconds));
  const duration = Math.max(minimum, Math.min(bufferDuration - start, durationSeconds));
  return { start, duration };
}

export interface DetectedSvara {
  timeSeconds: number;
  durationSeconds: number;
  frequencyHz: number;
  semitone: number;
  label: string;
}

export const MAX_ANALYSIS_SECONDS = 30;

export function analyseAudioSwaras(
  buffer: Pick<AudioBuffer, 'sampleRate' | 'numberOfChannels' | 'getChannelData' | 'duration'>,
  tonicHz: number,
  ragaNotes: Array<{ semitone: number; label: string }>,
  startSeconds = 0,
  durationSeconds = buffer.duration,
): DetectedSvara[] {
  if (!Number.isFinite(tonicHz) || tonicHz <= 0) throw new Error('Analysis requires a positive tonic frequency.');
  const window = audioClipWindow(buffer.duration, startSeconds, durationSeconds);
  const step = Math.max(1, Math.ceil(buffer.sampleRate / 8000));
  const sampleRate = buffer.sampleRate / step;
  const offset = Math.floor(window.start * buffer.sampleRate);
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, i) => buffer.getChannelData(i));
  const length = Math.floor(Math.min(window.duration, MAX_ANALYSIS_SECONDS) * sampleRate);
  const signal = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    for (const channel of channels) signal[i] += channel[offset + i * step] / channels.length;
  }
  const frameSize = 1024;
  const hop = 512;
  const detected: DetectedSvara[] = [];
  const names = ['Sa', 'Ri₁', 'Ri₂/Ga₁', 'Ri₃/Ga₂', 'Ga₃', 'Ma₁', 'Ma₂', 'Pa', 'Dha₁', 'Dha₂/Ni₁', 'Dha₃/Ni₂', 'Ni₃'];
  for (let start = 0; start + frameSize <= signal.length; start += hop) {
    let mean = 0;
    for (let i = 0; i < frameSize; i++) mean += signal[start + i];
    mean /= frameSize;
    let energy = 0;
    for (let i = 0; i < frameSize; i++) energy += (signal[start + i] - mean) ** 2;
    if (energy / frameSize < 0.000025) continue;
    const frame = signal.slice(start, start + frameSize);
    for (let i = 0; i < frame.length; i++) frame[i] -= mean;
    const frequencyHz = detectGamakaPitch(frame, sampleRate);
    if (frequencyHz === null) continue;
    const semitone = Math.round(12 * Math.log2(frequencyHz / tonicHz));
    const pitchClass = ((semitone % 12) + 12) % 12;
    const matching = ragaNotes.find(n => ((n.semitone % 12) + 12) % 12 === pitchClass);
    const octave = Math.floor(semitone / 12);
    const label = `${matching?.label.replace(/[.,]+$/, '') ?? names[pitchClass]}${octave > 0 ? '.'.repeat(octave) : ','.repeat(-octave)}`;
    const timeSeconds = start / sampleRate;
    const duration = hop / sampleRate;
    const previous = detected[detected.length - 1];
    if (previous && previous.semitone === semitone && timeSeconds - (previous.timeSeconds + previous.durationSeconds) < duration * 1.8) {
      previous.durationSeconds = timeSeconds + duration - previous.timeSeconds;
    } else {
      detected.push({ timeSeconds, durationSeconds: duration, frequencyHz, semitone, label });
    }
  }
  return detected;
}
import { detectGamakaPitch } from '../../music/gamakaPractice';
