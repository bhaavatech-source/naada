import React, { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import NadaTattva from './NadaTattva'
import SaptaSwaraExplorer from './SaptaSwaraExplorer'
import ShrutiExplorer from './ShrutiExplorer'
import RagaExplorer from './RagaExplorer'
import GitamPractice from './GitamPractice'
import RagaBhavaGame from './RagaBhavaGame'

type ModuleId = 'raga' | 'shruti' | 'tala' | 'gamaka' | 'builder' | 'progress'
type Feature = { id: ModuleId; title: string; Sanskrit: string; eyebrow: string; description: string; image: string; accent: string }

const FEATURES: Feature[] = [
  { id: 'raga', title: 'Rāga Practice', Sanskrit: 'Rāga Ratnākara', eyebrow: 'EXPLORE MELODIC WORLDS', description: '', image: '/images/nada-raga.webp', accent: '#087f73' },
  { id: 'shruti', title: 'Śruti Trainer', Sanskrit: 'Nāda Bindu', eyebrow: 'LISTEN · ALIGN · REFINE', description: '', image: '/images/nada-shruti.webp', accent: '#0b927e' },
  { id: 'tala', title: 'Tāla Trainer', Sanskrit: 'Laya Taranga', eyebrow: 'FEEL THE RHYTHM', description: '', image: '/images/nada-tala.webp', accent: '#b75d2a' },
  { id: 'gamaka', title: 'Gamaka Trainer', Sanskrit: 'Gamaka Sādhana', eyebrow: 'SHAPE EVERY NOTE', description: '', image: '/images/nada-gamaka.webp', accent: '#a36a18' },
  { id: 'builder', title: 'Music Builder', Sanskrit: 'Svara Rachanā', eyebrow: 'CREATE WITH SVARAS', description: '', image: '/images/nada-builder.webp', accent: '#a76c18' },
  { id: 'progress', title: 'My Progress', Sanskrit: 'Sādhana Darpaṇa', eyebrow: 'YOUR MUSICAL JOURNEY', description: '', image: '/images/nada-progress.webp', accent: '#178d84' },
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

type HomeProps = { wisdomOnly?: boolean }

export default function Home({ wisdomOnly = false }: HomeProps) {
  const setModule = useAppStore((s) => s.setModule)
  const [activeCard, setActiveCard] = useState<ModuleId | null>(null)
  const [wisdomView, setWisdomView] = useState<'tattva' | 'swaras' | 'shruti' | 'ragas' | 'gitam' | 'rasa' | null>(null)
  return <div className="nada-proposal-page">
    <style>{`
      .nada-proposal-page{--ink:#25213a;width:100%;min-width:0;min-height:0;height:100%;overflow-y:auto;overflow-x:hidden;color:var(--ink);background:linear-gradient(180deg,#f8f1e6,#f1e5d3);font-family:inherit;isolation:isolate}
      .nada-proposal-page *{box-sizing:border-box}.nada-proposal-inner{max-width:1500px;margin:0 auto;padding:16px clamp(10px,2vw,28px) 36px}
      .nada-proposal-hero{min-height:clamp(350px,39vw,490px);position:relative;display:grid;grid-template-columns:minmax(0,1fr);align-items:center;overflow:hidden;isolation:isolate;border-radius:26px;background:#e8d8bd;box-shadow:0 18px 45px #452e201f}
      .nada-proposal-hero:before{content:"";position:absolute;inset:0;z-index:-2;background-image:linear-gradient(90deg,#241e1a20,#fff8e41a 46%,#241e1a28),url('/images/nada-hero.webp');background-size:cover;background-position:center 54%;animation:nadaHeroBreath 22s ease-in-out infinite alternate}
      .nada-proposal-hero:after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(90deg,#1a231e10,#fff8e425 36%,#fff8e41c 63%,#1a231e20)}
      @keyframes nadaHeroBreath{from{transform:scale(1.02)}to{transform:scale(1.08)}}
      .nada-proposal-center{position:relative;display:grid;place-items:center;text-align:center;min-width:0;min-height:inherit;padding:24px 12px}.nada-proposal-mandala{position:absolute;width:min(82%,440px);height:auto;left:50%;top:50%;transform:translate(-50%,-50%);z-index:-1;filter:drop-shadow(0 0 20px #ffebabaa);animation:nadaMandalaTurn 100s linear infinite;pointer-events:none}@keyframes nadaMandalaTurn{to{rotate:360deg}}
      .nada-proposal-brand{font-family:var(--font-display,Georgia,serif);font-size:clamp(3.4rem,7vw,6.8rem);line-height:.98;letter-spacing:-.055em;font-weight:700;margin:0;color:#087d72;text-shadow:0 2px #ffffffcc,0 10px 28px #fff4c2bf}.nada-proposal-divider{display:flex;align-items:center;justify-content:center;gap:12px;margin:18px auto 8px;color:#b77c31}.nada-proposal-divider span{width:clamp(28px,4vw,62px);height:1px;background:currentColor}.nada-proposal-byline{margin:0;color:#175f59;font-size:.78rem;font-weight:800;letter-spacing:.25em;text-transform:uppercase}
      .nada-proposal-note{position:absolute;color:#fff4ce;font:clamp(1rem,1.8vw,1.6rem) Georgia,serif;text-shadow:0 2px 8px #4e2c09a6;animation:nadaNoteFloat 5s ease-in-out infinite}.nada-proposal-note.one{left:4%;top:42%}.nada-proposal-note.two{right:5%;top:32%;animation-delay:1.3s}.nada-proposal-note.three{right:15%;top:57%;animation-delay:2s}@keyframes nadaNoteFloat{0%,100%{transform:translateY(0);opacity:.8}50%{transform:translateY(-9px);opacity:1}}
      .nada-proposal-section-head{display:flex;align-items:end;justify-content:space-between;gap:16px;margin:28px 2px 14px}.nada-proposal-section-head h2{margin:0;font:700 clamp(1.35rem,2vw,1.8rem)/1.2 var(--font-display,Georgia,serif)}.nada-proposal-section-head p{margin:5px 0 0;color:#71675d;font-size:.9rem}
      .nada-proposal-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.nada-proposal-card{min-width:0;display:grid;grid-template-columns:42% 1fr;align-items:stretch;overflow:hidden;padding:0;text-align:left;border:1px solid #644b2d26;border-radius:20px;background:#fffdf8f2;box-shadow:0 8px 24px #4a311616;cursor:pointer;color:inherit;transition:transform .22s ease,box-shadow .22s ease,border-color .22s ease;animation:nadaCardIn .6s both}.nada-proposal-card:hover,.nada-proposal-card:focus-visible{transform:translateY(-4px);box-shadow:0 15px 30px #4a311626;border-color:var(--card-accent);outline:none}@keyframes nadaCardIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
      .nada-proposal-card img{width:100%;height:100%;min-height:150px;object-fit:cover;transition:transform .6s ease}.nada-proposal-card:hover img{transform:scale(1.06)}.nada-proposal-card-copy{padding:17px 16px;display:flex;flex-direction:column;justify-content:center;min-width:0}.nada-proposal-eyebrow{color:var(--card-accent);font-size:.61rem;font-weight:850;letter-spacing:.08em;line-height:1.4;margin-bottom:8px}.nada-proposal-card h3{margin:0;font:700 clamp(1rem,1.45vw,1.3rem)/1.2 var(--font-display,Georgia,serif)}.nada-proposal-sanskrit{color:var(--card-accent);font-size:.75rem;font-weight:750;margin:6px 0 0}.nada-proposal-card p{color:#70685f;font-size:.78rem;line-height:1.5;margin:9px 0 0}.nada-proposal-arrow{display:inline-grid;place-items:center;width:32px;height:32px;border-radius:50%;background:var(--card-accent);color:white;font-size:1.15rem;margin-top:12px;align-self:flex-start}
      .nada-proposal-bottom{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:18px;margin-top:22px}.nada-proposal-mantra{min-height:160px;display:flex;flex-direction:column;justify-content:center;padding:26px;border-radius:22px;color:#fdf4dc;background:linear-gradient(120deg,#14463de0,#0e675bbd),url('/images/nada-hero.webp') center/cover;box-shadow:0 12px 28px #28463721}.nada-proposal-mantra .small{text-transform:uppercase;font-size:.66rem;letter-spacing:.17em;opacity:.86;font-weight:800}.nada-proposal-mantra h2{font:700 clamp(1.4rem,2.2vw,2rem)/1.2 var(--font-display,Georgia,serif);margin:9px 0}.nada-proposal-mantra p{margin:0;font-size:.88rem;line-height:1.6;max-width:500px;color:#fff9e7e6}.nada-proposal-gallery{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.nada-proposal-gallery figure{margin:0;min-width:0;overflow:hidden;border-radius:16px;background:#eadcc4;position:relative}.nada-proposal-gallery img{width:100%;height:100%;min-height:160px;object-fit:cover;display:block;transition:transform .5s ease}.nada-proposal-gallery figure:hover img{transform:scale(1.07)}.nada-proposal-gallery figcaption{position:absolute;left:0;right:0;bottom:0;padding:22px 10px 10px;color:white;font-size:.72rem;font-weight:750;background:linear-gradient(transparent,#141414b8)}
      @media(max-width:1050px){.nada-proposal-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.nada-proposal-card h3{font-size:1.15rem}}
      @media(max-width:680px){.nada-proposal-inner{padding:10px 12px 26px}.nada-proposal-hero{min-height:clamp(280px,78vw,360px);border-radius:20px}.nada-proposal-center{padding:22px 12px}.nada-proposal-mandala{width:min(90%,350px)}.nada-proposal-brand{font-size:clamp(3.4rem,16vw,5.2rem)}.nada-proposal-note.one{left:6%;top:62%}.nada-proposal-note.two{right:8%;top:62%}.nada-proposal-note.three{right:20%;top:76%}.nada-proposal-grid{grid-template-columns:minmax(0,1fr);gap:12px}.nada-proposal-card{grid-template-columns:minmax(0,38%) minmax(0,1fr)}.nada-proposal-card img{min-height:145px}.nada-proposal-card-copy{padding:14px 13px;overflow-wrap:anywhere}.nada-proposal-card p{font-size:.8rem}.nada-proposal-arrow{width:36px;height:36px}.nada-proposal-bottom{grid-template-columns:minmax(0,1fr);gap:12px;margin-top:16px}.nada-proposal-mantra{padding:20px}.nada-proposal-gallery{gap:8px}.nada-proposal-gallery img{min-height:125px}}
      @media(max-width:360px){.nada-proposal-inner{padding-inline:10px}.nada-proposal-card{grid-template-columns:minmax(0,34%) minmax(0,1fr)}.nada-proposal-card-copy{padding:12px 10px}.nada-proposal-card h3{font-size:1.05rem}.nada-proposal-gallery{gap:6px}.nada-proposal-gallery figcaption{padding-inline:7px}}
      @media(prefers-reduced-motion:reduce){.nada-proposal-page *, .nada-proposal-page *:before,.nada-proposal-page *:after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}

      .nada-wisdom{margin-top:30px;padding:clamp(16px,3vw,28px);border-radius:24px;background:linear-gradient(130deg,#e5d5b7,#f7eedf 52%,#e6d4b3);border:1px solid #cdb993;box-shadow:0 12px 30px #4a311614}
      .nada-wisdom-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:18px}
      .nada-wisdom-kicker{font-size:.67rem;letter-spacing:.17em;text-transform:uppercase;font-weight:850;color:#986b29}
      .nada-wisdom-head h2{font:700 clamp(1.55rem,3vw,2.2rem)/1.1 var(--font-display,Georgia,serif);margin:7px 0}
      .nada-wisdom-head p{color:#6f695f;line-height:1.6;margin:0;max-width:660px;font-size:.9rem}
      .nada-wisdom-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
      .nada-wisdom-card{display:flex;flex-direction:column;align-items:flex-start;gap:8px;min-width:0;padding:18px;text-align:left;border:1px solid #c9b48e;border-radius:18px;background:#fffdf8;color:#28233a;cursor:pointer;box-shadow:0 6px 18px #4a311610;transition:transform .2s ease,box-shadow .2s ease}
      .nada-wisdom-card:hover,.nada-wisdom-card:focus-visible{transform:translateY(-3px);box-shadow:0 12px 24px #4a311621;outline:2px solid #0b8275;outline-offset:2px}
      .nada-wisdom-icon{display:grid;place-items:center;width:44px;height:44px;border-radius:14px;background:#e2eee7;color:#087f73;font-size:1.45rem}
      .nada-wisdom-card strong{font:700 1.05rem/1.25 var(--font-display,Georgia,serif)}
      .nada-wisdom-card span:last-child{font-size:.8rem;line-height:1.5;color:#71675d}
      .nada-wisdom-view{margin-top:16px;padding:clamp(12px,2vw,22px);border:1px solid #d3c19e;border-radius:18px;background:#fffdf8}
      .nada-wisdom-back{display:inline-flex;align-items:center;gap:8px;border:1px solid #b9a47f;border-radius:999px;padding:9px 14px;margin-bottom:14px;background:#f7efdf;color:#28233a;font-weight:700;cursor:pointer}
      .nada-wisdom-fullscreen{position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;overflow:auto;overscroll-behavior:contain;background:linear-gradient(180deg,#f8f1e6,#f1e5d3);color:#25213a}
      .nada-wisdom-nav{position:sticky;top:0;z-index:10000;display:flex;align-items:center;gap:10px;padding:12px clamp(12px,3vw,28px);background:#fffdf8f2;border-bottom:1px solid #d3c19e;box-shadow:0 4px 16px #4a311610;backdrop-filter:blur(12px)}
      .nada-wisdom-nav-title{flex:1;min-width:0;font:700 1.05rem Georgia,serif;color:#17675a}
      .nada-wisdom-nav-btn{border:1px solid #cbb996;border-radius:999px;padding:9px 14px;background:#f7efdf;color:#23483f;cursor:pointer;font:inherit;font-size:.9rem;font-weight:600;white-space:nowrap}
      .nada-wisdom-screen-content{width:100%;max-width:1200px;margin:0 auto;padding:clamp(12px,3vw,28px)}
      .nada-wisdom-screen-content .nada-learning-panel{border-radius:18px;overflow:hidden}
      @media(max-width:560px){.nada-wisdom-fullscreen{height:100dvh}.nada-wisdom-nav{position:sticky;top:0;gap:7px;padding:9px 10px}.nada-wisdom-nav-btn{padding:8px 10px;font-size:.78rem}.nada-wisdom-nav-title{font-size:.92rem;text-align:center}.nada-wisdom-screen-content{padding:10px}.nada-wisdom-screen-content .nada-learning-panel,.nada-wisdom-screen-content .nw-panel{border-radius:16px}}
      @media(max-width:900px){.nada-wisdom-cards{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:560px){.nada-wisdom{padding:14px;border-radius:18px}.nada-wisdom-head{align-items:flex-start;flex-direction:column}.nada-wisdom-cards{grid-template-columns:minmax(0,1fr);gap:10px}.nada-wisdom-card{padding:15px;display:grid;grid-template-columns:44px minmax(0,1fr);column-gap:12px;align-items:center}.nada-wisdom-icon{grid-row:span 2}.nada-wisdom-card strong,.nada-wisdom-card span:last-child{grid-column:2}.nada-wisdom-card span:last-child{margin-top:-5px}}

    `}</style>
    <div className="nada-proposal-inner">
      {!wisdomOnly && <>
        <section className="nada-proposal-hero" aria-label="Nāda classical music learning">
          <div className="nada-proposal-center"><SoundMandala/><span className="nada-proposal-note one" aria-hidden="true">Sa</span><span className="nada-proposal-note two" aria-hidden="true">Pa</span><span className="nada-proposal-note three" aria-hidden="true">Ni</span><div><h1 className="nada-proposal-brand">Nāda</h1><div className="nada-proposal-divider" aria-hidden="true"><span/>❀<span/></div><p className="nada-proposal-byline"></p></div></div>
        </section>
        <div className="nada-proposal-section-head"><div><h2>Explore Nāda</h2><p>Choose a space to listen, practise, and create.</p></div></div>
        <section className="nada-proposal-grid" aria-label="Nāda learning modules">
          {FEATURES.map((feature,index)=><button key={feature.id} type="button" className="nada-proposal-card" style={{'--card-accent':feature.accent,animationDelay:`${index*70}ms`} as React.CSSProperties} onClick={()=>setModule(feature.id)} onMouseEnter={()=>setActiveCard(feature.id)} onMouseLeave={()=>setActiveCard(null)} aria-label={`Open ${feature.title}`}>
            <img src={feature.image} alt="" loading={index<3?'eager':'lazy'}/><div className="nada-proposal-card-copy"><span className="nada-proposal-eyebrow">{feature.eyebrow}</span><h3>{feature.title}</h3><p className="nada-proposal-sanskrit">{feature.Sanskrit}</p><p>{feature.description}</p><span className="nada-proposal-arrow" aria-hidden="true">{activeCard===feature.id?'↗':'→'}</span></div>
          </button>)}
        </section>
      </>}

      <section className="nada-wisdom" aria-label="Nāda Wisdom interactive learning">
        <div className="nada-wisdom-head">
          <div>
            <span className="nada-wisdom-kicker">Listen · Explore · Discover</span>
            <h2>Nāda Wisdom</h2>
            <p>Explore the philosophy of sound, the seven swaras, śruti, rāga, gītam and the traditional relationships between music and rasa.</p>
          </div>
        </div>
        <div className="nada-wisdom-cards">
          <button type="button" className="nada-wisdom-card" onClick={() => setWisdomView('tattva')}><span className="nada-wisdom-icon" aria-hidden="true">◉</span><strong>Nāda Tattva</strong><span>Discover Āhata and Anāhata Nāda, sound sources and the five stages of sound.</span></button>
          <button type="button" className="nada-wisdom-card" onClick={() => setWisdomView('swaras')}><span className="nada-wisdom-icon" aria-hidden="true">♫</span><strong>Sapta Swara Explorer</strong><span>Explore Sa, Ri, Ga, Ma, Pa, Dha and Ni with traditional associations.</span></button>
          <button type="button" className="nada-wisdom-card" onClick={() => setWisdomView('shruti')}><span className="nada-wisdom-icon" aria-hidden="true">〰</span><strong>22 Śruti Explorer</strong><span>Explore pitch relationships and compare the 22 śrutis.</span></button>
          <button type="button" className="nada-wisdom-card" onClick={() => setWisdomView('ragas')}><span className="nada-wisdom-icon" aria-hidden="true">♬</span><strong>Rāga Explorer</strong><span>Explore rāga scales, classifications and characteristics.</span></button>
          <button type="button" className="nada-wisdom-card" onClick={() => setWisdomView('gitam')}><span className="nada-wisdom-icon" aria-hidden="true">𝄞</span><strong>Gītam Practice</strong><span>Explore compositions and practise through guided phrases.</span></button>
          <button type="button" className="nada-wisdom-card" onClick={() => setWisdomView('rasa')}><span className="nada-wisdom-icon" aria-hidden="true">✧</span><strong>Rāga · Bhāva · Rasa</strong><span>Take a matching challenge exploring musical expression.</span></button>
        </div>

      </section>

      {!wisdomOnly && <section className="nada-proposal-bottom" aria-label="Nāda musical inspiration"><div className="nada-proposal-mantra"><span className="small">Nāda </span><h2> Understand the variations of sounds and enjoy the ultimate bliss.</h2><p>A space for attentive listening, disciplined practice, and the living tradition of Carnatic music.</p></div><div className="nada-proposal-gallery" aria-label="Explore the tradition"><figure><img src="/images/nada-raga.webp" alt="Ornate vīṇā" loading="lazy"/><figcaption>Rāga</figcaption></figure><figure><img src="/images/nada-tala.webp" alt="Mṛdaṅgam" loading="lazy"/><figcaption>Tāla</figcaption></figure><figure><img src="/images/nada-gamaka.webp" alt="Bamboo flute" loading="lazy"/><figcaption>Gamaka</figcaption></figure></div></section>}
    </div>
    {wisdomView && <div className="nada-wisdom-fullscreen" role="dialog" aria-modal="true" aria-label="Nāda Wisdom learning experience">
      <nav className="nada-wisdom-nav" aria-label="Learning page navigation">
        <button type="button" className="nada-wisdom-nav-btn" onClick={() => setWisdomView(null)}>← Back</button>
        <div className="nada-wisdom-nav-title">Nāda Wisdom</div>
        <button type="button" className="nada-wisdom-nav-btn" onClick={() => { setWisdomView(null); if (wisdomOnly) setModule('home'); else document.querySelector('.nada-proposal-page')?.scrollTo({ top: 0, behavior: 'smooth' }) }}>⌂ Home</button>
      </nav>
      <div className="nada-wisdom-screen-content">
        {wisdomView === 'tattva' && <NadaTattva onClose={() => setWisdomView(null)} />}
        {wisdomView === 'swaras' && <SaptaSwaraExplorer onClose={() => setWisdomView(null)} />}
        {wisdomView === 'shruti' && <ShrutiExplorer onClose={() => setWisdomView(null)} />}
        {wisdomView === 'ragas' && <RagaExplorer onClose={() => setWisdomView(null)} />}
        {wisdomView === 'gitam' && <GitamPractice onClose={() => setWisdomView(null)} />}
        {wisdomView === 'rasa' && <RagaBhavaGame onClose={() => setWisdomView(null)} />}
      </div>
    </div>}
  </div>
}
