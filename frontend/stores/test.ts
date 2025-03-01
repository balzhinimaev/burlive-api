// stores/test.ts
import { defineStore } from "pinia";

export const useTestStore = defineStore("test", {
  state: () => ({
    // Храним ответы по идентификатору вопроса.
    // Для single‑choice – число (номер выбранного варианта),
    // для multiple‑choice – массив чисел (номера выбранных вариантов).
    answers: {} as Record<string, number | number[]>,
  }),
  actions: {
    setAnswer(questionId: string, answer: number | number[]) {
      this.answers[questionId] = answer;
    },
    getAnswer(questionId: string): number | number[] | undefined {
      return this.answers[questionId];
    },
  },
});
