import { Router } from 'express';
import { body } from 'express-validator';
import {
    createLesson,
    getAllLessons,
    getLessonById,
    updateLesson,
    deleteLesson,
    getLessonByModuleId,
    getLessonByIdByTelegram,
    addQuestion,
} from '../controllers/lessonController';
import authenticateToken from '../middleware/authenticateToken';
import authorizeAdmin from '../middleware/authorizeAdmin';
import validate from '../middleware/validate';

const router = Router();

// Создание нового урока с валидацией
router.post(
    '/',
    authenticateToken,
    authorizeAdmin, // Только администраторы могут добавлять уроки
    [
        body('title')
            .notEmpty().withMessage('Название урока обязательно')
            .isString().withMessage('Название урока должно быть строкой'),
        body('content')
            .notEmpty().withMessage('Контент урока обязателен')
            .isString().withMessage('Контент урока должен быть строкой'),
        body('moduleId')
            .notEmpty().withMessage('ID модуля обязателен')
            .isMongoId().withMessage('ID модуля должен быть валидным MongoID'),
        body('order')
            .optional()
            .isInt({ gt: 0 }).withMessage('Порядок урока должен быть положительным целым числом'),
        body('questions')
            .optional()
            .isArray().withMessage('Вопросы должны быть массивом')
            .custom((questions) => {
                for (const question of questions) {
                    if (!question.question || typeof question.question !== 'string') {
                        throw new Error('Каждый вопрос должен содержать строку "question".');
                    }
                    if (!Array.isArray(question.options) || question.options.length < 2) {
                        throw new Error('Каждый вопрос должен содержать массив с минимум двумя вариантами.');
                    }
                    if (typeof question.correct !== 'number' || question.correct < 0) {
                        throw new Error('Каждый вопрос должен содержать положительный индекс правильного ответа.');
                    }
                }
                return true;
            }),
    ],
    validate, // Обработка ошибок валидации
    createLesson
);

// Получение всех уроков
router.get('/', authenticateToken, getAllLessons);

// Получение урока по ID
router.get('/:id', authenticateToken, getLessonById);

// Получение урока по moduleID
router.post('/module/:id', authenticateToken, getLessonByModuleId);

// Просмотр урока по ID пользователем телеграмм
router.get('/:telegram_id/:id', authenticateToken, getLessonByIdByTelegram);

// Обновление урока с валидацией
router.put(
    '/:id',
    authenticateToken,
    authorizeAdmin,
    [
        body('title')
            .optional()
            .isString().withMessage('Название урока должно быть строкой'),
        body('content')
            .optional()
            .isString().withMessage('Контент урока должен быть строкой'),
        body('moduleId')
            .optional()
            .isMongoId().withMessage('ID модуля должен быть валидным MongoID'),
        body('order')
            .optional()
            .isInt({ gt: 0 }).withMessage('Порядок урока должен быть положительным целым числом'),
        body('questions')
            .optional()
            .isArray().withMessage('Вопросы должны быть массивом')
            .custom((questions) => {
                for (const question of questions) {
                    if (!question.question || typeof question.question !== 'string') {
                        throw new Error('Каждый вопрос должен содержать строку "question".');
                    }
                    if (!Array.isArray(question.options) || question.options.length < 2) {
                        throw new Error('Каждый вопрос должен содержать массив с минимум двумя вариантами.');
                    }
                    if (typeof question.correct !== 'number' || question.correct < 0) {
                        throw new Error('Каждый вопрос должен содержать положительный индекс правильного ответа.');
                    }
                }
                return true;
            }),
    ],
    validate,
    updateLesson
);

router.put(`/:id/:question_id`, authenticateToken, authorizeAdmin, addQuestion)

// Удаление урока
router.delete('/:id', authenticateToken, authorizeAdmin, deleteLesson);

export default router;
