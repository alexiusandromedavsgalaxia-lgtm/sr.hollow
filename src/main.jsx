import React,{useEffect,useMemo,useRef,useState} from 'react'
import {createRoot} from 'react-dom/client'
import {Canvas,useFrame,useThree} from '@react-three/fiber'
import {PointerLockControls,PerspectiveCamera,Text,Environment} from '@react-three/drei'
import * as THREE from 'three'
import './styles.css'

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v))

function Box({p=[0,0,0],s=[1,1,1],c='#4b4034',r=0,metal=0,rough=.8}) {
  return <mesh position={p} rotation={[0,r,0]} castShadow receiveShadow>
    <boxGeometry args={s}/><meshStandardMaterial color={c} metalness={metal} roughness={rough}/>
  </mesh>
}

function Door({p,open=false,label='DOOR'}) {
  return <group position={p}>
    <Box p={[0,1.35,0]} s={[1.05,2.7,.16]} c={open?'#28251f':'#171411'} r={0}/>
    {!open&&<mesh position={[.32,1.35,-.11]}><sphereGeometry args={[.055,12,12]}/><meshStandardMaterial color="#9b8a62" metalness={.8}/></mesh>}
    <Text position={[0,1.55,.1]} rotation={[0,Math.PI,0]} fontSize={.13} color="#b8a98c" anchorX="center">{label}</Text>
  </group>
}

function House(){
  const walls=[
    <Box key="a" p={[0,1.6,-7.5]} s={[15,3.2,.35]} c="#50483d"/>,
    <Box key="b" p={[-7.5,1.6,0]} s={[.35,3.2,15]} c="#50483d"/>,
    <Box key="c" p={[7.5,1.6,0]} s={[.35,3.2,15]} c="#50483d"/>,
    <Box key="d" p={[-4.8,1.6,7.5]} s={[5.4,3.2,.35]} c="#50483d"/>,
    <Box key="e" p={[4.8,1.6,7.5]} s={[5.4,3.2,.35]} c="#50483d"/>,
    <Box key="f" p={[0,3.15,0]} s={[15,.3,15]} c="#312d27"/>
  ]
  return <group>
    {walls}
    <Box p={[0,-.12,0]} s={[15,.25,15]} c="#29251f"/>
    <Box p={[-3.7,1.5,-1.2]} s={[.25,3,8]} c="#625648"/>
    <Box p={[3.7,1.5,-1.2]} s={[.25,3,8]} c="#625648"/>
    <Box p={[0,1.5,2.9]} s={[7.4,3,.25]} c="#625648"/>
    <Box p={[-5.2,1.5,4.7]} s={[4.4,3,.25]} c="#625648"/>
    <Door p={[0,0,7.3]} label="EXIT"/>
    <Door p={[-3.7,0,-4.5]} label="CELLAR"/>
    <Box p={[-5.8,1.5,-4.8]} s={[2.3,3,3]} c="#39342d"/>
    <Box p={[5.4,1.5,-4.7]} s={[3.8,3,3]} c="#39342d"/>
    <Box p={[5.6,.55,-1.5]} s={[2.2,.9,1.2]} c="#654a35"/>
    <Box p={[5.6,1.25,-1.5]} s={[2,.1,1]} c="#7c5b40"/>
    <Box p={[-5.4,.55,1.2]} s={[2.1,.9,1.1]} c="#654a35"/>
    <Box p={[-1.4,.65,-5.8]} s={[2.7,1.3,1]} c="#493d32"/>
    <Box p={[1.8,.5,5.2]} s={[3.2,1,1.1]} c="#493d32"/>
    <Box p={[4.9,.45,4.6]} s={[1.8,.9,1.8]} c="#42372e"/>
    <group position={[5.7,0,2.8]}>
      {Array.from({length:7},(_,i)=><Box key={i} p={[-i*.43,.32+i*.34,0]} s={[2.8,.55,1.9]} c="#55483b"/>)}
    </group>
    <Box p={[-5.9,.35,-.9]} s={[.8,.7,.8]} c="#222"/>
    <Box p={[2.9,.3,-1.3]} s={[.7,.6,.7]} c="#24201c"/>
    <Box p={[0,.35,5.7]} s={[.65,.7,.65]} c="#24201c"/>
    <Box p={[-2.2,.4,.9]} s={[1,.8,.6]} c="#312923"/>
  </group>
}

function Player({onMove,onLook}){
  const ref=useRef(),keys=useRef({}),{camera}=useThree()
  useEffect(()=>{
    const down=e=>{keys.current[e.code]=true}
    const up=e=>{keys.current[e.code]=false}
    addEventListener('keydown',down);addEventListener('keyup',up)
    return()=>{removeEventListener('keydown',down);removeEventListener('keyup',up)}
  },[])
  useFrame((_,dt)=>{
    const k=keys.current
    let x=(k.KeyD?1:0)-(k.KeyA?1:0),z=(k.KeyS?1:0)-(k.KeyW?1:0)
    const len=Math.hypot(x,z)||1
    if(x||z){
      const speed=2.7*dt
      const dir=new THREE.Vector3(x/len,0,z/len).applyQuaternion(camera.quaternion)
      dir.y=0;dir.normalize()
      const next=camera.position.clone().addScaledVector(dir,speed)
      next.x=clamp(next.x,-6.7,6.7);next.z=clamp(next.z,-6.7,6.7)
      camera.position.copy(next);onMove(next)
    }
  })
  return null
}

function Granny({player,active}){
  const ref=useRef(),last=useRef(0)
  useFrame((state,dt)=>{
    if(!active||!ref.current)return
    const pos=ref.current.position, dx=player.current.x-pos.x,dz=player.current.z-pos.z
    const d=Math.hypot(dx,dz)
    if(d<9&&d>.8){
      const step=1.15*dt
      pos.x+=dx/d*step;pos.z+=dz/d*step
      ref.current.rotation.y=Math.atan2(dx,dz)
    }
    last.current+=dt
  })
  return <group ref={ref} position={[-4,0,4]}>
    <Box p={[0,1.25,0]} s={[.75,2.1,.48]} c="#d5c9bd"/>
    <mesh position={[0,2.55,0]} castShadow><sphereGeometry args={[.43,20,20]}/><meshStandardMaterial color="#d8ccc0" roughness={.95}/></mesh>
    <Box p={[0,1.65,-.32]} s={[.88,.8,.12]} c="#8b1e22"/>
    <mesh position={[-.16,2.63,-.39]}><sphereGeometry args={[.035,8,8]}/><meshStandardMaterial color="#090606" emissive="#260000"/></mesh>
    <mesh position={[.16,2.63,-.39]}><sphereGeometry args={[.035,8,8]}/><meshStandardMaterial color="#090606" emissive="#260000"/></mesh>
  </group>
}

function Game(){
  const [started,setStarted]=useState(false),[lost,setLost]=useState(false),[won,setWon]=useState(false)
  const player=useRef(new THREE.Vector3(0,1.65,5.5))
  const [tick,setTick]=useState(0)
  useEffect(()=>{const id=setInterval(()=>setTick(t=>t+1),120);return()=>clearInterval(id)},[])
  useEffect(()=>{if(lost||won)return;const d=Math.hypot(player.current.x+4,player.current.z-4);if(d<1.05)setLost(true);if(player.current.z>6.8)setWon(true)},[tick,lost,won])
  const reset=()=>{player.current.set(0,1.65,5.5);setLost(false);setWon(false);setStarted(true)}
  return <div className="game">
    <Canvas shadows dpr={[1,1.7]} gl={{antialias:true}}>
      <PerspectiveCamera makeDefault position={[0,1.65,5.5]} fov={72}/>
      <color attach="background" args={['#080706']}/>
      <ambientLight intensity={.35}/>
      <directionalLight castShadow position={[-4,8,3]} intensity={1.5} shadow-mapSize={[2048,2048]}/>
      <pointLight position={[0,2,-1]} intensity={7} distance={7} color="#c9a875"/>
      <pointLight position={[5,2,5]} intensity={4} distance={5} color="#ffcc91"/>
      <House/>
      <Granny player={player} active={started&&!lost&&!won}/>
      <Player onMove={p=>player.current.copy(p)}/>
      <PointerLockControls onLock={()=>setStarted(true)}/>
      <Environment preset="warehouse"/>
    </Canvas>
    <div className="hud">
      <div className="brand">GRANNY <span>1.0 HOUSE</span></div>
      <div className="objective">FIND A WAY OUT</div>
      <div className="hint">WASD · mouse · click to lock</div>
    </div>
    {!started&&!lost&&!won&&<div className="overlay"><div className="panel"><div className="eyebrow">SR HOLLOW PRESENTS</div><h1>GRANNY</h1><p>Una recreación 3D jugable inspirada en la casa de la primera versión. Geometría original, iluminación dinámica y persecución en tiempo real.</p><button onClick={()=>setStarted(true)}>ENTRAR EN LA CASA</button></div></div>}
    {lost&&<div className="overlay"><div className="panel danger"><div className="eyebrow">CAUGHT</div><h1>TE ENCONTRÓ</h1><p>La casa sigue ahí. Tú decides si vuelves a entrar.</p><button onClick={reset}>REINTENTAR</button></div></div>}
    {won&&<div className="overlay"><div className="panel success"><div className="eyebrow">ESCAPED</div><h1>HAS SALIDO</h1><p>La puerta está abierta. Pero la noche no ha terminado.</p><button onClick={reset}>VOLVER A JUGAR</button></div></div>}
  </div>
}

function App(){return <Game/>}
createRoot(document.getElementById('root')).render(<App/>)
