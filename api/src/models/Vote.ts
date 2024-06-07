import { Document, Schema, model, Types } from 'mongoose';

interface IVote extends Document {
  userId: Types.ObjectId;
  translationId: Types.ObjectId;
  isUpvote: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VoteSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  translationId: { type: Schema.Types.ObjectId, required: true, ref: 'Translation' },
  isUpvote: { type: Boolean, required: true },
}, {
    timestamps: true
});

const Vote = model<IVote>('Vote', VoteSchema);

export default Vote;
