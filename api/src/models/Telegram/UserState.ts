// models/Telegram/UserState.ts
import mongoose, { Schema, Document } from "mongoose";

interface ITelegramUserState extends Document {
  userId: number;
  scene: string;
  stateData: any;
}

const TelegramUserStateSchema: Schema = new Schema({
  userId: { type: Number, required: true, unique: true },
  scene: { type: String, required: true },
  stateData: { type: Schema.Types.Mixed, default: {} },
});

const TelegramUserState = mongoose.model<ITelegramUserState>(
  "TelegramUserState",
  TelegramUserStateSchema
);
export default TelegramUserState;
