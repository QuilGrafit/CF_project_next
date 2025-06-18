// lib/telegram.js
import axios from 'axios';
import { Markup } from 'telegraf'; // Markup нужен для кнопок в рекламе

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADSGRAM_API_KEY = process.env.ADSGRAM_API_KEY;

if (!BOT_TOKEN) {
    console.error("BOT_TOKEN environment variable is not set!");
}

/**
 * Отправляет текстовое сообщение в Telegram.
 */
export async function sendMessage(chatId, text, options = {}) {
    if (!BOT_TOKEN) {
        console.error("Cannot send message: BOT_TOKEN is not defined.");
        return;
    }
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    try {
        const response = await axios.post(url, {
            chat_id: chatId,
            text: text,
            parse_mode: 'HTML', // Default to HTML, as in astro.py
            ...options
        });
        return response.data;
    } catch (error) {
        console.error("Error sending message to Telegram:", error.response ? error.response.data : error.message);
        throw error;
    }
}

/**
 * Функция для показа рекламы (ваш AdsGram функционал).
 * Адаптировано из show_ads в astro.py
 */
export async function showAds(chatId, lang = 'en') {
    if (!ADSGRAM_API_KEY) {
        console.info("ADSGRAM_API_KEY is not set. Ads will not be shown.");
        return;
    }

    try {
        // Здесь должна быть реальная логика запроса рекламы из AdsGram API.
        // Я использую заглушку и ваш пример логики из astro.py.

        const ADS_URL = `https://api.adsgram.ai/ads/get?token=${ADSGRAM_API_KEY}&count=1`;
        const ADS_CHANCE = 0.33; // 33% шанс показать рекламу

        if (Math.random() < ADS_CHANCE) {
            let adContent = {
                title: lang === 'ru' ? "Партнерский материал" : "Sponsored Content",
                body: lang === 'ru' ? "Узнайте о наших специальных предложениях!" : "Check out our special offers!",
                link_text: lang === 'ru' ? "Подробнее" : "Learn More",
                link_url: "https://adsgram.ai" // Заглушка, замените на реальные данные из AdsGram
            };

            // В идеале, здесь вы бы делали запрос к ADS_URL и парсили ответ
            // const response = await axios.get(ADS_URL);
            // if (response.data && response.data.ads && response.data.ads.length > 0) {
            //     const ad = response.data.ads[0];
            //     adContent = {
            //         title: ad.title || adContent.title,
            //         body: ad.body || adContent.body,
            //         link_text: ad.link_text || adContent.link_text,
            //         link_url: ad.link_url || adContent.link_url
            //     };
            // }

            const builder = Markup.inlineKeyboard([
                [Markup.button.url(adContent.link_text, adContent.link_url)]
            ]);

            await sendMessage(
                chatId,
                `✨ <b>${adContent.title}</b> ✨\n\n${adContent.body}`,
                { reply_markup: builder.reply_markup }
            );
            console.log(`Shown ad to user ${chatId}`);
        }
    } catch (error) {
        console.error(`Error trying to show ads for ${chatId}:`, error.response ? error.response.data : error.message);
    }
}
