// src/models/Vocabulary/SuggestedWordModelBuryat.ts
import { Schema, Types, model } from 'mongoose';
import { IPartOfSpeechClassifier } from '../Classifiers/PartOfSpeechClassifierModel';

// Переименован и экспортирован
export interface ISuggestedWordBuryat {
    _id: Types.ObjectId;
    text: string;
    normalized_text: string;
    author: Types.ObjectId;
    contributors: Types.ObjectId[];
    status: 'new' | 'processing' | 'accepted' | 'rejected';
    dialect: Types.ObjectId | null; // Диалект остается строкой, как в исходном коде (или Types.ObjectId, если нужно ссылаться на коллекцию диалектов)
    // language: 'buryat'; // Язык зафиксирован
    pre_translations: Types.ObjectId[];
    createdAt: Date; // Оставляем createdAt из вашего исходного кода
    themes: Types.ObjectId[];
    partOfSpeech?: Types.ObjectId | IPartOfSpeechClassifier | null;
    // ^ Может быть ObjectId при сохранении/загрузке или IPartOfSpeechClassifier после populate
    // Дополнительные поля, если нужны
}

const SuggestedWordSchemaBuryat = new Schema<ISuggestedWordBuryat>({
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
        index: true, // Индекс по статусу
    },
    dialect: {
        type: Schema.Types.ObjectId,
        ref: 'Dialect',
        required: false, // Диалект не обязателен
    },
    // language: {
    //     type: String,
    //     required: true,
    //     default: 'buryat',
    //     enum: ['buryat'], // Явно указываем допустимое значение
    // },
    pre_translations: [
        {
            type: Schema.Types.ObjectId,
            ref: 'word-on-russian-language',
            default: [],
        },
    ], // Указываем на принятые русские слова
    themes: [{ type: Schema.Types.ObjectId, ref: 'theme', default: [] }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    partOfSpeech: {
        // Новое поле
        type: Schema.Types.ObjectId,
        ref: 'part-of-speech-classifier', // Ссылка на нашу новую модель
        // required: false,
    },
    // Дополнительные поля, если нужны
});

// Создаем и экспортируем модель
const SuggestedWordModelBuryat = model<ISuggestedWordBuryat>(
    'suggested-words-on-buryat-language', // Имя коллекции
    SuggestedWordSchemaBuryat,
);
export default SuggestedWordModelBuryat;
