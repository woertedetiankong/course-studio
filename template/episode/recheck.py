#!/usr/bin/env python3
"""Listen again after tts.py (Chinese narration): every line whose subtitle has digits, Latin letters or π / β is
transcribed by the ears CHECK_PROVIDER picks (asr.py), and each digit / Latin token the subtitle writes must be in the
transcript. references/video-paper.md "Checking Chinese narration", steps 1 and 3.

    python3 recheck.py              # every such line
    python3 recheck.py cfg ablate   # only these scenes
    python3 recheck.py --n 5        # Gemini transcripts per line (default 3; MiniMax ASR is deterministic, asked once)
    CHECK_PROVIDER=both python3 recheck.py    # two independent ears (recommended for a MiniMax-voiced course)

Verdict per line:
  ok               no ear missed anything
  transcriber      Gemini missed once in N, everything else fine: the transcriber, not the voice
  voice?           every ear that heard it missed (Gemini ≥ 2/N, and MiniMax too if it listened): reword the line
                   (and its subtitle), voice it again, re-run
  listen           the ears disagree (one fine, one wrong ≥ 2/N or MiniMax wrong): a human decides; for a name or
                   version number run the forced-choice test first (video-paper.md, step 2)
The transcript goes through tts.py's Chinese-numeral → digit conversion (五分 → 5分), so numbers written as Chinese
characters are not reported, and words that only contain a numeral (这一集, 一种) are not checked as numbers.
"""
import hashlib, json, os, re, sys
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from asr import Ears

GLOBAL_ENV = os.path.expanduser('~/.config/course-studio/.env')
def find_env():
    d = os.path.abspath('.')
    while d != os.path.dirname(d):
        if os.path.exists(os.path.join(d, '.env')): return os.path.join(d, '.env')
        d = os.path.dirname(d)
read_env = lambda p: dict(l.strip().split('=', 1) for l in open(p) if '=' in l and not l.startswith('#')) if p and os.path.exists(p) else {}
ENV = {**read_env(GLOBAL_ENV), **read_env(find_env())}
cfg = lambda k, default=None: os.environ.get(k) or ENV.get(k) or default
EP = json.load(open('episode.json', encoding='utf-8')) if os.path.exists('episode.json') else {}
if (os.environ.get('NARRATION') or EP.get('narration') or cfg('NARRATION') or 'en').lower() != 'zh':
    raise SystemExit('recheck.py is for Chinese narration (episode.json "narration": "zh")')
EARS = Ears(cfg, 'zh')
if not EARS.active(): raise SystemExit(f'no ear available ({EARS.describe()})')
PROVIDER = (cfg('TTS_PROVIDER') or 'minimax').lower()
if PROVIDER == 'minimax': MODEL, VOICE, STYLE = cfg('MINIMAX_TTS_MODEL', 'speech-2.8-turbo'), cfg('MINIMAX_VOICE_ZH', 'Chinese (Mandarin)_Gentleman'), ''
else:
    MODEL, VOICE = cfg('GEMINI_TTS_MODEL', 'gemini-3.8-flash-tts'), cfg('GEMINI_VOICE', 'Sulafat')
    STYLE = cfg('GEMINI_TTS_STYLE') or ('a clear, confident senior engineer explaining to a fellow engineer; natural, '
                                         'brisk but unhurried pace, precise, light emphasis on names and numbers')

# --- kept in sync with tts.py: Chinese numerals → digits ---
ZH_NUM, ZH_DIGIT = '零〇一二两三四五六七八九十百千万亿', {**{c: i for i, c in enumerate('零一二三四五六七八九')}, '〇': 0, '两': 2}
def zh_int(s):
    if all(c in ZH_DIGIT for c in s): return ''.join(str(ZH_DIGIT[c]) for c in s)
    total = section = num = 0
    for c in s:
        if c in ZH_DIGIT: num = ZH_DIGIT[c]
        elif c in '十百千': section += (num or 1) * 10 ** ('十百千'.index(c) + 1); num = 0
        elif c == '万': total += (section + num) * 10 ** 4; section = num = 0
        else: total = (total + section + num) * 10 ** 8; section = num = 0
    return str(total + section + num)
def zh_digits(x):
    x = x.replace('百分位', '%位')
    x = re.sub(rf'百分之([{ZH_NUM}点\d.]+)', r'\1%', x)
    x = re.sub(rf'([{ZH_NUM}]+)分之([{ZH_NUM}]+)', lambda m: f'{m[2]}/{m[1]}', x)
    x = re.sub(rf'([{ZH_NUM}]+)点([零〇一二三四五六七八九]+)(?![十百千])', lambda m: zh_int(m[1]) + '.' + ''.join(str(ZH_DIGIT[c]) for c in m[2]), x)
    return re.sub(rf'[{ZH_NUM}]+', lambda m: zh_int(m[0]) if any(c in ZH_DIGIT or c == '十' for c in m[0]) else m[0], x)   # a lone 万 / 亿 is a unit, not 0

args = sys.argv[1:]; N = 3
if '--n' in args: i = args.index('--n'); N = int(args[i + 1]); del args[i:i + 2]
only = set(args)
S = json.load(open('script.json', encoding='utf-8'))
said = lambda l: l[2] if len(l) > 2 and l[2] else l[1]
norm = lambda x: re.sub(r'\s+', '', zh_digits(x).lower())
tokens = lambda x: re.findall(r'\d+(?:\.\d+)?|[a-z][a-z*]*', re.sub(r'\s+', '', x.lower()))   # what the subtitle writes as digits / Latin
jobs = []
for sc in S:
    if only and sc['id'] not in only: continue
    for i, l in enumerate(sc['lines']):
        if not re.search(r'[0-9A-Za-zπβ]', l[1]): continue
        h = hashlib.sha1(f'{MODEL}|{VOICE}|{STYLE}|{said(l)}'.encode()).hexdigest()[:8]
        jobs.append((sc['id'], i, l[1], f'audio/{h}.src.wav'))
def run(j):
    if not os.path.exists(j[3]): return j, None
    heard, tried = {}, set()
    while True:            # re-read the active ears: if Gemini runs out mid-line, MiniMax still hears it
        todo = [p for p in EARS.active() if p not in tried]
        if not todo: break
        for p in todo:
            tried.add(p); ts = [t for t in (EARS.hear(j[3], p) for _ in range(N if p == 'gemini' else 1)) if t]
            if ts: heard[p] = ts
    return j, heard
print(f'{EARS.describe()} · Gemini ×{N}, MiniMax ×1')
with ThreadPoolExecutor(6) as ex: res = list(ex.map(run, jobs))
voice, listen, transcriber, unheard = [], [], 0, []
for (sid, i, zh, p), heard in res:
    if heard is None: print(f'??  {sid}[{i}] no clip (run tts.py first): {zh}'); continue
    if not heard: print(f'{"no transcript":<12} {sid}[{i}] {zh}   (no ear answered: NOT checked)'); unheard.append(f'{sid}[{i}]'); continue
    want = tokens(zh)
    miss = {pr: [(t, [w for w in want if w not in norm(t)]) for t in ts if t] for pr, ts in heard.items()}
    bad = {pr: sum(1 for _, m in ms if m) for pr, ms in miss.items()}
    n = {pr: len(ms) for pr, ms in miss.items()}
    wrong = {pr: (bad[pr] >= 2 if pr == 'gemini' else bad[pr] >= 1) for pr in miss if n[pr]}
    if not any(bad.values()): tag = 'ok'
    elif wrong and all(wrong.values()): tag = 'voice?'
    elif any(wrong.values()): tag = 'listen'
    else: tag = 'transcriber'
    counts = ' · '.join(f'{pr} {bad[pr]}/{n[pr]}' for pr in miss)
    print(f'{tag:<12} {sid}[{i}] {zh}' + (f'   ({counts})' if tag != 'ok' else ''))
    if tag != 'ok':
        for pr, ms in miss.items():
            for t, m in ms:
                if m: print(f'               {pr:<7} heard: {t}   missing: {m}')
    if tag == 'voice?': voice.append(f'{sid}[{i}]')
    elif tag == 'listen': listen.append(f'{sid}[{i}]')
    elif tag == 'transcriber': transcriber += 1
print(f'\n{len(res)} lines: {len(voice)} voice? {voice or ""}; {len(listen)} listen {listen or ""}; {transcriber} transcriber'
      + (f'; {len(unheard)} NOT checked {unheard}' if unheard else ''))
