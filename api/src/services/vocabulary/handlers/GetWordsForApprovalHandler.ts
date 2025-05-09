/**
 * @file Обработчик для получения списка предложенных слов на утверждение с пагинацией.
 * @location src/services/vocabulary/handlers/GetWordsForApprovalHandler.ts
 */

import { FilterQuery } from 'mongoose'; // Import Model type
import logger from '../../../utils/logger';
import { PaginatedResult } from '../../../types/common.types';
import { ApprovalWordType } from '../../../types/vocabulary.types';
import SuggestedWordBuryat from '../../../models/Vocabulary/SuggestedWordModelBuryat';
import SuggestedWordRussian from '../../../models/Vocabulary/SuggestedWordModelRussian';
import { DatabaseError } from '../../../errors/customErrors';
import { isError } from '../../../utils/typeGuards';
import {
    IGetWordsForApprovalHandler,
    GetWordsForApprovalInput,
} from '../interfaces/getWordsForApproval.interface';

export class GetWordsForApprovalHandler implements IGetWordsForApprovalHandler {
    private readonly log = logger;

    constructor() {
        this.log.info('GetWordsForApprovalHandler instance created.');
    }

    async execute(
        input: GetWordsForApprovalInput,
    ): Promise<PaginatedResult<ApprovalWordType>> {
        const { page = 1, limit = 10, language } = input;
        this.log.info(
            `Handler executing GetWordsForApproval: Lang=${language}, Page=${page}, Limit=${limit}`,
        );

        try {
            const skip = (page - 1) * limit;
            const query: FilterQuery<ApprovalWordType> = { status: 'new' };

            // Эти переменные будут заполнены внутри if/else
            let totalWords: number;
            let words: ApprovalWordType[];

            const populateAuthor = {
                path: 'author',
                select: '_id id firstName username',
            };
            const populatePreTranslations = {
                path: 'pre_translations',
                select: '_id text language',
            };

            // Выполняем запросы непосредственно с нужной моделью
            if (language === 'buryat') {
                // Используем напрямую SuggestedWordBuryat
                totalWords = await SuggestedWordBuryat.countDocuments(query);
                words = await SuggestedWordBuryat.find(query)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate(populateAuthor)
                    .populate(populatePreTranslations)
                    // Приводим результат к ApprovalWordType[], так как lean() возвращает простые объекты
                    .lean<ApprovalWordType[]>();
            } else {
                // language === 'russian'
                // Используем напрямую SuggestedWordRussian
                totalWords = await SuggestedWordRussian.countDocuments(query);
                words = await SuggestedWordRussian.find(query)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate(populateAuthor)
                    .populate(populatePreTranslations)
                    // Приводим результат к ApprovalWordType[]
                    .lean<ApprovalWordType[]>();
            }

            this.log.info(
                `Handler GetWordsForApproval found ${words.length} words (Total: ${totalWords}) for ${language}.`,
            );

            return {
                items: words,
                totalItems: totalWords,
                currentPage: page,
                totalPages: Math.ceil(totalWords / limit),
            };
        } catch (error: unknown) {
            const message = isError(error)
                ? error.message
                : 'Unknown database error occurred';
            this.log.error(
                `Handler GetWordsForApproval failed for language ${language}: ${message}`,
                error,
            );
            throw new DatabaseError(
                `Failed to retrieve words for approval for language ${language}. Reason: ${message}`,
            );
        }
    }
}
