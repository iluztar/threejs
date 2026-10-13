import { startApp } from './core.js';
/* BG 3 · Underwater · storyboard scene 10
   Brief eras: Sc 10 = 1960s graphic sea; at the end a crack opens to the next era (1970s).
   Refs read: Doraemon Mermaid King (blue plate-rock ledges, magenta coral, seahorse, turtle, crab), Kirby Everbay (stacked disc coral
   in teal water) & GameCube cave (soft light from above), One Piece Fish-Man Island (seabed light shafts, Sea Forest spiral mounds &
   grape coral, Ryugu pastel shell towers + bubbles — main style target), Grand Blue (shoals, rays of light), Children of the Sea (wall of
   fish), Nagi no Asukara (sunlight through the surface), Red Sea / St Thomas reef & kelp photos (study only).
   Background only: Poki's spot is an empty, calm patch of sand. */

const rand = (s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; })(1963);
const pick = a => a[Math.floor(rand() * a.length)];
const between = (a, b) => a + rand() * (b - a);

const FLOOR = -40, CAUSTIC_PERIOD = 1.0;          // caustics loop every second (12 frames at 12 fps)
const SPOT = [0, -2];                             // Poki's calm patch (x, z)
const floorMin = (x, z, rx, rz = rx) => Math.min(floorY(x, z), floorY(x - rx, z), floorY(x + rx, z), floorY(x, z - rz), floorY(x, z + rz));   // wide pieces rest on the lowest point
const floorY = (x, z) => FLOOR + 1.5 * Math.sin(x * 0.08) * Math.cos(z * 0.06) + 0.8 * Math.sin(x * 0.21 + z * 0.13);
const C = {
  plate: ['#3FA9C9', '#5BC2D6', '#4CB6C9', '#7FD3E0'], branch: ['#D7559B', '#B65FC9', '#E06AA8', '#C94F8C'], brain: ['#F49AB0', '#F6A86A', '#F3C66B', '#F2B38A'],
  tube: ['#F6A86A', '#B98AD9', '#F49AB0'], fan: ['#F49AB0', '#E98FC0', '#F6B48F'], rock: ['#9FA7C9', '#B4B8D6', '#A9B2D8'], ledge: ['#6E9BD0', '#7FAAD8', '#5F8CC4'],
  kelp: ['#7DBF6E', '#93CF7E', '#6FB36A'], grass: ['#8FCB80', '#7CBF70', '#A3D58F'], sand: '#F3E3B5',
  fish: ['#F6D24A', '#F6A86A', '#7FB7E0', '#F49AB0', '#FFFFFF', '#9FD39A'], town: ['#F7C6D9', '#FBE6A8', '#D9CCF2', '#C7EBDF', '#FFFFFF'],
};

const S = { fish: [], bubbles: null };
const opts = { caustics: true };

function build(api) {
  const { THREE, groups: G, geo, solid, B, fx, setEl, inkLines, mergeGeometries } = api;
  /* FG plane (darkest): a row of kelp, coral and rocks at z 18–23, right in front of the descent and the reef track,
     so it slides past the lens. Tall kelp only at |x| ≥ 9; inside that only low coral (stays under the line to Poki's spot). */
  {
    setEl('foreground');
    const FG0 = G.FG, kelp = (x, z, h) => { const y0 = floorY(x, z); let px = x;
      for (let i = 0; i < 7; i++) { const nx = px + between(-0.4, 0.4), y = y0 + (i + 0.5) * h / 7; B(FG0, 'capsule').add([(px + nx) / 2, y, z], [0.22, h / 14, 0.22], pick(C.kelp), [0, 0, (px - nx) * 0.25]);
        B(FG0, 'sphereLo').add([nx + (i % 2 ? 0.55 : -0.55), y, z], [0.6, 0.22, 0.3], pick(C.kelp), [0, 0, i % 2 ? -0.5 : 0.5]); px = nx; } };
    const coral = (x, z, s) => { const y0 = floorY(x, z), col = pick(C.branch);
      for (let i = 0; i < 6; i++) { const a = between(-0.8, 0.8), L = s * between(0.6, 1), ex = x + Math.sin(a) * L * 0.5, ey = y0 + Math.cos(a) * L * 0.5;
        B(FG0, 'capsule').add([ex, ey, z + between(-0.4, 0.4)], [0.16 * s, L * 0.5, 0.16 * s], col, [0, 0, -a]); B(FG0, 'sphereLo').add([x + Math.sin(a) * L, y0 + Math.cos(a) * L, z], 0.28 * s, col); } };
    for (let x = -46; x <= 46; x += between(2.2, 3.6)) { const z = between(18, 23), far = Math.abs(x) >= 9, k = rand();
      if (far && k < 0.5) kelp(x, z, between(9, 13));
      else if (k < 0.75) coral(x, z, between(far ? 3 : 2.2, far ? 5 : 3.4));
      else for (let i = 0; i < 2; i++) { const s = between(1.2, 2.2); B(FG0, 'sphereLo').add([x + i * s, floorMin(x + i * s, z, s * 0.9) + s * 0.18, z], [s, s * 0.55, s * 0.9], pick(C.ledge)); } }
  }
  const { SKY, BG, MG, FG } = G;
  geo.fish = mergeGeometries([new THREE.SphereGeometry(0.5, 16, 12).scale(1, 0.62, 0.36), new THREE.ConeGeometry(0.32, 0.46, 3).rotateZ(Math.PI / 2).scale(1, 1, 0.35).translate(-0.6, 0, 0)]);
  geo.brain = (() => { const g = new THREE.SphereGeometry(1, 40, 30), p = g.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const d = 0.07 * Math.sin(v.x * 11) * Math.sin(v.y * 11 + 1) * Math.sin(v.z * 11 + 2); v.multiplyScalar(1 + d); p.setXYZ(i, v.x, v.y, v.z); }
    g.computeVertexNormals(); return g; })();

  /* ── sea floor with looping caustics ── */
  setEl('floor');
  const floorMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uSand: { value: new THREE.Color(C.sand) }, uFog: { value: new THREE.Color('#3FA9C9') }, uNear: { value: 10 }, uFar: { value: 160 }, uCaus: { value: 1 } },
    vertexShader: 'varying vec3 vW; varying float vD; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vD = -mv.z; gl_Position = projectionMatrix * mv; }',
    fragmentShader: `uniform float uTime; uniform vec3 uSand; uniform vec3 uFog; uniform float uNear; uniform float uFar; uniform float uCaus; varying vec3 vW; varying float vD;
      vec2 h2(vec2 p){ p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return fract(sin(p) * 43758.5453); }
      float cells(vec2 p, float t){ vec2 i = floor(p), f = fract(p); float d1 = 8.0, d2 = 8.0;
        for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 g = vec2(float(x), float(y)), o = h2(i + g); o = 0.5 + 0.42 * sin(6.2831 * (t + o));
          float d = length(g + o - f); if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; }
        return d2 - d1; }
      void main(){ float t = fract(uTime / ${CAUSTIC_PERIOD.toFixed(2)});
        float c = smoothstep(0.045, 0.0, cells(vW.xz * 0.16, t)) * 0.32 + smoothstep(0.035, 0.0, cells(vW.xz * 0.31 + 3.7, t)) * 0.2;
        vec3 col = uSand * (0.92 + 0.08 * sin(vW.x * 0.3) * sin(vW.z * 0.25)) + vec3(1.0, 1.0, 0.92) * c * uCaus;
        col = mix(col, uFog, smoothstep(uNear, uFar, vD)); gl_FragColor = vec4(col, 1.0); }` });
  // wide floor (900 × 900), shaped by floorY
  const fg = new THREE.PlaneGeometry(900, 900, 220, 220).rotateX(-Math.PI / 2); { const p = fg.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, floorY(p.getX(i), p.getZ(i))); fg.computeVertexNormals(); }
  S.floorMat = floorMat; fx(new THREE.Mesh(fg, floorMat), BG, { baseHex: C.sand, normalPass: true });
  // sand ripples drawn as ink dashes
  { const segs = [], cols = [];
    for (let i = 0; i < 520; i++) { const x = between(-90, 90), z = between(-120, 50); if (Math.hypot(x - SPOT[0], z - SPOT[1]) < 7) continue; const L = between(0.6, 1.4);
      segs.push(x, floorY(x, z) + 0.05, z, x + L, floorY(x + L, z) + 0.05, z); cols.push('#C9A97A'); }
    inkLines(segs, cols, BG); }

  /* ── surface (light ceiling from below) ── */
  setEl('surface');
  fx(new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#C8F3F7', side: THREE.DoubleSide, fog: false, transparent: true, opacity: 0.45, depthWrite: false })), BG, { baseHex: '#C8F3F7', occluder: false });   // see-through water surface
  { const segs = [], cols = [];                                   // ripple rings on the surface (ink)
    for (let i = 0; i < 60; i++) { const cx = between(-140, 140), cz = between(-200, 80), r = between(2, 7); for (let k = 0; k < 16; k++) { const a0 = k / 16 * 6.283, a1 = (k + 1) / 16 * 6.283; if (k % 4 === 3) continue;
      segs.push(cx + Math.cos(a0) * r, -0.05, cz + Math.sin(a0) * r * 0.6, cx + Math.cos(a1) * r, -0.05, cz + Math.sin(a1) * r * 0.6); cols.push('#8ED6E3'); } }
    inkLines(segs, cols, BG); }

  /* ── light shafts (own element, transparent, colour render only) ── */
  setEl('rays');
  const rayMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { uTime: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float uTime; varying vec2 vUv; void main(){ float a = smoothstep(0.0, 0.25, vUv.y) * (0.55 + 0.45 * sin(vUv.x * 18.0 + uTime * 0.6)) * 0.16; gl_FragColor = vec4(pow(vec3(0.85, 1.0, 0.95), vec3(2.2)) * a, a); }' });
  S.rayMat = rayMat; S.rays = [];
  for (let i = 0; i < 9; i++) { const r = new THREE.Mesh(new THREE.CylinderGeometry(2 + rand() * 2, 7 + rand() * 5, 46, 24, 1, true), rayMat);
    r.position.set(between(-50, 50), -21, between(-90, 10)); r.rotation.set(between(-0.12, 0.12), 0, between(-0.2, 0.2)); S.rays.push(r); fx(r, MG, { occluder: false }); }

  /* ── reef ── */
  const yAt = (x, z) => floorY(x, z);
  const clear = (x, z, d = 8) => Math.hypot(x - SPOT[0], z - SPOT[1]) > d;
  const pts = n => { const out = []; let guard = 0; while (out.length < n && guard++ < n * 20) { const x = between(-120, 120) * (rand() < 0.5 ? 1 : 0.6), z = between(-190, 30); if (clear(x, z)) out.push([x, z]); } return out; };
  setEl('ledges');                                                  // Doraemon blue plate-rock ledges
  for (const [x, z] of pts(14)) { const w = between(6, 12), y = floorMin(x, z, w * 0.5, w * 0.35) - 0.3; for (let k = 0; k < 3; k++) B(MG, 'rboxSoft').add([x + k * 0.8, y + 0.6 + k * 1.3, z - k * 0.6], [w * (1 - k * 0.22), 1.3, w * 0.7 * (1 - k * 0.22)], pick(C.ledge)); }
  setEl('plate-coral');
  for (const [x, z] of pts(26)) { const y = yAt(x, z), n = 2 + Math.floor(rand() * 3), r0 = between(2, 4.2), col = pick(C.plate);
    B(MG, 'capsule').add([x, y + n * 0.5, z], [0.6, n * 0.8, 0.6], '#E7D7B8');
    for (let k = 0; k < n; k++) B(MG, 'rcyl').add([x + between(-0.6, 0.6), y + 0.8 + k * 1.1, z + between(-0.6, 0.6)], [r0 * (1 - k * 0.2), 0.45, r0 * (1 - k * 0.2)], col); }
  setEl('branch-coral');
  for (const [x, z] of pts(30)) { const y = yAt(x, z), col = pick(C.branch), n = 4 + Math.floor(rand() * 4);
    for (let k = 0; k < n; k++) { const a = k / n * 6.283 + rand(), tilt = between(0.15, 0.6), L = between(1.6, 3.2);
      B(MG, 'capsule').add([x + Math.sin(a) * Math.sin(tilt) * L * 0.5, y + Math.cos(tilt) * L * 0.5, z + Math.cos(a) * Math.sin(tilt) * L * 0.5], [0.45, L, 0.45], col, [Math.cos(a) * tilt, 0, -Math.sin(a) * tilt]);
      B(MG, 'sphereLo').add([x + Math.sin(a) * Math.sin(tilt) * L, y + Math.cos(tilt) * L + 0.1, z + Math.cos(a) * Math.sin(tilt) * L], 0.32, col); } }
  setEl('brain-coral');
  for (const [x, z] of pts(18)) { const s = between(1.2, 2.6); B(MG, 'brain').add([x, yAt(x, z) + s * 0.55, z], [s, s * 0.75, s], pick(C.brain)); }
  setEl('tube-coral');
  for (const [x, z] of pts(16)) { const y = yAt(x, z), col = pick(C.tube);
    for (let k = 0; k < 4; k++) { const dx = between(-0.9, 0.9), dz = between(-0.9, 0.9), h = between(1.2, 2.6); B(MG, 'rcyl').add([x + dx, y - 0.2, z + dz], [0.38, h, 0.38], col); B(MG, 'torus').add([x + dx, y + h - 0.2, z + dz], [0.36, 0.36, 0.5], '#FFF1D6', [Math.PI / 2, 0, 0]); } }
  setEl('fan-coral');
  for (const [x, z] of pts(12)) { const s = between(1.6, 2.8), y = floorMin(x, z, s * 0.8) - 0.15; B(MG, 'sphere').add([x, y + s, z], [s, s, 0.16], pick(C.fan), [0, between(-0.6, 0.6), 0]); B(MG, 'capsule').add([x, yAt(x, z) + 0.5, z], [0.2, 1.1, 0.2], '#C98B6A'); }
  setEl('rocks');
  for (const [x, z] of pts(40)) { const s = between(0.6, 2.2); B(MG, 'sphereLo').add([x, floorMin(x, z, s * 0.9) + s * 0.25, z], [s, s * 0.6, s * 0.85], pick(C.rock)); }
  setEl('kelp');
  for (const [x, z] of pts(22)) { const y0 = yAt(x, z), n = 7 + Math.floor(rand() * 6), ph = rand() * 6, col = pick(C.kelp); let px = x, py = y0, pz = z;
    for (let k = 0; k < n; k++) { const ang = Math.sin(ph + k * 0.6) * 0.35, L = 1.6; const nx = px + Math.sin(ang) * L, ny = py + Math.cos(ang) * L;
      B(MG, 'capsule').add([(px + nx) / 2, (py + ny) / 2, pz], [0.32, L * 0.62, 0.18], col, [0, 0, -ang]);
      if (k % 2) B(MG, 'sphereLo').add([nx + 0.5, ny, pz], [0.55, 0.22, 0.2], col, [0, 0, 0.5]); px = nx; py = ny; } }
  setEl('seagrass');
  for (const [x, z] of pts(90)) { const y = yAt(x, z), s = between(0.5, 1); for (let k = -2; k <= 2; k++) B(MG, 'cone').add([x + k * 0.22 * s, y - 0.05, z], [0.16 * s, (1.3 - Math.abs(k) * 0.2) * s, 0.16 * s], pick(C.grass), [0, 0, k * 0.25]); }

  /* ── friendly creatures (scenery, not the characters) ── */
  setEl('creatures');
  { const [x, z] = [22, -18], y = yAt(x, z) + 6;                                     // sea turtle
    solid(geo.sphere, '#8DA65A', MG, { pos: [x, y, z], scale: [3, 1.2, 2.4] }); solid(geo.sphere, '#C9B27A', MG, { pos: [x, y - 0.5, z], scale: [2.7, 0.6, 2.1] });
    solid(geo.sphere, '#C9B27A', MG, { pos: [x + 3.2, y + 0.3, z], scale: [1, 0.85, 0.85] });
    for (const [dx, dz, r] of [[1.6, 2.2, 0.5], [1.6, -2.2, -0.5], [-1.8, 1.8, 0.4], [-1.8, -1.8, -0.4]]) solid(geo.sphere, '#C9B27A', MG, { pos: [x + dx, y - 0.2, z + dz], scale: [1.4, 0.25, 0.6], rot: [0, r, 0] }); }
  { const [x, z] = [-14, 4], y = yAt(x, z);                                           // seahorse
    for (let k = 0; k < 6; k++) solid(geo.sphere, '#F6D24A', MG, { pos: [x + Math.sin(k * 0.5) * 0.4, y + 1 + k * 0.55, z], scale: 0.5 - k * 0.02 });
    solid(geo.sphere, '#F6D24A', MG, { pos: [x + 0.6, y + 4.4, z], scale: [0.7, 0.45, 0.45] }); solid(geo.torus, '#F6D24A', MG, { pos: [x - 0.2, y + 0.6, z], scale: 0.6, rot: [0, Math.PI / 2, 0] }); }
  { const [x, z] = [9, 9], y = yAt(x, z);                                             // crab
    solid(geo.sphere, '#E8543A', MG, { pos: [x, y + 0.6, z], scale: [1.3, 0.7, 1] });
    for (const s of [-1, 1]) for (const lz of [-0.5, 0.2, 0.8]) solid(geo.capsule, '#D9472F', MG, { pos: [x + s * 1.25, y + 0.16, z + lz], scale: [0.14, 0.34, 0.14], rot: [0, 0, s * 0.6] });   // legs down to the sand
    for (const s of [-1, 1]) { solid(geo.sphere, '#E8543A', MG, { pos: [x + s * 1.6, y + 0.9, z + 0.6], scale: [0.55, 0.45, 0.45] }); solid(geo.capsule, '#E8543A', MG, { pos: [x + s * 1.35, y + 0.75, z + 0.4], scale: [0.18, 0.3, 0.18], rot: [0, 0, s * 0.9] }); solid(geo.capsule, '#FFFFFF', MG, { pos: [x + s * 0.4, y + 1.5, z + 0.4], scale: [0.2, 0.5, 0.2] }); } }

  /* ── fish shoals (they swim; deterministic by time) ── */
  setEl('fish');
  const fishB = B(MG, 'fish');
  S.shoals = [];
  for (let s = 0; s < 7; s++) { const cx = between(-50, 50), cy = between(-30, -10), cz = between(-100, 0), R0 = between(6, 14), col = pick(C.fish), n = 18 + Math.floor(rand() * 14), sp = between(0.15, 0.35) * (rand() < 0.5 ? 1 : -1);
    const sh = { cx, cy, cz, R0, sp, fish: [] };
    for (let i = 0; i < n; i++) { const f = { a: rand() * 6.283, r: R0 * between(0.5, 1.1), dy: between(-2.5, 2.5), s: between(0.9, 1.5), i: fishB.items.length }; sh.fish.push(f); fishB.add([cx, cy, cz], f.s, rand() < 0.15 ? '#FFFFFF' : col); }
    S.shoals.push(sh); }
  S.fishB = fishB;

  /* ── bubbles rising (outlined circles) ── */
  setEl('bubbles');
  const bubB = B(MG, 'sphereLo'); S.bubbles = [];
  for (let i = 0; i < 90; i++) { const b = { x: between(-50, 50), z: between(-90, 20), y0: between(FLOOR, 0), sp: between(1.5, 4), r: between(0.15, 0.6), i: bubB.items.length }; S.bubbles.push(b); bubB.add([b.x, b.y0, b.z], b.r, '#F2FCFF'); }
  S.bubB = bubB;

  /* ── marine snow ── */
  setEl('marine-snow');
  { const p = []; for (let i = 0; i < 900; i++) p.push(between(-80, 80), between(FLOOR, -2), between(-130, 40));
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    fx(new THREE.Points(g, new THREE.PointsMaterial({ color: '#E8FBFF', size: 2, sizeAttenuation: false, transparent: true, opacity: 0.7 })), MG, { occluder: false }); }

  /* ── far pastel shell-tower town (Ryugu, simplified, in the haze) ── */
  setEl('ledges');   // distant reef ridges all around the back: the sea floor goes on to the fog (few, soft, believable)
  api.range(BG, { arc: [Math.PI, 3.2], d: [230, 300], count: 9, h: [14, 30], col: ['#7FAAD8', '#8FB8DD', '#6E9BD0'], y0: FLOOR - 2, hill: true, depth: 0.7, seed: 301 });
  api.range(BG, { arc: [Math.PI + 0.3, 2.6], d: [360, 420], count: 7, h: [30, 55], col: ['#A9C9E6', '#B6D3EA'], y0: FLOOR - 3, depth: 0.6, seed: 302 });
  setEl('far-town');
  for (let i = 0; i < 22; i++) { const x = between(-200, 200), z = between(-330, -250), y = floorY(x, z), h = between(14, 34), r = between(3, 6), col = pick(C.town);
    B(BG, 'rcyl').add([x, y - 1, z], [r, h, r], col); for (let k = 0; k < 3; k++) B(BG, 'cone').add([x, y + h * (0.55 + k * 0.17), z], [r * (1.25 - k * 0.25), r * 0.9, r * (1.25 - k * 0.25)], pick(C.town)); B(BG, 'sphere').add([x, y + h + 2.5, z], r * 0.35, '#FFF3C2'); }
  for (let i = 0; i < 5; i++) B(BG, 'halfSphere').add([between(-200, 200), FLOOR - 3, between(-380, -320)], [between(26, 44), between(16, 28), between(26, 44)], '#D9F2F6');

  S.api = api;
}

/* per-frame motion (fish, bubbles, caustics) — deterministic from T so exports match the preview */
function animate(T, api) {
  const { THREE } = api, o = new THREE.Object3D();
  if (S.fishB && S.fishB.mesh) { const m = S.fishB.mesh;
    for (const sh of S.shoals) for (const f of sh.fish) { const a = f.a + T * sh.sp; o.position.set(sh.cx + Math.cos(a) * f.r, sh.cy + f.dy + Math.sin(T * 0.8 + f.a) * 0.4, sh.cz + Math.sin(a) * f.r);
      o.rotation.set(0, -a - (sh.sp > 0 ? Math.PI / 2 : -Math.PI / 2), 0); o.scale.setScalar(f.s); o.updateMatrix(); m.setMatrixAt(f.i, o.matrix); }
    m.instanceMatrix.needsUpdate = true; }
  if (S.bubB && S.bubB.mesh) { const m = S.bubB.mesh, span = -FLOOR;
    for (const b of S.bubbles) { const y = FLOOR + ((b.y0 - FLOOR + T * b.sp) % span); o.position.set(b.x + Math.sin(T * 1.3 + b.x) * 0.4, y, b.z); o.rotation.set(0, 0, 0); o.scale.setScalar(b.r); o.updateMatrix(); m.setMatrixAt(b.i, o.matrix); }
    m.instanceMatrix.needsUpdate = true; }
  if (S.floorMat) { S.floorMat.uniforms.uTime.value = T; S.floorMat.uniforms.uCaus.value = opts.caustics ? 1 : 0; }
  if (S.rayMat) S.rayMat.uniforms.uTime.value = T;
}

function water(api) {                                 // colour of the water around the camera: turquoise near the top → deep blue
  const { THREE, camera, scene, setSky, fxU, hemi, sun } = api, y = camera.position.y;
  if (y > 0) { setSky('#7FC4EE', '#E4F3FA', '#5FCFE0', { baseHex: '#9FD3F0' }); scene.fog = null; fxU.depthWarm = 0; hemi.intensity = 2.2; return; }
  const t = api.clamp(-y / 38, 0, 1), mix = (a, b) => api.rgbToHex(api.hexToRgb(a).map((v, i) => v + (api.hexToRgb(b)[i] - v) * t));
  const fogC = mix('#5FCFE0', '#2F6FB0');
  setSky(mix('#BFF3F5', '#7FD3E8'), fogC, fogC, { baseHex: fogC });            // below the horizon = fog colour (no dark band)
  scene.fog = S.fog ||= new THREE.Fog(fogC, 22, 300);   // one Fog object, updated in place (a new one every frame re-checks every material)
  scene.fog.color.set(fogC); scene.fog.near = 22; scene.fog.far = api.lerp(300, 220, t);   // see farther: a wide sea
  if (S.floorMat) { S.floorMat.uniforms.uFog.value.set(fogC); S.floorMat.uniforms.uNear.value = 22; S.floorMat.uniforms.uFar.value = api.lerp(300, 220, t); }
  fxU.depthWarm = t * 0.75; hemi.intensity = api.lerp(2.2, 1.6, t); hemi.color.set('#E9FBFF'); hemi.groundColor.set('#3A7FA8'); sun.intensity = 1.1; sun.position.set(0.2, 1, 0.3);
}
/** near-orthographic version of a view (same framing, very far, narrow lens) for track panoramas: no smear, true flat strip.
    Fog distances are shifted by the same amount so the colours stay identical. */
const FAR_D = 3000;
function farCam(api, p, t, mm) {
  const { THREE, camera, scene } = api, P = new THREE.Vector3(...p), Tt = new THREE.Vector3(...t), d0 = P.distanceTo(Tt), dir = P.clone().sub(Tt).normalize();
  camera.position.copy(Tt).add(dir.multiplyScalar(FAR_D)); camera.up.set(0, 1, 0); camera.lookAt(Tt);
  camera.fov = 2 * Math.atan(d0 * Math.tan(Math.atan(12 / mm)) / FAR_D) * 180 / Math.PI; camera.near = FAR_D - d0 - 60; camera.far = FAR_D + 400;
  const shift = FAR_D - d0;
  if (scene.fog) { scene.fog.near = 22 + shift; scene.fog.far = 260 + shift; }
  if (S.floorMat) { S.floorMat.uniforms.uNear.value = 22 + shift; S.floorMat.uniforms.uFar.value = 260 + shift; }
}
const cam = (api, p, t, mm = 28) => { const { camera } = api; camera.position.set(...p); camera.up.set(0, 1, 0); camera.lookAt(...t); camera.fov = 2 * Math.atan(12 / mm) * 180 / Math.PI; camera.near = 0.1; camera.far = 2000; };

const shots = [
  { name: 'Splash in (1960s)', dur: 3, era: 'e1960',
    update(k, ts, api) { const e = api.ease(k); cam(api, [0, api.lerp(9, -4, e), 32], [0, api.lerp(-6, -14, e), api.lerp(0, -10, e)], 26); } },
  { name: 'Descent to the reef (1960s)', dur: 7, era: 'e1960',
    update(k, ts, api) { const e = api.ease(k); cam(api, [0, api.lerp(-4, -29, e), api.lerp(32, 26, e)], [0, api.lerp(-14, -36, e), -10], 28); },
    pano: { label: 'tall strip of the whole descent', axis: 'y', from: -2, to: -31, pxPerUnit: (H, api) => api.focalPx(H) / FAR_D, setup: (s, api) => farCam(api, [0, s, 28], [0, s - 6, -10], 28) } },
  { name: 'Reef hold · track (1960s)', dur: 7, era: 'e1960',
    update(k, ts, api) { const x = api.lerp(-14, 14, api.ease(k)); cam(api, [x, -29, 26], [x * 0.6, -35, -10], 30); },
    pano: { label: 'long strip along the reef', axis: 'x', from: -60, to: 60, pxPerUnit: (H, api) => api.focalPx(H) / FAR_D, setup: (s, api) => farCam(api, [s, -29, 26], [s, -35, -10], 30) } },
  { name: 'Crack → 1970s', dur: 4, era: 'e1960', trans: { type: 'crack', to: 'e1970', at: [0.15, 1] },
    update(k, ts, api) { const a = api.lerp(-0.08, 0.1, api.ease(k)); cam(api, [0, -29, 26], [Math.sin(a) * 36, -35, 26 - Math.cos(a) * 36], 30); } },
];

startApp({
  id: 'bg3', title: 'BG 3 · Underwater (1960s)', fov: 46, shots, build, fogMax: 1,   // the fog wall hides the end of the sea
  layers: api => api.camera.position.y < 0 ? [10, 40, 110] : null,
  eras: ['e1960', 'e1970'],
  update(T, api) { animate(T, api); water(api); },
  staging: () => ({ center: [SPOT[0], floorY(SPOT[0], SPOT[1]), SPOT[1]], size: [2.4, 2.2, 2.4] }),
  guiTitle: 'BG 3 · Sea',
  gui(f, api) {
    f.add(opts, 'caustics').name('Caustics');
    api.exportExtra('Caustic loop (12 frames ZIP)', async ({ say, captureFrame, toBlob, download, zip, applyTime, tick, state }) => {
      const z = zip(), T0 = state.T;
      for (let i = 0; i < 12; i++) { say(`Caustic loop — frame ${i + 1}/12…`); await tick(); applyTime(T0 + i * CAUSTIC_PERIOD / 12);
        z.file(`bg3_caustics_${String(i).padStart(2, '0')}.png`, await toBlob(captureFrame('final', 'floor', 1920, 1080))); }
      applyTime(T0); say('Zipping…'); await tick(); download(await z.generateAsync({ type: 'blob' }), 'bg3_caustic-loop_12f.zip');
    });
  },
});
