<template>
  <div>
    <h5>Добавление организации</h5>
    <h6>Шаг 2 / 3</h6>
    <form @submit.prevent="nextStep">
      <div class="mb-4">
        <label for="organization-name" class="form-label"
          >Название организации</label
        >
        <input
          class="form-control"
          id="organization-name"
          name="organization-name"
          autocomplete="off"
          :class="{ 'is-invalid': store.organizationNameError, 'is-valid': ((store.organizationNameError === false) && name.length > 0) }"
          placeholder="введите название организации"
          type="text"
          v-model="name"
        />
      </div>
      <div class="mb-4">
        <label for="inn" class="form-label">ИНН</label>
        <input
          class="form-control"
          id="inn"
          name="inn"
          placeholder="ИНН"
          :class="{ 'is-invalid': store.organizationINNError, 'is-valid': ((store.organizationINNError === false) && inn.length > 0) }"
          autocomplete="off"
          type="text"
          v-model="inn"
        />
      </div>
      <div class="mb-4">
        <label for="ogrn" class="form-label">ОГРН</label>
        <input
          class="form-control"
          id="ogrn"
          name="ogrn"
          :class="{ 'is-invalid': store.organizationOGRNError, 'is-valid': ((store.organizationOGRNError === false) && ogrn.length > 0) }"
          placeholder="огрн"
          autocomplete="off"
          type="text"
          v-model="ogrn"
        />
      </div>
      <div class="row">
        <div class="col d-flex">
          <input type="submit" class="btn btn-primary ml-auto" value="Далее" />
          <NuxtLink
            style="margin-left: 1rem"
            class="btn btn-primary"
            to="/dashboard/cashes/register"
            >Назад</NuxtLink
          >
        </div>
      </div>
    </form>
  </div>
</template>

<script lang="ts" setup>
import { storeToRefs } from "pinia"; // import storeToRefs helper hook from pinia
import { useCashRegistrationStore } from "../../../../store/dashboard/cashes/registrationCash";
import { useHead } from "nuxt/app";
import { useRouter } from "nuxt/app";
import { ref, watch } from "vue";
import { debounce } from 'lodash'
useHead({
  title: "Регистрация кассы - Шаг 1",
});

const store = useCashRegistrationStore();

const { isNameExists, isINNExists, isOGRNExists, organizationNameError, organizationINNError, organizationOGRNError } = useCashRegistrationStore()

const name = storeToRefs(store).organizationName;
const inn = storeToRefs(store).organizationINN;
const ogrn = storeToRefs(store).organizationOGRN;

async function save() {
  try {

    useRouter().push('/dashboard/cashes/register/step-create-auth-data')

  } catch (error) {
    console.log(error);
  }
}

async function nextStep() {
  try {

    const organizationNameIsValid = ((store.organizationNameError === false) && name.value.length > 0)
    const organizationInnIsValid = ((store.organizationINNError === false) && inn.value.length > 0)
    const organizationOgrnIsValid = ((store.organizationOGRNError === false) && ogrn.value.length > 0)

    if (organizationNameIsValid && organizationInnIsValid && organizationOgrnIsValid) {
      useRouter().push("/dashboard/cashes/register/step-create-auth-data")
    } else {
      console.log(organizationOgrnIsValid)
      console.log(organizationNameIsValid)
      console.log(organizationInnIsValid)
    }

  } catch (error) {
    console.log(error)
  }
}

watch(name, (name) => {
  debouncedFunc(name)
})
watch(inn, (inn) => {
  debouncedFunc2(inn)
})
watch(ogrn, (ogrn) => {
  debouncedFunc3(ogrn)
})

const debouncedFunc = debounce(async (name) => {
  
  // Ваш код обращения к API
  const isExists = await isNameExists()
  
  const status: 'success' | 'error' | any = isExists.status.value

  if (status === 'success') {

    store.organizationNameError = true

  } else {
    
    store.organizationNameError = false

  }

}, 500) // интервал в миллисекундах
const debouncedFunc2 = debounce(async (name) => {
  
  // Ваш код обращения к API
  const isExists = await isINNExists()
  
  const status: 'success' | 'error' | any = isExists.status.value

  if (status === 'success') {

    store.organizationINNError = true

  } else {
    
    store.organizationINNError = false

  }

}, 500) // интервал в миллисекундах
const debouncedFunc3 = debounce(async (name) => {
  
  // Ваш код обращения к API
  const isExists = await isOGRNExists()
  
  const status: 'success' | 'error' | any = isExists.status.value

  if (status === 'success') {

    store.organizationOGRNError = true

  } else {
    
    store.organizationOGRNError = false

  }

}, 500) // интервал в миллисекундах

</script>