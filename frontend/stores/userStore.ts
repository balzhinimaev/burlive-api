// stores/user.ts
import { defineStore } from "pinia";
import type { participationJoinResponse } from "~/server/api/participation/join.post";
import type {
  getLeaderboardResponse,
  leaderboardItem,
  leaderboardUser,
} from "~/server/api/participation/leaderboard.post";

// Определение интерфейсов
export interface User {
  id: number;
  _id: string;
  username?: string;
  email?: string;
  c_username?: string;
  theme: "light" | "dark";
  first_name?: string;
  rating: number;
  createdAt?: string;
  photo_url?: string;
  level: any;
  role: string;
  subscription: {
    type: "monthly" | "quarterly" | "annual" | null;
    startDate: Date | null;
    endDate: Date | null;
    isActive: boolean;
    paymentId: string;
  };
  dailyRating: number;
}

interface UserExistsResponse {
  is_exists: boolean;
  user?: User;
  message: string;
}

interface CreateUserResponse {
  message: string;
  user: User;
}

export const useUserStore = defineStore({
  id: "user",

  // Состояние хранилища
  state: () => ({
    userData: null,
    user: null as User | null,
    fetch_user_result: "" as string,
    on_fetching_user_result: true as boolean,
    photo_url: null as string | null,
    error: null as string | null, // Состояние ошибки
    errorFetchLeaderborad: null as string | null | number, // Состояние ошибки подтягивания лидерборда

    leaderboard: null as leaderboardItem[] | null,
    userRank: null as number | null,

    joining: false as boolean,
    joined: false as boolean,

    joinResponse: null as string | null,
    userSuccessJoined: null as boolean | null,

    isLeaderboardFetch: true,

    checkParicipationResponse: null as any,
  }),

  // Геттеры
  getters: {
    isFetching: (state) => state.on_fetching_user_result,
    getUser: (state) => state.user,
    getResponseCheckParicipation: (state) => state.checkParicipationResponse,
    getLeaderboard: (state) => state.leaderboard,
    fetchMessage: (state) => state.fetch_user_result,
    getPhotoUrl: (state) => state.photo_url,
    hasError: (state) => !!state.error,

    isFetchingLeaderboard: (state) => state.isLeaderboardFetch,
    isFetchingLeaderboardError: (state) => state.errorFetchLeaderborad,
  },

  // Действия
  actions: {
    /**
     * Проверка существования пользователя
     * @param telegramId ID пользователя в Telegram
     * @returns {Promise<boolean>}
     */
    async checkUserExists(
      telegramId: number,
      photo_url?: string
    ): Promise<boolean> {
      this.on_fetching_user_result = true;
      this.error = null;

      try {
        const response = await $fetch<UserExistsResponse>(
          `/api/telegram/user/is-exists/${telegramId}`,
          {
            // Заголовки уже проксируются сервером Nuxt, дополнительная авторизация не нужна
          }
        );

        if (response.is_exists && response.user) {
          this.user = response.user; // Сохраняем данные пользователя в хранилище
          this.fetch_user_result = response.message;
          this.on_fetching_user_result = false;

          if (
            (response.user.photo_url &&
              response.user.photo_url !== photo_url) ||
            response.user.photo_url === ""
          ) {
            await $fetch(`/api/telegram/user/update-photo/${telegramId}`, {
              method: "POST",
              body: {
                id: response.user.id,
                photo_url,
              },
            });
          }

          this.user.photo_url = photo_url;

          return true;
        } else {
          this.on_fetching_user_result = false;
          return false;
        }
      } catch (error: any) {
        this.on_fetching_user_result = false;
        this.error =
          "Ошибка при проверке существования пользователя: " +
          (error.message || "Unknown error");
        console.error(this.error);
        return false;
      }
    },

    /**
     * Создание пользователя на сервере
     * @param telegramUser Данные пользователя из Telegram
     */
    async createUser(telegramUser: {
      id: number;
      first_name: string;
      platform: string;
      username?: string;
      photo_url?: string;
      email?: string;
    }) {
      this.error = null;

      try {
        const response = await $fetch<CreateUserResponse>(
          `/api/telegram/create-user`,
          {
            method: "POST",
            body: telegramUser,
            // Заголовки уже проксируются сервером Nuxt, дополнительная авторизация не нужна
          }
        );

        this.user = response.user;
        this.fetch_user_result = response.message;
      } catch (error: any) {
        this.error =
          "Ошибка при создании пользователя: " +
          (error.message || "Unknown error");
        console.error(this.error);
      }
    },

    async fetchLeaderboard(promotionId: string, telegramId?: number) {
      this.isLeaderboardFetch = true;
      try {

        if (!this.user && telegramId) {
          await this.checkUserExists(telegramId)
          if (!this.user) {
            return 
          }
        }

        if (!this.user) {
          return
        }

        const response = await $fetch<getLeaderboardResponse>(
          `/api/participation/leaderboard`,
          {
            method: "POST",
            body: {
              promotionId,
              currentUserId: this.user._id,
            },
          }
        );

        // Filter out entries with null user
        this.leaderboard = response.leaderboard.filter(
          (item) => item.user !== null
        );
        this.userRank = response.userRank;
        this.errorFetchLeaderborad = null;
        this.isLeaderboardFetch = false;
      } catch (error: any) {
        if (error.statusCode === 404) {
          this.errorFetchLeaderborad = error.statusCode;
        } else {
          this.errorFetchLeaderborad = error.statusCode || "unknown";
        }
        this.leaderboard = []; // Set to empty array on error
        this.isLeaderboardFetch = false;
      } finally {
        this.isLeaderboardFetch = false; // Always set to false when done
      }
    },

    async joinToLeaderboard(promotionId: string) {
      this.joining = true;
      this.joined = false;
      try {
        const response = await $fetch<participationJoinResponse>(
          `/api/participation/join`,
          {
            method: "POST",
            body: {
              promotionId,
              userId: this.user?._id,
            },
          }
        );
        if (!response) {
          throw new Error(`Некорректный формат ответа от API`);
        }
        this.joinResponse = response.message;
        if (response.participation) {
          this.userSuccessJoined = true;
        }
        return "success"
      } catch (error) {
        return false;
      } finally {
        this.joining = false;
      }
    },

    async checkParticipation(promotionId: string) {
      try {
        const response: any = await $fetch(
          `/api/participation/${promotionId}/user/${this.user?._id}`,
          {
            method: "GET",
          }
        );
        if (!response) {
          throw new Error(`Некорректный формат ответа от API`);
        }
        this.checkParicipationResponse = response;
      } catch (error: any) {
        const message = `Ошибка при проверке пользователя на существование в розыгрыше`;
        this.checkParicipationResponse = error.data.statusCode;
        return message;
      }
    },
  },
});
