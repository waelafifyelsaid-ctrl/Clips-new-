// TEIL 6 – Hinterhaus
export default function (E) {
  const { sets, fx, pov, chars, scene, post, THREE, lights } = E;
  const { toon, flat, mesh, box, sph, cyl, noOutline } = E.core;
  sets.sky('#151a36', '#4a3048');
  const A = sets.hallAndStairs({ ox: 50 });          // our building
  const B = sets.hallAndStairs({ ox: 170 });         // Lena's building (rear)
  const Y = sets.courtyard(120);
  const XA = (x, y, z) => [A.ox + x, y, z], XB = (x, y, z) => [B.ox + x, y, z], XC = (x, y, z) => [Y.ox + x, y, z];

  const em = E.actor('EMILIA');
  const berger = E.actor('BERGER', { ...chars.CAST.ZOMBIE2, top: 0x6a5a8a, hair: 0x9a7a5a, hairStyle: 'bob' });
  const lena = E.actor('LENA', { skin: '#f2cdb0', hair: 0xc89050, hairStyle: 'ponytail', top: 0xd85a8a, legs: 0x3a4a6a, female: true, height: 0.72 });
  const dad = E.actor('DAD', { ...chars.CAST.ZOMBIE3, top: 0x4a4a4a });
  const walker = E.actor('W0', chars.CAST.ZOMBIE1);
  const horde = [];
  const hs = [chars.CAST.ZOMBIE1, chars.CAST.ZOMBIE2, chars.CAST.ZOMBIE3];
  for (let i = 0; i < 9; i++) horde.push(E.actor('H' + i, { ...hs[i % 3], top: [0x5a6a7a, 0x7a4a4a, 0x4a5a3a, 0x6a6a6a, 0x3a3a5a][i % 5], height: 0.92 + (i % 4) * 0.05 }));
  const flash = new THREE.SpotLight(0xfff4e0, 36, 16, 0.55, 0.5, 1.0); E.camera.add(flash); flash.position.set(0.12, -0.12, 0); E.camera.add(flash.target); flash.target.position.set(0, -0.15, -3);
  const bat = new THREE.Group(); mesh(cyl(0.022, 0.035, 0.75, 10), toon(0xb08a5a), 0, 0.3, 0, bat); E.camera.add(bat);
  function batPose(swing = 0) { bat.position.set(0.2 - swing * 0.25, -0.32 + swing * 0.15, -0.42); bat.rotation.set(-0.5 - swing * 1.2, swing * 0.8, -0.3 - swing * 1.4); }
  const hide = (...cs) => cs.forEach(c => c.root.position.set(0, -80, 0));
  function dark() { for (const S of [A, B]) { S.lampH.intensity = 0; S.lampS.intensity = 0; S.lampLow.intensity = 0; } lights.amb.intensity = 0.32; lights.hemi.intensity = 0.2; lights.key.intensity = 0.05; }
  function zwalk(c, t, x, z, ry, speed = 0.6) { c.root.position.set(x, 0, z); c.root.rotation.y = ry; c.pose(chars.mixPose(chars.walkCycle(t * speed), chars.POSES.zombie, 0.6)); c.expr = 'zombie'; }

  const shots = [
    // HOOK: she charges up – bat swing
    {
      beats: [['sfx', 'zombie_scream', { vol: 1 }], ['wait', 1.0], ['sfx', 'whoosh', { vol: 0.9 }], ['wait', 0.25], ['sfx', 'thud', { vol: 1 }], ['sfx', 'fall', { off: 0.3, vol: 0.9 }], ['fx', 'flash', { d: 0.2, k: 0.5 }], ['fx', 'shake', { d: 0.8, k: 1.5 }],
        ['wait', 1.0], ['say', 'EMILIA', 'Lauf! Runter, an ihr vorbei! Schnell!'], ['wait', 0.2]],
      music: 'action', amb: 'none',
      init() { dark(); pov.setPov('none'); hide(lena, dad, walker, ...horde); em.root.position.set(...XA(1.68, 0, -5.0)); berger.expr = 'zombie'; },
      update(lt) {
        const k = Math.min(1, lt / 1.2);
        if (lt < 1.25) { berger.root.position.set(...XA(1.68, E.lerp(-2.6, -0.9, k), E.lerp(-7.9, -6.8, k))); berger.root.rotation.y = 0; berger.pose(chars.mixPose(chars.walkCycle(lt, 1, true), chars.POSES.zombie, 0.5)); }
        else { const f = Math.min(1, (lt - 1.25) / 0.6); berger.root.position.set(...XA(1.68, E.lerp(-0.9, -2.6, f), E.lerp(-6.8, -8.0, f))); berger.pose(chars.POSES.fallen); berger.root.rotation.x = -f * 1.2; }
        batPose(E.key([[0, 0], [1.0, -0.3], [1.25, 1], [1.8, 0.6], [2.4, 0]], lt));
        E.cam(XA(1.68, 0.62, -6.3), XA(1.68, -0.6, -7.3), { fov: 80, shake: lt > 1.2 && lt < 2 ? 0.03 : 0.01 });
      },
    },
    // run down
    {
      beats: [['sfx', 'run', { d: 3.2, vol: 0.8 }], ['wait', 3.0], ['sfx', 'whoosh', { vol: 0.5 }]],
      music: 'action', amb: 'none',
      init() { berger.root.rotation.x = 0; chars.layDown(berger, ...XA(0.8, -2.5, -6.8), 1.2, 0.6); berger.pose(chars.POSES.fallen); },
      update(lt) {
        const k = Math.min(1, lt / 2.4); const b = E.walkBob(lt, 0.05, 11);
        const p = [A.ox + 1.68 + b[0], E.lerp(0.58, -1.0, k) + b[1], E.lerp(-6.3, -8.0, k)];
        E.cam(p, E.key([[0, XA(1.6, -2.2, -8.5)], [1.4, XA(0.6, -2.4, -7.2)], [3, XA(-1.6, -1.6, -6.6)]], lt), { fov: 88, shake: 0.02 });
        em.root.position.set(p[0] - 0.4, p[1] - 1.6, p[2] + 0.8); em.root.rotation.y = Math.PI; em.pose(chars.walkCycle(lt, 1, true));
      },
    },
    { card: ['HINTERHOF', '00:21 Uhr'], clock: '00:21', beats: [['wait', 1.4]], music: 'none', amb: 'night' },
    // courtyard: quiet – a walker at the gate, hide behind the bins
    {
      beats: [['sfx', 'creak', { vol: 0.5 }], ['wait', 1.8], ['say', 'EMILIA', 'Runter! Hinter die Tonnen!', { vol: 0.6 }], ['sfx', 'growl', { off: 0.4, d: 3, vol: 0.6 }], ['sfx', 'heartbeat', { d: 5, vol: 0.9 }], ['wait', 3.0], ['sfx', 'growl', { d: 2, vol: 0.8 }], ['text', 'Er bleibt stehen…', 1.8], ['wait', 1.4], ['text', 'Nicht atmen.', 1.6], ['wait', 1.6]],
      music: 'none', amb: 'night',
      init() { hide(berger); flash.intensity = 0; Y.lamp.intensity = 34; lights.amb.intensity = 0.5; bat.visible = true; batPose(0); em.root.position.set(...XC(5.7, 0, 5.1)); em.root.rotation.y = -Math.PI / 2; em.pose(chars.POSES.crouch); em.expr = 'scared'; },
      update(lt) {
        const wz = lt < 4.5 ? E.lerp(-6, 0, lt / 4.5) : lt < 8 ? 0 : E.lerp(0, 6, Math.min(1, (lt - 8) / 4)); zwalk(walker, lt < 4.5 || lt > 8 ? lt : 0, Y.ox - 8.5, wz, lt > 4.5 && lt < 8 ? Math.PI / 2 : 0, 0.5);
        const p = E.key([[0, XC(1.5, 1.62, 6.6)], [1.6, XC(3.4, 1.62, 5.4)], [2.6, XC(5.0, 0.95, 4.6)]], lt);
        const look = E.key([[0, XC(0, 1.4, 0)], [2.6, XC(-5, 1.2, 0)], [8, XC(-7, 1.4, 0)]], lt);
        E.cam(p, look, { fov: lt > 3 ? 70 : 84, shake: 0.006 });
      },
    },
    // cross the courtyard, rear building stairs
    {
      beats: [['say', 'EMILIA', 'Er ist weg. Los.', { vol: 0.6 }], ['sfx', 'run', { d: 3.2, vol: 0.5 }], ['wait', 3.2], ['sfx', 'creak', { vol: 0.6 }], ['wait', 0.6]],
      music: 'tension', amb: 'night',
      init() { hide(walker); },
      update(lt) {
        const k = Math.min(1, lt / 4.4); const b = E.walkBob(lt, 0.04, 10);
        const p = [Y.ox + E.lerp(4.6, 1.5, k) + b[0], 1.6 + b[1], E.lerp(4.4, -6.2, k)];
        E.cam(p, XC(1.5, 1.5, -7.5), { fov: 86, shake: 0.012 });
        em.root.position.set(p[0] + 0.5, 0, p[2] - 0.9); em.root.rotation.y = Math.PI; em.pose(chars.walkCycle(lt, 1, true));
      },
    },
    {
      beats: [['sfx', 'steps', { d: 4, vol: 0.5 }], ['wait', 2.4], ['text', 'Vierter Stock. Ihre Tür steht offen.', 2.2]],
      music: 'tension', amb: 'none',
      init() { dark(); flash.intensity = 36; em.root.position.set(0, -80, 0); B.doorPivot.rotation.y = -0.6; },
      update(lt) {
        const k = Math.min(1, lt / 3.2); const b = E.walkBob(lt, 0.03, 7);
        E.cam([B.ox + 1.68 + b[0], E.lerp(-1.0, 1.62, k) + b[1], E.lerp(-8.0, -5.6, k)], XB(1.68, 1.5, -4.2), { fov: 84, shake: 0.007 });
      },
    },
    // inside: the father, the bathroom
    {
      beats: [['sfx', 'growl', { d: 3, vol: 0.5 }], ['wait', 1.6], ['say', 'EMILIA', 'Da hinten… das muss ihr Vater sein. Nicht bewegen.', { vol: 0.55 }], ['wait', 1.2], ['say', 'EMILIA', 'Lena? Lena, bist du da? Wir sind die mit der Taschenlampe.', { vol: 0.6 }], ['wait', 0.8], ['sfx', 'click', { vol: 0.5 }],
        ['say', 'LENA', 'Seid ihr echt? Seid ihr nicht krank?', { fx: 'far', vol: 0.9 }], ['say', 'EMILIA', 'Wir sind echt. Mach auf, Süße. Ganz leise.', { vol: 0.6 }], ['sfx', 'lock', { vol: 0.7 }], ['wait', 0.8]],
      music: 'heart', amb: 'none',
      init() { em.root.position.set(...XB(0.45, 0, -3.25)); em.root.rotation.y = -Math.PI / 2 + 0.3; em.pose(chars.POSES.stand); em.expr = 'scared'; B.bathDoor.rotation.y = 0;
        lena.root.position.set(...XB(1.4, 0, -3.9)); lena.root.rotation.y = -Math.PI / 2; lena.pose(chars.POSES.stand); lena.expr = 'scared'; },
      update(lt, d) {
        zwalk(dad, lt, B.ox + Math.sin(lt * 0.3) * 0.2, 0.0, Math.PI, 0.2); dad.root.position.z = -0.6 + Math.sin(lt * 0.4) * 0.2;
        B.bathDoor.rotation.y = E.key([[0, 0], [d - 0.8, 0], [d, 0.9]], lt);
        E.cam(XB(-0.45, 1.62, -4.5), lt < 3 ? XB(0, 1.2, -0.6) : XB(0.8, 1.2, -3.9), { fov: 82, shake: 0.006 });
      },
    },
    {
      beats: [['say', 'LENA', 'Papa ist… Papa ist so komisch geworden.', { vol: 0.9 }], ['wait', 0.3], ['say', 'EMILIA', 'Ich weiß. Schau nicht hin. Halt dich an mir fest.', { vol: 0.65 }],
        ['sfx', 'zombie_scream', { vol: 0.9 }], ['fx', 'shake', { d: 0.5 }], ['wait', 0.6], ['say', 'EMILIA', 'Raus! Sofort raus!'], ['sfx', 'run', { d: 2.5, vol: 0.7 }], ['sfx', 'bang', { off: 2.2, vol: 1 }], ['wait', 2.6]],
      music: 'action', amb: 'none',
      update(lt, d) {
        lena.root.position.set(...XB(0.5, 0, -3.8)); lena.root.rotation.y = Math.PI * 0.75; lena.pose(chars.POSES.hug); lena.expr = 'sad';
        em.pose(chars.POSES.hug); E.face(em, B.ox + 0.5, -3.8);
        const turn = lt > 4.4; zwalk(dad, lt, B.ox, E.lerp(-0.6, -2.4, Math.max(0, (lt - 4.4) / 3)), turn ? Math.PI : 0, turn ? 1.2 : 0.2);
        E.cam(XB(-0.35, 1.6, -4.3), turn ? XB(0, 1.4, -1.5) : XB(0.3, 1.1, -3.7), { fov: 80, shake: turn ? 0.02 : 0.006 });
      },
    },
    // CLIFF: back at the courtyard door – the horde pours in
    {
      beats: [['wait', 1.0], ['text', 'Zurück. Über den Hof. Nur noch…', 2.0], ['sfx', 'crowd_panic', { d: 4, vol: 0.4 }], ['sfx', 'growl', { d: 4, vol: 0.9 }], ['wait', 2.4],
        ['say', 'EMILIA', 'Oh nein… oh nein, nein, nein…', { vol: 0.7 }], ['wait', 1.2], ['sfx', 'riser', { d: 1.5 }], ['wait', 1.3], ['sfx', 'bang', { vol: 1 }], ['fx', 'shake', { d: 0.5, k: 1.3 }],
        ['wait', 0.2], ['sfx', 'boom', { vol: 1 }], ['fx', 'black', { off: 0.05, d: 1.4 }], ['wait', 1.4]],
      music: 'tension', amb: 'night',
      init() { hide(dad, lena); flash.intensity = 0; Y.gate.rotation.y = -1.6; em.root.position.set(...XC(0.6, 0, -6.5)); em.root.rotation.y = 0.4; em.pose(chars.POSES.stand); em.expr = 'scared'; },
      update(lt, d) {
        horde.forEach((h, i) => { const t = lt * (0.55 + (i % 3) * 0.12) - i * 0.25; zwalk(h, lt + i, Y.ox - 9 + Math.max(0, t) * 2.2 + (i % 3) * 0.5, -1.2 + (i % 4) * 0.8 + Math.max(0, t) * 0.9, Math.PI / 2 + 0.2, 0.9); });
        const last = lt > d - 2.0;
        if (last) { const h = horde[0]; h.root.position.set(...XC(1.5, 0, -5.7)); h.root.rotation.y = Math.PI; h.pose(chars.POSES.zombie); }
        E.cam(XC(1.5, 1.62, -6.7), last ? XC(1.5, 1.6, -5.5) : XC(-3, 1.2, 0), { fov: last ? 70 : 82, shake: 0.006 });
      },
      hud(g) { g.fillStyle = 'rgba(160,190,210,0.06)'; g.fillRect(0, 0, 720, 1280); },
    },
    { card: ['TEIL 7', 'Zurück'], beats: [['wait', 2.2]], music: 'none', amb: 'none' },
  ];
  return { meta: { n: 6, title: 'Hinterhaus', clock: { date: '2026-11-25', time: '00:14' } }, shots };
}
