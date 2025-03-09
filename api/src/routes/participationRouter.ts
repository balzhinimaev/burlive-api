// src/routes/participationRouter.ts
import express from 'express';
import participationController from '../controllers/participationController';
import authenticateToken from '../middleware/authenticateToken';

const router = express.Router();

// Регистрация участия пользователя в акции
router.post('/join', authenticateToken, participationController.joinPromotion);

// Получение данных участия пользователя в акции по promotionId и userId в URL
router.get(
    '/:promotionId/user/:userId',
    authenticateToken,
    participationController.getParticipation,
);

// Добавление очков (например, после выполнения задания)
router.put('/add-points', authenticateToken, participationController.addPoints);

// Получение лидерборда по акции. Для определения позиции пользователя ожидаются поля currentUserId и promotionId в теле запроса.
router.post(
    '/leaderboard',
    authenticateToken,
    participationController.getLeaderboard,
);

export default router;
