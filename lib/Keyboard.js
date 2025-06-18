// lib/Keyboard.js
import { Markup } from 'telegraf';

const Keyboard = {
    // Главное меню (аналог main_menu_keyboard в astro.py)
    main_menu: () => {
        return Markup.keyboard([
            [Markup.button.text("🔮 Get Horoscope"), Markup.button.text("🎲 Entertainments")], // Добавлено Entertainments
            [Markup.button.text("⚙️ Settings"), Markup.button.text("❤️ Support Project")] // Premium заменено на Support Project
        ]).resize();
    },

    // Меню развлечений (новое)
    entertainments_menu: () => {
        return Markup.inlineKeyboard([
            [Markup.button.callback("🥠 Fortune Cookie", "entertainment_cookie")],
            [Markup.button.callback("🎱 Magic 8-Ball", "entertainment_8ball")],
            [Markup.button.callback("💖 Compatibility Test", "entertainment_compatibility")], // Новая фича
            [Markup.button.callback("⬅️ Back to Main Menu", "back_to_main_menu_from_entertainments")]
        ]);
    },

    // Меню доната (аналог donate_keyboard в astro.py)
    donate_menu: () => {
        return Markup.inlineKeyboard([
            [Markup.button.callback("💎 5 TON", "donate_5"), Markup.button.callback("💎 10 TON", "donate_10")],
            [Markup.button.callback("💎 Custom Amount", "donate_custom")],
            [Markup.button.callback("🚫 Close", "close_donate")]
        ]);
    },

    // Меню настроек (аналог settings_keyboard в astro.py)
    settings_menu: (user_language, notifications_enabled) => {
        const lang_text = user_language === 'ru' ? "Язык: Русский" : "Language: English";
        const notifications_text = notifications_enabled ? "🔔 Daily Notifications: ON" : "🔕 Daily Notifications: OFF";
        return Markup.inlineKeyboard([
            [Markup.button.callback("✨ Select Zodiac Sign", "settings_select_sign")],
            [Markup.button.callback(notifications_text, "settings_toggle_notifications")],
            [Markup.button.callback(lang_text, "settings_language")], // Добавлена кнопка языка
            [Markup.button.callback("⬅️ Back to Menu", "back_to_main_menu_from_settings")]
        ]);
    },

    // Выбор языка (новое)
    language_selection_menu: () => {
        return Markup.inlineKeyboard([
            [Markup.button.callback("🇷🇺 Русский", "set_language_ru")],
            [Markup.button.callback("🇬🇧 English", "set_language_en")],
            [Markup.button.callback("⬅️ Back to Settings", "back_to_settings_from_lang")]
        ]);
    },

    // Выбор знака зодиака (аналог zodiac_sign_selection_keyboard в astro.py)
    zodiac_sign_selection: () => {
        const signs = {
            "aries": {"emoji": "♈️", "name_en": "Aries", "name_ru": "Овен"},
            "taurus": {"emoji": "♉️", "name_en": "Taurus", "name_ru": "Телец"},
            "gemini": {"emoji": "♊️", "name_en": "Gemini", "name_ru": "Близнецы"},
            "cancer": {"emoji": "♋️", "name_en": "Cancer", "name_ru": "Рак"},
            "leo": {"emoji": "♌️", "name_en": "Leo", "name_ru": "Лев"},
            "virgo": {"emoji": "♍️", "name_en": "Virgo", "name_ru": "Дева"},
            "libra": {"emoji": "♎️", "name_en": "Libra", "name_ru": "Весы"},
            "scorpio": {"emoji": "♏️", "name_en": "Scorpio", "name_ru": "Скорпион"},
            "sagittarius": {"emoji": "♐️", "name_en": "Sagittarius", "name_ru": "Стрелец"},
            "capricorn": {"emoji": "♑️", "name_en": "Capricorn", "name_ru": "Козерог"},
            "aquarius": {"emoji": "♒️", "name_en": "Aquarius", "name_ru": "Водолей"},
            "pisces": {"emoji": "♓️", "name_en": "Pisces", "name_ru": "Рыбы"},
        };
        const buttons = Object.entries(signs).map(([key, info]) =>
            Markup.button.callback(`${info.emoji} ${info.name_en}`, `set_sign_${key}`) // Используем EN названия для кнопок
        );
        const rows = [];
        for (let i = 0; i < buttons.length; i += 3) {
            rows.push(buttons.slice(i, i + 3));
        }
        rows.push([Markup.button.callback("⬅️ Back to Settings", "back_to_settings_from_sign")]); // Кнопка назад
        return Markup.inlineKeyboard(rows);
    },

    // Кнопки для расшаривания (аналог share_bot_keyboard в astro.py)
    share_bot_keyboard: (botUsername) => {
        const shareText = "✨ Get your daily cosmic insights and more with AstroBot! Join now:"; // Это можно сделать мультиязычным
        const shareTextEncoded = encodeURIComponent(shareText);
        return Markup.inlineKeyboard([
            [Markup.button.url("💌 Share Bot", `https://t.me/share/url?url=https://t.me/${botUsername}&text=${shareTextEncoded}`)]
        ]);
    }
};

export default Keyboard;
