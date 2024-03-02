// stores/sentencesStore.ts
import { defineStore } from "pinia";
import type { Sentence, SentencesResponse } from "@/types/sentences";
import type { ApiError } from "@/types/error";

export const useAcceptedSentencesStore = defineStore("accepted-sentences", {
  state: () => ({
    acceptedSentences: [] as Sentence[],

    currentPage: 1,
    pageSize: 10,
    totalItems: 0,

    isPageLoading: false,

    declineSentenceResponse: {
      message: "",
    },

    isLoading: false,
    isLoadingAcceptSentence: false,
    isLoadingAddSentence: false,
    isLoadingDeclineSentence: false,

    isError: false,
    isErrorAcceptSentence: false,
    isErrorAddSentence: false,
    isErrorDeclineSentence: false,

    error: null as ApiError | null,
    errorAcceptSentence: null as ApiError | null,
    errorAddSentence: null as ApiError | null,
    errorDeclineSentence: null as ApiError | null,

    addSentences: "",
    addSentencesLanguage: "ru",
  }),
  actions: {
    async fetchSentences(page = 1) {
      this.currentPage = page;
      this.isPageLoading = true;

      this.isLoading = true;
      try {
        const response = await fetch(
          `http://localhost:5555/api/sentences/?notAccepted=false&page=${this.currentPage}&limit=${this.pageSize}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${useCookie("token").value}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data: SentencesResponse = await response.json();

        if (!response.ok) {
          const error = new Error();
          error.message = data.message;
          error.name = "Ошибка";

          throw error;
        } else {
          this.acceptedSentences = data.sentences.map((sentence) => ({
            ...sentence,
            checkStatus: false,
          }));
          this.totalItems = data.total_count;
        }
      } catch (error) {
        if (error instanceof Error) {
          this.error = error;
          this.isError = true;
        } else {
          this.error = { message: "Неизвестная ошибка" };
        }
      } finally {
        this.isLoading = false;
      }
    },
    toggleSentenceCheckStatus(sentenceId: string, checked: boolean) {
      const sentence = this.acceptedSentences.find((s) => s._id === sentenceId);
      if (sentence) {
        sentence.checkStatus = checked;
      }
    },
    async acceptSentence(sentenceId: string) {
      this.isLoadingAcceptSentence = true;
      try {
        const response = await fetch(
          `http://localhost:5555/api/sentences/${sentenceId}/accept`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${useCookie("token").value}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Network response was not ok.");
        }
        const data = await response.json();
        // Логика обновления состояния после успешного принятия предложения
        this.acceptedSentences = this.acceptedSentences.filter(
          (sentence) => sentence._id !== sentenceId
        );
      } catch (error) {
        if (error instanceof Error) {
          this.errorAcceptSentence = { message: error.message };
          this.isErrorAcceptSentence = true;
        } else {
          this.errorAcceptSentence = { message: "Неизвестная ошибка" };
        }
      } finally {
        this.isLoadingAcceptSentence = false;
      }
    },
    async declineSentence(sentenceId: string) {
      this.isLoadingDeclineSentence = true;

      try {
        const response = await fetch(
          `http://localhost:5555/api/sentences/${sentenceId}/reject`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${useCookie("token").value}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          const error = new Error();
          error.message = data.message;
          error.name = "Ошибка";

          throw error;
        } else {
          // Логика обновления состояния после успешного отклонения предложения
          this.acceptedSentences = this.acceptedSentences.filter(
            (sentence) => sentence._id !== sentenceId
          );
          this.declineSentenceResponse.message = data.message;
        }
      } catch (error) {
        if (error instanceof Error) {
          this.errorDeclineSentence = error;
          this.isErrorDeclineSentence = true;
        } else {
          this.errorDeclineSentence = { message: "Неизвестная ошибка" };
        }
      } finally {
        this.isLoadingDeclineSentence = false;
      }
    },
    async addSentence() {
      this.isLoadingAddSentence = true;
      console.log(this.addSentences);
      const cleanedStrings = this.addSentences
        .split(".")
        .map((s: any) => (s = { text: s }));

      try {
        const response = await fetch(
          "http://localhost:5555/api/sentences/create-sentences-multiple",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${useCookie("token").value}`,
            },
            body: JSON.stringify({
              sentences: cleanedStrings,
              language: this.addSentencesLanguage,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          const error = new Error();
          error.message = data.message;
          error.name = "Ошибка";

          throw error;
        } else {
          data.addedSentences.forEach((sentence: Sentence) => {
            sentence.checkStatus = false;
            this.acceptedSentences.push(sentence);
          });
        }

        this.addSentences = ""; // Очищаем текст после успешной отправки
      } catch (error) {
        console.log(error);
        if (error instanceof Error) {
          this.errorAddSentence = error;
          this.isErrorAddSentence = true;
        } else {
          this.errorAddSentence = { message: "Неизвестная ошибка" };
        }
      } finally {
        this.isLoadingAddSentence = true;
      }
    },
    setSentenceText(text: string) {
      this.addSentences = text;
    },
    async updateCurrentPage(page: number) {
      this.currentPage = page;
      // Здесь можно добавить логику для загрузки данных новой страницы
      await this.fetchSentences(this.currentPage)
    },
    setTotalItems(total: number) {
      this.totalItems = total;
    },
    setPageSize(size: number) {
      this.pageSize = size;
    },
    // Дополнительные actions для удаления, добавления, принятия предложений...
  },
});
