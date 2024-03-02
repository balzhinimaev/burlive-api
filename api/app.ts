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
import dialogsRouter from './routes/dialogsRouter';
import { DialogModel } from './models/Dialog';

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(cors());
app.use(bodyParser.json());
app.use('/api/users', userRouter);
app.use('/api/dialect', authenticateToken, dialectRouter);
app.use('/api/sentences', authenticateToken, sentencesRouter);
app.use('/api/vocabulary', authenticateToken, sentencesRouter);
app.use('/api/translations', authenticateToken, translationsRouter);
app.use('/api/dialogs', authenticateToken, dialogsRouter);

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

  // (async () => {
  //   const dialogs = await DialogModel.find({})
  //   let data = []
  //   for (let i = 0; i < dialogs.length; i++) {
  //     const messagesLength = dialogs[i].messages.length
  //     let dialogData = { ...dialogs[i].toObject(), _id: undefined } // Create a new object without _id
  //     for (let z = 0; z < messagesLength; z++) {
  //       const message = dialogs[i].messages[z]
  //       console.log(message)
  //     }
  //     data.push(dialogData)
  //   }

  //   // Writing data to input.jsonl
  //   const jsonString = data.map((obj) => JSON.stringify(obj, null, 0).replace(/\n/g, '')).join('');
  //   fs.writeFileSync('input.jsonl', jsonString);
  // })();
export default server