import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import candidateRoutes from './routes/candidates.routes.js';
import jobRoutes from './routes/jobs.routes.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGINS, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/jobs', jobRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'matchdb-data-collection', env: env.NODE_ENV });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

export default app;
