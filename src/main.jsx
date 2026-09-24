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

function House(){
  const outer=[
    <Box key="north" p={[0,1.5,-7.5]} s={[15,.3,15*0+ .3]} c="#5a5147"/>,
    <Box key="west" p={[-7.5,1.5,0]} s={[.3,3.0,15]} c="#5a5147"/>,
    <Box key="east" p={[7.5,1.5,0]} s={[.3,3.0,15]} c="#5a5147"/>,
    <Box key="southL" p={[-5.2,1.5,7.5]} s={[4.6,3,.3]} c="#5a5147"/>,
    <Box key="southR" p={[5.2,1.5,7.5]} s={[4.6,3,.3]} c="#5a5147"/>
  ]
  return <group>
    {outer}
    <Box p={[0,-.12,0]} s={[15,.22,15]} c="#29241f"/>
    <Box p={[0,3.05,0]} s={[15,.25,15]} c="#302a24"/>
    <Box p={[-3.65,1.5,-1.25]} s={[.28,3,8.1]} c="#67594c"/>
    <Box p={[3.65,1.5,-1.25]} s={[.28,3,8.1]} c="#67594c"/>
    <Box p={[0,1.5,2.85]} s={[7.3,3,.28]} c="#67594c"/>
    <Box p={[-5.15,1.5,4.75]} s={[4.5,3,.28]} c="#67594c"/>
    <Box p={[5.15,1.5,4.75]} s={[4.5,3,.28]} c="#67594c"/>
    <Door p={[0,1.3,7.34]} exit/>
    <Door p={[-6.8,1.3,-1.8]} rot={Math.PI/2}/>
    <Door p={[6.8,1.3,2.2]} rot={Math.PI/2}/>
    <Furniture/>
    <group position={[5.2,0,2.65]}>
      {Array.from({length:8},(_,i)=><Box key={i} p={[-i*.48,.28+i*.34,0]} s={[2.7,.52,1.75]} c="#59483a"/>)}
    </group>
    <group position={[-5.9,0,-1.8]}>
      {Array.from({length:5},(_,i)=><Box key={i} p={[0,.28+i*.32,0]} s={[1.4,.5,1.4]} c="#40352c"/>)}
    </group>
    <Lamp p={[-1.3,2.55,-5.9]}/><Lamp p={[5.5,2.55,-1.2]}/><Lamp p={[-5.6,2.55,3.1]}/>
  </group>
}

function Collision({pos,old}){
  const x=pos.x,z=pos.z
  const walls=[
    [-7.0,7.0,.25,14], [7.0,7.0,.25,14], [7.0,-7.0,.25,14],[-7.0,-7.0,.25,14],
    [-3.65,-1.25,.3,8.1],[3.65,-1.25,.3,8.1],[0,2.85,7.3,.3],
    [-5.15,4.75,4.5,.3],[5.15,4.75,4.5,.3]
  ]
  for(const [wx,wz,ww,wd] of walls){
    const nearX=Math.abs(x-wx)<ww/2+.28
    const nearZ=Math.abs(z-wz)<wd/2+.28
    if(nearX&&nearZ)return true
  }
  return false
}

function Player({running,onMove}){
  const keys=useRef({}),{camera}=useThree()
  useEffect(()=>{
    const d=e=>{keys.current[e.code]=true;if(e.code==='ShiftLeft'||e.code==='ShiftRight')e.preventDefault()}
    const u=e=>keys.current[e.code]=false
    addEventListener('keydown',d);addEventListener('keyup',u)
    return()=>{removeEventListener('keydown',d);removeEventListener('keyup',u)}
  },[])
  useFrame((_,dt)=>{
    if(!running)return
    const k=keys.current
    let x=(k.KeyD?1:0)-(k.KeyA?1:0),z=(k.KeyS?1:0)-(k.KeyW?1:0)
    if(!x&&!z)return
    const len=Math.hypot(x,z)
    const speed=(k.ShiftLeft||k.ShiftRight?3.9:2.55)*dt
    const forward=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);forward.y=0;forward.normalize()
    const right=new THREE.Vector3(1,0,0).applyQuaternion(camera.quaternion);right.y=0;right.normalize()
    const next=camera.position.clone().addScaledVector(right,x/len*speed).addScaledVector(forward,-z/len*speed)
    next.y=1.62
    next.x=clamp(next.x,-6.65,6.65);next.z=clamp(next.z,-6.65,6.65)
    if(!Collision({x:next.x,z:next.z},camera.position))camera.position.copy(next)
    onMove(camera.position)
  })
  return null
}

function CameraController({running,touchLook,sensitivity=1}){
  const {camera,gl}=useThree()
  const yaw=useRef(0),pitch=useRef(0),drag=useRef(null)

  useEffect(()=>{
    camera.rotation.order='YXZ'
    camera.rotation.set(0,0,0)

    const down=e=>{
      if(!running)return
      if(e.pointerType==='mouse'&&e.button!==0)return
      drag.current={x:e.clientX,y:e.clientY}
      try{gl.domElement.setPointerCapture(e.pointerId)}catch{}
    }
    const move=e=>{
      if(!drag.current)return
      const dx=e.clientX-drag.current.x
      const dy=e.clientY-drag.current.y
      drag.current={x:e.clientX,y:e.clientY}
      yaw.current-=dx*.0022*sensitivity
      pitch.current=clamp(pitch.current-dy*.0018*sensitivity,-1.35,1.35)
    }
    const up=()=>{drag.current=null}
    gl.domElement.addEventListener('pointerdown',down)
    gl.domElement.addEventListener('pointermove',move)
    gl.domElement.addEventListener('pointerup',up)
    gl.domElement.addEventListener('pointercancel',up)
    return()=>{
      gl.domElement.removeEventListener('pointerdown',down)
      gl.domElement.removeEventListener('pointermove',move)
      gl.domElement.removeEventListener('pointerup',up)
      gl.domElement.removeEventListener('pointercancel',up)
    }
  },[running,gl,camera])

  useFrame(()=>{
    if(touchLook.current){
      yaw.current-=touchLook.current.dx*.0022*sensitivity
      pitch.current=clamp(pitch.current-touchLook.current.dy*.0018*sensitivity,-1.35,1.35)
      touchLook.current=null
    }
    camera.rotation.set(pitch.current,yaw.current,0)
  })
  return null
}
function Granny({player,active,difficulty='normal'}){
  const ref=useRef()
  useFrame((_,dt)=>{
    if(!active||!ref.current)return
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

function TouchControls({move,look}){
  const joy=useRef(null),last=useRef(null)
  const moveTouch=e=>{
    e.preventDefault();const t=e.touches[0],r=joy.current?.getBoundingClientRect();if(!t||!r)return
    move(clamp((t.clientX-(r.left+r.width/2))/(r.width*.38),-1,1),clamp((t.clientY-(r.top+r.height/2))/(r.height*.38),-1,1))
  }
  const start=e=>{const t=e.touches[0];if(t)last.current={x:t.clientX,y:t.clientY}}
  const drag=e=>{e.preventDefault();const t=e.touches[0];if(!t||!last.current)return;look(t.clientX-last.current.x,t.clientY-last.current.y);last.current={x:t.clientX,y:t.clientY}}
  return <div className="touchControls">
    <div ref={joy} className="joystick" onTouchStart={moveTouch} onTouchMove={moveTouch} onTouchEnd={()=>move(0,0)}><div className="stick"/></div>
    <div className="lookZone" onTouchStart={start} onTouchMove={drag} onTouchEnd={()=>last.current=null}/>
  </div>
}

function World({mode,player,onLose,onWin,cameraSensitivity=1,difficulty='normal'}){
  const running=mode==='play'||mode==='practice'
  const cameraRef=useRef()
  const touchLook=useRef(null)
  const [tick,setTick]=useState(0)
  useEffect(()=>{const id=setInterval(()=>setTick(v=>v+1),100);return()=>clearInterval(id)},[])
  useEffect(()=>{
    if(!running)return
    const d=Math.hypot(player.current.x+5.4,player.current.z-3.6)
    if(d<1.0)onLose()
    if(player.current.z>6.8&&Math.abs(player.current.x)<2.0)onWin()
  },[tick,running,onLose,onWin,player])
  return <div className="world">
    <Canvas shadows dpr={[1,1.7]} gl={{antialias:true}}>
      <PerspectiveCamera ref={cameraRef} makeDefault position={START} fov={68} near={.05} far={80}/>
      <color attach="background" args={['#090807']}/>
      <fog attach="fog" args={['#090807',12,30]}/>
      <ambientLight intensity={.28}/>
      <directionalLight castShadow position={[-5,9,4]} intensity={1.1} shadow-mapSize={[2048,2048]}/>
      <pointLight position={[0,2,-1]} intensity={4.5} distance={8} color="#c79e6c"/>
      <House/>
      <Granny player={player} active={mode==='play'} difficulty={difficulty}/>
      <Player running={running} onMove={p=>player.current.copy(p)}/>
      <CameraController running={running} touchLook={touchLook} sensitivity={cameraSensitivity}/>
      <Environment preset="warehouse"/>
    </Canvas>
    {running&&<div className="gameHud"><span>GRANNY</span><span>{mode==='practice'?'PRACTICE':'NIGHT 1'}</span><small>WASD / tocar · arrastra para mirar</small></div>}
    {running&&<TouchControls move={(x,y)=>{const c=cameraRef.current;if(!c)return;const forward=new THREE.Vector3(0,0,-1).applyQuaternion(c.quaternion);forward.y=0;forward.normalize();const right=new THREE.Vector3(1,0,0).applyQuaternion(c.quaternion);right.y=0;right.normalize();const next=c.position.clone().addScaledVector(right,x*.045).addScaledVector(forward,-y*.045);next.x=clamp(next.x,-6.65,6.65);next.z=clamp(next.z,-6.65,6.65);if(!Collision(next,c.position))c.position.copy(next);player.current.copy(c.position)}} look={(dx,dy)=>{touchLook.current={dx,dy}}}/>}
  </div>
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
