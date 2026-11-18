// Pose-helpers. Hoeken: 0 = omlaag, 90 = vooruit, 180 = omhoog, -90 = achteruit.
export const GA = 145; // enkelhoogte bij staan

export const to = (x, y, bend) => ({ to: [x, y], bend });
export const A = (a1, a2) => ({ a: [a1, a2] });

const angTo = (p, q) => (Math.atan2(q[0] - p[0], q[1] - p[1]) * 180) / Math.PI;

// Rechte lijn enkel -> schouder (plank, push-up): geeft heup + romphoek
export function line(ax, ay, sx, sy) {
  const dx = sx - ax, dy = sy - ay, d = Math.hypot(dx, dy);
  const hip = [ax + (dx / d) * 70, ay + (dy / d) * 70];
  return { hip, t: angTo(hip, [sx, sy]) };
}

// Staan met handen langs het lichaam (IK-versie)
export const stand = (o = {}) => ({
  hip: [100, 77], t: 180,
  armN: to(102, 80, 'back'), armF: to(98, 80, 'back'),
  legN: to(102, GA, 'front'), legF: to(97, GA, 'front'),
  ...o,
});

// Staan met hoek-armen (voor zwaaiende armen)
export const standA = (o = {}) => ({
  hip: [100, 77], t: 180,
  armN: A(4, 4), armF: A(-4, -4),
  legN: to(102, GA, 'front'), legF: to(97, GA, 'front'),
  ...o,
});

// Rugligging (hoofd links): heup op (x,140)
export const supine = (o = {}) => ({
  hip: [100, 140], t: -90, n: -90,
  armN: A(95, 92), armF: A(95, 92),
  legN: A(90, 90), legF: A(90, 90),
  ...o,
});

// Hoge plank: enkels (ax), handen onder schouders
export function plank(ax = 20, sx = 127, sy = 99, o = {}) {
  const l = line(ax, 140, sx, sy);
  return {
    ...l, n: l.t,
    armN: to(sx + 1, 148, 'back'), armF: to(sx - 1, 148, 'back'),
    legN: to(ax, 140, 'down'), legF: to(ax + 2, 140, 'down'),
    ...o,
  };
}

// Onderarmplank
export function forearmPlank(ax = 34, o = {}) {
  const l = line(ax, 141, 130, 122);
  return {
    ...l, n: l.t,
    armN: to(156, 146, 'down'), armF: to(154, 146, 'down'),
    legN: to(ax, 141, 'down'), legF: to(ax + 2, 141, 'down'),
    ...o,
  };
}

// Viervoetersstand (knieën op de grond)
export const quad = (o = {}) => ({
  hip: [88, 108], t: 97, n: 100,
  armN: to(135, 148, 'back'), armF: to(133, 148, 'back'),
  legN: A(0, -90), legF: A(2, -90),
  ...o,
});

// Hangen aan de stang (stang op y=-40)
export const hang = (o = {}) => ({
  hip: [100, 56], t: 180,
  armN: to(108, -40, 'front'), armF: to(104, -40, 'front'),
  legN: A(-6, -22), legF: A(-4, -26),
  ...o,
});

// Zitten op bank/zitje
export const seated = (o = {}) => ({
  hip: [96, 110], t: 180,
  armN: to(104, 112, 'back'), armF: to(100, 112, 'back'),
  legN: to(128, GA, 'front'), legF: to(124, GA, 'front'),
  ...o,
});

// Vooraanzicht staan (schouder-/heupbreedte)
export const front = (o = {}) => ({
  hip: [100, 77], t: 180, sw: 26, hw: 14,
  armN: A(-6, -4), armF: A(6, 4),
  legN: to(90, GA, 'back'), legF: to(110, GA, 'front'),
  ftN: -90, ftF: 90,
  ...o,
});
