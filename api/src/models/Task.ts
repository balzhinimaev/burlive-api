import { Schema, model, Document } from 'mongoose';

export interface ITask extends Document {
    title: string;
    description?: string;
    taskType: 'subscription' | 'translation' | 'data_entry' | 'friend' | 'other';
    rewardPoints: number;
    order?: number;
    imageUrl?: string; // необязательное поле для ссылки на изображение
    telegram_channel?: string;
}

const TaskSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        description: { type: String },
        taskType: {
            type: String,
            enum: [
                'subscription',
                'translation',
                'data_entry',
                'friend',
                'other',
            ],
            required: true,
        },
        rewardPoints: { type: Number, required: true, default: 0 },
        order: { type: Number, required: false, default: 0 },
        imageUrl: {
            type: String,
            default: '1741494346318-460603479-photo_2025-03-09_12-24-42.jpg',
        }, // если ссылка не указана, хранится пустая строка
        telegram_channel: {
            type: String,
            default: 'bur_live',
        }, // если ссылка не указана, хранится пустая строка
    },
    { timestamps: true },
);

export default model<ITask>('Task', TaskSchema);