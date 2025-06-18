// lib/horoscope.js

import { DateTime } from 'luxon';

// --- Класс HoroscopeGenerator ---
class HoroscopeGenerator {
    static zodiacSigns = [
        "aries", "taurus", "gemini", "cancer", "leo", "virgo",
        "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"
    ];

    static horoscopeData = {
        // Замените эти данные на ваши реальные гороскопы
        // Для примера даны очень короткие версии.
        // Вы можете расширить их до полноценных текстов для каждого знака.
        "aries": {
            ru: {
                text: "Овен (21 марта - 19 апреля):\n\nСегодня ваша энергия на высоте, Овны! Используйте этот импульс для завершения начатых дел. Будьте внимательны к новым возможностям, они могут появиться неожиданно. Отличное время для физической активности и спорта. В личных отношениях проявите инициативу, но не будьте слишком напористы.",
                lucky_numbers: [9, 18, 27],
                lucky_colors: ["красный", "золотистый"]
            },
            en: {
                text: "Aries (March 21 - April 19):\n\nYour energy is at its peak today, Aries! Use this momentum to finish what you've started. Be open to new opportunities, as they may appear unexpectedly. Excellent time for physical activity and sports. In personal relationships, take the initiative but avoid being too pushy.",
                lucky_numbers: [9, 18, 27],
                lucky_colors: ["red", "golden"]
            }
        },
        "taurus": {
            ru: {
                text: "Телец (20 апреля - 20 мая):\n\nТельцы, сегодня сосредоточьтесь на финансовой стабильности и долгосрочном планировании. Удачный день для покупок или инвестиций. Избегайте споров, особенно с близкими. Вечер проведите в уютной и спокойной обстановке, восстанавливая силы.",
                lucky_numbers: [6, 15, 24],
                lucky_colors: ["зеленый", "розовый"]
            },
            en: {
                text: "Taurus (April 20 - May 20):\n\nToday, focus on financial stability and long-term planning, Taurus. It's a good day for shopping or investments. Avoid arguments, especially with loved ones. Spend the evening in a cozy and peaceful environment, recharging your energy.",
                lucky_numbers: [6, 15, 24],
                lucky_colors: ["green", "pink"]
            }
        },
        "gemini": {
            ru: {
                text: "Близнецы (21 мая - 20 июня):\n\nБлизнецы, день благоприятен для общения и новых знакомств. Ваши идеи будут услышаны, поэтому не стесняйтесь делиться ими. Возможны короткие поездки или получение важной информации. Будьте осторожны с обещаниями, которые даете.",
                lucky_numbers: [5, 14, 23],
                lucky_colors: ["желтый", "оранжевый"]
            },
            en: {
                text: "Gemini (May 21 - June 20):\n\nToday is favorable for communication and new acquaintances, Gemini. Your ideas will be heard, so don't hesitate to share them. Short trips or important information may come your way. Be cautious with promises you make.",
                lucky_numbers: [5, 14, 23],
                lucky_colors: ["yellow", "orange"]
            }
        },
        "cancer": {
            ru: {
                text: "Рак (21 июня - 22 июля):\n\nРаки, сегодня уделите внимание дому и семье. Возможны приятные новости от близких. Эмоциональный фон может быть нестабильным, поэтому старайтесь сохранять спокойствие. Хороший день для уборки или создания уюта.",
                lucky_numbers: [2, 11, 20],
                lucky_colors: ["серебристый", "белый"]
            },
            en: {
                text: "Cancer (June 21 - July 22):\n\nToday, focus on home and family, Cancer. You might receive good news from loved ones. Emotional levels may be unstable, so try to stay calm. A good day for cleaning or creating a cozy atmosphere.",
                lucky_numbers: [2, 11, 20],
                lucky_colors: ["silver", "white"]
            }
        },
        "leo": {
            ru: {
                text: "Лев (23 июля - 22 августа):\n\nЛьвы, ваш авторитет сегодня на высоте. Используйте это для решения сложных задач на работе. Не бойтесь брать на себя ответственность. Вечером найдите время для творчества или развлечений. Избегайте лишних трат.",
                lucky_numbers: [1, 10, 19],
                lucky_colors: ["золотой", "оранжевый"]
            },
            en: {
                text: "Leo (July 23 - August 22):\n\nYour authority is high today, Leo. Use it to solve complex tasks at work. Don't be afraid to take on responsibility. In the evening, find time for creativity or entertainment. Avoid unnecessary expenses.",
                lucky_numbers: [1, 10, 19],
                lucky_colors: ["gold", "orange"]
            }
        },
        "virgo": {
            ru: {
                text: "Дева (23 августа - 22 сентября):\n\nДевы, сегодня уделите внимание деталям и порядку. Хороший день для планирования и анализа. Здоровье может потребовать внимания, не игнорируйте сигналы тела. Будьте терпеливы с окружающими, не все так педантичны, как вы.",
                lucky_numbers: [5, 14, 23],
                lucky_colors: ["синий", "зеленый"]
            },
            en: {
                text: "Virgo (August 23 - September 22):\n\nToday, pay attention to details and order, Virgo. It's a good day for planning and analysis. Your health may require attention; don't ignore your body's signals. Be patient with others; not everyone is as meticulous as you.",
                lucky_numbers: [5, 14, 23],
                lucky_colors: ["blue", "green"]
            }
        },
        "libra": {
            ru: {
                text: "Весы (23 сентября - 22 октября):\n\nВесы, сегодня день гармонии и баланса. Ищите компромиссы в спорных ситуациях. Благоприятно для свиданий и общения с партнером. Избегайте принятия поспешных решений, особенно в финансах.",
                lucky_numbers: [6, 15, 24],
                lucky_colors: ["розовый", "бирюзовый"]
            },
            en: {
                text: "Libra (September 23 - October 22):\n\nToday is a day of harmony and balance, Libra. Seek compromises in contentious situations. Favorable for dates and communication with your partner. Avoid making hasty decisions, especially in finances.",
                lucky_numbers: [6, 15, 24],
                lucky_colors: ["pink", "turquoise"]
            }
        },
        "scorpio": {
            ru: {
                text: "Скорпион (23 октября - 21 ноября):\n\nСкорпионы, сегодня вы можете почувствовать усиление интуиции. Доверяйте своим предчувствиям. Хороший день для самоанализа и работы над собой. Возможны неожиданные открытия или инсайты. Избегайте конфликтов, они могут оказаться разрушительными.",
                lucky_numbers: [4, 13, 22],
                lucky_colors: ["черный", "темно-красный"]
            },
            en: {
                text: "Scorpio (October 23 - November 21):\n\nToday, you may feel an increase in intuition, Scorpio. Trust your instincts. A good day for self-analysis and self-improvement. Unexpected discoveries or insights are possible. Avoid conflicts; they can be destructive.",
                lucky_numbers: [4, 13, 22],
                lucky_colors: ["black", "dark red"]
            }
        },
        "sagittarius": {
            ru: {
                text: "Стрелец (22 ноября - 21 декабря):\n\nСтрельцы, сегодня открываются новые горизонты. Благоприятно для путешествий, обучения и расширения кругозора. Будьте открыты к новым идеям и знакомствам. Ваша щедрость будет оценена, но не позволяйте собой манипулировать.",
                lucky_numbers: [3, 12, 21],
                lucky_colors: ["фиолетовый", "синий"]
            },
            en: {
                text: "Sagittarius (November 22 - December 21):\n\nToday, new horizons open up, Sagittarius. Favorable for travel, learning, and expanding your knowledge. Be open to new ideas and acquaintances. Your generosity will be appreciated, but don't let yourself be manipulated.",
                lucky_numbers: [3, 12, 21],
                lucky_colors: ["purple", "blue"]
            }
        },
        "capricorn": {
            ru: {
                text: "Козерог (22 декабря - 19 января):\n\nКозероги, сегодня день для достижения целей. Сфокусируйтесь на карьере и профессиональном росте. Ваши усилия будут вознаграждены. Будьте осторожны с критикой, она может быть воспринята слишком остро. Вечером отдохните от дел.",
                lucky_numbers: [8, 17, 26],
                lucky_colors: ["серый", "коричневый"]
            },
            en: {
                text: "Capricorn (December 22 - January 19):\n\nToday is a day for achieving goals, Capricorn. Focus on your career and professional growth. Your efforts will be rewarded. Be careful with criticism; it might be taken too harshly. In the evening, rest from your work.",
                lucky_numbers: [8, 17, 26],
                lucky_colors: ["gray", "brown"]
            }
        },
        "aquarius": {
            ru: {
                text: "Водолей (20 января - 18 февраля):\n\nВодолеи, сегодня идеальный день для инноваций и нестандартных решений. Делитесь своими идеями с единомышленниками. Возможны неожиданные встречи. Избегайте рутины, ищите вдохновение в новом. Не забывайте о друзьях.",
                lucky_numbers: [4, 13, 22],
                lucky_colors: ["синий", "электрик"]
            },
            en: {
                text: "Aquarius (January 20 - February 18):\n\nToday is an ideal day for innovation and unconventional solutions, Aquarius. Share your ideas with like-minded people. Unexpected meetings are possible. Avoid routine, seek inspiration in novelty. Don't forget your friends.",
                lucky_numbers: [4, 13, 22],
                lucky_colors: ["blue", "electric blue"]
            }
        },
        "pisces": {
            ru: {
                text: "Рыбы (19 февраля - 20 марта):\n\nРыбы, сегодня ваша интуиция особенно сильна. Доверьтесь внутреннему голосу в принятии решений. Благоприятный день для творчества, медитации и духовного развития. Избегайте конфликтов, они могут истощить вас. Позаботьтесь о своем здоровье.",
                lucky_numbers: [7, 16, 25],
                lucky_colors: ["морская волна", "фиолетовый"]
            },
            en: {
                text: "Pisces (February 19 - March 20):\n\nPisces, your intuition is especially strong today. Trust your inner voice in making decisions. A favorable day for creativity, meditation, and spiritual development. Avoid conflicts; they can drain you. Take care of your health.",
                lucky_numbers: [7, 16, 25],
                lucky_colors: ["sea green", "purple"]
            }
        }
    };

    // Метод для случайного выбора N счастливых чисел из списка
    static getRandomLuckyNumbers(numbers, count) {
        if (!numbers || numbers.length === 0) return [];
        const shuffled = [...numbers].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    // Метод для случайного выбора счастливого цвета
    static getRandomLuckyColor(colors) {
        if (!colors || colors.length === 0) return "";
        return colors[Math.floor(Math.random() * colors.length)];
    }

    static generate(user) {
        const userSign = user.sign || 'aries'; // Дефолтный знак, если не установлен
        const lang = user.lang || 'ru'; // Дефолтный язык, можно сделать настраиваемым

        const signData = this.horoscopeData[userSign];
        if (!signData || !signData[lang]) {
            console.warn(`Гороскоп для знака ${userSign} на языке ${lang} не найден.`);
            // Возвращаем дефолтный гороскоп, если нет данных
            const defaultLangData = this.horoscopeData['aries']['ru'];
            return `Извините, не удалось сгенерировать гороскоп для знака ${userSign} на языке ${lang}.\n\n` +
                   `Овен (21 марта - 19 апреля):\n${defaultLangData.text}\n` +
                   `Счастливые числа: ${this.getRandomLuckyNumbers(defaultLangData.lucky_numbers, 3).join(', ')}\n` +
                   `Счастливый цвет: ${this.getRandomLuckyColor(defaultLangData.lucky_colors)}`;
        }

        const data = signData[lang];
        const luckyNumbers = this.getRandomLuckyNumbers(data.lucky_numbers, 3); // 3 случайных числа
        const luckyColor = this.getRandomLuckyColor(data.lucky_colors);

        const today = DateTime.now().setZone('Europe/Kiev').toFormat('dd.MM.yyyy'); // Учитываем часовой пояс

        let horoscopeText = `✨ <b>Гороскоп на ${today} для ${userSign.charAt(0).toUpperCase() + userSign.slice(1)}</b> ✨\n\n`;
        horoscopeText += `${data.text}\n\n`;
        horoscopeText += `🍀 Ваши счастливые числа: <b>${luckyNumbers.join(', ')}</b>\n`;
        horoscopeText += `🌈 Ваш счастливый цвет: <b>${luckyColor.charAt(0).toUpperCase() + luckyColor.slice(1)}</b>\n`;

        return horoscopeText;
    }
}

// --- Класс Keyboard (для inline и reply клавиатур) ---
class Keyboard {
    // Вспомогательный метод для создания InlineKeyboardBuilder, имитирующий aiogram
    static inlineKeyboardBuilder() {
        return {
            inline_keyboard: [],
            push: function(button) {
                // Если массив пустой или последняя строка полная (например, 2 кнопки), начать новую строку
                if (this.inline_keyboard.length === 0 || this.inline_keyboard[this.inline_keyboard.length - 1].length >= 2) { // 2 кнопки на строку
                    this.inline_keyboard.push([]);
                }
                this.inline_keyboard[this.inline_keyboard.length - 1].push(button);
                return this; // Для цепочки вызовов
            },
            pushRow: function(rowOfButtons) {
                this.inline_keyboard.push(rowOfButtons);
                return this;
            }
        };
    }

    // --- Reply Keyboards ---
    static mainMenu() {
        return {
            reply_markup: {
                keyboard: [
                    [{ text: "🌟 Get Horoscope" }],
                    [{ text: "💎 Premium" }, { text: "⚙️ Settings" }]
                ],
                resize_keyboard: true,
                one_time_keyboard: false
            }
        };
    }

    // --- Inline Keyboards ---
    static settingsMenu(user) {
        const notificationsText = user.daily_notifications_enabled ? "🔕 Disable Daily Notifications" : "🔔 Enable Daily Notifications";
        const builder = this.inlineKeyboardBuilder();
        builder.pushRow([{ text: "✏️ Change Zodiac Sign", callback_data: "settings_select_sign" }]);
        builder.pushRow([{ text: notificationsText, callback_data: "settings_notifications" }]);
        builder.pushRow([{ text: "⬅️ Back to Main Menu", callback_data: "back_to_main_menu" }]);
        return builder;
    }

    static zodiacSignSelection() {
        const builder = this.inlineKeyboardBuilder();
        HoroscopeGenerator.zodiacSigns.forEach(sign => {
            builder.push({ text: sign.charAt(0).toUpperCase() + sign.slice(1), callback_data: `set_sign_${sign}` });
        });
        builder.pushRow([{ text: "⬅️ Back to Settings", callback_data: "back_to_settings_menu" }]);
        return builder;
    }

    static donateMenu() {
        const builder = this.inlineKeyboardBuilder();
        builder.push({ text: "💰 0.5 TON", callback_data: "donate_0.5" });
        builder.push({ text: "💎 1 TON", callback_data: "donate_1" });
        builder.pushRow([{ text: "💸 5 TON", callback_data: "donate_5" }]);
        builder.pushRow([{ text: "✍️ Custom Amount", callback_data: "donate_custom" }]);
        builder.pushRow([{ text: "⬅️ Back to Premium", callback_data: "back_to_main_menu" }]); // Исправлено: "back_to_premium_menu"
        return builder;
    }
}

// Экспортируем классы для использования в других файлах Next.js
export { HoroscopeGenerator, Keyboard };
