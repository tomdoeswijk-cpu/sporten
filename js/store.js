// Opslag: IndexedDB (state + foto's), met localStorage als noodval.
const DB = 'sportapp', VER = 1;
let db = null;

function open() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, VER);
    r.onupgradeneeded = () => {
      const d = r.result;
      if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv');
      if (!d.objectStoreNames.contains('photos')) d.createObjectStore('photos');
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
const tx = (store, mode, fn) => new Promise((res, rej) => {
  const t = db.transaction(store, mode);
  const req = fn(t.objectStore(store));
  t.oncomplete = () => res(req && req.result);
  t.onerror = () => rej(t.error);
});

export const DEFAULT = () => ({
  v: 1,
  sessions: [], // {id, ts, date, kind, sport, title, minutes, km, refId, counts:{sport,core,mob}, score, detail}
  peil: [], // {id, date, test, value}
  plans: {}, // weekKey -> {slots:[{day,time,what}], made}
  settings: { anchor: '21:00', ritualMin: 10, start: null, lastBackup: null, anchorCal: false, pullLevel: null, reportSeen: null },
});

let state = DEFAULT();
let fallback = false;

export async function load() {
  try {
    db = await open();
    const s = await tx('kv', 'readonly', (st) => st.get('state'));
    if (s) state = { ...DEFAULT(), ...s, settings: { ...DEFAULT().settings, ...s.settings } };
  } catch (e) {
    fallback = true;
    try { const raw = localStorage.getItem('sportapp'); if (raw) state = JSON.parse(raw); } catch {}
  }
  if (!state.settings.start) { state.settings.start = new Date().toISOString().slice(0, 10); await save(); }
  return state;
}
export const get = () => state;
export async function save() {
  if (fallback || !db) { try { localStorage.setItem('sportapp', JSON.stringify(state)); } catch {} return; }
  await tx('kv', 'readwrite', (st) => st.put(state, 'state'));
}
export async function update(fn) { fn(state); await save(); }

export async function putPhoto(id, blob) { if (db) await tx('photos', 'readwrite', (st) => st.put(blob, id)); }
export async function getPhoto(id) { return db ? tx('photos', 'readonly', (st) => st.get(id)) : null; }
export async function allPhotoIds() { return db ? tx('photos', 'readonly', (st) => st.getAllKeys()) : []; }
export async function delPhoto(id) { if (db) await tx('photos', 'readwrite', (st) => st.delete(id)); }

// Persistente opslag aanvragen (Chrome staat dit toe voor geïnstalleerde PWA's)
export async function persist() {
  if (!navigator.storage?.persist) return false;
  if (await navigator.storage.persisted()) return true;
  return navigator.storage.persist();
}
export async function isPersisted() { return navigator.storage?.persisted ? navigator.storage.persisted() : false; }

// Back-up: JSON met foto's als data-URL
const blobToData = (b) => new Promise((r) => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); });
export async function exportAll() {
  const photos = {};
  for (const id of await allPhotoIds()) photos[id] = await blobToData(await getPhoto(id));
  return JSON.stringify({ app: 'ritme', exported: new Date().toISOString(), state, photos });
}
export async function importAll(text) {
  const data = JSON.parse(text);
  if (!data.state || !Array.isArray(data.state.sessions)) throw new Error('Geen geldig back-upbestand');
  state = { ...DEFAULT(), ...data.state, settings: { ...DEFAULT().settings, ...data.state.settings } };
  await save();
  for (const [id, url] of Object.entries(data.photos || {})) await putPhoto(id, await (await fetch(url)).blob());
}
export async function reset() { state = DEFAULT(); state.settings.start = new Date().toISOString().slice(0, 10); await save(); for (const id of await allPhotoIds()) await delPhoto(id); }
