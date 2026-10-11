import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.166.1/build/three.module.js';

const canvas = document.querySelector('#game');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x91c8d8);
scene.fog = new THREE.FogExp2(0x9bcbd8, 0.0019);

const camera = new THREE.PerspectiveCamera(56, innerWidth/innerHeight, 0.1, 1500);
camera.position.set(0, 5.4, 10.8);

const renderer = new THREE.WebGLRenderer({canvas, antialias:true, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

scene.add(new THREE.HemisphereLight(0xd8f7ff, 0x17445c, 1.55));
const sunLight = new THREE.DirectionalLight(0xffedca, 2.8);
sunLight.position.set(-40, 65, 20);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(1024,1024);
sunLight.shadow.camera.left=-35; sunLight.shadow.camera.right=35;
sunLight.shadow.camera.top=35; sunLight.shadow.camera.bottom=-35;
scene.add(sunLight);

// Distant sun and soft atmospheric halo
const sun = new THREE.Mesh(new THREE.SphereGeometry(5.2,32,24), new THREE.MeshBasicMaterial({color:0xffedc8}));
sun.position.set(-42,28,-255); scene.add(sun);
const halo = new THREE.Mesh(new THREE.SphereGeometry(8,32,24), new THREE.MeshBasicMaterial({color:0xffd8a0,transparent:true,opacity:.12,depthWrite:false}));
halo.position.copy(sun.position); scene.add(halo);

// Procedural ocean: dense grid + animated vertex waves + glossy blue material
const oceanGeo = new THREE.PlaneGeometry(1200,1200,240,240);
oceanGeo.rotateX(-Math.PI/2);
const pos = oceanGeo.attributes.position;
const oceanMat = new THREE.MeshStandardMaterial({
  color:0x087f9f, roughness:.27, metalness:.16,
  flatShading:false, side:THREE.DoubleSide
});
const ocean = new THREE.Mesh(oceanGeo,oceanMat);
ocean.position.y=-.38; ocean.receiveShadow=true; scene.add(ocean);
const basePositions = new Float32Array(pos.array);
const waveNormals = new THREE.Vector3();
function waveHeight(x,z,t){
  return Math.sin(x*.047+t*1.15)*.16 +
         Math.sin(z*.061-t*.82)*.13 +
         Math.sin((x+z)*.032+t*.55)*.23 +
         Math.sin(x*.12-z*.08+t*1.8)*.045;
}
function updateOcean(t){
  for(let i=0;i<pos.count;i++){
    const x=basePositions[i*3], z=basePositions[i*3+2];
    pos.array[i*3+1]=waveHeight(x,z,t);
  }
  pos.needsUpdate=true; oceanGeo.computeVertexNormals();
}

// Underwater/distant atmospheric bands
const horizonGlow = new THREE.Mesh(new THREE.PlaneGeometry(1200,95),new THREE.MeshBasicMaterial({color:0xd1e9e6,transparent:true,opacity:.11,depthWrite:false}));
horizonGlow.position.set(0,8,-210); scene.add(horizonGlow);

// A few very distant cloud forms made from free procedural geometry
const cloudMat = new THREE.MeshStandardMaterial({color:0xf4f8f4,transparent:true,opacity:.28,roughness:1,depthWrite:false});
for(let c=0;c<12;c++){
  const cloud = new THREE.Group();
  const x=(Math.random()-.5)*550, z=-140-Math.random()*230, y=35+Math.random()*32;
  for(let j=0;j<5;j++){
    const puff=new THREE.Mesh(new THREE.SphereGeometry(5+Math.random()*7,12,8),cloudMat);
    puff.position.set(j*8-16,Math.random()*2,Math.random()*4);
    puff.scale.y=.36; cloud.add(puff);
  }
  cloud.position.set(x,y,z); cloud.scale.setScalar(.65+Math.random()*.8); scene.add(cloud);
}

// Surfboard with a gently curved silhouette, made entirely from geometry
const boardGroup = new THREE.Group();
const boardShape = new THREE.Shape();
boardShape.moveTo(0,2.5);
boardShape.quadraticCurveTo(.58,1.9,.55,.6);
boardShape.quadraticCurveTo(.48,-1.2,.27,-2.35);
boardShape.quadraticCurveTo(0,-2.85,-.27,-2.35);
boardShape.quadraticCurveTo(-.48,-1.2,-.55,.6);
boardShape.quadraticCurveTo(-.58,1.9,0,2.5);
const boardGeo = new THREE.ExtrudeGeometry(boardShape,{depth:.11,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.07,bevelThickness:.06});
boardGeo.rotateX(-Math.PI/2);
const boardMat = new THREE.MeshStandardMaterial({color:0xf0e7d5,roughness:.31,metalness:.06});
const board = new THREE.Mesh(boardGeo,boardMat);
board.scale.set(.8,.8,.8); board.position.y=.06; board.castShadow=true; board.receiveShadow=true;
boardGroup.add(board);
const stripe = new THREE.Mesh(new THREE.BoxGeometry(.055,.025,2.45),new THREE.MeshStandardMaterial({color:0x2c9ba7,roughness:.4}));
stripe.position.set(0,.17,0); boardGroup.add(stripe);
const boardRim = new THREE.Mesh(new THREE.BoxGeometry(.67,.028,.045),new THREE.MeshStandardMaterial({color:0xefa86d,roughness:.4}));
boardRim.position.set(0,.16,-1.35); boardGroup.add(boardRim);

// Stylized surfer: no external model required
const surfer = new THREE.Group();
const skinMat=new THREE.MeshStandardMaterial({color:0xc98f69,roughness:.75});
const suitMat=new THREE.MeshStandardMaterial({color:0x123e55,roughness:.65});
const suitLight=new THREE.MeshStandardMaterial({color:0x4c9ba7,roughness:.6});
const head = new THREE.Mesh(new THREE.SphereGeometry(.19,20,16),skinMat); head.position.y=1.44; surfer.add(head);
const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.17,.43,5,10),suitMat); torso.position.y=.98; torso.rotation.z=-.08; surfer.add(torso);
const hips = new THREE.Mesh(new THREE.BoxGeometry(.38,.18,.22),suitMat); hips.position.y=.68; surfer.add(hips);
function limb(a,b,r,mat){
  const start=new THREE.Vector3(...a), end=new THREE.Vector3(...b);
  const d=end.clone().sub(start);
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r*.75,r,d.length(),10),mat);
  mesh.position.copy(start).add(end).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());
  mesh.castShadow=true; surfer.add(mesh); return mesh;
}
const leftArm=limb([-.14,1.14,0],[-.48,.91,-.05],.075,skinMat);
const rightArm=limb([.14,1.14,0],[.48,.91,-.05],.075,skinMat);
limb([-.12,.65,0],[-.2,.24,.12],.09,suitMat);
limb([.12,.65,0],[.2,.24,-.12],.09,suitMat);
const leftFoot=new THREE.Mesh(new THREE.BoxGeometry(.13,.07,.23),skinMat); leftFoot.position.set(-.2,.2,.16); surfer.add(leftFoot);
const rightFoot=leftFoot.clone(); rightFoot.position.set(.2,.2,-.15); surfer.add(rightFoot);
const hair=new THREE.Mesh(new THREE.SphereGeometry(.2,16,12,0,Math.PI*2,0,Math.PI*.55),new THREE.MeshStandardMaterial({color:0x332b2a,roughness:.9}));
hair.position.y=1.5; surfer.add(hair);
surfer.scale.setScalar(.9); surfer.position.y=.2;
boardGroup.add(surfer);
boardGroup.position.set(0,.08,1.4); scene.add(boardGroup);

// A subtle spray trail using low-cost translucent particles
const sprayCount=100;
const sprayGeo=new THREE.BufferGeometry();
const sprayPositions=new Float32Array(sprayCount*3);
const spraySizes=new Float32Array(sprayCount);
for(let i=0;i<sprayCount;i++){sprayPositions[i*3]=(Math.random()-.5)*1.4;sprayPositions[i*3+1]=Math.random()*.7;sprayPositions[i*3+2]=1.5+Math.random()*4;spraySizes[i]=Math.random();}
sprayGeo.setAttribute('position',new THREE.BufferAttribute(sprayPositions,3));
const sprayMat=new THREE.PointsMaterial({color:0xd8fbff,size:.065,transparent:true,opacity:.5,depthWrite:false,sizeAttenuation:true});
const spray=new THREE.Points(sprayGeo,sprayMat); boardGroup.add(spray);

// State and UI
const $=s=>document.querySelector(s);
let started=false, paused=false, soundOn=true, elapsed=0, distance=0, speed=12, steer=0, targetSteer=0, forwardInput=0;
let lastTime=performance.now(), toastTimer=0, audioCtx=null, masterGain=null, waveNoise=null, noiseGain=null, filter=null;
const keys={};
function showToast(text){const el=$('#toast');el.textContent=text;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2200);}
function formatTime(s){const m=Math.floor(s/60).toString().padStart(2,'0');const sec=Math.floor(s%60).toString().padStart(2,'0');return `${m}:${sec}`;}
function updateHud(){
  $('#distance').textContent=`${Math.floor(distance)} m`;
  $('#timer').textContent=formatTime(elapsed);
  $('#speed').textContent=`${Math.round(speed)} km/h`;
}
function initAudio(){
  if(audioCtx){if(audioCtx.state==='suspended')audioCtx.resume();return;}
  const AC=window.AudioContext||window.webkitAudioContext;
  if(!AC){showToast('Trình duyệt này chưa hỗ trợ âm thanh Web Audio.');return;}
  audioCtx=new AC(); masterGain=audioCtx.createGain();masterGain.gain.value=soundOn?.28:0;masterGain.connect(audioCtx.destination);
  // Soft filtered noise resembles wind and distant surf; generated locally, no asset download.
  const buffer=audioCtx.createBuffer(1,audioCtx.sampleRate*3,audioCtx.sampleRate);
  const data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.65;
  waveNoise=audioCtx.createBufferSource();waveNoise.buffer=buffer;waveNoise.loop=true;
  filter=audioCtx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=420;filter.Q.value=.4;
  noiseGain=audioCtx.createGain();noiseGain.gain.value=.22;
  waveNoise.connect(filter);filter.connect(noiseGain);noiseGain.connect(masterGain);waveNoise.start();
  const osc=audioCtx.createOscillator(), og=audioCtx.createGain();
  osc.type='sine';osc.frequency.value=82;og.gain.value=.022;osc.connect(og);og.connect(masterGain);osc.start();
}
function toggleSound(){
  soundOn=!soundOn;
  if(audioCtx&&masterGain)masterGain.gain.setTargetAtTime(soundOn?.28:0,audioCtx.currentTime,.12);
  $('#soundBtn').textContent=soundOn?'♫':'♪';
  showToast(soundOn?'Đã bật âm thanh biển.':'Đã tắt âm thanh.');
}
function setPaused(v){
  if(!started)return;
  paused=v;$('#pauseScreen').classList.toggle('hidden',!paused);
  $('#pauseBtn').textContent=paused?'▶':'Ⅱ';
  if(!paused)lastTime=performance.now();
}
function resetRun(){
  elapsed=0;distance=0;speed=12;steer=0;targetSteer=0;forwardInput=0;
  boardGroup.position.set(0,.08,1.4);boardGroup.rotation.set(0,0,0);
  camera.position.set(0,5.4,10.8);camera.lookAt(0,1,-7);
  updateHud();paused=false;started=true;
  $('#pauseScreen').classList.add('hidden');$('#startScreen').classList.add('hidden');
  $('#hint').style.opacity='1';setTimeout(()=>$('#hint').style.opacity='.25',7000);
  initAudio();showToast('Chúc bạn có một hành trình thật bình yên.');
}
$('#startBtn').addEventListener('click',resetRun);
$('#resumeBtn').addEventListener('click',()=>setPaused(false));
$('#restartBtn').addEventListener('click',resetRun);
$('#pauseBtn').addEventListener('click',()=>setPaused(!paused));
$('#soundBtn').addEventListener('click',()=>{initAudio();toggleSound();});
window.addEventListener('keydown',e=>{
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();
  keys[e.key.toLowerCase()]=true;
  if(e.code==='Space'&&!e.repeat&&started)setPaused(!paused);
  if(e.key.toLowerCase()==='m'&&!e.repeat)toggleSound();
});
window.addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});

// Touch joystick
const stickArea=$('#stickArea'), stickKnob=$('#stickKnob');
let stickPointer=null, stickX=0, stickY=0;
function updateStick(e){
  const r=stickArea.getBoundingClientRect(), cx=r.left+r.width/2, cy=r.top+r.height/2;
  let dx=e.clientX-cx,dy=e.clientY-cy;const max=34,len=Math.hypot(dx,dy);
  if(len>max){dx=dx/len*max;dy=dy/len*max;}
  stickX=dx/max;stickY=dy/max;
  stickKnob.style.transform=`translate(${dx}px,${dy}px)`;
}
stickArea.addEventListener('pointerdown',e=>{stickPointer=e.pointerId;stickArea.setPointerCapture(e.pointerId);updateStick(e);});
stickArea.addEventListener('pointermove',e=>{if(stickPointer===e.pointerId)updateStick(e);});
function releaseStick(){stickPointer=null;stickX=0;stickY=0;stickKnob.style.transform='translate(0,0)';}
stickArea.addEventListener('pointerup',releaseStick);stickArea.addEventListener('pointercancel',releaseStick);
let brakeHeld=false,boostHeld=false;
function holdButton(el,setter){el.addEventListener('pointerdown',e=>{e.preventDefault();setter(true);el.setPointerCapture(e.pointerId);});el.addEventListener('pointerup',()=>setter(false));el.addEventListener('pointercancel',()=>setter(false));el.addEventListener('lostpointercapture',()=>setter(false));}
holdButton($('#brakeTouch'),v=>brakeHeld=v);holdButton($('#boostTouch'),v=>boostHeld=v);

function animate(now){
  requestAnimationFrame(animate);
  const dt=Math.min((now-lastTime)/1000,.04);lastTime=now;
  const t=now*.001;
  updateOcean(t);
  if(started&&!paused){
    elapsed+=dt;
    const left=keys.a||keys.arrowleft, right=keys.d||keys.arrowright;
    const forward=keys.w||keys.arrowup||boostHeld||stickY<-.25;
    const backward=keys.s||keys.arrowdown||brakeHeld||stickY>.35;
    targetSteer=(right?1:0)-(left?1:0);
    if(stickPointer!==null)targetSteer=THREE.MathUtils.clamp(stickX,-1,1);
    steer=THREE.MathUtils.damp(steer,targetSteer,4.2,dt);
    const desired=forward?(backward?12:24):backward?6:14;
    speed=THREE.MathUtils.damp(speed,desired,1.5,dt);
    distance+=speed/3.6*dt;
    boardGroup.position.x=THREE.MathUtils.damp(boardGroup.position.x,steer*4.2,1.7,dt);
    boardGroup.position.y=.08+waveHeight(boardGroup.position.x,boardGroup.position.z,t)+Math.sin(t*2.4)*.035;
    boardGroup.rotation.z=THREE.MathUtils.damp(boardGroup.rotation.z,-steer*.2,2.8,dt);
    boardGroup.rotation.x=Math.sin(t*1.7+boardGroup.position.x*.2)*.025;
    boardGroup.rotation.y=steer*.12;
    surfer.rotation.z=Math.sin(t*2.1)*.035-steer*.08;
    leftArm.rotation.z=-steer*.1;rightArm.rotation.z=steer*.1;
    // Camera glides behind the board with slight lateral anticipation.
    const camX=boardGroup.position.x*.58+steer*.35;
    camera.position.x=THREE.MathUtils.damp(camera.position.x,camX,1.1,dt);
    camera.position.y=THREE.MathUtils.damp(camera.position.y,5.2+Math.sin(t*1.2)*.09,1.2,dt);
    camera.position.z=THREE.MathUtils.damp(camera.position.z,10.8,1.2,dt);
    camera.lookAt(boardGroup.position.x*.35,1.0,-8);
    if(audioCtx&&filter){filter.frequency.setTargetAtTime(330+speed*11,audioCtx.currentTime,.25);noiseGain.gain.setTargetAtTime(.15+speed/140,audioCtx.currentTime,.3);}
    updateHud();
  } else {
    camera.position.y=THREE.MathUtils.damp(camera.position.y,5.4+Math.sin(t*.25)*.16,.35,dt);
    camera.lookAt(0,1,-8);
    boardGroup.position.y=.08+waveHeight(0,boardGroup.position.z,t)+Math.sin(t*1.4)*.04;
    boardGroup.rotation.z=Math.sin(t*.5)*.025;
  }
  // Move particle spray subtly backwards to imply forward motion.
  const arr=sprayGeo.attributes.position.array;
  for(let i=0;i<sprayCount;i++){
    arr[i*3+2]+=(.9+speed*.025)*dt;
    if(arr[i*3+2]>5){arr[i*3+2]=1.5+Math.random()*1.3;arr[i*3]=(Math.random()-.5)*1.2;arr[i*3+1]=Math.random()*.6;}
  }
  sprayGeo.attributes.position.needsUpdate=true;
  renderer.render(scene,camera);
}
requestAnimationFrame(animate);
window.addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));
});
