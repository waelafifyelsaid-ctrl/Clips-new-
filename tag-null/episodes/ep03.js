// TEIL 3 – Krause
export default function (E) {
  const { sets, fx, pov, chars, post } = E;
  sets.sky('#8aa6cf', '#f4d9b4');
  const S = sets.hallAndStairs({ ox: 50 });
  const X = (x, y, z) => [S.ox + x, y, z];
  const kr = E.actor('NACHBAR', { ...chars.CAST.NACHBAR, blood: true, skin: '#cfc2b2' });
  const em = E.actor('EMILIA');

  const KR_HEAD = X(0.1, 0.25, -3.55);
  function krLying(extra = {}) { chars.layDown(kr, ...X(0.1, 0.13, -1.9), 0, 0); kr.pose(chars.addPose({ armL: [0.1, 0, -0.1], armR: [0.1, 0, 0.1] }, extra)); }
  const cpr = (t) => chars.addPose(chars.POSES.crouch, { spine: [0.5 + Math.max(0, Math.sin(t * 11)) * 0.1, 0, 0], armL: [-1.0, 0.25, 0.25], armR: [-1.0, -0.25, -0.25], elbowL: 0, elbowR: 0, hipsY: -0.08 });
  function emCpr(t) { em.root.position.set(...X(0.55, 0, -3.05)); E.face(em, S.ox + 0.1, -3.05); em.pose(cpr(t)); }
  function bath(open) { S.bathDoor.rotation.y = open * 1.4; }

  const shots = [
    // HOOK – twitching finger
    {
      beats: [['sfx', 'heartbeat', { d: 2.6, vol: 0.9 }], ['wait', 0.6], ['sfx', 'click', { vol: 0.4 }], ['text', 'Seine Hand…', 1.6], ['wait', 0.6]],
      music: 'none', amb: 'room',
      init() { krLying(); kr.expr = 'sad'; em.root.position.set(0, -50, 0); pov.setPov('none'); bath(0); },
      update(lt) {
        kr.blinkOff = -E.T + 0.05;
        kr.limbs.elbowR.rotation.x = Math.sin(lt * 20) > 0.7 ? -0.3 : 0;
        E.cam(X(0.65, 0.75, -3.95), X(0.1, 0.18, -3.4), { fov: 62, shake: 0.003 });
      },
    },
    // CPR
    {
      beats: [['say', 'EMILIA', 'Komm schon… komm schon! Eins, zwei, drei, vier…'], ['wait', 0.3], ['say', 'EMILIA', 'Er hat keinen Puls. Ich spür nichts!'],
        ['wait', 0.4], ['say', 'EMILIA', 'Mach was! Ruf irgendwen an! Irgendwen!'], ['wait', 0.4]],
      music: 'tension', amb: 'room',
      init() { krLying(); em.expr = 'scared'; },
      update(lt) {
        kr.blinkOff = -E.T + 0.05; emCpr(lt);
        const p = E.key([[0, X(-0.45, 1.6, -2.1)], [9, X(-0.35, 1.45, -2.5)]], lt);
        E.cam(p, X(0.25, 0.4, -3.2), { fov: 84, shake: 0.006 });
      },
    },
    // phone: the video
    {
      beats: [['sfx', 'whoosh', { vol: 0.3 }], ['wait', 1.4], ['sfx', 'ping', { vol: 0.5 }], ['wait', 2.4], ['text', 'Das kann nicht echt sein.', 2.0], ['wait', 0.6]],
      music: 'drone', amb: 'room',
      init() { pov.setPov('phoneClose'); },
      update(lt) {
        emCpr(E.T); kr.blinkOff = -E.T + 0.05;
        E.phone((g) => {
          g.fillStyle = '#0f1014'; g.fillRect(0, 0, 360, 760); E.ui.status(g, '07:02');
          g.fillStyle = '#1d1f26'; g.fillRect(0, 56, 360, 64); g.fillStyle = '#fff'; g.font = 'bold 24px sans-serif'; g.fillText('Hallbrück Live 🔴', 70, 98);
          g.fillStyle = '#222'; g.fillRect(16, 150, 328, 260); g.fillStyle = '#566'; g.fillRect(16, 330, 328, 80);
          g.fillStyle = '#c33'; g.fillRect(120, 250, 26, 70); g.fillStyle = '#333'; g.beginPath(); g.arc(133, 235, 20, 0, 7); g.fill();
          g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.moveTo(165, 255); g.lineTo(205, 280); g.lineTo(165, 305); g.fill();
          g.fillStyle = '#fff'; g.font = 'bold 23px sans-serif';
          ['Video: Mann steht nach', 'Herzstillstand wieder auf', 'und greift Sanitäter an'].forEach((l, i) => g.fillText(l, 20, 460 + i * 30));
          g.fillStyle = '#99a'; g.font = '19px sans-serif'; g.fillText('12.402 Aufrufe · vor 9 Min.', 20, 570);
          g.fillStyle = '#c33'; g.font = 'bold 20px sans-serif'; g.fillText('„Sie stehen wieder auf. Geht nicht', 20, 620); g.fillText('in ihre Nähe!!!“', 20, 646);
        });
        E.cam(X(-0.35, 1.45, -2.5), X(-0.3, 1.0, -3.3), { fov: 82, shake: 0.004 });
      },
    },
    // eyes open – grabs Emilia
    {
      beats: [['wait', 0.6], ['say', 'EMILIA', 'Herr Krause? Herr Krause! Gott sei Dank, Sie…'], ['sfx', 'growl', { vol: 1, d: 1.4 }], ['fx', 'shake', { d: 0.6, k: 0.8 }],
        ['sfx', 'scream', { off: 0.2, vol: 0.9, d: 1.2 }], ['wait', 1.6]],
      music: 'heart', amb: 'room',
      init() { pov.setPov('none'); em.expr = 'sad'; },
      update(lt, d) {
        const grab = lt > d - 1.8;
        krLying(grab ? { armR: [-1.6, 0, 0.6], elbowR: -0.3, neck: [-0.3, 0, 0] } : {});
        kr.expr = lt > 0.5 ? 'zombie' : 'sad'; kr.blinkOff = lt > 0.5 ? 0 : -E.T + 0.05;
        emCpr(0); em.pose(grab ? chars.addPose(chars.POSES.crouch, { spine: [0.1, 0, 0], armL: [-1.2, 0, 0.2], armR: [-0.4, 0, -0.3], elbowL: -0.3 }) : chars.addPose(chars.POSES.crouch, { spine: [0.6, 0, 0] }));
        em.expr = grab ? 'scared' : 'smile';
        const p = grab ? X(0.1, 0.85, -4.25) : X(0.0, 0.75, -4.1);
        E.cam(p, grab ? X(0.35, 0.55, -3.2) : X(0.1, 0.2, -3.5), { fov: 78, shake: grab ? 0.02 : 0.004 });
      },
    },
    // fight: he rises, you push him into the bathroom
    {
      beats: [['sfx', 'zombie_scream', { vol: 1 }], ['fx', 'shake', { d: 1.2, k: 1 }], ['wait', 1.2], ['sfx', 'thud', { vol: 1 }], ['say', 'EMILIA', 'Weg von ihm! Weg!', { gap: 0.1 }],
        ['sfx', 'creak', { vol: 0.6 }], ['sfx', 'growl', { off: 0.3, d: 2.4, vol: 1 }], ['wait', 1.6], ['sfx', 'bang', { vol: 1 }], ['fx', 'shake', { d: 0.5, k: 1.2 }], ['wait', 0.4],
        ['say', 'EMILIA', 'Der Schlüssel! Dreh den Schlüssel um!', { gap: 0.1 }], ['sfx', 'lock', { vol: 1 }], ['wait', 0.4], ['sfx', 'bang3', { vol: 1 }], ['fx', 'shake', { d: 1, k: 0.8 }], ['wait', 1.4]],
      music: 'action', amb: 'room',
      init() { chars.standUp(kr); kr.expr = 'zombie'; em.expr = 'scared'; pov.setPov('guard'); },
      update(lt, d) {
        // Krause stands up and lunges; you push him through the bathroom door
        const rise = Math.min(1, lt / 1.0);
        // you shove him backwards through the open bathroom door; he stumbles deep into the bathroom
        const kp = E.key([[0, [0.15, -3.2]], [1.2, [0.15, -3.4]], [2.2, [0.4, -3.85]], [2.9, [1.25, -3.9]], [3.4, [1.95, -3.75]]], lt);
        kr.root.position.set(...X(kp[0], 0, kp[1])); E.face(kr, E.camera.position.x, E.camera.position.z);
        kr.pose(rise < 1 ? chars.mixPose(chars.POSES.crouch, chars.POSES.zombie, rise) : chars.addPose(chars.POSES.zombie, { armL: [-0.3, 0, 0], armR: [-0.3, 0, 0], spine: [Math.sin(lt * 9) * 0.1, 0, 0] }));
        bath(E.key([[0, 0], [2.0, 0], [2.5, 1], [3.5, 1], [3.9, 0]], lt));   // he is past the door leaf before it swings shut
        em.root.position.set(...X(-0.45, 0, -1.6)); E.face(em, S.ox + 0.5, -3.8); em.pose(chars.POSES.holdHead);
        const p = E.key([[0, X(-0.25, 1.6, -2.3)], [1.4, X(-0.15, 1.62, -2.7)], [2.6, X(0.25, 1.6, -3.25)], [4.5, X(0.25, 1.6, -3.3)]], lt);
        E.cam(p, E.key([[0, X(0.15, 1.2, -3.4)], [2.4, X(1.0, 1.3, -3.9)], [4.5, X(0.9, 1.3, -3.9)]], lt), { fov: 86, shake: lt < 4 ? 0.025 : 0.01 });
        pov.setPov(lt < 4.2 ? 'guard' : 'reach');
      },
    },
    // the bathroom door handle moves
    {
      beats: [['sfx', 'creak', { vol: 0.7 }], ['wait', 1.2], ['sfx', 'bang', { vol: 0.9 }], ['fx', 'shake', { d: 0.4 }], ['wait', 1.0], ['sfx', 'growl', { d: 2.0, vol: 0.8 }], ['text', 'Die Tür hält. Noch.', 2.0], ['wait', 0.6]],
      music: 'heart', amb: 'room',
      init() { pov.setPov('none'); kr.root.position.set(0, -50, 0); bath(0); },
      update(lt) { S.bathDoor.rotation.y = Math.sin(lt * 30) * 0.004 * (lt > 1.2 && lt < 2.0 ? 4 : 1); E.cam(X(0.05, 1.5, -3.0), X(0.79, 1.1, -3.9), { fov: 74, shake: 0.004 }); },
    },
    // aftermath: Emilia's wrist
    {
      beats: [['sfx', 'bang', { vol: 0.6 }], ['wait', 0.8], ['say', 'EMILIA', 'Er hätte mich fast gebissen… er war tot. Er war tot, ich schwör’s dir.'], ['wait', 0.6],
        ['say', 'EMILIA', 'Schau… nur ein Kratzer. Das ist nur ein Kratzer. Oder?'], ['wait', 0.4], ['text', 'Nur ein Kratzer.', 1.8], ['sfx', 'bang', { vol: 0.5 }], ['wait', 0.6],
        ['say', 'EMILIA', 'Mia… meine Schwester liegt im Klinikum. Mit dem gebrochenen Bein. Sie kann nicht mal weglaufen.'], ['wait', 0.4],
        ['say', 'EMILIA', 'Ich lass sie da nicht allein. Hörst du? Wir müssen zu ihr.'], ['text', 'Da raus? Jetzt?', 1.8], ['wait', 0.5]],
      music: 'sad', amb: 'room',
      init() { pov.setPov('none'); em.root.position.set(...X(-0.5, 0, -2.6)); em.root.rotation.y = Math.PI / 2; em.pose({ hipsY: -0.8, spine: [-0.1, 0, 0], thighL: [-1.2, 0, 0.1], thighR: [-1.3, 0, -0.1], kneeL: 1.6, kneeR: 1.7, armL: [-1.0, 0.3, 0.3], elbowL: -1.4, armR: [-0.3, 0, -0.2] }); em.expr = 'sad'; },
      update(lt) { E.cam(X(0.25, 1.05, -2.6), X(-0.45, 0.75, -2.6), { fov: 70, shake: 0.004 }); },
    },
    // CLIFF – Mama's video call
    {
      beats: [['sfx', 'ringtone', { d: 2.2, vol: 0.7 }], ['wait', 2.0], ['sfx', 'click', { vol: 0.5 }],
        ['say', 'MAMA', 'Schatz? Oh Gott, du lebst! Wir sind im Auto, auf der Bundesstraße, hier sind überall Leute…', { fx: 'phone' }],
        ['say', 'MAMA', 'Die rennen auf die Autos zu! Papa, fahr! FAHR!', { fx: 'phone' }], ['sfx', 'glass', { vol: 0.6 }], ['sfx', 'scream', { off: 0.1, vol: 0.8, d: 1.4 }],
        ['wait', 1.5], ['sfx', 'static', { d: 0.6 }], ['wait', 0.8], ['text', 'Mama…?', 1.6], ['sfx', 'boom', { vol: 1 }], ['fx', 'black', { off: 0.05, d: 1.4 }], ['wait', 1.4]],
      music: 'heart', amb: 'room',
      init() { pov.setPov('phoneClose'); },
      update(lt, d) {
        E.phone((g) => {
          if (lt < 2.0) return E.ui.call(g, 'Mama ❤', 'Videoanruf…');
          const end = lt > d - 4.0;
          g.fillStyle = end ? '#111' : '#3a3f4a'; g.fillRect(0, 0, 360, 760);
          if (!end) {   // shaky car interior video
            const sh = Math.sin(lt * 23) * 6;
            g.fillStyle = '#8aa0b8'; g.fillRect(0 + sh, 60, 360, 220); g.fillStyle = '#2a2d34'; g.fillRect(0, 280, 360, 480);
            g.fillStyle = '#e8c4a4'; g.beginPath(); g.ellipse(180 + sh, 430, 95, 120, 0, 0, 7); g.fill(); g.fillStyle = '#7a5a3a'; g.beginPath(); g.ellipse(180 + sh, 345, 105, 60, 0, Math.PI, 0); g.fill();
            g.fillStyle = '#222'; g.beginPath(); g.arc(145 + sh, 420, 9, 0, 7); g.arc(215 + sh, 420, 9, 0, 7); g.fill();
            g.fillStyle = '#5a1a1e'; g.beginPath(); g.ellipse(180 + sh, 490, 22, 14 + Math.abs(Math.sin(lt * 14)) * 10, 0, 0, 7); g.fill();
            if (lt > 6.5) { g.fillStyle = 'rgba(150,20,20,0.5)'; g.fillRect(0, 0, 360, 760); }
          } else { g.fillStyle = '#fff'; g.font = 'bold 30px sans-serif'; g.textAlign = 'center'; g.fillText('Anruf beendet', 180, 380); g.textAlign = 'left'; }
        });
        E.cam(X(-0.2, 1.1, -2.2), X(-0.2, 0.5, -3.5), { fov: 82, shake: 0.006 });
      },
    },
    { card: ['TEIL 4', 'Kein Netz'], beats: [['wait', 2.2]], music: 'none', amb: 'none' },
  ];
  return { meta: { n: 3, title: 'Krause', clock: { date: '2026-11-24', time: '07:01' } }, shots };
}
