/* =========================================================
   EPISODE __EP_N__ · __EP_TITLE__ — scenes (paper style: references/video-paper.md)
   SCN[id] = (lt, b, d): lt = seconds into the scene, b[i] = start of line i, d = scene length.
   cue(i, '词') = when line i reaches that word (by character position, so it follows the real voice);
   lineEnd(i) = when line i's speech stops. Pure functions of time: no state, no Date.now().
   Canvas 1920×1080: header above y 150, subtitles below y 860.
   Facts: name the post and the sections / figures every number comes from.
   ========================================================= */
const EPISODE = {n:'__EP_N__', zh:'__EP_TITLE__'};
const NOHEADER = ['open'];                                  // drawn without the chapter header
const CORNER = {claim:{lit:[1], label:'第 2 块'}, result:{lit:[1], label:'第 2 块'}};
const SCN = {};

/* ---- the shared picture ----
   One picture the whole series returns to, full size when an episode opens and as a corner copy afterwards with the
   episode's part lit. When several episodes share it, move steps() and drawCorner() to <course-root>/shared/<name>.part.js
   (build.py includes it before scenes.js) and delete them here. */
const PARTS = [{zh:'第 1 块', en:'part one', c:C.slate}, {zh:'第 2 块', en:'part two', c:C.coral}, {zh:'第 3 块', en:'part three', c:C.teal}];
function steps(cx, cy, s, o = {}){                         // three boxes joined by arrows; o.lit[i] 0..1, o.appear[i] 0..1
  const w = 300*s, h = 150*s, gap = 90*s, x0 = cx - (3*w + 2*gap)/2;
  PARTS.forEach((p, i) => {
    const ap = o.appear ? o.appear[i] : 1, lit = o.lit ? o.lit[i] : 0, x = x0 + i*(w + gap); if (ap <= 0) return;
    ctx.save(); ctx.globalAlpha *= eo(ap) * (o.alpha ?? 1);
    rr(x, cy - h/2, w, h, 10*s); ctx.fillStyle = mixHex(C.card, p.c, (o.fillK ?? .14)*lit); ctx.fill();
    ctx.lineWidth = lerp(1.5, 3.5, lit)*Math.max(s, .5); ctx.strokeStyle = mixHex(C.rule, p.c, lit); ctx.stroke();
    if (o.labels){ text(p.zh, x + w/2, cy - 10*s, {size:44*s, font:F.zhSerif, weight:900, color:mixHex(C.mute, C.ink, lit)});
      text(p.en, x + w/2, cy + 36*s, {size:24*s, font:F.serif, italic:true, color:C.mute}); }
    if (i < 2) arrowLine({x:x + w + 10*s, y:cy}, {x:x + w + gap - 10*s, y:cy}, 1, C.ink2, {lw:3*s, head:14*s});
    ctx.restore();
  });
}
function drawCorner(cfg, a){                                // called by tail.html in the scenes listed in CORNER
  steps(1735, 112, .17, {lit:[0, 1, 2].map(i => (cfg.lit || []).includes(i) ? 1 : 0), alpha:a, fillK:.85});
  const f = (cfg.lit || [])[0];
  text(cfg.label || '', 1630, 112, {size:20, font:F.sans, weight:500, color:f !== undefined ? PARTS[f].c : C.ink2, align:'right', alpha:a});
}

/* ---------------- open ---------------- */
SCN.open = (lt, b, d) => {
  const ta = eo(ramp(lt, .2, 1));
  text(`第 ${EPISODE.n} 集`, 160, 250, {size:26, font:F.monoZh, weight:600, color:C.coral, align:'left', alpha:ta, ls:1});
  text(EPISODE.zh, 160, 340, {size:88, font:F.zhSerif, weight:900, align:'left', alpha:ta});
  const appear = [0, 1, 2].map(i => ramp(lt, .6 + i*.25, 1.2 + i*.25));
  const lit = [0, 1, 2].map(i => i === 1 ? eo(ramp(lt, cue(1, '这一集'), cue(1, '这一集') + .6)) : 0);
  steps(960, 620, 1, {appear, lit, labels:true});
};

/* ---------------- claim ---------------- */
SCN.claim = (lt, b, d) => {
  const ca = eo(ramp(lt, b[0], b[0] + .6));
  card(160, 220, 1000, 420, {alpha:ca});
  text('原文的观点', 210, 280, {size:24, font:F.sans, weight:700, color:C.coral, align:'left', alpha:ca});
  const o = {size:56, font:F.zhSerif, weight:900, align:'left'};
  markText('关键的那个词', 210, 400, o, ramp(lt, cue(0, '观点'), cue(0, '观点') + .8));   // highlighter first, then the text
  text('关键的那个词', 210, 400, {...o, alpha:ca});
  text('the key phrase, in plain words', 210, 470, {size:28, font:F.serif, italic:true, color:C.mute, align:'left', alpha:ca});
  const nk = ramp(lt, cue(1, '证据'), cue(1, '证据') + .6);
  noteCard(1260, 300, 460, 220, {alpha:eo(nk), tilt:1.5, scale:lerp(.8, 1, eback(nk)), color:C.teal,
    lines:[{s:'依据', size:30, font:F.zhSerif, weight:900, dy:8}, {s:'图 N · §小节', size:20, color:C.mute, dy:8}], bars:3, barY:120});
};

/* ---------------- result ---------------- */
const DATA = [['A', .31], ['B', .62]];                      // placeholder numbers: replace with the post's
SCN.result = (lt, b, d) => {
  guessCard(460, 300, 1000, ['A 和 B，哪个分数更高？'], eo(ramp(lt, b[0] + .1, b[0] + .7)) * (1 - ramp(lt, b[1] - .2, b[1] + .1)));
  if (lt < b[1]) return;                                    // the answer starts only after the card is gone
  const k = DATA.map((_, g) => ramp(lt, b[1] + .2 + g*.3, b[1] + 1.4 + g*.3));
  bars(560, 250, 800, 470, DATA.map(([n, v]) => ({name:n, v:[v]})), [{name:'分数', color:C.coral}], {k});
  text('据原文图 N 重画', 1360, 790, {size:18, font:F.sans, color:C.mute, align:'right', alpha:k[1]});
};

// filled by build.py with every Chinese character the page uses (so the font subsets load them)
const EXTRA_ZH = '__AUTO__';
