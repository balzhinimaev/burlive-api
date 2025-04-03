import { Document, Schema, Types, model } from "mongoose";

export interface IWordHistoryModel extends Document {
  _id: string;
  searched: Types.ObjectId;
  user: Types.ObjectId;
  target_language: "russian" | "buryat";
  createdAt: Date;
  // Additional fields, if needed
}

const WordSchema = new Schema(
  {
    searched: { type: Schema.Types.ObjectId, ref: "searched-word" },
    user: { type: Schema.Types.ObjectId, ref: "telegram_user" },
    target_language: { type: String, required: true }
  },
  {
    timestamps: {
        createdAt: true,
        updatedAt: false
    },
    versionKey: false
  }
);

const SearchedWordHistoryModel = model<IWordHistoryModel>(
    'searched-word-history',
    WordSchema,
);
export default SearchedWordHistoryModel;
