// lib/telegram.js
import axios from 'axios';
import { Markup } from 'telegraf'; // Используется для Markup.button в showAds

const ADSGRAM_API_KEY = process.env.ADSGRAM_API_KEY;

/**
 * Отправляет сообщение пользователю.
 * @param {import('telegraf').Context['telegram'] | import('telegraf').Telegraf} botInstance Инстанс бота или telegram-объект контекста.
 * @param {number} userId ID пользователя Telegram.
 * @param {string} text Текст сообщения.
 * @param {object} extra Дополнительные параметры для sendMessage (например, reply_markup).
 */
export const sendMessage = async (botInstance, userId, text, extra = {}) => {
    try {
        // Если botInstance - это Context['telegram'], используем его напрямую.
        // Если это Telegraf-инстанс (как в cron.js), используем botInstance.telegram.
        const telegramApi = botInstance.telegram || botInstance;
        await telegramApi.sendMessage(userId, text, { parse_mode: 'HTML', ...extra });
    } catch (error) {
        console.error(`Failed to send message to user ${userId}:`, error);
    }
};

/**
 * Показывает рекламу пользователю через AdsGram API.
 * @param {import('telegraf').Context['telegram'] | import('telegraf').Telegraf} botInstance Инстанс бота или telegram-объект контекста.
 * @param {number} userId ID пользователя Telegram.
 * @param {string} lang Язык пользователя ('en' или 'ru').
 */
export const showAds = async (botInstance, userId, lang = 'en') => {
    if (!ADSGRAM_API_KEY) {
        // console.log("ADSGRAM_API_KEY is not set. Skipping ad display."); // Отключено для чистоты логов
        return;
    }

    try {
        const response = await axios.get(`https://adsgram.ai/api/v1/ads/get?token=${ADSGRAM_API_KEY}&user_id=${userId}`);
        const data = response.data;

        if (data.ok && data.result && data.result.ads && data.result.ads.length > 0) {
            const ad = data.result.ads[0];
            const adText = ad.text;
            const adUrl = ad.url;

            const adButtonText = lang === 'ru' ? "Реклама от AdsGram" : "Ad by AdsGram";
            const markup = Markup.inlineKeyboard([[Markup.button.url(adButtonText, adUrl)]]);

            // Если botInstance - это Context['telegram'], используем его напрямую.
            // Если это Telegraf-инстанс (как в cron.js), используем botInstance.telegram.
            const telegramApi = botInstance.telegram || botInstance;
            await telegramApi.sendMessage(userId, adText, {
                parse_mode: 'HTML',
                reply_markup: markup.reply_markup
            });
            console.log(`Ad shown to user ${userId}.`);
        } else {
            console.log(`No ads available for user ${userId}.`);
        }
    } catch (error) {
        console.error(`Error showing ad to user ${userId}:`, error);
    }
};
