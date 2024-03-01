<template>
  <nav>
    <h4>BurLive</h4>
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
    <div class="userdata">
      <NuxtLink class="to-dashboard" to="/dashboard">
        <h6>{{ user.firstName ? user.firstName : user.username }}</h6>
      </NuxtLink>
    </div>
  </nav>
</template>

<script lang="ts" setup>
const user = ref("");
onBeforeMount(() => {
  const { data, pending, error } = useFetch(
    () => `http://localhost:5555/api/users/getMe`,
    {
      method: "get",
      headers: {
        Authorization: `Bearer ${useCookie("token").value}`,
        "Content-Type": "application/json", // Укажите тип контента, если это необходимо,
      },
      onResponse({ request, response, options }) {
        // Process the response data
        user.value = response._data.user;
      },
    }
  );
});
</script>

<style lang="scss" scoped>
nav {
  display: flex;
  margin-bottom: 1rem;
  ul {
    margin: auto 0 auto auto;
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