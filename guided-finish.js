(function () {
  'use strict';

  const REACH = {
    S: () => S,
    D: () => D,
    esc: () => esc,
    byId: () => byId,
    paint: () => paint,
    pushAsk: () => pushAsk,
    emailRe: () => EMAIL_RE,
    paintSoon: () => paintSoon,
    fig: () => fig,
    priced: () => priced,
    liveTotal: () => liveTotal,
    noFigureYet: () => NO_FIGURE_YET,
    noFigureShort: () => NO_FIGURE_SHORT,
    noModelLine: () => NO_MODEL_LINE,
    MONTHS: () => MONTHS,
    dayMonth: () => dayMonth,
    MONO_PLACE: () => MONO_PLACE,
    RECORD: () => RECORD,
    pairedRecord: () => pairedRecord,
    hasModel: () => hasModel,
    unmeasured: () => unmeasured,
    COLLECTION: () => COLLECTION,
    GARMENTS: () => GARMENTS,
    MAKES: () => MAKES,
    LINES: () => LINES,
    PATH: () => PATH,
    imgOf: () => imgOf,
    thumbOf: () => thumbOf,
    detailOf: () => detailOf,
    gsmText: () => gsmText,
    baseName: () => baseName,
    plainName: () => plainName,
    bookName: () => bookName,
    categoryName: () => categoryName,
    patWord: () => patWord,
    pool: () => pool,
    mixOf: () => mixOf,
    codeSpan: () => codeSpan,
    pickShirt: () => pickShirt,
    shirtQty: () => shirtQty,
    shirtCount: () => shirtCount,
    shirtCharge: () => shirtCharge,
    makeItFive: () => makeItFive,
    focusShirt: () => focusShirt,
    SHIRT_PRICE: () => SHIRT_PRICE,
    SHIRT_RUN: () => SHIRT_RUN,
    settledLine: () => settledLine,
    outstandingAct: () => outstandingAct,
    contactProblem: () => contactProblem,
    clearContactProblem: () => clearContactProblem,
    colourBlock: () => colourBlock,
    contactBlock: () => contactBlock,
    placeBlock: () => placeBlock,
    placeVerb: () => placeVerb,
    placeCommission: () => placeCommission,
    placedMode: () => placedMode,
    keptLine: () => keptLine,
    commissionAnother: () => commissionAnother,
    setSeason: () => setSeason,
    setOccasion: () => setOccasion,
    paintColourPath: () => paintColourPath,
    paintOutstanding: () => paintOutstanding,
    setThread: () => setThread,
    openCloseup: () => openCloseup,
    preloadCloseup: () => preloadCloseup,
    pickLining: () => pickLining,
    PT_CONTACT: () => PT_CONTACT,
    contactRoute: () => contactRoute,
    liningPool: () => (() => pool(D.linings, S.liningShelf, S.liningPat, 'sh')),
    keepPicture: () => keepPicture,
    tourLine: () => tourLine,
    CUT: () => CUT,
    cutWord: () => cutWord,
    garmentNeeds: () => garmentNeeds,
  };
  function P(name) { try { return REACH[name](); } catch (e) { return undefined; } }

  const DOMAIN_CODE = /\s*\(DOMAIN [A-Z0-9]+\)/g;
  const E = (s) => {
    const t = String(s == null ? '' : s).replace(DOMAIN_CODE, '');
    const f = P('esc');
    if (f) return f(t);
    return t.replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };
  const state = () => P('S') || {};
  const eng = () => window.G;
  const repaint = () => { const f = P('paint'); if (f) { try { f(); } catch (e) {   } } };

  function scratch() {
    const G = eng();
    if (!G || !G.state) return {};
    if (!G.state.finish || typeof G.state.finish !== 'object') G.state.finish = {};
    return G.state.finish;
  }

  function say(text) {
    const box = document.getElementById('guidedSay');
    if (!box) return;
    const t = String(text || '');
    box.textContent = '';
    if (t) setTimeout(() => { if (box.isConnected) box.textContent = t; }, 120);
  }

  function again(step, body, ctx, focusSel) {
    try { step.render(body, ctx); } catch (e) { const G = eng(); if (G && G.refresh) G.refresh(); return; }
    const G = eng();
    if (G && typeof G.refreshChrome === 'function') G.refreshChrome();
    if (step === commit) sync(body);
    if (!focusSel) return;
    const el = typeof focusSel === 'function' ? focusSel(body) : body.querySelector(focusSel);
    if (el && el.focus) el.focus({ preventScroll: true });
  }

  const ACTS = new WeakMap();
  function wire(body, acts) {
    ACTS.set(body, acts || {});
    if (body.dataset.gfinWired) return;
    body.dataset.gfinWired = '1';
    body.addEventListener('click', (ev) => {
      const hit = ev.target.closest ? ev.target.closest('[data-gfin-act]') : null;
      if (!hit || !body.contains(hit)) return;
      const fn = (ACTS.get(body) || {})[hit.dataset.gfinAct];
      if (!fn) return;
      ev.preventDefault();
      fn(hit, ev);
    });
  }

  const DETAIL_UNTEXTURED = ['ga-1-wool-stretch/707005'];
  function detailPath(cl) { const f = P('detailOf'); return f && cl ? f(cl) : ''; }
  function squarePath(cl) { const f = P('imgOf'); return f && cl ? f(cl, 'suiting') : ''; }
  function detailTrusted(cl) {
    const p = detailPath(cl);
    return !!p && !DETAIL_UNTEXTURED.some((bad) => p.indexOf(bad) >= 0);
  }

  function portraitKind() {
    const has = P('hasModel');
    try { if (has && has()) return 'stage'; } catch (e) {   }
    return cardFor() ? 'card' : 'cloth';
  }

  function cardFor(look) {
    const st = state();
    const clothId = look ? look.clothId : (st.cloth ? st.cloth.id : null);
    const garment = look ? look.garment : (st.garment ? st.garment[0] : null);
    if (!clothId) return null;
    const all = P('COLLECTION') || [];
    const hit = all.find((e) => e.cloth && e.cloth.id === clothId
      && (e.garment || 'two') === (garment || 'two'));
    return hit || null;
  }
  function cardPlate(e, w) {
    const code = String(e.cloth.c).replace(/\//g, '_');
    return {
      src: `assets/cards/${code}.jpg`,
      srcset: `assets/cards/${code}-160.jpg 160w, assets/cards/${code}-320.jpg 320w, ` +
        `assets/cards/${code}.jpg 600w`,
      sizes: `${w}px`,
      w,
      fileW: 600,
      fileH: 780,
      cls: 'gfin-card',
      alt: '',
      eager: true,
    };
  }

  function clothPlateSpec(cl, kind) {
    const ok = detailTrusted(cl);
    return {
      src: ok ? detailPath(cl) : squarePath(cl),
      full: kind === 'cloth',
      cls: 'gfin-cloth' + (ok ? '' : ' gfin-cloth--square'),
      alt: '',
      eager: true,
    };
  }
  function clothUnit(ctx, cl, kind, o) {
    if (!cl) return '';
    const pair = !(o && o.pair === false);
    const named = clothFacts(cl);
    const open = P('openCloseup');
    const plate = ctx.plate(clothPlateSpec(cl, kind));
    const door = !open ? null
      : '<button type="button" class="g2Door gfin-clothdoor" data-gfin-act="closeup"' +
        ` data-id="${E(cl.id)}"` +
        ` aria-label="${E('The mill’s photograph of ' + (P('plainName') ? P('plainName')(cl) : String(cl.c)))}">` +
        plate +
        '<span class="gfin-cident">' +
          `<span class="g2Name">${E(named)}</span>` +
          '<span class="g2DoorArrow" aria-hidden="true">→</span>' +
        '</span></button>';
    return '<div class="gfin-plateWrap" data-g2-persist="cloth">' +
      (door || plate) +
      '<div class="gfin-plateCap">' +
        (door ? '' : `<span class="g2Name">${E(named)}</span>`) +
        ((pair && ctx.swatchLine) ? ctx.swatchLine(cl) : '') +
      '</div></div>';
  }

  function clothFacts(cl) {
    const plain = P('plainName'), gsm = P('gsmText');
    if (!cl) return '';
    const name = plain ? plain(cl) : String(cl.c || '');
    const code = name.indexOf(String(cl.c)) < 0 ? cl.c : '';
    return [name, code, gsm ? gsm(cl) : ''].filter(Boolean).join(' · ');
  }

  function absenceLine() {
    for (const id of ['vizFail', 'makeNoModel', 'thStillNote']) {
      const el = document.getElementById(id);
      const t = el && String(el.textContent || '').trim();
      if (t) return t;
    }
    return P('noModelLine') || '';
  }

  function figureHTML() {
    const f = P('fig'), total = P('liveTotal'), isPriced = P('priced');
    if (isPriced && !isPriced()) {
      return `<div class="gfin-figure gfin-figure--none">${E(P('noFigureYet') || '')}</div>`;
    }
    if (!f || !total) return '';
    try {
      const g = f(total(), 'total', { cls: 'gfin-fig' });
      return `<div class="gfin-figure">${g.html}` +
        (g.covers ? `<span class="gfin-covers">${E(g.covers)}</span>` : '') +
        `<span class="gfin-basis">${E(g.basis)}</span></div>`;
    } catch (err) {
      console.error('GUIDED · the commission’s figure could not be composed.', err);
      return '';
    }
  }

  const PAIR = {
    navy: ['light_blue', 'cream'],
    other_blues: ['light_blue', 'cream'],
    charcoal: ['light_blue', 'pink'],
    grey: ['light_blue', 'pink'],
    black_and_midnight: ['light_blue', 'grey'],
    brown_earth: ['cream', 'blue'],
    stone_and_fawn: ['cream', 'blue'],
    natural_and_ivory: ['light_blue', 'pink'],
    green: ['cream', 'light_blue'],
    burgundy_red: ['cream', 'light_blue'],
    statement: ['light_blue', 'cream'],
  };
  const PAIR_DEFAULT = ['light_blue', 'cream'];

  function lightestOfShelf(shelf, pattern) {
    const D = P('D'), pl = P('pool');
    if (!D || !pl || !D.shirtings) return null;
    try {
      const list = pl(D.shirtings, shelf, pattern ?? null, 'shirtShelf');
      return list.reduce((best, it) => (best == null || (it.L ?? 0) > (best.L ?? 0) ? it : best), null);
    } catch (e) { return null; }
  }
  function mixNote(it) {
    const m = P('mixOf');
    if (!m || !it) return null;
    try { return m(it) || null; } catch (e) { return null; }
  }
  function shirtOffer() {
    const st = state();
    const pair = PAIR[st.cloth ? st.cloth.sh : ''] || PAIR_DEFAULT;
    const out = [];
    const push = (it, role) => {
      if (it && !out.some((x) => x.item.id === it.id)) out.push({ item: it, role });
    };
    push(lightestOfShelf('white', 'plain'), 'white');
    push(lightestOfShelf(pair[0], 'plain'), 'colour');
    for (const pat of ['stripe', 'check']) {
      const cand = lightestOfShelf(pair[0], pat) || lightestOfShelf('white', pat);
      const verdict = mixNote(cand)?.verdict;
      if (cand && (verdict === 'easy' || verdict === 'careful')) { push(cand, 'pattern'); break; }
    }
    push(lightestOfShelf(pair[1], 'plain'), 'second');
    return out.slice(0, 4);
  }
  const qtyOf = (id) => (state().shirts || []).filter((x) => x.id === id).length;

  const NUMBER_WORD = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const runWord = (n) => NUMBER_WORD[n] || String(n);

  function shirtPlate(it) {
    const img = P('imgOf'), thumb = P('thumbOf');
    const src = img ? img(it, 'shirting') : '';
    const small = thumb ? thumb(it, 'shirting') : '';
    return {
      src,
      srcset: small && src ? `${small} 224w, ${src} 320w` : '',
      sizes: '165px',
      cls: 'gfin-shirtshot',
      alt: '',
    };
  }


  const FORM_NOT_YET = 'Nothing here is fitted to you until Paul has taken your record.';
  const formLine = () => {
    const G0 = window.G;
    if (!G0 || typeof G0.formLine !== 'function') return '';
    return G0.formLine(notMeasured() ? { clause: FORM_NOT_YET } : {});
  };
  function portraitHTML(ctx, kind) {
    if (kind === 'stage') {
      return '<div class="gfin-bay gfin-portrait">' +
        '<div class="gsee-window" aria-hidden="true"></div>' +
        '<div class="gfin-portraitsaid">' +
          `<span class="gfin-fine">${E(formLine())}</span>` +
        '</div></div>';
    }
    if (kind === 'card') {
      const e = cardFor();
      return '<div class="gfin-bay gfin-portrait gfin-portrait--card">' +
        ctx.plate(cardPlate(e, 338)) +
        `<span class="gfin-fine">${E(formLine())}</span></div>`;
    }
    const said = absenceLine();
    return said ? `<div class="gfin-bay gfin-portrait gfin-portrait--none">` +
      `<span class="gfin-absent">${E(said)}</span></div>` : '';
  }

  function openRoom(el) {
    const open = P('openCloseup');
    if (open && el && el.dataset.id) open(el.dataset.id);
  }
  function armCloth(body) {
    for (const el of body.querySelectorAll('.gfin-clothdoor')) {
      if (el.dataset.gfinArmed) continue;
      el.dataset.gfinArmed = '1';
      const warm = () => {
        const f = P('preloadCloseup');
        if (f) { try { f(el.dataset.id); } catch (e) {   } }
      };
      el.addEventListener('pointerenter', warm);
      el.addEventListener('focus', warm);
    }
  }

  function looksRail(ctx) {
    const G = eng();
    const all = (G && Array.isArray(G.looks)) ? G.looks : [];
    if (all.length < 2) return '';
    const facts = (G && typeof G.lookFacts === 'function') ? G.lookFacts : null;
    const cards = all.map((l, i) => {
      const f = facts ? facts(l) : null;
      const e = cardFor(l);
      const cloth = f ? f.cloth : null;
      const plate = e ? cardPlate(e, 160)
        : (cloth ? { src: squarePath(cloth), w: 160, fileW: 320, fileH: 320, cls: 'gfin-card', alt: '' } : null);
      const name = (f && f.name) || (l && l.name) || '';
      if (!name) return '';
      const here = !!(f && f.inHand);
      return ctx.tile({
        plate,
        name,
        fact: [f && f.garment ? f.garment.label : '', f && f.clothName ? f.clothName : '',
          f && f.figure ? '' : (f && f.noFigure) || ''].filter(Boolean).join(' · '),
        advice: '',
        word: 'The one you are placing',
        selected: here,
        multi: true,                         
        cls: 'gfin-look gfin-look' + i,
        act: (c2) => wearAnother(l, i),
      }) + (f && f.figure ? `<div class="gfin-lookfig">${f.figure.html}</div>` : '');
    }).filter(Boolean);
    if (!cards.length) return '';
    return `<div class="gfin-railwrap"><span class="g2Eyebrow">On your rack</span>` +
      ctx.rail(cards, { label: 'The looks you have saved' }) +
      `<span class="gfin-fine">${E('Paul takes one commission at a time. Each figure is that look ' +
        'on its own, as Paul prices it today.')}</span></div>`;
  }
  function wearAnother(look, i) {
    const G = eng();
    if (G && typeof G.wearLook === 'function') { try { G.wearLook(look); } catch (e) {   } }
    else repaint();
    say(((G && typeof G.lookFacts === 'function' && G.lookFacts(look) || {}).name || 'This look') +
      ' — this is the one you are placing.');
    const body = commit._body, ctx = commit._ctx;
    if (body && ctx) again(commit, body, ctx, '.gfin-look' + i);
  }

  function visitorLine() {
    const room = document.getElementById('thVisitor');
    const ps = room ? Array.from(room.querySelectorAll('p.lede')) : [];
    for (const p of ps) {
      const t = String(p.textContent || '').replace(/\s+/g, ' ').trim();
      if (/no form can stand in for that/i.test(t)) return t;
    }
    return '';
  }
  const notMeasured = () => { const f = P('unmeasured'); try { return !!(f && f()); } catch (e) { return false; } };

  function recordHTML(ctx) {
    const r = P('RECORD'), paired = P('pairedRecord');
    const G = eng();
    const held = (G && G.state && G.state.fitting) || null;
    if (notMeasured()) {
      const said = visitorLine();
      return '<div class="gfin-record">' +
        '<span class="g2Eyebrow">Your record</span>' +
        `<span class="gfin-recline">${E('Paul has not taken your record yet.')}</span>` +
        (said ? `<span class="gfin-fine">${E(said)}</span>` : '') +
        '</div>';
    }
    if (!r) return '';
    const nums = paired ? paired() : String(r.body || '');
    const prov = ['Measured in person by ' + r.tailor, r.city, r.locked].filter(Boolean).join(' · ');
    const fine = [
      prov + '.',
      r.mock ? 'Demonstration record — not a real client’s measurements.' : '',
      held ? held.label + '. Held for you in this demonstration \u2014 Paul confirms every fitting personally.' : '',
    ].filter(Boolean).join(' ');
    return '<div class="gfin-record">' +
      `<span class="g2Eyebrow">Your record</span>` +
      `<span class="gfin-recline">${E(nums + '.')}</span>` +
      `<span class="gfin-fine">${E(fine)}</span>` +
      '</div>';
  }
  function recordDoor(ctx) {
    const G = eng();
    const held = (G && G.state && G.state.fitting) || null;
    return {
      label: held ? 'Ask Paul for another time'
        : notMeasured() ? 'Ask Paul to measure you' : 'Ask Paul to measure you again',
      fact: 'a demonstration calendar',
      cls: 'gfin-recorddoor',
      act: () => { rememberScroll(); ctx.goto('fitting'); },
    };
  }

  function shirtsDoorHTML(ctx) {
    const offer = shirtOffer();
    if (!offer.length) return '';
    const f = P('fig'), price = P('SHIRT_PRICE'), count = P('shirtCount');
    const n = count ? count() : 0;
    const rate = (f && price != null) ? f(price, 'rate').html : '';
    const shown = (offer.find((o) => o.role === 'colour' || o.role === 'second')
      || offer.find((o) => o.role === 'pattern') || offer[0]).item;
    const thumb = P('thumbOf');
    const src = thumb ? thumb(shown, 'shirting') : '';
    const fact = n
      ? `${n === 1 ? 'one shirt' : runWord(n) + ' shirts'} on the paper`
      : `${runWord(offer.length)} pairings`;
    return '<button type="button" class="g2Door gfin-shirtsdoor" data-gfin-act="shirtsheet">' +
      (src
        ? '<span class="g2Plate gfin-doorshot" style="--g2-plate-w:112px;--g2-plate-h:112px">' +
          `<img alt="" width="224" height="224" decoding="async" loading="lazy" src="${E(src)}" sizes="112px">` +
          '</span>'
        : '') +
      '<span class="g2DoorLabel">Shirts to go with it</span>' +
      `<span class="g2DoorFact">${E(fact)}${rate ? ' · ' + rate + ' each' : ''}</span>` +
      '<span class="g2DoorArrow" aria-hidden="true">→</span></button>';
  }

  function contactPrivacy() {
    const build = P('contactBlock');
    if (!build) return '';
    try {
      const box = document.createElement('div');
      box.innerHTML = build();
      const feet = Array.from(box.querySelectorAll('.foot'));
      const last = feet[feet.length - 1];
      return last ? String(last.textContent || '').trim() : '';
    } catch (e) { return ''; }
  }
  function fieldHTML(id, label, opt) {
    const o = opt || {};
    return '<span class="gfin-named">' +
      `<input id="${E(id)}" class="gfin-field" type="${E(o.type || 'text')}"` +
      ` autocomplete="${E(o.autocomplete || 'off')}" inputmode="${E(o.inputmode || 'text')}"` +
      ` size="${E(o.size || 14)}" value="${E(o.value || '')}" data-gfin-in="${E(o.key || '')}">` +
      `<label class="gfin-fieldlabel" for="${E(id)}">${E(label)}</label>` +
      '</span>';
  }
  function contactHTML() {
    const st = state();
    const c = st.contact || {};
    return '<div class="gfin-contact">' +
      `<span class="gfin-ahead">${E('Paul writes to every commission himself.')}</span>` +
      '<span class="gfin-contactsaid">' +
      `<span class="gfin-say">${E('Write to')}</span> ` +
      fieldHTML('ctName', 'Your name',
        { autocomplete: 'name', size: 14, value: c.name || '', key: 'name' }) +
      `<span class="gfin-say gfin-join"> ${E('at')} </span>` +
      fieldHTML('ctEmail', 'Email',
        { type: 'email', autocomplete: 'email', inputmode: 'email', size: 18,
          value: c.email || '', key: 'email' }) +
      `<span class="gfin-say gfin-join">${E('.')}</span>` +
      '</span>' +
      `<span class="gfin-fine">${E(contactPrivacy())}</span>` +
      '</div>';
  }

  function reshapeColour(box) {
    if (!box) return;
    const paths = box.querySelector('.paths');
    if (paths && box.getAttribute('role') === 'radiogroup') {
      box.removeAttribute('role');
      paths.setAttribute('role', 'radiogroup');
      const by = box.getAttribute('aria-labelledby');
      if (by) { paths.setAttribute('aria-labelledby', by); box.removeAttribute('aria-labelledby'); }
    }
    for (const b of box.querySelectorAll('[role=radio]')) {
      if (b.classList.contains('g2Row')) continue;
      const note = b.querySelector('.pw');
      const noteText = note ? String(note.textContent || '') : '';
      if (note) note.remove();
      const said = String(b.textContent || '').trim();
      const cut = said.indexOf(' — ');
      const head = cut > 0 ? said.slice(0, cut) : said;
      const tail = cut > 0 ? said.slice(cut + 3) : '';
      b.textContent = '';
      b.className = 'g2Row gfin-colourrow';
      const mark = document.createElement('span');
      mark.className = 'g2Mark';
      mark.setAttribute('aria-hidden', 'true');
      const words = document.createElement('span');
      words.className = 'g2RowWords';
      const name = document.createElement('span');
      name.className = 'g2Name';
      name.textContent = head;
      const word = document.createElement('span');
      word.className = 'g2Chosen';
      word.textContent = 'Taken';
      name.appendChild(word);
      words.appendChild(name);
      if (tail) {
        const fact = document.createElement('span');
        fact.className = 'g2Fact';
        fact.textContent = tail;
        words.appendChild(fact);
      }
      if (noteText) {
        const adv = document.createElement('span');
        adv.className = 'g2Advice';
        adv.textContent = noteText;
        words.appendChild(adv);
      }
      b.appendChild(mark);
      b.appendChild(words);
    }
  }

  function actBlockHTML() {
    const place = P('placeBlock');
    if (!place) {
      return `<div class="gfin-note">${E('We can\u2019t show the terms for placing a commission here. ' +
        'They\u2019re in the workshop, in full \u2014 and Paul writes to you before anything is cut.')}</div>`;
    }
    let html = '';
    try { html = place(true); } catch (e) { return ''; }
    const box = document.createElement('div');
    box.innerHTML = html;
    for (const b of Array.from(box.querySelectorAll('.place'))) b.remove();
    const carried = /\+?\d[\d\s()-]{7,}/.test(String(box.textContent || ''))
      || !!box.querySelector('a[href^="tel:"]');
    return '<div class="gfin-act">' + box.innerHTML + (carried ? '' : askPaulHTML()) + '</div>';
  }
  function askPaulHTML() {
    const route = P('contactRoute');
    let said = '';
    try { said = route ? String(route() || '') : ''; } catch (e) { said = ''; }
    if (!said) return '';
    return `<p class="gfin-fine gfin-ask">${E('Ask Paul about this commission — reach him ')}` +
      `<span class="gfin-reach">${said}.</span></p>`;
  }
  function plinthOutstanding(body) {
    const G = eng();
    const foot = (G && G.el ? G.el.querySelector('.gFoot') : null)
      || document.getElementById('guidedFoot');
    if (!foot) return;
    const src = body ? body.querySelector('#placeOutstanding button') : null;
    const said = src ? String(src.textContent || '').replace(/\s+/g, ' ').trim() : '';
    const have = foot.querySelector('.gfin-hold');
    if (!said) { if (have) have.remove(); return; }
    if (have && have.dataset.said === said) return;
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'gfin-hold';
    row.dataset.said = said;
    row.innerHTML = src.innerHTML;         
    row.addEventListener('click', () => { if (src.isConnected) src.click(); });
    if (have) have.remove();
    foot.insertBefore(row, foot.querySelector('.gAct') || foot.firstChild);
  }

  function plinthKept(body) {
    const G = eng();
    const foot = (G && G.el ? G.el.querySelector('.gFoot') : null)
      || document.getElementById('guidedFoot');
    const kept = P('keptLine') ? P('keptLine')() : '';
    const verb = P('placeVerb');
    let mode = '';
    try { mode = verb ? verb().mode : ''; } catch (e) { mode = ''; }
    const said = (mode === 'swatch' && kept) ? kept : '';
    const note = body && body.isConnected ? body.querySelector('.gfin-kept') : null;
    if (!foot) { if (note) note.hidden = false; return null; }
    const have = foot.querySelector('.gfin-keptrow');
    if (!said) {
      if (have) have.remove();
      if (note) note.hidden = false;
      return null;
    }
    if (note) note.hidden = true;
    if (have && have.dataset.said === said) return have;
    const row = document.createElement('p');
    row.className = 'gfin-keptrow';
    row.dataset.said = said;
    row.setAttribute('tabindex', '-1');
    row.textContent = said;
    if (have) have.remove();
    foot.insertBefore(row, foot.querySelector('.gWays') || null);
    return row;
  }

  const ASK = 'Read it over, then place it.';

  const commit = {
    id: 'commit',
    title: ASK,
    rail: 'The order',
    question: false,
    stage: true,
    compose: 'spread',
    money: false,

    get act() {
      const placed = P('placedMode') ? P('placedMode')() : false;
      if (placed) return null;
      const verb = P('placeVerb');
      let mode = '';
      try { mode = verb ? verb().mode : ''; } catch (e) { mode = ''; }
      const kept = P('keptLine') ? P('keptLine')() : '';
      if (mode === 'swatch' && kept) return null;
      return { label: verbLabel(), act: () => place(commit._ctx) };
    },

    render(body, ctx) {
      commit._body = body;
      commit._ctx = ctx;
      pruneTrail();
      const st = state();
      const cl = st.cloth || null;
      const kind = portraitKind();
      const placed = P('placedMode') ? P('placedMode')() : false;
      const kept = P('keptLine') ? P('keptLine')() : '';
      const settled = P('settledLine');
      const said = settled ? oneSentence(settled) : '';

      const head =
        `<h2 class="gQ gfin-q" id="gH" tabindex="-1">${E(ASK)}</h2>` +
        `<p class="g2Title gfin-said">${E(said)}</p>` +
        figureHTML() +
        '';

      const doorRail = '<div class="g2Doors">' +
        ctx.door(recordDoor(ctx)) +
        shirtsDoorHTML(ctx) +
        '</div>';

      const restartRow = (window.G && typeof window.G.askStartAgain === 'function'
        && (typeof window.G.settled !== 'function' || window.G.settled()))
        ? '<div class="gfin-restartrow"><button type="button" class="g2Quiet gfin-restart"' +
          ' data-g="again">Start again</button></div>'
        : '';
      const words =
        settledFour() +
        looksRail(ctx) +
        recordHTML(ctx) +
        '<div id="gfinColour" class="gfin-colour"></div>' +
        contactHTML() +
        doorRail +
        restartRow +
        actBlockHTML() +
        (placed
          ? `<div class="gfin-note">${E('This commission is with Paul now. Your rack keeps every look ' +
              'on it \u2014 Paul takes one commission at a time.')}</div>`
          : '') +
        (kept ? `<div class="gfin-note gfin-kept" role="status" tabindex="-1">${E(kept)}</div>` : '');

      body.innerHTML =
        portraitHTML(ctx, kind) +
        `<div class="gfin-head">${head}</div>` +
        clothUnit(ctx, cl, kind, { pair: false }) +
        `<div class="gfin-words">${words}</div>`;

      wire(body, {
        shirtsheet: () => openShirts(ctx),
        closeup: (el) => openRoom(el),
        buildopen: (el) => {
          const G0 = eng();
          if (G0 && typeof G0.goto === 'function') G0.goto('build', { open: el.dataset.open || null });
        },
      });
      armCloth(body);

      const slot = body.querySelector('#gfinColour');
      const build = P('colourBlock');
      if (slot && build && cl) {
        try { slot.innerHTML = build(cl); } catch (e) {   }
        reshapeColour(slot.querySelector('#colourBlock'));
      }

      for (const input of body.querySelectorAll('[data-gfin-in]')) {
        input.addEventListener('input', onContactInput);
      }

      if (!body.dataset.gfinSync) {
        body.dataset.gfinSync = '1';
        body.addEventListener('click', () => setTimeout(() => sync(body), 0));
        body.addEventListener('input', () => sync(body));
      }

      setTimeout(() => {
        if (!body.isConnected) return;
        try { P('paintColourPath') && P('paintColourPath')(); } catch (e) {   }
        try { P('paintOutstanding') && P('paintOutstanding')(); } catch (e) {   }
        sync(body);
        restoreScroll();
      }, 0);
    },

    commit(value) { return value === 'placed' ? 'letter' : 'commit'; },
  };

  function oneSentence(settled) {
    const read = (k) => { try { return String(settled(k) || ''); } catch (e) { return ''; } };
    const commission = read('commission');
    const garment = commission.split(/\n|,/)[0].trim();
    const code = String(state().cloth ? state().cloth.c || '' : '');
    const cloth = (() => {
      const said = read('cloth').split(/\n| — /)[0].trim();
      if (!code) return said;
      return said.split(code).join('').replace(/\s*[·,-]\s*$/, '').replace(/\s+/g, ' ').trim();
    })();
    const make = read('make').split(/\n|,| · /)[0].trim();
    const clause = notMeasured() ? ''
      : (commission.split(/\n|,\s*/)[1] || 'cut to your record')
        .replace(/\.$/, '').trim().toLowerCase();
    if (!garment) return '';
    return [
      garment,
      cloth && cloth !== 'Not yet chosen' ? ' in ' + cloth : '',
      make ? ', ' + make.toLowerCase() : '',
      clause ? ', ' + clause : '',
    ].join('') + '.';
  }

  function verbLabel() {
    const verb = P('placeVerb');
    try { return verb ? verb().label : 'Place this commission'; }
    catch (e) { return 'Place this commission'; }
  }

  function onContactInput(ev) {
    const st = state();
    const el = ev.currentTarget;
    if (!st.contact) st.contact = { name: '', email: '', phone: '' };
    st.contact[el.dataset.gfinIn === 'name' ? 'name' : 'email'] = el.value;
    el.removeAttribute('aria-invalid');
    el.removeAttribute('aria-describedby');
    const clear = P('clearContactProblem');
    if (clear) { try { clear(); } catch (e) {   } }
    const soon = P('paintSoon');
    if (soon) soon(); else repaint();
  }

  function actButton() {
    const G = eng();
    const root = (G && G.el) || document.getElementById('guidedLayer');
    return (root && root.querySelector('.gFoot .g2Primary'))
      || (commit._body && commit._body.querySelector('.g2Primary'))
      || null;
  }

  function sync(body) {
    if (!body || !body.isConnected) return;
    const G = eng();
    const foot = G && G.el ? G.el.querySelector('.gFoot') : null;
    const busy = !!(foot && foot.querySelector('.gActBtn[aria-busy]'));
    if (foot && !busy && G && typeof G.refreshChrome === 'function') {
      const wantAct = !!commit.act;
      const haveAct = !!foot.querySelector('.gAct');
      if (wantAct !== haveAct) G.refreshChrome();
    }
    plinthOutstanding(body);
    plinthKept(body);
    plinthPay();
    const btn = actButton();
    if (btn && !btn.getAttribute('aria-busy')) {
      const label = verbLabel();
      if (btn.textContent !== label) btn.textContent = label;
    }
  }

  function plinthPay() {
    const G = eng();
    const foot = (G && G.el ? G.el.querySelector('.gFoot') : null)
      || document.getElementById('guidedFoot');
    if (!foot) return;
    const onCommit = !!document.querySelector('.gStep[data-step="commit"]:not([hidden])');
    const have = foot.querySelector('.gfin-paynote');
    const keptUp = !!foot.querySelector('.gfin-keptrow');
    if (!onCommit || keptUp) { if (have) have.remove(); return; }
    if (have) return;
    const row = document.createElement('div');
    row.className = 'gfin-paynote';
    row.textContent = 'Placing this doesn’t take a payment.';
    foot.insertBefore(row, foot.querySelector('.gAct') || foot.firstChild);
  }

  let placing = false;
  async function place(ctx) {
    const body = commit._body;
    const run = P('placeCommission');
    if (!run || placing) return;
    const btn = actButton();
    const label = btn ? btn.textContent : '';
    placing = true;
    if (btn) { btn.setAttribute('aria-busy', 'true'); btn.textContent = 'Sending this to Paul\u2026'; }
    try { await run(); }
    catch (e) {   }
    placing = false;
    if (btn && btn.isConnected) { btn.removeAttribute('aria-busy'); btn.textContent = label; }
    const placed = P('placedMode') ? P('placedMode')() : false;
    if (!placed) {
      const problem = body ? body.querySelector('#placeProblem') : null;
      const words = problem ? String(problem.textContent || '').trim() : '';
      if (words) say(words);
      sync(body);
      const kept = P('keptLine') ? P('keptLine')() : '';
      if (kept && body && ctx) {
        again(commit, body, ctx, null);
        const row = plinthKept(body);
        if (row && row.focus) row.focus({ preventScroll: true });
        else {
          const note = body.querySelector('.gfin-kept');
          if (note && note.focus) note.focus({ preventScroll: true });
        }
      }
      return;
    }
    rememberPlacement();
    if (ctx && typeof ctx.answer === 'function') ctx.answer('placed');
  }

  function rememberPlacement() {
    const LINES = P('LINES') || [];
    const last = LINES[LINES.length - 1];
    if (!last || !last.reference) return;
    const G = eng();
    const onRack = (G && typeof G.onTheRack === 'function') ? G.onTheRack() : null;
    const rec = scratch();
    rec.placed = rec.placed || {};
    rec.placed[onRack ? onRack.id : 'live'] = String(last.reference);
  }

  function pruneTrail() {
    const G = eng();
    if (!G || !Array.isArray(G.history)) return;
    const h = G.history.slice();
    if (h[h.length - 1] !== 'fitting') return;
    while (h.length && (h[h.length - 1] === 'fitting' || h[h.length - 1] === 'commit')) h.pop();
    G.history = h;
  }
  function restoreScroll() {
    const at = scratch().commitScroll;
    if (at == null) return;
    scratch().commitScroll = null;
    const sc = document.getElementById('guidedScroll');
    if (!sc) return;
    let tries = 0, mine = true;
    const stop = () => { mine = false; };
    for (const ev of ['wheel', 'touchstart', 'keydown']) {
      sc.addEventListener(ev, stop, { once: true, passive: true });
    }
    const put = () => {
      if (!mine || !sc.isConnected) return;
      if (sc.scrollTop !== at) sc.scrollTop = at;
      if (++tries < 3) setTimeout(put, 80);
      else for (const ev of ['wheel', 'touchstart', 'keydown']) sc.removeEventListener(ev, stop);
    };
    requestAnimationFrame(put);
  }
  function rememberScroll() {
    const sc = document.getElementById('guidedScroll');
    if (sc) scratch().commitScroll = sc.scrollTop;
  }

  function focusBack(sel) {
    const body = commit._body;
    const el = body && body.querySelector(sel);
    if (el && el.focus) el.focus({ preventScroll: true });
  }
  function armClose(sel) {
    const G = eng();
    const close = G && G.el ? G.el.querySelector('.g2SheetClose') : null;
    if (close) close.addEventListener('click', () => setTimeout(() => focusBack(sel), 0), { once: true });
  }
  function armCloseRedraw(ctx) {
    const G = eng();
    const sheet = G && G.el ? G.el.querySelector('.g2Sheet') : null;
    if (!sheet || !G.el) return;
    const mo = new MutationObserver(() => {
      if (document.contains(sheet)) return;
      mo.disconnect();
      setTimeout(() => {
        const b = commit._body, c = commit._ctx;
        if (b && c && b.isConnected) again(commit, b, c, '.gfin-shirtsdoor');
      }, 0);
    });
    mo.observe(G.el, { childList: true });
  }

  function changeFacts() {
    const st = state();
    const plain = P('plainName');
    const makes = P('MAKES') || [];
    const mk = makes.find(([t]) => t === st.tier);
    const ini = st.initials ? String(st.initials) + ' inside the jacket' : 'no initials';
    const lab = st.customer ? 'label for ' + String(st.customer) : 'the house label';
    return {
      garment: st.garment ? String(st.garment[1]) : 'the whole workshop',
      cloth: st.cloth ? (plain ? plain(st.cloth) : String(st.cloth.c)) : 'the whole book',
      make: mk ? String(mk[1]) : 'As Paul builds it',
      buttons: st.buttons ? String(st.buttons) : 'as Paul builds them',
      lining: st.lining ? 'sewn inside · ' + String((P('baseName') && P('baseName')(st.lining)) || st.lining.c) : 'sewn inside',
      inside: ini + ' · ' + lab,
    };
  }
  function settledFour() {
    const st = state();
    const f = changeFacts();
    const liName = st.lining
      ? String((P('baseName') && P('baseName')(st.lining)) || st.lining.c) : '';
    const ini = st.initials ? String(st.initials) + ' inside' : '';
    let fin = (st.buttons ? String(st.buttons) : 'As Paul finishes it') +
      (liName ? ' · ' + liName + ' lining' : '') + (ini ? ' · ' + ini : '');
    if (fin.length > 42) {
      fin = (st.buttons ? String(st.buttons) : 'As Paul finishes it') + (ini ? ' · ' + ini : '');
    }
    const line = (k, label, value) =>
      '<button type="button" class="gbSet" data-gfin-act="buildopen" data-open="' + E(k) + '">' +
        '<span class="gbSetWords">' +
          '<span class="gbLabel">' + E(label) + '</span>' +
          '<span class="gbDash"> — </span>' +
          '<span class="gbValue">' + E(value) + '</span>' +
        '</span>' +
        '<span class="gbChange">Change</span>' +
      '</button>';
    return '<div class="gbCol gfin-four">' +
      line('garment', 'The garment', f.garment) +
      line('cloth', 'The cloth', f.cloth) +
      line('make', 'The make', f.make) +
      line('finishing', 'The finishing', fin) +
    '</div>';
  }

  function openFinishing(ctx, opts) {
    const o = opts || {};
    const st = state();
    const M = window.PT_GUIDED_SEE || {};
    const done = () => { if (typeof o.done === 'function') o.done(); };
    const changed = () => { if (typeof o.changed === 'function') o.changed(); };

    const bs = typeof M.buttonRows === 'function' ? M.buttonRows() : [];
    const can = bs.filter((b) => b.can);
    const why = (bs.find((b) => !b.can) || {}).why || '';
    const btn = can.length >= 2
      ? '<div class="gfin-insiderow gfin-btnrow">' +
          '<label class="gfin-insidelabel" for="gfinBtn">Buttons</label>' +
          '<select id="gfinBtn" class="gfin-field gfin-select" data-gfin-btn>' +
          can.map((b) => '<option value="' + E(b.name) + '"' +
            (st.buttons === b.name ? ' selected' : '') + '>' + E(b.name) + '</option>').join('') +
          '</select>' +
          '<span class="gfin-fine">' + E('Both are real horn \u2014 the colour is the only difference.') + '</span>' +
        '</div>'
      : (can[0]
        ? '<div class="gfin-insiderow"><span class="gfin-insidelabel">Buttons</span>' +
          '<span class="gfin-fine">' + E(can[0].name + (why ? ' — ' + why : '')) + '</span></div>'
        : '');

    const base = P('baseName'), bookN = P('bookName');
    const offer = liningOffer();
    const saidOf = (li) => [li.c, bookN ? bookN(li) : ''].filter(Boolean).join(' · ');
    const tiles = offer.map((li, i) => '<div class="gfin-linecell">' + ctx.tile({
      plate: liningPlate(li),
      name: base ? base(li) : String(li.c),
      fact: saidOf(li),
      advice: liningDepth(offer, i),
      word: 'Chosen',
      selected: !!(st.lining && st.lining.id === li.id),
      cls: 'gfin-lining gfin-lining' + i,
      act: () => {
        const take = P('pickLining');
        if (take) { try { take(li.id); } catch (e) {   } }
        changed();
        ctx.closeSheet();
      },
    }) + '</div>').join('');

    const place = (P('MONO_PLACE') || []).find(([k]) => k === st.monoPlace)?.[1] ?? 'On the lining';
    const thread = st.thread ? st.thread[1] : '';
    const inside =
      '<div class="gfin-insiderow">' +
        '<label class="gfin-insidelabel" for="gfinInitials">Initials</label>' +
        `<input id="gfinInitials" class="gfin-field" type="text" maxlength="3" autocomplete="off"` +
        ` spellcheck="false" value="${E(st.initials || '')}" aria-describedby="gfinIniNote"` +
        ` data-gfin-in="initials">` +
        `<span class="gfin-fine" id="gfinIniNote">${E(`Up to three letters, sewn inside the jacket, ` +
          `${String(place).toLowerCase()}, in ${thread} thread — Paul’s standing choice. Leave it ` +
          `empty and there are none.`)}</span>` +
      '</div>' +
      '<div class="gfin-insiderow">' +
        '<label class="gfin-insidelabel" for="gfinLabel">Name on the label</label>' +
        `<input id="gfinLabel" class="gfin-field" type="text" maxlength="28" autocomplete="off"` +
        ` value="${E(st.customer || '')}" aria-describedby="gfinLabNote" data-gfin-in="label">` +
        `<span class="gfin-fine" id="gfinLabNote">${E('The label is sewn into the inside breast pocket. ' +
          'Leaving it as the house label is not a lesser suit.')}</span>` +
      '</div>';

    const html =
      '<div class="gfin-sheet gfin-finishing">' +
        `<span class="gfin-lede">${E('The small details, all in one place. Leave any of them ' +
          'as Paul has set them \u2014 that\u2019s never a lesser suit.')}</span>` +
        btn +
        `<span class="gfin-insidelabel gfin-lininghead">${E('The lining')}</span>` +
        `<span class="gfin-fine">${E('The cloth inside the jacket \u2014 only you ever see it. ' +
          'Pick one and we\u2019ll close this and show it on the chest, where it\u2019s sewn.')}</span>` +
        `<div class="gfin-liningrid" role="radiogroup" aria-label="${E('The lining')}">${tiles}</div>` +
        ((st.lining || offer[0]) && ctx.swatchLine ? ctx.swatchLine(st.lining || offer[0]) : '') +
        inside +
        `<span class="gfin-fine gfin-nil">${E('None of this changes the figure — ')}${nilFig()}${E('.')}</span>` +
      '</div>';
    ctx.sheet('finishing', html, {
      heading: 'The finishing',
      close: 'Back to your suit',
      overStage: true,
      returnTo: '.gbSet[data-k="finishing"]',
    });
    const G = eng();
    const sheet = G && G.el ? G.el.querySelector('.g2Sheet') : null;
    if (sheet) {
      const rs = Array.from(sheet.querySelectorAll('.gfin-liningrid [role=radio]'));
      let at = rs.findIndex((r) => r.getAttribute('aria-checked') === 'true');
      if (at < 0) at = 0;
      rs.forEach((r, i) => { r.tabIndex = i === at ? 0 : -1; });
      for (const input of sheet.querySelectorAll('[data-gfin-in]')) {
        input.addEventListener('input', (ev) => { onInsideInput(ev); changed(); });
      }
      const sel = sheet.querySelector('[data-gfin-btn]');
      if (sel) sel.addEventListener('change', () => {
        const set = M.setButtonTone;
        if (set) { try { set(sel.value); } catch (e) {   } }
        const G2 = eng();
        if (G2 && G2.state) G2.state.build_btn = sel.value;
        changed();
      });
      if (G.el) {
        const mo = new MutationObserver(() => {
          if (document.contains(sheet)) return;
          mo.disconnect();
          done();
        });
        mo.observe(G.el, { childList: true });
      }
    }
  }

  function nilFig() {
    const f = P('fig');
    if (!f) return '';
    try { return f(0, 'line').html; } catch (e) { return ''; }
  }
  function liningOffer() {
    const st = state();
    const pool = P('liningPool');
    let list = [];
    try { list = pool ? pool() : []; } catch (e) { list = []; }
    const out = [];
    if (st.lining) out.push(st.lining);
    for (const li of list) {
      if (out.length >= 4) break;
      if (!out.some((x) => x.id === li.id)) out.push(li);
    }
    const four = out.slice(0, 4);
    const measured = four.length > 1
      && four.every((li) => li && li.hexBasis === 'measured' && Number.isFinite(li.L))
      && new Set(four.map((li) => li.L)).size === four.length;
    return measured ? four.slice().sort((a, b) => a.L - b.L) : four;
  }
  function liningDepth(offer, i) {
    if (offer.length !== 4) return '';
    const measured = offer.every((li) => li && li.hexBasis === 'measured' && Number.isFinite(li.L))
      && new Set(offer.map((li) => li.L)).size === 4;
    const ordered = measured
      && offer.every((li, k) => k === 0 || offer[k - 1].L < li.L);
    if (!ordered) return '';
    return ['The deepest of the four', 'The second deepest', 'The second lightest',
            'The lightest of the four'][i] || '';
  }
  function liningPlate(it) {
    const img = P('imgOf'), thumb = P('thumbOf');
    const src = img ? img(it, 'lining') : '';
    const small = thumb ? thumb(it, 'lining') : '';
    return {
      src,
      srcset: small && src ? `${small} 224w, ${src} 320w` : '',
      sizes: '165px',
      cls: 'gfin-liningshot',
      alt: '',
    };
  }
  function liningSheetHTML(ctx) {
    const st = state();
    const base = P('baseName'), bookName = P('bookName');
    const placed = P('placedMode') ? P('placedMode')() : false;
    const said = (li) => [li.c, bookName ? bookName(li) : ''].filter(Boolean).join(' · ');
    if (placed) {
      const li = st.lining;
      return '<div class="gfin-sheet gfin-liningsheet">' +
        (li
          ? '<div class="gfin-shirthero">' +
              ctx.plate(Object.assign(liningPlate(li), {
                sizes: '320px', w: 320, fileW: 320, fileH: 320, cls: 'gfin-heroshot', eager: true })) +
              '<span class="gfin-heroname">' +
                `<span class="g2Name">${E(base ? base(li) : String(li.c))}</span>` +
                `<span class="g2Fact">${E(said(li))}</span>` +
              '</span></div>'
          : '') +
        `<span class="gfin-fine">${E('Sewn inside the jacket, where only you see it. This ' +
          'commission is with Paul, so nothing here changes it.')}</span>` +
        ctx.primary('Back to the letter', { act: () => ctx.closeSheet() }) +
        '</div>';
    }
    const offer = liningOffer();
    const D = P('D');
    const book = D && D.linings ? D.linings.length : 0;
    const tiles = offer.map((li, i) => '<div class="gfin-shirtcell">' + ctx.tile({
      plate: liningPlate(li),
      name: base ? base(li) : String(li.c),
      fact: said(li),
      advice: liningDepth(offer, i),
      word: 'Chosen',
      selected: !!(st.lining && st.lining.id === li.id),
      cls: 'gfin-lining gfin-lining' + i,
      act: () => takeLining(ctx, li.id),
    }) + '</div>').filter(Boolean);
    return '<div class="gfin-sheet gfin-liningsheet">' +
      `<span class="gfin-lede">${E('The inside of a jacket is the part only the man who owns it ' +
        'ever sees. Choosing one closes this sheet and shows it on the form, on the chest, where ' +
        'it is sewn.')}</span>` +
      `<div class="gfin-shirtgrid">${tiles.join('')}</div>` +
      `<span class="gfin-fine">${E('Choosing one does not change the figure — ')}${nilFig()}` +
        `${E('. The lining is part of the making.')}` +
        `${E(book ? ' The whole lining book is ' + book + ' linings, and it lives in the workshop.' : '')}` +
      '</span>' +
      ((st.lining || offer[0]) && ctx.swatchLine ? ctx.swatchLine(st.lining || offer[0]) : '') +
      ctx.primary('Done', {
        act: () => { ctx.closeSheet(); const b = commit._body, c = commit._ctx;
          if (b && c) again(commit, b, c, '.gfin-changedoor'); },
      }) +
      '</div>';
  }
  function openLining(ctx) {
    const placed = P('placedMode') ? P('placedMode')() : false;
    ctx.sheet('lining', liningSheetHTML(ctx), {
      heading: placed ? 'The lining, sewn inside' : 'The lining · sewn inside',
      close: placed ? 'Back to the letter' : 'Leave the lining as Paul has it',
      returnTo: placed ? '.gfin-liningrow' : '.gfin-changedoor',
    });
    armClose(placed ? '.gfin-liningrow' : '.gfin-liningdoor');
  }
  function takeLining(ctx, id) {
    const take = P('pickLining');
    ctx.closeSheet();
    if (take) { try { take(id); } catch (e) {   } }
    scratch().commitScroll = 0;
    const b = commit._body, c = commit._ctx;
    if (b && c) again(commit, b, c, '.gfin-changedoor');
  }

  function onInsideInput(ev) {
    const st = state();
    const el = ev.currentTarget;
    if (el.dataset.gfinIn === 'initials') {
      el.value = el.value.toUpperCase();
      st.initials = el.value;
      const mirror = document.getElementById('initialsIn');
      if (mirror && mirror.value !== el.value) mirror.value = el.value;
    } else {
      st.customer = el.value;
      const mirror = document.getElementById('labelIn');
      if (mirror && mirror.value !== el.value) mirror.value = el.value;
    }
    const soon = P('paintSoon');
    if (soon) soon(); else repaint();
  }

  function shirtSheetHTML(ctx) {
    const offer = shirtOffer();
    const f = P('fig'), price = P('SHIRT_PRICE'), run = P('SHIRT_RUN');
    const charge = P('shirtCharge'), count = P('shirtCount');
    const n = count ? count() : 0;
    const rate = (f && price != null) ? f(price, 'rate').html : '';
    const line = (f && charge && n) ? f(charge(), 'line').html : '';
    const D = P('D');
    const book = D && D.shirtings ? D.shirtings.length : 0;
    const suitWord = (P('patWord') && state().cloth) ? P('patWord')(state().cloth.p) : '';
    const said = new Set();
    const tiles = offer.map((row, i) => {
      const it = row.item;
      const q = qtyOf(it.id);
      const mix = mixNote(it);
      const base = P('baseName'), gsm = P('gsmText'), bookName = P('bookName');
      const name = base ? base(it) : (it.name || it.c);
      const facts = [it.c, gsm ? gsm(it) : '', bookName ? bookName(it) : ''].filter(Boolean).join(' · ');
      const role = row.role === 'white' ? 'The classic answer'
        : row.role === 'pattern' && mix && mix.verdict
          ? `${mix.verdict.charAt(0).toUpperCase()}${mix.verdict.slice(1)}` +
            (suitWord ? ` with a ${suitWord} suit` : '')
        : row.role === 'colour' ? 'The colour beside this cloth on the shelf'
        : row.role === 'second' ? 'The other colour on that shelf'
        : '';
      const reason = (mix && !said.has(mix.reason)) ? mix.reason : '';
      if (reason) said.add(reason);
      const verdict = role || reason;
      return '<div class="gfin-shirtcell">' + ctx.tile({
        plate: shirtPlate(it),
        name,
        fact: facts + (q > 1 ? ` · ${q} on the paper` : ''),
        advice: verdict || reason,
        word: 'Added',
        selected: q > 0,
        multi: true,
        cls: 'gfin-shirt gfin-shirt' + i,
        act: () => toggleShirt(ctx, it.id, i),
      }) + '</div>';
    });
    const focusId = scratch().shirtFocus;
    const shown = offer.find((o) => o.role === 'colour' || o.role === 'second')
      || offer.find((o) => o.role === 'pattern') || offer[0];
    const focus = (offer.find((x) => x.item.id === focusId) || shown || {}).item || null;
    return '<div class="gfin-sheet gfin-shirtsheet" id="gfinShirtBody">' +
      `<span class="gfin-lede">${E('Cut to the same record as the suit. Nothing here is part of the ' +
        'commission until you add it, and it comes off as easily as it goes on.')}</span>` +
      shirtHeroHTML(ctx, focus) +
      `<div class="gfin-shirtgrid">${tiles.join('')}</div>` +
      `<span class="gfin-fine">${!n
        ? `${E('Shirts are ')}${rate}${E(' each, cut to the same record. The house’s run is ' + runWord(run) + '.')}`
        : `${E(n === 1 ? 'One shirt' : n + ' shirts')}${E(' on the paper — ')}${line}` +
          `${E('. Every shirt is ')}${rate}${E(', at any number; the house’s run is ' + runWord(run) + '.')}`
      }</span>` +
      (n > 0 && run && n < run && f && price != null
        ? ctx.quiet('Make it the house’s run', { cls: 'gfin-five', act: () => runOfFive(ctx) }) +
          `<span class="gfin-fine">${E('A run of ' + runWord(run) + ' is ')}${f(run * price, 'rate').html}` +
          `${E(' — the same rate, ' + runWord(run) + ' times. It is not a saving.')}</span>`
        : '') +
      (focus && ctx.swatchLine ? ctx.swatchLine(focus) : '') +
      `<span class="gfin-fine">${E(book ? `The whole shirting book is ${book} shirtings, and it lives ` +
        `in the workshop.` : '')}</span>` +
      ctx.primary(n ? 'Done — ' + (n === 1 ? 'one shirt' : runWord(n) + ' shirts') + ' on the paper'
        : 'Back to the commission', { act: () => leaveShirts(ctx) }) +
      (n
        ? ctx.quiet('Take them off the paper', { cls: 'gfin-clear', act: () => clearShirts(ctx) })
        : ctx.quiet('Not today', { act: () => leaveShirts(ctx) })) +
      '</div>';
  }
  function leaveShirts(ctx) {
    ctx.closeSheet();
    const b = commit._body, c = commit._ctx;
    if (b && c) again(commit, b, c, '.gfin-changedoor');
  }
  function clearShirts(ctx) {
    const less = P('shirtQty');
    if (!less) return;
    for (let guard = (state().shirts || []).length; guard > 0; guard--) {
      const held = (state().shirts || [])[0];
      if (!held) break;
      try { less(held.id, -1); } catch (e) { break; }
    }
    redrawShirts(ctx, '.g2Primary');
  }
  function shirtHeroHTML(ctx, focus) {
    if (!focus) return '';
    const img = P('imgOf'), thumb = P('thumbOf');
    const src = img ? img(focus, 'shirting') : '';
    if (!src) return '';
    const small = thumb ? thumb(focus, 'shirting') : '';
    const base = P('baseName'), gsm = P('gsmText'), bookName = P('bookName');
    const cl = state().cloth;
    const plain = P('plainName');
    const beside = cl && plain ? `Beside ${plain(cl)}.` : '';
    return '<div class="gfin-shirthero">' +
      ctx.plate({
        src,
        srcset: small && src ? `${small} 224w, ${src} 320w` : '',
        sizes: '320px',
        w: 320, fileW: 320, fileH: 320,
        cls: 'gfin-heroshot', alt: '', eager: true,
      }) +
      '<span class="gfin-heroname">' +
        `<span class="g2Name">${E(base ? base(focus) : (focus.name || focus.c))}</span>` +
        `<span class="g2Fact">${E([focus.c, gsm ? gsm(focus) : '',
          bookName ? bookName(focus) : ''].filter(Boolean).join(' · '))}</span>` +
        (beside ? `<span class="gfin-fine">${E(beside)}</span>` : '') +
      '</span></div>';
  }

  function openShirts(ctx) {
    ctx.sheet('shirts', shirtSheetHTML(ctx),
      { heading: 'Shirts to go with it?', close: 'Back to the commission',
        returnTo: '.gfin-changedoor' });
    armCloseRedraw(ctx);
  }
  function redrawShirts(ctx, focusSel) {
    const G = eng();
    const sheet = G && G.el ? G.el.querySelector('.g2Sheet') : null;
    const box = sheet ? sheet.querySelector('#gfinShirtBody') : null;
    if (!box) return;
    const holder = document.createElement('div');
    holder.innerHTML = shirtSheetHTML(ctx);
    box.replaceWith(holder.firstElementChild);
    const back = sheet.querySelector(focusSel);
    if (back && back.focus) back.focus({ preventScroll: true });
  }
  function toggleShirt(ctx, id, i) {
    const add = P('pickShirt'), less = P('shirtQty');
    if (qtyOf(id) > 0) { if (less) less(id, -1); }
    else if (add) add(id);
    scratch().shirtFocus = id;
    redrawShirts(ctx, '.gfin-shirt' + i);
  }
  function runOfFive(ctx) {
    const five = P('makeItFive');
    if (five) { try { five(); } catch (e) {   } }
    redrawShirts(ctx, '.g2Primary');
  }

  const DAY_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const SLOT_TIMES = ['10:00 am', '11:30 am', '2:00 pm', '4:30 pm'];
  const monIdx = (d) => (d.getDay() + 6) % 7;
  const weekday = (d) => monIdx(d) < 5;
  const monthDays = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();

  function sampleSlots(from) {
    const base = from ? new Date(from) : new Date();
    base.setHours(0, 0, 0, 0);
    let cur = new Date(base.getTime());
    cur.setDate(cur.getDate() + 3);           
    if (cur.getDate() + 3 * (SLOT_TIMES.length - 1) + 6 > monthDays(cur)) {
      cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    }
    const out = [];
    for (let i = 0; i < SLOT_TIMES.length; i++) {
      while (!weekday(cur)) cur.setDate(cur.getDate() + 1);
      out.push({
        y: cur.getFullYear(), m: cur.getMonth(), d: cur.getDate(),
        wd: monIdx(cur), time: SLOT_TIMES[i],
        key: `${cur.getFullYear()}-${cur.getMonth() + 1}-${cur.getDate()}-${i}`,
      });
      cur.setDate(cur.getDate() + 3);
    }
    return out;
  }
  function slotDate(s) {
    const months = P('MONTHS') || [];
    return `${s.d} ${months[s.m] || ''}`.trim();
  }
  function fittingCity() {
    if (notMeasured()) return '';
    const r = P('RECORD');
    const city = r && (r.cityShort || r.city);
    return city ? String(city) : '';
  }
  function slotWhen(s) {
    const city = fittingCity();
    return `${DAY_FULL[s.wd]} · ${s.time}${city ? ' · ' + city : ''}`;
  }
  function slotLabel(s) {
    const city = fittingCity();
    return `${DAY_FULL[s.wd]} ${slotDate(s)}, ${s.time}${city ? ', ' + city : ''}`;
  }

  const FITTING_SAID = [
    'Paul travels to you: a first fitting is taken at your home or your office, in your own city, ' +
      'and takes about twenty minutes. Wear the shirt and the shoes you would wear with the suit; ' +
      'there is nothing to bring, and nothing is cut until Paul has written to you.',
  ];

  const fitting = {
    id: 'fitting',
    title: 'The fitting',
    question: 'When shall Paul measure you?',
    skippable: true,
    money: false,
    render(body, ctx) {
      const slots = sampleSlots();
      fitting._slots = slots;
      const held = (eng() && eng().state && eng().state.fitting) || null;
      body.innerHTML =
        '<div class="gfin-fit">' +
        `<div class="gfin-demo">${E('A demonstration calendar — sample dates, and a description of ' +
          'a fitting written for it. Paul confirms every fitting personally.')}</div>` +
        '<div class="gfin-fitsaid">' +
          FITTING_SAID.map((s) => `<p>${E(s)}</p>`).join('') +
        '</div>' +
        '<div class="gfin-slots">' +
          slots.map((s) => ctx.row({
            name: slotDate(s),
            fact: slotWhen(s),
            value: s.key,
            selected: !!held && held.key === s.key,
            word: 'Chosen',
          })).join('') +
        '</div></div>';
    },
    commit(value) {
      const G = eng();
      if (!G || !G.state) return 'commit';
      if (!value) { G.state.fitting = null; return 'commit'; }
      const s = (fitting._slots || []).find((x) => x.key === value);
      G.state.fitting = s ? { key: s.key, label: slotLabel(s) } : null;
      if (G.state.fitting) {
        say(`${G.state.fitting.label}. Held for you in this demonstration \u2014 Paul confirms every ` +
          `fitting personally.`);
      }
      return 'commit';
    },
  };

  function letterHeading() {
    const said = document.querySelector('#placedLetter h2')?.textContent;
    return (said || '').trim();
  }

  function clientName() {
    const LINES = P('LINES') || [];
    const last = LINES[LINES.length - 1];
    const placedName = last && last.contact ? String(last.contact.name || '').trim() : '';
    if (placedName) return placedName;
    const field = document.getElementById('ctName');
    const typed = field ? String(field.value || '').trim() : '';
    if (typed) return typed;
    return String(state().contact?.name || '').trim();
  }
  function nameTheClient(box) {
    const lead = box.querySelector('.lead');
    const name = clientName();
    if (!lead || !name) return;                  
    const said = lead.textContent || '';
    const at = said.indexOf(' — ');              
    if (at <= 0) return;
    if (said.slice(0, at).trim() === name) return;
    lead.textContent = name + said.slice(at);    
  }

  const LETTER_CUTS = [
    'Paul sets yours himself when he writes to you.',
    'The workshop cuts nothing until Paul has your word back.',
  ];
  function letterDiet(box) {
    const tour = P('tourLine');
    let said = '';
    try { said = tour ? String(tour() || '').trim() : ''; } catch (e) { said = ''; }
    for (const p of Array.from(box.querySelectorAll('p, li'))) {
      const t = String(p.textContent || '').replace(/\s+/g, ' ').trim();
      if (said && t === said) { p.remove(); continue; }
      for (const cut of LETTER_CUTS) {
        if (t.indexOf(cut) < 0) continue;
        const left = t.split(cut).join('').replace(/\s+/g, ' ').trim();
        if (left) p.textContent = left; else p.remove();
      }
    }
  }
  function insideWords() {
    const st = state();
    const place = (P('MONO_PLACE') || []).find(([k]) => k === st.monoPlace)?.[1] ?? '';
    const thread = st.thread ? String(st.thread[1] || '') : '';
    const ini = st.initials
      ? String(st.initials) + ' in ' + (thread || 'the house’s') + ' thread'
        + (place ? ', ' + String(place).toLowerCase() : '')
      : 'no initials';
    const lab = st.customer ? 'label reading ' + String(st.customer) : 'the house label';
    const bts = st.buttons ? String(st.buttons) : '';
    return [bts ? bts + ' buttons' : '', ini, lab].filter(Boolean).join(' · ');
  }
  function makeWords() {
    const st = state();
    const makes = P('MAKES') || [];
    const mk = makes.find(([t]) => t === st.tier);
    const rows = P('CUT') || [];
    const word = P('cutWord');
    const needs = P('garmentNeeds');
    let has = [];
    try { has = needs ? needs() : []; } catch (e) { has = []; }
    const NOUN = { lapel: 'lapel', stance: 'buttons', pockets: 'pockets', vents: 'vents' };
    const cut = [];
    for (const row of rows) {
      if (!has.includes(row.on)) continue;
      const said = word ? String(word(row.key) || '') : '';
      if (!said) continue;
      const noun = NOUN[row.key];
      if (!noun) { cut.push(said); continue; }
      if (said.toLowerCase() === 'none') { cut.push('No ' + noun); continue; }
      const one = row.key === 'stance' && /^one$/i.test(said);
      cut.push(said + ' ' + (one ? 'button' : noun));
    }
    return [mk ? String(mk[1]) : '', ...cut].filter(Boolean).join(' · ');
  }
  function settledRows(box) {
    const table = box.querySelector('table');
    if (!table) return;
    const rows = Array.from(table.querySelectorAll('tr'));
    if (!rows.length) return;
    const seen = (name) => rows.some((tr) => tr.children.length > 1
      && new RegExp('^\\s*' + name + '\\s*$', 'i').test(String(tr.children[0].textContent || '')));
    const shape = rows[0];
    const after = rows.find((tr) => tr.children.length > 1
      && /^\s*Cloth\s*$/i.test(String(tr.children[0].textContent || ''))) || rows[0];
    let at = after;
    for (const [name, said] of [['Make', makeWords()], ['Inside', insideWords()]]) {
      if (!said || seen(name)) continue;
      const tr = shape.cloneNode(false);
      const th = document.createElement(shape.children[0].tagName.toLowerCase());
      th.className = shape.children[0].className;
      th.textContent = name.toUpperCase();
      const td = document.createElement(shape.children[1].tagName.toLowerCase());
      td.className = shape.children[1].className;
      td.textContent = said;
      tr.appendChild(th); tr.appendChild(td);
      at.after(tr);
      at = tr;
    }
  }

  function swatchOnRecord(box, ctx) {
    const cl = state().cloth;
    if (!cl) return;
    for (const tr of Array.from(box.querySelectorAll('tr'))) {
      const cells = tr.children;
      if (cells.length < 2 || !/^\s*Colou?r\s*$/i.test(String(cells[0].textContent || ''))) continue;
      const html = (ctx && ctx.swatchLine) ? ctx.swatchLine(cl) : '';
      if (!html) return;
      const wrap = document.createElement('div');
      wrap.className = 'gfin-recswatch';
      wrap.innerHTML = html;
      cells[1].appendChild(wrap);
      return;
    }
  }

  function recordCaveat(box) {
    const r = P('RECORD');
    if (!r || !r.mock || notMeasured()) return;
    for (const tr of Array.from(box.querySelectorAll('tr'))) {
      const cells = tr.children;
      if (cells.length < 2 || !/^\s*Record\s*$/i.test(String(cells[0].textContent || ''))) continue;
      const val = cells[1];
      if (/Demonstration record/i.test(String(val.textContent || ''))) return;
      const said = document.createElement('span');
      said.className = 'statedfor';
      said.textContent = 'Demonstration record — not a real client’s measurements.';
      val.appendChild(document.createElement('br'));
      val.appendChild(said);
      return;
    }
  }
  function curlApostrophes(box) {
    const walk = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      const t = n.nodeValue;
      if (t && t.indexOf("'") >= 0) n.nodeValue = t.replace(/(\p{L})'(\p{L})/gu, '$1’$2');
    }
  }

  let letterRef = null;
  function letterContent(ctx) {
    const src = document.getElementById('placedLetter');
    if (!src || !src.children.length) return null;
    const box = document.createElement('div');
    box.className = 'letter doc gfin-letter';
    for (const node of Array.from(src.children)) box.appendChild(node.cloneNode(true));
    box.querySelector('h2')?.remove();
    curlApostrophes(box);
    nameTheClient(box);
    letterRef = null;
    for (const tr of Array.from(box.querySelectorAll('tr'))) {
      const cells = tr.children;
      if (cells.length > 1 && String(cells[0].textContent || '').trim() === 'Reference') {
        letterRef = cells[1].innerHTML;
        tr.remove();
        break;
      }
    }
    for (const el of Array.from(box.querySelectorAll('.lcloth, .lclothcap'))) el.remove();
    for (const el of Array.from(box.querySelectorAll('.afterword, .askbox'))) el.remove();
    for (const el of Array.from(box.querySelectorAll('button, input, textarea, select, label'))) el.remove();
    letterDiet(box);
    settledRows(box);             
    recordCaveat(box);
    swatchOnRecord(box, ctx);
    for (const tr of Array.from(box.querySelectorAll('tr'))) {
      const cells = tr.children;
      if (cells.length < 2 || !/^\s*Lining\s*$/i.test(String(cells[0].textContent || ''))) continue;
      const val = cells[1];
      const st = state();
      const nameOf = P('baseName');
      const liName = st && st.lining && nameOf ? String(nameOf(st.lining) || '') : '';
      if (liName && !new RegExp(liName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(val.textContent || '')) {
        val.innerHTML = E(liName) + ' · ' + val.innerHTML;
      }
      val.innerHTML = '<button type="button" class="gfin-liningrow" data-gfin-act="lining">' +
        val.innerHTML + '<span class="g2DoorArrow" aria-hidden="true">→</span></button>';
      break;
    }
    for (const el of Array.from(box.querySelectorAll('[id]'))) {
      el.setAttribute('data-was-id', el.id);
      el.removeAttribute('id');
    }
    return box;
  }

  function keepsakeHTML() {
    if (!letterRef) return '';
    const LINES = P('LINES') || [];
    const last = LINES[LINES.length - 1];
    const day = P('dayMonth');
    let when = '';
    try {
      const iso = last && last.placedAt ? String(last.placedAt).slice(0, 10) : '';
      when = iso && day ? String(day(iso) || '') : '';
    } catch (e) { when = ''; }
    const who = clientName();
    const under = [who, when].filter(Boolean).join(' · ');
    return '<div class="gfin-ref">' +
      '<span class="g2Eyebrow">Reference</span>' +
      `<span class="gfin-refmark">${letterRef}</span>` +
      (under ? `<span class="gfin-refwho">${E(under)}</span>` : '') +
      '</div>';
  }

  function keepsakeLine(ctx, kind) {
    if (kind !== 'stage' || !P('keepPicture')) return '';
    return '<div class="gfin-keepsake">' + ctx.quiet('Keep a picture of it', {
      act: () => {
        const send = P('keepPicture');
        const went = send ? send() : false;
        if (!went) {
          say('That picture isn\u2019t ready yet \u2014 try again in a moment. Nothing about your letter has changed.');
          return;
        }
        const sc = document.getElementById('guidedScroll');
        if (sc) sc.scrollTop = 0;
        say('A picture of your commission. Keep it, copy it, or close it.');
      },
    }) + '</div>';
  }

  const letter = {
    id: 'letter',
    title: 'The letter',
    get question() { return letterHeading() || 'Your commission is with Paul'; },
    get stage() { return portraitKind() === 'stage'; },
    money: false,
    ways: false,
    compose: 'spread',
    render(body, ctx) {
      houseLine(body);
      dropRail(body);
      const st = state();
      const cl = st.cloth || null;
      const kind = portraitKind();
      const content = letterContent(ctx);
      const G = eng();
      const spare = (G && Array.isArray(G.looks) ? G.looks : [])
        .filter((l) => !(scratch().placed || {})[l.id]).length;
      const measured = !!(G && G.state && G.state.identified);

      body.innerHTML =
        (portraitKind() === 'stage' ? portraitHTML(ctx, 'stage')
          : cardFor() ? portraitHTML(ctx, 'card') : '') +
        clothUnit(ctx, cl, kind, { pair: false }) +
        '<div class="gfin-words">' +
          keepsakeHTML() +
          '<div data-gfin-slot="letter"></div>' +
          (spare ? `<div class="gfin-fine">${E(`Your rack still holds ${spare === 1 ? 'one look' :
            spare + ' looks'}. Paul takes one commission at a time \u2014 a new one starts from our ` +
            `own choices, and we\u2019ll ask about the finishing again.`)}</div>` : '') +
          keepsakeLine(ctx, kind) +
          ctx.doors([
            { label: 'Add the next garment',
              fact: (measured ? 'your measurements stay' : 'your answers stay') +
                ' \u2014 the next suit starts from our own choices',
              act: () => addNext(ctx) },
            spare ? { label: 'Begin another commission', fact: 'starting from our own choices',
              act: () => beginAnother(ctx) } : null,
            { label: 'Read this letter in the workshop', fact: 'everything you have settled',
              act: () => { const G2 = eng(); if (G2 && G2.exit) G2.exit(); } },
          ].filter(Boolean)) +
        '</div>';

      wire(body, {
        closeup: (el) => openRoom(el),
        lining: () => openLining(ctx),
      });
      armCloth(body);

      const slot = body.querySelector('[data-gfin-slot=letter]');
      if (slot && content) slot.appendChild(content);
    },
    commit() { return 'letter'; },       
  };

  function beginAnother(ctx) {
    const start = P('commissionAnother');
    if (start) { try { start(); } catch (e) {   } }
    ctx.goto('commit');
  }

  function addNext(ctx) {
    let held = null;
    try {
      held = { season: S.season, seasonTouched: !!S.seasonTouched,
               occasion: S.occasion, occasionTouched: !!S.occasionTouched };
    } catch (e) {   }
    const start = P('commissionAnother');
    if (start) { try { start(); } catch (e) {   } }
    if (held) {
      const seas = P('setSeason'), occ = P('setOccasion');
      try { if (held.seasonTouched && seas) seas(held.season); } catch (e) {   }
      try { if (held.occasionTouched && occ) occ(held.occasion); } catch (e) {   }
    }
    ctx.goto('build');
  }

  function houseLine(body) {
    const frame = body && body.parentElement;
    const h = frame && frame.querySelector('.gQ');
    if (h) h.classList.add('g2HouseLine');
  }

  function dropRail(body) {
    const frame = body && body.parentElement;
    const rail = frame && frame.querySelector('.g2Settled');
    if (rail) rail.remove();
  }

  let whoTyped = '';                  
  const identify = {
    id: 'identify',
    title: 'Your book',
    question: 'Welcome back.',
    money: false,
    act: { label: 'Open your book' },
    render(body) {
      body.innerHTML =
        '<div class="gfin-fit gfin-identify">' +
        `<div class="gfin-demo">${E('This is a demonstration sign-in. Any email or phone number opens the ' +
          'demonstration client\u2019s book. Nothing you type is stored, and nothing is sent.')}</div>` +
        `<p class="gfin-fitsaid">${E('Paul already has your measurements \u2014 you can order without ' +
          'another fitting. Tell us who you are, and your book opens at your record.')}</p>` +
        '<div class="gfin-contact"><span class="gfin-contactsaid">' +
        fieldHTML('gidWho', 'Email or phone', {
          autocomplete: 'off', inputmode: 'email', size: 24, value: whoTyped, key: '',
        }) +
        '</span></div>' +
        `<p class="gfin-said" id="gidSaid" role="status">${E(identify._problem || '')}</p>` +
        '</div>';
      const f = body.querySelector('#gidWho');
      if (f) {
        if (identify._problem) { f.setAttribute('aria-invalid', 'true'); f.setAttribute('aria-describedby', 'gidSaid'); }
        f.addEventListener('input', () => { whoTyped = f.value; f.removeAttribute('aria-invalid'); });
        f.addEventListener('keydown', (ev) => {
          if (ev.key !== 'Enter') return;
          ev.preventDefault();
          const go = document.querySelector('#guidedLayer .gAct .gActBtn');
          if (go) go.click();
        });
        if (identify._problem) requestAnimationFrame(() => f.focus({ preventScroll: true }));
      }
      identify._problem = '';
    },
    commit() {
      const typed = String(whoTyped || '').trim();
      const mail = P('emailRe');
      const isMail = !!mail && mail.test(typed);
      const isPhone = /^[+()\d][\d\s().-]{6,}$/.test(typed);
      if (!isMail && !isPhone) {
        say('Enter your email address or your phone number \u2014 that\u2019s how Paul finds you.');
        identify._problem = 'Enter your email address or your phone number \u2014 that\u2019s how Paul finds you.';
        return 'identify';
      }
      const st = state();
      if (st.contact) { if (isMail) st.contact.email = typed; else st.contact.phone = typed; }
      if (st.threshold !== 'client') { st.threshold = 'client'; const pt = P('paint'); if (pt) pt(); }
      const G = eng();
      if (G && G.state) G.state.identified = true;
      say('The book is open — the demonstration record stands in for yours.');
      return 'build';    
    },
  };

  let visitAsked = null;              
  let visitTyped = { city: '', email: '' };
  const visit = {
    id: 'visit',
    title: 'The measuring visit',
    question: 'Paul travels to you.',
    money: false,
    render(body, ctx) {
      const slots = sampleSlots();
      visit._slots = slots;
      const held = visit._slot || null;
      visit.act.label = visitAsked ? 'Browse the collection' : 'Ask for this visit';
      if (visitAsked) {
        body.innerHTML =
          '<div class="gfin-fit gfin-visit">' +
          `<div class="gfin-demo">${E('A demonstration calendar \u2014 what you asked for is written down for ' +
            'this sitting, and nothing is sent. Paul confirms every visit personally.')}</div>` +
          `<p class="gfin-fitsaid">${E(`Written down: ${visitAsked.city}${visitAsked.when ? ', ' +
            visitAsked.when : ''}.`)}</p>` +
          ctx.doors([{ label: 'Browse the collection while you wait', goto: 'build' }]) +
          '</div>';
        return;
      }
      body.innerHTML =
        '<div class="gfin-fit gfin-visit">' +
        `<p class="gfin-fitsaid">${E('Paul comes to your home or your office, takes your measurements, ' +
          'and helps you choose the cloth and see the fit. Nothing is cut until he has measured you.')}</p>` +
        '<div class="gfin-contact"><span class="gfin-contactsaid">' +
        fieldHTML('gvCity', 'Your city', {
          autocomplete: 'address-level2', size: 14, value: visitTyped.city, key: '',
        }) +
        fieldHTML('gvEmail', 'Email', {
          type: 'email', autocomplete: 'email', inputmode: 'email', size: 18,
          value: visitTyped.email, key: '',
        }) +
        '</span></div>' +
        `<p class="gfin-said" id="gvSaid" role="status">${E(visit._problem || '')}</p>` +
        `<div class="gfin-demo">${E('A demonstration calendar — sample dates. ' +
          'Paul confirms every visit personally.')}</div>` +
        '<div class="gfin-slots">' +
        slots.map((s) => ctx.row({
          name: slotDate(s),
          fact: slotWhen(s),
          selected: !!held && held === s.key,
          word: 'Chosen',
          act: () => { visit._slot = s.key; visit.render(body, ctx); },
        })).join('') +
        '</div>' +
        ctx.doors([{ label: 'Browse the collection first', fact: 'Paul measures before anything is cut', goto: 'build' }]) +
        '</div>';
      for (const [id, key] of [['gvCity', 'city'], ['gvEmail', 'email']]) {
        const f = body.querySelector('#' + id);
        if (f) f.addEventListener('input', () => {
          visitTyped[key] = f.value;
          const held = document.querySelector('.gFoot .gfin-hold[data-visit]');
          if (held) held.remove();        
        });
        if (f) f.addEventListener('keydown', (ev) => {
          if (ev.key !== 'Enter') return;
          ev.preventDefault();
          const go = document.querySelector('#guidedLayer .gAct .gActBtn');
          if (go) go.click();
        });
      }
      if (visit._problem) {
        const back = body.querySelector(visit._problemAt === 'city' ? '#gvCity' : '#gvEmail');
        if (back) { back.setAttribute('aria-invalid', 'true'); back.setAttribute('aria-describedby', 'gvSaid'); }
        if (back) requestAnimationFrame(() => {
          back.scrollIntoView({ block: 'center' });
          back.focus({ preventScroll: true });
        });
        const foot = document.querySelector('#guidedLayer .gFoot') || document.getElementById('guidedFoot');
        if (foot) {
          const said = visit._problem;
          let row = foot.querySelector('.gfin-hold[data-visit]');
          if (!row) {
            row = document.createElement('button');
            row.type = 'button'; row.className = 'gfin-hold'; row.dataset.visit = '1';
            foot.insertBefore(row, foot.querySelector('.gAct') || foot.firstChild);
          }
          if (row.dataset.said !== said) {
            row.dataset.said = said;
            row.textContent = said + ' Take me to it →';
            const at = visit._problemAt;
            row.onclick = () => {
              const f = document.querySelector(at === 'city' ? '#gvCity' : '#gvEmail');
              if (f) { f.scrollIntoView({ block: 'center' }); f.focus({ preventScroll: true }); }
            };
          }
        }
      } else {
        const held = document.querySelector('.gFoot .gfin-hold[data-visit]');
        if (held) held.remove();
      }
      visit._problem = '';
    },
    act: { label: 'Ask for this visit' },
    commit() {
      if (visitAsked) return 'build';
      const city = String(visitTyped.city || '').trim();
      const email = String(visitTyped.email || '').trim();
      const mail = P('emailRe');
      if (!city || !mail || !mail.test(email)) {
        visit._problem = !city ? 'Which city shall Paul come to?'
          : 'That doesn\u2019t look like a full email address \u2014 Paul needs one he can write back to.';
        say(visit._problem);    
        visit._problemAt = !city ? 'city' : 'email';
        return 'visit';
      }
      const push = P('pushAsk');
      const s = (visit._slots || []).find((x) => x.key === visit._slot);
      const when = s ? slotDate(s) : '';
      if (push) push({ kind: 'measure', city, email, when: when || null });
      const st = state();
      if (st.threshold !== 'visitor') { st.threshold = 'visitor'; const pt = P('paint'); if (pt) pt(); }
      visitAsked = { city, when };
      visit.act.label = 'Browse the collection';
      say(`Written down: ${city}. Paul confirms every visit personally.`);
      return 'visit';
    },
  };

  const STEPS = [identify, visit, commit, fitting, letter];
  function registerAll() {
    const G = window.G;
    if (!G || typeof G.register !== 'function') return false;
    if (registerAll.done) return true;
    registerAll.done = true;
    floor();
    for (const s of STEPS) G.register(s);
    return true;
  }
  window.PT_GUIDED_FINISH = {
    steps: STEPS, PAIR, shirtOffer, letterContent, sampleSlots, portraitKind, rememberScroll,
    openFinishing,                     
  };

  const GEOMETRY = `
/* ── GUIDED-3 · WP4, 28 August 2026 · THE COMMISSION'S PORTRAIT IS A PORTRAIT ──
   DATED AMENDMENT to §9.8's 390×386 hole, which stood here as min(46svh,386px).
   Measured on the shipped build, at 390×844 and at 1280×720, with the same probe
   G11 uses (the painted garment's share of its own stage):

     390×844   hole 390×386   the garment painted  16.6% of its stage
     1280×720  hole 663×496   the garment painted  12.8% of its stage, 188 wide

   The garment moment next door measures 43.3% and 50.8% after R-G3-6. The record
   was drawing the same standing figure into a LANDSCAPE box, which is M3's
   finding exactly, one screen further on: the viewer fits its subject to the
   shorter axis, so a short wide hole spends its width on ground. The share is
   very nearly linear in the hole's height, and the height is the only thing that
   was cheap here — so the hole goes to min(56svh, 470px). At 390×844 that is 470
   (0.83:1, a portrait), the question still lands inside the reading area at rest
   (measured after: y=551 of 776, where §9.8's own note budgeted 499 of 775), and
   the plate and the record follow it exactly as before.
   ABOVE THE RUNG it takes the garment moment's own cap as well — a portrait no
   wider than 420, centred — so between 600 and 1023 the two screens are the same
   picture in the same shape, which is what "one atelier" has to mean on the two
   screens a client sees back to back. */
body.guided.gsee-stage #guidedLayer .gfin-portrait .gsee-window{
  display:block; height:min(56svh, 470px);
}
/* the house's sentence about the picture, and R-G3-3's quiet line, beneath the
   hole. THE LAYER PAINTS NOTHING while the stage is up and takes no pointer, so
   this band asks for both back — it is the only part of the bay that is words,
   and without the pointer "Turn it again" would be a control the client cannot
   press (measured: the press landed on the transparent pane). */
body.guided.gsee-stage #guidedLayer .gfin-portraitsaid{
  position:relative; z-index:1; pointer-events:auto;
  display:block;
  background:var(--color-surface-page);
  /* the BAY is what bleeds to the screen edge (§3.2's one exemption); this band
     is inside it, so it takes the margin back with padding alone — measured, the
     pair of negative margins put the caption's first character at x=0. */
  padding:var(--space-300) var(--layout-margin-compact) 0;
}
@media (min-width:600px){
  body.guided.gsee-stage #guidedLayer .gfin-portrait .gsee-window{
    width:min(100%, 420px); margin-inline:auto;
  }
  body.guided.gsee-stage #guidedLayer .gfin-portraitsaid{ padding-inline:0; }
}
/* M6 · THE CLOTH PLATE IS A DOOR, and the door is the photograph. guided.css's
   own .g2Door rules are unlayered — a grid at ≤599 and a flex row at ≥600 —
   and they are written for a LABEL · FACT · ARROW row, so they are undone here
   for the one door in this file whose whole face is a picture. Same three
   declarations, same reasoning and the same width arithmetic as the garment
   moment's own plate door (guided-see.js), so the two doors are one door in two
   places rather than two dialects of one. */
/* QUALIFIED WITH body.guided, and measured rather than assumed: guided.css's own
   .g2Door rules are unlayered at (1,2,0) and are written into the document AFTER
   this stylesheet, so an equally specific rule here loses the tie on order — the
   plate arrived 175px wide inside a min-content grid track. body.guided takes it
   to (1,3,1) and the door is a photograph again. It is the same move, for the
   same reason, that guided-see.js's own plate door makes. */
body.guided #guidedLayer .gfin-clothdoor{
  display:block; width:100%; text-align:left;
  padding:0; border:0; background:none;
}
body.guided #guidedLayer .gfin-clothdoor > .g2Plate{
  display:block; margin:0; width:100%; max-width:100%;
}
body.guided #guidedLayer .gfin-cident{
  display:flex; align-items:baseline; justify-content:space-between;
  gap:var(--space-300); padding-top:var(--space-300);
}
/* the picture holds its place while the document is read past it — the same two
   pins the garment moment uses, for the same reason. */
/* THE STACK, AND THE ONE NUMBER IN IT THAT IS NOT ARBITRARY. The picture sits
   UNDER the document that rises over it, and both sit under a SHEET, which
   guided.css puts at z-index 1. So the bands take 1 and the bay takes 0 — a
   sheet is appended after them and wins the tie by DOM order, which is what
   "an offer opens over the walk" has to mean. Measured before this: the record
   printed straight through the shirt sheet. */
body.guided.gsee-stage #guidedLayer .gfin-bay{
  position:sticky; top:var(--gsee-qh,0px); z-index:0;
  margin-inline:calc(var(--layout-margin-compact) * -1);   /* §3.2's one exemption */
}
/* THE DOCUMENT RISES OVER THE PICTURE, AND IT IS OPAQUE WHILE IT DOES.
   While a step holds the stage the layer stops painting, so that the garment
   behind it is the page — which means every band of this screen that is NOT the
   picture has to carry the paper itself, EDGE TO EDGE. Measured before this
   block: the walk's own 24px side margins were two vertical slots of live 3D
   viewer running down a screen of prose. So the three word bands take the
   paper, bleed to the viewport edge at the compact rung and put their padding
   back — and the plate's band above and below becomes the neighbours' padding
   rather than a transparent margin between them. */
body.guided.gsee-stage #guidedLayer .gfin-words,
body.guided.gsee-stage #guidedLayer .gfin-head,
body.guided.gsee-stage #guidedLayer .gfin-plateWrap{
  position:relative; z-index:1; pointer-events:auto;
  background:var(--color-surface-page);
  margin-inline:calc(var(--layout-margin-compact) * -1);
  padding-inline:var(--layout-margin-compact);
}
body.guided.gsee-stage #guidedLayer .gfin-plateWrap > .g2Plate{ margin-block:0; }
/* THE STEP'S OWN QUESTION, in the words bay (the engine's documented SPREAD
   construction). It takes .gQ's type — the ladder is the layer's and there is
   only one — but not .gQ's bottom margin, which is written for a heading
   standing alone above a body. Here it is the first line of a flex column whose
   own gap already sets the rhythm, and the margin was 32px of it said twice.
   Unlayered, and beside the geometry it corrects, because the page's own
   asterisk margin reset is unlayered too and a layered margin never applies. */
#guidedLayer .gfin-head > .gfin-q{ margin-block:0; }
/* AND THE BAND UNDER THE CLOTH IS ONE BAND. .gfin-plateWrap carries §3.2(3)'s
   24px surround top and bottom; the caption inside it was carrying a second 32
   below, so the cloth stood 56px clear of the record and 24 clear of itself.
   The caption's own bottom is the wrap's. */
body.guided.gsee-stage #guidedLayer .gfin-plateWrap > .gfin-plateCap{
  padding-bottom:0;
}
/* AND THE DOOR RAIL DOES NOT PAY THE RHYTHM TWICE. The construction carries its
   own 32px margin-top for a rail dropped into prose; the words bay is a flex
   column whose gap is already 32, and the two stacked to 64 above the one group
   of doors on the screen. The column's gap governs inside the column. */
#guidedLayer .gfin-words > .g2Doors{ margin-top:0; }
body.guided.gsee-stage #guidedLayer .gfin-head{
  padding-bottom:var(--layout-surround-band-cloth);
}
body.guided.gsee-stage #guidedLayer .gfin-plateWrap{
  padding-block:var(--layout-surround-band-cloth);
}
/* A SHEET IS A SURFACE OVER THE WALK, AND OVER ITS CHROME TOO. While the stage
   is up the settled line is lifted and pinned (guided-see.js) so the house's own
   words hold their place over the picture — and at z-index 3 that put them over
   an open sheet as well: measured, the shirt sheet's heading arrived underneath
   them. The has-sheet class is the engine's own state, so the line drops under a
   sheet for exactly as long as one is open, and nothing else changes. */
body.guided.gsee-stage #guidedLayer.has-sheet .g2Settled{ z-index:0; }
@media (min-width:600px){
  /* above the rung the column is the hole, so nothing bleeds and nothing needs
     to cover a gutter that has no picture in it. */
  body.guided.gsee-stage #guidedLayer .gfin-bay,
  body.guided.gsee-stage #guidedLayer .gfin-words,
  body.guided.gsee-stage #guidedLayer .gfin-head,
  body.guided.gsee-stage #guidedLayer .gfin-plateWrap{
    margin-inline:0; padding-inline:0;
  }
}
@media (min-width:1024px){
  /* ── GUIDED-3 · WP4 (M3's successor on the money screen), 28 August 2026 ────
     THE SPREAD BECOMES THE PORTRAIT PAIR.  DATED AMENDMENT to §9.8's "662 · 473"
     and to the note that stood here.
     What was measured at 1280×720 before this: the plate bay 663 wide, the
     portrait hole 663×496 — a 1.34:1 LANDSCAPE LETTERBOX around a standing
     figure — the garment painted 188×479 inside it, 12.8% of its own stage, and
     the cloth plate CENTRED beneath it at x=139 on a screen whose other edges
     are 48 and 759. Three left edges on the screen that takes money, and the
     suit the client is buying at a twelfth of the picture it is standing in.
     WP2 left this bay landscape deliberately and said why: narrowing the hole on
     its own would have put two centred objects of two widths on two left edges.
     That is a composition problem and it is answered by composing, not by
     narrowing a hole — the bay stops being ONE box and becomes the same PORTRAIT
     PAIR the garment moment now stands in: the suit whole, and the cloth up
     close, side by side, on one left edge each, with the reading beside them.
     One walk, one composition, and the cross-settle carries the SAME cloth plate
     from this screen to the arrival without it moving a pixel.

     THE ARITHMETIC, on the 1184 content box, and it is the garment moment's own:
       400  the stage, portrait          + 48 gutter
       344  the mill's photograph — the detail tier's measured MINIMUM width, so
            no file in the book is ever drawn above its own pixels
                                         + 48 gutter
       344  the reading — the same measure the column holds at 390
       ————
      1184
     AND IT DEGRADES, WHICH THE GARMENT MOMENT'S FIXED TRACKS DO NOT. Measured on
     the shipped garment moment at 1024: 400px 344px 88px — an 88px reading
     column. That is survivable where the words are two tone rows and it is not
     survivable here, where this column carries the record, the colour question,
     two typed fields and the act. So the two plate tracks are minmax(0, …) and
     the reading is minmax(344px, 1fr): the reading keeps its measure first and
     the two pictures give up their width together — 400·344·344 at 1280 and
     above, 244·244·344 at 1024. Nothing collapses and no column is ever alone.
     (The garment moment's own 88px at 1024 is guided-see.js's and is recorded
     for its owner rather than reached into from here.) */
  #guidedLayer .gStep > .gSlot:has(> .gfin-words){
    display:grid;
    grid-template-columns:minmax(0,400px) minmax(0,344px) minmax(344px,1fr);
    /* the second row takes whatever the reading leaves, which is what gives the
       two plate columns an area TALLER than themselves — and therefore something
       to be sticky in. A grid item can only travel inside its own area. */
    grid-template-rows:auto 1fr;
    column-gap:var(--space-1200);
  }
  /* both plates span the whole grid and both are ranged to its top, so both can
     travel while the document beside them is read. */
  #guidedLayer .gSlot:has(> .gfin-words) > .gfin-bay{
    grid-column:1; grid-row:1 / -1; align-self:start;
  }
  /* body.guided is carried on this one selector and not for weight's sake: the
     band's own rule (above, while the stage is up) sets position relative, and
     without matching its specificity the plates would not stick at all —
     measured, they scrolled away at 1280 while the record was being read. */
  body.guided #guidedLayer .gSlot:has(> .gfin-words) > .gfin-plateWrap{
    grid-column:2; grid-row:1 / -1; align-self:start;
    position:sticky; top:0;          /* the commission's cloth stays while he reads */
  }
  /* …and the head no longer hangs from the FOOT of its row. It was ranged to the
     bottom so the commission and its figure sat level with the bottom of a
     picture that stood in the same column-pair; with the pair beside it the head
     is simply the first line of the reading, ranged from the same top edge as
     the two photographs. The air the old rule was managing does not exist. */
  #guidedLayer .gSlot:has(> .gfin-words) > .gfin-head{ grid-column:3; grid-row:1; }
  #guidedLayer .gSlot:has(> .gfin-words) > .gfin-words{ grid-column:3; grid-row:2; }
  /* the portrait's own height in the pair. The garment moment takes min(70svh,
     620px) here and this bay cannot: it carries the picture's CAPTION as well,
     and the bay is PINNED, so anything past the reading area's foot is not
     "below the fold", it is unreachable — measured at 1280×720, the standing
     sentence ("the house's own form, in your cloth") sat 71px under the foot and
     no amount of scrolling brought it back, which is M20's own failure. 58svh
     leaves the caption inside the reading area at 720, at 900 and at 1080, and
     the garment still measures 37–47% of its stage against G11's 30% floor. */
  body.guided.gsee-stage #guidedLayer .gfin-portrait .gsee-window{
    width:auto; height:min(58svh, 560px);
  }
  /* ── AND THE ARRIVAL STANDS IN THE SAME PAIR ───────────────────────────────
     A THIRD REASON THIS BLOCK IS UNLAYERED, in the register of the two above it.
     guided.css §9.9 composes the letter at [data-step=letter] — one bay, its
     items centred, min(76svh,640px) tall, the cloth beneath it and the letter
     beside — and an attribute selector outweighs the slot rules above, so those
     rules are the ones that decide the arrival. That composition was written for
     a CARD portrait and it is right for one; R-G3-9 has made the arrival's
     portrait the live stage, and two things then broke, both measured at 1280:
       · the hole came out 0×504. The bay centres its items and an empty div
         (the window paints nothing — that is what it is FOR) shrink-to-fits to
         zero, so the viewer was handed a one-pixel pane.
       · the cloth plate sat in column ONE on the arrival and column TWO on the
         record — which would have the plate JUMPING SIDEWAYS at the exact moment
         direction §6.4 asks it to stand still. The cross-settle is this file's to
         honour and it is not honoured by a plate that moves.
     So the arrival is placed here, in the same three columns as the record, at
     the specificity guided.css's own block is written at. The CARD path keeps
     guided.css's bay entire — only the stage case takes the block back — so
     nothing is taken away from the composition it was written for.
     HANDOFF: when guided.css's owner next opens §9.9, these four rules belong
     there and this block should shrink by them. */
  /* the :has() is not decoration: guided.css's own plate rule is written at
     exactly this weight, body.guided and all (it says so, and for the same
     reason we do), so an equal rule here would lose the tie on document order —
     measured, the plate stayed in column one and stood underneath the portrait.
     The slot's own condition takes it one step past, where the rest of this
     block already lives. */
  body.guided #guidedLayer .gStep[data-step="letter"] > .gSlot:has(> .gfin-words) > .gfin-bay{
    grid-column:1; grid-row:1 / -1;
  }
  body.guided #guidedLayer .gStep[data-step="letter"] > .gSlot:has(> .gfin-words) > .gfin-plateWrap{
    grid-column:2; grid-row:1 / -1;
  }
  body.guided #guidedLayer .gStep[data-step="letter"] > .gSlot:has(> .gfin-words) > .gfin-words{
    grid-column:3; grid-row:1 / -1;
  }
  /* justify-items is put back to normal WITH the display, and the reason is a
     browser behaviour worth writing down: Chromium now honours box alignment in
     BLOCK layout, so guided.css's justify-items:center on this bay (right, for
     a card) went on centring after the bay stopped being a grid — and an empty
     div (the window paints nothing) shrank to fit at width 0 with 200px of auto
     margin each side. Measured: a 1×612 canvas. */
  body.guided.gsee-stage #guidedLayer .gStep[data-step="letter"] > .gSlot:has(> .gfin-words) > .gfin-bay{
    display:block; height:auto; align-self:start; justify-items:normal;
  }
  /* AND THE SETTLED LINE STOPS FLOATING, on these screens and above this rung
     only. While the stage is up guided-see.js pins it over the picture, which is
     right on one column — the house's own words hold their place while the card
     rises past them. In a SPREAD the picture is beside the reading, not under
     it, so a pinned band at the head of the frame lands on top of the plate bay:
     measured at 1280, a 436×129 slab of paper across the cloth. Here it is a
     line at the head of the page, as it is on every screen without a stage. */
  body.guided.gsee-stage #guidedLayer:has(.gfin-words) .g2Settled{
    position:static; z-index:auto; padding-block:0 var(--space-300);
  }
  body.guided.gsee-stage #guidedLayer:has(.gfin-words) .gfin-bay{ top:0; }
}`;

  const FLOOR = `
@layer gfin-fallback {
  #guidedLayer .gfin-words{
    display:flex; flex-direction:column; gap:var(--space-800);
    min-width:0; pointer-events:auto;
  }
  /* the browser may not re-aim the scroll at this document while its own
     pictures are still resolving: the record returns from the fitting at the
     offset it left, and scroll anchoring was moving it. */
  #guidedLayer .gfin-words,
  #guidedLayer .gfin-head,
  #guidedLayer .gfin-bay,
  #guidedLayer .gfin-plateWrap{ overflow-anchor:none; }
  #guidedLayer .gfin-words button,
  #guidedLayer .gfin-sheet button,
  #guidedLayer .gfin-words input,
  #guidedLayer .gfin-sheet input{ font-family:var(--font-family-sans-stack); }

  /* ── the picture, and the cloth beneath it ─────────────────────────────── */
  #guidedLayer .gfin-bay{ display:block; }
  /* the band around a plate that stands in prose (§3.2's third guarantee), on
     the one bay that is a photograph rather than a hole. */
  #guidedLayer .gfin-portrait--card{
    display:flex; flex-direction:column; gap:var(--space-300);
    padding-block:var(--layout-surround-band-cloth); }
  #guidedLayer .gfin-absent{
    display:block; padding:var(--layout-surround-band-cloth);
    background:var(--color-surface-fabric-surround-book);
    color:var(--color-ink-primary);
    font-size:var(--type-size-200); line-height:var(--type-line-height-200); }
  /* the cloth plate's declared box, at the detail tier's own measured median.
     The photograph is FITTED into it — a wider file is fitted down, a narrower
     one prints at its own width and the GROUND takes the difference — so the box
     can be declared, which reserves its space and stops the screen shifting when
     the photograph decodes. */
  #guidedLayer .gfin-cloth{ --g2-plate-w:342px; --g2-plate-h:299px; }
  #guidedLayer .gfin-cloth--square{ --g2-plate-w:320px; --g2-plate-h:320px; }
  #guidedLayer .gfin-plateWrap{ display:block; min-width:0; }
  #guidedLayer .gfin-plateCap{
    display:flex; flex-direction:column; gap:var(--space-300);
    padding:var(--space-300) 0 var(--space-800); min-width:0; }

  /* ── the words ─────────────────────────────────────────────────────────── */
  #guidedLayer .gfin-head{
    display:flex; flex-direction:column; align-items:flex-start;
    gap:var(--space-300); padding:var(--space-800) 0; min-width:0; }
  #guidedLayer .gfin-said{ max-width:var(--layout-measure-prose); }
  #guidedLayer .gfin-figure{ display:flex; flex-wrap:wrap; align-items:baseline;
    gap:0 var(--space-200); }
  /* GUIDED-4 (29 Aug 2026) — spec §2.4's PRICE TOTAL, said once for the letter
     as guided.css says it once for the plinth: 28 / 600 / −0.02em / 35. It was
     28 at regular weight with no tracking, which is a size on the ladder set to
     no role on it, and it disagreed with the plinth's own figure two screens
     earlier. One figure construction, one spec, both places. */
  #guidedLayer .gfin-fig{
    font-size:var(--type-size-500); line-height:var(--type-line-height-500);
    letter-spacing:var(--type-tracking-tight);
    font-weight:var(--type-weight-semibold);
    font-variant-numeric:var(--type-figures-default);
    color:var(--color-ink-primary); }
  #guidedLayer .gfin-covers{
    font-size:var(--type-size-200); line-height:var(--type-line-height-200);
    color:var(--color-ink-secondary); }
  #guidedLayer .gfin-basis, #guidedLayer .gfin-figure--none{
    flex-basis:100%;
    font-size:var(--type-size-100); line-height:var(--type-line-height-100);
    color:var(--color-ink-tertiary); }
  #guidedLayer .gfin-fine, #guidedLayer .gfin-lede{
    display:block; max-width:var(--layout-measure-prose);
    font-size:var(--type-size-100); line-height:var(--type-line-height-100);
    color:var(--color-ink-tertiary); }
  #guidedLayer .gfin-lede{ font-size:var(--type-size-200);
    line-height:var(--type-line-height-200); color:var(--color-ink-secondary); }
  #guidedLayer .gfin-fine:empty{ display:none; }
  #guidedLayer .gfin-ahead{ display:block; max-width:var(--layout-measure-prose);
    font-size:var(--type-size-200); line-height:var(--type-line-height-200);
    color:var(--color-ink-primary); }
  #guidedLayer .gfin-ahead:empty{ display:none; }
  #guidedLayer .gfin-note{
    display:block; max-width:var(--layout-measure-prose);
    padding-left:var(--space-300);
    border-left:var(--border-width-emphasis) solid var(--color-line-strong);
    font-size:var(--type-size-200); line-height:var(--type-line-height-200);
    color:var(--color-ink-primary); }
  /* GUIDED-4 (30 Aug 2026, judge round 2 · clarity blocker 2) · display:block
     above would defeat the UA's [hidden] rule, and plinthKept() stands the
     in-body kept note down with exactly that attribute while the plinth
     carries the one printing of the sentence. Said, not assumed. */
  #guidedLayer .gfin-note[hidden]{ display:none; }
  #guidedLayer .gfin-nil{ color:var(--color-ink-secondary); }
  /* GUIDED-3 · M9 · the keepsake's own line. It is a quiet line and it is
     dressed as one — the engine's own quiet-line class carries the type; this gives
     it the air the letter's blocks give each other, so it reads as an offer at
     the foot of a finished letter and not as a second act on it. */
  #guidedLayer .gfin-keepsake{ display:block; padding-top:var(--space-600); }

  /* ── the record ────────────────────────────────────────────────────────── */
  #guidedLayer .gfin-record{ display:flex; flex-direction:column; gap:var(--space-300);
    max-width:var(--layout-measure-prose); }
  #guidedLayer .gfin-recline{ display:block;
    font-size:var(--type-size-300); line-height:var(--type-line-height-300);
    font-variant-numeric:var(--type-figures-default);
    color:var(--color-ink-primary); }
  /* 28 Aug 2026 (GUIDED-3 WP6) · THE RECORD'S FINE LINE IS SECONDARY INK, NOT
     TERTIARY. §10.32's record clause holds every run of the record to 7:1, and
     the construction this block succeeded held it: the threshold's .rprov and
     .rprivacy were --color-ink-secondary by rule (modern.html:1515/1517).
     When the record moved here (flow §4.5c) its provenance and disclosure fell
     into the generic .gfin-fine — tertiary, MEASURED 5.26:1 on the commit
     screen against the paper — a regression the clause could not see while it
     was disarmed. Secondary measures 7.77:1. One scoped rule; the generic
     .gfin-fine elsewhere is not the record and is untouched. */
  #guidedLayer .gfin-record .gfin-fine{ color:var(--color-ink-secondary); }

  /* ── the saved-looks rail ──────────────────────────────────────────────── */
  #guidedLayer .gfin-railwrap{ display:flex; flex-direction:column; gap:var(--space-300); }
  #guidedLayer .gfin-look{ width:160px; }
  #guidedLayer .gfin-lookfig{ padding-top:var(--space-200);
    font-size:var(--type-size-200); line-height:var(--type-line-height-200);
    font-variant-numeric:var(--type-figures-default); }

  /* ── the shirts door's own photograph ──────────────────────────────────── */
  #guidedLayer .gfin-shirtsdoor{ gap:var(--space-400); }
  #guidedLayer .gfin-doorshot{ flex:none; width:112px; height:112px; }
  #guidedLayer .gfin-shirtsdoor .g2DoorFact{ text-align:right; }

  /* ── the colour question, in the page's own markup ─────────────────────── */
  #guidedLayer .gfin-colour .colourblock{ display:flex; flex-direction:column;
    gap:var(--space-300); }
  /* GUIDED-4 (29 Aug 2026) — DATED AMENDMENT, spec §2.4/§2.6 (this line is in
     the memo's site list). The colour question's heading is a READING TITLE and
     takes that role whole in the all-sans ladder: 28/600/−0.02em. The client's
     direction of this date: "go all-sans, Apple-like". */
  #guidedLayer .gfin-colour .ctitle{
    font-family:var(--font-family-sans-stack);
    font-size:var(--type-size-500); line-height:var(--type-line-height-500);
    letter-spacing:var(--type-tracking-tight);
    font-weight:var(--type-weight-semibold); color:var(--color-ink-primary); }
  #guidedLayer .gfin-colour .foot, #guidedLayer .gfin-act .foot,
  #guidedLayer .gfin-act .commit{
    max-width:var(--layout-measure-prose);
    font-size:var(--type-size-100); line-height:var(--type-line-height-100);
    color:var(--color-ink-secondary); }
  #guidedLayer .gfin-act .commit .humanlink{ color:var(--color-ink-primary); }
  #guidedLayer .gfin-colour .standing{
    display:block; max-width:var(--layout-measure-prose);
    font-size:var(--type-size-200); line-height:var(--type-line-height-200);
    color:var(--color-ink-primary); }
  #guidedLayer .gfin-colour .standing:empty{ display:none; }

  /* ── the contact, as a sentence ────────────────────────────────────────── */
  #guidedLayer .gfin-contact{ display:flex; flex-direction:column; gap:var(--space-300); }
  /* the carrier sentence's line box has to hold a NAMED box — its label above
     its field — without the next line landing on top of it. The house's own
     sentence still runs through them; the two boxes simply carry their words. */
  #guidedLayer .gfin-contactsaid{
    display:block; max-width:var(--layout-measure-prose);
    font-size:var(--type-size-300);
    line-height:var(--type-line-height-300);
    color:var(--color-ink-primary); }
  @media (min-width:600px){
    #guidedLayer .gfin-contactsaid{
      line-height:calc(var(--control-input-height) + var(--type-line-height-100)
                       + var(--space-100)); }
  }
  #guidedLayer .gfin-named{ display:block; min-width:0; padding-top:var(--space-300); }
  #guidedLayer .gfin-fieldlabel{
    display:block; padding-top:var(--space-100);
    font-size:var(--type-size-100); line-height:var(--type-line-height-100);
    color:var(--color-ink-tertiary); }
  /* V13 · the writing line. No fill, no box, no radius — one rule under the
     field, the ink on it. The 48px target is the height, unchanged. */
  #guidedLayer .gfin-field{
    display:block; width:100%;
    height:var(--control-input-height);
    padding:0; background:none;
    border:0;
    border-bottom:var(--border-width-hairline) solid var(--color-line-strong);
    border-radius:var(--radius-none);
    color:var(--color-ink-primary);
    font-size:var(--type-size-300); }
  #guidedLayer .gfin-field:focus{
    border-bottom-color:var(--color-ink-primary); }
  /* the two joining marks of the mad-lib, and the only thing that changes at the
     rung: on one column they are not English and they go (S7). */
  #guidedLayer .gfin-join{ display:none; }
  @media (min-width:600px){
    #guidedLayer .gfin-join{ display:inline; }
    /* above the rung the two ruled blanks stand INSIDE the line of the sentence,
       each at the width its own size attribute asks for, and the line box is tall enough
       to hold a field with its label under it (that is what the calc on
       .gfin-contactsaid is for). Below the rung they are two writing lines the
       width of the column, which is what a phone can hold. */
    #guidedLayer .gfin-named{
      display:inline-grid; vertical-align:baseline; padding-top:0; }
    #guidedLayer .gfin-field{ width:auto; }
  }
  #guidedLayer .gfin-vh{
    position:absolute; width:1px; height:1px; padding:0; border:0;
    clip-path:inset(50%); overflow:hidden; white-space:nowrap; }

  /* ── the act's own block ───────────────────────────────────────────────── */
  #guidedLayer .gfin-act{ display:flex; flex-direction:column; gap:var(--space-300); }
  #guidedLayer .gfin-act .placebar{ display:flex; flex-direction:column; gap:var(--space-300); }
  /* ── GUIDED-3 FIX WAVE · PURPOSE CLARITY 7, 29 August 2026 ─────────────────
     The page's own outstanding row is written into the document by
     paintOutstanding() and is READ from there into the plinth, above the
     primary (see plinthOutstanding). The in-document copy does not paint: the
     sentence is said once, at the act it is about, and 2,100px from it is not
     "at the act". It was already absent while empty (.outstanding:empty), so
     nothing about the document's rhythm changes by its never filling. */
  #guidedLayer .gfin-act .outstanding{ display:none; }
  #guidedLayer .gfin-hold{
    display:block; width:100%; margin:0 0 var(--space-300);
    padding:var(--space-200) 0; background:none; border:0; border-radius:var(--radius-none);
    text-align:left; cursor:pointer;
    font-family:var(--font-family-sans-stack);
    font-size:var(--type-size-200); line-height:var(--type-line-height-200);
    color:var(--color-ink-primary); }
  /* the cue is the same quiet grammar the layer's own links use — underlined,
     ink, and never a second filled button beside the one that acts. */
  #guidedLayer .gfin-hold .hg{
    display:inline; margin-inline-start:var(--space-200);
    text-decoration:underline; text-underline-offset:3px;
    text-decoration-color:var(--color-line-rule); }
  #guidedLayer .gfin-hold:hover .hg{ text-decoration-color:var(--color-ink-primary); }
  /* GUIDED-4 (30 Aug 2026, judge round 2 · clarity blocker 2) · the kept
     acknowledgement, standing in the plinth where the withdrawn act stood.
     A statement in the reading role — no fill, no border, no control dress —
     at the same rhythm the act row kept, so the plinth does not jump when the
     sentence replaces the button. Tokens only. */
  #guidedLayer .gfin-keptrow{
    display:block; width:100%; margin:0 0 var(--space-300);
    padding:var(--space-200) 0;
    font-size:var(--type-size-200); line-height:var(--type-line-height-200);
    color:var(--color-ink-primary); }
  /* FLOW-1(m) (30 Aug 2026) · the payment fact stands BESIDE the act it
     unblocks. The marketing read measured the sentence that removes the reason
     not to press — "Placing this commission doesn't take a payment." — as the
     LAST element of the words bay, a full screen from the pinned act. The
     plinth carries its first clause, in the reading role, above the primary.
     The body paragraph keeps the clause verbatim (LUX-6 D1, unamendable);
     saying it at the act is the same trade #placeOutstanding already makes. */
  #guidedLayer .gfin-paynote{
    display:block; width:100%; margin:0;
    font-size:var(--type-size-100); line-height:var(--type-line-height-100);
    color:var(--color-ink-secondary); }
  /* FLOW-1(m) (30 Aug 2026) · the letter's headline stood at y=0 at 390 —
     caps touching the viewport edge, with no rail and no masthead above it
     (the clarity judge's m14). One space step of air; the emotional close of
     a commission does not start at the metal. */
  @media (max-width:599px){
    #guidedLayer .gStep[data-step="letter"]{ padding-top:var(--space-600); }
  }
  #guidedLayer .gfin-keptrow:focus{ outline:none; }
  #guidedLayer .gfin-act .invalid{ display:block; max-width:var(--layout-measure-prose);
    font-size:var(--type-size-200); line-height:var(--type-line-height-200);
    color:var(--color-alert-ink); }
  #guidedLayer .gfin-act .invalid:empty{ display:none; }
  /* S8's route, in the quiet role, with the page's own link colour on it — and
     V17's bind: the number and the stop that closes the sentence do not part. */
  #guidedLayer .gfin-ask{ color:var(--color-ink-secondary); }
  #guidedLayer .gfin-ask .humanlink{ color:var(--color-ink-primary); }
  #guidedLayer .gfin-reach{ white-space:nowrap; }

  /* ── the fitting ───────────────────────────────────────────────────────── */
  /* V22 · the reading area, centred. The screen carried 240px of leftover paper
     under four rows; it now carries the description S2 asked for, and whatever
     air is left over stands ABOVE and BELOW the reading in equal measure rather
     than all of it at the foot. margin-block:auto is the safe centring: with
     no free space an auto margin resolves to zero, so a screen that overflows
     scrolls from its own top and nothing is ever pushed out of reach. */
  #guidedLayer .gStep[data-step="fitting"] > .gSlot{
    display:flex; flex-direction:column; min-height:100%; }
  #guidedLayer .gfin-fit{
    display:flex; flex-direction:column; gap:var(--space-800);
    margin-block:auto; }
  #guidedLayer .gfin-demo{ display:block; max-width:var(--layout-measure-prose);
    font-size:var(--type-size-200); line-height:var(--type-line-height-200);
    color:var(--color-ink-primary); }
  /* the four sentences: the reading role, one within-a-unit step apart, on the
     prose measure. They are a description, not a list — no bullets, no rules. */
  #guidedLayer .gfin-fitsaid{ display:flex; flex-direction:column; gap:var(--space-300); }
  #guidedLayer .gfin-fitsaid p{
    max-width:var(--layout-measure-prose);
    font-size:var(--type-size-300); line-height:var(--type-line-height-300);
    color:var(--color-ink-primary); }
  #guidedLayer .gfin-slots{ display:block; }

  /* ── the sheets ────────────────────────────────────────────────────────── */
  #guidedLayer .gfin-sheet{ display:flex; flex-direction:column;
    gap:var(--space-800); align-items:flex-start; }
  #guidedLayer .gfin-sheet .g2Primary{ align-self:stretch; }
  /* ── GUIDED-3 FIX WAVE · PURPOSE CLARITY 5, 29 August 2026 ─────────────────
     THE CHANGE SHEET'S ROWS TAKE THE SHEET'S OWN MEASURE.
     Measured at 390: the sheet 390 wide, its heading 342, and all six door rows
     177 — 47% of the content width dead, with the rows' arrows stranded at x≈193
     in the middle of the screen, reading as a two-column grid that lost its
     second column. The cause is one line: this sheet is a flex COLUMN with
     align-items:flex-start, which shrink-wraps every child to its content, and
     only the primary carried the align-self:stretch that answers it. A rail of
     doors is a full-measure construction wherever it stands (.g2Door already
     declares width:100% — it was its parent that was 177 wide). */
  #guidedLayer .gfin-sheet .g2Doors{ align-self:stretch; }
  #guidedLayer .gfin-shirtgrid{ display:grid; align-self:stretch;
    grid-template-columns:repeat(2, minmax(0,1fr)); gap:var(--space-800) var(--space-300); }
  #guidedLayer .gfin-shirtcell{ min-width:0; }
  /* FLOW-2 · coherence 1: the finishing sheet's lining cells size to their own
     plate (165) instead of borrowing the shirtings' half-sheet columns — the
     90px of empty white left of every swatch at 1440 was the borrowed grid,
     not a design. */
  #guidedLayer .gfin-liningrid{ display:grid; align-self:stretch; justify-content:start;
    grid-template-columns:repeat(auto-fit, 165px); gap:var(--space-600) var(--space-600); }
  #guidedLayer .gfin-linecell{ min-width:0; }
  #guidedLayer .gfin-lininghead{ margin-block-start:var(--space-600); }
  @media (max-width:599px){
    #guidedLayer .gfin-liningrid{ grid-template-columns:repeat(2, minmax(0,1fr)); }
  }
  #guidedLayer .gfin-shirtshot{ --g2-plate-w:165px; --g2-plate-h:165px; }
  /* S3 · the shirting large, and its name beside it. The plate is the file's own
     320 and never a pixel over (G3/L13); at ≤599 the two stack. */
  #guidedLayer .gfin-shirthero{
    display:flex; flex-wrap:wrap; align-items:flex-start;
    gap:var(--space-300) var(--space-800); align-self:stretch; }
  #guidedLayer .gfin-heroshot{ --g2-plate-w:320px; --g2-plate-h:320px; flex:none; }
  #guidedLayer .gfin-heroname{ display:flex; flex-direction:column;
    gap:var(--space-100); min-width:0; flex:1 1 12ch; }
  #guidedLayer .gfin-insiderow{ display:flex; flex-direction:column;
    gap:var(--space-300); align-self:stretch; }
  /* GUIDED-4 (29 Aug 2026) — DATED AMENDMENT, spec §2.4/§2.6. The shirting's
     name is an ANSWER NAME: 20/600/−0.02em in the sans, which is the weight
     step that parts a name from a measurement figure (20/500) now that the face
     no longer parts them. */
  #guidedLayer .gfin-insidelabel{ display:block;
    font-family:var(--font-family-sans-stack);
    font-size:var(--type-size-400); line-height:var(--type-line-height-400);
    letter-spacing:var(--type-tracking-tight);
    font-weight:var(--type-weight-semibold);
    color:var(--color-ink-primary); }
  #guidedLayer .gfin-inside .gfin-field{ align-self:flex-start; width:100%;
    max-width:var(--layout-measure-prose); }

  /* ── the letter ────────────────────────────────────────────────────────── */
  #guidedLayer .gfin-ref{ display:flex; flex-direction:column; gap:var(--space-100); }
  /* S6 · the mark of the commission, at display scale, in the house's own face.
     The identifier's tracking stays — it is what tells one character from the
     next in a code — and the figures are tabular, because a reference is a
     number a man reads aloud down a telephone.
     GUIDED-4 (29 Aug 2026) — DATED AMENDMENT, spec §2.6 (named by line in the
     memo's site list): the face goes sans with the rest of the ladder. NOTHING
     ELSE HERE MOVES, and that is deliberate — this is an IDENTIFIER, not a
     reading title, so it keeps tracking.wide and the identifier figures. §2.4
     gives a title 600/−0.02em; giving those to a code would tighten the one run
     of characters in the product that must be read one glyph at a time down a
     telephone. The two roles now share a size and nothing else. */
  #guidedLayer .gfin-ref .code{
    font-family:var(--font-family-sans-stack);
    font-size:var(--type-size-500); line-height:var(--type-line-height-500);
    letter-spacing:var(--type-tracking-wide);
    font-variant-numeric:var(--type-figures-identifier);
    color:var(--color-ink-primary); }
  #guidedLayer .gfin-refwho{
    font-size:var(--type-size-200); line-height:var(--type-line-height-200);
    font-variant-numeric:var(--type-figures-default);
    color:var(--color-ink-secondary); }
  #guidedLayer .gfin-letter{ max-width:var(--layout-measure-prose); }
  /* FW2/reduction 4 · the colour unit belongs to the row that records the
     decision, so it takes §5.2's SMALLEST step from it — 32 read as a new block
     beginning and put the remedy at arm's length from the record it answers. */
  #guidedLayer .gfin-recswatch .gSwatchLine{ margin-top:var(--space-300); }
  /* M5 · the ledger's lining row, as a door. It keeps the row's own type — a
     door inside a table is still a table row — and carries the walk's one arrow
     for "this opens something else". */
  #guidedLayer .gfin-liningrow{
    display:inline-flex; align-items:baseline; gap:var(--space-200);
    padding:0; border:0; background:none; cursor:pointer;
    color:var(--color-ink-primary);
    font:inherit; letter-spacing:inherit;
    text-decoration:underline; text-underline-offset:3px;
    text-decoration-color:var(--color-line-rule); }
  #guidedLayer .gfin-liningrow:hover{ text-decoration-color:var(--color-ink-primary); }
  #guidedLayer .gfin-liningshot{ --g2-plate-w:165px; --g2-plate-h:165px; }

  @media (min-width:600px){
    #guidedLayer .gfin-shirtgrid{ gap:var(--space-800); }
  }
  /* ≥1024 · the plate bay's own figure for the cloth in hand (direction §9.8,
     §9.4): the detail tier's measured median, 481×420, which is inside every
     file in the tier that this screen can be asked for and over none of them. */
  /* ≥1024 · GUIDED-3 · WP4 · and the cloth stands in the PAIR, at the detail
     tier's measured MINIMUM (344 × its own 481:420 room = 301), not at its
     median 481. The plate is a maximum, never a minimum: a 481px file is fitted
     down into 344 and a 344px one prints at 344, so no cloth in the book is
     drawn above its own pixels at this box (G3/L13) — which the 481 box could
     only promise for the files that happen to be 481 or wider. The garment
     moment took the same number for the same reason, and the cross-settle now
     carries one box from the record to the arrival at every width. */
  @media (min-width:1024px){
    #guidedLayer .gfin-cloth{ --g2-plate-w:344px; --g2-plate-h:301px; }
    #guidedLayer .gfin-look{ width:180px; }
  }
}`;

  function floor() {
    for (const [id, css] of [['gfinGeometry', GEOMETRY], ['gfinFloor', FLOOR]]) {
      if (document.getElementById(id)) continue;
      const st = document.createElement('style');
      st.id = id;
      st.textContent = css;
      (document.head || document.documentElement).appendChild(st);
    }
  }

  if (!registerAll()) {
    document.addEventListener('DOMContentLoaded', registerAll, { once: true });
    window.addEventListener('load', registerAll, { once: true });
  }
})();
