// src/services/vocabulary/handlers/getConfirmedWordsPaginatedHandler.ts
import mongoose, { FilterQuery } from 'mongoose';

// Прямые импорты зависимостей
import logger from '../../../utils/logger'; // Путь к логгеру
import { DatabaseError } from '../../../errors/customErrors'; // Путь к ошибкам
import { isError } from '../../../utils/typeGuards'; // Путь к утилите

// Импорт моделей
import AcceptedWordRussian from '../../../models/Vocabulary/AcceptedWordRussian';
import AcceptedWordBuryat from '../../../models/Vocabulary/AcceptedWordBuryat';

// Импорт типов и интерфейсов
import {
    GetConfirmedWordsPaginatedInput,
    IGetConfirmedWordsPaginatedHandler
} from '../interfaces/getConfirmedWordsPaginated.interface'; // Путь к интерфейсу
import {
    LeanAcceptedRussian, // Конкретные Lean-типы
    LeanAcceptedBuryat,
} from '../interfaces/suggestWords.interface'; // Путь к интерфейсу
import { PaginatedResult } from '../../../types/common.types';
import { AcceptedWordType } from '../../../types/vocabulary.types';

// Опции populate можно вынести для переиспользования
const COMMON_POPULATE_OPTIONS: mongoose.PopulateOptions[] = [
    { path: 'author', select: '_id id firstName username' },
    { path: 'translations', select: 'text language normalized_text' },
    // Добавьте другие общие populate здесь
];

/**
 * Handler to retrieve confirmed words with pagination (direct imports style).
 * Requires a language filter.
 */
export class GetConfirmedWordsPaginatedHandler
    implements IGetConfirmedWordsPaginatedHandler
{
    // Логгер как свойство класса
    private readonly log = logger;

    // Простой конструктор (не принимает зависимости)
    constructor() {
        this.log.info('GetConfirmedWordsPaginatedHandler instance created.');
    }

    /**
     * Executes the retrieval of paginated confirmed words.
     * @param input Input parameters including page, limit, and mandatory language.
     * @returns A promise resolving to a paginated result of accepted words.
     * @throws {DatabaseError} If there's an error fetching data from the database.
     */
    async execute(
        input: GetConfirmedWordsPaginatedInput,
    ): Promise<PaginatedResult<AcceptedWordType>> {
        // Устанавливаем значения по умолчанию и извлекаем язык
        const { language, page = 1, limit = 10 } = input;

        this.log.debug(
            `Executing GetConfirmedWordsPaginatedHandler with language: ${language}, page: ${page}, limit: ${limit}`,
        );

        try {
            const skip = (page - 1) * limit;
            let TargetModel: mongoose.Model<any>; // Используем 'any' временно
            let populateOptions: mongoose.PopulateOptions[];
            let leanType: any; // Для указания типа в .lean<T>()

            // Определяем модель и опции populate на основе языка
            if (language === 'buryat') {
                TargetModel = AcceptedWordBuryat; // Используем импортированную модель
                populateOptions = [...COMMON_POPULATE_OPTIONS];
                // populateOptions.push({ path: 'dialect', select: 'name' }); // Пример добавления диалекта
                leanType = null as unknown as LeanAcceptedBuryat;
            } else {
                // language === 'russian'
                TargetModel = AcceptedWordRussian; // Используем импортированную модель
                populateOptions = [...COMMON_POPULATE_OPTIONS];
                leanType = null as unknown as LeanAcceptedRussian;
            }

            // Определяем фильтр (можно расширить)
            const queryFilter: FilterQuery<any> = {};

            // Выполняем запросы параллельно
            const [totalItems, items] = await Promise.all([
                TargetModel.countDocuments(queryFilter).exec(),
                TargetModel.find(queryFilter)
                    .sort({ normalized_text: 1 })
                    .skip(skip)
                    .limit(limit)
                    .populate(populateOptions)
                    .lean<typeof leanType>() // Используем lean с указанием типа
                    .exec(),
            ]);

            this.log.debug(
                `Found ${totalItems} total items, returning ${items.length} for page ${page}`,
            );

            const totalPages = Math.ceil(totalItems / limit);

            return {
                items: items as AcceptedWordType[], // Приводим тип
                totalItems,
                currentPage: page,
                totalPages,
            };
        } catch (error: unknown) {
            const message = isError(error)
                ? error.message
                : 'Unknown error getting paginated confirmed words.';
            // Используем логгер класса
            this.log.error(
                `Error in GetConfirmedWordsPaginatedHandler: ${message}`,
                {
                    language,
                    page,
                    limit,
                    originalError: error,
                },
            );
            // Выбрасываем стандартизированную ошибку
            throw new DatabaseError(
                'Failed to retrieve confirmed words.',
                isError(error) ? error : undefined,
            );
        }
    }
}
