// lib/horoscope.js
import { DateTime } from 'luxon';

const HoroscopeGenerator = {
    SIGNS: {
        0: { name: { en: "Aries", ru: "Овен" }, date_range: "21.03-19.04" },
        1: { name: { en: "Taurus", ru: "Телец" }, date_range: "20.04-20.05" },
        2: { name: { en: "Gemini", ru: "Близнецы" }, date_range: "21.05-20.06" },
        3: { name: { en: "Cancer", ru: "Рак" }, date_range: "21.06-22.07" },
        4: { name: { en: "Leo", ru: "Лев" }, date_range: "23.07-22.08" },
        5: { name: { en: "Virgo", ru: "Дева" }, date_range: "23.08-22.09" },
        6: { name: { en: "Libra", ru: "Весы" }, date_range: "23.09-22.10" },
        7: { name: { en: "Scorpio", ru: "Скорпион" }, date_range: "23.10-21.11" },
        8: { name: { en: "Sagittarius", ru: "Стрелец" }, date_range: "22.11-21.12" },
        9: { name: { en: "Capricorn", ru: "Козерог" }, date_range: "22.12-19.01" },
        10: { name: { en: "Aquarius", ru: "Водолей" }, date_range: "20.01-18.02" },
        11: { name: { en: "Pisces", ru: "Рыбы" }, date_range: "19.02-20.03" },
    },

    HOROSCOPES: {
        // Добавьте более полные гороскопы для всех знаков и типов (daily, weekly, monthly)
        // Если здесь будут отсутствовать данные, бот вернет fallback-сообщение.
        Aries: {
            daily: {
                ru: "Сегодня Овнам стоит проявить инициативу. Вас ждет успех в новых начинаниях.",
                en: "Today, Aries should take the initiative. Success awaits you in new endeavors."
            },
            weekly: {
                ru: "На этой неделе Овнам рекомендуется сосредоточиться на личных отношениях. Возможно приятное знакомство.",
                en: "This week, Aries are advised to focus on personal relationships. A pleasant acquaintance is possible."
            },
            monthly: {
                ru: "В этом месяце Овнам предстоит преодолеть некоторые препятствия, но результат превзойдет ожидания.",
                en: "This month, Aries will have to overcome some obstacles, but the result will exceed expectations."
            }
        },
        Taurus: {
            daily: {
                ru: "Тельцам сегодня следует уделить внимание финансам. Возможны неожиданные поступления.",
                en: "Taurus should pay attention to finances today. Unexpected receipts are possible."
            },
            weekly: {
                ru: "На этой неделе Тельцам благоприятно заниматься саморазвитием. Изучение нового принесет пользу.",
                en: "This week, Taurus is favored to engage in self-development. Learning new things will be beneficial."
            },
            monthly: {
                ru: "В этом месяце Тельцам предстоит принять важное решение, которое повлияет на будущее.",
                en: "This month, Taurus will have to make an important decision that will affect the future."
            }
        },
        Gemini: {
            daily: { ru: "Близнецам сегодня захочется общения. Отличный день для встреч и новых знакомств.", en: "Gemini will want to socialize today. A great day for meetings and new acquaintances." },
            weekly: { ru: "На этой неделе Близнецам стоит быть внимательнее к деталям. Мелкие ошибки могут привести к крупным последствиям.", en: "This week, Gemini should pay more attention to details. Small mistakes can lead to big consequences." },
            monthly: { ru: "В этом месяце Близнецам рекомендуется завершить начатые дела. Не откладывайте ничего на потом.", en: "This month, Gemini is advised to complete unfinished business. Don't put anything off." }
        },
        Cancer: {
            daily: { ru: "Ракам сегодня важно прислушаться к интуиции. Она подскажет верное решение.", en: "It's important for Cancers to listen to their intuition today. It will suggest the right decision." },
            weekly: { ru: "На этой неделе Ракам стоит уделить время семье и дому. Создайте уютную атмосферу.", en: "This week, Cancers should spend time with family and home. Create a cozy atmosphere." },
            monthly: { ru: "В этом месяце Ракам предстоят изменения в личной жизни. Будьте открыты новому.", en: "This month, Cancers will experience changes in their personal life. Be open to new things." }
        },
        Leo: {
            daily: { ru: "Львам сегодня необходимо проявить свои лидерские качества. Ваши идеи будут поддержаны.", en: "Leos need to show their leadership qualities today. Your ideas will be supported." },
            weekly: { ru: "На этой неделе Львам следует заняться своим здоровьем. Не игнорируйте сигналы организма.", en: "This week, Leos should take care of their health. Don't ignore your body's signals." },
            monthly: { ru: "В этом месяце Львам предстоит много работы, но она принесет достойные плоды.", en: "This month, Leos will have a lot of work, but it will bring worthy results." }
        },
        Virgo: {
            daily: { ru: "Девам сегодня рекомендуется сосредоточиться на работе. Высокая продуктивность принесет успех.", en: "Virgos are advised to focus on work today. High productivity will bring success." },
            weekly: { ru: "На этой неделе Девам стоит быть осторожнее с новыми знакомствами. Не все так, как кажется.", en: "This week, Virgos should be more careful with new acquaintances. Not everything is as it seems." },
            monthly: { ru: "В этом месяце Девам предстоит пересмотреть свои приоритеты. Возможно, вы найдете новое увлечение.", en: "This month, Virgos will have to reconsider their priorities. Perhaps you will find a new hobby." }
        },
        Libra: {
            daily: { ru: "Весам сегодня важно найти баланс. Избегайте конфликтов и стремитесь к гармонии.", en: "It's important for Libras to find balance today. Avoid conflicts and strive for harmony." },
            weekly: { ru: "На этой неделе Весам следует уделить внимание творчеству. Это принесет вам радость и вдохновение.", en: "This week, Libras should pay attention to creativity. It will bring you joy and inspiration." },
            monthly: { ru: "В этом месяце Весам предстоит решить давнюю проблему. Не бойтесь просить помощи.", en: "This month, Libras will have to solve an old problem. Don't be afraid to ask for help." }
        },
        Scorpio: {
            daily: { ru: "Скорпионам сегодня стоит быть решительными. Действуйте смело, и удача будет на вашей стороне.", en: "Scorpios should be decisive today. Act boldly, and luck will be on your side." },
            weekly: { ru: "На этой неделе Скорпионам рекомендуется быть осторожнее с деньгами. Избегайте необдуманных трат.", en: "This week, Scorpios are advised to be more careful with money. Avoid impulsive spending." },
            monthly: { ru: "В этом месяце Скорпионам предстоит важный разговор, который прояснит многие моменты.", en: "This month, Scorpios will have an important conversation that will clarify many things." }
        },
        Sagittarius: {
            daily: { ru: "Стрельцам сегодня захочется приключений. Отличный день для путешествий и новых открытий.", en: "Sagittarians will want adventures today. A great day for travel and new discoveries." },
            weekly: { ru: "На этой неделе Стрельцам стоит уделить внимание обучению. Новые знания пригодятся в будущем.", en: "This week, Sagittarians should pay attention to learning. New knowledge will be useful in the future." },
            monthly: { ru: "В этом месяце Стрельцам предстоит расширить свои горизонты. Не бойтесь выходить из зоны комфорта.", en: "This month, Sagittarians will have to expand their horizons. Don't be afraid to step out of your comfort zone." }
        },
        Capricorn: {
            daily: { ru: "Козерогам сегодня важно сохранять спокойствие. Избегайте суеты и сосредоточьтесь на главном.", en: "It's important for Capricorns to remain calm today. Avoid fuss and focus on the main thing." },
            weekly: { ru: "На этой неделе Козерогам стоит быть внимательнее к близким. Проявите заботу и внимание.", en: "This week, Capricorns should be more attentive to loved ones. Show care and attention." },
            monthly: { ru: "В этом месяце Козерогам предстоит достичь поставленных целей благодаря упорному труду.", en: "This month, Capricorns will achieve their goals through hard work." }
        },
        Aquarius: {
            daily: { ru: "Водолеям сегодня рекомендуется быть открытыми для новых идей. Ваша креативность принесет плоды.", en: "Aquarius is advised to be open to new ideas today. Your creativity will bear fruit." },
            weekly: { ru: "На этой неделе Водолеям стоит уделить время друзьям. Общение принесет радость и новые возможности.", en: "This week, Aquarians should spend time with friends. Communication will bring joy and new opportunities." },
            monthly: { ru: "В этом месяце Водолеям предстоит сделать важный выбор, который повлияет на будущее.", en: "This month, Aquarians will have to make an important choice that will affect the future." }
        },
        Pisces: {
            daily: { ru: "Рыбам сегодня важно прислушаться к внутреннему голосу. Он укажет верный путь.", en: "It's important for Pisces to listen to their inner voice today. It will show the right path." },
            weekly: { ru: "На этой неделе Рыбам рекомендуется заняться медитацией или йогой. Найдите время для себя.", en: "This week, Pisces are advised to engage in meditation or yoga. Find time for yourself." },
            monthly: { ru: "В этом месяце Рыбам предстоит раскрыть свой потенциал. Не бойтесь проявлять себя.", en: "This month, Pisces will have to unleash their potential. Don't be afraid to express yourself." }
        }
    },

    /**
     * Генерирует гороскоп для пользователя.
     * @param {object} user Объект пользователя с birth_date, zodiac_sign и horoscope_type.
     * @param {string} lang Язык гороскопа ('ru' или 'en').
     * @returns {string} Текст гороскопа.
     */
    generate: async (user, lang = 'ru') => {
        const userDate = DateTime.fromJSDate(user.birth_date);
        if (!userDate.isValid) {
            console.error("Invalid birth date for user:", user);
            // Возвращаем дефолтный гороскоп, если дата некорректна
            return HoroscopeGenerator.HOROSCOPES.Aries.daily[lang] || HoroscopeGenerator.HOROSCOPES.Aries.daily.ru;
        }

        const day = userDate.day;
        const month = userDate.month;

        let zodiacSignKey = null;

        // Ищем знак зодиака по дате рождения
        for (const key in HoroscopeGenerator.SIGNS) {
            const sign = HoroscopeGenerator.SIGNS[key];
            
            // Проверки на корректность данных знака
            if (!sign || !sign.date_range || typeof sign.date_range !== 'string') {
                console.warn(`Invalid sign data or date_range for key ${key}:`, sign);
                continue;
            }

            const [start_date_str, end_date_str] = sign.date_range.split('-');
            
            if (!start_date_str || !end_date_str) {
                 console.warn(`Invalid date_range format for sign ${sign.name[lang] || sign.name.en}: ${sign.date_range}`);
                 continue;
            }

            const [start_day, start_month] = start_date_str.split('.').map(Number);
            const [end_day, end_month] = end_date_str.split('.').map(Number);

            // Проверки на успешность парсинга чисел
            if (isNaN(start_day) || isNaN(start_month) || isNaN(end_day) || isNaN(end_month)) {
                console.warn(`Failed to parse date parts for sign ${sign.name[lang] || sign.name.en}: ${sign.date_range}`);
                continue;
            }

            // Обработка знаков, переходящих через год (например, Козерог: Декабрь-Январь)
            if (start_month > end_month) { // Если начальный месяц больше конечного (например, 12 > 1)
                if ((month === start_month && day >= start_day) || (month === end_month && day <= end_day)) {
                    zodiacSignKey = sign.name.en;
                    break;
                }
            } else { // Обычный случай (например, Овен: Март-Апрель)
                if ((month === start_month && day >= start_day) && (month === end_month && day <= end_day)) {
                    zodiacSignKey = sign.name.en;
                    break;
                }
            }
        }
        
        // Если знак зодиака не найден по дате, но у пользователя сохранен знак, используем его
        if (!zodiacSignKey && user.zodiac_sign) {
             const foundSignBySavedName = Object.values(HoroscopeGenerator.SIGNS).find(
                (sign) => sign.name.en === user.zodiac_sign || sign.name.ru === user.zodiac_sign
             );
             if (foundSignBySavedName) {
                zodiacSignKey = foundSignBySavedName.name.en;
             }
        }

        // Если знак так и не определен, по умолчанию устанавливаем Овна и логируем
        if (!zodiacSignKey) {
            zodiacSignKey = "Aries";
            console.warn(`Could not determine zodiac sign for user ${user._id} with birth_date ${user.birth_date}. Defaulting to Aries.`);
        }

        const horoscopeType = user.horoscope_type || 'daily';
        
        // Получаем текст гороскопа с учетом языка и типа, с fallback на русский и дефолтный текст
        const horoscopeText = HoroscopeGenerator.HOROSCOPES[zodiacSignKey]?.[horoscopeType]?.[lang] ||
                              HoroscopeGenerator.HOROSCOPES[zodiacSignKey]?.[horoscopeType]?.ru ||
                              `No horoscope available for ${zodiacSignKey} (${horoscopeType}) in ${lang}.`;

        return horoscopeText;
    },

    /**
     * Возвращает локализованное название знака зодиака.
     * @param {string} signKey Ключ знака зодиака (на английском).
     * @param {string} lang Язык ('ru' или 'en').
     * @returns {string|null} Название знака зодиака на выбранном языке.
     */
    getZodiacSignName: (signKey, lang = 'ru') => {
        const sign = Object.values(HoroscopeGenerator.SIGNS).find(s => s.name.en === signKey || s.name.ru === signKey);
        return sign ? (sign.name[lang] || sign.name.en) : null;
    }
};

export default HoroscopeGenerator;
