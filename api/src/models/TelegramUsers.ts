import { Schema, Types, model } from "mongoose";
import { User } from "telegraf/typings/core/types/typegram";

interface TelegramUser extends User {
    rating: number;
    referrals_telegram?: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
    vocabular: {
      selected_language_for_translate: 'russian' | 'buryat'
    }
}

const TelegramUserSchema: Schema<TelegramUser> = new Schema<TelegramUser>(
  {
    id: { type: Number, required: true },
    username: { type: String, required: false },
    first_name: { type: String, required: false },
    last_name: { type: String, required: false },
    referrals_telegram: [{ type: Schema.Types.ObjectId, ref: "telegram_user" }],
    rating: { type: Number, required: true, default: 1 }, // добавлено поле "рейтинг",
    vocabular: {
      selected_language_for_translate: {
        type: String,
        enum: ["russian", "buryat"],
        required: true,
        default: "russian",
      },
    },
  },
  {
    timestamps: true,
  }
);

const TelegramUserModel = model<TelegramUser>("telegram_user", TelegramUserSchema);

export default TelegramUserModel;
