// src/services/vocabulary/handlers/getConfirmedWord.handler.ts
import mongoose from 'mongoose';

// Прямые импорты зависимостей
import logger from '../../../utils/logger'; // Убедитесь, что путь корректен
import { isError } from '../../../utils/typeGuards'; // Убедитесь, что путь корректен
import {
    DatabaseError,
    NotFoundError, // Можно добавить, если нужно явно выбрасывать при ненаходке по ID
    ValidationError,
} from '../../../errors/customErrors'; // Убедитесь, что путь корректен

import { AcceptedWordType } from '../../../types/vocabulary.types';
import AcceptedWordRussian from '../../../models/Vocabulary/AcceptedWordRussian'; // Путь к модели
import AcceptedWordBuryat from '../../../models/Vocabulary/AcceptedWordBuryat'; // Путь к модели
import {
    GetConfirmedWordInput,
    IGetConfirmedWordHandler,
} from '../interfaces/getConfirmedWord.interface'; // Путь к интерфейсу

// Опции populate можно вынести для переиспользования (как и раньше)
const COMMON_POPULATE_OPTIONS: mongoose.PopulateOptions[] = [
    { path: 'author', select: '_id id firstName username' },
    { path: 'translations', select: 'text language normalized_text' },
    // { path: 'translations_u', select: 'text language normalized_text' }, // Если нужно
];

// Класс без декораторов DI
export class GetConfirmedWordHandler implements IGetConfirmedWordHandler {
    // Инициализация логгера как свойства класса
    private readonly log = logger;

    // Простой конструктор, как в вашем примере
    constructor() {
        this.log.info('GetConfirmedWordHandler instance created.');
    }

    async execute({
        wordId,
    }: GetConfirmedWordInput): Promise<AcceptedWordType | null> {
        this.log.info(
            `Handler executing GetConfirmedWord. Input wordId: ${wordId || 'random'}`,
        );

        try {
            // --- Случай 1: Поиск по ID ---
            if (wordId) {
                // Валидация ID
                if (!mongoose.isValidObjectId(wordId)) {
                    this.log.warn(`Invalid word ID format provided: ${wordId}`);
                    throw new ValidationError('Invalid word ID format.');
                }

                this.log.debug(
                    `Attempting to find word by ID ${wordId} in Buryat collection...`,
                );
                // Используем импортированную модель напрямую
                let word: AcceptedWordType | null =
                    await AcceptedWordBuryat.findById(wordId)
                        .populate(COMMON_POPULATE_OPTIONS)
                        .lean();

                if (word) {
                    this.log.info(
                        `Found word ID ${wordId} in Buryat collection.`,
                    );
                    return word;
                }

                this.log.debug(
                    `Word ID ${wordId} not found in Buryat, checking Russian collection...`,
                );
                // Используем импортированную модель напрямую
                word = await AcceptedWordRussian.findById(wordId)
                    .populate(COMMON_POPULATE_OPTIONS)
                    .lean();

                if (word) {
                    this.log.info(
                        `Found word ID ${wordId} in Russian collection.`,
                    );
                } else {
                    this.log.info(
                        `Word ID ${wordId} not found in either collection.`,
                    );
                    // Можно выбросить NotFoundError, если нужно
                    // throw new NotFoundError(`Confirmed word with ID ${wordId} not found.`);
                }
                return word;
            }
            // --- Случай 2: Поиск случайного слова ---
            else {
                this.log.debug('Attempting to find a random confirmed word...');

                // Используем импортированные модели напрямую
                const buryatCount = await AcceptedWordBuryat.countDocuments();
                const russianCount = await AcceptedWordRussian.countDocuments();
                const totalCount = buryatCount + russianCount;

                this.log.debug(
                    `Counts - Buryat: ${buryatCount}, Russian: ${russianCount}, Total: ${totalCount}`,
                );

                if (totalCount === 0) {
                    this.log.warn('No confirmed words found in the database.');
                    return null;
                }

                const randomSkip = Math.floor(Math.random() * totalCount);
                this.log.debug(`Calculated random skip: ${randomSkip}`);

                let randomWord: AcceptedWordType | null = null;

                if (randomSkip < buryatCount) {
                    this.log.debug(
                        `Fetching random word from Buryat collection (skip: ${randomSkip})...`,
                    );
                    // Используем импортированную модель напрямую
                    randomWord = await AcceptedWordBuryat.findOne()
                        .skip(randomSkip)
                        .populate(COMMON_POPULATE_OPTIONS)
                        .lean();
                } else {
                    const russianSkip = randomSkip - buryatCount;
                    this.log.debug(
                        `Fetching random word from Russian collection (skip: ${russianSkip})...`,
                    );
                    // Используем импортированную модель напрямую
                    randomWord = await AcceptedWordRussian.findOne()
                        .skip(russianSkip)
                        .populate(COMMON_POPULATE_OPTIONS)
                        .lean();
                }

                if (randomWord) {
                    this.log.info(
                        `Successfully fetched a random word (ID: ${randomWord._id}).`,
                    );
                } else {
                    this.log.warn(
                        'Could not fetch a random word despite non-zero count. Possible race condition?',
                    );
                }

                return randomWord;
            }
        } catch (error: unknown) {
            const message = isError(error) ? error.message : 'Unknown error';
            this.log.error(`Error in GetConfirmedWordHandler: ${message}`, {
                wordId,
                error,
            });

            if (
                error instanceof ValidationError ||
                error instanceof NotFoundError
            ) {
                throw error;
            }
            throw new DatabaseError(
                `Failed to get confirmed word: ${message}`,
                error instanceof Error ? error : undefined,
            );
        }
    }
}
