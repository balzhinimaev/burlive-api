// src/services/vocabulary/interfaces/searchPartialWords.interface.ts
import { AcceptedWordType } from '../../../types/vocabulary.types';

// Входные данные остаются теми же
export interface SearchPartialInput {
    query: string;
    language: 'russian' | 'buryat';
    limit: number;
}

// Интерфейс для обработчика
export interface ISearchPartialWordsHandler {
    execute(input: SearchPartialInput): Promise<AcceptedWordType[]>;
}
