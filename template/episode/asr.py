"""Listen-back "ears" shared by tts.py and recheck.py: transcribe a voiced clip with Gemini (an audio LLM, sampled) and/or
MiniMax ASR (asr-1.0, deterministic), so a clip that mumbles, stops halfway or misreads a number gets caught.

CHECK_PROVIDER (environment → course .env → ~/.config/course-studio/.env):
  auto     (default) Gemini when it has a key and credit, else MiniMax ASR. If Gemini runs out of credit or daily quota
           in the middle of a run (HTTP 402, or 429 PerDay on every key), the rest of the run switches to MiniMax.
  both     every clip is heard by both. Both right → pass; both wrong → re-voice; they disagree → the clip passes, but it is
           listed in check_disagree.txt with both transcripts, for a human ear.
  gemini | minimax   one provider only.          off   no listen-back (GEMINI_CHECK_MODEL=off means the same).
Keys: GEMINI_API_KEY (+ GEMINI_CHECK_MODEL), MINIMAX_API_KEY (+ MINIMAX_BASE_URL, MINIMAX_ASR_MODEL).

Measured on π0.7 (2026-11-09): MiniMax ASR read 派零点七 right where Gemini wrote π0 (a false alarm), but heard
「比如叠 T 恤」 right where Gemini heard 阶梯序 3/3. MiniMax voice + MiniMax ears are one vendor and may forgive their own
voice, so a MiniMax-voiced course should prefer `both` when Gemini has credit. MiniMax gives the same text every time:
recheck.py asks it once, and asks Gemini N times.
"""
import base64, json, threading, time, urllib.request, urllib.error, uuid

MODES = ('auto', 'both', 'gemini', 'minimax', 'off')
PROMPT = {'zh': '把这段中文语音逐字转写出来，数字用阿拉伯数字，英文保持英文。只输出转写文本。',
          'en': 'Transcribe this English speech exactly, word for word. Output only the transcript.'}
ECHO = ('逐字转写', '阿拉伯数字', 'word for word')          # the transcriber echoed the instruction instead of transcribing


class Ears:
    def __init__(self, cfg, lang='zh'):
        self.lang = lang
        self.gkeys = [k.strip() for k in (cfg('GEMINI_API_KEY') or cfg('GOOGLE_API_KEY') or '').split(',') if k.strip()]
        self.gmodel = cfg('GEMINI_CHECK_MODEL', 'gemini-3.8-flash')
        self.mkey = cfg('MINIMAX_API_KEY')
        self.mbase = (cfg('MINIMAX_BASE_URL') or 'https://api.minimax.cn/v1').rstrip('/')
        self.mmodel = cfg('MINIMAX_ASR_MODEL', 'asr-1.0')
        mode = (cfg('CHECK_PROVIDER') or ('off' if self.gmodel == 'off' else 'auto')).lower()
        if mode not in MODES: raise SystemExit(f'CHECK_PROVIDER must be one of {", ".join(MODES)}, not {mode}')
        self.mode, self.lock, self.gdead = mode, threading.Lock(), None
        self.have = {'gemini': bool(self.gkeys) and self.gmodel != 'off', 'minimax': bool(self.mkey)}
        if mode in ('gemini', 'minimax') and not self.have[mode]:
            raise SystemExit(f'CHECK_PROVIDER={mode} but its key is missing ({"GEMINI_API_KEY" if mode == "gemini" else "MINIMAX_API_KEY"})')
        if mode in ('auto', 'both') and not any(self.have.values()):
            raise SystemExit('no key for any listen-back check (GEMINI_API_KEY or MINIMAX_API_KEY); set CHECK_PROVIDER=off to skip it')

    def active(self):
        g, m = self.have['gemini'] and not self.gdead, self.have['minimax']
        if self.mode == 'off': return []
        if self.mode == 'gemini': return ['gemini'] if g else []
        if self.mode == 'minimax': return ['minimax']
        if self.mode == 'both': return [p for p, ok in (('gemini', g), ('minimax', m)) if ok]
        return ['gemini'] if g else (['minimax'] if m else [])

    def describe(self):
        a = self.active()
        return f'check {self.mode}: ' + (' + '.join(f'gemini {self.gmodel}' if p == 'gemini' else f'minimax {self.mmodel}' for p in a) or 'none')

    def _gemini_down(self, why):
        with self.lock:
            if not self.gdead:
                self.gdead = why
                nxt = self.active()
                print(f'  Gemini check unavailable ({why}); ' + (f'continuing with {" + ".join(nxt)}' if nxt else 'no other checker: clips stay unchecked'))

    def gemini(self, path):
        if self.gdead: return None
        body = json.dumps({'contents': [{'parts': [{'inlineData': {'mimeType': 'audio/wav', 'data': base64.b64encode(open(path, 'rb').read()).decode()}},
                                                   {'text': PROMPT[self.lang]}]}]}).encode()
        url = f'https://generativelanguage.googleapis.com/v1beta/models/{self.gmodel}:generateContent'
        keys = list(self.gkeys)
        for attempt in range(6 + 2 * len(keys)):
            if not keys: self._gemini_down('no key left'); return None
            try:
                r = json.load(urllib.request.urlopen(urllib.request.Request(url, body, {'x-goog-api-key': keys[0], 'Content-Type': 'application/json'}), timeout=120))
                got = r['candidates'][0]['content']['parts'][0]['text'].strip()
                if any(e in got for e in ECHO): continue
                return got
            except urllib.error.HTTPError as e:
                msg = e.read().decode()
                if e.code == 402 or (e.code == 429 and 'PerDay' in msg):
                    keys.pop(0)
                    if not keys: self._gemini_down('HTTP 402: prepaid credits used up' if e.code == 402 else 'daily quota used up'); return None
                    continue
                if e.code in (429, 500, 502, 503, 504) and attempt < 5: time.sleep(2 ** attempt * 3); continue
                print(f'  Gemini check HTTP {e.code}: {msg[:160]}'); return None
            except (urllib.error.URLError, OSError, KeyError, IndexError):
                if attempt < 5: time.sleep(2 ** attempt * 2); continue
                return None
        return None

    def minimax(self, path):
        bd = uuid.uuid4().hex; body = b''
        for k, v in (('model', self.mmodel), ('response_format', 'json')):
            body += f'--{bd}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode()
        body += (f'--{bd}\r\nContent-Disposition: form-data; name="file"; filename="clip.wav"\r\nContent-Type: audio/wav\r\n\r\n'.encode()
                 + open(path, 'rb').read() + f'\r\n--{bd}--\r\n'.encode())
        for attempt in range(9):
            try:
                req = urllib.request.Request(self.mbase + '/speech_to_text', body, {'Authorization': f'Bearer {self.mkey}', 'Content-Type': f'multipart/form-data; boundary={bd}'})
                d = json.load(urllib.request.urlopen(req, timeout=120))
                if d.get('text') is not None: return d['text'].strip()
                code = d.get('base_resp', {}).get('status_code')
                if code == 1002 and attempt < 8: time.sleep(min(60, 2 ** attempt * 3)); continue
                print(f'  MiniMax ASR: {str(d)[:160]}'); return None
            except urllib.error.HTTPError as e:
                if e.code in (429, 500, 502, 503, 504) and attempt < 5: time.sleep(2 ** attempt * 3); continue
                print(f'  MiniMax ASR HTTP {e.code}: {e.read().decode()[:160]}'); return None
            except (urllib.error.URLError, OSError):
                if attempt < 5: time.sleep(2 ** attempt * 2); continue
                return None
        return None

    def hear(self, path, provider): return self.gemini(path) if provider == 'gemini' else self.minimax(path)
