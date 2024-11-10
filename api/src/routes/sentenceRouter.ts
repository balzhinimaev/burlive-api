// src/routes/sentencesRouter.ts

import express from 'express';
import { body, param, query } from 'express-validator';
import sentencesController from '../controllers/sentenceController';
import authenticateToken from '../middleware/authenticateToken';
import authorizeAdmin from '../middleware/authorizeAdmin';
import validate from '../middleware/validate'; // Мидлвара для обработки результатов валидации

const sentencesRouter = express.Router();

/**
 * @route   GET /backendapi/sentences
 * @desc    Получение всех предложений с пагинацией
 * @access  Public
 */
sentencesRouter.get(
    '/',
    [
        query('notAccepted')
            .optional()
            .isBoolean().withMessage('notAccepted должен быть булевым значением'),
        query('page')
            .optional()
            .isInt({ min: 1 }).withMessage('page должен быть целым числом больше 0'),
        query('limit')
            .optional()
            .isInt({ min: 1 }).withMessage('limit должен быть целым числом больше 0'),
    ],
    validate,
    sentencesController.getAllSentences
);

/**
 * @route   GET /backendapi/sentences/get-accepted-sentence
 * @desc    Получение предложения для перевода с наименьшим количеством наблюдателей
 * @access  Public
 */
sentencesRouter.get(
    '/get-accepted-sentence',
    sentencesController.getAcceptedSentence
);

/**
 * @route   GET /backendapi/sentences/get-new-sentence
 * @desc    Получение нового предложения для пользователя
 * @access  Private
 */
sentencesRouter.get(
    '/get-new-sentence',
    authenticateToken,
    sentencesController.getNewSentence
);

/**
 * @route   POST /backendapi/sentences
 * @desc    Создание одного нового предложения
 * @access  Private
 */
sentencesRouter.post(
    '/',
    authenticateToken,
    [
        body('text')
            .isString().withMessage('Текст предложения должен быть строкой')
            .isLength({ min: 1 }).withMessage('Текст предложения не может быть пустым'),
        body('language')
            .isString().withMessage('Язык должен быть строкой')
            .isLength({ min: 2 }).withMessage('Язык должен содержать минимум 2 символа'),
    ],
    validate,
    sentencesController.createSentence
);

/**
 * @route   POST /backendapi/sentences/create-sentences-multiple
 * @desc    Создание нескольких предложений
 * @access  Private
 */
sentencesRouter.post(
    '/create-sentences-multiple',
    authenticateToken,
    [
        body('sentences')
            .isArray({ min: 1 }).withMessage('Поле sentences должно быть непустым массивом'),
        body('sentences.*.text')
            .isString().withMessage('Текст предложения должен быть строкой')
            .isLength({ min: 1 }).withMessage('Текст предложения не может быть пустым'),
        body('language')
            .isString().withMessage('Язык должен быть строкой')
            .isLength({ min: 2 }).withMessage('Язык должен содержать минимум 2 символа'),
        body('ctx')
            .optional()
            .isString().withMessage('ctx должен быть строкой'),
    ],
    validate,
    sentencesController.createSentenceMultiple
);

/**
 * @route   GET /backendapi/sentences/:id
 * @desc    Получение предложения по ID
 * @access  Public
 */
sentencesRouter.get(
    '/:id',
    [
        param('id')
            .isMongoId().withMessage('id должен быть валидным ObjectId'),
    ],
    validate,
    sentencesController.getSentence
);

/**
 * @route   PUT /backendapi/sentences/:id/accept
 * @desc    Принятие предложения для перевода
 * @access  Private/Admin
 */
sentencesRouter.put(
    '/:id/accept',
    authenticateToken,
    authorizeAdmin,
    [
        param('id')
            .isMongoId().withMessage('id должен быть валидным ObjectId'),
    ],
    validate,
    sentencesController.acceptSentence
);

/**
 * @route   PUT /backendapi/sentences/:id/reject
 * @desc    Отклонение предложения
 * @access  Private/Admin
 */
sentencesRouter.put(
    '/:id/reject',
    authenticateToken,
    authorizeAdmin,
    [
        param('id')
            .isMongoId().withMessage('id должен быть валидным ObjectId'),
    ],
    validate,
    sentencesController.rejectSentence
);

/**
 * @route   DELETE /backendapi/sentences
 * @desc    Удаление нескольких предложений
 * @access  Private/Admin
 */
sentencesRouter.delete(
    '/',
    authenticateToken,
    authorizeAdmin,
    [
        body('sentences')
            .isArray({ min: 1 }).withMessage('Поле sentences должно быть непустым массивом'),
        body('sentences.*._id')
            .isMongoId().withMessage('Каждое _id должно быть валидным ObjectId'),
    ],
    validate,
    sentencesController.deleteSentences
);

export default sentencesRouter;
