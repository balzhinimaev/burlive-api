import mongoose, { Schema, Types, Document } from 'mongoose';

export interface IProgress extends Document {
    userId: Types.ObjectId;
    testId: Types.ObjectId;
    answers: { questionId: Types.ObjectId; selectedOption: number }[];
    score: number;
    completed: boolean;
}

const ProgressSchema: Schema = new Schema(
    {
        userId: {
            type: mongoose.Types.ObjectId,
            ref: 'telegram_user',
            required: true,
        },
        testId: { type: mongoose.Types.ObjectId, ref: 'Test', required: true },
        answers: [
            {
                questionId: { type: mongoose.Types.ObjectId, ref: 'Question' },
                selectedOption: { type: Number, required: true },
            },
        ],
        score: { type: Number, default: 0 },
        completed: { type: Boolean, default: false },
    },
    { timestamps: true },
);

export default mongoose.model<IProgress>('Progress', ProgressSchema);
