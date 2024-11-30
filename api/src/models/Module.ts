// src/models/Module.ts

import { Schema, model, Document, Types } from 'mongoose';

export interface IModule extends Document {
    title: string;
    short_title: string;
    description: string;
    lessons: Types.ObjectId[]; // Используйте Types.ObjectId
    createdAt: Date;
    updatedAt: Date;
    order?: number;
    viewsCounter: number;
    views: Types.ObjectId[];
}

const moduleSchema = new Schema<IModule>(
    {
        title: {
            type: String,
            required: [true, 'Заголовок модуля обязателен'],
            trim: true,
        },
        short_title: {
            type: String,
            required: [true, 'Короткий заголовок модуля обязателен'],
            trim: true,
        },
        description: {
            type: String,
            required: [true, 'Описание модуля обязательно'],
            trim: true,
        },
        lessons: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Lesson',
            },
        ],
        order: { type: Number, required: false },
        viewsCounter: { type: Number, default: 0 },
        views: {
            type: [{ type: Schema.Types.ObjectId, ref: 'View' }],
            default: []
        }

    },
    {
        timestamps: true, // Автоматически добавляет поля createdAt и updatedAt
    }
);

const Module = model<IModule>('Module', moduleSchema);

export default Module;
