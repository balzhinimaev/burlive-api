<template>
  <div ref="appContainer" :class="['app-container', themeClass]">
    <div class="page-wrapper">
      <!-- Display user information -->
      <NuxtPage class="single-page" />
    </div>

    <!-- <BottomNav /> -->

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
const user = ref();
// Подключение хранилищ
const themeStore = useThemeStore();
const userStore = useUserStore();
const notifyStore = useNotifyStore();
const viewThemeParam = ref();
// Реактивные переменные
const notifications = computed(() => notifyStore.notifications);
const appContainer = ref<HTMLElement | null>(null);

// Вычисляемый класс для темы
const themeClass = computed(() => themeStore.isDarkMode ? 'dark-mode' : 'light-mode');

// Функция для обновления атрибута темы на body
const updateBodyTheme = async () => {
  await waitForTelegramWebApp();
  if (window.Telegram) {
    const colorScheme = window.Telegram.WebApp.colorScheme;
    document.body.setAttribute('data-theme', colorScheme);
  }
};

// Wait for the Telegram Web App to be initialized
const waitForTelegramWebApp = () => {
  return new Promise<void>((resolve) => {
    if (window.Telegram?.WebApp) {
      resolve();
    } else {
      const interval = setInterval(() => {
        if (window.Telegram?.WebApp) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    }
  });
};
// Инициализация пользователя и установка начальной темы
onMounted(async () => {
  await waitForTelegramWebApp();
  if (window.Telegram?.WebApp) {
    
    console.log('Telegram Web App initialized:', window.Telegram.WebApp);
    console.log('Init data unsafe:', window.Telegram.WebApp.initDataUnsafe);
    if (window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
      user.value = window.Telegram.WebApp.initDataUnsafe.user;
    }

    const themeParams = window.Telegram.WebApp.themeParams;

    viewThemeParam.value = themeParams
    await updateBodyTheme(); // Присваиваем тему после загрузки
    if (user.value) {
      const telegram_id = user.value.id;
      await userStore.checkUserExists(telegram_id);

    } else {
      console.warn('No user data available from Telegram Web App.');
    }

    // Получаем значение цвета из CSS-переменной
    const rootStyles = getComputedStyle(document.documentElement);
    let backgroundColor = rootStyles.getPropertyValue('--background-color').trim();

    // Устанавливаем цвет шапки
    window.Telegram.WebApp.setHeaderColor(backgroundColor);

    // Устанавливаем цвет фона
    window.Telegram.WebApp.setBackgroundColor(backgroundColor);
    window.Telegram.WebApp.setBottomBarColor(backgroundColor);

  } else {
    console.error('Telegram Web App is not available.');
  }

  updateBodyTheme(); // Присваиваем тему после загрузки
});

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
  // margin: 16px 16px 0 16px;
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
  // padding: 16px;
  height: 100%;
}

.app-notify {
  position: fixed;
  bottom: 70px;
  left: 10px;
  width: calc(100% - 20px);
}
</style>
