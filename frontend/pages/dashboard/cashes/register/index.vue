<script lang="ts" setup>
import { debounce } from 'lodash'
import { storeToRefs } from "pinia"; // import storeToRefs helper hook from pinia
import { useCashRegistrationStore } from '@/stores/cashes/registrationCash';
import { ref, watch } from "vue";
import { useHead } from "nuxt/app";
import { useRouter } from "nuxt/app";
useHead({
  title: 'Регистрация кассы - Шаг 1'
})

const status = ref("")
const statusIsError = ref(false)

const store = useCashRegistrationStore()
const { registrationCash, checkOnExists, checkOnExistsPseudonym, isCodeExists } = useCashRegistrationStore()
const debouncedFunc = debounce(async (name) => {
  
  // Ваш код обращения к API
  const isExists = await checkOnExists()
  
  const status: 'success' | 'error' | any = isExists.status.value

  if (status === 'success') {

    store.cashNameError = true

  } else {
    
    store.cashNameError = false

  }

}, 500) // интервал в миллисекундах

const pseudonymWatcher = debounce(async (pseudonym) => {
  
  // Ваш код обращения к API
  const isExists = await checkOnExistsPseudonym()
  
  console.log(isExists.status.value)

  const status: 'success' | 'error' | any = isExists.status.value

  if (status === 'success') {

    store.pseudonymError = true

  } else {
    
    store.pseudonymError = false

  }

}, 500) // интервал в миллисекундах

const codeWatcher = debounce(async (cashCode) => {

  const isExists = await isCodeExists()

  const status: 'success' | 'error' | any = isExists.status.value

  if (status === 'success') {

    store.codeError = true

  } else {
    
    store.codeError = false

  }

}, 500)

const cashName = storeToRefs(store).cashName
const cashPseudonym = storeToRefs(store).pseudonym
const cashCode = storeToRefs(store).code

async function nextStep() {
  
  const cashNameIsValid = ((store.cashNameError === false) && cashName.value.length > 0)
  const cashPseudonymIsValid = ((store.pseudonymError === false) && cashPseudonym.value.length > 0)
  const cashCodeIsValid = ((store.codeError === false) && cashCode.value.length > 0)

  const cashPhone = store.phones.length > 0

  if (cashNameIsValid && cashPseudonymIsValid && cashCodeIsValid && cashPhone) {
    
    useRouter().push("/dashboard/cashes/register/step-create-organization")

  }
}

// const isExists = async function (e: any) {
//   console.log(cashName.value)
// }

watch(cashName, (name) => {
  debouncedFunc(name)
})
watch(cashPseudonym, (pseudonym) => {
  pseudonymWatcher(pseudonym)
})
watch(cashCode, (pseudonym) => {
  codeWatcher(pseudonym)
})

</script>

<template>
  <div>
    <h5>Создание кассы</h5>
    <h6>Шаг 1 / 3</h6>
    <p class="small" :class="{ 'text-danger': statusIsError }">{{ status }}</p>
    <form @submit.prevent="nextStep">
      <!-- <RegistrationInputComponent labelText="Название кассы" inputName="cashName" placeholder="Введите название кассы" /> -->
      <div class="mb-4">
        <label for="cashName" class="form-label">Название кассы</label>
        <input
          class="form-control"
          id="cashName"
          name="cashName"
          placeholder="введите название кассы"
          type="text"
          :class="{ 'is-invalid': store.cashNameError, 'is-valid': ((store.cashNameError === false) && cashName.length > 0) }"
          autocomplete="off"
          v-model="cashName"
        />
      </div>
      <div class="mb-4">
        <label for="pseudonym" class="form-label">Псевдоним</label>
        <input
          class="form-control"
          id="pseudonym"
          name="pseudonym"
          placeholder="введите псевдоним кассы"
          :class="{ 'is-invalid': store.pseudonymError, 'is-valid': ((store.pseudonymError === false) && cashPseudonym.length > 0) }"
          type="text"
          autocomplete="off"
          v-model="cashPseudonym"
        />
      </div>
      <div class="mb-4">
        <label for="code" class="form-label">Код</label>
        <input
          class="form-control"
          id="code"
          name="code"
          :class="{ 'is-invalid': store.codeError, 'is-valid': ((store.codeError === false) && cashCode.length > 0) }"
          placeholder="код кассы"
          type="text"
          v-model="cashCode"
        />
      </div>
      <div class="mb-4">
        <label for="phone" class="form-label">Телефон кассы</label>
        <RegistrationPhoneAddComponent />
        <div class="phones-added" v-if="store.phones.length">
          <RegistrationPhoneComponent
            v-for="phone in store.phones"
            :key="phone"
            :phone="phone"
          />
        </div>
        <!-- <input class="mt-3 form-control" id="phone" name="phone" placeholder="" type="text"> -->
      </div>
      <div class="row">
        <div class="col d-flex">
          <input type="submit" class="btn btn-primary ml-auto" value="Далее" />
        </div>
      </div>
    </form>
  </div>
</template>

<style lang="scss" scoped>
.phones-added {
    margin-top: 1rem;
    .custom-input-group {
        margin-bottom: 1rem;
        &:last-child {
            margin-bottom: 0;
        }
    }
}

.is-invalid {
  color: #e2232b;
}

// .is-valid {
//   color: #35a671;
// }
</style>

