import mongoose, { Schema, Document } from 'mongoose';

interface ITelegramUserAction extends Document {
    userId: number;
    updateType: string;
    data: any;
}

const TelegramUserActionSchema: Schema = new Schema(
    {
        userId: { type: Number, required: true },
        updateType: { type: String, required: true },
        data: { type: Schema.Types.Mixed, required: true }, // Используем Schema.Types.Mixed для произвольных данных
    },
    {
        timestamps: true, // Сохраняет createdAt и updatedAt
    },
);

// Индекс по userId для быстрого поиска действий конкретного пользователя
TelegramUserActionSchema.index({ userId: 1 });

const TelegramUserActionModel = mongoose.model<ITelegramUserAction>(
    'TelegramUserAction',
    TelegramUserActionSchema,
);
export default TelegramUserActionModel;
