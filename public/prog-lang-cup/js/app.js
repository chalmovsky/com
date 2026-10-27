/* Game flow: boot, character select, hub, versus, duels, results, champion and settings.
   Uses Cup (engine.js), Arena (settings.js), Snd (audio.js) and Stage (stage.js). */
(function () {
'use strict';
var C = Cup, E = C.esc, A = Arena;
var G = window.gsap || null;
function S() { return A.SET; }
function $(s) { return document.querySelector(s); }
function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
function lang(id) { return C.LMAP[id]; }
function col(id) { return lang(id) ? lang(id).color : '#8d82b8'; }
function nm(id) { return E(C.name(id)); }
function abbr(id) { return E(lang(id) ? lang(id).abbr : '?'); }
function move(id) { return lang(id) ? lang(id).move : ''; }
function tween(el, from, to) { if (typeof el === 'string' && !document.querySelector(el)) return null; if (G && A.on() && el) return G.fromTo(el, from, to); if (el && to) { var t = Object.assign({}, to); delete t.duration; delete t.ease; delete t.delay; delete t.stagger; delete t.yoyo; delete t.repeat; if (G) G.set(el, t); } return null; }

A.apply();

/* ======================= overlays ======================= */
var screens = ['s-title', 's-select', 's-hub', 's-vs', 's-match', 's-result', 's-champ', 's-settings'], screen = 's-title', before = 's-title';
function show(id) {
  if (id !== 's-settings') before = id;
  screen = id;
  screens.forEach(function (s) { document.getElementById(s).hidden = s !== id; });
  $('#fightbar').hidden = id !== 's-hub';
  $('#selbar').hidden = id !== 's-select';
  var el = document.getElementById(id);
  el.scrollTop = 0;
  tween(el, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power1.out' });
}
var toastT;
function toast(msg, ms) {
  var t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('show'); }, ms || 2600);
}
function flash(color, strength) {
  if (!S().flashes || !A.on()) return;
  var f = $('#flash'); f.style.background = color || '#fff';
  tween(f, { opacity: strength || 0.5 }, { opacity: 0, duration: 0.45, ease: 'power2.out' });
}
function banner(big, small) {
  $('#b1').textContent = big; $('#b2').textContent = small || '';
  if (!G || !A.on()) return;
  var b = $('#banner');
  G.killTweensOf(b);
  G.timeline()
    .set(b, { visibility: 'visible' })
    .fromTo('#banner .strip', { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: 0.26, ease: 'power3.out' })
    .fromTo('#b1', { x: -90, opacity: 0, skewX: -20 }, { x: 0, opacity: 1, skewX: 0, duration: 0.3, ease: 'back.out(2)' }, '-=0.12')
    .fromTo('#b2', { x: 90, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3 }, '<')
    .to('#banner .strip', { opacity: 0, scaleX: 1.15, duration: 0.3, delay: 0.7 })
    .set(b, { visibility: 'hidden' });
}
function bigText(txt, red) {
  if (!G || !A.on()) return;
  var b = $('#bigtext');
  b.className = red ? 'red' : '';
  b.innerHTML = txt.split('').map(function (ch) { return '<span>' + (ch === ' ' ? '&nbsp;' : E(ch)) + '</span>'; }).join('');
  G.killTweensOf(b);
  G.timeline()
    .set(b, { visibility: 'visible', opacity: 1 })
    .fromTo('#bigtext span', { scale: 3.2, opacity: 0, rotation: function () { return (Math.random() - 0.5) * 40; } },
      { scale: 1, opacity: 1, rotation: 0, duration: 0.32, ease: 'power4.in', stagger: 0.06 })
    .to(b, { scale: 1.08, duration: 0.6, ease: 'none' })
    .to(b, { opacity: 0, scale: 1.25, duration: 0.3 })
    .set(b, { visibility: 'hidden', scale: 1 });
}
var SPEAKER_ON = '<svg viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>';
var SPEAKER_OFF = '<svg viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="m23 9-6 6M17 9l6 6"/></svg>';

/* ======================= boot ======================= */
var loaded = false;
function boot() {
  C.init('langcup', 'langcup-arena');
  Stage.mode('title');
  titleIntro();
  var bar = $('#loadbar i');
  (window.SNIPPETS || fetch('data/snippets.txt').then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); }))
    .then(function (txt) {
      C.loadSnippets(txt);
      loaded = true;
      if (window.Loader) Loader.tick('Fighters');
      bar.style.width = '100%';
      setTimeout(function () { $('#loadbar').classList.add('done'); }, 350);
      $('#kicker').textContent = C.LANGS.length + ' languages · ' + C.snippetCount() + ' snippets · 1 champion';
      var b = $('#startbtn'); b.disabled = false;
      b.textContent = C.S ? (C.champion() ? 'See your champion' : 'Continue the cup') : 'Press start';
    })
    .catch(function () {
      $('#loadtxt').textContent = 'Couldn’t load the snippets. Tap to retry.';
      $('#loadbar').style.cursor = 'pointer';
      $('#loadbar').onclick = function () { location.reload(); };
    });
}
function titleIntro() {
  if (!G || !A.on()) return;
  $$('#logo .l1, #logo .l2').forEach(function (s) {
    s.innerHTML = s.textContent.split('').map(function (ch) { return '<span class="ch">' + ch + '</span>'; }).join('');
  });
  G.fromTo('#logo .ch', { y: 0, scale: 1 }, { keyframes: [{ y: -18, scale: 1.12, duration: 0.18, ease: 'power2.out' }, { y: 0, scale: 1, duration: 0.5, ease: 'bounce.out' }], stagger: 0.035 });
  G.fromTo('#logo .l0', { letterSpacing: '.8em', opacity: 0 }, { letterSpacing: '.2em', opacity: 1, duration: 1, delay: 0.3, ease: 'power3.out' });
  G.fromTo('#logo .l3', { letterSpacing: '1.2em', opacity: 0 }, { letterSpacing: '0.32em', opacity: 1, duration: 1.1, delay: 0.6, ease: 'power3.out' });
}

/* ======================= character select ======================= */
var chosen = {};
function setChosen(ids) { chosen = {}; ids.forEach(function (id) { chosen[id] = true; }); }
function chosenIds() { return C.LANGS.map(function (l) { return l.id; }).filter(function (id) { return chosen[id]; }); }
function openSelect() {
  setChosen(C.S ? C.S.langs : C.lastPicked() || C.POPULAR);
  $('#quick').innerHTML = [['all', 'All 32'], ['popular', 'Most popular 16', 'The 16 most used, going by Stack Overflow\'s developer survey'], ['r8', 'Random 8'], ['r16', 'Random 16'], ['none', 'Clear']]
    .map(function (q) { return '<button class="chamfer" data-quick="' + q[0] + '"' + (q[2] ? ' title="' + q[2] + '"' : '') + '>' + q[1] + '</button>'; }).join('');
  $('#roster').innerHTML = C.LANGS.map(function (l) {
    return '<button class="tile chamfer" data-tile="' + l.id + '" data-abbr="' + E(l.abbr) + '" style="--c:' + l.color + '" aria-pressed="false">' +
      '<span class="chk">✓</span><span class="tn">' + E(l.name) + '</span><span class="tm">' + E(l.move) + '</span></button>';
  }).join('');
  $('#selback').textContent = C.S ? 'Back' : 'Title';
  refreshSelect();
  show('s-select');
  fitRoster();
  Stage.mode('select');
  tween('.tile', { y: 24, opacity: 0, scale: 0.85 }, { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(2)', stagger: 0.018 });
}
function refreshSelect() {
  var ids = chosenIds(), n = ids.length;
  $$('.tile').forEach(function (t) { var on = !!chosen[t.getAttribute('data-tile')]; t.classList.toggle('on', on); t.setAttribute('aria-pressed', on); });
  $('#selcount').textContent = n + ' of 32 selected';
  $('#planline').innerHTML = n < 4 ? 'Pick at least <b>4</b> fighters to start a cup.' : '<b>' + n + '</b> fighters: ' + E(C.describePlan(n));
  var go = $('#selgo'); go.disabled = n < 4; go.removeAttribute('data-armed');
  go.textContent = n < 4 ? 'Pick ' + (4 - n) + ' more' : 'Fight! (' + n + ')';
}
function startCup(btn) {
  var inProgress = C.S && C.progress().done > 0 && !C.champion();
  if (inProgress && btn.getAttribute('data-armed') !== '1') {
    btn.setAttribute('data-armed', '1'); btn.textContent = 'Tap again: this ends the current cup';
    return;
  }
  if (!C.start(chosenIds())) return;
  Snd.play('vs'); Stage.shake(0.9); flash('#ffcb3d', 0.5);
  S().tab = 'groups'; A.save();
  openHub();
  banner('Let’s fight!', C.S.langs.length + ' fighters · ' + C.progress().total + ' matches');
}

/* ======================= hub ======================= */
function openHub() {
  if (!C.S) { openSelect(); return; }
  cur = null;
  renderHub(); show('s-hub'); Stage.mode('hub');
}
function renderHub() {
  var pr = C.progress();
  $('#phase').textContent = pr.phase + ' · ' + pr.done + ' / ' + pr.total + ' matches · ' + C.S.langs.length + ' fighters';
  $('#xpbar').style.width = (100 * pr.done / pr.total) + '%';
  $('#sndbtn').innerHTML = S().sound ? SPEAKER_ON : SPEAKER_OFF;
  $$('.tabs button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-tab') === S().tab); });
  var warn = C.STORAGE_OK ? '' : '<div class="warn chamfer">This browser is blocking storage, so progress won’t be saved. Turn off private browsing to keep it.</div>';
  $('#hubbody').innerHTML = warn + (S().tab === 'bracket' ? bracketHTML() : S().tab === 'legends' ? legendsHTML() : groupsHTML());
  var btn = $('#fightbtn'), ch = C.champion();
  btn.disabled = false;
  if (ch) { btn.setAttribute('data-act', 'champ'); btn.textContent = 'Champion: ' + C.name(ch.first) + ' ▸'; }
  else {
    var n = C.nextMatch();
    btn.setAttribute('data-act', 'fight');
    if (n) { var p = C.participants(n); btn.textContent = (n.picks.length ? 'Resume ▸ ' : 'Fight ▸ ') + C.name(p[0]) + ' vs ' + C.name(p[1]); }
    else { btn.textContent = 'No fight ready'; btn.disabled = true; }
  }
  tween('#hubbody .gbox, #hubbody .rt, #hubbody .lrow', { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, stagger: 0.025, ease: 'power2.out' });
}
function sign(n) { return n > 0 ? '+' + n : n < 0 ? '−' + (-n) : '0'; }
function groupsHTML() {
  return '<div class="grid g4">' + C.S.gorder.map(function (g) {
    var ms = C.groupMatches(g), dn = ms.filter(function (m) { return m.done; }).length;
    var h = '<section class="gbox panel chamfer"><h4>Group ' + g + '<small>' + dn + ' / ' + ms.length + '</small></h4>' +
      '<table class="gt"><colgroup><col class="c1"><col class="c2"><col><col class="c4"><col class="c5"></colgroup><tbody>';
    C.standings(g).forEach(function (r, i) {
      var f = C.fate(g, i + 1);
      h += '<tr' + (f ? ' class="' + f + '"' : '') + '><td class="rk">' + (i + 1) + '</td><td><span class="sw6" style="--c:' + col(r.id) + '"></span></td>' +
        '<td class="nm" title="' + E(C.name(r.id)) + '">' + nm(r.id) + '</td><td class="r">' + r.mw + '–' + r.ml + '</td><td class="r">' + sign(r.gw - r.gl) + '</td></tr>';
    });
    h += '</tbody></table><div class="fx">' + ms.map(function (m) {
      var s = C.score(m, m.a, m.b), live = !m.done && m.picks.length > 0;
      var ca = m.done ? (m.winner === m.a ? 'w' : 'lo') : '', cb = m.done ? (m.winner === m.b ? 'w' : 'lo') : '';
      return '<button class="fxb chamfer ' + (live ? 'live' : '') + '" data-open="' + m.id + '" title="' + E(C.name(m.a) + ' vs ' + C.name(m.b)) + '">' +
        '<span class="a ' + ca + '">' + abbr(m.a) + '</span><span class="sc">' + (m.done || live ? s[0] + '–' + s[1] : 'vs') + '</span><span class="b ' + cb + '">' + abbr(m.b) + '</span></button>';
    }).join('') + '</div></section>';
    return h;
  }).join('') + '</div>';
}
function bmHTML(id) {
  var m = C.S.matches[id], p = C.participants(m), a = p[0], b = p[1];
  var s = a && b ? C.score(m, a, b) : [0, 0], ready = C.isReady(m), live = ready && m.picks.length > 0;
  function row(x, src, sc) {
    return '<div class="row ' + (m.done ? (m.winner === x ? 'w' : 'lo') : '') + '">' +
      (x ? '<span class="dot" style="--c:' + col(x) + '"></span>' : '<span class="dot empty"></span>') +
      '<span class="nm">' + (x ? nm(x) : '<span class="tbd">' + E(C.srcLabel(src)) + '</span>') + '</span>' +
      (m.done || live ? '<span class="s">' + sc + '</span>' : '') + '</div>';
  }
  var status = m.done ? 'Final' : live ? 'Duel ' + (m.picks.length + 1) : ready ? 'Fight!' : 'Waiting';
  return '<button class="bm chamfer' + (ready ? ' ready' : '') + (live ? ' live' : '') + '" data-open="' + m.id + '">' + row(a, m.a, s[0]) + row(b, m.b, s[1]) +
    '<div class="foot"><span>' + E(m.short) + (m.bo === 5 ? ' · first to 3' : '') + '</span><span>' + status + '</span></div></button>';
}
function bracketHTML() {
  var st = C.S;
  function sec(title, sub, rounds, names) {
    return '<section class="bsec"><h3>' + title + '</h3><p>' + sub + '</p><div class="grid">' + rounds.map(function (ids, i) {
      return '<div class="rt panel chamfer"><h4>' + E(names[i]) + '</h4>' + ids.map(bmHTML).join('') + '</div>';
    }).join('') + '</div></section>';
  }
  return sec('Upper bracket', 'The ' + st.q + ' qualifiers. Lose once and you fall to the lower bracket.', st.ub, st.ubNames) +
    sec('Lower bracket', 'One more loss here and you’re out.', st.lb, st.lbNames) +
    sec('Grand final', 'Upper champion against lower champion. First to three takes the cup.', [['GF1']], ['Grand Final']);
}
function legendsHTML() {
  var st = C.stats();
  if (!st.total) return '<div class="sheet panel chamfer"><h3>Legends</h3><p class="sub" style="margin:0">Every duel you judge powers up the winner. Fight a few and their power levels show up here.</p></div>';
  var h = '<div class="sheet panel chamfer"><h3>Legends</h3><p class="sub" style="margin:0">Share of duels each fighter won, across ' + st.total + ' duels.</p></div><div class="lgrid">';
  st.rows.forEach(function (r, i) {
    var tag = r.status === 'champ' ? '<span class="tag champ">Champ</span>' : r.status === 'out' ? '<span class="tag out">Out</span>' : '<span class="tag up">Alive</span>';
    h += '<div class="lrow panel chamfer" style="--c:' + col(r.id) + '"><span class="rk">' + (i + 1) + '</span><div><div class="lname">' + nm(r.id) + ' ' + tag + '</div>' +
      '<div class="sub">' + r.w + ' / ' + r.p + ' duels won</div><div class="power"><i style="width:' + (r.pct || 0) + '%"></i></div></div>' +
      '<span class="pct">' + (r.pct == null ? '–' : r.pct + '%') + '</span></div>';
  });
  h += '</div><div class="sheet panel chamfer" style="margin-top:14px"><h3>By category</h3><table class="cat-tbl"><tbody>' + st.cats.map(function (c) {
    return '<tr><td>' + E(C.CATMAP[c.id].name) + '</td><td class="sub">' + c.n + ' duels</td><td>' + (c.top ? '<b>' + nm(c.top) + '</b> <span class="sub">(' + c.topWins + ')</span>' : '<span class="sub">–</span>') + '</td></tr>';
  }).join('') + '</tbody></table></div>';
  return h;
}

/* ======================= match flow ======================= */
var cur = null, busy = false;
function openMatch(id) {
  if (busy || !loaded) return;
  var r = C.prepare(id);
  if (!r.ok) { toast(r.reason); return; }
  cur = { id: id, a: r.a, b: r.b };
  Stage.fighters(r.a, r.b);
  var m = r.m;
  if (m.done) { showResult(true); return; }
  if (C.finished(m)) { showResult(false); return; }
  Snd.play('select');
  if (m.picks.length === 0 && S().intro !== 'skip' && A.on()) versus(m, r.a, r.b).then(startDuel);
  else startDuel();
}
function versus(m, a, b) {
  return new Promise(function (resolve) {
    var done = false, vs = $('#s-vs'), short = S().intro === 'short' || S().anim !== 'full';
    function finish() { if (done) return; done = true; vs.removeEventListener('click', finish); resolve(); }
    $('#vsA').style.setProperty('--c', col(a)); $('#vsB').style.setProperty('--c', col(b));
    $('#vsNameA').innerHTML = nm(a); $('#vsNameB').innerHTML = nm(b);
    $('#vsAbbrA').innerHTML = abbr(a); $('#vsAbbrB').innerHTML = abbr(b);
    $('#vsMoveA').textContent = move(a); $('#vsMoveB').textContent = move(b);
    $('#vsStage').innerHTML = E(m.label) + ' · First to ' + (C.need(m) === 3 ? 'three' : 'two');
    show('s-vs');
    Stage.mode('versus');
    vs.addEventListener('click', finish);
    if (G) {
      G.set(['#vsNameA', '#vsNameB', '#vsMark', '#vsMoveA', '#vsMoveB', '#vsAbbrA', '#vsAbbrB'], { opacity: 0 });
      G.fromTo('#vsA', { xPercent: -100 }, { xPercent: 0, duration: 0.45, ease: 'power4.out' });
      G.fromTo('#vsB', { xPercent: 100 }, { xPercent: 0, duration: 0.45, ease: 'power4.out' });
    }
    Snd.play('whoosh');
    (async function () {
      await A.wait(380); if (done) return;
      tween('#vsAbbrA', { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: 'power2.out' });
      tween('#vsNameA', { scale: 2.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.32, ease: 'back.out(2)' });
      tween('#vsMoveA', { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, delay: 0.2 });
      Snd.play('hit'); Stage.shake(0.35); Stage.pulse(0);
      var da = short ? 0.5 : Snd.anthem(a);
      await A.wait(Math.min(Math.max(da, short ? 0.5 : 1.0), 3.2) * 1000); if (done) return;
      tween('#vsAbbrB', { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: 'power2.out' });
      tween('#vsNameB', { scale: 2.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.32, ease: 'back.out(2)' });
      tween('#vsMoveB', { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, delay: 0.2 });
      Snd.play('hit'); Stage.shake(0.35); Stage.pulse(1);
      var db = short ? 0.5 : Snd.anthem(b);
      await A.wait(Math.min(Math.max(db, short ? 0.5 : 1.0), 3.2) * 1000); if (done) return;
      tween('#vsMark', { scale: 4, opacity: 0, rotation: -30 }, { scale: 1, opacity: 1, rotation: 0, duration: 0.28, ease: 'power4.in' });
      await A.wait(280); if (done) return;
      Snd.play('vs'); Stage.shake(1); flash('#ffffff', 0.7);
      await A.wait(short ? 600 : 1100);
      finish();
    })();
  });
}
function hpHTML(id, hp, need, side) {
  var segs = '';
  for (var i = 1; i < need; i++) segs += '<span class="seg" style="left:' + (100 * i / need) + '%"></span>';
  var w = hp / need;
  return '<div style="--c:' + col(id) + '"><div class="fname">' + (side === 'B' ? '<small>' + abbr(id) + '</small>' + nm(id) : nm(id) + '<small>' + abbr(id) + '</small>') + '</div>' +
    '<div class="hp' + (hp === 1 && need > 1 ? ' low' : '') + '" id="hp' + side + '"><b style="transform:scaleX(' + w + ')"></b><i style="transform:scaleX(' + w + ')"></i>' + segs + '</div>' +
    '<div class="fwins">' + hp + ' / ' + need + ' HP</div></div>';
}
function roundName(m) {
  var s = C.score(m, cur.a, cur.b), need = C.need(m);
  if (s[0] === need - 1 && s[1] === need - 1) return 'Final round';
  if (s[0] === need - 1 || s[1] === need - 1) return 'Match point';
  return 'Round ' + (m.picks.length + 1);
}
function hud(m) {
  var s = C.score(m, cur.a, cur.b), need = C.need(m);
  $('#fA').innerHTML = hpHTML(cur.a, need - s[1], need, 'A');
  $('#fB').innerHTML = hpHTML(cur.b, need - s[0], need, 'B');
  $('#rnd').textContent = roundName(m);
}
function startDuel() {
  renderDuel();
  show('s-match');
  setBand();
  var m = C.S.matches[cur.id], c = C.CHMAP[m.games[m.picks.length]];
  enterCards();
  Snd.play('round');
  banner(roundName(m), c.title);
}
function setBand() {
  requestAnimationFrame(function () {
    var r = $('#arenawin').getBoundingClientRect();
    Stage.mode('match', { bandY: Math.max(0.12, Math.min(0.6, (r.top + r.height / 2) / window.innerHeight)) });
  });
}
function codeHTML(code, id) {
  return C.hl(code, id).split('\n').map(function (l) { return '<span class="ln">' + (l || ' ') + '</span>'; }).join('');
}
function renderDuel() {
  var r = C.prepare(cur.id);
  if (!r.ok) return;
  var m = r.m, n = m.picks.length;
  var c = C.CHMAP[m.games[n]], order = m.flips[n] ? [cur.b, cur.a] : [cur.a, cur.b];
  hud(m);
  $('#chalK').innerHTML = '<span class="cat">' + E(C.CATMAP[c.cat].name) + '</span>' + E(m.label);
  $('#chalT').textContent = c.title;
  $('#chalD').textContent = c.desc;
  $('#cards').classList.remove('away');
  $('#cards').innerHTML = order.map(function (L, k) {
    var code = C.snippet(c.id, L), lines = code.split('\n').length, chars = code.replace(/\s/g, '').length;
    var label = S().blind ? 'Fighter ' + (k + 1) : nm(L);
    return '<div class="fcard panel chamfer" style="--c:' + (S().blind ? '#8d82b8' : col(L)) + '" data-lang="' + L + '"><div class="stripe"></div>' +
      '<div class="top"><span class="nm">' + label + '</span><span class="stats"><span>' + lines + ' lines</span><span>' + chars + ' chars</span></span></div>' +
      '<pre><code>' + codeHTML(code, L) + '</code></pre><button class="choose" data-act="choose" data-lang="' + L + '"><kbd>' + (k + 1) + '</kbd>' +
      (S().blind ? 'Fighter ' + (k + 1) + ' wins' : nm(L) + ' wins') + '</button></div>';
  }).join('');
  $('#undopick').hidden = n === 0;
  requestAnimationFrame(fitCode);
  $$('#s-match .fcard pre').forEach(function (pre) { pre.addEventListener('scroll', function () { pre.parentNode.classList.toggle('more', pre.scrollTop + pre.clientHeight < pre.scrollHeight - 2); }); });
  tween('#chal, #cards', { opacity: 0 }, { opacity: 1, duration: 0.2 });
}
/* Shrinks each snippet's font until it fits its card (down to a readable minimum); past that it scrolls inside. */
var FIT = { s: [8.5, 12], m: [9, 14], l: [10, 16] };
function fitCode() {
  var r = FIT[S().size] || FIT.m;
  $$('#s-match .fcard').forEach(function (card) {
    var pre = card.querySelector('pre'), fs = r[1], minW = Math.max(r[0], r[1] - 3);
    if (!pre) return;
    pre.style.fontSize = fs + 'px';
    /* tall code shrinks to the minimum; a few wide lines only shrink a little, then scroll sideways */
    while ((fs > r[0] && pre.scrollHeight > pre.clientHeight + 1) || (fs > minW && pre.scrollWidth > pre.clientWidth + 1)) { fs -= 0.5; pre.style.fontSize = fs + 'px'; }
    card.classList.toggle('more', pre.scrollHeight > pre.clientHeight + 1);
  });
}
function enterCards() {
  if (!G || !A.on()) return;
  var cards = $$('.fcard');
  if (cards.length !== 2) return;
  G.fromTo(cards[0], { x: -70, opacity: 0, rotateY: 20 }, { x: 0, opacity: 1, rotateY: 0, duration: 0.45, ease: 'power3.out', delay: 0.12 });
  G.fromTo(cards[1], { x: 70, opacity: 0, rotateY: -20 }, { x: 0, opacity: 1, rotateY: 0, duration: 0.45, ease: 'power3.out', delay: 0.22 });
  G.fromTo('#chal h2', { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2)' });
  if (S().reveal === 'animated') {
    cards.forEach(function (card, k) {
      var lines = card.querySelectorAll('.ln');
      G.fromTo(lines, { opacity: 0, x: k ? 14 : -14 }, { opacity: 1, x: 0, duration: 0.18, stagger: Math.min(0.04, 0.9 / Math.max(1, lines.length)), delay: 0.3 + k * 0.08, ease: 'power1.out' });
    });
  }
}
function scrollTop() {
  var el = $('#s-match');
  if (el.scrollTop < 4) return Promise.resolve();
  el.scrollTo({ top: 0, behavior: A.on() ? 'smooth' : 'auto' });
  return A.wait(380);
}
async function choose(L) {
  if (busy || !cur) return;
  var m = C.S.matches[cur.id];
  if (m.done || C.finished(m)) return;
  busy = true;
  var cards = $$('.fcard');
  var win = cards.filter(function (c) { return c.getAttribute('data-lang') === L; })[0];
  var lose = cards.filter(function (c) { return c !== win; })[0];
  var side = L === cur.a ? 0 : 1, other = side ? cur.a : cur.b;
  C.pick(m, L);
  var after = C.score(m, cur.a, cur.b), over = C.finished(m);
  if (S().blind) {
    win.style.setProperty('--c', col(L)); win.querySelector('.nm').innerHTML = nm(L);
    lose.style.setProperty('--c', col(other)); lose.querySelector('.nm').innerHTML = nm(other);
  }
  win.classList.add('won'); lose.classList.add('lost');
  if (A.on()) lose.classList.add('glitch');
  win.querySelector('.choose').innerHTML = S().blind ? 'That was ' + nm(L) : 'Chosen';
  Snd.play('select');
  var plus = document.createElement('div'); plus.className = 'plus'; plus.textContent = '+1'; win.appendChild(plus);
  tween(plus, { y: 10, opacity: 0, scale: 0.6 }, { y: -28, opacity: 1, scale: 1.2, duration: 0.5, ease: 'back.out(3)' });
  Stage.burstAt(win, col(L), 120);
  await A.wait(S().blind ? 900 : 420);

  /* the fight: cards step aside, the winner's special hits the other fighter */
  if (A.on() && Stage.ready && S().gfx !== 'off') {
    await scrollTop();
    $('#cards').classList.add('away');
    tween('#chal, #cards', { opacity: 1 }, { opacity: 0.08, duration: 0.25 });
    Stage.mode('fight');
    combo(nm(L) + ' · ' + E(move(L)) + '!');
    await A.wait(250);
    await Stage.attack(side, { crit: over });
  } else {
    Snd.play('hit');
  }
  flash(col(L), 0.3);
  damage(side ? 'A' : 'B', m, after);
  if (over) {
    await A.wait(300);
    Stage.ko(1 - side);
    var lo = Math.min(after[0], after[1]);
    bigText(lo === 0 ? 'Flawless' : 'K.O.', lo !== 0);
    Stage.victory(side);
    await A.wait(1500);
    busy = false;
    showResult(false);
    return;
  }
  await A.wait(450);
  busy = false;
  renderDuel(); $('#s-match').scrollTop = 0; enterCards(); setBand();
  var c = C.CHMAP[m.games[m.picks.length]];
  Snd.play('round');
  banner(roundName(m), c.title);
}
function combo(html) {
  var el = $('#combo'); el.innerHTML = html;
  if (!G || !A.on()) return;
  G.timeline().fromTo(el, { opacity: 0, scale: 0.4, y: 20 }, { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: 'back.out(3)' })
    .to(el, { opacity: 0, y: -20, duration: 0.35, delay: 0.7 });
}
/* Animates the hit side's health: the bar drops at once, the white chunk drains after it. */
function damage(sideKey, m, sc) {
  var need = C.need(m), hp = need - (sideKey === 'A' ? sc[1] : sc[0]), w = Math.max(0, hp / need);
  var bar = document.getElementById('hp' + sideKey);
  if (!bar) return;
  var fill = bar.querySelector('i'), ghost = bar.querySelector('b');
  if (G && A.on()) { G.to(fill, { scaleX: w, duration: 0.15 }); G.to(ghost, { scaleX: w, duration: 0.6, delay: 0.35, ease: 'power2.in' }); G.fromTo(bar, { x: -6 }, { x: 0, duration: 0.4, ease: 'elastic.out(1,0.3)' }); }
  else { fill.style.transform = ghost.style.transform = 'scaleX(' + w + ')'; }
  bar.classList.toggle('low', hp === 1 && need > 1);
  var label = bar.parentNode.querySelector('.fwins'); if (label) label.textContent = hp + ' / ' + need + ' HP';
  $('#rnd').textContent = C.finished(m) ? 'K.O.' : roundName(m);
}

/* ======================= result + champion ======================= */
var autoT = null;
function showResult(viewOnly) {
  var m = C.S.matches[cur.id], a = cur.a, b = cur.b, s = C.score(m, a, b);
  var w = viewOnly ? m.winner : (s[0] > s[1] ? a : b), l = w === a ? b : a, lo = Math.min(s[0], s[1]);
  $('#resK').textContent = viewOnly ? 'Final' : lo === 0 ? 'Flawless' : 'K.O.';
  $('#resName').innerHTML = nm(w);
  $('#resName').style.textShadow = '0 5px 0 #2a0d3a, 0 0 40px ' + col(w);
  $('#resScore').textContent = (w === a ? s[0] + ' – ' + s[1] : s[1] + ' – ' + s[0]) + '  vs  ' + C.name(l);
  var st = C.stakes(m), line;
  if (m.stage === 'gf') line = nm(w) + ' wins the cup.';
  else if (m.stage === 'group') line = nm(w) + ' takes the points.';
  else line = nm(w) + ' ' + st.win + ' · <span class="bad">' + nm(l) + ' ' + st.lose + '</span>';
  $('#resStakes').innerHTML = viewOnly ? E(m.label) : line;
  $('#resDuels').innerHTML = m.picks.map(function (p, i) {
    var c = C.CHMAP[m.games[i]];
    return '<li class="panel chamfer"><span class="t"><span class="k2">Duel ' + (i + 1) + ' · ' + E(C.CATMAP[c.cat].name) + '</span>' + E(c.title) + '</span>' +
      '<span class="w"><span class="dot" style="--c:' + col(p) + '"></span>' + nm(p) + '</span></li>';
  }).join('');
  $('#resBtns').innerHTML = viewOnly ? '<button class="fight" data-act="to-hub">Back</button>'
    : '<button class="fight" data-act="continue" id="contbtn">Continue</button><button class="ghost chamfer" data-act="undo-last-pick">Undo last pick</button>';
  show('s-result');
  if (viewOnly) { Stage.mode('hub'); return; }
  var ws = w === a ? 0 : 1;
  Stage.mode('result', { winner: ws });
  if (G && A.on()) {
    G.timeline()
      .fromTo('#resK', { scale: 3, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'power4.in' })
      .fromTo('#resName', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'back.out(2)' })
      .fromTo(['#resScore', '#resStakes'], { opacity: 0 }, { opacity: 1, duration: 0.3 })
      .fromTo('#resDuels li', { x: -20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.25, stagger: 0.08 }, '-=0.1')
      .fromTo('#resBtns', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3 });
  }
  setTimeout(function () { Snd.play(lo === 0 ? 'flawless' : 'victory'); Stage.shake(0.6); Stage.celebrate(col(w)); flash(col(w), 0.3); }, A.dur(330));
  setTimeout(function () { if (screen === 's-result') Snd.anthem(w); }, A.dur(1900));
  clearTimeout(autoT);
  if (S().autoContinue) autoT = setTimeout(function () { if (screen === 's-result' && !busy) continueMatch(true); }, Math.max(1800, A.dur(3200)));
}
function continueMatch(auto) {
  clearTimeout(autoT);
  var m = C.S.matches[cur.id], text = C.confirmMatch(m);
  if (!text) return;
  if (C.champion()) { showChampion(); return; }
  cur = null;
  if (auto) { var n = C.nextMatch(); if (n) { toast(text, 2600); openMatch(n.id); return; } }
  openHub();
  toast(text, 4200);
}
function showChampion() {
  var pd = C.podium();
  if (!pd) return;
  cur = null;
  $('#champName').innerHTML = nm(pd.first);
  $('#champName').style.textShadow = '0 6px 0 #3d1659, 0 0 50px ' + col(pd.first);
  $('#champMove').textContent = 'Signature move: ' + move(pd.first);
  $('#podium').innerHTML = '<span class="panel chamfer"><b>2</b>' + nm(pd.second) + '</span>' + (pd.third ? '<span class="panel chamfer"><b>3</b>' + nm(pd.third) + '</span>' : '');
  show('s-champ');
  Stage.mode('champ');
  tween('#champName', { scale: 0.3, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, ease: 'elastic.out(1,0.5)', delay: 0.3 });
  Snd.play('champion'); Stage.shake(0.8); flash('#ffcb3d', 0.5);
  Stage.celebrate(col(pd.first));
  setTimeout(function () { if (screen === 's-champ') Snd.anthem(pd.first); }, A.dur(2600));
}

/* ======================= settings ======================= */
function seg(key, opts) {
  return '<div class="seg" role="group">' + opts.map(function (o) {
    return '<button class="' + (String(S()[key]) === String(o[0]) ? 'on' : '') + '" data-act="seg" data-key="' + key + '" data-v="' + o[0] + '">' + o[1] + '</button>';
  }).join('') + '</div>';
}
function sw(key, title, sub) {
  return '<div class="set"><div><b>' + title + '</b><div class="sub">' + sub + '</div></div><button class="sw' + (S()[key] ? ' on' : '') + '" data-act="toggle" data-key="' + key + '" aria-pressed="' + !!S()[key] + '" aria-label="' + title + '"></button></div>';
}
function row(title, sub, ctl) { return '<div class="set"><div><b>' + title + '</b><div class="sub">' + sub + '</div></div>' + ctl + '</div>'; }
function renderSettings() {
  var last = C.HIST[C.HIST.length - 1];
  $('#setbody').innerHTML =
    '<div class="sheet panel chamfer"><h3>The show</h3>' +
      row('Animations', 'Full cinematics, a lighter cut, or none at all.', seg('anim', [['full', 'Full'], ['lite', 'Lite'], ['off', 'Off']])) +
      row('Speed', 'How fast every animation and fight plays.', seg('speed', [[0.5, '0.5×'], [1, '1×'], [1.5, '1.5×'], [2, '2×'], [3, '3×']])) +
      row('Versus intro', 'The split-screen entrance before each match.', seg('intro', [['full', 'Full'], ['short', 'Short'], ['skip', 'Skip']])) +
      row('Code reveal', 'Snippets type in line by line, or appear at once.', seg('reveal', [['animated', 'Animated'], ['instant', 'Instant']])) +
      sw('bgMotion', 'Background motion', 'The sky, floor, embers and camera drift. Turn off for a still background; the fighters still move.') +
      sw('shake', 'Screen shake', 'The camera jolts on hits and K.O.s.') +
      sw('flashes', 'Flashes', 'Bright full-screen flashes on hits. Turn off if flashing light bothers you.') +
      sw('autoContinue', 'Auto-advance', 'After a result, go straight to the next fight.') +
    '</div>' +
    '<div class="sheet panel chamfer"><h3>Graphics</h3>' +
      row('3D arena', 'High adds full-resolution bloom. Lower it if the game stutters.', seg('gfx', [['high', 'High'], ['medium', 'Medium'], ['low', 'Low'], ['off', 'Off']])) +
      sw('crt', 'CRT scanlines', 'An arcade-monitor overlay.') +
    '</div>' +
    '<div class="sheet panel chamfer"><h3>Sound</h3>' +
      sw('sound', 'Sound', 'Effects and battle cries. On iPhone, silent mode can mute the page.') +
      row('Volume', '', '<input type="range" id="vol" min="0" max="1" step="0.05" value="' + S().volume + '" aria-label="Volume">') +
      '<p class="sub" style="margin:10px 0 0">Battle cries: tap a fighter to hear its theme.</p><div class="sgrid">' +
      C.LANGS.map(function (l) { return '<button class="sbtn chamfer" data-act="preview" data-lang="' + l.id + '"><span class="dot" style="--c:' + l.color + '"></span><span class="n">' + E(l.name) + '</span></button>'; }).join('') + '</div>' +
    '</div>' +
    '<div class="sheet panel chamfer"><h3>Duels</h3>' +
      sw('blind', 'Blind mode', 'Fighters stay anonymous until you choose.') +
      sw('wrap', 'Wrap long lines', 'Easier to read on a narrow phone than sideways scrolling.') +
      row('Code size', '', seg('size', [['s', 'S'], ['m', 'M'], ['l', 'L']])) +
    '</div>' +
    '<div class="sheet panel chamfer"><h3>Tournament</h3>' +
      '<button class="setbtn" data-act="undo-result"' + (last ? '' : ' disabled') + '>Undo last result' + (last ? ' <span class="sub">(' + E(last.label) + ')</span>' : '') + '</button>' +
      '<a class="setbtn" href="plain/" style="color:inherit;text-decoration:none">Active ultra boring mode <span class="sub">(this tournament on a plain page)</span></a>' +
      '<button class="setbtn" data-act="new">Start a new tournament (choose fighters)</button>' +
      '<button class="setbtn" data-act="forget">Forget seen snippets <span class="sub">(' + C.seenTotal() + ' of ' + (C.CH.length * C.LANGS.length) + ' seen)</span></button>' +
      '<button class="setbtn danger" data-act="reset-settings">Reset settings to defaults</button>' +
    '</div>';
}
function openSettings() { renderSettings(); show('s-settings'); }
function closeSettings() {
  if (before === 's-hub') openHub();
  else if (before === 's-select') { show('s-select'); Stage.mode('select'); fitRoster(); }
  else if (before === 's-match' && cur) { startDuel(); }
  else { show(before === 's-settings' ? 's-title' : before); }
}

/* ======================= events ======================= */
document.addEventListener('click', function (e) {
  var t = e.target.closest('[data-tab]');
  if (t) { S().tab = t.getAttribute('data-tab'); A.save(); Snd.play('tick'); renderHub(); $('#s-hub').scrollTop = 0; return; }
  var tile = e.target.closest('[data-tile]');
  if (tile) {
    var id = tile.getAttribute('data-tile'); chosen[id] = !chosen[id];
    Snd.play(chosen[id] ? 'select' : 'deselect');
    refreshSelect();
    tween(tile, { scale: 0.9 }, { scale: 1, duration: 0.35, ease: 'back.out(3)' });
    return;
  }
  var q = e.target.closest('[data-quick]');
  if (q) {
    var k = q.getAttribute('data-quick'), all = C.LANGS.map(function (l) { return l.id; });
    setChosen(k === 'all' ? all : k === 'none' ? [] : k === 'popular' ? C.POPULAR : C.shuffle(all).slice(0, k === 'r8' ? 8 : 16));
    Snd.play('tick'); refreshSelect();
    tween('.tile.on', { scale: 0.85 }, { scale: 1, duration: 0.3, stagger: 0.01, ease: 'back.out(3)' });
    return;
  }
  var o = e.target.closest('[data-open]');
  if (o) { openMatch(o.getAttribute('data-open')); return; }
  var el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  var act = el.getAttribute('data-act');
  switch (act) {
    case 'start':
      Snd.unlock(); Snd.play('vs'); Stage.shake(0.8); flash('#ffcb3d', 0.5);
      if (!C.S) openSelect(); else if (C.champion()) showChampion(); else openHub();
      break;
    case 'sel-back': if (C.S) openHub(); else { show('s-title'); Stage.mode('title'); } break;
    case 'sel-go': startCup(el); break;
    case 'fight': { var n = C.nextMatch(); if (n) openMatch(n.id); break; }
    case 'champ': showChampion(); break;
    case 'skip': break;
    case 'choose': choose(el.getAttribute('data-lang')); break;
    case 'undo-pick':
      if (busy || !cur) return;
      C.undoPick(C.S.matches[cur.id]); renderDuel(); enterCards(); Snd.play('deselect');
      break;
    case 'undo-last-pick':
      if (!cur) return;
      C.undoPick(C.S.matches[cur.id]); Snd.play('deselect'); Stage.revive(); startDuel();
      break;
    case 'leave': if (busy) return; openHub(); break;
    case 'continue': continueMatch(false); break;
    case 'to-hub': openHub(); break;
    case 'see-bracket': S().tab = 'bracket'; A.save(); openHub(); break;
    case 'see-legends': S().tab = 'legends'; A.save(); openHub(); break;
    case 'sound': S().sound = !S().sound; A.save(); Snd.setVolume(); if (S().sound) { Snd.unlock(); Snd.play('select'); } renderHub(); break;
    case 'settings': openSettings(); break;
    case 'close-settings': closeSettings(); break;
    case 'toggle': {
      var key = el.getAttribute('data-key'); S()[key] = !S()[key]; A.save();
      if (key === 'sound') { Snd.setVolume(); if (S().sound) Snd.unlock(); }
      Snd.play('tick'); renderSettings(); break;
    }
    case 'seg': {
      var sk = el.getAttribute('data-key'), v = el.getAttribute('data-v');
      S()[sk] = sk === 'speed' ? parseFloat(v) : v; A.save();
      if (sk === 'gfx') Stage.quality(v);
      Snd.play('tick'); renderSettings();
      if (sk === 'anim' || sk === 'speed') toast(v === 'off' ? 'Animations off: results appear instantly.' : 'Animations: ' + (sk === 'speed' ? v + '× speed' : v));
      break;
    }
    case 'preview': Snd.unlock(); if (!S().sound) toast('Sound is off'); else Snd.anthem(el.getAttribute('data-lang')); break;
    case 'undo-result': {
      var h = C.undoResult();
      if (!h) return;
      C.undoPick(C.S.matches[h.id]);
      toast('Undid ' + h.label + '. Pick the last duel again.');
      openMatch(h.id);
      break;
    }
    case 'new':
      if (screen === 's-settings' && el.getAttribute('data-armed') !== '1' && C.S && C.progress().done > 0 && !C.champion()) {
        el.setAttribute('data-armed', '1'); el.textContent = 'Tap again: you’ll pick fighters for a new cup';
        return;
      }
      openSelect(); break;
    case 'forget':
      if (el.getAttribute('data-armed') !== '1') { el.setAttribute('data-armed', '1'); el.textContent = 'Tap again to forget every seen snippet'; return; }
      C.forgetSeen(); renderSettings(); toast('Seen snippets forgotten'); break;
    case 'reset-settings':
      A.reset(); Stage.quality(S().gfx); Snd.setVolume(); renderSettings(); toast('Settings reset'); break;
  }
});
document.addEventListener('input', function (e) {
  if (e.target.id === 'vol') { S().volume = parseFloat(e.target.value); A.save(); Snd.setVolume(); }
});
document.addEventListener('change', function (e) { if (e.target.id === 'vol') { Snd.unlock(); Snd.play('select'); } });
document.addEventListener('keydown', function (e) {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (screen === 's-match' && !busy) {
    var cards = $$('.fcard');
    if ((e.key === '1' || e.key === 'ArrowLeft') && cards[0]) { e.preventDefault(); choose(cards[0].getAttribute('data-lang')); }
    else if ((e.key === '2' || e.key === 'ArrowRight') && cards[1]) { e.preventDefault(); choose(cards[1].getAttribute('data-lang')); }
    else if ((e.key === 'u' || e.key === 'U') && !$('#undopick').hidden) { C.undoPick(C.S.matches[cur.id]); renderDuel(); enterCards(); }
    else if (e.key === 'Escape') openHub();
  } else if (screen === 's-result' && e.key === 'Enter' && $('#contbtn')) continueMatch(false);
  else if (screen === 's-title' && e.key === 'Enter' && loaded) $('#startbtn').click();
});
/* Picks the roster's columns so the 32 tiles fill the space with near-square tiles. */
function fitRoster() {
  var el = $('#roster');
  if (!el || screen !== 's-select') return;
  var b = el.getBoundingClientRect(), n = C.LANGS.length, gap = 6, best = null;
  for (var c = 2; c <= 10; c++) {
    var rows = Math.ceil(n / c), w = (b.width - gap * (c - 1)) / c, h = (b.height - gap * (rows - 1)) / rows;
    if (h < 34) continue;
    var score = Math.abs(Math.log(w / h / 1.05));
    if (!best || score < best.score) best = { c: c, rows: rows, score: score };
  }
  if (!best) best = { c: 8, rows: Math.ceil(n / 8) };
  el.style.gridTemplateColumns = 'repeat(' + best.c + ', minmax(0,1fr))';
  el.style.gridTemplateRows = 'repeat(' + best.rows + ', minmax(0,1fr))';
}
window.addEventListener('resize', function () { if (screen === 's-match' && !busy) { setBand(); fitCode(); } fitRoster(); });

boot();
})();
