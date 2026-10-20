import React, { useState } from 'react'
import { useAppStore } from '../store/useAppStore'

// ============================================================================
// SELF-CONTAINED INLINE SVG ICONS (Zero external dependencies, 0 VSCode errors)
// ============================================================================
const IconRaga = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
)

const IconShruti = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 10v4" />
    <path d="M6 7v10" />
    <path d="M10 4v16" />
    <path d="M14 7v10" />
    <path d="M18 5v14" />
    <path d="M22 10v4" />
  </svg>
)

const IconTala = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="12" rx="10" ry="6" />
    <ellipse cx="7" cy="12" rx="2.5" ry="4" />
    <line x1="9.5" y1="8" x2="19" y2="9.5" />
    <line x1="9.5" y1="16" x2="19" y2="14.5" />
  </svg>
)

const IconBuilder = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="6" y1="5" x2="6" y2="12" />
    <line x1="10" y1="5" x2="10" y2="12" />
    <line x1="14" y1="5" x2="14" y2="12" />
    <line x1="18" y1="5" x2="18" y2="12" />
    <line x1="2" y1="12" x2="22" y2="12" />
  </svg>
)

const IconResources = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
    <path d="M6 6h10" />
    <path d="M6 10h10" />
    <path d="M6 14h7" />
  </svg>
)

const IconProgress = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
)

const IconArrow = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="7" y1="17" x2="17" y2="7" />
    <polyline points="7 7 17 7 17 17" />
  </svg>
)

const IconSparkle = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0l2.8 9.2L24 12l-9.2 2.8L12 24l-2.8-9.2L0 12l9.2-2.8z" />
  </svg>
)

// ============================================================================
// MODULE CARD METADATA (Rāga Library at the top; Music Builder grouped down)
// ============================================================================
type ModuleId = 'raga' | 'shruti' | 'tala' | 'builder' | 'resources' | 'progress'

interface ModuleInfo {
  id: ModuleId
  sanskritTitle: string
  englishTitle: string
  categoryPill: string
  subtitle: string
  icon: React.ComponentType
  accentColor: string
  gradientGlow: string
  metricBadge: string
  animType: 'scale' | 'radar' | 'beats' | 'keys' | 'book' | 'chart'
}

const MODULES: ModuleInfo[] = [
  {
    id: 'raga',
    sanskritTitle: 'Rāga Ratnākara',
    englishTitle: 'Rāga Library',
    categoryPill: 'PARENT SCALES & JANYAS',
    subtitle: '72 Melakarta parent scales, Vivādi combinations & Janya rāga derivations',
    icon: IconRaga,
    accentColor: '#A855F7', // Royal Purple
    gradientGlow: 'linear-gradient(135deg, rgba(168, 85, 247, 0.22), rgba(147, 51, 234, 0.05))',
    metricBadge: '72 Mēlas • 12 Chakras',
    animType: 'scale',
  },
  {
    id: 'shruti',
    sanskritTitle: 'Nāda Bindu',
    englishTitle: 'Śruti Trainer',
    categoryPill: 'PITCH & INTONATION',
    subtitle: 'Microtonal 22-śruti frequency alignment with real-time cents feedback',
    icon: IconShruti,
    accentColor: '#10B981', // Emerald Teal
    gradientGlow: 'linear-gradient(135deg, rgba(16, 185, 129, 0.22), rgba(5, 150, 105, 0.05))',
    metricBadge: '22 Śrutis • Cents DSP',
    animType: 'radar',
  },
  {
    id: 'tala',
    sanskritTitle: 'Laya Taranga',
    englishTitle: 'Tāla Trainer',
    categoryPill: 'RHYTHM & KŌRVAIS',
    subtitle: '35 Tāla matrices, 5 Jātis, Nadai divisions, and teermānam calculations',
    icon: IconTala,
    accentColor: '#F43F5E', // Rose Coral
    gradientGlow: 'linear-gradient(135deg, rgba(244, 63, 94, 0.22), rgba(225, 29, 72, 0.05))',
    metricBadge: '35 Tālas • 5 Jātis',
    animType: 'beats',
  },
  {
    id: 'builder',
    sanskritTitle: 'Svara Rachanā',
    englishTitle: 'Music Builder',
    categoryPill: 'MANODHARMA & NOTATION',
    subtitle: 'Interactive svara sequencing, abhyāsa gāna drills, and melodic composition',
    icon: IconBuilder,
    accentColor: '#F59E0B', // Warm Golden Amber
    gradientGlow: 'linear-gradient(135deg, rgba(245, 158, 11, 0.22), rgba(217, 119, 6, 0.05))',
    metricBadge: 'Svara Grid • Varisais',
    animType: 'keys',
  },
  {
    id: 'resources',
    sanskritTitle: 'Grantha Bhandāra',
    englishTitle: 'Resources & Vault',
    categoryPill: 'HISTORIC ARCHIVES',
    subtitle: '50+ curated archives, notation manuscripts, composer treatises & kutcheris',
    icon: IconResources,
    accentColor: '#06B6D4', // Deep Cyan
    gradientGlow: 'linear-gradient(135deg, rgba(6, 182, 212, 0.22), rgba(8, 145, 178, 0.05))',
    metricBadge: '50+ Vaults • Notations',
    animType: 'book',
  },
  {
    id: 'progress',
    sanskritTitle: 'Sādhana Darpaṇa',
    englishTitle: 'My Progress',
    categoryPill: 'PRACTICE ANALYTICS',
    subtitle: 'Daily pitch accuracy, rhythmic stamina, learning streaks & mastery milestones',
    icon: IconProgress,
    accentColor: '#EC4899', // Lotus Pink
    gradientGlow: 'linear-gradient(135deg, rgba(236, 72, 153, 0.22), rgba(190, 24, 93, 0.05))',
    metricBadge: 'Daily Streaks • Metrics',
    animType: 'chart',
  },
]

// ============================================================================
// MICRO-GRAPHIC ANIMATION COMPONENTS (Informative, non-textual visuals)
// ============================================================================
const CardAnimation = ({ type, color }: { type: ModuleInfo['animType']; color: string }) => {
  if (type === 'scale') {
    return (
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 20 }}>
        {[6, 9, 11, 14, 16, 18, 20].map((h, i) => (
          <div
            key={i}
            className="nada-scale-step"
            style={{
              width: 3,
              height: `${h}px`,
              background: color,
              borderRadius: 2,
              animationDelay: `${i * 0.12}s`,
            }}
          />
        ))}
      </div>
    )
  }

  if (type === 'radar') {
    return (
      <div style={{ position: 'relative', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="nada-radar-ring" style={{ borderColor: color }} />
        <div className="nada-radar-ring" style={{ borderColor: color, animationDelay: '0.6s' }} />
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
      </div>
    )
  }

  if (type === 'beats') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="nada-beat-dot"
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: color,
              animationDelay: `${i * 0.25}s`,
            }}
          />
        ))}
      </div>
    )
  }

  if (type === 'keys') {
    return (
      <div style={{ display: 'flex', gap: 2, height: 18, alignItems: 'flex-start' }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="nada-key-step"
            style={{
              width: 4,
              height: i % 2 === 0 ? 18 : 12,
              background: color,
              opacity: i % 2 === 0 ? 0.9 : 0.5,
              borderRadius: 1,
              animationDelay: `${i * 0.18}s`,
            }}
          />
        ))}
      </div>
    )
  }

  if (type === 'book') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2.5, width: 20 }}>
        <div style={{ height: 2.5, width: '100%', background: color, borderRadius: 1, opacity: 0.9 }} />
        <div style={{ height: 2.5, width: '75%', background: color, borderRadius: 1, opacity: 0.6 }} />
        <div style={{ height: 2.5, width: '90%', background: color, borderRadius: 1, opacity: 0.75 }} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2.5, height: 18 }}>
      {[35, 55, 45, 75, 90, 100].map((h, i) => (
        <div
          key={i}
          className="nada-chart-bar"
          style={{
            width: 3,
            height: `${(h / 100) * 18}px`,
            background: color,
            borderRadius: 1.5,
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function Home() {
  const setModule = useAppStore((s) => s.setModule)
  const [hoveredCard, setHoveredCard] = useState<ModuleId | null>(null)

  return (
    <div className="nada-home-viewport">
      {/* Scoped CSS animations & high-contrast styling */}
      <style>{`
        .nada-home-viewport {
          position: relative;
          isolation: isolate;
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 32px 20px 48px;
          min-height: 100%;
          /* Balanced, non-overdark rich slate-indigo background */
          background: linear-gradient(180deg, #161F33 0%, #111827 50%, #0E1626 100%);
          color: #F8FAFC;
          box-sizing: border-box;
          font-family: inherit;
        }

        /* ── BACKGROUND ARTWORK (Nādabrahman Mandala & Traditional Instruments) ── */
        .nada-ambient-scene {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
          opacity: 0.9;
        }

        /* Central Nādabrahman cosmic aura (Warm luminous glow, not pitch dark) */
        .nada-mandala-aura {
          position: absolute;
          top: -80px;
          left: 50%;
          transform: translateX(-50%);
          width: 700px;
          height: 700px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(147, 51, 234, 0.18) 0%, rgba(59, 130, 246, 0.12) 40%, rgba(245, 158, 11, 0.04) 65%, transparent 75%);
          filter: blur(48px);
          animation: nadaAuraPulse 9s infinite ease-in-out alternate;
        }

        @keyframes nadaAuraPulse {
          0% { transform: translateX(-50%) scale(0.92); opacity: 0.6; }
          100% { transform: translateX(-50%) scale(1.12); opacity: 0.95; }
        }

        /* Nādabrahman Rotating Sacred Sound Wheel */
        .nada-mandala-wheel {
          position: absolute;
          top: -40px;
          left: 50%;
          transform: translateX(-50%);
          width: 520px;
          height: 520px;
          opacity: 0.15;
          animation: nadaWheelRotate 120s linear infinite;
        }

        @keyframes nadaWheelRotate {
          from { transform: translateX(-50%) rotate(0deg); }
          to { transform: translateX(-50%) rotate(360deg); }
        }

        /* Natural floating motion for traditional instrument silhouettes */
        .nada-instrument-drift {
          position: absolute;
          opacity: 0.105;
          color: #C084FC;
          filter: drop-shadow(0 0 10px rgba(192, 132, 252, 0.35));
          animation: nadaInstrumentDrift 14s infinite ease-in-out alternate;
        }

        @keyframes nadaInstrumentDrift {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-14px) rotate(2deg); }
          100% { transform: translateY(6px) rotate(-1.5deg); }
        }

        /* Animated Tambūrā resonance drone strings */
        .nada-drone-string {
          stroke: rgba(245, 158, 11, 0.28);
          stroke-width: 1.2;
          animation: nadaDroneVibrate 1.6s infinite ease-in-out alternate;
        }
        @keyframes nadaDroneVibrate {
          0% { transform: scaleX(1); opacity: 0.15; }
          50% { transform: scaleX(1.02); opacity: 0.45; }
          100% { transform: scaleX(0.98); opacity: 0.2; }
        }

        /* Micro-graphic keyframe animations */
        @keyframes nadaStepPulse {
          0%, 100% { transform: scaleY(0.4); opacity: 0.4; }
          50% { transform: scaleY(1); opacity: 1; }
        }
        .nada-scale-step {
          animation: nadaStepPulse 1.4s infinite ease-in-out;
          transform-origin: bottom;
        }

        @keyframes nadaRadarPulse {
          0% { transform: scale(0.6); opacity: 0.9; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .nada-radar-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1.5px solid;
          animation: nadaRadarPulse 1.8s infinite cubic-bezier(0.2, 0.8, 0.4, 1);
        }

        @keyframes nadaBeatPulse {
          0%, 100% { transform: scale(0.8); opacity: 0.4; }
          50% { transform: scale(1.35); opacity: 1; }
        }
        .nada-beat-dot {
          animation: nadaBeatPulse 1s infinite ease-in-out;
        }

        .nada-key-step {
          animation: nadaStepPulse 1.6s infinite ease-in-out;
          transform-origin: top;
        }

        .nada-chart-bar {
          animation: nadaStepPulse 1.2s infinite ease-in-out;
          transform-origin: bottom;
        }

        /* ── FOREGROUND CONTENT & CARDS ── */
        .nada-content-wrapper {
          position: relative;
          z-index: 1;
          max-width: 1060px;
          margin: 0 auto;
        }

        .nada-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: 999px;
          background: rgba(168, 85, 247, 0.16);
          border: 1px solid rgba(168, 85, 247, 0.4);
          color: #E9D5FF;
          font-size: 0.76rem;
          font-weight: 750;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 12px;
          backdrop-filter: blur(8px);
        }

        .nada-pulse-lamp {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #F59E0B;
          box-shadow: 0 0 10px #F59E0B;
        }

        .nada-hero-title {
          font-size: clamp(2.1rem, 4.2vw, 3rem);
          font-weight: 900;
          letter-spacing: -0.02em;
          margin: 0;
          color: #FFFFFF;
          line-height: 1.15;
          text-shadow: 0 2px 12px rgba(0, 0, 0, 0.6);
        }

        .nada-soundwave-lead {
          display: inline-flex;
          align-items: flex-end;
          gap: 3.5px;
          height: 24px;
          margin-left: 10px;
          vertical-align: middle;
        }
        .nada-wave-bar {
          width: 3.5px;
          background: #F59E0B;
          border-radius: 2px;
          animation: nadaEqualize 1.2s infinite ease-in-out alternate;
        }
        .nada-wave-bar:nth-child(1) { height: 35%; animation-delay: 0.1s; }
        .nada-wave-bar:nth-child(2) { height: 80%; animation-delay: 0.3s; }
        .nada-wave-bar:nth-child(3) { height: 100%; animation-delay: 0.18s; }
        .nada-wave-bar:nth-child(4) { height: 55%; animation-delay: 0.4s; }
        .nada-wave-bar:nth-child(5) { height: 85%; animation-delay: 0.25s; }

        @keyframes nadaEqualize {
          0% { transform: scaleY(0.3); opacity: 0.4; }
          100% { transform: scaleY(1); opacity: 1; }
        }

        .nada-hero-desc {
          margin: 10px 0 0;
          color: #CBD5E1; /* High contrast, comfortable reading */
          font-size: 1.02rem;
          font-weight: 450;
          max-width: 680px;
          line-height: 1.6;
        }

        /* Interactive Grid Layout */
        .nada-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(310px, 1fr));
          gap: 20px;
          margin-top: 34px;
        }

        .nada-card-tile {
          position: relative;
          text-align: left;
          padding: 24px;
          border-radius: 18px;
          /* Medium-dark surface: not pitch black, high contrast */
          background: rgba(30, 41, 59, 0.70);
          border: 1px solid rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(8px);
          cursor: pointer;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 195px;
          overflow: hidden;
          transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1),
                      border-color 0.22s ease,
                      box-shadow 0.22s ease;
          box-shadow: 0 8px 28px rgba(0, 0, 0, 0.22);
          animation: nadaCardRise 650ms both;
        }

        @keyframes nadaCardRise {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .nada-card-tile:nth-child(2) { animation-delay: 70ms; }
        .nada-card-tile:nth-child(3) { animation-delay: 140ms; }
        .nada-card-tile:nth-child(4) { animation-delay: 210ms; }
        .nada-card-tile:nth-child(5) { animation-delay: 280ms; }
        .nada-card-tile:nth-child(6) { animation-delay: 350ms; }
        }

        .nada-card-tile:hover {
          transform: translateY(-5px);
          border-color: rgba(255, 255, 255, 0.3);
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.55);
        }

        .nada-card-ambient {
          position: absolute;
          inset: 0;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }
        .nada-card-tile:hover .nada-card-ambient {
          opacity: 1;
        }
      `}</style>

      {/* ── BACKGROUND: NĀDABRAHMAN MANDALA & TRADITIONAL CARNATIC INSTRUMENTS ── */}
      <div className="nada-ambient-scene">
        <div className="nada-mandala-aura" />

        {/* Nādabrahman Sacred Sound Chakra Mandala */}
        <svg className="nada-mandala-wheel" viewBox="0 0 500 500" fill="none" stroke="#A855F7">
          <circle cx="250" cy="250" r="220" strokeWidth="1" strokeDasharray="4 6" opacity="0.4" />
          <circle cx="250" cy="250" r="170" strokeWidth="1.2" opacity="0.6" />
          <circle cx="250" cy="250" r="120" strokeWidth="1" strokeDasharray="6 8" opacity="0.5" />
          <circle cx="250" cy="250" r="70" strokeWidth="1.5" opacity="0.8" />
          <circle cx="250" cy="250" r="12" fill="#F59E0B" opacity="0.7" />
          {/* 12 Petals representing the 12 Chakras of Melakarta */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <line
              key={deg}
              x1="250"
              y1="250"
              x2={250 + 170 * Math.cos((deg * Math.PI) / 180)}
              y2={250 + 170 * Math.sin((deg * Math.PI) / 180)}
              strokeWidth="0.8"
              opacity="0.3"
            />
          ))}
        </svg>

        {/* Traditional Tanpura Resonance Drone Lines */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <line x1="12%" y1="0" x2="12%" y2="100%" className="nada-drone-string" />
          <line x1="28%" y1="0" x2="28%" y2="100%" className="nada-drone-string" style={{ animationDelay: '0.4s' }} />
          <line x1="72%" y1="0" x2="72%" y2="100%" className="nada-drone-string" style={{ animationDelay: '0.2s' }} />
          <line x1="88%" y1="0" x2="88%" y2="100%" className="nada-drone-string" style={{ animationDelay: '0.7s' }} />
        </svg>

        {/* Top-Right: Sarasvatī Vīṇā Silhouette */}
        <div className="nada-instrument-drift" style={{ top: '6%', right: '5%', width: 140, height: 140 }}>
          <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M16 80 C 16 64, 32 64, 32 80 C 32 96, 16 96, 16 80 Z" />
            <path d="M30 75 L 75 25" />
            <path d="M75 25 C 80 20, 86 24, 82 30 C 80 34, 73 30, 75 25 Z" />
            <path d="M60 40 C 65 35, 70 38, 68 45 C 65 48, 60 45, 60 40 Z" />
            <line x1="33" y1="72" x2="73" y2="28" stroke="#F59E0B" strokeWidth="1.2" />
          </svg>
        </div>

        {/* Bottom-Left: Mṛdaṅgam Silhouette */}
        <div className="nada-instrument-drift" style={{ bottom: '8%', left: '4%', width: 130, height: 130, animationDelay: '3s' }}>
          <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <ellipse cx="50" cy="50" rx="36" ry="18" transform="rotate(-15 50 50)" />
            <ellipse cx="20" cy="42" rx="7" ry="14" transform="rotate(-15 20 42)" fill="rgba(244, 63, 94, 0.25)" />
            <ellipse cx="80" cy="58" rx="8" ry="15" transform="rotate(-15 80 58)" fill="rgba(245, 158, 11, 0.35)" />
            <line x1="20" y1="32" x2="80" y2="48" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="20" y1="52" x2="80" y2="68" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
          </svg>
        </div>

        {/* Bottom-Right: Ghaṭam silhouette */}
        <div className="nada-instrument-drift" style={{ bottom: '10%', right: '7%', width: 118, height: 118, animationDelay: '2s', color: '#F59E0B' }}>
          <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M39 19 C39 13 61 13 61 19 L65 29 C72 37 78 48 76 62 C74 79 64 87 50 87 C36 87 26 79 24 62 C22 48 28 37 35 29 Z" />
            <ellipse cx="50" cy="19" rx="11" ry="4" />
            <path d="M31 43 C41 48 59 48 69 43" opacity=".65" />
            <path d="M27 62 C39 68 61 68 73 62" opacity=".55" />
            <path d="M39 28 L35 37 M61 28 L65 37" opacity=".6" />
          </svg>
        </div>

        {/* Top-Left: Veṇu (Bamboo Flute) */}
        <div className="nada-instrument-drift" style={{ top: '12%', left: '5%', width: 120, height: 70, animationDelay: '5s' }}>
          <svg viewBox="0 0 100 60" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <rect x="12" y="25" width="76" height="8" rx="4" />
            <circle cx="26" cy="29" r="2" fill="currentColor" />
            <circle cx="45" cy="29" r="1.5" fill="currentColor" />
            <circle cx="53" cy="29" r="1.5" fill="currentColor" />
            <circle cx="61" cy="29" r="1.5" fill="currentColor" />
            <circle cx="69" cy="29" r="1.5" fill="currentColor" />
            <circle cx="77" cy="29" r="1.5" fill="currentColor" />
            <path d="M88 23 C 94 20, 96 35, 100 27" stroke="#10B981" strokeWidth="1.5" />
          </svg>
        </div>
      </div>

      {/* ── FOREGROUND CONTENT ── */}
      <div className="nada-content-wrapper">
        {/* Header Section */}
        <header style={{ marginBottom: 16 }}>
          <div className="nada-hero-badge">
            <span className="nada-pulse-lamp" />
            <span>Nādōpāsanā • Classical Music Sanctum</span>
            <IconSparkle />
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 6 }}>
            <h1 className="nada-hero-title">NĀDA VIDYĀ</h1>
            <div className="nada-soundwave-lead" title="Nādabrahman Harmonic Waveform">
              <span className="nada-wave-bar" />
              <span className="nada-wave-bar" />
              <span className="nada-wave-bar" />
              <span className="nada-wave-bar" />
              <span className="nada-wave-bar" />
            </div>
          </div>

          <p className="nada-hero-desc">
            Explore rāga, śruti, tāla and creative practice through sound-led learning.
          </p>

          {/* Quick Pillar Badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 18 }}>
            {[
              '72 Melakartas',
              '22 Śruti',
              '35 Tāla cycles',
            ].map((tag, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '0.76rem',
                  color: '#F1F5F9',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  padding: '4px 12px',
                  borderRadius: 8,
                  fontWeight: 600,
                  backdropFilter: 'blur(6px)',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </header>

        {/* ── 6 CORE INTERACTIVE TILES ── */}
        <main className="nada-cards-grid">
          {MODULES.map((item) => {
            const IconComponent = item.icon
            const isHovered = hoveredCard === item.id

            return (
              <button
                key={item.id}
                type="button"
                className="nada-card-tile"
                onClick={() => setModule(item.id)}
                onMouseEnter={() => setHoveredCard(item.id)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  borderColor: isHovered ? item.accentColor : 'rgba(255, 255, 255, 0.12)',
                }}
              >
                {/* Dynamic Ambient Hover Glow */}
                <div
                  className="nada-card-ambient"
                  style={{ background: item.gradientGlow }}
                />

                {/* Top: Badges & Icon */}
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 14,
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        letterSpacing: '0.07em',
                        color: item.accentColor,
                        background: `${item.accentColor}22`,
                        padding: '4px 9px',
                        borderRadius: 6,
                        border: `1px solid ${item.accentColor}44`,
                      }}
                    >
                      {item.categoryPill}
                    </span>

                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        background: `${item.accentColor}20`,
                        border: `1px solid ${item.accentColor}44`,
                        color: item.accentColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.22s ease',
                        transform: isHovered ? 'scale(1.12)' : 'scale(1)',
                        boxShadow: isHovered ? `0 0 16px ${item.accentColor}55` : 'none',
                      }}
                    >
                      <IconComponent />
                    </div>
                  </div>

                  {/* Classical Sanskrit Theme Title */}
                  <div
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      color: item.accentColor,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      marginBottom: 2,
                    }}
                  >
                    {item.sanskritTitle}
                  </div>

                  {/* English Module Name */}
                  <h3
                    style={{
                      margin: '0 0 8px',
                      fontSize: '1.25rem',
                      fontWeight: 800,
                      color: '#FFFFFF',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {item.englishTitle}
                  </h3>

                  {/* High-Contrast Description */}
                  <p
                    style={{
                      margin: 0,
                      color: '#CBD5E1',
                      fontSize: '0.88rem',
                      fontWeight: 450,
                      lineHeight: 1.5,
                    }}
                  >
                    {item.subtitle}
                  </p>
                </div>

                {/* Bottom: Micro-animation Graphic & Launch Arrow */}
                <div
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 20,
                    paddingTop: 12,
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <CardAnimation type={item.animType} color={item.accentColor} />
                    <span
                      style={{
                        fontSize: '0.74rem',
                        color: '#94A3B8',
                        fontWeight: 500,
                      }}
                    >
                      {item.metricBadge}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background: isHovered ? item.accentColor : 'rgba(255, 255, 255, 0.08)',
                      color: isHovered ? '#0F172A' : '#FFFFFF',
                      transition: 'all 0.2s ease',
                      transform: isHovered ? 'translate(2px, -2px)' : 'none',
                    }}
                  >
                    <IconArrow />
                  </div>
                </div>
              </button>
            )
          })}
        </main>
      </div>
    </div>
  )
}

export default Home