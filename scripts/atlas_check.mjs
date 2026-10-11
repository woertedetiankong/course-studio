#!/usr/bin/env node
// Check a project atlas against the real repo, so nothing on the map is made up.
//   node atlas_check.mjs --data site/web/js/atlas.data.js --repo ../servohub
// Checks: every L() has English; node paths exist; every name written like foo() exists in the repo;
// route code lines appear, in order, in the step's file ("..." lines are cuts); zoom src equals the file lines;
// zoom call tags name something on that line; segments sit inside the function; ids referenced anywhere exist.
// Exit code 1 when anything fails.
import {readFileSync, existsSync, statSync, readdirSync} from 'node:fs';
import {join, extname} from 'node:path';
import vm from 'node:vm';

const arg = k => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : null; };
const dataPath = arg('data'), repo = arg('repo');
if (!dataPath || !repo) { console.error('usage: node atlas_check.mjs --data <atlas.data.js> --repo <repo root>'); process.exit(2); }

// load the data twice: once in Chinese (to read), once recording every L() call (to check English exists)
const missingEn = [];
const ctx = {window: {}, L: (zh, en) => { if (en == null || en === '') missingEn.push(zh); return zh; }};
vm.runInNewContext(readFileSync(dataPath, 'utf8'), ctx, {filename: dataPath});
const A = ctx.window.ATLAS;
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
// what an episode shows must sit on blocks that episode has already lit (default episode 1)
const litBy = (id, ep) => { const n = A.nodes.find(x => x.id === id); return n && n.eps.some(([e]) => e <= ep); };
for (const c of A.clocks || []){
  for (const [id, , ep] of c.calls) if (ids.has(id) && !litBy(id, ep ?? 1)) err(`clock ${c.id}`, `${id} is listed from episode ${ep ?? 1} but not lit until later: add ep to the call or light the block`);
  if (c.more && !(c.more[0] > 0)) err(`clock ${c.id}`, 'more must be [episode, text]');
}
for (const f of A.fields || []) for (const id of [...f.w, ...f.r]) if (ids.has(id) && !litBy(id, f.ep ?? 1)) err(`field ${f.f}`, `${id} is shown from episode ${f.ep ?? 1} but not lit until later`);
for (const [rid, R] of Object.entries(A.routes || {})) for (const st of R.steps) for (const id of st.n) if (ids.has(id) && !litBy(id, R.ep)) err(`route ${rid}`, `${id} is on the route of episode ${R.ep} but not lit until later`);
for (const zh of missingEn) err('English', `no English for: ${String(zh).slice(0, 60)}`);

for (const w of warn) console.log('warn  ' + w);
if (errors.length){ for (const e of errors) console.log('FAIL  ' + e); console.log(`\n${errors.length} problem(s).`); process.exit(1); }
console.log(`atlas ok: ${A.nodes.length} nodes, ${(A.clocks || []).length} clocks, ${(A.fields || []).length} fields, ${Object.keys(A.routes || {}).length} routes, ${Object.keys(A.eps || {}).length} episodes — every name, path and code line found in ${repo}`);
