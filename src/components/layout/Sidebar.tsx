import { useEffect, useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import type { AppModule } from '../../types/index'
import { House, Music2, Drum, AudioLines, BookOpen, Piano, ChartNoAxesCombined, Info, Sparkles } from 'lucide-react'



const NAV_ITEMS: { id: AppModule; icon: import('lucide-react').LucideIcon; label: string; sub: string }[] = [
  { id:'home', icon: House, label:'Home', sub:'Main menu' },
  { id:'wisdom',   icon: Sparkles, label:'Nāda Wisdom', sub:'Listen & discover' },
  { id:'raga',     icon: Music2, label:'Rāga Practice',   sub:'Melakarta · Janya · Vakra' },
  { id:'tala',     icon: Drum, label:'Tāla Trainer',   sub:'L1 → L2 → L3' },
  { id:'shruti',   icon: AudioLines, label:'Śruti Trainer',  sub:'Pitch detection' },
  { id:'resources',  icon: BookOpen, label:'Resources', sub:'Learning materials' },
  { id:'builder',  icon: Piano, label:'Gāna Builder',  sub:'Compose & create' },
  { id:'progress', icon: ChartNoAxesCombined, label:'My Progress',    sub:'Sessions & stats' },
  { id:'about',    icon: Info, label:'About Nāda',      sub:'Vision & roadmap' },
]

export default function Sidebar() {
  const { module, setModule, sidebarOpen, setSidebarOpen } = useAppStore()

  // Reactive isMobile check
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 900 : false
  )
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900)
    window.addEventListener('resize', check)
    check()
    return () => window.removeEventListener('resize', check)
  }, [])

  // On mobile: sidebar is a fixed overlay drawer — hidden when closed
  if (isMobile) {
    return (
      <>
        {/* Dark backdrop when open */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 98,
              background: 'rgba(0,0,0,0.6)',
            }}
          />
        )}

        {/* Drawer panel */}
        <aside style={{
          position: 'fixed',
          top: 0, left: 0,
          height: '100%',
          width: 220,
          zIndex: 99,
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          display: sidebarOpen ? 'flex' : 'none',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Logo */}
          <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--border)', display:'flex', alignItems:'center', gap:'var(--space-3)' }}>
            <div style={{ width:36, height:36, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--accent-dim)', borderRadius:'50%' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'0.95rem', color:'var(--accent)', lineHeight:1.1 }}>Nāda </div>
              <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.05em' }}>BY BHĀVA TECH</div>
            </div>
          </div>

          {/* Nav items */}
          <nav style={{ flex:1, padding:'var(--space-2)', display:'flex', flexDirection:'column', gap:2 }}>
            {NAV_ITEMS.map(item => {
              const active = module === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => { setModule(item.id); setSidebarOpen(false) }}
                  style={{
                    display:'flex', alignItems:'center', gap:'var(--space-3)',
                    padding: 'var(--space-2) var(--space-3)',
                    borderRadius: 'var(--radius)',
                    background: active ? 'var(--accent-dim)' : 'transparent',
                    border: active ? '1px solid var(--border)' : '1px solid transparent',
                    color: active ? 'var(--accent)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <item.icon size={19} strokeWidth={1.8} />
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:'0.82rem', fontWeight:600, whiteSpace:'nowrap' }}>{item.label}</div>
                    <div style={{ fontSize:'0.65rem', color:'var(--text-faint)', whiteSpace:'nowrap' }}>{item.sub}</div>
                  </div>
                </button>
              )
            })}
          </nav>

          {/* Close button */}
          <button
            onClick={() => setSidebarOpen(false)}
            style={{ padding:'var(--space-3)', borderTop:'1px solid var(--border)', color:'var(--text-muted)', fontSize:'0.75rem', display:'flex', alignItems:'center', justifyContent:'flex-end', gap:'var(--space-2)' }}
          >
            <span>Close</span>
            <span>✕</span>
          </button>
        </aside>
      </>
    )
  }

  // Desktop: inline sidebar (collapsed to 64px or expanded to 220px)
  return (
    <aside style={{
      width: sidebarOpen ? 220 : 64,
      minWidth: sidebarOpen ? 220 : 64,
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width var(--transition), min-width var(--transition)',
      overflow: 'hidden',
      zIndex: 10,
    }}>
      {/* Logo */}
      <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--border)', display:'flex', alignItems:'center', gap:'var(--space-3)' }}>
        <div style={{ width:36, height:36, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--accent-dim)', borderRadius:'50%' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
          </svg>
        </div>
        {sidebarOpen && (
          <div>
            <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'0.95rem', color:'var(--accent)', lineHeight:1.1 }}>Nāda </div>
            <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.05em' }}>BY BHĀVA TECH</div>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav style={{ flex:1, padding:'var(--space-2)', display:'flex', flexDirection:'column', gap:2 }}>
        {NAV_ITEMS.map(item => {
          const active = module === item.id
          return (
            <button
              key={item.id}
              onClick={() => setModule(item.id)}
              title={!sidebarOpen ? item.label : undefined}
              style={{
                display:'flex', alignItems:'center', gap:'var(--space-3)',
                padding: sidebarOpen ? 'var(--space-2) var(--space-3)' : 'var(--space-2)',
                borderRadius: 'var(--radius)',
                background: active ? 'var(--accent-dim)' : 'transparent',
                border: active ? '1px solid var(--border)' : '1px solid transparent',
                color: active ? 'var(--accent)' : 'var(--text-muted)',
                transition: 'all var(--transition)',
                cursor: 'pointer',
                textAlign: 'left',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
              }}
            >
              <item.icon size={19} strokeWidth={1.8} />
              {sidebarOpen && (
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:'0.82rem', fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.label}</div>
                  <div style={{ fontSize:'0.65rem', color:'var(--text-faint)', whiteSpace:'nowrap' }}>{item.sub}</div>
                </div>
              )}
            </button>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{ padding:'var(--space-3)', borderTop:'1px solid var(--border)', color:'var(--text-muted)', fontSize:'0.75rem', display:'flex', alignItems:'center', justifyContent: sidebarOpen ? 'flex-end' : 'center', gap:'var(--space-2)' }}
      >
        {sidebarOpen && <span>Collapse</span>}
        <span style={{ display:'inline-block', transform: sidebarOpen ? 'none' : 'rotate(180deg)', transition:'transform var(--transition)' }}>◀</span>
      </button>
    </aside>
  )
}
