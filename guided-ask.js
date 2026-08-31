(function () {
  'use strict';

  const REACH = {
    S: () => S,
    D: () => D,
    COLLECTION: () => COLLECTION,
    OCCASIONS: () => OCCASIONS,
    BANDS: () => BANDS,
    SHELVES: () => SHELVES,
    PATS: () => PATS,
    esc: () => esc,
    byId: () => byId,
    thumbOf: () => thumbOf,
    imgOf: () => imgOf,
    detailOf: () => detailOf,
    gsmText: () => gsmText,
    bookName: () => bookName,
    plainName: () => plainName,
    categoryName: () => categoryName,
    clothPool: () => clothPool,
    clothCount: () => clothCount,
    universe: () => universe,
    sortOptions: () => sortOptions,
    sortKey: () => sortKey,
    setSort: () => setSort,
    setSeason: () => setSeason,
    setShelf: () => setShelf,
    setPat: () => setPat,
    openCloseup: () => openCloseup,
    preloadCloseup: () => preloadCloseup,
    swatchLine: () => swatchLine,
    lookPlan: () => lookPlan,
    lookDelta: () => lookDelta,
    fig: () => fig,
    applyLook: () => applyLook,
    pickCloth: () => pickCloth,
    openOverlay: () => openOverlay,
    GARMENTS: () => GARMENTS,
    setGarment: () => setGarment,
    setOccasion: () => setOccasion,
    RECORD: () => RECORD,
  };
  function P(name) { try { return REACH[name](); } catch (e) { return undefined; } }

  const E = (s) => {
    const f = P('esc');
    if (f) return f(s);
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };

  const state = () => P('S') || {};
  const formLine = (o) => (window.G && typeof window.G.formLine === 'function')
    ? window.G.formLine(o) : '';
  const sentence = (s) => {
    const t = String(s == null ? '' : s).trim();
    return t ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() : '';
  };
  const num = (n) => Number(n || 0).toLocaleString('en-US');

  let CODEX = null;                        
  function codex() {
    if (CODEX) return CODEX;
    CODEX = new Map();
    const data = P('D');
    for (const s of (data && data.suitings) || []) if (s && s.c) CODEX.set(String(s.c), s);
    return CODEX;
  }
  function houseWords(cl) {
    const G = window.G;
    if (G && typeof G.clothWords === 'function') {
      const said = G.clothWords(cl);
      if (said) return said;
    }
    const cat = P('categoryName');
    return cl && cat ? String(cat(cl)) : '';
  }
  function shelfProvenance(cl) {
    const G = window.G;
    return (G && typeof G.clothProvenance === 'function') ? G.clothProvenance(cl) : '';
  }
  function named(cl) {
    return cl ? `${houseWords(cl)} ${cl.c}`.trim() : '';
  }
  function plainly(raw) {
    const said = raw.replace(/\bis not one of the ([a-z][a-z-]*)\b/g, 'is not a $1 cloth');
    return said.replace(/[A-Za-z0-9]+(?:[-/][A-Za-z0-9]+)+|\b\d{5,6}\b/g, (tok) => {
      const cl = codex().get(tok);
      return cl ? named(cl) : tok;
    });
  }
  function noteHTML() {
    const raw = String(state().narrowNote || '').trim();
    if (!raw) return '';
    const said = plainly(raw);
    return said ? `<div class="g2Fact g2Note" role="status">${E(said)}</div>` : '';
  }

  const ACTS = new WeakMap();
  function draw(body, html, acts) {
    body.innerHTML = html;
    ACTS.set(body, acts || {});
    wire(body);
  }
  function wire(body) {
    if (body.dataset.g2Wired) return;
    body.dataset.g2Wired = '1';
    body.addEventListener('click', (ev) => {
      const el = ev.target.closest ? ev.target.closest('[data-g2-act]') : null;
      if (!el || !body.contains(el)) return;
      const fn = (ACTS.get(body) || {})[el.dataset.g2Act];
      if (!fn) return;
      ev.preventDefault();
      fn(el, ev);
    });
    body.addEventListener('change', (ev) => {
      const el = ev.target.closest ? ev.target.closest('[data-g2-change]') : null;
      if (!el || !body.contains(el)) return;
      const fn = (ACTS.get(body) || {})[el.dataset.g2Change];
      if (fn) fn(el, ev);
    });
  }

  function keepStrip(body, act, key, job) {
    const was = body.querySelector('.g2Strip');
    const at = was ? was.scrollLeft : 0;
    job();
    const now = body.querySelector('.g2Strip');
    if (now) now.scrollLeft = at;
    const back = body.querySelector(
      `.g2Strip [data-g2-act="${act}"][data-key="${(key || '').replace(/"/g, '')}"]`);
    if (back) back.focus({ preventScroll: true });
  }

  function ask() {
    const G = window.G;
    if (!G || !G.state) return {};
    return (G.state.ask = G.state.ask || {});
  }

  function houseLine(body, on) {
    const frame = body && body.parentElement;
    const h = frame && frame.querySelector('.gQ');
    if (h) h.classList.toggle('g2HouseLine', !!on);
  }

  function unitHTML(ctx, cloth, key, naming) {
    if (!cloth) return '';
    const said = (ctx && typeof ctx.swatchLine === 'function') ? ctx.swatchLine(cloth, naming) : '';
    return said ? `<div class="g2Unit" data-g2-unit="${E(key)}">${said}</div>` : '';
  }
  function rebindUnit(body, ctx, cloth, key, naming) {
    const box = body.querySelector(`[data-g2-unit="${key}"]`);
    if (box && cloth && ctx && typeof ctx.swatchLine === 'function') {
      box.innerHTML = ctx.swatchLine(cloth, naming);
    }
  }
  function inThisLook(cl) {
    const said = houseWords(cl).trim().toLowerCase();
    return said ? `the ${said} in this look` : '';
  }
  function unitCloth(key, rows) {
    const want = ask()[key];
    const here = (cl) => cl && rows.some((r) => r && r.id === cl.id);
    const byIdFn = P('byId'), data = P('D');
    const remembered = (want && byIdFn && data) ? byIdFn(data.suitings, want) : null;
    if (here(remembered)) return remembered;
    const held = state().cloth;
    if (here(held)) return held;
    return rows[0] || held || null;
  }

  function openClose(id) { const f = P('openCloseup'); if (f) f(id); }
  function preload(id) { const f = P('preloadCloseup'); if (f) { try { f(id); } catch (e) {   } } }
  function armDoor(el, id) {
    if (!el || el.dataset.g2Armed) return;
    el.dataset.g2Armed = '1';
    el.addEventListener('pointerenter', () => preload(id));
    el.addEventListener('focus', () => preload(id));
  }

  const CURATION = {
    business: [
      { nm: 'THE DALLAS STRIPE', advice: 'A stripe reads as a suit, never as a blazer.' },
      { nm: 'THE BIELLA BLUE', advice: 'The safe first commission.' },
      { nm: 'THE BOARDROOM', advice: 'Charcoal, for the day navy is already out.' },
    ],
    wedding_guest: [
      { nm: 'THE VEGAS MIDNIGHT', advice: 'Navy photographs kinder than black.' },
      { nm: 'THE TAMPA', advice: 'For a wedding in daylight.' },
      { nm: 'THE DALLAS STRIPE', advice: 'Wears again on Monday.' },
    ],
    black_tie: [
      { nm: 'THE BLACK TIE', advice: 'The one cloth here the house lists for black tie.' },
    ],
    summer_travel: [
      { nm: 'THE TAMPA', advice: 'Light, and light in colour — for heat.' },
      { nm: 'THE BIELLA BLUE', advice: 'Wool with stretch — it recovers in a case.' },
      { nm: 'THE DALLAS STRIPE', advice: 'Stretch again, and it holds a crease.' },
    ],
  };
  const LOOK_ADVICE = {
    'THE DALLAS STRIPE': 'A stripe reads as a suit, never as a blazer.',
    'THE BIELLA BLUE': 'The safe first commission.',
    'THE BOARDROOM': 'Charcoal, for the day navy is already out.',
    'THE VEGAS MIDNIGHT': 'Navy photographs kinder than black.',
    'THE TAMPA': 'For a wedding in daylight.',
    'THE COUNTRY WINDOWPANE': 'Tweed at 370 g — it wants weather.',
    'THE BLACK TIE': 'The one cloth here the house lists for black tie.',
  };

  function occasionOf(nm, filter) {
    const all = P('OCCASIONS') || [];
    const label = (k) => {
      const row = all.find(([key]) => key === k);
      return sentence(row ? row[1] : k);
    };
    const stands = (k) => (CURATION[k] || []).some((p) => p && p.nm === nm);
    if (filter && stands(filter)) return label(filter);
    for (const k of OCC_KEYS) if (stands(k)) return label(k);
    return '';
  }

  function collection() { return P('COLLECTION') || []; }
  function curated(occKey) {
    const coll = collection();
    if (!occKey) return coll.map((e, i) => ({ i, e, advice: LOOK_ADVICE[e.nm] || '' }));
    const want = CURATION[occKey] || [];
    const out = [];
    for (const pick of want) {
      const i = coll.findIndex((e) => e && e.nm === pick.nm);
      if (i >= 0) out.push({ i, e: coll[i], advice: pick.advice });
    }
    return out;
  }

  const OCC_KEYS = ['business', 'wedding_guest', 'black_tie', 'summer_travel'];
  function occasionViews() {
    const all = P('OCCASIONS') || [];
    const views = [{ key: null, label: 'All', n: collection().length }];
    for (const k of OCC_KEYS) {
      const row = all.find(([key]) => key === k);
      const n = curated(k).length;
      if (!n) continue;                        
      views.push({ key: k, label: sentence(row ? row[1] : k), n });
    }
    return views.filter((v) => v.n > 0);
  }
  function viewChip(o) {
    return `<button type="button" class="g2Quiet g2View" data-g2-act="${E(o.act)}"` +
      ` data-key="${E(o.key == null ? '' : o.key)}"` +
      (o.setter ? ` data-setter="${E(o.setter)}"` : '') +
      ` aria-pressed="${o.on ? 'true' : 'false'}" aria-label="${E(o.said)}">` +
      `<span class="g2ViewIn">` +
      `<span class="g2Mark" aria-hidden="true"></span>` +
      `<span class="g2ViewWords">${E(o.label)}` +
      (o.n == null ? '' : `<span class="g2ViewNum"> · ${E(num(o.n))}</span>`) + `</span>` +
      `</span>` +
      `<span class="g2Chosen">Showing</span></button>`;
  }
  function viewHTML(v, on) {
    return viewChip({
      act: 'view', key: v.key, on, label: v.label, n: v.n,
      said: `${v.label} — ${v.n} ${v.n === 1 ? 'look' : 'looks'}`,
    });
  }

  function cardPlate(e, eager) {
    const code = String(e.cloth.c).replace(/\//g, '_');
    return {
      src: `assets/cards/${code}.jpg`,
      srcset: `assets/cards/${code}-160.jpg 160w, assets/cards/${code}-320.jpg 320w, ` +
        `assets/cards/${code}.jpg 600w`,
      sizes: '362px',
      fileW: 600,
      cls: 'g2Card',
      alt: '',
      eager: !!eager,
    };
  }

  const looks = {
    id: 'looks',
    title: 'The house',
    question: 'Where shall we start?',
    compose: 'grid',
    money: false,
    render(body, ctx) {
      clothFadeOff();
      houseLine(body, true);
      const G = window.G;
      const filter = (G && G.state) ? (G.state.lookFilter || null) : null;
      const views = occasionViews();
      const picks = curated(filter);
      const planFn = P('lookPlan'), deltaFn = P('lookDelta'), figFn = P('fig');
      const held = state().cloth;
      const clothsHere = picks.map((p) => p.e.cloth).filter(Boolean);

      const acts = {
        view(el) {
          const key = el.dataset.key || null;
          if (G && G.state) G.state.lookFilter = key;
          looks.render(body, ctx);
          const back = body.querySelector(
            `[data-g2-act=view][data-key="${key == null ? '' : key}"]`);
          if (back) back.focus({ preventScroll: true });
        },
      };

      const cards = picks.map(({ i, e, advice }, at) => {
        const plan = planFn ? planFn(e) : null;
        const move = deltaFn ? deltaFn(plan) : null;
        const facts = [
          plan ? plan.label : '',
          houseWords(e.cloth).toLowerCase(),           
          shelfProvenance(e.cloth),
        ].filter(Boolean).join(' · ');
        const chosen = !!held && !!e.cloth && held.id === e.cloth.id;
        return ctx.tile({
          plate: cardPlate(e, at === 0),
          swatch: e.cloth ? {
            src: (P('thumbOf') ? P('thumbOf')(e.cloth, 'suiting') : ''),
            alt: '',
          } : null,
          name: e.nm,
          fact: facts,
          advice,
          eyebrow: occasionOf(e.nm, filter),
          word: 'Chosen',
          selected: chosen,
          multi: true,
          act: () => ctx.answer(String(i)),
        }) + ((move && figFn)
          ? `<div class="g2Move">${figFn(move, 'change').html}</div>` : '');
      });

      const shown = picks.length;
      draw(body,
        `<div class="g2Views" role="group" aria-label="Show the house's looks for">` +
          views.map((v) => viewHTML(v, (v.key || null) === filter)).join('') +
        `</div>` +
        ctx.rail(cards, {
          label: `The house's looks — ${shown} ${shown === 1 ? 'look' : 'looks'}, ` +
            `in the house's own order`,
        }) +
        `<div class="g2Advice">${E(formLine({
          each: true, clause: 'Your garment is cut to your own record.',
        }))}</div>` +
        ((cl) => unitHTML(ctx, cl, 'looks', inThisLook(cl)))(
          unitCloth('lookCloth', clothsHere)) +
        ctx.doors([
          { label: 'Pick your own cloth', fact: reachCount(),
            act: () => ctx.goto('build', { open: 'cloth' }) },
          shelfCount() ? { label: 'The looks you have saved', fact: shelfFact(),
            act: () => openShelf(ctx) } : null,
        ].filter(Boolean)),
        acts);
      const said = shelfWords();
      if (said) {
        const n = shelfCount();
        const seen = ask();
        const fresh = seen.shelfSaid !== n;
        seen.shelfSaid = n;
        const p = document.createElement('p');
        p.className = 'g2Saved';
        if (fresh) p.setAttribute('role', 'status');
        p.innerHTML = `<span class="g2Mark" aria-hidden="true"></span>` +
          `<span class="g2Fact">${E(said)}</span>`;
        body.insertBefore(p, body.firstChild);
      }

      const rail = body.querySelector('.g2Rail');
      if (rail && clothsHere.length > 1) {
        let at = 0, queued = false;
        const follow = () => {
          queued = false;
          const i = Math.round(rail.scrollLeft / Math.max(1, cardPitch(rail)));
          const cl = clothsHere[Math.max(0, Math.min(clothsHere.length - 1, i))];
          if (!cl || i === at) return;
          at = i;
          ask().lookCloth = cl.id;
          rebindUnit(body, ctx, cl, 'looks', inThisLook(cl));
        };
        rail.addEventListener('scroll', () => {
          if (queued) return;
          queued = true;
          requestAnimationFrame(follow);
        }, { passive: true });
      }
    },
    commit(value) {
      const i = Number(value);
      const apply = P('applyLook');
      if (apply && Number.isFinite(i)) apply(i);
      const G = window.G;
      if (G && G.state && Number.isFinite(i)) {
        const coll = collection();
        const a = (G.state.ask = G.state.ask || {});
        a.look = coll[i] ? coll[i].nm : null;
        a.lookCloth = null;
        a.clothLooked = null;
      }
      return 'build';
    },
  };

  function cardPitch(rail) {
    const first = rail.querySelector('.g2RailCell');
    if (!first) return 1;
    const second = first.nextElementSibling;
    if (second) return Math.abs(second.offsetLeft - first.offsetLeft) || first.offsetWidth;
    return first.offsetWidth || 1;
  }

  function bookCount() {
    const data = P('D');
    const n = (data && data.suitings)
      ? data.suitings.filter((s) => !s.photoUnusable && !s.dupOf).length : 0;
    return n ? `${num(n)} cloths in the book` : '';
  }

  function bookFact() {
    return `${reachCount()} — every weight and pattern`;
  }
  function reachCount() {
    const f = P('universe');
    let n = 0;
    try { n = f ? f() : 0; } catch (e) { n = 0; }
    if (!n) return bookCount();           
    return `${num(n)} cloths this commission can be cut from`;
  }

  const COUNT_WORDS = ['no', 'one', 'two', 'three', 'four', 'five',
                       'six', 'seven', 'eight', 'nine', 'ten'];
  function shelfLooks() {
    const G = window.G;
    return (G && Array.isArray(G.looks)) ? G.looks : [];
  }
  function shelfCount() { return shelfLooks().length; }
  function spelt(n) { return n < COUNT_WORDS.length ? COUNT_WORDS[n] : num(n); }
  function shelfFact() {
    const n = shelfCount();
    return n ? `${spelt(n)} ${n === 1 ? 'look' : 'looks'}` : '';
  }
  function shelfWords() {
    const n = shelfCount();
    return n ? `${sentence(spelt(n))} ${n === 1 ? 'look' : 'looks'} saved.` : '';
  }
  function openShelf(ctx) {
    const G = window.G;
    const facts = (G && typeof G.lookFacts === 'function') ? G.lookFacts : null;
    const cards = shelfLooks().map((l) => {
      const f = facts ? facts(l) : null;
      const name = (f && f.name) || (l && l.name) || '';
      if (!name) return '';
      const e = collection().find((c) => c && c.cloth && c.cloth.id === l.clothId);
      return ctx.tile({
        plate: e ? cardPlate(e) : null,
        swatch: (f && f.cloth) ? { src: P('thumbOf') ? P('thumbOf')(f.cloth, 'suiting') : '', alt: '' } : null,
        name,
        fact: [f && f.garment ? f.garment.label : '',
               f && f.clothName ? f.clothName : ''].filter(Boolean).join(' · '),
        word: 'Chosen',
        selected: !!(f && f.inHand),
        multi: true,
        act: () => {
          if (G && typeof G.wearLook === 'function') {
            try { G.wearLook(l); } catch (err) {   }
          }
          ctx.goto('build');
        },
      });
    }).filter(Boolean);
    if (!cards.length) return;
    ctx.sheet('shelf',
      ctx.rail(cards, { label: 'The looks you have saved' }) +
      `<p class="g2Advice">${E('A saved look is the garment, the cloth and the make. ' +
        'Paul takes one commission at a time.')}</p>`,
      { heading: 'The looks you have saved', close: 'Close' });
  }


  const DETAIL_UNTEXTURED = ['ga-1-wool-stretch/707005'];
  function detailPath(it) { const f = P('detailOf'); return f ? f(it) : ''; }
  function detailTrusted(it) {
    const p = detailPath(it);
    return !!p && !DETAIL_UNTEXTURED.some((bad) => p.indexOf(bad) >= 0);
  }
  function squarePath(it) { const f = P('imgOf'); return f ? f(it, 'suiting') : ''; }

  function handPlate(it) {
    const ok = detailTrusted(it);
    return {
      src: ok ? detailPath(it) : squarePath(it),
      w: 481,
      full: true,
      cls: ok ? 'g2Hand' : 'g2Hand g2Hand--square',
      alt: '',
      eager: true,
    };
  }
  function tilePlate(it) {
    const thumb = P('thumbOf');
    return {
      src: squarePath(it),
      srcset: `${thumb ? thumb(it, 'suiting') : ''} 224w, ${squarePath(it)} 320w`,
      sizes: '208px',
      fileW: 320,
      cls: 'g2Sq',
      alt: '',
    };
  }

  function clothFacts(it) {
    const gsm = P('gsmText'), book = P('bookName');
    return [it.c, gsm ? gsm(it) : '', book ? book(it) : '', shelfProvenance(it)]
      .filter(Boolean).join(' · ');
  }
  function clothTitle(it) {
    const said = houseWords(it);
    if (said) return said;
    const plain = P('plainName');
    return plain ? plain(it) : String(it.c);
  }

  const COLOUR_STOPS = 6;                  
  function buildFacet(slot, label, values, cur, setter) {
    const count = P('clothCount');
    if (!count) return null;
    const safe = (over) => { try { return count(over); } catch (e) { return 0; } };
    const opts = [];
    for (const [k, text] of values) {
      const n = safe({ [slot]: k ?? null });
      if (k != null && !n) continue;                  
      opts.push({ k: k ?? '', text, n });
    }
    if (opts.filter((o) => o.k !== '').length < 2) return null;
    return { slot, label, cur: cur ?? '', opts, setter };
  }
  function sixStops(facet) {
    if (!facet) return facet;
    const all = facet.opts.filter((o) => o.k === '');
    const rest = facet.opts.filter((o) => o.k !== '');
    if (rest.length <= COLOUR_STOPS - all.length) return facet;
    const room = COLOUR_STOPS - all.length;
    const held = rest.filter((o) => String(o.k) === String(facet.cur));
    const bySize = rest.filter((o) => !held.includes(o))
      .slice().sort((a, b) => b.n - a.n).slice(0, room - held.length);
    const keep = new Set(held.concat(bySize).map((o) => o.k));
    return { ...facet, opts: all.concat(rest.filter((o) => keep.has(o.k))) };
  }
  function facetRows() {
    const st = state();
    return [sixStops(buildFacet('shelf', 'Colour',
      [[null, 'All colours']].concat(P('SHELVES') || []), st.shelf, 'setShelf'))]
      .filter(Boolean);
  }
  function offStrip() {
    const st = state();
    return [
      buildFacet('season', 'Weight',
        (P('BANDS') || []).map(([k, , narrow]) => [k, k == null ? 'All weights' : narrow]),
        st.season, 'setSeason'),
      buildFacet('pat', 'Pattern',
        (P('PATS') || []).map(([k, l]) => [k, k == null ? 'All patterns' : l]),
        st.pat, 'setPat'),
    ].filter(Boolean);
  }

  function orderNow() {
    const f = P('sortKey');
    try { return f ? f() : 'shelf'; } catch (e) { return 'shelf'; }
  }

  function groupHTML(label, said, chips) {
    if (!chips) return '';
    return `<div class="g2Facet" role="group" aria-label="${E(said)}">` +
      `<span class="g2Eyebrow g2StripHead">${E(label)}</span>${chips}</div>`;
  }
  function narrowedBy(facets) {
    const said = [];
    for (const f of facets) {
      if (!f || f.cur === '' || f.cur == null) continue;
      const on = f.opts.find((o) => String(o.k) === String(f.cur));
      if (on && on.text) said.push(String(on.text));
    }
    return said.join(' · ');
  }
  function countHTML(off, live) {
    const basis = narrowedBy(off);
    const names = off.filter((f) => f && f.cur !== '' && f.cur != null)
      .map((f) => String(f.label).toLowerCase());
    const who = names.length && basis
      ? `Starting from your commission’s ${names.join(' and ')} — ${basis}.`
      : '';
    return who ? `<div class="g2CountUnit">` +
      `<p class="g2Advice g2CountBasis">${E(who)}</p>` +
      `</div>` : '';
  }

  function stripHTML(facets, sorts, live, off) {
    return `<div class="g2Head">` + countHTML(off || [], live) + `</div>`;
  }

  const PAGE = 6;

  const CLOTH_FADE_VARS = ['--g2-fade-to', '--g2-fade-from'];
  let clothFadeKey = '';         
  let clothFadeOwned = false;    
  let clothFadePending = false;
  const clothFadeH = { w: 0, px: 0 };    
  const fadeLayer = () => (window.G && window.G.el) || document.getElementById('guidedLayer');
  function clothFadeOff() {
    const layer = fadeLayer();
    if (layer && clothFadeOwned) {
      for (const n of CLOTH_FADE_VARS) layer.style.removeProperty(n);
    }
    clothFadeKey = '';
    clothFadeOwned = false;
  }
  function clothFadeNow() {
    const G = window.G;
    const staged = document.body.classList.contains('gsee-stage');
    const onCloth = !!(G && G.current && G.current.id === 'cloth') && !staged;
    if (!onCloth) {
      if (staged) { clothFadeKey = ''; clothFadeOwned = false; }
      else clothFadeOff();
      return;
    }
    const layer = fadeLayer();
    const scr = document.getElementById('guidedScroll');
    const foot = layer && layer.querySelector('.gFoot');
    let win = null;
    if (scr && foot) {
      if (clothFadeH.w !== innerWidth) {
        clothFadeH.w = innerWidth;
        clothFadeH.px = parseFloat(getComputedStyle(foot, '::before').height) || 0;
      }
      const f = foot.getBoundingClientRect();
      const s = scr.getBoundingClientRect();
      if (clothFadeH.px > 0 && f.width > 0) {
        const y0 = s.bottom - clothFadeH.px, y1 = s.bottom;
        let to = null, from = null;
        for (const plate of layer.querySelectorAll('.g2Plate')) {
          const p = plate.getBoundingClientRect();
          if (p.width <= 0 || p.height <= 0) continue;
          if (p.bottom <= y0 || p.top >= y1) continue;
          const l = Math.max(0, Math.round(p.left - f.left));
          const r = Math.min(Math.round(f.width), Math.round(p.right - f.left));
          if (r <= l) continue;
          to = to === null ? l : Math.min(to, l);
          from = from === null ? r : Math.max(from, r);
        }
        if (to !== null) win = { to, from };
      }
    }
    const key = win ? win.to + ':' + win.from : '';
    if (key === clothFadeKey) return;
    clothFadeKey = key;
    if (!layer) return;
    if (!win) {
      for (const n of CLOTH_FADE_VARS) layer.style.removeProperty(n);
      clothFadeOwned = false;
    } else {
      layer.style.setProperty('--g2-fade-to', win.to + 'px');
      layer.style.setProperty('--g2-fade-from', win.from + 'px');
      clothFadeOwned = true;
    }
  }
  function clothFadeSoon() {
    if (clothFadePending) return;
    clothFadePending = true;
    requestAnimationFrame(() => { clothFadePending = false; clothFadeNow(); });
  }
  let clothFadeScroller = null;
  let clothFadeGlobal = false;
  function armClothFade() {
    clothFadeKey = '';             
    const scr = document.getElementById('guidedScroll');
    if (scr && scr !== clothFadeScroller) {
      scr.addEventListener('scroll', clothFadeSoon, { passive: true });
      clothFadeScroller = scr;
    }
    if (!clothFadeGlobal) {
      clothFadeGlobal = true;
      window.addEventListener('resize', clothFadeSoon);
    }
    clothFadeSoon();
  }

  function openTheBook(back) {
    const open = P('openOverlay');
    if (!open) return;
    const layer = (window.G && window.G.el) || document.getElementById('guidedLayer');
    const ov = document.getElementById('overlay');
    if (layer) layer.setAttribute('inert', '');
    open('cloth');
    if (!ov) { if (layer) layer.removeAttribute('inert'); return; }
    const done = () => {
      if (layer) layer.removeAttribute('inert');
      if (typeof back === 'function') back();
      const btn = layer && layer.querySelector('[data-g2-act=book]');
      if (btn) btn.focus({ preventScroll: true });
    };
    const mo = new MutationObserver(() => {
      if (ov.classList.contains('open')) return;
      mo.disconnect();
      done();
    });
    mo.observe(ov, { attributes: true, attributeFilter: ['class'] });
    if (!ov.classList.contains('open')) { mo.disconnect(); done(); }
  }

  function bookDoorFact() {
    const count = P('clothCount');
    let now = 0;
    try { now = count ? count() : 0; } catch (e) { now = 0; }
    const whole = bookFact();
    return now ? `opens on your ${now.toLocaleString()} — ${whole}` : whole;
  }

  function openClothSheet(ctx, opts) {
    const o = opts || {};
    const G = window.G;

    function sixNow() {
      const pool = P('clothPool');
      const list = pool ? pool() : [];
      const held = state().cloth;
      const base = list.slice(0, PAGE);
      return (held ? [held].concat(base.filter((r) => r && r.id !== held.id)) : base)
        .slice(0, PAGE);
    }

    let lookedAt = null;    
    function innerHTML() {
      const st = state();
      const held = st.cloth;
      const OCCS = P('OCCASIONS') || [];
      const rows = sixNow();
      const tiles = rows.map((it) => ctx.tile({
        plate: tilePlate(it),
        name: clothTitle(it),
        fact: clothFacts(it),
        word: 'Chosen',
        selected: !!held && held.id === it.id,
        act: () => takeFromSheet(it.id),
      })).join('');
      const filters =
        '<div class="gask-filters">' +
          '<label class="gask-filter">' +
            '<span class="gask-filterlabel">' + E('For wearing in') + '</span>' +
            '<select data-gask-filter="season">' +
            CLIMATES.map(([key, name]) => '<option value="' + E(key) + '"' +
              (String(st.season ?? '') === key ? ' selected' : '') + '>' + E(name) + '</option>').join('') +
            '</select>' +
          '</label>' +
          '<label class="gask-filter">' +
            '<span class="gask-filterlabel">' + E('What it\u2019s for') + '</span>' +
            '<select data-gask-filter="occasion">' +
            OCCS.map(([key, label]) => '<option value="' + E(key) + '"' +
              (st.occasion === key ? ' selected' : '') + '>' + E(sentence(String(label).toLowerCase())) + '</option>').join('') +
            '</select>' +
          '</label>' +
        '</div>';
      const gsm = climateFact(String(st.season ?? ''));
      const gsmLine = gsm
        ? '<p class="gsee-fine gask-gsm">' + E(gsm) + '</p>' : '';
      const note = st.narrowNote
        ? '<p class="g2Advice gask-note" role="status">' + E(String(st.narrowNote)) + '</p>' : '';
      const unit = held && ctx.swatchLine
        ? '<div class="gsee-unit">' + ctx.swatchLine(held) + '</div>' : '';
      const looked = lookedAt && held && lookedAt !== held.id
        && window.G && typeof window.G.setBeside === 'function'
        ? (() => {
            const it = rows.find((r) => r && r.id === lookedAt);
            return it
              ? '<button type="button" class="g2Quiet gask-beside" data-gask-beside="' + E(lookedAt) + '">' +
                E('See ' + clothTitle(it) + ' next to yours') + '</button>'
              : '';
          })()
        : '';
      return filters + gsmLine + note +
        '<p class="g2Advice gask-lede">' + E('Tap a cloth to see it up close \u2014 ' +
          'nothing changes until you take one.') + '</p>' +
        (rows.length
          ? '<div class="g2Grid gask-six" role="radiogroup" aria-label="' + E('Six cloths under your answers') + '">' + tiles + '</div>'
          : '<div class="g2Advice">' + E('Nothing here can be made into what you\u2019ve chosen. ' +
            'Try the whole book below \u2014 it holds every cloth we have.') + '</div>') +
        unit + looked +
        ctx.doors([
          { label: 'The whole book', fact: bookDoorFact(), act: () => bookFromSheet() },
          { label: 'Paul\u2019s own looks', fact: 'seven suits Paul has already put together',
            act: () => { ctx.closeSheet(); if (G && typeof G.goto === 'function') G.goto('looks'); } },
        ]);
    }

    function roveSix() {
      const grid = G && G.el ? G.el.querySelector('.g2Sheet .gask-six') : null;
      if (!grid) return;
      const rs = Array.from(grid.querySelectorAll('[role=radio]'));
      let at = rs.findIndex((r) => r.getAttribute('aria-checked') === 'true');
      if (at < 0) at = 0;
      rs.forEach((r, i) => { r.tabIndex = i === at ? 0 : -1; });
    }
    function paintSheet() {
      const bodyEl = G && G.el ? G.el.querySelector('.g2Sheet .gask-sheetbody') : null;
      if (bodyEl) bodyEl.innerHTML = innerHTML();
      roveSix();
    }

    function takeFromSheet(id) {
      const before = state().cloth ? state().cloth.id : null;
      const ov = document.getElementById('closeup');
      openClose(id);
      if (!ov) return;
      let took = false;
      const press = (ev) => {
        if (ev.target && ev.target.closest && ev.target.closest('.cutake')) took = true;
      };
      ov.addEventListener('click', press, true);
      const settle = () => {
        ov.removeEventListener('click', press, true);
        const now = state().cloth ? state().cloth.id : null;
        if (took || (now === id && now !== before)) {
          ctx.closeSheet();
          if (typeof o.taken === 'function') o.taken(id);
        } else {
          lookedAt = id;
          paintSheet();
          const back = (window.G && window.G.el)
            ? window.G.el.querySelector('.g2Sheet .g2SheetH') : null;
          if (back && back.focus) back.focus({ preventScroll: true });
        }
      };
      if (!ov.classList.contains('open')) { settle(); return; }
      const mo = new MutationObserver(() => {
        if (ov.classList.contains('open')) return;
        mo.disconnect();
        settle();
      });
      mo.observe(ov, { attributes: true, attributeFilter: ['class'] });
    }

    function bookFromSheet() {
      const before = state().cloth ? state().cloth.id : null;
      openTheBook(() => {
        const now = state().cloth ? state().cloth.id : null;
        if (now && now !== before) {
          ctx.closeSheet();
          if (typeof o.taken === 'function') o.taken(now);
        } else {
          paintSheet();
          const back = G && G.el ? G.el.querySelector('.g2Sheet .g2SheetH') : null;
          if (back && back.focus) back.focus({ preventScroll: true });
        }
      });
    }

    ctx.sheet('clothroom',
      '<div class="gfin-sheet gask-sheet"><div class="gask-sheetbody">' + innerHTML() + '</div></div>',
      { heading: 'The cloth', close: 'Back to your suit', overStage: true,
        returnTo: '.gbSet[data-k="cloth"]' });

    const sheet = G && G.el ? G.el.querySelector('.g2Sheet') : null;
    if (sheet) {
      sheet.addEventListener('click', (ev) => {
        const hit = ev.target && ev.target.closest ? ev.target.closest('[data-gask-beside]') : null;
        if (!hit) return;
        const set = window.G && window.G.setBeside;
        if (!set || !set(hit.dataset.gaskBeside)) return;
        ctx.closeSheet();           
      });
      sheet.addEventListener('change', (ev) => {
        const sel = ev.target && ev.target.closest ? ev.target.closest('[data-gask-filter]') : null;
        if (!sel) return;
        const kind = sel.getAttribute('data-gask-filter');
        if (kind === 'season') {
          const set = P('setSeason');
          if (set) set(sel.value || null);
        } else {
          const set = P('setOccasion');
          if (set && sel.value) set(sel.value);
        }
        if (typeof o.filtered === 'function') o.filtered();
        paintSheet();
        const again = sheet.querySelector('[data-gask-filter="' + kind + '"]');
        if (again && again.focus) again.focus({ preventScroll: true });
        const stN = state();
        if (stN && stN.narrowNote && G && typeof G.say === 'function') G.say(String(stN.narrowNote));
      });
      if (G && G.el) {
        const mo = new MutationObserver(() => {
          if (document.contains(sheet)) return;
          mo.disconnect();
          if (typeof o.done === 'function') o.done();
        });
        mo.observe(G.el, { childList: true });
      }
    }
    roveSix();
  }

  const CLIMATES = [
    ['', 'Anywhere, all year'],
    ['spring_summer', 'Warm rooms & summer'],
    ['year_round', 'Four seasons'],
    ['autumn_winter', 'Autumn & winter'],
    ['winter', 'Real winter'],
  ];
  function climateFact(key) {
    if (!key) return 'The whole shelf, every weight.';
    const doc = (window.PT_SEASONS && window.PT_SEASONS.suiting) || {};
    const band = doc[key];
    return band ? `${band.gsm} g/m² — ${band.line}` : '';
  }

  const STEPS = [looks];
  function registerAll() {
    const G = window.G;
    if (!G || typeof G.register !== 'function') return false;
    if (registerAll.done) return true;
    registerAll.done = true;
    for (const s of STEPS) G.register(s);
    return true;
  }
  if (!registerAll()) {
    document.addEventListener('DOMContentLoaded', registerAll, { once: true });
    window.addEventListener('load', registerAll, { once: true });
  }
  window.PT_GUIDED_ASK = { steps: STEPS, CURATION, LOOK_ADVICE, curated, occasionViews, facetRows,
    openClothSheet };    

  const FLOOR = `
@layer gask-fallback {
  /* THE STEP'S OWN VERTICAL RHYTHM — between units, --space-800 (§5.2), and it
     is PADDING and not margin on purpose: modern.html carries an unlayered
     universal reset that zeroes every margin on the page, and an unlayered
     declaration beats a layered one at every specificity, so a margin written
     in this block would silently do nothing. Where guided.css already gives an element its own step (the door
     row, the rail) the two simply add air; nothing overlaps. */
  #guidedLayer .gSlot > * + * { padding-top:var(--space-800); }

  /* ── the rooms ─────────────────────────────────────────────────────────
     A declared box, so nothing shifts when the file lands, and the plate does
     the rest. The look card's room is the card's own 600×780; the grid tile's is
     the square tier's own 320×320; the cloth in hand's is the detail tier's own
     MEDIAN, 481×420 — measured across 2,055 files — into which a wider file is
     fitted down and a narrower one stands at its own size on the ground. */
  #guidedLayer .g2Card { aspect-ratio:600 / 780; }
  #guidedLayer .g2Sq { aspect-ratio:1; }
  /* T5 · the cloth's own square in the caption's gutter — 44 CSS px of a 224px
     file, which is a downscale and therefore house practice, fitted and never
     cropped by the plate it goes through like every other photograph here. */
  /* ── GUIDED-3 MICRO WAVE 3 · FABRIC 2, 29 August 2026 ────────────────────
     THE SMALL CHIPS TAKE THE BAND TOO. The fabric judge's audit: "ceremonial/
     75401-2.webp, ceremonial/75021-4.webp, ga-2-wool-stretch/707218.webp,
     ceremonial/75021-5.webp, jt-tweed-2/708061.webp — all box 44×44, border 0,
     band L/T/R/B = 0/0/0/0, first pixel outside on all four sides #F7F4EC
     chroma 11. The book tiles and the shelf tiles both took the opaque #F7F7F7
     border this wave; the chips did not." RULING-002 does not scale with the
     picture. The border is the plate's own ground, so the box does not move, no
     row pitch changes and no srcset/sizes claim changes — only the photograph
     inside it is 4px smaller on each side, fitted as it already was. */
  #guidedLayer .g2Swatch {
    aspect-ratio:1; flex:none; align-self:flex-start;
    box-sizing:border-box;
    border:var(--space-100) solid var(--color-surface-fabric-surround-book);
  }
  #guidedLayer .g2Hand { aspect-ratio:481 / 420; }
  #guidedLayer .g2Hand--square { aspect-ratio:1; }

  /* ── the looks rail: how much of the next photograph is in view ────────
     The direction's own condition on the lookbook (§5.3) is that the scroll cue
     IS the next photograph — no chevron, no fade, no bouncing hint. So at ≤599
     the rail runs to the viewport edge (§3.2's one exemption), the cell is the
     reading column, and the band that is left carries the next card's own edge
     onto the screen. The negative margin is exactly the reading area's own
     compact inset, so it can only ever cancel a padding this layer is already
     painting: there is no width unit here and no scrollbar to mis-measure. A
     CAPTION IS TYPE AND TYPE DOES NOT BLEED, so the words keep the margin the
     photograph gives up. */
  /* AND THE CARD IS BOUND BY THE SHORTER OF TWO THINGS, so its photograph is
     never clipped by the plate's own ceiling. The column gives the width; the
     engine's plate gives every box a 52svh ceiling at compact — so a card
     wider than 52svh × the card's own aspect (600/780) would have its foot cut
     off by overflow:hidden, which is a crop, and this layer does not crop.
     The - 1px is the rounding: it keeps the derived height inside the ceiling
     rather than exactly on it. */
  #guidedLayer .g2Rail > .g2RailCell {
    width:min(calc(100% - var(--space-1200)), calc(52svh * 600 / 780 - 1px)); }
  #guidedLayer .g2Rail .g2Cap { padding-inline:var(--layout-margin-compact); }
  #guidedLayer .g2Rail .g2Tile::after { margin-inline:var(--layout-margin-compact); }
  #guidedLayer .g2Move { padding-top:var(--space-300);
    padding-inline:var(--layout-margin-compact); }

  /* ── the narrowing row and the facet strip: ONE container, twice ───────
     The narrowing row on looks and the facets on cloth are the same act in the
     same construction, so they are the same container: a single-height line,
     scrolled sideways, snapping so a flick always lands a whole chip and never
     half a label (flow §4.2b, §4.3b). No box, no chevron, no native control —
     the chips are .g2Quiet, which guided.css already dresses. */
  /* GUIDED-3 · V14 (28 Aug 2026) — THE RAIL SNAPS, AND IT KEEPS ITS OWN RIGHT
     PADDING. Measured on the shipped build at 390: the narrowing row's last
     visible chip was cut mid-word at the viewport edge ("A wedding —"), which
     the ledger has carried as an open nit for two rounds. Two changes:
       · "x mandatory" on the LOOKS row, so a flick always comes to rest on a
         whole chip and never on half a label. The facet strip stays "proximity"
         — it carries four labelled GROUPS, and mandatory snapping inside a group
         of six values fights a thumb that is reading along the line rather than
         choosing from it.
       · the right padding is the reading margin again, and scroll-padding with
         it, so the chip a client scrolls or tabs to stops clear of the edge
         instead of against it. */
  #guidedLayer .g2Views, #guidedLayer .g2Strip {
    display:flex; align-items:center; gap:var(--space-600);
    overflow-x:auto; overscroll-behavior-x:contain; scrollbar-width:none;
    scroll-snap-type:x proximity;
    padding-inline:var(--layout-margin-compact);
    scroll-padding-inline:var(--layout-margin-compact); }
  #guidedLayer .g2Views { scroll-snap-type:x mandatory; }
  #guidedLayer .g2Views::-webkit-scrollbar,
  #guidedLayer .g2Strip::-webkit-scrollbar { display:none; }
  #guidedLayer .g2View { flex:none; white-space:nowrap;
    scroll-snap-align:start; }
  #guidedLayer .g2ViewWords { white-space:nowrap; }
  #guidedLayer .g2ViewNum { font-variant-numeric:var(--type-figures-default); }
  /* a facet group: its eyebrow, then its values, all on the one line */
  #guidedLayer .g2Facet { flex:none; display:flex; align-items:center;
    gap:var(--space-300); scroll-snap-align:start; }
  #guidedLayer .g2StripHead { flex:none; white-space:nowrap;
    padding-left:var(--space-300); }
  #guidedLayer .g2Head > * + * { padding-top:var(--space-300); }
  /* V16 · the count and its basis, one unit, on their own line ABOVE the strip.
     It used to be the strip's first chip-height snap point, which meant the one
     figure on the screen scrolled off the moment a thumb flicked the facets
     (measured at 1280). A statement is not a control and does not live in the
     rail of controls. The basis sits under the figure at --type-size-100,
     which is the same construction the plinth prints money in. */
  /* …and it takes no inline padding of its own: the strip beneath it is pulled
     out to the screen edge and pads itself back in, while the head is already
     standing on the reading column. */
  #guidedLayer .g2CountUnit > * + * { padding-top:var(--space-100); }
  #guidedLayer .g2Count { font-variant-numeric:var(--type-figures-default); }
  /* T6 · the acknowledgement: the mark, then the count, on one baseline. (The
     mark's own opacity is guided.css's — an unlayered "opacity:0" at rest beats
     anything this layered block could say about it, so the rule that shows it
     lives beside the rule that hides it.) */
  #guidedLayer .g2Saved { display:flex; align-items:flex-start;
    gap:var(--space-300); }
  /* the foot of the judgement: the colour unit and the doors, one step down */
  #guidedLayer .g2ClothFoot { padding-top:var(--space-800); }
  /* GUIDED-3 · M10 · and the one line that sets this cloth beside the one in
     hand, between the judgement it is about and the doors out. A quiet line —
     the engine's own construction — with the step §5.2 gives a line of its own
     above a door row. */
  #guidedLayer .g2ClothFoot .g2Beside { display:block; margin-top:var(--space-300); }

  /* ── the cloth judgement: one container, two compositions ─────────────
     ≤599 — two columns, both bays spanning them, so the screen reads
     photograph → how to narrow → the alternatives. The row gap is the engine's
     own tile-to-tile step, which every tile but the first already carries, so
     the grid adds none of its own and the two never sum; the words bay pays for
     its own step because no tile precedes it. */
  #guidedLayer .g2Cloths { display:grid;
    grid-template-columns:repeat(2,minmax(0,1fr));
    column-gap:var(--layout-surround-band-cloth); row-gap:0; }
  #guidedLayer .g2Cloths > .g2WordsBay,
  #guidedLayer .g2Cloths > .g2More,
  #guidedLayer .g2Cloths > .g2ClothFoot { grid-column:1 / -1; }
  #guidedLayer .g2ClothSpread > .g2WordsBay { padding-bottom:var(--space-800); }
  #guidedLayer .g2ClothSpread > .g2WordsBay > * + * { padding-top:var(--space-300); }
  #guidedLayer .g2ClothSpread > .g2More { padding-top:var(--space-800); }
  #guidedLayer .g2TileHand { grid-column:1 / -1; }
  /* A GRID ITEM DOES NOT STRETCH HERE. A <button> centres its own content when
     the box is taller than it, so two tiles in one row whose captions run to a
     different number of lines put their photographs at different heights — 10px
     apart, measured. Each tile takes its own height and the row starts them
     level; the captions end where they end, which is what a caption does. */
  /* MW3 · accessibility 4 — .g2Rack and .g2Shortcuts are display:contents, so
     their children ARE this grid's items and every placement below still reads
     them; the two wrappers exist only so the radiogroup owns radios alone. The
     child combinators that used to name the tiles become descendant ones for
     the same reason, and nothing about the boxes changes. */
  #guidedLayer .g2Rack, #guidedLayer .g2Shortcuts { display:contents; }
  #guidedLayer .g2Cloths .g2Tile { align-self:start; }
  #guidedLayer .g2More > * + * { padding-top:var(--space-300); }
  #guidedLayer .g2Note { padding-left:var(--space-300);
    border-left:var(--border-width-emphasis) solid var(--color-line-strong);
    color:var(--color-ink-primary); }

  /* ── 600, the one breakpoint ──────────────────────────────────────────
     Above the rung the lookbook's cell takes the direction's own bay (362×471)
     and the cloth grid opens to three. Nothing else changes: one composition
     above the rung, at every width (§5.1). */
  @media (min-width:600px) {
    #guidedLayer .g2Rail > .g2RailCell {
      width:min(362px, calc(76svh * 600 / 780 - 1px)); }
    #guidedLayer .g2Rail .g2Cap,
    #guidedLayer .g2Rail .g2Tile::after,
    #guidedLayer .g2Move { padding-inline:0; }
    #guidedLayer .g2Cloths { grid-template-columns:repeat(3,minmax(0,1fr)); }
    #guidedLayer .g2Views, #guidedLayer .g2Strip { padding-inline:0; }
  }

  /* ── 1024: §9.4's SPREAD, and the shortlist 4-up beneath it ────────────
     Four columns. The plate bay takes the first two and the words bay the last
     two, so the 481px mill plate stands on its own ground with the count, the
     facets and what a narrowing set aside beside it — instead of one plate
     marooned in 1184 with 350px of leftover either side, which is the defect
     direction §1 measured and §9.4 was written to end. The eleven alternatives
     then run 4-up at (1184 − 3 × 48) / 4 ≈ 260, which is §9.4's "4-up at 266
     wide full width beneath the spread" to within the gutter. The strip wraps
     here rather than scrolling, because there is room: at ≥1024 every facet
     value and every count is on the screen at once, with nothing to flick.
     .g2PlateBay and .g2WordsBay are guided.css's own names and its 1024 block
     dresses them; only the columns are this file's, because nothing in
     guided.css claims .g2Cloths. */
  @media (min-width:1024px) {
    /* ── T5 · THE LOOKBOOK'S DESKTOP CARD ─────────────────────────────────
       GUIDED-3 · 28 August 2026. Measured on the shipped build at 1280×720:
       three cards, 362×471, whose legs were cut by the plinth and whose NAMES,
       true lines and occasions were all below the fold — "three identical dark
       rectangles", and the worst-converting screen in the product. The card is
       a unit and a unit that is cut in half is not one, so above the rung the
       cell is bound by the shorter of two things: the direction's own 362px
       bay, and the height this screen actually has left for a photograph.
       THE ARITHMETIC, measured on this build at 1280×720 and written down so it
       can be re-measured rather than guessed at:
         masthead 65 · the scroller's air 32 · the house line 78 · the narrowing
         row 44 · the step to the rail 32 = 251 to the top of the first
         photograph, and the caption under it runs to 196 on the longest of the
         three cards. 720 − 251 − 196 = 273 of photograph, which at the card's
         own 600/780 is a 210px cell.
       Measured after it: at 1280×720 the name, the occasion, the facts and the
       true line of ALL THREE cards end above 720 (718 on the longest), where
       every one of them was below it; at 1440×900 nothing is bound and the cell
       is the direction's own bay. The looks screen has no pinned foot to crop
       them against any more either (V9). The rail's own snap behaviour is
       untouched at every width (M13). */
    #guidedLayer .g2Rail > .g2RailCell {
      width:min(362px, calc((100svh - 452px) * 600 / 780)); }
    /* the cloth square gives up 4px where the column is tightest; it is still
       a downscale of the 224 tier by a factor of seven. */
    #guidedLayer .g2Swatch { width:32px; height:32px; }
    #guidedLayer .g2Cloths { grid-template-columns:repeat(4,minmax(0,1fr));
      column-gap:var(--space-1200); }
    #guidedLayer .g2ClothSpread .g2TileHand { grid-column:1 / 3; grid-row:1 / 3; }
    #guidedLayer .g2ClothSpread > .g2WordsBay { grid-column:3 / 5; grid-row:1;
      align-self:end; padding-bottom:var(--space-800); }
    #guidedLayer .g2ClothSpread > .g2ClothFoot { grid-column:3 / 5; grid-row:2;
      align-self:start; padding-top:0; }
    #guidedLayer .g2ClothSpread > .g2More { padding-top:var(--space-1200); }
  }
}
/* ══════════════════════════════════════════════════════════════════════════
   THE ONE DECLARATION THAT MUST NOT BE LAYERED, AND WHY.
   ══════════════════════════════════════════════════════════════════════════
   modern.html carries an unlayered universal reset that zeroes every margin on
   the page. An unlayered rule
   beats a layered one at every specificity, so a negative margin written inside
   the block above is silently dead — and a negative margin is the only way a
   plate runs to the viewport edge, which is the direction's own §3.2 exemption
   and the condition §5.3 attaches to the lookbook (the scroll cue IS the next
   photograph). It is ONE property, on ONE container, at ≤599 only, and it is
   exactly the reading area's own compact inset, so it can only ever cancel a
   padding this layer is already painting. Above the rung it is zero, which is
   also the composition the direction asks for: plates inset, never full-bleed.
   guided.css's own .g2Rail block declares no inline margin, and its own link
   stands later in the document, so it still wins anything it does declare. */
#guidedLayer .g2Rail,
#guidedLayer .g2Views,
#guidedLayer .g2Strip{ margin-inline:calc(var(--layout-margin-compact) * -1); }
@media (min-width:600px){
  #guidedLayer .g2Rail,
  #guidedLayer .g2Views,
  #guidedLayer .g2Strip{ margin-inline:0; }
}`;
  function floor() {
    if (document.getElementById('gaskFloor')) return;
    const st = document.createElement('style');
    st.id = 'gaskFloor';
    st.textContent = FLOOR;
    (document.head || document.documentElement).appendChild(st);
  }
  floor();
}());
