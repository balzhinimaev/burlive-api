// suggestionModel.ts
import { Document, Schema, Types, model } from 'mongoose';

export interface ISentence extends Document {
  text: string;
  language: string;
  author: Types.ObjectId;
  contributors: Types.ObjectId[];
  translations: Types.ObjectId[];
  watchers: Types.ObjectId[];
  // Additional fields, if needed
}

const SentenceSchema = new Schema({
  text: { type: String, required: true, unique: true },
  language: { type: String },
  translations: [{ type: Schema.Types.ObjectId, ref: 'Translation', default: [] }],
  watchers: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  contributors: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
  // Additional fields, if needed
}, {
  timestamps: true
});

const Sentence = model<ISentence>('Sentence', SentenceSchema);

export default Sentence;
