// pages/api/webhook.js
import { connectToDatabase } from '../../lib/mongodb';
import { HoroscopeGenerator, Keyboard } from '../../lib/horoscope';
import { sendMessage, answerCallbackQuery, editMessageText, editMessageReplyMarkup, deleteMessage, showAds } from '../../lib/telegram';

// FSM States
const FSM_STATES = {
    NONE: 'none',
    DONATE_AMOUNT: 'donate_amount',
    SELECT_SIGN: 'select_sign'
};

// Helper functions for user management (getUser, updateUser)
async function getUser(userId) {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection(process.env.MONGO_COLLECTION_NAME || "users");
    let user = await usersCollection.findOne({ _id: userId });
    if (!user) {
        user = { _id: userId, sign: "aries", last_horoscope_date: null, daily_notifications_enabled: true, fsm_state: null };
        await usersCollection.insertOne(user);
    }
    return user;
}

async function updateUser(userId, data) {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection(process.env.MONGO_COLLECTION_NAME || "users");
    await usersCollection.updateOne({ _id: userId }, { $set: data });
}

export default async function handler(req, res) {
    let chatId = null; // Defined here for access in catch block

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    if (!req.body) {
        console.error("Ошибка: Отсутствует тело запроса.");
        return res.status(400).json({ error: 'Missing request body' });
    }

    try {
        const update = req.body;

        if (update.message) {
            const message = update.message;
            chatId = message.chat.id;
            const text = message.text || '';
            const userId = message.from.id;

            const user = await getUser(userId);
            const currentState = user.fsm_state || FSM_STATES.NONE;

            // ... (вся ваша логика обработки сообщений и FSM из api/index.js)
            // Пример:
            if (currentState === FSM_STATES.DONATE_AMOUNT) {
                // ... (логика обработки доната)
            } else if (text === '/start') {
                await sendMessage(chatId, "✨ Welcome to <b>Cosmic Insight</b>...", { reply_markup: Keyboard.mainMenu().reply_markup });
            } else if (text === "🌟 Get Horoscope") {
                const horoscope = HoroscopeGenerator.generate(user);
                const donateBtnBuilder = Keyboard.inlineKeyboardBuilder();
                donateBtnBuilder.push({ text: "❤️ Support Us", callback_data: "show_donate" });
                await sendMessage(chatId, horoscope, { reply_markup: donateBtnBuilder.inline_keyboard });
                await showAds(userId);
            }
            // ... (и так далее для всех команд и текстовых обработчиков)

        } else if (update.callback_query) {
            const callbackQuery = update.callback_query;
            chatId = callbackQuery.message.chat.id;
            const messageId = callbackQuery.message.message_id;
            const userId = callbackQuery.from.id;
            const data = callbackQuery.data;

            await answerCallbackQuery(callbackQuery.id);

            // ... (вся ваша логика обработки callback_query из api/index.js)
            // Пример:
            if (data === "show_donate") {
                await editMessageText(chatId, messageId, "💎 Support our project...", { reply_markup: Keyboard.donateMenu().inline_keyboard });
            }
            // ... (и так далее для всех callback_query)
        } else {
            console.log("Получено обновление неизвестного типа.");
        }

        return res.status(200).json({ status: 'ok' });

    } catch (error) {
        console.error(`Критическая ошибка в обработчике Next.js API: ${error.message}`);
        if (chatId) {
            await sendMessage(chatId, "Произошла внутренняя ошибка. Пожалуйста, попробуйте еще раз.");
        }
        return res.status(500).json({ error: error.message });
    }
}
