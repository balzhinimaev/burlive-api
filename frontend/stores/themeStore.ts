// stores/themeStore.js
import { defineStore } from "pinia";

export const useThemeStore = defineStore("theme", {
  state: () => ({
    theme: "light", // По умолчанию тема светлая,
    navbarIsExpanded: false as boolean
  }),
  actions: {
    setTheme(newTheme: string) {
      this.theme = newTheme;
      localStorage.setItem("theme", newTheme); // Сохраняем тему в localStorage
      // Дополнительно, здесь можно добавить код для сохранения выбора темы в localStorage или cookies,
      // чтобы сохранять выбор пользователя между сессиями.
    },
    closeNavbar() {
      this.navbarIsExpanded = false;
    },
    openNavbar() {
      this.navbarIsExpanded = true;
    }
  },
  getters: {
    isLightTheme: (state) => state.theme === "light",
  },
});
