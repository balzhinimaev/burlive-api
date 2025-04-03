import { ClientSession, Types } from "mongoose";
import { TelegramUserDocument } from "../../models/TelegramUsers";

// Входные данные для операции добавления рейтинга
export interface AddRatingInput {
    userObjectId: Types.ObjectId; // Telegram ID пользователя
    amount: number; // Количество очков (может быть отрицательным)
    session?: ClientSession;
}

// Интерфейс обработчика/сервиса
export interface IAddRatingHandler {
    /**
     * Добавляет (или вычитает) очки рейтинга пользователю и обновляет его уровень.
     * @param input - Данные для обновления рейтинга (ID пользователя и количество очков).
     * @returns Обновленный документ пользователя.
     * @throws ValidationError если amount не число.
     * @throws UserNotFoundError если пользователь не найден.
     * @throws LevelUpdateError если произошла ошибка при обновлении уровня пользователя.
     * @throws DatabaseError при других ошибках базы данных.
     */
    execute(input: AddRatingInput): Promise<TelegramUserDocument>;
}