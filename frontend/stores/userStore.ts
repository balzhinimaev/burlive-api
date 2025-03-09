// stores/user.ts
import { defineStore } from 'pinia';

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
    on_fetching_user_result: false as boolean,
    photo_url: null as string | null,
    error: null as string | null, // Состояние ошибки
    leaderboard: null as User[] | null,
    isLeaderboardFetch: true,
  }),

  // Геттеры
  getters: {
    isFetching: (state) => state.on_fetching_user_result,
    getUser: (state) => state.user,
    getLeaderboard: (state) => state.leaderboard,
    fetchMessage: (state) => state.fetch_user_result,
    getPhotoUrl: (state) => state.photo_url,
    hasError: (state) => !!state.error,
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

    async fetchLeaderboard() {
      this.isLeaderboardFetch = true;
      try {
        const response = await $fetch<User[]>(`/api/telegram/leaderboard`);
        if (!response) {
          throw new Error(`Некорректный формат ответа от API`);
        }
        this.leaderboard = response;
      } catch (error) {
        return false;
      } finally {
        this.isLeaderboardFetch = false;
      }
    },
  },
});
