<template>
  <div>
    <h5>Регистрационные данные</h5>
    <h6>Шаг 3 / 3</h6>
    <form @submit.prevent="save">
      <div class="mb-4">
        <label for="username" class="form-label">Логин</label>
        <input
          class="form-control"
          id="username"
          name="username"
          autocomplete="off"
          placeholder="введите имя пользователя"
          type="text"
          :class="{ 'is-invalid': store.authLoginError, 'is-valid': !store.authLoginError && authLogin.length > 0 }"
          @input="maskLogin"
          v-model="authLogin"
        />
        <div class="my-3">
          <ul class="rules">
            <li>- Минимум 5 символов</li>
            <li>- Максимум 15 символов</li>
            <li>- Логин может включать в себя буквы от A до Z (в любом регистре), цифры от 0 до 9, а также символы подчеркивания (_) и дефиса (-).</li>
          </ul>
        </div>
      </div>
      <div class="mb-4">
        <label for="password" class="form-label">Пароль</label>
        <input
          class="form-control"
          id="password"
          name="password"
          autocomplete="off"
          placeholder="придумайте пароль"
          type="password"
          v-model="authPassword"
        />
      </div>
      <div class="mb-4">
        <label for="password-confirm" class="form-label"
          >Подтверждение пароля</label
        >
        <input
          class="form-control"
          id="password-confirm"
          name="password-confirm"
          autocomplete="off"
          placeholder="подтвердите пароль"
          type="password"
          v-model="authPasswordConfirm"
        />
      </div>
      <div class="row">
        <div class="col d-flex">
          <input
            type="submit"
            class="btn btn-primary ml-auto"
            value="Сохранить"
          />
          <NuxtLink
            style="margin-left: 1rem"
            class="btn btn-primary"
            to="/dashboard/cashes/register/step-create-organization"
            >Назад</NuxtLink
          >
        </div>
      </div>
    </form>
  </div>
</template>

<script lang="ts" setup>
import { storeToRefs } from "pinia"; // import storeToRefs helper hook from pinia
import { useCashRegistrationStore } from "@/stores/cashes/registrationCash";
import { useHead } from "nuxt/app";
import { useRouter } from "nuxt/app";
useHead({
  title: "Регистрация кассы - Шаг 1",
});

const store = useCashRegistrationStore();
const authLogin = storeToRefs(store).authLogin;
const authPassword = storeToRefs(store).authPassword;
const authPasswordConfirm = storeToRefs(store).authPasswordConfirm;

const authLoginError = storeToRefs(store).authLoginError;
const authPasswordError = storeToRefs(store).authPasswordError;
const authPasswordConfirmError = storeToRefs(store).authPasswordConfirmError;

async function save() {
  try {
    console.log("create account");

    // useRouter().push('/dashboard/cashes/register/step-create-auth-data')
  } catch (error) {
    console.log(error);
  }
}

async function maskLogin(symb: any) {
  try {

    if (isValidSymbol(symb.data) === false) { 
      authLogin.value = authLogin.value.slice(0, -1);
      return false 
    }

    if (authLogin.value.length >= 5 && authLogin.value.length <= 21) {
      
      // authLogin.value = authLogin.value.slice(0, -1);
      
      authLoginError.value = false

    } else {

      authLoginError.value = true

    }

  } catch (error) {
    console.log(error)
  }
}

function isValidSymbol(symbol: string) {
  return /^[a-zA-Z0-9_-]$/.test(symbol);
}

</script>

<style lang="scss" scoped>
.rules {
  padding: 0;
  list-style-type: none;
  li {
    font-size: .8rem;
  }
}
</style>