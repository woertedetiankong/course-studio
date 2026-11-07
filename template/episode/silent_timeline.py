"""No-narration stand-in for tts.py: times each subtitle by reading speed, writes timeline.json + silent narration.wav/mp3.

Use it to preview the look before spending TTS quota (or when the user wants a subtitles-only video).
Scenes written against this timeline still work after tts.py: beats move, but scenes.js times off b[i].
English narration (default): each line lasts long enough to read both subtitle rows.
Chinese narration (episode.json "narration": "zh", or NARRATION=zh): each line lasts as long as the Chinese voice would
take to say it, measured on MiniMax's Chinese (Mandarin)_Gentleman at speed 1 (≈ 6 speaking units/s, the same
character weights as cue() in the paper engine), so voicing it later moves the timings only a little.
The 4th element of a line holds the picture: "pause" = 2 s to guess, or a number of seconds.
"""
import json, os, re, wave, subprocess
S = json.load(open('script.json', encoding='utf-8'))
RATE = 48000
LEAD, GAP, TAIL = 0.9, 0.6, 1.6   # unhurried: subtitles stay long enough to read and think
PAUSE = 2.0
ZH_RATE = 5.976                   # Chinese speaking units per second (see units())
EP = json.load(open('episode.json', encoding='utf-8')) if os.path.exists('episode.json') else {}
def course_env(key):              # NARRATION in the nearest .env above this folder (same lookup as tts.py)
    d = os.path.abspath('.')
    while d != os.path.dirname(d):
        p = os.path.join(d, '.env')
        if os.path.exists(p):
            for l in open(p):
                if l.startswith(key + '='): return l.strip().split('=', 1)[1]
            return None
        d = os.path.dirname(d)
ZH = (os.environ.get('NARRATION') or EP.get('narration') or course_env('NARRATION') or 'en').lower() == 'zh'

def units(s):  # same weights as cue(): CJK ≈ a syllable, Latin letters fast, digits read out, punctuation = pause
    w = 0
    for ch in s:
        if '一' <= ch <= '鿿': w += 1
        elif ch.isdigit(): w += 1.3
        elif ch.isascii() and ch.isalpha(): w += .4
        elif ch in '，。：；、？！': w += 1.6
        elif ch == ' ': w += .15
        else: w += .5
    return w
def held(l):
    v = l[3] if len(l) > 3 else None
    return PAUSE if v == 'pause' else float(v) if isinstance(v, (int, float)) and not isinstance(v, bool) else 0.0
def speech(l):
    if ZH: return round(units(l[2] if len(l) > 2 and l[2] else l[1]) / ZH_RATE, 3)
    words = len(l[0].split()); han = len(re.findall(r'[一-鿿]', l[1]))   # long enough to read both rows
    return round(max(3.2, words / 2.3, han / 4.2) + 0.6, 3)

out = []; t = 0.0
for sc in S:
    start = t; t += LEAD; beats = []
    for i, l in enumerate(sc['lines']):
        sp = speech(l); d = round(sp + held(l), 3)
        beats.append({'text': l[0], 'zh': l[1], 'start': round(t - start, 3), 'dur': d, 'speech': sp})
        t += d + (GAP if i < len(sc['lines']) - 1 else TAIL)
    out.append({'id': sc['id'], 'title': sc['title'], 'zh': sc['zh'], 'start': round(start, 3), 'dur': round(t - start, 3), 'beats': beats})
json.dump({'total': round(t, 3), 'scenes': out}, open('timeline.json', 'w'), ensure_ascii=False, indent=1)
with wave.open('narration.wav', 'wb') as f:
    f.setnchannels(1); f.setsampwidth(2); f.setframerate(RATE); f.writeframes(b'\x00\x00' * int(t * RATE))
print('total', round(t, 2), '(Chinese narration timing)' if ZH else '')
for s in out: print(s['id'], s['dur'], [b['start'] for b in s['beats']])
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', 'narration.wav', '-b:a', '64k', 'narration.mp3'], check=True)
