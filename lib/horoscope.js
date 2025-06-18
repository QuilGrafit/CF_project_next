// lib/horoscope.js
import { DateTime } from 'luxon';
import crypto from 'crypto';
// import { getSignByBirthDate } from './utils'; // Если у вас есть такая функция, раскомментируйте или добавьте

const HoroscopeGenerator = {
    // Знаки зодиака с данными (аналог SIGNS в astro.py)
    SIGNS: {
        "aries": {"emoji": "♈️", "element": "Fire", "name_en": "Aries", "name_ru": "Овен"},
        "taurus": {"emoji": "♉️", "element": "Earth", "name_en": "Taurus", "name_ru": "Телец"},
        "gemini": {"emoji": "♊️", "element": "Air", "name_en": "Gemini", "name_ru": "Близнецы"},
        "cancer": {"emoji": "♋️", "element": "Water", "name_en": "Cancer", "name_ru": "Рак"},
        "leo": {"emoji": "♌️", "element": "Fire", "name_en": "Leo", "name_ru": "Лев"},
        "virgo": {"emoji": "♍️", "element": "Earth", "name_en": "Virgo", "name_ru": "Дева"},
        "libra": {"emoji": "♎️", "element": "Air", "name_en": "Libra", "name_ru": "Весы"},
        "scorpio": {"emoji": "♏️", "element": "Water", "name_en": "Scorpio", "name_ru": "Скорпион"},
        "sagittarius": {"emoji": "♐️", "element": "Fire", "name_en": "Sagittarius", "name_ru": "Стрелец"},
        "capricorn": {"emoji": "♑️", "element": "Earth", "name_en": "Capricorn", "name_ru": "Козерог"},
        "aquarius": {"emoji": "♒️", "element": "Air", "name_en": "Aquarius", "name_ru": "Водолей"},
        "pisces": {"emoji": "♓️", "element": "Water", "name_en": "Pisces", "name_ru": "Рыбы"},
    },

    // Аспекты гороскопа (аналог ASPECT_RANGES в astro.py)
    ASPECT_RANGES: {
        "ru": {
            "love": ["страсть", "гармония", "романтика", "взаимопонимание"],
            "career": ["прогресс", "успех", "сотрудничество", "возможности"],
            "finance": ["прибыль", "стабильность", "инвестиции", "экономия"],
            "health": ["энергия", "восстановление", "бодрость", "баланс"]
        },
        "en": {
            "love": ["passion", "harmony", "romance", "understanding"],
            "career": ["progress", "success", "collaboration", "opportunities"],
            "finance": ["profit", "stability", "investments", "savings"],
            "health": ["energy", "recovery", "vibrancy", "balance"]
        }
    },

    // Примеры советов (аналог TIPS в astro.py)
    TIPS: {
        "ru": [
            "Доверяйте своей интуиции сегодня",
            "Отличный день для новых начинаний",
            "Обратите внимание на детали",
            "Прислушайтесь к своему сердцу",
            "Найдите момент для саморефлексии",
            "Используйте новые возможности",
            "Посвятите время близким",
            "Сосредоточьтесь на своих целях",
            "Оставайтесь позитивными и устойчивыми",
            "Ищите баланс во всем"
        ],
        "en": [
            "Trust your intuition today",
            "Great day for new beginnings",
            "Pay attention to details",
            "Listen to your heart",
            "Take a moment for self-reflection",
            "Embrace new opportunities",
            "Connect with loved ones",
            "Focus on your goals",
            "Stay positive and resilient",
            "Seek balance in all things"
        ]
    },

    // Мотивация дня (аналог DAILY_MOTIVATION в astro.py)
    MOTIVATION_QUOTES: {
        "ru": [
            "Вы способны на удивительные вещи. Действуйте!",
            "Каждый день — это новая возможность сиять. Используйте ее!",
            "Верьте в себя и во все, что вы есть. Вы сильнее, чем думаете.",
            "Ваш единственный предел — ваш разум. Освободитесь и достигните своих мечтаний.",
            "Лучший способ предсказать будущее — создать его.",
            "Успех не окончателен, неудача не фатальна: важна смелость продолжать.",
            "Не ждите возможности. Создайте ее.",
            "Будьте тем изменением, которое вы хотите видеть в мире.",
            "Будущее принадлежит тем, кто верит в красоту своих мечтаний."
        ],
        "en": [
            "You are capable of amazing things. Go for it!",
            "Every day is a new opportunity to shine. Make it count!",
            "Believe in yourself and all that you are. You are stronger than you think.",
            "Your only limit is your mind. Break free and achieve your dreams.",
            "The best way to predict the future is to create it.",
            "Success is not final, failure is not fatal: it is the courage to continue that counts.",
            "Don't wait for opportunity. Create it.",
            "Be the change that you wish to see in the world.",
            "The future belongs to those who believe in the beauty of their dreams."
        ]
    },

    // Печеньки с предсказаниями (аналог FORTUNE_COOKIES_MESSAGES в astro.py)
    FORTUNE_COOKIES: {
        "ru": [
            "Вас ждет приятный сюрприз.",
            "Ваше творчество приведет к успеху.",
            "Хорошее приходит к тем, кто ждет, но лучшее — к тем, кто идет и берет.",
            "Путешествие в тысячу миль начинается с первого шага.",
            "Лучший способ начать — перестать говорить и начать делать.",
            "Неожиданный гость принесет радость.",
            "Ваш упорный труд скоро окупится.",
            "Примите новые вызовы; они приносят новые возможности.",
            "Скрытый талант скоро проявится.",
            "Счастье находится, когда вы перестаете сравнивать себя с другими."
        ],
        "en": [
            "A pleasant surprise is waiting for you.",
            "Your creativity will lead to success.",
            "Good things come to those who wait, but better things come to those who go out and get them.",
            "A journey of a thousand miles begins with a single step.",
            "The best way to get started is to quit talking and begin doing.",
            "An unexpected visitor will bring joy.",
            "Your hard work will soon pay off.",
            "Embrace new challenges; they bring new opportunities.",
            "A hidden talent will soon emerge.",
            "Happiness is found when you stop comparing yourself to others."
        ]
    },

    // 8-шар ответы (аналог MAGIC_8_BALL_RESPONSES в astro.py)
    MAGIC_8_BALL_RESPONSES: {
        "ru": [
            "Бесспорно.", "Предрешено.", "Без сомнения.", "Да, определенно.",
            "Можешь быть уверен в этом.", "По моим данным — да.", "Весьма вероятно.", "Перспективы хорошие.",
            "Да.", "Знаки указывают на да.", "Ответ туманен, попробуй еще раз.", "Спроси позже.",
            "Лучше не рассказывать сейчас.", "Не могу предсказать сейчас.", "Сосредоточься и спроси снова.",
            "Даже не думай.", "Мой ответ — нет.", "По моим источникам — нет.", "Перспективы не очень хорошие.",
            "Весьма сомнительно."
        ],
        "en": [
            "It is certain.", "It is decidedly so.", "Without a doubt.", "Yes, definitely.",
            "You may rely on it.", "As I see it, yes.", "Most likely.", "Outlook good.",
            "Yes.", "Signs point to yes.", "Reply hazy, try again.", "Ask again later.",
            "Better not tell you now.", "Cannot predict now.", "Concentrate and ask again.",
            "Don't count on it.", "My reply is no.", "My sources say no.", "Outlook not so good.",
            "Very doubtful."
        ]
    },

    // Алгоритм куба Сидика Афгана (основной генератор предсказаний, адаптировано из astro.py)
    generate: (user, lang = 'en') => {
        const sign = user.sign || 'aries'; // Имя знака зодиака
        const today = DateTime.now(); // Текущая дата с Luxon
        const formattedDate = today.toFormat('dd-MM-yyyy');

        // Создаем уникальный "seed" для дня и пользователя, как в astro.py
        const seed_input = `${user._id}_${formattedDate}`;
        const hash = crypto.createHash('md5').update(seed_input).digest('hex');
        const seed = parseInt(hash.substring(0, 8), 16); // Берем первые 8 символов хеша и преобразуем в число

        // Простой псевдослучайный генератор на основе seed
        let currentSeed = seed;
        const pseudoRandom = () => {
            currentSeed = (currentSeed * 9301 + 49297) % 233280;
            return currentSeed / 233280;
        };

        const generateWeightedRandom = (weights) => {
            let sum = 0;
            for (const weight of weights) {
                sum += weight;
            }
            let r = pseudoRandom() * sum;
            for (let i = 0; i < weights.length; i++) {
                r -= weights[i];
                if (r < 0) return i;
            }
            return weights.length - 1;
        };

        const aspects = {
            "love": generateWeightedRandom([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]) + 1,
            "career": generateWeightedRandom([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]) + 1,
            "finance": generateWeightedRandom([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]) + 1,
            "health": generateWeightedRandom([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]) + 1
        };

        const signInfo = HoroscopeGenerator.SIGNS[sign] || {};
        const tips = HoroscopeGenerator.TIPS[lang] || HoroscopeGenerator.TIPS['en'];
        const motivationQuotes = HoroscopeGenerator.MOTIVATION_QUOTES[lang] || HoroscopeGenerator.MOTIVATION_QUOTES['en'];
        const tip = tips[Math.floor(pseudoRandom() * tips.length)];
        const motivation = motivationQuotes[Math.floor(pseudoRandom() * motivationQuotes.length)];

        // Форматирование гороскопа (адаптировано из astro.py)
        const emoji = signInfo.emoji || '✨';
        const signName = lang === 'ru' ? signInfo.name_ru : signInfo.name_en;
        const element = lang === 'ru' ? "" : signInfo.element; // Элемент только для EN версии

        let horoscopeText = `${emoji} <b>Daily Horoscope</b>\n\n`;
        if (lang === 'ru') {
            horoscopeText += `🔮 Знак зодиака: ${signName}\n`;
            horoscopeText += `📅 Дата: ${today.toFormat('dd MMM yyyy', { locale: 'ru' })}\n\n`; // Форматирование даты для русского
            Object.entries(aspects).forEach(([key, value]) => {
                const aspectName = {
                    "love": "❤️ Любовь", "career": "💼 Карьера", "finance": "💰 Финансы", "health": "🏥 Здоровье"
                }[key];
                horoscopeText += `${aspectName}: ${'⭐'.repeat(value)} ${value}/10\n`;
            });
            horoscopeText += `\n💡 Совет дня: ${tip}`;
            horoscopeText += `\n\n💪 Мотивация дня: ${motivation}`;
        } else { // English
            horoscopeText += `🔮 Zodiac: ${signName} (${element})\n`;
            horoscopeText += `📅 Date: ${today.toFormat('dd MMM yyyy')}\n\n`;
            Object.entries(aspects).forEach(([key, value]) => {
                const aspectName = {
                    "love": "💖 Love", "career": "💼 Career", "finance": "💰 Finance", "health": "🏥 Health"
                }[key];
                horoscopeText += `${aspectName}: ${'⭐'.repeat(value)} ${value}/10\n`;
            });
            horoscopeText += `\n💡 Tip: ${tip}`;
            horoscopeText += `\n\n💪 Motivation of the Day: ${motivation}`;
        }
        return horoscopeText;
    },

    // Новая функция: получить предсказание из печеньки
    getFortuneCookie: (lang = 'en') => {
        const cookies = HoroscopeGenerator.FORTUNE_COOKIES[lang] || HoroscopeGenerator.FORTUNE_COOKIES['en'];
        const randomIndex = Math.floor(Math.random() * cookies.length);
        return `🥠 <b>${lang === 'ru' ? 'Ваше предсказание из печеньки:' : 'Your Fortune Cookie says:'}</b>\n\n"${cookies[randomIndex]}"`;
    },

    // Новая функция: получить ответ от 8-шара
    getMagic8BallAnswer: (lang = 'en') => {
        const responses = HoroscopeGenerator.MAGIC_8_BALL_RESPONSES[lang] || HoroscopeGenerator.MAGIC_8_BALL_RESPONSES['en'];
        const randomIndex = Math.floor(Math.random() * responses.length);
        return `🎱 <b>${lang === 'ru' ? 'Магический шар 8 отвечает:' : 'Magic 8-Ball says:'}</b>\n\n"${responses[randomIndex]}"`;
    },

    // Новая функция: Проверка совместимости знаков зодиака (пример)
    getCompatibility: (sign1, sign2, lang = 'en') => {
        const compatibilityData = { // Упрощенные данные для примера
            "aries": {
                "aries": { "ru": "Вы оба - огненные знаки, что дает страсть, но может привести к конфликтам. Нужно учиться уступать.", "en": "Both fire signs, bringing passion but potential conflict. Learning to compromise is key." },
                "libra": { "ru": "Весы уравновешивают Овна, создавая гармоничный союз, где вы учитесь друг у друга.", "en": "Libra balances Aries, creating a harmonious union where you learn from each other." }
            },
            "libra": {
                "aries": { "ru": "Весы уравновешивают Овна, создавая гармоничный союз, где вы учитесь друг у друга.", "en": "Libra balances Aries, creating a harmonious union where you learn from each other." }
            }
            // Добавьте больше комбинаций для всех 12 знаков
        };

        const s1 = sign1.toLowerCase();
        const s2 = sign2.toLowerCase();

        const result = compatibilityData[s1]?.[s2]?.[lang] || compatibilityData[s2]?.[s1]?.[lang];

        if (result) {
            return `💖 <b>${lang === 'ru' ? 'Совместимость' : 'Compatibility'} ${HoroscopeGenerator.SIGNS[s1].emoji} ${HoroscopeGenerator.SIGNS[s2].emoji}:</b>\n\n${result}`;
        } else {
            return lang === 'ru' ? "ℹ️ Пока нет данных о совместимости этих знаков. Но помните, любовь не знает границ!" : "ℹ️ No compatibility data for these signs yet. But remember, love knows no bounds!";
        }
    },
    
    // Функция для получения знака зодиака по дате рождения (из astro.py)
    getSignByBirthDate: (day, month) => {
        // Упрощенная логика, как в astro.py. В реальном приложении лучше использовать более надежную библиотеку
        // или полный набор условий для точных дат.
        if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "aries";
        if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "taurus";
        if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "gemini";
        if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "cancer";
        if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "leo";
        if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "virgo";
        if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "libra";
        if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "scorpio";
        if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "sagittarius";
        if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "capricorn";
        if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "aquarius";
        if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return "pisces";
        return "aries"; // Дефолт
    }
};

export default HoroscopeGenerator;
