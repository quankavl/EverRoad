import * as THREE from 'three';

const canvas = document.querySelector('#game-canvas');
const ui = {
  loading: document.querySelector('#loading-screen'),
  welcome: document.querySelector('#welcome-panel'),
  pause: document.querySelector('#pause-panel'),
  start: document.querySelector('#start-button'),
  resume: document.querySelector('#resume-button'),
  restart: document.querySelector('#restart-button'),
  pauseButton: document.querySelector('#pause-button'),
  sound: document.querySelector('#sound-toggle'),
  distance: document.querySelector('#distance'),
  elapsed: document.querySelector('#elapsed'),
  pace: document.querySelector('#pace'),
  worldTime: document.querySelector('#world-time'),
  weatherIcon: document.querySelector('#weather-icon'),
  weatherLabel: document.querySelector('#weather-label'),
  tip: document.querySelector('#tip-text'),
  toast: document.querySelector('#toast'),
  left: document.querySelector('#left-button'),
  right: document.querySelector('#right-button')
};

let scene, camera, renderer, clock;
let player, playerParts = {}, roadPieces = [], scenery = [];
let running = false, started = false, soundOn = true;
let lane = 0, targetX = 0, distance = 0, elapsed = 0, worldClock = 7.5;
let speed = 8.5, animationTime = 0, toastTimer = 0, audioCtx = null, masterGain = null;
const laneX = [-1.65, 0, 1.65];
const ROAD_LENGTH = 34;
const tips = [
  'Thả lỏng vai và tận hưởng khung cảnh.',
  'Hít vào nhẹ nhàng, thở ra thật chậm.',
  'Hãy để nhịp bước tìm thấy sự bình yên.',
  'Không cần vội. Đây là hành trình của bạn.',
  'Nhìn về phía trước và tận hưởng từng khoảnh khắc.'
];

init();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xb6cbd0);
  scene.fog = new THREE.FogExp2(0xc4d1cf, 0.0125);
  camera = new THREE.PerspectiveCamera(57, innerWidth / innerHeight, 0.1, 260);
  camera.position.set(0, 4.4, 9.8);
  camera.lookAt(0, 1.2, -4);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.7));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  const hemi = new THREE.HemisphereLight(0xdcecf0, 0x68745e, 2.0);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe2b6, 3.0);
  sun.position.set(-14, 24, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -22; sun.shadow.camera.right = 22;
  sun.shadow.camera.top = 28; sun.shadow.camera.bottom = -22;
  sun.shadow.bias = -0.0004;
  scene.add(sun);
  scene.userData.sun = sun;
  scene.userData.hemi = hemi;

  makeEnvironment();
  player = makeRunner();
  player.position.set(0, 0, 2.2);
  scene.add(player);
  clock = new THREE.Clock();

  addEventListeners();
  updateLighting(7.5);
  animate();
  setTimeout(() => ui.loading.classList.add('done'), 700);
}

function mat(color, roughness=0.85, metalness=0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}
function mesh(geometry, material, x=0, y=0, z=0, parent=scene) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(x,y,z);
  m.castShadow = true; m.receiveShadow = true;
  parent.add(m); return m;
}

function makeEnvironment() {
  const groundMat = mat(0x9da99a);
  mesh(new THREE.PlaneGeometry(260, 260), groundMat, 0, -0.16, -55).rotation.x = -Math.PI/2;

  const roadMat = new THREE.MeshStandardMaterial({color:0x444b4c, roughness:0.95});
  const sidewalkMat = mat(0xbab9ab);
  const curbMat = mat(0x777d78);
  const lineMat = new THREE.MeshStandardMaterial({color:0xe9dfbd, roughness:0.8});
  const pavingMat = mat(0x9a9c92);

  for (let i=0;i<7;i++) {
    const group = new THREE.Group();
    group.position.z = -i*ROAD_LENGTH + 10;
    mesh(new THREE.BoxGeometry(8.2,0.18,ROAD_LENGTH), roadMat, 0,-0.08,0,group);
    mesh(new THREE.BoxGeometry(2.2,0.12,ROAD_LENGTH), sidewalkMat, -5.2,-0.04,0,group);
    mesh(new THREE.BoxGeometry(2.2,0.12,ROAD_LENGTH), sidewalkMat, 5.2,-0.04,0,group);
    mesh(new THREE.BoxGeometry(0.18,0.2,ROAD_LENGTH), curbMat, -4.1,-0.02,0,group);
    mesh(new THREE.BoxGeometry(0.18,0.2,ROAD_LENGTH), curbMat, 4.1,-0.02,0,group);
    mesh(new THREE.BoxGeometry(0.07,0.012,ROAD_LENGTH), lineMat, -1.35,0.015,0,group);
    mesh(new THREE.BoxGeometry(0.07,0.012,ROAD_LENGTH), lineMat, 1.35,0.015,0,group);
    for(let j=0;j<9;j++){
      mesh(new THREE.BoxGeometry(1.95,0.018,3.5), pavingMat, -5.2,0.03,-14+j*3.7,group);
      mesh(new THREE.BoxGeometry(1.95,0.018,3.5), pavingMat, 5.2,0.03,-14+j*3.7,group);
    }
    scene.add(group); roadPieces.push(group);
  }

  // Cây, đèn đường, ghế và các khối nhà đều được tạo thủ tục bằng hình học 3D.
  const treeMat = [mat(0x486a51),mat(0x59785a),mat(0x6e8560),mat(0x3e5e4c)];
  const trunkMat = mat(0x705543);
  const lampMat = new THREE.MeshStandardMaterial({color:0x38464a,metalness:0.55,roughness:0.4});
  const warmLamp = new THREE.MeshStandardMaterial({color:0xffe5b0,emissive:0xffc96a,emissiveIntensity:0.5});
  const benchMat = mat(0x795c43);
  for(let side of [-1,1]){
    for(let i=0;i<13;i++){
      const z=-i*10-8;
      const tree = new THREE.Group();
      const h=2.0+Math.random()*0.8;
      mesh(new THREE.CylinderGeometry(0.13,0.2,h,7),trunkMat,0,h/2,0,tree);
      const crown=mesh(new THREE.IcosahedronGeometry(1.0+Math.random()*0.35,1),treeMat[i%treeMat.length],0,h+0.5,0,tree);
      crown.scale.y=1.15;
      tree.position.set(side*(6.5+Math.random()*0.5),0,z);
      tree.userData={kind:'tree',side};
      scene.add(tree);scenery.push(tree);

      const lamp=new THREE.Group();
      mesh(new THREE.CylinderGeometry(0.055,0.085,3.7,8),lampMat,0,1.85,0,lamp);
      mesh(new THREE.BoxGeometry(0.65,0.07,0.07),lampMat,side*-0.22,3.65,0,lamp);
      mesh(new THREE.BoxGeometry(0.23,0.12,0.23),warmLamp,side*-0.48,3.58,0,lamp);
      lamp.position.set(side*4.65,0,z-4);
      lamp.userData={kind:'lamp',side};
      scene.add(lamp);scenery.push(lamp);
    }
    for(let i=0;i<9;i++){
      const z=-i*15-20;
      const bldg=new THREE.Group();
      const w=4+Math.random()*3.8, h=7+Math.random()*15, d=7+Math.random()*8;
      const colors=[0x9eaaa8,0xb7b3a5,0x7e9398,0xc3b7a1,0x899a99];
      mesh(new THREE.BoxGeometry(w,h,d),mat(colors[i%colors.length],0.78),0,h/2-0.08,0,bldg);
      const windowMat=new THREE.MeshStandardMaterial({color:0x8daeb4,roughness:0.25,metalness:0.2});
      for(let yy=1.7;yy<h-1;yy+=1.8){
        for(let xx=-w/2+0.55;xx<w/2-0.3;xx+=0.95){
          mesh(new THREE.BoxGeometry(0.48,0.95,0.035),windowMat,xx,yy,d/2+0.025,bldg);
        }
      }
      bldg.position.set(side*(10+w/2),0,z);
      bldg.userData={kind:'building',side};
      scene.add(bldg);scenery.push(bldg);
    }
    for(let i=0;i<4;i++){
      const bench=new THREE.Group();
      mesh(new THREE.BoxGeometry(1.15,0.12,0.38),benchMat,0,0.58,0,bench);
      mesh(new THREE.BoxGeometry(1.15,0.48,0.1),benchMat,0,0.88,-0.13,bench);
      for(let x of [-0.42,0.42]) mesh(new THREE.BoxGeometry(0.09,0.58,0.09),lampMat,x,0.29,0,bench);
      bench.position.set(side*5.4,0,-i*34-17);
      bench.userData={kind:'bench',side};
      scene.add(bench);scenery.push(bench);
    }
  }

  // Xa xa là các khối kiến trúc mờ tạo chiều sâu cho đường phố.
  for(let i=0;i<24;i++){
    const h=5+Math.random()*20,w=5+Math.random()*7;
    const b=mesh(new THREE.BoxGeometry(w,h,8),mat([0x9aacab,0x879c9f,0xb8b9ac][i%3]),(i%2?1:-1)*(20+Math.random()*15),h/2-0.1,-i*13-20);
    b.castShadow=false;
  }
}

function makeRunner() {
  const root = new THREE.Group();
  const skin=mat(0xc78f6a), shirt=mat(0xd3e8dd), shorts=mat(0x354b51), shoe=mat(0xf1e8d7), hair=mat(0x40352e);
  const torso=mesh(new THREE.CapsuleGeometry(0.27,0.55,4,8),shirt,0,1.25,0,root);
  torso.rotation.x=-0.12;
  const head=mesh(new THREE.SphereGeometry(0.22,16,12),skin,0,1.93,0,root);
  mesh(new THREE.SphereGeometry(0.225,12,8),hair,0,2.04,-0.045,root);
  mesh(new THREE.BoxGeometry(0.39,0.29,0.28),shorts,0,0.78,0,root);
  playerParts.leftArm=new THREE.Group(); playerParts.rightArm=new THREE.Group();
  playerParts.leftArm.position.set(-0.32,1.48,0);playerParts.rightArm.position.set(0.32,1.48,0);
  mesh(new THREE.CapsuleGeometry(0.085,0.43,3,6),shirt,0,-0.25,0,playerParts.leftArm);
  mesh(new THREE.SphereGeometry(0.085,8,6),skin,0,-0.51,0,playerParts.leftArm);
  mesh(new THREE.CapsuleGeometry(0.085,0.43,3,6),shirt,0,-0.25,0,playerParts.rightArm);
  mesh(new THREE.SphereGeometry(0.085,8,6),skin,0,-0.51,0,playerParts.rightArm);
  root.add(playerParts.leftArm,playerParts.rightArm);
  playerParts.leftLeg=new THREE.Group();playerParts.rightLeg=new THREE.Group();
  playerParts.leftLeg.position.set(-0.13,0.67,0);playerParts.rightLeg.position.set(0.13,0.67,0);
  for(const leg of [playerParts.leftLeg,playerParts.rightLeg]){
    mesh(new THREE.CapsuleGeometry(0.105,0.42,3,7),shorts,0,-0.26,0,leg);
    mesh(new THREE.BoxGeometry(0.19,0.12,0.34),shoe,0,-0.54,0.06,leg);
  }
  root.add(playerParts.leftLeg,playerParts.rightLeg);
  return root;
}

function addEventListeners(){
  addEventListener('resize',onResize);
  ui.start.addEventListener('click',startGame);
  ui.resume.addEventListener('click',resumeGame);
  ui.restart.addEventListener('click',()=>{resetGame();resumeGame();});
  ui.pauseButton.addEventListener('click',togglePause);
  ui.sound.addEventListener('click',toggleSound);
  ui.left.addEventListener('pointerdown',e=>{e.preventDefault();changeLane(-1)});
  ui.right.addEventListener('pointerdown',e=>{e.preventDefault();changeLane(1)});
  addEventListener('keydown',e=>{
    if(['ArrowLeft','ArrowRight',' ','a','A','d','D'].includes(e.key)) e.preventDefault();
    if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A') changeLane(-1);
    if(e.key==='ArrowRight'||e.key==='d'||e.key==='D') changeLane(1);
    if(e.key===' '||e.key==='Escape') togglePause();
  });
  let touchX=0,touchY=0;
  canvas.addEventListener('touchstart',e=>{touchX=e.changedTouches[0].clientX;touchY=e.changedTouches[0].clientY;},{passive:true});
  canvas.addEventListener('touchend',e=>{
    const dx=e.changedTouches[0].clientX-touchX,dy=e.changedTouches[0].clientY-touchY;
    if(Math.abs(dx)>35&&Math.abs(dx)>Math.abs(dy))changeLane(dx>0?1:-1);
  },{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&running)pauseGame()});
}

function startGame(){
  started=true;running=true;ui.welcome.classList.add('hidden');ui.pause.classList.add('hidden');
  ui.pauseButton.textContent='Ⅱ';clock.getDelta();initAudio();showToast('Chúc bạn có một hành trình thật bình yên.');
}
function resumeGame(){if(!started){startGame();return;}running=true;ui.pause.classList.add('hidden');ui.pauseButton.textContent='Ⅱ';clock.getDelta();initAudio();}
function pauseGame(){running=false;ui.pause.classList.remove('hidden');ui.pauseButton.textContent='▶';}
function togglePause(){if(!started){startGame();return;}if(running)pauseGame();else resumeGame();}
function resetGame(){
  distance=0;elapsed=0;lane=0;targetX=0;worldClock=7.5;
  player.position.x=0;
  roadPieces.forEach((p,i)=>p.position.z=-i*ROAD_LENGTH+10);
  scenery.forEach(o=>{if(o.userData.kind==='tree'||o.userData.kind==='lamp')o.position.z=-Math.floor(Math.random()*13)*10-8;});
  updateHud();
}
function changeLane(direction){
  if(!started){startGame();}
  lane=THREE.MathUtils.clamp(lane+direction,-1,1);targetX=laneX[lane];
  if(soundOn)playTone(440+lane*55,0.045,0.018);
}
function toggleSound(){
  soundOn=!soundOn;ui.sound.textContent=soundOn?'♫':'♪';ui.sound.style.opacity=soundOn?'1':'.55';
  if(soundOn){initAudio();showToast('Đã bật âm thanh môi trường.');}else{if(masterGain)masterGain.gain.setTargetAtTime(0,audioCtx.currentTime,.08);showToast('Đã tắt âm thanh.');}
  if(soundOn&&masterGain)masterGain.gain.setTargetAtTime(.22,audioCtx.currentTime,.15);
}
function initAudio(){
  if(!soundOn)return;
  if(!audioCtx){
    audioCtx=new (window.AudioContext||window.webkitAudioContext)();
    masterGain=audioCtx.createGain();masterGain.gain.value=.22;masterGain.connect(audioCtx.destination);
    // Nền âm thanh êm dịu, tổng hợp hoàn toàn bằng Web Audio, không dùng tệp thương mại.
    const osc1=audioCtx.createOscillator(),osc2=audioCtx.createOscillator();
    const g1=audioCtx.createGain(),g2=audioCtx.createGain();
    osc1.type='sine';osc1.frequency.value=174.61;osc2.type='sine';osc2.frequency.value=220;
    g1.gain.value=.018;g2.gain.value=.009;
    osc1.connect(g1);osc2.connect(g2);g1.connect(masterGain);g2.connect(masterGain);
    osc1.start();osc2.start();
    const buffer=audioCtx.createBuffer(1,audioCtx.sampleRate*2,audioCtx.sampleRate);
    const data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*0.18;
    const noise=audioCtx.createBufferSource();noise.buffer=buffer;noise.loop=true;
    const filter=audioCtx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=480;
    const ng=audioCtx.createGain();ng.gain.value=.022;noise.connect(filter);filter.connect(ng);ng.connect(masterGain);noise.start();
    audioCtx.resume();
  }else if(audioCtx.state==='suspended')audioCtx.resume();
}
function playTone(freq,duration,gainValue){
  if(!audioCtx||!soundOn)return;
  const osc=audioCtx.createOscillator(),g=audioCtx.createGain();
  osc.frequency.value=freq;osc.type='sine';g.gain.setValueAtTime(gainValue,audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+duration);
  osc.connect(g);g.connect(masterGain);osc.start();osc.stop(audioCtx.currentTime+duration);
}
function showToast(message){
  ui.toast.textContent=message;ui.toast.classList.add('show');clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>ui.toast.classList.remove('show'),2600);
}
function onResize(){
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));renderer.setSize(innerWidth,innerHeight);
}
function updateLighting(hour){
  const daylight=Math.max(0,Math.sin((hour-5.5)/12*Math.PI));
  const sunset=Math.max(0,1-Math.abs(hour-18.2)/2.6);
  const sky=new THREE.Color(0x172938).lerp(new THREE.Color(0xb8cbd0),Math.min(1,daylight*1.1));
  sky.lerp(new THREE.Color(0xe5a87d),sunset*.48);
  scene.background=sky;scene.fog.color.copy(sky);
  scene.userData.hemi.intensity=.48+daylight*1.65;
  scene.userData.sun.intensity=.18+daylight*3.0;
  scene.userData.sun.color.set(sunset>0.1?0xffc18c:0xffe5c2);
  renderer.toneMappingExposure=.72+daylight*.5;
  ui.worldTime.textContent=`${String(Math.floor(hour)).padStart(2,'0')}:${String(Math.floor((hour%1)*60)).padStart(2,'0')}`;
  const night=hour<5.8||hour>18.7;
  ui.weatherIcon.textContent=night?'☾':(sunset>.25?'◒':'☀');
  ui.weatherLabel.textContent=night?'Đêm yên tĩnh':(sunset>.25?'Hoàng hôn':'Trời quang');
}
function updateHud(){
  ui.distance.textContent=Math.floor(distance).toLocaleString('vi-VN');
  const mins=Math.floor(elapsed/60),secs=Math.floor(elapsed%60);
  ui.elapsed.textContent=`${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  ui.pace.textContent=speed<7?'Đi bộ':(speed<10?'Thư thái':'Chạy nhẹ');
}
function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.04);
  animationTime+=dt;
  if(running){
    elapsed+=dt;distance+=speed*dt/3.6;
    worldClock=(worldClock+dt*.035)%24;
    player.position.x=THREE.MathUtils.damp(player.position.x,targetX,8,dt);
    player.position.y=Math.abs(Math.sin(animationTime*9))*0.035;
    const stride=Math.sin(animationTime*9);
    playerParts.leftLeg.rotation.x=stride*.62;
    playerParts.rightLeg.rotation.x=-stride*.62;
    playerParts.leftArm.rotation.x=-stride*.45;
    playerParts.rightArm.rotation.x=stride*.45;
    roadPieces.forEach(piece=>{
      piece.position.z+=speed*dt;
      if(piece.position.z>ROAD_LENGTH+10)piece.position.z-=ROAD_LENGTH*roadPieces.length;
    });
    scenery.forEach(obj=>{
      obj.position.z+=speed*dt;
      if(obj.position.z>12){
        const k=obj.userData.kind;
        const step=k==='building'?15:(k==='bench'?34:10);
        obj.position.z-=step*(k==='building'?9:(k==='bench'?4:13));
      }
    });
    camera.position.x=THREE.MathUtils.damp(camera.position.x,player.position.x*.23,2.2,dt);
    camera.position.y=4.4+Math.sin(animationTime*1.3)*.035;
    camera.lookAt(player.position.x*.35,1.12,-4.2);
    updateLighting(worldClock);
    updateHud();
    if(Math.floor(elapsed)%24===0&&Math.floor(elapsed)>0&&Math.abs(elapsed-Math.floor(elapsed))<dt){
      ui.tip.textContent=tips[Math.floor(elapsed/24)%tips.length];
    }
  }
  renderer.render(scene,camera);
}
