// stores/sentencesStore.ts
import { defineStore } from "pinia";
import type { ApiError } from "@/types/error";

export const useUserStore = defineStore("user", {
  state: () => ({
    user: {} as {
      isLoading: boolean,
      firstName?: string,
      lastName?: string
    },

    isLoading: false,

    isError: false,

    error: null as ApiError | null,
  }),
  actions: {
    async fetchUser() {
      this.isLoading = true;
      try {
        const response = await fetch(
          "http://localhost:5555/api/users/getMe",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${useCookie("token").value}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json()

        if (!response.ok) {
          //   throw new Error();
        } else {
            this.user = data.user
        }

      } catch (error) {
        if (error instanceof Error) {
          this.error = { message: error.message };
          this.isError = true;
        } else {
          this.error = { message: "Неизвестная ошибка" };
        }
      } finally {
        this.isLoading = false;
      }
    },
    // Дополнительные actions для удаления, добавления, принятия предложений...
  },
});
