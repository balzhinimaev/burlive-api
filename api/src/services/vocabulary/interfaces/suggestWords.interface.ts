// src/services/vocabulary/interfaces/suggestWords.interface.ts
import { Types } from 'mongoose';
import {
    IAcceptedWordBuryat,
    IAcceptedWordRussian,
    ISuggestedWordBuryat,
    ISuggestedWordRussian,
    SuggestionInput,
    SuggestWordResultItem,
} from '../../../types/vocabulary.types';

// import { ISuggestedWordRussian } from '../models/Vocabulary/SuggestedWordModelRussian';
// import { ISuggestedWordBuryat } from '../models/Vocabulary/SuggestedWordModelBuryat';

// --- ЛОКАЛЬНЫЕ Lean Type Definitions (для type casting внутри хендлера) ---
/**
 * Представляют собой "облегченные" (lean) версии Mongoose-документов,
 * содержащие только необходимые поля в виде простых JS-объектов.
 * Используются для оптимизации (меньше данных из БД) и упрощения работы
 * с результатами запросов `.lean()`.
 */
// Они должны соответствовать структуре LeanWordResultType из интерфейса
type LeanAcceptedRussian = Omit<
    IAcceptedWordRussian,
    'translations' | 'translations_u' | 'author' | 'contributors' | 'themes'
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
    IAcceptedWordBuryat,
    | 'translations'
    | 'translations_u'
    | 'author'
    | 'contributors'
    | 'themes'
    | 'dialect'
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
    ISuggestedWordRussian,
    'pre_translations' | 'author' | 'contributors' | 'themes'
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
    ISuggestedWordBuryat,
    'pre_translations' | 'author' | 'contributors' | 'themes' | 'dialect'
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
// --- Конец Lean Type Definitions ---

/**
 * Интерфейс для обработчика предложений слов.
 */
interface ISuggestWordsHandler {
    /**
     * Обрабатывает входящий запрос на предложение одного или нескольких слов.
     * @param input - Входные данные (текст, язык, ID пользователя, диалект).
     * @returns Массив результатов обработки для каждого предложенного слова.
     */
    execute(input: SuggestionInput): Promise<SuggestWordResultItem[]>;
}

export { ISuggestWordsHandler };
export { LeanAcceptedBuryat, LeanAcceptedRussian } 
export { LeanSuggestedBuryat, LeanSuggestedRussian }

export {
    IAcceptedWordRussian,
    IAcceptedWordBuryat,
    ISuggestedWordRussian,
    ISuggestedWordBuryat,
};