// src/models/Vocabulary/ThemeModel.ts
import { Document, Schema, Types, model } from "mongoose";
import { IWordModel } from "./WordModel";
import { IView } from "../View"; // Убедитесь, что путь к модели View корректен

export interface IThemeModel extends Document {
    name: string;
    description?: string;
    words: Types.ObjectId[] | IWordModel[];
    complexity: number;
    viewCounter: number;
    views: Types.ObjectId[] | IView[];
    createdAt: Date;
    updatedAt: Date;
    // Дополнительные поля, если нужно
}

const allowedComplexities = [1, 1.5, 2, 2.5, 3];

const ThemeSchema = new Schema<IThemeModel>(
    {
        name: { type: String, required: true, unique: true },
        description: { type: String },
        words: [{ type: Schema.Types.ObjectId, ref: "word", default: [] }],
        complexity: {
            type: Number,
            required: true,
            enum: allowedComplexities,
            default: 1,
        },
        viewCounter: { type: Number, default: 0 },
        views: [{ type: Schema.Types.ObjectId, ref: "View", default: [] }],
        // Дополнительные поля, если нужно
    },
    {
        timestamps: true,
    }
);

const ThemeModel = model<IThemeModel>("theme", ThemeSchema);
export default ThemeModel;
