// src/services/vocabulary/handlers/getSearchHistoryHandler.ts
import { Types } from 'mongoose';
import { IGetSearchHistoryHandler } from '../interfaces/getSearchHistory.interface';
import {
    FoundTranslationDetails,
    GetSearchHistoryInput,
    SearchHistoryItem,
    SearchedWordDetails,
} from '../../../types/vocabulary.types';
import { PaginatedResult } from '../../../types/common.types';
import logger from '../../../utils/logger';
import { DatabaseError, NotFoundError } from '../../../errors/customErrors';
import SearchedWordHistoryModel from '../../../models/Vocabulary/SearchedWordHistoryModel';
import SearchedWordRussianModel, {
    IWordModel as ISearchedRussianWord,
} from '../../../models/Vocabulary/SearchedWordRussianModel';
import SearchedWordBuryatModel, {
    IWordModel as ISearchedBuryatWord,
} from '../../../models/Vocabulary/SearchedWordBuryatModel';
import TelegramUserModel, {
    TelegramUserDocument,
} from '../../../models/TelegramUsers';
import { isError } from '../../../utils/typeGuards';

// type LeanHistoryDoc = Omit<
//     IWordHistoryModel,
//     keyof mongoose.Document | '_id'
// > & { _id: Types.ObjectId };
type LeanSearchedWord = Pick<
    ISearchedRussianWord | ISearchedBuryatWord,
    'text' | 'normalized_text'
> & { _id: Types.ObjectId };

// Типизация для результата populate (только нужные поля)
type PopulatedTranslation = {
    _id: Types.ObjectId;
    text: string;
    // Можно добавить другие поля, если нужно, например 'language'
} | null; // Может быть null, если populate не сработал или ссылки не было

// Типизация для документа истории после populate
// type PopulatedHistoryDoc = Omit<IWordHistoryModel, 'foundTranslation'> & {
//     foundTranslation?: PopulatedTranslation; // Поле будет объектом или undefined/null
//     _id: Types.ObjectId;
// };

export class GetSearchHistoryHandler implements IGetSearchHistoryHandler {
    constructor(
        private readonly historyModel: typeof SearchedWordHistoryModel,
        private readonly russianSearchedModel: typeof SearchedWordRussianModel,
        private readonly buryatSearchedModel: typeof SearchedWordBuryatModel,
        private readonly userModel: typeof TelegramUserModel,
        private readonly log: typeof logger,
    ) {
        this.log.info('GetSearchHistoryHandler instance created.');
    }

    async execute(
        input: GetSearchHistoryInput,
    ): Promise<PaginatedResult<SearchHistoryItem>> {
        const { telegramUserId, page = 1, limit = 10 } = input;
        this.log.info(
            `GetSearchHistoryHandler executing for user ${telegramUserId}, page ${page}, limit ${limit}`,
        );

        try {
            // 1. Найти пользователя
            const user: Pick<TelegramUserDocument, '_id'> | null =
                await this.userModel
                    .findOne({ id: telegramUserId })
                    .select('_id')
                    .lean();

            if (!user) {
                throw new NotFoundError(
                    `User with telegram ID ${telegramUserId} not found.`,
                );
            }
            const userId = user._id;

            // 2. Пагинация
            const skip = (page - 1) * limit;

            // 3. Получить общее количество и записи истории с ПОПУЛЯЦИЕЙ перевода
            const [totalItems, historyDocs] = await Promise.all([
                this.historyModel.countDocuments({ user: userId }),
                this.historyModel
                    .find({ user: userId })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .select(
                        'searched source_language target_language createdAt foundTranslation foundTranslationModelName',
                    ) // Выбираем поля
                    .populate<{ foundTranslation?: PopulatedTranslation }>({
                        // Указываем тип для populate
                        path: 'foundTranslation', // Поле для populate
                        select: '_id text', // Выбираем только _id и text из перевода
                        // Mongoose сам использует refPath ('foundTranslationModelName')
                    }),
                // Можно использовать lean() здесь, но типизация станет сложнее. Пока оставим без lean.
                // .lean<PopulatedHistoryDoc[]>() // Если использовать lean, нужна точная типизация
            ]);

            if (totalItems === 0 || historyDocs.length === 0) {
                return {
                    items: [],
                    totalItems: 0,
                    currentPage: page,
                    totalPages: 0,
                };
            }

            // 4. Собрать ID искомых слов (как раньше, на основе source_language)
            const russianWordIds: Types.ObjectId[] = [];
            const buryatWordIds: Types.ObjectId[] = [];
            historyDocs.forEach((doc) => {
                if (doc.source_language === 'russian') {
                    russianWordIds.push(doc.searched);
                } else {
                    buryatWordIds.push(doc.searched);
                }
            });

            // 5. Запросить детали искомых слов (как раньше)
            const [russianWords, buryatWords] = await Promise.all([
                russianWordIds.length > 0
                    ? this.russianSearchedModel
                          .find({ _id: { $in: russianWordIds } })
                          .select('text normalized_text')
                          .lean<LeanSearchedWord[]>()
                    : Promise.resolve([]),
                buryatWordIds.length > 0
                    ? this.buryatSearchedModel
                          .find({ _id: { $in: buryatWordIds } })
                          .select('text normalized_text')
                          .lean<LeanSearchedWord[]>()
                    : Promise.resolve([]),
            ]);

            // 6. Создать карты для искомых слов (как раньше)
            const russianWordsMap = new Map(
                russianWords.map((w) => [w._id.toString(), w]),
            );
            const buryatWordsMap = new Map(
                buryatWords.map((w) => [w._id.toString(), w]),
            );

            // 7. Собрать финальный результат С УЧЕТОМ НАЙДЕННОГО ПЕРЕВОДА
            const items: SearchHistoryItem[] = historyDocs.map((doc) => {
                let searchedWordDetails: SearchedWordDetails | null = null;
                const searchedIdStr = doc.searched.toString();

                // Находим детали искомого слова
                if (
                    doc.source_language === 'russian' &&
                    russianWordsMap.has(searchedIdStr)
                ) {
                    const word = russianWordsMap.get(searchedIdStr)!;
                    searchedWordDetails = {
                        ...word,
                        language: 'russian',
                        _id: word._id,
                    };
                } else if (
                    doc.source_language === 'buryat' &&
                    buryatWordsMap.has(searchedIdStr)
                ) {
                    const word = buryatWordsMap.get(searchedIdStr)!;
                    searchedWordDetails = {
                        ...word,
                        language: 'buryat',
                        _id: word._id,
                    };
                } // else: лог об ошибке не найденного искомого слова

                // Формируем объект найденного перевода (если он есть после populate)
                const foundTranslationDetails: FoundTranslationDetails | null =
                    doc.foundTranslation
                        ? {
                              _id: doc.foundTranslation._id,
                              text: doc.foundTranslation.text,
                          }
                        : null;

                return {
                    _id: doc._id, // ID записи истории
                    searchedWord: searchedWordDetails, // Искомое слово
                    targetLanguage: doc.target_language, // Целевой язык
                    foundTranslation: foundTranslationDetails, // Найденный перевод (или null)
                    createdAt: doc.createdAt, // Время поиска
                };
            });

            const totalPages = Math.ceil(totalItems / limit);
            this.log.info(
                `Successfully retrieved search history for user ${telegramUserId}. Found ${items.length} items on page ${page}/${totalPages} (Total: ${totalItems})`,
            );

            return { items, totalItems, currentPage: page, totalPages };
        } catch (error: unknown) {
            if (error instanceof NotFoundError) {
                throw error; // Пробрасываем NotFoundError как есть
            }
            const message = isError(error)
                ? error.message
                : 'Unknown error getting search history';
            this.log.error(
                `GetSearchHistoryHandler: Error for user ${telegramUserId}: ${message}`,
                error,
            );
            // Оборачиваем другие ошибки в DatabaseError для единообразия
            throw new DatabaseError(`Failed to get search history: ${message}`);
        }
    }
}
