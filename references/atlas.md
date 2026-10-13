# Project atlas (项目地图)

One map of the whole codebase that every episode of a course shares. Each episode lights up the part it taught, so by the last episode the learner holds the project's architecture in their head: **where** code lives, **when** it runs, **how data is handed over**, and **how one request travels**. It is the step that turns "I watched the episodes" into "I can find my way around this project". Agreed with the user on robot-course (ServoHub, 2026-10-10) and meant for every course built on a real codebase, including MIT 6.5840.

It complements the other steps: the video explains why, the lab page shows behaviour, the flowchart page (`flow-page.md`) explains one mechanism, the atlas holds the structure together. A course turns it on with `COURSE_META.atlas = true`; an episode adds the step `map`.

Reference instance: `~/Documents/ChatGPT/robot-course/site/web/js/atlas.data.js` (C firmware, 35 blocks, zoom into `motor_ctl_loop.c`). The template ships a 5-block sample cut from it.

## Files
| File | What |
|---|---|
| `site/web/atlas.html` | page shell (header, episode switch, ledger, tabs, map, side sheet) |
| `site/web/css/atlas.css` | its own look (below); layer colours come from the data |
| `site/web/js/atlas.js` | the engine: draws everything from `window.ATLAS`; never edit per course |
| `site/web/js/atlas.data.js` | **the course's map** — the only file you write |
| `scripts/atlas_extract.py` | read the repo: skeleton (functions, calls, goroutines, shared-state reads/writes), one function with line numbers, `fill` zoom code from the repo |
| `scripts/atlas_go/` | Go extractor (go/ast) used by `atlas_extract.py --lang go` |
| `scripts/atlas_check.mjs` | proves the data against the repo; must pass before showing the user |

Episode titles come from `course.js`; deep link `atlas.html#epNN`. **Learners only see released episodes** (status other than `planned` in `course.js`): no spoilers of later routes and questions, and a link to an unreleased episode falls back to the latest released one. Block details still say which later episode reads a block ("第 50 集 · 读懂"), which sets expectations without giving content away. Authors preview everything with `atlas.html?all#epNN`. Zoom is gated the same way: a block's file view (functions, who calls whom) opens once the block is at least seen; its code view (segments, shared-state reads/writes) only from the episode that reads it closely (`fns[].ep`, default the block's first `r` episode). Progress: correct answers go to `course.<epId>.map.answered` (the hub's `map` step counts them against `map.questions`).

**Episodes split into parts** (`ep11a`…`ep11d` in `course.js`, same `n`, `part: 'a'`…): they share one map section `eps[n]`; give it a title with `eps[n].t` (the picker shows it instead of the first part's title), give every part `map: {page: '<first part id>', …}` so they share one progress count, and deep links `atlas.html#ep11c` resolve to episode 11. A lab page shared by parts uses `lab: {page: '<id of the part that holds lab.html>', …}`.

## The five views — each answers one question
| View | Question | Data | Robot-course example | Distributed-systems example |
|---|---|---|---|---|
| 在哪 where | Where does it live? | `layers`, `nodes` | five layers, file-level blocks | Clerk → kvraft server → Raft → labrpc/labgob → persister |
| 什么时候跑 when | What wakes this code? | `clocks` (`d` = seconds per beat in the scope, at a stated slow-down) | 20 kHz / 10 kHz / 1 kHz interrupts | election timer, heartbeat goroutine, RPC handlers, applier goroutine |
| 数据怎么交接 board | Who writes, who reads? | one node with `board: true`, `fields` | `kAxis` fields | `Raft` struct fields (`currentTerm`, `log`, `commitIndex`) under `mu` |
| 一条路走到底 route | How does one request travel? | `routes`, guess-then-reveal by default | "go to 90°" from CAN to PWM | one `Put` from Clerk to apply |
| 考考你 quiz | Can you find your way? | `eps[n].qs` | single answer (click a block) or `multi` change-impact | "add snapshots: which blocks change?" |

Views without data hide themselves (no clocks → no "when" tab).

## Lighting
`node.eps = [[episode, 's' | 'r'], …]` — `s` 见过 (shown or mentioned), `r` 读懂 (read closely). Take it from the course plan's code-depth table (robot-course: `episodes/plan.py` `CODE`): `peek` → `s`; `read`, `black`, `trace` → `r`. A block is hatched until its first episode, outlined when seen, filled when read; blocks new in the current episode get an amber frame in the where view (the page's one entrance animation).

## Pace it to the episodes (every audience)
The map shows only what the episodes so far have taught, so an early learner never meets a wall of names. Besides lighting and zoom (above):
- **clock calls** carry an episode: episode 1 of robot-course lists only the entry points the video names (`CURRENT_LOOP_IRQ_TASK → CurrentLoopCtrl`, `AppRun` in the position loop…), episode 13 opens the full call order (18 calls in the position loop). A clock's `note` is the plain sentence for everyone; `more` adds detail from a later episode.
- **board fields** carry an episode: episode 1 shows only what its video says (current read in, voltage out); field-level handoffs (`idq_tar_A[1]` between two loops) wait for the episode that reads them.
- **consistency**: anything an episode shows (a clock call, a field's writers and readers, a route step) must sit on blocks lit by that episode. `atlas_check.mjs` fails otherwise — fix it by lighting the block in that episode or by moving the item to a later one. When unsure what an episode covers, compare against its narration (`script.json`), not against the plan alone.
- **released episodes only**: episodes often ship out of order (robot-course released 1, 2, 11, 36 first), so everything above counts only released episodes (`course.js` status other than `planned`): a block lit by a planned episode 6 stays hatched at episode 11, its calls and fields stay hidden, and its code view stays locked. When a released later episode also teaches an item tagged with an earlier planned one, give the item every episode that teaches it, e.g. `['w2', 'PosSpeedCtlLoopTask()', [6, 11]]` or `ep: [6, 36]`: it shows from the first released one. `atlas_check.mjs` reads `course.js` from the data file's folder and fails an item whose first released episode doesn't have its blocks lit by released episodes.

## Data format (`window.ATLAS`)
All learner-facing text is `L('中文', 'English')` — the checker fails on a missing English half.
```js
meta: {title, lead, footer, gh /* repo URL at the pinned commit, ending in / */, vb: [w, h], comment: '//',
       mapLabel, viewSub: {where?, when?, board?, route?, quiz?}, whenTitle, whenLead, scopeNote, boardLead},
layers: [{k, n /* number shown */, t, a /* one-line role, ≤ ~18 chars in English */, d: ['dir/'], y, h, color: [light, dark]}],
nodes: [{id, k /* layer key */, x, y, w, h, t, f /* file name on the block */, path /* repo path, file or dir */,
         plain, fns: ['name()'…], eps, group?, black? /* external code: f = L('外部代码 · 黑盒', 'external · black box') */,
         board?, sub?, rows? /* only for the board node */}],
clocks: [{id, t, rate, per?, d? /* animated lanes only */, color? /* used by zoom file maps */, note, more?: [episode, 'detail added from then on'],
          calls: [[nodeId, 'what is called', episode? /* shown from this episode, or [episodes] that teach it; default 1 */]]}],
fields: [{f: 'struct.path', ep? /* shown from this episode, or [episodes]; default 1 */, tag?, t, w: [nodeIds], r: [nodeIds], wc, rc, how}],
routes: {id: {ep, t, sub, loopTo?, run? /* key in ATLAS_RUNS: fills {name} below */, example? /* the running example, one line */, done? /* end-of-trip sentence */,
         steps: [{n: [nodeIds, first one is where the arrow lands], s? /* short label in the stop strip */, t, p,
                  fn? /* zoom function of n[0] this stop is in: file-position bar, "open in code", guess by function */,
                  stack?: [[path, line, 'what is called or defined there']] /* the call-stack breadcrumb */,
                  file, start, src: /*SRC path a-b*/ [] /* verbatim, filled */, hi?: [lines], cut?: [[a, b, 'what they do']], mark?: {line: 'value, may use {name}'},
                  code? /* older form: copied lines, '...' = cut; used when there is no src */}]}},
zoom: {nodeId: {lines, intro, after?, map: [[from, to, clockId|'head'|'data'|'test', label]], order: [fnIds],
       fns: [{id, name, span: [a, b], clock, ep? /* episode that unlocks the code view */, by: [nodeId, 'caller'], does, calls: [[nodeId, 'fn()']], minor?,
              start, src: /*SRC path a-b*/ [], at: {line: [[nodeId, 'calledName']]}, ptr?: {line: [fnIds] /* targets of a call through a function pointer */},
              segs: [{a, b, t, p, w: [fields], r: [fields]}]}]}},
eps: {n: {routes: [routeIds], qs: [{q, a: nodeId, why} | {multi: true, q, a: [nodeIds], why, per: {nodeId: 'why this one is / is not affected'}}]}},
```
Layout: map is an SVG of `meta.vb`; keep the left 160 px for layer labels; blocks 135–400 wide, 56–76 tall; the board node is a tall column on the right spanning the layers it serves. Keep ≤ ~40 blocks; group families (`×8`) instead of shrinking text.

## How to build one
1. **Skeleton from the repo, not from memory.** `python3 <skill>/scripts/atlas_extract.py skeleton --lang c|go --root <repo> --paths <dirs> [--board "kAxis.,axis->" | "rf."] --out /tmp/sk.json`. Use `calls --skeleton … --name X` to see who calls what. Extraction cannot see calls through function pointers, interfaces or registered callbacks: grep those and say so in the block's text.
2. **Choose layers and blocks** with the user in chat (one block per file or per family of files; external libraries as black boxes). Pick the shared state for the board view (the struct every loop or goroutine reads and writes).
3. **Clocks**: start from the entry points (interrupt handlers, `main`, `go` statements, RPC handlers, timers) and list what each one calls, in order.
4. **Routes**: one per episode that has a "follow it end to end" moment. **A route is the episode video's interactive twin** (agreed on robot-course ep11, 2026-10-12): the same stops, numbered and named as in the video's stop strip (`s`), the same running example (`example`, and values from the same real run beside the code lines via `run` + `mark`), and code shown the way the video shows it: verbatim by line range (`file`, `start`, `src` filled by `atlas_extract.py fill`), lines lit (`hi`), skipped lines as one `cut` row saying what they do, and the call stack (`stack`) in call order. Stops inside one file name their function (`fn`): the side sheet shows where the stop sits in the file and the learner guesses the next *function* instead of clicking the same block again; `ptr` on a `.read` / `.process` line lets the code view follow a function pointer. Values come from a course script that runs the bench and writes `window.ATLAS_RUNS = /*ATLAS-RUNS*/…/*END-ATLAS-RUNS*/` at the end of `atlas.data.js` (robot-course `site/dev/atlas_runs.py`); never type them. A learner arriving from an episode (`atlas.html#epNN`) lands on its trip until they have walked it (`atlas.trips` in localStorage); the end card sends them to the quiz. Older steps with only `code` still work.
5. **Questions**: per episode 3–5 single-answer ("which file…") and at least one `multi` change-impact question ("you add X: which blocks change?") whose answer you verified by finding the analogous existing code (robot-course: a new 1 ms module = copy how the brake is wired into `HalInit()` and `UnrealTimeBase1ms()`).
6. **Zoom** the files an episode reads closely: `atlas_extract.py fn --root <repo> --file <path> --name <fn>` prints the lines; write `src: /*SRC <path> a-b*/ []` and run `atlas_extract.py fill --root <repo> --data site/web/js/atlas.data.js` (re-run after any repo update). Segment by "one job each", list the shared fields each segment writes/reads, and tag each call line in `at`.
7. **Check**: `node <skill>/scripts/atlas_check.mjs --data site/web/js/atlas.data.js --repo <repo>` until it prints `atlas ok`. It verifies English, paths, every `name()`, route code order, zoom source and call tags, ids. Then open `atlas.html` in the real site in both languages and at phone width.

Per episode afterwards: add its `eps` lighting to the blocks it touched, its routes and questions under `eps[n]`, zoom for the files it reads closely, `map: {questions, desc, time}` and `'map'` in its steps in `course.js` (+ English), run the checker.

## Look
Deliberately not Bento: an engineering atlas — a drafting sheet (cool paper, faint grid) in light mode, a blueprint in dark. Serif display (Noto Serif SC) for titles and layer numbers, Noto Sans SC for text, JetBrains Mono for code and file names. One accent, signal amber, only for "now": the current step, newly lit blocks, writers, the active answer. Unvisited code is hatched like unsurveyed land. Layer colours are categorical and come from the data (`color: [light, dark]`); keep English layer roles short so they fit the label column.
