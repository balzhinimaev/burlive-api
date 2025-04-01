// src/models/Vocabulary/DeclinedWordModel.ts
import { Document, Schema, Types, model } from 'mongoose';

/**
 * Интерфейс для документа отклоненного слова в MongoDB.
 * Содержит все поля, скопированные из исходного предложенного слова,
 * плюс информацию об отклонении.
 */
export interface IDeclinedWord extends Document {
    text: string;
    normalized_text: string;
    /** Язык отклоненного слова ('russian' или 'buryat'). Обязателен для идентификации источника. */
    language: 'russian' | 'buryat';
    /** ObjectId автора исходного предложения. */
    author: Types.ObjectId;
    /** ObjectId пользователей, которые были соавторами/контрибьюторами исходного предложения. */
    contributors: Types.ObjectId[];
    /** ObjectId диалекта (только для бурятских слов, иначе null). */
    dialect: Types.ObjectId | null;
    /** ObjectId тем, к которым относилось исходное предложение. */
    themes: Types.ObjectId[];
    /** ObjectId слов (принятых), которые были указаны как переводы для исходного предложения. */
    pre_translations: Types.ObjectId[];
    /** ObjectId исходного документа в коллекции suggested-words-on-... */
    originalSuggestedWordId: Types.ObjectId;
    /** ObjectId модератора, отклонившего слово. */
    declinedBy: Types.ObjectId;
    /** Причина отклонения (опционально). */
    declineReason?: string;
    /** Дата и время отклонения слова. */
    declinedAt: Date;
    /** Дата создания исходного предложенного слова (для истории). */
    originalCreatedAt?: Date;
    /** Дата создания записи об отклонении (добавляется через timestamps). */
    createdAt: Date;
    /** Дата последнего обновления записи об отклонении (добавляется через timestamps). */
    updatedAt: Date;
}

// Экспортируем как тип документа для использования в других местах
export type DeclinedWordDocument = IDeclinedWord & Document;

const DeclinedWordSchema = new Schema<IDeclinedWord>(
    {
        text: { type: String, required: true },
        normalized_text: {
            type: String,
            required: true,
            lowercase: true,
            index: true, // Индекс для возможного поиска по отклоненным
        },
        // --- Ключевое поле для различения источника ---
        language: {
            type: String,
            required: true,
            enum: ['russian', 'buryat'], // Строго определяем возможные языки
            index: true,
        },
        // --- Поля, копируемые из исходного предложения ---
        author: {
            type: Schema.Types.ObjectId,
            ref: 'telegram_user', // Ссылка на модель пользователя
            required: true,
            index: true,
        },
        contributors: [
            { type: Schema.Types.ObjectId, ref: 'telegram_user', default: [] },
        ],
        dialect: {
            type: Schema.Types.ObjectId,
            ref: 'dialect', // Ссылка на модель диалектов
            required: false, // Обязательно только для бурятского языка
            default: null,
        },
        themes: [{ type: Schema.Types.ObjectId, ref: 'theme', default: [] }],
        pre_translations: [
            {
                type: Schema.Types.ObjectId,
                // Убираем ref здесь, так как он зависит от language.
                // Если понадобится populate, его нужно будет делать в коде с условием.
                default: [],
            },
        ],
        originalCreatedAt: {
            type: Date,
            required: false, // Делаем опциональным на случай, если старые записи не имели его
        },

        // --- Информация об отклонении ---
        originalSuggestedWordId: {
            type: Schema.Types.ObjectId,
            required: true,
            index: true, // Индекс для поиска по ID исходного слова
            // Не можем указать ref, так как коллекция-источник разная
        },
        declinedBy: {
            type: Schema.Types.ObjectId,
            ref: 'telegram_user', // Ссылка на модель пользователя (модератора)
            required: true,
            index: true,
        },
        declineReason: { type: String, required: false },
        declinedAt: { type: Date, required: true, default: Date.now },
    },
    {
        timestamps: true, // Добавляет createdAt и updatedAt для самой записи об отклонении
        collection: 'declined_words', // Явно задаем имя коллекции
    },
);

// --- Дополнительные индексы для улучшения запросов ---
DeclinedWordSchema.index({ language: 1, normalized_text: 1 }); // Для поиска отклоненных по тексту и языку
DeclinedWordSchema.index({ declinedAt: -1 }); // Для сортировки по дате отклонения

const DeclinedWordModel = model<IDeclinedWord>(
    'DeclinedWord', // Имя модели
    DeclinedWordSchema,
);

export default DeclinedWordModel;
