<template>
  <div class="app-container">
    <div class="page-wrapper">
      <NuxtPage />
    </div>

    <!-- Панель навигации -->
    <nav class="bottom-nav">
      <NuxtLink to="/" class="nav-button">
        <i class="fas fa-home"></i> <span>Главная</span>
      </NuxtLink>
      <NuxtLink to="/modules" class="nav-button">
        <i class="fas fa-book"></i> <span>Модули</span>
      </NuxtLink>
      <NuxtLink to="/profile" class="nav-button">
        <i class="fas fa-user"></i> <span>Профиль</span>
      </NuxtLink>
    </nav>

    <!-- Уведомления -->
    <div class="app-notify">
      <NotifyComponent v-for="notification in notifications" :key="notification.id" :heading="notification.heading"
        :message="notification.message" :status="notification.status" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/userStore';
import { useThemeStore } from './stores/themeStore';
import { useNotifyStore } from './stores/notifyStore';

const router = useRouter();
const notifyStore = useNotifyStore();
const userStore = useUserStore();
const notifications = computed(() => notifyStore.notifications);

const themeStore = useThemeStore();
useHead({ title: 'BurLive' });

watch(
  () => themeStore.theme,
  () => updateTheme()
);

onBeforeMount(async () => {
  if (useCookie('token').value) {
    await userStore.fetchUser(<string>useCookie('token').value);
  }
  updateTheme();
});

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
  overflow: hidden;
  /* Отключаем прокрутку */
  font-family: "Nunito", sans-serif;
  background-color: var(--body-background-color);
}

.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  /* Высота на весь экран */
  padding: 8px;
  /* Отступы по бокам */
}

.page-wrapper {
  flex: 1;
  margin-bottom: 60px;
  /* Отступ от нижней панели */
  overflow: hidden;
  background-image: var(--background-image);
  border-radius: 12px;
}

.bottom-nav {
  display: flex;
  justify-content: space-around;
  align-items: center;
  background-color: #fff;
  padding: 8px 12px;
  border-radius: 10px;
  position: fixed;
  bottom: 16px;
  left: 8px;
  right: 8px;
  gap: 8px;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
}

.nav-button {
  display: flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  color: #333;
  font-size: 14px;
  background-color: transparent;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.2s;

  i {
    font-size: 20px;
  }

  &:hover {
    background-color: #f0f0f0;
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
}

.app-notify {
  position: fixed;
  bottom: 70px;
  /* Отступ от нижней панели */
  left: 10px;
  width: calc(100% - 20px);
}
</style>


