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
  import testRouter from './routes/testRoutes';

  // Новые маршруты для системы обучения
  import levelRoutes from './routes/levelRoutes';
  import moduleRoutes from './routes/modulesRouter';
  import themeRouter from './routes/themeRouter';
  import bodyParser from 'body-parser';
  import logger from './utils/logger';
  import subscriptionController from './controllers/subscriptionController';
import participationRouter from './routes/participationRouter';
import promotionRouter from './routes/promotionRouter';

  const app = express();
  const server = createServer(app);
  // const io = new Server(server);

  // Проверка необходимых переменных окружения
  if ((!process.env.YOOKASSA_SHOP_ID || !process.env.YOOKASSA_SECRET_KEY) && process.env.MODE === 'PROD') {
    console.error('YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY должны быть установлены в переменных окружения.');
    process.exit(1);
  } else if ((!process.env.YOOKASSA_SHOP_ID_DEV || !process.env.YOOKASSA_SECRET_KEY_DEV) && process.env.MODE === 'DEV') {
    console.error('YOOKASSA_SHOP_ID_DEV и YOOKASSA_SECRET_KEY_DEV должны быть установлены в переменных окружения.');
    process.exit(1);
  }

  app.use(cors());

  // // Middleware для обработки сырых данных вебхука
  app.post('/telegram/payment-callback', bodyParser.raw({ type: 'application/json' }));

  app.use(bodyParser.json());
  app.use("", async (req, res, next) => {
    // console.log(req)
    let body = req.body
    if (body.type) {
      if (body.type === 'notification') {
        await subscriptionController.paymentCallback(req, res, next)
      }
    }
    next()
  })
  app.use('/users', userRouter);
  app.use('/promotion', promotionRouter);
  app.use('/participation', participationRouter);
  app.use('/dialect', authenticateToken, dialectRouter);
  app.use('/sentences', authenticateToken, sentencesRouter);
  app.use('/vocabulary', authenticateToken, vocabularyRouter);
  app.use('/translations', authenticateToken, translationsRouter);
  app.use('/telegram', authenticateToken, telegramRouter);

  // Новые маршруты для системы обучения
  app.use('/levels', authenticateToken, levelRoutes);
  app.use('/modules', authenticateToken, moduleRoutes);
  app.use('/lessons', authenticateToken, lessonsRouter);
  app.use('/themes', authenticateToken, themeRouter);

  app.use(`/questions`, authenticateToken, questionRouter)
  app.use(`/test`, authenticateToken, testRouter);
  app.post(`/pay-cb`, (req, _res) => {
    try {
      logger.info(`Получен успешный платеж`)
      console.log(req.body)
      const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      console.log(`IP адрес отправителя: ${ip}`);

    } catch (error) {
      logger.error(error)
    }
  })
  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  };

  // Обработчик ошибок
  app.use(errorHandler);

  server.listen(PORT, () => {
    console.log(`Сервер запущен ${PORT}`);
  });

  console.log(process.env.MONGO_URL)
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