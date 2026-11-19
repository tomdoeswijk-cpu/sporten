// Voortgang: weken, heatmap, sporten per maand, PR's en peiltrends (inline SVG, met tooltips).
import * as store from './store.js';
import * as L from './logic.js';
import { EX } from './exercises.js';
import { SPORTS, TESTS } from './data.js';

const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const SPORT_COLOR = { run: 'var(--s1)', bike: 'var(--s2)', squash: 'var(--s3)', hyrox: 'var(--s4)', workout: 'var(--s5)', other: 'var(--s6)' };

// ── tooltip (hover én tik) ──
let tipEl = null;
function showTip(target, x, y) {
  if (!tipEl) { tipEl = h('<div class="viz-tip" role="tooltip"></div>'); document.body.append(tipEl); }
  tipEl.innerHTML = target.dataset.tip;
  tipEl.style.display = 'block';
  const r = tipEl.getBoundingClientRect();
  tipEl.style.left = `${Math.min(window.innerWidth - r.width - 8, Math.max(8, x - r.width / 2))}px`;
  tipEl.style.top = `${Math.max(8, y - r.height - 14)}px`;
}
const hideTip = () => { if (tipEl) tipEl.style.display = 'none'; };
document.addEventListener('pointerover', (e) => { const t = e.target.closest?.('[data-tip]'); if (t && e.pointerType === 'mouse') showTip(t, e.clientX, e.clientY); });
document.addEventListener('pointermove', (e) => { const t = e.target.closest?.('[data-tip]'); if (t && e.pointerType === 'mouse') showTip(t, e.clientX, e.clientY); else if (e.pointerType === 'mouse') hideTip(); });
document.addEventListener('pointerdown', (e) => { const t = e.target.closest?.('[data-tip]'); if (t) showTip(t, e.clientX, e.clientY); else hideTip(); });
window.addEventListener('scroll', hideTip, { passive: true });

const tile = (v, l, sub = '') => `<div class="tile"><b>${v}</b><span>${l}</span>${sub ? `<small>${sub}</small>` : ''}</div>`;

// ───────── WEKEN ─────────
export function weeksView() {
  const box = h('<div></div>');
  const t = L.today(), wk = L.weekKey(t);
  const weeks = Array.from({ length: 12 }, (_, i) => L.addDays(wk, -7 * i));
  const stats = weeks.map((w) => ({ w, ...L.weekStats(w) }));
  const past = stats.slice(1);
  const met = past.filter((s) => s.allMet).length;
  const sportMet = past.filter((s) => s.sport >= 3).length;
  const month = t.slice(0, 7);
  const minMonth = store.get().sessions.filter((x) => x.date.startsWith(month)).reduce((a, b) => a + (b.minutes || 0), 0);
  box.append(h(`<div class="tiles">${tile(`${met}/11`, 'weken alle doelen', 'afgelopen 11 weken')}${tile(`${sportMet}/11`, 'weken 3× sport')}${tile(L.activeDays(L.addDays(t, -27), t), 'actieve dagen', 'laatste 28 dagen')}${tile(minMonth, 'minuten', 'deze maand')}</div>`));

  const card = h(`<section class="card"><div class="card-h"><h3>Doelen per week</h3><small>3 · 3 · 3</small></div>
    <div class="legend"><span><i class="sw sport"></i>Sport</span><span><i class="sw core"></i>Core</span><span><i class="sw mob"></i>Mob/posture</span></div><div class="wgrid"></div></section>`);
  const grid = card.querySelector('.wgrid');
  for (const s of stats) {
    const d = L.parse(s.w);
    const pips = (n, cls, label) => {
      let o = `<div class="pips" data-tip="<b>${label}</b> ${n}/3 · week van ${L.fmtDate(s.w)}">`;
      for (let i = 0; i < 3; i++) o += `<i class="${i < n ? `on ${cls}` : ''}"></i>`;
      return o + (n > 3 ? `<em>+${n - 3}</em>` : '') + '</div>';
    };
    grid.append(h(`<div class="wrow ${s.w === wk ? 'cur' : ''}"><span class="wl">${s.w === wk ? 'Nu' : `${d.getDate()} ${L.MONTHS[d.getMonth()]}`}</span>${pips(s.sport, 'sport', 'Sport')}${pips(s.core, 'core', 'Core')}${pips(s.mob, 'mob', 'Mobility')}<span class="wok">${s.allMet ? '✓' : ''}</span></div>`));
  }
  box.append(card);
  box.append(heatmap());
  return box;
}

function heatmap() {
  const t = L.today(), start = L.addDays(L.weekKey(t), -7 * 15);
  const byDate = {};
  for (const x of store.get().sessions) { (byDate[x.date] ||= { min: 0, list: [], bdn: false }); byDate[x.date].min += x.minutes || 0; byDate[x.date].list.push(x.title); if (x.kind === 'bdn') byDate[x.date].bdn = true; }
  const lvl = (m) => (m <= 0 ? 0 : m < 20 ? 1 : m < 45 ? 2 : m < 75 ? 3 : 4);
  const cs = 15, gap = 3, W = 16 * (cs + gap) + 22, H = 7 * (cs + gap) + 16;
  let svg = `<svg viewBox="0 0 ${W} ${H}" class="heat" role="img" aria-label="Kalender van actieve dagen, laatste 16 weken">`;
  ['ma', '', 'wo', '', 'vr', '', 'zo'].forEach((l, i) => { if (l) svg += `<text x="0" y="${i * (cs + gap) + cs - 3}" class="ax">${l}</text>`; });
  for (let wi = 0; wi < 16; wi++) {
    const wkS = L.addDays(start, wi * 7), dd = L.parse(wkS);
    if (dd.getDate() <= 7) svg += `<text x="${22 + wi * (cs + gap)}" y="${H - 2}" class="ax">${L.MONTHS[dd.getMonth()]}</text>`;
    for (let di = 0; di < 7; di++) {
      const date = L.addDays(wkS, di);
      if (date > t) continue;
      const b = byDate[date], m = b?.min || 0;
      const tip = `<b>${L.fmtDate(date)}</b>${b ? `<br>${b.list.map(esc).join('<br>')}<br>${m} min` : '<br>rustdag'}`;
      svg += `<rect x="${22 + wi * (cs + gap)}" y="${di * (cs + gap)}" width="${cs}" height="${cs}" rx="4" class="h${lvl(m)}" data-tip="${esc(tip)}"/>`;
      if (b?.bdn && m < 20) svg += `<circle cx="${22 + wi * (cs + gap) + cs / 2}" cy="${di * (cs + gap) + cs / 2}" r="2.5" class="bdn-dot" pointer-events="none"/>`;
    }
  }
  svg += '</svg>';
  return h(`<section class="card"><div class="card-h"><h3>Actieve dagen</h3><small>16 weken</small></div>${svg}
    <div class="legend heat-l"><span>minder</span><i class="h1"></i><i class="h2"></i><i class="h3"></i><i class="h4"></i><span>meer</span><span class="sep"><i class="bdn-sw"></i> Beter dan niets</span></div></section>`);
}

// ───────── SPORTEN ─────────
export function sportsView() {
  const box = h('<div></div>');
  const ss = store.get().sessions.filter((x) => x.counts?.sport || x.kind === 'bdn');
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => { const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1); return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: L.MONTHS[d.getMonth()] }; });
  const ids = SPORTS.map((s) => s.id);
  const data = months.map((m) => { const o = { ...m, tot: 0 }; ids.forEach((id) => (o[id] = 0)); ss.filter((x) => x.date.startsWith(m.key)).forEach((x) => { const id = ids.includes(x.sport) ? x.sport : 'other'; o[id] += x.minutes || 0; o.tot += x.minutes || 0; }); return o; });
  const max = Math.max(60, ...data.map((d) => d.tot));
  const W = 320, H = 180, padL = 30, padB = 22, bw = 30, step = (W - padL) / 6;
  const y = (v) => H - padB - (v / max) * (H - padB - 18);
  let svg = `<svg viewBox="0 0 ${W} ${H}" class="bars" role="img" aria-label="Sportminuten per maand per sport">`;
  const ticks = [0, Math.round(max / 2 / 10) * 10, Math.round(max / 10) * 10];
  ticks.forEach((tv) => { svg += `<line x1="${padL}" x2="${W}" y1="${y(tv)}" y2="${y(tv)}" class="grid"/><text x="${padL - 6}" y="${y(tv) + 4}" class="ax" text-anchor="end">${tv}</text>`; });
  data.forEach((d, i) => {
    const x = padL + i * step + (step - bw) / 2;
    let acc = 0;
    const segs = ids.filter((id) => d[id] > 0);
    segs.forEach((id, si) => {
      const v = d[id], y0 = y(acc), y1 = y(acc + v);
      const top = si === segs.length - 1;
      const hgt = Math.max(1, y0 - y1 - (top ? 0 : 2));
      const sp = SPORTS.find((s) => s.id === id);
      svg += top
        ? `<path d="M${x},${y0} V${y1 + 4} q0,-4 4,-4 H${x + bw - 4} q4,0 4,4 V${y0} Z" style="fill:${SPORT_COLOR[id]}" data-tip="<b>${sp.label}</b> · ${d.label}<br>${v} min"/>`
        : `<rect x="${x}" y="${y0 - hgt}" width="${bw}" height="${hgt}" style="fill:${SPORT_COLOR[id]}" data-tip="<b>${sp.label}</b> · ${d.label}<br>${v} min"/>`;
      acc += v;
    });
    if (d.tot) svg += `<text x="${x + bw / 2}" y="${y(d.tot) - 5}" class="val" text-anchor="middle">${d.tot}</text>`;
    svg += `<text x="${x + bw / 2}" y="${H - 6}" class="ax" text-anchor="middle">${d.label}</text>`;
  });
  svg += '</svg>';
  const used = ids.filter((id) => data.some((d) => d[id] > 0));
  box.append(h(`<section class="card"><div class="card-h"><h3>Minuten per maand</h3><small>sportmomenten</small></div>
    <div class="legend">${used.map((id) => `<span><i class="sw" style="background:${SPORT_COLOR[id]}"></i>${SPORTS.find((s) => s.id === id).label}</span>`).join('')}</div>${svg}</section>`));

  const rows = ids.map((id) => {
    const xs = ss.filter((x) => (ids.includes(x.sport) ? x.sport : 'other') === id);
    return { id, n: xs.length, min: xs.reduce((a, b) => a + (b.minutes || 0), 0), km: xs.reduce((a, b) => a + (b.km || 0), 0) };
  }).filter((r) => r.n);
  const hyg = store.get().sessions.filter((x) => x.kind === 'routine');
  box.append(h(`<section class="card"><div class="card-h"><h3>Totaal</h3><small>sinds start</small></div>
    <table class="tbl"><thead><tr><th>Sport</th><th>×</th><th>min</th><th>km</th></tr></thead><tbody>
    ${rows.map((r) => `<tr><td><i class="sw" style="background:${SPORT_COLOR[r.id]}"></i>${SPORTS.find((s) => s.id === r.id).label}</td><td>${r.n}</td><td>${r.min}</td><td>${r.km ? r.km.toFixed(1) : ''}</td></tr>`).join('')}
    <tr class="sub"><td>Rituelen (core/mob/posture)</td><td>${hyg.length}</td><td>${hyg.reduce((a, b) => a + (b.minutes || 0), 0)}</td><td></td></tr></tbody></table></section>`));
  return box;
}

// ───────── PR's ─────────
function spark(vals, invert = false) {
  if (vals.length < 2) return '';
  const W = 90, H = 28, mn = Math.min(...vals), mx = Math.max(...vals), r = mx - mn || 1;
  const pts = vals.map((v, i) => [4 + (i / (vals.length - 1)) * (W - 8), invert ? 4 + ((v - mn) / r) * (H - 8) : H - 4 - ((v - mn) / r) * (H - 8)]);
  const last = pts.at(-1);
  return `<svg viewBox="0 0 ${W} ${H}" class="spark" aria-hidden="true"><polyline points="${pts.map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' ')}"/><circle cx="${last[0]}" cy="${last[1]}" r="3"/></svg>`;
}
export function prView() {
  const box = h('<div></div>');
  const ss = store.get().sessions.filter((x) => x.score && x.kind === 'workout');
  const byRef = {};
  ss.forEach((x) => (byRef[x.refId] ||= []).push(x));
  const wl = Object.entries(byRef).filter(([, xs]) => xs[0].score.type && xs[0].score.type !== 'kracht');
  const c = h(`<section class="card"><div class="card-h"><h3>Workouts</h3><small>beste · laatste · trend</small></div></section>`);
  if (!wl.length) c.append(h('<p class="muted">Nog geen gescoorde workouts. AMRAP, For Time en Interval houden je score bij.</p>'));
  wl.forEach(([ref, xs]) => {
    const w = L.workoutById(ref); if (!w) return;
    const type = xs[0].score.type;
    const b = L.best(ref, type);
    const vals = xs.map((x) => (type === 'fortime' ? (x.score.capped ? null : x.score.sec) : L.scoreValue(type, x.score))).filter((v) => v != null);
    const last = xs.at(-1);
    const isPR = b && b.s.id === last.id && xs.length > 1;
    c.append(h(`<div class="prrow tap" data-ref="${ref}"><div><b>${esc(w.name)}</b><small>${xs.length}× · ${L.fmtDate(last.date)}</small></div>${spark(vals, type === 'fortime')}<div class="prv"><b>${L.scoreText(type, b.s.score)}</b><small>${isPR ? '🏆 laatste = PR' : `laatst ${L.scoreText(type, last.score)}`}</small></div></div>`));
  });
  box.append(c);

  const lifts = {};
  ss.forEach((x) => (x.score.sets || []).forEach((st) => (lifts[st.ex] ||= []).push({ ...st, date: x.date, ts: x.ts })));
  const lc = h(`<section class="card"><div class="card-h"><h3>Kracht</h3><small>beste set</small></div></section>`);
  if (!Object.keys(lifts).length) lc.append(h('<p class="muted">Doe een krachtworkout om je sets en PR\'s te zien.</p>'));
  Object.entries(lifts).forEach(([ex, sets]) => {
    const b = L.liftBest(ex);
    const perSession = Object.values(sets.reduce((a, s) => { const v = s.kg ? s.kg : s.reps; a[s.ts] = Math.max(a[s.ts] || 0, v); return a; }, {}));
    lc.append(h(`<div class="prrow"><div><b>${EX[ex]?.name || ex}</b><small>${perSession.length}× getraind</small></div>${spark(perSession)}<div class="prv"><b>${b.kg ? `${b.kg} kg × ${b.reps}` : `${b.reps} reps`}</b><small>${L.fmtDate(b.date)}</small></div></div>`));
  });
  box.append(lc);
  return box;
}

// ───────── PEIL ─────────
function lineChart(t, series) {
  const W = 320, H = 130, pl = 40, pb = 20, pt = 12;
  const vals = series.map((s) => s.value);
  let mn = Math.min(...vals), mx = Math.max(...vals);
  if (mn === mx) { mn -= 1; mx += 1; }
  const pad = (mx - mn) * 0.15; mn -= pad; mx += pad;
  const t0 = L.parse(series[0].date).getTime(), t1 = L.parse(series.at(-1).date).getTime() || t0 + 1;
  const x = (d) => pl + (series.length === 1 ? (W - pl) / 2 : ((L.parse(d).getTime() - t0) / (t1 - t0 || 1)) * (W - pl - 10));
  const lo = t.better === 'lo';
  const y = (v) => (lo ? pt + ((v - mn) / (mx - mn)) * (H - pb - pt) : H - pb - ((v - mn) / (mx - mn)) * (H - pb - pt));
  let svg = `<svg viewBox="0 0 ${W} ${H}" class="line" role="img" aria-label="${esc(t.name)} over tijd">`;
  (series.length === 1 ? [vals[0]] : [mn + pad, (mn + mx) / 2, mx - pad]).forEach((v) => { svg += `<line x1="${pl}" x2="${W}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${pl - 6}" y="${y(v) + 4}" class="ax" text-anchor="end">${L.fmtTest(t, Math.round(v)).replace(' s', 's').replace(' cm', '')}</text>`; });
  svg += `<polyline points="${series.map((s) => `${x(s.date).toFixed(1)},${y(s.value).toFixed(1)}`).join(' ')}" class="ln"/>`;
  series.forEach((s) => { svg += `<circle cx="${x(s.date)}" cy="${y(s.value)}" r="4.5" class="pt"/><circle cx="${x(s.date)}" cy="${y(s.value)}" r="14" class="hit" data-tip="<b>${L.fmtDate(s.date)}</b><br>${L.fmtTest(t, s.value)}"/>`; });
  svg += `<text x="${pl}" y="${H - 4}" class="ax">${L.fmtDate(series[0].date)}</text>`;
  if (series.length > 1) svg += `<text x="${W - 4}" y="${H - 4}" class="ax" text-anchor="end">${L.fmtDate(series.at(-1).date)}</text>`;
  return svg + '</svg>';
}
export function peilView() {
  const box = h('<div></div>');
  const groups = [...new Set(TESTS.map((t) => t.group))];
  let any = false;
  for (const g of groups) {
    const ts = TESTS.filter((t) => t.group === g && L.testSeries(t.id).length);
    if (!ts.length) continue;
    any = true;
    box.append(h(`<div class="label pad">${g}</div>`));
    ts.forEach((t) => {
      const s = L.testSeries(t.id), b = L.testBest(t.id), first = s[0], last = s.at(-1);
      const diff = last.value - first.value;
      const better = t.better === 'lo' ? diff < 0 : diff > 0;
      const dtxt = s.length > 1 && diff !== 0 ? `<span class="${better ? 'up' : 'down'}">${better ? '▲' : '▼'} ${t.unit === 'time' ? L.fmtTime(Math.abs(diff)) : Math.abs(diff)} t.o.v. eerste</span>` : '';
      box.append(h(`<section class="card"><div class="card-h"><h3>${t.name}</h3><small>PR ${L.fmtTest(t, b.value)}</small></div><div class="peil-now"><b>${L.fmtTest(t, last.value)}</b>${dtxt}</div>${lineChart(t, s)}</section>`));
    });
  }
  if (!any) box.append(h(`<div class="card empty"><h3>Nog geen peilmomenten</h3><p class="muted">Doe de peilsessie via Trainen › Peil. Dit is je nulmeting: elke 6 weken zie je hier je lijn.</p></div>`));
  const ph = h(`<section class="card"><div class="card-h"><h3>Houding</h3><small>zijaanzicht</small></div><div class="photos"><p class="muted">Nog geen foto's. De peilsessie eindigt met een houdingsfoto.</p></div></section>`);
  box.append(ph);
  store.allPhotoIds().then(async (ids) => {
    ids = ids.filter((i) => i.startsWith('posture-')).sort();
    if (!ids.length) return;
    const wrap = ph.querySelector('.photos'); wrap.innerHTML = '';
    const show = ids.length > 1 ? [ids[0], ids.at(-1)] : ids;
    for (const id of show) {
      const blob = await store.getPhoto(id);
      wrap.append(h(`<figure><img src="${URL.createObjectURL(blob)}" alt="Houdingsfoto ${id.slice(8)}"><figcaption>${L.fmtDate(id.slice(8))}${id === ids[0] && ids.length > 1 ? ' · eerste' : ids.length > 1 ? ' · laatste' : ''}</figcaption></figure>`));
    }
    if (ids.length > 2) wrap.append(h(`<p class="small muted">${ids.length} foto's in totaal.</p>`));
  });
  return box;
}
