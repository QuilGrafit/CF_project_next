import clientPromise from '../../lib/mongodb.js';
import { HoroscopeGenerator } from '../../lib/horoscope.js';
import { sendMessage, showAds } from '../../lib/telegram.js';

import { Telegraf } from 'telegraf';
import { MongoClient } from 'mongodb';
import Keyboard from '../../lib/Keyboard.js'; // <-- ПРОВЕРЬТЕ ПУТЬ К Keyboard.js

// Переменные окружения
const BOT_TOKEN = process.env.BOT_TOKEN;
const MONGODB_URI = process.env.MONGO_URI;
const DB_NAME = process.env.MONGO_DB_NAME || 'sample_mflix'; // Имя вашей БД
const COLLECTION_NAME = process.env.MONGO_COLLECTION_NAME || 'users'; // Имя вашей коллекции

// Создаем экземпляр бота (используем его для обработки входящих обновлений)
const bot = new Telegraf(BOT_TOKEN);

// Шаблон кэширования соединения с MongoDB
let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  if (!MONGODB_URI) {
    throw new Error('Please define the MONGO_URI environment variable inside .env.local');
  }

  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db(DB_NAME);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

// --- Логика вашего бота для команд и обработки сообщений ---

bot.start(async (ctx) => {
  try {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection(COLLECTION_NAME);

    // Пример сохранения пользователя при /start
    const user = {
      id: ctx.from.id,
      username: ctx.from.username || null,
      first_name: ctx.from.first_name || null,
      last_name: ctx.from.last_name || null,
      date_started: new Date(),
    };

    // Проверяем, существует ли пользователь, и обновляем или вставляем его
    await usersCollection.updateOne(
      { id: user.id },
      { $set: user },
      { upsert: true } // Создать, если не существует
    );

    await ctx.replyWithHTML(
      `Hello ${ctx.from.first_name || 'user'}!\n\nWelcome to our Horoscope Bot.\n\n` +
      `Choose from the menu below:`,
      Keyboard.main_menu() // Используем меню из Keyboard.js
    );
    console.log(`User ${ctx.from.id} started the bot.`);
  } catch (error) {
    console.error('Error in /start handler:', error);
    await ctx.reply('Извините, произошла ошибка. Пожалуйста, попробуйте позже.');
  }
});

// Добавьте сюда другие обработчики, например, для кнопок меню
// bot.action('get_horoscope', async (ctx) => { ... });
// bot.action('settings', async (ctx) => { ... });
// bot.action('premium', async (ctx) => { ... });
// bot.action('donate_us', async (ctx) => { ... });
// bot.action('buy_ads', async (ctx) => { ... });

// Обработчик для текстовых сообщений, которые не являются командами
bot.on('text', async (ctx) => {
  if (ctx.message.text.startsWith('/')) {
    // Игнорируем другие команды, которые не были явно обработаны
    return;
  }
  // Пример ответа на обычный текст
  await ctx.reply('Извините, я пока не умею обрабатывать обычный текст. Используйте команды или кнопки меню.');
});

// --- API Route для Vercel Webhook ---

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // Telegraf обрабатывает входящее обновление
      await bot.handleUpdate(req.body); // Telegraf обрабатывает тело запроса как обновление Telegram
      res.status(200).send('OK'); // Важно отправить 200 OK, чтобы Telegram знал, что обновление получено
    } catch (error) {
      console.error('Error handling Telegram update:', error);
      res.status(500).json({ error: 'Internal Server Error' }); // Отправляем 500 в случае необработанной ошибки
    }
  } else {
    res.status(405).json({ error: 'Метод не разрешен. Используйте POST.' });
  }
}
