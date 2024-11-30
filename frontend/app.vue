<template>
  <div ref="appContainer" :class="['app-container', themeClass]">
    <!-- <div class="container"> -->
      <!-- <p class="typography-body my-2">{ Здесь может быть ваша реклама }</p> -->
    <!-- </div> -->

    <div class="page-wrapper">
      <!-- <div style="color: var(--text-color); padding: 1rem;">
        <p>
          {{ backgroundColorValue }}
        </p>
      </div> -->

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
const newparams = ref();
// Реактивные переменные
const notifications = computed(() => notifyStore.notifications);
const appContainer = ref<HTMLElement | null>(null);

const backgroundColorValue = ref()

// Вычисляемый класс для темы
const themeClass = computed(() => themeStore.isDarkMode ? 'dark-mode' : 'light-mode');

// Функция для обновления атрибута темы на body
const updateBodyTheme = async () => {
  await waitForTelegramWebApp();
  if (window.Telegram) {
    const colorScheme = window.Telegram.WebApp.colorScheme;
    document.body.setAttribute('data-theme', colorScheme);
    
    const rootStyles = getComputedStyle(document.body);
    let backgroundColor = rootStyles.getPropertyValue('--background-color').trim();
    window.Telegram.WebApp.themeParams.section_bg_color = backgroundColor
    window.Telegram.WebApp.themeParams.bottom_bar_bg_color = backgroundColor
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
    const themeParams = window.Telegram.WebApp.themeParams;
    // console.log('Theme changed:', themeParams);
    // Предполагается, что colorScheme может быть 'light' или 'dark'
    const colorScheme = window.Telegram.WebApp.colorScheme || (themeParams && themeParams.theme) || 'light';
    newparams.value = colorScheme;
    applyTheme(colorScheme);
  }
}

async function applyTheme(colorScheme: string) {
  // document.documentElement.setAttribute('data-theme', colorScheme);
  await updateBodyTheme();
}

// Инициализация пользователя и установка начальной темы
onMounted(async () => {
  await waitForTelegramWebApp();
  if (window.Telegram?.WebApp) {
    // Устанавливаем начальную тему
    await applyTheme(window.Telegram.WebApp.colorScheme);
    window.Telegram.WebApp.expand();
    window.Telegram.WebApp.disableVerticalSwipes();
    console.log('Telegram Web App initialized:', window.Telegram.WebApp);
    console.log('Init data unsafe:', window.Telegram.WebApp.initDataUnsafe);
    
    // Подписываемся на изменение темы
    window.Telegram.WebApp.onEvent('themeChanged', handleThemeChanged);

    if (window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
      user.value = window.Telegram.WebApp.initDataUnsafe.user;
      // userStore.photo_url = user.value.photo_url
      const telegram_id = user.value.id;
      const is_exists = await userStore.checkUserExists(telegram_id);
      if (!is_exists) {
        await userStore.createUser({
          id: user.value.id,
          first_name: user.value.first_name,
          username: user.value?.username,
          photo_url: user.value?.photo_url,
          platform: window.Telegram.WebApp.platform
        })
        await userStore.checkUserExists(telegram_id);
      }
    }

    // await updateBodyTheme(); // Присваиваем тему после загрузки
    // await nextTick();  // Wait for DOM to apply changes
  

    // Получаем значение цвета из CSS-переменной
    // const rootStyles = getComputedStyle(document.body);
    // let backgroundColor = rootStyles.getPropertyValue('--background-color').trim();
    // backgroundColorValue.value = backgroundColor
    
    // Устанавливаем цвет шапки
    // window.Telegram.WebApp.setHeaderColor(backgroundColor);

    // Устанавливаем цвет фона
    // window.Telegram.WebApp.setBackgroundColor(backgroundColor);

    // window.Telegram.WebApp.themeParams.section_bg_color = backgroundColor
    // window.Telegram.WebApp.themeParams.bottom_bar_bg_color = backgroundColor

  } else {
    console.error('Telegram Web App is not available.');
  }

  updateBodyTheme(); // Присваиваем тему после загрузки
});
</script>

<style scoped lang="scss">
.user-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
}
.user-wrapper {
  padding: 15px 0;
  margin: 15px;
  border-radius: 10px;
  background-color: var(--background-component-color);
}
.user-wrapper-inner {
  display: flex;
  .user-avatar {
    margin: auto 0;
  }
  .user-data {
    margin: auto 0 auto 15px;
    p {
      font-size: 14px;
      line-height: 14px;
      margin: 0;
    }
    h5 {
      font-size: 18px;
      line-height: 18px;
      margin-bottom: 5px;
    }
  }
}
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
  // background-color: var(--background-color);
  color: var(--text-color);
  transition: background-color 0.3s ease, color 0.3s ease;
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
