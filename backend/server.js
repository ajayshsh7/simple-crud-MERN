import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import contactsRouter from './routes/contacts.js';

const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  }),
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});
app.use('/api/contacts', contactsRouter);

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

app.use((error, _req, res, _next) => {
  if (error.name === 'ValidationError') {
    const message = Object.values(error.errors)
      .map((item) => item.message)
      .join(' ');
    return res.status(400).json({ message });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid contact data.' });
  }

  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({ message: 'Request body must be valid JSON.' });
  }

  console.error(error);
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
});

async function start() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is missing. Copy backend/.env.example to backend/.env and configure it.');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB.');
  app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
}

start().catch((error) => {
  console.error('Could not start the API:', error.message);
  process.exit(1);
});
