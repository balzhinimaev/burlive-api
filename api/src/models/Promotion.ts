// src/models/Promotion.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IPrize {
    minRank: number; // минимальный ранг, с которого действует приз
    maxRank: number; // максимальный ранг, до которого действует приз
    prizeType: 'money' | 'telegram_premium'; // тип приза
    amount: number; // сумма (например, в рублях или количество месяцев премиума)
    description?: string; // описание приза
}

export interface IWinner {
    user: mongoose.Types.ObjectId; // ссылка на победителя (TelegramUser)
    rank: number; // занимаемое место
    prize: IPrize; // приз, который получил победитель
}

export interface IPromotion extends Document {
    title: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    status: 'pending' | 'active' | 'finished';
    prizes: IPrize[]; // схема распределения призов по рангам
    winners?: IWinner[]; // список победителей после завершения акции
    createdAt: Date;
    updatedAt: Date;
}

const PrizeSchema: Schema = new Schema(
    {
        minRank: { type: Number, required: true },
        maxRank: { type: Number, required: true },
        prizeType: {
            type: String,
            enum: ['money', 'telegram_premium'],
            required: true,
        },
        amount: { type: Number, required: true },
        description: { type: String },
    },
    { _id: false },
);

const WinnerSchema: Schema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'telegram_user',
            required: true,
        },
        rank: { type: Number, required: true },
        prize: { type: PrizeSchema, required: true },
    },
    { _id: false },
);

const PromotionSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        description: { type: String },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        status: {
            type: String,
            enum: ['pending', 'active', 'finished'],
            default: 'pending',
        },
        prizes: { type: [PrizeSchema], default: [] },
        winners: { type: [WinnerSchema], default: [] },
    },
    { timestamps: true },
);

export default mongoose.model<IPromotion>('Promotion', PromotionSchema);
