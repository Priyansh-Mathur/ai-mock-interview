import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import interviewRoutes from './routes/interviewRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

app.get('/', (req, res) => {
  res.json({ message: 'AI Mock Interview Gemini API server running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/interviews', interviewRoutes);

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: 'Internal server error', error: error.message });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
