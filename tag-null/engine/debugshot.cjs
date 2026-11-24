// Debug: node engine/debugshot.cjs ep02 30.0 "E.camera.position.set(...)" out.jpg
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const [ep, T, js, out] = process.argv.slice(2);
const root = path.join(__dirname, '..');
const srv = require('./serve.cjs')(8890 + Math.floor(Math.random() * 9));
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 720, height: 1280 } });
  p.on('pageerror', e => console.log('ERR', e.message)); p.on('console', m => console.log('LOG', m.text()));
  await p.goto(`http://localhost:${srv.address().port}/engine/player.html`); await p.waitForFunction('window.ready===true');
  await p.evaluate((n) => window.loadEpisode(n), ep);
  await p.evaluate((t) => window.setup(t), JSON.parse(fs.readFileSync(path.join(root, 'build', ep, 'timing.json'))));
  const url = await p.evaluate(async ([t, code]) => {
    window.frameAt(Number(t));
    if (code) await eval('(async()=>{' + code + '})()');
    const core = await import('/engine/core.js');
    return core.renderFrame(Number(t)).toDataURL('image/jpeg', 0.9);
  }, [T, js || '']);
  fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
  await b.close(); srv.close();
})();
