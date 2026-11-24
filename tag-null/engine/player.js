// Episode player: builds the timeline from beats, drives cameras/actors/fx per frame, draws the HUD.
import { THREE, camera, scene, renderFrame, post, W, H, lights } from './core.js';
import * as sets from './sets.js';
import * as fx from './fx.js';
import * as pov from './pov.js';
import * as chars from './characters.js';
import * as core from './core.js';

const E = { THREE, scene, camera, post, lights, sets, fx, pov, chars, core, cast: {}, timing: {}, marks: {} };
window.E = E;

// ------------------------------------------------------------- helpers for episodes
const noise = (t, s) => Math.sin(t * 1.7 + s) * 0.5 + Math.sin(t * 3.1 + s * 2) * 0.3 + Math.sin(t * 7.3 + s * 3) * 0.2;
E.ease = (k) => { k = Math.max(0, Math.min(1, k)); return k * k * (3 - 2 * k); };
E.lerp = (a, b, k) => a + (b - a) * k;
E.v3 = (x, y, z) => new THREE.Vector3(x, y, z);
// keyframes: [[t, value], ...] where value is number or array
E.key = (keys, t) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, a] = keys[i], [t1, b] = keys[i + 1];
    if (t <= t1) { const k = E.ease((t - t0) / (t1 - t0)); return Array.isArray(a) ? a.map((v, j) => v + (b[j] - v) * k) : a + (b - a) * k; }
  }
  return keys[keys.length - 1][1];
};
let shakeExtra = 0;
E.cam = (pos, look, o = {}) => {
  const T = E.T;
  const sh = (o.shake ?? 0.006) + shakeExtra;
  const br = o.breathe ?? 0.008;
  camera.position.set(pos[0] + noise(T, 1) * sh, pos[1] + noise(T, 2) * sh + Math.sin(T * 1.6) * br, pos[2] + noise(T, 3) * sh);
  const l = new THREE.Vector3(look[0] + noise(T, 4) * sh * 3, look[1] + noise(T, 5) * sh * 3, look[2] + noise(T, 6) * sh * 3);
  camera.up.set(0, 1, 0); camera.lookAt(l);
  if (o.roll) camera.rotateZ(o.roll);
  camera.fov = o.fov ?? 92; camera.updateProjectionMatrix();
};
// walking bob for POV
E.walkBob = (t, amt = 0.035, rate = 7) => [Math.sin(t * rate / 2) * amt * 0.5, -Math.abs(Math.sin(t * rate / 2)) * amt, 0];
E.face = (ch, x, z) => { const p = ch.root.position; ch.root.rotation.y = Math.atan2(x - p.x, z - p.z); };
E.actor = (name, spec) => { const ch = chars.makeChar(spec || chars.CAST[name]); scene.add(ch.root); E.cast[name] = ch; return ch; };

// phone screen drawing
E.phone = (draw) => { const t = pov.phoneTex; const g = t.userData.ctx; g.save(); draw(g, 360, 760); g.restore(); t.needsUpdate = true; };
E.peephole = (g) => {  // HUD mask for door-spy view
  const gr = g.createRadialGradient(W / 2, H * 0.45, W * 0.36, W / 2, H * 0.45, W * 0.48);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,1)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = '#000'; g.beginPath(); g.rect(0, 0, W, H); g.arc(W / 2, H * 0.45, W * 0.48, 0, Math.PI * 2, true); g.fill();
};
E.ui = {
  status(g, time = '06:47') { g.fillStyle = '#fff'; g.font = 'bold 24px sans-serif'; g.textAlign = 'left'; g.fillText(time, 26, 40); g.textAlign = 'right'; g.fillText('5G ▮▮▮', 336, 40); g.textAlign = 'left'; },
  lock(g, time, date, notes, k = 99) {
    const gr = g.createLinearGradient(0, 0, 0, 760); gr.addColorStop(0, '#1d2a4a'); gr.addColorStop(1, '#5a3a5c'); g.fillStyle = gr; g.fillRect(0, 0, 360, 760);
    E.ui.status(g, time); g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = 'bold 92px sans-serif'; g.fillText(time, 180, 170);
    g.font = '22px sans-serif'; g.fillText(date, 180, 210); g.textAlign = 'left';
    let y = 250;
    notes.slice(0, Math.max(0, Math.floor(k))).forEach(([app, title, body, red]) => {
      const lines = wrap(g, body, 290, '20px sans-serif');
      const h = 66 + lines.length * 24;
      g.fillStyle = red ? 'rgba(170,30,40,0.95)' : 'rgba(240,240,245,0.95)'; rr(g, 14, y, 332, h, 18); g.fill();
      g.fillStyle = red ? '#ffd0d0' : '#777'; g.font = 'bold 16px sans-serif'; g.fillText(app.toUpperCase(), 30, y + 26);
      g.fillStyle = red ? '#fff' : '#111'; g.font = 'bold 21px sans-serif'; g.fillText(title, 30, y + 52);
      g.font = '20px sans-serif'; lines.forEach((l, i) => g.fillText(l, 30, y + 78 + i * 24));
      y += h + 12;
    });
  },
  chat(g, contact, msgs, time = '06:50', k = 99) {
    g.fillStyle = '#0f1014'; g.fillRect(0, 0, 360, 760); E.ui.status(g, time);
    g.fillStyle = '#1d1f26'; g.fillRect(0, 56, 360, 64); g.fillStyle = '#fff'; g.font = 'bold 26px sans-serif'; g.textAlign = 'center'; g.fillText(contact, 180, 98); g.textAlign = 'left';
    let y = 140;
    msgs.slice(0, Math.max(0, Math.floor(k))).forEach(([side, text]) => {
      const lines = wrap(g, text, 240, '22px sans-serif'); const w = Math.max(...lines.map(l => g.measureText(l).width)) + 30; const h = lines.length * 28 + 22;
      const x = side === 'in' ? 16 : 344 - w;
      g.fillStyle = side === 'in' ? '#2c2f3a' : '#2f6fe0'; rr(g, x, y, w, h, 18); g.fill();
      g.fillStyle = '#fff'; lines.forEach((l, i) => g.fillText(l, x + 15, y + 32 + i * 28)); y += h + 12;
    });
  },
  news(g, head, sub, time = '06:48') {
    g.fillStyle = '#f4f4f6'; g.fillRect(0, 0, 360, 760); g.fillStyle = '#c4151c'; g.fillRect(0, 0, 360, 120); E.ui.status(g, time);
    g.fillStyle = '#fff'; g.font = 'bold 34px sans-serif'; g.fillText('EILMELDUNG', 22, 100);
    g.fillStyle = '#334'; g.fillRect(16, 140, 328, 190);
    g.fillStyle = '#111'; g.font = 'bold 27px sans-serif'; wrap(g, head, 320, 'bold 27px sans-serif').forEach((l, i) => g.fillText(l, 20, 380 + i * 34));
    g.fillStyle = '#444'; g.font = '21px sans-serif'; wrap(g, sub, 320, '21px sans-serif').forEach((l, i) => g.fillText(l, 20, 500 + i * 27));
  },
  call(g, name, status) {
    g.fillStyle = '#16181d'; g.fillRect(0, 0, 360, 760); g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = 'bold 36px sans-serif'; g.fillText(name, 180, 220);
    g.font = '22px sans-serif'; g.fillStyle = '#aab'; g.fillText(status, 180, 262); g.fillStyle = '#d33'; g.beginPath(); g.arc(180, 640, 38, 0, 7); g.fill(); g.textAlign = 'left';
  },
  nosignal(g) { g.fillStyle = '#0f1014'; g.fillRect(0, 0, 360, 760); g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = 'bold 30px sans-serif'; g.fillText('Kein Netz', 180, 380); g.font = '20px sans-serif'; g.fillStyle = '#99a'; g.fillText('Nur Notrufe', 180, 414); g.textAlign = 'left'; },
};
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function wrap(g, text, maxw, font) { g.font = font; const out = []; let cur = ''; for (const w of text.split(' ')) { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > maxw && cur) { out.push(cur); cur = w; } else cur = t; } if (cur) out.push(cur); return out; }

// ------------------------------------------------------------- timeline
let EP = null, TL = null;
E.lines = () => {
  const out = [];
  for (const sh of EP.shots) for (const b of sh.beats) if (b[0] === 'say') out.push({ who: b[1], text: b[2], voice: (b[3] || {}).voice });
  return out;
};
function buildTimeline() {
  let t = 0; const lines = [], sfx = [], vfx = [], subs = [], music = [];
  for (const sh of EP.shots) {
    sh.start = t; sh.marks = {}; let cur = t;
    for (const b of sh.beats) {
      const [kind] = b;
      if (kind === 'say') {
        const tm = E.timing[b[1] + '|' + b[2]] || { d: b[2].length * 0.07, env: [] };
        const o = b[3] || {};
        lines.push({ who: b[1], text: b[2], start: cur, d: tm.d, env: tm.env, file: tm.file, vol: o.vol ?? 1, fx: o.fx || null });
        if (!o.nosub) subs.push({ text: o.sub || b[2], start: cur, d: tm.d, who: b[1] });
        cur += tm.d + (o.gap ?? 0.18);
      } else if (kind === 'wait') cur += b[1];
      else if (kind === 'text') { subs.push({ text: b[1], start: cur, d: b[2] || 1.6, who: null }); cur += b[2] || 1.6; }
      else if (kind === 'sfx') { const o = b[2] || {}; sfx.push({ name: b[1], start: cur + (o.off || 0), vol: o.vol ?? 1, d: o.d || null, pan: o.pan || 0 }); }
      else if (kind === 'fx') { const o = b[2] || {}; vfx.push({ kind: b[1], start: cur + (o.off || 0), d: o.d || 0.3, k: o.k ?? 1 }); }
      else if (kind === 'mark') sh.marks[b[1]] = cur - t;
    }
    sh.d = Math.max(0.3, cur - t); t = cur;
    music.push({ start: sh.start, d: sh.d, music: sh.music || 'none', mvol: sh.mvol ?? 1, amb: sh.amb || 'none', avol: sh.avol ?? 1 });
  }
  return { lines, sfx, vfx, subs, music, d: t };
}

let curShot = null;
function shotAt(T) { for (const sh of EP.shots) if (T < sh.start + sh.d) return sh; return EP.shots[EP.shots.length - 1]; }

function applyVfx(T) {
  post.flash = 0; post.red = 0; post.dark = 0; post.aberr = 0; shakeExtra = 0;
  let black = false;
  for (const v of TL.vfx) {
    if (T < v.start || T > v.start + v.d) continue;
    const k = (T - v.start) / v.d;
    if (v.kind === 'flash') post.flash = Math.max(post.flash, (1 - k) * v.k);
    else if (v.kind === 'shake') shakeExtra += 0.06 * v.k * (1 - k);
    else if (v.kind === 'red') post.red = Math.max(post.red, Math.sin(Math.PI * k) * 0.5 * v.k);
    else if (v.kind === 'fadeout') post.dark = Math.max(post.dark, k);
    else if (v.kind === 'fadein') post.dark = Math.max(post.dark, 1 - k);
    else if (v.kind === 'black' || v.kind === 'blink') black = true;
    else if (v.kind === 'aberr') post.aberr = Math.max(post.aberr, (1 - k) * v.k);
  }
  return black;
}

function lipSync(T) {
  for (const ch of Object.values(E.cast)) ch.mouth = 0;
  for (const ln of TL.lines) {
    if (T >= ln.start && T < ln.start + ln.d && E.cast[ln.who]) {
      const i = Math.floor((T - ln.start) * 24); E.cast[ln.who].mouth = ln.env[i] ?? 0;
    }
  }
  for (const ch of Object.values(E.cast)) ch.updateFace(T);
}

function drawSubs(g, T) {
  for (const s of TL.subs) {
    if (T < s.start || T > s.start + s.d + 0.1) continue;
    const words = s.text.split(' '); const parts = []; let cur = [];
    for (const w of words) { cur.push(w); if (cur.length >= 3 || /[,.!?…:]$/.test(w)) { parts.push(cur.join(' ')); cur = []; } }
    if (cur.length) parts.push(cur.join(' '));
    const total = parts.reduce((a, p) => a + p.length, 0); let acc = s.start, txt = parts[parts.length - 1];
    for (const p of parts) { const dd = s.d * p.length / total; if (T < acc + dd) { txt = p; break; } acc += dd; }
    const size = txt.length < 14 ? 62 : txt.length < 20 ? 54 : 46;
    g.font = `900 ${size}px "DejaVu Sans", sans-serif`; g.textAlign = 'center'; g.lineJoin = 'round';
    g.lineWidth = 11; g.strokeStyle = '#000'; g.strokeText(txt, W / 2, H * 0.63);
    g.fillStyle = s.who ? '#ffe23a' : '#ffffff'; g.fillText(txt, W / 2, H * 0.63);
    return;
  }
}

// in-story date/time overlay: meta.clock = {date:'2026-11-24', time:'06:45'}; a shot may set clock:'21:40' or date
const WD = ['SONNTAG', 'MONTAG', 'DIENSTAG', 'MITTWOCH', 'DONNERSTAG', 'FREITAG', 'SAMSTAG'];
const MO = ['JANUAR', 'FEBRUAR', 'MÄRZ', 'APRIL', 'MAI', 'JUNI', 'JULI', 'AUGUST', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DEZEMBER'];
function drawClock(g, T) {
  let base = EP.meta.clock.time, date = EP.meta.clock.date, t0 = 0;
  for (const sh of EP.shots) { if (sh.start > T) break; if (sh.clock) { base = sh.clock; t0 = sh.start; } if (sh.date) date = sh.date; }
  const [h, m] = base.split(':').map(Number);
  const total = h * 3600 + m * 60 + (T - t0) * (EP.meta.clock.speed || 1);
  const tm = Math.floor(total / 60) % 1440, secs = Math.floor(total) % 60;
  const d = new Date(date + 'T12:00:00');
  const l1 = `${WD[d.getDay()]}, ${d.getDate()}. ${MO[d.getMonth()]} ${d.getFullYear()}`;
  const l2 = `${String(Math.floor(tm / 60)).padStart(2, '0')}:${String(tm % 60).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  g.save(); g.textAlign = 'left'; g.lineJoin = 'round';
  g.font = '800 22px "DejaVu Sans", sans-serif'; g.lineWidth = 6; g.strokeStyle = 'rgba(0,0,0,0.75)'; g.strokeText(l1, 28, 196); g.fillStyle = '#fff'; g.fillText(l1, 28, 196);
  g.font = '900 46px "DejaVu Sans Mono", monospace'; g.lineWidth = 8; g.strokeText(l2, 26, 246); g.fillStyle = '#fff'; g.fillText(l2, 26, 246);
  if (Math.floor(T * 2) % 2 === 0) { g.fillStyle = '#e22'; g.beginPath(); g.arc(282, 230, 9, 0, 7); g.fill(); }
  g.restore();
}

function hud(g, T) {
  if (curShot && curShot.hud) curShot.hud(g, T - curShot.start, curShot.d);
  if (curShot && curShot.card) {
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    const k = Math.min(1, (T - curShot.start) / 0.5);
    g.globalAlpha = k; g.fillStyle = '#fff'; g.textAlign = 'center';
    let fs = 64; g.font = `900 ${fs}px "DejaVu Sans", sans-serif`; while (g.measureText(curShot.card[0]).width > W - 60 && fs > 30) { fs -= 4; g.font = `900 ${fs}px "DejaVu Sans", sans-serif`; } g.fillText(curShot.card[0], W / 2, H / 2 - 10);
    if (curShot.card[1]) { g.font = '600 32px "DejaVu Sans", sans-serif'; g.fillStyle = '#bbb'; g.fillText(curShot.card[1], W / 2, H / 2 + 46); }
    g.globalAlpha = 1;
  }
  if (EP.meta && EP.meta.clock && !(curShot && curShot.card)) drawClock(g, T);
  if (EP.meta && T < 2.6 && !(curShot && curShot.card)) {
    g.globalAlpha = Math.min(1, (2.6 - T) / 0.5); g.textAlign = 'left'; g.font = '800 26px "DejaVu Sans", sans-serif';
    g.lineWidth = 6; g.strokeStyle = 'rgba(0,0,0,0.8)'; g.strokeText(`TAG NULL · Teil ${EP.meta.n}`, 28, 300); g.fillStyle = '#fff'; g.fillText(`TAG NULL · Teil ${EP.meta.n}`, 28, 300);
    g.globalAlpha = 1;
  }
  drawSubs(g, T);
}

window.loadEpisode = async (name) => {
  const mod = await import(`/episodes/${name}.js`);
  EP = mod.default(E);
  return E.lines();
};
window.setup = (timing) => {
  E.timing = timing; TL = buildTimeline(); E.TL = TL;
  return { d: TL.d, lines: TL.lines.map(l => ({ who: l.who, text: l.text, start: l.start, file: l.file, vol: l.vol, fx: l.fx })), sfx: TL.sfx, music: TL.music };
};
window.frameAt = (T, q = 0.9) => {
  E.T = T;
  const sh = shotAt(T);
  if (sh !== curShot) { curShot = sh; Object.assign(post, { fisheye: 0.28, sat: 0.92, exposure: 1.0, vignette: 0.55 }); post.tint.setRGB(1, 1, 1); if (sh.init) sh.init(); }
  const lt = T - sh.start;
  if (sh.update) sh.update(lt, sh.d, T);
  lipSync(T);
  const black = applyVfx(T);
  const c = renderFrame(T, (g, t) => { if (black || sh.card) { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); } hud(g, T); });
  return c.toDataURL('image/jpeg', q);
};
window.ready = true;
