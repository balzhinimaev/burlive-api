// src/controllers/telegramController.ts

import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose'; // Нужен для проверки ObjectId
import dotenv from 'dotenv';

// --- Импорты сервиса и зависимостей, НЕ ИСПОЛЬЗУЕМЫХ напрямую в контроллере ---
import { telegramUserServiceInstance as telegramService } from '../compositionRoot'; // Импортируем готовый экземпляр СЕРВИСА
import logger from '../utils/logger'; // Логгер нужен в контроллере для логов самого контроллера
import { DialogModel } from '../models/Dialog'; // Модель, НЕ управляемая через TelegramUserService
import TelegramUserState from '../models/Telegram/UserState'; // Модель, НЕ управляемая через TelegramUserService
import TelegramUserActionModel from '../models/Telegram/UserAction'; // Модель, НЕ управляемая через TelegramUserService

// --- Импорты для обработки ошибок ---
import {
    UserExistsError,
    UserNotFoundError,
    ValidationError,
    DatabaseError,
    ConfigurationError,
    LevelUpdateError,
} from '../errors/customErrors';
import { RegisterUserDTO } from '../services/telegram/telegramUserService'; // Импорт DTO, если нужен для типизации в контроллере

dotenv.config();

// --- Хелпер для обработки ошибок сервиса в контексте HTTP ---
// ВАЖНО: Эта функция ТЕПЕРЬ не возвращает результат res.json(), а просто вызывает его.
const handleServiceError = (
    error: unknown, // Используем unknown для большей безопасности типов
    res: Response,
    operation: string = 'operation', // Добавим название операции для логов
): void => {
    // Возвращаемый тип void
    // Логируем ошибку с контекстом операции
    logger.error(`Error during ${operation}:`, {
        message: error instanceof Error ? error.message : String(error),
        errorObject: error,
    });

    if (error instanceof UserNotFoundError) {
        res.status(404).json({ message: error.message });
        return; // Выходим после отправки ответа
    }
    if (error instanceof UserExistsError) {
        res.status(409).json({ message: error.message }); // 409 Conflict
        return; // Выходим
    }
    if (error instanceof ValidationError) {
        res.status(400).json({ message: error.message });
        return; // Выходим
    }
    if (error instanceof ConfigurationError) {
        res.status(500).json({ message: error.message });
        return; // Выходим
    }
    if (error instanceof LevelUpdateError) {
        res.status(500).json({
            message: `Level update failed: ${error.message}`,
        });
        return; // Выходим
    }
    if (error instanceof DatabaseError) {
        res.status(500).json({ message: `Database error: ${error.message}` });
        return; // Выходим
    }

    // Обработка других стандартных ошибок JavaScript
    if (error instanceof Error) {
        res.status(500).json({
            message: `An unexpected error occurred: ${error.message}`,
        });
        return; // Выходим
    }

    // Если это вообще не объект Error
    res.status(500).json({ message: 'An unknown server error occurred' });
    // Неявный выход
};

/**
 * Класс контроллера для обработки HTTP запросов, связанных с пользователями Telegram.
 */
class TelegramController {
    // Используем готовый экземпляр сервиса, внедренный через compositionRoot
    private userService = telegramService;

    // --- МЕТОДЫ КОНТРОЛЛЕРА ---

    /**
     * Получает список всех пользователей (с пагинацией/фильтрацией в будущем).
     */
    getAllUsers = async (req: Request, res: Response): Promise<void> => {
        const operationName = 'getAllUsers';
        logger.info(`[${operationName}] Request received`);
        try {
            const options = {
                limit: Number(req.query.limit) || 20,
                offset: Number(req.query.offset) || 0,
                filter: {}, // Добавить парсинг фильтров
                sortBy: (req.query.sortBy as string) || 'createdAt',
                sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
            };

            const result = await this.userService.listUsers(options);

            // НЕТ return перед res.status
            res.status(200).json({
                message:
                    result.total > 0 ? 'Users retrieved' : 'No users found',
                count: result.total,
                users: result.users,
            });
        } catch (error) {
            handleServiceError(error, res, operationName);
        }
    };

    /**
     * Проверяет существование пользователя и возвращает его данные.
     */
    userExists = async (req: Request, res: Response): Promise<void> => {
        const operationName = 'userExists';
        const { id } = req.params;
        const userIdNum = Number(id);
        logger.info(`[${operationName}] Request for user ID: ${id}`);

        if (isNaN(userIdNum)) {
            logger.warn(`[${operationName}] Invalid ID format: ${id}`);
            // НЕТ return перед res.status
            res.status(400).json({ message: 'Invalid User ID format.' });
            return; // Выход из функции
        }

        try {
            const user = await this.userService.findUserById(
                userIdNum,
                undefined,
                true,
            );

            if (!user) {
                logger.info(`[${operationName}] User ID ${id} not found.`);
                // НЕТ return перед res.status
                res.status(200).json({
                    is_exists: false,
                    message: 'User does not exist',
                });
            } else {
                logger.info(`[${operationName}] User ID ${id} found.`);
                // НЕТ return перед res.status
                res.status(200).json({
                    is_exists: true,
                    message: 'User exists',
                    user: user,
                });
            }
        } catch (error) {
            handleServiceError(error, res, operationName);
        }
    };

    /**
     * Регистрирует нового пользователя Telegram.
     */
    registerTelegramUser = async (
        req: Request,
        res: Response,
    ): Promise<void> => {
        const operationName = 'registerTelegramUser';
        logger.info(`[${operationName}] Request received`);
        try {
            const {
                id,
                username,
                first_name,
                email,
                photo_url,
                referral,
                botusername,
            } = req.body;

            if (!id || typeof id !== 'number') {
                logger.warn(`[${operationName}] Missing or invalid user ID.`);
                // НЕТ return перед res.status
                res.status(400).json({
                    message: 'User ID (number) is required.',
                });
                return; // Выход
            }

            if (!botusername || typeof botusername !== 'string') {
                logger.warn(
                    `[${operationName}] Missing or invalid botusername`,
                );
                res.status(400).json({
                    message: `Bot Username is required.`,
                });
                return;
            }

            if (!first_name) {
                logger.warn(
                    `[${operationName}] Missing first_name for ID ${id}.`,
                );
                // НЕТ return перед res.status
                res.status(400).json({ message: 'first_name is required.' });
                return; // Выход
            }

            const userData: RegisterUserDTO = {
                id,
                username: username || null,
                first_name,
                email: email || null,
                photo_url: photo_url || null,
                botusername,
            };

            logger.info(
                `[${operationName}] Attempting registration for ID ${id}`,
            );
            const newUser = await this.userService.registerUser(
                userData,
                referral,
            );

            logger.info(
                `[${operationName}] User ID ${id} registered successfully with MongoID ${newUser._id}`,
            );
            // НЕТ return перед res.status
            res.status(201).json({
                message: 'User registered successfully!',
                userId: newUser.id,
                userMongoId: newUser._id,
            });
        } catch (error) {
            handleServiceError(error, res, operationName);
        }
    };

    /**
     * Обновляет профиль пользователя (основные поля).
     */
    updateUserProfile = async (req: Request, res: Response): Promise<void> => {
        const operationName = 'updateUserProfile';
        const { userId } = req.params;
        const userIdNum = Number(userId);
        const updateData = req.body;
        logger.info(`[${operationName}] Request for user ID: ${userId}`);

        if (isNaN(userIdNum)) {
            logger.warn(`[${operationName}] Invalid ID format: ${userId}`);
            // НЕТ return перед res.status
            res.status(400).json({ message: 'Invalid User ID format.' });
            return; // Выход
        }
        if (!updateData || Object.keys(updateData).length === 0) {
            logger.warn(
                `[${operationName}] Missing update data for ID ${userId}.`,
            );
            // НЕТ return перед res.status
            res.status(400).json({ message: 'Update data is required.' });
            return; // Выход
        }

        try {
            const updatedUser = await this.userService.updateUserProfile(
                userIdNum,
                updateData,
            );
            logger.info(
                `[${operationName}] User profile ${userId} updated successfully.`,
            );
            // НЕТ return перед res.status
            res.status(200).json(updatedUser);
        } catch (error) {
            handleServiceError(error, res, operationName);
        }
    };

    /**
     * Обновляет тему оформления пользователя.
     */
    updateUserTheme = async (req: Request, res: Response): Promise<void> => {
        const operationName = 'updateUserTheme';
        const userId = Number(req.body.userId);
        const { theme } = req.body;
        logger.info(
            `[${operationName}] Request for user ID: ${userId} to theme '${theme}'`,
        );

        if (isNaN(userId)) {
            logger.warn(`[${operationName}] Invalid ID format.`);
            // НЕТ return перед res.status
            res.status(400).json({ message: 'User ID (number) is required.' });
            return; // Выход
        }

        try {
            await this.userService.updateUserTheme(userId, theme);
            logger.info(
                `[${operationName}] Theme updated successfully for user ${userId}.`,
            );
            // НЕТ return перед res.status
            res.status(200).json({ message: 'Theme updated successfully' });
        } catch (error) {
            handleServiceError(error, res, operationName);
        }
    };

    /**
     * Обновляет URL фотографии пользователя.
     */
    updateUserPhotoUrl = async (req: Request, res: Response): Promise<void> => {
        const operationName = 'updateUserPhotoUrl';
        const userId = Number(req.body.userId);
        const { photo_url } = req.body; // Получаем photo_url из тела запроса
        logger.info(`[${operationName}] Request for user ID: ${userId}`);

        if (isNaN(userId)) {
            logger.warn(`[${operationName}] Invalid ID format.`);
            res.status(400).json({ message: 'User ID (number) is required.' });
            return;
        }
        // Можно добавить проверку, что photo_url передан, если он обязателен
        // if (photo_url === undefined) {
        //     logger.warn(`[${operationName}] Missing photo_url for user ID ${userId}.`);
        //     res.status(400).json({ message: 'photo_url is required.' });
        //     return;
        // }

        try {
            // --- ИСПОЛЬЗУЕМ updateUserProfile ---
            await this.userService.updateUserProfile(
                userId,
                { photo_url: photo_url === undefined ? null : photo_url }, // Передаем объект только с полем photo_url
                // Устанавливаем null, если photo_url не пришел, чтобы можно было очистить фото
                // или используйте photo_url || null, если null допустим в body
            );
            // --- КОНЕЦ ИСПРАВЛЕНИЯ ---

            logger.info(
                `[${operationName}] Photo updated successfully for user ${userId}.`,
            );
            res.status(200).json({ message: 'Photo updated successfully' });
        } catch (error) {
            handleServiceError(error, res, operationName);
        }
    };

    /**
     * Обновляет номер телефона пользователя.
     */
    saveUserPhone = async (req: Request, res: Response): Promise<void> => {
        const operationName = 'saveUserPhone';
        const userId = Number(req.params.userId || req.body.userId);
        const { phoneNumber } = req.body;
        logger.info(`[${operationName}] Request for user ID: ${userId}`);

        if (isNaN(userId)) {
            logger.warn(`[${operationName}] Invalid ID format.`);
            // НЕТ return перед res.status
            res.status(400).json({ message: 'User ID (number) is required.' });
            return; // Выход
        }
        if (!phoneNumber || typeof phoneNumber !== 'string') {
            logger.warn(
                `[${operationName}] Invalid or missing phoneNumber for user ID ${userId}.`,
            );
            // НЕТ return перед res.status
            res.status(400).json({
                message: 'phoneNumber (string) is required.',
            });
            return; // Выход
        }

        try {
            await this.userService.updateUserPhone(userId, phoneNumber);
            logger.info(
                `[${operationName}] Phone number saved successfully for user ${userId}.`,
            );
            // НЕТ return перед res.status
            res.status(200).json({
                message: 'Phone number saved successfully',
            });
        } catch (error) {
            handleServiceError(error, res, operationName);
        }
    };

    /**
     * Устанавливает промежуточный язык.
     */
    setLanuage = async (req: Request, res: Response): Promise<void> => {
        const operationName = 'setMiddlewareLanuage';
        const userId = Number(req.params.userId || req.body.userId);
        const { language } = req.body;
        logger.info(`[${operationName}] Request for user ID: ${userId}`);

        if (isNaN(userId)) {
            logger.warn(`[${operationName}] Invalid ID format.`);
            // НЕТ return перед res.status
            res.status(400).json({ message: 'User ID (number) is required.' });
            return; // Выход
        }
        if (!language && ((language !== 'russian') || (language !== 'buryat'))) {
            logger.warn(
                `[${operationName}] Invalid or missing language for user ID ${userId}.`,
            );
            // НЕТ return перед res.status
            res.status(400).json({
                message: 'language (string) is required.',
            });
            return; // Выход
        }

        try {
            await this.userService.updateUserVocabularyLanguage(userId, language);
            logger.info(
                `[${operationName}] Vocabulary Language saved successfully for user ${userId}.`,
            );
            // НЕТ return перед res.status
            res.status(200).json({
                message: 'Vocabulary Language saved successfully',
            });
        } catch (error) {
            handleServiceError(error, res, operationName);
        }
    };

    /**
     * Обновляет текущую позицию пользователя в уроке.
     */
    updateQuestionPosition = async (
        req: Request,
        res: Response,
    ): Promise<void> => {
        const operationName = 'updateQuestionPosition';
        const { id, lessonId, position } = req.body;
        const userIdNum = Number(id);
        logger.info(
            `[${operationName}] Request for user ID: ${id}, lesson: ${lessonId}, position: ${position}`,
        );

        if (isNaN(userIdNum)) {
            logger.warn(`[${operationName}] Invalid user ID format: ${id}.`);
            // НЕТ return перед res.status
            res.status(400).json({ message: 'User ID (number) is required.' });
            return; // Выход
        }
        if (!lessonId || !Types.ObjectId.isValid(lessonId)) {
            logger.warn(
                `[${operationName}] Invalid lessonId format: ${lessonId} for user ${id}.`,
            );
            // НЕТ return перед res.status
            res.status(400).json({
                message: 'lessonId (valid ObjectId) is required.',
            });
            return; // Выход
        }
        const positionNum = Number(position);
        if (
            isNaN(positionNum) ||
            positionNum <= 0 ||
            !Number.isInteger(positionNum)
        ) {
            logger.warn(
                `[${operationName}] Invalid position: ${position} for user ${id}.`,
            );
            // НЕТ return перед res.status
            res.status(400).json({
                message: 'position (positive integer) is required.',
            });
            return; // Выход
        }

        try {
            await this.userService.updateCurrentQuestion(
                userIdNum,
                lessonId,
                positionNum,
            );
            logger.info(
                `[${operationName}] Question position updated for user ${id}.`,
            );
            // НЕТ return перед res.status
            res.status(200).json({
                message: 'Question position updated successfully',
            });
        } catch (error) {
            handleServiceError(error, res, operationName);
        }
    };

    /**
     * Устанавливает язык для словаря пользователя.
     */
    selectLanguageForVocabular = async (
        req: Request,
        res: Response,
    ): Promise<void> => {
        const operationName = 'selectLanguageForVocabular';
        const { id, language } = req.body;
        const userIdNum = Number(id);
        logger.info(
            `[${operationName}] Request for user ID: ${id}, language: ${language}`,
        );

        if (isNaN(userIdNum)) {
            logger.warn(`[${operationName}] Invalid ID format: ${id}.`);
            // НЕТ return перед res.status
            res.status(400).json({ message: 'User ID (number) is required.' });
            return; // Выход
        }
        if (language !== 'russian' && language !== 'buryat') {
            logger.warn(
                `[${operationName}] Invalid language: ${language} for user ${id}.`,
            );
            // НЕТ return перед res.status
            res.status(400).json({
                message: "language must be 'russian' or 'buryat'.",
            });
            return; // Выход
        }

        try {
            await this.userService.setVocabularyLanguage(userIdNum, language);
            logger.info(
                `[${operationName}] Vocabulary language set for user ${id}.`,
            );
            // НЕТ return перед res.status
            res.status(200).json({ message: 'Language selected successfully' });
        } catch (error) {
            handleServiceError(error, res, operationName);
        }
    };

    /**
     * Блокирует пользователя.
     */
    blockUser = async (req: Request, res: Response): Promise<void> => {
        const operationName = 'blockUser';
        const userId = Number(req.params.userId || req.body.id);
        logger.info(`[${operationName}] Request for user ID: ${userId}`);

        if (isNaN(userId)) {
            logger.warn(`[${operationName}] Invalid ID format.`);
            // НЕТ return перед res.status
            res.status(400).json({ message: 'User ID (number) is required.' });
            return; // Выход
        }

        try {
            await this.userService.blockUser(userId);
            logger.warn(
                `[${operationName}] User ${userId} blocked successfully.`,
            );
            // НЕТ return перед res.status
            res.status(200).json({ message: 'User blocked successfully' });
        } catch (error) {
            handleServiceError(error, res, operationName);
        }
    };

    /**
     * Получает реферальную информацию пользователя.
     */
    getUserReferralInfo = async (
        req: Request,
        res: Response,
    ): Promise<void> => {
        const operationName = 'getUserReferralInfo';
        const { id } = req.params;
        const userIdNum = Number(id);
        logger.info(`[${operationName}] Request for user ID: ${id}`);

        if (isNaN(userIdNum)) {
            logger.warn(`[${operationName}] Invalid ID format: ${id}`);
            // НЕТ return перед res.status
            res.status(400).json({ message: 'Invalid User ID format.' });
            return; // Выход
        }

        try {
            const user = await this.userService.findUserById(
                userIdNum,
                '_id id referral_code username',
            );
            if (!user) {
                logger.warn(`[${operationName}] User not found: ${id}`);
                // НЕТ return перед res.status
                res.status(404).json({ message: 'User not found' });
                return; // Выход
            }

            const referralsResult = await this.userService.listUsers({
                filter: { referred_by: user._id },
                fields: 'subscription',
                limit: 10000,
            });

            const referrals = referralsResult.users;
            const subscribedReferralsCount = referrals.filter(
                (r) => r.subscription?.isActive === true,
            ).length;

            const botUsername = process.env.BOT_USERNAME || 'your_bot_username';
            logger.info(
                `[${operationName}] Referral info retrieved for user ${id}`,
            );
            // НЕТ return перед res.status
            res.status(200).json({
                referralCode: user.referral_code,
                referralLink: `https://t.me/${botUsername}?start=ref_${user.referral_code}`,
                referralsCount: referrals.length,
                subscribedReferralsCount: subscribedReferralsCount,
            });
        } catch (error) {
            handleServiceError(error, res, operationName);
        }
    };

    /**
     * Привязывает пользователя к рефереру (новый эндпоинт).
     */
    linkReferral = async (req: Request, res: Response): Promise<void> => {
        const operationName = 'linkReferral';
        const userId = Number(req.params.userId);
        const { referralCode } = req.body;
        logger.info(
            `[${operationName}] Request for user ID: ${userId} with code: ${referralCode}`,
        );

        if (isNaN(userId)) {
            logger.warn(
                `[${operationName}] Invalid user ID format: ${userId}.`,
            );
            // НЕТ return перед res.status
            res.status(400).json({ message: 'Invalid User ID format.' });
            return; // Выход
        }
        if (!referralCode || typeof referralCode !== 'string') {
            logger.warn(
                `[${operationName}] Missing or invalid referralCode for user ${userId}.`,
            );
            // НЕТ return перед res.status
            res.status(400).json({
                message: 'Referral code (string) is required.',
            });
            return; // Выход
        }

        try {
            await this.userService.linkReferral(userId, referralCode);
            logger.info(
                `[${operationName}] User ${userId} linked successfully via code ${referralCode}.`,
            );
            // НЕТ return перед res.status
            res.status(200).json({
                message: `User ${userId} successfully linked via code ${referralCode}.`,
            });
        } catch (error) {
            handleServiceError(error, res, operationName);
        }
    };

    /**
     * Получает таблицу лидеров.
     */
    getLeaderboard = async (req: Request, res: Response): Promise<void> => {
        const operationName = 'getLeaderboard';
        logger.info(`[${operationName}] Request received`);
        try {
            const limit = Number(req.query.limit) || 10;
            const sortBy = (req.query.sortBy as string) || 'rating';

            const fieldsToSelect =
                'username id first_name photo_url level subscription rating';

            const leaderboardResult = await this.userService.listUsers({
                sortBy: sortBy,
                sortOrder: 'desc',
                limit: limit,
                fields: fieldsToSelect,
                filter: { blocked: { $ne: true } },
            });

            logger.info(
                `[${operationName}] ${leaderboardResult.users.length} leaders fetched`,
            );
            // НЕТ return перед res.status
            res.status(200).json(leaderboardResult.users);
        } catch (error) {
            handleServiceError(error, res, operationName);
        }
    };

    // ==============================================
    // МЕТОДЫ, НЕ СВЯЗАННЫЕ С TelegramUserService
    // ==============================================

    /**
     * Создает запись диалога.
     */
    createDialog = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        const operationName = 'createDialog';
        try {
            const { messages } = req.body;
            if (!messages || !Array.isArray(messages)) {
                logger.warn(`[${operationName}] Invalid messages format.`);
                // НЕТ return перед res.status
                res.status(400).json({
                    message: 'Invalid messages format. Array expected.',
                });
                return; // Выход
            }
            await new DialogModel({ messages }).save();
            logger.info(`[${operationName}] Dialog entry created.`);
            // НЕТ return перед res.status
            res.status(201).json({ messages });
        } catch (error) {
            logger.error(`[${operationName}] Error saving dialog:`, { error });
            next(error); // Передаем дальше, т.к. handleServiceError может не знать об ошибках DialogModel
        }
    };

    /**
     * Сохраняет состояние пользователя.
     */
    saveUserState = async (req: Request, res: Response): Promise<void> => {
        const operationName = 'saveUserState';
        const { userId, scene, stateData } = req.body;
        logger.debug(`[${operationName}] Request for user ID: ${userId}`);

        if (!userId || typeof userId !== 'number') {
            logger.warn(`[${operationName}] Invalid or missing userId.`);
            // НЕТ return перед res.status
            res.status(400).json({ message: 'userId (number) is required.' });
            return; // Выход
        }

        try {
            await TelegramUserState.findOneAndUpdate(
                { userId },
                { scene, stateData },
                { upsert: true, new: true },
            );
            logger.debug(`[${operationName}] State saved for user ${userId}.`);
            // НЕТ return перед res.status
            res.status(200).json({ message: 'State saved successfully' });
        } catch (error) {
            // Здесь можно использовать handleServiceError, но он не знает специфичных ошибок TelegramUserState
            // Поэтому пока оставляем общую обработку
            logger.error(
                `[${operationName}] Error saving state for user ${userId}:`,
                { error },
            );
            // НЕТ return перед res.status
            res.status(500).json({ message: 'Failed to save user state' });
        }
    };

    /**
     * Получает состояние пользователя.
     */
    getUserState = async (req: Request, res: Response): Promise<void> => {
        const operationName = 'getUserState';
        const { id } = req.params;
        const userIdNum = Number(id);
        logger.debug(`[${operationName}] Request for user ID: ${id}`);

        if (isNaN(userIdNum)) {
            logger.warn(`[${operationName}] Invalid ID format: ${id}.`);
            // НЕТ return перед res.status
            res.status(400).json({ message: 'Invalid User ID format.' });
            return; // Выход
        }

        try {
            const userState = await TelegramUserState.findOne({
                userId: userIdNum,
            });
            if (!userState) {
                logger.debug(
                    `[${operationName}] State not found for user ${id}.`,
                );
                // НЕТ return перед res.status
                res.status(404).json({ message: 'User state not found' });
                return; // Выход
            }
            logger.debug(`[${operationName}] State retrieved for user ${id}.`);
            // НЕТ return перед res.status
            res.status(200).json(userState);
        } catch (error) {
            logger.error(
                `[${operationName}] Error fetching state for user ${id}:`,
                { error },
            );
            // НЕТ return перед res.status
            res.status(500).json({ message: 'Failed to get user state' });
        }
    };

    /**
     * Сохраняет действие пользователя.
     */
    saveUserAction = async (req: Request, res: Response): Promise<void> => {
        const operationName = 'saveUserAction';
        const { userId, updateType, data } = req.body;
        logger.debug(`[${operationName}] Request for user ID: ${userId}`);

        if (!userId || typeof userId !== 'number') {
            logger.warn(`[${operationName}] Invalid or missing userId.`);
            // НЕТ return перед res.status
            res.status(400).json({ message: 'userId (number) is required.' });
            return; // Выход
        }
        if (!updateType) {
            logger.warn(
                `[${operationName}] Missing updateType for user ${userId}.`,
            );
            // НЕТ return перед res.status
            res.status(400).json({ message: 'updateType is required.' });
            return; // Выход
        }

        try {
            await new TelegramUserActionModel({
                userId,
                updateType,
                data,
            }).save();
            logger.debug(`[${operationName}] Action saved for user ${userId}.`);
            // НЕТ return перед res.status
            res.status(200).json({ message: 'Action saved successfully' });
        } catch (error) {
            logger.error(
                `[${operationName}] Error saving action for user ${userId}:`,
                { error },
            );
            // НЕТ return перед res.status
            res.status(500).json({ message: 'Failed to save user action' });
        }
    };

    /**
     * Placeholder для колбэка платежа.
     */
    paymentCb = async (_req: Request, res: Response): Promise<void> => {
        logger.info('Payment callback received (placeholder)');
        // НЕТ return перед res.sendStatus
        res.sendStatus(200);
    };

    /**
     * Placeholder для получения всех диалогов.
     */
    getAllDialogs = async (_req: Request, res: Response): Promise<void> => {
        const operationName = 'getAllDialogs';
        logger.debug(`[${operationName}] Request received`);
        try {
            const dialogs = await DialogModel.find();
            logger.debug(
                `[${operationName}] ${dialogs.length} dialogs fetched.`,
            );
            // НЕТ return перед res.status
            res.status(200).json(dialogs);
        } catch (error) {
            logger.error(`[${operationName}] Error fetching dialogs:`, {
                error,
            });
            // НЕТ return перед res.status
            res.status(500).json({ message: 'Failed to get dialogs' });
        }
    };
    /**
     * Получает тему оформления пользователя.
     */
    getUserTheme = async (req: Request, res: Response): Promise<void> => {
        const operationName = 'getUserTheme';
        const { id } = req.params; // Получаем ID из параметров URL
        const userIdNum = Number(id);
        logger.info(`[${operationName}] Request for user ID: ${id}`);

        if (isNaN(userIdNum)) {
            logger.warn(`[${operationName}] Invalid ID format: ${id}`);
            res.status(400).json({ message: 'Invalid User ID format.' });
            return; // Выход
        }

        try {
            // Запрашиваем у сервиса ТОЛЬКО поле 'theme'
            const user = await this.userService.findUserById(
                userIdNum,
                'theme',
            );

            if (!user) {
                logger.warn(`[${operationName}] User not found: ${id}`);
                // findUserById вернет null, UserNotFoundError здесь не будет
                res.status(404).json({ message: 'User not found' });
                return; // Выход
            }

            logger.info(`[${operationName}] Theme retrieved for user ${id}.`);
            res.status(200).json({ theme: user.theme }); // Возвращаем только тему
        } catch (error) {
            // Обрабатываем возможные ошибки БД при поиске
            handleServiceError(error, res, operationName);
        }
    };
    // УДАЛЯЕМ trackReferral, так как его функциональность покрывается linkReferral
    // или требует доработки сервиса
    /*
    trackReferral = async (req: Request, res: Response): Promise<void> => {
        // ... старый код ...
    };
    */
}

// Экспортируем единственный экземпляр контроллера
export const telegramController = new TelegramController();
