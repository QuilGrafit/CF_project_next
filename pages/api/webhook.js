require('dotenv').config();
const { Telegraf, Scenes, session } = require('telegraf');
const { MongoClient } = require('mongodb');
const cron = require('node-cron');
const keyboards = require('./keyboards.js');
const texts = require('./texts.js');
const HoroscopeGenerator = require('./horoscope.js');
const scenes = require('./scenes.js');

const bot = new Telegraf(process.env.BOT_TOKEN);
let usersCollection = null;

// Инициализация MongoDB
async function initDB() {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  const db = client.db('astroBotDB');
  usersCollection = db.collection('users');
  console.log('Connected to MongoDB');
  return usersCollection;
}

// Получение данных пользователя
async function getUser(userId) {
  return usersCollection.findOne({ _id: userId }) || {
    _id: userId,
    sign: 'aries',
    lang: 'ru',
    birthDate: null
  };
}

// Обновление данных пользователя
async function updateUser(userId, data) {
  return usersCollection.updateOne(
    { _id: userId },
    { $set: data },
    { upsert: true }
  );
}

// Создаем сцену
const stage = new Scenes.Stage([
  scenes.birthDateScene(usersCollection),
  scenes.magicBallScene(),
  scenes.compatibilityScene(usersCollection, HoroscopeGenerator)
]);

bot.use(session());
bot.use(stage.middleware());

// Отправка мотивации
async function sendMotivation(ctx) {
  const motivations = texts.ru.motivations;
  const motivation = motivations[Math.floor(Math.random() * motivations.length)];
  
  await ctx.replyWithHTML(
    `💫 <b>${texts.ru.motivation_title}</b>\n\n"${motivation}"\n\nПусть этот день принесет вам радость и вдохновение! ✨`
  );
}

// Главное меню
async function showMainMenu(ctx) {
  const user = await getUser(ctx.from.id);
  const lang = user.lang || 'ru';
  
  await ctx.reply(
    texts[lang].main_menu_prompt,
    keyboards.mainMenu(lang)
  );
}

// Обработчики команд
bot.start(async (ctx) => {
  await updateUser(ctx.from.id, {
    firstName: ctx.from.first_name,
    lastName: ctx.from.last_name,
    username: ctx.from.username,
    createdAt: new Date()
  });
  
  const user = await getUser(ctx.from.id);
  const lang = user.lang || 'ru';
  
  await ctx.replyWithHTML(
    `✨ Привет, ${ctx.from.first_name}! ${texts[lang].welcome}`
  );
  
  await sendMotivation(ctx);
  await showMainMenu(ctx);
});

bot.hears(texts.ru.main_menu_horoscope, async (ctx) => {
  const user = await getUser(ctx.from.id);
  const lang = user.lang || 'ru';
  
  try {
    const horoscope = await HoroscopeGenerator.generate(user._id, user);
    await ctx.replyWithHTML(horoscope);
    
    // Кнопки под гороскопом
    await ctx.reply(texts[lang].after_horoscope_prompt, keyboards.afterHoroscope(lang));
  } catch (error) {
    console.error('Error generating horoscope:', error);
    await ctx.reply(texts[lang].horoscope_error);
  }
});

bot.hears(texts.ru.main_menu_settings, async (ctx) => {
  const user = await getUser(ctx.from.id);
  const lang = user.lang || 'ru';
  await ctx.reply(texts[lang].settings_menu_choose, keyboards.settingsMenu(lang));
});

bot.hears(texts.ru.main_menu_support, async (ctx) => {
  const user = await getUser(ctx.from.id);
  const lang = user.lang || 'ru';
  
  await ctx.replyWithHTML(
    texts[lang].support_us_prompt.replace('{wallet}', process.env.TON_WALLET_ADDRESS),
    keyboards.supportMenu(lang)
  );
});

bot.hears(texts.ru.main_menu_entertainment, async (ctx) => {
  const user = await getUser(ctx.from.id);
  const lang = user.lang || 'ru';
  await ctx.reply(texts[lang].entertainment_menu_choose, keyboards.entertainmentMenu(lang));
});

bot.hears(texts.ru.compatibility_title, async (ctx) => {
  await ctx.scene.enter('COMPATIBILITY_SCENE');
});

// Обработчики callback-кнопок
bot.action('change_sign', async (ctx) => {
  const user = await getUser(ctx.from.id);
  const lang = user.lang || 'ru';
  
  await ctx.editMessageText(
    texts[lang].choose_sign,
    keyboards.signSelectionMenu(lang)
  );
});

bot.action(/set_sign_(.+)/, async (ctx) => {
  const sign = ctx.match[1];
  await updateUser(ctx.from.id, { sign });
  
  const user = await getUser(ctx.from.id);
  const lang = user.lang || 'ru';
  
  await ctx.editMessageText(
    texts[lang].sign_set_success.replace('{sign}', HoroscopeGenerator.getSignName(sign, lang))
  );
});

bot.action('set_birth_date', async (ctx) => {
  await ctx.scene.enter('BIRTH_DATE_SCENE');
});

bot.action('get_cookie', async (ctx) => {
  const user = await getUser(ctx.from.id);
  const lang = user.lang || 'ru';
  
  const fortune = HoroscopeGenerator.getCookieFortune();
  await ctx.editMessageText(
    texts[lang].cookie_fortune_message.replace('{fortune}', fortune),
    keyboards.cookieMenu(lang)
  );
});

bot.action('ask_magic_ball', async (ctx) => {
  await ctx.scene.enter('MAGIC_BALL_SCENE');
});

bot.action('compatibility', async (ctx) => {
  await ctx.scene.enter('COMPATIBILITY_SCENE');
});

bot.action('motivation', async (ctx) => {
  await sendMotivation(ctx);
});

// Запуск бота
async function start() {
  try {
    await initDB();
    
    // Настройка ежедневной рассылки в 9 утра
    cron.schedule('0 9 * * *', async () => {
      const users = await usersCollection.find({}).toArray();
      
      for (const user of users) {
        try {
          const horoscope = await HoroscopeGenerator.generate(user._id, user);
          await bot.telegram.sendMessage(user._id, horoscope, { parse_mode: 'HTML' });
          
          // Отправляем мотивацию
          const motivations = texts[user.lang || 'ru'].motivations;
          const motivation = motivations[Math.floor(Math.random() * motivations.length)];
          
          await bot.telegram.sendMessage(
            user._id,
            `💫 <b>${texts[user.lang || 'ru'].motivation_title}</b>\n\n"${motivation}"\n\nХорошего дня! ✨`,
            { parse_mode: 'HTML' }
          );
          
        } catch (e) {
          console.error(`Error sending to ${user._id}:`, e);
        }
      }
    }, {
      timezone: 'Europe/Moscow'
    });
    
    bot.launch();
    console.log('Бот запущен!');
  } catch (error) {
    console.error('Ошибка запуска бота:', error);
  }
}

start();

// Обработка остановки
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
