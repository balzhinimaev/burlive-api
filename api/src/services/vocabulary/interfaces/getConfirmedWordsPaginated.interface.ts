// src/services/vocabulary/interfaces/getConfirmedWordsPaginated.interface.ts
import { Model } from 'mongoose';
import { PaginatedResult } from '../../../types/common.types';
import { AcceptedWordType, IAcceptedWordBuryat, IAcceptedWordRussian } from '../../../types/vocabulary.types';
import logger from '../../../utils/logger';

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

// Интерфейс для зависимостей конструктора
export interface GetConfirmedWordsPaginatedHandlerDeps {
    acceptedWordRussianModel: Model<IAcceptedWordRussian>;
    acceptedWordBuryatModel: Model<IAcceptedWordBuryat>;
    logger: typeof logger;
}