import mongoose, { Schema, Types, Document } from 'mongoose';

export interface IQuestion extends Document {
    _id: Types.ObjectId;
    question: string;
    options: string[];
    correct: number;
    type: string;
    explanation: string;
}

const QuestionSchema: Schema = new Schema(
    {
        question: { type: String, required: true },
        options: { type: [String], required: true },
        correct: { type: Number, required: true },
        type: { type: String, required: true },
        explanation: { type: String, required: true }
    },
    { timestamps: true }
);

export default mongoose.model<IQuestion>('Question', QuestionSchema);
