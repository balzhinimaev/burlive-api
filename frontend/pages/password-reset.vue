<script setup>

const username = ref("");
const email = ref("");
const password = ref("");
const passwordConfirm = ref("");

async function registration () {
    try {

    } catch (error) {
        console.log(error)
    }
}

</script>
<template>
  <div class="page registration-page">
    <div class="container-fluid">
      <h5>Восстановление пароля</h5>
      <form autocomplete="off" v-on:submit.prevent="registration()">
        <div class="mb-2">
          <label for="username">Имя пользователя</label>
          <input
            type="text"
            id="username"
            name="username"
            class="form-control"
            v-model="username"
          />
        </div>
        <input
          class="btn btn-sm btn-primary mt-2"
          type="submit"
          value="Отправить"
        />
      </form>
      <p class="mt-3">
        <NuxtLink to="/auth">Войти</NuxtLink>
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
form {
  width: 300px;
}
</style>