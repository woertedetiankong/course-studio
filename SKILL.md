---
name: course-studio
description: Build self-study courses in the "video → reading → interactive lab page → coding dojo → real assignment" format, with a course dashboard that jumps to any episode and a project atlas (one map of the whole codebase, lit up episode by episode), all in the Bento minimal UI style. Use this whenever the user wants to start a new course or learning project in this format, add or produce the next episode/chapter of an existing one (e.g. "做下一集", "add episode 2 on RPC", "new course for MIT 6.1810 / CMU 15-445 / CS144"), make a 3Blue1Brown-style explainer video (narration and subtitles) for a lesson, build an interactive simulator/lab page for a concept, build or extend a project map / 项目地图 of a codebase so learners understand its architecture, write dojo levels with tests and targeted hints, or update the course home/dashboard — even if they don't name the skill or say "course-studio".
---

# Course Studio

A course is a series of **episodes**. Each episode teaches one core mechanism in five steps, and the course home shows the current episode's steps as Bento tiles plus a map of every episode:

| Step | What it is | Built from |
|---|---|---|
| 1 看视频 | 3Blue1Brown-style canvas animation pitched at engineers, no length cap (one mechanism, one running example; dense topics split into parts), Gemini-TTS narration, bilingual subtitles, chapters; plus its **课件** (slides: the video's screenshots with the narration beside each, as a page and a PDF) | `episode/` kit: `script.json` + `scenes.js` → `tts.py` (or `silent_timeline.py`) → `build.py` → `record.mjs` → `slides.mjs` |
| 2 读材料 | Paper / textbook chapter, what to read closely, questions to answer | data in `course.js` |
| 3 玩实验台 | Interactive bench: break things, predict-then-verify questions. Numbers come from a JS simulator, or from replayed runs of the real code (troubleshooting benches included) | `episode/lab.html` (+ `episode/lab_data.py` for replay) |
| 4 练功房 | Write real code level by level in the course's language; real tests, targeted hints, timeline | dojo: `course/dojos/<id>/` + `web/js/dojos/<id>.js` |
| 4′ 看流程图 | For learners who can't read code yet: clickable diagrams (structure / timing / one trip through the data), each box with plain words, file + function, folded real code, a jump into the video | `episode/flow.html` (step `flow`) |
| 4″ 看项目地图 | One map of the whole codebase shared by every episode: where code lives, what wakes it, who writes/reads shared state, one request end to end (guess-then-reveal), questions answered by clicking the map (incl. change impact); zoom file → functions → real code | `site/web/atlas.html` + `js/atlas.data.js` (step `map`, `COURSE_META.atlas`) |
| 5 真正的作业 | Link to the original course's lab and what changes vs. the dojo | data in `course.js` |
| 打电话 (optional) | Output after input: the learner phones an AI study buddy and explains the episode aloud; the buddy follows up and only quotes the episode; on hang-up a report links each gap to its moment in the video | `references/voice-call.md` (prototype: robot-course `voice/`) |

**Every course is bilingual (中文 / English).** All web UI has a 中 / EN switch (localStorage `course.lang`, shared by the home, the dojo and the lab pages; default from the browser). Every piece of learner-facing text is written in both languages in the same step that creates it: course data, dojo lessons and hints, test failure messages, lab pages, chapter titles, starter-code comments, README. Chinese is the base; English lives beside it (see "Bilingual" below). A step is not done until its English exists.

**Dojo or flowchart.** A course made with `--lang none` has no dojos: step 4 is the flowchart page (`references/flow-page.md`) and the home page hides the runner status. Any course may use both.

**Project atlas.** Any course built on a real codebase (a firmware, a lab skeleton like 6.5840's `src/`, a library) should have one: `references/atlas.md`. It is course-level, not per episode — build its skeleton with `scripts/atlas_extract.py` when the course starts, then each episode adds its lighting, routes, questions and zooms. Everything on it must pass `scripts/atlas_check.mjs` against the repo.

**Video-first courses.** A course may drop the lab, the atlas (and the dojo / flowchart) and ship each episode as **video + 课件 only**. robot-course switched on 2026-10-13 after learners said the video was enough and the lab and map went unused ("the map looks nice, but what is it for?"). Record the decision in the course's plan / `CLAUDE.md`. In such a course, workflow B skips steps 4–6, and the video and its 课件 take over what those steps carried: real-run cases, where the code lives, predict-then-verify, hands-on (video.md, "Video-first courses"). Expect more parts per topic, not longer videos. Labs and maps already released stay online as optional extras; ask before removing them.

**Dojos can be in any language.** The local runner is one Node program (`site/server.ts` + `lib/runner.ts`); each dojo names its language in `course/dojos/<id>/dojo.json`, and a driver in `lib/langs/` knows that toolchain. Built in: **Go** (`go test -race`), **TypeScript** (`node --test`), **Python** (pytest in a private venv), **Rust** (`cargo test`). Another language = one driver plus a language pack (`references/dojo.md`, "Adding a language"). A course can mix languages, one per dojo.

Reference instances: the user's MIT 6.5840 project (`~/Documents/ChatGPT/MIT`: `go-dojo/` site, `ep01-mapreduce/` episode, published as github.com/woertedetiankong/distsys-dojo), and the Pi Durable course (`~/Documents/ChatGPT/pi-durable`: a TypeScript dojo on a real npm library, crash tests that close and reopen a harness). And robot-course (`~/Documents/ChatGPT/robot-course`: ServoHub firmware, `practitioner` audience, no dojo; labs replay real SIL runs from `sil-mac/`: `episodes/ep02-sil/` load-step bench, `episodes/ep36-one-command/` end-to-end trace video + troubleshooting bench; the project atlas `site/web/js/atlas.data.js`). When a question is "how did we do X before", look there.

## Layout of a course made from the template

```
<course-root>/
  .env                      optional per-course overrides (GEMINI_VOICE…); the key itself lives once in ~/.config/course-studio/.env
  site/                     the repo you publish: `npm start` serves home + dojo + content
    server.ts               local runner (Node 22.19+; 127.0.0.1 only, random token, Host/Origin checks)
    lib/runner.ts           runner core: find dojos, prepare the workspace, run a level, map failures to codes
    lib/langs/<lang>.ts     one driver per language: go, typescript, python, rust
    web/js/course.js        ← course + episode data (Chinese); the dashboard is driven entirely by this
    web/js/course.en.js     ← English for course.js, overlaid by episode id
    web/js/i18n.js          L(zh, en), enOverlay, data-en static text, the 中 / EN toggle
    web/js/dojos/<id>.js    ← one per dojo: lessons, hint tiers, byCode hints (Chinese)
    web/js/dojos/<id>.en.js ← English for it, overlaid by level number
    course/dojos/<id>/      dojo.json {"lang": …}, starter/, tests/, reference/, harness/ (optional build files)
    course/shared/<lang>/   test helpers per language: fail(), say(), Trace
    content/epNN/           video.mp4, chapters.json, lab.html  (filled by dev/sync_content.py)
    dev/check.ts, dev/mutations.ts, dev/sync_content.py
  episodes/epNN-<slug>/     per-episode build folder (video kit + lab.html), output video.mp4
```

The template's language packs (`template/langs/<lang>/`: shared helpers, a two-level warm-up dojo with its hints and mutations, README lines) are what `new_course.py --lang` and "Adding a dojo in another language" copy from.

The MIT reference instance predates the template: its runner is the old Go `main.go`, its episodes are siblings of `go-dojo/` (`ep01-mapreduce/`), its `sync_content.py` uses an explicit dict, and it has a single dojo (`mr`). When working in that project, follow its existing conventions rather than migrating it, unless the user asks.

## Workflows

### A. New course
1. Agree on: course title/subtitle, source course + its schedule, episode list (one mechanism each, mapped to the original labs), and the dojo language — the one the original labs use, or the one the learner wants to practise (go, typescript, python, rust; anything else needs a new driver first, see `references/dojo.md`). Write the full episode list into `course.js` up front as `planned` — the course map is motivating even when mostly empty.
2. Scaffold: `python3 <skill>/scripts/new_course.py --root <dir> --lang <go|typescript|python|rust> --title … --subtitle … --title-en … --subtitle-en … --ep1 "<title>" --ep1-en "<English title>" [--slug …] [--port …]`. Fill `course.en.js` for every planned episode too (title, group). It copies `template/site` plus the language pack, creates `episodes/ep01-<slug>/`, and prints the next commands. Run `npm run check` in `site/` once: the warm-up must be all ✓ (this also proves the toolchain works on this machine).
3. Replace the sample `warmup` dojo when the first real dojo exists (or keep it as an optional warm-up in the course's language).
4. Then produce episode 1 with workflow B.

### B. New episode (the common case)
Do these in order; each step feeds the next. Show the user the outline and the script before spending effort on animation, and the lab page before writing the dojo — they are the expensive parts to redo.
1. **Outline** (in chat): the one core mechanism; the scenes it needs; what goes wrong without it; the 3 takeaways; which original lab it prepares for.
2. **Episode folder**: `python3 <skill>/scripts/new_episode.py --dest <root>/episodes/epNN-<slug> --n N --title … --title-en … --course-title … --course-title-en …`, then `npm install` there.
3. **Video** — read `references/video.md` (its "Defaults" and "3Blue1Brown style" sections set the length, audience and look; in a video-first course also its "Video-first courses" section). Write `script.json` following its "Hardcore and learnable" pattern (one running example, no length cap, split dense topics into parts) and scene skeleton, fact-check every claim about the code against the source (video.md, "Fact-check the script"), then run `tts.py` (Gemini TTS; needs the key; re-runs only pay for changed lines) — or `silent_timeline.py` when the user wants to preview the look first or asked for no voice — then write `scenes.js` against the real `timeline.json` beat times, `build.py`, check frames with `node frames.mjs`, then `node record.mjs` → `video.mp4`, then `node slides.mjs` → the 课件 (`slides.html` + `slides.pdf`; read its contact sheet, video.md "Slides"). Every video gets one.
4. **Lab page** (skip in a video-first course) — read `references/lab-page.md` and pick the engine first ("Pick the engine first": a JS simulator, or a replay of real runs filled by `lab_data.py`; for a course about an existing codebase, replay by default). Replace the toy simulator in `lab.html` with this episode's mechanism or bench; 4–6 predict-then-verify questions; mapping table to the real assignment. Every static element gets `data-en`, every script string `L(中文, English)`, every question a `QS_EN` entry.
5. **Project atlas** (courses with `COURSE_META.atlas`; skip in a video-first course) — read `references/atlas.md`. Light up the blocks this episode taught (from the plan's code-depth table), add its route(s) and 3–5 questions incl. one change-impact `multi`, zoom the files it reads closely (`atlas_extract.py fn` + `fill`), run `atlas_check.mjs` until `atlas ok`, add `'map'` + `map: {questions, desc, time}` to the episode in `course.js`/`course.en.js`.
6. **Dojo** (skip in a video-first course) — or, in a `--lang none` course, the **flowchart page**: read `references/flow-page.md`, fill the diagrams from the real source, show the user the page before moving on. For a dojo, read `references/dojo.md`. Levels ramp from language warm-up to the full mechanism; every hint in `byCode` has a test that emits that code and a mutation in `dev/mutations.ts` that proves it. Lessons and hints go in `<id>.js` and `<id>.en.js`; tests fail with `fail(code, say(中文, English))` (each language's helper); starter comments get an English line under each Chinese one. `npm run check -- <id>` must be all ✓.
7. **Wire up** — read `references/hub.md`. Add/flip the episode in `course.js` (status, steps, `slides: true`, reading, lab.questions = number of questions, dojo id, assignment) and its English in `course.en.js`. Run `python3 dev/sync_content.py epNN` (writes chapter titles in both languages).
8. **Verify in the real app**: `npm start`, open the home, play the video and click chapters, open the 课件 from the video tile and click a slide's ▶ time (the video starts there), answer a lab question and see the counter move, open the project map from the episode and answer a map question (the hub's map counter moves), run a dojo level failing (starter) and passing (reference), check dark mode and a phone width — in **both** languages (switch with the 中 / EN button and repeat: home, chapters, a failing dojo run's message and hints, the lab page's log and a question). In a video-first course the checks are the home, the video and chapters, and the 课件 (incl. its code-index and practice pages). Then tell the user what was verified and what wasn't (e.g. video not re-rendered).

### C. Smaller requests
Edit the relevant part directly, and change its English twin in the same edit: map content → `atlas.data.js` (both halves of each `L()`), then `atlas_check.mjs`; dashboard data → `course.js` + `course.en.js`; a hint → `web/js/dojos/<id>.js` + `<id>.en.js`; a test message → both halves of its `say(…)`; lab text → the element and its `data-en` (or both arguments of `L()`); a scene → `scenes.js` then `build.py` + `record.mjs` + `slides.mjs` + `sync_content.py`; a narration line → `script.json` then the whole video pipeline incl. `slides.mjs` (timings shift); slides for an episode that has a video but none yet → video.md "Slides".

## Principles that make this format work

- **One mechanism per episode, shown failing first.** Video, lab and dojo (or the video alone, in a video-first course) all hinge on the same "what breaks without it" moment (worker crash → reassign; slow worker → atomic rename). Pick it in the outline and reuse it in all three.
- **Predict, then verify.** Lab questions ask for a prediction before showing anything, and the explanation quotes numbers from actually running that scenario.
- **Real behaviour over models.** When the course is about an existing codebase, the lab's numbers come from running that code (replayed, with a repro command per case), and every claim in a video is checked against the source before it is animated. A model is fine for intuition and for what the harness cannot represent, labelled as such. Before calling something impossible to run for real, try building it into the harness; "not in the current build" is rarely a real limit.
- **Pin the source, don't freeze it.** A course about a codebase quotes it by `file:line` at one commit and its labs run it, so the checkout the course reads stays at that commit. Bugs found while making the course are welcome to fix, on a branch or fork with a PR upstream, then switch back; to teach a fix, patch a copy in the harness (as `sil-mac/enc/build_enc.sh` copies into `build/enc_src`) and label the patched run. Moving the pin is the user's decision and means rerunning every `lab_data.py` and `atlas_check.mjs` and redoing episodes whose quoted lines moved. Before the course repo goes public, write a root `README.md` (+ `.en.md`) for collaborators (layout, commands, pitfalls met so far) and a short `CLAUDE.md` with these rules that imports it. When you create a harness that compiles the codebase (like `sil-mac/`), add its build output (`sil-mac/build/`) to the course `.gitignore`.
- **Failures teach.** Dojo tests report a failure *code* and a plain-language message; the UI shows a targeted hint for that code before generic hint tiers. A test without a good message is unfinished.
- **Original material only.** Link to the original course's papers and labs, but write your own explanations, exercises and tests; never copy lab handouts, test suites or solutions. Keep the academic-honesty note in README and footer.
- **The learner's code lives in real files**, editable in the browser or their own editor; tests are the real toolchain (`go test -race`, `node --test`, pytest, `cargo test`), not a fake. When the course is about a library, the dojo uses the real published package, pinned to one version.
- **Two languages, one source of truth each.** Chinese and English are written together, never "translate later". The video is narrated in English with bilingual subtitles, so it serves both modes as is.

## Bilingual — how each part does it

| Part | Chinese | English | Shown by |
|---|---|---|---|
| Course data | `course.js` | `course.en.js`: `enOverlay(window.EPISODES, {epNN: {...}})` — objects merge by key; arrays of objects merge by `id`, then `n`, then index; an array of strings replaces the Chinese wholesale; to change only some fields of objects in an array (e.g. a link's label, keeping its url), key them by index `{0: {label}}` | `i18n.js` |
| Dojo lessons/hints | `dojos/<id>.js` | `dojos/<id>.en.js`: `enOverlay(window.COURSE, {levels: {1: {...}}, common: {...}})` (loaded by `dojo.html` only in English mode) | `i18n.js` |
| Page chrome (hub.js, app.js, `renderTimeline`) | `L('中文', 'English')` in place | same call | `L` |
| Static HTML in index/dojo.html | element text | `data-en`, `data-en-label`, `data-en-title` | `i18n.js` (loaded at the end of `<body>` before page scripts) |
| Test failures | each language's `fail(code, say(zh, en))` emits `DOJO_FAIL {"code","msg","msg_en"}` (Go: `say("中文 %d", "English %d", n)` with the args in the same order) | | runner passes `msg_en`; app.js shows it |
| Runner messages (build, timeout, race, missing toolchain…) | `msg` | `msg_en`, set in `lib/runner.ts` and the drivers | app.js |
| Timeline labels | Trace with a Chinese and an English label (`AddL` in Go, `addL` in TypeScript, `label_en=` in Python, `Some(en)` in Rust) → `label` + `label_en`; one label for language-neutral names | | app.js |
| Lab page | markup text, engine strings | `data-en` (innerHTML; avoid `"` inside, use “ ”), `L(zh, en)` in script, `QS_EN` by question index (title/sub/note/setup/ask/opts/explain) | the page's own inline `EN`/`L` |
| Event log 大白话/术语 | `plain` = `L(zh, en)` | `term` is already English | lab page |
| Chapters | timeline `zh` → `title` | timeline `title` → `title_en` | hub.js |
| Starter/reference code | Chinese comment line | English line right under it; trailing comments `// 中文 / English` | — |
| README | `README.md` | `README.en.md`, cross-linked at the top | — |

Write English as plain, natural English (not a word-for-word rendering): short sentences, concrete numbers, the same hint strength as the Chinese.

## Visual style

All web UI (home, dojo, lab pages) uses the **Bento minimal** style, except the project atlas, which has its own drafting-sheet / blueprint look (`references/atlas.md`, "Look") — read `references/style-bento.md` before writing or restyling any page. The tokens are already in `template/site/web/css/style.css` and the lab skeleton; reuse them rather than inventing new colors. The video is different on purpose: it follows **3Blue1Brown style** — dark canvas, meaning-coded colours, formulas built term by term from pictures, continuous motion, worked numbers — defined in `episode/head.html` and described in `references/video.md`. Video frames are not UI.

**Audience: engineers, in every course** (`references/video.md`, "Who the videos are for"): they want to master *this* codebase, and their backgrounds in its field vary. Skip textbook basics (one line at most); animate what reading the code can't show (timing, data flow, state machines, model ↔ generated code, real waveforms); real source is the main subject (40–50 % of the video), and every function or variable the video points at gets a short gloss of what it is, spoken and on screen; each scene runs problem → mechanism → source → evidence → pitfall; an analogy wherever a fitting one exists (their backgrounds vary), each landing straight on the running example, none when nothing fits.

## Reference files
- `references/style-bento.md` — tokens, components, layout rules, dark mode, do/don't
- `references/video.md` — script format, scene-writing API, timing, TTS, rendering, chapters
- `references/lab-page.md` — page structure, simulator engine pattern, question format, progress key
- `references/dojo.md` — dojo layout, dojo.json, runner API, per-language conventions, failure codes, timeline traces, check/mutations, adding a language
- `references/flow-page.md` — flowchart page (看流程图): diagram kinds, node data, detail panel, questions
- `references/atlas.md` — project atlas (项目地图): the five views, lighting rules, data format, extract → write → fill → check workflow, look
- `references/hub.md` — `course.js` schema, step kinds, progress keys, adding episodes
- `references/voice-call.md` — voice call with an AI study buddy: the idea, talk card, token/audio shape, measured pitfalls, cost, testing
