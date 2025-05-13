// src/models/TelegramUser.ts
import { Document, Schema, Types, model } from 'mongoose';
import { User } from 'telegraf/typings/core/types/typegram';
import LevelModel, { ILevel } from './Level';
const { customAlphabet } = require('nanoid');
import { LevelUpdateError } from '../errors/customErrors';

export interface TelegramUser extends User {
    _id: Types.ObjectId;
    rating: number;
    custom_username: string;
    level: Types.ObjectId | ILevel;
    referrals: Types.ObjectId[];
    referral_code: string;
    referred_by: null | Types.ObjectId;
    id: number;
    email: string;
    theme: 'light' | 'dark';
    platform: string;
    via_app: boolean;
    photo_url: string | null;
    phone: string | null;
    role: 'admin' | 'user' | 'moderator'
    dailyRating: number;
    vocabular: {
        selected_language_for_translate: 'russian' | 'buryat';
        proccesed_word_id: Types.ObjectId;
    };
    currentQuestion: {
        lessonId: Types.ObjectId;
        questionPosition: number;
    };
    subscription: {
        type: 'monthly' | 'quarterly' | 'annual' | null;
        startDate: Date | null;
        endDate: Date | null;
        isActive: boolean;
        paymentId: Types.ObjectId;
    };
    botusername: string;
    blocked?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface TelegramUserDocument extends TelegramUser, Document {
    id: number;
    _id: Types.ObjectId;
    updateLevel(): Promise<void>;
    hasActiveSubscription(): boolean; // <--- Добавил тип возвращаемого значения
    activateSubscription( // <--- Улучшил типизацию и добавил async/await
        type: 'monthly' | 'quarterly' | 'annual',
        paymentId: Types.ObjectId,
    ): Promise<void>;
}

const TelegramUserSchema: Schema<TelegramUserDocument> = new Schema(
    {
        id: { type: Number, required: true, unique: true },
        username: { type: String, required: false },
        custom_username: { type: String, required: false, default: '' },
        first_name: { type: String, required: false },
        email: { type: String, required: false }, // Можно добавить index: true, unique: true (если нужно)
        phone: { type: String, required: false, default: "" },
        platform: { type: String, required: false },

        currentQuestion: {
            lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson' },
            questionPosition: { type: Number, default: 1 },
        },

        rating: { type: Number, required: true, default: 1, index: true }, // Добавил index
        dailyRating: { type: Number, required: true, default: 1 },
        level: { type: Schema.Types.ObjectId, ref: 'Level', required: true },
        via_app: { type: Boolean, required: false, default: false },
        photo_url: { type: String, required: false, default: '' },
        role: {
            type: String,
            enum: ['admin', 'user', 'moderator'],
            default: 'user',
            index: true, // Добавил index
        },
        vocabular: {
            selected_language_for_translate: {
                type: String,
                enum: ['russian', 'buryat'],
                required: true,
                default: 'russian',
            },
            proccesed_word_id: {
                type: Schema.Types.ObjectId
            }
        },
        theme: {
            type: String,
            enum: ['light', 'dark'],
            default: 'light',
        },
        subscription: {
            type: {
                type: String,
                enum: ['monthly', 'quarterly', 'annual', null],
                default: null,
            },
            paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
            startDate: { type: Date, default: null },
            endDate: { type: Date, default: null },
            isActive: { type: Boolean, default: false, index: true }, // Добавил index
        },
        referral_code: {
            type: String,
            unique: true,
            default: generateReferralCode, // <--- Используем обновленную функцию
            index: true, // Добавил index
        },
        referred_by: {
            type: Schema.Types.ObjectId,
            ref: 'telegram_user',
            default: null,
            index: true, // Добавил index
        },
        referrals: [{ type: Schema.Types.ObjectId, ref: 'telegram_user' }],
        botusername: { type: String },
        blocked: {
            type: Boolean,
            default: false, // Добавил default
            index: true, // Добавил index
        },
    },
    {
        timestamps: true,
    },
);

// --- Методы ---

TelegramUserSchema.methods.updateLevel = async function (
    this: TelegramUserDocument,
): Promise<void> {
    try {
            const user = this;

    // Find the corresponding level based on the rating
    const level: ILevel | null = await LevelModel.findOne({
        minRating: { $lte: user.rating },
        $or: [{ maxRating: { $gte: user.rating } }, { maxRating: null }],
    }).sort({ minRating: -1 });

    if (level) {
        // Check if level is an ObjectId and if it's different from the new level's ID
        // Эта проверка сработает корректно, если user.level не был заселен (populated)
        if (
            !(user.level instanceof Types.ObjectId) ||
            !user.level.equals(level._id)
        ) {
            // Если user.level был заселен (является объектом ILevel), нужно сравнить ID
            if (
                user.level instanceof Types.ObjectId ||
                (user.level as ILevel)._id?.equals(level._id)
            ) {
                // Уровень не изменился
            } else {
                user.level = level._id;
                // console.log(`User ${user.id} level updated to ${level.name}`);
                await user.save();
            }
        }
    }
    } catch (error: any) {
        throw new LevelUpdateError(
            `Failed to update level for user ${this.id}`,
            error,
        );
    }
 };

TelegramUserSchema.methods.hasActiveSubscription = function (
    this: TelegramUserDocument,
): boolean {
    const subscription = this.subscription;
    return !!(
        // Используем !! для явного приведения к boolean
        (
            subscription && // Убедимся, что объект subscription существует
            subscription.isActive &&
            subscription.endDate &&
            new Date() <= subscription.endDate
        )
    );
};

// Делаем метод асинхронным, так как он вызывает save()
TelegramUserSchema.methods.activateSubscription = async function (
    this: TelegramUserDocument, // Явно указываем тип this
    type: 'monthly' | 'quarterly' | 'annual',
    paymentId: Types.ObjectId,
): Promise<void> {
    // Возвращаем Promise<void>
    const durationMap = {
        monthly: 30,
        quarterly: 90, // Обычно квартал ~91 день, но 90 проще
        annual: 365,
    };

    const now = new Date();
    // Рассчитываем endDate. Убедимся, что endDate не null
    const endDate = new Date(
        now.getTime() + durationMap[type] * 24 * 60 * 60 * 1000,
    );

    this.subscription = {
        type: type,
        paymentId: paymentId,
        startDate: now,
        endDate: endDate,
        isActive: true,
    };

    await this.save(); // Используем await для сохранения
};

// --- Модель ---
const TelegramUserModel = model<TelegramUserDocument>(
    'telegram_user', // Имя коллекции будет 'telegram_users'
    TelegramUserSchema,
);

// --- Генератор реферального кода с использованием nanoid ---
// Определяем алфавит (заглавные буквы + цифры) и длину кода
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const referralCodeLength = 6; // Та же длина, что была у substring(2, 8)

// Создаем кастомный генератор nanoid
const nanoidReferral = customAlphabet(alphabet, referralCodeLength);

function generateReferralCode(): string {
    // Генерируем код с помощью кастомного генератора
    return nanoidReferral();
}

export default TelegramUserModel;
