import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, RotateCcw, Star, Sparkles, Award } from 'lucide-react';
import { useGamakaStore } from '../../store/useGamakaStore';
import { GAMAKA_EXERCISES } from '../../data/gamakaCatalogData';
import type { GamakaExercise } from '../../types/gamaka';
import { useAppStore } from '../../store/useAppStore';

// One global timing multiplier for all Voice Flight practice exercises.
// 3x gives singers more time to follow each contour and collect the waypoints.
const GAMAKA_PRACTICE_TIME_MULTIPLIER = 3;

export const GamakaCanvasGame: React.FC = () => {
  const {
    gameLevel,
    setGameLevel,
    activeExerciseId,
    setActiveExerciseId,
    setGameResult
  } = useGamakaStore();

  const tonicHz = useAppStore(state => state.settings.tonicHz);
  const tonicHzRef = useRef(tonicHz);
  tonicHzRef.current = tonicHz;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(800);
  const [isListening, setIsListening] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);
  const [collectedStars, setCollectedStars] = useState<number[]>([]);
  const [combo, setCombo] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);
  const [finalScoreData, setFinalScoreData] = useState<{
    score: number;
    stars: number;
    avgError: number;
    violations: number;
    badge: string;
  } | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Exercise selection
  const levelExercises = GAMAKA_EXERCISES.filter(e => e.level === gameLevel);
  const currentExercise = GAMAKA_EXERCISES.find(e => e.id === activeExerciseId) || levelExercises[0] || GAMAKA_EXERCISES[0];

  // Game execution state
  const gameStateRef = useRef({
    startTime: 0,
    currentPitchCents: 0,
    history: [] as { t: number; cents: number; inTolerance: boolean }[],
    collectedWaypoints: new Set<number>(),
    violations: 0,
    totalCentsDiff: 0,
    sampleCount: 0
  });

  // Autocorrelation pitch detection algorithm
  const detectPitch = (buffer: Float32Array, sampleRate: number): number | null => {
    let sumSquares = 0;
    for (let i = 0; i < buffer.length; i++) {
      sumSquares += buffer[i] * buffer[i];
    }
    const rms = Math.sqrt(sumSquares / buffer.length);
    if (rms < 0.02) return null; // Silence / background noise gate

    let r1 = 0, r2 = buffer.length - 1;
    const thres = 0.2;
    for (let i = 0; i < buffer.length / 2; i++) {
      if (Math.abs(buffer[i]) < thres) { r1 = i; break; }
    }
    for (let i = 1; i < buffer.length / 2; i++) {
      if (Math.abs(buffer[buffer.length - i]) < thres) { r2 = buffer.length - i; break; }
    }

    const trimmed = buffer.slice(r1, r2);
    const c = new Array(trimmed.length).fill(0);
    for (let i = 0; i < trimmed.length; i++) {
      for (let j = 0; j < trimmed.length - i; j++) {
        c[i] += trimmed[j] * trimmed[j + i];
      }
    }

    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxVal = -1, maxPos = -1;
    for (let i = d; i < trimmed.length; i++) {
      if (c[i] > maxVal) {
        maxVal = c[i];
        maxPos = i;
      }
    }

    if (maxPos > 0) {
      return sampleRate / maxPos;
    }
    return null;
  };

  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      setIsListening(true);
      setIsCompleted(false);
      setCollectedStars([]);
      setCurrentScore(0);
      setCombo(1);

      gameStateRef.current = {
        startTime: performance.now(),
        currentPitchCents: 0,
        history: [],
        collectedWaypoints: new Set<number>(),
        violations: 0,
        totalCentsDiff: 0,
        sampleCount: 0
      };

      runGameLoop();
    } catch (err) {
      alert('Microphone access is required to play the Voice Flight game. Please allow mic permissions.');
    }
  };

  const stopMic = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setIsListening(false);
  };

  const runGameLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas || !analyserRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const buffer = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buffer);

    const detectedHz = detectPitch(buffer, audioCtxRef.current?.sampleRate || 44100);
    const hasValidPitch = detectedHz !== null && detectedHz > 50 && detectedHz < 1500;

    const now = performance.now();
    const elapsedMs = now - gameStateRef.current.startTime;
    const baseTrajectory = currentExercise.trajectory;
    const trajectory = baseTrajectory.map(point => ({
      ...point,
      t_ms: point.t_ms * GAMAKA_PRACTICE_TIME_MULTIPLIER
    }));
    const waypoints = currentExercise.waypoints.map(point => ({
      ...point,
      t_ms: point.t_ms * GAMAKA_PRACTICE_TIME_MULTIPLIER
    }));
    const durationMs = trajectory[trajectory.length - 1]?.t_ms || 2500 * GAMAKA_PRACTICE_TIME_MULTIPLIER;

    // Convert Hz to cents relative to Kattai
    if (hasValidPitch && detectedHz !== null) {
      let cents = 1200 * Math.log2(detectedHz / tonicHzRef.current);
      // Octave folding so male singers (Mandra), female singers (Madhya), and children can sing naturally
      while (cents < -200) cents += 1200;
      while (cents > 1400) cents -= 1200;
      // Smooth LERP (0.2)
      gameStateRef.current.currentPitchCents += (cents - gameStateRef.current.currentPitchCents) * 0.2;
    }

    // Find target cents at current time
    let targetCents = trajectory[0].cents;
    for (let i = 0; i < trajectory.length - 1; i++) {
      if (elapsedMs >= trajectory[i].t_ms && elapsedMs <= trajectory[i + 1].t_ms) {
        const factor = (elapsedMs - trajectory[i].t_ms) / (trajectory[i + 1].t_ms - trajectory[i].t_ms);
        targetCents = trajectory[i].cents + factor * (trajectory[i + 1].cents - trajectory[i].cents);
        break;
      }
    }

    const currentPitch = gameStateRef.current.currentPitchCents;
    const centsError = Math.abs(currentPitch - targetCents);
    const inTolerance = centsError <= currentExercise.toleranceCents;

    if (hasValidPitch) {
      gameStateRef.current.totalCentsDiff += centsError;
      gameStateRef.current.sampleCount++;
      if (!inTolerance && currentPitch > targetCents + 100) gameStateRef.current.violations++;

      waypoints.forEach(wp => {
        if (Math.abs(elapsedMs - wp.t_ms) < 250 && !gameStateRef.current.collectedWaypoints.has(wp.star_index) && inTolerance) {
          gameStateRef.current.collectedWaypoints.add(wp.star_index);
          setCollectedStars(Array.from(gameStateRef.current.collectedWaypoints));
          setCombo(c => {
            const nextCombo = c + 1;
            setCurrentScore(s => s + 250 * nextCombo);
            return nextCombo;
          });
        }
      });
      gameStateRef.current.history.push({ t: elapsedMs, cents: currentPitch, inTolerance });
    }

    // RENDER CANVAS
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Background Grid
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, width, height);

    const minCents = -100;
    const maxCents = 1300;
    const centsToY = (c: number) => height - ((c - minCents) / (maxCents - minCents)) * height;
    const msToX = (t: number) => (t / durationMs) * (width - 80) + 40;

    // Draw Tolerance Ribbon
    ctx.beginPath();
    trajectory.forEach((pt, idx) => {
      const x = msToX(pt.t_ms);
      const y = centsToY(pt.cents + currentExercise.toleranceCents);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    for (let i = trajectory.length - 1; i >= 0; i--) {
      const pt = trajectory[i];
      const x = msToX(pt.t_ms);
      const y = centsToY(pt.cents - currentExercise.toleranceCents);
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.fill();

    // Draw Ideal Center Line
    ctx.beginPath();
    trajectory.forEach((pt, idx) => {
      const x = msToX(pt.t_ms);
      const y = centsToY(pt.cents);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw Star Waypoints
    waypoints.forEach(wp => {
      const x = msToX(wp.t_ms);
      const y = centsToY(wp.cents);
      const isCollected = gameStateRef.current.collectedWaypoints.has(wp.star_index);

      ctx.fillStyle = isCollected ? '#10B981' : '#F59E0B';
      ctx.beginPath();
      ctx.arc(x, y, isCollected ? 14 : 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`★`, x, y + 4);
    });

    // Draw User Flight Path
    if (gameStateRef.current.history.length > 1) {
      ctx.beginPath();
      gameStateRef.current.history.forEach((h, idx) => {
        const x = msToX(h.t);
        const y = centsToY(h.cents);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = hasValidPitch ? (inTolerance ? '#10B981' : '#EF4444') : '#64748B';
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    // Draw Current Avatar Position
    const curX = msToX(elapsedMs);
    const curY = centsToY(currentPitch);

    ctx.save();
    ctx.fillStyle = !hasValidPitch ? '#64748B' : (inTolerance ? '#34D399' : '#F87171');
    ctx.shadowColor = !hasValidPitch ? '#64748B' : (inTolerance ? '#10B981' : '#EF4444');
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(curX, curY, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Exercise Completion Check
    if (elapsedMs >= durationMs) {
      stopMic();
      const avgError = gameStateRef.current.sampleCount > 0
        ? Math.round(gameStateRef.current.totalCentsDiff / gameStateRef.current.sampleCount)
        : 1200;

      const starsEarned = gameStateRef.current.collectedWaypoints.size;
      const calculatedScore = gameStateRef.current.sampleCount === 0
        ? 0
        : Math.max(0, Math.round(100 - avgError * 1.2 - gameStateRef.current.violations * 4));

      let badge = 'Abhyāsa (Keep Practicing)';
      if (calculatedScore >= 85) badge = 'Nāda Vilāsam! (Superb Curve)';
      else if (calculatedScore >= 70) badge = 'Śubham! (Good Control)';

      setFinalScoreData({
        score: calculatedScore,
        stars: starsEarned,
        avgError,
        violations: gameStateRef.current.violations,
        badge
      });
      setGameResult(calculatedScore, starsEarned);
      setIsCompleted(true);
      return;
    }

    animFrameRef.current = requestAnimationFrame(runGameLoop);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(([entry]) => {
      setCanvasWidth(Math.max(1, Math.round(entry.contentRect.width)));
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (micStreamRef.current) micStreamRef.current.getTracks().forEach(t => t.stop());
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  return (
    <div className="gamaka-game" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Exercise Bar */}
      <div
        className="gamaka-exercise-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#1E293B',
          borderRadius: '16px',
          border: '1px solid #334155'
        }}
      >
        <div className="gamaka-exercise-copy">
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                background: '#4338CA',
                color: '#EEF2FF',
                padding: '4px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700
              }}
            >
              {currentExercise.theme}
            </span>
            <span style={{ color: '#94A3B8', fontSize: '13px' }}>Avatar: {currentExercise.avatar}</span>
          </div>
          <h2 style={{ color: '#F8FAFC', margin: '8px 0 2px 0', fontSize: '20px' }}>{currentExercise.title}</h2>
          <span style={{ color: '#38BDF8', fontSize: '13px' }}>Tip: {currentExercise.pronunciationCue}</span>
        </div>

        {/* Level Selector */}
        <div className="gamaka-levels" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {(['beginner', 'intermediate', 'expert'] as const).map(lvl => (
            <button
              key={lvl}
              aria-pressed={gameLevel === lvl}
              onClick={() => { stopMic(); setIsCompleted(false); setGameLevel(lvl); }}
              style={{
                background: gameLevel === lvl ? '#F59E0B' : '#334155',
                color: gameLevel === lvl ? '#0F172A' : '#CBD5E1',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 12px',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="gamaka-flight-panel">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={360}
          aria-label="Voice Flight pitch trajectory"
          style={{ width: '100%', height: 360, display: 'block', borderRadius: 16, background: '#0F172A' }}
        />

        {/* Live scores */}
        <div
          className="gamaka-hud"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            alignItems: 'center'
          }}
        >
          <div style={{ background: 'rgba(15, 23, 42, 0.85)', padding: '6px 14px', borderRadius: '10px', color: '#F59E0B', fontWeight: 800 }}>
            ★ Stars: {collectedStars.length} / {currentExercise.waypoints.length}
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.85)', padding: '6px 14px', borderRadius: '10px', color: '#10B981', fontWeight: 800 }}>
            🔥 Combo: {combo}x
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.85)', padding: '6px 14px', borderRadius: '10px', color: '#F8FAFC', fontWeight: 800 }}>
            Score: {currentScore}
          </div>
        </div>

        {/* Microphone control */}
        <div className="gamaka-mic-control">
          {!isListening ? (
            <button
              onClick={startMic}
              style={{
                background: '#10B981',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '30px',
                padding: '12px 28px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
              }}
            >
              <Mic size={18} /> Start Singing
            </button>
          ) : (
            <button
              onClick={stopMic}
              style={{
                background: '#EF4444',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '30px',
                padding: '12px 28px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <MicOff size={18} /> Stop Singing
            </button>
          )}
        </div>
      </div>

      {/* Completion Modal */}
      {isCompleted && finalScoreData && (
        <div
          style={{
            background: '#1E293B',
            border: '2px solid #10B981',
            borderRadius: '16px',
            padding: '24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <Award size={48} color="#F59E0B" />
          <h2 style={{ color: '#F8FAFC', margin: 0 }}>{finalScoreData.badge}</h2>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#10B981' }}>{finalScoreData.score} / 100</div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {[1, 2, 3].map(s => (
              <Star
                key={s}
                size={28}
                fill={s <= finalScoreData.stars ? '#F59E0B' : 'none'}
                color="#F59E0B"
              />
            ))}
          </div>

          <div style={{ color: '#94A3B8', fontSize: '13px' }}>
            Avg Deviation: <b>{finalScoreData.avgError} cents</b> | Boundary Overshoots: <b>{finalScoreData.violations}</b>
          </div>

          <button
            onClick={startMic}
            style={{
              background: '#F59E0B',
              color: '#0F172A',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 24px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '8px'
            }}
          >
            <RotateCcw size={16} /> Fly Again
          </button>
        </div>
      )}
    </div>
  );
};
