const cron = require('node-cron');
const HoroscopeGenerator = require('./horoscope.js');

module.exports = function setupCronJobs(bot, usersCollection) {
  // Ежедневная рассылка в 9 утра
  cron.schedule('0 9 * * *', async () => {
    console.log('Starting daily horoscope distribution...');
    
    try {
      const users = await usersCollection.find({}).toArray();
      
      for (const user of users) {
        try {
          const horoscope = await HoroscopeGenerator.generate(user._id, user);
          await bot.telegram.sendMessage(user._id, horoscope, { parse_mode: 'HTML' });
          
          console.log(`Horoscope sent to ${user._id}`);
          
          // Отправляем мотивацию
          const motivations = texts[user.lang || 'ru'].motivations;
          const motivation = motivations[Math.floor(Math.random() * motivations.length)];
          
          await bot.telegram.sendMessage(
            user._id,
            `💫 <b>${texts[user.lang || 'ru'].motivation_title}</b>\n\n"${motivation}"\n\nХорошего дня! ✨`,
            { parse_mode: 'HTML' }
          );
          
        } catch (error) {
          console.error(`Error sending to user ${user._id}:`, error);
        }
      }
      
      console.log('Daily distribution completed!');
    } catch (error) {
      console.error('Error in daily distribution:', error);
    }
  }, {
    scheduled: true,
    timezone: 'Europe/Moscow'
  });

  // Можно добавить другие cron-задачи
};
