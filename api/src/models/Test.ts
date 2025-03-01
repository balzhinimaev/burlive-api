import mongoose, { Schema, Types, Document } from 'mongoose';

export interface ITest extends Document {
    lessonId: Types.ObjectId;
    questions: Types.ObjectId[]; // Ссылки на вопросы
    totalQuestions: number;
    passingScore: number;
}

const TestSchema: Schema = new Schema(
    {
        lessonId: {
            type: mongoose.Types.ObjectId,
            ref: 'Lesson',
            required: true,
        },
        questions: [{ type: mongoose.Types.ObjectId, ref: 'Question' }],
        totalQuestions: { type: Number, required: true },
        passingScore: { type: Number, required: true },
    },
    { timestamps: true },
);

export default mongoose.model<ITest>('Test', TestSchema);