// pages/api/webhook.js
import { Telegraf, Markup, session } from 'telegraf';
import { message } from 'telegraf/filters';
import { MongoClient } from 'mongodb';
import { DateTime } from 'luxon';
import HoroscopeGenerator from '../../lib/horoscope.js';
import Keyboard, { TEXTS } from '../../lib/Keyboard.js'; // Импортируем TEXTS из Keyboard.js
import { sendMessage, showAds } from '../../lib/telegram.js';

// Загрузка переменных окружения
const BOT_TOKEN = process.env.BOT_TOKEN;
const MONGO_URI = process.env.MONGO_URI;
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || 'AstroBotDB';
const MONGO_COLLECTION_NAME = process.env.MONGO_COLLECTION_NAME || 'users';
const TON_WALLET_ADDRESS = process.env.TON_WALLET_ADDRESS;

if (!BOT_TOKEN) throw new Error('BOT_TOKEN must be provided!');
if (!MONGO_URI) throw new Error('MONGO_URI must be provided!');

const bot = new Telegraf(BOT_TOKEN);
let usersCollection;

// Функция для подключения к MongoDB
async function connectToDatabase() {
    if (!usersCollection) {
        try {
            const client = new MongoClient(MONGO_URI);
            await client.connect();
            const db = client.db(MONGO_DB_NAME);
            usersCollection = db.collection(MONGO_COLLECTION_NAME);
            console.log('MongoDB connected and collection obtained successfully!');
        } catch (error) {
            console.error('Failed to connect to MongoDB:', error);
            // Вместо process.exit(1), который может вызвать проблемы на Vercel,
            // лучше просто бросить ошибку и позволить Vercel перезапустить функцию.
            throw new Error('Database connection failed');
        }
    }
    return usersCollection;
}

// Middleware для подключения к базе данных
bot.use(async (ctx, next) => {
    try {
        ctx.usersCollection = await connectToDatabase();
        await next();
    } catch (error) {
        console.error('Middleware DB connection error:', error);
        await sendMessage(ctx, ctx.from.id, TEXTS[ctx.from.language_code || 'ru'].error_processing_request);
    }
});

// Middleware для сессии Telegraf
bot.use(session());

// Пользовательское управление состояниями для ввода даты рождения и знака
const states = new Map(); // Хранит { userId: 'awaiting_birth_date' | 'awaiting_zodiac_sign' | null }

// Вспомогательная функция для получения текста по ключу и языку
function getText(key, lang = 'ru') {
    const languageTexts = TEXTS[lang];
    if (!languageTexts) {
        console.warn(`Language '${lang}' not found in TEXTS. Falling back to 'ru'.`);
        return TEXTS['ru'][key] || key; // Fallback на русский, затем на сам ключ
    }
    const text = languageTexts[key];
    if (typeof text === 'undefined') {
        console.warn(`Text key '${key}' not found for language '${lang}'. Falling back to 'ru'.`);
        return TEXTS['ru'][key] || key; // Fallback на русский, затем на сам ключ
    }
    return text;
}

// Вспомогательная функция для получения пользователя или создания нового
async function getUser(ctx) {
    const usersCollection = ctx.usersCollection;
    let user = await usersCollection.findOne({ _id: ctx.from.id });
    if (!user) {
        user = {
            _id: ctx.from.id,
            language: ctx.from.language_code === 'ru' ? 'ru' : 'en', // По умолчанию ru, иначе en
            birth_date: null,
            zodiac_sign: null,
            horoscope_type: 'daily',
            created_at: new Date(),
            last_activity: new Date(),
        };
        await usersCollection.insertOne(user);
        console.log(`New user created: ${user._id}`);
    } else {
        await usersCollection.updateOne({ _id: ctx.from.id }, { $set: { last_activity: new Date() } });
    }
    return user;
}

// --- Обработчики команд ---

bot.start(async (ctx) => {
    try {
        const user = await getUser(ctx);
        const user_id = user._id;

        // Передаем ctx в sendMessage, т.к. он принимает botInstance
        await sendMessage(ctx, user_id, getText('welcome', user.language), { reply_markup: Keyboard.main_menu(user.language).reply_markup });
    } catch (error) {
        console.error('Error in /start handler:', error);
        await sendMessage(ctx, ctx.from.id, getText('error_processing_request', ctx.from.language_code || 'ru'));
    }
});

bot.hears(Object.values(TEXTS).map(l => l.get_horoscope), async (ctx) => {
    try {
        const user = await getUser(ctx);
        const user_id = user._id;

        if (!user.birth_date && !user.zodiac_sign) {
            await sendMessage(ctx, user_id, getText('enter_birth_date', user.language), { reply_markup: Markup.removeKeyboard().reply_markup });
            states.set(user_id, 'awaiting_birth_date');
            return;
        }

        // Если дата рождения установлена, но знак зодиака нет, пытаемся определить или запросить
        if (!user.zodiac_sign) {
            // Генерируем временный гороскоп, чтобы определить знак по дате рождения
            const tempUserForSignDerivation = { ...user, birth_date: user.birth_date }; // Используем user.birth_date
            const derivedHoroscopeText = await HoroscopeGenerator.generate(tempUserForSignDerivation, user.language);
            
            // Пытаемся извлечь название знака из сгенерированного гороскопа (если формат известен)
            // Или используем getZodiacSignName для определения по дате напрямую, если логика позволяет
            const derivedSignEnglishKey = HoroscopeGenerator.getZodiacSignName(derivedHoroscopeText.split('(')[1]?.split(')')[0]?.trim(), 'en') || 
                                           HoroscopeGenerator.getZodiacSignName(derivedHoroscopeText.split('(')[1]?.split(')')[0]?.trim(), 'ru'); // Пытаемся извлечь и на русском, если на английском не сработало

            if (derivedSignEnglishKey) {
                // Найдем английский ключ знака зодиака
                const englishKey = Object.values(HoroscopeGenerator.SIGNS).find(
                    s => s.name.en === derivedSignEnglishKey || s.name.ru === derivedSignEnglishKey
                )?.name.en;

                if (englishKey) {
                    await ctx.usersCollection.updateOne({ _id: user_id }, { $set: { zodiac_sign: englishKey } });
                    user.zodiac_sign = englishKey; // Обновляем объект пользователя в памяти
                }
            } else {
                await sendMessage(ctx, user_id, getText('choose_sign', user.language), { reply_markup: Keyboard.zodiac_sign_selection_inline(user.language).reply_markup });
                states.set(user_id, 'awaiting_zodiac_sign_from_horoscope_request'); // Новое состояние для этого сценария
                return;
            }
        }
        
        const horoscope = await HoroscopeGenerator.generate(user, user.language);
        const zodiacSignName = HoroscopeGenerator.getZodiacSignName(user.zodiac_sign, user.language);
        
        // Комбинируем текст гороскопа со знаком и типом
        const fullHoroscopeText = getText('horoscope_for', user.language)
            .replace('{{type}}', getText(user.horoscope_type, user.language)) // Предполагаем, что daily/weekly/monthly есть в TEXTS
            .replace('{{sign}}', zodiacSignName);

        // Используем bot.botInfo.username для ссылки на бота
        const botUsername = bot.botInfo?.username || 'CosmicForecast_bot'; // Fallback если username еще не инициализирован
        const shareUrl = encodeURIComponent(`https://t.me/${botUsername}?start=horoscope_${user.zodiac_sign.toLowerCase()}_${user.horoscope_type}`);
        const shareText = encodeURIComponent(fullHoroscopeText + "\n\n" + getText('horoscope_share_invite', user.language));

        const combinedMarkup = Markup.inlineKeyboard([
            [Markup.button.url(getText('share_horoscope_button', user.language || 'ru'), `https://t.me/share/url?url=${shareUrl}&text=${shareText}`)]
        ]);

        await sendMessage(ctx, user_id, `${fullHoroscopeText}\n\n${horoscope}`, { reply_markup: combinedMarkup.reply_markup });
        await showAds(ctx, user_id, user.language); // Передаем ctx напрямую как botInstance
    } catch (error) {
        console.error('Error in Get Horoscope handler:', error);
        await sendMessage(ctx, ctx.from.id, getText('error_processing_request', ctx.from.language_code || 'ru'));
    }
});

bot.hears(Object.values(TEXTS).map(l => l.settings), async (ctx) => {
    try {
        const user = await getUser(ctx);
        const user_id = user._id;

        await sendMessage(ctx, user_id, getText('settings_intro', user.language), { reply_markup: Keyboard.settings_menu(user.language).reply_markup });
    } catch (error) {
        console.error('Error in Settings handler:', error);
        await sendMessage(ctx, ctx.from.id, getText('error_processing_request', ctx.from.language_code || 'ru'));
    }
});

bot.hears(Object.values(TEXTS).map(l => l.support_project), async (ctx) => {
    try {
        const user = await getUser(ctx);
        const user_id = user._id;

        // Убедимся, что TON_WALLET_ADDRESS доступен
        if (!TON_WALLET_ADDRESS) {
            console.error("TON_WALLET_ADDRESS is not set.");
            await sendMessage(ctx, user_id, getText('error_processing_request', user.language));
            return;
        }

        await sendMessage(
            ctx, user_id,
            getText('support_project_intro', user.language) + '\n\n' +
            getText('ton_wallet_address', user.language).replace('{{address}}', TON_WALLET_ADDRESS),
            { reply_markup: Keyboard.donate_menu(user.language, TON_WALLET_ADDRESS).reply_markup }
        );
    } catch (error) {
        console.error('Error in Support Project handler:', error);
        await sendMessage(ctx, ctx.from.id, getText('error_processing_request', ctx.from.language_code || 'ru'));
    }
});

bot.hears(Object.values(TEXTS).map(l => l.change_language), async (ctx) => {
    try {
        const user = await getUser(ctx);
        const user_id = user._id;

        await sendMessage(ctx, user_id, getText('choose_language', user.language), { reply_markup: Keyboard.language_selection_inline(user.language).reply_markup });
    } catch (error) {
        console.error('Error in Change Language handler:', error);
        await sendMessage(ctx, ctx.from.id, getText('error_processing_request', ctx.from.language_code || 'ru'));
    }
});

bot.hears(Object.values(TEXTS).map(l => l.change_birth_date), async (ctx) => {
    try {
        const user = await getUser(ctx);
        const user_id = user._id;

        await sendMessage(ctx, user_id, getText('enter_birth_date', user.language), { reply_markup: Markup.removeKeyboard().reply_markup });
        states.set(user_id, 'awaiting_birth_date');
    } catch (error) {
        console.error('Error in Change Birth Date handler:', error);
        await sendMessage(ctx, ctx.from.id, getText('error_processing_request', ctx.from.language_code || 'ru'));
    }
});

bot.hears(Object.values(TEXTS).map(l => l.change_zodiac_sign), async (ctx) => {
    try {
        const user = await getUser(ctx);
        const user_id = user._id;

        await sendMessage(ctx, user_id, getText('choose_sign', user.language), { reply_markup: Keyboard.zodiac_sign_selection_inline(user.language).reply_markup });
        states.set(user_id, 'awaiting_zodiac_sign');
    } catch (error) {
        console.error('Error in Change Zodiac Sign handler:', error);
        await sendMessage(ctx, ctx.from.id, getText('error_processing_request', ctx.from.language_code || 'ru'));
    }
});

bot.hears(Object.values(TEXTS).map(l => l.change_horoscope_type), async (ctx) => {
    try {
        const user = await getUser(ctx);
        const user_id = user._id;

        await sendMessage(ctx, user_id, getText('choose_horoscope_type', user.language), { reply_markup: Keyboard.horoscope_type_selection_inline(user.language, user.horoscope_type).reply_markup });
    } catch (error) {
        console.error('Error in Change Horoscope Type handler:', error);
        await sendMessage(ctx, ctx.from.id, getText('error_processing_request', ctx.from.language_code || 'ru'));
    }
});

bot.hears(Object.values(TEXTS).map(l => l.back_to_main_menu), async (ctx) => {
    try {
        const user = await getUser(ctx);
        const user_id = user._id;

        states.delete(user_id); // Очищаем любое ожидающее состояние
        await sendMessage(ctx, user_id, getText('back_to_main_menu', user.language), { reply_markup: Keyboard.main_menu(user.language).reply_markup });
    } catch (error) {
        console.error('Error in Back to Main Menu handler:', error);
        await sendMessage(ctx, ctx.from.id, getText('error_processing_request', ctx.from.language_code || 'ru'));
    }
});

// Обработчик текстового ввода для даты рождения
bot.on(message('text'), async (ctx) => {
    try {
        const user = await getUser(ctx);
        const user_id = user._id;
        const currentState = states.get(user_id);

        if (currentState === 'awaiting_birth_date') {
            const dateText = ctx.message.text.trim();
            const parsedDate = DateTime.fromFormat(dateText, 'dd.MM.yyyy');

            if (parsedDate.isValid) {
                await ctx.usersCollection.updateOne({ _id: user_id }, { $set: { birth_date: parsedDate.toJSDate() } });
                states.delete(user_id); // Очищаем состояние
                await sendMessage(ctx, user_id, getText('birth_date_set_success', user.language), { reply_markup: Keyboard.main_menu(user.language).reply_markup });
                
                // Если знак зодиака не был установлен, пытаемся определить его после установки даты рождения
                if (!user.zodiac_sign) {
                    const tempUserForSignDerivation = { ...user, birth_date: parsedDate.toJSDate() }; // Создаем временный объект пользователя с новой датой
                    const derivedHoroscopeText = await HoroscopeGenerator.generate(tempUserForSignDerivation, user.language);
                    const derivedSignEnglishKey = HoroscopeGenerator.getZodiacSignName(derivedHoroscopeText.split('(')[1]?.split(')')[0]?.trim(), 'en') ||
                                                  HoroscopeGenerator.getZodiacSignName(derivedHoroscopeText.split('(')[1]?.split(')')[0]?.trim(), 'ru');
                    
                    if (derivedSignEnglishKey) {
                        const englishKey = Object.values(HoroscopeGenerator.SIGNS).find(
                            s => s.name.en === derivedSignEnglishKey || s.name.ru === derivedSignEnglishKey
                        )?.name.en;
                        if (englishKey) {
                            await ctx.usersCollection.updateOne({ _id: user_id }, { $set: { zodiac_sign: englishKey } });
                            await sendMessage(ctx, user_id, getText('sign_set_success', user.language) + ' ' + HoroscopeGenerator.getZodiacSignName(englishKey, user.language), { reply_markup: Keyboard.main_menu(user.language).reply_markup });
                        }
                    }
                }
            } else {
                await sendMessage(ctx, user_id, getText('invalid_date_format', user.language));
            }
        } else {
            // Fallback для неизвестных текстовых команд
            await sendMessage(ctx, user_id, getText('unknown_command', user.language));
        }
    } catch (error) {
        console.error('Error in text message handler:', error);
        await sendMessage(ctx, ctx.from.id, getText('error_processing_request', ctx.from.language_code || 'ru'));
    }
});


// Обработчик callback-запросов (нажатий инлайн-кнопок)
bot.on('callback_query', async (ctx) => {
    try {
        const user = await getUser(ctx);
        const user_id = user._id;
        const data = ctx.callbackQuery.data;

        // По умолчанию ответ на callback-запрос
        let responseText = getText('copied_to_clipboard', user.language); 
        let messageEdited = false; // Флаг, чтобы знать, было ли отредактировано сообщение

        if (data.startsWith('set_lang_')) {
            const newLang = data.split('_')[2];
            await ctx.usersCollection.updateOne({ _id: user_id }, { $set: { language: newLang } });
            user.language = newLang; // Обновляем объект пользователя в памяти
            responseText = getText('language_set_success', user.language);
            await ctx.editMessageText(getText('your_current_language', user.language).replace('{{lang}}', newLang === 'ru' ? 'Русский' : 'English'), {
                reply_markup: Keyboard.language_selection_inline(newLang).reply_markup
            });
            messageEdited = true;
        } else if (data.startsWith('set_sign_')) {
            const newSignEnglishKey = data.split('_')[2]; // Получаем английский ключ знака
            const zodiacSignNameLocalized = HoroscopeGenerator.getZodiacSignName(newSignEnglishKey, user.language);
            await ctx.usersCollection.updateOne({ _id: user_id }, { $set: { zodiac_sign: newSignEnglishKey } }); // Храним английский ключ
            user.zodiac_sign = newSignEnglishKey; // Обновляем user.zodiac_sign английским ключом
            responseText = getText('sign_set_success', user.language);
            await ctx.editMessageText(getText('your_current_sign', user.language).replace('{{sign}}', zodiacSignNameLocalized), {
                reply_markup: Keyboard.zodiac_sign_selection_inline(user.language).reply_markup
            });
            states.delete(user_id); // Очищаем состояние, если было установлено запросом гороскопа
            messageEdited = true;
        } else if (data.startsWith('set_horoscope_type_')) {
            const newType = data.split('_')[3];
            await ctx.usersCollection.updateOne({ _id: user_id }, { $set: { horoscope_type: newType } });
            user.horoscope_type = newType; // Обновляем объект пользователя в памяти
            responseText = getText('horoscope_type_set_success', user.language);
            await ctx.editMessageText(getText('your_current_horoscope_type', user.language).replace('{{type}}', getText(newType, user.language)), {
                reply_markup: Keyboard.horoscope_type_selection_inline(user.language, newType).reply_markup
            });
            messageEdited = true;
        } else if (data === 'back_to_main_menu_from_donate') {
            await ctx.editMessageText(getText('back_to_main_menu', user.language), {
                reply_markup: Keyboard.main_menu(user.language).reply_markup
            });
            messageEdited = true;
        }

        // Всегда отвечаем на callback_query, чтобы избежать "query is too old"
        await ctx.answerCbQuery(responseText, { cache_time: 10 });

    } catch (error) {
        console.error('Error handling Telegram update (callback_query):', error);
        // Обязательно отвечаем на callback_query даже при ошибке
        await ctx.answerCbQuery(getText('error_processing_request', ctx.from.language_code || 'ru'), { cache_time: 10 }).catch(e => console.error("Failed to answer callback query on error:", e));
    }
});


// Экспортируем обработчик вебхука
export default async (req, res) => {
    if (req.method === 'POST') {
        try {
            // Обрабатываем входящий апдейт
            await bot.handleUpdate(req.body, res);
        } catch (error) {
            console.error('Error handling webhook update (bot.handleUpdate):', error);
            res.status(500).send('Internal Server Error');
        }
    } else {
        // Ответ на GET-запросы к URL вебхука
        res.status(200).send('OK');
    }
};

// Начальная настройка бота (например, получение информации о боте) выполняется один раз при "холодном" запуске
(async () => {
    try {
        await connectToDatabase(); // Убедимся, что БД подключена при холодном старте
        bot.botInfo = await bot.telegram.getMe();
        console.log(`Bot username initialized: @${bot.botInfo.username}`);
    } catch (error) {
        console.error('Initial bot setup failed:', error);
        // Не вызываем process.exit(1), чтобы Vercel мог перезапустить функцию
        throw new Error('Initial bot setup failed');
    }
})();
