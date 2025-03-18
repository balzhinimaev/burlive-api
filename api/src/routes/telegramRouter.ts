// src/routes/telegramRouter.ts
import express from 'express';
import telegramController from '../controllers/telegramController';
import subscriptionController from '../controllers/subscriptionController';
import checkSubscription from '../middleware/checkSubscription';
import refferalController from '../controllers/refferalController';

const telegramRouter = express.Router();

telegramRouter.get("/user/is-exists/:id", telegramController.user_is_exists);
telegramRouter.get("/user/get-state/:id", telegramController.get_user_state);
telegramRouter.get("/user/theme/:id", telegramController.getUserTheme);
telegramRouter.get(
    '/user/referral/:id',
    telegramController.getUserReferralInfo,
);
telegramRouter.get("/leaderboard", telegramController.getLeaderboard);
telegramRouter.get("/user", telegramController.getAllUsers);


telegramRouter.post("/payment-callback", subscriptionController.paymentCallback);

// Запрос на проверку подписки на канал пользователя по telegram id
telegramRouter.post("/check-subscription", refferalController.checkSubscription);

telegramRouter.post("/create-user", telegramController.register_telegram_user);
telegramRouter.post("/select-language-for-vocabular", telegramController.select_language_for_vocabular);
telegramRouter.post("/new-word-translate-request", telegramController.new_word_translate_request);

telegramRouter.post('/user/track-referral', telegramController.trackReferral);
telegramRouter.post("/user/save-state", telegramController.save_user_state);
telegramRouter.post("/user/save-user-action", telegramController.save_user_action);
telegramRouter.post("/user/theme", telegramController.updateUserTheme);
telegramRouter.post("/user/photo", telegramController.updateUserPhotoUrl);
telegramRouter.post("/user/update-question-postition", telegramController.updateQuestionPosition);

telegramRouter.post("/block", telegramController.blockUser);
telegramRouter.post("/", telegramController.create);

telegramRouter.put("/user/save-phone", telegramController.save_user_phone);


// Маршруты для подписки
telegramRouter.post('/subscribe', subscriptionController.subscribe);
telegramRouter.get('/subscription-status/:userId', subscriptionController.checkSubscription);

// Пример защищенного маршрута
telegramRouter.get('/protected-route', checkSubscription, (_req, res) => {
  res.status(200).json({ message: 'Доступ разрешен' });
});

export default telegramRouter;
