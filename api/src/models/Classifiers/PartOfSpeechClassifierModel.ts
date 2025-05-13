import { Schema, Types, model, Document } from 'mongoose';

// Enum для языков, чтобы обеспечить консистентность
export enum ClassifierLanguage {
    BURYAT = 'buryat',
    RUSSIAN = 'russian',
    // Можно добавить 'common' если какая-то часть речи универсальна по названию
}

// Интерфейс для классификатора части речи
export interface IPartOfSpeechClassifier extends Document {
    _id: Types.ObjectId;
    name_buryat: string; // Название на бурятском (Нэрэ үгэ)
    name_russian: string; // Название на русском (Имя существительное)
    code: string; // Короткий уникальный код (например, NOUN, VERB) - для программного использования
    language_specific: ClassifierLanguage; // К какому языку относится данное название/описание (или общее)
    description_buryat?: string; // Описание на бурятском (опционально)
    description_russian?: string; // Описание на русском (опционально)
    // Можно добавить другие поля, например, основные грамматические признаки
    // grammatical_features?: string[];
    createdAt: Date;
    updatedAt: Date;
}

const PartOfSpeechClassifierSchema = new Schema<IPartOfSpeechClassifier>(
    {
        name_buryat: { type: String, required: true },
        name_russian: { type: String, required: true },
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            index: true,
        },
        language_specific: {
            type: String,
            enum: Object.values(ClassifierLanguage),
            required: true,
        },
        description_buryat: { type: String },
        description_russian: { type: String },
        // grammatical_features: [{ type: String }],
    },
    {
        timestamps: true, // Добавляет createdAt и updatedAt
    },
);

// Создаем и экспортируем модель
const PartOfSpeechClassifierModel = model<IPartOfSpeechClassifier>(
    'part-of-speech-classifier', // Имя коллекции
    PartOfSpeechClassifierSchema,
);

export default PartOfSpeechClassifierModel;
