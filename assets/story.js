// VirChue Bio home page: "How it works" story animation (canvas, no dependencies).
// Four acts: patient geometry -> blood flows in -> rapid CFD -> FGT Thrombosis Number map.
// Schematic illustration only: geometry, speeds and Θ values are made up for the picture.
(() => {
  'use strict';
  const root = document.querySelector('[data-story]');
  if (!root) return;
  const canvas = root.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const chapterBtns = [...root.querySelectorAll('[data-act]')];
  const cards = [...document.querySelectorAll('[data-act-card]')];
  const numEl = root.querySelector('.st-num'), titleEl = root.querySelector('.st-title'), subEl = root.querySelector('.st-sub');
  const readEl = root.querySelector('.st-read'), liveEl = root.querySelector('.st-live'), toggle = root.querySelector('.st-toggle');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const W = 1000, H = 520;
  const ACTS = [
    { t0: 0, t1: 4, title: 'Patient geometry', sub: 'A branching artery with a narrowing, segmented from a scan' },
    { t0: 4, t1: 9, title: 'Blood flows in', sub: 'Pulsatile inflow · a fast jet through the narrowing · slow recirculation behind it' },
    { t0: 9, t1: 13.5, title: 'Rapid CFD with ForgeFlow', sub: 'The vessel is meshed and the flow solved, with live convergence checks' },
    { t0: 13.5, t1: 21.5, title: 'FGT · Thrombosis Number Θ', sub: 'Flow results → FGT model → Θ mapped over the vessel wall' },
  ];
  const LOOP = ACTS[3].t1;
  const actOf = t => (t < ACTS[1].t0 ? 0 : t < ACTS[2].t0 ? 1 : t < ACTS[3].t0 ? 2 : 3);
  const prog = (t, a) => Math.max(0, Math.min(1, (t - ACTS[a].t0) / (ACTS[a].t1 - ACTS[a].t0)));
  const clamp01 = x => Math.max(0, Math.min(1, x));
  const ease = x => 1 - Math.pow(1 - clamp01(x), 3);
  const smooth = (a, b, x) => { const u = clamp01((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const gauss = (u, c, w) => Math.exp(-(((u - c) / w) ** 2));

  // ---- geometry: centrelines, radii, walls ------------------------------------------
  const bez = (P, t) => { const u = 1 - t; return [u * u * u * P[0][0] + 3 * u * u * t * P[1][0] + 3 * u * t * t * P[2][0] + t * t * t * P[3][0], u * u * u * P[0][1] + 3 * u * u * t * P[1][1] + 3 * u * t * t * P[2][1] + t * t * t * P[3][1]]; };
  function polyline(points) {
    const L = [0];
    for (let i = 1; i < points.length; i++) L.push(L[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
    return { p: points, L, len: L[L.length - 1] };
  }
  function at(pl, s) {
    const { p, L } = pl; s = Math.max(0, Math.min(pl.len, s));
    let lo = 0, hi = L.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (L[m] <= s) lo = m; else hi = m; }
    const a = p[lo], b = p[hi], f = (s - L[lo]) / ((L[hi] - L[lo]) || 1), dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
    return { x: a[0] + dx * f, y: a[1] + dy * f, nx: -dy / d, ny: dx / d, u: (lo + f) / (p.length - 1) };
  }
  const Y0 = 270, R0 = 56, REND = 66, BX = 420, SPLIT = 0.12; // parent half-width grows into the carotid bulb
  const Rp = x => R0 + (REND - R0) * smooth(320, BX, x);
  const parent = polyline(Array.from({ length: 46 }, (_, i) => [-30 + i * 10, Y0]));
  const topY = Y0 - REND, splitY = topY + (1 + SPLIT) / 2 * 2 * REND, botY = Y0 + REND;
  const rI0 = (splitY - topY) / 2, rE0 = (botY - splitY) / 2;
  const ICA = polyline(Array.from({ length: 181 }, (_, i) => bez([[BX, topY + rI0], [540, topY + rI0 - 5], [660, 128], [1030, 106]], i / 180)));
  const ECA = polyline(Array.from({ length: 181 }, (_, i) => bez([[BX, splitY + rE0], [540, splitY + rE0 + 5], [650, 424], [1030, 452]], i / 180)));
  const rI = u => (u < 0.12 ? rI0 + (35 - rI0) * (u / 0.12) : 35 - 4 * (u - 0.12) / 0.88) - 24.5 * gauss(u, 0.3, 0.065) + 3 * gauss(u, 0.44, 0.06);
  const rE = u => (u < 0.12 ? rE0 + (26 - rE0) * (u / 0.12) : 26);
  const branch = [{ pl: ICA, r: rI, q: (1 + SPLIT) / 2 }, { pl: ECA, r: rE, q: (1 - SPLIT) / 2 }];

  // Walls with schematic Θ values (illustration only).
  function side(pl, rad, sign, theta) { return pl.p.map((_, i) => { const a = at(pl, pl.L[i]), r = rad(a.u, a.x); return { x: a.x + sign * a.nx * r, y: a.y + sign * a.ny * r, th: theta(a.u, a.x) }; }); }
  const parentTop = side(parent, (u, x) => Rp(x), -1, (u, x) => 0.3 - 0.16 * smooth(330, 420, x));
  const parentBot = side(parent, (u, x) => Rp(x), 1, () => 0.3);
  const icaOuter = side(ICA, rI, -1, u => 0.34 + 1.35 * gauss(u, 0.31, 0.05) - 0.2 * gauss(u, 0.46, 0.06));
  const icaInner = side(ICA, rI, 1, u => 0.34 + 1.95 * gauss(u, 0.305, 0.045) + 1.05 * gauss(u, 0, 0.035));
  const ecaInner = side(ECA, rE, -1, u => 0.32 + 1.0 * gauss(u, 0, 0.035));
  const ecaOuter = side(ECA, rE, 1, () => 0.36);
  const walls = [parentTop.slice(0, -1).concat(icaOuter), parentBot.slice(0, -1).concat(ecaOuter), icaInner, ecaInner];
  const lumen = new Path2D();
  [walls[0], icaInner.slice().reverse(), ecaInner, walls[1].slice().reverse()].forEach((seg, k) => seg.forEach((p, i) => (k === 0 && i === 0 ? lumen.moveTo(p.x, p.y) : lumen.lineTo(p.x, p.y))));
  lumen.closePath();
  const carina = icaInner[0];
  const sten = { inner: icaInner[Math.round(0.305 * 180)], outer: icaOuter[Math.round(0.31 * 180)] };

  // ---- colours -------------------------------------------------------------------------
  const rampRGB = stops => v => {
    let i = 1; while (i < stops.length - 1 && v > stops[i][0]) i++;
    const [a0, c0] = stops[i - 1], [a1, c1] = stops[i], f = clamp01((v - a0) / (a1 - a0));
    return [c0[0] + (c1[0] - c0[0]) * f, c0[1] + (c1[1] - c0[1]) * f, c0[2] + (c1[2] - c0[2]) * f];
  };
  const css = c => `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`;
  const mix = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  const speedRGB = rampRGB([[0, [52, 104, 196]], [0.33, [60, 199, 179]], [0.66, [255, 214, 138]], [1, [255, 96, 84]]]);
  const bloodRGB = rampRGB([[0, [150, 26, 44]], [0.45, [226, 52, 66]], [1, [255, 168, 150]]]);
  const speedColor = v => css(speedRGB(v));
  const thetaColor = (r => v => css(r(v)))(rampRGB([[0, [31, 111, 120]], [0.6, [60, 199, 179]], [1, [255, 210, 138]], [1.5, [255, 106, 92]], [2.3, [255, 45, 85]]]));

  // ---- blood particles -----------------------------------------------------------------
  const N = 820, LP = parent.len;
  const parts = Array.from({ length: N }, () => ({ br: 0, f: 0, pf: 0, s: 0 }));
  function lateral(p) {
    p.pf = -0.96 + Math.random() * 1.92;
    p.br = p.pf < SPLIT ? 0 : 1;
    p.f = p.br === 0 ? (p.pf + 1) / (1 + SPLIT) * 2 - 1 : (p.pf - SPLIT) / (1 - SPLIT) * 2 - 1;
  }
  function seed(mode) {
    for (const p of parts) { lateral(p); const total = LP + branch[p.br].pl.len; p.s = mode === 'enter' ? -Math.random() * LP * 0.7 : Math.random() * total; }
  }
  function pos(p, s) {
    if (s < LP) { const a = at(parent, s), R = Rp(a.x) * 0.93; return [a.x + a.nx * R * p.pf, a.y + a.ny * R * p.pf]; }
    const b = branch[p.br], a = at(b.pl, s - LP), r = b.r(a.u) * 0.88;
    return [a.x + a.nx * r * p.f, a.y + a.ny * r * p.f];
  }
  function speed(p, s, ubar) {
    if (s < LP) { const a = at(parent, s); return Math.max(0.08 * ubar, 1.5 * ubar * (R0 / Rp(a.x)) * (1 - p.pf * p.pf)) ; }
    const b = branch[p.br], a = at(b.pl, s - LP);
    return Math.max(0.08 * ubar, 1.5 * ubar * b.q * (R0 / b.r(a.u)) * (1 - p.f * p.f));
  }
  const U0 = 150, UMAX = 560;
  const heart = t => { const ph = (t % 0.85) / 0.85; return 0.72 + 0.62 * Math.pow(Math.max(0, Math.sin(Math.PI * Math.min(1, ph / 0.42))), 2); };

  // Recirculation: slow swirls behind the narrowing and in the bulb.
  const vort = [
    { pl: ICA, r: rI, u: 0.42, off: -0.5, rx: 26, ry: 8, n: 18, w: -2.4 },
    { pl: parent, r: (u, x) => Rp(x), s: 392, off: -0.66, rx: 22, ry: 7, n: 12, w: 2.0 },
  ].map(v => {
    const a = v.s != null ? at(v.pl, v.s) : at(v.pl, v.u * v.pl.len), r = v.s != null ? v.r(0, a.x) : v.r(v.u);
    return { ...v, cx: a.x + a.nx * r * v.off, cy: a.y + a.ny * r * v.off, ang: Math.atan2(a.nx, -a.ny), ph: Array.from({ length: v.n }, (_, i) => (i / v.n) * Math.PI * 2 + Math.random() * 0.3) };
  });

  // ---- drawing -------------------------------------------------------------------------
  let S = 1, view = 1;
  const px = n => n / view; // screen pixels -> drawing units
  function resize() {
    const r = canvas.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    if (!r.width) return;
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.width * dpr * H / W);
    view = r.width / W; S = canvas.width / W; draw();
  }
  function strokePath(pts, upto) {
    ctx.beginPath(); let started = false;
    for (const p of pts) { if (p.x > upto) break; started ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); started = true; }
    ctx.stroke();
  }
  function rungs(alpha) {
    ctx.strokeStyle = `rgba(143,227,255,${0.38 * alpha})`; ctx.lineWidth = px(0.8);
    const sets = [[parentTop, parentBot, 3], [icaOuter, icaInner, 8], [ecaInner, ecaOuter, 8]];
    ctx.beginPath();
    for (const [A, B, k] of sets) for (let i = 0; i + k < A.length; i += k) { ctx.moveTo(A[i].x, A[i].y); ctx.lineTo(B[i].x, B[i].y); ctx.lineTo(A[i + k].x, A[i + k].y); }
    ctx.stroke();
  }
  function label(text, x, y, color, align) {
    ctx.font = `500 ${px(11)}px "IBM Plex Mono", ui-monospace, monospace`;
    ctx.textAlign = align || 'left'; ctx.fillStyle = color; ctx.fillText(text, x, y);
  }
  // field = 0: blood cells (red); field = 1: CFD velocity colours.
  function drawParticles(alpha, trailK, field, swirl) {
    const ub = U0 * heart(t);
    ctx.lineCap = 'round'; ctx.globalCompositeOperation = 'lighter';
    for (const p of parts) {
      if (p.s <= 0) continue;
      const v = speed(p, p.s, ub), q = Math.min(1, v / UMAX), a = pos(p, p.s), b = pos(p, Math.max(0, p.s - Math.max(4, v * trailK)));
      ctx.globalAlpha = alpha * (0.55 + 0.45 * q); ctx.lineWidth = px(1.8 + 1.4 * q);
      ctx.strokeStyle = css(field <= 0 ? bloodRGB(q) : field >= 1 ? speedRGB(q) : mix(bloodRGB(q), speedRGB(q), field));
      ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(a[0], a[1]); ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineWidth = px(1.6);
    for (const v of vort) for (const ph of v.ph) {
      const p0 = ph + t * v.w, p1 = p0 - 0.45 * Math.sign(v.w), c = Math.cos(v.ang), s = Math.sin(v.ang);
      const P = q => [v.cx + c * v.rx * Math.cos(q) - s * v.ry * Math.sin(q), v.cy + s * v.rx * Math.cos(q) + c * v.ry * Math.sin(q)];
      const a = P(p0), b = P(p1);
      ctx.globalAlpha = alpha * 0.9 * swirl; if (!swirl) continue; ctx.strokeStyle = css(field <= 0 ? bloodRGB(0.05) : mix(bloodRGB(0.05), speedRGB(0.06), Math.min(1, field)));
      ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(a[0], a[1]); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  function staticStreamlines(alpha) {
    ctx.lineWidth = px(1.4); ctx.globalAlpha = alpha;
    for (let k = 0; k < 22; k++) {
      const p = { pf: -0.92 + (k / 21) * 1.84 }; p.br = p.pf < SPLIT ? 0 : 1;
      p.f = p.br === 0 ? (p.pf + 1) / (1 + SPLIT) * 2 - 1 : (p.pf - SPLIT) / (1 - SPLIT) * 2 - 1;
      const total = LP + branch[p.br].pl.len; let prev = pos(p, 0);
      for (let s = 8; s <= total; s += 8) { const cur = pos(p, s); ctx.strokeStyle = speedColor(Math.min(1, speed(p, s, U0) / UMAX)); ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(cur[0], cur[1]); ctx.stroke(); prev = cur; }
    }
    ctx.globalAlpha = 1;
  }
  function draw() {
    const a = actOf(t), p = prog(t, a);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(S, 0, 0, S, 0, 0);
    const scanX = a === 0 ? -40 + 1100 * ease(p / 0.75) : 2000;

    ctx.save(); ctx.beginPath(); ctx.rect(-50, 0, scanX + 50, H); ctx.clip();
    ctx.fillStyle = a === 3 ? 'rgba(60,199,179,.035)' : 'rgba(60,199,179,.07)'; ctx.fill(lumen);
    const meshA = a === 0 ? 1 : a === 1 ? 1 - smooth(0, 0.25, p) : 0;
    if (meshA > 0) rungs(meshA);
    ctx.restore();

    if (a === 2) {
      const sweep = -20 + 1060 * ease(p / 0.45), fade = 1 - 0.75 * smooth(0.55, 1, p);
      ctx.save(); ctx.clip(lumen); ctx.beginPath(); ctx.rect(-50, 0, sweep + 50, H); ctx.clip();
      ctx.strokeStyle = `rgba(143,227,255,${0.42 * fade})`; ctx.lineWidth = px(0.7); ctx.beginPath();
      for (let x = -30; x <= 1030; x += 13) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
      for (let y = 0; y <= H; y += 13) { ctx.moveTo(-30, y); ctx.lineTo(1030, y); }
      ctx.stroke(); ctx.restore();
      if (p < 0.5) { ctx.strokeStyle = 'rgba(143,227,255,.8)'; ctx.lineWidth = px(1.5); ctx.beginPath(); ctx.moveTo(sweep, 0); ctx.lineTo(sweep, H); ctx.stroke(); }
    }

    if (a >= 1) {
      ctx.save(); ctx.clip(lumen);
      if (reduced) staticStreamlines(a === 3 ? 0.3 : 0.95);
      else drawParticles(a === 3 ? 0.3 + 0.4 * (1 - smooth(0, 0.3, p)) : 1, a === 2 ? 0.2 : a === 1 ? 0.1 : 0.08, a === 1 ? 0 : a === 2 ? smooth(0, 0.3, p) : 1, a === 1 ? smooth(0.4, 0.7, p) : 1);
      ctx.restore();
      const pulse = 0.5 + 0.5 * Math.sin(t * 6);
      ctx.strokeStyle = `rgba(60,199,179,${0.55 + 0.45 * pulse})`; ctx.lineWidth = px(2.2); ctx.lineCap = 'round';
      for (const dy of [-34, 0, 34]) { ctx.beginPath(); ctx.moveTo(-26, Y0 + dy); ctx.lineTo(-6, Y0 + dy); ctx.moveTo(-12, Y0 + dy - 6); ctx.lineTo(-6, Y0 + dy); ctx.lineTo(-12, Y0 + dy + 6); ctx.stroke(); }
    }

    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = a === 3 ? 'rgba(214,226,226,.25)' : 'rgba(214,226,226,.85)'; ctx.lineWidth = px(2);
    for (const w of walls) strokePath(w, scanX);
    ctx.fillStyle = ctx.strokeStyle; ctx.beginPath(); ctx.arc(carina.x, carina.y, px(1.6), 0, Math.PI * 2); if (scanX > carina.x) ctx.fill();

    if (a === 3) {
      const reveal = -30 + 1080 * ease(p / 0.3);
      for (const [wide, alpha] of [[11, 0.18], [4.5, 1]]) {
        ctx.lineWidth = wide; ctx.globalAlpha = alpha;
        for (const w of walls) for (let i = 0; i + 1 < w.length; i++) {
          if (w[i].x > reveal) break;
          ctx.strokeStyle = thetaColor((w[i].th + w[i + 1].th) / 2);
          ctx.beginPath(); ctx.moveTo(w[i].x, w[i].y); ctx.lineTo(w[i + 1].x, w[i + 1].y); ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      const show = smooth(0.3, 0.42, p);
      if (show > 0) {
        const spots = [{ p: sten.inner, big: 1 }, { p: sten.outer, big: 0.8 }, { p: carina, big: 0.75 }];
        for (const s of spots) for (let k = 0; k < 2; k++) {
          const ph = ((t * 0.9 + k * 0.5) % 1), r = (8 + 26 * ph) * s.big;
          ctx.strokeStyle = `rgba(255,90,80,${(1 - ph) * 0.8 * show})`; ctx.lineWidth = px(2);
          ctx.beginPath(); ctx.arc(s.p.x, s.p.y, r, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.globalAlpha = show;
        for (const s of spots) { const g = ctx.createRadialGradient(s.p.x, s.p.y, 0, s.p.x, s.p.y, 16 * s.big); g.addColorStop(0, 'rgba(255,120,100,.95)'); g.addColorStop(1, 'rgba(255,60,70,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(s.p.x, s.p.y, 16 * s.big, 0, Math.PI * 2); ctx.fill(); }
        ctx.strokeStyle = 'rgba(255,179,170,.7)'; ctx.lineWidth = px(1);
        const l1 = [sten.outer.x - 4, sten.outer.y - 52], l2 = [carina.x + 70, carina.y + 4];
        ctx.beginPath(); ctx.moveTo(sten.outer.x, sten.outer.y - 10); ctx.lineTo(l1[0], l1[1] + 8); ctx.moveTo(carina.x + 10, carina.y + 1); ctx.lineTo(l2[0] - 6, l2[1] - 4); ctx.stroke();
        label('Θ > 1 · narrowing', l1[0] - 6, l1[1], '#ffb3aa', 'center');
        label('Θ > 1 · branch tip', l2[0], l2[1], '#ffb3aa');
        ctx.globalAlpha = 1;
      }
      const lg = smooth(0.15, 0.3, p);
      if (lg > 0) {
        ctx.globalAlpha = lg; const x0 = 24, y0 = 470, bw = 230;
        for (let i = 0; i < bw; i++) { ctx.fillStyle = thetaColor((i / bw) * 2.3); ctx.fillRect(x0 + i, y0, 1.2, 8); }
        label('Thrombosis Number Θ', x0, y0 - 12, '#c9d6d6');
        const tick = v => x0 + (v / 2.3) * bw;
        ctx.fillStyle = '#c9d6d6'; ctx.fillRect(tick(1) - 0.75, y0 - 4, 1.5, 16);
        label('0', x0, y0 + 26, '#8ea3a4'); label('1 · reference', tick(1), y0 + 26, '#ffd28a', 'center'); label('2', tick(2), y0 + 26, '#8ea3a4', 'center');
        ctx.globalAlpha = 1;
      }
    }

    if (a === 0 && p < 0.82) {
      const g = ctx.createLinearGradient(scanX - 60, 0, scanX, 0); g.addColorStop(0, 'rgba(143,227,255,0)'); g.addColorStop(1, 'rgba(143,227,255,.22)');
      ctx.fillStyle = g; ctx.fillRect(scanX - 60, 0, 60, H);
      ctx.strokeStyle = 'rgba(160,235,255,.95)'; ctx.lineWidth = px(1.5); ctx.beginPath(); ctx.moveTo(scanX, 0); ctx.lineTo(scanX, H); ctx.stroke();
    }
    if (a <= 1) {
      const al = a === 0 ? smooth(0.55, 0.8, p) : 1;
      if (al > 0) { ctx.globalAlpha = al * 0.9; label('Inlet', 0, topY + 22 - 46, '#8ea3a4'); label('Outlet', 1000, 70, '#8ea3a4', 'right'); label('Outlet', 1000, 500, '#8ea3a4', 'right'); label('Narrowing', sten.outer.x + 18, sten.outer.y - 34, '#8ea3a4'); ctx.globalAlpha = 1; }
    }
  }

  // ---- heads-up text, chapters ---------------------------------------------------------
  let lastAct = -1, lastRead = '';
  function ui() {
    const a = actOf(t), p = prog(t, a);
    if (a !== lastAct) {
      lastAct = a;
      numEl.textContent = '0' + (a + 1); titleEl.textContent = ACTS[a].title; subEl.textContent = ACTS[a].sub;
      root.dataset.act = a;
      chapterBtns.forEach((b, i) => { b.setAttribute('aria-current', i === a ? 'step' : 'false'); b.parentElement.classList.toggle('done', i < a); });
      cards.forEach((c, i) => c.classList.toggle('active', i === a));
      if (liveEl) liveEl.textContent = `Part ${a + 1} of 4: ${ACTS[a].title}. ${ACTS[a].sub}`;
    }
    chapterBtns.forEach((b, i) => b.style.setProperty('--p', i < a ? 1 : i > a ? 0 : p.toFixed(3)));
    let r;
    if (a === 0) r = `vessel.stl · ${Math.round(18240 * ease(p / 0.75)).toLocaleString('en-AU')} triangles`;
    else if (a === 1) r = `inflow · pulsatile · 70 bpm`;
    else if (a === 2) { const q = ease(p / 0.85); r = q >= 0.999 ? 'ForgeFlow · converged ✓' : `ForgeFlow · iteration ${Math.round(1240 * q).toLocaleString('en-AU')} · residual ${Math.pow(10, -1 - 4.2 * q).toExponential(1)}`; }
    else r = p < 0.3 ? 'FGT · mapping Θ over the wall…' : 'FGT · 3 spots above Θ = 1';
    if (r !== lastRead) { readEl.textContent = r; lastRead = r; }
  }

  // ---- playback ------------------------------------------------------------------------
  let t = 0, playing = !reduced, onScreen = true, last = null, raf = 0;
  function stepParticles(dt) {
    const ub = U0 * heart(t);
    for (const p of parts) {
      const total = LP + branch[p.br].pl.len;
      p.s += (p.s < 0 ? 1.5 * ub * (1 - p.pf * p.pf * 0.9) : speed(p, p.s, ub)) * dt;
      if (p.s > total) { lateral(p); p.s = -Math.random() * 30; }
    }
  }
  function frame(now) {
    raf = 0;
    if (!playing || !onScreen) { last = null; return; }
    const dt = last == null ? 0 : Math.min(0.05, (now - last) / 1000); last = now;
    const before = actOf(t);
    t += dt;
    if (t >= LOOP) { t = 0; }
    const after = actOf(t);
    if (after === 1 && before === 0) seed('enter');
    if (after >= 1) stepParticles(dt);
    draw(); ui();
    raf = requestAnimationFrame(frame);
  }
  const run = () => { if (!raf && playing && onScreen) raf = requestAnimationFrame(frame); };
  function jump(a) {
    t = ACTS[a].t0 + (reduced ? (ACTS[a].t1 - ACTS[a].t0) * 0.9 : 0.001);
    seed(a === 1 ? 'enter' : 'flowing'); lastAct = -1; draw(); ui();
  }
  function setPlaying(p) {
    playing = p; root.classList.toggle('paused', !p);
    toggle.setAttribute('aria-pressed', String(!p)); toggle.querySelector('.lbl').textContent = p ? 'Pause' : 'Play';
    run();
  }
  chapterBtns.forEach(b => b.addEventListener('click', () => { jump(+b.dataset.act); if (!reduced) run(); }));
  toggle.addEventListener('click', () => setPlaying(!playing));
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { onScreen = es[0].isIntersecting; run(); }, { threshold: 0.15 }).observe(root);
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas); else window.addEventListener('resize', resize);
  root.__seek = sec => { t = Math.max(0, Math.min(LOOP - 0.01, sec)); seed(actOf(t) >= 1 ? 'flowing' : 'enter'); for (let i = 0; i < 40; i++) stepParticles(0.02); lastAct = -1; draw(); ui(); };
  seed('enter');
  if (reduced) { t = ACTS[3].t0 + 6; setPlaying(false); }
  resize(); ui();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
  run();
})();
