// pages/api/webhook.js
import { Telegraf, Markup, session } from 'telegraf';
import { message } from 'telegraf/filters';
import { MongoClient } from 'mongodb';
import { DateTime } from 'luxon'; // Используется для работы со временем/датами
import HoroscopeGenerator from '../../lib/horoscope.js'; // Ваш модуль для генерации гороскопов
import Keyboard from '../../lib/Keyboard.js'; // Дефолтный импорт всех функций клавиатуры
import TEXTS from '../../texts.js'; // !!! ВАЖНО: Правильный импорт TEXTS из отдельного файла
import { sendMessage, showAds } from '../../lib/telegram.js'; // Ваши утилиты для Telegram

// Загрузка переменных окружения
const BOT_TOKEN = process.env.BOT_TOKEN;
const MONGO_URI = process.env.MONGO_URI;
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || 'sample_mflix';
const USERS_COLLECTION_NAME = process.env.MONGO_COLLECTION_NAME || 'users';
const TON_WALLET_ADDRESS = process.env.TON_WALLET_ADDRESS;

if (!BOT_TOKEN) throw new Error('BOT_TOKEN must be provided!');
if (!MONGO_URI) throw new Error('MONGO_URI must be provided!');

const bot = new Telegraf(BOT_TOKEN);
let usersCollection;

// Инициализация HoroscopeGenerator
const horoscopeGenerator = new HoroscopeGenerator();

// MongoDB connection setup
async function connectToMongo() {
    if (usersCollection) {
        return; // Already connected
    }
    try {
        const client = new MongoClient(MONGO_URI);
        await client.connect();
        const db = client.db(MONGO_DB_NAME);
        usersCollection = db.collection(USERS_COLLECTION_NAME);
        console.log("MongoDB connected and collection obtained successfully!");
    } catch (error) {
        console.error("Failed to connect to MongoDB:", error);
        // В продакшене, возможно, стоит выбросить ошибку или gracefully завершить работу
        throw error;
    }
}

// Middleware для обеспечения подключения к MongoDB
bot.use(async (ctx, next) => {
    if (!usersCollection) {
        await connectToMongo();
    }
    await next();
});

// Middleware для получения или создания пользователя
bot.use(async (ctx, next) => {
    const userId = ctx.from.id;
    let user = await usersCollection.findOne({ user_id: userId });

    if (!user) {
        user = {
            user_id: userId,
            username: ctx.from.username,
            language: 'ru', // Default language
            registration_date: new Date(),
            last_activity: new Date(),
            current_state: null,
            chosen_sign: null,
        };
        await usersCollection.insertOne(user);
        console.log(`New user registered: ${userId}`);
    } else {
        await usersCollection.updateOne(
            { user_id: userId },
            { $set: { last_activity: new Date() } }
        );
    }
    ctx.state.user = user; // Сохраняем пользователя в ctx.state для удобства
    await next();
});

// Helper to get user language with fallback
const getUserLanguage = (ctx) => {
    const userLanguage = ctx.state.user.language;
    if (!userLanguage || !TEXTS[userLanguage]) {
        console.warn(`Language '${userLanguage}' not found in TEXTS for user ${ctx.from.id}. Falling back to 'ru'.`);
        return 'ru';
    }
    return userLanguage;
};

// States (перенесены сюда из вашей предыдущей версии)
const STEPS = {
    CHOOSE_SIGN: 'choose_sign',
    CHOOSE_DURATION: 'choose_duration',
};


// --- Handlers ---

bot.start(async (ctx) => {
    try {
        const userLanguage = getUserLanguage(ctx);
        await usersCollection.updateOne(
            { user_id: ctx.from.id },
            { $set: { current_state: null, chosen_sign: null } }
        );
        // Используем функции из объекта Keyboard
        await ctx.reply(TEXTS[userLanguage].welcome_message, Keyboard.main_menu(userLanguage));
    } catch (error) {
        console.error("Error in /start handler:", error);
        const userLanguage = getUserLanguage(ctx); // Повторно получаем на случай, если ошибка была до установки userLanguage
        await ctx.reply(TEXTS[userLanguage]?.error_message || "Произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте еще раз позже.");
    }
});

bot.hears(message('text'), async (ctx) => { // Используем message('text') фильтр
    const userLanguage = getUserLanguage(ctx);
    const texts = TEXTS[userLanguage];
    const user = ctx.state.user; // Получаем объект пользователя из ctx.state

    // Главное меню
    if (ctx.message.text === texts.get_horoscope) {
        user.current_state = STEPS.CHOOSE_SIGN;
        await usersCollection.updateOne({ user_id: user.user_id }, { $set: { current_state: STEPS.CHOOSE_SIGN } });
        return ctx.reply(texts.choose_sign, Keyboard.zodiac_signs_menu(userLanguage));
    } else if (ctx.message.text === texts.settings) {
        // Логика для настроек
        return ctx.reply("Настройки пока не реализованы.", Keyboard.main_menu(userLanguage)); // TODO: implement settings
    } else if (ctx.message.text === texts.about_us) {
        // Логика для "О нас"
        return ctx.reply("Информация о боте.", Keyboard.main_menu(userLanguage)); // TODO: implement about us
    } else if (ctx.message.text === texts.ton_wallet) {
        // Логика для TON кошелька
        return ctx.reply(`TON кошелек: ${TON_WALLET_ADDRESS}`, Keyboard.main_menu(userLanguage)); // Используем TON_WALLET_ADDRESS из .env
    } else if (ctx.message.text === texts.share_bot) {
        // Логика для "Поделиться ботом"
        const botUsername = ctx.botInfo.username;
        const shareText = encodeURIComponent(TEXTS[userLanguage].welcome_message + `\n\n@${botUsername}`);
        const shareUrl = `https://t.me/share/url?url=https://t.me/${botUsername}&text=${shareText}`;
        return ctx.reply('Нажмите, чтобы поделиться:', Markup.inlineKeyboard([
            Markup.urlButton(texts.share_bot, shareUrl)
        ]));
    } else if (ctx.message.text === texts.back_to_main_menu) {
        user.current_state = null;
        user.chosen_sign = null;
        await usersCollection.updateOne(
            { user_id: user.user_id },
            { $set: { current_state: null, chosen_sign: null } }
        );
        return ctx.reply(texts.welcome_message, Keyboard.main_menu(userLanguage));
    }

    // Обработка знаков зодиака
    if (user.current_state === STEPS.CHOOSE_SIGN) {
        // validateSign, get_daily_horoscope и т.д. должны быть методами HoroscopeGenerator
        const sign = horoscopeGenerator.validateSign(ctx.message.text);
        if (sign) {
            user.chosen_sign = sign;
            user.current_state = STEPS.CHOOSE_DURATION;
            await usersCollection.updateOne(
                { user_id: user.user_id },
                { $set: { chosen_sign: sign, current_state: STEPS.CHOOSE_DURATION } }
            );
            return ctx.reply(texts.choose_duration, Keyboard.horoscope_duration_menu(userLanguage));
        } else {
            return ctx.reply(texts.invalid_sign, Keyboard.zodiac_signs_menu(userLanguage));
        }
    }

    // Обработка длительности гороскопа
    if (user.current_state === STEPS.CHOOSE_DURATION && user.chosen_sign) {
        const sign = user.chosen_sign;
        let horoscopeResult = "";
        let periodText = "";

        // Сбросить состояние после получения гороскопа
        user.current_state = null;
        user.chosen_sign = null;
        await usersCollection.updateOne(
            { user_id: user.user_id },
            { $set: { current_state: null, chosen_sign: null } }
        );

        // Используем методы HoroscopeGenerator
        if (ctx.message.text === texts.today) {
            horoscopeResult = horoscopeGenerator.getDailyHoroscope(sign);
            periodText = texts.today;
        } else if (ctx.message.text === texts.tomorrow) {
            horoscopeResult = horoscopeGenerator.getTomorrowHoroscope(sign);
            periodText = texts.tomorrow;
        } else if (ctx.message.text === texts.week) {
            horoscopeResult = horoscopeGenerator.getWeeklyHoroscope(sign);
            periodText = texts.week;
        } else if (ctx.message.text === texts.month) {
            horoscopeResult = horoscopeGenerator.getMonthlyHoroscope(sign);
            periodText = texts.month;
        } else if (ctx.message.text === texts.year) {
            horoscopeResult = horoscopeGenerator.getYearlyHoroscope(sign);
            periodText = texts.year;
        } else {
            return ctx.reply(texts.invalid_duration, Keyboard.horoscope_duration_menu(userLanguage));
        }

        return ctx.reply(`*${texts.horoscope_for} ${sign} ${periodText}*:\n\n${horoscopeResult}`, { parse_mode: 'Markdown', reply_markup: Keyboard.main_menu(userLanguage) });

    }

    // Если ни одно из условий не сработало, значит, бот не понял команду
    return ctx.reply(texts.unknown_command, Keyboard.main_menu(userLanguage));
});


// Vercel serverless function export
export default async function handler(req, res) {
    // В Vercel каждая функция вызывается независимо, поэтому нужно убедиться, что MongoDB подключен
    // Но `bot.use` уже делает это, так что здесь можно просто вызвать webhookCallback
    try {
        await connectToMongo(); // Убеждаемся, что подключение активно для каждого запроса
        await bot.webhookCallback('/api/webhook')(req, res);
    } catch (error) {
        console.error('Webhook handler error:', error);
        // Отправляем ответ об ошибке, чтобы Vercel не держал соединение открытым
        res.status(500).send('Internal Server Error');
    }
}
