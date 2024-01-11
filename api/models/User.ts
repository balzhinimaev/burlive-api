import { Document, Schema, Types, model } from 'mongoose';

interface IUser extends Document {
  username?: string;
  password: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  birthdate?: Date;
  avatar?: string;
  phoneNumber?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  role?: string;
  isActive?: boolean;
  gender?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    // и так далее...
  };
  telegramUsername?: string;
  telegramChatId?: number;

  suggestedTranslations?: Types.ObjectId[];
  reports?: Types.ObjectId[];
  referrals?: Types.ObjectId[];
  translations?: Types.ObjectId[];
  votes?: Types.ObjectId[];

  lastActivity?: Date;
  activeSockets?: string[]; // Идентификаторы активных сокетов

  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema({
  username: { type: String, unique: true },
  password: { type: String, required: true },
  firstName: { type: String },
  lastName: { type: String },
  email: { type: String, unique: true },
  birthdate: { type: Date },
  avatar: { type: String },
  phoneNumber: { type: String },
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String },
    country: { type: String },
  },
  role: { type: String, default: 'user' },

  isActive: { type: Boolean, default: false },
  lastActivity: { type: Date },
  activeSockets: [{ type: String }], // Идентификаторы активных сокетов

  gender: { type: String, enum: ['male', 'female', 'other'] },
  socialLinks: {
    facebook: { type: String },
    twitter: { type: String },
    instagram: { type: String },
    // и так далее...
  },
  telegramUsername: { type: String },
  telegramChatId: { type: Number },
  
  suggestedTranslations: [{ type: Schema.Types.ObjectId, ref: 'Translation' }],
  reports: [{ type: Schema.Types.ObjectId, ref: 'Report' }],
  referrals: [{ type: Schema.Types.ObjectId, ref: 'Referral' }],
  translations: [{ type: Schema.Types.ObjectId, ref: 'UserTranslation' }],
  votes: [{ type: Schema.Types.ObjectId, ref: 'Vote' }],
}, {
    timestamps: true
});

const User = model<IUser>('User', UserSchema);

export default User;
