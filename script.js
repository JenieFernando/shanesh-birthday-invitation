/* =========================================================================
   Shanesh is ONE! — Evening Blue Jungle + Racing Birthday Safari
   Combines the lush 3D forest, friendly jungle animals (waving black &
   white checkered racing flags!), glowing yellow fireflies lighting the
   trail, twilight blue night sky with moon & stars, white #1 racing car
   with real road-illuminating headlights driven by a cheerful little bear,
   celebratory stage flashlights at the finale, and the blue/white/black
   racing birthday cake!
   ========================================================================= */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/* ------------------------------------------------------------------
   CONFIG — edit these before sharing
   ------------------------------------------------------------------ */
const CONFIG = {
  // Family WhatsApp number: country code + digits only, no "+" or spaces (e.g. '94771234567')
  whatsapp: 'ADD_WHATSAPP_NUMBER_HERE',
  // Party start (Sri Lanka time, UTC+05:30)
  eventStart: '2026-11-21T19:00:00+05:30',
  // Used only for the "Add to calendar" file
  durationHours: 3,
  venue: 'Hotel Camellia, Dankotuwa, Sri Lanka',
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------------
   Guest name  (?name=Aunty+Nimali)
   ------------------------------------------------------------------ */
const guest = (new URLSearchParams(location.search).get('name') || '')
  .replace(/[<>]/g, '').replace(/[._]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
if (guest) $('#guestName').textContent = guest;

/* ------------------------------------------------------------------
   Toast
   ------------------------------------------------------------------ */
const toastEl = $('#toast');
let toastT;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => toastEl.classList.remove('show'), 2800);
}

/* ------------------------------------------------------------------
   Sound — music-box lullaby + animal boops & celebration chime
   ------------------------------------------------------------------ */
const Sound = (() => {
  let ctx, master, on = false, timer = null, next = 0, running = false;
  const F = {
    C3: 130.81, F3: 174.61, C4: 261.63, D4: 293.66, E4: 329.63,
    F4: 349.23, G4: 392, A4: 440, Bb4: 466.16, C5: 523.25,
    E5: 659.25, G5: 783.99, C6: 1046.5,
  };
  const mel = [
    ['C4', .75], ['C4', .25], ['D4', 1], ['C4', 1], ['F4', 1], ['E4', 2],
    ['C4', .75], ['C4', .25], ['D4', 1], ['C4', 1], ['G4', 1], ['F4', 2],
    ['C4', .75], ['C4', .25], ['C5', 1], ['A4', 1], ['F4', 1], ['E4', 1], ['D4', 2],
    ['Bb4', .75], ['Bb4', .25], ['A4', 1], ['F4', 1], ['G4', 1], ['F4', 2],
  ];
  const bass = [[0, 'C3'], [6, 'C3'], [12, 'F3'], [19, 'F3']];
  const spb = 60 / 94;

  function init() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    return true;
  }
  function tone(freq, t, dur, vol) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator();
    const g = ctx.createGain(), g2 = ctx.createGain();
    o.type = 'sine'; o2.type = 'triangle';
    o.frequency.value = freq; o2.frequency.value = freq * 2;
    g2.gain.value = .22;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + .01);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(master);
    o.start(t); o2.start(t);
    o.stop(t + dur + .05); o2.stop(t + dur + .05);
  }
  function loop(t0) {
    let t = t0;
    mel.forEach(([n, b]) => { tone(F[n], t, Math.max(.7, b * spb * 1.8), .2); t += b * spb; });
    bass.forEach(([b, n]) => tone(F[n], t0 + b * spb, 2.2, .1));
    return t + 2.5 * spb;
  }
  function pump() {
    if (!on || !ctx) return;
    if (ctx.currentTime + 1.5 > next) next = loop(Math.max(next, ctx.currentTime + .05));
  }
  function set(v) {
    if (!init()) return;
    on = v;
    if (v) {
      ctx.resume && ctx.resume();
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.linearRampToValueAtTime(.5, ctx.currentTime + .6);
      if (!running) { running = true; next = ctx.currentTime + .15; }
      clearInterval(timer);
      timer = setInterval(pump, 400);
      pump();
    } else {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + .25);
    }
  }
  function blip(base) {
    if (!on || !ctx) return;
    const t = ctx.currentTime + .01;
    tone(base, t, .35, .24);
    tone(base * 1.5, t + .09, .45, .2);
  }
  function chime() {
    if (!on || !ctx) return;
    const t = ctx.currentTime + .01;
    ['C5', 'E5', 'G5', 'C6'].forEach((n, i) => tone(F[n], t + i * .11, .9, .22));
  }
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend && ctx.suspend();
    else if (on) ctx.resume && ctx.resume();
  });
  return { set, blip, chime, get on() { return on; }, init };
})();

const soundBtn = $('#soundBtn');
soundBtn.addEventListener('click', () => {
  const v = !Sound.on;
  Sound.set(v);
  soundBtn.setAttribute('aria-pressed', String(v));
});

/* ------------------------------------------------------------------
   2D Celebration Particles (blue, white, black & gold race confetti)
   ------------------------------------------------------------------ */
const COLORS = ['#1d6fe0', '#ffffff', '#181b20', '#58b4ff', '#ffc23d'];
function burst(x, y, n = 10, kinds = ['star', 'heart']) {
  if (reduceMotion) return;
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i');
    const kind = kinds[i % kinds.length];
    const a = Math.random() * Math.PI * 2;
    const d = 40 + Math.random() * 70;
    p.className = 'spark' + (kind === 'heart' ? ' heart' : '');
    p.style.cssText = `left:${x - 8}px;top:${y - 8}px;--c:${COLORS[i % COLORS.length]};--s:${12 + Math.random() * 10}px;--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d - 24}px`;
    document.body.appendChild(p);
    p.addEventListener('animationend', () => p.remove());
  }
}
function confetti(n = 80) {
  if (reduceMotion) return;
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i');
    p.className = 'conf' + (i % 3 === 0 ? ' round' : '');
    p.style.cssText = `--l:${Math.random() * 100}%;--c:${COLORS[i % COLORS.length]};--dx:${(Math.random() - .5) * 160}px;--rot:${(Math.random() - .5) * 1400}deg;--t:${1.8 + Math.random() * 1.4}s;--dl:${Math.random() * .4}s`;
    document.body.appendChild(p);
    p.addEventListener('animationend', () => p.remove());
  }
}

/* ------------------------------------------------------------------
   Tilt (phone gyro / mouse)
   ------------------------------------------------------------------ */
const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
let baseBeta = null;
function onOrient(e) {
  if (e.gamma == null || e.beta == null) return;
  if (baseBeta == null) baseBeta = e.beta;
  tilt.tx = clamp(e.gamma / 22, -1, 1);
  tilt.ty = clamp((e.beta - baseBeta) / 26, -1, 1);
}
function onPointerMove(e) {
  tilt.tx = (e.clientX / innerWidth - .5) * 2;
  tilt.ty = (e.clientY / innerHeight - .5) * 2;
}
async function enableTilt() {
  const D = window.DeviceOrientationEvent;
  try {
    if (D && typeof D.requestPermission === 'function') {
      const r = await D.requestPermission();
      if (r !== 'granted') return;
    }
    if (D) addEventListener('deviceorientation', onOrient, { passive: true });
  } catch (e) { /* ignore */ }
}
addEventListener('pointermove', onPointerMove, { passive: true });

/* ------------------------------------------------------------------
   Pop-Up Cards Reveal Observer
   ------------------------------------------------------------------ */
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, { threshold: .18, rootMargin: '0px 0px -6% 0px' });
$$('.reveal').forEach(el => io.observe(el));

/* ------------------------------------------------------------------
   Countdown & Calendar & WhatsApp RSVP
   ------------------------------------------------------------------ */
const eventAt = new Date(CONFIG.eventStart).getTime();
const pad = n => String(n).padStart(2, '0');
const cd = { d: $('#cdD'), h: $('#cdH'), m: $('#cdM'), s: $('#cdS') };
function tickCountdown() {
  const t = Math.max(0, eventAt - Date.now());
  cd.d.textContent = Math.floor(t / 864e5);
  cd.h.textContent = pad(Math.floor(t % 864e5 / 36e5));
  cd.m.textContent = pad(Math.floor(t % 36e5 / 6e4));
  cd.s.textContent = pad(Math.floor(t % 6e4 / 1e3));
}
tickCountdown();
setInterval(tickCountdown, 1000);

$('#calBtn').addEventListener('click', () => {
  const s = new Date(eventAt);
  const en = new Date(eventAt + CONFIG.durationHours * 36e5);
  const f = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const esc = t => t.replace(/,/g, '\\,');
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Shanesh Birthday Racing Safari//EN',
    'BEGIN:VEVENT', 'UID:shanesh-1st-birthday@invite',
    'DTSTAMP:' + f(new Date()), 'DTSTART:' + f(s), 'DTEND:' + f(en),
    "SUMMARY:Shanesh's 1st Birthday Racing Safari",
    'LOCATION:' + esc(CONFIG.venue),
    'DESCRIPTION:Come celebrate Shanesh turning one!',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = 'shanesh-birthday.ics';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  toast('Saved — open the file to add it');
});

$('#rsvpBtn').addEventListener('click', e => {
  if (!/^\d{8,15}$/.test(CONFIG.whatsapp)) {
    e.preventDefault();
    toast('The family WhatsApp number still needs to be added.');
    return;
  }
  const who = guest ? `This is ${guest}. ` : '';
  const msg = `Hello! ${who}I would like to RSVP for Shanesh's 1st birthday celebration on 21 November 2026 at 7:00 PM.`;
  e.currentTarget.href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;
  e.currentTarget.target = '_blank';
  e.currentTarget.rel = 'noopener';
});

/* =========================================================================
   3D EVENING BLUE JUNGLE + RACING BIRTHDAY WORLD (Three.js)
   ========================================================================= */
const canvas = $('#safari3d');
let renderer, scene, camera;
let coverMix = 1;
let targetCoverMix = 1;
let cakeLit = true;
let toggleCakeWish = () => {
  cakeLit = !cakeLit;
  $('#cakeWishBtn').textContent = cakeLit ? 'Tap the cake to make a wish' : 'Tap to relight the candle';
  if (!cakeLit) {
    confetti(85);
    Sound.chime();
    toast('Happy 1st birthday, Shanesh!');
  }
};

$('#cakeWishBtn').addEventListener('click', () => toggleCakeWish());

try {
  init3DWorld();
} catch (err) {
  console.warn('3D scene fallback:', err);
}

function init3DWorld() {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  scene = new THREE.Scene();
  const fogColorNight = new THREE.Color(0x163163);
  const fogColorParty = new THREE.Color(0x1e3f7a);
  scene.fog = new THREE.FogExp2(fogColorNight.getHex(), 0.017);

  camera = new THREE.PerspectiveCamera(46, innerWidth / innerHeight, 0.2, 220);

  /* ---------- Evening / Night-Time Blue Sky Dome + Moon + Stars ---------- */
  const skyGeo = new THREE.SphereGeometry(175, 24, 16);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTop: { value: new THREE.Color(0x071534) },
      uMid: { value: new THREE.Color(0x153570) },
      uBot: { value: new THREE.Color(0x28569c) },
    },
    vertexShader: `
      varying vec3 vPos;
      void main() {
        vPos = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uTop;
      uniform vec3 uMid;
      uniform vec3 uBot;
      varying vec3 vPos;
      void main() {
        float h = clamp(vPos.y, -0.1, 1.0);
        vec3 c = mix(uBot, uMid, smoothstep(-0.05, 0.28, h));
        c = mix(c, uTop, smoothstep(0.25, 0.85, h));
        gl_FragColor = vec4(c, 1.0);
      }
    `,
  });
  const skyDome = new THREE.Mesh(skyGeo, skyMat);
  scene.add(skyDome);

  // Twinkling evening stars & glowing moon (fog: false so they shine brightly!)
  const skyGroup = new THREE.Group();
  const starGeo = new THREE.BufferGeometry();
  const starVerts = [];
  for (let i = 0; i < 240; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 0.42;
    const r = 155;
    starVerts.push(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
    );
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3));
  const starField = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({ color: 0xe6f2ff, size: 1.25, sizeAttenuation: true, fog: false })
  );
  skyGroup.add(starField);

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(5.2, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xfff6cf, fog: false })
  );
  moon.position.set(-28, 52, -120);
  skyGroup.add(moon);
  scene.add(skyGroup);

  /* ---------- Evening Twilight & Moonlight Lighting ---------- */
  const hemiLight = new THREE.HemisphereLight(0x5284d4, 0x10291c, 0.82);
  scene.add(hemiLight);

  const moonLight = new THREE.DirectionalLight(0xa3c8ff, 0.95);
  moonLight.position.set(-16, 26, 14);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.set(1024, 1024);
  moonLight.shadow.camera.near = 2;
  moonLight.shadow.camera.far = 75;
  moonLight.shadow.camera.left = -22;
  moonLight.shadow.camera.right = 22;
  moonLight.shadow.camera.top = 22;
  moonLight.shadow.camera.bottom = -22;
  moonLight.shadow.bias = -0.0005;
  scene.add(moonLight);
  scene.add(moonLight.target);

  const rimLight = new THREE.DirectionalLight(0x4a86e8, 0.45);
  rimLight.position.set(18, 12, -18);
  scene.add(rimLight);

  /* ---------- Procedural Natural Textures + Checkered Flag + #1 Decal ---------- */
  function makeCanvasTex(size, drawFn, repeatX = 1, repeatY = 1) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    drawFn(g, size);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
    return tex;
  }

  const texGrass = makeCanvasTex(128, (g, s) => {
    g.fillStyle = '#3a7a42';
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 600; i++) {
      g.fillStyle = i % 2 ? 'rgba(95,175,90,0.22)' : 'rgba(18,55,28,0.24)';
      g.beginPath();
      g.arc(Math.random() * s, Math.random() * s, 1 + Math.random() * 3.5, 0, Math.PI * 2);
      g.fill();
    }
  }, 18, 52);

  const texRoad = makeCanvasTex(256, (g, s) => {
    const grad = g.createLinearGradient(0, 0, s, 0);
    grad.addColorStop(0, '#785432');
    grad.addColorStop(0.16, '#9c7145');
    grad.addColorStop(0.5, '#be915b');
    grad.addColorStop(0.84, '#9c7145');
    grad.addColorStop(1, '#785432');
    g.fillStyle = grad;
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 900; i++) {
      g.fillStyle = i % 3 ? 'rgba(85,52,24,0.18)' : 'rgba(255,235,195,0.16)';
      g.beginPath();
      g.arc(Math.random() * s, Math.random() * s, 0.8 + Math.random() * 2.5, 0, Math.PI * 2);
      g.fill();
    }
  }, 1, 24);

  const texBark = makeCanvasTex(128, (g, s) => {
    g.fillStyle = '#73492c';
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 90; i++) {
      g.fillStyle = i % 2 ? 'rgba(42,22,10,0.32)' : 'rgba(155,105,65,0.22)';
      g.fillRect(Math.random() * s, 0, 2 + Math.random() * 5, s);
    }
  }, 1, 2);

  const texGiraffe = makeCanvasTex(256, (g, s) => {
    g.fillStyle = '#f8cb66';
    g.fillRect(0, 0, s, s);
    g.fillStyle = '#b46228';
    for (let y = 16; y < s; y += 34) {
      for (let x = 14; x < s; x += 36) {
        const ox = x + ((y / 34) % 2 ? 14 : 0) + (Math.random() - .5) * 8;
        const oy = y + (Math.random() - .5) * 8;
        g.beginPath();
        g.ellipse(ox, oy, 8 + Math.random() * 6, 6 + Math.random() * 6, Math.random() * 3, 0, Math.PI * 2);
        g.fill();
      }
    }
  });

  const texTiger = makeCanvasTex(256, (g, s) => {
    g.fillStyle = '#f48628';
    g.fillRect(0, 0, s, s);
    g.strokeStyle = '#2b180e';
    g.lineCap = 'round';
    for (let y = 14; y < s; y += 26) {
      g.lineWidth = 6 + Math.random() * 4;
      g.beginPath();
      g.moveTo(0, y);
      g.quadraticCurveTo(s * .5, y + (Math.random() - .5) * 18, s, y + (Math.random() - .5) * 10);
      g.stroke();
    }
  });

  const texZebra = makeCanvasTex(256, (g, s) => {
    g.fillStyle = '#f6f7f9';
    g.fillRect(0, 0, s, s);
    g.strokeStyle = '#23262c';
    g.lineCap = 'round';
    for (let x = 10; x < s; x += 26) {
      g.lineWidth = 9 + Math.random() * 4;
      g.beginPath();
      g.moveTo(x, 0);
      g.bezierCurveTo(x + 12, s * .33, x - 12, s * .66, x + 4, s);
      g.stroke();
    }
  });

  const texChecker = makeCanvasTex(256, (g, s) => {
    const cells = 8;
    const step = s / cells;
    for (let y = 0; y < cells; y++) {
      for (let x = 0; x < cells; x++) {
        g.fillStyle = (x + y) % 2 === 0 ? '#ffffff' : '#15181d';
        g.fillRect(x * step, y * step, step, step);
      }
    }
  });

  const texNumOne = makeCanvasTex(128, (g, s) => {
    g.fillStyle = '#1859b8';
    g.beginPath();
    g.arc(s / 2, s / 2, s * 0.45, 0, Math.PI * 2);
    g.fill();
    g.lineWidth = 7;
    g.strokeStyle = '#ffffff';
    g.stroke();
    g.fillStyle = '#ffffff';
    g.font = 'bold 74px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('1', s / 2, s / 2 + 4);
  });

  const texGlow = makeCanvasTex(64, (g, s) => {
    const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grad.addColorStop(0, 'rgba(255, 245, 130, 1)');
    grad.addColorStop(0.35, 'rgba(255, 215, 60, 0.75)');
    grad.addColorStop(1, 'rgba(255, 190, 20, 0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, s, s);
  });

  /* ---------- Winding 3D Jungle Road Spline ---------- */
  const roadPoints = [
    new THREE.Vector3(0, 0.65, -148),
    new THREE.Vector3(-4.5, 0.55, -132),
    new THREE.Vector3(4.2, 0.45, -112),
    new THREE.Vector3(5.6, 0.35, -94),
    new THREE.Vector3(-4.8, 0.35, -72),
    new THREE.Vector3(-5.6, 0.3, -54),
    new THREE.Vector3(2.8, 0.25, -34),
    new THREE.Vector3(5.4, 0.2, -16),
    new THREE.Vector3(1.4, 0.15, 2),
    new THREE.Vector3(0, 0.12, 16),
  ];
  const roadCurve = new THREE.CatmullRomCurve3(roadPoints, false, 'catmullrom', 0.5);
  const ROAD_SAMPLES = 280;
  const roadSamples = [];
  for (let i = 0; i <= ROAD_SAMPLES; i++) {
    const t = i / ROAD_SAMPLES;
    roadSamples.push({ t, p: roadCurve.getPointAt(t), tan: roadCurve.getTangentAt(t) });
  }

  function nearestRoad(x, z) {
    let bestD2 = Infinity;
    let best = roadSamples[0];
    for (let i = 0; i < roadSamples.length; i++) {
      const s = roadSamples[i];
      const dx = x - s.p.x;
      const dz = z - s.p.z;
      const d2 = dx * dx + dz * dz;
      if (d2 < bestD2) { bestD2 = d2; best = s; }
    }
    return { dist: Math.sqrt(bestD2), sample: best };
  }

  /* ---------- Sculpted Evening Jungle Terrain ---------- */
  const terrW = 68, terrL = 210, segX = 64, segZ = 175;
  const terrGeo = new THREE.PlaneGeometry(terrW, terrL, segX, segZ);
  terrGeo.rotateX(-Math.PI / 2);
  terrGeo.translate(0, 0, -64);

  const posAttr = terrGeo.attributes.position;
  const colArr = new Float32Array(posAttr.count * 3);
  const cVerge = new THREE.Color(0x6e6942);
  const cGrass = new THREE.Color(0x3a8245);
  const cDeep = new THREE.Color(0x1b4d32);
  const tmpCol = new THREE.Color();

  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i);
    const vz = posAttr.getZ(i);
    const { dist, sample } = nearestRoad(vx, vz);
    const hillNoise = (Math.sin(vx * 0.22 + vz * 0.11) + Math.cos(vx * 0.14 - vz * 0.18)) * 0.55;
    const bank = smoothstep(2.3, 9.5, dist) * (1.2 + Math.max(0, hillNoise) * 1.45);
    const finaleFlat = 1 - smoothstep(4, 24, vz);
    const y = sample.p.y - 0.05 + bank * (1 - finaleFlat * 0.72);
    posAttr.setY(i, y);

    const gMix = smoothstep(1.9, 4.4, dist);
    const dMix = smoothstep(6.0, 17.0, dist);
    tmpCol.copy(cVerge).lerp(cGrass, gMix).lerp(cDeep, dMix);
    colArr[i * 3] = tmpCol.r;
    colArr[i * 3 + 1] = tmpCol.g;
    colArr[i * 3 + 2] = tmpCol.b;
  }
  terrGeo.setAttribute('color', new THREE.BufferAttribute(colArr, 3));
  terrGeo.computeVertexNormals();

  const terrain = new THREE.Mesh(
    terrGeo,
    new THREE.MeshStandardMaterial({ map: texGrass, vertexColors: true, roughness: 0.9 })
  );
  terrain.receiveShadow = true;
  scene.add(terrain);

  /* ---------- Winding 3D Road Ribbon ---------- */
  const roadHalfW = 2.05;
  const rVerts = [], rUVs = [], rIndices = [];
  for (let i = 0; i <= ROAD_SAMPLES; i++) {
    const { p, tan } = roadSamples[i];
    const side = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
    const L = p.clone().addScaledVector(side, -roadHalfW);
    const R = p.clone().addScaledVector(side, roadHalfW);
    rVerts.push(L.x, L.y + 0.025, L.z, R.x, R.y + 0.025, R.z);
    rUVs.push(0, i / 12, 1, i / 12);
    if (i < ROAD_SAMPLES) {
      const b = i * 2;
      rIndices.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
    }
  }
  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(rVerts, 3));
  roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(rUVs, 2));
  roadGeo.setIndex(rIndices);
  roadGeo.computeVertexNormals();
  const roadMesh = new THREE.Mesh(
    roadGeo,
    new THREE.MeshStandardMaterial({ map: texRoad, roughness: 0.9, metalness: 0 })
  );
  roadMesh.receiveShadow = true;
  scene.add(roadMesh);

  /* ---------- Shared Materials & Helpers ---------- */
  const matBark = new THREE.MeshStandardMaterial({ map: texBark, roughness: 0.92 });
  const leafGreens = [0x399148, 0x4ba852, 0x2a763b, 0x5ab854].map(
    c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.82 })
  );
  const matPureWhite = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, roughness: 0.22, metalness: 0.08, clearcoat: 0.75, clearcoatRoughness: 0.14,
  });
  const matRoyalBlue = new THREE.MeshStandardMaterial({ color: 0x1a66d1, roughness: 0.35, metalness: 0.1 });
  const matBlack = new THREE.MeshStandardMaterial({ color: 0x181b20, roughness: 0.55 });
  const matRubber = new THREE.MeshStandardMaterial({ color: 0x1e2228, roughness: 0.85 });
  const matChrome = new THREE.MeshStandardMaterial({ color: 0xe3eaf2, roughness: 0.2, metalness: 0.85 });
  const matChecker = new THREE.MeshStandardMaterial({ map: texChecker, roughness: 0.55, side: THREE.DoubleSide });

  const matEyeWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
  const matEyeDark = new THREE.MeshStandardMaterial({ color: 0x1a120d, roughness: 0.12 });
  const matCatch = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const matBlush = new THREE.MeshStandardMaterial({ color: 0xff8c82, roughness: 0.7 });
  const matCream = new THREE.MeshStandardMaterial({ color: 0xfff4d6, roughness: 0.78 });
  const matPink = new THREE.MeshStandardMaterial({ color: 0xf4a4a8, roughness: 0.75 });

  function makeEye(r = 0.095) {
    const g = new THREE.Group();
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 12), matEyeWhite);
    sclera.scale.set(1, 1.15, 0.75);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(r * 0.64, 12, 12), matEyeDark);
    pupil.position.set(0, 0, r * 0.36);
    const catch1 = new THREE.Mesh(new THREE.SphereGeometry(r * 0.24, 8, 8), matCatch);
    catch1.position.set(-r * 0.24, r * 0.28, r * 0.78);
    g.add(sclera, pupil, catch1);
    return g;
  }

  /* ---------- Waving Black & White Checkered Flag Helper ---------- */
  const wavingFlags = [];
  function createCheckeredFlagPole(height = 1.25, scale = 0.72) {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.055 * scale, 0.07 * scale, height * scale, 8), matChrome);
    pole.position.y = height * scale * 0.5;
    pole.castShadow = true;
    const finial = new THREE.Mesh(
      new THREE.SphereGeometry(0.11 * scale, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0xffc23d, metalness: 0.4, roughness: 0.3 })
    );
    finial.position.y = height * scale;

    const flagGeo = new THREE.PlaneGeometry(1.15 * scale, 0.78 * scale, 8, 4);
    flagGeo.translate(0.58 * scale, 0, 0);
    const flagMesh = new THREE.Mesh(flagGeo, matChecker);
    flagMesh.position.y = height * scale - 0.44 * scale;
    flagMesh.castShadow = true;

    g.add(pole, finial, flagMesh);
    wavingFlags.push({ mesh: flagMesh, basePos: flagGeo.attributes.position.array.slice(), phase: Math.random() * 6 });
    return g;
  }

  /* ---------- Lush 3D Canopy Trees, Palms, Ferns & Bushes (Preserved!) ---------- */
  const swayingFlora = [];
  const geoPuff = new THREE.IcosahedronGeometry(1, 1);

  function createCanopyTree(scale = 1, variant = 0) {
    const g = new THREE.Group();
    const trunkH = 3.2 * scale;
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22 * scale, 0.44 * scale, trunkH, 9),
      matBark
    );
    trunk.position.y = trunkH * 0.5;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    g.add(trunk);

    for (let r = 0; r < 3; r++) {
      const root = new THREE.Mesh(new THREE.ConeGeometry(0.28 * scale, 0.9 * scale, 6), matBark);
      const a = (r / 3) * Math.PI * 2 + variant;
      root.position.set(Math.cos(a) * 0.3 * scale, 0.32 * scale, Math.sin(a) * 0.3 * scale);
      root.rotation.z = -Math.cos(a) * 0.45;
      root.rotation.x = Math.sin(a) * 0.45;
      g.add(root);
    }

    const crown = new THREE.Group();
    crown.position.y = trunkH;
    const puffs = [
      [0, 0.9, 0, 1.65],
      [-0.95, 0.4, 0.5, 1.25],
      [0.95, 0.45, -0.4, 1.25],
      [0.35, 0.35, 0.95, 1.15],
      [-0.4, 0.3, -0.9, 1.15],
      [0, 1.65, 0, 1.1],
    ];
    puffs.forEach(([px, py, pz, pr], idx) => {
      const m = new THREE.Mesh(geoPuff, leafGreens[(idx + variant) % leafGreens.length]);
      m.position.set(px * scale, py * scale, pz * scale);
      m.scale.set(pr * scale, pr * 0.84 * scale, pr * scale);
      m.rotation.set(idx * 0.4, idx * 0.8, 0);
      m.castShadow = true;
      m.receiveShadow = true;
      crown.add(m);
    });
    g.add(crown);
    swayingFlora.push({ obj: crown, phase: Math.random() * 6, amp: 0.025 });
    return g;
  }

  function createPalmTree(scale = 1) {
    const g = new THREE.Group();
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.35 * scale, 1.8 * scale, 0.1 * scale),
      new THREE.Vector3(0.65 * scale, 3.6 * scale, 0.25 * scale),
      new THREE.Vector3(0.55 * scale, 4.9 * scale, 0.15 * scale),
    ]);
    const trunk = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.22 * scale, 7, false), matBark);
    trunk.castShadow = true;
    g.add(trunk);

    const head = new THREE.Group();
    head.position.set(0.55 * scale, 4.85 * scale, 0.15 * scale);
    const frondGeo = new THREE.ConeGeometry(0.45 * scale, 2.5 * scale, 5);
    frondGeo.scale(1, 1, 0.18);
    frondGeo.translate(0, 1.15 * scale, 0);

    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const pivot = new THREE.Group();
      pivot.rotation.y = a;
      const frond = new THREE.Mesh(frondGeo, leafGreens[i % 3]);
      frond.rotation.x = 1.15 + (i % 2) * 0.18;
      frond.castShadow = true;
      pivot.add(frond);
      head.add(pivot);
    }
    const cocoMat = new THREE.MeshStandardMaterial({ color: 0x6b3e1f, roughness: 0.8 });
    for (let c = 0; c < 3; c++) {
      const coco = new THREE.Mesh(new THREE.SphereGeometry(0.18 * scale, 8, 8), cocoMat);
      const ca = (c / 3) * Math.PI * 2;
      coco.position.set(Math.cos(ca) * 0.25 * scale, -0.15 * scale, Math.sin(ca) * 0.25 * scale);
      head.add(coco);
    }
    g.add(head);
    swayingFlora.push({ obj: head, phase: Math.random() * 6, amp: 0.04 });
    return g;
  }

  const flowerCols = [0xff7f98, 0xffd658, 0xfff5e4].map(
    c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55 })
  );
  function createFlowerBush(scale = 1, flowers = true) {
    const g = new THREE.Group();
    const blobs = [[0, 0.45, 0, 0.72], [-0.52, 0.35, 0.2, 0.52], [0.5, 0.34, -0.18, 0.55], [0.1, 0.35, 0.5, 0.45]];
    blobs.forEach(([bx, by, bz, br], idx) => {
      const m = new THREE.Mesh(geoPuff, leafGreens[(idx + 1) % leafGreens.length]);
      m.position.set(bx * scale, by * scale, bz * scale);
      m.scale.setScalar(br * scale);
      m.castShadow = true;
      m.receiveShadow = true;
      g.add(m);
    });
    if (flowers) {
      for (let i = 0; i < 6; i++) {
        const f = new THREE.Mesh(new THREE.SphereGeometry(0.11 * scale, 7, 7), flowerCols[i % flowerCols.length]);
        const a = (i / 6) * Math.PI * 2 + 0.3;
        f.position.set(Math.cos(a) * 0.65 * scale, (0.45 + (i % 2) * 0.26) * scale, Math.sin(a) * 0.58 * scale);
        g.add(f);
      }
    }
    swayingFlora.push({ obj: g, phase: Math.random() * 6, amp: 0.018 });
    return g;
  }

  function createFern(scale = 1) {
    const g = new THREE.Group();
    const leafGeo = new THREE.ConeGeometry(0.28 * scale, 1.3 * scale, 4);
    leafGeo.scale(1, 1, 0.14);
    leafGeo.translate(0, 0.65 * scale, 0);
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const m = new THREE.Mesh(leafGeo, leafGreens[i % 2]);
      m.rotation.order = 'YXZ';
      m.rotation.y = a;
      m.rotation.x = 0.72 + (i % 2) * 0.25;
      m.castShadow = true;
      g.add(m);
    }
    swayingFlora.push({ obj: g, phase: Math.random() * 6, amp: 0.03 });
    return g;
  }

  let seed = 42;
  const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  function placeAtGround(obj, x, z) {
    const { dist, sample } = nearestRoad(x, z);
    const hillNoise = (Math.sin(x * 0.22 + z * 0.11) + Math.cos(x * 0.14 - z * 0.18)) * 0.55;
    const bank = smoothstep(2.3, 9.5, dist) * (1.2 + Math.max(0, hillNoise) * 1.45);
    const finaleFlat = 1 - smoothstep(4, 24, z);
    obj.position.set(x, sample.p.y - 0.05 + bank * (1 - finaleFlat * 0.72), z);
  }

  for (let i = 0; i < 125; i++) {
    const z = -152 + (i / 125) * 176;
    const side = i % 2 === 0 ? -1 : 1;
    const roadPt = nearestRoad(0, z).sample.p;
    const offset = 3.9 + rand() * 14;
    const x = roadPt.x + side * offset + (rand() - 0.5) * 2.5;
    if (z > 6 && Math.abs(x) < 7.5) continue;
    const { dist } = nearestRoad(x, z);
    if (dist < 3.4) continue;

    const r = rand();
    let flora;
    if (r < 0.42) flora = createCanopyTree(0.85 + rand() * 0.65, i);
    else if (r < 0.64) flora = createPalmTree(0.8 + rand() * 0.55);
    else if (r < 0.85) flora = createFlowerBush(0.85 + rand() * 0.55, rand() > 0.3);
    else flora = createFern(0.85 + rand() * 0.5);

    flora.rotation.y = rand() * Math.PI * 2;
    placeAtGround(flora, x, z);
    scene.add(flora);
  }

  const matStone = new THREE.MeshStandardMaterial({ color: 0x6f7b72, roughness: 0.9 });
  for (let i = 0; i < 72; i++) {
    const t = 0.03 + (i / 72) * 0.91;
    const pt = roadCurve.getPointAt(t);
    const tan = roadCurve.getTangentAt(t);
    const side = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
    const dir = i % 2 === 0 ? -1 : 1;
    const dist = 2.65 + rand() * 1.1;
    const pos = pt.clone().addScaledVector(side, dir * dist);

    const kind = rand();
    const obj = kind < 0.5 ? createFlowerBush(0.6 + rand() * 0.35, true)
      : kind < 0.82 ? createFern(0.7 + rand() * 0.35)
      : (() => {
          const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45 + rand() * 0.35, 1), matStone);
          rock.scale.set(1.2, 0.72, 1);
          rock.castShadow = true;
          rock.receiveShadow = true;
          return rock;
        })();
    placeAtGround(obj, pos.x, pos.z);
    scene.add(obj);
  }

  /* ---------- Instanced Swaying Grass Tufts along Trail Verges ---------- */
  const grassBladeGeo = new THREE.ConeGeometry(0.08, 0.42, 4);
  grassBladeGeo.translate(0, 0.2, 0);
  const grassBladeMat = new THREE.MeshStandardMaterial({ color: 0x4aa34a, roughness: 0.85 });
  const GRASS_COUNT = 420;
  const grassInst = new THREE.InstancedMesh(grassBladeGeo, grassBladeMat, GRASS_COUNT);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < GRASS_COUNT; i++) {
    const t = rand() * 0.96;
    const pt = roadCurve.getPointAt(t);
    const tan = roadCurve.getTangentAt(t);
    const side = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
    const dir = rand() > 0.5 ? 1 : -1;
    const d = 2.15 + rand() * 2.2;
    const px = pt.x + side.x * dir * d;
    const pz = pt.z + side.z * dir * d;
    placeAtGround(dummy, px, pz);
    dummy.rotation.set((rand() - .5) * 0.35, rand() * Math.PI * 2, (rand() - .5) * 0.35);
    dummy.scale.setScalar(0.75 + rand() * 0.85);
    dummy.updateMatrix();
    grassInst.setMatrixAt(i, dummy.matrix);
  }
  scene.add(grassInst);

  /* ---------- Soft Evening Clouds ---------- */
  const clouds = [];
  const matCloud = new THREE.MeshStandardMaterial({ color: 0x6f92cc, roughness: 0.95 });
  for (let i = 0; i < 12; i++) {
    const cg = new THREE.Group();
    [[0, 0, 0, 2.2], [-1.8, -0.3, 0.2, 1.6], [1.9, -0.25, -0.2, 1.7], [0.5, 0.4, 0.4, 1.4]].forEach(([x, y, z, r]) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 10), matCloud);
      m.position.set(x, y, z);
      m.scale.set(1.2, 0.75, 0.9);
      cg.add(m);
    });
    cg.position.set((rand() - .5) * 65, 16 + rand() * 8, -140 + i * 16);
    scene.add(cg);
    clouds.push({ obj: cg, speed: 0.35 + rand() * 0.45 });
  }

  /* =======================================================================
     GLOWING YELLOW FIREFLIES LIGHTING UP THE EVENING JUNGLE PATH
     ======================================================================= */
  const fireflies = [];
  const flyCoreMat = new THREE.MeshBasicMaterial({ color: 0xfff37a, fog: false });
  const flyCoreGeo = new THREE.SphereGeometry(0.085, 8, 8);
  const flyHaloMat = new THREE.SpriteMaterial({
    map: texGlow,
    color: 0xffdf4a,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
  });

  for (let i = 0; i < 72; i++) {
    const t = rand();
    const pt = roadCurve.getPointAt(t);
    const fg = new THREE.Group();
    const core = new THREE.Mesh(flyCoreGeo, flyCoreMat);
    const halo = new THREE.Sprite(flyHaloMat.clone());
    halo.scale.setScalar(0.9 + rand() * 0.55);
    fg.add(core, halo);

    const spreadX = i % 2 === 0 ? (rand() - .5) * 5.4 : (rand() - .5) * 11;
    const basePos = new THREE.Vector3(pt.x + spreadX, pt.y + 0.65 + rand() * 2.4, pt.z + (rand() - .5) * 5);
    fg.position.copy(basePos);
    scene.add(fg);
    fireflies.push({ mesh: fg, halo, base: basePos, phase: rand() * 10, speed: 0.9 + rand() * 0.9 });
  }

  // Warm yellow PointLights on path-side firefly clusters lighting the trail
  for (let i = 0; i < 6; i++) {
    const t = 0.14 + (i / 6) * 0.72;
    const pt = roadCurve.getPointAt(t);
    const side = i % 2 === 0 ? 1.8 : -1.8;
    const fLight = new THREE.PointLight(0xffdf55, 2.2, 10, 1.6);
    fLight.position.set(pt.x + side, pt.y + 1.15, pt.z);
    scene.add(fLight);
  }

  /* =======================================================================
     DETAILED WHITE #1 RACING CAR + LITTLE BEAR DRIVER + ROAD HEADLIGHTS
     ======================================================================= */
  const raceCar = new THREE.Group();
  const carChassis = new THREE.Group();
  raceCar.add(carChassis);

  const lowerTub = new THREE.Mesh(new RoundedBoxGeometry(1.56, 0.42, 3.1, 4, 0.12), matPureWhite);
  lowerTub.position.set(0, 0.46, -0.05);
  lowerTub.castShadow = true;
  carChassis.add(lowerTub);

  const noseCone = new THREE.Mesh(new RoundedBoxGeometry(1.1, 0.32, 1.15, 4, 0.14), matPureWhite);
  noseCone.position.set(0, 0.48, 1.18);
  noseCone.rotation.x = 0.08;
  noseCone.castShadow = true;
  carChassis.add(noseCone);

  const frontWing = new THREE.Mesh(new RoundedBoxGeometry(1.88, 0.08, 0.38, 3, 0.03), matRoyalBlue);
  frontWing.position.set(0, 0.28, 1.64);
  frontWing.castShadow = true;
  carChassis.add(frontWing);

  [-0.14, 0.14].forEach(sx => {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.02, 1.4), matRoyalBlue);
    stripe.position.set(sx, 0.67, 0.92);
    carChassis.add(stripe);
  });

  const numDecal = new THREE.Mesh(
    new THREE.CircleGeometry(0.28, 20),
    new THREE.MeshBasicMaterial({ map: texNumOne })
  );
  numDecal.rotation.x = -Math.PI / 2 + 0.08;
  numDecal.position.set(0, 0.68, 1.18);
  carChassis.add(numDecal);

  [-0.78, 0.78].forEach(px => {
    const pod = new THREE.Mesh(new RoundedBoxGeometry(0.32, 0.34, 1.35, 3, 0.08), matPureWhite);
    pod.position.set(px, 0.46, -0.15);
    pod.castShadow = true;
    const accent = new THREE.Mesh(new RoundedBoxGeometry(0.06, 0.12, 1.05, 2, 0.02), matRoyalBlue);
    accent.position.set(px + (px > 0 ? 0.15 : -0.15), 0.48, -0.15);
    carChassis.add(pod, accent);
  });

  const engineCover = new THREE.Mesh(new RoundedBoxGeometry(1.12, 0.44, 0.92, 4, 0.14), matPureWhite);
  engineCover.position.set(0, 0.78, -0.85);
  engineCover.castShadow = true;
  const rollHoop = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.055, 8, 16, Math.PI), matRoyalBlue);
  rollHoop.position.set(0, 0.92, -0.52);
  carChassis.add(engineCover, rollHoop);

  [-0.45, 0.45].forEach(wx => {
    const strut = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.46, 0.26), matBlack);
    strut.position.set(wx, 0.96, -1.36);
    carChassis.add(strut);
  });
  const rearWing = new THREE.Mesh(new RoundedBoxGeometry(1.76, 0.1, 0.42, 3, 0.03), matRoyalBlue);
  rearWing.position.set(0, 1.2, -1.4);
  rearWing.castShadow = true;
  const wingEndL = new THREE.Mesh(new RoundedBoxGeometry(0.06, 0.32, 0.48, 2, 0.02), matPureWhite);
  wingEndL.position.set(-0.88, 1.15, -1.4);
  const wingEndR = wingEndL.clone();
  wingEndR.position.x = 0.88;
  carChassis.add(rearWing, wingEndL, wingEndR);

  // Glowing Front Headlamps + REAL 3D SpotLight Beams lighting up the road ahead
  const matHeadlamp = new THREE.MeshStandardMaterial({ color: 0xfffce0, emissive: 0xffe88c, emissiveIntensity: 1.6 });
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xfff3b8,
    transparent: true,
    opacity: 0.14,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const beamGeo = new THREE.ConeGeometry(2.1, 9.5, 16, 1, true);
  beamGeo.translate(0, -4.75, 0);
  beamGeo.rotateX(-Math.PI / 2);

  [-0.56, 0.56].forEach(lx => {
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.08, 14), matChrome);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(lx, 0.56, 1.48);
    const lens = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), matHeadlamp);
    lens.scale.set(1, 1, 0.45);
    lens.position.set(lx, 0.56, 1.52);

    const headSpot = new THREE.SpotLight(0xfff4c8, 32, 26, Math.PI / 5, 0.62, 1.35);
    headSpot.position.set(lx, 0.62, 1.56);
    headSpot.target.position.set(lx * 1.4, -0.4, 10.5);
    carChassis.add(rim, lens, headSpot, headSpot.target);

    const cone = new THREE.Mesh(beamGeo, beamMat);
    cone.position.set(lx, 0.58, 1.56);
    cone.rotation.x = 0.11;
    carChassis.add(cone);
  });

  const cockpitGlass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.56, 0.62, 0.24, 16, 1, true, -Math.PI * 0.45, Math.PI * 0.9),
    new THREE.MeshPhysicalMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.46, roughness: 0.08, side: THREE.DoubleSide })
  );
  cockpitGlass.position.set(0, 0.78, 0.15);
  carChassis.add(cockpitGlass);

  [-0.24, 0.24].forEach(ex => {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.32, 12), matChrome);
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(ex, 0.4, -1.62);
    carChassis.add(pipe);
  });

  const steerWheel = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.03, 8, 18), matBlack);
  steerWheel.position.set(0, 0.86, 0.16);
  steerWheel.rotation.x = 0.72;
  carChassis.add(steerWheel);

  function buildRaceWheel() {
    const wg = new THREE.Group();
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.41, 0.41, 0.34, 20), matRubber);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.36, 14), matChrome);
    rim.rotation.z = Math.PI / 2;
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.38, 10), matRoyalBlue);
    hub.rotation.z = Math.PI / 2;
    wg.add(tire, rim, hub);
    return wg;
  }
  const carWheels = [];
  const frontSteerPivots = [];
  [[-0.96, 0.92, true], [0.96, 0.92, true], [-0.98, -0.92, false], [0.98, -0.92, false]].forEach(([wx, wz, isFront]) => {
    const pivot = new THREE.Group();
    pivot.position.set(wx, 0.41, wz);
    const w = buildRaceWheel();
    pivot.add(w);
    raceCar.add(pivot);
    carWheels.push(w);
    if (isFront) frontSteerPivots.push(pivot);
  });

  /* ---------- Little Bear Riding / Driving the Racing Car ---------- */
  const bearDriver = new THREE.Group();
  bearDriver.position.set(0, 0.74, -0.14);

  const matBearFur = new THREE.MeshStandardMaterial({ color: 0xc98850, roughness: 0.78 });
  const bearSuit = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.22, 6, 12), matRoyalBlue);
  bearSuit.position.y = 0.12;
  const suitStripe = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.32, 0.48), matPureWhite);
  suitStripe.position.y = 0.14;

  const bearHeadGroup = new THREE.Group();
  bearHeadGroup.position.y = 0.52;

  const bearSkull = new THREE.Mesh(new THREE.SphereGeometry(0.31, 18, 18), matBearFur);
  bearSkull.castShadow = true;
  const bearSnout = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 14), matCream);
  bearSnout.scale.set(1.15, 0.88, 0.95);
  bearSnout.position.set(0, -0.07, 0.25);
  const bearNose = new THREE.Mesh(new THREE.SphereGeometry(0.052, 10, 10), matBlack);
  bearNose.position.set(0, -0.02, 0.39);
  const bearSmile = new THREE.Mesh(
    new THREE.TorusGeometry(0.055, 0.014, 6, 12, Math.PI),
    matBlack
  );
  bearSmile.position.set(0, -0.085, 0.37);
  bearSmile.rotation.z = Math.PI;

  const bEyeL = makeEye(0.058); bEyeL.position.set(-0.11, 0.05, 0.265);
  const bEyeR = makeEye(0.058); bEyeR.position.set(0.11, 0.05, 0.265);
  const bCheekL = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), matBlush);
  bCheekL.position.set(-0.19, -0.04, 0.23);
  const bCheekR = bCheekL.clone(); bCheekR.position.x = 0.19;

  [-0.24, 0.24].forEach(ex => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), matBearFur);
    ear.position.set(ex, 0.26, -0.02);
    const innerEar = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 10), matCream);
    innerEar.position.set(ex, 0.26, 0.04);
    bearHeadGroup.add(ear, innerEar);
  });

  const bearCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.325, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.48),
    matPureWhite
  );
  bearCap.position.set(0, 0.08, -0.03);
  bearCap.rotation.x = -0.25;
  const bearCapStripe = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.24, 0.46), matRoyalBlue);
  bearCapStripe.position.set(0, 0.27, -0.08);
  bearCapStripe.rotation.x = -0.25;

  [-0.1, 0.1].forEach(gx => {
    const gogRim = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.016, 8, 14), matBlack);
    gogRim.position.set(gx, 0.2, 0.24);
    gogRim.rotation.x = -0.35;
    const gogLens = new THREE.Mesh(
      new THREE.CircleGeometry(0.054, 12),
      new THREE.MeshPhysicalMaterial({ color: 0x74c6ff, roughness: 0.1, metalness: 0.2 })
    );
    gogLens.position.set(gx, 0.2, 0.248);
    gogLens.rotation.x = -0.35;
    bearHeadGroup.add(gogRim, gogLens);
  });

  bearHeadGroup.add(bearSkull, bearSnout, bearNose, bearSmile, bEyeL, bEyeR, bCheekL, bCheekR, bearCap, bearCapStripe);

  const steerPaw = new THREE.Mesh(new THREE.SphereGeometry(0.074, 8, 8), matBearFur);
  steerPaw.position.set(-0.18, 0.18, 0.24);
  const bearWaveArm = new THREE.Group();
  bearWaveArm.position.set(0.25, 0.2, 0.1);
  const bearArmTube = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.16, 6, 8), matRoyalBlue);
  bearArmTube.position.y = 0.11;
  const bearWavePaw = new THREE.Mesh(new THREE.SphereGeometry(0.072, 8, 8), matBearFur);
  bearWavePaw.position.y = 0.23;
  bearWaveArm.add(bearArmTube, bearWavePaw);

  bearDriver.add(bearSuit, suitStripe, bearHeadGroup, steerPaw, bearWaveArm);
  carChassis.add(bearDriver);
  scene.add(raceCar);

  /* =======================================================================
     FRIENDLY 3D JUNGLE ANIMALS (Each holding a Black & White Racing Flag!)
     ======================================================================= */
  const interactiveObjects = [];
  const animatedAnimals = [];

  function buildAnimal(kind, scale = 1) {
    const root = new THREE.Group();
    const bodyGroup = new THREE.Group();
    root.add(bodyGroup);
    const headGroup = new THREE.Group();
    let waveArm = null;
    let trunkGroup = null;

    if (kind === 'giraffe') {
      const matG = new THREE.MeshStandardMaterial({ map: texGiraffe, roughness: 0.78 });
      const matHorn = new THREE.MeshStandardMaterial({ color: 0x6d3e1e, roughness: 0.7 });
      const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.55, 0.55, 8, 14), matG);
      torso.position.y = 0.7; torso.castShadow = true;
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.34, 2.05, 12), matG);
      neck.position.set(0, 1.95, 0.12); neck.rotation.x = 0.08; neck.castShadow = true;
      headGroup.position.set(0, 3.05, 0.24);
      const skull = new THREE.Mesh(new THREE.SphereGeometry(0.54, 16, 16), matG);
      skull.castShadow = true;
      const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.38, 14, 14), matCream);
      muzzle.scale.set(1.05, 0.78, 1.15); muzzle.position.set(0, -0.22, 0.42);
      const eL = makeEye(0.11); eL.position.set(-0.24, 0.08, 0.46);
      const eR = makeEye(0.11); eR.position.set(0.24, 0.08, 0.46);
      [-0.18, 0.18].forEach(hx => {
        const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.28, 8), matG);
        stalk.position.set(hx, 0.56, -0.05);
        const knob = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), matHorn);
        knob.position.set(hx, 0.72, -0.05);
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10), matG);
        ear.scale.set(1.4, 0.5, 0.6);
        ear.position.set(hx * 3.1, 0.26, -0.08);
        ear.rotation.z = hx > 0 ? 0.35 : -0.35;
        headGroup.add(stalk, knob, ear);
      });
      waveArm = new THREE.Group();
      waveArm.position.set(0.55, 1.05, 0.2);
      const armMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.48, 6, 10), matG);
      armMesh.position.y = 0.28;
      waveArm.add(armMesh);
      headGroup.add(skull, muzzle, eL, eR);
      bodyGroup.add(torso, neck, headGroup, waveArm);
    }

    if (kind === 'elephant') {
      const matE = new THREE.MeshStandardMaterial({ color: 0x9aa6b2, roughness: 0.8 });
      const torso = new THREE.Mesh(new THREE.SphereGeometry(0.95, 16, 16), matE);
      torso.scale.set(1.05, 0.95, 1.1); torso.position.y = 0.95; torso.castShadow = true;
      headGroup.position.set(0, 1.65, 0.35);
      const skull = new THREE.Mesh(new THREE.SphereGeometry(0.72, 16, 16), matE);
      skull.castShadow = true;
      const eL = makeEye(0.11); eL.position.set(-0.28, 0.14, 0.62);
      const eR = makeEye(0.11); eR.position.set(0.28, 0.14, 0.62);
      [-1, 1].forEach(s => {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.58, 14, 14), matE);
        ear.scale.set(0.9, 1.05, 0.24);
        ear.position.set(s * 0.78, 0.08, -0.1);
        ear.rotation.y = s * -0.35;
        const inner = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 12), matPink);
        inner.scale.set(0.85, 1, 0.24);
        inner.position.set(s * 0.76, 0.06, -0.02);
        inner.rotation.y = s * -0.35;
        const tusk = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.36, 8), matCream);
        tusk.position.set(s * 0.26, -0.34, 0.62);
        tusk.rotation.x = 2.4;
        headGroup.add(ear, inner, tusk);
      });
      trunkGroup = new THREE.Group();
      trunkGroup.position.set(0, -0.14, 0.65);
      const trunkCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, -0.38, 0.25),
        new THREE.Vector3(0, -0.58, 0.56),
        new THREE.Vector3(0, -0.32, 0.74),
      ]);
      const trunkMesh = new THREE.Mesh(new THREE.TubeGeometry(trunkCurve, 14, 0.15, 10, false), matE);
      trunkMesh.castShadow = true;
      trunkGroup.add(trunkMesh);
      waveArm = new THREE.Group();
      waveArm.position.set(0.82, 1.0, 0.35);
      const armMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.45, 6, 10), matE);
      armMesh.position.y = 0.24;
      waveArm.add(armMesh);
      headGroup.add(skull, eL, eR, trunkGroup);
      bodyGroup.add(torso, headGroup, waveArm);
    }

    if (kind === 'lion') {
      const matGold = new THREE.MeshStandardMaterial({ color: 0xf4bd52, roughness: 0.75 });
      const matMane = new THREE.MeshStandardMaterial({ color: 0xc96520, roughness: 0.84 });
      const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.58, 0.5, 8, 14), matGold);
      torso.position.y = 0.68; torso.castShadow = true;
      headGroup.position.set(0, 1.5, 0.18);
      for (let m = 0; m < 12; m++) {
        const a = (m / 12) * Math.PI * 2;
        const puff = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 10), matMane);
        puff.position.set(Math.cos(a) * 0.64, Math.sin(a) * 0.64, -0.08);
        puff.castShadow = true;
        headGroup.add(puff);
      }
      const skull = new THREE.Mesh(new THREE.SphereGeometry(0.58, 16, 16), matGold);
      const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), matCream);
      muzzle.scale.set(1.2, 0.85, 0.9); muzzle.position.set(0, -0.15, 0.46);
      const nose = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), new THREE.MeshStandardMaterial({ color: 0x6e3a2c }));
      nose.position.set(0, -0.05, 0.68);
      const eL = makeEye(0.105); eL.position.set(-0.22, 0.14, 0.5);
      const eR = makeEye(0.105); eR.position.set(0.22, 0.14, 0.5);
      waveArm = new THREE.Group();
      waveArm.position.set(-0.56, 0.9, 0.25);
      const armMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.42, 6, 10), matGold);
      armMesh.position.y = 0.25;
      waveArm.add(armMesh);
      headGroup.add(skull, muzzle, nose, eL, eR);
      bodyGroup.add(torso, headGroup, waveArm);
    }

    if (kind === 'tiger') {
      const matT = new THREE.MeshStandardMaterial({ map: texTiger, roughness: 0.76 });
      const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.56, 0.5, 8, 14), matT);
      torso.position.y = 0.66; torso.castShadow = true;
      headGroup.position.set(0, 1.48, 0.18);
      const skull = new THREE.Mesh(new THREE.SphereGeometry(0.62, 16, 16), matT);
      skull.castShadow = true;
      [-0.36, 0.36].forEach(ex => {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10), matT);
        ear.position.set(ex * 1.15, 0.5, -0.05);
        headGroup.add(ear);
        const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), matCream);
        cheek.position.set(ex * 0.72, -0.18, 0.42);
        headGroup.add(cheek);
      });
      const nose = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 8), matPink);
      nose.position.set(0, -0.06, 0.62);
      const eL = makeEye(0.11); eL.position.set(-0.22, 0.14, 0.52);
      const eR = makeEye(0.11); eR.position.set(0.22, 0.14, 0.52);
      waveArm = new THREE.Group();
      waveArm.position.set(0.55, 0.88, 0.24);
      const armMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.42, 6, 10), matT);
      armMesh.position.y = 0.24;
      waveArm.add(armMesh);
      headGroup.add(skull, nose, eL, eR);
      bodyGroup.add(torso, headGroup, waveArm);
    }

    if (kind === 'zebra') {
      const matZ = new THREE.MeshStandardMaterial({ map: texZebra, roughness: 0.76 });
      const matMuzzle = new THREE.MeshStandardMaterial({ color: 0x565c66, roughness: 0.78 });
      const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.52, 0.55, 8, 14), matZ);
      torso.position.y = 0.66; torso.castShadow = true;
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.34, 0.78, 12), matZ);
      neck.position.set(0, 1.25, 0.1); neck.rotation.x = 0.12;
      headGroup.position.set(0, 1.72, 0.22);
      const skull = new THREE.Mesh(new THREE.SphereGeometry(0.48, 16, 16), matZ);
      skull.scale.set(0.92, 1.12, 1.02); skull.castShadow = true;
      const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 12), matMuzzle);
      muzzle.position.set(0, -0.22, 0.36);
      [-0.24, 0.24].forEach(ex => {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.38, 8), matZ);
        ear.position.set(ex, 0.56, -0.05);
        ear.rotation.z = ex > 0 ? -0.22 : 0.22;
        headGroup.add(ear);
      });
      const eL = makeEye(0.1); eL.position.set(-0.2, 0.1, 0.42);
      const eR = makeEye(0.1); eR.position.set(0.2, 0.1, 0.42);
      waveArm = new THREE.Group();
      waveArm.position.set(-0.52, 0.9, 0.2);
      const armMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.42, 6, 10), matZ);
      armMesh.position.y = 0.24;
      waveArm.add(armMesh);
      headGroup.add(skull, muzzle, eL, eR);
      bodyGroup.add(torso, neck, headGroup, waveArm);
    }

    if (kind === 'monkey') {
      const matM = new THREE.MeshStandardMaterial({ color: 0x94582e, roughness: 0.76 });
      const matFace = new THREE.MeshStandardMaterial({ color: 0xf4d2a4, roughness: 0.75 });
      const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 0.42, 8, 12), matM);
      torso.position.y = 0.58; torso.castShadow = true;
      headGroup.position.set(0, 1.32, 0.14);
      const skull = new THREE.Mesh(new THREE.SphereGeometry(0.54, 16, 16), matM);
      skull.castShadow = true;
      const mask = new THREE.Mesh(new THREE.SphereGeometry(0.44, 14, 14), matFace);
      mask.scale.set(1.06, 0.94, 0.75); mask.position.set(0, -0.05, 0.22);
      [-0.56, 0.56].forEach(ex => {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), matM);
        ear.scale.set(1, 1, 0.45);
        ear.position.set(ex, 0.04, 0);
        headGroup.add(ear);
      });
      const eL = makeEye(0.095); eL.position.set(-0.18, 0.1, 0.48);
      const eR = makeEye(0.095); eR.position.set(0.18, 0.1, 0.48);
      waveArm = new THREE.Group();
      waveArm.position.set(0.44, 0.8, 0.2);
      const armMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.42, 6, 10), matM);
      armMesh.position.y = 0.24;
      waveArm.add(armMesh);
      headGroup.add(skull, mask, eL, eR);
      bodyGroup.add(torso, headGroup, waveArm);
    }

    if (kind === 'snake') {
      const matS = new THREE.MeshStandardMaterial({ color: 0x7bc23a, roughness: 0.55 });
      const matBelly = new THREE.MeshStandardMaterial({ color: 0xf6f09c, roughness: 0.7 });
      const coilCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.5, 0.18, 0.2),
        new THREE.Vector3(0, 0.2, 0.65),
        new THREE.Vector3(-0.5, 0.24, 0.1),
        new THREE.Vector3(0, 0.36, -0.45),
        new THREE.Vector3(0.4, 0.58, 0.05),
        new THREE.Vector3(0, 1.05, 0.2),
      ]);
      const body = new THREE.Mesh(new THREE.TubeGeometry(coilCurve, 28, 0.21, 10, false), matS);
      body.castShadow = true;
      headGroup.position.set(0, 1.24, 0.24);
      const skull = new THREE.Mesh(new THREE.SphereGeometry(0.4, 14, 14), matS);
      skull.scale.set(1.12, 0.88, 1.05);
      const chin = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 12), matBelly);
      chin.position.set(0, -0.1, 0.08);
      const eL = makeEye(0.11); eL.position.set(-0.2, 0.14, 0.3);
      const eR = makeEye(0.11); eR.position.set(0.2, 0.14, 0.3);
      headGroup.add(skull, chin, eL, eR);

      const snakeFlag = createCheckeredFlagPole(1.3, 0.72);
      snakeFlag.position.set(0.48, 0.22, 0.22);
      snakeFlag.rotation.z = -0.22;
      bodyGroup.add(body, headGroup, snakeFlag);
    }

    // Give every waving animal a Black & White Checkered Racing Flag in their hand
    if (waveArm) {
      const handFlag = createCheckeredFlagPole(1.25, 0.72);
      const isLeftSide = waveArm.position.x < 0;
      handFlag.position.set(isLeftSide ? -0.04 : 0.04, 0.42, 0.08);
      handFlag.rotation.z = isLeftSide ? 0.32 : -0.32;
      waveArm.add(handFlag);
    }

    root.scale.setScalar(scale);

    const hitSphere = new THREE.Mesh(
      new THREE.SphereGeometry(kind === 'giraffe' ? 1.8 : 1.4, 8, 8),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitSphere.position.y = kind === 'giraffe' ? 1.8 : 1.1;
    root.add(hitSphere);

    const NOTES = { giraffe: 523, elephant: 262, lion: 330, tiger: 392, zebra: 440, monkey: 587, snake: 698 };
    const state = {
      root, bodyGroup, headGroup, waveArm, trunkGroup,
      kind, note: NOTES[kind] || 440,
      phase: Math.random() * Math.PI * 2,
      hop: 0,
    };
    animatedAnimals.push(state);
    interactiveObjects.push({
      mesh: hitSphere,
      onTap: (cx, cy) => {
        state.hop = 1.0;
        Sound.blip(state.note);
        burst(cx, cy, 10, ['heart', 'star']);
      },
    });
    return root;
  }

  function placeBesideRoad(kind, t, sideDist, scale, lookAtT = t + 0.04) {
    const pt = roadCurve.getPointAt(t);
    const tan = roadCurve.getTangentAt(t);
    const side = new THREE.Vector3(tan.z, 0, -tan.x).normalize();
    const pos = pt.clone().addScaledVector(side, sideDist);
    const animal = buildAnimal(kind, scale);
    placeAtGround(animal, pos.x, pos.z);
    const lookPt = roadCurve.getPointAt(Math.min(1, lookAtT));
    animal.lookAt(lookPt.x, animal.position.y, lookPt.z);
    scene.add(animal);
    return animal;
  }

  placeBesideRoad('giraffe', 0.24, 3.6, 1.25);
  placeBesideRoad('elephant', 0.42, -4.0, 1.32);
  placeBesideRoad('lion', 0.47, 3.8, 1.2);
  placeBesideRoad('monkey', 0.56, -3.5, 1.15);
  placeBesideRoad('zebra', 0.69, 3.8, 1.2);
  placeBesideRoad('tiger', 0.76, 3.7, 1.22);
  placeBesideRoad('snake', 0.82, -3.4, 1.1);

  /* =======================================================================
     INTERACTIVE 3D BALLOONS (Evening Sky & Party Clearing)
     ======================================================================= */
  const balloons = [];
  const balColors = [0x1a66d1, 0xffffff, 0x181b20, 0x4da8ff, 0xffc23d];
  function createBalloon(colorHex, x, y, z, scale = 1) {
    const bg = new THREE.Group();
    const matB = new THREE.MeshPhysicalMaterial({
      color: colorHex, roughness: 0.22, metalness: 0.06, clearcoat: 0.85, clearcoatRoughness: 0.14,
    });
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.42 * scale, 16, 16), matB);
    sphere.scale.set(0.92, 1.15, 0.92);
    sphere.castShadow = true;
    const knot = new THREE.Mesh(new THREE.ConeGeometry(0.08 * scale, 0.14 * scale, 8), matB);
    knot.position.y = -0.5 * scale;
    const str = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 1.4 * scale, 4),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    str.position.y = -1.2 * scale;
    bg.add(sphere, knot, str);
    bg.position.set(x, y, z);
    scene.add(bg);

    const state = { mesh: bg, basePos: new THREE.Vector3(x, y, z), phase: Math.random() * 6, popped: false, popTime: 0 };
    balloons.push(state);
    interactiveObjects.push({
      mesh: sphere,
      onTap: (cx, cy) => {
        if (state.popped) return;
        state.popped = true;
        state.popTime = 3.2;
        bg.visible = false;
        Sound.blip(660 + Math.random() * 220);
        burst(cx, cy, 12, ['star']);
      },
    });
    return bg;
  }

  [
    [-3.6, 3.6, -124, 1.1],
    [3.8, 4.1, -121, 1.0],
    [-4.5, 4.4, -114, 0.9],
    [4.4, 3.5, -111, 1.05],
    [-2.5, 4.8, -138, 0.95],
    [2.7, 4.6, -139, 1.0],
  ].forEach(([bx, by, bz, bs], idx) => createBalloon(balColors[idx % balColors.length], bx, by, bz, bs));

  for (let i = 0; i < 24; i++) {
    const t = 0.1 + (i / 24) * 0.85;
    const pt = roadCurve.getPointAt(t);
    const tan = roadCurve.getTangentAt(t);
    const side = new THREE.Vector3(tan.z, 0, -tan.x).normalize();
    const dir = i % 2 === 0 ? -1 : 1;
    const pos = pt.clone().addScaledVector(side, dir * (4.4 + (i % 3) * 1.8));
    createBalloon(balColors[i % balColors.length], pos.x, pt.y + 3.0 + (i % 4) * 0.8, pos.z, 0.9);
  }

  /* =======================================================================
     FINALE CLEARING: ARCH, STAGE FLASHLIGHTS, RACING CAKE & ANIMAL PARADE
     ======================================================================= */
  const archGroup = new THREE.Group();
  const archBase = roadCurve.getPointAt(0.895);
  archGroup.position.set(archBase.x, archBase.y, archBase.z);
  [-3.1, 3.1].forEach((px, idx) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 4.4, 10), matBark);
    post.position.set(px, 2.2, 0);
    post.castShadow = true;
    archGroup.add(post);

    const archFlag = createCheckeredFlagPole(1.4, 0.85);
    archFlag.position.set(px, 4.3, 0);
    archFlag.rotation.z = px > 0 ? -0.25 : 0.25;
    archGroup.add(archFlag);

    createBalloon(balColors[idx], archBase.x + px, archBase.y + 4.9, archBase.z, 0.95);
    createBalloon(balColors[idx + 2], archBase.x + px * 0.85, archBase.y + 5.2, archBase.z + 0.3, 0.85);
  });

  const buntingCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-3.1, 4.2, 0),
    new THREE.Vector3(0, 3.15, 0),
    new THREE.Vector3(3.1, 4.2, 0)
  );
  const rope = new THREE.Mesh(new THREE.TubeGeometry(buntingCurve, 18, 0.035, 6, false), matCream);
  archGroup.add(rope);
  for (let b = 1; b <= 9; b++) {
    const bt = b / 10;
    const bp = buntingCurve.getPoint(bt);
    const flag = new THREE.Mesh(
      new THREE.ConeGeometry(0.24, 0.55, 3),
      b % 2 === 0 ? matRoyalBlue : matChecker
    );
    flag.position.set(bp.x, bp.y - 0.25, bp.z);
    flag.rotation.z = Math.PI;
    archGroup.add(flag);
  }
  scene.add(archGroup);

  /* ---------- Blue, White & Black Racing Theme 3-Tier Birthday Cake ---------- */
  const finaleCenter = new THREE.Vector3(0, 0.12, 16);
  const cakeGroup = new THREE.Group();
  cakeGroup.position.set(finaleCenter.x, finaleCenter.y + 0.05, finaleCenter.z);

  const cakeStand = new THREE.Mesh(new THREE.CylinderGeometry(2.15, 2.3, 0.28, 28), matBlack);
  cakeStand.position.y = 0.14;
  cakeStand.receiveShadow = true;
  cakeStand.castShadow = true;
  const standTrim = new THREE.Mesh(new THREE.TorusGeometry(2.16, 0.06, 10, 32), matChrome);
  standTrim.rotation.x = Math.PI / 2;
  standTrim.position.y = 0.26;
  cakeGroup.add(cakeStand, standTrim);

  const tier1 = new THREE.Mesh(
    new THREE.CylinderGeometry(1.66, 1.7, 0.96, 28),
    new THREE.MeshStandardMaterial({ color: 0x195fc7, roughness: 0.38 })
  );
  tier1.position.y = 0.74;
  tier1.castShadow = true;
  tier1.receiveShadow = true;
  const tier1CheckBand = new THREE.Mesh(new THREE.CylinderGeometry(1.71, 1.72, 0.26, 28, 1, true), matChecker);
  tier1CheckBand.position.y = 0.42;
  const icing1 = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.1, 10, 28), matPureWhite);
  icing1.rotation.x = Math.PI / 2;
  icing1.position.y = 1.22;
  cakeGroup.add(tier1, tier1CheckBand, icing1);

  const tier2 = new THREE.Mesh(
    new THREE.CylinderGeometry(1.18, 1.21, 0.84, 28),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 })
  );
  tier2.position.y = 1.62;
  tier2.castShadow = true;
  tier2.receiveShadow = true;
  const tier2BlueBand = new THREE.Mesh(new THREE.CylinderGeometry(1.21, 1.21, 0.14, 28), matRoyalBlue);
  tier2BlueBand.position.y = 1.54;
  const tier2BlackBand = new THREE.Mesh(new THREE.CylinderGeometry(1.215, 1.215, 0.06, 28), matBlack);
  tier2BlackBand.position.y = 1.66;
  const icing2 = new THREE.Mesh(new THREE.TorusGeometry(1.13, 0.09, 10, 28), matRoyalBlue);
  icing2.rotation.x = Math.PI / 2;
  icing2.position.y = 2.04;
  cakeGroup.add(tier2, tier2BlueBand, tier2BlackBand, icing2);

  const tier3 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.76, 0.78, 0.68, 28),
    matChecker
  );
  tier3.position.y = 2.38;
  tier3.castShadow = true;
  tier3.receiveShadow = true;
  const icing3 = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.08, 10, 24), matPureWhite);
  icing3.rotation.x = Math.PI / 2;
  icing3.position.y = 2.72;
  cakeGroup.add(tier3, icing3);

  [
    [1.68, 0.85, 12],
    [1.2, 1.82, 10],
  ].forEach(([rad, py, cnt], tIdx) => {
    const pearlCols = [0xffffff, 0x195fc7, 0x181b20, 0x62b8ff];
    for (let s = 0; s < cnt; s++) {
      const sa = (s / cnt) * Math.PI * 2 + tIdx;
      const pearl = new THREE.Mesh(
        new THREE.SphereGeometry(0.065, 8, 8),
        new THREE.MeshStandardMaterial({ color: pearlCols[(s + tIdx) % pearlCols.length], roughness: 0.35 })
      );
      pearl.position.set(Math.cos(sa) * rad, py + (s % 2 ? 0.08 : -0.06), Math.sin(sa) * rad);
      cakeGroup.add(pearl);
    }
  });

  [-0.36, 0.36].forEach(fx => {
    const miniCakeFlag = createCheckeredFlagPole(0.85, 0.45);
    miniCakeFlag.position.set(fx, 2.7, -0.1);
    miniCakeFlag.rotation.z = fx > 0 ? -0.32 : 0.32;
    cakeGroup.add(miniCakeFlag);
  });

  const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.72, 14), matPureWhite);
  candle.position.y = 3.06;
  const candleRing1 = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.12, 14), matRoyalBlue);
  candleRing1.position.y = 2.95;
  const candleRing2 = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.12, 14), matBlack);
  candleRing2.position.y = 3.18;
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.36, 10), new THREE.MeshBasicMaterial({ color: 0xffc63b }));
  flame.position.y = 3.58;
  const flameGlow = new THREE.PointLight(0xffbe42, 3.0, 10);
  flameGlow.position.set(0, 3.68, 0.2);
  cakeGroup.add(candle, candleRing1, candleRing2, flame, flameGlow);

  const cakeHit = new THREE.Mesh(new THREE.CylinderGeometry(1.85, 1.85, 3.8, 12), new THREE.MeshBasicMaterial({ visible: false }));
  cakeHit.position.y = 1.9;
  cakeGroup.add(cakeHit);
  interactiveObjects.push({
    mesh: cakeHit,
    onTap: (cx, cy) => {
      toggleCakeWish();
      burst(cx, cy, 14, ['star', 'heart']);
    },
  });
  scene.add(cakeGroup);

  /* ---------- Finale Cheering Animals around the Cake (with Checkered Flags) ---------- */
  [
    ['lion', -3.3, 14.3, 1.1],
    ['tiger', -2.0, 13.4, 1.05],
    ['elephant', 2.2, 13.4, 1.15],
    ['zebra', 3.4, 14.5, 1.05],
    ['monkey', -3.6, 16.5, 1.0],
    ['giraffe', 3.6, 16.5, 1.12],
  ].forEach(([kind, px, pz, sc]) => {
    const a = buildAnimal(kind, sc);
    placeAtGround(a, px, pz);
    a.lookAt(0, a.position.y, 24);
    scene.add(a);
  });

  /* ---------- Stage Flashlights & Camera Flashes at Finale Cake Clearing ---------- */
  const stageSpots = [];
  const stageConeGeo = new THREE.ConeGeometry(3.6, 10.5, 18, 1, true);
  stageConeGeo.translate(0, -5.25, 0);

  [
    [-5.6, 9.2, 12.2, 0x70b8ff, -0.35],
    [5.6, 9.2, 12.2, 0xffe48a, 0.35],
    [0, 9.8, 10.5, 0xffffff, 0],
  ].forEach(([sx, sy, sz, col, phaseOffset], idx) => {
    const fixture = new THREE.Group();
    fixture.position.set(sx, sy, sz);

    const spot = new THREE.SpotLight(col, 42, 24, Math.PI / 4.8, 0.58, 1.3);
    spot.target.position.set(0, 1.2, 15.8);
    fixture.add(spot);
    scene.add(spot.target);

    const coneMat = new THREE.MeshBasicMaterial({
      color: col,
      transparent: true,
      opacity: 0.09,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const cone = new THREE.Mesh(stageConeGeo, coneMat);
    fixture.add(cone);
    scene.add(fixture);

    stageSpots.push({ fixture, spot, cone, phase: idx * 2.1 + phaseOffset });
  });

  const flashBulbs = [];
  [
    [-4.2, 2.8, 17.5],
    [4.2, 2.8, 17.5],
    [-2.8, 3.6, 12.6],
    [2.8, 3.6, 12.6],
    [0, 4.9, 13.0],
  ].forEach(([fx, fy, fz], idx) => {
    const flashLight = new THREE.PointLight(0xffffff, 0, 11, 1.5);
    flashLight.position.set(fx, fy, fz);
    const flashSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: texGlow,
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    flashSprite.position.set(fx, fy, fz);
    flashSprite.scale.setScalar(2.4);
    scene.add(flashLight, flashSprite);
    flashBulbs.push({ light: flashLight, sprite: flashSprite, timer: idx * 0.55, burst: 0 });
  });

  /* ---------- 3D Exhaust / Dust Puffs ---------- */
  const dustPool = [];
  const dustMat = new THREE.MeshBasicMaterial({ color: 0xeaf2ff, transparent: true, opacity: 0.55 });
  const dustGeo = new THREE.SphereGeometry(0.22, 8, 8);
  let dustCursor = 0;
  for (let i = 0; i < 24; i++) {
    const m = new THREE.Mesh(dustGeo, dustMat.clone());
    m.visible = false;
    scene.add(m);
    dustPool.push({ mesh: m, life: 0, vel: new THREE.Vector3() });
  }
  function spawnDust3D(pos) {
    if (reduceMotion) return;
    const d = dustPool[dustCursor];
    dustCursor = (dustCursor + 1) % dustPool.length;
    d.mesh.position.copy(pos).add(new THREE.Vector3((Math.random() - .5) * 0.9, 0.3, -1.55));
    d.mesh.scale.setScalar(0.55);
    d.mesh.material.opacity = 0.55;
    d.mesh.visible = true;
    d.life = 1.0;
    d.vel.set((Math.random() - .5) * 0.55, 0.75 + Math.random() * 0.5, -0.6);
  }

  /* =======================================================================
     TAP / RAYCAST INTERACTION WITH 3D ANIMALS, BALLOONS & CAKE
     ======================================================================= */
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let downX = 0, downY = 0;

  window.addEventListener('pointerdown', e => {
    downX = e.clientX;
    downY = e.clientY;
  }, { passive: true });

  window.addEventListener('pointerup', e => {
    if (coverMix > 0.4) return;
    if (Math.hypot(e.clientX - downX, e.clientY - downY) > 12) return;
    if (e.target.closest('button, a, .card')) return;

    ndc.x = (e.clientX / innerWidth) * 2 - 1;
    ndc.y = -(e.clientY / innerHeight) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(interactiveObjects.map(o => o.mesh), false);
    if (hits.length > 0) {
      const match = interactiveObjects.find(o => o.mesh === hits[0].object);
      if (match) match.onTap(e.clientX, e.clientY);
    }
  });

  /* =======================================================================
     SCROLL & ANIMATION LOOP
     ======================================================================= */
  const bar = $('#progressBar');
  const fgLeaves = $$('.fg-leaf');
  const frameEl = $('.frame');
  let scrollProgress = 0;
  let smoothProgress = 0;
  let lastProgress = 0;
  let dustAcc = 0;

  function updateScrollProgress() {
    const max = document.documentElement.scrollHeight - innerHeight;
    scrollProgress = max > 0 ? clamp(scrollY / max, 0, 1) : 0;
    bar.style.width = (scrollProgress * 100).toFixed(2) + '%';
  }
  addEventListener('scroll', updateScrollProgress, { passive: true });
  updateScrollProgress();

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  const tmpPos = new THREE.Vector3();
  const tmpNext = new THREE.Vector3();
  const tmpLook = new THREE.Vector3();
  const tmpCamJourney = new THREE.Vector3();
  const tmpLookJourney = new THREE.Vector3();
  const tmpCamCover = new THREE.Vector3();
  const tmpLookCover = new THREE.Vector3();
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.elapsedTime;

    tilt.x += (tilt.tx - tilt.x) * 0.08;
    tilt.y += (tilt.ty - tilt.y) * 0.08;
    coverMix += (targetCoverMix - coverMix) * 0.055;
    smoothProgress += (scrollProgress - smoothProgress) * 0.09;

    if (frameEl && coverMix > 0.02) {
      frameEl.style.setProperty('--ry', (tilt.x * 11).toFixed(1) + 'deg');
      frameEl.style.setProperty('--rx', (-tilt.y * 11).toFixed(1) + 'deg');
    }
    fgLeaves.forEach(lf => {
      const d = +lf.dataset.d || -16;
      lf.style.translate = `${(d * tilt.x).toFixed(1)}px ${(d * tilt.y * 0.5).toFixed(1)}px`;
    });

    const carT = clamp(0.08 + smoothProgress * 0.82, 0.02, 0.91);
    roadCurve.getPointAt(carT, tmpPos);
    roadCurve.getPointAt(Math.min(1, carT + 0.015), tmpNext);
    raceCar.position.copy(tmpPos);
    raceCar.lookAt(tmpNext.x, tmpNext.y, tmpNext.z);

    const dProgress = smoothProgress - lastProgress;
    lastProgress = smoothProgress;
    const tanNow = roadCurve.getTangentAt(carT);
    const tanNext = roadCurve.getTangentAt(Math.min(1, carT + 0.02));
    const steer = clamp((tanNext.x - tanNow.x) * 3.5, -0.44, 0.44);
    frontSteerPivots.forEach(p => { p.rotation.y = steer; });

    const wheelSpin = smoothProgress * 175 + elapsed * 1.6;
    carWheels.forEach(w => { w.rotation.x = wheelSpin; });
    if (!reduceMotion) {
      carChassis.position.y = Math.sin(elapsed * 8.5 + smoothProgress * 100) * 0.024;
      carChassis.rotation.z = Math.sin(elapsed * 4.5) * 0.015;
      bearDriver.position.y = 0.74 + Math.abs(Math.sin(elapsed * 4.6)) * 0.03;
      bearHeadGroup.rotation.z = Math.sin(elapsed * 3.1) * 0.07;
      bearHeadGroup.rotation.y = Math.sin(elapsed * 2.0) * 0.1;
      bearWaveArm.rotation.z = -0.35 + Math.sin(elapsed * 6.2) * 0.32;
    }

    dustAcc += Math.abs(dProgress);
    if (dustAcc > 0.0042 && coverMix < 0.3) {
      dustAcc = 0;
      spawnDust3D(tmpPos);
    }
    dustPool.forEach(d => {
      if (d.life <= 0) return;
      d.life -= dt * 1.5;
      if (d.life <= 0) { d.mesh.visible = false; return; }
      d.mesh.position.addScaledVector(d.vel, dt);
      d.mesh.scale.setScalar(lerp(1.6, 0.5, d.life));
      d.mesh.material.opacity = d.life * 0.48;
    });

    tmpCamCover.set(tmpPos.x + tilt.x * 0.55, tmpPos.y + 1.65 - tilt.y * 0.3, tmpPos.z + 4.1);
    tmpLookCover.set(tmpPos.x, tmpPos.y + 0.95, tmpPos.z - 0.3);

    const finaleBlend = smoothstep(0.79, 0.97, smoothProgress);
    const aspectAdjust = camera.aspect < 0.72 ? 1.25 : 0.0;
    const journeyCamX = tmpPos.x * 0.55 + tilt.x * 0.75;
    const journeyCamY = tmpPos.y + 3.4 + aspectAdjust * 0.45 - tilt.y * 0.35;
    const journeyCamZ = tmpPos.z + 7.1 + aspectAdjust * 1.4;

    const finaleCamX = tilt.x * 0.85;
    const finaleCamY = 3.25 + aspectAdjust * 0.35 - tilt.y * 0.25;
    const finaleCamZ = 24.4 + aspectAdjust * 1.6;

    tmpCamJourney.set(
      lerp(journeyCamX, finaleCamX, finaleBlend),
      lerp(journeyCamY, finaleCamY, finaleBlend),
      lerp(journeyCamZ, finaleCamZ, finaleBlend)
    );

    const journeyLookX = tmpPos.x * 0.75;
    const journeyLookY = tmpPos.y + 1.25;
    const journeyLookZ = tmpPos.z - 2.2;

    const finaleLookX = 0;
    const finaleLookY = 1.65;
    const finaleLookZ = 15.2;

    tmpLookJourney.set(
      lerp(journeyLookX, finaleLookX, finaleBlend),
      lerp(journeyLookY, finaleLookY, finaleBlend),
      lerp(journeyLookZ, finaleLookZ, finaleBlend)
    );

    camera.position.lerpVectors(tmpCamJourney, tmpCamCover, coverMix);
    tmpLook.lerpVectors(tmpLookJourney, tmpLookCover, coverMix);
    camera.lookAt(tmpLook);
    skyDome.position.copy(camera.position);
    skyGroup.position.copy(camera.position);

    moonLight.position.set(tmpLook.x - 16, 26, tmpLook.z + 14);
    moonLight.target.position.copy(tmpLook);
    moonLight.target.updateMatrixWorld();
    scene.fog.color.lerpColors(fogColorNight, fogColorParty, finaleBlend * 0.5);

    flame.visible = cakeLit;
    flameGlow.visible = cakeLit;
    if (cakeLit && !reduceMotion) {
      flame.scale.set(1 + Math.sin(elapsed * 14) * 0.08, 1 + Math.cos(elapsed * 11) * 0.14, 1);
      flame.rotation.z = Math.sin(elapsed * 9) * 0.08;
    }

    stageSpots.forEach(sp => {
      const tx = Math.sin(elapsed * 1.4 + sp.phase) * 2.2;
      const tz = 15.6 + Math.cos(elapsed * 1.1 + sp.phase) * 1.4;
      sp.spot.target.position.set(tx, 1.2, tz);
      sp.spot.target.updateMatrixWorld();
      sp.cone.lookAt(tx, 1.2, tz);
      sp.cone.rotateX(-Math.PI / 2);
      sp.spot.intensity = (28 + Math.sin(elapsed * 4.5 + sp.phase) * 12) * (0.25 + finaleBlend * 0.85);
      sp.cone.material.opacity = 0.02 + finaleBlend * 0.08;
    });

    flashBulbs.forEach(fb => {
      if (reduceMotion) return;
      fb.timer -= dt;
      if (fb.timer <= 0) {
        fb.timer = 0.9 + Math.random() * 1.6;
        fb.burst = finaleBlend > 0.35 ? 1.0 : 0.0;
      }
      fb.burst = Math.max(0, fb.burst - dt * 5.2);
      fb.light.intensity = fb.burst * 26;
      fb.sprite.material.opacity = fb.burst * 0.9;
    });

    if (!reduceMotion) {
      swayingFlora.forEach(item => {
        item.obj.rotation.z = Math.sin(elapsed * 1.3 + item.phase) * item.amp;
      });
      wavingFlags.forEach(wf => {
        const attr = wf.mesh.geometry.attributes.position;
        const base = wf.basePos;
        for (let vi = 0; vi < attr.count; vi++) {
          const bx = base[vi * 3];
          const by = base[vi * 3 + 1];
          const wave = Math.sin(elapsed * 5.2 + bx * 3.8 + by * 1.4 + wf.phase) * 0.14 * bx;
          attr.setZ(vi, wave);
        }
        attr.needsUpdate = true;
      });
      clouds.forEach(c => {
        c.obj.position.x += c.speed * dt;
        if (c.obj.position.x > 42) c.obj.position.x = -42;
      });
      fireflies.forEach(f => {
        f.mesh.position.x = f.base.x + Math.sin(elapsed * f.speed + f.phase) * 0.65;
        f.mesh.position.y = f.base.y + Math.cos(elapsed * (f.speed * 1.3) + f.phase) * 0.45;
        const pulse = 0.7 + Math.sin(elapsed * 4.2 + f.phase) * 0.3;
        f.halo.material.opacity = pulse;
      });
    }

    balloons.forEach(b => {
      if (b.popped) {
        b.popTime -= dt;
        if (b.popTime <= 0) { b.popped = false; b.mesh.visible = true; }
        return;
      }
      if (!reduceMotion) {
        b.mesh.position.y = b.basePos.y + Math.sin(elapsed * 1.8 + b.phase) * 0.28;
        b.mesh.rotation.z = Math.sin(elapsed * 1.4 + b.phase) * 0.08;
      }
    });

    animatedAnimals.forEach(a => {
      if (!reduceMotion) {
        a.headGroup.rotation.z = Math.sin(elapsed * 2.1 + a.phase) * 0.065;
        a.headGroup.rotation.y = Math.sin(elapsed * 1.2 + a.phase) * 0.09;
        if (a.waveArm) {
          a.waveArm.rotation.z = Math.sin(elapsed * 4.2 + a.phase) * 0.34 + 0.25;
        }
        if (a.trunkGroup) {
          a.trunkGroup.rotation.x = Math.sin(elapsed * 2.4 + a.phase) * 0.16;
        }
      }
      if (a.hop > 0) {
        a.hop = Math.max(0, a.hop - dt * 1.9);
        const arc = Math.sin(a.hop * Math.PI);
        a.bodyGroup.position.y = arc * 0.65;
        a.bodyGroup.scale.set(1 + arc * 0.08, 1 - arc * 0.06, 1 + arc * 0.08);
      } else {
        a.bodyGroup.position.y = 0;
        a.bodyGroup.scale.set(1, 1, 1);
      }
    });

    renderer.render(scene, camera);
  }
  animate();
}

/* ------------------------------------------------------------------
   Cover → Open Evening Jungle Racing World
   ------------------------------------------------------------------ */
const cover = $('#cover');
const startBtn = $('#startBtn');
scrollTo(0, 0);

startBtn.addEventListener('click', () => {
  enableTilt();
  Sound.init();
  Sound.set(true);
  soundBtn.hidden = false;
  soundBtn.setAttribute('aria-pressed', String(Sound.on));

  targetCoverMix = 0;
  cover.classList.add('open');
  document.body.classList.remove('locked');

  const r = startBtn.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2, 14, ['star', 'heart']);
  setTimeout(() => { cover.style.display = 'none'; }, 1250);
});