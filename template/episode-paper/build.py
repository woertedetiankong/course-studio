# Stitch the player (paper style): head.html (engine + primitives) + any *_data.js (numbers generated from real data)
# + <course-root>/shared/*.part.js (the series' shared picture and its drawCorner, used by every episode)
# + this episode's *.part.js + scenes.js + tail.html (chrome, render loop, player), with timeline.json inlined.
# Every CJK character on the page goes into EXTRA_ZH so the font subsets load it. Open index.html to preview; record.mjs renders it.
import glob, json, os, re
tl = open('timeline.json', encoding='utf-8').read()
shared = sorted(glob.glob(os.path.join('..', '..', 'shared', '*.part.js')))
parts = ['head.html'] + sorted(glob.glob('*_data.js')) + shared + sorted(glob.glob('*.part.js')) + ['scenes.js', 'tail.html']
s = ''.join(open(f, encoding='utf-8').read() for f in parts)
zh = ''.join(sorted(set(re.findall(r'[ -⁯　-鿿＀-￯]', s + tl))))
s = s.replace("'__AUTO__'", json.dumps(zh, ensure_ascii=False))
open('index.html', 'w', encoding='utf-8').write(s.replace('/*TIMELINE*/null', tl))
print(f'index.html {len(s)} chars; {len(zh)} CJK glyphs; shared parts: {", ".join(os.path.basename(p) for p in shared) or "none"}')
