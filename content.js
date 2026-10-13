/*
  ВСЁ СОДЕРЖИМОЕ КАЛЕНДАРЯ ЖИВЁТ В ЭТОМ ФАЙЛЕ.
  Чтобы поменять слово, текст или задание, правь только его. Код трогать не нужно.

  25 окошек, 5 типов заданий по очереди:
    vocab    лексика: выражение дня и вопрос
    film     угадай рождественский фильм по отрывку (или по описанию сцены)
    match    найди пару: картинка + слово
    reading  чтение: короткий текст с вопросами или «правда или выдумка»
    song     рождественская песня: послушай и вставь пропущенные слова

  Общие поля каждого окошка:
    day      номер окошка (1-25)
    type     тип задания (см. выше)
    icon     эмодзи окошка
    phrase   выражение дня. Оно же попадает в карточки для повторения
    ru       перевод
    example  пример. Часть в [[двойных скобках]] подсветится
    note     короткая заметка от тебя (по-русски)
    task     само задание. Поля зависят от типа, примеры ниже

  Вопрос с вариантами (встречается в vocab, film, reading):
    { q: 'текст', options: ['а', 'б', 'в'], answer: 1, why: 'пояснение' }   answer: номер верного, 0 = первый

  ВИДЕО ДЛЯ ФИЛЬМОВ. Отрывки из фильмов защищены авторским правом, поэтому их нельзя
  просто положить в папку. Вставь в поле video ссылку на ОФИЦИАЛЬНЫЙ трейлер на YouTube
  (канал студии), например 'https://www.youtube.com/watch?v=XXXXXXXXXXX'.
  Пока поле пустое, вместо видео показывается описание сцены (scene) и подсказка-эмодзи.

  АУДИО ДЛЯ ПЕСЕН. Все песни здесь старинные, их тексты свободны от авторских прав.
  А вот записи исполнителей защищены. Лучше всего запиши песню сама (хоть на диктофон),
  положи файл в папку audio и впиши путь, например audio: 'audio/jingle-bells.mp3'.
  Пока поле пустое, кнопка «Послушать» читает строчки голосом телефона.
*/

window.CONFIG = {
  title: 'Британский декабрь',
  subtitle: 'English with SpeakaYou',
  year: 2026,
  month: 12,        // месяц, в котором открываются окошки (12 = декабрь)
  reviewIntervals: [1, 2, 4, 7, 14],   // через сколько дней карточка вернётся на повторение

  // Финальное «видео», когда открыты все 25 окошек.
  // Пусто = встроенный анимированный ролик. Можно вписать свой файл: 'video/well-done.mp4'
  finaleVideo: '',

  // Сюрприз 26 декабря (Boxing Day). Домика на карте нет, подарок появляется сам.
  // giftText и giftLink поменяй на свой подарок: промокод, ссылку на гайд, на урок и т.п.
  boxingDay: {
    giftTitle: 'Твой разговорник декабря',
    giftText: 'Все 25 выражений календаря в одном списке. Сохрани и пользуйся весь год!',
    giftLink: '',          // например 'https://example.com/my-gift.pdf'
    giftLinkLabel: 'Забрать подарок'
  }
};

window.DAYS = [
  /* ---------- неделя 1 ---------- */
  {
    day: 1, type: 'vocab', icon: '🎶',
    phrase: 'get into the festive spirit',
    ru: 'настроиться на праздничный лад',
    example: 'Put some carols on, I need to [[get into the festive spirit]].',
    note: 'Festive звучит естественнее, чем Christmassy, когда речь о настроении.',
    task: { q: 'Put some carols on, I need to ___ into the festive spirit.', options: ['go', 'get', 'take'], answer: 1, why: 'Get into the spirit: войти в настроение.' }
  },
  {
    day: 2, type: 'film', icon: '🏠',
    phrase: 'be home alone',
    ru: 'остаться дома одному',
    example: 'My parents are away, so I’m [[home alone]] this weekend.',
    note: 'После фильма фраза стала крылатой. А clumsy burglars из описания: неуклюжие грабители.',
    task: {
      video: '',
      emoji: '🏠 👦 ✈️ 🪤 🤕',
      scene: 'An eight-year-old boy wakes up and finds that his huge family has flown to Paris without him. At first he’s thrilled. Then two clumsy burglars try to break into the house…',
      q: 'Which Christmas film is it?',
      options: ['Home Alone', 'The Polar Express', 'Elf'], answer: 0,
      why: 'Home Alone (1990), «Один дома».'
    }
  },
  {
    day: 3, type: 'match', icon: '✨',
    phrase: 'fairy lights',
    ru: 'гирлянда (с лампочками)',
    example: 'Can you help me untangle the [[fairy lights]]?',
    note: 'В Британии fairy lights, в Америке Christmas lights. Untangle: распутать, вечная декабрьская проблема.',
    task: {
      title: 'Наряди ёлку: соедини картинку и слово',
      pairs: [
        { pic: 'tinsel', word: 'tinsel', ru: 'мишура' },
        { pic: 'bauble', word: 'bauble', ru: 'ёлочный шар' },
        { pic: 'fairylights', word: 'fairy lights', ru: 'гирлянда' },
        { pic: 'wreath', word: 'wreath', ru: 'венок' }
      ]
    }
  },
  {
    day: 4, type: 'reading', icon: '🍗',
    phrase: 'in advance',
    ru: 'заранее',
    example: 'Book a table [[in advance]], restaurants are packed in December.',
    note: 'Book in advance, pay in advance. А в письмах часто пишут Thanks in advance: заранее спасибо.',
    task: {
      title: 'Рождество с ведёрком курицы',
      text: [
        'In Japan, Christmas isn’t a traditional holiday, but it has its own very modern tradition: fried chicken.',
        'In 1974, KFC launched an advertising campaign called “Kentucky for Christmas”, and it was a huge hit. Today, millions of Japanese families eat a KFC “Christmas bucket” on Christmas Eve.',
        'It’s so popular that many people order their meal weeks [[in advance]]. Otherwise, they might have to queue for hours!'
      ],
      gloss: [['launch a campaign', 'запустить кампанию'], ['a huge hit', 'огромный успех'], ['queue', 'стоять в очереди']],
      quiz: [
        { q: 'When did the tradition start?', options: ['in the 1950s', 'in 1974', 'in 2004'], answer: 1, why: 'Рекламная кампания KFC вышла в 1974 году.' },
        { q: 'Why do people order weeks in advance?', options: ['It’s cheaper', 'To avoid long queues', 'It’s the law'], answer: 1, why: 'Иначе можно простоять в очереди несколько часов.' }
      ]
    }
  },
  {
    day: 5, type: 'song', icon: '🔔',
    phrase: 'I have to dash',
    ru: 'мне пора бежать',
    example: 'Sorry, [[I have to dash]], my train’s at six!',
    note: 'Dash: мчаться. Британцы говорят так, когда спешат уйти. Песня, кстати, начинается с этого слова.',
    task: {
      song: 'Jingle Bells', by: 'James Lord Pierpont, 1857',
      audio: '',
      lines: ['Dashing through the {snow}', 'In a one-horse open {sleigh}', 'O’er the fields we go', '{Laughing} all the way'],
      extra: ['rain', 'sledge', 'crying'],
      gloss: [['dash', 'мчаться'], ['sleigh', 'сани'], ['o’er = over', 'над, по']]
    }
  },

  /* ---------- неделя 2 ---------- */
  {
    day: 6, type: 'vocab', icon: '🧣',
    phrase: 'wrap up warm',
    ru: 'тепло одеться',
    example: '[[Wrap up warm]], it’s freezing out there!',
    note: 'Так говорят на прощание, когда на улице холодно: забота в одной фразе.',
    task: { q: 'It’s bitter outside, so ___ up warm.', options: ['put', 'wrap', 'carry'], answer: 1, why: 'Wrap up warm: закутаться потеплее.' }
  },
  {
    day: 7, type: 'film', icon: '💚',
    phrase: 'a grinch',
    ru: 'зануда, который портит всем праздник',
    example: 'Don’t be such a [[grinch]], come to the party!',
    note: 'Герой книги доктора Сьюза давно стал нарицательным: так называют любого, кто ворчит на Рождество.',
    task: {
      video: '',
      emoji: '💚 🏔️ 🐶 🎁 🎅',
      scene: 'A grumpy green creature lives on a mountain above a cheerful little town. He can’t stand all the singing and presents, so on Christmas Eve he dresses up as Santa and steals everything.',
      q: 'Which Christmas film is it?',
      options: ['Arthur Christmas', 'The Grinch', 'Klaus'], answer: 1,
      why: 'The Grinch, «Гринч — похититель Рождества».'
    }
  },
  {
    day: 8, type: 'match', icon: '🦃',
    phrase: 'pigs in blankets',
    ru: 'сосиски в беконе',
    example: 'The [[pigs in blankets]] always disappear first.',
    note: 'Буквально «поросята в одеялах». Для многих британцев это главное блюдо рождественского ужина.',
    task: {
      title: 'Рождественский ужин по-британски',
      pairs: [
        { pic: 'turkey', word: 'roast turkey', ru: 'запечённая индейка' },
        { pic: 'pigs', word: 'pigs in blankets', ru: 'сосиски в беконе' },
        { pic: 'sprouts', word: 'Brussels sprouts', ru: 'брюссельская капуста' },
        { pic: 'pudding', word: 'Christmas pudding', ru: 'рождественский пудинг' }
      ]
    }
  },
  {
    day: 9, type: 'reading', icon: '🧹',
    phrase: 'believe it or not',
    ru: 'хотите верьте, хотите нет',
    example: '[[Believe it or not]], Norwegians hide their brooms on Christmas Eve.',
    note: 'Удобная фраза, чтобы начать рассказ о чём-то удивительном.',
    task: {
      title: 'Правда или выдумка?',
      intro: 'Четыре рождественские традиции разных стран. Одна выдумана. Какая?',
      facts: [
        { s: 'In Iceland, 13 mischievous “Yule Lads” visit children on the 13 nights before Christmas.', t: true, why: 'Правда. Послушным детям они кладут в ботинок на окне сладости, а непослушным — картошку.' },
        { s: 'In Norway, people hide their brooms on Christmas Eve so that witches can’t steal them.', t: true, why: 'Правда. По старому поверью в эту ночь по небу летают ведьмы.' },
        { s: 'In Finland, it’s traditional to give your neighbours a live goat for Christmas.', t: false, why: 'Выдумка. Хотя финский Санта называется Joulupukki, буквально «рождественский козёл».' },
        { s: 'In Ukraine, some people decorate Christmas trees with little spider webs for good luck.', t: true, why: 'Правда. Это из легенды о паучке, который украсил ёлку бедной семьи.' }
      ]
    }
  },
  {
    day: 10, type: 'song', icon: '🌿',
    phrase: '’tis the season',
    ru: 'праздничная пора же!',
    example: 'Queues everywhere and I’m skint… well, [[’tis the season]]!',
    note: '’Tis = it is, старинная форма. Фразу любят в рекламе и говорят с иронией: ’Tis the season to be stressed.',
    task: {
      song: 'Deck the Halls', by: 'traditional, Welsh melody',
      audio: '',
      lines: ['Deck the halls with boughs of {holly}', 'Fa la la la la, la la la la', '’Tis the season to be {jolly}', 'Fa la la la la, la la la la'],
      extra: ['jelly', 'lolly'],
      gloss: [['deck', 'украшать'], ['boughs', 'ветви'], ['jolly', 'весёлый (и британское «очень»: jolly good)']]
    }
  },

  /* ---------- неделя 3 ---------- */
  {
    day: 11, type: 'vocab', icon: '☕',
    phrase: 'Fancy a cuppa?',
    ru: 'Чайку?',
    example: '[[Fancy a cuppa?]] I’ve just boiled the kettle.',
    note: 'Cuppa = cup of tea. Fancy a…? значит «хочешь…?», подходит к чему угодно: Fancy a walk?',
    task: { q: 'Which is a natural reply to “Fancy a cuppa?”', options: ['I haven’t got a cup.', 'Go on then, I’d love one.', 'It’s quarter past four.'], answer: 1, why: 'Go on then = «ну давай, не откажусь».' }
  },
  {
    day: 12, type: 'film', icon: '💌',
    phrase: 'have a crush on someone',
    ru: 'быть тайно влюблённым',
    example: 'I think Mark [[has a crush on]] Juliet.',
    note: 'Crush: лёгкая влюблённость, часто безответная. Работает и для звёзд: I had a crush on Hugh Grant.',
    task: {
      video: '',
      emoji: '🇬🇧 💌 🪧 💃 🎄',
      scene: 'Several love stories in London in the weeks before Christmas. The British Prime Minister dances around 10 Downing Street, and a man silently shows his best friend’s wife a series of handwritten cards at her front door.',
      q: 'Which Christmas film is it?',
      options: ['The Holiday', 'Last Christmas', 'Love Actually'], answer: 2,
      why: 'Love Actually (2003), «Реальная любовь». Очень британское кино.'
    }
  },
  {
    day: 13, type: 'match', icon: '👑',
    phrase: 'a Christmas jumper',
    ru: 'праздничный свитер',
    example: 'It’s Christmas Jumper Day at work, so I’m wearing the reindeer one.',
    note: 'В британском jumper это свитер. В американском свитер — sweater, а праздничный там зовут ugly sweater.',
    task: {
      title: 'Что найдёшь за рождественским столом',
      pairs: [
        { pic: 'cracker', word: 'Christmas cracker', ru: 'хлопушка' },
        { pic: 'crown', word: 'paper crown', ru: 'бумажная корона' },
        { pic: 'jumper', word: 'Christmas jumper', ru: 'праздничный свитер' },
        { pic: 'stocking', word: 'stocking', ru: 'носок для подарков' }
      ]
    }
  },
  {
    day: 14, type: 'reading', icon: '📺',
    phrase: 'tune in',
    ru: 'включить (ТВ, радио), чтобы посмотреть или послушать',
    example: 'Don’t forget to [[tune in]] at three!',
    note: 'Говорят и про подкасты, и про стримы: Tune in next week!',
    task: {
      title: 'Ровно в три часа',
      text: [
        'Every year at 3 pm on Christmas Day, millions of people in the UK [[tune in]] to watch the King’s Christmas message.',
        'The tradition began in 1932, when King George V gave the first royal Christmas broadcast on the radio. Queen Elizabeth II first appeared on TV in 1957.',
        'For many families, the speech is part of the day’s routine: presents in the morning, a big lunch, and then everyone gathers on the sofa at three.'
      ],
      gloss: [['broadcast', 'трансляция, эфир'], ['routine', 'привычный распорядок'], ['gather', 'собираться']],
      quiz: [
        { q: 'What time is the King’s message on?', options: ['at noon', 'at 3 pm', 'at 9 pm'], answer: 1, why: 'В 15:00, сразу после рождественского обеда.' },
        { q: 'How did the tradition start?', options: ['on TV in 1957', 'on the radio in 1932', 'in a newspaper'], answer: 1, why: 'Первое обращение прозвучало по радио в 1932 году.' }
      ]
    }
  },
  {
    day: 15, type: 'song', icon: '🎄',
    phrase: 'Lovely!',
    ru: 'Чудесно! / Отлично, спасибо!',
    example: '“Here’s your tea.” “[[Lovely]], thanks!”',
    note: 'Самое британское слово: lovely weather, lovely to see you и просто Lovely! вместо «Отлично».',
    task: {
      song: 'O Christmas Tree', by: 'traditional, German carol',
      audio: '',
      lines: ['O Christmas tree, O Christmas tree', 'How {lovely} are thy {branches}', 'O Christmas tree, O Christmas tree', 'How {lovely} are thy branches'],
      extra: ['lonely', 'brunches'],
      gloss: [['thy', 'твой (старинное your)'], ['branches', 'ветви']]
    }
  },

  /* ---------- неделя 4 ---------- */
  {
    day: 16, type: 'vocab', icon: '😊',
    phrase: 'be chuffed to bits',
    ru: 'быть страшно довольным',
    example: 'I’m [[chuffed to bits]] with my present!',
    note: 'To bits усиливает: очень-очень. Можно и просто chuffed.',
    task: { q: 'Your friend loved your present. She says she’s…', options: ['chuffed to bits', 'run off her feet', 'a bit nippy'], answer: 0, why: 'Chuffed to bits = в полном восторге.' }
  },
  {
    day: 17, type: 'film', icon: '🧝',
    phrase: 'a fish out of water',
    ru: 'не в своей тарелке',
    example: 'In New York, Buddy is [[a fish out of water]].',
    note: 'О человеке в непривычной обстановке: On my first day at work I felt like a fish out of water.',
    task: {
      video: '',
      emoji: '🧝‍♂️ 🗽 🍝 🍁 🎅',
      scene: 'A very tall man who was raised by Santa’s elves at the North Pole travels to New York to find his real dad. He wears yellow tights, eats spaghetti with maple syrup and is amazed by a revolving door.',
      q: 'Which Christmas film is it?',
      options: ['Elf', 'The Santa Clause', 'Jingle All the Way'], answer: 0,
      why: 'Elf (2003), «Эльф».'
    }
  },
  {
    day: 18, type: 'match', icon: '🛷',
    phrase: 'go sledging',
    ru: 'кататься на санках',
    example: 'It’s snowing! Let’s [[go sledging]] in the park.',
    note: 'Британское sledge, американское sled. Bobble hat: шапка с помпоном.',
    task: {
      title: 'Собираемся на зимнюю прогулку',
      pairs: [
        { pic: 'mittens', word: 'mittens', ru: 'варежки' },
        { pic: 'bobblehat', word: 'bobble hat', ru: 'шапка с помпоном' },
        { pic: 'sledge', word: 'sledge', ru: 'санки' },
        { pic: 'snowman', word: 'snowman', ru: 'снеговик' }
      ]
    }
  },
  {
    day: 19, type: 'reading', icon: '🎉',
    phrase: 'pull a cracker',
    ru: 'дёрнуть хлопушку',
    example: 'We [[pulled the crackers]] and put on the paper hats.',
    note: 'Cracker тут не печенье, а хлопушка с бумажной короной и шуткой внутри. Тянут вдвоём.',
    task: {
      title: 'Британское Рождество: правда или выдумка?',
      intro: 'Одна из этих традиций выдумана. Найдёшь?',
      facts: [
        { s: 'At Christmas dinner, Brits pull crackers and wear the paper crowns that fall out of them.', t: true, why: 'Правда. И читают вслух ужасные шутки из хлопушек.' },
        { s: 'Children leave a mince pie and a glass of sherry for Father Christmas, and a carrot for the reindeer.', t: true, why: 'Правда. Молоко с печеньем — это скорее американская версия.' },
        { s: 'Boxing Day got its name from boxing matches held on 26 December.', t: false, why: 'Выдумка. Название от коробок, christmas boxes: 26-го дарили подарки и деньги слугам и работникам.' },
        { s: 'On Christmas morning, hundreds of people in fancy dress swim in the freezing sea for charity.', t: true, why: 'Правда. Christmas Day swim проходит в десятках прибрежных городов.' }
      ]
    }
  },
  {
    day: 20, type: 'song', icon: '🐦',
    phrase: 'Twelfth Night',
    ru: 'Двенадцатая ночь (5 января)',
    example: 'We always take the decorations down on [[Twelfth Night]].',
    note: 'Двенадцать дней Рождества длятся с 25 декабря по 5 января. По британской примете украшения надо снять до Двенадцатой ночи, иначе — к неудаче.',
    task: {
      song: 'The Twelve Days of Christmas', by: 'traditional, English carol',
      audio: '',
      lines: ['On the {first} day of Christmas', 'My true {love} sent to me', 'A {partridge} in a pear tree'],
      extra: ['fist', 'glove', 'parrot'],
      gloss: [['true love', 'любимый человек'], ['partridge', 'куропатка'], ['pear tree', 'груша (дерево)']]
    }
  },

  /* ---------- финал ---------- */
  {
    day: 21, type: 'vocab', icon: '🍽️',
    phrase: 'tuck in',
    ru: 'налетай, ешь с аппетитом',
    example: 'Dinner’s ready, [[tuck in]] before it gets cold!',
    note: 'Хозяйка говорит это гостям. Тёплое и неформальное слово.',
    task: { q: 'Dinner’s ready. Come on, ___ in!', options: ['tuck', 'take', 'tie'], answer: 0, why: 'Tuck in = приступайте к еде.' }
  },
  {
    day: 22, type: 'film', icon: '👻',
    phrase: 'a Scrooge',
    ru: 'скряга',
    example: 'My boss is such a [[Scrooge]], no Christmas bonus again!',
    note: 'Bah, humbug! — фирменная фраза Скруджа из повести Диккенса. Так ворчат на праздничную суету.',
    task: {
      video: '',
      emoji: '👻 👻 👻 💰 🕯️ 🐸',
      scene: 'On Christmas Eve, a mean old moneylender in Victorian London is visited by three ghosts. In this version, a frog plays his poor clerk and a pig plays the clerk’s wife.',
      q: 'Which Christmas film is it?',
      options: ['The Nightmare Before Christmas', 'The Muppet Christmas Carol', 'Paddington'], answer: 1,
      why: 'The Muppet Christmas Carol (1992) по «Рождественской песни» Диккенса. В Британии его пересматривают каждый год.'
    }
  },
  {
    day: 23, type: 'match', icon: '🍷',
    phrase: 'grab a mulled wine',
    ru: 'взять глинтвейн',
    example: 'Let’s [[grab a mulled wine]] at the Christmas market.',
    note: 'Grab a… значит «взять по-быстрому»: grab a coffee, grab a bite. А под омелой (mistletoe) по традиции целуются.',
    task: {
      title: 'Прогулка по рождественской ярмарке',
      pairs: [
        { pic: 'mulledwine', word: 'mulled wine', ru: 'глинтвейн' },
        { pic: 'mincepie', word: 'mince pie', ru: 'пирожок с сухофруктами' },
        { pic: 'gingerbread', word: 'gingerbread man', ru: 'пряничный человечек' },
        { pic: 'mistletoe', word: 'mistletoe', ru: 'омела' }
      ]
    }
  },
  {
    day: 24, type: 'reading', icon: '📚',
    phrase: 'curl up with a good book',
    ru: 'уютно устроиться с книгой',
    example: 'All I want tonight is to [[curl up with a good book]].',
    note: 'Curl up: свернуться калачиком. A night in: вечер дома, противоположность a night out.',
    task: {
      title: 'Книжный потоп',
      text: [
        'In Iceland, the most popular Christmas present is a book. Most new books come out in the autumn, just in time for Jólabókaflóð, the “Christmas Book Flood”.',
        'On Christmas Eve, Icelanders exchange books and then spend the evening [[curled up]] in bed or on the sofa, reading and eating chocolate.',
        'Sounds like the perfect night in, doesn’t it?'
      ],
      gloss: [['come out', 'выходить (о книгах, фильмах)'], ['exchange', 'обмениваться'], ['a night in', 'вечер дома']],
      quiz: [
        { q: 'What do Icelanders do on Christmas Eve?', options: ['go skiing', 'read their new books', 'sing in the street'], answer: 1, why: 'Дарят друг другу книги и читают весь вечер.' },
        { q: '“A night in” means…', options: ['an evening at home', 'a night in a hotel', 'a late party'], answer: 0, why: 'A night in = вечер дома, а a night out = вечер вне дома.' }
      ]
    }
  },
  {
    day: 25, type: 'song', icon: '🎅',
    phrase: 'Happy Christmas!',
    ru: 'С Рождеством!',
    example: '[[Happy Christmas!]] Hope you have a lovely day.',
    note: 'Happy Christmas в Британии говорят очень часто. Merry Christmas тоже правильно, а в открытках пишут Season’s greetings.',
    task: {
      song: 'We Wish You a Merry Christmas', by: 'traditional, English carol',
      audio: '',
      lines: ['We wish you a merry Christmas', 'We wish you a merry Christmas', 'We wish you a merry Christmas', 'And a happy New {Year}', 'Good {tidings} we bring', 'To you and your {kin}'],
      extra: ['beer', 'tickets', 'king'],
      gloss: [['good tidings', 'добрые вести'], ['kin', 'родня, близкие']]
    }
  }
];
