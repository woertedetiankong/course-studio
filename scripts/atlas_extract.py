#!/usr/bin/env python3
"""Project atlas helper: read a codebase so the map (site/web/js/atlas.data.js) is built from facts, not memory.

  skeleton   list files, functions (start/end line), calls between them, goroutines (Go) and shared-state reads/writes
             python3 atlas_extract.py skeleton --lang c  --root servohub --paths app motor_control ... [--board "kAxis.,axis->"] --out skeleton.json
             python3 atlas_extract.py skeleton --lang go --root 6.5840/src --paths raft kvraft [--board "rf."] --out skeleton.json
  fn         print one function's lines with numbers (to read it before writing a zoom entry)
             python3 atlas_extract.py fn --root servohub --file motor_control/motor_ctl_loop.c --name PosSpeedLoopCtrl
  fill       refill every  src: /*SRC <path> <start>-<end>*/ [...]  in the data file from the repo (run after any repo update)
             python3 atlas_extract.py fill --root servohub --data site/web/js/atlas.data.js
  calls      who calls a function, and what it calls (quick lookups while drawing the map)
             python3 atlas_extract.py calls --skeleton skeleton.json --name AppRun

C is parsed with a light scanner (definitions at column 0, brace matching); Go uses go/ast through atlas_go/main.go.
Neither resolves calls through function pointers or interfaces: list those in the report and check them by hand.
"""
import argparse, json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
C_EXT = ('.c', '.h')
KEYWORDS = {'if', 'for', 'while', 'switch', 'return', 'sizeof', 'defined', 'else', 'do', 'case', 'typedef', 'struct', 'union', 'enum'}

# ---------------------------------------------------------------- C
def strip_c(text):
    """Blank out comments and string/char literals, keeping line breaks, so braces and calls can be counted."""
    out, i, n = [], 0, len(text)
    while i < n:
        c = text[i]
        if text.startswith('//', i):
            j = text.find('\n', i); j = n if j < 0 else j
            out.append(' ' * (j - i)); i = j
        elif text.startswith('/*', i):
            j = text.find('*/', i + 2); j = n if j < 0 else j + 2
            out.append(re.sub(r'[^\n]', ' ', text[i:j])); i = j
        elif c in '"\'':
            j = i + 1
            while j < n and text[j] != c:
                j += 2 if text[j] == '\\' else 1
            j = min(j + 1, n)
            out.append(c + re.sub(r'[^\n]', ' ', text[i + 1:j - 1]) + c if j - i >= 2 else text[i:j]); i = j
        else:
            out.append(c); i += 1
    return ''.join(out)

DEF_HEAD = re.compile(r'^(?!(?:typedef|struct|union|enum|return|else|if|for|while|switch)\b)[A-Za-z_][\w\s\*]*?\b([A-Za-z_]\w*)\s*\(')

def c_functions(path, board):
    raw = open(path, encoding='utf-8', errors='replace').read()
    src = strip_c(raw)
    lines = src.split('\n'); raw_lines = raw.split('\n')
    funcs, i = [], 0
    while i < len(lines):
        m = DEF_HEAD.match(lines[i])
        if not m or lines[i].startswith((' ', '\t', '#')):
            i += 1; continue
        # find '{' (definition) or ';' (prototype) after the parameter list
        j, depth, seen_paren, kind = i, 0, False, None
        while j < len(lines) and kind is None:
            for ch in lines[j][(m.end() - 1) if j == i else 0:]:
                if ch == '(':
                    depth += 1; seen_paren = True
                elif ch == ')':
                    depth -= 1
                elif depth == 0 and seen_paren and ch == ';':
                    kind = 'proto'; break
                elif depth == 0 and seen_paren and ch == '{':
                    kind = 'def'; break
            if kind is None:
                j += 1
                if j - i > 12: break
        if kind != 'def':
            i = j + 1 if kind else i + 1; continue
        # match braces from line j
        level, k, end = 0, j, None
        while k < len(lines) and end is None:
            for ch in lines[k]:
                if ch == '{': level += 1
                elif ch == '}':
                    level -= 1
                    if level == 0: end = k; break
            k += 1
        end = end if end is not None else len(lines) - 1
        body = lines[j:end + 1]
        calls = []
        for off, ln in enumerate(body):
            for cm in re.finditer(r'\b([A-Za-z_]\w*)\s*\(', ln):
                if cm.group(1) not in KEYWORDS:
                    calls.append([j + off + 1, cm.group(1)])
        f = {'name': m.group(1), 'start': i + 1, 'end': end + 1, 'calls': calls}
        if board:
            w, r = [], []
            for off, ln in enumerate(raw_lines[j:end + 1]):
                code = strip_c(ln)
                for b in board:
                    for bm in re.finditer(re.escape(b) + r'([A-Za-z_][\w.\[\]>-]*)', code):
                        field = re.sub(r'\[[^\]]*\]', '', bm.group(1)).replace('->', '.')
                        rest = code[bm.end():].lstrip()
                        (w if re.match(r'(=(?!=)|\+=|-=|\*=|/=|\+\+|--)', rest) else r).append([j + off + 1, field])
            f['writes'], f['reads'] = w, r
        funcs.append(f)
        i = end + 1
    return funcs, len(raw_lines)

# ---------------------------------------------------------------- Go
def go_functions(root, paths, board):
    prog = os.path.join(HERE, 'atlas_go')
    args = ['go', 'run', '.', '-root', os.path.abspath(root), '-board', ','.join(board or [])] + list(paths or ['.'])
    out = subprocess.run(args, cwd=prog, capture_output=True, text=True)
    if out.returncode:
        sys.exit('go extractor failed:\n' + out.stderr)
    return json.loads(out.stdout)

# ---------------------------------------------------------------- commands
def walk(root, paths, exts, exclude):
    for p in paths or ['.']:
        base = os.path.join(root, p)
        if os.path.isfile(base):
            yield os.path.relpath(base, root); continue
        for d, dirs, files in os.walk(base):
            dirs[:] = sorted(x for x in dirs if not any(e in os.path.join(d, x) for e in exclude))
            for f in sorted(files):
                full = os.path.join(d, f)
                if f.endswith(exts) and not any(e in full for e in exclude):
                    yield os.path.relpath(full, root)

def cmd_skeleton(a):
    board = [b for b in (a.board or '').split(',') if b]
    if a.lang == 'go':
        files = go_functions(a.root, a.paths, board)
    else:
        files = []
        for rel in walk(a.root, a.paths, C_EXT, a.exclude):
            funcs, n = c_functions(os.path.join(a.root, rel), board)
            files.append({'path': rel, 'lines': n, 'funcs': funcs})
    defined = {}
    for f in files:
        for fn in f['funcs']:
            defined.setdefault(fn['name'], []).append(f['path'])
    unresolved = set()
    for f in files:
        for fn in f['funcs']:
            keep = []
            for line, name, *rest in fn['calls']:
                if name in defined:
                    keep.append([line, name, defined[name][0]] + rest)
                else:
                    unresolved.add(name)
            fn['calls'] = keep
    sk = {'lang': a.lang, 'root': os.path.abspath(a.root), 'files': files, 'defined': {k: v for k, v in sorted(defined.items())}}
    json.dump(sk, open(a.out, 'w'), ensure_ascii=False, indent=1)
    nf = sum(len(f['funcs']) for f in files)
    print(f'{len(files)} files, {nf} functions, {sum(f["lines"] for f in files)} lines → {a.out}')
    print(f'{len(unresolved)} called names are not defined in these paths (library calls, macros, function pointers); check by hand if they matter.')

def cmd_fn(a):
    path = os.path.join(a.root, a.file)
    if a.file.endswith('.go'):
        sk = go_functions(a.root, [os.path.dirname(a.file) or '.'], [])
        funcs = next((f['funcs'] for f in sk if f['path'] == a.file), [])
    else:
        funcs, _ = c_functions(path, [])
    hits = [f for f in funcs if f['name'] == a.name]
    if not hits:
        sys.exit(f'{a.name} not found in {a.file}')
    lines = open(path, encoding='utf-8').read().split('\n')
    for f in hits:
        print(f"# {a.file} {f['name']} lines {f['start']}-{f['end']}  →  src: /*SRC {a.file} {f['start']}-{f['end']}*/ []")
        for n in range(f['start'], f['end'] + 1):
            print(f'{n:5} {lines[n - 1]}')

SRC_MARK = re.compile(r'/\*SRC (\S+) (\d+)-(\d+)\*/\s*')

def cmd_fill(a):
    text, out, pos, count = open(a.data, encoding='utf-8').read(), [], 0, 0
    dec = json.JSONDecoder()
    for m in SRC_MARK.finditer(text):
        if m.start() < pos: continue
        path, s, e = m.group(1), int(m.group(2)), int(m.group(3))
        _, end = dec.raw_decode(text, m.end())          # the old array, whatever it holds
        lines = open(os.path.join(a.root, path), encoding='utf-8').read().split('\n')
        if e > len(lines):
            sys.exit(f'{path} has {len(lines)} lines, marker asks for {s}-{e}')
        out += [text[pos:m.end()], json.dumps(lines[s - 1:e], ensure_ascii=False)]
        pos, count = end, count + 1
    out.append(text[pos:])
    open(a.data, 'w', encoding='utf-8').write(''.join(out))
    print(f'filled {count} src block(s) in {a.data}')

def cmd_calls(a):
    sk = json.load(open(a.skeleton))
    for f in sk['files']:
        for fn in f['funcs']:
            if fn['name'] == a.name:
                print(f"{a.name}  {f['path']}:{fn['start']}-{fn['end']}")
                for line, name, where, *rest in fn['calls']:
                    print(f"  calls {name:40} {where}  (line {line}){'  [go]' if rest and rest[0] == 'go' else ''}")
    print('called by:')
    for f in sk['files']:
        for fn in f['funcs']:
            for line, name, *_ in fn['calls']:
                if name == a.name:
                    print(f"  {fn['name']:40} {f['path']}:{line}")

ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
sub = ap.add_subparsers(dest='cmd', required=True)
s = sub.add_parser('skeleton'); s.add_argument('--lang', choices=['c', 'go'], required=True); s.add_argument('--root', required=True)
s.add_argument('--paths', nargs='*'); s.add_argument('--exclude', nargs='*', default=[]); s.add_argument('--board'); s.add_argument('--out', default='atlas.skeleton.json')
s.set_defaults(func=cmd_skeleton)
s = sub.add_parser('fn'); s.add_argument('--root', required=True); s.add_argument('--file', required=True); s.add_argument('--name', required=True); s.set_defaults(func=cmd_fn)
s = sub.add_parser('fill'); s.add_argument('--root', required=True); s.add_argument('--data', required=True); s.set_defaults(func=cmd_fill)
s = sub.add_parser('calls'); s.add_argument('--skeleton', required=True); s.add_argument('--name', required=True); s.set_defaults(func=cmd_calls)
a = ap.parse_args(); a.func(a)
