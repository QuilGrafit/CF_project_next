// lib/Keyboard.js
import { Markup } from 'telegraf';
// Импортируем HoroscopeGenerator для доступа к SIGNS
import HoroscopeGenerator from './horoscope.js';

const Keyboard = {
    // Главное меню
    main_menu: (lang = 'en') => {
        const texts = {
            'en': {
                getHoroscope: "🔮 Get Horoscope",
                entertainments: "🎲 Entertainments",
                settings: "⚙️ Settings",
                supportProject: "❤️ Support Project"
            },
            'ru': {
                getHoroscope: "🔮 Получить Гороскоп",
                entertainments: "🎲 Развлечения",
                settings: "⚙️ Настройки",
                supportProject: "❤️ Поддержать Проект"
            }
        };
        const t = texts[lang] || texts['en']; // Дефолт на EN
        return Markup.keyboard([
            [Markup.button.text(t.getHoroscope), Markup.button.text(t.entertainments)],
            [Markup.button.text(t.settings), Markup.button.text(t.supportProject)]
        ]).resize();
    },

    // Меню развлечений
    entertainments_menu: (lang = 'en') => {
        const texts = {
            'en': {
                fortuneCookie: "🥠 Fortune Cookie",
                magic8Ball: "🎱 Magic 8-Ball",
                compatibilityTest: "💖 Compatibility Test",
                backToMainMenu: "⬅️ Back to Main Menu"
            },
            'ru': {
                fortuneCookie: "🥠 Печенька с Предсказанием",
                magic8Ball: "🎱 Магический Шар 8",
                compatibilityTest: "💖 Тест на Совместимость",
                backToMainMenu: "⬅️ Назад в Главное Меню"
            }
        };
        const t = texts[lang] || texts['en'];
        return Markup.inlineKeyboard([
            [Markup.button.callback(t.fortuneCookie, "entertainment_cookie")],
            [Markup.button.callback(t.magic8Ball, "entertainment_8ball")],
            [Markup.button.callback(t.compatibilityTest, "entertainment_compatibility")],
            [Markup.button.callback(t.backToMainMenu, "back_to_main_menu_from_entertainments")]
        ]);
    },

    // Кнопка поддержки проекта (упрощенная, без выбора суммы)
    support_project_button: (lang = 'en') => {
        const texts = {
            'en': {
                openTonWallet: "💎 Open TON Wallet",
                copyAddress: "📋 Copy TON Address",
                close: "🚫 Close"
            },
            'ru': {
                openTonWallet: "💎 Открыть TON Кошелек",
                copyAddress: "📋 Скопировать TON Адрес",
                close: "🚫 Закрыть"
            }
        };
        const t = texts[lang] || texts['en'];
        return Markup.inlineKeyboard([
            [Markup.button.callback(t.openTonWallet, "donate_open_wallet")],
            [Markup.button.callback(t.copyAddress, "donate_copy_address")],
            [Markup.button.callback(t.close, "close_donate")]
        ]);
    },

    // Меню настроек
    settings_menu: (user_language, notifications_enabled) => {
        const texts = {
            'en': {
                selectSign: "✨ Select Zodiac Sign",
                setBirthDate: "🎂 Set Birth Date", // Новая кнопка
                notificationsStatus: notifications_enabled ? "🔔 Daily Notifications: ON" : "🔕 Daily Notifications: OFF",
                language: `🌐 Language: ${user_language === 'ru' ? "Русский" : "English"}`,
                backToMainMenu: "⬅️ Back to Main Menu"
            },
            'ru': {
                selectSign: "✨ Выбрать Знак Зодиака",
                setBirthDate: "🎂 Установить Дату Рождения", // Новая кнопка
                notificationsStatus: notifications_enabled ? "🔔 Ежедневные Уведомления: ВКЛ" : "🔕 Ежедневные Уведомления: ВЫКЛ",
                language: `🌐 Язык: ${user_language === 'ru' ? "Русский" : "English"}`,
                backToMainMenu: "⬅️ Назад в Главное Меню"
            }
        };
        const t = texts[user_language] || texts['en'];

        return Markup.inlineKeyboard([
            [Markup.button.callback(t.selectSign, "settings_select_sign")],
            [Markup.button.callback(t.setBirthDate, "settings_set_birthdate")], // Новая кнопка
            [Markup.button.callback(t.notificationsStatus, "settings_toggle_notifications")],
            [Markup.button.callback(t.language, "settings_language")],
            [Markup.button.callback(t.backToMainMenu, "back_to_main_menu_from_settings")]
        ]);
    },

    // Выбор языка
    language_selection_menu: (lang = 'en') => {
        const texts = {
            'en': { backToSettings: "⬅️ Back to Settings" },
            'ru': { backToSettings: "⬅️ Назад в Настройки" }
        };
        const t = texts[lang] || texts['en'];
        return Markup.inlineKeyboard([
            [Markup.button.callback("🇷🇺 Русский", "set_language_ru")],
            [Markup.button.callback("🇬🇧 English", "set_language_en")],
            [Markup.button.callback(t.backToSettings, "back_to_settings_from_lang")]
        ]);
    },

    // Выбор знака зодиака (исправлено использование SIGNS)
    zodiac_sign_selection: (lang = 'en') => {
        const signsArray = Object.values(HoroscopeGenerator.SIGNS); // Теперь это массив
        const buttons = signsArray.map(signInfo =>
            Markup.button.callback(`${signInfo.emoji} ${signInfo[`name_${lang}`]}`, `set_sign_${signInfo.key}`)
        );

        const rows = [];
        for (let i = 0; i < buttons.length; i += 3) {
            rows.push(buttons.slice(i, i + 3));
        }
        const texts = {
            'en': { backToSettings: "⬅️ Back to Settings" },
            'ru': { backToSettings: "⬅️ Назад в Настройки" }
        };
        const t = texts[lang] || texts['en'];
        rows.push([Markup.button.callback(t.backToSettings, "back_to_settings_from_sign")]);
        return Markup.inlineKeyboard(rows);
    },

    // Кнопки для расшаривания (аналог share_bot_keyboard в astro.py)
    share_bot_keyboard: (botUsername, lang = 'en') => {
        const shareText = {
            'en': "✨ Get your daily cosmic insights and more with AstroBot! Join now:",
            'ru': "✨ Получи свои ежедневные космические предсказания и многое другое с AstroBot! Присоединяйся:"
        };
        const shareButtonText = {
            'en': "💌 Share Bot",
            'ru': "💌 Поделиться Ботом"
        };
        const textToShare = shareText[lang] || shareText['en'];
        const buttonText = shareButtonText[lang] || shareButtonText['en'];
        const shareTextEncoded = encodeURIComponent(textToShare);
        return Markup.inlineKeyboard([
            [Markup.button.url(buttonText, `https://t.me/share/url?url=https://t.me/${botUsername}&text=${shareTextEncoded}`)]
        ]);
    },

    // Кнопки для выбора знаков для совместимости (новое)
    compatibility_sign_selection: (lang = 'en', prefix = 'compatibility_select_sign1') => {
        const signsArray = Object.values(HoroscopeGenerator.SIGNS);
        const buttons = signsArray.map(signInfo =>
            Markup.button.callback(`${signInfo.emoji} ${signInfo[`name_${lang}`]}`, `${prefix}_${signInfo.key}`)
        );
        const rows = [];
        for (let i = 0; i < buttons.length; i += 3) {
            rows.push(buttons.slice(i, i + 3));
        }
        const texts = {
            'en': { back: "⬅️ Back" },
            'ru': { back: "⬅️ Назад" }
        };
        const t = texts[lang] || texts['en'];
        rows.push([Markup.button.callback(t.back, "back_from_compatibility")]);
        return Markup.inlineKeyboard(rows);
    }
};

export default Keyboard;
