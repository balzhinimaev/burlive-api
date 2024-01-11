import { Document, Schema, model, Types } from 'mongoose';

interface IReferral extends Document {
  referringUserId: Types.ObjectId;
  referredUserId: Types.ObjectId;
  date: Date;
}

const ReferralSchema = new Schema({
  referringUserId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  referredUserId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  date: { type: Date, default: Date.now },
});

const Referral = model<IReferral>('Referral', ReferralSchema);

export default Referral;
