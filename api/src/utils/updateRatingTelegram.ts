// src/utils/updateRatingTelegram.ts
import logger from './logger';
import TelegramUserModel from '../models/TelegramUsers';
import { Types } from 'mongoose'; // Используем Types.ObjectId для типизации
import { DatabaseError, NotFoundError } from '../errors/customErrors'; // Предполагаем, что у вас есть кастомные ошибки
import { isError } from './typeGuards'; // Предполагаем, что у вас есть type guard

/**
 * Асинхронно обновляет (инкрементирует) рейтинг пользователя Telegram в базе данных.
 *
 * @param userId ObjectId пользователя, чей рейтинг нужно обновить.
 * @param pointsToAdd Количество баллов, на которое нужно увеличить рейтинг (по умолчанию 10). Может быть отрицательным для уменьшения рейтинга.
 * @returns Промис, который разрешается новым значением рейтинга пользователя после обновления.
 * @throws {NotFoundError} Если пользователь с указанным userId не найден.
 * @throws {DatabaseError} Если произошла ошибка при взаимодействии с базой данных.
 * @throws {Error} Если передан некорректный userId.
 */
const updateRating = async (
    userId: Types.ObjectId,
    pointsToAdd: number = 10,
): Promise<number> => {
    // Добавим проверку на валидность userId на всякий случай
    if (!userId) {
        // Выбрасываем ошибку, если userId не передан или некорректен
        throw new Error('Invalid userId provided to updateRating function.');
    }

    // Если добавляемое значение 0, нет смысла делать запрос на обновление
    if (pointsToAdd === 0) {
        logger.warn(
            `Rating update called with 0 points for user ${userId}. Querying current rating.`,
        );
        // Найдем пользователя, чтобы вернуть его текущий рейтинг, как если бы обновление произошло
        const currentUser = await TelegramUserModel.findById(userId)
            .select('rating')
            .lean();
        if (!currentUser) {
            throw new NotFoundError(
                `User with ID ${userId} not found when checking rating (pointsToAdd was 0).`,
            );
        }
        // Возвращаем текущий рейтинг (или 0, если его нет)
        return currentUser.rating ?? 0;
    }

    try {
        const updatedUser = await TelegramUserModel.findByIdAndUpdate(
            userId,
            {
                // Используем $inc для атомарного инкремента/декремента
                $inc: { rating: pointsToAdd },
            },
            {
                new: true, // Вернуть обновленный документ
                select: 'rating', // Выбрать только поле рейтинга для эффективности
            },
            // lean() здесь не обязателен и может не всегда корректно работать с $inc,
            // Mongoose вернет документ с обновленным полем.
        );

        // Проверяем, был ли пользователь найден и обновлен
        if (!updatedUser) {
            // Если документ не найден, findByIdAndUpdate вернет null
            throw new NotFoundError(
                `User with ID ${userId} not found for rating update.`,
            );
        }

        // Успешное обновление
        const newRating = updatedUser.rating ?? 0; // Используем 0, если рейтинг вдруг undefined
        logger.info(
            `User ${userId} rating updated by ${pointsToAdd}. New rating: ${newRating}`,
        );
        // Возвращаем новое значение рейтинга
        return newRating;
    } catch (error: unknown) {
        // Логгируем ошибку
        logger.error(`Error updating rating for user ${userId}:`, error);

        // Если это уже наша ошибка NotFoundError, просто перебрасываем ее
        if (error instanceof NotFoundError) {
            throw error;
        }

        // Оборачиваем другие ошибки в DatabaseError для единообразия
        // (если это не ошибка валидации Mongoose, которую можно обработать иначе)
        const message = isError(error)
            ? error.message
            : 'Unknown database error';
        throw new DatabaseError(
            `Failed to update rating for user ${userId}: ${message}`,
        );
    }
};

export default updateRating;
