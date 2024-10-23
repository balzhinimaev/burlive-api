<template>
  <div ref="appContainer" :class="['app-container', themeClass]">
    <div class="page-wrapper">
      <div>
        <!-- Место для информации о пользователе или контента -->
      </div>
      <NuxtPage class="single-page" />
    </div>

    <BottomNav />

    <!-- Уведомления -->
    <div class="app-notify" v-if="notifications.length > 0">
      <NotifyComponent v-for="notification in notifications" :key="notification.id" :heading="notification.heading"
        :message="notification.message" :status="notification.status" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted } from 'vue';
import { useThemeStore } from '@/stores/themeStore';
import { useUserStore } from '@/stores/userStore';
import { useNotifyStore } from '@/stores/notifyStore';

// Подключение хранилищ
const themeStore = useThemeStore();
const userStore = useUserStore();
const notifyStore = useNotifyStore();

// Реактивные переменные
const notifications = computed(() => notifyStore.notifications);
const appContainer = ref<HTMLElement | null>(null);

// Вычисляемый класс для темы
const themeClass = computed(() => themeStore.isDarkMode ? 'dark-mode' : 'light-mode');

// Функция для обновления атрибута темы на body
const updateBodyTheme = () => {
  const theme = themeStore.isDarkMode ? 'dark' : 'light';
  document.body.setAttribute('data-theme', theme);
};

// Инициализация пользователя и установка начальной темы
onMounted(async () => {
  const telegram_id = 1640959206;
  await userStore.checkUserExists(telegram_id);
  await themeStore.loadTheme();
  updateBodyTheme(); // Присваиваем тему после загрузки
});

// Следим за изменением темы и обновляем атрибут на body
watch(() => themeStore.theme, updateBodyTheme);

</script>

<style scoped lang="scss">
.app-container {
  overflow: hidden;
  display: flex;
  max-height: 100vh;
  flex-direction: column;
  transition: background-color 0.3s ease, color 0.3s ease;
  height: 100vh;
  margin: 0;
}

.page-wrapper {
  flex: 1;
  height: 100%;
  margin: 16px 16px 0 16px;
  border-radius: $border-radius;
  overflow: hidden;
  box-shadow: 0 0 2px 3px var(--shadow-color);
}

.page {
  background-color: var(--background-color);
  color: var(--text-color);
  transition: background-color 0.3s ease, color 0.3s ease;
  border-radius: 15px;
  flex: 1;
  padding: 16px;
  height: 100%;
}

.app-notify {
  position: fixed;
  bottom: 70px;
  left: 10px;
  width: calc(100% - 20px);
}
</style>
