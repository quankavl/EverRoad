import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';

const canvas = document.querySelector('#game');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9ab9b0);
scene.fog = new THREE.FogExp2(0x9ab9b0, 0.012);
const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 250);
camera.position.set(9, 7.2, 11);
const renderer = new THREE.WebGLRenderer({canvas, antialias: true, alpha: false, powerPreference: 'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const hemi = new THREE.HemisphereLight(0xc6e0e0, 0x39442b, 1.6); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffe0ad, 2.2); sun.position.set(-10, 16, 8); sun.castShadow = true;
sun.shadow.mapSize.set(1024,1024); sun.shadow.camera.left=-22; sun.shadow.camera.right=22; sun.shadow.camera.top=22; sun.shadow.camera.bottom=-22; scene.add(sun);
const fireLight = new THREE.PointLight(0xff8b32, 2.2, 11, 2); fireLight.position.set(0,1,0); scene.add(fireLight);

const mat = (color, roughness=0.9, extra={}) => new THREE.MeshStandardMaterial({color, roughness, ...extra});
const mats = {
  grass: mat(0x465c3b), grass2: mat(0x526947), dirt: mat(0x6a5a43), bark: mat(0x49352a),
  wood: mat(0x9b7047), woodLight: mat(0xc09a68), stone: mat(0x77786e), stoneDark: mat(0x454b46),
  canvas: mat(0xc6b38b), canvasDark: mat(0x8e9b7d), metal: mat(0x373d39,0.4, {metalness:0.3}),
  leaf1: mat(0x294c37), leaf2: mat(0x365b3b), leaf3: mat(0x54704a),
  flower1: mat(0xe5bd6b), flower2: mat(0xd9d0b0), flower3: mat(0xc8786b)
};
const ground = new THREE.Mesh(new THREE.PlaneGeometry(180,180), mats.grass);
ground.rotation.x=-Math.PI/2; ground.position.y=-0.08; ground.receiveShadow=true; scene.add(ground);
const groundPatch = new THREE.Mesh(new THREE.CircleGeometry(10,64), mats.dirt);
groundPatch.rotation.x=-Math.PI/2; groundPatch.position.y=-0.055; groundPatch.scale.set(1.35,1,1); groundPatch.receiveShadow=true; scene.add(groundPatch);

// Procedural natural details keep the starter project self-contained and free of paid assets.
const seeded = (n)=>{let x=n|0; return ()=>{x=(x*1664525+1013904223)|0;return (x>>>0)/4294967296;};};
const rand=seeded(2108);
function addTree(x,z,s=1){
  const g=new THREE.Group(); g.position.set(x,0,z); g.scale.setScalar(s);
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.17,.28,2.25,7),mats.bark); trunk.position.y=1.05; trunk.castShadow=true; trunk.receiveShadow=true; g.add(trunk);
  for(let i=0;i<3;i++){
    const cone=new THREE.Mesh(new THREE.ConeGeometry(1.15-i*.19,2.15,8),[mats.leaf1,mats.leaf2,mats.leaf3][(i+Math.floor(rand()*3))%3]);
    cone.position.set((rand()-.5)*.15,2.25+i*.75,(rand()-.5)*.15); cone.rotation.y=rand()*Math.PI; cone.scale.set(1+rand()*.18,1,1+rand()*.18); cone.castShadow=true; g.add(cone);
  }
  scene.add(g);
}
for(let i=0;i<66;i++){let a=rand()*Math.PI*2,r=13+rand()*35;addTree(Math.cos(a)*r,Math.sin(a)*r,.65+rand()*.75);}
for(let i=0;i<65;i++){
  let x=(rand()-.5)*85,z=(rand()-.5)*85;if(Math.hypot(x,z)<11)continue;
  const tuft=new THREE.Mesh(new THREE.SphereGeometry(.16+rand()*.22,5,4),rand()>.5?mats.grass2:mats.leaf1);
  tuft.position.set(x,.05,z);tuft.scale.y=.28;tuft.castShadow=true;scene.add(tuft);
}
// A winding pale trail
const trailPts=[new THREE.Vector3(7,-.045,13),new THREE.Vector3(5,-.045,10),new THREE.Vector3(4,-.045,7),new THREE.Vector3(2,-.045,4),new THREE.Vector3(0,-.045,1)];
const trail=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(trailPts),40,.48,8,false),mats.dirt);scene.add(trail);

// Campfire: stones, crossed logs, animated flame meshes and ember particles.
const fireGroup=new THREE.Group();fireGroup.position.set(0,0,0);scene.add(fireGroup);
function cylinderBetween(parent,a,b,r,material,radial=8){
  const dir=new THREE.Vector3().subVectors(b,a);const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r*.82,r,dir.length(),radial),material);
  mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());mesh.castShadow=true;parent.add(mesh);return mesh;
}
for(let i=0;i<11;i++){const a=i/11*Math.PI*2;const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.27+rand()*.09,0),i%3?mats.stone:mats.stoneDark);rock.position.set(Math.cos(a)*1.15,.14,Math.sin(a)*1.15);rock.scale.y=.62;rock.rotation.set(rand(),rand(),rand());rock.castShadow=true;rock.receiveShadow=true;fireGroup.add(rock);}
cylinderBetween(fireGroup,new THREE.Vector3(-.7,.22,-.28),new THREE.Vector3(.7,.22,.28),.18,mats.bark);
cylinderBetween(fireGroup,new THREE.Vector3(-.68,.25,.3),new THREE.Vector3(.68,.25,-.3),.16,mats.wood);
const flameMats=[new THREE.MeshBasicMaterial({color:0xff4c19,transparent:true,opacity:.88}),new THREE.MeshBasicMaterial({color:0xffa12b,transparent:true,opacity:.9}),new THREE.MeshBasicMaterial({color:0xffd06a,transparent:true,opacity:.85})];
const flames=[];
for(let i=0;i<7;i++){
 const geo=new THREE.ConeGeometry(.27+rand()*.22,1.05+rand()*.75,7);
 const f=new THREE.Mesh(geo,flameMats[i%3]);f.position.set((rand()-.5)*.5,.65+rand()*.35,(rand()-.5)*.5);f.rotation.z=(rand()-.5)*.45;fireGroup.add(f);flames.push({mesh:f,base:f.scale.clone(),phase:rand()*6});
}
const emberGeo=new THREE.BufferGeometry();const emberCount=95;const emberPositions=new Float32Array(emberCount*3);const emberVel=[];
for(let i=0;i<emberCount;i++){emberPositions[i*3]=0;emberPositions[i*3+1]=-10;emberPositions[i*3+2]=0;emberVel.push({x:(rand()-.5)*.025,y:.015+rand()*.045,z:(rand()-.5)*.025,life:rand()*2});}
emberGeo.setAttribute('position',new THREE.BufferAttribute(emberPositions,3));const embers=new THREE.Points(emberGeo,new THREE.PointsMaterial({color:0xffb84f,size:.075,transparent:true,opacity:.9,depthWrite:false}));scene.add(embers);

// Tent
function makeTent(x,z,scale=1){
 const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(scale);
 const body=new THREE.Mesh(new THREE.ConeGeometry(1.65,1.95,4,1),mats.canvas);body.rotation.y=Math.PI/4;body.position.y=.94;body.castShadow=true;body.receiveShadow=true;g.add(body);
 const front=new THREE.Mesh(new THREE.ConeGeometry(.66,1.1,3,1),mats.canvasDark);front.rotation.y=Math.PI;front.position.set(0,.55,1.03);front.scale.set(.7,1,1);front.castShadow=true;g.add(front);
 const base=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.5,.07,4),mats.bark);base.rotation.y=Math.PI/4;base.position.y=.05;g.add(base);
 scene.add(g);return g;
}
makeTent(-4.2,2.2,1.15);
// Chairs and initial table
function makeChair(x,z,rot=0){
 const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rot;
 const seat=new THREE.Mesh(new THREE.BoxGeometry(.82,.12,.72),mats.wood);seat.position.y=.68;seat.castShadow=true;g.add(seat);
 const back=new THREE.Mesh(new THREE.BoxGeometry(.82,.85,.12),mats.woodLight);back.position.set(0,1.08,-.29);back.rotation.x=-.13;back.castShadow=true;g.add(back);
 for(const dx of [-.31,.31])for(const dz of [-.24,.24]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.09,.7,.09),mats.bark);leg.position.set(dx,.34,dz);leg.rotation.x=dz<0?-.12:.12;leg.castShadow=true;g.add(leg);}
 scene.add(g);return g;
}
makeChair(2.65,.5,-.8);makeChair(-2.6,-.5,2.4);
function makeTable(x,z){
 const g=new THREE.Group();g.position.set(x,0,z);
 const top=new THREE.Mesh(new THREE.BoxGeometry(1.6,.14,1.0),mats.wood);top.position.y=.95;top.castShadow=true;g.add(top);
 for(const dx of [-.63,.63])for(const dz of [-.34,.34]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.1,.9,.1),mats.bark);leg.position.set(dx,.46,dz);leg.castShadow=true;g.add(leg);}
 scene.add(g);return g;
}
makeTable(-4.5,-1.1);
function makeLantern(x,z){
 const g=new THREE.Group();g.position.set(x,0,z);
 const base=new THREE.Mesh(new THREE.CylinderGeometry(.18,.22,.1,10),mats.metal);base.position.y=.2;g.add(base);
 const glass=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,.34,8),new THREE.MeshStandardMaterial({color:0xffd88a,emissive:0xff9e37,emissiveIntensity:1.3,transparent:true,opacity:.75}));glass.position.y=.42;g.add(glass);
 const cap=new THREE.Mesh(new THREE.CylinderGeometry(.2,.16,.09,8),mats.metal);cap.position.y=.64;g.add(cap);
 const light=new THREE.PointLight(0xffbd67,1.1,4);light.position.y=.48;g.add(light);scene.add(g);return g;
}
makeLantern(2.7,-1.8);
function makeLogPile(x,z){
 const g=new THREE.Group();g.position.set(x,0,z);
 for(let row=0;row<3;row++)for(let i=0;i<3;i++){
  const log=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,1.15,9),row%2?mats.wood:mats.woodLight);
  log.rotation.z=Math.PI/2;log.rotation.y=(i%2)*.08;log.position.set((i-1)*.04,.16+row*.25,(row%2)*.18+(i-1)*.06);log.castShadow=true;g.add(log);
 }
 scene.add(g);return g;
}
makeLogPile(4.3,2.5);
function makeFlowers(x,z){
 const g=new THREE.Group();g.position.set(x,0,z);
 for(let i=0;i<6;i++){
  const a=i*2.4,r=.2+rand()*.35;const stem=new THREE.Mesh(new THREE.CylinderGeometry(.018,.025,.35,5),mats.leaf2);stem.position.set(Math.cos(a)*r,.17,Math.sin(a)*r);g.add(stem);
  const bloom=new THREE.Mesh(new THREE.SphereGeometry(.12,7,5),[mats.flower1,mats.flower2,mats.flower3][i%3]);bloom.position.set(Math.cos(a)*r,.36,Math.sin(a)*r);bloom.scale.y=.75;g.add(bloom);
 }scene.add(g);return g;
}
makeFlowers(4.6,-3.3);
function makeStone(x,z){
 const m=new THREE.Mesh(new THREE.DodecahedronGeometry(.38,0),mats.stone);m.position.set(x,.18,z);m.scale.set(1,.65,.85);m.rotation.set(rand(),rand(),rand());m.castShadow=true;scene.add(m);return m;
}
makeStone(-6,0);makeStone(-5.6,.5);makeStone(-6.2,.45);

// Build items are constructed procedurally; only user-placed objects are tracked/removable.
const placed=[];
const itemNames={fire:'Lửa trại',tent:'Lều cắm trại',chair:'Ghế gỗ',lantern:'Đèn lồng',logs:'Đống củi',table:'Bàn gỗ',flowers:'Bụi hoa',stone:'Đá trang trí'};
let selected='fire';
const raycaster=new THREE.Raycaster();const pointer=new THREE.Vector2();const groundPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);const hitPoint=new THREE.Vector3();
function createPlaceable(type,x,z){
 let obj;
 if(type==='fire'){obj=new THREE.Group();const inner=new THREE.Group();inner.position.y=.03;obj.add(inner);
  for(let i=0;i<8;i++){let a=i/8*Math.PI*2;let rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.22,0),mats.stone);rock.position.set(Math.cos(a)*.78,.12,Math.sin(a)*.78);rock.scale.y=.6;inner.add(rock);}
  cylinderBetween(inner,new THREE.Vector3(-.5,.18,0),new THREE.Vector3(.5,.18,0),.13,mats.bark);
  for(let i=0;i<3;i++){let f=new THREE.Mesh(new THREE.ConeGeometry(.2+i*.05,.7+i*.1,6),flameMats[i]);f.position.set((i-1)*.13,.5+i*.05,0);inner.add(f);}
  const light=new THREE.PointLight(0xff8b32,1.6,7);light.position.y=1;obj.add(light);obj.userData.fireFlames=inner.children.filter(o=>o.geometry?.type==='ConeGeometry');
 }else if(type==='tent'){obj=makeLocalTent();}
 else if(type==='chair'){obj=makeLocalChair();}
 else if(type==='lantern'){obj=makeLocalLantern();}
 else if(type==='logs'){obj=makeLocalLogs();}
 else if(type==='table'){obj=makeLocalTable();}
 else if(type==='flowers'){obj=makeLocalFlowers();}
 else {obj=new THREE.Mesh(new THREE.DodecahedronGeometry(.38,0),mats.stone);obj.position.y=.2;obj.scale.y=.7;}
 obj.position.x=x;obj.position.z=z;obj.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});scene.add(obj);placed.push({type,obj});updateCount();return obj;
}
function makeLocalTent(){const g=new THREE.Group();const b=new THREE.Mesh(new THREE.ConeGeometry(1.2,1.5,4),mats.canvas);b.rotation.y=Math.PI/4;b.position.y=.75;g.add(b);const d=new THREE.Mesh(new THREE.ConeGeometry(.48,.75,3),mats.canvasDark);d.position.set(0,.38,.77);d.rotation.y=Math.PI;g.add(d);return g;}
function makeLocalChair(){const g=new THREE.Group();const s=new THREE.Mesh(new THREE.BoxGeometry(.75,.1,.62),mats.wood);s.position.y=.6;g.add(s);const b=new THREE.Mesh(new THREE.BoxGeometry(.75,.68,.1),mats.woodLight);b.position.set(0,.93,-.26);g.add(b);for(let x of [-.28,.28])for(let z of [-.22,.22]){let l=new THREE.Mesh(new THREE.BoxGeometry(.08,.62,.08),mats.bark);l.position.set(x,.3,z);g.add(l);}return g;}
function makeLocalLantern(){const g=new THREE.Group();let a=new THREE.Mesh(new THREE.CylinderGeometry(.18,.2,.08,8),mats.metal);a.position.y=.12;g.add(a);let b=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,.32,8),new THREE.MeshStandardMaterial({color:0xffd58a,emissive:0xff9e37,emissiveIntensity:1.2,transparent:true,opacity:.75}));b.position.y=.34;g.add(b);let l=new THREE.PointLight(0xffbd67,.9,3.5);l.position.y=.35;g.add(l);return g;}
function makeLocalLogs(){const g=new THREE.Group();for(let r=0;r<3;r++)for(let i=0;i<3;i++){let m=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,.9,8),mats.wood);m.rotation.z=Math.PI/2;m.position.set(0,.13+r*.22,(i-1)*.19+(r%2)*.05);g.add(m);}return g;}
function makeLocalTable(){const g=new THREE.Group();let t=new THREE.Mesh(new THREE.BoxGeometry(1.3,.12,.8),mats.wood);t.position.y=.8;g.add(t);for(let x of [-.5,.5])for(let z of [-.28,.28]){let l=new THREE.Mesh(new THREE.BoxGeometry(.09,.76,.09),mats.bark);l.position.set(x,.38,z);g.add(l);}return g;}
function makeLocalFlowers(){const g=new THREE.Group();for(let i=0;i<5;i++){let a=i*2.4,x=Math.cos(a)*.25,z=Math.sin(a)*.25;let s=new THREE.Mesh(new THREE.CylinderGeometry(.02,.025,.35,5),mats.leaf2);s.position.set(x,.17,z);g.add(s);let f=new THREE.Mesh(new THREE.SphereGeometry(.12,7,5),[mats.flower1,mats.flower2,mats.flower3][i%3]);f.position.set(x,.35,z);g.add(f);}return g;}
function updateCount(){document.querySelector('#itemCount').textContent=`${3+placed.length} món`;}
function setSelected(type){selected=type;document.querySelectorAll('.build-item').forEach(b=>b.classList.toggle('selected',b.dataset.item===type));document.querySelector('#selectedHint').textContent=type?`Đang chọn: ${itemNames[type]}`:'Đang ngắm cảnh';}
document.querySelectorAll('.build-item').forEach(b=>b.addEventListener('click',()=>{setSelected(b.dataset.item);toast(`Đã chọn ${itemNames[selected]}. Chạm vào mặt đất để đặt.`);}));
document.querySelector('#cancelBuild').addEventListener('click',()=>{setSelected(null);toast('Đã hủy chọn vật dụng.');});
document.querySelector('#closeBuild').addEventListener('click',()=>document.querySelector('.build-panel').classList.toggle('minimized'));
document.querySelector('#mobileBuild').addEventListener('click',()=>{document.querySelector('.build-panel').classList.toggle('minimized');document.querySelector('.build-panel').scrollIntoView({block:'nearest',behavior:'smooth'});});
document.querySelector('#mobileInteract').addEventListener('click',()=>{fireEnabled=!fireEnabled;toast(fireEnabled?'Lửa trại đang cháy. Hãy tận hưởng hơi ấm.':'Bạn đã tạm tắt lửa trại.');});
let fireEnabled=true;

// Camera/orbit controls; drag to rotate, wheel to zoom.
let yaw=Math.PI*.25, pitch=.42, radius=16, targetY=0;let dragging=false,lastX=0,lastY=0;let movedPointer=false;
let player=new THREE.Vector3(0,0,8);
function updateCamera(){pitch=THREE.MathUtils.clamp(pitch,.12,1.05);radius=THREE.MathUtils.clamp(radius,7,28);camera.position.set(player.x+Math.sin(yaw)*radius,Math.sin(pitch)*radius+1.1,player.z+Math.cos(yaw)*radius);camera.lookAt(player.x,targetY,player.z);}
updateCamera();
canvas.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;movedPointer=false;canvas.setPointerCapture?.(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!dragging)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;if(Math.abs(dx)+Math.abs(dy)>2)movedPointer=true;yaw-=dx*.006;pitch+=dy*.004;lastX=e.clientX;lastY=e.clientY;updateCamera();});
canvas.addEventListener('pointerup',e=>{dragging=false;if(!movedPointer)handleTap(e.clientX,e.clientY);});
canvas.addEventListener('pointercancel',()=>dragging=false);
canvas.addEventListener('wheel',e=>{radius+=Math.sign(e.deltaY)*.9;updateCamera();},{passive:true});
function handleTap(x,y){
 pointer.x=(x/innerWidth)*2-1;pointer.y=-(y/innerHeight)*2+1;raycaster.setFromCamera(pointer,camera);
 const objs=[];placed.forEach(p=>p.obj.traverse(o=>{if(o.isMesh)objs.push(o)}));
 const hits=raycaster.intersectObjects(objs,true);
 if(hits.length&&selected===null){const root=placed.find(p=>{let found=false;p.obj.traverse(o=>{if(o===hits[0].object)found=true;});return found;});if(root){scene.remove(root.obj);placed.splice(placed.indexOf(root),1);updateCount();toast(`Đã nhặt ${itemNames[root.type]}.`);return;}}
 if(selected){if(raycaster.ray.intersectPlane(groundPlane,hitPoint)){if(Math.hypot(hitPoint.x,hitPoint.z)>30){toast('Hãy đặt vật dụng gần khu cắm trại nhé.');return;}createPlaceable(selected,hitPoint.x,hitPoint.z);toast(`Đã đặt ${itemNames[selected].toLowerCase()}.`);}}
}
let keys={};window.addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if([' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))e.preventDefault();});
window.addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
const joystick=document.querySelector('#joystick'),stick=document.querySelector('#stick');let joy={x:0,y:0,active:false};
joystick.addEventListener('pointerdown',e=>{joy.active=true;joystick.setPointerCapture(e.pointerId);moveJoy(e);});
joystick.addEventListener('pointermove',e=>{if(joy.active)moveJoy(e);});
function moveJoy(e){const r=joystick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=e.clientX-cx,dy=e.clientY-cy,l=Math.hypot(dx,dy),max=30;if(l>max){dx=dx/l*max;dy=dy/l*max;}joy.x=dx/max;joy.y=dy/max;stick.style.transform=`translate(${dx}px,${dy}px)`;}
function resetJoy(){joy.active=false;joy.x=0;joy.y=0;stick.style.transform='translate(0,0)';}
joystick.addEventListener('pointerup',resetJoy);joystick.addEventListener('pointercancel',resetJoy);

// Day/night color and lighting transition
const skyDay=new THREE.Color(0x9ab9b0),skyDusk=new THREE.Color(0x755c69),skyNight=new THREE.Color(0x111e2a);
const timeSlider=document.querySelector('#timeSlider');
function setTime(value){const t=Number(value);let day=Math.max(0,Math.sin((t-6)/16*Math.PI));let dusk=Math.max(0,1-Math.abs(t-18)/3);const c=skyNight.clone().lerp(skyDay,day).lerp(skyDusk,dusk*.72);scene.background.copy(c);scene.fog.color.copy(c).lerp(new THREE.Color(0x17231e),.18);sun.intensity=.12+day*2.15;sun.color.set(t>16?0xffc58a:0xffe7c4);hemi.intensity=.35+day*1.3;fireLight.intensity=fireEnabled?(t<8||t>17?2.9:1.1):0;document.querySelector('#timeLabel').textContent=`${String(Math.floor(t)).padStart(2,'0')}:${String(Math.round((t%1)*60)).padStart(2,'0')}`;document.querySelector('#weatherIcon').textContent=t<7||t>19?'☾':'☀';document.querySelector('#weatherText').textContent=t<7||t>19?'Đêm yên tĩnh':t>16?'Hoàng hôn ấm áp':'Chiều ấm áp';}
timeSlider.addEventListener('input',e=>setTime(e.target.value));setTime(timeSlider.value);

// Ambient sound: synthesized fire crackle and soft wind; only starts after user gesture.
let audioCtx=null, soundOn=false, noiseSource=null, soundGain=null;
function startSound(){try{audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();soundGain=audioCtx.createGain();soundGain.gain.value=.13;soundGain.connect(audioCtx.destination);
 const buffer=audioCtx.createBuffer(1,audioCtx.sampleRate*2,audioCtx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.25;
 noiseSource=audioCtx.createBufferSource();noiseSource.buffer=buffer;noiseSource.loop=true;const filter=audioCtx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=480;const gain=audioCtx.createGain();gain.gain.value=.5;noiseSource.connect(filter);filter.connect(gain);gain.connect(soundGain);noiseSource.start();soundOn=true;document.querySelector('#soundBtn').textContent='♫';toast('Âm thanh thiên nhiên đã bật.');}catch(e){toast('Trình duyệt chưa hỗ trợ âm thanh.');}}
function stopSound(){if(soundGain)soundGain.gain.setTargetAtTime(0,audioCtx.currentTime,.08);soundOn=false;document.querySelector('#soundBtn').textContent='♪';toast('Đã tắt âm thanh.');}
document.querySelector('#soundBtn').addEventListener('click',()=>{if(soundOn)stopSound();else startSound();});

// Save and restore placements locally
function saveGame(){const data={time:timeSlider.value,placed:placed.map(p=>({type:p.type,x:p.obj.position.x,z:p.obj.position.z}))};localStorage.setItem('timberHavenSave',JSON.stringify(data));toast('Đã lưu khu cắm trại trên thiết bị này.');}
function loadGame(){try{const d=JSON.parse(localStorage.getItem('timberHavenSave')||'null');if(!d)return;timeSlider.value=d.time||17.5;setTime(timeSlider.value);(d.placed||[]).forEach(p=>createPlaceable(p.type,p.x,p.z));}catch(e){console.warn('Không thể đọc bản lưu',e);}}
document.querySelector('#saveBtn').addEventListener('click',saveGame);
document.querySelector('#resetViewBtn').addEventListener('click',()=>{yaw=Math.PI*.25;pitch=.42;radius=16;targetY=0;updateCamera();toast('Góc nhìn đã được đưa về trung tâm.');});

const modal=document.querySelector('#helpModal');
document.querySelector('#helpBtn').addEventListener('click',()=>modal.classList.remove('hidden'));
document.querySelector('#closeHelp').addEventListener('click',()=>modal.classList.add('hidden'));
document.querySelector('#startBtn').addEventListener('click',()=>modal.classList.add('hidden'));
function toast(text){const el=document.querySelector('#toast');el.textContent=text;el.classList.add('show');clearTimeout(toast._timer);toast._timer=setTimeout(()=>el.classList.remove('show'),2600);}

function animate(t){
 requestAnimationFrame(animate);const time=t*.001;
 flames.forEach((f,i)=>{f.mesh.visible=fireEnabled;const wobble=1+Math.sin(time*8+f.phase)*.13+Math.sin(time*15+i)*.07;f.mesh.scale.set(wobble,1+Math.sin(time*10+i)*.17,wobble);f.mesh.rotation.z=Math.sin(time*3+i)*.12;});
 fireGroup.visible=fireEnabled;fireLight.visible=fireEnabled;
 const pos=embers.geometry.attributes.position.array;
 for(let i=0;i<emberCount;i++){const k=i*3;emberVel[i].life-=.016;if(emberVel[i].life<=0){emberVel[i].life=1+rand()*2;pos[k]=(rand()-.5)*1.2;pos[k+1]=.4;pos[k+2]=(rand()-.5)*1.2;}else{pos[k]+=emberVel[i].x;pos[k+1]+=emberVel[i].y;pos[k+2]+=emberVel[i].z;}if(pos[k+1]>3.5)emberVel[i].life=0;}
 embers.geometry.attributes.position.needsUpdate=true;embers.visible=fireEnabled;
 fireLight.intensity=fireEnabled?(Number(timeSlider.value)>17||Number(timeSlider.value)<8?2.3:1.0)+Math.sin(time*12)*.25:0;
 // Walk around with camera-relative movement.
 let forward=(keys.w||keys.arrowup?1:0)-(keys.s||keys.arrowdown?1:0)-joy.y;
 let side=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0)+joy.x;
 const len=Math.hypot(forward,side);if(len>.01){forward/=Math.max(1,len);side/=Math.max(1,len);const speed=.105;player.x+=(Math.sin(yaw)*forward+Math.cos(yaw)*side)*speed;player.z+=(Math.cos(yaw)*forward-Math.sin(yaw)*side)*speed;player.x=THREE.MathUtils.clamp(player.x,-18,18);player.z=THREE.MathUtils.clamp(player.z,-18,18);targetY=THREE.MathUtils.lerp(targetY,player.y,.03);}
 // Keep the orbit camera centered on the player's walking position.
 updateCamera();
 renderer.render(scene,camera);
}
loadGame();
requestAnimationFrame(animate);
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.setSize(innerWidth,innerHeight);});
setTimeout(()=>{const el=document.querySelector('#loading');el.style.opacity='0';setTimeout(()=>el.remove(),550);},700);
setTimeout(()=>modal.classList.remove('hidden'),900);
