// pages/api/webhook.js
import { Telegraf, Markup, session } from 'telegraf';
import { message } from 'telegraf/filters'; // <-- ИСПРАВЛЕНО: была опечатка => вместо from
import { MongoClient } from 'mongodb';
import { DateTime } from 'luxon';
import HoroscopeGenerator from '../../lib/horoscope.js'; // Импортируем ваш ОБЪЕКТ HoroscopeGenerator
import Keyboard from '../../lib/Keyboard.js';
import TEXTS from '../../texts.js';
import { sendMessage, showAds } from '../../lib/telegram.js';

// Загрузка переменных окружения
const BOT_TOKEN = process.env.BOT_TOKEN;
const MONGO_URI = process.env.MONGO_URI;
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || 'sample_mflix';
const USERS_COLLECTION_NAME = process.env.MONGO_COLLECTION_NAME || 'users';
const TON_WALLET_ADDRESS = process.env.TON_WALLET_ADDRESS;

console.log("Webhook script started.");
console.log(`BOT_TOKEN loaded: ${!!BOT_TOKEN}`);
console.log(`MONGO_URI loaded: ${!!MONGO_URI}`);

if (!BOT_TOKEN) throw new Error('BOT_TOKEN must be provided!');
if (!MONGO_URI) throw new Error('MONGO_URI must be provided!');

const bot = new Telegraf(BOT_TOKEN);
let usersCollection;

// !!! ЭТА СТРОКА УДАЛЕНА ИЗ КОДА! НЕ НУЖНО СОЗДАВАТЬ ЭКЗЕМПЛЯР.
// const horoscopeGenerator = new HoroscopeGenerator();
// HoroscopeGenerator теперь это уже сам объект, его не нужно "конструировать"

async function connectToMongo() {
    if (usersCollection) {
        console.log("MongoDB already connected.");
        return;
    }
    try {
        const client = new MongoClient(MONGO_URI);
        await client.connect();
        const db = client.db(MONGO_DB_NAME);
        usersCollection = db.collection(USERS_COLLECTION_NAME);
        console.log("MongoDB connected and collection obtained successfully!");
    } catch (error) {
        console.error("Failed to connect to MongoDB:", error);
        throw error;
    }
}

bot.use(async (ctx, next) => {
    console.log("Middleware: Checking MongoDB connection...");
    if (!usersCollection) {
        await connectToMongo();
    }
    console.log("Middleware: MongoDB connection ensured. Processing next...");
    await next();
});

bot.use(async (ctx, next) => {
    console.log(`Middleware: User ${ctx.from.id} request. Checking/creating user...`);
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
            birth_date: null, // <-- ДОБАВЛЕНО для HoroscopeGenerator.generate
            horoscope_type: null, // <-- ДОБАВЛЕНО для HoroscopeGenerator.generate
        };
        await usersCollection.insertOne(user);
        console.log(`New user registered: ${userId}`);
    } else {
        await usersCollection.updateOne(
            { user_id: userId },
            { $set: { last_activity: new Date() } }
        );
        console.log(`Existing user ${userId} updated.`);
    }
    ctx.state.user = user;
    console.log(`Middleware: User state set for ${userId}. Processing next...`);
    await next();
});

const getUserLanguage = (ctx) => {
    const userLanguage = ctx.state.user.language;
    if (!userLanguage || !TEXTS[userLanguage]) {
        console.warn(`Language '${userLanguage}' not found in TEXTS for user ${ctx.from.id}. Falling back to 'ru'.`);
        return 'ru';
    }
    return userLanguage;
};

const STEPS = {
    CHOOSE_SIGN: 'choose_sign',
    CHOOSE_DURATION: 'choose_duration',
};

bot.start(async (ctx) => {
    console.log("Handler: /start command received.");
    try {
        const userLanguage = getUserLanguage(ctx);
        console.log(`Start handler: userLanguage is '${userLanguage}'.`);
        console.log(`Start handler: TEXTS[userLanguage].welcome_message: '${TEXTS[userLanguage]?.welcome_message}'`);
        console.log(`Start handler: Keyboard.main_menu type: ${typeof Keyboard.main_menu}`);

        await usersCollection.updateOne(
            { user_id: ctx.from.id },
            { $set: { current_state: null, chosen_sign: null } }
        );
        await ctx.reply(TEXTS[userLanguage].welcome_message, Keyboard.main_menu(userLanguage));
        console.log("Start handler: Reply sent successfully.");
    } catch (error) {
        console.error("Error in /start handler:", error);
        const userLanguage = getUserLanguage(ctx);
        await ctx.reply(TEXTS[userLanguage]?.error_message || "Произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте еще раз позже.");
    }
});

bot.hears(message('text'), async (ctx) => {
    console.log(`Handler: Hears text received: "${ctx.message.text}"`);
    const userLanguage = getUserLanguage(ctx);
    const texts = TEXTS[userLanguage];
    const user = ctx.state.user;

    // Главное меню
    if (ctx.message.text === texts.get_horoscope) {
        user.current_state = STEPS.CHOOSE_SIGN;
        await usersCollection.updateOne({ user_id: user.user_id }, { $set: { current_state: STEPS.CHOOSE_SIGN } });
        return ctx.reply(texts.choose_sign, Keyboard.zodiac_signs_menu(userLanguage));
    } else if (ctx.message.text === texts.settings) {
        return ctx.reply("Настройки пока не реализованы.", Keyboard.main_menu(userLanguage));
    } else if (ctx.message.text === texts.about_us) {
        return ctx.reply("Информация о боте.", Keyboard.main_menu(userLanguage));
    } else if (ctx.message.text === texts.ton_wallet) {
        return ctx.reply(`TON кошелек: ${TON_WALLET_ADDRESS}`, Keyboard.main_menu(userLanguage));
    } else if (ctx.message.text === texts.share_bot) {
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
        // !!! ИСПОЛЬЗУЕМ HoroscopeGenerator НАПРЯМУЮ, БЕЗ new
        const sign = HoroscopeGenerator.validateSign(ctx.message.text);
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
        let horoscopeType; // Переменная для типа гороскопа, который будет передан в generate

        if (ctx.message.text === texts.today) {
            horoscopeType = 'daily';
            periodText = texts.today;
        } else if (ctx.message.text === texts.tomorrow) {
            horoscopeType = 'daily'; // Ваш generate не имеет типа 'tomorrow', используем 'daily'
            // Если вы хотите гороскоп на "завтра", вам нужно будет адаптировать generate
            // или добавлять логику здесь для смещения даты на +1 день.
            periodText = texts.tomorrow;
        } else if (ctx.message.text === texts.week) {
            horoscopeType = 'weekly';
            periodText = texts.week;
        } else if (ctx.message.text === texts.month) {
            horoscopeType = 'monthly';
            periodText = texts.month;
        } else if (ctx.message.text === texts.year) {
            horoscopeType = 'yearly'; // Убедитесь, что этот тип есть в вашем HoroscopeGenerator.HOROSCOPES
            periodText = texts.year;
        } else {
            return ctx.reply(texts.invalid_duration, Keyboard.horoscope_duration_menu(userLanguage));
        }

        // Обновляем user.horoscope_type перед вызовом generate
        user.horoscope_type = horoscopeType;

        // !!! ВЫЗЫВАЕМ generate НАПРЯМУЮ ИЗ ОБЪЕКТА HoroscopeGenerator
        horoscopeResult = await HoroscopeGenerator.generate({
            user_id: user.user_id,
            zodiac_sign: sign, // Передаем выбранный знак
            horoscope_type: horoscopeType, // Передаем выбранный тип
            birth_date: user.birth_date // Передаем birth_date, если он установлен у пользователя
        }, userLanguage);

        // Сбросить состояние после получения гороскопа
        user.current_state = null;
        user.chosen_sign = null;
        user.horoscope_type = null;
        await usersCollection.updateOne(
            { user_id: user.user_id },
            { $set: { current_state: null, chosen_sign: null, horoscope_type: null } }
        );

        return ctx.reply(`*${texts.horoscope_for} ${sign} ${periodText}*:\n\n${horoscopeResult}`, { parse_mode: 'Markdown', reply_markup: Keyboard.main_menu(userLanguage) });

    }

    return ctx.reply(texts.unknown_command, Keyboard.main_menu(userLanguage));
});

// Vercel serverless function export
export default async function handler(req, res) {
    console.log("Vercel handler function called.");
    try {
        await connectToMongo();
        await bot.webhookCallback('/api/webhook')(req, res);
        console.log("Webhook callback processed.");
    } catch (error) {
        console.error('Webhook handler error:', error);
        res.status(500).send('Internal Server Error');
    }
}
