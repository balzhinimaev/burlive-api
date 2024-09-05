import { Document, Schema, Types, model } from "mongoose";

export interface IWordModel extends Document {
  text: string;
  normalized_text: string; // Новый атрибут для нормализованного текста
  language: string;
  author: Types.ObjectId;
  contributors: Types.ObjectId[];
  translations: Types.ObjectId[];
  createdAt: Date;
  dialect: string;
  // Additional fields, if needed
}

const WordSchema = new Schema(
  {
    text: { type: String, required: true, unique: true },
    normalized_text: { type: String, required: true, lowercase: true }, // Новый атрибут
    language: { type: String },
    dialect: { type: String },
    translations: {
      type: [{ type: Schema.Types.ObjectId, ref: "word" }],
      default: [],
    },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    contributors: [{ type: Schema.Types.ObjectId, ref: "User" }],
    // Additional fields, if needed
  },
  {
    timestamps: true,
  }
);

const WordModel = model<IWordModel>("word", WordSchema);
export default WordModel;
