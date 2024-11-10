// src/models/Vocabulary/DeclinedWordModel.ts
import { Document, Schema, Types, model } from "mongoose";

export interface IDeclinedWordModel extends Document {
  text: string;
  normalized_text: string;
  language: string;
  author: Types.ObjectId;
  contributors: Types.ObjectId[];
  translations: Types.ObjectId[];
  createdAt: Date;
  dialect: string;
  // Additional fields, if needed
}

const DeclinedWordSchema = new Schema<IDeclinedWordModel>(
  {
    text: { type: String, required: true, unique: true },
    normalized_text: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
    },
    language: { type: String },
    dialect: { type: String },
    translations: {
      type: [{ type: Schema.Types.ObjectId, ref: "word" }],
      default: [],
    },
    author: { type: Schema.Types.ObjectId, ref: "telegram_user", required: true },
    contributors: [{ type: Schema.Types.ObjectId, ref: "telegram_user" }],
    // Additional fields, if needed
  },
  {
    timestamps: true,
  }
);

const DeclinedWordModel = model<IDeclinedWordModel>("declined_word", DeclinedWordSchema);
export default DeclinedWordModel;
