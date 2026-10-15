import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useThree, addAfterEffect, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import * as THREE from 'three';
import { COLORS, makeParticles, RADII, type Isotope, type Particle, type ParticleKind, type Position } from './atom';
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
  const { camera, invalidate, gl, size } = useThree();
  const reduceMotion = useReducedMotion();
  const particles = useMemo(()=>makeParticles(displayed),[displayed]);
  const geometry = useMemo(()=>new THREE.SphereGeometry(1,20,14),[]);
  const materials = useMemo(()=>Object.fromEntries(Object.entries(COLORS).map(([kind,color])=>[kind,new THREE.MeshStandardMaterial({color,roughness:.38,metalness:.05,transparent:true})])) as Record<ParticleKind,THREE.MeshStandardMaterial>,[]);
  const highlight = useMemo(()=>Object.fromEntries(Object.entries(COLORS).map(([kind,color])=>[kind,new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.45,roughness:.25,transparent:true})])) as Record<ParticleKind,THREE.MeshStandardMaterial>,[]);
  const fading = useMemo(()=>[...Object.values(materials),...Object.values(highlight)],[materials,highlight]);
  const rings = useMemo(()=>RADII.map((r,shell)=>Array.from({length:129},(_,i):Position=>{
    const angle=i/128*Math.PI*2, tilt=[.12,-.22,.16][shell];
    return [Math.cos(angle)*r,Math.sin(angle)*r*Math.cos(tilt),Math.sin(angle)*r*Math.sin(tilt)];
  })),[]);
  const cameraAnimation = useRef<gsap.core.Timeline|null>(null);
  const baseDistance = Math.max(8.3, 6.25/(size.width/size.height));
  function move(position:THREE.Vector3,target:THREE.Vector3,duration=.45) {
    if (!controls.current) return;
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
  useEffect(()=>{onReady();return ()=>{cameraAnimation.current?.kill();};},[]);
  useEffect(()=>()=>{geometry.dispose();fading.forEach(m=>m.dispose());},[geometry,fading]);
  useGSAP(()=>{
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
      gl.domElement.dataset.scene=JSON.stringify({isotope:displayed,counts:{Proton:particles.filter(p=>p.kind==='Proton').length,Neutron:particles.filter(p=>p.kind==='Neutron').length,Electron:particles.filter(p=>p.kind==='Electron').length},shells:[2,8,4],selection:selection?.kind??null,camera:camera.position.toArray(),target:c?.target.toArray(),triangles:gl.info.render.triangles,drawCalls:gl.info.render.calls,opacity:materials.Proton.opacity,projected});
    };
    record();return addAfterEffect(record);
  },[displayed,particles,selection,camera,gl,size]);
  const click=(e:ThreeEvent<MouseEvent>,p:Particle)=>{if(e.delta>5)return;e.stopPropagation();const point=e.object.getWorldPosition(new THREE.Vector3());select(p,point.toArray() as Position);};
  return <>
    <ambientLight intensity={1.25}/><directionalLight position={[3,5,7]} intensity={2.5}/><directionalLight position={[-4,-2,2]} intensity={.8}/>
    <group rotation={[.18,-.18,-.12]}>
      {rings.map((points,i)=><Line key={i} points={points} color="#53667D" lineWidth={1} transparent opacity={.64}/>)}
      {particles.map(p=><mesh key={p.id} name={p.id} geometry={geometry} material={selection?.id===p.id?highlight[p.kind]:materials[p.kind]} position={p.position} scale={(p.kind==='Electron'?.085:.143)*(selection?.id===p.id?1.24:1)} onClick={e=>click(e,p)} onPointerOver={e=>{e.stopPropagation();gl.domElement.style.cursor='pointer';}} onPointerOut={()=>{gl.domElement.style.cursor='grab';}} dispose={null}/>)}
    </group>
    <OrbitControls ref={controls} makeDefault enablePan={false} enableDamping dampingFactor={.09} minDistance={1.2} maxDistance={14} rotateSpeed={.7} zoomSpeed={.75} onStart={()=>cameraAnimation.current?.kill()} onChange={()=>invalidate()}/>
  </>;
}
export default function AtomViewport(props:Props) {
  const [ready,setReady]=useState(false);
  const reduceMotion=useReducedMotion();
  return <SceneBoundary><Canvas frameloop="demand" dpr={[1,1.5]} camera={{position:[0,.5,8.3],fov:43,near:.05,far:60}} gl={{antialias:true,alpha:true,powerPreference:'low-power'}} fallback={<Fallback/>} onCreated={({gl})=>{gl.setClearColor('#080B18',0);gl.domElement.setAttribute('aria-label','Interactive 3D silicon atom');gl.domElement.setAttribute('role','img');}}><Scene {...props} onReady={()=>{setReady(true);props.onReady();}}/></Canvas><AnimatePresence>{!ready&&<motion.div key="loader" className="loading-overlay" initial={{opacity:1}} exit={{opacity:0}} transition={{duration:reduceMotion?0:.18}}><Skeleton/></motion.div>}</AnimatePresence></SceneBoundary>;
}

