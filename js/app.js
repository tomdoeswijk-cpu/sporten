import * as store from './store.js';
import { EX, EXERCISES } from './exercises.js';
import { figure } from './figure.js';
import { SPLIT, TYPES, WORKOUTS, ROUTINES, FAMILY, TESTS, SPORTS, SEGMENTS, routineItems, BDN } from './data.js';
import * as L from './logic.js';
import { Player, compileWorkout, compileRoutine, compileCombi, compileBDN, compilePeil } from './player.js';
import * as C from './charts.js';
import { icon, sportIcon } from './icons.js';
import { analyzeWorkout, monthReport, monthKey, prevMonthKey, reportReady, monthName } from './analysis.js';
import { warmupPlan, mainIds } from './player.js';

const $ = (sel, el = document) => el.querySelector(sel);
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const app = $('#app');
const ui = { tab: 'vandaag', train: { seg: 'workouts', type: 'amrap', dur: 20, rseg: 'core', rmin: 10 }, prog: 'weken' };
try { Object.assign(ui.train, JSON.parse(localStorage.getItem('ritme-ui') || '{}')); } catch {}
const saveUi = () => { try { localStorage.setItem('ritme-ui', JSON.stringify(ui.train)); } catch {} };

// ───────── sheets & toasts ─────────
function sheet(content, { onClose } = {}) {
  const ov = h(`<div class="sheet-ov"><div class="sheet" role="dialog"><div class="grab"></div></div></div>`);
  const sh = $('.sheet', ov);
  sh.append(content);
  const close = () => { ov.classList.add('out'); setTimeout(() => ov.remove(), 220); onClose?.(); };
  ov.addEventListener('click', (e) => { if (e.target === ov) close(); });
  document.body.append(ov);
  requestAnimationFrame(() => ov.classList.add('in'));
  return close;
}
function toast(msg) {
  const t = h(`<div class="toast">${msg}</div>`); document.body.append(t);
  requestAnimationFrame(() => t.classList.add('in'));
  setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 300); }, 2600);
}

// ───────── sessies opslaan ─────────
async function addSession(o) {
  const s = { id: L.uid(), ts: Date.now(), date: o.date || L.today(), ...o };
  await store.update((st) => st.sessions.push(s));
  return s;
}
const goalChips = (c) => [c.sport && '<span class="chip sport">sport</span>', c.core && '<span class="chip core">core</span>', c.mob && '<span class="chip mob">mobility</span>'].filter(Boolean).join('');

// ───────── starters ─────────
function startWorkout(w) {
  const isGezin = w.type === 'gezin';
  const plan = compileWorkout(w);
  const b = isGezin ? null : L.best(w.id, plan.scoreType);
  new Player({
    title: w.name, plan, kids: isGezin,
    ghost: b?.s.score.taps || null,
    prBest: plan.scoreType === 'amrap' ? b?.s.score : null,
    onQuit: render,
    onFinish: async (res) => {
      const prev = L.best(w.id, plan.scoreType);
      const s = await addSession({ kind: isGezin ? 'gezin' : 'workout', sport: 'workout', title: w.name, minutes: res.minutes, refId: w.id, counts: { sport: true }, score: res.score, detail: { type: w.type } });
      render();
      showResult(w, s, prev, plan.scoreType);
    },
  });
}
function showResult(w, s, prev, scoreType) {
  let pr = '', body = '';
  if (scoreType && scoreType !== 'kracht') {
    const v = L.scoreValue(scoreType, s.score);
    const isPR = !prev || v > prev.v;
    body = `<div class="result-score">${L.scoreText(scoreType, s.score)}</div>`;
    pr = prev ? (isPR ? `<div class="pr">${icon('trophy')} Nieuw PR!</div>` : `<p class="muted center">PR: ${L.scoreText(scoreType, prev.s.score)}</p>`) : `<p class="muted center">${['amrap', 'fortime'].includes(scoreType) ? 'Eerste keer — dit is je spook voor volgende keer.' : 'Eerste keer — dit is je score om te verslaan.'}</p>`;
  } else if (scoreType === 'kracht') {
    const prs = [];
    for (const st of s.score?.sets || []) {
      const before = L.liftBest(st.ex, s.ts);
      const v = st.kg ? st.kg * 1000 + st.reps : st.reps;
      if (before && v > before.v && !prs.includes(st.ex)) prs.push(st.ex);
    }
    body = `<div class="result-score">${s.score?.sets?.length || 0} sets</div>`;
    pr = prs.length ? `<div class="pr">${icon('trophy')} PR op ${prs.map((e) => EX[e].name).join(', ')}</div>` : '';
  }
  const an = scoreType ? analyzeWorkout(w, s, prev) : { chart: '', notes: [] };
  const anHtml = an.chart || an.notes.length ? `<div class="analysis">${an.chart ? `<div class="label">Tijd per ronde${prev?.s?.score?.taps ? ' · <span class="lg-m">jij</span> <span class="lg-g">spook</span>' : ''}</div>${an.chart}` : ''}${an.notes.map((n) => `<p class="obs">${icon('spark')}<span>${n}</span></p>`).join('')}</div>` : '';
  const c = h(`<div class="sheet-body center"><div class="big-check">✓</div><h2>${esc(w.name)} gedaan</h2>${body}${pr}${anHtml}
    <p class="muted">${s.minutes} min · telt mee voor ${goalChips(s.counts)}</p>
    <div class="stack"><button class="btn primary" data-add>+ Plak er 5 min mobility aan</button><button class="btn ghost" data-close>Klaar</button></div></div>`);
  const close = sheet(c);
  $('[data-close]', c).onclick = close;
  $('[data-add]', c).onclick = () => { close(); const r = L.pickRitual(); const mobR = r.routine?.seg !== 'core' && r.routine ? r.routine : ROUTINES.filter((x) => x.seg === 'mobility').sort((a, b) => L.lastDone(a.id) - L.lastDone(b.id))[0]; startRoutine(mobR, 5); };
}
function startRoutine(r, min) {
  new Player({
    title: `${r.name} · ${min} min`, plan: compileRoutine(r, min), onQuit: render,
    onFinish: async (res) => {
      const goal = SEGMENTS[r.seg].goal;
      const s = await addSession({ kind: 'routine', sport: r.seg, title: `${SEGMENTS[r.seg].label}: ${r.name}`, minutes: min, refId: r.id, counts: { [goal]: true } });
      render(); doneSheet(`${r.name} gedaan`, s);
    },
  });
}
function startCombi(core, mob) {
  new Player({
    title: 'Combi-ritueel', plan: compileCombi(core, mob), onQuit: render,
    onFinish: async () => {
      const s = await addSession({ kind: 'routine', sport: 'combi', title: `Combi: ${core.name} + ${mob.name}`, minutes: 10, refId: 'combi', counts: { core: true, mob: true }, detail: { parts: [core.id, mob.id] } });
      render(); doneSheet('Combi-ritueel gedaan', s);
    },
  });
}
function doneSheet(title, s, extra = '') {
  const c = h(`<div class="sheet-body center"><div class="big-check">✓</div><h2>${esc(title)}</h2><p class="muted">Telt mee voor ${goalChips(s.counts) || 'je actieve dagen'}</p>${extra}<button class="btn primary" data-close>Top</button></div>`);
  const close = sheet(c); $('[data-close]', c).onclick = close;
}
function startBDN(round = 1, acc = 0) {
  new Player({
    title: 'Beter dan niets', plan: compileBDN(), bdn: { round }, onQuit: () => { if (round > 1) saveBDN(round - 1, acc); else render(); },
    onFinish: (res) => {
      const total = acc + res.minutes;
      const c = h(`<div class="sheet-body center"><div class="big-check">✓</div><h2>Ronde ${round} klaar</h2>
        <p class="muted">${round >= 3 ? 'Dit telt al als sportmoment!' : `Nog ${3 - round} ${3 - round === 1 ? 'ronde' : 'rondes'} en het telt als sportmoment.`}</p>
        <div class="stack"><button class="btn primary" data-more>Nog een rondje?</button><button class="btn ghost" data-stop>Stoppen & opslaan</button></div></div>`);
      const close = sheet(c, { onClose: () => {} });
      $('[data-more]', c).onclick = () => { close(); startBDN(round + 1, total); };
      $('[data-stop]', c).onclick = () => { close(); saveBDN(round, total); };
    },
  });
}
async function saveBDN(rounds, minutes) {
  const s = await addSession({ kind: 'bdn', sport: 'workout', title: `Beter dan niets (${rounds}×)`, minutes: Math.max(1, minutes), refId: 'bdn', counts: { sport: rounds >= 3 }, score: { rounds } });
  render();
  toast(rounds >= 3 ? 'Opgeslagen — telt als sportmoment' : 'Opgeslagen — telt als actieve dag ✓');
}
function startPeil() {
  new Player({
    title: 'Begeleide test', plan: compilePeil(), onQuit: render,
    onFinish: async (res) => {
      const date = L.today();
      await store.update((st) => { for (const t of res.tests) st.peil.push({ id: L.uid(), date, test: t.test, value: t.value }); });
      if (res.photo) await store.putPhoto(`posture-${date}`, res.photo);
      const s = await addSession({ kind: 'peil', sport: 'workout', title: 'Begeleide test', minutes: res.minutes, refId: 'peil', counts: { sport: true } });
      render(); doneSheet('Test klaar', s, `<p>${res.tests.length} tests vastgelegd${res.photo ? ' + houdingsfoto' : ''}.</p>`);
    },
  });
}

// ───────── VANDAAG ─────────
const tile = (name, cls = '') => `<span class="itile ${cls}">${icon(name)}</span>`;
function weekRings(w) {
  const rings = [['sport', w.sport, 64], ['core', w.core, 50], ['mob', w.mob, 36]];
  let s = '<svg viewBox="0 0 160 160" class="wrings" aria-hidden="true">';
  rings.forEach(([cls, n, R], i) => {
    const p = Math.min(1, n / 3), Cc = 2 * Math.PI * R;
    s += `<circle cx="80" cy="80" r="${R}" class="trk ${cls}"/>`;
    if (p) s += `<circle cx="80" cy="80" r="${R}" class="val ${cls}" style="--len:${(Cc * p).toFixed(1)};--full:${Cc.toFixed(1)};animation-delay:${i * 120}ms" stroke-dasharray="${(Cc * p).toFixed(1)} ${Cc.toFixed(1)}" transform="rotate(-90 80 80)"/>`;
  });
  return s + '</svg>';
}
function dayStrip(w) {
  const wk = L.weekKey(L.today()), t = L.today();
  let o = '<div class="days">';
  for (let i = 0; i < 7; i++) {
    const date = L.addDays(wk, i), ss = w.sessions.filter((x) => x.date === date);
    const has = (k) => ss.some((x) => x.counts?.[k]);
    const any = ss.length > 0;
    o += `<div class="day ${date === t ? 'today' : ''} ${date > t ? 'future' : ''} ${any ? 'act' : ''}"><span>${L.DAYS[i]}</span><div class="dbars"><i class="${has('sport') ? 'sport' : ''}"></i><i class="${has('core') ? 'core' : ''}"></i><i class="${has('mob') ? 'mob' : ''}"></i></div></div>`;
  }
  return o + '</div>';
}
function greeting() { const hr = new Date().getHours(); return hr < 6 ? 'Goedenacht' : hr < 12 ? 'Goedemorgen' : hr < 18 ? 'Goedemiddag' : 'Goedenavond'; }
function weekNo(s) { const d = L.parse(s); d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7)); const j = new Date(d.getFullYear(), 0, 4); return 1 + Math.round(((d - j) / 864e5 - 3 + ((j.getDay() + 6) % 7)) / 7); }

function viewVandaag() {
  const st = store.get(), w = L.weekStats(), t = L.today(), d = L.dow(t);
  const el = h(`<div class="view"></div>`);
  el.append(h(`<header class="hero"><div><small>${L.DAYS_LONG[d]} ${L.fmtDate(t).split(' ').slice(1).join(' ')}</small><h1>${greeting()}</h1></div></header>`));

  // Weekstand
  const row = (cls, label, n) => `<div class="wl-row ${cls} ${n >= 3 ? 'met' : ''}"><i></i><span>${label}</span><b>${n}<small>/3</small></b>${n >= 3 ? icon('check', 'ok') : '<span></span>'}</div>`;
  el.append(h(`<section class="card weekhero"><div class="wh-top"><div class="wh-rings">${weekRings(w)}<div class="wh-c"><b>${w.sport + w.core + w.mob}</b><small>van 9</small></div></div>
    <div class="wh-list">${row('sport', 'Sport', w.sport)}${row('core', 'Core', w.core)}${row('mob', 'Mobility', w.mob)}</div></div>
    ${dayStrip(w)}</section>`));

  // Dagritueel — de hoofdactie van vandaag
  const r = L.pickRitual();
  const segCls = r.combi ? 'combi' : r.routine?.seg === 'core' ? 'core' : 'mob';
  const segLabel = r.combi ? 'Combi · telt dubbel' : r.bonus ? 'Bonus' : SEGMENTS[r.routine.seg].label;
  const name = r.combi ? `${r.core.name} + ${r.mob.name}` : r.routine.name;
  const firstEx = r.combi ? r.core.items[0] : r.routine.items[0];
  const rit = h(`<section class="card daily ${segCls}"><div class="daily-main"><div><div class="eyebrow"><span class="dotc"></span>${segLabel} · ${r.min} min</div>
    <h3>${esc(name)}</h3>${r.doneToday ? '<p class="muted small">Vandaag al gedaan ✓</p>' : ''}</div><div class="daily-fig"></div></div>
    <button class="btn primary wide" data-start>${icon('play')} Start dagritueel</button><button class="link" data-pick>Andere routine kiezen</button></section>`);
  $('.daily-fig', rit).append(figure(EX[firstEx]));
  $('[data-start]', rit).onclick = () => (r.combi ? startCombi(r.core, r.mob) : startRoutine(r.routine, r.min));
  $('[data-pick]', rit).onclick = () => { ui.tab = 'trainen'; ui.train.seg = 'routines'; go(); };
  el.append(rit);

  // Rustige lijst met wat er verder speelt
  const rows = [];
  const qrow = (ic, cls, title, sub, fn) => { const b = h(`<button class="qrow"><span class="qic ${cls}">${icon(ic)}</span><span class="qt"><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</span><span class="chev">›</span></button>`); b.onclick = fn; rows.push(b); };

  const rr = reportReady();
  if (rr) qrow('spark', 'violet', `${monthName(rr).split(' ')[0].replace(/^./, (c) => c.toUpperCase())}-rapport staat klaar`, '', () => { ui.tab = 'voortgang'; ui.prog = 'maand'; ui.month = rr; go(); });

  const rs = L.rescue();
  if (rs) {
    const need = [rs.need.sport && `${rs.need.sport} sport`, rs.need.core && `${rs.need.core} core`, rs.need.mob && `${rs.need.mob} mobility`].filter(Boolean).join(', ');
    qrow('shield', 'coral', 'Week redden', `Nog ${need} in ${rs.left} ${rs.left === 1 ? 'dag' : 'dagen'}`, () => {
      const c = h(`<div class="sheet-body"><h2>Week redden</h2><p class="muted">${rs.feasible ? 'Zo haal je het nog:' : 'Alles halen wordt krap, dit is de beste route:'}</p>
        <ol class="route">${rs.route.map((x) => `<li><b>${L.DAYS_LONG[x.day]}</b><span>${x.parts.join(' + ')}</span></li>`).join('')}</ol><button class="btn ghost" data-close>Sluiten</button></div>`);
      const close = sheet(c); $('[data-close]', c).onclick = close;
    });
  }

  qrow('bolt', 'neutral', 'Beter dan niets', 'Zonnegroet, 10 push-ups, 10 squats', () => startBDN());

  const lb = st.settings.lastBackup;
  if (st.sessions.length >= 3 && (!lb || Date.now() - lb > 30 * 864e5) && (d === 6 || !lb)) qrow('cloud', 'cyan', 'Back-up maken', lb ? 'Laatste is ouder dan een maand' : 'Nog nooit gedaan', doExport);

  const ql = h(`<section class="card qlist"></section>`); rows.forEach((x) => ql.append(x)); el.append(ql);

  // Log deze week
  const log = h(`<section class="log"><div class="label pad">Deze week</div></section>`);
  if (!w.sessions.length) log.append(h(`<p class="muted small pad">Nog niks gelogd. Tik op + om te turven.</p>`));
  [...w.sessions].reverse().forEach((s) => {
    const cls = s.counts?.sport ? 'lime' : s.counts?.core && s.counts?.mob ? 'combi' : s.counts?.core ? 'coral' : s.counts?.mob ? 'cyan' : 'neutral';
    const ic = s.kind === 'bdn' ? 'bolt' : s.kind === 'peil' ? 'ruler' : s.kind === 'gezin' ? 'family' : sportIcon[s.sport] || 'spark';
    const row = h(`<div class="log-row"><span class="qic ${cls}">${icon(ic)}</span><div><b>${esc(s.title)}</b><small>${L.DAYS_LONG[L.dow(s.date)]} · ${s.minutes} min${s.km ? ` · ${s.km} km` : ''}</small></div><button class="x" aria-label="Verwijderen">✕</button></div>`);
    $('.x', row).onclick = async () => { if (confirm(`"${s.title}" verwijderen?`)) { await store.update((st2) => { st2.sessions = st2.sessions.filter((x) => x.id !== s.id); }); render(); } };
    log.append(row);
  });
  el.append(log);
  return el;
}

// ───────── TURVEN ─────────
function turfSheet(preset) {
  const map = { Hardlopen: 'run', Racefiets: 'bike', Squash: 'squash', Hyrox: 'hyrox' };
  let sport = map[preset] || 'run', min = 45, date = L.today();
  const c = h(`<div class="sheet-body"><h2>Turven</h2>
    <div class="label">Sport</div><div class="chipset" data-sport>${SPORTS.filter((s) => s.id !== 'workout').map((s) => `<button data-v="${s.id}">${s.label}</button>`).join('')}</div>
    <input class="other" name="otherName" placeholder="Wat heb je gedaan?" hidden>
    <div class="label">Duur (minuten)</div><div class="chipset" data-min>${[20, 30, 45, 60, 75, 90, 120].map((m) => `<button data-v="${m}">${m}</button>`).join('')}</div>
    <input type="number" inputmode="numeric" name="min" value="45" class="minput">
    <div class="km" hidden><div class="label">Afstand (km, optioneel)</div><input type="number" inputmode="decimal" step="0.1" name="km" placeholder="bijv. 10"></div>
    <div class="label">Wanneer</div><div class="chipset" data-date><button data-v="0">Vandaag</button><button data-v="-1">Gisteren</button><button data-v="-2">Eergisteren</button></div>
    <button class="btn primary xl" data-save>Opslaan</button></div>`);
  const sel = (set, v) => set.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.v === String(v)));
  const S = $('[data-sport]', c), M = $('[data-min]', c), D = $('[data-date]', c);
  const upd = () => {
    sel(S, sport); sel(M, min); sel(D, Math.round((L.parse(date) - L.parse(L.today())) / 864e5));
    $('.km', c).hidden = !SPORTS.find((s) => s.id === sport)?.km;
    $('.other', c).hidden = sport !== 'other';
  };
  S.onclick = (e) => { if (e.target.dataset.v) { sport = e.target.dataset.v; upd(); } };
  M.onclick = (e) => { if (e.target.dataset.v) { min = Number(e.target.dataset.v); $('[name=min]', c).value = min; upd(); } };
  D.onclick = (e) => { if (e.target.dataset.v) { date = L.addDays(L.today(), Number(e.target.dataset.v)); upd(); } };
  $('[name=min]', c).oninput = (e) => { min = Number(e.target.value); upd(); };
  $('[data-save]', c).onclick = async () => {
    const sp = SPORTS.find((s) => s.id === sport);
    const km = Number($('[name=km]', c).value) || null;
    const title = sport === 'other' ? ($('[name=otherName]', c).value || 'Overig') : sp.label;
    await addSession({ kind: 'sport', sport, title, minutes: min || 0, km, date, counts: { sport: true } });
    close(); render(); toast(`${title} geturfd ✓`);
  };
  upd();
  const close = sheet(c);
}

// ───────── TRAINEN ─────────
function seg(options, cur, onPick, cls = '') {
  const el = h(`<div class="segctl ${cls}">${options.map(([v, l]) => `<button data-v="${v}" class="${String(v) === String(cur) ? 'on' : ''}">${l}</button>`).join('')}</div>`);
  el.onclick = (e) => { const b = e.target.closest('button'); if (b) onPick(b.dataset.v); };
  return el;
}
function summary(w) {
  const m = w.main, k = m.kind || w.type;
  const names = (steps) => steps.map((s) => EX[L.resolveEx(s.ex)].name).join(' · ');
  if (k === 'amrap') return `AMRAP ${Math.round((m.sec || SPLIT_OF(w)[1]) / 60)} min · ${names(m.steps)}`;
  if (k === 'fortime') return `${m.rounds} ${m.rounds === 1 ? 'ronde' : 'rondes'} · ${names(m.steps)}`;
  if (k === 'emom') return `EMOM ${m.minutes} min · ${names(m.steps)}`;
  if (k === 'tabata') return `${m.blocks.length}× Tabata · ${m.blocks.map((b) => b.map((x) => EX[x].name).join('/')).join(' · ')}`;
  if (k === '4020') return `40/20 × ${m.rounds} · ${names(m.steps)}`;
  if (k === 'kracht') return m.sets.map((s) => `${EX[L.resolveEx(s.ex)].name} ${s.sets}×${s.reps}`).join(' · ');
  if (k === 'timed') return m.list.map(([e]) => EX[e].name).filter((v, i, a) => a.indexOf(v) === i).join(' · ');
  return '';
}
function workoutExIds(w) {
  const m = w.main, k = m.kind || w.type;
  if (k === 'kracht') return [...new Set(m.sets.map((x) => L.resolveEx(x.ex)))];
  if (k === 'tabata') return [...new Set(m.blocks.flat())];
  if (k === 'timed') return [...new Set(m.list.map(([e]) => e))];
  return [...new Set(m.steps.map((x) => L.resolveEx(x.ex)))];
}
function thumbs(ids, n = 5) {
  const box = h('<div class="thumbs"></div>');
  ids.slice(0, n).forEach((id) => { const t = h('<span class="thumb"></span>'); t.append(figure(EX[id], { animate: false })); box.append(t); });
  if (ids.length > n) box.append(h(`<span class="thumb more">+${ids.length - n}</span>`));
  return box;
}
function workoutCard(w, suggested) {
  const st = w.type === 'gezin' ? null : compileWorkout(w).scoreType;
  const b = st && st !== 'kracht' ? L.best(w.id, st) : null;
  const done = store.get().sessions.filter((x) => x.refId === w.id);
  const tl = w.type === 'gezin' ? 'Gezin' : TYPES[w.type].label;
  const card = h(`<button class="card wcard t-${w.type}"><div class="wc-head"><span class="wtype">${tl}</span><span class="wdur">${icon('clock')}${w.dur} min</span>${suggested ? '<span class="sugg">Voorstel</span>' : ''}</div>
    <h3>${esc(w.name)}</h3><div data-th></div><p class="muted small">${summary(w)}</p>
    ${done.length ? `<div class="wmeta"><span>${done.length}× gedaan · laatst ${L.fmtDate(done.at(-1).date)}</span>${b ? `<span class="prb">${icon('trophy')} ${L.scoreText(st, b.s.score)}</span>` : ''}</div>` : ''}</button>`);
  $('[data-th]', card).replaceWith(thumbs(workoutExIds(w)));
  card.onclick = () => workoutDetail(w);
  return card;
}
function routineCard(r, min, suggested, mob) {
  const items = mob ? [...r.items.slice(0, 5), ...mob.items.slice(0, 5)] : routineItems(r, min);
  const done = store.get().sessions.filter((x) => (mob ? x.refId === 'combi' && x.detail?.parts?.[0] === r.id : x.refId === r.id));
  const cls = mob ? 'combi' : r.seg;
  const card = h(`<button class="card wcard t-${cls}"><div class="wc-head"><span class="wtype">${mob ? 'Combi' : SEGMENTS[r.seg].label}</span><span class="wdur">${icon('clock')}${mob ? 10 : min} min</span>${suggested ? '<span class="sugg">Voorstel</span>' : ''}</div>
    <h3>${mob ? `${r.name} + ${mob.name}` : r.name}</h3><div data-th></div><p class="muted small">${[...new Set(items)].slice(0, 10).map((x) => EX[x].name).join(' · ')}</p>
    ${done.length || mob ? `<div class="wmeta"><span>${done.length ? `${done.length}× gedaan` : ''}</span>${mob ? '<span class="dbl">telt dubbel</span>' : ''}</div>` : ''}</button>`);
  $('[data-th]', card).replaceWith(thumbs([...new Set(items)], 6));
  card.onclick = () => routineDetail(r, mob ? 10 : min, mob);
  return card;
}
function exList(ids, extra = {}) {
  const box = h(`<div class="exlist"></div>`);
  ids.forEach((id) => {
    const ex = EX[id];
    const row = h(`<details class="exrow"><summary><span class="mini"></span><span class="nm">${extra[id] || ''}${ex.name}</span><span class="chev">›</span></summary><div class="exd"><div class="fig-big"></div><p>${ex.desc}</p><p class="tip"><b>Houding:</b> ${ex.tip}</p></div></details>`);
    $('.mini', row).append(figure(ex, { animate: false }));
    row.addEventListener('toggle', () => { if (row.open && !$('.fig-big svg', row)) $('.fig-big', row).append(figure(ex)); });
    box.append(row);
  });
  return box;
}
function workoutDetail(w) {
  const m = w.main, k = m.kind || w.type;
  let ids = [], amt = {};
  if (k === 'kracht') m.sets.forEach((s) => { const id = L.resolveEx(s.ex); ids.push(id); amt[id] = `${s.sets}×${s.reps} `; });
  else if (k === 'tabata') ids = [...new Set(m.blocks.flat())];
  else if (k === 'timed') ids = [...new Set(m.list.map(([e]) => e))];
  else m.steps.forEach((s) => { const id = L.resolveEx(s.ex); ids.push(id); const a = s.cal ? `${s.cal} cal ` : s.m ? `${s.m} m ` : Array.isArray(s.reps) ? `${s.reps.join('-')} ` : s.reps ? `${s.reps}× ` : ''; amt[id] = a; });
  ids = [...new Set(ids)];
  const type = w.type === 'gezin' ? { label: 'Gezin', uitleg: w.uitleg } : TYPES[w.type];
  const formatTxt = k === 'tabata' ? `${m.blocks.length}× Tabata: 8 rondes van 20 sec werk / 10 sec rust, 1 min rust tussen blokken. Na elk blok vul je je reps in.` : k === '4020' ? `${m.rounds} rondes van 40 sec werk / 20 sec rust. Aan het eind vul je je totaal aantal reps in.` : k === 'emom' ? `Elke minuut start je de opdracht; wat over is van de minuut is rust. ${m.minutes} minuten.` : k === 'amrap' ? 'Zoveel mogelijk rondes. Tik na elke ronde op de grote knop: dan telt de app je score en rent je spook mee.' : k === 'fortime' ? 'Zo snel mogelijk, binnen de tijdslimiet. Tik na elke ronde op de knop voor je tussentijden.' : k === 'kracht' ? 'Per set log je gewicht en reps; de rusttimer start vanzelf. Je ziet wat je vorige keer deed.' : type.uitleg;
  const c = h(`<div class="sheet-body"><div class="eyebrow">${type.label}${w.dur ? ` · ${w.dur} min` : ''}</div><h2>${esc(w.name)}</h2><p class="muted">${formatTxt}</p>
    ${(() => { const wp = warmupPlan(mainIds(w)); const names = [wp.pulse, ...wp.prep].slice(0, 5).map((x) => EX[x].name).join(' · '); return `<div class="wu"><div class="label">Warming-up${w.type !== 'gezin' ? ` · ${Math.round(SPLIT_OF(w)[0] / 60)} min` : ''}${wp.patterns.length ? ` · afgestemd op ${wp.patterns.join(', ')}` : ''}</div><p class="small muted">${names}</p></div>`; })()}
    <div class="label">Oefeningen</div></div>`);
  c.append(exList(ids, amt));
  const b = h(`<button class="btn primary xl sticky">Start ${esc(w.name)}</button>`);
  c.append(b);
  const close = sheet(c);
  b.onclick = () => { close(); startWorkout(w); };
}
const SPLIT_OF = (w) => SPLIT[w.dur] || [0, 0, 0];

function routineDetail(r, min, combiMob) {
  const items = combiMob ? [...r.items.slice(0, 5), ...combiMob.items.slice(0, 5)] : routineItems(r, min);
  const c = h(`<div class="sheet-body"><div class="eyebrow">${combiMob ? 'Combi · 10 min · telt voor core én mobility' : `${SEGMENTS[r.seg].label} · ${min} min`}</div><h2>${combiMob ? `${r.name} + ${combiMob.name}` : r.name}</h2>
    <p class="muted">${r.seg === 'core' && !combiMob ? 'Per oefening 45 sec werk, 15 sec rust. Eenzijdige oefeningen: halverwege wisselen.' : 'Per oefening 60 sec, rustig ademen. Eenzijdig: na 30 sec seintje om te wisselen.'}${min === 15 ? ' De eerste 5 doe je twee keer.' : ''}</p><div class="label">Oefeningen</div></div>`);
  c.append(exList([...new Set(items)]));
  const b = h(`<button class="btn primary xl sticky">Start</button>`); c.append(b);
  const close = sheet(c);
  b.onclick = () => { close(); combiMob ? startCombi(r, combiMob) : startRoutine(r, min); };
}

function viewTrainen() {
  const T = ui.train;
  if (!['workouts', 'routines', 'gezin', 'lib'].includes(T.seg)) T.seg = 'workouts';
  const el = h(`<div class="view"><header class="hero"><h1>Trainen</h1></header></div>`);
  el.append(seg([['workouts', 'Workouts'], ['routines', 'Routines'], ['gezin', 'Gezin'], ['lib', 'Oefeningen']], T.seg, (v) => { T.seg = v; saveUi(); go(); }, 'tabs'));

  if (T.seg === 'workouts') {
    el.append(seg(Object.entries(TYPES).map(([k, v]) => [k, v.label]), T.type, (v) => { T.type = v; if (!TYPES[v].durs.includes(Number(T.dur))) T.dur = TYPES[v].durs[1]; saveUi(); go(); }));
    if (!TYPES[T.type].durs.includes(Number(T.dur))) T.dur = TYPES[T.type].durs[1];
    el.append(h(`<p class="muted pad">${TYPES[T.type].uitleg}</p>`));
    el.append(seg(TYPES[T.type].durs.map((d) => [d, `${d} min`]), T.dur, (v) => { T.dur = Number(v); saveUi(); go(); }, 'small'));
    const ws = WORKOUTS.filter((w) => w.type === T.type && w.dur === Number(T.dur)).sort((a, b) => L.lastDone(a.id) - L.lastDone(b.id));
    ws.forEach((w, i) => el.append(workoutCard(w, i === 0)));
    const rnd = h(`<button class="btn ghost wide">${icon('dice')} Verras me</button>`);
    rnd.onclick = () => workoutDetail(ws[Math.floor(Math.random() * ws.length)]);
    el.append(rnd);
  }
  if (T.seg === 'routines') {
    el.append(seg([['core', 'Core'], ['mobility', 'Mobility'], ['posture', 'Posture'], ['combi', 'Combi']], T.rseg, (v) => { T.rseg = v; saveUi(); go(); }));
    if (T.rseg === 'combi') {
      el.append(h(`<p class="muted pad">5 min core + 5 min mobility of posture. Telt voor allebei je hygiënedoelen.</p>`));
      const cores = ROUTINES.filter((r) => r.seg === 'core'), mobs = ROUTINES.filter((r) => r.seg !== 'core');
      cores.forEach((cr, i) => {
        const mb = mobs[(i * 2 + new Date().getDate()) % mobs.length];
        el.append(routineCard(cr, 10, false, mb));
      });
    } else {
      el.append(seg([[5, '5 min'], [10, '10 min'], [15, '15 min']], T.rmin, (v) => { T.rmin = Number(v); saveUi(); go(); }, 'small'));
      ROUTINES.filter((r) => r.seg === T.rseg).sort((a, b) => L.lastDone(a.id) - L.lastDone(b.id)).forEach((r, i) => {
        el.append(routineCard(r, Number(T.rmin), i === 0));
      });
    }
  }
  if (T.seg === 'gezin') {
    el.append(h(`<p class="muted pad">Sporten mét je dochters in plaats van ondanks. Telt als sportmoment.</p>`));
    FAMILY.forEach((f) => { const card = workoutCard({ ...f, type: 'gezin' }); card.querySelector('h3').insertAdjacentHTML('afterend', `<p class="fam">${f.uitleg}</p>`); el.append(card); });
  }
  if (T.seg === 'lib') {
    const groups = [['duwen', 'Duwen'], ['trekken', 'Trekken'], ['benen', 'Benen & heup'], ['core', 'Core'], ['conditie', 'Conditie'], ['mobility', 'Mobility'], ['posture', 'Posture'], ['warmup', 'Warming-up'], ['gezin', 'Gezin'], ['peil', 'Peil']];
    for (const [k, l] of groups) {
      const ids = EXERCISES.filter((e) => e.cat === k).map((e) => e.id);
      if (!ids.length) continue;
      el.append(h(`<div class="label pad">${l} <small>${ids.length}</small></div>`));
      el.append(exList(ids));
    }
  }
  return el;
}

// ───────── PEIL ─────────
const TEST_GROUPS = [...new Set(TESTS.map((t) => t.group))];
function peilPanel() {
  const box = h(`<div class="stackv"></div>`);
  const act = h(`<div class="row2"><button class="btn primary" data-log>${icon('plus')} Meting loggen</button><button class="btn ghost" data-sess>Begeleide test</button></div>`);
  $('[data-log]', act).onclick = () => peilLogSheet();
  $('[data-sess]', act).onclick = () => {
    const c = h(`<div class="sheet-body"><h2>Begeleide test</h2><p class="muted">±25 minuten. De app leidt je langs push-ups, pull-ups, dead hang, verspringen, Bulgarian per been, hollow hold, knee-to-wall en squat hold, en sluit af met een houdingsfoto. Na elke test vul je je score in.</p><button class="btn primary" data-go>${icon('play')} Start</button></div>`);
    const close = sheet(c); $('[data-go]', c).onclick = () => { close(); startPeil(); };
  };
  box.append(act);
  const v = C.peilView();
  v.addEventListener('click', (e) => { const r = e.target.closest('[data-test]'); if (r) peilTestSheet(r.dataset.test); });
  box.append(v);
  return box;
}
// Tijd invoeren met losse velden: werkt op elk numeriek toetsenbord (geen dubbele punt nodig)
function valueInput(t, v) {
  if (t.unit === 'time') {
    const hh = v ? Math.floor(v / 3600) : '', mm = v ? Math.floor((v % 3600) / 60) : '', ss = v ? v % 60 : '';
    return `<div class="tin">${t.id === 'run10' ? `<label><input type="number" inputmode="numeric" name="h" min="0" value="${hh || ''}" placeholder="0"><small>uur</small></label>` : ''}<label><input type="number" inputmode="numeric" name="m" min="0" value="${mm}" placeholder="0"><small>min</small></label><label><input type="number" inputmode="numeric" name="s" min="0" max="59" value="${ss}" placeholder="0"><small>sec</small></label></div>`;
  }
  const unit = { reps: 'herhalingen', sec: 'seconden', cm: 'cm' }[t.unit];
  return `<div class="tin one"><label><input type="number" inputmode="decimal" name="v" min="0" value="${v ?? ''}" placeholder="0"><small>${unit}</small></label></div>`;
}
function readValue(t, c) {
  const n = (name) => Number($(`[name=${name}]`, c)?.value || 0);
  if (t.unit === 'time') { if (n('s') > 59) return null; return n('h') * 3600 + n('m') * 60 + n('s'); }
  return n('v');
}
function peilLogSheet(testId, onDone) {
  let test = testId || store.get().settings.lastTest || 'pushups';
  if (!L.testById(test)) test = 'pushups';
  const c = h(`<div class="sheet-body"><h2>Meting loggen</h2>
    <div class="label">Test</div><div class="tests">${TEST_GROUPS.map((g) => `<div class="tg"><small>${g}</small><div class="chipset">${TESTS.filter((t) => t.group === g).map((t) => `<button data-v="${t.id}">${t.name.replace('Bulgarian split squat', 'Bulgarian')}</button>`).join('')}</div></div>`).join('')}</div>
    <p class="how small muted"></p>
    <div class="label">Resultaat</div><div data-val></div>
    <label class="field">Datum<input type="date" name="date" value="${L.today()}" max="${L.today()}"></label>
    <p class="err" hidden></p>
    <button class="btn primary xl" data-save>Opslaan</button></div>`);
  const upd = () => {
    c.querySelectorAll('.tests button').forEach((b) => b.classList.toggle('on', b.dataset.v === test));
    const t = L.testById(test);
    $('.how', c).textContent = t.how;
    $('[data-val]', c).innerHTML = valueInput(t);
  };
  $('.tests', c).onclick = (e) => { const b = e.target.closest('button'); if (b) { test = b.dataset.v; upd(); } };
  $('[data-save]', c).onclick = async () => {
    const t = L.testById(test), v = readValue(t, c), date = $('[name=date]', c).value || L.today();
    const err = $('.err', c);
    if (v == null || !(v > 0)) { err.hidden = false; err.textContent = t.unit === 'time' ? 'Vul een geldige tijd in (seconden 0–59).' : 'Vul een waarde groter dan 0 in.'; return; }
    await store.update((st) => { st.peil.push({ id: L.uid(), date, test, value: v }); st.settings.lastTest = test; });
    close(); ui.tab = 'voortgang'; ui.prog = 'peil'; go(); toast(`${t.name}: ${L.fmtTest(t, v)} opgeslagen`);
    onDone?.();
  };
  upd();
  const close = sheet(c);
}
function peilTestSheet(id) {
  const t = L.testById(id);
  const c = h(`<div class="sheet-body"><div class="eyebrow">${t.group}</div><h2>${t.name}</h2><p class="small muted">${t.how}</p><div data-chart></div><div class="label">Metingen</div><div class="hist edit"></div>
    <button class="btn primary" data-add>${icon('plus')} Nieuwe meting</button></div>`);
  const list = () => {
    const box = $('.hist', c), ser = L.testSeries(id), s = [...ser].reverse(), best = L.testBest(id);
    $('[data-chart]', c).innerHTML = ser.length > 1 ? C.lineChart(t, ser) : '';
    box.innerHTML = s.length ? '' : '<p class="muted small">Geen metingen meer.</p>';
    s.forEach((x) => {
      const r = h(`<div><span>${L.fmtDate(x.date)}</span><b>${L.fmtTest(t, x.value)}${best && x.id === best.id ? ` <em class="prb">${icon('trophy')}</em>` : ''}</b><button class="x" aria-label="Verwijderen">✕</button></div>`);
      $('.x', r).onclick = async () => {
        if (!confirm(`Meting van ${L.fmtDate(x.date)} (${L.fmtTest(t, x.value)}) verwijderen?`)) return;
        await store.update((st) => { st.peil = st.peil.filter((p) => p.id !== x.id); });
        list(); render(); toast('Meting verwijderd');
      };
      box.append(r);
    });
  };
  list();
  const close = sheet(c);
  $('[data-add]', c).onclick = () => { close(); peilLogSheet(id); };
}

// ───────── VOORTGANG ─────────
function viewVoortgang() {
  const el = h(`<div class="view"><header class="hero row"><h1>Voortgang</h1><button class="icon-btn" aria-label="Instellingen" data-set>${icon('gear')}</button></header></div>`);
  $('[data-set]', el).onclick = settingsSheet;
  el.append(seg([['weken', 'Weken'], ['maand', 'Maand'], ['sporten', 'Sporten'], ['prs', "PR's"], ['peil', 'Peil']], ui.prog, (v) => { ui.prog = v; go(); }, 'tabs'));
  const st = store.get();
  if (ui.prog === 'maand') {
    ui.month ||= new Date().getDate() <= 7 ? prevMonthKey(monthKey()) : monthKey();
    if (ui.month !== monthKey()) store.update((x) => { if (ui.month === prevMonthKey(monthKey())) x.settings.reportSeen = ui.month; });
    el.append(monthReport(ui.month, { onNav: (k) => { ui.month = k; render(); } }));
    return el;
  }
  if (!st.sessions.length && ui.prog !== 'peil') {
    el.append(h(`<div class="card empty"><h3>Nog geen data</h3><p class="muted">Turf je eerste sessie of doe een workout. Na een paar weken wordt dit je favoriete scherm.</p></div>`));
    return el;
  }
  if (ui.prog === 'weken') el.append(C.weeksView());
  if (ui.prog === 'sporten') el.append(C.sportsView());
  if (ui.prog === 'prs') {
    const v = C.prView();
    v.addEventListener('click', (e) => {
      const r = e.target.closest('[data-ref]'); if (!r) return;
      const w = L.workoutById(r.dataset.ref); const hs = L.historyOf(r.dataset.ref); if (!w || !hs.length) return;
      const last = hs.at(-1), type = last.score.type;
      const before = hs.slice(0, -1).reduce((b, x) => { const val = L.scoreValue(type, x.score); return val != null && (!b || val > b.v) ? { v: val, s: x } : b; }, null);
      const an = analyzeWorkout(w, last, before);
      const c = h(`<div class="sheet-body"><div class="eyebrow">Laatste keer · ${L.fmtDate(last.date)}</div><h2>${esc(w.name)}</h2><div class="result-score">${L.scoreText(type, last.score)}</div>
        <div class="analysis">${an.chart ? `<div class="label">Tijd per ronde${before?.s?.score?.taps ? ' · <span class="lg-m">jij</span> <span class="lg-g">beste ervoor</span>' : ''}</div>${an.chart}` : ''}${an.notes.map((n) => `<p class="obs">${icon('spark')}<span>${n}</span></p>`).join('') || '<p class="muted small">Nog te weinig data voor een analyse.</p>'}</div>
        <div class="label">Geschiedenis</div><div class="hist">${[...hs].reverse().map((x) => `<div><span>${L.fmtDate(x.date)}</span><b>${L.scoreText(type, x.score)}</b></div>`).join('')}</div>
        <button class="btn primary" data-go>${icon('play')} Opnieuw doen</button></div>`);
      const close = sheet(c);
      $('[data-go]', c).onclick = () => { close(); workoutDetail(w); };
    });
    el.append(v);
  }
  if (ui.prog === 'peil') el.append(peilPanel());
  return el;
}

// ───────── INSTELLINGEN / BACK-UP ─────────
async function doExport() {
  const json = await store.exportAll();
  const name = `ritme-backup-${L.today()}.json`;
  const file = new File([json], name, { type: 'application/json' });
  let ok = false;
  if (navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file], title: 'Ritme back-up' }); ok = true; } catch (e) { if (e.name === 'AbortError') return; } }
  if (!ok) { const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = name; a.click(); ok = true; }
  await store.update((s) => { s.settings.lastBackup = Date.now(); });
  toast('Back-up gemaakt ✓'); render();
}
async function settingsSheet() {
  const st = store.get().settings;
  const persisted = await store.isPersisted();
  const c = h(`<div class="sheet-body"><h2>Instellingen</h2>
    <div class="label">Standaardduur dagritueel</div><div class="chipset" data-rm>${[5, 10, 15].map((m) => `<button data-v="${m}" class="${m === st.ritualMin ? 'on' : ''}">${m} min</button>`).join('')}</div>
    <label class="field">Pull-ups achter elkaar (tot je eerste peilmoment)<input type="number" inputmode="numeric" name="pull" value="${st.pullLevel ?? 3}"><small>Onder de 5 gebruikt de app pull-ups met band.</small></label>
    <div class="label">Gegevens</div>
    <p class="small muted">Alles staat alleen op deze telefoon. Opslag: ${persisted ? '<b class="okc">persistent ✓</b>' : '<b>niet gegarandeerd</b> — installeer de app op je beginscherm'}. Laatste back-up: ${st.lastBackup ? L.fmtDate(L.iso(new Date(st.lastBackup))) : 'nooit'}.</p>
    <div class="stack"><button class="btn" data-exp>Back-up maken</button><label class="btn ghost">Back-up terugzetten<input type="file" accept="application/json,.json" hidden data-imp></label>
    ${persisted ? '' : '<button class="btn ghost" data-persist>Vraag persistente opslag</button>'}
    <button class="btn danger" data-reset>Alles wissen</button></div>
    <p class="small muted center">Ritme · gemaakt voor 3 sport, 3 core, 3 mobility per week.</p></div>`);
  const close = sheet(c, { onClose: render });
  $('[name=pull]', c).onchange = (e) => store.update((s) => { s.settings.pullLevel = Number(e.target.value); });
  $('[data-rm]', c).onclick = (e) => { const v = Number(e.target.dataset.v); if (!v) return; store.update((s) => { s.settings.ritualMin = v; }); $('[data-rm]', c).querySelectorAll('button').forEach((b) => b.classList.toggle('on', Number(b.dataset.v) === v)); };
  $('[data-exp]', c).onclick = doExport;
  $('[data-imp]', c).onchange = async (e) => { try { await store.importAll(await e.target.files[0].text()); toast('Back-up teruggezet ✓'); close(); } catch (err) { alert(err.message); } };
  const p = $('[data-persist]', c); if (p) p.onclick = async () => { const ok = await store.persist(); toast(ok ? 'Opslag is nu persistent ✓' : 'Niet toegestaan — installeer eerst de app'); };
  $('[data-reset]', c).onclick = async () => { if (confirm('Echt alles wissen? Dit kan niet ongedaan worden gemaakt.') && confirm('Zeker weten? Maak eventueel eerst een back-up.')) { await store.reset(); close(); } };
}

// ───────── router / nav ─────────
const VIEWS = { vandaag: viewVandaag, trainen: viewTrainen, voortgang: viewVoortgang };
function render() {
  const y = window.scrollY;
  app.innerHTML = '';
  app.append(VIEWS[ui.tab]());
  document.querySelectorAll('.nav [data-tab]').forEach((b) => b.classList.toggle('on', b.dataset.tab === ui.tab));
  window.scrollTo(0, y);
}
function go() { const prev = app.dataset.tab; app.dataset.tab = ui.tab; render(); if (prev !== ui.tab) { window.scrollTo(0, 0); app.firstElementChild?.classList.add('enter'); } }
document.querySelectorAll('.nav [data-tab]').forEach((b) => (b.onclick = () => { ui.tab = b.dataset.tab; go(); }));
$('.nav [data-turf]').onclick = () => turfSheet();

// ───────── start ─────────
(async () => {
  await store.load();
  if (location.hash.slice(1) in VIEWS) ui.tab = location.hash.slice(1);
  go();
  if (window.matchMedia('(display-mode: standalone)').matches) store.persist();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js');
})();
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); window.__install = e; });
document.addEventListener('visibilitychange', () => { if (!document.hidden && !document.querySelector('.player')) render(); });
