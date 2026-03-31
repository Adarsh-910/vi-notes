import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import sessionRoutes from './routes/sessions';
import { trainModel } from './utils/mlModel';

dotenv.config();

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://vi-notes-sigma-one.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vinotes';
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    trainModel(); // Build ML model synchronously before accepting complex traffic
  })
  .catch((err) => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
