<template>
  <nav>
    <h4>BurLive</h4>
    <div class="theme-switcher">
      <button class="btn btn-sm"><i class="bi bi-sun"></i></button>
      <button class="btn btn-sm active"><i class="bi bi-moon"></i></button>
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
        <p>Загрузка </p>
      </div>
      <NuxtLink class="to-dashboard" to="/dashboard">
        <h6>{{ user.firstName }}</h6>
      </NuxtLink>
    </div>
    <div v-else>
      <p>Вход</p>
    </div>
  </nav>
</template>

<script lang="ts" setup>
import { useUserStore } from '@/stores/userStore';
const userStore = useUserStore();
const token = ref(useCookie("token").value)
onMounted(() => {
  userStore.fetchUser();
})
const user = computed(() => userStore.user); // Реактивное свойство для доступа к пользователю
</script>



<style lang="scss" scoped>
.theme-switcher {
  margin: auto 0 auto auto;
  background-color: #222;
  display: flex;
  border-radius: 1rem;
}
.btn-sm {
  border-radius: 1rem;
  font-size: 12px;
  padding: 2px 5px;
  display: block;
  margin: auto 0;
  border: 0;
  &.active {
    background-color: #111;
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
