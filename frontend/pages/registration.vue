<script setup lang="ts">
definePageMeta({
    middleware: [
        'authed',
    ],
});

import { storeToRefs } from "pinia"; // import storeToRefs helper hook from pinia

import { userRegisterStore } from "@/stores/auth/register";
const store = userRegisterStore()
const { registrationUser } = userRegisterStore();

const result = computed(() => store.result)

const username = storeToRefs(store).username
const email = storeToRefs(store).email
const password = storeToRefs(store).password
const passwordConfirm = storeToRefs(store).passwordConfirm

async function registration () {
  await registrationUser()
}

async function usernameCustomWatcher(symb: any) {
  try {

    // console.log(symb)

    if (symb.inputType === 'deleteContentBackward') { return false }

    if (isValidSymbol(symb.data) === false || username.value.length >= 64) { 
      username.value = username.value.slice(0, -1);
      return false 
    }

  } catch (error) {

    console.log(error)

  }
}

async function emailCustomWatcher(symb: any) {
  try {

    // console.log(symb)

    if (symb.inputType === 'deleteContentBackward') { return false }

    if (isValidSymbolForEmail(symb.data) === false || email.value.length >= 64) { 
      email.value = email.value.slice(0, -1);
      return false 
    }

  } catch (error) {

    console.log(error)

  }
}

async function passwordCustomWatcher(symb: any) {

  if (password.value.length >= 64) { 
      email.value = email.value.slice(0, -1);
      return false 
    }  

}

function isValidSymbol(symbol: string) {
  return /^[a-zA-Z0-9_-]$/.test(symbol);
}

function isValidSymbolForEmail(symbol: string) {
  return /^[a-zA-Z0-9_\-@\.]+$/.test(symbol);
}

</script>
<template>
  <div class="page registration-page">
    
    <div class="container-fluid">
      <h5>Регистрация</h5>
      <form autocomplete="off" v-on:submit.prevent="registration()">
        <!-- <div class="mb-2">
          <label for="username">Имя пользователя</label>
          <input
            type="text"
            id="username"
            name="username"
            @input="usernameCustomWatcher"
            class="form-control"
            v-model="username"
          />
        </div> -->
        <div class="mb-2">
          <label class="form-label" for="email">E-mail</label>
          <input
            type="email"
            id="email"
            name="email"
            @input="emailCustomWatcher"
            class="form-control"
            v-model="email"
          />
        </div>
        <div class="mb-2">
          <label class="form-label" for="password">Пароль</label>
          <input
            type="password"
            id="password"
            name="password"
            @input="passwordCustomWatcher"
            class="form-control"
            v-model="password"
          />
        </div>
        <div class="mb-2">
          <label class="form-label" for="password-confirm">Подтвердите пароль</label>
          <input
            type="password"
            id="password-confirm"
            name="password-confirm"
            class="form-control"
            v-model="passwordConfirm"
          />
        </div>
        <p class="small" v-if="result">{{ result }}</p>
        <input
          class="btn btn-primary mt-2"
          type="submit"
          value="Создать аккаунт"
        />
      </form>
      <p class="mt-3">
        <NuxtLink to="/auth">Уже есть аккаунт?</NuxtLink>
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
form {
  width: 400px;
}
</style>