import { to, A, line, stand, standA, supine, plank, forearmPlank, quad, hang, seated, front, GA } from './poses.js';

const angTo = (p, q) => (Math.atan2(q[0] - p[0], q[1] - p[1]) * 180) / Math.PI;
const bar = [{ type: 'bar', y: -40 }];
const pullStrap = (anchor) => [{ type: 'line', from: anchor, to: 'wristN', cls: 'strap' }];

// Elke oefening: naam, categorie, uitleg (2–3 zinnen), houdingstip, houdingen voor de animatie.
// uni = eenzijdig (app geeft een seintje om van kant te wisselen)
const list = [
  // ───────────── DUWEN ─────────────
  {
    id: 'pushup', name: 'Push-up', cat: 'duwen',
    desc: 'Handen iets breder dan schouders, lichaam in één rechte lijn. Zak tot je borst een vuist boven de grond is en duw krachtig terug.',
    tip: 'Billen en buik aanspannen zodat je onderrug niet doorzakt; ellebogen op ±45° van je romp, niet wijd.',
    poses: [plank(20, 127, 99), { ...plank(20, 127, 99), ...line(20, 140, 150, 133), armN: to(128, 148, 'up'), armF: to(126, 148, 'up') }],
  },
  {
    id: 'incline-pushup', name: 'Incline push-up', cat: 'duwen',
    desc: 'Push-up met je handen op een verhoging (bank, trap, vensterbank). Hoe hoger, hoe lichter.',
    tip: 'Zelfde rechte lijn als bij een gewone push-up; gebruik deze variant om sets met perfecte vorm af te maken.',
    props: [{ type: 'rect', x: 132, y: 110, w: 40, h: 40 }],
    poses: [
      { ...line(50, 141, 141, 69), armN: to(150, 110, 'back'), armF: to(148, 110, 'back'), legN: to(50, 141, 'down'), legF: to(52, 141, 'down') },
      { ...line(50, 141, 147, 98), armN: to(150, 110, 'up'), armF: to(148, 110, 'up'), legN: to(50, 141, 'down'), legF: to(52, 141, 'down') },
    ],
  },
  {
    id: 'pike-pushup', name: 'Pike push-up', cat: 'duwen',
    desc: 'Billen hoog in een omgekeerde V, handen schouderbreed. Laat je hoofd tussen je handen richting de grond zakken en duw terug.',
    tip: 'Kruin richting de grond, niet je voorhoofd. Houd je onderrug lang door je billen hoog te houden.',
    poses: [
      { hip: [92, 74], t: 45, n: 40, armN: to(140, 148, 'back'), armF: to(138, 148, 'back'), legN: to(68, 141, 'front'), legF: to(70, 141, 'front') },
      { hip: [110, 90], t: 32, n: 25, armN: to(140, 148, 'up'), armF: to(138, 148, 'up'), legN: to(68, 141, 'front'), legF: to(70, 141, 'front') },
    ],
  },
  {
    id: 'chest-press', name: 'Chest press (HG20)', cat: 'duwen', equip: 'hg20',
    desc: 'Zit met je rug tegen het kussen, handgrepen op borsthoogte. Duw de grepen naar voren tot je armen bijna gestrekt zijn en laat gecontroleerd terugkomen.',
    tip: 'Schouderbladen naar achter en omlaag tegen het kussen; je hoofd blijft tegen de rugleuning.',
    props: [{ type: 'rect', x: 78, y: 40, w: 8, h: 74 }, { type: 'rect', x: 76, y: 112, w: 40, h: 38 }],
    poses: [seated({ t: 182, armN: to(114, 64, 'back'), armF: to(112, 64, 'back') }), seated({ t: 182, armN: to(146, 66, 'back'), armF: to(144, 66, 'back') })],
  },
  {
    id: 'shoulder-press', name: 'Shoulder press (HG20)', cat: 'duwen', equip: 'hg20',
    desc: 'Zit rechtop, grepen op schouderhoogte. Duw recht omhoog tot je armen gestrekt zijn en zak gecontroleerd terug.',
    tip: 'Ribben omlaag en buik aan: niet hol trekken om het gewicht omhoog te krijgen. Dan liever 5 kg lichter.',
    props: [{ type: 'rect', x: 78, y: 40, w: 8, h: 74 }, { type: 'rect', x: 76, y: 112, w: 40, h: 38 }],
    poses: [seated({ armN: to(110, 56, 'down'), armF: to(108, 56, 'down') }), seated({ armN: to(102, 15, 'down'), armF: to(100, 15, 'down') })],
  },

  // ───────────── TREKKEN ─────────────
  {
    id: 'pullup', name: 'Pull-up', cat: 'trekken', equip: 'bar', floor: false, props: bar,
    desc: 'Hang aan de stang met je handpalmen van je af, iets breder dan schouders. Trek jezelf op tot je kin boven de stang is en zak volledig terug.',
    tip: 'Begin elke herhaling met je schouderbladen omlaag te trekken. Benen stil, niet zwaaien.',
    poses: [hang({ armN: to(108, -40, 'down'), armF: to(104, -40, 'down') }), hang({ hip: [100, 10], armN: to(108, -40, 'down'), armF: to(104, -40, 'down') })],
  },
  {
    id: 'chinup', name: 'Chin-up', cat: 'trekken', equip: 'bar', floor: false, props: bar,
    desc: 'Als een pull-up, maar met je handpalmen naar je toe en schouderbreed. Iets makkelijker en meer biceps.',
    tip: 'Borst naar de stang trekken, niet alleen je kin. Volledig uithangen onderin.',
    poses: [hang({ armN: to(107, -40, 'down'), armF: to(103, -40, 'down') }), hang({ hip: [100, 12], armN: to(107, -40, 'down'), armF: to(103, -40, 'down') })],
  },
  {
    id: 'neg-pullup', name: 'Negatieve pull-up', cat: 'trekken', equip: 'bar', floor: false, props: bar, tempo: 2.6, hold: 600,
    desc: 'Spring of stap omhoog zodat je kin boven de stang is. Laat jezelf in 3–5 seconden zo langzaam mogelijk zakken.',
    tip: 'De zakfase is het werk: tel hardop. Bouwt kracht op richting je eerste sets van 5.',
    poses: [hang({ hip: [100, 10], armN: to(108, -40, 'down'), armF: to(104, -40, 'down') }), hang({ armN: to(108, -40, 'down'), armF: to(104, -40, 'down') })],
  },
  {
    id: 'band-pullup', name: 'Pull-up met band', cat: 'trekken', equip: 'bar', floor: false,
    props: [...bar, { type: 'line', from: [102, -40], to: 'kneeN', cls: 'band' }, { type: 'line', from: [98, -40], to: 'kneeN', cls: 'band' }],
    desc: 'Hang een elastische band om de stang en zet één knie of voet in de lus. De band helpt je onderin, zodat je meer herhalingen met volle range haalt.',
    tip: 'Zelfde techniek als een gewone pull-up. Kies een band waarmee je 5–8 nette herhalingen haalt.',
    poses: [hang({ legN: A(40, -40), armN: to(108, -40, 'down'), armF: to(104, -40, 'down') }), hang({ hip: [100, 10], legN: A(40, -40), armN: to(108, -40, 'down'), armF: to(104, -40, 'down') })],
  },
  {
    id: 'lat-pulldown', name: 'Lat pulldown (HG20)', cat: 'trekken', equip: 'hg20',
    props: [{ type: 'machine', x: 150, y: -70 }, { type: 'rect', x: 76, y: 112, w: 40, h: 38 }, { type: 'line', from: [104, -62], to: 'wristN', cls: 'cable' }],
    desc: 'Zit onder de high pulley en pak de lat-stang breed vast. Trek de stang naar je bovenborst en laat gecontroleerd terug omhoog gaan.',
    tip: 'Borst omhoog, licht achterover (±10°), ellebogen naar je heupzakken. Niet achter je nek trekken.',
    poses: [seated({ t: 186, armN: to(104, 6, 'back'), armF: to(102, 6, 'back') }), seated({ t: 188, armN: to(108, 60, 'down'), armF: to(106, 60, 'down') })],
  },
  {
    id: 'seated-row', name: 'Seated row (HG20)', cat: 'trekken', equip: 'hg20',
    props: [{ type: 'machine', x: 168, y: -40 }, { type: 'line', from: [170, 128], to: 'wristN', cls: 'cable' }],
    desc: 'Zit op de grond met je voeten tegen het frame en pak de stang van de low pulley. Trek de stang naar je navel en laat gecontroleerd terug.',
    tip: 'Start de beweging met je schouderbladen naar elkaar toe. Romp blijft stil: niet heen en weer zwaaien.',
    poses: [
      { hip: [72, 138], t: 165, armN: to(122, 104, 'back'), armF: to(120, 104, 'back'), legN: to(140, 140, 'up'), legF: to(138, 140, 'up') },
      { hip: [72, 138], t: 182, armN: to(96, 108, 'back'), armF: to(94, 108, 'back'), legN: to(140, 140, 'up'), legF: to(138, 140, 'up') },
    ],
  },
  {
    id: 'trx-row', name: 'TRX row', cat: 'trekken', equip: 'trx',
    props: [{ type: 'line', from: [190, -50], to: 'wristN', cls: 'strap' }],
    desc: 'Pak de handvatten, loop met je voeten naar voren en leun achterover met gestrekte armen. Trek je borst naar je handen en zak gecontroleerd terug.',
    tip: 'Lichaam blijft een plank: heupen niet laten zakken. Hoe schuiner je hangt, hoe zwaarder.',
    poses: [
      { ...line(40, 143, 122, 61), n: 135, armN: to(147, 18, 'down'), armF: to(145, 18, 'down'), legN: to(40, 143, 'down'), legF: to(42, 143, 'down'), ftN: 160, ftF: 160 },
      { ...line(40, 143, 98, 43), n: 160, armN: to(118, 40, 'down'), armF: to(116, 40, 'down'), legN: to(40, 143, 'down'), legF: to(42, 143, 'down'), ftN: 160, ftF: 160 },
    ],
  },

  // ───────────── BENEN & HEUP ─────────────
  {
    id: 'air-squat', name: 'Air squat', cat: 'benen',
    desc: 'Voeten op heupbreedte, tenen licht naar buiten. Zak met je billen naar achter en omlaag tot je dijen minstens horizontaal zijn, en kom krachtig omhoog.',
    tip: 'Knieën in lijn met je tenen, hielen aan de grond, borst trots. Buik licht aangespannen houdt je onderrug neutraal.',
    poses: [stand(), stand({ hip: [84, 114], t: 140, armN: to(160, 78, 'back'), armF: to(158, 78, 'back') })],
  },
  {
    id: 'jump-squat', name: 'Jump squat', cat: 'benen',
    desc: 'Zak in een squat en spring explosief zo hoog mogelijk. Land zacht en zak direct door in de volgende squat.',
    tip: 'Landen op de bal van je voet en dan je hielen; knieën veren mee en blijven boven je tenen.',
    poses: [stand({ hip: [86, 114], t: 140, armN: to(84, 118, 'back'), armF: to(82, 118, 'back') }), stand({ hip: [100, 62], t: 182, armN: to(108, -16, 'back'), armF: to(106, -16, 'back'), legN: to(103, 130, 'front'), legF: to(98, 130, 'front') })],
  },
  {
    id: 'reverse-lunge', name: 'Reverse lunge', cat: 'benen', uni: true,
    desc: 'Stap met één been ver naar achter en zak tot je achterste knie net boven de grond is. Duw via je voorste hiel terug naar stand.',
    tip: 'Romp rechtop, voorste knie boven je middenvoet. Rugvriendelijker en knievriendelijker dan een voorwaartse lunge.',
    poses: [stand(), stand({ hip: [95, 106], legN: to(122, GA, 'front'), legF: to(62, 139, 'down') })],
  },
  {
    id: 'bulgarian', name: 'Bulgarian split squat', cat: 'benen', uni: true,
    props: [{ type: 'rect', x: 28, y: 118, w: 42, h: 32 }],
    desc: 'Zet je achterste voet met de wreef op een bank of traptree. Zak recht omlaag op je voorste been tot je dij horizontaal is en duw terug.',
    tip: 'Licht voorover leunen is prima; houd je bekken recht naar voren. Dit is je beste beenkrachtoefening zonder gewichten.',
    poses: [
      stand({ hip: [100, 84], legN: to(122, GA, 'front'), legF: to(58, 112, 'down'), ftF: -70 }),
      stand({ hip: [98, 112], t: 172, legN: to(122, GA, 'front'), legF: to(58, 112, 'down'), ftF: -70 }),
    ],
  },
  {
    id: 'skater', name: 'Skater jumps', cat: 'benen',
    desc: 'Spring zijwaarts van je ene op je andere been, zoals een schaatser. Land op één been en zwaai je andere been achter je langs.',
    tip: 'Zacht en gecontroleerd landen, knie boven je voet. Perfect voor zijwaartse snelheid op de squashbaan.',
    poses: [
      front({ hip: [80, 92], t: 172, armN: A(-30, -30), armF: A(-50, -40), legN: to(76, GA, 'back'), legF: to(100, 132, 'front'), ftF: 0 }),
      front({ hip: [120, 92], t: 188, armN: A(50, 40), armF: A(30, 30), legN: to(100, 132, 'back'), legF: to(124, GA, 'front'), ftN: 0 }),
    ],
  },
  {
    id: 'sl-glute-bridge', name: 'Glute bridge op één been', cat: 'benen', uni: true,
    desc: 'Lig op je rug, één voet plat op de grond, het andere been gestrekt. Duw je heupen omhoog via je hiel tot je een rechte lijn van knie tot schouder hebt.',
    tip: 'Bekken recht houden (niet laten kantelen) en je billen bovenin 1 seconde aanspannen.',
    poses: [
      supine({ hip: [100, 141], legN: to(126, GA, 'up'), legF: A(100, 100) }),
      supine({ hip: [100, 120], t: angTo([100, 120], [56, 139]), legN: to(126, GA, 'up'), legF: A(112, 112) }),
    ],
  },
  {
    id: 'trx-ham-curl', name: 'TRX hamstring curl', cat: 'benen', equip: 'trx',
    props: [{ type: 'line', from: [168, -60], to: 'ankleN', cls: 'strap' }],
    desc: 'Lig op je rug met je hielen in de TRX-lussen. Til je heupen op en trek je hielen naar je billen, strek daarna weer uit.',
    tip: 'Heupen blijven omhoog tijdens de hele beweging. Te zwaar? Doe alleen de heupbrug in de lussen.',
    poses: [
      { hip: [92, 128], t: angTo([92, 128], [48, 141]), n: -80, armN: A(95, 92), armF: A(95, 92), legN: to(156, 118, 'up'), legF: to(156, 118, 'up') },
      { hip: [92, 114], t: angTo([92, 114], [48, 140]), n: -75, armN: A(95, 92), armF: A(95, 92), legN: to(124, 110, 'up'), legF: to(124, 110, 'up') },
    ],
  },
  {
    id: 'pull-through', name: 'Cable pull-through (HG20)', cat: 'benen', equip: 'hg20',
    props: [{ type: 'machine', x: 6, y: -20 }, { type: 'line', from: [20, 138], to: 'wristN', cls: 'cable' }],
    desc: 'Sta met je rug naar de low pulley, kabel tussen je benen door. Duw je heupen naar achter (scharnieren) en kom omhoog door je heupen krachtig naar voren te brengen.',
    tip: 'Je oefent hier de hip hinge: rug blijft recht, de beweging komt uit je heupen. Bovenin billen aan, niet achterover leunen.',
    poses: [
      stand({ hip: [86, 80], t: 132, n: 125, armN: to(98, 96, 'back'), armF: to(96, 96, 'back'), legN: to(104, GA, 'front'), legF: to(100, GA, 'front') }),
      stand({ hip: [100, 77], armN: to(106, 84, 'back'), armF: to(104, 84, 'back'), legN: to(104, GA, 'front'), legF: to(100, GA, 'front') }),
    ],
  },

  // ───────────── CORE (in workouts) ─────────────
  {
    id: 'hollow-rock', name: 'Hollow rocks', cat: 'core',
    desc: 'Lig op je rug, til schouders en benen van de grond, armen gestrekt achter je hoofd. Wieg heen en weer als een banaan zonder de vorm te verliezen.',
    tip: 'Onderrug blijft tegen de grond gedrukt. Lukt dat niet? Buig je knieën of houd je armen naast je.',
    poses: [
      supine({ hip: [100, 140], t: -112, n: -118, armN: A(-104, -104), armF: A(-104, -104), legN: A(108, 108), legF: A(108, 108) }),
      supine({ hip: [100, 140], t: -100, n: -106, armN: A(-94, -94), armF: A(-94, -94), legN: A(122, 122), legF: A(122, 122) }),
    ],
  },
  {
    id: 'mountain-climber', name: 'Mountain climbers', cat: 'core', tempo: 0.5, hold: 60,
    desc: 'Begin in een hoge plank. Trek afwisselend snel je knieën naar je borst.',
    tip: 'Schouders boven je handen en heupen laag: het is ook een core-oefening, geen billen-in-de-lucht-race.',
    poses: [plank(20, 127, 99, { legN: to(96, 132, 'front') }), plank(20, 127, 99, { legF: to(96, 132, 'front') })],
  },
  {
    id: 'hanging-knee-raise', name: 'Hanging knee raise', cat: 'core', equip: 'bar', floor: false, props: bar,
    desc: 'Hang aan de stang en trek je knieën op tot minstens heuphoogte. Laat gecontroleerd zakken zonder te zwaaien.',
    tip: 'Kantel je bekken bovenin licht naar achter (staartbeen omhoog): dan werken je buikspieren in plaats van alleen je heupbuigers.',
    poses: [hang(), hang({ legN: A(98, 10), legF: A(96, 8) })],
  },
  {
    id: 'trx-knee-tuck', name: 'TRX knee tuck', cat: 'core', equip: 'trx',
    props: [{ type: 'line', from: [40, -60], to: 'ankleN', cls: 'strap' }],
    desc: 'Plankpositie met je voeten in de TRX-lussen. Trek beide knieën naar je borst en strek weer uit.',
    tip: 'Heupen niet laten doorzakken in de plank; schouders boven je handen.',
    poses: [
      { ...line(40, 118, 128, 99), armN: to(129, 148, 'back'), armF: to(127, 148, 'back'), legN: to(40, 118, 'down'), legF: to(42, 118, 'down') },
      { hip: [96, 96], t: angTo([96, 96], [128, 99]), armN: to(129, 148, 'back'), armF: to(127, 148, 'back'), legN: to(78, 112, 'down'), legF: to(80, 112, 'down') },
    ],
  },
  {
    id: 'trx-fallout', name: 'TRX fallout', cat: 'core', equip: 'trx',
    props: [{ type: 'line', from: [62, -70], to: 'wristN', cls: 'strap' }],
    desc: 'Sta met je rug naar het ankerpunt, handvatten in je handen, en leun voorover. Laat je armen gestrekt boven je hoofd naar voren gaan en trek terug.',
    tip: 'Dit is anti-extensie: je onderrug mag niet hol trekken. Hoe verder je valt, hoe zwaarder.',
    poses: [
      { ...line(64, 143, 108, 40), armN: to(132, 78, 'down'), armF: to(130, 78, 'down'), legN: to(64, 143, 'down'), legF: to(66, 143, 'down') },
      { ...line(64, 143, 140, 60), armN: to(186, 44, 'down'), armF: to(184, 44, 'down'), legN: to(64, 143, 'down'), legF: to(66, 143, 'down') },
    ],
  },

  // ───────────── CONDITIE ─────────────
  {
    id: 'burpee', name: 'Burpee', cat: 'conditie', tempo: 0.55, hold: 80,
    desc: 'Zak naar een squat, handen op de grond, spring je voeten naar achter in een plank. Spring terug naar je handen en spring omhoog met je armen boven je hoofd.',
    tip: 'Liever een vloeiend tempo dat je volhoudt dan sprinten en stilvallen. In de plank je buik vast houden.',
    poses: [
      stand(),
      stand({ hip: [88, 118], t: 125, armN: to(128, 148, 'back'), armF: to(126, 148, 'back') }),
      { ...plank(20, 127, 99), legN: to(20, 140, 'down'), legF: to(22, 140, 'down') },
      stand({ hip: [88, 118], t: 125, armN: to(128, 148, 'back'), armF: to(126, 148, 'back') }),
      stand({ hip: [100, 64], armN: to(106, -20, 'back'), armF: to(104, -20, 'back'), legN: to(102, 132, 'front'), legF: to(98, 132, 'front') }),
    ],
  },
  {
    id: 'burpee-broad-jump', name: 'Burpee broad jump', cat: 'conditie', tempo: 0.6, hold: 80, snap: true,
    desc: 'Een burpee, maar in plaats van omhoog spring je zo ver mogelijk naar voren. Land in een squat en begin direct de volgende burpee.',
    tip: 'Landen met zachte knieën en hielen aan de grond. Dit is het Hyrox-station, dus ook goede wedstrijdtraining.',
    poses: [
      stand({ hip: [60, 77], armN: to(62, 80, 'back'), armF: to(58, 80, 'back'), legN: to(62, GA, 'front'), legF: to(58, GA, 'front') }),
      stand({ hip: [48, 118], t: 125, armN: to(88, 148, 'back'), armF: to(86, 148, 'back'), legN: to(62, GA, 'front'), legF: to(58, GA, 'front') }),
      { ...plank(-20, 87, 99), legN: to(-20, 140, 'down'), legF: to(-18, 140, 'down') },
      stand({ hip: [50, 112], t: 135, armN: to(40, 112, 'back'), armF: to(38, 112, 'back'), legN: to(62, GA, 'front'), legF: to(58, GA, 'front') }),
      stand({ hip: [110, 74], t: 150, armN: to(160, 50, 'back'), armF: to(158, 50, 'back'), legN: to(92, 128, 'front'), legF: to(88, 128, 'front') }),
      stand({ hip: [150, 112], t: 140, armN: to(200, 82, 'back'), armF: to(198, 82, 'back'), legN: to(166, GA, 'front'), legF: to(162, GA, 'front') }),
    ],
  },
  {
    id: 'bear-crawl', name: 'Bear crawl', cat: 'conditie', tempo: 0.6, hold: 60,
    desc: 'Op handen en voeten met je knieën een paar centimeter boven de grond. Kruip vooruit met tegenovergestelde hand en voet tegelijk.',
    tip: 'Rug plat als een tafel en heupen laag: als er een glas water op je onderrug stond, mag het niet vallen.',
    poses: [
      { hip: [88, 112], t: 95, n: 100, armN: to(146, 148, 'back'), armF: to(132, 148, 'back'), legN: to(58, 145, 'down'), legF: to(70, 145, 'down') },
      { hip: [96, 112], t: 95, n: 100, armN: to(140, 148, 'back'), armF: to(154, 148, 'back'), legN: to(80, 145, 'down'), legF: to(66, 145, 'down') },
    ],
  },
  {
    id: 'single-under', name: 'Springtouw (single unders)', cat: 'conditie', equip: 'rope', props: [{ type: 'rope' }], snap: true, linear: true, tempo: 0.4, hold: 0,
    desc: 'Spring licht op je voorvoeten terwijl het touw één keer per sprong onder je door gaat. Draai vanuit je polsen, niet je armen.',
    tip: 'Ellebogen dicht bij je lichaam, kleine sprongetjes van een paar centimeter. Rustig ademen.',
    poses: [
      stand({ hip: [100, 71], armN: to(114, 86, 'back'), armF: to(112, 86, 'back'), legN: to(102, 139, 'front'), legF: to(98, 139, 'front'), props: { rope: 0 } }),
      stand({ hip: [100, 77], armN: to(114, 92, 'back'), armF: to(112, 92, 'back'), props: { rope: 180 } }),
      stand({ hip: [100, 71], armN: to(114, 86, 'back'), armF: to(112, 86, 'back'), legN: to(102, 139, 'front'), legF: to(98, 139, 'front'), props: { rope: 360 } }),
    ],
  },
  {
    id: 'double-under', name: 'Springtouw (double unders)', cat: 'conditie', equip: 'rope', props: [{ type: 'rope' }], snap: true, linear: true, tempo: 0.5, hold: 0,
    desc: 'Het touw gaat twee keer onder je door per sprong. Spring iets hoger en draai sneller vanuit je polsen.',
    tip: 'Mislukt er een? Gewoon doorgaan met single unders en weer inslingeren. Lichaam recht, niet je knieën optrekken.',
    poses: [
      stand({ hip: [100, 66], armN: to(114, 82, 'back'), armF: to(112, 82, 'back'), legN: to(102, 135, 'front'), legF: to(98, 135, 'front'), props: { rope: 0 } }),
      stand({ hip: [100, 77], armN: to(114, 92, 'back'), armF: to(112, 92, 'back'), props: { rope: 360 } }),
      stand({ hip: [100, 66], armN: to(114, 82, 'back'), armF: to(112, 82, 'back'), legN: to(102, 135, 'front'), legF: to(98, 135, 'front'), props: { rope: 720 } }),
    ],
  },
  {
    id: 'row', name: 'Roeien', cat: 'conditie', equip: 'rower', props: [{ type: 'rower' }, { type: 'line', from: [178, 120], to: 'wristN', cls: 'cable' }], tempo: 0.8, hold: 100,
    desc: 'Volgorde trekken: benen – romp – armen. Terug andersom: armen – romp – benen. Werk in meters of calorieën zoals aangegeven.',
    tip: 'Kracht komt voor 60% uit je benen. Rug recht bij de catch; leun aan het eind maar licht achterover.',
    poses: [
      { hip: [88, 132], t: 160, armN: to(154, 108, 'back'), armF: to(152, 108, 'back'), legN: to(150, 128, 'up'), legF: to(148, 128, 'up') },
      { hip: [62, 132], t: 198, armN: to(92, 100, 'back'), armF: to(90, 100, 'back'), legN: to(150, 128, 'up'), legF: to(148, 128, 'up') },
    ],
  },
  {
    id: 'bike', name: 'Hometrainer', cat: 'conditie', equip: 'bike', props: [{ type: 'bike' }], snap: true, linear: true, tempo: 0.25, hold: 0,
    desc: 'Fietsen op de hometrainer, in calorieën, tijd of als sprint. Bij sprints: weerstand omhoog en volle bak.',
    tip: 'Romp stil en schouders laag; de kracht komt uit je benen, niet uit trekken aan het stuur.',
    poses: [0, 90, 180, 270, 360].map((d) => {
      const r = (a) => [122 + 16 * Math.sin((a * Math.PI) / 180), 126 + 16 * Math.cos((a * Math.PI) / 180)];
      return { hip: [92, 74], t: 160, n: 150, armN: to(146, 56, 'down'), armF: to(144, 56, 'down'), legN: to(...r(d), 'front'), legF: to(...r(d + 180), 'front') };
    }),
  },

  // ───────────── WARMING-UP ─────────────
  {
    id: 'jumping-jack', name: 'Jumping jacks', cat: 'warmup', tempo: 0.45, hold: 40,
    desc: 'Spring je benen uit elkaar en klap je handen boven je hoofd, spring terug.',
    tip: 'Licht en veerkrachtig op je voorvoeten.',
    poses: [front(), front({ hip: [100, 74], armN: A(-150, -170), armF: A(150, 170), legN: to(80, 140, 'back'), legF: to(120, 140, 'front') })],
  },
  {
    id: 'high-knees', name: 'High knees', cat: 'warmup', tempo: 0.4, hold: 30,
    desc: 'Op de plaats rennen met je knieën tot heuphoogte.',
    tip: 'Rechtop blijven, armen actief meebewegen.',
    poses: [
      standA({ hip: [100, 75], t: 178, armN: A(-30, 60), armF: A(40, 120), legN: A(92, 8), legF: A(0, 0) }),
      standA({ hip: [100, 75], t: 178, armN: A(40, 120), armF: A(-30, 60), legN: A(0, 0), legF: A(92, 8) }),
    ],
  },
  {
    id: 'arm-circles', name: 'Armcirkels', cat: 'warmup', snap: true, linear: true, tempo: 0.5, hold: 0,
    desc: 'Grote cirkels met gestrekte armen, eerst naar voren, dan naar achter.',
    tip: 'Rustig en groot; schouders laag houden.',
    poses: [0, 90, 180, 270, 360].map((d) => standA({ armN: A(d, d), armF: A(d + 8, d + 8) })),
  },
  {
    id: 'inchworm', name: 'Inchworm', cat: 'warmup', tempo: 1.1,
    desc: 'Buig voorover, zet je handen op de grond en loop met je handen naar voren tot een plank. Loop terug en kom omhoog.',
    tip: 'Knieën mogen buigen; gaat het om warm worden van hamstrings en schouders.',
    poses: [
      stand({ hip: [60, 77], armN: to(62, 80, 'back'), armF: to(58, 80, 'back'), legN: to(62, GA, 'front'), legF: to(58, GA, 'front') }),
      stand({ hip: [58, 78], t: 20, n: 10, armN: to(80, 148, 'back'), armF: to(78, 148, 'back'), legN: to(62, GA, 'front'), legF: to(58, GA, 'front') }),
      { ...plank(62, 168, 99), legN: to(62, 140, 'down'), legF: to(60, 140, 'down') },
    ],
  },
  {
    id: 'leg-swings', name: 'Beenzwaaien', cat: 'warmup', uni: true, props: [{ type: 'wall', x: 146 }],
    desc: 'Steun met je hand tegen een muur en zwaai één been ontspannen naar voren en naar achter.',
    tip: 'Romp stil houden, de beweging komt uit je heup.',
    poses: [
      standA({ armN: to(144, 64, 'down'), armF: to(142, 64, 'down'), legN: A(55, 55), legF: to(97, GA, 'front') }),
      standA({ armN: to(144, 64, 'down'), armF: to(142, 64, 'down'), legN: A(-35, -35), legF: to(97, GA, 'front') }),
    ],
  },
  {
    id: 'run', name: 'Rennen / sprinten', cat: 'warmup', tempo: 0.4, hold: 20,
    desc: 'Rennen of sprinten, binnen of buiten.',
    tip: 'Licht voorover vanuit je enkels, armen meebewegen.',
    poses: [
      standA({ hip: [100, 74], t: 170, armN: A(-40, 30), armF: A(40, 120), legN: A(55, 5), legF: A(-30, -100) }),
      standA({ hip: [100, 74], t: 170, armN: A(40, 120), armF: A(-40, 30), legN: A(-30, -100), legF: A(55, 5) }),
    ],
  },

  // ───────────── CORE-ROUTINES ─────────────
  {
    id: 'dead-bug', name: 'Dead bug', cat: 'core', uni: true, tempo: 1.4,
    desc: 'Lig op je rug, armen naar het plafond, knieën 90° boven je heupen. Strek langzaam tegenovergestelde arm en been uit en kom terug.',
    tip: 'Je onderrug blijft de hele tijd tegen de grond. Uitademen tijdens het uitstrekken.',
    poses: [
      supine({ armN: A(180, 180), armF: A(176, 176), legN: A(180, 90), legF: A(178, 90) }),
      supine({ armN: A(-100, -100), armF: A(176, 176), legN: A(180, 90), legF: A(98, 98) }),
    ],
  },
  {
    id: 'bird-dog', name: 'Bird dog', cat: 'core', uni: true, tempo: 1.4,
    desc: 'Op handen en knieën. Strek tegenovergestelde arm en been uit tot ze in lijn met je romp zijn, houd 2 seconden vast en wissel.',
    tip: 'Geen draai in je bekken en niet hol trekken: denk "lang worden" in plaats van "hoog tillen".',
    poses: [quad(), quad({ armN: to(182, 102, 'back'), legF: A(-92, -92) })],
  },
  {
    id: 'mcgill-curlup', name: 'McGill curl-up', cat: 'core', tempo: 1.2, hold: 800,
    desc: 'Lig op je rug, één knie gebogen, het andere been gestrekt, handen onder je onderrug. Til hoofd en schouders een paar centimeter op en houd 8–10 seconden vast.',
    tip: 'Je nek beweegt niet: hoofd en schouders komen als één blok omhoog. Kleine beweging, groot effect.',
    poses: [
      supine({ armN: to(92, 141, 'up'), armF: to(90, 141, 'up'), legN: to(124, GA, 'up'), legF: A(90, 90) }),
      supine({ t: -80, n: -80, armN: to(92, 141, 'up'), armF: to(90, 141, 'up'), legN: to(124, GA, 'up'), legF: A(90, 90) }),
    ],
  },
  {
    id: 'rkc-plank', name: 'RKC plank', cat: 'core',
    desc: 'Onderarmplank, maar dan maximaal aangespannen: trek je ellebogen richting je tenen, knijp je billen en dijen samen. Korte, zware sets van 10–20 seconden.',
    tip: 'Bekken licht naar achter gekanteld (staartbeen onder) zodat je onderrug niet hol hangt.',
    poses: [forearmPlank(), forearmPlank(30)],
  },
  {
    id: 'side-plank', name: 'Side plank', cat: 'core', uni: true,
    desc: 'Op je zij steunend op je onderarm, voeten op elkaar. Til je heupen tot je lichaam een rechte lijn is en houd vast.',
    tip: 'Elleboog recht onder je schouder, heupen naar voren duwen. Te zwaar? Zet je onderste knie op de grond.',
    poses: [
      { ...line(30, 142, 128, 116), armN: to(150, 147, 'down'), armF: A(180, 180), legN: to(30, 142, 'down'), legF: to(30, 140, 'down') },
      { ...line(30, 142, 128, 116), hip: [94, 134], armN: to(150, 147, 'down'), armF: A(180, 180), legN: to(30, 142, 'down'), legF: to(30, 140, 'down') },
    ],
  },
  {
    id: 'copenhagen', name: 'Copenhagen plank', cat: 'core', uni: true, props: [{ type: 'rect', x: 8, y: 112, w: 44, h: 38 }],
    desc: 'Side plank met je bovenste been op een bank (knie = korte hefboom, enkel = lange hefboom). Je onderste been hangt los eronder.',
    tip: 'Traint je adductoren: de klassieke blessurepreventie voor squash. Begin met de knievariant en 15 seconden.',
    poses: [
      { ...line(34, 108, 134, 122), armN: to(156, 147, 'down'), armF: A(150, 120), legN: to(34, 108, 'down'), legF: to(62, 145, 'down') },
      { ...line(34, 108, 134, 116), armN: to(156, 147, 'down'), armF: A(150, 120), legN: to(34, 108, 'down'), legF: to(60, 132, 'down') },
    ],
  },
  {
    id: 'bear-plank-tap', name: 'Bear plank shoulder taps', cat: 'core',
    desc: 'Op handen en voeten met je knieën net boven de grond. Tik afwisselend met je hand je tegenovergestelde schouder aan.',
    tip: 'Heupen mogen niet wiebelen of draaien. Voeten iets breder maakt het makkelijker.',
    poses: [
      { hip: [88, 112], t: 95, n: 100, armN: to(136, 148, 'back'), armF: to(134, 148, 'back'), legN: to(62, 145, 'down'), legF: to(64, 145, 'down') },
      { hip: [88, 112], t: 95, n: 100, armN: to(128, 104, 'down'), armF: to(134, 148, 'back'), legN: to(62, 145, 'down'), legF: to(64, 145, 'down') },
    ],
  },
  {
    id: 'pallof', name: 'Pallof press', cat: 'core', equip: 'band', uni: true, props: [{ type: 'line', from: [36, 92], to: 'wristN', cls: 'band' }],
    desc: 'Sta zijwaarts naast het ankerpunt van een band (of de kabel), band ter hoogte van je borst. Duw je handen recht naar voren en houd 2 seconden vast.',
    tip: 'Anti-rotatie: de band wil je draaien, jij laat dat niet gebeuren. Heupen en schouders recht vooruit.',
    poses: [
      stand({ hip: [100, 80], armN: to(116, 90, 'down'), armF: to(114, 90, 'down'), legN: to(106, GA, 'front'), legF: to(94, GA, 'front') }),
      stand({ hip: [100, 80], armN: to(150, 88, 'down'), armF: to(148, 88, 'down'), legN: to(106, GA, 'front'), legF: to(94, GA, 'front') }),
    ],
  },
  {
    id: 'bridge-march', name: 'Glute bridge march', cat: 'core',
    desc: 'Heupbrug omhoog en vasthouden. Til afwisselend een knie op zonder dat je bekken zakt of kantelt.',
    tip: 'Leg eventueel je handen op je heupbotten: die moeten stil blijven.',
    poses: [
      supine({ hip: [100, 120], t: angTo([100, 120], [56, 139]), legN: to(126, GA, 'up'), legF: to(124, GA, 'up') }),
      supine({ hip: [100, 120], t: angTo([100, 120], [56, 139]), legN: to(136, 92, 'up'), legF: to(124, GA, 'up') }),
    ],
  },

  // ───────────── MOBILITY ─────────────
  {
    id: 'hip-9090', name: '90/90 hip switches', cat: 'mobility', tempo: 1.4,
    desc: 'Zit op de grond met beide knieën 90° gebogen, naar één kant. Draai je knieën naar de andere kant zonder je handen te gebruiken (of met handen achter je).',
    tip: 'Rechtop zitten en de beweging uit je heupen laten komen, niet uit je onderrug.',
    poses: [
      { hip: [92, 138], t: 192, armN: to(70, 147, 'back'), armF: to(68, 147, 'back'), legN: A(140, 30), legF: A(140, 30) },
      { hip: [92, 138], t: 182, armN: to(70, 147, 'back'), armF: to(68, 147, 'back'), legN: A(78, -70), legF: A(-70, -100) },
    ],
  },
  {
    id: 'wgs', name: "World's greatest stretch", cat: 'mobility', uni: true, tempo: 1.3,
    desc: 'Grote uitvalspas, beide handen naast je voorste voet. Draai je romp open en reik met je arm naar het plafond, terug en wissel.',
    tip: 'Achterste been gestrekt en bil aangespannen: dan rek je ook je heupbuiger mee.',
    poses: [
      { hip: [92, 118], t: 105, n: 110, armN: to(128, 148, 'back'), armF: to(126, 148, 'back'), legN: to(134, GA, 'front'), legF: to(30, 138, 'down') },
      { hip: [92, 118], t: 112, n: 150, armN: to(140, 52, 'back'), armF: to(126, 148, 'back'), legN: to(134, GA, 'front'), legF: to(30, 138, 'down') },
    ],
  },
  {
    id: 'couch-stretch', name: 'Couch stretch', cat: 'mobility', uni: true, props: [{ type: 'wall', x: 46, y1: 60 }], tempo: 1.5,
    desc: 'Achterste knie op een kussen tegen de muur of bank, scheenbeen omhoog tegen de muur. Voorste voet plat. Kom langzaam rechtop.',
    tip: 'Knijp je bil van het achterste been aan en kantel je bekken naar achter: dat is de rek, niet hol trekken.',
    poses: [
      { hip: [72, 112], t: 160, armN: to(116, 108, 'back'), armF: to(114, 108, 'back'), legN: to(120, GA, 'front'), legF: to(52, 111, 'down'), ftF: 178 },
      { hip: [76, 110], t: 184, armN: to(96, 96, 'back'), armF: to(94, 96, 'back'), legN: to(120, GA, 'front'), legF: to(52, 111, 'down'), ftF: 178 },
    ],
  },
  {
    id: 'deep-squat-hold', name: 'Diepe squat hold (TRX)', cat: 'mobility', equip: 'trx', props: [{ type: 'line', from: [194, -60], to: 'wristN', cls: 'strap' }], tempo: 1.6,
    desc: 'Houd de TRX vast en zak in je diepst mogelijke squat. Blijf hangen, wieg rustig heen en weer en adem.',
    tip: 'Hielen aan de grond, borst omhoog. De TRX helpt je rechtop te blijven terwijl je enkels en heupen opengaan.',
    poses: [
      { hip: [92, 128], t: 160, armN: to(146, 70, 'down'), armF: to(144, 70, 'down'), legN: to(106, GA, 'front'), legF: to(102, GA, 'front') },
      { hip: [90, 133], t: 166, armN: to(146, 72, 'down'), armF: to(144, 72, 'down'), legN: to(106, GA, 'front'), legF: to(102, GA, 'front') },
    ],
  },
  {
    id: 'cossack', name: 'Cossack shifts', cat: 'mobility', tempo: 1.5,
    desc: 'Brede stand. Verschuif je gewicht naar één kant en zak diep op dat been, het andere been gestrekt met tenen omhoog. Schuif rustig naar de andere kant.',
    tip: 'Hiel van het gebogen been aan de grond, borst omhoog. Ga zo diep als het comfortabel gaat.',
    poses: [
      front({ hip: [74, 118], t: 174, armN: A(20, 70), armF: A(-20, 70), legN: to(64, GA, 'back'), legF: to(140, GA, 'front'), ftF: 150 }),
      front({ hip: [126, 118], t: 186, armN: A(20, 70), armF: A(-20, 70), legN: to(60, GA, 'back'), legF: to(136, GA, 'front'), ftN: -150 }),
    ],
  },
  {
    id: 'hip-cars', name: 'Hip CARs', cat: 'mobility', uni: true, tempo: 1.2, hold: 100, props: [{ type: 'wall', x: 146 }],
    desc: 'Sta op één been met steun tegen de muur. Maak met je andere knie een zo groot mogelijke, langzame cirkel: voor – opzij – achter.',
    tip: 'Romp blijft volledig stil: alleen je heup beweegt. Langzaam is beter dan groot.',
    poses: [
      standA({ armN: to(144, 64, 'down'), armF: to(142, 64, 'down'), legN: A(0, 0), legF: to(97, GA, 'front') }),
      standA({ armN: to(144, 64, 'down'), armF: to(142, 64, 'down'), legN: A(92, 0), legF: to(97, GA, 'front') }),
      standA({ armN: to(144, 64, 'down'), armF: to(142, 64, 'down'), legN: A(70, 120), legF: to(97, GA, 'front') }),
      standA({ armN: to(144, 64, 'down'), armF: to(142, 64, 'down'), legN: A(-30, -100), legF: to(97, GA, 'front') }),
    ],
  },
  {
    id: 'knee-to-wall', name: 'Knee-to-wall', cat: 'mobility', uni: true, props: [{ type: 'wall', x: 160, y1: 60 }],
    desc: 'Halfgeknield tegenover een muur, voorste voet een paar centimeter van de muur. Duw je knie naar de muur zonder dat je hiel loskomt.',
    tip: 'Raakt je knie makkelijk? Schuif je voet verder van de muur. Knie over je middelste tenen bewegen.',
    poses: [
      { hip: [110, 112], t: 180, armN: to(124, 104, 'back'), armF: to(122, 104, 'back'), legN: to(144, GA, 'front'), legF: A(-20, -90), ftF: 0 },
      { hip: [120, 112], t: 178, armN: to(140, 100, 'back'), armF: to(138, 100, 'back'), legN: to(144, GA, 'front'), legF: A(-34, -90), ftF: 0 },
    ],
  },
  {
    id: 'aslr', name: 'Actieve straight leg raise', cat: 'mobility', uni: true, tempo: 1.4,
    desc: 'Lig op je rug, beide benen gestrekt. Til één been zo hoog mogelijk op zonder je knie te buigen en laat langzaam zakken.',
    tip: 'Druk je andere been actief in de grond. Zo train je hamstringlengte die je ook écht kunt gebruiken.',
    poses: [supine({ legN: A(90, 90), legF: A(90, 90), ftF: 180, ftN: 180 }), supine({ legN: A(150, 150), legF: A(90, 90), ftF: 180, ftN: 240 })],
  },
  {
    id: 'open-book', name: 'Open book', cat: 'mobility', uni: true, tempo: 1.6,
    desc: 'Lig op je zij met je knieën 90° opgetrokken en je armen gestrekt voor je. Draai je bovenste arm in een grote boog open naar de andere kant en volg hem met je ogen.',
    tip: 'Knieën blijven op elkaar liggen: zo draait je bovenrug en niet je onderrug. Uitademen tijdens het openen.',
    poses: [
      supine({ n: -90, armN: A(150, 150), armF: A(152, 152), legN: A(150, 80), legF: A(150, 80) }),
      supine({ n: -120, armN: A(-150, -150), armF: A(152, 152), legN: A(150, 80), legF: A(150, 80) }),
    ],
  },
  {
    id: 'childs-pose', name: "Child's pose met lat-reach", cat: 'mobility', tempo: 2,
    desc: 'Zit op je hielen, knieën uit elkaar, en laat je borst naar de grond zakken met je armen ver naar voren. Loop met je handen naar één kant om je zij te rekken.',
    tip: 'Adem diep in je onderrug en zijkanten. Billen richting je hielen houden.',
    poses: [
      { hip: [72, 128], t: 75, n: 72, armN: A(92, 92), armF: A(92, 92), legN: A(57, -90), legF: A(57, -90) },
      { hip: [70, 130], t: 79, n: 76, armN: A(98, 94), armF: A(98, 94), legN: A(57, -90), legF: A(57, -90) },
    ],
  },
  {
    id: 'hip-flexor', name: 'Heupbuigerstretch (halfgeknield)', cat: 'mobility', uni: true, tempo: 1.5,
    desc: 'Halfgeknield met je voorste knie op 90°. Knijp de bil van je achterste been aan, kantel je bekken naar achter en reik met je arm omhoog.',
    tip: 'Je voelt het voor in je heup, niet in je onderrug. Kleine beweging is goed: het bekken kantelen is de rek.',
    poses: [
      { hip: [96, 112], t: 178, armN: to(104, 108, 'back'), armF: to(100, 108, 'back'), legN: to(130, GA, 'front'), legF: A(-15, -90), ftF: 0 },
      { hip: [104, 113], t: 188, armN: to(104, 108, 'back'), armF: to(90, -10, 'back'), legN: to(130, GA, 'front'), legF: A(-30, -90), ftF: 0 },
    ],
  },

  // ───────────── POSTURE ─────────────
  {
    id: 'chin-tuck', name: 'Chin tucks', cat: 'posture', props: [{ type: 'wall', x: 84 }], tempo: 1.2, hold: 900,
    desc: 'Sta met je rug tegen de muur. Schuif je hoofd recht naar achter (dubbele kin) tot je achterhoofd de muur raakt, houd 5 seconden vast.',
    tip: 'Niet omhoog of omlaag kijken: het is een schuifbeweging. Je traint de diepe nekbuigers die je hoofd terug in lijn houden.',
    poses: [stand({ hip: [96, 77], n: 160, legN: to(98, GA, 'front'), legF: to(93, GA, 'front'), armN: to(98, 80, 'back'), armF: to(94, 80, 'back') }), stand({ hip: [96, 77], n: 186, legN: to(98, GA, 'front'), legF: to(93, GA, 'front'), armN: to(98, 80, 'back'), armF: to(94, 80, 'back') })],
  },
  {
    id: 'wall-angel', name: 'Wall angels', cat: 'posture', tempo: 1.6,
    desc: 'Rug, achterhoofd en armen tegen de muur, armen in een "doelpaal"-positie. Schuif je armen langzaam omhoog en omlaag terwijl alles contact houdt.',
    tip: 'Ribben omlaag: je onderrug mag niet van de muur loskomen. Alleen zo ver als je contact houdt.',
    poses: [
      front({ armN: A(-90, 180), armF: A(90, 180) }),
      front({ armN: A(-150, 192), armF: A(150, 168) }),
    ],
  },
  {
    id: 'ytw', name: 'Prone Y-T-W', cat: 'posture', tempo: 1.3, hold: 600,
    desc: 'Lig op je buik. Til je armen in een Y-vorm, dan een T, dan een W (ellebogen naar je zij), telkens 3 seconden vasthouden.',
    tip: 'Duimen omhoog, schouderbladen naar achter en omlaag. Kin licht ingetrokken, blik naar de grond.',
    poses: [
      { hip: [96, 141], t: 92, n: 96, armN: A(104, 104), armF: A(102, 102), legN: A(-90, -90), legF: A(-90, -90) },
      { hip: [96, 141], t: 94, n: 96, armN: A(170, 170), armF: A(168, 168), legN: A(-90, -90), legF: A(-90, -90) },
      { hip: [96, 141], t: 94, n: 96, armN: A(236, 160), armF: A(234, 158), legN: A(-90, -90), legF: A(-90, -90) },
    ],
  },
  {
    id: 'face-pull', name: 'Band face pull', cat: 'posture', equip: 'band', props: [{ type: 'line', from: [196, 30], to: 'wristN', cls: 'band' }],
    desc: 'Band op hoofdhoogte vast. Trek de band naar je gezicht met je ellebogen hoog en draai je handen naar achter alsof je je spierballen showt.',
    tip: 'Eindig met je handen naast je oren en je schouderbladen samen. Dé oefening tegen naar voren hangende schouders.',
    poses: [stand({ armN: to(148, 34, 'down'), armF: to(146, 34, 'down') }), stand({ armN: to(112, 18, 'down'), armF: to(110, 18, 'down') })],
  },
  {
    id: 'scap-pullup', name: 'Scapular pull-ups', cat: 'posture', equip: 'bar', floor: false, props: bar,
    desc: 'Hang met gestrekte armen aan de stang. Trek alleen je schouderbladen omlaag en naar elkaar toe zodat je een paar centimeter omhoog komt, en laat weer los.',
    tip: 'Armen blijven gestrekt. Kleine beweging die je schouderstabiliteit en je pull-ups verbetert.',
    poses: [hang(), hang({ hip: [100, 48] })],
  },
  {
    id: 'pec-stretch', name: 'Doorway pec stretch', cat: 'posture', uni: true, props: [{ type: 'wall', x: 130, y1: -20 }],
    desc: 'Zet je onderarm tegen een deurpost met je elleboog op schouderhoogte. Stap rustig naar voren tot je een rek in je borst voelt.',
    tip: 'Schouder laag en weg van je oor; niet doorbuigen in je onderrug om verder te komen.',
    poses: [
      stand({ armN: to(126, 6, 'down') }),
      stand({ hip: [110, 77], armN: to(126, 6, 'down'), legN: to(126, GA, 'front'), legF: to(92, GA, 'front') }),
    ],
  },
  {
    id: 't-spine-towel', name: 'Thoracale extensie (handdoek)', cat: 'posture', props: [{ type: 'circle', x: 70, y: 143, r: 6, cls: 'eqf' }], tempo: 1.6,
    desc: 'Lig met een stevig opgerolde handdoek dwars onder je bovenrug (onder je schouderbladen). Handen achter je hoofd, laat je bovenrug over de rol zakken. Schuif de rol een paar centimeter en herhaal.',
    tip: 'Billen op de grond en ribben omlaag: het strekken gebeurt in je bovenrug, niet in je onderrug.',
    poses: [
      supine({ hip: [104, 140], t: -86, n: -70, armN: A(-150, -30), armF: A(-148, -30), legN: to(128, GA, 'up'), legF: to(126, GA, 'up') }),
      supine({ hip: [104, 140], t: -95, n: -110, armN: A(-110, -100), armF: A(-108, -98), legN: to(128, GA, 'up'), legF: to(126, GA, 'up') }),
    ],
  },
  {
    id: 'breathing-9090', name: '90/90-ademhaling', cat: 'posture', props: [{ type: 'rect', x: 104, y: 106, w: 40, h: 44 }], tempo: 2.5, hold: 900,
    desc: 'Lig op je rug met je kuiten op een stoel of bank (heupen en knieën 90°). Adem 4 seconden in door je neus, 6–8 seconden volledig uit en voel je ribben zakken.',
    tip: 'Druk tijdens het uitademen je onderrug zacht in de grond. Dit "reset" je bekken- en ribbenstand: de basis tegen een holle onderrug.',
    poses: [
      supine({ hip: [100, 141], armN: to(110, 128, 'up'), armF: to(108, 128, 'up'), legN: A(178, 90), legF: A(176, 90) }),
      supine({ hip: [100, 141], t: -88, armN: to(110, 126, 'up'), armF: to(108, 126, 'up'), legN: A(178, 90), legF: A(176, 90) }),
    ],
  },
  {
    id: 'glute-bridge', name: 'Glute bridge', cat: 'posture',
    desc: 'Lig op je rug met je voeten plat. Kantel je bekken naar achter en rol je heupen omhoog tot een rechte lijn, 2 seconden vasthouden.',
    tip: 'Druk door je hielen en voel het in je billen, niet in je onderrug of hamstrings.',
    poses: [
      supine({ hip: [100, 141], legN: to(126, GA, 'up'), legF: to(124, GA, 'up') }),
      supine({ hip: [100, 120], t: angTo([100, 120], [56, 139]), legN: to(126, GA, 'up'), legF: to(124, GA, 'up') }),
    ],
  },
  {
    id: 'dead-hang', name: 'Dead hang', cat: 'posture', equip: 'bar', floor: false, props: bar,
    desc: 'Hang ontspannen aan de stang met gestrekte armen en laat je lichaam zwaar worden. Rustig ademen.',
    tip: 'Ontlast je wervelkolom en rekt je lats en borst. Begin met 20–30 seconden.',
    poses: [hang(), hang({ hip: [100, 57] })],
  },

  // ───────────── PEIL & ZONNEGROET ─────────────
  {
    id: 'broad-jump', name: 'Verspringen zonder aanloop', cat: 'peil', snap: true,
    desc: 'Sta met je tenen achter een lijn, zwaai je armen naar achter en spring zo ver mogelijk naar voren. Meet van de lijn tot je achterste hiel.',
    tip: 'Landen zonder achterover te vallen telt pas. Beste van 3 pogingen.',
    poses: [
      stand({ hip: [52, 108], t: 130, armN: to(48, 100, 'back'), armF: to(46, 100, 'back'), legN: to(66, GA, 'front'), legF: to(62, GA, 'front') }),
      stand({ hip: [110, 76], t: 150, armN: to(160, 58, 'back'), armF: to(158, 58, 'back'), legN: to(90, 126, 'front'), legF: to(86, 126, 'front') }),
      stand({ hip: [150, 112], t: 140, armN: to(200, 82, 'back'), armF: to(198, 82, 'back'), legN: to(168, GA, 'front'), legF: to(164, GA, 'front') }),
    ],
  },
  {
    id: 'sun-salutation', name: 'Zonnegroet', cat: 'mobility', tempo: 1.1, hold: 600,
    desc: 'Vloeiende reeks: armen omhoog, voorover vouwen, halve lift, plank, laag zakken, opwaartse hond, neerwaartse hond, voeten naar voren, omhoog komen.',
    tip: 'Koppel elke beweging aan een ademhaling: omhoog = in, omlaag = uit.',
    poses: [
      stand(),
      stand({ t: 186, n: 192, armN: to(98, -18, 'back'), armF: to(96, -18, 'back') }),
      stand({ hip: [96, 77], t: 15, n: 8, armN: to(116, 148, 'back'), armF: to(114, 148, 'back') }),
      stand({ hip: [96, 77], t: 100, n: 100, armN: to(118, 116, 'back'), armF: to(116, 116, 'back') }),
      { ...plank(40, 147, 99), legN: to(40, 140, 'down'), legF: to(42, 140, 'down') },
      { ...line(40, 140, 170, 131), armN: to(149, 148, 'up'), armF: to(147, 148, 'up'), legN: to(40, 140, 'down'), legF: to(42, 140, 'down') },
      { hip: [104, 136], t: angTo([104, 136], [146, 100]), n: 160, armN: to(149, 148, 'back'), armF: to(147, 148, 'back'), legN: to(40, 141, 'down'), legF: to(42, 141, 'down') },
      { hip: [96, 72], t: angTo([96, 72], [146, 146]), n: 30, armN: to(149, 148, 'back'), armF: to(147, 148, 'back'), legN: to(50, 143, 'front'), legF: to(52, 143, 'front') },
      stand({ hip: [96, 77], t: 15, n: 8, armN: to(116, 148, 'back'), armF: to(114, 148, 'back') }),
      stand({ t: 186, n: 192, armN: to(98, -18, 'back'), armF: to(96, -18, 'back') }),
    ],
  },

  // ───────────── GEZIN ─────────────
  {
    id: 'kid-squat', name: 'Squat met dochter op je rug', cat: 'gezin', props: [{ type: 'kid', at: 'back' }],
    desc: 'Je oudste klimt op je rug (armen om je nek, jij houdt haar benen vast). Doe rustige, diepe squats.',
    tip: 'Rustig tempo, borst trots. Extra gewicht = extra kracht, en zij vindt het een kermisattractie.',
    poses: [stand({ armN: to(84, 90, 'back'), armF: to(82, 90, 'back') }), stand({ hip: [86, 112], t: 148, armN: to(80, 110, 'back'), armF: to(78, 110, 'back') })],
  },
  {
    id: 'kiss-pushup', name: 'Kusjes-push-up', cat: 'gezin', props: [{ type: 'kid', at: 'floor', x: 140 }],
    desc: 'Je dochter ligt op haar rug onder je. Bij elke push-up geef je haar onderin een kusje.',
    tip: 'Dezelfde strakke plank als bij een gewone push-up. Op je knieën mag ook, het kusje telt.',
    poses: [plank(20, 127, 99), { ...plank(20, 127, 99), ...line(20, 140, 150, 133), armN: to(128, 148, 'up'), armF: to(126, 148, 'up') }],
  },
  {
    id: 'tunnel-plank', name: 'Tunnel-plank', cat: 'gezin', props: [{ type: 'kid', at: 'floor', x: 80 }],
    desc: 'Jij bent de tunnel: hoge plank met je heupen iets hoger. Je dochter kruipt onder je door, heen en terug.',
    tip: 'Buik vast en ademen. Tunnel mag niet instorten.',
    poses: [plank(20, 127, 96, { hip: [80, 106] }), plank(20, 127, 99)],
  },
  {
    id: 'crab-walk', name: 'Krabbenloop', cat: 'gezin', tempo: 0.7,
    desc: 'Handen achter je, voeten voor je, billen van de grond. Loop als een krab door de kamer, voor- en achteruit.',
    tip: 'Heupen omhoog duwen en schouders weg van je oren. Goed tegengewicht voor alle push-ups.',
    poses: [
      { hip: [96, 118], t: angTo([96, 118], [64, 100]), n: -150, armN: to(60, 148, 'back'), armF: to(66, 148, 'back'), legN: to(138, GA, 'up'), legF: to(130, GA, 'up') },
      { hip: [102, 116], t: angTo([102, 116], [70, 98]), n: -150, armN: to(72, 148, 'back'), armF: to(64, 148, 'back'), legN: to(134, GA, 'up'), legF: to(142, GA, 'up') },
    ],
  },
  {
    id: 'flamingo', name: 'Flamingo', cat: 'gezin', uni: true, tempo: 1.5,
    desc: 'Sta samen op één been met je knie omhoog en je armen wijd. Wie het langst blijft staan wint.',
    tip: 'Kijk naar een vast punt en span je bil van je standbeen aan: goed voor enkels en balans bij hardlopen.',
    poses: [
      standA({ armN: A(80, 90), armF: A(70, 90), legN: A(85, 0), legF: to(97, GA, 'front') }),
      standA({ armN: A(86, 94), armF: A(76, 94), legN: A(90, 4), legF: to(97, GA, 'front') }),
    ],
  },
];

export const EX = Object.fromEntries(list.map((e) => [e.id, e]));
export const EXERCISES = list;
