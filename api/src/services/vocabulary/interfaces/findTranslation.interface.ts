// src/services/vocabulary/interfaces/findTranslation.interface.ts
import { TranslationResult } from '../../../types/vocabulary.types'; // Убедись, что путь правильный

// Входные данные для поиска перевода
export interface FindTranslationInput {
    userInput: string;
    targetLanguage: 'russian' | 'buryat';
    sourceLanguage: 'russian' | 'buryat';
    telegramUserId: number; // Используем ID, как в оригинальном методе
}

// Интерфейс обработчика
export interface IFindTranslationHandler {
    execute(input: FindTranslationInput): Promise<TranslationResult>;
}
