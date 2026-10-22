(() => {
'use strict';

/* ---------- constants ---------- */
const MEALS = [['sniadanie','Śniadanie'],['drugie','II śniadanie'],['obiad','Obiad'],['podwieczorek','Podwieczorek'],['kolacja','Kolacja'],['przekaski','Przekąski']];
const mealLabel = k => (MEALS.find(m => m[0] === k) || [k, k])[1];
const WORKOUTS = {
  silownia: { label: 'Siłownia', met: [3.5, 5.0, 6.0] },
  basen:    { label: 'Basen',    met: [5.8, 7.0, 9.8] },
  rower:    { label: 'Rower',    met: [4.0, 6.8, 8.5] },
  bieg:     { label: 'Bieganie', met: [7.0, 9.8, 11.5], note: 'Kroki z biegu są już w liczniku kroków z zegarka, więc limit może wyjść trochę za wysoki.' },
  gry:      { label: 'Piłka / gry', met: [4.5, 7.0, 8.0] },
  inne:     { label: 'Inne',     met: [3.0, 4.5, 6.0] }
};
const INTENS = ['Lekko', 'Umiarkowanie', 'Intensywnie'];
const LS_KEY = 'talerz.v1';
const APP_VERSION = '1.3.1';
/* Product categories. A set ingredient can be swapped for any product from the same category. */
const CATS = ['Pieczywo', 'Wędliny', 'Nabiał', 'Mięso i ryby', 'Warzywa', 'Owoce', 'Zboża i makarony', 'Tłuszcze i sosy', 'Gotowe dania', 'Słodycze i przekąski', 'Napoje', 'Inne'];
/* Catalog of classic products, per 100 g (typical values from Polish food tables and labels; brands differ a little).
   [id, name, category, kcal, protein, fat, carbs, typical portion in g] */
const STARTER = [
  ['s-chleb-pz', 'Chleb pszenno-żytni', 'Pieczywo', 265, 8, 1.7, 53, 60],
  ['s-chleb-pszenny', 'Chleb pszenny', 'Pieczywo', 250, 8, 1.6, 50, 50],
  ['s-chleb-razowy', 'Chleb żytni razowy', 'Pieczywo', 220, 6, 1.6, 43, 60],
  ['s-chleb-graham', 'Chleb graham', 'Pieczywo', 225, 8.5, 1.8, 43, 50],
  ['s-chleb-slonecznik', 'Chleb ze słonecznikiem', 'Pieczywo', 270, 9, 7, 41, 50],
  ['s-chleb-wieloziarnisty', 'Chleb wieloziarnisty', 'Pieczywo', 260, 9, 5.5, 42, 50],
  ['s-chleb-orkiszowy', 'Chleb orkiszowy', 'Pieczywo', 245, 9, 2, 46, 50],
  ['s-chleb-tostowy', 'Chleb tostowy', 'Pieczywo', 265, 8, 3.5, 49, 25],
  ['s-bulka-pszenna', 'Bułka pszenna (kajzerka)', 'Pieczywo', 275, 8.5, 2.5, 55, 50],
  ['s-bulka-zytnia', 'Bułka żytnia', 'Pieczywo', 250, 8, 2.5, 47, 50],
  ['s-bulka-grahamka', 'Bułka grahamka', 'Pieczywo', 250, 9, 2.5, 47, 60],
  ['s-bagietka', 'Bagietka', 'Pieczywo', 265, 8.5, 1.5, 53, 60],
  ['s-wafle-ryzowe', 'Wafle ryżowe', 'Pieczywo', 385, 8, 3, 80, 10],
  ['s-kielbasa', 'Kiełbasa morlińska z piersią kurczaka (Morliny)', 'Wędliny', 187, 17, 13, 0.6, 30],
  ['s-krakowska-sucha', 'Kiełbasa krakowska sucha', 'Wędliny', 330, 23, 26, 1, 30],
  ['s-krakowska-parzona', 'Kiełbasa krakowska parzona', 'Wędliny', 240, 17, 19, 1, 30],
  ['s-slaska', 'Kiełbasa śląska', 'Wędliny', 260, 13, 23, 1.5, 100],
  ['s-zywiecka', 'Kiełbasa żywiecka', 'Wędliny', 300, 17, 25, 1, 30],
  ['s-szynkowa', 'Kiełbasa szynkowa', 'Wędliny', 210, 16, 16, 1, 30],
  ['s-szynka', 'Szynka wieprzowa gotowana', 'Wędliny', 110, 19, 3.5, 1, 30],
  ['s-poledwica', 'Polędwica sopocka', 'Wędliny', 120, 20, 4, 1, 30],
  ['s-szynka-indyk', 'Szynka z indyka', 'Wędliny', 95, 18, 2, 1.5, 30],
  ['s-salami', 'Salami', 'Wędliny', 420, 22, 36, 1, 15],
  ['s-parowki', 'Parówki', 'Wędliny', 260, 11, 23, 2, 50],
  ['s-kabanosy', 'Kabanosy', 'Wędliny', 470, 26, 40, 1.5, 30],
  ['s-ser', 'Ser żółty (gouda)', 'Nabiał', 356, 25, 27.5, 0, 20],
  ['s-serek-kanapkowy', 'Serek kanapkowy śmietankowy', 'Nabiał', 250, 6, 23, 4, 20],
  ['s-twarog', 'Twaróg półtłusty', 'Nabiał', 133, 18.7, 4.7, 3.7, 100],
  ['s-jogurt', 'Jogurt naturalny 2%', 'Nabiał', 60, 4.3, 2, 6.2, 150],
  ['s-skyr', 'Skyr pitny High Protein brzoskwinia (Piątnica)', 'Nabiał', 53, 7.3, 0, 6.8, 360],
  ['s-mleko', 'Mleko 2%', 'Nabiał', 51, 3.4, 2, 4.9, 250],
  ['s-jajko', 'Jajko kurze', 'Nabiał', 140, 12.5, 9.7, 0.6, 50],
  ['s-piers', 'Pierś z kurczaka (surowa)', 'Mięso i ryby', 99, 21.5, 1.3, 0, 150],
  ['s-pomidor', 'Pomidor', 'Warzywa', 18, 0.9, 0.2, 3.9, 30],
  ['s-ogorek', 'Ogórek świeży', 'Warzywa', 13, 0.7, 0.1, 2.9, 30],
  ['s-ogorek-kiszony', 'Ogórek kiszony', 'Warzywa', 12, 0.6, 0.1, 2.2, 30],
  ['s-salata', 'Sałata', 'Warzywa', 15, 1.4, 0.2, 2.9, 10],
  ['s-rzodkiewka', 'Rzodkiewka', 'Warzywa', 16, 1, 0.1, 3.4, 30],
  ['s-papryka', 'Papryka czerwona', 'Warzywa', 31, 1, 0.3, 6, 30],
  ['s-kapusta-kiszona', 'Kapusta kiszona', 'Warzywa', 19, 1.1, 0.2, 3.4, 150],
  ['s-ziemniaki', 'Ziemniaki gotowane', 'Warzywa', 75, 1.9, 0.1, 17, 200],
  ['s-banan', 'Banan', 'Owoce', 95, 1, 0.3, 23.5, 120],
  ['s-jablko', 'Jabłko', 'Owoce', 52, 0.4, 0.4, 12, 180],
  ['s-owsiane', 'Płatki owsiane', 'Zboża i makarony', 370, 13, 7, 60, 50],
  ['s-ryz', 'Ryż biały (suchy)', 'Zboża i makarony', 344, 6.7, 0.7, 79, 70],
  ['s-makaron', 'Makaron (suchy)', 'Zboża i makarony', 350, 12, 1.5, 71, 80],
  ['s-maslo', 'Masło', 'Tłuszcze i sosy', 735, 0.7, 82.5, 0.7, 5],
  ['s-margaryna', 'Margaryna', 'Tłuszcze i sosy', 530, 0, 59, 0.5, 5],
  ['s-oliwa', 'Oliwa z oliwek', 'Tłuszcze i sosy', 884, 0, 100, 0, 10],
  ['s-majonez', 'Majonez', 'Tłuszcze i sosy', 680, 1.5, 75, 1, 10],
  ['s-ketchup', 'Ketchup', 'Tłuszcze i sosy', 100, 1.5, 0.2, 23, 15],
  ['s-musztarda', 'Musztarda', 'Tłuszcze i sosy', 110, 6, 6, 8, 10],
  ['s-pierogi', 'Pierogi domowe z mięsem (Jawo)', 'Gotowe dania', 278, 11, 15, 24, 450]
].map(([id, name, cat, kcal100, p100, f100, c100, portion]) => ({ id, name, cat, kcal100, p100, f100, c100, portion }));
const CATALOG_VERSION = 2;
/* Ready-made sets added once to every library: [name, [[product name, grams], ...]] */
const STARTER_SETS = [
  ['Kanapka z wędliną', [['Chleb pszenno-żytni', 50], ['Masło', 5], ['Kiełbasa krakowska parzona', 30]]],
  ['Kanapka z serem', [['Chleb pszenno-żytni', 50], ['Masło', 5], ['Ser żółty (gouda)', 20], ['Pomidor', 30]]]
];

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nf0 = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 1 });
const k0 = n => nf0.format(Math.round(n || 0));
const g1 = n => nf1.format(Math.round((n || 0) * 10) / 10);
const num = v => { const x = parseFloat(String(v ?? '').replace(/\s/g, '').replace(',', '.')); return Number.isFinite(x) ? x : NaN; };
const numOr = (v, d) => { const x = num(v); return Number.isFinite(x) ? x : d; };
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-5);
const clone = o => JSON.parse(JSON.stringify(o));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parseIso = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parseIso(s); d.setDate(d.getDate() + n); return iso(d); };
const today = () => iso(new Date());
const fmtDate = (s, o) => new Intl.DateTimeFormat('pl-PL', o).format(parseIso(s));
const norm = s => String(s || '').toLowerCase().replace(/ł/g, 'l').normalize('NFD').replace(/[̀-ͯ]/g, '');
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const CAT_RULES = [
  ['Pieczywo', /chleb|bulk|bagiet|tost|kajzer|grahamk|pieczyw|rogal|wafle ryz|tortill|pita/],
  ['Wędliny', /kielbas|szynk|poledwic|salami|parow|kabanos|wedlin|boczek|pasztet|mortadel|kaszank|salceson|serdel|frankfurter|berlink/],
  ['Tłuszcze i sosy', /maslo(?! orzech)|margaryn|olej|oliw|majonez|ketchup|musztard|sos |sos$|dressing|smalec/],
  ['Nabiał', /\bser|twarog|twaroz|jogurt|skyr|mleko|kefir|maslank|smietan|jaj|mozzarell|feta/],
  ['Mięso i ryby', /piers|kurczak|indyk|wolowin|wieprzow|mielon|losos|tunczyk|dorsz|ryba|schab|udko|filet/],
  ['Warzywa', /pomidor|ogor|salat|papryk|rzodkiew|kapust|marchew|cebul|brokul|warzyw|szczypior|ziemniak|kukurydz|fasol|groszek/],
  ['Owoce', /jablk|banan|gruszk|truskaw|pomarancz|winogr|owoc|borowk|malin|kiwi|mandaryn|sliwk/],
  ['Zboża i makarony', /ryz|makaron|kasz|platki|owsian|musli|granol|mak[ai]\b/],
  ['Gotowe dania', /pierog|pizz|zupa|kotlet|nalesnik|lazani|burger|kebab|zapiekank|krokiet|gulasz|spaghetti/],
  ['Słodycze i przekąski', /czekolad|baton|ciast|chips|lody|cukierk|wafel|zelk|paluszk|orzesz|orzech|drozdzowk|paczek/],
  ['Napoje', /sok|napoj|cola|piwo|kawa|herbat|woda|izoton|energety/]
];
const guessCat = name => { const n = norm(name); for (const [c, re] of CAT_RULES) if (re.test(n)) return c; return 'Inne'; };
const catOf = p => (p && CATS.includes(p.cat)) ? p.cat : guessCat(p && p.name);
const prodById = id => S.library.products.find(p => p.id === id);
const catOfItem = it => { const p = it.pid ? prodById(it.pid) : null; return p ? catOf(p) : guessCat(it.name); };

/* ---------- state ---------- */
const S = {
  mode: 'loading', profile: null, library: { products: [], sets: [] }, days: {},
  date: today(), tab: 'today', histRange: 7, libQuery: '', pd: null,
  sample: null, sampleImages: null,
  loaded: { profile: false, library: false, days: false }, deferRender: false
};
const R = {};
let SH = null;

/* ---------- Android app bridge (Health Connect) ---------- */
const NATIVE = (window.TalerzHealth && typeof window.TalerzHealth === 'object') ? window.TalerzHealth : null;
const APK_URL = 'https://github.com/SkipLock/Talerz/releases/latest/download/macroo.apk';
const HC_LS = 'talerz.hc';
S.hc = { sdk: null, all: false, granted: [], busy: false, lastSync: 0, lastAuto: 0, error: '', samsungHealth: false };
const nativeCalls = new Map();
let nativeSeq = 0;
window.__talerzNativeResolve = (id, ok, payload) => {
  const p = nativeCalls.get(id); if (!p) return;
  nativeCalls.delete(id);
  let v = null;
  try { v = payload ? JSON.parse(payload) : null; } catch (e) { v = null; }
  if (ok) p.resolve(v || {}); else p.reject(v || { code: 'error', message: '' });
};
function nativeCall(method, args) {
  return new Promise((resolve, reject) => {
    if (!NATIVE) { reject({ code: 'no_native' }); return; }
    const id = 'n' + (++nativeSeq);
    nativeCalls.set(id, { resolve, reject });
    try { NATIVE.call(id, method, JSON.stringify(args || {})); }
    catch (e) { nativeCalls.delete(id); reject({ code: 'bridge', message: String(e) }); }
  });
}
function hcLoadMeta() { try { const o = JSON.parse(localStorage.getItem(HC_LS) || '{}'); S.hc.lastSync = o.lastSync || 0; } catch (e) { /* ignore */ } }
function hcSaveMeta() { try { localStorage.setItem(HC_LS, JSON.stringify({ lastSync: S.hc.lastSync })); } catch (e) { /* ignore */ } }
function hcApplyStatus(st) {
  S.hc.sdk = st.sdk || 'unavailable'; S.hc.all = !!st.all;
  S.hc.granted = Array.isArray(st.granted) ? st.granted : [];
  S.hc.samsungHealth = !!st.samsungHealth;
  S.hc.appVersion = st.appVersion || '';
}
async function hcRefreshStatus() {
  try { hcApplyStatus(await nativeCall('status')); }
  catch (e) { S.hc.sdk = 'unavailable'; }
  render();
}
async function hcConnect() {
  try { hcApplyStatus(await nativeCall('requestPermissions')); }
  catch (e) { toast(e && e.code === 'unavailable' ? 'Health Connect jest niedostępne na tym telefonie.' : 'Nie udało się otworzyć okna uprawnień.'); }
  render();
  if (S.hc.granted.length) hcSync([today(), addDays(today(), -1)], true);
  else if (S.hc.sdk === 'available') toast('Bez uprawnień Macroo nie pobierze danych. Spróbuj jeszcze raz albo zajrzyj do Profilu.');
}
function applyHealth(date, res) {
  if (!res || typeof res !== 'object') return false;
  const before = getDay(date), beforeJson = JSON.stringify(before);
  const d = clone(before);
  const steps = Math.round(num(res.steps));
  if (steps > 0 && !(d.stepsSource === 'manual' && (d.steps || 0) > steps)) { d.steps = steps; d.stepsSource = 'hc'; }
  if (Array.isArray(res.sessions)) {
    const ignored = new Set(d.hcIgnored || []);
    const kept = d.workouts.filter(w => !w.hcId || w.locked);
    const keptIds = new Set(kept.filter(w => w.hcId).map(w => w.hcId));
    for (const s of res.sessions) {
      const sid = String((s && s.id) || '');
      if (!sid || ignored.has(sid) || keptIds.has(sid) || s.type === 'spacer') continue;
      const minutes = Math.max(1, Math.round(num(s.minutes) || 0));
      const kcal = num(s.totalKcal);
      kept.push({ id: 'hc-' + sid, hcId: sid, type: WORKOUTS[s.type] ? s.type : 'inne', intensity: 1, minutes, source: kcal > 0 ? 'watch' : 'est', watchKcal: kcal > 0 ? Math.round(kcal) : null, title: String(s.title || '').slice(0, 60) });
    }
    d.workouts = kept;
  }
  const w = num(res.weight);
  if (w >= 30 && w <= 300 && (!d.weight || d.weightSource === 'hc')) { d.weight = Math.round(w * 10) / 10; d.weightSource = 'hc'; }
  if (JSON.stringify(d) === beforeJson) return false;
  d.date = date; d.updatedAt = Date.now();
  S.days[date] = d; persistDay(date);
  return true;
}
async function hcSync(dates, announce) {
  if (!NATIVE || S.hc.busy || !S.hc.granted.length) return;
  S.hc.busy = true; S.hc.error = ''; render();
  let changed = 0, failed = false;
  for (const date of dates) {
    try { const res = await nativeCall('readDay', { date }); S.hc.diag = { at: Date.now(), date, res }; if (applyHealth(date, res)) changed++; }
    catch (e) {
      S.hc.diag = { at: Date.now(), date, error: e };
      failed = true;
      if (e && e.code === 'not_granted') { S.hc.granted = []; S.hc.all = false; S.hc.error = 'Brak uprawnień do danych. Połącz ponownie.'; }
      else S.hc.error = 'Nie udało się pobrać danych z Health Connect.';
      break;
    }
  }
  S.hc.busy = false;
  if (!failed) { S.hc.lastSync = Date.now(); hcSaveMeta(); }
  render();
  if (announce && !failed) toast(changed ? 'Pobrano dane z Samsung Health' : 'Bez zmian. Brakuje danych? Otwórz na chwilę Samsung Health.');
}
function hcAuto() {
  if (!NATIVE || !S.hc.granted.length || S.hc.busy) return;
  if (Date.now() - S.hc.lastAuto < 60000) return;
  S.hc.lastAuto = Date.now();
  hcSync([today(), addDays(today(), -1)], false);
}
window.__talerzResume = () => { if (NATIVE) hcRefreshStatus().then(hcAuto); };
window.__talerzBack = () => {
  if (SH) { closeSheet(); return true; }
  if (S.tab !== 'today') { S.tab = 'today'; render(); window.scrollTo(0, 0); return true; }
  if (S.date !== today()) { S.date = today(); render(); return true; }
  return false;
};
const hcTime = ts => new Intl.DateTimeFormat('pl-PL', { hour: '2-digit', minute: '2-digit' }).format(new Date(ts));
function hcBlockHtml() {
  if (!NATIVE) return '';
  const h = S.hc;
  if (h.sdk === null) return '<div class="hc-row"><span>Sprawdzam połączenie z Health Connect…</span></div>';
  if (h.sdk !== 'available') return `<div class="hc-row"><span>${h.sdk === 'update_required' ? 'Health Connect wymaga aktualizacji.' : 'Na tym telefonie brakuje Health Connect.'}</span><button type="button" class="ghost sm" data-act="hc-install">${h.sdk === 'update_required' ? 'Zaktualizuj' : 'Zainstaluj'}</button></div>`;
  if (!h.granted.length) return '<div class="hc-row"><span>Pobieraj kroki i treningi z Samsung Health automatycznie.</span><button type="button" class="primary sm" data-act="hc-connect">Połącz</button></div>';
  const msg = h.busy ? 'Pobieram dane z Samsung Health…' : h.error ? esc(h.error) : h.lastSync ? `Samsung Health · pobrano o ${hcTime(h.lastSync)}` : 'Samsung Health połączony';
  return `<div class="hc-row"><span>${msg}</span><button type="button" class="ghost sm" data-act="hc-sync"${h.busy ? ' disabled' : ''}>Odśwież</button></div>`;
}
function hcProfileHtml() {
  const how = '<p class="muted small">Kroki liczymy jako ok. 0,5 kcal na kg masy ciała na każdy przebyty kilometr, ponad podstawę dnia. Od kalorii z zegarka odejmujemy spoczynkowe, bo te są już w podstawie. Treningi bez kalorii szacujemy z tabel MET.</p>';
  if (!NATIVE) {
    return `<section class="card"><h3 class="card-t">Samsung Health i Galaxy Watch</h3>
      <p>Strona w przeglądarce nie ma dostępu do danych z zegarka, więc tutaj kroki i treningi wpisujesz ręcznie.</p>
      <p>Aplikacja Macroo na Androida pobiera je sama z Samsung Health przez Health Connect.</p>
      <a class="primary wide btn-link" href="${APK_URL}">Pobierz aplikację na Androida</a>
      <p class="hint">Po pobraniu otwórz plik macroo.apk i zezwól na instalację. Dane z tej strony przeniesiesz kopią zapasową.</p>
      ${how}</section>`;
  }
  const h = S.hc;
  let status, actions;
  if (h.sdk !== 'available') {
    status = h.sdk === 'update_required' ? 'Health Connect wymaga aktualizacji.' : 'Na tym telefonie brakuje Health Connect.';
    actions = `<button type="button" class="primary" data-act="hc-install">${h.sdk === 'update_required' ? 'Zaktualizuj Health Connect' : 'Zainstaluj Health Connect'}</button>`;
  } else if (!h.granted.length) {
    status = 'Nie połączono.';
    actions = '<button type="button" class="primary" data-act="hc-connect">Połącz z Samsung Health</button>';
  } else {
    const names = { READ_STEPS: 'kroki', READ_EXERCISE: 'treningi', READ_TOTAL_CALORIES_BURNED: 'kalorie z treningów', READ_WEIGHT: 'waga' };
    status = `Połączono: ${h.granted.map(g => names[g] || g).join(', ')}.${h.all ? '' : ' Część danych jest wyłączona.'}`;
    actions = `${h.all ? '' : '<button type="button" class="primary" data-act="hc-connect">Włącz resztę</button>'}<button type="button" class="ghost" data-act="hc-settings">Uprawnienia</button>`;
  }
  return `<section class="card"><h3 class="card-t">Samsung Health i Galaxy Watch</h3>
    <p><b>${status}</b></p>
    <div class="btn-row">${actions}</div>
    <p class="small" style="margin-top:10px">Samsung Health musi udostępniać dane: w Samsung Health wejdź w <b>Ustawienia → Health Connect</b> i zezwól na kroki, ćwiczenia, kalorie i wagę. Nowe dane trafiają tam, gdy otworzysz Samsung Health albo gdy zegarek połączy się z telefonem.</p>
    ${h.samsungHealth ? '<button type="button" class="ghost wide" data-act="hc-open-sh">Otwórz Samsung Health</button>' : ''}
    ${how}
    ${h.diag ? `<details class="diag"><summary>Szczegóły ostatniego pobrania</summary><pre>${esc(JSON.stringify(h.diag, null, 1))}</pre></details>` : ''}
    <p class="hint">Aplikacja ${esc(h.appVersion || '')}</p></section>`;
}

/* ---------- normalisers ---------- */
const PROFILE_DEFAULTS = { name: '', sex: 'm', age: 30, height: 175, weight: 80, goal: 75, goalType: 'lose', mode: 'dynamic', deficit: 400, surplus: 300, fixedKcal: 2200, proteinPerKg: 1.8, fatPct: 25 };
const DEFICITS = [200, 300, 400, 500, 600, 750];
const SURPLUSES = [150, 200, 300, 400, 500];
function normProfile(p) {
  if (!p || typeof p !== 'object') return null;
  const o = { ...PROFILE_DEFAULTS, ...p };
  for (const k of ['age', 'height', 'weight', 'goal', 'deficit', 'surplus', 'fixedKcal', 'proteinPerKg', 'fatPct']) o[k] = numOr(o[k], PROFILE_DEFAULTS[k]);
  if (!['lose', 'keep', 'gain'].includes(o.goalType)) o.goalType = o.deficit > 0 ? 'lose' : 'keep';
  if (o.goalType === 'lose' && !(o.deficit > 0)) o.deficit = PROFILE_DEFAULTS.deficit;
  if (!(o.surplus > 0)) o.surplus = PROFILE_DEFAULTS.surplus;
  o.name = String(o.name || '').trim().slice(0, 30);
  if (o.sex !== 'k') o.sex = 'm';
  if (o.mode !== 'fixed') o.mode = 'dynamic';
  return o;
}
function normLib(l) {
  return { products: Array.isArray(l && l.products) ? l.products.filter(p => p && p.id && p.name) : [], sets: Array.isArray(l && l.sets) ? l.sets.filter(s => s && s.id && Array.isArray(s.items)) : [], catalog: Number(l && l.catalog) || 0 };
}
/* Adds catalog products and ready-made sets that the library does not have yet (once per catalog version). */
function upgradeLibrary(lib) {
  if ((lib.catalog || 0) >= CATALOG_VERSION) return false;
  const byName = () => new Map(lib.products.map(p => [norm(p.name), p]));
  let names = byName();
  const ids = new Set(lib.products.map(p => p.id));
  for (const p of STARTER) if (!ids.has(p.id) && !names.has(norm(p.name))) lib.products.push(clone(p));
  names = byName();
  const setNames = new Set(lib.sets.map(x => norm(x.name)));
  for (const [name, parts] of STARTER_SETS) {
    if (setNames.has(norm(name))) continue;
    const items = parts.map(([pn, g]) => { const p = names.get(norm(pn)); return p ? { id: uid(), pid: p.id, name: p.name, grams: g, portion: false, kcal100: p.kcal100, p100: p.p100, f100: p.f100, c100: p.c100 } : null; }).filter(Boolean);
    if (items.length) lib.sets.push({ id: uid(), name, items });
  }
  lib.catalog = CATALOG_VERSION;
  return true;
}
function emptyDay(date) { const meals = {}; for (const [k] of MEALS) meals[k] = []; return { date, meals, steps: 0, workouts: [], weight: null }; }
function getDay(date) {
  const d = S.days[date]; const e = emptyDay(date);
  if (!d) return e;
  return { ...e, ...d, meals: { ...e.meals, ...(d.meals || {}) }, workouts: Array.isArray(d.workouts) ? d.workouts : [] };
}

/* ---------- persistence ---------- */
const writer = {
  pending: new Map(), busy: new Set(),
  write(key, ref, data) { this.pending.set(key, { ref, data: clone(data), tries: 0 }); renderSync(); this.flush(key); },
  isDirty(key) { return this.pending.has(key) || this.busy.has(key); },
  active() { return this.pending.size + this.busy.size > 0; },
  async flush(key) {
    if (this.busy.has(key)) return;
    const item = this.pending.get(key); if (!item) return;
    this.pending.delete(key); this.busy.add(key); renderSync();
    try { await item.ref.set(item.data); }
    catch (e) {
      const code = e && e.code;
      if (code === 'unavailable' && item.tries < 1) {
        item.tries++; await sleep(700 + Math.random() * 900);
        if (!this.pending.has(key)) this.pending.set(key, item);
      } else if (code === 'quota_exceeded') toast('Brak miejsca na zapis. Usuń nieużywane produkty albo dania.');
      else toast('Nie udało się zapisać zmian. Sprawdź połączenie i spróbuj jeszcze raz.');
    } finally {
      this.busy.delete(key); renderSync();
      if (this.pending.has(key)) this.flush(key);
    }
  }
};
function saveLocal() {
  try { localStorage.setItem(LS_KEY, JSON.stringify({ profile: S.profile, library: S.library, days: S.days })); }
  catch (e) { toast('Ta przeglądarka nie pozwala zapisać danych.'); }
}
function loadLocal() {
  try {
    const o = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
    if (o) { S.profile = normProfile(o.profile); S.library = normLib(o.library); S.days = o.days && typeof o.days === 'object' ? o.days : {}; }
  } catch (e) { /* storage blocked */ }
}
function persistDay(date) { if (S.mode === 'db') writer.write('day:' + date, R.days.doc(date), S.days[date]); else saveLocal(); }
function persistProfile() { if (S.mode === 'db') writer.write('profile', R.profile, S.profile); else saveLocal(); }
function persistLibrary() { if (S.mode === 'db') writer.write('library', R.library, S.library); else saveLocal(); }
function updateDay(date, fn) {
  const d = clone(getDay(date)); fn(d); d.date = date; d.updatedAt = Date.now();
  S.days[date] = d; persistDay(date); render();
}

/* ---------- maths ---------- */
function weightOn(date) {
  let bd = '', w = null;
  for (const d in S.days) { const x = S.days[d]; if (x && x.weight > 0 && d <= date && d > bd) { bd = d; w = x.weight; } }
  return { w: w ?? (S.profile ? S.profile.weight : 80), date: bd || null };
}
const bmrOf = (p, w) => 10 * w + 6.25 * p.height - 5 * p.age + (p.sex === 'k' ? -161 : 5);
const stepsKcal = (p, w, steps) => 0.5 * w * (steps * p.height * 0.00415 / 1000);
function woKcal(p, w, wo) {
  if (wo.source === 'watch') return Math.max(0, (wo.watchKcal || 0) - bmrOf(p, w) / 1440 * (wo.minutes || 0));
  const def = WORKOUTS[wo.type] || WORKOUTS.inne;
  const met = def.met[wo.intensity ?? 1] ?? def.met[1];
  return Math.max(0, (met - 1) * w * (wo.minutes || 0) / 60);
}
function calcFor(p, day, w) {
  const bmr = bmrOf(p, w), base = bmr * 1.2;
  const st = stepsKcal(p, w, day.steps || 0);
  const wk = (day.workouts || []).reduce((a, x) => a + woKcal(p, w, x), 0);
  const tdee = base + st + wk;
  let limit, floored = false;
  if (p.mode === 'fixed') limit = p.fixedKcal || 2000;
  else if (p.goalType === 'gain') limit = tdee + (p.surplus || 0);
  else if (p.goalType === 'keep') limit = tdee;
  else { limit = tdee - (p.deficit || 0); if (limit < bmr) { limit = bmr; floored = true; } }
  const prot = (p.proteinPerKg || 1.8) * (p.goal || w);
  const fat = limit * (p.fatPct || 25) / 100 / 9;
  const carb = Math.max(0, (limit - prot * 4 - fat * 9) / 4);
  return { w, bmr, base, st, wk, tdee, limit, floored, prot, fat, carb };
}
const calc = date => calcFor(S.profile, getDay(date), weightOn(date).w);
/* Words that depend on the goal: a limit when losing, a target when keeping or gaining. */
function goalWords(p) {
  if (p.goalType === 'gain') return { lim: 'cel', Lim: 'Cel', limGen: 'celu', left: 'kcal do zjedzenia', over: 'kcal ponad cel', overBad: false };
  if (p.goalType === 'keep') return { lim: 'cel', Lim: 'Cel', limGen: 'celu', left: 'kcal zostało', over: 'kcal ponad cel', overBad: true };
  return { lim: 'limit', Lim: 'Limit', limGen: 'limitu', left: 'kcal zostało', over: 'kcal ponad limit', overBad: true };
}
/* How a logged day went against its target. */
function dayStatus(p, eaten, limit) {
  const diff = eaten - limit;
  if (p.goalType === 'gain') {
    if (diff >= -150) return diff > 400 ? ['warn', 'dużo ponad'] : ['ok', 'w celu'];
    return diff >= -400 ? ['warn', 'trochę za mało'] : ['over', 'za mało'];
  }
  if (p.goalType === 'keep') {
    if (Math.abs(diff) <= 150) return ['ok', 'w normie'];
    if (Math.abs(diff) <= 350) return ['warn', diff > 0 ? 'lekko ponad' : 'trochę mniej'];
    return ['over', diff > 0 ? 'ponad' : 'za mało'];
  }
  if (diff <= 0) return ['ok', 'w limicie'];
  return diff <= 150 ? ['warn', 'lekko ponad'] : ['over', 'ponad'];
}
function greetingHtml(p, c, t, day) {
  if (S.date !== today()) return '';
  const h = new Date().getHours();
  const hello = h >= 5 && h < 11 ? 'Dzień dobry' : h >= 11 && h < 18 ? 'Cześć' : h >= 18 && h < 23 ? 'Dobry wieczór' : 'Jeszcze nie śpisz?';
  const W = goalWords(p), rem = c.limit - t.kcal, protLeft = c.prot - t.p;
  let sub;
  if (!countEntries(day)) {
    sub = h < 12 ? `Na dziś masz ${k0(c.limit)} kcal. Zacznij od śniadania.` : `Nic jeszcze nie wpisane. Na dziś masz ${k0(c.limit)} kcal.`;
  } else if (h >= 19) {
    if (p.goalType === 'gain') sub = rem > 150 ? `Jak minął dzień? Do celu brakuje jeszcze ${k0(rem)} kcal.` : 'Jak minął dzień? Cel na dziś osiągnięty.';
    else sub = rem >= 0 ? `Jak minął dzień? Jesteś w ${W.limGen}, zostało ${k0(rem)} kcal.` : `Jak minął dzień? Dziś ${k0(-rem)} kcal ponad ${W.lim}. Jutro nowy dzień.`;
  } else if (rem > 0) {
    sub = `${p.goalType === 'gain' ? 'Do zjedzenia jeszcze' : 'Zostało'} ${k0(rem)} kcal${protLeft > 5 ? ` i ${k0(protLeft)} g białka` : ''}.`;
  } else {
    sub = p.goalType === 'gain' ? 'Cel kalorii na dziś osiągnięty.' : `Na dziś ${W.lim} wykorzystany.`;
  }
  return `<div class="hello"><p class="hello-t">${hello}${p.name && h >= 5 && h < 23 ? ', ' + esc(p.name) : ''}</p><p class="hello-s">${sub}</p></div>`;
}
function entryTotals(e) {
  const f = e.portion ? 1 : (e.grams || 0) / 100;
  return { kcal: (e.kcal100 || 0) * f, p: (e.p100 || 0) * f, f: (e.f100 || 0) * f, c: (e.c100 || 0) * f };
}
function sumEntries(list) {
  const t = { kcal: 0, p: 0, f: 0, c: 0 };
  for (const e of list || []) { const x = entryTotals(e); t.kcal += x.kcal; t.p += x.p; t.f += x.f; t.c += x.c; }
  return t;
}
function dayTotals(day) { return sumEntries(MEALS.flatMap(([k]) => day.meals[k] || [])); }
const countEntries = day => MEALS.reduce((a, [k]) => a + (day.meals[k] || []).length, 0);
const per100 = (p, g) => ({ kcal: p.kcal100 * g / 100, p: p.p100 * g / 100, f: p.f100 * g / 100, c: p.c100 * g / 100 });
function recentPids() {
  const out = [];
  for (const d of Object.keys(S.days).sort().reverse().slice(0, 30)) {
    const day = getDay(d);
    for (const [k] of MEALS) for (const e of (day.meals[k] || []).slice().reverse()) if (e.pid && !out.includes(e.pid)) out.push(e.pid);
  }
  return out;
}

/* ---------- render ---------- */
function isTyping() {
  const a = document.activeElement;
  return !!(a && a.matches('input,textarea,select') && a.closest('.app'));
}
const ready = () => S.mode === 'local' || (S.mode === 'db' && S.loaded.profile && S.loaded.library);
function render() {
  renderSync();
  document.querySelectorAll('.tab').forEach(b => b.setAttribute('aria-current', b.dataset.tab === S.tab ? 'page' : 'false'));
  for (const v of ['today', 'history', 'library', 'profile']) $('#view-' + v).hidden = v !== S.tab;
  $('#datebar').hidden = S.tab !== 'today';
  renderDatebar();
  if (isTyping()) { S.deferRender = true; return; }
  S.deferRender = false;
  if (!ready()) { $('#view-' + S.tab).innerHTML = '<div class="empty"><p>Wczytuję Twój dziennik…</p></div>'; return; }
  if (S.tab === 'today') renderToday();
  else if (S.tab === 'history') renderHistory();
  else if (S.tab === 'library') renderLibrary();
  else renderProfile();
}
function renderSync() {
  const el = $('#sync');
  let state, text;
  if (S.mode === 'loading') { state = 'loading'; text = 'Wczytuję…'; }
  else if (S.mode === 'local') { state = 'ok'; text = 'Dane w telefonie'; }
  else if (writer.active()) { state = 'busy'; text = 'Zapisuję…'; }
  else { state = 'ok'; text = 'Zapisano'; }
  el.dataset.state = state; el.textContent = text;
}
function renderDatebar() {
  const d = S.date, t = today();
  const rel = d === t ? 'Dziś' : d === addDays(t, -1) ? 'Wczoraj' : d === addDays(t, 1) ? 'Jutro' : '';
  $('#date-rel').textContent = rel || cap(fmtDate(d, { weekday: 'long' }));
  $('#date-full').textContent = rel ? fmtDate(d, { weekday: 'long', day: 'numeric', month: 'long' }) : fmtDate(d, { day: 'numeric', month: 'long', year: 'numeric' });
  $('#go-today').hidden = d === t;
}
const setupHtml = () => `<section class="label"><h2>Zacznij od profilu</h2><hr class="rule thick"><p>Macroo policzy dzienne kalorie i białko z Twojego wieku, wzrostu, wagi i celu.</p><button type="button" class="primary wide" data-act="tab" data-tab="profile">Uzupełnij profil</button></section>`;

function macroRow(name, cls, val, target) {
  const pc = target > 0 ? Math.min(100, val / target * 100) : 0;
  return `<div class="mrow"><span class="mname"><i class="sw ${cls}" aria-hidden="true"></i>${name}</span><span class="mval"><b>${k0(val)}</b> / ${k0(target)} g</span></div><div class="mbar ${cls}"><span style="width:${pc.toFixed(1)}%"></span></div>`;
}
function entrySub(e) {
  const t = entryTotals(e);
  return `${e.portion ? 'porcja' : k0(e.grams) + ' g'} · B ${g1(t.p)} · T ${g1(t.f)} · W ${g1(t.c)}`;
}
function renderToday() {
  const el = $('#view-today');
  if (!S.profile) { el.innerHTML = setupHtml(); return; }
  const p = S.profile, date = S.date, day = getDay(date), c = calc(date), t = dayTotals(day);
  const W = goalWords(p);
  const rem = c.limit - t.kcal, over = rem < 0, overCls = over && W.overBad ? ' over' : '';
  const pct = c.limit > 0 ? Math.min(100, t.kcal / c.limit * 100) : 0;
  const move = c.st + c.wk;
  const adj = p.goalType === 'gain' ? ` + nadwyżka ${k0(p.surplus)}` : p.goalType === 'keep' ? '' : ` − deficyt ${k0(p.deficit)}`;
  const foot = p.mode === 'fixed'
    ? `${W.Lim} stały z profilu. Ruch dziś to ≈ ${k0(move)} kcal i nie zmienia ${W.limGen}.`
    : `${W.Lim} = podstawa ${k0(c.base)} + kroki ${k0(c.st)} + treningi ${k0(c.wk)}${adj}${c.floored ? `. Nie schodzi poniżej przemiany spoczynkowej (${k0(c.bmr)})` : ''}.`;

  const meals = MEALS.map(([k, l]) => {
    const list = day.meals[k] || []; const mt = sumEntries(list);
    const rows = list.map(e => `<li><button type="button" class="entry" data-act="edit-entry" data-meal="${k}" data-id="${esc(e.id)}"><span class="e-name">${esc(e.name)}</span><span class="e-sub">${entrySub(e)}</span><span class="e-kcal">${k0(entryTotals(e).kcal)}</span></button></li>`).join('');
    return `<div class="meal"><div class="meal-head"><h3>${l}</h3><span class="meal-kcal">${list.length ? k0(mt.kcal) + ' kcal' : ''}</span><button type="button" class="add" data-act="add-food" data-meal="${k}" aria-label="Dodaj do: ${l}">+</button></div>${list.length ? `<ul class="entries">${rows}</ul><button type="button" class="link" data-act="set-from-meal" data-meal="${k}">Zapisz jako danie</button>` : ''}</div>`;
  }).join('');

  const wos = day.workouts.map(wo => {
    const def = WORKOUTS[wo.type] || WORKOUTS.inne;
    const sub = wo.hcId
      ? (wo.source === 'watch' ? `Samsung Health · ${k0(wo.watchKcal)} kcal, bez spoczynkowych` : 'Samsung Health · szacunek')
      : wo.source === 'watch' ? `z zegarka ${k0(wo.watchKcal)} kcal, bez spoczynkowych` : `${INTENS[wo.intensity ?? 1].toLowerCase()}, szacunek`;
    return `<li><button type="button" class="entry" data-act="edit-wo" data-id="${esc(wo.id)}"><span class="e-name">${esc(def.label)} · ${k0(wo.minutes)} min</span><span class="e-sub">${sub}</span><span class="e-kcal plus">+${k0(woKcal(p, c.w, wo))}</span></button></li>`;
  }).join('');

  const wi = weightOn(date);
  const wHint = day.weight ? 'Zapisane. Limit liczy się z tej wagi.' : wi.date ? `Ostatni pomiar: ${g1(wi.w)} kg (${fmtDate(wi.date, { day: 'numeric', month: 'short' })}).` : `Na razie liczymy z wagi z profilu (${g1(p.weight)} kg).`;

  const banner = INSTALL.prompt && !isStandalone() && !INSTALL.dismissed
    ? `<div class="install-banner"><span>Zainstaluj Macroo jako aplikację z ikoną.</span><button type="button" class="primary sm" data-act="install">Zainstaluj</button><button type="button" class="x" data-act="install-dismiss" aria-label="Nie teraz">×</button></div>`
    : '';
  el.innerHTML = `${banner}${greetingHtml(p, c, t, day)}
  <section class="label" aria-label="Bilans dnia">
    <div class="label-head"><h2>Bilans dnia</h2><span class="label-tag">${p.mode === 'fixed' ? W.lim + ' stały' : W.lim + ' z ruchem'}</span></div>
    <hr class="rule thick">
    <div class="big"><span class="big-num${overCls}">${k0(Math.abs(rem))}</span><span class="big-cap">${over ? W.over : W.left}</span></div>
    <div class="meter${overCls}"><span style="width:${pct.toFixed(1)}%"></span></div>
    <div class="stat3"><div><b>${k0(c.limit)}</b><span>${W.lim}</span></div><div><b>${k0(t.kcal)}</b><span>zjedzone</span></div><div><b>+${k0(move)}</b><span>ruch</span></div></div>
    <hr class="rule mid">
    ${macroRow('Białko', 'prot', t.p, c.prot)}${macroRow('Tłuszcz', 'fat', t.f, c.fat)}${macroRow('Węglowodany', 'carb', t.c, c.carb)}
    <hr class="rule thick">
    <p class="label-foot">${foot}</p>
  </section>
  <h2 class="eyebrow">Posiłki</h2>
  <section>${meals}</section>
  <h2 class="eyebrow">Ruch</h2>
  <section class="card">
    ${hcBlockHtml()}
    <div class="move-total"><span class="muted small">${p.mode === 'fixed' ? 'Spalone ponad podstawę' : 'Dodane do ' + W.limGen}</span><b>+${k0(move)} kcal</b></div>
    <div class="inline-row"><label for="steps-in">Kroki</label><input id="steps-in" type="text" inputmode="numeric" autocomplete="off" value="${day.steps ? day.steps : ''}" placeholder="0"><span class="kc">≈ ${k0(c.st)} kcal${day.stepsSource === 'hc' ? ' · z zegarka' : ''}</span></div>
    ${wos ? `<ul class="entries" style="margin-top:8px">${wos}</ul>` : ''}
    <button type="button" class="btn-line wide" data-act="add-wo">+ Trening</button>
    <p class="hint">${NATIVE && S.hc.granted.length ? 'Brakuje danych z dziś? Otwórz na chwilę Samsung Health, a potem dotknij Odśwież.' : NATIVE ? 'Połącz Samsung Health, a kroki i treningi pobiorą się same.' : 'Kroki i kalorie z treningu przepisz z Samsung Health. Wyjaśnienie znajdziesz w zakładce Profil.'}</p>
  </section>
  <h2 class="eyebrow">Waga</h2>
  <section class="card">
    <div class="inline-row"><label for="weight-in">Waga</label><input id="weight-in" type="text" inputmode="decimal" autocomplete="off" value="${day.weight ? g1(day.weight) : ''}" placeholder="${g1(wi.w)}"><span class="kc">kg</span></div>
    <p class="hint">${wHint}</p>
  </section>`;
}

/* ---------- history ---------- */
function barChart(rows, p) {
  const W = 340, H = 170, pl = 32, pr = 6, pt = 10, pb = 20, iw = W - pl - pr, ih = H - pt - pb, n = rows.length;
  const maxV = Math.max(1500, ...rows.map(r => Math.max(r.eaten, r.limit))) * 1.06;
  const step = maxV > 3400 ? 1000 : 500;
  const top = Math.ceil(maxV / step) * step;
  const y = v => pt + ih - v / top * ih;
  const bw = iw / n, gap = Math.max(1, Math.min(6, bw * .28));
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Zjedzone kalorie i limit w kolejnych dniach">`;
  for (let v = 0; v <= top; v += step) s += `<line class="grid" x1="${pl}" x2="${W - pr}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/><text class="ax" x="${pl - 5}" y="${(y(v) + 3).toFixed(1)}" text-anchor="end">${v === 0 ? '0' : g1(v / 1000) + 'k'}</text>`;
  rows.forEach((r, i) => {
    const x = pl + i * bw + gap / 2, w = bw - gap;
    if (r.logged) s += `<rect class="${dayStatus(p, r.eaten, r.limit)[0] === 'ok' || (p.goalType === 'lose' && r.eaten <= r.limit) ? 'b-ok' : 'b-over'}" x="${x.toFixed(1)}" y="${y(r.eaten).toFixed(1)}" width="${w.toFixed(1)}" height="${(y(0) - y(r.eaten)).toFixed(1)}" rx="1.5"/>`;
    s += `<line class="tgt" x1="${(x - 1).toFixed(1)}" x2="${(x + w + 1).toFixed(1)}" y1="${y(r.limit).toFixed(1)}" y2="${y(r.limit).toFixed(1)}"/>`;
    const showLabel = n <= 7 || i % 5 === 0 || i === n - 1;
    if (showLabel) {
      const lab = n <= 7 ? fmtDate(r.d, { weekday: 'short' }).replace('.', '') : String(parseIso(r.d).getDate());
      s += `<text class="ax" x="${(x + w / 2).toFixed(1)}" y="${H - 6}" text-anchor="middle">${esc(lab)}</text>`;
    }
  });
  return s + '</svg>';
}
function weightChart() {
  const pts = Object.keys(S.days).filter(d => S.days[d] && S.days[d].weight > 0).sort().slice(-60).map(d => ({ d, w: S.days[d].weight }));
  if (pts.length < 2) return '<p class="muted small">Wpisuj wagę w zakładce Dziś. Wykres pojawi się po dwóch pomiarach.</p>';
  const W = 340, H = 150, pl = 32, pr = 30, pt = 14, pb = 20, iw = W - pl - pr, ih = H - pt - pb;
  const t0 = parseIso(pts[0].d).getTime(), t1 = parseIso(pts[pts.length - 1].d).getTime();
  const ws = pts.map(p => p.w), goal = S.profile.goal;
  let lo = Math.min(...ws) - .5, hi = Math.max(...ws) + .5;
  const showGoal = goal >= lo - 2 && goal <= hi;
  if (showGoal) lo = Math.min(lo, goal - .5);
  const span = hi - lo, step = span <= 5 ? 1 : span <= 12 ? 2 : 5;
  lo = Math.floor(lo / step) * step; hi = Math.ceil(hi / step) * step;
  const x = d => pl + (t1 === t0 ? iw / 2 : (parseIso(d).getTime() - t0) / (t1 - t0) * iw);
  const y = v => pt + ih - (v - lo) / (hi - lo) * ih;
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Waga w czasie">`;
  for (let v = lo; v <= hi + 1e-9; v += step) s += `<line class="grid" x1="${pl}" x2="${W - pr}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/><text class="ax" x="${pl - 5}" y="${(y(v) + 3).toFixed(1)}" text-anchor="end">${g1(v)}</text>`;
  if (showGoal) s += `<line class="goal" x1="${pl}" x2="${W - pr}" y1="${y(goal).toFixed(1)}" y2="${y(goal).toFixed(1)}"/><text class="goal-t" x="${W - pr + 3}" y="${(y(goal) + 3).toFixed(1)}">cel</text>`;
  s += `<polyline class="wl" points="${pts.map(p => `${x(p.d).toFixed(1)},${y(p.w).toFixed(1)}`).join(' ')}"/>`;
  pts.forEach((p, i) => { s += `<circle class="wp${i === pts.length - 1 ? ' last' : ''}" cx="${x(p.d).toFixed(1)}" cy="${y(p.w).toFixed(1)}" r="${i === pts.length - 1 ? 4 : 2.6}"/>`; });
  const last = pts[pts.length - 1];
  s += `<text class="wv" x="${(x(last.d) - 6).toFixed(1)}" y="${(y(last.w) - 8).toFixed(1)}" text-anchor="end">${g1(last.w)} kg</text>`;
  s += `<text class="ax" x="${pl}" y="${H - 6}">${esc(fmtDate(pts[0].d, { day: 'numeric', month: 'short' }))}</text><text class="ax" x="${W - pr}" y="${H - 6}" text-anchor="end">${esc(fmtDate(last.d, { day: 'numeric', month: 'short' }))}</text>`;
  return s + '</svg>';
}
function renderHistory() {
  const el = $('#view-history');
  if (!S.profile) { el.innerHTML = setupHtml(); return; }
  const n = S.histRange, end = today(), rows = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = addDays(end, -i), day = getDay(d), t = dayTotals(day), c = calc(d);
    rows.push({ d, eaten: t.kcal, limit: c.limit, tdee: c.tdee, logged: countEntries(day) > 0, prot: t.p });
  }
  const logged = rows.filter(r => r.logged);
  const avg = f => logged.length ? logged.reduce((a, r) => a + f(r), 0) / logged.length : 0;
  const avgE = avg(r => r.eaten), avgL = avg(r => r.limit), avgB = avg(r => r.eaten - r.tdee), avgP = avg(r => r.prot);
  const P = S.profile, W = goalWords(P), goal = P.goal, wNow = weightOn(end).w;
  const when = days => fmtDate(addDays(end, Math.round(days)), { day: 'numeric', month: 'long', year: 'numeric' });
  let fc;
  if (logged.length < 3) fc = `Prognoza pojawi się po 3 dniach z wpisami (masz ${logged.length}).`;
  else if (P.goalType === 'gain') {
    const kgw = avgB * 7 / 7700, left = goal - wNow;
    if (avgB < 50) fc = 'Średnio jesz mniej więcej tyle, ile spalasz, albo mniej. Przy takim bilansie waga nie wzrośnie.';
    else if (left <= 0) fc = `Cel ${g1(goal)} kg osiągnięty. Obecne tempo to ok. ${g1(kgw)} kg w górę tygodniowo.`;
    else fc = `Przy takim bilansie przybierasz ok. ${g1(kgw)} kg tygodniowo. ${g1(goal)} kg osiągniesz około ${when(left / (kgw / 7))}. Prognoza liczy tylko dni z wpisami.`;
  } else if (P.goalType === 'keep') {
    const kgw = avgB * 7 / 7700;
    fc = Math.abs(avgB) <= 100 ? 'Jesz mniej więcej tyle, ile spalasz. Waga powinna stać w miejscu.' : `Średnio ${avgB > 0 ? 'nadwyżka' : 'deficyt'} ${k0(Math.abs(avgB))} kcal dziennie, czyli ok. ${g1(Math.abs(kgw))} kg ${avgB > 0 ? 'w górę' : 'w dół'} tygodniowo.`;
  } else if (avgB > -50) fc = 'Średnio jesz mniej więcej tyle, ile spalasz, albo więcej. Waga przy takim bilansie raczej stoi.';
  else {
    const kgw = -avgB * 7 / 7700, left = wNow - goal;
    if (left <= 0) fc = `Cel ${g1(goal)} kg osiągnięty. Obecne tempo to ok. ${g1(kgw)} kg tygodniowo.`;
    else fc = `Przy takim bilansie chudniesz ok. ${g1(kgw)} kg tygodniowo. ${g1(goal)} kg osiągniesz około ${when(left / (kgw / 7))}. Prognoza liczy tylko dni z wpisami.`;
  }
  const balGood = P.goalType === 'gain' ? avgB >= 0 : P.goalType === 'keep' ? Math.abs(avgB) <= 150 : avgB <= 0;
  const dash = '–';
  const dayRow = r => {
    let cls = 'none', lab = 'brak wpisów';
    if (r.logged) [cls, lab] = dayStatus(P, r.eaten, r.limit);
    return `<li><button type="button" class="day-row" data-act="open-day" data-date="${r.d}"><span class="dr-date">${esc(fmtDate(r.d, { weekday: 'short' }).replace('.', ''))} ${esc(fmtDate(r.d, { day: '2-digit', month: '2-digit' }))}</span><span class="dr-k">${r.logged ? `${k0(r.eaten)} / ${k0(r.limit)} kcal` : dash}</span><span class="pill ${cls}">${lab}</span></button></li>`;
  };
  el.innerHTML = `
  <div class="h-head"><h2 class="h2">Historia</h2><div class="seg sm" role="group" aria-label="Zakres"><button type="button" aria-pressed="${n === 7}" data-act="hist-range" data-n="7">7 dni</button><button type="button" aria-pressed="${n === 30}" data-act="hist-range" data-n="30">30 dni</button></div></div>
  <section class="stats">
    <div class="stat"><span class="stat-l">Zjedzone</span><b>${logged.length ? k0(avgE) : dash}</b><span class="stat-u">kcal dziennie, średnio</span></div>
    <div class="stat"><span class="stat-l">${W.Lim}</span><b>${logged.length ? k0(avgL) : dash}</b><span class="stat-u">kcal dziennie, średnio</span></div>
    <div class="stat"><span class="stat-l">Bilans</span><b class="${logged.length ? (balGood ? 'good' : 'over') : ''}">${logged.length ? (avgB > 0 ? '+' : '−') + k0(Math.abs(avgB)) : dash}</b><span class="stat-u">kcal vs. spalone, dziennie</span></div>
    <div class="stat"><span class="stat-l">Białko</span><b>${logged.length ? k0(avgP) : dash}</b><span class="stat-u">g dziennie, cel ${k0(calc(end).prot)} g</span></div>
  </section>
  <p class="forecast">${fc}</p>
  <section class="card chart-card"><h3 class="card-t">Kalorie dzień po dniu</h3>${barChart(rows, P)}<div class="legend"><span><i class="lg-bar"></i>zjedzone</span><span><i class="lg-over"></i>${P.goalType === 'gain' ? 'poniżej celu' : P.goalType === 'keep' ? 'poza normą' : 'ponad limit'}</span><span><i class="lg-tgt"></i>${W.lim} dnia</span></div></section>
  <section class="card chart-card"><h3 class="card-t">Waga</h3>${weightChart()}</section>
  <h2 class="eyebrow">Dni</h2>
  <ul class="days">${rows.slice().reverse().map(dayRow).join('')}</ul>`;
}

/* ---------- library ---------- */
const LIB_OPEN_KEY = 'macroo.libOpen';
S.libOpen = (() => { try { return new Set(JSON.parse(localStorage.getItem(LIB_OPEN_KEY) || '[]')); } catch (e) { return new Set(); } })();
function grpHtml(key, title, count, inner, searching) {
  const open = searching || S.libOpen.has(key);
  const head = `<span class="grp-t">${title}</span><span class="grp-n">${count}</span><svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>`;
  return `<section class="grp${open ? ' open' : ''}">${searching
    ? `<div class="grp-head">${head}</div>`
    : `<button type="button" class="grp-head" data-act="lib-toggle" data-g="${esc(key)}" aria-expanded="${open}">${head}</button>`}${open ? `<div class="grp-body">${inner}</div>` : ''}</section>`;
}
function libListHtml() {
  const q = norm(S.libQuery);
  const sets = S.library.sets.filter(s => !q || norm(s.name).includes(q));
  const prods = S.library.products.filter(p => !q || norm(p.name).includes(q)).sort((a, b) => a.name.localeCompare(b.name, 'pl'));
  const groups = CATS.map(c => [c, prods.filter(p => catOf(p) === c)]).filter(([, l]) => l.length);
  const setRow = s => { const t = sumEntries(s.items); return `<li><button type="button" class="row" data-act="edit-set" data-sid="${esc(s.id)}"><span class="r-name">${esc(s.name)}</span><span class="r-sub">${s.items.map(i => esc(i.name)).join(', ')}</span><span class="r-k">${k0(t.kcal)} kcal</span></button></li>`; };
  const prodRow = p => `<li><button type="button" class="row" data-act="edit-prod" data-pid="${esc(p.id)}"><span class="r-name">${esc(p.name)}</span><span class="r-sub">B ${g1(p.p100)} · T ${g1(p.f100)} · W ${g1(p.c100)} na 100 g${p.portion ? ' · porcja ' + k0(p.portion) + ' g' : ''}</span><span class="r-k">${k0(p.kcal100)}</span></button></li>`;
  const searching = !!q;
  const dishes = (!searching || sets.length) ? grpHtml('__dishes', 'Moje dania', sets.length,
    sets.length ? `<ul class="rows">${sets.map(setRow).join('')}</ul>` : '<p class="muted small" style="margin:8px 0">Nie masz jeszcze dań. Utwórz pierwsze przyciskiem „+ Danie” albo z posiłku („Zapisz jako danie”).</p>', searching) : '';
  return `${dishes}
  <p class="lib-sub">Produkty · ${prods.length} · kcal na 100 g</p>
  ${groups.length ? groups.map(([c, l]) => grpHtml(c, c, l.length, `<ul class="rows">${l.map(prodRow).join('')}</ul>`, searching)).join('') : `<p class="muted small">${q ? 'Nic nie pasuje do wyszukiwania.' : 'Nie masz jeszcze produktów. Dodaj pierwszy przyciskiem „+ Produkt”.'}</p>`}`;
}
function renderLibrary() {
  $('#view-library').innerHTML = `
  <div class="h-head"><h2 class="h2">Produkty</h2><div class="btn-pair"><button type="button" class="ghost sm" data-act="set-new">+ Danie</button><button type="button" class="primary sm" data-act="lib-new">+ Produkt</button></div></div>
  <div class="field"><label for="lib-q" class="sr">Szukaj</label><input id="lib-q" type="search" placeholder="Szukaj w produktach i daniach" autocomplete="off" value="${esc(S.libQuery)}"></div>
  <div id="lib-list">${libListHtml()}</div>`;
}

/* ---------- profile ---------- */
function draftFrom(p) {
  if (!p) return { name: '', sex: 'm', age: '', height: '', weight: '', goal: '', goalType: 'lose', mode: 'dynamic', deficit: '400', surplus: '300', fixedKcal: '2200', proteinPerKg: '1.8', fatPct: '25' };
  return { name: p.name || '', sex: p.sex, age: String(p.age), height: String(p.height), weight: g1(p.weight), goal: g1(p.goal), goalType: p.goalType, mode: p.mode, deficit: String(p.deficit), surplus: String(p.surplus), fixedKcal: String(p.fixedKcal), proteinPerKg: String(p.proteinPerKg), fatPct: String(p.fatPct) };
}
function parsePd(d) {
  const goalType = ['lose', 'keep', 'gain'].includes(d.goalType) ? d.goalType : 'lose';
  const p = { name: String(d.name || '').trim().slice(0, 30), sex: d.sex === 'k' ? 'k' : 'm', age: num(d.age), height: num(d.height), weight: num(d.weight), goal: num(d.goal), goalType, mode: d.mode === 'fixed' ? 'fixed' : 'dynamic', deficit: numOr(d.deficit, 400), surplus: numOr(d.surplus, 300), fixedKcal: num(d.fixedKcal), proteinPerKg: numOr(d.proteinPerKg, 1.8), fatPct: numOr(d.fatPct, 25) };
  let err = '';
  if (!(p.age >= 14 && p.age <= 100)) err = 'Wpisz wiek (14–100 lat).';
  else if (!(p.height >= 120 && p.height <= 230)) err = 'Wpisz wzrost w cm (120–230).';
  else if (!(p.weight >= 35 && p.weight <= 250)) err = 'Wpisz wagę w kg (35–250).';
  else if (!(p.goal >= 35 && p.goal <= 250)) err = 'Wpisz wagę docelową w kg (35–250).';
  else if (p.mode === 'fixed' && !(p.fixedKcal >= 1000 && p.fixedKcal <= 6000)) err = `Wpisz ${goalType === 'lose' ? 'stały limit' : 'stały cel'} kalorii (1000–6000).`;
  if (!(p.fixedKcal >= 1000)) p.fixedKcal = 2200;
  return { p, err };
}
function profileSummary(d) {
  const { p, err } = parsePd(d);
  if (err) return `<p class="muted small" style="margin:4px 0">Uzupełnij dane, a tu pojawią się wyliczenia.</p>`;
  const w = S.profile ? weightOn(today()).w : p.weight;
  const c0 = calcFor(p, emptyDay(today()), w), c10 = calcFor(p, { ...emptyDay(today()), steps: 10000 }, w);
  const W = goalWords(p);
  const pace = p.mode !== 'dynamic' || p.goalType === 'keep' ? null : (p.goalType === 'gain' ? p.surplus : p.deficit) * 7 / 7700;
  let note = '';
  if (p.goalType === 'lose' && p.goal > p.weight + 0.4) note = 'Waga docelowa jest wyższa niż obecna. Jeśli chcesz przytyć, wybierz cel „Przytyć”.';
  else if (p.goalType === 'gain' && p.goal < p.weight - 0.4) note = 'Waga docelowa jest niższa niż obecna. Jeśli chcesz schudnąć, wybierz cel „Schudnąć”.';
  return `${note ? `<p class="goal-note">${note}</p>` : ''}<dl>
    <dt>Przemiana spoczynkowa</dt><dd>${k0(c0.bmr)} kcal</dd>
    <dt>Podstawa dnia (× 1,2)</dt><dd>${k0(c0.base)} kcal</dd>
    <dt>10 000 kroków</dt><dd>+${k0(c10.st)} kcal</dd>
    <dt class="key">${p.mode === 'fixed' ? W.Lim + ' (stały)' : W.Lim + ' przy 10 000 kroków'}</dt><dd class="key">${k0(c10.limit)} kcal</dd>
    <dt>Białko (${g1(p.proteinPerKg)} g × ${g1(p.goal)} kg)</dt><dd>${k0(c10.prot)} g</dd>
    ${pace !== null ? `<dt>Tempo przy ${p.goalType === 'gain' ? 'tej nadwyżce' : 'tym deficycie'}</dt><dd>≈ ${g1(pace)} kg/tydz. ${p.goalType === 'gain' ? 'w górę' : 'w dół'}</dd>` : ''}
  </dl>`;
}
function renderProfile() {
  const d = S.pd || (S.pd = draftFrom(S.profile));
  const f = (id, key, label, mode = 'decimal') => `<div class="field"><label for="${id}">${label}</label><input id="${id}" data-k="${key}" type="text" inputmode="${mode}" autocomplete="off" value="${esc(d[key])}"></div>`;
  const opt = (key, vals) => vals.map(([v, l]) => `<option value="${v}"${String(d[key]) === String(v) ? ' selected' : ''}>${l}</option>`).join('');
  const pace = v => g1(v * 7 / 7700).replace(/^0$/, '0,1');
  const goalLim = d.goalType === 'lose' ? 'Limit' : 'Cel';
  const installCard = INSTALL.prompt && !isStandalone()
    ? `<section class="card"><h3 class="card-t">Zainstaluj Macroo</h3><p>Dodaj Macroo do telefonu jako aplikację z własną ikoną. Będzie działać na pełnym ekranie i bez internetu.</p><button type="button" class="primary wide" data-act="install">Zainstaluj aplikację</button></section>`
    : '';
  $('#view-profile').innerHTML = `
  <h2 class="h2" style="margin-bottom:12px">Profil</h2>
  <form id="pf" class="form" novalidate>
    <div class="field"><label for="p-name">Imię (opcjonalnie, do powitania)</label><input id="p-name" data-k="name" type="text" autocomplete="given-name" maxlength="30" value="${esc(d.name)}"></div>
    <div class="field"><span class="flabel">Płeć</span><div class="seg" role="group" aria-label="Płeć"><button type="button" aria-pressed="${d.sex === 'm'}" data-act="pd-set" data-k="sex" data-v="m">Mężczyzna</button><button type="button" aria-pressed="${d.sex === 'k'}" data-act="pd-set" data-k="sex" data-v="k">Kobieta</button></div></div>
    <div class="grid2">${f('p-age', 'age', 'Wiek (lata)', 'numeric')}${f('p-height', 'height', 'Wzrost (cm)', 'numeric')}${f('p-weight', 'weight', 'Waga (kg)')}${f('p-goal', 'goal', 'Waga docelowa (kg)')}</div>
    <p class="hint" style="margin-top:-6px">Gdy wpisujesz wagę w zakładce Dziś, limit liczy się z ostatniego pomiaru.</p>
    <div class="field"><span class="flabel">Cel</span><div class="seg" role="group" aria-label="Cel"><button type="button" aria-pressed="${d.goalType === 'lose'}" data-act="pd-set" data-k="goalType" data-v="lose">Schudnąć</button><button type="button" aria-pressed="${d.goalType === 'keep'}" data-act="pd-set" data-k="goalType" data-v="keep">Utrzymać</button><button type="button" aria-pressed="${d.goalType === 'gain'}" data-act="pd-set" data-k="goalType" data-v="gain">Przytyć</button></div></div>
    <div class="field"><span class="flabel">${goalLim} kalorii</span><div class="seg" role="group" aria-label="Rodzaj ${goalLim === 'Limit' ? 'limitu' : 'celu'}"><button type="button" aria-pressed="${d.mode !== 'fixed'}" data-act="pd-set" data-k="mode" data-v="dynamic">Rośnie z ruchem</button><button type="button" aria-pressed="${d.mode === 'fixed'}" data-act="pd-set" data-k="mode" data-v="fixed">Stały</button></div></div>
    ${d.mode === 'fixed'
      ? f('p-fixed', 'fixedKcal', `${goalLim === 'Limit' ? 'Stały limit' : 'Stały cel'} (kcal)`, 'numeric')
      : d.goalType === 'lose'
        ? `<div class="field"><label for="p-deficit">Deficyt</label><select id="p-deficit" data-k="deficit">${opt('deficit', DEFICITS.map(v => [v, `${v} kcal · ${pace(v)} kg/tydz.${v === 300 || v === 400 ? ' · polecane' : ''}`]))}</select></div>`
        : d.goalType === 'gain'
          ? `<div class="field"><label for="p-surplus">Nadwyżka</label><select id="p-surplus" data-k="surplus">${opt('surplus', SURPLUSES.map(v => [v, `+${v} kcal · ${pace(v)} kg/tydz.${v === 300 ? ' · polecane' : ''}`]))}</select></div><p class="hint" style="margin-top:-6px">Najlepiej przybierać powoli i trenować siłowo. Wtedy rosną głównie mięśnie, a nie tłuszcz.</p>`
          : '<p class="hint" style="margin-top:-6px">Cel to tyle, ile spalasz w danym dniu, razem z krokami i treningami.</p>'}
    <div class="grid2">
      <div class="field"><label for="p-prot">Białko na kg celu</label><select id="p-prot" data-k="proteinPerKg">${opt('proteinPerKg', [[1.4, '1,4 g'], [1.6, '1,6 g'], [1.8, '1,8 g'], [2, '2,0 g'], [2.2, '2,2 g']])}</select></div>
      <div class="field"><label for="p-fat">Tłuszcz</label><select id="p-fat" data-k="fatPct">${opt('fatPct', [[20, '20% kalorii'], [25, '25% kalorii'], [30, '30% kalorii'], [35, '35% kalorii']])}</select></div>
    </div>
    <div id="p-sum" class="sum">${profileSummary(d)}</div>
    <p id="p-err" class="err" hidden></p>
    <button type="submit" class="primary wide">Zapisz profil</button>
  </form>
  <div class="stack">
    ${hcProfileHtml()}
    <section class="card"><h3 class="card-t">Kopia zapasowa</h3>
      <p>Wszystkie wpisy są zapisane tylko w tym telefonie. Rób kopię co jakiś czas, a zawsze przed zmianą telefonu albo czyszczeniem danych przeglądarki.</p>
      <div class="btn-row"><button type="button" class="ghost" data-act="backup-save">Zapisz kopię</button><label class="ghost filelabel" for="backup-file">Wczytaj kopię</label></div>
      <input type="file" id="backup-file" accept="application/json,.json" class="sr">
      ${S.pendingImport ? `<div class="confirm"><p><b>Wczytać kopię z pliku ${esc(S.pendingImport.fileName)}?</b> ${S.pendingImport.summary} Obecne dane w tym telefonie zostaną zastąpione.</p><div class="btn-row"><button type="button" class="ghost" data-act="backup-cancel">Anuluj</button><button type="button" class="primary" data-act="backup-apply">Wczytaj</button></div></div>` : ''}
    </section>
    ${installCard}
    <p class="hint" style="text-align:center">Macroo ${APP_VERSION}</p>
  </div>`;
}
function syncPd(t) {
  if (!S.pd || !t.dataset.k) return;
  S.pd[t.dataset.k] = t.value;
  const s = $('#p-sum'); if (s) s.innerHTML = profileSummary(S.pd);
}
function saveProfileForm() {
  const { p, err } = parsePd(S.pd || {});
  const e = $('#p-err');
  if (err) { e.textContent = err; e.hidden = false; return; }
  e.hidden = true;
  S.profile = normProfile({ ...(S.profile || {}), ...p });
  persistProfile();
  S.pd = draftFrom(S.profile);
  toast('Zapisano profil');
  if (document.activeElement) document.activeElement.blur();
  render();
}

/* ---------- sheets ---------- */
function openSheet(state) {
  SH = state; $('#sheet').hidden = false; document.documentElement.classList.add('locked'); renderSheet();
  const sh = $('.sheet'); if (sh) sh.scrollTop = 0;
}
function closeSheet() {
  if (SH && SH.ai && SH.ai.ctl) SH.ai.ctl.abort();
  SH = null; $('#sheet').hidden = true; document.documentElement.classList.remove('locked');
  if (S.deferRender) render();
}
const previewHtml = t => `<div><b>${k0(t.kcal)}</b> kcal</div><div>B ${g1(t.p)} g</div><div>T ${g1(t.f)} g</div><div>W ${g1(t.c)} g</div>`;
const fld = (id, label, val, mode = 'decimal') => `<div class="field"><label for="${id}">${label}</label><input id="${id}" type="text" inputmode="${mode}" autocomplete="off" value="${esc(val ?? '')}"></div>`;
const mealOptions = sel => MEALS.map(([k, l]) => `<option value="${k}"${k === sel ? ' selected' : ''}>${l}</option>`).join('');

function renderSheet() {
  if (!SH) return;
  let title = '', body = '';
  if (SH.kind === 'add') { title = 'Dodaj: ' + mealLabel(SH.meal); body = addBody(); }
  else if (SH.kind === 'entry') { const r = entryBody(); if (r === null) { closeSheet(); return; } title = 'Wpis'; body = r; }
  else if (SH.kind === 'wo') { title = SH.id ? 'Trening' : 'Nowy trening'; body = woBody(); }
  else if (SH.kind === 'prod') { title = SH.pid ? 'Produkt' : 'Nowy produkt'; body = prodBody(); }
  else if (SH.kind === 'setedit') { title = SH.sid ? 'Danie' : 'Nowe danie'; body = setEditBody(); }
  $('#sheet-title').textContent = title;
  $('#sheet-body').innerHTML = body;
}

/* add food */
function addBody() {
  if (SH.pick) return pickBody();
  if (SH.cfg) return cfgBody();
  const tabs = [['prod', 'Produkty i dania'], ['new', 'Nowy']];
  if (S.sample || SH.tab === 'ai') tabs.push(['ai', 'Asystent']);
  const head = `<div class="seg" role="tablist" aria-label="Sposób dodania">${tabs.map(([k, l]) => `<button type="button" role="tab" aria-selected="${SH.tab === k}" data-act="sh-tab" data-tab="${k}">${l}</button>`).join('')}</div>`;
  let pane;
  if (SH.tab === 'prod') pane = `<div class="field"><label for="sh-q" class="sr">Szukaj</label><input id="sh-q" type="search" placeholder="Szukaj produktu albo dania" autocomplete="off" value="${esc(SH.q || '')}"></div><div id="sh-list">${pickListHtml()}</div>`;
  else if (SH.tab === 'new') pane = newPaneHtml();
  else pane = aiPaneHtml();
  return head + `<div class="pane">${pane}</div>`;
}
function recentDishes() {
  const out = [];
  for (const d of Object.keys(S.days).sort().reverse().slice(0, 30)) {
    const day = getDay(d);
    for (const [k] of MEALS) for (const e of (day.meals[k] || [])) if (e.dish && !out.includes(e.dish)) out.push(e.dish);
  }
  return out;
}
function dishRowsHtml(q) {
  const rd = recentDishes();
  const list = S.library.sets.filter(x => !q || norm(x.name).includes(q)).sort((a, b) => {
    const ia = rd.indexOf(a.id), ib = rd.indexOf(b.id);
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 1e9 : ia) - (ib === -1 ? 1e9 : ib);
    return a.name.localeCompare(b.name, 'pl');
  });
  if (!list.length) return '';
  return `<h3 class="eyebrow list-h">Moje dania</h3><ul class="rows">${list.map(x => `<li><button type="button" class="row" data-act="add-set" data-sid="${esc(x.id)}"><span class="r-name">${esc(x.name)}</span><span class="r-sub"><span class="tag">Dostosuj</span> ${x.items.map(i => esc(i.name)).join(', ')}</span><span class="r-k">${k0(sumEntries(x.items).kcal)}</span></button></li>`).join('')}</ul>`;
}
function pickListHtml() {
  const all = S.library.products;
  const q = norm(SH.q || ''), rec = recentPids();
  const dishes = dishRowsHtml(q);
  if (!all.length && !dishes) return '<p class="muted small">Nie masz jeszcze produktów. Dodaj pierwszy w zakładce „Nowy” albo zapytaj asystenta.</p>';
  const list = all.filter(p => !q || norm(p.name).includes(q)).sort((a, b) => {
    const ia = rec.indexOf(a.id), ib = rec.indexOf(b.id);
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 1e9 : ia) - (ib === -1 ? 1e9 : ib);
    return a.name.localeCompare(b.name, 'pl');
  });
  if (!list.length && !dishes) return `<p class="muted small">Nic nie pasuje do „${esc(SH.q)}”. <button type="button" class="link" data-act="sh-tab" data-tab="new">Dodaj nowy produkt</button></p>`;
  return `${dishes}${list.length ? `${dishes ? '<h3 class="eyebrow list-h">Produkty</h3>' : ''}<ul class="rows">${list.map(p => `<li><button type="button" class="row" data-act="pick" data-pid="${esc(p.id)}"><span class="r-name">${esc(p.name)}</span><span class="r-sub">${rec.includes(p.id) ? 'ostatnio · ' : ''}${k0(p.kcal100)} kcal na 100 g${p.portion ? ' · porcja ' + k0(p.portion) + ' g' : ''}</span><span class="r-k">${p.portion ? k0(p.kcal100 * p.portion / 100) : k0(p.kcal100)}</span></button></li>`).join('')}</ul>` : ''}`;
}
function pickBody() {
  const p = SH.pick, g = Number.isFinite(SH.pickG) ? SH.pickG : (p.portion || 100);
  const chips = [...new Set([p.portion, 50, 100, 150, 200].filter(v => v > 0))];
  return `<button type="button" class="back" data-act="pick-back">‹ Wróć do listy</button>
  <h3 class="pick-name">${esc(p.name)}</h3>
  <p class="muted small" style="margin:-6px 0 0">Na 100 g: ${k0(p.kcal100)} kcal · B ${g1(p.p100)} g · T ${g1(p.f100)} g · W ${g1(p.c100)} g</p>
  ${fld('pick-g', 'Ile zjadłeś (g)', g1(g))}
  <div class="chips">${chips.map(v => `<button type="button" class="chip" data-act="pick-g" data-g="${v}">${v === p.portion ? 'Porcja ' : ''}${k0(v)} g</button>`).join('')}</div>
  <div id="pick-prev" class="preview">${previewHtml(per100(p, g))}</div>
  <p id="pick-err" class="err" hidden></p>
  <button type="button" class="primary wide" data-act="pick-add">Dodaj do: ${mealLabel(SH.meal)}</button>`;
}
function newPaneHtml() {
  const d = SH.draft, quick = SH.quick;
  const seg = `<div class="seg sm" role="group" aria-label="Rodzaj wpisu"><button type="button" aria-pressed="${!quick}" data-act="new-mode" data-q="0">Wartości na 100 g</button><button type="button" aria-pressed="${quick}" data-act="new-mode" data-q="1">Tylko porcja</button></div>`;
  const name = `<div class="field"><label for="nf-name">Nazwa</label><input id="nf-name" type="text" autocomplete="off" value="${esc(d['nf-name'] || '')}" placeholder="np. Jogurt naturalny Piątnica"></div>`;
  const body = quick
    ? `<p class="muted small" style="margin:0">Gdy znasz tylko kalorie całej porcji, np. z menu restauracji.</p><div class="grid4">${fld('nq-kcal', 'kcal', d['nq-kcal'])}${fld('nq-p', 'Białko g', d['nq-p'])}${fld('nq-f', 'Tłuszcz g', d['nq-f'])}${fld('nq-c', 'Węgle g', d['nq-c'])}</div>`
    : `<p class="muted small" style="margin:0">Przepisz kolumnę „w 100 g” z etykiety.</p><div class="grid4">${fld('nf-kcal', 'kcal', d['nf-kcal'])}${fld('nf-p', 'Białko g', d['nf-p'])}${fld('nf-f', 'Tłuszcz g', d['nf-f'])}${fld('nf-c', 'Węgle g', d['nf-c'])}</div>
       ${fld('nf-g', 'Ile zjadłeś (g)', d['nf-g'])}
       <label class="check"><input type="checkbox" id="nf-save"${d['nf-save'] === false ? '' : ' checked'}> Zapisz w moich produktach</label>`;
  return `${seg}${name}${body}<div id="new-prev" class="preview">${previewHtml(newTotals())}</div><p id="new-err" class="err" hidden></p><button type="button" class="primary wide" data-act="new-add">Dodaj do: ${mealLabel(SH.meal)}</button>`;
}
function newTotals() {
  const d = SH.draft;
  if (SH.quick) return { kcal: numOr(d['nq-kcal'], 0), p: numOr(d['nq-p'], 0), f: numOr(d['nq-f'], 0), c: numOr(d['nq-c'], 0) };
  const g = numOr(d['nf-g'], 0);
  return per100({ kcal100: numOr(d['nf-kcal'], 0), p100: numOr(d['nf-p'], 0), f100: numOr(d['nf-f'], 0), c100: numOr(d['nf-c'], 0) }, g);
}
function aiPaneHtml() {
  const A = SH.ai;
  if (!S.sample) return `<p class="muted small">${esc(A.status || 'Asystent jest niedostępny w tym widoku.')}</p>`;
  const img = S.sampleImages
    ? `<label class="filebtn"><input type="file" id="ai-file" accept="${esc((S.sampleImages.mediaTypes || ['image/jpeg', 'image/png']).join(','))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg><span>${A.file ? 'Zdjęcie: ' + esc(A.file.name || 'wybrane') : 'Dodaj zdjęcie etykiety albo talerza'}</span></label>${A.file ? '<button type="button" class="link" data-act="ai-file-clear">Usuń zdjęcie</button>' : ''}`
    : '';
  let res = '';
  if (A.items && A.items.length) {
    res = `<ul class="ai-items">${A.items.map((it, i) => `<li><label class="check"><input type="checkbox" data-ai-i="${i}"${it.on ? ' checked' : ''}><span>${esc(it.name)}</span></label><div class="ai-g"><input type="text" inputmode="decimal" data-ai-g="${i}" value="${g1(it.grams)}" aria-label="Gramy: ${esc(it.name)}"><span>g</span></div><span class="ai-k" id="ai-k-${i}">${k0(it.kcal100 * it.grams / 100)} kcal</span><span class="ai-sub">na 100 g: ${k0(it.kcal100)} kcal · B ${g1(it.p100)} · T ${g1(it.f100)} · W ${g1(it.c100)}</span></li>`).join('')}</ul>
    ${A.note ? `<p class="muted small" style="margin:0">${esc(A.note)}</p>` : ''}
    <label class="check"><input type="checkbox" id="ai-save"${A.save === false ? '' : ' checked'}> Zapisz w moich produktach</label>
    <button type="button" class="primary wide" data-act="ai-add">Dodaj zaznaczone do: ${mealLabel(SH.meal)}</button>`;
  }
  return `<div class="field"><label for="ai-text">Co zjadłeś?</label><textarea id="ai-text" rows="3" placeholder="np. pierogi ruskie 300 g z łyżką masła">${esc(A.text)}</textarea></div>
  ${img}
  <div class="btn-row"><button type="button" class="primary" data-act="ai-run"${A.busy ? ' disabled' : ''}>${A.busy ? 'Liczę…' : 'Policz'}</button>${A.busy ? '<button type="button" class="ghost" data-act="ai-stop">Stop</button>' : ''}</div>
  ${A.status ? `<p class="muted small" style="margin:0" aria-live="polite">${esc(A.status)}</p>` : ''}
  ${res}
  <p class="hint">Asystent szacuje wartości. Liczby z etykiety są dokładniejsze. Każde zapytanie zużywa limit Twojego konta Claude.</p>`;
}
function cleanAi(it) {
  if (!it || typeof it !== 'object') return null;
  const name = String(it.name || '').trim().slice(0, 80);
  const kcal100 = num(it.kcal100);
  if (!name || !(kcal100 >= 0 && kcal100 <= 950)) return null;
  const clamp = (v, hi) => { const x = num(v); return Number.isFinite(x) ? Math.min(hi, Math.max(0, x)) : 0; };
  let grams = num(it.grams); if (!(grams > 0 && grams <= 5000)) grams = 100;
  return { name, grams: Math.round(grams), kcal100: Math.round(kcal100), p100: clamp(it.p100, 100), f100: clamp(it.f100, 100), c100: clamp(it.c100, 100), on: true };
}
function aiErr(e) {
  const c = e && e.code;
  if (c === 'cancelled') return '';
  if (['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'].includes(c)) return 'Asystent jest wyłączony w tym widoku. Dodaj produkt ręcznie w zakładce „Nowy”.';
  if (c === 'rate_limited') return 'Za dużo zapytań naraz albo wyczerpany limit konta. Spróbuj za chwilę.';
  if (c === 'session_expired') return 'Sesja wygasła. Zaloguj się ponownie do Claude.';
  if (c === 'invalid_json' || c === 'empty_completion') return 'Nie udało się odczytać odpowiedzi. Opisz posiłek prościej i spróbuj ponownie.';
  if (c === 'refused') return 'Asystent nie odpowie na ten opis. Zmień opis.';
  if (c === 'image_rejected') return 'Tego zdjęcia nie da się użyć. Wybierz inne (JPG albo PNG).';
  if (c === 'images_unavailable') return 'Zdjęcia nie działają w tym widoku. Opisz posiłek słowami.';
  if (c === 'prompt_too_large') return 'Opis jest za długi. Skróć go.';
  return 'Coś poszło nie tak po drodze. Spróbuj ponownie.';
}
async function aiRun() {
  const ref = SH, A = SH.ai;
  if (!S.sample) return;
  const text = (A.text || '').trim();
  if (!text && !A.file) { A.status = 'Opisz posiłek albo dodaj zdjęcie.'; renderSheet(); return; }
  A.ctl = new AbortController(); A.busy = true; A.items = null; A.note = '';
  A.status = 'Liczę. Pierwsza odpowiedź może zająć kilkanaście sekund.';
  renderSheet();
  const prompt = `Jesteś asystentem do liczenia kalorii. Użytkownik opisał, co zjadł${A.file ? ', i dołączył zdjęcie (tabela wartości odżywczych z etykiety albo talerz z jedzeniem)' : ''}.
Rozbij posiłek na składniki. Dla każdego podaj zjedzoną ilość w gramach oraz wartości na 100 g.
Zasady:
- Jeśli na zdjęciu jest tabela wartości odżywczych, przepisz wartości na 100 g z etykiety.
- Jeśli ilość nie jest podana, przyjmij typową porcję i napisz o tym w "note".
- Łyżka oleju lub oliwy to ok. 10 g, łyżeczka ok. 5 g, łyżka masła ok. 12 g.
- Nazwy po polsku, krótkie (do 6 słów).
Odpowiedz wyłącznie obiektem JSON w formacie:
{"items":[{"name":"Pierogi z mięsem","grams":250,"kcal100":278,"p100":11,"f100":15,"c100":24}],"note":"krótko, po polsku, jakie przyjąłeś założenia"}

Opis użytkownika: ${text || '(brak opisu, oceń ze zdjęcia)'}`;
  const opts = { signal: A.ctl.signal };
  if (A.file) opts.images = [A.file];
  try {
    const res = await S.sample.json(prompt, opts);
    if (SH !== ref) return;
    const items = (res && Array.isArray(res.items) ? res.items : []).map(cleanAi).filter(Boolean);
    A.items = items;
    A.note = res && typeof res.note === 'string' ? res.note.slice(0, 400) : '';
    A.status = items.length ? '' : 'Asystent nie rozpoznał produktów. Opisz posiłek dokładniej.';
  } catch (e) {
    if (SH !== ref) return;
    A.status = aiErr(e);
    const c = e && e.code;
    if (['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'].includes(c)) S.sample = null;
    if (c === 'images_unavailable') { S.sampleImages = null; A.file = null; }
  } finally {
    if (SH === ref) { A.busy = false; A.ctl = null; renderSheet(); }
  }
}
function findProductByName(name) { const n = norm(name); return S.library.products.find(p => norm(p.name) === n); }

/* entry edit */
function currentEntry() { const list = getDay(S.date).meals[SH.meal] || []; return list.find(x => x.id === SH.id) || null; }
function entryDraftTotals() {
  const e = SH.e, d = SH.draft;
  if (e.portion) return { kcal: numOr(d['ee-kcal'] ?? e.kcal100, 0), p: numOr(d['ee-p'] ?? e.p100, 0), f: numOr(d['ee-f'] ?? e.f100, 0), c: numOr(d['ee-c'] ?? e.c100, 0) };
  return per100(e, numOr(d['ee-g'] ?? e.grams, 0));
}
function entryBody() {
  const live = currentEntry(); if (!live) return null;
  if (!SH.e) SH.e = clone(live);
  const e = SH.e, d = SH.draft;
  const vals = e.portion
    ? `<div class="grid4">${fld('ee-kcal', 'kcal', d['ee-kcal'] ?? g1(e.kcal100))}${fld('ee-p', 'Białko g', d['ee-p'] ?? g1(e.p100))}${fld('ee-f', 'Tłuszcz g', d['ee-f'] ?? g1(e.f100))}${fld('ee-c', 'Węgle g', d['ee-c'] ?? g1(e.c100))}</div>`
    : `${fld('ee-g', 'Ilość (g)', d['ee-g'] ?? g1(e.grams))}<p class="muted small" style="margin:-6px 0 0">Na 100 g: ${k0(e.kcal100)} kcal · B ${g1(e.p100)} · T ${g1(e.f100)} · W ${g1(e.c100)}</p>`;
  return `<div class="field"><label for="ee-name">Nazwa</label><input id="ee-name" type="text" autocomplete="off" value="${esc(d['ee-name'] ?? e.name)}"></div>
  ${vals}
  <div class="field"><label for="ee-meal">Posiłek</label><select id="ee-meal">${mealOptions(d['ee-meal'] ?? SH.meal)}</select></div>
  <div id="ee-prev" class="preview">${previewHtml(entryDraftTotals())}</div>
  <p id="ee-err" class="err" hidden></p>
  <div class="btn-row"><button type="button" class="danger" data-act="entry-del">Usuń</button><button type="button" class="primary" data-act="entry-save">Zapisz</button></div>`;
}

/* workouts */
function woPreview() {
  const p = S.profile, w = weightOn(S.date).w;
  const wo = { type: SH.type, intensity: SH.intensity, minutes: numOr(SH.minutes, 0), source: SH.source, watchKcal: numOr(SH.watchKcal, 0) };
  const kc = woKcal(p, w, wo);
  let how;
  if (wo.source === 'watch') how = `${k0(wo.watchKcal)} z zegarka − ${k0(bmrOf(p, w) / 1440 * wo.minutes)} spoczynkowych`;
  else { const met = (WORKOUTS[wo.type] || WORKOUTS.inne).met[wo.intensity]; how = `(MET ${g1(met)} − 1) × ${g1(w)} kg × ${k0(wo.minutes)} min`; }
  return `<b>≈ ${k0(kc)} kcal</b><span>${p.mode === 'fixed' ? 'spalone ponad podstawę (limit stały się nie zmienia)' : 'dodane do dzisiejszego limitu'}</span><small>${how}</small>`;
}
function woBody() {
  const note = (WORKOUTS[SH.type] || {}).note;
  return `<div class="field"><span class="flabel">Rodzaj</span><div class="chips">${Object.entries(WORKOUTS).map(([k, v]) => `<button type="button" class="chip" aria-pressed="${SH.type === k}" data-act="wo-type" data-v="${k}">${v.label}</button>`).join('')}</div></div>
  ${fld('wo-min', 'Czas (min)', SH.minutes, 'numeric')}
  <label class="check"><input type="checkbox" id="wo-watch"${SH.source === 'watch' ? ' checked' : ''}> Mam kalorie z zegarka</label>
  ${SH.source === 'watch'
    ? fld('wo-kcal', 'Kalorie z zegarka (kcal)', SH.watchKcal, 'numeric')
    : `<div class="field"><span class="flabel">Intensywność</span><div class="seg" role="group" aria-label="Intensywność">${INTENS.map((l, i) => `<button type="button" aria-pressed="${SH.intensity === i}" data-act="wo-int" data-v="${i}">${l}</button>`).join('')}</div></div>`}
  ${note ? `<p class="hint" style="margin:0">${note}</p>` : ''}
  <div id="wo-prev" class="preview one">${woPreview()}</div>
  <p id="wo-err" class="err" hidden></p>
  <div class="btn-row">${SH.id ? '<button type="button" class="danger" data-act="wo-del">Usuń</button>' : ''}<button type="button" class="primary" data-act="wo-save">Zapisz trening</button></div>`;
}

/* products */
function prodBody() {
  const d = SH.draft;
  return `<div class="field"><label for="pe-name">Nazwa</label><input id="pe-name" type="text" autocomplete="off" value="${esc(d['pe-name'] ?? '')}" placeholder="np. Twaróg półtłusty"></div>
  <div class="field"><label for="pe-cat">Kategoria</label><select id="pe-cat"><option value=""${d['pe-cat'] ? '' : ' selected'}>Automatycznie z nazwy</option>${CATS.map(c => `<option value="${c}"${d['pe-cat'] === c ? ' selected' : ''}>${c}</option>`).join('')}</select></div>
  <p class="muted small" style="margin:0">Wartości na 100 g, z etykiety.</p>
  <div class="grid4">${fld('pe-kcal', 'kcal', d['pe-kcal'])}${fld('pe-p', 'Białko g', d['pe-p'])}${fld('pe-f', 'Tłuszcz g', d['pe-f'])}${fld('pe-c', 'Węgle g', d['pe-c'])}</div>
  ${fld('pe-portion', 'Typowa porcja (g, opcjonalnie)', d['pe-portion'])}
  ${SH.pid ? '<p class="hint" style="margin:0">Zmiana nie wpływa na wcześniejsze wpisy w dzienniku.</p>' : ''}
  <p id="pe-err" class="err" hidden></p>
  <div class="btn-row">${SH.pid ? `<button type="button" class="danger" data-act="prod-del">${SH.confirmDel ? 'Na pewno usunąć?' : 'Usuń'}</button>` : ''}<button type="button" class="primary" data-act="prod-save">Zapisz</button></div>`;
}

/* sets: shared ingredient editor (set editor in Produkty, set configuration when adding to a meal) */
const ingState = () => SH && (SH.kind === 'setedit' ? SH : SH.cfg);
const ingItems = () => { const st = ingState(); return st ? st.items : null; };
function altsFor(it) {
  if (it.portion) return [];
  const cat = catOfItem(it);
  if (cat === 'Inne') return [];
  return S.library.products.filter(p => catOf(p) === cat).sort((a, b) => a.name.localeCompare(b.name, 'pl'));
}
const ingSub = it => { const t = entryTotals(it); return `${k0(t.kcal)} kcal · B ${g1(t.p)} · T ${g1(t.f)} · W ${g1(t.c)}`; };
function ingRowsHtml(items) {
  if (!items.length) return '<p class="muted small" style="margin:0">Brak składników. Dodaj pierwszy przyciskiem poniżej.</p>';
  return `<ul class="ing">${items.map((it, i) => {
    const alts = altsFor(it), inLib = alts.some(p => p.id === it.pid);
    const nameEl = alts.length > 1 || (alts.length && !inLib)
      ? `<select class="ing-sel" data-ing-alt="${i}" aria-label="Rodzaj: ${esc(it.name)}">${inLib ? '' : `<option value="" selected>${esc(it.name)}</option>`}${alts.map(p => `<option value="${esc(p.id)}"${p.id === it.pid ? ' selected' : ''}>${esc(p.name)} · ${k0(p.kcal100)} kcal</option>`).join('')}</select>`
      : `<span class="ing-name">${esc(it.name)}</span>`;
    const grams = it.portion ? '<span class="muted small">porcja</span>'
      : `<div class="ing-g"><input type="text" inputmode="decimal" data-ing-g="${i}" value="${g1(it.grams)}" aria-label="Gramy: ${esc(it.name)}"><span>g</span></div>`;
    return `<li><div class="ing-main">${nameEl}<span class="ing-sub" id="ing-k-${i}">${ingSub(it)}</span></div>${grams}<button type="button" class="x" data-act="ing-rm" data-i="${i}" aria-label="Usuń: ${esc(it.name)}">×</button></li>`;
  }).join('')}</ul>`;
}
function ingPickListHtml(q) {
  const nq = norm(q || '');
  const list = S.library.products.filter(p => !nq || norm(p.name).includes(nq))
    .sort((a, b) => CATS.indexOf(catOf(a)) - CATS.indexOf(catOf(b)) || a.name.localeCompare(b.name, 'pl'));
  if (!list.length) return '<p class="muted small">Nic nie pasuje. Nowy produkt dodasz w zakładce Produkty.</p>';
  return `<ul class="rows">${list.map(p => `<li><button type="button" class="row" data-act="ing-add" data-pid="${esc(p.id)}"><span class="r-name">${esc(p.name)}</span><span class="r-sub">${catOf(p)} · ${k0(p.kcal100)} kcal na 100 g</span><span class="r-k">+</span></button></li>`).join('')}</ul>`;
}
function ingPickerHtml(label) {
  const st = ingState();
  if (!st.picking) return `<button type="button" class="btn-line wide" data-act="ing-pick">+ ${label}</button>`;
  return `<div class="ing-pick"><div class="ing-pick-head"><b>${label}</b><button type="button" class="link" data-act="ing-pick-close">Zamknij</button></div>
    <label for="ing-q" class="sr">Szukaj produktu</label><input id="ing-q" type="search" placeholder="Szukaj, np. ser, pomidor, majonez" autocomplete="off" value="${esc(st.q || '')}">
    <div id="ing-list">${ingPickListHtml(st.q)}</div></div>`;
}
function setEditBody() {
  return `<div class="field"><label for="se-name">Nazwa dania</label><input id="se-name" type="text" autocomplete="off" value="${esc(SH.name)}" placeholder="np. Kanapka z kiełbasą"></div>
  <p class="muted small" style="margin:0">Ustaw domyślne składniki i wagę. Przy dodawaniu do posiłku w ekranie „Dostosuj” zmienisz rodzaj chleba czy wędliny, wagę i dodatki.</p>
  ${ingRowsHtml(SH.items)}
  ${ingPickerHtml('Składnik')}
  <div id="ing-prev" class="preview">${previewHtml(sumEntries(SH.items))}</div>
  <p id="se-err" class="err" hidden></p>
  <div class="btn-row">${SH.sid ? `<button type="button" class="danger" data-act="set-del">${SH.confirmDel ? 'Na pewno usunąć?' : 'Usuń'}</button>` : ''}<button type="button" class="primary" data-act="set-save">${SH.sid ? 'Zapisz' : 'Zapisz danie'}</button></div>`;
}
function cfgBody() {
  const c = SH.cfg;
  return `<button type="button" class="back" data-act="cfg-back">‹ Wróć do listy</button>
  <p class="eyebrow" style="margin:0">Dostosuj</p>
  <h3 class="pick-name" style="margin-top:-8px">${esc(c.name)}</h3>
  <p class="muted small" style="margin:-6px 0 0">Zmień rodzaj albo gramaturę i dołóż dodatki. To dotyczy tylko tego posiłku, chyba że zaznaczysz zapamiętanie.</p>
  ${ingRowsHtml(c.items)}
  ${ingPickerHtml('Dodatek')}
  <div id="ing-prev" class="preview">${previewHtml(sumEntries(c.items))}</div>
  <label class="check"><input type="checkbox" id="cfg-remember"${c.remember ? ' checked' : ''}> Zapamiętaj zmiany w tym daniu</label>
  <p id="cfg-err" class="err" hidden></p>
  <button type="button" class="primary wide" data-act="cfg-add">Dodaj do: ${mealLabel(SH.meal)}</button>`;
}
const itemFromProduct = (p, grams) => ({ id: uid(), pid: p.id, name: p.name, grams, portion: false, kcal100: p.kcal100, p100: p.p100, f100: p.f100, c100: p.c100 });

function showErr(id, msg) { const e = $('#' + id); if (e) { e.textContent = msg; e.hidden = false; } }

function sheetInput(t) {
  if (!SH) return;
  const id = t.id;
  const items = ingItems();
  if (items) {
    if (t.dataset.ingG !== undefined) {
      const i = +t.dataset.ingG, it = items[i]; if (!it) return;
      const g = num(t.value); it.grams = g > 0 ? Math.round(g * 10) / 10 : 0;
      const k = $('#ing-k-' + i); if (k) k.textContent = ingSub(it);
      const pv = $('#ing-prev'); if (pv) pv.innerHTML = previewHtml(sumEntries(items));
      return;
    }
    if (t.dataset.ingAlt !== undefined) {
      const it = items[+t.dataset.ingAlt], np = t.value ? prodById(t.value) : null;
      if (it && np && np.id !== it.pid) { Object.assign(it, { pid: np.id, name: np.name, kcal100: np.kcal100, p100: np.p100, f100: np.f100, c100: np.c100 }); renderSheet(); }
      return;
    }
    if (id === 'ing-q') { ingState().q = t.value; const l = $('#ing-list'); if (l) l.innerHTML = ingPickListHtml(t.value); return; }
    if (id === 'se-name') { SH.name = t.value; return; }
    if (id === 'cfg-remember') { SH.cfg.remember = t.checked; return; }
  }
  if (SH.kind === 'add') {
    if (id === 'sh-q') { SH.q = t.value; $('#sh-list').innerHTML = pickListHtml(); return; }
    if (id === 'pick-g') { SH.pickG = num(t.value); $('#pick-prev').innerHTML = previewHtml(per100(SH.pick, Number.isFinite(SH.pickG) ? SH.pickG : 0)); return; }
    if (id.startsWith('nf-') || id.startsWith('nq-')) { SH.draft[id] = t.type === 'checkbox' ? t.checked : t.value; const pv = $('#new-prev'); if (pv) pv.innerHTML = previewHtml(newTotals()); return; }
    if (id === 'ai-text') { SH.ai.text = t.value; return; }
    if (id === 'ai-save') { SH.ai.save = t.checked; return; }
    if (t.dataset.aiG !== undefined) { const i = +t.dataset.aiG, it = SH.ai.items && SH.ai.items[i]; if (it) { const g = num(t.value); it.grams = g > 0 ? g : 0; const k = $('#ai-k-' + i); if (k) k.textContent = k0(it.kcal100 * it.grams / 100) + ' kcal'; } return; }
    if (t.dataset.aiI !== undefined) { const it = SH.ai.items && SH.ai.items[+t.dataset.aiI]; if (it) it.on = t.checked; return; }
  }
  if (SH.kind === 'entry') { SH.draft[id] = t.value; const pv = $('#ee-prev'); if (pv) pv.innerHTML = previewHtml(entryDraftTotals()); return; }
  if (SH.kind === 'wo') { if (id === 'wo-min') SH.minutes = t.value; else if (id === 'wo-kcal') SH.watchKcal = t.value; const pv = $('#wo-prev'); if (pv) pv.innerHTML = woPreview(); return; }
  if (SH.kind === 'prod') { SH.draft[id] = t.value; return; }
}

/* ---------- toast ---------- */
let toastTimer = null;
function hideToast() { $('#toast').hidden = true; }
function toast(msg, undo) {
  $('#toast-msg').textContent = msg;
  const b = $('#toast-undo'); b.hidden = !undo;
  b.onclick = undo ? () => { undo(); hideToast(); } : null;
  $('#toast').hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(hideToast, undo ? 6000 : 3000);
}

/* ---------- actions ---------- */
function newEntryFrom(src, grams) {
  return { id: uid(), pid: src.pid ?? src.id ?? null, name: src.name, grams: src.portion ? null : grams, portion: !!src.portion, kcal100: src.kcal100, p100: src.p100, f100: src.f100, c100: src.c100 };
}
const ACT = {
  'tab'(a) { S.tab = a.dataset.tab; if (S.tab === 'profile') S.pd = draftFrom(S.profile); render(); window.scrollTo(0, 0); },
  'day-prev'() { S.date = addDays(S.date, -1); render(); },
  'day-next'() { S.date = addDays(S.date, 1); render(); },
  'day-today'() { S.date = today(); render(); },
  'open-day'(a) { S.date = a.dataset.date; S.tab = 'today'; render(); window.scrollTo(0, 0); },
  'hist-range'(a) { S.histRange = +a.dataset.n; render(); },
  'lib-toggle'(a) {
    const g = a.dataset.g;
    if (S.libOpen.has(g)) S.libOpen.delete(g); else S.libOpen.add(g);
    try { localStorage.setItem(LIB_OPEN_KEY, JSON.stringify([...S.libOpen])); } catch (e) { /* per-device convenience only */ }
    const l = $('#lib-list'); if (l) l.innerHTML = libListHtml();
  },
  'pd-set'(a) {
    if (!S.pd) S.pd = draftFrom(S.profile);
    S.pd[a.dataset.k] = a.dataset.v;
    if (a.dataset.k === 'goalType') {
      if (a.dataset.v === 'lose' && !DEFICITS.includes(+S.pd.deficit)) S.pd.deficit = '400';
      if (a.dataset.v === 'gain' && !SURPLUSES.includes(+S.pd.surplus)) S.pd.surplus = '300';
    }
    renderProfile();
  },
  'sheet-close'() { closeSheet(); },

  'add-food'(a) { openSheet({ kind: 'add', meal: a.dataset.meal, tab: 'prod', q: '', pick: null, pickG: NaN, draft: {}, quick: false, ai: { text: '', file: null, items: null, note: '', status: '', busy: false, ctl: null } }); },
  'sh-tab'(a) { SH.tab = a.dataset.tab; SH.pick = null; SH.cfg = null; renderSheet(); },
  'pick'(a) { const p = S.library.products.find(x => x.id === a.dataset.pid); if (!p) return; SH.pick = p; SH.pickG = NaN; renderSheet(); },
  'pick-back'() { SH.pick = null; renderSheet(); },
  'pick-g'(a) { const g = +a.dataset.g; SH.pickG = g; const i = $('#pick-g'); if (i) i.value = g1(g); $('#pick-prev').innerHTML = previewHtml(per100(SH.pick, g)); },
  'pick-add'() {
    const p = SH.pick, g = Number.isFinite(SH.pickG) ? SH.pickG : num($('#pick-g').value);
    if (!(g > 0 && g <= 5000)) { showErr('pick-err', 'Wpisz ilość w gramach, np. 150.'); return; }
    const meal = SH.meal, e = newEntryFrom({ ...p, pid: p.id, portion: false }, Math.round(g * 10) / 10);
    updateDay(S.date, d => { d.meals[meal].push(e); });
    closeSheet(); toast(`Dodano: ${p.name}`);
  },
  'add-set'(a) {
    const s = S.library.sets.find(x => x.id === a.dataset.sid); if (!s) return;
    SH.cfg = { sid: s.id, name: s.name, items: s.items.map(it => ({ ...clone(it), id: uid() })), picking: false, q: '', remember: false };
    renderSheet(); const sh = $('.sheet'); if (sh) sh.scrollTop = 0;
  },
  'cfg-back'() { SH.cfg = null; renderSheet(); },
  'cfg-add'() {
    const c = SH.cfg, meal = SH.meal, date = S.date;
    const chosen = c.items.filter(it => it.portion || it.grams > 0);
    if (!chosen.length) { showErr('cfg-err', 'Wpisz gramaturę przynajmniej jednego składnika.'); return; }
    if (c.remember) {
      const set = S.library.sets.find(x => x.id === c.sid);
      if (set) { set.items = chosen.map(it => ({ ...clone(it), id: uid() })); persistLibrary(); }
    }
    const entries = chosen.map(it => ({ ...newEntryFrom(it, it.grams), dish: c.sid })), ids = entries.map(e => e.id);
    updateDay(date, d => { d.meals[meal].push(...entries); });
    closeSheet();
    toast(`Dodano: ${c.name}${c.remember ? ' (zapamiętano zmiany)' : ''}`, () => updateDay(date, d => { d.meals[meal] = d.meals[meal].filter(e => !ids.includes(e.id)); }));
  },
  'ing-rm'(a) { const items = ingItems(); if (items) { items.splice(+a.dataset.i, 1); renderSheet(); } },
  'ing-pick'() { const st = ingState(); st.picking = true; st.q = ''; renderSheet(); const q = $('#ing-q'); if (q) q.scrollIntoView({ block: 'nearest' }); },
  'ing-pick-close'() { ingState().picking = false; renderSheet(); },
  'ing-add'(a) {
    const p = prodById(a.dataset.pid), st = ingState(); if (!p || !st) return;
    st.items.push(itemFromProduct(p, p.portion || 50)); st.picking = false; renderSheet();
  },
  'new-mode'(a) { SH.quick = a.dataset.q === '1'; renderSheet(); },
  'new-add'() {
    const d = SH.draft, name = String(d['nf-name'] || '').trim(), meal = SH.meal;
    if (!name) { showErr('new-err', 'Wpisz nazwę.'); return; }
    let entry;
    if (SH.quick) {
      const kcal = num(d['nq-kcal']);
      if (!(kcal >= 0 && kcal <= 10000)) { showErr('new-err', 'Wpisz kalorie porcji.'); return; }
      entry = { id: uid(), pid: null, name, grams: null, portion: true, kcal100: kcal, p100: numOr(d['nq-p'], 0), f100: numOr(d['nq-f'], 0), c100: numOr(d['nq-c'], 0) };
    } else {
      const kcal = num(d['nf-kcal']), g = num(d['nf-g']);
      if (!(kcal >= 0 && kcal <= 950)) { showErr('new-err', 'Wpisz kalorie na 100 g (0–950).'); return; }
      if (!(g > 0 && g <= 5000)) { showErr('new-err', 'Wpisz, ile gramów zjadłeś.'); return; }
      const prod = { id: uid(), name, cat: guessCat(name), kcal100: kcal, p100: numOr(d['nf-p'], 0), f100: numOr(d['nf-f'], 0), c100: numOr(d['nf-c'], 0), portion: Math.round(g) };
      const save = d['nf-save'] !== false;
      if (save) { S.library.products.push(prod); persistLibrary(); }
      entry = newEntryFrom({ ...prod, pid: save ? prod.id : null, portion: false }, g);
    }
    updateDay(S.date, day => { day.meals[meal].push(entry); });
    closeSheet(); toast(`Dodano: ${name}`);
  },
  'ai-run'() { aiRun(); },
  'ai-stop'() { if (SH && SH.ai.ctl) SH.ai.ctl.abort(); },
  'ai-file-clear'() { SH.ai.file = null; renderSheet(); },
  'ai-add'() {
    const A = SH.ai, meal = SH.meal;
    const chosen = (A.items || []).filter(it => it.on && it.grams > 0);
    if (!chosen.length) { A.status = 'Zaznacz co najmniej jeden produkt z ilością w gramach.'; renderSheet(); return; }
    const save = A.save !== false; let libChanged = false;
    const entries = chosen.map(it => {
      let pid = null;
      if (save) {
        let p = findProductByName(it.name);
        if (!p) { p = { id: uid(), name: it.name, cat: guessCat(it.name), kcal100: it.kcal100, p100: it.p100, f100: it.f100, c100: it.c100, portion: Math.round(it.grams) }; S.library.products.push(p); libChanged = true; }
        pid = p.id;
      }
      return { id: uid(), pid, name: it.name, grams: Math.round(it.grams * 10) / 10, portion: false, kcal100: it.kcal100, p100: it.p100, f100: it.f100, c100: it.c100 };
    });
    if (libChanged) persistLibrary();
    updateDay(S.date, d => { d.meals[meal].push(...entries); });
    closeSheet(); toast(`Dodano ${entries.length} ${entries.length === 1 ? 'pozycję' : entries.length < 5 ? 'pozycje' : 'pozycji'}`);
  },

  'edit-entry'(a) { openSheet({ kind: 'entry', meal: a.dataset.meal, id: a.dataset.id, draft: {}, e: null }); },
  'entry-save'() {
    const e = SH.e, d = SH.draft, from = SH.meal, to = d['ee-meal'] ?? from, date = S.date;
    const name = String(d['ee-name'] ?? e.name).trim() || e.name;
    const upd = { ...e, name };
    if (e.portion) {
      const kcal = num(d['ee-kcal'] ?? e.kcal100);
      if (!(kcal >= 0)) { showErr('ee-err', 'Wpisz kalorie porcji.'); return; }
      Object.assign(upd, { kcal100: kcal, p100: numOr(d['ee-p'] ?? e.p100, 0), f100: numOr(d['ee-f'] ?? e.f100, 0), c100: numOr(d['ee-c'] ?? e.c100, 0) });
    } else {
      const g = num(d['ee-g'] ?? e.grams);
      if (!(g > 0 && g <= 5000)) { showErr('ee-err', 'Wpisz ilość w gramach.'); return; }
      upd.grams = Math.round(g * 10) / 10;
    }
    updateDay(date, day => {
      const src = day.meals[from], i = src.findIndex(x => x.id === e.id);
      if (i === -1) return;
      if (to === from) src[i] = upd; else { src.splice(i, 1); day.meals[to].push(upd); }
    });
    closeSheet(); toast('Zapisano wpis');
  },
  'entry-del'() {
    const e = SH.e, meal = SH.meal, date = S.date;
    let idx = -1;
    updateDay(date, day => { idx = day.meals[meal].findIndex(x => x.id === e.id); if (idx !== -1) day.meals[meal].splice(idx, 1); });
    closeSheet();
    toast(`Usunięto: ${e.name}`, () => updateDay(date, day => { day.meals[meal].splice(Math.max(0, idx), 0, e); }));
  },

  'add-wo'() { openSheet({ kind: 'wo', id: null, type: 'silownia', intensity: 1, minutes: '60', source: 'est', watchKcal: '' }); },
  'edit-wo'(a) {
    const wo = getDay(S.date).workouts.find(x => x.id === a.dataset.id); if (!wo) return;
    openSheet({ kind: 'wo', id: wo.id, type: wo.type, intensity: wo.intensity ?? 1, minutes: String(wo.minutes), source: wo.source === 'watch' ? 'watch' : 'est', watchKcal: wo.watchKcal ? String(wo.watchKcal) : '' });
  },
  'wo-type'(a) { SH.type = a.dataset.v; renderSheet(); },
  'wo-int'(a) { SH.intensity = +a.dataset.v; renderSheet(); },
  'wo-save'() {
    const min = num(SH.minutes);
    if (!(min > 0 && min <= 600)) { showErr('wo-err', 'Wpisz czas treningu w minutach.'); return; }
    let wk = null;
    if (SH.source === 'watch') { wk = num(SH.watchKcal); if (!(wk > 0 && wk <= 5000)) { showErr('wo-err', 'Wpisz kalorie z zegarka.'); return; } }
    const prev = SH.id ? getDay(S.date).workouts.find(x => x.id === SH.id) : null;
    const wo = { ...(prev || {}), id: SH.id || uid(), type: SH.type, intensity: SH.intensity, minutes: Math.round(min), source: SH.source, watchKcal: wk ? Math.round(wk) : null };
    if (prev && prev.hcId) wo.locked = true;
    updateDay(S.date, d => { const i = d.workouts.findIndex(x => x.id === wo.id); if (i === -1) d.workouts.push(wo); else d.workouts[i] = wo; });
    closeSheet(); toast('Zapisano trening');
  },
  'wo-del'() {
    const id = SH.id, date = S.date; let removed = null, idx = -1;
    updateDay(date, d => {
      idx = d.workouts.findIndex(x => x.id === id);
      if (idx !== -1) removed = d.workouts.splice(idx, 1)[0];
      if (removed && removed.hcId) d.hcIgnored = [...(d.hcIgnored || []), removed.hcId];
    });
    closeSheet();
    if (removed) toast('Usunięto trening', () => updateDay(date, d => {
      d.workouts.splice(Math.max(0, idx), 0, removed);
      if (removed.hcId) d.hcIgnored = (d.hcIgnored || []).filter(x => x !== removed.hcId);
    }));
  },

  'lib-new'() { openSheet({ kind: 'prod', pid: null, draft: {}, confirmDel: false }); },
  'edit-prod'(a) {
    const p = S.library.products.find(x => x.id === a.dataset.pid); if (!p) return;
    openSheet({ kind: 'prod', pid: p.id, confirmDel: false, draft: { 'pe-name': p.name, 'pe-cat': CATS.includes(p.cat) ? p.cat : '', 'pe-kcal': g1(p.kcal100), 'pe-p': g1(p.p100), 'pe-f': g1(p.f100), 'pe-c': g1(p.c100), 'pe-portion': p.portion ? g1(p.portion) : '' } });
  },
  'prod-save'() {
    const d = SH.draft, name = String(d['pe-name'] || '').trim(), kcal = num(d['pe-kcal']);
    if (!name) { showErr('pe-err', 'Wpisz nazwę.'); return; }
    if (!(kcal >= 0 && kcal <= 950)) { showErr('pe-err', 'Wpisz kalorie na 100 g (0–950).'); return; }
    const portion = num(d['pe-portion']);
    const prod = { id: SH.pid || uid(), name, cat: d['pe-cat'] || guessCat(name), kcal100: kcal, p100: numOr(d['pe-p'], 0), f100: numOr(d['pe-f'], 0), c100: numOr(d['pe-c'], 0), portion: portion > 0 ? Math.round(portion) : null };
    const i = S.library.products.findIndex(x => x.id === prod.id);
    if (i === -1) S.library.products.push(prod); else S.library.products[i] = prod;
    persistLibrary(); closeSheet(); render(); toast(`Zapisano: ${name}`);
  },
  'prod-del'() {
    if (!SH.confirmDel) { SH.confirmDel = true; renderSheet(); return; }
    const id = SH.pid; S.library.products = S.library.products.filter(x => x.id !== id);
    persistLibrary(); closeSheet(); render(); toast('Usunięto produkt');
  },

  'set-new'() { openSheet({ kind: 'setedit', sid: null, name: '', items: [], picking: true, q: '', confirmDel: false }); },
  'set-from-meal'(a) {
    const meal = a.dataset.meal, items = (getDay(S.date).meals[meal] || []).map(e => ({ ...clone(e), id: uid() }));
    openSheet({ kind: 'setedit', sid: null, name: `${mealLabel(meal)} ${fmtDate(S.date, { day: '2-digit', month: '2-digit' })}`, items, picking: false, q: '', confirmDel: false });
  },
  'edit-set'(a) {
    const s = S.library.sets.find(x => x.id === a.dataset.sid); if (!s) return;
    openSheet({ kind: 'setedit', sid: s.id, name: s.name, items: clone(s.items), picking: false, q: '', confirmDel: false });
  },
  'set-save'() {
    const name = String(SH.name || '').trim();
    const items = SH.items.filter(it => it.portion || it.grams > 0);
    if (!name) { showErr('se-err', 'Wpisz nazwę dania.'); return; }
    if (!items.length) { showErr('se-err', 'Dodaj co najmniej jeden składnik z gramaturą.'); return; }
    if (SH.sid) { const i = S.library.sets.findIndex(x => x.id === SH.sid); if (i !== -1) S.library.sets[i] = { ...S.library.sets[i], name, items }; }
    else S.library.sets.push({ id: uid(), name, items });
    persistLibrary(); closeSheet(); render(); toast(`Zapisano danie: ${name}`);
  },
  'install'() {
    const ev = INSTALL.prompt; if (!ev) return;
    INSTALL.prompt = null;
    ev.prompt();
    Promise.resolve(ev.userChoice).then(r => { if (r && r.outcome === 'accepted') toast('Instaluję Macroo na telefonie'); render(); }).catch(() => render());
  },
  'install-dismiss'() { INSTALL.dismissed = true; render(); },
  'hc-connect'() { hcConnect(); },
  'hc-sync'() { const dates = S.date === today() ? [today(), addDays(today(), -1)] : [S.date]; hcSync(dates, true); },
  'hc-install'() { nativeCall('installHealthConnect').catch(() => {}); },
  'hc-settings'() { nativeCall('openHealthConnect').catch(() => {}); },
  'hc-open-sh'() { nativeCall('openSamsungHealth').catch(() => toast('Nie znaleziono Samsung Health.')); },
  'backup-save'() {
    const data = { app: 'macroo', version: 1, exportedAt: new Date().toISOString(), profile: S.profile, library: S.library, days: S.days };
    if (NATIVE) {
      nativeCall('saveFile', { name: `macroo-kopia-${today()}.json`, text: JSON.stringify(data) })
        .then(() => toast('Zapisano kopię'))
        .catch(e => { if (!e || e.code !== 'cancelled') toast('Nie udało się zapisać kopii.'); });
      return;
    }
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `macroo-kopia-${today()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast('Kopia zapisana w Pobranych');
  },
  'backup-cancel'() { S.pendingImport = null; renderProfile(); },
  'backup-apply'() {
    const imp = S.pendingImport; if (!imp) return;
    S.profile = normProfile(imp.data.profile);
    S.library = normLib(imp.data.library);
    upgradeLibrary(S.library);
    S.days = imp.data.days && typeof imp.data.days === 'object' ? imp.data.days : {};
    S.pendingImport = null; S.pd = draftFrom(S.profile);
    saveLocal(); render(); toast('Wczytano kopię');
  },
  'set-del'() {
    if (!SH.confirmDel) { SH.confirmDel = true; renderSheet(); return; }
    const id = SH.sid; S.library.sets = S.library.sets.filter(x => x.id !== id);
    persistLibrary(); closeSheet(); render(); toast('Usunięto danie');
  }
};

document.addEventListener('click', e => {
  const a = e.target.closest('[data-act]'); if (!a) return;
  const fn = ACT[a.dataset.act]; if (!fn) return;
  e.preventDefault(); fn(a);
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'lib-q') { S.libQuery = t.value; $('#lib-list').innerHTML = libListHtml(); return; }
  if (t.closest('#pf')) { syncPd(t); return; }
  if (t.closest('#sheet-body')) sheetInput(t);
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'steps-in') {
    const v = Math.round(num(t.value));
    const steps = Number.isFinite(v) && v >= 0 ? Math.min(v, 150000) : 0;
    const date = S.date;
    if (steps !== (getDay(date).steps || 0)) updateDay(date, d => { d.steps = steps; d.stepsSource = 'manual'; });
    return;
  }
  if (t.id === 'weight-in') {
    const raw = t.value.trim(), date = S.date;
    if (!raw) { if (getDay(date).weight) updateDay(date, d => { d.weight = null; delete d.weightSource; }); return; }
    const v = num(raw);
    if (!(v >= 30 && v <= 300)) { toast('Wpisz wagę w kg, np. 81,2.'); t.value = ''; return; }
    updateDay(date, d => { d.weight = Math.round(v * 10) / 10; d.weightSource = 'manual'; });
    return;
  }
  if (t.id === 'backup-file') { readBackup(t.files && t.files[0]); t.value = ''; return; }
  if (t.closest('#pf')) { syncPd(t); return; }
  if (!SH) return;
  if (t.id === 'ai-file') {
    const f = t.files && t.files[0];
    if (f && S.sampleImages && S.sampleImages.maxInputBytes && f.size > S.sampleImages.maxInputBytes) { SH.ai.status = 'Zdjęcie jest za duże. Wybierz mniejsze.'; SH.ai.file = null; }
    else { SH.ai.file = f || null; SH.ai.status = ''; }
    renderSheet(); return;
  }
  if (t.id === 'wo-watch') { SH.source = t.checked ? 'watch' : 'est'; renderSheet(); return; }
  if (t.id === 'ee-meal') { SH.draft['ee-meal'] = t.value; return; }
  if (t.closest('#sheet-body') && (t.type === 'checkbox')) sheetInput(t);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && SH) closeSheet();
  if (e.key === 'Enter' && (e.target.id === 'steps-in' || e.target.id === 'weight-in')) e.target.blur();
});
document.addEventListener('focusout', () => {
  if (S.deferRender) setTimeout(() => { if (S.deferRender && !isTyping()) render(); }, 0);
});
document.addEventListener('submit', e => { if (e.target.id === 'pf') { e.preventDefault(); saveProfileForm(); } });

/* ---------- start ---------- */
const INSTALL = { prompt: null, dismissed: false };
const isStandalone = () => (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); INSTALL.prompt = e; render(); });
window.addEventListener('appinstalled', () => { INSTALL.prompt = null; render(); });

function readBackup(file) {
  if (!file) return;
  const r = new FileReader();
  r.onload = () => {
    let data = null;
    try { data = JSON.parse(String(r.result)); } catch (e) { data = null; }
    if (!data || !['talerz', 'macroo'].includes(data.app) || typeof data.library !== 'object') { toast('To nie jest plik kopii Macroo.'); return; }
    const days = data.days && typeof data.days === 'object' ? Object.keys(data.days).length : 0;
    const prods = Array.isArray(data.library && data.library.products) ? data.library.products.length : 0;
    const sets = Array.isArray(data.library && data.library.sets) ? data.library.sets.length : 0;
    S.pendingImport = { data, fileName: file.name || 'kopia', summary: `Zawiera ${days} dni, ${prods} produktów i ${sets} dań.` };
    renderProfile();
  };
  r.onerror = () => toast('Nie udało się odczytać pliku.');
  r.readAsText(file);
}
function startLocal() {
  S.mode = 'local';
  loadLocal();
  let fresh = false;
  try { fresh = localStorage.getItem(LS_KEY) === null; } catch (e) { fresh = false; }
  if (fresh && !S.library.products.length) S.library = { products: [], sets: [], catalog: 0 };
  if (upgradeLibrary(S.library)) saveLocal();
  S.loaded = { profile: true, library: true, days: true };
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  render();
}
function hideSplash() {
  const sp = document.getElementById('splash'); if (!sp) return;
  let reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { reduce = false; }
  setTimeout(() => { sp.classList.add('out'); setTimeout(() => sp.remove(), 400); }, reduce ? 250 : 950);
}
function init() {
  startLocal();
  hideSplash();
  if ('serviceWorker' in navigator) {
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('./sw.js').then(reg => {
      reg.update().catch(() => {});
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); });
    }).catch(() => {});
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController || reloaded) return;
      if (SH || isTyping()) { toast('Jest nowa wersja Macroo. Uruchom aplikację ponownie, żeby ją wczytać.'); return; }
      reloaded = true; location.reload();
    });
  }
  window.addEventListener('storage', e => { if (e.key === LS_KEY) { loadLocal(); render(); } });
  if (NATIVE) {
    hcLoadMeta();
    hcRefreshStatus().then(hcAuto);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') hcRefreshStatus().then(hcAuto); });
  }
}
init();
})();
