// lib/mongodb.js
import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB_NAME || "AstroBotDB";

let cachedClient = null;
let cachedDb = null;

if (!uri) {
    throw new Error('Please define the MONGO_URI environment variable inside .env.local');
}

export async function connectToDatabase() {
    if (cachedClient && cachedDb) {
        return { client: cachedClient, db: cachedDb };
    }

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);

    cachedClient = client;
    cachedDb = db;

    console.log("Connected to MongoDB from Next.js API Route.");
    return { client, db };
}
