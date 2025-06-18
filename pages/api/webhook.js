// pages/api/webhook.js

import connectToDatabase from '../../lib/mongodb.js';
import { HoroscopeGenerator, Keyboard } from '../../lib/horoscope.js';
import { TelegramService } from '../../lib/telegram.js';

// FSM States (состояния конечного автомата)
const STATES = {
    DEFAULT: 'default',
    WAITING_FOR_SIGN: 'waiting_for_sign',
    WAITING_FOR_CUSTOM_DONATION: 'waiting_for_custom_donation'
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    const update = req.body;
    console.log("Received Telegram update:", JSON.stringify(update, null, 2)); // Логируем входящее обновление

    // Проверяем, есть ли сообщение или callback query
    const message = update.message;
    const callbackQuery = update.callback_query;

    if (!message && !callbackQuery) {
        return res.status(200).send('No message or callback query in update.');
    }

    let chatId;
    let text;
    let messageId;
    let fromId;
    let firstName;
    let isCallback = false;

    if (message) {
        chatId = message.chat.id;
        text = message.text;
        fromId = message.from.id;
        firstName = message.from.first_name || 'User';
    } else if (callbackQuery) {
        chatId = callbackQuery.message.chat.id;
        text = callbackQuery.data; // Для callback query данные находятся в 'data'
        messageId = callbackQuery.message.message_id;
        fromId = callbackQuery.from.id;
        firstName = callbackQuery.from.first_name || 'User';
        isCallback = true;
    }

    if (!chatId) {
        console.error("Chat ID not found in update:", update);
        return res.status(400).send('Chat ID not found.');
    }

    let dbResult;
    try {
        dbResult = await connectToDatabase();
        if (!dbResult || !dbResult.collection) {
            throw new Error("MongoDB connection did not return a valid collection.");
        }
    } catch (error) {
        console.error("Failed to connect to DB in webhook:", error);
        await TelegramService.sendMessage(chatId, "Извините, сейчас проблемы с подключением к базе данных. Попробуйте позже.");
        return res.status(500).send('DB connection error');
    }

    const usersCollection = dbResult.collection;

    let user = await usersCollection.findOne({ telegram_id: fromId });

    if (!user) {
        // Создаем нового пользователя, если его нет
        user = {
            telegram_id: fromId,
            first_name: firstName,
            username: message?.from?.username || '',
            sign: null, // Знак зодиака по умолчанию null
            state: STATES.DEFAULT, // Изначальное состояние
            daily_notifications_enabled: false, // Уведомления по умолчанию отключены
            lang: 'ru', // Язык по умолчанию
            created_at: new Date()
        };
        await usersCollection.insertOne(user);
        console.log(`New user created: ${fromId}`);
    }

    // Обработка команд и сообщений
    try {
        if (isCallback) {
            await TelegramService.answerCallbackQuery(callbackQuery.id); // Отвечаем на callbackQuery
            await handleCallbackQuery(user, usersCollection, chatId, messageId, text);
        } else {
            await handleMessage(user, usersCollection, chatId, text);
        }
        res.status(200).send('OK'); // Важно всегда отправлять 200 OK
    } catch (error) {
        console.error("Error processing message/callback:", error);
        await TelegramService.sendMessage(chatId, "Произошла непредвиденная ошибка. Пожалуйста, попробуйте еще раз.");
        res.status(500).send('Internal Server Error');
    }
}

// --- Обработчики сообщений и колбэков ---

async function handleMessage(user, usersCollection, chatId, text) {
    let replyText = "";
    let replyMarkup = null;

    if (user.state === STATES.WAITING_FOR_CUSTOM_DONATION) {
        const amount = parseFloat(text);
        if (!isNaN(amount) && amount > 0) {
            replyText = `Спасибо за вашу щедрость! Для доната ${amount} TON на адрес ${process.env.TON_WALLET_ADDRESS}.`;
            user.state = STATES.DEFAULT; // Возвращаем в дефолтное состояние
            await usersCollection.updateOne({ telegram_id: user.telegram_id }, { $set: { state: user.state } });
            replyMarkup = Keyboard.mainMenu().reply_markup;
        } else {
            replyText = "Пожалуйста, введите корректную сумму для доната (число).";
        }
        await TelegramService.sendMessage(chatId, replyText, replyMarkup);
        return;
    }

    switch (text) {
        case "/start":
            replyText = `Привет, ${user.first_name}! Я твой личный астролог. Выбери знак зодиака в настройках, чтобы получить гороскоп.`;
            replyMarkup = Keyboard.mainMenu().reply_markup;
            await TelegramService.sendMessage(chatId, replyText, replyMarkup);
            break;
        case "🌟 Get Horoscope":
            if (user.sign) {
                const horoscopeText = HoroscopeGenerator.generate(user);
                await TelegramService.sendMessage(chatId, horoscopeText);
            } else {
                replyText = "Пожалуйста, сначала выберите свой знак зодиака в настройках (⚙️ Settings).";
                await TelegramService.sendMessage(chatId, replyText);
                // Можно сразу предложить выбрать знак
                await TelegramService.sendMessage(chatId, "Выберите ваш знак зодиака:", Keyboard.zodiacSignSelection());
            }
            break;
        case "💎 Premium":
            replyText = "Поддержите проект, сделав донат в TON! Выберите сумму или введите свою:";
            await TelegramService.sendMessage(chatId, replyText, Keyboard.donateMenu());
            break;
        case "⚙️ Settings":
            replyText = "Настройки бота:";
            await TelegramService.sendMessage(chatId, replyText, Keyboard.settingsMenu(user));
            break;
        default:
            replyText = "Извините, я не понимаю вашу команду. Используйте кнопки меню.";
            replyMarkup = Keyboard.mainMenu().reply_markup;
            await TelegramService.sendMessage(chatId, replyText, replyMarkup);
            break;
    }
}

async function handleCallbackQuery(user, usersCollection, chatId, messageId, data) {
    let replyText = "";
    let replyMarkup = null;
    let needsEdit = false;

    if (data.startsWith('set_sign_')) {
        const newSign = data.replace('set_sign_', '');
        user.sign = newSign;
        await usersCollection.updateOne({ telegram_id: user.telegram_id }, { $set: { sign: newSign } });
        replyText = `Ваш знак зодиака установлен как <b>${newSign.charAt(0).toUpperCase() + newSign.slice(1)}</b>.`;
        needsEdit = true;
        replyMarkup = Keyboard.settingsMenu(user); // Обновляем настройки после смены знака
    } else if (data === 'settings_notifications') {
        user.daily_notifications_enabled = !user.daily_notifications_enabled;
        await usersCollection.updateOne(
            { telegram_id: user.telegram_id },
            { $set: { daily_notifications_enabled: user.daily_notifications_enabled } }
        );
        replyText = user.daily_notifications_enabled ? "Ежедневные уведомления 🔔 включены." : "Ежедневные уведомления 🔕 отключены.";
        needsEdit = true;
        replyMarkup = Keyboard.settingsMenu(user);
    } else if (data === 'settings_select_sign') {
        replyText = "Выберите ваш знак зодиака:";
        needsEdit = true;
        replyMarkup = Keyboard.zodiacSignSelection();
    } else if (data.startsWith('donate_')) {
        if (data === 'donate_custom') {
            user.state = STATES.WAITING_FOR_CUSTOM_DONATION;
            await usersCollection.updateOne({ telegram_id: user.telegram_id }, { $set: { state: user.state } });
            replyText = "Пожалуйста, введите сумму в TON для доната:";
            needsEdit = true;
            // Убираем inline-клавиатуру, ожидаем текстовый ввод
            replyMarkup = { inline_keyboard: [] }; 
        } else {
            const amount = data.replace('donate_', '');
            replyText = `Спасибо за вашу щедрость! Для доната ${amount} TON на адрес ${process.env.TON_WALLET_ADDRESS}.`;
            needsEdit = true;
            replyMarkup = Keyboard.donateMenu(); // Можно вернуть меню доната или главное меню
        }
    } else if (data === 'back_to_main_menu') {
        replyText = "Добро пожаловать в главное меню!";
        needsEdit = true;
        // Для ReplyKeyboard это обычно sendMessage, но для InlineKeyboard можно редактировать
        // Если это InlineKeyboard, то просто отправляем новое сообщение или редактируем старое
        replyMarkup = Keyboard.mainMenu().reply_markup;
        // Если мы переходим от Inline к Reply, то лучше sendMessage
        await TelegramService.sendMessage(chatId, replyText, replyMarkup);
        return; // Выходим, чтобы не вызывать editMessage
    } else if (data === 'back_to_settings_menu') {
        replyText = "Настройки бота:";
        needsEdit = true;
        replyMarkup = Keyboard.settingsMenu(user);
    }

    if (needsEdit) {
        await TelegramService.editMessage(chatId, messageId, replyText, replyMarkup);
    } else {
        await TelegramService.sendMessage(chatId, replyText, replyMarkup);
    }
}
