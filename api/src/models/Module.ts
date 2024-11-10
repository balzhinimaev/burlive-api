// src/models/Module.ts
import { Schema, model, Document } from 'mongoose';

export interface IModule extends Document {
    title: string;
    description: string;
    order: number;
    lessons: Schema.Types.ObjectId[];
    level: Schema.Types.ObjectId;
}

const ModuleSchema = new Schema<IModule>({
    title: { type: String, required: true },
    description: { type: String },
    order: { type: Number, required: true },
    lessons: [{ type: Schema.Types.ObjectId, ref: 'Lesson' }],
    level: { type: Schema.Types.ObjectId, ref: 'Level', required: true },
});

export default model<IModule>('Module', ModuleSchema);