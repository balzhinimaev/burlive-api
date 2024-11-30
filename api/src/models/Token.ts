import { Document, Schema, model, Types } from 'mongoose';

interface JwtToken extends Document {
    userId: string;
    token: string;
    createdAt: Date;
    expiresAt: Date;
}

const jwtTokenSchema = new Schema({
    userId: { type: Types.ObjectId, required: true, ref: 'User' },
    token: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: { expires: '1h' } }, // TTL индекс, удалит документ через 1 час после expiresAt
});

// Обратите внимание, что TTL индекс удаляет документ через указанное время после значения поля.
// Для «вечных» токенов мы установили expiresAt на 100 лет, что эффективно предотвращает удаление.

const JwtTokenModel = model<JwtToken>('JwtToken', jwtTokenSchema);

export default JwtTokenModel;
