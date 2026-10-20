import { useEffect, useMemo, useRef, useState } from 'react';
import { getAudioContext } from '../../audio/engine';
import {
  createSoundBuffer,
  makeGeneratedSoundName,
  SOUND_PRESETS,
} from '../../audio/soundDesign';
import type { RhythmStyle, SoundCategory, SoundGenerationOptions, SoundPresetId } from '../../audio/soundDesign';

export interface GeneratedSoundRecipe {
  preset: SoundPresetId;
  beats: number;
  rhythmStyle: RhythmStyle;
  durationSeconds: number;
  intensity: number;
  seed: number;
  generatedAtBpm: number;
}

interface Props {
  bpm: number;
  suggestedStartBeat: number;
  onAddClip: (buffer: AudioBuffer, name: string, startBeat: number, recipe: GeneratedSoundRecipe) => void;
  onMessage: (message: string) => void;
}

const CATEGORIES: Array<'All' | SoundCategory> = ['All', 'Percussion', 'Nature', 'Transport', 'Mechanisms', 'Objects', 'Signals'];
const RHYTHMS: Array<{ value: RhythmStyle; label: string }> = [
  { value: 'carnatic-8', label: 'Carnatic-inspired 8-beat groove' },
  { value: 'rupaka-6', label: 'Rupaka-inspired 6-beat groove' },
  { value: 'simple-4', label: 'Simple 4-beat groove' },
  { value: 'sparse', label: 'Sparse / spacious' },
  { value: 'busy', label: 'Busy / subdivisions' },
  { value: 'random', label: 'Random variation' },
];

const panelStyle: React.CSSProperties = {
  padding: '12px 14px',
  borderBottom: '1px solid var(--border)',
  background: 'linear-gradient(135deg, rgba(45,212,191,.08), rgba(192,132,252,.08))',
  display: 'flex', flexDirection: 'column', gap: 11,
};
const inputStyle: React.CSSProperties = {
  background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)',
  borderRadius: 5, padding: '6px 8px', fontSize: '0.75rem', minWidth: 0,
};
const buttonStyle: React.CSSProperties = {
  border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)',
  borderRadius: 6, padding: '7px 11px', fontSize: '0.74rem', cursor: 'pointer',
};

export function SoundStudioPanel({ bpm, suggestedStartBeat, onAddClip, onMessage }: Props) {
  const [category, setCategory] = useState<'All' | SoundCategory>('Percussion');
  const [preset, setPreset] = useState<SoundPresetId>('mridangam');
  const [rhythmStyle, setRhythmStyle] = useState<RhythmStyle>('carnatic-8');
  const [beats, setBeats] = useState(8);
  const [durationSeconds, setDurationSeconds] = useState(6);
  const [intensity, setIntensity] = useState(0.85);
  const [startBeat, setStartBeat] = useState(suggestedStartBeat);
  const [followSuggestedBeat, setFollowSuggestedBeat] = useState(true);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 0x7fffffff));
  const [previewing, setPreviewing] = useState(false);
  const previewSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const selected = SOUND_PRESETS.find(item => item.id === preset)!;
  const availablePresets = useMemo(() => SOUND_PRESETS.filter(item => category === 'All' || item.category === category), [category]);

  useEffect(() => {
    if (!availablePresets.some(item => item.id === preset)) setPreset(availablePresets[0]?.id ?? 'mridangam');
  }, [availablePresets, preset]);

  useEffect(() => {
    if (followSuggestedBeat) setStartBeat(suggestedStartBeat);
  }, [suggestedStartBeat, followSuggestedBeat]);

  useEffect(() => () => {
    try { previewSourceRef.current?.stop(); } catch { /* source already ended */ }
  }, []);

  const makeRecipe = (): GeneratedSoundRecipe => ({
    preset,
    beats: Math.max(1, Math.min(64, Math.round(beats))),
    rhythmStyle,
    durationSeconds: Math.max(0.5, Math.min(20, durationSeconds)),
    intensity,
    seed,
    generatedAtBpm: Math.max(30, Math.min(260, bpm)),
  });

  const makeOptions = (recipe: GeneratedSoundRecipe): SoundGenerationOptions => ({
    bpm: selected.isPercussion ? Math.max(30, Math.min(260, bpm)) : bpm,
    beats: recipe.beats,
    rhythmStyle: recipe.rhythmStyle,
    durationSeconds: recipe.durationSeconds,
    intensity: recipe.intensity,
    seed: recipe.seed,
  });

  const buildBuffer = () => {
    const recipe = makeRecipe();
    const buffer = createSoundBuffer(getAudioContext(), recipe.preset, makeOptions(recipe));
    const name = makeGeneratedSoundName(recipe.preset, makeOptions(recipe));
    return { recipe, buffer, name };
  };

  const preview = () => {
    try {
      try { previewSourceRef.current?.stop(); } catch { /* previous preview ended */ }
      const { buffer, name } = buildBuffer();
      const ctx = getAudioContext();
      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      source.buffer = buffer;
      gain.gain.value = 0.86;
      source.connect(gain); gain.connect(ctx.destination);
      previewSourceRef.current = source;
      setPreviewing(true);
      source.onended = () => {
        if (previewSourceRef.current === source) {
          previewSourceRef.current = null;
          setPreviewing(false);
        }
      };
      source.start();
      onMessage(`Previewing generated ${name}. This is a synthesized sound-design approximation, not a field recording.`);
    } catch (error) {
      console.error('Sound preview failed', error);
      onMessage('Could not generate this preview in the current browser. Try a shorter sound or reload the page.');
    }
  };

  const stopPreview = () => {
    try { previewSourceRef.current?.stop(); } catch { /* already ended */ }
    previewSourceRef.current = null;
    setPreviewing(false);
  };

  const addToTimeline = () => {
    try {
      const { recipe, buffer, name } = buildBuffer();
      const placeAt = Math.max(0, Math.min(1024, Number(startBeat) || 0));
      onAddClip(buffer, name, placeAt, recipe);
      setSeed(Math.floor(Math.random() * 0x7fffffff));
      setFollowSuggestedBeat(true);
      onMessage(`Added “${name}” at beat ${placeAt.toFixed(2)}. Use the timeline to reposition it and WAV export to render it with the arrangement.`);
    } catch (error) {
      console.error('Sound generation failed', error);
      onMessage('Sound generation failed. Try a shorter sound or fewer beats.');
    }
  };

  const categoryButton = (value: 'All' | SoundCategory) => (
    <button key={value} onClick={() => setCategory(value)} style={{ ...buttonStyle, padding: '5px 9px', borderColor: category === value ? 'var(--accent)' : 'var(--border)', color: category === value ? 'var(--accent)' : 'var(--text-muted)', background: category === value ? 'var(--accent-dim)' : 'var(--surface)' }}>{value}</button>
  );

  return (
    <section aria-label="Sound and rhythm studio" style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text)', fontWeight: 750 }}>🎛 Sound & Rhythm Studio</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 3 }}>Create percussion grooves and sound effects in code, preview them, then add them as synchronized timeline clips.</div>
        </div>
        <span style={{ fontSize: '0.65rem', border: '1px solid rgba(45,212,191,.4)', color: '#2dd4bf', borderRadius: 99, padding: '4px 8px' }}>Procedural audio</span>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{CATEGORIES.map(categoryButton)}</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))', gap: 10 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.69rem', color: 'var(--text-muted)' }}>
          Sound / instrument
          <select value={preset} onChange={event => setPreset(event.target.value as SoundPresetId)} style={inputStyle}>
            {availablePresets.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
          <span style={{ fontSize: '0.64rem', color: 'var(--text-faint)' }}>{selected.description}</span>
        </label>

        {selected.isPercussion ? (
          <>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.69rem', color: 'var(--text-muted)' }}>
              Rhythm pattern
              <select value={rhythmStyle} onChange={event => setRhythmStyle(event.target.value as RhythmStyle)} style={inputStyle}>{RHYTHMS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.69rem', color: 'var(--text-muted)' }}>
              Pattern length
              <select value={beats} onChange={event => setBeats(Number(event.target.value))} style={inputStyle}>{[4, 6, 8, 12, 16, 24, 32].map(value => <option value={value} key={value}>{value} beats</option>)}</select>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.69rem', color: 'var(--text-muted)' }}>
              <label>Tempo used to generate: <strong>{Math.round(bpm)} BPM</strong></label>
              <label>Intensity: {Math.round(intensity * 100)}%</label>
              <input type="range" min={0.2} max={1.35} step={0.05} value={intensity} onChange={event => setIntensity(Number(event.target.value))} />
            </div>
          </>
        ) : (
          <>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.69rem', color: 'var(--text-muted)' }}>
              Sound duration
              <select value={durationSeconds} onChange={event => setDurationSeconds(Number(event.target.value))} style={inputStyle}>{[2, 4, 6, 8, 10, 15, 20].map(value => <option value={value} key={value}>{value} seconds</option>)}</select>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.69rem', color: 'var(--text-muted)' }}>
              <label>Intensity: <strong>{Math.round(intensity * 100)}%</strong></label>
              <input type="range" min={0.2} max={1.35} step={0.05} value={intensity} onChange={event => setIntensity(Number(event.target.value))} />
              <span style={{ fontSize: '0.64rem', color: 'var(--text-faint)' }}>Use shorter effects for precise accents and longer clips for ambience.</span>
            </div>
          </>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 10, alignItems: 'end' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.69rem', color: 'var(--text-muted)' }}>
          Place at beat
          <input type="number" min={0} max={1024} step={0.25} value={startBeat} onChange={event => { setFollowSuggestedBeat(false); setStartBeat(Math.max(0, Number(event.target.value) || 0)); }} style={inputStyle} />
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          <button onClick={preview} style={{ ...buttonStyle, borderColor: 'var(--accent)', color: 'var(--accent)' }}>▶ Preview</button>
          {previewing && <button onClick={stopPreview} style={{ ...buttonStyle, color: 'var(--red)' }}>■ Stop preview</button>}
          <button onClick={addToTimeline} style={{ ...buttonStyle, borderColor: '#2dd4bf', color: '#2dd4bf', background: 'rgba(45,212,191,.08)', fontWeight: 700 }}>＋ Add to Timeline</button>
          <button onClick={() => setSeed(Math.floor(Math.random() * 0x7fffffff))} title="Generate a different variation" style={buttonStyle}>↻ Variation</button>
        </div>
      </div>
      <div style={{ color: 'var(--text-faint)', fontSize: '0.65rem', lineHeight: 1.5 }}>
        Musical note: the percussion patterns are practice grooves inspired by these instruments, not authenticated traditional sollukattu or artist-recorded performances. The environmental sounds are procedural approximations; realistic field recordings can be added later from properly licensed sample libraries.
      </div>
    </section>
  );
}
