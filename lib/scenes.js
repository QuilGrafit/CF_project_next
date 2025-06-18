const { Scenes } = require('telegraf');
const texts = require('./texts.js');
const keyboards = require('./keyboards.js');
const HoroscopeGenerator = require('./horoscope.js');

module.exports = {
  birthDateScene: (usersCollection) => {
    return new Scenes.WizardScene(
      'BIRTH_DATE_SCENE',
      async (ctx) => {
        const user = await usersCollection.findOne({ _id: ctx.from.id }) || {};
        const lang = user.lang || 'ru';
        await ctx.reply(texts[lang].birth_date_prompt);
        return ctx.wizard.next();
      },
      async (ctx) => {
        const date = ctx.message.text;
        const lang = ctx.wizard.state.lang || 'ru';
        
        if (!/^\d{2}\.\d{2}\.\d{4}$/.test(date)) {
          await ctx.reply(texts[lang].birth_date_invalid_format);
          return;
        }
        
        const [day, month, year] = date.split('.').map(Number);
        const birthDate = new Date(year, month - 1, day);
        
        if (birthDate > new Date()) {
          await ctx.reply(texts[lang].birth_date_future_error);
          return;
        }
        
        // Сохраняем дату рождения
        await usersCollection.updateOne(
          { _id: ctx.from.id },
          { $set: { birthDate: date } },
          { upsert: true }
        );
        
        // Определяем знак зодиака
        const sign = HoroscopeGenerator.getZodiacSign(birthDate);
        await usersCollection.updateOne(
          { _id: ctx.from.id },
          { $set: { sign } }
        );
        
        await ctx.replyWithHTML(
          texts[lang].birth_date_success.replace('{birth_date}', date) + 
          `\n${texts[lang].sign_set_success.replace('{sign}', HoroscopeGenerator.getSignName(sign, lang))}`
        );
        
        await keyboards.showMainMenu(ctx, lang);
        return ctx.scene.leave();
      }
    );
  },

  magicBallScene: () => {
    return new Scenes.WizardScene(
      'MAGIC_BALL_SCENE',
      async (ctx) => {
        const user = await usersCollection.findOne({ _id: ctx.from.id }) || {};
        const lang = user.lang || 'ru';
        await ctx.reply(texts[lang].magic_ball_question_prompt);
        return ctx.wizard.next();
      },
      async (ctx) => {
        const question = ctx.message.text;
        const user = await usersCollection.findOne({ _id: ctx.from.id }) || {};
        const lang = user.lang || 'ru';
        
        if (!question.includes('?')) {
          await ctx.reply(texts[lang].magic_ball_not_a_question);
          return;
        }
        
        const answer = HoroscopeGenerator.getMagicBallAnswer();
        await ctx.replyWithHTML(
          texts[lang].magic_ball_answer_message.replace('{answer}', answer)
        );
        
        await keyboards.showMainMenu(ctx, lang);
        return ctx.scene.leave();
      }
    );
  },

  compatibilityScene: (usersCollection, horoscopeGenerator) => {
    return new Scenes.WizardScene(
      'COMPATIBILITY_SCENE',
      async (ctx) => {
        const user = await usersCollection.findOne({ _id: ctx.from.id }) || {};
        const lang = user.lang || 'ru';
        await ctx.reply(
          texts[lang].compatibility_select,
          keyboards.compatibilityMenu(lang)
        );
        return ctx.wizard.next();
      },
      async (ctx) => {
        const sign1 = ctx.match?.[1] || '';
        const user = await usersCollection.findOne({ _id: ctx.from.id }) || {};
        const sign2 = user.sign || 'aries';
        const lang = user.lang || 'ru';
        
        const compatibility = horoscopeGenerator.getCompatibility(sign1, sign2);
        
        await ctx.replyWithHTML(
          `${texts[lang].compatibility_result.replace('{sign1}', horoscopeGenerator.getSignName(sign1, lang)).replace('{sign2}', horoscopeGenerator.getSignName(sign2, lang))}\n\n` +
          `<b>${compatibility.text}</b>\n` +
          `${compatibility.description}`
        );
        
        await keyboards.showMainMenu(ctx, lang);
        return ctx.scene.leave();
      }
    );
  }
};
