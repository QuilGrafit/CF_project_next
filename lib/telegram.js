// lib/telegram.js
import axios from 'axios';
// Import Keyboard if needed for showAds here
// import { Keyboard } from './horoscope'; // Если Keyboard используется в showAds

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADSGRAM_API_KEY = process.env.ADSGRAM_API_KEY;

export async function sendMessage(chatId, text, options = {}) {
    if (!BOT_TOKEN) {
        console.error("Ошибка: BOT_TOKEN не установлен. Невозможно отправить сообщение.");
        return;
    }
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const payload = {
        chat_id: chatId,
        text: text,
        parse_mode: "HTML",
        ...options
    };
    try {
        await axios.post(url, payload);
        console.log(`Сообщение отправлено: '${text}' в чат ${chatId}`);
    } catch (error) {
        console.error(`Ошибка при отправке сообщения: ${error.message}`);
        if (error.response) console.error("Детали ошибки Telegram:", error.response.data);
    }
}

// ... (добавьте сюда остальные функции: answerCallbackQuery, editMessageText, editMessageReplyMarkup, deleteMessage)

export async function showAds(userId) {
    if (!ADSGRAM_API_KEY) {
        console.log("ADSGRAM_API_KEY не установлен. Реклама не будет показана.");
        return;
    }
    if (Math.random() < 0.33) {
        // Вам нужно будет убедиться, что Keyboard доступен здесь, либо передать его, либо импортировать
        const builder = { inline_keyboard: [[{ text: "Visit Sponsor", url: "https://adsgram.ai" }]] };
        await sendMessage(
            userId,
            "✨ <b>Special Offer from our Partner</b> ✨\n\n" +
            "Check out this amazing product!",
            { reply_markup: builder.inline_keyboard }
        );
        console.log(`Показана заглушка рекламы для пользователя ${userId}`);
    }
}
