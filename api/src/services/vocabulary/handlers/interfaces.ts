// src/services/vocabulary/handlers/interfaces.ts
import { SuggestionInput } from '../../../types/vocabulary.types';
import { Types } from 'mongoose'; // Нужен для ObjectId

// --- Определения Lean-типов (скопируйте из handler или импортируйте из общих типов) ---
// Эти типы описывают *простые объекты*, возвращаемые .lean() или .toObject()

// Определяем базовые интерфейсы для Mongoose документов (если их еще нет в types)
interface IAcceptedWordRussianBase {
    text: string;
    normalized_text: string;
    contributors?: Types.ObjectId[] /* ... другие общие поля ... */;
}
interface IAcceptedWordBuryatBase extends IAcceptedWordRussianBase {
    dialect?: Types.ObjectId | null;
}
interface ISuggestedWordRussianBase {
    text: string;
    normalized_text: string;
    contributors?: Types.ObjectId[];
    pre_translations?: Types.ObjectId[] /* ... */;
}
interface ISuggestedWordBuryatBase extends ISuggestedWordRussianBase {
    dialect?: Types.ObjectId | null;
}

// Определяем Lean-типы
type LeanAcceptedRussian = Omit<
    IAcceptedWordRussianBase,
    'translations' | 'translations_u' | 'author' | 'themes'
> & {
    _id: Types.ObjectId;
    translations?: Types.ObjectId[];
    translations_u?: Types.ObjectId[];
    author?: Types.ObjectId;
    contributors?: Types.ObjectId[];
    themes?: Types.ObjectId[];
    __v?: number;
    createdAt?: Date;
    updatedAt?: Date;
};
type LeanAcceptedBuryat = Omit<
    IAcceptedWordBuryatBase,
    'translations' | 'translations_u' | 'author' | 'themes' | 'dialect'
> & {
    _id: Types.ObjectId;
    translations?: Types.ObjectId[];
    translations_u?: Types.ObjectId[];
    author?: Types.ObjectId;
    contributors?: Types.ObjectId[];
    themes?: Types.ObjectId[];
    dialect?: Types.ObjectId | null;
    __v?: number;
    createdAt?: Date;
    updatedAt?: Date;
};
type LeanSuggestedRussian = Omit<
    ISuggestedWordRussianBase,
    'pre_translations' | 'author' | 'themes'
> & {
    _id: Types.ObjectId;
    pre_translations?: Types.ObjectId[];
    author?: Types.ObjectId;
    contributors?: Types.ObjectId[];
    themes?: Types.ObjectId[];
    __v?: number;
    createdAt?: Date;
    updatedAt?: Date;
};
type LeanSuggestedBuryat = Omit<
    ISuggestedWordBuryatBase,
    'pre_translations' | 'author' | 'themes' | 'dialect'
> & {
    _id: Types.ObjectId;
    pre_translations?: Types.ObjectId[];
    author?: Types.ObjectId;
    contributors?: Types.ObjectId[];
    themes?: Types.ObjectId[];
    dialect?: Types.ObjectId | null;
    __v?: number;
    createdAt?: Date;
    updatedAt?: Date;
};

// Объединенный тип для слова в результате
export type LeanWordResultType =
    | LeanAcceptedRussian
    | LeanAcceptedBuryat
    | LeanSuggestedRussian
    | LeanSuggestedBuryat;
// --- Конец определений Lean-типов ---

// Определяем тип элемента результата, использующий Lean-типы
export type SuggestWordResultItem = {
    message: string;
    word?: LeanWordResultType; // <-- Использует Lean тип
    originalWord?: string; // <-- Включает опциональное исходное слово
    status:
        | 'accepted_exists'
        | 'suggested_exists'
        | 'newly_suggested'
        | 'error';
};

// Интерфейс для обработчика предложений слов
export interface ISuggestWordsHandler {
    execute(input: SuggestionInput): Promise<SuggestWordResultItem[]>; // <-- Ожидает правильный тип результата
}

// Сюда же можно будет добавить интерфейсы для других обработчиков
