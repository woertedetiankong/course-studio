# Course home (dashboard)

`site/web/index.html` + `js/hub.js`, driven entirely by `js/course.js`. Shows: header (course title, a 项目地图 button when `COURSE_META.atlas`, the 中 / EN switch), the current episode (eyebrow, title, description, a progress bar over its steps), its steps as Bento tiles (video tile spans two columns with a chapter list beside the player), then the course map (every episode; planned ones dashed and not clickable). `#epNN` in the URL selects an episode; `#epNN@123` also starts its video at 123 s (the 课件's ▶ links).

## course.js
```js
window.COURSE_META = {title, subtitle, mapNote, footer, atlas? /* true = web/atlas.html exists */, source? /* {dir}: see "Publishing to an outside site" */};
window.EPISODES = [{
  id: 'ep01', n: 1, title, group /* map grouping, e.g. 基础 / Raft */, status: 'ready'|'partial'|'planned',
  desc, steps: ['video','reading','lab','flow','map','assignment'],   // any subset, in order
  videoTime: '约 6 分钟',
  slides?: true,                                              // 课件 exists: content/<id>/slides.html (+ slides.pdf), a button on the video tile
  reading: {title, url?, urlLabel?, urlNote?, notes?, notesLabel?, links?: [{label, url, note?}], time?, read: [...], ask: [...]},
  lab: {questions: 6, time?, desc},
  flow: {questions: 3, time?, desc},                          // the flowchart page, content/<id>/flow.html
  map: {questions: 4, time?, desc},                           // the project atlas, atlas.html#<id> (references/atlas.md)
  assignment: {title, url, urlLabel?, short? /* 'Lab 1', shown in eyebrow and map */, desc?, time?, notes: [...]},
}, …];
```
English lives in `js/course.en.js` (`enOverlay(window.COURSE_META, {...})`, `enOverlay(window.EPISODES, {epNN: {...}})`): write the English for every field you write in Chinese (title, group, desc, videoTime, reading.title/read/ask/time/urlLabel/notesLabel, lab.desc/time, flow.desc/time, map.desc/time, assignment.title/desc/notes/time/urlLabel). Arrays of strings replace the Chinese; arrays of objects (links) need index keys `{0: {label}}` so their urls survive.

Add every planned episode early (just id/n/title/group/status:'planned'), with its English title/group in `course.en.js`. Flip to `ready` (or `partial` when only the video exists, steps: ['video']) once its materials are synced.

## Progress (localStorage, per browser)
- `course.progress` = `{epId: {step: true}}` — manual checkboxes; video auto-marks at 90 % watched.
- `course.<epId>.lab.answered` — written by the lab page; done when count ≥ `lab.questions`.
- `course.<epId>.flow.answered` — written by the flowchart page; done when count ≥ `flow.questions`.
- `course.<epId>.map.answered` — written by the project atlas (indices answered correctly); done when count ≥ `map.questions`.

## Content
`content/<epId>/video.mp4`, `chapters.json` (`{duration, chapters: [{t, title, title_en}]}`), `lab.html`, `flow.html`, `slides.html` + `slides/` + `slides.pdf` — produced by `dev/sync_content.py`. Missing video shows a friendly "download from Releases" message.

## Publishing to an outside site

A course can also be published on a separate site that reads this repo instead of serving `site/` (the user's buildautonomy.dev does, with `pnpm course:sync <course id> <path to this repo>`). Such a site reads only these files, so keep them in this shape in every course:

| File | What the site takes from it |
|---|---|
| `site/web/js/course.js` + `course.en.js` | `COURSE_META.title`, `.subtitle`, `.source`; every episode's `id`, `n`, `part`, `group`, `title`, `desc`, and their English |
| `site/content/<id>/video.mp4` + `chapters.json` | written by `dev/sync_content.py`; an episode counts as released when both exist, and its duration and chapters come from `chapters.json` |
| `site/content/<id>/slides.pdf` | the 课件 as a PDF (the site has no use for `slides.html`) |
| `episodes/<id>-<slug>/slides.json` | written by `slides.mjs`: the code index (`code`, from `codeShown`) and the practice questions (`practice`, from `practice.json`) |

- `COURSE_META.source = {dir}` names the checkout of the codebase the course reads (e.g. `{dir: 'servohub'}`, a submodule pinned at one commit). The site links each code-index entry to that repo's GitHub page at the checked-out commit (remote `upstream` if there is one, else `origin`). Files outside it, such as the course's own benches or patched copies (`(PATCHED copy)` in the file name), are listed without a link. Leave `source` out when the course has no source repo; the code index is then listed without links.
- Episode ids are the site's keys (for progress, access and media paths): keep them stable once published, and keep each episode folder named `<id>-<slug>`.
- Labs, flowcharts and the project atlas are not read; they stay on the course's own `site/`.
- Adding a new course to such a site also needs that site's own settings (its track, which episodes are free, who it is for); those are decided there, not here.

