// src/models/Vocabulary/SuggestedWordModelRussian.ts
import { Schema, Types, model } from 'mongoose';
import { IPartOfSpeechClassifier } from '../Classifiers/PartOfSpeechClassifierModel';

// Переименован и экспортирован
export interface ISuggestedWordRussian {
    _id: Types.ObjectId;
    text: string;
    normalized_text: string;
    author: Types.ObjectId;
    contributors: Types.ObjectId[];
    status: 'new' | 'processing' | 'accepted' | 'rejected';
    // language: 'russian'; // Язык зафиксирован
    pre_translations: Types.ObjectId[];
    createdAt: Date; // Добавлено из timestamps
    updatedAt: Date; // Добавлено из timestamps
    // Дополнительные поля, если нужны
    themes: Types.ObjectId[];
    partOfSpeech?: Types.ObjectId | IPartOfSpeechClassifier | null;
}

const SuggestedWordSchema = new Schema<ISuggestedWordRussian>(
    {
        text: { type: String, required: true },
        normalized_text: {
            type: String,
            required: true,
            lowercase: true,
            unique: true,
            index: true, // Добавлен индекс для поиска
        },
        author: {
            type: Schema.Types.ObjectId,
            ref: 'telegram_user',
            required: true,
        },
        contributors: [
            { type: Schema.Types.ObjectId, ref: 'telegram_user', default: [] },
        ],
        status: {
            type: String,
            enum: ['new', 'processing', 'accepted', 'rejected'],
            default: 'new',
            index: true, // Индекс по статусу для выборки "на утверждение"
        },
        // language: {
        //     type: String,
        //     required: true, // Сделаем обязательным, чтобы избежать ошибок
        //     default: 'russian',
        //     enum: ['russian'], // Явно указываем допустимое значение
        // },
        pre_translations: [
            {
                type: Schema.Types.ObjectId,
                ref: 'word-on-buryat-language',
                default: [],
            },
        ], // Указываем на принятые бурятские слова
        themes: [{ type: Schema.Types.ObjectId, ref: 'theme', default: [] }],
        partOfSpeech: {
            // Новое поле
            type: Schema.Types.ObjectId,
            ref: 'part-of-speech-classifier', // Ссылка на нашу новую модель
            // required: false,
        },
        // Дополнительные поля, если нужны
    },
    {
        timestamps: true, // Добавляет createdAt и updatedAt автоматически
    },
);

// Создаем и экспортируем модель
const SuggestedWordModelRussian = model<ISuggestedWordRussian>(
    'suggested-words-on-russian-language', // Имя коллекции
    SuggestedWordSchema,
);
export default SuggestedWordModelRussian;
