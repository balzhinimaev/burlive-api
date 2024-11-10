// src/models/Word.ts
import { Schema, model, Document } from 'mongoose';

export interface IWord extends Document {
    word: string;
    translation: string;
    pronunciation?: string;
    example?: string;
    level: Schema.Types.ObjectId;
}

const WordSchema = new Schema<IWord>({
    word: { type: String, required: true },
    translation: { type: String, required: true },
    pronunciation: { type: String },
    example: { type: String },
    level: { type: Schema.Types.ObjectId, ref: 'Level', required: true },
});

export default model<IWord>('Word', WordSchema);
