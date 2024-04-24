// stores/notifyStore.ts
import { defineStore } from "pinia";

export const useNotifyStore = defineStore("notify", {
  state: () => ({
    notifications: [] as {
      id: number;
      heading: string;
      message: string;
      status: "success" | "error";
    }[],
  }),
  actions: {
    addNotification(notification: {
      heading: string;
      message: string;
      status: "success" | "error";
    }) {
      const id = Date.now();
      this.notifications.push({ ...notification, id });
      setTimeout(() => this.removeNotification(id), 3000); // Удаляем уведомление через 3 секунды
    },
    removeNotification(id: number) {
      this.notifications = this.notifications.filter(
        (notif) => notif.id !== id
      );
    },
  },
});
