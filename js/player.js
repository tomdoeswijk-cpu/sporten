// Workoutspeler: zet workouts/routines om in segmenten en begeleidt je met timer, figuur, uitleg en spookrace.
import { EX } from './exercises.js';
import { figure } from './figure.js';
import { SPLIT, routineItems, BDN, TESTS, PEIL_KRACHT } from './data.js';
import { resolveEx, fmtTime, liftLast, testById } from './logic.js';
import { icon } from './icons.js';

const RC = 2 * Math.PI * 70;
const dial = (txt, cls = '') => `<div class="p-dial ${cls}"><svg viewBox="0 0 160 160" aria-hidden="true"><circle cx="80" cy="80" r="70" class="trk"/><circle cx="80" cy="80" r="70" class="prog" data-ring stroke-dasharray="${RC.toFixed(1)}" stroke-dashoffset="0" transform="rotate(-90 80 80)"/></svg><div class="p-clock" data-clock>${txt}</div></div>`;

// ───────── compileren ─────────
const WARM = ['jumping-jack', 'arm-circles', 'inchworm', 'high-knees', 'leg-swings', 'air-squat'];
const COOL = ['childs-pose', 'hip-flexor', 'pec-stretch', 'couch-stretch', 'breathing-9090'];
const timed = (ex, sec, o = {}) => ({ kind: 'timed', ex, sec, ...o });

// Warming-up op maat: eerst hartslag omhoog met het apparaat uit de workout, dan de bewegingspatronen voorbereiden.
const PATTERNS = {
  trekken: { ex: ['pullup', 'chinup', 'neg-pullup', 'band-pullup', 'lat-pulldown', 'seated-row', 'trx-row', 'hanging-knee-raise'], prep: ['scap-pullup', 'face-pull', 'dead-hang'] },
  duwen: { ex: ['pushup', 'incline-pushup', 'pike-pushup', 'chest-press', 'shoulder-press', 'burpee', 'burpee-broad-jump', 'kiss-pushup'], prep: ['arm-circles', 'inchworm', 'bear-plank-tap'] },
  squat: { ex: ['air-squat', 'jump-squat', 'reverse-lunge', 'bulgarian', 'skater', 'kid-squat'], prep: ['leg-swings', 'wgs', 'cossack'] },
  hinge: { ex: ['pull-through', 'trx-ham-curl', 'sl-glute-bridge', 'broad-jump', 'burpee-broad-jump'], prep: ['glute-bridge', 'leg-swings', 'inchworm'] },
  core: { ex: ['hollow-rock', 'mountain-climber', 'trx-knee-tuck', 'trx-fallout', 'hanging-knee-raise'], prep: ['dead-bug', 'bird-dog'] },
};
export function warmupPlan(ids) {
  const set = new Set(ids);
  const pulse = set.has('row') ? 'row' : set.has('bike') ? 'bike' : set.has('single-under') || set.has('double-under') ? 'single-under' : 'jumping-jack';
  const pats = Object.entries(PATTERNS).filter(([, p]) => p.ex.some((e) => set.has(e)));
  const order = [];
  for (let r = 0; r < 3; r++) for (const [, p] of pats) if (p.prep[r] && !order.includes(p.prep[r])) order.push(p.prep[r]);
  return { pulse, prep: order, patterns: pats.map(([k]) => k) };
}
function warmup(sec, ids = []) {
  const plan = warmupPlan(ids);
  const out = [timed(plan.pulse, Math.min(60, Math.round(sec / 4)), { phase: 'Warming-up', note: plan.pulse === 'jumping-jack' ? '' : 'rustig tempo' })];
  let t = out[0].sec;
  const list = [...plan.prep, ...WARM.filter((x) => !plan.prep.includes(x))];
  let i = 0;
  while (t < sec) { const d = Math.min(40, sec - t); const ex = list[i % list.length]; out.push(timed(ex, d, { phase: 'Warming-up', ...(EX[ex].uni && d >= 30 ? { switchAt: Math.round(d / 2) } : {}) })); t += d; i++; }
  return out;
}
export function mainIds(w) {
  const m = w.main, k = m.kind || w.type;
  if (k === 'kracht') return m.sets.map((x) => resolveEx(x.ex));
  if (k === 'tabata') return m.blocks.flat();
  if (k === 'timed') return m.list.map(([e]) => e);
  return m.steps.map((x) => resolveEx(x.ex));
}
function cooldown(sec) {
  const out = []; let t = 0, i = 0;
  while (t < sec) { const d = Math.min(60, sec - t); out.push(timed(COOL[i % COOL.length], d, { phase: 'Cooldown' })); t += d; i++; }
  return out;
}
const fixSteps = (steps) => steps.map((st) => ({ ...st, ex: resolveEx(st.ex) }));

function mainBlock(main, type, mainSec) {
  const kind = main.kind || type;
  if (kind === 'amrap') return [{ kind: 'amrap', sec: main.sec || mainSec, steps: fixSteps(main.steps) }];
  if (kind === 'fortime') return [{ kind: 'fortime', cap: mainSec, rounds: main.rounds, steps: fixSteps(main.steps) }];
  if (kind === 'emom') return [{ kind: 'emom', minutes: main.minutes, steps: fixSteps(main.steps) }];
  if (kind === 'timed') return main.list.map(([ex, sec]) => timed(ex, sec));
  if (kind === 'tabata') {
    const out = [];
    main.blocks.forEach((blk, bi) => {
      for (let r = 0; r < 8; r++) {
        out.push(timed(blk[r % blk.length], 20, { work: true, label: `Tabata ${bi + 1} · ronde ${r + 1}/8` }));
        out.push({ kind: 'rest', sec: 10, next: blk[(r + 1) % blk.length] });
      }
      out.push({ kind: 'input', prompt: `Hoeveel reps totaal in Tabata ${bi + 1}?`, key: 'reps', add: true });
      if (bi < main.blocks.length - 1) out.push({ kind: 'rest', sec: 60, next: main.blocks[bi + 1][0] });
    });
    return out;
  }
  if (kind === '4020') {
    const out = [], steps = fixSteps(main.steps);
    for (let r = 0; r < main.rounds; r++) {
      const st = steps[r % steps.length];
      out.push(timed(st.ex, 40, { work: true, note: st.note, label: `Ronde ${r + 1}/${main.rounds}` }));
      if (r < main.rounds - 1) out.push({ kind: 'rest', sec: 20, next: steps[(r + 1) % steps.length].ex });
    }
    out.push({ kind: 'input', prompt: 'Hoeveel reps heb je in totaal gedaan?', key: 'reps', add: true, hint: 'Een schatting is prima — zolang je het elke keer op dezelfde manier telt.' });
    return out;
  }
  if (kind === 'kracht') {
    const out = [];
    main.sets.forEach((blk) => {
      const ex = resolveEx(blk.ex);
      for (let i = 1; i <= blk.sets; i++) {
        out.push({ kind: 'set', ex, setNo: i, of: blk.sets, reps: blk.reps, note: blk.note });
        out.push({ kind: 'rest', sec: blk.rest, next: ex, short: true });
      }
    });
    out.pop();
    return out;
  }
  return [];
}

export function compileWorkout(w) {
  if (w.type === 'gezin') {
    const segs = [...warmup(120, mainIds(w)), ...mainBlock(w.main, w.main.kind, 600), ...cooldown(60)];
    return { segs: segs.filter((x) => x.kind !== 'input'), scoreType: null };
  }
  const [wu, mainSec, cd] = SPLIT[w.dur];
  const kind = w.main.kind || w.type;
  return { segs: [...warmup(wu, mainIds(w)), ...mainBlock(w.main, w.type, mainSec), ...cooldown(cd)], scoreType: kind === 'tabata' || kind === '4020' ? 'interval' : kind };
}

function routineSegs(items, seg) {
  const out = [];
  for (const id of items) {
    const ex = EX[id];
    if (seg === 'core') {
      if (ex.uni) { out.push(timed(id, 50, { switchAt: 25 })); out.push({ kind: 'rest', sec: 10, short: true }); }
      else { out.push(timed(id, 45)); out.push({ kind: 'rest', sec: 15, short: true }); }
    } else {
      out.push(timed(id, 60, ex.uni ? { switchAt: 30 } : {}));
    }
  }
  if (out.at(-1)?.kind === 'rest') out.pop();
  return out.map((s, i) => ({ ...s, next: s.kind === 'rest' ? out[i + 1]?.ex : s.next }));
}
export const compileRoutine = (r, min) => ({ segs: routineSegs(routineItems(r, min), r.seg), scoreType: null });
export const compileCombi = (core, mob) => ({ segs: [...routineSegs(core.items.slice(0, 5), 'core'), ...routineSegs(mob.items.slice(0, 5), mob.seg)], scoreType: null });
export const compileBDN = () => ({ segs: BDN.steps.map((st) => (st.sec ? timed(st.ex, st.sec) : { kind: 'reps', ex: st.ex, reps: st.reps })), scoreType: null });
export function compilePeil() {
  const segs = [...warmup(240, ['pushup', 'pullup', 'bulgarian', 'broad-jump', 'hollow-rock'])];
  for (const id of PEIL_KRACHT) { segs.push({ kind: 'test', test: id }); segs.push({ kind: 'rest', sec: 60, short: true, next: testById(PEIL_KRACHT[PEIL_KRACHT.indexOf(id) + 1])?.ex }); }
  segs.pop();
  segs.push({ kind: 'photo' });
  return { segs, scoreType: null };
}

// ───────── audio / trillen / wake lock ─────────
let ac = null;
function beep(f = 880, d = 0.12, vol = 0.25) {
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    const o = ac.createOscillator(), g = ac.createGain();
    o.frequency.value = f; o.type = 'sine';
    g.gain.setValueAtTime(vol, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + d);
    o.connect(g).connect(ac.destination); o.start(); o.stop(ac.currentTime + d);
  } catch {}
}
const buzz = (p) => { try { navigator.vibrate?.(p); } catch {} };

// ───────── gezinsmodus: dieren & deuntjes ─────────
const ANIMALS = {
  'bear-crawl': ['🐻', 'Beer!', '#c98a4b', [196, 247, 196, 147]],
  'crab-walk': ['🦀', 'Krab!', '#ff6b5b', [523, 659, 523, 659]],
  'jump-squat': ['🐸', 'Kikker!', '#5fd068', [392, 523, 784]],
  flamingo: ['🦩', 'Flamingo!', '#ff8fc7', [880, 988, 1175]],
  run: ['🐆', 'Vang papa!', '#f5c84c', [660, 784, 880, 1046]],
  'kid-squat': ['🐘', 'Olifant op papa\'s rug!', '#9db4c8', [131, 165, 196, 262]],
  'kiss-pushup': ['💋', 'Kusjes!', '#ff6fa3', [784, 659, 784, 988]],
  'tunnel-plank': ['🚂', 'Trein door de tunnel!', '#7dd3fc', [440, 440, 554, 659]],
  'glute-bridge': ['🌉', 'Brug!', '#9d8cff', [330, 440, 554]],
  'sun-salutation': ['☀️', 'Zonnetje!', '#ffd24c', [523, 659, 784, 1046]],
  'childs-pose': ['🐢', 'Schildpad', '#3fbf9f', [262, 330, 262]],
  'jumping-jack': ['⭐', 'Sterren springen!', '#ffd24c', [659, 784, 988]],
  'arm-circles': ['🚁', 'Helikopter!', '#7dd3fc', [440, 523, 440, 523]],
  inchworm: ['🐛', 'Rups!', '#8bd35a', [294, 330, 392]],
  'high-knees': ['🏇', 'Paardje!', '#e0a96d', [523, 523, 659, 659]],
  'leg-swings': ['🐒', 'Aapje!', '#c98a4b', [587, 698, 587]],
};
const animal = (id) => ANIMALS[id] || ['🎈', EX[id]?.name || '', '#c6f432', [523, 659]];
function jingle(notes) {
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    notes.forEach((f, i) => {
      const t = ac.currentTime + i * 0.13, o = ac.createOscillator(), g = ac.createGain();
      o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
      o.connect(g).connect(ac.destination); o.start(t); o.stop(t + 0.26);
    });
  } catch {}
}

// ───────── speler ─────────
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const amount = (st, round = 0) => {
  if (st.cal) return `${st.cal} cal`;
  if (st.m) return `${st.m} m`;
  if (Array.isArray(st.reps)) return `${st.reps[Math.min(round, st.reps.length - 1)]}×`;
  if (st.reps) return `${st.reps}×`;
  return '';
};

export class Player {
  constructor({ title, plan, ghost, prBest, onFinish, onQuit, bdn, kids }) {
    Object.assign(this, { title, segs: plan.segs, scoreType: plan.scoreType, ghost, prBest, onFinish, onQuit, bdn, kids });
    this.i = 0; this.score = { type: plan.scoreType }; this.sets = []; this.tests = []; this.photo = null;
    this.t0 = performance.now(); this.segStart = this.t0; this.paused = false; this.pauseAcc = 0; this.pausedAt = 0;
    this.lastBeep = -1; this.rounds = 0; this.taps = [];
    this.root = h(`<div class="player"></div>`);
    document.body.append(this.root);
    document.body.classList.add('noscroll');
    this.wake();
    this.renderSeg();
    this.timer = setInterval(() => this.tick(), 200);
  }
  async wake() { try { this.lock = await navigator.wakeLock?.request('screen'); } catch {} }
  elapsed() { return ((this.paused ? this.pausedAt : performance.now()) - this.segStart - this.pauseAcc) / 1000; }
  totalElapsed() { return (performance.now() - this.t0) / 1000; }
  get seg() { return this.segs[this.i]; }

  next() {
    if (this.seg?.kind === 'amrap' || this.seg?.kind === 'fortime') this.closeMain();
    this.i++;
    this.segStart = performance.now(); this.pauseAcc = 0; this.lastBeep = -1;
    if (this.i >= this.segs.length) return this.finish();
    beep(660, 0.15); buzz(80);
    this.renderSeg();
  }
  closeMain() {
    const s = this.seg;
    if (s.kind === 'fortime' && !this.score.sec) {
      this.score = { type: 'fortime', capped: true, progress: this.rounds, taps: this.taps };
    }
  }
  quit() {
    if (!confirm('Workout stoppen? Je voortgang wordt niet opgeslagen.')) return;
    this.cleanup(); this.onQuit?.();
  }
  cleanup() { clearInterval(this.timer); this.lock?.release?.(); this.root.remove(); document.body.classList.remove('noscroll'); }
  finish() {
    this.cleanup();
    this.onFinish({ score: this.scoreType ? this.score : null, sets: this.sets, tests: this.tests, photo: this.photo, minutes: Math.max(1, Math.round(this.totalElapsed() / 60)) });
  }
  togglePause() {
    if (this.paused) { this.pauseAcc += performance.now() - this.pausedAt; this.paused = false; }
    else { this.pausedAt = performance.now(); this.paused = true; }
    this.root.querySelector('.p-pause').textContent = this.paused ? 'Verder' : 'Pauze';
    this.root.classList.toggle('is-paused', this.paused);
  }

  shell(inner, { phase, accent } = {}) {
    const pct = Math.round((this.i / this.segs.length) * 100);
    this.root.innerHTML = '';
    const el = h(`<div class="p-wrap ${accent || ''} ${this.kids ? 'kids' : ''}">
      <div class="p-top"><button class="p-x" aria-label="Stoppen">✕</button><div class="p-title"><small>${phase || this.title}</small><span>${this.title}</span></div><button class="p-pause">Pauze</button></div>
      <div class="p-prog"><i style="width:${pct}%"></i></div>
      <div class="p-body"></div></div>`);
    el.querySelector('.p-x').onclick = () => this.quit();
    el.querySelector('.p-pause').onclick = () => this.togglePause();
    el.querySelector('.p-body').append(inner);
    this.root.append(el);
  }

  exCard(exId, big = true) {
    const ex = EX[exId];
    const card = h(`<div class="p-ex ${big ? 'big' : ''}"><div class="p-fig"></div><h2>${ex.name}</h2>
      <details class="p-info"><summary>Uitleg & houdingstip</summary><p>${ex.desc}</p><p class="tip"><b>Houding:</b> ${ex.tip}</p></details></div>`);
    card.querySelector('.p-fig').append(figure(ex));
    return card;
  }

  renderSeg() {
    const s = this.seg;
    const r = this[`r_${s.kind}`];
    r.call(this, s);
    if (this.kids && s.kind === 'timed') jingle(animal(s.ex)[3]);
  }
  kidHero(exId, note) {
    const [e, n, c] = animal(exId);
    const el = h(`<div class="kid-hero" style="--k:${c}"><div class="kid-emoji">${e}</div><div class="kid-name">${note && !ANIMALS[exId] ? note : n}</div></div>`);
    return el;
  }

  // ── segmenttypes ──
  r_timed(s) {
    const ex = EX[s.ex];
    const box = h(`<div class="p-col"></div>`);
    if (this.kids) { box.append(this.kidHero(s.ex, s.note)); box.style.setProperty('--c', animal(s.ex)[2]); box.style.setProperty('--k', animal(s.ex)[2]); }
    box.append(this.exCard(s.ex, !this.kids));
    const meta = h(`<div class="p-meta">${s.label ? `<span>${s.label}</span>` : ''}${s.note ? `<span class="pill">${s.note}</span>` : ''}${s.switchAt ? '<span class="pill">links → rechts</span>' : ''}</div>`);
    box.append(meta);
    box.append(h(dial(fmtTime(s.sec))));
    box.append(h(`<div class="p-side" data-side></div>`));
    const nx = this.segs.slice(this.i + 1).find((x) => x.ex);
    box.append(h(`<div class="p-next">${nx ? `Hierna: <b>${EX[nx.ex].name}</b>` : 'Laatste oefening!'}</div>`));
    const skip = h(`<button class="btn ghost">Overslaan ›</button>`); skip.onclick = () => this.next(); box.append(skip);
    this.shell(box, { phase: s.phase || (s.work ? 'Werk' : ({ core: 'Core', mobility: 'Mobility', posture: 'Posture' })[ex.cat] || ''), accent: s.work ? 'work' : s.phase ? 'warm' : ({ core: 'core', mobility: 'mob', posture: 'mob' })[ex.cat] || '' });
  }
  r_rest(s) {
    const box = h(`<div class="p-col rest"><div class="p-rest-label">Rust · adem</div>${dial(fmtTime(s.sec), 'rest')}</div>`);
    if (s.next && this.kids) { box.append(h(`<div class="p-next">Even uitblazen… hierna:</div>`)); box.append(this.kidHero(s.next)); }
    else if (s.next) { box.append(h(`<div class="p-next">Hierna</div>`)); box.append(this.exCard(s.next, false)); }
    const skip = h(`<button class="btn ghost">Rust overslaan ›</button>`); skip.onclick = () => this.next(); box.append(skip);
    this.shell(box, { phase: 'Rust', accent: 'rest' });
  }
  r_reps(s) {
    const box = h(`<div class="p-col"></div>`);
    box.append(this.exCard(s.ex));
    box.append(h(`<div class="p-reps">${s.reps}×</div>`));
    const b = h(`<button class="btn primary xl">Klaar ✓</button>`); b.onclick = () => this.next(); box.append(b);
    this.shell(box, { phase: this.bdn ? `Ronde ${this.bdn.round}` : '' });
  }
  circuit(s, round = 0) {
    const ul = h(`<div class="p-circuit"></div>`);
    s.steps.forEach((st) => {
      const row = h(`<button class="p-step"><span class="amt">${this.kids ? `${animal(st.ex)[0]} ` : ''}${amount(st, round)}</span><span class="nm">${EX[st.ex].name}${st.note ? ` <small>${st.note}</small>` : ''}</span><span class="i">i</span></button>`);
      row.onclick = () => this.showEx(st.ex);
      ul.append(row);
    });
    return ul;
  }
  showEx(id) {
    const ov = h(`<div class="p-modal"><div class="p-modal-in"></div></div>`);
    const c = this.exCard(id); ov.firstElementChild.append(c);
    c.querySelector('details').open = true;
    const b = h(`<button class="btn">Sluiten</button>`); b.onclick = () => ov.remove(); ov.firstElementChild.append(b);
    ov.onclick = (e) => { if (e.target === ov) ov.remove(); };
    this.root.append(ov);
  }
  r_amrap(s) {
    this.rounds = 0; this.taps = [];
    const box = h(`<div class="p-col">${dial(fmtTime(s.sec), 'wide')}
      <div class="p-ghost" data-ghost></div></div>`);
    box.append(this.circuit(s));
    const b = h(`<button class="btn primary xl round">Ronde klaar <b data-rounds>0</b></button>`);
    b.onclick = () => {
      this.rounds++; this.taps.push(Math.round(this.elapsed())); beep(990, 0.08); buzz(40);
      b.querySelector('[data-rounds]').textContent = this.rounds;
      if (this.prBest && this.rounds === this.prBest.rounds + 1) this.toast(`${icon('flame')} Je zit boven je PR!`);
    };
    box.append(b);
    this.shell(box, { phase: 'AMRAP', accent: 'work' });
  }
  r_fortime(s) {
    this.rounds = 0; this.taps = [];
    const box = h(`<div class="p-col">${dial('0:00', 'wide up')}<div class="p-sub">cap ${fmtTime(s.cap)} · ronde <b data-rn>1</b>/${s.rounds}</div>
      <div class="p-ghost" data-ghost></div></div>`);
    const cwrap = h('<div></div>'); cwrap.append(this.circuit(s, 0)); box.append(cwrap);
    const b = h(`<button class="btn primary xl round">${s.rounds > 1 ? 'Ronde klaar' : 'Klaar!'}</button>`);
    b.onclick = () => {
      const t = Math.round(this.elapsed());
      this.taps.push(t); this.rounds++; beep(990, 0.08); buzz(40);
      if (this.ghost?.[this.rounds - 1] != null) {
        const d = this.ghost[this.rounds - 1] - t;
        this.toast(d >= 0 ? `${icon('ghost')} ${fmtTime(d)} sneller dan je spook` : `${icon('ghost')} ${fmtTime(-d)} achter je spook`);
      }
      if (this.rounds >= s.rounds) { this.score = { type: 'fortime', sec: t, taps: this.taps }; return this.next(); }
      box.querySelector('[data-rn]').textContent = this.rounds + 1;
      cwrap.innerHTML = ''; cwrap.append(this.circuit(s, this.rounds));
      if (this.rounds === s.rounds - 1) b.textContent = 'Klaar!';
    };
    box.append(b);
    this.shell(box, { phase: 'For Time', accent: 'work' });
  }
  r_emom(s) {
    this.emomMin = -1;
    const box = h(`<div class="p-col"><div class="p-sub">Minuut <b data-min>1</b>/${s.minutes}</div><div data-cur></div>${dial('1:00')}</div>`);
    this.shell(box, { phase: 'EMOM', accent: 'work' });
  }
  emomRender(s, mi) {
    const st = s.steps[mi % s.steps.length];
    const cur = this.root.querySelector('[data-cur]');
    cur.innerHTML = '';
    if (this.kids) { cur.append(this.kidHero(st.ex, st.note)); if (mi > 0 || this.emomMin === 0) jingle(animal(st.ex)[3]); }
    cur.append(this.exCard(st.ex, !this.kids));
    cur.append(h(`<div class="p-reps">${amount(st) || ''} ${st.note ? `<small>${st.note}</small>` : ''}</div>`));
    this.root.querySelector('[data-min]').textContent = mi + 1;
  }
  r_set(s) {
    const ex = EX[s.ex];
    const kg = ex.equip === 'hg20';
    const last = liftLast(s.ex);
    const prev = last?.[s.setNo - 1] || last?.at(-1);
    const done = this.sets.filter((x) => x.ex === s.ex);
    const box = h(`<div class="p-col"></div>`);
    box.append(this.exCard(s.ex));
    box.append(h(`<div class="p-meta"><span>Set ${s.setNo}/${s.of}</span><span class="pill">doel ${s.reps} reps${s.note ? ` ${s.note}` : ''}</span></div>`));
    if (prev) box.append(h(`<div class="p-ghost">Vorige keer: <b>${prev.kg ? `${prev.kg} kg × ` : ''}${prev.reps}</b>${prev.reps >= s.reps ? ' — probeer iets meer ↑' : ''}</div>`));
    const f = h(`<div class="p-inputs">${kg ? `<label>kg<div class="stepper"><button data-d="-5">−</button><input type="number" inputmode="numeric" name="kg" value="${done.at(-1)?.kg ?? prev?.kg ?? 20}"><button data-d="5">+</button></div></label>` : ''}
      <label>reps<div class="stepper"><button data-d="-1">−</button><input type="number" inputmode="numeric" name="reps" value="${s.reps}"><button data-d="1">+</button></div></label></div>`);
    f.querySelectorAll('.stepper').forEach((sp) => sp.querySelectorAll('button').forEach((b) => (b.onclick = () => { const i = sp.querySelector('input'); i.value = Math.max(0, Number(i.value) + Number(b.dataset.d)); })));
    box.append(f);
    const b = h(`<button class="btn primary xl">Set klaar ✓</button>`);
    b.onclick = () => {
      const reps = Number(f.querySelector('[name=reps]').value) || 0;
      const kgv = kg ? Number(f.querySelector('[name=kg]').value) || 0 : null;
      this.sets.push({ ex: s.ex, reps, kg: kgv });
      this.score = { type: 'kracht', sets: this.sets };
      this.next();
    };
    box.append(b);
    this.shell(box, { phase: 'Kracht' });
  }
  r_input(s) {
    const box = h(`<div class="p-col center"><h2>${s.prompt}</h2>${s.hint ? `<p class="muted">${s.hint}</p>` : ''}
      <div class="stepper big"><button data-d="-5">−5</button><input type="number" inputmode="numeric" value="${s.key === 'minutes' ? s.def : ''}" placeholder="0"><button data-d="5">+5</button></div></div>`);
    const inp = box.querySelector('input');
    box.querySelectorAll('button[data-d]').forEach((b) => (b.onclick = () => { inp.value = Math.max(0, (Number(inp.value) || 0) + Number(b.dataset.d)); }));
    const b = h(`<button class="btn primary xl">Opslaan ›</button>`);
    b.onclick = () => {
      let v = Number(inp.value) || 0;
      if (s.key === 'minutes') v = Math.min(v, s.def);
      if (s.add) this.score = { type: 'interval', reps: (this.score.reps || 0) + v };
      else this.score = { ...this.score, [s.key]: v };
      this.next();
    };
    box.append(b);
    this.shell(box, { phase: 'Score' });
    setTimeout(() => inp.focus(), 100);
  }
  r_test(s) {
    const t = testById(s.test);
    const box = h(`<div class="p-col"></div>`);
    if (t.ex) box.append(this.exCard(t.ex));
    box.append(h(`<div class="p-meta"><span class="pill">${t.name}</span></div><p class="muted center">${t.how}</p>`));
    const inp = h(`<div class="stepper big"><button data-d="-1">−</button><input type="number" inputmode="decimal" placeholder="${t.unit}"><button data-d="1">+</button></div>`);
    const input = inp.querySelector('input');
    inp.querySelectorAll('button').forEach((b) => (b.onclick = () => { input.value = Math.max(0, (Number(input.value) || 0) + Number(b.dataset.d)); }));
    if (t.unit === 'sec') {
      const sw = h(`<button class="btn xl">▶ Start stopwatch</button>`);
      let start = null, iv = null;
      sw.onclick = () => {
        if (!start) { start = performance.now(); sw.textContent = '■ Stop'; beep(880); iv = setInterval(() => { input.value = Math.round((performance.now() - start) / 1000); }, 200); }
        else { clearInterval(iv); input.value = Math.round((performance.now() - start) / 1000); start = null; sw.textContent = '▶ Opnieuw'; beep(660); }
      };
      box.append(sw);
    }
    box.append(inp);
    const row = h(`<div class="row2"></div>`);
    const skip = h(`<button class="btn ghost">Sla over</button>`); skip.onclick = () => this.next();
    const ok = h(`<button class="btn primary">Opslaan ›</button>`);
    ok.onclick = () => { if (input.value !== '') this.tests.push({ test: s.test, value: Number(input.value) }); this.next(); };
    row.append(skip, ok); box.append(row);
    this.shell(box, { phase: 'Begeleide test' });
  }
  r_photo() {
    const box = h(`<div class="p-col center"><h2>Houdingsfoto</h2>
      <p class="muted">Zijaanzicht, op blote voeten, ontspannen staan zoals je normaal staat. Telefoon op heuphoogte, 2–3 meter afstand (zelfontspanner of laat iemand helpen). De foto blijft alleen op je telefoon.</p>
      <label class="btn xl">${icon('camera')} Foto maken<input type="file" accept="image/*" capture="environment" hidden></label><div class="p-photo"></div></div>`);
    const inp = box.querySelector('input');
    inp.onchange = () => { const f = inp.files[0]; if (!f) return; this.photo = f; box.querySelector('.p-photo').innerHTML = `<img src="${URL.createObjectURL(f)}" alt="">`; };
    const ok = h(`<button class="btn primary xl">Afronden ✓</button>`); ok.onclick = () => this.next();
    box.append(ok);
    this.shell(box, { phase: 'Begeleide test' });
  }

  toast(msg) {
    const t = h(`<div class="p-toast">${msg}</div>`); this.root.append(t);
    setTimeout(() => t.classList.add('out'), 2200); setTimeout(() => t.remove(), 2800);
  }

  // ── klok ──
  tick() {
    if (this.paused) return;
    const s = this.seg; if (!s) return;
    const el = this.elapsed();
    const clock = this.root.querySelector('[data-clock]');
    const ring = this.root.querySelector('[data-ring]');
    const countdown = (total, span = total) => {
      const left = Math.max(0, total - el);
      if (clock) clock.textContent = fmtTime(Math.ceil(left));
      if (ring) ring.setAttribute('stroke-dashoffset', (RC * (1 - left / span)).toFixed(1));
      const sec = Math.ceil(left);
      if (sec <= 3 && sec > 0 && sec !== this.lastBeep) { this.lastBeep = sec; beep(520, 0.1); }
      return left;
    };
    if (s.kind === 'timed' || s.kind === 'rest') {
      const left = countdown(s.sec);
      if (s.switchAt) {
        const side = this.root.querySelector('[data-side]');
        const second = el >= s.switchAt;
        if (side) side.textContent = second ? 'Andere kant' : 'Eerste kant';
        if (second && !this.switched) { this.switched = true; beep(990, 0.25); buzz([100, 80, 100]); }
        if (!second) this.switched = false;
      }
      if (left <= 0) this.next();
    } else if (s.kind === 'amrap') {
      const left = countdown(s.sec);
      const g = this.root.querySelector('[data-ghost]');
      if (g && this.ghost) {
        const gr = this.ghost.filter((t) => t <= el).length;
        const d = this.rounds - gr;
        g.innerHTML = `${icon('ghost')} Spook: ${gr} rondes · <b class="${d >= 0 ? 'up' : 'down'}">${d > 0 ? `+${d} voor` : d < 0 ? `${-d} achter` : 'gelijk'}</b>`;
      } else if (g) g.innerHTML = `${icon('ghost')} Eerste keer: jij zet het spook neer.`;
      if (left <= 0) {
        beep(440, 0.6); buzz([200, 100, 200]);
        this.score = { type: 'amrap', rounds: this.rounds, reps: 0, taps: this.taps };
        this.segs.splice(this.i + 1, 0, { kind: 'input', prompt: `Tijd! ${this.rounds} rondes. Hoeveel losse reps nog extra?`, key: 'reps', def: 0 });
        this.i++; this.segStart = performance.now(); this.pauseAcc = 0; this.renderSeg();
      }
    } else if (s.kind === 'fortime') {
      if (clock) clock.textContent = fmtTime(el);
      if (ring) ring.setAttribute('stroke-dashoffset', (RC * (1 - Math.min(1, el / s.cap))).toFixed(1));
      const g = this.root.querySelector('[data-ghost]');
      if (g && this.ghost) { const gr = this.ghost.filter((t) => t <= el).length; g.innerHTML = `${icon('ghost')} Spook is in ronde <b>${Math.min(gr + 1, s.rounds)}</b>`; }
      else if (g) g.innerHTML = `${icon('ghost')} Eerste keer: jij zet het spook neer.`;
      if (el >= s.cap) {
        beep(440, 0.6);
        this.score = { type: 'fortime', capped: true, progress: this.rounds, taps: this.taps };
        this.next();
      }
    } else if (s.kind === 'emom') {
      const mi = Math.floor(el / 60);
      if (mi >= s.minutes) {
        beep(440, 0.6);
        this.segs.splice(this.i + 1, 0, { kind: 'input', prompt: `Hoeveel van de ${s.minutes} minuten heb je volledig gehaald?`, key: 'minutes', def: s.minutes });
        this.score = { type: 'emom', minutes: s.minutes, of: s.minutes };
        this.next(); return;
      }
      if (mi !== this.emomMin) { this.emomMin = mi; if (mi > 0) { beep(990, 0.2); buzz(120); } this.emomRender(s, mi); }
      countdown((mi + 1) * 60, 60);
    }
  }
}
