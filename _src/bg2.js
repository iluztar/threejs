import { startApp } from './core.js';
/* BG 2 · Earth zoom out + Globe 360° · storyboard scenes 7–9
   Brief eras: Sc 7–8 base kawaii → Sc 9 red wave → 1950s (first colour features, gouache storybook globe).
   Refs read: NASA top-of-atmosphere / Earthrise / Blue Marble / ISS limb (proportion & light only), Porco Rosso golden clouds,
   Kirby Forgotten Land world map (city island from above) + Everbay Coast map (islands in clean flat colour),
   Doraemon Earth & Moon (2019), Eames Powers of Ten, NASA SVS turntables (clouds, day/night).
   Background only: the characters' jump is followed by an invisible point. */

const rand = (s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; })(1958);
const pick = a => a[Math.floor(rand() * a.length)];
const between = (a, b) => a + rand() * (b - a);

const R = 1000;                                   // globe radius
const CITY_LAT = 40.2, CITY_LON = -72.4;          // temperate east coast (city island just off the coast)
const DOME_TOP = 6.5;                             // characters' spot (local frame)
const GLOBE_DIST = 3300;
const C = {
  sea: '#6EC3D9', seaDeep: '#4FA8C8', land: '#93CF7E', land2: '#7DBF6E', forest: '#5FAE62', sand: '#EED9A4', desert: '#E9C98A', ice: '#F4F6FA', beach: '#F3E3B5',
  dome: '#F6EFD4', grass: '#A6D6A0', green: ['#A6D6A0', '#B8E2A9', '#93CF95'], trunk: '#E2C1A4',
  brick: ['#E7A99A', '#D99A86', '#E9B8A2'], stone: ['#EBD9B4', '#F1E4CC', '#E6DCC6'], wood: ['#F1E4CC', '#F4EBDD', '#E3EEDD'], roof: ['#7F8DA6', '#C9785E', '#79A98F'],
  pane: '#8FA9CC', tank: ['#C99B72', '#B88A64'], moon: '#F1EBD6', moonDark: '#DCD3BC',
};

/* ── continent outlines (lon, lat), coarse on purpose: blurred + thresholded into soft, rounded coasts ── */
const LAND = [
  [[-168,66],[-156,71],[-140,70],[-125,70],[-110,73],[-95,72],[-82,70],[-70,67],[-62,60],[-56,52],[-60,47],[-66,44],[-70,42],[-74,40.6],[-76,37],[-76,35],[-80,32],[-81,27],[-80,25.2],[-82,26],[-84,30],[-89,30],[-94,29.5],[-97,27],[-97,22],[-95,18.5],[-91,18.5],[-88,21],[-87,16],[-83,15],[-83,10],[-79,9],[-77,8],[-80,7],[-85,10],[-88,13],[-92,15],[-96,16],[-105,20],[-106,23],[-110,24],[-112,29],[-114,31],[-117,32.5],[-120,34.5],[-123,38],[-124,42],[-124,47],[-127,50],[-131,54],[-135,58],[-142,60],[-150,60],[-152,58],[-158,57],[-165,55],[-163,60],[-166,63]],
  [[-52,60],[-43,60],[-35,65],[-22,70],[-20,77],[-30,82],[-45,83],[-62,81],[-70,78],[-62,75],[-55,70]],
  [[-79,9],[-75,11],[-72,12],[-64,10.5],[-60,8],[-52,4],[-50,0],[-44,-2],[-35,-5],[-35,-9],[-39,-14],[-40,-22],[-44,-23],[-48,-26],[-53,-34],[-57,-37],[-62,-39],[-65,-42],[-66,-47],[-69,-51],[-68,-55],[-73,-53],[-74,-47],[-73,-40],[-72,-30],[-71,-20],[-75,-15],[-79,-8],[-81,-4],[-80,0],[-78,3]],
  [[-10,36],[-9,39],[-9,43],[-2,43.5],[-1,46],[-4,48],[2,51],[5,53],[8,54],[8,57],[5,59],[5,62],[10,64],[14,67],[19,70],[25,71],[30,70],[40,68],[44,66],[41,64],[36,65],[33,61],[30,60],[22,60],[22,57],[21,55],[14,54],[12,55],[10,54],[11,58],[18,59],[22,64],[25,65],[20,63],[17,61],[18,57],[24,55],[28,46],[29,41],[26,40],[23,40],[22,37],[20,40],[16,38],[15.6,40],[12,44],[13,45.5],[10,44],[7,43.5],[3,43],[3,41.5],[0,39],[-2,37],[-5,36]],
  [[-17,15],[-17,21],[-13,28],[-9,32],[-6,35.8],[1,36.5],[10,37],[11,33],[20,31],[30,31.5],[32,31],[34,28],[39,21],[43,13],[51,12],[48,8],[42,-1],[40,-10],[40,-16],[35,-24],[32,-29],[27,-34],[20,-35],[18,-32],[15,-27],[12,-18],[13,-10],[9,-1],[9,4],[5,5],[-2,5],[-8,4.5],[-13,8],[-15,11]],
  [[28,41],[34,36],[36,36],[35,33],[34.5,31],[39,28],[43,17],[45,13],[52,16],[56,18],[59,22],[56,25],[52,24],[50,26],[48,30],[52,28],[57,26],[62,25],[67,24],[69,22],[73,18],[75,12],[77,8],[80,10],[80,15],[83,18],[87,21],[90,22],[92,21],[94,17],[98,16],[98,10],[100,6],[103,1.3],[104,3],[103,10],[106,10],[109,12],[108,16],[106,19],[108,21.5],[111,21],[117,23],[120,27],[122,30],[121,32],[119,35],[121,37],[118,38],[121,39],[122,40],[125,40],[127,38],[129,35],[129,38],[128,40],[130,42],[133,43],[136,45],[140,48],[141,52],[138,54],[135,55],[140,58],[143,59],[150,59],[155,59],[162,62],[165,65],[170,66],[178,64.5],[180,66],[180,69],[170,70],[160,70],[150,72],[140,73],[130,71],[120,73],[110,74],[105,77],[95,76],[85,74],[78,72],[70,73],[67,70],[60,69],[55,68],[45,68],[44,66],[41,64],[40,66],[33,69],[31,65],[33,61],[30,60],[28,56],[32,52],[40,48],[45,42],[40,41],[36,41.5],[30,41]],
  [[114,-22],[114,-26],[115,-34],[118,-35],[123,-34],[129,-31.5],[132,-32],[136,-35],[138,-34],[141,-38],[146,-39],[150,-37.5],[153,-31],[153,-25],[150,-22],[146,-19],[145,-15],[142,-11],[141,-17],[138,-16],[136,-12],[132,-11],[130,-13],[127,-14],[123,-17],[121,-19]],
  [[129.5,31],[131,31.5],[132,33.5],[135,33.5],[137,34.5],[140,35],[141,38],[142,40],[141.5,41.5],[140,40],[139.5,38],[137,37],[136,36],[133,35.5],[130.5,34]],
  [[141,42],[143.5,42],[145.5,43.3],[145,44.5],[142,45.5],[141,44]],
  [[-5.5,50],[1.5,51],[1.7,52.8],[-0.2,54],[-1.6,55.6],[-3,58.5],[-5,58.5],[-6,56.5],[-5,54.8],[-3,54],[-4.5,53],[-4.5,51.7]],
  [[-10,51.6],[-6,52],[-6,55],[-8,55],[-10,54]],
  [[95,5.5],[98,4],[104,-2],[106,-6],[102,-5.5],[100,-1],[97,2]], [[105,-6],[110,-7],[115,-8.5],[106,-7.6]],
  [[109,1],[111,-3],[116,-4],[118,1],[119,6],[117,7],[114,4.5],[111,2.5]], [[119,-2],[121,-5],[123,-1],[125,1.5],[121,1]],
  [[131,-1.5],[138,-1.5],[145,-4],[150,-6],[147,-8],[141,-9],[137,-7],[133,-4]],
  [[166,-46],[171,-44],[174,-41],[178,-37.5],[175,-36.5],[172,-34.5],[173,-39],[170,-42],[167,-45.5]],
  [[44,-25],[47,-25],[50,-15.5],[49,-12],[44,-16.5]],
  [[-180,-71],[-150,-75],[-120,-73],[-100,-72],[-75,-70],[-60,-64],[-58,-66],[-40,-77],[-20,-73],[0,-70],[30,-69],[60,-67],[90,-66],[120,-66],[150,-68],[170,-71],[180,-71],[180,-90],[-180,-90]],
  [[-25,64],[-13,64.5],[-14,66],[-22,66.5]], [[-82,22],[-77,20],[-74,20],[-78,22.6],[-84,22]], [[-74,18.5],[-68.5,18.5],[-70,19.9],[-74,19.8]],
  [[120,22],[122,25],[121.5,23]], [[118,8],[122,7],[126,7],[124,13],[121,18.5],[120,15]],
  [[80,6],[82,7],[81.5,9.6],[80,9]], [[47,46],[52,47],[54,41],[52,37],[49,38],[47,43]],
];
const DESERTS = [[-16, 15, 35, 30], [36, 16, 57, 30], [120, -31, 142, -20], [90, 38, 113, 46], [-118, 30, -103, 37], [-75, -28, -68, -18], [55, 36, 68, 44], [12, -27, 20, -18]];

const ll = (lat, lon, r = 1) => { const la = lat * Math.PI / 180, lo = lon * Math.PI / 180; return [r * Math.cos(la) * Math.sin(lo), r * Math.sin(la), r * Math.cos(la) * Math.cos(lo)]; };

const W = 4096, H = 2048;
function paintGlobe(THREE) {
  const px = (lon, lat) => [(lon + 180) / 360 * W, (90 - lat) / 180 * H];
  const mask = document.createElement('canvas'); mask.width = W; mask.height = H; const m = mask.getContext('2d');
  m.fillStyle = '#000'; m.fillRect(0, 0, W, H); m.fillStyle = '#fff';
  for (const poly of LAND) { m.beginPath(); const pts = poly.map(p => px(p[0], p[1]));
    pts.forEach((p, i) => { const q = pts[(i + 1) % pts.length], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2; i ? m.quadraticCurveTo(p[0], p[1], mx, my) : m.moveTo(mx, my); });
    m.closePath(); m.fill(); }
  const soft = document.createElement('canvas'); soft.width = W; soft.height = H; const s = soft.getContext('2d');
  s.filter = 'blur(10px)'; s.drawImage(mask, 0, 0); s.filter = 'none';
  const md = s.getImageData(0, 0, W, H), land = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) land[i] = md.data[i * 4] > 120 ? 1 : 0;
  // colour map (land only, alpha = land) + mask texture
  const col = document.createElement('canvas'); col.width = W; col.height = H; const c = col.getContext('2d');
  const img = c.createImageData(W, H), d = img.data;
  const rgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const L1 = rgb(C.land), L2 = rgb(C.land2), FO = rgb(C.forest), DS = rgb(C.desert), IC = rgb(C.ice), BE = rgb(C.beach);
  const noise = (x, y) => Math.sin(x * 0.013 + Math.sin(y * 0.021) * 2) * Math.cos(y * 0.017 + Math.sin(x * 0.009) * 2);
  for (let y = 0; y < H; y++) { const lat = 90 - y / H * 180;
    for (let x = 0; x < W; x++) { const i = y * W + x; if (!land[i]) { d[i * 4 + 3] = 0; continue; }
      const lon = x / W * 360 - 180; let p = noise(x, y) > 0.35 ? FO : noise(x + 999, y) > 0 ? L1 : L2;
      if (DESERTS.some(([a, b, cc, dd]) => lon > a && lon < cc && lat > b && lat < dd) && noise(x * 0.5, y * 0.5) > -0.6) p = DS;
      if (Math.abs(lat) > 66 || lat < -60) p = IC;
      let coast = false; for (const [dx, dy] of [[5, 0], [-5, 0], [0, 5], [0, -5]]) { const xx = (x + dx + W) % W, yy = Math.min(H - 1, Math.max(0, y + dy)); if (!land[yy * W + xx]) { coast = true; break; } }
      if (coast && Math.abs(lat) < 60) p = BE;
      d[i * 4] = p[0]; d[i * 4 + 1] = p[1]; d[i * 4 + 2] = p[2]; d[i * 4 + 3] = 255; } }
  c.putImageData(img, 0, 0);
  const landTex = new THREE.CanvasTexture(col); landTex.colorSpace = THREE.SRGBColorSpace; landTex.anisotropy = 8;
  const mk = document.createElement('canvas'); mk.width = W; mk.height = H; const mc = mk.getContext('2d'); const mi = mc.createImageData(W, H);
  for (let i = 0; i < W * H; i++) { const v = land[i] * 255; mi.data[i * 4] = mi.data[i * 4 + 1] = mi.data[i * 4 + 2] = v; mi.data[i * 4 + 3] = 255; }
  mc.putImageData(mi, 0, 0); const maskTex = new THREE.CanvasTexture(mk);
  const samples = []; for (let k = 0; k < 900; k++) { const x = Math.floor(rand() * W), y = Math.floor(H * 0.12 + rand() * H * 0.68); if (land[y * W + x]) samples.push([90 - y / H * 180, x / W * 360 - 180]); }
  return { landTex, maskTex, samples };
}

const S = {};                                    // scene handles
const opts = { light: 'auto' };

function build(api) {
  const { THREE, groups: G, geo, solid, B, fx, setEl, inkLines } = api;
  const { SKY, BG, MG, FG } = G;
  geo.box = new THREE.BoxGeometry(1, 1, 1);
  const roofShape = new THREE.Shape([new THREE.Vector2(-0.5, 0), new THREE.Vector2(0.5, 0), new THREE.Vector2(0, 0.5)]);
  geo.roof = new THREE.ExtrudeGeometry(roofShape, { depth: 1, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2 }).translate(0, 0, -0.5);

  const spin = new THREE.Group(); BG.add(spin); S.spin = spin;
  const { landTex, maskTex, samples } = paintGlobe(THREE);

  /* sea + land (separate elements), coastlines become lines through an id material that reads the land mask */
  setEl('sea');
  fx(new THREE.Mesh(new THREE.SphereGeometry(R, 256, 128), new THREE.MeshToonMaterial({ color: C.sea })), spin, { baseHex: C.sea, normalPass: true });
  setEl('land');
  const coastMat = new THREE.ShaderMaterial({ uniforms: { tMask: { value: maskTex } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform sampler2D tMask; varying vec2 vUv; void main(){ if (texture2D(tMask, vUv).r < 0.5) discard; gl_FragColor = vec4(0.9, 0.35, 0.2, 1.0); }' });
  const landMesh = fx(new THREE.Mesh(new THREE.SphereGeometry(R * 1.0015, 256, 128), new THREE.MeshToonMaterial({ map: landTex, alphaTest: 0.5, transparent: false })), spin,
    { baseMat: new THREE.MeshBasicMaterial({ map: landTex, alphaTest: 0.5 }), normalMat: coastMat });
  landMesh.rotation.y = -Math.PI / 2;                 // three's sphere uv seam → lon −180 at −z… align with ll()
  spin.children[0].rotation.y = -Math.PI / 2;

  /* night lights: warm dots that only glow on the dark side */
  setEl('night-lights');
  { const pos = []; for (const [la, lo] of samples) pos.push(...ll(la, lo, R * 1.004));
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const mat = new THREE.ShaderMaterial({ uniforms: { uSun: { value: new THREE.Vector3(1, 0.3, 0.4).normalize() }, uSize: { value: 3 } }, transparent: true, depthWrite: false,
      vertexShader: 'uniform vec3 uSun; uniform float uSize; varying float vA; void main(){ vec3 n = normalize(mat3(modelMatrix) * position); vA = smoothstep(0.05, -0.25, dot(n, uSun)); gl_PointSize = uSize; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5 || vA < 0.02) discard; gl_FragColor = vec4(pow(vec3(1.0, 0.86, 0.55), vec3(2.2)), vA * smoothstep(0.5, 0.2, d)); }' });
    S.nightMat = mat; fx(new THREE.Points(g, mat), spin, { occluder: false }); }

  /* clouds on their own shell, turning a little faster */
  setEl('clouds');
  const cloudSpin = new THREE.Group(); BG.add(cloudSpin); S.cloudSpin = cloudSpin;
  { const up = new THREE.Vector3(0, 1, 0), q = new THREE.Quaternion(), e = new THREE.Euler(), cityN = new THREE.Vector3(...ll(CITY_LAT, CITY_LON));
    for (let i = 0; i < 170; i++) {
      const lat = (rand() < 0.5 ? 1 : -1) * Math.pow(rand(), 0.8) * 70, lon = rand() * 360 - 180, n = new THREE.Vector3(...ll(lat, lon));
      if (n.angleTo(cityN) < 0.07) continue;                                   // keep the city clear
      const big = rand() < 0.3, s = big ? between(40, 70) : between(16, 34), k = big ? 5 : 3, t = new THREE.Vector3().crossVectors(n, up).normalize();
      for (let j = 0; j < k; j++) { const off = t.clone().multiplyScalar((j - (k - 1) / 2) * s * 0.9).add(n.clone().cross(t).multiplyScalar(between(-0.4, 0.4) * s));
        const p = n.clone().multiplyScalar(R + 22 + j % 2 * 4).add(off).normalize().multiplyScalar(R + 22 + j % 2 * 4);
        q.setFromUnitVectors(up, p.clone().normalize()); e.setFromQuaternion(q);
        const r = s * (1 - Math.abs(j - (k - 1) / 2) / k * 0.6); B(cloudSpin, 'sphereLo').add(p.toArray(), [r, r * 0.32, r * 0.8], '#FFFFFF', [e.x, e.y, e.z]); }
    } }

  /* atmosphere rim (colour render only) */
  setEl('atmosphere');
  fx(new THREE.Mesh(new THREE.SphereGeometry(R * 1.06, 96, 48), new THREE.ShaderMaterial({ side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 3.0); gl_FragColor = vec4(pow(vec3(0.55, 0.8, 1.0), vec3(2.2)) * f * 1.4, f); }' })), BG, { occluder: false });

  /* stars + moon */
  setEl('stars');
  { const pos = []; for (let i = 0; i < 1400; i++) { const v = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize().multiplyScalar(14000); pos.push(v.x, v.y, v.z); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    S.stars = fx(new THREE.Points(g, new THREE.PointsMaterial({ color: '#FFF6DA', size: 2.4, sizeAttenuation: false })), SKY, { occluder: false }); }
  setEl('moon');
  { const g = new THREE.Group(); g.position.set(-3000, 900, -2600); BG.add(g); S.moon = g;
    solid(geo.sphere, C.moon, g, { scale: 190 });
    for (let i = 0; i < 9; i++) { const n = new THREE.Vector3(rand() - 0.5, rand() - 0.2, rand() + 0.2).normalize(), r = between(14, 34);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n), e = new THREE.Euler().setFromQuaternion(q);
      solid(geo.sphere, C.moonDark, g, { pos: n.multiplyScalar(186).toArray(), scale: [r, 6, r], rot: [e.x, e.y, e.z] }); } }

  /* ── the city island in a local frame on the globe (y = local up) ── */
  const island = new THREE.Group(); spin.add(island); S.island = island;
  const n = new THREE.Vector3(...ll(CITY_LAT, CITY_LON)); island.position.copy(n).multiplyScalar(R);
  { const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n); island.quaternion.copy(q);
    // turn the local frame so local +z points east-ish (out to sea, away from the coast)
    const east = new THREE.Vector3(0, 1, 0).cross(n).normalize(), localZ = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
    const ang = Math.atan2(new THREE.Vector3().crossVectors(localZ, east).dot(n), localZ.dot(east)); island.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ang)); }
  const LG = 1.5;                                              // land top (local)
  setEl('island');
  solid(geo.sphere, C.beach, island, { pos: [0, -2.6, 0], scale: [50, 4.6, 50] });
  solid(geo.sphere, C.grass, island, { pos: [0, -1.6, 0], scale: [45.5, 3.5, 45.5] });
  // harbour pier + boats
  for (let i = 0; i < 3; i++) solid(geo.rbox, '#EDE4D4', island, { pos: [-20 + i * 14, 0.2, 49], scale: [3, 0.8, 12] });
  setEl('boats');
  for (let i = 0; i < 6; i++) { const x = -26 + i * 9.5, z = 58 + rand() * 10; 
    solid(geo.capsule, pick(['#E8836B', '#7FB7E0', '#F3F0E6']), island, { pos: [x, 0.1, z], scale: [1.6, 4, 1.6], rot: [Math.PI / 2, 0, 0] });
    solid(geo.rbox, '#F7F2E6', island, { pos: [x, 1.3, z - 0.5], scale: [1.4, 1.2, 2] }); }
  // dome (characters jump from its top toward +z)
  setEl('dome');
  const DR = 22, capA = Math.acos((DR - (DOME_TOP - LG)) / DR);
  solid(new THREE.SphereGeometry(DR, 96, 32, 0, Math.PI * 2, 0, capA), C.dome, island, { pos: [0, DOME_TOP - DR, 0] });
  const domeY = d => Math.sqrt(Math.max(0, DR * DR - d * d)) - DR + DOME_TOP;
  const footR = Math.sqrt(DR * DR - (DR - (DOME_TOP - LG)) ** 2);
  { const segs = [], cols = [];
    for (let i = 0; i < 180; i++) { const a = rand() * 6.283, d = 2 + Math.sqrt(rand()) * (footR - 3), x = Math.sin(a) * d, z = Math.cos(a) * d, L = 0.4 + rand() * 0.4;
      if (rand() < 0.6) { segs.push(x, domeY(d) + 0.03, z, x + L, domeY(Math.hypot(x + L, z)) + 0.03, z); cols.push('#8A6B64'); }
      else for (const t of [[-0.1, -0.18, 0.28], [0, 0, 0.36], [0.1, 0.18, 0.28]]) { segs.push(x + t[0], domeY(d) + 0.03, z, x + t[1], domeY(d) + 0.03 + t[2], z); cols.push('#6FBF73'); } }
    inkLines(segs, cols, island); }
  setEl('rocks'); for (let i = 0; i < 26; i++) { const a = rand() * 6.283, d = 3 + rand() * (footR - 4), s = 0.35 + rand() * 0.5; B(island, 'sphereLo').add([Math.sin(a) * d, domeY(d) + s * 0.25, Math.cos(a) * d], [s, s * 0.6, s * 0.85], pick(['#C9C4D6', '#BDB8CC'])); }
  setEl('grass'); for (let i = 0; i < 120; i++) { const a = rand() * 6.283, d = 2.5 + rand() * (footR - 3), x = Math.sin(a) * d, z = Math.cos(a) * d, s = 0.3 + rand() * 0.3;
    for (let k = -2; k <= 2; k++) B(island, 'cone').add([x + k * s * 0.22, domeY(d) - 0.02, z], [s * 0.18, s * (1.1 - Math.abs(k) * 0.2), s * 0.18], pick(['#8FCB80', '#7CBF70']), [0, 0, k * 0.28]); }
  setEl('flowers'); for (let i = 0; i < 70; i++) { const a = rand() * 6.283, d = 2.5 + rand() * (footR - 3), x = Math.sin(a) * d, z = Math.cos(a) * d, y = domeY(d);
    B(island, 'capsule').add([x, y + 0.2, z], [0.06, 0.4, 0.06], '#7CBF70'); B(island, 'sphereLo').add([x, y + 0.48, z], [0.18, 0.1, 0.18], pick(['#F6B9CF', '#FFF3B0', '#FFFFFF'])); }
  // 1950s city ring on the island
  const tree = (g, x, z, s, y0) => { B(g, 'capsule').add([x, y0 + 0.95 * s, z], [0.5 * s, 1.0 * s, 0.5 * s], C.trunk); B(g, 'sphere').add([x, y0 + 2.7 * s, z], 1.35 * s, C.green[0]); B(g, 'sphere').add([x + s, y0 + 2.3 * s, z + 0.3 * s], 1.05 * s, C.green[1]); B(g, 'sphere').add([x - s, y0 + 2.35 * s, z], 1.05 * s, C.green[2]); };
  const windows = (g, x, z, w, d, y0, rows, rowH) => { const b = B(g, 'box', false); b.idColor = '#203050'; b.idMaxD = 120;
    for (let r = 0; r < rows; r++) { const y = y0 + rowH * (r + 0.55); for (const [sx, sz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) for (const t of [-0.25, 0.25]) {
      if (sz) b.add([x + t * w, y, z + sz * (d / 2 + 0.02)], [w * 0.22, rowH * 0.42, 0.03], C.pane); else b.add([x + sx * (w / 2 + 0.02), y, z + t * d], [0.03, rowH * 0.42, d * 0.22], C.pane); } } };
  for (let i = 0; i < 70; i++) {
    const a = rand() * 6.283, r = footR + 3 + rand() * (42 - footR - 3), x = Math.sin(a) * r, z = Math.cos(a) * r; if (z > -2 && Math.abs(x) < 10) continue;   // keep the jump lane (dome → sea) open
    const k = rand();
    if (k < 0.45) { setEl('city'); const w = between(4.6, 6), d = between(4.6, 6), fl = 2 + Math.floor(rand() * (r > 30 ? 4 : 2)), h = fl * 3.1 + 0.5;

      B(island, 'rbox').add([x, LG + h / 2, z], [w, h, d], pick(rand() < 0.5 ? C.brick : C.stone)); windows(island, x, z, w, d, LG + 0.4, fl, 3.1);
      if (rand() < 0.5) { const y = LG + h; for (const [lx, lz] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]) B(island, 'capsule').add([x + lx, y + 0.7, z + lz], [0.13, 1.4, 0.13], '#9A8A78'); B(island, 'rcyl').add([x, y + 1.4, z], [1, 1.8, 1], pick(C.tank)); B(island, 'cone').add([x, y + 3.1, z], [1.1, 0.9, 1.1], '#8E7563'); } }
    else if (k < 0.75) { setEl('city'); const w = between(4, 5), d = between(4, 5), h = 3.4, ry = Math.atan2(x, z);
      B(island, 'rbox').add([x, LG + h / 2, z], [w, h, d], pick(C.wood), [0, ry, 0]); B(island, 'roof').add([x, LG + h - 0.05, z], [w * 1.16, 2.2, d * 1.12], pick(C.roof), [0, ry, 0]); windows(island, x, z, w, d, LG, 1, 2.8); }
    else { setEl('trees'); tree(island, x, z, 0.9 + rand() * 0.5, LG); }
  }
  setEl('city');
  { let y = LG, w = 6.4; [10, 6, 4].forEach(h => { B(island, 'rbox').add([-24, y + h / 2, -18], [w, h, w], '#F1E4CC'); y += h; w *= 0.74; }); B(island, 'halfSphere').add([-24, y, -18], [w * 0.6, w * 0.9, w * 0.6], '#E3C88E'); }   // one modest 1950s tower

  /* small round islands nearby (Kirby Everbay map) */
  setEl('islands');
  for (let i = 0; i < 12; i++) { const a = rand() * 6.283, d = between(80, 300), x = Math.sin(a) * d, z = Math.cos(a) * d, s = between(6, 18), drop = -(d * d) / (2 * R);
    if (z < -60 && Math.abs(x) < 120) continue;                          // the mainland coast is behind (−z)
    B(island, 'sphere').add([x, drop - s * 0.25, z], [s * 1.25, s * 0.42, s * 1.25], C.beach); B(island, 'sphere').add([x, drop - s * 0.1, z], [s, s * 0.4, s], C.grass);
    for (let k = 0; k < 1 + Math.floor(rand() * 3); k++) tree(island, x + between(-s / 2, s / 2), z + between(-s / 2, s / 2), 0.9 + rand() * 0.6, drop + s * 0.25); }

  S.api = api;
}

/* ── camera helpers ── */
const V = (THREE, a) => new THREE.Vector3(...a);
function localCam(api, pos, look, fovMm = 30) {
  const { THREE, camera } = api; const isl = S.island; isl.updateWorldMatrix(true, false);
  const p = isl.localToWorld(V(THREE, pos)), t = isl.localToWorld(V(THREE, look)), up = new THREE.Vector3(0, 1, 0).applyQuaternion(isl.getWorldQuaternion(new THREE.Quaternion()));
  camera.position.copy(p); camera.up.copy(up); camera.lookAt(t); camera.fov = 2 * Math.atan(12 / fovMm) * 180 / Math.PI; camera.near = 0.1; camera.far = 30000;
}
/** near-orthographic version of a local view (same framing) for the fall strip */
function localFar(api, pos, look, mm) {
  const { THREE, camera, scene } = api; localCam(api, pos, look, mm);
  const T = S.island.localToWorld(new THREE.Vector3(...look)), d0 = camera.position.distanceTo(T), dir = camera.position.clone().sub(T).normalize();
  camera.position.copy(T).add(dir.multiplyScalar(4000)); camera.lookAt(T);
  camera.fov = 2 * Math.atan(d0 * Math.tan(Math.atan(12 / mm)) / 4000) * 180 / Math.PI; camera.near = 4000 - d0 - 80; camera.far = 4000 + 600; scene.fog = null;
}
function globeCam(api, extraSpin = 0) {
  const { THREE, camera } = api; const isl = S.island; isl.updateWorldMatrix(true, false);
  const p = isl.getWorldPosition(new THREE.Vector3()); const dir = new THREE.Vector3(p.x, p.y * 0.35, p.z).normalize();
  camera.position.copy(dir.multiplyScalar(GLOBE_DIST)); camera.up.set(0, 1, 0); camera.lookAt(0, 0, 0); camera.fov = 40; camera.near = 10; camera.far = 30000;
}
let turn0 = 0;
const shots = [
  { name: 'Sc 7–8 · jump & fall (base)', dur: 6, era: 'base',
    update(k, ts, api) { S.spin.rotation.y = turn0; S.cloudSpin.rotation.y = turn0;
      const e = api.ease(k);
      if (k < 0.4) { const u = api.ease(k / 0.4); localCam(api, [0, DOME_TOP + 1.8, api.lerp(-6, 13, u)], [0, DOME_TOP - 1, 40], 28); }
      else { const u = api.ease((k - 0.4) / 0.6); localCam(api, [0, api.lerp(DOME_TOP + 1.8, 2.5, u), api.lerp(13, 38, u)], [0, api.lerp(DOME_TOP - 1, -6, u), api.lerp(40, 80, u)], api.lerp(28, 24, u)); } },
    pano: { label: 'tall strip of the fall', axis: 'y', from: 26, to: 1.5, pxPerUnit: (H, api) => api.focalPx(H) / 4000,
      setup: (s, api) => { S.spin.rotation.y = turn0; localFar(api, [0, s, 10], [0, s - 7, 50], 26); } } },
  { name: 'Zoom out · street → globe (base)', dur: 10, era: 'base',
    update(k, ts, api) {
      const { THREE, camera } = api; S.spin.rotation.y = turn0; S.cloudSpin.rotation.y = turn0;
      const e = api.ease(k), isl = S.island; isl.updateWorldMatrix(true, false);
      const cityW = isl.localToWorld(new THREE.Vector3(0, 3, 0)), nUp = new THREE.Vector3(0, 1, 0).applyQuaternion(isl.getWorldQuaternion(new THREE.Quaternion()));
      const startDir = isl.localToWorld(new THREE.Vector3(0, 0.75, -0.66)).sub(isl.localToWorld(new THREE.Vector3())).normalize();
      const p = isl.getWorldPosition(new THREE.Vector3()), endDir = new THREE.Vector3(p.x, p.y * 0.35, p.z).normalize();
      const dist = Math.exp(api.lerp(Math.log(36), Math.log(GLOBE_DIST), e));
      const tgt = cityW.clone().lerp(new THREE.Vector3(), api.smooth(0.25, 0.95, k));
      const q = new THREE.Quaternion().setFromUnitVectors(startDir, endDir), qq = new THREE.Quaternion().slerp(q, api.smooth(0.05, 0.9, k));
      camera.position.copy(tgt).add(startDir.clone().applyQuaternion(qq).multiplyScalar(dist));
      camera.up.copy(nUp.clone().lerp(new THREE.Vector3(0, 1, 0), api.smooth(0.3, 0.9, k)).normalize()); camera.lookAt(tgt);
      camera.fov = api.lerp(46, 40, e); camera.near = Math.max(0.1, dist * 0.004); camera.far = 30000; } },
  { name: 'Sc 9 · red wave → 1950s', dur: 4, era: 'base', trans: { type: 'wave', to: 'e1950', at: [0.1, 0.9] },
    update(k, ts, api) { S.spin.rotation.y = turn0; S.cloudSpin.rotation.y = turn0; globeCam(api); } },
  { name: 'Globe 360° turntable (1950s)', dur: 24, era: 'e1950',
    update(k, ts, api) { const a = k * Math.PI * 2; S.spin.rotation.y = turn0 + a; S.cloudSpin.rotation.y = turn0 + a * 1.15; S.spin.rotation.y = turn0 + a; turntableCam(api); },
    pano: { label: 'long strip of the turning globe', axis: 'x', from: 0, to: Math.PI * 2, reverse: true, pxPerUnit: (H, api) => api.focalPx(H) * R / (FAR_D - R),
      setup: (s, api) => { S.spin.rotation.y = turn0 + s; S.cloudSpin.rotation.y = turn0 + s; farCam(api); } } },   // clouds layer: slide it 15% faster when compositing
];
let tCam = null;
const FAR_D = 60000;
/** near-orthographic view for the globe strip: very far, narrow lens → every slice is a true strip of the surface */
function farCam(api) { const { camera } = api; turntableCam(api); const d = camera.position.clone().normalize(); camera.position.copy(d.multiplyScalar(FAR_D)); camera.lookAt(0, 0, 0);
  camera.fov = 2 * Math.atan(R * 1.18 / (FAR_D - R)) * 180 / Math.PI; camera.near = FAR_D - R * 3; camera.far = FAR_D + R * 3; }
function turntableCam(api) {                       // fixed view: camera where the city faced it at the start of the turn
  const { THREE, camera } = api;
  if (!tCam) { S.spin.rotation.y = turn0; S.spin.updateMatrixWorld(true); const p = S.island.getWorldPosition(new THREE.Vector3()); tCam = new THREE.Vector3(p.x, p.y * 0.35, p.z).normalize().multiplyScalar(GLOBE_DIST); }
  camera.position.copy(tCam); camera.up.set(0, 1, 0); camera.lookAt(0, 0, 0); camera.fov = 40; camera.near = 10; camera.far = 30000;
}

startApp({
  id: 'bg2', title: 'BG 2 · Earth zoom out + Globe 360°', fov: 40, shots, build,
  eras: ['base', 'e1950'],
  update(T, api, shot, k) {
    const { THREE, camera, hemi, sun, setSky } = api;
    const alt = camera.position.length() - R, t = api.smooth(40, 1400, alt);
    const mix = (a, b) => api.rgbToHex(api.hexToRgb(a).map((v, i) => v + (api.hexToRgb(b)[i] - v) * t));
    setSky(mix('#7FC4EE', '#0F1C3E'), mix('#E4F3FA', '#21406E'), mix('#E4F3FA', '#0F1C3E'), { baseHex: mix('#9FD3F0', '#132449') });
    hemi.intensity = api.lerp(2.3, 0.75, t); sun.intensity = api.lerp(0.9, 2.6, t); sun.position.set(1, 0.3, 0.4); hemi.color.set('#FFFFFF'); hemi.groundColor.set(t > 0.5 ? '#1C2A4A' : '#E8E0C8');
    if (S.nightMat) S.nightMat.uniforms.uSun.value.copy(sun.position).normalize();
    if (S.stars) S.stars.userData.fxVisible = t > 0.05;
    api.scene.fog = t < 0.3 ? new THREE.Fog('#E4F3FA', 220, 2600) : null;
  },
  staging: (api, shot) => { if (shot !== shots[0]) return null; const p = S.island.localToWorld(new api.THREE.Vector3(0, DOME_TOP, 0)); return { center: p.toArray(), size: [2.6, 1.3, 1.4] }; },
});
