import { Document, Schema, Types, model } from 'mongoose';

interface IMessage extends Document {
  sender: Types.ObjectId;
  recipient: Types.ObjectId;
  content: string;
  timestamp: Date;
  isRead: boolean;
}

const MessageSchema = new Schema({
  sender: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  recipient: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false },
});

const Message = model<IMessage>('Message', MessageSchema);

export default Message;
