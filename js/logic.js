import { get } from './store.js';
import { WORKOUTS, ROUTINES, FAMILY, TESTS } from './data.js';

export const GOALS = { sport: 3, core: 3, mob: 3 };
export const DAYS = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];
export const DAYS_LONG = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'];
export const MONTHS = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

// ── datums (lokale tijd) ──
export const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const today = () => iso(new Date());
export const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
export const dow = (s) => (parse(s).getDay() + 6) % 7; // 0 = maandag
export const monday = (s) => addDays(s, -dow(s));
export const weekKey = (s) => monday(s);
export const fmtDate = (s) => { const d = parse(s); return `${DAYS[dow(s)]} ${d.getDate()} ${MONTHS[d.getMonth()]}`; };
export const fmtTime = (sec) => { sec = Math.round(sec); const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60; return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`; };
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

// ── week-telling ──
export function weekStats(wk = weekKey(today())) {
  const end = addDays(wk, 6);
  const ss = get().sessions.filter((x) => x.date >= wk && x.date <= end);
  const c = { sport: 0, core: 0, mob: 0, minutes: 0, bdn: 0, sessions: ss };
  for (const x of ss) {
    if (x.counts?.sport) c.sport++;
    if (x.counts?.core) c.core++;
    if (x.counts?.mob) c.mob++;
    if (x.kind === 'bdn') c.bdn++;
    c.minutes += x.minutes || 0;
  }
  c.allMet = c.sport >= GOALS.sport && c.core >= GOALS.core && c.mob >= GOALS.mob;
  return c;
}
export const activeDays = (from, to) => new Set(get().sessions.filter((x) => x.date >= from && x.date <= to).map((x) => x.date)).size;

// ── dagritueel: wat loopt het meest achter, welke routine is het langst niet gedaan ──
export function lastDone(refId) {
  const s = get().sessions.filter((x) => x.refId === refId || (x.detail?.parts || []).includes(refId));
  return s.length ? s[s.length - 1].ts : 0;
}
export function pickRitual() {
  const w = weekStats();
  const coreLeft = GOALS.core - w.core, mobLeft = GOALS.mob - w.mob;
  const min = get().settings.ritualMin || 10;
  const doneToday = w.sessions.some((x) => x.date === today() && (x.counts?.core || x.counts?.mob));
  let seg;
  if (coreLeft <= 0 && mobLeft <= 0) seg = 'bonus';
  else if (coreLeft > 0 && mobLeft > 0 && min >= 10 && daysLeft() <= Math.max(coreLeft, mobLeft)) seg = 'combi';
  else seg = coreLeft >= mobLeft ? 'core' : 'mobility';
  const mobSeg = () => {
    const m = ROUTINES.filter((r) => r.seg === 'mobility').map((r) => lastDone(r.id));
    const p = ROUTINES.filter((r) => r.seg === 'posture').map((r) => lastDone(r.id));
    return Math.max(...p) <= Math.max(...m) ? 'posture' : 'mobility';
  };
  const oldest = (sg) => ROUTINES.filter((r) => r.seg === sg).sort((a, b) => lastDone(a.id) - lastDone(b.id))[0];
  if (seg === 'combi') return { combi: true, core: oldest('core'), mob: oldest(mobSeg()), min: 10, coreLeft, mobLeft, doneToday };
  if (seg === 'bonus') return { routine: oldest(mobSeg()), min, bonus: true, coreLeft, mobLeft, doneToday };
  const sg = seg === 'core' ? 'core' : mobSeg();
  return { routine: oldest(sg), min, coreLeft, mobLeft, doneToday };
}
export const daysLeft = () => 7 - dow(today()); // incl. vandaag

// ── plan / zondagritueel ──
export const planFor = (wk = weekKey(today())) => get().plans[wk];
export function nextPlanned() {
  const wk = weekKey(today()), p = planFor(wk);
  if (!p) return null;
  const t = today(), now = new Date(), hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const doneDates = new Set(weekStats(wk).sessions.filter((x) => x.counts?.sport).map((x) => x.date));
  const slots = p.slots.map((s) => ({ ...s, date: addDays(wk, s.day) })).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  return slots.find((s) => !doneDates.has(s.date) && (s.date > t || (s.date === t && s.time >= hhmm))) || slots.find((s) => s.date === t && !doneDates.has(s.date)) || null;
}

// ── weekredder ──
export function rescue() {
  const d = dow(today());
  if (d < 3) return null;
  const w = weekStats(), left = daysLeft();
  const need = { sport: Math.max(0, GOALS.sport - w.sport), core: Math.max(0, GOALS.core - w.core), mob: Math.max(0, GOALS.mob - w.mob) };
  if (!need.sport && !need.core && !need.mob) return null;
  const route = [];
  const p = planFor();
  const plannedLeft = p ? p.slots.filter((s) => s.day >= d).sort((a, b) => a.day - b.day) : [];
  let sp = need.sport, c = need.core, m = need.mob;
  for (let i = 0; i < left; i++) {
    const day = d + i, parts = [];
    const planned = plannedLeft.find((s) => s.day === day);
    if (sp > 0 && (planned || left - i <= sp)) { parts.push(planned ? planned.what.toLowerCase() : 'workout'); sp--; }
    if (c > 0 && m > 0) { parts.push('combi-ritueel'); c--; m--; }
    else if (c > 0) { parts.push('core-ritueel'); c--; }
    else if (m > 0) { parts.push('mobility-ritueel'); m--; }
    if (parts.length) route.push({ day, parts });
  }
  const feasible = sp <= 0 && c <= 0 && m <= 0;
  return { need, route, feasible, left };
}

// ── workouts & scores ──
export const allWorkouts = () => [...WORKOUTS, ...FAMILY.map((f) => ({ ...f, type: 'gezin' }))];
export const workoutById = (id) => allWorkouts().find((w) => w.id === id);
export const historyOf = (refId) => get().sessions.filter((x) => x.refId === refId && x.score);

// Vergelijkbare waarde: hoger = beter
export function scoreValue(type, sc) {
  if (!sc) return null;
  if (type === 'amrap') return sc.rounds + (sc.reps || 0) / 1000;
  if (type === 'fortime') return sc.capped ? -100000 + (sc.progress || 0) : -sc.sec;
  if (type === 'emom') return sc.minutes;
  if (type === 'interval' || type === 'tabata' || type === '4020') return sc.reps;
  return null;
}
export function scoreText(type, sc) {
  if (!sc) return '—';
  if (type === 'amrap') return `${sc.rounds} ${sc.rounds === 1 ? 'ronde' : 'rondes'}${sc.reps ? ` + ${sc.reps}` : ''}`;
  if (type === 'fortime') return sc.capped ? `cap (${sc.progress || 0} rondes)` : fmtTime(sc.sec);
  if (type === 'emom') return `${sc.minutes}/${sc.of} min`;
  if (['interval', 'tabata', '4020'].includes(type)) return `${sc.reps} reps`;
  if (type === 'kracht') return `${sc.sets?.length || 0} sets`;
  return '—';
}
export function best(refId, type) {
  let b = null;
  for (const x of historyOf(refId)) {
    const v = scoreValue(x.score.type || type, x.score);
    if (v !== null && (b === null || v > b.v)) b = { v, s: x };
  }
  return b;
}

// Kracht-PR per oefening: hoogste kg (HG20) of meeste reps (lichaamsgewicht)
export function liftBest(exId, before = Infinity) {
  let b = null;
  for (const x of get().sessions) {
    if (x.ts >= before || !x.score?.sets) continue;
    for (const st of x.score.sets) {
      if (st.ex !== exId) continue;
      const v = st.kg ? st.kg * 1000 + st.reps : st.reps;
      if (!b || v > b.v) b = { v, kg: st.kg, reps: st.reps, date: x.date };
    }
  }
  return b;
}
export function liftLast(exId) {
  const s = [...get().sessions].reverse().find((x) => x.score?.sets?.some((st) => st.ex === exId));
  return s ? s.score.sets.filter((st) => st.ex === exId) : null;
}

// ── pull-up-niveau → variant ──
export function pullVariant() {
  const p = get().peil.filter((x) => x.test === 'pullups');
  const n = p.length ? p[p.length - 1].value : (get().settings.pullLevel ?? 3);
  return n < 5 ? 'band-pullup' : 'pullup';
}
export const resolveEx = (id) => (id === 'pullup*' ? pullVariant() : id);

export const testById = (id) => TESTS.find((t) => t.id === id);
export function testSeries(id) { return get().peil.filter((x) => x.test === id).sort((a, b) => a.date.localeCompare(b.date)); }
export function testBest(id) {
  const t = testById(id), s = testSeries(id);
  if (!s.length) return null;
  return s.reduce((a, b) => ((t.better === 'lo' ? b.value < a.value : b.value > a.value) ? b : a));
}
export const fmtTest = (t, v) => (v == null ? '—' : t.unit === 'time' ? fmtTime(v) : t.unit === 'sec' ? `${v} s` : t.unit === 'cm' ? `${v} cm` : `${v}`);

