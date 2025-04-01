// src/services/vocabulary/interfaces/declineSuggestion.interface.ts
import { Types } from 'mongoose';
// --- Импортируем обновленный тип документа из модели ---
import { DeclinedWordDocument } from '../../../models/Vocabulary/DeclinedWordModel';
// --- Конец импорта ---

/**
 * Входные данные для операции отклонения предложенного слова.
 */
export interface DeclineSuggestionInput {
    /** ObjectId предложенного слова. */
    suggestedWordId: string | Types.ObjectId;
    /** Язык предложенного слова ('russian' или 'buryat'). Важно для поиска в правильной коллекции. */
    language: 'russian' | 'buryat';
    /** Telegram ID модератора, отклоняющего слово. */
    moderatorTelegramId: number;
    /** Причина отклонения (опционально). */
    reason?: string;
}

/**
 * Результат операции отклонения (если бы метод execute его возвращал).
 * Использует обновленный тип DeclinedWordDocument.
 */
export interface DeclineSuggestionResult {
    success: boolean;
    declinedWord?: DeclinedWordDocument; // Тип взят из обновленной модели
}

/**
 * Интерфейс для обработчика, отвечающего за логику отклонения предложенного слова.
 */
export interface IDeclineSuggestionHandler {
    /**
     * Выполняет операцию отклонения предложенного слова.
     * Перемещает данные из коллекции предложенных в коллекцию отклоненных,
     * обновляет связи в принятых словах и удаляет исходное предложенное слово.
     * Использует транзакцию Mongoose.
     *
     * @param {DeclineSuggestionInput} input - Входные данные для операции.
     * @returns {Promise<void>} Promise, который разрешается при успешном завершении операции
     *          (или Promise<DeclineSuggestionResult>, если решено возвращать результат).
     * @throws {NotFoundError} Если предложенное слово или модератор не найдены.
     * @throws {DatabaseError} Если происходит ошибка базы данных во время транзакции.
     * @throws {ValidationError} Если входные данные невалидны.
     */
    execute(input: DeclineSuggestionInput): Promise<void>; // Оставляем void пока
}
