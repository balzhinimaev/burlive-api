import { Document, Schema, model } from 'mongoose';

interface ITranslation extends Document {
  text: string;
  language: string;
  createdAt: Date;
  updatedAt: Date;
}

const TranslationSchema = new Schema({
  text: { type: String, required: true },
  language: { type: String, required: true },
}, {
    timestamps: true
});

const Translation = model<ITranslation>('Translation', TranslationSchema);

export default Translation;
