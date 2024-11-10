// src/models/UserProgress.ts
import { Schema, model, Document } from 'mongoose';

export interface IUserProgress extends Document {
    user: Schema.Types.ObjectId;
    level: Schema.Types.ObjectId;
    currentModule: Schema.Types.ObjectId | null;
    currentLesson: Schema.Types.ObjectId | null;
    completedLessons: Schema.Types.ObjectId[];
    vocabulary: {
        word: Schema.Types.ObjectId;
        learned: boolean;
        lastReviewed: Date;
    }[];
    testScores: {
        test: Schema.Types.ObjectId;
        score: number;
        dateTaken: Date;
    }[];
}

const UserProgressSchema = new Schema<IUserProgress>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    level: { type: Schema.Types.ObjectId, ref: 'Level', required: true },
    currentModule: { type: Schema.Types.ObjectId, ref: 'Module', default: null },
    currentLesson: { type: Schema.Types.ObjectId, ref: 'Lesson', default: null },
    completedLessons: [{ type: Schema.Types.ObjectId, ref: 'Lesson' }],
    vocabulary: [
        {
            word: { type: Schema.Types.ObjectId, ref: 'Word' },
            learned: { type: Boolean, default: false },
            lastReviewed: { type: Date },
        },
    ],
    testScores: [
        {
            test: { type: Schema.Types.ObjectId, ref: 'Test' },
            score: { type: Number },
            dateTaken: { type: Date, default: Date.now },
        },
    ],
});

export default model<IUserProgress>('UserProgress', UserProgressSchema);
