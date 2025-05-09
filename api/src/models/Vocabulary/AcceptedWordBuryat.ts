// src/models/Vocabulary/AcceptedWordBuryat.ts
import { Schema, Types, model } from 'mongoose';

// Переименован и экспортирован
export interface IAcceptedWordBuryat {
    text: string;
    normalized_text: string;
    author: Types.ObjectId;
    contributors: Types.ObjectId[];
    translations: Types.ObjectId[];
    translations_u: Types.ObjectId[];
    createdAt: Date;
    dialect: Types.ObjectId | null; // Сделаем опциональным для большей гибкости? Или required?
    themes: Types.ObjectId[];
    // updated_at?: Date; // Добавлено из timestamps
}

const WordSchema = new Schema<IAcceptedWordBuryat>(
    {
        text: { type: String, required: true },
        normalized_text: {
            type: String,
            required: true,
            lowercase: true,
            unique: true,
            index: true,
        }, // Добавлен index
        dialect: {
            type: Schema.Types.ObjectId || null,
            ref: 'dialects',
            required: false,
        },
        translations: {
            type: [
                {
                    type: Schema.Types.ObjectId,
                    ref: 'word-on-russian-language',
                },
            ],
            default: [],
        },
        translations_u: {
            type: [
                {
                    type: Schema.Types.ObjectId,
                    ref: 'suggested-words-on-russian-language',
                },
            ],
            default: [],
        }, // Проверьте ref! Возможно, здесь должно быть suggested-words-on-russian-language
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

const AcceptedWordBuryatModel = model<IAcceptedWordBuryat>(
    'word-on-buryat-language',
    WordSchema,
);
export default AcceptedWordBuryatModel; // Экспорт модели
