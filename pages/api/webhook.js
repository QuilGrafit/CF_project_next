import { MongoClient } from 'mongodb';

// Используем переменные окружения Vercel
const MONGODB_URI = process.env.MONGO_URI;
const DB_NAME = process.env.MONGO_DB_NAME || 'sample_mflix'; // Имя вашей БД
const COLLECTION_NAME = process.env.MONGO_COLLECTION_NAME || 'users'; // Имя вашей коллекции

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  if (!MONGODB_URI) {
    throw new Error('Please define the MONGO_URI environment variable inside .env.local');
  }

  const client = await MongoClient.connect(MONGODB_URI);

  const db = client.db(DB_NAME);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const update = req.body;

    try {
      // Подключаемся к базе данных
      const { client, db } = await connectToDatabase();
      
      // Получаем коллекцию
      const usersCollection = db.collection(COLLECTION_NAME);

      // Здесь вы можете начать работать с usersCollection
      // Например, сохранить пользователя:
      // await usersCollection.insertOne({ userId: update.message.from.id, username: update.message.from.username });

      console.log('MongoDB connected and collection obtained successfully!');

      res.status(200).send('OK');
    } catch (error) {
      console.error('Failed to connect to DB in webhook:', error);
      // Возвращаем более понятное сообщение об ошибке пользователю
      res.status(500).json({ error: 'Проблема с подключением к базе данных или получением коллекции.' });
    }
  } else {
    res.status(405).json({ error: 'Метод не разрешен. Используйте POST.' });
  }
}
