# Course home (dashboard)

`site/web/index.html` + `js/hub.js`, driven entirely by `js/course.js`. Shows: header (course title, a 项目地图 button when `COURSE_META.atlas`, runner status), the current episode (eyebrow, title, description, n/5 progress bar), its steps as Bento tiles (video tile spans two columns with a chapter list beside the player), then the course map (every episode; planned ones dashed and not clickable). `#epNN` in the URL selects an episode; `#epNN@123` also starts its video at 123 s (the 课件's ▶ links).

## course.js
```js
window.COURSE_META = {title, subtitle, mapNote, footer, atlas? /* true = web/atlas.html exists */};
window.EPISODES = [{
  id: 'ep01', n: 1, title, group /* map grouping, e.g. 基础 / Raft */, status: 'ready'|'partial'|'planned',
  desc, steps: ['video','reading','lab','flow','map','dojo','assignment'],   // any subset, in order
  videoTime: '约 6 分钟',
  slides?: true,                                              // 课件 exists: content/<id>/slides.html (+ slides.pdf), a button on the video tile
  reading: {title, url?, urlLabel?, urlNote?, notes?, notesLabel?, links?: [{label, url, note?}], time?, read: [...], ask: [...]},
  lab: {questions: 6, time?, desc},
  flow: {questions: 3, time?, desc},                          // the flowchart page, content/<id>/flow.html
  map: {questions: 4, time?, desc},                           // the project atlas, atlas.html#<id> (references/atlas.md)
  dojo: '<dojo id>', dojoTime?, dojoDesc?, dojoLinks?: [{label, url}],
  assignment: {title, url, urlLabel?, short? /* 'Lab 1', shown in eyebrow and map */, desc?, time?, notes: [...]},
}, …];
```
English lives in `js/course.en.js` (`enOverlay(window.COURSE_META, {...})`, `enOverlay(window.EPISODES, {epNN: {...}})`): write the English for every field you write in Chinese (title, group, desc, videoTime, reading.title/read/ask/time/urlLabel/notesLabel, lab.desc/time, flow.desc/time, map.desc/time, dojoDesc/dojoTime, assignment.title/desc/notes/time/urlLabel). Arrays of strings replace the Chinese; arrays of objects (links, dojoLinks) need index keys `{0: {label}}` so their urls survive.

Add every planned episode early (just id/n/title/group/status:'planned'), with its English title/group in `course.en.js`. Flip to `ready` (or `partial` when only the video exists, steps: ['video']) once its materials are synced.

## Progress (localStorage, per browser)
- `course.progress` = `{epId: {step: true}}` — manual checkboxes; video auto-marks at 90 % watched.
- `course.<epId>.lab.answered` — written by the lab page; done when count ≥ `lab.questions`.
- `course.<epId>.flow.answered` — written by the flowchart page; done when count ≥ `flow.questions`.
- `course.<epId>.map.answered` — written by the project atlas (indices answered correctly); done when count ≥ `map.questions`.
- `dojo.<dojoId>.passed` — written by the dojo; done when count ≥ levels reported by the runner.

## Content
`content/<epId>/video.mp4`, `chapters.json` (`{duration, chapters: [{t, title, title_en}]}`), `lab.html`, `flow.html`, `slides.html` + `slides/` + `slides.pdf` — produced by `dev/sync_content.py`. Missing video shows a friendly "download from Releases" message.
