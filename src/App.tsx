import { lazy, Suspense, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { RotateCcw, Minus, Plus, Crosshair } from 'lucide-react';
import { COLORS, ISOTOPES, type Isotope, type ParticleKind } from './atom';

const AtomViewport = lazy(() => import('./AtomViewport'));
export function Skeleton() {
  return <div className="skeleton" role="status" aria-label="Loading 3D model"><div className="skeleton-orbit"/><span>Preparing the 3D model…</span></div>;
}
export function App() {
  const [isotope, setIsotope] = useState<Isotope>(28);
  const [selected, setSelected] = useState<ParticleKind | null>(null);
  const [command, setCommand] = useState({ type: 'reset', tick: 0 });
  const [ready, setReady] = useState(false);
  const reduceMotion = useReducedMotion();
  const act = (type: string) => { setCommand(c => ({ type, tick: c.tick + 1 })); if (type === 'reset') setSelected(null); };
  const choose = (next: Isotope) => { if (next !== isotope) { setIsotope(next); setSelected(null); } };
  return <main>
    <header className="page-header">
      <h1>Ranveer Singh <span className="title-dash">—</span> <span>Silicon 3D Model</span></h1>
      <p>Interactive 3D models of all naturally stable silicon isotopes.</p>
    </header>
    <nav className="isotope-nav" aria-label="Select a silicon isotope">
      <div className="isotope-track">
        <motion.div aria-hidden="true" className="active-indicator" data-testid="active-indicator" animate={{ x: ISOTOPES.indexOf(isotope) * 92 }} transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}/>
        {ISOTOPES.map(mass => <button key={mass} className={`isotope-button ${isotope === mass ? 'is-active' : ''}`} aria-pressed={isotope === mass} onClick={() => choose(mass)}><span>Si-{mass}</span></button>)}
      </div>
    </nav>
    <section className="model-section" aria-label={`Interactive Silicon-${isotope} atom`}>
      <div className="viewport-topline"><span className="element-mark"><strong>Si</strong><span>Silicon<span className="element-number">Atomic number 14</span></span></span><span className="shell-note">Electron shells <b>2 · 8 · 4</b></span></div>
      <div className="atom-viewport" tabIndex={0} role="group" aria-label="3D atom. Arrow keys rotate, plus and minus zoom, Escape resets the view." onKeyDown={e => {
        const actions: Record<string, string> = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', '+': 'in', '=': 'in', '-': 'out', Escape: 'reset' };
        if (actions[e.key]) { e.preventDefault(); act(actions[e.key]); }
      }}>
        <Suspense fallback={<Skeleton/>}><AtomViewport isotope={isotope} command={command} onSelection={setSelected} onReady={() => setReady(true)} /></Suspense>
        <div className="particle-label" role="status" aria-live="polite">{selected && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{duration:reduceMotion?0:.15}}><i style={{background:COLORS[selected]}}/>{selected}</motion.span>}</div>
      </div>
      <div className="viewport-bottomline"><p>Drag to rotate <span>·</span> Scroll or pinch to zoom <span>·</span> Select a particle</p><div className="view-controls">
        <button aria-label="Zoom out" title="Zoom out" disabled={!ready} onClick={() => act('out')}><Minus size={16}/></button>
        <button aria-label="Zoom in" title="Zoom in" disabled={!ready} onClick={() => act('in')}><Plus size={16}/></button>
        <button className="reset-button" aria-label="Reset view" disabled={!ready} onClick={() => act('reset')}><RotateCcw size={14}/><span>Reset view</span></button>
      </div></div>
    </section>
    <section className="isotope-info" aria-label="Selected isotope information" aria-live="polite">
      <div className="isotope-name"><span className="mass-notation"><sup>{isotope}</sup><sub>14</sub>Si</span><div><h2>Silicon-{isotope}</h2><p>Stable isotope <span>·</span> Mass number {isotope}</p></div></div>
      <dl><div><dt>Protons</dt><dd>14</dd></div><div><dt>Neutrons</dt><dd>{isotope-14}</dd></div><div><dt>Electrons</dt><dd>14</dd></div></dl>
    </section>
    <div className="particle-access"><Crosshair size={13} aria-hidden="true"/><span>Select by type:</span>{(['Proton','Neutron','Electron'] as const).map(kind=><button key={kind} aria-label={`Select ${kind==='Electron'?'an':'a'} ${kind.toLowerCase()}`} onClick={()=>act(`select-${kind}`)} disabled={!ready}>{kind}</button>)}</div>
    <ul className="legend" aria-label="Particle color legend">{(['Proton','Neutron','Electron'] as const).map((kind, i)=><li key={kind}><i style={{background:COLORS[kind]}}/>{kind} <span>({['+','0','−'][i]})</span></li>)}</ul>
    <p className="disclaimer">Simplified Bohr model — electron paths are illustrative.</p>
  </main>;
}
