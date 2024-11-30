// src/routes/telegramRouter.ts
import express from 'express';
import telegramController from '../controllers/telegramController';
import subscriptionController from '../controllers/subscriptionController';
import checkSubscription from '../middleware/checkSubscription';

const telegramRouter = express.Router();

// Существующие маршруты
telegramRouter.post("/", telegramController.create);
telegramRouter.post("/payment-callback", subscriptionController.paymentCallback);
telegramRouter.get("/user/is-exists/:id", telegramController.user_is_exists);
telegramRouter.post("/create-user", telegramController.register_telegram_user);
telegramRouter.post("/user/save-state", telegramController.save_user_state);
telegramRouter.get("/user/get-state/:id", telegramController.get_user_state);
telegramRouter.post("/select-language-for-vocabular", telegramController.select_language_for_vocabular);
telegramRouter.post("/new-word-translate-request", telegramController.new_word_translate_request);
telegramRouter.get("/user/theme/:id", telegramController.getUserTheme);
telegramRouter.post("/user/theme", telegramController.updateUserTheme);
telegramRouter.get("/user", telegramController.getAllUsers);

// Маршруты для подписки
telegramRouter.post('/subscribe', subscriptionController.subscribe);
telegramRouter.get('/subscription-status/:userId', subscriptionController.checkSubscription);

// Пример защищенного маршрута
telegramRouter.get('/protected-route', checkSubscription, (_req, res) => {
  res.status(200).json({ message: 'Доступ разрешен' });
});

export default telegramRouter;
