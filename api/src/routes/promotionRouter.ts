// src/routes/promotionRouter.ts
import express from 'express';
import promotionController from '../controllers/promotionController';
import authenticateToken from '../middleware/authenticateToken';

const router = express.Router();

// Создание новой акции (например, доступно только администраторам)
router.post('/create', authenticateToken, promotionController.createPromotion);

// Получение текущей активной акции (публичный или защищенный, по необходимости)
router.get('/active', promotionController.getActivePromotion);

// Завершение акции (административный маршрут)
router.put('/end/:id', authenticateToken, promotionController.endPromotion);

export default router;
