const { chromium } = require('playwright'); const fs = require('fs');
const srv = require('./serve.cjs')(8770);
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 720, height: 1280 } });
  p.on('pageerror', e => console.log('ERR', e.message)); p.on('console', m => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });
  await p.goto('http://localhost:8770/engine/' + (process.argv[2] || 'test.html'));
  await p.waitForFunction('window.ready === true', null, { timeout: 120000 });
  for (let i = 0; i < 3; i++) {
    const [url, ms] = await p.evaluate((t) => window.go(t), i * 0.04);
    console.log('frame ms', ms.toFixed(0));
    if (i === 2) fs.writeFileSync(process.argv[3] || '/tmp/claude-0/-home-user/7fc16fa2-a49a-5780-813e-e50812ce5f0c/scratchpad/t.jpg', Buffer.from(url.split(',')[1], 'base64'));
  }
  await b.close(); srv.close();
})();
