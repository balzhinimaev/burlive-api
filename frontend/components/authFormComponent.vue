<script setup lang="ts">
import { storeToRefs } from "pinia"; // import storeToRefs helper hook from pinia
import { useAuthStore } from "@/stores/auth/login";
const { authenticateUser } = useAuthStore(); // use authenticateUser action from  auth store
const store = useAuthStore();
const username = storeToRefs(store).username
const password = storeToRefs(store).password

const message = computed(() => store.message)
const statusCode = computed(() => store.statusCode)

watch(statusCode, async () => {
  const passwordInput = document.getElementById("password")
  passwordInput?.focus()
})

async function submit() {
  await authenticateUser()
}
</script>
<template>
  <div>
    <form v-on:submit.prevent="submit()">
      <div class="mb-2">
        <label for="username">E-mail пользователя</label>
        <input
          type="text"
          id="username"
          name="username"
          class="form-control"
          autocomplete="off"
          v-model="username"
        />
      </div>
      <div class="mb-2">
        <label for="password">Пароль</label>
        <input
          type="password"
          id="password"
          name="password"
          class="form-control"
          v-model="password"
        />
      </div>
      <p class="my-0 mt-1 small"><NuxtLink to="/password-reset">Забыли пароль?</NuxtLink></p>
      <input class="btn btn-primary mt-2" type="submit" value="Войти" />
      <p class="my-3 small" v-if="message">{{ message }}</p>
    </form>

    <p class="mt-3"><NuxtLink to="/registration">Создать аккаунт</NuxtLink></p>

  </div>
</template>

<style lang="scss" scoped>
form {
  width: 300px;
}
</style>