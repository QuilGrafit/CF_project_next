// lib/mongodb.js
import { MongoClient, ServerApiVersion } from 'mongodb';

// Получаем переменные окружения. Vercel подставит их сам.
const uri = "mongodb+srv://mparhartist:2p8swv9imnNFTuhx@cfpro.znuplwi.mongodb.net/?retryWrites=true&w=majority&appName=cfpro" //process.env.MONGO_URI;
const dbName = process.env.MONGO_DB_NAME || 'AstroBotDB';
const collectionName = process.env.MONGO_COLLECTION_NAME || 'users';

let client;
let clientPromise;

// Функция для подключения к базе данных
async function connectToDatabase() {
    if (clientPromise) {
        return clientPromise;
    }

    if (!uri) {
        throw new Error('Please define the MONGO_URI environment variable inside .env.local');
    }

    client = new MongoClient(uri, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    });

    clientPromise = client.connect(); // Вызываем connect, чтобы получить Promise

    // Возвращаем промис, который разрешится в объект { db, collection }
    return clientPromise.then(connectedClient => {
        const db = connectedClient.db(dbName);
        const collection = db.collection(collectionName);
        console.log("MongoDB connected!"); // Для дебага
        return { db, collection };
    }).catch(error => {
        console.error("Failed to connect to MongoDB:", error);
        clientPromise = null; // Сбрасываем, чтобы попробовать переподключиться
        throw error;
    });
}

// Экспортируем функцию подключения по умолчанию
export default connectToDatabase;
