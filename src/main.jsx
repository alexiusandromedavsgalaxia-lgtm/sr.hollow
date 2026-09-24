import React,{useEffect,useMemo,useRef,useState} from 'react'
import {createRoot} from 'react-dom/client'
import {Canvas,useFrame,useThree} from '@react-three/fiber'
import {PerspectiveCamera} from '@react-three/drei'
import * as THREE from 'three'
import './styles.css'

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v))
const START=[0,1.62,5.6]
const WALLS=[
  [-8.6,0,.3,16], [8.6,0,.3,16], [0,-7.9,17,.3],
  [-6.1,2.2,4.7,.28], [6.0,2.2,5,.28],
  [-6.1,.2,4.7,.28], [6.0,.2,5,.28],
  [-2.4,-4.7,.28,6.4], [3.6,-4.7,.28,6.4],
  [-5.1,0,.28,1.8], [5.1,0,.28,1.8],
  [0,.9,4.5,.28]
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
    <Box p={[-5.4,.65,-5.4]} s={[2.4,1.3,.9]} c="#49382e"/><Box p={[5.3,.55,-5.3]} s={[2.4,1.1,1]} c="#3c3028"/>
    <Box p={[-5.2,.55,.3]} s={[2.2,1.1,1]} c="#59453a"/><Box p={[4.9,.5,1.5]} s={[2.5,1,.9]} c="#4a382f"/>
    <Box p={[1.1,.45,5.2]} s={[3.4,.9,1.25]} c="#49382e"/><Box p={[-1.2,.4,-2.7]} s={[1.2,.8,.75]} c="#28211e"/>
    <Box p={[2.2,.4,-2.8]} s={[1.5,.8,.7]} c="#302621"/><Box p={[-5.8,.4,4.3]} s={[1.6,.8,1.1]} c="#2c2420"/>
    <Box p={[5.5,.4,4.5]} s={[1.3,.8,1.2]} c="#30251f"/>
  </group>
}
function House(){
  return <group>
    <Box p={[0,-.12,0]} s={[17,.22,15.5]} c="#24211e"/><Box p={[0,3.2,0]} s={[17,.2,15.5]} c="#2c2824"/>
    {WALLS.map((w,i)=><Wall key={i} x={w[0]} z={w[1]} sx={w[2]} sz={w[3]}/>)}
    <Wall x={0} z={7.82} sx={7} sz={.3}/><Wall x={-7} z={7.82} sx={3.2} sz={.3}/><Wall x={7} z={7.82} sx={3.2} sz={.3}/>
    <Box p={[0,1.35,7.7]} s={[2.1,2.7,.16]} c="#2e241e"/>
    <Window p={[-7.98,1.8,-4]} rot={Math.PI/2}/><Window p={[-7.98,1.8,3.5]} rot={Math.PI/2}/>
    <Window p={[7.98,1.8,-4.5]} rot={-1.5707963267948966}/><Window p={[7.98,1.8,.8]} rot=-1.5707963267948966/>
    <Window p={[-1.2,1.8,-7.72]} w={2.1}/><Window p={[3.5,1.8,-7.72]} w={1.7}/>
    <Furniture/>
    <Box p={[0,.04,-1.2]} s={[2.8,.08,1.7]} c="#352923"/><Box p={[0,.05,2.7]} s={[2.4,.1,1.3]} c="#3b2d25"/>
    <group position={[6.2,0,6.1]}>{Array.from({length:6},(_,i)=><Box key={i} p={[0,.16+i*.22,-i*.38]} s={[2.5,.3,.72]} c="#63503e"/>)}</group>
    <group position={[0,0,-9.3]}><Box p={[0,1.1,0]} s={[15,.12,.12]} c="#48443d"/>{[-7,-5.5,-4,-2.5,-1,1,2.5,4,5.5,7].map(x=><Box key={x} p={[x,.65,0]} s={[.1,1.3,.1]} c="#48443d"/>)}<Box p={[-4,.5,-2]} s={[2.7,1,.4]} c="#4a3a30"/><Box p={[4,.5,-2]} s={[2.7,1,.4]} c="#4a3a30"/></group>
    <Box p={[-6.9,.65,6.4]} s={[2.2,1.3,.3]} c="#44352c"/><Box p={[6.9,.65,6.4]} s={[2.2,1.3,.3]} c="#44352c"/>
  </group>
}
function Collision(pos){
  const x=pos.x,z=pos.z
  if(x<-7.95||x>7.95||z<-7.25||z>7.25)return true
  for(const [wx,wz,ww,wd] of WALLS) if(Math.abs(x-wx)<ww/2+.28&&Math.abs(z-wz)<wd/2+.28)return true
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
  const p=state.props
  return <group>
    <Box p={[-5.8,.75,6.7]} s={[1.5,1.5,.5]} c="#503d2e"/><Box p={[5.8,.65,6.7]} s={[1.8,1.2,.6]} c="#4a382c"/>
    <Box p={[0,1.1,7.69]} s={[2.1,2.25,.18]} c="#33261f"/>
    <Box p={[7.15,1.0,-6.0]} s={[1.5,2,.7]} c="#3b3029"/>
    <Box p={[-7.15,1.0,-6.0]} s={[1.5,2,.7]} c="#3b3029"/>
    <Box p={[7.0,.7,5.8]} s={[2.1,1.4,1.5]} c="#4b392d"/>
    <Box p={[-7.0,.7,5.8]} s={[2.1,1.4,1.5]} c="#4b392d"/>
    <Box p={[0,.65,-6.9]} s={[1.7,1.2,.5]} c="#4b3b31"/>
    <Box p={[-6.8,.7,.2]} s={[1.3,1.4,.5]} c="#3e332b"/>
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
