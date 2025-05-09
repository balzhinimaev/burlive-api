// src/types/vocabulary.types.ts

// Импортируем КОНКРЕТНЫЕ, ПЕРЕИМЕНОВАННЫЕ интерфейсы из файлов моделей
import { IAcceptedWordRussian } from '../models/Vocabulary/AcceptedWordRussian';
import { IAcceptedWordBuryat } from '../models/Vocabulary/AcceptedWordBuryat';
import { ISuggestedWordRussian } from '../models/Vocabulary/SuggestedWordModelRussian';
import { ISuggestedWordBuryat } from '../models/Vocabulary/SuggestedWordModelBuryat';
import { Types } from 'mongoose';
import { LeanWordResultType } from '../services/vocabulary/handlers/interfaces';

// --- Основные типы данных (Объединенные типы) ---
// Объединение базовых интерфейсов + обязательное поле _id + опциональное __v
export type AcceptedWordType = (IAcceptedWordRussian | IAcceptedWordBuryat) & {
    _id: Types.ObjectId;
    __v?: number; // __v обычно присутствует в lean-объектах
    // Можно добавить createdAt/updatedAt если они используются и возвращаются lean
    createdAt?: Date;
    updatedAt?: Date;
};

export type SuggestedWordType = ISuggestedWordRussian | ISuggestedWordBuryat;
export type ApprovalWordType = ISuggestedWordRussian | ISuggestedWordBuryat; // Для getWordsForApproval

// --- Типы для результатов методов ---
export type SuggestTranslationResult = {
    status: 'newly_suggested' | 'suggestion_updated' | 'already_accepted';
    word: SuggestedWordType | AcceptedWordType; // Используем объединенные типы
};

export interface TranslationResult {
    burlangdb: string | null;
    burlivedb: AcceptedWordType | null;
}

// Тип для элемента результата suggestWords (перенесен из handler/interfaces.ts для централизации)
export type SuggestWordResultItem = {
    message: string;
    word?: LeanWordResultType;
    originalWord?: string;
    status:
        | 'accepted_exists'
        | 'suggested_exists'
        | 'newly_suggested'
        | 'error';
};

// --- Типы для входных данных методов (без изменений) ---
export interface SuggestionInput {
    text: string;
    language: 'russian' | 'buryat';
    telegramUserId: number;
    dialect?: string;
}

export interface SuggestTranslationInput {
    wordId: string; // Может быть Types.ObjectId или string
    sourceLanguage: 'russian' | 'buryat';
    translationText: string;
    telegramUserId: number;
    dialect?: string;
}

export interface FindTranslationInput {
    userInput: string;
    targetLanguage: 'russian' | 'buryat';
    sourceLanguage: 'russian' | 'buryat';
    telegramUserId: number;
}


// Тип для данных об искомом слове, которые мы будем включать в историю
interface SearchedWordDetails {
    _id: Types.ObjectId;
    text: string;
    normalized_text: string;
    language: 'russian' | 'buryat'; // Указываем язык этого слова
}
// Тип для данных о найденном переводе (только основное)
export interface FoundTranslationDetails { // <-- ДОБАВЛЕН ЭКСПОРТИРУЕМЫЙ ТИП
    _id: Types.ObjectId;
    text: string;
    // При необходимости можно добавить другие поля, например, язык
}

// Обновляем тип для элемента истории поиска
export interface SearchHistoryItem {
    _id: Types.ObjectId; // ID самой записи истории
    searchedWord: SearchedWordDetails | null; // Детали искомого слова
    targetLanguage: 'russian' | 'buryat'; // Язык, на который искали перевод
    foundTranslation: FoundTranslationDetails | null; // Найденный перевод (или null) <-- ИЗМЕНЕНО
    createdAt: Date; // Время поиска
}
// Тип для одного элемента в результатах истории поиска
// Тип для входных данных handler'а
export interface GetSearchHistoryInput {
    telegramUserId: number;
    page?: number;
    limit?: number;
}

// Можно также переэкспортировать конкретные типы, если они нужны где-то еще напрямую
// Можно также переэкспортировать конкретные типы, если они нужны где-то еще напрямую
export {
    IAcceptedWordRussian,
    IAcceptedWordBuryat,
    ISuggestedWordRussian,
    ISuggestedWordBuryat, SearchedWordDetails,
};
