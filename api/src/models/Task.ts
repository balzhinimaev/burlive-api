import { Schema, model, Document } from 'mongoose';

export interface ITask extends Document {
    title: string;
    description?: string;
    taskType: 'subscription' | 'translation' | 'data_entry' | 'other';
    rewardPoints: number;
    imageUrl?: string; // необязательное поле для ссылки на изображение
}

const TaskSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        description: { type: String },
        taskType: {
            type: String,
            enum: ['subscription', 'translation', 'data_entry', 'other'],
            required: true,
        },
        rewardPoints: { type: Number, required: true, default: 0 },
        imageUrl: { type: String, default: '' }, // если ссылка не указана, хранится пустая строка
    },
    { timestamps: true },
);

export default model<ITask>('Task', TaskSchema);