// src/models/Vocabulary/WordModel.ts
import { Document, Schema, Types, model } from "mongoose";

export interface IWordModel extends Document {
  text: string;
  normalized_text: string;
  language: string;
  author: Types.ObjectId;
  contributors: Types.ObjectId[];
  translations: Types.ObjectId[];
  translations_u: Types.ObjectId[];
  createdAt: Date;
  dialect: string;
  // Additional fields, if needed
}

const WordSchema = new Schema<IWordModel>(
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
    translations_u: {
      type: [{ type: Schema.Types.ObjectId, ref: "suggested_word" }],
      default: [],
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "telegram_user",
      required: true,
    },
    contributors: [{ type: Schema.Types.ObjectId, ref: "telegram_user" }],
    // Additional fields, if needed
  },
  {
    timestamps: true,
  }
);

const WordModel = model<IWordModel>("word", WordSchema);
export default WordModel;
