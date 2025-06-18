const texts = require('./texts.js');

class HoroscopeGenerator {
  static SIGNS = {
    aries: { 
      emoji: "♈️", element: "fire", 
      planet: "mars", luckyNumbers: [9, 18], 
      stones: ["diamond", "ruby"],
      traits: ["energetic", "courageous", "impulsive"]
    },
    taurus: { 
      emoji: "♉️", element: "earth", 
      planet: "venus", luckyNumbers: [6, 15], 
      stones: ["emerald", "sapphire"],
      traits: ["stable", "patient", "stubborn"]
    },
    // ... другие знаки ...
  };

  static MOODS = {
    ru: ["Оптимистичное", "Задумчивое", "Энергичное", "Спокойное", "Осторожное", "Радостное"],
    en: ["Optimistic", "Thoughtful", "Energetic", "Calm", "Cautious", "Joyful"]
  };

  static COLORS = {
    ru: ["Синий", "Зеленый", "Золотой", "Серебряный", "Красный", "Фиолетовый", "Розовый"],
    en: ["Blue", "Green", "Gold", "Silver", "Red", "Purple", "Pink"]
  };

  static COMPATIBILITY = {
    aries: { perfect: ["leo", "sagittarius"], good: ["gemini", "aquarius"] },
    taurus: { perfect: ["virgo", "capricorn"], good: ["cancer", "pisces"] },
    // ... другие знаки ...
  };

  static COOKIE_FORTUNES = {
    ru: [
      "Вас ждет неожиданная удача в ближайшие дни",
      "Прислушайтесь к своему внутреннему голосу - он знает ответ",
      "Скоро вас ждет приятная встреча, которая изменит многое",
      "Ваше упорство скоро принесет долгожданные плоды",
      "Откройтесь новым возможностям - они ведут к успеху",
      "Время действовать смело - все препятствия преодолимы",
      "Ваша доброта вернется к вам многократно умноженной",
      "Не бойтесь перемен - они ведут к лучшему"
    ],
    en: [
      "Unexpected luck awaits you in the coming days",
      "Listen to your inner voice - it knows the answer",
      "A pleasant meeting is coming soon that will change many things",
      "Your perseverance will soon bear long-awaited fruits",
      "Open yourself to new opportunities - they lead to success",
      "Time to act boldly - all obstacles can be overcome",
      "Your kindness will return to you multiplied",
      "Don't be afraid of change - it leads to better"
    ]
  };

  static MAGIC_BALL_ANSWERS = {
    ru: {
      positive: ["Безусловно!", "Да.", "Весьма вероятно.", "Можете быть уверены."],
      negative: ["Не стоит.", "Лучше не надо.", "Сейчас не время.", "Не советую."],
      neutral: ["Спросите позже.", "Пока не ясно.", "Сконцентрируйтесь и спросите снова."]
    },
    en: {
      positive: ["Certainly!", "Yes.", "Most likely.", "You can be sure."],
      negative: ["Not worth it.", "Better not.", "Not now.", "I wouldn't advise."],
      neutral: ["Ask later.", "It's not clear yet.", "Concentrate and ask again."]
    }
  };

  static getSignName(signKey, lang = 'ru') {
    const signNames = {
      aries: { ru: "Овен", en: "Aries" },
      taurus: { ru: "Телец", en: "Taurus" },
      // ... другие знаки ...
    };
    return signNames[signKey]?.[lang] || signNames[signKey]?.ru || "Овен";
  }

  static getZodiacSign(birthDate) {
    const month = birthDate.getMonth() + 1;
    const day = birthDate.getDate();

    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "aries";
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "taurus";
    // ... другие знаки ...
    
    return "aries";
  }

  static async generate(userId, userData) {
    const lang = userData.lang || 'ru';
    const sign = userData.sign || 'aries';
    const signInfo = this.SIGNS[sign];
    
    // Генерация уникального прогноза на основе дня и ID пользователя
    const today = new Date();
    const seed = userId + today.toISOString().split('T')[0];
    const rng = this.createRNG(seed);
    
    const mood = rng.pick(this.MOODS[lang]);
    const color = rng.pick(this.COLORS[lang]);
    const luckyNumber = rng.pick(signInfo.luckyNumbers);
    const stone = this.getStoneName(rng.pick(signInfo.stones), lang);
    const planet = this.getPlanetName(signInfo.planet, lang);
    
    // Генерация аспектов
    const aspects = {
      love: { score: rng.int(1, 10), description: this.generateLoveDescription(sign, lang, rng) },
      career: { score: rng.int(1, 10), description: this.generateCareerDescription(sign, lang, rng) },
      finance: { score: rng.int(1, 10), description: this.generateFinanceDescription(sign, lang, rng) },
      health: { score: rng.int(1, 10), description: this.generateHealthDescription(sign, lang, rng) }
    };
    
    // Форматирование гороскопа
    return `
${signInfo.emoji} <b>${texts[lang].horoscope_title}</b>

🔮 ${texts[lang].horoscope_sign.replace('{sign}', this.getSignName(sign, lang)).replace('{element}', texts[lang]['element_' + signInfo.element])}
📅 ${texts[lang].horoscope_date.replace('{date}', today.toLocaleDateString(lang))}
🌈 ${texts[lang].horoscope_mood.replace('{mood}', mood)}
🎨 ${texts[lang].horoscope_lucky_color.replace('{color}', color)}
🔢 ${texts[lang].horoscope_lucky_number.replace('{number}', luckyNumber)}
💎 ${texts[lang].horoscope_lucky_stone.replace('{stone}', stone)}
🪐 ${texts[lang].horoscope_ruling_planet.replace('{planet}', planet)}

<b>💖 ${texts[lang].horoscope_love}:</b> ${aspects.love.score}/10
<i>${aspects.love.description}</i>

<b>💼 ${texts[lang].horoscope_career}:</b> ${aspects.career.score}/10
<i>${aspects.career.description}</i>

<b>💰 ${texts[lang].horoscope_finance}:</b> ${aspects.finance.score}/10
<i>${aspects.finance.description}</i>

<b>🏥 ${texts[lang].horoscope_health}:</b> ${aspects.health.score}/10
<i>${aspects.health.description}</i>

💡 <b>${texts[lang].horoscope_tip}:</b> ${this.generateDailyTip(sign, lang, rng)}

✨ ${texts[lang].horoscope_closing_message} 
    `;
  }

  static createRNG(seed) {
    // ... реализация генератора случайных чисел на основе seed ...
  }

  static getCompatibility(sign1, sign2) {
    const compatibilityLevels = ['perfect', 'good'];
    let compatibility = 'average';
    
    for (const level of compatibilityLevels) {
      if (this.COMPATIBILITY[sign1][level]?.includes(sign2) ||
          this.COMPATIBILITY[sign2][level]?.includes(sign1)) {
        compatibility = level;
        break;
      }
    }
    
    return {
      level: compatibility,
      text: texts.ru[`compatibility_${compatibility}`],
      description: texts.ru[`compatibility_desc_${compatibility}`]
    };
  }

  static getCookieFortune(lang = 'ru') {
    return this.COOKIE_FORTUNES[lang][
      Math.floor(Math.random() * this.COOKIE_FORTUNES[lang].length)
    ];
  }

  static getMagicBallAnswer(lang = 'ru') {
    const answers = [
      ...this.MAGIC_BALL_ANSWERS[lang].positive,
      ...this.MAGIC_BALL_ANSWERS[lang].negative,
      ...this.MAGIC_BALL_ANSWERS[lang].neutral
    ];
    return answers[Math.floor(Math.random() * answers.length)];
  }

  // Генераторы описаний для различных аспектов
  static generateLoveDescription(sign, lang, rng) {
    const descriptions = texts[lang].love_descriptions;
    return rng.pick(descriptions);
  }
  
  // ... другие генераторы описаний ...
}
