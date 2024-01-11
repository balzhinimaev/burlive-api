import { Document, Schema, model, Types } from 'mongoose';

interface JwtToken extends Document {
    userId: string;
    token: string;
    createdAt: Date;
    expiresAt: Date;
}

const jwtTokenSchema = new Schema({
    userId: { type: Types.ObjectId, required: true, ref: 'User' }, // Замените 'User' на вашу модель пользователя
    token: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
});

const JwtTokenModel = model<JwtToken>('JwtToken', jwtTokenSchema);

export default JwtTokenModel;