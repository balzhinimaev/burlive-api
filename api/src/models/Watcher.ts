import { Document, Schema, model, Types } from "mongoose";

interface IWatcher extends Document {
  telegramUserId: Types.ObjectId;
  sentenceId: Types.ObjectId;
  createdAt: Date;
  expiresAt: Date;
}

const WatcherSchema = new Schema<IWatcher>({
  telegramUserId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "telegram_user",
  },
  sentenceId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Suggested_sentences",
  },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, index: { expires: 15 } }, // TTL индекс в секундах
});

const Watcher = model<IWatcher>("Watcher", WatcherSchema);

export default Watcher;
