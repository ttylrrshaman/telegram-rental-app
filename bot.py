from aiogram import Bot, Dispatcher, types, Router
from aiogram.types import WebAppInfo
from aiogram.filters import Command
import database
import os
from dotenv import load_dotenv
import asyncio

load_dotenv()

BOT_TOKEN = os.getenv('BOT_TOKEN')
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()
router = Router()
dp.include_router(router)

@router.message(Command("start"))
async def start(message: types.Message):
    # Создаем кнопку для открытия Web App
    markup = types.ReplyKeyboardMarkup(
        keyboard=[
            [types.KeyboardButton(text="🏠 Open Inventory", web_app=WebAppInfo(url="https://yourdomain.com/app/index.html"))]
        ],
        resize_keyboard=True
    )
    await message.answer(
        "🔥 Welcome to CS2 Skin Rental!\n"
        "Press button below to access your inventory:",
        reply_markup=markup
    )

@router.message()
async def handle_web_app_data(message: types.Message):
    if message.web_app_data:
        data = message.web_app_data.data
        # Здесь можно обрабатывать данные от фронтенда
        await message.answer(f"Received data: {data}")

async def main():
    await dp.start_polling(bot)

if __name__ == '__main__':
    asyncio.run(main())