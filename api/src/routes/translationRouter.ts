// src/routes/translationsRouter.ts

import express from 'express';
import { body, param } from 'express-validator';
import translationController from '../controllers/translationController';
import authenticateToken from '../middleware/authenticateToken';
import authorizeAdmin from '../middleware/authorizeAdmin';
import validate from '../middleware/validate'; // Мидлвара для обработки результатов валидации

const translationsRouter = express.Router();

/**
 * @route   GET /backendapi/translations
 * @desc    Получение всех переводов
 * @access  Public
 */
translationsRouter.get(
    '/',
    translationController.getAllTranslations
);

/**
 * @route   GET /backendapi/translations/get-suggested-translation
 * @desc    Получение предложенного перевода
 * @access  Public
 */
translationsRouter.get(
    '/get-suggested-translation',
    translationController.getSuggestedTranslation
);

/**
 * @route   POST /backendapi/translations
 * @desc    Создание нового перевода
 * @access  Private
 */
translationsRouter.post(
    '/',
    authenticateToken,
    [
        body('text')
            .isString().withMessage('Текст перевода должен быть строкой')
            .isLength({ min: 1 }).withMessage('Текст перевода не может быть пустым'),
        body('language')
            .isString().withMessage('Язык должен быть строкой')
            .isLength({ min: 2 }).withMessage('Язык должен содержать минимум 2 символа'),
        body('sentenceId')
            .isMongoId().withMessage('sentenceId должен быть валидным ObjectId'),
        body('dialect')
            .optional()
            .isString().withMessage('Диалект должен быть строкой'),
    ],
    validate,
    translationController.createTranslation
);

/**
 * @route   PUT /backendapi/translations/:id/status
 * @desc    Обновление статуса перевода
 * @access  Private/Admin
 */
translationsRouter.put(
    '/:id/status',
    authenticateToken,
    authorizeAdmin,
    [
        param('id')
            .isMongoId().withMessage('id должен быть валидным ObjectId'),
        body('status')
            .isIn(['processing', 'accepted', 'rejected']).withMessage('Неверный статус'),
        body('contributorId')
            .optional()
            .isMongoId().withMessage('contributorId должен быть валидным ObjectId'),
    ],
    validate,
    translationController.updateStatus
);

/**
 * @route   PUT /backendapi/translations/:id/accept
 * @desc    Принятие перевода
 * @access  Private/Admin
 */
translationsRouter.put(
    '/:id/accept',
    authenticateToken,
    authorizeAdmin,
    [
        param('id')
            .isMongoId().withMessage('id должен быть валидным ObjectId'),
    ],
    validate,
    translationController.acceptTranslation
);

/**
 * @route   PUT /backendapi/translations/:id/reject
 * @desc    Отклонение перевода
 * @access  Private/Admin
 */
translationsRouter.put(
    '/:id/reject',
    authenticateToken,
    authorizeAdmin,
    [
        param('id')
            .isMongoId().withMessage('id должен быть валидным ObjectId'),
    ],
    validate,
    translationController.rejectTranslation
);

/**
 * @route   POST /backendapi/translations/:id/vote
 * @desc    Голосование за перевод
 * @access  Private
 */
translationsRouter.post(
    '/:id/vote',
    authenticateToken,
    [
        param('id')
            .isMongoId().withMessage('id должен быть валидным ObjectId'),
        body('isUpvote')
            .isBoolean().withMessage('isUpvote должен быть булевым значением'),
    ],
    validate,
    translationController.vote
);

export default translationsRouter;
