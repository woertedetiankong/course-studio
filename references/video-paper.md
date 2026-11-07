# Paper style (纸面图解): explainer videos of essays, research posts and handbooks

The second video look. Same pipeline as `video.md` (script.json → tts.py / silent_timeline.py → timeline.json → scenes.js → build.py → frames.mjs → record.mjs → slides.mjs) and the same rules for timing scenes off `b[i]`; what changes is the look, the engine's primitives, the scene arc and who the video is for. Episode folders come from `new_episode.py --style paper` (Chinese narration by default; `--narration en` for English).

## When to pick it

| | 3Blue1Brown (`video.md`) | Paper (this file) |
|---|---|---|
| Source | a codebase or system: one mechanism, one running example traced through the code | an essay, research post, report, paper or handbook: an argument, the experiments behind it, their charts |
| Spine | problem → mechanism → source → evidence | claim → the test → guess → the numbers → what it means |
| Code | 40–50 % of the video | rare; a config flag or a short excerpt on a `codeCard` at most |
| Audience | engineers mastering this codebase | whoever the original was written for; every term explained in plain words the first time |
| Look | dark canvas, glowing meaning-coded colours, formulas built term by term | warm paper, ink, cards, highlighter, stamps, sticky notes, redrawn charts |

A course keeps one style for all its episodes unless its plan says otherwise; record the choice in the plan / `CLAUDE.md`. A post explained as a series is a **video-first course** (SKILL.md): each episode ships as video + 课件, and the course home is optional.

## What every paper-style episode is

- **One complete story per episode**, 4–7 minutes: one claim and the experiments that support it. A long post becomes a series; split it where its own sections split, so each episode can be watched alone. Reference: a 5,000-word post became 5 episodes, about 25 minutes.
- **One shared picture for the series**: the post's structure drawn once (agent-memory: a four-floor "memory building" with violet "dreaming" arcs). It appears full size when each episode opens, then as a corner copy top-right with this episode's part lit, so the viewer always knows where they are. It lives in `<course-root>/shared/<name>.part.js` with its `drawCorner(cfg, alpha)`; `CORNER = {sceneId: {...}}` in scenes.js says which scenes show it and what is lit.
- **Narration**: Chinese by default (MiniMax `speech-2.8-turbo`, voice `Chinese (Mandarin)_Gentleman`), English subtitles beneath the Chinese ones; or English narration (`--narration en`, same voices as the 3b1b style). Keep one voice across a series.
- **Five meaning colours** (`C.slate`, `C.coral`, `C.teal`, `C.amber`, `C.violet`), each tied to one idea of the series (a layer, an actor, a kind of data) and never used for anything else. Alias them in the series part file (`Object.assign(C, {notes: C.coral})`). `C.hi` is the highlighter, `C.stamp` the red of stamps and ✗.

## Honesty rules (they are what make the format trustworthy)

- **Redraw, never screenshot.** Charts are rebuilt from the post's numbers; diagrams are redrawn in this look. No screenshots of the post's figures, no game art, product UI, characters or logos: use abstract stand-ins (tiles and a dot for a game screen, plain circles for balls) and say so on screen (示意画面，不是游戏原画).
- **An interpretation, not the publisher's video.** Title it as a 解读, link the original, never brand it as the publisher's own.
- **Every number traceable.** The 5th element of each script line names its source (§section, 图 N). Fact-check every line against the original text before animating.
- **Don't invent detail.** Where the post describes a structure but not its content, grey bars stand for the text, with a note (灰条代表文字内容：原文只描述了结构). Where it gives a total or a range, draw a band or range and say so (原文只给了总数, 原文没给确切次数, 示意：原文没给比例) instead of inventing per-item numbers.
- **Quotes in the original language.** A quote card types the original out (mono) with the translation beneath (译文); the narration gives the translation.
- **Comparisons across figures**: put both numbers side by side with their figures named (参考：图 3 里记忆带来 +0.264) rather than computing a new number the post never states.

## Scene arc and pacing

- Episode: **open** (episode title, a note card with last episode's takeaway, the shared picture full size with this episode's part lit; `NOHEADER = ['open']`) → **setup** (the test or the case) → story scenes → a **guess card** (`guessCard`, line marked `"pause"`: the card is fully gone before the answer appears) → the **reveal** on a redrawn chart → what it means → **recap** (three numbered cards, then a card for the next episode).
- Scene: one claim. Each element lands on the word that names it: `cue(i, '词')` (character-position estimate, close enough after voicing), `lineEnd(i)` for things that follow a line.
- At most two phases per scene; between them, **fade out, then in** (`A = 1 - eo(ramp(lt, t - .45, t - .05))`, `B = eo(ramp(lt, t - .05, t + .4))`), never a crossfade where two layouts overlap.
- A line whose picture needs time (a quote typing out, a chart growing) gets a hold: 4th element in seconds (5.5 for a two-line quote with its translation).

## script.json

`[english, chinese, spoken?, hold?, source?]` per line; each scene `{id, title, zh, visual, lines}`. `visual` says what the picture does, for review before animating. Chinese lines up to ~42 characters keep the subtitle on one or two rows. `spoken` changes what the voice says without changing the subtitle; when a fix makes the sentence read better anyway, change the subtitle too so the two match (see "Checking Chinese narration").

## Engine (`template/episode-paper/head.html`)

Canvas 1920×1080; header above y 150, subtitles below y 860; corner copy inside x 1560–1800, y 60–140.

- palette `C.{paper, paper2, card, ink, ink2, mute, rule, hi, stamp, slate, coral, teal, amber, violet}`; fonts `F.{zhSerif, sans, serif, mono, monoZh}` (Noto Serif SC 900 for titles, Noto Sans SC, Newsreader italic for English, IBM Plex Mono for numbers)
- timing: `ramp, eo, eio, eback, lerp, knots, rnd, cue, lineEnd, win(lt, a, b)`
- text: `text, measure, wrapWords, wrapZh` (never starts a line with closing punctuation)
- paper: `card(x,y,w,h,{tilt,edge,lw,fill})`, `noteCard(x,y,w,h,{lines,bars,tilt,scale,color})`, `highlight` / `markText` (call before the text), `strike`, `stamp(s,x,y,k)`, `callout(ax,ay,lx,ly,lines,p)`, `chip(s,x,y,{k,color,size,align})` (returns its width), `pill`, `guessCard(x,y,w,lines,a)`, `check`, `cross`, `medal`
- diagrams: `curveArrow(a,c,b,p,color,{lw,head,both,dash})`, `arrowLine`, `qbz`, `arrowHead`, `glowDot`, `ring`, `reveal(p,x,y,w,h,fn)`
- icons (generic geometry, no brand marks): `agentIcon, folderIcon, fileIcon, dbIcon, sun, moon`; a log tape `tape(x,y,w,h,{rows,shown,mark,tag,scan,strike})`
- data: `bars(x,y,w,h,groups,series,{k,dim,max,ticks})` (grouped bars, values printed), `squarify(vals,x,y,w,h)` (treemaps: area ∝ value, two folders at one scale)
- code: `codeCard(x,y,w,title,lines,{hl,file,from,to,fn})`, which reports itself to the 课件's code index via `codeShown`

`tail.html` draws the chrome: `EPISODE = {n, zh}` label, chapter number and title, the hairline under the header that doubles as the progress bar, the corner copy (`CORNER` + `drawCorner`), and the subtitles (Chinese 40 px, English italic 26 px). Helpers already in head.html must not be redefined in scenes.js: a duplicate `const` breaks the whole page. Promote an episode helper to the template only when it is generic; a picture that belongs to one series stays in its `shared/` part file.

## Workflow

1. Read the whole post; propose the series split (episodes, minutes, the shared picture) and get it approved.
2. `new_episode.py --dest <root>/episodes/epNN-<slug> --n N --title … --style paper --video-only [--narration en]`; for a series, write `<root>/shared/<name>.part.js` once.
3. `script.json` with sources, fact-checked against the post; show it before animating.
4. `python3 silent_timeline.py` (Chinese timing is calibrated on the real voice, so voicing later moves things only slightly) → `scenes.js` → `python3 build.py` → `node frames.mjs`: read every sheet, and also render the moments between line ends (crossfades, a card leaving before its answer, a picture shrinking) with `render(t)` in `index.html?record`. Then `node record.mjs` and show the silent preview.
5. After approval: `python3 tts.py`, the checks below, `build.py` + `frames.mjs` again (a voiced line can be up to ~40 % shorter or longer than estimated), `record.mjs`, a sync spot check (cut one line's audio from the mp4, transcribe it, compare with the frame's subtitle), then `node slides.mjs`.

## Checking Chinese narration

`tts.py`'s automatic check (transcript similarity ≥ 0.75) catches mumbling and lines that stop halfway. It lets a single wrong digit or name through, and it flags unfamiliar English names that were read correctly (Fable came back as 微博, 飞波, 费博尔). So after every voicing:

1. Transcribe every line that has Latin letters or digits again, and read transcript and script side by side.
2. For **names and version numbers**, ask Gemini a forced-choice question about the clip, and first prove the question can tell: run it on a **control** clip that really says the other name (Letta vs a clip saying Meta; Fable vs clips saying Viber and 微博), or on the same line synthesized **without** the number (it must answer 无). Never put candidate answers in the question as examples: asked "e.g. 4, 4.7, 5" it answers from the list.
3. Transcribe a suspicious clip three times: one miss in three is the transcriber, three in three is the voice.
4. Fixes that worked: a comma after a version number before 的 / 是 / 不 (「Fable 5，它的办法是」, 「Opus 5，是…」, 「Sonnet 5，不用提示…」), spelling a clipped phrase out (「猜测原因」 for 「猜原因」), a comma after a sentence-initial 「三楼」, or simply synthesizing again (every take differs).
5. A take that passed while testing can go straight into the cache: `audio/<sha1("{MODEL}|{VOICE}||{spoken text}")[:8]>.src.wav` (MiniMax; with Gemini the style text sits between the two bars) plus an empty `.ok` beside it. A line that ended with a WARNING has no `.ok` and would be re-voiced on the next run; if checking shows it was right, add the `.ok` by hand.

## Reference instance

`~/Documents/Claude-blog/agent-memory/`: five episodes on Anthropic's "The components of agent memory" (2026-11-06). `PLAN.md` holds the series plan, decisions and voicing lessons; episodes 1–2 were built on that folder's own `kit/` (the prototype of this template), later ones from this template with `shared/` for the memory building.
