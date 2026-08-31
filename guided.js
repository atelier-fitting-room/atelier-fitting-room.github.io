(function () {
  'use strict';

  const esc = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  (function layerOrder() {
    if (document.getElementById('gLayerOrder')) return;
    const st = document.createElement('style');
    st.id = 'gLayerOrder';
    st.textContent = '@layer guided-floor, gask-fallback, gsee-fallback, gfin-fallback;';
    (document.head || document.documentElement).appendChild(st);
  })();

  const P = {
    get S() { return typeof S !== 'undefined' ? S : null; },
    get priced() { return typeof priced === 'function' ? priced : null; },
    get noFigure() { return typeof NO_FIGURE_YET === 'string' ? NO_FIGURE_YET : ''; },
  };

  const ACHROMATIC_C = 12;
  const NEUTRAL_WORD =
    /^(grey|gray|charcoal|black|midnight|black & midnight|ivory|natural|white|statement)$/i;
  function colourRefuted(cl) {
    if (!cl || cl.hexBasis !== 'measured') return false;
    const c = Number(cl.C);
    if (!Number.isFinite(c) || c >= ACHROMATIC_C) return false;
    const word = typeof colourWord === 'function' ? String(colourWord(cl) || '').trim() : '';
    return !!word && !NEUTRAL_WORD.test(word);
  }
  function clothWords(cl) {
    if (!cl) return '';
    const pat = typeof patWord === 'function' ? String(patWord(cl.p) || '').trim() : '';
    if (!colourRefuted(cl)) {
      const col = typeof colourWord === 'function' ? String(colourWord(cl) || '').trim() : '';
      const said = (col + ' ' + pat).trim();
      return said || (typeof categoryName === 'function' ? String(categoryName(cl) || '').trim() : '');
    }
    return pat ? pat.charAt(0).toUpperCase() + pat.slice(1)
               : (typeof categoryName === 'function' ? String(categoryName(cl) || '').trim() : '');
  }
  function clothProvenance(cl) {
    if (!colourRefuted(cl)) return '';
    const shelf = typeof shelfWord === 'function' ? String(shelfWord(cl.sh) || '').trim() : '';
    return shelf ? 'from the ' + shelf.toLowerCase() + ' shelf' : '';
  }

  const UNSIGNED = [
    /\bmost popular\b/i, /\bbest[- ]?sell/i, /\bselling fast\b/i,
    /\bgoing fast\b/i, /\balmost gone\b/i, /\bonly \d+\b[^.]{0,24}\bleft\b/i,
    /\bleft in stock\b/i, /\blimited (?:time|edition|stock)\b/i,
    /\bhurry\b/i, /\bact now\b/i, /\bdon['’]t miss\b/i,
    /\b\d+(?:\.\d+)?\s*stars?\b/i, /[★✩⭐]/,
    /\b\d+\s*(?:people|clients|customers|others)\b/i, /\bcustomers? also\b/i,
    /\btrending\b/i, /\bin demand\b/i, /\bfastest[- ]moving\b/i,
    /\bmost (commissions|clients|men|people)\b/i,
  ];
  function signed(text, where) {
    const t = String(text ?? '');
    for (const re of UNSIGNED) {
      if (re.test(t)) {
        console.error('GUIDED · the honesty floor refused ' + where + ': ' +
          JSON.stringify(t) + ' — the house has not signed that claim. ' +
          'Speak as the tailor instead (GUIDED-1 §2.1).');
        return '';
      }
    }
    return t;
  }

  const swept = new Set();
  function sweepFloor(node, where) {
    const t = node && node.textContent ? node.textContent : '';
    if (!t) return;
    for (const re of UNSIGNED) {
      const m = t.match(re);
      if (!m) continue;
      const key = where + '::' + re.source;
      if (swept.has(key)) continue;
      swept.add(key);
      console.warn('GUIDED · the honesty floor found an unsigned claim rendered on "' + where +
        '": ' + JSON.stringify(m[0]) + ' — the house has not signed that claim, and it is not ' +
        'on an answer this guard can refuse. Cut it in the file that wrote it (GUIDED-1 §2.1).');
    }
  }

  function safeURL(v) {
    if (typeof v !== 'string' || !v || v.length > 512) return '';
    return /[;{}<>"'()\\\s]/.test(v) ? '' : v;
  }
  function safeSrcset(v) {
    if (typeof v !== 'string' || !v || v.length > 2048) return '';
    return /[;{}<>"'()\\]/.test(v) ? '' : v;
  }
  function px(n) {
    const v = Math.round(Number(n));
    return Number.isFinite(v) && v > 0 ? v : 0;
  }

  const FLOW = ['build', 'commit', 'fitting', 'letter'];
  const CONDITIONAL = new Set(['fitting', 'looks', 'identify', 'visit']);

  const STEPS = new Map();      
  const EXTRA = [];             

  function order() {
    const out = [];
    for (const id of FLOW) if (STEPS.has(id)) out.push(id);
    for (const id of EXTRA) if (STEPS.has(id) && out.indexOf(id) < 0) out.push(id);
    return out;
  }
  function defaultNext(fromId) {
    const walk = order();
    let i = walk.indexOf(fromId);
    if (i < 0) return walk[0] ?? null;
    for (i += 1; i < walk.length; i++) {
      const id = walk[i];
      if (!CONDITIONAL.has(id)) return id;
    }
    return null;                        
  }

  const KEY = 'pt-guided';
  const RESUME_MS = 6 * 60 * 60 * 1000;         
  function store(kind) {
    try { return kind === 'local' ? window.localStorage : window.sessionStorage; }
    catch (e) { return null; }                  
  }
  function save() {
    let raw;
    try {
      raw = JSON.stringify({ v: 1, at: curId || null, up: mounted, ts: Date.now(),
                             state: G.state, looks: G.looks });
    } catch (e) { return; }                     
    for (const kind of ['local', 'session']) {
      const s = store(kind);
      if (!s) continue;
      try { s.setItem(KEY, raw); }
      catch (e) {   }
    }
  }
  let resumeAt = null;                  
  let pickUpAt = null;                  
  let leftAt = 0;                       
  function load() {
    for (const kind of ['session', 'local']) {
      const s = store(kind);
      if (!s) continue;
      let d = null;
      try { d = JSON.parse(s.getItem(KEY) || 'null'); } catch (e) { d = null; }
      if (!d || d.v !== 1) continue;
      if (d.state && typeof d.state === 'object') G.state = d.state;
      if (Array.isArray(d.looks)) G.looks = d.looks;
      const at = (d.up && typeof d.at === 'string') ? d.at : null;
      leftAt = Number.isFinite(d.ts) ? d.ts : 0;
      const sameTab = kind === 'session'
        || (() => { try { return !!(store('session') && store('session').getItem(KEY)); }
                    catch (e) { return false; } })();
      const fresh = sameTab && leftAt > 0 && (Date.now() - leftAt) <= RESUME_MS;
      resumeAt = fresh ? at : null;
      pickUpAt = fresh ? null : at;
      return;
    }
  }
  function leftWords() {
    if (!leftAt) return 'earlier';
    const mins = Math.max(0, Math.round((Date.now() - leftAt) / 60000));
    if (mins < 90) return 'earlier today';
    const hours = Math.round(mins / 60);
    if (hours < 24) return 'about ' + hours + ' hours ago';
    const days = Math.round(hours / 24);
    return days <= 1 ? 'yesterday' : 'about ' + days + ' days ago';
  }

  let resumeQueued = false;
  function queueResume() {
    if (resumeQueued || !(resumeAt || pickUpAt)) return;
    resumeQueued = true;
    setTimeout(() => { resumeIfMidWalk(); offerPickUp(); }, 0);
  }
  function resumeIfMidWalk() {
    if (mounted || !resumeAt) return;
    const at = resumeAt;
    if (at === 'letter') { resumeAt = null; return; }   
    if (!STEPS.has(at)) { resumeQueued = false; return; }
    resumeAt = null;
    G.state.__at = at;
    G.start({ resume: true });
  }

  const PICKUP = 'gPickUp';
  function offerPickUp() {
    if (mounted || !pickUpAt) return;
    if (document.getElementById(PICKUP)) return;
    const at = pickUpAt;
    if (at === 'letter') { pickUpAt = null; return; }
    if (!STEPS.has(at)) { resumeQueued = false; return; }
    const th = document.getElementById('threshold') || document.querySelector('.threshold');
    const routes = th ? [...th.querySelectorAll('.recroutes')] : [];
    const before = routes.find((r) => r.offsetParent !== null) || routes[0] || null;
    const host = before ? before.parentNode : (th ? th.querySelector('.thbody') : null);
    if (!host) return;                          
    const box = document.createElement('div');
    box.className = 'recroutes';
    box.id = PICKUP;
    box.innerHTML =
      '<p class="standing">' + esc(signed('You left a commission here ' + leftWords() +
        '. It is kept as you left it.', 'the pick-up line')) + '</p>' +
      '<button type="button" class="viewall" data-pt="guided-pickup">' +
      'Pick up where you left off →</button>';
    box.querySelector('button').addEventListener('click', () => {
      pickUpAt = null;
      dropPickUp();
      G.state.__at = at;
      G.start({ resume: true });
    });
    if (before) host.insertBefore(box, before); else host.appendChild(box);
  }
  function dropPickUp() {
    const el = document.getElementById(PICKUP);
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  const HKEY = 'ptGuided';
  let depth = 0;                        
  let byGesture = false;                
  function phaseNow() {
    try { return (P.S && P.S.phase) || (history.state && history.state.ptPhase) || null; }
    catch (e) { return null; }
  }
  function pushPlace(id) {
    if (!id || byGesture) return;
    try {
      const st = { ptPhase: phaseNow(), [HKEY]: { at: id, n: ++depth } };
      history.pushState(st, '');
    } catch (e) { depth = Math.max(0, depth - 1); }    
  }
  function hop(id) {
    if (!STEPS.has(id) || id === curId) return;
    const i = trail.lastIndexOf(id);
    if (i >= 0) trail.length = i; else if (curId) trail.push(curId);
    curId = id;
    swatchOpenFor = null;
    closeSheet(true);
    render({ back: true });
  }
  addEventListener('popstate', (e) => {
    const rec = e && e.state ? e.state[HKEY] : null;
    byGesture = true;
    try {
      if (!mounted) {
        if (rec && typeof rec.at === 'string' && rec.at !== 'letter' && STEPS.has(rec.at)) {
          depth = Number(rec.n) || depth;
          G.state.__at = rec.at;
          G.start({ resume: true });
        }
        return;
      }
      if (sheetEl) {
        if (rec) depth = Number(rec.n) || Math.max(0, depth - 1);
        closeSheet();
        return;
      }
      const here = current();
      if (here && (here.ways === false || here.back === false)) { depth = 0; leave(); return; }
      if (rec && typeof rec.at === 'string' && STEPS.has(rec.at) && rec.at !== curId
          && rec.at !== 'letter') {
        depth = Number(rec.n) || Math.max(0, depth - 1);
        hop(rec.at);
        return;
      }
      if (rec && typeof rec.at === 'string' && rec.at === curId) {
        const here2 = current();
        if (here2 && typeof here2.onPop === 'function') {
          depth = Number(rec.n) || Math.max(0, depth - 1);
          here2.onPop(rec.open || null);
          return;
        }
      }
      if (trail.length && depth > 1) { depth -= 1; hop(trail[trail.length - 1]); return; }
      depth = 0;
      leave();
    } finally { byGesture = false; }
  });

  function moneyLine() {
    if (typeof fig !== 'function' || typeof liveTotal !== 'function') return '';
    const isPriced = P.priced;
    if (isPriced && !isPriced()) {
      return '<p class="gMoney gMoney--nofigure">' + esc(P.noFigure) + '</p>';
    }
    try {
      const running = fig(liveTotal(), 'total', { cls: 'gFig' });
      return '<p class="gMoney">' + running.html +
        (running.covers ? '<span class="gCovers">' + esc(running.covers) + '</span>' : '') +
        '<span class="gBasis">' + esc(running.basis) + '</span></p>';
    } catch (err) {
      console.error('GUIDED · the running figure could not be composed.', err);
      return '';
    }
  }

  function footMoney() {
    const step = current();
    if (step && step.money === false) return '';
    const st = P.S;
    if (!st) return '';
    if (!(step && step.money === true) && !(st.garmentTouched || st.clothTouched)) return '';
    return moneyLine();
  }

  function namesCloth(value, id) {
    if (!id || !value || typeof value !== 'object') return false;
    return value.id === id
      || (value.cloth && value.cloth.id === id)
      || value.clothId === id;
  }
  function markCloth(beforeId, value) {
    const st = P.S;
    if (!st || !st.cloth) return;
    if (st.cloth.id !== beforeId || namesCloth(value, st.cloth.id)) st.clothTouched = true;
  }


  let swatchOpenFor = null;       

  function houseColourSentence(it) {
    if (typeof window.swatchLine === 'function') {
      try {
        const s = window.swatchLine(it, 'card');
        const cut = s.indexOf('<');
        const said = (cut > 0 ? s.slice(0, cut) : s).trim();
        if (said) return said;
      } catch (e) {   }
    }
    return window.HOUSE_LINE
      ? window.HOUSE_LINE.colour(it)
      : 'This colour has not been measured from the cloth.';
  }

  const FORM_SAID = 'A standard tailor\u2019s form in your cloth.';
  function formLine(o) {
    const opt = o || {};
    const said = opt.each ? FORM_SAID.replace('your cloth', 'each cloth') : FORM_SAID;
    const clause = String(opt.clause || '').trim();
    return clause ? said + ' ' + clause : said;
  }

  const IN_HAND_SAID = 'You’ll hold the cloth in hand at your fitting — nothing is cut before then.';

  function swatchLineHTML(cloth, naming) {
    const it = cloth || (P.S ? P.S.cloth : null);
    if (!it) return '';
    const st = P.S;
    const called = String(naming || '').trim() || it.c;
    const said = '<span class="gSaid">' + esc(houseColourSentence(it)) + '</span>';
    if (st && st.swatchDone && st.swatchDone[it.id]) {
      const done = typeof SWATCH_RECORDED === 'function' ? SWATCH_RECORDED(it) : '';
      return '<div class="gSwatchLine">' + said +
        '<span class="gRec" data-pt="swatch-recorded" role="status" tabindex="-1">' +
        esc(done) + '</span></div>';
    }
    if (swatchOpenFor === it.id) {
      const lede = typeof SWATCH_DEFAULT === 'string' ? SWATCH_DEFAULT : '';
      return '<div class="gSwatchLine">' + said +
        '<div class="gAsk" role="group" aria-label="' + esc('Ask for a swatch of ' + called) + '">' +
        '<p class="gAskLede">' + esc(lede) + '</p>' +
        '<label class="gField" for="swName">Your name' +
        '<input id="swName" type="text" autocomplete="name"></label>' +
        '<label class="gField" for="swAddr">Where to post it' +
        '<input id="swAddr" type="text" autocomplete="street-address"></label>' +
        '<p class="gProblem" id="swProblem" role="status"></p>' +
        '<button type="button" class="g2Primary" data-g="swatch-send" data-g-id="' + esc(it.id) + '">' +
        'Post me a swatch</button>' +
        '<button type="button" class="g2Quiet" data-g="swatch-close">Not now</button>' +
        '</div></div>';
    }
    return '<div class="gSwatchLine">' + said +
      '<span class="gsee-fine gInHand">' + esc(IN_HAND_SAID) + '</span></div>';
  }

  function swatchLinePairHTML(a, b) {
    if (!a || !b) return swatchLineHTML(a || b);
    const st = P.S;
    const weaker = (a.hexBasis === 'measured' && !a.photoUnusable) ? b : a;
    const said = '<span class="gSaid">' + esc(houseColourSentence(weaker)) + '</span>';
    const both = a.c + ' and ' + b.c;
    const key = a.id + ' ' + b.id;
    const done = (it) => !!(st && st.swatchDone && st.swatchDone[it.id]);
    if (done(a) && done(b)) {
      const rec = typeof SWATCH_RECORDED === 'function'
        ? 'Written down — a swatch of ' + both + '. A person in the atelier cuts each from the ' +
          'bolt and posts it. Nothing has gone out to you yet, and no confirmation has been sent.'
        : '';
      return '<div class="gSwatchLine">' + said +
        '<span class="gRec" data-pt="swatch-recorded" role="status" tabindex="-1">' +
        esc(rec) + '</span></div>';
    }
    if (swatchOpenFor === key) {
      const lede = typeof SWATCH_DEFAULT === 'string' ? SWATCH_DEFAULT : '';
      return '<div class="gSwatchLine">' + said +
        '<div class="gAsk" role="group" aria-label="' + esc('Ask for a swatch of ' + both) + '">' +
        '<p class="gAskLede">' + esc(lede) + '</p>' +
        '<label class="gField" for="swName">Your name' +
        '<input id="swName" type="text" autocomplete="name"></label>' +
        '<label class="gField" for="swAddr">Where to post it' +
        '<input id="swAddr" type="text" autocomplete="street-address"></label>' +
        '<p class="gProblem" id="swProblem" role="status"></p>' +
        '<button type="button" class="g2Primary" data-g="swatch-send" data-g-id="' + esc(key) + '">' +
        esc('Post me both swatches') + '</button>' +
        '<button type="button" class="g2Quiet" data-g="swatch-close">Not now</button>' +
        '</div></div>';
    }
    return '<div class="gSwatchLine">' + said +
      '<span class="gsee-fine gInHand">' + esc(IN_HAND_SAID) + '</span></div>';
  }

  let VALS = [];

  function slot(o) {
    return VALS.push({
      value: o.value,
      act: typeof o.act === 'function' ? o.act : null,
      to: o.goto || null,
      multi: !!o.multi,
    }) - 1;
  }

  function markHTML() { return '<span class="g2Mark" aria-hidden="true"></span>'; }
  function wordHTML(word) {
    return '<span class="g2Chosen">' + esc(signed(word || 'Chosen', 'a selected word')) + '</span>';
  }

  function advice(text) {
    const t = signed(text, 'an advice line');
    return t ? '<span class="g2Advice">' + esc(t) + '</span>' : '';
  }
  function eyebrow(text) {
    const t = signed(text, 'an eyebrow');
    return t ? '<span class="g2Eyebrow">' + esc(t) + '</span>' : '';
  }

  function plate(o) {
    const opt = o || {};
    const src = safeURL(opt.src);
    if (!src) return '';
    const fileW = px(opt.fileW), fileH = px(opt.fileH);
    let w = px(opt.w);
    if (fileW) w = w ? Math.min(w, fileW) : fileW;           
    let h = px(opt.h);
    if (!h && w && fileW && fileH) h = Math.round(w * fileH / fileW);
    const style = (w ? '--g2-plate-w:' + w + 'px;' : '') + (h ? '--g2-plate-h:' + h + 'px;' : '');
    const set = safeSrcset(opt.srcset);
    const sizes = safeSrcset(opt.sizes);
    return '<span class="g2Plate' + (opt.full ? ' g2Plate--bleed' : '') +
      (opt.cls ? ' ' + esc(opt.cls) : '') + '"' +
      (style ? ' style="' + esc(style) + '"' : '') +
      (opt.persist ? ' data-g2-persist="' + esc(opt.persist) + '"' : '') + '>' +
      '<img src="' + esc(src) + '"' +
      (set ? ' srcset="' + esc(set) + '"' : '') +
      (sizes ? ' sizes="' + esc(sizes) + '"' : '') +
      (fileW ? ' width="' + fileW + '"' : '') + (fileH ? ' height="' + fileH + '"' : '') +
      ' loading="' + (opt.eager ? 'eager' : 'lazy') + '" decoding="async"' +
      ' alt="' + esc(opt.alt || '') + '"></span>';
  }

  function tile(o) {
    const opt = o || {};
    const name = signed(opt.name, 'a tile name');
    if (!name) return '';
    const i = slot(opt);
    const sel = !!opt.selected;
    const state = opt.multi ? ' aria-pressed="' + (sel ? 'true' : 'false') + '"'
                            : ' role="radio" aria-checked="' + (sel ? 'true' : 'false') + '"';
    return '<button type="button" class="g2Tile' + (opt.cls ? ' ' + esc(opt.cls) : '') + '"' +
      state + ' data-g="pick" data-g-i="' + i + '">' +
      (opt.plate ? plate(opt.plate) : '') +
      '<span class="g2Cap">' + markHTML() +
      (opt.swatch && opt.swatch.src
        ? plate({ src: opt.swatch.src, w: 44, fileW: 224, fileH: 224,
                  cls: 'g2Swatch', alt: opt.swatch.alt || '' })
        : '') +
      '<span class="g2CapWords">' +
      (opt.eyebrow ? eyebrow(opt.eyebrow) : '') +
      '<span class="g2Name">' + esc(name) + wordHTML(opt.word) + '</span>' +
      (opt.fact ? '<span class="g2Fact">' + esc(signed(opt.fact, 'a tile fact')) + '</span>' : '') +
      (opt.advice ? advice(opt.advice) : '') +
      '</span></span></button>';
  }

  function row(o) {
    const opt = o || {};
    const name = signed(opt.name, 'a row name');
    if (!name) return '';
    const i = slot(opt);
    const sel = !!opt.selected;
    const state = opt.multi ? ' aria-pressed="' + (sel ? 'true' : 'false') + '"'
                            : ' role="radio" aria-checked="' + (sel ? 'true' : 'false') + '"';
    return '<button type="button" class="g2Row' + (opt.cls ? ' ' + esc(opt.cls) : '') + '"' +
      state + ' data-g="pick" data-g-i="' + i + '">' + markHTML() +
      '<span class="g2RowWords">' +
      '<span class="g2Name">' + esc(name) + wordHTML(opt.word) + '</span>' +
      (opt.fact ? '<span class="g2Fact">' + esc(signed(opt.fact, 'a row fact')) + '</span>' : '') +
      (opt.advice ? advice(opt.advice) : '') +
      '</span></button>';
  }

  function primary(label, o) {
    const opt = o || {};
    const text = signed(label, 'a primary action');
    if (!text) return '';
    const i = slot(opt);
    return '<button type="button" class="g2Primary' + (opt.cls ? ' ' + esc(opt.cls) : '') + '"' +
      ' data-g="pick" data-g-i="' + i + '">' + esc(text) + '</button>';
  }

  function door(o) {
    const opt = o || {};
    const label = signed(opt.label, 'a door');
    if (!label) return '';
    const i = slot(opt);
    return '<button type="button" class="g2Door' + (opt.cls ? ' ' + esc(opt.cls) : '') + '"' +
      ' data-g="pick" data-g-i="' + i + '">' +
      '<span class="g2DoorLabel">' + esc(label) + '</span>' +
      (opt.fact ? '<span class="g2DoorFact">' + esc(signed(opt.fact, 'a door fact')) + '</span>' : '') +
      '<span class="g2DoorArrow" aria-hidden="true">→</span></button>';
  }
  function doors(list) {
    if (!Array.isArray(list)) return '';
    const rows = list.map((d) => door(d)).filter(Boolean).join('');
    return rows ? '<div class="g2Doors">' + rows + '</div>' : '';
  }

  function quiet(label, o) {
    const opt = o || {};
    const text = signed(label, 'a quiet line');
    if (!text) return '';
    const i = slot(opt);
    return '<button type="button" class="g2Quiet' + (opt.cls ? ' ' + esc(opt.cls) : '') + '"' +
      ' data-g="pick" data-g-i="' + i + '">' + esc(text) + '</button>';
  }

  function chip(label, value, extras) {
    const x = extras || {};
    return row({
      name: label, fact: x.note, advice: x.advice, value,
      selected: x.selected, act: x.act, goto: x.goto, multi: x.multi,
    });
  }

  function rail(items, o) {
    const opt = o || {};
    const list = Array.isArray(items) ? items.filter(Boolean) : [];
    if (!list.length) return '';
    if (!opt.label) console.warn('GUIDED · a rail needs an aria-label; it is a group of things.');
    return '<div class="g2Rail" role="group" aria-label="' + esc(opt.label || 'A row of looks') + '">' +
      list.map((h) => '<div class="g2RailCell">' + h + '</div>').join('') + '</div>';
  }

  let sheetEl = null, sheetReturn = null, sheetOverStage = false;
  function sheetEscAnywhere(e) {
    if (e.key !== 'Escape' || !sheetEl) return;
    const dialogUp = document.querySelector('#overlay.open, #closeup.open');
    if (dialogUp) return;
    e.preventDefault();
    closeSheet();
  }
  function stageWhileSheet(up) {
    const step = current();
    document.body.classList.toggle('gsee-stage', !!(up && step && step.stage));
  }
  function returnEl(want) {
    if (!want) return null;
    if (typeof want === 'string') {
      const el = G.el ? G.el.querySelector(want) : null;
      return el && el.focus ? el : null;
    }
    return want && want.focus && document.contains(want) ? want : null;
  }
  function openSheet(id, html, o) {
    const opt = o || {};
    const caret = document.activeElement;
    closeSheet(true);
    if (!G.el) return;
    sheetReturn = (typeof opt.returnTo === 'string' && opt.returnTo)
      ? opt.returnTo
      : (returnEl(opt.returnTo) || (caret && document.contains(caret) ? caret : null));
    const s = document.createElement('div');
    s.className = 'g2Sheet';
    s.id = 'g2Sheet-' + String(id || 'sheet').replace(/[^a-z0-9-]/gi, '');
    s.setAttribute('role', 'group');
    const label = signed(opt.heading, 'a sheet heading') || String(opt.close || 'A sheet');
    s.setAttribute('aria-label', label);
    s.innerHTML =
      '<div class="g2SheetIn">' +
      '<div class="g2SheetTop">' +
      (opt.heading
        ? '<h2 class="gQ g2SheetH" tabindex="-1">' + esc(signed(opt.heading, 'a sheet heading')) + '</h2>'
        : '<span></span>') +
      '<button type="button" class="g2Quiet g2SheetClose" data-g="sheet-close">' +
      esc(opt.close || 'Close') + '</button></div>' +
      html + '</div>';
    G.el.appendChild(s);
    G.el.classList.add('has-sheet');
    for (const part of [scroller, footBox]) {
      if (part && 'inert' in HTMLElement.prototype) part.inert = true;
    }
    sheetEl = s;
    sheetOverStage = opt.overStage === true;
    if (sheetOverStage) stageWhileSheet(false);    
    if (!byGesture && mounted && curId) {
      try { history.pushState({ ptPhase: phaseNow(), [HKEY]: { at: curId, n: ++depth, sheet: s.id } }, ''); }
      catch (e) { depth = Math.max(0, depth - 1); }
    }
    document.addEventListener('keydown', sheetEscAnywhere, true);
    sweepFloor(s, 'the ' + id + ' sheet');
    const h = s.querySelector('.g2SheetH') || s.querySelector('button');
    if (h && h.focus) h.focus({ preventScroll: true });
  }
  function closeSheet(quietly) {
    if (!sheetEl) return;
    document.removeEventListener('keydown', sheetEscAnywhere, true);
    sheetEl.remove();
    sheetEl = null;
    if (sheetOverStage && mounted) stageWhileSheet(true);    
    sheetOverStage = false;
    if (G.el) G.el.classList.remove('has-sheet');
    for (const part of [scroller, footBox]) {
      if (part && 'inert' in HTMLElement.prototype) part.inert = false;
    }
    const back = quietly ? null : returnEl(sheetReturn);
    if (back) back.focus({ preventScroll: true });
    sheetReturn = null;
  }

  function ctx() {
    return {
      S: P.S,
      answer: (v) => G.answer(v),
      goto: (id, o) => G.goto(id, o),    
      advice,
      eyebrow,
      chip,                        
      plate, tile, row, door, doors, primary, quiet, rail,
      sheet: openSheet,
      closeSheet: () => closeSheet(),
      moneyLine,
      swatchLine: swatchLineHTML,
      swatchLinePair: swatchLinePairHTML,       
      clothWords,                               
      clothProvenance,                          
    };
  }

  let mounted = false;
  let pending = false;                
  let curId = null;
  const trail = [];
  let host = null, footBox = null, sayBox = null, scroller = null;

  function current() { return curId ? STEPS.get(curId) ?? null : null; }

  function mount() {
    const layer = document.createElement('div');
    layer.id = 'guidedLayer';
    layer.setAttribute('role', 'region');
    layer.setAttribute('aria-label', 'Your commission, guided');
    layer.innerHTML =
      '<div class="gMast"><p class="gMastIn">BESPOKE BY PAUL</p></div>' +
      '<div class="gScroll" id="guidedScroll"><div class="gBody" id="guidedBody"></div></div>' +
      '<div class="gFoot" id="guidedFoot"></div>' +
      '<p class="gSay" id="guidedSay" role="status" aria-live="polite"></p>';
    document.body.appendChild(layer);
    G.el = layer;
    host = layer.querySelector('#guidedBody');
    footBox = layer.querySelector('#guidedFoot');
    sayBox = layer.querySelector('#guidedSay');
    scroller = layer.querySelector('#guidedScroll');
    layer.addEventListener('click', onClick);
    layer.addEventListener('keydown', onKeyDown, true);    
    mounted = true;
    window.addEventListener('resize', holdFoldSoon);
    if (typeof MutationObserver === 'function' && scroller) {
      foldMO = new MutationObserver(holdFoldSoon);
      foldMO.observe(scroller, { childList: true, subtree: true, characterData: true });
    }

    const conf = document.getElementById('conf');
    if (conf && 'inert' in HTMLElement.prototype) {
      conf.inert = true;
      conf.setAttribute('data-guided-inert', '');
    }
  }

  function unmount() {
    closeSheet(true);
    window.removeEventListener('resize', holdFoldSoon);
    if (foldMO) { foldMO.disconnect(); foldMO = null; }
    document.documentElement.style.removeProperty('--g2-fold-nudge');
    foldNudge = 0;
    const conf = document.querySelector('[data-guided-inert]');
    if (conf) { conf.inert = false; conf.removeAttribute('data-guided-inert'); }
    if (G.el && G.el.parentNode) G.el.parentNode.removeChild(G.el);
    G.el = null; host = footBox = sayBox = scroller = null;
    mounted = false; swatchOpenFor = null;
    save();                     
    document.body.classList.remove('gsee-stage');
  }

  function actInFoot(step) {
    const a = step && step.act;
    if (!a || !a.label) return null;
    return (a.where === 'body' || a.inBody === true) ? null : a;
  }
  function actHTML(a) {
    const text = signed(a.label, 'a primary action');
    if (!text) return '';
    return '<div class="gAct"><button type="button" class="g2Primary gActBtn"' +
      ' data-g="act">' + esc(text) + '</button></div>';
  }
  function runAct(a) {
    if (!a) return;
    if (typeof a.act === 'function') { a.act(ctx()); renderFoot(); return; }
    if (a.goto) { G.goto(a.goto); return; }
    G.answer(a.value === undefined ? 'act' : a.value);
  }

  function renderFoot() {
    if (!footBox) return;
    const step = current();
    const money = footMoney();
    const act = actInFoot(step);
    const noWays = step && (step.ways === false || step.chrome === false);
    const wantBack = !!trail.length && !noWays && !(step && step.back === false);
    const ways = (wantBack || (step && step.skippable))
      ? '<div class="gWays">' +
        (wantBack ? '<button type="button" class="g2Quiet gBack" data-g="back">Back</button>' : '') +
        (step && step.skippable ? '<button type="button" class="g2Quiet gSkip" data-g="skip">Skip</button>' : '') +
        '</div>'
      : '';
    const actRow = act ? actHTML(act) : '';
    footBox.innerHTML = (money ? '<div class="gMoneyWrap">' + money + '</div>' : '') + actRow + ways;
    footBox.classList.toggle('has-act', !!actRow);
    footBox.hidden = !money && !ways && !actRow;
    holdFoldSoon();
  }

  const FOLD_CEILING = 144;
  let foldPending = false;
  let foldNudge = 0;
  let foldSettle = 0;
  let foldMO = null;
  let foldTail = 0;
  function holdFoldSoon() {
    if (!mounted) return;
    if (!foldPending) {
      foldPending = true;
      requestAnimationFrame(() => { foldPending = false; holdFold(); });
    }
    clearTimeout(foldTail);
    foldTail = setTimeout(holdFold, 320);
  }
  function holdFold() {
    if (!mounted || !scroller || !host) return;
    const frame = host.firstElementChild;
    const root = document.documentElement.style;
    if (!frame) { root.removeProperty('--g2-fold-nudge'); foldNudge = 0; return; }
    if (scroller.scrollTop > 0) return;
    if (foldNudge) root.setProperty('--g2-fold-nudge', '0px');
    const fold = scroller.getBoundingClientRect().bottom;
    const lines = [];
    const walk = document.createTreeWalker(frame, NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      if (!String(n.textContent || '').trim()) continue;
      const p = n.parentElement;
      if (!p || p.closest('.gSay') || p.closest('.g2SrOnly')) continue;
      const cs = getComputedStyle(p);
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      const rg = document.createRange();
      rg.selectNodeContents(n);
      const lh = parseFloat(cs.lineHeight);
      for (const b of rg.getClientRects()) {
        if (b.width <= 0 || b.height <= 0) continue;
        const trim = Number.isFinite(lh) && lh > 0 && b.height > lh ? (b.height - lh) / 2 : 0;
        lines.push([b.top + trim, b.bottom - trim]);
      }
    }
    let x = fold;
    for (let pass = 0; pass < 32; pass++) {
      const cut = lines.find(([t, b]) => t < x - 0.5 && b > x + 0.5);
      if (!cut) break;
      x = cut[0];                        
    }
    let d = Math.max(0, Math.round((fold - x) * 100) / 100);
    if (d > FOLD_CEILING) d = 0;
    const was = foldNudge;
    foldNudge = d;
    if (d) root.setProperty('--g2-fold-nudge', d + 'px');
    else root.removeProperty('--g2-fold-nudge');
    if (d !== was && foldSettle < 6) { foldSettle += 1; setTimeout(holdFold, 60); }
    else if (d === was) {
      const spentFold = fold - d;
      const cutStill = d > 0 && lines.some(([t, b]) => t < spentFold - 0.5 && b > spentFold + 0.5);
      if (cutStill && foldSettle < 6) { foldSettle += 1; setTimeout(holdFold, 60); }
      else foldSettle = 0;
    }
    for (const img of frame.querySelectorAll('img')) {
      if (!img.complete) img.addEventListener('load', holdFoldSoon, { once: true });
    }
    if (!holdFold._fonts && document.fonts && document.fonts.ready) {
      holdFold._fonts = true;
      document.fonts.ready.then(() => holdFoldSoon()).catch(() => {});
    }
  }

  function say(text) {
    if (!sayBox) return;
    sayBox.textContent = '';
    const t = String(text ?? '');
    if (!t) return;
    setTimeout(() => { if (sayBox) sayBox.textContent = t; }, 120);
  }


  function render(opt) {
    if (!mounted) return;
    const step = current();
    const wantStage = !!(step && step.stage);
    document.body.classList.toggle('gsee-stage', wantStage);
    requestAnimationFrame(() => {
      if (!mounted) return;
      const now = current();
      document.body.classList.toggle('gsee-stage', !!(now && now.stage));
    });
    renderFoot();
    if (!step) { if (host) host.replaceChildren(); return; }

    VALS = [];
    const frame = document.createElement('div');
    frame.className = 'gStep';
    frame.tabIndex = -1;
    frame.dataset.step = step.id;
    if (step.compose === 'spread' || step.compose === 'grid') {
      frame.dataset.compose = step.compose;
    }


    let h = null;
    if (step.question !== false && (step.question || step.title)) {
      h = document.createElement('h2');
      h.className = 'gQ';
      h.id = 'gH';
      h.tabIndex = -1;
      h.textContent = step.question || step.title || '';
      frame.appendChild(h);
    }

    const body = document.createElement('div');
    body.className = 'gSlot';
    body.id = 'gBody';
    frame.appendChild(body);

    try {
      if (typeof step.render === 'function') step.render(body, ctx());
    } catch (err) {
      console.error('GUIDED · the step "' + step.id + '" could not draw itself.', err);
    }

    if (step.act && step.act.label && !actInFoot(step)) {
      const wrap = document.createElement('div');
      wrap.className = 'g2ActRow';
      wrap.innerHTML = primary(step.act.label, {
        value: step.act.value === undefined ? 'act' : step.act.value,
        act: step.act.act,
      });
      frame.appendChild(wrap);
    }

    const noWays = step.ways === false || step.chrome === false;
    if (!noWays && step.escape !== false) {
      const out = document.createElement('div');
      out.className = 'g2Escape';
      out.innerHTML = '<button type="button" class="g2Quiet gOut" data-g="exit">' +
        'Browse the full workshop instead</button>';
      frame.appendChild(out);
    }

    save();
    place(frame, opt, h, step);
  }

  function persistKey(node) {
    const el = node && node.querySelector ? node.querySelector('[data-g2-persist]') : null;
    return el ? el.getAttribute('data-g2-persist') : '';
  }
  function ms(name) {
    try {
      const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      const n = parseFloat(v);
      return Number.isFinite(n) ? (v.endsWith('ms') ? n : n * 1000) : 0;
    } catch (e) { return 0; }
  }

  function place(frame, opt, h, step) {
    const back = !!(opt && opt.back);
    const old = host.firstElementChild;
    const oldKey = persistKey(old), newKey = persistKey(frame);
    const cross = !!(old && oldKey && newKey && oldKey === newKey && !back);
    frame.classList.add('is-entering');
    if (back) frame.classList.add('is-back');
    if (cross) frame.classList.add('is-cross');

    const put = () => {
      if (!mounted || !host) return;
      host.replaceChildren(frame);
      groupAnswers(frame, h ? h.id : null);
      if (scroller) scroller.scrollTop = 0;
      const target = frame.querySelector('#gH') || frame;
      if (target.focus) target.focus({ preventScroll: true });
      const words = (step && (step.question || step.title)) || '';
      const landed = target === frame.querySelector('#gH')
        && document.activeElement === target
        && String(target.textContent || '').trim() === String(words).trim();
      say(landed ? String((step && step.said) || '') : words);
      foldSettle = 0;                     
      sweepFloor(frame, step ? step.id : 'a step');
      requestAnimationFrame(() => requestAnimationFrame(() => {
        frame.classList.remove('is-entering', 'is-back');
        holdFold();
      }));
    };

    if (!cross) { put(); return; }
    old.classList.add('is-leaving');
    const wait = ms('--motion-duration-exit');
    if (wait > 0) setTimeout(put, wait); else put();
  }

  function onKeyDown(e) {
    if (!G.el) return;
    if (e.key === 'Escape') {
      if (sheetEl) { e.preventDefault(); closeSheet(); return; }
      const st = current();
      if (st && typeof st.onEscape === 'function' && st.onEscape()) e.preventDefault();
      return;
    }
    const radio = e.target && e.target.closest ? e.target.closest('[role=radio]') : null;
    const grp = radio && radio.closest('[role=radiogroup]');
    if (!grp || !G.el.contains(grp)) return;
    const dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    const items = Array.from(grp.querySelectorAll('[role=radio]'));
    if (!items.length) return;
    const i = Math.max(0, items.indexOf(radio));
    const j = dir != null ? (i + dir + items.length) % items.length
      : e.key === 'Home' ? 0
      : e.key === 'End' ? items.length - 1 : null;
    if (j == null) return;
    e.preventDefault();
    e.stopPropagation();           
    items.forEach((n, k) => { n.tabIndex = k === j ? 0 : -1; });
    items[j].focus();
  }

  function groupAnswers(root, labelId) {
    const list = Array.from(root.querySelectorAll('.g2Row[role=radio], .g2Tile[role=radio], .gChip[role=radio]'));
    if (!list.length) return;
    const groups = new Map();
    for (const c of list) {
      const p = c.parentElement;
      if (!groups.has(p)) groups.set(p, []);
      groups.get(p).push(c);
    }
    for (const [parent, items] of groups) {
      if (!parent.getAttribute('role')) {
        parent.setAttribute('role', 'radiogroup');
        if (labelId) parent.setAttribute('aria-labelledby', labelId);
      }
      let at = items.findIndex((c) => c.getAttribute('aria-checked') === 'true');
      if (at < 0) at = 0;
      items.forEach((c, i) => { c.tabIndex = i === at ? 0 : -1; });
    }
  }

  function onClick(e) {
    const t = e.target && e.target.closest ? e.target.closest('[data-g]') : null;
    if (!t || !G.el || !G.el.contains(t)) return;
    const kind = t.getAttribute('data-g');
    if (kind === 'pick' || kind === 'chip') {
      const rec = VALS[Number(t.getAttribute('data-g-i'))];
      if (!rec) return;
      if (rec.multi) {
        const on = t.getAttribute('aria-pressed') !== 'true';
        t.setAttribute('aria-pressed', on ? 'true' : 'false');
        if (rec.act) rec.act(ctx(), on);
        renderFoot();
        return;
      }
      if (rec.act) { rec.act(ctx()); renderFoot(); }
      else if (rec.to) G.goto(rec.to);
      else if (rec.value !== undefined) G.answer(rec.value);
      else console.warn('GUIDED · a control was pressed that carries no act, no ' +
        'door and no value; nothing was committed. Give it one of the three.');
      return;
    }
    if (kind === 'act') { runAct(actInFoot(current())); return; }
    if (kind === 'back') { G.back(); return; }
    if (kind === 'skip') { G.answer(null); return; }
    if (kind === 'exit') { G.exit(); return; }
    if (kind === 'again') { askStartAgain(); return; }
    if (kind === 'again-do') { G.startAgain(); return; }
    if (kind === 'sheet-close') { closeSheet(); return; }
    if (kind === 'swatch-open') {
      swatchOpenFor = t.getAttribute('data-g-id');
      G.refresh();
      setTimeout(() => document.getElementById('swName')?.focus(), 0);
      return;
    }
    if (kind === 'swatch-close') { swatchOpenFor = null; G.refresh(); return; }
    if (kind === 'swatch-send') {
      const ids = String(t.getAttribute('data-g-id') || '').split(/\s+/).filter(Boolean);
      if (typeof sendSwatch !== 'function' || !ids.length) return;
      const has = (id) => (P.S && P.S.swatchDone ? !!P.S.swatchDone[id] : false);
      const before = ids.every(has);
      for (const id of ids) if (!has(id)) sendSwatch(id);
      const done = ids.every(has);
      if (done && !before) {
        swatchOpenFor = null;
        G.refresh();
        const note = G.el && G.el.querySelector('[data-pt=swatch-recorded]');
        if (note) { note.focus({ preventScroll: true }); say(note.textContent); }
      }
      return;
    }
  }

  function spendStaleNote() {
    const st = P.S;
    if (!st || !st.restartNote) return false;
    const code = st.cloth && st.cloth.c ? String(st.cloth.c) : '';
    if (code && String(st.restartNote).indexOf(code) >= 0) return true;
    st.restartNote = '';
    st.noteFor = null;
    return false;
  }

  const REENTRY = 'gReentry';

  function walked() {
    return !!(G.state && Object.keys(G.state).length)
      || (Array.isArray(G.looks) && G.looks.length > 0);
  }

  function somethingSettled() {
    if (trail.length) return true;
    if (Array.isArray(G.looks) && G.looks.length) return true;
    return order().some((id) => G.state[id] !== undefined);
  }

  function commissionPhrase() {
    const st = P.S;
    const g = st && st.garment ? st.garment[1] : '';
    if (!g) return '';
    const an = typeof anWord === 'function' ? anWord(g)
      : (/^[aeiou]/i.test(g) ? 'an' : 'a');
    const cl = st.cloth;
    const cat = clothWords(cl);                 
    if (!cl || !cat || !cl.c) return an + ' ' + g.toLowerCase();
    return an + ' ' + g.toLowerCase() + ' in ' + String(cat).toLowerCase() + ' ' + cl.c;
  }

  function dropReentry() {
    const el = document.getElementById(REENTRY);
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function leave() {
    G.state.__at = curId;
    save();
    const noteStands = spendStaleNote();
    try { if (typeof paint === 'function') paint(); } catch (err) {   }
    unmount();
    document.body.classList.remove('guided');
    offerReentry(noteStands);
  }

  function askStartAgain() {
    openSheet('again',
      '<p class="g2Advice">' +
      esc('Nothing has been sent to Paul, so there is nothing to withdraw. Starting again ' +
          'puts the commission back to the house’s own defaults and opens the door on a ' +
          'new one. The looks you have saved are kept.') + '</p>' +
      '<div class="g2ActRow"><button type="button" class="g2Primary" data-g="again-do">' +
      'Start again</button></div>',
      { heading: 'Start again?', close: 'Keep this commission', overStage: true });
  }

  function offerReentry(noteStands) {
    dropReentry();
    if (!walked()) return;
    const conf = document.getElementById('conf');
    if (!conf) return;
    const phrase = noteStands ? '' : commissionPhrase();
    const box = document.createElement('div');
    box.id = REENTRY;
    box.innerHTML =
      (phrase ? '<p>' + esc('The guided commission is kept — ' + phrase + '.') + '</p>' : '') +
      '<button type="button"><span aria-hidden="true">←</span> ' +
      'Back to the guided commission</button>';
    box.querySelector('button').addEventListener('click', () => { G.start({ resume: true }); });
    conf.insertBefore(box, conf.firstChild);
  }

  const G = {
    register(step) {
      if (!step || !step.id) { console.error('GUIDED · a step needs an id.'); return; }
      if (STEPS.has(step.id)) console.warn('GUIDED · the step "' + step.id + '" registered twice; the later one stands.');
      STEPS.set(step.id, step);
      if (FLOW.indexOf(step.id) < 0 && EXTRA.indexOf(step.id) < 0) EXTRA.push(step.id);
      queueResume();                     
      if (mounted && !curId) {
        pending = false;
        const walk = order();
        curId = walk.find((id) => !CONDITIONAL.has(id)) ?? walk[0] ?? null;
        render();
      }
    },

    start(opts) {
      dropReentry();                  
      dropPickUp();                   
      if (mounted) { render(); return; }
      document.body.classList.add('guided');
      mount();
      const walk = order();
      curId = walk.find((id) => !CONDITIONAL.has(id)) ?? walk[0] ?? null;
      trail.length = 0;
      if (!(opts && opts.resume)) {
        const rack = G.looks;
        G.state = {};
        G.looks = rack;
        pickUpAt = null;
      }
      const at = opts && opts.resume ? G.state.__at : null;
      if (at && at !== 'letter' && STEPS.has(at) && walk.indexOf(at) >= 0) {
        trail.push(...walk.slice(0, walk.indexOf(at))
          .filter((id) => !CONDITIONAL.has(id) || G.state[id] !== undefined));
        curId = at;
      }
      if (!curId) {
        pending = true;
        setTimeout(() => {
          if (!pending || curId) return;
          console.warn('GUIDED · no steps registered; the wizard stands aside and the workshop takes over.');
          G.exit();
        }, 0);
        render();
        return;
      }
      depth = 0;
      pushPlace(curId);
      render();
    },

    exit() {
      pending = false;
      if (!mounted) { document.body.classList.remove('guided'); dropReentry(); return; }
      leave();
      document.getElementById('conf')?.focus?.({ preventScroll: true });
    },

    askStartAgain() { askStartAgain(); },
    settled() { return somethingSettled(); },

    holdFold() { holdFoldSoon(); },

    formLine,
    say,

    startAgain() {
      pending = false;
      closeSheet(true);
      if (mounted) { unmount(); document.body.classList.remove('guided'); }
      G.state = {};
      resumeAt = null; pickUpAt = null; leftAt = 0; depth = 0;
      dropReentry(); dropPickUp();
      for (const kind of ['local', 'session']) {
        const s = store(kind);
        if (!s) continue;
        try { s.removeItem(KEY); } catch (e) {   }
      }
      try {
        if (typeof commissionAnother === 'function') { commissionAnother(); return; }
        if (typeof paint === 'function') paint();
      } catch (err) {   }
    },

    answer(value) {
      const step = current();
      if (!step) return;
      G.state[step.id] = value;
      save();
      const clothBefore = P.S && P.S.cloth ? P.S.cloth.id : null;
      let next;
      try {
        if (typeof step.commit === 'function') next = step.commit(value, ctx());
      } catch (err) {
        console.error('GUIDED · the step "' + step.id + '" could not commit its answer.', err);
      }
      markCloth(clothBefore, value);
      if (next && typeof next.then === 'function') { next.then((id) => advance(step.id, id)); return; }
      advance(step.id, next);
    },

    back() {
      if (!trail.length) return;
      if (depth > 0) { history.back(); return; }
      curId = trail.pop();
      swatchOpenFor = null;
      closeSheet(true);
      render({ back: true });
    },

    goto(id, o) {
      if (!STEPS.has(id)) { console.warn('GUIDED · nothing registered under "' + id + '".'); return; }
      closeSheet(true);
      if (o && o.open) G.state.__open = String(o.open);
      if (curId && curId !== id) trail.push(curId);
      curId = id;
      swatchOpenFor = null;
      pushPlace(curId);
      render();
    },

    saveLook(name) {
      const st = P.S;
      if (!st) return null;
      const snap = {
        id: 'look-' + Date.now().toString(36) + '-' + (G.looks.length + 1),
        name: signed(name, 'a saved look') || defaultLookName(st),
        garment: st.garment ? st.garment[0] : null,
        clothId: st.cloth ? st.cloth.id : null,
        lining: st.lining ? st.lining.id : null,
        buttons: st.buttons ?? null,
        tier: st.tier ?? null,
        at: new Date().toISOString(),
      };
      const same = G.looks.find((l) => l.garment === snap.garment && l.clothId === snap.clothId
        && l.lining === snap.lining && l.buttons === snap.buttons && l.tier === snap.tier);
      if (same) return same;
      G.looks.push(snap);
      save();
      renderFoot();
      return snap;
    },

    forgetLook(id) {
      if (!id || !Array.isArray(G.looks)) return false;
      const i = G.looks.findIndex((l) => l && l.id === id);
      if (i < 0) return false;
      G.looks.splice(i, 1);
      save();
      renderFoot();
      return true;
    },

    looks: [],
    state: {},
    el: null,

    clothWords,
    clothProvenance,

    refresh() { render(); },
    refreshChrome() { renderFoot(); },

    openEntry(open) {
      if (byGesture || !mounted || !curId) return;
      try {
        history.pushState({ ptPhase: phaseNow(), [HKEY]: { at: curId, n: ++depth, open: String(open) } }, '');
      } catch (e) { depth = Math.max(0, depth - 1); }
    },
    openSwap(open) {
      if (byGesture || !mounted || !curId) return;
      try {
        history.replaceState({ ptPhase: phaseNow(), [HKEY]: { at: curId, n: depth, open: String(open) } }, '');
      } catch (e) {   }
    },
    openSpend() {
      if (byGesture || !mounted || depth <= 0) return;
      try { history.back(); } catch (e) {   }
    },
  };

  Object.defineProperties(G, {
    current: { enumerable: true, get: () => current() },
    steps: { enumerable: true, get: () => order().map((id) => STEPS.get(id)) },
    history: {
      enumerable: true,
      get: () => trail,
      set: (v) => { trail.length = 0; if (Array.isArray(v)) trail.push(...v); },
    },
  });

  function defaultLookName(st) {
    const cl = st.cloth;
    const marque = (cl && typeof marqueOf === 'function') ? marqueOf(cl) : '';
    if (marque) return marque;
    const garment = st.garment ? st.garment[1] : 'The commission';
    const cloth = (cl && typeof baseName === 'function') ? baseName(cl) : (cl ? cl.name : '');
    return cloth ? garment + ' in ' + cloth : garment;
  }

  function advance(fromId, nextId) {
    let id = nextId;
    if (id && !STEPS.has(id)) {
      console.warn('GUIDED · "' + fromId + '" asked for "' + id + '", which is not registered; ' +
        'the default flow stands.');
      id = null;
    }
    if (!id) id = defaultNext(fromId);
    if (!id) { render(); return; }         
    if (id === curId) { render(); return; }
    if (curId) trail.push(curId);
    curId = id;
    swatchOpenFor = null;
    closeSheet(true);
    pushPlace(curId);                   
    render();
  }

  load();
  window.G = G;
})();
