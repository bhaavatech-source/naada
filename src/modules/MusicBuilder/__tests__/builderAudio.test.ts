import { analyseAudioSwaras, audioClipWindow, MAX_ANALYSIS_SECONDS } from '../builderAudio';

export function runBuilderTests(): number {
  let count = 0;
  const check = (condition: boolean, message: string) => {
    if (!condition) throw new Error(`Gāna Builder: ${message}`);
    count++;
  };
  const close = (a: number, b: number) => Math.abs(a - b) < 1e-6;
  const full = audioClipWindow(2);
  check(full.start === 0 && full.duration === 2, 'default clip uses its full decoded duration');
  const trimmed = audioClipWindow(2, 0.75, 0.5);
  check(trimmed.start === 0.75 && trimmed.duration === 0.5, 'trim preserves explicit start and length');
  const clipped = audioClipWindow(2, 1.75, 1);
  check(clipped.start === 1.75 && clipped.duration === 0.25, 'length cannot extend beyond source end');
  const outside = audioClipWindow(2, 5, 3);
  check(close(outside.start, 1.95) && close(outside.duration, 0.05), 'out-of-range trim keeps a valid source window');
  check(audioClipWindow(0.01, 0, 0.001).duration === 0.01, 'very short clips do not extend beyond their source');
  check(audioClipWindow(2, -1, -1).start === 0 && audioClipWindow(2, -1, -1).duration === 0.05, 'negative edit values are bounded');
  for (const args of [[0, 0, 1], [1, NaN, 1], [1, 0, Infinity]]) {
    let failed = false;
    try { audioClipWindow(args[0], args[1], args[2]); } catch { failed = true; }
    check(failed, 'invalid clip timing is rejected explicitly');
  }
  const sampleRate = 16000;
  const makeBuffer = (duration: number, frequency: (time: number) => number) => {
    const data = Float32Array.from({ length: Math.floor(duration * sampleRate) }, (_, i) => {
      const hz = frequency(i / sampleRate);
      return hz ? 0.4 * Math.sin(2 * Math.PI * hz * i / sampleRate) : 0;
    });
    return { duration, sampleRate, numberOfChannels: 1, getChannelData: () => data };
  };
  const notes = [{ semitone: 0, label: 'Sa' }, { semitone: 7, label: 'Pa' }];
  const tone = makeBuffer(1, () => 220);
  const detected = analyseAudioSwaras(tone, 220, notes);
  check(detected.length === 1 && detected[0].semitone === 0, 'steady tonic is grouped without sub-octave errors');
  check(detected[0].label === 'Sa' && Math.abs(detected[0].frequencyHz - 220) < 3, 'frequency and tonic label agree');
  check(detected[0].durationSeconds > 0.8 && detected[0].durationSeconds <= 1, 'detected duration is bounded by the clip');
  const upper = analyseAudioSwaras(makeBuffer(1, () => 440), 220, notes);
  check(upper.length === 1 && upper[0].semitone === 12 && upper[0].label === 'Sa.', 'upper-octave labels match actual pitch');
  const lower = analyseAudioSwaras(makeBuffer(1, () => 110), 220, notes);
  check(lower.length === 1 && lower[0].semitone === -12 && lower[0].label === 'Sa,', 'lower-octave labels match actual pitch');
  check(analyseAudioSwaras(makeBuffer(1, () => 0), 220, notes).length === 0, 'silence yields no success-shaped pitch estimates');
  const twoTones = makeBuffer(2, time => time < 1 ? 220 : 440);
  const selection = analyseAudioSwaras(twoTones, 220, notes, 1, 0.75);
  check(selection.length === 1 && selection[0].semitone === 12, 'analysis uses only the trimmed source window');
  check(selection[0].timeSeconds === 0 && selection[0].durationSeconds <= 0.75, 'analysis times are relative to the trim, not source origin');
  const long = makeBuffer(MAX_ANALYSIS_SECONDS + 1, time => time < MAX_ANALYSIS_SECONDS ? 0 : 220);
  check(analyseAudioSwaras(long, 220, notes).length === 0, 'analysis is bounded to the documented 30-second window');
  return count;
}
