<template>
  <nav>
    <div class="logotype">
      <h4 class="title">
        <NuxtLink to="/">BurLive</NuxtLink>
      </h4>
      <div class="description">
        <p>Изучение бурятского</p>
      </div>
    </div>
    <div class="menu-wrapper">
      <div class="menu-content">
        <div class="theme-switcher">
          <button
            class="btn btn-sm"
            :class="{ active: themeStore.isLightTheme }"
            @click="setTheme('light')"
          >
            <i class="bi bi-sun"></i>
          </button>
          <button
            class="btn btn-sm"
            :class="{ active: !themeStore.isLightTheme }"
            @click="setTheme('dark')"
          >
            <i class="bi bi-moon"></i>
          </button>
        </div>
        <ul class="menu">
          <li>
            <NuxtLink to="/">Главная</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/users">Пользователи</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/sentences">Предложения</NuxtLink>
          </li>
          <!-- <li>
        <NuxtLink to="/dialogs">Диалоги</NuxtLink>
      </li> -->
        </ul>
        <div class="userdata" v-if="token">
          <div v-if="user.isLoading">
            <p>Загрузка</p>
          </div>
          <div v-else-if="user.firstName">
            <NuxtLink class="to-dashboard" to="/dashboard">
              <h6>{{ user.firstName }}</h6>
            </NuxtLink>
          </div>
        </div>
        <div v-else class="my-auto auth">
          <p class="mb-0">
            <NuxtLink to="/auth">Вход</NuxtLink>
          </p>
        </div>
      </div>
    </div>
  </nav>
</template>

<script lang="ts" setup>
import { useUserStore } from "@/stores/userStore";
import { useThemeStore } from "@/stores/themeStore"; // Импортируем наше новое хранилище

const userStore = useUserStore();
const themeStore = useThemeStore(); // Используем хранилище темы

const token = ref(useCookie("token").value);

onMounted(() => {
  userStore.fetchUser();
});

const user = computed(() => userStore.user); // Реактивное свойство для доступа к пользователю

// Функция для смены темы через хранилище
const setTheme = (theme: string) => {
  themeStore.setTheme(theme);
};
</script>

<style lang="scss" scoped>
.logotype {
  h4, p {
    margin-bottom: 0;
  }
}
.menu-wrapper {
  display: flex;
  margin: auto 0 auto auto;
  position: relative;
}
.menu-content {
  display: flex;
  margin: auto 0 auto auto;
  position: relative;
}
@media screen and (max-width: 768px) {
  .menu-wrapper {
    position: inherit;
  }
  .menu-content {
    position: absolute;
    background-color: #fff;
    padding: 1rem;
    font-size: 1.5rem;
    top: 0;
    left: 0;
    flex-direction: column;
    width: 100%;
    // background-color: #ccc;
    .menu {
      flex-direction: column;
    }
  }
}
.auth {
  margin-left: 1rem;
}
.theme-switcher {
  margin: auto 0 auto auto;
  background-color: var(--notify-background-color);
  display: flex;
  border-radius: 1rem;
  transition: 400ms;
}
.btn-sm {
  border-radius: 1rem;
  font-size: 12px;
  padding: 2px 5px;
  display: block;
  margin: auto 0;
  border: 0;
  transition: 400ms;
  &.active {
    background-color: var(--bs-body-color);
    color: var(--body-background-color);
  }
}
nav {
  display: flex;
  margin-bottom: 1rem;
  ul {
    margin: auto 0 auto 1rem;
    padding: 0;
    list-style-type: none;
    li {
      a {
        text-decoration: none;
      }
    }
  }
}

.userdata {
  margin: auto 15px;
  h6 {
    margin: 0;
  }
}

.menu {
  display: flex;
  li {
    margin: 0 0.5rem;
  }
}

.to-dashboard {
  text-decoration: none;
}
</style>
