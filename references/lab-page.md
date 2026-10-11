# Interactive lab page (实验台)

Start from `template/episode/lab.html` (a working Bento page with a toy coordinator/nodes simulator). It's a single self-contained HTML file, so it can also be published as a claude.ai artifact; `sync_content.py` copies it to `content/epNN/lab.html` (wrapping it if it's a body fragment). References: `~/Documents/ChatGPT/MIT/ep01-mapreduce/lab.html` (a JS simulator: workers, intermediate files, atomic rename, backup tasks, combiner); `~/Documents/ChatGPT/robot-course/episodes/ep02-sil/lab.html` (replay of 13 real firmware runs, a load-step bench); `~/Documents/ChatGPT/robot-course/episodes/ep36-one-command/lab.html` (replay, a troubleshooting bench: 12 cases × 7 checkpoints).

## Pick the engine first
Decide where the page's numbers come from before writing anything. Three engines:

| | A. JS simulator | B. Replay of real runs | C. Real code live in the browser (WASM) |
|---|---|---|---|
| numbers come from | a model you write in JS | the real program, run by a data script, embedded in the page | the real program compiled to WebAssembly |
| free parameter dragging | yes | only the recorded cases | yes |
| can mislead | yes: what the model leaves out never shows up | no: odd results are the real behaviour | no |
| cost | a new model per episode | low: rerun the script | high once (port the harness), then low |

Choose by what the learner is trying to master:
- **Mastering an existing codebase** (a firmware, a library, a server): **B by default.** Real runs surface the facts a model hides (wrong units accepted silently, a callback returning success on error, a status that says "enabled" when it isn't). Consider C only for episodes whose point is continuous tuning (loop gains, filter frequencies); otherwise record more cases in B.
- **Writing the code themselves** (MIT-style labs): **A before they write it**, to build intuition for the mechanism (parameters must match the real lab: timeouts, sizes); **B from a reference run** to show why things fail, as event logs only, and with many runs/seeds when behaviour is nondeterministic (show distributions, not one lucky run); the most useful real-code view is **the learner's own run** (load their test log or the dojo trace into a timeline). Never publish a reference solution in a page, as code, WASM or anything decompilable.
- **What the harness cannot model in principle** (ADC/sampling timing, interrupt preemption, real bus frames, hardware faults): A is fine, but label it on the page as a model and cite the source lines it stands for.

Before saying something "can't be run for real", try to build it in: add the missing sources to a scratch build of the harness (never edit the upstream repo), stub only types or hardware calls. "Not in the current build" is usually a build-list choice, not a limit.

## Replay of real runs (engine B)
- **A data script in the episode folder** (`lab_data.py`, start from `template/episode/lab_data.py`): runs the real program for every case, keeps the signals the page needs (downsample, but keep full rate where a transient lives), and writes them into `lab.html` between `/*LAB-DATA*/ … /*END-LAB-DATA*/`, so the page stays one file.
- **Source excerpts are cut by line range in the same script** (`SNIP = {key: [(file, first, last), …]}`), never typed by hand; the page shows `file:a–b` above each one. Rerun after the repo moves.
- **Each case shows the command that reproduces it** on the learner's machine. The page guides (predict, then check the most instructive cases); free experimentation happens in their terminal, so replay loses less than it seems.
- Read observables before anything refreshes them (a getter that rewrites the value you are inspecting), and drive real interfaces with real units (read the conversion in the setter, don't assume).
- Explanations quote the recorded numbers through the embedded data, so the text and the bench always agree.

## Troubleshooting bench (排障台), a replay variant
For "it doesn't work — where does it break?" episodes (one request end to end, one write path, one RPC):
- **Cases**: one reference run that works plus N faults, each a real run with one thing wrong (a setting, a missing step, a wrong unit, an unready precondition).
- **Symptom first**: each case opens with only what the caller can see (return codes, read-backs, status words), never the cause.
- **Checkpoints**: 5–8 observables along the route, in order, each naming the real variable or function it reads; a case's verdict is the first one that fails (later ones still shown, dimmed: "the planner ran but the controller was disabled" is a lesson too). Mark checkpoints that don't apply to a path as n/a.
- **Guess first** (default on, remembered in localStorage): the learner clicks the stop where they think it breaks, then sees every checkpoint's measured value, the reason, the source excerpts and the repro command. Count first-try hits.
- **Questions** pair cases: two faults the caller can't tell apart, a clue that separates two similar ones.
## Structure (keep the order)
1. **Hero**: eyebrow (course · episode · 交互实验), title, a lead that frames the page as a game with an everyday analogy; the 4-tile learning path with the current step highlighted. `← 课程首页` link appears only when served by the runner.
2. **Analogy grid**: every term on the page ↔ an everyday thing (老师/助教/草稿纸 for coordinator/worker/temp file). A 大白话/术语 toggle switches the event log between the two vocabularies. For a `practitioner` course, make it a signal grid instead: each curve or checkpoint ↔ the real variable it is read from.
3. **Simulator** (engine A), or for engine B the **bench** of recorded cases (case picker, plots read from the data, verdict, repro command; or the troubleshooting layout above). Simulator: sticky control bar (play/pause, step, reset, speed, phase pill, clock); settings tiles (sizes, toggles for each mechanism the episode teaches, e.g. atomic rename on/off); a stage of tiles showing the system's state with buttons to inject faults (crash/restart, slow); event log; verdict tile that checks the outcome against ground truth.
4. **先预测，再验证**: 4–6 questions. Each = a preset scenario + setup text + ask + options + `right` + `explain()`. Choosing an answer locks the options, shows right/wrong, and an explanation that **quotes the numbers of that exact scenario**: engine A runs it headlessly, engine B reads the recorded run (time taken, retries, wrong lines, measured values). A button opens the scenario on the bench. Order them so each builds on the previous (crash after map → crash after reduce → slow worker without atomic rename → with it → backup tasks → combiner).
5. **对照作业**: table mapping each phenomenon to what the learner writes in the real assignment (or, for a codebase course, does next in their own terminal), plus the common trap in red. Note any place the simulator or harness differs from the real system.
6. **Footer**: the source paper / lab number.

## Bilingual
The template already has the machinery; keep it working as you replace content:
- An inline `<script>` before `<title>` defines `EN` (from `localStorage['course.lang']`, else the browser) and `L(zh, en)`; it sets `<html lang>`.
- Static markup: Chinese text in the element, English in `data-en` (applied as innerHTML, so `<b>`, `<code>`, `<em>` work; avoid `"` inside the attribute, use “ ” or `&quot;`), `data-en-label` for aria-label, `data-en-title` for title. Elements the script overwrites later (play button, clock, phase) need none.
- Script strings: `L(`中文 ${x}`, `English ${x}`)`, including the plain-language half of every log entry (`say(sim, who, L(zh, en), term)`; the `term` half is already English) and log speaker names.
- Questions: write `QS` in Chinese and `QS_EN` (same order: title, sub, note, setup, ask, opts, explain) right after it; `if (EN)` merges it. Explanations run the scenario headlessly in both versions. If an English explain matches log text, match on the `term` field, not `plain`.
- The 中 / EN button sits in `.hero-top` next to the home link; it writes `course.lang` and reloads.

## Engine pattern (engine A)
Keep the simulation a pure, deterministic step function: `sim = init(cfg); tick(sim, dt); draw(sim)`. Faults are scheduled as `cfg.events` (`{at, kill}` or triggered on an internal event like `mapDone`), and random choices use a seeded `rnd(i)`. Then `runHeadless(cfg)` gives the questions exact numbers and the live view and the explanation always agree. Model time in "story seconds" (e.g. task = 3 s, timeout = 10 s like the real lab), shown on the clock.

## Progress contract
When a question is answered, add its index to `localStorage['course.<epId>.lab.answered']` (JSON array). The home page counts it against `lab.questions` in `course.js` — keep that number equal to `QS.length`. Set `const EP` in the page to the episode id.

## Checks
Click every question and replay; crash nodes mid-run; toggle every setting while running; dark mode; 390 px wide with no horizontal scroll; no console errors — in both languages (grep the script for leftover Chinese outside `L(` / `QS`).
