// src/services/vocabulary/interfaces/getConfirmedWord.interface.ts
import { AcceptedWordType } from '../../../types/vocabulary.types';

/**
 * Входные данные для получения подтвержденного слова.
 */
export interface GetConfirmedWordInput {
    /**
     * ID конкретного слова. Если не указан, будет выбрано случайное слово.
     */
    wordId?: string;
}

/**
 * Интерфейс обработчика для получения подтвержденного слова.
 */
export interface IGetConfirmedWordHandler {
    /**
     * Выполняет логику получения одного подтвержденного слова (по ID или случайно).
     * @param input - Входные данные с опциональным wordId.
     * @returns Promise, разрешающийся найденным словом или null.
     * @throws {ValidationError} Если предоставлен невалидный wordId.
     * @throws {DatabaseError} При ошибках доступа к базе данных.
     * @throws {NotFoundError} Технически может быть выброшен из findById, но чаще вернет null.
     */
    execute(input: GetConfirmedWordInput): Promise<AcceptedWordType | null>;
}
