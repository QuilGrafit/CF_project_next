const texts = require('./texts');

module.exports = {
  mainMenu: (lang = 'ru') => {
    return {
      reply_markup: {
        keyboard: [
          [texts[lang].main_menu_horoscope],
          [
            texts[lang].main_menu_settings, 
            texts[lang].main_menu_entertainment
          ],
          [
            texts[lang].compatibility_title, 
            texts[lang].main_menu_support
          ]
        ],
        resize_keyboard: true
      }
    };
  },

  settingsMenu: (lang = 'ru') => {
    return {
      reply_markup: {
        inline_keyboard: [
          [{ text: texts[lang].settings_change_sign, callback_data: 'change_sign' }],
          [{ text: texts[lang].settings_set_birth_date, callback_data: 'set_birth_date' }],
          [{ text: texts[lang].settings_change_language, callback_data: 'change_language' }],
          [{ text: texts[lang].back_button, callback_data: 'back_to_main' }]
        ]
      }
    };
  },

  signSelectionMenu: (lang = 'ru') => {
    const signs = Object.keys(texts[lang].signs);
    const buttons = signs.map(sign => ({
      text: `${texts[lang].signs[sign].emoji} ${texts[lang].signs[sign].name}`,
      callback_data: `set_sign_${sign}`
    }));

    // Разбиваем на ряды по 3 кнопки
    const rows = [];
    for (let i = 0; i < buttons.length; i += 3) {
      rows.push(buttons.slice(i, i + 3));
    }

    rows.push([{ text: texts[lang].back_button, callback_data: 'back_to_settings' }]);

    return {
      reply_markup: {
        inline_keyboard: rows
      }
    };
  },

  afterHoroscope: (lang = 'ru') => {
    return {
      reply_markup: {
        inline_keyboard: [
          [
            { text: texts[lang].main_menu_support, callback_data: 'support' },
            { text: texts[lang].compatibility_title, callback_data: 'compatibility' }
          ],
          [
            { text: texts[lang].motivation_button, callback_data: 'motivation' }
          ]
        ]
      }
    };
  },

  showMainMenu: async (ctx, lang = 'ru') => {
    await ctx.reply(texts[lang].main_menu_prompt, this.mainMenu(lang));
  }
};
