import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useThree, addAfterEffect, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Line, Html } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import * as THREE from 'three';
import { COLORS, makeParticles, RADII, SHELL_TILTS, type Isotope, type Particle, type ParticleKind, type Position } from './atom';
import { Skeleton } from './App';
gsap.registerPlugin(useGSAP);

interface Props { isotope: Isotope; command: {type:string; tick:number}; onSelection: (kind:ParticleKind|null)=>void; onReady:()=>void }
interface Selection { id:string; kind:ParticleKind; position:Position }

function Fallback() { return <div className="webgl-fallback" role="alert"><strong>3D rendering is unavailable.</strong><p>Enable hardware acceleration or try a WebGL-enabled browser. You can still explore each isotope’s particle counts below.</p></div>; }
class SceneBoundary extends Component<{children:ReactNode}, {failed:boolean}> {
  state = { failed:false };
  static getDerivedStateFromError() { return {failed:true}; }
  render() { return this.state.failed ? <Fallback/> : this.props.children; }
}

function Scene({isotope,command,onSelection,onReady}:Props) {
  const controls = useRef<OrbitControlsImpl>(null);
  const [displayed, setDisplayed] = useState(isotope);
  const [selection, setSelection] = useState<Selection|null>(null);
  const [hoverLabel, setHoverLabel] = useState<Selection|null>(null);
  const hovered = useRef<Selection|null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  const interacting = useRef(false);
  const { camera, invalidate, gl, size } = useThree();
  const reduceMotion = useReducedMotion();
  const particles = useMemo(()=>makeParticles(displayed),[displayed]);
  const geometry = useMemo(()=>new THREE.SphereGeometry(1,24,18),[]);
  const materials = useMemo(()=>Object.fromEntries(Object.entries(COLORS).map(([kind,color])=>[kind,new THREE.MeshPhysicalMaterial({color,roughness:.29,metalness:.14,clearcoat:.65,clearcoatRoughness:.22,emissive:color,emissiveIntensity:kind==='Electron'?.18:.025,transparent:true})])) as Record<ParticleKind,THREE.MeshPhysicalMaterial>,[]);
  const highlight = useMemo(()=>Object.fromEntries(Object.entries(COLORS).map(([kind,color])=>[kind,new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.45,roughness:.25,transparent:true})])) as Record<ParticleKind,THREE.MeshStandardMaterial>,[]);
  const fading = useMemo(()=>[...Object.values(materials),...Object.values(highlight)],[materials,highlight]);
  const rings = useMemo(()=>RADII.map((r,shell)=>Array.from({length:129},(_,i):Position=>{
    const angle=i/128*Math.PI*2, tilt=SHELL_TILTS[shell];
    return [Math.cos(angle)*r,Math.sin(angle)*r*Math.cos(tilt),Math.sin(angle)*r*Math.sin(tilt)];
  })),[]);
  const cameraAnimation = useRef<gsap.core.Timeline|null>(null);
  const baseDistance = Math.max(7.4, 6.25/(size.width/size.height));
  function clearHover(forget=false) {
    if(hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current=null;setHoverLabel(null);
    if(forget) {hovered.current=null;gl.domElement.style.cursor='grab';}
  }
  function scheduleHover() {
    clearHover();
    const candidate=hovered.current;
    const c=controls.current;
    if(!candidate||!c||interacting.current||camera.position.distanceTo(c.target)>baseDistance*.8) return;
    hoverTimer.current=setTimeout(()=>{
      hoverTimer.current=null;
      if(hovered.current?.id===candidate.id&&!interacting.current&&controls.current&&camera.position.distanceTo(controls.current.target)<=baseDistance*.8){setHoverLabel(candidate);invalidate();}
    },600);
  }
  function move(position:THREE.Vector3,target:THREE.Vector3,duration=.45) {
    if (!controls.current) return;
    clearHover(true);
    cameraAnimation.current?.kill();
    cameraAnimation.current=gsap.timeline({defaults:{duration:reduceMotion?0:duration,ease:'power3.out'},onUpdate:()=>{controls.current?.update();invalidate();}})
      .to(camera.position,{x:position.x,y:position.y,z:position.z},0)
      .to(controls.current.target,{x:target.x,y:target.y,z:target.z},0);
    invalidate();
  }
  function reset() { setSelection(null);onSelection(null);move(new THREE.Vector3(0,.5,baseDistance),new THREE.Vector3()); }
  function select(p:Particle,position:Position=p.position) {
    setSelection({id:p.id,kind:p.kind,position});onSelection(p.kind);
    const target=new THREE.Vector3(...position);
    const direction=camera.position.clone().sub(controls.current?.target??new THREE.Vector3()).normalize();
    move(target.clone().addScaledVector(direction,3.3),target);
  }
  useEffect(()=>{camera.position.set(0,.5,baseDistance);controls.current?.target.set(0,0,0);controls.current?.update();invalidate();},[baseDistance]);
  useEffect(()=>{onReady();return ()=>{cameraAnimation.current?.kill();if(hoverTimer.current)clearTimeout(hoverTimer.current);};},[]);
  useEffect(()=>{
    // Blender's Ctrl + middle-drag dolly; Shift + middle-drag is
    // handled by OrbitControls' modifier-aware ROTATE mapping.
    const middleMode=(event:PointerEvent)=>{
      if(event.button===1&&controls.current)controls.current.mouseButtons.MIDDLE=event.ctrlKey||event.metaKey?THREE.MOUSE.DOLLY:THREE.MOUSE.ROTATE;
    };
    gl.domElement.addEventListener('pointerdown',middleMode,true);
    return ()=>gl.domElement.removeEventListener('pointerdown',middleMode,true);
  },[gl]);
  useEffect(()=>()=>{geometry.dispose();fading.forEach(m=>m.dispose());},[geometry,fading]);
  useGSAP(()=>{
    clearHover(true);
    if(selection) reset();
    setSelection(null);onSelection(null);
    const timeline=gsap.timeline({onUpdate:invalidate});
    timeline.to(fading,{opacity:0,duration:reduceMotion?0:.11,onComplete:()=>setDisplayed(isotope)})
      .to(fading,{opacity:1,duration:reduceMotion?0:.15});
  },{dependencies:[isotope,reduceMotion],revertOnUpdate:true});
  useEffect(()=>{
    if (!command.tick) return;
    const c=controls.current;if(!c)return;
    if(command.type==='reset'){reset();return;}
    if(command.type.startsWith('select-')) {const p=particles.find(p=>p.kind===command.type.slice(7));if(p)select(p);return;}
    const offset=camera.position.clone().sub(c.target);
    if(command.type==='in'||command.type==='out') offset.multiplyScalar(command.type==='in'?.8:1.25).clampLength(1.2,14);
    else {const spherical=new THREE.Spherical().setFromVector3(offset);spherical.theta+=command.type==='left'?.18:command.type==='right'?-.18:0;spherical.phi+=command.type==='up'?-.18:command.type==='down'?.18:0;spherical.makeSafe();offset.setFromSpherical(spherical);}
    move(c.target.clone().add(offset),c.target.clone(),.22);
  },[command]);
  useEffect(()=>{
    // Read-only diagnostic snapshot used by browser QA; no network or user data.
    const record=()=>{
      const c=controls.current;
      const projected=particles.map(p=>{const v=new THREE.Vector3(...p.position).applyEuler(new THREE.Euler(.18,-.18,-.12)).project(camera);return {id:p.id,kind:p.kind,x:(v.x+1)*size.width/2,y:(1-v.y)*size.height/2,z:v.z};});
      gl.domElement.dataset.scene=JSON.stringify({isotope:displayed,counts:{Proton:particles.filter(p=>p.kind==='Proton').length,Neutron:particles.filter(p=>p.kind==='Neutron').length,Electron:particles.filter(p=>p.kind==='Electron').length},shells:[2,8,4],selection:selection?.kind??null,hover:hoverLabel?.kind??null,camera:camera.position.toArray(),target:c?.target.toArray(),triangles:gl.info.render.triangles,drawCalls:gl.info.render.calls,opacity:materials.Proton.opacity,projected});
    };
    record();return addAfterEffect(record);
  },[displayed,particles,selection,hoverLabel,camera,gl,size]);
  const click=(e:ThreeEvent<MouseEvent>,p:Particle)=>{if(e.button!==0||e.delta>5)return;e.stopPropagation();const point=e.object.getWorldPosition(new THREE.Vector3());select(p,point.toArray() as Position);};
  const hover=(e:ThreeEvent<PointerEvent>,p:Particle)=>{
    if(e.pointerType==='touch'||interacting.current)return;
    e.stopPropagation();gl.domElement.style.cursor='pointer';
    if(hovered.current?.id===p.id)return;
    hovered.current={id:p.id,kind:p.kind,position:e.object.getWorldPosition(new THREE.Vector3()).toArray() as Position};scheduleHover();
  };
  return <>
    <ambientLight intensity={.45}/><hemisphereLight args={['#BFD9FF','#252039',.8]}/>
    <directionalLight position={[3,5,7]} intensity={3}/><directionalLight position={[-4,-2,2]} color="#A9BCFF" intensity={.85}/><directionalLight position={[-2,3,-4]} color="#69B7FF" intensity={2}/>
    <group rotation={[.18,-.18,-.12]}>
      {rings.map((points,i)=><group key={i}><Line points={points} color={['#8A85B8','#6B94B2','#5A8CA6'][i]} lineWidth={.8} transparent opacity={.5}/><Line points={points.slice(12+i*25,28+i*25)} color="#9DBBD9" lineWidth={1.2} transparent opacity={.65}/></group>)}
      {particles.map(p=><mesh key={p.id} name={p.id} geometry={geometry} material={selection?.id===p.id||hoverLabel?.id===p.id?highlight[p.kind]:materials[p.kind]} position={p.position} scale={(p.kind==='Electron'?.085:.143)*(selection?.id===p.id?1.24:1)} onClick={e=>click(e,p)} onPointerOver={e=>hover(e,p)} onPointerMove={e=>hover(e,p)} onPointerOut={()=>{clearHover(true);}} dispose={null}/>)}
    </group>
    {hoverLabel&&<Html center position={[hoverLabel.position[0],hoverLabel.position[1]+.27,hoverLabel.position[2]]} zIndexRange={[5,0]} style={{pointerEvents:'none'}}><div className="hover-particle-label" role="tooltip"><i style={{background:COLORS[hoverLabel.kind]}}/>{hoverLabel.kind}</div></Html>}
    <OrbitControls ref={controls} makeDefault enablePan screenSpacePanning mouseButtons={{LEFT:THREE.MOUSE.ROTATE,MIDDLE:THREE.MOUSE.ROTATE,RIGHT:THREE.MOUSE.PAN}} enableDamping dampingFactor={.12} minDistance={1.2} maxDistance={14} rotateSpeed={.65} panSpeed={.7} zoomSpeed={.8} onStart={()=>{interacting.current=true;cameraAnimation.current?.kill();clearHover(true);}} onEnd={()=>{interacting.current=false;}} onChange={()=>{if(hoverLabel||hoverTimer.current)clearHover(true);invalidate();}}/>
  </>;
}
export default function AtomViewport(props:Props) {
  const [ready,setReady]=useState(false);
  const reduceMotion=useReducedMotion();
  return <SceneBoundary><Canvas frameloop="demand" dpr={[1,1.5]} camera={{position:[0,.5,8.3],fov:43,near:.05,far:60}} gl={{antialias:true,alpha:true,powerPreference:'low-power'}} fallback={<Fallback/>} onCreated={({gl})=>{gl.setClearColor('#080B18',0);gl.domElement.setAttribute('aria-label','Interactive 3D silicon atom');gl.domElement.setAttribute('role','img');}}><Scene {...props} onReady={()=>{setReady(true);props.onReady();}}/></Canvas><AnimatePresence>{!ready&&<motion.div key="loader" className="loading-overlay" initial={{opacity:1}} exit={{opacity:0}} transition={{duration:reduceMotion?0:.18}}><Skeleton/></motion.div>}</AnimatePresence></SceneBoundary>;
}

