// TEIL 5 – SOS
export default function (E) {
  const { sets, fx, pov, chars, scene, post, THREE, lights } = E;
  const { toon, flat, mesh, box, sph, cyl, noOutline } = E.core;
  sets.sky('#151a36', '#b0502e');
  const room = sets.apartmentBedroom({ night: true });
  const opp = sets.oppositeWindowBuilding(20);
  const S = sets.hallAndStairs({ ox: 50 });
  const X = (x, y, z) => [S.ox + x, y, z];
  const WIN = [1.8, 1.58, 0.25];
  const moon = new THREE.DirectionalLight(0x8090c0, 0.6); moon.position.set(30, 40, -20); scene.add(moon);
  const fires = [[110, 16, 30, 5], [150, 22, -40, 7]].map(([x, y, z, s]) => fx.fire(scene, x, y, z, s));

  const lena = E.actor('LENA', { skin: '#f2cdb0', hair: 0xc89050, hairStyle: 'ponytail', top: 0xd85a8a, legs: 0x3a4a6a, female: true, height: 0.72 });
  const zb = E.actor('ZB', { ...chars.CAST.ZOMBIE3, top: 0x4a4a4a });
  const em = E.actor('EMILIA');
  // a cat (jump scare)
  const cat = new THREE.Group(); scene.add(cat);
  const cm = toon(0x1a1a1e);
  mesh(new THREE.CapsuleGeometry(0.07, 0.22, 6, 10), cm, 0, 0.14, 0, cat, { rot: [Math.PI / 2, 0, 0] });
  mesh(sph(0.07, 10, 8), cm, 0, 0.2, 0.18, cat);
  for (const sx of [-1, 1]) mesh(new THREE.ConeGeometry(0.025, 0.06, 6), cm, sx * 0.035, 0.27, 0.18, cat);
  for (const sx of [-1, 1]) noOutline(mesh(sph(0.012, 6, 4), flat(0xc8ff40), sx * 0.028, 0.21, 0.245, cat, { cast: false }));
  mesh(new THREE.CapsuleGeometry(0.015, 0.25, 4, 6), cm, 0, 0.25, -0.2, cat, { rot: [0.6, 0, 0] });
  cat.position.set(0, -60, 0);
  const berger = E.actor('BERGER', { ...chars.CAST.ZOMBIE2, top: 0x6a5a8a, hair: 0x9a7a5a, hairStyle: 'bob' });
  const body = E.actor('BODY', { skin: '#d8b090', hair: 0x333333, hairStyle: 'short', top: 0x4a6a4a, legs: 0x2a2a2a });

  // flashlight (spot from camera) + Emilia's phone light
  const flash = new THREE.SpotLight(0xfff4e0, 0, 14, 0.42, 0.5, 1.1); E.camera.add(flash); flash.position.set(0.12, -0.12, 0); E.camera.add(flash.target); flash.target.position.set(0, -0.15, -3);
  const torch = noOutline(mesh(sph(0.05, 8, 6), flat(0xffffff), 0, -50, 0, scene, { cast: false }));
  // baseball bat / knife props (held in POV right hand)
  const bat = new THREE.Group(); mesh(cyl(0.022, 0.035, 0.75, 10), toon(0xb08a5a), 0, 0.3, 0, bat); E.camera.add(bat); bat.visible = false;
  // blood on the stairs
  for (let i = 0; i < 6; i++) mesh(box(0.25 + (i % 2) * 0.1, 0.006, 0.18), toon(0x5a0c10), ...X(1.5 + (i % 3) * 0.1, 0.004 - i * 0.26, -5.45 - i * 0.27), scene, { cast: false });

  function darkStair() { S.lampH.intensity = 0; S.lampS.intensity = 0; S.lampLow.intensity = 0; lights.amb.intensity = 0.12; lights.hemi.intensity = 0.06; lights.key.intensity = 0.02; }
  function nightRoom() { lights.amb.intensity = 0.35; lights.hemi.intensity = 0.25; lights.key.intensity = 0.15; }
  function lenaWin(t, run) {
    const p = run ? Math.min(1, t / 0.8) : 0;
    lena.root.position.set(opp.FX0 + 0.55 + p * 1.8, 0.7, -0.1 + p * 0.6); lena.root.rotation.y = run ? Math.PI / 2 : -Math.PI / 2;
    lena.pose(run ? chars.walkCycle(t, 1, true) : chars.addPose(chars.POSES.stand, { armR: [-2.4, 0.3, 0.3], elbowR: -0.3 })); lena.expr = run ? 'scared' : 'smile';
  }

  const shots = [
    // HOOK: she turns, sees it, runs – the torch falls
    {
      beats: [['sfx', 'heartbeat', { d: 3 }], ['wait', 0.9], ['sfx', 'scream_far', { vol: 0.9 }], ['wait', 1.2], ['sfx', 'thud', { vol: 0.4 }], ['wait', 0.8], ['say', 'EMILIA', 'NEIN! Lauf! LAUF!'], ['wait', 0.6]],
      music: 'none', amb: 'night',
      init() { nightRoom(); opp.roomLight.intensity = 16; lights.amb.intensity = 0.6; pov.setPov('none'); zb.root.position.set(opp.FX0 + 1.3, 0.7, 0.25); zb.root.rotation.y = -Math.PI / 2; zb.expr = 'zombie'; },
      update(lt) {
        lenaWin(lt - 0.9, lt > 0.9);
        const zp = Math.max(0, lt - 1.0); zb.root.position.set(opp.FX0 + 1.3 + zp * 1.2, 0.7, 0.25 + zp * 0.5); zb.root.rotation.y = lt > 1.0 ? Math.PI / 2 - 0.3 : -Math.PI / 2;
        zb.pose(lt > 1 ? chars.mixPose(chars.walkCycle(lt, 1, true), chars.POSES.zombie, 0.5) : chars.POSES.zombie);
        torch.position.set(opp.FX0 + 0.3, lt > 2.2 ? 0.8 : 1.4, 0.0); torch.visible = true;
        E.cam(WIN, [opp.FX0 + 0.6, 1.4, -0.1], { fov: E.key([[0, 10], [2, 18]], lt), shake: 0.003 }); fires.forEach(f => f.update(E.T));
      },
    },
    // decision
    {
      beats: [['say', 'EMILIA', 'Wir müssen zu ihr. Jetzt sofort.'], ['text', 'Durchs Treppenhaus? Mit der Frau aus dem Zweiten da draußen?', 2.8],
        ['say', 'EMILIA', 'Sie ist zehn! Willst du hier sitzen und zuhören, wie sie schreit?'], ['wait', 0.6], ['sfx', 'click', { vol: 0.4 }],
        ['say', 'EMILIA', 'Nimm den Schläger aus dem Flur. Ich nehm das Messer.'], ['wait', 0.5],
        ['text', 'Sie hat recht. Sie hat verdammt nochmal recht.', 2.4], ['say', 'EMILIA', 'Wir gehen rein, holen sie und kommen sofort zurück. Fünf Minuten.'], ['wait', 0.6]],
      music: 'tension', amb: 'night',
      init() { torch.visible = false; lena.root.position.set(0, -60, 0); zb.root.position.set(0, -60, 0); em.root.position.set(1.4, 0, -0.6); em.pose(chars.POSES.stand); em.expr = 'angry'; },
      update(lt) { E.face(em, WIN[0] - 0.1, WIN[2]); E.cam([WIN[0] - 0.1, WIN[1], WIN[2]], [1.4, 1.5, -0.6], { fov: 78 }); },
    },
    { card: ['00:13 Uhr', 'Treppenhaus'], beats: [['sfx', 'whoosh', { vol: 0.5 }], ['wait', 1.6]], music: 'none', amb: 'none' },
    // hall: peephole + Krause in the bathroom
    {
      beats: [['sfx', 'bang', { vol: 0.5 }], ['wait', 0.6], ['say', 'EMILIA', 'Pssst. Er hört uns.', { vol: 0.7 }], ['sfx', 'growl', { d: 2, vol: 0.5 }], ['wait', 1.4], ['text', 'Der Spion. Erst nachschauen.', 2.0], ['wait', 0.4]],
      music: 'drone', amb: 'night',
      init() { darkStair(); flash.intensity = 30; bat.visible = true; bat.position.set(0.2, -0.32, -0.42); bat.rotation.set(-0.5, 0, -0.3); em.root.position.set(...X(-0.2, 0, -2.4)); em.pose(chars.addPose(chars.POSES.stand, { armR: [-0.9, 0, -0.1], elbowR: -0.6 })); em.expr = 'scared'; },
      update(lt) { E.face(em, S.ox + 0.3, -1.3); const p = E.key([[0, X(0.1, 1.62, -1.2)], [4, X(0.05, 1.62, -3.6)]], lt); E.cam(p, E.key([[0, X(0.8, 1.2, -3.9)], [3, X(0.8, 1.2, -3.9)], [4.5, X(0, 1.5, -5)]], lt), { fov: 82 }); S.bathDoor.rotation.y = Math.sin(E.T * 30) * 0.004; },
    },
    {
      beats: [['wait', 1.4], ['text', 'Leer. Nur… Blut.', 1.8], ['wait', 0.6]],
      music: 'drone', amb: 'night',
      init() { post.fisheye = 1.6; post.vignette = 0.2; S.lampS.intensity = 0.25; bat.visible = false; },
      update(lt) { E.cam(X(0, 1.55, -5.06), X(0.6, 0.6, -6.4), { fov: 100, shake: 0.002 }); },
      hud(g) { E.peephole(g); },
    },
    // open the door, step out
    {
      beats: [['sfx', 'lock', { vol: 0.6 }], ['wait', 0.5], ['sfx', 'creak', { d: 1.4, vol: 0.8 }], ['wait', 1.6], ['say', 'EMILIA', 'Leise… ganz leise.', { vol: 0.6 }], ['sfx', 'steps', { d: 3, vol: 0.35 }], ['wait', 2.8]],
      music: 'heart', amb: 'none',
      init() { darkStair(); flash.intensity = 30; bat.visible = true; },
      update(lt) {
        S.doorPivot.rotation.y = -E.key([[0, 0], [0.6, 0], [2.0, 1.2]], lt) * 1.0;
        const p = E.key([[0, X(0, 1.62, -4.2)], [2.2, X(0, 1.62, -4.4)], [6, X(0.4, 1.62, -6.0)]], lt); const b = E.walkBob(lt, lt > 2.2 ? 0.02 : 0);
        E.cam([p[0] + b[0], p[1] + b[1], p[2]], E.key([[0, X(0, 1.4, -6)], [4, X(1.6, 0.5, -6.5)], [6, X(1.7, -1.0, -7.5)]], lt), { fov: 84, shake: 0.006 });
      },
    },
    // jump scare: Krause's door is ajar – a cat
    {
      beats: [['say', 'EMILIA', 'Warte… da an Krauses Tür. Da bewegt sich was.', { vol: 0.6 }], ['wait', 1.4], ['sfx', 'creak', { vol: 0.5 }], ['wait', 0.9],
        ['sfx', 'zombie_scream', { vol: 0.5 }], ['sfx', 'whoosh', { vol: 0.8 }], ['fx', 'shake', { d: 0.6, k: 1.2 }], ['wait', 1.2], ['say', 'EMILIA', 'Eine Katze… nur eine Katze.', { vol: 0.65 }], ['sfx', 'breath', { d: 2.5, vol: 0.7 }], ['wait', 1.4]],
      music: 'heart', amb: 'none',
      init() { darkStair(); flash.intensity = 30; bat.visible = true; S.doorPivot.rotation.y = -1.2; },
      update(lt) {
        const jump = Math.max(0, lt - 3.0);
        if (jump > 0 && jump < 1.2) { cat.position.set(S.ox - 1.6 + jump * 2.2, Math.sin(Math.min(1, jump / 0.6) * Math.PI) * 0.7, -7.8 + jump * 2.0); cat.rotation.y = 0.8; } else if (jump >= 1.2) cat.position.set(0, -60, 0); else cat.position.set(S.ox - 1.6, 0, -8.0);
        const look = jump > 0 ? X(-0.6 + Math.min(1, jump) * 1.0, 0.4, -6.6) : X(-1.6, 1.0, -8.0);
        E.cam(X(-0.3, 1.62, -5.6), look, { fov: 80, shake: jump > 0 && jump < 1.5 ? 0.03 : 0.006 });
        em.root.position.set(...X(0.3, 0, -5.2)); E.face(em, S.ox - 0.3, -5.6);
      },
    },
    // going down the stairs
    {
      beats: [['sfx', 'steps', { d: 4.5, vol: 0.4 }], ['sfx', 'creak', { off: 1.6, vol: 0.7 }], ['wait', 1.8], ['sfx', 'flicker', { vol: 0.5 }], ['fx', 'black', { d: 0.12 }], ['wait', 0.5], ['fx', 'black', { d: 0.2 }], ['wait', 1.4], ['text', 'Die Taschenlampe… nicht jetzt.', 2.0], ['say', 'EMILIA', 'Bleib stehen.', { vol: 0.6 }], ['wait', 0.8], ['text', 'Da unten. Ein Geräusch.', 1.8], ['sfx', 'growl', { d: 2.6, vol: 0.4 }], ['wait', 1.6]],
      music: 'heart', amb: 'none',
      init() { em.root.position.set(...X(1.68, 0, -5.0)); em.pose(chars.POSES.stand); em.expr = 'scared';
        berger.root.position.set(...X(-0.1, -2.6, -7.0)); berger.root.rotation.y = Math.PI; berger.pose(chars.addPose(chars.POSES.crouch, { spine: [0.9, 0, 0] })); berger.expr = 'zombie';
        chars.layDown(body, ...X(-1.0, -2.48, -7.6), -Math.PI / 2, 0.3); body.pose(chars.POSES.fallen); },
      update(lt) {
        const k = Math.min(1, lt / 2.0);
        const p = [S.ox + 1.68, E.lerp(1.62, 1.62 - 1.04, k), E.lerp(-5.2, -6.3, k)]; const b = E.walkBob(lt, k < 1 ? 0.03 : 0);
        E.cam([p[0] + b[0], p[1] + b[1], p[2]], X(0.4, -2.2, -7.6), { fov: 82, shake: 0.007 });
        berger.pose(chars.addPose(chars.POSES.crouch, { spine: [0.9 + Math.sin(E.T * 8) * 0.06, 0, 0] }));
        E.face(em, p[0], p[2]);
      },
    },
    // CLIFF: Frau Berger turns into the light
    {
      beats: [['sfx', 'heartbeat', { d: 6, vol: 1 }], ['wait', 1.6], ['say', 'EMILIA', 'Oh Gott… das ist Frau Berger…', { vol: 0.55 }], ['wait', 1.4], ['sfx', 'riser', { d: 2.2 }], ['wait', 1.8],
        ['sfx', 'zombie_scream', { vol: 1 }], ['fx', 'shake', { d: 0.8 }], ['wait', 0.5], ['sfx', 'boom', { vol: 1 }], ['fx', 'black', { off: 0.05, d: 1.4 }], ['wait', 1.4]],
      music: 'none', amb: 'none',
      update(lt) {
        const turn = Math.min(1, Math.max(0, (lt - 3.4) / 1.4));
        berger.root.rotation.y = Math.PI - turn * Math.PI * 0.95;
        berger.pose(chars.addPose(chars.POSES.crouch, { spine: [0.9 - turn * 0.6, 0, 0], neck: [-0.2 * turn, 0, 0] }));
        const fov = E.key([[0, 70], [5, 40]], lt);
        E.cam(X(1.68, 0.58, -6.3), X(-0.1, -2.1, -7.0), { fov, shake: 0.005 });
      },
    },
    { card: ['TEIL 6', 'Hinterhaus'], beats: [['wait', 2.2]], music: 'none', amb: 'none', init() { flash.intensity = 0; } },
  ];
  return { meta: { n: 5, title: 'SOS' }, shots };
}
