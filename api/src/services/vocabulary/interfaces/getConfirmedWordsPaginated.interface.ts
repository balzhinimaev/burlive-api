// src/services/vocabulary/interfaces/getConfirmedWordsPaginated.interface.ts
import { PaginatedResult } from '../../../types/common.types';
import { AcceptedWordType } from '../../../types/vocabulary.types';

export interface GetConfirmedWordsPaginatedInput {
    page: number;
    limit: number;
    language: 'russian' | 'buryat'; // Делаем язык обязательным здесь (см. пункт 3)
}

export interface IGetConfirmedWordsPaginatedHandler {
    execute(
        input: GetConfirmedWordsPaginatedInput,
    ): Promise<PaginatedResult<AcceptedWordType>>;
}
