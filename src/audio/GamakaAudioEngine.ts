import type { GamakaProfile, InstrumentType, TrajectoryPoint } from '../types/gamaka';
import { getAudioContext, getAudioOutputTime } from './engine';
import curriculum from '../data/gamaka-vocal-trainer-and-notation-v2.json';
import { buildGamakaPracticePlan } from '../music/gamakaPractice';
import { scheduleGamakaTone } from './gamakaTone';

/**
 * GamakaAudioEngine: Pure client-side Web Audio API synthesizer.
 * Provides pitch-contour playback with bounded synthetic timbres,
 * a continuous synthetic drone, and A/B comparison. Not physical instrument modeling.
 */
export class GamakaAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private limiter: DynamicsCompressorNode | null = null;
  private tamburaGain: GainNode | null = null;
  private tamburaNodes: OscillatorNode[] = [];
  private tamburaTimer: number | null = null;
  private activeNodes: AudioScheduledSourceNode[] = [];
  public baseKattaiHz: number = 261.63; // 1 Kattai / C default
  public isTamburaRunning: boolean = false;
  private playbackGeneration = 0;
  private activeDelayCancel: (() => void) | null = null;
  private volume = 0.7;
  private tamburaGeneration = 0;

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
    if (this.ctx.state !== 'running') throw new Error('Audio could not start. Check browser audio permissions.');
    return this.ctx;
  }

  /** Follow the shared app volume without replacing the shared audio context. */
  public setVolume(value: number): void {
    if (!Number.isFinite(value)) throw new Error('Audio volume must be a finite number.');
    this.volume = Math.max(0, Math.min(1, value));
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
    if (!Number.isFinite(hz) || hz <= 0) throw new Error('The tonic must be a positive frequency.');
    if (Math.abs(this.baseKattaiHz - hz) < 0.01) return;
    this.baseKattaiHz = hz;
    if (this.isTamburaRunning) {
      this.stopTambura();
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
  public async startTambura(): Promise<boolean> {
    const generation = this.tamburaGeneration;
    const ctx = await this.init();
    if (generation !== this.tamburaGeneration) return false;
    if (this.isTamburaRunning) return true;
    this.isTamburaRunning = true;

    const stringIntervals = [701.96, 1200.0, 1200.0, 0.0]; // P, Tara S, Tara S, Mandra S
    let stringIdx = 0;

    const strumNext = () => {
      if (!this.isTamburaRunning || !this.ctx || !this.tamburaGain) return;
      const now = this.ctx.currentTime;
      const cents = stringIntervals[stringIdx];
      const freq = this.centsToHz(cents);

      const { source: osc, nodes } = scheduleGamakaTone(this.ctx, this.tamburaGain, 'tambura', freq, 0, now, 2.5);
      this.tamburaNodes.push(osc);
      osc.onended = () => {
        this.tamburaNodes = this.tamburaNodes.filter(node => node !== osc);
        osc.disconnect();
        nodes.forEach(node => node.disconnect());
      };

      stringIdx = (stringIdx + 1) % stringIntervals.length;
      this.tamburaTimer = window.setTimeout(strumNext, 680);
    };

    strumNext();
    return true;
  }

  public stopTambura(): void {
    this.tamburaGeneration++;
    this.isTamburaRunning = false;
    const now = this.ctx?.currentTime ?? 0;
    this.tamburaNodes.forEach(node => { try { node.stop(now); } catch { /* already ended */ } });
    this.tamburaNodes = [];
    if (this.tamburaTimer !== null) {
      clearTimeout(this.tamburaTimer);
      this.tamburaTimer = null;
    }
  }

  private trackSource(source: AudioScheduledSourceNode, nodes: AudioNode[]): void {
    this.activeNodes.push(source);
    source.addEventListener('ended', () => {
      this.activeNodes = this.activeNodes.filter(node => node !== source);
      source.disconnect();
      nodes.forEach(node => node.disconnect());
    }, { once: true });
  }

  private scheduleProfile(profile: GamakaProfile, instrument: InstrumentType, startTime: number, duration: number, trajectory?: TrajectoryPoint[]): void {
    if (!this.ctx || !this.masterGain) throw new Error('Gamaka audio is not initialized.');
    const { source, nodes } = scheduleGamakaTone(
      this.ctx, this.masterGain, instrument, this.baseKattaiHz, profile.plainCents, startTime, duration, trajectory,
    );
    this.trackSource(source, nodes);
  }

  private waitForPlayback(endAt: number, generation: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      let timer: number;
      const finish = (completed: boolean) => {
        if (this.activeDelayCancel === cancel) this.activeDelayCancel = null;
        window.clearTimeout(timer);
        resolve(completed && generation === this.playbackGeneration);
      };
      const check = () => {
        if (!this.ctx || generation !== this.playbackGeneration) { finish(false); return; }
        if (this.ctx.state !== 'running') {
          this.activeDelayCancel = null;
          window.clearTimeout(timer);
          this.stopAll();
          reject(new Error('Gamaka audio was interrupted. Start playback again.'));
          return;
        }
        const remaining = endAt - getAudioOutputTime(this.ctx);
        if (remaining <= 0) finish(true);
        else timer = window.setTimeout(check, Math.min(50, remaining * 1000));
      };
      const cancel = () => finish(false);
      this.activeDelayCancel = cancel;
      check();
    });
  }

  /** Plain equal-tempered note (Track A). */
  public async playPlainNote(profile: GamakaProfile, instrument: InstrumentType, multiplier = 1): Promise<void> {
    this.stopAll();
    const generation = this.playbackGeneration;
    const ctx = await this.init();
    if (generation !== this.playbackGeneration) return;
    const plan = this.practicePlan(profile, multiplier);
    const start = ctx.currentTime + 0.05;
    this.scheduleProfile(profile, instrument, start, plan.plainDurationMs / 1000);
    await this.waitForPlayback(start + plan.plainDurationMs / 1000, generation);
  }

  /** Microtonal target contour (Track B). */
  public async playGamaka(profile: GamakaProfile, instrument: InstrumentType, multiplier = 1): Promise<void> {
    this.stopAll();
    const generation = this.playbackGeneration;
    const ctx = await this.init();
    if (generation !== this.playbackGeneration) return;
    const plan = this.practicePlan(profile, multiplier);
    const start = ctx.currentTime + 0.05;
    this.scheduleProfile(profile, instrument, start, plan.durationMs / 1000, plan.points);
    await this.waitForPlayback(start + plan.durationMs / 1000, generation);
  }

  private practicePlan(profile: GamakaProfile, multiplier: number) {
    return buildGamakaPracticePlan({
      duration_ms: profile.trajectory[profile.trajectory.length - 1]?.t_ms,
      trajectory_points: profile.trajectory,
    }, multiplier, curriculum.extended_playback_and_clarity);
  }

  /** Both tracks are scheduled up front on the audio clock. */
  public async playABComparison(
    profile: GamakaProfile,
    instrument: InstrumentType,
    callbacks?: { onTrackChange?: (track: 'A' | 'B') => void; onEnd?: () => void },
    multiplier = 1
  ): Promise<void> {
    this.stopAll();
    const generation = this.playbackGeneration;
    const ctx = await this.init();
    if (generation !== this.playbackGeneration) return;
    const plan = this.practicePlan(profile, multiplier);
    const start = ctx.currentTime + 0.05;
    const secondStart = start + (plan.plainDurationMs + plan.gapMs) / 1000;
    try {
      callbacks?.onTrackChange?.('A');
      this.scheduleProfile(profile, instrument, start, plan.plainDurationMs / 1000);
      this.scheduleProfile(profile, instrument, secondStart, plan.durationMs / 1000, plan.points);
      if (!await this.waitForPlayback(secondStart, generation)) return;
      callbacks?.onTrackChange?.('B');
      await this.waitForPlayback(secondStart + plan.durationMs / 1000, generation);
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
