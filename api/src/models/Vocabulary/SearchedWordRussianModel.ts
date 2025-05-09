import { Document, Schema, Types, model } from 'mongoose';

// Interface for search data
interface ISearchData {
    content: string;
    user_id: Types.ObjectId;
    createdAt: Date;
}

export interface IWordModel extends Document {
    _id: string;
    text: string;
    normalized_text: string; // Новый атрибут для нормализованного текста
    target_language: string;
    source_language: string;
    users: Types.ObjectId[];
    search_data: ISearchData[];
    createdAt: Date;
    // Additional fields, if needed
}

// Define the SearchData schema
// const SearchDataSchema = new Schema({
//     content: { type: String, required: true },
//     user_id: {
//         type: Schema.Types.ObjectId,
//         ref: 'telegram_user',
//         required: true,
//     },
//     normalized_text: String,
//     createdAt: { type: Date, default: Date.now },
// });

const WordSchema = new Schema(
    {
        text: { type: String, required: true },
        normalized_text: {
            type: String,
            required: true,
            lowercase: true,
            unique: true,
        }, // Новый атрибут
        target_language: { type: String },
        source_language: { type: String },
        users: [{ type: Schema.Types.ObjectId, ref: 'telegram_user' }],
        // search_data: [SearchDataSchema],
    },
    {
        timestamps: true,
    },
);

const SearchedWordModel = model<IWordModel>(
    'searched-word-russian',
    WordSchema,
);
export default SearchedWordModel;
