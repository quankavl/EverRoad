
import * as THREE from
  "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color("#a9d9e8");
scene.fog = new THREE.Fog("#a9d9e8", 25, 90);

// CAMERA
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  200
);

// RENDERER
const renderer = new THREE.WebGLRenderer({
  antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

document.getElementById("game-container")
  .appendChild(renderer.domElement);

// LIGHT
scene.add(new THREE.HemisphereLight(
  0xffffff, 0x668855, 2
));

const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(10, 20, 10);
sun.castShadow = true;
scene.add(sun);

// MATERIALS
const green = new THREE.MeshStandardMaterial({
  color: "#79a85b"
});

const wood = new THREE.MeshStandardMaterial({
  color: "#91623c"
});

const pink = new THREE.MeshStandardMaterial({
  color: "#ef91bd"
});

// GROUND
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100),
  green
);

ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// TEMPLE
const temple = new THREE.Group();

const base = new THREE.Mesh(
  new THREE.BoxGeometry(7, 3, 5),
  wood
);
base.position.y = 1.5;
temple.add(base);

const roof = new THREE.Mesh(
  new THREE.ConeGeometry(5.5, 2, 4),
  new THREE.MeshStandardMaterial({color:"#b94b38"})
);
roof.position.y = 4;
roof.rotation.y = Math.PI / 4;
temple.add(roof);

temple.position.set(0, 0, -13);
scene.add(temple);

// LOTUS POND
const pond = new THREE.Mesh(
  new THREE.CircleGeometry(7, 48),
  new THREE.MeshStandardMaterial({
    color: "#55b9bc",
    roughness: 0.25,
    metalness: 0.2
  })
);

pond.rotation.x = -Math.PI / 2;
pond.position.set(8, 0.03, 3);
scene.add(pond);

// LOTUS FLOWERS
for (let i = 0; i < 18; i++) {
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.random() * 5;

  const flower = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 12, 12),
    pink
  );

  flower.scale.y = 0.35;
  flower.position.set(
    8 + Math.cos(angle) * radius,
    0.25,
    3 + Math.sin(angle) * radius
  );

  scene.add(flower);
}

// TREES
function createTree(x, z) {
  const tree = new THREE.Group();

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.3, 2),
    wood
  );
  trunk.position.y = 1;

  const leaves = new THREE.Mesh(
    new THREE.SphereGeometry(1.2, 12, 12),
    new THREE.MeshStandardMaterial({color:"#347e49"})
  );
  leaves.position.y = 2.5;

  tree.add(trunk, leaves);
  tree.position.set(x, 0, z);
  scene.add(tree);
}

for (let i = 0; i < 35; i++) {
  createTree(
    (Math.random() - 0.5) * 45,
    (Math.random() - 0.5) * 45
  );
}

// CHIBI PLAYER
const player = new THREE.Group();

const skin = new THREE.MeshStandardMaterial({
  color: "#ffd2ad"
});

const bodyMat = new THREE.MeshStandardMaterial({
  color: "#f4e7d0"
});

const body = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.45, 0.6, 6, 12),
  bodyMat
);
body.position.y = 0.8;

const head = new THREE.Mesh(
  new THREE.SphereGeometry(0.62, 24, 24),
  skin
);
head.position.y = 1.8;

const eyeMat = new THREE.MeshBasicMaterial({
  color: "#30251f"
});

function addEye(x) {
  const eye = new THREE.Mesh(
    new THREE.SphereGeometry(0.065, 12, 12),
    eyeMat
  );
  eye.position.set(x, 1.85, 0.55);
  player.add(eye);
}

player.add(body, head);
addEye(-0.2);
addEye(0.2);

player.position.set(0, 0, 3);
scene.add(player);

// CONTROLS
const keys = {};

window.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;

  if (e.key.toLowerCase() === "e") {
    interact();
  }
});

window.addEventListener("keyup", e => {
  keys[e.key.toLowerCase()] = false;
});

// MOBILE CONTROLS
document.querySelectorAll("[data-key]").forEach(button => {
  const key = button.dataset.key;

  button.addEventListener("pointerdown", e => {
    e.preventDefault();
    keys[key] = true;
  });

  ["pointerup", "pointerleave", "pointercancel"].forEach(event => {
    button.addEventListener(event, () => {
      keys[key] = false;
    });
  });
});

// MOVEMENT
function updatePlayer(delta) {
  const speed = 6 * delta;
  const forward = keys["w"] || keys["arrowup"] || keys.forward;
  const backward = keys["s"] || keys["arrowdown"] || keys.backward;
  const left = keys["a"] || keys["arrowleft"] || keys.left;
  const right = keys["d"] || keys["arrowright"] || keys.right;

  let dx = 0;
  let dz = 0;

  if (forward) dz -= 1;
  if (backward) dz += 1;
  if (left) dx -= 1;
  if (right) dx += 1;

  const direction = new THREE.Vector3(dx, 0, dz);

  if (direction.length() > 0) {
    direction.normalize();
    player.position.addScaledVector(direction, speed);

    player.rotation.y = Math.atan2(dx, dz);
  }

  player.position.x = THREE.MathUtils.clamp(
    player.position.x, -40, 40
  );

  player.position.z = THREE.MathUtils.clamp(
    player.position.z, -40, 40
  );
}

// INTERACTION
let points = 0;

function interact() {
  const distance = player.position.distanceTo(
    new THREE.Vector3(0, 0, -13)
  );

  const pondDistance = player.position.distanceTo(
    new THREE.Vector3(8, 0, 3)
  );

  if (distance < 8 || pondDistance < 8) {
    points += 10;

    document.getElementById("points").textContent = points;

    document.getElementById("message").textContent =
      "🌸 Bạn đã khám phá một địa điểm mới! +10 điểm";
  } else {
    document.getElementById("message").textContent =
      "Hãy đến gần ngôi chùa hoặc hồ sen để tương tác!";
  }
}

document.getElementById("interact")
  .addEventListener("click", interact);

// CAMERA FOLLOW
function updateCamera() {
  const target = new THREE.Vector3(
    player.position.x,
    player.position.y + 4,
    player.position.z + 8
  );

  camera.position.lerp(target, 0.08);

  camera.lookAt(
    player.position.x,
    player.position.y + 1,
    player.position.z
  );
}

// GAME LOOP
let previous = performance.now();

function animate(now) {
  requestAnimationFrame(animate);

  const delta = Math.min((now - previous) / 1000, 0.05);
  previous = now;

  updatePlayer(delta);
  updateCamera();

  renderer.render(scene, camera);
}

camera.position.set(0, 5, 10);

document.getElementById("loading").style.display = "none";

animate(performance.now());

// RESPONSIVE
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
