// src/models/Vocabulary/AcceptedWordRussian.ts
import { Schema, Types, model } from 'mongoose';

// Переименован и экспортирован
export interface IAcceptedWordRussian {
    text: string;
    normalized_text: string;
    author: Types.ObjectId;
    contributors: Types.ObjectId[];
    translations: Types.ObjectId[];
    translations_u: Types.ObjectId[];
    themes: Types.ObjectId[];
    createdAt: Date;
    // updated_at?: Date; // Добавлено из timestamps
}

const WordSchema = new Schema<IAcceptedWordRussian>(
    {
        text: {
            type: String,
            required:
                true /*, unique: true // Часто normalized_text делают unique */,
        },
        normalized_text: {
            type: String,
            required: true,
            lowercase: true,
            unique: true,
            index: true,
        }, // Добавлен index
        translations: {
            type: [
                { type: Schema.Types.ObjectId, ref: 'word-on-buryat-language' },
            ],
            default: [],
        },
        translations_u: {
            type: [
                {
                    type: Schema.Types.ObjectId,
                    ref: 'suggested-words-on-buryat-language',
                },
            ],
            default: [],
        }, // Проверьте ref! Возможно, здесь должно быть suggested-words-on-buryat-language
        author: {
            type: Schema.Types.ObjectId,
            ref: 'telegram_user',
            required: true,
        },
        contributors: [{ type: Schema.Types.ObjectId, ref: 'telegram_user' }],
        themes: [{ type: Schema.Types.ObjectId, ref: 'theme', default: [] }],
    },
    { timestamps: true },
);

const AcceptedWordRussianModel = model<IAcceptedWordRussian>(
    'word-on-russian-language',
    WordSchema,
);
export default AcceptedWordRussianModel; // Экспорт модели
