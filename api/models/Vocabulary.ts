// suggestionModel.ts
import { Document, Schema, Types, model } from 'mongoose';

export interface IVocabulary extends Document {
  text: string;
  language: string;
  author: Types.ObjectId;
  contributors: Types.ObjectId[];
  translations: Types.ObjectId[];
  status: 'new' | 'processing' | 'accepted' | 'rejected'; // Added field for status
  createdAt: Date;
  // Additional fields, if needed
}

const VocabularySchema = new Schema({
  text: { type: String, required: true, unique: true },
  language: { type: String },
  translations: [{ type: Schema.Types.ObjectId, ref: 'Translation' }],
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  contributors: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['new', 'processing', 'accepted', 'rejected'], default: 'new' },
  createdAt: { type: Date, default: Date.now },
  // Additional fields, if needed
});

const Vocabulary = model<IVocabulary>('Vocabulary', VocabularySchema);
export default Vocabulary;
