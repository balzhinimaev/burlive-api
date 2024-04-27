export interface IPublicUser {
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatar?: string;
  rating: number;
  ton?: ITonWallet;
  isFake: boolean
  // Другие публичные поля, которые вы хотите включить
}

interface ITonWallet {
  walletAddress: string;
  walletBalance: number;
}