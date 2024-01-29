import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import http from 'http'; // Импортируем модуль http
import socketIO from 'socket.io'; // Импортируем модуль socket.io

import dotenv from 'dotenv';
dotenv.config(); // Загружаем переменные окружения из файла .env

const PORT = process.env.port || 3000

import userRouter from './routes/userRouter';
import authenticateToken from './middleware/authenticateToken';
import sentencesRouter from './routes/sentenceRouter';
import translationsRouter from './routes/translationRouter';
import dialectRouter from './routes/dialectRouter';

const app = express();
const server = http.createServer(app); // Создаем сервер с помощью модуля http

app.use(bodyParser.json());
app.use('/api/users', userRouter);
app.use('/api/dialect', authenticateToken, dialectRouter);
app.use('/api/sentences', authenticateToken, sentencesRouter);
app.use('/api/vocabulary', authenticateToken, sentencesRouter);
app.use('/api/translations', authenticateToken, translationsRouter);

server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});

// Подключение к базе данных
mongoose.connect(process.env.DB_CONNECTION_STRING)
  .then(() => {
    console.log('Подключено к базе данных');

  })
  .catch((error) => {
    console.error('Ошибка при подключении к базе данных:', error);
  });

export default server