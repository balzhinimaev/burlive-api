// src/services/vocabulary/handlers/suggestWordsHandler.ts
import { Types, Model } from 'mongoose';
import {
    SuggestionInput,
    SuggestWordResultItem,
} from '../../../types/vocabulary.types';

import { RATING_POINTS } from '../../../config/constants';
import { NotFoundError, DatabaseError } from '../../../errors/customErrors';

// Импортируем модель и ТИП документа TelegramUser
import { TelegramUserDocument } from '../../../models/TelegramUsers';

// Импортируем утилиты
import { isError } from '../../../utils/typeGuards';
import logger from '../../../utils/logger';

// Импортируем ИНТЕРФЕЙСЫ для обработчиков и ТИПЫ результата
import {
    ISuggestWordsHandler,
    LeanAcceptedBuryat,
    LeanAcceptedRussian,
    LeanSuggestedBuryat,
    LeanSuggestedRussian,
    IAcceptedWordRussian,
    IAcceptedWordBuryat,
    ISuggestedWordRussian,
    ISuggestedWordBuryat,
} from '../interfaces/suggestWords.interface';

import { IAddRatingHandler } from '../../interfaces/userRating.interface';
import { IDialect } from '../../../models/Dialect';

/**
 * Обработчик (Handler) для бизнес-логики предложения новых слов пользователями.
 * Реализует интерфейс `ISuggestWordsHandler`.
 * Отвечает за:
 * - Поиск пользователя.
 * - Поиск диалекта (для бурятских слов).
 * - Обработку каждого слова из входной строки (проверка на существование, создание нового, добавление контрибьютора).
 * - Начисление рейтинга пользователю за действия.
 * - Логирование операций и ошибок.
 * - Формирование результата обработки для каждого слова.
 * @implements {ISuggestWordsHandler}
 */
export class SuggestWordsHandler implements ISuggestWordsHandler {
    /**
     * Создает экземпляр SuggestWordsHandler.
     * @param {Model<TelegramUserDocument>} telegramUserModel - Модель Mongoose для пользователей Telegram.
     * @param {Model<IAcceptedWordRussian>} acceptedWordRussian - Модель для принятых русских слов.
     * @param {Model<IAcceptedWordBuryat>} acceptedWordBuryat - Модель для принятых бурятских слов.
     * @param {Model<ISuggestedWordRussian>} suggestedWordRussian - Модель для предложенных русских слов.
     * @param {Model<ISuggestedWordBuryat>} suggestedWordBuryat - Модель для предложенных бурятских слов.
     * @param {IAddRatingHandler} addRatingHandler - Обработчик для добавления/изменения рейтинга пользователя.
     * @param {typeof logger} log - Экземпляр логгера.
     * @param {typeof RATING_POINTS} ratingPoints - Константы для начисления очков рейтинга.
     * @param {Model<IDialect>} dialectModel - Модель Mongoose для диалектов.
     */
    constructor(
        private readonly telegramUserModel: Model<TelegramUserDocument>,
        private readonly acceptedWordRussian: Model<IAcceptedWordRussian>,
        private readonly acceptedWordBuryat: Model<IAcceptedWordBuryat>,
        private readonly suggestedWordRussian: Model<ISuggestedWordRussian>,
        private readonly suggestedWordBuryat: Model<ISuggestedWordBuryat>,
        private readonly addRatingHandler: IAddRatingHandler,
        private readonly log: typeof logger,
        private readonly ratingPoints: typeof RATING_POINTS,
        private readonly dialectModel: Model<IDialect>,
    ) {}

    /**
     * Обрабатывает входящий запрос на предложение одного или нескольких слов.
     * Разбирает строку `text` на отдельные слова, и для каждого выполняет
     * проверку или создание в базе данных, а также начисляет рейтинг.
     * Обрабатывает ошибки на уровне отдельных слов, не прерывая весь процесс.
     *
     * @async
     * @param {SuggestionInput} input - Входные данные, содержащие текст со словами (через запятую),
     *                                  язык ('russian' или 'buryat'), ID пользователя в Telegram и
     *                                  опциональное название диалекта.
     * @returns {Promise<SuggestWordResultItem[]>} Промис, который разрешается массивом объектов `SuggestWordResultItem`.
     *                                            Каждый объект содержит статус обработки (`status`), сообщение (`message`),
     *                                            обработанное слово (`word` - если применимо) и исходное слово (`originalWord`).
     * @throws {NotFoundError} Если пользователь с указанным `telegramUserId` не найден в базе данных.
     * @throws {DatabaseError} Если произошла ошибка при поиске пользователя или другая непредвиденная ошибка БД на начальном этапе.
     *                         Ошибки при обработке *отдельных* слов логируются и добавляются в результат со статусом 'error',
     *                         но не прерывают выполнение метода.
     */
    async execute(input: SuggestionInput): Promise<SuggestWordResultItem[]> {
        const { text, language, telegramUserId } = input;
        const results: SuggestWordResultItem[] = [];
        let authorId: Types.ObjectId;

        // 1. Поиск пользователя по Telegram ID
        try {
            this.log.debug(`Finding user with Telegram ID: ${telegramUserId}`);
            const user = await this.telegramUserModel
                .findOne({ id: telegramUserId })
                .select('_id') // Запрашиваем только ID для экономии
                .lean(); // Получаем простой JS-объект
            if (!user) {
                this.log.warn(`User not found: ${telegramUserId}`);
                throw new NotFoundError(
                    `User with Telegram ID ${telegramUserId} not found.`,
                );
            }
            authorId = user._id;
            this.log.debug(`Found user ObjectId: ${authorId}`);
        } catch (error) {
            this.log.error(
                `Database error finding user ${telegramUserId}:`,
                error,
            );
            if (error instanceof NotFoundError) throw error;
            // Оборачиваем другие ошибки в DatabaseError для консистентности
            throw new DatabaseError(
                `Failed to find user: ${isError(error) ? error.message : 'Unknown error'}`,
            );
        }

        // 2. Определение ObjectId диалекта (только для бурятского языка)
        let finalDialectId: Types.ObjectId | null = null;
        if (
            language === 'buryat' &&
            typeof input.dialect === 'string' &&
            input.dialect.trim()
        ) {
            const dialectNameTrimmed = input.dialect.trim();
            this.log.debug(
                `Attempting to find dialect ObjectId for name: "${dialectNameTrimmed}"`,
            );
            try {
                const dialectDoc = await this.dialectModel
                    .findOne({ name: dialectNameTrimmed })
                    .select('_id')
                    .lean<Pick<IDialect, '_id'>>(); // Получаем только ID в lean-формате
                if (dialectDoc?._id) {
                    finalDialectId = dialectDoc._id;
                    this.log.info(
                        `Found dialect ObjectId: ${finalDialectId} for name "${dialectNameTrimmed}".`,
                    );
                } else {
                    this.log.warn(
                        `Dialect with name "${dialectNameTrimmed}" not found. Suggestion will be saved without dialect.`,
                    );
                }
            } catch (dialectError) {
                // Ошибка поиска диалекта не должна прерывать процесс, просто логируем
                this.log.error(
                    `Error finding dialect "${dialectNameTrimmed}", proceeding without it:`,
                    dialectError,
                );
            }
        } else if (language === 'buryat') {
            this.log.debug(
                'No valid dialect name provided for Buryat suggestion.',
            );
        }

        // 3. Обработка каждого слова из входной строки
        const wordsArray = text
            .split(',') // Разделяем по запятым
            .map((word) => word.trim()) // Убираем пробелы по краям
            .filter(Boolean); // Удаляем пустые строки (например, от двойных запятых)
        this.log.debug(`Processing ${wordsArray.length} words from input.`);

        // Итерация по каждому слову для индивидуальной обработки
        for (const originalWord of wordsArray) {
            // Нормализация для поиска без учета регистра
            const normalized = originalWord.toLowerCase();
            this.log.debug(
                `Processing word: "${originalWord}" (normalized: "${normalized}") for language: ${language}`,
            );
            try {
                // Делегируем обработку одного слова приватному методу
                const wordProcessingResult = await this._processSingleWord(
                    originalWord,
                    normalized,
                    language,
                    authorId,
                    finalDialectId,
                );
                results.push(wordProcessingResult); // Добавляем результат в общий массив
            } catch (error: unknown) {
                // Ловим ошибки, специфичные для обработки *этого* слова
                const message = isError(error)
                    ? error.message
                    : 'Unknown processing error';
                // Логируем ошибку с деталями
                this.log.error(
                    `Failed to process suggestion "${originalWord}" (${language}): ${message}`,
                    {
                        originalError: error,
                        inputContext: {
                            telegramUserId,
                            language,
                            dialect: input.dialect,
                        },
                    },
                );
                // Добавляем запись об ошибке в итоговый результат, НЕ прерывая цикл
                results.push({
                    message: `Ошибка при обработке слова "${originalWord}": ${message}`,
                    status: 'error',
                    originalWord: originalWord,
                    // 'word' не включается в результат при ошибке
                });
                // continue неявно выполняется здесь, переходя к следующей итерации
            }
        }

        this.log.info(
            `Finished processing ${wordsArray.length} suggestions for user ${telegramUserId}. Results count: ${results.length}`,
        );
        return results; // Возвращаем массив результатов для всех слов
    }

    /**
     * Обрабатывает одно слово: ищет его в принятых и предложенных коллекциях
     * соответствующего языка и вызывает соответствующий метод обработки
     * (`_handleExistingAccepted`, `_handleExistingSuggested`) или создания
     * (`_createNewSuggested...`).
     *
     * @private
     * @async
     * @param {string} originalWord - Слово в том виде, как его ввел пользователь.
     * @param {string} normalized - Нормализованная версия слова (обычно lowercase) для поиска.
     * @param {'russian' | 'buryat'} language - Язык обрабатываемого слова.
     * @param {Types.ObjectId} authorId - ObjectId пользователя, предложившего слово.
     * @param {Types.ObjectId | null} dialectId - ObjectId диалекта (или null), если язык бурятский.
     * @returns {Promise<SuggestWordResultItem>} Промис, разрешающийся результатом обработки слова.
     * @throws {DatabaseError} Может перебросить ошибку из методов `_handle...` или `_createNew...`, если там произойдет сбой.
     */
    private async _processSingleWord(
        originalWord: string,
        normalized: string,
        language: 'russian' | 'buryat',
        authorId: Types.ObjectId,
        dialectId: Types.ObjectId | null,
    ): Promise<SuggestWordResultItem> {
        this.log.debug(
            `_processSingleWord: Checking "${normalized}" (${language}). Author: ${authorId}, Dialect ID: ${dialectId}`,
        );
        if (language === 'russian') {
            // 1. Проверка в принятых русских словах
            const existingAccepted = await this.acceptedWordRussian
                .findOne({ normalized_text: normalized })
                .lean<LeanAcceptedRussian>(); // Используем lean для производительности
            if (existingAccepted) {
                this.log.debug(
                    `Found in accepted Russian: ${existingAccepted._id}`,
                );
                return this._handleExistingAccepted(
                    existingAccepted,
                    authorId,
                    originalWord,
                    this.acceptedWordRussian,
                    'Russian',
                );
            }
            // 2. Проверка в предложенных русских словах
            const existingSuggested = await this.suggestedWordRussian
                .findOne({ normalized_text: normalized })
                .lean<LeanSuggestedRussian>();
            if (existingSuggested) {
                this.log.debug(
                    `Found in suggested Russian: ${existingSuggested._id}`,
                );
                return this._handleExistingSuggested(
                    existingSuggested,
                    authorId,
                    originalWord,
                    this.suggestedWordRussian,
                    'Russian',
                );
            }
            // 3. Создание нового предложенного русского слова
            this.log.debug(
                `Not found in Russian accepted/suggested. Creating new.`,
            );
            return this._createNewSuggestedRussian(
                originalWord,
                normalized,
                authorId,
            );
        } else {
            // language === 'buryat'
            // 1. Проверка в принятых бурятских словах
            const existingAccepted = await this.acceptedWordBuryat
                .findOne({ normalized_text: normalized })
                .lean<LeanAcceptedBuryat>();
            if (existingAccepted) {
                this.log.debug(
                    `Found in accepted Buryat: ${existingAccepted._id}`,
                );
                return this._handleExistingAccepted(
                    existingAccepted,
                    authorId,
                    originalWord,
                    this.acceptedWordBuryat,
                    'Buryat',
                );
            }
            // 2. Проверка в предложенных бурятских словах
            const existingSuggested = await this.suggestedWordBuryat
                .findOne({ normalized_text: normalized })
                .lean<LeanSuggestedBuryat>();
            if (existingSuggested) {
                this.log.debug(
                    `Found in suggested Buryat: ${existingSuggested._id}`,
                );
                return this._handleExistingSuggested(
                    existingSuggested,
                    authorId,
                    originalWord,
                    this.suggestedWordBuryat,
                    'Buryat',
                );
            }
            // 3. Создание нового предложенного бурятского слова
            this.log.debug(
                `Not found in Buryat accepted/suggested. Creating new.`,
            );
            return this._createNewSuggestedBuryat(
                originalWord,
                normalized,
                authorId,
                dialectId, // Передаем ID диалекта
            );
        }
    }

    /**
     * Обрабатывает случай, когда предложенное слово уже существует в коллекции **принятых** слов.
     * Добавляет пользователя в массив `contributors`, если его там еще нет,
     * и пытается начислить рейтинг за вклад в принятое слово.
     * Использует дженерик для работы как с русскими, так и с бурятскими принятыми словами.
     *
     * @private
     * @async
     * @template T - Тип lean-объекта принятого слова (LeanAcceptedRussian или LeanAcceptedBuryat).
     * @param {T} word - Lean-объект найденного принятого слова.
     * @param {Types.ObjectId} authorId - ObjectId пользователя, предложившего слово.
     * @param {string} originalWord - Слово в оригинальном виде.
     * @param {Model<any>} Model - Модель Mongoose (AcceptedWordRussian или AcceptedWordBuryat),
     *                           используемая для обновления документа.
     * @param {'Russian' | 'Buryat'} langName - Строковое представление языка для логирования.
     * @returns {Promise<SuggestWordResultItem>} Промис, разрешающийся результатом операции.
     * @throws {DatabaseError} Если произошла ошибка при обновлении документа в базе данных.
     *                         Ошибка обновления рейтинга логируется, но не прерывает выполнение.
     */
    private async _handleExistingAccepted<
        T extends LeanAcceptedRussian | LeanAcceptedBuryat,
    >(
        word: T,
        authorId: Types.ObjectId,
        originalWord: string,
        Model: Model<any>,
        langName: 'Russian' | 'Buryat',
    ): Promise<SuggestWordResultItem> {
        // Проверяем, является ли пользователь уже контрибьютором
        const contributorExists = (word.contributors ?? []).some((c) =>
            // Учитываем, что lean() может вернуть ObjectId или объект с _id
            c instanceof Types.ObjectId
                ? c.equals(authorId)
                : (c as any)?._id?.equals(authorId),
        );

        let updatedWord: T = word; // Начальное значение - найденное слово
        let message = `Слово "${originalWord}" уже принято. Вы уже являетесь соавтором.`;
        // let ratingUpdated = false; // <-- УДАЛЕНО

        // Если пользователя нет в контрибьюторах, добавляем
        if (!contributorExists) {
            this.log.debug(
                `User ${authorId} is not a contributor for accepted ${langName} word ${word._id}. Attempting to add.`,
            );
            try {
                // Атомарно добавляем пользователя в массив contributors, если его там нет
                // Используем lean: true, чтобы получить обновленный простой объект
                const updateResult = await Model.findByIdAndUpdate(
                    word._id,
                    { $addToSet: { contributors: authorId } }, // $addToSet предотвращает дублирование
                    { new: true, lean: true }, // Возвращаем обновленный документ как lean-объект
                );

                // Проверяем, что обновление прошло успешно
                if (updateResult) {
                    updatedWord = updateResult as T; // Обновляем локальную переменную
                    // Дополнительная проверка, что ID пользователя теперь точно в массиве
                    const nowContributor = (
                        updatedWord.contributors ?? []
                    ).some((c) =>
                        c instanceof Types.ObjectId
                            ? c.equals(authorId)
                            : (c as any)?._id?.equals(authorId),
                    );

                    if (nowContributor) {
                        // Пытаемся начислить рейтинг за вклад
                        try {
                            await this.addRatingHandler.execute({
                                userObjectId: authorId,
                                amount: this.ratingPoints.ACCEPTED_CONTRIBUTION,
                            });
                            // ratingUpdated = true; // <-- УДАЛЕНО
                            message = `Слово "${originalWord}" уже принято. Вы добавлены в соавторы.`;
                            this.log.info(
                                `User ${authorId} successfully added as contributor to ACCEPTED ${langName} word "${word.normalized_text}" (${word._id}). Rating updated.`,
                            );
                        } catch (ratingError) {
                            // Ошибка рейтинга не критична для основной операции
                            this.log.error(
                                `Rating update failed for contributor ${authorId} on ACCEPTED ${langName} word ${word._id} (but contributor added):`,
                                ratingError,
                            );
                            message = `Слово "${originalWord}" уже принято. Вы добавлены в соавторы, но произошла ошибка обновления рейтинга.`;
                        }
                    } else {
                        // Редкий случай: обновление прошло, но пользователя нет (гонка? ошибка логики?)
                        this.log.warn(
                            `Contribution update for ACCEPTED ${langName} word ${word._id} seemed successful, but ${authorId} not found in contributors array afterwards. Rating not updated.`,
                        );
                        message = `Слово "${originalWord}" уже принято. Не удалось добавить вас в соавторы (возможно, из-за параллельного обновления).`;
                    }
                } else {
                    // Слово не найдено при попытке обновления (могло быть удалено)
                    this.log.error(
                        `findByIdAndUpdate returned null for ACCEPTED ${langName} word ${word._id} when trying to add contributor ${authorId}.`,
                    );
                    message = `Слово "${originalWord}" уже принято, но произошла ошибка при добавлении вас в соавторы (слово не найдено для обновления?).`;
                    // Можно рассмотреть вариант выбрасывания NotFoundError здесь
                }
            } catch (dbError: unknown) {
                // Добавил unknown для dbError
                // Ловим ошибки БД при findByIdAndUpdate
                this.log.error(
                    `Database error updating ACCEPTED ${langName} word "${word.normalized_text}" (${word._id}) to add contributor ${authorId}:`,
                    dbError,
                );
                const errMsg = isError(dbError)
                    ? dbError.message
                    : 'Unknown update error';
                // Перебрасываем как DatabaseError, чтобы внешняя логика могла обработать
                throw new DatabaseError(
                    `Failed to update accepted ${langName} word to add contributor: ${errMsg}`,
                    isError(dbError) ? dbError : undefined, // Передаем cause если это Error
                );
            }
        } else {
            this.log.debug(
                `User ${authorId} is already a contributor for accepted ${langName} word ${word._id}. No action needed.`,
            );
        }

        // Возвращаем итоговый результат для этого слова
        return {
            message,
            word: updatedWord, // Возвращаем актуальное состояние слова (lean)
            status: 'accepted_exists',
            originalWord,
        };
    }

    /**
     * Обрабатывает случай, когда предложенное слово уже существует в коллекции **предложенных** слов.
     * Логика аналогична `_handleExistingAccepted`, но используется другая модель и другой тип рейтинга.
     * Добавляет пользователя в `contributors`, если его там нет, и обновляет рейтинг.
     *
     * @private
     * @async
     * @template T - Тип lean-объекта предложенного слова (LeanSuggestedRussian или LeanSuggestedBuryat).
     * @param {T} word - Lean-объект найденного предложенного слова.
     * @param {Types.ObjectId} authorId - ObjectId пользователя.
     * @param {string} originalWord - Оригинальное слово.
     * @param {Model<any>} Model - Модель Mongoose (SuggestedWordRussian или SuggestedWordBuryat).
     * @param {'Russian' | 'Buryat'} langName - Название языка для логирования.
     * @returns {Promise<SuggestWordResultItem>} Промис, разрешающийся результатом операции.
     * @throws {DatabaseError} Если произошла ошибка при обновлении документа в базе данных.
     */
    private async _handleExistingSuggested<
        T extends LeanSuggestedRussian | LeanSuggestedBuryat,
    >(
        word: T,
        authorId: Types.ObjectId,
        originalWord: string,
        Model: Model<any>,
        langName: 'Russian' | 'Buryat',
    ): Promise<SuggestWordResultItem> {
        const contributorExists = (word.contributors ?? []).some((c) =>
            c instanceof Types.ObjectId
                ? c.equals(authorId)
                : (c as any)?._id?.equals(authorId),
        );
        let updatedSuggestion: T = word;
        let message = `Слово "${originalWord}" уже предложено. Вы уже являетесь контрибьютором.`;
        // let ratingUpdated = false; // <-- УДАЛЕНО

        if (!contributorExists) {
            this.log.debug(
                `User ${authorId} is not a contributor for suggested ${langName} word ${word._id}. Attempting to add.`,
            );
            try {
                const updateResult = await Model.findByIdAndUpdate(
                    word._id,
                    { $addToSet: { contributors: authorId } },
                    { new: true, lean: true },
                );

                if (updateResult) {
                    updatedSuggestion = updateResult as T;
                    const nowContributor = (
                        updatedSuggestion.contributors ?? []
                    ).some((c) =>
                        c instanceof Types.ObjectId
                            ? c.equals(authorId)
                            : (c as any)?._id?.equals(authorId),
                    );

                    if (nowContributor) {
                        try {
                            // Используем очки за вклад в *предложенное* слово
                            await this.addRatingHandler.execute({
                                userObjectId: authorId,
                                amount: this.ratingPoints
                                    .SUGGESTION_CONTRIBUTION,
                            });
                            // ratingUpdated = true; // <-- УДАЛЕНО
                            message = `Слово "${originalWord}" уже предложено. Вы добавлены в контрибьюторы.`;
                            this.log.info(
                                `User ${authorId} successfully added as contributor to SUGGESTED ${langName} word "${word.normalized_text}" (${word._id}). Rating updated.`,
                            );
                        } catch (ratingError) {
                            this.log.error(
                                `Rating update failed for contributor ${authorId} on SUGGESTED ${langName} word ${word._id} (but contributor added):`,
                                ratingError,
                            );
                            message = `Слово "${originalWord}" уже предложено. Вы добавлены в контрибьюторы, но произошла ошибка обновления рейтинга.`;
                        }
                    } else {
                        this.log.warn(
                            `Contribution update for SUGGESTED ${langName} word ${word._id} seemed successful, but ${authorId} not found in contributors array afterwards. Rating not updated.`,
                        );
                        message = `Слово "${originalWord}" уже предложено. Не удалось добавить вас в контрибьюторы (возможно, из-за параллельного обновления).`;
                    }
                } else {
                    this.log.error(
                        `findByIdAndUpdate returned null for SUGGESTED ${langName} word ${word._id} when trying to add contributor ${authorId}.`,
                    );
                    message = `Слово "${originalWord}" уже предложено, но произошла ошибка при добавлении вас в соавторы (слово не найдено для обновления?).`;
                }
            } catch (dbError: unknown) {
                // Добавил unknown для dbError
                this.log.error(
                    `Database error updating SUGGESTED ${langName} word "${word.normalized_text}" (${word._id}) to add contributor ${authorId}:`,
                    dbError,
                );
                const errMsg = isError(dbError)
                    ? dbError.message
                    : 'Unknown update error';
                // Перебрасываем как DatabaseError с причиной
                throw new DatabaseError(
                    `Failed to update suggested ${langName} word to add contributor: ${errMsg}`,
                    isError(dbError) ? dbError : undefined, // <-- Передаем cause
                );
            }
        } else {
            this.log.debug(
                `User ${authorId} is already a contributor for suggested ${langName} word ${word._id}. No action needed.`,
            );
        }

        return {
            message,
            word: updatedSuggestion, // Возвращаем обновленный lean-объект
            status: 'suggested_exists',
            originalWord,
        };
    }

    /**
     * Создает новую запись в коллекции предложенных **русских** слов.
     * Начисляет пользователю рейтинг за новое предложение.
     *
     * @private
     * @async
     * @param {string} originalWord - Слово в оригинальном виде.
     * @param {string} normalized - Нормализованное слово.
     * @param {Types.ObjectId} authorId - ObjectId автора.
     * @returns {Promise<SuggestWordResultItem>} Промис, разрешающийся результатом создания.
     * @throws {DatabaseError} Если произошла ошибка при сохранении документа в базу данных,
     *                         включая ошибки уникальности (код 11000).
     */
    private async _createNewSuggestedRussian(
        originalWord: string,
        normalized: string,
        authorId: Types.ObjectId,
    ): Promise<SuggestWordResultItem> {
        this.log.debug(
            `Creating new Russian suggestion: "${originalWord}" by ${authorId}.`,
        );
        try {
            // 1. Подготовка данных
            const newSuggestionData: Partial<ISuggestedWordRussian> = {
                text: originalWord,
                normalized_text: normalized,
                author: authorId,
                contributors: [authorId], // Автор автоматически становится контрибьютором
                status: 'new',
                // Инициализируем массивы пустыми значениями по умолчанию
                pre_translations: [],
                themes: [],
            };
            // Создаем новый документ Mongoose
            // 2. Создание экземпляра (вызов конструктора)
            // В тесте: MockSuggestedRussianConstructor(newSuggestionData)
            // Ожидаем, что вернется объект, настроенный через .mockReturnValueOnce()
            const newSuggestionDoc = new this.suggestedWordRussian(
                newSuggestionData,
            );
            // 3. Сохранение (вызов метода .save() на экземпляре)
            // В тесте: newSuggestionDoc.save() -> вызов глобального mockSave
            // Ожидаем, что зарезолвится значением, настроенным через mockSave.mockResolvedValueOnce()
            const savedDoc = await newSuggestionDoc.save();

            // 4. Начисление рейтинга (вызов внешнего обработчика)
            // В тесте: mockAddRatingHandler.execute(...)
            // Ожидаем, что зарезолвится успешно (настроено в beforeEach)
            try {
                await this.addRatingHandler.execute({
                    userObjectId: authorId,
                    amount: this.ratingPoints.NEW_SUGGESTION, // Рейтинг за НОВОЕ предложение
                });
                this.log.info(
                    `New Russian word suggestion created: "${originalWord}" by ${authorId}, ID: ${savedDoc._id}. Rating updated.`,
                );
            } catch (ratingError) {
                // Ошибка рейтинга не должна откатывать создание слова
                this.log.error(
                    `Rating update failed for user ${authorId} after creating Russian suggestion ${savedDoc._id}:`,
                    ratingError,
                );
                // Можно добавить информацию об ошибке рейтинга в message, если нужно
            }

            // 5. Преобразование в Lean-объект (вызов .toObject() на результате сохранения)
            // В тесте: savedDoc.toObject() -> вызов глобального mockToObject
            // Ожидаем, что вернет простой объект (настроено глобально)
            // Преобразуем Mongoose документ в lean-объект для возврата
            const resultWord: LeanSuggestedRussian =
                savedDoc.toObject<LeanSuggestedRussian>();

            // 6. Возврат успешного результата
            return {
                message: `Слово "${originalWord}" успешно предложено.`,
                word: resultWord,
                status: 'newly_suggested',
                originalWord,
            };
        } catch (error: unknown) {
            // Обрабатываем ошибки сохранения документа
            this.log.error(
                `Error creating new Russian suggestion for "${originalWord}" by ${authorId}:`,
                error,
            );
            // Перебрасываем известные типы ошибок
            if (
                error instanceof DatabaseError ||
                error instanceof NotFoundError
            ) {
                throw error;
            }

            const errMsg = isError(error)
                ? error.message
                : 'Unknown creation error';

            // Особо обрабатываем ошибку дубликата по индексу (вероятно, normalized_text)
            if (isError(error) && (error as any).code === 11000) {
                this.log.warn(
                    `Duplicate key error (11000) creating Russian suggestion for "${normalized}".`,
                );
                // Создаем специфичную ошибку DatabaseError
                throw new DatabaseError(
                    `Failed to create new Russian suggestion: Word "${originalWord}" already exists or was suggested concurrently.`, // Более понятное сообщение
                    error, // Сохраняем исходную ошибку
                );
            }
            // Для других ошибок БД создаем общую DatabaseError
            throw new DatabaseError(
                `Failed to create new Russian suggestion: ${errMsg}`,
                isError(error) ? error : undefined,
            );
        }
    }

    /**
     * Создает новую запись в коллекции предложенных **бурятских** слов.
     * Учитывает переданный ID диалекта.
     * Начисляет пользователю рейтинг за новое предложение.
     *
     * @private
     * @async
     * @param {string} originalWord - Слово в оригинальном виде.
     * @param {string} normalized - Нормализованное слово.
     * @param {Types.ObjectId} authorId - ObjectId автора.
     * @param {Types.ObjectId | null} dialectId - ObjectId диалекта или null.
     * @returns {Promise<SuggestWordResultItem>} Промис, разрешающийся результатом создания.
     * @throws {DatabaseError} Если произошла ошибка при сохранении документа в базу данных.
     */
    private async _createNewSuggestedBuryat(
        originalWord: string,
        normalized: string,
        authorId: Types.ObjectId,
        dialectId: Types.ObjectId | null,
    ): Promise<SuggestWordResultItem> {
        this.log.debug(
            `Creating new Buryat suggestion: "${originalWord}" (dialect: ${dialectId || 'none'}) by ${authorId}.`,
        );
        try {
            const newSuggestionData: Partial<ISuggestedWordBuryat> = {
                text: originalWord,
                normalized_text: normalized,
                author: authorId,
                contributors: [authorId],
                status: 'new',
                pre_translations: [],
                themes: [],
                dialect: dialectId, // Устанавливаем диалект (может быть null)
            };
            const newSuggestionDoc = new this.suggestedWordBuryat(
                newSuggestionData,
            );
            const savedDoc = await newSuggestionDoc.save();

            // Пытаемся обновить рейтинг
            try {
                await this.addRatingHandler.execute({
                    userObjectId: authorId,
                    amount: this.ratingPoints.NEW_SUGGESTION,
                });
                this.log.info(
                    `New Buryat word suggestion created: "${originalWord}" (dialect: ${dialectId || 'none'}) by ${authorId}, ID: ${savedDoc._id}. Rating updated.`,
                );
            } catch (ratingError) {
                this.log.error(
                    `Rating update failed for user ${authorId} after creating Buryat suggestion ${savedDoc._id}:`,
                    ratingError,
                );
            }

            // Преобразуем в lean-объект
            const resultWord: LeanSuggestedBuryat =
                savedDoc.toObject<LeanSuggestedBuryat>();

            return {
                message: `Слово "${originalWord}" успешно предложено.`,
                word: resultWord,
                status: 'newly_suggested',
                originalWord,
            };
        } catch (error) {
            this.log.error(
                `Error creating new Buryat suggestion for "${originalWord}" by ${authorId}:`,
                error,
            );
            if (
                error instanceof DatabaseError ||
                error instanceof NotFoundError
            ) {
                throw error;
            }
            const errMsg = isError(error)
                ? error.message
                : 'Unknown creation error';
            if (isError(error) && (error as any).code === 11000) {
                this.log.warn(
                    `Duplicate key error (11000) creating Buryat suggestion for "${normalized}".`,
                );
                throw new DatabaseError(
                    `Failed to create new Buryat suggestion: Word "${originalWord}" already exists or was suggested concurrently.`,
                    error,
                );
            }
            throw new DatabaseError(
                `Failed to create new Buryat suggestion: ${errMsg}`,
                isError(error) ? error : undefined,
            );
        }
    }
}
