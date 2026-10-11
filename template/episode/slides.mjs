// 课件 / slide handout: one screenshot per beat of the finished video (no burned-in subtitles), the narration
// of that beat beside it. Consecutive beats of a scene merge into one slide when the picture barely changed, or when
// it only gained things (3b1b build-up: a term, a box, a curve appears) — the slide keeps the finished picture.
// Writes slides/NNN.jpg + slides.json + slides.html (Bento page: chapters, 中 / EN, jump into the video)
// + slides.pdf (A4 landscape handout, one slide per page, bilingual notes). Run after record.mjs.
// Usage: node slides.mjs [--min-diff 1.2] [--max-lines 6] [--keep-builds] [--no-pdf]
//   --min-diff: higher = fewer slides; --keep-builds: one slide per build step too; --max-lines: cap on lines per slide
import { chromium } from 'playwright-core';
import fs from 'fs';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const MIN_DIFF = +arg('--min-diff', 1.2), MAX_LINES = +arg('--max-lines', 6), BUILDS = !process.argv.includes('--keep-builds'), PDF = !process.argv.includes('--no-pdf');
const b = await chromium.launch({executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const p = await b.newPage({viewport: {width: 1920, height: 1080}});
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('file://' + process.cwd() + '/index.html?record&nosubs'); await p.evaluate(() => ready);
// Difference to the last kept slide: mean |Δ| per channel (0–255) on a 192×93 thumbnail of the content area
// (y ≥ 150, below the chapter title and progress ticks, which change every beat).
await p.evaluate(() => { window.__th = Object.assign(document.createElement('canvas'), {width: 192, height: 93}); window.__prev = null; });
const shoot = t => p.evaluate(t => {
  render(t); const x = __th.getContext('2d', {willReadFrequently: true}); x.drawImage(cv, 0, 150, 1920, 930, 0, 0, 192, 93);
  const d = x.getImageData(0, 0, 192, 93).data; let s = 0;
  if (__prev) for (let i = 0; i < d.length; i += 4) s += Math.abs(d[i] - __prev[i]) + Math.abs(d[i+1] - __prev[i+1]) + Math.abs(d[i+2] - __prev[i+2]);
  // additive: of the pixels that changed, almost none held content before (they were dark ground or panel fill)
  let ch = 0, lost = 0;
  if (__prev) for (let i = 0; i < d.length; i += 4) {
    if (Math.max(Math.abs(d[i] - __prev[i]), Math.abs(d[i+1] - __prev[i+1]), Math.abs(d[i+2] - __prev[i+2])) < 40) continue;
    ch++; if (.3 * __prev[i] + .59 * __prev[i+1] + .11 * __prev[i+2] > 70) lost++;
  }
  const diff = __prev ? s / (d.length / 4 * 3) : 1e9, additive = ch > 0 && lost / ch < .05;
  return {diff, additive, img: cv.toDataURL('image/jpeg', .85), sig: Array.from(d)};
}, t);
const TL = JSON.parse(fs.readFileSync('timeline.json', 'utf8'));
fs.rmSync('slides', {recursive: true, force: true}); fs.mkdirSync('slides');
const slides = []; let last = null;
for (const [si, s] of TL.scenes.entries()) {
  for (const bt of s.beats) {
    const t = s.start + bt.start + bt.dur * .92, r = await shoot(t);
    const line = [bt.text, bt.zh];
    await p.evaluate(sig => { __prev = sig; }, r.sig);
    if (last && last.scene === s.id && last.lines.length < MAX_LINES && (r.diff < MIN_DIFF || BUILDS && r.additive)) { last.lines.push(line); last.img = r.img; continue; }  // merge, keep the later frame
    last = {scene: s.id, ch: si, title: s.title, zh: s.zh, t: +(s.start + bt.start).toFixed(2), lines: [line], img: r.img};
    slides.push(last);
  }
}
const pad = n => String(n).padStart(3, '0');
for (const [i, sl] of slides.entries()) { fs.writeFileSync(`slides/${pad(i + 1)}.jpg`, Buffer.from(sl.img.split(',')[1], 'base64')); sl.img = `slides/${pad(i + 1)}.jpg`; }
const data = {total: TL.total, chapters: TL.scenes.map((s, i) => ({id: s.id, n: i, title: s.title, zh: s.zh, t: s.start})), slides};
fs.writeFileSync('slides.json', JSON.stringify(data, null, 1));
fs.writeFileSync('slides.html', fs.readFileSync('slides_page.html', 'utf8').replace('/*SLIDES*/null', JSON.stringify(data)));
if (PDF) {
  await p.goto('file://' + process.cwd() + '/slides.html?print'); await p.evaluate(() => document.fonts.ready);
  await p.waitForFunction(() => [...document.images].every(i => i.complete));
  await p.pdf({path: 'slides.pdf', format: 'A4', landscape: true, printBackground: true, preferCSSPageSize: true});
}
const beats = TL.scenes.reduce((n, s) => n + s.beats.length, 0);
console.log(`${slides.length} slides from ${beats} beats (min-diff ${MIN_DIFF})` + (PDF ? ' → slides.html + slides.pdf' : ' → slides.html'));
console.log(errs.length ? 'ERRORS:\n' + [...new Set(errs)].join('\n') : 'no page errors');
await b.close();
