// Stylised human characters with a joint hierarchy, procedural poses and a painted face texture.
import { THREE, toon, mesh, cap, sph, box, canvasTex } from './core.js';

const FACE_W = 1024, FACE_H = 512, FX = 256, FY = 256;   // face centre on the sphere texture (u=.25 = +z)

function drawFace(g, s, st) {
  const { skin, lip = '#b36a5e', iris = '#4a3020', brow = '#2a1e18' } = s;
  g.fillStyle = skin; g.fillRect(0, 0, FACE_W, FACE_H);
  const zombie = st.expr === 'zombie';
  // soft cheek shading
  g.fillStyle = 'rgba(160,80,60,0.10)';
  g.beginPath(); g.ellipse(FX - 58, FY + 52, 26, 16, 0, 0, 7); g.ellipse(FX + 58, FY + 52, 26, 16, 0, 0, 7); g.fill();
  if (zombie) {
    g.strokeStyle = 'rgba(70,40,60,0.55)'; g.lineWidth = 3;
    for (let i = 0; i < 9; i++) { g.beginPath(); const x = FX - 90 + i * 22, y = FY + 10 + (i % 3) * 30; g.moveTo(x, y); g.lineTo(x + 10, y + 18); g.lineTo(x + 2, y + 34); g.stroke(); }
    g.fillStyle = 'rgba(60,20,30,0.45)'; g.beginPath(); g.ellipse(FX - 46, FY + 4, 30, 22, 0, 0, 7); g.ellipse(FX + 46, FY + 4, 30, 22, 0, 0, 7); g.fill();
  }
  g.save(); g.translate(FX, FY); g.scale(1.32, 1.32); g.translate(-FX, -FY);
  const ex = 44, ey = FY - 4;
  const wide = st.expr === 'scared' ? 1.3 : st.expr === 'angry' ? 0.75 : st.expr === 'sad' ? 0.85 : 1;
  for (const sx of [-1, 1]) {
    const x = FX + sx * ex;
    if (st.blink && !zombie) {
      g.strokeStyle = '#151012'; g.lineWidth = 6; g.beginPath(); g.moveTo(x - 24, ey + 2); g.quadraticCurveTo(x, ey + 9, x + 24, ey + 2); g.stroke();
    } else {
      g.fillStyle = zombie ? '#d9ddd2' : '#f7f3ec';
      g.beginPath(); g.ellipse(x, ey, 25, 13 * wide, 0, 0, 7); g.fill();
      if (zombie) { g.fillStyle = '#b8beb4'; g.beginPath(); g.arc(x + sx * 2, ey + 1, 8, 0, 7); g.fill(); }
      else {
        const lx = (st.look || 0) * 9;
        g.fillStyle = iris; g.beginPath(); g.arc(x + lx, ey + 1, st.expr === 'scared' ? 9 : 11, 0, 7); g.fill();
        g.fillStyle = '#100c0c'; g.beginPath(); g.arc(x + lx, ey + 1, 5, 0, 7); g.fill();
        g.fillStyle = '#fff'; g.beginPath(); g.arc(x + lx - 4, ey - 4, 3, 0, 7); g.fill();
      }
      g.strokeStyle = '#151012'; g.lineWidth = 6;
      g.beginPath(); g.ellipse(x, ey, 26, 13.5 * wide, 0, Math.PI * 1.02, Math.PI * 1.98); g.stroke();   // upper lid
      g.lineWidth = 2.5; g.beginPath(); g.ellipse(x, ey, 25, 13 * wide, 0, 0.15, Math.PI - 0.15); g.stroke();
    }
    // brows
    g.strokeStyle = brow; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath();
    const by = ey - 30 - (st.expr === 'scared' ? 8 : 0);
    if (st.expr === 'angry' || zombie) { g.moveTo(x + sx * 26, by - 6); g.lineTo(x - sx * 22, by + 8); }
    else if (st.expr === 'sad' || st.expr === 'scared') { g.moveTo(x + sx * 26, by + 6); g.lineTo(x - sx * 22, by - 6); }
    else { g.moveTo(x - 26, by + 2); g.quadraticCurveTo(x, by - 6, x + 26, by + 1); }
    g.stroke();
  }
  // nose
  g.strokeStyle = 'rgba(90,50,40,0.75)'; g.lineWidth = 3.5; g.beginPath(); g.moveTo(FX + 3, FY + 8); g.lineTo(FX - 6, FY + 44); g.lineTo(FX + 6, FY + 47); g.stroke();
  // mouth
  const my = FY + 78, m = st.mouth || 0;
  if (m > 0.08) {
    const oh = 4 + m * 15;
    g.fillStyle = '#4a1a1e'; g.beginPath(); g.ellipse(FX, my + oh * 0.3, 18 + m * 4, oh, 0, 0, 7); g.fill();
    g.fillStyle = '#f2ece4'; g.fillRect(FX - 13, my + oh * 0.3 - oh + 1, 26, Math.min(6, oh * 0.5));
    g.strokeStyle = lip; g.lineWidth = 3.5; g.beginPath(); g.ellipse(FX, my + oh * 0.3, 19 + m * 4, oh + 1, 0, 0, 7); g.stroke();
  } else {
    g.strokeStyle = zombie ? '#5a1818' : lip; g.lineWidth = 5; g.beginPath();
    if (st.expr === 'smile') { g.moveTo(FX - 22, my - 3); g.quadraticCurveTo(FX, my + 12, FX + 22, my - 3); }
    else if (st.expr === 'sad' || st.expr === 'scared') { g.moveTo(FX - 18, my + 5); g.quadraticCurveTo(FX, my - 4, FX + 18, my + 5); }
    else { g.moveTo(FX - 18, my); g.quadraticCurveTo(FX, my + 3, FX + 18, my); }
    g.stroke();
  }
  g.restore();
  if (zombie || s.blood) {
    g.fillStyle = 'rgba(110,12,18,0.85)';
    g.beginPath(); g.ellipse(FX + 4, my + 14, 16, 8, 0, 0, 7); g.fill();
    g.fillRect(FX - 4, my + 14, 6, 40); g.fillRect(FX + 10, my + 14, 5, 26);
  }
}

function hairMeshes(head, s, r) {
  const H = toon(s.hair);
  const st = s.hairStyle;
  const topCap = (k = 1.07, theta = 0.5) => mesh(new THREE.SphereGeometry(r * k, 32, 16, 0, Math.PI * 2, 0, Math.PI * theta), H, 0, 0.01, -0.005, head);
  const backCap = (k = 1.08, theta = 0.78) => mesh(new THREE.SphereGeometry(r * k, 32, 16, Math.PI * 0.92, Math.PI * 1.16, 0, Math.PI * theta), H, 0, 0, 0, head);
  if (st === 'long' || st === 'longBangs' || st === 'ponytail' || st === 'bob') {
    topCap(1.07, 0.36); backCap(1.08, 0.8);
    if (st === 'long' || st === 'longBangs') {
      mesh(cap(r * 0.78, r * 1.6), H, 0, -r * 1.2, -r * 0.45, head, { scale: [1.25, 1, 0.55] });
      mesh(cap(r * 0.25, r * 1.6), H, -r * 0.88, -r * 0.85, r * 0.05, head);
      mesh(cap(r * 0.25, r * 1.6), H, r * 0.88, -r * 0.85, r * 0.05, head);
    }
    if (st === 'bob') { mesh(cap(r * 0.7, r * 0.5), H, 0, -r * 0.55, -r * 0.35, head, { scale: [1.45, 1, 0.9] }); }
    if (st === 'ponytail') mesh(cap(r * 0.3, r * 1.4), H, 0, -r * 0.6, -r * 1.05, head, { rot: [0.35, 0, 0] });
    if (st === 'longBangs' || st === 'bob') mesh(new THREE.SphereGeometry(r * 1.085, 32, 8, Math.PI * 0.12, Math.PI * 0.76, Math.PI * 0.2, Math.PI * 0.2), H, 0, 0, 0, head, { scale: [0.92, 1.13, 1.0] });
  } else if (st === 'short' || st === 'messy') {
    topCap(1.06, 0.35); backCap(1.06, 0.62);
    if (st === 'messy') for (let i = 0; i < 5; i++) mesh(cap(r * 0.16, r * 0.4), H, (i - 2) * r * 0.3, r * 0.95, r * 0.35, head, { rot: [-0.9, 0, (i - 2) * 0.3] });
  } else if (st === 'buzz') {
    topCap(1.02, 0.34); backCap(1.02, 0.6);
  } else if (st === 'bald') {
    backCap(1.03, 0.62).scale.set(1, 0.7, 1);
  } else if (st === 'cap') {
    topCap(1.08, 0.36).material = toon(s.capColor || 0x30343c);
    mesh(box(r * 1.3, r * 0.08, r * 0.9), toon(s.capColor || 0x30343c), 0, r * 0.45, r * 1.05, head, { rot: [0.15, 0, 0] });
  }
}

function torsoGeo(female) {
  const pts = female
    ? [[0.001, 0], [0.17, 0.0], [0.172, 0.08], [0.15, 0.2], [0.168, 0.31], [0.18, 0.39], [0.182, 0.46], [0.14, 0.52], [0.065, 0.56], [0.001, 0.565]]
    : [[0.001, 0], [0.175, 0.0], [0.18, 0.1], [0.178, 0.22], [0.198, 0.36], [0.215, 0.46], [0.19, 0.52], [0.085, 0.57], [0.001, 0.575]];
  const g = new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 28);
  g.scale(1, 1, 0.7);
  return g;
}

export const POSES = {
  stand: {},
  sit: { hipsY: -0.47, thighL: [-1.5, 0, 0.06], thighR: [-1.5, 0, -0.06], kneeL: 1.5, kneeR: 1.5, armL: [-0.35, 0, 0.12], armR: [-0.35, 0, -0.12], elbowL: -0.6, elbowR: -0.6 },
  sitTurn: { hipsY: -0.47, thighL: [-1.5, 0, 0.1], thighR: [-1.5, 0, -0.06], kneeL: 1.5, kneeR: 1.4, spine: [0, 0.35, 0], neck: [0, 0.25, 0], armL: [-0.5, 0, 0.3], elbowL: -0.9, armR: [-0.2, 0, -0.25], elbowR: -0.4 },
  lie: { spine: [0, 0, 0], armL: [0.1, 0, 0.2], armR: [-0.4, 0, -0.5], elbowR: -1.4 },
  lieSide: { thighL: [-0.5, 0, 0], thighR: [-0.7, 0, 0], kneeL: 0.9, kneeR: 1.1, armL: [-1.2, 0, 0.1], elbowL: -1.2, armR: [-1.0, 0, -0.1], elbowR: -1.6 },
  crouch: { hipsY: -0.42, spine: [0.45, 0, 0], thighL: [-1.7, 0, 0.15], thighR: [-1.2, 0, -0.1], kneeL: 2.2, kneeR: 2.1, armL: [-0.8, 0, 0.2], elbowL: -0.8, armR: [-0.8, 0, -0.2], elbowR: -0.8 },
  armsUp: { armL: [-2.6, 0, 0.3], armR: [-2.6, 0, -0.3], elbowL: -0.3, elbowR: -0.3 },
  reach: { spine: [0.15, 0, 0], armR: [-1.4, 0, -0.1], elbowR: -0.2, armL: [-0.3, 0, 0.1] },
  hug: { armL: [-1.3, 0.4, 0.4], elbowL: -1.4, armR: [-1.3, -0.4, -0.4], elbowR: -1.4 },
  holdHead: { armL: [-2.2, 0.6, 0.8], elbowL: -2.2, armR: [-2.2, -0.6, -0.8], elbowR: -2.2, neck: [0.2, 0, 0] },
  phone: { armR: [-0.9, -0.2, -0.1], elbowR: -1.3, neck: [0.35, 0, 0], armL: [-0.2, 0, 0.12] },
  point: { armR: [-1.55, -0.3, 0], elbowR: -0.05 },
  zombie: { spine: [0.25, 0, 0.08], neck: [-0.15, 0, 0.25], armL: [-1.3, 0, 0.15], armR: [-1.1, 0, -0.1], elbowL: -0.3, elbowR: -0.5 },
  fallen: { spine: [0.1, 0, 0.3], armL: [-0.3, 0, 1.2], armR: [0.2, 0, -1.4], thighL: [-0.3, 0, 0.2], thighR: [0.2, 0, -0.2], kneeL: 0.6 },
};
const KEYS = ['spine', 'neck', 'head', 'armL', 'armR', 'thighL', 'thighR'];
const SCAL = ['elbowL', 'elbowR', 'kneeL', 'kneeR', 'hipsY'];

export function mixPose(a, b, k) {
  const o = {};
  for (const key of KEYS) { const va = a[key] || [0, 0, 0], vb = b[key] || [0, 0, 0]; o[key] = va.map((v, i) => v + (vb[i] - v) * k); }
  for (const key of SCAL) { const va = a[key] || 0, vb = b[key] || 0; o[key] = va + (vb - va) * k; }
  return o;
}
export function addPose(a, b) {
  const o = { ...a };
  for (const key of KEYS) if (b[key]) o[key] = (a[key] || [0, 0, 0]).map((v, i) => v + b[key][i]);
  for (const key of SCAL) if (b[key]) o[key] = (a[key] || 0) + b[key];
  return o;
}
export function walkCycle(t, speed = 1, run = false) {
  const p = t * (run ? 9.5 : 6.2) * speed;
  const a = run ? 0.9 : 0.45, s = Math.sin(p);
  return {
    thighL: [-s * a, 0, 0.03], thighR: [s * a, 0, -0.03], kneeL: Math.max(0, Math.sin(p + 1.4)) * a * 1.4 + 0.05, kneeR: Math.max(0, Math.sin(p + 1.4 + Math.PI)) * a * 1.4 + 0.05,
    armL: [s * a * 0.8, 0, 0.1], armR: [-s * a * 0.8, 0, -0.1], elbowL: run ? -1.4 : -0.3, elbowR: run ? -1.4 : -0.3,
    spine: [run ? 0.25 : 0.04, Math.sin(p) * 0.06, 0], hipsY: -Math.abs(Math.cos(p)) * (run ? 0.05 : 0.02),
  };
}

// Lay a character down. (fx,fy,fz) = feet position, yaw = direction the head points (0 => head towards -z),
// roll rotates around the body axis (0 = on the back, +-PI/2 = on a side).
export function layDown(ch, fx, fy, fz, yaw = 0, roll = 0) {
  if (!ch.wrap) {
    ch.wrap = new THREE.Group(); ch.rollG = new THREE.Group(); ch.wrap.add(ch.rollG);
    const parent = ch.root.parent; if (parent) parent.add(ch.wrap); ch.rollG.add(ch.root);
  }
  ch.wrap.position.set(fx, fy, fz); ch.wrap.rotation.set(0, yaw, 0);
  ch.rollG.rotation.set(0, 0, roll);
  ch.root.position.set(0, 0, 0); ch.root.rotation.set(-Math.PI / 2, 0, 0);
  return ch;
}
export function standUp(ch) { if (ch.wrap) { ch.wrap.position.set(0, 0, 0); ch.wrap.rotation.set(0, 0, 0); ch.rollG.rotation.set(0, 0, 0); } ch.root.rotation.set(0, 0, 0); }

export function makeChar(spec) {
  const s = { skin: '#f0c9a8', hair: 0x2a1d18, hairStyle: 'short', top: 0x7a8a99, legs: 0x2e3340, shoes: 0x1f1f22, female: false, height: 1, ...spec };
  const SK = toon(new THREE.Color(s.skin).getHex());
  const TOP = toon(s.top), LEG = toon(s.legs), SHOE = toon(s.shoes);
  const root = new THREE.Group(); root.scale.setScalar(s.height);
  const hips = new THREE.Group(); hips.position.y = 0.95; root.add(hips);
  mesh(sph(0.18, 20, 12), LEG, 0, 0.03, 0, hips, { scale: [1, 0.62, 0.74] });
  const spine = new THREE.Group(); hips.add(spine);
  mesh(torsoGeo(s.female), TOP, 0, 0, 0, spine);
  if (s.jacket) mesh(box(0.05, 0.5, 0.02), toon(s.jacket), 0, 0.27, 0.115, spine);
  const neck = new THREE.Group(); neck.position.y = 0.54; spine.add(neck);
  mesh(cap(0.045, 0.07), SK, 0, 0.03, 0, neck);
  const head = new THREE.Group(); head.position.y = 0.17; neck.add(head);
  const r = 0.128;
  const faceTex = canvasTex(FACE_W, FACE_H, (g) => drawFace(g, s, {}));
  const faceMat = toon(0xffffff, { map: faceTex });
  const headMesh = mesh(new THREE.SphereGeometry(r, 40, 28), faceMat, 0, 0, 0, head, { scale: [0.9, 1.13, 1.0] });
  // ears + jaw volume
  mesh(sph(0.025, 10, 8), SK, -r * 0.9, -0.005, 0, head, { scale: [0.5, 1, 0.8] });
  mesh(sph(0.025, 10, 8), SK, r * 0.9, -0.005, 0, head, { scale: [0.5, 1, 0.8] });
  hairMeshes(head, s, r);
  if (s.glasses) {
    const gm = toon(0x111111);
    for (const sx of [-1, 1]) mesh(new THREE.TorusGeometry(0.026, 0.004, 6, 20), gm, sx * 0.04, 0.0, r * 0.98, head);
  }
  const limbs = {};
  for (const side of ['L', 'R']) {
    const sx = side === 'L' ? -1 : 1;
    const arm = new THREE.Group(); arm.position.set(sx * (s.female ? 0.175 : 0.2), 0.47, 0); spine.add(arm);
    mesh(sph(0.055, 14, 10), TOP, 0, -0.01, 0, arm);
    const upper = mesh(cap(0.056, 0.21), TOP, 0, -0.14, 0, arm);
    const elbow = new THREE.Group(); elbow.position.y = -0.29; arm.add(elbow);
    mesh(cap(s.shortSleeves ? 0.043 : 0.05, 0.19), s.shortSleeves ? SK : TOP, 0, -0.12, 0, elbow);
    const hand = new THREE.Group(); hand.position.y = -0.27; elbow.add(hand);
    mesh(sph(0.045, 14, 10), SK, 0, -0.03, 0.005, hand, { scale: [0.85, 1.25, 0.55] });
    mesh(cap(0.013, 0.04), SK, -sx * 0.035, -0.02, 0.02, hand, { rot: [0, 0, sx * 0.5] });
    const thigh = new THREE.Group(); thigh.position.set(sx * 0.09, 0, 0); hips.add(thigh);
    mesh(cap(0.088, 0.28), LEG, 0, -0.22, 0, thigh);
    const knee = new THREE.Group(); knee.position.y = -0.45; thigh.add(knee);
    mesh(cap(0.068, 0.3), LEG, 0, -0.21, 0, knee);
    const foot = new THREE.Group(); foot.position.y = -0.44; knee.add(foot);
    mesh(box(0.1, 0.07, 0.24), SHOE, 0, -0.025, 0.05, foot);
    limbs['arm' + side] = arm; limbs['elbow' + side] = elbow; limbs['thigh' + side] = thigh; limbs['knee' + side] = knee; limbs['hand' + side] = hand;
  }
  if (s.blood) {
    const bm = toon(0x6e1016);
    mesh(sph(0.06, 10, 8), bm, 0.05, 0.38, 0.11, spine, { scale: [1, 1.5, 0.3] });
  }
  root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

  const faceCache = new Map();
  const ch = {
    root, hips, spine, neck, head, limbs, spec: s, mouth: 0, expr: s.expr || 'neutral', look: 0, blinkOff: Math.random() * 3,
    pose(p) {
      const v = (k) => p[k] || [0, 0, 0];
      spine.rotation.set(...v('spine')); neck.rotation.set(...v('neck')); head.rotation.set(...v('head'));
      const aL = v('armL'), aR = v('armR'); limbs.armL.rotation.set(aL[0], aL[1], aL[2] - 0.12); limbs.armR.rotation.set(aR[0], aR[1], aR[2] + 0.12);
      limbs.thighL.rotation.set(...v('thighL')); limbs.thighR.rotation.set(...v('thighR'));
      limbs.elbowL.rotation.x = p.elbowL || 0; limbs.elbowR.rotation.x = p.elbowR || 0;
      limbs.kneeL.rotation.x = p.kneeL || 0; limbs.kneeR.rotation.x = p.kneeR || 0;
      hips.position.y = 0.95 + (p.hipsY || 0);
    },
    updateFace(t) {
      const blink = ch.expr !== 'zombie' && ((t + ch.blinkOff) % 3.7) < 0.12;
      const m = ch.mouth < 0.1 ? 0 : ch.mouth < 0.4 ? 0.5 : 1;
      const key = `${ch.expr}|${blink}|${m}|${ch.look}`;
      if (!faceCache.has(key)) {
        const tex = canvasTex(FACE_W, FACE_H, (g) => drawFace(g, s, { expr: ch.expr, blink, mouth: m, look: ch.look }));
        faceCache.set(key, tex);
      }
      faceMat.map = faceCache.get(key);
    },
  };
  ch.pose({});
  return ch;
}

// presets for this series
export const CAST = {
  EMILIA: { skin: '#f2cdb0', hair: 0x1c1517, hairStyle: 'longBangs', top: 0xd9a43a, legs: 0x262a36, female: true, height: 0.97, iris: '#5a3a24' },
  NACHBAR: { skin: '#e8c0a0', hair: 0x8a8a8a, hairStyle: 'bald', top: 0x5f6f5a, legs: 0x3b3b40, height: 1.02 },
  ZOMBIE1: { skin: '#b9b8a6', hair: 0x3a2a20, hairStyle: 'messy', top: 0x6a6a7a, legs: 0x2a2a30, expr: 'zombie', blood: true },
  ZOMBIE2: { skin: '#b4b6a8', hair: 0x6a4a30, hairStyle: 'long', top: 0x8a4a5a, legs: 0x30303a, female: true, expr: 'zombie', blood: true },
  ZOMBIE3: { skin: '#a9a99a', hair: 0x111111, hairStyle: 'buzz', top: 0x2f4a6a, legs: 0x22222a, expr: 'zombie', blood: true, height: 1.05 },
};
