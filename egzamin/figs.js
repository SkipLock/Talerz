/* Faza: rysunki do pytań, rysowane w SVG.
   Figs.render('typ:argumenty') zwraca gotowy kod SVG (albo HTML dla tabel).
   Kolory biorą się z currentColor, więc rysunki działają w trybie jasnym i ciemnym. */
(function (g) {
  'use strict';

  const r1 = v => Math.round(v * 10) / 10;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const at = a => (a ? ' ' + a : '');
  const svg = (w, h, body, cls) =>
    `<svg class="fg${cls ? ' ' + cls : ''}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`;
  const ln = (x1, y1, x2, y2, a) => `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}"${at(a)}/>`;
  const rc = (x, y, w, h, a) => `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}"${at(a)}/>`;
  const ci = (x, y, r, a) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}"${at(a)}/>`;
  const pa = (d, a) => `<path d="${d}"${at(a)}/>`;
  const pl = (pts, a) => `<polyline points="${pts}"${at(a)}/>`;
  const pg = (pts, a) => `<polygon points="${pts}"${at(a)}/>`;
  const tx = (x, y, s, a) => `<text x="${r1(x)}" y="${r1(y)}"${at(a)}>${esc(s)}</text>`;
  const dot = (x, y, r) => ci(x, y, r || 3.2, 'class="f"');
  const node = (x, y) => ci(x, y, 3.6, 'class="k"');
  const head = (x, y, ang, s) => {
    s = s || 8;
    const a1 = ang + Math.PI - 0.42, a2 = ang + Math.PI + 0.42;
    return pg(`${r1(x)},${r1(y)} ${r1(x + s * Math.cos(a1))},${r1(y + s * Math.sin(a1))} ${r1(x + s * Math.cos(a2))},${r1(y + s * Math.sin(a2))}`, 'class="f"');
  };
  const arrow = (x1, y1, x2, y2, s) => ln(x1, y1, x2, y2) + head(x2, y2, Math.atan2(y2 - y1, x2 - x1), s);
  const earth = (x, y) => ln(x - 14, y, x + 14, y, 'class="t"') + ln(x - 9, y + 7, x + 9, y + 7, 'class="t"') + ln(x - 4, y + 14, x + 4, y + 14, 'class="t"');

  /* ---------- Symbole (pole 120 x 80, końcówki na wysokości 40) ---------- */
  const SYM = {
    rezystor: () => ln(8, 40, 35, 40) + rc(35, 31, 50, 18) + ln(85, 40, 112, 40),
    potencjometr: () => SYM.rezystor() + arrow(60, 4, 60, 29),
    rezystor_regulowany: () => SYM.rezystor() + arrow(38, 64, 84, 15),
    termistor: () => SYM.rezystor() + pl('30,62 42,62 82,18') + tx(92, 18, 'ϑ', 'class="c s"'),
    fotorezystor: () => SYM.rezystor() + arrow(42, 4, 52, 24, 7) + arrow(56, 4, 66, 24, 7),
    kondensator: () => ln(8, 40, 55, 40) + ln(55, 20, 55, 60, 'class="t"') + ln(65, 20, 65, 60, 'class="t"') + ln(65, 40, 112, 40),
    kondensator_elektrolityczny: () =>
      ln(8, 40, 52, 40) + rc(52, 20, 6, 40) + rc(64, 20, 6, 40, 'class="f"') + ln(70, 40, 112, 40) + tx(42, 22, '+', 'class="c"'),
    cewka: () => ln(8, 40, 24, 40) + pa('M24 40 a9 9 0 0 1 18 0 a9 9 0 0 1 18 0 a9 9 0 0 1 18 0 a9 9 0 0 1 18 0') + ln(96, 40, 112, 40),
    cewka_rdzen: () => SYM.cewka() + ln(24, 22, 96, 22, 'class="t"'),
    dioda: () => ln(8, 40, 48, 40) + pg('48,26 48,54 72,40', 'class="f"') + ln(72, 26, 72, 54, 'class="t"') + ln(72, 40, 112, 40),
    dioda_zenera: () => ln(8, 40, 48, 40) + pg('48,26 48,54 72,40', 'class="f"') + pl('65,21 72,26 72,54 79,59', 'class="t"') + ln(72, 40, 112, 40),
    led: () => SYM.dioda() + arrow(58, 24, 70, 10, 7) + arrow(67, 29, 79, 15, 7),
    fotodioda: () => SYM.dioda() + arrow(70, 8, 59, 22, 7) + arrow(80, 13, 69, 27, 7),
    tyrystor: () => SYM.dioda() + ln(72, 50, 86, 66),
    triak: () =>
      ln(8, 40, 46, 40) + ln(46, 20, 46, 60, 'class="t"') + ln(74, 20, 74, 60, 'class="t"') + ln(74, 40, 112, 40) +
      pg('46,23 46,39 74,31', 'class="f"') + pg('74,41 74,57 46,49', 'class="f"') + ln(74, 58, 88, 72),
    diak: () =>
      ln(8, 40, 46, 40) + ln(46, 20, 46, 60, 'class="t"') + ln(74, 20, 74, 60, 'class="t"') + ln(74, 40, 112, 40) +
      pg('46,23 46,39 74,31', 'class="f"') + pg('74,41 74,57 46,49', 'class="f"'),
    tranzystor_npn: () =>
      ci(62, 40, 26) + ln(8, 40, 52, 40) + ln(52, 25, 52, 55, 'class="t"') + pl('52,33 72,21 72,4') + pl('52,47 72,59 72,76') +
      head(70, 57.8, Math.atan2(12, 20), 9),
    tranzystor_pnp: () =>
      ci(62, 40, 26) + ln(8, 40, 52, 40) + ln(52, 25, 52, 55, 'class="t"') + pl('52,33 72,21 72,4') + pl('52,47 72,59 72,76') +
      head(54.5, 48.5, Math.atan2(-12, -20), 9),
    zarowka: () => ln(8, 40, 44, 40) + ci(60, 40, 16) + ln(48.7, 28.7, 71.3, 51.3) + ln(48.7, 51.3, 71.3, 28.7) + ln(76, 40, 112, 40),
    silnik: () => ci(60, 40, 25) + tx(60, 35, 'M', 'class="c l"') + tx(60, 55, '3~', 'class="c s"'),
    silnik_1f: () => ci(60, 40, 25) + tx(60, 35, 'M', 'class="c l"') + tx(60, 55, '1~', 'class="c s"'),
    silnik_dc: () => ci(60, 40, 25) + tx(60, 36, 'M', 'class="c l"') + ln(51, 53, 69, 53) + ln(51, 57, 54, 57) + ln(58, 57, 62, 57) + ln(66, 57, 69, 57),
    pradnica: () => ci(60, 40, 25) + tx(60, 35, 'G', 'class="c l"') + tx(60, 55, '3~', 'class="c s"'),
    transformator: () => ln(8, 40, 32, 40) + ci(48, 40, 17) + ci(72, 40, 17) + ln(89, 40, 112, 40),
    uziemienie: () => ln(60, 6, 60, 42) + earth(60, 42),
    uziemienie_ochronne: () => ci(60, 44, 25) + ln(60, 6, 60, 38) + ln(48, 38, 72, 38, 'class="t"') + ln(52, 46, 68, 46, 'class="t"') + ln(56, 54, 64, 54, 'class="t"'),
    bezpiecznik: () => ln(8, 40, 112, 40) + rc(35, 32, 50, 16),
    woltomierz: () => ln(8, 40, 40, 40) + ci(60, 40, 20) + tx(60, 41, 'V', 'class="c l"') + ln(80, 40, 112, 40),
    amperomierz: () => ln(8, 40, 40, 40) + ci(60, 40, 20) + tx(60, 41, 'A', 'class="c l"') + ln(80, 40, 112, 40),
    watomierz: () => ln(8, 40, 40, 40) + ci(60, 40, 20) + tx(60, 41, 'W', 'class="c l"') + ln(80, 40, 112, 40),
    omomierz: () => ln(8, 40, 40, 40) + ci(60, 40, 20) + tx(60, 41, 'Ω', 'class="c l"') + ln(80, 40, 112, 40),
    licznik: () => ln(8, 40, 30, 40) + rc(30, 20, 60, 40) + tx(60, 41, 'kWh', 'class="c"') + ln(90, 40, 112, 40),
    bateria: () => ln(8, 40, 54, 40) + ln(54, 20, 54, 60) + ln(66, 30, 66, 50, 'class="t"') + ln(66, 40, 112, 40) + tx(44, 20, '+', 'class="c"'),
    styk_zwierny: () => ln(8, 48, 42, 48) + ln(42, 48, 76, 28) + ln(72, 48, 112, 48),
    styk_rozwierny: () => ln(8, 48, 42, 48) + ln(72, 48, 112, 48) + ln(72, 48, 72, 28) + ln(42, 48, 80, 24),
    przycisk_zwierny: () => SYM.styk_zwierny() + ln(59, 38, 59, 12, 'class="d"') + pl('50,18 50,12 68,12 68,18'),
    przycisk_rozwierny: () => SYM.styk_rozwierny() + ln(61, 36, 61, 12, 'class="d"') + pl('52,18 52,12 70,12 70,18'),
    cewka_stycznika: () => ln(60, 4, 60, 25) + rc(40, 25, 40, 30) + ln(60, 55, 60, 76) + tx(70, 16, 'A1', 'class="s"') + tx(70, 70, 'A2', 'class="s"'),
    przekaznik_termiczny: () => ln(60, 4, 60, 24) + rc(40, 24, 40, 32) + pl('46,47 54,47 54,33 66,33 66,47 74,47') + ln(60, 56, 60, 76),
    sygnalizator: () => ln(8, 40, 44, 40) + ci(60, 40, 16) + ln(48.7, 28.7, 71.3, 51.3) + ln(48.7, 51.3, 71.3, 28.7) + ln(76, 40, 112, 40) + tx(60, 70, 'H', 'class="c s"'),
    klasa2: () => rc(36, 16, 48, 48) + rc(48, 28, 24, 24),
    klasa3: () => pg('60,10 92,40 60,70 28,40') + tx(60, 41, 'III', 'class="c"'),
    izolowane1000: () => pg('16,60 37,22 58,60') + pg('58,60 79,22 100,60') + tx(58, 72, '1000 V', 'class="c s"'),
    uwaga_napiecie: () =>
      pa('M60 6 L112 72 H8 Z', 'fill="#FFCD00" stroke="#1A1A1A" stroke-width="4"') +
      pg('62,26 48,50 59,50 52,68 72,44 62,44 68,26', 'fill="#1A1A1A" stroke="none"'),
  };

  function sym(name) {
    const f = SYM[name];
    if (!f) throw new Error('nieznany symbol: ' + name);
    return svg(120, 80, f(), 'sym');
  }

  /* ---------- Bramki logiczne (norma IEC, prostokąty) ---------- */
  function gate(kind) {
    const map = { and: '&', nand: '&', or: '≥1', nor: '≥1', xor: '=1', not: '1', bufor: '1' };
    if (!(kind in map)) throw new Error('nieznana bramka: ' + kind);
    const neg = kind === 'nand' || kind === 'nor' || kind === 'not';
    const one = kind === 'not' || kind === 'bufor';
    let b = rc(40, 10, 46, 60) + tx(63, 30, map[kind], 'class="c"');
    b += one ? ln(8, 40, 40, 40) : ln(8, 26, 40, 26) + ln(8, 54, 40, 54);
    b += neg ? ci(91, 40, 5) + ln(96, 40, 122, 40) : ln(86, 40, 122, 40);
    return svg(130, 80, b, 'sym');
  }

  /* ---------- Układy rezystorów między zaciskami A i B ---------- */
  const res = (cx, y, lab, below) => rc(cx - 23, y - 8, 46, 16) + (lab ? tx(cx, below ? y + 25 : y - 15, lab, 'class="c s"') : '');
  const resV = (x, cy, lab) => rc(x - 8, cy - 23, 16, 46) + (lab ? tx(x + 14, cy, lab, 'class="s" dominant-baseline="central"') : '');
  const term = (x, y, lab) => node(x, y) + tx(x, y - 13, lab, 'class="c s"');

  function net(args) {
    const kind = args[0], L = args.slice(1);
    let b = '', W = 320, H;
    if (kind === 'ser') {
      const n = L.length, y = 50;
      const xs = L.map((_, i) => (n === 1 ? 160 : 70 + i * (180 / (n - 1))));
      b += term(16, y, 'A') + term(304, y, 'B');
      let x0 = 20;
      xs.forEach((cx, i) => { b += ln(x0, y, cx - 23, y) + res(cx, y, L[i], n > 3 && i % 2 === 1); x0 = cx + 23; });
      b += ln(x0, y, 300, y);
      H = 90;
    } else if (kind === 'par') {
      const n = L.length, sp = 48, y0 = 36, mid = y0 + (n - 1) * sp / 2;
      b += term(16, mid, 'A') + term(304, mid, 'B') + ln(20, mid, 90, mid) + ln(230, mid, 300, mid);
      b += ln(90, y0, 90, y0 + (n - 1) * sp) + ln(230, y0, 230, y0 + (n - 1) * sp);
      L.forEach((lab, i) => { const y = y0 + i * sp; b += ln(90, y, 137, y) + res(160, y, lab) + ln(183, y, 230, y); });
      b += dot(90, mid) + dot(230, mid);
      H = y0 + (n - 1) * sp + 26;
    } else if (kind === 'sp') {            // R1 szeregowo z (R2 || R3)
      const mid = 70;
      b += term(16, mid, 'A') + term(304, mid, 'B') + ln(20, mid, 57, mid) + res(80, mid, L[0]) + ln(103, mid, 140, mid);
      b += ln(140, 40, 140, 100) + ln(270, 40, 270, 100) + dot(140, mid) + dot(270, mid);
      b += ln(140, 40, 182, 40) + res(205, 40, L[1]) + ln(228, 40, 270, 40);
      b += ln(140, 100, 182, 100) + res(205, 100, L[2], true) + ln(228, 100, 270, 100);
      b += ln(270, mid, 300, mid);
      H = 140;
    } else if (kind === 'ps') {            // (R1 + R2) || R3
      const mid = 70;
      b += term(16, mid, 'A') + term(304, mid, 'B') + ln(20, mid, 50, mid) + ln(270, mid, 300, mid);
      b += ln(50, 38, 50, 102) + ln(270, 38, 270, 102) + dot(50, mid) + dot(270, mid);
      b += ln(50, 38, 87, 38) + res(110, 38, L[0]) + ln(133, 38, 187, 38) + res(210, 38, L[1]) + ln(233, 38, 270, 38);
      b += ln(50, 102, 137, 102) + res(160, 102, L[2], true) + ln(183, 102, 270, 102);
      H = 142;
    } else if (kind === 'pp') {            // (R1 || R2) + (R3 || R4)
      const mid = 70;
      b += term(16, mid, 'A') + term(304, mid, 'B') + ln(20, mid, 34, mid) + ln(286, mid, 300, mid);
      b += ln(34, 40, 34, 100) + ln(146, 40, 146, 100) + ln(174, 40, 174, 100) + ln(286, 40, 286, 100) + ln(146, mid, 174, mid);
      b += dot(34, mid) + dot(146, mid) + dot(174, mid) + dot(286, mid);
      b += ln(34, 40, 67, 40) + res(90, 40, L[0]) + ln(113, 40, 146, 40) + ln(34, 100, 67, 100) + res(90, 100, L[1], true) + ln(113, 100, 146, 100);
      b += ln(174, 40, 207, 40) + res(230, 40, L[2]) + ln(253, 40, 286, 40) + ln(174, 100, 207, 100) + res(230, 100, L[3], true) + ln(253, 100, 286, 100);
      H = 140;
    } else if (kind === 'dzielnik') {      // dzielnik napięcia: U na wejściu, U2 na R2
      b += node(30, 24) + node(30, 176) + ln(34, 24, 160, 24) + ln(34, 176, 160, 176);
      b += ln(160, 24, 160, 37) + resV(160, 60, L[0]) + ln(160, 83, 160, 117) + resV(160, 140, L[1]) + ln(160, 163, 160, 176);
      b += dot(160, 100) + ln(160, 100, 270, 100) + ln(160, 176, 270, 176) + node(274, 100) + node(274, 176) + dot(160, 176);
      b += arrow(30, 34, 30, 164) + tx(40, 100, L[2] || 'U', 'class="s" dominant-baseline="central"');
      b += arrow(296, 106, 296, 170) + tx(286, 138, L[3] || 'U₂', 'class="s e" dominant-baseline="central"');
      H = 196;
    } else throw new Error('nieznany układ: ' + kind);
    return svg(W, H, b);
  }

  /* ---------- Obwód zamknięty ze źródłem: loop:U=12 V|R1=4 Ω|A|R2=2 Ω|V@1 ---------- */
  function loop(args) {
    const src = args[0];
    const items = [];
    const meters = [];
    for (const t of args.slice(1)) {
      const m = t.match(/^V@(\d)$/);
      if (m) meters.push({ span: +m[1], end: items.length });
      else items.push(t);
    }
    const hasV = meters.length > 0;
    const yT = hasV ? 96 : 40, yB = yT + 96, xL = 34, xR = 290;
    const n = items.length;
    const step = (xR - xL - 40) / n;
    const cx = items.map((_, i) => xL + 20 + step * (i + 0.5));
    let b = ln(xL, yT, xL, yT + 34) + ln(xL - 16, yT + 34, xL + 16, yT + 34) + ln(xL - 8, yT + 46, xL + 8, yT + 46, 'class="t"') +
      ln(xL, yT + 46, xL, yB) + tx(xL - 22, yT + 30, '+', 'class="c s"') + tx(xL + 22, yT + 44, src, 'class="s"');
    b += ln(xL, yB, xR, yB) + ln(xR, yT, xR, yB);
    let x0 = xL;
    const half = [];
    items.forEach((it, i) => {
      const c = cx[i];
      let w;
      if (it === 'A' || it === 'V' || it === 'W') { w = 18; b += ln(x0, yT, c - w, yT) + ci(c, yT, w) + tx(c, yT + 1, it, 'class="c"'); }
      else if (it === 'L') { w = 15; b += ln(x0, yT, c - w, yT) + ci(c, yT, w) + ln(c - 10.6, yT - 10.6, c + 10.6, yT + 10.6) + ln(c - 10.6, yT + 10.6, c + 10.6, yT - 10.6); }
      else if (it === 'S') { w = 18; b += ln(x0, yT, c - w, yT) + node(c - w, yT) + ln(c - w, yT, c + w - 2, yT - 14) + node(c + w, yT); }
      else if (it === 'F') { w = 22; b += ln(x0, yT, c + w, yT) + rc(c - w, yT - 7, 2 * w, 14); x0 = c + w; half.push([c - w, c + w]); return; }
      else { w = 23; b += ln(x0, yT, c - w, yT) + res(c, yT, it, hasV); }
      half.push([c - w, c + w]);
      x0 = c + w;
    });
    b += ln(x0, yT, xR, yT);
    meters.forEach(m => {
      const a = m.end - m.span, z = m.end - 1;
      const xa = (half[a][0] + (a > 0 ? half[a - 1][1] : xL)) / 2;
      const xz = (half[z][1] + (z < n - 1 ? half[z + 1][0] : xR)) / 2;
      const xm = (xa + xz) / 2, ym = 34;
      b += dot(xa, yT) + dot(xz, yT) + ln(xa, yT, xa, ym) + ln(xz, yT, xz, ym) + ln(xa, ym, xm - 18, ym) + ci(xm, ym, 18) + tx(xm, ym + 1, 'V', 'class="c"') + ln(xm + 18, ym, xz, ym);
    });
    return svg(320, yB + 16, b);
  }

  /* ---------- Tabliczka zaciskowa silnika: box:gw | box:tr | box:U1-V1,... ---------- */
  function box(args) {
    const P = { W2: [80, 44], U2: [160, 44], V2: [240, 44], U1: [80, 112], V1: [160, 112], W1: [240, 112] };
    const named = { gw: 'W2-U2,U2-V2', tr: 'W2-U1,U2-V1,V2-W1', brak: '' };
    const spec = args[0] in named ? named[args[0]] : args[0];
    let b = rc(36, 14, 248, 130, 'rx="10"');
    b += ln(80, 125, 80, 172) + ln(160, 125, 160, 172) + ln(240, 125, 240, 172);
    b += tx(80, 184, 'L1', 'class="c s"') + tx(160, 184, 'L2', 'class="c s"') + tx(240, 184, 'L3', 'class="c s"');
    for (const pair of spec.split(',').filter(Boolean)) {
      const [p, q] = pair.split('-');
      if (!P[p] || !P[q]) throw new Error('zła zworka: ' + pair);
      b += ln(P[p][0], P[p][1], P[q][0], P[q][1], 'class="jb"');
    }
    for (const k in P) b += ci(P[k][0], P[k][1], 15, 'class="k"') + tx(P[k][0], P[k][1] + 1, k, 'class="c s"');
    return svg(320, 194, b);
  }

  /* ---------- Układy sieci: sys:TN-C | TN-S | TN-C-S | TT | IT ---------- */
  function sys(args) {
    const k = args[0];
    if (!['TN-C', 'TN-S', 'TN-C-S', 'TT', 'IT'].includes(k)) throw new Error('nieznany układ sieci: ' + k);
    const yL = [30, 48, 66], yN = 96, yPE = 118;
    let b = '';
    const srcBottom = k === 'IT' ? 76 : 104;
    b += rc(8, 18, 34, srcBottom - 18, 'rx="4"') + tx(25, (18 + srcBottom) / 2, 'Tr', 'class="c s"');
    yL.forEach((y, i) => { b += ln(42, y, 232, y) + tx(64, y - 5, 'L' + (i + 1), 'class="c s"') + dot(232, y); });
    b += rc(232, 20, 70, 56, 'rx="4"') + tx(267, 48, 'odbiornik', 'class="c s"');
    if (k === 'TN-S') {
      b += ln(42, yN, 210, yN) + tx(64, yN - 5, 'N', 'class="c s"');
      b += ln(52, yN, 52, 150) + earth(52, 150) + dot(52, yN) + dot(52, yPE);
      b += ln(52, yPE, 267, yPE) + ln(267, yPE, 267, 76) + tx(84, yPE - 5, 'PE', 'class="c s"');
    } else if (k === 'TN-C') {
      b += ln(42, yN, 267, yN) + ln(267, yN, 267, 76) + tx(70, yN - 5, 'PEN', 'class="c s"');
      b += ln(52, yN, 52, 150) + earth(52, 150) + dot(52, yN);
    } else if (k === 'TN-C-S') {
      b += ln(42, yN, 210, yN) + tx(70, yN - 5, 'PEN', 'class="c s"') + tx(170, yN - 5, 'N', 'class="c s"');
      b += ln(52, yN, 52, 150) + earth(52, 150) + dot(52, yN);
      b += dot(140, yN) + ln(140, yN, 140, yPE) + ln(140, yPE, 267, yPE) + ln(267, yPE, 267, 76) + tx(170, yPE - 5, 'PE', 'class="c s"');
    } else if (k === 'TT') {
      b += ln(42, yN, 210, yN) + tx(64, yN - 5, 'N', 'class="c s"');
      b += ln(52, yN, 52, 150) + earth(52, 150) + dot(52, yN) + tx(78, 156, 'RB', 'class="c s"');
      b += ln(267, 76, 267, 150) + earth(267, 150) + tx(293, 156, 'RA', 'class="c s"');
    } else {
      b += ln(25, 76, 25, 92) + rc(15, 92, 20, 28) + tx(48, 106, 'Z', 'class="c s"') + ln(25, 120, 25, 150) + earth(25, 150);
      b += ln(267, 76, 267, 150) + earth(267, 150);
    }
    return svg(320, 172, b);
  }

  /* ---------- Przebiegi: wave:sin | pol | cala | prost | troj | ui | wygl ---------- */
  function wave(args) {
    const k = args[0];
    const W = 320, H = 150, x0 = 30, x1 = 306, per = 2, n = 240;
    const rect = k === 'pol' || k === 'cala' || k === 'wygl';
    const y0 = rect ? 122 : 75, A = rect ? 86 : 50;
    const X = t => x0 + 6 + t * (x1 - x0 - 16);
    const path = fn => {
      let d = '';
      for (let i = 0; i <= n; i++) { const t = i / n; d += (i ? 'L' : 'M') + r1(X(t)) + ' ' + r1(y0 - A * fn(t * per * 2 * Math.PI)) + ' '; }
      return d;
    };
    let b = arrow(x0, H - 6, x0, 10, 8) + arrow(x0, y0, x1 + 8, y0, 8) + tx(x1 + 4, y0 + 16, 't', 'class="c s"');
    const lab = k === 'ui' ? '' : args[1] || 'u';
    if (lab) b += tx(x0 + 14, 18, lab, 'class="c s"');
    const S = Math.sin;
    if (k === 'sin') b += pa(path(S), 'class="t"');
    else if (k === 'pol') b += pa(path(a => Math.max(0, S(a))), 'class="t"');
    else if (k === 'cala') b += pa(path(a => Math.abs(S(a))), 'class="t"');
    else if (k === 'wygl') {
      // wyprostowanie dwupołówkowe z kondensatorem: napięcie opada między szczytami (tętnienia)
      b += pa(path(a => Math.abs(S(a))), 'class="d"');
      let d = '', cap = 0;
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        cap = Math.max(Math.abs(S(t * per * 2 * Math.PI)), cap - 0.0034);
        d += (i ? 'L' : 'M') + r1(X(t)) + ' ' + r1(y0 - A * cap) + ' ';
      }
      b += pa(d, 'class="t"');
    } else if (k === 'prost') b += pa(path(a => (S(a) >= 0 ? 0.8 : -0.8)), 'class="t"');
    else if (k === 'troj') b += pa(path(a => (2 / Math.PI) * Math.asin(S(a))), 'class="t"');
    else if (k === 'ui') {
      const sh = +(args[1] || 60) * Math.PI / 180;
      b += pa(path(S), 'class="t"') + pa(path(a => 0.6 * S(a - sh)), 'class="d"');
      b += tx(X(0.125) - 6, y0 - A - 8, 'u', 'class="c s"') + tx(X(0.125 + sh / (2 * Math.PI * per)) + 10, y0 - 0.6 * A - 8, 'i', 'class="c s"');
    } else throw new Error('nieznany przebieg: ' + k);
    return svg(W, H, b);
  }

  /* ---------- Skala miernika analogowego: skala:150|84|V  (działki|wskazanie|podpis) ---------- */
  function skala(args) {
    const divs = +args[0], val = +args[1], cap = args[2] || '';
    if (!(divs > 0) || !(val >= 0 && val <= divs)) throw new Error('zła skala');
    const cx = 160, cy = 168, R = 128, a0 = 210, a1 = 330;
    const P = (v, r) => { const a = (a0 + (a1 - a0) * v / divs) * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
    const minor = divs <= 30 ? 1 : divs <= 60 ? 2 : divs <= 150 ? 5 : 10;
    const major = divs <= 30 ? 5 : divs <= 60 ? 10 : divs <= 150 ? (divs % 30 === 0 ? 30 : 25) : 50;
    let b = pa(`M${r1(P(0, R)[0])} ${r1(P(0, R)[1])} A${R} ${R} 0 0 1 ${r1(P(divs, R)[0])} ${r1(P(divs, R)[1])}`);
    for (let v = 0; v <= divs + 1e-9; v += minor) {
      const big = Math.abs(v / major - Math.round(v / major)) < 1e-9;
      const [xa, ya] = P(v, R), [xb, yb] = P(v, big ? R - 16 : R - 8);
      b += ln(xa, ya, xb, yb, big ? 'class="t"' : '');
      if (big) { const [xt, yt] = P(v, R - 30); b += tx(xt, yt, String(v), 'class="c s"'); }
    }
    const [px, py] = P(val, R + 6);
    b += ln(cx, cy, px, py, 'class="needle"') + ci(cx, cy, 6, 'class="f"');
    if (cap) b += tx(12, 172, cap, 'class="s"');
    return svg(320, 180, b);
  }

  /* ---------- Paski rezystora: paski:brazowy,czarny,czerwony,zloty ---------- */
  const BAND = {
    czarny: '#1b1b1b', brazowy: '#7a4a1f', czerwony: '#d42a2a', pomaranczowy: '#f08418', zolty: '#f6d31b', zielony: '#2f9a3a',
    niebieski: '#2364d2', fioletowy: '#8a3fc9', szary: '#8d9196', bialy: '#ffffff', zloty: '#c9a227', srebrny: '#c3c7cc',
  };
  function paski(args) {
    const cols = args[0].split(',');
    if (cols.length < 4 || cols.length > 5 || cols.some(c => !BAND[c])) throw new Error('złe paski: ' + args[0]);
    let b = ln(8, 45, 70, 45) + ln(250, 45, 312, 45) + rc(70, 22, 180, 46, 'rx="18" fill="#e9d6ad"');
    const xs = cols.length === 4 ? [98, 124, 150, 214] : [94, 116, 138, 160, 218];
    cols.forEach((c, i) => { b += rc(xs[i], 22, 12, 46, `fill="${BAND[c]}" stroke="none"`); });
    b += rc(70, 22, 180, 46, 'rx="18"');
    return svg(320, 90, b);
  }

  /* ---------- Wskaźnik wkładki topikowej: wkladka:szary ---------- */
  const FUSE = { rozowy: '#f3a6c8', brazowy: '#7a4a1f', zielony: '#2f9a3a', czerwony: '#d42a2a', szary: '#8d9196', niebieski: '#2364d2', zolty: '#f6d31b', czarny: '#1b1b1b', bialy: '#ffffff', miedziany: '#b8733a', fioletowy: '#8a3fc9' };
  function wkladka(args) {
    const c = FUSE[args[0]];
    if (!c) throw new Error('zły kolor wkładki: ' + args[0]);
    const b = rc(20, 22, 80, 36, 'rx="6" fill="#ece5d5"') + rc(8, 26, 14, 28, 'rx="3"') + ci(110, 40, 9) + ci(106, 40, 9, `fill="${c}"`) + rc(20, 22, 80, 36, 'rx="6"');
    return svg(130, 80, b, 'sym');
  }

  /* ---------- Tabliczka znamionowa: tabl:Tytuł|pole|pole|... ---------- */
  function tabl(args) {
    const title = args[0], cells = args.slice(1);
    const rows = Math.ceil(cells.length / 2), H = 50 + rows * 32 + 12;
    let b = rc(6, 6, 308, H - 12, 'rx="10" class="plate"') + ci(20, 20, 4) + ci(300, 20, 4) + ci(20, H - 20, 4) + ci(300, H - 20, 4);
    b += tx(160, 30, title, 'class="c"') + ln(16, 46, 304, 46);
    cells.forEach((c, i) => {
      const r = Math.floor(i / 2), col = i % 2, y = 46 + r * 32;
      b += tx(col ? 168 : 22, y + 21, c, 'class="s pl"');
      if (col === 0 && cells.length > 1) b += ln(160, y, 160, y + 32, 'class="hair"');
      b += ln(16, y + 32, 304, y + 32, 'class="hair"');
    });
    return svg(320, H, b);
  }

  /* ---------- Schemat drabinkowy PLC: lad:I1 /I2 (Q1);[I3|Q2] (Q2) ---------- */
  function ladParse(s) {
    const toks = s.match(/\[|\]|\||\((?:[SR] )?[^)]+\)|\/?[^\s[\]|()]+/g) || [];
    let i = 0;
    function seq() {
      const items = [];
      while (i < toks.length && toks[i] !== ']' && toks[i] !== '|') {
        const t = toks[i++];
        if (t === '[') {
          const br = [seq()];
          while (toks[i] === '|') { i++; br.push(seq()); }
          if (toks[i] === ']') i++;
          items.push({ k: 'par', b: br });
        } else if (t[0] === '(') {
          const m = t.slice(1, -1).trim().match(/^(?:([SR]) )?(.+)$/);
          items.push({ k: 'coil', f: m[1] || '', n: m[2] });
        } else if (t[0] === '/') items.push({ k: 'nc', n: t.slice(1) });
        else items.push({ k: 'no', n: t });
      }
      return items;
    }
    return seq();
  }
  const U = 56, RH = 50;
  const mItem = it => {
    if (it.k !== 'par') return { w: 1, r: 1 };
    let w = 0, r = 0;
    for (const b of it.b) { const m = mSeq(b); w = Math.max(w, m.w); r += m.r; }
    return { w, r };
  };
  const mSeq = items => { let w = 0, r = 1; for (const it of items) { const m = mItem(it); w += m.w; r = Math.max(r, m.r); } return { w, r }; };
  function ladContact(it, x, y) {
    const m = x + U / 2;
    let o = ln(x, y, m - 7, y) + ln(m + 7, y, x + U, y) + ln(m - 7, y - 12, m - 7, y + 12) + ln(m + 7, y - 12, m + 7, y + 12);
    if (it.k === 'nc') o += ln(m - 12, y + 12, m + 12, y - 12);
    return o + tx(m, y - 20, it.n, 'class="c s"');
  }
  function ladCoil(it, x, y) {
    const m = x + U / 2;
    let o = ln(x, y, m - 12, y) + ln(m + 12, y, x + U, y) + pa(`M${m - 6} ${y - 12} A13 13 0 0 0 ${m - 6} ${y + 12}`) + pa(`M${m + 6} ${y - 12} A13 13 0 0 1 ${m + 6} ${y + 12}`);
    if (it.f) o += tx(m, y + 1, it.f, 'class="c s"');
    return o + tx(m, y - 20, it.n, 'class="c s"');
  }
  function ladSeq(items, x, y, wUnits) {
    let o = '', cx = x;
    for (const it of items) {
      if (it.k === 'par') {
        const m = mItem(it), x2 = cx + m.w * U;
        let yy = y, last = y;
        for (const br of it.b) { o += ladSeq(br, cx, yy, m.w); last = yy; yy += mSeq(br).r * RH; }
        o += ln(cx, y, cx, last) + ln(x2, y, x2, last);
        cx = x2;
      } else if (it.k === 'coil') { o += ladCoil(it, cx, y); cx += U; }
      else { o += ladContact(it, cx, y); cx += U; }
    }
    const xe = x + wUnits * U;
    if (cx < xe) o += ln(cx, y, xe, y);
    return o;
  }
  function lad(args) {
    const rungs = args.join('|').split(';').map(s => s.trim()).filter(Boolean).map(ladParse);
    const xL = 12, xR = 308;
    let y = 40, o = '';
    for (const items of rungs) {
      let coil = null;
      if (items.length && items[items.length - 1].k === 'coil') coil = items.pop();
      const m = mSeq(items);
      if (m.w * U + (coil ? U : 0) > xR - xL) throw new Error('za długi szczebel');
      o += ladSeq(items, xL, y, m.w);
      const xe = xL + m.w * U;
      if (coil) o += ln(xe, y, xR - U, y) + ladCoil(coil, xR - U, y);
      else o += ln(xe, y, xR, y);
      y += m.r * RH + 12;
    }
    const H = y - 6;
    return svg(320, H, ln(xL, 12, xL, H - 8, 'class="t"') + ln(xR, 12, xR, H - 8, 'class="t"') + o);
  }

  /* ---------- Gotowe układy: uklad:nazwa ---------- */
  function vNO(x, y1, y2, push) {
    const a = y1 + 16, b2 = y2 - 16;
    let o = ln(x, y1, x, a) + ln(x, b2, x, y2) + ln(x, b2, x - 15, a + 1);
    if (push) { const ym = (a + b2) / 2; o += ln(x - 8, ym, x - 32, ym, 'class="d"') + pl(`${x - 26},${ym - 8} ${x - 32},${ym - 8} ${x - 32},${ym + 8} ${x - 26},${ym + 8}`); }
    return o;
  }
  function vNC(x, y1, y2, push) {
    const a = y1 + 16, b2 = y2 - 16;
    let o = ln(x, y1, x, a) + ln(x, a, x - 14, a) + ln(x, b2, x, y2) + ln(x, b2, x - 17, a - 3);
    if (push) { const ym = (a + b2) / 2; o += ln(x - 9, ym, x - 34, ym, 'class="d"') + pl(`${x - 28},${ym - 8} ${x - 34},${ym - 8} ${x - 34},${ym + 8} ${x - 28},${ym + 8}`); }
    return o;
  }
  const lbl = (x, y, s) => tx(x, y, s, 'class="s" dominant-baseline="central"');
  const DIODE = (x1, y1, x2, y2) => {
    // dioda wzdłuż odcinka, katoda przy (x2, y2)
    const L = Math.hypot(x2 - x1, y2 - y1), ang = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI, cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
    const h = L / 2;
    return `<g transform="translate(${r1(cx)} ${r1(cy)}) rotate(${r1(ang)})">` + ln(-h, 0, -10, 0) + pg('-10,-11 -10,11 9,0', 'class="f"') + ln(9, -11, 9, 11, 'class="t"') + ln(9, 0, h, 0) + '</g>';
  };

  const UKLAD = {
    podtrzymanie: () => {
      let o = ln(20, 20, 220, 20) + tx(10, 20, 'L', 'class="c s"') + ln(20, 250, 220, 250) + tx(10, 250, 'N', 'class="c s"');
      o += ln(90, 20, 90, 36) + vNC(90, 36, 88, true) + lbl(102, 62, 'S1');
      o += ln(90, 88, 90, 104) + dot(90, 104) + ln(90, 104, 158, 104);
      o += vNO(90, 104, 160, true) + lbl(102, 132, 'S2') + vNO(158, 104, 160, false) + lbl(170, 132, 'K1');
      o += ln(158, 160, 158, 172) + ln(158, 172, 90, 172) + dot(90, 172) + ln(90, 160, 90, 190);
      o += rc(72, 190, 36, 30) + lbl(118, 205, 'K1') + ln(90, 220, 90, 250);
      return svg(240, 266, o);
    },
    graetz: () => {
      let o = DIODE(100, 90, 160, 30) + DIODE(220, 90, 160, 30) + DIODE(160, 150, 100, 90) + DIODE(160, 150, 220, 90);
      o += dot(160, 30) + dot(160, 150) + dot(100, 90) + dot(220, 90);
      o += ln(100, 90, 54, 90) + node(50, 90) + tx(50, 72, '~', 'class="c l"') + ln(220, 90, 246, 90) + node(250, 90) + tx(250, 72, '~', 'class="c l"');
      o += ln(160, 30, 296, 30) + ln(296, 30, 296, 67) + resV(296, 90, 'R') + ln(296, 113, 296, 150) + ln(296, 150, 160, 150);
      o += tx(178, 18, '+', 'class="c"') + tx(178, 166, '−', 'class="c"');
      return svg(330, 176, o);
    },
    jednopolowkowy: () => {
      let o = node(30, 40) + node(30, 140) + tx(14, 90, '~', 'class="c l"');
      o += ln(34, 40, 110, 40) + DIODE(110, 40, 170, 40) + ln(170, 40, 240, 40) + ln(240, 40, 240, 67) + resV(240, 90, 'R') + ln(240, 113, 240, 140) + ln(240, 140, 34, 140);
      return svg(300, 170, o);
    },
    schodowy: () => {
      let o = tx(14, 80, 'L', 'class="c s"') + ln(22, 80, 66, 80) + node(70, 80) + node(110, 56) + node(110, 104) + ln(70, 80, 106, 58);
      o += ln(114, 56, 206, 56) + ln(114, 104, 206, 104) + node(210, 56) + node(210, 104) + node(250, 80) + ln(250, 80, 214, 102);
      o += lbl(78, 116, 'S1') + lbl(232, 116, 'S2');
      o += ln(254, 80, 296, 80) + ln(296, 80, 296, 110) + ci(296, 126, 16) + ln(284.7, 114.7, 307.3, 137.3) + ln(284.7, 137.3, 307.3, 114.7);
      o += ln(296, 142, 296, 178) + ln(296, 178, 22, 178) + tx(14, 178, 'N', 'class="c s"');
      return svg(330, 196, o);
    },
    gwiazda: () => {
      let o = '';
      [24, 44, 64].forEach((y, i) => { o += ln(20, y, 300, y) + tx(8, y, 'L' + (i + 1), 'class="c s"'); });
      [[100, 24], [160, 44], [220, 64]].forEach(([x, y]) => { o += dot(x, y) + ln(x, y, x, 104) + resV(x, 127, '') + ln(x, 150, x, 164); });
      o += ln(100, 164, 220, 164) + dot(160, 164) + tx(240, 126, 'Z', 'class="c s"');
      return svg(320, 180, o);
    },
    trojkat: () => {
      let o = '';
      [24, 44, 64].forEach((y, i) => { o += ln(20, y, 300, y) + tx(8, y, 'L' + (i + 1), 'class="c s"'); });
      const A = [110, 100], B = [210, 100], C = [160, 166];
      const zr = (p, q) => {
        const cx = (p[0] + q[0]) / 2, cy = (p[1] + q[1]) / 2, ang = Math.atan2(q[1] - p[1], q[0] - p[0]) * 180 / Math.PI, h = Math.hypot(q[0] - p[0], q[1] - p[1]) / 2;
        return `<g transform="translate(${r1(cx)} ${r1(cy)}) rotate(${r1(ang)})">` + ln(-h, 0, -20, 0) + rc(-20, -7, 40, 14) + ln(20, 0, h, 0) + '</g>';
      };
      o += zr(A, B) + zr(B, C) + zr(C, A) + dot(...A) + dot(...B) + dot(...C);
      o += dot(110, 24) + ln(110, 24, 110, 100) + dot(210, 44) + ln(210, 44, 210, 100);
      o += dot(262, 64) + ln(262, 64, 262, 182) + ln(262, 182, 160, 182) + ln(160, 182, 160, 166);
      return svg(320, 196, o);
    },
  };
  function uklad(args) {
    const f = UKLAD[args[0]];
    if (!f) throw new Error('nieznany układ: ' + args[0]);
    return f();
  }

  /* ---------- Tabela: tab:Nagłówek;Nagłówek|a;b|c;d ---------- */
  function tab(args) {
    const rows = args.map(r => r.split(';'));
    const head = rows.shift();
    return '<table class="fg-table"><thead><tr>' + head.map(h => `<th>${esc(h)}</th>`).join('') + '</tr></thead><tbody>' +
      rows.map(r => '<tr>' + r.map(c => `<td>${esc(c)}</td>`).join('') + '</tr>').join('') + '</tbody></table>';
  }

  const TYPES = { sym, bramka: a => gate(a[0]), net, loop, box, sys, wave, skala, paski, wkladka, tabl, lad, uklad, tab };

  function render(spec) {
    const i = spec.indexOf(':');
    const type = i < 0 ? spec : spec.slice(0, i);
    const rest = i < 0 ? '' : spec.slice(i + 1);
    const fn = TYPES[type];
    if (!fn) throw new Error('nieznany typ rysunku: ' + type);
    if (type === 'sym') return sym(rest);
    return fn(rest.split('|'));
  }

  function safe(spec) {
    try { return render(spec); }
    catch (e) { if (g.console) console.warn('Rysunek', spec, e.message); return '<div class="fg-missing">Brak rysunku</div>'; }
  }

  const api = { render, safe, symbols: Object.keys(SYM), circuits: Object.keys(UKLAD) };
  g.Figs = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : this);
