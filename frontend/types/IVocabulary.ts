export interface IWordModel {
  _id: string;
  text: string;
  language: string;
  author: {
    _id: string;
    firstName: string;
    username: string;
    email: string;
  }; // Пример, адаптируйте под вашу структуру
  contributors: string[];
  translations: string[];
  createdAt: Date;
  checkStatus: boolean;
  // Additional fields, if needed
}

export interface ISuggestedWordModel {
  _id: string;
  text: string;
  language: string;
  author: {
    _id: string;
    firstName: string;
    username: string;
    email: string;
  }; // Пример, адаптируйте под вашу структуру
  contributors: string[];
  status: "new" | "processing" | "accepted" | "rejected"; // Added field for status
  dialect: string;
  createdAt: Date;
  pre_translations: string[];
  checkStatus: boolean;
  // Additional fields, if needed
}

export interface IFetchWordsOnAppovalResponse {
  message: string;
  words?: ISuggestedWordModel[];
  total_count: number;
}