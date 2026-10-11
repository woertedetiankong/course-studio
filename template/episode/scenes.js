/* =========================================================
   SCENES — one function per scene id in script.json.
   Each gets (lt = seconds since the scene started, b = start time of each beat/line, d = scene duration).
   Time every animation off b[i] so it lands on the line that talks about it: ramp(lt, b[1], b[1]+.6) etc.
   Primitives from head.html: text, rr, glow, dot, packet, burst, cross, check, ringArc, pulse, tag, server,
   3b1b-style: eq (coloured formulas), wipe (Write reveal), brace, arm, arcArrow, springArc, axes, plot, gear, codeBox, label2,
   user, hexagon, nodeCircle, wrapLines; easing: ramp, eo, eio, eback, lerp, knots; colors C.*, fonts F.*.
   Canvas is 1920×1080; keep y > 160 (chapter title) and y < 840 (subtitles).
   ========================================================= */
const SCN = {};

/* ---- 0. Intro ---- */
SCN.intro = (lt, b, d) => {
  const a1 = eo(ramp(lt, .3, 1.3)), a2 = eo(ramp(lt, b[1], b[1]+.8));
  text('EPISODE __EP_NN__', 960, 360, {size:24, font:F.mono, weight:700, color:C.gold, ls:10, alpha:a1});
  text('__EP_TITLE__', 960, 470 + 30*(1-a1), {size:140, font:F.disp, weight:700, alpha:a1, shadow:'rgba(0,0,0,.6)'});
  text('__COURSE_TITLE__', 960, 590, {size:34, color:C.dim, alpha:a2});
};

/* ---- 1. Core idea: three machines, one crashes, work moves ---- */
SCN.core = (lt, b, d) => {
  const xs = [560, 960, 1360], y = 460;
  xs.forEach((x, i) => {
    const a = eo(ramp(lt, .2 + i*.15, .8 + i*.15));
    const dead = i === 2 && lt > b[1] + 1;
    server(x, y, 220, 160, {t:lt, alpha:a, state: dead ? 'dead' : 'ok', label:'node ' + (i+1), seed:i});
  });
  burst(1360, 460, ramp(lt, b[1] + .9, b[1] + 1.6));
  packet({x:1360, y:380}, {x:960, y:380}, ramp(lt, b[2] + .3, b[2] + 1.4), C.gold, {bend:.25, label:'task'});
  if (lt > b[2] + 1.4) check(960, 640, 26, C.mint, eo(ramp(lt, b[2] + 1.4, b[2] + 1.8)));
};

/* ---- 2. Recap ---- */
SCN.recap = (lt, b, d) => {
  ['first idea', 'second idea', 'third idea'].forEach((s, i) => {
    const a = eo(ramp(lt, b[0] + .4 + i*.5, b[0] + 1 + i*.5));
    rr(560, 300 + i*120, 800, 90, 18); ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = C.panel; ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
    text(String(i+1).padStart(2,'0'), 620, 345 + i*120, {size:26, font:F.mono, weight:700, color:C.gold, alpha:a});
    text(s, 690, 345 + i*120, {size:36, align:'left', alpha:a});
  });
};

// filled by build.py with every Chinese character in this file (so the font subset loads them)
const EXTRA_ZH = '__AUTO__';
