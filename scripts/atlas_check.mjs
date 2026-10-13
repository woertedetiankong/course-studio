#!/usr/bin/env node
// Check a project atlas against the real repo, so nothing on the map is made up.
//   node atlas_check.mjs --data site/web/js/atlas.data.js --repo ../servohub
// Checks: every L() has English; node paths exist; every name written like foo() exists in the repo;
// route code lines appear, in order, in the step's file ("..." lines are cuts); a step's src (and zoom src) equals the file lines,
// its hi / mark / cut lines sit inside them, each call-stack entry names something on its line, {placeholders} exist in the run;
// zoom call tags name something on that line; segments sit inside the function; ids referenced anywhere exist;
// what an episode shows sits on blocks lit by then, also counting released episodes only when course.js sits next to the data.
// Exit code 1 when anything fails.
import {readFileSync, existsSync, statSync, readdirSync} from 'node:fs';
import {join, extname, dirname} from 'node:path';
import vm from 'node:vm';

const arg = k => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : null; };
const dataPath = arg('data'), repo = arg('repo');
if (!dataPath || !repo) { console.error('usage: node atlas_check.mjs --data <atlas.data.js> --repo <repo root>'); process.exit(2); }

// load the data twice: once in Chinese (to read), once recording every L() call (to check English exists)
const missingEn = [];
const ctx = {window: {}, L: (zh, en) => { if (en == null || en === '') missingEn.push(zh); return zh; }};
vm.runInNewContext(readFileSync(dataPath, 'utf8'), ctx, {filename: dataPath});
const A = ctx.window.ATLAS, RUNS = ctx.window.ATLAS_RUNS || {};
// the English half too, for {placeholders} written in either language
const ctxEn = {window: {}, L: (zh, en) => en ?? zh};
vm.runInNewContext(readFileSync(dataPath, 'utf8'), ctxEn, {filename: dataPath});
const AE = ctxEn.window.ATLAS;
const errors = [], warn = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);

// index the repo: file text by path, and every identifier that appears
const SRC_EXT = new Set(['.c', '.h', '.go', '.py', '.ts', '.js', '.rs', '.cc', '.cpp', '.hpp', '.m', '.json', '.java']);
const files = new Map(), idents = new Set();
(function walk(dir){
  for (const e of readdirSync(dir, {withFileTypes: true})){
    if (e.name.startsWith('.') || e.name === 'node_modules') continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (SRC_EXT.has(extname(e.name))){
      const t = readFileSync(p, 'utf8'); files.set(p.slice(repo.length).replace(/^\/+/, ''), t);
      for (const m of t.matchAll(/[A-Za-z_]\w*/g)) idents.add(m[0]);
    }
  }
})(repo);
const fileText = rel => files.get(rel.replace(/^\/+/, ''));
const NAME = /(?<![\w*…])([A-Za-z_]\w*)\s*\(\)/g;   // names written as foo() in prose / lists; MX_*_Init() style wildcards are skipped
const checkNames = (where, s) => { for (const m of String(s).matchAll(NAME)) if (!idents.has(m[1])) err(where, `${m[1]}() not found in the repo`); };

const ids = new Set(A.nodes.map(n => n.id)), layerKeys = new Set(A.layers.map(l => l.k));
for (const n of A.nodes){
  const w = `node ${n.id}`;
  if (!layerKeys.has(n.k) && !n.board) err(w, `unknown layer ${n.k}`);
  if (n.path && !existsSync(join(repo, n.path))) err(w, `path ${n.path} does not exist`);
  (n.fns || []).forEach(f => checkNames(w, f));
  checkNames(w, n.plain);
  for (const [e, l] of n.eps || []) if (!['s', 'r'].includes(l) || !(e > 0)) err(w, `bad eps entry ${e},${l}`);
}
for (const c of A.clocks || []) for (const [id, fn] of c.calls){ if (!ids.has(id)) err(`clock ${c.id}`, `unknown node ${id}`); checkNames(`clock ${c.id}`, fn); }
for (const f of A.fields || []){
  const w = `field ${f.f}`;
  for (const id of [...f.w, ...f.r]) if (!ids.has(id)) err(w, `unknown node ${id}`);
  for (const part of f.f.replace(/\[.*?\]/g, '').split('.')) if (!idents.has(part)) err(w, `${part} not found in the repo`);
  checkNames(w, f.how);
}
const norm = s => s.trim().replace(/\s+/g, ' ');
for (const [rid, R] of Object.entries(A.routes || {})){
  R.steps.forEach((st, i) => {
    const w = `route ${rid} step ${i + 1}`;
    for (const id of st.n) if (!ids.has(id)) err(w, `unknown node ${id}`);
    checkNames(w, st.p);
    if (st.src){   // verbatim lines with real numbers (filled by atlas_extract.py fill), values from the run beside them
      const t = st.file && fileText(st.file);
      if (!t) err(w, st.file ? `file ${st.file} not found` : 'has src but no file');
      else if (!st.src.length) err(w, 'src is empty: run atlas_extract.py fill');
      else { const ls = t.split('\n'); st.src.forEach((x, k) => { if (ls[st.start - 1 + k] !== x) err(w, `src line ${st.start + k} differs from the file: run atlas_extract.py fill`); }); }
      const end = st.start + st.src.length - 1, inside = no => no >= st.start && no <= end;
      for (const no of [...(st.hi || []), ...Object.keys(st.mark || {}).map(Number)]) if (!inside(no)) err(w, `line ${no} is outside the shown lines ${st.start}-${end}`);
      for (const [a, b] of st.cut || []) if (!(inside(a) && inside(b) && a <= b)) err(w, `cut ${a}-${b} is outside the shown lines ${st.start}-${end}`);
    }
    for (const [f, no, label] of st.stack || []){   // call stack: [file, line, what is called / defined there]
      const t = fileText(f); if (!t){ err(w, `stack: file ${f} not found`); continue; }
      const name = label.replace(/^\./, '').replace(/\(\)$/, '').replace(/\[.*$/, '');
      if (!(t.split('\n')[no - 1] || '').includes(name)) err(w, `stack: line ${no} of ${f} does not contain ${name}`);
    }
    if (st.fn && !(A.zoom?.[st.n[0]]?.fns || []).some(f => f.id === st.fn)) err(w, `fn ${st.fn} is not a function in the zoom of ${st.n[0]}`);
    if (!st.code) return;
    if (!st.file){ err(w, 'has code but no file'); return; }
    const t = fileText(st.file); if (!t){ err(w, `file ${st.file} not found`); return; }
    const lines = t.split('\n').map(norm); let at = 0;
    for (const want of st.code.split('\n').map(norm)){
      if (!want || want === '...') continue;
      const k = lines.indexOf(want, at);
      if (k < 0){ err(w, `line not found in ${st.file} (in order): ${want}`); break; }
      at = k + 1;
    }
  });
  if (R.loopTo != null && !R.steps[R.loopTo]) err(`route ${rid}`, 'loopTo points past the last step');
  // {name} placeholders, in both languages, must exist in the run the route quotes (written by the course's runs script)
  for (const X of [R, AE.routes[rid]]){
    const texts = [X.example, X.done, ...X.steps.flatMap(st => [st.t, st.p, ...Object.values(st.mark || {})])].filter(Boolean);
    const vals = X.run ? RUNS[X.run] : null;
    if (X.run && !vals){ err(`route ${rid}`, `run ${X.run} has no values in ATLAS_RUNS: run the course's runs script`); break; }
    for (const s of texts) for (const m of String(s).matchAll(/\{(\w+)\}/g))
      if (!vals || !(m[1] in vals)) err(`route ${rid}`, `{${m[1]}} is not a value of run ${X.run || '(none: set run)'}`);
  }
}
for (const [nid, Z] of Object.entries(A.zoom || {})){
  const node = A.nodes.find(n => n.id === nid); if (!node){ err(`zoom ${nid}`, 'unknown node'); continue; }
  const t = fileText(node.path); if (!t){ err(`zoom ${nid}`, `file ${node.path} not found`); continue; }
  const lines = t.split('\n'), count = lines.length - (t.endsWith('\n') ? 1 : 0);
  if (Z.lines !== count) err(`zoom ${nid}`, `lines is ${Z.lines}, the file has ${count}`);
  for (const f of Z.fns){
    const w = `zoom ${nid} ${f.name}`;
    const head = lines.slice(f.span[0] - 1, f.span[0] + 1).join(' ');
    const bare = f.name.replace(/\(\)$/, '').replace(/\*$/, '');
    if (!f.minor && !head.includes(bare)) err(w, `line ${f.span[0]} does not start ${f.name}`);
    for (const [id, fn] of f.calls || []){ if (!ids.has(id)) err(w, `unknown node ${id}`); checkNames(w, fn); }
    if (f.by && !ids.has(f.by[0])) err(w, `unknown node ${f.by[0]}`);
    if (!f.src) continue;
    if (!f.src.length) err(w, 'src is empty: run atlas_extract.py fill');
    f.src.forEach((s, i) => { if (lines[f.start - 1 + i] !== s) err(w, `src line ${f.start + i} differs from the file: run atlas_extract.py fill`); });
    for (const [no, list] of Object.entries(f.at || {})) for (const [id, fn] of list){
      if (!ids.has(id)) err(w, `unknown node ${id}`);
      if (!(lines[no - 1] || '').includes(fn)) err(w, `line ${no} does not contain ${fn}`);
    }
    for (const g of f.segs || []) if (g.a < f.start || g.b > f.start + f.src.length - 1) err(w, `segment ${g.a}-${g.b} is outside the shown lines`);
    if (!f.segs || !f.at) err(w, 'a code view needs segs and at (either may be empty)');
    for (const [no, targets] of Object.entries(f.ptr || {})){   // a call through a function pointer: its possible targets in this file
      if (no < f.start || no > f.start + f.src.length - 1) err(w, `ptr line ${no} is outside the shown lines`);
      for (const id of targets) if (!Z.fns.some(x => x.id === id)) err(w, `ptr target ${id} is not a function in this zoom`);
    }
  }
}
for (const [ep, E] of Object.entries(A.eps || {})){
  for (const r of E.routes || []) if (!A.routes[r]) err(`ep ${ep}`, `unknown route ${r}`);
  (E.qs || []).forEach((q, i) => {
    const w = `ep ${ep} question ${i + 1}`;
    for (const id of [].concat(q.a)) if (!ids.has(id)) err(w, `answer ${id} is not a node`);
    for (const id of Object.keys(q.per || {})) if (!ids.has(id)) err(w, `per ${id} is not a node`);
    checkNames(w, q.why);
  });
  if (!A.nodes.some(n => n.eps.some(([e]) => e === +ep))) warn.push(`ep ${ep}: no node lights up in this episode`);
}
// what an episode shows must sit on blocks that episode has already lit (default episode 1).
// A call's or field's episode may be a list of every episode that teaches it; learners see it from the first released one.
// Learners see released episodes only (course.js status other than 'planned'), so when course.js sits next to the data file,
// also check that the first released episode an item shows in has its blocks lit by released episodes.
let released = null;
const coursePath = join(dirname(dataPath), 'course.js');
if (existsSync(coursePath)){
  const c = {window: {}}; vm.runInNewContext(readFileSync(coursePath, 'utf8'), c, {filename: coursePath});
  released = new Set((c.window.EPISODES || []).filter(e => e.status !== 'planned').map(e => e.n));
}
const epList = e => [].concat(e ?? 1);
const litBy = (id, ep, onlyReleased) => { const n = A.nodes.find(x => x.id === id); return n && n.eps.some(([e]) => e <= ep && (!onlyReleased || released.has(e))); };
const checkLit = (where, id, eps, what) => {
  if (!ids.has(id)) return;
  for (const e of epList(eps)){
    if (!(e > 0)) { err(where, `bad episode ${e}`); continue; }
    if (!litBy(id, e)) err(where, `${id} is ${what} from episode ${e} but not lit until later: change the episode or light the block`);
  }
  const first = released && epList(eps).filter(e => released.has(e)).sort((a, b) => a - b)[0];
  if (first != null && !litBy(id, first, true))
    err(where, `${id} shows to learners from episode ${first} (the first released episode it lists), but no released episode lights it by then: light it in episode ${first} or list another episode`);
};
for (const c of A.clocks || []){
  for (const [id, , ep] of c.calls) checkLit(`clock ${c.id}`, id, ep, 'listed');
  if (c.more && !(c.more[0] > 0)) err(`clock ${c.id}`, 'more must be [episode, text]');
}
for (const f of A.fields || []) for (const id of [...f.w, ...f.r]) checkLit(`field ${f.f}`, id, f.ep, 'shown');
for (const [rid, R] of Object.entries(A.routes || {})) for (const st of R.steps) for (const id of st.n) checkLit(`route ${rid}`, id, R.ep, 'on the route');
for (const [ep, E] of Object.entries(A.eps || {})) (E.qs || []).forEach((q, i) => { for (const id of [].concat(q.a)) checkLit(`ep ${ep} question ${i + 1}`, id, +ep, 'the answer'); });
for (const zh of missingEn) err('English', `no English for: ${String(zh).slice(0, 60)}`);

for (const w of warn) console.log('warn  ' + w);
if (errors.length){ for (const e of errors) console.log('FAIL  ' + e); console.log(`\n${errors.length} problem(s).`); process.exit(1); }
console.log(`atlas ok: ${A.nodes.length} nodes, ${(A.clocks || []).length} clocks, ${(A.fields || []).length} fields, ${Object.keys(A.routes || {}).length} routes, ${Object.keys(A.eps || {}).length} episodes — every name, path and code line found in ${repo}` +
  (released ? `; lighting checked for released episodes ${[...released].sort((a, b) => a - b).join(', ')}` : ''));
