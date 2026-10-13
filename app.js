/*
  Логика приложения. Разделы файла:
    1. Telegram и хранилище прогресса
    2. Даты: какое окошко уже можно открыть
    3. Календарь (сетка окошек)
    4. Шторка с окошком: задания пяти типов
    5. Повторение карточек
    6. Запуск
    7. Сюрпризы: финальный ролик и подарок на Boxing Day
*/
(() => {
  'use strict';

  const CFG = window.CONFIG;
  const DAYS = window.DAYS;
  const MS_DAY = 86400000;
  const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

  const $ = (sel) => document.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const withMark = (s) => esc(s).replace(/\[\[(.+?)\]\]/g, '<mark>$1</mark>');
  const plain = (s) => s.replace(/\[\[|\]\]/g, '');
  const plural = (n, [one, few, many]) => {
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b > 1 && b < 5) return few;
    return b === 1 ? one : many;
  };

  /* ---------- 1. Telegram и хранилище ---------- */

  const tg = window.Telegram && window.Telegram.WebApp;
  const inTelegram = !!(tg && tg.initData);   // пусто, если открыли не из Telegram

  if (tg) {
    try {
      tg.ready();
      tg.expand();
      const bg = getComputedStyle(document.documentElement).getPropertyValue('--night').trim();
      if (tg.setHeaderColor) tg.setHeaderColor(bg);
      if (tg.setBackgroundColor) tg.setBackgroundColor(bg);
    } catch (e) { /* не страшно */ }
  }

  const haptic = (kind) => {
    try {
      const h = tg && tg.HapticFeedback;
      if (!h) return;
      if (kind === 'ok' || kind === 'bad') h.notificationOccurred(kind === 'ok' ? 'success' : 'error');
      else h.impactOccurred('light');
    } catch (e) { /* не страшно */ }
  };

  // Прогресс хранится в облаке Telegram (CloudStorage) и дублируется в localStorage.
  // Благодаря этому он сохраняется при смене телефона.
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  };

  const store = {
    get(key) {
      return new Promise((resolve) => {
        if (!(inTelegram && tg.CloudStorage)) return resolve(ls.get(key));
        let done = false;
        const finish = (v) => { if (!done) { done = true; resolve(v); } };
        setTimeout(() => finish(ls.get(key)), 1500);
        try {
          tg.CloudStorage.getItem(key, (err, value) => finish(err || !value ? ls.get(key) : value));
        } catch (e) { finish(ls.get(key)); }
      });
    },
    set(key, value) {
      ls.set(key, value);
      try { if (inTelegram && tg.CloudStorage) tg.CloudStorage.setItem(key, value, () => {}); } catch (e) { /* ignore */ }
    }
  };

  const KEY = 'advent-' + CFG.year;
  // opened: {номер: 1}, solved: {номер: 1}, cards: {номер: [ящик, срок повторения]}
  // finale: 1 — финальный ролик уже показан, boxing: 1 — подарок Boxing Day уже открыт
  let state = { opened: {}, solved: {}, cards: {} };
  const save = () => store.set(KEY, JSON.stringify(state));

  /* ---------- 2. Даты ---------- */

  const parseYMD = (s) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  };
  const params = new URLSearchParams(location.search);
  let testDate = parseYMD(params.get('today')) || parseYMD(window.PREVIEW_TODAY);

  const today = () => {
    const d = testDate || new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  };
  const windowDate = (n) => new Date(CFG.year, CFG.month - 1, n);
  const isUnlocked = (n) => today() >= windowDate(n);
  const daysUntil = (n) => Math.round((windowDate(n) - today()) / MS_DAY);
  const fmtDate = (n) => n + ' ' + MONTHS_GEN[CFG.month - 1];

  /* ---------- 3. Календарь (карта с домиками) ---------- */

  // Рисунок городка живёт в scene.js. Здесь решаем, в каком домике горит свет:
  //   открыли окошко       → свет горит ярко
  //   можно открыть, но ещё не открыли (сегодня или раньше) → свет приглушён
  //   окошко из будущего   → свет выключен
  let houses = null;   // слой с домиками внутри карты
  let justLit = 0;     // домик, который только что открыли: он красиво «зажигается»

  function renderHeader() {
    $('#title').textContent = CFG.title;
    $('#subtitle').textContent = CFG.subtitle;
    document.title = CFG.title;
    const total = DAYS.length;
    const unlocked = DAYS.filter((d) => isUnlocked(d.day)).length;
    const solved = Object.keys(state.solved).length;
    $('#progress').textContent = 'Открыто окошек: ' + unlocked + ' из ' + total + ' · пройдено заданий: ' + solved;

    const banner = $('#banner');
    const left = daysUntil(1);
    if (left > 0) {
      banner.hidden = false;
      banner.textContent = 'Календарь откроется ' + fmtDate(1) + '. Осталось ' + left + ' ' + plural(left, ['день', 'дня', 'дней']) + '.';
    } else {
      banner.hidden = true;
    }
  }

  function renderGrid() {
    const now = today().getTime();
    houses.innerHTML = DAYS.map((d, i) => {
      const n = d.day;
      const unlocked = isUnlocked(n);
      const opened = !!state.opened[n];
      const solved = !!state.solved[n];
      return window.Scene.house({
        i, n, solved,
        kind: !unlocked ? 'is-locked' : opened ? 'is-open' : 'is-ready',
        today: windowDate(n).getTime() === now,
        fresh: n === justLit && backdrop.hidden,
        label: esc('Окошко ' + n + ', ' + (!unlocked ? 'закрыто до ' + fmtDate(n) : solved ? 'пройдено' : opened ? 'открыто' : 'можно открыть'))
      });
    }).join('');
  }

  function tapHouse(h) {
    const n = +h.dataset.day;
    if (!isUnlocked(n)) {
      const hb = h.querySelector('.hb');
      hb.classList.remove('shake'); hb.getBoundingClientRect(); hb.classList.add('shake');
      toast('Это окошко откроется ' + fmtDate(n));
      haptic('bad');
      return;
    }
    haptic();
    try {
      openSheet(n);
    } catch (e) {
      // Если что-то сломалось в содержимом окошка, показываем причину, а не молчим
      console.error(e);
      toast('Окошко ' + n + ' не открылось: ' + e.message);
    }
  }

  function setupMap() {
    houses = window.Scene.mount($('#map'), (kind, text) => {
      if (kind === 'say') { speak(text, 0.95, 1.5); return; }   // эльфы говорят высоким голосом
      if (kind === 'santa') speak('Ho ho ho!', 0.8, 0.5);
      haptic(kind === 'santa' ? 'ok' : undefined);
    });
    houses.addEventListener('click', (e) => {
      const h = e.target.closest('.house');
      if (h) tapHouse(h);
    });
    houses.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const h = e.target.closest('.house');
      if (h) { e.preventDefault(); tapHouse(h); }
    });
  }

  /* ---------- 4. Шторка с окошком: задание дня ---------- */

  const backdrop = $('#backdrop');
  const sheetBody = $('#sheet-body');
  const canSpeak = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

  // Пять типов заданий. label — подпись в окошке, title — заголовок, если в задании нет своего.
  const TYPES = {
    vocab: { label: 'Лексика', icon: '💬' },
    film: { label: 'Угадай фильм', icon: '🎬', title: 'Какой это фильм?' },
    match: { label: 'Найди пару', icon: '🧩', title: 'Соедини картинку и слово' },
    reading: { label: 'Чтение', icon: '📰', title: 'Читаем' },
    song: { label: 'Рождественская песня', icon: '🎵', title: 'Послушай и вставь слова' }
  };

  // Перемешать одинаково при каждом открытии окошка (порядок зависит от номера дня)
  function shuffle(arr, seed) {
    const a = arr.slice();
    let s = seed * 7919 + 13;
    for (let i = a.length - 1; i > 0; i--) {
      s = (s * 9301 + 49297) % 233280;
      const j = Math.floor(s / 233280 * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const sayBtn = (text, label) => canSpeak ? '<button type="button" class="btn" data-say="' + esc(text) + '">' + label + '</button>' : '';
  const glossHTML = (g) => '<div class="gloss">' + g.map(([a, b]) => '<span><b>' + esc(a) + '</b> — ' + esc(b) + '</span>').join('') + '</div>';
  const shake = (el) => { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); };

  // Выражение дня. В лексике оно стоит сверху, в остальных заданиях открывается наградой после решения.
  function wordBlock(d, asReward) {
    return '<div class="word' + (asReward ? ' is-reward' : '') + '">' +
      (asReward ? '<p class="word-label">🎁 Выражение дня</p><p class="word-phrase">' + esc(d.phrase) + '</p>' : '') +
      '<p class="s-ru">' + esc(d.ru) + '</p>' +
      '<p class="s-example">' + withMark(d.example) + '</p>' +
      sayBtn(plain(d.example), 'Послушать пример') +
      (d.note ? '<p class="s-note">' + esc(d.note) + '</p>' : '') +
      '</div>';
  }

  function openSheet(n) {
    const d = DAYS.find((x) => x.day === n);
    if (!d) return;

    if (!state.opened[n]) {
      state.opened[n] = 1;
      justLit = n;
      if (!state.cards[n]) state.cards[n] = [0, today().getTime()];   // карточка попадает в повторение
      save();
    }

    const type = TYPES[d.type] ? d.type : 'vocab';
    const T = TYPES[type];
    const solved = !!state.solved[n];
    const title = type === 'vocab' ? d.phrase : (d.task.title || T.title);

    sheetBody.innerHTML =
      '<p class="s-eyebrow">' + d.icon + ' Окошко ' + n + ' · ' + fmtDate(n) + '</p>' +
      '<p class="s-type">' + T.icon + ' ' + T.label + '</p>' +
      '<h2 class="s-phrase" id="s-phrase">' + esc(title) + '</h2>' +
      (type === 'vocab' ? wordBlock(d, false) : '') +
      '<div class="task" id="task"></div>' +
      '<div id="word"></div>';

    const done = () => {
      if (!state.solved[n]) { state.solved[n] = 1; save(); }
      haptic('ok');
      if (type !== 'vocab') {
        $('#word').innerHTML = wordBlock(d, true);
        $('#word').firstChild.classList.add('pop');
        setTimeout(() => $('#word').scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 250);
      }
    };
    RENDER[type](d, $('#task'), solved, done);
    if (solved && type !== 'vocab') $('#word').innerHTML = wordBlock(d, true);

    backdrop.hidden = false;
    $('#sheet').scrollTop = 0;
    $('#sheet-close').focus({ preventScroll: true });
    renderGrid(); renderHeader(); renderBadge();
  }

  function closeSheet() {
    backdrop.hidden = true;
    sheetBody.innerHTML = '';   // останавливает видео и аудио
    try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
    renderGrid(); renderHeader(); renderBadge();
    justLit = 0;
    maybeSurprise();
  }

  function speak(text, rate, pitch) {
    try {
      const synth = window.speechSynthesis;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-GB';
      u.rate = rate || 0.9;
      if (pitch) u.pitch = pitch;
      const v = synth.getVoices().find((x) => x.lang === 'en-GB' || x.lang === 'en_GB');
      if (v) u.voice = v;
      synth.speak(u);
    } catch (e) { toast('Звук недоступен на этом устройстве'); }
  }

  // Вопросы с вариантами ответа. Несколько вопросов идут по очереди.
  function renderQuestions(box, list, solved, onDone) {
    box.innerHTML = '';
    const draw = (k, answered) => {
      const q = list[k];
      const wrap = document.createElement('div');
      wrap.className = 'quiz';
      wrap.innerHTML =
        '<p class="quiz-label">' + (list.length > 1 ? 'Вопрос ' + (k + 1) + ' из ' + list.length : 'Проверь себя') + '</p>' +
        '<p class="quiz-q">' + esc(q.q) + '</p>' +
        q.options.map((o, i) => '<button type="button" class="opt" data-i="' + i + '">' + esc(o) + '</button>').join('') +
        '<p class="quiz-fb" aria-live="polite"></p>';
      box.appendChild(wrap);
      const opts = [...wrap.querySelectorAll('.opt')];
      const fb = wrap.querySelector('.quiz-fb');
      const ok = () => {
        opts.forEach((o) => { o.disabled = true; });
        opts[q.answer].classList.add('ok');
        fb.textContent = 'Верно. ' + q.why;
      };
      if (answered) { ok(); return; }
      opts.forEach((o) => o.addEventListener('click', () => {
        if (+o.dataset.i === q.answer) {
          ok();
          if (k + 1 < list.length) { haptic(); draw(k + 1, false); } else onDone();
        } else {
          o.classList.add('bad');
          o.disabled = true;
          fb.textContent = 'Пока нет. Попробуй ещё раз.';
          haptic('bad');
        }
      }));
    };
    if (solved) list.forEach((_, k) => draw(k, true)); else draw(0, false);
  }

  function videoHTML(url) {
    const m = /(?:youtu\.be\/|[?&]v=|embed\/|shorts\/)([\w-]{11})/.exec(url) || (/^[\w-]{11}$/.test(url) ? [0, url] : null);
    if (m) {
      return '<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/' + m[1] + '?rel=0&playsinline=1" title="Отрывок из фильма" ' +
        'allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe></div>';
    }
    return '<div class="video"><video src="' + esc(url) + '" controls playsinline preload="metadata"></video></div>';
  }

  const RENDER = {
    vocab(d, box, solved, done) {
      renderQuestions(box, [d.task], solved, done);
    },

    film(d, box, solved, done) {
      const t = d.task;
      box.innerHTML = t.video
        ? videoHTML(t.video)
        : '<div class="scene-card"><p class="scene-emoji">' + esc(t.emoji || '🎬') + '</p><p class="scene-text">' + esc(t.scene) + '</p>' + sayBtn(t.scene, '▶ Послушать') + '</div>';
      const q = document.createElement('div');
      box.appendChild(q);
      renderQuestions(q, [t], solved, done);
    },

    match(d, box, solved, done) {
      const pairs = d.task.pairs;
      const order = shuffle(pairs.map((_, i) => i), d.day);
      const pic = (p) => (window.ICONS && window.ICONS[p.pic]) || '<span class="m-emoji">' + esc(p.pic) + '</span>';
      box.innerHTML =
        '<p class="task-hint">Нажми на картинку, а потом на подходящее слово.</p>' +
        '<div class="match"><div class="m-col">' +
        pairs.map((p, i) => '<button type="button" class="m-item m-pic" data-k="' + i + '" aria-label="Картинка ' + (i + 1) + '">' + pic(p) + '</button>').join('') +
        '</div><div class="m-col">' +
        order.map((i) => '<button type="button" class="m-item m-word" data-k="' + i + '">' + esc(pairs[i].word) + '</button>').join('') +
        '</div></div><p class="quiz-fb" aria-live="polite"></p><div class="m-gloss"></div>';

      const fb = box.querySelector('.quiz-fb');
      const finish = () => {
        fb.textContent = 'Все пары на месте!';
        box.querySelector('.m-gloss').innerHTML = glossHTML(pairs.map((p) => [p.word, p.ru]));
      };
      let color = 0;
      const lock = (k) => {
        const c = color++;
        box.querySelectorAll('[data-k="' + k + '"]').forEach((b) => { b.classList.remove('sel'); b.classList.add('ok', 'c' + (c % 4)); b.disabled = true; });
      };
      if (solved) { pairs.forEach((_, k) => lock(k)); finish(); return; }

      let sel = null, left = pairs.length;
      const col = (el) => el.classList.contains('m-pic') ? 'pic' : 'word';
      box.querySelectorAll('.m-item').forEach((b) => b.addEventListener('click', () => {
        if (!sel || col(sel) === col(b)) {
          if (sel) sel.classList.remove('sel');
          sel = b; b.classList.add('sel'); haptic();
          return;
        }
        if (sel.dataset.k === b.dataset.k) {
          lock(b.dataset.k); sel = null; left--; fb.textContent = '';
          if (!left) { finish(); done(); } else haptic();
        } else {
          shake(sel); shake(b); sel.classList.remove('sel'); sel = null;
          fb.textContent = 'Не пара. Попробуй ещё.';
          haptic('bad');
        }
      }));
    },

    reading(d, box, solved, done) {
      const t = d.task;
      box.innerHTML =
        (t.intro ? '<p class="task-hint">' + esc(t.intro) + '</p>' : '') +
        (t.text ? '<div class="read">' + t.text.map((p) => '<p>' + withMark(p) + '</p>').join('') + sayBtn(t.text.map(plain).join(' '), '▶ Послушать текст') + '</div>' : '') +
        (t.gloss ? glossHTML(t.gloss) : '') +
        '<div class="r-q"></div>';
      const q = box.querySelector('.r-q');
      if (t.quiz) renderQuestions(q, t.quiz, solved, done);
      else if (t.facts) renderFacts(q, t.facts, solved, done);
    },

    song(d, box, solved, done) {
      const t = d.task;
      const answers = [];
      const lyrics = t.lines.map((line) => line.split(/(\{[^}]+\})/).map((part) => {
        if (part[0] !== '{') return esc(part);
        answers.push(part.slice(1, -1));
        return '<span class="gap" data-g="' + (answers.length - 1) + '"></span>';
      }).join('')).join('<br>');
      const full = t.lines.map((l) => l.replace(/[{}]/g, '')).join('. ');
      const chips = shuffle(answers.concat(t.extra || []), d.day);

      box.innerHTML =
        '<p class="song-name">♪ ' + esc(t.song) + (t.by ? '<span>' + esc(t.by) + '</span>' : '') + '</p>' +
        (t.audio ? '<audio class="song-audio" controls preload="none" src="' + esc(t.audio) + '"></audio>' : sayBtn(full, '▶ Послушать')) +
        '<p class="task-hint">Послушай и вставь пропущенные слова по порядку.</p>' +
        '<p class="lyrics">' + lyrics + '</p>' +
        '<div class="bank">' + chips.map((w) => '<button type="button" class="chip" data-w="' + esc(w) + '">' + esc(w) + '</button>').join('') + '</div>' +
        '<p class="quiz-fb" aria-live="polite"></p><div class="m-gloss"></div>';

      const gaps = [...box.querySelectorAll('.gap')];
      const fb = box.querySelector('.quiz-fb');
      const fill = (k) => { gaps[k].textContent = answers[k]; gaps[k].classList.remove('cur'); gaps[k].classList.add('filled'); };
      const finish = () => {
        box.querySelectorAll('.chip').forEach((c) => { c.disabled = true; });
        fb.textContent = 'Браво, все слова на месте! Теперь можно подпевать.';
        if (t.gloss) box.querySelector('.m-gloss').innerHTML = glossHTML(t.gloss);
      };
      if (solved) { answers.forEach((_, k) => fill(k)); finish(); return; }

      let next = 0;
      gaps[0].classList.add('cur');
      box.querySelectorAll('.chip').forEach((c) => c.addEventListener('click', () => {
        if (c.dataset.w === answers[next]) {
          fill(next); c.disabled = true; c.classList.add('used'); fb.textContent = '';
          next++;
          if (next < answers.length) { gaps[next].classList.add('cur'); haptic(); } else { finish(); done(); }
        } else {
          shake(c);
          fb.textContent = 'Не то слово. Послушай ещё раз.';
          haptic('bad');
        }
      }));
    }
  };

  // «Правда или выдумка»: отвечаешь на каждое утверждение, сразу видишь пояснение.
  function renderFacts(box, facts, solved, done) {
    box.innerHTML = facts.map((f, i) =>
      '<div class="fact" data-i="' + i + '"><p class="fact-s">' + esc(f.s) + '</p>' +
      '<div class="fact-btns"><button type="button" class="opt tf" data-v="1">Правда</button><button type="button" class="opt tf" data-v="0">Выдумка</button></div>' +
      '<p class="fact-why" hidden></p></div>').join('') +
      '<p class="quiz-fb facts-fb" aria-live="polite"></p>';
    const fb = box.querySelector('.facts-fb');
    const cards = [...box.querySelectorAll('.fact')];
    const answer = (el, f, v) => {
      el.querySelectorAll('.tf').forEach((b) => { b.disabled = true; });
      el.querySelector('[data-v="' + (f.t ? 1 : 0) + '"]').classList.add('ok');
      if (v !== f.t) el.querySelector('[data-v="' + (v ? 1 : 0) + '"]').classList.add('bad');
      const why = el.querySelector('.fact-why');
      why.hidden = false;
      why.textContent = f.why;
      return v === f.t;
    };
    if (solved) { cards.forEach((el, i) => answer(el, facts[i], facts[i].t)); fb.textContent = 'Все традиции разобраны.'; return; }

    let left = facts.length, right = 0;
    cards.forEach((el, i) => el.querySelectorAll('.tf').forEach((b) => b.addEventListener('click', () => {
      const ok = answer(el, facts[i], b.dataset.v === '1');
      if (ok) right++;
      left--;
      if (left) { haptic(ok ? 'ok' : 'bad'); return; }
      fb.textContent = 'Угадано ' + right + ' из ' + facts.length + '. ' + (right === facts.length ? 'Блестяще!' : 'Зато теперь ты знаешь, как на самом деле.');
      done();
    })));
  }

  /* ---------- 5. Повторение ---------- */

  const review = $('#review');
  let queue = [];
  let revealed = false;
  let sessionOn = false;

  const dueList = () => {
    const now = today().getTime();
    return Object.keys(state.cards).map(Number)
      .filter((n) => state.opened[n] && isUnlocked(n) && state.cards[n][1] <= now)
      .sort((a, b) => state.cards[a][0] - state.cards[b][0] || a - b);
  };

  function renderBadge() {
    const n = dueList().length;
    const badge = $('#due-badge');
    badge.hidden = n === 0;
    badge.textContent = n;
  }

  function renderReview() {
    if (!sessionOn) { queue = dueList(); sessionOn = queue.length > 0; revealed = false; }

    const learned = Object.keys(state.opened).length;
    if (!learned) {
      review.innerHTML = '<div class="rv-empty"><h2>Пока нечего повторять</h2><p>Открой первое окошко. Слово сразу появится здесь в виде карточки.</p></div>';
      return;
    }
    if (!queue.length) {
      sessionOn = false;
      const future = Object.values(state.cards).map((c) => c[1]).filter((t) => t > today().getTime()).sort((a, b) => a - b);
      const next = future.length ? new Date(future[0]) : null;
      review.innerHTML = '<div class="rv-empty"><h2>На сегодня всё</h2><p>' +
        (next ? 'Следующая карточка вернётся ' + next.getDate() + ' ' + MONTHS_GEN[next.getMonth()] + '.' : 'Новые карточки появятся вместе с новыми окошками.') +
        '</p></div>';
      return;
    }

    const n = queue[0];
    const d = DAYS.find((x) => x.day === n);
    review.innerHTML =
      '<p class="rv-count">Осталось карточек: ' + queue.length + '</p>' +
      '<button type="button" class="rv-card" id="rv-card" aria-label="Показать ответ">' +
        '<span class="rv-phrase">' + esc(d.phrase) + '</span>' +
        (revealed
          ? '<span class="rv-ru">' + esc(d.ru) + '</span><span class="rv-ex">' + withMark(d.example) + '</span>'
          : '<span class="rv-hint">Вспомни перевод и нажми на карточку</span>') +
      '</button>' +
      (revealed
        ? '<div class="rv-actions"><button type="button" class="btn" id="rv-again">Ещё раз</button><button type="button" class="btn primary" id="rv-know">Знаю</button></div>'
        : '');

    $('#rv-card').addEventListener('click', () => { if (!revealed) { revealed = true; haptic(); renderReview(); } });
    if (revealed) {
      $('#rv-again').addEventListener('click', () => rate(n, false));
      $('#rv-know').addEventListener('click', () => rate(n, true));
    }
  }

  function rate(n, knew) {
    const [box] = state.cards[n];
    if (knew) {
      const nextBox = Math.min(box + 1, CFG.reviewIntervals.length - 1);
      state.cards[n] = [nextBox, today().getTime() + CFG.reviewIntervals[box] * MS_DAY];
      queue.shift();
    } else {
      state.cards[n] = [0, today().getTime()];
      queue.push(queue.shift());   // карточка возвращается в конец очереди
    }
    revealed = false;
    save();
    haptic(knew ? 'ok' : 'bad');
    renderReview(); renderBadge();
  }

  /* ---------- 7. Сюрпризы: финальный ролик и подарок на Boxing Day ---------- */

  const overlay = $('#overlay');
  const overlayBody = $('#overlay-body');
  const allOpened = () => DAYS.every((d) => state.opened[d.day]);
  // Boxing Day — следующий день после последнего окошка (26 декабря). Домика для него на карте нет.
  const isBoxingDay = () => today() >= new Date(CFG.year, CFG.month - 1, DAYS.length + 1);
  let reelTimers = [];

  function openOverlay(html, cls) {
    overlayBody.innerHTML = html;
    overlay.className = 'overlay ' + cls;
    overlay.hidden = false;
    overlay.scrollTop = 0;
  }

  function closeOverlay() {
    reelTimers.forEach(clearTimeout);
    overlay.hidden = true;
    overlayBody.innerHTML = '';
    renderSurprises();
    maybeSurprise();
  }

  // Мини-ролик «Ты молодец»: Санта пролетает, считаются окошки, сыплется конфетти. ~8 секунд.
  function showFinale() {
    state.finale = 1;
    save();
    reelTimers.forEach(clearTimeout);
    const solved = Object.keys(state.solved).length;
    const colors = ['#f2c970', '#c8343c', '#3f8a63', '#6fd3ff', '#f3e9d2'];
    let confetti = '';
    for (let i = 0; i < 40; i++) {
      confetti += '<i style="left:' + (Math.random() * 100).toFixed(1) + '%;background:' + colors[i % 5] +
        ';animation-delay:' + (3.6 + Math.random() * 2.5).toFixed(2) + 's;animation-duration:' + (2.4 + Math.random() * 2).toFixed(2) + 's"></i>';
    }
    const reel = CFG.finaleVideo
      ? '<video class="fin-video" src="' + esc(CFG.finaleVideo) + '" autoplay playsinline controls></video>'
      : '<div class="fin-reel">' +
          '<div class="fin-confetti">' + confetti + '</div>' +
          '<svg class="fin-sky" viewBox="0 0 360 110" aria-hidden="true"><circle cx="300" cy="40" r="18" fill="#f6efd9"/>' + window.Scene.santa() + '</svg>' +
          '<p class="fin-l fin-1">Ho-ho-ho!</p>' +
          '<p class="fin-l fin-2"><span id="fin-count">0</span> из ' + DAYS.length + '</p>' +
          '<p class="fin-l fin-3">окошек открыто</p>' +
          '<p class="fin-l fin-4">⭐ You’re a star! ⭐</p>' +
          '<div class="fin-bar"><i></i></div>' +
        '</div>';
    openOverlay(reel +
      '<div class="fin-card">' +
        '<h2>Well done!</h2>' +
        '<p>Ты открыл(а) все ' + DAYS.length + ' окошек: ' + DAYS.length + ' живых выражений и ' + solved + ' ' + plural(solved, ['выполненное задание', 'выполненных задания', 'выполненных заданий']) + '. Теперь этот английский — твой. Носители бы гордились!</p>' +
        '<div class="fin-actions"><button type="button" class="btn" id="fin-again">▶ Ещё раз</button><button type="button" class="btn primary" data-close>Ура!</button></div>' +
      '</div>', 'is-finale');

    $('#fin-again').addEventListener('click', showFinale);
    const count = $('#fin-count');
    if (count) {
      for (let i = 1; i <= DAYS.length; i++) reelTimers.push(setTimeout(() => { count.textContent = i; }, 2000 + i * 60));
    }
    haptic('ok');
  }

  function showBoxing() {
    const g = CFG.boxingDay || {};
    const list = DAYS.map((d) => d.phrase + ' — ' + d.ru).join('\n');
    openOverlay(
      '<div class="bx">' +
        '<p class="bx-hi">Привет-привет! 👋</p>' +
        '<p class="bx-text">Сегодня <b>Boxing Day</b>, а это традиционно время подарков. Вот и твой, открывай скорее!</p>' +
        '<button type="button" class="gift" id="gift" aria-label="Открыть подарок"><span class="gift-lid"></span><span class="gift-box"></span></button>' +
        '<p class="bx-tap" id="bx-tap">Нажми на коробку</p>' +
        '<div class="bx-inside" id="bx-inside" hidden>' +
          '<h2>' + esc(g.giftTitle || 'Подарок') + '</h2>' +
          '<p>' + esc(g.giftText || '') + '</p>' +
          (g.giftLink ? '<a class="btn primary bx-link" href="' + esc(g.giftLink) + '" target="_blank" rel="noopener">' + esc(g.giftLinkLabel || 'Забрать подарок') + '</a>' : '') +
          '<ol class="phrasebook">' + DAYS.map((d) => '<li><b>' + esc(d.phrase) + '</b> — ' + esc(d.ru) + '</li>').join('') + '</ol>' +
          '<button type="button" class="btn" id="bx-copy">Скопировать список</button>' +
          boxingHistory() +
        '</div>' +
      '</div>', 'is-boxing');

    const reveal = () => {
      $('#gift').classList.add('open');
      $('#bx-tap').hidden = true;
      $('#bx-inside').hidden = false;
    };
    if (state.boxing) { reveal(); }
    else {
      $('#gift').addEventListener('click', () => {
        state.boxing = 1;
        save();
        haptic('ok');
        $('#gift').classList.add('open');
        setTimeout(() => { reveal(); $('#bx-inside').scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 650);
      });
    }
    $('#bx-copy').addEventListener('click', () => {
      const ok = () => toast('Список скопирован');
      try { navigator.clipboard.writeText(list).then(ok, () => toast('Не получилось скопировать')); } catch (e) { toast('Не получилось скопировать'); }
    });
    const link = overlayBody.querySelector('.bx-link');
    if (link && tg && tg.openLink) link.addEventListener('click', (e) => { e.preventDefault(); tg.openLink(link.href); });
  }

  // Историческая справка внутри подарка
  function boxingHistory() {
    return '<div class="bx-history">' +
      '<h3>📜 Откуда взялся Boxing Day</h3>' +
      '<p><b>Коробки, а не бокс.</b> Название происходит от <i>Christmas box</i> — «рождественской коробки». Так в Британии называли подарок или немного денег в благодарность за работу весь год.</p>' +
      '<p><b>Выходной для слуг.</b> В богатых домах слуги работали в само Рождество: готовили и подавали праздничный ужин. Зато 26 декабря хозяева отпускали их к семьям и вручали коробку с подарками, деньгами, а часто и остатками праздничного стола.</p>' +
      '<p><b>Коробки для бедных.</b> Во время Адвента в церквях стояли ящики для пожертвований. 26 декабря, в день святого Стефана, их открывали и раздавали деньги нуждающимся. Помните «Good King Wenceslas»? Действие этой песни происходит как раз <i>on the Feast of Stephen</i>.</p>' +
      '<p><b>С 17 века до наших дней.</b> Обычай давать «рождественские коробки» почтальонам и посыльным упоминает ещё Сэмюэл Пепис в своём дневнике в 1660-х. В Викторианскую эпоху традиция окрепла, а в 1871 году Boxing Day стал официальным выходным в Англии и Уэльсе.</p>' +
      '<h3>🇬🇧 Как его проводят сейчас</h3>' +
      '<ul>' +
        '<li><b>Boxing Day sales</b> — большие распродажи, многие встают затемно, чтобы успеть.</li>' +
        '<li><b>Boxing Day football</b> — футбольные матчи, на которые ходят всей семьёй.</li>' +
        '<li><b>A Boxing Day walk</b> — долгая прогулка, чтобы «растрясти» рождественский ужин.</li>' +
        '<li><b>Leftovers</b> — доедают остатки: бутерброды с индейкой — классика 26 декабря.</li>' +
        '<li>И до сих пор многие оставляют <b>Christmas box</b> — чаевые почтальону или мусорщикам.</li>' +
      '</ul>' +
      '</div>';
  }

  function renderSurprises() {
    $('#btn-finale').hidden = !state.finale;
    $('#btn-gift').hidden = !isBoxingDay();
  }

  // Показать сюрприз сам, если пора: сначала финал (все 25 открыты), потом подарок 26-го.
  function maybeSurprise() {
    renderSurprises();
    if (!overlay.hidden || !backdrop.hidden) return;
    if (allOpened() && !state.finale) showFinale();
    else if (isBoxingDay() && !state.boxing) showBoxing();
  }

  /* ---------- служебное ---------- */

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 2200);
  }

  function setView(name) {
    const isCal = name === 'calendar';
    $('#view-calendar').hidden = !isCal;
    $('#view-review').hidden = isCal;
    $('#tab-calendar').classList.toggle('is-active', isCal);
    $('#tab-review').classList.toggle('is-active', !isCal);
    if (!isCal) { sessionOn = false; renderReview(); }
    window.scrollTo(0, 0);
  }

  function makeSnow() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const box = $('#snow');
    for (let i = 0; i < 26; i++) {
      const f = document.createElement('i');
      f.className = 'flake';
      const s = 2 + Math.random() * 3;
      f.style.cssText = 'left:' + (Math.random() * 100) + '%;width:' + s + 'px;height:' + s + 'px;animation-duration:' + (9 + Math.random() * 12) + 's;animation-delay:-' + (Math.random() * 20) + 's';
      box.appendChild(f);
    }
  }

  function setupDebug() {
    if (!(params.get('debug') || window.PREVIEW)) return;
    $('#debug').hidden = false;
    const input = $('#debug-date');
    const t = today();
    input.value = t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
    input.addEventListener('change', () => {
      const d = parseYMD(input.value);
      if (d) { testDate = d; refresh(); maybeSurprise(); }
    });
    $('#debug-all').addEventListener('click', () => {
      DAYS.forEach((d) => { state.opened[d.day] = 1; if (!state.cards[d.day]) state.cards[d.day] = [0, today().getTime()]; });
      save(); refresh();
      toast('Все окошки открыты');
    });
    $('#debug-finale').addEventListener('click', showFinale);
    $('#debug-gift').addEventListener('click', showBoxing);
    $('#debug-reset').addEventListener('click', () => {
      state = { opened: {}, solved: {}, cards: {} };
      save(); sessionOn = false; refresh();
      toast('Прогресс сброшен');
    });
  }

  function refresh() {
    renderHeader(); renderGrid(); renderBadge();
    if (!$('#view-review').hidden) { sessionOn = false; renderReview(); }
  }

  /* ---------- 6. Запуск ---------- */

  async function start() {
    const raw = await store.get(KEY);
    if (raw) {
      try { Object.assign(state, JSON.parse(raw)); } catch (e) { /* пустой прогресс */ }
    } else if (window.PREVIEW_SEED) {
      state = JSON.parse(JSON.stringify(window.PREVIEW_SEED));
    }
    makeSnow();
    setupMap();
    setupDebug();
    refresh();
    maybeSurprise();

    $('#tab-calendar').addEventListener('click', () => setView('calendar'));
    $('#tab-review').addEventListener('click', () => setView('review'));
    $('#sheet-close').addEventListener('click', closeSheet);
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeSheet(); });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (!overlay.hidden) closeOverlay(); else if (!backdrop.hidden) closeSheet();
    });
    // кнопки «Послушать» внутри заданий
    sheetBody.addEventListener('click', (e) => {
      const b = e.target.closest('[data-say]');
      if (b) speak(b.dataset.say, 0.85);
    });
    $('#overlay-close').addEventListener('click', closeOverlay);
    overlay.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeOverlay(); });
    $('#btn-finale').addEventListener('click', showFinale);
    $('#btn-gift').addEventListener('click', showBoxing);
  }

  start();
})();
