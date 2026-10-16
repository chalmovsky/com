/* Programming Language Cup engine: languages, challenges, highlighting, tournament rules, saving. Shared with the Plain page. Exposes one global: Cup. */
var Cup = (function () {
'use strict';
var VERSION = 2;

var LANGS = [
  { id: 'python', name: 'Python', color: '#3776AB', abbr: 'PY', move: 'Indent Strike' },
  { id: 'javascript', name: 'JavaScript', color: '#F0DB4F', abbr: 'JS', move: 'Callback Cascade' },
  { id: 'typescript', name: 'TypeScript', color: '#3178C6', abbr: 'TS', move: 'Type Guard' },
  { id: 'rust', name: 'Rust', color: '#DEA584', abbr: 'RS', move: 'Borrow Check' },
  { id: 'go', name: 'Go', color: '#00ADD8', abbr: 'GO', move: 'Goroutine Swarm' },
  { id: 'c', name: 'C', color: '#A8B9CC', abbr: 'C', move: 'Segfault Slam' },
  { id: 'cpp', name: 'C++', color: '#00599C', abbr: 'C++', move: 'Template Barrage' },
  { id: 'java', name: 'Java', color: '#E76F00', abbr: 'JAVA', move: 'Factory Factory' },
  { id: 'kotlin', name: 'Kotlin', color: '#7F52FF', abbr: 'KT', move: 'Null-Safe Kick' },
  { id: 'swift', name: 'Swift', color: '#F05138', abbr: 'SWIFT', move: 'Optional Chain' },
  { id: 'csharp', name: 'C#', color: '#9B4F96', abbr: 'C#', move: 'LINQ Lash' },
  { id: 'ruby', name: 'Ruby', color: '#CC342D', abbr: 'RB', move: 'Monkey Patch' },
  { id: 'php', name: 'PHP', color: '#777BB4', abbr: 'PHP', move: 'Elephant Stomp' },
  { id: 'haskell', name: 'Haskell', color: '#5E5086', abbr: 'HS', move: 'Monad Bind' },
  { id: 'elixir', name: 'Elixir', color: '#A06CC4', abbr: 'EX', move: 'Pipe Cannon' },
  { id: 'lua', name: 'Lua', color: '#4054C8', abbr: 'LUA', move: 'Metatable Twist' },
  { id: 'dart', name: 'Dart', color: '#0175C2', abbr: 'DART', move: 'Hot Reload' },
  { id: 'scala', name: 'Scala', color: '#DC322F', abbr: 'SCALA', move: 'Implicit Ambush' },
  { id: 'zig', name: 'Zig', color: '#F7A41D', abbr: 'ZIG', move: 'Comptime Crush' },
  { id: 'julia', name: 'Julia', color: '#9558B2', abbr: 'JL', move: 'Multiple Dispatch' },
  { id: 'r', name: 'R', color: '#276DC3', abbr: 'R', move: 'Vector Volley' },
  { id: 'perl', name: 'Perl', color: '#39457E', abbr: 'PERL', move: 'Regex Rampage' },
  { id: 'clojure', name: 'Clojure', color: '#63B132', abbr: 'CLJ', move: 'Paren Barrage' },
  { id: 'fsharp', name: 'F#', color: '#378BBA', abbr: 'F#', move: 'Pipeline Punch' },
  { id: 'ocaml', name: 'OCaml', color: '#EC6813', abbr: 'ML', move: 'Functor Fury' },
  { id: 'erlang', name: 'Erlang', color: '#A90533', abbr: 'ERL', move: 'Let It Crash' },
  { id: 'nim', name: 'Nim', color: '#FFE953', abbr: 'NIM', move: 'Macro Missile' },
  { id: 'crystal', name: 'Crystal', color: '#C9D3E6', abbr: 'CR', move: 'Fiber Flurry' },
  { id: 'gleam', name: 'Gleam', color: '#FFAFF3', abbr: 'GLM', move: 'Lucy Shine' },
  { id: 'bash', name: 'Bash', color: '#4EAA25', abbr: 'SH', move: 'Pipe Storm' },
  { id: 'objc', name: 'Objective-C', color: '#438EFF', abbr: 'OBJC', move: 'Message Send' },
  { id: 'lisp', name: 'Common Lisp', color: '#3FB68B', abbr: 'LISP', move: 'Lambda Lunge' }
];
var CLASSIC = LANGS.slice(0, 16).map(function (l) { return l.id; });
var LMAP = {};
LANGS.forEach(function (l) { LMAP[l.id] = l; });

var CATS = [
  { id: 'basics', name: 'Basics' }, { id: 'data', name: 'Data & types' }, { id: 'text', name: 'Text & formats' },
  { id: 'system', name: 'Files & system' }, { id: 'web', name: 'Concurrency & web' }, { id: 'apps', name: 'Apps & tooling' }
];
var CATMAP = {};
CATS.forEach(function (c) { CATMAP[c.id] = c; });

var CH = [
  { id: 'hello', cat: 'basics', title: 'Hello, World', desc: 'The classic first program.' },
  { id: 'fizzbuzz', cat: 'basics', title: 'FizzBuzz', desc: 'Print 1–100, but multiples of 3 → “Fizz”, of 5 → “Buzz”, of both → “FizzBuzz”.' },
  { id: 'pipeline', cat: 'basics', title: 'Map · Filter · Reduce', desc: 'Sum the squares of the even numbers from 1 to 10.' },
  { id: 'closures', cat: 'basics', title: 'Closures', desc: 'A function that returns a counter; each call adds one. Two counters stay independent.' },
  { id: 'errors', cat: 'basics', title: 'Error Handling', desc: 'Parse "42" and "abc" as integers and handle the one that fails.' },
  { id: 'point', cat: 'data', title: 'Custom Type', desc: 'A Point type with a method that measures the distance to another point.' },
  { id: 'shapes', cat: 'data', title: 'Pattern Matching', desc: 'Area of a circle or a rectangle, using a sum type / variant.' },
  { id: 'stack', cat: 'data', title: 'Generic Stack', desc: 'A stack for any element type with push, pop and peek; popping an empty stack is handled.' },
  { id: 'sort', cat: 'data', title: 'Sorting Records', desc: 'Sort people by age, then by name.' },
  { id: 'wordcount', cat: 'data', title: 'Word Frequency', desc: 'Count how many times each word appears in a sentence.' },
  { id: 'regex', cat: 'text', title: 'Regular Expressions', desc: 'Find every YYYY-MM-DD date in a sentence and print its year, month and day.' },
  { id: 'escape', cat: 'text', title: 'Escape HTML', desc: 'Make user text safe for a web page: & < > " \' become HTML entities.' },
  { id: 'json', cat: 'text', title: 'JSON', desc: 'Parse a JSON object, change two fields and print it back as JSON.' },
  { id: 'csv', cat: 'text', title: 'CSV', desc: 'Read sales.csv (product, qty, price) and print the total revenue.' },
  { id: 'dates', cat: 'text', title: 'Dates and Times', desc: 'Today as YYYY-MM-DD, the date 30 days from now, and the weekday of 2000-01-01.' },
  { id: 'file', cat: 'system', title: 'Read a File', desc: 'Print every line of notes.txt with its line number.' },
  { id: 'args', cat: 'system', title: 'Command-line Arguments', desc: 'Greet every name passed on the command line, or print usage and exit with an error.' },
  { id: 'shell', cat: 'system', title: 'Run a Command', desc: 'Run git --version as a subprocess and print its output or the failure.' },
  { id: 'input', cat: 'system', title: 'Read User Input', desc: 'Ask for a name and an age, then reply — and handle an age that is not a number.' },
  { id: 'random', cat: 'system', title: 'Random Numbers', desc: 'Roll two dice, then shuffle five cards and draw three.' },
  { id: 'concurrency', cat: 'web', title: 'Concurrency', desc: 'Run two slow tasks at the same time and wait for both.' },
  { id: 'producer', cat: 'web', title: 'Producer and Consumer', desc: 'One task sends 1–5 through a channel or queue, another prints them, and both finish cleanly.' },
  { id: 'url', cat: 'web', title: 'Parse a URL', desc: 'Split a URL into scheme, host, port, path, decoded query parameters and fragment.' },
  { id: 'http', cat: 'web', title: 'HTTP GET Request', desc: 'Fetch https://example.com and print the status code and body length, handling failure.' },
  { id: 'server', cat: 'web', title: 'Web Server', desc: 'Serve GET /hello with “Hello, web!” on port 8080 and 404 for everything else.' },
  { id: 'gui', cat: 'apps', title: 'Desktop Window', desc: 'A window with a label and a button; each click increases the count in the label.' },
  { id: 'sqlite', cat: 'apps', title: 'SQLite Database', desc: 'Create a table in memory, insert three users with placeholders, and query those over 30.' },
  { id: 'tests', cat: 'apps', title: 'Unit Test', desc: 'An add() function with unit tests in the usual test framework, including a table of cases.' },
  { id: 'template', cat: 'apps', title: 'HTML Template', desc: 'Render a product list into HTML, escaping the names: the view layer of a web app.' },
  { id: 'todo', cat: 'apps', title: 'To-do CLI App', desc: 'todo add / list / done, with the items kept in todo.txt.' }
];
var CHMAP = {};
CH.forEach(function (c) { CHMAP[c.id] = c; });

/* ---------- syntax highlighting (emits <span class="t-x">) ---------- */
var JS_KW = 'const let var function return if else for of in while new class this async await try catch throw switch case default break continue import export from typeof null undefined true false extends static';
var C_KW = 'int char void return if else for while switch case default break continue struct typedef enum union const static sizeof long double float unsigned size_t NULL bool';
var KW_SRC = {
  python: 'def class return if elif else for in while import from as with try except finally raise async await lambda None True False and or not is match case pass yield',
  javascript: JS_KW,
  typescript: JS_KW + ' type interface public private readonly implements number string boolean void enum as keyof never unknown',
  rust: 'fn let mut struct impl enum match if else for in while loop return use pub self Self mod trait where as move ref true false Some None Ok Err async await dyn',
  go: 'package import func return if else for range switch case default type struct interface map chan go defer var const nil true false continue break select',
  c: C_KW,
  cpp: C_KW + ' auto class namespace using template typename public private new delete try catch throw true false nullptr',
  java: 'public private protected static void class interface record sealed permits implements extends new return if else for while switch case default try catch throw throws final var int double long boolean true false null import this',
  kotlin: 'fun val var class data sealed interface object when is in if else for while return import true false null suspend private override',
  swift: 'func let var struct class enum case switch default if else guard for in while return import throws throw try do catch async await self true false nil some',
  csharp: 'var new class record struct interface abstract static public private return if else foreach for in while switch case default try catch throw async await using namespace int double string bool true false null out',
  ruby: 'def end class module if elsif else unless case in when then do while until return yield begin rescue ensure raise nil true false self puts attr_reader require',
  php: 'function return if else elseif foreach as for while echo new class interface final public private readonly static try catch throw match default fn use true false null implements instanceof float int string require exit',
  haskell: 'module import qualified where let in do case of if then else data type newtype class instance deriving',
  elixir: 'def defp defmodule defstruct do end fn case cond with for if else true false nil when receive after',
  lua: 'local function return if then elseif else end for in do while repeat until and or not nil true false',
  dart: 'import void main var final const class extends implements return if else for in while switch case default break continue new this async await try catch on throw true false null late required static',
  scala: 'def val var object class case trait extends with import match if else for yield while return new true false null given using then do enum sealed final private override lazy',
  zig: 'const var fn pub return if else for while switch try catch defer errdefer struct enum union error comptime orelse unreachable undefined null true false and or test inline',
  julia: 'function end return if elseif else for in while do let begin struct mutable using import module try catch finally true false nothing const local global',
  r: 'function if else for in while repeat return next break TRUE FALSE NULL NA library',
  perl: 'my our sub use if elsif else unless for foreach while return print say last next die eval local package require',
  clojure: 'defn def let fn if when cond do loop recur ns require import doseq for nil true false',
  fsharp: 'let mutable fun function match with if then else elif for in do while type of open module rec return yield async task true false member new use',
  ocaml: 'let rec in fun function match with if then else for to do done while type of open module struct sig end begin true false mutable ref',
  erlang: 'module export fun case of end if receive after when try catch begin spawn',
  nim: 'proc func let var const type object ref import from if elif else for in while case of return result echo discard true false nil and or not iterator template try except finally raise',
  crystal: 'def end class struct module require if elsif else unless case when in then do while until return yield begin rescue ensure raise nil true false self puts spawn record',
  gleam: 'pub fn let import type case if use as const assert todo panic opaque True False Nil',
  bash: 'if then else elif fi for in do done while until case esac function return local echo exit export read set',
  objc: C_KW + ' id self super nil YES NO BOOL instancetype nonatomic strong weak',
  lisp: 'defun defvar defparameter defmacro defstruct defclass let lambda if when unless cond loop do dolist dotimes progn setf format nil t return'
};
var KW = {};
Object.keys(KW_SRC).forEach(function (k) {
  var s = {};
  KW_SRC[k].split(' ').forEach(function (w) { s[w] = 1; });
  KW[k] = s;
});
var CB = [['/*', '*/']], HASH = '(?<![\\w$\\{])#';
var HLCFG = {
  python: { c: [HASH], sq: 1, meta: '@\\w+' },
  javascript: { c: ['//'], b: CB, sq: 1, bt: 1, rx: 1 },
  typescript: { c: ['//'], b: CB, sq: 1, bt: 1, rx: 1 },
  rust: { c: ['//'], b: CB, meta: '#!?\\[[^\\]\\n]*\\]' },
  go: { c: ['//'], b: CB, bt: 1 },
  c: { c: ['//'], b: CB, sq: 1, meta: '#\\s*\\w+[^\\n]*' },
  cpp: { c: ['//'], b: CB, sq: 1, meta: '#\\s*\\w+[^\\n]*' },
  java: { c: ['//'], b: CB, meta: '@\\w+' },
  kotlin: { c: ['//'], b: CB, meta: '@\\w+' },
  swift: { c: ['//'], b: CB, meta: '@\\w+' },
  csharp: { c: ['//'], b: CB, sq: 1 },
  ruby: { c: [HASH], sq: 1, sym: 1, rx: 1 },
  php: { c: ['//', HASH], b: CB, sq: 1, vars: '\\$\\w+', meta: '<\\?php' },
  haskell: { c: ['--'], b: [['{-', '-}']] },
  elixir: { c: [HASH], sym: 1, meta: '@\\w+' },
  lua: { c: ['--'], b: [['--[[', ']]']], sq: 1 },
  dart: { c: ['//'], b: CB, sq: 1, meta: '@\\w+' },
  scala: { c: ['//'], b: CB, meta: '@\\w+' },
  zig: { c: ['//'], meta: '@\\w+' },
  julia: { c: [HASH], meta: '@\\w+', sym: 1 },
  r: { c: [HASH], sq: 1 },
  perl: { c: [HASH], sq: 1, vars: '[$@%]\\w+', rx: 1 },
  clojure: { c: [';'], sym: 1 },
  fsharp: { c: ['//'], b: [['(*', '*)']] },
  ocaml: { c: [], b: [['(*', '*)']] },
  erlang: { c: ['%'], sq: 1, meta: '-\\w+' },
  nim: { c: [HASH] },
  crystal: { c: [HASH], sym: 1, rx: 1 },
  gleam: { c: ['//'] },
  bash: { c: [HASH], sq: 1, vars: '\\$\\{?\\w+\\}?' },
  objc: { c: ['//'], b: CB, meta: '#\\s*\\w+[^\\n]*|@\\w+' },
  lisp: { c: [';'], b: [['#|', '|#']], sym: 1 }
};
var reCache = {};
function reEsc(s) { return s.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&'); }
function getRe(lang) {
  if (reCache[lang]) return reCache[lang];
  var c = HLCFG[lang] || { c: ['//'] }, p = [], com = [];
  (c.b || []).forEach(function (pair) { com.push(reEsc(pair[0]) + '[\\s\\S]*?(?:' + reEsc(pair[1]) + '|$)'); });
  (c.c || []).forEach(function (s) { com.push((s === HASH ? s : reEsc(s)) + '[^\\n]*'); });
  if (com.length) p.push('(?<c>' + com.join('|') + ')');
  if (c.meta) p.push('(?<m>' + c.meta + ')');
  /* a regex literal: a slash where a value is expected (after ( , = : [ ! & | ? { } ; ~ or a line start) */
  if (c.rx) p.push('(?<r>(?<=(?:^|[\\n(,=:\\[!&|?{};~])[ \\t]*)\\/(?![\\/*\\s])(?:\\\\.|\\[(?:\\\\.|[^\\]\\\\\\n])*\\]|[^\\/\\\\\\n])+\\/[a-z]*)');
  var s = '"(?:\\\\.|[^"\\\\])*"';
  if (c.sq) s += "|'(?:\\\\.|[^'\\\\\\n])*'";
  if (c.bt) s += '|`(?:\\\\.|[^`\\\\])*`';
  p.push('(?<s>' + s + ')');
  if (c.vars) p.push('(?<v>' + c.vars + ')');
  if (c.sym) p.push('(?<y>(?<![\\w:]):[a-z_][\\w-]*[?!]?)');
  p.push('(?<n>\\b\\d+(?:\\.\\d+)?)');
  p.push('(?<w>[A-Za-z_]\\w*[!?]?)');
  return (reCache[lang] = new RegExp(p.join('|'), 'g'));
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, function (ch) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
  });
}
function hl(code, lang) {
  var re = getRe(lang), kw = KW[lang] || {}, out = '', last = 0, m;
  re.lastIndex = 0;
  while ((m = re.exec(code))) {
    if (!m[0]) { re.lastIndex++; continue; }
    out += esc(code.slice(last, m.index));
    var g = m.groups, cls = '';
    if (g.c != null) cls = 'c';
    else if (g.m != null) cls = 'm';
    else if (g.s != null || g.r != null) cls = 's';
    else if (g.v != null) cls = 'v';
    else if (g.y != null) cls = 'y';
    else if (g.n != null) cls = 'n';
    else {
      var w = m[0];
      if (kw[w]) cls = 'k';
      else if (w.charAt(w.length - 1) === '!' || code.charAt(re.lastIndex) === '(') cls = 'f';
      else if (/^[A-Z]/.test(w)) cls = 't';
    }
    out += cls ? '<span class="t-' + cls + '">' + esc(m[0]) + '</span>' : esc(m[0]);
    last = re.lastIndex;
  }
  return out + esc(code.slice(last));
}

/* ---------- snippets ---------- */
var SNIP = {};
function loadSnippets(raw) {
  var re = /^@@ (\S+) (\S+)[ \t]*$/gm, marks = [], m;
  while ((m = re.exec(raw))) marks.push({ ch: m[1], lang: m[2], start: m.index, body: re.lastIndex });
  marks.forEach(function (mk, i) {
    var end = i + 1 < marks.length ? marks[i + 1].start : raw.length;
    var body = raw.slice(mk.body, end).replace(/^\r?\n/, '').replace(/\s+$/, '').replace(/<\\\/script/gi, '</script');
    if (!SNIP[mk.ch]) SNIP[mk.ch] = {};
    SNIP[mk.ch][mk.lang] = body;
  });
}
function has(ch, lang) { return !!(SNIP[ch] && SNIP[ch][lang]); }
function snippet(ch, lang) { return has(ch, lang) ? SNIP[ch][lang] : '(this snippet is missing)'; }
function snippetCount() {
  var n = 0;
  Object.keys(SNIP).forEach(function (c) { if (CHMAP[c]) n += Object.keys(SNIP[c]).filter(function (l) { return LMAP[l]; }).length; });
  return n;
}

/* ---------- storage ---------- */
var store = {
  get: function (k) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
  set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
};
var STORAGE_OK = (function () {
  try { localStorage.setItem('__langcup_test', '1'); localStorage.removeItem('__langcup_test'); return true; } catch (e) { return false; }
})();

/* ---------- format ---------- */
function shuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}
/* Groups of 3–5 (about 4 each); the playoff takes 4, 8 or 16 languages, group winners first. */
function plan(n) {
  var g = n <= 5 ? 1 : Math.round(n / 4);
  var q = Math.max(4, Math.min(16, Math.pow(2, Math.floor(Math.log2(2 * g)))));
  if (q > n) q = n;
  var sizes = [];
  for (var i = 0; i < g; i++) sizes.push(Math.floor(n / g) + (i < n % g ? 1 : 0));
  var gm = sizes.reduce(function (t, s) { return t + s * (s - 1) / 2; }, 0);
  var pm = 2 * q - 2; /* upper q-1, lower q-2, grand final 1 */
  return { n: n, g: g, q: q, sizes: sizes, groupMatches: gm, playoffMatches: pm };
}
function describePlan(n) {
  var p = plan(n), per = p.q / p.g, txt;
  if (p.g === 1) txt = 'one group of ' + n + ' (everyone plays everyone), then the top ' + p.q + ' play a double-elimination bracket';
  else {
    var sz = p.sizes[0] === p.sizes[p.sizes.length - 1] ? p.sizes[0] : p.sizes[p.sizes.length - 1] + '–' + p.sizes[0];
    txt = p.g + ' groups of ' + sz + ', then ';
    if (per === Math.floor(per)) txt += 'the top ' + per + ' of each group (' + p.q + ' languages)';
    else txt += 'the ' + p.g + ' group winners and the ' + (p.q - p.g * Math.floor(per)) + ' best ' + (Math.floor(per) === 1 ? 'runners-up' : 'third places') + ' (' + p.q + ' languages)';
    txt += ' play a double-elimination bracket';
  }
  return txt + '. ' + (p.groupMatches + p.playoffMatches) + ' matches in total.';
}
function letter(i) { return String.fromCharCode(65 + i); }
/* Circle method: every pair once, spread over matchdays. */
function roundRobin(ids) {
  var a = ids.slice(), days = [];
  if (a.length % 2) a.push(null);
  var n = a.length;
  for (var r = 0; r < n - 1; r++) {
    var day = [];
    for (var i = 0; i < n / 2; i++) {
      var x = a[i], y = a[n - 1 - i];
      if (x && y) day.push(r % 2 ? [y, x] : [x, y]);
    }
    days.push(day);
    a.splice(1, 0, a.pop());
  }
  return days;
}
function seedOrder(q) {
  var o = [1];
  while (o.length < q) {
    var size = o.length * 2, next = [];
    o.forEach(function (s) { next.push(s, size + 1 - s); });
    o = next;
  }
  return o;
}
function W(m) { return { m: m, r: 'W' }; }
function L(m) { return { m: m, r: 'L' }; }

function newState(langs) {
  var p = plan(langs.length), ids = shuffle(langs), groups = {}, gorder = [], matches = {}, order = 0, at = 0;
  p.sizes.forEach(function (s, i) { var g = letter(i); gorder.push(g); groups[g] = ids.slice(at, at + s); at += s; });
  var sched = gorder.map(function (g) { return roundRobin(groups[g]); });
  var maxDays = Math.max.apply(null, sched.map(function (d) { return d.length; }));
  for (var d = 0; d < maxDays; d++) {
    gorder.forEach(function (g, gi) {
      (sched[gi][d] || []).forEach(function (pair, k) {
        var id = 'G' + g + (d + 1) + letter(k).toLowerCase();
        matches[id] = { id: id, stage: 'group', group: g, short: 'Group ' + g, label: 'Group ' + g + ' · Matchday ' + (d + 1),
          a: pair[0], b: pair[1], bo: 3, order: order++, games: [], flips: [], picks: [], done: false };
      });
    });
  }
  /* double elimination for q = 2^k */
  var q = p.q, k = Math.log2(q), so = seedOrder(q), ub = [], lb = [];
  function add(id, stage, short, label, a, b, bo) {
    matches[id] = { id: id, stage: stage, short: short, label: label, a: a, b: b, bo: bo || 3, order: order++, games: [], flips: [], picks: [], done: false };
    return id;
  }
  function ubName(r) { var left = k - r; return left === 0 ? 'Upper Final' : left === 1 ? 'Upper Semifinals' : left === 2 ? 'Upper Quarterfinals' : 'Upper Round ' + r; }
  var lbRounds = 2 * (k - 1), lbNo = 0;
  function lbName(r) { return r === lbRounds ? 'Lower Final' : r === lbRounds - 1 && lbRounds > 2 ? 'Lower Semifinal' : 'Lower Round ' + r; }
  function lbShort(r) { return r === lbRounds ? 'LB Final' : 'LB R' + r; }
  function ubShort(r) { var left = k - r; return left === 0 ? 'UB Final' : left === 1 ? 'UB SF' : left === 2 ? 'UB QF' : 'UB R' + r; }
  function ubRound(r) {
    var ids = [], cnt = q / Math.pow(2, r);
    for (var i = 0; i < cnt; i++) {
      var a, b;
      if (r === 1) { a = { seed: so[2 * i] }; b = { seed: so[2 * i + 1] }; }
      else { a = W(ub[r - 2][2 * i]); b = W(ub[r - 2][2 * i + 1]); }
      var sh = ubShort(r) + (cnt > 1 ? ' ' + (i + 1) : '');
      ids.push(add('U' + r + '-' + (i + 1), 'ub', sh, ubName(r) + (cnt > 1 ? ' · Match ' + (i + 1) : ''), a, b));
    }
    ub.push(ids);
  }
  function lbRound(pairs) {
    lbNo++;
    var ids = [];
    pairs.forEach(function (pr, i) {
      var sh = lbShort(lbNo) + (pairs.length > 1 ? ' ' + (i + 1) : '');
      ids.push(add('L' + lbNo + '-' + (i + 1), 'lb', sh, lbName(lbNo) + (pairs.length > 1 ? ' · Match ' + (i + 1) : ''), pr[0], pr[1]));
    });
    lb.push(ids);
  }
  ubRound(1);
  var first = ub[0], pairs = [];
  for (var i = 0; i < first.length; i += 2) pairs.push([L(first[i]), L(first[i + 1])]);
  lbRound(pairs);
  for (var r = 2; r <= k; r++) {
    ubRound(r);
    var prev = lb[lb.length - 1], drop = ub[r - 1];
    lbRound(prev.map(function (id, j) { return [W(id), L(drop[drop.length - 1 - j])]; }));
    if (r < k) {
      var cur = lb[lb.length - 1], ps = [];
      for (var j = 0; j < cur.length; j += 2) ps.push([W(cur[j]), W(cur[j + 1])]);
      lbRound(ps);
    }
  }
  var ubF = ub[ub.length - 1][0], lbF = lb[lb.length - 1][0];
  add('GF1', 'gf', 'Grand Final', 'Grand Final', W(ubF), W(lbF), 5);
  return { v: VERSION, created: Date.now(), langs: langs.slice(), q: q, gorder: gorder, groups: groups, matches: matches,
    ub: ub, lb: lb, ubNames: ub.map(function (x, i) { return ubName(i + 1); }), lbNames: lb.map(function (x, i) { return lbName(i + 1); }) };
}

/* ---------- state ---------- */
var S = null, HIST = [], SEEN = {}, KEY = '', HKEY = '', SKEY = '', PKEY = '';
/* Both pages (Arena and Plain) pass the same prefix, so they share one tournament. `legacy` is the page's
   old prefix: its saved tournament moves over the first time the shared one is empty. */
function init(prefix, legacy) {
  KEY = prefix + ':state:v2'; HKEY = prefix + ':history:v2'; SKEY = prefix + ':seen:v2'; PKEY = prefix + ':picked:v2';
  if (legacy && !store.get(KEY) && store.get(legacy + ':state:v2')) {
    ['state', 'history', 'seen', 'picked'].forEach(function (k) {
      var v = store.get(legacy + ':' + k + ':v2');
      if (v != null) store.set(prefix + ':' + k + ':v2', v);
    });
  }
  S = store.get(KEY);
  if (!S || S.v !== VERSION || !S.matches) S = null;
  if (S && S.matches.GF2) { delete S.matches.GF2; save(); } /* the grand final is a single match now */
  HIST = store.get(HKEY) || [];
  SEEN = store.get(SKEY) || {};
}
function save() { return store.set(KEY, S); }
function saveHist() { while (!store.set(HKEY, HIST) && HIST.length > 1) HIST = HIST.slice(Math.ceil(HIST.length / 2)); }
function saveSeen() { store.set(SKEY, SEEN); }
function lastPicked() { var p = store.get(PKEY); return Array.isArray(p) ? p.filter(function (id) { return LMAP[id]; }) : null; }
function start(langs) {
  langs = langs.filter(function (id) { return LMAP[id]; });
  if (langs.length < 4) return false;
  store.set(PKEY, langs);
  S = newState(langs); HIST = []; save(); saveHist();
  return true;
}
function clear() { S = null; HIST = []; store.del(KEY); saveHist(); }

/* ---------- rules ---------- */
function name(id) { return LMAP[id] ? LMAP[id].name : '?'; }
function values(o) { return Object.keys(o).map(function (k) { return o[k]; }); }
function byOrder(x, y) { return x.order - y.order; }
function groupMatches(g) { return values(S.matches).filter(function (m) { return m.stage === 'group' && m.group === g; }).sort(byOrder); }
function groupComplete(g) { return groupMatches(g).every(function (m) { return m.done; }); }
function groupsComplete() { return S.gorder.every(groupComplete); }
function score(m, a, b) {
  var sa = 0, sb = 0;
  m.picks.forEach(function (p) { if (p === a) sa++; else if (p === b) sb++; });
  return [sa, sb];
}
/* Matches are first to a majority: best of 3 ends at 2 wins, the best-of-5 final at 3. */
function need(m) { return Math.floor(m.bo / 2) + 1; }
function finished(m) {
  if (!m.picks.length) return false;
  var p = participants(m), s = score(m, p[0], p[1]);
  return Math.max(s[0], s[1]) >= need(m);
}
var stCache = {};
function standings(g) {
  var ms = groupMatches(g), R = {};
  var rows = S.groups[g].map(function (id) { return (R[id] = { id: id, mw: 0, ml: 0, gw: 0, gl: 0, p: 0 }); });
  ms.forEach(function (m) {
    if (!m.done) return;
    var sc = score(m, m.a, m.b), A = R[m.a], B = R[m.b];
    A.p++; B.p++; A.gw += sc[0]; A.gl += sc[1]; B.gw += sc[1]; B.gl += sc[0];
    if (m.winner === m.a) { A.mw++; B.ml++; } else { B.mw++; A.ml++; }
  });
  function h2h(x, y) {
    var m = ms.filter(function (m) { return m.done && ((m.a === x && m.b === y) || (m.a === y && m.b === x)); })[0];
    return m ? (m.winner === x ? -1 : 1) : 0;
  }
  return rows.sort(function (x, y) {
    return (y.mw - x.mw) || ((y.gw - y.gl) - (x.gw - x.gl)) || (y.gw - x.gw) || h2h(x.id, y.id) ||
      (S.groups[g].indexOf(x.id) - S.groups[g].indexOf(y.id));
  });
}
/* Everyone ranked across groups: by group place, then win rate, duel difference per match, duels won per match. */
function overall() {
  var all = [];
  S.gorder.forEach(function (g, gi) {
    standings(g).forEach(function (r, i) {
      var p = r.p || 1;
      all.push({ id: r.id, group: g, place: i + 1, wr: r.mw / p, dr: (r.gw - r.gl) / p, gr: r.gw / p, gi: gi });
    });
  });
  return all.sort(function (x, y) { return (x.place - y.place) || (y.wr - x.wr) || (y.dr - x.dr) || (y.gr - x.gr) || (x.gi - y.gi); });
}
function seeds() { return groupsComplete() ? overall().slice(0, S.q).map(function (r) { return r.id; }) : null; }
function resolve(src) {
  if (typeof src === 'string') return src;
  if (src.seed) { var s = seeds(); return s ? s[src.seed - 1] : null; }
  var m = S.matches[src.m];
  if (!m || !m.done) return null;
  return src.r === 'W' ? m.winner : m.loser;
}
function participants(m) { return [resolve(m.a), resolve(m.b)]; }
function isActive(m) { return !!m; }
function isReady(m) { if (m.done || !isActive(m)) return false; var p = participants(m); return !!(p[0] && p[1]); }
function activeMatches() { return values(S.matches).filter(isActive).sort(byOrder); }
function nextMatch() {
  var list = activeMatches().filter(isReady);
  return list.filter(function (m) { return m.picks.length > 0; })[0] || list[0] || null;
}
function champion() {
  var g1 = S.matches.GF1;
  return g1.done ? { first: g1.winner, second: g1.loser } : null;
}
function podium() {
  var ch = champion();
  if (!ch) return null;
  var lf = S.matches[S.lb[S.lb.length - 1][0]];
  return { first: ch.first, second: ch.second, third: lf.done ? lf.loser : null };
}
function progress() {
  var act = activeMatches();
  return { done: act.filter(function (m) { return m.done; }).length, total: act.length,
    phase: champion() ? 'Finished' : groupsComplete() ? 'Playoffs' : 'Group stage' };
}
/* Group row fate: 'q' qualified, 'out', or '' (not decided yet). */
function fate(g, place) {
  if (!groupComplete(g)) return '';
  var per = S.q / S.gorder.length;
  if (place <= Math.floor(per)) return 'q';
  if (place > Math.ceil(per)) return 'out';
  if (!groupsComplete()) return '';
  var id = standings(g)[place - 1].id;
  return seeds().indexOf(id) >= 0 ? 'q' : 'out';
}
function srcLabel(src) {
  if (src.seed) return 'Seed ' + src.seed;
  return (src.r === 'W' ? 'W ' : 'L ') + S.matches[src.m].short;
}
function langStatus(id) {
  var ch = champion();
  if (ch && ch.first === id) return 'champ';
  if (groupsComplete() && seeds().indexOf(id) < 0) return 'out';
  var out = values(S.matches).some(function (m) {
    if (!m.done || m.loser !== id) return false;
    return m.stage === 'lb' || m.stage === 'gf';
  });
  return out ? 'out' : 'alive';
}

/* What winning or losing this match means, for banners and result lines. */
function stakes(m) {
  if (m.stage === 'group') return { win: 'takes the points', lose: 'can still recover in the group' };
  if (m.stage === 'ub') return { win: 'advances in the upper bracket', lose: 'drops to the lower bracket' };
  if (m.stage === 'lb') return { win: 'survives', lose: 'is eliminated' };
  return { win: 'wins the cup', lose: 'finishes second' };
}
function anyStarted() { return !!S && values(S.matches).some(function (m) { return m.picks.length > 0 || m.done; }); }

/* ---------- challenge choice: same task for both fighters, never one they already had ----------
   First rule: within a cup, a language never gets the same task twice (when the pair has any task left
   that neither of them had in this cup). Then, across cups, each language remembers its last 29 tasks in
   order and the duel takes the task either fighter saw longest ago, so a returning task is always the
   oldest one. */
var WINDOW = 29;
function seenList(l) { return SEEN[l] || (SEEN[l] = []); }
/* How many duels ago this language last had task c: 1 = its previous duel, Infinity = not within the window. */
function age(l, c) { var h = seenList(l), i = h.lastIndexOf(c); return i < 0 ? Infinity : h.length - i; }
/* Tasks this language already had in the current cup (kept in the saved tournament, so undo rewinds it). */
function cupUsed(l) { if (!S.used) S.used = {}; return S.used[l] || (S.used[l] = []); }
function chooseChallenge(m, a, b) {
  var ua = cupUsed(a), ub = cupUsed(b);
  var usedCats = m.games.map(function (id) { return CHMAP[id].cat; });
  var others = S.langs.filter(function (l) { return l !== a && l !== b; }), best = null;
  CH.forEach(function (c) {
    if (m.games.indexOf(c.id) >= 0 || !has(c.id, a) || !has(c.id, b)) return;
    var ea = age(a, c.id), eb = age(b, c.id), fresh = Math.min(ea, eb);
    /* tasks the rest of the field already had keep everyone moving through the catalogue in step */
    var done = others.length ? others.filter(function (l) { return age(l, c.id) !== Infinity; }).length / others.length : 0;
    var cupFresh = (ua.indexOf(c.id) < 0 ? 1 : 0) + (ub.indexOf(c.id) < 0 ? 1 : 0);
    var score = [cupFresh, fresh === Infinity ? 1e6 : fresh, Math.min(ea, 999) + Math.min(eb, 999), usedCats.indexOf(c.cat) < 0 ? 1 : 0, done + Math.random() * 0.5];
    if (!best || cmp(score, best.score) > 0) best = { id: c.id, score: score };
  });
  if (!best) best = { id: CH.filter(function (c) { return m.games.indexOf(c.id) < 0; })[0].id };
  [a, b].forEach(function (l) {
    var h = seenList(l);
    cupUsed(l).push(best.id);
    h.push(best.id);
    if (h.length > WINDOW) h.splice(0, h.length - WINDOW);
  });
  saveSeen();
  return best.id;
}
function cmp(x, y) { for (var i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] > y[i] ? 1 : -1; return 0; }
function seenTotal() { return Object.keys(SEEN).reduce(function (t, l) { return t + (LMAP[l] ? SEEN[l].length : 0); }, 0); }
function forgetSeen() { SEEN = {}; saveSeen(); }

/* ---------- actions ---------- */
/* Returns {ok:true, m, a, b} when the match can be played or viewed, else {ok:false, reason}. */
function prepare(id) {
  var m = S.matches[id];
  if (!m) return { ok: false, reason: 'No such match' };
  var p = participants(m);
  if (!p[0] || !p[1]) return { ok: false, reason: 'Waiting for earlier results' };
  var n = m.picks.length;
  if (!m.done && !finished(m) && !m.games[n]) {
    m.games[n] = chooseChallenge(m, p[0], p[1]);
    m.flips[n] = Math.random() < 0.5;
    save();
  }
  return { ok: true, m: m, a: p[0], b: p[1] };
}
function pick(m, lang) {
  if (m.done || finished(m)) return false;
  m.picks.push(lang); save(); return true;
}
function undoPick(m) { if (m.done || !m.picks.length) return false; m.picks.pop(); save(); return true; }
/* Locks in a finished match. Returns what happened so the page can announce it. */
function confirmMatch(m) {
  var p = participants(m), a = p[0], b = p[1], sc = score(m, a, b);
  if (m.done || !finished(m)) return null;
  HIST.push({ id: m.id, label: name(a) + ' vs ' + name(b), state: JSON.stringify(S) });
  if (HIST.length > 30) HIST.shift();
  saveHist();
  m.done = true;
  m.winner = sc[0] > sc[1] ? a : b;
  m.loser = m.winner === a ? b : a;
  save();
  var hi = Math.max(sc[0], sc[1]), lo = Math.min(sc[0], sc[1]);
  var text = name(m.winner) + ' beat ' + name(m.loser) + ' ' + hi + '–' + lo + '.';
  if (m.stage === 'group' && groupsComplete()) {
    text += ' The group stage is over: ' + S.q + ' languages go to the playoffs.';
  } else if (m.stage === 'group' && groupComplete(m.group)) text += ' Group ' + m.group + ' is done.';
  else if (m.stage === 'ub') text += ' ' + name(m.loser) + ' drops to the lower bracket.';
  else if (m.stage === 'lb') text += ' ' + name(m.loser) + ' is eliminated.';
  if (champion()) text = name(m.winner) + ' wins the Programming Language Cup!';
  return text;
}
function undoResult() {
  var h = HIST.pop();
  if (!h) return null;
  S = JSON.parse(h.state); save(); saveHist();
  return h;
}
function stats() {
  var st = {}, total = 0, cats = {};
  S.langs.forEach(function (l) { st[l] = { id: l, w: 0, p: 0 }; });
  CATS.forEach(function (c) { cats[c.id] = { id: c.id, n: 0, wins: {} }; });
  values(S.matches).forEach(function (m) {
    if (!isActive(m)) return;
    var p = participants(m), a = p[0], b = p[1];
    if (!a || !b) return;
    m.picks.forEach(function (x, i) {
      st[x].w++; st[a].p++; st[b].p++; total++;
      var c = cats[CHMAP[m.games[i]].cat];
      c.n++; c.wins[x] = (c.wins[x] || 0) + 1;
    });
  });
  var rows = values(st).sort(function (x, y) {
    var rx = x.p ? x.w / x.p : -1, ry = y.p ? y.w / y.p : -1;
    return (ry - rx) || (y.w - x.w) || (name(x.id) < name(y.id) ? -1 : 1);
  });
  rows.forEach(function (r) { r.pct = r.p ? Math.round(100 * r.w / r.p) : null; r.status = langStatus(r.id); });
  var crow = CATS.map(function (c) {
    var w = cats[c.id].wins, top = Object.keys(w).sort(function (x, y) { return w[y] - w[x]; })[0];
    return { id: c.id, n: cats[c.id].n, top: top || null, topWins: top ? w[top] : 0 };
  });
  return { total: total, rows: rows, cats: crow };
}

return {
  LANGS: LANGS, LMAP: LMAP, CLASSIC: CLASSIC, CH: CH, CHMAP: CHMAP, CATS: CATS, CATMAP: CATMAP, STORAGE_OK: STORAGE_OK,
  esc: esc, hl: hl, loadSnippets: loadSnippets, snippet: snippet, snippetCount: snippetCount, init: init, start: start, clear: clear,
  lastPicked: lastPicked, plan: plan, describePlan: describePlan, shuffle: shuffle,
  get S() { return S; }, get HIST() { return HIST; },
  name: name, groupMatches: groupMatches, groupComplete: groupComplete, groupsComplete: groupsComplete, score: score,
  standings: standings, fate: fate, resolve: resolve, participants: participants, isActive: isActive, isReady: isReady,
  nextMatch: nextMatch, champion: champion, podium: podium, progress: progress, srcLabel: srcLabel, langStatus: langStatus,
  need: need, finished: finished, prepare: prepare, pick: pick, undoPick: undoPick, confirmMatch: confirmMatch,
  undoResult: undoResult, stats: stats, seenTotal: seenTotal, forgetSeen: forgetSeen, stakes: stakes, anyStarted: anyStarted, store: store
};
})();
