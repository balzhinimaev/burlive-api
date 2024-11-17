import mongoose, { Schema, Document } from 'mongoose';

interface ILesson extends Document {
    title: string;
    content: string;
    moduleId: mongoose.Types.ObjectId;
    order: number;
    questions: {
        question: string;
        options: string[];
        correct: number;
    }[];
}

const LessonSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        content: { type: String, required: true },
        moduleId: { type: mongoose.Types.ObjectId, ref: 'Module', required: true },
        order: { type: Number, required: true },
        questions: [
            {
                question: { type: String, required: true },
                options: { type: [String], required: true },
                correct: { type: Number, required: true },
            },
        ],
    },
    { timestamps: true }
);

export default mongoose.model<ILesson>('Lesson', LessonSchema);
