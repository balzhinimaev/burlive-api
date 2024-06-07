import { Document, Schema, model, Types } from 'mongoose';

interface IUserTranslation extends Document {
  userId: Types.ObjectId;
  translationId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserTranslationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  translationId: { type: Schema.Types.ObjectId, required: true, ref: 'Translation' },
}, {
    timestamps: true
});

const UserTranslation = model<IUserTranslation>('UserTranslation', UserTranslationSchema);

export default UserTranslation;
