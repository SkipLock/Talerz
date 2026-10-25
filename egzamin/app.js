'use strict';
/* Faza: nauka do egzaminu zawodowego ELE.02 i ELE.05.
   Postępy trzymamy w localStorage pod kluczem 'ele.v1':
   p[id] = [podejścia, poprawne, seria poprawnych, minuta ostatniej odpowiedzi, ostatnia poprawna 1/0]. */

const APP_VERSION = '1.0.0';
const KEY = 'ele.v1';
const EXAM_N = 40;
const EXAM_MS = 60 * 60 * 1000;
const PASS = 0.5;
const MASTER = 0.8;
const LET = 'ABCD';
const QUAL_SHORT = { 'ELE.02': 'Montaż i konserwacja', 'ELE.05': 'Eksploatacja' };

const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const txt = s => esc(s).replace(/\n/g, '<br>');

const I = {
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
  set: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/></svg>',
  star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  cross: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>',
  flag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 21V4M6 4h11l-2.5 4L17 12H6"/></svg>',
  grid: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/></svg>',
  book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5.5c3-1.4 6-1.4 9 0v14c-3-1.4-6-1.4-9 0zM21 5.5c-3-1.4-6-1.4-9 0v14c3-1.4 6-1.4 9 0z"/></svg>',
  watch: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 2.5h6M12 2.5v3M12 9.5v4l2.5 1.5"/><circle cx="12" cy="13.5" r="7.5"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z"/></svg>',
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg>',
};

let D = null;          // baza: { v, quals, topics, q }
let QI = {};           // id pytania -> pytanie
let TI = {};           // id działu -> dział
let S = load();        // stan zapisywany
const V = { view: 'home', sheet: null, ses: null, res: null, rf: 'all', rqi: 0, br: null };
let TIMER = null;
let installEvt = null;

/* ---------- Zapis ---------- */
function load() {
  const d = { qual: 'ELE.02', p: {}, fav: [], exams: [], exam: null, set: { len: 20, shuffle: true, vib: true, theme: 'auto' }, seen: null, cnt: null };
  let s = null;
  try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { s = null; }
  if (!s || typeof s !== 'object') return d;
  const out = Object.assign(d, s);
  out.set = Object.assign({ len: 20, shuffle: true, vib: true, theme: 'auto' }, s.set || {});
  if (!out.p || typeof out.p !== 'object') out.p = {};
  if (!Array.isArray(out.fav)) out.fav = [];
  if (!Array.isArray(out.exams)) out.exams = [];
  return out;
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) { toast('Nie udało się zapisać postępów w pamięci telefonu.'); }
}

/* ---------- Pomocnicze ---------- */
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function plural(n, one, few, many) {
  const n10 = n % 10, n100 = n % 100;
  if (n === 1) return one;
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return few;
  return many;
}
const fmtDate = ms => {
  const d = new Date(ms);
  return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }) + ', ' + d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
};
const fmtDur = s => (s >= 60 ? `${Math.floor(s / 60)} min ` : '') + `${s % 60} s`;
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l');

const kOf = q => q.k || TI[q.t].k;
const inK = (q, k) => kOf(q).includes(k);
const bank = k => D.q.filter(q => inK(q, k));
const topicsOf = k => D.topics.filter(t => t.k.includes(k) && D.q.some(q => q.t === t.id && inK(q, k)));
const st = id => { const p = S.p[id]; return !p ? 'new' : p[4] ? 'ok' : 'bad'; };
function stats(qs) {
  let ok = 0, bad = 0;
  qs.forEach(q => { const s = st(q.i); if (s === 'ok') ok++; else if (s === 'bad') bad++; });
  return { n: qs.length, ok, bad, nw: qs.length - ok - bad };
}
function record(id, ok) {
  const p = S.p[id] || [0, 0, 0, 0, 0];
  p[0]++;
  if (ok) { p[1]++; p[2]++; } else p[2] = 0;
  p[3] = Math.floor(Date.now() / 60000);
  p[4] = ok ? 1 : 0;
  S.p[id] = p;
}
function permFor(q, mix) {
  const p = [0, 1, 2, 3];
  return mix && !q.x ? shuffle(p) : p;
}
function vibrate() {
  if (S.set.vib && navigator.vibrate) { try { navigator.vibrate(70); } catch (e) { /* brak wibracji */ } }
}

/* ---------- Historia przeglądarki: przycisk Wstecz zamyka arkusz albo wraca na start ---------- */
let guard = false, ignorePop = 0, syncPending = false;
function syncGuard() {
  const need = V.view !== 'home' || !!V.sheet;
  if (need && !guard) { history.pushState({ g: 1 }, ''); guard = true; }
  else if (!need && guard) { guard = false; ignorePop++; history.back(); }
}
function syncGuardSoon() {
  if (syncPending) return;
  syncPending = true;
  setTimeout(() => { syncPending = false; syncGuard(); }, 0);
}
window.addEventListener('popstate', () => {
  if (ignorePop) { ignorePop--; return; }
  guard = false;
  if (V.sheet) hideSheet();
  else if (V.view === 'exam') openSheet('exam-exit');
  else if (V.view === 'rq') go('review');
  else if (V.view === 'review') go('result');
  else if (V.view !== 'home') go('home');
  syncGuard();
});

/* ---------- Start ---------- */
async function boot() {
  applyTheme();
  try {
    const res = await fetch('data/pytania.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    D = await res.json();
  } catch (e) {
    $('#app').innerHTML = `<div class="err"><h1>Nie udało się wczytać pytań</h1><p>Połącz się z internetem i spróbuj ponownie. Po pierwszym wczytaniu aplikacja działa także bez internetu.</p><button type="button" class="btn btn-primary" data-act="reload">Spróbuj ponownie</button></div>`;
    return;
  }
  index();
  noteBankUpdate();
  if (S.exam && Date.now() >= S.exam.end) { finishExam(true); return; }
  render();
}
function index() {
  QI = {}; TI = {};
  D.topics.forEach(t => { TI[t.id] = t; });
  D.q.forEach(q => { QI[q.i] = q; });
  if (!D.quals.some(k => k.id === S.qual)) S.qual = D.quals[0].id;
  S.fav = S.fav.filter(id => QI[id]);
  if (S.exam && !S.exam.ids.some(id => QI[id])) S.exam = null;
}
function noteBankUpdate() {
  const cnt = {};
  D.quals.forEach(k => { cnt[k.id] = bank(k.id).length; });
  if (S.seen && S.seen !== D.v && S.cnt) {
    const diff = (cnt[S.qual] || 0) - (S.cnt[S.qual] || 0);
    if (diff > 0) setTimeout(() => toast(`Nowe pytania w ${S.qual}: ${diff}`), 700);
  }
  S.seen = D.v; S.cnt = cnt;
  save();
}
function applyTheme() {
  const t = S.set.theme;
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
}

/* ---------- Widoki ---------- */
function render() {
  if (!D) return;
  if (S.exam && Date.now() >= S.exam.end && V.view !== 'result') { finishExam(true); return; }
  const v = V.view;
  const fn = { home: homeHtml, learn: learnHtml, done: doneHtml, exam: examHtml, result: resultHtml, review: reviewHtml, rq: reviewQHtml, browse: browseHtml, history: historyHtml }[v] || homeHtml;
  $('#app').innerHTML = fn();
  if (v === 'exam') tick(); else if (TIMER) { clearInterval(TIMER); TIMER = null; }
  if (v === 'browse') { renderBrowseList(); }
  syncGuardSoon();
}
function go(view) {
  V.view = view;
  render();
  window.scrollTo(0, 0);
}

function homeHtml() {
  const k = S.qual, qs = bank(k), s = stats(qs);
  const pct = s.n ? Math.round(s.ok * 100 / s.n) : 0;
  const qual = D.quals.find(x => x.id === k);
  const favN = S.fav.filter(id => QI[id] && inK(QI[id], k)).length;
  const exams = S.exams.map((e, i) => Object.assign({ idx: i }, e)).filter(e => e.k === k);
  let h = `<header class="hb"><div class="brand"><svg class="logo" viewBox="0 0 48 48" aria-hidden="true"><use href="#logo"/></svg>Faza</div>
    <button type="button" class="ib" data-act="settings" aria-label="Ustawienia">${I.set}</button></header>`;
  h += '<div class="quals" role="tablist" aria-label="Kwalifikacja">' + D.quals.map(x =>
    `<button type="button" role="tab" aria-selected="${x.id === k}" data-act="qual" data-k="${x.id}"><b>${x.id}</b><span>${esc(QUAL_SHORT[x.id] || '')}</span></button>`).join('') + '</div>';
  h += `<p class="qname">${esc(qual.name)}</p>`;
  if (S.exam) {
    const left = Math.max(0, Math.ceil((S.exam.end - Date.now()) / 60000));
    const done = Object.keys(S.exam.ans).length;
    h += `<button type="button" class="resume" data-act="exam-resume"><span><b>Dokończ egzamin ${esc(S.exam.k)}</b><span>${done} z ${S.exam.ids.length} odpowiedzi, zostało ${left} min</span></span>${I.play}</button>`;
  }
  h += `<section class="ready" aria-label="Postęp">
    <div class="ready-num">${pct}<small>%</small></div>
    <div class="ready-txt"><b>${s.ok ? `Umiesz ${s.ok} z ${s.n} ${plural(s.n, 'pytania', 'pytań', 'pytań')}` : `${s.n} ${plural(s.n, 'pytanie', 'pytania', 'pytań')} w bazie ${k}`}</b>
      <span>${s.ok || s.bad ? 'Licząc ostatnią odpowiedź na każde pytanie.' : 'Zacznij od nauki albo od razu sprawdź się w egzaminie próbnym.'}</span></div>
    <div class="bar3" aria-hidden="true"><i class="ok" style="width:${s.n ? s.ok * 100 / s.n : 0}%"></i><i class="bad" style="width:${s.n ? s.bad * 100 / s.n : 0}%"></i></div>
    <div class="legend"><span><i class="ok"></i>umiem ${s.ok}</span><span><i class="bad"></i>do powtórki ${s.bad}</span><span><i class="new"></i>nowe ${s.nw}</span></div>
  </section>`;
  h += `<div class="actions">
    <button type="button" class="act-main act-learn" data-act="learn"><span><b>Ucz się</b><span>${S.set.len} pytań, najpierw błędy i nowe</span></span>${I.book}</button>
    <button type="button" class="act-main act-exam" data-act="${S.exam ? 'exam-resume' : 'exam-start'}"><span><b>${S.exam ? 'Wróć do egzaminu' : 'Egzamin próbny'}</b><span>${EXAM_N} pytań w 60 minut, próg ${Math.round(PASS * 100)}%</span></span>${I.watch}</button>
    <div class="row2">
      <button type="button" class="act-sub${s.bad ? ' has-bad' : ''}" data-act="learn-bad"${s.bad ? '' : ' disabled'}>Powtórz błędy<em>${s.bad}</em></button>
      <button type="button" class="act-sub" data-act="learn-fav"${favN ? '' : ' disabled'}>Zapisane<em>${favN}</em></button>
    </div>
    <button type="button" class="link browse-link" data-act="browse">Przeglądaj wszystkie pytania</button>
  </div>`;
  h += `<section class="sec"><h2>Działy</h2><p class="hint">Bezpiecznik działu się włącza, gdy umiesz ${Math.round(MASTER * 100)}% jego pytań.</p><div class="board">` +
    topicsOf(k).map(t => {
      const ts = stats(qs.filter(q => q.t === t.id));
      const p = ts.n ? Math.round(ts.ok * 100 / ts.n) : 0;
      const on = ts.n && ts.ok / ts.n >= MASTER;
      return `<button type="button" class="mod${on ? ' on' : ''}${ts.bad ? ' has-bad' : ''}" data-act="topic" data-t="${t.id}" aria-label="${esc(t.name)}: umiesz ${p}%"><span class="win"></span><span class="lever"><i></i></span><span class="pct">${p}%</span><span class="lab">${esc(t.short)}</span></button>`;
    }).join('') + '</div></section>';
  h += `<section class="sec"><h2>Egzaminy próbne</h2>`;
  if (exams.length) {
    h += '<ol class="hist-list">' + exams.slice(0, 5).map(examRow).join('') + '</ol>';
    if (exams.length > 5) h += `<button type="button" class="link" data-act="history">Wszystkie egzaminy (${exams.length})</button>`;
  } else h += `<p class="empty-note">Tu zobaczysz wyniki swoich egzaminów próbnych.</p>`;
  h += '</section>';
  h += `<footer class="foot">Pytania są autorskie, ułożone według zakresu kwalifikacji ${D.quals.map(x => x.id).join(' i ')}. To nie są oficjalne pytania CKE.</footer>`;
  return h;
}
function examRow(e) {
  const pass = e.s / e.n >= PASS;
  return `<li><button type="button" data-act="hist-open" data-i="${e.idx}"><span class="d">${esc(fmtDate(e.d))}</span><span class="s">${e.s}/${e.n}</span><span class="verdict-tag ${pass ? 'ok' : 'bad'}">${pass ? 'zdany' : 'niezdany'}</span></button></li>`;
}

/* Rysunek i odpowiedzi */
function figHtml(spec) {
  return spec ? `<figure class="fig">${Figs.safe(spec)}</figure>` : '';
}
function optsHtml(q, perm, m) {
  return `<ol class="opts${q.of ? ' figs' : ''}">` + perm.map((oi, d) => {
    let cls = 'opt', key = LET[d];
    if (m.reveal) {
      if (oi === q.c) { cls += ' ok'; key = I.check; }
      else if (d === m.chosen) { cls += ' bad'; key = I.cross; }
      else cls += ' dim';
    } else if (m.sel === d) cls += ' sel';
    const fig = q.of && q.of[oi] ? `<span class="ofig">${Figs.safe(q.of[oi])}</span>` : '';
    const t = q.o[oi] ? `<span class="ot">${txt(q.o[oi])}</span>` : '';
    return `<li><button type="button" class="${cls}" data-act="${m.act}" data-d="${d}"${m.reveal ? ' disabled' : ''}${m.sel === d ? ' aria-pressed="true"' : ''}><span class="key">${key}</span>${fig}${t}</button></li>`;
  }).join('') + '</ol>';
}
function answerHtml(q, perm, a) {
  const ok = a >= 0 && perm[a] === q.c;
  const cd = perm.indexOf(q.c);
  const head = ok ? `${I.check}Dobrze` : `${I.cross}${a < 0 ? '' : 'Źle. '}Poprawna odpowiedź: ${LET[cd]}`;
  return `<div class="answer ${ok ? 'ok' : 'bad'}" id="answer"><h3>${head}</h3><p>${txt(q.e)}</p></div>`;
}

/* ---------- Nauka ---------- */
function pickMix(pool, len) {
  const bad = [], fresh = [], ok = [];
  pool.forEach(q => { const p = S.p[q.i]; if (!p) fresh.push(q.i); else if (!p[4]) bad.push(q.i); else ok.push(q.i); });
  bad.sort((a, b) => S.p[a][3] - S.p[b][3]);
  ok.sort((a, b) => (S.p[a][2] - S.p[b][2]) || (S.p[a][3] - S.p[b][3]));
  const out = bad.slice(0, Math.min(bad.length, Math.ceil(len * 0.4)));
  out.push(...shuffle(fresh).slice(0, len - out.length));
  if (out.length < len) out.push(...bad.slice(out.length).slice(0, len - out.length));
  if (out.length < len) out.push(...ok.slice(0, len - out.length));
  return shuffle(out);
}
function startLearn(kind, topic, ids) {
  const k = S.qual, len = S.set.len;
  let pool = bank(k);
  if (topic) pool = pool.filter(q => q.t === topic);
  if (!ids) {
    if (kind === 'bad') ids = shuffle(pool.filter(q => st(q.i) === 'bad').map(q => q.i)).slice(0, len);
    else if (kind === 'fav') ids = shuffle(pool.filter(q => S.fav.includes(q.i)).map(q => q.i)).slice(0, len);
    else ids = pickMix(pool, len);
  }
  if (!ids.length) { toast('Brak pytań do takiej serii.'); return; }
  V.ses = { kind, topic, ids, i: 0, perm: {}, ans: {} };
  go('learn');
}
function sesTitle(s) {
  if (s.kind === 'bad') return s.topic ? `Błędy: ${TI[s.topic].short}` : 'Powtórka błędów';
  if (s.kind === 'fav') return 'Zapisane pytania';
  if (s.kind === 'retry') return 'Poprawa błędów';
  return s.topic ? TI[s.topic].name : 'Nauka';
}
function learnHtml() {
  const s = V.ses;
  if (!s) return homeHtml();
  const id = s.ids[s.i], q = QI[id];
  const perm = s.perm[id] || (s.perm[id] = permFor(q, S.set.shuffle));
  const a = s.ans[id];
  const done = a !== undefined;
  const fav = S.fav.includes(id);
  let h = `<header class="qb"><button type="button" class="ib" data-act="home" aria-label="Zakończ naukę">${I.close}</button>
    <div class="qb-mid"><b>${esc(sesTitle(s))}</b><span>Pytanie ${s.i + 1} z ${s.ids.length}</span></div>
    <button type="button" class="ib star" data-act="fav" data-id="${id}" aria-pressed="${fav}" aria-label="${fav ? 'Usuń z zapisanych' : 'Zapisz pytanie'}">${I.star}</button></header>
    <div class="prog"><i style="width:${(s.i + (done ? 1 : 0)) * 100 / s.ids.length}%"></i></div>`;
  h += '<article class="qcard">' + (s.topic ? '' : `<p class="qtopic">${esc(TI[q.t].name)}</p>`) +
    `<h2 class="qtext">${txt(q.q)}</h2>` + figHtml(q.f) +
    optsHtml(q, perm, done ? { reveal: true, chosen: a, act: 'pick' } : { act: 'pick' }) +
    (done ? answerHtml(q, perm, a) : '') + '</article>';
  h += `<div class="dock"><div class="dock-in">` + (done
    ? `<button type="button" class="btn btn-primary grow" data-act="next">${s.i + 1 < s.ids.length ? 'Dalej' : 'Zakończ serię'}</button>`
    : `<button type="button" class="btn btn-ghost grow" data-act="dunno">Nie wiem, pokaż odpowiedź</button>`) + '</div></div>';
  return h;
}
function pickLearn(d) {
  const s = V.ses, id = s.ids[s.i];
  if (s.ans[id] !== undefined) return;
  const q = QI[id], perm = s.perm[id];
  s.ans[id] = d;
  const ok = perm[d] === q.c;
  record(id, ok);
  save();
  if (!ok) vibrate();
  render();
  const el = $('#answer');
  if (el) setTimeout(() => el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' }), 30);
}
function nextLearn() {
  const s = V.ses;
  if (!s || s.ans[s.ids[s.i]] === undefined) return;
  if (s.i + 1 < s.ids.length) { s.i++; render(); window.scrollTo(0, 0); }
  else go('done');
}
function doneHtml() {
  const s = V.ses;
  const ok = s.ids.filter(id => s.ans[id] >= 0 && s.perm[id][s.ans[id]] === QI[id].c);
  const wrong = s.ids.filter(id => !ok.includes(id));
  let h = `<header class="qb"><button type="button" class="ib" data-act="home" aria-label="Strona główna">${I.close}</button><div class="qb-mid"><b>${esc(sesTitle(s))}</b></div></header>`;
  h += `<div class="done"><h1>Koniec serii</h1><div class="big">${ok.length}<small> / ${s.ids.length}</small></div>
    <p class="sub">${ok.length === s.ids.length ? 'Wszystko dobrze.' : `Dobrych odpowiedzi. ${wrong.length} ${plural(wrong.length, 'pytanie trafiło', 'pytania trafiły', 'pytań trafiło')} do powtórki.`}</p>
    <div class="btns">
      <button type="button" class="btn btn-primary" data-act="again">Kolejna seria</button>
      ${wrong.length ? `<button type="button" class="btn btn-ghost" data-act="again-wrong">Popraw błędne z tej serii (${wrong.length})</button>` : ''}
      <button type="button" class="btn btn-ghost" data-act="home">Strona główna</button>
    </div>`;
  if (wrong.length) {
    h += `<section class="sec"><h2>Błędne w tej serii</h2><ol class="qlist">` + wrong.map(id => `<li>${bqHtml(QI[id])}</li>`).join('') + '</ol></section>';
  }
  return h + '</div>';
}
function bqHtml(q, withMeta) {
  const fav = S.fav.includes(q.i);
  const ans = q.o[q.c] || (q.of && q.of[q.c] ? 'odpowiedź na rysunku' : '');
  return `<div class="bq">` +
    (withMeta ? `<div class="meta"><span>${esc(TI[q.t].short)}</span><button type="button" class="ib star" data-act="fav" data-id="${q.i}" aria-pressed="${fav}" aria-label="${fav ? 'Usuń z zapisanych' : 'Zapisz pytanie'}">${I.star}</button></div>` : '') +
    `<p class="qq">${txt(q.q)}</p>${figHtml(q.f)}` +
    (q.of && q.of[q.c] ? figHtml(q.of[q.c]) : '') +
    `<p class="aa">${I.check}<span>${txt(ans)}</span></p><p class="ee">${txt(q.e)}</p></div>`;
}

/* ---------- Egzamin ---------- */
function drawExam(pool) {
  const n = Math.min(EXAM_N, pool.length);
  const byT = {};
  pool.forEach(q => { (byT[q.t] = byT[q.t] || []).push(q.i); });
  const quota = Object.keys(byT).map(t => {
    const exact = n * byT[t].length / pool.length;
    return { t, exact, q: Math.min(byT[t].length, Math.floor(exact)) };
  });
  let left = n - quota.reduce((s, o) => s + o.q, 0);
  quota.sort((a, b) => (b.exact - Math.floor(b.exact)) - (a.exact - Math.floor(a.exact)));
  while (left > 0) {
    let moved = false;
    for (const o of quota) { if (left > 0 && o.q < byT[o.t].length) { o.q++; left--; moved = true; } }
    if (!moved) break;
  }
  const ids = [];
  quota.forEach(o => { ids.push(...shuffle(byT[o.t].slice()).slice(0, o.q)); });
  return shuffle(ids);
}
function startExam() {
  if (S.exam) { go('exam'); return; }
  const pool = bank(S.qual);
  if (!pool.length) { toast('Brak pytań w tej kwalifikacji.'); return; }
  const ids = drawExam(pool);
  const perm = {};
  ids.forEach(id => { perm[id] = permFor(QI[id], S.set.shuffle); });
  const now = Date.now();
  S.exam = { k: S.qual, ids, perm, ans: {}, flag: {}, i: 0, start: now, end: now + EXAM_MS };
  save();
  go('exam');
}
function examHtml() {
  const E = S.exam;
  if (!E) return homeHtml();
  const id = E.ids[E.i], q = QI[id];
  const answered = Object.keys(E.ans).length;
  const last = E.i === E.ids.length - 1;
  let h = `<header class="qb"><button type="button" class="ib" data-act="exam-exit" aria-label="Przerwij egzamin">${I.close}</button>
    <div class="qb-mid"><b>Pytanie ${E.i + 1} z ${E.ids.length}</b><span>Odpowiedzi: ${answered} z ${E.ids.length}</span></div>
    <div class="timer" id="timer" role="timer" aria-label="Pozostały czas">60:00</div></header>
    <div class="prog"><i style="width:${answered * 100 / E.ids.length}%"></i></div>`;
  if (!q) h += '<article class="qcard"><p>To pytanie zostało usunięte z bazy. Przejdź do następnego.</p></article>';
  else h += `<article class="qcard"><h2 class="qtext">${txt(q.q)}</h2>${figHtml(q.f)}${optsHtml(q, E.perm[id], { sel: E.ans[id], act: 'ex-pick' })}</article>`;
  h += `<div class="dock"><div class="dock-in">
    <button type="button" class="ib" data-act="ex-prev" aria-label="Poprzednie pytanie"${E.i ? '' : ' disabled'}>${I.prev}</button>
    <button type="button" class="ib flag" data-act="ex-flag" aria-pressed="${!!E.flag[id]}" aria-label="Oznacz, żeby wrócić">${I.flag}</button>
    <button type="button" class="ib" data-act="ex-grid" aria-label="Wszystkie pytania">${I.grid}</button>
    ${last ? `<button type="button" class="btn btn-primary grow" data-act="ex-finish">Zakończ egzamin</button>` : `<button type="button" class="btn btn-primary grow" data-act="ex-next">Następne</button>`}
  </div></div>`;
  return h;
}
function tick() {
  if (TIMER) clearInterval(TIMER);
  const upd = () => {
    if (!S.exam || V.view !== 'exam') { clearInterval(TIMER); TIMER = null; return; }
    const left = S.exam.end - Date.now();
    if (left <= 0) { clearInterval(TIMER); TIMER = null; finishExam(true); return; }
    const el = $('#timer');
    if (!el) return;
    const m = Math.floor(left / 60000), s = Math.floor(left % 60000 / 1000);
    el.textContent = `${m}:${String(s).padStart(2, '0')}`;
    el.className = 'timer' + (left < 60000 ? ' crit' : left < 600000 ? ' warn' : '');
  };
  upd();
  TIMER = setInterval(upd, 1000);
}
function pickExam(d) {
  const E = S.exam, id = E.ids[E.i];
  if (!QI[id]) return;
  if (E.ans[id] === d) delete E.ans[id];
  else E.ans[id] = d;
  save();
  render();
}
function exNav(step) {
  const E = S.exam;
  const i = E.i + step;
  if (i < 0 || i >= E.ids.length) return;
  E.i = i;
  save();
  render();
  window.scrollTo(0, 0);
}
function finishExam(timeout) {
  const E = S.exam;
  if (!E) return;
  let score = 0;
  const a = [];
  E.ids.forEach(id => {
    const q = QI[id];
    if (!q) return;
    const d = E.ans[id];
    const oi = d === undefined ? -1 : E.perm[id][d];
    if (oi === q.c) score++;
    if (oi >= 0) record(id, oi === q.c);
    a.push([id, oi]);
  });
  const end = Math.min(Date.now(), E.end);
  const res = { d: E.start, k: E.k, n: a.length, s: score, t: Math.max(1, Math.round((end - E.start) / 1000)), a, to: timeout ? 1 : 0 };
  S.exams.unshift(res);
  S.exams = S.exams.slice(0, 60);
  S.exam = null;
  save();
  if (TIMER) { clearInterval(TIMER); TIMER = null; }
  V.res = res; V.rf = 'all';
  if (V.sheet) hideSheet();
  go('result');
  if (timeout) setTimeout(() => toast('Czas minął, egzamin został zakończony.'), 300);
}
function resultHtml() {
  const r = V.res;
  if (!r) return homeHtml();
  const pass = r.s / r.n >= PASS;
  const pct = Math.round(r.s * 100 / r.n);
  const none = r.a.filter(x => x[1] < 0).length;
  const thr = Math.ceil(r.n * PASS);
  const byT = {};
  r.a.forEach(([id, oi]) => {
    const q = QI[id];
    if (!q) return;
    const o = byT[q.t] || (byT[q.t] = { n: 0, ok: 0 });
    o.n++;
    if (oi === q.c) o.ok++;
  });
  let h = `<header class="qb"><button type="button" class="ib" data-act="home" aria-label="Strona główna">${I.close}</button><div class="qb-mid"><b>Egzamin ${esc(r.k)}</b><span>${esc(fmtDate(r.d))}</span></div></header>`;
  h += `<div class="done"><div class="verdict ${pass ? 'ok' : 'bad'}">${pass ? 'Zdany' : 'Niezdany'}</div>
    <div class="big">${r.s}<small> / ${r.n}</small></div>
    <p class="sub">${pass ? `Próg to ${thr} dobrych odpowiedzi, masz ${r.s - thr} zapasu.` : `Do zdania zabrakło ${thr - r.s} ${plural(thr - r.s, 'dobrej odpowiedzi', 'dobrych odpowiedzi', 'dobrych odpowiedzi')}.`}</p>
    <div class="meter" aria-hidden="true"><div class="track"><div class="fill ${pass ? 'ok' : 'bad'}" style="width:${pct}%"></div></div><div class="thr" style="left:${PASS * 100}%"><span>próg ${Math.round(PASS * 100)}%</span></div></div>
    <dl class="facts"><div><dt>Wynik</dt><dd>${pct}%</dd></div><div><dt>Czas</dt><dd>${esc(fmtDur(r.t))}</dd></div>
      <div><dt>Bez odpowiedzi</dt><dd>${none}</dd></div><div><dt>Zakończenie</dt><dd>${r.to ? 'koniec czasu' : 'samodzielnie'}</dd></div></dl>
    <div class="btns"><button type="button" class="btn btn-primary" data-act="res-review">Przejrzyj odpowiedzi</button>
      <button type="button" class="btn btn-ghost" data-act="exam-new">Nowy egzamin</button></div>
    <section class="sec"><h2>Wynik w działach</h2><ul class="tbars">` +
    Object.keys(byT).sort((a, b) => byT[a].ok / byT[a].n - byT[b].ok / byT[b].n).map(t =>
      `<li><span>${esc(TI[t].name)}</span><em>${byT[t].ok}/${byT[t].n}</em><span class="b"><i style="width:${byT[t].ok * 100 / byT[t].n}%"></i></span></li>`).join('') +
    '</ul></section></div>';
  return h;
}
function reviewItems() {
  const r = V.res;
  return r.a.map(([id, oi], i) => ({ i, id, oi, q: QI[id] })).filter(x => x.q).filter(x =>
    V.rf === 'bad' ? x.oi >= 0 && x.oi !== x.q.c : V.rf === 'none' ? x.oi < 0 : true);
}
function reviewHtml() {
  const r = V.res;
  if (!r) return homeHtml();
  const all = r.a.filter(x => QI[x[0]]);
  const nBad = all.filter(x => x[1] >= 0 && x[1] !== QI[x[0]].c).length;
  const nNone = all.filter(x => x[1] < 0).length;
  const items = reviewItems();
  let h = `<header class="qb"><button type="button" class="ib" data-act="res-back" aria-label="Wróć do wyniku">${I.back}</button><div class="qb-mid"><b>Odpowiedzi</b><span>Egzamin ${esc(r.k)}, ${r.s}/${r.n}</span></div></header>`;
  h += `<div class="chips">
    <button type="button" class="chip" data-act="rf" data-f="all" aria-pressed="${V.rf === 'all'}">Wszystkie ${all.length}</button>
    <button type="button" class="chip" data-act="rf" data-f="bad" aria-pressed="${V.rf === 'bad'}">Błędne ${nBad}</button>
    <button type="button" class="chip" data-act="rf" data-f="none" aria-pressed="${V.rf === 'none'}">Bez odpowiedzi ${nNone}</button></div>`;
  h += items.length ? '<ol class="qlist">' + items.map((x, j) => {
    const m = x.oi < 0 ? 'none' : x.oi === x.q.c ? 'ok' : 'bad';
    return `<li><button type="button" class="qrow" data-act="rq" data-j="${j}"><span class="n">${x.i + 1}</span><span class="t">${esc(x.q.q)}</span><span class="mark ${m}">${m === 'ok' ? I.check : m === 'bad' ? I.cross : ''}</span></button></li>`;
  }).join('') + '</ol>' : '<p class="empty-note">Nic tu nie ma.</p>';
  return h + '<div style="height:40px"></div>';
}
function reviewQHtml() {
  const items = reviewItems();
  const x = items[V.rqi];
  if (!x) return reviewHtml();
  const q = x.q;
  const fav = S.fav.includes(q.i);
  let h = `<header class="qb"><button type="button" class="ib" data-act="rq-back" aria-label="Wróć do listy">${I.back}</button>
    <div class="qb-mid"><b>Pytanie ${x.i + 1}</b><span>${esc(TI[q.t].name)}</span></div>
    <button type="button" class="ib star" data-act="fav" data-id="${q.i}" aria-pressed="${fav}" aria-label="${fav ? 'Usuń z zapisanych' : 'Zapisz pytanie'}">${I.star}</button></header>`;
  const perm = [0, 1, 2, 3];
  h += `<article class="qcard"><h2 class="qtext">${txt(q.q)}</h2>${figHtml(q.f)}${optsHtml(q, perm, { reveal: true, chosen: x.oi, act: 'none' })}${x.oi < 0 ? `<div class="answer bad"><h3>${I.cross}Bez odpowiedzi. Poprawna: ${LET[q.c]}</h3><p>${txt(q.e)}</p></div>` : answerHtml(q, perm, x.oi)}</article>`;
  h += `<div class="dock"><div class="dock-in">
    <button type="button" class="ib" data-act="rq-step" data-s="-1" aria-label="Poprzednie"${V.rqi ? '' : ' disabled'}>${I.prev}</button>
    <span class="grow" style="text-align:center;color:var(--ink-2);font-size:15px">${V.rqi + 1} z ${items.length}</span>
    <button type="button" class="ib" data-act="rq-step" data-s="1" aria-label="Następne"${V.rqi + 1 < items.length ? '' : ' disabled'}>${I.next}</button></div></div>`;
  return h;
}

/* ---------- Przeglądanie ---------- */
function browseHtml() {
  const k = S.qual, b = V.br;
  let h = `<header class="qb"><button type="button" class="ib" data-act="home" aria-label="Strona główna">${I.back}</button><div class="qb-mid"><b>Pytania ${k}</b><span id="br-count"></span></div></header>`;
  h += `<label class="search">${I.search}<input type="search" id="br-q" placeholder="Szukaj w pytaniach i odpowiedziach" value="${esc(b.s)}" autocomplete="off" aria-label="Szukaj"></label>`;
  h += `<select class="select" id="br-t" aria-label="Dział"><option value="">Wszystkie działy</option>` +
    topicsOf(k).map(t => `<option value="${t.id}"${b.t === t.id ? ' selected' : ''}>${esc(t.name)}</option>`).join('') + '</select>';
  h += `<div class="chips">
    <button type="button" class="chip" data-act="br-f" data-f="all" aria-pressed="${b.f === 'all'}">Wszystkie</button>
    <button type="button" class="chip" data-act="br-f" data-f="fav" aria-pressed="${b.f === 'fav'}">Zapisane</button>
    <button type="button" class="chip" data-act="br-f" data-f="bad" aria-pressed="${b.f === 'bad'}">Do powtórki</button>
    <button type="button" class="chip" data-act="br-f" data-f="new" aria-pressed="${b.f === 'new'}">Nowe</button></div>`;
  return h + '<div id="br-list"></div>';
}
function browseMatches() {
  const k = S.qual, b = V.br;
  const words = norm(b.s).split(/\s+/).filter(Boolean);
  return bank(k).filter(q => {
    if (b.t && q.t !== b.t) return false;
    if (b.f === 'fav' && !S.fav.includes(q.i)) return false;
    if (b.f === 'bad' && st(q.i) !== 'bad') return false;
    if (b.f === 'new' && st(q.i) !== 'new') return false;
    if (!words.length) return true;
    const hay = norm(q.q + ' ' + q.o.join(' ') + ' ' + q.e);
    return words.every(w => hay.includes(w));
  });
}
function renderBrowseList() {
  const box = $('#br-list');
  if (!box) return;
  const list = browseMatches();
  const shown = list.slice(0, V.br.lim);
  $('#br-count').textContent = `${list.length} ${plural(list.length, 'pytanie', 'pytania', 'pytań')}`;
  box.innerHTML = list.length
    ? '<ol class="qlist">' + shown.map(q => `<li>${bqHtml(q, true)}</li>`).join('') + '</ol>' +
      (list.length > shown.length ? `<button type="button" class="btn btn-ghost btn-block more" data-act="br-more">Pokaż kolejne (${list.length - shown.length})</button>` : '')
    : '<p class="empty-note">Brak pytań dla tych filtrów.</p>';
}

/* ---------- Historia egzaminów ---------- */
function historyHtml() {
  const k = S.qual;
  const exams = S.exams.map((e, i) => Object.assign({ idx: i }, e)).filter(e => e.k === k);
  let h = `<header class="qb"><button type="button" class="ib" data-act="home" aria-label="Strona główna">${I.back}</button><div class="qb-mid"><b>Egzaminy ${k}</b><span>${exams.length} ${plural(exams.length, 'podejście', 'podejścia', 'podejść')}</span></div></header>`;
  const last = exams.slice(0, 20).reverse();
  if (last.length > 1) {
    const W = 320, H = 120, bw = W / last.length;
    let bars = '';
    last.forEach((e, i) => {
      const hh = (e.s / e.n) * (H - 10);
      bars += `<rect x="${(i * bw + 2).toFixed(1)}" y="${(H - hh).toFixed(1)}" width="${(bw - 4).toFixed(1)}" height="${hh.toFixed(1)}" rx="3" style="fill:${e.s / e.n >= PASS ? 'var(--ok)' : 'var(--bad)'}"/>`;
    });
    bars += `<line x1="0" x2="${W}" y1="${H - (H - 10) * PASS}" y2="${H - (H - 10) * PASS}" style="stroke:var(--ink);stroke-width:1.5;stroke-dasharray:5 4"/>`;
    h += `<figure class="fig" aria-label="Wyniki ostatnich egzaminów"><svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto">${bars}</svg></figure><p class="hint" style="font-size:13px;color:var(--ink-2)">Linia przerywana to próg zdawalności.</p>`;
  }
  h += exams.length ? '<ol class="hist-list">' + exams.map(examRow).join('') + '</ol>' : '<p class="empty-note">Nie masz jeszcze żadnego egzaminu.</p>';
  return h;
}

/* ---------- Arkusze ---------- */
function openSheet(kind, arg) {
  V.sheet = { kind, arg };
  const [title, body] = sheetContent(kind, arg);
  $('#sheet-title').textContent = title;
  $('#sheet-body').innerHTML = body;
  $('#sheet').hidden = false;
  syncGuardSoon();
}
function hideSheet() {
  V.sheet = null;
  $('#sheet').hidden = true;
}
function closeSheet() {
  hideSheet();
  syncGuardSoon();
}
function sheetContent(kind, arg) {
  if (kind === 'topic') {
    const t = TI[arg], k = S.qual;
    const ts = stats(bank(k).filter(q => q.t === t.id));
    return [t.name, `<div class="stats3"><div class="ok"><b>${ts.ok}</b><span>umiem</span></div><div class="bad"><b>${ts.bad}</b><span>do powtórki</span></div><div><b>${ts.nw}</b><span>nowe</span></div></div>
      <p style="font-size:14px;color:var(--ink-2);margin-top:8px">${ts.n} ${plural(ts.n, 'pytanie', 'pytania', 'pytań')} w dziale.</p>
      <div class="btns"><button type="button" class="btn btn-primary" data-act="topic-learn" data-t="${t.id}">Ucz się tego działu</button>
      ${ts.bad ? `<button type="button" class="btn btn-ghost" data-act="topic-bad" data-t="${t.id}">Powtórz błędy z działu (${ts.bad})</button>` : ''}
      <button type="button" class="btn btn-ghost" data-act="topic-browse" data-t="${t.id}">Przeglądaj pytania działu</button></div>`];
  }
  if (kind === 'exam-exit') {
    return ['Przerwać egzamin?', `<p>Czas egzaminu biegnie dalej. Możesz wrócić do niego ze strony głównej albo zakończyć go teraz i zobaczyć wynik.</p>
      <div class="btns"><button type="button" class="btn btn-primary" data-act="sheet-close">Wróć do pytań</button>
      <button type="button" class="btn btn-ghost" data-act="ex-later">Wyjdź, wrócę później</button>
      <button type="button" class="btn btn-danger" data-act="ex-finish-now">Zakończ i sprawdź wynik</button></div>`];
  }
  if (kind === 'exam-finish') {
    const E = S.exam;
    const left = E.ids.length - Object.keys(E.ans).length;
    return ['Zakończyć egzamin?', `<p>${left ? `Bez odpowiedzi ${plural(left, 'zostało', 'zostały', 'zostało')} ${left} ${plural(left, 'pytanie', 'pytania', 'pytań')}. Pytanie bez odpowiedzi liczy się jak błędne.` : 'Odpowiedziałeś na wszystkie pytania.'}</p>
      <div class="btns"><button type="button" class="btn btn-primary" data-act="ex-finish-now">Zakończ egzamin</button>
      <button type="button" class="btn btn-ghost" data-act="sheet-close">Wróć do pytań</button></div>`];
  }
  if (kind === 'grid') {
    const E = S.exam;
    return ['Pytania egzaminu', `<div class="grid40">` + E.ids.map((id, i) =>
      `<button type="button" class="${E.ans[id] !== undefined ? 'ans' : ''}${E.flag[id] ? ' flg' : ''}${i === E.i ? ' cur' : ''}" data-act="ex-go" data-i="${i}" aria-label="Pytanie ${i + 1}">${i + 1}</button>`).join('') +
      `</div><p class="grid-legend"><span>Ciemne: z odpowiedzią</span><span>Żółta kropka: do sprawdzenia</span></p>
      <div class="btns"><button type="button" class="btn btn-primary" data-act="ex-finish">Zakończ egzamin</button></div>`];
  }
  if (kind === 'reset') {
    return ['Wyzerować postępy?', `<p>Usuniesz odpowiedzi, zapisane pytania i historię egzaminów na tym telefonie. Tego nie da się cofnąć, chyba że masz zapisaną kopię.</p>
      <div class="btns"><button type="button" class="btn btn-danger" data-act="reset-yes">Wyzeruj postępy</button><button type="button" class="btn btn-ghost" data-act="sheet-close">Anuluj</button></div>`];
  }
  // ustawienia
  const seg = (act, val, opts) => '<span class="seg">' + opts.map(([v, l]) => `<button type="button" data-act="${act}" data-v="${v}" aria-pressed="${String(val) === String(v)}">${l}</button>`).join('') + '</span>';
  const sw = (act, on) => `<button type="button" class="switch" role="switch" aria-checked="${on}" data-act="${act}"></button>`;
  const standalone = matchMedia('(display-mode: standalone)').matches;
  const total = D.q.length;
  return ['Ustawienia', `
    <div class="set-row"><span>Pytań w serii nauki</span>${seg('set-len', S.set.len, [[10, '10'], [20, '20'], [40, '40']])}</div>
    <div class="set-row"><span>Mieszaj kolejność odpowiedzi<small>Uczysz się treści, a nie litery.</small></span>${sw('set-shuffle', S.set.shuffle)}</div>
    <div class="set-row"><span>Wibracja przy błędzie</span>${sw('set-vib', S.set.vib)}</div>
    <div class="set-row"><span>Wygląd</span>${seg('set-theme', S.set.theme, [['auto', 'Auto'], ['light', 'Jasny'], ['dark', 'Ciemny']])}</div>
    <div class="set-row"><span>Kopia postępów<small>Plik do przeniesienia na inny telefon.</small></span><span class="seg"><button type="button" data-act="backup">Zapisz</button><button type="button" data-act="restore">Wczytaj</button></span></div>
    ${!standalone ? `<div class="set-row"><span>Aplikacja na telefonie<small>${installEvt ? 'Dodaj ikonę Fazy do ekranu głównego.' : 'W Chrome: menu ⋮, potem „Dodaj do ekranu głównego”.'}</small></span>${installEvt ? '<span class="seg"><button type="button" data-act="install">Zainstaluj</button></span>' : ''}</div>` : ''}
    <div class="btns"><button type="button" class="btn btn-danger" data-act="reset">Wyzeruj postępy</button></div>
    <div class="about">
      <p>Pytania są autorskie, ułożone według zakresu kwalifikacji ELE.02 i ELE.05. To nie są oficjalne pytania CKE, więc traktuj je jako trening wiedzy, a nie bazę z egzaminu.</p>
      <p>Część pisemna egzaminu: 40 pytań, każde z czterema odpowiedziami, 60 minut. Zdajesz, gdy masz co najmniej 50% punktów, czyli 20 dobrych odpowiedzi.</p>
      <p>Faza ${APP_VERSION}, baza ${esc(D.v)}, ${total} ${plural(total, 'pytanie', 'pytania', 'pytań')}.</p>
    </div>
    <input type="file" id="restore-file" accept="application/json,.json" hidden>`];
}

/* ---------- Kopia postępów ---------- */
function backup() {
  const data = { app: 'faza', v: 1, saved: new Date().toISOString(), p: S.p, fav: S.fav, exams: S.exams };
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `faza-postepy-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  toast('Zapisano kopię postępów.');
}
function restore(file) {
  const r = new FileReader();
  r.onload = () => {
    try {
      const d = JSON.parse(r.result);
      if (d.app !== 'faza' || typeof d.p !== 'object') throw new Error('zły plik');
      S.p = d.p || {};
      S.fav = Array.isArray(d.fav) ? d.fav.filter(id => QI[id]) : [];
      S.exams = Array.isArray(d.exams) ? d.exams : [];
      save();
      closeSheet();
      go('home');
      toast('Wczytano kopię postępów.');
    } catch (e) { toast('To nie jest plik z kopią postępów Fazy.'); }
  };
  r.readAsText(file);
}

/* ---------- Akcje ---------- */
function toggleFav(id) {
  const i = S.fav.indexOf(id);
  if (i >= 0) S.fav.splice(i, 1); else S.fav.push(id);
  save();
  document.querySelectorAll(`.star[data-id="${id}"]`).forEach(b => {
    const on = S.fav.includes(id);
    b.setAttribute('aria-pressed', on);
    b.setAttribute('aria-label', on ? 'Usuń z zapisanych' : 'Zapisz pytanie');
  });
  toast(S.fav.includes(id) ? 'Zapisano pytanie.' : 'Usunięto z zapisanych.');
}

const A = {
  reload: () => location.reload(),
  qual: b => { S.qual = b.dataset.k; save(); render(); },
  settings: () => openSheet('settings'),
  'sheet-close': () => closeSheet(),
  home: () => go('home'),
  learn: () => startLearn('mix'),
  'learn-bad': () => startLearn('bad'),
  'learn-fav': () => startLearn('fav'),
  topic: b => openSheet('topic', b.dataset.t),
  'topic-learn': b => { closeSheet(); startLearn('mix', b.dataset.t); },
  'topic-bad': b => { closeSheet(); startLearn('bad', b.dataset.t); },
  'topic-browse': b => { closeSheet(); V.br = { s: '', t: b.dataset.t, f: 'all', lim: 40 }; go('browse'); },
  pick: b => pickLearn(+b.dataset.d),
  dunno: () => {
    const s = V.ses, id = s.ids[s.i];
    if (s.ans[id] !== undefined) return;
    s.ans[id] = -1;
    record(id, false);
    save();
    render();
    const el = $('#answer');
    if (el) setTimeout(() => el.scrollIntoView({ block: 'nearest' }), 30);
  },
  next: () => nextLearn(),
  again: () => startLearn(V.ses.kind === 'retry' ? 'mix' : V.ses.kind, V.ses.topic),
  'again-wrong': () => {
    const s = V.ses;
    const wrong = s.ids.filter(id => !(s.ans[id] >= 0 && s.perm[id][s.ans[id]] === QI[id].c));
    startLearn('retry', s.topic, shuffle(wrong.slice()));
  },
  fav: b => toggleFav(b.dataset.id),
  'exam-start': () => startExam(),
  'exam-resume': () => go('exam'),
  'exam-new': () => startExam(),
  'ex-pick': b => pickExam(+b.dataset.d),
  'ex-prev': () => exNav(-1),
  'ex-next': () => exNav(1),
  'ex-flag': () => {
    const E = S.exam, id = E.ids[E.i];
    if (E.flag[id]) delete E.flag[id]; else E.flag[id] = 1;
    save();
    render();
  },
  'ex-grid': () => openSheet('grid'),
  'ex-go': b => { closeSheet(); S.exam.i = +b.dataset.i; save(); render(); window.scrollTo(0, 0); },
  'ex-finish': () => openSheet('exam-finish'),
  'ex-finish-now': () => { closeSheet(); finishExam(false); },
  'exam-exit': () => openSheet('exam-exit'),
  'ex-later': () => { closeSheet(); go('home'); },
  'res-review': () => { V.rf = 'all'; go('review'); },
  'res-back': () => go('result'),
  rf: b => { V.rf = b.dataset.f; render(); },
  rq: b => { V.rqi = +b.dataset.j; go('rq'); },
  'rq-back': () => go('review'),
  'rq-step': b => { V.rqi += +b.dataset.s; render(); window.scrollTo(0, 0); },
  'hist-open': b => { V.res = S.exams[+b.dataset.i]; go('result'); },
  history: () => go('history'),
  browse: () => { V.br = { s: '', t: '', f: 'all', lim: 40 }; go('browse'); },
  'br-f': b => {
    V.br.f = b.dataset.f; V.br.lim = 40;
    document.querySelectorAll('[data-act="br-f"]').forEach(c => c.setAttribute('aria-pressed', c.dataset.f === V.br.f));
    renderBrowseList();
  },
  'br-more': () => { V.br.lim += 40; renderBrowseList(); },
  'set-len': b => { S.set.len = +b.dataset.v; save(); openSheet('settings'); },
  'set-shuffle': () => { S.set.shuffle = !S.set.shuffle; save(); openSheet('settings'); },
  'set-vib': () => { S.set.vib = !S.set.vib; save(); openSheet('settings'); },
  'set-theme': b => { S.set.theme = b.dataset.v; save(); applyTheme(); openSheet('settings'); },
  backup: () => backup(),
  restore: () => { const f = $('#restore-file'); if (f) f.click(); },
  reset: () => openSheet('reset'),
  'reset-yes': () => { S.p = {}; S.fav = []; S.exams = []; S.exam = null; save(); closeSheet(); go('home'); toast('Postępy wyzerowane.'); },
  install: async () => {
    if (!installEvt) return;
    installEvt.prompt();
    try { await installEvt.userChoice; } catch (e) { /* zamknięte */ }
    installEvt = null;
    if (V.sheet && V.sheet.kind === 'settings') openSheet('settings');
  },
};

document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]');
  if (!b || b.disabled) return;
  const f = A[b.dataset.act];
  if (f) f(b, e);
});
document.addEventListener('change', e => {
  if (e.target.id === 'restore-file' && e.target.files && e.target.files[0]) restore(e.target.files[0]);
  if (e.target.id === 'br-t') { V.br.t = e.target.value; V.br.lim = 40; renderBrowseList(); }
});
let searchTimer = null;
document.addEventListener('input', e => {
  if (e.target.id !== 'br-q') return;
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { V.br.s = e.target.value; V.br.lim = 40; renderBrowseList(); }, 160);
});
document.addEventListener('keydown', e => {
  if (V.sheet) { if (e.key === 'Escape') history.back(); return; }
  if (e.target.closest('input, select, textarea')) return;
  const k = e.key.toLowerCase();
  let d = '1234'.indexOf(k);
  if (d < 0) d = 'abcd'.indexOf(k);
  const onBody = document.activeElement === document.body || !document.activeElement;
  if (V.view === 'learn') {
    if (d >= 0) pickLearn(d);
    else if ((k === 'enter' && onBody) || k === 'arrowright') nextLearn();
  } else if (V.view === 'exam') {
    if (d >= 0) pickExam(d);
    else if (k === 'arrowright') exNav(1);
    else if (k === 'arrowleft') exNav(-1);
  }
});

let toastTimer = null;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
}

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  installEvt = e;
  if (V.sheet && V.sheet.kind === 'settings') openSheet('settings');
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && D && (V.view === 'home' || V.view === 'exam')) render();
});
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => { /* bez trybu offline */ }); });
}

boot();
