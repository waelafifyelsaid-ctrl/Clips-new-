// Locations built from primitives + painted canvas textures.
import { THREE, scene, toon, flat, mesh, box, cyl, sph, cap, canvasTex, lights, noOutline } from './core.js';

const R = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();

export function planks(base = ['#b7834f', '#c08a55', '#ad7a48', '#ba8652'], rep = [2, 3]) {
  return canvasTex(512, 512, (g, w, h) => {
    for (let i = 0; i < 8; i++) {
      g.fillStyle = base[i % base.length]; g.fillRect(0, i * 64, w, 64);
      g.fillStyle = 'rgba(0,0,0,0.05)'; for (let k = 0; k < 6; k++) g.fillRect(R() * w, i * 64 + R() * 60, 80 + R() * 120, 2);
      g.fillStyle = '#5e3e22'; g.fillRect(0, i * 64, w, 3); g.fillRect((i * 173) % w, i * 64, 3, 64); g.fillRect((i * 173 + 260) % w, i * 64, 3, 64);
    }
  }, rep);
}
export function wallpaper(color = '#cfc8bb', rep = [3, 2]) {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = color; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,0.025)'; for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 12, h);
  }, rep);
}
function windowsTex(cols, rows, wall, lit = 0.25, night = false) {
  return canvasTex(64 * cols, 96 * rows, (g, w, h) => {
    g.fillStyle = wall; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = 0; y < h; y += 96) g.fillRect(0, y + 88, w, 4);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const on = R() < lit;
      g.fillStyle = '#e9e3d6'; g.fillRect(c * 64 + 12, r * 96 + 18, 40, 58);
      g.fillStyle = on ? (night ? '#ffd27a' : '#f3e3b0') : (night ? '#1f2740' : '#6f86a6'); g.fillRect(c * 64 + 15, r * 96 + 21, 34, 52);
      g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(c * 64 + 15, r * 96 + 21, 34, 8);
      g.fillStyle = '#e9e3d6'; g.fillRect(c * 64 + 31, r * 96 + 21, 2, 52);
    }
  });
}

// ---------------------------------------------------------------- sky + city outside
export function sky(top = '#7f9cc8', bottom = '#f0cfa8', parent = scene) {
  const tex = canvasTex(16, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, top); gr.addColorStop(0.55, bottom); gr.addColorStop(1, bottom); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  const m = mesh(new THREE.SphereGeometry(300, 32, 16), new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false }), 0, 0, 0, parent, { cast: false, receive: false });
  return noOutline(m);
}

export function city(parent, opts = {}) {
  const g = new THREE.Group(); parent.add(g);
  const y0 = opts.ground ?? -13;
  const night = !!opts.night;
  const walls = night ? ['#4b4a5e', '#55506a', '#3f4558'] : ['#c98f7a', '#d8b48e', '#b98a8a', '#c7b8a2', '#a88d7c'];
  // street + pavements
  mesh(box(200, 0.2, 14), toon(night ? 0x2c2e36 : 0x5d6068), 0, y0 - 0.1, opts.streetZ ?? 14, g);
  mesh(box(200, 0.3, 4), toon(night ? 0x3a3a42 : 0x9a958e), 0, y0, (opts.streetZ ?? 14) - 8.5, g);
  mesh(box(200, 0.3, 4), toon(night ? 0x3a3a42 : 0x9a958e), 0, y0, (opts.streetZ ?? 14) + 8.5, g);
  for (let x = -60; x < 60; x += 6) mesh(box(2.5, 0.02, 0.2), flat(0xe8e8e8), x, y0 + 0.01, opts.streetZ ?? 14, g, { cast: false });
  // facades across the street
  let x = -70;
  while (x < 70) {
    const w = 10 + Math.floor(R() * 6), h = 12 + Math.floor(R() * 5), d = 10;
    const col = walls[Math.floor(R() * walls.length)];
    const tex = windowsTex(Math.round(w / 2.2), Math.round(h / 3.2), col, night ? 0.3 : 0.15, night);
    const mats = [toon(0xffffff, { map: tex }), toon(0xffffff, { map: tex }), toon(new THREE.Color(col).getHex()), toon(new THREE.Color(col).getHex()), toon(0xffffff, { map: tex }), toon(0xffffff, { map: tex })];
    const b = mesh(box(w, h, d), mats, x + w / 2, y0 + h / 2, (opts.streetZ ?? 14) + 15, g);
    mesh(box(w + 0.4, 0.5, 0.6), toon(0x8a8a90), x + w / 2, y0 + h + 0.25, (opts.streetZ ?? 14) + 10.2, g);
    // roof
    mesh(new THREE.CylinderGeometry(0.01, d * 0.6, 3.5, 4, 1), toon(night ? 0x2a2a36 : 0x7a4a3a), x + w / 2, y0 + h + 1.75, (opts.streetZ ?? 14) + 15, g, { rot: [0, Math.PI / 4, 0], scale: [w / d * 1.2, 1, 1] });
    x += w + 0.2;
  }
  // far skyline
  for (let i = 0; i < 24; i++) {
    const w = 8 + R() * 14, h = 20 + R() * 45;
    mesh(box(w, h, 8), toon(night ? 0x2a2d40 : 0x9aa6bb), -110 + i * 10 + R() * 4, y0 + h / 2, 90 + R() * 30, g, { cast: false });
  }
  // trees + parked cars
  for (let k = -50; k < 50; k += 9) { tree(g, k + R() * 3, y0, (opts.streetZ ?? 14) - 7.5, 1 + R() * 0.3); if (R() < 0.7) car(g, k + 4, y0, (opts.streetZ ?? 14) - 4.8, R() * 0xffffff, 0); }
  return g;
}

export function tree(parent, x, y, z, s = 1) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(s); parent.add(g);
  mesh(cyl(0.18, 0.25, 3.2, 8), toon(0x6b4f3e), 0, 1.6, 0, g);
  const lf = toon(0x5e8f80);
  for (const [a, b, c, r] of [[0, 4.2, 0, 1.7], [1.1, 3.6, 0.3, 1.2], [-1.0, 3.7, -0.2, 1.3], [0.3, 5.0, -0.4, 1.2], [-0.4, 3.5, 0.9, 1.1]]) mesh(sph(r, 14, 10), lf, a, b, c, g);
  return g;
}

export function car(parent, x, y, z, color = 0xb05050, ry = 0, s = 1) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; g.scale.setScalar(s); parent.add(g);
  const c = toon(new THREE.Color(color).getHex());
  mesh(box(4.2, 0.75, 1.8), c, 0, 0.65, 0, g);
  mesh(box(2.3, 0.6, 1.6), c, -0.2, 1.3, 0, g);
  mesh(box(2.1, 0.45, 1.62), toon(0x9fb7c9), -0.2, 1.3, 0, g);
  for (const [a, b] of [[-1.35, 0.85], [1.35, 0.85], [-1.35, -0.85], [1.35, -0.85]]) mesh(cyl(0.36, 0.36, 0.25, 14), toon(0x222226), a, 0.36, b, g, { rot: [Math.PI / 2, 0, 0] });
  mesh(box(0.05, 0.2, 0.4), flat(0xfff2c0), 2.11, 0.75, 0.55, g); mesh(box(0.05, 0.2, 0.4), flat(0xfff2c0), 2.11, 0.75, -0.55, g);
  return g;
}

// ---------------------------------------------------------------- apartment
export function apartmentBedroom(opts = {}) {
  const g = new THREE.Group(); scene.add(g);
  const RW = 4.2, RH = 2.75, RD = 4.6;
  const night = !!opts.night;
  mesh(box(RW, 0.1, RD), toon(0xffffff, { map: planks() }), 0, -0.05, 0, g);
  mesh(box(RW, 0.1, RD), toon(0xe6e1d8), 0, RH + 0.05, 0, g);
  const wp = toon(0xffffff, { map: wallpaper('#cdc6ba') });
  mesh(box(0.1, RH, RD), wp, -RW / 2, RH / 2, 0, g);                     // left wall
  mesh(box(RW, RH, 0.1), wp, 0, RH / 2, -RD / 2, g);                     // back wall (door)
  mesh(box(RW, RH, 0.1), wp, 0, RH / 2, RD / 2, g);                      // wall behind camera
  // right wall with a big window opening (x = +RW/2), opening z in [-1.1, 0.9], y in [0.8, 2.4]
  const wx = RW / 2;
  mesh(box(0.1, RH, RD / 2 - 1.1), wp, wx, RH / 2, -(1.1 + (RD / 2 - 1.1) / 2), g);
  mesh(box(0.1, RH, RD / 2 - 0.9), wp, wx, RH / 2, 0.9 + (RD / 2 - 0.9) / 2, g);
  mesh(box(0.1, 0.8, 2.0), wp, wx, 0.4, -0.1, g);
  mesh(box(0.1, RH - 2.4, 2.0), wp, wx, 2.4 + (RH - 2.4) / 2, -0.1, g);
  const frame = toon(0xf1eee8);
  for (const [y, h] of [[0.8, 0.08], [2.4, 0.08], [2.05, 0.06]]) mesh(box(0.16, h, 2.0), frame, wx, y, -0.1, g);
  for (const z of [-1.1, -0.1, 0.9]) mesh(box(0.16, 1.6, z === -0.1 ? 0.05 : 0.07), frame, wx, 1.6, z, g);
  mesh(box(0.35, 0.05, 2.1), frame, wx - 0.12, 0.8, -0.1, g);  // sill
  // glass (subtle)
  noOutline(mesh(box(0.02, 1.6, 2.0), new THREE.MeshBasicMaterial({ color: 0xbfd6ea, transparent: true, opacity: 0.08 }), wx, 1.6, -0.1, g, { cast: false }));
  // curtains
  const cur = toon(0x8a5d5d);
  const curtL = mesh(box(0.08, 2.4, 0.5), cur, wx - 0.18, 1.45, -1.25, g);
  const curtR = mesh(box(0.08, 2.4, 0.5), cur, wx - 0.18, 1.45, 1.05, g);
  // crown moulding & skirting
  for (const [x, z, w, d] of [[-RW / 2 + 0.07, 0, 0.1, RD], [RW / 2 - 0.07, 0, 0.1, RD], [0, -RD / 2 + 0.07, RW, 0.1], [0, RD / 2 - 0.07, RW, 0.1]]) {
    mesh(box(w, 0.09, d), toon(0x9aa3b8), x, RH - 0.05, z, g);
    mesh(box(w, 0.08, d), toon(0xefe9dd), x, 0.04, z, g);
  }
  // door on back wall
  mesh(box(1.0, 2.1, 0.12), toon(0xf1eee8), -1.0, 1.05, -RD / 2 + 0.05, g);
  const door = mesh(box(0.86, 2.0, 0.05), toon(0xdcd6cc), -1.0, 1.0, -RD / 2 + 0.11, g);
  mesh(sph(0.035), toon(0xb8b0a0), -0.65, 1.0, -RD / 2 + 0.16, g);
  // bed (camera lies on its right half), head at z = +1.6
  const bedX = 0.35, bedZ = 0.55;
  mesh(box(1.7, 0.35, 2.15), toon(0x8a6a4e), bedX, 0.2, bedZ, g);
  mesh(box(1.75, 0.9, 0.08), toon(0x7a5a40), bedX, 0.55, bedZ + 1.1, g);           // headboard
  mesh(box(1.62, 0.2, 2.05), toon(0xf2f0ea), bedX, 0.47, bedZ, g);                  // mattress
  const duvet = mesh(box(1.66, 0.14, 1.5), toon(0x6c86a6), bedX, 0.6, bedZ - 0.3, g); // duvet
  mesh(box(0.65, 0.14, 0.38), toon(0xf6f3ec), bedX - 0.42, 0.64, bedZ + 0.82, g, { rot: [0.25, 0, 0] });
  mesh(box(0.65, 0.14, 0.38), toon(0xf6f3ec), bedX + 0.42, 0.64, bedZ + 0.82, g, { rot: [0.25, 0, 0] });
  // nightstands + lamp
  for (const sx of [-1, 1]) {
    const x = bedX + sx * 1.15;
    mesh(box(0.45, 0.5, 0.4), toon(0x9a7454), x, 0.25, bedZ + 0.9, g);
    mesh(cyl(0.05, 0.07, 0.3, 12), toon(0x555560), x, 0.65, bedZ + 0.9, g);
    mesh(cyl(0.1, 0.16, 0.2, 16), toon(0xf1e1b5), x, 0.88, bedZ + 0.9, g);
  }
  mesh(cyl(0.04, 0.035, 0.09, 12), toon(0x4f7fb0), bedX - 1.05, 0.55, bedZ + 0.95, g);   // mug
  // wardrobe + poster + plant
  mesh(box(0.6, 2.1, 1.3), toon(0xb7a58e), -RW / 2 + 0.35, 1.05, -0.7, g);
  mesh(box(0.02, 1.9, 0.02), toon(0x4e4236), -RW / 2 + 0.66, 1.05, -0.7, g);
  const poster = canvasTex(256, 360, (c, w, h) => { c.fillStyle = '#20304a'; c.fillRect(0, 0, w, h); c.fillStyle = '#e8b84a'; c.beginPath(); c.arc(128, 150, 70, 0, 7); c.fill(); c.fillStyle = '#e9e2d0'; c.font = 'bold 40px sans-serif'; c.textAlign = 'center'; c.fillText('LISBOA', 128, 300); });
  mesh(box(0.02, 0.9, 0.62), [toon(0xffffff, { map: poster }), toon(0xffffff), toon(0xffffff), toon(0xffffff), toon(0xffffff), toon(0xffffff)], -RW / 2 + 0.06, 1.6, 1.0, g);
  mesh(cyl(0.18, 0.14, 0.35, 14), toon(0xc0643a), 1.75, 0.18, -1.7, g);
  for (let i = 0; i < 6; i++) mesh(sph(0.16, 10, 8), toon(0x4f8a5a), 1.75 + Math.cos(i) * 0.12, 0.55 + i * 0.08, -1.7 + Math.sin(i * 2) * 0.12, g);
  // rug
  const rug = canvasTex(256, 256, (c, w, h) => { c.fillStyle = '#d9cbb0'; c.fillRect(0, 0, w, h); c.strokeStyle = '#7a5a48'; c.lineWidth = 8; c.strokeRect(14, 14, w - 28, h - 28); });
  mesh(box(1.5, 0.01, 1.0), toon(0xffffff, { map: rug }), -0.9, 0.006, -0.3, g, { cast: false });
  // ceiling lamp
  mesh(cyl(0.3, 0.3, 0.05, 24), toon(0xf4efe4), 0, RH - 0.03, 0, g);

  // outside
  const outside = new THREE.Group(); outside.position.set(RW / 2, 0, 0); outside.rotation.y = Math.PI / 2; g.add(outside);
  city(outside, { night, ground: -13, streetZ: 12 });

  lights.amb.intensity = night ? 0.35 : 1.35; lights.hemi.intensity = night ? 0.25 : 0.9;
  lights.key.position.set(14, 10, 3); lights.key.target.position.set(0, 0, 0);
  lights.key.intensity = night ? 0.15 : 1.6; lights.key.color.set(0xffe2c0);
  const fill = new THREE.PointLight(0xffe7c8, night ? 0.2 : 1.6, 9, 1.0); fill.position.set(-0.4, 1.7, 0.6); g.add(fill);
  return { group: g, door, duvet, curtL, curtR, bed: { x: bedX, z: bedZ }, window: { x: wx, y: 1.6, z: -0.1 }, outside, fill };
}

export function clearScene(keep = []) {
  for (const c of [...scene.children]) if (!keep.includes(c) && !c.isLight && !c.isCamera) scene.remove(c);
}

// ---------------------------------------------------------------- apartment hall + Altbau stairwell (built at offset ox)
export function hallAndStairs(opts = {}) {
  const ox = opts.ox ?? 50;
  const g = new THREE.Group(); g.position.set(ox, 0, 0); scene.add(g);
  const RH = 2.75;
  const wp = toon(0xffffff, { map: wallpaper('#d6cfc2', [2, 2]) });
  const floor = toon(0xffffff, { map: planks(['#a8784a', '#b38250', '#9f7044'], [1, 3]) });
  // corridor x[-0.75,0.75], z[-5,0.5]
  mesh(box(1.5, 0.1, 5.5), floor, 0, -0.05, -2.25, g);
  mesh(box(1.5, 0.1, 5.5), toon(0xe8e3da), 0, RH + 0.05, -2.25, g);
  mesh(box(0.1, RH, 5.5), wp, -0.8, RH / 2, -2.25, g);
  mesh(box(0.1, RH, 5.5), wp, 0.8, RH / 2, -2.25, g);
  mesh(box(1.6, RH, 0.1), wp, 0, RH / 2, 0.55, g);
  // front wall with door opening (door width 1.0) at z=-5
  mesh(box(0.3, RH, 0.2), wp, -0.65, RH / 2, -5, g); mesh(box(0.3, RH, 0.2), wp, 0.65, RH / 2, -5, g);
  mesh(box(1.0, RH - 2.1, 0.2), wp, 0, 2.1 + (RH - 2.1) / 2, -5, g);
  mesh(box(1.1, 2.18, 0.24), toon(0xf1ede4), 0, 1.09, -5, g).scale.set(1, 1, 0.3);
  // door pivot on the left side
  const doorPivot = new THREE.Group(); doorPivot.position.set(-0.5, 0, -4.98); g.add(doorPivot);
  const doorTex = canvasTex(128, 256, (c, w, h) => { c.fillStyle = '#7a4e34'; c.fillRect(0, 0, w, h); c.strokeStyle = '#5a3624'; c.lineWidth = 5; c.strokeRect(14, 14, w - 28, h * 0.42); c.strokeRect(14, h * 0.5, w - 28, h * 0.44); });
  mesh(box(1.0, 2.08, 0.06), toon(0xffffff, { map: doorTex }), 0.5, 1.04, 0, doorPivot);
  mesh(sph(0.03), toon(0xd8c890), 0.88, 1.02, 0.05, doorPivot); mesh(sph(0.03), toon(0xd8c890), 0.88, 1.02, -0.05, doorPivot);
  mesh(cyl(0.012, 0.012, 0.02, 10), toon(0x222222), 0.5, 1.55, 0.035, doorPivot, { rot: [Math.PI / 2, 0, 0] });   // peephole
  const chain = mesh(box(0.15, 0.015, 0.015), toon(0xc8c8c8), 0.82, 1.3, 0.05, doorPivot);
  // hall props
  mesh(box(0.35, 0.9, 1.0), toon(0x8a6a4e), -0.58, 0.45, -1.4, g);                  // shoe cabinet
  for (let i = 0; i < 4; i++) mesh(box(0.12, 0.1, 0.28), toon([0x222222, 0xaa3333, 0xdddddd, 0x335577][i]), -0.6, 0.95, -1.75 + i * 0.22, g);
  mesh(box(0.04, 0.9, 0.6), toon(0xbcd3dd), -0.74, 1.6, -1.4, g);                   // mirror
  for (let i = 0; i < 3; i++) mesh(cap(0.1, 0.5), toon([0x3a4a6a, 0x8a5a3a, 0x556b4a][i]), 0.64, 1.35, -1.9 + i * 0.3, g);  // jackets
  mesh(box(0.06, 0.05, 1.0), toon(0x6b4f3e), 0.72, 1.75, -1.6, g);
  mesh(box(0.06, 2.05, 0.85), toon(0xe6e0d4), 0.77, 1.02, -0.6, g);    // kitchen door
  // bathroom door (hinged) + small dark bathroom behind it
  const bathDoor = new THREE.Group(); bathDoor.position.set(0.79, 0, -4.32); g.add(bathDoor);
  mesh(box(0.05, 2.05, 0.82), toon(0xe6e0d4), 0, 1.02, 0.41, bathDoor);
  mesh(sph(0.03), toon(0xb8b0a0), -0.04, 1.0, 0.72, bathDoor);
  const bt = canvasTex(128, 128, (c) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { c.fillStyle = (x + y) % 2 ? '#cfd8dc' : '#b0bec5'; c.fillRect(x * 16, y * 16, 16, 16); } }, [2, 2]);
  const bm = toon(0xffffff, { map: bt });
  mesh(box(1.8, 0.1, 1.6), bm, 1.7, -0.05, -3.9, g); mesh(box(0.1, RH, 1.6), bm, 2.6, RH / 2, -3.9, g);
  mesh(box(1.8, RH, 0.1), bm, 1.7, RH / 2, -4.7, g); mesh(box(1.8, RH, 0.1), bm, 1.7, RH / 2, -3.1, g); mesh(box(1.8, 0.1, 1.6), bm, 1.7, RH, -3.9, g);
  mesh(box(0.6, 0.45, 0.45), toon(0xf4f4f4), 2.3, 0.6, -3.5, g);
  const lampH = new THREE.PointLight(0xffe2b0, 1.4, 6, 1.2); lampH.position.set(0, 2.5, -2.5); g.add(lampH);
  mesh(sph(0.12, 12, 8), flat(0xfff0cc), 0, 2.62, -2.5, g, { cast: false });
  // runner rug
  const rugT = canvasTex(64, 256, (c, w, h) => { c.fillStyle = '#7a2e2e'; c.fillRect(0, 0, w, h); c.fillStyle = '#d9b46a'; for (let y = 10; y < h; y += 28) c.fillRect(14, y, w - 28, 6); });
  mesh(box(0.8, 0.01, 3.6), toon(0xffffff, { map: rugT }), 0, 0.006, -2.6, g, { cast: false });

  // stairwell: landing z[-8.2,-5.1], x[-2.4,2.4]
  const sw = toon(0xffffff, { map: wallpaper('#b9b3a3', [3, 2]) });
  const tile = canvasTex(256, 256, (c, w, h) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { c.fillStyle = (x + y) % 2 ? '#d9d2c2' : '#6a5a4a'; c.fillRect(x * 32, y * 32, 32, 32); } }, [4, 3]);
  mesh(box(4.8, 0.1, 3.2), toon(0xffffff, { map: tile }), 0, -0.05, -6.65, g);
  mesh(box(4.8, 0.1, 3.2), toon(0xd8d2c6), 0, 6.0, -6.65, g);
  mesh(box(4.8, 6, 0.1), sw, 0, 3, -8.25, g);
  mesh(box(0.1, 6, 3.2), sw, -2.45, 3, -6.65, g);
  mesh(box(0.1, 6, 3.2), sw, 2.45, 3, -6.65, g);
  // neighbour door (left) and stairs going down on the right
  mesh(box(1.0, 2.08, 0.08), toon(0x6a4430), -1.6, 1.04, -8.18, g);
  mesh(box(0.25, 0.08, 0.04), toon(0xd8c890), -1.25, 1.0, -8.12, g);
  const nameT = canvasTex(128, 32, (c) => { c.fillStyle = '#e6dcc0'; c.fillRect(0, 0, 128, 32); c.fillStyle = '#222'; c.font = 'bold 20px sans-serif'; c.fillText('KRAUSE', 22, 23); });
  mesh(box(0.24, 0.06, 0.01), toon(0xffffff, { map: nameT }), -1.6, 1.6, -8.13, g);
  // stair hole: steps going down along -z on the right side x[0.9,2.4]
  const step = toon(0x8a6040);
  for (let i = 0; i < 14; i++) mesh(box(1.4, 0.18, 0.28), step, 1.7, -0.09 - i * 0.18, -5.3 - i * 0.28 + 0.0, g);
  for (let i = 0; i < 10; i++) mesh(box(1.4, 0.18, 0.28), step, 1.7, 0.09 + i * 0.18, -8.0 + i * 0.0 - 0.0, g).position.set(1.7, 0.09 + i * 0.18, -7.9 + i * 0.0);
  // railing
  const rail = toon(0x4a2e1e);
  mesh(box(0.08, 0.08, 3.0), rail, 0.9, 1.0, -6.6, g);
  for (let i = 0; i < 12; i++) mesh(box(0.03, 0.95, 0.03), toon(0x2a2a2a), 0.9, 0.5, -5.2 - i * 0.25, g);
  // lower floor landing (visible through stair hole)
  mesh(box(2.0, 0.1, 3.4), toon(0xffffff, { map: tile }), 1.6, -2.6, -6.6, g);
  // window on back wall + dim stair light
  mesh(box(1.0, 1.3, 0.12), toon(0x9fb7c9), 0.8, 2.4, -8.2, g);
  const lampS = new THREE.PointLight(0xfff0d0, 1.6, 9, 1.2); lampS.position.set(0, 2.6, -6.6); g.add(lampS);
  mesh(sph(0.14, 12, 8), flat(0xfff2d0), 0, 2.75, -6.6, g, { cast: false });
  const lampLow = new THREE.PointLight(0xffe0b0, 0.8, 6, 1.4); lampLow.position.set(1.6, -0.8, -6.6); g.add(lampLow);
  return { group: g, ox, doorPivot, chain, lampH, lampS, lampLow, doorZ: -5, bathDoor };
}
