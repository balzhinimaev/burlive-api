// src/services/vocabularyService.ts
// import mongoose, { FilterQuery } from 'mongoose';
import logger from '../../utils/logger';

import { PaginatedResult } from '../../types/common.types';
import {
    AcceptedWordType,
    ApprovalWordType,
    GetSearchHistoryInput,
    SearchHistoryItem,
    SuggestionInput,
    SuggestTranslationInput,
    SuggestTranslationResult,
    TranslationResult,
} from '../../types/vocabulary.types';
import {
    GetSuggestedWordByIdInput,
    SuggestedWordDetailsType,
} from '../../types/vocabulary.types';
import { IGetSuggestedWordByIdHandler } from './interfaces/getSuggestedWordById.interface';
import { isError } from '../../utils/typeGuards';

import { ISuggestWordsHandler, SuggestWordResultItem } from './handlers/interfaces';
import { AcceptSuggestionInput, IAcceptanceService } from '../interfaces/acceptanceService.interface';
import {
    IGetWordsForApprovalHandler,
    GetWordsForApprovalInput,
} from './interfaces/getWordsForApproval.interface';
import { DeclineSuggestionInput, IDeclineSuggestionHandler } from './interfaces/declineSuggestion.interface';
import { FindTranslationInput, IFindTranslationHandler } from './interfaces/findTranslation.interface';
import { ISuggestTranslationHandler } from './interfaces/suggestTranslation.interface';
import { GetConfirmedWordInput, IGetConfirmedWordHandler } from './interfaces/getConfirmedWord.interface';
// import { GetConfirmedWordsPaginatedHandler } from './handlers/getConfirmedWordsPaginatedHandler';
import { GetConfirmedWordsPaginatedInput, IGetConfirmedWordsPaginatedHandler } from './interfaces/getConfirmedWordsPaginated.interface';
import { IGetSearchHistoryHandler } from './interfaces/getSearchHistory.interface';
// import { IAddRatingHandler } from '../interfaces/userRating.interface';
import {
    ISearchPartialWordsHandler,
    SearchPartialInput,
} from './interfaces/searchPartialWords.interface';

// --- Service Class ---
class VocabularyService {
    // Сервис теперь зависит от АБСТРАКЦИИ (интерфейса)
    constructor(
        private readonly getWordsForApprovalHandler: IGetWordsForApprovalHandler,
        private readonly suggestWordsHandler: ISuggestWordsHandler,
        private readonly acceptanceService: IAcceptanceService,
        // private readonly addRatingHandler: IAddRatingHandler,
        // Сюда можно добавить другие обработчики, когда вы их создадите
        // private readonly suggestTranslationHandler: ISuggestTranslationHandler,
        private readonly declineSuggestionHandler: IDeclineSuggestionHandler,
        private readonly findTranslationHandler: IFindTranslationHandler,
        private readonly suggestTranslationHandler: ISuggestTranslationHandler,
        private readonly getConfirmedWordHandler: IGetConfirmedWordHandler,
        private readonly getConfirmedWordsPaginatedHandler: IGetConfirmedWordsPaginatedHandler,
        private readonly getSearchHistoryHandler: IGetSearchHistoryHandler,
        private readonly searchPartialWordsHandler: ISearchPartialWordsHandler,
        private readonly getSuggestedWordByIdHandler: IGetSuggestedWordByIdHandler,
        // ...
        // А также другие прямые зависимости, если они нужны самому сервису (маловероятно при таком подходе)
        private readonly log: typeof logger,
    ) {
        this.log.info('VocabularyService instance created with dependencies.');
    }

    /**
     * Gets a specific confirmed word by ID or a random one by delegating to GetConfirmedWordHandler.
     *
     * @param {string} [wordId] - Optional ID of the word to retrieve. If omitted, a random word is fetched.
     * @returns {Promise<AcceptedWordType | null>} A promise resolving to the found word or null.
     * @throws {ValidationError} If the provided wordId has an invalid format (thrown by handler).
     * @throws {DatabaseError} If a database operation fails during the process (thrown by handler).
     * @throws {NotFoundError} Potentially, if the handler is modified to throw this when ID not found.
     * @throws {Error} Any other unexpected error during execution.
     */
    async getConfirmedWord(wordId?: string): Promise<AcceptedWordType | null> {
        this.log.info(
            `VocabularyService: Delegating getConfirmedWord for wordId: ${wordId || 'random'}...`,
        );
        try {
            // Создаем входные данные для обработчика
            const input: GetConfirmedWordInput = { wordId };
            // Вызываем метод execute соответствующего обработчика
            return await this.getConfirmedWordHandler.execute(input);
        } catch (error: unknown) {
            // Логируем ошибку на уровне фасада (сервиса) и перебрасываем ее
            // Обработчик уже должен был залогировать детали и выбросить специфичную ошибку
            const message = isError(error)
                ? error.message
                : 'Unknown error during getConfirmedWord delegation.';
            this.log.error(
                `VocabularyService: Error during getConfirmedWord execution for wordId ${wordId || 'random'}: ${message}`,
                error, // Логируем сам объект ошибки
            );

            // Перебрасываем оригинальную ошибку для обработки выше
            throw error;
        }
    }

    /**
     * Получает список предложенных слов, ожидающих утверждения, для указанного языка.
     * Делегирует выполнение операции соответствующему обработчику.
     *
     * @async
     * @param {number} [page=1] - Номер запрашиваемой страницы пагинации (начиная с 1).
     * @param {number} [limit=10] - Количество элементов на одной странице.
     * @param {'russian' | 'buryat'} language - Язык предложенных слов ('russian' или 'buryat').
     * @returns {Promise<PaginatedResult<ApprovalWordType>>} Promise, который разрешается
     *          объектом пагинации, содержащим список слов (`items`) и метаданные пагинации
     *          (`totalItems`, `currentPage`, `totalPages`).
     * @throws {DatabaseError} Если происходит ошибка при запросе к базе данных внутри обработчика.
     * @throws {Error} Любые другие ошибки, которые могут возникнуть при выполнении.
     */
    async getWordsForApproval(
        page: number = 1,
        limit: number = 10,
        language: 'russian' | 'buryat',
    ): Promise<PaginatedResult<ApprovalWordType>> {
        this.log.info(
            `VocabularyService: Delegating getWordsForApproval. Lang=${language}, Page=${page}, Limit=${limit}`,
        );
        try {
            // Создаем входные данные для обработчика
            const input: GetWordsForApprovalInput = { page, limit, language };
            // Вызываем метод execute соответствующего обработчика
            return await this.getWordsForApprovalHandler.execute(input);
        } catch (error: unknown) {
            // Логируем ошибку на уровне фасада и перебрасываем ее
            // Обработчик уже должен был выбросить специфичную ошибку (например, DatabaseError)
            this.log.error(
                `VocabularyService: Error during getWordsForApproval execution for ${language}: ${error}`,
                error, // Логируем сам объект ошибки
            );
            // Перебрасываем ошибку для обработки выше (например, в контроллере API)
            throw error;
        }
    }

    /**
     * Accepts a suggested word/translation by delegating to AcceptanceService.
     */
    async acceptSuggestion(
        input: AcceptSuggestionInput,
    ): Promise<AcceptedWordType> {
        this.log.info(
            `VocabularyService.acceptSuggestion called, delegating to acceptanceService...`,
        );
        try {
            // Используем внедренный сервис
            return await this.acceptanceService.execute(input);
        } catch (error) {
            this.log.error(
                `Error during acceptSuggestion execution (caught in facade): ${error}`,
            );
            throw error;
        }
    }

    /**
     * Declines a suggested word/translation by delegating to DeclineSuggestionHandler.
     *
     * @param {DeclineSuggestionInput} input - The input data for declining the suggestion.
     * @returns {Promise<void>} A promise that resolves when the operation is complete.
     * @throws {NotFoundError} If the suggested word or moderator is not found.
     * @throws {DatabaseError} If a database operation fails during the process.
     * @throws {Error} Any other unexpected error during execution.
     */
    async declineSuggestion(input: DeclineSuggestionInput): Promise<void> {
        this.log.info(
            `VocabularyService: Delegating declineSuggestion for word ${input.suggestedWordId} (lang: ${input.language})...`,
        );
        try {
            // Делегируем выполнение соответствующему обработчику
            await this.declineSuggestionHandler.execute(input);
            this.log.info(
                `VocabularyService: Successfully delegated decline for suggestion ${input.suggestedWordId}.`,
            );
        } catch (error) {
            // Логируем ошибку на уровне фасада и перебрасываем ее
            this.log.error(
                `VocabularyService: Error during declineSuggestion for ${input.suggestedWordId}: ${error}`,
                error, // Логируем сам объект ошибки
            );
            // Перебрасываем ошибку для обработки выше (например, в контроллере API)
            throw error;
        }
    }
    /**
     * Suggests one or more new words. Checks accepted and suggested words first.
     * (Переработанная версия с учетом типизации и разделения моделей)
     */
    // --- suggestWords теперь просто делегирует вызов ---
    async suggestWords(
        input: SuggestionInput,
    ): Promise<SuggestWordResultItem[]> {
        this.log.info(
            `VocabularyService.suggestWords called, delegating to handler...`,
        );
        // Вызываем метод execute у ВНЕДРЕННОГО экземпляра
        // Обертываем в try/catch на случай, если хотим добавить логику обработки ошибок на уровне фасада
        try {
            return await this.suggestWordsHandler.execute(input);
        } catch (error) {
            this.log.error(
                `Error during suggestWords execution (caught in facade): ${error}`,
            );
            // Перебрасываем ошибку дальше, чтобы контроллер мог её стандартно обработать
            throw error;
        }
    }

    async suggestTranslation(
        input: SuggestTranslationInput,
    ): Promise<SuggestTranslationResult> {
        this.log.info(
            `VocabularyService: Delegating suggestTranslation for wordId ${input.wordId}`,
        );
        try {
            const result = await this.suggestTranslationHandler.execute(input);
            this.log.info(
                `VocabularyService: SuggestTranslation completed with status: ${result.status}`,
            );
            return result;
        } catch (error: unknown) {
            // Логируем ошибку на уровне сервиса перед тем, как пробросить ее выше
            const message =
                error instanceof Error
                    ? error.message
                    : 'Unknown error during suggestTranslation';
            this.log.error(
                `VocabularyService: Error during suggestTranslation: ${message}`,
                { input, error },
            );
            throw error; // Пробрасываем ошибку дальше (например, в контроллер)
        }
    }

    /**
     * Finds translation by delegating to the FindTranslationHandler.
     * Updates search history via the handler.
     * @param {FindTranslationInput} input - The input containing user text, languages, and user ID.
     * @returns {Promise<TranslationResult>} A promise resolving to the translation result object.
     * @throws {NotFoundError} If the user specified by telegramUserId is not found (thrown by handler).
     * @throws {Error} Any other unexpected error during execution (re-thrown from handler or service).
     */
    async findTranslation(
        input: FindTranslationInput, // Используем импортированный тип
    ): Promise<TranslationResult> {
        this.log.info(
            `VocabularyService: Delegating findTranslation for "${input.userInput}" (target: ${input.targetLanguage})...`,
        );
        try {
            // Просто делегируем вызов соответствующему обработчику
            // Обработчик сам отвечает за логику поиска, обновления истории и обработку ошибок API/DB
            return await this.findTranslationHandler.execute(input);
        } catch (error: unknown) {
            // Логируем ошибку на уровне фасада (сервиса) и перебрасываем ее
            // Обработчик уже должен был залогировать детали и, возможно, выбросить специфичную ошибку (например, NotFoundError)
            const message = isError(error)
                ? error.message
                : 'Unknown error during findTranslation delegation.';
            this.log.error(
                `VocabularyService: Error during findTranslation execution for "${input.userInput}": ${message}`,
                error, // Логируем сам объект ошибки
            );

            // Перебрасываем ошибку для обработки выше (например, в контроллере API)
            // Если обработчик вернул результат с ошибкой Burlang (не бросил исключение),
            // то он дойдет до return выше. Сюда попадают только брошенные исключения.
            if (error instanceof Error) {
                // Проверяем, что это объект ошибки
                throw error;
            } else {
                // Если это не объект Error, создаем новый для единообразия
                throw new Error(
                    `An unexpected non-error value was thrown during findTranslation: ${error}`,
                );
            }
        }
    }

    /**
     * Retrieves confirmed words with pagination. Requires language filter.
     */
    async getConfirmedWordsPaginated(
        input: GetConfirmedWordsPaginatedInput,
    ): Promise<PaginatedResult<AcceptedWordType>> {
        this.log.info(
            `VocabularyService: Delegating getConfirmedWordsPaginated. Lang=${input.language}, Page=${input.page || 1}, Limit=${input.limit || 10}`,
        );
        try {
            // Вызываем execute у внедренного обработчика (тип свойства теперь интерфейс)
            return await this.getConfirmedWordsPaginatedHandler.execute(input);
        } catch (error: unknown) {
            this.log.error(
                `VocabularyService: Error during getConfirmedWordsPaginated execution: ${error}`,
                error,
            );
            throw error;
        }
    }

    /**
     * Retrieves the search history for a specific user with pagination.
     * Delegates execution to the GetSearchHistoryHandler.
     *
     * @param {GetSearchHistoryInput} input - Input containing telegramUserId, page, and limit.
     * @returns {Promise<PaginatedResult<SearchHistoryItem>>} Paginated search history items.
     * @throws {NotFoundError} If the user is not found (thrown by handler).
     * @throws {DatabaseError} If a database operation fails (thrown by handler).
     * @throws {Error} Any other unexpected error.
     */
    async getSearchHistory(
        input: GetSearchHistoryInput,
    ): Promise<PaginatedResult<SearchHistoryItem>> {
        this.log.info(
            `VocabularyService: Delegating getSearchHistory for user ${input.telegramUserId}...`,
        );
        try {
            // Делегируем вызов соответствующему обработчику
            return await this.getSearchHistoryHandler.execute(input);
        } catch (error: unknown) {
            // Логируем ошибку на уровне фасада (сервиса) и перебрасываем ее
            const message = isError(error)
                ? error.message
                : 'Unknown error during getSearchHistory delegation.';
            this.log.error(
                `VocabularyService: Error during getSearchHistory execution for user ${input.telegramUserId}: ${message}`,
                error,
            );
            // Перебрасываем оригинальную ошибку для обработки выше
            throw error;
        }
    }

    /**
     * НОВЫЙ МЕТОД: Ищет подтвержденные слова по началу строки (префиксу).
     * Делегирует выполнение соответствующему обработчику.
     *
     * @param {SearchPartialInput} input - Параметры поиска: query, language, limit.
     * @returns {Promise<AcceptedWordType[]>} Promise, который разрешается массивом найденных слов.
     * @throws {Error} Любые ошибки, которые могут возникнуть при выполнении (перебрасываются из обработчика).
     */
    async searchPartialWords(
        input: SearchPartialInput,
    ): Promise<AcceptedWordType[]> {
        this.log.info(
            `VocabularyService: Delegating partial search for query "${input.query}" (lang: ${input.language}, limit: ${input.limit})...`,
        );
        try {
            // Просто делегируем вызов соответствующему обработчику
            return await this.searchPartialWordsHandler.execute(input);
        } catch (error: unknown) {
            // Логируем ошибку на уровне фасада (сервиса) и перебрасываем ее
            const message = isError(error)
                ? error.message
                : 'Unknown error during partial search delegation.';
            this.log.error(
                `VocabularyService: Error during partial search execution for query "${input.query}": ${message}`,
                error, // Логируем сам объект ошибки
            );

            // Перебрасываем оригинальную ошибку для обработки выше (например, в контроллере API)
            throw error; // Важно перебросить ошибку, чтобы контроллер вернул корректный статус
        }
    }

    /**
     * Gets a specific suggested word by ID and language by delegating to GetSuggestedWordByIdHandler.
     */
    async getSuggestedWordById(
        input: GetSuggestedWordByIdInput,
    ): Promise<SuggestedWordDetailsType | null> {
        this.log.info(
            `VocabularyService: Delegating getSuggestedWordById for ID: ${input.id}, Lang: ${input.language}...`,
        );
        try {
            // Делегируем вызов соответствующему обработчику
            return await this.getSuggestedWordByIdHandler.execute(input);
        } catch (error: unknown) {
            const message = isError(error)
                ? error.message
                : 'Unknown error during getSuggestedWordById delegation.';
            this.log.error(
                `VocabularyService: Error during getSuggestedWordById for ID ${input.id}, Lang: ${input.language}: ${message}`,
                error,
            );
            throw error; // Перебрасываем ошибку для обработки выше
        }
    }
}

// Вместо этого экспортируем сам класс, чтобы его можно было использовать в Composition Root
export { VocabularyService };