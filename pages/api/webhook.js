// pages/api/webhook.js
import { Telegraf, Markup } from 'telegraf';
import { MongoClient } from 'mongodb';
import Keyboard from '../../lib/Keyboard.js'; // Убедитесь в правильном пути
import HoroscopeGenerator from '../../lib/horoscope.js'; // Импорт генератора
import { sendMessage, showAds } from '../../lib/telegram.js'; // Импорт функций Telegram
import { DateTime } from 'luxon';

// Переменные окружения
const BOT_TOKEN = process.env.BOT_TOKEN;
const MONGODB_URI = process.env.MONGO_URI;
const DB_NAME = process.env.MONGO_DB_NAME || 'AstroBotDB';
const COLLECTION_NAME = process.env.MONGO_COLLECTION_NAME || 'users';
const TON_WALLET_ADDRESS = process.env.TON_WALLET_ADDRESS;

if (!BOT_TOKEN) {
  console.error('BOT_TOKEN environment variable is not set!');
  throw new Error('BOT_TOKEN is not set.');
}

const bot = new Telegraf(BOT_TOKEN);

// --- Вспомогательные функции для БД и пользователей ---
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
  console.log("MongoDB connected and collection obtained successfully!");
  return { client, db };
}

// Получение/создание пользователя (адаптировано из get_user в astro.py)
async function getUser(userId, languageCode = 'en') {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection(COLLECTION_NAME);
    let user = await usersCollection.findOne({ _id: userId });
    if (!user) {
        user = {
            _id: userId,
            sign: "aries", // Дефолтный знак
            birth_date: null, // Дата рождения
            last_horoscope_date: null,
            daily_notifications_enabled: false,
            language: languageCode || 'en', // Язык
            state: null // Для FSM
        };
        await usersCollection.insertOne(user);
    }
    return user;
}

// Обновление пользователя
async function updateUser(userId, data) {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection(COLLECTION_NAME);
    await usersCollection.updateOne({ _id: userId }, { $set: data });
}

// --- Тексты для мультиязычности ---
const TEXTS = {
    "ru": {
        "welcome": "✨ Добро пожаловать в <b>Cosmic Insight</b> - ваш личный астрологический компаньон!\n\nПолучайте свой ежедневный гороскоп и небесные наставления.",
        "error_general": "Извините, произошла ошибка. Пожалуйста, попробуйте позже.",
        "horoscope_error": "Извините, произошла ошибка при получении гороскопа. Пожалуйста, попробуйте позже.",
        "settings_title": "⚙️ <b>Настройки</b>",
        "current_sign": "Ваш текущий знак зодиака:",
        "notifications_status": "Ежедневные уведомления:",
        "settings_error": "Извините, произошла ошибка при открытии настроек. Пожалуйста, попробуйте позже.",
        "premium_title": "✨ <b>Премиум Функции</b> ✨",
        "premium_description": "Разблокируйте эксклюзивные преимущества:\n- Опыт без рекламы\n- Расширенные гороскопы\n- Приоритетная поддержка\n\nБольше функций скоро!",
        "premium_error": "Извините, произошла ошибка. Пожалуйста, попробуйте позже.",
        "support_project": "💎 Поддержите наш проект и получите бонусные функции!",
        "enter_amount": "Введите сумму доната в TON:",
        "invalid_amount": "Пожалуйста, введите корректное положительное число для суммы.",
        "send_ton": "Пожалуйста, отправьте <b>{amount} TON</b> на:\n<code>{wallet}</code>\n\nИли нажмите ниже, чтобы открыть ваш кошелек:",
        "donation_closed": "Донат закрыт.",
        "main_menu_text": "Главное меню:",
        "choose_sign": "Выберите свой знак зодиака:",
        "sign_selection_error": "Извините, произошла ошибка.",
        "sign_updated": "Ваш знак зодиака обновлен до:",
        "notifications_toggled": "Ежедневные уведомления: <b>{status}</b>",
        "back_to_main_menu": "Возвращаюсь в главное меню.",
        "unhandled_text": "Извините, я пока не умею обрабатывать обычный текст. Используйте команды или кнопки меню.",
        "entertainments_title": "🎲 <b>Развлечения</b>",
        "entertainments_error": "Извините, произошла ошибка при открытии развлечений. Пожалуйста, попробуйте позже.",
        "ask_question": "Задайте свой вопрос магическому шару:",
        "enter_birthdate": "Пожалуйста, введите дату вашего рождения в формате ДД.ММ.ГГГГ (например, 01.01.2000):",
        "invalid_date_format": "Неверный формат даты. Пожалуйста, используйте ДД.ММ.ГГГГ.",
        "invalid_date_value": "Неверная дата. Пожалуйста, убедитесь, что день, месяц и год корректны.",
        "birthdate_saved": "Дата рождения сохранена. Ваш знак зодиака определен как:",
        "choose_language": "Выберите язык:",
        "language_set": "Язык установлен на Русский.",
        "language_set_en": "Language set to English."
    },
    "en": {
        "welcome": "✨ Welcome to <b>Cosmic Insight</b> - your personal astrology companion!\n\nGet your daily horoscope and celestial guidance.",
        "error_general": "Sorry, an error occurred. Please try again later.",
        "horoscope_error": "Sorry, an error occurred while getting your horoscope. Please try again later.",
        "settings_title": "⚙️ <b>Settings</b>",
        "current_sign": "Your current zodiac sign:",
        "notifications_status": "Daily notifications:",
        "settings_error": "Sorry, an error occurred while opening settings. Please try again later.",
        "premium_title": "✨ <b>Premium Features</b> ✨",
        "premium_description": "Unlock exclusive benefits:\n- Ad-free experience\n- Advanced horoscopes\n- Priority support\n\nMore features coming soon!",
        "premium_error": "Sorry, an error occurred. Please try again later.",
        "support_project": "💎 Support our project and get bonus features!",
        "enter_amount": "Enter donation amount in TON:",
        "invalid_amount": "Please enter a valid positive number for the amount.",
        "send_ton": "Please send <b>{amount} TON</b> to:\n<code>{wallet}</code>\n\nOr click below to open your wallet:",
        "donation_closed": "Donation closed.",
        "main_menu_text": "Main menu:",
        "choose_sign": "Choose your zodiac sign:",
        "sign_selection_error": "Sorry, an error occurred.",
        "sign_updated": "Your zodiac sign has been updated to:",
        "notifications_toggled": "Daily notifications: <b>{status}</b>",
        "back_to_main_menu": "Returning to main menu.",
        "unhandled_text": "Sorry, I don't know how to process that text yet. Please use commands or menu buttons.",
        "entertainments_title": "🎲 <b>Entertainments</b>",
        "entertainments_error": "Sorry, an error occurred while opening entertainments. Please try again later.",
        "ask_question": "Ask your question to the Magic 8-Ball:",
        "enter_birthdate": "Please enter your birth date in DD.MM.YYYY format (e.g., 01.01.2000):",
        "invalid_date_format": "Invalid date format. Please use DD.MM.YYYY.",
        "invalid_date_value": "Invalid date. Please ensure day, month, and year are correct.",
        "birthdate_saved": "Birth date saved. Your zodiac sign is determined as:",
        "choose_language": "Choose language:",
        "language_set": "Language set to English.",
        "language_set_ru": "Язык установлен на Русский."
    }
};

// Функция для получения текста на нужном языке
const getText = (key, lang, replacements = {}) => {
    let text = TEXTS[lang]?.[key] || TEXTS['en'][key];
    for (const [placeholder, value] of Object.entries(replacements)) {
        text = text.replace(`{${placeholder}}`, value);
    }
    return text;
};

// --- Обработчики Telegraf (адаптировано из astro.py) ---

bot.start(async (ctx) => {
    try {
        const user_id = ctx.from.id;
        const languageCode = ctx.from.language_code && ['ru', 'en'].includes(ctx.from.language_code) ? ctx.from.language_code : 'en';
        const user = await getUser(user_id, languageCode); // Создаем пользователя, если его нет, с языком

        await ctx.replyWithHTML(
            getText('welcome', user.language),
            Keyboard.main_menu()
        );
        console.log(`User ${user_id} started the bot. Language: ${user.language}`);
    } catch (error) {
        console.error('Error in /start handler:', error);
        await ctx.reply(getText('error_general', 'en')); // Дефолт на EN в случае критической ошибки
    }
});

// Обработчик для кнопки "🔮 Get Horoscope"
bot.hears('🔮 Get Horoscope', async (ctx) => {
    try {
        const user_id = ctx.from.id;
        const user = await getUser(user_id);

        const horoscope = HoroscopeGenerator.generate(user, user.language);

        const shareBtn = Keyboard.share_bot_keyboard(ctx.botInfo.username); // botInfo.username доступен после инициализации Telegraf
        const markup = Markup.inlineKeyboard([
            [Markup.button.callback(user.language === 'ru' ? "❤️ Поддержать Проект" : "❤️ Support Project", "show_donate")]
        ]).add(...shareBtn.reply_markup.inline_keyboard[0]); // Добавляем кнопку "Поделиться"

        await ctx.replyWithHTML(
            horoscope,
            markup
        );

        await showAds(user_id, user.language); // Показываем рекламу

    } catch (error) {
        console.error('Error in Get Horoscope handler:', error);
        const user = await getUser(ctx.from.id);
        await ctx.reply(getText('horoscope_error', user.language));
    }
});

// Обработчик для кнопки "⚙️ Settings"
bot.hears('⚙️ Settings', async (ctx) => {
    try {
        const user_id = ctx.from.id;
        const user = await getUser(user_id);
        const currentSign = HoroscopeGenerator.SIGNS[user.sign][`name_${user.language}`];
        const notificationsEnabled = user.daily_notifications_enabled || false;
        const notificationsStatusText = notificationsEnabled ? (user.language === 'ru' ? "ВКЛ" : "ON") : (user.language === 'ru' ? "ВЫКЛ" : "OFF");

        await ctx.replyWithHTML(
            `${getText('settings_title', user.language)}\n\n` +
            `${getText('current_sign', user.language)} <b>${currentSign}</b>\n` +
            `${getText('notifications_status', user.language)} <b>${notificationsStatusText}</b>`,
            Keyboard.settings_menu(user.language, notificationsEnabled)
        );
    } catch (error) {
        console.error('Error in Settings handler:', error);
        const user = await getUser(ctx.from.id);
        await ctx.reply(getText('settings_error', user.language));
    }
});

// Обработчик для кнопки "❤️ Support Project" (заменили Premium)
bot.hears('❤️ Support Project', async (ctx) => {
    try {
        const user = await getUser(ctx.from.id);
        await ctx.replyWithHTML(
            getText('support_project', user.language),
            Keyboard.donate_menu()
        );
    } catch (error) {
        console.error('Error in Support Project handler:', error);
        const user = await getUser(ctx.from.id);
        await ctx.reply(getText('premium_error', user.language)); // Можно переименовать в support_error
    }
});

// Обработчик для кнопки "🎲 Entertainments"
bot.hears('🎲 Entertainments', async (ctx) => {
    try {
        const user = await getUser(ctx.from.id);
        await ctx.replyWithHTML(
            getText('entertainments_title', user.language),
            Keyboard.entertainments_menu()
        );
    } catch (error) {
        console.error('Error in Entertainments handler:', error);
        const user = await getUser(ctx.from.id);
        await ctx.reply(getText('entertainments_error', user.language));
    }
});

// --- Обработчики Callback Query (Inline Keyboard Buttons) ---

// Donate menu actions
bot.action('show_donate', async (ctx) => {
    await ctx.answerCbQuery();
    try {
        const user = await getUser(ctx.from.id);
        await ctx.editMessageText(
            getText('support_project', user.language),
            Keyboard.donate_menu()
        );
    } catch (error) {
        console.error('Error in show_donate callback:', error);
        const user = await getUser(ctx.from.id);
        await ctx.reply(getText('error_general', user.language));
    }
});

bot.action(/^donate_/, async (ctx) => {
    await ctx.answerCbQuery();
    const amountType = ctx.match[0].split("_")[1]; // "5", "10", "custom"
    const user = await getUser(ctx.from.id);

    try {
        if (amountType === "custom") {
            await ctx.editMessageText(
                getText('enter_amount', user.language),
                Markup.removeKeyboard() // Убираем ReplyKeyboard, если она была (хотя здесь Inline)
            );
            await updateUser(ctx.from.id, { state: 'awaiting_donate_amount' }); // Установка состояния FSM
        } else {
            const amount = parseFloat(amountType);
            const tonLink = `https://t.me/send?start=transfer_ton_${TON_WALLET_ADDRESS}_${amount * 1_000_000_000}`; // Пример TON Space link
            // Или ton://transfer/YOUR_WALLET?amount=NANO_TON
            
            const builder = Markup.inlineKeyboard([
                [Markup.button.url(user.language === 'ru' ? "Открыть TON Кошелек" : "Open TON Wallet", tonLink)],
                [Markup.button.callback(user.language === 'ru' ? "Готово" : "Done", "close_donate")]
            ]);
            
            await ctx.editMessageText(
                getText('send_ton', user.language, { amount: amount, wallet: TON_WALLET_ADDRESS }),
                { reply_markup: builder.reply_markup, parse_mode: 'HTML' }
            );
        }
    } catch (error) {
        console.error('Error in donate_ callback:', error);
        await ctx.reply(getText('error_general', user.language));
    }
});

bot.action('close_donate', async (ctx) => {
    await ctx.answerCbQuery(getText('donation_closed', (await getUser(ctx.from.id)).language));
    try {
        await ctx.deleteMessage(); // Удаляем текущее сообщение
    } catch (e) {
        console.warn(`Failed to delete message after close_donate: ${e.message}`);
    }
    const user = await getUser(ctx.from.id);
    await ctx.reply(getText('main_menu_text', user.language), Keyboard.main_menu());
});

// Settings actions
bot.action('settings_select_sign', async (ctx) => {
    await ctx.answerCbQuery();
    try {
        const user = await getUser(ctx.from.id);
        await ctx.editMessageText(
            getText('choose_sign', user.language),
            Keyboard.zodiac_sign_selection()
        );
        await updateUser(ctx.from.id, { state: 'awaiting_sign_selection' }); // Установка состояния FSM
    } catch (error) {
        console.error('Error in settings_select_sign callback:', error);
        const user = await getUser(ctx.from.id);
        await ctx.reply(getText('sign_selection_error', user.language));
    }
});

bot.action(/^set_sign_/, async (ctx) => {
    await ctx.answerCbQuery();
    const selectedSign = ctx.match[0].split("_")[2];
    const userId = ctx.from.id;
    await updateUser(userId, { sign: selectedSign, state: null }); // Сбрасываем состояние

    const user = await getUser(userId);
    const currentSignName = HoroscopeGenerator.SIGNS[user.sign][`name_${user.language}`];
    const notificationsEnabled = user.daily_notifications_enabled || false;
    const notificationsStatusText = notificationsEnabled ? (user.language === 'ru' ? "ВКЛ" : "ON") : (user.language === 'ru' ? "ВЫКЛ" : "OFF");

    await ctx.editMessageText(
        `${getText('settings_title', user.language)}\n\n` +
        `${getText('current_sign', user.language)} <b>${currentSignName}</b>\n` +
        `${getText('notifications_status', user.language)} <b>${notificationsStatusText}</b>`,
        { reply_markup: Keyboard.settings_menu(user.language, notificationsEnabled).reply_markup, parse_mode: 'HTML' }
    );
});

bot.action('settings_toggle_notifications', async (ctx) => {
    await ctx.answerCbQuery();
    const userId = ctx.from.id;
    const user = await getUser(userId);
    
    const newStatus = !user.daily_notifications_enabled;
    await updateUser(userId, { daily_notifications_enabled: newStatus });
    
    const notificationsStatusText = newStatus ? (user.language === 'ru' ? "ВКЛ" : "ON") : (user.language === 'ru' ? "ВЫКЛ" : "OFF");
    const currentSignName = HoroscopeGenerator.SIGNS[user.sign][`name_${user.language}`];

    await ctx.editMessageText(
        `${getText('settings_title', user.language)}\n\n` +
        `${getText('current_sign', user.language)} <b>${currentSignName}</b>\n` +
        `${getText('notifications_status', user.language)} <b>${notificationsStatusText}</b>`,
        { reply_markup: Keyboard.settings_menu(user.language, newStatus).reply_markup, parse_mode: 'HTML' }
    );
});

bot.action('settings_language', async (ctx) => {
    await ctx.answerCbQuery();
    const user = await getUser(ctx.from.id);
    await ctx.editMessageText(
        getText('choose_language', user.language),
        Keyboard.language_selection_menu()
    );
    await updateUser(ctx.from.id, { state: 'awaiting_language_selection' });
});

bot.action(/^set_language_/, async (ctx) => {
    await ctx.answerCbQuery();
    const selectedLang = ctx.match[0].split("_")[2];
    const userId = ctx.from.id;
    await updateUser(userId, { language: selectedLang, state: null });

    const user = await getUser(userId); // Обновляем данные пользователя
    const currentSignName = HoroscopeGenerator.SIGNS[user.sign][`name_${user.language}`];
    const notificationsEnabled = user.daily_notifications_enabled || false;
    const notificationsStatusText = notificationsEnabled ? (user.language === 'ru' ? "ВКЛ" : "ON") : (user.language === 'ru' ? "ВЫКЛ" : "OFF");

    await ctx.editMessageText(
        `${getText('settings_title', user.language)}\n\n` +
        `${getText('current_sign', user.language)} <b>${currentSignName}</b>\n` +
        `${getText('notifications_status', user.language)} <b>${notificationsStatusText}</b>`,
        { reply_markup: Keyboard.settings_menu(user.language, notificationsEnabled).reply_markup, parse_mode: 'HTML' }
    );
    await ctx.reply(getText(`language_set_${selectedLang}`, selectedLang));
});

bot.action('back_to_settings_from_lang', async (ctx) => {
    await ctx.answerCbQuery();
    const user = await getUser(ctx.from.id);
    const currentSignName = HoroscopeGenerator.SIGNS[user.sign][`name_${user.language}`];
    const notificationsEnabled = user.daily_notifications_enabled || false;
    const notificationsStatusText = notificationsEnabled ? (user.language === 'ru' ? "ВКЛ" : "ON") : (user.language === 'ru' ? "ВЫКЛ" : "OFF");

    await ctx.editMessageText(
        `${getText('settings_title', user.language)}\n\n` +
        `${getText('current_sign', user.language)} <b>${currentSignName}</b>\n` +
        `${getText('notifications_status', user.language)} <b>${notificationsStatusText}</b>`,
        { reply_markup: Keyboard.settings_menu(user.language, notificationsEnabled).reply_markup, parse_mode: 'HTML' }
    );
    await updateUser(ctx.from.id, { state: null });
});

bot.action('back_to_settings_from_sign', async (ctx) => {
    await ctx.answerCbQuery();
    const user = await getUser(ctx.from.id);
    const currentSignName = HoroscopeGenerator.SIGNS[user.sign][`name_${user.language}`];
    const notificationsEnabled = user.daily_notifications_enabled || false;
    const notificationsStatusText = notificationsEnabled ? (user.language === 'ru' ? "ВКЛ" : "ON") : (user.language === 'ru' ? "ВЫКЛ" : "OFF");

    await ctx.editMessageText(
        `${getText('settings_title', user.language)}\n\n` +
        `${getText('current_sign', user.language)} <b>${currentSignName}</b>\n` +
        `${getText('notifications_status', user.language)} <b>${notificationsStatusText}</b>`,
        { reply_markup: Keyboard.settings_menu(user.language, notificationsEnabled).reply_markup, parse_mode: 'HTML' }
    );
    await updateUser(ctx.from.id, { state: null });
});

// Entertainments actions
bot.action('entertainment_cookie', async (ctx) => {
    await ctx.answerCbQuery();
    const user = await getUser(ctx.from.id);
    const cookieMessage = HoroscopeGenerator.getFortuneCookie(user.language);
    await ctx.replyWithHTML(
        cookieMessage,
        Keyboard.entertainments_menu() // Возвращаемся к меню развлечений
    );
});

bot.action('entertainment_8ball', async (ctx) => {
    await ctx.answerCbQuery();
    const user = await getUser(ctx.from.id);
    await ctx.replyWithHTML(
        getText('ask_question', user.language),
        Markup.removeKeyboard() // Убираем ReplyKeyboard если она есть
    );
    await updateUser(ctx.from.id, { state: 'awaiting_8ball_question' });
});

bot.action('entertainment_compatibility', async (ctx) => {
    await ctx.answerCbQuery();
    const user = await getUser(ctx.from.id);
    await ctx.replyWithHTML(
        user.language === 'ru' ? "Для теста на совместимость, пожалуйста, выберите свой знак зодиака, а затем знак вашего партнера." : "For compatibility test, please choose your zodiac sign, then your partner's sign.",
        HoroscopeGenerator.SIGNS.map(sign => Markup.button.callback(sign.emoji + " " + (user.language === 'ru' ? sign.name_ru : sign.name_en), `compatibility_select_sign1_${sign.key}`))
    );
    await updateUser(ctx.from.id, { state: 'awaiting_compatibility_sign1' });
});


bot.action('back_to_main_menu_from_entertainments', async (ctx) => {
    await ctx.answerCbQuery();
    try {
        await ctx.deleteMessage(); // Удаляем текущее сообщение
    } catch (e) {
        console.warn(`Failed to delete message after back_to_main_menu_from_entertainments: ${e.message}`);
    }
    const user = await getUser(ctx.from.id);
    await ctx.reply(getText('main_menu_text', user.language), Keyboard.main_menu());
    await updateUser(ctx.from.id, { state: null }); // Сбрасываем состояние
});


// --- Обработка ввода текста пользователем (FSM states) ---
bot.on('text', async (ctx, next) => {
    const userId = ctx.from.id;
    const user = await getUser(userId);
    const text = ctx.message.text;

    if (text.startsWith('/')) {
        return next(); // Это команда, передаем дальше
    }

    switch (user.state) {
        case 'awaiting_donate_amount':
            try {
                const amount = parseFloat(text);
                if (isNaN(amount) || amount <= 0) {
                    throw new Error("Invalid amount");
                }
                const tonLink = `https://t.me/send?start=transfer_ton_${TON_WALLET_ADDRESS}_${amount * 1_000_000_000}`;
                
                const builder = Markup.inlineKeyboard([
                    [Markup.button.url(user.language === 'ru' ? "Открыть TON Кошелек" : "Open TON Wallet", tonLink)],
                    [Markup.button.callback(user.language === 'ru' ? "Готово" : "Done", "close_donate")]
                ]);
                
                await ctx.replyWithHTML(
                    getText('send_ton', user.language, { amount: amount, wallet: TON_WALLET_ADDRESS }),
                    { reply_markup: builder.reply_markup }
                );
                await updateUser(userId, { state: null });
                await ctx.reply(getText('main_menu_text', user.language), Keyboard.main_menu()); // Возвращаем основную клавиатуру
            } catch (error) {
                console.error('Error processing custom amount:', error);
                await ctx.reply(getText('invalid_amount', user.language));
                // Можно оставить состояние или сбросить
                await updateUser(userId, { state: null }); // Сбрасываем после ошибки
                await ctx.reply(getText('main_menu_text', user.language), Keyboard.main_menu());
            }
            break;

        case 'awaiting_8ball_question':
            const answer = HoroscopeGenerator.getMagic8BallAnswer(user.language);
            await ctx.replyWithHTML(
                answer,
                Keyboard.entertainments_menu() // Возвращаемся к меню развлечений
            );
            await updateUser(userId, { state: null }); // Сбрасываем состояние
            break;

        case 'awaiting_birthdate': // Для установки даты рождения
            try {
                const parts = text.split('.');
                if (parts.length !== 3) {
                    throw new Error("Invalid format");
                }
                const day = parseInt(parts[0]);
                const month = parseInt(parts[1]);
                const year = parseInt(parts[2]);

                if (isNaN(day) || isNaN(month) || isNaN(year) || day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > DateTime.now().year) {
                    throw new Error("Invalid date values");
                }

                // Проверить на валидность даты
                const birthDate = DateTime.local(year, month, day);
                if (!birthDate.isValid) {
                    throw new Error("Invalid date values");
                }

                const zodiacSign = HoroscopeGenerator.getSignByBirthDate(birthDate.day, birthDate.month);
                await updateUser(userId, { birth_date: birthDate.toJSDate(), sign: zodiacSign, state: null });
                await ctx.replyWithHTML(
                    `${getText('birthdate_saved', user.language)} <b>${HoroscopeGenerator.SIGNS[zodiacSign][`name_${user.language}`]}</b>`,
                    Keyboard.settings_menu(user.language, user.daily_notifications_enabled) // Обновляем меню настроек
                );
            } catch (error) {
                console.error('Error processing birthdate:', error);
                if (error.message === "Invalid format") {
                    await ctx.reply(getText('invalid_date_format', user.language));
                } else {
                    await ctx.reply(getText('invalid_date_value', user.language));
                }
                // Можно оставить состояние или сбросить, чтобы пользователь попробовал снова
                await updateUser(userId, { state: null }); // Сбрасываем после ошибки
                await ctx.reply(getText('main_menu_text', user.language), Keyboard.main_menu());
            }
            break;

        case 'awaiting_compatibility_sign1':
            // Этот стейт будет обрабатываться через inline-кнопки
            // Здесь может быть какая-то ошибка, если пользователь вводит текст
            await ctx.reply(user.language === 'ru' ? "Пожалуйста, выберите знак зодиака с помощью кнопок." : "Please select a zodiac sign using the buttons.");
            break;
        case 'awaiting_compatibility_sign2':
            // Этот стейт будет обрабатываться через inline-кнопки
            await ctx.reply(user.language === 'ru' ? "Пожалуйста, выберите знак зодиака вашего партнера с помощью кнопок." : "Please select your partner's zodiac sign using the buttons.");
            break;


        default:
            // Если состояние не установлено и это не команда, то это обычный текст.
            await ctx.reply(getText('unhandled_text', user.language), Keyboard.main_menu());
            break;
    }
});

// --- Обработка совместимости (новый функционал) ---
// Добавим обработчики для выбора знаков совместимости
bot.action(/^compatibility_select_sign1_/, async (ctx) => {
    await ctx.answerCbQuery();
    const sign1 = ctx.match[0].split("_")[3];
    const user = await getUser(ctx.from.id);
    
    // Сохраняем первый знак и запрашиваем второй
    await updateUser(user._id, { state: 'awaiting_compatibility_sign2', compatibility_sign1: sign1 });

    await ctx.editMessageText(
        user.language === 'ru' ? "Теперь выберите знак зодиака вашего партнера:" : "Now choose your partner's zodiac sign:",
        HoroscopeGenerator.SIGNS.map(sign => Markup.button.callback(sign.emoji + " " + (user.language === 'ru' ? sign.name_ru : sign.name_en), `compatibility_select_sign2_${sign.key}`))
    );
});

bot.action(/^compatibility_select_sign2_/, async (ctx) => {
    await ctx.answerCbQuery();
    const sign2 = ctx.match[0].split("_")[3];
    const user = await getUser(ctx.from.id);

    const sign1 = user.compatibility_sign1; // Получаем первый знак из состояния пользователя

    if (!sign1) {
        // Если почему-то первый знак не сохранился, сбрасываем и просим начать заново
        await ctx.editMessageText(user.language === 'ru' ? "Произошла ошибка, пожалуйста, попробуйте еще раз." : "An error occurred, please try again.", Keyboard.entertainments_menu());
        await updateUser(user._id, { state: null, compatibility_sign1: null });
        return;
    }

    const compatibilityMessage = HoroscopeGenerator.getCompatibility(sign1, sign2, user.language);
    
    await ctx.editMessageText(
        compatibilityMessage,
        Keyboard.entertainments_menu() // Возвращаемся к меню развлечений
    );
    await updateUser(user._id, { state: null, compatibility_sign1: null }); // Сбрасываем состояние
});


// --- API Route для Vercel Webhook ---

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // Инициализируем botInfo если его нет, чтобы получить username для share_bot_keyboard
      if (!bot.botInfo) {
          await bot.telegram.getMe().then((me) => {
              bot.botInfo = me;
              console.log(`Bot username initialized: @${me.username}`);
          });
      }
      
      await bot.handleUpdate(req.body);
      res.status(200).send('OK');
    } catch (error) {
      console.error('Error handling Telegram update:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }
}
