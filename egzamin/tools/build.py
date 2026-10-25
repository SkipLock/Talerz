#!/usr/bin/env python3
"""Buduje egzamin/data/pytania.json z plików źródłowych egzamin/src/*.txt.

Format źródła (jedno pytanie = blok oddzielony pustą linią):

    ## id | Pełna nazwa działu | Krótka nazwa | 02,05     <- nagłówek działu
    ? Treść pytania (kolejne linie "?" to dalszy ciąg treści)
    @ typ:argumenty                                     <- rysunek do pytania (opcjonalnie)
    + poprawna odpowiedź
    - błędna odpowiedź        (odpowiedź może być rysunkiem: "- @sym:dioda")
    - błędna odpowiedź
    - błędna odpowiedź
    ! Wyjaśnienie (kolejne linie "!" są doklejane)
    ~ k=05 | ~ fixed                                    <- opcje: tylko dla ELE.05 / nie mieszać kolejności
    # komentarz

Uruchomienie: python3 egzamin/tools/build.py
"""
import hashlib
import json
import random
import re
import subprocess
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'src'
OUT = ROOT / 'data' / 'pytania.json'

QUALS = [
    {'id': 'ELE.02', 'name': 'Montaż, uruchamianie i konserwacja instalacji, maszyn i urządzeń elektrycznych'},
    {'id': 'ELE.05', 'name': 'Eksploatacja maszyn, urządzeń i instalacji elektrycznych'},
]
QMAP = {'02': 'ELE.02', '05': 'ELE.05'}
PREFIX = {'µ': 1e-6, 'u': 1e-6, 'm': 1e-3, 'k': 1e3, 'M': 1e6}
UNITS = ('Ω', 'V', 'A', 'W', 'Hz', 'F', 'H', 'var', 'VA', 's', 'Wh', 'J', 'lx', 'lm', 'C')


class BuildError(Exception):
    pass


SYMBOLS = {'√': ' sqrt ', '±': ' pm ', '−': ' minus ', '°': ' deg ', 'Ω': ' ohm ', 'Ω': ' ohm ', 'µ': ' u ', '²': '2', '³': '3',
           '≥': ' ge ', '≤': ' le ', '≈': ' approx ', '%': ' pct ', '·': ' x ', '/': ' per '}


def norm(s):
    for k, v in SYMBOLS.items():
        s = s.replace(k, v)
    s = unicodedata.normalize('NFKD', s.lower())
    s = ''.join(c for c in s if not unicodedata.combining(c))
    return re.sub(r'[^a-z0-9]+', ' ', s).strip()


def magnitude(opt):
    """Wartość liczbowa odpowiedzi (z przedrostkiem SI) albo None, jeśli to nie liczba."""
    m = re.match(r'^\s*([−-]?\d+(?:[  ]\d{3})*(?:[.,]\d+)?)\s*(.*)$', opt)
    if not m:
        return None
    num = float(m.group(1).replace('−', '-').replace(' ', '').replace(' ', '').replace(',', '.'))
    rest = m.group(2)
    mult = 1.0
    if rest and rest[0] in PREFIX:
        tail = rest[1:]
        if any(tail.startswith(u) for u in UNITS):
            mult = PREFIX[rest[0]]
    return num * mult


def parse():
    topics, questions = [], []
    topic = None
    files = sorted(SRC.glob('*.txt'))
    if not files:
        raise BuildError('brak plików w ' + str(SRC))
    for path in files:
        block, start = [], 0
        lines = path.read_text(encoding='utf-8').splitlines() + ['']
        for no, raw in enumerate(lines, 1):
            line = raw.rstrip()
            if line.startswith('##'):
                if block:
                    questions.append(make_question(block, topic, path, start))
                    block = []
                parts = [p.strip() for p in line[2:].split('|')]
                if len(parts) != 4:
                    raise BuildError(f'{path.name}:{no}: nagłówek działu musi mieć 4 pola')
                tid, name, short, ks = parts
                if any(t['id'] == tid for t in topics):
                    topic = next(t for t in topics if t['id'] == tid)
                    continue
                topic = {'id': tid, 'name': name, 'short': short, 'k': [QMAP[k.strip()] for k in ks.split(',')]}
                topics.append(topic)
                continue
            if line.startswith('#') and not line.startswith('##'):
                continue
            if not line.strip():
                if block:
                    questions.append(make_question(block, topic, path, start))
                    block = []
                continue
            if not block:
                start = no
            block.append(line)
    return topics, questions


def make_question(block, topic, path, start):
    where = f'{path.name}:{start}'
    if topic is None:
        raise BuildError(f'{where}: pytanie przed nagłówkiem działu')
    q, f, opts, expl, k, fixed = [], None, [], [], None, False
    for line in block:
        tag, text = line[:1], line[1:].strip()
        if tag == '?':
            q.append(text)
        elif tag == '@':
            f = text
        elif tag in '+-':
            fig = None
            if text.startswith('@'):
                fig, text = text[1:].strip(), ''
            opts.append({'t': text, 'f': fig, 'ok': tag == '+'})
        elif tag == '!':
            expl.append(text)
        elif tag == '~':
            for part in text.split('|'):
                part = part.strip()
                if part.startswith('k='):
                    k = [QMAP[x.strip()] for x in part[2:].split(',')]
                elif part == 'fixed':
                    fixed = True
                else:
                    raise BuildError(f'{where}: nieznana opcja "{part}"')
        else:
            raise BuildError(f'{where}: nieznany znacznik linii: {line[:30]}')
    if not q:
        raise BuildError(f'{where}: brak treści pytania')
    if len(opts) != 4:
        raise BuildError(f'{where}: pytanie musi mieć 4 odpowiedzi (jest {len(opts)})')
    if sum(o['ok'] for o in opts) != 1:
        raise BuildError(f'{where}: dokładnie jedna odpowiedź musi być poprawna')
    if not expl:
        raise BuildError(f'{where}: brak wyjaśnienia')
    if any(not o['t'] and not o['f'] for o in opts):
        raise BuildError(f'{where}: pusta odpowiedź')
    texts = [norm(o['t']) for o in opts if o['t']]
    if len(set(texts)) != len(texts):
        raise BuildError(f'{where}: powtórzona odpowiedź')
    qtext = '\n'.join(q)
    correct = next(o for o in opts if o['ok'])
    key = '|'.join([topic['id'], qtext, f or '', correct['t'] or correct['f'] or ''])
    qid = hashlib.sha1(key.encode('utf-8')).hexdigest()[:8]

    # Kolejność: liczby rosnąco (jak w arkuszach), resztę mieszamy deterministycznie od id.
    order = list(range(4))
    mags = [magnitude(o['t']) if o['t'] and not o['f'] else None for o in opts]
    keep = fixed
    if not fixed and all(m is not None for m in mags):
        order.sort(key=lambda i: mags[i])
        keep = True
    elif not fixed:
        random.Random(int(qid, 16)).shuffle(order)
    opts = [opts[i] for i in order]

    out = {
        'i': qid, 't': topic['id'], 'q': qtext,
        'o': [o['t'] for o in opts],
        'c': next(i for i, o in enumerate(opts) if o['ok']),
        'e': ' '.join(expl),
    }
    if f:
        out['f'] = f
    if any(o['f'] for o in opts):
        out['of'] = [o['f'] for o in opts]
    if k:
        out['k'] = k
    if keep:
        out['x'] = 1
    out['_where'] = where
    return out


def check_figures(questions):
    specs = sorted({q['f'] for q in questions if q.get('f')} | {s for q in questions for s in (q.get('of') or []) if s})
    if not specs:
        return
    script = (
        "const F=require(process.argv[1]);const specs=JSON.parse(require('fs').readFileSync(0,'utf8'));"
        "const bad=[];for(const s of specs){try{F.render(s)}catch(e){bad.push(s+' -> '+e.message)}}"
        "console.log(JSON.stringify(bad));"
    )
    res = subprocess.run(['node', '-e', script, str(ROOT / 'figs.js')], input=json.dumps(specs), capture_output=True, text=True)
    if res.returncode != 0:
        raise BuildError('node: ' + res.stderr)
    bad = json.loads(res.stdout)
    if bad:
        raise BuildError('złe rysunki:\n  ' + '\n  '.join(bad))


def main():
    try:
        topics, questions = parse()
        ids = {}
        for q in questions:
            if q['i'] in ids:
                raise BuildError(f"{q['_where']}: to samo pytanie co w {ids[q['i']]}")
            ids[q['i']] = q['_where']
        seen = {}
        warn = []
        for q in questions:
            key = norm(q['q']) + '|' + (q.get('f') or '')
            if key in seen:
                warn.append(f"{q['_where']}: identyczna treść jak {seen[key]}")
            seen[key] = q['_where']
            if len(q['q']) > 600:
                warn.append(f"{q['_where']}: bardzo długa treść ({len(q['q'])} znaków)")
        check_figures(questions)
    except BuildError as e:
        print('BŁĄD:', e)
        sys.exit(1)

    for q in questions:
        q.pop('_where', None)
    body = {'quals': QUALS, 'topics': topics, 'q': questions}
    blob = json.dumps(body, ensure_ascii=False, separators=(',', ':'), sort_keys=True)
    body['v'] = hashlib.sha1(blob.encode('utf-8')).hexdigest()[:10]
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(body, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')

    # Podsumowanie
    def in_qual(q, k):
        return k in (q.get('k') or next(t['k'] for t in topics if t['id'] == q['t']))
    print(f"Zapisano {OUT.relative_to(ROOT.parent)}: {len(questions)} pytań, wersja {body['v']}, {OUT.stat().st_size // 1024} KB")
    for k in QMAP.values():
        print(f"  {k}: {sum(in_qual(q, k) for q in questions)}")
    for t in topics:
        n = sum(q['t'] == t['id'] for q in questions)
        print(f"  {t['id']:6} {n:4}  {t['name']} [{', '.join(t['k'])}]")
    pos = [0, 0, 0, 0]
    for q in questions:
        pos[q['c']] += 1
    print('  Poprawne odpowiedzi A/B/C/D:', pos, '  z rysunkiem:', sum(1 for q in questions if q.get('f') or q.get('of')))
    for w in warn:
        print('  UWAGA', w)


if __name__ == '__main__':
    main()
