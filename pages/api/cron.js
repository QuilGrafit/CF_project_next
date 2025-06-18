// pages/api/cron.js
import { connectToDatabase } from '../../lib/mongodb';
import { HoroscopeGenerator } from '../../lib/horoscope';
import { sendMessage, showAds } from '../../lib/telegram'; // Убедитесь, что импортируете showAds

export default async function handler(req, res) {
    if (req.method !== 'GET') { // Cron jobs на Vercel обычно вызываются через GET
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    console.log("Next.js Cron: Начинаю выполнение ежедневных запланированных задач (рассылка гороскопов).");

    try {
        const { db } = await connectToDatabase();
        const usersCollection = db.collection(process.env.MONGO_COLLECTION_NAME || "users");

        const todayStart = new Date();
        todayStart.setUTCHours(0, 0, 0, 0);

        const usersToNotify = await usersCollection.find({
            daily_notifications_enabled: true,
            $or: [
                { last_horoscope_date: { $exists: false } },
                { last_horoscope_date: { $lt: todayStart } }
            ]
        }).toArray();

        console.log(`Next.js Cron: Найдено ${usersToNotify.length} пользователей для ежедневной рассылки.`);

        for (const user_data of usersToNotify) {
            const userId = user_data._id;
            try {
                const horoscope = HoroscopeGenerator.generate(user_data);
                await sendMessage(userId, horoscope);

                await usersCollection.updateOne(
                    { _id: userId },
                    { $set: { last_horoscope_date: new Date() } }
                );
                console.log(`Next.js Cron: Гороскоп отправлен пользователю ${userId}.`);

                await showAds(userId);

            } catch (error) {
                console.error(`Next.js Cron: Ошибка при отправке гороскопа пользователю ${userId}: ${error.message}`);
            }
        }

        return res.status(200).json({ status: 'ok', message: `Отправлено гороскопов: ${usersToNotify.length}` });

    } catch (error) {
        console.error(`Next.js Cron: Критическая ошибка в Cron Job: ${error.message}`);
        return res.status(500).json({ error: error.message });
    }
}
