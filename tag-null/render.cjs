// Usage: node render.cjs ep01 [--preview t1,t2,...] [--from s --to s]
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
const ep = process.argv[2];
const args = process.argv.slice(3);
const prevArg = args.indexOf('--preview') >= 0 ? args[args.indexOf('--preview') + 1] : null;
const port = 8800 + Math.floor(Math.random() * 100);
const srv = require('./engine/serve.cjs')(port);
const B = path.join(__dirname, 'build', ep); fs.mkdirSync(B, { recursive: true });
const OUT = path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 720, height: 1280 } });
  p.on('pageerror', e => console.log('PAGE ERR', e.message)); p.on('console', m => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });
  await p.goto(`http://localhost:${port}/engine/player.html`);
  await p.waitForFunction('window.ready === true', null, { timeout: 120000 });
  const lines = await p.evaluate((n) => window.loadEpisode(n), ep);
  fs.writeFileSync(path.join(B, 'lines.json'), JSON.stringify(lines));
  execFileSync('python3', [path.join(__dirname, 'audio', 'tts.py'), path.join(B, 'lines.json'), path.join(B, 'timing.json')], { stdio: 'inherit' });
  const timing = JSON.parse(fs.readFileSync(path.join(B, 'timing.json')));
  const cues = await p.evaluate((t) => window.setup(t), timing);
  fs.writeFileSync(path.join(B, 'cues.json'), JSON.stringify(cues));
  console.log(ep, 'duration', cues.d.toFixed(1), 's');
  if (prevArg) {
    const ts = prevArg === 'auto' ? Array.from({ length: 12 }, (_, i) => cues.d * (i + 0.5) / 12) : prevArg.split(',').map(Number);
    for (const t of ts) { const url = await p.evaluate((T) => window.frameAt(T), t); fs.writeFileSync(path.join(B, `prev_${t.toFixed(1).padStart(5, '0')}.jpg`), Buffer.from(url.split(',')[1], 'base64')); }
    await b.close(); srv.close(); return;
  }
  execFileSync('python3', [path.join(__dirname, 'audio', 'mix.py'), path.join(B, 'cues.json'), path.join(B, 'audio.wav')], { stdio: 'inherit' });
  const mp4 = path.join(OUT, `${ep}.mp4`);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '24', '-c:v', 'mjpeg', '-i', '-', '-i', path.join(B, 'audio.wav'),
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', mp4], { stdio: ['pipe', 'inherit', 'inherit'] });
  const N = Math.ceil(cues.d * 24); const t0 = Date.now();
  for (let i = 0; i < N; i++) {
    const url = await p.evaluate((T) => window.frameAt(T), i / 24);
    const buf = Buffer.from(url.split(',')[1], 'base64');
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 240 === 0) console.log(`${ep} frame ${i}/${N} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  console.log('done', mp4, ((Date.now() - t0) / 1000).toFixed(0) + 's');
  await b.close(); srv.close();
})();
