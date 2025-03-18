<template>
  <div ref="appContainer" :class="['app-container', themeClass]">
    <div class="page-wrapper">
      <NuxtPage class="single-page" />
    </div>

    <!-- Уведомления -->
    <div class="app-notify" v-if="notifications.length > 0">
      <NotifyComponent v-for="notification in notifications" :key="notification.id" :heading="notification.heading"
        :message="notification.message" :status="notification.status" />
    </div>
  </div>
</template>

<script lang="ts" setup>
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
const user = ref();

// Вычисляемый класс для темы
const themeClass = computed(() => themeStore.isDarkMode ? 'dark-mode' : 'light-mode');

/**
 * Функция для проверки доступности localStorage
 */
function isLocalStorageAvailable() {
  try {
    const test = '__test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    console.error('localStorage недоступен:', e);
    return false;
  }
}

/**
 * Функция для сохранения пользовательских данных в localStorage
 */
function saveUserToLocalStorage(userData: any) {
  if (!isLocalStorageAvailable() || !userData) return;
  try {
    localStorage.setItem('userData', JSON.stringify(userData));
    console.log('Пользовательские данные сохранены в localStorage');
  } catch (error) {
    console.error('Ошибка при сохранении в localStorage:', error);
  }
}

/**
 * Функция для получения данных пользователя из localStorage
 */
function getUserFromLocalStorage() {
  if (!isLocalStorageAvailable()) return null;
  try {
    const storedUser = localStorage.getItem('userData');
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error('Ошибка при получении из localStorage:', error);
    return null;
  }
}

// Функция для обновления атрибута темы на body
const updateBodyTheme = async () => {
  await waitForTelegramWebApp();
  if (window.Telegram) {
    const colorScheme = window.Telegram.WebApp.colorScheme;
    document.body.setAttribute('data-theme', colorScheme);

    const rootStyles = getComputedStyle(document.body);
    let backgroundColor = rootStyles.getPropertyValue('--background-color').trim();
    window.Telegram.WebApp.themeParams.section_bg_color = backgroundColor;
    window.Telegram.WebApp.themeParams.bottom_bar_bg_color = backgroundColor;
    window.Telegram.WebApp.setHeaderColor(backgroundColor);
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
      }, 10);
    }
  });
};

// Обработчик события themeChanged
function handleThemeChanged() {
  if (window.Telegram?.WebApp) {
    const colorScheme = window.Telegram.WebApp.colorScheme || 'light';
    applyTheme(colorScheme);
  }
}

async function applyTheme(colorScheme: string) {
  await updateBodyTheme();
}

/**
 * Функция для проверки и установки данных пользователя
 */
async function checkAndSetUser(telegramUser: any) {
  if (!telegramUser || !telegramUser.id) {
    console.error('Нет данных пользователя для проверки');
    return false;
  }

  try {
    // Проверяем существование пользователя
    const exists = await userStore.checkUserExists(
      telegramUser.id,
      telegramUser.photo_url
    );

    // Если пользователя нет, создаем его
    if (!exists) {
      await userStore.createUser({
        id: telegramUser.id,
        first_name: telegramUser.first_name,
        username: telegramUser.username,
        photo_url: telegramUser.photo_url,
        platform: window.Telegram?.WebApp?.platform || 'web'
      });
      // После создания снова проверяем существование, чтобы получить данные
      await userStore.checkUserExists(telegramUser.id);
    }

    return true;
  } catch (error) {
    console.error('Ошибка при проверке/создании пользователя:', error);
    return false;
  }
}

// Инициализация пользователя и установка начальной темы
onMounted(async () => {
  await waitForTelegramWebApp();

  let telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user;

  if (telegramUser) {
    user.value = telegramUser;
  } else {
    const storedUser = getUserFromLocalStorage();
    if (storedUser) {
      user.value = storedUser;
    }
  }

  if (user.value) {
    await checkAndSetUser(user.value);
    saveUserToLocalStorage(user.value);
  }

  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.expand();
    window.Telegram.WebApp.disableVerticalSwipes();
    window.Telegram.WebApp.enableClosingConfirmation();
    await applyTheme(window.Telegram.WebApp.colorScheme);
    window.Telegram.WebApp.onEvent('themeChanged', handleThemeChanged);
  }

  updateBodyTheme();
});


// Следим за изменениями пользователя
watch(() => user.value, (newUser) => {
  if (newUser) {
    saveUserToLocalStorage(newUser);
  }
}, { deep: true });
</script>

<style scoped lang="scss">
.app-container {
  overflow: hidden;
  display: flex;
  max-height: 100vh;
  flex-direction: column;
  transition: background-color 0.3s ease, color 0.3s ease;
  height: 100vh;
  margin: 0 auto;
  // max-width: 576px;
}

.page-wrapper {
  flex: 1;
  height: 100%;
  overflow: hidden;
  box-shadow: 0 0 2px 3px var(--shadow-color);
}

.app-notify {
  position: fixed;
  bottom: 70px;
  left: 10px;
  width: calc(100% - 20px);
}
</style>