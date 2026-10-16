/* Player settings and the timing helpers every animation goes through.
   Exposes one global: Arena (settings + dur/wait), shared by audio.js, stage.js and app.js. */
var Arena = (function () {
'use strict';
var KEY = 'langcup-arena:settings:v2';
var REDUCE = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
var SMALL = Math.min(window.innerWidth, window.innerHeight) < 600;

var DEFAULTS = {
  sound: true, volume: 0.8,
  anim: REDUCE ? 'lite' : 'full',     /* full | lite | off */
  speed: 1,                           /* 0.5 | 1 | 1.5 | 2 | 3 */
  intro: REDUCE ? 'short' : 'full',   /* full | short | skip */
  gfx: SMALL ? 'medium' : 'high',     /* high | medium | low | off */
  shake: !REDUCE, flashes: !REDUCE, reveal: 'animated', crt: false,
  blind: false, wrap: false, size: 'm', autoContinue: false, tab: 'groups'
};
var SET = Object.assign({}, DEFAULTS, Cup.store.get(KEY) || {});

function save() { Cup.store.set(KEY, SET); apply(); }
function reset() { var tab = SET.tab; SET = Object.assign({}, DEFAULTS, { tab: tab }); save(); }

/* How long an effect should take, in ms, after speed and animation level. Zero when animations are off. */
function dur(ms) {
  if (SET.anim === 'off') return 0;
  return ms / SET.speed * (SET.anim === 'lite' ? 0.55 : 1);
}
function wait(ms) { var d = dur(ms); return new Promise(function (r) { d ? setTimeout(r, d) : r(); }); }
function cine() { return SET.anim === 'full'; }
function on() { return SET.anim !== 'off'; }

function apply() {
  if (window.gsap) gsap.globalTimeline.timeScale(SET.anim === 'off' ? 40 : SET.speed * (SET.anim === 'lite' ? 1.8 : 1));
  var c = document.documentElement.classList;
  c.toggle('crt', !!SET.crt);
  c.toggle('calm', SET.anim !== 'full');
  c.toggle('no3d', SET.gfx === 'off' || !window.THREE);
  document.body.classList.toggle('wrap-on', !!SET.wrap);
  document.body.classList.remove('sz-s', 'sz-m', 'sz-l');
  document.body.classList.add('sz-' + SET.size);
}

return { get SET() { return SET; }, set SET(v) { SET = v; }, save: save, reset: reset, apply: apply, dur: dur, wait: wait, cine: cine, on: on, REDUCE: REDUCE };
})();
