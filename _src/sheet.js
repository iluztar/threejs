import { startApp } from './core.js';
/* SHAPE SHEET · test only (not one of the six BGs). Rounded plates, chunky low-poly rocks and tree variants
   side by side, so the shape direction can be judged before anything touches the BGs. Kawaii: soft bevels, round crowns. */

const rand = (s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; })(77);
const LEAF = { green: ['#93CF95', '#A6D6A0', '#86C984'], teal: ['#7FC9B7', '#94D8C6', '#6DB8A6'], pine: ['#7FB98A', '#6FAE80', '#8CC496'], autumn: ['#F2B45A', '#F5C77A', '#E89A4A'] };
const TOP = '#E9D7A8', SIDE = '#C9AE7C', ROCK = ['#C9C4D6', '#BDB8CC', '#D6D1E2'];

function build(api) {
  const { THREE, groups: G, geo, B, setEl } = api;
  const { BG } = G;
  // geometry for this sheet only: a low-poly rock (dodecahedron, flat facets) — added to the shared kit, not to core.js
  geo.rock = new THREE.DodecahedronGeometry(1, 0);

  const plate = (parent, x, z, w, d, h = 1.2) => {                  // bevelled plate: soft side, lighter top rim
    setEl('ground');
    B(parent, 'rboxSoft').add([x, -h / 2, z], [w, h, d], SIDE);
    B(parent, 'rboxSoft').add([x, 0.04, z], [w * 0.94, 0.5, d * 0.94], TOP);
  };
  const rocks = (parent, x, z, w, d, n, r) => { setEl('rocks');
    for (let i = 0; i < n; i++) { const a = r(), sc = 0.35 + r() * 0.6;
      B(parent, 'rock').add([x + (r() - 0.5) * w, sc * 0.4, z + (r() - 0.5) * d], [sc, sc * 0.75, sc * 0.9], ROCK[Math.floor(r() * 3)], [r() * 3, r() * 3, r()]); } };
  const trees = (parent, x, z, w, d, n, r) => { setEl('trees');
    const kinds = ['round', 'tall', 'pine'], pal = [LEAF.green, LEAF.teal, LEAF.autumn, LEAF.pine];
    for (let i = 0; i < n; i++) { const kind = kinds[Math.floor(r() * kinds.length)], s = 0.55 + r() * 0.5;
      api.tree(parent, x + (r() - 0.5) * w, 0.04, z + (r() - 0.5) * d, s, { kind, leaf: kind === 'pine' ? LEAF.pine : pal[Math.floor(r() * 3)], trunk: '#C99B72', seed: 100 + i * 17 + (x | 0) }); } };

  // three plates with different mixes: each BG would pick its own mix from the same parts
  const parts = [
    { x: -14, rocks: 6, trees: 4 },
    { x: 0, rocks: 2, trees: 7 },
    { x: 14, rocks: 9, trees: 2 },
  ];
  for (const p of parts) {
    const g = new THREE.Group(); BG.add(g);
    plate(g, p.x, 0, 11, 9);
    rocks(g, p.x, 0, 9, 7, p.rocks, rand);
    trees(g, p.x, 0, 9, 7, p.trees, rand);
  }
}

startApp({
  id: 'sheet', title: 'Shape sheet · test', fov: 40, build,
  shots: [{ name: 'Shape sheet · test', dur: 1, era: 'colour',
    update(k, ts, api) { api.camera.position.set(0, 24, 46); api.camera.up.set(0, 1, 0); api.camera.lookAt(0, 0, 0); api.camera.fov = 36; } }],
  layers: () => null,
  guiTitle: 'Shape sheet',
});
