// src/models/Test.ts
import { Schema, model, Document } from 'mongoose';

export interface ITest extends Document {
    title: string;
    description: string;
    level: Schema.Types.ObjectId;
    questions: Schema.Types.ObjectId[];
}

const TestSchema = new Schema<ITest>({
    title: { type: String, required: true },
    description: { type: String },
    level: { type: Schema.Types.ObjectId, ref: 'Level', required: true },
    questions: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
});

export default model<ITest>('Test', TestSchema);
