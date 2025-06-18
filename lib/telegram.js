// pages/api/webhook.js
import { Telegraf, Markup } from 'telegraf';
import { MongoClient } from 'mongodb';
import Keyboard from '../../lib/Keyboard.js';
import HoroscopeGenerator from '../../lib/horoscope.js';
import { sendMessage, showAds } from '../../lib/telegram.js';
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

async function getUser(userId, languageCode = null) {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection(COLLECTION_NAME);
    let user = await usersCollection.findOne({ _id: userId });
    if (!user) {
        user = {
            _id: userId,
            sign: "aries",
            birth_date: null,
            last_horoscope_date: null,
            daily_notifications_enabled: false,
            language: languageCode || 'en', // Установим язык при первом создании
            state: null,
            compatibility_sign1: null // Для FSM совместимости
        };
        await usersCollection.insertOne(user);
    } else if (languageCode && !user.language) { // Обновим язык, если он не был установлен ранее
        user.language = languageCode;
        await usersCollection.updateOne({ _id: userId }, { $set: { language: languageCode } });
    }
    return user;
}

async function updateUser(userId, data) {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection(COLLECTION_NAME);
    await usersCollection.updateOne({ _id: userId }, { $set: data });
}

// --- Тексты для мультиязычности (дополнены) ---
const TEXTS = {
    "ru": {
        "welcome": "✨ Добро пожаловать в <b>Cosmic Insight</b> - ваш личный астрологический компаньон!\n\nПолучайте свой ежедневный гороскоп и небесные наставления.",
        "error_general": "Извините, произошла ошибка. Пожалуйста, попробуйте позже.",
        "horoscope_error": "Извините, произошла ошибка при получении гороскопа. Пожалуйста, попробуйте позже.",
        "settings_title": "⚙️ <b>Настройки</b>",
        "current_sign": "Ваш текущий знак зодиака:",
        "birth_date": "Дата рождения:",
        "not_set": "не установлена",
        "notifications_status": "Ежедневные уведомления:",
        "status_on": "ВКЛ",
        "status_off": "ВЫКЛ",
        "settings_error": "Извините, произошла ошибка при открытии настроек. Пожалуйста, попробуйте позже.",
        "support_project_message": "💎 Поддержите наш проект и помогите нам развиваться!",
        "open_ton_wallet_prompt": "Пожалуйста, используйте кнопки ниже для взаимодействия с TON кошельком.",
        "ton_address_copied": "Адрес TON кошелька скопирован в буфер обмена!",
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
        "enter_birthdate": "Пожалуйста, введите вашу дату рождения в формате ДД.ММ.ГГГГ (например, 01.01.2000):",
        "invalid_date_format": "Неверный формат даты. Пожалуйста, используйте ДД.ММ.ГГГГ.",
        "invalid_date_value": "Неверная дата. Пожалуйста, убедитесь, что день, месяц и год корректны.",
        "birthdate_saved": "Дата рождения сохранена. Ваш знак зодиака определен как:",
        "choose_language": "Выберите язык:",
        "language_set_ru": "Язык установлен на Русский.",
        "language_set_en": "Language set to English.",
        "select_your_sign_comp": "Для теста на совместимость, пожалуйста, выберите <b>ваш</b> знак зодиака:",
        "select_partner_sign_comp": "Теперь выберите знак зодиака <b>вашего партнера</b>:",
        "compatibility_error": "Произошла ошибка при расчете совместимости, пожалуйста, попробуйте еще раз.",
        "back_to_entertainments": "Возвращаюсь в меню развлечений."
    },
    "en": {
        "welcome": "✨ Welcome to <b>Cosmic Insight</b> - your personal astrology companion!\n\nGet your daily horoscope and celestial guidance.",
        "error_general": "Sorry, an error occurred. Please try again later.",
        "horoscope_error": "Sorry, an error occurred while getting your horoscope. Please try again later.",
        "settings_title": "⚙️ <b>Settings</b>",
        "current_sign": "Your current zodiac sign:",
        "birth_date": "Birth Date:",
        "not_set": "not set",
        "notifications_status": "Daily notifications:",
        "status_on": "ON",
        "status_off": "OFF",
        "settings_error": "Sorry, an error occurred while opening settings. Please try again later.",
        "support_project_message": "💎 Support our project and help us grow!",
        "open_ton_wallet_prompt": "Please use the buttons below to interact with the TON wallet.",
        "ton_address_copied": "TON wallet address copied to clipboard!",
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
        "language_set_ru": "Язык установлен на Русский.",
        "language_set_en": "Language set to English.",
        "select_your_sign_comp": "For compatibility test, please choose <b>your</b> zodiac sign:",
        "select_partner_sign_comp": "Now choose <b>your partner's</b> zodiac sign:",
        "compatibility_error": "An error occurred while calculating compatibility, please try again.",
        "back_to_entertainments": "Returning to entertainments menu."
    }
};

const getText = (key, lang, replacements = {}) => {
    let text = TEXTS[lang]?.[key] || TEXTS['en'][key];
    for (const [placeholder, value] of Object.entries(replacements)) {
        text = text.replace(`{${placeholder}}`, value);
    }
    return text;
};

// --- Обработчики Telegraf ---

bot.start(async (ctx) => {
    try {
        const user_id = ctx.from.id;
        const languageCode = ctx.from.language_code && ['ru', 'en'].includes(ctx.from.language_code) ? ctx.from.language_code : 'en';
        const user = await getUser(user_id, languageCode);

        await ctx.replyWithHTML(
            getText('welcome', user.language),
            Keyboard.main_menu(user.language)
        );
        console.log(`User ${user_id} started the bot. Language: ${user.language}`);
    } catch (error) {
        console.error('Error in /start handler:', error);
        await ctx.reply(getText('error_general', 'en'));
    }
});

bot.hears(['🔮 Get Horoscope', '🔮 Получить Гороскоп'], async (ctx) => {
    try {
        const user_id = ctx.from.id;
        const user = await getUser(user_id);

        const horoscope = HoroscopeGenerator.generate(user, user.language);

        const shareBtn = Keyboard.share_bot_keyboard(bot.botInfo.username, user.language);
        const supportBtn = Markup.inlineKeyboard([
            [Markup.button.callback(user.language === 'ru' ? "❤️ Поддержать Проект" : "❤️ Support Project", "show_donate")]
        ]);

        const combinedMarkup = Markup.inlineKeyboard([
            ...shareBtn.reply_markup.inline_keyboard,
            ...supportBtn.reply_markup.inline_keyboard
        ]);

        await ctx.replyWithHTML(
            horoscope,
            combinedMarkup
        );

        await showAds(user_id, user.language);

    } catch (error) {
        console.error('Error in Get Horoscope handler:', error);
        const user = await getUser(ctx.from.id);
        await ctx.reply(getText('horoscope_error', user.language));
    }
});

bot.hears(['⚙️ Settings', '⚙️ Настройки'], async (ctx) => {
    try {
        const user_id = ctx.from.id;
        const user = await getUser(user_id);
        const currentSign = HoroscopeGenerator.SIGNS[user.sign][`name_${user.language}`];
        const notificationsEnabled = user.daily_notifications_enabled || false;
        const notificationsStatusText = notificationsEnabled ? getText('status_on', user.language) : getText('status_off', user.language);
        const birthDateText = user.birth_date ? DateTime.fromJSDate(user.birth_date).toFormat('dd.MM.yyyy') : getText('not_set', user.language);


        await ctx.replyWithHTML(
            `${getText('settings_title', user.language)}\n\n` +
            `${getText('current_sign', user.language)} <b>${currentSign}</b>\n` +
            `${getText('birth_date', user.language)} <b>${birthDateText}</b>\n` +
            `${getText('notifications_status', user.language)} <b>${notificationsStatusText}</b>`,
            Keyboard.settings_menu(user.language, notificationsEnabled)
        );
    } catch (error) {
        console.error('Error in Settings handler:', error);
        const user = await getUser(ctx.from.id);
        await ctx.reply(getText('settings_error', user.language));
    }
});

bot.hears(['❤️ Support Project', '❤️ Поддержать Проект'], async (ctx) => {
    try {
        const user = await getUser(ctx.from.id);
        await ctx.replyWithHTML(
            getText('support_project_message', user.language),
            Keyboard.support_project_button(user.language) // Упрощенная кнопка доната
        );
    } catch (error) {
        console.error('Error in Support Project handler:', error);
        const user = await getUser(ctx.from.id);
        await ctx.reply(getText('error_general', user.language));
    }
});

bot.hears(['🎲 Entertainments', '🎲 Развлечения'], async (ctx) => {
    try {
        const user = await getUser(ctx.from.id);
        await ctx.replyWithHTML(
            getText('entertainments_title', user.language),
            Keyboard.entertainments_menu(user.language)
        );
    } catch (error) {
        console.error('Error in Entertainments handler:', error);
        const user = await getUser(ctx.from.id);
        await ctx.reply(getText('entertainments_error', user.language));
    }
});

// --- Обработчики Callback Query ---

// Donate actions (упрощенные)
bot.action('show_donate', async (ctx) => {
    await ctx.answerCbQuery();
    try {
        const user = await getUser(ctx.from.id);
        await ctx.editMessageText(
            getText('support_project_message', user.language),
            Keyboard.support_project_button(user.language)
        );
    } catch (error) {
        console.error('Error in show_donate callback:', error);
        const user = await getUser(ctx.from.id);
        await ctx.reply(getText('error_general', user.language));
    }
});

bot.action('donate_open_wallet', async (ctx) => {
    await ctx.answerCbQuery();
    const user = await getUser(ctx.from.id);
    const tonLink = `https://t.me/send?start=transfer_ton_${TON_WALLET_ADDRESS}_1000000000`; // Открываем TON Space с 1 TON как пример
    const builder = Markup.inlineKeyboard([
        [Markup.button.url(user.language === 'ru' ? "Открыть TON Кошелек" : "Open TON Wallet", tonLink)],
        [Markup.button.callback(user.language === 'ru' ? "Скопировать TON Адрес" : "Copy TON Address", "donate_copy_address")],
        [Markup.button.callback(user.language === 'ru' ? "Закрыть" : "Close", "close_donate")]
    ]);
    await ctx.editMessageText(
        getText('open_ton_wallet_prompt', user.language),
        { reply_markup: builder.reply_markup, parse_mode: 'HTML' }
    );
});

bot.action('donate_copy_address', async (ctx) => {
    await ctx.answerCbQuery(getText('ton_address_copied', (await getUser(ctx.from.id)).language));
    // Telegram автоматически показывает всплывающее уведомление для `answerCbQuery` с текстом
    // Нет необходимости отправлять отдельное сообщение в чат
});

bot.action('close_donate', async (ctx) => {
    await ctx.answerCbQuery(getText('donation_closed', (await getUser(ctx.from.id)).language));
    try {
        await ctx.deleteMessage();
    } catch (e) {
        console.warn(`Failed to delete message after close_donate: ${e.message}`);
    }
    const user = await getUser(ctx.from.id);
    await ctx.reply(getText('main_menu_text', user.language), Keyboard.main_menu(user.language));
});


// Settings actions
bot.action('settings_select_sign', async (ctx) => {
    await ctx.answerCbQuery();
    try {
        const user = await getUser(ctx.from.id);
        await ctx.editMessageText(
            getText('choose_sign', user.language),
            Keyboard.zodiac_sign_selection(user.language)
        );
        await updateUser(ctx.from.id, { state: 'awaiting_sign_selection' });
    } catch (error) {
        console.error('Error in settings_select_sign callback:', error);
        const user = await getUser(ctx.from.id);
        await ctx.reply(getText('sign_selection_error', user.language));
    }
});

bot.action('settings_set_birthdate', async (ctx) => {
    await ctx.answerCbQuery();
    const user = await getUser(ctx.from.id);
    await ctx.replyWithHTML(
        getText('enter_birthdate', user.language),
        Markup.removeKeyboard() // Убираем ReplyKeyboard, если есть
    );
    await updateUser(ctx.from.id, { state: 'awaiting_birthdate' });
});


bot.action(/^set_sign_/, async (ctx) => {
    await ctx.answerCbQuery();
    const selectedSign = ctx.match[0].split("_")[2];
    const userId = ctx.from.id;
    await updateUser(userId, { sign: selectedSign, state: null });

    const user = await getUser(userId);
    const currentSignName = HoroscopeGenerator.SIGNS[user.sign][`name_${user.language}`];
    const notificationsEnabled = user.daily_notifications_enabled || false;
    const notificationsStatusText = notificationsEnabled ? getText('status_on', user.language) : getText('status_off', user.language);
    const birthDateText = user.birth_date ? DateTime.fromJSDate(user.birth_date).toFormat('dd.MM.yyyy') : getText('not_set', user.language);

    await ctx.editMessageText(
        `${getText('settings_title', user.language)}\n\n` +
        `${getText('current_sign', user.language)} <b>${currentSignName}</b>\n` +
        `${getText('birth_date', user.language)} <b>${birthDateText}</b>\n` +
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
    
    const notificationsStatusText = newStatus ? getText('status_on', user.language) : getText('status_off', user.language);
    const currentSignName = HoroscopeGenerator.SIGNS[user.sign][`name_${user.language}`];
    const birthDateText = user.birth_date ? DateTime.fromJSDate(user.birth_date).toFormat('dd.MM.yyyy') : getText('not_set', user.language);

    await ctx.editMessageText(
        `${getText('settings_title', user.language)}\n\n` +
        `${getText('current_sign', user.language)} <b>${currentSignName}</b>\n` +
        `${getText('birth_date', user.language)} <b>${birthDateText}</b>\n` +
        `${getText('notifications_status', user.language)} <b>${notificationsStatusText}</b>`,
        { reply_markup: Keyboard.settings_menu(user.language, newStatus).reply_markup, parse_mode: 'HTML' }
    );
});

bot.action('settings_language', async (ctx) => {
    await ctx.answerCbQuery();
    const user = await getUser(ctx.from.id);
    await ctx.editMessageText(
        getText('choose_language', user.language),
        Keyboard.language_selection_menu(user.language)
    );
    await updateUser(ctx.from.id, { state: 'awaiting_language_selection' });
});

bot.action(/^set_language_/, async (ctx) => {
    await ctx.answerCbQuery();
    const selectedLang = ctx.match[0].split("_")[2];
    const userId = ctx.from.id;
    await updateUser(userId, { language: selectedLang, state: null });

    const user = await getUser(userId);
    const currentSignName = HoroscopeGenerator.SIGNS[user.sign][`name_${user.language}`];
    const notificationsEnabled = user.daily_notifications_enabled || false;
    const notificationsStatusText = notificationsEnabled ? getText('status_on', user.language) : getText('status_off', user.language);
    const birthDateText = user.birth_date ? DateTime.fromJSDate(user.birth_date).toFormat('dd.MM.yyyy') : getText('not_set', user.language);


    await ctx.editMessageText(
        `${getText('settings_title', user.language)}\n\n` +
        `${getText('current_sign', user.language)} <b>${currentSignName}</b>\n` +
        `${getText('birth_date', user.language)} <b>${birthDateText}</b>\n` +
        `${getText('notifications_status', user.language)} <b>${notificationsStatusText}</b>`,
        { reply_markup: Keyboard.settings_menu(user.language, notificationsEnabled).reply_markup, parse_mode: 'HTML' }
    );
    await ctx.reply(getText(`language_set_${selectedLang}`, selectedLang));
});

// Back buttons from settings
bot.action('back_to_settings_from_lang', async (ctx) => {
    await ctx.answerCbQuery();
    const user = await getUser(ctx.from.id);
    const currentSignName = HoroscopeGenerator.SIGNS[user.sign][`name_${user.language}`];
    const notificationsEnabled = user.daily_notifications_enabled || false;
    const notificationsStatusText = notificationsEnabled ? getText('status_on', user.language) : getText('status_off', user.language);
    const birthDateText = user.birth_date ? DateTime.fromJSDate(user.birth_date).toFormat('dd.MM.yyyy') : getText('not_set', user.language);

    await ctx.editMessageText(
        `${getText('settings_title', user.language)}\n\n` +
        `${getText('current_sign', user.language)} <b>${currentSignName}</b>\n` +
        `${getText('birth_date', user.language)} <b>${birthDateText}</b>\n` +
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
    const notificationsStatusText = notificationsEnabled ? getText('status_on', user.language) : getText('status_off', user.language);
    const birthDateText = user.birth_date ? DateTime.fromJSDate(user.birth_date).toFormat('dd.MM.yyyy') : getText('not_set', user.language);

    await ctx.editMessageText(
        `${getText('settings_title', user.language)}\n\n` +
        `${getText('current_sign', user.language)} <b>${currentSignName}</b>\n` +
        `${getText('birth_date', user.language)} <b>${birthDateText}</b>\n` +
        `${getText('notifications_status', user.language)} <b>${notificationsStatusText}</b>`,
        { reply_markup: Keyboard.settings_menu(user.language, notificationsEnabled).reply_markup, parse_mode: 'HTML' }
    );
    await updateUser(ctx.from.id, { state: null });
});

bot.action('back_to_main_menu_from_settings', async (ctx) => {
    await ctx.answerCbQuery();
    try {
        await ctx.deleteMessage(); // Удаляем текущее сообщение с настройками
    } catch (e) {
        console.warn(`Failed to delete message after back_to_main_menu_from_settings: ${e.message}`);
    }
    const user = await getUser(ctx.from.id);
    await ctx.reply(getText('main_menu_text', user.language), Keyboard.main_menu(user.language));
    await updateUser(ctx.from.id, { state: null });
});


// Entertainments actions
bot.action('entertainment_cookie', async (ctx) => {
    await ctx.answerCbQuery();
    const user = await getUser(ctx.from.id);
    const cookieMessage = HoroscopeGenerator.getFortuneCookie(user.language);
    await ctx.editMessageText( // Используем editMessageText для обновления текущего сообщения
        cookieMessage,
        Keyboard.entertainments_menu(user.language)
    );
});

bot.action('entertainment_8ball', async (ctx) => {
    await ctx.answerCbQuery();
    const user = await getUser(ctx.from.id);
    await ctx.editMessageText(
        getText('ask_question', user.language)
    );
    await updateUser(ctx.from.id, { state: 'awaiting_8ball_question' });
});

bot.action('entertainment_compatibility', async (ctx) => {
    await ctx.answerCbQuery();
    const user = await getUser(ctx.from.id);
    await ctx.editMessageText(
        getText('select_your_sign_comp', user.language),
        Keyboard.compatibility_sign_selection(user.language, 'compatibility_select_sign1')
    );
    await updateUser(ctx.from.id, { state: 'awaiting_compatibility_sign1' });
});

bot.action('back_to_main_menu_from_entertainments', async (ctx) => {
    await ctx.answerCbQuery();
    try {
        await ctx.deleteMessage();
    } catch (e) {
        console.warn(`Failed to delete message after back_to_main_menu_from_entertainments: ${e.message}`);
    }
    const user = await getUser(ctx.from.id);
    await ctx.reply(getText('main_menu_text', user.language), Keyboard.main_menu(user.language));
    await updateUser(ctx.from.id, { state: null });
});

// Back from compatibility
bot.action('back_from_compatibility', async (ctx) => {
    await ctx.answerCbQuery();
    const user = await getUser(ctx.from.id);
    await ctx.editMessageText(
        getText('entertainments_title', user.language),
        Keyboard.entertainments_menu(user.language)
    );
    await updateUser(ctx.from.id, { state: null, compatibility_sign1: null });
});


// --- Обработка ввода текста пользователем (FSM states) ---
bot.on('text', async (ctx, next) => {
    const userId = ctx.from.id;
    const user = await getUser(userId);
    const text = ctx.message.text;

    if (text.startsWith('/')) {
        return next();
    }

    switch (user.state) {
        case 'awaiting_8ball_question':
            const answer = HoroscopeGenerator.getMagic8BallAnswer(user.language);
            await ctx.replyWithHTML(
                answer,
                Keyboard.entertainments_menu(user.language)
            );
            await updateUser(userId, { state: null });
            break;

        case 'awaiting_birthdate':
            try {
                const parts = text.split('.');
                if (parts.length !== 3) {
                    throw new Error("Invalid format");
                }
                const day = parseInt(parts[0]);
                const month = parseInt(parts[1]);
                const year = parseInt(parts[2]);

                const birthDate = DateTime.local(year, month, day);
                if (!birthDate.isValid || day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > DateTime.now().year) {
                    throw new Error("Invalid date values");
                }

                const zodiacSign = HoroscopeGenerator.getSignByBirthDate(birthDate.day, birthDate.month);
                await updateUser(userId, { birth_date: birthDate.toJSDate(), sign: zodiacSign, state: null });

                const currentSignName = HoroscopeGenerator.SIGNS[zodiacSign][`name_${user.language}`];
                const notificationsEnabled = user.daily_notifications_enabled || false;
                const notificationsStatusText = notificationsEnabled ? getText('status_on', user.language) : getText('status_off', user.language);
                const updatedBirthDateText = DateTime.fromJSDate(user.birth_date).toFormat('dd.MM.yyyy');

                await ctx.replyWithHTML(
                    `${getText('birthdate_saved', user.language)} <b>${currentSignName}</b>`,
                    Keyboard.settings_menu(user.language, notificationsEnabled)
                );
            } catch (error) {
                console.error('Error processing birthdate:', error);
                if (error.message === "Invalid format") {
                    await ctx.reply(getText('invalid_date_format', user.language));
                } else {
                    await ctx.reply(getText('invalid_date_value', user.language));
                }
                await updateUser(userId, { state: null }); // Сбрасываем после ошибки
                await ctx.reply(getText('main_menu_text', user.language), Keyboard.main_menu(user.language));
            }
            break;

        default:
            await ctx.reply(getText('unhandled_text', user.language), Keyboard.main_menu(user.language));
            break;
    }
});

// --- Обработка совместимости ---
bot.action(/^compatibility_select_sign1_/, async (ctx) => {
    await ctx.answerCbQuery();
    const sign1Key = ctx.match[0].split("_")[3];
    const user = await getUser(ctx.from.id);
    
    await updateUser(user._id, { state: 'awaiting_compatibility_sign2', compatibility_sign1: sign1Key });

    await ctx.editMessageText(
        getText('select_partner_sign_comp', user.language),
        Keyboard.compatibility_sign_selection(user.language, 'compatibility_select_sign2')
    );
});

bot.action(/^compatibility_select_sign2_/, async (ctx) => {
    await ctx.answerCbQuery();
    const sign2Key = ctx.match[0].split("_")[3];
    const user = await getUser(ctx.from.id);

    const sign1Key = user.compatibility_sign1;

    if (!sign1Key) {
        await ctx.editMessageText(getText('compatibility_error', user.language), Keyboard.entertainments_menu(user.language));
        await updateUser(user._id, { state: null, compatibility_sign1: null });
        return;
    }

    const compatibilityMessage = HoroscopeGenerator.getCompatibility(sign1Key, sign2Key, user.language);
    
    await ctx.editMessageText(
        compatibilityMessage,
        Keyboard.entertainments_menu(user.language)
    );
    await updateUser(user._id, { state: null, compatibility_sign1: null });
});


// --- API Route для Vercel Webhook ---

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
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
