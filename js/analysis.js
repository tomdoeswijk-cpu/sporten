// Nabeschouwing na een workout en het maandrapport. Alles lokaal berekend uit je eigen data.
import * as store from './store.js';
import * as L from './logic.js';
import { EX } from './exercises.js';
import { WORKOUTS, SEGMENTS, ROUTINES } from './data.js';
import { icon } from './icons.js';

const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const pct = (a, b) => Math.round(((a - b) / b) * 100);
const splitsOf = (taps) => (taps || []).map((t, i) => t - (i ? taps[i - 1] : 0));
const mean = (a) => a.reduce((x, y) => x + y, 0) / (a.length || 1);

// ───────── NABESCHOUWING ─────────
function splitChart(mine, ghost) {
  const n = Math.max(mine.length, ghost?.length || 0);
  if (n < 2) return '';
  const max = Math.max(...mine, ...(ghost || []), 10);
  const W = 320, H = 130, pl = 30, pb = 18, pt = 8, slot = (W - pl) / n, bw = Math.min(18, slot * 0.36);
  const y = (v) => H - pb - (v / max) * (H - pb - pt);
  let s = `<svg viewBox="0 0 ${W} ${H}" class="bars splits" role="img" aria-label="Tijd per ronde">`;
  [0, Math.round(max / 2), Math.round(max)].forEach((v) => { s += `<line x1="${pl}" x2="${W}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${pl - 5}" y="${y(v) + 3}" class="ax" text-anchor="end">${L.fmtTime(v)}</text>`; });
  for (let i = 0; i < n; i++) {
    const cx = pl + i * slot + slot / 2;
    const g = ghost?.[i], m = mine[i];
    if (g != null) s += `<rect x="${cx - bw - 1}" y="${y(g)}" width="${bw}" height="${H - pb - y(g)}" rx="3" class="ghostbar" data-tip="<b>Ronde ${i + 1}</b><br>spook ${L.fmtTime(g)}"/>`;
    if (m != null) s += `<rect x="${g != null ? cx + 1 : cx - bw / 2}" y="${y(m)}" width="${bw}" height="${H - pb - y(m)}" rx="3" class="minebar ${g != null && m <= g ? 'faster' : ''}" data-tip="<b>Ronde ${i + 1}</b><br>jij ${L.fmtTime(m)}${g != null ? `<br>${m <= g ? `${L.fmtTime(g - m)} sneller` : `${L.fmtTime(m - g)} trager`}` : ''}"/>`;
    if (n <= 12 || i % 2 === 0) s += `<text x="${cx}" y="${H - 5}" class="ax" text-anchor="middle">${i + 1}</text>`;
  }
  return s + '</svg>';
}

function pacingNotes(sp) {
  const notes = [];
  if (sp.length < 3) return notes;
  const half = Math.floor(sp.length / 2);
  const a = mean(sp.slice(0, half)), b = mean(sp.slice(-half));
  const fastest = Math.min(...sp), slowest = Math.max(...sp);
  if (b > a * 1.15) notes.push(`Je zakte in: je laatste ${half} rondes waren gemiddeld ${pct(b, a)}% trager dan je eerste ${half}. Volgende keer iets rustiger starten levert waarschijnlijk meer rondes op.`);
  else if (b < a * 0.95) notes.push(`Negative split: je werd sneller naarmate de tijd vorderde (${Math.abs(pct(b, a))}% sneller in de tweede helft). Daar zit nog ruimte om harder te starten.`);
  else notes.push(slowest - fastest < 3 ? 'Metronoom: al je rondes waren vrijwel even snel.' : `Strak tempo: je snelste en traagste ronde liggen maar ${L.fmtTime(slowest - fastest)} uit elkaar.`);
  return notes;
}

export function analyzeWorkout(w, s, prev) {
  const type = s.score?.type;
  const out = { chart: '', notes: [] };
  const hist = L.historyOf(w.id).filter((x) => x.id !== s.id && x.ts < s.ts);
  if (type === 'amrap' || type === 'fortime') {
    const mine = splitsOf(s.score.taps), ghostTaps = prev?.s?.score?.taps, ghost = ghostTaps ? splitsOf(ghostTaps) : null;
    out.chart = splitChart(mine, ghost);
    out.notes.push(...pacingNotes(mine));
    if (ghost && mine.length) {
      let lead = null;
      for (let i = 0; i < Math.min(s.score.taps.length, ghostTaps.length); i++) if (s.score.taps[i] < ghostTaps[i]) { lead = i + 1; break; }
      const behind = mine.map((m, i) => (ghost[i] != null && m > ghost[i] ? i + 1 : null)).filter(Boolean);
      if (lead) notes(out, `Je kwam in ronde ${lead} voor op je spook${behind.length ? `; in ronde ${behind.slice(0, 3).join(', ')} was je spook sneller` : ' en gaf die plek niet meer weg'}.`);
      else if (behind.length) notes(out, `Je spook was vooral sneller in ronde ${behind.slice(0, 3).join(', ')}. Daar zit je winst voor volgende keer.`);
    }
    if (type === 'fortime' && s.score.capped) notes(out, `Tijdslimiet gehaald met ${s.score.progress || 0} van de ${w.main.rounds} rondes. Schaal volgende keer iets af (minder reps of een lichtere variant), dan krijg je een echte tijd om te verbeteren.`);
  }
  if (['amrap', 'fortime', 'emom', 'interval'].includes(type) && hist.length >= 2) {
    const vals = hist.map((x) => L.scoreValue(type, x.score)).filter((v) => v != null && v > -100000);
    const cur = L.scoreValue(type, s.score);
    if (vals.length >= 2 && cur > -100000) {
      const avg = mean(vals.slice(-3));
      const better = cur > avg;
      if (type === 'fortime') notes(out, `Vergeleken met het gemiddelde van je vorige ${Math.min(3, vals.length)} pogingen ben je ${L.fmtTime(Math.abs(-cur + avg))} ${better ? 'sneller' : 'langzamer'}.`);
      else if (Math.abs(cur - avg) > 0.001) notes(out, `${better ? 'Boven' : 'Onder'} het gemiddelde van je vorige ${Math.min(3, vals.length)} pogingen.`);
    }
  }
  if (type === 'kracht') out.notes.push(...liftNotes(w, s));
  out.notes = out.notes.slice(0, 3);
  return out;
}
const notes = (o, t) => o.notes.push(t);

function liftNotes(w, s) {
  const res = [];
  const byEx = {};
  s.score.sets.forEach((st) => (byEx[st.ex] ||= []).push(st));
  for (const [ex, sets] of Object.entries(byEx)) {
    const def = w.main.sets.find((d) => L.resolveEx(d.ex) === ex);
    const target = def?.reps || sets[0].reps;
    const name = EX[ex]?.name.replace(' (HG20)', '') || ex;
    const allHit = sets.every((x) => x.reps >= target);
    const kg = sets[0].kg;
    const sameKg = sets.every((x) => x.kg === kg);
    const prevS = [...store.get().sessions].reverse().find((x) => x.ts < s.ts && x.score?.sets?.some((y) => y.ex === ex));
    const prevSets = prevS?.score.sets.filter((y) => y.ex === ex) || [];
    if (kg != null) {
      const prevHit = prevSets.length && prevSets.every((x) => x.reps >= target && x.kg === kg);
      if (allHit && sameKg && prevHit) res.push(`${name}: twee keer op rij alle sets gehaald op ${kg} kg. Tijd voor ${kg + 5} kg.`);
      else if (allHit && sameKg) res.push(`${name}: alle sets gehaald op ${kg} kg. Lukt dat volgende keer weer, dan ga je naar ${kg + 5} kg.`);
      if (prevSets.length) {
        const vol = sets.reduce((a, x) => a + x.kg * x.reps, 0), pv = prevSets.reduce((a, x) => a + (x.kg || 0) * x.reps, 0);
        if (pv && Math.abs(pct(vol, pv)) >= 5) res.push(`${name}: totaal volume ${pct(vol, pv) > 0 ? '+' : ''}${pct(vol, pv)}% t.o.v. vorige keer (${vol} kg tegen ${pv} kg).`);
      }
    } else if (sets.every((x) => x.reps >= target + 3)) res.push(`${name}: ruim boven je doel. Kies een zwaardere variant of maak de zakfase 3 seconden.`);
    if (sets.length >= 3 && sets.at(-1).reps < sets[0].reps * 0.7) res.push(`${name}: van ${sets[0].reps} naar ${sets.at(-1).reps} reps. Neem iets meer rust tussen de sets of begin lichter.`);
  }
  return res;
}

// ───────── MAANDRAPPORT ─────────
const MONTHS_LONG = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
export const monthKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
export const prevMonthKey = (key) => { const [y, m] = key.split('-').map(Number); return monthKey(new Date(y, m - 2, 1)); };
export const nextMonthKey = (key) => { const [y, m] = key.split('-').map(Number); return monthKey(new Date(y, m, 1)); };
export const monthName = (key) => { const [y, m] = key.split('-').map(Number); return `${MONTHS_LONG[m - 1]} ${y}`; };

function monthData(key) {
  const st = store.get(), t = L.today();
  const ss = st.sessions.filter((x) => x.date.startsWith(key));
  const sum = (k) => ss.filter((x) => x.counts?.[k]).length;
  const weeks = [];
  const [y, m] = key.split('-').map(Number);
  const first = L.iso(new Date(y, m - 1, 1)), last = L.iso(new Date(y, m, 0));
  for (let wk = L.weekKey(first); wk <= last; wk = L.addDays(wk, 7)) if (L.addDays(wk, 3).startsWith(key) && L.addDays(wk, 6) < t) weeks.push(L.weekStats(wk));
  // wanneer sport je echt
  const dowCount = Array(7).fill(0);
  ss.filter((x) => x.counts?.sport).forEach((x) => dowCount[L.dow(x.date)]++);
  // beter dan niets
  const bdn = ss.filter((x) => x.kind === 'bdn');
  const saverDays = bdn.filter((b) => ss.filter((x) => x.date === b.date).length === 1).length;
  // rituelen
  const rit = {};
  ss.filter((x) => x.kind === 'routine').forEach((x) => { const r = ROUTINES.find((q) => q.id === x.refId); const n = r ? r.name : 'Combi'; rit[n] = (rit[n] || 0) + 1; });
  // PR's deze maand
  const prs = [];
  for (const w of WORKOUTS) {
    const hs = L.historyOf(w.id);
    let best = null;
    hs.forEach((x) => { const v = L.scoreValue(x.score.type, x.score); if (v == null) return; if (best !== null && v > best && x.date.startsWith(key)) prs.push({ name: w.name, txt: L.scoreText(x.score.type, x.score) }); if (best === null || v > best) best = v; });
  }
  return {
    key, ss, sport: sum('sport'), core: sum('core'), mob: sum('mob'),
    minutes: ss.reduce((a, b) => a + (b.minutes || 0), 0), active: new Set(ss.map((x) => x.date)).size,
    weeks, weeksMet: weeks.filter((w) => w.allMet).length, weeksSport: weeks.filter((w) => w.sport >= 3).length,
    dowCount, bdn, saverDays, rit, prs,
  };
}

function suggestion(d) {
  if (d.mob < d.core * 0.6 && d.core >= 4) return 'Core loopt goed, mobility blijft achter. Zet je dagritueel een paar keer bewust op Mobility of kies vaker Combi.';
  if (d.core < d.mob * 0.6 && d.mob >= 4) return 'Mobility loopt goed, core blijft achter. Kies vaker Combi: dan haal je ze allebei in 10 minuten.';
  if (d.weeks.length && d.weeksSport / d.weeks.length < 0.5) return 'Minder dan de helft van je weken haalde 3× sport. Kies een vaste dag die nu steeds sneuvelt en maak er een vaste "Beter dan niets, 3 rondes" van: die telt ook.';
  if (d.weeks.length && d.weeksMet === d.weeks.length) return 'Elke week alle doelen. Houd vast wat werkt en verander niets aan je aanpak.';
  return 'Houd het ritme vast. Kijk bij "Wanneer je echt sport" op welke dagen het lukt, en bouw daar je vaste momenten omheen.';
}

const delta = (a, b) => (b == null ? '' : a === b ? '<small class="eq">=</small>' : `<small class="${a > b ? 'up' : 'down'}">${a > b ? '▲' : '▼'} ${Math.abs(a - b)}</small>`);

export function monthReport(key, { onNav } = {}) {
  const d = monthData(key), p = monthData(prevMonthKey(key));
  const hasPrev = p.ss.length > 0;
  const curKey = monthKey();
  const box = h('<div class="report"></div>');
  const nav = h(`<div class="rep-nav"><button data-p aria-label="Vorige maand">‹</button><div><small>Maandrapport</small><h2>${monthName(key)}</h2>${key === curKey ? '<span class="pill">loopt nog</span>' : ''}</div><button data-n aria-label="Volgende maand" ${key >= curKey ? 'disabled' : ''}>›</button></div>`);
  nav.querySelector('[data-p]').onclick = () => onNav?.(prevMonthKey(key));
  nav.querySelector('[data-n]').onclick = () => key < curKey && onNav?.(nextMonthKey(key));
  box.append(nav);
  if (!d.ss.length) { box.append(h(`<div class="card empty"><h3>Nog geen data voor ${monthName(key)}</h3><p class="muted">Het rapport vult zich vanzelf zodra je gaat turven en trainen.</p></div>`)); return box; }

  box.append(h(`<section class="card rep-sum"><div class="rep-grid">
    <div class="sport"><b>${d.sport}${delta(d.sport, hasPrev ? p.sport : null)}</b><span>sportmomenten</span></div>
    <div class="core"><b>${d.core}${delta(d.core, hasPrev ? p.core : null)}</b><span>core</span></div>
    <div class="mob"><b>${d.mob}${delta(d.mob, hasPrev ? p.mob : null)}</b><span>mobility</span></div>
    <div><b>${d.active}</b><span>actieve dagen</span></div><div><b>${d.minutes}</b><span>minuten</span></div>
    <div><b>${d.weeks.length ? `${d.weeksMet}/${d.weeks.length}` : '—'}</b><span>weken alle doelen</span></div></div>
    ${hasPrev ? `<p class="small muted">Pijltjes: verschil met ${monthName(prevMonthKey(key)).split(' ')[0]}.</p>` : ''}</section>`));

  box.append(h(`<section class="card rep-tip">${icon('spark')}<div><div class="eyebrow">Eén ding voor volgende maand</div><p>${suggestion(d)}</p></div></section>`));


  const mx = Math.max(1, ...d.dowCount);
  box.append(h(`<section class="card"><div class="card-h"><h3>Wanneer je echt sport</h3><small>per weekdag</small></div>
    <div class="dowbars">${d.dowCount.map((n, i) => `<div data-tip="<b>${L.DAYS_LONG[i]}</b><br>${n} sportmomenten"><i style="height:${Math.round((n / mx) * 100)}%"></i><b>${n || ''}</b><span>${L.DAYS[i]}</span></div>`).join('')}</div></section>`));

  const bd = d.bdn.length;
  const ritTop = Object.entries(d.rit).sort((a, b) => b[1] - a[1]).slice(0, 3);
  box.append(h(`<section class="card"><div class="card-h"><h3>Vangnetten & rituelen</h3></div>
    <div class="rep-line">${icon('bolt')}<span>${bd ? `Beter dan niets ${bd}× gebruikt${d.saverDays ? `; ${d.saverDays}× was het je enige activiteit die dag, dus een dag gered` : ''}.` : 'Beter dan niets niet nodig gehad.'}</span></div>
    <div class="rep-line">${icon('core')}<span>${ritTop.length ? `Meest gedaan: ${ritTop.map(([n, c]) => `${n} (${c}×)`).join(', ')}.` : 'Nog geen rituelen deze maand.'}</span></div>
    <div class="rep-line">${icon('trophy')}<span>${d.prs.length ? `PR's: ${d.prs.map((x) => `${x.name} ${x.txt}`).join(' · ')}` : 'Geen nieuwe PR\'s deze maand.'}</span></div></section>`));
  return box;
}

export function reportReady() {
  const st = store.get(), prev = prevMonthKey(monthKey());
  const day = new Date().getDate();
  return day <= 7 && st.settings.reportSeen !== prev && st.sessions.some((x) => x.date.startsWith(prev)) ? prev : null;
}
