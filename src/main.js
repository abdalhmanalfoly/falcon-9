import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";


// عناصر DOM (نفترض موجودين في HTML بالفعل)
const statusEl = document.getElementById("status");
const altEl = document.getElementById("alt");
const velEl = document.getElementById("vel");
const timeEl = document.getElementById("time");
const statusbar = document.getElementById("statusbar");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const flameSpriteEl = document.getElementById("flameSprite"); // optional image in DOM (not required)

const focusISSBtn = document.getElementById("focusISSBtn");
const focusRocketBtn = document.getElementById("focusRocketBtn");

// زرار يركز على المحطة
focusISSBtn.addEventListener("click", () => {
  if (station) {
    camera.position.set(
      station.position.x + 190,  // مسافة جانبية
      station.position.y + 190,  // ارتفاع فوقها
      station.position.z + 190   // مسافة أمامها
    );
    controls.target.copy(station.position); // ركز على المحطة
    controls.update();
  }
});

// زرار يرجع يركز على الصاروخ
focusRocketBtn.addEventListener("click", () => {
  if (rocket) {
    camera.position.set(
      rocket.position.x + 100,
      rocket.position.y + 100,
      rocket.position.z + 100
    );
    controls.target.copy(rocket.position);
    controls.update();
  }
});


// تهيئة أزرار
startBtn.disabled = true;
pauseBtn.disabled = true;
resetBtn.disabled = false;

// Stars canvas (كما عندك)
const starsCanvas = document.getElementById("stars");
const sctx = starsCanvas.getContext("2d");
function resizeStars() {
  starsCanvas.width = innerWidth;
  starsCanvas.height = innerHeight;
}
resizeStars();
window.addEventListener("resize", () => {
  resizeStars();
  drawStars();
});
let starField = [];
function generateStars() {
  starField = [];
  const n = Math.floor(window.innerWidth * 0.15);
  for (let i = 0; i < n; i++) {
    starField.push({
      x: Math.random() * starsCanvas.width,
      y: Math.random() * starsCanvas.height,
      r: Math.random() * 1.6,
      a: Math.random(),
      tw: Math.random() * 3 + 2,
    });
  }
}

function drawStars(t = 0) {
  sctx.clearRect(0, 0, starsCanvas.width, starsCanvas.height);
  for (let s of starField) {
    const alpha = 0.3 + 0.7 * Math.abs(Math.sin((t / 1000 + s.tw) * 0.8));
    sctx.beginPath();
    sctx.fillStyle = `rgba(255,255,255,${alpha * s.a})`;
    sctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    sctx.fill();
  }
}

// ===== Three.js Setup =====
const container = document.getElementById("three-container");
const scene = new THREE.Scene();
// قمنا بجعل خلفية سوداء خالصة
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 10000);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

// إضاءة
scene.add(new THREE.AmbientLight(0xffffff, 0.9));
const key = new THREE.DirectionalLight(0xffffff, 1.2);
key.position.set(10, 20, 10);
scene.add(key);

// الكاميرا + Controls
camera.position.set(0, 8, 22);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 3, 0);

// ===== الأرضية و منصة الاطلاق =====
function createLaunchPad() {
// أرضية خضراء ممتدة (العشب أو منطقة الإطلاق)
// 🔹 أرضية ضخمة (موقع الإطلاق)
const groundGeo = new THREE.PlaneGeometry(2000, 2000); 
const groundMat = new THREE.MeshStandardMaterial({
  color: 0x1a4a1a,  // أخضر غامق (أرضية عشبية)
  roughness: 0.9,
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
scene.add(ground);

// 🔹 قاعدة الإطلاق (أكبر منصة دائرية)
const padGeo = new THREE.CylinderGeometry(36, 36, 3, 64);
const padMat = new THREE.MeshStandardMaterial({
  color: 0x2a2a3a,
  metalness: 0.5,
  roughness: 0.6,
});
const pad = new THREE.Mesh(padGeo, padMat);
pad.position.set(0, 1.5, 0);
scene.add(pad);

// 🔹 إضافة مباني (Boxes) حوالين المنصة
function createBuilding(x, z, w = 20, h = 15, d = 20, color = 0xcccccc) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
  const building = new THREE.Mesh(geo, mat);
  building.position.set(x, h / 2, z);
  scene.add(building);
  return building;
}

// مباني حول القاعدة
createBuilding(80, 40, 30, 20, 30, 0xbbbbbb);  // مبنى رئيسي
createBuilding(-100, -60, 40, 25, 25, 0x999999); // مبنى آخر
createBuilding(120, -100, 25, 18, 25, 0xffffff); // مبنى أبيض صغير
createBuilding(-150, 90, 35, 22, 30, 0xaaaaaa);  // مبنى دعم

// 🔹 إضاءة إضافية عشان توضح المباني
const hemiLight = new THREE.HemisphereLight(0xeeeeff, 0x444444, 0.4);
hemiLight.position.set(0, 200, 0);
scene.add(hemiLight);

  // برج إطلاق مبسط (هياكل الدعم)
  const towerMat = new THREE.MeshStandardMaterial({ color: 0x222633, metalness: 0.8, roughness: 0.3 });
  const towerGeo = new THREE.BoxGeometry(0.6, 6, 0.6);
  const positions = [
    [4.5, 3.3, 4.5],
    [-4.5, 3.3, 4.5],
    [4.5, 3.3, -4.5],
    [-4.5, 3.3, -4.5],
  ];
  positions.forEach((p) => {
    const b = new THREE.Mesh(towerGeo, towerMat);
    b.position.set(p[0], p[1], p[2]);
    scene.add(b);
  });

  // علامات وإضاءات صغيرة حول المنصة
  for (let i = 0; i < 8; i++) {
    const lightGeo = new THREE.CircleGeometry(0.3, 12);
    const lightMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    const l = new THREE.Mesh(lightGeo, lightMat);
    const ang = (i / 8) * Math.PI * 2;
    l.rotation.x = -Math.PI / 2;
    l.position.set(Math.cos(ang) * 5.2, 0.61, Math.sin(ang) * 5.2);
    scene.add(l);
  }
}
createLaunchPad();

function createStars(count) {
  const geometry = new THREE.BufferGeometry();
  const positions = [];

  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * 100000;
    const y = (Math.random() - 0.5) * 100000;
    const z = (Math.random() - 0.5) * 100000;
    positions.push(x, y, z);
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ color: 0xffffff, size: 1 });
  const stars = new THREE.Points(geometry, material);
  scene.add(stars);
}

createStars(1000000);


// ===== تحميل النماذج =====
const loader = new GLTFLoader();
let rocket = null,
  station = null,
  lowerStage = null; // سنبني stage سفلي مبسط لو احتجنا

let stage = 0; // 0=جاهز, 1=إقلاع, 2=انفصال, 3=مرحلة ثانية, 4=تشابك
let rocketSpeed = 2;
let firstStage, secondStage, fairing;

// تحميل الموديل
loader.load("/falcon_9_-_spacex.glb", (gltf) => {
  rocket = gltf.scene;
  rocket.scale.setScalar(0.06);
  rocket.position.set(0, 0, 0);

  // نفترض الموديل مقسوم: firstStage, secondStage, fairing
  firstStage = rocket.getObjectByName("FirstStage");
  secondStage = rocket.getObjectByName("SecondStage");
  fairing = rocket.getObjectByName("Fairing");

  scene.add(rocket);
  checkReady();
});

// داخل loop
renderer.setAnimationLoop(() => {
  const t = (performance.now() - startTime) / 1000;

  if (launch && rocket) {
    if (stage === 1) { 
      // 🚀 مرحلة الإقلاع
      rocket.position.y += rocketSpeed;
      rocketSpeed += 1;
      if (t > 60) { 
        stage = 2; 
        statusbar.textContent = "انفصال المرحلة الأولى"; 
      }
    }

    if (stage === 2) {
      // 💥 انفصال المرحلة الأولى
      if (firstStage) firstStage.position.y -= 0.1; // تسقط لأسفل
      if (secondStage) secondStage.position.y += 0.05; // تكمل
      if (t > 90) { 
        stage = 3; 
        statusbar.textContent = "انفصال الغطاء"; 
      }
    }

    if (stage === 3) {
      // 🪐 انفصال الغطاء
      if (fairing) fairing.visible = false;
      secondStage.position.y += 0.05;
      if (t > 120) { 
        stage = 4; 
        statusbar.textContent = "التوجه نحو المحطة الدولية"; 
      }
    }

    if (stage === 4) {
      // 🔗 مرحلة التشابك
      secondStage.position.y += 0.02;
      // هنا ممكن تضيف حركة docking للـ ISS
    }
  }

  renderer.render(scene, camera);
});


loader.load(
  "/international_space_station.glb",
  (gltf) => {
    station = gltf.scene;
    station.scale.setScalar(1); // تصغير المحطة
    station.position.set(0, 3000, -5000); // مسافة بعيدة
    scene.add(station);
    statusEl.textContent = "🛰️ المحطة جاهزة";
    checkReady();
  },
  undefined,
  (e) => console.error("خطأ تحميل المحطة", e)
);

function checkReady() {
  if (rocket && station) {
    startBtn.disabled = false;
    statusEl.textContent = "جاهز للانطلاق";
    statusbar.textContent = "اضغط ابدأ العرض";
  }
}

// ===== لهب المحرك (Sprite) =====
// يتوقع ملف flame.png في public/
const texLoader = new THREE.TextureLoader();
const flameTexture = texLoader.load("https://purepng.com/public/uploads/large/purepng.com-fire-flamefire-flameseffectsfirehotflameheat-221519330426jmrve.png", () => {});
const flameMaterial = new THREE.SpriteMaterial({
  map: flameTexture,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});
const flameSprite = new THREE.Sprite(flameMaterial);
flameSprite.scale.set(1.2, 2.4, 1); // حجم ابتدائي
flameSprite.position.set(0, 0.6, 0);
flameSprite.visible = false;
scene.add(flameSprite);

// ===== محاكاة المراحل و timeline مبسطة =====
let launch = false;
let startTime = null;
let separated = false; // هل فصلت المرحلة الأولى؟
let docking = false; // هل التحام؟
let simScale = 0.02; // مقياس: 1 كيلومتر = 0.02 وحدة مشهد (تقدر تعدّل)

// دوال مساعدة
function setRealisticPositions() {
  // مثال: ISS متوسط ارتفاع ~408 كم => سيكون في المشهد عند y = 408 * simScale
  const issAltitudeKm = 408;
  if (station) {
    station.position.set(0, issAltitudeKm * simScale, -issAltitudeKm * simScale * 1.5); // نضعه بعيدًا قليلاً في z
  }
  // الصاروخ يبقى على منصته (y ~ rocket height/2)
  if (rocket) {
    rocket.position.set(0, 2.5, 0);
    if (lowerStage) lowerStage.position.set(0, rocket.position.y - 1.1, 0);
  }
  statusbar.textContent = "📍 الوضع: مواقع واقعية (مضغوطة)";
}

// تقدر تسمح للمستخدم بزيادة/نقص المقياس (simScale) عبر واجهة لاحقاً
// أزرار التحكم
startBtn.addEventListener("click", () => {
  if (!rocket || !station) return;
  launch = true;
  startTime = performance.now();
  startBtn.disabled = true;
  pauseBtn.disabled = false;
  statusbar.textContent = "🚀 الإقلاع جاري...";
  flameSprite.visible = true;
});

pauseBtn.addEventListener("click", () => {
  launch = false;
  pauseBtn.disabled = true;
  startBtn.disabled = false;
  statusbar.textContent = "⏸️ متوقف مؤقتًا";
  flameSprite.visible = false;
});

resetBtn.addEventListener("click", () => {
  launch = false;
  separated = false;
  docking = false;
  if (rocket) rocket.position.set(0, 2.5, 0);
  if (lowerStage) lowerStage.position.set(0, rocket.position.y - 1.1, 0);
  if (station) station.position.set(0, 8, -30);
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  altEl.textContent = "0";
  velEl.textContent = "0";
  timeEl.textContent = "0";
  statusbar.textContent = "🔄 تمت الإعادة";
  flameSprite.visible = false;
});

// فصل المرحلة - تفكيك الجزء السفلي ثم إسقاطه تدريجياً
function separateStage() {
  if (!lowerStage || separated) return;
  separated = true;
  statusbar.textContent = "🔻 فصل المرحلة الأولى";
  // نُعطيها سرعة صغيرة للخلف/لأسفل
  lowerStage.userData.velocity = new THREE.Vector3((Math.random() - 0.5) * 0.02, -0.08, (Math.random() - 0.5) * 0.02);
}

// docking detection (بسيط: لو قرب المسافة أقل من threshold)
function checkDocking() {
  if (!rocket || !station || docking) return;
  const rPos = new THREE.Vector3().setFromMatrixPosition(rocket.matrixWorld);
  const sPos = new THREE.Vector3().setFromMatrixPosition(station.matrixWorld);
  const dist = rPos.distanceTo(sPos);
  // threshold يعتمد على مقياس المشهد: نجرب قيمة مناسبة
  const threshold = 1.6 + (1 / (simScale * 50)); // مقاس تجريبي
  if (dist < threshold) {
    docking = true;
    launch = false;
    flameSprite.visible = false;
    statusbar.textContent = " تم التحام الصاروخ بالمحطة";
    statusEl.textContent = "تم الالتحام";
  }
}

// ===== Animation loop (محدّث مع المراحل) =====
renderer.setAnimationLoop(() => {
  controls.update();
  drawStars(performance.now());

  // Animate flame (حركة نبض للشفافية والحجم)
  if (flameSprite.visible) {
    const t = performance.now() / 100;
    flameMaterial.opacity = 0.6 + 0.4 * Math.abs(Math.sin(t));
    const scaleFactor = 1 + Math.abs(Math.sin(t)) * 0.6;
    flameSprite.scale.set(1.2 * scaleFactor, 2.4 * scaleFactor, 1);
    // ضع الشعلة تحت الصاروخ مباشرة (تتبّع)
    if (rocket) {
      const worldPos = new THREE.Vector3();
      rocket.getWorldPosition(worldPos);
      flameSprite.position.set(worldPos.x, worldPos.y - 1.6 * rocket.scale.y, worldPos.z);
    }
  }

  // Simulation progression أثناء الإقلاع
  if (launch && rocket) {
    const tSec = (performance.now() - startTime) / 1000;
    // سرعة بدائية تزداد تدريجيًا
    const climbSpeed = 0.04 + Math.min(tSec * 0.0025, 0.3); // وحدات/frame تقريبية
    rocket.position.y += climbSpeed;
    altEl.textContent = (rocket.position.y / simScale).toFixed(1); // نعرض كمّية بالـ km (عكس المقياس)
    velEl.textContent = (climbSpeed * 60).toFixed(1);
    timeEl.textContent = tSec.toFixed(1);

    // move lowerStage مع rocket حتى وقت الفصل
    if (!separated && lowerStage) {
      lowerStage.position.set(0, rocket.position.y - 1.1, 0);
    }

    // مثال: فصل المرحلة بعد ارتفاع معين (مثلاً بعد 18 ثانية أو ارتفاع معين)
    if (!separated && tSec > 18) {
      separateStage();
    }
  }

  // إذا فصلنا المرحلة، حركها بشكل منفصل (بعد الانفصال تتحرك وتتلاشى)
  if (separated && lowerStage) {
    // نعمل تحديث للسرعة الموضعية
    if (!lowerStage.userData.velocity) lowerStage.userData.velocity = new THREE.Vector3(0, -0.08, 0);
    lowerStage.position.add(lowerStage.userData.velocity);
    // نضيف تأثير دوران بسيط
    lowerStage.rotation.x += 0.02;
    lowerStage.rotation.z += 0.01;
    // تباطؤ و جاذبية مبسطة
    lowerStage.userData.velocity.y -= 0.0009; // تأثير "سقوط"
    // لو ابتعد تحت مستوى معين نمسحه
    if (lowerStage.position.y < -200) {
      scene.remove(lowerStage);
      lowerStage = null;
    }
  }

  // تحقق من الالتحام عند الاقتراب
  checkDocking();

  renderer.render(scene, camera);
});

// Resize handler
window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  resizeStars();
});


// music
const listener = new THREE.AudioListener();
camera.add(listener);

const sound = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();
audioLoader.load('./ambient-soundscapes-007-space-atmosphere-304974.mp3', (buffer) => {
  sound.setBuffer(buffer);
  sound.setLoop(true);   // يخلي الصوت يعيد نفسه
  sound.setVolume(0.5);  // مستوى الصوت
});


startBtn.addEventListener("click", () => {
  launch = true;
  startTime = performance.now();
  startBtn.disabled = true;
  pauseBtn.disabled = false;
  statusbar.textContent = " الإقلاع جاري...";

  if (!sound.isPlaying) {
    sound.play(); //  تشغيل الصوت عند بداية الرحلة
  }
});


resetBtn.addEventListener("click", () => {
  launch = false;
  if (rocket) rocket.position.set(0, 0, 0);
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  altEl.textContent = "0";
  velEl.textContent = "0";
  timeEl.textContent = "0";
  statusbar.textContent = "🔄 تمت الإعادة";

  if (sound.isPlaying) sound.stop(); // ⏹️ إيقاف الصوت مع الإعادة
});

pauseBtn.addEventListener("click", () => {
  launch = false;
  pauseBtn.disabled = true;
  startBtn.disabled = false;
  statusbar.textContent = "⏸️ متوقف مؤقتًا";

  if (sound.isPlaying) sound.pause(); // ⏸️ إيقاف مؤقت للصوت
});

