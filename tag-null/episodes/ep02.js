// TEIL 2 – Die Tür
export default function (E) {
  const { sets, fx, pov, chars, scene, post } = E;
  sets.sky('#8aa6cf', '#f4d9b4');
  const S = sets.hallAndStairs({ ox: 50 });
  const X = (x, y, z) => [S.ox + x, y, z];

  const sitFloor = { hipsY: -0.8, spine: [-0.15, 0, 0], thighL: [-1.45, 0, 0.1], thighR: [-1.4, 0, -0.15], kneeL: 0.35, kneeR: 0.6, armL: [-0.2, 0, 0.2], elbowL: -0.4, armR: [-0.7, 0, -0.1], elbowR: -1.6, neck: [0.2, 0, 0] };
  const kr = E.actor('NACHBAR', { ...chars.CAST.NACHBAR, blood: true, skin: '#e2c2aa' });
  const em = E.actor('EMILIA');
  const zw = E.actor('ZW', { ...chars.CAST.ZOMBIE2, top: 0x6a5a8a, hair: 0x9a7a5a, hairStyle: 'bob' });

  const DOOR = X(0, 1.6, -4.4);
  function door(open) { S.doorPivot.rotation.y = -open * 1.45; }
  function krOutside(t) { kr.root.position.set(...X(Math.sin(t * 1.3) * 0.06, 0, -5.75)); kr.root.rotation.y = Math.sin(t * 0.8) * 0.15; kr.pose(chars.addPose(chars.POSES.stand, { armR: [-0.6, 0, -0.1], elbowR: -1.3, spine: [0.1, 0, 0] })); kr.expr = 'scared'; }
  function zwStairs(k) {   // 0 = bottom of stairs, 1 = on the landing
    const z = E.lerp(-8.9, -5.9, k), y = E.lerp(-2.45, 0, Math.min(1, k * 1.1));
    zw.root.position.set(...X(1.7 - Math.max(0, k - 0.85) * 6, y, z)); zw.root.rotation.y = k > 0.85 ? -Math.PI / 2 : 0;
  }
  function emBehind(pose = chars.POSES.reach, expr = 'scared') { em.root.position.set(...X(-0.15, 0, -2.5)); em.root.rotation.y = Math.PI; em.pose(pose); em.expr = expr; }

  const shots = [
    // HOOK – pounding door, walking down the hall
    {
      beats: [['sfx', 'bang3', { vol: 1 }], ['fx', 'shake', { d: 0.5, k: 0.5 }], ['say', 'NACHBAR', 'Hilfe! Macht auf! Bitte!', { fx: 'far' }], ['sfx', 'steps', { d: 2.2, vol: 0.5 }],
        ['sfx', 'bang3', { off: 0.3, vol: 1 }], ['wait', 1.2], ['say', 'EMILIA', 'Warte! Nicht…', { vol: 0.9 }], ['wait', 0.3]],
      music: 'heart', amb: 'room',
      init() { door(0); emBehind(); pov.setPov('none'); krOutside(0); zwStairs(0); zw.pose(chars.POSES.crouch); },
      update(lt) {
        const p = E.key([[0, X(0, 1.62, -0.6)], [3.6, X(0, 1.62, -3.9)]], lt); const b = E.walkBob(lt, 0.025);
        E.cam([p[0] + b[0], p[1] + b[1], p[2]], X(0, 1.4, -5), { fov: 86, shake: 0.006 });
        S.doorPivot.position.z = -4.98 + (Math.floor(lt * 7) % 5 === 0 && lt < 3 ? 0.01 : 0);
        krOutside(E.T);
      },
    },
    // Peephole: Krause
    {
      beats: [['sfx', 'click', { vol: 0.4 }], ['say', 'NACHBAR', 'Ich bin’s! Krause! Von gegenüber! Bitte, ich blute!', { fx: 'far' }], ['wait', 0.3],
        ['say', 'NACHBAR', 'Ihr müsst mir helfen… bitte…', { fx: 'far' }], ['wait', 0.4]],
      music: 'heart', amb: 'room',
      init() { post.fisheye = 1.6; post.vignette = 0.2; },
      update(lt) { krOutside(E.T); E.cam(X(0, 1.55, -5.06), X(0, 1.45, -6.5), { fov: 100, shake: 0.002 }); },
      hud(g) { E.peephole(g); },
    },
    // Argument with Emilia
    {
      beats: [['say', 'EMILIA', 'Das ist Herr Krause… er blutet total.'], ['text', 'Mama hat gesagt: Macht niemandem auf.', 2.4],
        ['say', 'EMILIA', 'Wir können ihn doch nicht da draußen sterben lassen!'], ['sfx', 'bang', { vol: 0.8 }], ['fx', 'shake', { d: 0.3 }], ['wait', 0.6]],
      music: 'tension', mvol: 0.8, amb: 'room',
      init() { em.root.position.set(...X(-0.1, 0, -3.2)); em.root.rotation.y = Math.PI; em.pose(chars.POSES.stand); em.expr = 'sad'; },
      update(lt) { E.face(em, S.ox, -4.0); E.cam(X(0.05, 1.62, -4.0), X(-0.1, 1.5, -3.2), { fov: 82, shake: 0.004 }); krOutside(E.T); },
    },
    // Peephole: something comes up the stairs
    {
      beats: [['wait', 1.4], ['sfx', 'growl', { vol: 0.6, d: 2 }], ['wait', 1.6], ['say', 'NACHBAR', 'Sie kommt hoch! Oh Gott, sie kommt! Macht auf!', { fx: 'far' }], ['wait', 0.4]],
      music: 'tension', amb: 'room',
      init() { post.fisheye = 1.6; post.vignette = 0.2; },
      update(lt, d) {
        krOutside(E.T); kr.root.rotation.y = lt > 1.4 ? 2.6 : 0; // looks back at the stairs
        zw.pose(lt < 1.5 ? chars.mixPose(chars.POSES.crouch, chars.POSES.stand, lt / 1.5) : chars.mixPose(chars.walkCycle(lt * 0.7), chars.POSES.zombie, 0.6));
        zwStairs(Math.max(0, (lt - 1.5) / (d - 1.5)) * 0.55);
        E.cam(X(0, 1.55, -5.06), X(0.4, 1.0, -6.5), { fov: 100, shake: 0.002 });
      },
      hud(g) { E.peephole(g); },
    },
    // Open the door, pull him in, slam
    {
      beats: [['sfx', 'lock', { vol: 0.9 }], ['wait', 0.4], ['sfx', 'click', { vol: 0.6 }], ['wait', 0.4], ['sfx', 'creak', { vol: 0.6 }], ['wait', 0.6], ['say', 'EMILIA', 'Schnell, rein!', { gap: 0.1 }],
        ['sfx', 'zombie_scream', { vol: 0.9 }], ['wait', 0.9], ['sfx', 'bang', { vol: 1 }], ['fx', 'shake', { d: 0.5, k: 1 }], ['wait', 0.3], ['sfx', 'bang3', { vol: 1 }], ['fx', 'shake', { off: 0.2, d: 0.8, k: 0.8 }], ['wait', 1.5]],
      music: 'action', amb: 'room',
      init() { pov.setPov('reach'); },
      update(lt) {
        const open = E.key([[0, 0], [0.9, 0], [1.6, 0.85], [2.6, 0.85], [3.3, 0]], lt); door(open);
        pov.setPov(lt < 2.9 ? 'reach' : 'guard', null, 1);
        // Krause stumbles in past the camera
        const kp = E.key([[0, [0, -5.75]], [1.5, [0, -5.75]], [2.5, [0.2, -4.4]], [3.2, [0.45, -3.6]]], lt);
        kr.root.position.set(...X(kp[0], 0, kp[1])); kr.root.rotation.y = Math.PI; kr.pose(lt > 1.5 && lt < 3 ? chars.walkCycle(lt, 1.2) : chars.POSES.stand);
        // zombie charges across the landing
        zw.pose(chars.mixPose(chars.walkCycle(lt, 1, true), chars.POSES.zombie, 0.5)); zw.expr = 'zombie';
        const zk = Math.min(1, 0.55 + lt * 0.22); zwStairs(Math.min(0.85, zk));
        if (lt > 1.9) { zw.root.position.set(...X(E.lerp(1.2, 0.2, Math.min(1, (lt - 1.9) / 1.0)), 0, -5.9)); zw.root.rotation.y = Math.PI * 0.85; }
        const look = lt < 2.2 ? X(0, 1.45, -6) : X(0, 1.4, -5);
        E.cam(X(-0.15, 1.62, -3.3), look, { fov: 88, shake: lt > 2.9 ? 0.02 : 0.008 });
        if (lt > 3.3) { zw.root.position.set(...X(0.1, 0, -5.4)); }
      },
    },
    // zombie face pressed against the peephole
    {
      beats: [['sfx', 'bang3', { vol: 0.9 }], ['wait', 0.8], ['text', 'Was ist das…', 1.6], ['sfx', 'growl', { vol: 0.9, d: 2.2 }], ['fx', 'red', { d: 2.4, k: 0.6 }], ['wait', 2.4], ['sfx', 'bang', { vol: 1 }], ['fx', 'shake', { d: 0.4 }], ['wait', 0.6]],
      music: 'heart', amb: 'room',
      init() { pov.setPov('none'); post.fisheye = 1.6; post.vignette = 0.2; zw.root.position.set(...X(0.0, 0, -5.7)); zw.root.rotation.y = 0; zw.expr = 'zombie'; kr.root.position.set(0, -50, 0); },
      update(lt) { zw.pose(chars.addPose(chars.POSES.zombie, { spine: [0.35 + Math.sin(lt * 9) * 0.05, 0, 0], neck: [-0.2, Math.sin(lt * 3) * 0.2, 0] })); E.cam(X(0, 1.55, -5.06), X(0, 1.45, -6.5), { fov: 100, shake: 0.004 }); },
      hud(g) { E.peephole(g); },
    },
    // emergency call
    {
      beats: [['say', 'EMILIA', 'Ruf den Notruf an! Schnell!'], ['sfx', 'click', { vol: 0.5 }], ['wait', 0.5], ['sfx', 'ringtone', { d: 1.2, vol: 0.4 }], ['wait', 1.3],
        ['say', 'DURCHSAGE', 'Alle Leitungen sind derzeit belegt. Bitte bleiben Sie in Ihrer Wohnung. Diese Nachricht wiederholt sich.', { fx: 'phone' }], ['wait', 0.6]],
      music: 'drone', amb: 'room',
      init() { pov.setPov('phone'); kr.root.position.set(...X(-0.58, 0, -3.3)); kr.root.rotation.y = Math.PI / 2; kr.pose(sitFloor); zw.root.position.set(0, -50, 0);
        em.root.position.set(...X(0.0, 0, -2.8)); E.face(em, S.ox - 0.58, -3.3); em.pose(chars.POSES.crouch); em.expr = 'scared'; },
      update(lt) {
        E.phone((g) => lt < 2.4 ? E.ui.call(g, '112', 'wird angerufen…') : E.ui.call(g, '112', 'Bandansage'));
        E.cam(X(0.45, 1.5, -4.15), X(-0.3, 0.95, -3.0), { fov: 84, shake: 0.004 });
      },
    },
    // Krause on the floor, Emilia helps
    {
      beats: [['sfx', 'breath', { d: 4, vol: 0.6 }], ['say', 'EMILIA', 'Zeigen Sie mal. Ich bin Pflegeschülerin, okay? Ganz ruhig.'],
        ['say', 'NACHBAR', 'Die Frau Berger… aus dem Zweiten… Sie hat mich einfach… gebissen.'], ['wait', 0.3],
        ['say', 'EMILIA', 'Gebissen?'], ['wait', 0.6],
        ['say', 'NACHBAR', 'Sie stand einfach im Treppenhaus… ihre Augen… ganz weiß. Wie tot.'], ['wait', 0.8], ['sfx', 'bang', { vol: 0.5 }], ['wait', 0.6]],
      music: 'drone', amb: 'room',
      init() { pov.setPov('none'); kr.root.position.set(...X(-0.58, 0, -3.3)); kr.root.rotation.y = Math.PI / 2; kr.pose(sitFloor); kr.expr = 'scared';
        em.root.position.set(...X(0.0, 0, -2.8)); E.face(em, S.ox - 0.58, -3.3); em.pose(chars.POSES.crouch); em.expr = 'sad'; zw.root.position.set(0, -50, 0); },
      update(lt) {
        if (lt > 7.5) { em.expr = 'scared'; E.face(em, S.ox + 0.45, -4.15); }
        E.cam(X(0.45, 1.45, -4.15), X(-0.45, 0.8, -3.1), { fov: 84, shake: 0.004 });
      },
    },
    // Fading
    {
      beats: [['say', 'NACHBAR', 'Mir ist so kalt… warum ist mir so kalt…', { vol: 0.8 }], ['wait', 0.4],
        ['say', 'EMILIA', 'Herr Krause? Bleiben Sie wach! Schauen Sie mich an!'], ['sfx', 'heartbeat', { d: 5, vol: 0.9 }], ['wait', 1.6]],
      music: 'heart', amb: 'room',
      init() { E.face(em, S.ox - 0.58, -3.3); em.expr = 'scared'; kr.expr = 'sad'; },
      update(lt) {
        kr.pose(chars.addPose(sitFloor, { neck: [0.25 + lt * 0.05, 0, 0.2] }));
        E.cam(X(0.3, 0.92, -3.85), X(-0.5, 0.72, -3.3), { fov: 70, shake: 0.004 });
      },
    },
    // CLIFF
    {
      beats: [['wait', 1.0], ['say', 'EMILIA', 'Er… er atmet nicht mehr.', { vol: 0.85 }], ['wait', 1.6], ['text', 'Das Klopfen draußen hat aufgehört.', 2.2], ['wait', 0.8],
        ['sfx', 'riser', { d: 1.8 }], ['wait', 1.6], ['sfx', 'boom', { vol: 1 }], ['fx', 'black', { off: 0.05, d: 1.4 }], ['wait', 1.4]],
      music: 'none', amb: 'room',
      init() { kr.expr = 'sad'; },
      update(lt) {
        kr.pose(chars.addPose(sitFloor, { neck: [0.7, 0, 0.35], armR: [0.6, 0, 0], elbowR: 0 }));
        kr.blinkOff = -E.T + 0.05; // eyes shut
        const p = E.key([[0, X(0.35, 0.95, -3.3)], [6.5, X(-0.05, 0.78, -3.3)]], lt);
        E.cam(p, X(-0.55, 0.68, -3.3), { fov: 62, shake: 0.003 });
        if (lt > 6.4) { kr.blinkOff = 0; kr.expr = 'zombie'; }
      },
    },
    { card: ['TEIL 3', 'Krause'], beats: [['wait', 2.2]], music: 'none', amb: 'none' },
  ];
  return { meta: { n: 2, title: 'Die Tür', clock: { date: '2026-11-24', time: '06:53' } }, shots };
}
