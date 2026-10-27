import React, { useEffect, useMemo, useState } from 'react';
import { Volume2, Sparkles, Music, Radio, Mic } from 'lucide-react';
import { useGamakaStore } from '../../store/useGamakaStore';
import type { InstrumentType } from '../../types/gamaka';
import { GAMAKA_PROFILES } from '../../data/gamakaCatalogData';
import { GamakaAuditionCard } from './GamakaAuditionCard';
import { GamakaCanvasGame } from './GamakaCanvasGame';
import { gamakaAudioEngine } from '../../audio/GamakaAudioEngine';
import { useAppStore } from '../../store/useAppStore';
import './gamaka.css';

export const GamakaTrainer: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    selectedInstrument,
    setSelectedInstrument,
    enableTambura,
    setEnableTambura,
    selectedRagaFilter,
    setSelectedRagaFilter,
    practiceMultiplier,
    setPracticeMultiplier,
    setIsPlaying
  } = useGamakaStore();
  const settings = useAppStore(state => state.settings);
  const [showGamakaLibrary, setShowGamakaLibrary] = useState(false);
  const [audioError, setAudioError] = useState('');

  useEffect(() => {
    gamakaAudioEngine.stopAll();
    gamakaAudioEngine.stopTambura();
    setEnableTambura(false);
    setIsPlaying(false, null);
    gamakaAudioEngine.setVolume(settings.volume);
    gamakaAudioEngine.setKattai(settings.tonicHz);
  }, [settings.volume, settings.tonicHz, selectedInstrument, practiceMultiplier, activeTab, selectedRagaFilter, showGamakaLibrary, setIsPlaying]);

  useEffect(() => {
    return () => {
      gamakaAudioEngine.stopAll();
      gamakaAudioEngine.stopTambura();
      setIsPlaying(false, null);
      setEnableTambura(false);
    };
  }, []);

  const handleTamburaToggle = async () => {
    const next = !enableTambura;
    setAudioError('');
    try {
      if (next) {
        gamakaAudioEngine.setKattai(settings.tonicHz);
        gamakaAudioEngine.setVolume(settings.volume);
        if (!await gamakaAudioEngine.startTambura()) return;
      } else {
        gamakaAudioEngine.stopTambura();
      }
      setEnableTambura(next);
    } catch (error) {
      setEnableTambura(false);
      setAudioError(error instanceof Error ? error.message : String(error));
    }
  };

  // Distinct rāgas for filter pills
  const availableRagas = useMemo(() => {
    const ragas = Array.from(new Set(GAMAKA_PROFILES.map(p => p.raga)));
    return ['ALL', ...ragas];
  }, []);

  const filteredProfiles = useMemo(() => {
    if (selectedRagaFilter === 'ALL') return GAMAKA_PROFILES;
    return GAMAKA_PROFILES.filter(p => p.raga === selectedRagaFilter);
  }, [selectedRagaFilter]);

  return (
    <div
      className="gamaka-trainer"
      style={{
        width: '100%',
        minWidth: 0,
        maxWidth: '1200px',
        height: '100%',
        minHeight: 0,
        margin: '0 auto',
        boxSizing: 'border-box',
        color: '#F8FAFC',
        overflowY: 'auto',
        overflowX: 'hidden',
        overscrollBehaviorY: 'contain'
      }}
    >
      {/* Top Header & Settings Bar */}
      <div
        className="gamaka-studio-header"
        style={{
          background: '#0F172A',
          border: '1px solid #334155',
          borderRadius: '20px',
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '20px',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div>
          <h1 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', fontWeight: 800, margin: '0 0 6px 0', color: '#F59E0B' }}>
            Gamaka Trainer & Acoustic Studio
          </h1>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: '14px' }}>
            Explore supplied pitch movements across 18 rāgas or practise with Voice Flight. These are synthetic contour guides, not recordings or authenticated demonstrations of traditional gamakas.
          </p>
        </div>
        <label style={{display:'flex',flexWrap:'wrap',gap:10,alignItems:'center',marginBottom:16,color:'#CBD5E1'}}>
          Practice timing
          <select aria-label="Gamaka practice speed" value={practiceMultiplier} onChange={e=>setPracticeMultiplier(Number(e.target.value))} style={{maxWidth:'100%',padding:8,background:'#1E293B',color:'#F8FAFC',borderRadius:8}}>
            <option value={1}>Normal extended · 3.8 s</option>
            <option value={1.5}>Slow · 5.7 s</option>
            <option value={2}>Ultra-slow · 7.6 s</option>
          </select>
          <span style={{fontSize:12}}>Includes anchor holds; shared by listening and singing. Start with Clear tone to hear the pitch movement without instrumental buzz. Slower timing stretches the movement; it is not a traditional performance tempo.</span>
        </label>

        {/* Global Controls: Kattai, Instrument, Drone */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          {/* Tonic is shared with the main app header. */}
          <div style={{ color: '#CBD5E1', fontSize: '13px', padding: '6px 8px' }}>
            Uses the app-selected Śruti
          </div>

          {/* Instrument Selector */}
          <div className="gamaka-instruments" style={{ display: 'flex', flexWrap: 'wrap', background: '#1E293B', borderRadius: '10px', padding: '4px' }}>
            {(
              [
                { id: 'reference', label: 'Clear tone', icon: Volume2 },
                { id: 'veena', label: 'Soft pluck', icon: Music },
                { id: 'flute', label: 'Flute-like', icon: Radio },
                { id: 'voice_formants', label: 'Vowel-like synth', icon: Mic }
              ] as const
            ).map(inst => {
              const Icon = inst.icon;
              const isSel = selectedInstrument === inst.id;
              return (
                <button
                  key={inst.id}
                  aria-pressed={isSel}
                  onClick={() => setSelectedInstrument(inst.id)}
                  style={{
                    background: isSel ? '#F59E0B' : 'transparent',
                    color: isSel ? '#0F172A' : '#CBD5E1',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Icon size={14} /> {inst.label}
                </button>
              );
            })}
          </div>
          <p style={{fontSize:12,color:'#CBD5E1',margin:0}}>
            Use the same tone for Plain and Gamaka to compare pitch movement. Instrument colours are approximations, not real vīṇā, flute or human voice. Learn rāga-specific execution from a qualified Carnatic teacher.
          </p>

          {/* Tambura Drone Toggle */}
          <button
            aria-pressed={enableTambura}
            onClick={() => void handleTamburaToggle()}
            disabled={activeTab === 'game'}
            style={{
              background: enableTambura ? '#10B981' : '#334155',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Volume2 size={16} /> Tambura {enableTambura ? 'ON' : 'OFF'}
          </button>
        </div>
        {audioError && <div role="alert" style={{color:'#fca5a5',marginBottom:12}}>{audioError}</div>}
      </div>

      {/* Main Mode Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
        <button
          aria-pressed={activeTab === 'listen'}
          onClick={() => setActiveTab('listen')}
          style={{
            flex: '1 1 280px',
            minWidth: 0,
            background: activeTab === 'listen' ? '#1E293B' : '#0F172A',
            color: activeTab === 'listen' ? '#F59E0B' : '#94A3B8',
            border: activeTab === 'listen' ? '2px solid #F59E0B' : '1px solid #334155',
            borderRadius: '14px',
            padding: '14px',
            fontSize: '15px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <Sparkles size={18} /> 🎧 Listen to Gamakas
        </button>

        <button
          aria-pressed={activeTab === 'game'}
          onClick={() => setActiveTab('game')}
          style={{
            flex: '1 1 280px',
            minWidth: 0,
            background: activeTab === 'game' ? '#1E293B' : '#0F172A',
            color: activeTab === 'game' ? '#10B981' : '#94A3B8',
            border: activeTab === 'game' ? '2px solid #10B981' : '1px solid #334155',
            borderRadius: '14px',
            padding: '14px',
            fontSize: '15px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          🎤 Sing / Practice Gamaka
        </button>
      </div>

      {/* Tab 1: Listen to Gamakas — catalog is hidden until requested */}
      {activeTab === 'listen' && (
        <section style={{ minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              padding: '18px',
              marginBottom: '16px',
              background: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '14px'
            }}
          >
            <div style={{ minWidth: 0 }}>
              <h2 style={{ margin: '0 0 6px', color: '#F8FAFC', fontSize: '20px' }}>
                Listen & Compare Gamakas
              </h2>
              <p style={{ margin: 0, color: '#CBD5E1', fontSize: '14px', lineHeight: 1.5 }}>
                Listen to a plain swara, hear its Gamaka, or compare both. Open the library to choose a rāga and ornament.
              </p>
            </div>
            <button
              type="button"
              aria-expanded={showGamakaLibrary}
              onClick={() => setShowGamakaLibrary(open => !open)}
              style={{
                flex: '0 0 auto',
                background: '#F59E0B',
                color: '#0F172A',
                border: 'none',
                borderRadius: '10px',
                padding: '11px 16px',
                fontSize: '14px',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              {showGamakaLibrary ? 'Hide Gamaka Library ▲' : 'Browse Gamaka Library ▼'}
            </button>
          </div>

          {showGamakaLibrary && (
            <div style={{ minWidth: 0 }}>
              <div
                aria-label="Filter Gamakas by rāga"
                style={{
                  display: 'flex',
                  flexWrap: 'nowrap',
                  gap: '8px',
                  overflowX: 'auto',
                  maxWidth: '100%',
                  minWidth: 0,
                  padding: '4px 2px 14px',
                  marginBottom: '12px',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                {availableRagas.map(raga => (
                  <button
                    type="button"
                    key={raga}
                    onClick={() => setSelectedRagaFilter(raga)}
                    style={{
                      flex: '0 0 auto',
                      background: selectedRagaFilter === raga ? '#F59E0B' : '#1E293B',
                      color: selectedRagaFilter === raga ? '#0F172A' : '#CBD5E1',
                      border: '1px solid #475569',
                      borderRadius: '20px',
                      padding: '8px 14px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {raga}
                  </button>
                ))}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
                  gap: '16px',
                  minWidth: 0,
                  width: '100%'
                }}
              >
                {filteredProfiles.map(profile => (
                  <GamakaAuditionCard key={profile.id} profile={profile} />
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Tab 2: Voice Flight Game */}
      {activeTab === 'game' && <GamakaCanvasGame />}
    </div>
  );
};

export default GamakaTrainer;
