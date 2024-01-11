import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';

import dotenv from 'dotenv';
dotenv.config(); // Загружаем переменные окружения из файла .env

import userRouter from './routes/userRouter';

const app = express();
app.use(bodyParser.json());
app.use('/api/users', userRouter);

const port = process.env.PORT || 3000;

// Подключение к базе данных
mongoose.connect(process.env.DB_CONNECTION_STRING)
  .then(() => {
    console.log('Подключено к базе данных');
    app.listen(port, () => {
      console.log(`Сервер запущен на порту ${port}`);
    });
  })
  .catch((error) => {
    console.error('Ошибка при подключении к базе данных:', error);
  });


export default app