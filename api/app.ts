import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';

import dotenv from 'dotenv';
dotenv.config(); // Загружаем переменные окружения из файла .env

const PORT = process.env.port

import userRouter from './routes/userRouter';
import authenticateToken from './middleware/authenticateToken';
import sentencesRouter from './routes/sentenceRouter';
import translationsRouter from './routes/translationRouter';
import dialectRouter from './routes/dialectRouter';

const app = express();

app.use(bodyParser.json());
app.use('/api/users', userRouter);
app.use('/api/dialect', authenticateToken, dialectRouter);
app.use('/api/sentences', authenticateToken, sentencesRouter);
app.use('/api/vocabulary', authenticateToken, sentencesRouter);
app.use('/api/translations', authenticateToken, translationsRouter);

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});

// Подключение к базе данных
// mongoose.connect(process.env.DB_CONNECTION_STRING)
//   .then(() => {
//     console.log('Подключено к базе данных');

//   })
//   .catch((error) => {
//     console.error('Ошибка при подключении к базе данных:', error);
//   });

export default app