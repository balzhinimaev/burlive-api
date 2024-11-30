import express, { ErrorRequestHandler } from 'express';
import { createServer } from 'node:http';
import mongoose from 'mongoose';
// import { Server } from "socket.io";
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config(); // Загружаем переменные окружения из файла .env
const PORT = process.env.port || 3000

import userRouter from './routes/userRouter';
import authenticateToken from './middleware/authenticateToken';
import sentencesRouter from './routes/sentenceRouter';
import translationsRouter from './routes/translationRouter';
import dialectRouter from './routes/dialectRouter';
import vocabularyRouter from './routes/vocabularyRouter';
import telegramRouter from './routes/telegramRouter';
import lessonsRouter from './routes/lessonsRoutes';
import questionRouter from './routes/questionsRoutes';

// Новые маршруты для системы обучения
import levelRoutes from './routes/levelRoutes';
import moduleRoutes from './routes/modulesRouter';
import themeRouter from './routes/themeRouter';
import bodyParser from 'body-parser';

const app = express();
const server = createServer(app);
// const io = new Server(server);

// Проверка необходимых переменных окружения
if (!process.env.YOOKASSA_SHOP_ID_PROD || !process.env.YOOKASSA_SECRET_KEY_PROD) {
  console.error('YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY должны быть установлены в переменных окружения.');
  process.exit(1);
}

app.use(cors());

// // Middleware для обработки сырых данных вебхука
// app.post('/backendapi/telegram/payment-callback', bodyParser.raw({ type: 'application/json' }));

app.use(bodyParser.json());
app.use('/backendapi/users', userRouter);
app.use('/backendapi/dialect', authenticateToken, dialectRouter);
app.use('/backendapi/sentences', authenticateToken, sentencesRouter);
app.use('/backendapi/vocabulary', authenticateToken, vocabularyRouter);
app.use('/backendapi/translations', authenticateToken, translationsRouter);
app.use('/backendapi/telegram', telegramRouter);

// Новые маршруты для системы обучения
app.use('/backendapi/levels', authenticateToken, levelRoutes);
app.use('/backendapi/modules', authenticateToken, moduleRoutes);
app.use('/backendapi/lessons', authenticateToken, lessonsRouter);
app.use('/backendapi/themes', authenticateToken, themeRouter);

app.use(`/backendapi/questions`, authenticateToken, questionRouter)

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Внутренняя ошибка сервера' });
};

// Обработчик ошибок
app.use(errorHandler);

server.listen(PORT, () => {
  console.log(`Сервер запущен`);
});

// Подключение к базе данных
mongoose.connect(<string>process.env.MONGO_URL, {
  dbName: 'burlive'
})
  .then(() => {
    console.log("Подключено к базе данных");
  })
  .catch((error) => {
    console.error('Ошибка при подключении к базе данных:', error);
  });

// export { agenda }
export default server