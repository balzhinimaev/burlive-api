// src/routes/levelRoutes.ts

import { Router } from 'express';
import { body } from 'express-validator';
import {
    createLevel,
    getAllLevels,
    getLevelById,
    updateLevel,
    deleteLevel,
} from '../controllers/levelController';
import authenticateToken from '../middleware/authenticateToken';
import authorizeAdmin from '../middleware/authorizeAdmin'; // <-- Импорт мидлвары
import validate from '../middleware/validate';
const router = Router();

// Создание нового уровня с валидацией
router.post(
    '/',
    authenticateToken,
    authorizeAdmin, // Только администраторы могут создавать уровни
    [
        body('title')
            .notEmpty().withMessage('Название уровня обязательно')
            .isString().withMessage('Название уровня должно быть строкой'),
        body('description')
            .optional()
            .isString().withMessage('Описание уровня должно быть строкой'),
        body('order')
            .notEmpty().withMessage('Порядок уровня обязателен')
            .isInt({ gt: 0 }).withMessage('Порядок уровня должен быть положительным целым числом'),
    ],
    validate, // Мидлвара для обработки ошибок валидации
    createLevel
);

// Получение всех уровней
router.get('/', authenticateToken, getAllLevels);

// Получение уровня по ID
router.get('/:id', authenticateToken, getLevelById);

// Обновление уровня с валидацией
router.put(
    '/:id',
    authenticateToken,
    authorizeAdmin,
    [
        body('title')
            .optional()
            .isString().withMessage('Название уровня должно быть строкой'),
        body('description')
            .optional()
            .isString().withMessage('Описание уровня должно быть строкой'),
        body('order')
            .optional()
            .isInt({ gt: 0 }).withMessage('Порядок уровня должен быть положительным целым числом'),
    ],
    validate,
    updateLevel
);

// Удаление уровня
router.delete('/:id', authenticateToken, authorizeAdmin, deleteLevel);

export default router;
