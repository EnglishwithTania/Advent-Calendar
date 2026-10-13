/*
  Карта календаря: снежный северный городок на горе.
  Здесь только рисунок (SVG). Какой домик открыт, а какой нет, решает app.js.

  Холст 360×560 «точек». Небо, снег и горы нарисованы с запасом за краями,
  поэтому на экране любой формы карта влезает целиком и без пустых полос.

  Как поменять:
    LEGS   витки серпантина (снизу вверх) и масштаб домиков на каждом витке
    BUILDINGS  какое здание стоит на месте каждого дня: дом, кафе, банк, пекарня… и его цвет
*/
(() => {
  'use strict';

  const W = 360, H = 560;

  // Серпантин: 5 витков по 5 домиков. xl/xr — края витка, yl/yr — высота дороги слева/справа.
  // Повороты дороги прижаты к краям экрана, чтобы домикам досталась почти вся ширина.
  // s — масштаб домиков: чем выше в гору, тем чуть дальше и меньше.
  const LEGS = [
    { xl: 6, xr: 354, yl: 514, yr: 502, s: 1.26 },
    { xl: 6, xr: 354, yl: 412, yr: 424, s: 1.24 },
    { xl: 6, xr: 354, yl: 334, yr: 322, s: 1.02 },
    { xl: 6, xr: 354, yl: 234, yr: 244, s: 1.2 },
    { xl: 6, xr: 354, yl: 156, yr: 146, s: 1.17 }
  ];
  const HOUSE_X = [-4, 364];   // домики расставлены по этой ширине, шаг ~74

  const NIGHT = '#121a2e';

  const f1 = (v) => Math.round(v * 10) / 10;

  // Смешать цвет с другим (t = 0…1). Нужно, чтобы «выключить свет» в будущих домиках.
  function mix(a, b, t) {
    const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const A = p(a), B = p(b);
    return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
  }

  // Предсказуемый «случай»: звёзды стоят на одних и тех же местах при каждом запуске.
  let seed = 11;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

  /* ---------- где стоит домик ---------- */

  // Главная ёлка стоит в центре города, на среднем витке между домами. Она выше домов,
  // но не достаёт до улицы сверху. Дома этого витка раздвинуты, чтобы ей хватило места.
  const MAIN_TREE = { leg: 2, after: 3, h: 68, hw: 30 };   // after — сколько домов слева от ёлки

  let mainLayout = null;
  function layoutMainStreet() {
    if (mainLayout) return mainLayout;
    const s = LEGS[MAIN_TREE.leg].s, first = MAIN_TREE.leg * 5;
    const hw = [0, 1, 2, 3, 4].map((k) => BUILDERS[BUILDINGS[(first + k) % BUILDINGS.length].type](DUMMY).w / 2 * s);
    const items = hw.map((v) => v * 2);
    items.splice(MAIN_TREE.after, 0, MAIN_TREE.hw * 2 + 6);
    const gap = ((HOUSE_X[1] - HOUSE_X[0]) - items.reduce((a, b) => a + b, 0)) / (items.length - 1);
    let x = HOUSE_X[0];
    const xs = [];
    items.forEach((w, j) => {
      if (j === MAIN_TREE.after) mainLayout = { treeX: f1(x + w / 2) };
      else xs.push(f1(x + w / 2));
      x += w + gap;
    });
    mainLayout.xs = xs;
    mainLayout.gap = gap;
    return mainLayout;
  }

  function housePos(i) {
    const li = Math.min(Math.floor(i / 5), LEGS.length - 1);
    const leg = LEGS[li];
    if (li === MAIN_TREE.leg) {
      const x = layoutMainStreet().xs[i % 5];
      return { x, y: f1(roadY(li, x) - 7 * leg.s), s: leg.s };
    }
    let f = ((i % 5) + 0.5) / 5;
    if (li % 2) f = 1 - f;   // нечётные витки идут справа налево
    const x = HOUSE_X[0] + f * (HOUSE_X[1] - HOUSE_X[0]);
    return { x: f1(x), y: f1(roadY(li, x) - 7 * leg.s), s: leg.s };
  }

  // Высота дороги на витке li в точке x
  function roadY(li, x) {
    const l = LEGS[li];
    return l.yl + (x - l.xl) / (l.xr - l.xl) * (l.yr - l.yl);
  }

  function roadPath() {
    const L = LEGS;
    const d = ['M -70 ' + (L[0].yl + 30), 'Q -24 ' + (L[0].yl + 2) + ' ' + L[0].xl + ' ' + L[0].yl];
    L.forEach((l, i) => {
      const right = i % 2 === 0;
      const ex = right ? l.xr : l.xl, ey = right ? l.yr : l.yl;
      d.push('L ' + ex + ' ' + ey);
      const n = L[i + 1];
      if (n) {
        const sx = right ? n.xr : n.xl, sy = right ? n.yr : n.yl;
        const k = right ? 38 : -38;
        d.push('C ' + (ex + k) + ' ' + ey + ' ' + f1(sx + k * n.s) + ' ' + sy + ' ' + sx + ' ' + sy);
      }
    });
    d.push('Q 384 146 396 128');
    return d.join(' ');
  }

  /* ---------- декорации ---------- */

  function range(pts, fill, cap, base) {
    let s = '<path d="M' + pts[0][0] + ' ' + base + ' ' + pts.map((p) => 'L' + p[0] + ' ' + p[1]).join(' ') +
      ' L' + pts[pts.length - 1][0] + ' ' + base + ' Z" fill="' + fill + '"/>';
    for (let i = 1; i < pts.length - 1; i++) {
      const [px, py] = pts[i], [lx, ly] = pts[i - 1], [rx, ry] = pts[i + 1];
      if (py >= ly || py >= ry) continue;   // не вершина
      s += '<path d="M' + px + ' ' + py + ' L' + rx + ' ' + ry + ' L' + rx + ' ' + base + ' L' + f1(px + (rx - px) * 0.3) + ' ' + base + ' Z" fill="#000" opacity="0.14"/>';
      const t = 0.3;
      const a = [px + (lx - px) * t, py + (ly - py) * t], b = [px + (rx - px) * t, py + (ry - py) * t];
      let z = '';
      [0.25, 0.5, 0.75].forEach((q, j) => {
        z += ' L' + f1(b[0] + (a[0] - b[0]) * q) + ' ' + f1(b[1] + (a[1] - b[1]) * q + (j % 2 ? -4 : 5));
      });
      s += '<path d="M' + f1(a[0]) + ' ' + f1(a[1]) + ' L' + px + ' ' + py + ' L' + f1(b[0]) + ' ' + f1(b[1]) + z + ' Z" fill="' + cap + '"/>';
    }
    return s;
  }

  // У каждой ёлки свой трюк. Если трюк не указан, он выбирается по очереди из этого списка.
  const TREE_TRICKS = ['shake', 'robin', 'lights', 'owl', 'grow', 'presents', 'peek', 'shake'];
  let treeCount = 0;

  function tree(x, y, h, lights, trick) {
    const layers = [[0, 0.42, 0.24], [0.22, 0.68, 0.33], [0.44, 0.9, 0.42]];
    trick = trick || TREE_TRICKS[treeCount++ % TREE_TRICKS.length];
    let s = '<g class="fun fun-tree" data-fun="tree" data-trick="' + trick + '"><rect x="' + f1(x - h * 0.05) + '" y="' + f1(y - h * 0.12) + '" width="' + f1(h * 0.1) + '" height="' + f1(h * 0.12) + '" fill="#3b2a22"/>';
    layers.forEach(([a, b, w]) => {
      const top = y - h + a * h, bot = y - h + b * h, hw = w * h;
      s += '<path d="M' + f1(x) + ' ' + f1(top) + ' L' + f1(x - hw) + ' ' + f1(bot) + ' L' + f1(x + hw) + ' ' + f1(bot) + ' Z" fill="#1d4a45"/>';
      s += '<path d="M' + f1(x - hw) + ' ' + f1(bot) + ' Q' + f1(x - hw / 2) + ' ' + f1(bot - 3) + ' ' + f1(x) + ' ' + f1(bot) + ' Q' + f1(x + hw / 2) + ' ' + f1(bot - 3) + ' ' + f1(x + hw) + ' ' + f1(bot) + '" class="tsnow" stroke="#dfe8f5" stroke-width="' + f1(Math.max(1.4, h * 0.05)) + '" fill="none" stroke-linecap="round"/>';
    });
    s += '<path d="M' + f1(x) + ' ' + f1(y - h) + ' L' + f1(x - h * 0.1) + ' ' + f1(y - h * 0.82) + ' Q' + f1(x) + ' ' + f1(y - h * 0.86) + ' ' + f1(x + h * 0.1) + ' ' + f1(y - h * 0.82) + ' Z" class="tsnow" fill="#e8eff9"/>';
    if (lights) {
      const cols = ['#ff5a5a', '#f2c970', '#6fd3ff', '#8ef0a8'];
      [[0.3, -0.12], [0.36, 0.1], [0.55, -0.2], [0.6, 0.16], [0.63, 0], [0.8, -0.28], [0.84, 0.24], [0.78, 0.04]].forEach(([fy, fx], i) => {
        s += '<circle class="bulb b' + (i % 2) + '" cx="' + f1(x + fx * h) + '" cy="' + f1(y - h + fy * h) + '" r="' + f1(h * 0.035) + '" fill="' + cols[i % 4] + '"/>';
      });
      s += star(x, y - h - 2, h * 0.09);
    }
    return s + '</g>';
  }

  function star(x, y, r) {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
      d += (i ? 'L' : 'M') + f1(x + Math.cos(a) * rr) + ' ' + f1(y + Math.sin(a) * rr) + ' ';
    }
    return '<path d="' + d + 'Z" fill="#f2c970"/>';
  }

  function gift(x, y, w, h, color, ribbon) {
    const rb = ribbon || '#f3e9d2';
    return '<rect x="' + f1(x - w / 2) + '" y="' + f1(y - h) + '" width="' + w + '" height="' + h + '" rx="1" fill="' + color + '"/>' +
      '<rect x="' + f1(x - 1) + '" y="' + f1(y - h) + '" width="2" height="' + h + '" fill="' + rb + '"/>' +
      '<rect x="' + f1(x - w / 2) + '" y="' + f1(y - h / 2 - 1) + '" width="' + w + '" height="2" fill="' + rb + '"/>' +
      '<ellipse cx="' + f1(x - 2.2) + '" cy="' + f1(y - h - 1.4) + '" rx="2.4" ry="1.5" fill="' + rb + '"/>' +
      '<ellipse cx="' + f1(x + 2.2) + '" cy="' + f1(y - h - 1.4) + '" rx="2.4" ry="1.5" fill="' + rb + '"/>';
  }

  // Помощник Санты. Начало координат — у ног, смотрит вправо. o.flip — смотрит влево.
  function elf(x, y, s, o) {
    o = o || {};
    const sx = o.flip ? -s : s;
    let g = '<g class="fun fun-elf" data-fun="elf" data-trick="' + (o.trick || 'toss') + '"' + (o.style ? ' style="' + o.style + '"' : '') +
      '><g transform="translate(' + x + ' ' + y + ') scale(' + sx + ' ' + s + ')">';
    g += '<rect x="-4" y="-9" width="3" height="9" fill="#f3e9d2"/><rect x="1" y="-9" width="3" height="9" fill="#f3e9d2"/>';
    g += '<path d="M-4 -7h3v2h-3zM-4 -3h3v2h-3zM1 -7h3v2h-3zM1 -3h3v2h-3z" fill="#c8343c"/>';
    g += '<path d="M-6.5 0.5 L-1 0.5 L-1 -1.6 L-4.5 -1.6 Q -7 -1.6 -8 -3.2 Q -8 -0.6 -6.5 0.5Z M1 0.5 L6.5 0.5 Q 8 -0.6 8.5 -3.2 Q 7 -1.6 4.5 -1.6 L1 -1.6Z" fill="#3a2618"/>';
    g += '<path d="M-7 -8 L-4 -20 L4 -20 L7 -8 L5 -6 L3 -8 L1 -6 L-1 -8 L-3 -6 L-5 -8 Z" fill="#2f8f5b"/>';
    g += '<rect x="-5.6" y="-13.2" width="11.2" height="2" fill="#2a1d14"/><rect x="-1.2" y="-13.5" width="2.4" height="2.6" fill="#e0a93f"/>';
    g += '<path d="M-5 -20 L5 -20 L0 -16.5 Z" fill="#c8343c"/>';
    g += '<path d="M3.6 -25.5 L8.5 -28.5 L5 -23.5Z M-3.6 -25.5 L-7.5 -28 L-4.6 -23.5Z" fill="#eab894"/>';
    g += '<circle cx="0" cy="-24.5" r="4.6" fill="#f2c9a5"/><circle cx="2.6" cy="-23.4" r="1" fill="#e89a8a"/><circle cx="2" cy="-25.4" r="0.65" fill="#2a1d14"/>';
    g += '<g class="elf-hat"><path d="M-5 -27 Q -1 -37 9 -38.5 Q 4 -33 5.2 -27 Z" fill="' + (o.hat || '#c8343c') + '"/>';
    g += '<rect x="-5.6" y="-28.8" width="11.2" height="2.8" rx="1.4" fill="#f3e9d2"/><circle cx="9.4" cy="-38.4" r="1.9" fill="#f3e9d2"/></g>';
    if (o.gift) {
      g += gift(8, -10, 9, 8, o.gift, o.ribbon);
      g += '<circle cx="4.4" cy="-14" r="1.4" fill="#f2c9a5"/>';
    } else if (o.pull) {
      g += '<path d="M2 -17 L9 -14" stroke="#2f8f5b" stroke-width="2.2" stroke-linecap="round"/><circle cx="9.6" cy="-13.8" r="1.4" fill="#f2c9a5"/>';
    } else if (o.up) {
      g += '<path d="M2.5 -18 L7 -25 M-2.5 -18 L-7 -25" stroke="#2f8f5b" stroke-width="2.2" stroke-linecap="round"/><circle cx="7.4" cy="-25.8" r="1.4" fill="#f2c9a5"/><circle cx="-7.4" cy="-25.8" r="1.4" fill="#f2c9a5"/>';
    } else if (o.wave) {
      g += '<path d="M2.5 -18 L7 -25" stroke="#2f8f5b" stroke-width="2.2" stroke-linecap="round"/><circle cx="7.4" cy="-25.8" r="1.4" fill="#f2c9a5"/>';
    }
    g += '<rect x="-13" y="-44" width="28" height="48" fill="transparent"/>';   // палец промахивается — увеличиваем область нажатия
    return g + '</g></g>';
  }

  function sled(x, y) {
    return '<path d="M' + (x - 26) + ' ' + y + ' L' + (x + 20) + ' ' + y + ' Q' + (x + 28) + ' ' + y + ' ' + (x + 28) + ' ' + (y - 6) + '" stroke="#e0a93f" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      '<path d="M' + (x - 18) + ' ' + (y - 6) + ' L' + (x - 18) + ' ' + y + ' M' + (x + 14) + ' ' + (y - 6) + ' L' + (x + 14) + ' ' + y + '" stroke="#e0a93f" stroke-width="1.6"/>' +
      '<rect x="' + (x - 24) + '" y="' + (y - 9) + '" width="44" height="4" rx="1.5" fill="#7a4a2a"/>' +
      gift(x - 14, y - 9, 13, 12, '#b8323a') + gift(x + 1, y - 9, 14, 15, '#3f8a63', '#f2c970') + gift(x + 14, y - 9, 10, 9, '#3e5f94') +
      gift(x - 6, y - 24, 11, 10, '#e0a93f', '#b8323a') + gift(x + 7, y - 21, 8, 7, '#c8343c');
  }

  function snowman(x, y, s) {
    return '<g class="fun fun-snowman" data-fun="snowman">' +
      '<ellipse class="puddle" cx="' + x + '" cy="' + f1(y - 1) + '" rx="' + f1(17 * s) + '" ry="' + f1(4 * s) + '"/>' +
      '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><g class="sm-body">' +
      '<path d="M-7 -21 L-15 -27 M7 -21 L15 -28 M-13 -25.5 L-15 -23 M13 -26 L16 -24" stroke="#4a3426" stroke-width="1.2" stroke-linecap="round"/>' +
      '<circle cx="0" cy="-9" r="9.5" fill="#eaf0fa"/><circle cx="0" cy="-22" r="7" fill="#eaf0fa"/><circle cx="0" cy="-32.5" r="5" fill="#eaf0fa"/>' +
      '<path d="M-6 -27.5 Q 0 -25 6 -27.5 L6 -26 Q 0 -23.5 -6 -26 Z M3 -26.5 L5 -19 L7.5 -19.5 L5.5 -26.8Z" fill="#c8343c"/>' +
      '<circle cx="-1.8" cy="-33.5" r="0.8" fill="#1a1a1a"/><circle cx="1.8" cy="-33.5" r="0.8" fill="#1a1a1a"/>' +
      '<path d="M0 -32 L6 -31 L0 -30.6 Z" fill="#f08a2c"/>' +
      '<circle cx="0" cy="-21" r="0.9" fill="#1a1a1a"/><circle cx="0" cy="-17.5" r="0.9" fill="#1a1a1a"/><circle cx="0" cy="-12" r="0.9" fill="#1a1a1a"/>' +
      '</g><g class="sm-hat"><rect x="-6.5" y="-38" width="13" height="2" fill="#1a1a1a"/><rect x="-4.2" y="-45" width="8.4" height="7.5" fill="#1a1a1a"/><rect x="-4.2" y="-40" width="8.4" height="1.6" fill="#b8323a"/></g>' +
      '<rect x="-14" y="-48" width="28" height="50" fill="transparent"/>' +
      '</g></g>';
  }

  function deer(x, y, body, rudolph) {
    let g = '<g transform="translate(' + x + ' ' + y + ')"><g class="gallop" style="animation-delay:-' + f1((x % 7) / 10) + 's">';
    g += '<path d="M-10 3 L-19 8 M-7 4 L-14 11 M8 4 L16 10 M10 3 L19 6" stroke="' + body + '" stroke-width="2.4" stroke-linecap="round"/>';
    g += '<ellipse cx="0" cy="0" rx="13" ry="6" fill="' + body + '"/>';
    g += '<path d="M-12 -2 L-17 -5 L-15 0 Z" fill="#efe4d0"/>';
    g += '<path d="M8 -3 Q 12 -10 15 -14 L20 -11 Q 15 -6 12 1 Z" fill="' + body + '"/>';
    g += '<ellipse cx="19" cy="-13" rx="5.6" ry="3.6" fill="' + body + '"/>';
    g += '<path d="M16 -16 L14 -24 M15 -20 L11 -22 M14.4 -22.5 L12 -27 M18 -16 L19.5 -24 M18.8 -20 L22.5 -23" stroke="#d8b48a" stroke-width="1.3" stroke-linecap="round" fill="none"/>';
    g += '<path d="M15 -15 L10.5 -16.5 L13.5 -13 Z" fill="' + body + '"/>';
    g += '<circle cx="20" cy="-14.2" r="0.8" fill="#1a1010"/>';
    g += '<rect x="-2" y="-6" width="3" height="12" rx="1" fill="#b8323a"/><circle cx="-0.5" cy="6.5" r="1.4" fill="#f2c970"/>';
    if (rudolph) {
      g += '<circle class="nose-glow" cx="24.8" cy="-12.6" r="7" fill="#ff2e2e" filter="url(#soft)"/>' +
        '<circle cx="24.8" cy="-12.6" r="2.5" fill="#ff2a2a"/><circle cx="24.2" cy="-13.3" r="0.7" fill="#ffd2d2"/>';
    } else {
      g += '<circle cx="24.2" cy="-12.6" r="1.4" fill="#2a1a12"/>';
    }
    return g + '</g></g>';
  }

  // Санта в санях с мешком подарков и оленями, впереди Рудольф с красным носом.
  function santa() {
    return '<g class="santa fun" data-fun="santa"><g class="bob"><g transform="scale(0.55) rotate(-5)">' +
      '<rect x="-20" y="-60" width="230" height="100" fill="transparent"/>' +
      '<path class="wind" d="M-34 -4 H-14" stroke="#dfe7f4" stroke-width="1.6" stroke-linecap="round"/>' +
      '<path class="wind w2" d="M-40 10 H-12" stroke="#dfe7f4" stroke-width="1.6" stroke-linecap="round"/>' +
      '<path class="wind w3" d="M-30 24 H-12" stroke="#dfe7f4" stroke-width="1.6" stroke-linecap="round"/>' +
      '<path d="M55 -8 L88 -4 L94 -14 M88 -4 L126 -7 L132 -16 M126 -7 L165 -6" stroke="#e0a93f" stroke-width="0.9" fill="none"/>' +
      deer(96, -13, '#76533e') + deer(134, -15, '#76533e') +
      deer(90, -2, '#94664a') + deer(128, -4, '#94664a') + deer(167, -6, '#a06e4c', true) +
      '<path d="M-8 30 L56 30 Q 68 30 68 22 Q 68 17 63 18" stroke="#e0a93f" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
      '<path d="M8 22 L6 30 M44 22 L46 30" stroke="#e0a93f" stroke-width="2"/>' +
      '<path d="M-6 6 Q -14 -16 2 -26 Q 10 -30 16 -24 Q 26 -12 20 6 Z" fill="#8b5e3c"/>' +
      '<rect x="-2" y="-35" width="8" height="8" fill="#3f8a63"/><rect x="1" y="-35" width="2" height="8" fill="#f2c970"/>' +
      '<rect x="7" y="-37" width="7" height="9" fill="#e0a93f"/><rect x="9.6" y="-37" width="2" height="9" fill="#b8323a"/>' +
      '<path d="M0 -24 Q 6 -28 12 -25" stroke="#5b3a22" stroke-width="1.6" fill="none"/>' +
      '<path d="M22 8 Q 22 -12 33 -15 Q 44 -12 44 8 Z" fill="#c8343c"/><rect x="23" y="-2" width="21" height="3" fill="#2a1a12"/>' +
      '<path d="M40 -8 Q 48 -10 54 -8" stroke="#c8343c" stroke-width="4" stroke-linecap="round" fill="none"/><circle cx="55" cy="-8" r="2.2" fill="#2a1a12"/>' +
      '<circle cx="34" cy="-19" r="5" fill="#f2c9a5"/>' +
      '<path d="M28.5 -19 Q 29 -9 34.5 -8 Q 40 -9 40 -18 Q 37 -15 34 -15.5 Q 31 -15 28.5 -19Z" fill="#f6f1e6"/>' +
      '<path d="M29 -22 Q 33 -32 42 -31 Q 46 -30 47 -27 Q 42 -28 40 -23 Z" fill="#c8343c"/>' +
      '<circle cx="47.5" cy="-26.5" r="2" fill="#f6f1e6"/><rect x="28" y="-24.5" width="13" height="3" rx="1.5" fill="#f6f1e6"/>' +
      '<path d="M-6 4 L48 4 Q 58 4 60 -6 L66 -8 Q 66 22 46 22 L4 22 Q -8 22 -6 4 Z" fill="#b8323a"/>' +
      '<path d="M-5 9 L50 9 Q 60 8 63 -4" stroke="#e0a93f" stroke-width="1.4" fill="none"/>' +
      '</g></g></g>';
  }

  // Помощник стоит на дороге в просвете между зданиями дня i+1 и i+2 (i — номер по порядку с нуля).
  const DUMMY = { c: (x) => x, n: 0, sign: '', awning: ['#000', '#000'], wall: '#000', wall2: '#000', line: '#000', roof: '#000', door: '#000', white: '#000' };
  const halfW = (i) => BUILDERS[BUILDINGS[i % BUILDINGS.length].type](DUMMY).w / 2 * housePos(i).s;

  // Эльф на санках стоит на верхнем витке между домиками 22 и 23. По нажатию съезжает по всему серпантину.
  function sledElf() {
    const a = housePos(21), b = housePos(22);
    const x = f1(((a.x + halfW(21)) + (b.x - halfW(22))) / 2);
    const y = f1(roadY(4, x) + 2);
    return '<g class="fun fun-elf" data-fun="elf" data-trick="sled" data-x="' + x + '" data-y="' + y + '"><g class="sled-ride" transform="translate(' + x + ' ' + y + ') scale(-1 1)">' +
      '<path d="M-13 0 L10 0 Q15 0 15 -4" stroke="#e0a93f" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
      '<path d="M-8 -4 V0 M7 -4 V0" stroke="#e0a93f" stroke-width="1.2"/><rect x="-12" y="-6" width="22" height="3" rx="1.2" fill="#c8343c"/>' +
      elf(0, -5, 0.62, { up: true, hat: '#3e5f94' }).replace('class="fun fun-elf" data-fun="elf" data-trick="toss"', 'class="sled-elf"') +
      '<rect x="-16" y="-36" width="34" height="40" fill="transparent"/></g></g>';
  }

  // Эльфы на крышах, у самой трубы. Ныряют в трубу и выпрыгивают с подарком.
  function roofElves() {
    return [8, 14, 20].map((i) => {
      const p = housePos(i), b = BUILDINGS[i];
      const r = BUILDERS[b.type](DUMMY);
      if (!r.chim) return '';
      // эльф стоит на краю крыши рядом с трубой и смотрит на неё
      const [lx, ly] = b.type === 'cabin' ? [-20, -25.5] : [21, -28.5];
      const ex = f1(p.x + lx * p.s), ey = f1(p.y + ly * p.s);
      const cx = f1((r.chim[0] - lx) * p.s), cy = f1((r.chim[1] + 4 - ly) * p.s);
      return elf(ex, ey, 0.5 * p.s, { trick: 'chimney', flip: lx > 0, wave: i === 14, style: '--cx:' + cx + 'px;--cy:' + cy + 'px' });
    }).join('');
  }

  function mainTree() {
    const lay = layoutMainStreet(), leg = LEGS[MAIN_TREE.leg];
    return tree(lay.treeX, f1(roadY(MAIN_TREE.leg, lay.treeX) - 7 * leg.s), MAIN_TREE.h, true, 'disco');
  }

  function roadElf(i, o) {
    const a = housePos(i), b = housePos(i + 1);
    const dir = b.x > a.x ? 1 : -1;
    const x = f1(((a.x + dir * halfW(i)) + (b.x - dir * halfW(i + 1))) / 2);
    return elf(x, f1(roadY(Math.floor(i / 5), x) + 3), 0.8, o);
  }

  /* ---------- вся сцена ---------- */

  function sceneSVG() {
    const moon = { x: 302, y: 34 };
    let stars = '';
    for (let i = 0; i < 240; i++) {
      const x = -200 + rnd() * 760, y = i % 2 ? -320 + rnd() * 380 : -30 + rnd() * 120, r = 0.4 + rnd() * 1.1;
      if (Math.hypot(x - moon.x, y - moon.y) < 46) continue;
      stars += '<circle class="star" style="animation-delay:-' + f1(rnd() * 5) + 's;animation-duration:' + f1(1.6 + rnd() * 2.4) + 's"' +
        ' cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(r) + '"/>';
    }

    const road = roadPath();

    return '' +
      '<defs>' +
        '<linearGradient id="sky" x1="0" y1="-400" x2="0" y2="300" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#050b1a"/><stop offset="0.6" stop-color="#0d1a38"/><stop offset="1" stop-color="#22386a"/></linearGradient>' +
        '<linearGradient id="snowGrad" x1="0" y1="120" x2="0" y2="600" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#a9b9d6"/><stop offset="1" stop-color="#dfe7f4"/></linearGradient>' +
        '<linearGradient id="aurora" x1="0" y1="0" x2="0" y2="150" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#7cf5c4" stop-opacity="0"/><stop offset="0.5" stop-color="#5be3a6" stop-opacity="0.5"/><stop offset="1" stop-color="#3fb8c9" stop-opacity="0"/></linearGradient>' +
        '<radialGradient id="moonGlow"><stop offset="0.35" stop-color="#f6efd9" stop-opacity="0.35"/><stop offset="1" stop-color="#f6efd9" stop-opacity="0"/></radialGradient>' +
        '<radialGradient id="halo"><stop offset="0" stop-color="#ffd77a" stop-opacity="0.8"/><stop offset="0.45" stop-color="#f2b552" stop-opacity="0.3"/><stop offset="1" stop-color="#f2b552" stop-opacity="0"/></radialGradient>' +
        '<radialGradient id="pool"><stop offset="0" stop-color="#ffe08a" stop-opacity="0.7"/><stop offset="1" stop-color="#ffe08a" stop-opacity="0"/></radialGradient>' +
        '<filter id="winGlow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
        '<filter id="soft" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2.4"/></filter>' +
      '</defs>' +

      '<g aria-hidden="true">' +
        '<rect x="-400" y="-500" width="1160" height="900" fill="url(#sky)"/>' +
        '<g class="stars" fill="#f3e9d2">' + stars + '</g>' +
        '<g transform="translate(0 -100)">' +
          '<path d="M-220 128 C -70 40 60 150 180 76 C 280 22 380 96 580 40 L580 8 C 380 62 280 -12 180 42 C 60 116 -70 6 -220 92 Z" fill="url(#aurora)" opacity="0.55"/>' +
          '<path d="M-220 168 C -40 100 80 170 200 118 C 300 80 420 130 580 96 L580 78 C 420 112 300 60 200 98 C 80 150 -40 80 -220 148 Z" fill="url(#aurora)" opacity="0.3"/>' +
        '</g>' +
        '<circle cx="' + moon.x + '" cy="' + moon.y + '" r="56" fill="url(#moonGlow)"/>' +
        '<circle cx="' + moon.x + '" cy="' + moon.y + '" r="20" fill="#f6efd9"/>' +
        '<circle cx="' + (moon.x - 7) + '" cy="' + (moon.y - 4) + '" r="3.6" fill="#e6dec4"/><circle cx="' + (moon.x + 6) + '" cy="' + (moon.y + 7) + '" r="5" fill="#e6dec4"/><circle cx="' + (moon.x + 7) + '" cy="' + (moon.y - 8) + '" r="2.2" fill="#e6dec4"/>' +
        range([[-260, 120], [-140, 62], [-80, 92], [-10, 44], [60, 88], [120, 58], [182, 96], [240, 40], [300, 82], [372, 52], [440, 96], [520, 62], [640, 120]], '#22355c', '#c3cfe5', 200) +
        range([[-260, 140], [-130, 104], [-50, 124], [20, 84], [95, 118], [160, 92], [222, 122], [288, 88], [352, 118], [420, 96], [500, 124], [640, 110]], '#2f4672', '#d3ddef', 210) +
        santa() +
        '<path d="M-400 152 C -40 134 80 124 180 128 C 280 132 380 122 760 138 L760 1000 L-400 1000 Z" fill="url(#snowGrad)"/>' +

        // дорога-серпантин: тень, снежная обочина, полотно, разметка
        '<path d="' + road + '" transform="translate(0 3)" stroke="#7d8fb2" stroke-opacity="0.55" stroke-width="17" fill="none" stroke-linejoin="round"/>' +
        '<path d="' + road + '" stroke="#eef3fb" stroke-width="15" fill="none" stroke-linejoin="round"/>' +
        '<path d="' + road + '" stroke="#4a5878" stroke-width="11" fill="none" stroke-linejoin="round"/>' +
        '<path id="road-line" d="' + road + '" stroke="#f2c970" stroke-opacity="0.45" stroke-width="1" stroke-dasharray="4 7" fill="none"/>' +

        // ёлки за краями экрана (видны на широких экранах)
        tree(-30, 548, 50) + tree(-52, 400, 46) + tree(-34, 250, 36) +
        tree(394, 520, 48) + tree(412, 360, 42) + tree(392, 220, 34) +
        tree(-40, 305, 26) + tree(-44, 480, 30) + tree(-70, 340, 32) + tree(416, 292, 28) + tree(418, 468, 30) + tree(440, 400, 34) +
        // ёлки по углам карты
        tree(-32, 142, 18) + tree(-58, 168, 22) + tree(412, 176, 22) + tree(436, 150, 18) +
        tree(-26, 566, 28) + tree(392, 566, 26) +
        // ёлки на снегу под нижним витком дороги
        tree(128, 540, 18) + tree(340, 540, 18) +

        // главная ёлка в центре города, между домами
        mainTree() +

        // помощники Санты на дороге, в просветах между узкими зданиями. У каждого свой трюк.
        roadElf(3, { wave: true, trick: 'talk' }) +
        roadElf(7, { flip: true, gift: '#c8343c', ribbon: '#f2c970', trick: 'sneeze' }) +
        roadElf(10, { gift: '#3e5f94', trick: 'slip', hat: '#3f8a63' }) +
        roadElf(18, { wave: true, flip: true, trick: 'flip', hat: '#e0a93f' }) +

        // передний план: подарки, сани, помощники, ёлки, снеговик
        gift(12, 557, 12, 10, '#b8323a') + gift(25, 557, 9, 8, '#3f8a63', '#f2c970') + gift(18, 546, 8, 7, '#e0a93f', '#b8323a') +
        '<path d="M60 542 L78 546" stroke="#7a4a2a" stroke-width="1"/>' +
        elf(54, 557, 0.92, { flip: true, pull: true, trick: 'dance' }) +
        sled(100, 557) +
        elf(140, 557, 0.92, { flip: true, pull: true, trick: 'talk', hat: '#3e5f94' }) +
        tree(164, 560, 30) +
        tree(198, 560, 32) +
        gift(184, 559, 8, 7, '#b8323a') + gift(212, 559, 9, 8, '#3f8a63', '#f2c970') + gift(203, 560, 6, 5, '#3e5f94') +
        elf(234, 557, 0.92, { gift: '#3e5f94', ribbon: '#f2c970', trick: 'toss' }) +
        snowman(268, 558, 0.88) +
        tree(298, 560, 32) +
        elf(328, 557, 0.92, { flip: true, trick: 'snowball', hat: '#3f8a63' }) +
        tree(352, 562, 26) +
      '</g>' +

      // эльфы на крышах и на санках рисуются поверх домиков
      '<g id="houses"></g>' +
      '<g aria-hidden="true">' + roofElves() + sledElf() + '</g>' +
      '<g id="fx" pointer-events="none"></g>';
  }

  /* ---------- здания ---------- */

  // Какое здание стоит на месте каждого окошка, по порядку дней 1–25.
  //   type   вид здания: house, cafe, bank, townhouse, shop, cabin, bakery, church, post, hotel, townhall, workshop
  //   color  основной цвет стен
  //   sign   эмодзи в витрине (для кафе, магазинов, почты)
  //   awning цвета полосок навеса (для кафе и пекарни)
  const BUILDINGS = [
    { type: 'house', color: '#a8403a' },
    { type: 'cafe', color: '#2f6f6c', sign: '☕', awning: ['#b8323a', '#f3e9d2'] },
    { type: 'bank', color: '#b9ae98' },
    { type: 'townhouse', color: '#c4923f' },
    { type: 'shop', color: '#3e5f94', sign: '🎁' },
    { type: 'cabin', color: '#7a5236' },
    { type: 'bakery', color: '#c9a46a', sign: '🥨', awning: ['#a8403a', '#f3e9d2'] },
    { type: 'church', color: '#d9d0bd' },
    { type: 'house', color: '#4f7a4a' },
    { type: 'post', color: '#a33a36', sign: '✉️' },
    { type: 'townhouse', color: '#3e5f94' },
    { type: 'shop', color: '#6b3f5e', sign: '📚' },
    { type: 'hotel', color: '#8a6d4f' },
    { type: 'cafe', color: '#a85a3a', sign: '🍰', awning: ['#3f8a63', '#f3e9d2'] },
    { type: 'cabin', color: '#6a4a30' },
    { type: 'shop', color: '#2f6f6c', sign: '🧸' },
    { type: 'house', color: '#b39a74' },
    { type: 'townhall', color: '#7a4a6e' },
    { type: 'bakery', color: '#d98fa0', sign: '🍭', awning: ['#e0507a', '#f3e9d2'] },
    { type: 'townhouse', color: '#a8403a' },
    { type: 'house', color: '#3e5f94' },
    { type: 'cafe', color: '#4f7a4a', sign: '🍫', awning: ['#e0a93f', '#3a2a22'] },
    { type: 'shop', color: '#c4923f', sign: '🧣' },
    { type: 'house', color: '#7a4a6e' },
    { type: 'workshop', color: '#b8323a', sign: '🎅' }
  ];

  const BULBS = ['#ff5a5a', '#f2c970', '#6fd3ff', '#8ef0a8'];

  // Мелкие детали. Окна с классом win загораются по состоянию окошка (см. style.css).
  const win = (x, y, w, h) => '<rect class="win" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="1"/>';
  const arch = (x, y, w, h) => '<path class="win" d="M' + x + ' ' + (y + h) + ' V' + f1(y + w / 2) + ' A' + f1(w / 2) + ' ' + f1(w / 2) + ' 0 0 1 ' + f1(x + w) + ' ' + f1(y + w / 2) + ' V' + (y + h) + ' Z"/>';
  const cross = (k, x, y, w, h) => '<path d="M' + f1(x + w / 2) + ' ' + y + ' V' + (y + h) + ' M' + x + ' ' + f1(y + h / 2) + ' H' + (x + w) + '" stroke="' + k.line + '" stroke-width="0.9"/>';
  const snow = (x, y, w) => '<rect class="h-snow" x="' + (x - 1) + '" y="' + f1(y - 2.6) + '" width="' + (w + 2) + '" height="3.2" rx="1.6"/>' +
    '<circle class="h-snow" cx="' + f1(x + w * 0.28) + '" cy="' + f1(y + 0.7) + '" r="1.1"/><circle class="h-snow" cx="' + f1(x + w * 0.72) + '" cy="' + f1(y + 0.5) + '" r="0.9"/>';
  const drift = (w) => '<path class="h-snow" d="M' + f1(-w / 2 - 2) + ' 0.6 Q' + f1(-w / 4) + ' -3.4 -4 -0.4 L4 -0.4 Q' + f1(w / 4) + ' -3.4 ' + f1(w / 2 + 2) + ' 0.6 Z"/>';
  const door = (k, cx, w, h) => '<path d="M' + f1(cx - w / 2) + ' 0 V' + f1(-h + w / 2) + ' Q' + f1(cx - w / 2) + ' ' + (-h) + ' ' + cx + ' ' + (-h) + ' Q' + f1(cx + w / 2) + ' ' + (-h) + ' ' + f1(cx + w / 2) + ' ' + f1(-h + w / 2) + ' V0 Z" fill="' + k.door + '"/>';
  const wreath = (k, x, y, r) => '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="none" stroke="' + k.c('#3f8a63') + '" stroke-width="' + f1(r * 0.6) + '"/><circle cx="' + x + '" cy="' + f1(y + r) + '" r="' + f1(r * 0.38) + '" fill="' + k.c('#c8343c') + '"/>';
  const sign = (x, y, emoji, size) => '<text class="h-sign" x="' + x + '" y="' + y + '" font-size="' + size + '" text-anchor="middle" dominant-baseline="central">' + emoji + '</text>';

  function badge(k, x, y, r) {
    return '<circle class="win" cx="' + x + '" cy="' + y + '" r="' + r + '"/>' +
      '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="none" stroke="' + k.roof + '" stroke-width="1.3"/>' +
      '<text class="h-num" x="' + x + '" y="' + f1(y + 0.4) + '" font-size="' + (r >= 8 ? 12 : r >= 7 ? 11 : 10) + '" text-anchor="middle" dominant-baseline="central">' + k.n + '</text>';
  }

  // Гирлянда: провод с лампочками. Лампочки горят ярко только в открытых домиках.
  function garland(x1, x2, y, sag) {
    const n = Math.max(3, Math.round((x2 - x1) / 6));
    let s = '<path d="M' + x1 + ' ' + y + ' Q' + f1((x1 + x2) / 2) + ' ' + f1(y + sag * 2) + ' ' + x2 + ' ' + y + '" stroke="#24543a" stroke-width="0.8" fill="none"/>';
    for (let i = 1; i < n; i++) {
      const t = i / n;
      s += '<circle class="bulb b' + (i % 2) + '" cx="' + f1(x1 + (x2 - x1) * t) + '" cy="' + f1(y + 4 * sag * t * (1 - t) + 0.6) + '" r="1.15" fill="' + BULBS[i % 4] + '"/>';
    }
    return s;
  }

  // Двускатная крыша со снегом. cx — центр, hw — половина ширины, yb — карниз, ya — конёк.
  function gableRoof(k, cx, hw, yb, ya) {
    return '<path d="M' + (cx - hw) + ' ' + yb + ' L' + cx + ' ' + ya + ' L' + (cx + hw) + ' ' + yb + ' L' + (cx + hw - 6) + ' ' + yb + ' L' + cx + ' ' + f1(ya + 6.5) + ' L' + (cx - hw + 6) + ' ' + yb + ' Z" fill="' + k.roof + '"/>' +
      '<path class="h-snow" d="M' + (cx - hw - 1) + ' ' + f1(yb - 0.5) + ' L' + cx + ' ' + (ya - 1) + ' L' + (cx + hw + 1) + ' ' + f1(yb - 0.5) +
      ' Q' + f1(cx + hw - 1.5) + ' ' + (yb + 2) + ' ' + (cx + hw - 4) + ' ' + f1(yb - 0.2) + ' L' + cx + ' ' + f1(ya + 3.5) + ' L' + (cx - hw + 4) + ' ' + f1(yb - 0.2) +
      ' Q' + f1(cx - hw - 1.5) + ' ' + (yb + 2) + ' ' + (cx - hw - 1) + ' ' + f1(yb - 0.5) + ' Z"/>';
  }

  function awning(k, x1, x2, y, h, cols) {
    let s = '', i = 0;
    for (let x = x1; x < x2 - 0.1; x += 4, i++) {
      const w = Math.min(4, x2 - x), col = k.c(cols[i % 2]);
      s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + col + '"/><circle cx="' + f1(x + w / 2) + '" cy="' + (y + h) + '" r="' + f1(w / 2) + '" fill="' + col + '"/>';
    }
    return s + '<rect x="' + (x1 - 1) + '" y="' + (y - 1.5) + '" width="' + (x2 - x1 + 2) + '" height="2" fill="' + k.c('#3a2a22') + '"/>' + snow(x1, y - 1.5, x2 - x1);
  }

  function chimney(k, x, top, bottom) {
    return '<rect x="' + x + '" y="' + top + '" width="6" height="' + (bottom - top) + '" fill="' + k.roof + '"/>' + snow(x, top, 6);
  }

  // Каждое здание рисуется от точки у земли посередине. Возвращает рисунок, ширину, высоту и трубу (откуда идёт дымок).
  const BUILDERS = {
    house(k) {
      return {
        w: 52, h: 49, chim: [12, -50],
        svg: chimney(k, 9, -46, -34) +
          '<rect x="-18" y="-27" width="36" height="27" fill="' + k.wall + '"/>' +
          '<path d="M-18 -26.5 L0 -42 L18 -26.5 Z" fill="' + k.wall2 + '"/>' + gableRoof(k, 0, 25, -24, -48) +
          win(-14.5, -21, 8, 8.5) + win(6.5, -21, 8, 8.5) + cross(k, -14.5, -21, 8, 8.5) + cross(k, 6.5, -21, 8, 8.5) +
          snow(-14.5, -12.2, 8) + snow(6.5, -12.2, 8) +
          door(k, 0, 7.6, 13.4) + wreath(k, 0, -9.4, 2) +
          garland(-18, 18, -25.6, 2.2) + badge(k, 0, -32.6, 8.6) + drift(36)
      };
    },

    cafe(k) {
      return {
        w: 46, h: 37, chim: null,
        svg: '<rect x="-21" y="-34" width="42" height="34" fill="' + k.wall + '"/>' +
          '<rect x="-23" y="-36.5" width="46" height="3" fill="' + k.c('#3a2a22') + '"/>' + snow(-23, -36.5, 46) +
          win(-18, -30, 8, 7) + win(10, -30, 8, 7) + cross(k, -18, -30, 8, 7) + cross(k, 10, -30, 8, 7) +
          garland(-21, 21, -33, 1.6) + badge(k, 0, -25.5, 7.6) +
          awning(k, -21, 21, -16.5, 4.5, k.awning) +
          win(-18, -9.5, 17, 8.5) + sign(-9.5, -5.2, k.sign, 6.5) +
          door(k, 9, 7, 10) + wreath(k, 9, -6.6, 1.6) +
          '<path d="M17.5 -11 L14.5 -2.5 L20.5 -2.5 Z" fill="' + k.c('#1d4a45') + '"/><rect x="15.6" y="-2.6" width="3.8" height="2.6" fill="' + k.c('#7a4a2a') + '"/>' +
          drift(42)
      };
    },

    bank(k) {
      const cols = [-15, -5, 5, 15].map((x) =>
        '<rect x="' + (x - 1.8) + '" y="-33" width="3.6" height="27.5" fill="' + k.white + '"/><rect x="' + (x - 2.6) + '" y="-34.4" width="5.2" height="1.6" fill="' + k.white + '"/>' +
        '<ellipse cx="' + (x - 1.1) + '" cy="-31" rx="1.2" ry="0.8" fill="' + k.c('#c8343c') + '"/><ellipse cx="' + (x + 1.1) + '" cy="-31" rx="1.2" ry="0.8" fill="' + k.c('#c8343c') + '"/>').join('');
      return {
        w: 48, h: 54, chim: null,
        svg: '<rect x="-23" y="-3" width="46" height="3" fill="' + k.white + '"/><rect x="-21" y="-5.6" width="42" height="2.8" fill="' + k.c('#cfc8b8') + '"/>' +
          '<rect x="-19" y="-34" width="38" height="28.5" fill="' + k.wall + '"/>' +
          win(-12.5, -26, 5, 13) + win(7.5, -26, 5, 13) + '<rect x="-2.6" y="-18" width="5.2" height="12.4" fill="' + k.door + '"/>' + cols +
          '<rect x="-22" y="-37.6" width="44" height="3.6" fill="' + k.white + '"/>' +
          '<path d="M-22 -37.5 L0 -53 L22 -37.5 Z" fill="' + k.wall2 + '"/>' +
          '<path class="h-snow" d="M-23.5 -37.2 L0 -54.2 L23.5 -37.2 L20 -37.6 L0 -51 L-20 -37.6 Z"/>' +
          garland(-22, 22, -35.6, 2) + wreath(k, 0, -21.4, 2) + badge(k, 0, -43.4, 7.2) + drift(44)
      };
    },

    townhouse(k) {
      const steps = [[-16, -38, 4], [-12, -43, 4], [-8, -48, 4], [-4, -52, 8], [4, -48, 4], [8, -43, 4], [12, -38, 4]]
        .map(([x, y, w]) => snow(x, y, w)).join('');
      const box = (x, y) => '<rect x="' + (x - 0.5) + '" y="' + y + '" width="8" height="2" rx="1" fill="' + k.c('#2c6a3a') + '"/><circle cx="' + (x + 1.6) + '" cy="' + (y + 0.6) + '" r="0.7" fill="' + k.c('#c8343c') + '"/><circle cx="' + (x + 5.4) + '" cy="' + (y + 0.8) + '" r="0.7" fill="' + k.c('#c8343c') + '"/>';
      return {
        w: 34, h: 53, chim: null,
        svg: '<rect x="-16" y="-34.5" width="32" height="34.5" fill="' + k.wall + '"/>' +
          '<path d="M-16 -34 V-38 H-12 V-43 H-8 V-48 H-4 V-52 H4 V-48 H8 V-43 H12 V-38 H16 V-34 Z" fill="' + k.wall2 + '"/>' + steps +
          win(-12, -30, 7, 8) + win(5, -30, 7, 8) + cross(k, -12, -30, 7, 8) + cross(k, 5, -30, 7, 8) + box(-12, -22) + box(5, -22) +
          win(-12.5, -15, 7, 8) + win(5.5, -15, 7, 8) + cross(k, -12.5, -15, 7, 8) + cross(k, 5.5, -15, 7, 8) +
          door(k, 0, 6.4, 12) + wreath(k, 0, -8.4, 1.8) +
          garland(-16, 16, -33.6, 1.8) + badge(k, 0, -41.4, 7) + drift(32)
      };
    },

    shop(k) {
      return {
        w: 46, h: 44, chim: null,
        svg: '<rect x="-20" y="-32" width="40" height="32" fill="' + k.wall + '"/>' +
          '<path d="M-23 -31 L-17 -42 L17 -42 L23 -31 Z" fill="' + k.roof + '"/>' + snow(-17, -42, 34) +
          '<path class="h-snow" d="M-23.5 -31 L-21 -35.5 L-19 -33 L-17 -36 L17 -36 L19 -33 L21 -35.5 L23.5 -31 Z" opacity="0.9"/>' +
          '<rect x="-18" y="-29.5" width="36" height="8" rx="1" fill="' + k.c('#2a1d14') + '"/>' +
          '<circle cx="-13" cy="-25.5" r="0.9" fill="#f2c970"/><circle cx="13" cy="-25.5" r="0.9" fill="#f2c970"/>' +
          garland(-20, 20, -20.4, 1.8) +
          win(-17, -17.5, 18, 12.5) + sign(-8, -11.2, k.sign, 8) +
          door(k, 11, 7, 15) + wreath(k, 11, -10.4, 1.8) +
          badge(k, 0, -29, 7.4) + drift(40)
      };
    },

    cabin(k) {
      let logs = '';
      [-20, -16, -12, -8, -4].forEach((y) => {
        logs += '<path d="M-19 ' + y + ' H19" stroke="' + k.line + '" stroke-width="0.7"/>';
        logs += '<circle cx="-19" cy="' + (y + 2) + '" r="1.7" fill="' + k.c('#b88a5a') + '"/><circle cx="19" cy="' + (y + 2) + '" r="1.7" fill="' + k.c('#b88a5a') + '"/>';
      });
      const sh = (x) => '<rect x="' + x + '" y="-19" width="2" height="7" fill="' + k.c('#a8403a') + '"/>';
      return {
        w: 50, h: 46, chim: [-11, -46],
        svg: '<rect x="-14" y="-42" width="6" height="14" fill="' + k.c('#6b6f7a') + '"/>' + snow(-14, -42, 6) +
          '<rect x="-19" y="-24" width="38" height="24" fill="' + k.wall + '"/>' + logs +
          '<path d="M-19 -23 L0 -40 L19 -23 Z" fill="' + k.wall2 + '"/>' + gableRoof(k, 0, 25, -21, -44) +
          win(-14.5, -19, 7, 7) + win(7.5, -19, 7, 7) + cross(k, -14.5, -19, 7, 7) + cross(k, 7.5, -19, 7, 7) +
          sh(-16.6) + sh(-7.4) + sh(5.4) + sh(14.6) +
          door(k, 0, 7, 13) + wreath(k, 0, -8.6, 2) + '<circle class="win" cx="6" cy="-13" r="1.3"/>' +
          garland(-19, 19, -22.6, 1.8) + badge(k, 0, -30.4, 7.2) + drift(38)
      };
    },

    bakery(k) {
      return {
        w: 46, h: 47, chim: [10.5, -50],
        svg: chimney(k, 7.5, -46, -36) +
          '<rect x="-19" y="-30" width="38" height="30" fill="' + k.wall + '"/>' +
          '<path d="M-19 -29.5 L0 -43 L19 -29.5 Z" fill="' + k.wall2 + '"/>' + gableRoof(k, 0, 23, -28, -47) +
          badge(k, 0, -34.2, 6.8) +
          awning(k, -19, 19, -24, 4.5, k.awning) +
          win(-16, -15.5, 18, 10.5) + sign(-7, -10.2, k.sign, 7.5) +
          door(k, 10, 7, 13) + wreath(k, 10, -8.6, 1.8) +
          '<path d="M16.6 0 V-7.6 Q16.6 -10.4 19 -10.4 Q21.4 -10.4 21.4 -8" stroke="' + k.white + '" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
          '<path d="M16.6 0 V-7.6 Q16.6 -10.4 19 -10.4 Q21.4 -10.4 21.4 -8" stroke="' + k.c('#c8343c') + '" stroke-width="1.6" fill="none" stroke-dasharray="1.4 1.6"/>' +
          drift(38)
      };
    },

    church(k) {
      return {
        w: 36, h: 56, chim: null,
        svg: '<rect x="-15" y="-26" width="30" height="26" fill="' + k.wall + '"/>' + gableRoof(k, 0, 18, -24, -35) +
          '<rect x="-7" y="-42" width="14" height="18" fill="' + k.wall2 + '"/>' +
          '<rect x="-8" y="-43.4" width="16" height="1.8" fill="' + k.roof + '"/>' +
          '<path d="M-8 -43 L0 -54 L8 -43 Z" fill="' + k.roof + '"/>' +
          '<path class="h-snow" d="M-8.6 -43 L0 -54.6 L8.6 -43 L5.6 -43.2 L0 -50.4 L-5.6 -43.2 Z"/>' + star(0, -56.4, 2.6) +
          arch(-12.5, -20, 4.5, 11) + arch(8, -20, 4.5, 11) +
          door(k, 0, 6, 12) + wreath(k, 0, -8, 1.8) +
          garland(-15, -7, -24.6, 1.2) + garland(7, 15, -24.6, 1.2) +
          badge(k, 0, -33.6, 6.4) + drift(30)
      };
    },

    post(k) {
      return {
        w: 48, h: 41, chim: null,
        svg: '<rect x="-22" y="-31" width="44" height="31" fill="' + k.wall + '"/>' +
          '<path d="M-23 -30.5 H-8 Q0 -37.5 8 -30.5 H23 V-33.5 H8 Q0 -40.5 -8 -33.5 H-23 Z" fill="' + k.c('#3a2a22') + '"/>' +
          '<path class="h-snow" d="M-24 -33.2 H-8 Q0 -40.2 8 -33.2 H24 V-35.6 H8 Q0 -42.6 -8 -35.6 H-24 Z"/>' +
          garland(-22, -9, -29.6, 1.4) + garland(9, 22, -29.6, 1.4) +
          arch(-19, -24, 8, 14) + arch(11, -24, 8, 14) + cross(k, 11, -20, 8, 10) + sign(-15, -14.6, k.sign, 6) +
          door(k, 0, 8, 13) + wreath(k, 0, -8.6, 2) +
          badge(k, 0, -23.4, 7.2) + drift(44)
      };
    },

    hotel(k) {
      let w = '';
      [[-43, [-16, 10]], [-32, [-16, -3, 10]], [-21, [-16, 10]]].forEach(([y, xs]) => {
        xs.forEach((x) => { w += win(x, y, 6, 7) + cross(k, x, y, 6, 7); });
      });
      return {
        w: 44, h: 58, chim: null,
        svg: '<rect x="-20" y="-47" width="40" height="47" fill="' + k.wall + '"/>' +
          '<rect x="-22" y="-49.4" width="44" height="2.6" fill="' + k.c('#3a2a22') + '"/>' + snow(-22, -49.4, 44) +
          w + garland(-20, 20, -36.4, 1.8) + garland(-20, 20, -25.4, 1.8) + wreath(k, 0, -17.6, 2.4) +
          '<rect x="-6.5" y="-14.2" width="13" height="2.6" rx="1" fill="' + k.c('#b8323a') + '"/>' + snow(-6.5, -14.2, 13) +
          '<rect x="-3.5" y="-11.6" width="7" height="11.6" fill="' + k.door + '"/>' +
          win(-17, -11, 7, 7) + win(10, -11, 7, 7) +
          badge(k, 0, -50.4, 7.4) + drift(40)
      };
    },

    townhall(k) {
      return {
        w: 50, h: 55, chim: null,
        svg: '<rect x="-22" y="-24" width="44" height="24" fill="' + k.wall + '"/>' +
          '<path d="M-24 -23 L-18 -31 L18 -31 L24 -23 Z" fill="' + k.roof + '"/>' + snow(-18, -31, 36) +
          '<rect x="-7" y="-44" width="14" height="22" fill="' + k.wall2 + '"/>' +
          '<path d="M-8.6 -43.6 L0 -54 L8.6 -43.6 Z" fill="' + k.roof + '"/>' +
          '<path class="h-snow" d="M-9.2 -43.4 L0 -54.6 L9.2 -43.4 L6 -43.6 L0 -50.6 L-6 -43.6 Z"/>' +
          arch(-19, -18, 5, 10) + arch(-12.5, -18, 5, 10) + arch(7.5, -18, 5, 10) + arch(14, -18, 5, 10) +
          door(k, 0, 7, 13) + wreath(k, 0, -27, 2.2) +
          garland(-22, -7, -22.6, 1.4) + garland(7, 22, -22.6, 1.4) +
          badge(k, 0, -36.4, 6.6) + drift(44)
      };
    },

    workshop(k) {
      const cane = (x) => '<rect x="' + x + '" y="-17" width="2.6" height="17" fill="' + k.white + '"/>' +
        '<path d="M' + f1(x + 1.3) + ' -17 V0" stroke="' + k.c('#c8343c') + '" stroke-width="2.6" stroke-dasharray="1.6 1.8"/>';
      return {
        w: 56, h: 60, chim: [16, -54],
        svg: chimney(k, 13, -50, -37) +
          '<rect x="-24" y="-28" width="48" height="28" fill="' + k.wall + '"/>' +
          '<path d="M-24 -27.5 L0 -46 L24 -27.5 Z" fill="' + k.wall2 + '"/>' + gableRoof(k, 0, 28, -25, -50) +
          '<rect x="-24" y="-28" width="48" height="2" fill="' + k.white + '"/>' +
          win(-21, -22, 9, 9) + win(12, -22, 9, 9) + cross(k, 12, -22, 9, 9) + sign(-16.5, -17.5, k.sign, 7) +
          snow(-21, -13, 9) + snow(12, -13, 9) +
          '<rect x="-7" y="-17" width="14" height="17" fill="' + k.c('#5a3320') + '"/><path d="M0 -17 V0" stroke="' + k.line + '" stroke-width="0.8"/>' +
          cane(-10) + cane(7.4) + wreath(k, 0, -12, 2.6) +
          garland(-24, 24, -27, 2.4) + badge(k, 0, -35.4, 8.6) + star(0, -55, 5.5) + drift(48)
      };
    }
  };

  /* ---------- домик ---------- */

  // o: { i, n, kind ('is-locked' | 'is-ready' | 'is-open'), today, solved, fresh, label }
  function house(o) {
    const p = housePos(o.i);
    const b = BUILDINGS[(o.n - 1) % BUILDINGS.length];
    const locked = o.kind === 'is-locked', open = o.kind === 'is-open';
    // Чем меньше света, тем темнее краски: будущие домики почти сливаются с ночью.
    const t = locked ? 0.6 : o.kind === 'is-ready' ? 0.2 : 0;
    const c = (hex) => mix(hex, NIGHT, t);
    const k = {
      n: o.n, c, sign: b.sign || '', awning: b.awning || ['#b8323a', '#f3e9d2'],
      wall: c(b.color), wall2: c(mix(b.color, NIGHT, 0.12)), line: c(mix(b.color, NIGHT, 0.45)),
      roof: locked ? '#2a2230' : '#4a2e2a', door: locked ? '#16121c' : '#4a2a1a', white: c('#efe8da')
    };
    const r = BUILDERS[b.type](k);
    const w = r.w, h = r.h;

    let g = '<g class="house ' + o.kind + (o.today ? ' is-today' : '') + (o.fresh ? ' just-lit' : '') + '" data-day="' + o.n +
      '" role="button" tabindex="0" aria-label="' + o.label + '" transform="translate(' + p.x + ' ' + p.y + ') scale(' + p.s + ')"><g class="hb">';
    g += '<ellipse class="h-halo" cx="0" cy="' + f1(-h * 0.45) + '" rx="' + f1(w * 0.92) + '" ry="' + f1(h * 0.74) + '" fill="url(#halo)"/>';
    g += '<ellipse class="h-pool" cx="0" cy="3" rx="' + f1(w * 0.6) + '" ry="6" fill="url(#pool)"/>';
    if (open && r.chim) {
      g += '<circle class="puff" cx="' + r.chim[0] + '" cy="' + r.chim[1] + '" r="2.4"/><circle class="puff p2" cx="' + r.chim[0] + '" cy="' + r.chim[1] + '" r="2.4"/>';
    }
    g += r.svg;

    if (o.solved) {
      g += '<g transform="translate(' + f1(w / 2 - 4) + ' ' + f1(-h + 10) + ')"><circle r="5.6" fill="#3f8a63" stroke="#0f1b31" stroke-width="1.4"/>' +
        '<path d="M-2.6 0.2 L-0.6 2.2 L2.8 -1.8" stroke="#f3e9d2" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>';
    }
    g += '<rect class="hit" x="' + f1(-w / 2 - 3) + '" y="' + f1(-h - 4) + '" width="' + (w + 6) + '" height="' + (h + 10) + '" rx="8" fill="transparent"/>';
    return g + '</g></g>';
  }

  /* ---------- приколюхи: что происходит, если нажать на Санту, эльфа, ёлку или снеговика ---------- */

  const SVGNS = 'http://www.w3.org/2000/svg';
  function addSVG(parent, html, cls) {
    const g = document.createElementNS(SVGNS, 'g');
    if (cls) g.setAttribute('class', cls);
    g.innerHTML = html;
    parent.appendChild(g);
    return g;
  }
  // Повесить класс с анимацией на время ms, потом снять
  function play(el, cls, ms, then) {
    el.classList.remove(cls);
    el.getBoundingClientRect();
    el.classList.add(cls);
    setTimeout(() => { el.classList.remove(cls); if (then) then(); }, ms);
  }

  const escT = (t) => String(t).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const center = (b) => [b.x + b.width / 2, b.y];
  const later = (ms, fn) => setTimeout(fn, ms);

  // Облачко с репликой над героем
  function bubble(fx, x, y, text, ms) {
    const w = f1(Math.max(28, text.length * 4.4 + 12));
    const bx = Math.min(Math.max(x, w / 2 + 2), W - w / 2 - 2);
    const g = addSVG(fx, '<g transform="translate(' + f1(bx) + ' ' + f1(y) + ')"><g class="bubble">' +
      '<rect x="' + f1(-w / 2) + '" y="-16" width="' + w + '" height="13" rx="6.5" fill="#fffdf6"/>' +
      '<path d="M' + f1(x - bx - 3) + ' -3.5 L' + f1(x - bx) + ' 1 L' + f1(x - bx + 3) + ' -3.5 Z" fill="#fffdf6"/>' +
      '<text x="0" y="-9.3" text-anchor="middle" dominant-baseline="central">' + escT(text) + '</text></g></g>');
    later(ms || 2200, () => g.remove());
  }

  // Плавное движение по траектории: fn(t) получает t от 0 до 1
  function tween(ms, fn, done) {
    const t0 = performance.now();
    const step = (now) => {
      const t = Math.min(1, Math.max(0, (now - t0) / ms));   // первый кадр бывает чуть раньше t0
      fn(t);
      if (t < 1) requestAnimationFrame(step); else if (done) done();
    };
    requestAnimationFrame(step);
  }

  function sparkles(fx, x, y, n, emoji) {
    let h = '';
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, d = 10 + Math.random() * 8;
      h += '<text class="spark" x="' + f1(x) + '" y="' + f1(y) + '" style="--dx:' + f1(Math.cos(a) * d) + 'px;--dy:' + f1(Math.sin(a) * d) + 'px;animation-delay:' + (i * 0.04).toFixed(2) + 's">' + (emoji || '✦') + '</text>';
    }
    const g = addSVG(fx, h);
    later(1400, () => g.remove());
  }

  const PHRASES = ['Happy Christmas!', 'Fancy a cuppa?', 'Brr, it’s nippy!', 'Wrap up warm!', 'Chuffed to bits!', 'Lovely!', 'Tuck in!', 'Cheers, mate!', 'Mince pie, anyone?', '’Tis the season!'];
  let phraseN = 0;

  const ELF = {
    toss(el, fx) {
      const b = el.getBBox();
      const c = [['#c8343c', '#f2c970'], ['#3e5f94', '#f3e9d2'], ['#3f8a63', '#f2c970'], ['#e0a93f', '#b8323a']][Math.floor(Math.random() * 4)];
      const toss = addSVG(fx, '<g transform="translate(' + f1(b.x + b.width / 2) + ' ' + f1(b.y + 6) + ')"><g class="toss">' + gift(0, 0, 10, 9, c[0], c[1]) + '</g></g>');
      play(el, 'hop', 1300, () => toss.remove());
      return 1300;
    },
    flip(el, fx) {
      const [x, y] = center(el.getBBox());
      play(el, 'flip', 1200);
      later(900, () => sparkles(fx, x, y + 14, 6));
      later(1000, () => bubble(fx, x, y, 'Ta-da!', 1300));
      return 1300;
    },
    dance(el, fx) {
      const [x, y] = center(el.getBBox());
      play(el, 'dance', 2400);
      const g = addSVG(fx, ['♪', '♫', '♪', '♬'].map((n, i) => '<text class="note" x="' + f1(x + (i % 2 ? 6 : -6)) + '" y="' + f1(y + 8) + '" style="animation-delay:' + (i * 0.45) + 's">' + n + '</text>').join(''));
      later(2600, () => g.remove());
      return 2400;
    },
    talk(el, fx, say) {
      const [x, y] = center(el.getBBox());
      const text = PHRASES[phraseN++ % PHRASES.length];
      play(el, 'nod', 800);
      bubble(fx, x, y, text, 2400);
      say(text);
      return 2400;
    },
    sneeze(el, fx) {
      const [x, y] = center(el.getBBox());
      play(el, 'sneeze', 1600);
      later(250, () => bubble(fx, x, y - 4, 'A-a-achoo!', 1300));
      return 1600;
    },
    slip(el, fx) {
      const b = el.getBBox();
      play(el, 'slip', 2400);
      later(500, () => {
        const g = addSVG(fx, '<g transform="translate(' + f1(b.x + b.width / 2 + 12) + ' ' + f1(b.y + b.height - 8) + ')"><text class="dizzy">💫</text></g>');
        later(1500, () => g.remove());
      });
      later(1900, () => bubble(fx, b.x + b.width / 2, b.y, 'Oops! Icy!', 1200));
      return 2400;
    },
    // Снежок летит в снеговика: шлёп!
    snowball(el, fx) {
      const b = el.getBBox();
      const target = document.querySelector('.fun-snowman');
      const tb = target.getBBox();
      const x0 = b.x + 2, y0 = b.y + 14, x1 = tb.x + tb.width / 2, y1 = tb.y + tb.height * 0.45;
      play(el, 'throw', 600);
      const ball = addSVG(fx, '<circle r="2.6" fill="#ffffff" stroke="#c9d3e6" stroke-width="0.6"/>');
      later(200, () => tween(700, (t) => {
        const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t - Math.sin(Math.PI * t) * 26;
        ball.setAttribute('transform', 'translate(' + f1(x) + ' ' + f1(y) + ')');
      }, () => {
        ball.remove();
        let splat = '';
        for (let i = 0; i < 9; i++) {
          const a = Math.random() * Math.PI * 2, d = 4 + Math.random() * 6;
          splat += '<circle class="splat" cx="' + f1(x1) + '" cy="' + f1(y1) + '" r="' + f1(0.8 + Math.random()) + '" style="--dx:' + f1(Math.cos(a) * d) + 'px;--dy:' + f1(Math.sin(a) * d) + 'px"/>';
        }
        const g = addSVG(fx, splat);
        later(700, () => g.remove());
        if (!target.classList.contains('melt') && !target.classList.contains('reform')) play(target, 'hit', 600);
        bubble(fx, x1, tb.y + 2, 'Splat!', 1100);
      }));
      return 1400;
    },
    // Ныряет в трубу и выпрыгивает с подарком
    chimney(el, fx) {
      const [x, y] = center(el.getBBox());
      play(el, 'dive', 2600);
      later(2100, () => bubble(fx, x, y - 4, 'Delivered!', 1300));
      return 2600;
    },
    // Съезжает на санках по всему серпантину
    sled(el, fx) {
      const road = document.getElementById('road-line');
      const ride = el.querySelector('.sled-ride');
      const L = road.getTotalLength();
      const x0 = +el.dataset.x, y0 = +el.dataset.y;
      let s0 = 0, best = 1e9;
      for (let l = 0; l <= L; l += 2) {
        const p = road.getPointAtLength(l), d = (p.x - x0) ** 2 + (p.y - y0) ** 2;
        if (d < best) { best = d; s0 = l; }
      }
      bubble(fx, x0, y0 - 26, 'Wheeee!', 1400);
      const ms = 9000;
      tween(ms, (t) => {
        const len = Math.max(0, s0 - (s0 + 10) * Math.pow(t, 1.5));
        const p = road.getPointAtLength(len), q = road.getPointAtLength(Math.max(0, len - 6));
        let mx = q.x - p.x, my = q.y - p.y;
        if (Math.abs(mx) + Math.abs(my) < 0.01) { mx = -1; my = 0.3; }
        const left = mx < 0;
        let ang = Math.atan2(my, left ? -mx : mx) * 180 / Math.PI;
        ang = Math.max(-40, Math.min(40, ang));
        ride.setAttribute('transform', 'translate(' + f1(p.x) + ' ' + f1(p.y + 2) + ') scale(' + (left ? -1 : 1) + ' 1) rotate(' + f1(left ? ang : ang) + ')');
      }, () => {
        el.classList.add('gone');
        later(900, () => {
          ride.setAttribute('transform', 'translate(' + x0 + ' ' + y0 + ') scale(-1 1)');
          el.classList.remove('gone');
          bubble(fx, x0, y0 - 26, 'Again!', 1200);
        });
      });
      return ms + 1200;
    }
  };

  const TREE = {
    shake(el, fx) {
      const b = el.getBBox();
      let flakes = '';
      for (let i = 0; i < 16; i++) {
        const x = b.x + b.width * (0.12 + Math.random() * 0.76);
        const y = b.y + b.height * (0.05 + Math.random() * 0.7);
        flakes += '<circle class="drop" cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(0.8 + Math.random() * 1.6) +
          '" style="--fall:' + f1(b.y + b.height - y + 2) + 'px;animation-delay:' + (Math.random() * 0.25).toFixed(2) + 's"/>';
      }
      const snow = addSVG(fx, flakes);
      el.classList.add('shook');
      later(1800, () => snow.remove());
      later(6000, () => el.classList.remove('shook'));
      return 6000;
    },
    // Из ёлки вылетает малиновка (robin — символ британского Рождества)
    robin(el, fx) {
      const b = el.getBBox();
      const x0 = b.x + b.width / 2, y0 = b.y + b.height * 0.45;
      const dir = x0 > W / 2 ? -1 : 1;
      const bird = addSVG(fx, '<g class="robin"><path class="wing" d="M-1 -1 Q-6 -8 -9 -3 Q-5 -1 -1 1 Z" fill="#6b4a32"/>' +
        '<ellipse cx="0" cy="0" rx="5.5" ry="4.2" fill="#7a5a3c"/><circle cx="2.2" cy="0.8" r="3" fill="#e0602a"/>' +
        '<circle cx="4.6" cy="-2.4" r="2.6" fill="#7a5a3c"/><circle cx="5.4" cy="-2.8" r="0.6" fill="#111"/><path d="M7 -2.6 L9.4 -2 L7 -1.6 Z" fill="#e0a93f"/>' +
        '<path d="M-5 0 L-9 2 L-8 -1 Z" fill="#6b4a32"/></g>');
      play(el, 'rustle', 500);
      bubble(fx, x0, b.y, 'Tweet-tweet!', 1500);
      tween(3200, (t) => {
        const x = x0 + dir * t * 200, y = y0 - t * 120 - Math.sin(t * Math.PI * 6) * 4;
        bird.setAttribute('transform', 'translate(' + f1(x) + ' ' + f1(y) + ') scale(' + dir + ' 1)');
      }, () => bird.remove());
      return 3300;
    },
    // Ёлка сама наряжается: гирлянда зажигается и мигает
    lights(el, fx) {
      const b = el.getBBox();
      const cols = ['#ff5a5a', '#f2c970', '#6fd3ff', '#8ef0a8', '#ff8fd0'];
      let h = '';
      [0.3, 0.52, 0.74].forEach((fy, row) => {
        const y = b.y + b.height * fy, hw = b.width * (0.16 + fy * 0.36);
        for (let i = 0; i < 5; i++) {
          const t = i / 4, x = b.x + b.width / 2 - hw + 2 * hw * t;
          h += '<circle class="garl" cx="' + f1(x) + '" cy="' + f1(y + Math.sin(t * Math.PI) * 2.5) + '" r="' + f1(Math.max(1, b.width * 0.035)) + '" fill="' + cols[(i + row) % 5] +
            '" style="animation-delay:' + ((row * 5 + i) * 0.06).toFixed(2) + 's,' + ((row * 5 + i) * 0.06 + 0.4).toFixed(2) + 's"/>';
        }
      });
      h += star(b.x + b.width / 2, b.y - 1, Math.max(2.5, b.width * 0.12)).replace('<path', '<path class="garl-star"');
      const g = addSVG(fx, h);
      later(5200, () => g.remove());
      return 5200;
    },
    // В ветках прячется сова: моргает и ухает
    owl(el, fx) {
      const b = el.getBBox();
      const x = b.x + b.width / 2, y = b.y + b.height * 0.5, r = Math.max(2.2, b.width * 0.09);
      const g = addSVG(fx, '<g class="owl" transform="translate(' + f1(x) + ' ' + f1(y) + ')">' +
        '<circle cx="' + f1(-r * 1.1) + '" r="' + f1(r) + '" fill="#f6efd9"/><circle cx="' + f1(r * 1.1) + '" r="' + f1(r) + '" fill="#f6efd9"/>' +
        '<circle cx="' + f1(-r * 1.1) + '" r="' + f1(r * 0.5) + '" fill="#1a1a1a"/><circle cx="' + f1(r * 1.1) + '" r="' + f1(r * 0.5) + '" fill="#1a1a1a"/>' +
        '<path d="M-1 ' + f1(r * 0.8) + ' L0 ' + f1(r * 1.6) + ' L1 ' + f1(r * 0.8) + ' Z" fill="#e0a93f"/></g>');
      later(500, () => bubble(fx, x, b.y, 'Twit-twoo!', 1600));
      later(2600, () => g.remove());
      return 2700;
    },
    // Ёлка подпрыгивает и вытягивается, на макушке вспыхивает звезда
    grow(el, fx) {
      const b = el.getBBox();
      play(el, 'boing', 1100);
      later(400, () => sparkles(fx, b.x + b.width / 2, b.y - 4, 7, '★'));
      return 1200;
    },
    // Из-под ёлки разлетаются подарки
    presents(el, fx) {
      const b = el.getBBox();
      const x = b.x + b.width / 2, y = b.y + b.height;
      const c = [['#c8343c', '#f2c970'], ['#3e5f94', '#f3e9d2'], ['#e0a93f', '#b8323a']];
      const g = addSVG(fx, c.map((cc, i) => '<g transform="translate(' + f1(x) + ' ' + f1(y) + ')"><g class="pop-gift" style="--dx:' + ((i - 1) * 12) + 'px;animation-delay:' + (i * 0.12) + 's">' +
        gift(0, 0, 7, 6, cc[0], cc[1]) + '</g></g>').join(''));
      play(el, 'rustle', 500);
      later(3000, () => g.remove());
      return 3000;
    },
    // Из-за ёлки выглядывает эльф: «Boo!»
    peek(el, fx) {
      const b = el.getBBox();
      const x = b.x + b.width / 2, y = b.y + b.height;
      const dir = x > W / 2 ? -1 : 1;
      const g = addSVG(fx, '<g class="peek" style="--dx:' + f1(dir * (b.width / 2 + 3)) + 'px">' + elf(x, y, Math.min(0.7, b.height / 50), { wave: true, flip: dir < 0, hat: '#e0a93f' }) + '</g>');
      later(700, () => bubble(fx, x + dir * (b.width / 2 + 3), b.y + b.height * 0.3, 'Boo!', 1200));
      later(2400, () => g.remove());
      return 2400;
    },
    // Большая ёлка устраивает дискотеку
    disco(el, fx) {
      const b = el.getBBox();
      play(el, 'disco', 2600);
      bubble(fx, b.x + b.width / 2, b.y - 4, 'Merry Christmas!', 2200);
      later(300, () => sparkles(fx, b.x + b.width / 2, b.y + 2, 8, '✦'));
      return 2600;
    }
  };

  const FUN = {
    // Санта проносится через всё небо и кричит HO HO HO!
    santa(el) {
      if (el.classList.contains('dash') || el.classList.contains('back')) return false;
      const ho = addSVG(el.querySelector('.bob > g'), '<text x="30" y="-58">HO HO HO!</text>', 'ho');
      play(el, 'dash', 4000, () => { ho.remove(); play(el, 'back', 1400); });
    },
    elf(el, fx, say) { return busy(el, ELF[el.dataset.trick] || ELF.toss, fx, say); },
    tree(el, fx, say) { return busy(el, TREE[el.dataset.trick] || TREE.shake, fx, say); },
    // Снеговик тает в лужу (от него остаётся шляпа), а потом лепится заново
    snowman(el) {
      if (el.classList.contains('melt') || el.classList.contains('reform')) return false;
      el.classList.add('melt');
      setTimeout(() => {
        el.classList.remove('melt');
        play(el, 'reform', 1400);
      }, 7000);
    }
  };

  // Пока трюк идёт, повторное нажатие ничего не делает
  function busy(el, trick, fx, say) {
    if (el.dataset.busy) return false;
    el.dataset.busy = '1';
    const ms = trick(el, fx, say) || 1500;
    setTimeout(() => { delete el.dataset.busy; }, ms);
  }

  /* ---------- сами собой: эльфы шалят каждые 12 секунд, Гринч приходит каждые 60 ---------- */

  const ELF_EVERY = 12000, GRINCH_EVERY = 60000;

  function grinchSVG() {
    return '<g class="grinch-body">' +
      '<rect x="-5" y="-9" width="4" height="9" fill="#4f8a3a"/><rect x="1" y="-9" width="4" height="9" fill="#4f8a3a"/>' +
      '<path d="M-7 -8 Q-9 -22 0 -24 Q9 -22 7 -8 Z" fill="#6aa84f"/>' +
      '<path d="M-6 -12 Q0 -8 6 -12 L7 -8 L-7 -8 Z" fill="#c8343c"/>' +
      '<circle cx="0" cy="-30" r="6.5" fill="#6aa84f"/>' +
      '<path d="M-3.6 -31.5 l2.6 1 M3.6 -31.5 l-2.6 1" stroke="#1a2440" stroke-width="1" stroke-linecap="round"/>' +
      '<circle cx="-2.2" cy="-30.6" r="0.9" fill="#f2c970"/><circle cx="2.2" cy="-30.6" r="0.9" fill="#f2c970"/>' +
      '<path d="M-3.5 -27 Q0 -24.5 3.5 -27" stroke="#1a2440" stroke-width="1" fill="none" stroke-linecap="round"/>' +
      '<path d="M-6.4 -33 Q0 -45 7 -34 Z" fill="#c8343c"/><rect x="-6.6" y="-34.6" width="13.8" height="2.4" rx="1.2" fill="#fffdf6"/><circle cx="6" cy="-41" r="2" fill="#fffdf6"/>' +
      '</g>';
  }

  // Гринч выбегает слева, хватает главную ёлку (ту, что с дискотекой), уносит вправо; потом ёлка вырастает заново
  function grinchHeist(box, fx) {
    const tree = box.querySelector('.fun-tree[data-trick="disco"]');
    if (!tree || tree.dataset.busy || tree.dataset.stolen) return;
    tree.dataset.busy = '1';
    tree.dataset.stolen = '1';
    const b = tree.getBBox(), tx = b.x + b.width / 2, ty = b.y + b.height;
    const roadAt = (x) => roadY(MAIN_TREE.leg, x) + 3;
    const g = addSVG(fx, '', 'grinch');
    const body = addSVG(g, grinchSVG());
    const place = (x, bob) => g.setAttribute('transform', 'translate(' + f1(x) + ' ' + f1(roadAt(x) - Math.abs(Math.sin(bob)) * 3) + ')');
    const x0 = -34, x1 = tx - 22, x2 = W + 40;
    place(x0, 0);
    tween(2400, (t) => place(x0 + (x1 - x0) * t, t * 18), () => {
      bubble(fx, x1, roadAt(x1) - 46, 'I’ll take that!', 1600);
      later(500, () => {
        tree.style.opacity = '0';
        const clone = tree.cloneNode(true);
        clone.removeAttribute('class');
        clone.removeAttribute('style');
        addSVG(body, '<g transform="translate(16 0) scale(0.55) translate(' + f1(-tx) + ' ' + f1(-ty) + ')"></g>').firstChild.appendChild(clone);
        tween(2800, (t) => place(x1 + (x2 - x1) * t, t * 20), () => {
          g.remove();
          later(5000, () => {
            tree.style.opacity = '';
            delete tree.dataset.stolen;
            delete tree.dataset.busy;
            play(tree, 'boing', 1100);
            sparkles(fx, tx, ty - 20, 8, '✦');
            bubble(fx, tx, b.y - 4, 'Back again!', 1800);
          });
        });
        later(300, () => bubble(fx, x1 + 40, roadAt(x1) - 46, 'Bah, humbug!', 1500));
      });
    });
  }

  let ambient = [];
  function startAmbient(box, fx, onFun) {
    ambient.forEach(clearInterval);
    const say = () => {};   // сами собой эльфы только показывают облачко, вслух не говорят
    let lastElf = null;
    ambient = [
      setInterval(() => {
        if (document.hidden) return;
        const elves = Array.from(box.querySelectorAll('.fun-elf')).filter((e) => e !== lastElf && !e.dataset.busy);
        if (!elves.length) return;
        lastElf = elves[Math.floor(Math.random() * elves.length)];
        FUN.elf(lastElf, fx, say);
      }, ELF_EVERY),
      setInterval(() => { if (!document.hidden) grinchHeist(box, fx); }, GRINCH_EVERY)
    ];
  }

  /* ---------- подключение ---------- */

  // onFun(kind, text) вызывается, когда сработала приколюха: app.js добавляет звук и вибрацию.
  // Если передан text, его надо произнести вслух (эльфы говорят британские фразы).
  function mount(box, onFun) {
    box.innerHTML = '<svg class="scene" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet" role="group" aria-label="Карта городка с домиками-окошками">' + sceneSVG() + '</svg>';
    const fx = box.querySelector('#fx');
    box.querySelector('svg').addEventListener('click', (e) => {
      const el = e.target.closest('.fun');
      if (!el || e.target.closest('#houses')) return;
      const kind = el.dataset.fun;
      const say = (text) => onFun && onFun('say', text);
      if (FUN[kind](el, fx, say) !== false && onFun) onFun(kind);
    });
    startAmbient(box, fx, onFun);
    return box.querySelector('#houses');
  }

  window.Scene = { mount, house, santa };
})();
