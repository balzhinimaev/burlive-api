// src/routes/userRouter.ts

import express from 'express';
import { body, param } from 'express-validator';
import userController from '../controllers/userController';
import authenticateToken from '../middleware/authenticateToken';
import authorizeAdmin from '../middleware/authorizeAdmin';
import validate from '../middleware/validate'; // Мидлвара для обработки результатов валидации

const userRouter = express.Router();

/**
 * @route   POST /backendapi/users/register
 * @desc    Регистрация нового пользователя
 * @access  Public
 */
userRouter.post(
    '/register',
    [
        body('email')
            .isEmail().withMessage('Некорректный формат email')
            .isLength({ max: 255 }).withMessage('Длина email превышает максимально допустимую'),
        body('password')
            .isLength({ min: 8 }).withMessage('Длина пароля должна быть не менее 8 символов'),
        body('username')
            .optional()
            .isString().withMessage('Username должен быть строкой')
            .isLength({ min: 3 }).withMessage('Username должен содержать минимум 3 символа'),
    ],
    validate, // Обработка ошибок валидации
    userController.register
);

/**
 * @route   POST /backendapi/users/login
 * @desc    Вход пользователя
 * @access  Public
 */
userRouter.post(
    '/login',
    [
        body('password')
            .notEmpty().withMessage('Пароль обязателен'),
        body('email')
            .optional()
            .isEmail().withMessage('Некорректный формат email'),
        body('username')
            .optional()
            .isString().withMessage('Username должен быть строкой'),
    ],
    validate,
    userController.login
);

/**
 * @route   PUT /backendapi/users/update-user-data
 * @desc    Обновление данных пользователя
 * @access  Private
 */
userRouter.put(
    '/update-user-data',
    authenticateToken,
    [
        body('firstName')
            .optional()
            .isString().withMessage('Имя должно быть строкой'),
        body('lastName')
            .optional()
            .isString().withMessage('Фамилия должна быть строкой'),
    ],
    validate,
    userController.updateName
);

/**
 * @route   GET /backendapi/users/getMe
 * @desc    Получение данных текущего пользователя
 * @access  Private
 */
userRouter.get(
    '/getMe',
    authenticateToken,
    userController.getMe
);

/**
 * @route   GET /backendapi/users/public/:username
 * @desc    Получение публичных данных пользователя по username
 * @access  Public
 */
userRouter.get(
    '/public/:username',
    [
        param('username')
            .isString().withMessage('Username должен быть строкой')
            .isLength({ min: 3 }).withMessage('Username должен содержать минимум 3 символа'),
    ],
    validate,
    userController.getPublicUserByUsername
);

/**
 * @route   GET /backendapi/users/:id
 * @desc    Получение пользователя по ID
 * @access  Private (можно ограничить доступ администраторами)
 */
userRouter.get(
    '/:id',
    authenticateToken,
    authorizeAdmin, // Если доступ только для администраторов
    [
        param('id')
            .custom((value) => {
                // Проверка, является ли строка валидным ObjectId
                return /^[0-9a-fA-F]{24}$/.test(value);
            }).withMessage('Неверный формат ID'),
    ],
    validate,
    userController.getUser
);

/**
 * @route   GET /backendapi/users
 * @desc    Получение публичных данных всех пользователей
 * @access  Private (можно ограничить доступ администраторами)
 */
userRouter.get(
    '/',
    authenticateToken,
    authorizeAdmin, // Если доступ только для администраторов
    userController.getAllPublicUsers
);

/**
 * @route   PUT /backendapi/users/set-profile-photo
 * @desc    Установка фотографии профиля пользователя
 * @access  Private
 */
userRouter.put(
    '/set-profile-photo',
    authenticateToken,
    [
        body('userProfilePhoto')
            .isURL().withMessage('Аватар должен быть валидным URL'),
    ],
    validate,
    userController.setProfilePhoto
);

export default userRouter;
