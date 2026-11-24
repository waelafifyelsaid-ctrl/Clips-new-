// TEIL 1 – Der Morgen
export default function (E) {
  const { sets, fx, pov, chars, THREE, scene, post } = E;
  sets.sky('#8aa6cf', '#f4d9b4');
  const room = sets.apartmentBedroom();
  const bed = room.bed;
  // thick duvet over Emilia's half
  const duv = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.3, 1.5), room.duvet.material);
  duv.position.set(bed.x - 0.42, 0.72, bed.z - 0.2); duv.castShadow = duv.receiveShadow = true; room.group.add(duv);

  // --- cast
  const em = E.actor('EMILIA');
  const emHead = [bed.x - 0.42, 0.74, bed.z + 0.8];
  function emInBed() { chars.layDown(em, bed.x - 0.42, 0.7, bed.z + 0.8 - 1.62, Math.PI, Math.PI / 2 - 0.25); em.pose(chars.addPose(chars.POSES.lieSide, { armL: [0.6, 0, 0.3], elbowL: -1.6, armR: [0.9, 0, -0.1], elbowR: -1.2 })); }
  function emStand(x, z, ry, pose = chars.POSES.stand) { chars.standUp(em); em.root.position.set(x, 0, z); em.root.rotation.set(0, ry, 0); em.pose(pose); }

  // street people (world coords: street is around x = 14, ground y = -13)
  const runner = E.actor('RUNNER', { skin: '#e8c4a4', hair: 0x5a3a22, hairStyle: 'short', top: 0x3f6fb0, legs: 0x2a2a30 });
  const z1 = E.actor('Z1', chars.CAST.ZOMBIE1);
  const victim = E.actor('VICTIM', { skin: '#e0b89a', hair: 0x8a6a40, hairStyle: 'ponytail', top: 0xb04a5a, legs: 0x30303a, female: true });
  const z2 = E.actor('Z2', chars.CAST.ZOMBIE2);
  chars.layDown(victim, 13, -12.85, 6, -0.4, 0); victim.pose(chars.POSES.fallen);
  z2.root.position.set(13.4, -13, 4.6); z2.root.rotation.y = 0.2; z2.pose(chars.POSES.crouch);

  // helicopter + explosion + smoke
  const heli = fx.helicopter(scene); heli.g.scale.setScalar(1.3);
  const boom = fx.explosion(scene, 140, 14, -40, 4.2);
  const smoke1 = fx.smokeColumn(scene, 150, 4, 40, 2.2);
  const smoke2 = fx.smokeColumn(scene, 145, 10, -42, 2.8);
  smoke2.g.visible = false;
  const debris = fx.debris(scene, 140, 16, -40, 26); debris.g.scale.setScalar(2);

  // camera anchor points
  const LIE = [bed.x + 0.42, 0.8, bed.z + 0.72];
  const WIN = [1.78, 1.58, 0.25];
  const OUT = [40, -4, -0.2];

  const notes = [
    ['Telefon', 'Mama · 3 verpasste Anrufe', 'Ruf mich bitte sofort an!!', true],
    ['Hallbrück Aktuell', 'EILMELDUNG', 'Militär riegelt Innenstadt ab – mehrere Angriffe gemeldet', false],
    ['Warn-App', 'Extreme Gefahr', 'Bleiben Sie in geschlossenen Räumen. Meiden Sie andere Personen.', true],
  ];
  let explodeAt = 1e9;

  function world(T) {
    smoke1.update(T); heli.update(T);
    if (T >= explodeAt) smoke2.g.visible = true; smoke2.update(T);
  }
  // street action, driven by absolute time window
  function street(lt) {
    const r = lt;
    runner.root.position.set(14.5, -13, -14 + r * 3.6); runner.root.rotation.y = 0; runner.pose(chars.walkCycle(r, 1, true));
    z1.root.position.set(14.2, -13, -17 + r * 3.7); z1.root.rotation.y = 0; z1.pose(chars.mixPose(chars.walkCycle(r * 0.95, 1, true), chars.POSES.zombie, 0.4));
    z2.pose(chars.addPose(chars.POSES.crouch, { spine: [0.15 * Math.sin(r * 6), 0, 0] }));
  }

  const shots = [
    // ---------------- HOOK: flash-forward explosion through the window
    {
      beats: [['wait', 0.5], ['sfx', 'explosion', { vol: 1 }], ['fx', 'flash', { d: 0.9, k: 0.85 }], ['fx', 'shake', { d: 1.8, k: 1.6 }], ['fx', 'aberr', { d: 1.5, k: 1 }],
        ['sfx', 'glass', { off: 0.3, vol: 0.6 }], ['wait', 1.9], ['sfx', 'whoosh', { vol: 0.6 }]],
      music: 'none', amb: 'city',
      init() { emStand(1.2, -0.85, Math.PI / 2 + 0.3, chars.POSES.holdHead); em.expr = 'scared'; pov.setPov('none'); boom.update(-1); },
      update(lt) {
        const t = lt - 0.5; boom.update(t * 1.3); debris.update(t); smoke2.g.visible = true; smoke2.update(E.T); smoke1.update(E.T);
        E.cam([WIN[0] + 0.12, WIN[1], WIN[2] - 0.55], [60, 8, -18], { fov: 82, shake: 0.004 });
      },
    },
    { card: ['3 MINUTEN VORHER', ''], beats: [['sfx', 'boom', { vol: 0.5 }], ['wait', 1.6]], music: 'none', amb: 'none',
      init() { smoke2.g.visible = false; boom.update(-1); debris.update(-1); } },

    // ---------------- wake up
    {
      beats: [['fx', 'fadein', { d: 1.8 }], ['fx', 'blink', { off: 1.9, d: 0.12 }], ['fx', 'blink', { off: 2.4, d: 0.1 }], ['wait', 1.2], ['sfx', 'siren_far', { d: 6, vol: 0.5 }], ['wait', 2.4],
        ['text', 'Sirenen…?', 1.6], ['wait', 0.6]],
      music: 'morning', mvol: 0.8, amb: 'birds',
      init() { emInBed(); em.expr = 'neutral'; pov.setPov('none'); },
      update(lt) {
        em.mouth = 0; em.blinkOff = 0; em.updateFace = em.updateFace; // asleep: eyes closed via expr hack below
        const look = E.key([[0, [LIE[0], 2.7, LIE[2] - 0.6]], [3.2, [LIE[0], 2.7, LIE[2] - 0.6]], [5.2, [emHead[0], emHead[1] + 0.05, emHead[2]]]], lt);
        E.cam(LIE, look, { fov: 90, shake: 0.002, breathe: 0.004 });
        world(E.T);
      },
    },
    // ---------------- Emilia sleeping, phone buzzes
    {
      beats: [['wait', 1.4], ['sfx', 'buzz', { vol: 0.8 }], ['wait', 1.6]],
      music: 'morning', mvol: 0.8, amb: 'birds',
      update(lt) {
        E.cam(LIE, [emHead[0], emHead[1] + 0.03, emHead[2]], { fov: 80, shake: 0.002, breathe: 0.004 });
        world(E.T);
      },
    },
    // ---------------- phone notifications
    {
      beats: [['sfx', 'whoosh', { vol: 0.3 }], ['wait', 1.0], ['sfx', 'ping', { vol: 0.6 }], ['wait', 1.2], ['sfx', 'ping', { vol: 0.6 }], ['wait', 1.2], ['sfx', 'ping', { vol: 0.7 }],
        ['wait', 1.4], ['text', 'Was zur Hölle…', 1.8], ['wait', 0.4]],
      music: 'drone', amb: 'birds',
      init() { pov.setPov('phoneClose'); },
      update(lt) {
        pov.setPov('phoneClose', 'none', Math.min(1, lt / 0.6));
        E.phone((g) => E.ui.lock(g, '06:47', 'Dienstag, 24. November', notes, (lt - 0.6) / 1.2 + 1));
        E.cam(LIE, [LIE[0] - 0.1, 2.5, LIE[2] - 1.2], { fov: 82, shake: 0.003 });
        world(E.T);
      },
    },
    {
      beats: [['sfx', 'click', { vol: 0.6 }], ['wait', 4.2]],
      music: 'drone', amb: 'birds',
      update(lt) {
        E.phone((g) => E.ui.news(g, 'Unbekannte Erkrankung: Menschen greifen Passanten an', 'Polizei und Bundeswehr im Einsatz. Behörden raten dringend, Wohnungen nicht zu verlassen.', '06:48'));
        pov.setPov('phoneClose');
        E.cam(LIE, [LIE[0] - 0.1, 2.5, LIE[2] - 1.2], { fov: 82, shake: 0.003 });
        world(E.T);
      },
    },
    // ---------------- get up, walk to window
    {
      beats: [['sfx', 'creak', { vol: 0.5 }], ['wait', 0.8], ['sfx', 'steps', { d: 2.4, vol: 0.6 }], ['wait', 2.8]],
      music: 'drone', amb: 'birds',
      init() { pov.setPov('none'); },
      update(lt) {
        const p = E.key([[0, LIE], [1.0, [LIE[0] + 0.25, 1.3, LIE[2] - 0.1]], [3.4, WIN]], lt);
        const b = E.walkBob(lt, lt > 1 && lt < 3.4 ? 0.03 : 0);
        const look = E.key([[0, [LIE[0], 1.5, LIE[2] - 2]], [1.4, [WIN[0] + 2, 1.4, -0.3]], [3.4, [WIN[0] + 3, 1.2, -0.15]]], lt);
        E.cam([p[0] + b[0], p[1] + b[1], p[2]], look, { fov: 90, shake: 0.004 });
        world(E.T);
      },
    },
    // ---------------- view to the street
    {
      beats: [['wait', 1.2], ['sfx', 'scream_far', { vol: 0.7, off: 1.5 }], ['sfx', 'caralarm', { off: 2.5, d: 5, vol: 0.4 }], ['wait', 2.4], ['text', 'Was ist da unten los?', 1.8], ['wait', 1.6]],
      music: 'tension', mvol: 0.8, amb: 'city',
      init() { pov.setPov('none'); },
      update(lt) {
        street(lt);
        const look = E.key([[0, [WIN[0] + 3, 1.0, -0.15]], [1.6, [14, -12.5, 2]], [7, [14, -12.8, 6]]], lt);
        E.cam(WIN, look, { fov: 78, shake: 0.004 });
        world(E.T);
      },
    },
    // ---------------- helicopter fly-by
    {
      beats: [['sfx', 'heli', { d: 7, vol: 1.0 }], ['wait', 2.6], ['fx', 'shake', { d: 2.0, k: 0.5 }], ['wait', 3.6]],
      music: 'tension', amb: 'city',
      update(lt) {
        street(lt + 7.0);
        const hz = -70 + lt * 22;
        heli.g.position.set(13, 6 - lt * 0.1, hz); heli.g.rotation.set(0.08, -Math.PI / 2, 0.06);
        const look = E.key([[0, [13, 5, -40]], [2.5, [13, 5.5, -12]], [4.5, [13, 5, 20]], [6.2, [18, 5, 50]]], lt);
        E.cam(WIN, look, { fov: 85, shake: 0.006 });
        world(E.T);
      },
    },
    // ---------------- Emilia wakes up
    {
      beats: [['wait', 0.5], ['say', 'EMILIA', 'Was ist das für ein Lärm?'], ['wait', 0.4], ['sfx', 'creak', { vol: 0.4 }], ['wait', 1.2], ['say', 'EMILIA', 'Hey. Was ist los? Rede mit mir.'], ['wait', 0.6]],
      music: 'tension', mvol: 0.7, amb: 'city',
      init() { emStand(0.2, 0.9, 0, chars.POSES.sit); em.root.position.y = 0.12; E.face(em, WIN[0], WIN[2]); em.expr = 'sad'; },
      update(lt) {
        const k = Math.min(1, lt / 3.4);
        if (lt < 3.4) { em.root.position.set(E.lerp(0.2, 0.6, k), 0.12 * (1 - E.ease(k * 1.4)), E.lerp(0.9, 0.2, k)); em.pose(chars.mixPose(chars.POSES.sit, chars.walkCycle(lt), E.ease((k - 0.3) / 0.7))); }
        else { em.root.position.set(0.6, 0, 0.2); em.pose(chars.POSES.stand); }
        E.face(em, WIN[0], WIN[2]);
        em.expr = lt > 3 ? 'scared' : 'sad';
        E.cam(WIN, [E.lerp(0.2, 0.6, k), E.lerp(0.95, 1.5, k), E.lerp(0.9, 0.2, k)], { fov: 80, shake: 0.004 });
        world(E.T);
      },
    },
    // ---------------- Emilia at the window, explosion
    {
      beats: [['say', 'EMILIA', 'Oh Gott… der Hubschrauber… die fliegen alle Richtung Bahnhof.'], ['wait', 1.0], ['mark', 'boom'],
        ['sfx', 'explosion_far', { vol: 1.0 }], ['fx', 'flash', { d: 0.7, k: 0.7 }], ['wait', 0.4], ['fx', 'shake', { d: 2.2, k: 1.4 }], ['sfx', 'glass', { off: 0.1, vol: 0.4 }],
        ['sfx', 'scream', { off: 0.1, vol: 0.7, d: 1.0 }], ['fx', 'aberr', { d: 1.4 }], ['sfx', 'tinnitus', { d: 3, vol: 0.8 }], ['wait', 3.4], ['sfx', 'caralarm', { d: 6, vol: 0.6 }], ['sfx', 'crowd_panic', { d: 6, vol: 0.5 }]],
      music: 'none', amb: 'city',
      init() { emStand(1.5, -0.55, 0); E.face(em, WIN[0], WIN[2]); em.expr = 'scared'; explodeAt = 1e9; },
      update(lt, d, T) {
        const tb = lt - (this.marks.boom ?? 99);
        if (tb > -0.01 && explodeAt > 1e8) explodeAt = T;
        boom.update(tb * 1.2); debris.update(tb);
        em.pose(tb > 0.3 ? chars.mixPose(chars.POSES.stand, chars.POSES.holdHead, Math.min(1, (tb - 0.3) / 0.4)) : chars.POSES.stand);
        em.root.position.x = tb > 0.3 ? 1.5 - Math.min(0.35, (tb - 0.3) * 0.8) : 1.5;
        const look = tb < 0 ? E.key([[0, [1.5, 1.52, -0.55]], [2.4, [1.5, 1.52, -0.55]], [3.2, [60, 10, -20]]], lt) : [80, 12, -25];
        E.cam(WIN, look, { fov: 84, shake: tb > 0 ? 0.01 : 0.004 });
        world(T);
      },
    },
    // ---------------- aftermath: Emilia, Mama calls
    {
      beats: [['say', 'EMILIA', 'Das war beim Hauptbahnhof… da wohnen so viele Leute…', { gap: 0.4 }], ['sfx', 'ringtone', { d: 2.6, vol: 0.6 }], ['wait', 2.6],
        ['say', 'MAMA', 'Hörst du mich? Hör mir zu! Geht nicht raus!', { fx: 'phone' }],
        ['say', 'MAMA', 'Egal was passiert, macht niemandem die Tür auf! Die Leute sind krank, sie…', { fx: 'phone' }],
        ['sfx', 'static', { d: 0.8 }], ['wait', 1.0], ['text', 'Mama? MAMA?', 1.8]],
      music: 'drone', amb: 'city_chaos',
      init() { emStand(1.0, -0.6, 0, chars.POSES.holdHead); E.face(em, WIN[0] - 0.2, WIN[2]); em.expr = 'sad'; pov.setPov('phone'); },
      update(lt, d) {
        const callAt = 3.6;
        pov.setPov('phone', 'none', Math.min(1, Math.max(0, (lt - 2.4) / 0.6)));
        if (lt < 2.4) pov.setPov('none');
        E.phone((g) => lt < callAt + 0.8 ? E.ui.call(g, 'Mama ❤', 'eingehender Anruf') : (lt > d - 2.6 ? E.ui.call(g, 'Mama ❤', 'Verbindung unterbrochen') : E.ui.call(g, 'Mama ❤', '00:0' + Math.floor(lt - callAt))));
        em.pose(lt > 2 ? chars.POSES.stand : chars.POSES.holdHead);
        const look = lt < 2.4 ? [1.0, 1.48, -0.6] : [1.1, 1.05, -0.4];
        E.cam(WIN.map((v, i) => i === 0 ? v - 0.2 : v), look, { fov: 84, shake: 0.006 });
        world(E.T); boom.update(-1);
      },
    },
    // ---------------- street: someone gets attacked
    {
      beats: [['wait', 0.6], ['sfx', 'scream', { vol: 0.8, d: 1.6, off: 1.2 }], ['sfx', 'growl', { off: 1.0, vol: 0.8 }], ['wait', 2.6],
        ['say', 'EMILIA', 'Der… der beißt ihn. Der beißt ihn!'], ['wait', 0.8]],
      music: 'tension', amb: 'city_chaos',
      init() { pov.setPov('none'); emStand(1.55, -0.6, Math.PI / 2, chars.POSES.stand); em.expr = 'scared'; },
      update(lt) {
        const tt = Math.min(lt, 1.6);
        runner.root.position.set(14.5, -13, -2 + tt * 3.6); runner.pose(lt < 1.6 ? chars.walkCycle(lt, 1, true) : chars.POSES.fallen);
        if (lt >= 1.6) { chars.layDown(runner, 14.3, -12.85, 3.5, 0.3, 0); runner.pose(chars.POSES.fallen); }
        z1.root.position.set(14.3, -13, -3.6 + Math.min(lt, 1.7) * 4.0); z1.pose(lt < 1.7 ? chars.mixPose(chars.walkCycle(lt, 1, true), chars.POSES.zombie, 0.4) : chars.POSES.crouch);
        const look = E.key([[0, [14, -12.8, 0]], [2.2, [14.4, -13, 4.5]]], lt);
        E.cam(WIN, look, { fov: 70, shake: 0.006 });
        world(E.T);
      },
    },
    // ---------------- CLIFFHANGER: pounding on the door
    {
      beats: [['sfx', 'bang3', { vol: 1.0 }], ['fx', 'shake', { d: 0.6, k: 0.6 }], ['wait', 1.3], ['say', 'NACHBAR', 'Hilfe! Bitte! Macht auf! Bitte!', { fx: 'far', vol: 1.0 }],
        ['sfx', 'bang3', { vol: 1.0 }], ['wait', 0.5], ['say', 'EMILIA', 'Nicht aufmachen… bitte nicht aufmachen.', { vol: 0.85 }], ['sfx', 'heartbeat', { d: 3 }], ['wait', 1.2],
        ['sfx', 'bang', { vol: 1 }], ['fx', 'shake', { d: 0.4 }], ['wait', 0.35], ['sfx', 'boom', { vol: 0.9 }], ['fx', 'black', { d: 1.6 }], ['wait', 1.6]],
      music: 'heart', amb: 'city_chaos', avol: 0.5,
      init() { pov.setPov('none'); emStand(0.2, -1.0, -Math.PI * 0.75, chars.POSES.reach); em.expr = 'scared'; },
      update(lt) {
        const look = E.key([[0, [12, -10, 0]], [0.6, [-1.0, 1.1, -2.3]]], lt);
        const pos = E.key([[0, WIN], [3.0, [1.1, 1.6, 0.2]], [6.5, [0.85, 1.6, -0.25]]], lt);
        E.cam(pos, look, { fov: 84, shake: 0.008 });
        em.root.position.set(0.25 + Math.sin(lt) * 0.02, 0, -0.95); em.root.rotation.y = Math.atan2(pos[0] - 0.25, pos[2] + 0.95);
        em.pose(chars.POSES.reach);
        world(E.T);
      },
    },
    { card: ['TEIL 2', 'Die Tür'], beats: [['wait', 2.2]], music: 'none', amb: 'none' },
  ];
  // asleep: closed eyes while lying in bed
  const orig = em.updateFace.bind(em);
  em.updateFace = (t) => { if (em.wrap && em.wrap.position.y > 0.5) { em.blinkOff = -t + 0.05; } orig(t); };
  return { meta: { n: 1, title: 'Der Morgen' }, shots };
}
