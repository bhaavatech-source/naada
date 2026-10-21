import React from 'react'
import { useAppStore } from '../store/useAppStore'

type ModuleId = 'raga' | 'shruti' | 'tala' | 'gamaka' | 'builder' | 'progress'
type Feature = { id: ModuleId; title: string; Sanskrit: string; eyebrow: string; description: string; image: string; accent: string }

const FEATURES: Feature[] = [
  { id: 'raga', title: 'Rāga Library', Sanskrit: 'Rāga Ratnākara', eyebrow: 'EXPLORE MELODIC WORLDS', description: 'Discover the 72 Melakarta rāgas and their janya relationships.', image: '/images/nada-raga.webp', accent: '#087f73' },
  { id: 'shruti', title: 'Śruti Trainer', Sanskrit: 'Nāda Bindu', eyebrow: 'LISTEN · ALIGN · REFINE', description: 'Develop pitch awareness and more precise śruti alignment.', image: '/images/nada-shruti.webp', accent: '#0b927e' },
  { id: 'tala', title: 'Tāla Trainer', Sanskrit: 'Laya Taranga', eyebrow: 'FEEL THE RHYTHM', description: 'Practise tāla cycles, jāti variations, and rhythmic patterns.', image: '/images/nada-tala.webp', accent: '#b75d2a' },
  { id: 'gamaka', title: 'Gamaka Trainer', Sanskrit: 'Gamaka Sādhana', eyebrow: 'SHAPE EVERY NOTE', description: 'Explore the expressive movements that give rāgas their character.', image: '/images/nada-gamaka.webp', accent: '#a36a18' },
  { id: 'builder', title: 'Music Builder', Sanskrit: 'Svara Rachanā', eyebrow: 'CREATE WITH SVARAS', description: 'Compose, arrange, and experiment with svara patterns.', image: '/images/nada-builder.webp', accent: '#a76c18' },
  { id: 'progress', title: 'My Progress', Sanskrit: 'Sādhana Darpaṇa', eyebrow: 'YOUR MUSICAL JOURNEY', description: 'Return to your practice and review your learning milestones.', image: '/images/nada-progress.webp', accent: '#178d84' },
]

function SoundMandala() {
  return <svg className="nada-proposal-mandala" viewBox="0 0 420 420" aria-hidden="true">
    <defs><radialGradient id="nadaGlow"><stop offset="0%" stopColor="#fff8d9" stopOpacity=".98"/><stop offset="65%" stopColor="#f6d58a" stopOpacity=".28"/><stop offset="100%" stopColor="#f6d58a" stopOpacity="0"/></radialGradient></defs>
    <circle cx="210" cy="210" r="200" fill="url(#nadaGlow)"/>
    {[176,148,118,84,50].map(r=><circle key={r} cx="210" cy="210" r={r} fill="none" stroke="#fff0bd" strokeWidth="1.1" opacity=".78"/>)}
    {Array.from({length:24},(_,i)=><ellipse key={i} cx="210" cy="91" rx="15" ry="37" fill="none" stroke="#fff0bd" strokeWidth="1.2" opacity=".72" transform={`rotate(${i*15} 210 210)`}/>)}
    <circle cx="210" cy="210" r="7" fill="#fff4c7"/>
  </svg>
}

export default function Home() {
  const setModule = useAppStore((s) => s.setModule)
  return <div className="nada-proposal-page">
    <style>{`
      .nada-proposal-page{--ink:#25213a;width:100%;min-width:0;min-height:100%;height:100%;overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;color:var(--ink);background:linear-gradient(180deg,#f8f1e6 0%,#f1e5d3 100%);font-family:inherit;isolation:isolate;-webkit-overflow-scrolling:touch}
      .nada-proposal-page *{box-sizing:border-box;min-width:0}
      .nada-proposal-inner{width:100%;max-width:1500px;margin:0 auto;padding:clamp(10px,2vw,24px) clamp(12px,2.2vw,30px) 36px}
      .nada-proposal-hero{min-height:clamp(300px,37vw,480px);position:relative;display:grid;place-items:center;overflow:hidden;isolation:isolate;border-radius:clamp(16px,2vw,26px);background:#e8d8bd;box-shadow:0 18px 45px #452e201f;text-align:center}
      .nada-proposal-hero:before{content:"";position:absolute;inset:0;z-index:-2;background-image:linear-gradient(180deg,#fff8e425 0%,#fff8e405 45%,#241e1a28 100%),url('/images/nada-hero.webp');background-size:cover;background-position:center 54%;transform:scale(1.01);animation:nadaHeroBreath 22s ease-in-out infinite alternate}
      .nada-proposal-hero:after{content:"";position:absolute;inset:0;z-index:-1;background:radial-gradient(ellipse at center, #fff8e445 0%,#fff8e40a 54%,#1a231e12 100%);pointer-events:none}
      @keyframes nadaHeroBreath{from{transform:scale(1.01)}to{transform:scale(1.055)}}
      .nada-proposal-center{position:relative;display:grid;place-items:center;text-align:center;width:100%;min-height:inherit;padding:28px 16px}
      .nada-proposal-center > div:last-child{position:relative;z-index:1}
      .nada-proposal-mandala{position:absolute;width:min(82%,440px);max-width:100%;height:auto;left:50%;top:50%;transform:translate(-50%,-50%);z-index:-1;filter:drop-shadow(0 0 20px #ffebabaa);animation:nadaMandalaTurn 100s linear infinite;pointer-events:none}
      @keyframes nadaMandalaTurn{to{rotate:360deg}}
      .nada-proposal-brand{font-family:var(--font-display,Georgia,serif);font-size:clamp(3.5rem,9vw,7rem);line-height:1;letter-spacing:-.055em;font-weight:700;margin:0;color:#087d72;text-shadow:0 2px #ffffffcc,0 10px 28px #fff4c2bf}
      .nada-proposal-divider{display:flex;align-items:center;justify-content:center;gap:12px;margin:16px auto 8px;color:#a66d25}.nada-proposal-divider span{width:clamp(28px,4vw,62px);height:1px;background:currentColor}
      .nada-proposal-byline{margin:0;color:#175f59;font-size:clamp(.68rem,1vw,.78rem);font-weight:800;letter-spacing:.22em;text-transform:uppercase}
      .nada-proposal-note{position:absolute;color:#fff4ce;font:clamp(1rem,1.8vw,1.6rem) Georgia,serif;text-shadow:0 2px 8px #4e2c09a6;animation:nadaNoteFloat 5s ease-in-out infinite;pointer-events:none}.nada-proposal-note.one{left:8%;top:35%}.nada-proposal-note.two{right:9%;top:28%;animation-delay:1.3s}.nada-proposal-note.three{right:16%;top:65%;animation-delay:2s}
      @keyframes nadaNoteFloat{0%,100%{transform:translateY(0);opacity:.8}50%{transform:translateY(-6px);opacity:1}}
      .nada-proposal-section-head{display:flex;align-items:end;justify-content:space-between;gap:16px;margin:clamp(22px,3vw,32px) 2px 14px}.nada-proposal-section-head h2{margin:0;font:700 clamp(1.45rem,2vw,1.9rem)/1.2 var(--font-display,Georgia,serif)}.nada-proposal-section-head p{margin:6px 0 0;color:#71675d;font-size:clamp(.85rem,1vw,.95rem);line-height:1.5}
      .nada-proposal-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
      .nada-proposal-card{min-width:0;min-height:170px;display:grid;grid-template-columns:minmax(110px,40%) minmax(0,1fr);align-items:stretch;overflow:hidden;padding:0;text-align:left;border:1px solid #644b2d26;border-radius:20px;background:#fffdf8f5;box-shadow:0 8px 24px #4a311616;cursor:pointer;color:inherit;transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease;appearance:none;-webkit-appearance:none;touch-action:manipulation}
      .nada-proposal-card:hover{box-shadow:0 12px 26px #4a311621;border-color:var(--card-accent)}.nada-proposal-card:focus-visible{outline:3px solid var(--card-accent);outline-offset:3px}
      .nada-proposal-card img{display:block;width:100%;height:100%;min-height:170px;object-fit:cover;background:#eadcc4}
      .nada-proposal-card-copy{padding:16px;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;min-width:0;overflow-wrap:anywhere}
      .nada-proposal-eyebrow{color:var(--card-accent);font-size:.64rem;font-weight:850;letter-spacing:.07em;line-height:1.45;margin-bottom:7px}
      .nada-proposal-card h3{margin:0;font:700 clamp(1rem,1.35vw,1.28rem)/1.25 var(--font-display,Georgia,serif);overflow-wrap:normal}
      .nada-proposal-sanskrit{color:var(--card-accent);font-size:.78rem;font-weight:750;margin:6px 0 0;line-height:1.4}
      .nada-proposal-card p:not(.nada-proposal-sanskrit){color:#70685f;font-size:.83rem;line-height:1.5;margin:9px 0 0}
      .nada-proposal-arrow{display:inline-grid;place-items:center;width:36px;height:36px;flex:0 0 36px;border-radius:50%;background:var(--card-accent);color:white;font-size:1.2rem;margin-top:12px;align-self:flex-start}
      .nada-proposal-bottom{display:grid;grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr);gap:18px;margin-top:22px}
      .nada-proposal-mantra{min-width:0;min-height:180px;display:flex;flex-direction:column;justify-content:center;padding:clamp(20px,2.5vw,30px);border-radius:22px;color:#fdf4dc;background:linear-gradient(120deg,#14463de8,#0e675bc2),url('/images/nada-hero.webp') center/cover;box-shadow:0 12px 28px #28463721}
      .nada-proposal-mantra .small{text-transform:uppercase;font-size:.68rem;letter-spacing:.17em;opacity:.9;font-weight:800}.nada-proposal-mantra h2{font:700 clamp(1.4rem,2.2vw,2rem)/1.2 var(--font-display,Georgia,serif);margin:9px 0}.nada-proposal-mantra p{margin:0;font-size:.9rem;line-height:1.6;max-width:500px;color:#fff9e7e6}
      .nada-proposal-gallery{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;min-width:0}.nada-proposal-gallery figure{margin:0;min-width:0;min-height:150px;overflow:hidden;border-radius:16px;background:#eadcc4;position:relative}.nada-proposal-gallery img{width:100%;height:100%;min-height:150px;object-fit:cover;display:block}.nada-proposal-gallery figcaption{position:absolute;left:0;right:0;bottom:0;padding:22px 10px 10px;color:white;font-size:.75rem;font-weight:750;background:linear-gradient(transparent,#141414b8)}
      @media(max-width:1050px){.nada-proposal-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.nada-proposal-card{grid-template-columns:minmax(100px,38%) minmax(0,1fr)}.nada-proposal-card-copy{padding:14px}}
      @media(max-width:680px){.nada-proposal-inner{padding:10px 12px 24px}.nada-proposal-hero{min-height:clamp(290px,78vw,380px);border-radius:18px}.nada-proposal-center{padding:24px 12px}.nada-proposal-brand{font-size:clamp(3.25rem,17vw,5.1rem)}.nada-proposal-mandala{width:min(92%,350px)}.nada-proposal-note.one{left:7%;top:31%}.nada-proposal-note.two{right:7%;top:27%}.nada-proposal-note.three{right:13%;top:69%}.nada-proposal-section-head{margin:22px 2px 12px}.nada-proposal-grid{grid-template-columns:1fr;gap:12px}.nada-proposal-card{grid-template-columns:38% minmax(0,1fr);min-height:145px;border-radius:16px}.nada-proposal-card img{min-height:145px}.nada-proposal-card-copy{padding:12px 13px}.nada-proposal-eyebrow{font-size:.59rem;margin-bottom:5px}.nada-proposal-card h3{font-size:1.05rem}.nada-proposal-sanskrit{font-size:.72rem}.nada-proposal-card p:not(.nada-proposal-sanskrit){font-size:.78rem;line-height:1.45;margin-top:7px}.nada-proposal-arrow{width:34px;height:34px;flex-basis:34px;margin-top:10px}.nada-proposal-bottom{grid-template-columns:1fr;gap:12px;margin-top:16px}.nada-proposal-mantra{min-height:155px;padding:20px;border-radius:18px}.nada-proposal-gallery{gap:8px}.nada-proposal-gallery figure,.nada-proposal-gallery img{min-height:112px}.nada-proposal-gallery figcaption{font-size:.68rem;padding:18px 7px 7px}}
      @media(max-width:360px){.nada-proposal-inner{padding-inline:9px}.nada-proposal-hero{min-height:280px}.nada-proposal-card{grid-template-columns:34% minmax(0,1fr);min-height:140px}.nada-proposal-card img{min-height:140px}.nada-proposal-card-copy{padding:10px}.nada-proposal-eyebrow{font-size:.55rem;letter-spacing:.04em}.nada-proposal-card h3{font-size:1rem}.nada-proposal-card p:not(.nada-proposal-sanskrit){font-size:.75rem}.nada-proposal-gallery{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}}
      @media(prefers-reduced-motion:reduce){.nada-proposal-page *, .nada-proposal-page *:before,.nada-proposal-page *:after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}
    `}</style>
    <div className="nada-proposal-inner">
      <section className="nada-proposal-hero" aria-label="Nāda classical music learning">
        <div className="nada-proposal-center"><SoundMandala/><span className="nada-proposal-note one" aria-hidden="true">Sa</span><span className="nada-proposal-note two" aria-hidden="true">Pa</span><span className="nada-proposal-note three" aria-hidden="true">Ni</span><div><h1 className="nada-proposal-brand">Nāda</h1><div className="nada-proposal-divider" aria-hidden="true"><span/>❀<span/></div><p className="nada-proposal-byline">By Bhāva Tech</p></div></div>
      </section>
      <div className="nada-proposal-section-head"><div><h2>Explore Nāda</h2><p>Choose a space to listen, practise, and create.</p></div></div>
      <section className="nada-proposal-grid" aria-label="Nāda learning modules">
        {FEATURES.map((feature,index)=><button key={feature.id} type="button" className="nada-proposal-card" style={{'--card-accent':feature.accent,animationDelay:`${index*70}ms`} as React.CSSProperties} onClick={()=>setModule(feature.id)} aria-label={`Open ${feature.title}`}>
          <img src={feature.image} alt="" loading={index<3?'eager':'lazy'}/><div className="nada-proposal-card-copy"><span className="nada-proposal-eyebrow">{feature.eyebrow}</span><h3>{feature.title}</h3><p className="nada-proposal-sanskrit">{feature.Sanskrit}</p><p>{feature.description}</p><span className="nada-proposal-arrow" aria-hidden="true">→</span></div>
        </button>)}
      </section>
      <section className="nada-proposal-bottom" aria-label="Nāda musical inspiration"><div className="nada-proposal-mantra"><span className="small">Nāda Brahman</span><h2>Where sound becomes understanding.</h2><p>A space for attentive listening, disciplined practice, and the living tradition of Carnatic music.</p></div><div className="nada-proposal-gallery" aria-label="Explore the tradition"><figure><img src="/images/nada-raga.webp" alt="Ornate vīṇā" loading="lazy"/><figcaption>Rāga</figcaption></figure><figure><img src="/images/nada-tala.webp" alt="Mṛdaṅgam" loading="lazy"/><figcaption>Tāla</figcaption></figure><figure><img src="/images/nada-gamaka.webp" alt="Bamboo flute" loading="lazy"/><figcaption>Gamaka</figcaption></figure></div></section>
    </div>
  </div>
}
