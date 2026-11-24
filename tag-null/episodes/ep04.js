// TEIL 4 – Kein Netz
export default function (E) {
  const { sets, fx, pov, chars, scene, post, THREE } = E;
  const { toon, flat, mesh, box, sph, noOutline } = { ...E.core };
  sets.sky('#151a36', '#b0502e');
  const room = sets.apartmentBedroom({ night: true });
  const bed = room.bed;

  // --- the building opposite with an open window (x = 20)
  const opp = new THREE.Group(); scene.add(opp);
  const wallM = toon(0x4a4658), darkM = toon(0x0e0e14);
  const FX0 = 20;
  mesh(box(0.4, 17.6, 30), wallM, FX0, -4.2, -16.6, opp); mesh(box(0.4, 17.6, 30), wallM, FX0, -4.2, 15.4, opp);           // left/right of window column
  mesh(box(0.4, 13.6, 1.0), wallM, FX0, -6.2, -0.1, opp); mesh(box(0.4, 1.6, 1.0), wallM, FX0, 3.9, -0.1, opp); mesh(box(6, 0.3, 62), toon(0x2a2632), FX0 + 3, 4.75, -0.6, opp);          // below/above window
  mesh(box(3, 0.2, 2.4), darkM, FX0 + 1.5, 0.6, -0.1, opp); mesh(box(3, 0.2, 2.4), darkM, FX0 + 1.5, 3.0, -0.1, opp);
  mesh(box(0.2, 2.6, 2.4), darkM, FX0 + 3, 1.8, -0.1, opp); mesh(box(3, 2.6, 0.2), darkM, FX0 + 1.5, 1.8, -1.2, opp); mesh(box(3, 2.6, 0.2), darkM, FX0 + 1.5, 1.8, 1.0, opp);
  mesh(box(0.5, 0.08, 1.1), toon(0x8a8a90), FX0 - 0.15, 0.62, -0.1, opp);                                               // sill
  for (let i = 0; i < 12; i++) for (let j = 0; j < 4; j++) if (!(i === 0 && j === 2)) {                                 // other dark windows
    const lit = (i * 7 + j * 3) % 11 === 0 && Math.abs(-12 + i * 2.2) > 5;
    mesh(box(0.05, 1.3, 0.9), lit ? flat(0xffc860) : toon(0x1c2034), FX0 - 0.22, -11 + j * 4.2 + 0.5, -12 + i * 2.2 + (i >= 6 ? 0 : 0), opp);
  }
  const lena = E.actor('LENA', { skin: '#f2cdb0', hair: 0xc89050, hairStyle: 'ponytail', top: 0xd85a8a, legs: 0x3a4a6a, female: true, height: 0.72 });
  lena.root.position.set(FX0 + 0.55, 0.7, -0.1); lena.root.rotation.y = -Math.PI / 2;
  const zb = E.actor('ZB', { ...chars.CAST.ZOMBIE3, top: 0x4a4a4a });
  zb.root.position.set(0, -60, 0); zb.root.rotation.y = -Math.PI / 2;
  const torch = noOutline(mesh(sph(0.06, 10, 8), flat(0xffffff), 0, 0, 0, scene, { cast: false }));
  const torchGlow = noOutline(mesh(sph(0.35, 14, 10), new THREE.MeshBasicMaterial({ color: 0xfff6d0, transparent: true, opacity: 0.35 }), 0, 0, 0, scene, { cast: false }));
  const torchLight = new THREE.PointLight(0xfff2c8, 0, 6, 1.5); scene.add(torchLight);
  const roomLight = new THREE.PointLight(0x8aa0ff, 2.5, 6, 1.2); roomLight.position.set(FX0 + 1.4, 2.6, -0.1); scene.add(roomLight);
  const moon = new THREE.DirectionalLight(0x8090c0, 0.6); moon.position.set(30, 40, -20); scene.add(moon);

  // --- burning city
  const fires = [[110, 16, 30, 5], [150, 22, -40, 7], [90, 12, -60, 4], [180, 28, 10, 8]].map(([x, y, z, s]) => fx.fire(scene, x, y, z, s));
  const smokes = [[110, 18, 30, 1.8], [150, 24, -40, 2.6], [180, 30, 10, 2.8]].map(([x, y, z, s]) => fx.smokeColumn(scene, x, y, z, s));
  const glow1 = new THREE.PointLight(0xff7a30, 60, 300, 1.0); glow1.position.set(140, 30, -20); scene.add(glow1);

  // --- candle + my flashlight
  const candle = new THREE.PointLight(0xffb060, 1.6, 5, 1.4); candle.position.set(bed.x - 1.15, 0.75, bed.z + 0.9); scene.add(candle);
  mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.12, 10), toon(0xf4efe0), bed.x - 1.15, 0.56, bed.z + 0.9, scene);
  noOutline(mesh(sph(0.018, 8, 6), flat(0xffd070), bed.x - 1.15, 0.64, bed.z + 0.9, scene, { cast: false }));
  const flash = new THREE.SpotLight(0xfff4e0, 0, 12, 0.5, 0.6, 1.2); E.camera.add(flash); flash.position.set(0.1, -0.1, 0); E.camera.add(flash.target); flash.target.position.set(0, -0.2, -3);

  const em = E.actor('EMILIA');
  const WIN = [1.98, 1.58, -0.1];
  // SOS: ... --- ...
  const SOS = [[0, .25], [.5, .25], [1, .25], [1.7, .7], [2.6, .7], [3.5, .7], [4.4, .25], [4.9, .25], [5.4, .25]];
  const sosOn = (t) => { const tt = t % 7.2; return SOS.some(([a, d]) => tt >= a && tt < a + d); };
  function world(T) { fires.forEach(f => f.update(T)); smokes.forEach(s => s.update(T)); glow1.intensity = 50 + Math.sin(T * 3) * 10; }
  function torchAt(on, T) {
    const head = lena.head.getWorldPosition(new THREE.Vector3());
    const p = head.clone().add(new THREE.Vector3(-0.35, -0.15, -0.12));
    torch.position.copy(p); torchGlow.position.copy(p); torchLight.position.copy(p);
    torch.visible = torchGlow.visible = on; torchLight.intensity = on ? 3 : 0.0;
  }
  const lenaPose = { armR: [-1.5, 0.3, 0], elbowR: -0.4, armL: [-0.3, 0, 0.1], neck: [0.1, 0, 0] };

  const shots = [
    // HOOK: power dies
    {
      beats: [['say', 'EMILIA', 'Nein… nein, nein, nein…', { vol: 0.9 }], ['sfx', 'flicker', { vol: 0.6 }], ['fx', 'black', { off: 0.2, d: 0.15 }], ['fx', 'black', { off: 0.6, d: 0.2 }], ['wait', 1.0], ['sfx', 'thud', { vol: 0.6 }], ['wait', 0.5]],
      music: 'none', amb: 'night',
      init() { pov.setPov('none'); em.root.position.set(-0.2, 0, -0.2); em.root.rotation.y = 0.6; em.pose(chars.POSES.stand); em.expr = 'scared'; candle.intensity = 0; room.fill.intensity = 0.6; },
      update(lt) { room.fill.intensity = lt < 1.2 ? (Math.sin(lt * 40) > 0 ? 0.8 : 0.1) : 0; E.face(em, 0.4, 0.8); E.cam([0.4, 1.6, 0.8], [-0.2, 1.4, -0.2], { fov: 84 }); world(E.T); },
    },
    { card: ['KEIN STROM. KEIN NETZ.', '21:40 Uhr'], clock: '21:40', beats: [['sfx', 'boom', { vol: 0.4 }], ['wait', 1.8]], music: 'none', amb: 'night' },
    // radio in candlelight
    {
      beats: [['sfx', 'static', { d: 1.2, vol: 0.8 }], ['wait', 1.0],
        ['say', 'RADIO', 'Notfallmeldung für Hallbrück. Ab morgen acht Uhr beginnt die Evakuierung am Stadion Nord.', { fx: 'radio' }],
        ['say', 'RADIO', 'Bleiben Sie bis dahin in Ihren Wohnungen. Meiden Sie Lärm und Licht. Infizierte reagieren auf beides.', { fx: 'radio' }],
        ['sfx', 'static', { d: 0.6, vol: 0.6 }], ['wait', 0.6], ['sfx', 'bang', { vol: 0.35 }], ['wait', 0.6]],
      music: 'drone', amb: 'night',
      init() { candle.intensity = 1.6; em.root.position.set(bed.x - 0.7, 0.13, bed.z + 0.4); em.root.rotation.y = Math.PI + 0.45; em.pose(chars.addPose(chars.POSES.sit, { neck: [0, 0.55, 0], head: [0, 0.25, 0], armL: [0.2, 0, 0.1], armR: [0.2, 0, -0.1] })); em.expr = 'sad'; },
      update(lt) { candle.intensity = 1.5 + Math.sin(E.T * 13) * 0.15; E.cam([bed.x + 0.55, 1.15, bed.z + 0.2], [bed.x - 0.7, 0.95, bed.z + 0.45], { fov: 80 }); world(E.T); },
    },
    // plan
    {
      beats: [['say', 'EMILIA', 'Das Stadion… das Klinikum liegt auf dem Weg dahin.'], ['wait', 0.3], ['say', 'EMILIA', 'Wir holen Mia. Und dann gehen wir zusammen zum Stadion. Okay?'],
        ['wait', 0.4], ['text', 'Mama. Versuch es nochmal.', 1.8], ['sfx', 'click', { vol: 0.4 }], ['wait', 2.6]],
      music: 'sad', amb: 'night',
      update(lt, d) {
        candle.intensity = 1.5 + Math.sin(E.T * 13) * 0.15;
        em.expr = lt < 6 ? 'sad' : 'neutral';
        const ph = lt > d - 3.4; pov.setPov(ph ? 'phoneClose' : 'none', null, 1);
        if (ph) E.phone((g) => { E.ui.chat(g, 'Mama ❤', [['out', 'Mama bitte meld dich. Wir leben. Wir sind zuhause.']], '21:44'); g.fillStyle = '#e55'; g.font = '18px sans-serif'; g.fillText('! Nicht zugestellt – kein Netz', 70, 300); });
        E.cam([bed.x + 0.55, 1.15, bed.z + 0.2], ph ? [bed.x + 0.3, 0.6, bed.z - 0.6] : [bed.x - 0.7, 0.95, bed.z + 0.45], { fov: 78 }); world(E.T);
      },
    },
    // window: the burning city
    {
      beats: [['sfx', 'gunshot_far', { off: 1.0 }], ['sfx', 'gunshot_far', { off: 1.4 }], ['sfx', 'siren_far', { d: 7, vol: 0.5 }], ['wait', 2.4],
        ['say', 'EMILIA', 'Die ganze Stadt brennt…', { vol: 0.85 }], ['wait', 0.6], ['say', 'EMILIA', 'Versprich mir, dass wir das schaffen. Versprich es mir.', { vol: 0.85 }],
        ['text', 'Versprochen.', 1.8], ['wait', 1.4]],
      music: 'sad', amb: 'fire', avol: 0.4,
      init() { pov.setPov('none'); em.root.position.set(1.55, 0, -0.55); em.pose(chars.POSES.stand); em.expr = 'sad'; },
      update(lt) {
        E.face(em, WIN[0], WIN[2]);
        const look = E.key([[0, [60, 8, -10]], [2.4, [70, 10, -12]], [3.6, [1.55, 1.5, -0.55]]], lt);
        E.cam(WIN, look, { fov: 80 }); world(E.T); torchAt(false, E.T);
      },
    },
    // SOS
    {
      beats: [['wait', 1.2], ['text', 'Da blinkt was.', 1.6], ['wait', 1.4], ['text', 'Kurz. Kurz. Kurz. Lang. Lang. Lang…', 2.4], ['wait', 0.4], ['say', 'EMILIA', 'Das ist SOS… das ist SOS!'], ['wait', 1.0]],
      music: 'tension', amb: 'night',
      init() { em.root.position.set(1.5, 0, -0.65); E.face(em, 20, -0.1); em.pose(chars.POSES.point); em.expr = 'scared'; },
      update(lt) {
        lena.pose(chars.addPose(chars.POSES.stand, lenaPose)); lena.expr = 'sad'; torchAt(sosOn(lt), E.T);
        const fov = E.key([[0, 80], [2.4, 80], [4.4, 13]], lt);
        E.cam(WIN, [FX0, 1.4, -0.1], { fov, shake: fov < 40 ? 0.002 : 0.005 }); world(E.T);
      },
    },
    // a child alone
    {
      beats: [['say', 'EMILIA', 'Da ist ein Kind! Ein kleines Mädchen! Ganz allein da drüben!'], ['wait', 0.4], ['say', 'EMILIA', 'Wir müssen ihr irgendwie zeigen, dass wir sie sehen!'],
        ['sfx', 'click', { vol: 0.6 }], ['wait', 1.4], ['text', 'Sie hat uns gesehen.', 1.8], ['wait', 0.4]],
      music: 'tension', amb: 'night',
      init() { pov.setPov('phone'); },
      update(lt, d) {
        flash.intensity = lt > 5 ? 40 : 0;
        lena.pose(chars.addPose(chars.POSES.stand, lt > 6 ? { armR: [-2.6, 0.3, 0.3], elbowR: -0.2, armL: [-0.3, 0, 0.1] } : lenaPose)); lena.expr = lt > 6 ? 'smile' : 'sad'; torchAt(lt < 6 && sosOn(lt), E.T);
        E.phone((g) => { g.fillStyle = lt > 5 ? '#fff' : '#111'; g.fillRect(0, 0, 360, 760); g.fillStyle = '#888'; g.font = 'bold 24px sans-serif'; g.fillText(lt > 5 ? 'Taschenlampe AN' : 'Taschenlampe', 70, 380); });
        E.cam(WIN, [FX0, 1.35, -0.1], { fov: lt > 5 ? 12 : 14, shake: 0.002 }); world(E.T);
      },
    },
    // CLIFF: something behind her
    {
      beats: [['wait', 1.4], ['sfx', 'heartbeat', { d: 5, vol: 0.9 }], ['wait', 1.4], ['say', 'EMILIA', 'Hinter ihr… da ist jemand hinter ihr!', { vol: 0.9 }], ['wait', 1.2],
        ['sfx', 'riser', { d: 1.6 }], ['wait', 1.5], ['sfx', 'boom', { vol: 1 }], ['fx', 'black', { off: 0.05, d: 1.4 }], ['wait', 1.4]],
      music: 'none', amb: 'night',
      init() { flash.intensity = 40; },
      update(lt) {
        lena.pose(chars.addPose(chars.POSES.stand, { armR: [-2.4, 0.3, 0.3], elbowR: -0.3 })); lena.expr = 'smile';
        const rise = Math.min(1, Math.max(0, (lt - 1.0) / 2.5));
        zb.root.position.set(FX0 + E.lerp(2.2, 1.2, rise), E.lerp(0.1, 0.7, Math.min(1, rise * 2)), 0.25);
        zb.pose(chars.mixPose(chars.POSES.crouch, chars.POSES.zombie, rise)); zb.expr = 'zombie';
        const fov = E.key([[0, 13], [5, 8]], lt);
        E.cam(WIN, [FX0 + 0.8, 1.45, 0.0], { fov, shake: 0.002 }); world(E.T);
      },
    },
    { card: ['TEIL 5', 'SOS'], beats: [['wait', 2.2]], music: 'none', amb: 'none', init() { flash.intensity = 0; } },
  ];
  return { meta: { n: 4, title: 'Kein Netz', clock: { date: '2026-11-24', time: '21:38' } }, shots };
}
