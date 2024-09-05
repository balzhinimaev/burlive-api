// wordModel.ts
import { Document, Schema, Types, model } from "mongoose";

export interface ISuggestedWordModel extends Document {
  text: string;
  normalized_text: string; // Новый атрибут для нормализованного текста
  language: string;
  author: Types.ObjectId;
  contributors: Types.ObjectId[];
  status: "new" | "processing" | "accepted" | "rejected"; // Added field for status
  dialect: string;
  createdAt: Date;
  pre_translations: Types.ObjectId[];
  // Additional fields, if needed
}

const SuggestedWordSchema = new Schema({
  text: { type: String, required: true },
  normalized_text: {
    type: String,
    required: true,
    lowercase: true,
    unique: true
  }, // Новый атрибут
  language: { type: String },
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  contributors: [{ type: Schema.Types.ObjectId, ref: "User" }],
  status: {
    type: String,
    enum: ["new", "processing", "accepted", "rejected"],
    default: "new",
  },
  dialect: { type: String },
  pre_translations: [{ type: Schema.Types.ObjectId, ref: "word" }],
  createdAt: { type: Date, default: Date.now },
  // Additional fields, if needed
});

const SuggestedWordModel = model<ISuggestedWordModel>(
  "suggested_word",
  SuggestedWordSchema
);
export default SuggestedWordModel;
