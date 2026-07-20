import * as THREE from 'three';

// ═══════════════════════════════════════════════════════════════
// КОНФИГУРАЦИЯ СЦЕН
// Добавляйте новые комнаты по образцу ниже.
// yaw/pitch — в радианах, указывают направление на дверь/переход.
// Нажмите D для отладки: покажет текущие yaw/pitch в центре экрана.
// ═══════════════════════════════════════════════════════════════

const scenes = {
  'my-spot': {
    name: 'Моё место',
    image: 'мое место.jpg',
    hotspots: [
      { target: 'near-bed', yaw: 6.168, pitch: -0.152, label: 'Около кровати' }
    ]
  },
  'near-bed': {
    name: 'Около кровати',
    image: 'около моей кровати.jpg',
    variants: [
      { label: 'Обычная', image: 'около моей кровати.jpg' },
      { label: 'ИИ', image: 'около моей кровати ии.png' }
    ],
    hotspots: [
      { target: 'my-spot', yaw: 1.445, pitch: -0.403, label: 'Моё место' },
      { target: 'wardrobe', yaw: 4.508, pitch: -0.255, label: 'Около шкафа' }
    ]
  },
  'wardrobe': {
    name: 'Около шкафа',
    image: 'около шкафа.jpg',
    variants: [
      { label: 'Обычная', image: 'около шкафа.jpg' },
      { label: 'ИИ', image: 'около шкафа ии.jpeg' }
    ],
    hotspots: [
      { target: 'near-bed', yaw: 5.571, pitch: -0.187, label: 'Около кровати' },
      { target: 'hall', yaw: 2.786, pitch: -0.389, label: 'Коридор' }
    ]
  },
  'hall': {
    name: 'Коридор',
    image: 'коридор.jpg',
    variants: [
      { label: 'Обычная', image: 'коридор.jpg' },
      { label: 'ИИ', image: 'коридор ии.jpeg' }
    ],
    hotspots: [
      { target: 'wardrobe', yaw: 1.353, pitch: -0.234, label: 'Около шкафа' },
      { target: 'toilet', yaw: 0.890, pitch: -0.435, label: 'Туалет' },
      { target: 'bathroom', yaw: 5.983, pitch: -0.429, label: 'Ванная' },
      { target: 'kitchen', yaw: 4.379, pitch: -0.405, label: 'Кухня' }
    ]
  },
  'toilet': {
    name: 'Туалет',
    image: 'туалет.jpg',
    variants: [
      { label: 'Обычная', image: 'туалет.jpg' },
      { label: 'ИИ', image: 'туалет ии.jpeg' }
    ],
    hotspots: [
      { target: 'hall', yaw: 1.698, pitch: -0.401, label: 'Коридор' }
    ]
  },
  'bathroom': {
    name: 'Ванная',
    image: 'ванная.jpg',
    variants: [
      { label: 'Обычная', image: 'ванная.jpg' },
      { label: 'ИИ', image: 'ванная ии.jpeg' }
    ],
    hotspots: [
      { target: 'hall', yaw: 1.518, pitch: -0.485, label: 'Коридор' }
    ]
  },
  'kitchen': {
    name: 'Кухня',
    image: 'кухня.jpg',
    hotspots: [
      { target: 'hall', yaw: 4.374, pitch: -0.269, label: 'Коридор' },
      { target: 'livingroom', yaw: 1.318, pitch: -0.257, label: 'Гостиная' },
      { target: 'office', yaw: 0.424, pitch: -0.122, label: 'Кабинет' }
    ]
  },
  'livingroom': {
    name: 'Гостиная',
    image: 'гостиная.jpg',
    hotspots: [
      { target: 'kitchen', yaw: 1.214, pitch: -0.150, label: 'Кухня' },
      { target: 'office', yaw: 2.730, pitch: -0.175, label: 'Кабинет' }
    ]
  },
  'office': {
    name: 'Кабинет',
    image: 'кабинет.jpg',
    variants: [
      { label: 'Обычная', image: 'кабинет.jpg' },
      { label: 'ИИ', image: 'кабинет ии.png' }
    ],
    hotspots: [
      { target: 'kitchen', yaw: 3.704, pitch: -0.176, label: 'Кухня' },
      { target: 'livingroom', yaw: 2.878, pitch: -0.190, label: 'Гостиная' }
    ]
  }
};

// ═══════════════════════════════════════════════════════════════
// СЦЕНА THREE.JS
// ═══════════════════════════════════════════════════════════════

const container = document.getElementById('viewer');
const loadingEl = document.getElementById('loading');
const fadeEl = document.getElementById('fade');
const sceneNameEl = document.getElementById('scene-name');

const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.set(0, 0, 0);

const fov = { value: 75 };
camera.fov = fov.value;
camera.updateProjectionMatrix();

const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

const sphereGeom = new THREE.SphereGeometry(500, 64, 64);
let sphere = null;
const hotspotGroup = new THREE.Group();
scene.add(hotspotGroup);

// ═══════════════════════════════════════════════════════════════
// УПРАВЛЕНИЕ КАМЕРОЙ
// ═══════════════════════════════════════════════════════════════

const targetEuler = new THREE.Euler(0, 0, 0, 'YXZ');
const currentEuler = new THREE.Euler(0, 0, 0, 'YXZ');
const SMOOTH = 0.18;
let isDragging = false;
let prevMouse = { x: 0, y: 0 };
let mouseMoved = false;
const canvasEl = renderer.domElement;

function applyRotation() {
  camera.quaternion.setFromEuler(currentEuler);
}

function getSensitivity() {
  return 0.005 * (fov.value / 75);
}

function zoom(delta) {
  fov.value = Math.max(20, Math.min(120, fov.value + delta));
  camera.fov = fov.value;
  camera.updateProjectionMatrix();
}

// ─── Мышь ─────────────────────────────────────────────────────

renderer.domElement.addEventListener('mousedown', (e) => {
  isDragging = true;
  mouseMoved = false;
  prevMouse.x = e.clientX;
  prevMouse.y = e.clientY;
  canvasEl.classList.add('grabbing');
});

window.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  const dx = e.clientX - prevMouse.x;
  const dy = e.clientY - prevMouse.y;
  if (Math.abs(dx) > 1 || Math.abs(dy) > 1) mouseMoved = true;

  const sens = getSensitivity();
  targetEuler.y += dx * sens;
  targetEuler.x += dy * sens;
  targetEuler.x = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, targetEuler.x));

  prevMouse.x = e.clientX;
  prevMouse.y = e.clientY;
});

window.addEventListener('mouseup', () => {
  isDragging = false;
  canvasEl.classList.remove('grabbing');
});

renderer.domElement.addEventListener('click', (e) => {
  if (mouseMoved) return;
  handleClick(e.clientX, e.clientY);
});

renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

// ─── Сенсор ───────────────────────────────────────────────────

let touchId = null;
let prevTouch = { x: 0, y: 0 };
let pinchDist = 0;
let pinchFov = 75;

function touchDist(t1, t2) {
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

renderer.domElement.addEventListener('touchstart', (e) => {
  if (e.touches.length === 1) {
    touchId = e.touches[0].identifier;
    prevTouch.x = e.touches[0].clientX;
    prevTouch.y = e.touches[0].clientY;
    mouseMoved = false;
    isDragging = true;
  } else if (e.touches.length === 2) {
    pinchDist = touchDist(e.touches[0], e.touches[1]);
    pinchFov = fov.value;
  }
}, { passive: true });

renderer.domElement.addEventListener('touchmove', (e) => {
  if (e.touches.length === 1) {
    const touch = e.touches[0];
    const dx = touch.clientX - prevTouch.x;
    const dy = touch.clientY - prevTouch.y;
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) mouseMoved = true;

    const sens = getSensitivity();
    targetEuler.y += dx * sens;
    targetEuler.x += dy * sens;
    targetEuler.x = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, targetEuler.x));

    prevTouch.x = touch.clientX;
    prevTouch.y = touch.clientY;
  } else if (e.touches.length === 2) {
    const dist = touchDist(e.touches[0], e.touches[1]);
    if (pinchDist > 0) {
      const ratio = pinchDist / dist;
      zoom(pinchFov * (ratio - 1));
    }
  }
}, { passive: true });

renderer.domElement.addEventListener('touchend', (e) => {
  if (e.touches.length < 2) pinchDist = 0;
  for (const t of e.changedTouches) {
    if (t.identifier === touchId) {
      touchId = null;
      isDragging = false;
      if (!mouseMoved) handleClick(t.clientX, t.clientY);
      break;
    }
  }
}, { passive: true });

// ─── Колесо зум ───────────────────────────────────────────────

renderer.domElement.addEventListener('wheel', (e) => {
  e.preventDefault();
  zoom(e.deltaY * 0.05);
}, { passive: false });

document.getElementById('zoom-in').addEventListener('click', () => zoom(-5));
document.getElementById('zoom-out').addEventListener('click', () => zoom(5));

// ═══════════════════════════════════════════════════════════════
// КЛИК ПО ХОТСПОТАМ
// ═══════════════════════════════════════════════════════════════

function handleClick(clientX, clientY) {
  const rect = renderer.domElement.getBoundingClientRect();
  const ndc = new THREE.Vector2(
    ((clientX - rect.left) / rect.width) * 2 - 1,
    -((clientY - rect.top) / rect.height) * 2 + 1
  );

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(ndc, camera);

  const hits = raycaster.intersectObjects(hotspotGroup.children);
  if (hits.length > 0) {
    const target = hits[0].object.userData.target;
    if (target && scenes[target]) {
      loadScene(target);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// ЗАГРУЗКА СЦЕНЫ
// ═══════════════════════════════════════════════════════════════

const variantsEl = document.getElementById('variants');
let currentSceneId = null;
let currentVariant = 0;
let aiMode = false;

function loadTexture(path, cb) {
  new THREE.TextureLoader().load(
    path.replace(/\\/g, '/'),
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.RepeatWrapping;
      texture.repeat.x = -1;
      cb(texture);
    },
    undefined,
    (err) => {
      console.error('Ошибка загрузки:', err);
      loadingEl.innerHTML = '<span style="color:#f55">Ошибка загрузки панорамы</span>';
    }
  );
}

function applyTexture(texture) {
  const mat = new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide });
  if (sphere) {
    if (sphere.material.map) sphere.material.map.dispose();
    sphere.material.dispose();
    sphere.material = mat;
  } else {
    sphere = new THREE.Mesh(sphereGeom, mat);
    scene.add(sphere);
  }
}

function buildVariants(cfg) {
  variantsEl.innerHTML = '';
  if (!cfg.variants || cfg.variants.length < 2) return;
  cfg.variants.forEach((v, i) => {
    const btn = document.createElement('button');
    btn.className = 'variant-btn' + (i === currentVariant ? ' active' : '');
    btn.textContent = v.label;
    btn.addEventListener('click', () => switchVariant(cfg, i));
    variantsEl.appendChild(btn);
  });
}

function switchVariant(cfg, idx) {
  if (idx === currentVariant) return;
  currentVariant = idx;
  aiMode = idx > 0;
  fadeEl.style.opacity = '1';
  const path = cfg.variants[idx].image;
  loadTexture(path, (texture) => {
    applyTexture(texture);
    fadeEl.style.opacity = '0';
    variantsEl.querySelectorAll('.variant-btn').forEach((btn, i) => {
      btn.classList.toggle('active', i === idx);
    });
  });
}

function loadScene(id) {
  const cfg = scenes[id];
  if (!cfg) return;

  // Сохраняем направление камеры перед переходом
  const savedYaw = targetEuler.y;
  const savedPitch = targetEuler.x;

  currentSceneId = id;
  // Если включён ИИ-режим и есть варианты — загружаем сразу ИИ
  const startIdx = (aiMode && cfg.variants && cfg.variants.length > 1) ? 1 : 0;
  currentVariant = startIdx;

  fadeEl.style.opacity = '1';
  loadingEl.classList.remove('hidden');

  const src = startIdx > 0 ? cfg.variants[startIdx].image : cfg.image;
  const path = src.replace(/\\/g, '/');
  loadTexture(path, (texture) => {
    applyTexture(texture);

    // Восстанавливаем направление камеры
    targetEuler.set(savedPitch, savedYaw, 0, 'YXZ');
    currentEuler.set(savedPitch, savedYaw, 0, 'YXZ');
    applyRotation();

    sceneNameEl.textContent = cfg.name;
    updateHotspots(cfg.hotspots || []);
    buildVariants(cfg);
    updateSidebarActive();

    loadingEl.classList.add('hidden');
    fadeEl.style.opacity = '0';
  });
}

// ═══════════════════════════════════════════════════════════════
// ХОТСПОТЫ (СТРЕЛКИ-УКАЗАТЕЛИ)
// ═══════════════════════════════════════════════════════════════

function buildHotspotTexture(label) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const c = size / 2;

  // Внешнее кольцо с сиянием
  ctx.shadowColor = 'rgba(0,200,255,0.7)';
  ctx.shadowBlur = 40;
  ctx.strokeStyle = 'rgba(0,200,255,0.8)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(c, c, 90, 0, Math.PI * 2);
  ctx.stroke();

  // Заливка внутри кольца
  ctx.shadowBlur = 0;
  const grad = ctx.createRadialGradient(c, c, 0, c, c, 90);
  grad.addColorStop(0, 'rgba(0,200,255,0.2)');
  grad.addColorStop(1, 'rgba(0,200,255,0.05)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(c, c, 90, 0, Math.PI * 2);
  ctx.fill();

  // Центральная яркая точка
  ctx.shadowColor = 'rgba(0,200,255,0.9)';
  ctx.shadowBlur = 30;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(c, c, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Подпись
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 30px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.shadowColor = 'rgba(0,0,0,0.95)';
  ctx.shadowBlur = 12;
  ctx.fillText(label, c, 120);

  return new THREE.CanvasTexture(canvas);
}

function updateHotspots(list) {
  while (hotspotGroup.children.length) {
    const c = hotspotGroup.children[0];
    if (c.material) {
      if (c.material.map) c.material.map.dispose();
      c.material.dispose();
    }
    hotspotGroup.remove(c);
  }

  const R = 480;
  const _q = new THREE.Quaternion();
  const _v = new THREE.Vector3();
  for (const h of list) {
    const tex = buildHotspotTexture(h.label);
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthTest: false,
      sizeAttenuation: true,
    });
    const sprite = new THREE.Sprite(mat);
    const euler = new THREE.Euler(h.pitch, h.yaw, 0, 'YXZ');
    _q.setFromEuler(euler);
    _v.set(0, 0, -1).applyQuaternion(_q).multiplyScalar(R);
    sprite.position.copy(_v);
    sprite.scale.set(200, 200, 1);
    sprite.userData = { target: h.target };
    hotspotGroup.add(sprite);
  }
}

// ═══════════════════════════════════════════════════════════════
// ОТЛАДКА (КЛАВИША D / V)
// ═══════════════════════════════════════════════════════════════

let debugTimer = null;

function getCoordsText() {
  const yawDeg = ((currentEuler.y * 180 / Math.PI) % 360 + 360) % 360;
  const pitchDeg = currentEuler.x * 180 / Math.PI;
  return `Yaw: ${yawDeg.toFixed(1)}°  Pitch: ${pitchDeg.toFixed(1)}°`;
}

function showDebug(copy) {
  const text = getCoordsText();

  let el = document.getElementById('debug-info');
  if (!el) {
    el = document.createElement('div');
    el.id = 'debug-info';
    document.body.appendChild(el);
  }
  el.textContent = text + (copy ? ' (скопировано)' : '');

  if (debugTimer) clearTimeout(debugTimer);
  debugTimer = setTimeout(() => { if (el) el.remove(); }, 3000);

  if (copy) {
    const yawDeg = ((currentEuler.y * 180 / Math.PI) % 360 + 360) % 360;
    const pitchDeg = currentEuler.x * 180 / Math.PI;
    const copyText = `${yawDeg.toFixed(1)},${pitchDeg.toFixed(1)}`.replace('.', ',');
    navigator.clipboard.writeText(copyText).catch(() => {});
  }
}

// ═══════════════════════════════════════════════════════════════
// КЛАВИАТУРА
// ═══════════════════════════════════════════════════════════════

window.addEventListener('keydown', (e) => {
  const step = 0.06 * (fov.value / 75);
  switch (e.key) {
    case 'ArrowLeft':  targetEuler.y -= step; break;
    case 'ArrowRight': targetEuler.y += step; break;
    case 'ArrowUp':    targetEuler.x -= step; break;
    case 'ArrowDown':  targetEuler.x += step; break;
    case '+': case '=': zoom(-5); return;
    case '-':           zoom(5); return;
    case 'd': case 'D': showDebug(false); return;
    case 'v': case 'V': case 'в': case 'В': showDebug(true); return;
    default: return;
  }
  targetEuler.x = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, targetEuler.x));
});

// ═══════════════════════════════════════════════════════════════
// РЕСАЙЗ
// ═══════════════════════════════════════════════════════════════

function onResize() {
  const w = container.clientWidth;
  const h = container.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

window.addEventListener('resize', onResize);

// ═══════════════════════════════════════════════════════════════
// АНИМАЦИОННЫЙ ЦИКЛ
// ═══════════════════════════════════════════════════════════════

function animate() {
  requestAnimationFrame(animate);

  // Плавное приближение камеры к целевым углам
  currentEuler.x += (targetEuler.x - currentEuler.x) * SMOOTH;
  currentEuler.y += (targetEuler.y - currentEuler.y) * SMOOTH;
  applyRotation();

  // Пульсация стрелок
  const t = performance.now() * 0.002;
  hotspotGroup.children.forEach((s, i) => {
    const scl = 200 + Math.sin(t + i * 0.8) * 20;
    s.scale.set(scl, scl, 1);
  });

  renderer.render(scene, camera);
}

// ═══════════════════════════════════════════════════════════════
// СТАРТ
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// САЙДБАР (СПИСОК КОМНАТ)
// ═══════════════════════════════════════════════════════════════

const sidebarEl = document.getElementById('sidebar');
const sidebarList = document.getElementById('sidebar-list');
const sidebarToggle = document.getElementById('sidebar-toggle');

function buildSidebar() {
  sidebarList.innerHTML = '';
  for (const [id, cfg] of Object.entries(scenes)) {
    const item = document.createElement('div');
    item.className = 'sidebar-room' + (id === currentSceneId ? ' active' : '');
    item.textContent = cfg.name;
    item.addEventListener('click', () => {
      if (id !== currentSceneId) loadScene(id);
      sidebarEl.classList.remove('open');
    });
    sidebarList.appendChild(item);
  }
}

sidebarToggle.addEventListener('click', () => {
  sidebarEl.classList.toggle('open');
});

function updateSidebarActive() {
  sidebarList.querySelectorAll('.sidebar-room').forEach((el, i) => {
    const ids = Object.keys(scenes);
    el.classList.toggle('active', ids[i] === currentSceneId);
  });
}

buildSidebar();

loadScene('my-spot');
animate();
