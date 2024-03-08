// stores/themeStore.js
import { defineStore } from "pinia";

export const useThemeStore = defineStore("theme", {
  state: () => ({
    theme: "light", // По умолчанию тема светлая
  }),
  actions: {
    setTheme(newTheme: string) {
      this.theme = newTheme;
      localStorage.setItem("theme", newTheme); // Сохраняем тему в localStorage
      // Дополнительно, здесь можно добавить код для сохранения выбора темы в localStorage или cookies,
      // чтобы сохранять выбор пользователя между сессиями.
    },
  },
  getters: {
    isLightTheme: (state) => state.theme === "light",
  },
});
