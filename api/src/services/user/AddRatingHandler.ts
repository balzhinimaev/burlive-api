// src/services/user/AddRatingHandler.ts (или ваш путь)

import { Model, Types } from 'mongoose'; // Убедитесь, что Types импортирован
import { Logger } from 'winston';
import { TelegramUserDocument } from '../../models/TelegramUsers'; // Пути!
import {
    UserNotFoundError,
    ValidationError,
    DatabaseError,
    LevelUpdateError,
} from '../../errors/customErrors'; // Пути!
// Обновляем импорт интерфейса
import {
    AddRatingInput,
    IAddRatingHandler,
} from '../interfaces/userRating.interface';
import { ILevel } from '../../models/Level';

export class AddRatingHandler implements IAddRatingHandler {
    constructor(
        private telegramUserModel: Model<TelegramUserDocument>,
        private logger: Logger,
    ) {}

    private getLevelName(
        level: Types.ObjectId | ILevel | null | undefined,
    ): string {
        // Эта функция остается без изменений
        if (
            level &&
            typeof level === 'object' &&
            !(level instanceof Types.ObjectId) &&
            'name' in level
        ) {
            return String(level.name);
        }
        if (level instanceof Types.ObjectId) {
            return `Unpopulated Level (${level.toString()})`;
        }
        return 'N/A';
    }

    async execute(input: AddRatingInput): Promise<TelegramUserDocument> {
        // Деструктурируем обновленный input
        const { userObjectId, amount } = input; // <-- ИЗМЕНЕНО
        this.logger.info(
            // Обновляем лог
            `Executing AddRatingHandler: Adding ${amount} rating points to user ObjectId ${userObjectId}.`, // <-- ИЗМЕНЕНО
        );

        // 1. Валидация входных данных
        if (typeof amount !== 'number') {
            throw new ValidationError(
                'Количество очков рейтинга должно быть числом.',
            );
        }
        // Добавляем проверку ObjectId
        if (!Types.ObjectId.isValid(userObjectId)) {
            throw new ValidationError(
                'Неверный формат ID пользователя (ObjectId).',
            );
        }

        try {
            // 2. Проверка существования пользователя по ObjectId
            // Используем _id вместо id
            const userExists = await this.telegramUserModel.exists({
                _id: userObjectId,
            }); // <-- ИЗМЕНЕНО
            if (!userExists) {
                this.logger.warn(
                    // Обновляем лог/ошибку
                    `User ObjectId ${userObjectId} not found during rating update attempt (pre-check).`, // <-- ИЗМЕНЕНО
                );
                throw new UserNotFoundError(
                    // Обновляем ошибку
                    `Пользователь с ObjectId ${userObjectId} не найден для обновления рейтинга.`, // <-- ИЗМЕНЕНО
                );
            }

            // 3. Обновление рейтинга по ObjectId и получение пользователя
            const updatedUser = await this.telegramUserModel
                .findOneAndUpdate(
                    { _id: userObjectId }, // <-- ИЗМЕНЕНО: ищем по _id
                    { $inc: { rating: amount } },
                    { new: true, runValidators: true },
                )
                .populate('level')
                .exec();

            // 4. Проверка, что пользователь был найден и обновлен
            if (!updatedUser) {
                this.logger.error(
                    // Обновляем лог/ошибку
                    `User ObjectId ${userObjectId} not found during findOneAndUpdate, despite exists check.`, // <-- ИЗМЕНЕНО
                );
                throw new UserNotFoundError(
                    // Обновляем ошибку
                    `Пользователь с ObjectId ${userObjectId} не найден после попытки обновления рейтинга.`, // <-- ИЗМЕНЕНО
                );
            }

            // Обновляем лог с ID пользователя (можно использовать updatedUser.id, если он нужен в логе)
            this.logger.info(
                `User ObjectId ${userObjectId} (TG ID: ${updatedUser.id}) rating updated to ${updatedUser.rating}. Current level: ${this.getLevelName(updatedUser.level)}`, // <-- ИЗМЕНЕНО + добавлено TG ID для информации
            );

            // 5. Вызов метода модели для обновления уровня - остается без изменений
            await updatedUser.updateLevel();
            this.logger.debug(
                `Checked/Updated level for user ObjectId ${userObjectId} (TG ID: ${updatedUser.id}) after rating change. New level: ${this.getLevelName(updatedUser.level)}`, // <-- ИЗМЕНЕНО + добавлено TG ID
            );

            // 6. Возвращаем успешно обновленного пользователя
            return updatedUser;
        } catch (error: any) {
            // 7. Обработка всех ошибок
            this.logger.error(
                // Обновляем лог
                `Error in AddRatingHandler for user ObjectId ${userObjectId}: ${error.message}`, // <-- ИЗМЕНЕНО
                { error },
            );

            // Пробрасываем ошибки - тексты ошибок обновлены выше
            if (
                error instanceof UserNotFoundError ||
                error instanceof ValidationError ||
                error instanceof LevelUpdateError
            ) {
                throw error;
            }
            if (error.name === 'ValidationError') {
                throw new ValidationError(
                    `Ошибка валидации при обновлении рейтинга: ${error.message}`,
                );
            }
            throw new DatabaseError(
                `Не удалось обновить рейтинг пользователя: ${error.message}`,
            );
        }
    }
}
