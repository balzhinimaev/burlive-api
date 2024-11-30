// src/models/Level.ts
import { Schema, model, Document, Types } from "mongoose";

export interface ILevel extends Document {
    name: string;
    icon: string;
    minRating: number;
    maxRating?: number; // undefined для последнего уровня
    createdAt: Date;
    updatedAt: Date;
    _id: Types.ObjectId;
}

const LevelSchema: Schema<ILevel> = new Schema<ILevel>(
    {
        name: { type: String, required: true, unique: true },
        icon: { type: String, required: true },
        minRating: { type: Number, required: true },
        maxRating: { type: Number, required: false },
    },
    {
        timestamps: true,
    }
);

const LevelModel = model<ILevel>("Level", LevelSchema);

export default LevelModel;
