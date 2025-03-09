import { Schema, model, Document, Types } from 'mongoose';

export interface ITaskCompletion extends Document {
    task: Types.ObjectId; // Ссылка на задание (Task)
    user: Types.ObjectId; // Ссылка на пользователя (TelegramUser)
    promotion?: Types.ObjectId; // Опционально: если выполнение задания привязано к конкретной акции
    rewardPoints: number; // Начисленные очки
    completedAt: Date;
}

const TaskCompletionSchema: Schema = new Schema(
    {
        task: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
        user: {
            type: Schema.Types.ObjectId,
            ref: 'telegram_user',
            required: true,
        },
        promotion: { type: Schema.Types.ObjectId, ref: 'Promotion' },
        rewardPoints: { type: Number, required: true, default: 0 },
        completedAt: { type: Date, default: Date.now },
    },
    { timestamps: true },
);

export default model<ITaskCompletion>('TaskCompletion', TaskCompletionSchema);
    