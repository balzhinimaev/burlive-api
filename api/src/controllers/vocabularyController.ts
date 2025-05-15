// src/controllers/vocabularyController.ts
import { NextFunction, Request, Response } from 'express';
import logger from '../utils/logger';

// Импортируем только необходимые типы и сервис
import {
    AcceptedWordType,
    FindTranslationInput,
    GetSearchHistoryInput,
    GetSuggestedWordByIdInput,
    SearchHistoryItem,
    SuggestedWordDetailsType,
    SuggestTranslationInput,
    SuggestTranslationResult,
    // Добавьте импорты для типов возвращаемых getAllWords, getAllWordsPaginated, getConfirmedWord, если они определены
} from '../types/vocabulary.types';
import {
    vocabularyServiceInstance as vocabularyService,
    classifierServiceInstance as classifierService,
} from '../compositionRoot';
import { DeclineSuggestionInput } from '../services/vocabulary/interfaces/declineSuggestion.interface';
// NotFoundError и DatabaseError могут быть нужны в центральном обработчике ошибок
import { NotFoundError /*, DatabaseError */ } from '../errors/customErrors';
import { GetConfirmedWordsPaginatedInput } from '../services/vocabulary/interfaces/getConfirmedWordsPaginated.interface';
import { PaginatedResult } from '../types/common.types';
import { SearchPartialInput } from '../services/vocabulary/interfaces/searchPartialWords.interface';
import { IPartOfSpeechClassifier } from '../models/Classifiers/PartOfSpeechClassifierModel';

// --- Интерфейсы для тел запросов ---
interface TranslateWordBody {
    userInput: string;
    targetLanguage: 'russian' | 'buryat';
    sourceLanguage: 'russian' | 'buryat';
    telegramUserId: number; // Стандартизировано
}

interface DeclineSuggestionBody {
    suggestedWordId: string;
    language: 'russian' | 'buryat';
    telegramUserId: number; // Стандартизировано (в контроллере переименовываем в moderatorTelegramId)
    reason?: string;
}

interface SuggestTranslationBody {
    wordId: string;
    targetLanguage: 'russian' | 'buryat';
    translationText: string;
    dialect?: string;
    telegramUserId: number; // Стандартизировано
}

interface SuggestWordsBody {
    text: string;
    language: 'russian' | 'buryat';
    telegramUserId: number; // Стандартизировано
    dialect?: string;
}

interface AcceptSuggestionBody {
    suggestedWordId: string;
    language: 'russian' | 'buryat';
    telegramUserId: number; // Стандартизировано (в контроллере переименовываем в moderatorTelegramId)
}

// --- Контроллер ---
const vocabularyController = {
    /**
     * Получение всех слов.
     * Делегирует выполнение VocabularyService.getAllWords.
     * TODO: Реализовать VocabularyService.getAllWords.
     */
    // getAllWords: async (
    //     _req: Request,
    //     res: Response,
    //     next: NextFunction,
    // ): Promise<void> => {
    //     try {
    //         logger.info('Controller: Requesting all words');
    //         // Вызов гипотетического метода сервиса
    //         const words = await vocabularyService.getAllWords(); // <-- ЗАМЕНИТЬ НА РЕАЛЬНЫЙ МЕТОД СЕРВИСА
    //         logger.info(`Controller: Successfully retrieved all words.`);
    //         res.status(200).json({ message: 'Словарь найден', words });
    //     } catch (error) {
    //         logger.error(`Error in getAllWords controller: ${error}`);
    //         next(error);
    //     }
    // },

    /**
     * Получение одного предложенного слова по ID для рассмотрения.
     */
    getSuggestedWordById: async (
        // Типизация: Params, ResBody, ReqBody, ReqQuery
        req: Request<{ id: string }, {}, {}, { language?: string }>,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        const { id } = req.params;
        // Валидатор уже должен был проверить и преобразовать req.query.language
        const language = req.query.language as 'russian' | 'buryat';

        try {
            logger.info(
                `Controller: Requesting suggested word. ID: ${id}, Language: ${language}`,
            );

            const serviceInput: GetSuggestedWordByIdInput = {
                id,
                language,
            };

            const suggestedWord: SuggestedWordDetailsType | null =
                await vocabularyService.getSuggestedWordById(serviceInput);

            if (!suggestedWord) {
                // Если сервис вернул null, значит слово не найдено
                logger.warn(
                    `Controller: Suggested word with ID ${id} for language ${language} not found by service.`,
                );
                throw new NotFoundError( // Предполагается, что NotFoundError есть
                    `Предложенное слово с ID ${id} для языка ${language} не найдено.`,
                );
            }

            logger.info(
                `Controller: Successfully retrieved suggested word. ID: ${id}, Language: ${language}`,
            );
            res.status(200).json({
                message: 'Предложенное слово найдено.',
                word: suggestedWord,
            });
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : 'Unknown error';
            logger.error(
                `Error in getSuggestedWordById controller for ID ${id}, Lang ${language}: ${message}`,
                error,
            );
            next(error);
        }
    },

    /**
     * НОВЫЙ МЕТОД: Получение подтверждённых слов с пагинацией.
     * Делегирует выполнение VocabularyService.getConfirmedWordsPaginated.
     * Ожидает параметры 'language', 'page', 'limit' в req.query.
     */
    getConfirmedWordsPaginated: async (
        // Типизируем параметры query: <Params, ResBody, ReqBody, ReqQuery>
        req: Request<
            {},
            {},
            {},
            { language?: string; page?: string; limit?: string }
        >,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            // Доверяем валидатору Express, что параметры корректны и существуют
            // (или используем значения по умолчанию, если валидатор не строгий)
            const language = req.query.language as 'russian' | 'buryat'; // Валидатор должен гарантировать тип
            const page = parseInt(req.query.page || '1', 10); // Значение по умолчанию 1
            const limit = parseInt(req.query.limit || '10', 10); // Значение по умолчанию 10

            logger.info(
                `Controller: Requesting confirmed paginated words. Lang=${language}, Page=${page}, Limit=${limit}`,
            );

            // Создаем DTO для сервиса
            const serviceInput: GetConfirmedWordsPaginatedInput = {
                language,
                page,
                limit,
            };

            // Вызываем метод сервиса
            const paginatedResult: PaginatedResult<AcceptedWordType> =
                await vocabularyService.getConfirmedWordsPaginated(
                    serviceInput,
                );

            logger.info(
                `Controller: Successfully retrieved confirmed paginated words. Current page: ${paginatedResult.currentPage}, Total items: ${paginatedResult.totalItems}`,
            );

            // Отправляем успешный ответ
            res.status(200).json({
                message: `Confirmed ${language} words retrieved successfully.`,
                ...paginatedResult, // Отправляем весь объект пагинации
            });
        } catch (error: unknown) {
            // Логируем ошибку и передаем в центральный обработчик
            const message =
                error instanceof Error ? error.message : 'Unknown error';
            logger.error(
                `Error in getConfirmedWordsPaginated controller: ${message}`,
                error,
            );
            next(error);
        }
    },

    /**
     * Получение одного подтверждённого слова (по ID или случайного).
     * Делегирует выполнение VocabularyService.getConfirmedWord.
     */
    getConfirmedWord: async (
        req: Request, // Типизация параметров запроса: <Params, ResBody, ReqBody, ReqQuery>
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        // Получаем wordId из query параметров
        // req.query будет типа ParsedQs, кастуем к string | undefined
        const wordId = req.query.wordId as string | undefined;

        try {
            logger.info(
                `Controller: Requesting confirmed word. ${wordId ? `ID: ${wordId}` : 'Random'}`,
            );

            // Вызываем метод сервиса, передавая wordId (который может быть undefined)
            const word: AcceptedWordType | null =
                await vocabularyService.getConfirmedWord(wordId);

            // Проверяем, вернул ли сервис результат
            if (!word) {
                // Если сервис вернул null, значит слово не найдено (ни по ID, ни случайное)
                // Логируем это
                logger.warn(
                    `Controller: Confirmed word ${wordId ? `with ID ${wordId}` : '(random)'} not found by service.`,
                );
                // Бросаем ошибку NotFoundError, которую поймает центральный обработчик
                throw new NotFoundError(
                    `Подтвержденное слово ${wordId ? `с ID ${wordId}` : ''} не найдено.`,
                );
            }

            // Если слово найдено, логируем успех и отправляем ответ
            logger.info(
                `Controller: Successfully retrieved confirmed word ${wordId ? `with ID ${wordId}` : `(random ID: ${word._id})`}.`,
            );
            res.status(200).json({
                message: 'Подтверждённое слово найдено.',
                word, // Отправляем найденное слово
            });
        } catch (error: unknown) {
            // Логируем ошибку перед передачей в центральный обработчик
            const message =
                error instanceof Error ? error.message : 'Unknown error';
            logger.error(
                `Error in getConfirmedWord controller for wordId [${wordId || 'random'}]: ${message}`,
                error,
            );

            // Передаем ошибку (может быть ValidationError, NotFoundError, DatabaseError или другая)
            // дальше в центральный обработчик ошибок Express
            next(error);
        }
    },
    /**
     * Получение предложенных слов на утверждение с пагинацией.
     */
    getWordsOnApproval: async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            // Доверяем валидации page, limit, language из роутера
            const page = parseInt(req.query.page as string, 10) || 1;
            const limit = parseInt(req.query.limit as string, 10) || 10;
            const language = req.query.language as 'russian' | 'buryat'; // Типизация после валидации

            // --- Ручная валидация удалена ---

            logger.info(
                `Controller: Requesting words for approval. Lang=${language}, Page=${page}, Limit=${limit}`,
            );

            const paginatedResult = await vocabularyService.getWordsForApproval(
                page,
                limit,
                language,
            );

            logger.info(
                `Controller: Successfully retrieved ${paginatedResult.items.length} words for approval (Total: ${paginatedResult.totalItems}) for ${language}.`,
            );

            res.status(200).json({
                message: `Suggested ${language} words retrieved successfully.`,
                ...paginatedResult,
            });
        } catch (error: unknown) {
            logger.error(`Controller Error in getWordsOnApproval: ${error}`);
            next(error);
        }
    },

    /**
     * Предложение перевода для существующего слова.
     */
    suggestWordTranslate: async (
        req: Request<{}, {}, SuggestTranslationBody>,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        // Доверяем данным после валидации в роутере
        const {
            wordId,
            targetLanguage,
            translationText,
            dialect,
            telegramUserId, // Используем стандартизированное имя
        } = req.body;

        try {
            // --- Ручная валидация удалена ---

            const sourceLanguage =
                targetLanguage === 'russian' ? 'buryat' : 'russian';

            const serviceInput: SuggestTranslationInput = {
                wordId,
                sourceLanguage,
                translationText,
                telegramUserId,
                dialect: dialect, // Просто передаем (будет string | undefined)
            };

            logger.info(
                `Controller: Requesting suggestTranslation for wordId ${wordId} by user ${telegramUserId}`,
            );

            const result: SuggestTranslationResult =
                await vocabularyService.suggestTranslation(serviceInput);

            logger.info(
                `Controller: SuggestTranslation successful. Status: ${result.status}`,
            );

            res.status(200).json({
                message: `Предложение перевода обработано успешно (статус: ${result.status}).`,
                status: result.status,
                word: result.word,
            });
        } catch (error: unknown) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Unknown error during suggestWordTranslate';
            logger.error(
                `Error in suggestWordTranslate controller for wordId ${wordId}: ${message}`,
                { body: req.body, error },
            );
            next(error);
        }
    },

    /**
     * Предложение нескольких слов.
     */
    suggestWords: async (
        req: Request<{}, {}, SuggestWordsBody>,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        // Доверяем данным после валидации в роутере
        const { text, language, telegramUserId, dialect } = req.body; // Используем telegramUserId

        try {
            logger.info(
                `Controller: Requesting suggestWords by user ${telegramUserId}`,
            );
            const results = await vocabularyService.suggestWords({
                text,
                language,
                telegramUserId, // Передаем стандартизированное имя
                dialect,
            });
            logger.info(
                `Controller: suggestWords processed for user ${telegramUserId}. Results count: ${results.length}`,
            );
            res.status(200).json(results);
        } catch (error) {
            logger.error(`Error in suggestWords controller: ${error}`);
            next(error);
        }
    },

    /**
     * Принятие предложенного слова.
     */
    acceptSuggestedWord: async (
        req: Request<{}, {}, AcceptSuggestionBody>,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        // Доверяем данным после валидации в роутере
        const {
            suggestedWordId,
            telegramUserId: moderatorTelegramId, // Используем стандартизированное имя и переименовываем для ясности
            language,
        } = req.body;

        // --- Ручная валидация удалена (parseInt, isNaN) ---

        try {
            logger.info(
                `Controller: Accepting suggestion ${suggestedWordId} (${language}) by moderator ${moderatorTelegramId}`,
            );

            const acceptedWord: AcceptedWordType =
                await vocabularyService.acceptSuggestion({
                    suggestedWordId,
                    moderatorTelegramId, // Передаем переименованную переменную
                    language,
                });

            logger.info(
                `Controller: Suggestion ${suggestedWordId} accepted successfully.`,
            );
            res.status(200).json({
                message:
                    'Слово успешно принято и добавлено/обновлено в словаре',
                word: acceptedWord,
            });
        } catch (error: unknown) {
            logger.error(
                `Error in acceptSuggestedWord controller for ${suggestedWordId}: ${error}`,
            );
            // --- Убрана специфическая обработка ошибок, передаем дальше ---
            next(error);
        }
    },

    /**
     * Отклонение предложенного слова.
     */
    declineSuggestedWord: async (
        req: Request<{}, {}, DeclineSuggestionBody>,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        // Доверяем данным после валидации в роутере
        const {
            suggestedWordId,
            language,
            telegramUserId: moderatorTelegramId, // Используем стандартизированное имя и переименовываем
            reason,
        } = req.body;

        try {
            logger.info(
                `Controller: Declining suggestion ${suggestedWordId} (${language}) by moderator ${moderatorTelegramId}`,
            );
            const declineInput: DeclineSuggestionInput = {
                suggestedWordId,
                language,
                moderatorTelegramId, // Передаем переименованную переменную
                reason,
            };

            await vocabularyService.declineSuggestion(declineInput);

            logger.info(
                `Controller: Successfully declined suggestion ${suggestedWordId}.`,
            );
            res.status(200).json({
                message: 'Suggestion declined successfully.',
            });
        } catch (error: unknown) {
            logger.error(
                `Error in declineSuggestedWord controller for ${suggestedWordId}: ${error}`,
            );
            next(error);
        }
    },

    /**
     * Перевод слова.
     */
    translateWord: async (
        req: Request<{}, {}, TranslateWordBody>,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        // Доверяем данным после валидации в роутере
        const { userInput, targetLanguage, sourceLanguage, telegramUserId } =
            req.body; // Используем telegramUserId

        // --- Ручная валидация удалена ---

        try {
            logger.info(
                `Controller: Requesting translation for "${userInput}" (Target: ${targetLanguage}, Source: ${sourceLanguage}, User: ${telegramUserId})`,
            );

            const findInput: FindTranslationInput = {
                userInput,
                targetLanguage,
                sourceLanguage,
                telegramUserId, // Передаем стандартизированное имя
            };

            const translationResult =
                await vocabularyService.findTranslation(findInput);

            // --- Логика updateSearchHistory удалена ---

            logger.info(
                `Controller: Translation successful for "${userInput}". OwnDB: ${!!translationResult.burlivedb}, Burlang: ${translationResult.burlangdb ? 'Found/Error' : 'Not Found'}`,
            );
            res.status(200).json(translationResult);
        } catch (error: unknown) {
            logger.error(
                `Error in translateWord controller for "${userInput}": ${error}`,
            );
            next(error);
        }
    },

    /**
     * Получение истории поиска пользователя с пагинацией.
     */
    getSearchHistory: async (
        // Типизируем параметры: <Params, ResBody, ReqBody, ReqQuery>
        req: Request<
            { telegramUserId: string },
            {},
            {},
            { page?: string; limit?: string }
        >,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            // Доверяем валидатору Express, что параметры корректны
            const telegramUserId = parseInt(req.params.telegramUserId, 10); // ID из URL
            const page = req.query.page
                ? parseInt(req.query.page, 10)
                : undefined; // Опционально
            const limit = req.query.limit
                ? parseInt(req.query.limit, 10)
                : undefined; // Опционально

            // Проверка, что telegramUserId - число (хотя валидатор это уже делает)
            if (isNaN(telegramUserId)) {
                // Обычно до сюда не дойдет из-за валидатора, но на всякий случай
                return next(new Error('Invalid telegramUserId parameter'));
            }

            logger.info(
                `Controller: Requesting search history for user ${telegramUserId}. Page=${page ?? 'default'}, Limit=${limit ?? 'default'}`,
            );

            // Создаем DTO для сервиса
            const serviceInput: GetSearchHistoryInput = {
                telegramUserId,
                page, // Передаем как есть (может быть undefined)
                limit, // Передаем как есть (может быть undefined)
            };

            // Вызываем метод сервиса
            const paginatedResult: PaginatedResult<SearchHistoryItem> =
                await vocabularyService.getSearchHistory(serviceInput);

            logger.info(
                `Controller: Successfully retrieved search history for user ${telegramUserId}. Current page: ${paginatedResult.currentPage}, Total items: ${paginatedResult.totalItems}`,
            );

            // Отправляем успешный ответ
            res.status(200).json({
                message: `Search history for user ${telegramUserId} retrieved successfully.`,
                ...paginatedResult, // Отправляем весь объект пагинации
            });
        } catch (error: unknown) {
            // Логируем ошибку и передаем в центральный обработчик
            const userIdParam = req.params.telegramUserId;
            logger.error(
                `Error in getSearchHistory controller for user ${userIdParam}`,
                error,
            );
            next(error);
        }
    },

    /**
     * Поиск слов по частичному совпадению (префиксу).
     * Извлекает параметры из запроса и делегирует выполнение VocabularyService.
     * Принимает стандартный Request и полагается на express-validator middleware.
     */
    searchPartialWords: async (
        // Используем стандартные типы Request, Response, NextFunction
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            // Мы здесь, значит валидация express-validator прошла успешно.
            // Свойства q и language гарантированно существуют и имеют нужный тип.
            // Свойство limit, если было передано и валидно, было преобразовано в число через .toInt().

            const query = req.query.q as string; // Можно использовать 'as', т.к. валидатор проверил
            const language = req.query.language as 'russian' | 'buryat'; // Аналогично

            // Определяем limit, учитывая .toInt() от валидатора
            let limit = 10; // Значение по умолчанию
            if (
                typeof req.query.limit === 'number' &&
                !isNaN(req.query.limit)
            ) {
                // Валидатор успешно применил .toInt() и проверил диапазон
                limit = req.query.limit;
            } else if (req.query.limit !== undefined) {
                // Если limit был, но не стал числом после валидатора - что-то странное, логируем
                logger.warn(
                    `Controller: searchPartialWords - limit parameter was present but not a valid number after validation: ${req.query.limit}. Using default ${limit}.`,
                );
            }
            // Если req.query.limit === undefined, используется значение по умолчанию (10)

            logger.info(
                `Controller: Requesting partial search. Query="${query}", Lang=${language}, Limit=${limit}`,
            );

            // Создаем DTO для сервиса
            const serviceInput: SearchPartialInput = {
                query,
                language,
                limit,
            };

            // Вызываем метод сервиса
            const words: AcceptedWordType[] =
                await vocabularyService.searchPartialWords(serviceInput);

            logger.info(
                `Controller: Successfully retrieved ${words.length} words for partial search query "${query}" (${language}).`,
            );

            // Отправляем успешный ответ
            res.status(200).json({
                message: `Partial search results for "${query}" (${language}) retrieved successfully.`,
                words: words,
            });
        } catch (error: unknown) {
            // Обработка ошибок (логирование и передача дальше)
            const message =
                error instanceof Error ? error.message : 'Unknown error';
            logger.error(`Error in searchPartialWords controller: ${message}`, {
                query: req.query,
                error,
            });
            next(error);
        }
    },

    /**
     * НОВЫЙ МЕТОД: Получение списка всех частей речи.
     * Делегирует выполнение ClassifierService.getPartsOfSpeech.
     */
    getPartsOfSpeech: async (
        _req: Request, // Запрос не используется
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            logger.info(
                'Controller: Requesting all parts of speech classifiers.',
            );

            // Вызываем метод нового сервиса классификаторов
            const partsOfSpeech: IPartOfSpeechClassifier[] =
                await classifierService.getPartsOfSpeech();

            logger.info(
                `Controller: Successfully retrieved ${partsOfSpeech.length} parts of speech classifiers.`,
            );

            // Отправляем успешный ответ
            res.status(200).json({
                message: 'Parts of speech retrieved successfully.',
                // Можно отправить как есть или обернуть в 'data'
                data: partsOfSpeech,
            });
        } catch (error: unknown) {
            // Логируем ошибку и передаем в центральный обработчик
            const message =
                error instanceof Error ? error.message : 'Unknown error';
            logger.error(
                `Error in getPartsOfSpeech controller: ${message}`,
                error,
            );
            next(error);
        }
    },
};

export default vocabularyController;

// --- Вспомогательная функция updateSearchHistory УДАЛЕНА ---
