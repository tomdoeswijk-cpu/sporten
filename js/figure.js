// Figuur-engine: één poppetje met gewrichtshoeken / IK-doelen, geanimeerd tussen houdingen.
// Hoekconventie (graden): 0 = recht omlaag, 90 = vooruit (rechts), 180 = omhoog, -90 = achteruit (links).

const L = { torso: 46, neck: 6, head: 9, ua: 26, fa: 24, th: 36, sh: 34, foot: 11 };
const G = 150; // grondlijn
const rad = (d) => (d * Math.PI) / 180;
const dir = (a) => [Math.sin(rad(a)), Math.cos(rad(a))];
const add = (p, a, len) => { const d = dir(a); return [p[0] + d[0] * len, p[1] + d[1] * len]; };
const angTo = (p, q) => (Math.atan2(q[0] - p[0], q[1] - p[1]) * 180) / Math.PI;

// 2-botten IK: kies de oplossing waarvan het middengewricht het meest in richting 'bend' ligt
function ik(root, target, l1, l2, bend) {
  const dx = target[0] - root[0], dy = target[1] - root[1];
  let d = Math.hypot(dx, dy);
  d = Math.max(Math.abs(l1 - l2) + 0.01, Math.min(l1 + l2 - 0.01, d));
  const base = angTo(root, target);
  const alpha = (Math.acos((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)) * 180) / Math.PI;
  const opts = [base + alpha, base - alpha].map((a1) => {
    const mid = add(root, a1, l1);
    const end = add(mid, angTo(mid, target) , l2);
    return { a1, a2: angTo(mid, target), mid, end };
  });
  const score = (m) => ({ front: m[0], back: -m[0], up: -m[1], down: m[1] }[bend || 'front']);
  return score(opts[0].mid) >= score(opts[1].mid) ? opts[0] : opts[1];
}

function limb(root, spec, l1, l2, defBend) {
  if (spec && spec.to) {
    const r = ik(root, spec.to, l1, l2, spec.bend || defBend);
    return { a1: r.a1, a2: r.a2, mid: r.mid, end: add(r.mid, r.a2, l2) };
  }
  const [a1, a2] = (spec && spec.a) || [0, 0];
  const mid = add(root, a1, l1);
  return { a1, a2, mid, end: add(mid, a2, l2) };
}

export function solve(p) {
  const hip = p.hip || [100, 77];
  const t = p.t ?? 180;
  const sw = p.sw || 0, hw = p.hw || 0; // schouder-/heupbreedte voor vooraanzicht
  const sh = add(hip, t, L.torso);
  const neckEnd = add(sh, p.n ?? t, L.neck);
  const head = add(neckEnd, p.n ?? t, L.head);
  const perp = (pt, w, side) => [pt[0] + side * w / 2, pt[1]];
  const shN = perp(sh, sw, -1), shF = perp(sh, sw, 1);
  const hipN = perp(hip, hw, -1), hipF = perp(hip, hw, 1);
  const armN = limb(shN, p.armN, L.ua, L.fa, 'back');
  const armF = limb(shF, p.armF || p.armN, L.ua, L.fa, 'back');
  const legN = limb(hipN, p.legN, L.th, L.sh, 'front');
  const legF = limb(hipF, p.legF || p.legN, L.th, L.sh, 'front');
  const toeN = add(legN.end, p.ftN ?? legN.a2 + 90, L.foot);
  const toeF = add(legF.end, p.ftF ?? legF.a2 + 90, L.foot);
  return {
    hip, sh, neckEnd, head, shN, shF, hipN, hipF,
    elbowN: armN.mid, wristN: armN.end, elbowF: armF.mid, wristF: armF.end,
    kneeN: legN.mid, ankleN: legN.end, kneeF: legF.mid, ankleF: legF.end, toeN, toeF,
    props: p.props || {},
  };
}

// Interpolatie van willekeurige (geneste) pose-structuren
function lerp(a, b, k) {
  if (typeof a === 'number' && typeof b === 'number') return a + (b - a) * k;
  if (Array.isArray(a) && Array.isArray(b)) return a.map((v, i) => lerp(v, b[i], k));
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const o = {};
    for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
      o[key] = key in a && key in b ? lerp(a[key], b[key], k) : (key in a ? a[key] : b[key]);
    }
    return o;
  }
  return k < 0.5 ? a : b;
}
const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);

// ---------- tekenen ----------
const seg = (a, b, cls) => `<line class="${cls}" x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}"/>`;
const pt = (j, ref) => (typeof ref === 'string' ? j[ref] : ref);

function drawProps(list, j, front) {
  let s = '';
  for (const pr of list || []) {
    if (!!pr.front !== front) continue;
    switch (pr.type) {
      case 'bar': s += `<line class="eq" x1="${pr.x1 ?? 60}" y1="${pr.y}" x2="${pr.x2 ?? 140}" y2="${pr.y}" stroke-width="5"/>`; break;
      case 'line': { const a = pt(j, pr.from), b = pt(j, pr.to); s += seg(a, b, pr.cls || 'strap'); break; }
      case 'rect': s += `<rect class="${pr.cls || 'eqf'}" x="${pr.x}" y="${pr.y}" width="${pr.w}" height="${pr.h}" rx="${pr.r ?? 3}"/>`; break;
      case 'circle': s += `<circle class="${pr.cls || 'eq'}" cx="${pr.x}" cy="${pr.y}" r="${pr.r}"/>`; break;
      case 'wall': s += `<line class="eq" x1="${pr.x}" y1="${pr.y1 ?? -40}" x2="${pr.x}" y2="${G}" stroke-width="4"/>`; break;
      case 'rope': {
        const c = j.hip, R = pr.R ?? 88, ph = j.props.rope ?? 0;
        const P = add(c, ph, R), m1 = add(c, ph - 40, R * 0.95), m2 = add(c, ph + 40, R * 0.95);
        s += `<path class="rope" d="M${j.wristN} Q${m1} ${P}"/><path class="rope" d="M${j.wristF} Q${m2} ${P}"/>`;
        break;
      }
      case 'kid': {
        const base = pr.at === 'floor' ? [pr.x, 144] : [j.sh[0] - 6, j.sh[1] + 4];
        if (pr.at === 'floor') {
          s += `<line class="kid" x1="${base[0] - 22}" y1="${base[1]}" x2="${base[0] + 8}" y2="${base[1]}"/><circle class="kidh" cx="${base[0] + 17}" cy="${base[1] - 2}" r="8"/>`;
        } else {
          s += `<line class="kid" x1="${base[0] - 8}" y1="${base[1] - 2}" x2="${base[0] - 12}" y2="${base[1] + 26}"/><circle class="kidh" cx="${base[0] - 6}" cy="${base[1] - 13}" r="8"/><line class="kid" x1="${base[0] - 8}" y1="${base[1] + 2}" x2="${base[0] + 6}" y2="${base[1] + 4}"/><line class="kid" x1="${base[0] - 12}" y1="${base[1] + 26}" x2="${base[0] + 2}" y2="${base[1] + 34}"/>`;
        }
        break;
      }
      case 'bike': {
        const cx = pr.cx ?? 122, cy = pr.cy ?? 126;
        s += `<circle class="eq" cx="${cx}" cy="${cy}" r="17" fill="none"/><path class="eq" d="M ${cx} ${cy} L 92 82 M 84 80 L 102 80 M ${cx} ${cy} L 146 58 M 140 56 L 154 56 M 70 ${G} L 160 ${G}"/>`;
        break;
      }
      case 'rower': s += `<path class="eq" d="M 20 141 L 190 141"/><circle class="eq" cx="182" cy="122" r="15" fill="none"/><rect class="eqf" x="${j.hip[0] - 12}" y="139" width="24" height="6" rx="2"/>`; break;
      case 'machine': s += `<rect class="eqf" x="${pr.x}" y="${pr.y ?? -60}" width="${pr.w ?? 12}" height="${G - (pr.y ?? -60)}" rx="2"/>`; break;
    }
  }
  return s;
}

function render(pose, opts) {
  const j = solve(pose);
  const pr = pose.props?.list || opts.props;
  const sideTorso = (pose.sw || 0) > 0;
  let s = '';
  if (opts.floor !== false) {
    s += `<line class="floor" x1="-60" y1="${G}" x2="260" y2="${G}"/>`;
    const low = ['ankleN', 'ankleF', 'toeN', 'toeF', 'wristN', 'wristF', 'kneeN', 'kneeF', 'hip', 'sh'].map((k) => j[k]).filter((q) => q[1] > G - 16);
    if (low.length) {
      const x0 = Math.min(...low.map((q) => q[0])), x1 = Math.max(...low.map((q) => q[0]));
      s += `<ellipse class="shadow" cx="${((x0 + x1) / 2).toFixed(1)}" cy="${G + 1}" rx="${((x1 - x0) / 2 + 14).toFixed(1)}" ry="4"/>`;
    }
  }
  s += drawProps(pr, j, false);
  // achterste ledematen
  s += seg(j.shF, j.elbowF, 'limb far') + seg(j.elbowF, j.wristF, 'limb far');
  s += seg(j.hipF, j.kneeF, 'limb far') + seg(j.kneeF, j.ankleF, 'limb far') + seg(j.ankleF, j.toeF, 'foot far');
  // romp en hoofd
  if (sideTorso) s += seg(j.shN, j.shF, 'torso') + seg(j.hipN, j.hipF, 'torso');
  s += seg(j.hip, j.sh, 'torso') + seg(j.sh, j.neckEnd, 'neck');
  s += `<circle class="head" cx="${j.head[0].toFixed(1)}" cy="${j.head[1].toFixed(1)}" r="${L.head}"/><circle class="head-hl" cx="${(j.head[0] - 2.6).toFixed(1)}" cy="${(j.head[1] - 2.8).toFixed(1)}" r="3"/>`;
  // voorste ledematen
  s += seg(j.hipN, j.kneeN, 'limb') + seg(j.kneeN, j.ankleN, 'limb') + seg(j.ankleN, j.toeN, 'foot');
  s += seg(j.shN, j.elbowN, 'limb') + seg(j.elbowN, j.wristN, 'limb');
  s += drawProps(pr, j, true);
  return s;
}

// bounding box over alle keyframes
function bbox(poses) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (let i = 0; i < poses.length; i++) {
    for (let k = 0; k <= 1; k += 0.25) {
      const j = solve(lerp(poses[i], poses[(i + 1) % poses.length], k));
      for (const key of ['hip', 'sh', 'elbowN', 'wristN', 'elbowF', 'wristF', 'kneeN', 'ankleN', 'kneeF', 'ankleF', 'toeN', 'toeF']) {
        x0 = Math.min(x0, j[key][0]); x1 = Math.max(x1, j[key][0]);
        y0 = Math.min(y0, j[key][1]); y1 = Math.max(y1, j[key][1]);
      }
      x0 = Math.min(x0, j.head[0] - L.head); x1 = Math.max(x1, j.head[0] + L.head);
      y0 = Math.min(y0, j.head[1] - L.head); y1 = Math.max(y1, j.head[1] + L.head);
    }
  }
  return [x0, y0, x1, y1];
}

// Maakt een SVG-element en animeert het tussen de houdingen van een oefening.
export function figure(ex, { animate = true } = {}) {
  const poses = ex.poses;
  const opts = { props: ex.props, floor: ex.floor };
  const [x0, y0, x1, y1] = bbox(poses);
  const pad = 14;
  const minW = 150, minH = 120;
  let w = x1 - x0 + pad * 2, h = Math.max(y1, ex.floor === false ? y1 : G) - y0 + pad * 2;
  let vx = x0 - pad, vy = y0 - pad;
  if (w < minW) { vx -= (minW - w) / 2; w = minW; }
  if (h < minH) { vy -= (minH - h) / 2; h = minH; }
  if (w / h < 1.25) { const nw = h * 1.25; vx -= (nw - w) / 2; w = nw; }
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `${vx.toFixed(1)} ${vy.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`);
  svg.setAttribute('class', 'fig');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', ex.name);
  svg.innerHTML = render(poses[0], opts);
  if (!animate || poses.length < 2) return svg;

  const move = (ex.tempo || 1) * 900, hold = ex.hold ?? 350, linear = !!ex.linear;
  const n = poses.length, wrap = !ex.snap;
  const cycle = (move + hold) * (wrap ? n : n - 1);
  let start = null;
  const tick = (ts) => {
    if (!svg.isConnected) { if (start !== null) return; requestAnimationFrame(tick); return; }
    if (start === null) start = ts;
    let el = (ts - start) % cycle;
    const stepLen = move + hold;
    const i = Math.floor(el / stepLen);
    const into = el - i * stepLen;
    const k = into < hold ? 0 : (into - hold) / move;
    const a = poses[i], b = poses[(i + 1) % n];
    svg.innerHTML = render(lerp(a, b, linear ? k : ease(k)), opts);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  return svg;
}
