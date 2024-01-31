
<template>
  <div class="custom-input-group">
    <input
      class="form-control"
      id="phone"
      name="phone"
      placeholder=""
      type="text"
      @input="phoneMask"
      autocomplete="off"
      :class="{ 'is-valid': validStatus }"
      v-model="phone"
    />
    <button @click.prevent="addInput" class="btn btn-primary btn-sm">+</button>
  </div>
</template>

<style lang="scss" scoped>
.custom-input-group {
  display: flex;
  .btn {
    margin-left: 0.5rem;
    margin-right: 0.5rem;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
    padding: 0 0.3rem;
    width: 20px;
    text-align: center;
  }
}
</style>

<script lang="ts" setup>
import { ref } from "vue";
import { useCashRegistrationStore } from "@/stores/cashes/registrationCash";

const store = useCashRegistrationStore();

const phone = ref("");
const validStatus = ref(false);

async function addInput() {
  if (validStatus.value) {
    store.phones.push(phone.value);
    phone.value = "";
    validStatus.value = false;
  }
}

async function phoneMask(e: any) {
  const inputData = e.data;

  if (inputData === " ") {
    phone.value = phone.value.slice(0, -1);
  }

  if (e.inputType === "deleteContentBackward") {
    validStatus.value = false;

    if (phone.value.length == 15) {
      phone.value = phone.value.slice(0, -1);
    }

    return false;
  }

  if (phone.value.length == 2 || phone.value.length == 4 || phone.value.length == 8 || phone.value.length == 12 || phone.value.length == 15) {
    phone.value = phone.value.slice(0, -1);
    phone.value = phone.value + ` ${inputData}`
  }

  if (phone.value.length > 16) {
    validStatus.value = true;
  }

  if (phone.value.length > 17) {
    phone.value = phone.value.slice(0, -1);
  }

  if (phone.value.length == 1 && inputData == 8) {
    phone.value = `+ 7 `;
  }

  if (isNaN(Number(inputData.slice(-1)))) {
    phone.value = phone.value.slice(0, -1);
  }

  if (phone.value.length == 1) {
    phone.value = `+ ${phone.value} `;
  }

  if (
    phone.value.length == 7 ||
    phone.value.length == 11 ||
    phone.value.length == 14
  ) {
    // phone.value = phone.value.slice(0, -1);
    phone.value = `${phone.value} `;
  }
}
</script>