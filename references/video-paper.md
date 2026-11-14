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

- **One complete story per episode, no length cap**: one claim and the experiments that support it, told until the viewer has understood it and come away with something (user, 2026-11-09: 不要限制时长，主要是讲清楚，让用户有所收获). What limits an episode is density (one claim), never minutes; never cut a step of the explanation to make a time, and never pad. A long post becomes a series; split it where its own sections split, so each episode can be watched alone. For reference only (not a target): a 5,000-word essay became 5 episodes, about 24 minutes.
- **One shared picture for the series**: the post's structure drawn once (agent-memory: a four-floor "memory building" with violet "dreaming" arcs). It appears full size when each episode opens, then as a corner copy top-right with this episode's part lit, so the viewer always knows where they are. It lives in `<course-root>/shared/<name>.part.js` with its `drawCorner(cfg, alpha)`; `CORNER = {sceneId: {...}}` in scenes.js says which scenes show it and what is lit.
- **Narration**: Chinese by default (MiniMax `speech-2.8-turbo`, voice `Chinese (Mandarin)_Gentleman`), English subtitles beneath the Chinese ones; or English narration (`--narration en`, same voices as the 3b1b style). The spoken language leads: `build.py` reads `episode.json` into `NARRATION`, and with English narration the subtitles put English on top (38 px) and Chinese beneath (30 px, `C.ink2`, dark enough for Chinese viewers to read; 27 px grey was too faint), the chapter header puts the English title first, and `cue(i, 'word')` finds the word in the English line (first used for building-always-on-agents, 2026-11-13); `guessCard` then says "Your guess" and sets the question in the serif. English text on the canvas uses straight quotes and apostrophes: `F.sans` starts with Noto Sans SC, which draws ’ “ ” full-width. For the Chinese viewers of an English-narrated series, put a small Chinese name (15–20 px, `C.mute`) under or after each key term on the diagrams (box names, column heads, step cards), not on arrow notes or glosses the subtitles already carry (building-always-on-agents, 2026-11-14). Keep one voice across a series.
- **Five meaning colours** (`C.slate`, `C.coral`, `C.teal`, `C.amber`, `C.violet`), each tied to one idea of the series (a layer, an actor, a kind of data) and never used for anything else. Alias them in the series part file (`Object.assign(C, {notes: C.coral})`). `C.hi` is the highlighter, `C.stamp` the red of stamps and ✗.

## Logic and framework pictures, compact pages

Viewers of the paper style, relayed by the user on 2026-11-10 (the same day robot-course learners said the same of the 3b1b videos): more logic diagrams and framework diagrams, compact pages, and a hard principle explained with a concrete picture and its text together. `video.md` "Conclusion first, on one framework page" and "A picture where the logic is hard, a line where it is simple" apply here too; what differs for a paper:

- **The conclusion first.** Right after the open, the episode's claim in one or two plain sentences, with no term that has not been taught yet.
- **One framework page per episode**, built up part by part as it is narrated. For a mechanism (a model, a training recipe, a pipeline): what goes in, the steps in order, every branch or condition, what comes out, with the running example's real numbers on it. For an argument: the claim, what was tested, against what, the numbers, what follows from them, as one logic diagram. It is not the series' shared picture: the shared picture says where this episode sits in the post, the framework page says how this episode's claim works. The recap is told on it, each takeaway lighting its part; a mid-way "so far" too when the episode is long. No text cards on an empty page for a summary.
- **A hard principle gets a concrete picture with its text on it**: the toy or real numbers drawn where they act (the value on the arrow it travels along, the condition on the branch it decides, the formula's term beside the part of the picture it measures), on one page. Not a card of prose beside an icon, and not a picture on one page with its explanation on the next.
- **Compact pages.** What belongs together stays on one page and is built up line by line: a mechanism's steps, the cases being compared, a chart with the reading of it. Do not spread one idea thinly over several near-empty pages; one new thing per spoken line still holds. The whole page is the overview, not the reading size: when a page holds everything, enlarge the part being narrated (robot-course ep24a `camPath`: a clipped, scaled window on the page) and check frames at player size.
- **Simple things get a line, not a diagram.** An icon row or a decorative card on a point one sentence already makes lowers the quality.
- **The honesty rules cover these pictures.** A framework page is a redraw: every box, arrow and number on it is traceable to a section or figure, and a link the original does not state is not drawn (or is drawn dashed and labelled 示意).

## Hardcore depth (硬核图解): for technical papers and technical viewers

The defaults above suit an essay read by a general audience. When the source is a technical paper and the viewers want to *learn the field* (π0.7 series, 2026-11-09: learners who know deep learning but not robotics, plus robotics practitioners; the brief was "硬核加上通俗易懂"), keep the paper look and take the teaching rules from `video.md` "Hardcore and learnable". Record `depth: hardcore` and the audience in the plan.

- **No length cap** (as above): still one claim per episode; a second mechanism means another episode, not a shorter explanation.
- **Find the jumps before deciding the length.** Judge a draft by what a viewer would have to guess, not by its minutes. Read every line as an A-viewer (knows ML, new to the field) and a B-viewer (practitioner) and list: terms used but never taught; results that appear without the hand calculation that produces them; a formula whose symbols aren't tied to the model's real operation (a score formula for a flow-matching model needs the denoising step it changes); two charts normalized differently with no warning; a single striking number shown without the rest of its chart (say where the pattern holds and where it doesn't); missing cost or mechanics a practitioner would ask about (how many forward passes, what exactly is dropped). Fix each by adding the missing step; the length follows.
- **Toy before real before evidence**, the three beats of every mechanism: (1) a 玩具例子 small enough to check by eye, tagged on screen and asserted in `toy.py` (two demos around an obstacle whose average crashes; a 1-D flow matching denoise in 5 steps); (2) the paper's real settings and formula, built term by term on a card, each number with its § / 图 source; (3) the evidence: a redrawn chart after a guess card, or a quoted 原片 / 原图.
- **Prerequisites taught concept-first in scenes of their own**, tagged 预备知识 so practitioners know they may skim (action chunk, proprioception, teleoperation, embodiment, CFG). One new thing per line; every term glossed the first time it is said, spoken and on screen.
- **For the practitioners**: the design choice behind each mechanism (why only 25 % of examples carry subgoal images), the ablation that supports it, how it compares with prior work, and in the last episode what the paper does not show (evaluation in-house, what counts as "unseen", numbers given only as charts). Depth for them, never jargon for the others.
- **One running example per episode**, carried through every scene of it; the series' shared picture ties the episodes together.
- **Test the script before animating**: a bilingual `script_draft.md`, toy numbers included, read by the user first.
- **Skipping the draft review never skips the jumps pass.** When the user asks to go straight to voice, run "Find the jumps" on the script yourself before `tts.py` (π0.7, 2026-11-09: ep01 and ep02 went straight to voice without it and came out at 6 min against ep03's 10, with real gaps — how flow matching is trained, what data the model eats, how the prompt is laid out — that the user had to notice; both were reopened).

## Honesty rules (they are what make the format trustworthy)

- **Redraw by default; quote the original when it is the evidence.** Charts you will reveal after a guess are rebuilt from the post's numbers, and diagrams are redrawn in this look, so they can animate. When the original's own picture *is* the evidence (a real robot doing the task, a chart whose numbers the post never prints), quote it with `footage()` under the rules in "Quoting the original" below: labelled 原片 / 原图, credited on screen, short, talked over. Anything not quoted is redrawn, and an abstract stand-in says so on screen (示意画面). Never pass a redraw off as the original or the original off as your drawing.
- **An interpretation, not the publisher's video.** Title it as a 解读, link the original, never brand it as the publisher's own.
- **Every number traceable.** The 5th element of each script line names its source (§section, 图 N). Fact-check every line against the original text before animating.
- **Don't invent detail.** Where the post describes a structure but not its content, grey bars stand for the text, with a note (灰条代表文字内容：原文只描述了结构). Where it gives a total or a range, draw a band or range and say so (原文只给了总数, 原文没给确切次数, 示意：原文没给比例) instead of inventing per-item numbers.
- **Quotes in the original language.** A quote card types the original out (mono) with the translation beneath (译文); the narration gives the translation.
- **Comparisons across figures**: put both numbers side by side with their figures named (参考：图 3 里记忆带来 +0.264) rather than computing a new number the post never states.

## Quoting the original (原片 / 原图)

Added 2026-11-09 for the π0.7 series: a robotics paper's strongest evidence is its robot footage, and a redraw of a robot folding a shirt proves nothing. The model is the 适当引用 of 著作权法 §24 (介绍、评论、说明问题) and fair-use commentary: the quote serves the explanation, the source is named, and the episode never replaces the original.

**When to quote** — only when the picture itself carries the point: real behaviour (the robot really did it, at this speed, with this grasp), a result the post only gives as a chart, a figure the narration is about to dissect. Not as decoration, not for an opening montage, not in place of a diagram you could draw.

**Rules**
- **Credit on screen the whole time it is visible.** `footage()` prints `来源：<credit> · <url>` under the picture; turn it off only if the same credit is already on screen. The video description lists every quoted item with its source link.
- **Labelled.** The 原片 / 原图 tag stays on; add the playback speed as the original states it (`speed: "原片 2×"`), and never retime a clip without saying so on the tag.
- **Short and talked over.** One clip ≤ 15 s (media.py warns), and all quoted footage together well under a quarter of the episode. Narration explains *while* it plays (what to watch, where the grasp differs); a clip that plays in silence is a re-upload, not a quote. Muted: the original's audio never goes in.
- **Unaltered in meaning.** Crop and mark (`crop`, `marks`) to point at something; never cut a clip so a failure looks like a success, never edit pixels.
- **Still an interpretation.** The title stays a 解读, the original is linked, the publisher's logo is never used as branding.
- **A fallback for every quote.** Keep the redraw possible (note it in `media.json`'s `note`): if the rights holder objects or the platform flags it, swap the scene to the redrawn version and re-record.

**How**
1. Download the clip or render the figure into `raw/` yourself (a PDF page: render with PyMuPDF at 150 dpi; a blog video: the file the page serves). Add `raw/` and `.media_cache/` to `.gitignore`.
2. Describe each quote in `media.json` (fields in `media.py`'s docstring: `id, kind clip|image, src, from/to, fps, width, crop, credit, url, speed, note`); `python3 media.py` writes `media_data.js` (frames as JPEG data URIs: file:// images would taint the canvas and record.mjs could not read it), then `python3 build.py`.
3. In scenes.js: `footage(id, x, y, w, {t: lt - b[i], alpha, tilt, h, loop, rate, marks})`. `t` is seconds into the clip, so the clip starts on the line that introduces it; it holds its last frame unless `loop`. Script lines that quote name the clip in their source field (`原片 ur5e-fold 12–22 s`).
4. Size: 15 fps at 960 px is about 0.6 MB per second of clip in index.html; media.py warns above 60 MB.

## Scene arc and pacing

- Episode: **open** (episode title, a note card with last episode's takeaway, the shared picture full size with this episode's part lit; `NOHEADER = ['open']`) → **the conclusion and the framework page** ("Logic and framework pictures" above) → **setup** (the test or the case) → story scenes → a **guess card** (`guessCard`, line marked `"pause"`: the card is fully gone before the answer appears) → the **reveal** on a redrawn chart → what it means → **recap** (three takeaways told on the framework page, then a card for the next episode).
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
- quoted original: `footage(id,x,y,w,{t,rate,loop,alpha,tilt,h,marks,tag,credit})` draws a `media.json` entry as a pinned photo with its 原片 / 原图 tag and credit; returns the picture's `{x,y,w,h}` (see "Quoting the original")

`tail.html` draws the chrome: `EPISODE = {n, zh}` label, chapter number and title, the hairline under the header that doubles as the progress bar, the corner copy (`CORNER` + `drawCorner`), and the subtitles (Chinese 40 px, English italic 26 px). Helpers already in head.html must not be redefined in scenes.js: a duplicate `const` breaks the whole page. Promote an episode helper to the template only when it is generic; a picture that belongs to one series stays in its `shared/` part file.

## Workflow

1. Read the whole post; propose the series split (episodes, what each must make clear, the shared picture) and get it approved.
2. `new_episode.py --dest <root>/episodes/epNN-<slug> --n N --title … --style paper --video-only [--narration en]`; for a series, write `<root>/shared/<name>.part.js` once.
3. `script.json` with sources, fact-checked against the post; show it before animating. If the episode quotes footage or figures, fill `media.json` and run `python3 media.py` before `build.py`.
4. `python3 silent_timeline.py` (Chinese timing is calibrated on the real voice, so voicing later moves things only slightly) → `scenes.js` → `python3 build.py` → `node frames.mjs`: read every sheet, and also the moments between line ends (crossfades, a card leaving before its answer, a picture shrinking): `node moments.mjs` tiles 0.25 s before and 0.15 s after every line start per scene; `node moments.mjs scene:line:+0.1` renders one exact moment. Then `node record.mjs` and show the silent preview.
5. Every episode's 课件 closes with a paper map and practice: `practice.json` with `"kind": "paper"`, `sections` (each part of the paper the episode covers: `{sec: "§V-C · 图 18 左", what: [中文, English], scene}`) and 4–6 `questions` (`{q, a, why: [中文, English], src: ["§V-C"], scene?, new?, reasoned?}`: the video's guess cards plus 2–3 new ones (`new: true`; `scene` still links them to the moment they build on) that make the learner compute or apply something; `reasoned: true` labels an answer worked out rather than stated by the paper). `slides.mjs` renders both pages.
6. After approval: `python3 tts.py`, the checks below (`python3 recheck.py` does steps 1 and 3), `build.py` + `frames.mjs` again (a voiced line can be up to ~40 % shorter or longer than estimated), `record.mjs`, a sync spot check (cut one line's audio from the mp4, transcribe it, compare with the frame's subtitle), then `node slides.mjs`.

## Checking Chinese narration

**Two ears** (`asr.py`, 2026-11-09). The listen-back check and `recheck.py` can hear with Gemini (an audio LLM: sampled, so asked three times) and with MiniMax ASR `asr-1.0` (deterministic: asked once; same `MINIMAX_API_KEY` as the voice). `CHECK_PROVIDER=auto` uses Gemini and falls back to MiniMax when Gemini runs out of credit (π0.7: the Gemini key hit HTTP 402 between episodes; the run carried on with MiniMax); `both` hears every clip twice and lists disagreements for a human. Measured: MiniMax wrote 派零点七 right where Gemini wrote π0 (false alarms on version numbers vanish), and it heard 「比如叠 T 恤」 right where Gemini heard 阶梯序 3/3 — the same vendor's ear may forgive its own voice, so with a MiniMax voice prefer `both`. MiniMax writes numbers in Chinese characters (八点六亿, 第十五百分位, 一千七百八十), which is why the numeral conversion handles a decimal before 万 / 亿 and the word 百分位. The forced-choice test (step 2) needs an audio LLM: without Gemini credit, a human ear decides those.

`tts.py`'s automatic check (transcript similarity ≥ 0.75) catches mumbling, lines that stop halfway and clips that say a different line. Numbers the spoken form writes out (五十七, 两百二十五, 百分之七十二, 零点七五) are turned into digits on both sides before comparing, because the transcriber writes 57, 225, 72 %, 0.75. Before that, correct clips full of numbers scored as low as 0.42 and ended with a WARNING: 11 of the 44 numeral lines in agent-memory episodes 3–5, and none after the change. The check still lets a single wrong digit or name through, and it flags unfamiliar English names that were read correctly (Fable came back as 微博, 飞波, 费博尔). So after every voicing:

1. Transcribe every line that has Latin letters, digits or written-out numbers again, and read transcript and script side by side. `python3 recheck.py [scene …] [--n 3]` does this three times per line (step 3), converts Chinese numerals on both sides, drops transcripts that only echo the instruction, and labels each miss `1/3 transcriber` or `2/3 voice?`; reword the `voice?` lines.
2. For **names, abbreviations and version numbers**, ask Gemini a forced-choice question about the clip, and first prove the question can tell: run it on a **control** clip that really says the other name (Letta vs a clip saying Meta; Fable vs clips saying Viber and 微博; LAB among LLM / LLB / LAB vs a clip saying LLM), or on the same line synthesized **without** the number (it must answer 无). Never put candidate answers in the question as examples: asked "e.g. 4, 4.7, 5" it answers from the list. A take the question puts on the wrong side can be voiced again; keep a take that picks the right answer three times in three. Worked case (π0.7 ep01): 派零点七 came back as π0 in 2–3 of 3 transcripts even after rewording; a control clip saying only 派零 answered 零 3/3 and the real clip 0.7 3/3, so the transcriber, not the voice, was dropping 点七 — run this test before rewording a version number a third time.
3. Transcribe a suspicious clip three times: one miss in three is the transcriber, three in three is the voice.
4. Fixes that worked for numbers and names: a comma after a version number before 的 / 是 / 不 (「Fable 5，它的办法是」, 「Opus 5，是…」, 「Sonnet 5，不用提示…」), spelling a clipped phrase out (「猜测原因」 for 「猜原因」), a comma after a sentence-initial 「三楼」, or simply synthesizing again (every take differs).
5. A take that passed while testing can go straight into the cache: `audio/<sha1("{MODEL}|{VOICE}||{spoken text}")[:8]>.src.wav` (MiniMax; with Gemini the style text sits between the two bars) plus an empty `.ok` beside it. A line that ended with a WARNING has no `.ok` and would be re-voiced on the next run; if checking shows it was right, add the `.ok` by hand.

**Words a listener would mishear.** When the transcriber gets a word wrong all three times, a viewer will usually mishear it too, so reword the line; voicing the same wording again rarely helps. Check each new wording three times as well: in one line the first replacement went wrong in a new way (保持小 → 精简 → 不能太大). Changing the wording means changing the subtitle too. These are the patterns met in agent-memory:

- **A short word that blurs.** It might be a one-syllable verb right before an English word (来建 wiki → 降温), or a one-syllable adjective at the end of a sentence or after 保持 (保持小 → 保持笑). The two-character replacement can blur the same way (精简 → 清洁). Use a phrase of two or three syllables that can't be misheard as anything else: 建一个 wiki, 顶楼不能太大, 不让它变大.
- **A weak start.** A short label or a bare count opening a sentence starts too softly: 紫线：, and the recap's 一，二，三，. Put something before it, or make it longer: 先看紫色这条, 第一，第二，第三，. Opening on an abstract claim can sound like a different sentence altogether: 做梦可以跨很多会话 came back as 咱们可以看很多绘画. Lead with the subject and a pause: 而做梦，能把很多次会话放在一起看.
- **Words that run together.** Two short nouns joined by 和 before an English word can merge into one word (做梦和 wiki → 作墨盒). Split them into two clauses: 一份讲做梦，一份讲 wiki.
- **A near-homophone that changes the meaning.** 那一局 is heard as 那一句. Say it another way, e.g. name the thing by its colour on the chart.
- **Leave alone:** true homophones that the subtitle settles (会话 / 绘画, huìhuà), and proper names the transcriber writes with homophone characters (月见山). Confirm those with a forced choice instead.

## Reference instance

`~/Documents/Claude-blog/agent-memory/`: five episodes on Anthropic's "The components of agent memory" (2026-11-06), about 24 minutes in all, finished 2026-11-07. `PLAN.md` holds the series plan, decisions and every voicing problem met (配音检查的经验); episodes 1–2 were built on that folder's own `kit/` (the prototype of this template), later ones from this template with `shared/` for the memory building.
