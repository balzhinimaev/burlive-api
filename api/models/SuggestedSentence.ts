// suggestionModel.ts
import { Document, Schema, Types, model } from 'mongoose';

export interface ISuggestedSentence extends Document {
  text: string;
  language: string;
  author: Types.ObjectId;
  context: string;
  contributors: Types.ObjectId[];
  translations: Types.ObjectId[];
  watchers: Types.ObjectId[];
  status: "approved" | "rejected" | "pending" | "in_review";
  // Additional fields, if needed
}

const SuggestedSentenceSchema = new Schema(
  {
    text: { type: String, required: true, unique: true },
    language: { type: String },
    context: { type: String },
    translations: [{ type: Schema.Types.ObjectId, ref: "Translation" }],
    watchers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    contributors: [{ type: Schema.Types.ObjectId, ref: "User" }],
    status: {
      type: String,
      enum: ["approved", "rejected", "pending", "in_review"],
      default: "pending",
    },
    // Additional fields, if needed
  },
  {
    timestamps: true,
  }
);


const SuggestedSentence = model<ISuggestedSentence>('Suggested_sentences', SuggestedSentenceSchema);

export default SuggestedSentence;
