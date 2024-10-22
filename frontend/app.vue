<template>
  <div class="app-container">
    <div class="page-wrapper">
      <NuxtPage />
    </div>

    <!-- Панель навигации -->
    <BottomNav />

    <!-- Уведомления -->
    <div class="app-notify">
      <NotifyComponent v-for="notification in notifications" :key="notification.id" :heading="notification.heading"
        :message="notification.message" :status="notification.status" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router';
import { useUserStore } from './stores/userStore';
import { useThemeStore } from './stores/themeStore';
import { useNotifyStore } from './stores/notifyStore';

const router = useRouter();
const notifyStore = useNotifyStore();
const userStore = useUserStore();
const notifications = computed(() => notifyStore.notifications);
const themeStore = useThemeStore();

onMounted(async () => {
  await themeStore.initializeUser(); // Инициализируем пользователя при старте приложения
});
useHead({ title: 'BurLive' });

watch(
  () => themeStore.theme,
  () => updateTheme()
);

function updateTheme() {
  const theme = themeStore.theme || 'light';
  document.body.setAttribute('data-bs-theme', theme);
}

function goTo(route: string) {
  router.push({ name: route });
}
</script>

<style lang="scss" scoped>
html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
  // overflow: hidden;
  // /* Отключаем прокрутку */
  font-family: "Nunito", sans-serif;
  background-color: var(--body-background-color);
}

.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  /* Высота на весь экран */
  padding: 0;
  // background-image: linear-gradient(45deg, #2ff59b, #f28dff);
  /* Отступы по бокам */
}

.page-wrapper {
  flex: 1;
  margin-bottom: 60px;
  /* Отступ от нижней панели */
  // overflow: hidden;
  padding-top: 20px;
  padding-left: 8px;
  padding-right: 8px;
}

.app-notify {
  position: fixed;
  bottom: 70px;
  /* Отступ от нижней панели */
  left: 10px;
  width: calc(100% - 20px);
}
</style>


