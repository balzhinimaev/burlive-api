// src/routes/modulesRouter.ts

import express from 'express';
import { body, param, query } from 'express-validator';
import moduleController from '../controllers/moduleController';
import authenticateToken from '../middleware/authenticateToken';
import authorizeAdmin from '../middleware/authorizeAdmin';
import validate from '../middleware/validate'; // Мидлвара для обработки результатов валидации

const modulesRouter = express.Router();

/**
 * @route   GET /backendapi/modules
 * @desc    Получение всех модулей с пагинацией
 * @access  Public
 */
modulesRouter.get(
    '/',
    [
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('page должен быть целым числом больше 0'),
        query('limit')
            .optional()
            .isInt({ min: 1 })
            .withMessage('limit должен быть целым числом больше 0'),
    ],
    validate,
    moduleController.getAllModules
);

/**
 * @route   GET /backendapi/modules/:id
 * @desc    Получение модуля по ID
 * @access  Public
 */
modulesRouter.get(
    '/:id',
    [
        param('id')
            .isMongoId()
            .withMessage('id должен быть валидным ObjectId'),
    ],
    validate,
    moduleController.getModuleById
);

/**
 * @route   POST /backendapi/modules
 * @desc    Создание нового модуля
 * @access  Private/Admin
 */
modulesRouter.post(
    '/',
    authenticateToken,
    authorizeAdmin,
    [
        body('title')
            .isString()
            .withMessage('Заголовок модуля должен быть строкой')
            .isLength({ min: 1 })
            .withMessage('Заголовок модуля не может быть пустым'),
        body('description')
            .isString()
            .withMessage('Описание модуля должно быть строкой')
            .isLength({ min: 1 })
            .withMessage('Описание модуля не может быть пустым'),
        body('lessons')
            .optional()
            .isArray()
            .withMessage('lessons должен быть массивом ObjectId'),
        body('lessons.*')
            .isMongoId()
            .withMessage('Каждый lesson должен быть валидным ObjectId'),
    ],
    validate,
    moduleController.createModule
);

/**
 * @route   PUT /backendapi/modules/:id
 * @desc    Обновление модуля по ID
 * @access  Private/Admin
 */
modulesRouter.put(
    '/:id',
    authenticateToken,
    authorizeAdmin,
    [
        param('id')
            .isMongoId()
            .withMessage('id должен быть валидным ObjectId'),
        body('title')
            .optional()
            .isString()
            .withMessage('Заголовок модуля должен быть строкой')
            .isLength({ min: 1 })
            .withMessage('Заголовок модуля не может быть пустым'),
        body('description')
            .optional()
            .isString()
            .withMessage('Описание модуля должно быть строкой')
            .isLength({ min: 1 })
            .withMessage('Описание модуля не может быть пустым'),
        body('lessons')
            .optional()
            .isArray()
            .withMessage('lessons должен быть массивом ObjectId'),
        body('lessons.*')
            .isMongoId()
            .withMessage('Каждый lesson должен быть валидным ObjectId'),
    ],
    validate,
    moduleController.updateModule
);

/**
 * @route   DELETE /backendapi/modules/:id
 * @desc    Удаление модуля по ID
 * @access  Private/Admin
 */
modulesRouter.delete(
    '/:id',
    authenticateToken,
    authorizeAdmin,
    [
        param('id')
            .isMongoId()
            .withMessage('id должен быть валидным ObjectId'),
    ],
    validate,
    moduleController.deleteModule
);

export default modulesRouter;
