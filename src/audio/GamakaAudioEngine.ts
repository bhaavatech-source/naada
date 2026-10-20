import type { GamakaProfile, InstrumentType, TrajectoryPoint } from '../types/gamaka';
import { getAudioContext } from './engine';

/**
 * GamakaAudioEngine: Pure client-side Web Audio API synthesizer.
 * Provides microtonal gamaka playback, physical instrument synthesis
 * (Veena, Flute, Voice Formants), continuous Tambura drone, and A/B comparison.
 */
export class GamakaAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private limiter: DynamicsCompressorNode | null = null;
  private tamburaGain: GainNode | null = null;
  private tamburaNodes: OscillatorNode[] = [];
  private tamburaTimer: number | null = null;
  private activeNodes: { stop: (time: number) => void }[] = [];
  public baseKattaiHz: number = 261.63; // 1 Kattai / C default
  public isTamburaRunning: boolean = false;
  private playbackGeneration = 0;
  private activeDelayCancel: (() => void) | null = null;
  private volume = 0.7;

  constructor(kattaiHz: number = 261.63) {
    this.baseKattaiHz = kattaiHz;
  }

  /**
   * Initializes or resumes the AudioContext (handles mobile/Android autoplay).
   */
  public async init(): Promise<AudioContext> {
    if (!this.ctx) {
      // Reuse the ecosystem-wide AudioContext instead of creating a competing one.
      this.ctx = getAudioContext();
      this.limiter = this.ctx.createDynamicsCompressor();
      this.limiter.threshold.setValueAtTime(-3, this.ctx.currentTime);
      this.limiter.knee.setValueAtTime(6, this.ctx.currentTime);
      this.limiter.ratio.setValueAtTime(12, this.ctx.currentTime);
      this.limiter.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.limiter.release.setValueAtTime(0.25, this.ctx.currentTime);
      this.limiter.connect(this.ctx.destination);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.limiter);

      this.tamburaGain = this.ctx.createGain();
      this.tamburaGain.gain.setValueAtTime(0.22, this.ctx.currentTime);
      this.tamburaGain.connect(this.masterGain);
    }
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    return this.ctx;
  }

  /** Follow the shared app volume without replacing the shared audio context. */
  public setVolume(value: number): void {
    this.volume = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0.7));
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(this.volume, now, 0.025);
    }
  }

  /**
   * Sets the base Adhara Shadjam frequency (Kattai).
   */
  public setKattai(hz: number): void {
    if (!Number.isFinite(hz) || hz <= 0) return;
    if (Math.abs(this.baseKattaiHz - hz) < 0.01) return;
    this.baseKattaiHz = hz;
    if (this.isTamburaRunning) {
      this.stopTambura();
      this.startTambura();
    }
  }

  /**
   * Converts cents offset into absolute Hertz relative to baseKattaiHz.
   */
  public centsToHz(cents: number): number {
    return this.baseKattaiHz * Math.pow(2, cents / 1200);
  }

  /**
   * Continuous 4-string Tambura drone (Pa - Sa - Sa - Sa).
   */
  public async startTambura(): Promise<void> {
    const ctx = await this.init();
    if (this.isTamburaRunning) return;
    this.isTamburaRunning = true;

    const stringIntervals = [701.96, 1200.0, 1200.0, 0.0]; // P, Tara S, Tara S, Mandra S
    let stringIdx = 0;

    const strumNext = () => {
      if (!this.isTamburaRunning || !this.ctx || !this.tamburaGain) return;
      const now = this.ctx.currentTime;
      const cents = stringIntervals[stringIdx];
      const freq = this.centsToHz(cents);

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      // Jivari buzzing bridge filter
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq * 2.8, now);
      filter.Q.setValueAtTime(3.5, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.tamburaGain);

      osc.start(now);
      osc.stop(now + 2.5);
      this.tamburaNodes.push(osc);
      osc.onended = () => { this.tamburaNodes = this.tamburaNodes.filter(node => node !== osc); };

      stringIdx = (stringIdx + 1) % stringIntervals.length;
      this.tamburaTimer = window.setTimeout(strumNext, 680);
    };

    strumNext();
  }

  public stopTambura(): void {
    this.isTamburaRunning = false;
    const now = this.ctx?.currentTime ?? 0;
    this.tamburaNodes.forEach(node => { try { node.stop(now); } catch { /* already ended */ } });
    this.tamburaNodes = [];
    if (this.tamburaTimer !== null) {
      clearTimeout(this.tamburaTimer);
      this.tamburaTimer = null;
    }
  }

  /**
   * Synthesizes Saraswati Veena with pluck attack and jackwood body resonance.
   */
  private playVeena(freq: number, startTime: number, duration: number, trajectory?: TrajectoryPoint[]): void {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const bodyFilter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    bodyFilter.type = 'peaking';
    bodyFilter.frequency.setValueAtTime(185, startTime); // Kudam body Helmholtz peak
    bodyFilter.gain.setValueAtTime(4.0, startTime);
    bodyFilter.Q.setValueAtTime(2.0, startTime);

    if (trajectory && trajectory.length > 0) {
      osc.frequency.setValueAtTime(this.centsToHz(trajectory[0].cents), startTime);
      for (let i = 1; i < trajectory.length; i++) {
        const pt = trajectory[i];
        const t = startTime + Math.max(0.01, pt.t_ms / 1000);
        osc.frequency.linearRampToValueAtTime(this.centsToHz(pt.cents), t);
      }
    } else {
      osc.frequency.setValueAtTime(freq, startTime);
    }

    // Pluck attack & decay envelope
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.75, startTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.28, startTime + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(bodyFilter);
    bodyFilter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration);
    this.activeNodes.push(osc);
  }

  /**
   * Synthesizes Venu (Carnatic Bamboo Flute) with breath turbulence and odd harmonics.
   */
  private playFlute(freq: number, startTime: number, duration: number, trajectory?: TrajectoryPoint[]): void {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const breathGain = this.ctx.createGain();
    const breath = this.ctx.createBufferSource();
    const noiseBuffer = this.ctx.createBuffer(1, Math.max(1, Math.ceil(this.ctx.sampleRate * 0.25)), this.ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) noiseData[i] = (Math.random() * 2 - 1) * 0.22;
    breath.buffer = noiseBuffer;
    breath.loop = true;
    const breathFilter = this.ctx.createBiquadFilter();
    breathFilter.type = 'bandpass';
    breathFilter.frequency.setValueAtTime(2600, startTime);
    breathFilter.Q.setValueAtTime(0.8, startTime);

    osc.type = 'triangle';

    if (trajectory && trajectory.length > 0) {
      osc.frequency.setValueAtTime(this.centsToHz(trajectory[0].cents), startTime);
      for (let i = 1; i < trajectory.length; i++) {
        const pt = trajectory[i];
        const t = startTime + Math.max(0.01, pt.t_ms / 1000);
        osc.frequency.linearRampToValueAtTime(this.centsToHz(pt.cents), t);
      }
    } else {
      osc.frequency.setValueAtTime(freq, startTime);
    }

    // Soft breath turbulence
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.65, startTime + 0.08);
    gain.gain.setValueAtTime(0.55, startTime + duration - 0.1);
    gain.gain.linearRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    // Low-level filtered breath noise makes the flute less like a pure electronic beep.
    breathGain.gain.setValueAtTime(0.0001, startTime);
    breathGain.gain.linearRampToValueAtTime(0.035, startTime + 0.09);
    breathGain.gain.setValueAtTime(0.022, Math.max(startTime + 0.1, startTime + duration - 0.08));
    breathGain.gain.linearRampToValueAtTime(0.0001, startTime + duration);
    breath.connect(breathFilter);
    breathFilter.connect(breathGain);
    breathGain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration);
    breath.start(startTime);
    breath.stop(startTime + duration);
    this.activeNodes.push(osc, breath);
  }

  /**
   * Synthesizes Human Vocal Solfa formants (vowel cavities).
   */
  private playVoice(freq: number, startTime: number, duration: number, trajectory?: TrajectoryPoint[]): void {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const f1 = this.ctx.createBiquadFilter();
    const f2 = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';

    // Vowel 'Aa' formants (800 Hz and 1250 Hz)
    f1.type = 'bandpass';
    f1.frequency.setValueAtTime(800, startTime);
    f1.Q.setValueAtTime(4.5, startTime);

    f2.type = 'bandpass';
    f2.frequency.setValueAtTime(1250, startTime);
    f2.Q.setValueAtTime(5.0, startTime);

    if (trajectory && trajectory.length > 0) {
      osc.frequency.setValueAtTime(this.centsToHz(trajectory[0].cents), startTime);
      for (let i = 1; i < trajectory.length; i++) {
        const pt = trajectory[i];
        const t = startTime + Math.max(0.01, pt.t_ms / 1000);
        osc.frequency.linearRampToValueAtTime(this.centsToHz(pt.cents), t);
      }
    } else {
      osc.frequency.setValueAtTime(freq, startTime);
    }

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.55, startTime + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(f1);
    osc.connect(f2);
    f1.connect(gain);
    f2.connect(gain);
    gain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration);
    this.activeNodes.push(osc);
  }

  private profileDurationSec(profile: GamakaProfile): number {
    const last = profile.trajectory[profile.trajectory.length - 1]?.t_ms ?? 1200;
    return Math.max(0.25, last / 1000);
  }

  private scheduleProfile(profile: GamakaProfile, instrument: InstrumentType, durationSec: number, gamaka: boolean): void {
    if (!this.ctx) return;
    const startTime = this.ctx.currentTime + 0.035;
    const cents = gamaka ? profile.baseCents : profile.plainCents;
    const duration = Math.max(0.1, durationSec);
    // Scale the whole contour to the requested duration instead of ending the pitch movement early.
    const trajectory = gamaka && profile.trajectory.length
      ? profile.trajectory.map(point => ({ ...point, t_ms: (point.t_ms / Math.max(1, profile.trajectory[profile.trajectory.length - 1].t_ms)) * duration * 1000 }))
      : undefined;
    const freq = this.centsToHz(cents);
    if (instrument === 'flute') this.playFlute(freq, startTime, duration, trajectory);
    else if (instrument === 'voice_formants') this.playVoice(freq, startTime, duration, trajectory);
    else this.playVeena(freq, startTime, duration, trajectory);
  }

  private waitForPlayback(ms: number, generation: number): Promise<boolean> {
    return new Promise(resolve => {
      const finish = (completed: boolean) => {
        if (this.activeDelayCancel === cancel) this.activeDelayCancel = null;
        window.clearTimeout(timer);
        resolve(completed && generation === this.playbackGeneration);
      };
      const timer = window.setTimeout(() => finish(true), ms);
      const cancel = () => finish(false);
      this.activeDelayCancel = cancel;
    });
  }

  /** Plain equal-tempered note (Track A). */
  public async playPlainNote(profile: GamakaProfile, instrument: InstrumentType, durationSec?: number): Promise<void> {
    await this.init();
    this.stopAll();
    const generation = this.playbackGeneration;
    const duration = durationSec ?? this.profileDurationSec(profile);
    this.scheduleProfile(profile, instrument, duration, false);
    await this.waitForPlayback(duration * 1000 + 40, generation);
  }

  /** Microtonal target contour (Track B). */
  public async playGamaka(profile: GamakaProfile, instrument: InstrumentType, durationSec?: number): Promise<void> {
    await this.init();
    this.stopAll();
    const generation = this.playbackGeneration;
    const duration = durationSec ?? this.profileDurationSec(profile);
    this.scheduleProfile(profile, instrument, duration, true);
    await this.waitForPlayback(duration * 1000 + 40, generation);
  }

  /** A then B comparison. Each track uses the same duration and tonic. */
  public async playABComparison(
    profile: GamakaProfile,
    instrument: InstrumentType,
    callbacks?: { onTrackChange?: (track: 'A' | 'B') => void; onEnd?: () => void }
  ): Promise<void> {
    await this.init();
    this.stopAll();
    const generation = this.playbackGeneration;
    const duration = this.profileDurationSec(profile);
    try {
      callbacks?.onTrackChange?.('A');
      this.scheduleProfile(profile, instrument, duration, false);
      if (!await this.waitForPlayback(duration * 1000 + 40, generation)) return;
      if (!await this.waitForPlayback(350, generation)) return;
      callbacks?.onTrackChange?.('B');
      this.scheduleProfile(profile, instrument, duration, true);
      if (!await this.waitForPlayback(duration * 1000 + 40, generation)) return;
    } finally {
      // Always release UI state, including when the user stops playback mid-track.
      callbacks?.onEnd?.();
    }
  }

  /**
   * Immediately halts all running oscillators and comparisons.
   */
  public stopAll(): void {
    this.playbackGeneration += 1;
    if (this.activeDelayCancel) {
      const cancel = this.activeDelayCancel;
      this.activeDelayCancel = null;
      cancel();
    }
    const now = this.ctx ? this.ctx.currentTime : 0;
    this.activeNodes.forEach(node => {
      try {
        node.stop(now);
      } catch {
        // Node already stopped
      }
    });
    this.activeNodes = [];
  }
}

export const gamakaAudioEngine = new GamakaAudioEngine();
