// Workouts, routines, gezinsworkouts, "Beter dan niets" en peiltests.
// Stap: { ex, reps | sec | cal | m, note }. 'pullup*' wordt gekozen op basis van je pull-up-niveau.

export const TYPES = {
  amrap: { label: 'AMRAP', uitleg: 'Zoveel mogelijk rondes binnen de tijd.', durs: [10, 20, 30] },
  fortime: { label: 'For Time', uitleg: 'Vaste hoeveelheid werk, zo snel mogelijk (met tijdslimiet).', durs: [10, 20, 30] },
  interval: { label: 'Interval', uitleg: 'EMOM, Tabata of 40/20: de timer bepaalt het ritme.', durs: [10, 20, 30] },
  kracht: { label: 'Kracht', uitleg: 'Sets × herhalingen met rust, gewicht of reps loggen.', durs: [20, 30, 45] },
};

// Verdeling warming-up / hoofdblok / cooldown (seconden) per duur
export const SPLIT = { 10: [120, 420, 60], 20: [240, 840, 120], 30: [300, 1320, 180], 45: [360, 2100, 240] };

const s = (ex, reps, extra = {}) => ({ ex, reps, ...extra });
const cal = (ex, n) => ({ ex, cal: n });
const m = (ex, n) => ({ ex, m: n });

export const WORKOUTS = [
  // ── AMRAP ──
  { id: 'a10-1', type: 'amrap', dur: 10, name: 'Kudelstaart Kick', main: { steps: [s('pushup', 5), s('air-squat', 10), s('single-under', 30)] } },
  { id: 'a10-2', type: 'amrap', dur: 10, name: 'Trek & Duw', main: { steps: [s('pullup*', 3), s('pushup', 6), s('reverse-lunge', 10, { note: 'totaal' })] } },
  { id: 'a10-3', type: 'amrap', dur: 10, name: 'Ground Zero', main: { steps: [s('burpee', 5), s('mountain-climber', 20, { note: 'totaal' }), s('jump-squat', 8)] } },
  { id: 'a20-1', type: 'amrap', dur: 20, name: 'Bodyweight Basis', main: { steps: [s('pullup*', 5), s('pushup', 10), s('air-squat', 15)] } },
  { id: 'a20-2', type: 'amrap', dur: 20, name: 'Roei & Splits', main: { steps: [m('row', 250), s('bulgarian', 10, { note: '5 per been' }), s('pike-pushup', 6)] } },
  { id: 'a20-3', type: 'amrap', dur: 20, name: 'Squash Engine', main: { steps: [s('skater', 12), s('trx-row', 10), s('burpee-broad-jump', 5), s('hollow-rock', 12)] } },
  { id: 'a30-1', type: 'amrap', dur: 30, name: 'Lange Adem', main: { steps: [m('row', 400), s('pushup', 12), s('reverse-lunge', 20, { note: 'totaal' }), s('trx-knee-tuck', 10)] } },
  { id: 'a30-2', type: 'amrap', dur: 30, name: 'Bar & Bike', main: { steps: [cal('bike', 12), s('pullup*', 5), s('jump-squat', 10), s('hanging-knee-raise', 8)] } },
  { id: 'a30-3', type: 'amrap', dur: 30, name: 'Touwladder', main: { steps: [s('single-under', 50), s('pike-pushup', 8), s('trx-ham-curl', 10), s('trx-row', 10)] } },

  // ── FOR TIME ──
  { id: 'f10-1', type: 'fortime', dur: 10, name: '21-15-9', main: { rounds: 3, steps: [s('air-squat', [21, 15, 9]), s('pushup', [21, 15, 9])] } },
  { id: 'f10-2', type: 'fortime', dur: 10, name: 'Double Trouble', main: { rounds: 3, steps: [s('double-under', 30, { note: 'of 90 singles' }), s('jump-squat', 10), s('burpee', 5)] } },
  { id: 'f10-3', type: 'fortime', dur: 10, name: 'Sprint Row', main: { rounds: 1, steps: [m('row', 500), s('pushup', 20), s('air-squat', 30)] } },
  { id: 'f20-1', type: 'fortime', dur: 20, name: 'De Chipper', main: { rounds: 1, steps: [s('air-squat', 40), s('pushup', 30, { note: 'incline mag' }), s('trx-row', 25), s('burpee', 15), s('mountain-climber', 40, { note: 'totaal' }), s('pullup*', 10)] } },
  { id: 'f20-2', type: 'fortime', dur: 20, name: 'Vijf Rondes', main: { rounds: 5, steps: [m('row', 200), s('bulgarian', 10, { note: '5 per been' }), s('pike-pushup', 5)] } },
  { id: 'f20-3', type: 'fortime', dur: 20, name: 'Fietsladder', main: { rounds: 4, steps: [cal('bike', 15), s('trx-row', 12), s('jump-squat', 9)] } },
  { id: 'f30-1', type: 'fortime', dur: 30, name: 'Hyrox Thuis', main: { rounds: 4, steps: [m('row', 500), s('reverse-lunge', 20, { note: 'totaal' }), s('burpee-broad-jump', 8), s('trx-row', 15)] } },
  { id: 'f30-2', type: 'fortime', dur: 30, name: 'Aftellen', main: { rounds: 10, steps: [s('burpee', [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]), s('trx-row', [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]), s('air-squat', [20, 18, 16, 14, 12, 10, 8, 6, 4, 2])] } },
  { id: 'f30-3', type: 'fortime', dur: 30, name: 'Motorblok', main: { rounds: 3, steps: [cal('bike', 20), s('single-under', 60), s('pushup', 15), s('skater', 20), s('hollow-rock', 15)] } },

  // ── INTERVAL ──
  { id: 'i10-1', type: 'interval', dur: 10, name: 'EMOM Zeven', main: { kind: 'emom', minutes: 7, steps: [s('burpee', 6), s('air-squat', 15)] } },
  { id: 'i10-2', type: 'interval', dur: 10, name: 'Tabata Klimmer', main: { kind: 'tabata', blocks: [['mountain-climber', 'jump-squat']] } },
  { id: 'i10-3', type: 'interval', dur: 10, name: 'Snelle Zeven', main: { kind: '4020', rounds: 7, steps: [s('burpee'), s('skater'), s('hollow-rock'), s('jump-squat'), s('mountain-climber'), s('pushup'), s('single-under')] } },
  { id: 'i20-1', type: 'interval', dur: 20, name: 'EMOM Trio', main: { kind: 'emom', minutes: 14, steps: [s('pullup*', 4), s('pushup', 10), s('air-squat', 15)] } },
  { id: 'i20-2', type: 'interval', dur: 20, name: 'Tabata Drieluik', main: { kind: 'tabata', blocks: [['burpee'], ['trx-row'], ['jump-squat']] } },
  { id: 'i20-3', type: 'interval', dur: 20, name: '40/20 Rondgang', main: { kind: '4020', rounds: 14, steps: [s('bike', null, { note: 'cal' }), s('pushup'), s('reverse-lunge'), s('trx-knee-tuck'), s('skater'), s('bear-crawl'), s('row', null, { note: 'cal' })] } },
  { id: 'i30-1', type: 'interval', dur: 30, name: 'EMOM Twintig+', main: { kind: 'emom', minutes: 21, steps: [cal('row', 12), s('bulgarian', 8, { note: '4 per been' }), s('trx-row', 10)] } },
  { id: 'i30-2', type: 'interval', dur: 30, name: 'Tabata Vierluik', main: { kind: 'tabata', blocks: [['mountain-climber'], ['pike-pushup'], ['jump-squat'], ['hollow-rock']] } },
  { id: 'i30-3', type: 'interval', dur: 30, name: '40/20 Twintig', main: { kind: '4020', rounds: 20, steps: [s('double-under'), s('pushup'), s('skater'), s('trx-ham-curl'), s('burpee')] } },

  // ── KRACHT ──
  { id: 'k20-1', type: 'kracht', dur: 20, name: 'Push-Pull Basis', main: { sets: [{ ex: 'chest-press', sets: 3, reps: 10, rest: 60 }, { ex: 'lat-pulldown', sets: 3, reps: 10, rest: 60 }, { ex: 'hollow-rock', sets: 2, reps: 15, rest: 30 }] } },
  { id: 'k20-2', type: 'kracht', dur: 20, name: 'Benen & Heup', main: { sets: [{ ex: 'bulgarian', sets: 3, reps: 8, rest: 60, note: 'per been' }, { ex: 'pull-through', sets: 3, reps: 12, rest: 60 }, { ex: 'trx-ham-curl', sets: 2, reps: 10, rest: 45 }] } },
  { id: 'k20-3', type: 'kracht', dur: 20, name: 'Bovenlijf Bodyweight', main: { sets: [{ ex: 'pullup*', sets: 4, reps: 5, rest: 90, note: '1 herhaling voor falen stoppen' }, { ex: 'pike-pushup', sets: 3, reps: 8, rest: 60 }, { ex: 'trx-row', sets: 2, reps: 12, rest: 45 }] } },
  { id: 'k30-1', type: 'kracht', dur: 30, name: 'Full Body A', main: { sets: [{ ex: 'bulgarian', sets: 3, reps: 8, rest: 60, note: 'per been' }, { ex: 'chest-press', sets: 3, reps: 10, rest: 60 }, { ex: 'seated-row', sets: 3, reps: 10, rest: 60 }, { ex: 'pull-through', sets: 2, reps: 12, rest: 45 }] } },
  { id: 'k30-2', type: 'kracht', dur: 30, name: 'Full Body B', main: { sets: [{ ex: 'pullup*', sets: 4, reps: 5, rest: 90 }, { ex: 'shoulder-press', sets: 3, reps: 8, rest: 60 }, { ex: 'trx-ham-curl', sets: 3, reps: 10, rest: 60 }, { ex: 'pushup', sets: 2, reps: 15, rest: 60 }] } },
  { id: 'k30-3', type: 'kracht', dur: 30, name: 'Trek-focus', main: { sets: [{ ex: 'lat-pulldown', sets: 4, reps: 8, rest: 75 }, { ex: 'trx-row', sets: 3, reps: 12, rest: 60 }, { ex: 'seated-row', sets: 3, reps: 10, rest: 60 }, { ex: 'hanging-knee-raise', sets: 3, reps: 10, rest: 45 }] } },
  { id: 'k45-1', type: 'kracht', dur: 45, name: 'De Grote Vier', main: { sets: [{ ex: 'bulgarian', sets: 4, reps: 8, rest: 75, note: 'per been' }, { ex: 'pullup*', sets: 4, reps: 5, rest: 90 }, { ex: 'chest-press', sets: 4, reps: 8, rest: 75 }, { ex: 'pull-through', sets: 3, reps: 12, rest: 60 }, { ex: 'trx-fallout', sets: 3, reps: 10, rest: 45 }] } },
  { id: 'k45-2', type: 'kracht', dur: 45, name: 'Kracht & Motor', main: { sets: [{ ex: 'shoulder-press', sets: 4, reps: 8, rest: 75 }, { ex: 'seated-row', sets: 4, reps: 10, rest: 75 }, { ex: 'bulgarian', sets: 3, reps: 10, rest: 60, note: 'per been' }, { ex: 'trx-ham-curl', sets: 3, reps: 10, rest: 60 }, { ex: 'jump-squat', sets: 3, reps: 10, rest: 45 }] } },
  { id: 'k45-3', type: 'kracht', dur: 45, name: 'Push-Pull Plus', main: { sets: [{ ex: 'chest-press', sets: 4, reps: 10, rest: 75 }, { ex: 'lat-pulldown', sets: 4, reps: 10, rest: 75 }, { ex: 'pike-pushup', sets: 3, reps: 8, rest: 60 }, { ex: 'trx-row', sets: 3, reps: 12, rest: 60 }, { ex: 'sl-glute-bridge', sets: 3, reps: 12, rest: 45, note: 'per been' }] } },
];

// ── ROUTINES (9): elk 10 oefeningen; 5 min = eerste 5, 10 min = alle 10, 15 min = 10 + eerste 5 nogmaals
export const SEGMENTS = {
  core: { label: 'Core', goal: 'core' },
  mobility: { label: 'Mobility', goal: 'mob' },
  posture: { label: 'Posture', goal: 'mob' },
};
export const ROUTINES = [
  { id: 'c1', seg: 'core', name: 'Rugschild', items: ['mcgill-curlup', 'side-plank', 'bird-dog', 'dead-bug', 'rkc-plank', 'bridge-march', 'pallof', 'bear-plank-tap', 'copenhagen', 'trx-fallout'] },
  { id: 'c2', seg: 'core', name: 'Anti-alles', items: ['dead-bug', 'pallof', 'side-plank', 'bear-plank-tap', 'trx-fallout', 'bird-dog', 'copenhagen', 'rkc-plank', 'mcgill-curlup', 'bridge-march'] },
  { id: 'c3', seg: 'core', name: 'Squash Core', items: ['copenhagen', 'pallof', 'bear-plank-tap', 'side-plank', 'rkc-plank', 'trx-fallout', 'dead-bug', 'bridge-march', 'bird-dog', 'mcgill-curlup'] },
  { id: 'm1', seg: 'mobility', name: 'Heupen Open', items: ['hip-9090', 'couch-stretch', 'wgs', 'deep-squat-hold', 'cossack', 'aslr', 'hip-cars', 'knee-to-wall', 'open-book', 'childs-pose'] },
  { id: 'm2', seg: 'mobility', name: 'Hardloper', items: ['knee-to-wall', 'wgs', 'couch-stretch', 'aslr', 'hip-cars', 'hip-9090', 'deep-squat-hold', 'hip-flexor', 'childs-pose', 'open-book'] },
  { id: 'm3', seg: 'mobility', name: 'Fietsrug', items: ['hip-flexor', 'open-book', 'childs-pose', 'wgs', 'hip-9090', 'couch-stretch', 'cossack', 'deep-squat-hold', 'aslr', 'knee-to-wall'] },
  { id: 'p1', seg: 'posture', name: 'Rechtop', items: ['breathing-9090', 'chin-tuck', 'wall-angel', 'face-pull', 'hip-flexor', 't-spine-towel', 'ytw', 'pec-stretch', 'glute-bridge', 'dead-hang'] },
  { id: 'p2', seg: 'posture', name: 'Schouders Terug', items: ['pec-stretch', 'face-pull', 'ytw', 'scap-pullup', 'chin-tuck', 'dead-hang', 'wall-angel', 't-spine-towel', 'breathing-9090', 'glute-bridge'] },
  { id: 'p3', seg: 'posture', name: 'Bekken Neutraal', items: ['breathing-9090', 'glute-bridge', 'hip-flexor', 'chin-tuck', 'wall-angel', 'face-pull', 't-spine-towel', 'ytw', 'scap-pullup', 'pec-stretch'] },
];
export const routineItems = (r, min) => (min === 5 ? r.items.slice(0, 5) : min === 10 ? r.items : [...r.items, ...r.items.slice(0, 5)]);

// ── GEZIN ──
export const FAMILY = [
  { id: 'g1', name: 'Dierentuin', dur: 12, uitleg: 'Jullie zijn om de beurt een ander dier. 40 sec bewegen, 20 sec lachen.', main: { kind: '4020', rounds: 10, steps: [s('bear-crawl', null, { note: 'beer' }), s('crab-walk', null, { note: 'krab' }), s('jump-squat', null, { note: 'kikker' }), s('flamingo', null, { note: 'flamingo' }), s('run', null, { note: 'vang papa!' })] } },
  { id: 'g2', name: 'Papa-sportschool', dur: 12, uitleg: 'Jouw dochter is het gewicht, de jury en de beloning.', main: { kind: 'amrap', sec: 600, steps: [s('kid-squat', 8), s('kiss-pushup', 5), s('tunnel-plank', 3, { note: 'keer doorkruipen' })] } },
  { id: 'g3', name: 'Zonnegroet Samen', dur: 10, uitleg: 'Rustig samen bewegen. Zij doet je na, jij doet haar na.', main: { kind: 'timed', list: [['sun-salutation', 60], ['flamingo', 40], ['sun-salutation', 60], ['crab-walk', 40], ['sun-salutation', 60], ['bear-crawl', 40], ['sun-salutation', 60], ['childs-pose', 60]] } },
  { id: 'g4', name: 'Tikkertje', dur: 12, uitleg: 'Even minuten rennen (zij is de tikker), oneven minuten squats met haar op je rug.', main: { kind: 'emom', minutes: 10, steps: [s('run', null, { note: '30 sec rennen/tikkertje' }), s('kid-squat', 8)] } },
  { id: 'g5', name: 'Brug & Tunnel', dur: 12, uitleg: 'Jij bouwt bruggen en tunnels, zij kruipt eronderdoor.', main: { kind: '4020', rounds: 12, steps: [s('tunnel-plank'), s('glute-bridge'), s('bear-crawl'), s('kiss-pushup')] } },
];

// ── BETER DAN NIETS ── één ronde = zonnegroet + 10 push-ups + 10 squats
export const BDN = { id: 'bdn', name: 'Beter dan niets', steps: [{ ex: 'sun-salutation', sec: 60 }, s('pushup', 10), s('air-squat', 10)] };

// ── PEILTESTS ──
export const TESTS = [
  { id: 'pushups', name: 'Max push-ups', unit: 'reps', better: 'hi', group: 'Kracht', ex: 'pushup', how: 'Strikt, borst tot een vuist boven de grond, zonder pauze bovenin.' },
  { id: 'pullups', name: 'Max pull-ups', unit: 'reps', better: 'hi', group: 'Kracht', ex: 'pullup', how: 'Vanuit volledig uithangen tot kin boven de stang. Geen kip.' },
  { id: 'deadhang', name: 'Dead hang', unit: 'sec', better: 'hi', group: 'Kracht', ex: 'dead-hang', how: 'Zo lang mogelijk hangen met gestrekte armen.' },
  { id: 'broadjump', name: 'Verspringen', unit: 'cm', better: 'hi', group: 'Kracht', ex: 'broad-jump', how: 'Beste van 3, gemeten tot je achterste hiel.' },
  { id: 'bss-l', name: 'Bulgarian split squat links', unit: 'reps', better: 'hi', group: 'Kracht', ex: 'bulgarian', how: 'Max herhalingen met links voor, dij horizontaal.' },
  { id: 'bss-r', name: 'Bulgarian split squat rechts', unit: 'reps', better: 'hi', group: 'Kracht', ex: 'bulgarian', how: 'Max herhalingen met rechts voor, dij horizontaal.' },
  { id: 'hollow', name: 'Hollow hold', unit: 'sec', better: 'hi', group: 'Core', ex: 'hollow-rock', how: 'Vasthouden tot je onderrug loskomt van de grond.' },
  { id: 'run5', name: '5 km hardlopen', unit: 'time', better: 'lo', group: 'Conditie', how: 'Je snelste 5 km, op een vlak parcours als het kan.' },
  { id: 'run10', name: '10 km hardlopen', unit: 'time', better: 'lo', group: 'Conditie', how: 'Je 10 km-tijd, op een vlak parcours als het kan.' },
  { id: 'row2k', name: '2 km roeien', unit: 'time', better: 'lo', group: 'Conditie', ex: 'row', how: 'Op de roeier, vol gas maar gelijkmatig.' },
  { id: 'ktw-l', name: 'Knee-to-wall links', unit: 'cm', better: 'hi', group: 'Mobiliteit', ex: 'knee-to-wall', how: 'Grootste afstand teen–muur waarbij je knie de muur nog raakt.' },
  { id: 'ktw-r', name: 'Knee-to-wall rechts', unit: 'cm', better: 'hi', group: 'Mobiliteit', ex: 'knee-to-wall', how: 'Grootste afstand teen–muur waarbij je knie de muur nog raakt.' },
  { id: 'squathold', name: 'Diepe squat hold', unit: 'sec', better: 'hi', group: 'Mobiliteit', ex: 'deep-squat-hold', how: 'Zonder TRX, hielen aan de grond, zo lang het comfortabel is.' },
];
export const PEIL_KRACHT = ['pushups', 'pullups', 'deadhang', 'broadjump', 'bss-l', 'bss-r', 'hollow', 'ktw-l', 'ktw-r', 'squathold'];

export const SPORTS = [
  { id: 'run', label: 'Hardlopen', icon: '🏃', km: true },
  { id: 'bike', label: 'Racefiets', icon: '🚴', km: true },
  { id: 'squash', label: 'Squash', icon: '🎾' },
  { id: 'hyrox', label: 'Hyrox', icon: '🔥' },
  { id: 'workout', label: 'Workout', icon: '💪' },
  { id: 'other', label: 'Overig', icon: '✳️' },
];
