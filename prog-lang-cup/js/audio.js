/* All sound is synthesized with Web Audio: effects plus a short theme per language.
   Exposes one global: Snd. Audio starts only after the first tap (browser rule). */
var Snd = (function () {
'use strict';
var ctx = null, master = null, noiseBuf = null;
function vol() { return Arena.SET.sound ? Arena.SET.volume : 0; }
function unlock() {
  var AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  if (!ctx) {
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
    try { ctx = new AC(); } catch (e) { return; }
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 5; comp.attack.value = 0.003; comp.release.value = 0.2;
    master = ctx.createGain(); master.gain.value = vol();
    master.connect(comp); comp.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume();
}
function setVolume() { if (master) master.gain.setTargetAtTime(vol(), ctx.currentTime, 0.02); }
function ok() { return ctx && Arena.SET.sound && Arena.SET.volume > 0; }
/* Effects follow the speed setting, so a 3× game also sounds snappier. */
function sp() { return Math.max(0.6, Math.min(1, 1 / Math.sqrt(Arena.SET.speed))); }
function tone(type, f0, f1, t, dur, vol, attack) {
  var o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t);
  if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + (attack || 0.008));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
}
function noise(t, dur, vol, type, f0, f1, q) {
  var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noiseBuf; s.loop = true;
  f.type = type || 'lowpass'; f.Q.value = q || 0.8; f.frequency.setValueAtTime(f0, t);
  if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.05);
}
function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
var sfx = {
  tick: function (t) { tone('square', 1800, 1200, t, 0.04, 0.05); },
  select: function (t) { tone('square', 660, 990, t, 0.09, 0.12); tone('square', 990, 1320, t + 0.06, 0.1, 0.1); },
  deselect: function (t) { tone('square', 700, 420, t, 0.09, 0.09); },
  whoosh: function (t, s) { noise(t, 0.45 * s, 0.5, 'bandpass', 300, 3200, 1.4); },
  charge: function (t, s) { tone('sawtooth', 110, 880, t, 0.5 * s, 0.09, 0.2); noise(t, 0.5 * s, 0.25, 'bandpass', 400, 5000, 2); },
  zap: function (t, s) { tone('square', 1400, 180, t, 0.25 * s, 0.14); tone('sawtooth', 2200, 300, t, 0.2 * s, 0.06); },
  hit: function (t) { tone('sine', 170, 38, t, 0.35, 0.9); tone('square', 110, 50, t, 0.12, 0.25); noise(t, 0.16, 0.7, 'highpass', 1800, 600); },
  crit: function (t) { tone('sine', 220, 30, t, 0.6, 1); noise(t, 0.5, 0.8, 'lowpass', 6000, 200); tone('sawtooth', 880, 110, t, 0.4, 0.12); },
  round: function (t) { tone('sine', 196, 190, t, 1.4, 0.5, 0.004); tone('sine', 392, 388, t, 1.1, 0.25, 0.004); tone('sine', 587, 580, t, 0.8, 0.12, 0.004); noise(t, 0.08, 0.4, 'highpass', 4000); },
  vs: function (t) {
    tone('sine', 120, 30, t, 1.1, 1); noise(t, 0.9, 0.6, 'lowpass', 2400, 120);
    tone('square', 220, 218, t, 0.8, 0.12); tone('square', 233, 230, t, 0.8, 0.1); tone('sawtooth', 440, 435, t, 0.6, 0.06);
  },
  ko: function (t) {
    tone('sine', 90, 22, t, 1.6, 1); noise(t, 1.4, 0.9, 'lowpass', 8000, 90);
    [64, 60, 55, 48].forEach(function (n, i) { tone('sawtooth', mtof(n), mtof(n) * 0.97, t + 0.35 + i * 0.16, 0.4, 0.1); });
  },
  victory: function (t) {
    [72, 76, 79, 84].forEach(function (n, i) { tone('sawtooth', mtof(n), 0, t + i * 0.11, 0.22, 0.13); tone('square', mtof(n) * 1.003, 0, t + i * 0.11, 0.22, 0.07); });
    [72, 76, 79, 84, 88].forEach(function (n) { tone('sawtooth', mtof(n), 0, t + 0.48, 1.3, 0.07, 0.04); });
    tone('sine', 90, 40, t + 0.48, 0.8, 0.7); noise(t + 0.48, 1.2, 0.25, 'highpass', 6000, 3000);
  },
  flawless: function (t) {
    [72, 79, 84, 88, 91, 96].forEach(function (n, i) { tone('triangle', mtof(n), 0, t + i * 0.08, 0.5, 0.12); tone('sawtooth', mtof(n) * 0.5, 0, t + i * 0.08, 0.3, 0.05); });
    noise(t + 0.4, 1.6, 0.3, 'highpass', 9000, 5000);
  },
  champion: function (t) {
    var seq = [60, 64, 67, 72, 67, 72, 76, 79];
    seq.forEach(function (n, i) { tone('sawtooth', mtof(n), 0, t + i * 0.13, 0.26, 0.11); tone('triangle', mtof(n + 12), 0, t + i * 0.13, 0.2, 0.06); });
    var e = t + seq.length * 0.13;
    [60, 64, 67, 72, 76, 84].forEach(function (n) { tone('sawtooth', mtof(n), 0, e, 2.6, 0.06, 0.06); tone('square', mtof(n) * 0.998, 0, e, 2.6, 0.03, 0.06); });
    tone('sine', 110, 28, e, 1.6, 1); noise(e, 2.2, 0.35, 'lowpass', 5000, 200);
  },
  firework: function (t) { noise(t, 0.6, 0.5, 'bandpass', 2000, 300, 0.7); tone('sine', 600 + Math.random() * 600, 120, t, 0.4, 0.08); }
};
function play(name) { if (!ok()) return; unlock(); try { sfx[name](ctx.currentTime + 0.01, sp()); } catch (e) {} }
function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
/* A short theme generated from the language id: same language, same tune. Returns its length in seconds. */
function anthem(id) {
  if (!ok()) return 0;
  unlock();
  var t = ctx.currentTime + 0.02;
  var h = hash(id), root = 45 + (h % 12), minor = (h >>> 4) % 2 === 1;
  var steps = minor ? [0, 3, 7, 10, 12, 15] : [0, 4, 7, 11, 12, 16];
  var waves = ['sawtooth', 'square', 'triangle'], wave = waves[(h >>> 6) % 3];
  var patterns = [[0, 2, 4, 5], [0, 4, 2, 5], [2, 0, 4, 5], [0, 2, 5, 4], [4, 2, 0, 5]];
  var pat = patterns[(h >>> 9) % patterns.length], gap = (0.12 + ((h >>> 12) % 3) * 0.02) * sp();
  tone('sine', 140, 34, t, 0.5, 0.9);
  noise(t, 0.25, 0.4, 'lowpass', 3000, 300);
  pat.forEach(function (st, i) {
    var f = mtof(root + 12 + steps[st]);
    tone(wave, f, 0, t + i * gap, gap * 1.6, 0.13);
    tone(wave, f * 1.006, 0, t + i * gap, gap * 1.6, 0.07);
  });
  var e = t + pat.length * gap;
  [0, 2, 4].forEach(function (st) { tone(wave, mtof(root + 12 + steps[st]), 0, e, 0.9, 0.08, 0.03); });
  tone('sine', mtof(root), mtof(root) * 0.98, e, 0.9, 0.35);
  noise(e, 0.5, 0.35, 'bandpass', 900, 5000, 0.6);
  return pat.length * gap + 0.9;
}
return { unlock: unlock, play: play, anthem: anthem, setVolume: setVolume, hash: hash };
})();
