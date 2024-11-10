// src/models/Module.ts

import { Schema, model, Document } from 'mongoose';

export interface IModule extends Document {
    title: string;
    description: string;
    lessons: Schema.Types.ObjectId[]; // Ссылки на уроки
    createdAt: Date;
    updatedAt: Date;
}

const moduleSchema = new Schema<IModule>(
    {
        title: {
            type: String,
            required: [true, 'Заголовок модуля обязателен'],
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
    },
    {
        timestamps: true, // Автоматически добавляет поля createdAt и updatedAt
    }
);

const Module = model<IModule>('Module', moduleSchema);

export default Module;
