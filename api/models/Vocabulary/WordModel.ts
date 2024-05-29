// wordModel.ts
import { Document, Schema, Types, model } from "mongoose";

export interface IWordModel extends Document {
  text: string;
  language: string;
  author: Types.ObjectId;
  contributors: Types.ObjectId[];
  translations: Types.ObjectId[];
  createdAt: Date;
  // Additional fields, if needed
}

const WordSchema = new Schema({
  text: { type: String, required: true, unique: true },
  language: { type: String },
  translations: { type: [{ type: Schema.Types.ObjectId, ref: "Translation" }], default: [] },
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  contributors: [{ type: Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
  // Additional fields, if needed
});

const WordModel = model<IWordModel>("Word", WordSchema);
export default WordModel;
