<template>
  <div class="custom-input-group">
    <input
      class="form-control"
      id="phone"
      name="phone"
      placeholder=""
      type="text"
      v-model="phone"
      @input="phoneMask"
      :class="{ 'is-valid': validStatus }"
    />
    <button @click.prevent="removeInput" class="btn btn-danger btn-sm">
      -
    </button>
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
input {
  &.form-control {
    padding: 0.3rem 0.5rem;
    font-size: 14px;
    margin: auto 0;
  }
}
</style>


<script lang="ts" setup>
import { ref } from "vue";
import { useCashRegistrationStore } from "@/stores/cashes/registrationCash";

const store = useCashRegistrationStore();
const props = defineProps({
  phone: String,
});
const phone = ref(props.phone);
async function removeInput() {

  if (props.phone) {
    const index = store.phones.indexOf(props.phone);
    if (index !== -1) {
      store.phones.splice(index, 1);
    }
  }

}
const validStatus = ref(true);
async function phoneMask(e: any) {
  const inputData = e.data;

  if (!phone.value) {
    return false
  }

  if (inputData === " ") {
    phone.value = phone.value.slice(0, -1);
  }

  if (e.inputType === "deleteContentBackward") {
    validStatus.value = false;
    return false;
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