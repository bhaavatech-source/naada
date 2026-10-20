import React, { useEffect, useMemo, useState } from 'react';
import { Volume2, Sparkles, Music, Radio, Mic } from 'lucide-react';
import { useGamakaStore } from '../../store/useGamakaStore';
import type { InstrumentType } from '../../types/gamaka';
import { GAMAKA_PROFILES } from '../../data/gamakaCatalogData';
import { GamakaAuditionCard } from './GamakaAuditionCard';
import { GamakaCanvasGame } from './GamakaCanvasGame';
import { gamakaAudioEngine } from '../../audio/GamakaAudioEngine';
import { useAppStore } from '../../store/useAppStore';

export const GamakaTrainer: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    selectedInstrument,
    setSelectedInstrument,
    enableTambura,
    setEnableTambura,
    selectedRagaFilter,
    setSelectedRagaFilter
  } = useGamakaStore();
  const settings = useAppStore(state => state.settings);
  const [showGamakaLibrary, setShowGamakaLibrary] = useState(false);

  useEffect(() => {
    gamakaAudioEngine.setVolume(settings.volume);
    gamakaAudioEngine.setKattai(settings.tonicHz);
  }, [settings.volume, settings.tonicHz]);

  useEffect(() => {
    return () => {
      gamakaAudioEngine.stopAll();
      gamakaAudioEngine.stopTambura();
    };
  }, []);

  const handleTamburaToggle = () => {
    const next = !enableTambura;
    setEnableTambura(next);
    if (next) {
      gamakaAudioEngine.setKattai(settings.tonicHz);
      gamakaAudioEngine.setVolume(settings.volume);
      void gamakaAudioEngine.startTambura();
    } else {
      gamakaAudioEngine.stopTambura();
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
      style={{
        width: '100%',
        minWidth: 0,
        maxWidth: '1200px',
        height: 'calc(100vh - 155px)',
        minHeight: '360px',
        margin: '0 auto',
        padding: '16px',
        boxSizing: 'border-box',
        color: '#F8FAFC',
        overflowY: 'auto',
        overflowX: 'hidden',
        overscrollBehaviorY: 'contain'
      }}
    >
      {/* Top Header & Settings Bar */}
      <div
        style={{
          background: '#0F172A',
          border: '1px solid #334155',
          borderRadius: '20px',
          padding: '20px 24px',
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '20px',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px 0', color: '#F59E0B' }}>
            Gamaka Trainer & Acoustic Studio
          </h1>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: '14px' }}>
            Audition classical 22-Śruti ornaments across 18 rāgas or practice live with the Voice Flight game.
          </p>
        </div>

        {/* Global Controls: Kattai, Instrument, Drone */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          {/* Tonic is shared with the main app header. */}
          <div style={{ color: '#CBD5E1', fontSize: '13px', padding: '6px 8px' }}>
            Uses the app-selected Śruti
          </div>

          {/* Instrument Selector */}
          <div style={{ display: 'flex', background: '#1E293B', borderRadius: '10px', padding: '4px' }}>
            {(
              [
                { id: 'veena', label: 'Vīṇā', icon: Music },
                { id: 'flute', label: 'Flute', icon: Radio },
                { id: 'voice_formants', label: 'Voice', icon: Mic }
              ] as const
            ).map(inst => {
              const Icon = inst.icon;
              const isSel = selectedInstrument === inst.id;
              return (
                <button
                  key={inst.id}
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

          {/* Tambura Drone Toggle */}
          <button
            onClick={handleTamburaToggle}
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
      </div>

      {/* Main Mode Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
        <button
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
