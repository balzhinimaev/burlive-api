import { Document, Schema, Types, model } from 'mongoose';

// Определяем тип для языка явно
type Language = 'russian' | 'buryat';
type AcceptedModelName = 'word-on-russian-language' | 'word-on-buryat-language';

export interface IWordHistoryModel extends Document {
    _id: Types.ObjectId; // Лучше использовать Types.ObjectId
    searched: Types.ObjectId;
    user: Types.ObjectId;
    source_language: Language; // <-- ДОБАВЛЕНО
    target_language: Language;

    foundTranslation?: Types.ObjectId; // ID найденного перевода (опционально) <-- ИЗМЕНЕНО
    foundTranslationModelName?: AcceptedModelName; // Имя модели найденного перевода (опционально) <-- ДОБАВЛЕНО

    createdAt: Date;
}

const WordSchema = new Schema<IWordHistoryModel>( // <-- Типизируем Schema
    {
        searched: {
            type: Schema.Types.ObjectId,
            required: true,
            // ref НЕ указываем здесь, т.к. он динамический
            // ref: "searched-word" // <-- УБИРАЕМ или оставляем как есть, но не используем для populate
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: 'telegram_user', // Связь с пользователем
            required: true,
            index: true, // Добавляем индекс для быстрого поиска по пользователю
        },
        source_language: {
            // <-- ДОБАВЛЕНО
            type: String,
            required: true,
            enum: ['russian', 'buryat'], // Ограничиваем значения
        },
        target_language: {
            type: String,
            required: true,
            enum: ['russian', 'buryat'], // Ограничиваем значения
        },

        foundTranslation: {
            // Ссылка на найденный перевод
            type: Schema.Types.ObjectId,
            required: false, // Не всегда перевод находится
            refPath: 'foundTranslationModelName', // Динамическая ссылка!
        },
        foundTranslationModelName: {
            // Поле, указывающее на модель для refPath
            type: String,
            required: false, // Только если foundTranslation существует
            enum: ['word-on-russian-language', 'word-on-buryat-language'], // <-- УКАЖИТЕ ТОЧНЫЕ ИМЕНА МОДЕЛЕЙ!
        },
    },
    {
        timestamps: {
            createdAt: true,
            updatedAt: false,
        },
        versionKey: false,
    },
);

// Добавим индекс по пользователю и дате для сортировки истории
WordSchema.index({ user: 1, createdAt: -1 });

const SearchedWordHistoryModel = model<IWordHistoryModel>(
    'searched-word-history',
    WordSchema,
);
export default SearchedWordHistoryModel;
