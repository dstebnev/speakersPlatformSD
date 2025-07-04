import os
import asyncio
from telegram import Update, WebAppInfo, MenuButtonWebApp
from telegram.ext import Application, CommandHandler, ContextTypes

TOKEN = os.getenv("BOT_TOKEN")
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://example.com")

WELCOME_TEXT = (
    "Привет! Это бот Speakers Platform. "
    "Через нашу мини-аппу ты можешь посмотреть расписание выступлений и спикеров. "
    "Нажми кнопку 'MiniApp' в меню, чтобы открыть мини‑приложение."
)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(WELCOME_TEXT)

async def setup_menu(app: Application) -> None:
    button = MenuButtonWebApp(text="MiniApp", web_app=WebAppInfo(url=WEBAPP_URL))
    await app.bot.set_chat_menu_button(menu_button=button)

async def main() -> None:
    if not TOKEN:
        raise RuntimeError("BOT_TOKEN environment variable is not set")

    app = Application.builder().token(TOKEN).build()
    app.add_handler(CommandHandler("start", start))

    await setup_menu(app)
    await app.run_polling()

if __name__ == "__main__":
    asyncio.run(main())
