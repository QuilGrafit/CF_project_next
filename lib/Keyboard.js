// lib/Keyboard.js
import { Markup } from 'telegraf';
const TEXTS = require('./texts_module');

const Keyboard = {
    // Main menu buttons
    exports.main_menu = (language) => {
    let langToUse = language || 'ru'; // Используем 'ru' по умолчанию, если language пуст или undefined
    if (!TEXTS[langToUse]) {
        console.warn(`Language '${langToUse}' not found in TEXTS. Falling back to 'ru'.`);
        langToUse = 'ru';
    }
    const texts = TEXTS[langToUse];
    if (!texts) { // Дополнительная проверка, если даже 'ru' не найден
        console.error("Critical error: 'ru' language texts not found!");
        // Возможно, здесь нужно вернуть пустую клавиатуру или выбросить ошибку
        return Markup.keyboard([]);
    }

    return Markup.keyboard([
        [texts.get_horoscope],
        [texts.settings, texts.about_us],
        [texts.ton_wallet, texts.share_bot]
    ]).resize();
};

    // Settings menu buttons
    settings_menu: (lang = 'ru') => {
        return Markup.keyboard([
            [Markup.button.text(TEXTS[lang].change_language), Markup.button.text(TEXTS[lang].change_birth_date)],
            [Markup.button.text(TEXTS[lang].change_zodiac_sign), Markup.button.text(TEXTS[lang].change_horoscope_type)],
            [Markup.button.text(TEXTS[lang].back_to_main_menu)]
        ]).resize();
    },

    // Language selection inline keyboard
    language_selection_inline: (currentLang = 'ru') => {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback('🇷🇺 Русский', `set_lang_ru`),
                Markup.button.callback('🇬🇧 English', `set_lang_en`)
            ]
        ]);
    },

    // Zodiac sign selection inline keyboard
    zodiac_sign_selection_inline: (lang = 'ru') => {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback(TEXTS[lang].aries, `set_sign_Aries`), // Использование ключа на английском для консистентности
                Markup.button.callback(TEXTS[lang].taurus, `set_sign_Taurus`),
                Markup.button.callback(TEXTS[lang].gemini, `set_sign_Gemini`)
            ],
            [
                Markup.button.callback(TEXTS[lang].cancer, `set_sign_Cancer`),
                Markup.button.callback(TEXTS[lang].leo, `set_sign_Leo`),
                Markup.button.callback(TEXTS[lang].virgo, `set_sign_Virgo`)
            ],
            [
                Markup.button.callback(TEXTS[lang].libra, `set_sign_Libra`),
                Markup.button.callback(TEXTS[lang].scorpio, `set_sign_Scorpio`),
                Markup.button.callback(TEXTS[lang].sagittarius, `set_sign_Sagittarius`)
            ],
            [
                Markup.button.callback(TEXTS[lang].capricorn, `set_sign_Capricorn`),
                Markup.button.callback(TEXTS[lang].aquarius, `set_sign_Aquarius`),
                Markup.button.callback(TEXTS[lang].pisces, `set_sign_Pisces`)
            ]
        ]);
    },

    // Horoscope type selection inline keyboard
    horoscope_type_selection_inline: (lang = 'ru', currentType = 'daily') => {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback(
                    (currentType === 'daily' ? '✅ ' : '') + TEXTS[lang].daily,
                    `set_horoscope_type_daily`
                ),
                Markup.button.callback(
                    (currentType === 'weekly' ? '✅ ' : '') + TEXTS[lang].weekly,
                    `set_horoscope_type_weekly`
                ),
                Markup.button.callback(
                    (currentType === 'monthly' ? '✅ ' : '') + TEXTS[lang].monthly,
                    `set_horoscope_type_monthly`
                )
            ]
        ]);
    },

    // Donation menu для обработчика Support Project
    donate_menu: (lang = 'ru', tonWalletAddress) => {
        const buttons = [
            [Markup.button.url(TEXTS[lang].donate_ton_button, `https://tonkeeper.com/transfer/${tonWalletAddress}`)],
            [Markup.button.callback(TEXTS[lang].back_to_main_menu, 'back_to_main_menu_from_donate')]
        ];
        return Markup.inlineKeyboard(buttons);
    }
};

// Объект с текстами для разных языков.
const TEXTS = {
    ru: {
        get_horoscope: "🔮 Получить гороскоп",
        settings: "⚙️ Настройки",
        support_project: "💖 Поддержать проект",
        change_language: "🌐 Изменить язык",
        change_birth_date: "🗓 Изменить дату рождения",
        change_zodiac_sign: "🌟 Изменить знак зодиака",
        change_horoscope_type: "📈 Изменить тип гороскопа",
        back_to_main_menu: "⬅️ В главное меню",
        daily: "Ежедневный",
        weekly: "Еженедельный",
        monthly: "Ежемесячный",
        aries: "Овен",
        taurus: "Телец",
        gemini: "Близнецы",
        cancer: "Рак",
        leo: "Лев",
        virgo: "Дева",
        libra: "Весы",
        scorpio: "Скорпион",
        sagittarius: "Стрелец",
        capricorn: "Козерог",
        aquarius: "Водолей",
        pisces: "Рыбы",
        donate_ton_button: "💎 Отправить TON",
        choose_language: "Выберите язык:",
        choose_sign: "Выберите ваш знак зодиака:",
        choose_horoscope_type: "Выберите тип гороскопа:",
        enter_birth_date: "Введите вашу дату рождения в формате ДД.ММ.ГГГГ (например, 01.01.2000):",
        invalid_date_format: "Неверный формат даты. Пожалуйста, используйте ДД.ММ.ГГГГ.",
        birth_date_set_success: "Дата рождения успешно установлена!",
        sign_set_success: "Знак зодиака успешно установлен!",
        horoscope_type_set_success: "Тип гороскопа успешно установлен!",
        welcome: "Добро пожаловать в Бота Гороскопов! 👋\n\nЯ помогу вам узнать, что звезды готовят для вас. Нажмите 'Получить гороскоп' для начала.",
        horoscope_for: "Ваш гороскоп на {{type}} ({{sign}}):",
        settings_intro: "Здесь вы можете изменить свои настройки:",
        support_project_intro: "Спасибо за вашу поддержку! 🙏\n\nВы можете поддержать проект, отправив TON на наш кошелек:",
        your_current_language: "Ваш текущий язык: {{lang}}",
        your_current_sign: "Ваш текущий знак зодиака: {{sign}}",
        your_current_horoscope_type: "Ваш текущий тип гороскопа: {{type}}",
        ton_wallet_address: "Адрес TON кошелька: `{{address}}`",
        copied_to_clipboard: "Скопировано в буфер обмена!",
        unknown_command: "Извините, я не понимаю эту команду.",
        error_processing_request: "Произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте еще раз позже.",
        language_set_success: "Язык успешно изменен!", // Добавлен отсутствующий ключ
        horoscope_share_invite: "Поделись этим гороскопом с друзьями!" // Добавлен новый ключ для кнопки "Поделиться"
    },
    en: {
        get_horoscope: "🔮 Get Horoscope",
        settings: "⚙️ Settings",
        support_project: "💖 Support Project",
        change_language: "🌐 Change Language",
        change_birth_date: "🗓 Change Birth Date",
        change_zodiac_sign: "🌟 Change Zodiac Sign",
        change_horoscope_type: "📈 Change Horoscope Type",
        back_to_main_menu: "⬅️ Back to Main Menu",
        daily: "Daily",
        weekly: "Weekly",
        monthly: "Monthly",
        aries: "Aries",
        taurus: "Taurus",
        gemini: "Gemini",
        cancer: "Cancer",
        leo: "Leo",
        virgo: "Virgo",
        libra: "Libra",
        scorpio: "Scorpio",
        sagittarius: "Sagittarius",
        capricorn: "Capricorn",
        aquarius: "Aquarius",
        pisces: "Pisces",
        donate_ton_button: "💎 Send TON",
        choose_language: "Choose your language:",
        choose_sign: "Choose your zodiac sign:",
        choose_horoscope_type: "Choose horoscope type:",
        enter_birth_date: "Enter your birth date in DD.MM.YYYY format (e.g., 01.01.2000):",
        invalid_date_format: "Invalid date format. Please use DD.MM.YYYY.",
        birth_date_set_success: "Birth date successfully set!",
        sign_set_success: "Zodiac sign successfully set!",
        horoscope_type_set_success: "Horoscope type successfully set!",
        welcome: "Welcome to the Horoscope Bot! 👋\n\nI will help you find out what the stars have in store for you. Click 'Get Horoscope' to start.",
        horoscope_for: "Your horoscope for {{type}} ({{sign}}):",
        settings_intro: "Here you can change your settings:",
        support_project_intro: "Thank you for your support! 🙏\n\nYou can support the project by sending TON to our wallet:",
        your_current_language: "Your current language: {{lang}}",
        your_current_sign: "Your current zodiac sign: {{sign}}",
        your_current_horoscope_type: "Your current horoscope type: {{type}}",
        ton_wallet_address: "TON wallet address: `{{address}}`",
        copied_to_clipboard: "Copied to clipboard!",
        unknown_command: "Sorry, I don't understand this command.",
        error_processing_request: "An error occurred while processing your request. Please try again later.",
        language_set_success: "Language successfully changed!", // Добавлен отсутствующий ключ
        horoscope_share_invite: "Share this horoscope with friends!" // Добавлен новый ключ для кнопки "Поделиться"
    }
};

export default Keyboard;
export { TEXTS }; // Экспортируем TEXTS, чтобы его могли импортировать другие файлы
