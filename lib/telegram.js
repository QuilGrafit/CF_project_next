// lib/telegram.js
import axios from 'axios';

const BOT_TOKEN = process.env.BOT_TOKEN;

// Проверка на наличие токена бота
if (!BOT_TOKEN) {
    console.error("BOT_TOKEN environment variable is not set!");
    // В продакшене можно выбросить ошибку или просто залогировать
}

/**
 * Отправляет текстовое сообщение в Telegram.
 * @param {number|string} chatId ID чата или имя пользователя.
 * @param {string} text Текст сообщения.
 * @param {object} [options={}] Дополнительные опции для API Telegram (например, parse_mode, reply_markup).
 */
export async function sendMessage(chatId, text, options = {}) {
    if (!BOT_TOKEN) {
        console.error("Cannot send message: BOT_TOKEN is not defined.");
        return; // Или выбросить ошибку
    }
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    try {
        const response = await axios.post(url, {
            chat_id: chatId,
            text: text,
            ...options
        });
        // console.log("Message sent:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error sending message to Telegram:", error.response ? error.response.data : error.message);
        throw error; // Перебрасываем ошибку, чтобы она могла быть обработана выше
    }
}

/**
 * Функция для показа рекламы (ваш AdsGram функционал).
 * @param {number|string} chatId ID чата.
 */
export async function showAds(chatId) {
    // Вставьте сюда вашу реальную логику для показа рекламы.
    // Возможно, вам нужно будет получать рекламные креативы из БД или внешнего сервиса.
    // Это просто заглушка:
    console.log(`Showing ads to chat ID: ${chatId}`);
    try {
        await sendMessage(chatId, "Это рекламное сообщение! Поддержите проект!"); // Пример
        // Можно добавить кнопки или изображения для рекламы
    } catch (error) {
        console.error("Error showing ads:", error);
    }
}

// Если у вас есть другие функции, связанные с Telegram API, экспортируйте их здесь:
// export async function anotherTelegramFunction(...) { ... }

// Важно: если вы в `webhook.js` импортируете `{ sendMessage, showAds }`, то вам нужны именованные экспорты, как показано выше.
// Если бы вы использовали `export default { sendMessage, showAds }` здесь,
// то в `webhook.js` импорт выглядел бы так: `import TelegramAPI from '../../lib/telegram.js';`
// А затем вы бы вызывали: `TelegramAPI.sendMessage(...)`
