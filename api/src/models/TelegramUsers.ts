// src/models/TelegramUser.ts
import { Document, Schema, Types, model } from "mongoose";
import { User } from "telegraf/typings/core/types/typegram";
import LevelModel, { ILevel } from "./Level";

interface TelegramUser extends User {
  _id: Types.ObjectId;
  rating: number;
  level: Types.ObjectId | ILevel;
  referrals_telegram?: Types.ObjectId[];
  id: number;
  email: string;
  c_username: string;
  theme: "light" | "dark";
  platform: string;
  via_app: boolean;
  photo_url: string;
  phone?: string;
  role: "admin" | "user" | "moderator" | undefined;
  vocabular: {
    selected_language_for_translate: "russian" | "buryat";
  };
  subscription: {
    type: "monthly" | "quarterly" | "annual" | null;
    startDate: Date | null;
    endDate: Date | null;
    isActive: boolean;
    paymentId: Types.ObjectId;
  };
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
    c_username: { type: String, required: false, default: "" },
    first_name: { type: String, required: false },
    email: { type: String, required: false },
    phone: { type: String, required: false },
    platform: { type: String, required: false },
    referrals_telegram: [{ type: Schema.Types.ObjectId, ref: "telegram_user" }],

    rating: { type: Number, required: true, default: 1 },
    level: { type: Schema.Types.ObjectId, ref: "Level", required: true },

    via_app: { type: Boolean, required: false, default: false },
    photo_url: { type: String, required: false, default: "" },
    role: { type: String, enum: ["admin", "user", "moderator"], default: "user" },
    vocabular: {
      selected_language_for_translate: {
        type: String,
        enum: ["russian", "buryat"],
        required: true,
        default: "russian",
      },
    },
    theme: {
      type: String,
      enum: ["light", "dark"],
      default: "light",
    },
    subscription: {
      type: {
        type: String,
        enum: ["monthly", "quarterly", "annual", null],
        default: null,
      },
      paymentId: { type: Schema.Types.ObjectId, ref: "Payment", required: true },
      startDate: { type: Date, default: null },
      endDate: { type: Date, default: null },
      isActive: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  }
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

export default TelegramUserModel;