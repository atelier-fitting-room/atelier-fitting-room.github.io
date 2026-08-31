(function () {
  'use strict';

  const REACH = {
    S: () => S,
    D: () => D,
    GARMENTS: () => GARMENTS,
    MAKES: () => MAKES,
    BUTTONS: () => BUTTONS,
    COLLECTION: () => COLLECTION,
    RECORD: () => RECORD,
    NO_MODEL_LINE: () => NO_MODEL_LINE,
    NO_FIGURE_SHORT: () => NO_FIGURE_SHORT,
    esc: () => esc,
    byId: () => byId,
    hasModel: () => hasModel,
    unmeasured: () => unmeasured,
    premiumBook: () => premiumBook,
    basisKind: () => basisKind,
    cutCtx: () => cutCtx,
    eveningCloth: () => eveningCloth,
    VIZ_ORIGIN: () => VIZ_ORIGIN,
    plainName: () => plainName,
    baseName: () => baseName,
    categoryName: () => categoryName,
    marqueOf: () => marqueOf,
    gsmText: () => gsmText,
    bookName: () => bookName,
    imgOf: () => imgOf,
    thumbOf: () => thumbOf,
    detailOf: () => detailOf,
    unitFor: () => unitFor,
    perSuitOn: () => perSuitOn,
    fig: () => fig,
    paint: () => paint,
    sendView: () => sendView,
    setButtons: () => setButtons,
    setGarment: () => setGarment,
    takeTheGarment: () => takeTheGarment,
    pickCloth: () => pickCloth,
    pickLining: () => pickLining,
    openCloseup: () => openCloseup,
    preloadCloseup: () => preloadCloseup,
    shareURL: () => shareURL,
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
  const eng = () => window.G || null;
  function layerEl() { return (eng() && eng().el) || document.getElementById('guidedLayer'); }

  const STAGE_CLASS = 'gsee-stage';
  let fitRO = null, liveMO = null, stepMO = null, bodyMO = null, watching = false;
  let docked = false;
  let stageChrome = 8;

  const stageOn = () => document.body.classList.contains(STAGE_CLASS);
  function windowEl() {
    const layer = layerEl();
    return layer ? layer.querySelector('.gsee-window') : null;
  }

  function shiftOf(el, stop) {
    let dx = 0, dy = 0;
    if (typeof DOMMatrixReadOnly !== 'function') return { dx, dy };
    for (let n = el; n && n !== stop && n.nodeType === 1; n = n.parentElement) {
      const tf = getComputedStyle(n).transform;
      if (!tf || tf === 'none') continue;
      try { const m = new DOMMatrixReadOnly(tf); dx += m.m41 || 0; dy += m.m42 || 0; }
      catch (e) {   }
    }
    return { dx, dy };
  }

  function setVar(name, px) {
    const r = document.documentElement.style;
    const v = px + 'px';
    if (r.getPropertyValue(name) !== v) r.setProperty(name, v);
  }

  const NO_CLAMP = 9999;
  let stageBase = { key: '', h: 0 };
  let pictureEnd = 0;
  function baseStage(win) {
    const step = (eng() && eng().current && eng().current.id) || '';
    const key = step + '|' + window.innerWidth + 'x' + window.innerHeight;
    if (stageBase.key === key && stageBase.h > 0) return stageBase.h;
    const r = document.documentElement.style;
    const held = r.getPropertyValue('--gsee-stagemax');
    r.setProperty('--gsee-stagemax', NO_CLAMP + 'px');
    const h = Math.round(win.getBoundingClientRect().height);    
    if (held) r.setProperty('--gsee-stagemax', held); else r.removeProperty('--gsee-stagemax');
    stageBase = { key, h };
    return h;
  }
  function reserveFoot(layer) {
    const root = layer || layerEl();
    const foot = document.getElementById('guidedFoot');
    const fh = foot && !foot.hidden ? Math.ceil(foot.getBoundingClientRect().height) : 0;
    setVar('--gsee-foot', fh);
    const sc = document.getElementById('guidedScroll');
    const win = windowEl();
    if (!root || !sc || !win) { setVar('--gsee-stagemax', NO_CLAMP); return; }
    const base = baseStage(win);
    if (!(base > 0)) { setVar('--gsee-stagemax', NO_CLAMP); return; }
    const wr = win.getBoundingClientRect();
    const said = root.querySelector('.g2Settled');
    const band = said ? Math.ceil(said.getBoundingClientRect().height) : 0;
    const F = Math.round(sc.clientHeight - band);
    const scTop = sc.getBoundingClientRect().top;
    const sTop = sc.scrollTop;
    const y = (v) => v - scTop + sTop;                
    const winFoot = band + Math.round(wr.height);     
    const GUARD = 6;

    let head = 0;
    for (const sel of ['.gsee-q', '.gsee-cname', '.gsee-cfacts', '.gsee-hint',
                       '.gsee-pairnames']) {
      const el = root.querySelector(sel);
      if (!el || !String(el.textContent || '').trim()) continue;
      const r = el.getBoundingClientRect();
      if (r.height > 0 && y(r.top) >= winFoot - 1) head = Math.max(head, Math.ceil(y(r.bottom) - winFoot));
    }
    let H = Math.min(base, head > 0 ? F - head - GUARD : base);

    const lines = [];
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      if (!String(n.textContent || '').trim()) continue;
      const p = n.parentElement;
      if (!p || p.closest('.gSay') || p.closest('.g2SrOnly') || p.closest('.gFoot')) continue;
      const cs = getComputedStyle(p);
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      const rg = document.createRange();
      rg.selectNodeContents(n);
      for (const b of rg.getClientRects()) {
        if (b.height <= 0 || b.width <= 0) continue;
        if (y(b.top) < winFoot - 1) continue;
        if (b.left > wr.right - 1 || b.right < wr.left + 1) continue;
        const lh = parseFloat(cs.lineHeight);
        const trim = Number.isFinite(lh) && lh > 0 && b.height > lh ? (b.height - lh) / 2 : 0;
        lines.push([Math.floor(y(b.top + trim) - winFoot), Math.ceil(y(b.bottom - trim) - winFoot)]);
      }
    }
    lines.sort((a, b) => a[0] - b[0]);
    for (let pass = 0; pass < 8; pass++) {
      const d = F - H;                                    
      const cut = lines.find(([t, b]) => t < d && d < b);
      if (!cut) break;
      H = F - cut[1] - GUARD;
      if (H <= VIEWER_TRUTH_MIN) break;
    }
    setVar('--gsee-stagemax', Math.max(VIEWER_TRUTH_MIN, Math.min(base, Math.round(H))));
  }

  function fit() {
    if (!stageOn()) return;
    const layer = layerEl();
    const win = windowEl();
    if (!win) {
      clearVars();
      speak(layer);
      return;
    }
    reserveFoot(layer);
    const h = window.innerHeight || 0;
    const w = window.innerWidth || 0;
    const { dx, dy } = shiftOf(win, layer);
    const box = win.getBoundingClientRect();
    let top = Math.round(box.top - dy);
    let bot = Math.round(h - (box.bottom - dy));
    let left = Math.round(box.left - dx);
    let right = Math.round(w - (box.right - dx));
    if (!(top >= 0)) top = 0;
    if (!(bot >= 0)) bot = 0;
    if (!(left >= 0)) left = 0;
    if (!(right >= 0)) right = 0;
    const area = document.getElementById('guidedScroll');
    if (area) {
      const a = area.getBoundingClientRect();
      top = Math.max(top, Math.round(a.top));
      bot = Math.max(bot, Math.round(h - a.bottom));
    }
    if (h && h - top - bot < 200) { top = 0; bot = 0; }
    let dock = 0;
    if (compact() && !(top === 0 && bot === 0) && !portraitWindow()) {
      const hole = h - top - bot;
      if (!docked) {
        const c = Math.round(hole - stageHeight());
        if (stageHeight() > 0 && c >= 0 && c <= 48) stageChrome = c;
      }
      const dh = Math.min(Math.max(VIEWER_TRUTH_MIN, Math.round(h * 0.30)) + stageChrome, hole);
      const card = layer && layer.querySelector('.gsee-card');
      const c = card && card.getBoundingClientRect();
      if (c && c.width > 0 && Math.round(c.top - dy) < top + dh + dockBand(layer)) {
        dock = dh;
        bot = Math.max(0, h - (top + dh));
      }
    }
    docked = dock > 0;
    setVar('--gsee-dock', dock);
    setVar('--gsee-dockband', dock ? dockBand(layer) : 0);
    if (layer) layer.classList.toggle('gsee-docked', docked);
    setVar('--gsee-top', top);
    setVar('--gsee-bot', bot);
    setVar('--gsee-left', left);
    setVar('--gsee-right', right);
    const said = layer && layer.querySelector('.g2Settled');
    const bandH = said ? Math.round(said.getBoundingClientRect().height) : 0;
    setVar('--gsee-qh', bandH);
    if (layer) {
      const scr0 = document.getElementById('guidedScroll');
      if (scr0 && win) {
        if (scr0.scrollTop <= 0) {
          pictureEnd = Math.round(win.getBoundingClientRect().bottom
            - scr0.getBoundingClientRect().top);
        }
        layer.classList.toggle('gsee-under',
          pictureEnd > 0 && scr0.scrollTop >= pictureEnd - bandH);
      } else {
        layer.classList.remove('gsee-under');
      }
      plinthFade(layer);                     
    }
    speak(layer);
    const G0 = window.G;
    if (G0 && typeof G0.holdFold === 'function') G0.holdFold();
  }
  function dockBand(layer) {
    const band = layer && layer.querySelector('.gsee-dockline');
    if (!band || !(band.textContent || '').trim()) return 0;
    const r = band.getBoundingClientRect();
    return r.height > 0 ? Math.ceil(r.height) : 0;
  }
  function clothAcross(layer, ref, y0, y1) {
    let from = null, to = null;
    if (!layer || !ref) return null;
    const f = ref.getBoundingClientRect();
    if (!(f.width > 0) || !(y1 > y0)) return null;
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
    return to === null ? null : { to, from };
  }
  const fadeWas = {};
  function setFadeWindow(layer, name, win) {
    const key = win ? win.to + ':' + win.from : '';
    if (fadeWas[name] === key) return;                     
    fadeWas[name] = key;
    if (!layer) return;
    if (!win) {
      layer.style.removeProperty('--' + name + '-to');
      layer.style.removeProperty('--' + name + '-from');
    } else {
      layer.style.setProperty('--' + name + '-to', win.to + 'px');
      layer.style.setProperty('--' + name + '-from', win.from + 'px');
    }
  }
  const fadePx = {};
  let fadeKey = '';
  function fadeHeight(el, which) {
    const key = (layerEl() ? '1' : '0') + ':' + innerWidth + 'x' + innerHeight;
    if (key !== fadeKey) { fadeKey = key; fadePx.foot = fadePx.band = undefined; }
    const slot = which === '::after' ? 'band' : 'foot';
    if (fadePx[slot] === undefined) {
      fadePx[slot] = el ? (parseFloat(getComputedStyle(el, which).height) || 0) : 0;
    }
    return fadePx[slot];
  }
  function plinthFade(layer) {
    const scr = document.getElementById('guidedScroll');
    const foot = layer && layer.querySelector('.gFoot');
    let win = null;
    if (scr && foot) {
      const fade = fadeHeight(foot, '::before');
      const s = scr.getBoundingClientRect();
      if (fade > 0) win = clothAcross(layer, foot, s.bottom - fade, s.bottom);
    }
    setFadeWindow(layer, 'g2-fade', win);
    const band = layer && layer.querySelector('.gsee-dockline');
    let dwin = null;
    if (band && layer.classList.contains('gsee-docked') && (band.textContent || '').trim()) {
      const fade = fadeHeight(band, '::after');
      const b = band.getBoundingClientRect();
      if (fade > 0 && b.height > 0) dwin = clothAcross(layer, band, b.bottom, b.bottom + fade);
    }
    setFadeWindow(layer, 'g2-dockfade', dwin);
  }
  let drawnFor = null;               
  function redoor() {
    const d = drawnFor;
    if (!d || !d.root || !d.root.isConnected) return false;
    const st = state();
    const now = st.cloth ? st.cloth.id : null;
    if (now === d.clothId) return false;
    const caret = document.activeElement;
    const onDoor = !!(caret && caret.closest && caret.closest('.gsee-clothdoor'));
    const scr = document.getElementById('guidedScroll');
    const at = scr ? scr.scrollTop : 0;
    draw(d.root, d.ctx, d.noModel);
    const G0 = eng();
    if (G0 && typeof G0.refreshChrome === 'function') G0.refreshChrome();
    if (scr && scr.isConnected && scr.scrollTop !== at) scr.scrollTop = at;
    if (onDoor) {
      const back = d.root.querySelector('.gsee-clothdoor');
      if (back && back.focus) back.focus({ preventScroll: true });
    }
    return true;
  }
  function speak(layer) {
    if (redoor()) return;
    dressViewer();                   
    placeDoor(layer);                
    reword(layer, '.gsee-hint', hintWords());
    reword(layer, '.gsee-pairnames', pairWords());    
    reword(layer, '.gsee-record', recordWords());
    reword(layer, '.gsee-form', formWords());
    reword(layer, '.gsee-light', lightWords());
    reword(layer, '.gsee-cname', nameWords());
    reword(layer, '.gsee-cfacts', factWords());
    reword(layer, '.gsee-cdoorfact', doorFactWords());
    reword(layer, '.gsee-dockline', dockWords());
    tagPair();                       
  }

  function shoeTone() {
    try { return S.shoes || 'black'; } catch (e) { return 'black'; }
  }
  function toneWord(k) { return k.charAt(0).toUpperCase() + k.slice(1); }
  function shoeWord() { return toneWord(shoeTone()); }

  function tagWords(cl) {
    if (!cl) return '';
    const name = clothName(cl);
    const code = String(cl.c || '');
    if (!name) return code;
    if (!code || name.indexOf(code) < 0) return code ? name + ' · ' + code : name;
    return name.replace(code, '· ' + code);
  }
  function tagPair() {
    const st = state();
    const mine = st ? st.cloth : null;
    const other = compareCloth();
    if (!other || !mine || dressed !== 'composed') return;
    const f = vizFrame();
    const w = f && f.contentWindow;
    if (!w) return;
    try {
      w.postMessage({ ptSet: 1, code: tagWords(mine), comparecode: tagWords(other) },
        P('VIZ_ORIGIN') || '*');
    } catch (e) {   }
  }
  function reword(layer, sel, words) {
    const el = layer && layer.querySelector(sel);
    if (el && el.textContent !== words) el.textContent = words;
  }
  function clearVars() {
    const r = document.documentElement.style;
    for (const n of ['--gsee-top', '--gsee-bot', '--gsee-left', '--gsee-right', '--gsee-qh',
                     '--gsee-dock', '--gsee-dockband']) {
      r.removeProperty(n);
    }
    const l = layerEl();
    if (l) {
      for (const n of ['--g2-fade-to', '--g2-fade-from',
                       '--g2-dockfade-to', '--g2-dockfade-from']) l.style.removeProperty(n);
    }
    fadeWas['g2-fade'] = fadeWas['g2-dockfade'] = undefined;
  }

  let fitPending = false;
  function fitSoon() {
    if (fitPending) return;
    fitPending = true;
    requestAnimationFrame(() => { fitPending = false; fit(); });
  }

  function startWatching() {
    if (watching) return;
    watching = true;
    const pt = P('paint');
    if (pt) { try { pt(); } catch (err) { console.error('GUIDED · the page could not repaint for the stage.', err); } }
    window.addEventListener('resize', fitSoon);
    const scroll = document.getElementById('guidedScroll');
    if (scroll) {
      scroll.addEventListener('scroll', fitSoon, { passive: true });
      if (typeof MutationObserver === 'function') {
        stepMO = new MutationObserver(fitSoon);
        stepMO.observe(scroll, { childList: true, subtree: true });
      }
      if (typeof ResizeObserver === 'function') {
        fitRO = new ResizeObserver(fitSoon);
        fitRO.observe(scroll);
      }
    }
    fitSoon();
  }
  function stopWatching() {
    if (!watching) return;
    watching = false;
    stopViz();
    if (toneHome) { clearTimeout(toneHome); toneHome = 0; }
    undressViewer();
    docked = false;
    compareOff();
    plateDoor = false;
    const l0 = layerEl();
    if (l0) l0.classList.remove('gsee-docked');
    window.removeEventListener('resize', fitSoon);
    const scroll = document.getElementById('guidedScroll');
    if (scroll) scroll.removeEventListener('scroll', fitSoon);
    if (stepMO) { stepMO.disconnect(); stepMO = null; }
    if (fitRO) { fitRO.disconnect(); fitRO = null; }
    clearVars();
    const pt = P('paint');
    if (pt) { try { pt(); } catch (err) {   } }
  }
  function syncStage() {
    if (stageOn()) { startWatching(); fitSoon(); }
    else stopWatching();
  }
  let earArmed = false;
  function armEar() {
    if (earArmed) return;
    earArmed = true;
    window.addEventListener('message', (ev) => {
      const d = ev && ev.data;
      if (d && d.ptTouched === 1) dismissHint();
    });
  }
  function armLifecycle() {
    armEar();
    if (bodyMO || typeof MutationObserver !== 'function') return;
    bodyMO = new MutationObserver(syncStage);
    bodyMO.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    syncStage();
  }

  function vizLive() {
    const v = document.getElementById('viz');
    return !!v && v.classList.contains('live');
  }
  function vizSaidSomething() {
    const f = document.getElementById('vizFail');
    return !!f && !!String(f.textContent || '').trim();
  }
  function watchViz(onChange) {
    stopViz();
    const v = document.getElementById('viz');
    if (!v) return;
    liveMO = new MutationObserver(() => onChange());
    liveMO.observe(v, { attributes: true, attributeFilter: ['class'], subtree: false });
    const f = document.getElementById('vizFail');
    if (f) liveMO.observe(f, { childList: true, characterData: true, subtree: true });
  }
  function stopViz() { if (liveMO) { liveMO.disconnect(); liveMO = null; } }

  const VIEWER_BAND_MIN = 320;                
  const VIEWER_TRUTH_MIN = 250;               
  const VIEWER_DRESS = [
    'html.gsee-composed #capband{ display:none !important; }',
    'html.gsee-composed #zin{ display:none !important; }',
    'html.gsee-composed #zout{ display:none !important; }',
    'html.gsee-composed #zreset{ display:none !important; }',
    'html.gsee-composed #topband{ grid-row:3; justify-content:center;' +
      ' background:var(--room); border-bottom:0; border-top:0; gap:0;' +
      ' padding:6px 0 calc(10px + var(--reserve-bottom)); }',
    'html.gsee-composed #zoomui{ display:none !important; }',
    'html.gsee-composed #viewui{ gap:var(--s4); }',
    'html.gsee-composed #viewui button{ border:0; border-left:2px solid transparent;' +
      ' border-radius:0; background:none;' +
      ' padding:0 0 0 10px; min-width:0; height:32px; }',
    'html.gsee-composed #viewui button[aria-checked="true"]{' +
      ' border-left-color:currentColor; }',
    'html.gsee-composed #viewui button:active{ background:none; color:var(--ink); }',
  ].join('\n');
  let dressed = '';                           
  let dressArmed = null;                      
  let moodMO = null;                          

  function vizFrame() { return document.querySelector('#viz iframe'); }
  function viewerDoc() {
    const f = vizFrame();
    try { return (f && f.contentDocument) || null; } catch (e) { return null; }
  }
  function portraitWindow() {
    const w = windowEl();
    return !!(w && w.closest && w.closest('.gfin-portrait'));
  }
  let told = {};
  function vizTell(msg) {
    let move = false;
    for (const k in msg) if (told[k] !== msg[k]) move = true;
    if (!move) return;
    const f = vizFrame();
    const w = f && f.contentWindow;
    if (!w) return;
    try {
      w.postMessage(Object.assign({ ptSet: 1 }, msg), P('VIZ_ORIGIN') || '*');
      Object.assign(told, msg);
    } catch (e) {   }
  }

  function eveningWanted() {
    if (dressed !== 'composed') return false;           
    const st = state();
    if (st.garment && st.garment[0] === 'dinner') return true;
    const ev = P('eveningCloth');
    try { return !!(ev && st.cloth && ev(st.cloth)); } catch (e) { return false; }
  }
  const compact = () => { try { return matchMedia('(max-width:599px)').matches; } catch (e) { return false; } };
  const spread = () => { try { return matchMedia('(min-width:1024px)').matches; } catch (e) { return false; } };

  function tellViewer() {
    if (!dressed) return;
    const d0 = viewerDoc();
    const r0 = d0 && d0.documentElement;
    if (r0) {
      told.ground = r0.dataset.ground || 'room';
      told.scene = r0.dataset.mood || 'studio';
    }
    vizTell({
      ground: 'photo',
      frame: 'close',
      wheelzoom: dressed === 'composed' && spread() ? 1 : 0,
      scene: eveningWanted() ? 'evening' : 'studio',
    });
  }

  function placeDoor(layer) {
    const root = layer || layerEl();
    if (!root) return;
    const doors = root.querySelectorAll('.gsee-clothdoor');
    if (!doors.length) return;
    for (const door of doors) {
      if (door.classList.contains('gsee-clothdoor--bay')) continue;
      const home = root.querySelector('.gsee-doorslot');
      if (!home || door.parentElement === home) continue;
      home.appendChild(door);
    }
  }

  function dressViewer() {
    const want = !stageOn() || !windowEl() ? '' : (portraitWindow() ? 'portrait' : 'composed');
    const d = viewerDoc();
    const root = d && d.documentElement;
    const ready = !!(root && d.getElementById('capband'));
    const f = vizFrame();
    if (f && !ready && dressArmed !== f) {
      dressArmed = f;
      f.addEventListener('load', () => { dressArmed = null; dressViewer(); }, { once: true });
    }
    if (!ready) { dressed = ''; return; }
    if (want === 'composed' && !d.getElementById('gseeDress')) {
      const st = d.createElement('style');
      st.id = 'gseeDress';
      st.textContent = VIEWER_DRESS;
      (d.head || root).appendChild(st);
    }
    root.classList.toggle('thumb', want === 'portrait');
    root.classList.toggle('gsee-composed', want === 'composed');
    if (!moodMO && typeof MutationObserver === 'function') {
      moodMO = new MutationObserver(() => tellViewer());
      moodMO.observe(root, { attributes: true, attributeFilter: ['data-mood', 'data-ground'] });
    }
    const cv = d.querySelector('#stage canvas');
    if (cv) cv.setAttribute('tabindex', want === 'portrait' ? '-1' : '0');
    if (dressed === want) { tellViewer(); tagPair(); return; }
    dressed = want;
    tellViewer();                    
    tagPair();                       
    const view = P('sendView');
    const silk = (() => { try { return !!state().viewLining; } catch (e) { return false; } })();
    if (view && want && !silk) view('full');
  }
  function undressViewer() {
    const d = viewerDoc();
    const root = d && d.documentElement;
    if (moodMO) { moodMO.disconnect(); moodMO = null; }
    if (dressed) vizTell({ ground: 'room', frame: null, wheelzoom: 0, scene: 'studio' });
    told = {};
    if (root) { root.classList.remove('thumb'); root.classList.remove('gsee-composed'); }
    const cv = d && d.querySelector('#stage canvas');
    if (cv) cv.setAttribute('tabindex', '0');
    const st = d && d.getElementById('gseeDress');
    if (st && st.parentNode) st.parentNode.removeChild(st);
    dressed = '';
    dressArmed = null;
  }
  const HINT_BASE = 'Drag to turn it, or turn it with the left and right arrow keys.';
  const houseColour = () => {
    const st = P('S');
    const cl = st && st.cloth;
    return window.HOUSE_LINE ? window.HOUSE_LINE.colour(cl)
      : 'This colour has not been measured from the cloth.';
  };
  const TRUTH_FALLBACK_MEASURED = () =>
    'A standard form in your cloth — your garment is cut to your own record. ' + houseColour();
  const TRUTH_FALLBACK_VISITOR = () =>
    'A standard form in your cloth. Nothing here is fitted to you until Paul has taken your ' +
    'record. ' + houseColour();
  function stageHeight() {
    const f = document.querySelector('#viz iframe');
    return f ? f.getBoundingClientRect().height : 0;
  }
  function bandShown() {
    if (dressed) return false;                
    return !!windowEl() && !vizSaidSomething() && stageHeight() > VIEWER_BAND_MIN;
  }
  function truthShown() {
    if (dressed) return false;
    return !!windowEl() && !vizSaidSomething() && stageHeight() > VIEWER_TRUTH_MIN;
  }
  const HINT_SEEN = 'pt.gsee.turn';           
  const HINT_TOUCH = 'Turn it with your finger.';
  const HINT_POINT = 'Drag to turn it.';
  const coarse = () => { try { return matchMedia('(pointer:coarse)').matches; } catch (e) { return false; } };
  let hintArmed = null;                       
  function hintLive() {
    if (hintArmed === null) {
      let seen = '1';
      try { seen = sessionStorage.getItem(HINT_SEEN); } catch (e) { seen = null; }
      hintArmed = !seen;
    }
    return hintArmed;
  }
  function dismissHint() {
    if (hintArmed === false) return;
    hintArmed = false;
    try { sessionStorage.setItem(HINT_SEEN, '1'); } catch (e) {   }
    const layer = layerEl();
    if (layer) reword(layer, '.gsee-hint', hintWords());
  }
  const BOOT_LINE = 'Bringing your suit onto the screen — one moment.';
  function hintWords() {
    if (!windowEl()) return '';
    if (dressed === 'portrait') return '';    
    if (vizSaidSomething()) return '';        
    if (dressed === 'composed') return hintLive() ? (coarse() ? HINT_TOUCH : HINT_POINT) : '';
    if (!vizLive()) return BOOT_LINE;         
    if (bandShown()) return '';               
    return HINT_BASE;
  }
  const LIGHT_LINE = 'Shown in evening light. The look cards were photographed in studio light, so they ' +
    'won\u2019t match this stage. Light changes how a cloth looks — a room as much as a screen.';
  function lightWords() {
    return (dressed === 'composed' && eveningWanted()) ? LIGHT_LINE : '';
  }
  function dockWords() {
    if (!docked) return '';
    const layer = layerEl();
    const rec = layer && layer.querySelector('.gsee-record');
    const t = rec && String(rec.textContent || '').trim();
    if (t) {
      const r = rec.getBoundingClientRect();
      const h = window.innerHeight || 0;
      const foot = parseFloat(getComputedStyle(document.documentElement)
        .getPropertyValue('--gsee-top') || '0')
        + parseFloat(getComputedStyle(document.documentElement)
          .getPropertyValue('--gsee-dock') || '0');
      if (r.height > 0 && r.top >= foot && r.bottom <= h) return '';
    }
    return formSaid(notMeasured() ? VISITOR_CLAUSE : FORM_RECORD + '.');
  }
  function truthWords() {
    const f = document.querySelector('#viz iframe');
    try {
      const t = f && f.contentDocument && f.contentDocument.getElementById('truth');
      const said = t && String(t.textContent || '').trim();
      if (said) return said;
    } catch (e) {   }
    return notMeasured() ? TRUTH_FALLBACK_VISITOR() : TRUTH_FALLBACK_MEASURED();
  }
  function formWords() {
    if (!windowEl() || truthShown() || dressed === 'composed') return '';
    if (!bandShown()) return '';
    return truthWords();
  }
  let plateDoor = false;
  function plateDoorShown() { return plateDoor; }
  function nameWords() {
    if (bandShown() || plateDoorShown()) return '';
    const st = state();
    return st.cloth ? clothName(st.cloth) : (st.garment ? st.garment[1] : '');
  }
  function factWords() {
    if (bandShown() || plateDoorShown()) return '';
    return state().cloth ? clothFacts(state().cloth) : '';
  }
  function doorFactsOf(cl) {
    if (!cl) return '';
    const book = P('bookName'), gsm = P('gsmText');
    return [clothName(cl), book ? book(cl) : '', gsm ? gsm(cl) : '']
      .filter(Boolean).join(' · ');
  }
  function doorFactWords() {
    const st = state();
    const cl = st.cloth;
    if (!cl) return '';
    const kindOf = P('basisKind');
    let premium = false;
    try { premium = !!(kindOf && kindOf(cl) === 'premium'); }
    catch (e) { premium = false; }
    return doorFactsOf(cl) + (premium ? ' · a premium book' : '');
  }

  const PAIR_SEEN = new Set();
  let pairAsked = null;
  function pairPainted(cl) {
    if (!cl) return true;
    if (PAIR_SEEN.has(cl.id)) return true;
    if (pairAsked !== cl.id) {
      pairAsked = cl.id;
      const src = detailTrusted(cl) ? detailPath(cl) : squarePath(cl);
      if (!src) { PAIR_SEEN.add(cl.id); return true; }
      const img = new Image();
      img.decoding = 'async';
      const done = () => {
        PAIR_SEEN.add(cl.id);
        const layer = layerEl();
        if (layer) reword(layer, '.gsee-pairnames', pairWords());
      };
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });    
      img.src = src;
    }
    return false;
  }
  function pairWords() {
    const st = state();
    const cl = st.cloth || null;
    const other = compareCloth();
    if (!cl || !other) return '';
    if (!pairPainted(other)) return 'Bringing ' + clothName(other) + ' up beside yours…';
    return clothName(cl) + ' and ' + clothName(other) + ', side by side. ' +
      'Yours is ' + clothName(cl) + '.';
  }

  const TONE_DWELL = 1200;
  function setMake(k) {
    const st = state();
    const list = P('MAKES') || [];
    if (!list.some(([key]) => key === k)) return;
    if (st.tier === k) return;
    st.tier = k;
    const pt = P('paint');
    if (pt) pt();
  }
  let toneHome = 0;
  function paintedStage() {
    const w = windowEl();
    if (!w) return 0;
    const st = document.querySelector('body.gsee-stage .stage');
    const box = st ? st.getBoundingClientRect() : w.getBoundingClientRect();
    const h = window.innerHeight || 0;
    if (!h || !(box.height > 0) || !(box.width > 0)) return 0;
    let top = Math.max(box.top, 0);
    let bot = Math.min(box.bottom, h);
    if (!(bot > top)) return 0;
    if (!docked) {
      const layer = layerEl();
      const card = layer && layer.querySelector('.gsee-card');
      const c = card && card.getBoundingClientRect();
      const across = c && Math.min(c.right, box.right) - Math.max(c.left, box.left) > 1;
      if (c && c.width > 0 && across && c.top < bot && c.bottom > top) bot = Math.max(top, c.top);
    }
    return Math.max(0, Math.round(bot - top));
  }
  function stageInView() {
    return paintedStage() >= VIEWER_TRUTH_MIN;              
  }
  function calmly() {
    try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
  }
  function cameraHome() {
    if (toneHome) { clearTimeout(toneHome); toneHome = 0; }
    const view = P('sendView');
    if (view) view('full');
  }
  function setButtonTone(n) {
    const set = P('setButtons');
    if (!set) return;
    set(n);                             
    const view = P('sendView');
    if (!view) return;
    if (!stageInView() || calmly() || dressed === 'portrait') { cameraHome(); return; }
    view('buttons');
    if (toneHome) clearTimeout(toneHome);
    toneHome = setTimeout(() => { toneHome = 0; if (stageOn()) cameraHome(); }, TONE_DWELL);
  }

  const plainWhy = (s) => String(s == null ? '' : s).replace(/\s*\(DOMAIN\s[^)]*\)/g, '').trim();
  function buttonRows() {
    const list = P('BUTTONS') || [];
    const cx = P('cutCtx');
    const c = cx ? cx() : { dinner: false, blackTie: false };
    return list.map(([name, ok, why]) => ({ name, can: !!ok(c), why: plainWhy(why) }));
  }
  function makeRows() {
    const st = state();
    const list = P('MAKES') || [];
    const per = P('perSuitOn'), f = P('fig');
    const held = per ? per(st.tier) : null;
    return list.map(([k, label, , copy]) => {
      const mine = per ? per(k) : null;
      const known = mine != null && held != null && k !== st.tier;
      let move = '';
      if (known && f) { try { move = f(mine - held, 'change').html || ''; } catch (e) { move = ''; } }
      return { k, label, copy, move, on: st.tier === k };
    });
  }

  function lookOf(x) {
    if (!x) return null;
    if (typeof x === 'object') return x;
    const looks = (eng() && eng().looks) || [];
    return looks.find((l) => l && l.id === x) || null;
  }
  function garmentRow(key) {
    const list = P('GARMENTS') || [];
    return list.find((g) => g[0] === key) || null;
  }
  function makeRow(key) {
    const list = P('MAKES') || [];
    return list.find((m) => m[0] === key) || null;
  }
  function clothOf(l) {
    const byIdFn = P('byId'), d = P('D');
    return (l && l.clothId && byIdFn && d) ? (byIdFn(d.suitings, l.clothId) || null) : null;
  }
  function liningOf(l) {
    const byIdFn = P('byId'), d = P('D');
    return (l && l.lining && byIdFn && d) ? (byIdFn(d.linings, l.lining) || null) : null;
  }

  function lookFigure(look) {
    const l = lookOf(look);
    if (!l) return null;
    const unit = P('unitFor'), f = P('fig'), st = state();
    if (!unit || !f) return null;
    const cloth = clothOf(l);
    if (l.clothId && !cloth) return null;
    const n = unit(l.garment, l.tier, st.party || 1);
    if (n == null) return null;
    try { return f(n, 'line', { cloth }); } catch (err) {
      console.error('GUIDED · a saved look’s figure could not be composed.', err);
      return null;
    }
  }
  function noFigureWords() { return P('NO_FIGURE_SHORT') || ''; }

  function marqueFor(cl, garmentKey) {
    if (!cl) return '';
    const list = P('COLLECTION') || [];
    const e = list.find((x) => x && x.cloth && x.cloth.id === cl.id
      && (x.garment == null || x.garment === garmentKey));
    return (e && e.nm) || '';
  }

  function lookFacts(look) {
    const l = lookOf(look);
    if (!l) return null;
    const g = garmentRow(l.garment), mk = makeRow(l.tier);
    const cloth = clothOf(l), lining = liningOf(l);
    const plain = P('plainName'), gsm = P('gsmText');
    const st = state();
    const missing = [];
    if (l.clothId && !cloth) missing.push('cloth');
    if (l.lining && !lining) missing.push('lining');
    const figure = lookFigure(l);
    return {
      id: l.id,
      name: l.name || '',
      at: l.at || '',
      garment: { key: l.garment, label: g ? g[1] : '' },
      tier: { key: l.tier, label: mk ? mk[1] : '' },
      cloth,
      clothName: cloth && plain ? plain(cloth) : '',
      clothMarque: marqueFor(cloth, l.garment),
      clothWeight: cloth && gsm ? gsm(cloth) : '',
      lining,
      liningName: lining && plain ? plain(lining) : '',
      buttons: l.buttons || '',
      figure,
      figureWhy: figure ? null : (l.clothId && !cloth) ? 'cloth' : 'garment',
      noFigure: noFigureWords(),
      missing,
      inHand: sameAsHand(l, st),
    };
  }

  function snapshotOf(st) {
    return {
      garment: st.garment ? st.garment[0] : null,
      clothId: st.cloth ? st.cloth.id : null,
      lining: st.lining ? st.lining.id : null,
      buttons: st.buttons == null ? null : st.buttons,
      tier: st.tier == null ? null : st.tier,
    };
  }
  function sameAsHand(l, st) {
    const now = snapshotOf(st || state());
    return !!l && l.garment === now.garment && l.clothId === now.clothId
      && l.lining === now.lining && l.buttons === now.buttons && l.tier === now.tier;
  }
  function onTheRack() {
    const looks = (eng() && eng().looks) || [];
    const st = state();
    return looks.find((l) => sameAsHand(l, st)) || null;
  }

  function wearLook(look) {
    const l = lookOf(look);
    const st = state();
    if (!l || !st) return { ok: false, refused: ['no such look'], changed: [] };
    const changed = [], refused = [];
    const cloth = clothOf(l);
    if (l.clothId && !cloth) refused.push('cloth ' + l.clothId + ' is no longer in the book');

    const setG = P('setGarment'), takeG = P('takeTheGarment');
    if (l.garment && st.garment && st.garment[0] !== l.garment && setG) {
      setG(l.garment);
      if (st.garmentOffer && takeG) takeG();
      if (st.garment[0] === l.garment) changed.push('garment'); else refused.push('garment');
    }
    if (l.tier && st.tier !== l.tier && makeRow(l.tier)) { st.tier = l.tier; changed.push('make'); }

    const pickC = P('pickCloth');
    if (cloth && pickC && (!st.cloth || st.cloth.id !== cloth.id)) {
      pickC(cloth.id);
      if (st.cloth && st.cloth.id === cloth.id) changed.push('cloth'); else refused.push('cloth');
    }

    const pickL = P('pickLining');
    const wantLining = liningOf(l);
    const haveLining = st.lining || null;
    if (pickL) {
      if (wantLining && (!haveLining || haveLining.id !== wantLining.id)) {
        if (haveLining) pickL(haveLining.id);           
        pickL(wantLining.id);
        changed.push('lining');
      } else if (!l.lining && haveLining) {
        pickL(haveLining.id);
        changed.push('lining');
      }
    }

    if (l.buttons && st.buttons !== l.buttons) {
      setButtonTone(l.buttons);
      if (st.buttons === l.buttons) changed.push('buttons');
      else refused.push('the ' + String(l.buttons).toLowerCase() +
        ' buttons cannot be cut on this garment');
    }

    const pt = P('paint');
    if (pt) pt();
    return { ok: refused.length === 0, changed, refused, note: String(st.narrowNote || '') };
  }

  let comparePrev = null, compareHeld = false;
  function compareLooks(a, b) {
    const st = state();
    const la = lookOf(a), lb = lookOf(b);
    const other = clothOf(lb || la);
    if (!st || !other) return false;
    if (la && !sameAsHand(la, st)) wearLook(la);
    if (!compareHeld) { comparePrev = st.prevCloth || null; compareHeld = true; }
    st.prevCloth = other;
    st.compareOn = true;
    const pt = P('paint');
    if (pt) pt();
    return !!(st.compareOn && st.prevCloth === other);
  }
  function compareOff() {
    const st = state();
    if (!st) return;
    vizTell({ code: st.cloth ? String(st.cloth.c || '') : '', comparecode: null });
    st.compareOn = false;
    if (compareHeld) { st.prevCloth = comparePrev; compareHeld = false; comparePrev = null; }
    const pt = P('paint');
    if (pt) pt();
  }
  function compareCloth() {
    const st = state();
    return st && st.compareOn && st.prevCloth ? st.prevCloth : null;
  }
  function setBeside(x) {
    const st = state();
    const byIdFn = P('byId'), d = P('D');
    const other = (x && typeof x === 'object') ? x
      : (x && byIdFn && d ? byIdFn(d.suitings, x) : null);
    if (!st || !other) return false;
    if (st.cloth && other.id === st.cloth.id) return false;    
    if (!compareHeld) { comparePrev = st.prevCloth || null; compareHeld = true; }
    st.prevCloth = other;
    st.compareOn = true;
    const pt = P('paint');
    if (pt) pt();
    return !!(st.compareOn && st.prevCloth === other);
  }

  function forgetLook(id) {
    const G = eng();
    if (!G || !Array.isArray(G.looks)) return false;
    if (typeof G.forgetLook === 'function' && G.forgetLook !== forgetLook) return G.forgetLook(id);
    const i = G.looks.findIndex((l) => l && l.id === id);
    if (i < 0) return false;
    G.looks.splice(i, 1);
    const raw = (() => {
      try { return JSON.stringify({ v: 1, state: G.state, looks: G.looks }); } catch (e) { return null; }
    })();
    if (raw) for (const s of [window.localStorage, window.sessionStorage]) {
      try { s.setItem('pt-guided', raw); }
      catch (e) {   }
    }
    return true;
  }

  function lookName() {
    const st = state();
    const cl = st.cloth;
    const garment = st.garment ? st.garment[1] : '';
    const plain = P('plainName');
    const nm = marqueFor(cl, st.garment ? st.garment[0] : null);
    const cloth = cl && plain ? plain(cl) : '';
    if (nm && garment) return nm + ' · ' + garment;
    if (garment && cloth) return garment + ' in ' + cloth;
    return garment || cloth || '';
  }


  const ACTS = new WeakMap();
  function wire(root, ctx) {
    if (root.dataset.gseeWired) return;
    root.dataset.gseeWired = '1';
    root.addEventListener('click', (ev) => {
      const hit = ev.target.closest ? ev.target.closest('[data-gsee]') : null;
      if (!hit || !root.contains(hit)) return;
      const fn = (ACTS.get(root) || {})[hit.dataset.gsee];
      if (!fn) return;
      ev.preventDefault();
      fn(hit, ctx);
    });
  }
  function roving(root) {
    for (const g of root.querySelectorAll('[role=radiogroup]')) {
      const rs = Array.from(g.querySelectorAll('[role=radio]'));
      if (!rs.length) continue;
      let at = rs.findIndex((r) => r.getAttribute('aria-checked') === 'true');
      if (at < 0) at = 0;
      rs.forEach((r, i) => { r.tabIndex = i === at ? 0 : -1; });
    }
  }
  const cssq = (s) => String(s == null ? '' : s).replace(/["\\]/g, '\\$&');

  const DETAIL_UNTEXTURED = ['ga-1-wool-stretch/707005'];
  function detailPath(cl) { const f = P('detailOf'); return f && cl ? f(cl) : ''; }
  function squarePath(cl) { const f = P('imgOf'); return f && cl ? f(cl, 'suiting') : ''; }
  function detailTrusted(cl) {
    const p = detailPath(cl);
    return !!p && !DETAIL_UNTEXTURED.some((bad) => p.indexOf(bad) >= 0);
  }
  function clothPlate(ctx, cl) {
    if (!cl || !ctx || typeof ctx.plate !== 'function') return '';
    const ok = detailTrusted(cl);
    const src = ok ? detailPath(cl) : squarePath(cl);
    if (!src) return '';
    return ctx.plate({
      src,
      full: true,                         
      cls: 'gsee-cloth' + (ok ? '' : ' gsee-cloth--square'),
      alt: '', eager: true,
    });
  }

  function absenceLine() {
    for (const id of ['vizFail', 'makeNoModel', 'thStillNote']) {
      const el = document.getElementById(id);
      const t = el && String(el.textContent || '').trim();
      if (t) return t;
    }
    return P('NO_MODEL_LINE') || '';
  }

  function formSaid(clause) {
    const G0 = window.G;
    return (G0 && typeof G0.formLine === 'function') ? G0.formLine({ clause }) : '';
  }
  const FORM_RECORD = 'Your garment is cut to your own record';
  const VISITOR_CLAUSE = 'Nothing here is fitted to you until Paul has taken your record.';
  function notMeasured() {
    const f = P('unmeasured');
    try { return !!(f && f()); } catch (e) { return false; }
  }
  function recordWords() {
    const composed = !!windowEl() && (dressed === 'composed' || !bandShown());
    if (notMeasured()) return composed ? formSaid(VISITOR_CLAUSE) : '';
    const r = P('RECORD');
    const prov = (r && r.tailor && r.locked) ? r.tailor + ', locked ' + r.locked : '';
    if (composed) {
      return formSaid(prov ? FORM_RECORD + ': ' + prov + '.' : FORM_RECORD + '.');
    }
    return prov ? 'Cut to your record — ' + prov + '.' : '';
  }

  function clothName(cl) {
    const plain = P('plainName');
    return cl ? (plain ? plain(cl) : String(cl.c || '')) : '';
  }
  function clothFacts(cl) {
    if (!cl) return '';
    const cat = P('categoryName'), book = P('bookName'), gsm = P('gsmText');
    const name = clothName(cl);
    const said = (s) => !!s && String(name).indexOf(String(s)) < 0;
    return [cat && said(cat(cl)) ? cat(cl) : '', said(cl.c) ? cl.c : '',
      book ? book(cl) : '', gsm ? gsm(cl) : ''].filter(Boolean).join(' · ');
  }

  function questionWords() {
    const st = state();
    if (compareCloth()) return 'Which of these two?';
    const label = st.garment ? String(st.garment[1] || '') : '';
    if (!label) return 'Your commission';
    return /suit$/i.test(label) ? 'Your suit' : 'Your ' + label.toLowerCase();
  }

  let openId = null;
  let openHeld = false;
  let openArrived = false;
  let openScroll = null;       
  let teachHeld = false;       

  function redrawBuild() {
    const d = drawnFor;
    if (!d || !d.root || !d.root.isConnected) return;
    const has = P('hasModel');
    d.noModel = !!has && !has();
    draw(d.root, d.ctx, d.noModel);
  }
  function focusLine(k) {
    const root = drawnFor && drawnFor.root;
    const line = root && root.querySelector('.gbSet[data-k="' + cssq(k) + '"]');
    if (line && line.focus) line.focus({ preventScroll: true });
  }
  function focusChecked(k) {
    const root = drawnFor && drawnFor.root;
    if (!root) return;
    const panel = root.querySelector('.gbPanel[data-k="' + cssq(k) + '"]');
    if (!panel) return;
    const hit = panel.querySelector('[aria-checked="true"]') || panel.querySelector('button');
    if (hit && hit.focus) hit.focus({ preventScroll: true });
    if (panel.scrollIntoView) panel.scrollIntoView({ block: 'nearest' });
  }
  function chosenWord(section) {
    const G0 = eng();
    return (G0 && G0.state && G0.state['build_' + section]) ? 'Chosen' : 'Our pick';
  }
  function markTouched(section, key) {
    const G0 = eng();
    if (G0 && G0.state) G0.state['build_' + section] = key || true;
  }
  function openSection(k) {
    const G0 = eng();
    if (openId === k) { closeSection(k); return; }         
    const was = openId;
    openId = k;
    if (!was) {
      const scr = document.getElementById('guidedScroll');
      openScroll = scr ? scr.scrollTop : null;
    }
    if (was) { if (G0 && typeof G0.openSwap === 'function') G0.openSwap(k); }
    else { openHeld = true; if (G0 && typeof G0.openEntry === 'function') G0.openEntry(k); }
    redrawBuild();
    focusChecked(k);
  }
  function closeSection(focusK) {
    if (!openId) return;
    const was = openId;
    openId = null;
    if (openHeld) {
      openHeld = false;
      const G0 = eng();
      if (G0 && typeof G0.openSpend === 'function') G0.openSpend();
    }
    redrawBuild();
    if (openScroll != null) {
      const scr = document.getElementById('guidedScroll');
      if (scr) scr.scrollTop = openScroll;
      openScroll = null;
    }
    const G0 = eng();
    if (G0 && typeof G0.refreshChrome === 'function') G0.refreshChrome();
    focusLine(focusK || was);
  }
  function openRoomFor(kind) {
    const d = drawnFor;
    if (!d || !d.ctx) return;
    const done = () => {
      redrawBuild();
      const G0 = eng();
      if (G0 && typeof G0.refreshChrome === 'function') G0.refreshChrome();
      focusLine(kind);
    };
    if (kind === 'cloth') {
      const A = window.PT_GUIDED_ASK;
      if (A && typeof A.openClothSheet === 'function') A.openClothSheet(d.ctx, { done, taken: (id) => {
        try { const st = state(); if (st) st.narrowNote = ''; } catch (e) {   }
        markTouched('cloth', id);
        done();
      } });
    } else if (kind === 'finishing') {
      const F = window.PT_GUIDED_FINISH;
      if (F && typeof F.openFinishing === 'function') F.openFinishing(d.ctx, { done, changed: () => markTouched('finishing', true) });
    }
  }

  function lineHTML(k, label, value, o) {
    const opt = o || {};
    const open = openId === k;
    const expands = k === 'garment' || k === 'make';
    return '<button type="button" class="gbSet" data-gsee="line" data-k="' + E(k) + '"' +
      (expands ? ' aria-expanded="' + (open ? 'true' : 'false') + '"' : '') + '>' +
      (opt.swatch || '') +
      '<span class="gbSetWords">' +
        '<span class="gbLabel">' + E(label) + '</span>' +
        '<span class="gbDash"> — </span>' +
        '<span class="gbValue">' + E(value) + '</span>' +
      '</span>' +
      '<span class="gbChange">' + (open ? 'Close' : 'Change') + '</span>' +
    '</button>';
  }
  function panelWrap(k, label, rows) {
    if (!rows) return '';
    return '<div class="gbPanel" data-k="' + E(k) + '">' +
      '<div class="gsee-rows" role="radiogroup" aria-label="' + E(label) + '">' + rows + '</div>' +
    '</div>';
  }
  function garmentPanel(st) {
    const GAR = P('GARMENTS') || [];
    const f = P('fig');
    const cur = st.garment ? st.garment[0] : null;
    const curRow = GAR.find((g) => g[0] === cur);
    const curPrice = curRow ? curRow[2] : null;
    return panelWrap('garment', 'The garment', GAR.map(([k, label, price]) => {
      let move = '';
      if (k !== cur && price != null && curPrice != null && f) {
        try { move = f(price - curPrice, 'change').html || ''; } catch (e) { move = ''; }
      }
      return rowHTML({
        act: 'garment', k, name: label, on: cur === k,
        fact: move,
        advice: k === 'coat' ? 'No photograph of this one yet — it\u2019s cut from our heaviest winter cloths, 400 g/m\u00b2 and up.'
          : k === 'jacket' ? 'Shown with the form\u2019s own trousers — the commission is the jacket alone.' : '',
        word: chosenWord('garment'),
      });
    }).join(''));
  }
  function makePanel() {
    const mks = makeRows();
    if (mks.length < 2) return '';
    return panelWrap('make', 'The make', mks.map((m) => rowHTML({
      act: 'make', k: m.k, name: m.label, on: m.on,
      fact: m.on ? '' : m.move, advice: m.copy,
      word: chosenWord('make'),
    })).join(''));
  }
  function columnHTML(ctx, st, cl, unit) {
    const G0 = eng();
    const idd = !!(G0 && G0.state && G0.state.identified);
    const head = idd
      ? '<p class="gsee-fine gb-demo">' + E('A demonstration record — not a real client’s measurements.') + '</p>'
      : '';
    const teach = teachHeld
      ? '<p class="gsee-fine gb-teach">' + E('We\u2019ve chosen all of this for you — tap any line to change it.') + '</p>'
      : '';

    const makesL = P('MAKES') || [];
    const mk = makesL.find((m) => m[0] === st.tier);
    const garmentVal = st.garment ? String(st.garment[1]) : '';
    const clothVal = cl ? (clothName(cl) || String(cl.c || '')) : '';
    const makeVal = mk ? String(mk[1]) : 'As Paul builds it';
    const liName = st.lining
      ? (P('baseName') ? P('baseName')(st.lining) : String(st.lining.c)) : '';
    const ini = st.initials ? String(st.initials) + ' inside' : '';
    let finVal = (st.buttons ? String(st.buttons) : 'As Paul finishes it') +
      (liName ? ' · ' + liName + ' lining' : '') + (ini ? ' · ' + ini : '');
    if (finVal.length > 42) {
      finVal = (st.buttons ? String(st.buttons) : 'As Paul finishes it') + (ini ? ' · ' + ini : '');
    }

    const sq = cl ? squarePath(cl) : '';
    const swatch = sq && ctx && typeof ctx.plate === 'function'
      ? ctx.plate({ src: sq, w: 44, fileW: 224, fileH: 224, cls: 'g2Swatch gb-swatch', alt: '' })
      : '';
    const note = st.narrowNote
      ? '<p class="gsee-fine gb-note" role="status">' + E(String(st.narrowNote)) + '</p>'
      : '';

    return '<div class="gbCol">' +
      head + teach +
      lineHTML('garment', 'The garment', garmentVal) +
      (openId === 'garment' ? garmentPanel(st) : '') +
      lineHTML('cloth', 'The cloth', clothVal, { swatch }) +
      note +
      (unit || '') +
      lineHTML('make', 'The make', makeVal) +
      (openId === 'make' ? makePanel() : '') +
      lineHTML('finishing', 'The finishing', finVal) +
    '</div>';
  }

  const form = {
    id: 'build',
    title: 'Your suit',
    money: true,
    question: false,
    stage: true,
    compose: 'spread',

    act: {
      label: 'Read it over →',
      act(c) {
        compareOff();
        const st2 = state();
        const rec = onTheRack();
        const on = c && typeof c.answer === 'function' ? c
          : (window.G && typeof window.G.answer === 'function' ? window.G : null);
        if (on) {
          on.answer({ saved: rec ? rec.id : null, buttons: st2.buttons || null, tier: st2.tier || null });
        }
      },
    },

    render(body, ctx) {
      const has = P('hasModel');
      const noModel = !!has && !has();
      const root = document.createElement('div');
      root.className = 'gsee';
      root.id = 'gseeForm';
      body.appendChild(root);

      const G0 = eng();
      if (G0 && G0.state && G0.state.__open) {
        openId = String(G0.state.__open);
        delete G0.state.__open;
        openArrived = true;
      }
      teachHeld = !(G0 && G0.state && ['garment', 'cloth', 'make', 'finishing']
        .some((s) => G0.state['build_' + s]));

      draw(root, ctx, noModel);

      if (noModel) return;               
      let wasLive = vizLive(), wasSaid = vizSaidSomething();
      watchViz(() => {
        const live = vizLive(), said = vizSaidSomething();
        if (live === wasLive && said === wasSaid) return;
        wasLive = live; wasSaid = said;
        redrawBuild();
      });
      fitSoon();
    },

    commit() {
      return undefined;                                   
    },

    onPop(open) {
      const want = open ? String(open) : null;
      if (openId === want) return;
      openId = want;
      openHeld = !!want;
      redrawBuild();
      if (!want && openScroll != null) {
        const scr = document.getElementById('guidedScroll');
        if (scr) scr.scrollTop = openScroll;
        openScroll = null;
      }
      focusLine(want || 'garment');
    },
    onEscape() {
      if (!openId) return false;
      closeSection();
      return true;
    },
  };

  function draw(root, ctx, noModel) {
    const st = state();
    const cl = st.cloth || null;
    const acts = {};
    const saved = onTheRack();

    const bayCloth = noModel && cl ? clothPlate(ctx, cl) : '';

    function doorFor(cloth, opt) {
      if (!cloth) return '';
      const o = opt || {};
      const ok = detailTrusted(cloth);
      const inner = o.inner || (() => {
        const src = ok ? detailPath(cloth) : squarePath(cloth);
        if (!src) return '';
        const w = ok ? 344 : 320;                       
        const hgt = ok ? Math.round(344 * 420 / 481) : 320;
        return '<span class="g2Plate g2Plate--bleed gsee-clothplate' +
          (ok ? '' : ' gsee-cloth--square') +
          '" style="--g2-plate-w:' + w + 'px;--g2-plate-h:' + hgt + 'px">' +
          '<img alt="" width="' + w + '" height="' + hgt + '" decoding="async" loading="eager"' +
          ' src="' + E(src) + '"></span>';
      })();
      if (!inner) return '';
      return '<button type="button" class="g2Door gsee-clothdoor' +
        (o.bay ? ' gsee-clothdoor--bay' : '') + (o.other ? ' gsee-clothdoor--other' : '') +
        '" data-gsee="close"' +
        ' data-id="' + E(cloth.id) + '"' +
        ' aria-label="' + E('The mill’s photograph of ' + clothName(cloth)) + '">' +
          inner +
          '<span class="gsee-cident">' +
            '<span class="g2DoorFact ' + (o.other ? 'gsee-cpairfact' : 'gsee-cdoorfact') + '">' +
              E(o.fact) + '</span>' +
            '<span class="g2DoorArrow" aria-hidden="true">→</span>' +
          '</span>' +
        '</button>';
    }
    const clothDoor = doorFor(cl, { inner: bayCloth, bay: noModel, fact: doorFactWords() });
    const pair = compareCloth();
    const pairDoor = pair && !noModel
      ? doorFor(pair, { other: true, fact: doorFactsOf(pair) })
      : '';
    plateDoor = !!clothDoor;

    const bay = '<div class="gsee-bay' + (noModel ? ' gsee-bay--cloth' : '') + '">' +
      (noModel
        ? ((bayCloth ? clothDoor : '') +
           '<p class="gsee-absent' + (cl ? ' gsee-absent--cap' : '') + '">' +
           E(absenceLine()) + '</p>')
        : '<div class="gsee-window" aria-hidden="true"></div>') +
      '</div>';

    const cap =
      '<div class="gsee-cap">' +
        '<h2 class="gQ gsee-q" id="gH" tabindex="-1">' + E(questionWords()) + '</h2>' +
        '<p class="g2Name gsee-cname">' + E(nameWords()) + '</p>' +
        '<p class="g2Fact gsee-cfacts">' + E(factWords()) + '</p>' +
        '<p class="gsee-fine gsee-hint">' + E(hintWords()) + '</p>' +
        '<p class="gsee-fine gsee-pairnames">' + E(pairWords()) + '</p>' +
        '<p class="gsee-fine gsee-record">' + E(recordWords()) + '</p>' +
        '<p class="gsee-fine gsee-form">' + E(formWords()) + '</p>' +
        '<p class="gsee-fine gsee-light">' + E(lightWords()) + '</p>' +
      '</div>';


    const unit = cl && ctx && ctx.swatchLine
      ? '<div class="gsee-unit">' +
        (pair && ctx.swatchLinePair ? ctx.swatchLinePair(cl, pair) : ctx.swatchLine(cl)) +
        '</div>' : '';

    const pairSaid = pair && cl
      ? '<div class="gsee-pair">' +
        '<button type="button" class="g2Quiet" data-gsee="one">' +
        E('Back to one suit') + '</button></div>'
      : '';

    const idd = (() => { try { const g0 = eng(); return !!(g0 && g0.state && g0.state.identified); }
      catch (e) { return false; } })();
    const onrack = saved
      ? '<p class="gsee-fine gsee-onrack" role="status">' +
        E('Saved to your rack as ' + saved.name + '.') + '</p>'
      : '';
    const pairActs = idd
      ? '<div class="gsee-shareacts">' +
          (saved ? '' : '<button type="button" class="g2Quiet" data-gsee="save">Save this look</button>') +
          '<button type="button" class="g2Quiet" data-gsee="share">Copy a link for a friend</button>' +
        '</div>' +
        '<p class="gsee-fine gsee-sharesaid" role="status"></p>'
      : '';
    const acted = (saved || idd)
      ? '<div class="gsee-acts">' + onrack + pairActs + '</div>'
      : '';

    const dockLine = noModel ? ''
      : '<p class="gsee-fine gsee-dockline">' + E(dockWords()) + '</p>';
    const clothBay = '';
    const hadCaret = root.contains(document.activeElement) ? document.activeElement : null;
    const colH = columnHTML(ctx, st, cl, unit);
    root.innerHTML =
      '<div class="g2Spread gsee-spread">' +
        bay + dockLine + clothBay +
        '<div class="g2WordsBay gsee-card">' +
          cap + pairSaid +
          colH +
          (noModel ? '' : '<button type="button" class="g2Quiet gsee-shoesline" data-gsee="shoes">' +
            E('Shoes in the picture — ' + shoeWord()) + '</button>') +
          acted +
        '</div>' +
      '</div>';

    acts.line = (el) => {
      const k = el.dataset.k;
      if (k === 'cloth' || k === 'finishing') { openRoomFor(k); return; }
      openSection(k);
    };
    acts.garment = (el) => {
      const k = el.dataset.k;
      const fn = P('setGarment');
      const GAR = P('GARMENTS') || [];
      if (fn && GAR.some((g) => g[0] === k)) fn(k, { confirmed: true });
      markTouched('garment', k);
      const G8 = eng();
      const want = G8 && G8.state && G8.state.build_btn;
      if (want) {
        const can = buttonRows().filter((b) => b.can);
        if (can.some((b) => b.name === want) && state().buttons !== want) {
          const setB = P('setButtons');
          if (setB) { try { setB(want); } catch (e) {   } }
        }
      }
      closeSection('garment');
      const st2 = state();
      if (st2 && st2.narrowNote && G8 && typeof G8.say === 'function') G8.say(String(st2.narrowNote));
    };
    acts.make = (el) => {
      setMake(el.dataset.k);
      markTouched('make', el.dataset.k);
      closeSection('make');
    };
    acts.close = (el) => {
      const open = P('openCloseup');
      if (open) open(el.dataset.id);
    };
    acts.one = () => {
      compareOff();
      draw(root, ctx, noModel);
      const back = root.querySelector('#gH');
      if (back && back.focus) back.focus({ preventScroll: true });
    };
    acts.save = () => {
      const g0 = eng();
      if (g0 && g0.saveLook) g0.saveLook();
      draw(root, ctx, noModel);
      const note = root.querySelector('.gsee-onrack');
      if (note) { note.setAttribute('tabindex', '-1'); note.focus({ preventScroll: true }); }
    };
    acts.shoes = () => {
      const tones = ['black', 'brown', 'oxblood', 'white'];
      const rows = tones.map((k) =>
        '<button type="button" class="g2Row gsee-shoerow" data-shoe="' + k + '"' +
        (shoeTone() === k ? ' aria-current="true"' : '') + '>' +
        '<span class="g2RowWords"><span class="g2Name">' + E(toneWord(k)) +
        (shoeTone() === k ? '<span class="g2Chosen">Chosen</span>' : '') +
        '</span></span></button>').join('');
      ctx.sheet('shoes',
        '<p class="gfin-lede">' +
        E('These are just the shoes in the picture — they\u2019re not part of your commission.') +
        '</p>' + rows,
        { heading: 'The shoes', returnTo: '.gsee-shoesline' });
      const sheet = document.querySelector('#guidedLayer .g2Sheet');
      if (!sheet) return;
      sheet.addEventListener('click', (ev) => {
        const hit = ev.target.closest ? ev.target.closest('[data-shoe]') : null;
        if (!hit) return;
        try { S.shoes = hit.dataset.shoe; } catch (e) {   }
        vizTell({ shoes: hit.dataset.shoe });
        ctx.closeSheet();
        draw(root, ctx, noModel);
        const line = root.querySelector('.gsee-shoesline');
        if (line) line.focus({ preventScroll: true });
      });
    };
    acts.share = async () => {
      const make = P('shareURL');
      if (!make) return;
      const url = make();
      const said = root.querySelector('.gsee-sharesaid');
      const say = (words) => { if (said) said.textContent = words; };
      try {
        await navigator.clipboard.writeText(url);
        say('Copied — that link opens this suit exactly as it stands. It carries the suit, never you.');
      } catch (e) {
        try { history.replaceState(null, '', url); } catch (e2) {   }
        say('Copy the address bar — the page URL now holds this suit.');
      }
    };
    ACTS.set(root, acts);
    wire(root, ctx);
    armDoor(root);
    roving(root);
    drawnFor = { root, ctx, noModel, clothId: cl ? cl.id : null };
    if (hadCaret && !document.contains(hadCaret)) {
      const q = root.querySelector('#gH');
      if (q && q.focus) q.focus({ preventScroll: true });
    }
    if (openArrived) {
      openArrived = false;
      const k = openId;
      if (k === 'cloth' || k === 'finishing') {
        openId = null;
        setTimeout(() => openRoomFor(k), 0);
      } else if (k) {
        openHeld = true;
        const G0 = eng();
        if (G0 && typeof G0.openEntry === 'function') G0.openEntry(k);
        setTimeout(() => focusChecked(k), 0);
      }
    }
    fitSoon();
  }

  function refocus(root, act, k) {
    const back = root.querySelector('[data-gsee=' + act + '][data-k="' + cssq(k) + '"]');
    if (back) back.focus({ preventScroll: true });
  }
  function armDoor(root) {
    for (const el of root.querySelectorAll('[data-gsee=close]')) {
      if (el.dataset.gseeArmed) continue;
      el.dataset.gseeArmed = '1';
      const id = el.dataset.id;
      const warm = () => { const f = P('preloadCloseup'); if (f) { try { f(id); } catch (e) {   } } };
      el.addEventListener('pointerenter', warm);
      el.addEventListener('focus', warm);
    }
  }

  function group(id, label, rows) {
    if (!rows) return '';
    return '<div class="gsee-group">' +
      '<p class="g2Eyebrow" id="' + id + '">' + E(label) + '</p>' +
      '<div class="gsee-rows" role="radiogroup" aria-labelledby="' + id + '">' + rows + '</div>' +
      '</div>';
  }
  function rowHTML(o) {
    const cls = 'g2Row' + (o.tight ? ' g2Row--tight' : '');
    return '<button type="button" class="' + cls + '" role="radio"' +
      ' aria-checked="' + (o.on ? 'true' : 'false') + '"' +
      ' data-gsee="' + E(o.act) + '" data-k="' + E(o.k) + '">' +
      '<span class="g2Mark" aria-hidden="true"></span>' +
      '<span class="g2RowWords">' +
      '<span class="g2Name">' + E(o.name) + '<span class="g2Chosen">' + E(o.word || 'Chosen') + '</span></span>' +
      (o.fact ? '<span class="g2Fact">' + o.fact + '</span>' : '') +
      (o.advice ? '<span class="g2Advice">' + E(o.advice) + '</span>' : '') +
      '</span></button>';
  }

  const MACHINERY = {
    wearLook, lookFacts, lookFigure, lookName, forgetLook,
    compareLooks, compareOff, onTheRack,
    setBeside, compareCloth,                  
    buttonRows, setButtonTone,
  };

  function registerAll() {
    const G = window.G;
    if (!G || typeof G.register !== 'function') return false;
    if (registerAll.done) return true;
    registerAll.done = true;
    for (const k in MACHINERY) if (!(k in G)) G[k] = MACHINERY[k];
    styles();                    
    G.register(form);
    return true;
  }
  window.PT_GUIDED_SEE = Object.assign(
    { step: form, steps: [form], fit, reapply: wearLook,
      paintedStage, stageInView, isDocked: () => docked,
      dressState: () => dressed }, MACHINERY);

  const WINDOW_CSS = `
/* the stage, lifted into the hole the wizard leaves for it */
body.guided.gsee-stage:has(#guidedLayer .gsee-window) .stage{
  position:fixed;
  left:var(--gsee-left,0px); right:var(--gsee-right,0px);
  top:var(--gsee-top,0px); bottom:var(--gsee-bot,0px);
  z-index:6;                      /* over the reading column, under the layer (90) */
  margin:0; max-width:none; overflow:hidden;
  display:grid; grid-template-columns:minmax(0,1fr) 0px; grid-template-rows:100%;
  background:var(--color-surface-fabric-surround-book);
}
body.guided.gsee-stage:has(#guidedLayer .gsee-window) .viz{
  display:grid; position:relative; top:auto; height:100%;
  z-index:auto; isolation:auto;
}
/* ── GUIDED-3 FX2 · 29 August 2026 · THE STAGE SITS FLUSH IN ITS BAY ─────────
   DATED AMENDMENT (craft & performance 4). Measured on the desktop spread: the
   three columns start at exactly y=195.0 — ".viz", the cloth plate and the words
   bay — and then the iframe's painted top edge landed at y=203.0, because
   modern.html:516 insets it by "--vizband", the height of the stage's own
   control band. In the guided layer that band is "display:none" (the wizard
   offers no COMPARE chip and no toolbar), so what the inset reserved was an 8px
   sliver of #F7F7F7 above a black stage, beside a navy plate that started flush
   — visible at 3× DPR, and only after the 3D actually arrived, which made the
   spread correctly aligned right up until the real thing appeared. Nothing is
   reserved for a band that is not there. */
body.guided.gsee-stage:has(#guidedLayer .gsee-window) .viz iframe{
  top:0; height:100%;
}
/* the reading column keeps its box — oneColumn() measures it and the answer
   must stay a real one — and paints nothing. The engine has already marked it
   inert, so it is out of the tab order as well as out of the picture. */
body.guided.gsee-stage:has(#guidedLayer .gsee-window) .conf{ visibility:hidden; }
/* the layer stops painting, so the stage behind it is the page. Only the bands
   that carry words take the pointer; the hole passes every press, drag and
   wheel down to the viewer, which is what makes the garment turn. */
body.guided.gsee-stage:has(#guidedLayer .gsee-window) #guidedLayer{
  background:none; pointer-events:none;
}
body.guided.gsee-stage #guidedLayer .gFoot,
body.guided.gsee-stage #guidedLayer .g2Settled,
body.guided.gsee-stage #guidedLayer .gsee-card{ pointer-events:auto; }
/* FLOW-1(m) (30 Aug 2026) · LAW 24's one real break, found by pressing: the
   rail joined the layer AFTER this hole was cut (FLOW-1(e)) and never joined
   this list — so on every stage-bearing screen its stops were visually live
   and dead to the pointer (elementFromPoint returned the page through them).
   The rail is chrome that carries words; it takes the pointer like the rest. */
body.guided.gsee-stage #guidedLayer .gRail{ pointer-events:auto; }
/* …EXCEPT THE RECORD'S PORTRAIT, WHICH IS A PICTURE AND NOT A CONTROL
   (direction §9.8: "the live stage, framed front, NON-INTERACTIVE"). The window
   paints nothing and never has; here it also takes the pointer, so a press, a
   drag or a wheel over the commission's portrait lands on a transparent pane of
   the layer and the viewer beneath it never hears it. The seven controls that
   were inside the picture are gone with the viewer's two bands (see the dress
   above), so there is nothing left in there to reach for, by pointer or by
   caret. Nothing moves on the screen that buys. */
body.guided.gsee-stage #guidedLayer .gfin-portrait .gsee-window{ pointer-events:auto; }
/* …UNLESS THE KEEPSAKE IS UP. GUIDED-3 · M9 · WP5, 28 August 2026. The client
   asked for a picture of his commission at the foot of the letter and the
   viewer raised its own room for it — a fixed pane over the whole of the
   frame, with COPY IMAGE, SHARE and CLOSE in it. A window that eats the press
   would show him the artefact and withhold every way of keeping it, which is
   the hit test lying about a screen he can see. The pane covers the canvas
   completely while it stands, so nothing behind it can be turned by a press
   that reaches through: §9.8's "non-interactive" holds for the whole of the
   time there is a garment under the finger. the class body.viz-card is set by the page
   from the viewer's own ptCard message, and it goes down with the room. */
body.guided.gsee-stage.viz-card #guidedLayer .gfin-portrait .gsee-window{ pointer-events:none; }

/* ── ONE SCROLLER, AND IT IS THE PAGE'S ────────────────────────────────────
   The step is one page in #guidedScroll and nothing on it is ever folded away.
   What keeps the picture leading the screen is not a clip — it is two pins. The
   settled line is sticky at the head of the scroller and the picture's bay is
   sticky directly under it, so the two of them hold their places and the CARD
   is what moves, rising over the garment as the client reads it and falling
   back off it when he scrolls up.
   The scroller gives up its own block padding while the stage is up, because
   the picture runs to the screen edge and the two bands that remain carry that
   air themselves — 48 above the settled line at compact, 96 at ≥600, which is
   §5.2's own figure in §5.2's own place. */
body.guided.gsee-stage #guidedLayer .gScroll{ padding-block:0; }
body.guided.gsee-stage #guidedLayer .g2Settled{
  position:sticky; top:0; z-index:3;
  margin:0 calc(var(--layout-margin-compact) * -1);
  padding:var(--space-1200) var(--layout-margin-compact) var(--space-300);
  background:var(--color-surface-page);
  /* GUIDED-3 · WP5, 28 August 2026 · AND THIS BAND DECLARES ITS EDGE TOO.
     The same finding as the docked band's, on the screen that takes money:
     measured at 390 on the commit screen, a line of the card came to rest under
     this band's foot with the tops of its glyphs showing above the words
     "Free, and there is no need to say why" — paper painted over paper, which
     reads as broken type rather than as type behind something. One hairline,
     and what the client sees is an edge (R-G3-1(b): the seam is architecture).
     The rule is on the BAND and not on the screen, so it appears only while
     the band is standing over something. */
  border-bottom:var(--border-width-hairline) solid var(--color-line-hairline);
}
/* THE PICTURE'S OWN HEIGHT, and why it is these numbers.
   min(62svh, 560px) is direction §9.5, verbatim: 523 px on a 390×844 phone,
   which with the settled line and the caption fills 699 of the 722 the reading
   area holds with a money foot — so the fold falls between the garment and the
   tones, and the client sees his suit before he is asked about a button.
   It is also comfortably above the 320 px at which the viewer drops its own
   FRONT · SIDE · BACK band, so the three named views are the client's on every
   phone in portrait. */
body.guided.gsee-stage #guidedLayer .gsee-bay{
  position:sticky; top:var(--gsee-qh,0px); z-index:1;
  margin-inline:calc(var(--layout-margin-compact) * -1);   /* §3.2's one exemption */
}
body.guided.gsee-stage #guidedLayer .gsee-window{
  display:block; height:min(62svh, 560px);
}
/* FLOW-2 (31 Aug 2026) · the build surface's phone geometry (concept §3.5):
   the stage takes half the screen, not 62svh — measured at 390×844, the old
   height left NOT ONE settled line in view at rest, and a column nobody can
   see is the nine-station maze wearing one page. 422 is exactly the North
   Star's 50 percent floor; the caption compacts with it so the garment line
   and the cloth line stand in the first screen as the honest scroll cue,
   with the act pinned beneath the thumb. */
@media (max-width:599px){
  body.guided.gsee-stage #guidedLayer .gStep[data-step="build"] .gsee-window{
    /* 51svh, not 50: reserveFoot may shave about 20px to keep a caption line
       off the plinth's edge, and the shaved picture must still clear
       FLOW-2(g)'s 48-percent floor (measured 47.5 at exactly 50svh).
       (No backticks in this comment: it lives inside the template literal.) */
    height:min(51svh, 430px);
  }
  /* the phone's first screen belongs to the suit and the first settled lines:
     the heading is spoken to the screen reader and the engine's caret, not
     drawn — the stage IS the subject at this width. */
  #guidedLayer .gStep[data-step="build"] .gsee-cap .gQ{
    position:absolute; width:1px; height:1px; overflow:hidden;
    clip-path:inset(50%); margin:0; padding:0;
  }
  #guidedLayer .gStep[data-step="build"] .gsee-cap p{ margin-block:0 var(--space-50, 2px); }
  #guidedLayer .gStep[data-step="build"] .gbCol{ margin-block-start:var(--space-100); }
  /* the cloth line's swatch peeks over the plinth at rest — the honest
     scroll cue the devil asked for, paid in row padding, not honesty. */
  #guidedLayer .gStep[data-step="build"] .gbSet{ padding-block:var(--space-200); }
  /* FLOW-2 a11y blocker 2 (31 Aug 2026) - 2.4.11: at short viewports the
     fixed stage stood over the freshly focused control (measured whole at
     375x667 and 320x512 - one Tab, no ring on screen). The scroller's own
     scroll-padding walks every focus target out from under the hole; the
     overshoot while the stage is docked lands the row mid-screen, which
     is air, not a defect. */
  /* the id, not the class: guided.css's own reservation rule carries TWO ids
     (#guidedLayer #guidedScroll) and out-ranks a class-tail selector, which
     silently reset this to 12px — measured, V6 as amended. */
  body.guided.gsee-stage #guidedLayer:has(.gStep[data-step="build"]) #guidedScroll{
    scroll-padding-block-start:calc(min(51svh, 430px) + var(--space-300));
  }
}
/* FX2 · …AND THE MEASURED CEILING, which is every picture's and not only this
   one's. It is a max-height rather than a term inside the height, so it reaches
   the record's own portrait too — that face declares its height in
   guided-finish.js's block, and a maximum outranks a height whatever the
   document order. Where the arithmetic has nothing to say the value is larger
   than any screen. See "reserveFoot": the picture never takes so much of the
   reading area that a line of type comes to rest under the plinth. */
body.guided.gsee-stage #guidedLayer .gsee-window{
  max-height:var(--gsee-stagemax, none);
}
/* ── FLOW-1(m) · 30 August 2026 · THE MAKE STATIONS' STAGE YIELDS TO THE
   QUESTION AT COMPACT. DATED AMENDMENT to §9.5's height on the canvas and
   buttons stations ONLY — the form keeps the hero law whole. The clarity
   judge measured both make screens at 390×844 asking their question and
   showing ZERO answers: the port clipped at 775 and the two option rows sat
   at 793–1038, with no primary act, no scroll cue, and Back the only control
   in frame. Law 9 keeps the suit standing on these stages (the owner's own
   "stage and page"), so the stage does not leave — it yields: at 599 and
   below the window drops to the height that puts the question AND both rows
   on the first screen, with the second row's edge as its own honest scroll
   cue. Below 320px the viewer stands down its FRONT-SIDE-BACK band on these
   two stations; the named views remain on the form, where the seeing is the
   subject. (No backticks in this comment: it lives inside the style sheet's
   template literal.) */
/* FLOW-2 (31 Aug 2026) · the canvas and buttons stations retired; their
   compact-window rule went with them. The build surface keeps the hero law
   whole and its sections unfold beneath the stage. */
/* FLOW-2 (31 Aug 2026) · FLOW-1(m)·7's static pins are inherited by the ONE
   surface that remains: the build surface keeps the form's judged desktop
   composition, and no paper ever rides over the stage (§3.2's law stands;
   the owner photographed the breach once and it does not come back). */
/* the card: its natural height, always, opaque, and above the picture it rises
   over. Its head-room is space.300, which is the gap a plate tile leaves
   between its photograph and its caption (§4.1) — the caption belongs to the
   picture, and §9.5's arithmetic gives the two of them one unit and 95 px.
   Beneath the last answer, §5.2's minimum: 96. */
body.guided.gsee-stage #guidedLayer .gsee-card{
  position:relative; z-index:2;
  background:var(--color-surface-page);
  /* THE BAND RUNS TO THE SCREEN EDGE AND ITS WORDS DO NOT. The picture is
     full-bleed at compact, so a card only as wide as the reading column leaves
     a 24px strip of the client's own jacket showing down each side of the words
     that have risen over it — measured, and it reads as a bug. The band takes
     the two margins back and gives them straight to its padding, so the paper
     is 390 wide and the type is still on the column. */
  margin-inline:calc(var(--layout-margin-compact) * -1);
  /* ── GUIDED-3 FX2 · 29 August 2026 · ONE BAND OF AIR AT THE FOOT, NOT THREE ─
     DATED AMENDMENT (devil's advocate 8). At the terminal scroll of the garment
     moment the client was shown 224 CSS px of empty cream — 26% of a 390×844
     screen — composed of THIS card's own 96px bottom padding, the escape row's
     32px margin and the scroller's own 96px trailing pad, one after another:
     "elementFromPoint" at (195,520), (195,600) and (195,660) all returned HTML.
     §5.2's ≥96 beneath the last answer is ONE band and the scroller already
     pays it (guided.css, "#guidedScroll"), so the card stops paying it twice.
     What is left is §5.2's own rhythm — one step to the way sideways, then the
     96 — and V6's floor is still measured at the end of the scroll. */
  padding:var(--space-300) var(--layout-margin-compact) 0;
  /* AND THE RHYTHM IS A GAP, NOT A MARGIN. modern.html resets every margin on
     every element, unlayered, so a margin declared in the fallback layer below
     is a margin that never lands — measured: the two tone groups arrived flush
     against each other with 32px of nothing between them in the stylesheet. A
     flex column's gap is not a margin and cannot be reset out from under the
     screen, and §5.2's step between units is the one number it needs. */
  display:flex; flex-direction:column; gap:var(--space-800);
}
/* …and where the layer states that rhythm as a margin instead (the words bay,
   above 1024), the two would add. One of them, and it is the gap. */
body.guided.gsee-stage #guidedLayer .gsee-card > * + *{ margin-top:0; }
/* ── THE THREE QUIET TYPE ROLES, UNLAYERED, AND WHY THEY HAVE TO BE ────────
   modern.html carries an UNLAYERED element rule — "p, li, .standing, … {
   font-size:var(--type-size-200) }" — and an unlayered rule beats a layered one
   at every specificity. So a 12px role declared in the fallback layer below
   renders at 14, which is how a one-line record became two and took the fold
   with it (measured: 310px of text in a 342px column, wrapping). These three
   are the direction's own §2.2 ladder — the eyebrow/advice/basis rung at 12 and
   the fact rung at 14 — and they are stated here so the element rule cannot
   have them. Everything else this file draws wears a construction guided.css
   already owns unlayered, and needs no such rescue. */
#guidedLayer .gsee-fine{
  font-size:var(--type-size-100); line-height:var(--type-line-height-100);
}
#guidedLayer .gsee-boot,
#guidedLayer .gsee-absent{
  font-size:var(--type-size-200); line-height:var(--type-line-height-200);
}
/* the caption's own lines are a UNIT (§5.2's within-a-unit step, 12), and the
   layer's general rule for prose in a step body — a 16px trailing margin —
   would put a second, different gap between lines that are one caption. The
   question keeps its own scale and gives up only its trailing margin, which the
   caption's gap is already carrying. Declared unlayered because both of those
   general rules are unlayered and would win. */
body.guided.gsee-stage #guidedLayer .gsee-cap p,
body.guided.gsee-stage #guidedLayer .gsee-cap .gQ,
body.guided.gsee-stage #guidedLayer .gsee-acts p{ margin:0; }
/* the colour statement and the free swatch are one unit, and the card's own gap
   has already put a step above them. Their standing top margin is for a screen
   where the pair is a paragraph among paragraphs; here it would be the step
   twice. (Unlayered, because that margin is.) */
body.guided.gsee-stage #guidedLayer .gsee-unit .gSwatchLine{ margin-top:0; }
/* a line the viewer is carrying is not drawn twice: it is emptied, and an empty
   line takes no room. */
body.guided.gsee-stage #guidedLayer .gsee-cname:empty,
body.guided.gsee-stage #guidedLayer .gsee-cfacts:empty{ display:none; }
/* ── GUIDED-3 · M1 Arrival A · THE DOOR IS A PLATE WITH A LINE UNDER IT ─────
   DATED AMENDMENT, 28 August 2026. The three rules that stood here dressed a
   112px square inside a flex ROW — the door row of §4.4, with a label, a fact
   and an arrow beside the photograph. The photograph is the door now and it runs
   the full column, so the construction is a block: the plate, then one line
   carrying the cloth's own identity and the arrow that says this opens
   something. the .g2Door construction's own grid and flex (guided.css, unlayered at ≥600) are
   both overridden here, which is why these are qualified this hard. */
/* THE DOOR IS THE PLATE'S OWN WIDTH, AND THE PLATE NEVER LEAVES THE COLUMN.
   344 is the room the plate declares (the detail tier's own minimum); the column
   at 390 is 342, and guided.css's unlayered .g2Door > .g2Plate rule sets the
   plate to its declared width flat, which put 2px of photograph past the right
   edge of the text it is captioned by. min() of the two, taken on the door, so
   the plate, its identity line and its arrow all end on the same edge at every
   width — 342 at 390, 344 at 768 and in the ≥1024 pair. */
body.guided.gsee-stage #guidedLayer .gsee-clothdoor{
  display:block; width:min(100%, 344px); text-align:left;
  padding:0; border:0; background:none;
}
body.guided.gsee-stage #guidedLayer .gsee-clothplate{
  display:block; margin:0; width:100%; max-width:100%;
}
/* ── GUIDED-3 FX2 · 29 August 2026 · …AND AT ≤599 THE PLATE TAKES ITS BLEED ──
   DATED AMENDMENT (fabric & colour fidelity 2). The plate above already carries
   ".g2Plate--bleed" and the cap on this door defeated it: measured, the
   photograph sat in a 342px box inside a 390 viewport with the WARM PAPER
   #F7F4EC (OKLCH C=1.107) one pixel outside it on all four sides, on the
   garment moment, the attestation screen and the letter, at every width.
   RULING-002 requires the surface directly adjacent to a fabric image to be
   effectively zero chroma, and R-G3-1's prescribed architecture is exactly this
   — "full-bleed surrounds at ≤599". The door becomes the full column, the plate
   runs to the screen edge, and guided.css's ≤599 bleed rule paints the ruled
   24px band around a photograph that has not lost a pixel. The WORDS come back
   to the reading column, as they do on the overcoat's own bay door above, and
   for the same reason: a line of type has never been allowed to touch the edge
   of this screen. */
@media (max-width:599px){
  body.guided.gsee-stage #guidedLayer .gsee-clothdoor{ width:100%; }
  body.guided.gsee-stage #guidedLayer .gsee-clothdoor .gsee-cident{
    padding-inline:var(--layout-margin-compact);
  }
  /* ── GUIDED-3 MICRO WAVE 3 · and the bleed is actually TAKEN. ─────────────
     DATED AMENDMENT to the paragraph above, which says "the plate runs to the
     screen edge" — measured on the running page, it did not: the margin:0 two
     rules up defeats .g2Plate--bleed's own pull, so the plate's border box
     stood at 24→414 on a 390 screen. Its left band began 24px in and its right
     band was 24px OFF the screen, which is the one edge of the four §3.2(3)
     asks for that no client could ever see. The pull is restored on the plate
     alone; the identity line beneath it does not move. */
  body.guided.gsee-stage #guidedLayer .gsee-clothplate{
    margin-inline:calc(var(--layout-margin-compact) * -1);
  }
}
/* …and above the rung, where the plate is an INSET box and there is no screen
   edge to bleed to, the band is taken out of the box the plate already
   declares: the photograph is fitted into what is left (contain, never crop,
   never enlarge — the file is 940 across and the box is 344) and the ground is
   painted on all four sides. Measured before this: plate 344.0 wide, photograph
   343.9 — a band of 0.05px, which is to say none. */
@media (min-width:600px){
  body.guided.gsee-stage #guidedLayer .gsee-clothplate{
    padding:var(--layout-surround-band-cloth);
  }
}
/* …EXCEPT WHERE THE BAY'S OWN PHOTOGRAPH IS THE DOOR — the overcoat, which has
   no form and whose cloth IS the picture. There the plate is the bay's, at the
   tier's own median room and full-bleed at ≤599 (§3.2's one exemption), so the
   door takes the bay's width and only its WORDS come back to the reading
   column — the same split the absence line beneath them already makes, and for
   the same reason: the photograph runs to the screen edge and the type does not. */
body.guided.gsee-stage #guidedLayer .gsee-clothdoor--bay{ width:100%; }
body.guided.gsee-stage #guidedLayer .gsee-clothdoor--bay .gsee-cident{
  padding-inline:var(--layout-margin-compact);
}
@media (min-width:600px){
  body.guided.gsee-stage #guidedLayer .gsee-clothdoor--bay .gsee-cident{ padding-inline:0; }
}
/* the identity line: the cloth's name, its book and its weight, with the door's
   own arrow ranged to the far edge. --type-size-200, one within-a-unit step
   under the photograph it belongs to (§5.2). */
body.guided.gsee-stage #guidedLayer .gsee-cident{
  display:flex; align-items:baseline; justify-content:space-between;
  gap:var(--space-400); padding-top:var(--space-300);
}
body.guided.gsee-stage #guidedLayer .gsee-cident .g2DoorFact{
  text-align:left; flex:1 1 auto;
}
/* the arrow sits with the LAST line of the identity, not the first: on a two
   line identity a baseline-aligned arrow reads as an orphan beside the middle
   of a sentence. */
body.guided.gsee-stage #guidedLayer .gsee-cident .g2DoorArrow{
  flex:none; align-self:flex-end;
}
body.guided.gsee-stage #guidedLayer .gsee-clothdoor .g2DoorFact:empty{ display:none; }
/* the second portrait column exists in the DOM at every width so the door has
   somewhere to be moved to; below 1024 it is empty and takes no room. */
body.guided.gsee-stage #guidedLayer .gsee-clothbay:empty{ display:none; }

/* ── GUIDED-3 · M2 · THE DOCK ──────────────────────────────────────────────
   While the picture is docked the page's own .stage — which this file has
   already made position:fixed and inset to the hole — is raised ABOVE the
   layer, so the card scrolls UNDER the picture instead of over it. That is the
   whole of the dock: one z-index, and the insets fit() has already written.
   The layer is 90; the money foot is fixed at the FOOT, and the strip is at the
   head of the reading area, so the two never meet. */
body.guided.gsee-stage:has(#guidedLayer.gsee-docked) .stage{ z-index:95; }
/* …and the standing sentence rides with the strip (M20), on the paper, in the
   band directly beneath it. Fixed, because the thing it belongs to is fixed. */
/* GUIDED-3 · WP5, dated 28 August 2026: "display:none" stood on the undocked
   state and it made the band unmeasurable until the frame AFTER it appeared,
   which is why its first appearance landed on top of the card's heading. The
   box is declared once, for both states, and the undocked state is HIDDEN
   rather than removed: hidden it still has a box the dock can be sized to, it
   paints nothing, takes no pointer and is out of the accessibility tree — and
   it is fixed at both states, so showing it reflows nothing. */
body.guided.gsee-stage #guidedLayer .gsee-dockline{
  display:block; position:fixed; z-index:96;
  left:var(--gsee-left,0px); right:var(--gsee-right,0px);
  top:calc(var(--gsee-top,0px) + var(--gsee-dock,0px));
  margin:0; padding:var(--space-200) var(--layout-margin-compact) var(--space-300);
  background:var(--color-surface-page);
  /* GUIDED-3 · WP5 · THE BAND DECLARES ITS OWN EDGE. Paper painted over paper
     is an invisible guillotine: a line half-covered by it reads as broken type
     rather than as type behind something. One hairline at the foot and the
     occlusion is architecture (R-G3-1(b)'s reasoning, spent at 390) — the same
     edge the picture above it already has, stated instead of discovered. */
  border-bottom:var(--border-width-hairline) solid var(--color-line-hairline);
  /* hidden until the strip stands; measurable throughout. */
  visibility:hidden; pointer-events:none;
}
/* ── GUIDED-3 MICRO WAVE 3 · ADVOCATE 2 · THE THIRD EDGE FADES TOO ─────────
   The plinth and the settled band each carry a 12px gradient of the house's
   paper so a line the edge passes through dissolves instead of being cut
   through its x-height; this band — the only other piece of docked, opaque,
   paper-coloured chrome in the layer — did not, and the advocate measured it
   cutting "The make" at 47% of its height at 11 of 64 rest positions at 390.
   Same declaration, same 12px, same direction as the settled band (paper at
   the edge, transparent below it), and the same cloth window taken out of it
   so a photograph passing underneath is never washed (fabric 1, above). It
   sits BELOW the band's hairline, which stays: the hairline says an edge is
   there, the gradient keeps the type whole across it. */
body.guided.gsee-stage #guidedLayer.gsee-docked .gsee-dockline::before,
body.guided.gsee-stage #guidedLayer.gsee-docked .gsee-dockline::after{
  content:'';
  position:absolute; top:calc(100% + var(--border-width-hairline));
  height:var(--g2-fade, var(--space-300));
  background:linear-gradient(to bottom, var(--color-surface-page), transparent);
  pointer-events:none;
}
body.guided.gsee-stage #guidedLayer.gsee-docked .gsee-dockline::before{
  left:0; right:calc(100% - var(--g2-dockfade-to, 100%));
}
body.guided.gsee-stage #guidedLayer.gsee-docked .gsee-dockline::after{
  left:var(--g2-dockfade-from, 100%); right:0;
}
body.guided.gsee-stage #guidedLayer.gsee-docked .gsee-dockline{
  visibility:visible;
  /* it takes the pointer, because it is opaque. A band that paints over a
     control and then passes the press through to it would be the hit test
     telling the truth about a screen the client cannot see (§10.2). */
  pointer-events:auto;
}
body.guided.gsee-stage #guidedLayer .gsee-dockline:empty{ display:none; }
/* …and a real scroll stops clear of ALL THREE, so nothing a client is sent to
   lands behind the picture or under the band beneath it. --gsee-dockband is
   the band's own measured height (fit(), dated note there): before it, this
   reserved the picture and 48px of air and nothing for the band, so an engine
   scroll came to rest 6px under a 54px band with its first line cut. */
body.guided.gsee-stage #guidedLayer.gsee-docked #guidedScroll{
  scroll-padding-top:calc(
    var(--gsee-top,0px) + var(--gsee-dock,0px) + var(--gsee-dockband,0px) + var(--space-1200));
}
/* ── THE CLOTH, WHERE THE GARMENT HAS NO FORM ──────────────────────────────
   The room is the detail tier's own median — 481×420, measured across 2,055
   files — declared so the space is reserved before the photograph decodes (no
   shift, BM9) and so nothing is ever drawn above its own resolution (G3). At
   ≤599 the plate runs to the viewport edge (§3.2's one exemption) and the box
   is the viewport's width at the tier's aspect: 390 × 341 on a 390 phone, which
   is §9.8's fallback (b) at §9.8's own scale. The square tier, where the detail
   file is the one this house has withdrawn, keeps its own square. */
body.guided.gsee-stage #guidedLayer .gsee-cloth{
  --g2-plate-w:481px; --g2-plate-h:calc(100vw * 420 / 481);
}
body.guided.gsee-stage #guidedLayer .gsee-cloth--square{
  --g2-plate-w:320px; --g2-plate-h:min(320px, 100vw);
}
/* ── GUIDED-3 MICRO WAVE 3 · FABRIC 1 · WHAT COULD NOT BE DONE HERE, AND WHY
   The fabric judge's second clause was "the cloth must be able to come to rest
   fully clear, its achromatic band intact on all four edges". The SIDES are
   healed above (the bleed is actually taken now, so the right-hand band is on
   the screen instead of 24px past it) and the plinth no longer washes the
   bottom edge. The VERTICAL rest at 390 is not delivered, and it is recorded
   here rather than implied: measured on the running page, the clear window
   between the docked strip (82 + 254), the sentence that rides with it (55) and
   the plinth (168) is 285px on an 844px screen, against a plate box of 348.
   Capping the plate to fit was built, measured and BACKED OUT: it fits (270 in
   285, min hidden 0 at scrollTop 336) but it draws the mill's photograph at 254
   CSS px, and GUIDED-3 M1 — "the row becomes a PLATE AT THE FULL COLUMN and the
   plate is the door" — is asserted at ≥300 (10-guided.spec.js, M1). Shrinking a
   standing ruling's plate to close a residual is not a trade this file will
   make silently, and the only other source of the 63px is the docked strip,
   whose floor is the viewer's own VIEWER_TRUTH_MIN. At ≥600 the plate does rest
   fully clear (window 423, box 300). */
/* THE BLEED IS TAKEN ONCE. The bay is already pulled out to the screen edge at
   ≤599 (.gsee-bay, above), so a plate that pulls its own margin as well would
   start 24px off the left of the screen and end 24px short of the right. Inside
   this bay the plate keeps its 100vw width and gives up the pull. */
body.guided.gsee-stage #guidedLayer .gsee-bay--cloth .g2Plate--bleed{ margin-inline:0; }
/* the absence line is the plate's caption here, not a picture of its own: the
   ground and the band belong to the photograph above it. */
body.guided.gsee-stage #guidedLayer .gsee-absent--cap{
  background:none;
  /* the bay is pulled out to the screen edge at ≤599 and the photograph runs to
     it; the words do not — they come back to the reading column, exactly as the
     card's own note reasons two blocks up. */
  padding:var(--space-300) var(--layout-margin-compact) 0;
}
@media (min-width:600px){
  body.guided.gsee-stage #guidedLayer .gsee-absent--cap{ padding-inline:0; }
}
/* ── 600 — THE LAYER'S ONE BREAKPOINT, and it is the token set's own rung ──
   GUIDED-1 turned at 640 in this file and at 600 in the token set, and at 620px
   the two disagreed by a whole column. There is one rung now and guided.css
   turns on the same one. Above it the picture is inset and never full-bleed
   (§5.1), and the air above the question doubles (§5.2). */
@media (min-width:600px){
  body.guided.gsee-stage #guidedLayer .g2Settled{
    margin-inline:0; padding-inline:0; padding-top:var(--space-2400);
  }
  body.guided.gsee-stage #guidedLayer .gsee-bay{ margin-inline:0; }
  body.guided.gsee-stage #guidedLayer .gsee-card{ margin-inline:0; padding-inline:0; }
  /* GUIDED-3 · R-G3-6 · AND THE HOLE IS A PORTRAIT BETWEEN THE RUNGS TOO.
     G11 is written at 390 and at ≥1024, and between them the bay was still a
     landscape letterbox around a standing figure: measured at 768, a 704×504
     canvas holding a 189×485 garment — 25.8% of its own stage, the same defect
     M3 measured at 1280 under a different width. The window is the box the
     stage is inset to (fit() reads its rect), so capping it to a portrait and
     centring it is the whole fix; the garment's own share goes to ~43%.
     It is the GARMENT MOMENT's own hole, by the child combinator: the record's
     portrait is drawn in guided-finish's own centred plate bay beside a 481
     cloth plate, and narrowing it there would put two centred objects of two
     widths on two left edges. That bay's shape is that file's to decide; what
     this file gives it is the room and the framing. */
  body.guided.gsee-stage #guidedLayer .gsee-bay > .gsee-window{
    width:min(100%, 420px); margin-inline:auto;
  }
  /* above the rung the plate is inset and never full-bleed (§5.1), so the room
     is the tier's own median at its own size. */
  body.guided.gsee-stage #guidedLayer .gsee-cloth{ --g2-plate-h:420px; }
  body.guided.gsee-stage #guidedLayer .gsee-cloth--square{ --g2-plate-h:320px; }
}
/* ── ≥1024 — the SPREAD (direction §5.3, §9.5) ────────────────────────────
   One subject, so: the stage in the plate bay at 662 × min(70svh, 620px), the
   caption, the tones and the primary in the words bay beside it, 48 of gutter,
   1184 of content centred in whatever the window is. The bays never overlap, so
   the card never rises over the picture and the picture is on the screen for
   the whole of the reading. */
@media (min-width:1024px){
  /* the bays are ranged from the top, not centred, so the picture can PIN while
     the words beside it are read — the direction's own rule for the record's
     spread ("the plates are sticky within the spread"), and the same reason. */
  body.guided.gsee-stage #guidedLayer .gsee-spread{ align-items:start; }
  /* ── GUIDED-3 · M3 + R-G3-6, 28 August 2026 · THE PORTRAIT PAIR ──────────
     DATED AMENDMENT. The spread was 7fr 5fr — a 663×620 LANDSCAPE LETTERBOX
     (1.07:1) around a STANDING FIGURE. Measured inside it: the garment painted
     136×340 CSS, 17.1% of the bay's area and 20.5% of its width, which is the
     same physical suit on a 27-inch monitor as on a phone, with 260 empty pixels
     down each side of it. That is not a framing preference, it is a number a
     judge can reproduce, and G11 now forbids it.

     So the plate bay stops being one box and becomes TWO PORTRAIT COLUMNS: the
     suit whole, and the cloth up close, side by side — which are exactly the two
     things the client said he never got to experience, and between them the eye
     moves without a tap (M3, and M6's handoff becomes a glance).

     THE ARITHMETIC, on the 1184 content box:
       400  the stage, portrait (0.65:1) against the subject's own ~0.39:1
     +  48  the spread's own gutter
     + 344  the mill's photograph, at the detail tier's measured MINIMUM width,
            so no file in the book is ever drawn above its own pixels
     +  48  the same gutter again
     + 344  the words — the same 344 the reading column measures at 390, so the
            walk has one measure at every width and two left edges at this one
       ————
      1184
     M3 asked for the photograph at the tier's MEDIAN 481. It cannot have it and
     keep a readable words bay on this content box: 481 would leave 211 for the
     tone rows and their advice lines. 344 is the honest cap that fits — under
     every file in the tier, three times the 112px thumbnail it replaces, and the
     door to the close-up where the file's own last pixel is reachable. */
  /* …AND IT DEGRADES. DATED AMENDMENT, GUIDED-3 · WP5, 28 August 2026 (WP4's
     handoff, recorded in guided-finish.js's own note). The tracks above were
     FIXED — 400px 344px minmax(0,1fr) — and the arithmetic they were written
     for is the 1184 content box, which does not exist at 1024: the content
     there is 928, the two plates and their two gutters take 840 of it, and the
     reading column measured 88px. Two tone rows and their advice lines in 88px
     is not a narrow column, it is a broken one.
     So the two plate tracks give up their width TOGETHER and the reading keeps
     its measure FIRST — the same three tracks WP4 wrote on the money screen,
     for the same reason and in the same words, so the walk composes once:
       1280 and above · 400 · 344 · 344   (the 1184 box, unchanged)
       1024           · 244 · 244 · 344   (the reading never under its measure)
     Nothing collapses, no column is ever alone, and the words never go under
     300 at any width the spread is up. */
  /* ── FLOW-1(f) · 30 August 2026 · THE SUIT IS THE HERO — DATED AMENDMENT
     to M3's portrait pair, at the owner's own direction ("the 3D model is a
     real hero piece and should be treated as such … render correctly and
     LARGE", confirmed against this exact trade-off). The middle cloth column
     retires: the cloth now has its own STATION with the mill's photograph at
     full judgement size, so equal billing here was two subjects on the one
     screen whose job is the suit. Two tracks — the stage takes everything the
     words do not (~792 on the 1184 box, 62%), and the bay grows to
     min(84svh, 900px): 672 at 800-tall, 756 at 900-tall, against 620 before.
     The garment is height-bound, so the bay's height IS the suit's size.
     M3's honest numbers stand in the history; what changes is the owner's
     ruling on whose screen this is. The cloth door keeps its plate in the
     words bay (M1: the photograph is the door), and the close-up room still
     reaches the file's own last pixel. */
  body.guided.gsee-stage #guidedLayer .gsee-spread{
    grid-template-columns:minmax(0,1fr) minmax(300px,344px);
    column-gap:var(--space-1200);
  }
  body.guided.gsee-stage #guidedLayer .gsee-bay{
    height:min(84svh, 900px);
    margin-inline:0;
  }
  /* FLOW-1(f) · the room spans the hero's own track — the between-rung 420px
     portrait cap (R-G3-6) stops at the spread's door: here the bay IS the
     track and the garment centres large inside it. */
  body.guided.gsee-stage #guidedLayer .gsee-window{ height:100%; }
  body.guided.gsee-stage #guidedLayer .gsee-bay > .gsee-window{ width:100%; }
  body.guided.gsee-stage #guidedLayer .gsee-card{ padding-top:0; }
  /* the cloth's column: the plate at the head of the bay, ranged with the
     stage's own top edge, and no ground of its own — the photograph stands on
     fabricSurround.book (the plate's own ground, R-G3-1(b)) and the room
     behind the FORM is the deep ground (V8). Two objects, two grounds, one
     value seam, and no hue difference beside cloth anywhere on the screen. */
  body.guided.gsee-stage #guidedLayer .gsee-clothbay{ align-self:start; }
  body.guided.gsee-stage #guidedLayer .gsee-clothbay:empty{ display:none; }
  /* the cloth bay is its photograph's height and not the stage's: a 620px bay
     with a 420px plate in it is the leftover space §1 measured, under a new
     name. */
  body.guided.gsee-stage #guidedLayer .gsee-bay--cloth{ height:auto; }
  /* …and where there is no form there is no pair: the cloth's own bay is the
     whole of the plate bay and the words stand beside it. */
  body.guided.gsee-stage #guidedLayer .gsee-spread:has(.gsee-bay--cloth){
    grid-template-columns:7fr 5fr;
  }
}`;

  const FLOOR = `
@layer gsee-fallback {
  #guidedLayer .gsee{ font-family:var(--font-family-sans-stack); }
  #guidedLayer .gsee button{ font-family:var(--font-family-sans-stack); }
  #guidedLayer .gsee-window{ background:none; }
  /* the caption: the question and the lines beneath it, §5.2's within-a-unit
     step between them */
  #guidedLayer .gsee-cap{ display:flex; flex-direction:column; gap:var(--space-300); }
  #guidedLayer .gsee-cap p{ margin:0; max-width:var(--layout-measure-prose); }
  #guidedLayer .gsee-fine:empty{ display:none; }
  #guidedLayer .gsee-fine{
    margin:0; color:var(--color-ink-tertiary);
    font-size:var(--type-size-100); line-height:var(--type-line-height-100);
    max-width:var(--layout-measure-prose); }
  #guidedLayer .gsee-boot{
    margin:0; color:var(--color-ink-secondary);
    font-size:var(--type-size-200); line-height:var(--type-line-height-200);
    max-width:var(--layout-measure-prose); }
  #guidedLayer .gsee-absent{
    margin:0; color:var(--color-ink-primary);
    font-size:var(--type-size-200); line-height:var(--type-line-height-200);
    max-width:var(--layout-measure-prose);
    padding:var(--layout-surround-band-cloth);
    background:var(--color-surface-fabric-surround-book); }
  /* the two groups — an eyebrow and its rows, one within-a-unit step apart.
     Every distance in this file is a GAP: the page resets margins unlayered
     (see the card's own note), and a gap survives that. */
  #guidedLayer .gsee-group{ display:flex; flex-direction:column; gap:var(--space-300); }
  #guidedLayer .gsee-said{ display:flex; flex-direction:column; gap:var(--space-100); }
  /* GUIDED-3 · M1 — the door is a plate with a line under it, not a row: its
     geometry is stated unlayered above (guided.css's own .g2Door rules are
     unlayered and would win here). What is left for this floor is the line's
     own ink, so the identity reads before that stylesheet covers it. */
  #guidedLayer .gsee-cident{ color:var(--color-ink-secondary); }
  #guidedLayer .gsee-unit{ display:block; }
  /* M10 · the pair's own two lines: which two cloths these are, and the way
     back to one suit. */
  #guidedLayer .gsee-pair{ display:flex; flex-direction:column;
    align-items:flex-start; gap:var(--space-300); }
  #guidedLayer .gsee-pairnames{ color:var(--color-ink-primary); }
  #guidedLayer .gsee-acts{ display:flex; flex-direction:column;
    align-items:flex-start; gap:var(--space-300); }
  #guidedLayer .gsee-onrack{ color:var(--color-ink-primary); }
  /* FLOW-1 law 8 · the signed-in pair rides in one row, quiet grammar, and its
     confirmation is a standing line beneath — never a toast. */
  #guidedLayer .gsee-shareacts{ display:flex; flex-wrap:wrap;
    align-items:center; gap:var(--space-200) var(--space-600); }
  #guidedLayer .gsee-sharesaid:empty{ display:none; }
  #guidedLayer .gsee-sharesaid{ color:var(--color-ink-primary); }
  /* FLOW-1(l) · one quiet line for the shoes; the choice is the sheet's. */
  #guidedLayer .gsee-shoesline{ align-self:flex-start; }
  @media (min-width:1024px){
    /* the words bay's own rhythm is guided.css's; the caption keeps its unit */
    #guidedLayer .gsee-cap{ gap:var(--space-300); }
  }
}`;

  function styles() {
    if (!document.getElementById('gseeStage')) {
      const st = document.createElement('style');
      st.id = 'gseeStage';
      st.textContent = WINDOW_CSS;
      (document.head || document.documentElement).appendChild(st);
    }
    if (!document.getElementById('gseeFloor')) {
      const st = document.createElement('style');
      st.id = 'gseeFloor';
      st.textContent = FLOOR;
      (document.head || document.documentElement).appendChild(st);
    }
  }

  styles();
  armLifecycle();
  if (!registerAll()) {
    document.addEventListener('DOMContentLoaded', registerAll, { once: true });
    window.addEventListener('load', registerAll, { once: true });
  }
}());
