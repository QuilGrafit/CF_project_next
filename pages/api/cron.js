// pages/api/cron.js
import { MongoClient } from 'mongodb';
import { Telegraf } from 'telegraf';
import HoroscopeGenerator from '../../lib/horoscope.js';
import { sendMessage, showAds } from '../../lib/telegram.js';
import Keyboard from '../../lib/Keyboard.js'; // Импортируем Keyboard для кнопки Share
import { DateTime } from 'luxon';

const BOT_TOKEN = process.env.BOT_TOKEN;
const MONGODB_URI = process.env.MONGO_URI;
const DB_NAME = process.env.MONGO_DB_NAME || 'AstroBotDB';
const COLLECTION_NAME = process.env.MONGO_COLLECTION_NAME || 'users';

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

// Создаем инстанс бота для доступа к botInfo
const bot = new Telegraf(BOT_TOKEN);

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { db } = await connectToDatabase();
        const usersCollection = db.collection(COLLECTION_NAME);

        const today = DateTime.now().startOf('day');

        // Инициализируем botInfo, чтобы получить username для кнопки Share
        if (!bot.botInfo) {
            await bot.telegram.getMe().then((me) => {
                bot.botInfo = me;
                console.log(`Cron job bot username initialized: @${me.username}`);
            });
        }

        const users = await usersCollection.find({ daily_notifications_enabled: true }).toArray();
        console.log(`Found ${users.length} users with daily notifications enabled for cron job.`);

        for (const user of users) {
            try {
                if (user.last_horoscope_date && DateTime.fromJSDate(user.last_horoscope_date).startOf('day').equals(today)) {
                    console.log(`User ${user._id} already received horoscope today. Skipping.`);
                    continue;
                }

                const horoscope = HoroscopeGenerator.generate(user, user.language);
                const shareBtn = Keyboard.share_bot_keyboard(bot.botInfo.username, user.language); // Передаем bot.botInfo.username и язык
                const supportBtn = Markup.inlineKeyboard([
                    [Markup.button.callback(user.language === 'ru' ? "❤️ Поддержать Проект" : "❤️ Support Project", "show_donate")]
                ]);

                const combinedMarkup = Markup.inlineKeyboard([
                    ...shareBtn.reply_markup.inline_keyboard,
                    ...supportBtn.reply_markup.inline_keyboard
                ]);

                await sendMessage(
                    user._id,
                    horoscope,
                    { reply_markup: combinedMarkup.reply_markup }
                );
                
                await showAds(user._id, user.language);

                await usersCollection.updateOne({ _id: user._id }, { $set: { last_horoscope_date: today.toJSDate() } });
                console.log(`Sent daily horoscope to user ${user._id}.`);

            } catch (userError) {
                console.error(`Error sending horoscope to user ${user._id}:`, userError);
            }
        }

        res.status(200).json({ message: 'Daily horoscopes processed successfully.' });
    } catch (error) {
        console.error('Error in cron job handler:', error);
        res.status(500).json({ error: 'Internal Server Error during cron job' });
    }
}
