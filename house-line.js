(function (root) {
  'use strict';

  var MEASURED   = 'This colour is measured from the cloth. Your screen is not.';
  var UNMEASURED = 'This colour has not been measured from the cloth.';

  function isMeasured(cloth) {
    if (!cloth) return false;
    var basis = cloth.hexBasis != null ? cloth.hexBasis : cloth.hexbasis;
    var bad = cloth.photoUnusable != null ? cloth.photoUnusable : cloth.photounusable;
    return String(basis) === 'measured' && !bad;
  }

  function colour(cloth) { return isMeasured(cloth) ? MEASURED : UNMEASURED; }

  function colourNamed(cloth, name) {
    var said = colour(cloth);
    var subject = String(name || '').trim();
    return subject ? said.replace(/^This colour/, subject) : said;
  }

  function append(cloth, clause) {
    var extra = String(clause || '').trim();
    return extra ? colour(cloth) + ' ' + extra : colour(cloth);
  }

  function colourFromSearch(search) {
    var q;
    try { q = new URLSearchParams(String(search || '')); } catch (e) { return UNMEASURED; }
    return colour({ hexBasis: q.get('hexbasis'), photoUnusable: q.get('photounusable') === '1' });
  }

  root.HOUSE_LINE = {
    MEASURED: MEASURED,
    UNMEASURED: UNMEASURED,
    isMeasured: isMeasured,
    colour: colour,
    colourNamed: colourNamed,
    colourFromSearch: colourFromSearch,
    append: append,
  };
}(typeof window !== 'undefined' ? window : this));
