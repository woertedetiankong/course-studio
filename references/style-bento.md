# Bento minimal (便当盒极简)

The user compared many mockups and chose this for every learning tool. It dislikes plain grey wireframe-looking pages; the life comes from generous tiles, strong type and a little indigo, not decoration.

## Tokens (copy exactly; full block lives in `template/site/web/css/style.css` and `template/episode/lab.html`)

Light: `--bg #F2F2F0` (ground) · `--tile #FFFFFF` · `--soft #F5F5F3` · `--soft-2 #FAFAF9` · `--edge #E4E4E1` · `--edge-2 #D6D6D2` · `--ink #141414` · `--ink-2 #3F3F46` · `--mute #6E6E73` · `--faint #A1A1A6` · `--acc #4F46E5` / `--acc-soft #EEF0FF` · `--ok #16A34A` / `--ok-soft #ECFDF3` · `--bad #DC2626` / `--bad-soft #FEF2F2` · `--warn #B45309` / `--warn-soft #FEF3C7` · categorical `--l0..--l3` (#4F46E5 #D97706 #059669 #DB2777, e.g. partitions/tasks).
Dark (`prefers-color-scheme` unless `data-theme="light"`, and `[data-theme="dark"]`): bg #0B0B0C, tile #161618, acc #8B85FF, ok #4ADE80, bad #F87171, warn #FBBF24. Always ship both blocks.

Fonts: `Geist` (UI), `Geist Mono` (numbers, ids, eyebrows, code), `Noto Sans SC` (Chinese fallback), from Google Fonts:
`family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&family=Noto+Sans+SC:wght@400;500;700`

## Components
- **Tile**: `background:var(--tile); border:1px solid var(--edge); border-radius:22px; padding:18–28px`. Smaller nested items 14–18px radius on `--soft`/`--soft-2`, no border.
- **Eyebrow**: 13px Geist Mono in `--acc` above a heading (`第 1 集 · 基础`).
- **Headings**: 600 weight, negative letter-spacing (-.02 to -.03em), `text-wrap:balance`. Hero h1 `clamp(36px,5vw,56px)`.
- **Buttons**: primary = ink background, bg-colored text, 12px radius; secondary = `--soft`. No gradients, no shadows beyond a 1px hairline.
- **Status pill**: `--soft` default; `--ok-soft`/`--ok`, `--warn-soft`/`--warn`, `--bad-soft`/`--bad` for state.
- **Current item**: `--acc-soft` fill + `inset 0 0 0 1.5px var(--acc)` ring (current episode in map, current level, in-progress task chip).
- **Hints**: the one warm tile — `--warn-soft` with `--hint-edge`.
- Segmented control (`.seg`), switch (`.switch`), sticky control bar (`.bar`) — see lab skeleton.

- **Language switch** (`.lang`): a small pill with two segments 中 | EN, the active one filled with `--ink`; top-right of every page header (after the runner pill on the home and dojo, in `.hero-top` on lab pages). Every page has one.

## Rules
- Color is reserved for **state** (ok/bad/warn/in-progress) and for categorical data that needs telling apart. Everything else is ink on white on grey.
- Grids of tiles with 12–16px gaps; content max-width ~1240–1320px; 16–20px side gutter; collapse to one column under ~760px with no horizontal scroll.
- Numbers in Geist Mono with `tabular-nums`.
- `:focus-visible` ring in `--acc`; honor `prefers-reduced-motion`.
- Wrap every `localStorage` access in try/catch.
- New kind of tool that seems to need a different look → show the user a mockup in Bento first rather than inventing a new style.
