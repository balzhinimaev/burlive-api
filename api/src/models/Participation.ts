// src/models/Participation.ts
import { Schema, Document, model, Types } from 'mongoose';

export interface IParticipation extends Document {
    promotion: Types.ObjectId; // Ссылка на акцию (Promotion)
    user: Types.ObjectId; // Ссылка на пользователя (TelegramUser)
    points: number; // Набранные очки в рамках акции
    tasksCompleted: Types.ObjectId[]; // (Опционально) список выполненных заданий, чтобы предотвратить повторное начисление
    createdAt: Date;
    updatedAt: Date;
}

const ParticipationSchema: Schema = new Schema(
    {
        promotion: {
            type: Schema.Types.ObjectId,
            ref: 'Promotion',
            required: true,
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: 'telegram_user',
            required: true,
        },
        points: { type: Number, required: true, default: 0 },
        tasksCompleted: [
            { type: Schema.Types.ObjectId, ref: 'TaskCompletion' },
        ],
    },
    { timestamps: true },
);

export default model<IParticipation>('Participation', ParticipationSchema);
