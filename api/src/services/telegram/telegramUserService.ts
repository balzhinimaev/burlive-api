// src/services/telegram/telegramUserService.ts

import { Model, Types } from 'mongoose';
import { TelegramUser, TelegramUserDocument } from '../../models/TelegramUsers';
import { ILevel } from '../../models/Level';
import { Logger } from 'winston';
import {
    UserExistsError,
    UserNotFoundError,
    ConfigurationError,
    ValidationError,
    // AppError, // Оставляем на случай использования в других местах
    DatabaseError,
    // LevelUpdateError,
} from '../../errors/customErrors'; // Убедитесь, что путь верный
import { ObjectId } from 'mongodb';

export type RegisterUserDTO = Pick<TelegramUser, 'id'> &
    Partial<Omit<TelegramUser, '_id' | 'createdAt' | 'updatedAt'>>;

export type UpdateUserDTO = Partial<
    Omit<
        TelegramUser,
        | '_id'
        | 'id'
        | 'createdAt'
        | 'updatedAt'
        | 'level'
        | 'referrals'
        | 'referred_by'
        | 'referral_code'
        | 'subscription'
        | 'rating'
        | 'dailyRating'
        | 'currentQuestion'
        | 'blocked'
        | 'vocabular'
    >
>;

export class TelegramUserService {
    constructor(
        private telegramUserModel: Model<TelegramUserDocument>,
        private levelModel: Model<ILevel>,
        private logger: Logger,
    ) {}

    /**
     * Регистрирует нового пользователя Telegram.
     */
    async registerUser(
        userData: RegisterUserDTO,
        referralCode?: string,
    ): Promise<TelegramUserDocument> {
        this.logger.info(`Attempting to register user with ID: ${userData.id}`);

        if (!userData.id) {
            throw new ValidationError(
                'Telegram ID (id) is required for registration.',
            );
        }

        try {
            // 1. Проверка на существование пользователя (БЕЗ .exec())
            const existingUser = await this.telegramUserModel.findOne({
                id: userData.id,
            });
            if (existingUser) {
                this.logger.warn(
                    `User registration failed: User with ID ${userData.id} already exists.`,
                );
                throw new UserExistsError(
                    `Пользователь с ID ${userData.id} уже зарегистрирован.`,
                );
            }

            // 2. Получение начального уровня (НУЖЕН .exec() после .sort())
            const initialLevel = await this.levelModel
                .findOne()
                .sort({ minRating: 1 })
                .exec();
            if (!initialLevel) {
                this.logger.error(
                    'FATAL: Initial user level not found in database.',
                );
                throw new ConfigurationError(
                    'Начальный уровень не настроен в системе.',
                );
            }

            // 3. Создание нового пользователя
            const newUser = new this.telegramUserModel({
                ...userData,
                email: userData.email || null,
                level: initialLevel._id,
            });

            let referrerId: Types.ObjectId | null = null;

            // 4. Обработка реферального кода (БЕЗ .exec())
            if (referralCode) {
                this.logger.info(
                    `Processing referral code ${referralCode} for user ${userData.id}`,
                );
                const referrer = await this.telegramUserModel.findOne({
                    referral_code: referralCode,
                });
                if (referrer) {
                    if (referrer.id === userData.id) {
                        this.logger.warn(
                            `User ${userData.id} tried to use their own referral code.`,
                        );
                    } else {
                        newUser.referred_by = referrer._id;
                        referrerId = referrer._id;
                        this.logger.info(
                            `User ${userData.id} will be marked as referred by ${referrer.id}`,
                        );
                    }
                } else {
                    this.logger.warn(
                        `Referral code ${referralCode} not found.`,
                    );
                }
            }

            // 5. Сохранение нового пользователя
            const savedUser = await newUser.save();
            this.logger.info(
                `User ${savedUser.id} successfully registered with _id ${savedUser._id}.`,
            );

            // 6. Обновляем реферера (БЕЗ .exec())
            if (referrerId) {
                try {
                    await this.telegramUserModel.updateOne(
                        { _id: referrerId },
                        { $addToSet: { referrals: savedUser._id } },
                    );
                    this.logger.info(
                        `Referrer ${referrerId} updated with new referral ${savedUser._id}`,
                    );
                } catch (refUpdateError: any) {
                    this.logger.error(
                        `Failed to update referrer ${referrerId} for new user ${savedUser._id}: ${refUpdateError.message}`,
                        { error: refUpdateError },
                    );
                }
            }
            return savedUser;
        } catch (error: any) {
            this.logger.error(
                `Error during registration process for ${userData.id}: ${error.message}`,
                { error },
            );
            if (
                error instanceof UserExistsError ||
                error instanceof ConfigurationError ||
                error instanceof ValidationError
            ) {
                throw error;
            }
            if (error.name === 'ValidationError' || error.code === 11000) {
                // Исправлено: убран второй аргумент
                throw new ValidationError(
                    `Ошибка данных пользователя: ${error.message}`,
                );
            }
            // Исправлено: убран второй аргумент
            throw new DatabaseError(
                `Ошибка регистрации пользователя: ${error.message}`,
            );
        }
    }

    /**
     * Находит пользователя по его Telegram ID.
     */
    async findUserById(
        id: number,
        fieldsToSelect:
            | string
            | Record<
                  string,
                  number
              > = '_id bot id username email createdAt first_name rating theme photo_url role subscription phone level vocabular',
        populateLevel: boolean = false,
    ): Promise<TelegramUserDocument | null> {
        this.logger.debug(`Finding user by ID: ${id}`);
        try {
            const query = this.telegramUserModel
                .findOne({ id: id })
                .select(fieldsToSelect);
            if (populateLevel) {
                query.populate('level');
            }
            // НУЖЕН .exec()
            const user = await query.exec();
            if (!user) {
                return null;
            }
            return user;
        } catch (error: any) {
            this.logger.error(
                `Error finding user by ID ${id}: ${error.message}`,
                { error },
            );
            // Исправлено: убран второй аргумент
            throw new DatabaseError(
                `Ошибка поиска пользователя: ${error.message}`,
            );
        }
    }

    /**
     * Получает список пользователей с опциями пагинации, сортировки, фильтрации и выбора полей.
     */
    async listUsers(
        options: {
            limit?: number;
            offset?: number;
            sortBy?: string;
            sortOrder?: 'asc' | 'desc';
            filter?: any;
            fields?: string; // <--- ДОБАВЛЕНО ЭТО СВОЙСТВО
        } = {},
    ): Promise<{ users: TelegramUserDocument[]; total: number }> {
        const {
            limit = 10,
            offset = 0,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            filter = {},
            fields, // <--- Получаем значение fields из options
        } = options;
        this.logger.debug(
            `Listing users with options: ${JSON.stringify(options)}`,
        );
        const sortOptions: { [key: string]: 1 | -1 } = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        try {
            const total = await this.telegramUserModel.countDocuments(filter);

            // Создаем запрос
            const query = this.telegramUserModel
                .find(filter)
                .sort(sortOptions)
                .skip(offset)
                .limit(limit);

            // Применяем select, ЕСЛИ fields переданы
            if (fields) {
                query.select(fields); // <--- ПРИМЕНЯЕМ SELECT ЗДЕСЬ
            }

            // Выполняем запрос
            const users = await query.exec();

            return { users, total };
        } catch (error: any) {
            this.logger.error(`Error listing users: ${error.message}`, {
                error,
            });
            throw new DatabaseError(
                `Ошибка получения списка пользователей: ${error.message}`,
            );
        }
    }

    /**
     * Обновляет основные поля профиля пользователя.
     */
    async updateUserProfile(
        id: number,
        updateData: UpdateUserDTO,
    ): Promise<TelegramUserDocument> {
        this.logger.info(
            `Updating profile for user ${id}. Data: ${JSON.stringify(updateData)}`,
        );
        if (Object.keys(updateData).length === 0) {
            const currentUser = await this.findUserById(id);
            if (!currentUser)
                throw new UserNotFoundError(
                    `Пользователь с ID ${id} не найден.`,
                );
            return currentUser;
        }

        try {
            // НЕ НУЖЕН .exec()
            const updatedUser = await this.telegramUserModel.findOneAndUpdate(
                { id: id },
                { $set: updateData },
                { new: true, runValidators: true },
            );
            if (!updatedUser) {
                // Логгер здесь не нужен, т.к. ошибка будет поймана и залоггирована ниже
                throw new UserNotFoundError(
                    `Пользователь с ID ${id} не найден для обновления.`,
                );
            }
            return updatedUser;
        } catch (error: any) {
            this.logger.error(
                `Error updating profile for user ${id}: ${error.message}`,
                { error },
            );
            if (error instanceof UserNotFoundError) {
                throw error;
            }
            if (error.name === 'ValidationError') {
                // Исправлено: убран второй аргумент
                throw new ValidationError(
                    `Ошибка валидации при обновлении профиля: ${error.message}`,
                );
            }
            // Исправлено: убран второй аргумент
            throw new DatabaseError(
                `Не удалось обновить профиль пользователя: ${error.message}`,
            );
        }
    }

    async updateVocabularLanguage(
        id: number,
        updateData: string,
    ): Promise<TelegramUserDocument> {
        if (Object.keys(updateData).length === 0) {
            const currentUser = await this.findUserById(id);
            if (!currentUser)
                throw new UserNotFoundError(
                    `Пользователь с ID ${id} не найден.`,
                );
            return currentUser;
        }

        try {
            // НЕ НУЖЕН .exec()
            const updatedUser = await this.telegramUserModel.findOneAndUpdate(
                { id: id },
                {
                    $set: {
                        'vocabular.selected_language_for_translate': updateData,
                    },
                },
                { new: true, runValidators: true },
            );
            if (!updatedUser) {
                // Логгер здесь не нужен, т.к. ошибка будет поймана и залоггирована ниже
                throw new UserNotFoundError(
                    `Пользователь с ID ${id} не найден для обновления.`,
                );
            }
            return updatedUser;
        } catch (error: any) {
            if (error instanceof UserNotFoundError) {
                throw error;
            }
            if (error.name === 'ValidationError') {
                // Исправлено: убран второй аргумент
                throw new ValidationError(
                    `Ошибка валидации при обновлении профиля: ${error.message}`,
                );
            }
            // Исправлено: убран второй аргумент
            throw new DatabaseError(
                `Не удалось обновить профиль пользователя: ${error.message}`,
            );
        }
    }

    async updateWordId(
        id: number,
        updateData: string,
    ): Promise<TelegramUserDocument> {
        if (Object.keys(updateData).length === 0) {
            const currentUser = await this.findUserById(id);
            if (!currentUser)
                throw new UserNotFoundError(
                    `Пользователь с ID ${id} не найден.`,
                );
            return currentUser;
        }

        try {
            // НЕ НУЖЕН .exec()
            const updatedUser = await this.telegramUserModel.findOneAndUpdate(
                { id: id },
                {
                    $set: {
                        'vocabular.proccesed_word_id': new ObjectId(updateData),
                    },
                },
                { new: true },
            );
            if (!updatedUser) {
                // Логгер здесь не нужен, т.к. ошибка будет поймана и залоггирована ниже
                throw new UserNotFoundError(
                    `Пользователь с ID ${id} не найден для обновления.`,
                );
            }
            return updatedUser;
        } catch (error: any) {
            if (error instanceof UserNotFoundError) {
                throw error;
            }
            if (error.name === 'ValidationError') {
                // Исправлено: убран второй аргумент
                throw new ValidationError(
                    `Ошибка валидации при обновлении профиля: ${error.message}`,
                );
            }
            // Исправлено: убран второй аргумент
            throw new DatabaseError(
                `Не удалось обновить профиль пользователя: ${error.message}`,
            );
        }
    }

    async updatePage(
        id: number,
        updateData: number,
    ): Promise<TelegramUserDocument> {
        // console.log(id, updateData)
        // if (Object.keys(updateData).length === 0) {
        //     const currentUser = await this.findUserById(id);
        //     console.log(currentUser);
        //     if (!currentUser)
        //         throw new UserNotFoundError(
        //             `Пользователь с ID ${id} не найден.`,
        //         );
        //     return currentUser;
        // }

        try {
            console.log(id, updateData)
            // НЕ НУЖЕН .exec()
            const updatedUser = await this.telegramUserModel.findOneAndUpdate(
                { id: id },
                {
                    $set: {
                        'vocabular.page': updateData,
                    },
                },
                { new: true },
            );

            console.log(updatedUser)
            if (!updatedUser) {
                // Логгер здесь не нужен, т.к. ошибка будет поймана и залоггирована ниже
                throw new UserNotFoundError(
                    `Пользователь с ID ${id} не найден для обновления.`,
                );
            }
            return updatedUser;
        } catch (error: any) {
            if (error instanceof UserNotFoundError) {
                throw error;
            }
            if (error.name === 'ValidationError') {
                // Исправлено: убран второй аргумент
                throw new ValidationError(
                    `Ошибка валидации при обновлении профиля: ${error.message}`,
                );
            }
            // Исправлено: убран второй аргумент
            throw new DatabaseError(
                `Не удалось обновить профиль пользователя: ${error.message}`,
            );
        }
    }

    /**
     * Обновляет тему пользователя.
     */
    async updateUserTheme(
        id: number,
        theme: 'light' | 'dark',
    ): Promise<TelegramUserDocument> {
        if (theme !== 'light' && theme !== 'dark') {
            throw new ValidationError(
                "Недопустимое значение темы. Допустимо 'light' или 'dark'.",
            );
        }
        return this.updateUserProfile(id, { theme });
    }

    /**
     * Обновляет телефон пользователя.
     */
    async updateUserPhone(
        id: number,
        phoneNumber: string,
    ): Promise<TelegramUserDocument> {
        if (typeof phoneNumber !== 'string') {
            throw new ValidationError('Неверный формат номера телефона.');
        }
        return this.updateUserProfile(id, { phone: phoneNumber });
    }
    async updateUserVocabularyLanguage(
        id: number,
        language: string,
    ): Promise<TelegramUserDocument> {
        if (typeof language !== 'string') {
            throw new ValidationError('Неверный язык.');
        }
        return this.updateVocabularLanguage(id, language);
    }

    async updateUserWordId(
        id: number,
        wordId: string,
    ): Promise<TelegramUserDocument> {
        if (typeof wordId !== 'string') {
            throw new ValidationError('Неверный айди');
        }
        return this.updateWordId(id, wordId);
    }
    async updateUserBotPage(
        id: number,
        page: number,
    ): Promise<TelegramUserDocument> {
        if (typeof page !== 'number') {
            throw new ValidationError('Неверный page');
        }
        console.log(id, page)
        return this.updatePage(id, page);
    }

    /**
     * Обновляет текущую позицию пользователя в уроке.
     */
    async updateCurrentQuestion(
        id: number,
        lessonId: Types.ObjectId | string,
        questionPosition: number,
    ): Promise<TelegramUserDocument> {
        this.logger.info(
            `Updating current question for user ${id} to lesson ${lessonId}, pos ${questionPosition}`,
        );
        if (!Types.ObjectId.isValid(lessonId)) {
            throw new ValidationError('Неверный формат ID урока.');
        }
        if (typeof questionPosition !== 'number' || questionPosition < 1) {
            throw new ValidationError(
                'Позиция вопроса должна быть числом больше 0.',
            );
        }

        try {
            // НЕ НУЖЕН .exec()
            const updatedUser = await this.telegramUserModel.findOneAndUpdate(
                { id: id },
                {
                    $set: {
                        'currentQuestion.lessonId': new Types.ObjectId(
                            lessonId,
                        ),
                        'currentQuestion.questionPosition':
                            Math.floor(questionPosition),
                    },
                },
                { new: true, runValidators: true },
            );
            if (!updatedUser) {
                throw new UserNotFoundError(
                    `Пользователь с ID ${id} не найден для обновления позиции вопроса.`,
                );
            }
            return updatedUser;
        } catch (error: any) {
            this.logger.error(
                `Error updating current question for user ${id}: ${error.message}`,
                { error },
            );
            if (
                error instanceof UserNotFoundError ||
                error instanceof ValidationError
            ) {
                // ValidationError из валидации в начале метода
                throw error;
            }
            if (error.name === 'ValidationError') {
                // Ошибка валидации Mongoose
                // Исправлено: убран второй аргумент
                throw new ValidationError(
                    `Ошибка валидации при обновлении позиции вопроса: ${error.message}`,
                );
            }
            // Исправлено: убран второй аргумент
            throw new DatabaseError(
                `Не удалось обновить позицию вопроса: ${error.message}`,
            );
        }
    }

    /**
     * Блокирует пользователя.
     */
    async blockUser(id: number): Promise<TelegramUserDocument> {
        this.logger.warn(`Blocking user ${id}.`);
        try {
            // НЕ НУЖЕН .exec()
            const updatedUser = await this.telegramUserModel.findOneAndUpdate(
                { id: id },
                { $set: { blocked: true } },
                { new: true },
            );
            if (!updatedUser) {
                throw new UserNotFoundError(
                    `Пользователь с ID ${id} не найден для блокировки.`,
                );
            }
            return updatedUser;
        } catch (error: any) {
            this.logger.error(`Error blocking user ${id}: ${error.message}`, {
                error,
            });
            if (error instanceof UserNotFoundError) {
                throw error;
            }
            // Исправлено: убран второй аргумент
            throw new DatabaseError(
                `Не удалось заблокировать пользователя: ${error.message}`,
            );
        }
    }

    /**
     * Устанавливает язык словаря для пользователя.
     */
    async setVocabularyLanguage(
        id: number,
        language: 'russian' | 'buryat',
    ): Promise<TelegramUserDocument> {
        this.logger.info(
            // <-- ЛОГ 1
            `Setting vocabulary language to ${language} for user ${id}.`,
        );
        if (language !== 'russian' && language !== 'buryat') {
            throw new ValidationError('Недопустимое значение языка словаря.');
        }
        try {
            const updatedUser = await this.telegramUserModel.findOneAndUpdate(
                { id: id },
                {
                    $set: {
                        'vocabular.selected_language_for_translate': language,
                    },
                },
                { new: true, runValidators: true },
            );
            if (!updatedUser) {
                throw new UserNotFoundError(
                    `Пользователь с ID ${id} не найден.`,
                );
            }

            // --- ИСПРАВЛЕНО: Лог ПЕРЕД возвратом ---
            this.logger.info(
                // <-- ЛОГ 2 (успех)
                `User ${id} vocab language set to ${language}.`,
            );
            return updatedUser; // <-- Теперь возврат ПОСЛЕ лога
        } catch (error: any) {
            this.logger.error(
                `Error setting vocab language for user ${id}: ${error.message}`,
                { error },
            );
            if (
                error instanceof UserNotFoundError ||
                error instanceof ValidationError
            ) {
                throw error;
            }
            if (error.name === 'ValidationError') {
                throw new ValidationError(
                    `Ошибка валидации при установке языка словаря: ${error.message}`,
                );
            }
            throw new DatabaseError(
                `Не удалось установить язык словаря: ${error.message}`,
            );
        }
    }

    /**
     * Привязывает пользователя к рефереру по реферальному коду.
     * Обновляет поля referred_by у пользователя и referrals у реферера.
     * @param userId - Telegram ID пользователя, которого привязывают.
     * @param referralCode - Реферальный код реферера.
     * @throws UserNotFoundError если пользователь или реферер не найдены.
     * @throws ValidationError если код не найден, происходит само-реферал или пользователь уже привязан.
     * @throws DatabaseError при других ошибках базы данных.
     */
    async linkReferral(userId: number, referralCode: string): Promise<void> {
        // Возвращает void для простоты
        this.logger.info(
            `Attempting to link user ${userId} via referral code ${referralCode}`,
        );

        if (!userId || !referralCode) {
            throw new ValidationError('userId и referralCode обязательны.');
        }

        try {
            // 1. Найти пользователя по userId (выбираем нужные поля)
            // Используем findOne напрямую, так как findUserById может делать populate, который здесь не нужен
            const user = await this.telegramUserModel
                .findOne({ id: userId })
                .select('_id id referred_by');
            if (!user) {
                this.logger.warn(
                    `Link referral failed: User ${userId} not found.`,
                );
                throw new UserNotFoundError(
                    `Пользователь с ID ${userId} не найден.`,
                );
            }

            // 2. Найти реферера по referralCode (выбираем нужные поля)
            const referrer = await this.telegramUserModel
                .findOne({ referral_code: referralCode })
                .select('_id id');
            if (!referrer) {
                this.logger.warn(
                    `Link referral failed: Referral code ${referralCode} not found.`,
                );
                // Можно использовать ValidationError или создать ReferralCodeNotFoundError
                throw new ValidationError(
                    `Реферальный код "${referralCode}" не найден.`,
                );
            }

            // 3. Проверка на само-реферал
            if (user.id === referrer.id) {
                this.logger.warn(
                    `Link referral failed: User ${userId} attempted self-referral.`,
                );
                throw new ValidationError(
                    'Нельзя использовать свой собственный реферальный код.',
                );
            }

            // 4. Проверка, не привязан ли пользователь уже
            if (user.referred_by) {
                this.logger.warn(
                    `Link referral failed: User ${userId} already has a referrer (ID: ${user.referred_by}).`,
                );
                // Можно использовать ValidationError или создать ReferralConflictError
                throw new ValidationError('У пользователя уже есть реферер.');
            }

            // 5. Обновление пользователя: установка referred_by
            // Используем updateOne для простоты, так как нам не нужен возвращенный документ
            const userUpdateResult = await this.telegramUserModel.updateOne(
                { _id: user._id, referred_by: null }, // Доп. условие referred_by: null для предотвращения гонки состояний
                { $set: { referred_by: referrer._id } },
            );

            // Проверяем, что пользователь действительно был обновлен (на случай гонки состояний)
            if (userUpdateResult.modifiedCount === 0) {
                // Это может случиться, если referred_by уже был установлен между findOne и updateOne
                this.logger.warn(
                    `Link referral race condition? User ${userId} referred_by might have been set concurrently.`,
                );
                // Повторно проверяем пользователя, чтобы дать точную ошибку
                const currentUserState = await this.telegramUserModel
                    .findOne({ _id: user._id })
                    .select('referred_by');
                if (currentUserState?.referred_by) {
                    throw new ValidationError(
                        'У пользователя уже есть реферер (обнаружено при обновлении).',
                    );
                } else {
                    // Если не установлен, значит другая проблема с обновлением
                    throw new DatabaseError(
                        `Не удалось обновить referred_by для пользователя ${userId}, хотя он не был установлен.`,
                    );
                }
            }

            // 6. Обновление реферера: добавление пользователя в список referrals
            const referrerUpdateResult = await this.telegramUserModel.updateOne(
                { _id: referrer._id },
                { $addToSet: { referrals: user._id } }, // $addToSet предотвращает дублирование
            );

            // Логируем успех, даже если реферер не был модифицирован (юзер уже был в списке?)
            this.logger.info(
                `User ${userId} successfully linked to referrer ${referrer.id} (referrer update acknowledged: ${referrerUpdateResult.acknowledged}).`,
            );
        } catch (error: any) {
            this.logger.error(
                `Error linking referral for user ${userId} with code ${referralCode}: ${error.message}`,
                { error },
            );

            // Перебрасываем уже обработанные кастомные ошибки
            if (
                error instanceof UserNotFoundError ||
                error instanceof ValidationError
            ) {
                throw error;
            }

            // Обрабатываем возможные ошибки БД при updateOne
            throw new DatabaseError(
                `Ошибка при привязке реферала: ${error.message}`,
            );
        }
    }
}
