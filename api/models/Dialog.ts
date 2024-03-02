import { Document, Schema, Types, model } from 'mongoose';

interface IMessage extends Document {
  role: string;
  content: string;
}

interface IDialog extends Document {
    messages: IMessage[]
}

const messageSchema = new Schema<IMessage>({
    role: { type: String, required: true },
    content: { type: String, required: true },
}, {
    _id: false
});

const dialogSchema = new Schema<IDialog>({
    messages: [messageSchema],
});

const DialogModel = model<IDialog>('Dialog', dialogSchema);

export { DialogModel, IMessage, IDialog };