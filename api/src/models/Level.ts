// src/models/Level.ts
import { Schema, model, Document } from 'mongoose';

export interface ILevel extends Document {
    title: string;
    description: string;
    order: number;
    modules: Schema.Types.ObjectId[];
}

const LevelSchema = new Schema<ILevel>({
    title: { type: String, required: true },
    description: { type: String },
    order: { type: Number, required: true },
    modules: [{ type: Schema.Types.ObjectId, ref: 'Module' }],
});

export default model<ILevel>('Level', LevelSchema);
