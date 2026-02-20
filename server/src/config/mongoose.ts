import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB(): Promise<void> {
  const uri = `${env.MONGO_URI}/${env.MONGO_DB_NAME}`;
  await mongoose.connect(uri);
  console.log(`✓ MongoDB connected → ${env.MONGO_DB_NAME}`);
}
