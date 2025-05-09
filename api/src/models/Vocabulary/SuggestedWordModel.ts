// SuggestedWordModel.ts
import { Document, Schema, Types, model } from 'mongoose';

export interface ISuggestedWordModel extends Document {
    text: string;
    normalized_text: string; // Новый атрибут для нормализованного текста
    language: string;
    author: Types.ObjectId;
    contributors: Types.ObjectId[];
    status: 'new' | 'processing' | 'accepted' | 'rejected'; // Added field for status
    dialect: string;
    createdAt: Date;
    pre_translations: Types.ObjectId[];
    themes: Types.ObjectId[];
    // Additional fields, if needed
}

const SuggestedWordSchema = new Schema({
    text: { type: String, required: true },
    normalized_text: {
        type: String,
        required: true,
        lowercase: true,
        unique: true,
    }, // Новый атрибут
    language: { type: String },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'telegram_user',
        required: true,
    },
    contributors: [{ type: Schema.Types.ObjectId, ref: 'telegram_user' }],
    status: {
        type: String,
        enum: ['new', 'processing', 'accepted', 'rejected'],
        default: 'new',
    },
    themes: [{ type: Schema.Types.ObjectId, ref: 'theme', default: [] }],
    dialect: { type: String },
    pre_translations: [{ type: Schema.Types.ObjectId, ref: 'word' }],
    createdAt: { type: Date, default: Date.now },
    // Additional fields, if needed
});

const SuggestedWordModel = model<ISuggestedWordModel>(
    'suggested_word',
    SuggestedWordSchema,
);
export default SuggestedWordModel;
