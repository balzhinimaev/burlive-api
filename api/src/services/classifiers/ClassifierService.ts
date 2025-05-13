// src/services/classifiers/ClassifierService.ts
import { Model } from 'mongoose';
import { IPartOfSpeechClassifier } from '../../models/Classifiers/PartOfSpeechClassifierModel';
import { Logger } from 'winston'; // Или ваш тип логгера
import { DatabaseError } from '../../errors/customErrors';

export class ClassifierService {
    private partOfSpeechClassifierModel: Model<IPartOfSpeechClassifier>;
    private logger: Logger;

    constructor(
        partOfSpeechClassifierModel: Model<IPartOfSpeechClassifier>,
        logger: Logger,
    ) {
        this.partOfSpeechClassifierModel = partOfSpeechClassifierModel;
        this.logger = logger;
        this.logger.info('ClassifierService initialized');
    }

    /**
     * Получает список всех классификаторов частей речи из базы данных.
     * @returns {Promise<IPartOfSpeechClassifier[]>} - Массив классификаторов.
     */
    async getPartsOfSpeech(): Promise<IPartOfSpeechClassifier[]> {
        this.logger.info(
            'ClassifierService: Fetching all parts of speech classifiers...',
        );
        try {
            // Находим все, сортируем по коду для консистентности, используем lean для производительности
            const classifiers = await this.partOfSpeechClassifierModel
                .find({})
                .sort({ code: 1 }) // Сортировка по коду (A-Z)
                .lean() // Получаем простые JS объекты
                .exec();

            this.logger.info(
                `ClassifierService: Successfully retrieved ${classifiers.length} parts of speech classifiers.`,
            );
            return classifiers;
        } catch (error: unknown) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Unknown database error while fetching parts of speech';
            this.logger.error(
                `ClassifierService: Error fetching parts of speech: ${message}`,
                error,
            );
            // Бросаем специфичную ошибку или стандартную
            throw new DatabaseError(
                'Failed to retrieve parts of speech from database.',
            );
        }
    }

    // Сюда можно будет добавить методы для получения других типов классификаторов (диалектов, тем и т.д.)
    // async getDialects(): Promise<...> {}
    // async getThemes(): Promise<...> {}
}
