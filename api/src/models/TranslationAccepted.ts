import { Document, Schema, Types, model } from 'mongoose';

interface IText {
  language: string;
  dialect: string;
  content: string;
}

interface ITranslationAccepted extends Document {
  sentence: IText;
  translation: IText;

  author: Types.ObjectId; // Ссылка на пользователя, предложившего перевод
  votes: Types.ObjectId[];
  contributors: Types.ObjectId[];

  createdAt: Date;
  updatedAt: Date;
  // Дополнительные поля, если необходимо
}

const TranslationAcceptedSchema = new Schema({
  sentence: {
    language: { type: String, required: true },
    dialect: { type: String },
    content: { type: String, required: true },
  },
  translation: {
    language: { type: String, required: true },
    dialect: { type: String },
    content: { type: String, required: true },
  },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  votes: [{ type: Schema.Types.ObjectId, ref: 'Vote' }],
  contributors: [{ type: Schema.Types.ObjectId, ref: 'Contributor' }],
}, {
  timestamps: true
});

const AcceptedTranslation = model<ITranslationAccepted>('translations_accepted', TranslationAcceptedSchema);

export default AcceptedTranslation;
