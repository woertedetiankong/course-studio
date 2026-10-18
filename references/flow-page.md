# Flowchart page (看流程图)

For learners who can't read code yet: an episode step (`flow`) beside the video and the lab. Agreed with the user on the robot-course (ServoHub) episode 1: the code is there for those who want it, folded away; the diagram and plain words carry the lesson.

Start from `template/episode/flow.html` (copied into every episode by `new_episode.py`). Its sample data is ServoHub episode 1 — `~/Documents/ChatGPT/robot-course/episodes/ep01-big-map/flow.html` is the reference instance.

## Structure (keep the order)
1. **Hero**: eyebrow (course · episode · 流程图), title, a lead saying "no code reading needed; click any box"; the learning path with step 04 `看流程图` highlighted (the path reads 看视频 → 读材料 → 玩实验台 → 看流程图).
2. **Tabs**: one to three diagrams of the *same* program, each a different view. Pick what the episode needs:
   - **structure** (layers / modules — where things live),
   - **timing** (who calls whom, how often — interrupts, tasks, call order),
   - **trip** (one piece of data or one command followed end to end; `steps: true` gives ◀ 上一步 / 下一步 ▶ / 自动播放, a highlight that walks down, a dot moving along the edge, and a dashed feedback edge).
   A one-line note under the tabs says how to read the current diagram.
3. **Canvas + detail panel**: the SVG is drawn from data; clicking a box (or Tab + Enter) fills the panel with: the layer/kind (colored), title, **plain-words explanation**, **where in the source** (file + function), **real code folded in a `<details>` labelled "可跳过"** (a few real lines, never invented), and **▶ 视频 m:ss 讲到这里** linking `video.mp4#t=<seconds>` (take the seconds from the episode's `timeline.json` scene starts). Before a box is chosen, the panel says how to use the page.
4. **想一想**: one question per diagram. Answering marks right/wrong, explains, and offers **在图里看** which switches tab and selects the relevant box.
5. **Footer**: source repo + commit; say the diagrams leave out detail on purpose.

## Adding it to an episode
Add `'flow'` to the episode's `steps` in `course.js` and `flow: {questions, desc, time}` (English in `course.en.js`); `new_course.py` starts episode 1 without it.

## Data
```js
const D = {
  <tab>: {note, vb: [width, height], steps?: true,
    nodes: [{id, x, y, w, h, kind, t, s, plain, file, fn, code?, video, empty?}],   // t/s/plain via L(zh, en)
    edges: [[from, to, 'dash' | 'fb' | undefined]]},
};
```
- `kind` picks the color and the panel label from `KIND` (one entry per layer/category; color is categorical, as in Bento). Redefine `KIND` per course.
- Box sizes: tall boxes (h ≥ 80) get a bigger title. Keep ≤ ~18 boxes per diagram; split into two diagrams rather than shrinking text.
- **Every file path and function name must be checked against the source** (grep it) before it goes in; the code excerpt is copied, not paraphrased.

## Bilingual, progress, checks
Same machinery as the lab page: `EN`/`L()` from the inline head script, `data-en` on static markup, the 中 / EN button. Answered questions go to `localStorage['course.<epId>.flow.answered']`; set `flow.questions` in `course.js` to `QS.length`. On phones the SVG keeps a 720 px minimum inside a horizontally scrolling box (with a "左右滑动" hint); the page itself must not scroll sideways.
Check: each tab, click several boxes, step through the trip and auto-play, answer each question and use 在图里看, dark mode, 390 px — in both languages, no console errors.
