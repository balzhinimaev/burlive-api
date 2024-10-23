export const useThemeStore = defineStore({
  id: 'theme',

  state: () => ({
    theme: 'dark' as 'light' | 'dark',
    loading: false as boolean,
    error: null as string | null,
  }),

  getters: {
    isDarkMode: (state) => state.theme === 'dark',
    isLoading: (state) => state.loading,
    hasError: (state) => !!state.error,
  },

  actions: {
    // Загружаем текущую тему пользователя с сервера
    async loadTheme() {
      this.loading = true;
      this.error = null;

      const userStore = useUserStore();
      const userId = userStore.user?.id;

      if (!userId) {
        this.error = 'ID пользователя не найден';
        this.loading = false;
        return;
      }

      const config = useRuntimeConfig();
      const apiUrl = config.public.apiUrl; // Используем API URL из конфигурации
      const jwtToken = config.public.jwtToken; // Используем JWT токен из конфигурации

      try {
        const response = await fetch(`${apiUrl}/telegram/user/theme/${userId}`, {
          headers: {
            Authorization: jwtToken, // Токен для авторизации
          },
          method: 'GET',
        });

        if (response.ok) {
          const data = await response.json();
          this.theme = data.theme || 'light';
        } else {
          this.error = 'Ошибка получения темы';
        }
      } catch (error: any) {
        this.error = 'Ошибка загрузки темы: ' + error.message;
      } finally {
        this.loading = false;
      }
    },

    // Сохраняем тему пользователя
    async saveTheme(newTheme: 'light' | 'dark') {
      this.loading = true;
      this.error = null;

      const userStore = useUserStore();
      const userId = userStore.user?.id;

      if (!userId) {
        this.error = 'ID пользователя не найден';
        this.loading = false;
        return;
      }

      const config = useRuntimeConfig();
      const apiUrl = config.public.apiUrl;
      const jwtToken = config.public.jwtToken;

      try {
        await fetch(`${apiUrl}/telegram/user/theme`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: jwtToken,
          },
          body: JSON.stringify({ id: userId, theme: newTheme }),
        });

        this.theme = newTheme;
      } catch (error: any) {
        this.error = 'Ошибка сохранения темы: ' + error.message;
      } finally {
        this.loading = false;
      }
    },
  },
});
