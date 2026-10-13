import { startApp } from './core.js';
/* BG 1 · World reveal — the 360° turn (storyboard scenes 3–4 · 1960s)
   Layout follows the team's own test ("convert mp4 to threejs.html"): the camera orbits r 7 around the characters on the
   cream dome (R 40, ground −12) looking at the centre, one full turn per 24 s loop. No smear (done by hand).
   City = an advanced city of the 1960s (New York / Chicago / London feel, not Tokyo rules): a FEW tall Art Deco towers with
   setbacks & spires and some International Style office slabs downtown, many 5–10 floor brick blocks with wooden rooftop
   water tanks, 3–4 floor row houses, shops with awnings & neon, suburban gable-roof houses at the edge, 60s rounded cars & buses.
   Kawaii brief (Kirby / Chiikawa): everything rounded and pastel, ink #8A6B64, calm area where the characters stand. */

const rand = (s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; })(1962);
const pick = a => a[Math.floor(rand() * a.length)];
const between = (a, b) => a + rand() * (b - a);

/* ── settings ── */
const LOOP = 24, ORBIT_R = 7, CAM_Y = 1.7, LOOK_Y = 1.05;
const GROUND_Y = -12, DOME_R = 40;
const DOWNTOWN = [-34, 116];                // skyline faces the middle of the loop (blue centre panel)
const LANDMARK = [-52, 134];                // hero tower on the right third of that view
const RINGS = [78, 150];
const AVENUES = [0.35, 1.9, 3.5, 5.0];

const C = {
  brick: ['#E7A99A', '#D99A86', '#E9B8A2', '#DFA48F'], stone: ['#EBD9B4', '#F1E4CC', '#E6DCC6', '#EFE3D3'], greyc: ['#DDE1E4', '#E3E7D9', '#E6DCEB', '#D8E2E6'],
  glass: '#9CC3D5', glass2: '#A8D0C8', pane: '#8FA9CC',
  wood: ['#F1E4CC', '#F4EBDD', '#E9DCC8', '#F3DFC9', '#E3EEDD'], roof: ['#7F8DA6', '#C9785E', '#79A98F', '#9C8FB8', '#B07A6A'],
  shop: ['#F7D2C4', '#FBEAB0', '#CDE4F2', '#CFE8D5', '#F4E3C1'], awning: ['#E8836B', '#7FB7E0', '#F2C14E', '#8FCB8A', '#E89BB8'], neon: ['#E2574C', '#3E7CB1', '#F2C14E', '#4FA889', '#E89BB8'],
  tank: ['#C99B72', '#B88A64', '#D2A77F'],
  green: ['#A6D6A0', '#B8E2A9', '#93CF95'], trunk: '#E2C1A4',
  dome: '#F6EFD4', ground: '#EBE5C9', alley: '#F7F3E4', road: '#E2DED3', park: '#BFE3A8',
  dash: '#8A6B64', tuft: '#6FBF73', river: '#A9DCF2', ridgeA: '#D3D0E6', ridgeB: '#B9B6D4', wire: '#6B5E58',
  car: ['#E8836B', '#7FB7E0', '#F2D17B', '#9FD39A', '#F3F0E6', '#C8A2D8'],
};
const domeY = d => Math.sqrt(Math.max(0, DOME_R * DOME_R - d * d)) - DOME_R;
const DOME_FOOT = Math.sqrt(DOME_R * DOME_R - (DOME_R + GROUND_Y) ** 2);   // ≈ 28.6

const opts = { landmark: 'deco', light: 'team' };
const landmarks = {};

function build(api) {
  const { THREE, groups: G, geo, solid, B, fx, setEl, inkLines } = api;
  const { SKY, BG, MG, FG } = G;
  const roofShape = new THREE.Shape([new THREE.Vector2(-0.5, 0), new THREE.Vector2(0.5, 0), new THREE.Vector2(0, 0.5)]);
  geo.roof = new THREE.ExtrudeGeometry(roofShape, { depth: 1, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2 }).translate(0, 0, -0.5);
  geo.box = new THREE.BoxGeometry(1, 1, 1);

  /* ── ground, streets, river ── */
  setEl('ground');
  fx(new THREE.Mesh(new THREE.CircleGeometry(1600, 96).rotateX(-Math.PI / 2), new THREE.MeshToonMaterial({ color: C.ground })), BG, { baseHex: C.ground, normalPass: true }).position.y = GROUND_Y;
  const flat = (geom, hex, y, id, g = BG) => { const m = fx(new THREE.Mesh(geom, new THREE.MeshToonMaterial({ color: hex })), g, { baseHex: hex, idColor: id }); m.position.y = GROUND_Y + y; return m; };
  { const strips = [];
    for (let v = -172; v <= 172; v += 8) { strips.push(new THREE.PlaneGeometry(1.4, 344).rotateX(-Math.PI / 2).translate(v + 4, 0, 0), new THREE.PlaneGeometry(344, 1.4).rotateX(-Math.PI / 2).translate(0, 0, v + 4)); }
    flat(api.mergeGeometries(strips), C.alley, 0.02, '#3d7a55'); }
  for (const r of RINGS) flat(new THREE.RingGeometry(r - 3.2, r + 3.2, 160).rotateX(-Math.PI / 2), C.road, 0.04, '#7a3d55');
  for (const a of AVENUES) { const g = new THREE.PlaneGeometry(5.5, 190).rotateX(-Math.PI / 2).translate(0, 0, -(DOME_FOOT + 98)); g.rotateY(-a); flat(g, C.road, 0.045, '#7a3d55'); }

  setEl('river');
  const river = new THREE.CatmullRomCurve3([[-340, -150], [-210, -96], [-120, -132], [-20, -176], [90, -150], [200, -206], [340, -182]].map(p => new THREE.Vector3(p[0], 0, p[1])));
  { const N = 200, L = [], R = [];
    for (let i = 0; i <= N; i++) { const p = river.getPointAt(i / N), t = river.getTangentAt(i / N); const n = new THREE.Vector2(-t.z, t.x).multiplyScalar(9); L.push(new THREE.Vector2(p.x + n.x, p.z + n.y)); R.unshift(new THREE.Vector2(p.x - n.x, p.z - n.y)); }
    flat(new THREE.ShapeGeometry(new THREE.Shape([...L, ...R])).rotateX(Math.PI / 2), C.river, 0.07, '#2f5fa0');
    for (const k of [0.32, 0.56, 0.8]) { const p = river.getPointAt(k), t = river.getTangentAt(k);
      solid(geo.rbox, '#F7F2E6', MG, { pos: [p.x, GROUND_Y + 0.9, p.z], scale: [5, 0.9, 25], rot: [0, Math.atan2(t.x, t.z) + Math.PI / 2, 0] }); } }
  const rs = river.getSpacedPoints(300);
  const nearRiver = (x, z, d) => rs.some(p => (p.x - x) ** 2 + (p.z - z) ** 2 < d * d);
  const angDiff = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
  const onMainRoad = (x, z, pad) => { const r = Math.hypot(x, z), a = Math.atan2(-x, -z);
    return RINGS.some(R => Math.abs(r - R) < 3.2 + pad) || AVENUES.some(A => r > DOME_FOOT && angDiff(a, A) * r < 2.75 + pad); };

  /* ── dome (team test) + hand-drawn dashes & tufts (ink lines) ── */
  setEl('dome');
  solid(new THREE.SphereGeometry(DOME_R, 128, 40, 0, Math.PI * 2, 0, 0.9), C.dome, FG, { pos: [0, -DOME_R, 0] });
  { const segs = [], cols = [];
    for (let i = 0; i < 340; i++) {
      const a = rand() * 6.283, d = Math.sqrt(rand()) * 27; if (d < 2.6) continue;
      const x = Math.sin(a) * d, z = Math.cos(a) * d, n = 2 + Math.floor(rand() * 2);
      for (let k = 0; k < n; k++) { const L = 0.4 + rand() * 0.5, ox = (rand() - 0.5) * 0.3, x0 = x + ox, z0 = z + k * 0.22;
        segs.push(x0, domeY(Math.hypot(x0, z0)) + 0.03, z0, x0 + L, domeY(Math.hypot(x0 + L, z0)) + 0.03, z0); cols.push(C.dash); }
    }
    for (let i = 0; i < 220; i++) {
      const a = rand() * 6.283, d = Math.sqrt(rand()) * 26; if (d < 2.6) continue;
      const x = Math.sin(a) * d, z = Math.cos(a) * d, y = domeY(d) + 0.03;
      [[-0.1, -0.18, 0.28], [0, 0, 0.36], [0.1, 0.18, 0.28]].forEach(t => { segs.push(x + t[0], y, z, x + t[1], y + t[2], z); cols.push(C.tuft); });
    }
    inkLines(segs, cols, FG); }

  /* ── hill details: rocks, fallen logs, stumps & dead branches, grass clumps, flowers (character spot stays clear) ── */
  {
    const spot = () => { for (;;) { const a = rand() * 6.283, d = 4.5 + Math.sqrt(rand()) * 22.5; const x = Math.sin(a) * d, z = Math.cos(a) * d; return [x, z, domeY(d), a]; } };
    setEl('rocks');
    for (let i = 0; i < 80; i++) { const [x, z, y] = spot(), s = 0.4 + rand() * 0.8, n = 1 + Math.floor(rand() * 3);
      for (let k = 0; k < n; k++) B(FG, 'sphereLo').add([x + k * s * 0.9, y + s * 0.25, z + (rand() - 0.5) * s], [s * (1 - k * 0.25), s * 0.62 * (1 - k * 0.2), s * 0.85], pick(['#C9C4D6', '#BDB8CC', '#D4CFDC'])); }
    setEl('logs');
    for (let i = 0; i < 18; i++) { const [x, z, y, a] = spot(), L = 1.8 + rand() * 1.8, r = 0.28 + rand() * 0.16, ry = rand() * 3.14;
      B(FG, 'capsule').add([x, y + r * 0.8, z], [r * 2, L, r * 2], '#B98A6A', [Math.PI / 2, ry, 0]);                              // fallen log
      const ex = Math.sin(ry) * (L / 2 + r * 0.6), ez = Math.cos(ry) * (L / 2 + r * 0.6);
      B(FG, 'rcyl').add([x + ex, y + r * 0.8, z + ez], [r * 0.82, 0.08, r * 0.82], '#E8CDA6', [Math.PI / 2, ry, 0]);               // cut end ring
    }
    for (let i = 0; i < 16; i++) { const [x, z, y] = spot(), r = 0.36 + rand() * 0.24;
      B(FG, 'rcyl').add([x, y - 0.05, z], [r, 0.5 + rand() * 0.3, r], '#B98A6A'); B(FG, 'rcyl').add([x, y + 0.5, z], [r * 0.82, 0.06, r * 0.82], '#E8CDA6'); }   // stumps
    for (let i = 0; i < 26; i++) { const [x, z, y] = spot(), L = 1.0 + rand() * 1.0, ry = rand() * 3.14;                              // dead branches
      B(FG, 'capsule').add([x, y + 0.08, z], [0.12, L, 0.12], '#A88268', [Math.PI / 2, ry, 0]);
      B(FG, 'capsule').add([x + Math.sin(ry + 0.6) * L * 0.3, y + 0.1, z + Math.cos(ry + 0.6) * L * 0.3], [0.08, L * 0.45, 0.08], '#A88268', [Math.PI / 2, ry + 0.7, 0]); }
    setEl('grass');
    for (let i = 0; i < 280; i++) { const [x, z, y] = spot(), s = 0.35 + rand() * 0.4, col = pick(['#8FCB80', '#7CBF70', '#A3D58F']);
      for (let k = -2; k <= 2; k++) B(FG, 'cone').add([x + k * s * 0.22, y - 0.02, z], [s * 0.18, s * (1.1 - Math.abs(k) * 0.2), s * 0.18], col, [0, 0, k * 0.28]); }
    setEl('flowers');
    for (let i = 0; i < 160; i++) { const [x, z, y] = spot(), col = pick(['#F6B9CF', '#FFF3B0', '#FFFFFF', '#C9B8F0']), k = 1 + rand() * 0.8;
      B(FG, 'capsule').add([x, y + 0.2 * k, z], [0.06 * k, 0.4 * k, 0.06 * k], '#7CBF70'); B(FG, 'sphereLo').add([x, y + 0.48 * k, z], [0.18 * k, 0.1 * k, 0.18 * k], col); B(FG, 'sphereLo').add([x, y + 0.52 * k, z], 0.07 * k, '#F2C14E'); }
  }

  /* ── kit ── */
  const blob = (g, x, y, z, r, col, sy = 1) => B(g, 'sphere').add([x, y, z], [r, r * sy, r], col);
  const treeAt = (g, x, z, s, y0) => api.tree(g, x, y0, z, s, { leaf: C.green, trunk: C.trunk });   // leafy crown, branches (core)
  const bushAt = (g, x, z, s, y0) => api.bush(g, x, y0, z, s, { leaf: C.green });
  const faceTo = (x, z) => Math.atan2(-x, -z);
  /** windows on 4 sides (outlined near the camera) */
  const windows = (g, x, z, w, d, y0, rows, rowH, ry, glass = C.pane, wide = 0.5) => {
    const b = B(g, 'box', false); b.idColor = '#203050'; b.idMaxD = 160;
    const cw = Math.max(1, Math.floor(w / 1.7)), cd = Math.max(1, Math.floor(d / 1.7)), c = Math.cos(ry), s = Math.sin(ry);
    const put = (lx, lz, sx, sz, y) => b.add([x + lx * c + lz * s, y, z - lx * s + lz * c], [sx, rowH * 0.42, sz], glass, [0, ry, 0]);
    for (let r = 0; r < rows; r++) { const y = y0 + rowH * (r + 0.55);
      for (let i = 0; i < cw; i++) { const lx = (i + 0.5) / cw * w - w / 2; put(lx, d / 2 + 0.02, w / cw * wide, 0.03, y); put(lx, -d / 2 - 0.02, w / cw * wide, 0.03, y); }
      for (let i = 0; i < cd; i++) { const lz = (i + 0.5) / cd * d - d / 2; put(w / 2 + 0.02, lz, 0.03, d / cd * wide, y); put(-w / 2 - 0.02, lz, 0.03, d / cd * wide, y); } }
  };
  const waterTank = (g, x, z, y) => {                         // wooden rooftop water tank (1960s New York)
    for (const [lx, lz] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) B(g, 'capsule').add([x + lx, y + 1, z + lz], [0.16, 2, 0.16], '#9A8A78');
    B(g, 'rcyl').add([x, y + 2, z], [1.3, 2.4, 1.3], pick(C.tank)); B(g, 'cone').add([x, y + 4.35, z], [1.45, 1.2, 1.45], '#8E7563');
  };
  const block = (x, z, floors, palette) => {                  // 5–10 floor brick / stone block
    const w = between(6, 7.4), d = between(6, 7.4), h = floors * 3.2 + 0.6, ry = Math.round(rand()) * Math.PI / 2, g = h > 26 ? BG : MG;
    B(g, 'rbox').add([x, GROUND_Y + h / 2, z], [w, h, d], pick(palette), [0, ry, 0]);
    B(g, 'rbox').add([x, GROUND_Y + h + 0.25, z], [w * 1.04, 0.5, d * 1.04], '#D6D1C6', [0, ry, 0]);   // cornice
    windows(g, x, z, w, d, GROUND_Y + 0.6, floors, 3.2, ry);
    const top = GROUND_Y + h + 0.5;
    if (rand() < 0.55) waterTank(g, x + between(-1.4, 1.4), z + between(-1.4, 1.4), top);
    else if (rand() < 0.4) { const c = Math.cos(ry), s = Math.sin(ry); for (const o of [-2, 2]) B(g, 'capsule').add([x + o * c, top + 2, z - o * s], [0.18, 3.6, 0.18], '#8C8579');
      B(g, 'rboxSoft').add([x, top + 3.6, z], [5.4, 2.4, 0.4], pick(C.neon), [0, ry, 0]); B(g, 'rbox').add([x, top + 3.6, z], [4.2, 0.5, 0.45], '#FFF6E6', [0, ry, 0]); }
    for (let i = 0; i < 1 + Math.floor(rand() * 2); i++) B(g, 'rbox').add([x + between(-w / 3, w / 3), top + 0.5, z + between(-d / 3, d / 3)], [1.2, 1, 1], '#CFCAC0');
  };
  const slab = (x, z) => {                                    // International Style office slab (1950s–60s), glass grid
    const w = between(7, 7.6), d = between(6.2, 7), floors = 5 + Math.floor(rand() * 3), h = floors * 3.3 + 1, ry = Math.round(rand()) * Math.PI / 2;
    B(BG, 'rbox').add([x, GROUND_Y + h / 2, z], [w, h, d], pick(C.greyc), [0, ry, 0]);
    windows(BG, x, z, w, d, GROUND_Y + 1, floors, 3.3, ry, pick([C.glass, C.glass2]), 0.82);
    B(BG, 'rbox').add([x, GROUND_Y + h + 1, z], [w * 0.5, 2, d * 0.5], '#D2D6D8', [0, ry, 0]);
  };
  const deco = (x, z, tall) => {                              // Art Deco setback tower with crown & spire (rare)
    let y = GROUND_Y, w = 7.4; const col = pick(C.stone), steps = [tall * 0.5, tall * 0.25, tall * 0.15];
    steps.forEach((h, i) => { B(BG, 'rbox').add([x, y + h / 2, z], [w, h, w], col); windows(BG, x, z, w, w, y, Math.floor(h / 3.4), 3.4, 0, C.pane, 0.4); y += h; w *= 0.74; });
    B(BG, 'halfSphere').add([x, y, z], [w * 0.62, w * 0.9, w * 0.62], '#E8D9B0'); B(BG, 'capsule').add([x, y + w * 0.9 + 1.5, z], [0.3, 3, 0.3], '#D9C79C');
  };
  const shop = (x, z) => {                                    // 2-storey shop: awning + neon sign
    const w = between(5, 6.4), d = between(5, 6.4), h = 6.2, ry = faceTo(x, z);
    B(MG, 'rbox').add([x, GROUND_Y + h / 2, z], [w, h, d], pick(C.shop), [0, ry, 0]);
    B(MG, 'rbox').add([x, GROUND_Y + 3, z], [w * 0.98, 0.25, d + 1.6], pick(C.awning), [0, ry, 0]);
    B(MG, 'rboxSoft').add([x + Math.cos(ry) * (w / 2 - 0.4), GROUND_Y + 5.6, z - Math.sin(ry) * (w / 2 - 0.4)], [0.5, 3.2, 1.1], pick(C.neon), [0, ry, 0]);
    windows(MG, x, z, w, d, GROUND_Y + 3.2, 1, 2.8, ry);
  };
  const row = (x, z) => {                                     // 3–4 floor row house (brownstone), flat roof
    const w = between(5.2, 6), d = between(6, 7), floors = Math.hypot(x, z) < 70 ? 3 : 3 + Math.floor(rand() * 2), h = floors * 3 + 0.5, ry = faceTo(x, z);
    B(MG, 'rbox').add([x, GROUND_Y + h / 2, z], [w, h, d], pick(C.brick), [0, ry, 0]);
    B(MG, 'rbox').add([x, GROUND_Y + h + 0.2, z], [w * 1.05, 0.4, d * 1.05], '#E9DCC8', [0, ry, 0]);
    windows(MG, x, z, w, d, GROUND_Y + 0.4, floors, 3, ry);
  };
  const house = (x, z) => {                                   // suburban gable-roof house
    const w = between(4.4, 5.8), d = between(4.4, 5.8), floors = rand() < 0.4 ? 2 : 1, h = floors * 2.8 + 0.4, ry = faceTo(x, z) + (rand() < 0.5 ? 0 : Math.PI / 2);
    B(MG, 'rbox').add([x, GROUND_Y + h / 2, z], [w, h, d], pick(C.wood), [0, ry, 0]);
    B(MG, 'roof').add([x, GROUND_Y + h - 0.05, z], [w * 1.16, between(2.0, 2.8), d * 1.12], pick(C.roof), [0, ry, 0]);
    windows(MG, x, z, w, d, GROUND_Y, floors, 2.8, ry, '#A9C3DD');
    if (rand() < 0.4) { const c = Math.cos(ry), s = Math.sin(ry); B(MG, 'rbox').add([x + w * 0.3 * c, GROUND_Y + h + 1.6, z - w * 0.3 * s], [0.7, 2, 0.7], '#C9785E', [0, ry, 0]); }   // chimney
    if (rand() < 0.5) treeAt(MG, x + between(-4, 4), z + between(-4, 4), 0.7, GROUND_Y);
  };

  /* ── city cells (team grid, 1960s advanced city mix) ──
     max floors by ring so every roof stays ≈10° below the frame top (open sky above the city) */
  const maxFloors = r => r < 80 ? 4 : r < 130 ? 6 : 7;
  let towersLeft = 4;
  for (let gx = -168; gx <= 168; gx += 8) for (let gz = -168; gz <= 168; gz += 8) {
    const r = Math.hypot(gx, gz); if (r < DOME_FOOT + 12 || r > 196) continue;
    const x = gx + (rand() - 0.5) * 0.6, z = gz + (rand() - 0.5) * 0.6;
    if (nearRiver(x, z, 13) || onMainRoad(x, z, 3.2) || Math.hypot(x - LANDMARK[0], z - LANDMARK[1]) < 14 || rand() < 0.07) continue;
    const dd = Math.hypot(x - DOWNTOWN[0], z - DOWNTOWN[1]);
    const nearMain = RINGS.some(R => Math.abs(r - R) < 10) || AVENUES.some(A => angDiff(Math.atan2(-x, -z), A) * r < 9);
    setEl('city');
    if (dd < 26 && towersLeft > 0 && rand() < 0.3) { towersLeft--; deco(x, z, between(22, 26)); }   // tall for the 1960s, with sky above it
    else if (dd < 46 && rand() < 0.35) slab(x, z);
    else if (dd < 70 && rand() < 0.8) block(x, z, Math.min(maxFloors(r), 4 + Math.floor(rand() * 3 + (1 - dd / 70) * 2)), rand() < 0.6 ? C.brick : C.stone);
    else if (nearMain && rand() < 0.7) shop(x, z);
    else if (r < 120 && rand() < 0.55) row(x, z);
    else if (r < 120 && rand() < 0.25) block(x, z, Math.min(maxFloors(r), 3 + Math.floor(rand() * 3)), C.stone);
    else if (rand() < 0.08) { setEl('trees'); treeAt(MG, x, z, 1.2, GROUND_Y); treeAt(MG, x + 2.5, z + 2, 0.9, GROUND_Y); }
    else { setEl('houses'); house(x, z); }
  }

  /* ── hero landmark: Art Deco spire tower (default) or 1962 observation needle ── */
  setEl('landmark');
  { const g = new THREE.Group(); g.position.set(LANDMARK[0], GROUND_Y, LANDMARK[1]); BG.add(g);
    let y = 0, w = 10; [[14, '#F1E4CC'], [8, '#F1E4CC'], [5, '#EBD9B4'], [3, '#E8D9B0']].forEach(([h, c]) => { solid(geo.rbox, c, g, { pos: [0, y + h / 2, 0], scale: [w, h, w] }); y += h; w *= 0.76; });
    solid(geo.halfSphere, '#E3C88E', g, { pos: [0, y, 0], scale: [w * 0.7, w * 1.2, w * 0.7] }); solid(geo.capsule, '#D9C79C', g, { pos: [0, y + w * 1.2 + 3, 0], scale: [0.45, 4, 0.45] });
    landmarks.deco = g; }
  { const g = new THREE.Group(); g.position.set(LANDMARK[0], GROUND_Y, LANDMARK[1]); BG.add(g);
    for (let i = 0; i < 3; i++) { const a = i / 3 * 6.283; solid(geo.capsule, '#F4EFE6', g, { pos: [Math.sin(a) * 3.2, 30, Math.cos(a) * 3.2], scale: [1.4, 58, 1.4], rot: [Math.cos(a) * 0.1, 0, -Math.sin(a) * 0.1] }); }
    solid(geo.sphere, '#F4EFE6', g, { pos: [0, 44, 0], scale: [2.4, 4, 2.4] });
    solid(geo.sphere, '#F2A07A', g, { pos: [0, 66, 0], scale: [11, 3.2, 11] }); solid(geo.rcyl, '#F4EFE6', g, { pos: [0, 67.5, 0], scale: [7, 3, 7] });
    solid(geo.capsule, '#F2A07A', g, { pos: [0, 75, 0], scale: [0.6, 8, 0.6] });
    g.scale.setScalar(0.45); landmarks.needle = g; }

  /* ── utility poles with sagging wires: outer suburban ring only (ink lines) ── */
  setEl('poles');
  { const segs = [], cols = [], R = RINGS[1], n = Math.round(R * 2 * Math.PI / 14), ring = [];
    for (let i = 0; i < n; i++) { const a = i / n * 6.283, x = Math.sin(a) * (R + 4.6), z = Math.cos(a) * (R + 4.6);
      if (nearRiver(x, z, 10) || Math.hypot(x - DOWNTOWN[0], z - DOWNTOWN[1]) < 60) { ring.push(null); continue; }
      B(MG, 'capsule').add([x, GROUND_Y + 4.6, z], [0.24, 9, 0.24], '#9A9083'); B(MG, 'capsule').add([x, GROUND_Y + 8.6, z], [0.14, 2.4, 0.14], '#9A9083', [0, -a, Math.PI / 2]);
      ring.push([x, z]); }
    for (let i = 0; i < ring.length; i++) { const p = ring[i], q = ring[(i + 1) % ring.length]; if (!p || !q) continue;
      const nx = q[1] - p[1], nz = -(q[0] - p[0]), nl = Math.hypot(nx, nz) || 1;
      for (const [h, off] of [[8.8, -0.9], [8.8, 0.9], [7.9, 0]]) for (let s = 0; s < 4; s++) {
        const t0 = s / 4, t1 = (s + 1) / 4, sag = t => -Math.sin(Math.PI * t) * 0.7;
        segs.push(p[0] + (q[0] - p[0]) * t0 + nx / nl * off, GROUND_Y + h + sag(t0), p[1] + (q[1] - p[1]) * t0 + nz / nl * off,
                  p[0] + (q[0] - p[0]) * t1 + nx / nl * off, GROUND_Y + h + sag(t1), p[1] + (q[1] - p[1]) * t1 + nz / nl * off); cols.push(C.wire); } }
    inkLines(segs, cols, MG); }

  /* ── 60s rounded cars & buses on the ring roads ── */
  setEl('cars');
  for (const R of RINGS) for (let i = 0; i < (R > 100 ? 18 : 10); i++) {
    const a = rand() * 6.283, lane = rand() < 0.5 ? -1.5 : 1.5, x = Math.sin(a) * (R + lane), z = Math.cos(a) * (R + lane), ry = -a + Math.PI / 2;
    if (nearRiver(x, z, 10)) continue;
    if (rand() < 0.18) { B(MG, 'rboxSoft').add([x, GROUND_Y + 1.6, z], [2.6, 2.6, 8], '#F4EBDD', [0, ry + Math.PI / 2, 0]); B(MG, 'rbox').add([x, GROUND_Y + 1.1, z], [2.66, 0.5, 8.05], '#7FB7E0', [0, ry + Math.PI / 2, 0]); }
    else { const col = rand() < 0.2 ? '#F2D17B' : pick(C.car); B(MG, 'capsule').add([x, GROUND_Y + 0.75, z], [1.4, 2.4, 1.4], col, [Math.PI / 2, 0, ry]); B(MG, 'sphere').add([x, GROUND_Y + 1.35, z], [1.0, 0.75, 1.0], col); }
  }

  /* ── park on and around the dome (team test positions), street trees, lamps & benches ── */
  setEl('trees');
  const onDome = (a, d) => [Math.sin(a) * d, Math.cos(a) * d, domeY(d)];
  for (let i = 0; i < 22; i++) { const [x, z, y] = onDome(rand() * 6.283, 20 + rand() * 8); bushAt(FG, x, z, 0.8 + rand() * 0.7, y); }
  for (let i = 0; i < 7; i++) { const [x, z, y] = onDome((i + rand() * 0.7) / 7 * 6.283, 13 + rand() * 11); treeAt(FG, x, z, 1 + rand() * 0.5, y); }
  for (let i = 0; i < 26; i++) { const a = i / 26 * 6.283 + rand() * 0.1, r = DOME_FOOT + 3 + rand() * 6; treeAt(MG, Math.sin(a) * r, Math.cos(a) * r, 1.1 + rand() * 0.5, GROUND_Y); }
  for (const A of AVENUES) for (let r = DOME_FOOT + 14; r < 190; r += 12) for (const side of [-1, 1]) {
    const a = A + side * 4.6 / r, x = -Math.sin(a) * r, z = -Math.cos(a) * r; if (!nearRiver(x, z, 10)) treeAt(MG, x, z, 0.75, GROUND_Y); }
  setEl('street');
  for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283 + 0.3, r = DOME_FOOT + 1.6, x = Math.sin(a) * r, z = Math.cos(a) * r;
    B(MG, 'capsule').add([x, GROUND_Y + 1.8, z], [0.28, 3.2, 0.28], '#8C93A3'); B(MG, 'sphere').add([x, GROUND_Y + 3.9, z], 0.6, '#FFF3C2');
    const b = a + 0.3, bx = Math.sin(b) * r, bz = Math.cos(b) * r; B(MG, 'rbox').add([bx, GROUND_Y + 0.6, bz], [2.6, 0.35, 0.9], '#B98A6A', [0, -b, 0]); B(MG, 'rbox').add([bx, GROUND_Y + 1.1, bz], [2.6, 0.8, 0.2], '#B98A6A', [0, -b, 0]); }

  /* ── horizon: lavender triangle ridges + outlined clouds (whole, inside the camera range) ── */
  setEl('hills');
  for (let ring = 0; ring < 2; ring++) {
    const r = ring ? 330 : 300, n = ring ? 40 : 34, col = ring ? C.ridgeA : C.ridgeB;
    for (let i = 0; i < n; i++) { const a = i / n * 6.283 + rand() * 0.08, h = (ring ? 30 : 16) + rand() * (ring ? 34 : 20), w = h * (1.3 + rand() * 0.5);
      B(BG, 'cone').add([Math.sin(a) * r, GROUND_Y - 1, Math.cos(a) * r], [w, h, w * 0.6], col, [0, -a, 0]); }
  }
  setEl('clouds');
  const clouds = new THREE.Group(); SKY.add(clouds); landmarks._clouds = clouds;
  // camera sees up to ≈16° above the horizon: each cloud gets a random elevation between the ridges (≈7°) and 15°
  // minus its own height, so none is ever cut by the frame top. Kinds: big cumulus, medium clusters, small puffs.
  const elevTan = Math.tan(15 * Math.PI / 180);
  for (let i = 0; i < 34; i++) {
    const kind = rand(), big = kind < 0.2, small = kind > 0.62;
    const s = big ? between(9, 13) : small ? between(2.4, 4.6) : between(5, 8.5);       // puff radius
    const n = big ? 6 + Math.floor(rand() * 3) : small ? 2 + Math.floor(rand() * 2) : 4 + Math.floor(rand() * 2);
    const d = between(200, 290), a = rand() * 6.283;
    const topLimit = CAM_Y + elevTan * d - s * 1.7, low = CAM_Y + Math.tan(7 * Math.PI / 180) * d;
    const y = between(low, Math.max(low + 1, topLimit));
    const x = Math.sin(a) * d, z = Math.cos(a) * d, tx = Math.cos(a), tz = -Math.sin(a);
    for (let k = 0; k < n; k++) {
      const u = (k - (n - 1) / 2) / Math.max(1, (n - 1) / 2);               // −1 … 1 along the cloud
      const r = s * (1 - Math.abs(u) * 0.45) * between(0.8, 1.15);        // bigger in the middle
      const off = u * s * (n * 0.42) + between(-0.3, 0.3) * s;
      B(clouds, 'sphereLo').add([x + tx * off, y + r * 0.55 + between(0, 0.25) * s, z + tz * off + between(-0.3, 0.3) * s], [r, r * 0.82, r * 0.72], '#FFFFFF');   // flat bottoms line up
    }
  }


  /* ── FG plane (darkest): real objects close to the orbit, so every frame of the turn shows different ones ──
     - three big trees planted just outside the orbit (r ≈ 10): their trunks stay behind / beside the lens, their low
       crowns reach in over the camera path (r 5–9, 2.5–3.6 high) — the turn passes under them, leaves cross the top
     - a ring of rocks, stumps, bushes, tall grass and logs at r 4.6–6.2, never taller than the line to the characters' feet */
  setEl('foreground');
  { const leaf = ['#7CBF70', '#6FAE6A', '#86C27A'], dark = ['#5E9E62', '#4F8E5A'];
    for (const a of [0.35, 2.45, 4.35]) {
      const r = 10.2, x = Math.sin(a) * r, z = Math.cos(a) * r; api.tree(FG, x, domeY(r), z, 1.3, { leaf, trunk: '#B98A6A' });
      for (let i = 0; i < 4; i++) { const t = 0.25 + i * 0.19, d = r - t * 6, aa = a + between(-0.12, 0.12);          // limb reaching in
        B(FG, 'capsule').add([Math.sin(aa) * (d + 0.6), 3.0 - t * 0.6, Math.cos(aa) * (d + 0.6)], [0.16, 0.9, 0.16], '#A47A5E', [Math.PI / 2 - 0.25, -aa, 0]); }
      for (let i = 0; i < 26; i++) { const d = between(4.9, 9.2), aa = a + between(-0.32, 0.32) * (10 / d) * 0.5, y = between(2.55, 3.7), s = between(0.4, 0.75);
        B(FG, 'sphereLo').add([Math.sin(aa) * d, y, Math.cos(aa) * d], [s, s * 0.78, s], pick(y > 3.2 ? leaf : dark)); } }
    for (let i = 0; i < 30; i++) { const a = i / 30 * 6.283 + between(0, 0.15), d = between(4.6, 6.2), x = Math.sin(a) * d, z = Math.cos(a) * d, y = domeY(d), kind = rand();
      if (kind < 0.25) for (let k = 0; k < 3; k++) { const s = between(0.45, 0.85) * (1 - k * 0.2); B(FG, 'sphereLo').add([x + (k - 1) * 0.6 * Math.cos(a), y + s * 0.3, z - (k - 1) * 0.6 * Math.sin(a)], [s, s * 0.65, s * 0.85], pick(['#B4AFC8', '#A7A2BE', '#C1BCD3'])); }
      else if (kind < 0.5) api.bush(FG, x, y, z, between(0.65, 0.95), { leaf });
      else if (kind < 0.7) for (let k = -3; k <= 3; k++) B(FG, 'cone').add([x + k * 0.14 * Math.cos(a), y, z - k * 0.14 * Math.sin(a)], [0.1, between(0.6, 1.05), 0.1], pick(dark), [0, -a, k * 0.2]);
      else if (kind < 0.85) { B(FG, 'rcyl').add([x, y - 0.05, z], [0.42, between(0.5, 0.8), 0.42], '#B98A6A'); B(FG, 'rcyl').add([x, y + 0.6, z], [0.35, 0.05, 0.35], '#E8CDA6'); }
      else { const ry = a + Math.PI / 2 + between(-0.4, 0.4); B(FG, 'capsule').add([x, y + 0.32, z], [0.62, 1.4, 0.62], '#B98A6A', [Math.PI / 2, ry, 0]); } } }

  setLandmark(opts.landmark); setLight(api, opts.light);
}

function setLandmark(k) { for (const n of ['deco', 'needle']) landmarks[n].visible = n === k; }
function setLight(api, k) {
  const { THREE, scene, setSky, sun, hemi } = api;
  const L = {
    team:   { top: '#A9DCF5', hor: '#F4F4E2', sky: '#BFE3F7', fog: '#F2F1DE', light: '#FFFFFF', ground: '#E8E0C8', hemiI: 2.3, sunI: 0.8 },
    golden: { top: '#8CC8EE', hor: '#FFE3BE', sky: '#A8D2EE', fog: '#F7E3C4', light: '#FFE9C8', ground: '#C9AE8A', hemiI: 1.9, sunI: 1.5 },
    blue:   { top: '#6F86CC', hor: '#D8CDEB', sky: '#8C9FD6', fog: '#CFC9E6', light: '#DDE2FF', ground: '#8E8AAE', hemiI: 1.9, sunI: 0.7 },
  }[k];
  setSky(L.top, L.hor, L.hor, { baseHex: L.sky });
  hemi.color.set(L.light); hemi.groundColor.set(L.ground); hemi.intensity = L.hemiI;
  sun.color.set(L.light); sun.intensity = L.sunI; sun.position.set(-1, 2, 1.2);
  scene.fog = new THREE.Fog(L.fog, 90, 620);
}

function orbit(api, theta, k = 0) {
  const { camera } = api;
  camera.position.set(Math.sin(theta) * ORBIT_R, CAM_Y + Math.sin(k * 6.283) * 0.1, Math.cos(theta) * ORBIT_R);
  camera.lookAt(0, LOOK_Y, 0); camera.fov = 45; camera.near = 0.2; camera.far = 3000;
}

function turnInPlace(api, theta) {
  const { camera } = api, pitch = Math.atan2(CAM_Y - LOOK_Y, ORBIT_R);
  camera.position.set(0, CAM_Y, 0);
  camera.lookAt(-Math.sin(theta) * 10, CAM_Y - Math.tan(pitch) * 10, -Math.cos(theta) * 10);
  camera.fov = 45; camera.near = 0.2; camera.far = 3000;
}

const shots = [{
  name: '360° turn · Sc 3–4 (1960s)', dur: LOOP, era: 'e1960',
  update(k, ts, api) { orbit(api, k * Math.PI * 2, k); this.theta = k * Math.PI * 2; },
  // seamless 360° cylinder: the camera turns in place at the dome centre (same height, pitch and lens as the orbit),
  // so no slice can break; the orbit's depth comes back from the per-element layers (multiplane).
  pano: { label: 'seamless 360° cylinder strip', axis: 'x', from: 0, to: Math.PI * 2, reverse: true, pxPerUnit: (H, api) => api.focalPx(H), setup: (s, api) => turnInPlace(api, s) },
}];

startApp({
  id: 'bg1', title: 'BG 1 · World reveal — 360° turn (1960s)', fov: 45, shots, build,
  eras: ['e1960', 'e1945', 'base'],                // brief: Sc 3–4 1960s → Sc 5 1945 B&W → Sc 6 colour
  update(T, api) { if (landmarks._clouds) landmarks._clouds.rotation.y = T * 0.004; },
  staging: () => ({ center: [0, 0, 0], size: [2.6, 1.3, 1.4] }),
  layers: () => [5, 60, 240],                      // view distance: FG ring + overhang < 5 < MG dome & park < 60 < BG city < 240 < far ridges / clouds
  guiTitle: 'BG 1 · City',
  gui(f, api) {
    f.add(opts, 'landmark', { 'Art Deco spire tower': 'deco', 'Observation needle (1962)': 'needle' }).name('Landmark').onChange(setLandmark);
    f.add(opts, 'light', { 'Team test (soft day)': 'team', 'Golden hour': 'golden', 'Blue hour': 'blue' }).name('Light').onChange(v => setLight(api, v));
  },
});
