// src/routes/telegramRouter.ts
import express from 'express';

// --- Импортируем КОНТРОЛЛЕРЫ ---
import { telegramController } from '../controllers/telegramController';
// import subscriptionController from '../controllers/subscriptionController'; // Раскомментировать, если используется
// import refferalController from '../controllers/refferalController'; // Раскомментировать, если используется

// --- Импортируем Middleware (если нужно) ---
// import checkSubscription from '../middleware/checkSubscription'; // Раскомментировать, если используется

const telegramRouter = express.Router();

// ==================================================
// Маршруты, связанные с ПОЛЬЗОВАТЕЛЯМИ TELEGRAM
// (используют telegramController)
// ==================================================

// --- GET-запросы ---
telegramRouter.get('/users', telegramController.getAllUsers); // Получить список пользователей
telegramRouter.get('/users/exists/:id', telegramController.userExists); // Проверить существование пользователя (переименован для ясности)
// telegramRouter.get('/users/:userId/profile', telegramController.userExists); // Алиас или замена для userExists, если нужно получить полный профиль
telegramRouter.get('/users/:id/state', telegramController.getUserState); // Получить состояние пользователя
telegramRouter.get('/users/:id/theme', telegramController.getUserTheme); // Получить тему пользователя (убрано 'user/' для единообразия)
telegramRouter.get('/users/:userId/page', telegramController.getPage); // Получить тему пользователя (убрано 'user/' для единообразия)
telegramRouter.get('/users/:userId/language', telegramController.getLanguage); // Получить тему пользователя (убрано 'user/' для единообразия)
telegramRouter.get(
    '/users/:id/referral-info',
    telegramController.getUserReferralInfo,
);
telegramRouter.get('/leaderboard', telegramController.getLeaderboard); // Получить таблицу лидеров
telegramRouter.get(
    '/processed-word/:userId',
    telegramController.getProcessedWord,
); // Получить таблицу лидеров

// --- POST-запросы ---
telegramRouter.post('/users', telegramController.registerTelegramUser); // Регистрация нового пользователя (переименован для ясности)
telegramRouter.post(
    '/users/:userId/link-referral',
    telegramController.linkReferral,
); // Привязка реферала к пользователю (новый/правильный маршрут)
telegramRouter.post('/users/state', telegramController.saveUserState); // Сохранение состояния пользователя (ID передается в body)
telegramRouter.post('/users/action', telegramController.saveUserAction); // Сохранение действия пользователя (ID передается в body)
telegramRouter.post('/users/theme', telegramController.updateUserTheme); // Обновление темы (ID в body или params)
telegramRouter.post('/users/photo', telegramController.updateUserPhotoUrl); // Обновление фото (ID в body или params)
telegramRouter.post(
    '/users/question-position',
    telegramController.updateQuestionPosition,
); // Обновление позиции вопроса (ID в body)
telegramRouter.post(
    '/users/vocab-language',
    telegramController.selectLanguageForVocabular,
); // Выбор языка словаря (ID в body, переименован)
telegramRouter.post('/users/block', telegramController.blockUser); // Блокировка пользователя (ID в body или params)

// --- PUT/PATCH-запросы (для обновлений) ---
// Использовать PUT или PATCH для обновлений более семантически верно
telegramRouter.put('/users/:userId/phone', telegramController.saveUserPhone); // Обновление телефона (ID из URL)
telegramRouter.put(
    '/users/:userId/set-language',
    telegramController.setLanuage,
); // Обновление телефона (ID из URL)
telegramRouter.put(
    '/users/:userId/proccess-word-id',
    telegramController.proccessWordId,
); // Обновление телефона (ID из URL)
telegramRouter.put(
    '/users/:userId/current-page',
    telegramController.currentPage,
);
telegramRouter.patch(
    '/users/:userId/profile',
    telegramController.updateUserProfile,
); // Частичное обновление профиля (ID из URL) - ИСПОЛЬЗУЕТСЯ ЛИ ЭТОТ МЕТОД? Если нет, то можно убрать

// --- УДАЛЕННЫЕ/ПЕРЕИМЕНОВАННЫЕ/УСТАРЕВШИЕ МАРШРУТЫ ---
// telegramRouter.post("/create-user", telegramController.register_telegram_user); // Заменен на POST /users
// telegramRouter.get("/user/is-exists/:id", telegramController.user_is_exists); // Заменен на GET /users/exists/:id
// telegramRouter.get("/user/get-state/:id", telegramController.get_user_state); // Заменен на GET /users/:id/state
// telegramRouter.get("/user/theme/:id", telegramController.getUserTheme); // Заменен на GET /users/:id/theme
// telegramRouter.get('/user/referral/:id', telegramController.getUserReferralInfo); // Заменен на GET /users/:id/referral-info
// telegramRouter.get("/user", telegramController.getAllUsers); // Заменен на GET /users
// telegramRouter.post("/select-language-for-vocabular", telegramController.select_language_for_vocabular); // Заменен на POST /users/vocab-language
// telegramRouter.post("/user/save-state", telegramController.save_user_state); // Заменен на POST /users/state
// telegramRouter.post("/user/save-user-action", telegramController.save_user_action); // Заменен на POST /users/action
// telegramRouter.post("/user/theme", telegramController.updateUserTheme); // Заменен на POST /users/theme
// telegramRouter.post("/user/photo", telegramController.updateUserPhotoUrl); // Заменен на POST /users/photo
// telegramRouter.post("/user/update-question-postition", telegramController.updateQuestionPosition); // Заменен на POST /users/question-position
// telegramRouter.post("/block", telegramController.blockUser); // Заменен на POST /users/block
// telegramRouter.put("/user/save-phone", telegramController.save_user_phone); // Заменен на PUT /users/:userId/phone
// telegramRouter.post('/user/track-referral', telegramController.trackReferral); // Удален, используется POST /users/:userId/link-referral

// ==================================================
// Маршруты, связанные с ДИАЛОГАМИ (DialogModel)
// ==================================================
// Используют методы, НЕ связанные с TelegramUserService
telegramRouter.post('/dialogs', telegramController.createDialog); // Создать новый диалог
telegramRouter.get('/dialogs', telegramController.getAllDialogs); // Получить все диалоги (если нужно)

// ==================================================
// Маршруты, связанные с ПОДПИСКАМИ, ПЛАТЕЖАМИ и РЕФЕРАЛАМИ (внешними?)
// (Используют другие контроллеры)
// ==================================================

// --- Раскомментируйте и адаптируйте, если эти контроллеры и маршруты используются ---
/*
// Обратный вызов платежной системы
telegramRouter.post("/payment-callback", subscriptionController.paymentCallback);

// Запрос на проверку подписки на канал пользователя по telegram id (внешний сервис?)
telegramRouter.post("/check-channel-subscription", refferalController.checkSubscription);

// Маршруты для управления подписками внутри вашего приложения
telegramRouter.post('/subscribe', subscriptionController.subscribe); // Начать процесс подписки
telegramRouter.get('/subscription-status/:userId', subscriptionController.checkSubscription); // Проверить статус подписки

// Пример защищенного маршрута
telegramRouter.get('/protected-route', checkSubscription, (_req, res) => {
  res.status(200).json({ message: 'Доступ разрешен' });
});
*/

// --- ЗАГЛУШКА ДЛЯ paymentCallback, если он не используется ---
// Если реального контроллера для платежей нет, но маршрут нужен, можно оставить так:
telegramRouter.post('/payment-callback', telegramController.paymentCb);

export default telegramRouter;
