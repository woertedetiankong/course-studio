# Interactive lab page (实验台)

Start from `template/episode/lab.html` (a working Bento page with a toy coordinator/nodes simulator). It's a single self-contained HTML file, so it can also be published as a claude.ai artifact; `sync_content.py` copies it to `content/epNN/lab.html` (wrapping it if it's a body fragment). Reference: `~/Documents/ChatGPT/MIT/ep01-mapreduce/lab.html` (MapReduce: workers, intermediate files matrix, atomic rename, backup tasks, combiner).

## Structure (keep the order)
1. **Hero**: eyebrow (course · episode · 交互实验), title, a lead that frames the page as a game with an everyday analogy; the 4-tile learning path with the current step highlighted. `← 课程首页` link appears only when served by the runner.
2. **Analogy grid**: every term on the page ↔ an everyday thing (老师/助教/草稿纸 for coordinator/worker/temp file). A 大白话/术语 toggle switches the event log between the two vocabularies.
3. **Simulator**: sticky control bar (play/pause, step, reset, speed, phase pill, clock); settings tiles (sizes, toggles for each mechanism the episode teaches, e.g. atomic rename on/off); a stage of tiles showing the system's state with buttons to inject faults (crash/restart, slow); event log; verdict tile that checks the outcome against ground truth.
4. **先预测，再验证**: 4–6 questions. Each = a preset scenario + setup text + ask + options + `right` + `explain()`. Choosing an answer locks the options, shows right/wrong, and an explanation that **runs the scenario headlessly and quotes the numbers** (time taken, retries, wrong lines). A button replays the scenario live in the simulator. Order them so each builds on the previous (crash after map → crash after reduce → slow worker without atomic rename → with it → backup tasks → combiner).
5. **对照作业**: table mapping each phenomenon to what the learner writes in the real assignment, plus the common trap in red. Note any place the simulator deliberately differs from the real lab.
6. **Footer**: the source paper / lab number.

## Bilingual
The template already has the machinery; keep it working as you replace content:
- An inline `<script>` before `<title>` defines `EN` (from `localStorage['course.lang']`, else the browser) and `L(zh, en)`; it sets `<html lang>`.
- Static markup: Chinese text in the element, English in `data-en` (applied as innerHTML, so `<b>`, `<code>`, `<em>` work; avoid `"` inside the attribute, use “ ” or `&quot;`), `data-en-label` for aria-label, `data-en-title` for title. Elements the script overwrites later (play button, clock, phase) need none.
- Script strings: `L(`中文 ${x}`, `English ${x}`)`, including the plain-language half of every log entry (`say(sim, who, L(zh, en), term)`; the `term` half is already English) and log speaker names.
- Questions: write `QS` in Chinese and `QS_EN` (same order: title, sub, note, setup, ask, opts, explain) right after it; `if (EN)` merges it. Explanations run the scenario headlessly in both versions. If an English explain matches log text, match on the `term` field, not `plain`.
- The 中 / EN button sits in `.hero-top` next to the home link; it writes `course.lang` and reloads.

## Engine pattern
Keep the simulation a pure, deterministic step function: `sim = init(cfg); tick(sim, dt); draw(sim)`. Faults are scheduled as `cfg.events` (`{at, kill}` or triggered on an internal event like `mapDone`), and random choices use a seeded `rnd(i)`. Then `runHeadless(cfg)` gives the questions exact numbers and the live view and the explanation always agree. Model time in "story seconds" (e.g. task = 3 s, timeout = 10 s like the real lab), shown on the clock.

## Progress contract
When a question is answered, add its index to `localStorage['course.<epId>.lab.answered']` (JSON array). The home page counts it against `lab.questions` in `course.js` — keep that number equal to `QS.length`. Set `const EP` in the page to the episode id.

## Checks
Click every question and replay; crash nodes mid-run; toggle every setting while running; dark mode; 390 px wide with no horizontal scroll; no console errors — in both languages (grep the script for leftover Chinese outside `L(` / `QS`).
