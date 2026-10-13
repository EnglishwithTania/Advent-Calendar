"""
Бот для адвент-календаря.

Что делает:
  /start  проверяет, подписан ли человек на канал. Если да, даёт кнопку «Открыть календарь».
          Если нет, просит подписаться и проверяет ещё раз по кнопке.
  Каждое утро с 1 по 25 декабря присылает подписчикам «Окошко дня открыто».
  26 декабря (Boxing Day) присылает сюрприз: «сегодня время подарков, открывай свой».
  /stop   отключает напоминания, /start включает снова.

Настройки берутся из файла .env (см. .env.example).
"""
import asyncio
import logging
import os
import sqlite3
from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from aiogram import Bot, Dispatcher, F
from aiogram.enums import ChatMemberStatus
from aiogram.exceptions import TelegramAPIError, TelegramForbiddenError
from aiogram.filters import Command, CommandStart
from aiogram.types import (
    CallbackQuery,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    MenuButtonWebApp,
    Message,
    WebAppInfo,
)
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.environ["BOT_TOKEN"]
CHANNEL = os.environ["CHANNEL"]            # например @speakayou_channel
WEBAPP_URL = os.environ["WEBAPP_URL"]      # адрес страницы с календарём, обязательно https
TZ = ZoneInfo(os.getenv("TZ_NAME", "Europe/Moscow"))
REMINDER_TIME = time.fromisoformat(os.getenv("REMINDER_TIME", "09:00"))
YEAR = int(os.getenv("YEAR", "2026"))
MONTH = int(os.getenv("MONTH", "12"))
DAYS = int(os.getenv("DAYS", "25"))
DB_PATH = os.getenv("DB_PATH", "users.db")

ACTIVE_STATUSES = {
    ChatMemberStatus.CREATOR,
    ChatMemberStatus.ADMINISTRATOR,
    ChatMemberStatus.MEMBER,
}

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("advent-bot")

bot = Bot(BOT_TOKEN)
dp = Dispatcher()


# ---------- маленькая база: кто подписан на напоминания ----------

def db() -> sqlite3.Connection:
    con = sqlite3.connect(DB_PATH)
    con.execute(
        "CREATE TABLE IF NOT EXISTS users ("
        "user_id INTEGER PRIMARY KEY, remind INTEGER NOT NULL DEFAULT 1)"
    )
    return con


def set_remind(user_id: int, value: bool) -> None:
    with db() as con:
        con.execute(
            "INSERT INTO users (user_id, remind) VALUES (?, ?) "
            "ON CONFLICT(user_id) DO UPDATE SET remind = excluded.remind",
            (user_id, int(value)),
        )


def remind_users() -> list[int]:
    with db() as con:
        return [r[0] for r in con.execute("SELECT user_id FROM users WHERE remind = 1")]


# ---------- проверка подписки ----------

async def is_subscriber(user_id: int) -> bool:
    try:
        member = await bot.get_chat_member(CHANNEL, user_id)
    except TelegramAPIError as e:
        # Чаще всего: бот не добавлен в канал как администратор
        log.warning("Не удалось проверить подписку %s: %s", user_id, e)
        return False
    return member.status in ACTIVE_STATUSES


def open_keyboard(text: str = "Открыть календарь") -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[[InlineKeyboardButton(text=text, web_app=WebAppInfo(url=WEBAPP_URL))]]
    )


def subscribe_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="Подписаться на канал", url=f"https://t.me/{CHANNEL.lstrip('@')}")],
            [InlineKeyboardButton(text="Я подписался(-ась)", callback_data="recheck")],
        ]
    )


async def welcome(chat_id: int, user_id: int) -> None:
    set_remind(user_id, True)
    await bot.set_chat_menu_button(chat_id=chat_id, menu_button=MenuButtonWebApp(text="Календарь", web_app=WebAppInfo(url=WEBAPP_URL)))
    await bot.send_message(
        chat_id,
        "Привет! Это адвент-календарь с британским английским.\n\n"
        f"С 1 по {DAYS} декабря каждый день открывается новый домик с заданием: "
        "живое выражение, угадай фильм по отрывку, рождественская песня, найди пару, чтение о традициях. "
        "Выражения дня попадают в карточки для повторения.\n\n"
        "Каждое утро я буду напоминать, что окошко открылось. Остановить напоминания: /stop",
        reply_markup=open_keyboard(),
    )


# ---------- команды ----------

@dp.message(CommandStart())
async def on_start(message: Message) -> None:
    if await is_subscriber(message.from_user.id):
        await welcome(message.chat.id, message.from_user.id)
    else:
        await message.answer(
            "Календарь доступен подписчикам канала. Подпишись и нажми «Я подписался(-ась)».",
            reply_markup=subscribe_keyboard(),
        )


@dp.callback_query(F.data == "recheck")
async def on_recheck(call: CallbackQuery) -> None:
    if await is_subscriber(call.from_user.id):
        await call.answer("Отлично, ты в списке!")
        await welcome(call.message.chat.id, call.from_user.id)
    else:
        await call.answer("Подписки пока не видно. Подпишись и нажми ещё раз.", show_alert=True)


@dp.message(Command("stop"))
async def on_stop(message: Message) -> None:
    set_remind(message.from_user.id, False)
    await message.answer("Напоминания отключены. Вернуть их можно командой /start.")


@dp.message(Command("help"))
async def on_help(message: Message) -> None:
    await message.answer("/start открыть календарь\n/stop отключить напоминания")


# ---------- утренняя рассылка ----------

def todays_window(now: datetime) -> int | None:
    """Номер окошка на сегодня или None, если сегодня не декабрьский день календаря."""
    d = now.date()
    if d.year == YEAR and d.month == MONTH and 1 <= d.day <= DAYS:
        return d.day
    return None


def is_boxing_day(now: datetime) -> bool:
    """Boxing Day — следующий день после последнего окошка (26 декабря)."""
    d = now.date()
    return d.year == YEAR and d.month == MONTH and d.day == DAYS + 1


BOXING_TEXT = (
    "Привет-привет! 🎁\n\n"
    "Сегодня Boxing Day, а это традиционно время подарков. "
    "Вот и твой, открывай скорее!"
)


def next_run(now: datetime) -> datetime:
    run = datetime.combine(now.date(), REMINDER_TIME, tzinfo=TZ)
    return run if run > now else run + timedelta(days=1)


async def send_daily() -> None:
    now = datetime.now(TZ)
    n = todays_window(now)
    if n is not None:
        text, button = f"Окошко {n} открыто. Заглянем?", "Открыть окошко"
    elif is_boxing_day(now):
        text, button = BOXING_TEXT, "Открыть подарок"
    else:
        return
    sent = 0
    for user_id in remind_users():
        try:
            if not await is_subscriber(user_id):
                continue
            await bot.send_message(user_id, text, reply_markup=open_keyboard(button))
            sent += 1
        except TelegramForbiddenError:
            set_remind(user_id, False)   # человек заблокировал бота
        except TelegramAPIError as e:
            log.warning("Не отправилось %s: %s", user_id, e)
        await asyncio.sleep(0.05)        # не превышаем лимиты Telegram
    log.info("Рассылка «%s»: отправлено %s сообщений", button, sent)


async def scheduler() -> None:
    while True:
        run = next_run(datetime.now(TZ))
        log.info("Следующая рассылка: %s", run.isoformat())
        await asyncio.sleep((run - datetime.now(TZ)).total_seconds())
        await send_daily()


async def main() -> None:
    asyncio.create_task(scheduler())
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
