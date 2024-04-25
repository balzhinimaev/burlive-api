import express, { Request, Response } from 'express';
import { createServer } from 'node:http';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import http from 'http'; // Импортируем модуль http
import { Server } from "socket.io";
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config(); // Загружаем переменные окружения из файла .env
import * as fs from 'fs';
const PORT = process.env.port || 3000

import userRouter from './routes/userRouter';
import authenticateToken from './middleware/authenticateToken';
import sentencesRouter from './routes/sentenceRouter';
import translationsRouter from './routes/translationRouter';
import dialectRouter from './routes/dialectRouter';
import financeRouter from './routes/financeRouter';
import dialogsRouter from './routes/dialogsRouter';


const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(cors());
app.use(bodyParser.json());
app.use('/backendapi/users', userRouter);
app.use('/backendapi/dialect', authenticateToken, dialectRouter);
app.use('/backendapi/sentences', sentencesRouter);
app.use('/backendapi/vocabulary', authenticateToken, sentencesRouter);
app.use('/backendapi/translations', authenticateToken, translationsRouter);
app.use('/backendapi/dialogs', authenticateToken, dialogsRouter);
app.use('/backendapi/finance', financeRouter);

server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});

io.on('connection', (socket) => {
  console.log('a user connected');
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