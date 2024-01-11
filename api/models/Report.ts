import { Document, Schema, model, Types } from 'mongoose';

interface IReport extends Document {
  userId: Types.ObjectId;
  reportedUserId: Types.ObjectId;
  reason: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  reportedUserId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  reason: { type: String, required: true },
  description: { type: String },
}, {
    timestamps: true
});

const Report = model<IReport>('Report', ReportSchema);

export default Report;
