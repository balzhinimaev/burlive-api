// suggestionModel.ts
import { Document, Schema, Types, model } from 'mongoose';

export interface ISuggestion extends Document {
  text: string;
  language: string;
  author: Types.ObjectId;
  contributors: Types.ObjectId[];
  status: 'new' | 'processing' | 'accepted' | 'rejected'; // Added field for status
  createdAt: Date;
  // Additional fields, if needed
}

const SuggestionSchema = new Schema({
  text: { type: String, required: true },
  language: { type: String },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  contributors: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['new', 'processing', 'accepted', 'rejected'], default: 'new' },
  createdAt: { type: Date, default: Date.now },
  // Additional fields, if needed
});

const Suggestion = model<ISuggestion>('Suggestion', SuggestionSchema);

export default Suggestion;
