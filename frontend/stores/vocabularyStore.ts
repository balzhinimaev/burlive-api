// stores/vocabularyStore.ts
import { defineStore } from "pinia";
import type { Sentence, SentencesResponse } from "@/types/sentences";
import type { ApiError } from "@/types/error";
import type {
  IFetchWordsOnAppovalResponse,
  ISuggestedWordModel,
  IWordModel,
} from "~/types/IVocabulary";
const apiUrl = `http://localhost:5555/backendapi`;
export const useVocabularyStore = defineStore("vocabulary-store", {
  state: () => ({
    acceptedWords: [] as IWordModel[],
    fetchWordsOnApprovalResult: [] as ISuggestedWordModel[],

    currentPage: 1,
    pageSize: 10,
    totalItems: 0,

    selectedLanguage: "ru",
    words: "" as string,

    isPageLoading: false,

    declineSentenceResponse: {
      message: "",
    },

    isLoading: false,
    isLoadingAddWord: false,
    isLoadingAcceptWord: false,
    isLoadingDeclineWord: false,
    isSavingWords: false,

    isError: false,
    isErrorAcceptWord: false,
    isErrorDeclineWord: false,
    isErrorAddWord: false,
    isErrorSavingWords: false,

    error: null as ApiError | null,
    errorAcceptWord: null as ApiError | null,
    errorDeclineWord: null as ApiError | null,
    errorAddWord: null as ApiError | null,
    errorSavingWords: null as ApiError | null,

    addWord: "",
    addWordLanuage: "ru",
  }),
  actions: {
    // Подтягиваем предложенные слова
    async fetchWordsOnApproval(page = 1) {
      this.currentPage = page;
      this.isPageLoading = true;

      this.isLoading = true;

      try {
        const response = await fetch(
          `${apiUrl}/vocabulary/get-words-on-approval/?page=${this.currentPage}&limit=${this.pageSize}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${useCookie("token").value}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data: IFetchWordsOnAppovalResponse = await response.json();

        if (!response.ok) {
          const error = new Error();
          error.message = data.message;
          error.name = "Ошибка";
          throw error;
        } else {
          if (!data.words) {
            return false;
          } else {
            this.fetchWordsOnApprovalResult = data.words.map((word) => ({
              ...word,
              checkStatus: false,
            }));

            this.totalItems = data.total_count;
          }
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

    async saveWords() {
      this.isSavingWords = true;
      const notifyStore = useNotifyStore(); // Используем хранилище уведомлений

      try {
        const response = await fetch(`${apiUrl}/vocabulary/suggest-word`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${useCookie("token").value}`,
          },
          body: JSON.stringify({
            text: this.words,
            language: this.selectedLanguage,
          }),
        });

        const data = await response.json();
        console.log("Данные получены!");
        if (!response.ok) {
          const error = new Error(
            data.message || "Произошла ошибка при добавлении предложений"
          );
          error.name = "Ошибка";

          throw error;
        } else {
          console.log("нет ошшибки");
          data.forEach((word: any) => {
            word.checkStatus = false;
            this.fetchWordsOnApprovalResult.push(word.newSuggestedWord);
          });
          notifyStore.addNotification({
            heading: "Успех",
            message: "Новые слова успешно добавлены!",
            status: "success",
          });
        }

        this.words = ""; // Очищаем текст после успешной отправки
      } catch (error) {
        console.log("ошибка загрузки");
        if (error instanceof Error) {
          this.errorSavingWords = error;
          this.isErrorSavingWords = true;
          notifyStore.addNotification({
            heading: "Ошибка",
            message: error.message,
            status: "error",
          });
        } else {
          this.errorSavingWords = { message: "Неизвестная ошибка" };
          notifyStore.addNotification({
            heading: "Ошибка",
            message: "Неизвестная ошибка",
            status: "error",
          });
        }
      } finally {
        this.isSavingWords = true;
      }
    },

    // Чекбокс переключалка
    toggleCheckStatus(elementId: string, checked: boolean) {
      console.log("handler");
      const element = this.fetchWordsOnApprovalResult.find(
        (s) => s._id === elementId
      );
      if (element) {
        element.checkStatus = checked;
        console.log(element);
      }
    },

    async acceptWord(suggestedWordId: string) {
      this.isLoadingAcceptWord = true;
      try {
        const response = await fetch(
          `${apiUrl}/vocabulary/accept-suggested-word`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${useCookie("token").value}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ suggestedWordId }),
          }
        );

        if (!response.ok) {
          throw new Error("Network response was not ok.");
        }

        const data = await response.json();

        // Логика обновления состояния после успешного принятия предложения
        this.fetchWordsOnApprovalResult =
          this.fetchWordsOnApprovalResult.filter(
            (element) => element._id !== suggestedWordId
          );
      } catch (error) {
        if (error instanceof Error) {
          this.errorAcceptWord = { message: error.message };
          this.isErrorAcceptWord = true;
        } else {
          this.errorAcceptWord = { message: "Неизвестная ошибка" };
        }
      } finally {
        this.isLoadingAcceptWord = false;
      }
    },

    async declineWord(suggestedWordId: string) {
      this.isLoadingDeclineWord = true;

      try {
        const response = await fetch(
          `${apiUrl}/vocabulary/decline-suggested-word`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${useCookie("token").value}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ suggestedWordId }),
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
          this.fetchWordsOnApprovalResult =
            this.fetchWordsOnApprovalResult.filter(
              (word) => word._id !== suggestedWordId
            );
          this.declineSentenceResponse.message = data.message;
        }
      } catch (error) {
        if (error instanceof Error) {
          this.errorDeclineWord = error;
          this.isErrorDeclineWord = true;
        } else {
          this.errorDeclineWord = { message: "Неизвестная ошибка" };
        }
      } finally {
        this.isLoadingDeclineWord = false;
      }
    },

    // async addWord() {
    //   this.isLoadingAddWord = true;
    //   const cleanedStrings = this.addWord
    //     .split(".")
    //     .map((s: any) => (s = { text: s }));

    //   try {
    //     const response = await fetch(
    //       `${apiUrl}/sentences/create-sentences-multiple`,
    //       {
    //         method: "POST",
    //         headers: {
    //           "Content-Type": "application/json",
    //           Authorization: `Bearer ${useCookie("token").value}`,
    //         },
    //         body: JSON.stringify({
    //           sentences: cleanedStrings,
    //           language: this.addSentencesLanguage,
    //         }),
    //       }
    //     );

    //     const data = await response.json();

    //     if (!response.ok) {
    //       const error = new Error();
    //       error.message = data.message;
    //       error.name = "Ошибка";

    //       throw error;
    //     } else {
    //       data.addedSentences.forEach((sentence: Sentence) => {
    //         sentence.checkStatus = false;
    //         this.acceptedSentences.push(sentence);
    //       });
    //     }

    //     this.addSentences = ""; // Очищаем текст после успешной отправки
    //   } catch (error) {
    //     console.log(error);
    //     if (error instanceof Error) {
    //       this.errorAddSentence = error;
    //       this.isErrorAddSentence = true;
    //     } else {
    //       this.errorAddSentence = { message: "Неизвестная ошибка" };
    //     }
    //   } finally {
    //     this.isLoadingAddWord = true;
    //   }
    // },
    async updateCurrentPage(page: number) {
      this.currentPage = page;
      // Здесь можно добавить логику для загрузки данных новой страницы
      await this.fetchWordsOnApproval(this.currentPage);
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
