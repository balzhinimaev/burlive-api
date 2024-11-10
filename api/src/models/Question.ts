// src/models/Question.ts
import { Schema, model, Document } from 'mongoose';

export interface IQuestion extends Document {
    text: string;
    options: string[];
    correctOption: number;
    test: Schema.Types.ObjectId;
}

const QuestionSchema = new Schema<IQuestion>({
    text: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctOption: { type: Number, required: true },
    test: { type: Schema.Types.ObjectId, ref: 'Test', required: true },
});

export default model<IQuestion>('Question', QuestionSchema);
