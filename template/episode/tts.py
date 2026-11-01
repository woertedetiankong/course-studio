"""Narrate script.json with Gemini TTS (or MiniMax TTS) and write narration.wav + timeline.json.

Each line in script.json is [english, chinese, optional spoken form]. The spoken form fixes
pronunciation ("M I T", "Map Reduce") without changing the subtitle. Per-line wavs are cached in
audio/ by a hash of model+voice+style+text, so re-running only pays for lines you changed.
timeline.json gives every scene its start/duration and every beat (line) its start, which
scenes.js uses to time animations and sync_content.py turns into video chapters.

Config, first match wins: environment → nearest .env above this folder → ~/.config/course-studio/.env.
Keys: GEMINI_API_KEY (required), GEMINI_TTS_MODEL, GEMINI_VOICE, GEMINI_TTS_STYLE (default: a senior engineer talking to a peer),
GEMINI_CHECK_MODEL (transcribes every new clip to catch the TTS reading the style notes aloud; 'off' to skip).
TTS_PROVIDER=minimax switches the voice to MiniMax (speech-2.8-turbo on the China site by default): MINIMAX_API_KEY (required),
MINIMAX_BASE_URL (https://api.minimax.cn/v1; the international site is https://api.minimax.io/v1), MINIMAX_TTS_MODEL,
MINIMAX_VOICE (English_expressive_narrator), MINIMAX_SPEED (1). Billed per character, no daily request cap; the clip check
still transcribes with Gemini unless GEMINI_CHECK_MODEL=off. Clips are cached per provider+model+voice, so switching
providers voices every line again, and a course keeps one voice across its episodes.
No key yet, or just previewing the look? Use silent_timeline.py instead — same outputs, silent audio.
"""
import json, subprocess, wave, hashlib, os, re, base64, time, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor
S = json.load(open('script.json', encoding='utf-8'))
RATE = 48000
LEAD, GAP, TAIL = 0.9, 0.6, 1.6
PAUSE = 2.0  # extra hold after a line marked 'pause' (4th element): time to guess before the answer
GLOBAL_ENV = os.path.expanduser('~/.config/course-studio/.env')  # one key for every course on this machine
def find_env():  # the course root's .env (gitignored), searched upward from this folder
    d = os.path.abspath('.')
    while d != os.path.dirname(d):
        if os.path.exists(os.path.join(d, '.env')): return os.path.join(d, '.env')
        d = os.path.dirname(d)
read_env = lambda p: dict(l.strip().split('=', 1) for l in open(p) if '=' in l and not l.startswith('#')) if p and os.path.exists(p) else {}
ENV = {**read_env(GLOBAL_ENV), **read_env(find_env())}  # a course .env overrides the global one
cfg = lambda k, default=None: os.environ.get(k) or ENV.get(k) or default
# GEMINI_API_KEY may list several keys separated by commas; quota is per Google Cloud project, so keys from
# different projects add up. When one key's daily quota is used up, the next key takes over.
KEYS = [k.strip() for k in (cfg('GEMINI_API_KEY') or cfg('GOOGLE_API_KEY') or '').split(',') if k.strip()]
KEY = KEYS[0] if KEYS else None
PROVIDER = (cfg('TTS_PROVIDER') or 'gemini').lower()
if PROVIDER not in ('gemini', 'minimax'): raise SystemExit(f'TTS_PROVIDER must be gemini or minimax, not {PROVIDER}')
CHECK_MODEL = cfg('GEMINI_CHECK_MODEL', 'gemini-3.8-flash')
if not KEY and (PROVIDER == 'gemini' or CHECK_MODEL != 'off'):
    raise SystemExit(f'GEMINI_API_KEY not found: put it in {GLOBAL_ENV}, the course root .env, or the environment')
MM_KEY = cfg('MINIMAX_API_KEY'); MM_BASE = (cfg('MINIMAX_BASE_URL') or 'https://api.minimax.cn/v1').rstrip('/')
MM_MODEL = cfg('MINIMAX_TTS_MODEL', 'speech-2.8-turbo'); MM_VOICE = cfg('MINIMAX_VOICE', 'English_expressive_narrator'); MM_SPEED = float(cfg('MINIMAX_SPEED', '1'))
if PROVIDER == 'minimax' and not MM_KEY: raise SystemExit(f'MINIMAX_API_KEY not found: put it in {GLOBAL_ENV}, the course root .env, or the environment')
if PROVIDER == 'minimax': MODEL, VOICE = MM_MODEL, MM_VOICE
else:
    MODEL = cfg('GEMINI_TTS_MODEL', 'gemini-3.8-flash-tts')
    VOICE = cfg('GEMINI_VOICE', 'Sulafat')  # warm; alternatives: Achird (friendly), Kore (firm), Charon (informative)
STYLE = cfg('GEMINI_TTS_STYLE') or ('a clear, confident senior engineer explaining to a fellow engineer; natural, '
                                     'brisk but unhurried pace, precise, light emphasis on names and numbers')
os.makedirs('audio', exist_ok=True)

# Style goes in a director's-notes header; a plain 'Say it like…:' prefix gets read aloud by this model,
# and systemInstruction is rejected ("Developer instruction is not enabled").
KEY_LOCK = __import__('threading').Lock(); KEYS_BY = {}
def call(model, body):
    url = f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent'
    ks = KEYS_BY.setdefault(model, list(KEYS))  # quota is per model too: the check model keeps its own list
    for attempt in range(6 + 2 * len(KEYS)):
        try:
            if not ks: raise SystemExit(f'Gemini {model}: no key left')
            key_used = ks[0]
            req = urllib.request.Request(url, body, {'x-goog-api-key': key_used, 'Content-Type': 'application/json'})
            return json.load(urllib.request.urlopen(req, timeout=120))
        except urllib.error.HTTPError as e:
            msg = e.read().decode()
            if e.code == 429 and 'PerDay' in msg:  # this key's project is out for today: move to the next key
                with KEY_LOCK:
                    if ks and ks[0] == key_used: ks.pop(0); print(f'  {model}: daily quota used up on a key; {len(ks)} key(s) left')
                if not ks: raise SystemExit(f'Gemini {model}: daily quota used up on every key')
                continue
            if e.code in (429, 500, 502, 503, 504) and attempt < 5: time.sleep(2 ** attempt * 3); continue
            raise SystemExit(f'Gemini {model} {e.code}: {msg[:400]}')
        except (urllib.error.URLError, OSError):  # dropped connection / SSL EOF
            if attempt < 5: time.sleep(2 ** attempt * 3); continue
            raise

def request(body):
    d = call(MODEL, body)
    part = d['candidates'][0]['content']['parts'][0]['inlineData']
    raw = base64.b64decode(part['data'])
    if part['mimeType'].startswith('audio/wav'): return raw
    rate = int(part['mimeType'].split('rate=')[1].split(';')[0]) if 'rate=' in part['mimeType'] else 24000
    import io; buf = io.BytesIO()  # audio/L16;codec=pcm;rate=24000 → wrap in a wav header
    with wave.open(buf, 'wb') as f: f.setnchannels(1); f.setsampwidth(2); f.setframerate(rate); f.writeframes(raw)
    return buf.getvalue()

def minimax_request(text):
    # Synchronous t2a_v2: the wav comes back hex-encoded inside JSON; errors can arrive as HTTP 200 with base_resp.status_code != 0
    # (1002 rate limit, 1004 bad key, 1008 no balance, 2013 bad parameter), so both paths are checked.
    body = json.dumps({'model': MM_MODEL, 'text': text, 'stream': False, 'language_boost': 'English', 'output_format': 'hex',
        'voice_setting': {'voice_id': MM_VOICE, 'speed': MM_SPEED, 'vol': 1, 'pitch': 0},
        'audio_setting': {'sample_rate': 32000, 'format': 'wav', 'channel': 1}}).encode()
    for attempt in range(6):
        try:
            req = urllib.request.Request(MM_BASE + '/t2a_v2', body, {'Authorization': f'Bearer {MM_KEY}', 'Content-Type': 'application/json'})
            d = json.load(urllib.request.urlopen(req, timeout=120))
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503, 504) and attempt < 5: time.sleep(2 ** attempt * 3); continue
            raise SystemExit(f'MiniMax {MM_MODEL} HTTP {e.code}: {e.read().decode()[:400]}')
        except (urllib.error.URLError, OSError):
            if attempt < 5: time.sleep(2 ** attempt * 3); continue
            raise
        code = d.get('base_resp', {}).get('status_code', -1)
        if code == 0 and d.get('data', {}).get('audio'): return bytes.fromhex(d['data']['audio'])
        if code == 1002 and attempt < 5: time.sleep(2 ** attempt * 3); continue  # rate limit: wait and retry
        raise SystemExit(f'MiniMax {MM_MODEL} {code}: {str(d.get("base_resp", {}).get("status_msg", ""))[:400]}')

ONES = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split()
TENS = 'x x twenty thirty forty fifty sixty seventy eighty ninety'.split()
def spell(n):  # 39321 → 'thirty nine thousand three hundred twenty one': the transcriber writes digits, the spoken form spells them
    if n < 20: return ONES[n]
    if n < 100: return TENS[n // 10] + (' ' + ONES[n % 10] if n % 10 else '')
    if n < 1000: return ONES[n // 100] + ' hundred' + (' ' + spell(n % 100) if n % 100 else '')
    for value, name in ((10 ** 9, 'billion'), (10 ** 6, 'million'), (1000, 'thousand')):
        if n >= value: return spell(n // value) + ' ' + name + (' ' + spell(n % value) if n % value else '')
spell_digits = lambda x: re.sub(r'\d[\d,]*(\.\d+)?', lambda m: (spell(int(m.group(0).split('.')[0].replace(',', '') or 0)) if m.group(0).split('.')[0].strip(',') else '')
    + (' point ' + ' '.join(ONES[int(c)] for c in m.group(0).split('.')[1]) if '.' in m.group(0) else ''), x)
words = lambda x: [w for w in re.sub(r"[^a-z ]", ' ', spell_digits(x).lower()).split() if len(w) >= 4]
def heard_right(path, text):
    # The TTS model sometimes reads the director's notes aloud ("...to a fellow engineer, natural, brisk but unhurried pace...")
    # while staying under the length limit, so listen back: transcribe the clip and compare the words.
    if CHECK_MODEL == 'off': return True
    body = json.dumps({'contents': [{'parts': [
        {'inlineData': {'mimeType': 'audio/wav', 'data': base64.b64encode(open(path, 'rb').read()).decode()}},
        {'text': 'Transcribe this English speech exactly, word for word. Output only the transcript.'}]}]}).encode()
    try: got = call(CHECK_MODEL, body)['candidates'][0]['content']['parts'][0]['text']
    except (KeyError, IndexError): got = ''  # no transcript (blocked/empty): count as a mismatch
    if not got.strip(): print(f'  (no transcript for "{text[:50]}", will re-check next run)'); return None
    want, heard = words(text), words(got)
    # lenient on purpose: digits vs spelled numbers and "CANopen" vs "CAN open" differ in harmless ways;
    # what we catch is leaked notes, a clip that rambles on, or one that stops halfway
    leaked = PROVIDER == 'gemini' and any(w in heard and w not in want for w in words(STYLE))  # MiniMax gets no notes
    ok = not leaked and len(heard) <= len(want) * 1.4 + 3 and len(heard) >= len(want) * 0.5
    if not ok: print(f'  mismatch for "{text[:50]}": heard "{got.strip()[:90]}"')
    return ok

def speak(text, path):
    ok = path + '.ok'  # marker: this clip was transcribed and matched; cached clips without it get checked once
    if os.path.exists(path) and os.path.exists(ok): return  # cached: re-running doesn't spend quota
    if os.path.exists(path):
        r = heard_right(path, text)
        if r: open(ok, 'w').close()
        if r is not False: return
    styled = f"### DIRECTOR'S NOTES\nStyle: {STYLE}.\n\n### TRANSCRIPT\n{text}"
    body_for = lambda prompt: json.dumps({'contents': [{'parts': [{'text': prompt}]}],
        'generationConfig': {'responseModalities': ['AUDIO'],
            'speechConfig': {'voiceConfig': {'prebuiltVoiceConfig': {'voiceName': VOICE}}}}}).encode()
    limit = 3 + len(text.split()) * 0.75  # ~80 wpm floor; longer means the model rambled or read the notes
    for attempt in range(4):
        # some lines keep pulling the notes into the speech; the last two tries send the bare line (same voice)
        # fetch before opening: open() truncates, and a quota exit would leave a 0-byte "cached" file
        data = minimax_request(text) if PROVIDER == 'minimax' else request(body_for(styled if attempt < 2 else text))
        open(path, 'wb').write(data)
        with wave.open(path) as f: d = f.getnframes() / f.getframerate()
        if d > limit: print(f'  retry: {d:.1f}s > {limit:.1f}s for "{text[:50]}"'); continue
        r = heard_right(path, text)
        if r: open(ok, 'w').close()
        if r is not False: return
    print(f'  WARNING: "{text[:60]}" still too long or misread — listen to {path}, or reword the line')

said = lambda l: l[2] if len(l) > 2 and l[2] else l[0]
paused = lambda l: len(l) > 3 and l[3] == 'pause'
jobs = []
for si, sc in enumerate(S):
    for li, line in enumerate(sc['lines']):
        h = hashlib.sha1(f'{MODEL}|{VOICE}|{STYLE if PROVIDER == "gemini" else ""}|{said(line)}'.encode()).hexdigest()[:8]
        jobs.append((si, li, said(line), f'audio/{h}.src.wav'))  # keyed by text only: moving a line keeps its clip
todo = [j for j in jobs if not os.path.exists(j[3] + '.ok')]  # new, or cached but never checked
print(f'{len(jobs)} lines, {len(todo)} to synthesize ({PROVIDER} {MODEL}, voice {VOICE})')
with ThreadPoolExecutor(4) as ex:
    for n, _ in enumerate(ex.map(lambda j: speak(j[2], j[3]), todo), 1):
        if n % 10 == 0: print(f'  {n}/{len(todo)}')
src = {(si, li): p for si, li, _, p in jobs}

out = []; t = 0.0; pcm = bytearray()
sil = lambda sec: b'\x00\x00' * int(round(sec * RATE))
for si, sc in enumerate(S):
    start = t; pcm += sil(LEAD); t += LEAD; beats = []
    for li, line in enumerate(sc['lines']):
        w = f'audio/{si}_{li}.wav'
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', src[(si, li)], '-af',
            'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse',
            '-ar', str(RATE), '-ac', '1', '-sample_fmt', 's16', w], check=True)
        with wave.open(w) as f: data = f.readframes(f.getnframes()); d = f.getnframes() / RATE
        hold = PAUSE if paused(line) else 0.0
        beats.append({'text': line[0], 'zh': line[1], 'start': round(t - start, 3), 'dur': round(d + hold, 3)})
        pcm += data + sil(hold); t += d + hold
        g = GAP if li < len(sc['lines']) - 1 else TAIL
        pcm += sil(g); t += g
    out.append({'id': sc['id'], 'title': sc['title'], 'zh': sc['zh'], 'start': round(start, 3), 'dur': round(t - start, 3), 'beats': beats})
with wave.open('narration.wav', 'wb') as f:
    f.setnchannels(1); f.setsampwidth(2); f.setframerate(RATE); f.writeframes(bytes(pcm))
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', 'narration.wav', '-b:a', '128k', 'narration.mp3'], check=True)
json.dump({'total': round(t, 3), 'scenes': out}, open('timeline.json', 'w'), ensure_ascii=False, indent=1)
print(f'total {t:.1f}s ({t / 60:.1f} min)')
for s in out: print(s['id'], s['dur'], [b['dur'] for b in s['beats']])
