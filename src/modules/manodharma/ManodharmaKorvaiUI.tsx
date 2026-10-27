import React, { useState, useMemo } from 'react';
import { Sparkles, Compass, Calculator, Music, CheckCircle, AlertTriangle, BookOpen, Brain, Headphones, Layers } from 'lucide-react';
import { manodharmaKorvaiEngine, KorvaiPhrase } from './manodharmaKorvaiEngine';

export const ManodharmaKorvaiUI: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'guide' | 'branches' | 'percussion' | 'calculator' | 'library'>('guide');
  const [selectedBranch, setSelectedBranch] = useState<string>('raga_alapana');

  // Interactive Korvai Calculator States
  const [purvangaMatras, setPurvangaMatras] = useState<number>(8);
  const [makutamPhraseMatras, setMakutamPhraseMatras] = useState<number>(5);
  const [gapMatras, setGapMatras] = useState<number>(2);
  const [talaAksharas, setTalaAksharas] = useState<number>(8);
  const [gatiMatras, setGatiMatras] = useState<number>(4);
  const [targetEduppu, setTargetEduppu] = useState<number>(0);

  const branches = useMemo(() => manodharmaKorvaiEngine.getFiveBranches(), []);
  const korvaiLibrary = useMemo(() => manodharmaKorvaiEngine.getKorvaiLibrary(), []);
  const guide = useMemo(() => manodharmaKorvaiEngine.getLearningGuide(), []);
  const percussion = useMemo(() => manodharmaKorvaiEngine.getPercussionManodharma(), []);
  const bookAlignment = useMemo(() => manodharmaKorvaiEngine.getBookAlignmentManodharmaSangeetam(), []);

  // Calculation Result
  const calcResult = useMemo(() => {
    return manodharmaKorvaiEngine.calculateCustomKorvai(
      purvangaMatras,
      makutamPhraseMatras,
      gapMatras,
      talaAksharas,
      gatiMatras,
      targetEduppu
    );
  }, [purvangaMatras, makutamPhraseMatras, gapMatras, talaAksharas, gatiMatras, targetEduppu]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px', color: '#F8FAFC', fontFamily: 'system-ui, sans-serif' }}>
      {/* Top Header */}
      <div style={{ background: '#0F172A', border: '1px solid #334155', borderRadius: '20px', padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <Sparkles size={28} color="#F59E0B" />
          <h1 style={{ fontSize: '26px', fontWeight: 800, margin: 0, color: '#F59E0B' }}>
            Manodharma Saṅgītam & Kōrvai Construction Suite
          </h1>
        </div>
        <p style={{ margin: 0, color: '#CBD5E1', fontSize: '14px', lineHeight: '1.7' }}>
          Learn Manodharma from the basics: understand the concepts, listen and practise guided examples, explore the five branches, and use the Kōrvai calculator as a rhythmic learning aid. Calculations check arithmetic, not musical correctness.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '24px' }}>
        <button onClick={() => setActiveTab('guide')} style={{ flex: '1 1 190px', background: activeTab === 'guide' ? '#1E293B' : '#0F172A', color: activeTab === 'guide' ? '#F59E0B' : '#94A3B8', border: activeTab === 'guide' ? '2px solid #F59E0B' : '1px solid #334155', borderRadius: '12px', padding: '12px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <BookOpen size={18} /> Beginner Learning Guide
        </button>
        <button
          onClick={() => setActiveTab('branches')}
          style={{
            flex: '1 1 190px',
            background: activeTab === 'branches' ? '#1E293B' : '#0F172A',
            color: activeTab === 'branches' ? '#F59E0B' : '#94A3B8',
            border: activeTab === 'branches' ? '2px solid #F59E0B' : '1px solid #334155',
            borderRadius: '12px',
            padding: '12px',
            fontSize: '15px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <Compass size={18} /> 5 Branches of Manodharma
        </button>

        <button onClick={() => setActiveTab('percussion')} style={{ flex: '1 1 190px', background: activeTab === 'percussion' ? '#1E293B' : '#0F172A', color: activeTab === 'percussion' ? '#C084FC' : '#94A3B8', border: activeTab === 'percussion' ? '2px solid #C084FC' : '1px solid #334155', borderRadius: '12px', padding: '12px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Layers size={18} /> Rhythmic & Percussion
        </button>

        <button
          onClick={() => setActiveTab('calculator')}
          style={{
            flex: '1 1 190px',
            background: activeTab === 'calculator' ? '#1E293B' : '#0F172A',
            color: activeTab === 'calculator' ? '#10B981' : '#94A3B8',
            border: activeTab === 'calculator' ? '2px solid #10B981' : '1px solid #334155',
            borderRadius: '12px',
            padding: '12px',
            fontSize: '15px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <Calculator size={18} /> Kōrvai Math Calculator
        </button>

        <button
          onClick={() => setActiveTab('library')}
          style={{
            flex: '1 1 190px',
            background: activeTab === 'library' ? '#1E293B' : '#0F172A',
            color: activeTab === 'library' ? '#38BDF8' : '#94A3B8',
            border: activeTab === 'library' ? '2px solid #38BDF8' : '1px solid #334155',
            borderRadius: '12px',
            padding: '12px',
            fontSize: '15px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <Music size={18} /> Pre-Built Kōrvai Library
        </button>
      </div>

      {/* TAB 0: BEGINNER-FRIENDLY LEARNING GUIDE */}
      {activeTab === 'guide' && guide && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <section style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '16px', padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Brain size={24} color="#F59E0B" /><h2 style={{ margin: 0, color: '#F8FAFC', fontSize: '22px' }}>{guide.title}</h2></div>
            <p style={{ color: '#E2E8F0', lineHeight: 1.8 }}>{guide.intro.plain_language}</p>
            <div style={{ background: '#0F172A', borderLeft: '4px solid #F59E0B', borderRadius: '8px', padding: '14px', color: '#CBD5E1', lineHeight: 1.7 }}><strong style={{ color: '#F59E0B' }}>Important:</strong> {guide.intro.important_distinction}</div>
            <h3 style={{ color: '#F8FAFC' }}>Why can Manodharma feel difficult?</h3><ul style={{ color: '#CBD5E1', lineHeight: 1.8 }}>{guide.intro.why_it_feels_difficult.map((item: string) => <li key={item}>{item}</li>)}</ul>
          </section>
          {guide.book_based_practice && (
            <section style={{ background: '#1E293B', border: '1px solid #D97706', borderRadius: '16px', padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><BookOpen size={22} color="#F59E0B" /><h2 style={{ margin: 0, color: '#F8FAFC' }}>{guide.book_based_practice.heading}</h2></div>
              <p style={{ color: '#E2E8F0', lineHeight: 1.8 }}>{guide.book_based_practice.intro}</p>
              <div style={{ background: '#0F172A', borderRadius: '8px', padding: '12px', color: '#CBD5E1', fontSize: '13px', lineHeight: 1.7 }}><strong style={{ color: '#F59E0B' }}>Reference locations:</strong> {guide.book_based_practice.source_note}</div>
              <ol style={{ color: '#CBD5E1', lineHeight: 1.8, paddingLeft: '22px' }}>{guide.book_based_practice.steps.map((step: any) => <li key={step.step} style={{ marginBottom: '10px' }}><strong style={{ color: '#38BDF8' }}>{step.title}.</strong> {step.explanation}</li>)}</ol>
              <div style={{ background: '#0F172A', borderLeft: '4px solid #10B981', borderRadius: '8px', padding: '14px', color: '#CBD5E1', lineHeight: 1.7 }}><strong style={{ color: '#A7F3D0' }}>{guide.book_based_practice.counting_example.label}:</strong> <code>{guide.book_based_practice.counting_example.example}</code><p style={{ marginBottom: 0 }}>{guide.book_based_practice.counting_example.explanation}</p></div>
              <p style={{ color: '#FDE68A', fontSize: '13px', lineHeight: 1.7 }}><strong>Verification:</strong> {guide.book_based_practice.teacher_check}</p>
            </section>
          )}
          <section style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '16px', padding: '22px' }}>
            <h2 style={{ marginTop: 0, color: '#F8FAFC' }}>What happens in a musician’s mind?</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '12px' }}>{guide.mental_process.map((step: any) => <div key={step.step} style={{ background: '#0F172A', padding: '14px', borderRadius: '12px' }}><strong style={{ color: '#38BDF8' }}>{step.step}. {step.name}</strong><p style={{ color: '#CBD5E1', fontSize: '13px', lineHeight: 1.7, marginBottom: 0 }}>{step.explanation}</p></div>)}</div>
          </section>
          <section style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '16px', padding: '22px' }}>
            <h2 style={{ marginTop: 0, color: '#F8FAFC' }}>Five branches explained simply</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '14px' }}>{guide.branches.map((branch: any) => <article key={branch.id} style={{ background: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}><h3 style={{ marginTop: 0, color: '#F59E0B' }}>{branch.name}</h3><p style={{ color: '#E2E8F0', lineHeight: 1.7 }}>{branch.simple_definition}</p><strong style={{ color: '#38BDF8', fontSize: '13px' }}>How to practise</strong><ol style={{ color: '#CBD5E1', fontSize: '13px', lineHeight: 1.7, paddingLeft: '20px' }}>{branch.how_it_works.map((item: string) => <li key={item}>{item}</li>)}</ol><div style={{ background: '#172033', borderRadius: '8px', padding: '12px', color: '#D1D5DB', fontSize: '13px', lineHeight: 1.7 }}><strong style={{ color: '#10B981' }}>Try this:</strong> {branch.beginner_exercise}</div>{branch.illustrative_example && <div style={{ marginTop: '10px', color: '#CBD5E1', fontSize: '13px' }}><strong>Illustrative svara phrase:</strong> <code>{branch.illustrative_example.svara_phrase}</code><p>{branch.illustrative_example.note}</p></div>}<details style={{ marginTop: '10px', color: '#CBD5E1' }}><summary style={{ cursor: 'pointer', color: '#FCA5A5' }}>Common mistakes</summary><ul>{branch.common_mistakes.map((item: string) => <li key={item}>{item}</li>)}</ul></details></article>)}</div>
          </section>
          <section style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '16px', padding: '22px' }}>
            <h2 style={{ marginTop: 0, color: '#F8FAFC' }}>Essential terms</h2><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))', gap: '10px' }}>{guide.foundation_terms.map((term: any) => <div key={term.term} style={{ background: '#0F172A', borderRadius: '8px', padding: '12px' }}><strong style={{ color: '#F59E0B' }}>{term.term}</strong><p style={{ color: '#CBD5E1', marginBottom: 0, fontSize: '13px', lineHeight: 1.6 }}>{term.meaning}</p></div>)}</div>
          </section>
          <section style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '16px', padding: '22px' }}>
            <h2 style={{ marginTop: 0, color: '#F8FAFC' }}>A progressive learning path</h2><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '12px' }}>{guide.learning_levels.map((level: any) => <div key={level.level} style={{ background: '#0F172A', borderRadius: '10px', padding: '14px' }}><strong style={{ color: '#38BDF8' }}>Level {level.level}: {level.name}</strong><p style={{ color: '#CBD5E1', fontSize: '13px', lineHeight: 1.6 }}>{level.goal}</p><ul style={{ color: '#CBD5E1', fontSize: '13px', lineHeight: 1.6, paddingLeft: '18px' }}>{level.practice.map((item: string) => <li key={item}>{item}</li>)}</ul><p style={{ color: '#A7F3D0', fontSize: '12px', lineHeight: 1.6 }}><strong>Progress when:</strong> {level.ready_when}</p></div>)}</div>
          </section>
          <section style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '16px', padding: '22px' }}>
            <h2 style={{ marginTop: 0, color: '#F8FAFC' }}>Daily practice loop</h2><ol style={{ color: '#CBD5E1', lineHeight: 1.9 }}>{guide.practice_loop.map((item: string) => <li key={item}>{item}</li>)}</ol><h3 style={{ color: '#F8FAFC' }}>Self-assessment checklist</h3><ul style={{ color: '#CBD5E1', lineHeight: 1.9 }}>{guide.self_assessment.map((item: string) => <li key={item}>{item}</li>)}</ul><div style={{ background: '#0F172A', borderRadius: '8px', padding: '12px', color: '#94A3B8', fontSize: '12px', lineHeight: 1.7 }}><Headphones size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />{guide.editorial_note}</div>
          </section>
        </div>
      )}

      {/* TAB 1: 5 BRANCHES OF MANODHARMA */}
      {activeTab === 'branches' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '20px' }}>
          {/* Sidebar Menu */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.keys(branches).map(key => {
              const b = (branches as any)[key];
              const isSelected = selectedBranch === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedBranch(key)}
                  style={{
                    background: isSelected ? '#1E293B' : '#0F172A',
                    color: isSelected ? '#F59E0B' : '#CBD5E1',
                    border: isSelected ? '2px solid #F59E0B' : '1px solid #334155',
                    borderRadius: '12px',
                    padding: '14px',
                    textAlign: 'left',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontSize: '15px' }}>{b.name}</div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>{b.type}</div>
                </button>
              );
            })}
          </div>

          {/* Main Detail Display */}
          {selectedBranch && (branches as any)[selectedBranch] && (
            <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <span style={{ background: '#312E81', color: '#A5B4FC', padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600 }}>
                  {(branches as any)[selectedBranch].type}
                </span>
                <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '12px 0 6px 0', color: '#F8FAFC' }}>
                  {(branches as any)[selectedBranch].name}
                </h2>
                <p style={{ color: '#CBD5E1', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                  {(branches as any)[selectedBranch].description}
                </p>
              </div>

              {/* Phase or Rules Breakdown */}
              {(branches as any)[selectedBranch].three_phase_structure && (
                <div style={{ background: '#0F172A', padding: '16px', borderRadius: '12px', borderLeft: '4px solid #F59E0B' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#F59E0B', fontSize: '14px' }}>3-Phase Ālāpana Progression</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#E2E8F0' }}>
                    <div><strong>Phase 1 (Ākṣēpaka):</strong> {(branches as any)[selectedBranch].three_phase_structure.phase_1_aksepaka}</div>
                    <div><strong>Phase 2 (Rāgavardhanī):</strong> {(branches as any)[selectedBranch].three_phase_structure.phase_2_ragavardhani}</div>
                    <div><strong>Phase 3 (Muktāyi):</strong> {(branches as any)[selectedBranch].three_phase_structure.phase_3_sthayi_muktayia}</div>
                  </div>
                </div>
              )}

              {(branches as any)[selectedBranch].rules && (
                <div style={{ background: '#0F172A', padding: '16px', borderRadius: '12px', borderLeft: '4px solid #10B981' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#10B981', fontSize: '14px' }}>Strict Performance Rules</h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#E2E8F0', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {(branches as any)[selectedBranch].rules.map((rule: string, i: number) => (
                      <li key={i}>{rule}</li>
                    ))}
                  </ul>
                </div>
              )}

              {(branches as any)[selectedBranch].tiers && (
                <div style={{ background: '#0F172A', padding: '16px', borderRadius: '12px', borderLeft: '4px solid #38BDF8' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#38BDF8', fontSize: '14px' }}>Progressive Exercise Tiers</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#E2E8F0' }}>
                    {(branches as any)[selectedBranch].tiers.map((tier: string, i: number) => (
                      <div key={i}>• {tier}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: KŌRVAI MATH CALCULATOR */}
      {activeTab === 'percussion' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <section style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '16px', padding: '22px' }}>
            <h2 style={{ color: '#C084FC', marginTop: 0 }}>Percussion & Rhythmic Manodharma</h2>
            <p style={{ color: '#CBD5E1', lineHeight: 1.7 }}>This section preserves the expanded rhythmic framework supplied in the second source archive. Treat definitions and examples as learning material; verify notation and arithmetic against the source book and a qualified musician.</p>
            {Object.entries(percussion || {}).map(([key, value]: [string, any]) => (
              <div key={key} style={{ background: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px', marginTop: '12px' }}>
                <h3 style={{ color: '#F8FAFC', marginTop: 0 }}>{key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</h3>
                {typeof value === 'string' ? <p style={{ color: '#CBD5E1', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{value}</p> : Array.isArray(value) ? <ul style={{ color: '#CBD5E1', lineHeight: 1.7 }}>{value.map((item: any, i: number) => <li key={i}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>)}</ul> : <pre style={{ color: '#CBD5E1', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: '13px', lineHeight: 1.6 }}>{JSON.stringify(value, null, 2)}</pre>}
              </div>
            ))}
            {bookAlignment && <div style={{ background: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px', marginTop: '12px' }}><h3 style={{ color: '#38BDF8', marginTop: 0 }}>Book Metadata — Expanded Source</h3><pre style={{ color: '#CBD5E1', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: '13px' }}>{JSON.stringify(bookAlignment, null, 2)}</pre></div>}
          </section>
        </div>
      )}

      {activeTab === 'calculator' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '24px' }}>
          {/* Controls Panel */}
          <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0, color: '#10B981', fontSize: '18px', fontWeight: 700 }}>Custom Kōrvai Variables</h3>

            {/* Inputs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '13px', color: '#CBD5E1', display: 'block', marginBottom: '4px' }}>Pūrvāṅga (Body Phrase) Mātrās:</label>
                <input type="number" min="0" max="64" value={purvangaMatras} onChange={e => setPurvangaMatras(Number(e.target.value))} style={{ width: '100%', background: '#0F172A', color: '#F8FAFC', border: '1px solid #475569', borderRadius: '8px', padding: '8px', fontSize: '14px' }} />
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#CBD5E1', display: 'block', marginBottom: '4px' }}>Makuṭam (Crown Phrase) Mātrās (×3):</label>
                <input type="number" min="1" max="32" value={makutamPhraseMatras} onChange={e => setMakutamPhraseMatras(Number(e.target.value))} style={{ width: '100%', background: '#0F172A', color: '#F8FAFC', border: '1px solid #475569', borderRadius: '8px', padding: '8px', fontSize: '14px' }} />
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#CBD5E1', display: 'block', marginBottom: '4px' }}>Gap / Pause Mātrās (×2):</label>
                <input type="number" min="0" max="16" value={gapMatras} onChange={e => setGapMatras(Number(e.target.value))} style={{ width: '100%', background: '#0F172A', color: '#F8FAFC', border: '1px solid #475569', borderRadius: '8px', padding: '8px', fontSize: '14px' }} />
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#CBD5E1', display: 'block', marginBottom: '4px' }}>Tāla Cycle (Beats × Gati Subdivisions):</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select value={talaAksharas} onChange={e => setTalaAksharas(Number(e.target.value))} style={{ flex: 1, background: '#0F172A', color: '#F8FAFC', border: '1px solid #475569', borderRadius: '8px', padding: '8px', fontSize: '13px' }}>
                    <option value={8}>8 Beats (Ādi Tālam)</option>
                    <option value={6}>6 Beats (Rūpaka Tālam)</option>
                    <option value={7}>7 Beats (Tripuṭa / Miśra Cāpu)</option>
                    <option value={5}>5 Beats (Khaṇḍa Cāpu)</option>
                  </select>

                  <select value={gatiMatras} onChange={e => setGatiMatras(Number(e.target.value))} style={{ flex: 1, background: '#0F172A', color: '#F8FAFC', border: '1px solid #475569', borderRadius: '8px', padding: '8px', fontSize: '13px' }}>
                    <option value={4}>4 Sub-pulses (Chaturasra)</option>
                    <option value={3}>3 Sub-pulses (Tiśra)</option>
                    <option value={5}>5 Sub-pulses (Khaṇḍa)</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '13px', color: '#CBD5E1', display: 'block', marginBottom: '4px' }}>Target eduppu offset (mātrās from samam; 0 = samam):</label>
                <input type="number" min="0" max={Math.max(0, talaAksharas * gatiMatras - 1)} value={targetEduppu} onChange={e => setTargetEduppu(Number(e.target.value))} style={{ width: '100%', boxSizing: 'border-box', background: '#0F172A', color: '#F8FAFC', border: '1px solid #475569', borderRadius: '8px', padding: '8px', fontSize: '14px' }} />
              </div>
            </div>
          </div>

          {/* Results & Verification Display */}
          <div style={{ background: '#0F172A', border: '1px solid #334155', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0, color: '#38BDF8', fontSize: '18px', fontWeight: 700 }}>Alignment Verification</h3>

            <div style={{ background: '#1E293B', padding: '16px', borderRadius: '12px', border: !calcResult.isValid ? '2px solid #EF4444' : calcResult.isAlignedToTarget ? '2px solid #10B981' : '2px solid #F59E0B' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: !calcResult.isValid ? '#EF4444' : calcResult.isAlignedToTarget ? '#10B981' : '#F59E0B', fontWeight: 800, fontSize: '16px', marginBottom: '6px' }}>
                {calcResult.isValid && calcResult.isAlignedToTarget ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                {!calcResult.isValid ? 'CHECK INPUT VALUES' : calcResult.isAlignedToTarget ? (targetEduppu === 0 ? 'ARITHMETICALLY ALIGNS WITH SAMAM' : 'ARITHMETICALLY ALIGNS WITH TARGET EDUPPU') : 'CALCULATED ENDPOINT DOES NOT MATCH TARGET'}
              </div>
              <div style={{ color: '#CBD5E1', fontSize: '13px' }}>
                Total Kōrvai Duration: <strong>{calcResult.totalKorvaiMatras} Mātrās</strong> (Cycle Length: {calcResult.cycleLengthMatras}m)
              </div>
              <div style={{ color: '#94A3B8', fontSize: '12px', marginTop: '4px' }}>
                Calculated endpoint: {calcResult.eduppuOffsetMatras} mātrās from samam. Target: {calcResult.targetEduppuMatra} mātrās.
              </div>
              {!calcResult.isValid && <ul style={{ color: '#FCA5A5', fontSize: '12px', paddingLeft: '18px' }}>{calcResult.validationErrors.map((error: string) => <li key={error}>{error}</li>)}</ul>}
            </div>

            <div style={{ background: '#1E293B', padding: '14px', borderRadius: '12px', fontSize: '13px', color: '#E2E8F0' }}>
              <div style={{ color: '#F59E0B', fontWeight: 600, marginBottom: '4px' }}>Mathematical Equation:</div>
              <div>{calcResult.solkattuSummary}</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PRE-BUILT KŌRVAI LIBRARY */}
      {activeTab === 'library' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '20px' }}>
          {korvaiLibrary.map(k => (
            <div key={k.id} style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ background: '#312E81', color: '#A5B4FC', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                    {k.tala}
                  </span>
                  <h3 style={{ color: '#F8FAFC', margin: '6px 0 2px 0', fontSize: '16px', fontWeight: 700 }}>
                    {k.title}
                  </h3>
                  <span style={{ color: '#10B981', fontSize: '12px', fontWeight: 600 }}>
                    {k.yati_type} • {k.total_matras} Mātrās
                  </span>
                </div>
              </div>

              <div style={{ background: '#0F172A', padding: '10px 12px', borderRadius: '10px', fontSize: '12px', color: '#E2E8F0', fontFamily: 'monospace', overflowWrap: 'anywhere' }}>
                <div style={{ color: '#38BDF8', fontWeight: 600, marginBottom: '2px' }}>Solkaṭṭu Notation:</div>
                {k.notation}
              </div>
              {k.review_status && <div style={{ background: '#422006', border: '1px solid #92400E', borderRadius: '8px', padding: '10px', color: '#FDE68A', fontSize: '12px', lineHeight: 1.6 }}><strong>{k.review_status}</strong><div style={{ marginTop: '4px' }}>{k.review_notes}</div></div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManodharmaKorvaiUI;
