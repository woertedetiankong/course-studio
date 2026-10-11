# Video pipeline

Folder: `episodes/epNN-<slug>/` (from `scripts/new_episode.py`). Needs `ffmpeg`, Node + `npm install` (playwright-core), Google Chrome (or `CHROME_PATH`), and `GEMINI_API_KEY` in `~/.config/course-studio/.env` (shared by every course; a course-root `.env` or the environment can override it). Never put the key in the skill, the repo or a committed file.

```
script.json ──tts.py──▶ audio/*.wav (cached) + narration.wav/.mp3 + timeline.json
            └─silent_timeline.py─▶ same outputs, silent audio, subtitle timing by reading speed (no key, no quota)
head.html + scenes.js + tail.html + timeline.json ──build.py──▶ index.html  (open to preview, scrub, play with audio)
index.html?record + narration.wav ──node record.mjs──▶ video.mp4 (1920×1080, 30fps, h264 + aac)
timeline.json ──site/dev/sync_content.py──▶ content/epNN/chapters.json
```

## Defaults: what every episode video is

- **Audience: whatever the course declares** in `COURSE_META.audience` (`beginner` by default, or `practitioner`). See "Audience profiles" below; it changes what the animation is for, how much code is shown, the narration voice and the scene skeleton. Everything else on this page applies to both.
- **Length: 9–10 minutes** (≈ 540–600 s of narration). That is roughly **16–20 scenes and 110–140 lines** at the Gemini teacher pace (≈ 4.5 s per 12-word line plus gaps). Check `total` after `tts.py`; outside 8.5–10.5 min, add or cut lines rather than stretching animations.
- **Style: 3Blue1Brown** (below). The canvas palette in `head.html` is already dark with bright meaning-coded colours; use it.
- **Narration: English via Gemini TTS, bilingual subtitles.** Subtitles carry the Chinese, so one video serves both UI languages.
- **Preview before narrating.** When the user wants to see the look first, or asks for no voice, run `silent_timeline.py` instead of `tts.py` and render; switch to `tts.py` later, everything else stays the same.

## Audience profiles

| | `beginner` (default) | `practitioner` |
|---|---|---|
| Who | weak foundation; high-school maths, nothing about the field | engineers in the field who want to master *this* codebase |
| Animation is for | building intuition for the concept | showing what reading the code can't: timing (who interrupts whom, in what order), data flow across files, state machines side by side, model ↔ generated code, real waveforms before/after a change |
| Basics | explained from an everyday analogy, each term defined | one line at most; no analogies except for architecture |
| Code | last, simplified, ~10 % of the video | the main subject, 40–50 %: real paths, function and variable names, cut lines marked `…` |
| Scene arc | picture → name → symbol → formula → numbers | problem (why it exists) → mechanism animation → source walkthrough → evidence (a real run, real numbers) → pitfall / design trade-off |
| "Understandable" means | "now I get the idea" | "so *that's* what this code does" — clear, not shallow |
| Voice (`tts.py`) | warm, patient teacher, unhurried | clear, confident senior engineer talking to a peer, brisk but unhurried |

Real evidence beats illustration for practitioners: when the course has a runnable target (a simulator, the real tests), plot data from actual runs and quote measured numbers — and sample fast enough not to miss the transient you are describing.

### Scene skeleton for `practitioner` (adapt, don't pad)
| # | Scene | ~s |
|---|---|---|
| 0 | Intro: what in the codebase you'll be able to read after this | 15 |
| 1 | Why it exists: the engineering problem, stated in one or two lines | 30 |
| 2–3 | Where it lives: files, entry points, who calls it (map / timeline) | 60 |
| 4–8 | The mechanism, one piece per scene: animation → the real source, line by line | 200 |
| 9 | "So far" | 20 |
| 10–12 | Evidence: run it, real waveforms / numbers, one change and its effect | 100 |
| 13–14 | Pitfalls, design trade-offs, what the code assumes | 60 |
| 15 | Limits: what this doesn't show or cover, and which episode does | 30 |
| 16 | Recap: three things to remember | 25 |
| 17 | Your turn: a change to make and predict | 20 |

The beginner sections below ("Narration", the 9–10 minute skeleton) still apply to `beginner` courses as written; for `practitioner` keep their mechanics (≤ 20 words a line, ask-pause-answer, recap) but drop the analogy-first and define-everything rules.

## 3Blue1Brown style, concretely

Visual
- **Dark canvas, few elements, lots of space.** One idea on screen at a time; clear the previous picture (fade it out) before the next one comes in. Never more than ~3 things moving at once.
- **Colour means something, consistently, for the whole episode.** Pick a colour per concept in the outline (e.g. stiffness coral, damping violet, targets gold, measurements sky) and use it for the symbol in formulas, the arrow in the picture, the curve in the graph and the word in the chip. Write the legend as a comment at the top of `scenes.js`.
- **Formulas are built, not shown.** Introduce a symbol only after the picture it names is on screen; fade terms in one at a time (`eq` with per-part alpha) or `wipe` them in left→right; point at parts with `brace`; dim terms that are switched off instead of removing them, so positions stay put.
- **Everything moves continuously.** Values sweep rather than jump (a dot sliding along a graph line while the arm moves, a counter ticking with a gear). Use `eio`/`eo` easing; avoid hard cuts inside a scene.
- **Show, then name, then formalise.** Picture/analogy → plain-language name → symbol → formula → concrete numbers plugged in.
- **Real numbers on screen.** After the general formula, always plug in one worked example (N = 10, Kp = 20 → 0.2) and show the arithmetic.
- **Code last, simplified, mapped back.** When the episode reads real source, show a cut-down excerpt in `codeBox`, highlight each line as the narration names it, and colour it with the same concept colours as the formula.

Narration (script.json)
- **Talk like a patient teacher sitting beside the viewer.** "you", "we", short sentences, one idea per line. ≤ 20 words per line so it fits two subtitle rows.
- **Every new term gets defined the first time, in plain words**, in the same line or the next ("torque — how hard the motor twists").
- **Start from something the viewer has felt** (pushing a door, a spring, a car's suspension) before any symbol.
- **Ask, pause, answer.** Pose the question the viewer should be asking ("so why not just make Kp huge?"), give it a beat, then answer. 2–4 of these per episode.
- **Show it failing first.** The "what breaks without it" moment from the outline gets its own scene before the fix.
- **Recap mid-way and at the end.** One "so far:" scene around the middle (three bullet chips), one recap scene at the end, then 1–3 think-about questions.
- No jargon walls, no "obviously/simply/just", no unexplained acronyms.

### Scene skeleton for 9–10 minutes (adapt, don't pad)
| # | Scene | ~s |
|---|---|---|
| 0 | Intro: title + one-sentence promise of what you'll understand | 20 |
| 1 | Hook: a real situation where this matters (robot leg landing, server crash) | 30 |
| 2 | Everyday analogy the whole episode leans on | 35 |
| 3–4 | The naive approach, and watching it fail | 60 |
| 5–8 | The core mechanism, one ingredient per scene, each: picture → name → symbol | 150 |
| 9 | "So far" mini-recap | 25 |
| 10–12 | Putting it together; worked example with real numbers; a common misconception | 100 |
| 13–14 | How the real system / codebase does it (simplified excerpt) | 60 |
| 15 | Pitfall or subtle detail (units, edge case, the puzzle) | 40 |
| 16 | Recap: three things to remember | 30 |
| 17 | Think about / what you'll do in the lab | 25 |

## Fact-check the script against the source (before animating)
Every claim in `script.json` about the codebase gets checked against the real source before any scene is drawn: function names and call order (grep each one and read the call site, not just the definition), which interrupt or thread runs it and at what priority, constants and units (read the `#define` and the setter that converts), what a return value means and whether the caller even reads it. Numbers on screen come from a real run when the course has a runnable target. Then re-check anything an earlier episode, the plan or the project map says about the same path: when they disagree, the source wins, and the other place gets fixed in the same pass. On robot-course ep36 this pass caught four wrong claims (where an edge was detected, which interrupt receives CAN frames, a PWM centre value, a current sign), two of them already published in episode 1's map.

## script.json
Array of scenes `{id, title, zh, lines: [[english, chinese, spoken?], …]}`. `title`/`zh` show as the chapter heading in the video and become chapter names (`zh` in Chinese mode, `title` in English mode). One line = one subtitle = one **beat**. The optional third element is what the TTS says when it should differ from the subtitle ("theta star" for "θ*", "M I T", "Map Reduce") — always give one when the subtitle has symbols, code identifiers or Chinese.
- Changing any line re-synthesizes only that line (hash cache), but shifts every later time → re-run tts, build, record, sync.

## tts.py (Gemini TTS)
Model `gemini-3.8-flash-tts` (override `GEMINI_TTS_MODEL`), voice `Sulafat` — warm (override `GEMINI_VOICE`; `Achird` friendly, `Charon` informative, `Kore` firm). Style text in `GEMINI_TTS_STYLE`; without it the style follows the course audience: `COURSE_AUDIENCE` in the environment/.env, else `audience` read from the course's `site/web/js/course.js` (`beginner`: "a warm, patient teacher explaining to a complete beginner…"; `practitioner`: "a clear, confident senior engineer explaining to a fellow engineer…"). All three can go in `~/.config/course-studio/.env` (defaults for every course) or a course-root `.env` (just this course).
- The style is sent as a `### DIRECTOR'S NOTES` header before `### TRANSCRIPT`. A plain "Say this like…:" prefix gets read aloud by this model, and `systemInstruction` is rejected — don't change that.
- Returns 24 kHz mono WAV; 4 lines are synthesized in parallel with retries on 429/5xx. A clip longer than `3 s + 0.75 s/word` is regenerated (up to 3 tries) and then flagged with a WARNING — listen to it and reword the line (mixed-language text is the usual cause: keep `spoken` pure English).
- **Listen-back check.** The TTS model sometimes reads the director's notes aloud mid-line ("…turned by a complete beginner, calm, unhurried pace…") and still passes the length limit. So every new clip is transcribed with `GEMINI_CHECK_MODEL` (default `gemini-3.8-flash`, `off` to skip) and regenerated on leaked style words or a clip far too long/short; the last two tries send the bare line without notes. A clip that passed gets an `audio/*.ok` marker; cached clips without one are checked once on the next run. The check costs one request per line on the text model.
- **Free-tier quota is 100 requests per model per day**; retries and checks count. A 110-line episode with retries can need two days on a free key — finish the rest the next day (the cache keeps finished lines).
- Trims silence, lays lines out with LEAD 0.7 s before a scene, GAP 0.45 s between lines, TAIL 1.1 s after; writes `narration.wav`, `narration.mp3` (for the preview player) and `timeline.json`: `{total, scenes: [{id, title, zh, start, dur, beats: [{text, zh, start, dur}]}]}` (beat start is relative to the scene).

## silent_timeline.py
Same outputs as `tts.py` without any API: each line lasts `max(2.8 s, words/2.6, hanzi/5) + 0.4 s`. Use it to show the user the look first, or for a subtitles-only video. Scenes written against it keep working after switching to `tts.py`, because they time off `b[i]`.

## scenes.js
`SCN[id] = (lt, b, d) => { … }` per scene: `lt` seconds into the scene, `b[i]` start of beat i, `d` scene duration. Pure function of time — no state, no `Date.now()` — so seeking and frame-by-frame recording are exact.
- Time everything off beats: `const a = eo(ramp(lt, b[1], b[1] + .6))` fades in exactly when line 2 starts. `knots(t, [[t0,v0],[t1,v1],…])` for multi-stage motion. Physical motion should be a closed-form function of time (e.g. `stepResp(t, ω, ζ)` for a damped settle), not a simulation loop.
- Engine (head.html): canvas 1920×1080; colors `C.{bg,ink,dim,faint,line,panel,panel2,sky,coral,gold,mint,red,violet}`; fonts `F.{disp,sans,mono,zh}`; easing `ramp, eo, eio, eback, lerp, knots, rnd(i)`.
  - general: `text, rr, glow, dot, packet(a,b,p,color,{bend,label}), burst, cross, check, ringArc, pulse, tag, chip, panel, arrow, fileIcon, cylinder, lockIcon, server, user, hexagon, nodeCircle, wrapLines`
  - 3b1b maths: `eq(parts, cx, y, size, {left, glow, alpha})` with parts `[str, color, alpha?, sub?]` (italic serif; `sub` draws a subscript); `wipe(p, x, y, w, h, fn)`; `brace(x1, x2, y, label, color, a, dir)`; `axes(x, y0, w, h, {xl, yl, full, both})`; `plot(fn, x, y0, w, k, prog, color)`; `stepResp`; `DEG`
  - mechanics: `arm(px, py, L, θ, {ghost, color, mass, lw})` (θ CCW from +x), `tip`, `arcArrow(px, py, r, a0, a1, color)`, `springArc(px, py, r, a0, a1, color)`, `gear(x, y, r, teeth, rot, color, {mark, spokes})`
  - text blocks: `codeBox(x, y, w, title, lines, {hl(i), mark(i), base})`, `label2(en, zh, x, y)`
- tail.html draws the chrome: chapter number + title top-left (scenes 1…n-2), progress ticks top-right, subtitles bottom. Keep scene content between y≈160 and y≈840.
- `build.py` collects every Chinese character in scenes.js into `EXTRA_ZH` so the font subset loads them — nothing to maintain by hand.
- Add episode-specific helpers at the top of scenes.js (e.g. the episode's main formula as an `eq` parts builder); promote them to `head.html` in the skill's template only if they're generic.
- Reference episodes for this style: `~/Documents/ChatGPT/robot-course/episodes/ep02-sil/` (practitioner: real SIL waveforms from `data/*.csv`, code boxes) and `ep36-one-command/` (practitioner: a 22-scene end-to-end trace, timing lanes, a route progress strip, real waveforms; `scenes.js` is concatenated from `data.js`, `scenes.head.js`, `helpers.part.js` and `scenes.body.js` by `build.sh`). `ep01-big-map/` is the beginner style (analogies).

## Checking before recording
`node frames.mjs [sceneId …]` renders a frame near the end of every beat and tiles them 2×2 into `frames/sheet-*.jpg`; read the sheets and fix overlaps, off-canvas text, subtitle collisions and titles long enough to hit the progress ticks (keep a chapter `title` under ~32 characters). Recording a 10-minute episode takes ~8 minutes (≈ 40 frames/s); do it last, then pull 3–4 frames from the mp4 to confirm.

## After recording
`cd <root>/site && python3 dev/sync_content.py epNN`. Videos are gitignored; they ship via GitHub Releases (`content/epNN/video.mp4`).
