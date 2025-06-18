// lib/telegram.js
import axios from 'axios'; // <-- Проверьте этот импорт

const BOT_TOKEN = process.env.BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

class TelegramService {
    static async sendMessage(chatId, text, reply_markup = null) {
        try {
            const payload = {
                chat_id: chatId,
                text: text,
                parse_mode: 'HTML' // Убедитесь, что HTML-форматирование включено
            };
            if (reply_markup) {
                payload.reply_markup = reply_markup;
            }
            await axios.post(`${TELEGRAM_API}/sendMessage`, payload);
        } catch (error) {
            console.error('Error sending message:', error.response ? error.response.data : error.message);
        }
    }

    static async editMessage(chatId, messageId, text, reply_markup = null) {
        try {
            const payload = {
                chat_id: chatId,
                message_id: messageId,
                text: text,
                parse_mode: 'HTML'
            };
            if (reply_markup) {
                payload.reply_markup = reply_markup;
            }
            await axios.post(`${TELEGRAM_API}/editMessageText`, payload);
        } catch (error) {
            console.error('Error editing message:', error.response ? error.response.data : error.message);
        }
    }

    static async answerCallbackQuery(callbackQueryId, text = '', showAlert = false) {
        try {
            await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, {
                callback_query_id: callbackQueryId,
                text: text,
                show_alert: showAlert
            });
        } catch (error) {
            console.error('Error answering callback query:', error.response ? error.response.data : error.message);
        }
    }
}

export { TelegramService };
