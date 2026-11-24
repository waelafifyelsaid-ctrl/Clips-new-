// First-person rig: arms, hands and a phone with a live-drawn screen, all parented to the camera.
import { THREE, camera, toon, mesh, cap, sph, box, canvasTex } from './core.js';

const SKIN = toon(0xf0c8a8);
let SLEEVE = toon(0x6a7488, { name: 'sleeve' });

export const phoneTex = canvasTex(360, 760, () => {});
const g = new THREE.Group(); camera.add(g);
const armR = new THREE.Group(), armL = new THREE.Group(); g.add(armR, armL);

function buildArm(grp, sx) {
  const fore = mesh(cap(0.034, 0.3), SLEEVE, 0, 0, 0, grp, { rot: [Math.PI / 2, 0, 0] });
  const hand = new THREE.Group(); hand.position.set(0, 0, -0.2); grp.add(hand);
  mesh(sph(0.04, 14, 10), SKIN, 0, 0, 0, hand, { scale: [0.95, 0.55, 1.25] });
  for (let i = 0; i < 4; i++) mesh(cap(0.009, 0.04), SKIN, -0.024 + i * 0.016, 0.0, -0.055, hand, { rot: [Math.PI / 2 + 0.3, 0, 0] });
  mesh(cap(0.014, 0.045), SKIN, sx * 0.05, 0.01, -0.03, hand, { rot: [Math.PI / 2, 0, sx * 0.7] });
  return { fore, hand };
}
const R = buildArm(armR, 1), L = buildArm(armL, -1);

// phone in right hand
export const phone = new THREE.Group();
mesh(box(0.072, 0.15, 0.009), toon(0x1a1a1f), 0, 0, 0, phone);
const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.066, 0.14), new THREE.MeshBasicMaterial({ map: phoneTex, toneMapped: false }));
screen.position.z = 0.0051; phone.add(screen);
g.add(phone);

const POSES = {
  none: { r: null, l: null, phone: null },
  phone: { r: [0.07, -0.2, -0.26, -0.9, 0.2, 0.1], l: [-0.13, -0.26, -0.3, -0.5, -0.3, 0.2], phone: [0.025, -0.115, -0.3, -0.45, 0.05, 0.02] },
  phoneClose: { r: [0.05, -0.16, -0.2, -0.6, 0.15, 0.1], l: [-0.1, -0.22, -0.22, -0.4, -0.3, 0.2], phone: [0.0, -0.03, -0.16, -0.12, 0.0, 0.0] },
  reach: { r: [0.1, -0.12, -0.3, -0.2, 0.1, 0.0], l: null, phone: null },
  reachBoth: { r: [0.12, -0.14, -0.32, -0.15, 0.1, 0.0], l: [-0.12, -0.14, -0.32, -0.15, -0.1, 0.0], phone: null },
  guard: { r: [0.14, -0.08, -0.28, 0.4, 0.2, 0.3], l: [-0.14, -0.08, -0.28, 0.4, -0.2, -0.3], phone: null },
  low: { r: [0.16, -0.28, -0.25, -0.6, 0.1, 0.0], l: [-0.16, -0.28, -0.25, -0.6, -0.1, 0.0], phone: null },
  hold: { r: [0.08, -0.17, -0.26, -0.8, 0.1, 0.0], l: [-0.08, -0.17, -0.26, -0.8, -0.1, 0.0], phone: null },
};
const tmp = {};
function apply(grp, v, hide) {
  if (!v || hide) { grp.visible = false; return; }
  grp.visible = true; grp.position.set(v[0], v[1], v[2]); grp.rotation.set(v[3], v[4], v[5]);
}
function lerpV(a, b, k) { if (!a) return b; if (!b) return a; return a.map((x, i) => x + (b[i] - x) * k); }

// state: {pose, from, k, thumb}
export function setPov(name, fromName = null, k = 1, extra = {}) {
  const a = POSES[fromName || name] || POSES.none, b = POSES[name] || POSES.none;
  const r = k >= 1 ? b.r : (b.r && a.r ? lerpV(a.r, b.r, k) : (k > 0.5 ? b.r : a.r));
  const l = k >= 1 ? b.l : (b.l && a.l ? lerpV(a.l, b.l, k) : (k > 0.5 ? b.l : a.l));
  const p = k >= 1 ? b.phone : (b.phone && a.phone ? lerpV(a.phone, b.phone, k) : (k > 0.5 ? b.phone : a.phone));
  // entering from off-screen: slide in from below
  const slide = (v, kk) => v ? [v[0], v[1] - 0.25 * (1 - kk), v[2], v[3], v[4], v[5]] : v;
  apply(armR, (!a.r && b.r) ? slide(b.r, k) : r);
  apply(armL, (!a.l && b.l) ? slide(b.l, k) : l);
  apply(phone, (!a.phone && b.phone) ? slide(b.phone, k) : p);
  if (extra.shake) { g.position.set(Math.sin(extra.t * 13) * extra.shake, Math.cos(extra.t * 11) * extra.shake, 0); } else g.position.set(0, 0, 0);
}
export function setSleeve(color) { SLEEVE.color.set(color); }
export { g as povGroup };
setPov('none');
