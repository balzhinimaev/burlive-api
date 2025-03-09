// src/models/TelegramUser.ts
import { Document, Schema, Types, model } from "mongoose";
import { User } from "telegraf/typings/core/types/typegram";
import LevelModel, { ILevel } from "./Level";

export interface TelegramUser extends User {
    _id: Types.ObjectId;
    rating: number;
    level: Types.ObjectId | ILevel;
    referrals_telegram: Types.ObjectId[];
    referral_code: string;
    referred_by: null | Types.ObjectId;
    id: number;
    email: string;
    c_username: string;
    theme: 'light' | 'dark';
    platform: string;
    via_app: boolean;
    photo_url: string;
    phone?: string | number;
    role: 'admin' | 'user' | 'moderator' | undefined;
    dailyRating: number;
    actions: Types.ObjectId[];

    vocabular: {
        selected_language_for_translate: 'russian' | 'buryat';
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
    blocked?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

interface TelegramUserDocument extends TelegramUser, Document {
  id: number;
  _id: Types.ObjectId;
  updateLevel(): Promise<void>;
}

const TelegramUserSchema: Schema<TelegramUserDocument> = new Schema(
    {
        id: { type: Number, required: true },
        username: { type: String, required: false },
        c_username: { type: String, required: false, default: '' },
        first_name: { type: String, required: false },
        email: { type: String, required: false },
        phone: { type: String || Number, required: false },
        platform: { type: String, required: false },

        currentQuestion: {
            lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson' },
            questionPosition: { type: Number, default: 1 },
        },

        rating: { type: Number, required: true, default: 1 },
        dailyRating: { type: Number, required: true, default: 1 },
        level: { type: Schema.Types.ObjectId, ref: 'Level', required: true },
        actions: [{ type: Schema.Types.ObjectId, ref: 'TelegramUserAction' }],
        via_app: { type: Boolean, required: false, default: false },
        photo_url: { type: String, required: false, default: '' },
        role: {
            type: String,
            enum: ['admin', 'user', 'moderator'],
            default: 'user',
        },
        vocabular: {
            selected_language_for_translate: {
                type: String,
                enum: ['russian', 'buryat'],
                required: true,
                default: 'russian',
            },
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
            isActive: { type: Boolean, default: false },
        },
        referral_code: {
            type: String,
            unique: true,
            default: generateReferralCode,
        },
        referred_by: {
            type: Schema.Types.ObjectId,
            ref: 'telegram_user',
            default: null,
        },
        // referrals_telegram уже присутствует и хранит список ObjectId приглашённых пользователей
        referrals_telegram: [
            { type: Schema.Types.ObjectId, ref: 'telegram_user' },
        ],
        blocked: {
            type: Boolean,
        },
    },
    {
        timestamps: true,
    },
);

// src/models/TelegramUser.ts
TelegramUserSchema.methods.updateLevel = async function (
  this: TelegramUserDocument
): Promise<void> {
  const user = this;

  // Find the corresponding level based on the rating
  const level: ILevel | null = await LevelModel.findOne({
    minRating: { $lte: user.rating },
    $or: [{ maxRating: { $gte: user.rating } }, { maxRating: null }],
  }).sort({ minRating: -1 });

  if (level) {
    // Ensure user.level is an ObjectId
    if (!(user.level instanceof Types.ObjectId)) {
      throw new Error('User level is not an ObjectId');
    }

    // Compare current level with the found level
    if (!user.level.equals(level._id)) {
      user.level = level._id;
      // Additional actions upon level change
      // e.g., sendLevelUpNotification(user, level);
      await user.save(); // Now TypeScript recognizes 'save()' method
    }
  }
};

TelegramUserSchema.methods.hasActiveSubscription = function (): boolean {
  const subscription = this.subscription;
  return subscription.isActive && subscription.endDate && new Date() <= subscription.endDate;
};
TelegramUserSchema.methods.activateSubscription = function (
  type: "monthly" | "quarterly" | "annual",
  paymentId: Types.ObjectId
): void {
  const durationMap = {
    monthly: 30,
    quarterly: 90,
    annual: 365,
  };

  const now = new Date();
  const endDate = new Date(now.getTime() + durationMap[type] * 24 * 60 * 60 * 1000);

  this.subscription = {
    type,
    paymentId,
    startDate: now,
    endDate,
    isActive: true,
  };

  this.save();
};

const TelegramUserModel = model<TelegramUserDocument>(
  'telegram_user',
  TelegramUserSchema
);

function generateReferralCode(): string {
    // Пример генерации кода – можно улучшить алгоритм
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default TelegramUserModel;