import React,{useEffect,useRef,useState} from 'react'
import {createRoot} from 'react-dom/client'
import {Canvas,useFrame,useThree} from '@react-three/fiber'
import {PerspectiveCamera,Environment} from '@react-three/drei'
import * as THREE from 'three'
import './styles.css'

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v))
const START=[0,1.62,5.9]

function Box({p=[0,0,0],s=[1,1,1],c='#51483e',r=0,cast=true,receive=true}){
  return <mesh position={p} rotation={[0,r,0]} castShadow={cast} receiveShadow={receive}>
    <boxGeometry args={s}/><meshStandardMaterial color={c} roughness={.86}/>
  </mesh>
}

function Lamp({p=[0,2,0],on=true}){
  return <group position={p}>
    <mesh><sphereGeometry args={[.12,12,8]}/><meshStandardMaterial color="#8d7652" metalness={.5}/></mesh>
    {on&&<pointLight intensity={2.2} distance={5} color="#ffd39a"/>}
  </group>
}

function Door({p=[0,1.3,0],rot=0,label='' ,exit=false}){
  return <group position={p} rotation={[0,rot,0]}>
    <Box p={[0,0,0]} s={[1.05,2.6,.16]} c={exit?'#201a16':'#30251e'}/>
    <Box p={[0,.0,.09]} s={[.08,1.8,.025]} c="#4a372b" cast={false}/>
    <mesh position={[.34,0,-.11]}><sphereGeometry args={[.055,12,8]}/><meshStandardMaterial color="#b99a63" metalness={.7}/></mesh>
    {label&&<mesh position={[0,0,.1]}><planeGeometry args={[.8,.3]}/><meshStandardMaterial color="#241d18" roughness={1}/></mesh>}
  </group>
}

function Furniture(){
  return <group>
    <Box p={[-5.55,.65,-5.45]} s={[2.2,1.3,.85]} c="#46382d"/>
    <Box p={[-5.55,1.5,-5.45]} s={[2.2,.12,.85]} c="#6a5039"/>
    <Box p={[5.35,.65,-5.25]} s={[2.4,1.3,.9]} c="#3d3028"/>
    <Box p={[5.35,1.48,-5.25]} s={[2.35,.1,.86]} c="#614934"/>
    <Box p={[-5.1,.55,.1]} s={[2.1,1.1,1.05]} c="#594638"/>
    <Box p={[4.8,.5,1.3]} s={[2.4,1,.9]} c="#514034"/>
    <Box p={[1.1,.42,5.25]} s={[3.3,.84,1.25]} c="#4a392f"/>
    <Box p={[-1.4,.35,-2.7]} s={[1.1,.7,.7]} c="#29221e"/>
    <Box p={[2.2,.45,-2.8]} s={[1.4,.9,.7]} c="#332823"/>
    <Box p={[-5.65,.32,4.4]} s={[1.5,.64,1.1]} c="#2c2520"/>
    <Box p={[5.55,.35,4.65]} s={[1.2,.7,1.2]} c="#30251f"/>
  </group>
}

const HOUSE_WALLS=[
  [-8.6,0,0.3,16], [8.6,0,0.3,16], [0,-7.9,17,0.3],
  [-6.2,2.7,4.5,0.26], [6.0,2.7,5.0,0.26],
  [-6.2,0.9,4.5,0.26], [6.0,0.9,5.0,0.26],
  [-2.25,-4.6,0.26,6.6], [3.55,-4.6,0.26,6.6],
  [-5.1,0.0,0.26,1.8], [5.1,0.0,0.26,1.8],
  [0,0.9,4.5,0.26]
]

function Wall({x,z,sx,sz,y=1.55,h=3,c='#655a50'}){
  return <Box p={[x,y,z]} s={[sx,h,sz]} c={c}/>
}

function Window({p=[0,1.7,0],rot=0,w=1.6,h=1.15}){
  return <group position={p} rotation={[0,rot,0]}>
    <Box p={[0,0,0]} s={[w,h,.08]} c="#263442" cast={false}/>
    <Box p={[0,0,.055]} s={[w+.12,h+.12,.08]} c="#4f514c" cast={false}/>
    <Box p={[0,0,.1]} s={[.06,h,.04]} c="#817d73" cast={false}/>
    <Box p={[0,0,.1]} s={[w,.06,.04]} c="#817d73" cast={false}/>
  </group>
}

function Rug({p=[0,.02,0],s=[2,1.4],c='#3d3029'}){
  return <mesh position={p} rotation={[-Math.PI/2,0,0]}>
    <planeGeometry args={s}/><meshStandardMaterial color={c} roughness={1}/>
  </mesh>
}

function Furniture(){
  return <group>
    <Rug p={[-5.5,.03,-3.8]} s={[4.4,2.8]} c="#403631"/>
    <Box p={[-5.5,.65,-4.6]} s={[2.7,1.15,.95]} c="#5a5048"/>
    <Box p={[-5.5,1.34,-4.6]} s={[2.7,.08,.95]} c="#75675b"/>
    <Box p={[-6.85,1.05,-3.3]} s={[.55,1.8,.75]} c="#51463e"/>
    <Box p={[-4.15,1.05,-3.3]} s={[.55,1.8,.75]} c="#51463e"/>
    <Box p={[-5.5,1.3,-2.55]} s={[2.5,.08,.7]} c="#554a41"/>
    <Box p={[-6.65,.65,3.7]} s={[1.4,1.3,.8]} c="#594c42"/>
    <Box p={[-6.65,1.38,3.7]} s={[1.45,.08,.84]} c="#74675b"/>

    <Box p={[-4.8,.55,.0]} s={[2.6,1.05,.9]} c="#4d4640"/>
    <Box p={[-6.0,.72,.65]} s={[.85,1.35,.9]} c="#55504a"/>
    <Box p={[-3.55,.72,.65]} s={[.85,1.35,.9]} c="#55504a"/>
    <Box p={[-4.8,1.3,.58]} s={[2.8,.12,.95]} c="#292725"/>
    <Box p={[-4.8,1.72,.52]} s={[1.55,.72,.08]} c="#181717"/>

    <Rug p={[-.2,.03,-3.6]} s={[4.6,2.7]} c="#493d36"/>
    <Box p={[-.2,.62,-3.6]} s={[3.1,1.15,1.05]} c="#59483c"/>
    <Box p={[-.2,.68,-2.0]} s={[3.2,.1,.95]} c="#735c49"/>
    <Box p={[-.2,.46,-1.25]} s={[2.2,.9,.8]} c="#4a3d35"/>
    <Box p={[.8,1.0,-1.25]} s={[.08,1.1,.55]} c="#28211d"/>

    <Box p={[5.95,.55,-5.5]} s={[4.2,1.0,.75]} c="#4e4035"/>
    <Box p={[4.2,.75,-5.5]} s={[.65,1.5,.8]} c="#5c493a"/>
    <Box p={[6.95,.75,-5.5]} s={[.65,1.5,.8]} c="#5c493a"/>
    <Box p={[5.95,1.25,-4.8]} s={[4.25,.12,.72]} c="#66503d"/>
    {[-.9,-.3,.3,.9].map((x,i)=><Box key={i} p={[5.95+x*2.2,.85,-3.9]} s={[.38,1.5,.45]} c="#4d3e32"/>)}

    <Box p={[6.25,.55,-.8]} s={[3.5,1.05,.8]} c="#4d3c30"/>
    <Box p={[6.25,1.25,-.8]} s={[3.6,.1,.85]} c="#6a5039"/>
    <Box p={[5.2,1.05,-.8]} s={[.55,1.1,.55]} c="#d1b37b"/>
    <Box p={[6.25,1.05,-.8]} s={[.55,1.1,.55]} c="#d1b37b"/>
    <Box p={[7.3,1.05,-.8]} s={[.55,1.1,.55]} c="#d1b37b"/>

    <Box p={[0,0.45,5.2]} s={[2.5,.9,1.0]} c="#5a4a3d"/>
    <Box p={[-2.0,.45,5.2]} s={[.7,.9,.7]} c="#665347"/>
    <Box p={[2.0,.45,5.2]} s={[.7,.9,.7]} c="#665347"/>
    <Box p={[0,1.02,5.2]} s={[2.65,.08,1.05]} c="#7a6552"/>

    <Box p={[0,.7,1.8]} s={[1.8,1.35,.55]} c="#514239"/>
    <Box p={[0,1.55,1.8]} s={[1.8,.12,.58]} c="#675444"/>

    <Box p={[5.95,.65,4.9]} s={[1.9,1.2,.8]} c="#3f332a"/>
    <Box p={[5.95,1.35,4.9]} s={[1.95,.08,.84]} c="#72563e"/>

    <group position={[2.0,0,2.9]}>
      {Array.from({length:7},(_,i)=><Box key={i} p={[0,.2+i*.31,-i*.38]} s={[2.1,.38,.75]} c="#5b493a"/>)}
      <Box p={[0,1.25,-2.5]} s={[2.3,.12,.85]} c="#765c45"/>
    </group>
  </group>
}

function House(){
  return <group>
    <Box p={[0,-.12,0]} s={[17,.22,15.5]} c="#272522"/>
    <Box p={[0,3.25,0]} s={[17,.25,15.5]} c="#2f2a26"/>
    {HOUSE_WALLS.map(([x,z,sx,sz],i)=><Wall key={i} x={x} z={z} sx={sx} sz={sz}/>)}
    <Wall x={0} z={7.82} sx={7.0} sz={.3}/>
    <Wall x={-7.0} z={7.82} sx={3.2} sz={.3}/>
    <Wall x={7.0} z={7.82} sx={3.2} sz={.3}/>
    <Box p={[0,1.35,7.72]} s={[2.1,2.7,.18]} c="#332922"/>
    <Box p={[0,.25,7.96]} s={[2.7,.45,.8]} c="#6b5746"/>
    <Box p={[-.9,.48,7.72]} s={[.75,.1,.1]} c="#b49462" cast={false}/>
    <Box p={[.9,.48,7.72]} s={[.75,.1,.1]} c="#b49462" cast={false}/>

    <Window p={[-7.98,1.8,-4.0]} rot={Math.PI/2}/>
    <Window p={[-7.98,1.8,3.7]} rot={Math.PI/2}/>
    <Window p={[7.98,1.8,-4.8]} rot={-Math.PI/2}/>
    <Window p={[7.98,1.8,.8]} rot={-Math.PI/2}/>
    <Window p={[-1.2,1.8,-7.72]} w={2.2}/>
    <Window p={[3.4,1.8,-7.72]} w={1.7}/>

    <Furniture/>
    <Lamp p={[-5.4,2.65,-3.6]}/>
    <Lamp p={[5.8,2.65,-5.5]}/>
    <Lamp p={[0,2.65,4.9]}/>

    <group position={[6.1,0,6.4]}>
      {Array.from({length:6},(_,i)=><Box key={i} p={[0,.16+i*.22,-i*.38]} s={[2.6,.32,.75]} c="#66503d"/>)}
    </group>

    <group position={[0,.02,-9.3]}>
      <Box p={[0,1.1,0]} s={[15,.12,.12]} c="#4b473e" cast={false}/>
      {[-7,-5.5,-4,-2.5,-1,1,2.5,4,5.5,7].map(x=><Box key={x} p={[x,.65,0]} s={[.1,1.3,.1]} c="#4b473e" cast={false}/>)}
      <Box p={[-4,.8,-2.2]} s={[2.8,.15,2.2]} c="#5a4638"/>
      <Box p={[-4,1.7,-2.2]} s={[2.8,.12,2.2]} c="#5a4638"/>
      <Box p={[4,.5,-2.4]} s={[2.4,1,.35]} c="#4c3c31"/>
      <Box p={[4,.5,-1.1]} s={[2.4,1,.35]} c="#4c3c31"/>
    </group>
  </group>
}

function Collision(pos){
  const x=pos.x,z=pos.z
  if(x<-7.95||x>7.95||z<-7.25||z>7.25)return true
  for(const [wx,wz,ww,wd] of HOUSE_WALLS){
    if(Math.abs(x-wx)<ww/2+.3&&Math.abs(z-wz)<wd/2+.3)return true
  }
  return false
}

function Player({running,onMove}){
  const keys=useRef({})
  const {camera}=useThree()
  const velocity=useRef(new THREE.Vector3())
  useEffect(()=>{
    const down=e=>{keys.current[e.code]=true}
    const up=e=>{keys.current[e.code]=false}
    window.addEventListener('keydown',down)
    window.addEventListener('keyup',up)
    return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up)}
  },[])
  useFrame((_,dt)=>{
    if(!running)return
    const k=keys.current
    let side=(k.KeyD?1:0)-(k.KeyA?1:0)+(k.ArrowRight?1:0)-(k.ArrowLeft?1:0)
    let forward=(k.KeyW?1:0)-(k.KeyS?1:0)+(k.ArrowUp?1:0)-(k.ArrowDown?1:0)
    if(!side&&!forward)return
    const len=Math.hypot(side,forward)
    const speed=(k.ShiftLeft||k.ShiftRight?4.4:2.9)*dt
    const f=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);f.y=0;f.normalize()
    const r=new THREE.Vector3(1,0,0).applyQuaternion(camera.quaternion);r.y=0;r.normalize()
    const next=camera.position.clone()
    next.addScaledVector(r,side/len*speed)
    next.addScaledVector(f,forward/len*speed)
    next.y=1.62
    if(!Collision(next)){
      camera.position.copy(next)
      onMove(camera.position)
    }
  })
  return null
}

function TouchControls({move,look}){
  const joy=useRef(null),last=useRef(null)
  const moveTouch=e=>{
    e.preventDefault()
    const t=e.touches[0],r=joy.current?.getBoundingClientRect()
    if(!t||!r)return
    move(
      clamp((t.clientX-(r.left+r.width/2))/(r.width*.38),-1,1),
      clamp((t.clientY-(r.top+r.height/2))/(r.height*.38),-1,1)
    )
  }
  const start=e=>{const t=e.touches[0];if(t)last.current={x:t.clientX,y:t.clientY}}
  const drag=e=>{
    e.preventDefault()
    const t=e.touches[0]
    if(!t||!last.current)return
    look(t.clientX-last.current.x,t.clientY-last.current.y)
    last.current={x:t.clientX,y:t.clientY}
  }
  return <div className="touchControls">
    <div ref={joy} className="joystick" onTouchStart={moveTouch} onTouchMove={moveTouch} onTouchEnd={()=>move(0,0)}><div className="stick"/></div>
    <div className="lookZone" onTouchStart={start} onTouchMove={drag} onTouchEnd={()=>last.current=null}/>
  </div>
}

function World({mode,player,onLose,onWin,cameraSensitivity=1,difficulty='normal'}){
  const running=mode==='play'||mode==='practice'
  const cameraRef=useRef()
  const touchLook=useRef(null)
  const grannyPosition=useRef(new THREE.Vector3(-5.4,0,3.6))
  const [visionBlur,setVisionBlur]=useState(0)
  const [tick,setTick]=useState(0)
  useEffect(()=>{
    const id=setInterval(()=>setTick(v=>v+1),80)
    return()=>clearInterval(id)
  },[])
  useEffect(()=>{
    if(!running)return
    const d=Math.hypot(player.current.x+5.4,player.current.z-3.6)
    if(d<1.0)onLose()
    if(player.current.z>7.15&&Math.abs(player.current.x)<1.35)onWin()
    if(difficulty==='extreme'&&mode==='play'){
      const intensity=clamp((8.5-d)/7.0,0,1)
      setVisionBlur(intensity)
    }else setVisionBlur(0)
  },[tick,running,onLose,onWin,player,difficulty,mode])
  const touchMove=(x,y)=>{
    const c=cameraRef.current
    if(!c)return
    const f=new THREE.Vector3(0,0,-1).applyQuaternion(c.quaternion);f.y=0;f.normalize()
    const r=new THREE.Vector3(1,0,0).applyQuaternion(c.quaternion);r.y=0;r.normalize()
    const next=c.position.clone().addScaledVector(r,x*.12).addScaledVector(f,-y*.12)
    next.y=1.62
    if(!Collision(next)){
      c.position.copy(next)
      player.current.copy(c.position)
    }
  }
  return <div className="world">
    <Canvas shadows dpr={[1,1.7]} gl={{antialias:true}} camera={{fov:68,near:.05,far:90}}>
      <PerspectiveCamera ref={cameraRef} makeDefault position={START} fov={68} near={.05} far={90}/>
      <color attach="background" args={['#0a0908']}/>
      <fog attach="fog" args={['#0a0908',18,42]}/>
      <ambientLight intensity={.38}/>
      <directionalLight castShadow position={[-6,10,5]} intensity={1.25} shadow-mapSize={[2048,2048]}/>
      <pointLight position={[0,2.3,4.5]} intensity={5} distance={9} color="#d1a36c"/>
      <House/>
      <Granny player={player} active={mode==='play'} difficulty={difficulty} positionRef={grannyPosition}/>
      <Player running={running} onMove={p=>player.current.copy(p)}/>
      <CameraController running={running} touchLook={touchLook} sensitivity={cameraSensitivity}/>
      <Environment preset="warehouse"/>
    </Canvas>
    {running&&<div className="crosshair">+</div>}
    {running&&difficulty==='extreme'&&<div className="extremeVision" style={{opacity:.18+.52*visionBlur,backdropFilter:'blur('+(1+visionBlur*6)+'px)'}}/>}
    {running&&<div className="gameHud"><span>GRANNY</span><span>{mode==='practice'?'PRACTICE':'NIGHT 1 · '+difficulty.toUpperCase()}</span><small>WASD / arrows · SHIFT · drag to look</small></div>}
    {running&&<TouchControls move={touchMove} look={(dx,dy)=>{touchLook.current={dx,dy}}}/>}
  </div>
}

function Granny({player,active,difficulty='normal',positionRef}){
  const ref=useRef()
  useFrame((_,dt)=>{
    if(!ref.current)return
    positionRef?.current.copy(ref.current.position)
    if(!active)return
    const p=ref.current.position,dx=player.current.x-p.x,dz=player.current.z-p.z,d=Math.hypot(dx,dz)
    if(d<10&&d>.9){
      const step=({easy:0.72,normal:1.02,hard:1.32,extreme:1.65}[difficulty]||1.02)*dt
      const nextX=p.x+dx/d*step,nextZ=p.z+dz/d*step
      if(!Collision({x:nextX,z:nextZ},p)){p.x=nextX;p.z=nextZ}
      ref.current.rotation.y=Math.atan2(dx,dz)
    }
  })
  return <group ref={ref} position={[-5.4,0,3.6]}>
    <Box p={[0,1.2,0]} s={[.7,2,.48]} c="#d8cdc3"/>
    <mesh position={[0,2.45,0]}><sphereGeometry args={[.42,20,16]}/><meshStandardMaterial color="#d8cdc3"/></mesh>
    <Box p={[0,1.55,-.28]} s={[.84,.82,.1]} c="#8e2026"/>
    <Box p={[-.19,2.55,-.39]} s={[.07,.08,.035]} c="#111"/>
    <Box p={[.19,2.55,-.39]} s={[.07,.08,.035]} c="#111"/>
    <Box p={[0,2.84,0]} s={[.86,.16,.5]} c="#2e2620"/>
  </group>
}

function Menu({onPlay,onPractice,onSettings,onDifficulty,difficulty}){
  return <div className="menu">
    <div className="menuScene"><div className="vignette"/></div>
    <div className="menuCard">
      <div className="mini">SR HOLLOW · CLASSIC HOUSE</div>
      <h1>GRANNY</h1>
      <div className="version">1.0</div>
      <div className="menuButtons">
        <button onClick={onPlay}>PLAY</button>
        <button onClick={onPractice}>PRACTICE</button>
        <button className="ghost" onClick={onSettings}>SETTINGS</button>
      </div>
      <p>Five nights. One house. Find the way out.</p>
    </div>
  </div>
}

function Difficulty({difficulty,setDifficulty,onBack}){
  const choices=[['easy','EASY','Granny moves slower.'],['normal','NORMAL','Classic pace.'],['hard','HARD','Granny moves faster.'],['extreme','EXTREME','Fastest chase.']]
  return <div className="pregame"><div className="preBox">
    <div className="preKicker">DIFFICULTY</div>
    <h2>CHOOSE YOUR NIGHT</h2>
    <p>The difficulty changes Granny's chase speed. Practice mode ignores the chase.</p>
    <div className="difficultyList">{choices.map(([id,name,desc])=><button key={id} className={difficulty===id?'selected':''} onClick={()=>setDifficulty(id)}><strong>{name}</strong><span>{desc}</span></button>)}</div>
    <button onClick={onBack}>BACK</button>
  </div></div>
}

function Settings({sensitivity,setSensitivity,onBack}){
  return <div className="pregame">
    <div className="preBox">
      <div className="preKicker">SETTINGS</div>
      <h2>GAME SETTINGS</h2>
      <p>Adjust the camera before entering the house. The setting is saved for this session.</p>
      <div className="controls"><span>CAMERA {Math.round(sensitivity*100)}%</span></div>
      <input aria-label="Camera sensitivity" type="range" min="0.5" max="1.8" step="0.1" value={sensitivity} onChange={e=>setSensitivity(Number(e.target.value))} style={{width:'100%',accentColor:'#ded3c1'}}/>
      <div style={{display:'flex',gap:8,marginTop:18}}>
        <button onClick={onBack}>BACK</button>
        <button className="ghost" onClick={()=>setSensitivity(1)}>RESET</button>
      </div>
    </div>
  </div>
}

function PreGame({onStart,practice}){
  return <div className="pregame">
    <div className="preBox">
      <div className="preKicker">{practice?'PRACTICE':'NIGHT 1'}</div>
      <h2>{practice?'PRACTICE MODE':'THE HOUSE IS QUIET'}</h2>
      <p>{practice?'Explore the house without the chase.':'You wake up in the upstairs bedroom. The front door is locked. Get out before Granny finds you.'}</p>
      <div className="controls"><span>WASD</span><span>LOOK</span><span>SHIFT</span><span>TOUCH</span></div>
      <button onClick={onStart}>ENTER THE HOUSE</button>
    </div>
  </div>
}

function App(){
  const [screen,setScreen]=useState('menu')
  const [practice,setPractice]=useState(false)
  const [key,setKey]=useState(0)
  const [cameraSensitivity,setCameraSensitivity]=useState(1)
  const [difficulty,setDifficulty]=useState('normal')
  const player=useRef(new THREE.Vector3(...START))

  const start=(p)=>{
    setPractice(p)
    setScreen('pregame')
  }

  const play=()=>{
    player.current.set(...START)
    setKey(k=>k+1)
    setScreen('play')
  }

  const backToMenu=()=>setScreen('menu')

  return <div className="app">
    {screen==='menu'&&<Menu onPlay={()=>start(false)} onPractice={()=>start(true)} onSettings={()=>setScreen('settings')} onDifficulty={()=>setScreen('difficulty')} difficulty={difficulty}/>}
    {screen==='settings'&&<Settings sensitivity={cameraSensitivity} setSensitivity={setCameraSensitivity} onBack={backToMenu}/>} 
    {screen==='difficulty'&&<Difficulty difficulty={difficulty} setDifficulty={setDifficulty} onBack={backToMenu}/>} 
    {screen==='pregame'&&<PreGame practice={practice} onStart={play}/>}
    {(screen==='play'||screen==='lose'||screen==='win')&&
      <World
        key={key}
        mode={screen==='play'?(practice?'practice':'play'):screen}
        player={player}
        cameraSensitivity={cameraSensitivity} difficulty={difficulty}
        onLose={()=>setScreen('lose')}
        onWin={()=>setScreen('win')}
      />
    }
    {screen==='lose'&&<div className="result"><div><small>GAME OVER</small><h2>GRANNY FOUND YOU</h2><button onClick={play}>TRY AGAIN</button><button className="ghost" onClick={backToMenu}>MAIN MENU</button></div></div>}
    {screen==='win'&&<div className="result success"><div><small>ESCAPED</small><h2>YOU GOT OUT</h2><button onClick={backToMenu}>MAIN MENU</button></div></div>}
  </div>
}

createRoot(document.getElementById('root')).render(<App/>)
