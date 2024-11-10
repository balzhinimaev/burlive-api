// src/models/Lesson.ts
import { Schema, model, Document } from 'mongoose';

export interface ILesson extends Document {
    title: string;
    content: string;
    order: number;
    module: Schema.Types.ObjectId;
}

const LessonSchema = new Schema<ILesson>({
    title: { type: String, required: true },
    content: { type: String, required: true },
    order: { type: Number, required: true },
    module: { type: Schema.Types.ObjectId, ref: 'Module', required: true },
});

export default model<ILesson>('Lesson', LessonSchema);
