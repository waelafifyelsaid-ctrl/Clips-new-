// Effects: helicopter, explosions, smoke, fire, flashing lights, debris.
import { THREE, scene, toon, flat, mesh, box, cyl, sph, cap, noOutline } from './core.js';

export function helicopter(parent = scene, color = 0x2f3a2f) {
  const g = new THREE.Group(); parent.add(g);
  const c = toon(color);
  mesh(sph(1.4, 20, 14), c, 0, 0, 0, g, { scale: [1.6, 1, 1] });
  mesh(sph(1.0, 16, 12), toon(0x9ab4c4), 1.3, 0.25, 0, g, { scale: [0.9, 0.7, 0.9] });
  mesh(cyl(0.25, 0.45, 5.5, 10), c, -4.2, 0.35, 0, g, { rot: [0, 0, Math.PI / 2 + 0.08] });
  mesh(box(0.15, 1.6, 0.9), c, -6.8, 0.9, 0, g);
  for (const z of [-0.9, 0.9]) mesh(box(3.6, 0.12, 0.12), toon(0x222222), 0, -1.55, z, g);
  mesh(cyl(0.18, 0.18, 0.5, 8), toon(0x222222), 0, 1.3, 0, g);
  const rotor = new THREE.Group(); rotor.position.y = 1.6; g.add(rotor);
  for (let i = 0; i < 4; i++) mesh(box(9, 0.06, 0.4), toon(0x1c1c1c), 0, 0, 0, rotor, { rot: [0, i * Math.PI / 2, 0] }).position.set(0, 0, 0);
  rotor.children.forEach((m, i) => { m.rotation.y = i * Math.PI / 2; m.geometry.translate(4.5, 0, 0); });
  const tail = new THREE.Group(); tail.position.set(-6.8, 1.2, 0.5); g.add(tail);
  mesh(box(0.05, 2.0, 0.2), toon(0x1c1c1c), 0, 0, 0, tail);
  const blink = noOutline(mesh(sph(0.15, 8, 6), flat(0xff2020), 0, -1.0, 0, g));
  return { g, update(t) { rotor.rotation.y = t * 38; tail.rotation.z = t * 50; blink.visible = (t * 1.5) % 1 < 0.15; } };
}

// fireball + smoke column. call update(localTime) every frame (t<0 = hidden)
export function explosion(parent, x, y, z, scale = 1) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(scale); parent.add(g);
  const fire = [], smoke = [];
  const fm = [flat(0xfff3b0), flat(0xffb030), flat(0xff6a1a)];
  for (let i = 0; i < 14; i++) {
    const m = noOutline(mesh(sph(1, 14, 10), fm[i % 3], (Math.random() - 0.5) * 4, Math.random() * 3, (Math.random() - 0.5) * 4, g, { cast: false }));
    m.userData.v = new THREE.Vector3((Math.random() - 0.5) * 5, 3 + Math.random() * 6, (Math.random() - 0.5) * 5); fire.push(m);
  }
  const sm = [toon(0x4a4648), toon(0x5c5658), toon(0x3a3638)];
  for (let i = 0; i < 26; i++) {
    const m = mesh(sph(1, 12, 9), sm[i % 3], 0, 0, 0, g, { cast: false });
    m.userData.v = new THREE.Vector3((Math.random() - 0.5) * 3, 2 + Math.random() * 4, (Math.random() - 0.5) * 3);
    m.userData.d = Math.random() * 2.5; smoke.push(m);
  }
  const light = new THREE.PointLight(0xff9a40, 0, 400, 1.2); g.add(light);
  g.visible = false;
  return {
    g, light,
    update(t) {
      g.visible = t >= 0;
      if (t < 0) { light.intensity = 0; return; }
      fire.forEach((m, i) => {
        const k = Math.min(1, t / 0.5);
        m.position.copy(m.userData.v).multiplyScalar(Math.pow(t, 0.5) * 0.9);
        const s = (2.2 + i * 0.25) * k * Math.max(0, 1 - t / 3.5);
        m.scale.setScalar(Math.max(0.001, s)); m.visible = s > 0.01;
      });
      smoke.forEach((m) => {
        const tt = Math.max(0, t - 0.25 - m.userData.d * 0.3);
        m.position.set(m.userData.v.x * Math.sqrt(tt) * 1.2, m.userData.v.y * Math.pow(tt, 0.7) * 1.4 + tt * 1.5, m.userData.v.z * Math.sqrt(tt) * 1.2);
        const s = Math.min(1, tt / 1.2) * (2.5 + tt * 0.9);
        m.scale.setScalar(Math.max(0.001, s)); m.visible = tt > 0;
      });
      light.intensity = t < 2.5 ? (1 - t / 2.5) * 900 : 0;
    },
  };
}

// steady smoke column (e.g. something burning in the distance)
export function smokeColumn(parent, x, y, z, scale = 1, dark = true) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(scale); parent.add(g);
  const parts = [];
  const mats = dark ? [toon(0x3e3a3c), toon(0x4c4648)] : [toon(0x8a8686), toon(0x9c9898)];
  for (let i = 0; i < 22; i++) { const m = mesh(sph(1, 10, 8), mats[i % 2], 0, 0, 0, g, { cast: false }); m.userData.o = i / 22; parts.push(m); }
  return {
    g, update(t) {
      parts.forEach((m, i) => {
        const p = (m.userData.o + t * 0.04) % 1;
        m.position.set(Math.sin(i * 2.1) * (1 + p * 3) + p * 8, p * 30, Math.cos(i * 1.7) * (1 + p * 2));
        m.scale.setScalar(1.2 + p * 5);
      });
    },
  };
}

export function fire(parent, x, y, z, scale = 1) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(scale); parent.add(g);
  const fl = [];
  const ms = [flat(0xffd24a), flat(0xff8a22), flat(0xff5a18)];
  for (let i = 0; i < 9; i++) fl.push(noOutline(mesh(new THREE.ConeGeometry(0.35, 1.2, 8), ms[i % 3], (Math.random() - 0.5) * 1.2, 0.5, (Math.random() - 0.5) * 1.2, g, { cast: false })));
  const light = new THREE.PointLight(0xff8a3a, 6, 12, 1.5); light.position.y = 1; g.add(light);
  return { g, update(t) { fl.forEach((m, i) => { const s = 0.7 + 0.35 * Math.sin(t * (9 + i) + i); m.scale.set(s, s * (1 + 0.4 * Math.sin(t * 13 + i * 2)), s); }); light.intensity = 5 + Math.sin(t * 20) * 1.5; } };
}

export function policeLights(parent, x, y, z) {
  const red = new THREE.PointLight(0xff2a2a, 0, 25, 1.4), blue = new THREE.PointLight(0x2a5aff, 0, 25, 1.4);
  red.position.set(x - 0.4, y, z); blue.position.set(x + 0.4, y, z); parent.add(red, blue);
  return { update(t) { const a = Math.floor(t * 4) % 2; red.intensity = a ? 30 : 0; blue.intensity = a ? 0 : 30; } };
}

export function debris(parent, x, y, z, n = 20) {
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  const ps = [];
  for (let i = 0; i < n; i++) { const m = mesh(box(0.3, 0.2, 0.25), toon(0x3a3434), 0, 0, 0, g); m.userData.v = new THREE.Vector3((Math.random() - 0.5) * 14, 6 + Math.random() * 10, (Math.random() - 0.5) * 14); ps.push(m); }
  g.visible = false;
  return { g, update(t) { g.visible = t >= 0; if (t < 0) return; ps.forEach(m => { m.position.set(m.userData.v.x * t, m.userData.v.y * t - 4.9 * t * t, m.userData.v.z * t); m.rotation.set(t * 5, t * 3, 0); }); } };
}
