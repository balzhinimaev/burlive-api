import { Document, Schema, Types, model } from 'mongoose';

export interface ITranslation extends Document {
  text: string;
  sentenceId: Types.ObjectId;
  language: string;
  createdAt: Date;
  updatedAt: Date;

  author: Types.ObjectId;
  contributors: Types.ObjectId[];

  votes: Types.ObjectId[];
  status: 'new' | 'processing' | 'accepted' | 'rejected'; // Added field for status
}

const TranslationSchema = new Schema({
  text: { type: String, required: true, unique: true },
  language: { type: String, required: true },
  sentenceId: { type: Schema.Types.ObjectId, required: true, ref: 'Sentence' },

  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  contributors: [{ type: Schema.Types.ObjectId, ref: 'User' }],

  votes: [{ type: Schema.Types.ObjectId, ref: 'Vote' }],
  status: { type: String, enum: ['new', 'processing', 'accepted', 'rejected'], default: 'new' },
}, {
    timestamps: true
});

const Translation = model<ITranslation>('Translation', TranslationSchema);

export default Translation;
