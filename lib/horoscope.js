// lib/horoscope.js
import { DateTime } from 'luxon';
import crypto from 'crypto';

const HoroscopeGenerator = {
    // Знаки зодиака с данными
    SIGNS: {
        "aries": {"emoji": "♈️", "element": "Fire", "name_en": "Aries", "name_ru": "Овен", "key": "aries"},
        "taurus": {"emoji": "♉️", "element": "Earth", "name_en": "Taurus", "name_ru": "Телец", "key": "taurus"},
        "gemini": {"emoji": "♊️", "element": "Air", "name_en": "Gemini", "name_ru": "Близнецы", "key": "gemini"},
        "cancer": {"emoji": "♋️", "element": "Water", "name_en": "Cancer", "name_ru": "Рак", "key": "cancer"},
        "leo": {"emoji": "♌️", "element": "Fire", "name_en": "Leo", "name_ru": "Лев", "key": "leo"},
        "virgo": {"emoji": "♍️", "element": "Earth", "name_en": "Virgo", "name_ru": "Дева", "key": "virgo"},
        "libra": {"emoji": "♎️", "element": "Air", "name_en": "Libra", "name_ru": "Весы", "key": "libra"},
        "scorpio": {"emoji": "♏️", "element": "Water", "name_en": "Scorpio", "name_ru": "Скорпион", "key": "scorpio"},
        "sagittarius": {"emoji": "♐️", "element": "Fire", "name_en": "Sagittarius", "name_ru": "Стрелец", "key": "sagittarius"},
        "capricorn": {"emoji": "♑️", "element": "Earth", "name_en": "Capricorn", "name_ru": "Козерог", "key": "capricorn"},
        "aquarius": {"emoji": "♒️", "element": "Air", "name_en": "Aquarius", "name_ru": "Водолей", "key": "aquarius"},
        "pisces": {"emoji": "♓️", "element": "Water", "name_en": "Pisces", "name_ru": "Рыбы", "key": "pisces"},
    },

    ASPECT_RANGES: { /* ... без изменений ... */ },
    TIPS: { /* ... без изменений ... */ },
    MOTIVATION_QUOTES: { /* ... без изменений ... */ },
    FORTUNE_COOKIES: { /* ... без изменений ... */ },
    MAGIC_8_BALL_RESPONSES: { /* ... без изменений ... */ },

    generate: (user, lang = 'en') => {
        const sign = user.sign || 'aries';
        const today = DateTime.now();
        const formattedDate = today.toFormat('dd-MM-yyyy');

        const seed_input = `${user._id}_${formattedDate}`;
        const hash = crypto.createHash('md5').update(seed_input).digest('hex');
        const seed = parseInt(hash.substring(0, 8), 16);

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

        const emoji = signInfo.emoji || '✨';
        const signName = lang === 'ru' ? signInfo.name_ru : signInfo.name_en;
        const element = signInfo.element; // Элемент всегда есть в EN

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

    getFortuneCookie: (lang = 'en') => {
        const cookies = HoroscopeGenerator.FORTUNE_COOKIES[lang] || HoroscopeGenerator.FORTUNE_COOKIES['en'];
        const randomIndex = Math.floor(Math.random() * cookies.length);
        return `🥠 <b>${lang === 'ru' ? 'Ваше предсказание из печеньки:' : 'Your Fortune Cookie says:'}</b>\n\n"${cookies[randomIndex]}"`;
    },

    getMagic8BallAnswer: (lang = 'en') => {
        const responses = HoroscopeGenerator.MAGIC_8_BALL_RESPONSES[lang] || HoroscopeGenerator.MAGIC_8_BALL_RESPONSES['en'];
        const randomIndex = Math.floor(Math.random() * responses.length);
        return `🎱 <b>${lang === 'ru' ? 'Магический шар 8 отвечает:' : 'Magic 8-Ball says:'}</b>\n\n"${responses[randomIndex]}"`;
    },

    // Новая функция: Проверка совместимости знаков зодиака (добавил больше данных)
    getCompatibility: (sign1Key, sign2Key, lang = 'en') => {
        const compatibilityData = {
            "aries": {
                "aries": { "ru": "Вы оба - огненные знаки, что дает страсть, но может привести к конфликтам. Нужно учиться уступать.", "en": "Both fire signs, bringing passion but potential conflict. Learning to compromise is key." },
                "taurus": { "ru": "Овен и Телец - динамичная пара. Телец приносит стабильность, Овен - импульс. Требуется терпение.", "en": "Aries and Taurus are a dynamic pair. Taurus brings stability, Aries brings impulse. Patience is required." },
                "gemini": { "ru": "Энергичная комбинация! Вы оба любите приключения, но Овен может найти Близнецов слишком непостоянными.", "en": "An energetic combination! Both love adventure, but Aries might find Gemini too inconsistent." },
                "cancer": { "ru": "Различные энергии. Овну нужно пространство, Раку - безопасность. Возможны недопонимания.", "en": "Different energies. Aries needs space, Cancer needs security. Misunderstandings are possible." },
                "leo": { "ru": "Отличная пара! Страсть, уважение и много веселья. Вы вдохновляете друг друга.", "en": "A great match! Passion, respect, and lots of fun. You inspire each other." },
                "virgo": { "ru": "Овен импульсивен, Дева методична. Могут дополнять друг друга, если Овен научится планировать, а Дева - рисковать.", "en": "Aries is impulsive, Virgo is methodical. Can complement each other if Aries learns to plan and Virgo takes risks." },
                "libra": { "ru": "Весы уравновешивают Овна, создавая гармоничный союз, где вы учитесь друг у друга.", "en": "Libra balances Aries, creating a harmonious union where you learn from each other." },
                "scorpio": { "ru": "Интенсивная связь. Оба сильные и страстные, но могут конкурировать. Нужна взаимная честность.", "en": "An intense connection. Both strong and passionate but can compete. Mutual honesty is needed." },
                "sagittarius": { "ru": "Огненная энергия вдвойне! Вы оба оптимистичны и любите свободу. Отличная динамика.", "en": "Double fire energy! Both are optimistic and love freedom. Excellent dynamic." },
                "capricorn": { "ru": "Овен - первопроходец, Козерог - строитель. Могут быть успешны вместе, если признают сильные стороны друг друга.", "en": "Aries is a pioneer, Capricorn is a builder. Can be successful together if they acknowledge each other's strengths." },
                "aquarius": { "ru": "Интересная комбинация. Овен ценит независимость Водолея, а Водолей - смелость Овна. Свобода важна.", "en": "An interesting combination. Aries appreciates Aquarius' independence, and Aquarius appreciates Aries' courage. Freedom is important." },
                "pisces": { "ru": "Овен может быть слишком прямым для чувствительных Рыб, но Рыбы привносят мягкость. Нужны компромиссы.", "en": "Aries can be too direct for sensitive Pisces, but Pisces brings softness. Compromises are needed." }
            },
            "taurus": {
                "taurus": { "ru": "Две Тельца - это стабильность и комфорт. Вы цените одно и то же, но может быть упрямство с обеих сторон.", "en": "Two Taureans mean stability and comfort. You value the same things, but stubbornness can arise from both sides." },
                "gemini": { "ru": "Телец и Близнецы: земля и воздух. Телец любит рутину, Близнецы - перемены. Найдите золотую середину.", "en": "Taurus and Gemini: earth and air. Taurus likes routine, Gemini likes change. Find a middle ground." }
                // Добавьте остальные комбинации для Тельца
            },
            // ... Добавьте данные для всех 12 знаков
            "gemini": {
                "gemini": { "ru": "Два Близнеца - это бесконечное общение и веселье. Но будьте осторожны с поверхностностью.", "en": "Two Geminis mean endless communication and fun. But be careful with superficiality." }
                // Добавьте остальные комбинации для Близнецов
            },
            "cancer": {
                "cancer": { "ru": "Два Рака создают уютное и эмоциональное гнездышко. Но остерегайтесь замкнутости и перепадов настроения.", "en": "Two Cancers create a cozy and emotional nest. But beware of seclusion and mood swings." }
            },
            "leo": {
                "leo": { "ru": "Два Льва - это яркость, страсть и драматизм. Главное - не конкурировать за внимание.", "en": "Two Leos mean brightness, passion, and drama. The main thing is not to compete for attention." }
            },
            "virgo": {
                "virgo": { "ru": "Две Девы - это порядок, практичность и взаимная поддержка. Избегайте чрезмерной критики.", "en": "Two Virgos mean order, practicality, and mutual support. Avoid excessive criticism." }
            },
            "libra": {
                "libra": { "ru": "Две Весы - это гармония, красота и социальная жизнь. Но могут быть нерешительными вместе.", "en": "Two Libras mean harmony, beauty, and social life. But they can be indecisive together." }
            },
            "scorpio": {
                "scorpio": { "ru": "Два Скорпиона - это глубокая, страстная и порой драматичная связь. Интенсивность может быть как плюсом, так и минусом.", "en": "Two Scorpios mean a deep, passionate, and sometimes dramatic connection. Intensity can be both a plus and a minus." }
            },
            "sagittarius": {
                "sagittarius": { "ru": "Два Стрельца - это приключения, свобода и оптимизм. Могут быть слишком независимыми друг от друга.", "en": "Two Sagittarians mean adventure, freedom, and optimism. They can be too independent of each other." }
            },
            "capricorn": {
                "capricorn": { "ru": "Два Козерога - это амбиции, ответственность и прочные основы. Могут быть слишком серьезными.", "en": "Two Capricorns mean ambition, responsibility, and strong foundations. They can be too serious." }
            },
            "aquarius": {
                "aquarius": { "ru": "Два Водолея - это оригинальность, интеллектуальные беседы и стремление к свободе. Эмоциональность может страдать.", "en": "Two Aquarians mean originality, intellectual conversations, and a desire for freedom. Emotionality can suffer." }
            },
            "pisces": {
                "pisces": { "ru": "Две Рыбы - это глубокая эмпатия, романтика и духовная связь. Могут утонуть в эмоциях.", "en": "Two Pisceans mean deep empathy, romance, and a spiritual connection. They can drown in emotions." }
            }
        };

        const s1 = sign1Key.toLowerCase();
        const s2 = sign2Key.toLowerCase();

        // Проверяем прямую комбинацию или обратную
        const result = compatibilityData[s1]?.[s2]?.[lang] || compatibilityData[s2]?.[s1]?.[lang];

        const sign1Info = HoroscopeGenerator.SIGNS[s1];
        const sign2Info = HoroscopeGenerator.SIGNS[s2];

        if (result) {
            return `💖 <b>${lang === 'ru' ? 'Совместимость' : 'Compatibility'} ${sign1Info.emoji} ${sign1Info[`name_${lang}`]} & ${sign2Info.emoji} ${sign2Info[`name_${lang}`]}:</b>\n\n${result}`;
        } else {
            // Если для конкретной пары нет данных, даем общий ответ
            const generalResponse = {
                "ru": "ℹ️ Пока нет данных о совместимости этих знаков. Но помните, любовь не знает границ и зависит от множества факторов!",
                "en": "ℹ️ No specific compatibility data for these signs yet. But remember, love knows no bounds and depends on many factors!"
            };
            return generalResponse[lang];
        }
    },
    
    // Функция для получения знака зодиака по дате рождения
    getSignByBirthDate: (day, month) => {
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
        return "aries"; // Дефолт, если не удалось определить
    }
};

export default HoroscopeGenerator;
