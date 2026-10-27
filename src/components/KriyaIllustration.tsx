import { KRIYA_LABELS, type KriyaAction } from '../music/talaPractice'

export function KriyaIllustration({ action, beatNo }: { action: KriyaAction; beatNo: number }) {
  const tap = action === 'tap'
  const wave = action === 'wave'
  const fingers = ['little', 'ring', 'middle', 'index'] as const
  return (
    <div style={{display:'flex',alignItems:'center',flexWrap:'wrap',gap:12,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:14,marginBottom:'var(--space-3)',minWidth:0}}>
      <svg viewBox="0 0 230 150" role="img" aria-label={`Hand action for beat ${beatNo}: ${KRIYA_LABELS[action]}`} style={{width:'clamp(100px, 28vw, 170px)',maxWidth:'100%',height:'auto',aspectRatio:'230 / 150',flex:'0 1 170px'}}>
        <path d="M20 130 Q95 105 205 135" fill="none" stroke="#527e73" strokeWidth="10" opacity=".45"/>
        <g style={{transform:tap?'translate(0px,10px)':wave?'rotate(-12deg)':'none',transformOrigin:'120px 100px',transition:'transform 180ms ease'}}>
          <path d="M83 140 L83 92 Q62 69 71 64 Q77 60 89 78 L89 88 L165 88 L163 114 Q158 124 149 128 L149 140" fill="#f5c4a2" stroke="#a9674a" strokeWidth="2"/>
          {fingers.map((finger, i) => {
            const x = 148 - i * 19
            const top = [50, 32, 22, 35][i]
            const selected = action === finger
            return <g key={finger}>
              <rect x={x} y={top} width="17" height={100-top} rx="8" fill={selected?'#f5a623':'#f5c4a2'} stroke={selected?'#9a5200':'#a9674a'} strokeWidth={selected?3:1.5}/>
              {selected && <><circle cx={x+8.5} cy={top-12} r="9" fill="#087f73"/><text x={x+8.5} y={top-8} textAnchor="middle" fill="white" fontSize="11">{i+1}</text></>}
            </g>
          })}
          <path d="M88 95 Q123 101 157 95 L156 115 Q125 133 89 115 Z" fill="#f5c4a2"/>
        </g>
        {tap && <path d="M45 65 L45 112 M36 102 L45 114 L54 102" fill="none" stroke="#087f73" strokeWidth="4"/>}
        {wave && <path d="M175 35 Q211 55 181 83 M181 70 L179 85 L194 83" fill="none" stroke="#087f73" strokeWidth="4"/>}
      </svg>
      <div style={{minWidth:0,flex:'1 1 150px',overflowWrap:'anywhere'}}>
        <div style={{fontSize:'0.7rem',color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'.06em'}}>Current kriyā · Beat {beatNo}</div>
        <div style={{fontFamily:'var(--font-display)',fontSize:'1.2rem',fontWeight:700,color:'var(--accent)',margin:'3px 0'}}>{KRIYA_LABELS[action]}</div>
        <div style={{fontSize:'0.78rem',color:'var(--text-muted)',lineHeight:1.4}}>{tap?'Bring the hand down gently to the thigh, then lift.':wave?'Lift the hand and turn the palm outward for the wave.':'Touch the highlighted finger with the other hand. Count little, ring, middle, index; repeat for longer laghus. The thumb is not counted.'}</div>
      </div>
    </div>
  )
}
