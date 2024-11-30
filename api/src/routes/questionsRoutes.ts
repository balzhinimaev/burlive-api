// routes/questionRouter.ts

import { Router } from 'express';
import { body } from 'express-validator';
import {
    createQuestion,
    getQuestionById,
    updateQuestion,
    deleteQuestion,
    getAllQuestions,
} from '../controllers/questionController';
import authenticateToken from '../middleware/authenticateToken';
import authorizeAdmin from '../middleware/authorizeAdmin';
import validate from '../middleware/validate';

const router = Router();

// Создание нового вопроса
router.post(
    '/',
    authenticateToken,
    authorizeAdmin,
    [
        body('question').notEmpty().withMessage('Текст вопроса обязателен').isString(),
        body('options').isArray({ min: 2 }).withMessage('Должно быть минимум два варианта ответа'),
        body('correct').isInt({ min: 0 }).withMessage('Индекс правильного ответа должен быть положительным числом'),
        body('type').notEmpty().withMessage('Тип вопроса обязателен').isString(),
        body('explanation').notEmpty().withMessage('Объяснение ответа обязателен').isString(),
        body('lessonId').optional().isMongoId().withMessage('ID урока должен быть валидным MongoID'),
    ],
    validate,
    createQuestion
);

// Получение вопроса по ID
router.get('/:questionId', authenticateToken, getQuestionById);

// Обновление вопроса
router.put(
    '/:questionId',
    authenticateToken,
    authorizeAdmin,
    [
        body('question').optional().isString(),
        body('options').optional().isArray({ min: 2 }),
        body('correct').optional().isInt({ min: 0 }),
        body('type').optional().isString(),
    ],
    validate,
    updateQuestion
);

// Удаление вопроса
router.delete('/:questionId', authenticateToken, authorizeAdmin, deleteQuestion);

// Получение всех вопросов (опционально)
router.get('/', authenticateToken, authorizeAdmin, getAllQuestions);

export default router;
