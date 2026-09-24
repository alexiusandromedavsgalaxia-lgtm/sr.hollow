import React,{useEffect,useMemo,useRef,useState} from 'react'
import {createRoot} from 'react-dom/client'
import {Canvas,useFrame,useThree} from '@react-three/fiber'
import {PerspectiveCamera} from '@react-three/drei'
import * as THREE from 'three'
import './styles.css'

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v))
const START=[0,1.62,5.6]
const WALLS=[
  [-8.7,0,.32,15.8],[8.7,0,.32,15.8],[0,-7.9,17.1,.32],
  [-6.0,-7.9,.32,4.0],[2.7,-7.9,.32,3.0],[6.8,-7.9,.32,4.0],
  [-8.7,3.7,5.0,.32],[-5.9,1.2,5.7,.32],[-8.7,-1.7,5.0,.32],
  [-2.2,1.2,.32,5.8],[2.2,1.2,.32,5.8],[6.0,1.2,5.7,.32],
  [-2.2,-1.7,.32,3.4],[2.2,-1.7,.32,3.4],
  [-5.9,5.0,5.7,.32],[2.2,5.0,8.0,.32],
  [-6.0,-5.2,5.6,.32],[2.4,-5.2,4.8,.32],[6.2,-5.2,4.8,.32],
  [-3.9,-6.55,.32,2.8],[4.2,-6.55,.32,2.6]
]
const SPOTS=[
  [-6.7,1.05,-6.3],[-4.7,1.05,-5.7],[-2.8,1.05,-6.7],[1.3,1.05,-6.4],
  [4.8,1.05,-6.3],[6.8,1.05,-5.0],[-7.0,1.05,-2.4],[-4.8,1.05,-2.2],
  [4.8,1.05,-2.1],[6.8,1.05,-.8],[-6.8,1.05,3.0],[-4.6,1.05,3.8],
  [3.8,1.05,2.9],[6.7,1.05,3.7],[-2.0,1.05,5.8],[2.2,1.05,5.9]
]
const ITEM_NAMES={
  hammer:'HAMMER',pliers:'CUTTING PLIERS',padlockKey:'PADLOCK KEY',code:'PADLOCK CODE',
  battery:'BATTERY',masterKey:'MASTER KEY',screwdriver:'SCREWDRIVER',safeKey:'SAFE KEY',
  winch:'WINCH HANDLE',melon:'MELON',playhouseKey:'PLAYHOUSE KEY',cogA:'COG WHEEL',
  cogB:'COG WHEEL',carKey:'CAR KEY',carBattery:'CAR BATTERY',engine:'ENGINE PART',
  gasoline:'GASOLINE CAN',spark:'SPARK PLUG',wrench:'WRENCH',rustyKey:'RUSTY KEY',
  chainCutter:'CHAIN CUTTER',stick:'WOODEN STICK',wheelCrank:'WHEEL CRANK',book:'BOOK'
}
const STARTING_ITEMS=['hammer','pliers','padlockKey','code','battery','masterKey','screwdriver','safeKey','winch','melon','playhouseKey','cogA','cogB','carKey','carBattery','engine','gasoline','spark','wrench','rustyKey','chainCutter','stick','wheelCrank','book']
const REWARD_POOL=['hammer','pliers','padlockKey','code','battery','masterKey','screwdriver','safeKey','carKey','carBattery','engine','gasoline','spark','wrench','rustyKey','chainCutter','stick','wheelCrank']

function Box({p=[0,0,0],s=[1,1,1],c='#51483e',r=0,metal=0}){
  return <mesh position={p} rotation={[0,r,0]} castShadow receiveShadow><boxGeometry args={s}/><meshStandardMaterial color={c} roughness={.82} metalness={metal}/></mesh>
}
function Wall({x,z,sx,sz}){return <Box p={[x,1.55,z]} s={[sx,3.1,sz]} c="#5a5149"/>}
function Window({p,rot=0,w=1.5}){
  return <group position={p} rotation={[0,rot,0]}><Box p={[0,0,0]} s={[w,1.15,.08]} c="#263441"/><Box p={[0,0,.06]} s={[.06,1.15,.04]} c="#aaa79f"/><Box p={[0,0,.06]} s={[w,.06,.04]} c="#aaa79f"/></group>
}
function Furniture(){
  return <group>
    {/* kitchen */}
    <Box p={[-6.65,1.0,-5.85]} s={[3.2,.95,.75]} c="#514035"/>
    <Box p={[-7.55,1.7,-5.85]} s={[.18,.55,.7]} c="#6b5748"/>
    <Box p={[-5.95,1.7,-5.85]} s={[.18,.55,.7]} c="#6b5748"/>
    {/* dining */}
    <Box p={[5.15,.55,-5.65]} s={[2.8,1.1,1.05]} c="#4a382d"/>
    <Box p={[5.15,1.18,-5.65]} s={[2.35,.08,.9]} c="#61493a"/>
    {/* living room */}
    <Box p={[-6.7,.55,-.1]} s={[2.5,1.05,1.0]} c="#3f3029"/>
    <Box p={[6.55,.55,-.1]} s={[2.2,1.05,1.0]} c="#3f3029"/>
    <Box p={[0,.48,-.2]} s={[2.4,.12,1.5]} c="#46362e"/>
    {/* bedrooms */}
    <Box p={[-5.8,.55,5.9]} s={[2.7,1.0,1.35]} c="#4a362c"/>
    <Box p={[5.65,.55,5.9]} s={[2.7,1.0,1.35]} c="#4a362c"/>
    <Box p={[0,.45,5.8]} s={[2.1,.9,1.0]} c="#49362d"/>
    {/* bathroom fixtures */}
    <Box p={[-.95,.55,-5.8]} s={[1.1,1.0,.9]} c="#77736b"/>
    <Box p={[1.0,.42,-5.75]} s={[.8,.55,.8]} c="#6c6861"/>
    {/* cellar shelves */}
    {[-5.8,-4.6,-3.4].map((x,i)=><Box key={i} p={[x,.8,5.9]} s={[.75,1.6,.45]} c="#3b2d27"/>)}
  </group>
}
function House(){
  return <group>
    <Box p={[0,-.14,0]} s={[17.4,.28,15.8]} c="#211e1b"/>
    <Box p={[0,3.35,0]} s={[17.4,.22,15.8]} c="#292521"/>
    {/* perimeter and room walls */}
    {WALLS.map((w,i)=><Wall key={i} x={w[0]} z={w[1]} sx={w[2]} sz={w[3]}/>)}
    {/* front entrance porch and double door */}
    <Box p={[0,.12,-7.68]} s={[3.2,.24,.65]} c="#40342d"/>
    <Box p={[-.78,1.35,-7.62]} s={[1.35,2.7,.16]} c="#332720"/>
    <Box p={[.78,1.35,-7.62]} s={[1.35,2.7,.16]} c="#332720"/>
    <Box p={[0,1.35,-7.7]} s={[.08,2.35,.06]} c="#191614"/>
    {/* windows */}
    <Window p={[-8.52,1.75,-5.15]} rot={Math.PI/2} w={1.65}/>
    <Window p={[-8.52,1.75,.8]} rot={Math.PI/2} w={1.5}/>
    <Window p={[8.52,1.75,-5.15]} rot={-Math.PI/2} w={1.65}/>
    <Window p={[8.52,1.75,.8]} rot={-Math.PI/2} w={1.5}/>
    <Window p={[-5.2,1.75,-7.72]} w={1.6}/>
    <Window p={[4.4,1.75,-7.72]} w={1.8}/>
    {/* stairs to upper floor */}
    <group position={[6.35,0,6.25]}>{Array.from({length:8},(_,i)=><Box key={i} p={[0,.18+i*.22,-i*.38]} s={[2.6,.34,.78]} c="#65503f"/>)}</group>
    {/* hallway runner */}
    <Box p={[0,.025,.7]} s={[1.35,.05,8.8]} c="#312721"/>
    <Furniture/>
    {/* wall lamps */}
    <pointLight position={[-6.2,2.2,-5.2]} intensity={1.2} distance={4} color="#d8a66d"/>
    <pointLight position={[5.8,2.2,-5.1]} intensity={1.1} distance={4} color="#d8a66d"/>
    <pointLight position={[-6.2,2.2,5.3]} intensity={1.0} distance={4} color="#d8a66d"/>
    <pointLight position={[5.8,2.2,5.3]} intensity={1.0} distance={4} color="#d8a66d"/>
  </group>
}
function Collision(pos){
  const x=pos.x,z=pos.z
  if(x<-8.05||x>8.05||z<-7.35||z>7.35)return true
  for(const [wx,wz,ww,wd] of WALLS){
    if(Math.abs(x-wx)<ww/2+.30&&Math.abs(z-wz)<wd/2+.30)return true
  }
  return false
}
function CameraController({running,touchLook,sensitivity=1}){
  const {camera,gl}=useThree(),yaw=useRef(0),pitch=useRef(0),drag=useRef(false),last=useRef({x:0,y:0})
  useEffect(()=>{yaw.current=camera.rotation.y;pitch.current=camera.rotation.x
    const d=e=>{if(running){drag.current=true;last.current={x:e.clientX,y:e.clientY}}}
    const m=e=>{if(!running||!drag.current)return;const dx=e.clientX-last.current.x,dy=e.clientY-last.current.y;last.current={x:e.clientX,y:e.clientY};yaw.current-=dx*.0022*sensitivity;pitch.current=clamp(pitch.current-dy*.0022*sensitivity,-1.42,1.42)}
    const u=()=>drag.current=false;const el=gl.domElement;el.addEventListener('pointerdown',d);window.addEventListener('pointermove',m);window.addEventListener('pointerup',u)
    return()=>{el.removeEventListener('pointerdown',d);window.removeEventListener('pointermove',m);window.removeEventListener('pointerup',u)}
  },[camera,gl,running,sensitivity])
  useFrame(()=>{if(!running)return;const t=touchLook.current;if(t){yaw.current-=t.dx*.006*sensitivity;pitch.current=clamp(pitch.current-t.dy*.006*sensitivity,-1.42,1.42);touchLook.current=null}camera.rotation.order='YXZ';camera.rotation.y=yaw.current;camera.rotation.x=pitch.current;camera.rotation.z=0})
  return null
}
function Player({running,onMove,onNoise}){
  const keys=useRef({}),{camera}=useThree()
  useEffect(()=>{const d=e=>keys.current[e.code]=true,u=e=>keys.current[e.code]=false;window.addEventListener('keydown',d);window.addEventListener('keyup',u);return()=>{window.removeEventListener('keydown',d);window.removeEventListener('keyup',u)}},[])
  useFrame((_,dt)=>{if(!running)return;const k=keys.current;let x=(k.KeyD?1:0)-(k.KeyA?1:0),z=(k.KeyW?1:0)-(k.KeyS?1:0);if(!x&&!z)return;const l=Math.hypot(x,z),speed=(k.ShiftLeft||k.ShiftRight?4.5:2.8)*dt;const f=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);f.y=0;f.normalize();const r=new THREE.Vector3(1,0,0).applyQuaternion(camera.quaternion);r.y=0;r.normalize();const n=camera.position.clone().addScaledVector(r,x/l*speed).addScaledVector(f,z/l*speed);n.y=1.62;if(!Collision(n)){camera.position.copy(n);onMove(n)}if(k.KeyQ){onNoise();k.KeyQ=false}})
  return null
}
function TouchControls({move,look}){
  const joy=useRef(null),last=useRef(null)
  const mv=e=>{e.preventDefault();const t=e.touches[0],r=joy.current?.getBoundingClientRect();if(!t||!r)return;move(clamp((t.clientX-(r.left+r.width/2))/(r.width*.38),-1,1),clamp((t.clientY-(r.top+r.height/2))/(r.height*.38),-1,1))}
  const st=e=>{const t=e.touches[0];if(t)last.current={x:t.clientX,y:t.clientY}},dr=e=>{e.preventDefault();const t=e.touches[0];if(!t||!last.current)return;look(t.clientX-last.current.x,t.clientY-last.current.y);last.current={x:t.clientX,y:t.clientY}}
  return <div className="touchControls"><div ref={joy} className="joystick" onTouchStart={mv} onTouchMove={mv} onTouchEnd={()=>move(0,0)}><div className="stick"/></div><div className="lookZone" onTouchStart={st} onTouchMove={dr} onTouchEnd={()=>last.current=null}/></div>
}

function Granny({player,active,difficulty,positionRef,noiseRef}){
  const ref=useRef()
  useFrame((_,dt)=>{if(!ref.current)return;positionRef.current.copy(ref.current.position);if(!active)return;const p=ref.current.position,dx=player.current.x-p.x,dz=player.current.z-p.z,d=Math.hypot(dx,dz);let tx=player.current.x,tz=player.current.z
    if(noiseRef.current){tx=noiseRef.current.x;tz=noiseRef.current.z;if(noiseRef.current.t<performance.now())noiseRef.current=null}
    const nd=Math.hypot(tx-p.x,tz-p.z)
    if((d<11||noiseRef.current)&&nd>.8){const step=({easy:.62,normal:.86,hard:1.1,extreme:1.38}[difficulty]||.86)*dt;const nx=p.x+(tx-p.x)/nd*step,nz=p.z+(tz-p.z)/nd*step;if(!Collision({x:nx,z:nz})){p.x=nx;p.z=nz};ref.current.rotation.y=Math.atan2(tx-p.x,tz-p.z)}
  })
  return <group ref={ref} position={[-5.5,0,3.5]}><Box p={[0,1.15,0]} s={[.72,1.95,.5]} c="#d8cdc3"/><mesh position={[0,2.38,0]}><sphereGeometry args={[.43,20,16]}/><meshStandardMaterial color="#d8cdc3"/></mesh><Box p={[0,1.48,-.28]} s={[.86,.82,.1]} c="#8c1f27"/><Box p={[-.19,2.47,-.4]} s={[.07,.08,.035]} c="#111"/><Box p={[.19,2.47,-.4]} s={[.07,.08,.035]} c="#111"/><Box p={[0,2.78,0]} s={[.9,.16,.5]} c="#2e2620"/></group>
}

function ItemMesh({type,position}){
  const c={hammer:'#765a3b',pliers:'#7ea052',padlockKey:'#6ca0b6',code:'#e0c87a',battery:'#1d2527',masterKey:'#b33a3a',screwdriver:'#9b7652',safeKey:'#d2ad57',winch:'#765a3b',melon:'#557348',playhouseKey:'#62a2a0',cogA:'#b58a3e',cogB:'#9a6d32',carKey:'#e0b44d',carBattery:'#202a2d',engine:'#55504b',gasoline:'#8a684d',spark:'#d1d1c9',wrench:'#77766f',rustyKey:'#725d49',chainCutter:'#7ea052',stick:'#8b6b4e',wheelCrank:'#6c5645',book:'#633f2f'}[type]||'#999'
  return <Box p={position} s={type==='melon'?[.55,.4,.7]:[.38,.18,.18]} c={c} r={type==='melon'?0:.2} metal={['pliers','screwdriver','cogA','cogB','spark','wrench','chainCutter'].includes(type)? .5:0}/>
}

function PuzzleProps({state,onAction}){
  return <group>
    {/* front door hardware */}
    <Box p={[-.82,1.45,-7.48]} s={[.18,.5,.08]} c="#77726a" metal={.7}/>
    <Box p={[.82,1.45,-7.48]} s={[.18,.5,.08]} c="#77726a" metal={.7}/>
    <Box p={[0,1.55,-7.5]} s={[.65,.18,.08]} c="#292522" metal={.5}/>
    {/* kitchen cabinets */}
    <Box p={[-6.7,1.65,-5.4]} s={[3.5,.12,.8]} c="#302720"/>
    {[-7.8,-6.9,-6,-5.1].map(x=><Box key={x} p={[x,1.25,-5.4]} s={[.7,.55,.05]} c="#72533d"/>)}
    {/* safe */}
    <Box p={[7.25,.95,-6.1]} s={[1.15,1.65,.8]} c="#36383a" metal={.6}/>
    <Box p={[7.25,.95,-5.67]} s={[.58,.58,.05]} c="#1e2021" metal={.4}/>
    {/* well / winch station */}
    <Box p={[-6.95,.65,6.55]} s={[1.9,1.25,1.3]} c="#514037"/>
    <Box p={[-6.95,1.35,6.0]} s={[1.45,.12,.12]} c="#26211e" metal={.5}/>
    {/* playhouse / gear cabinet */}
    <Box p={[6.9,.9,5.95]} s={[2.0,1.8,1.35]} c="#4c382d"/>
    <Box p={[6.9,1.45,5.25]} s={[1.45,.75,.08]} c="#211c19"/>
    {/* cellar route hatch */}
    <Box p={[-6.85,.05,-.15]} s={[1.45,.08,1.25]} c="#171412" metal={.3}/>
    <Box p={[-6.85,.28,-.15]} s={[1.25,.08,.08]} c="#725b45"/>
    {/* car bay */}
    <Box p={[5.9,.05,-6.65]} s={[3.8,.08,1.6]} c="#181614"/>
    <Box p={[4.65,.48,-6.55]} s={[1.55,.72,1.25]} c="#393330" metal={.45}/>
    <Box p={[6.7,.48,-6.55]} s={[1.55,.72,1.25]} c="#393330" metal={.45}/>
  </group>
}
function World({mode,player,onLose,onWin,cameraSensitivity,difficulty}){
  const running=mode==='play'||mode==='practice'
  const cameraRef=useRef(),touchLook=useRef(null),grannyPos=useRef(new THREE.Vector3(-5.5,0,3.5)),noiseRef=useRef(null)
  const [inventory,setInventory]=useState(null),[message,setMessage]=useState(''),[day,setDay]=useState(1),[hidden,setHidden]=useState(false),[blur,setBlur]=useState(0)
  const [used,setUsed]=useState({}),[items,setItems]=useState({}),[props,setProps]=useState({well:false,melon:false,playhouse:false,safe:false,sewer:false,lever:false,car:false})
  const spots=useMemo(()=>[...SPOTS].sort(()=>Math.random()-.5),[])
  useEffect(()=>{const pool=[...REWARD_POOL].sort(()=>Math.random()-.5);const m={};pool.forEach((it,i)=>{m[it]={position:spots[i],available:true}});setItems(m)},[spots])
  useEffect(()=>{if(!message)return;const id=setTimeout(()=>setMessage(''),2200);return()=>clearTimeout(id)},[message])
  const say=m=>{setMessage(m)}
  const consume=type=>{if(inventory!==type){say('You need '+ITEM_NAMES[type]);return false};setInventory(null);setUsed(v=>({...v,[type]:true}));return true}
  const reward=type=>{setItems(v=>({...v,[type]:{position:[0,0,0],available:false}}));setInventory(type);say('FOUND: '+ITEM_NAMES[type])}
  const interact=()=>{
    const c=cameraRef.current;if(!c)return
    let nearest=null,nd=1.35
    Object.entries(items).forEach(([type,o])=>{if(!o?.available)return;const d=Math.hypot(c.position.x-o.position[0],c.position.z-o.position[2]);if(d<nd){nearest=type;nd=d}})
    if(nearest){setItems(v=>({...v,[nearest]:{...v[nearest],available:false}}));setInventory(nearest);say('TAKEN: '+ITEM_NAMES[nearest]);return}
    const x=c.position.x,z=c.position.z
    
    if(Math.hypot(x,z-7.7)<2&&Math.abs(x)<1.3){const need=['hammer','pliers','padlockKey','code','battery','screwdriver','masterKey'];const missing=need.filter(n=>!used[n]);if(!missing.length){onWin();return};say('FRONT DOOR: '+missing.map(n=>ITEM_NAMES[n]).join(' · '));return}
    if(Math.hypot(x-6.9,z-5.9)<2){if(!props.playhouse){if(consume('playhouseKey'))setProps(v=>({...v,playhouse:true}));return};if(!props.playhouse){say('Locked playhouse');return}}
    if(Math.hypot(x-6.9,z-5.9)<2&&props.playhouse){if(!used.cogA){if(consume('cogA'))setUsed(v=>({...v,cogA:true}));return}if(!used.cogB){if(consume('cogB'))setUsed(v=>({...v,cogB:true}));return}say('The playhouse mechanism opens a hidden compartment.');reward('masterKey');return}
    if(Math.hypot(x-7.0,z-6.0)<2){if(!props.safe){if(consume('safeKey')){setProps(v=>({...v,safe:true}));say('SAFE OPEN');reward('padlockKey')}return}}
    if(Math.hypot(x,z-6.9)<2){if(!props.well){if(consume('winch')){setProps(v=>({...v,well:true}));say('The well bucket comes up.');reward('safeKey')}return}}
    if(Math.hypot(x+6.8,z-.2)<2){if(!used.melon){if(consume('melon')){setUsed(v=>({...v,melon:true}));say('The melon is cut open.');reward('code')}return}}
    if(Math.hypot(x+6.9,z-6.0)<2){if(!props.sewer){if(consume('rustyKey')){setProps(v=>({...v,sewer:true}));say('Sewer route unlocked.')}}else{if(!used.chainCutter){if(consume('chainCutter'))return}if(!used.stick){if(consume('stick'))return}if(!used.wheelCrank){if(consume('wheelCrank'))return}onWin()};return}
    if(Math.hypot(x-6.8,z-.2)<2){if(!used.screwdriver){if(consume('screwdriver')){setProps(v=>({...v,lever:true}));say('The hidden lever is released.')}}return}
    if(Math.hypot(x-6.9,z-5.9)<2&&used.carKey){setProps(v=>({...v,car:true}));return}
    if(Math.hypot(x-7.0,z-5.9)<2&&props.car){const need=['carBattery','engine','gasoline','spark','wrench','carKey','padlockKey'];const missing=need.filter(n=>!used[n]);if(!missing.length)onWin();else say('CAR: '+missing.map(n=>ITEM_NAMES[n]).join(' · '));return}
    say('Nothing useful here.')
  }
  const drop=()=>{if(!inventory)return;say('Dropped '+ITEM_NAMES[inventory]);noiseRef.current={x:cameraRef.current.position.x,z:cameraRef.current.position.z,t:performance.now()+6500};setItems(v=>({...v,[inventory]:{position:[cameraRef.current.position.x,1.05,cameraRef.current.position.z],available:true}}));setInventory(null)}
  useEffect(()=>{const key=e=>{if(!running)return;if(e.code==='KeyE')interact();if(e.code==='KeyQ')drop();if(e.code==='KeyH'){const near=Math.abs(player.current.x)>6.2&&Math.abs(player.current.z)>4.5;setHidden(near);say(near?'HIDDEN':'You cannot hide here.')}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)},[running,inventory,items,used,props])
  useEffect(()=>{const id=setInterval(()=>{if(!running||hidden)return;const d=Math.hypot(player.current.x-grannyPos.current.x,player.current.z-grannyPos.current.z);if(d<.85){if(day>=5){onLose();return}setDay(v=>v+1);player.current.set(...START);if(cameraRef.current)cameraRef.current.position.set(...START);say('DAY '+(day+1));noiseRef.current=null}if(difficulty==='extreme')setBlur(clamp((7.5-d)/6.5,0,1));else setBlur(0)},120);return()=>clearInterval(id)},[running,hidden,difficulty,day,onLose])
  const touchMove=(x,y)=>{const c=cameraRef.current;if(!c)return;const f=new THREE.Vector3(0,0,-1).applyQuaternion(c.quaternion);f.y=0;f.normalize();const r=new THREE.Vector3(1,0,0).applyQuaternion(c.quaternion);r.y=0;r.normalize();const n=c.position.clone().addScaledVector(r,x*.12).addScaledVector(f,-y*.12);n.y=1.62;if(!Collision(n)){c.position.copy(n);player.current.copy(n)}}
  return <div className="world">
    <Canvas shadows dpr={[1,1.6]} gl={{antialias:true}} camera={{fov:68,near:.05,far:90}}>
      <PerspectiveCamera ref={cameraRef} makeDefault position={START} fov={68} near={.05} far={90}/>
      <color attach="background" args={['#090807']}/><fog attach="fog" args={['#090807',16,38]}/>
      <ambientLight intensity={.32}/><directionalLight castShadow position={[-5,10,4]} intensity={1.15} shadow-mapSize={[1024,1024]}/><pointLight position={[0,2.3,4.5]} intensity={4.5} distance={9} color="#d1a36c"/>
      <House/><PuzzleProps state={{props}}/>
      {Object.entries(items).map(([type,o])=>o?.available?<ItemMesh key={type} type={type} position={o.position}/>:null)}
      <Granny player={player} active={mode==='play'&&!hidden} difficulty={difficulty} positionRef={grannyPos} noiseRef={noiseRef}/>
      <Player running={running&&!hidden} onMove={p=>player.current.copy(p)} onNoise={()=>{noiseRef.current={x:player.current.x,z:player.current.z,t:performance.now()+6500}}}/>
      <CameraController running={running} touchLook={touchLook} sensitivity={cameraSensitivity}/>
    </Canvas>
    {running&&<div className="crosshair">+</div>}
    {running&&<div className="gameHud"><span>GRANNY</span><span>DAY {day}/5 · {difficulty.toUpperCase()}</span><span>ITEM: {inventory?ITEM_NAMES[inventory]:'EMPTY'}</span><small>E INTERACT · Q DROP · H HIDE · WASD · SHIFT · DRAG</small></div>}
    {running&&<div className="objective">ESCAPE: FRONT DOOR · CAR · SEWER</div>}
    {message&&<div className="gameMessage">{message}</div>}
    {running&&difficulty==='extreme'&&<div className="extremeVision" style={{opacity:.15+.5*blur,backdropFilter:'blur('+(1+blur*6)+'px)'}}/>}
    {running&&<TouchControls move={touchMove} look={(dx,dy)=>touchLook.current={dx,dy}}/>}
  </div>
}

function Menu({onPlay,onPractice,onSettings,onDifficulty,difficulty}){
  return <div className="menu"><div className="menuScene"><div className="vignette"/></div><div className="menuCard"><div className="mini">SR HOLLOW · CLASSIC ESCAPE</div><h1>GRANNY</h1><div className="version">HOUSE ESCAPE</div><div className="menuButtons"><button onClick={onPlay}>PLAY</button><button onClick={onPractice}>PRACTICE</button><button className="ghost" onClick={onDifficulty}>DIFFICULTY · {difficulty.toUpperCase()}</button><button className="ghost" onClick={onSettings}>SETTINGS</button></div><p>Five days. One house. Three escape routes. One item at a time.</p></div></div>
}
function Difficulty({difficulty,setDifficulty,onBack}){
  const choices=[['easy','EASY','Slower chase.'],['normal','NORMAL','Classic chase.'],['hard','HARD','Faster chase and tighter pressure.'],['extreme','EXTREME','Fastest chase and clouded vision.']]
  return <div className="pregame"><div className="preBox"><div className="preKicker">DIFFICULTY</div><h2>CHOOSE YOUR NIGHT</h2><div className="difficultyList">{choices.map(([id,n,d])=><button key={id} className={difficulty===id?'selected':''} onClick={()=>setDifficulty(id)}><strong>{n}</strong><span>{d}</span></button>)}</div><button onClick={onBack}>BACK</button></div></div>
}
function Settings({sensitivity,setSensitivity,onBack}){return <div className="pregame"><div className="preBox"><div className="preKicker">SETTINGS</div><h2>GAME SETTINGS</h2><p>Camera sensitivity.</p><div className="controls"><span>{Math.round(sensitivity*100)}%</span></div><input aria-label="Camera sensitivity" type="range" min=".5" max="1.8" step=".1" value={sensitivity} onChange={e=>setSensitivity(Number(e.target.value))} style={{width:'100%'}}/><button onClick={onBack}>BACK</button></div></div>}
function PreGame({onStart,practice}){return <div className="pregame"><div className="preBox"><div className="preKicker">{practice?'PRACTICE':'NIGHT 1'}</div><h2>{practice?'PRACTICE HOUSE':'THE HOUSE IS QUIET'}</h2><p>{practice?'Explore the full puzzle house without Granny.':'You wake up upstairs. The house has multiple escape routes. Search, solve, hide and get out before Day 5.'}</p><div className="controls"><span>WASD</span><span>E INTERACT</span><span>Q DROP</span><span>H HIDE</span><span>SHIFT RUN</span></div><button onClick={onStart}>ENTER THE HOUSE</button></div></div>}
function App(){
  const [screen,setScreen]=useState('menu'),[practice,setPractice]=useState(false),[key,setKey]=useState(0),[cameraSensitivity,setCameraSensitivity]=useState(1),[difficulty,setDifficulty]=useState('normal')
  const player=useRef(new THREE.Vector3(...START))
  const start=p=>{setPractice(p);setScreen('pregame')}
  const play=()=>{player.current.set(...START);setKey(k=>k+1);setScreen('play')}
  return <div className="app">
    {screen==='menu'&&<Menu onPlay={()=>start(false)} onPractice={()=>start(true)} onSettings={()=>setScreen('settings')} onDifficulty={()=>setScreen('difficulty')} difficulty={difficulty}/>}
    {screen==='settings'&&<Settings sensitivity={cameraSensitivity} setSensitivity={setCameraSensitivity} onBack={()=>setScreen('menu')}/>}
    {screen==='difficulty'&&<Difficulty difficulty={difficulty} setDifficulty={setDifficulty} onBack={()=>setScreen('menu')}/>}
    {screen==='pregame'&&<PreGame practice={practice} onStart={play}/>}
    {screen==='play'&&<World key={key} mode={practice?'practice':'play'} player={player} cameraSensitivity={cameraSensitivity} difficulty={difficulty} onLose={()=>setScreen('lose')} onWin={()=>setScreen('win')}/>}
    {screen==='lose'&&<div className="result"><div><small>CAUGHT</small><h2>GRANNY FOUND YOU</h2><p>The fifth day ends the run.</p><button onClick={play}>RESTART</button><button className="ghost" onClick={()=>setScreen('menu')}>MAIN MENU</button></div></div>}
    {screen==='win'&&<div className="result success"><div><small>ESCAPED</small><h2>YOU GOT OUT</h2><p>Escape route complete.</p><button onClick={()=>setScreen('menu')}>MAIN MENU</button></div></div>}
  </div>
}
createRoot(document.getElementById('root')).render(<App/>)
