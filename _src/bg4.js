import { startApp } from './core.js';
/* BG 4 · Mirrored background · storyboard scenes 11–18 — MOUNTAIN LAKE
   Brief eras: Sc 11 red wave → 1970s · Sc 12–14 mirrored platform, B&W close-up (1945 values) · Sc 15 rotating red wave → 1980s ·
   Sc 16 wave → 1990s (wide) · Sc 17–18 4-box mirrored BG, a colour per side (full colour).
   Look (client update): a still mountain lake that mirrors everything — pastel lavender mountains with snow caps (Kirby pixel ref),
   round green shore hills, round trees and pines, rocks, lily pads; refs: Norway / Kanuti lakes (mirrored clouds), Uyuni stillness.
   The characters stand on a small round wooden dock in the middle of the lake. The reflection is a real mirrored copy
   (darker, a little bluer) so every export has it; the dock stays calm and empty. */

const rand = (s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; })(1975);
const between = (a, b) => a + rand() * (b - a);
const FOLD_Z = 90;
const C = {
  cloud: ['#FFFFFF', '#FDFBF4', '#F4F8FF'],
  mtnFar: ['#B7BEE0', '#AFB6DC', '#C2C3E4'], mtnNear: ['#A3A9D6', '#9FA7D2', '#ABA6D4'], snow: '#F8F9FF',
  hill: ['#A6D6A0', '#9BD09A', '#B3DCA5'], tree: ['#86C984', '#93CF95', '#7CBF80', '#A2D69A'], pine: ['#5FA57C', '#6AAE84', '#579B74'], trunk: '#D9B48F',
  rock: ['#D9D5E6', '#CFCBE0', '#E2DEEC'], deck: '#EBCB9F', deckRim: '#D9AE7E', post: '#C99B72', lily: '#8CCB86', flower: ['#FFB3C7', '#FFFFFF', '#FFD98A'], reed: '#7FB77A',
};
const S = {}; const opts = { fold: 0 };

function build(api) {
  const { THREE, groups: G, geo, solid, B, fx, setEl, inkLines, hexToRgb, rgbToHex } = api;
  const { SKY, BG, MG, FG } = G;
  const mixHex = (h, t, k) => { const a = hexToRgb(h), b = hexToRgb(t); return rgbToHex(a.map((v, i) => v + (b[i] - v) * k)); };
  const darken = h => { const c = hexToRgb(h), t = [0.36, 0.45, 0.66]; return rgbToHex(c.map((v, i) => (v + (t[i] - v) * 0.2) * 0.88)); };

  /** the world above the water; built twice (the second time mirrored, darker, as one "reflection" element) */
  function world(parent, mirror) {
    const el = n => setEl(mirror ? 'reflection' : n), col = h => mirror ? darken(h) : h;
    const colSoft = h => mirror ? mixHex(h, '#CFE3F3', 0.35) : h;            // white clouds reflect light, not grey
    const r0 = (s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; })(77);   // same layout both times
    const bt = (a, b) => a + r0() * (b - a), pk = a => a[Math.floor(r0() * a.length)];
    /** angle around the lake: most things sit behind the dock (−z, where every shot looks), fewer at the sides */
    const aroundBack = () => Math.PI + (r0() + r0() + r0() - 1.5) * 1.6;

    /* FG plane (darkest): reed islets and shore rocks standing in the water close to the cameras, mirrored like the rest.
       Ring at r 16–20 in front of the dock, kept under the line to the dock (≤ 2.6 high); taller reeds + a rock with a pine
       at the sides of the wide shot; two clumps the platform dolly passes. */
    el('foreground');
    const reeds = (x, z, h, n = 7) => { for (let i = 0; i < n; i++) { const px = x + bt(-0.7, 0.7), pz = z + bt(-0.5, 0.5), k = bt(0.6, 1);
      B(parent, 'capsule').add([px, h * k * 0.5 - 0.3, pz], [0.07, h * k * 0.5, 0.07], col('#6FAE6A'), [bt(-0.1, 0.1), 0, bt(-0.12, 0.12)]);
      if (r0() < 0.5) B(parent, 'capsule').add([px, h * k - 0.25, pz], [0.13, 0.28, 0.13], col('#9A7258')); } };
    const rocks = (x, z, s) => { for (let i = 0; i < 3; i++) { const w = s * bt(0.6, 1) * (1 - i * 0.2); B(parent, 'sphereLo').add([x + (i - 1) * s * 0.7, w * 0.15, z + bt(-0.3, 0.3)], [w, w * 0.55, w * 0.8], col(pk(C.rock))); } };
    for (let a = -0.75; a <= 0.75; a += bt(0.13, 0.22)) { const r = bt(16, 20), x = Math.sin(a) * r, z = Math.cos(a) * r, k = r0();
      if (k < 0.5) reeds(x, z, bt(1.6, 2.6)); else if (k < 0.8) { rocks(x, z, bt(0.8, 1.3)); reeds(x + 0.8, z, bt(1.2, 2), 4); }
      else for (let i = 0; i < 4; i++) B(parent, 'disc', false).add([x + bt(-1.2, 1.2), 0.03, z + bt(-0.8, 0.8)], [bt(0.5, 0.8), 1, bt(0.5, 0.8)], col(C.lily), [0, bt(0, 6.28), 0]); }
    for (const sd of [-1, 1]) { const x = sd * bt(4.5, 7.5), z = bt(32, 35); reeds(x, z, bt(3.4, 4.4), 10); rocks(x - sd * 1.6, z + 0.6, bt(1.2, 1.6));
      api.tree(parent, x - sd * 1.6, 0.35, z + 0.6, 0.75, { leaf: C.pine, trunk: C.trunk, kind: 'pine', col, seed: 1300 + sd }); }
    reeds(4.2, 12, 2.2); rocks(4.9, 12.4, 0.8); reeds(-1.2, 13.8, 1.8, 5);

    el('dock');                                                                // round wooden dock, top at y ≈ 0.8 (characters)
    solid(geo.rcyl, col(C.deck), parent, { pos: [0, -0.2, 0], scale: [5.6, 1, 5.6] });
    solid(geo.torus, col(C.deckRim), parent, { pos: [0, 0.78, 0], scale: [5.5, 5.5, 2.2], rot: [Math.PI / 2, 0, 0] });
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; solid(geo.capsule, col(C.post), parent, { pos: [Math.sin(a) * 5.7, 0.5, Math.cos(a) * 5.7], scale: [0.45, 1.3, 0.45] }); }
    for (let i = 0; i < 4; i++) { const z = 7.4 + i * 2.1; solid(geo.rbox, col(C.deck), parent, { pos: [0, 0.62, z], scale: [2.6, 0.28, 1.8] });   // little walkway toward the camera, level with the deck
      for (const sx of [-1.05, 1.05]) B(parent, 'capsule').add([sx, 0.15, z], [0.22, 0.65, 0.22], col(C.post)); }                                    // on posts standing in the water

    el('mountains');   // behind the lake: one far snow range + one nearer, lower range (few massifs each, not a wall of cones)
    api.range(parent, { arc: [Math.PI, 4.0], d: [520, 700], count: 9, h: [120, 185], col: C.mtnFar, snow: C.snow, snowAbove: 130, y0: -1, map: col, seed: 401 });
    api.range(parent, { arc: [Math.PI + 0.2, 3.4], d: [330, 420], count: 7, h: [50, 90], col: C.mtnNear, snow: C.snow, snowAbove: 78, y0: -1, map: col, seed: 402 });

    el('hills');       // a few long, low shore hills (was 30 half-balls)
    api.range(parent, { arc: [Math.PI, 3.6], d: [175, 235], count: 9, h: [9, 17], col: C.hill, y0: -0.5, hill: true, map: col, seed: 403 });

    el('trees');
    for (let i = 0; i < 80; i++) { const a = aroundBack(), d = bt(150, 215), x = Math.sin(a) * d, z = Math.cos(a) * d, s = bt(4, 7.5);
      if (r0() < 0.45) {                                                       // round tree (Chiikawa / Kirby)
        api.tree(parent, x, 0, z, s * 0.48, { leaf: C.tree, trunk: C.trunk, col, far: 2, seed: 1000 + i });
      } else {                                                                  // soft pine: three stacked rounded cones
        api.tree(parent, x, 0, z, s * 0.48, { leaf: C.pine, trunk: C.trunk, kind: 'pine', col, far: 2, seed: 1100 + i });
      } }

    el('rocks');
    for (let i = 0; i < 22; i++) { const a = aroundBack(), d = bt(140, 175), r = bt(2, 4.5);             // shore rocks
      B(parent, 'sphereLo').add([Math.sin(a) * d, r * 0.15, Math.cos(a) * d], [r * 1.3, r * 0.75, r], col(pk(C.rock))); }
    for (let i = 0; i < 6; i++) { const a = Math.PI + bt(-1.2, 1.2), d = bt(28, 60), r = bt(0.8, 1.8);   // a few rocks poking out of the lake
      B(parent, 'sphereLo').add([Math.sin(a) * d, 0, Math.cos(a) * d - 6], [r * 1.4, r * 0.6, r], col(pk(C.rock))); }

    el('clouds');
    for (let i = 0; i < 40; i++) {                                            // banks over the mountains + higher puffs, flat bottoms
      const a = aroundBack(), d = bt(560, 900), high = r0() < 0.4, s = high ? bt(10, 18) : bt(18, 34), n = high ? 3 + Math.floor(r0() * 2) : 5 + Math.floor(r0() * 3);
      const y = high ? bt(190, 260) : bt(120, 185), x = Math.sin(a) * d, z = Math.cos(a) * d, tx = Math.cos(a), tz = -Math.sin(a);
      for (let k = 0; k < n; k++) { const u = (k - (n - 1) / 2) / Math.max(1, (n - 1) / 2), rr = s * (1 - Math.abs(u) * 0.4) * bt(0.8, 1.15), off = u * s * n * 0.42;
        B(parent, 'sphereLo').add([x + tx * off, y + rr * 0.55 + bt(0, 0.3) * s, z + tz * off], [rr, rr * 0.8, rr * 0.75], colSoft(pk(C.cloud))); } }
  }

  /* sky: clear Kirby blue → pale horizon */
  api.setSky('#7FC4EE', '#EAF5FB', '#8FC6EA', { baseHex: '#A9D6F2' });   // below the horizon = the sky mirrored in the lake (pale → blue)
  world(MG, false);
  const pivot = new THREE.Group(); pivot.position.set(0, 0, -FOLD_Z); BG.add(pivot); S.pivot = pivot;
  const refl = new THREE.Group(); refl.position.set(0, 0, FOLD_Z); refl.scale.y = -1; pivot.add(refl);
  world(refl, true);

  /* lily pads, flowers and reeds sit ON the water (not mirrored) */
  setEl('lily-pads');
  for (let i = 0; i < 34; i++) { const a = between(0, 6.28), d = between(9, 40), x = Math.sin(a) * d, z = Math.cos(a) * d * 0.8 - 4, r = between(0.6, 1.4);
    if (Math.abs(x) < 2.2 && z > 5) continue;                                 // keep the walkway clear
    B(FG, 'disc', false).add([x, 0.03, z], [r, 1, r], C.lily, [0, between(0, 6.28), 0]);
    if (rand() < 0.3) B(FG, 'sphereLo').add([x + r * 0.3, 0.25, z], [0.35, 0.25, 0.35], C.flower[Math.floor(rand() * 3)]); }
  setEl('reeds');
  { const segs = [], cols = [];
    for (let g = 0; g < 14; g++) { const a = Math.PI + between(-1.3, 1.3), d = between(135, 160), cx = Math.sin(a) * d, cz = Math.cos(a) * d;
      for (let k = 0; k < 7; k++) { const x = cx + between(-3, 3), z = cz + between(-2, 2), h = between(2.5, 5), lean = between(-0.5, 0.5);
        segs.push(x, 0, z, x + lean, h, z); cols.push(C.reed); } }
    inkLines(segs, cols, FG); }

  /* water film: soft ripples (colour render); ripple rings around the dock as ink */
  setEl('water');
  S.waterMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uTime: { value: 0 } },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: 'uniform float uTime; varying vec3 vW; void main(){ float r = length(vW.xz); float ring = smoothstep(0.85, 1.0, sin(r * 1.4 - uTime * 2.0)) * smoothstep(40.0, 8.0, r) * 0.22; float a = 0.14 + ring; gl_FragColor = vec4(pow(mix(vec3(0.5, 0.66, 0.84), vec3(1.0), ring * 3.0), vec3(2.2)), a); }' });
  fx(new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000).rotateX(-Math.PI / 2), S.waterMat), FG, { occluder: false }).renderOrder = 1;
  { const segs = [], cols = [];
    for (const [cx, cz, rr] of [[0, 0, 7.4], [0, 0, 9.6], [0, 0, 12.4], [14, -18, 2.4], [-18, -8, 2], [22, -26, 3.2], [-26, -22, 2.6]]) for (let k = 0; k < 40; k++) { if (k % 5 === 4) continue; const a0 = k / 40 * 6.283, a1 = (k + 1) / 40 * 6.283;
      segs.push(cx + Math.cos(a0) * rr, 0.02, cz + Math.sin(a0) * rr, cx + Math.cos(a1) * rr, 0.02, cz + Math.sin(a1) * rr); cols.push('#BFD7EA'); }
    inkLines(segs, cols, FG); }
  setFold(opts.fold);
}
function setFold(v) { if (S.pivot) S.pivot.rotation.x = -v * Math.PI / 2; }

const look = (api, p, t, mm = 28) => { const { camera } = api; camera.position.set(...p); camera.up.set(0, 1, 0); camera.lookAt(...t); camera.fov = 2 * Math.atan(12 / mm) * 180 / Math.PI; camera.near = 0.1; camera.far = 4000; };
/** long panorama of a shot: the camera turns in place (seamless) ±75° around its view to the platform */
const panFrom = (p, t, mm, label) => { const yaw0 = Math.atan2(t[0] - p[0], -(t[2] - p[2])), pitch = Math.atan2(t[1] - p[1], Math.hypot(t[0] - p[0], t[2] - p[2]));
  return { label, axis: 'x', from: yaw0 - 1.3, to: yaw0 + 1.3, reverse: false, pxPerUnit: (H, api) => api.focalPx(H),
    setup: (s, api) => look(api, p, [p[0] + Math.sin(s) * 10, p[1] + Math.tan(pitch) * 10, p[2] - Math.cos(s) * 10], mm) }; };

const shots = [
  { name: 'Sc 11 · wide, red wave → 1970s', dur: 5, era: 'e1960', trans: { type: 'wave', to: 'e1970', at: [0.15, 0.8] },
    update(k, ts, api) { const a = api.lerp(-0.25, 0.25, api.ease(k)); look(api, [Math.sin(a) * 42, 7, Math.cos(a) * 42], [0, 3, 0], 26); },
    pano: panFrom([0, 7, 42], [0, 3, 0], 26, '150° pan · wide') },
  { name: 'Sc 12–14 · platform → B&W close-up', dur: 5, era: 'e1970', trans: { type: 'fade', to: 'e1945', at: [0.6, 0.95] },
    update(k, ts, api) { const e = api.ease(k); look(api, [api.lerp(3, 1, e), api.lerp(3.6, 2.4, e), api.lerp(18, 8, e)], [0, 1.6, 0], api.lerp(32, 50, e)); },
    pano: panFrom([3, 3.6, 18], [0, 1.6, 0], 32, '150° pan · platform') },
  { name: 'Sc 15 · rotating red wave → 1980s', dur: 5, era: 'e1945', trans: { type: 'radial', to: 'e1980', at: [0.1, 0.9] },
    update(k, ts, api) { const a = api.lerp(0.4, -0.2, k); look(api, [Math.sin(a) * 24, 4.5, Math.cos(a) * 24], [0, 3.5, 0], 30); },
    pano: panFrom([0, 4.5, 24], [0, 3.5, 0], 30, '150° pan · mid') },
  { name: 'Sc 16 · high wide, wave → 1990s', dur: 5, era: 'e1980', trans: { type: 'wave', to: 'e1990', at: [0.15, 0.85] },
    update(k, ts, api) { const e = api.ease(k); look(api, [0, api.lerp(26, 32, e), api.lerp(66, 74, e)], [0, 0, -10], 24); },
    pano: panFrom([0, 30, 70], [0, 0, -10], 24, '150° pan · high wide') },
  { name: 'Sc 17–18 · 4-box, colour per side', dur: 6, era: 'e1990', trans: { type: 'fade', to: 'colour', at: [0, 0.3] },
    update(k, ts, api) { const e = api.ease(k); look(api, [0, api.lerp(5, 3.6, e), api.lerp(30, 20, e)], [0, 2.5, 0], 28);
      api.fxU.four = 1; api.fxU.quad = [[1.06, 1.0, 0.84], [1.06, 0.9, 0.98], [0.9, 1.06, 0.95], [0.88, 0.97, 1.1]]; },
    pano: panFrom([0, 5, 30], [0, 2.5, 0], 28, '150° pan · source for the 4-box') },
];

startApp({
  id: 'bg4', title: 'BG 4 · Mirrored background — mountain lake', fov: 40, shots, build,
  layers: api => { const d = api.camera.position.length(); return [Math.max(4, d * 0.35), d * 1.6, d * 6]; },
  eras: ['e1960', 'e1970', 'e1945', 'e1980', 'e1990', 'colour'],
  update(T, api) { if (S.waterMat) S.waterMat.uniforms.uTime.value = T; const { hemi, sun, scene, THREE } = api; hemi.intensity = 2.2; hemi.color.set('#FFFFFF'); hemi.groundColor.set('#D8D2EE'); sun.intensity = 0.9; sun.position.set(-0.6, 1, 0.8);
    if (!scene.fog) scene.fog = new THREE.Fog('#E6F0FA', 260, 1500); },
  vanishingPoint: api => new api.THREE.Vector3(0, 0, -2000),
  staging: () => ({ center: [0, 0.85, 0], size: [2.6, 1.3, 1.4] }),
  guiTitle: 'BG 4 · Lake',
  gui(f) { f.add(opts, 'fold', 0, 1, 0.01).name('Fold the mirror world (Inception)').onChange(setFold); },
});
