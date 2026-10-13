/*
  Картинки для заданий «найди пару». Каждая — маленький рисунок 48×48.
  Имя картинки (tinsel, bauble…) пишется в content.js в поле pic.
  Если нужной картинки нет, в поле pic можно вписать просто эмодзи, например pic: '⛄'.
*/
(() => {
  'use strict';
  const svg = (body) => '<svg viewBox="0 0 48 48" aria-hidden="true">' + body + '</svg>';

  window.ICONS = {
    tinsel: svg(
      '<path d="M4 18 Q14 36 24 24 T44 28" stroke="#e0a93f" stroke-width="10" stroke-dasharray="1.2 1.4" fill="none"/>' +
      '<path d="M4 18 Q14 36 24 24 T44 28" stroke="#c9d3e6" stroke-width="6" stroke-dasharray="1 2" fill="none"/>' +
      '<path d="M4 18 Q14 36 24 24 T44 28" stroke="#f2c970" stroke-width="1.6" fill="none"/>' +
      '<circle cx="12" cy="12" r="1.4" fill="#fff6d8"/><circle cx="36" cy="16" r="1.8" fill="#fff6d8"/><circle cx="30" cy="38" r="1.2" fill="#fff6d8"/>'),

    bauble: svg(
      '<path d="M24 4 Q28 4 28 8" stroke="#aeb4c2" stroke-width="1.6" fill="none"/>' +
      '<rect x="19.5" y="8" width="9" height="6" rx="1.5" fill="#e0a93f"/>' +
      '<circle cx="24" cy="29" r="15" fill="#c8343c"/>' +
      '<path d="M9.6 26 Q24 33 38.4 26 L38.8 30 Q24 37 9.2 30 Z" fill="#f2c970"/>' +
      '<ellipse cx="18" cy="21" rx="4" ry="2.6" fill="#fff" opacity="0.45" transform="rotate(-30 18 21)"/>'),

    fairylights: svg(
      '<path d="M2 14 Q12 26 24 16 T46 18" stroke="#2c4a3a" stroke-width="1.4" fill="none"/>' +
      [[7, 19.5, '#ff5a5a'], [15, 22.5, '#f2c970'], [24, 16.5, '#6fd3ff'], [33, 12.5, '#8ef0a8'], [41, 16, '#ff8fd0']].map(([x, y, c]) =>
        '<circle cx="' + x + '" cy="' + (y + 6) + '" r="6" fill="' + c + '" opacity="0.25"/>' +
        '<rect x="' + (x - 1.6) + '" y="' + (y - 1) + '" width="3.2" height="3" fill="#3a4a5a"/>' +
        '<ellipse cx="' + x + '" cy="' + (y + 5) + '" rx="3" ry="4.4" fill="' + c + '"/>').join('') +
      '<path d="M8 36 Q18 46 28 38 T46 40" stroke="#2c4a3a" stroke-width="1.4" fill="none"/>' +
      [[13, 40, '#6fd3ff'], [23, 40.5, '#ff5a5a'], [34, 36, '#f2c970']].map(([x, y, c]) =>
        '<ellipse cx="' + x + '" cy="' + (y + 3.5) + '" rx="2.4" ry="3.4" fill="' + c + '"/>').join('')),

    wreath: svg(
      '<circle cx="24" cy="23" r="14" fill="none" stroke="#2f7a52" stroke-width="9"/>' +
      '<circle cx="24" cy="23" r="14" fill="none" stroke="#3f9a63" stroke-width="3" stroke-dasharray="3 4"/>' +
      '<circle cx="15" cy="13" r="2" fill="#c8343c"/><circle cx="35" cy="15" r="2" fill="#c8343c"/><circle cx="12" cy="28" r="2" fill="#c8343c"/><circle cx="37" cy="30" r="2" fill="#c8343c"/>' +
      '<path d="M24 37 L15 44 L17 36 Z M24 37 L33 44 L31 36 Z" fill="#c8343c"/><circle cx="24" cy="37" r="3" fill="#a8282f"/>'),

    turkey: svg(
      '<ellipse cx="24" cy="38" rx="21" ry="5" fill="#e8eef7"/>' +
      '<path d="M8 33 Q8 16 24 15 Q40 16 40 33 Z" fill="#b8692e"/>' +
      '<path d="M13 24 Q20 19 28 21" stroke="#d98a45" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
      '<path d="M34 22 L41 13" stroke="#a65a25" stroke-width="5" stroke-linecap="round"/><path d="M14 22 L7 13" stroke="#a65a25" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M39 11 l4 -3 l1 4 z M9 11 l-4 -3 l-1 4 z" fill="#fff"/>' +
      '<circle cx="12" cy="35" r="2.4" fill="#3f8a63"/><circle cx="36" cy="35" r="2.4" fill="#e08a2c"/>'),

    pigs: svg(
      '<ellipse cx="24" cy="38" rx="21" ry="5" fill="#e8eef7"/>' +
      [[12, 28, -15], [24, 24, 0], [35, 29, 15]].map(([x, y, r]) =>
        '<g transform="rotate(' + r + ' ' + x + ' ' + y + ')"><rect x="' + (x - 4) + '" y="' + (y - 9) + '" width="8" height="18" rx="4" fill="#9a5a34"/>' +
        '<path d="M' + (x - 4.6) + ' ' + (y - 4) + ' L' + (x + 4.6) + ' ' + (y - 1) + ' L' + (x + 4.6) + ' ' + (y + 4) + ' L' + (x - 4.6) + ' ' + (y + 1) + ' Z" fill="#e88a8a"/>' +
        '<path d="M' + (x - 4.6) + ' ' + (y - 2) + ' L' + (x + 4.6) + ' ' + (y + 1) + '" stroke="#fff" stroke-width="0.9" opacity="0.8"/></g>').join('')),

    sprouts: svg(
      '<ellipse cx="24" cy="40" rx="20" ry="4" fill="#e8eef7"/>' +
      [[14, 30, 9], [32, 30, 9], [23, 20, 9]].map(([x, y, r]) =>
        '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#5a9a3f"/>' +
        '<path d="M' + (x - r + 2) + ' ' + y + ' Q' + x + ' ' + (y - r) + ' ' + (x + r - 2) + ' ' + y + '" stroke="#a5d47a" stroke-width="1.6" fill="none"/>' +
        '<path d="M' + x + ' ' + (y - r + 1) + ' Q' + (x + 2) + ' ' + y + ' ' + x + ' ' + (y + r - 1) + '" stroke="#3f7a2c" stroke-width="1.2" fill="none"/>').join('')),

    pudding: svg(
      '<ellipse cx="24" cy="40" rx="20" ry="4.5" fill="#e8eef7"/>' +
      '<path d="M6 38 Q6 14 24 14 Q42 14 42 38 Z" fill="#5a3320"/>' +
      '<circle cx="15" cy="30" r="1.4" fill="#2a160c"/><circle cx="27" cy="33" r="1.4" fill="#2a160c"/><circle cx="34" cy="27" r="1.4" fill="#2a160c"/><circle cx="21" cy="25" r="1.2" fill="#2a160c"/>' +
      '<path d="M9 24 Q12 14 24 14 Q36 14 39 24 Q36 22 34 26 Q31 21 28 24 Q25 20 22 25 Q19 21 16 26 Q13 21 9 24 Z" fill="#f6efe0"/>' +
      '<path d="M24 14 Q19 8 15 10 Q19 12 24 14 Q29 8 33 10 Q29 12 24 14 Z" fill="#2f7a52"/><circle cx="23" cy="12" r="1.8" fill="#c8343c"/><circle cx="26" cy="12.5" r="1.8" fill="#c8343c"/>'),

    cracker: svg(
      '<path d="M4 16 L12 20 L12 28 L4 32 Z M44 16 L36 20 L36 28 L44 32 Z" fill="#c8343c"/>' +
      '<rect x="12" y="17" width="24" height="14" rx="2" fill="#c8343c"/>' +
      '<rect x="12" y="17" width="3" height="14" fill="#e0a93f"/><rect x="33" y="17" width="3" height="14" fill="#e0a93f"/>' +
      '<path d="M18 24 l2 -3 l2 3 l2 -3 l2 3 l2 -3 l2 3" stroke="#f2c970" stroke-width="1.2" fill="none"/>' +
      '<path d="M2 20 l2 1 M2 28 l2 -1 M46 20 l-2 1 M46 28 l-2 -1" stroke="#f2c970" stroke-width="1.2"/>'),

    crown: svg(
      '<path d="M6 36 L6 16 L14 26 L24 12 L34 26 L42 16 L42 36 Z" fill="#f2c970"/>' +
      '<path d="M6 36 L6 16 L14 26 L24 12 L34 26 L42 16 L42 36 Z" fill="none" stroke="#e0a93f" stroke-width="1.4" stroke-linejoin="round"/>' +
      '<path d="M6 31 H42" stroke="#e0a93f" stroke-width="1" stroke-dasharray="2 2"/>'),

    jumper: svg(
      '<path d="M16 6 L32 6 L44 14 L40 24 L36 21 L36 42 L12 42 L12 21 L8 24 L4 14 Z" fill="#b8323a"/>' +
      '<path d="M18 6 Q24 11 30 6" stroke="#8a2329" stroke-width="2" fill="none"/>' +
      '<path d="M12 24 L16 20 L20 24 L24 20 L28 24 L32 20 L36 24" stroke="#f6efe0" stroke-width="2" fill="none"/>' +
      '<path d="M24 28 L20 36 L28 36 Z" fill="#2f7a52"/><rect x="23" y="36" width="2" height="2" fill="#7a4a2a"/>' +
      '<circle cx="16" cy="32" r="1.2" fill="#f6efe0"/><circle cx="32" cy="32" r="1.2" fill="#f6efe0"/><circle cx="17" cy="38" r="1.2" fill="#f6efe0"/><circle cx="31" cy="38" r="1.2" fill="#f6efe0"/>' +
      '<rect x="12" y="39" width="24" height="3" fill="#8a2329"/>'),

    stocking: svg(
      '<rect x="14" y="4" width="20" height="8" rx="2" fill="#f6efe0"/>' +
      '<path d="M16 12 L32 12 L32 28 Q32 30 34 32 L38 34 Q44 38 40 43 Q37 46 30 43 L20 38 Q14 35 16 28 Z" fill="#c8343c"/>' +
      '<path d="M30 40 Q34 38 38 41" stroke="#f6efe0" stroke-width="2" fill="none"/>' +
      '<path d="M18 20 l3 3 l3 -3 l3 3 l3 -3" stroke="#f2c970" stroke-width="1.4" fill="none"/>' +
      '<path d="M33 6 Q38 2 40 6" stroke="#aeb4c2" stroke-width="1.4" fill="none"/>'),

    mittens: svg(
      '<path d="M12 8 Q12 4 16 4 L18 4 Q22 4 22 9 L22 26 L8 26 L8 18 Q4 18 4 14 Q4 10 8 11 L8 10 Q8 8 12 8 Z" fill="#3e6fb4"/>' +
      '<rect x="7" y="25" width="16" height="6" rx="2" fill="#f6efe0"/>' +
      '<path d="M36 18 Q36 14 40 14 L42 14 Q46 14 46 19 L46 36 L32 36 L32 28 Q28 28 28 24 Q28 20 32 21 L32 20 Q32 18 36 18 Z" fill="#3e6fb4"/>' +
      '<rect x="31" y="35" width="16" height="6" rx="2" fill="#f6efe0"/>' +
      '<path d="M15 31 Q18 46 39 41" stroke="#c8343c" stroke-width="1.4" fill="none"/>' +
      '<path d="M10 16 h10 M34 26 h10" stroke="#f6efe0" stroke-width="1.4" stroke-dasharray="2 1.6"/>'),

    bobblehat: svg(
      '<circle cx="24" cy="9" r="6" fill="#f6efe0"/>' +
      '<path d="M8 34 Q8 13 24 13 Q40 13 40 34 Z" fill="#c8343c"/>' +
      '<path d="M10 24 H38 M9 29 H39" stroke="#f6efe0" stroke-width="2.4"/>' +
      '<rect x="6" y="33" width="36" height="9" rx="3" fill="#a8282f"/>' +
      '<path d="M10 33 V42 M16 33 V42 M22 33 V42 M28 33 V42 M34 33 V42" stroke="#8a2329" stroke-width="1.2"/>'),

    sledge: svg(
      '<path d="M6 34 L38 34 Q46 34 44 26" stroke="#c8343c" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<path d="M12 26 L12 34 M32 26 L32 34" stroke="#c8343c" stroke-width="2.6"/>' +
      '<rect x="6" y="20" width="32" height="4" rx="1.5" fill="#b8792e"/><rect x="6" y="25" width="32" height="3" rx="1.5" fill="#9a6224"/>' +
      '<path d="M38 22 Q44 20 46 14" stroke="#7a4a2a" stroke-width="1.4" fill="none"/>' +
      '<path d="M2 42 Q24 38 46 42" stroke="#dfe7f4" stroke-width="3" fill="none"/>'),

    snowman: svg(
      '<circle cx="24" cy="34" r="11" fill="#f2f5fb" stroke="#c9d3e6"/><circle cx="24" cy="18" r="8" fill="#f2f5fb" stroke="#c9d3e6"/>' +
      '<rect x="16" y="9" width="16" height="2.4" fill="#2a2a2a"/><rect x="19" y="2" width="10" height="8" fill="#2a2a2a"/><rect x="19" y="7" width="10" height="1.6" fill="#c8343c"/>' +
      '<circle cx="21" cy="16" r="1" fill="#2a2a2a"/><circle cx="27" cy="16" r="1" fill="#2a2a2a"/><path d="M24 18 L30 19 L24 20 Z" fill="#f08a2c"/>' +
      '<path d="M16 24 Q24 28 32 24 L32 27 Q24 31 16 27 Z" fill="#c8343c"/>' +
      '<circle cx="24" cy="32" r="1.2" fill="#2a2a2a"/><circle cx="24" cy="37" r="1.2" fill="#2a2a2a"/>'),

    mincepie: svg(
      '<ellipse cx="24" cy="40" rx="20" ry="4" fill="#e8eef7"/>' +
      '<path d="M7 30 L10 39 L38 39 L41 30 Z" fill="#c98a45"/>' +
      '<path d="M8 31 L11 38 M14 31 L15 38 M20 31 L20.5 38 M28 31 L27.5 38 M34 31 L33 38 M40 31 L37 38" stroke="#a86c30" stroke-width="1"/>' +
      '<ellipse cx="24" cy="30" rx="17" ry="5" fill="#e0a85a"/>' +
      '<path d="M24 22 L26.4 27.4 L32 27.6 L27.6 31 L29.2 36.4 L24 33.2 L18.8 36.4 L20.4 31 L16 27.6 L21.6 27.4 Z" fill="#f2c47a" stroke="#c98a45" stroke-width="0.8" transform="translate(0 -3) scale(1 0.7) translate(0 10)"/>' +
      '<circle cx="14" cy="28" r="0.8" fill="#fff"/><circle cx="33" cy="29" r="0.8" fill="#fff"/><circle cx="24" cy="26" r="0.8" fill="#fff"/>'),

    mulledwine: svg(
      '<path d="M14 6 Q11 10 14 14 M22 4 Q19 9 22 13" stroke="#c9d3e6" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
      '<path d="M8 16 L36 16 L34 40 Q34 44 30 44 L14 44 Q10 44 10 40 Z" fill="#dfe7f4" opacity="0.6"/>' +
      '<path d="M9.4 22 L34.6 22 L33.4 39 Q33.2 42 30 42 L14 42 Q10.8 42 10.6 39 Z" fill="#7a1f2e"/>' +
      '<path d="M36 22 Q44 22 44 30 Q44 37 35 37" stroke="#dfe7f4" stroke-width="3" fill="none"/>' +
      '<circle cx="28" cy="19" r="6" fill="#f08a2c"/><circle cx="28" cy="19" r="4.4" fill="#f6b45a"/><path d="M28 15 V23 M24 19 H32 M25 16 L31 22 M31 16 L25 22" stroke="#f08a2c" stroke-width="0.6"/>' +
      '<rect x="14" y="8" width="3" height="18" rx="1.5" fill="#8a5a34" transform="rotate(-12 15 17)"/>'),

    gingerbread: svg(
      '<path d="M24 4 A7 7 0 0 1 24 18 A7 7 0 0 1 24 4 Z M17 18 L31 18 L42 22 Q45 24 42 27 L33 26 L35 40 Q36 44 32 44 L28 44 L24 34 L20 44 L16 44 Q12 44 13 40 L15 26 L6 27 Q3 24 6 22 Z" fill="#c07a3a"/>' +
      '<circle cx="21.5" cy="10" r="1.1" fill="#3a2010"/><circle cx="26.5" cy="10" r="1.1" fill="#3a2010"/><path d="M21 13.5 Q24 16 27 13.5" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round"/>' +
      '<circle cx="24" cy="23" r="1.4" fill="#c8343c"/><circle cx="24" cy="28" r="1.4" fill="#3f8a63"/>' +
      '<path d="M8 23 q1.5 1.6 3 0 q1.5 -1.6 3 0 M34 23 q1.5 1.6 3 0 q1.5 -1.6 3 0 M15 41 q1.5 -1.6 3 0 M30 41 q1.5 -1.6 3 0" stroke="#fff" stroke-width="1.1" fill="none"/>'),

    mistletoe: svg(
      '<path d="M24 4 V14" stroke="#c8343c" stroke-width="2"/>' +
      '<path d="M24 12 L18 7 L19 13 Z M24 12 L30 7 L29 13 Z" fill="#c8343c"/>' +
      '<path d="M24 14 Q18 26 10 30 Q14 20 24 14 Z" fill="#5a9a3f"/><path d="M24 14 Q30 26 38 30 Q34 20 24 14 Z" fill="#5a9a3f"/>' +
      '<path d="M24 14 Q22 28 16 38 Q16 26 24 14 Z" fill="#3f7a2c"/><path d="M24 14 Q26 28 32 38 Q32 26 24 14 Z" fill="#3f7a2c"/>' +
      '<circle cx="22" cy="22" r="2.4" fill="#f6efe0"/><circle cx="26" cy="23" r="2.4" fill="#f6efe0"/><circle cx="24" cy="26" r="2.4" fill="#f6efe0"/>')
  };
})();
