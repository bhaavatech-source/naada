import React from 'react';
import { Square, Volume2, Sparkles } from 'lucide-react';
import type { GamakaProfile } from '../../types/gamaka';
import { gamakaAudioEngine } from '../../audio/GamakaAudioEngine';
import { useGamakaStore } from '../../store/useGamakaStore';
import { useAppStore } from '../../store/useAppStore';

interface Props {
  profile: GamakaProfile;
}

export const GamakaAuditionCard: React.FC<Props> = ({ profile }) => {
  const {
    selectedInstrument,
    activeGamakaId,
    setActiveGamakaId,
    isPlaying,
    currentTrack,
    setIsPlaying,
    enableTambura
  } = useGamakaStore();

  const settings = useAppStore(state => state.settings);
  const isThisActive = activeGamakaId === profile.id && isPlaying;

  const handlePlayAB = async () => {
    setActiveGamakaId(profile.id);
    setIsPlaying(true, 'A');
    gamakaAudioEngine.setKattai(settings.tonicHz);
    gamakaAudioEngine.setVolume(settings.volume);

    if (enableTambura && !gamakaAudioEngine.isTamburaRunning) {
      await gamakaAudioEngine.startTambura();
    }

    try {
      await gamakaAudioEngine.playABComparison(profile, selectedInstrument, {
        onTrackChange: (track) => setIsPlaying(true, track),
        onEnd: () => setIsPlaying(false, null)
      });
    } finally {
      setIsPlaying(false, null);
    }
  };

  const handlePlayPlain = async () => {
    setActiveGamakaId(profile.id);
    setIsPlaying(true, 'A');
    gamakaAudioEngine.setKattai(settings.tonicHz);
    gamakaAudioEngine.setVolume(settings.volume);
    if (enableTambura && !gamakaAudioEngine.isTamburaRunning) await gamakaAudioEngine.startTambura();
    try { await gamakaAudioEngine.playPlainNote(profile, selectedInstrument); }
    finally { setIsPlaying(false, null); }
  };

  const handlePlayGamaka = async () => {
    setActiveGamakaId(profile.id);
    setIsPlaying(true, 'B');
    gamakaAudioEngine.setKattai(settings.tonicHz);
    gamakaAudioEngine.setVolume(settings.volume);
    if (enableTambura && !gamakaAudioEngine.isTamburaRunning) await gamakaAudioEngine.startTambura();
    try { await gamakaAudioEngine.playGamaka(profile, selectedInstrument); }
    finally { setIsPlaying(false, null); }
  };

  const handleStop = () => {
    gamakaAudioEngine.stopAll();
    setIsPlaying(false, null);
  };

  return (
    <div
      style={{
        background: '#1E293B',
        borderRadius: '16px',
        padding: '20px',
        border: isThisActive ? '2px solid #F59E0B' : '1px solid #334155',
        boxShadow: isThisActive ? '0 0 20px rgba(245, 158, 11, 0.25)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        transition: 'all 0.2s ease'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                background: '#312E81',
                color: '#A5B4FC',
                padding: '2px 10px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              {profile.raga}
            </span>
            <span style={{ color: '#94A3B8', fontSize: '13px' }}>
              Swara: <b style={{ color: '#F1F5F9' }}>{profile.targetSwara}</b>
            </span>
          </div>
          <h3 style={{ color: '#F8FAFC', margin: '8px 0 2px 0', fontSize: '18px', fontWeight: 600 }}>
            {profile.name}
          </h3>
          <span style={{ color: '#CBD5E1', fontSize: '13px' }}>{profile.classicalType}</span>
        </div>

        {/* Notation Badge */}
        <div
          style={{
            background: '#0F172A',
            border: '1px solid #475569',
            borderRadius: '12px',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            fontWeight: 'bold',
            color: '#F59E0B'
          }}
          title={`Notation Symbol: ${profile.notationSymbol}`}
        >
          {profile.notationSymbol}
        </div>
      </div>

      {/* Listening Cue Box */}
      <div
        style={{
          background: '#0F172A',
          padding: '10px 14px',
          borderRadius: '10px',
          borderLeft: '3px solid #38BDF8',
          fontSize: '13px',
          color: '#E2E8F0',
          lineHeight: '1.4'
        }}
      >
        <span style={{ color: '#38BDF8', fontWeight: 600, marginRight: '4px' }}>Listen For:</span>
        {profile.listeningCue}
      </div>

      {/* Active Track Indicator */}
      {isThisActive && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: currentTrack === 'A' ? '#451A03' : '#064E3B',
            color: currentTrack === 'A' ? '#FDBA74' : '#6EE7B7',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600
          }}
        >
          <Volume2 size={16} />
          {currentTrack === 'A'
            ? '▶ Now Playing Track A: Plain Note (12-TET Flat)'
            : '▶ Now Playing Track B: Authentic Gamaka (22-Śruti Living Curve)'}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '8px', marginTop: '6px' }}>
        <button
          onClick={handlePlayPlain}
          disabled={isPlaying}
          style={{
            background: '#334155',
            color: '#F1F5F9',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 10px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: isPlaying ? 'not-allowed' : 'pointer',
            opacity: isPlaying ? 0.6 : 1
          }}
        >
          Plain ({profile.plainCents}c)
        </button>

        <button
          onClick={handlePlayGamaka}
          disabled={isPlaying}
          style={{
            background: '#1D4ED8',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 10px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: isPlaying ? 'not-allowed' : 'pointer',
            opacity: isPlaying ? 0.6 : 1
          }}
        >
          Gamaka ({profile.baseCents}c)
        </button>

        <button
          onClick={handlePlayAB}
          disabled={isPlaying}
          style={{
            background: '#F59E0B',
            color: '#0F172A',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: isPlaying ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            opacity: isPlaying ? 0.6 : 1
          }}
        >
          <Sparkles size={14} /> Compare A/B
        </button>

        {isThisActive && (
          <button
            onClick={handleStop}
            style={{
              background: '#EF4444',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 12px',
              cursor: 'pointer'
            }}
            title="Stop Audio"
          >
            <Square size={14} />
          </button>
        )}
      </div>
    </div>
  );
};
