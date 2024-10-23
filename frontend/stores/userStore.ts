import { defineStore } from 'pinia';
import { useRuntimeConfig } from '#app';

interface User {
  id: number;
  email?: string;
  c_username?: string;
  first_name?: string;
  rating?: number;
  createdAt?: string;
}

interface UserExistsResponse {
  is_exists: boolean;
  user?: User;
  message: string;
}

interface CreateUserResponse {
  message: string;
}

export const useUserStore = defineStore({
  id: 'user',

  // Состояние хранилища
  state: () => ({
    user: null as User | null,
    fetch_user_result: '' as string,
    on_fetching_user_result: false as boolean,
    error: null as string | null, // Состояние ошибки
  }),

  // Геттеры
  getters: {
    isFetching: (state) => state.on_fetching_user_result,
    getUser: (state) => state.user,
    fetchMessage: (state) => state.fetch_user_result,
    hasError: (state) => !!state.error,
  },

  // Действия
  actions: {
    // Проверка существования пользователя
    async checkUserExists(telegramId: number): Promise<boolean> {
      this.on_fetching_user_result = true;
      this.error = null;

      const config = useRuntimeConfig();
      const apiUrl = config.public.apiUrl; // Получаем API URL из конфигурации
      const jwtToken = config.public.jwtToken; // Получаем JWT токен из конфигурации

      try {
        const response = await $fetch<UserExistsResponse>(
          `${apiUrl}/telegram/user/is-exists/${telegramId}`,
          {
            headers: {
              Authorization: jwtToken,
            },
          }
        );
        if (response.is_exists && response.user) {
          this.user = response.user; // Сохраняем данные пользователя в хранилище
          this.fetch_user_result = response.message;
          this.on_fetching_user_result = false;
          return true;
        } else {
          this.on_fetching_user_result = false;
          return false;
        }
      } catch (error: any) {
        this.on_fetching_user_result = false;
        this.error = 'Ошибка при проверке существования пользователя: ' + error.message;
        console.error(this.error);
        return false;
      }
    },

    // Создание пользователя на сервере
    async createUser(telegramUser: { id: number; username: string; first_name: string; email: string }) {
      this.error = null;

      const config = useRuntimeConfig();
      const apiUrl = config.public.apiUrl; // Получаем API URL из конфигурации
      const jwtToken = config.public.jwtToken; // Получаем JWT токен из конфигурации

      try {
        const response = await $fetch<CreateUserResponse>(
          `${apiUrl}/telegram/create-user`,
          {
            method: 'POST',
            body: telegramUser,
            headers: {
              Authorization: jwtToken,
            },
          }
        );
        console.log(response.message); // Успешная регистрация
      } catch (error: any) {
        this.error = 'Ошибка при создании пользователя: ' + error.message;
        console.error(this.error);
      }
    },
  },
});
