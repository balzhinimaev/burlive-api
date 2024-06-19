import express from 'express';
import { createServer } from 'node:http';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import { Server } from "socket.io";
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config(); // Загружаем переменные окружения из файла .env
const PORT = process.env.port || 3000

import userRouter from './routes/userRouter';
import authenticateToken from './middleware/authenticateToken';
import sentencesRouter from './routes/sentenceRouter';
import translationsRouter from './routes/translationRouter';
import dialectRouter from './routes/dialectRouter';
import financeRouter from './routes/financeRouter';
import dialogsRouter from './routes/dialogsRouter';
import vocabularyRouter from './routes/vocabularyRouter';
import telegramRouter from './routes/telegramRouter';
import payRouter from './routes/payRouter';


const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(cors());
app.use(bodyParser.json());
app.use('/backendapi/users', userRouter);
app.use('/backendapi/dialect', authenticateToken, dialectRouter);
app.use('/backendapi/sentences', authenticateToken, sentencesRouter);
app.use('/backendapi/vocabulary', authenticateToken, vocabularyRouter);
app.use('/backendapi/translations', authenticateToken, translationsRouter);
app.use('/backendapi/dialogs', authenticateToken, dialogsRouter);
app.use('/backendapi/telegram', authenticateToken, telegramRouter);
app.use('/backendapi/finance', financeRouter);
app.use('/backendapi/pay-cb', (req, res) => {
  console.log(req.body)
  console.log(req.params)
});

server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});

io.on('connection', (socket) => {
  console.log('a user connected');
});

// Подключение к базе данных
mongoose.connect(<string>process.env.DB_CONNECTION_STRING, {
  dbName: 'burlive'
})
  .then(() => {
    console.log('Подключено к базе данных');
  })
  .catch((error) => {
    console.error('Ошибка при подключении к базе данных:', error);
  });

export default server