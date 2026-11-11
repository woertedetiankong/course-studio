// Check the moments frames.mjs doesn't: frames.mjs renders the end of each line; this renders the switches between
// lines, where two layouts can overlap (a crossfade instead of fade-out-then-in), a guess card is still visible when
// the answer starts, or a picture is half way through leaving (video-paper.md workflow step 4, video.md "Check frames").
//   node moments.mjs                    every line start: 0.25 s before and 0.15 s after, tiled 3×2 per scene
//   node moments.mjs cfg ablate         only these scenes
//   node moments.mjs cfg:16:+0.1 guess:4:-0.05   exact moments: scene:line:offset (seconds from that line's start)
// Writes frames/moments-<scene>-<k>.jpg (tiles) or frames/m-<scene>-<line><±offset>.jpg (exact moments). Read them.
import { chromium } from 'playwright-core';
import { execSync } from 'child_process';
import fs from 'fs';
const args = process.argv.slice(2), exact = args.filter(a => a.includes(':')), only = args.filter(a => !a.includes(':'));
const TL = JSON.parse(fs.readFileSync('timeline.json', 'utf8'));
const b = await chromium.launch({executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const p = await b.newPage({viewport: {width: 1920, height: 1080}});
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto('file://' + process.cwd() + '/index.html?record'); await p.evaluate(() => ready);
fs.mkdirSync('frames', {recursive: true});
const shot = async (t, f) => { const u = await p.evaluate(t => { render(t); return cv.toDataURL('image/jpeg', .8); }, t); fs.writeFileSync(f, Buffer.from(u.split(',')[1], 'base64')); };
if (exact.length){
  for (const a of exact){ const [id, li, off] = a.split(':'), s = TL.scenes.find(x => x.id === id);
    if (!s || !s.beats[+li]){ console.error('no such moment:', a); continue; }
    await shot(s.start + s.beats[+li].start + parseFloat(off || 0), `frames/m-${id}-${li}${off || ''}.jpg`); }
} else {
  for (const s of TL.scenes){
    if (only.length && !only.includes(s.id)) continue;
    const files = [];
    for (const [i, bt] of s.beats.entries()){ if (!i) continue;          // line 0 starts with the scene's own fade-in
      for (const [dt, tag] of [[-.25, 'a'], [.15, 'b']]){ const f = `frames/mo-${s.id}-${i}${tag}.jpg`; await shot(s.start + bt.start + dt, f); files.push(f); } }
    for (let k = 0; k < files.length; k += 6){
      const g = files.slice(k, k + 6); while (g.length < 6) g.push(g[g.length - 1]);
      execSync(`ffmpeg -y -loglevel error ${g.map(f => '-i ' + f).join(' ')} -filter_complex "[0][1][2][3][4][5]xstack=inputs=6:layout=0_0|w0_0|w0+w1_0|0_h0|w0_h0|w0+w1_h0,scale=1920:-1" frames/moments-${s.id}-${k / 6}.jpg`);
    }
    files.forEach(f => fs.unlinkSync(f));
  }
}
console.log(errs.length ? 'ERRORS:\n' + [...new Set(errs)].join('\n') : 'no page errors');
await b.close();
