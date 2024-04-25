// stores/sentencesStore.ts
import { defineStore } from "pinia";
import type { ApiError } from "@/types/error";
const apiUrl = `http://localhost:5555/backendapi`
export const useUserStore = defineStore("user", {
  state: () => ({
    user: {} as {
      isLoading: boolean,
      firstName?: string,
      lastName?: string,
      _id?: string;
    },

    wallet: {} as {
      walletAddress: string;
      walletBalance: number;
    },

    isLoading: true,
    isLoadingWalletData: true,

    isError: false,
    isErrorLoadingWalletData: false,

    error: null as ApiError | null,
    errorLoadingWalletData: null as any,
  }),
  actions: {
    async fetchUser() {
      this.isLoading = true;
      try {
        const response = await fetch(`${apiUrl}/users/getMe`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${useCookie("token").value}`,
            "Content-Type": "application/json",
          },
        });

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
    async fetchWalletData () {
      this.isLoadingWalletData = true;
      try {
        if (!this.user._id) {
          await this.fetchUser();
        }
        const response = await fetch(`${apiUrl}/finance/${this.user._id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${useCookie("token").value}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json()
        console.log(data)
        if (!response.ok) {

        } else {
          this.wallet = data.walletData
        }

      } catch (error) {
        if (error instanceof Error) {
          this.errorLoadingWalletData.message = error.message
          this.isErrorLoadingWalletData = true
        }
      } finally {
        this.isLoadingWalletData = false
      }
    }
    // Дополнительные actions для удаления, добавления, принятия предложений...
  },
});
