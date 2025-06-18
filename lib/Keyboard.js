// lib/Keyboard.js
import { Markup } from 'telegraf';
import TEXTS from '../texts.js'; // !!! ВАЖНО: Правильный путь и расширение .js

// Функция для главного меню
export const main_menu = (language) => {
    let langToUse = language || 'ru';

    if (!TEXTS[langToUse]) {
        console.warn(`Language '${langToUse}' not found in TEXTS. Falling back to 'ru'.`);
        langToUse = 'ru';
    }

    const texts = TEXTS[langToUse];

    if (!texts) {
        console.error("CRITICAL ERROR: Default 'ru' language texts not found!");
        return Markup.keyboard([]).resize();
    }

    return Markup.keyboard([
        [texts.get_horoscope],
        [texts.settings, texts.about_us],
        [texts.ton_wallet, texts.share_bot]
    ]).resize();
};

// Функция для меню выбора знака зодиака
export const zodiac_signs_menu = (language) => {
    let langToUse = language || 'ru';
    if (!TEXTS[langToUse]) {
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

// Функция для меню выбора периода гороскопа
export const horoscope_duration_menu = (language) => {
    let langToUse = language || 'ru';
    if (!TEXTS[langToUse]) {
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

// Константа для удаления клавиатуры
export const remove_keyboard = Markup.removeKeyboard();

// Если вы используете `import Keyboard` без фигурных скобок,
// это означает, что вы импортируете default export.
// Дефолтный экспорт может быть объектом, содержащим все эти функции.
const Keyboard = {
    main_menu,
    zodiac_signs_menu,
    horoscope_duration_menu,
    remove_keyboard,
    // TEXTS не нужно экспортировать здесь снова, так как он уже является отдельным дефолтным экспортом из texts.js
};

export default Keyboard; // Экспортируем как дефолтный экспорт
