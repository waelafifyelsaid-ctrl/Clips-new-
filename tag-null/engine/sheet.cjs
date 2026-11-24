// Contact sheet of single frames: node engine/sheet.cjs ep01 "41.5,43,45" out.jpg
// (renders each time in one browser session, frames are played up in order so shot init() runs)
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const [ep, times, out] = process.argv.slice(2);
const root = path.join(__dirname, '..');
const srv = require('./serve.cjs')(8870 + Math.floor(Math.random() * 9));
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 720, height: 1280 } });
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto(`http://localhost:${srv.address().port}/engine/player.html`); await p.waitForFunction('window.ready===true');
  await p.evaluate((n) => window.loadEpisode(n), ep);
  await p.evaluate((t) => window.setup(t), JSON.parse(fs.readFileSync(path.join(root, 'build', ep, 'timing.json'))));
  const ts = times.split(',').map(Number);
  const url = await p.evaluate(async (ts) => {
    const core = await import('/engine/core.js');
    const W = 240, H = 427, cols = Math.min(6, ts.length), rows = Math.ceil(ts.length / cols);
    const c = document.createElement('canvas'); c.width = W * cols; c.height = H * rows; const g = c.getContext('2d');
    ts.forEach((t, i) => {
      for (let k = 6; k >= 1; k--) window.frameAt(Math.max(0, t - k * 0.25));   // warm up so the shot's init() runs
      window.frameAt(t); const f = core.renderFrame(t);
      g.drawImage(f, (i % cols) * W, Math.floor(i / cols) * H, W, H);
      g.fillStyle = '#ff0'; g.font = 'bold 18px sans-serif'; g.fillText(t.toFixed(1), (i % cols) * W + 6, Math.floor(i / cols) * H + H - 8);
    });
    return c.toDataURL('image/jpeg', 0.85);
  }, ts);
  fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
  await b.close(); srv.close();
})();
