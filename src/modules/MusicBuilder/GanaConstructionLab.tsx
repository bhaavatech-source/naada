import { useEffect, useMemo, useState, type CSSProperties } from 'react';

type LabTab = 'sequencer' | 'clips' | 'library' | 'tala' | 'versions';
type EventNote = { id: string; svara: string; semitone: number; startTick: number; durationTicks: number; octave: number };
type Phrase = { id: string; name: string; raga: string; source: string; status: 'verified' | 'transcribed' | 'experimental'; events: EventNote[] };
type LabProject = { schemaVersion: 1; title: string; raga: string; bpm: number; tala: string; subdivisions: number; events: EventNote[]; clips: Phrase[]; updatedAt: string };
type LabVersion = { id: string; label: string; savedAt: string; project: LabProject };
const STORE_KEY = 'naada.gana-construction-lab.v1';
const VERSION_KEY = 'naada.gana-construction-lab.versions.v1';
const ROWS = [
  { svara: 'Sa', semitone: 0 }, { svara: 'Ri₁', semitone: 1 }, { svara: 'Ri₂/Ga₁', semitone: 2 },
  { svara: 'Ri₃/Ga₂', semitone: 3 }, { svara: 'Ga₃', semitone: 4 }, { svara: 'Ma₁', semitone: 5 },
  { svara: 'Ma₂', semitone: 6 }, { svara: 'Pa', semitone: 7 }, { svara: 'Dha₁', semitone: 8 },
  { svara: 'Dha₂/Ni₁', semitone: 9 }, { svara: 'Dha₃/Ni₂', semitone: 10 }, { svara: 'Ni₃', semitone: 11 },
  { svara: 'Sa′', semitone: 12 },
];
const TALAS: Record<string, number> = { 'Ādi (8 akṣaras)': 8, 'Rūpaka (6 akṣaras)': 6, 'Miśra Cāpu (7 units)': 7, 'Khaṇḍa Cāpu (5 units)': 5 };
const uid = () => Math.random().toString(36).slice(2, 10);
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const emptyProject = (raga: string, bpm: number): LabProject => ({ schemaVersion: 1, title: 'Untitled Gāna', raga, bpm, tala: 'Ādi (8 akṣaras)', subdivisions: 4, events: [], clips: [], updatedAt: new Date().toISOString() });

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
function isEvent(value: unknown): value is EventNote {
  return isRecord(value) && typeof value.id === 'string' && typeof value.svara === 'string'
    && isFiniteNumber(value.semitone) && Math.abs(value.semitone) <= 48
    && isFiniteNumber(value.octave) && Number.isInteger(value.octave) && Math.abs(value.octave) <= 3
    && isFiniteNumber(value.startTick) && value.startTick >= 0 && value.startTick <= 100000
    && isFiniteNumber(value.durationTicks) && value.durationTicks > 0 && value.durationTicks <= 1024;
}
function isLabProject(value: unknown): value is LabProject {
  return isRecord(value) && value.schemaVersion === 1 && typeof value.title === 'string'
    && typeof value.raga === 'string' && isFiniteNumber(value.bpm) && value.bpm >= 30 && value.bpm <= 300
    && typeof value.tala === 'string' && Object.prototype.hasOwnProperty.call(TALAS, value.tala)
    && isFiniteNumber(value.subdivisions) && Number.isInteger(value.subdivisions) && value.subdivisions >= 1 && value.subdivisions <= 8
    && typeof value.updatedAt === 'string'
    && Array.isArray(value.events) && value.events.length <= 10000 && value.events.every(isEvent)
    && Array.isArray(value.clips) && value.clips.length <= 1000 && value.clips.every(clip =>
      isRecord(clip) && typeof clip.id === 'string' && typeof clip.name === 'string'
      && typeof clip.raga === 'string' && typeof clip.source === 'string'
      && ['verified', 'transcribed', 'experimental'].includes(String(clip.status))
      && Array.isArray(clip.events) && clip.events.length <= 10000 && clip.events.every(isEvent));
}
function isLabVersion(value: unknown): value is LabVersion {
  return isRecord(value) && typeof value.id === 'string' && typeof value.label === 'string'
    && typeof value.savedAt === 'string' && isLabProject(value.project);
}

export function GanaConstructionLab({ ragaName, bpm: initialBpm, onBack, onApplySequence }: {
  ragaName: string; bpm: number; onBack: () => void;
  onApplySequence: (events: Array<{ label: string; semitone: number; duration: number; startBeat: number }>) => void;
}) {
  const [tab, setTab] = useState<LabTab>('sequencer');
  const [restored] = useState(() => {
    let project = emptyProject(ragaName, initialBpm || 80);
    let versions: LabVersion[] = [];
    const errors: string[] = [];
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (!isLabProject(parsed)) throw new Error('Stored Lab project is invalid.');
        project = parsed;
      }
    } catch (error) {
      console.error('Could not restore Gāna Lab project', error);
      errors.push('Could not restore the stored Lab project. A new project is open.');
    }
    try {
      const raw = localStorage.getItem(VERSION_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed) || !parsed.every(isLabVersion)) throw new Error('Stored Lab snapshots are invalid.');
      versions = parsed.slice(0, 30);
    } catch (error) {
      console.error('Could not restore Gāna Lab snapshots', error);
      errors.push('Could not restore the stored Lab snapshots.');
    }
    return { project, versions, error: errors.join(' ') };
  });
  const [project, setProject] = useState(restored.project);
  const [versions, setVersions] = useState(restored.versions);
  const [filter, setFilter] = useState('');
  const [notice, setNotice] = useState(restored.error);
  const [importText, setImportText] = useState('');
  useEffect(() => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ ...project, updatedAt: new Date().toISOString() })); } catch { setNotice('Autosave unavailable in this browser session. Use Export Project JSON.'); }
  }, [project]);
  useEffect(() => {
    try { localStorage.setItem(VERSION_KEY, JSON.stringify(versions.slice(0, 30))); } catch { setNotice('Version history could not be saved in browser storage. Export snapshots as project JSON.'); }
  }, [versions]);
  const beats = TALAS[project.tala] ?? 8;
  const totalTicks = beats * project.subdivisions;
  const update = (patch: Partial<LabProject>) => setProject(p => ({ ...p, ...patch, updatedAt: new Date().toISOString() }));
  const addNote = (row: typeof ROWS[number], tick: number) => {
    setProject(p => ({ ...p, events: [...p.events, { id: uid(), svara: row.svara, semitone: row.semitone, octave: 0, startTick: tick, durationTicks: 1, }], updatedAt: new Date().toISOString() }));
  };
  const sortedEvents = useMemo(() => [...project.events].sort((a,b) => a.startTick-b.startTick), [project.events]);
  const saveVersion = (label = `Snapshot ${versions.length + 1}`) => {
    setVersions(v => [{ id: uid(), label, savedAt: new Date().toISOString(), project: clone(project) }, ...v].slice(0, 30));
    setNotice(`Saved version: ${label}`);
  };
  const download = (name: string, data: string, type = 'application/json') => {
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
  };
  const exportProject = () => download('naada-gana-project.json', JSON.stringify({ format: 'naada-gana-project', ...project }, null, 2));
  const importProject = () => {
    try {
      const parsed: unknown = JSON.parse(importText);
      if (!isLabProject(parsed)) throw new Error('Invalid Lab project. Import a Gāna Construction Lab JSON export with valid events and timing.');
      setProject(parsed); setNotice('Project imported successfully.');
    } catch (e) { setNotice(e instanceof Error ? e.message : 'Could not import project JSON.'); }
  };
  const addSelectedToLibrary = () => {
    if (!project.events.length) { setNotice('Add some svaras before saving a phrase.'); return; }
    const phrase: Phrase = { id: uid(), name: `Phrase ${project.clips.length + 1}`, raga: project.raga, source: 'Created in Gāna Builder', status: 'experimental', events: clone(sortedEvents) };
    update({ clips: [...project.clips, phrase] }); setNotice('Phrase saved as experimental. Verify it before using it as a rāga reference.');
  };
  const usePhrase = (phrase: Phrase) => {
    const start = project.events.reduce((end, n) => Math.max(end, n.startTick + n.durationTicks), 0);
    update({ events: [...project.events, ...phrase.events.map(n => ({ ...n, id: uid(), startTick: n.startTick + start }))] });
    setNotice(`Added “${phrase.name}” to the sequencer.`);
  };
  const applySequence = () => {
    if (!project.events.length) { setNotice('Add svaras to the grid first.'); return; }
    const events = sortedEvents.map(n => ({ label: n.svara, semitone: n.semitone + (n.octave * 12), duration: Math.max(0.125, n.durationTicks / project.subdivisions), startBeat: n.startTick / project.subdivisions }));
    onApplySequence(events); setNotice('Sequence added to the active Gāna Builder track.');
  };
  const panel: CSSProperties = { border: '1px solid var(--border)', borderRadius: 10, padding: 12, background: 'var(--surface)' };
  const button: CSSProperties = { border: '1px solid var(--border)', borderRadius: 7, padding: '7px 10px', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', fontSize: '0.8rem' };
  return <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 14, color: 'var(--text)', background: 'var(--surface)' }}>
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <div><div style={{ fontSize: '1.15rem', fontWeight: 800 }}>Gāna Construction Lab</div><div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Svara sequencer · phrase clips · rāga phrase library · tāḷa grid · project versions</div></div>
      <button style={button} onClick={onBack}>← Back to Gāna Builder</button>
    </div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 12 }}>
      {([['sequencer','Svara Sequencer'],['clips','Phrase Clip Editor'],['library','Rāga Phrase Library'],['tala','Tāḷa Grid'],['versions','Save & Versions']] as const).map(([id,label]) => <button key={id} onClick={() => setTab(id)} style={{ ...button, borderColor: tab === id ? 'var(--accent)' : 'var(--border)', color: tab === id ? 'var(--accent)' : 'var(--text)' }}>{label}</button>)}
      <button style={button} onClick={exportProject}>Export Project JSON</button>
    </div>
    <div style={{ ...panel, marginBottom: 12, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'end' }}>
      <label style={{ fontSize: '0.78rem' }}>Project title<input value={project.title} onChange={e => update({ title: e.target.value })} style={{ display: 'block', marginTop: 4, padding: 7, width: 220, maxWidth: '100%' }} /></label>
      <label style={{ fontSize: '0.78rem' }}>Rāga<input value={project.raga} onChange={e => update({ raga: e.target.value })} style={{ display: 'block', marginTop: 4, padding: 7, width: 220, maxWidth: '100%' }} /></label>
      <label style={{ fontSize: '0.78rem' }}>BPM<input type="number" min={30} max={260} value={project.bpm} onChange={e => update({ bpm: Math.max(30, Math.min(260, Number(e.target.value) || 80)) })} style={{ display: 'block', marginTop: 4, padding: 7, width: 80 }} /></label>
      <label style={{ fontSize: '0.78rem' }}>Tāḷa<select value={project.tala} onChange={e => update({ tala: e.target.value })} style={{ display: 'block', marginTop: 4, padding: 7 }}>{Object.keys(TALAS).map(t => <option key={t}>{t}</option>)}</select></label>
      <label style={{ fontSize: '0.78rem' }}>Subdivisions<select value={project.subdivisions} onChange={e => update({ subdivisions: Number(e.target.value) })} style={{ display: 'block', marginTop: 4, padding: 7 }}>{[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} per akṣara</option>)}</select></label>
    </div>
    {tab === 'sequencer' && <div style={panel}>
      <div style={{ fontWeight: 750, marginBottom: 8 }}>Click a cell to add a svara at that subdivision</div>
      <div style={{ overflowX: 'auto' }}><div style={{ minWidth: 760 }}>
        <div style={{ display: 'grid', gridTemplateColumns: `100px repeat(${totalTicks}, minmax(24px,1fr))`, gap: 2, marginBottom: 3 }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Svara</div>
          {Array.from({ length: totalTicks }, (_, tick) => <div key={tick} style={{ textAlign: 'center', fontSize: '0.65rem', padding: 3, background: tick % project.subdivisions === 0 ? 'var(--surface2)' : 'transparent', borderRadius: 3 }}>{tick % project.subdivisions === 0 ? `${tick / project.subdivisions + 1}` : '·'}</div>)}
        </div>
        {ROWS.map(row => <div key={row.svara} style={{ display: 'grid', gridTemplateColumns: `100px repeat(${totalTicks}, minmax(24px,1fr))`, gap: 2, marginBottom: 2 }}>
          <div style={{ fontSize: '0.76rem', padding: 5, background: 'var(--surface2)', borderRadius: 4 }}>{row.svara}</div>
          {Array.from({ length: totalTicks }, (_, tick) => { const event = project.events.find(n => n.svara === row.svara && n.startTick === tick); return <button key={tick} aria-label={`Add ${row.svara} at subdivision ${tick + 1}`} onClick={() => event ? setProject(p => ({ ...p, events: p.events.filter(n => n.id !== event.id) })) : addNote(row, tick)} style={{ minWidth: 0, height: 28, padding: 0, border: '1px solid var(--border)', borderRadius: 3, background: event ? 'var(--accent)' : (tick % project.subdivisions === 0 ? 'var(--surface2)' : 'var(--surface)'), cursor: 'pointer' }} title={event ? 'Click to remove note' : `Add ${row.svara}`} />; })}
        </div>)}
      </div></div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}><button style={button} onClick={() => update({ events: [] })}>Clear grid</button><button style={button} onClick={addSelectedToLibrary}>Save sequence as phrase</button><button style={{ ...button, borderColor: 'var(--accent)', color: 'var(--accent)' }} onClick={applySequence}>Add sequence to active track</button></div>
      <div style={{ marginTop: 10, fontSize: '0.75rem', color: 'var(--text-muted)' }}>This first version uses semitone positions as a playback scaffold. Rāga validation and gamaka-aware phrase rules must come from verified rāga data before a phrase can be labelled correct.</div>
    </div>}
    {tab === 'clips' && <div style={panel}>
      <div style={{ fontWeight: 750, marginBottom: 8 }}>Phrase clips on the current cycle</div>
      {sortedEvents.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Add notes in the Svara Sequencer, then edit their durations and positions here.</div>}
      {sortedEvents.map(n => <div key={n.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(90px,1fr) 100px 100px 80px', gap: 8, alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
        <strong>{n.svara}</strong>
        <label style={{ fontSize: '0.7rem' }}>Start tick<input type="number" min={0} max={1024} value={n.startTick} onChange={e => update({ events: project.events.map(x => x.id === n.id ? { ...x, startTick: Math.max(0, Number(e.target.value) || 0) } : x) })} style={{ width: '100%', boxSizing: 'border-box', padding: 5 }} /></label>
        <label style={{ fontSize: '0.7rem' }}>Duration<input type="number" min={1} max={64} value={n.durationTicks} onChange={e => update({ events: project.events.map(x => x.id === n.id ? { ...x, durationTicks: Math.max(1, Number(e.target.value) || 1) } : x) })} style={{ width: '100%', boxSizing: 'border-box', padding: 5 }} /></label>
        <button style={button} onClick={() => update({ events: project.events.filter(x => x.id !== n.id) })}>Delete</button>
      </div>)}
      <div style={{ marginTop: 12 }}><button style={button} onClick={() => update({ events: sortedEvents.map((n,i) => ({ ...n, startTick: i * project.subdivisions })) })}>Arrange sequentially</button> <button style={button} onClick={() => update({ events: sortedEvents.map(n => ({ ...n, startTick: Math.max(0, n.startTick - project.subdivisions) })) })}>Shift left 1 beat</button> <button style={button} onClick={() => update({ events: sortedEvents.map(n => ({ ...n, startTick: n.startTick + project.subdivisions })) })}>Shift right 1 beat</button></div>
    </div>}
    {tab === 'library' && <div style={panel}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}><input placeholder="Filter by phrase or rāga" value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: 8, minWidth: 220 }} /><button style={button} onClick={addSelectedToLibrary}>Save current phrase</button></div>
      {project.clips.filter(p => `${p.name} ${p.raga} ${p.status}`.toLowerCase().includes(filter.toLowerCase())).map(p => <div key={p.id} style={{ ...panel, marginBottom: 8, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
        <div><strong>{p.name}</strong><div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{p.raga} · {p.events.length} notes · {p.status} · {p.source}</div></div>
        <div style={{ display: 'flex', gap: 6 }}><button style={button} onClick={() => usePhrase(p)}>Insert</button><button style={button} onClick={() => saveVersion(`Before deleting ${p.name}`)}>Snapshot</button><button style={button} onClick={() => update({ clips: project.clips.filter(x => x.id !== p.id) })}>Delete</button></div>
      </div>)}
      {project.clips.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No phrases yet. Save a sequence from the editor. New phrases are marked experimental until reviewed.</p>}
    </div>}
    {tab === 'tala' && <div style={panel}>
      <div style={{ fontWeight: 750, marginBottom: 8 }}>Tāḷa cycle · {project.tala}</div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${beats}, minmax(48px,1fr))`, gap: 5 }}>
        {Array.from({ length: beats }, (_, beat) => <div key={beat} style={{ border: `1px solid ${beat === 0 ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 7, padding: 8, background: beat === 0 ? 'var(--accent-dim)' : 'var(--surface2)', textAlign: 'center' }}><strong>{beat === 0 ? 'SAMAM' : beat + 1}</strong><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>{Array.from({ length: project.subdivisions }, (_, i) => i + 1).join(' · ')}</div><div style={{ fontSize: '0.65rem', marginTop: 4 }}>{project.events.filter(n => Math.floor(n.startTick / project.subdivisions) === beat).length} notes</div></div>)}
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>This grid currently models a cycle and subdivisions. Full anga/kriya semantics, cāpu grouping and Korvai alignment should be connected to the app's authoritative tāḷa definitions before treating this as a tāḷa validator.</p>
    </div>}
    {tab === 'versions' && <div style={panel}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}><button style={button} onClick={() => saveVersion()}>Save snapshot</button><button style={button} onClick={() => download('naada-gana-project.json', JSON.stringify({ format: 'naada-gana-project', ...project }, null, 2))}>Export JSON</button><label style={button}>Import JSON<input type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={async e => { const file = e.target.files?.[0]; if (file) { setImportText(await file.text()); } }} /></label><button style={button} onClick={importProject} disabled={!importText}>Load selected JSON</button></div>
      <textarea value={importText} onChange={e => setImportText(e.target.value)} placeholder="Imported JSON appears here. You can also paste project JSON." style={{ width: '100%', minHeight: 100, boxSizing: 'border-box', padding: 8 }} />
      {versions.map(v => <div key={v.id} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, padding: 9, borderBottom: '1px solid var(--border)' }}><div><strong>{v.label}</strong><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(v.savedAt).toLocaleString()}</div></div><button style={button} onClick={() => { setProject(clone(v.project)); setNotice(`Restored ${v.label}`); }}>Restore</button></div>)}
      {versions.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Named snapshots are stored in this browser. Export project JSON regularly for portable backups; browser storage can be cleared by the user or browser.</p>}
    </div>}
    {notice && <div role="status" style={{ marginTop: 10, color: 'var(--accent)', fontSize: '0.8rem' }}>{notice}</div>}
  </div>;
}
