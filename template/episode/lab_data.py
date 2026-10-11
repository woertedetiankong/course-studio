"""Engine B (replay of real runs): run the real program for every case the lab offers and write the results,
plus the source excerpts the page quotes, into lab.html between the LAB-DATA markers, so the page stays one file.
See references/lab-page.md, "Replay of real runs". Delete this file if the lab uses a JS simulator (engine A).

Fill in the three marked parts, then run it after every rebuild of the program or update of the repo:
    python3 lab_data.py
In lab.html put exactly one   /*LAB-DATA*//*END-LAB-DATA*/   inside a <script>; the page then reads RUNS and SNIPS.
References: robot-course/episodes/ep02-sil/lab_data.py (CSV waveforms), ep36-one-command/lab_data.py (JSON per case).
"""
import json, os, re, subprocess
HERE = os.path.dirname(os.path.abspath(__file__))

# 1. the real program and the repo it is built from (paths relative to this folder)
PROGRAM = os.path.join(HERE, '..', '..', 'harness', 'build', 'run_case')    # TODO
REPO = os.path.join(HERE, '..', '..', 'repo')                                # TODO

# 2. the cases: name -> command-line arguments (each also becomes the repro command shown on the page)
CASES = {                                                                    # TODO
    'ok': ['--scenario', 'ok'],
}

# 3. source excerpts the page quotes: key -> [(file in REPO, first line, last line), ...]; gaps show as "…"
SNIP = {                                                                     # TODO
    # 'entry': [('src/main.c', 10, 24)],
}


def run(args):
    """Run one case and return what the page needs. Keep full rate where a transient lives; downsample the rest."""
    out = subprocess.run([PROGRAM, *args], capture_output=True, text=True, check=True).stdout
    return json.loads(out)          # or parse CSV, as in ep02-sil/lab_data.py


def snip(parts):
    """Cut excerpts from the repo by line range, so the page never holds hand-copied code."""
    out = []
    for k, (f, a, b) in enumerate(parts):
        lines = open(os.path.join(REPO, f), encoding='utf-8').read().split('\n')[a - 1:b]
        if k: out.append('…')
        ind = min((len(l) - len(l.lstrip()) for l in lines if l.strip()), default=0)
        out += [l[ind:].rstrip() for l in lines]
    return {'lines': [list(p) for p in parts], 'code': '\n'.join(out)}


runs = {}
for name, args in CASES.items():
    runs[name] = run(args)
    runs[name]['cmd'] = ' '.join([os.path.basename(PROGRAM), *args])
    print(f'{name:16} ok')

blob = ('/*LAB-DATA*/const RUNS = ' + json.dumps(runs, separators=(',', ':')) + ';\nconst SNIPS = '
        + json.dumps({k: snip(v) for k, v in SNIP.items()}, ensure_ascii=False, separators=(',', ':')) + ';/*END-LAB-DATA*/')
path = os.path.join(HERE, 'lab.html')
html = open(path, encoding='utf-8').read()
html, n = re.subn(r'/\*LAB-DATA\*/.*?/\*END-LAB-DATA\*/', lambda m: blob, html, flags=re.S)
assert n == 1, 'lab.html needs exactly one /*LAB-DATA*/…/*END-LAB-DATA*/ marker'
open(path, 'w', encoding='utf-8').write(html)
print(f'wrote {len(blob) // 1024} KB into lab.html')
