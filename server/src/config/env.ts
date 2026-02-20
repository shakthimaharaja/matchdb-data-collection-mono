import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(import.meta.dirname ?? __dirname, '../../.env') });

export const env = {
  PORT: parseInt(process.env.PORT || '5001', 10),
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017',
  MONGO_DB_NAME: process.env.MONGO_DB_NAME || 'matchdb_data_collection',
  JWT_SECRET: process.env.JWT_SECRET || 'data-collection-dev-secret-change-in-prod-32chars',
  JWT_EXPIRES: process.env.JWT_EXPIRES || '8h',
  CORS_ORIGINS: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(','),
  NODE_ENV: process.env.NODE_ENV || 'development',
};
