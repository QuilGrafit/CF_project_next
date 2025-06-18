const { Markup } = require('telegraf');
const TEXTS = require('../texts'); // Убедитесь, что путь к texts.js верен!

exports.main_menu = (language) => {
    let langToUse = language || 'ru'; // Используем 'ru' по умолчанию, если language пуст или undefined

    // Если переданный язык не найден в TEXTS, или TEXTS[langToUse] сам по себе undefined
    if (!TEXTS[langToUse]) {
        console.warn(`Language '${langToUse}' not found in TEXTS. Falling back to 'ru'.`);
        langToUse = 'ru';
    }

    const texts = TEXTS[langToUse];

    // Дополнительная критическая проверка, если даже язык по умолчанию не найден
    if (!texts) {
        console.error("CRITICAL ERROR: Default 'ru' language texts not found in TEXTS object!");
        // Возвращаем пустую клавиатуру или выбрасываем ошибку, так как бот не сможет работать без текстов
        return Markup.keyboard([]).resize();
    }

    return Markup.keyboard([
        [texts.get_horoscope],
        [texts.settings, texts.about_us],
        [texts.ton_wallet, texts.share_bot]
    ]).resize();
};

// Добавьте другие функции клавиатуры по аналогии
exports.zodiac_signs_menu = (language) => {
    let langToUse = language || 'ru';
    if (!TEXTS[langToUse]) {
        console.warn(`Language '${langToUse}' not found in TEXTS. Falling back to 'ru'.`);
        langToUse = 'ru';
    }
    const texts = TEXTS[langToUse];
    if (!texts) {
        console.error("CRITICAL ERROR: Default 'ru' language texts not found for zodiac_signs_menu!");
        return Markup.keyboard([]).resize();
    }

    return Markup.keyboard([
        ['♈ Овен', '♉ Телец', '♊ Близнецы'],
        ['♋ Рак', '♌ Лев', '♍ Дева'],
        ['♎ Весы', '♏ Скорпион', '♐ Стрелец'],
        ['♑ Козерог', '♒ Водолей', '♓ Рыбы'],
        [texts.back_to_main_menu]
    ]).resize();
};

exports.horoscope_duration_menu = (language) => {
    let langToUse = language || 'ru';
    if (!TEXTS[langToUse]) {
        console.warn(`Language '${langToUse}' not found in TEXTS. Falling back to 'ru'.`);
        langToUse = 'ru';
    }
    const texts = TEXTS[langToUse];
    if (!texts) {
        console.error("CRITICAL ERROR: Default 'ru' language texts not found for horoscope_duration_menu!");
        return Markup.keyboard([]).resize();
    }

    return Markup.keyboard([
        [texts.today, texts.tomorrow],
        [texts.week, texts.month],
        [texts.year],
        [texts.back_to_main_menu]
    ]).resize();
};

exports.remove_keyboard = Markup.removeKeyboard();
