import React, { useState } from 'react'
import { useAppStore } from '../store/useAppStore'

// ============================================================================
// REALISTIC, DETAILED TRADITIONAL SVG INSTRUMENT ICONS
// ============================================================================
const IconRealisticVeena = () => (
  <svg width="26" height="26" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    {/* Kudam (Resonator Body) */}
    <ellipse cx="25" cy="75" rx="16" ry="14" fill="rgba(217, 119, 6, 0.25)" stroke="#D97706" strokeWidth="3" />
    <circle cx="25" cy="75" r="7" fill="#25233A" />
    {/* Dandi (Neck) and Frets */}
    <path d="M35 65 L82 22" stroke="#D97706" strokeWidth="4" />
    <line x1="45" y1="58" x2="51" y2="52" stroke="#0F766E" strokeWidth="2.5" />
    <line x1="51" y1="52" x2="57" y2="46" stroke="#0F766E" strokeWidth="2.5" />
    <line x1="57" y1="46" x2="63" y2="40" stroke="#0F766E" strokeWidth="2.5" />
    <line x1="63" y1="40" x2="69" y2="34" stroke="#0F766E" strokeWidth="2.5" />
    {/* Yaali (Dragon Head) */}
    <path d="M82 22 C 88 16, 92 20, 88 28 C 84 32, 78 28, 82 22 Z" fill="#D97706" />
    {/* Main Playing Strings */}
    <line x1="25" y1="61" x2="85" y2="18" stroke="#0D9488" strokeWidth="1.5" />
    <line x1="25" y1="64" x2="85" y2="21" stroke="#0D9488" strokeWidth="1" />
  </svg>
)

const IconRealisticFlute = () => (
  <svg width="26" height="26" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    {/* Bamboo Body */}
    <rect x="15" y="44" width="70" height="12" rx="6" fill="rgba(13, 148, 136, 0.2)" stroke="#0D9488" strokeWidth="3" />
    {/* Blowing Hole & Finger Holes */}
    <circle cx="30" cy="50" r="2.5" fill="#25233A" />
    <circle cx="48" cy="50" r="2" fill="#25233A" />
    <circle cx="58" cy="50" r="2" fill="#25233A" />
    <circle cx="68" cy="50" r="2" fill="#25233A" />
    <circle cx="78" cy="50" r="2" fill="#25233A" />
    {/* Bamboo Knots / Rings */}
    <line x1="22" y1="44" x2="22" y2="56" stroke="#D97706" strokeWidth="2" />
    <line x1="82" y1="44" x2="82" y2="56" stroke="#D97706" strokeWidth="2" />
  </svg>
)

const IconRealisticMridangam = () => (
  <svg width="26" height="26" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    {/* Barrel Body */}
    <path d="M25 35 C 40 42, 60 42, 75 35 C 82 50, 82 50, 75 65 C 60 58, 40 58, 25 65 C 18 50, 18 50, 25 35 Z" fill="rgba(217, 119, 6, 0.2)" stroke="#D97706" strokeWidth="3" />
    {/* Left Head (Valanthai) */}
    <ellipse cx="25" cy="50" rx="7" ry="15" fill="#0D9488" stroke="#25233A" strokeWidth="2" />
    <circle cx="25" cy="50" r="3" fill="#F59E0B" />
    {/* Right Head (Thoppi) */}
    <ellipse cx="75" cy="50" rx="7" ry="15" fill="#0D9488" stroke="#25233A" strokeWidth="2" />
    <circle cx="75" cy="50" r="4.5" fill="#25233A" />
    {/* Tension Laces */}
    <line x1="28" y1="38" x2="72" y2="38" stroke="currentColor" strokeWidth="1.5" />
    <line x1="28" y1="62" x2="72" y2="62" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

const IconRealisticTala = () => (
  <svg width="26" height="26" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    {/* Left Cymbal */}
    <circle cx="38" cy="50" r="18" fill="rgba(217, 119, 6, 0.25)" stroke="#D97706" strokeWidth="3" />
    <circle cx="38" cy="50" r="6" fill="#D97706" />
    {/* Right Cymbal */}
    <circle cx="62" cy="50" r="18" fill="rgba(217, 119, 6, 0.25)" stroke="#D97706" strokeWidth="3" />
    <circle cx="62" cy="50" r="6" fill="#D97706" />
    {/* Connecting Cord */}
    <path d="M38 32 C 45 22, 55 22, 62 32" stroke="#0D9488" strokeWidth="2.5" />
  </svg>
)

const IconRealisticGrantha = () => (
  <svg width="26" height="26" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    {/* Palm Leaf Manuscript Stack */}
    <rect x="15" y="30" width="70" height="10" rx="3" fill="rgba(13, 148, 136, 0.2)" stroke="#0D9488" strokeWidth="3" />
    <rect x="15" y="45" width="70" height="10" rx="3" fill="rgba(217, 119, 6, 0.2)" stroke="#D97706" strokeWidth="3" />
    <rect x="15" y="60" width="70" height="10" rx="3" fill="rgba(13, 148, 136, 0.2)" stroke="#0D9488" strokeWidth="3" />
    {/* Binding Cord Hole */}
    <circle cx="30" cy="35" r="2" fill="#25233A" />
    <circle cx="30" cy="50" r="2" fill="#25233A" />
    <circle cx="30" cy="65" r="2" fill="#25233A" />
  </svg>
)

const IconRealisticGraph = () => (
  <svg width="26" height="26" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    {/* Axis */}
    <line x1="20" y1="80" x2="85" y2="80" stroke="#25233A" strokeWidth="3" />
    <line x1="20" y1="15" x2="20" y2="80" stroke="#25233A" strokeWidth="3" />
    {/* Growth Curve */}
    <path d="M20 65 Q 40 45, 55 55 T 85 20" stroke="#0D9488" strokeWidth="4" fill="none" />
    <circle cx="55" cy="55" r="4" fill="#D97706" />
    <circle cx="85" cy="20" r="4" fill="#D97706" />
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
// MODULE CARD METADATA (Nādabrahman-themed, Hz-free)
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
    icon: IconRealisticVeena,
    accentColor: '#0D9488', // Deep Teal
    gradientGlow: 'linear-gradient(135deg, rgba(13, 148, 136, 0.22), rgba(15, 118, 110, 0.05))',
    metricBadge: '72 Mēlas • 12 Chakras',
    animType: 'scale',
  },
  {
    id: 'shruti',
    sanskritTitle: 'Nāda Bindu',
    englishTitle: 'Śruti Trainer',
    categoryPill: 'PITCH & INTONATION',
    subtitle: 'Microtonal 22-śruti frequency alignment with real-time cents feedback',
    icon: IconRealisticFlute,
    accentColor: '#10B981', // Emerald Teal
    gradientGlow: 'linear-gradient(135deg, rgba(16, 185, 129, 0.22), rgba(5, 150, 105, 0.05))',
    metricBadge: '22 Śrutis • Cents Precision',
    animType: 'radar',
  },
  {
    id: 'tala',
    sanskritTitle: 'Laya Taranga',
    englishTitle: 'Tāla Trainer',
    categoryPill: 'RHYTHM & KŌRVAIS',
    subtitle: '35 Tāla matrices, 5 Jātis, Nadai divisions, and teermānam calculations',
    icon: IconRealisticTala,
    accentColor: '#C2410C', // Deep Burnt Orange
    gradientGlow: 'linear-gradient(135deg, rgba(194, 65, 12, 0.22), rgba(154, 52, 18, 0.05))',
    metricBadge: '35 Tālas • 5 Jātis',
    animType: 'beats',
  },
  {
    id: 'builder',
    sanskritTitle: 'Svara Rachanā',
    englishTitle: 'Music Builder',
    categoryPill: 'MANODHARMA & NOTATION',
    subtitle: 'Interactive svara sequencing, abhyāsa gāna drills, and melodic composition',
    icon: IconRealisticMridangam,
    accentColor: '#D97706', // Warm Golden Amber
    gradientGlow: 'linear-gradient(135deg, rgba(217, 119, 6, 0.22), rgba(180, 83, 9, 0.05))',
    metricBadge: 'Svara Grid • Varisais',
    animType: 'keys',
  },
  {
    id: 'resources',
    sanskritTitle: 'Grantha Bhandāra',
    englishTitle: 'Resources & Vault',
    categoryPill: 'HISTORIC ARCHIVES',
    subtitle: '50+ curated archives, notation manuscripts, composer treatises & kutcheris',
    icon: IconRealisticGrantha,
    accentColor: '#0891B2', // Deep Cyan Blue
    gradientGlow: 'linear-gradient(135deg, rgba(8, 145, 178, 0.22), rgba(14, 116, 144, 0.05))',
    metricBadge: '50+ Vaults • Notations',
    animType: 'book',
  },
  {
    id: 'progress',
    sanskritTitle: 'Sādhana Darpaṇa',
    englishTitle: 'My Progress',
    categoryPill: 'PRACTICE ANALYTICS',
    subtitle: 'Daily pitch accuracy, rhythmic stamina, learning streaks & mastery milestones',
    icon: IconRealisticGraph,
    accentColor: '#B91C1C', // Crimson Ruby
    gradientGlow: 'linear-gradient(135deg, rgba(185, 28, 28, 0.22), rgba(153, 27, 27, 0.05))',
    metricBadge: 'Daily Streaks • Metrics',
    animType: 'chart',
  },
]

// ============================================================================
// MICRO-GRAPHIC ANIMATION COMPONENTS
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
// MAIN HOMEPAGE COMPONENT (Responsive Tri-Layout: Mobile, Tablet, Desktop)
// ============================================================================
export function Home() {
  const setModule = useAppStore((s) => s.setModule)
  const [hoveredCard, setHoveredCard] = useState<ModuleId | null>(null)

  return (
    <div className="nada-home-viewport">
      {/* Scoped CSS for responsive 3-device design & Nādabrahman Sacred Geometry */}
      <style>{`
        .nada-home-viewport {
          position: relative;
          isolation: isolate;
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 24px 16px 40px;
          min-height: 100%;
          background: linear-gradient(180deg, #FAF6EE 0%, #F5EFE6 50%, #EFE7DA 100%);
          color: var(--text, #25233A);
          box-sizing: border-box;
          font-family: inherit;
        }

        /* ── RESPONSIVE TRI-LAYOUT CONTAINERS ── */
        .nada-device-frame {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          box-sizing: border-box;
        }

        /* Default / Desktop Layout (> 1024px) */
        .nada-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 22px;
          margin-top: 32px;
        }

        /* Tablet Layout (601px - 1024px) */
        @media (max-width: 1024px) {
          .nada-cards-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 18px;
            margin-top: 26px;
          }
          .nada-home-viewport {
            padding: 20px 14px 32px;
          }
        }

        /* Small Screen / Mobile Layout (<= 600px) */
        @media (max-width: 600px) {
          .nada-cards-grid {
            grid-template-columns: 1fr;
            gap: 14px;
            margin-top: 20px;
          }
          .nada-home-viewport {
            padding: 16px 10px 24px;
          }
          .nada-hero-title {
            font-size: 1.85rem !important;
          }
          .nada-hero-desc {
            font-size: 0.92rem !important;
          }
        }

        /* ── ARTISTIC NĀDABRAHMAN BACKGROUND SCENE ── */
        .nada-ambient-scene {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
          opacity: 0.85;
        }

        /* Sacred Sri Yantra / Nādabrahman Luminous Aura */
        .nada-mandala-aura {
          position: absolute;
          top: 10%;
          left: 50%;
          transform: translateX(-50%);
          width: 650px;
          height: 650px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(13, 148, 136, 0.15) 0%, rgba(217, 119, 6, 0.10) 35%, rgba(15, 118, 110, 0.03) 65%, transparent 80%);
          filter: blur(52px);
          animation: nadaAuraPulse 10s infinite ease-in-out alternate;
        }

        @keyframes nadaAuraPulse {
          0% { transform: translateX(-50%) scale(0.9); opacity: 0.5; }
          100% { transform: translateX(-50%) scale(1.15); opacity: 0.95; }
        }

        /* Rotating Sacred Sound Chakra Mandala */
        .nada-mandala-wheel {
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          width: 480px;
          height: 480px;
          opacity: 0.12;
          animation: nadaWheelRotate 140s linear infinite;
        }

        @keyframes nadaWheelRotate {
          from { transform: translateX(-50%) rotate(0deg); }
          to { transform: translateX(-50%) rotate(360deg); }
        }

        /* Animated Tanpura Drone Resonance Strings */
        .nada-drone-string {
          stroke: rgba(217, 119, 6, 0.22);
          stroke-width: 1.2;
          animation: nadaDroneVibrate 1.8s infinite ease-in-out alternate;
        }
        @keyframes nadaDroneVibrate {
          0% { transform: scaleX(1); opacity: 0.12; }
          50% { transform: scaleX(1.03); opacity: 0.4; }
          100% { transform: scaleX(0.97); opacity: 0.18; }
        }

        /* Floating Traditional Silhouette Drift */
        .nada-instrument-drift {
          position: absolute;
          opacity: 0.08;
          color: #0F766E;
          filter: drop-shadow(0 0 12px rgba(15, 118, 110, 0.25));
          animation: nadaInstrumentDrift 16s infinite ease-in-out alternate;
        }

        @keyframes nadaInstrumentDrift {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(1.5deg); }
          100% { transform: translateY(6px) rotate(-1deg); }
        }

        /* Micro-animation Keyframes */
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

        /* ── FOREGROUND CARDS & HERO STYLING ── */
        .nada-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: 999px;
          background: rgba(13, 148, 136, 0.12);
          border: 1px solid rgba(13, 148, 136, 0.3);
          color: #0F766E;
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
          background: #D97706;
          box-shadow: 0 0 10px #D97706;
        }

        .nada-hero-title {
          font-size: clamp(2.1rem, 4.2vw, 3rem);
          font-weight: 900;
          letter-spacing: -0.02em;
          margin: 0;
          color: #25233A;
          line-height: 1.15;
          font-family: var(--font-display), Georgia, serif;
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
          background: #0F766E;
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
          color: #625F73;
          font-size: 1.02rem;
          font-weight: 450;
          max-width: 680px;
          line-height: 1.6;
        }

        .nada-card-tile {
          position: relative;
          text-align: left;
          padding: 24px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid rgba(49, 46, 129, 0.14);
          backdrop-filter: blur(8px);
          cursor: pointer;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 200px;
          overflow: hidden;
          transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1),
                      border-color 0.22s ease,
                      box-shadow 0.22s ease;
          box-shadow: 0 4px 20px rgba(49, 46, 129, 0.06);
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

        .nada-card-tile:hover {
          transform: translateY(-5px);
          border-color: rgba(13, 148, 136, 0.4);
          box-shadow: 0 12px 32px rgba(49, 46, 129, 0.14);
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

      {/* ── BACKGROUND: ARTISTIC NĀDABRAHMAN SCENE & SILHOUETTES ── */}
      <div className="nada-ambient-scene">
        <div className="nada-mandala-aura" />

        {/* Sacred Sound Chakra Mandala (Nādabrahman motif) */}
        <svg className="nada-mandala-wheel" viewBox="0 0 500 500" fill="none" stroke="#0D9488">
          <circle cx="250" cy="250" r="220" strokeWidth="1" strokeDasharray="4 6" opacity="0.3" />
          <circle cx="250" cy="250" r="170" strokeWidth="1.2" opacity="0.45" />
          <circle cx="250" cy="250" r="120" strokeWidth="1" strokeDasharray="6 8" opacity="0.35" />
          <circle cx="250" cy="250" r="70" strokeWidth="1.5" opacity="0.65" />
          <circle cx="250" cy="250" r="12" fill="#D97706" opacity="0.6" />
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <line
              key={deg}
              x1="250"
              y1="250"
              x2={250 + 170 * Math.cos((deg * Math.PI) / 180)}
              y2={250 + 170 * Math.sin((deg * Math.PI) / 180)}
              strokeWidth="0.8"
              opacity="0.2"
            />
          ))}
        </svg>

        {/* Tanpura Drone Strings */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <line x1="15%" y1="0" x2="15%" y2="100%" className="nada-drone-string" />
          <line x1="32%" y1="0" x2="32%" y2="100%" className="nada-drone-string" style={{ animationDelay: '0.5s' }} />
          <line x1="68%" y1="0" x2="68%" y2="100%" className="nada-drone-string" style={{ animationDelay: '0.2s' }} />
          <line x1="85%" y1="0" x2="85%" y2="100%" className="nada-drone-string" style={{ animationDelay: '0.8s' }} />
        </svg>

        {/* Realistic Vīṇā Silhouette (Top Right) */}
        <div className="nada-instrument-drift" style={{ top: '8%', right: '6%', width: 130, height: 130 }}>
          <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <ellipse cx="22" cy="78" rx="14" ry="12" />
            <path d="M32 70 L 80 20" />
            <circle cx="80" cy="20" r="5" />
          </svg>
        </div>

        {/* Realistic Flute Silhouette (Top Left) */}
        <div className="nada-instrument-drift" style={{ top: '15%', left: '4%', width: 120, height: 60, animationDelay: '4s' }}>
          <svg viewBox="0 0 100 50" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="10" y="22" width="80" height="7" rx="3.5" />
            <circle cx="25" cy="25.5" r="1.5" fill="currentColor" />
            <circle cx="45" cy="25.5" r="1.2" fill="currentColor" />
            <circle cx="55" cy="25.5" r="1.2" fill="currentColor" />
            <circle cx="65" cy="25.5" r="1.2" fill="currentColor" />
          </svg>
        </div>

        {/* Realistic Mridangam Silhouette (Bottom Left) */}
        <div className="nada-instrument-drift" style={{ bottom: '10%', left: '5%', width: 120, height: 120, animationDelay: '3s' }}>
          <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M25 38 C 40 45, 60 45, 75 38 C 80 50, 80 50, 75 62 C 60 55, 40 55, 25 62 C 20 50, 20 50, 25 38 Z" />
            <ellipse cx="25" cy="50" rx="6" ry="12" />
            <ellipse cx="75" cy="50" rx="6" ry="12" />
          </svg>
        </div>
      </div>

      {/* ── FOREGROUND CONTENT CONTAINER (Responsive Tri-Layout) ── */}
      <div className="nada-device-frame">
        {/* Header Hero Section */}
        <header style={{ marginBottom: 16 }}>
          <div className="nada-hero-badge">
            <span className="nada-pulse-lamp" />
            <span>Nādōpāsanā • Classical Music Sanctum</span>
            <IconSparkle />
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 6 }}>
            <h1 className="nada-hero-title">NĀDA</h1>
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
                  color: '#25233A',
                  background: 'rgba(49, 46, 129, 0.06)',
                  border: '1px solid rgba(49, 46, 129, 0.14)',
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

        {/* ── 6 CORE INTERACTIVE TILES (Responsive Grid) ── */}
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
                  borderColor: isHovered ? item.accentColor : 'rgba(49, 46, 129, 0.14)',
                }}
              >
                {/* Dynamic Ambient Hover Glow */}
                <div
                  className="nada-card-ambient"
                  style={{ background: item.gradientGlow }}
                />

                {/* Top: Badges & Realistic SVG Icon */}
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
                        background: `${item.accentColor}18`,
                        padding: '4px 9px',
                        borderRadius: 6,
                        border: `1px solid ${item.accentColor}33`,
                      }}
                    >
                      {item.categoryPill}
                    </span>

                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: `${item.accentColor}15`,
                        border: `1px solid ${item.accentColor}33`,
                        color: item.accentColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.22s ease',
                        transform: isHovered ? 'scale(1.12)' : 'scale(1)',
                        boxShadow: isHovered ? `0 0 16px ${item.accentColor}33` : 'none',
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
                      color: 'var(--text, #25233A)',
                      letterSpacing: '-0.01em',
                      fontFamily: 'var(--font-display), Georgia, serif',
                    }}
                  >
                    {item.englishTitle}
                  </h3>

                  {/* Hz-Free Clean Description */}
                  <p
                    style={{
                      margin: 0,
                      color: 'var(--text-muted, #625F73)',
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
                    borderTop: '1px solid rgba(49, 46, 129, 0.08)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <CardAnimation type={item.animType} color={item.accentColor} />
                    <span
                      style={{
                        fontSize: '0.74rem',
                        color: 'var(--text-faint, #777286)',
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
                      background: isHovered ? item.accentColor : 'rgba(49, 46, 129, 0.06)',
                      color: isHovered ? '#ffffff' : 'var(--text, #25233A)',
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