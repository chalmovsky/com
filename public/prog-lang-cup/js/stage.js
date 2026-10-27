/* The 3D arena (three.js r128): nebula sky, neon floor, light pillars, embers, two energy-core fighters,
   projectiles, shockwaves, K.O. shatter, trophy and fireworks, with optional bloom.
   Exposes one global: Stage. Every call is safe when WebGL is missing or graphics are off. */
var Stage = (function () {
'use strict';
var noop = function () {};
var stub = { ready: false, quality: noop, mode: noop, fighters: noop, attack: function () { return Promise.resolve(); }, ko: noop, victory: noop,
  revive: noop, burstAt: noop, celebrate: noop, shake: noop, pulse: noop, charge: noop, fireworks: noop };
if (!window.THREE) return stub;

var T = THREE, SET = function () { return Arena.SET; };
var canvas = document.getElementById('bg'), renderer;
try {
  renderer = new T.WebGLRenderer({ canvas: canvas, antialias: SET().gfx === 'high', powerPreference: 'high-performance' });
} catch (e) { document.documentElement.classList.add('no3d'); return stub; }
renderer.outputEncoding = T.sRGBEncoding;
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95;
renderer.setClearColor(0x07041a, 1);

var scene = new T.Scene();
scene.fog = new T.FogExp2(0x0a0524, 0.022);
var camera = new T.PerspectiveCamera(55, 1, 0.1, 400);
var FLOOR_Y = -1.7, HOME_Y = 1.15;

/* ---------- shared bits ---------- */
function dotTexture() {
  var c = document.createElement('canvas'); c.width = c.height = 64;
  var g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.22, 'rgba(255,255,255,.85)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return new T.CanvasTexture(c);
}
var DOT = dotTexture();
function col(hex) { return new T.Color(hex); }
function langColor(id) { var l = Cup.LMAP[id]; return col(l ? l.color : '#ffffff'); }
/* Fighters glow from inside, so very dark brand colours are lifted a little. */
function glowColor(id) { var c = langColor(id), hsl = {}; c.getHSL(hsl); return new T.Color().setHSL(hsl.h, Math.max(0.6, hsl.s), Math.max(0.45, Math.min(0.58, hsl.l))); }
var NOISE = [
  'float h3(vec3 p){p=fract(p*0.3183099+.1);p*=17.0;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}',
  'float n3(vec3 x){vec3 i=floor(x);vec3 f=fract(x);f=f*f*(3.0-2.0*f);',
  ' return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),',
  '            mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}',
  'float fbm(vec3 p){float v=0.0,a=0.5;for(int i=0;i<3;i++){v+=a*n3(p);p*=2.03;a*=0.5;}return v;}'
].join('\n');

/* ---------- sky ---------- */
var skyU = { uTime: { value: 0 }, uA: { value: col('#ff3ea5') }, uB: { value: col('#2ef2ff') }, uTint: { value: 0 } };
var sky = new T.Mesh(new T.SphereGeometry(150, 40, 24), new T.ShaderMaterial({
  side: T.BackSide, depthWrite: false, fog: false, uniforms: skyU,
  vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: [NOISE,
    'uniform float uTime; uniform vec3 uA; uniform vec3 uB; uniform float uTint; varying vec3 vD;',
    'void main(){',
    ' float y = vD.y;',
    ' vec3 top = vec3(0.02,0.01,0.07), hor = vec3(0.16,0.04,0.26), low = vec3(0.05,0.01,0.10);',
    ' vec3 c = mix(hor, top, smoothstep(0.0,0.75,y)); c = mix(low, c, smoothstep(-0.35,0.02,y));',
    ' float n = fbm(vD*2.6 + vec3(uTime*0.015, uTime*0.01, 0.0));',
    ' float neb = smoothstep(0.42,0.85,n) * smoothstep(-0.15,0.35,y);',
    ' vec3 nebA = mix(vec3(1.0,0.24,0.65), uA, uTint), nebB = mix(vec3(0.18,0.95,1.0), uB, uTint);',
    ' vec3 nc = mix(nebA, nebB, smoothstep(-0.4,0.4,vD.x + 0.25*sin(uTime*0.05)));',
    ' c += nc * neb * 0.42;',
    ' float s = h3(floor(vD*420.0)); float tw = 0.6+0.4*sin(uTime*2.0 + s*40.0);',
    ' c += vec3(step(0.9965, s)) * tw * smoothstep(0.0,0.3,y) * 0.9;',
    ' c += vec3(1.0,0.45,0.25) * pow(1.0-abs(y),18.0) * 0.14;',
    ' gl_FragColor = vec4(c,1.0);',
    '}'].join('\n')
}));
scene.add(sky);

/* ---------- floor ---------- */
var floorU = { uTime: { value: 0 }, uA: { value: col('#ff3ea5') }, uB: { value: col('#2ef2ff') }, uPulse: { value: 0 }, uSpeed: { value: 0.6 } };
var floorMat = new T.ShaderMaterial({
  uniforms: floorU, extensions: { derivatives: true },
  vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }',
  fragmentShader: [
    'uniform float uTime; uniform vec3 uA; uniform vec3 uB; uniform float uPulse; uniform float uSpeed; varying vec3 vW;',
    'float grid(vec2 p, float w){ vec2 g = abs(fract(p-0.5)-0.5)/fwidth(p); return 1.0 - min(min(g.x,g.y)/w, 1.0); }',
    'void main(){',
    ' vec2 p = vW.xz*0.55; p.y += uTime*uSpeed;',
    ' float d = length(vW.xz);',
    ' float fade = exp(-d*0.065);',
    ' vec3 side = mix(uA, uB, smoothstep(-7.0,7.0,vW.x));',
    ' float g = grid(p,1.1) + grid(p*0.2,1.4)*0.5;',
    ' vec3 c = vec3(0.012,0.006,0.04);',
    ' c += side * g * 0.8 * fade;',
    ' c += side * 0.16 * exp(-d*0.3);',
    ' float ring = exp(-pow((d - uPulse*16.0)*1.4, 2.0)) * (1.0-uPulse);',
    ' c += vec3(1.0,0.85,0.55) * ring * 1.0;',
    ' gl_FragColor = vec4(c,1.0);',
    '}'].join('\n')
});
var floor = new T.Mesh(new T.PlaneGeometry(260, 260, 1, 1), floorMat);
floor.rotation.x = -Math.PI / 2; floor.position.y = FLOOR_Y;
scene.add(floor);

/* ---------- light pillars ---------- */
var pillarGroup = new T.Group();
var pillarMat = function (c) {
  return new T.ShaderMaterial({ transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide,
    uniforms: { uC: { value: col(c) }, uTime: { value: 0 } },
    vertexShader: 'varying float vY; varying vec3 vN; varying vec3 vV; void main(){ vY = uv.y; vN = normalize(normalMatrix*normal); vV = normalize(-(modelViewMatrix*vec4(position,1.0)).xyz); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 uC; varying float vY; varying vec3 vN; varying vec3 vV; void main(){ float e = pow(abs(dot(vN,vV)),2.0); float a = (1.0-vY)*smoothstep(0.0,0.08,vY)*e; gl_FragColor = vec4(uC*a*0.75, a); }'
  });
};
var PC = ['#ff3ea5', '#8a5cff', '#2ef2ff', '#ffcb3d'];
for (var pi0 = 0; pi0 < 10; pi0++) {
  var ang = pi0 / 10 * Math.PI * 2, pm = new T.Mesh(new T.CylinderGeometry(0.35, 0.6, 46, 16, 1, true), pillarMat(PC[pi0 % 4]));
  pm.position.set(Math.cos(ang) * 26, FLOOR_Y + 23, Math.sin(ang) * 26 - 8);
  pillarGroup.add(pm);
}
scene.add(pillarGroup);

/* ---------- embers ---------- */
var EN = 700, epos = new Float32Array(EN * 3), espd = new Float32Array(EN);
for (var e0 = 0; e0 < EN; e0++) {
  epos[e0 * 3] = (Math.random() - 0.5) * 50; epos[e0 * 3 + 1] = FLOOR_Y + Math.random() * 22; epos[e0 * 3 + 2] = (Math.random() - 0.5) * 40 - 6;
  espd[e0] = 0.4 + Math.random() * 1.2;
}
var eg = new T.BufferGeometry(); eg.setAttribute('position', new T.BufferAttribute(epos, 3));
var emberMat = new T.PointsMaterial({ size: 0.22, map: DOT, color: 0xff9a5c, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0.85 });
var embers = new T.Points(eg, emberMat);
scene.add(embers);

scene.add(new T.AmbientLight(0x6a5aa0, 0.55));
var key = new T.PointLight(0xffffff, 0.7, 60); key.position.set(4, 8, 10); scene.add(key);

/* ---------- particle bursts ---------- */
var PN = 2600, ppos = new Float32Array(PN * 3), pcol = new Float32Array(PN * 3), pvel = new Float32Array(PN * 3), plife = new Float32Array(PN), pmax = new Float32Array(PN), pbase = new Float32Array(PN * 3), pgrav = new Float32Array(PN);
for (var p0 = 0; p0 < PN; p0++) ppos[p0 * 3 + 2] = 9999;
var pg = new T.BufferGeometry();
pg.setAttribute('position', new T.BufferAttribute(ppos, 3));
pg.setAttribute('color', new T.BufferAttribute(pcol, 3));
var parts = new T.Points(pg, new T.PointsMaterial({ size: 0.2, map: DOT, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
parts.frustumCulled = false;
scene.add(parts);
var pIdx = 0;
function burst(color, pos, count, speed, opts) {
  opts = opts || {};
  var c = color instanceof T.Color ? color : col(color), w = col('#ffffff');
  count = Math.round(count * (SET().gfx === 'low' ? 0.5 : 1));
  for (var n = 0; n < count; n++) {
    var k = pIdx; pIdx = (pIdx + 1) % PN;
    var u = opts.up ? Math.random() * 0.8 + 0.2 : Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, q = Math.sqrt(1 - u * u), v = speed * (0.35 + Math.random() * 0.9);
    ppos[k * 3] = pos.x + (opts.spread ? (Math.random() - 0.5) * opts.spread : 0);
    ppos[k * 3 + 1] = pos.y + (opts.spread ? (Math.random() - 0.5) * opts.spread : 0);
    ppos[k * 3 + 2] = pos.z;
    pvel[k * 3] = q * Math.cos(th) * v + (opts.vx || 0); pvel[k * 3 + 1] = u * v; pvel[k * 3 + 2] = q * Math.sin(th) * v * 0.6;
    var mix = Math.random() < 0.28 ? w : c;
    pbase[k * 3] = mix.r; pbase[k * 3 + 1] = mix.g; pbase[k * 3 + 2] = mix.b;
    plife[k] = pmax[k] = (opts.life || 0.8) + Math.random() * 0.8;
    pgrav[k] = opts.grav == null ? 1.6 : opts.grav;
  }
}

/* ---------- shockwave rings ---------- */
var waves = [];
function shockwave(pos, color, size) {
  var m = new T.Mesh(new T.RingGeometry(0.7, 0.8, 64), new T.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.8, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }));
  m.position.copy(pos); m.lookAt(camera.position);
  scene.add(m);
  waves.push({ m: m, t: 0, life: 0.55, size: size || 4 });
}

/* ---------- fighters ---------- */
var SHAPE = { python: 'knot23', javascript: 'ico', typescript: 'cube', rust: 'cog', go: 'orb', c: 'tetra', cpp: 'octa', java: 'dodeca', kotlin: 'diamond',
  swift: 'spike', csharp: 'hexa', ruby: 'gem', php: 'ring', haskell: 'knot35', elixir: 'drop', lua: 'orb', dart: 'spike', scala: 'prism', zig: 'tetra',
  julia: 'orb', r: 'ico', perl: 'knot35', clojure: 'ring', fsharp: 'hexa', ocaml: 'gem', erlang: 'dodeca', nim: 'crown', crystal: 'diamond', gleam: 'star',
  bash: 'cube', objc: 'octa', lisp: 'knot23' };
var GEO = {
  ico: function () { return new T.IcosahedronGeometry(1, 0); },
  orb: function () { return new T.IcosahedronGeometry(0.95, 1); },
  octa: function () { return new T.OctahedronGeometry(1.15, 0); },
  diamond: function () { var g = new T.OctahedronGeometry(1, 0); g.scale(0.8, 1.45, 0.8); return g; },
  gem: function () { var g = new T.OctahedronGeometry(1, 0); g.scale(1.25, 0.95, 1.25); return g; },
  star: function () { var g = new T.OctahedronGeometry(1.1, 0); g.scale(1.25, 1.25, 0.55); return g; },
  dodeca: function () { return new T.DodecahedronGeometry(1, 0); },
  tetra: function () { return new T.TetrahedronGeometry(1.3, 0); },
  cube: function () { return new T.BoxGeometry(1.35, 1.35, 1.35); },
  knot23: function () { return new T.TorusKnotGeometry(0.7, 0.24, 140, 16, 2, 3); },
  knot35: function () { return new T.TorusKnotGeometry(0.68, 0.18, 180, 14, 3, 5); },
  ring: function () { return new T.TorusGeometry(0.85, 0.34, 18, 48); },
  cog: function () { var g = new T.CylinderGeometry(1, 1, 0.55, 12); g.rotateX(Math.PI / 2); return g; },
  hexa: function () { return new T.CylinderGeometry(0.95, 0.95, 1.35, 6); },
  prism: function () { return new T.CylinderGeometry(1.05, 1.05, 1.5, 3); },
  crown: function () { return new T.CylinderGeometry(1, 0.6, 1.2, 5); },
  spike: function () { var g = new T.ConeGeometry(0.9, 1.9, 5); return g; },
  drop: function () { var g = new T.IcosahedronGeometry(0.9, 2); g.scale(0.85, 1.25, 0.85); return g; }
};
var coreVS = [
  'uniform float uTime; uniform float uWob; varying vec3 vN; varying vec3 vV; varying vec3 vP;',
  'void main(){ vP = position; vec3 p = position + normal * sin(uTime*4.0 + position.y*5.0 + position.x*3.0) * 0.045 * uWob;',
  ' vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(p,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }'].join('\n');
var coreFS = [
  'uniform vec3 uC; uniform float uTime; uniform float uHit; uniform float uPow; varying vec3 vN; varying vec3 vV; varying vec3 vP;',
  'void main(){',
  ' float fr = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);',
  ' float bands = 0.5 + 0.5*sin(vP.y*7.0 - uTime*3.0 + sin(vP.x*4.0 + uTime*1.3)*1.5);',
  ' vec3 c = uC * (0.2 + 0.4*bands) * (1.0 + uPow*0.45);',
  ' c += (uC*0.7 + vec3(0.18)) * fr * (1.0 + uPow*0.9);',
  ' c += uC * uPow * 0.25 * (0.5 + 0.5*sin(uTime*18.0));',
  ' c = mix(c, vec3(1.6), uHit);',
  ' gl_FragColor = vec4(c, 1.0);',
  '}'].join('\n');
function Fighter(side) {
  var g = new T.Group();
  var u = { uC: { value: col('#ffffff') }, uTime: { value: 0 }, uHit: { value: 0 }, uPow: { value: 0 }, uWob: { value: 1 } };
  var core = new T.Mesh(GEO.ico(), new T.ShaderMaterial({ uniforms: u, vertexShader: coreVS, fragmentShader: coreFS }));
  var shellMat = new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, blending: T.AdditiveBlending, depthWrite: false });
  var shell = new T.LineSegments(new T.EdgesGeometry(core.geometry), shellMat);
  shell.scale.setScalar(1.22);
  var halo = new T.Sprite(new T.SpriteMaterial({ map: DOT, color: 0xffffff, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0.25 }));
  halo.scale.setScalar(3.0);
  var rings = new T.Group(), ringMat = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45, blending: T.AdditiveBlending, depthWrite: false });
  for (var i = 0; i < 3; i++) {
    var r = new T.Mesh(new T.TorusGeometry(1.3 + i * 0.18, 0.016, 6, 96), ringMat);
    r.rotation.set(Math.random() * 3, Math.random() * 3, 0); r.userData.spin = (i % 2 ? -1 : 1) * (0.6 + i * 0.35);
    rings.add(r);
  }
  var light = new T.PointLight(0xffffff, 0.9, 8);
  var glowDisc = new T.Mesh(new T.CircleGeometry(1.3, 40), new T.MeshBasicMaterial({ map: DOT, color: 0xffffff, transparent: true, blending: T.AdditiveBlending, depthWrite: false, opacity: 0.3 }));
  glowDisc.rotation.x = -Math.PI / 2;
  var body = new T.Group(); body.add(halo); body.add(core); body.add(shell); body.add(rings); body.add(light);
  g.add(body);
  scene.add(g); scene.add(glowDisc);
  g.scale.setScalar(0.0001);
  return { g: g, body: body, core: core, shell: shell, halo: halo, rings: rings, ringMat: ringMat, light: light, glowDisc: glowDisc, u: u, shellMat: shellMat,
    side: side, home: new T.Vector3(), knock: 0, alive: true, shown: false, lang: null, color: col('#fff'), base: 1, lift: 0, spinBoost: 0 };
}
var F = [Fighter(0), Fighter(1)];
function setFighter(f, id) {
  if (f.lang === id) return;
  f.lang = id;
  var geo = (GEO[SHAPE[id]] || GEO.ico)();
  f.core.geometry.dispose(); f.core.geometry = geo;
  f.shell.geometry.dispose(); f.shell.geometry = new T.EdgesGeometry(geo, 12);
  var c = glowColor(id); f.color = c;
  f.u.uC.value.copy(c); f.shellMat.color.copy(c).lerp(col('#ffffff'), 0.35); f.halo.material.color.copy(c);
  f.ringMat.color.copy(c).lerp(col('#ffffff'), 0.2); f.light.color.copy(c); f.glowDisc.material.color.copy(c);
  var n = (Snd.hash(id) % 3) + 1;
  f.rings.children.forEach(function (r, i) { r.visible = i < n; });
}

/* ---------- K.O. shards ---------- */
var shards = [];
var shardGeo = new T.TetrahedronGeometry(0.22, 0);
function shatter(f) {
  var mat = new T.MeshBasicMaterial({ color: f.color.clone().lerp(col('#ffffff'), 0.2), transparent: true, opacity: 1, blending: T.AdditiveBlending, depthWrite: false });
  var n = SET().gfx === 'low' ? 26 : 54, at = f.g.position;
  for (var i = 0; i < n; i++) {
    var m = new T.Mesh(shardGeo, mat);
    m.position.set(at.x + (Math.random() - 0.5) * 1.2, at.y + (Math.random() - 0.5) * 1.2, at.z + (Math.random() - 0.5) * 0.6);
    m.scale.setScalar(0.5 + Math.random() * 1.4);
    scene.add(m);
    var dir = f.side ? 1 : -1;
    shards.push({ m: m, v: new T.Vector3(dir * (2 + Math.random() * 6), 2 + Math.random() * 6, (Math.random() - 0.5) * 6), r: new T.Vector3(Math.random() * 8, Math.random() * 8, Math.random() * 8), life: 1.8 + Math.random() * 0.6, max: 2.4, mat: mat });
  }
}

/* ---------- trophy ---------- */
var trophy = new T.Group();
(function () {
  var gold = new T.MeshPhongMaterial({ color: 0xb07a14, specular: 0xb89a5a, shininess: 60, emissive: 0x120800 });
  var dark = new T.MeshPhongMaterial({ color: 0x1b1233, specular: 0x8877cc, shininess: 60 });
  var prof = [[0, 0], [0.75, 0], [0.75, 0.1], [0.3, 0.2], [0.18, 0.5], [0.18, 0.95], [0.45, 1.08], [0.85, 1.45], [1.1, 2.0], [1.22, 2.6], [1.16, 2.62], [1.02, 2.08], [0.78, 1.58], [0.35, 1.28], [0, 1.24]]
    .map(function (p) { return new T.Vector2(p[0], p[1]); });
  trophy.add(new T.Mesh(new T.LatheGeometry(prof, 56), gold));
  [-1, 1].forEach(function (s) {
    var h = new T.Mesh(new T.TorusGeometry(0.42, 0.07, 12, 32, Math.PI), gold);
    h.position.set(s * 1.12, 2.0, 0); h.rotation.z = s > 0 ? -Math.PI / 2 : Math.PI / 2;
    trophy.add(h);
  });
  var base = new T.Mesh(new T.CylinderGeometry(0.95, 1.1, 0.42, 6), dark);
  base.position.y = -0.21; trophy.add(base);
  var star = new T.Mesh(new T.OctahedronGeometry(0.22, 0), gold);
  star.position.y = 2.95; trophy.add(star);
  trophy.userData.star = star;
})();
trophy.visible = false; trophy.position.set(0, 0.3, 0);
scene.add(trophy);
var tLights = [0xff3ea5, 0x2ef2ff, 0xffffff].map(function (c) { var l = new T.PointLight(c, 0, 16); scene.add(l); return l; });

/* ---------- projectile ---------- */
var shot = new T.Group();
var shotCore = new T.Mesh(new T.SphereGeometry(0.28, 20, 14), new T.MeshBasicMaterial({ color: 0xffffff }));
var shotGlow = new T.Sprite(new T.SpriteMaterial({ map: DOT, color: 0xffffff, transparent: true, blending: T.AdditiveBlending, depthWrite: false }));
shotGlow.scale.setScalar(2.4);
var shotLight = new T.PointLight(0xffffff, 0, 8);
shot.add(shotCore); shot.add(shotGlow); shot.add(shotLight); shot.visible = false;
scene.add(shot);

/* ---------- post-processing ---------- */
var composer = null, bloom = null;
function buildComposer() {
  composer = null; bloom = null;
  if (SET().gfx === 'low' || !T.EffectComposer || !T.UnrealBloomPass) return;
  try {
    composer = new T.EffectComposer(renderer);
    composer.addPass(new T.RenderPass(scene, camera));
    bloom = new T.UnrealBloomPass(new T.Vector2(W, H), 0.8, 0.45, 0.34);
    composer.addPass(bloom);
    composer.setSize(W, H);
  } catch (e) { composer = null; }
}

/* ---------- camera ---------- */
var W = 1, H = 1, time = 0, bgTime = 0, last = performance.now(), shakeAmt = 0, freezeUntil = 0, mode = 'title', running = false;
var cam = { px: 0, py: 3, pz: 17, lx: 0, ly: 0.8, lz: 0, orbit: 0.08 };
var camGoal = null;
function size() {
  W = window.innerWidth; H = window.innerHeight;
  var pr = Math.min(window.devicePixelRatio || 1, SET().gfx === 'high' ? 2 : SET().gfx === 'medium' ? 1.25 : 1);
  renderer.setPixelRatio(pr);
  renderer.setSize(W, H, false);
  camera.aspect = W / H; camera.updateProjectionMatrix();
  if (composer) { composer.setPixelRatio && composer.setPixelRatio(pr); composer.setSize(W, H); }
  if (bloom) bloom.resolution.set(W * (SET().gfx === 'high' ? 1 : 0.5), H * (SET().gfx === 'high' ? 1 : 0.5));
  layout();
}
/* Fighter spacing and size follow the screen: further apart on wide screens, smaller on phones. */
function layout() {
  var dist = mode === 'fight' ? 8.6 : 11.5;
  var halfW = Math.tan(camera.fov * Math.PI / 360) * dist * camera.aspect;
  var x = Math.max(1.5, Math.min(3.4, halfW * 0.56));
  var s = Math.max(0.55, Math.min(1.05, halfW / 4.2));
  F[0].home.set(-x, HOME_Y, 0); F[1].home.set(x, HOME_Y, 0);
  F[0].base = F[1].base = s;
  if (mode === 'match') matchCam();
}
/* Aims the camera so the fighters sit at the middle of the given screen band (the arena window above the code cards). */
var bandY = 0.3;
function matchCam() {
  var cy = 2.0, cz = 11.5, fy = HOME_Y, half = Math.tan(camera.fov * Math.PI / 360);
  var ndc = 1 - 2 * bandY;
  var phi = Math.atan2(fy - cy, cz), theta = Math.atan(ndc * half) - phi;
  goCam({ px: 0, py: cy, pz: cz, lx: 0, ly: cy - cz * Math.tan(theta), lz: 0, orbit: 0 }, 0.9);
}
function goCam(target, d) {
  if (window.gsap && Arena.on()) { gsap.killTweensOf(cam); gsap.to(cam, Object.assign({ duration: d == null ? 1.1 : d, ease: 'power3.inOut' }, target)); }
  else Object.assign(cam, target);
}

function at(el, z) {
  if (!el) return new T.Vector3(0, HOME_Y, 0);
  var b = el.getBoundingClientRect(), x = ((b.left + b.width / 2) / W) * 2 - 1, y = -((b.top + Math.min(b.height / 2, 160)) / H) * 2 + 1;
  var v = new T.Vector3(x, y, 0.5).unproject(camera).sub(camera.position).normalize();
  var tz = z == null ? 2 : z;
  return camera.position.clone().add(v.multiplyScalar((tz - camera.position.z) / v.z));
}

/* ---------- frame loop ---------- */
var fireT = 0, orbitA = 0;
function frame(now) {
  if (!running) return;
  requestAnimationFrame(frame);
  if (document.hidden) { last = now; return; }
  var raw = Math.min(0.05, (now - last) / 1000); last = now;
  if (now < freezeUntil) raw = 0;
  var on = Arena.on(), calm = SET().anim !== 'full', bgm = SET().bgMotion !== false;
  var dt = raw * (on ? SET().speed : 1);
  time += dt;
  /* the background keeps its own clock so it can stand still while the fighters move */
  if (bgm) bgTime += dt;
  skyU.uTime.value = bgTime; floorU.uTime.value = bgTime;
  floorU.uSpeed.value = mode === 'match' || mode === 'fight' ? 1.4 : 0.5;
  floorU.uPulse.value = Math.min(1, floorU.uPulse.value + dt * 0.9);
  if (bgm) pillarGroup.rotation.y += dt * 0.03;
  pillarGroup.children.forEach(function (p, i) { p.scale.x = p.scale.z = 1 + 0.25 * Math.sin(bgTime * 1.5 + i); });

  var en = SET().gfx === 'low' ? EN / 2 : EN;
  eg.setDrawRange(0, en);
  for (var i = 0; i < en; i++) {
    if (!bgm) break;
    epos[i * 3 + 1] += espd[i] * dt * (calm ? 0.5 : 1);
    epos[i * 3] += Math.sin(time + i) * dt * 0.15;
    if (epos[i * 3 + 1] > FLOOR_Y + 24) epos[i * 3 + 1] = FLOOR_Y;
  }
  eg.attributes.position.needsUpdate = true;

  var show = mode === 'versus' || mode === 'match' || mode === 'fight' || mode === 'result';
  F.forEach(function (f, idx) {
    var target = show && f.alive ? f.base : 0.0001;
    var s = f.g.scale.x + (target - f.g.scale.x) * Math.min(1, raw * 7);
    f.g.scale.setScalar(s);
    if (!f.flying) {
      var hx = f.home.x + f.knock * (idx ? 1 : -1), hy = f.home.y + f.lift + Math.sin(time * 1.6 + idx * 2) * 0.12;
      f.g.position.x += (hx - f.g.position.x) * Math.min(1, raw * 5);
      f.g.position.y += (hy - f.g.position.y) * Math.min(1, raw * 5);
      f.g.position.z += (f.home.z - f.g.position.z) * Math.min(1, raw * 5);
    }
    f.knock *= Math.pow(0.05, raw);
    f.u.uTime.value = time;
    f.u.uHit.value = Math.max(0, f.u.uHit.value - raw * 3);
    f.u.uPow.value = Math.max(0, f.u.uPow.value - raw * 1.2);
    var spin = (calm ? 0.4 : 1) * (1 + f.spinBoost);
    f.core.rotation.x += dt * 0.5 * spin; f.core.rotation.y += dt * (idx ? -0.9 : 0.9) * spin;
    f.shell.rotation.copy(f.core.rotation);
    f.rings.children.forEach(function (r) { r.rotation.z += dt * r.userData.spin * spin; r.rotation.x += dt * 0.2 * r.userData.spin; });
    f.spinBoost = Math.max(0, f.spinBoost - raw * 0.6);
    f.light.intensity = (0.8 + f.u.uPow.value * 3) * (s > 0.01 ? 1 : 0);
    f.halo.material.opacity = 0.22 + f.u.uPow.value * 0.3;
    f.glowDisc.position.set(f.g.position.x, FLOOR_Y + 0.02, f.g.position.z);
    f.glowDisc.scale.setScalar(Math.max(0.0001, s) * (1 + 0.1 * Math.sin(time * 3 + idx)));
    f.glowDisc.material.opacity = 0.3 * Math.min(1, s / Math.max(0.01, f.base));
  });

  if (trophy.visible) {
    trophy.rotation.y += dt * 0.7;
    trophy.userData.star.rotation.y += dt * 2;
    tLights.forEach(function (l, k) {
      var a = time * 0.9 + k * 2.1;
      l.position.set(Math.cos(a) * 4, trophy.position.y + 1.6 + Math.sin(a * 1.3), Math.sin(a) * 4 + 2);
      l.intensity = 0.55;
    });
    fireT -= dt;
    if (fireT <= 0 && on) {
      fireT = 0.35 + Math.random() * 0.45;
      var lang = Cup.LANGS[Math.floor(Math.random() * Cup.LANGS.length)];
      var fp = new T.Vector3((Math.random() - 0.5) * 16, 3 + Math.random() * 7, -4 - Math.random() * 6);
      burst(lang.color, fp, 90, 6, { grav: 1.2, life: 1 });
      if (Math.random() < 0.4) shockwave(fp, langColor(lang.id), 3);
      if (Math.random() < 0.3) Snd.play('firework');
    }
  } else tLights.forEach(function (l) { l.intensity = 0; });

  for (var k = 0; k < PN; k++) {
    if (plife[k] <= 0) continue;
    plife[k] -= dt;
    var fr = Math.max(0, plife[k] / pmax[k]);
    if (plife[k] <= 0) { ppos[k * 3 + 2] = 9999; fr = 0; }
    pvel[k * 3] *= 0.965; pvel[k * 3 + 1] = pvel[k * 3 + 1] * 0.965 - dt * pgrav[k]; pvel[k * 3 + 2] *= 0.965;
    ppos[k * 3] += pvel[k * 3] * dt; ppos[k * 3 + 1] += pvel[k * 3 + 1] * dt; ppos[k * 3 + 2] += pvel[k * 3 + 2] * dt;
    pcol[k * 3] = pbase[k * 3] * fr; pcol[k * 3 + 1] = pbase[k * 3 + 1] * fr; pcol[k * 3 + 2] = pbase[k * 3 + 2] * fr;
  }
  pg.attributes.position.needsUpdate = true; pg.attributes.color.needsUpdate = true;

  for (var w = waves.length - 1; w >= 0; w--) {
    var wv = waves[w]; wv.t += dt;
    var q = wv.t / wv.life;
    if (q >= 1) { scene.remove(wv.m); wv.m.geometry.dispose(); wv.m.material.dispose(); waves.splice(w, 1); continue; }
    wv.m.scale.setScalar(0.2 + q * wv.size); wv.m.material.opacity = 0.8 * (1 - q) * (1 - q);
  }
  for (var sI = shards.length - 1; sI >= 0; sI--) {
    var sh = shards[sI]; sh.life -= dt;
    if (sh.life <= 0) { scene.remove(sh.m); shards.splice(sI, 1); continue; }
    sh.v.y -= dt * 7; sh.v.multiplyScalar(0.985);
    sh.m.position.addScaledVector(sh.v, dt);
    if (sh.m.position.y < FLOOR_Y + 0.1) { sh.m.position.y = FLOOR_Y + 0.1; sh.v.y *= -0.35; sh.v.x *= 0.7; }
    sh.m.rotation.x += sh.r.x * dt; sh.m.rotation.y += sh.r.y * dt;
    sh.mat.opacity = Math.min(1, sh.life / 0.8);
  }

  shakeAmt *= Math.pow(0.015, raw);
  var sk = SET().shake ? shakeAmt : 0;
  if (cam.orbit && bgm) orbitA += dt * cam.orbit;
  var ox = cam.orbit ? Math.sin(orbitA) * cam.pz * 0.35 : 0, oz = cam.orbit ? Math.cos(orbitA) * 0.12 * cam.pz : 0;
  var sway = calm || !bgm ? 0 : 1;
  camera.position.set(cam.px + ox + Math.sin(time * 0.21) * 0.35 * sway + (Math.random() - 0.5) * sk, cam.py + Math.sin(time * 0.17) * 0.18 * sway + (Math.random() - 0.5) * sk, cam.pz + (cam.orbit ? oz - 0.12 * cam.pz : 0));
  camera.lookAt(cam.lx, cam.ly, cam.lz);
  if (composer) composer.render(); else renderer.render(scene, camera);
}
function start() { if (running) return; running = true; last = performance.now(); requestAnimationFrame(frame); }
function stop() { running = false; }

window.addEventListener('resize', size);
size(); buildComposer(); size();
if (SET().gfx !== 'off') start();

/* ---------- public API ---------- */
function setMode(m, opts) {
  opts = opts || {};
  mode = m;
  trophy.visible = m === 'champ';
  if (opts.bandY != null) bandY = opts.bandY;
  var tint = m === 'title' || m === 'hub' || m === 'select' || m === 'champ' ? 0 : 1;
  if (window.gsap && Arena.on()) gsap.to(skyU.uTint, { value: tint, duration: 1.2 }); else skyU.uTint.value = tint;
  if (tint === 0) { floorU.uA.value.set('#ff3ea5'); floorU.uB.value.set('#2ef2ff'); }
  layout();
  if (m === 'title') goCam({ px: 0, py: 2.6, pz: 17, lx: 0, ly: 1.4, lz: 0, orbit: 0.06 }, 1.6);
  else if (m === 'hub' || m === 'select') goCam({ px: 0, py: 5, pz: 20, lx: 0, ly: 0.5, lz: -4, orbit: 0.04 }, 1.4);
  else if (m === 'versus') goCam({ px: 0, py: 1.6, pz: 9.5, lx: 0, ly: 1.2, lz: 0, orbit: 0 }, 1.2);
  else if (m === 'match') matchCam();
  else if (m === 'fight') goCam({ px: 0, py: 1.7, pz: 8.6, lx: 0, ly: 1.15, lz: 0, orbit: 0 }, 0.55);
  else if (m === 'result') { var wx = opts.winner != null ? F[opts.winner].home.x : 0; goCam({ px: wx * 0.55, py: 1.8, pz: 6.8, lx: wx, ly: 1.2, lz: 0, orbit: 0 }, 1.1); }
  else if (m === 'champ') goCam({ px: 0, py: 2.6, pz: 11, lx: 0, ly: camera.aspect < 1 ? -1.5 : -0.4, lz: 0, orbit: 0.12 }, 1.6);
  if (m === 'match' || m === 'versus') F.forEach(function (f) { if (!f.alive) revive(); });
}
function fighters(a, b) {
  setFighter(F[0], a); setFighter(F[1], b);
  floorU.uA.value.copy(glowColor(a)); floorU.uB.value.copy(glowColor(b));
  skyU.uA.value.copy(glowColor(a)); skyU.uB.value.copy(glowColor(b));
}
function revive() {
  F.forEach(function (f) { f.alive = true; f.lift = 0; f.knock = 0; f.flying = false; f.g.visible = true; });
}
function shake(a) { shakeAmt = Math.max(shakeAmt, a); }
function hitStop(ms) { if (Arena.on()) freezeUntil = performance.now() + ms / SET().speed; }

/* Winner (side) charges, lunges and fires its special at the other fighter. Resolves after impact. */
function attack(side, opts) {
  opts = opts || {};
  var A = F[side], B = F[1 - side], dir = side ? -1 : 1;
  if (!running || !Arena.on()) {
    B.u.uHit.value = 1; burst(A.color, B.g.position.clone(), 120, 7); B.knock = 0.8;
    return Promise.resolve();
  }
  return new Promise(function (resolve) {
    var tl = gsap.timeline({ onComplete: resolve });
    var cine = Arena.cine();
    if (cine) {
      tl.call(function () { Snd.play('charge'); A.spinBoost = 3; burst(A.color, A.g.position.clone(), 70, 2.5, { up: true, grav: -0.6, life: 0.5, spread: 1.6 }); })
        .to(A.u.uPow, { value: 1.0, duration: 0.45, ease: 'power2.in' }, 0)
        .to(A.g.position, { x: A.home.x + dir * 0.9, duration: 0.18, ease: 'power3.in', onStart: function () { A.flying = true; } }, 0.42);
    }
    var t0 = cine ? 0.6 : 0;
    tl.call(function () {
      Snd.play('zap');
      shot.visible = true; shot.position.copy(A.g.position);
      shotCore.material.color.copy(A.color).lerp(col('#ffffff'), 0.5); shotGlow.material.color.copy(A.color); shotLight.color.copy(A.color); shotLight.intensity = 4;
    }, null, t0);
    var p = { k: 0 }, from = A.g.position.clone(), to = B.home.clone();
    tl.to(p, { k: 1, duration: cine ? 0.38 : 0.22, ease: 'power1.in', onUpdate: function () {
      shot.position.lerpVectors(from, to, p.k); shot.position.y += Math.sin(p.k * Math.PI) * 1.1;
      if (Math.random() < 0.9) burst(A.color, shot.position.clone(), 6, 0.8, { grav: 0, life: 0.35 });
    } }, t0);
    tl.call(function () {
      shot.visible = false; shotLight.intensity = 0;
      var crit = !!opts.crit;
      Snd.play(crit ? 'crit' : 'hit');
      B.u.uHit.value = 1; B.knock = crit ? 1.6 : 1.0; B.spinBoost = 4;
      burst(A.color, B.g.position.clone(), crit ? 220 : 140, crit ? 10 : 7);
      burst(B.color, B.g.position.clone(), crit ? 110 : 60, 5);
      shockwave(B.g.position.clone(), A.color.clone().lerp(col('#ffffff'), 0.3), crit ? 7 : 4.5);
      floorU.uPulse.value = 0;
      shake(crit ? 1.3 : 0.7); hitStop(crit ? 140 : 80);
      A.flying = false;
    }, null, t0 + (cine ? 0.38 : 0.22));
    tl.to({}, { duration: cine ? 0.45 : 0.2 });
  });
}
function ko(side) {
  var f = F[side];
  if (!running) { f.alive = false; return; }
  Snd.play('ko');
  shatter(f);
  burst(f.color, f.g.position.clone(), 260, 11);
  shockwave(f.g.position.clone(), f.color.clone().lerp(col('#ffffff'), 0.4), 8);
  floorU.uPulse.value = 0;
  f.alive = false; f.g.scale.setScalar(0.0001);
  shake(1.6); hitStop(220);
}
function victory(side) {
  var f = F[side];
  f.lift = 0.7; f.spinBoost = 5; f.u.uPow.value = 0.9;
  if (!running) return;
  var p = f.g.position.clone();
  burst(f.color, p, 160, 5, { up: true, grav: -0.4, life: 1.2, spread: 2 });
  shockwave(new T.Vector3(p.x, FLOOR_Y + 0.05, p.z), f.color, 6);
}
function burstAt(el, color, n) { if (running) burst(color, at(el), n || 140, 7); }
function celebrate(color) {
  if (!running) return;
  for (var n = 0; n < 6; n++) {
    (function (n) { setTimeout(function () { burst(color, new T.Vector3((Math.random() - 0.5) * 12, 2 + Math.random() * 6, -3), 120, 7, { grav: 1.2 }); }, Arena.dur(n * 240)); })(n);
  }
}
function pulse(side) { F[side].u.uPow.value = 1; F[side].spinBoost = 2; }
function quality(q) {
  if (q === 'off') { stop(); document.documentElement.classList.add('no3d'); return; }
  document.documentElement.classList.remove('no3d');
  buildComposer(); size(); start();
}
return { ready: true, quality: quality, mode: setMode, fighters: fighters, attack: attack, ko: ko, victory: victory, revive: revive,
  burstAt: burstAt, celebrate: celebrate, shake: shake, pulse: pulse };
})();
