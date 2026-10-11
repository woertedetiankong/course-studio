# Dojo (练功房)

A dojo = one folder of code the learner fills in, level by level, with real tests in a real toolchain. A course can have several (one per original lab), each in its own language. References: `~/Documents/ChatGPT/MIT/go-dojo` (Go, old runner; dojo `mr`, 7 levels from goroutines to timeouts and atomic writes, with a simulated cluster package for crash/slow workers) and `~/Documents/ChatGPT/pi-durable/site` (TypeScript on a real npm library; dojo `tasks`, crash tests that close and reopen a harness on the same SQLite file).

## Files for dojo `<id>` (lowercase identifier, `[a-z][a-z0-9_]*`)
```
course/dojos/<id>/dojo.json      {"lang": "go" | "typescript" | "python" | "rust", ...driver options}
course/dojos/<id>/starter/       the learner's first files (TODOs). Copied once; never overwrites their work.
course/dojos/<id>/tests/         level tests + test doubles. Rewritten before every run.
course/dojos/<id>/reference/     the solution (spoiler). Only files that differ from starter.
course/dojos/<id>/harness/       optional build files the learner doesn't edit (Rust's Cargo.toml). Rewritten before every run.
course/shared/<lang>/            helpers every dojo of that language uses (fail/say/Trace); copied where its tests can import them
web/js/dojos/<id>.js, <id>.en.js window.COURSE = {id, title, subtitle, fileOrder, finalNote, timelineIntro, levels, common, mode?, renderTimeline?}
dev/mutations.ts                 broken variants of reference/ and which level must catch each
```
Level count = the highest level among the test file names. Workspace = `workspace/` next to the site (gitignored), learner code in `workspace/<id>/` (Rust: `workspace/<id>/src/`).

## Per-language conventions (drivers in `lib/langs/`)

| | Go | TypeScript | Python | Rust |
|---|---|---|---|---|
| learner files | `*.go` (not `_test.go`) | `*.ts` (not `.test.ts` / `.support.ts`) | `*.py` (not `test_*`, `*_support.py`, `conftest.py`) | `src/*.rs` |
| level test file | `dojo_lv<N>_test.go` | `lv<N>.test.ts` | `test_lv<N>.py` | `tests/lv<N>.rs` |
| test names | `TestLv<N>_What` | `Lv<N>_What` | `test_lv<N>_what` | `lv<N>_what` |
| helper | `dojo_helpers_test.go` in tests/ + `shared/go/<pkg>/` imported as `lab/<pkg>` | `import { fail, say, Trace, within, until } from "../shared/dojo.ts"` | `from dojo_support import fail, say, Trace` | `mod dojo; use dojo::{fail, say};` |
| fail | `fail(t, code, say("中 %d", "en %d", n))` | `fail(code, say(\`中 ${n}\`, \`en ${n}\`))` | `fail(code, say(f"中 {n}", f"en {n}"))` | `fail(code, say(&format!(..), &format!(..)))` |
| run | `go test -race -json -run ^TestLv<N>_` | `node --test` + `shared/reporter.ts` | pytest `--junitxml` from `workspace/.venv` | `cargo test --test lv<N>` (target dir `workspace/.target`) |
| runtime codes | `race`, `concurrent_map`, `panic`, `timeout`, `build` | `timeout`, `build`, `crash` | `build`, `crash` | `build` |
| dojo.json options | — | `"packages": {"name": "version"}` npm deps, pinned | `"packages": ["name==version"]` pip deps (pytest always) | — (deps go in `harness/Cargo.toml`) |
| notes | `CGO_ENABLED=1` needed for `-race` (otherwise runs without it) | Node runs `.ts` directly: erasable syntax only (no `enum`, no parameter properties), imports need `.ts`. Test doubles the learner imports go in tests/ as `*.support.ts` | the venv is created on first start; pick it as the editor's interpreter | first build of a dojo takes a while; later runs reuse the target dir |

Every helper's `fail` ends up as a message containing `DOJO_FAIL {"code":…,"msg":…,"msg_en":…}`; the runner core finds it in whatever the toolchain reports and turns it into the test's code and messages. `extra` fields (Go: map, TS: object, Python: kwargs) may carry `{"diff": {"missing": [...], "extra": [...]}}` for output comparisons.

## Runner API (all require header `X-Dojo-Token`, localhost Host, same Origin)
`GET /api/info` → `{runtime, workspace, dojos: {id: levels}, meta: {id: {lang, editor, label, toolchain, missing}}}` · `GET /api/files?dojo=` · `PUT /api/file?dojo=&name=` · `POST /api/run?dojo=` body `{level}` → `{ok, tests: [{name, ok, code, msg, msg_en, detail, diff, output, events, t_end}], build_errors: [{file, line, col, msg}] (the editor marks them), fatal, race, seconds}`. A dojo whose toolchain is missing still loads; the page says what to install, and a run returns a `toolchain` fatal with the same message.

## Writing levels
- Ramp: language warm-ups the lab needs → pure functions of the mechanism → one component → the whole thing under faults. Typically 5–8 levels per dojo.
- Each test gets a Chinese label in `levels[i].tests` (keyed by the test name exactly as the toolchain reports it) and an English one in `<id>.en.js`.
- On failure call the language's `fail(code, say(中文, English))`: the message is shown verbatim in the learner's language and should say what was expected, what happened, and the likely cause, with concrete numbers.
- **Diagnose, don't just compare.** When a result is wrong, pick the code from what is actually wrong (uppercase keys → `case`, punctuation inside words → `punctuation`), not from the test's name; otherwise a mistake caught by an unrelated test gets an unrelated hint. Check size before order (`too_many` before `tie_order`).
- Level entry in `<id>.js`: `{n, short, title, file, concept (HTML), task: [HTML], tests: {TestName: label}, tiers: [3 hints, vague → near-solution], byCode: {code: targeted hint}}`. Every code a test can emit at that level needs a `byCode` entry (or a `common` one, which also covers the runtime codes above). Mirror every level in `<id>.en.js` as `levels: {N: {title, short?, concept, task, tests, tiers, byCode}}` plus `title/subtitle/finalNote/timelineIntro/common`.
- Starter and reference files: put an English comment line under each Chinese one. Only add lines; `dev/mutations.ts` replaces exact text in reference files, so don't reflow code.
- Timeouts and sizes small enough that a level runs in seconds.
- Faults (crash, slow, lost messages, a process dying) come from test doubles the tests control, so tests are deterministic enough to be fair; the learner's concurrency and I/O stay real. Prefer exact faults ("crash the moment the card is charged") for the tests behind targeted hints and random ones only for a final soak test.
- Bound any wait for learner code (`within`/`until` in TypeScript; a timeout channel in Go), so an unfinished earlier level fails fast with a pointer instead of hanging until the runner's timeout.

## Timeline
Tests can record a trace and save it under the test's name; the runner passes the file to the UI. Go: `tr := dojo.NewTrace(); defer tr.Save(t.Name()); tr.Add(lane, "begin"|"end"|"mark", id, label, bad)` or `tr.AddL(lane, kind, id, "请求丢了", "request lost", bad)`. TypeScript: `new Trace()`, `add` / `addL`, `save(name)`. Python: `Trace()`, `add(lane, kind, id, label, bad, label_en=…)`, `save(name)`. Rust: `Trace::new()`, `add(lane, kind, id, label, Some(en), bad)`, `save(name)`. The dojo UI draws lanes with bars (begin→end matched by lane+id; dashed if never ended) and marks (red cross if `bad`), plus an event list. For a richer domain view, define `COURSE.renderTimeline(test, {esc, width})` returning HTML in `<id>.js` (its strings use `L(zh, en)`; read `e.label_en` in English mode).

## Verification (do not skip)
`npm run check -- <id>` (in `site/`): the reference passes every level, the starter passes none, and each mutation in `dev/mutations.ts` fails the expected level with the expected code. Add a mutation for every mistake a hint talks about — that's what proves the hint fires. It caches installs and builds in `dev/.cache/`. Then run a failing and a passing level in the real UI, and introduce a syntax error once to see the editor mark the line.

## Adding a dojo in another language to an existing course
Copy `template/langs/<lang>/shared/` to `site/course/shared/<lang>/` (and, for a first look, its `warmup/` as a starting point), write `course/dojos/<id>/dojo.json` with that `lang`, and restart the runner. The runner prepares that language's workspace on start.

## Adding a language
Work in this skill's `template/`, so every future course gets it.
1. `template/site/lib/langs/<lang>.ts` in this skill: implement `Driver` (see `index.ts`): editor mode (a CodeMirror 5 mode; add its `<script>` to `web/dojo.html`), learner-file and level-file patterns, `toolchain()` with a bilingual install message, `prepare()` (module files, package installs), `copyShared()`, `command()`, and `parse()` that turns the toolchain's report into tests with pass/fail and the failure text (where `DOJO_FAIL` lives), plus build errors with file and line. A JUnit XML report (most test frameworks can write one; see `python.ts`'s `junitCases`) or one JSON line per test (see the TypeScript reporter) is the easiest thing to parse. Register it in `DRIVERS`.
2. `template/langs/<lang>/`: `shared/` with `fail`/`say`/`Trace` that print `DOJO_FAIL {json}`; a two-level `warmup/` (`dojo.json`, `starter/`, `tests/`, `reference/`); `web/warmup.js` + `warmup.en.js`; `mutations.snippet`; `pack.json` (name, install/dojoDesc/workspace text in both languages). The word-frequency warm-up (TypeScript, Python, Rust) is the easiest to port.
3. Scaffold a test course with `new_course.py --lang <lang>` and run `npm run check`: all ✓, including a mutation for every hint. Then check the UI: the editor mode, a failing run, a syntax error marked on the right line, and the page when the toolchain is missing (start the runner with a `PATH` that lacks it).
