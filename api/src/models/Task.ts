import { Schema, model, Document, Types } from 'mongoose';

export interface ITask extends Document {
    _id: Types.ObjectId;
    title: string;
    description?: string;
    taskType:
        | 'subscription'
        | 'translation'
        | 'data_entry'
        | 'friend'
        | 'other';
    rewardPoints: number;
    promotionId: Types.ObjectId;
    order?: number;
    imageUrl?: string;
    telegram_channel?: string;
    telegram_chat_id?: number;
    status: 'active' | 'inactive' | 'completed'; // Добавлен статус задачи
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
        },
        telegram_channel: {
            type: String,
            default: 'bur_live',
        },
        telegram_chat_id: {
            type: Number,
        },
        // Добавлено поле статуса с enum и значением по умолчанию
        status: {
            type: String,
            enum: ['active', 'inactive', 'completed'],
            default: 'active',
            required: true,
        },
        promotionId: {
            type: Schema.Types.ObjectId,
            ref: 'Promotion',
            required: true
            // default: null,
        },
    },
    { timestamps: true },
);

export default model<ITask>('Task', TaskSchema);