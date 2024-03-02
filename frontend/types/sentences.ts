// types/sentences.ts
export interface Sentence {
  _id: string;
  text: string;
  language: string;
  author: {
    _id: string;
    firstName: string;
    username: string;
    email: string;
  }; // Пример, адаптируйте под вашу структуру
  context: string;
  checkStatus: boolean;
  // Дополнительные поля...
}

export interface SentencesState {
  sentences: Sentence[];
  isLoading: boolean;
  error: Error | null;
}

export interface SentencesResponse {
  message: string;
  count: number;
  sentences: Sentence[];
  total_count: number;
}