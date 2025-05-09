// stores/user.ts
import { defineStore } from "pinia";
import type { participationJoinResponse } from "~/server/api/participation/join.post";
import type { LeaderboardParticipation } from "~/server/api/participation/leaderboard/index.post";
import type {
  BackendLeaderboardResponse as GetLeaderboardResponse,
} from "~/server/api/participation/leaderboard/index.post";
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

    leaderboard: null as LeaderboardParticipation[] | null,
    userRank: null as number | null,

    joining: false as boolean,
    joined: false as boolean,

    joinResponse: null as string | null,
    userSuccessJoined: null as boolean | null,

    isLeaderboardFetch: false,

    checkParicipationResponse: null as any, // TODO: Типизировать ответ проверки участия
  }),

  // Геттеры
  getters: {
    isFetching: (state) => state.on_fetching_user_result,
    getUser: (state) => state.user,
    getResponseCheckParicipation: (state) => state.checkParicipationResponse,
    getLeaderboard: (state) => state.leaderboard,
    getUserRank: (state) => state.userRank,
    fetchMessage: (state) => state.fetch_user_result,
    getPhotoUrl: (state) => state.photo_url,
    hasError: (state) => !!state.error,

    isFetchingLeaderboard: (state) => state.isLeaderboardFetch,
    isFetchingLeaderboardError: (state) => state.errorFetchLeaderborad,
    getLeaderboardError: (state) => state.errorFetchLeaderborad, // Геттер для ошибки лидерборда
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
          `/api/telegram/users/exists/${telegramId}`,
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
            await $fetch(`/api/telegram/user/photo/${telegramId}`, {
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
          `/api/telegram/users`,
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

    /**
     * Загрузка лидерборда для указанной акции.
     * @param promotionId ID акции.
     * @param telegramId ID пользователя Telegram (опционально, для попытки загрузить пользователя, если его нет).
     */
    async fetchLeaderboard(promotionId: string, telegramId?: number) {
      this.isLeaderboardFetch = true;
      this.errorFetchLeaderborad = null; // Сброс предыдущей ошибки
      this.leaderboard = null; // Сброс данных перед загрузкой
      this.userRank = null;

      try {
        // 1. Убедиться, что пользователь загружен
        if (!this.user && telegramId) {
          console.log(
            "User not found in store, attempting to fetch using telegramId:",
            telegramId
          );
          await this.checkUserExists(telegramId);
          // checkUserExists обновит this.user, если найдет
        }

        // 2. Проверить еще раз, есть ли пользователь (он нужен для currentUserId)
        if (!this.user || !this.user._id) {
          console.error(
            "Cannot fetch leaderboard: User data or user._id is missing."
          );
          this.errorFetchLeaderborad = "User data unavailable"; // Установить ошибку
          this.isLeaderboardFetch = false;
          return; // Выход, если пользователя нет
        }

        console.log(
          `Fetching leaderboard for promotion: ${promotionId}, user: ${this.user._id}`
        );

        // 3. Сделать POST запрос к API эндпоинту Nuxt
        const response = await $fetch<GetLeaderboardResponse>( // Используем импортированный тип
          `/api/participation/leaderboard`,
          {
            method: "POST", // Указываем метод POST
            body: {
              promotionId: promotionId, // Передаем ID акции
              currentUserId: this.user._id, // Передаем ID текущего пользователя из стора
            },
            // Заголовок Authorization должен автоматически добавляться $fetch,
            // если у вас настроен плагин или middleware для аутентификации в Nuxt.
            // Если нет, его нужно добавить здесь вручную, получив токен.
          }
        );

        console.log("Leaderboard response received:", response);

        // 4. Обработать успешный ответ
        // Фильтрация записей с null user все еще полезна на случай проблем с populate на бэкенде
        this.leaderboard = response.leaderboard.filter(
          (
            item: any
          ): item is LeaderboardParticipation & {
            user: NonNullable<LeaderboardParticipation["user"]>;
          } => item.user !== null
        );
        this.userRank = response.userRank;
        // this.errorFetchLeaderborad = null; // Уже сбросили в начале
      } catch (error: any) {
        console.error("Error fetching leaderboard:", error);

        // 5. Обработать ошибку
        let errorMessage: string | number = "Failed to fetch leaderboard";
        if (error.response) {
          // Ошибка от $fetch (FetchError)
          errorMessage =
            error.response._data?.message ||
            error.response.statusText ||
            `HTTP ${error.response.status}`;
          this.errorFetchLeaderborad = error.response.status || "error"; // Сохраняем статус код или общую ошибку
          console.error(`API Error ${error.response.status}: ${errorMessage}`);
        } else {
          // Другая ошибка (сеть, JS и т.д.)
          errorMessage = error.message || "Unknown error";
          this.errorFetchLeaderborad = "network_or_unknown"; // Общий код ошибки
        }
        // Можно сохранить и саму errorMessage в отдельное состояние, если нужно показывать пользователю
        this.leaderboard = []; // Установить пустой массив при ошибке
      } finally {
        // 6. Завершение загрузки в любом случае
        this.isLeaderboardFetch = false;
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
        return "success";
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
