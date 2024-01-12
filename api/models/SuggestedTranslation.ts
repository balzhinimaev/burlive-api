// suggestedTranslationModel.ts
import { Document, Schema, Types, model } from 'mongoose';

interface ISuggestedTranslation extends Document {
  originalText: Types.ObjectId; // Ссылка на документ с оригинальным предложением
  suggestedText: string;
  author: Types.ObjectId; // Ссылка на пользователя, предложившего перевод
  createdAt: Date;
  // Дополнительные поля, если необходимо
}

const SuggestedTranslationSchema = new Schema({
  originalText: { type: Schema.Types.ObjectId, ref: 'OriginalSuggestion', required: true },
  suggestedText: { type: String, required: true },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  // Дополнительные поля, если необходимо
});

const SuggestedTranslation = model<ISuggestedTranslation>('SuggestedTranslation', SuggestedTranslationSchema);

export default SuggestedTranslation;
