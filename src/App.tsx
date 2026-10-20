import { useEffect, useState } from 'react'
import { useAppStore } from './store/useAppStore'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import RagaLibrary from './modules/RagaLibrary'
import TalaTrainer from './modules/TalaTrainer'
import ShrutiTrainer from './modules/ShrutiTrainer'
import Resources from './modules/Resources'
import MusicBuilder from './modules/MusicBuilder'
import Progress from './modules/Progress'
import About from './modules/About'
import Home from './modules/Home'
import GamakaTrainer from './modules/GamakaTrainer'
import JanyaLibrary from './modules/JanyaLibrary'

export default function App() {
  const { module, sidebarOpen, setSidebarOpen } = useAppStore()

  // Phone breakpoint: tablet and desktop use the in-flow app navigation
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 600 : false
  )

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 600)
    window.addEventListener('resize', check)
    check()
    return () => window.removeEventListener('resize', check)
  }, [])

  // Close the navigation drawer after selecting a module on phones
  useEffect(() => {
    if (isMobile) setSidebarOpen(false)
  }, [module, isMobile, setSidebarOpen])

  const moduleMap: Record<string, JSX.Element> = {
    home: <Home />,
    raga: <RagaLibrary />,
    janya: <JanyaLibrary />,
    tala: <TalaTrainer />,
    shruti: <ShrutiTrainer />,
    gamaka: <GamakaTrainer />,
    resources: <Resources />,
    builder: <MusicBuilder />,
    progress: <Progress />,
    about: <About />,
  }

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', position: 'relative' }}>
      {/* Phone navigation backdrop — tap to close sidebar */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* Phone: drawer overlay. Tablet/desktop: in-flow navigation. */}
      <div
        style={{
          position: isMobile ? 'fixed' : 'relative',
          top: 0,
          left: 0,
          height: '100%',
          zIndex: isMobile ? 10 : 'auto',
          transform: isMobile && !sidebarOpen ? 'translateX(-100%)' : 'translateX(0)',
          transition: 'transform 0.25s ease',
        }}
      >
        <Sidebar />
      </div>

      {/* Main content flexes into the space left by the navigation */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        <Header />
        <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {moduleMap[module] ?? <RagaLibrary />}
        </main>
      </div>
    </div>
  )
}
