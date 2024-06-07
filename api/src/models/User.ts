import { Document, Schema, Types, model } from "mongoose";

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

  suggestedSentences?: Types.ObjectId[];
  suggestedTranslations?: Types.ObjectId[];

  reports?: Types.ObjectId[];
  referrals?: Types.ObjectId[];
  translations?: Types.ObjectId[];
  votes?: Types.ObjectId[];

  rating: number;

  lastActivity?: Date;
  activeSockets?: string[]; // Идентификаторы активных сокетов

  createdAt: Date;
  updatedAt: Date;
  ton?: ITonWallet;
  
  isFake?: boolean;

  getPublicProfile(): IPublicUser;
  getWalletData(): {
    walletAddress: string;
    walletBalance: number;
  };
}

interface ITonWallet {
  walletAddress: string;
  walletBalance: number;
}

interface IPublicUser {
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatar?: string;
  rating: number;
  ton?: ITonWallet;
  isFake: boolean;
  // Другие публичные поля, которые вы хотите включить
}

const UserSchema = new Schema(
  {
    username: { type: String, unique: true },
    password: { type: String, required: true },
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String, unique: true },
    birthdate: { type: Date },
    avatar: { type: String },
    phoneNumber: { type: String },
    rating: { type: Number, default: 100 },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zipCode: { type: String },
      country: { type: String },
    },
    role: { type: String, default: "user" },

    isActive: { type: Boolean, default: false },
    lastActivity: { type: Date },
    activeSockets: [{ type: String }], // Идентификаторы активных сокетов

    gender: { type: String, enum: ["male", "female", "other"] },
    socialLinks: {
      facebook: { type: String },
      twitter: { type: String },
      instagram: { type: String },
      // и так далее...
    },
    telegramUsername: { type: String },
    telegramChatId: { type: Number },
    suggestedSentences: [{ type: Schema.Types.ObjectId, ref: "Sentence" }],
    suggestedTranslations: [
      { type: Schema.Types.ObjectId, ref: "Translation" },
    ],
    reports: [{ type: Schema.Types.ObjectId, ref: "Report" }],
    referrals: [{ type: Schema.Types.ObjectId, ref: "Referral" }],
    translations: [{ type: Schema.Types.ObjectId, ref: "UserTranslation" }],
    votes: [{ type: Schema.Types.ObjectId, ref: "Vote" }],
    ton: {
      walletAddress: { type: String },
      walletBalance: { type: Number },
    },
    isFake: { type: Boolean }
  },
  {
    timestamps: true,
  }
);

// Добавляем метод getPublicProfile
UserSchema.methods.getPublicProfile = function (): IPublicUser {
  const publicUser: IPublicUser = {
    username: this.username,
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    avatar: this.avatar,
    rating: this.rating,
    ton: this.ton,
    isFake: this.isFake
    // Другие публичные поля
  };
  return publicUser;
};

// Добавляем метод для работы с кошельком
UserSchema.methods.getWalletData = function (): {
  walletAddress: string;
  walletBalance: number;
} {
  const publicUserWalletData = {
    walletAddress: this.ton?.walletAddress || "",
    walletBalance: this.ton?.walletBalance || 0,
  };
  return publicUserWalletData;
};

const User = model<IUser>("User", UserSchema);

export default User;
