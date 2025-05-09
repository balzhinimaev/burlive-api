// src/services/vocabulary/handlers/findTranslationHandler.ts
import mongoose, { Document } from 'mongoose'; // Добавили Model
import {
    IFindTranslationHandler,
    FindTranslationInput,
} from '../interfaces/findTranslation.interface';
import {
    TranslationResult,
    AcceptedWordType,
} from '../../../types/vocabulary.types';
// import { NotFoundErrors } from '../../../errors/customErrors'; // Добавили DatabaseError
import logger from '../../../utils/logger';
import { isError } from '../../../utils/typeGuards';
import {
    BURLANG_API_BASE_URL,
    BURLANG_REQUEST_TIMEOUT,
} from '../../../config/constants';

// Модели, необходимые этому обработчику
import TelegramUserModel, { TelegramUser } from '../../../models/TelegramUsers';
import AcceptedWordRussianModel from '../../../models/Vocabulary/AcceptedWordRussian';
import AcceptedWordBuryatModel from '../../../models/Vocabulary/AcceptedWordBuryat';
import SearchedWordRussianModel from '../../../models/Vocabulary/SearchedWordRussianModel';
import SearchedWordBuryatModel from '../../../models/Vocabulary/SearchedWordBuryatModel';
import SearchedWordHistoryModel, { IWordHistoryModel } from '../../../models/Vocabulary/SearchedWordHistoryModel';
import { NotFoundError } from '../../../errors/customErrors';

export class FindTranslationHandler implements IFindTranslationHandler {
    // Внедряем все необходимые зависимости через конструктор
    constructor(
        private readonly telegramUserModel: typeof TelegramUserModel,
        private readonly acceptedWordRussianModel: typeof AcceptedWordRussianModel,
        private readonly acceptedWordBuryatModel: typeof AcceptedWordBuryatModel,
        private readonly searchedWordRussianModel: typeof SearchedWordRussianModel,
        private readonly searchedWordBuryatModel: typeof SearchedWordBuryatModel,
        private readonly searchedWordHistoryModel: typeof SearchedWordHistoryModel,
        private readonly log: typeof logger,
        // Можно внедрить fetch для лучшей тестируемости, но пока оставим так
        // private readonly fetchFn: typeof fetch = fetch
    ) {
        this.log.info('FindTranslationHandler instance created.');
    }

    async execute(input: FindTranslationInput): Promise<TranslationResult> {
        const { userInput, targetLanguage, sourceLanguage, telegramUserId } =
            input;
        const normalizedInput = userInput.toLowerCase().trim();

        this.log.info(
            `FindTranslationHandler executing for: "${userInput}", Target: ${targetLanguage}, Source: ${sourceLanguage}, UserID: ${telegramUserId}`,
        );

        if (!normalizedInput) {
            this.log.warn('FindTranslationHandler: Received empty user input.');
            return { burlangdb: null, burlivedb: null };
        }

        // Находим пользователя Telegram
        // Используем внедренную модель this.telegramUserModel
        const user = await this.telegramUserModel
            .findOne({ id: telegramUserId })
            .select('_id');
        if (!user) {
            // Бросаем ошибку, которая будет поймана выше (в сервисе или контроллере)
            this.log.error(
                `FindTranslationHandler: User with Telegram ID ${telegramUserId} not found.`,
            );
            throw new NotFoundError(
                `User with Telegram ID ${telegramUserId} not found.`,
            );
        }

        try {
            // Используем Promise.all для параллельного выполнения
            const [burlangResult, ownDbResult] = await Promise.all([
                this._findInBurlang(normalizedInput, targetLanguage),
                this._findInOwnDB(normalizedInput, sourceLanguage),
            ]);

            await this._updateSearchHistory(
                normalizedInput,
                userInput,
                targetLanguage,
                sourceLanguage,
                user, // Передаем найденного пользователя
                ownDbResult,
            ),
                this.log.info(
                    `FindTranslationHandler successful for "${userInput}". OwnDB: ${!!ownDbResult}, Burlang: ${burlangResult ? 'Found' : 'Not Found/Error'}`,
                );
            return { burlangdb: burlangResult, burlivedb: ownDbResult };
        } catch (error: unknown) {
            // Логируем ошибку на уровне обработчика
            const message = isError(error)
                ? error.message
                : 'Unknown error during translation find.';
            this.log.error(
                `FindTranslationHandler: Error for "${userInput}": ${message}`,
                error,
            );

            // Перебрасываем специфичные ошибки или возвращаем результат с ошибкой Burlang
            if (error instanceof NotFoundError) {
                // NotFoundError может прийти от _findUser, например (хотя мы уже проверили)
                throw error; // Перебросить для обработки выше
            }
            // Если ошибка не NotFoundError, считаем её внутренней проблемой (возможно, DB или Burlang)
            // Возвращаем null для нашего DB и сообщение об ошибке для Burlang,
            // так как пользователь может ожидать результат оттуда.
            return {
                burlangdb: `Ошибка поиска (${message.substring(0, 50)}${message.length > 50 ? '...' : ''})`, // Сообщение об ошибке для Burlang
                burlivedb: null, // null для собственной базы, так как произошла ошибка
            };
        }
    }

    // --- Приватные хелперы, перенесенные из VocabularyService ---

    // Обновляем сигнатуру для использования внедренных моделей
    private async _updateSearchHistory(
        normalizedText: string,
        originalText: string,
        targetLang: 'russian' | 'buryat',
        sourceLang: 'russian' | 'buryat',
        user: Document<unknown, {}, TelegramUser> & TelegramUser, // Тип пользователя остается
        ownDbResult: AcceptedWordType | null, // Принимаем найденный перевод
    ): Promise<void> {
        try {
            let SearchedModel: any;
            // Определяем модель искомого слова
            if (sourceLang === 'russian') {
                SearchedModel = this.searchedWordRussianModel;
            } else {
                SearchedModel = this.searchedWordBuryatModel;
            }

            // Шаг 1: Найти или создать документ искомого слова, добавить пользователя
            const searchDoc = await SearchedModel.findOneAndUpdate(
                { normalized_text: normalizedText },
                {
                    $setOnInsert: { text: originalText }, // Только текст при создании
                    $addToSet: { users: user._id }, // Добавляем юзера
                },
                { upsert: true, new: true, setDefaultsOnInsert: true },
            ); // Не используем lean() здесь, т.к. ниже не модифицируем

            if (searchDoc) {
                const searchedWordId = searchDoc._id;

                // Шаг 2: Подготовить данные для записи в историю
                const historyData: Partial<IWordHistoryModel> = {
                    // Используем Partial т.к. некоторые поля опциональны
                    searched: searchedWordId,
                    user: user._id,
                    source_language: sourceLang,
                    target_language: targetLang,
                };

                // // Если перевод был найден в нашей БД, добавляем информацию о нем
                // if (ownDbResult) {
                //     historyData.foundTranslation = ownDbResult._id;
                //     // Определяем имя модели найденного перевода (оно соответствует целевому языку)
                //     historyData.foundTranslationModelName =
                //         targetLang === 'russian'
                //             ? 'word-on-russian-language' // Если искали перевод на русский, то он в этой модели
                //             : 'word-on-buryat-language'; // Если искали на бурятский, то он в этой модели
                //     // Еще раз: убедитесь, что имена моделей здесь и в схеме истории совпадают!
                // }

                // Шаг 3: Сохранить запись в истории поиска
                await new this.searchedWordHistoryModel(historyData).save();

                this.log.info(
                    `Search history entry created for "${normalizedText}", user ${user._id}. Found translation: ${!!ownDbResult}`,
                );

                // Шаг 4: Обновление массива переводов в SearchedWord...Model БОЛЬШЕ НЕ НУЖНО
                // Блок с updateOne и $addToSet удален.
            } else {
                this.log.warn(
                    `Search document was unexpectedly null after findOneAndUpdate with upsert:true for "${normalizedText}"`,
                );
            }
        } catch (error: unknown) {
            const message = isError(error)
                ? error.message
                : 'Unknown error updating search history.';
            this.log.error(
                `_updateSearchHistory: Failed for "${normalizedText}": ${message}`,
                error,
            );
            // Не перебрасываем ошибку
        }
    }

    // Обновляем для использования внедренных моделей
    private async _findInOwnDB(
        normalizedText: string,
        sourceLanguage: 'russian' | 'buryat',
    ): Promise<AcceptedWordType | null> {
        try {
            let word: AcceptedWordType | null = null;
            const populateOptions: mongoose.PopulateOptions[] = [
                // Типизируем опции
                {
                    path: 'translations',
                    select: 'text normalized_text language dialect', // Убедись, что dialect есть или убери его
                    // Если диалект нужен только для бурятских, можно сделать условное добавление
                },
                // Можно добавить другие populate, если нужно
                // { path: 'author', select: 'id username' }
            ];

            // Используем внедренные модели
            if (sourceLanguage === 'buryat') {
                word = await this.acceptedWordBuryatModel
                    .findOne({ normalized_text: normalizedText })
                    .populate(populateOptions)
                    .lean(); // lean() важен для производительности и возврата POJO
            } else {
                // russian
                word = await this.acceptedWordRussianModel
                    .findOne({ normalized_text: normalizedText })
                    .populate(populateOptions)
                    .lean();
            }

            if (word) {
                this.log.info(
                    `_findInOwnDB: Found "${normalizedText}" (${sourceLanguage}) in own DB.`,
                );
            } else {
                this.log.info(
                    `_findInOwnDB: Did not find "${normalizedText}" (${sourceLanguage}) in own DB.`,
                );
            }
            return word;
        } catch (error: unknown) {
            const message = isError(error)
                ? error.message
                : 'Unknown error searching own DB.';
            // Используем this.log
            this.log.error(
                `_findInOwnDB: Error for "${normalizedText}" (${sourceLanguage}): ${message}`,
                error,
            );
            // Возвращаем null, так как поиск не удался
            return null;
        }
    }

    private async _findInBurlang(
        normalizedText: string,
        targetLanguage: 'russian' | 'buryat',
    ): Promise<string | null> {
        let url = '';
        if (targetLanguage === 'russian') {
            url = `${BURLANG_API_BASE_URL}/buryat-word/translate?q=${encodeURIComponent(normalizedText)}`;
        } else {
            url = `${BURLANG_API_BASE_URL}/russian-word/translate?q=${encodeURIComponent(normalizedText)}`;
        }

        this.log.info(`_findInBurlang: Querying Burlang API: ${url}`);

        try {
            const ctrl = new AbortController();
            const timeoutId = setTimeout(
                () => ctrl.abort(),
                BURLANG_REQUEST_TIMEOUT,
            );

            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                signal: ctrl.signal,
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                this.log.warn(
                    `_findInBurlang: API request failed for "${normalizedText}" with status: ${response.status} ${response.statusText}`,
                );
                return null;
            }

            const data: any = await response.json();

            const translationString =
                data?.translations?.length > 0
                    ? data.translations.map((t: any) => t.value).join(', ')
                    : null;

            if (translationString) {
                this.log.info(
                    `_findInBurlang: Found translation for "${normalizedText}" in Burlang.`,
                );
            } else {
                this.log.info(
                    `_findInBurlang: No translation found for "${normalizedText}" in Burlang response.`,
                );
            }
            return translationString;
        } catch (error: unknown) {
            const msg = isError(error)
                ? error.message
                : 'Unknown Burlang API error.';
            if (isError(error) && error.name === 'AbortError') {
                // *** FIX APPLIED HERE ***
                this.log.error(
                    `_findInBurlang: Request timed out for "${normalizedText}".`,
                    error, // Pass the error object
                );
                return 'Тайм-аут при запросе к Burlang';
            }
            this.log.error(
                `_findInBurlang: Fetch error for "${normalizedText}": ${msg}`,
                error,
            );
            return 'Ошибка сети при запросе к Burlang';
        }
    }
}
