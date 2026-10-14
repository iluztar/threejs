import { startApp } from './core.js';
/* BG 5 · Hobby background · storyboard scenes 19–20 (full colour, painterly)
   A · the hobby room (recyclable shell, swappable hobby prop sets) · B · the run-cycle strip (hobby place → lake & mountains → golden field).
   Refs read: Chiikawa plain room (cream wall, one window, pink round table, dashes), Kirby's room (fireplace, blue star blanket, round table,
   cushion, beams, curtains with stars), Kiki's room (bookshelf, striped rug, door), Whisper of the Heart (workbench) & Totoro (frilly pink lamp),
   The Wind Rises (drafting desks), We Bare Bears cave/attic (beams, tools, boxes) + guitar stand, Doraemon Nobita's room (desk under the window,
   curtains, shelves), sewing room / Vuillard / van Ostade (study), Kirby pixel scenes (lavender mountains with pastel caps, flat bright lake).
   Background only: the hobby spot and the strip's run lane stay empty. */

const rand = (s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; })(2010);
const pick = a => a[Math.floor(rand() * a.length)];
const between = (a, b) => a + rand() * (b - a);
const STRIP_X = 2000, LOOP = 180, FAR_D = 5000;          // the strip lives far from the room; one loop = 180 units
const C = {
  wall: '#FBF3E2', floor: '#E7C49A', beam: '#C9935F', wood: '#D9A877', woodDark: '#B98A6A', curtain: '#5B86C9', star: '#FFE38A', glass: '#CFEFFF',
  pink: '#F4A9B8', purple: '#B9A0E6', blanket: '#6E9BE0', white: '#FFFDF6', yellow: '#FBE38A', stone: '#C9C4D6', fire: '#F6A86A',
  books: ['#E8836B', '#7FB7E0', '#F2D17B', '#9FD39A', '#C8A2D8', '#F4A9B8'], rug: ['#F7D2C4', '#CDE4F2', '#FBEAB0', '#CFE8D5', '#E6DCEB'],
  green: ['#A6D6A0', '#B8E2A9', '#93CF95'], trunk: '#E2C1A4', lake: '#7CC8EE', mount: ['#A9A6DA', '#B9B3E3', '#9C9ACF'], field: '#F2D17B', wheat: ['#E9B85C', '#F2C86A', '#DDA74E'], grass: '#A6D68A',
};
const S = { props: {} };
const opts = { hobby: 'drawing', window: 'square' };
const HOBBIES = ['drawing', 'music', 'games', 'plants', 'crafts'];

function build(api) {
  const { THREE, groups: G, geo, solid, B, fx, setEl, inkLines, state } = api;
  const { SKY, BG, MG, FG } = G;

  /* ═════ A · the room (10 × 8 × 5) ═════ */
  const room = new THREE.Group(); MG.add(room);
  setEl('walls');
  solid(geo.rbox, C.wall, room, { pos: [0, 2.5, -4.15], scale: [10.6, 5.4, 0.3] });
  solid(geo.rbox, C.wall, room, { pos: [-5.15, 2.5, 0], scale: [0.3, 5.4, 8.6] });
  solid(geo.rbox, C.wall, room, { pos: [5.15, 2.5, 0], scale: [0.3, 5.4, 8.6] });
  setEl('floor');
  solid(geo.rbox, C.floor, room, { pos: [0, -0.15, 0], scale: [10.6, 0.3, 8.6] });
  { const segs = [], cols = [];                                              // plank lines + Chiikawa dashes on walls / floor
    for (let x = -4.5; x <= 4.6; x += 1.15) { segs.push(x, 0.01, -4, x, 0.01, 4.3); cols.push('#C99B6E'); }
    for (let i = 0; i < 26; i++) { const x = between(-4.6, 4.6), y = between(0.6, 4.6); if (Math.abs(x) < 1.6 && y > 1.6 && y < 4.2) continue; segs.push(x, y, -3.99, x + between(0.3, 0.6), y, -3.99); cols.push('#C9B49A'); }
    for (let i = 0; i < 14; i++) { const z = between(-3.6, 3.6), y = between(0.6, 4.6); segs.push(-4.99, y, z, -4.99, y, z + between(0.3, 0.6)); cols.push('#C9B49A'); segs.push(4.99, y, -z, 4.99, y, -z + 0.45); cols.push('#C9B49A'); }
    inkLines(segs, cols, room); }
  setEl('beams');
  for (const z of [-3, -1, 1, 3]) solid(geo.rbox, C.beam, room, { pos: [0, 5.05, z], scale: [10.4, 0.45, 0.45] });
  solid(geo.rbox, C.beam, room, { pos: [0, 5.35, 0], scale: [10.6, 0.2, 8.6] });
  setEl('window');
  const win = { square: new THREE.Group(), round: new THREE.Group() }; room.add(win.square, win.round); S.win = win;
  solid(geo.rbox, C.glass, win.square, { pos: [0, 3.1, -3.98], scale: [2.6, 2.2, 0.06] }); solid(geo.rbox, C.wood, win.square, { pos: [0, 3.1, -3.95], scale: [0.14, 2.3, 0.12] }); solid(geo.rbox, C.wood, win.square, { pos: [0, 3.1, -3.95], scale: [2.7, 0.14, 0.12] });
  for (const [x, y, w, h] of [[0, 4.25, 2.8, 0.18], [0, 1.95, 2.8, 0.18], [-1.35, 3.1, 0.18, 2.4], [1.35, 3.1, 0.18, 2.4]]) solid(geo.rbox, C.wood, win.square, { pos: [x, y, -3.95], scale: [w, h, 0.16] });
  solid(geo.rcyl, C.glass, win.round, { pos: [0, 3.1, -4.0], scale: [1.2, 0.06, 1.2], rot: [Math.PI / 2, 0, 0] }); solid(geo.torus, C.wood, win.round, { pos: [0, 3.1, -3.95], scale: [1.25, 1.25, 1.5] });
  solid(geo.rbox, C.wood, win.round, { pos: [0, 3.1, -3.96], scale: [0.12, 2.4, 0.1] }); solid(geo.rbox, C.wood, win.round, { pos: [0, 3.1, -3.96], scale: [2.4, 0.12, 0.1] });
  for (const s of [-1, 1]) { solid(geo.rboxSoft, C.curtain, room, { pos: [s * 1.85, 3.0, -3.8], scale: [0.9, 2.9, 0.18] }); for (let k = 0; k < 5; k++) B(room, 'sphereLo').add([s * 1.85 + between(-0.3, 0.3), 1.9 + k * 0.5, -3.69], [0.09, 0.09, 0.03], C.star); }
  solid(geo.capsule, C.woodDark, room, { pos: [0, 4.55, -3.75], scale: [0.1, 4.2, 0.1], rot: [0, 0, Math.PI / 2] });
  setEl('furniture');
  // bed with puffy blue star blanket (Kirby)
  solid(geo.rbox, C.wood, room, { pos: [3.6, 0.35, -1.4], scale: [2.4, 0.7, 4.2] }); solid(geo.rbox, C.wood, room, { pos: [3.6, 0.9, -3.45], scale: [2.5, 1.8, 0.25] });
  solid(geo.rboxSoft, C.white, room, { pos: [3.6, 0.85, -1.4], scale: [2.2, 0.45, 4] }); solid(geo.rboxSoft, C.blanket, room, { pos: [3.6, 1.12, -0.6], scale: [2.3, 0.4, 2.6] });
  solid(geo.sphere, C.yellow, room, { pos: [3.6, 1.25, -2.9], scale: [0.85, 0.32, 0.5] });
  for (let k = 0; k < 9; k++) B(room, 'sphereLo').add([3.6 + between(-0.95, 0.95), 1.33, -0.6 + between(-1.1, 1.1)], [0.12, 0.03, 0.12], C.star);
  // low round pink table (Chiikawa) + floor cushion (Kirby)
  solid(geo.rcyl, C.pink, room, { pos: [-1.4, 0.55, 1.2], scale: [1.1, 0.16, 1.1] }); for (let k = 0; k < 3; k++) { const a = k / 3 * 6.283; solid(geo.capsule, C.pink, room, { pos: [-1.4 + Math.sin(a) * 0.7, 0.28, 1.2 + Math.cos(a) * 0.7], scale: [0.12, 0.45, 0.12] }); }
  solid(geo.rcyl, '#9FD39A', room, { pos: [-1.6, 0.72, 1.0], scale: [0.16, 0.3, 0.16] }); solid(geo.rcyl, '#9FD39A', room, { pos: [-1.1, 0.72, 1.4], scale: [0.16, 0.3, 0.16] });
  solid(geo.sphere, C.purple, room, { pos: [0.6, 0.22, 2.2], scale: [0.8, 0.25, 0.7] });
  // desk under the window + frilly pink lamp (Totoro / Whisper)
  solid(geo.rbox, C.wood, room, { pos: [0, 1.15, -3.3], scale: [3.2, 0.14, 1.2] }); for (const s of [-1, 1]) solid(geo.rbox, C.wood, room, { pos: [s * 1.45, 0.55, -3.3], scale: [0.18, 1.1, 1.0] });
  solid(geo.rcyl, C.woodDark, room, { pos: [1.15, 1.22, -3.35], scale: [0.18, 0.5, 0.18] }); solid(geo.cone, C.pink, room, { pos: [1.15, 1.6, -3.35], scale: [0.5, 0.5, 0.5] }); solid(geo.torus, C.pink, room, { pos: [1.15, 1.62, -3.35], scale: [0.52, 0.52, 0.8], rot: [Math.PI / 2, 0, 0] });
  // bookshelf with rounded books (Kiki)
  solid(geo.rbox, C.wood, room, { pos: [-4.55, 1.6, -1.6], scale: [0.9, 3.2, 2.4] });
  for (let sh = 0; sh < 4; sh++) { solid(geo.rbox, C.woodDark, room, { pos: [-4.1, 0.25 + sh * 0.8, -1.6], scale: [0.1, 0.08, 2.3] }); let z = -2.7;
    while (z < -0.6) { const w = between(0.12, 0.24), h = between(0.45, 0.65); B(room, 'rboxSoft').add([-4.15, 0.3 + sh * 0.8 + h / 2, z + w / 2], [0.5, h, w], pick(C.books)); z += w + 0.02; } }
  // striped pastel rug (Kiki)
  for (let k = 0; k < 7; k++) solid(geo.rbox, C.rug[k % C.rug.length], room, { pos: [-0.6, 0.02, 0.2 + (k - 3) * 0.42], scale: [4.4, 0.04, 0.42] });
  // fireplace corner (Kirby)
  solid(geo.rbox, C.stone, room, { pos: [-4.3, 1.1, 2.6], scale: [1.4, 2.2, 2.4] }); solid(geo.rbox, '#5E5560', room, { pos: [-3.62, 0.6, 2.6], scale: [0.1, 1, 1.3] });
  solid(geo.capsule, C.woodDark, room, { pos: [-3.7, 0.25, 2.5], scale: [0.18, 0.7, 0.18], rot: [Math.PI / 2, 0.4, 0] }); solid(geo.sphere, C.fire, room, { pos: [-3.68, 0.48, 2.6], scale: [0.25, 0.32, 0.3] });
  solid(geo.rbox, C.wood, room, { pos: [-4.15, 2.28, 2.6], scale: [1.7, 0.16, 2.6] }); solid(geo.rbox, C.stone, room, { pos: [-4.5, 3.8, 2.6], scale: [0.9, 2.9, 1.2] });
  setEl('plants');
  for (const [x, z, s] of [[4.4, 2.8, 1], [-2.8, -3.4, 0.8], [2.2, -3.5, 0.7]]) { solid(geo.rcyl, '#D9805E', room, { pos: [x, 0, z], scale: [0.35 * s, 0.6 * s, 0.35 * s] });
    for (let k = 0; k < 4; k++) B(room, 'sphere').add([x + between(-0.25, 0.25) * s, (0.8 + k * 0.18) * s, z + between(-0.25, 0.25) * s], 0.3 * s, pick(C.green)); }
  /* FG plane (darkest): objects at the open front edge of the room (z 3.4–4.2), cut by the frame as the camera pans:
     a big potted plant front-left, a hanging plant from the beam front-left, a floor plant + stool front-right (frames the hero shot too) */
  setEl('foreground');
  { const leaf = ['#5E9E62', '#6FAE6A', '#4F8E5A'];
    const plant = (x, z, pot, h, n) => { solid(geo.rcyl, pot, room, { pos: [x, 0, z], scale: [0.36, 0.55, 0.36] });
      for (let i = 0; i < n; i++) { const a = i / n * 6.283 + between(0, 0.5), t = between(0.35, 0.9);
        B(room, 'sphereLo').add([x + Math.sin(a) * 0.16 * h, 0.5 + h * 0.48, z + Math.cos(a) * 0.16 * h], [0.15, h * 0.5, 0.05], pick(leaf), [Math.cos(a) * t * 0.6, a, -Math.sin(a) * t * 0.6]); } };   // leaves grow from the pot
    plant(-2.75, 3.85, '#C9785E', 1.5, 12); plant(3.35, 3.95, '#E9C49A', 1.2, 10);
    solid(geo.rcyl, C.woodDark, room, { pos: [-1.6, 0, 4.1], scale: [0.3, 0.55, 0.3] }); solid(geo.rcyl, C.pink, room, { pos: [-1.6, 0.55, 4.1], scale: [0.36, 0.1, 0.36] });
    B(room, 'capsule').add([-2.2, 4.65, 3.6], [0.02, 0.55, 0.02], C.woodDark); solid(geo.rcyl, '#D9A877', room, { pos: [-2.2, 3.85, 3.6], scale: [0.26, 0.3, 0.26] });
    for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283, L = between(0.5, 0.95); B(room, 'sphereLo').add([-2.2 + Math.sin(a) * 0.3, 3.95 - L * 0.45, 3.6 + Math.cos(a) * 0.3], [0.1, L * 0.5, 0.05], pick(leaf), [Math.cos(a) * 0.35, a, -Math.sin(a) * 0.35]); } }
  setEl('wall-decor');
  solid(geo.rcyl, C.white, room, { pos: [-2.9, 3.8, -3.98], scale: [0.45, 0.08, 0.45], rot: [Math.PI / 2, 0, 0] });                       // clock
  solid(geo.rbox, '#F7D2C4', room, { pos: [4.98, 3.2, 0.8], scale: [0.06, 1.1, 1.4] }); solid(geo.rbox, '#CDE4F2', room, { pos: [4.98, 3.4, -1.2], scale: [0.06, 0.8, 0.8] });   // pictures

  /* hobby prop sets (one visible at a time; each is its own element) */
  const prop = name => { setEl('props-' + name); return room; };
  { const g = prop('drawing');                                            // easel, canvas, pencil cups, paper stacks
    for (const [dx, rz] of [[-0.45, 0.12], [0.45, -0.12]]) solid(geo.capsule, C.wood, g, { pos: [1.9 + dx, 1.1, 0.4], scale: [0.08, 1.05, 0.08], rot: [0, 0, rz] });
    solid(geo.capsule, C.wood, g, { pos: [1.9, 1.0, 0.75], scale: [0.08, 1.0, 0.08], rot: [-0.35, 0, 0] }); solid(geo.rbox, C.white, g, { pos: [1.9, 1.55, 0.36], scale: [1.2, 0.9, 0.05], rot: [-0.12, 0, 0] });
    for (let k = 0; k < 3; k++) solid(geo.rbox, '#FFF8EA', g, { pos: [-0.5 + k * 0.05, 1.24 + k * 0.03, -3.25], scale: [0.9, 0.02, 0.65] });
    solid(geo.rcyl, '#7FB7E0', g, { pos: [-1.1, 1.22, -3.3], scale: [0.14, 0.3, 0.14] }); for (let k = 0; k < 5; k++) solid(geo.capsule, pick(C.books), g, { pos: [-1.1 + between(-0.06, 0.06), 1.6, -3.3 + between(-0.06, 0.06)], scale: [0.03, 0.4, 0.03], rot: [between(-0.2, 0.2), 0, between(-0.2, 0.2)] }); }
  { const g = prop('music');                                              // guitars on a stand, keyboard, headphones
    solid(geo.rbox, '#8C8579', g, { pos: [1.9, 0.1, 0.6], scale: [1.6, 0.12, 0.5] });
    for (const [dx, col] of [[-0.45, '#E8836B'], [0.45, '#F2D17B']]) { solid(geo.sphere, col, g, { pos: [1.9 + dx, 0.55, 0.6], scale: [0.36, 0.42, 0.12] }); solid(geo.sphere, col, g, { pos: [1.9 + dx, 0.95, 0.6], scale: [0.27, 0.3, 0.12] }); solid(geo.capsule, C.woodDark, g, { pos: [1.9 + dx, 1.5, 0.6], scale: [0.07, 1, 0.07] }); }
    solid(geo.rbox, '#3E4452', g, { pos: [0, 1.28, -3.25], scale: [1.8, 0.12, 0.5] }); solid(geo.rbox, C.white, g, { pos: [0, 1.35, -3.15], scale: [1.6, 0.04, 0.22] });
    solid(geo.torus, '#B9A0E6', g, { pos: [-1.3, 1.4, -3.2], scale: [0.25, 0.25, 0.8] }); }
  { const g = prop('games');                                              // round TV, console, cushions, controllers
    solid(geo.rboxSoft, '#F3F0E6', g, { pos: [1.9, 0.75, -1.6], scale: [1.5, 1.1, 0.9] }); solid(geo.rboxSoft, '#7FB7E0', g, { pos: [1.9, 0.78, -1.14], scale: [1.15, 0.8, 0.04] });
    solid(geo.rbox, '#B98A6A', g, { pos: [1.9, 0.1, -1.6], scale: [1.8, 0.2, 1.1] }); solid(geo.rboxSoft, '#9FD39A', g, { pos: [1.4, 0.26, -1.0], scale: [0.5, 0.12, 0.3] });
    for (const x of [0.2, 1.0]) solid(geo.sphere, pick(['#F4A9B8', '#FBEAB0']), g, { pos: [x, 0.2, 0.8], scale: [0.55, 0.2, 0.5] });
    solid(geo.capsule, '#F3F0E6', g, { pos: [0.5, 0.06, 0.2], scale: [0.18, 0.4, 0.18], rot: [0, 0, Math.PI / 2] }); }
  { const g = prop('plants');                                             // extra pots, hanging plant, watering can
    for (let k = 0; k < 5; k++) { const x = 1.2 + k * 0.5, s = between(0.5, 0.8); solid(geo.rcyl, pick(['#D9805E', '#E9C49A', '#9FCBEA']), g, { pos: [x, 0, 0.6], scale: [0.25 * s, 0.45 * s, 0.25 * s] }); for (let j = 0; j < 3; j++) B(g, 'sphere').add([x + between(-0.15, 0.15), 0.55 * s + j * 0.12, 0.6 + between(-0.15, 0.15)], 0.2 * s, pick(C.green)); }
    solid(geo.rcyl, '#7FB7E0', g, { pos: [2.6, 0, 1.4], scale: [0.25, 0.4, 0.25] }); solid(geo.capsule, '#7FB7E0', g, { pos: [2.95, 0.35, 1.4], scale: [0.06, 0.5, 0.06], rot: [0, 0, -0.9] }); }
  { const g = prop('crafts');                                             // sewing table, yarn balls, spools
    solid(geo.rbox, C.wood, g, { pos: [1.9, 0.8, 0.5], scale: [1.6, 0.12, 0.9] }); for (const s of [-1, 1]) solid(geo.rbox, C.wood, g, { pos: [1.9 + s * 0.7, 0.4, 0.5], scale: [0.12, 0.8, 0.8] });
    solid(geo.rboxSoft, '#F3F0E6', g, { pos: [1.8, 1.1, 0.5], scale: [0.8, 0.45, 0.35] }); solid(geo.rboxSoft, '#F3F0E6', g, { pos: [2.1, 1.35, 0.5], scale: [0.25, 0.35, 0.3] });
    for (let k = 0; k < 4; k++) solid(geo.sphere, pick(['#F4A9B8', '#7FB7E0', '#FBEAB0', '#B9A0E6']), g, { pos: [0.6 + k * 0.35, 0.16, 1.8 + (k % 2) * 0.3], scale: 0.17 });
    for (let k = 0; k < 3; k++) solid(geo.rcyl, pick(C.books), g, { pos: [1.4 + k * 0.2, 0.86, 0.75], scale: [0.06, 0.16, 0.06] }); }

  /* ═════ B · the run-cycle strip (side view, loops every 180 units) ═════ */
  const strip = new THREE.Group(); strip.position.x = STRIP_X; BG.add(strip); S.strip = strip;
  for (const off of [-LOOP, 0, LOOP, 2 * LOOP]) {                     // copies so the loop is seamless in both directions
    const g = new THREE.Group(); g.position.x = off; strip.add(g);
    const r = (s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; })(99);
    const bt = (a, b) => a + r() * (b - a), pk = a => a[Math.floor(r() * a.length)];
    setEl('strip-ground');
    solid(geo.rbox, C.grass, g, { pos: [LOOP / 2, -1, 0], scale: [LOOP + 0.5, 2, 30] });
    solid(geo.rbox, C.field, g, { pos: [150, -0.98, -2], scale: [56, 2, 22] });
    setEl('strip-lake');
    solid(geo.rbox, C.lake, g, { pos: [92, -0.96, -12], scale: [54, 2, 12] });
    setEl('strip-mountains');
    api.range(g, { x: [64, 118], z: [-30, -26], count: 4, h: [6.5, 11], col: C.mount, snow: '#F4F0FA', snowAbove: 8.5, depth: 0.35, seed: 501 });   // 4 massifs behind the lake (side view: modelled small)
    setEl('strip-place');                                               // the hobby place: a little studio front
    solid(geo.rbox, '#F7D2C4', g, { pos: [26, 3, -6], scale: [16, 6, 6] }); solid(geo.rbox, '#C9785E', g, { pos: [26, 6.4, -6], scale: [17, 0.8, 6.6] });
    solid(geo.rboxSoft, '#7FB7E0', g, { pos: [26, 5.2, -2.9], scale: [6, 1, 0.3] }); for (const x of [20, 32]) solid(geo.rbox, C.glass, g, { pos: [x, 2.8, -2.95], scale: [3, 2.4, 0.1] });
    solid(geo.rbox, C.woodDark, g, { pos: [26, 1.6, -2.95], scale: [1.6, 3.2, 0.1] }); solid(geo.rbox, C.wood, g, { pos: [37, 0.5, -2], scale: [3, 0.25, 0.9] });
    setEl('strip-trees');
    for (let i = 0; i < 22; i++) { const x = bt(0, LOOP), z = bt(-14, -3), s = bt(1, 1.8); if (x > 60 && x < 122 && z < -6) continue;
      api.tree(g, x, 0, z, s, { leaf: C.green, trunk: C.trunk, far: true, seed: 3000 + i, kind: api.h01(x, z) < 0.25 ? 'pine' : api.h01(x, z) > 0.8 ? 'tall' : 'round' }); }
    setEl('strip-field');
    for (let i = 0; i < 90; i++) { const x = bt(124, 178), z = bt(-12, 6); for (let k = -1; k <= 1; k++) B(g, 'cone').add([x + k * 0.2, 0, z], [0.14, bt(0.7, 1.2), 0.14], pk(C.wheat), [0, 0, k * 0.25]); }
    setEl('strip-fences');
    for (let x = 2; x < LOOP; x += 3) { if (x > 64 && x < 120) continue; B(g, 'capsule').add([x, 0.6, 3], [0.18, 1, 0.18], C.wood); B(g, 'rbox').add([x + 1.5, 0.75, 3], [3, 0.16, 0.1], C.wood); }
    setEl('strip-flowers');
    for (let i = 0; i < 70; i++) { const x = bt(0, LOOP), z = bt(-2, 8); if (x > 124) continue; B(g, 'sphereLo').add([x, 0.3, z], [0.22, 0.12, 0.22], pk(['#F6B9CF', '#FFF3B0', '#FFFFFF', '#C9B8F0'])); B(g, 'capsule').add([x, 0.12, z], [0.05, 0.24, 0.05], '#7CBF70'); }
    setEl('strip-foreground');                                         // FG plane: bushes, rocks and tall grass on the front edge, cut by the frame bottom
    for (let x = 1; x < LOOP; x += bt(3, 6)) { const z = bt(16, 18), kind = r();   // in front of the ground edge (z 15)
      if (kind < 0.45) for (let k = 0; k < 3; k++) B(g, 'sphere').add([x + (k - 1) * 0.9, -1.5 + bt(0, 0.3), z], [bt(0.9, 1.3), bt(0.8, 1.1), 0.8], pk(['#5E9E62', '#6FAE6A', '#4F8E5A']));
      else if (kind < 0.65) B(g, 'sphere').add([x, -1.4, z], [bt(0.8, 1.2), bt(0.6, 0.8), 0.8], pk(['#8E89A8', '#9C97B4']));
      else for (let k = -2; k <= 2; k++) B(g, 'cone').add([x + k * 0.22, -0.9, z], [0.12, bt(0.9, 1.5), 0.12], pk(['#5E9E62', '#6FAE6A']), [0, 0, k * 0.22]); }
    setEl('strip-hills');                                              // the land goes on behind: rolling hills + a far, pale range (same in every loop copy)
    api.range(g, { x: [6, LOOP - 6], z: [-50, -46], count: 7, h: [3.5, 6], col: ['#B9DCA4', '#C6E2B2'], hill: true, depth: 0.3, seed: 551 });
    api.range(g, { x: [8, LOOP - 8], z: [-80, -74], count: 6, h: [8, 13], col: ['#CFCBEA', '#D8D4EE'], snow: '#F4F0FA', snowAbove: 11, depth: 0.3, seed: 552 });
    setEl('strip-clouds');
    for (let i = 0; i < 9; i++) { const x = bt(0, LOOP), y = bt(11.5, 14), s = bt(0.8, 1.6), n = 3 + Math.floor(r() * 4); for (let k = 0; k < n; k++) B(g, 'sphereLo').add([x + (k - n / 2) * s * 0.9, y + (k % 2) * s * 0.3, -40], [s, s * 0.8, s * 0.6], '#FFFFFF'); }
  }
  setHobby(api, opts.hobby); setWindow(opts.window);
}
function setHobby(api, h) { for (const n of HOBBIES) api.state.elVis['props-' + n] = n === h; }
function setWindow(w) { if (S.win) { S.win.square.visible = w === 'square'; S.win.round.visible = w === 'round'; } }

const look = (api, p, t, mm = 28, near = 0.05, far = 3000) => { const { camera } = api; camera.position.set(...p); camera.up.set(0, 1, 0); camera.lookAt(...t); camera.fov = 2 * Math.atan(12 / mm) * 180 / Math.PI; camera.near = near; camera.far = far; };
const ROOM_P = [0, 2.3, 7.6], ROOM_T = [0, 1.7, -2];
/** strip camera: far away with a narrow lens = flat side view, so the long strip has no smear and loops exactly */
const stripCam = (api, x) => { const fov = 2 * Math.atan(8.5 / FAR_D) * 180 / Math.PI; const { camera } = api; camera.position.set(STRIP_X + x, 6.6, FAR_D); camera.up.set(0, 1, 0); camera.lookAt(STRIP_X + x, 6.5, 0); camera.fov = fov; camera.near = FAR_D - 200; camera.far = FAR_D + 400; };

const shots = [
  { name: 'Room establish (eye level)', dur: 5, era: 'colour', update(k, ts, api) { const a = api.lerp(-0.08, 0.08, api.ease(k)); look(api, [ROOM_P[0] + Math.sin(a) * 2, ROOM_P[1], ROOM_P[2]], ROOM_T, 28); },
    pano: { label: '110° pan across the room', axis: 'x', from: -0.96, to: 0.96, reverse: false, pxPerUnit: (H, api) => api.focalPx(H),
      setup: (s, api) => look(api, ROOM_P, [ROOM_P[0] + Math.sin(s) * 10, ROOM_P[1] - 0.6, ROOM_P[2] - Math.cos(s) * 10], 28) } },
  { name: 'Room hero · hobby spot', dur: 4, era: 'colour', update(k, ts, api) { const e = api.ease(k); look(api, [api.lerp(3.4, 3.0, e), 1.7, api.lerp(5.6, 4.8, e)], [1.6, 1.0, 0.2], 34); } },
  { name: 'Sc 19–20 · run strip (side view, loops)', dur: 12, era: 'colour', update(k, ts, api) { stripCam(api, k * LOOP); },
    pano: { label: 'one full loop of the run strip', axis: 'x', from: 0, to: LOOP, reverse: false, pxPerUnit: (H, api) => api.focalPx(H) / FAR_D, setup: (s, api) => stripCam(api, s) } },
];

startApp({
  id: 'bg5', title: 'BG 5 · Hobby background (full colour)', fov: 40, shots, build,
  layers: (api, shot) => shot === shots[2] ? [FAR_D - 12, FAR_D + 8, FAR_D + 22] : [4.6, 10, 30],
  eras: ['colour'],
  update(T, api, shot) { const { hemi, sun, setSky, scene } = api;
    setSky('#8FCBF0', '#FFF1D9', '#FFF1D9', { baseHex: '#A9D6F2' });
    hemi.color.set('#FFF6E6'); hemi.groundColor.set('#D9B38A'); hemi.intensity = 2.1; sun.color.set('#FFE6C2'); sun.intensity = 1.2; sun.position.set(0.4, 1, 0.7);
    scene.fog = null; },
  staging: (api, shot) => shot === shots[2] ? { center: [STRIP_X + api.camera.position.x - STRIP_X, 0, 0], size: [3, 2.2, 2] } : { center: [1.6, 0, 0.6], size: [1.6, 1.2, 1.2] },
  guiTitle: 'BG 5 · Hobby',
  gui(f, api, refresh) {
    f.add(opts, 'hobby', { 'Drawing': 'drawing', 'Music': 'music', 'Games': 'games', 'Plants': 'plants', 'Crafts / sewing': 'crafts' }).name('Hobby prop set').onChange(h => { setHobby(api, h); refresh(); });
    f.add(opts, 'window', { 'Square (Chiikawa)': 'square', 'Round (Kirby)': 'round' }).name('Window').onChange(setWindow);
  },
});
